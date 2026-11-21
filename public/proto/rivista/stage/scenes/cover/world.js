// @ts-check
/**
 * scenes/cover/world.js — the cover's world, version 2 (round 11, lane HERO2): a dark hall seen by a moving camera.
 *
 * (wave 7, lane COSMOS) THE HALL OPENS ONTO THE COSMOS: the back wall's grid is gone (Alberto: «non mi piace lo sfondo a
 * griglia»); behind the hall's back plane the neural cosmos of every room (stage/cosmos/web.js); the blades and the
 * name's light no longer fall on a wall (no shafts): the chips catch them. Where the text below says wall or shafts,
 * this replaced it.
 *
 * VERSION 3, "THE LIT HALL" (round 12, lane COVER3; notes in docs/redesign/rivista-story/build/s-cover3.md): the room
 * is lit and you can see it. A wide lens (0.62) close to the name, the eye to the left and below it (a block seen from
 * below: six receding outlines in cobalt); the back wall's grid lit by the name's own light and two blades that travel
 * across it on the stage's clock (their haze is the shafts: the dust columns are gone); chips cut as the A and the
 * SerSan mark at every depth, each with its own edge light, none over the name (the field's `clear`); two large plates
 * flanking the name, cut by the frame; the eye drifts on an arc while awake and the hand orbits it by up to 0.30 rad.
 * Where the text below still says "shafts of dust", "three plates" or "a drift", version 3 replaced it.
 *
 * THE NAME. ALBERTO TUVERI stands in the hall as a volume of light: a crisp front face (the glyphs filled evenly with
 * points, saturated to white, and a dense run of points on their outline, so the silhouette is sharp), and behind it
 * eight contour layers through 0.7 em, softer and bluer toward the back. Straight on it is one clean bright name; off
 * axis the layers slide against one another as a deep block of light. The name is laid out here (one line on a desktop,
 * two on a phone); the page's h1 is read only for its text, face, weight and tracking (it stays the accessible name and
 * the printed states' name, and is never shown as flat type while the stage is expected: css/page-cover.css).
 *   Why exposure and not more points: the stage gives a formation's particles their targets by an even sequence that is
 *   not one-to-one (as many targets as particles: about a fifth get none, a fifth get two). An even target set alone
 *   still draws a mottled face; a face exposed well past white cannot show a missing or doubled point, and the contour
 *   layers use a larger, softer disc so that many points fall under each one.
 *
 * THE HALL. Three broad shafts of light fall from high out of frame, cross behind and through the name and fade into
 * the dark at both ends: each a slab of fine points (the dust that makes light visible), soft at its sides, brightest
 * where it crosses the name's plane, turning a few degrees on the stage's clock. Four plates of cut glass hold real
 * captures of his work at several depths behind the name (now four, the fifth is Now's sersan.io plate, now.js): lit
 * windows at night, small and dimmed by the fog at rest, two of them passed close by the flight. No floor, no horizon.
 *
 * THE SHOT (coverCamera, shared by hero.js and now.js so the host's blend of the two scenes is one pose):
 *   opening  close, low and oblique at the first letter, looking down the line of the name; the letters ignite one
 *            after another (hero.js drives the reveal) while the camera arcs about 43 degrees toward the front and pulls
 *            back to the rest pose (2.9 s, eased slow out and slow in);
 *   rest     about 14 degrees off axis and a little above, a slow drift on the stage's clock; the pointer orbits the eye
 *            by up to 0.16 rad of yaw and 0.08 of pitch, with weight;
 *   flight   the scroll straightens the camera and flies it through the gap between the two words (on a phone, between
 *            the lines), past two lit plates, banking a little, onto Now's plate: the last pose is the page's own
 *            straight view, so Now and the index take over without a seam.
 *
 * SPACE. The stage's free-camera space: x, y viewport css px (the hall is fixed to the viewport; the scroll moves the
 * camera), z px toward the reader, the page plane z = 0. The name's face stands at z = Zn = 2 D in front of the page,
 * so the flight ends on the straight view (eye at z = D) with Now's plate (z = 50) where the page wants it.
 */
import { C, clamp, sstep, mix } from "./shared.js";
import { cameraPath } from "../lib/camera.js";

/** the stage's eye distance at lens 1 (stage.js LOOK.eye x the viewport's diagonal, clamped) */
export const eyeD = (/** @type {number} */ w, /** @type {number} */ h) => clamp(1.25 * Math.hypot(w, h), 1100, 2600);

/** the stage's particles by tier (stage.js TIER_COUNTS) and the formations' shares of them */
const TIER = /** @type {Record<string, number>} */ ({ A: 160000, B: 80000, C: 40000 });
// the four take the whole population (a free remainder drifted through the opening as streaks). Round 11b (HEROFIX):
// the hall's light is the field's (stage/field/: real shafts, chips, the wall), so the dust keeps only a little and
// the face takes most of the swarm (an even, solid face at every viewport)
// (round 12) the shafts' dust is gone (the field's blades are the shafts): its share goes to the receding outlines
const SH = { face: 0.6, deep: 0.34, shafts: 0.02, sheen: 0.04 };
const LAYERS = 6;
/** capacities (targets) at the largest tier */
const CAP = { face: 96000, deep: 54400, shafts: 3200, sheen: 6400 };
/** the face's disc against the even spacing of its fill points (a disc that covers its neighbours' gaps: no pinholes
 *  where the stage's target map leaves a target empty, at any viewport) */
const FACE_K = 0.8;

/* ================================================================ small maths */
/** @param {number[]} a @param {number[]} b */ const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
/** @param {number[]} a @param {number[]} b */ const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** @param {number[]} a @param {number} k */ const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
/** @param {number[]} a */ const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
/** @param {number[]} a @param {number[]} b */ const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** slow out, slow in (quintic smootherstep) @param {number} t */
const smoother = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };

/** the generalised golden ratios (Roberts): an even, low-discrepancy sequence in d dimensions */
const phiD = (/** @type {number} */ d) => { let x = 1.5; for (let k = 0; k < 40; k++) x = Math.pow(1 + x, 1 / (d + 1)); return x; };
const G2 = phiD(2), A21 = 1 / G2, A22 = 1 / (G2 * G2);
const G3 = phiD(3), A31 = 1 / G3, A32 = 1 / (G3 * G3), A33 = 1 / (G3 * G3 * G3);
const fr = (/** @type {number} */ x) => x - Math.floor(x);
/** a deterministic hash of an integer to [0, 1) (the shafts' dust: an even field without lattice rows) */
const hash = (/** @type {number} */ n) => { let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
/** an even spread of u in (0, 1) to a soft-edged profile in about -1..1 (flat in the middle, soft past the edges) */
const soft = (/** @type {number} */ u) => { const t = u * 2 - 1; return Math.sign(t) * Math.pow(Math.abs(t), 0.8); };

/**
 * A point of the world that a pose sees at screen (sx, sy), dist px in front of the eye (no roll). The stage's
 * projection: focal length D x lens, principal point the viewport's centre; y down, z toward the reader.
 * @param {{ pos: number[], target: number[], lens?: number }} pose @param {number} sx @param {number} sy @param {number} dist
 * @param {number} vw @param {number} vh @param {number} D
 */
function seen(pose, sx, sy, dist, vw, vh, D) {
  const f = norm(sub(pose.target, pose.pos)), right = norm(cross([0, -1, 0], f)), down = cross(right, f);
  const s = dist / (D * (pose.lens || 1));
  return add(add(add(pose.pos, mul(f, dist)), mul(right, (sx - vw / 2) * s)), mul(down, (sy - vh / 2) * s));
}

/* ================================================================ the name */
/** the h1's words, face, weight and tracking (the layout is ours) */
function readName() {
  const h1 = /** @type {HTMLElement | null} */ (document.getElementById("hero-h1"));
  if (!h1) return null;
  const lines = Array.from(h1.querySelectorAll(".ln")).map((e) => (e.textContent || "").trim()).filter(Boolean);
  if (!lines.length) return null;
  const cs = getComputedStyle(h1), fs = parseFloat(cs.fontSize) || 100;
  const upper = cs.textTransform === "uppercase";
  return { words: lines.map((l) => (upper ? l.toUpperCase() : l)), family: cs.fontFamily, weight: cs.fontWeight || "800", track: (parseFloat(cs.letterSpacing) || 0) / fs };
}

/**
 * The glyphs as raster data: one canvas line per text line, the letters drawn one by one (each owns its columns), the
 * 0.5 iso-contour of the alpha as segments.
 * @param {NonNullable<ReturnType<typeof readName>>} m @param {string[]} lines @param {number} P raster font px
 */
function raster(m, lines, P) {
  const out = [];
  for (const text of lines) {
    const probe = /** @type {OffscreenCanvasRenderingContext2D} */ (new OffscreenCanvas(8, 8).getContext("2d"));
    probe.font = `${m.weight} ${P}px ${m.family}`;
    const adv = Array.from(text).map((ch) => probe.measureText(ch).width + m.track * P);
    const width = adv.reduce((a, b) => a + b, 0) - m.track * P;
    const pad = Math.ceil(P * 0.06), W = Math.ceil(width) + 2 * pad, H = Math.ceil(P * 0.86) + 2 * pad;
    const cv = new OffscreenCanvas(W, H), cx = /** @type {OffscreenCanvasRenderingContext2D} */ (cv.getContext("2d", { willReadFrequently: true }));
    cx.font = probe.font; cx.textBaseline = "alphabetic"; cx.fillStyle = "#fff";
    const base = pad + P * 0.74;          // the capitals' baseline (Sofia Sans Extra Condensed caps ~0.70 em)
    /** @type {{ ch: string, x0: number, x1: number }[]} */ const letters = [];
    let x = pad;
    Array.from(text).forEach((ch, i) => {
      if (ch.trim()) { cx.fillText(ch, x, base); letters.push({ ch, x0: x - P * 0.03, x1: x + adv[i] - m.track * P + P * 0.03 }); }
      x += adv[i];
    });
    const px = cx.getImageData(0, 0, W, H).data;
    const a = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) a[i] = px[i * 4 + 3] / 255;
    out.push({ text, W, H, a, letters, width, base, pad });
  }
  return out;
}

/** bilinear alpha @param {{ W: number, H: number, a: Float32Array }} r @param {number} x @param {number} y */
function alphaAt(r, x, y) {
  const x0 = Math.floor(x - 0.5), y0 = Math.floor(y - 0.5), tx = x - 0.5 - x0, ty = y - 0.5 - y0;
  const g = (/** @type {number} */ i, /** @type {number} */ j) => (i < 0 || j < 0 || i >= r.W || j >= r.H ? 0 : r.a[j * r.W + i]);
  return (g(x0, y0) * (1 - tx) + g(x0 + 1, y0) * tx) * (1 - ty) + (g(x0, y0 + 1) * (1 - tx) + g(x0 + 1, y0 + 1) * tx) * ty;
}

/**
 * The 0.5 iso-contour of a raster line as segments (marching squares on pixel centres), each tagged with its letter.
 * @param {ReturnType<typeof raster>[0]} r
 */
function contour(r) {
  /** @type {number[][]} */ const segs = [];
  const v = (/** @type {number} */ i, /** @type {number} */ j) => r.a[j * r.W + i] - 0.5;
  for (let j = 0; j < r.H - 1; j++) for (let i = 0; i < r.W - 1; i++) {
    const a = v(i, j), b = v(i + 1, j), c = v(i + 1, j + 1), d = v(i, j + 1);
    const k = (a > 0 ? 1 : 0) | (b > 0 ? 2 : 0) | (c > 0 ? 4 : 0) | (d > 0 ? 8 : 0);
    if (k === 0 || k === 15) continue;
    // crossings on the four edges (pixel centres at +0.5)
    const e = [];
    if ((a > 0) !== (b > 0)) e.push([i + 0.5 + a / (a - b), j + 0.5]);
    if ((b > 0) !== (c > 0)) e.push([i + 1.5, j + 0.5 + b / (b - c)]);
    if ((d > 0) !== (c > 0)) e.push([i + 0.5 + d / (d - c), j + 1.5]);
    if ((a > 0) !== (d > 0)) e.push([i + 0.5, j + 0.5 + a / (a - d)]);
    if (e.length === 2) segs.push([e[0][0], e[0][1], e[1][0], e[1][1]]);
    else if (e.length === 4) { segs.push([e[0][0], e[0][1], e[3][0], e[3][1]]); segs.push([e[1][0], e[1][1], e[2][0], e[2][1]]); }
  }
  return segs;
}

/**
 * The name's targets (local px about the name's centre on the face plane; z 0 the face, -T the back), per letter in
 * reading order. Returns the face set (fill + outline), the deep set (the contour layers), the sheen set and the reveal
 * ranges per letter.
 * @param {NonNullable<ReturnType<typeof readName>>} m @param {any} L the layout (lines, Wn, phone) @param {number} T
 * @param {number} nFace @param {number} nDeep @param {number} nSheen
 */
function* nameSetsGen(m, L, T, nFace, nDeep, nSheen) {
  const P = L.phone ? 360 : 300;
  const R = raster(m, L.lines, P);
  yield;
  // scale: world px per raster px, from the widest line
  const wMax = Math.max(...R.map((r) => r.width));
  const sc = L.Wn / wMax, lineH = P * L.lead * sc;
  // every letter: its raster line, its columns, its fill area and contour length
  /** @type {any[]} */ const letters = [];
  let li = -1;
  for (const r of R) {
    li++;
    const segs = contour(r);
    const oy = (li - (R.length - 1) / 2) * lineH;        // lines stacked about the centre
    const ox = -r.width * sc / 2;                         // each line centred
    for (const lt of r.letters) {
      const mine = segs.filter((s) => (s[0] + s[2]) / 2 >= lt.x0 && (s[0] + s[2]) / 2 < lt.x1);
      let area = 0, y0 = 1e9, y1 = -1e9;
      for (let j = 0; j < r.H; j++) for (let i = Math.max(0, Math.floor(lt.x0)); i < Math.min(r.W, Math.ceil(lt.x1)); i++) {
        if (r.a[j * r.W + i] >= 0.5) { area++; y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
      }
      const len = mine.reduce((s, q) => s + Math.hypot(q[2] - q[0], q[3] - q[1]), 0);
      letters.push({ r, lt, segs: mine, area, len, y0, y1, li,
        // raster -> local world px (y: the capitals' middle of the line at oy)
        X: (/** @type {number} */ x) => ox + (x - r.pad) * sc, Y: (/** @type {number} */ y) => oy + (y - (r.base - P * 0.35)) * sc });
    }
    yield;
  }
  const areaAll = letters.reduce((s, l) => s + l.area, 0), lenAll = letters.reduce((s, l) => s + l.len, 0);
  // the face: 74 % fill, 26 % outline; the deep: LAYERS contour layers; the sheen: the outline and layers, by x
  // (round 12, COVER3FIX) a larger outline share and a fill kept one disc inside the outline: the fill's discs no longer
  // poke past the letter's edge as scallops (the beaded edge on a phone); the edge is the outline's dense even run
  const nFill = Math.round(nFace * 0.64), nOut = nFace - nFill;
  const dens = nFill / areaAll, ds = lenAll / nOut, dsL = lenAll / (nDeep / LAYERS);
  const ero = 0.6 * FACE_K * Math.sqrt(areaAll / Math.max(1, nFill));
  const inside = (/** @type {any} */ r, /** @type {number} */ x, /** @type {number} */ y) => alphaAt(r, x, y) >= 0.5
    && alphaAt(r, x + ero, y) >= 0.5 && alphaAt(r, x - ero, y) >= 0.5 && alphaAt(r, x, y + ero) >= 0.5 && alphaAt(r, x, y - ero) >= 0.5;
  /** points along a letter's contour every `step` raster px (a running length, so the spacing is even) */
  const along = (/** @type {any} */ l, /** @type {number} */ step, /** @type {number} */ phase) => {
    /** @type {number[][]} */ const pts = [];
    let acc = phase * step;
    for (const s of l.segs) {
      const sl = Math.hypot(s[2] - s[0], s[3] - s[1]);
      while (acc < sl) { const t = acc / sl; pts.push([s[0] + (s[2] - s[0]) * t, s[1] + (s[3] - s[1]) * t]); acc += step; }
      acc -= sl;
    }
    return pts;
  };
  const face = [], deep = [], sheen = [];
  /** @type {{ f0: number, f1: number, fo: number, d0: number, d1: number, cx: number, cy: number, h: number }[]} */ const ranges = [];
  let rr = 0;
  for (const l of letters) {
    const rg = { f0: face.length, fo: 0, f1: 0, d0: deep.length, d1: 0, cx: 0, cy: 0, h: (l.y1 - l.y0) * sc };
    // outline first (it ignites first), then the fill
    for (const p of along(l, ds, 0.5)) face.push([l.X(p[0]), l.Y(p[1]), 0, 1]);
    rg.fo = face.length;
    const bx0 = Math.floor(l.lt.x0), bx1 = Math.ceil(l.lt.x1), by0 = l.y0 - 1, by1 = l.y1 + 2;
    const n = Math.ceil((bx1 - bx0) * (by1 - by0) * dens);
    for (let i = 0; i < n; i++, rr++) {
      const x = bx0 + fr(0.5 + rr * A21) * (bx1 - bx0), y = by0 + fr(0.5 + rr * A22) * (by1 - by0);
      if (inside(l.r, x, y)) face.push([l.X(x), l.Y(y), 0, 1]);
    }
    rg.f1 = face.length;
    // the contour layers, front to back (the first just behind the face), whiter in front, cobalt at the back
    for (let k = 1; k <= LAYERS; k++) {
      // (round 12) crisp receding outlines, each dimmer than the one before (no haze band)
      const z = -T * (k / LAYERS), w = Math.pow(0.72, k - 1);
      for (const p of along(l, dsL, (k * 0.37) % 1)) deep.push([l.X(p[0]), l.Y(p[1]), z, w]);
    }
    rg.d1 = deep.length;
    rg.cx = l.X((l.lt.x0 + l.lt.x1) / 2); rg.cy = l.Y((l.y0 + l.y1) / 2);
    ranges.push(rg);
    yield;
  }
  // the sheen: every k-th outline and layer point, sorted by x (the band travels across the name)
  const step = Math.max(1, Math.round(nOut / nSheen));
  let q = 0;
  for (const l of ranges) for (let i = l.f0; i < l.fo; i++) if (q++ % step === 0) sheen.push([...face[i].slice(0, 3), 1]);
  // (round 12, COVER3FIX) the rim only: its sparse points on the receding layers read as glittering stipple
  sheen.sort((a, b) => a[0] - b[0]);
  const pack = (/** @type {number[][]} */ a) => { const d = new Float32Array(a.length * 4); a.forEach((p, i) => d.set(p, i * 4)); return { data: d, path: 0, closed: false }; };
  const nf = face.length, nd = deep.length;
  return {
    face: pack(face), deep: pack(deep), sheen: pack(sheen),
    // reveal fractions (the stage's reveal key: (index + 0.5) / count)
    letters: ranges.map((g) => ({ f0: g.f0 / nf, fo: g.fo / nf, f1: g.f1 / nf, d0: g.d0 / nd, d1: g.d1 / nd, cx: g.cx, cy: g.cy, h: g.h })),
    height: lineH * (R.length - 1) + P * 0.72 * sc,
    // the even spacing of the fill points (world px): the face's disc follows it
    spacing: Math.sqrt((areaAll * sc * sc) / Math.max(1, nFill)),
    // the receding outlines' even spacing along the contour (world px): their disc covers the gaps (crisp lines)
    deepSpacing: dsL * sc,
  };
}

/** the name's sets at once (a cold load: the world is built while the stage's pipelines compile) */
function nameSets(/** @type {any} */ m, /** @type {any} */ L, /** @type {number} */ T, /** @type {number} */ nFace, /** @type {number} */ nDeep, /** @type {number} */ nSheen) {
  const g = nameSetsGen(m, L, T, nFace, nDeep, nSheen);
  for (;;) { const r = g.next(); if (r.done) return r.value; }
}

/* (lane n-fix-flight) THE NAME BUILT AHEAD, IN SLICES. Reached by a flight from a page that is not the cover, the name's
   sets were built in the cover's first frame: one task of 90 to 105 ms with the eye at the door (n-critic 4: four frames
   of the same pane). nameSetsGen is the same code as a generator that pauses between the raster, each line's contour
   and each letter; prepareWorld runs it 5 ms at a time between frames and keeps the result, which ensureWorld takes
   (the same sets, bit for bit: one code path). The host starts it as soon as the cover's modules are in, the eye still
   on its way to the door (hero.js prepare, fx-stage.js adopt). */
/** @type {{ key: string, val: any, jobKey: string, job: Promise<void> | null }} */
const SETS = { key: "", val: null, jobKey: "", job: null };
const setsKey = (/** @type {any} */ m, /** @type {any} */ L, /** @type {number} */ T, /** @type {number} */ n) => [m.words.join("|"), m.family, m.weight, m.track, L.lines.join("|"), L.Wn, L.phone, L.lead, T, n].join(";");
/** what ensureWorld hands nameSets for this viewport and tier (its own lines, repeated: a drift only loses the cache) */
function setsArgs(/** @type {any} */ m, /** @type {number} */ vw, /** @type {number} */ vh, /** @type {boolean} */ phone, /** @type {string} */ tier) {
  const D = eyeD(vw, vh), lens = phone ? 0.74 : 0.55;
  const Rd = (phone ? 1.3 : 1.25) * D * lens, yaw = phone ? -0.2 : -0.3;
  const frameW = vw * Rd / (D * lens);
  const lines = phone ? m.words : [m.words.join(" ")];
  const Wn = (phone ? 0.84 : 0.68) * frameW / Math.cos(yaw);
  const L = { lines, Wn, phone, lead: 0.8 };
  const em = Wn / (phone ? 3.0 : 5.25), T = 0.9 * em;
  return { L, T, n: TIER[/** @type {"A"} */ (tier)] || TIER.A };
}
/**
 * Build the name's sets for this viewport and tier in slices, between frames. Resolves when they are kept (or at once:
 * the world stands, the face is not in yet, there is no name on this page).
 * @param {{ vw: number, vh: number, phone: boolean, tier?: string }} c @returns {Promise<void>}
 */
export function prepareWorld(c) {
  const vw = c.vw, vh = c.vh, phone = c.phone, tier = c.tier || "A";
  if (typeof document === "undefined" || typeof MessageChannel === "undefined") return Promise.resolve();
  if (C.world && C.world.key === `${vw},${vh},${tier}`) return Promise.resolve();
  if (document.fonts && !document.fonts.check('800 100px "Sofia Sans Extra Condensed"')) return Promise.resolve();
  const m = readName();
  if (!m || !(vw > 0) || !(vh > 0)) return Promise.resolve();
  const a = setsArgs(m, vw, vh, phone, tier), key = setsKey(m, a.L, a.T, a.n);
  if (SETS.key === key && SETS.val) return Promise.resolve();
  if (SETS.jobKey === key && SETS.job) return SETS.job;
  SETS.jobKey = key;
  const g = nameSetsGen(m, a.L, a.T, Math.round(a.n * SH.face), Math.round(a.n * SH.deep), Math.round(a.n * SH.sheen));
  const job = new Promise((/** @type {(v?: any) => void} */ resolve) => {
    const ch = new MessageChannel();
    const end = () => { try { ch.port1.close(); } catch (e) { /* closed */ } if (SETS.job === job) SETS.job = null; resolve(); };
    const step = () => {
      const t0 = performance.now();
      try {
        for (;;) {
          const r = g.next();
          if (r.done) { if (SETS.jobKey === key) { SETS.key = key; SETS.val = r.value; } end(); return; }
          if (performance.now() - t0 > 5) break;
        }
      } catch (e) { if (SETS.jobKey === key) SETS.jobKey = ""; end(); return; }
      ch.port2.postMessage(0);
    };
    ch.port1.onmessage = step;
    step();
  });
  SETS.job = job;
  return job;
}

/* ================================================================ the shafts */
/**
 * Three broad shafts of light: slabs of fine points from high out of frame through the name's plane and on into the
 * dark, soft at their sides, brightest where they cross the name,. Local px about the
 * name's centre. Ordered shaft by shaft, top first (the reveal switches them on one by one, light running down).
 * @param {any} W @param {number} n
 */
function shaftSet(W, n) {
  const { fh, D } = { fh: W.frameH, D: W.D }, fw = W.frameW;
  // the two fixed shafts' dust (the third, the hand's, is light alone: the field): SHAFTS below, shared with the lights
  const S = W.shafts;
  const d = new Float32Array(n * 4);
  const per = Math.floor(n / S.length);
  let j = 0;
  S.forEach((s, si) => {
    const m = si === S.length - 1 ? n - per * si : per;
    const top = -1.25 * fh, bot = 1.05 * fh, cxs = s.x * W.Wn, czs = s.z * D;
    const axis = norm([s.tx, 1, s.tz]);
    // across the shaft: horizontal, perpendicular to its fall; its depth axis: the third
    const ac = norm(cross(axis, [0, 0, 1])), dp = norm(cross(ac, axis));
    /** @type {number[][]} */ const pts = [];
    for (let i = 0; i < m; i++) {
      // three hashed coordinates (a lattice sequence drew its rows as a hatch through the soft discs), then sorted top
      // to bottom for the reveal; deterministic, the same hall every load
      const g = i * 3 + si * 1000003;
      // gathered toward the core (the field's light is brightest there): the dust is the light's grain, not a slab
      const core = (/** @type {number} */ u) => { const t = u * 2 - 1; return Math.sign(t) * Math.pow(Math.abs(t), 1.7); };
      const a = core(hash(g)) * s.w * fw * 0.5, b = core(hash(g + 1)) * s.d * D * 0.5;
      const yy = top + (bot - top) * hash(g + 2);
      const t = yy / axis[1];
      const p = [cxs + axis[0] * t + ac[0] * a + dp[0] * b, yy + ac[1] * a + dp[1] * b, czs + axis[2] * t + ac[2] * a + dp[2] * b];
      // brightness: brightest across the name's plane, out of the dark at both ends, softer at the sides
      const yN = yy / fh;
      // (round 11b) the dust only from just above the name down (above it the plates hang: dust behind a plate lit
      // its glass as a grey sheen); the shaft's full length is the field's light
      const along = (0.25 + 0.75 * Math.exp(-Math.pow(yN / 0.45, 2))) * sstep(-0.3, -0.12, yN) * (1 - sstep(0.22, 0.62, yN));
      const side = 1 - 0.6 * Math.min(1, Math.abs(a) / (s.w * fw * 0.5));
      pts.push([p[0], p[1], p[2], s.k * along * side]);
    }
    pts.sort((p, q) => p[1] - q[1]);
    for (const p of pts) { d[j++] = p[0]; d[j++] = p[1]; d[j++] = p[2]; d[j++] = p[3]; }
  });
  return { data: d, path: 0, closed: false, ranges: S.map((_, si) => [si * per / n, (si === S.length - 1 ? n : (si + 1) * per) / n]) };
}

/* ================================================================ the formations */
/** (round 12, COVER3FIX) the name's ink once the eye is through it (k past 0.44): its points go dark behind the lens, so
 *  when the flight hands them to Now's glow they appear on their new places instead of streaking across the screen as
 *  blue static, and on the way back they return dark and light on their letters */
const gone = () => 1 - sstep(0.42, 0.5, C.ks ?? 0);
/** the name's front face: fill and outline, white */
export const face = {
  order: 102, share: SH.face, fill: 1, fit: "px", capacity: CAP.face, carry: 1, emit: 0,
  targets: () => ({ data: new Float32Array(4), path: 0, closed: false }),
  look: { ink: 0.9, size: 1.05, mistInk: 0, mistSize: 1.1 },
  // straight streaks on a speed-capped spring, locked in place with almost no curl
  motion: { spring: 10, speed: 7000, inertia: 0.05, fuzz: 0 },
  flow: { amp: 0, wavelength: 320, evolution: 0.03, z: 0.1 },
  respond: { hand: 0.14, wind: 0, fadeIn: 7, fadeOut: 10 },
  /** @param {any} c */
  update(c) {
    const W = C.world;
    if (!W) return {};
    if (c.state.key !== W.key) { c.state.key = W.key; c.setTargets(W.sets.face); }
    const g = C.ign || {};
    // (lane NAME, ?name=splat only: C.nameSplat is never set without it) the settled letters' points handed to their blocks
    const rv = g.face || [0, 1.02, 0.002], ns = /** @type {any} */ (C).nameSplat;
    return { offset: [0, 0, W.Zn], ink: W.inkFace * gone(), look: { size: W.faceSize }, reveal: ns ? [Math.max(rv[0], ns.faceLo), rv[1], rv[2]] : rv, emit: g.emit ?? 0, spawn: g.spawn };
  },
};

/** the name's depth: contour layers, softer and bluer toward the back */
export const deep = {
  order: 100, share: SH.deep, fill: 1, fit: "px", capacity: CAP.deep, carry: 1, emit: 0,
  targets: () => ({ data: new Float32Array(4), path: 0, closed: false }),
  look: { ink: 0.045, size: 1.3, mistInk: 0, mistSize: 1.1 },
  motion: { spring: 8, speed: 5000, inertia: 0.06, fuzz: 0 },
  flow: { amp: 0.02, wavelength: 320, evolution: 0.03, z: 0.1 },
  respond: { hand: 0.14, wind: 0, fadeIn: 4, fadeOut: 10 },
  /** @param {any} c */
  update(c) {
    const W = C.world;
    if (!W) return {};
    if (c.state.key !== W.key) { c.state.key = W.key; c.setTargets(W.sets.deep); }
    const g = C.ign || {};
    const rv = g.deep || [0, 1.02, 0.002], ns = /** @type {any} */ (C).nameSplat;
    return { offset: [0, 0, W.Zn], ink: W.inkDeep * gone(), look: { size: W.deepSize }, reveal: ns ? [Math.max(rv[0], ns.deepLo), rv[1], rv[2]] : rv, emit: g.emitDeep ?? 0, spawn: g.spawnDeep };
  },
};

/** the three shafts of light (the dust is in them) */
export const shafts = {
  order: 103, share: SH.shafts, fill: 1, fit: "px", capacity: CAP.shafts, carry: 1, emit: 0,
  targets: () => ({ data: new Float32Array(4), path: 0, closed: false }),
  look: { ink: 0.16, size: 1.7, mistInk: 0, mistSize: 1.1 },
  motion: { spring: 4, speed: 2400, inertia: 0.2, fuzz: 0 },
  flow: { amp: 2.5, wavelength: 520, evolution: 0.02, z: 0.6 },
  respond: { hand: 0.35, wind: 0, fadeIn: 2.2, fadeOut: 10 },
  /** @param {any} c */
  update(c) {
    const W = C.world;
    if (!W) return {};
    if (c.state.key !== W.key) { c.state.key = W.key; c.setTargets(W.sets.shafts); }
    const g = C.ign || {};
    // they turn a few degrees about the vertical through the name on the stage's clock (still when the stage rests)
    return { offset: [0, 0, W.Zn - W.T * 0.5], rotate: [0, 0.07 * Math.sin(c.time * 0.05), 0.012 * Math.sin(c.time * 0.037)], ink: W.inkShafts, reveal: g.shafts || [0, 1.02, 0.02] };
  },
};

/** a band of light that travels across the name's rim and layers on the stage's clock */
export const sheen = {
  order: 101, share: SH.sheen, fill: 1, fit: "px", capacity: CAP.sheen, carry: 1, emit: 0,
  targets: () => ({ data: new Float32Array(4), path: 0, closed: false }),
  look: { ink: 0.4, size: 1.2, mistInk: 0, mistSize: 1.1 },
  motion: { spring: 10, speed: 3000, inertia: 0.05, fuzz: 0 },
  flow: { amp: 0.25, wavelength: 320, evolution: 0.03, z: 0.1 },
  respond: { hand: 0.14, wind: 0, fadeIn: 3.2, fadeOut: 10 },
  /** @param {any} c */
  update(c) {
    const W = C.world;
    if (!W) return {};
    if (c.state.key !== W.key) { c.state.key = W.key; c.setTargets(W.sets.sheen); }
    // one pass every 11 s of the stage's clock: 5 s across, then still
    const p = (c.time % 11) / 5, x = mix(-0.15, 1.15, clamp(p));
    return { offset: [0, 0, W.Zn], ink: W.inkSheen * sstep(OPEN_S, OPEN_S + 1.2, C.at ?? 99), reveal: [x - 0.07, x + 0.07, 0.06] };
  },
};

/* ================================================================ the world's layout */
/**
 * Build (or keep) the world for this viewport and tier: the name, the shafts, the poses, the plates' places. Once the
 * display face is in; again when the viewport or the tier changes.
 * @param {any} c
 */
export function ensureWorld(c) {
  const vw = c.vw, vh = c.vh, phone = c.phone, tier = c.tier || "A";
  if (typeof document === "undefined") return C.world;
  if (document.fonts && !document.fonts.check('800 100px "Sofia Sans Extra Condensed"')) return C.world;
  const key = `${vw},${vh},${tier}`;
  if (C.world && C.world.key === key) return C.world;
  const m = readName();
  if (!m) return C.world;
  const D = eyeD(vw, vh), Zn = 2 * D;
  // the rest pose (round 12, "the lit hall"): a wide lens close to the name, the eye to the left and a little BELOW it,
  // looking up (the near letters stand taller than the far ones: a block seen from below); the frame's size at the
  // name's distance is the same as before (Rd scales with the lens)
  // (round 12, COVER3FIX) 0.55 and 17 degrees: the nearest letter about 1.3 times the farthest's height
  const lens = phone ? 0.74 : 0.55;
  const Rd = (phone ? 1.3 : 1.25) * D * lens, yaw = phone ? -0.2 : -0.3, pitch = phone ? -0.08 : -0.115;
  const frameW = vw * Rd / (D * lens), frameH = vh * Rd / (D * lens);     // the frame's size in world px at the name's distance
  const lines = phone ? m.words : [m.words.join(" ")];
  const Wn = (phone ? 0.84 : 0.68) * frameW / Math.cos(yaw);
  const L = { lines, Wn, phone, lead: 0.8 };
  // depth: 0.7 em (em from the raster's scale: the widest line's width over its em width, about 5.2 em on one line)
  const em = Wn / (phone ? 3.0 : 5.25), T = 0.9 * em;
  const n = TIER[tier] || TIER.A;
  // (lane n-fix-flight) the sets built ahead in slices (prepareWorld) are taken; while they are being built the world
  // of before stands (none on a first visit: the scene draws nothing for those frames, the host waits for them)
  const sk = setsKey(m, L, T, n);
  if (SETS.jobKey === sk && SETS.job && SETS.key !== sk) return C.world;
  const sets = SETS.key === sk && SETS.val ? SETS.val : nameSets(m, L, T, Math.round(n * SH.face), Math.round(n * SH.deep), Math.round(n * SH.sheen));
  const X0 = vw / 2, Y0 = vh / 2;
  // aimed below the name so that it stands at 0.40 of the height (a phone: 0.31, high above the foot)
  const want = phone ? 0.31 : 0.4;
  const tgt = [X0, Y0 + (0.5 - want) * frameH, Zn - T * 0.5];
  const dir = [Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
  const rest = { pos: add(tgt, mul(dir, Rd)), target: tgt, roll: phone ? 0 : 0.006, lens, aperture: 0.1 };
  const end = { pos: [vw / 2, vh / 2, D], target: [vw / 2, vh / 2, 0], roll: 0, lens: 1, aperture: 1 };
  // the opening: polar about a pivot that slides from the first third of the name to the rest target
  const first = sets.letters[0], A0 = [X0 + first.cx, Y0 + first.cy, Zn];
  // (round 11b) less grazing than v2's -0.9 rad, which looked down the line so each letter's streaks crossed its
  // neighbours; on a phone the pivot stays on the name's axis (the first line no longer runs off the frame)
  // (round 12) the opening starts low and near the A, looking up at it, and rises and pulls back to the rest pose
  const open = {
    from: phone
      ? { yaw: -0.42, pitch: -0.24, r: 0.8 * Rd, target: [X0, tgt[1], Zn - T * 0.5] }
      : { yaw: -0.55, pitch: -0.3, r: 0.62 * Rd, target: [X0 - Wn * 0.22, Y0 + first.cy * 0.3, Zn - T * 0.5] },
    to: { yaw, pitch, r: Rd, target: tgt },
  };
  // the gap the flight goes through: between the words (one line) or between the lines (a phone)
  let gx = X0, gy = Y0;
  if (!phone && sets.letters.length > 7) gx = X0 + (sets.letters[6].cx + sets.letters[7].cx) / 2;
  // the hall's plates: placed by where the REST pose sees them (screen fractions, distance from the eye in D, width as
  // a fraction of the frame); real captures, 16:10
  // (round 11b) fewer and larger, turned toward the hall's axis like windows in its side walls, above or below the name's
  // band, never on the foot's text or the header; one SerSan image at most (Now's sersan.io plate is the fourth window, far down the hall)
  // (round 12) two large plates set deep to the left and right of the name, turned toward the centre, each cut by the
  // frame's edge (objects in a room, not cards); a phone: one in the band under the header. d: distance in Rd
  const spec = phone
    ? [{ id: "w1", sx: 0.78, sy: 0.128, d: 1.8, w: 0.32, turn: 0.32 }]
    // (round 12, COVER3FIX) beside the name's ends, low, between the letters and the foot (the band 0.49-0.74 of the
    // height is free of type at rest), each cut by the frame's side, the left nearer than the right; their broad face
    // reflects little of the studio (sheen, hero.js), so no pointer angle washes them to a grey card
    : [
      { id: "w1", sx: 0.075, sy: 0.56, d: 1.6, w: 0.26, turn: -0.44 },
      { id: "w2", sx: 0.935, sy: 0.57, d: 1.95, w: 0.25, turn: 0.52 },
    ];
  const plates = spec.map((p, i) => {
    const dist = p.d * Rd, P = seen(rest, p.sx * vw, p.sy * vh, dist, vw, vh, D), k = dist / (D * lens);
    const w = p.w * vw * k;
    return { id: p.id, cx: P[0], cy: P[1], cz: P[2], w, h: w / 1.6, t: Math.max(10, w * 0.05), yaw: p.turn + yaw * 0.3, i };
  });
  // the two fixed shafts (crossing point x in name widths, z in D; tilt dx, dz per unit of fall; width in frame
  // widths, depth in D): their dust (shaftSet) and their light (hallField) share these axes
  const shafts = phone
    ? [{ x: -0.4, z: -0.15, tx: 0.3, tz: 0.1, w: 0.16, d: 0.1, k: 1 }, { x: 0.46, z: 0.02, tx: -0.28, tz: 0.08, w: 0.14, d: 0.09, k: 0.9 }]
    : [{ x: -0.3, z: -0.15, tx: 0.28, tz: 0.1, w: 0.13, d: 0.09, k: 1 }, { x: 0.38, z: 0.04, tx: -0.26, tz: 0.08, w: 0.11, d: 0.08, k: 0.9 }];
  const W = {
    key, vw, vh, D, Zn, T, phone, tier, Wn, em, lens, Rd, yaw, pitch, frameW, frameH, X0, Y0, gap: [gx, gy], rest, end, open, A0, plates, sets, shafts,
    letters: sets.letters,
    // the face: a disc as wide as the even spacing of its points needs (round 11b: v2's fixed disc left pinholes as
    // the name grew with the viewport, and a tier's fewer points with doubled ink swelled the letters on a phone); the
    // ink per point holds at every tier, so the edge stays as crisp as the spacing allows
    faceSize: FACE_K * sets.spacing,
    deepSize: Math.max(1.6, 1.6 * sets.deepSpacing),
    inkFace: phone ? 0.9 : 1, inkDeep: (phone ? 0.5 : 0.6) * Math.sqrt(TIER.A / n), inkShafts: (phone ? 0.5 : 1) * (TIER.A / n), inkSheen: TIER.A / n,
  };
  /** @type {any} */ (W).sets.shafts = shaftSet(W, Math.round(n * SH.shafts));
  C.world = W;
  return W;
}

/* ================================================================ the camera */
/** the opening's pose at u in 0..1 (an arc about a sliding pivot: yaw, pitch and distance eased) @param {any} W @param {number} u */
function openPose(W, u) {
  const a = W.open.from, b = W.open.to;
  const e = smoother(u), er = smoother(clamp((u - 0.06) / 0.94));     // the pull-back trails the arc a little
  const yaw = mix(a.yaw, b.yaw, e), pitch = mix(a.pitch, b.pitch, e), r = mix(a.r, b.r, er);
  const T = [mix(a.target[0], b.target[0], e), mix(a.target[1], b.target[1], e), mix(a.target[2], b.target[2], e)];
  const dir = [Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
  return { pos: add(T, mul(dir, r)), target: T, roll: mix(-0.035, W.rest.roll, e), aperture: mix(0.12, W.rest.aperture, e), lens: W.lens };
}

/** seconds of the opening's camera move */
export const OPEN_S = 2.6;

/**
 * The cover's camera this frame (the same object for every scene that asks in one frame).
 * k: the flight (0 at the top, 1 when Now's view reaches the top); C.at: seconds of the opening.
 * @param {any} c
 */
/**
 * The flight's progress this frame, with weight (round 11b): the scroll's own k followed by a critically damped
 * follower (0.26 s), so a quick wheel step still takes the camera a few hundred milliseconds through the name instead
 * of two frames (the name had vanished between two captures 120 ms apart). Shared by hero.js and now.js.
 * @param {any} c
 */
export function flightK(c) {
  const k = C.nowTop > 0 ? clamp(c.scrollY / C.nowTop) : 1;
  if (C.kT === c.time) return C.ks;
  const dt = C.kT == null ? 0 : clamp(c.time - C.kT, 0, 0.1);
  if (C.ks == null || C.kT == null) { C.ks = k; C.kv = 0; }
  else {
    const w = 1 / 0.26;
    C.kv += (w * w * (k - C.ks) - 2 * w * C.kv) * dt; C.ks += C.kv * dt;
    if (Math.abs(k - C.ks) < 2e-4 && Math.abs(C.kv) < 2e-3) { C.ks = k; C.kv = 0; }
    C.ks = clamp(C.ks);
  }
  C.kT = c.time;
  return C.ks;
}

export function coverCamera(c) {
  if (C.cam && C.camT === c.time) return C.cam;
  const W = C.world, vw = c.vw, vh = c.vh, D = eyeD(vw, vh);
  const k = flightK(c);
  /** @type {any} */ let cam;
  if (!W || W.vw !== vw || W.vh !== vh) {
    // no world yet (the face is loading): the straight view, the site's own camera
    cam = { pos: [vw / 2, vh / 2, D], target: [vw / 2, vh / 2, 0], damp: 0, orbit: { yaw: 0.035, pitch: 0.021 } };
  } else {
    const at = C.at ?? 99, ph = W.phone;
    const u = clamp(at / OPEN_S), A = openPose(W, u);
    // the flight, as a path from rest; the opening's pose replaces its start (a scroll during it adds to it)
    const [gx, gy] = W.gap, Zf = W.Zn - W.T * 0.5;
    const F = cameraPath([
      { at: 0, ...W.rest },
      { at: 0.26, pos: [gx, gy + 4, W.Zn + 0.48 * D], target: [mix(gx, vw / 2, 0.2), gy + 6, W.Zn - 1.4 * D], roll: 0, aperture: 0.2 },
      { at: 0.44, pos: [mix(gx, vw / 2, 0.3), mix(gy, vh / 2, 0.3), W.Zn - 0.42 * D], target: [mix(gx, vw / 2, 0.7), mix(gy, vh / 2, 0.6), 0.4 * D], roll: ph ? 0.01 : -0.03 },
      { at: 0.74, pos: [mix(gx, vw / 2, 0.75), mix(gy, vh / 2, 0.8), 1.42 * D], target: [vw / 2, vh / 2, 0.05 * D], roll: ph ? -0.012 : 0.03, aperture: 0.6 },
      { at: 1, ...W.end },
    ]);
    const P = F(k), R = F(0);
    const pos = add(A.pos, sub(P.pos, R.pos)), target = add(A.target, sub(P.target, R.target));
    // (round 12) awake, the eye never stands still: a slow arc about the name (about 2.5 degrees each way; 5 on a phone,
    // which has no pointer) with a slight push-in, on the stage's clock (it stops when the stage sleeps), gone in the flight
    const rest = smoother(clamp((at - OPEN_S + 0.8) / 0.8)) * (1 - sstep(0, 0.2, k));
    const t = c.clock ? c.clock.time : 0;
    const arc = rest * (ph ? 0.087 : 0.044) * Math.sin(t * 2 * Math.PI / 17);
    const push = 1 - rest * (ph ? 0.04 : 0.035) * (0.5 - 0.5 * Math.cos(t * 2 * Math.PI / 23));
    const lift = rest * (ph ? 0.012 : 0.008) * Math.sin(t * 2 * Math.PI / 29);
    {
      const v = sub(pos, target), ca = Math.cos(arc), sa = Math.sin(arc);
      const r = [v[0] * ca + v[2] * sa, v[1] - lift * Math.hypot(v[0], v[2]), -v[0] * sa + v[2] * ca];
      for (let i = 0; i < 3; i++) pos[i] = target[i] + r[i] * push;
    }
    const ob = smoother(clamp(at / OPEN_S)) * (1 - 0.75 * k);
    cam = {
      pos, target, roll: A.roll + (P.roll - R.roll), lens: Math.max(0.2, A.lens + (P.lens - R.lens)),
      damp: 0, parallax: ob,
      // the hand moves the room: up to about 17 degrees of yaw and 8 of pitch, with weight
      // (pitch 0.12: at 0.14 a hand at the bottom slid the plates down over the foot's first line)
      orbit: { yaw: (ph ? 0.08 : 0.3) * ob, pitch: (ph ? 0.04 : 0.12) * ob, damp: 1.1 },
      // the fog reaches past the back wall (hallField): the wall and the deep chips stay in the hall
      fog: [3.0 * D, 7.0 * D],
    };
    // focus: during the opening on the letter that is igniting; at rest and in the approach on the name's face; once
    // the eye is through, a rack to the window ahead (passing the plates on the way)
    const ig = C.ignAt ? [C.ignAt[0], C.ignAt[1], C.ignAt[2]] : [W.X0, W.Y0, W.Zn];
    const igD = Math.max(0.2 * D, Math.hypot(ig[0] - pos[0], ig[1] - pos[1], ig[2] - pos[2]));
    const fv = norm(sub(target, pos));
    const nameD = Math.max(0.25 * D, (W.X0 - pos[0]) * fv[0] + (W.Y0 - pos[1]) * fv[1] + (Zf - pos[2]) * fv[2]);
    const aheadD = Math.hypot(target[0] - pos[0], target[1] - pos[1], target[2] - pos[2]);
    const lock = smoother(clamp((at - 1.2) / 0.8));
    const rack = sstep(0.36, 0.6, k);
    cam.focus = mix(mix(igD, nameD, lock), aheadD, rack);
    // (round 11b) the rack to the page's own aperture only at the very end: through the flight the hall stays sharp
    // (v2 opened it from half way and the chips and the swarm went to large soft round discs in an empty dark)
    cam.aperture = mix(mix(0.12, 0.1, lock), 1, sstep(0.86, 1, k)) * (1 - 0.4 * sstep(0.17, 0.26, k) * (1 - sstep(0.36, 0.45, k)));
    // near: the opening starts close to the first letter; while the eye crosses the name the letters near the lens
    // fade before they are large (a large disc is thinned by the fill budget and reads as a blot), over a longer
    // distance than v2's so they leave as walls passing, not in one frame
    const x = sstep(0.17, 0.31, k) * (1 - sstep(0.44, 0.56, k));
    cam.near = mix(mix(0.04, 0.08, smoother(u)), ph ? 0.14 : 0.06, x) * D;
    cam.nearFull = mix(mix(0.14, 0.26, smoother(u)), ph ? 0.52 : 0.36, x) * D;
  }
  C.cam = cam; C.camT = c.time;
  return cam;
}

/* ================================================================ live keep-outs */
/** @type {{ t: number, y: number, hdr: any[], now: any }} */
const LK = { t: -1, y: 0, hdr: [], now: null };
/**
 * (round 12, COVER3FIX) Keep-outs the host's measured text blocks miss: the header's words (fixed, no scene owns them)
 * and Now's display title (the host measures it while its words sit under their rise mask: 100 px low and half its
 * width). Read from the DOM at most twice a second (one layout read, nothing dirty at rest), held in document space.
 * @param {any} c @param {boolean} now include Now's title
 */
export function liveKeeps(c, now) {
  if (typeof document === "undefined") return [];
  if (LK.t < 0 || Math.abs(c.time - LK.t) > 0.5) {
    LK.t = c.time; LK.y = c.scrollY;
    // two rects (the name; the nav or the menu button): the host holds 16 keep-outs in all
    LK.hdr = Array.from(document.querySelectorAll(".hdr-name, .hdr-nav, .hdr-menu"))
      .map((e) => e.getBoundingClientRect()).filter((r) => r.width > 1 && r.height > 1 && r.bottom > 0)
      .map((r) => ({ x: r.left - 10, y: r.top - 8, w: r.width + 20, h: r.height + 16 }));
    const h = document.getElementById("now-h"), r = h && h.getBoundingClientRect();
    LK.now = r && r.width > 1 ? { x: r.left - 16, y: r.top + c.scrollY - 16, w: r.width + 32, h: r.height + 32 } : null;
  }
  const out = LK.hdr.slice();
  if (now && LK.now) out.push({ ...LK.now, y: LK.now.y - c.scrollY });
  return out;
}

/* ================================================================ the field: the hall's air, its back wall, its light */
/** seconds one travelling blade takes to cross the hall and come round (on the stage's clock) */
export const BLADE_S = 30;

/**
 * The name's box as the camera sees it this frame: a viewport rect (css px) around its eight corners and the world point
 * of its farthest corner (the field keeps the chips nearer than that out of the rect). null when the eye is in it.
 * @param {any} W @param {any} cam @param {number} pad
 */
function nameRect(W, cam, pad) {
  if (!cam || !cam.pos) return null;
  const f = norm(sub(cam.target, cam.pos)), right = norm(cross([0, -1, 0], f)), down = cross(right, f);
  const fl = W.D * (cam.lens || 1), hw = W.Wn / 2 + 20, hh = W.sets.height / 2 + 30;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, far = null, fd = -1e9;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const z of [0, -W.T]) {
    const p = [W.X0 + sx * hw, W.Y0 + sy * hh, W.Zn + z], q = sub(p, cam.pos), d = q[0] * f[0] + q[1] * f[1] + q[2] * f[2];
    if (d < 0.1 * W.D) return null;
    const x = W.vw / 2 + (q[0] * right[0] + q[1] * right[1] + q[2] * right[2]) * fl / d;
    const y = W.vh / 2 + (q[0] * down[0] + q[1] * down[1] + q[2] * down[2]) * fl / d;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    if (d > fd) { fd = d; far = p; }
  }
  return { rect: [x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad], point: far };
}

/**
 * The hall's field (stage/field/, README "The field"), round 12 "the lit hall": the room is lit and you can see it.
 *   chips   cut as the A of the display face and as the SerSan mark, at every depth between the lens and the wall: a
 *           few large near ones, a middle population, a far dust near the wall, the marks deep around Now's plate; each
 *           with a faint edge light of its own (rim), flashing toward white where a blade crosses it; none in front of
 *           the name's face (clear) or of DOM text (the keep-outs)
 *   cosmos  (wave 7, COSMOS) the hall has no back wall now: behind its back plane the neural cosmos (cosmos/web.js)
 *   lights  the NAME's light, two BLADES that travel slowly and continuously on the stage's clock (one cool, one warm),
 *           and the hand's where the pointer is (desktop): (wave 7) with no wall to fall on and no haze, the key lights
 *           the chips catch (they glint as a light passes)
 * hero.js returns all of it; now.js returns the same chips and wall (no lights) for the end of the flight.
 * @param {any} c
 * @param {{ at: number, k: number, lights?: boolean, aim?: number[], hand?: number, time?: number }} o
 *   aim: the hand's blade target in -1..1 (x, y); hand: its presence; time: the blades' clock (s)
 */
export function hallField(c, o) {
  const W = C.world;
  if (!W) return null;
  const vw = W.vw, vh = W.vh, D = W.D, ph = W.phone, k = o.k;
  const N = W.rest.target;                                     // the name's centre, mid-depth
  const wallZ = -0.6 * D;                                       // far behind Now's plate (z 50) and the page plane
  const eye = W.rest.pos;
  const front = eye[2] - 0.08 * D;                              // the box reaches almost to the lens at rest
  const depth = front - wallZ;
  // the box's depth fractions (0 the wall, 1 the front): the name's face, Now's plate
  const fName = (W.Zn - wallZ) / depth, fNow = (50 - wallZ) / depth;
  const up = sstep(0.0, 0.5, o.at);
  const cl = k < 0.12 ? nameRect(W, C.cam, 12) : null;
  /** @type {any} */ const field = {
    fade: 0.12, hazeEnd: 0.6 * D,
    chips: {
      // (wave 7, COSMOS) a third of the hall's glass: in the void the chips are a few shapes drifting at depth, not a
      // snow of confetti over the cosmos (the far dust is gone: the galaxies are the dust)
      count: ph ? 1800 : 3000,
      center: [N[0], N[1], (wallZ + front) / 2],
      size: [vw * 3.4 + 900, vh * 3.4 + 700, depth],
      wind: [6, -2.5, 7], spin: 0.32, sizes: ph ? [9, 22] : [9, 24],
      shapes: [
        // the near ones, large, a few cut by the frame's edge (in front of the name, never over it: clear)
        { shape: "A", weight: 0.1, depth: mix(fName, 1, 0.55), width: 0.05, scale: 2.7 },
        // the middle population, around and behind the name
        { shape: "A", weight: 0.42, depth: mix(fNow, fName, 0.6), width: 0.22, scale: 1 },
        // the SerSan marks deep, around Now's plate
        // (round 12, COVER3FIX) larger: under about 10 device px the mark read as a little ring
        { shape: "mark", weight: 0.12, depth: fNow, width: 0.12, scale: 2.6 },
      ],
      body: 0.045, edge: 0.4, rim: 1, bevel: 12, glint: 2.6, transmit: 0.34, near: 170, cap: 9, seed: 11,
      // (wave 7) under sixteen css px (twelve on a phone) a chip fades: a speck or a small ring over the cosmos is not glass
      floor: ph ? 12 : 16,
      clear: cl ? { rect: cl.rect, point: cl.point } : undefined,
      alpha: (0.6 + 0.4 * up) * (1 - 0.35 * sstep(0.85, 1, k)),
    },
    // (wave 7, COSMOS) THE WALL IS GONE: behind the hall's back plane the neural cosmos (stage/cosmos/web.js), the web
    // every room of the site stands in; the name's hall is its first place (the host's journey). Through the flight onto
    // Now's plate it stays (the eye flies on into it); a little brighter than a page's room, the hall being lit; the
    // keep-outs (the foot, the header) dim it to a few hundredths over a soft fall
    cosmos: {
      z: wallZ, alpha: 1, gain: 2.75, stars: 0.17, white: 0.34, far: 7.2,
      keep: { floor: ph ? 0.05 : 0.035, fall: ph ? 90 : 150, haze: 0.12 },
    },
  };
  if (!o.lights) return field;
  const fh = W.frameH, fw = W.frameW, lights = [];
  const light = (1 - 0.85 * sstep(0.72, 1, k));
  // how wide the wall is on screen at rest (world px at the wall's distance)
  const wd = (N[2] - wallZ) + W.Rd, wallW = fw * wd / W.Rd, wallH = fh * wd / W.Rd;
  // the NAME's light: from just in front of the letters along the eye's ray onto the wall behind them, a wide blade
  // whose brighter middle falls off softly to the corners; on as the letters ignite
  {
    const dir = norm(sub(N, eye)), o0 = add(N, mul(dir, -0.15 * D));
    const tw = [N[0] + dir[0] / dir[2] * (wallZ - N[2]), N[1] - 0.2 * wallH + dir[1] / dir[2] * (wallZ - N[2]), wallZ];
    const v = sub(tw, o0), dist = Math.hypot(v[0], v[1], v[2]);
    lights.push({
      pos: o0, target: tw, radius: W.sets.height * 0.8, aspect: ph ? 1.6 : 2.6, roll: 0,
      spread: Math.atan(Math.max(0, 0.42 * wallH - W.sets.height * 0.8) / dist), soft: 1,
      strength: 0.42 * light * (0.6 + 0.4 * sstep(0.1, 1.3, o.at)), tint: 0.32, length: 16000, haze: 0, wall: 0, chips: 0.35,
    });
  }
  // the two travelling blades: from high above (behind the name's plane), down at a slant onto the wall; each crosses
  // in about 20 s and comes round out of sight; half a cycle apart, so one is always on screen
  const t = o.time ?? 0;
  // (round 12, COVER3FIX) phased so that on the stage's first frame the cool one already crosses the wall right of the
  // name (where the opening's low eye looks) and the warm one is entering from the right edge
  const BL = [{ off: 0.62, tint: 0.62, s: 1.0, lean: -1, dir: 1 }, { off: 0.1, tint: 0.0, s: 0.85, lean: 1, dir: -1 }];
  for (const b of BL) {
    const p0 = fr(t / BLADE_S + b.off);
    const env = sstep(0, 0.1, p0) * (1 - sstep(0.9, 1, p0));
    const xw = N[0] + (p0 * 2 - 1) * 0.78 * wallW * b.dir;
    const target = [xw, N[1] - 0.12 * wallH, wallZ];
    const pos = [xw + b.lean * 0.55 * fw, N[1] - 3.2 * fh, W.Zn - 0.35 * D];
    lights.push({
      pos, target, radius: 0.075 * D, aspect: 2.2, roll: 0, spread: 0.03, soft: 0.75,
      // (wave 7) the key light the glass catches: no shaft, no wall to fall on
      strength: 1.25 * b.s * env * light, tint: b.tint, length: 16000, haze: 0, wall: 0, chips: 1,
    });
  }
  // the hand's blade (no pointer on a phone): from above and in front of the name, onto the wall where the hand points
  if (!ph && (o.hand ?? 0) > 0.001) {
    const a = o.aim || [0, 0];
    lights.push({
      pos: [N[0] + 0.12 * vw, N[1] - 1.5 * fh, W.Zn + 0.55 * D],
      // (round 12, COVER3FIX) never down onto the foot's band (a lit patch had reached the scroll cue)
      target: [N[0] + a[0] * 0.5 * wallW, N[1] + Math.min(a[1], 0.3) * 0.4 * wallH, wallZ],
      radius: 0.09 * D, aspect: 1.7, roll: 0.15, spread: 0.03, soft: 0.8,
      strength: 0.9 * light * (o.hand ?? 0) * up, tint: 0.1, length: 16000, haze: 0, wall: 0, chips: 1,
    });
  }
  field.lights = lights;
  return field;
}
