// @ts-check
/**
 * cosmos/web.js — THE NEURAL COSMOS (wave 7, lane COSMOS; the director's decision 4, after Alberto: «puoi fare molto di
 * meglio come sfondo. reti neurali, o spazio, qualcosa di super realistico e wow»). The backdrop of every room: the
 * large-scale structure of the universe, the cosmic web, whose filaments and nodes read like a neural network. Galaxies
 * are points of light strung along filaments between dense bright nodes; the voids are nearly empty; a faint field of
 * distant stars lies beyond. The field draws it (stage/field/: field.js packs it, field.wgsl.js vsCosmos / fsCosmos).
 *
 * ONE COSMOS, SEEDED ONCE. makeWeb() is pure: the same arrays on every page, every visit, every viewport. It is a
 * periodic box, as a cosmological simulation's is: BOX lens distances (D) a side, wrapped about a window ahead of the eye,
 * so the eye can travel anywhere in it and never sees a point twice (the window is wider than the frame at the fog's
 * end). Every room is a place in it (placeOf): the home's scroll is one journey through it; a flight between pages
 * travels through it (the eye's own dolly) and the new room takes the stage at its own place behind the door's cover.
 *
 *   makeWeb() -> { data, nGal, nStar, fil, nFil, rib, node, nNode, ms }
 *     data   Uint32Array, 4 words a point (a WGSL vec4u): x, y, z as f32 bits (a galaxy: in the unit box; a star: a unit
 *            direction, at infinity) and its meta (META: luminosity, kind, element, place along a filament). The nodes'
 *            brightest galaxies first, then the galaxies in random order (any prefix is a fair sample: the tiers draw
 *            a prefix), then the stars from index nGal.
 *     fil    Float32Array, FIL words a filament: p0 (a node), p1 (the curve's control point), p2 (the other node, the
 *            box image nearest the first), in box units; its two nodes; its sigma (box units)
 *     rib    Float32Array, 12 words a filament for the GPU (its own light, the gas along it: field.wgsl.js vsRibbon):
 *            p0, its richness; the control point, its sigma; p2, its length (box units)
 *     node   Float32Array, 4 words a node: x, y, z (box units), mass
 *   placeOf(j, side) -> [x, y, z]   the place in D of the journey's distance j (D): a gentle curve, forward is -z
 *   journeyOf(c) -> { j, side }     a page's journey from what the host sends (stage.set({ cosmos }), fx-stage.js)
 */

/** the box's side in lens distances (D = clamp(1.25 x the viewport's diagonal, 1100, 2600) px at lens 1) */
export const BOX = 8;
/** the meta word: luminosity (8 bits, log), kind (2), element (10), place along a filament (12) */
export const META = Object.freeze({ lumBits: 8, kindShift: 8, elShift: 10, tShift: 20, tMax: 4095 });
/** the luminosity range a galaxy's meta encodes (1 .. LMAX, log2 coded); a star's (1 .. SMAX) */
export const LMAX = 48, SMAX = 80;
/** kinds of point */
export const KIND = Object.freeze({ field: 0, node: 1, fil: 2, star: 3 });
/** words a filament */
export const FIL = 12;

/** how many points: tier A's (the field draws a prefix: TIER_COSMOS). (run 3) 300 nodes, not 190: a frame at rest
 *  holds four or five lit knots and a score of faint ones, a web rather than a few strands. (run 5) 560: at 300 a
 *  frame held a dozen strands, a sparse net; now a lace of threads at every depth, the near ones long, the far fine */
const N_NODE = 560, N_GAL = 120000, N_STAR = 5600;
/** galaxies by kind (the rest in the voids' sparse field) */
const F_NODE = 0.26, F_FIL = 0.66;

/** mulberry32: a small fast seeded generator @param {number} a */
function rng(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const wrap = (/** @type {number} */ x) => x - Math.floor(x);
/** the periodic difference a - b, in (-0.5, 0.5] @param {number} a @param {number} b */
const pdx = (a, b) => { const d = a - b; return d - Math.round(d); };

/** the default seed: one cosmos */
export const SEED = 0x5e75a1;

/**
 * The web, at once (a test, a bench). Pure (one seed): the same arrays everywhere.
 * @param {number} [seed]
 */
export function makeWeb(seed = SEED) {
  const g = build(seed);
  let r = g.next();
  while (!r.done) r = g.next();
  return r.value;
}

/**
 * The web across a few tasks (no long task on a page's start: about 4 ms a slice), the same arrays as makeWeb.
 * @param {number} [seed]
 */
export async function makeWebAsync(seed = SEED) {
  const g = build(seed);
  let r = g.next();
  while (!r.done) { await new Promise((ok) => setTimeout(ok, 0)); r = g.next(); }
  return r.value;
}

/** the gaussian table: normals by Box-Muller once (a draw is a lookup: no log, root or cosine per galaxy) */
const GT = 16384;

/** @param {number} seed */
function* build(seed) {
  const t0 = typeof performance !== "undefined" ? performance.now() : 0;
  const R = rng(seed);
  const GN = new Float32Array(GT);
  for (let i = 0; i < GT; i += 2) {
    const u = Math.max(1e-12, R()), v = 6.283185307 * R(), m = Math.sqrt(-2 * Math.log(u));
    GN[i] = m * Math.cos(v); GN[i + 1] = m * Math.sin(v);
  }
  /** a standard normal (a table lookup) */
  const gauss = () => GN[(R() * GT) | 0];

  // ------------------------------------------------ the nodes: clusters and groups, gathered in superclusters
  // (about seven in ten round a few superclusters, the rest anywhere), never closer than DMIN to one another
  const SC = Array.from({ length: 16 }, () => [R(), R(), R(), 0.06 + 0.06 * R()]);
  const node = new Float32Array(N_NODE * 4);
  const DMIN = 0.034;
  let nn = 0;
  for (let tries = 0; nn < N_NODE && tries < N_NODE * 60; tries++) {
    let x, y, z, boost = 1;
    if (R() < 0.7) { const s = SC[Math.floor(R() * SC.length)]; x = wrap(s[0] + gauss() * s[3]); y = wrap(s[1] + gauss() * s[3]); z = wrap(s[2] + gauss() * s[3]); boost = 1.35; }
    else { x = R(); y = R(); z = R(); }
    let ok = true;
    for (let k = 0; k < nn && ok; k++) {
      const dx = pdx(x, node[k * 4]), dy = pdx(y, node[k * 4 + 1]), dz = pdx(z, node[k * 4 + 2]);
      if (dx * dx + dy * dy + dz * dz < DMIN * DMIN) ok = false;
    }
    if (!ok) continue;
    // a few massive clusters, many small groups (a Pareto tail)
    const m = Math.min(30, Math.pow(1 - R() * 0.995, -1 / 1.1)) * boost;
    node.set([x, y, z, m], nn * 4); nn++;
  }

  yield 0;
  // ------------------------------------------------ the filaments: the relative-neighbourhood graph of the nodes (an
  // edge a-b stays when no third node is nearer to both than they are to each other): a sparse connected web of chains
  // and branches, few crossings, the skeleton of the cosmic web and the look of a neural net
  const dist = new Float32Array(nn * nn);
  for (let a = 0; a < nn; a++) for (let b = a + 1; b < nn; b++) {
    const dx = pdx(node[a * 4], node[b * 4]), dy = pdx(node[a * 4 + 1], node[b * 4 + 1]), dz = pdx(node[a * 4 + 2], node[b * 4 + 2]);
    dist[a * nn + b] = dist[b * nn + a] = Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  const RMAX = 0.138;
  /** @type {number[][]} */ const edges = [];
  const deg = new Uint8Array(nn), linked = new Set();
  for (let a = 0; a < nn; a++) for (let b = a + 1; b < nn; b++) {
    // (run 5) a slice every 96 nodes: no long task while the page starts
    if (b === a + 1 && a % 96 === 95) yield a;
    const dab = dist[a * nn + b];
    if (dab > RMAX) continue;
    let ok = true;
    for (let c = 0; c < nn && ok; c++) { if (c === a || c === b) continue; if (Math.max(dist[a * nn + c], dist[b * nn + c]) < dab) ok = false; }
    if (ok) { edges.push([a, b, dab]); deg[a]++; deg[b]++; linked.add(a * 4096 + b); }
  }
  // the hubs: a massive node reaches further (a soma with more dendrites): its nearest nodes it is not yet joined to,
  // up to five filaments in all, never across a node that stands between them (a Gabriel test)
  for (let a = 0; a < nn; a++) {
    if (node[a * 4 + 3] < 6) continue;
    const near = [];
    for (let b = 0; b < nn; b++) if (b !== a && dist[a * nn + b] < RMAX * 1.15) near.push(b);
    near.sort((x, y) => dist[a * nn + x] - dist[a * nn + y]);
    for (const b of near) {
      if (deg[a] >= 5) break;
      const key = Math.min(a, b) * 4096 + Math.max(a, b);
      if (linked.has(key) || deg[b] >= 6) continue;
      const dab = dist[a * nn + b];
      let ok = true;
      for (let c = 0; c < nn && ok; c++) { if (c === a || c === b) continue; if (dist[a * nn + c] ** 2 + dist[b * nn + c] ** 2 < dab * dab) ok = false; }
      if (!ok) continue;
      edges.push([Math.min(a, b), Math.max(a, b), dab]); deg[a]++; deg[b]++; linked.add(key);
    }
  }
  yield 0;
  const nFil = Math.min(1023, edges.length);
  const fil = new Float32Array(nFil * FIL);
  const rib = new Float32Array(nFil * 12);
  const filW = new Float64Array(nFil);
  for (let f = 0; f < nFil; f++) {
    const [a, b, len] = edges[f];
    const ax = node[a * 4], ay = node[a * 4 + 1], az = node[a * 4 + 2];
    // the other end as the box image nearest the first (a filament may cross the box's face: it stays whole)
    const bx = ax + pdx(node[b * 4], ax), by = ay + pdx(node[b * 4 + 1], ay), bz = az + pdx(node[b * 4 + 2], az);
    // a gentle curve: the control point off the middle, at right angles to the chord, by a share of its length
    const ux = (bx - ax) / len, uy = (by - ay) / len, uz = (bz - az) / len;
    let qx = gauss(), qy = gauss(), qz = gauss();
    const k = qx * ux + qy * uy + qz * uz; qx -= k * ux; qy -= k * uy; qz -= k * uz;
    // (run 5) a gentler bend (was 0.06 + 0.16): a strongly bent thread on screen read as the arc of a ring
    const ql = Math.hypot(qx, qy, qz) || 1, bend = (0.03 + 0.08 * R()) * len;
    const cx = (ax + bx) / 2 + (qx / ql) * bend, cy = (ay + by) / 2 + (qy / ql) * bend, cz = (az + bz) / 2 + (qz / ql) * bend;
    // richer between massive nodes; thinner and fainter when long
    const ma = node[a * 4 + 3], mb = node[b * 4 + 3];
    const rich = Math.pow(ma * mb, 0.3) / Math.pow(len / 0.12, 0.35);
    const sig = 0.00055 + 0.00075 * Math.min(2.2, rich) * (0.7 + 0.6 * R());
    fil.set([ax, ay, az, a, cx, cy, cz, b, bx, by, bz, sig], f * FIL);
    rib.set([ax, ay, az, Math.min(3, rich), cx, cy, cz, sig, bx, by, bz, len], f * 12);
    filW[f] = len * (0.35 + Math.min(3, rich));
  }

  // ------------------------------------------------ the galaxies
  const nGal = N_NODE + N_GAL;
  const N = nGal + N_STAR;
  const data = new Uint32Array(N * 4);
  const f32 = new Float32Array(data.buffer);
  const cdf = (/** @type {Float64Array} */ w) => { const c = new Float64Array(w.length); let s = 0; for (let i = 0; i < w.length; i++) { s += w[i]; c[i] = s; } for (let i = 0; i < w.length; i++) c[i] /= s; return c; };
  const pick = (/** @type {Float64Array} */ c, /** @type {number} */ u) => { let lo = 0, hi = c.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (c[m] < u) lo = m + 1; else hi = m; } return lo; };
  const nodeW = new Float64Array(nn);
  for (let i = 0; i < nn; i++) nodeW[i] = Math.pow(node[i * 4 + 3], 0.95);
  const nodeC = cdf(nodeW), filC = cdf(filW);
  const RV = new Float32Array(nn);
  for (let i = 0; i < nn; i++) RV[i] = 0.0048 * Math.cbrt(node[i * 4 + 3]);
  const L2 = Math.log2(LMAX), S2 = Math.log2(SMAX);
  // a galaxy's luminosity 1 .. LMAX, a power law (few bright, many faint), as its 8-bit log code: a table of the inverse
  // distribution (no power or logarithm per galaxy); a multiplier k adds log2(k) to the code
  const LT = 4096, LC = new Float32Array(LT);
  for (let i = 0; i < LT; i++) LC[i] = (-Math.log2(1 - ((i + 0.5) / LT) * 0.9995) / 1.25 / L2) * 255;
  const lumCode = (/** @type {number} */ k = 0) => Math.max(0, Math.min(255, Math.round(LC[(R() * LT) | 0] + k)));
  const kc = (/** @type {number} */ k) => (Math.log2(k) / L2) * 255;
  const K09 = kc(0.9), K07 = kc(0.7);
  const meta = (/** @type {number} */ code, /** @type {number} */ kind, /** @type {number} */ el, /** @type {number} */ t) =>
    (code | (kind << META.kindShift) | ((el & 1023) << META.elShift) | (Math.round(Math.max(0, Math.min(1, t)) * META.tMax) << META.tShift)) >>> 0;
  const codeOf = (/** @type {number} */ lum) => Math.max(0, Math.min(255, Math.round((Math.log2(Math.max(1, lum)) / L2) * 255)));
  /** @param {number} i @param {number} x @param {number} y @param {number} z @param {number} m */
  const put = (i, x, y, z, m) => { f32[i * 4] = wrap(x); f32[i * 4 + 1] = wrap(y); f32[i * 4 + 2] = wrap(z); data[i * 4 + 3] = m; };
  // the nodes' own brightest galaxies first: every tier draws them
  for (let i = 0; i < N_NODE; i++) {
    const n = i % nn;
    put(i, node[n * 4] + gauss() * 0.0004, node[n * 4 + 1] + gauss() * 0.0004, node[n * 4 + 2] + gauss() * 0.0004, meta(codeOf(10 + 3.2 * node[n * 4 + 3]), KIND.node, n, 0));
  }
  for (let i = N_NODE; i < nGal; i++) {
    if ((i & 16383) === 0) yield i;
    const r = R();
    if (r < F_NODE) {
      // a member of a node: a cuspy profile about it (most within a third of its radius), its radius as the mass's cube root
      const n = pick(nodeC, R());
      const rv = RV[n], x = Math.min(1.6, -Math.log(1 - R() * 0.985) * 0.22);
      let dx = gauss(), dy = gauss(), dz = gauss();
      const l = Math.hypot(dx, dy, dz) || 1, s = (rv * x) / l;
      dx *= s; dy *= s; dz *= s;
      put(i, node[n * 4] + dx, node[n * 4 + 1] + dy, node[n * 4 + 2] + dz, meta(lumCode(kc(1 + 0.6 * Math.max(0, 1 - x))), KIND.node, n, Math.min(1, x / 1.6)));
    } else if (r < F_NODE + F_FIL) {
      // along a filament: more of them near its nodes (matter flows to them), a gaussian section, thicker by the nodes
      const f = pick(filC, R()), b = f * FIL;
      const u = R(), t = 0.5 + 0.5 * Math.sign(u - 0.5) * Math.pow(Math.abs(2 * u - 1), 0.72);
      const s = 1 - t;
      const px = fil[b] * s * s + fil[b + 4] * 2 * s * t + fil[b + 8] * t * t;
      const py = fil[b + 1] * s * s + fil[b + 5] * 2 * s * t + fil[b + 9] * t * t;
      const pz = fil[b + 2] * s * s + fil[b + 6] * 2 * s * t + fil[b + 10] * t * t;
      const sig = fil[b + 11] * (1 + 0.8 * Math.pow(Math.abs(2 * t - 1), 3));
      put(i, px + gauss() * sig, py + gauss() * sig, pz + gauss() * sig, meta(lumCode(K09), KIND.fil, f, t));
    } else {
      // the voids: a sparse faint field
      put(i, R(), R(), R(), meta(lumCode(K07), KIND.field, 0, 0));
    }
  }
  // ------------------------------------------------ the stars: directions (at infinity: no parallax), many faint
  for (let i = nGal; i < N; i++) {
    const z = 2 * R() - 1, a = 6.283185307 * R(), rr = Math.sqrt(Math.max(0, 1 - z * z));
    f32[i * 4] = rr * Math.cos(a); f32[i * 4 + 1] = rr * Math.sin(a); f32[i * 4 + 2] = z;
    const lum = Math.min(SMAX, Math.pow(1 - R() * 0.9999, -1 / 1.05));
    data[i * 4 + 3] = (Math.max(0, Math.min(255, Math.round((Math.log2(lum) / S2) * 255))) | (KIND.star << META.kindShift)) >>> 0;
  }
  const ms = typeof performance !== "undefined" ? performance.now() - t0 : 0;
  return { data, nGal, nStar: N_STAR, fil, nFil, rib, node: node.subarray(0, nn * 4), nNode: nn, ms };
}

/* ================================================================ THE JOURNEY: every room is a place in the cosmos */

/** the journey's distance (D) where each page's place begins, in the menu's order; SPAN: how far its own scroll carries
 *  the eye (to the next page's place). The home runs through its parts (section.part[data-part]) in the same order. */
const BASE = /** @type {Record<string, number>} */ ({ home: 0, work: 3, about: 11, consult: 19, obla: 24, contact: 29 });
const SPAN = /** @type {Record<string, number>} */ ({ home: 3, work: 8, about: 8, consult: 5, obla: 5, contact: 0 });

/** a small hash of a string to [0, 1) @param {string} s @param {number} k */
function hs(s, k) {
  let h = 0x811c9dc5 ^ k;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

/**
 * The place (D, unwrapped) of the journey's distance j: forward is -z, with a slow curve aside and up (so the home's
 * long scroll never runs straight down one line of the box). side: a lateral step (D; a case is a room off Work's way).
 * @param {number} j @param {number} [side]
 */
export function placeOf(j, side = 0) {
  // (run 5) a slow drift aside and down as well (0.29 and 0.17 D a D): the pages' places were whole boxes apart along z
  // (Work, About and Consulting begin 8 D apart = one box), the same web seen again; now each stands in its own place
  return [0.9 * Math.sin(0.21 * j + 0.7) + 0.29 * j + side + 3.1, 0.55 * Math.sin(0.13 * j + 1.9) - 0.17 * j - 1.7, -j + 0.6];
}

/**
 * A page's journey from what its host sends each frame: { key: html[data-page], slug: a case's, y: the scroll, vh, max:
 * the largest scroll, parts: [{ key, top }] the home's parts (document px) }.
 * @param {any} c
 * @returns {{ j: number, side: number }}
 */
export function journeyOf(c) {
  if (!c || typeof c !== "object") return { j: 0, side: 0 };
  const key = String(c.key || "home"), y = Math.max(0, +c.y || 0), max = Math.max(1, +c.max || 1);
  if (key === "case") {
    // a case: a room off Work's way, its own place by its name (to the left or right of the corridor)
    const slug = String(c.slug || "case");
    const j = BASE.work + 1 + 6 * hs(slug, 1) + 1.6 * Math.min(1, y / max);
    return { j, side: (hs(slug, 2) < 0.5 ? -1 : 1) * (2.4 + 1.6 * hs(slug, 3)) };
  }
  if (key === "home" && Array.isArray(c.parts) && c.parts.length) {
    // the home: the cover's screens to the first part, then each part from its top to the next one's
    const stops = [{ key: "home", top: 0 }, ...c.parts.filter((/** @type {any} */ p) => p && p.key in BASE && isFinite(p.top))];
    for (let i = stops.length - 1; i >= 0; i--) {
      const s = stops[i];
      if (y < s.top && i > 0) continue;
      const next = stops[i + 1];
      const j0 = BASE[s.key] ?? 0, j1 = next ? (BASE[next.key] ?? j0) : j0 + (SPAN[s.key] ?? 0);
      const y1 = next ? next.top : Math.max(s.top + 1, max);
      return { j: j0 + (j1 - j0) * Math.max(0, Math.min(1, (y - s.top) / Math.max(1, y1 - s.top))), side: 0 };
    }
  }
  const j0 = BASE[key] ?? 0;
  return { j: j0 + (SPAN[key] ?? 0) * Math.max(0, Math.min(1, y / max)), side: 0 };
}
