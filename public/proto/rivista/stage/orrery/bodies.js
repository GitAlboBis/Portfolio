// @ts-check
/**
 * bodies.js — THE ORRERY'S POINTS (wave 8, lane ORRERY): the SerSan mark and the nine bodies that turn round it in
 * "Now at SerSan", each a small figure of points in its own unit box (x right, y down, z toward the reader), in TWO
 * LAYERS as the particle mark of sersan.io is made (its recipe is in build/k-orrery.md):
 *   the cut     very fine points fused by density into faces and lines of light (a line is never a row of dots: its
 *               points run closer than one disc, jittered along it), white where the form faces the reader;
 *   the spores  larger, softer motes just off the form, each with its normal (they breathe along it and slide along
 *               the form in the shader, on the stage's clock), few large and many small.
 * The mark's geometry is the brand's own: the same crop of the end card the stage already cuts for its chips
 * (stage/field/atlas.js) and its splats (stage/splat/gen.js), never redrawn by eye.
 *
 * A point is REC floats: x y z, size (sigma, in units) | nx ny nz (a spore's normal; a scattered point's offset), ink
 * (peak optical depth) | white (0 the swarm's cobalt … 1 paper white), u (its place along a path, for a glint), seed,
 * flags (body + 16 kind + 128 part). (run B) Every point also carries a RANK in [0, 1), given by what it belongs to so
 * that the points under ANY rank are a fair sample of it: along a line the golden rotation of its own index (the kept
 * points are never more than two steps apart), in a fill or a batch of motes the order they were made in (a prefix of
 * a low-discrepancy sequence is one). A tier draws the points under its share: A all, B 56 %, C 40 % (of a fill fewer:
 * its wider points cover a face sooner than they close a line); a lower tier is a
 * part of the higher. (Run A took a golden step over a body's whole list: for some lengths that keeps runs of twenty
 * points and drops sixteen, and a phone's tier drew dashes.)
 * Nothing here touches the GPU or the DOM beyond one OffscreenCanvas for the mark's mask; it is built in slices.
 */

export const REC = 12;
export const KIND = Object.freeze({ cut: 0, spore: 1, path: 2 });
/** what moves inside a body (orrery.wgsl.js reads it per body) */
export const MODE = Object.freeze({ still: 0, apart: 1, stack: 2, clap: 3, resolve: 4, glint: 5, blink: 6, mark: 7 });
export const TIER_SHARE = Object.freeze({ A: 1, B: 0.56, C: 0.4 });
/** a fill's rank: a tier's points are wider (orrery.js tierSize), so a face is covered by fewer of them than a line needs */
const fillRank = (/** @type {number} */ u) => Math.pow(u, 1 / 1.8);

const PHI = 0.6180339887498949;
const G2 = 1.324717957244746, A21 = 1 / G2, A22 = 1 / (G2 * G2);
const fr = (/** @type {number} */ x) => x - Math.floor(x);
/** a deterministic hash of an integer to [0, 1) */
const hash = (/** @type {number} */ n) => { let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const tick = () => new Promise((r) => setTimeout(r, 0));

/** a line's sigma in units (a body's box is about 74 css px at 1440: 0.9 px), and its points per unit of length */
const SZ = 0.0122, DENS = 92;

/** @typedef {{ dens?: number, size?: number, ink?: number, white?: number, part?: number, kind?: number, u?: number, u0?: number, u1?: number, jit?: number, n?: number[], rank?: number }} Opt */

/** a body's points, as they are made */
class PSet {
  constructor() { /** @type {number[]} */ this.d = []; /** @type {number[]} */ this.rk = []; this.n = 0; this.seed = 17; }
  /** @param {number[]} p @param {number} size @param {number} ink @param {number} white @param {Opt} [o] */
  put(p, size, ink, white, o = {}) {
    const nr = o.n || [0, 0, 0];
    this.d.push(p[0], p[1], p[2], size, nr[0], nr[1], nr[2], ink, white, o.u ?? 0, hash(this.seed++ * 7919 + 3), (o.kind || 0) * 16 + (o.part || 0) * 128);
    this.rk.push(o.rank ?? hash(this.n * 131 + 977));
    this.n++;
  }
  /** a line of light from a to b: an even run with under one step of jitter along it and a third of a disc across
   *  @param {number[]} a @param {number[]} b @param {Opt} [o] */
  line(a, b, o = {}) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz);
    const n = Math.max(2, Math.round(L * (o.dens ?? DENS))), size = o.size ?? SZ, jit = (o.jit ?? 0.34) * size, s0 = this.seed;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5 + (hash(s0 + i * 5) - 0.5) * 0.9) / n;
      const u = o.u0 != null && o.u1 != null ? o.u0 + (o.u1 - o.u0) * t : o.u ?? 0;
      this.put([a[0] + dx * t + (hash(s0 + i * 5 + 1) - 0.5) * jit, a[1] + dy * t + (hash(s0 + i * 5 + 2) - 0.5) * jit, a[2] + dz * t + (hash(s0 + i * 5 + 3) - 0.5) * jit],
        size * (0.86 + 0.28 * hash(s0 + i * 5 + 4)), o.ink ?? 0.34, o.white ?? 0.5, { ...o, u, rank: fr((i + 0.5) * PHI + hash(s0 + 9)) });
    }
    this.seed += n * 5 + 11;
  }
  /** lines through pts (closed: back to the first) @param {number[][]} pts @param {Opt} [o] */
  poly(pts, o = {}, closed = true) { for (let i = 0; i < (closed ? pts.length : pts.length - 1); i++) this.line(pts[i], pts[(i + 1) % pts.length], o); }
  /** a parallelogram filled evenly (the R2 sequence): c a corner, e and f its edges @param {number[]} c @param {number[]} e @param {number[]} f @param {number} n @param {Opt} [o] */
  fill(c, e, f, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const s = fr(0.5 + (this.seed + i) * A21), t = fr(0.5 + (this.seed + i) * A22);
      this.put([c[0] + e[0] * s + f[0] * t, c[1] + e[1] * s + f[1] * t, c[2] + e[2] * s + f[2] * t], (o.size ?? SZ) * 1.15, o.ink ?? 0.08, o.white ?? 0.3, { ...o, rank: fillRank((i + 0.5) / n) });
    }
    this.seed += n + 7;
  }
  /** the twelve edges of a box @param {number[]} c its centre @param {number[]} h its half sizes @param {Opt} [o] */
  box(c, h, o = {}) {
    const v = (/** @type {number} */ i) => [c[0] + (i & 1 ? h[0] : -h[0]), c[1] + (i & 2 ? h[1] : -h[1]), c[2] + (i & 4 ? h[2] : -h[2])];
    for (let i = 0; i < 8; i++) for (const b of [1, 2, 4]) if (!(i & b)) this.line(v(i), v(i | b), o);
  }
  /** a flat outline at depth z, and the same at z - t behind it with the short edges between: a thin plate
   *  @param {number[][]} xy @param {number} z @param {number} t @param {Opt} [o] */
  plate(xy, z, t, o = {}) {
    const f = xy.map((p) => [p[0], p[1], z]), b = xy.map((p) => [p[0], p[1], z - t]);
    this.poly(f, o);
    this.poly(b, { ...o, ink: (o.ink ?? 0.34) * 0.5, white: (o.white ?? 0.5) * 0.4, dens: (o.dens ?? DENS) * 0.55 });
    for (let i = 0; i < f.length; i++) this.line(f[i], b[i], { ...o, ink: (o.ink ?? 0.34) * 0.7, dens: (o.dens ?? DENS) * 0.8 });
  }
  /** the spores of what is made so far: n motes, each just off a point of the cut, away from the centre c, few large
   *  and many small @param {number} n @param {{ c?: number[], off?: number, size?: number, from?: number, to?: number, ink?: number }} [o] */
  spores(n, o = {}) {
    const c = o.c || [0, 0, 0], from = o.from ?? 0, to = o.to ?? this.n, s0 = this.seed;
    for (let i = 0; i < n && to > from; i++) {
      const j = from + Math.floor(fr(0.5 + i * PHI) * (to - from)), k = j * REC;
      const p = [this.d[k], this.d[k + 1], this.d[k + 2]];
      // away from the centre, loosened a little so the motes do not stand in rows
      let nx = p[0] - c[0] + (hash(s0 + i * 7) - 0.5) * 0.5, ny = p[1] - c[1] + (hash(s0 + i * 7 + 1) - 0.5) * 0.5, nz = p[2] - c[2] + (hash(s0 + i * 7 + 2) - 0.5) * 0.7;
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const h = hash(s0 + i * 7 + 3), big = Math.pow(h, 5), off = (o.off ?? 0.05) * (0.45 + 1.1 * hash(s0 + i * 7 + 4));
      const fl = this.d[k + 11], part = Math.floor(fl / 128);
      this.put([p[0] + nx * off, p[1] + ny * off, p[2] + nz * off], (o.size ?? 0.015) * (0.78 + 1.7 * big), (o.ink ?? 0.15) / (1 + 2.2 * big), 0.04 + 0.2 * hash(s0 + i * 7 + 5),
        { kind: KIND.spore, part, n: [nx, ny, nz], u: hash(s0 + i * 7 + 6), rank: (i + 0.5) / n });
    }
    this.seed += n * 7 + 5;
  }
}

/* ================================================================ the nine bodies (their order and names are fixed) */

/** FULL-STACK SOFTWARE: three square slabs stacked with gaps, seen as layers (the top one the hottest) */
function stack() {
  const s = new PSet(), h = 0.4, th = 0.045;
  [-0.27, 0, 0.27].forEach((y, k) => {
    const white = [0.95, 0.5, 0.18][k], ink = [0.42, 0.32, 0.26][k], o = { part: k, white, ink, dens: 70 };
    const top = [[-h, y - th, -h], [h, y - th, -h], [h, y - th, h], [-h, y - th, h]], bot = top.map((p) => [p[0], y + th, p[2]]);
    s.poly(top, o); s.poly(bot, { ...o, ink: ink * 0.7 });
    for (let i = 0; i < 4; i++) s.line(top[i], bot[i], o);
    s.fill([-h, y - th, -h], [2 * h, 0, 0], [0, 0, 2 * h], 170, { part: k, white: white * 0.6, ink: 0.065 });
  });
  s.spores(300, { off: 0.05 });
  return s;
}

/** 3D & WEBGPU: a cube inside a cube with its eight links (it turns fully) */
function tess() {
  const s = new PSet(), a = 0.4, b = 0.19;
  s.box([0, 0, 0], [a, a, a], { white: 0.42, ink: 0.34, dens: 84 });
  const n0 = s.n;
  s.box([0, 0, 0], [b, b, b], { white: 1, ink: 0.44, dens: 112 });
  for (let i = 0; i < 8; i++) { const g = [i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1]; s.line(g.map((v) => v * b), g.map((v) => v * a), { white: 0.22, ink: 0.22, dens: 80 }); }
  // the inner cube holds a little light on its faces
  for (const ax of [0, 1, 2]) for (const sg of [-1, 1]) {
    const c = [-b, -b, -b], e = [0, 0, 0], f = [0, 0, 0];
    c[ax] = sg * b; e[(ax + 1) % 3] = 2 * b; f[(ax + 2) % 3] = 2 * b;
    s.fill(c, e, f, 58, { white: 0.7, ink: 0.06 });
  }
  s.spores(300, { off: 0.055, to: n0 });
  return s;
}

/** REVERSE ENGINEERING: a cube taken apart into its eight blocks (the gap breathes in the shader), one pulled further out */
function apart() {
  const s = new PSet(), h = 0.165, PULL = 5;
  for (let oc = 0; oc < 8; oc++) {
    const g = [oc & 1 ? 1 : -1, oc & 2 ? 1 : -1, oc & 4 ? 1 : -1], c = g.map((v) => v * 0.2), pulled = oc === PULL, part = oc | (pulled ? 8 : 0);
    s.box(c, [h, h, h], { part, white: pulled ? 1 : 0.32, ink: pulled ? 0.46 : 0.27, dens: 58 });
    if (pulled) for (const ax of [0, 1, 2]) for (const sg of [-1, 1]) {
      const q = [c[0] - h, c[1] - h, c[2] - h], e = [0, 0, 0], f = [0, 0, 0];
      q[ax] = c[ax] + sg * h; e[(ax + 1) % 3] = 2 * h; f[(ax + 2) % 3] = 2 * h;
      s.fill(q, e, f, 42, { part, white: 0.85, ink: 0.07 });
    }
  }
  s.spores(290, { off: 0.045 });
  return s;
}

/** MULTI-AGENT SYSTEMS: six small faceted nodes in space joined by lines; a glint hops the tour from node to node */
function agents() {
  const s = new PSet();
  const N = [[-0.42, -0.08, 0.12], [-0.08, -0.42, -0.18], [0.38, -0.24, 0.16], [0.42, 0.2, -0.12], [0.04, 0.42, 0.2], [-0.32, 0.3, -0.24]];
  for (let j = 0; j < 6; j++) s.line(N[j], N[(j + 1) % 6], { kind: KIND.path, u0: j / 6, u1: (j + 1) / 6, white: 0.25, ink: 0.24, dens: 120 });
  for (const [i, j] of [[0, 3], [1, 4], [2, 5]]) s.line(N[i], N[j], { white: 0.1, ink: 0.15, dens: 78 });
  const n0 = s.n, r = 0.088;
  N.forEach((c, j) => {
    // a node: an octahedron of light and a hot core that takes the glint as it lands
    const v = [[r, 0, 0], [-r, 0, 0], [0, r, 0], [0, -r, 0], [0, 0, r], [0, 0, -r]].map((p) => [c[0] + p[0], c[1] + p[1], c[2] + p[2]]);
    for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) if ((a >> 1) !== (b >> 1)) s.line(v[a], v[b], { kind: KIND.path, u: j / 6, white: 0.85, ink: 0.3, dens: 108 });
    for (let i = 0; i < 26; i++) s.put([c[0] + (hash(j * 97 + i * 3) - 0.5) * r * 0.7, c[1] + (hash(j * 97 + i * 3 + 1) - 0.5) * r * 0.7, c[2] + (hash(j * 97 + i * 3 + 2) - 0.5) * r * 0.7], SZ * 1.2, 0.3, 1, { kind: KIND.path, u: j / 6 });
  });
  s.spores(280, { off: 0.04, from: n0 });
  return s;
}

/** BUSINESS AUTOMATION: three steps on a rising line, a box, a diamond, a box, joined by lines; a glint runs the chain */
function chain() {
  const s = new PSet(), t = 0.1, P = KIND.path;
  const rect = (/** @type {number} */ cx, /** @type {number} */ cy, /** @type {number} */ hw, /** @type {number} */ hh) => [[cx - hw, cy - hh], [cx + hw, cy - hh], [cx + hw, cy + hh], [cx - hw, cy + hh]];
  const A = [-0.32, 0.27], M = [0, 0], B = [0.32, -0.27], hw = 0.16, hh = 0.1, dm = 0.15;
  s.plate(rect(A[0], A[1], hw, hh), 0.05, t, { kind: P, u: 0.06, white: 0.7, ink: 0.36, dens: 150 });
  s.fill([A[0] - hw, A[1] - hh, 0.05], [2 * hw, 0, 0], [0, 2 * hh, 0], 90, { kind: P, u: 0.06, white: 0.5, ink: 0.06 });
  s.plate([[M[0] - dm, M[1]], [M[0], M[1] - dm], [M[0] + dm, M[1]], [M[0], M[1] + dm]], 0.05, t, { kind: P, u: 0.5, white: 1, ink: 0.4, dens: 150 });
  s.fill([M[0] - dm, M[1], 0.05], [dm, -dm, 0], [dm, dm, 0], 80, { kind: P, u: 0.5, white: 0.8, ink: 0.06 });
  s.plate(rect(B[0], B[1], hw, hh), 0.05, t, { kind: P, u: 0.94, white: 0.7, ink: 0.36, dens: 150 });
  s.fill([B[0] - hw, B[1] - hh, 0.05], [2 * hw, 0, 0], [0, 2 * hh, 0], 90, { kind: P, u: 0.94, white: 0.5, ink: 0.06 });
  // the joins: square elbows, as a flow is drawn (two strands each: a bold line)
  const z = 0;
  for (let strand = 0; strand < 2; strand++) {
    const o = { kind: P, white: 0.35, ink: 0.26, dens: 190, jit: 0.9 };
    s.line([A[0] + hw, A[1], z], [M[0], A[1], z], { ...o, u0: 0.14, u1: 0.3 });
    s.line([M[0], A[1], z], [M[0], M[1] + dm, z], { ...o, u0: 0.3, u1: 0.42 });
    s.line([M[0] + dm, M[1], z], [B[0], M[1], z], { ...o, u0: 0.58, u1: 0.74 });
    s.line([B[0], M[1], z], [B[0], B[1] + hh, z], { ...o, u0: 0.74, u1: 0.86 });
  }
  s.spores(270, { off: 0.045 });
  return s;
}

/** CLAUDE CODE PRACTICE: a terminal, a thin window with its top bar, a prompt chevron and a cursor block (it blinks) */
function term() {
  const s = new PSet(), w = 0.46, h = 0.34, bar = -h + 0.13;
  s.plate([[-w, -h], [w, -h], [w, h], [-w, h]], 0, 0.07, { white: 0.7, ink: 0.36, dens: 165 });
  const n0 = s.n;
  s.line([-w, bar, 0], [w, bar, 0], { white: 0.6, ink: 0.3, dens: 150 });
  s.fill([-w, -h, 0], [2 * w, 0, 0], [0, 0.13, 0], 210, { white: 0.45, ink: 0.075 });
  s.line([-0.4, -h + 0.065, 0], [-0.2, -h + 0.065, 0], { white: 1, ink: 0.34, dens: 200 });
  // what was printed before (two quiet lines), then the prompt: a chevron and the cursor
  s.line([-0.36, -0.1, 0], [0.16, -0.1, 0], { white: 0.15, ink: 0.2, dens: 130 });
  s.line([-0.36, 0.0, 0], [0.3, 0.0, 0], { white: 0.15, ink: 0.2, dens: 130 });
  for (let strand = 0; strand < 2; strand++) { s.line([-0.36, 0.085, 0], [-0.27, 0.15, 0], { white: 1, ink: 0.36, dens: 250, jit: 0.8 }); s.line([-0.27, 0.15, 0], [-0.36, 0.215, 0], { white: 1, ink: 0.36, dens: 250, jit: 0.8 }); }
  const cx = -0.2, cy = 0.08, cw = 0.09, ch = 0.14;
  s.fill([cx, cy, 0.01], [cw, 0, 0], [0, ch, 0], 150, { part: 1, white: 1, ink: 0.3 });
  s.poly([[cx, cy, 0.01], [cx + cw, cy, 0.01], [cx + cw, cy + ch, 0.01], [cx, cy + ch, 0.01]], { part: 1, white: 1, ink: 0.3, dens: 190 });
  s.spores(260, { off: 0.045, to: n0 });
  return s;
}

/** the clapper's hinge (the stick turns about it in the shader) */
export const CLAP_HINGE = Object.freeze([-0.42, -0.11]);
/** VIDEO EDITING: a clapperboard, the slate and its striped stick open at about 20 degrees (it claps now and then) */
function clap() {
  const s = new PSet(), w = 0.42, y0 = 0, y1 = 0.46, hb = 0.11;
  s.plate([[-w, y0], [w, y0], [w, y1], [-w, y1]], 0, 0.06, { white: 0.6, ink: 0.34, dens: 150 });
  s.line([-0.34, 0.16, 0], [0.34, 0.16, 0], { white: 0.12, ink: 0.18, dens: 110 });
  s.line([-0.34, 0.31, 0], [0.34, 0.31, 0], { white: 0.12, ink: 0.18, dens: 110 });
  // two bars with slanted bands of light: the one on the slate, and the stick above it (part 1), lying shut here
  const bar = (/** @type {number} */ ya, /** @type {number} */ part) => {
    const yb = ya + hb;
    s.poly([[-w, ya, 0], [w, ya, 0], [w, yb, 0], [-w, yb, 0]], { part, white: 0.85, ink: 0.36, dens: 150 });
    for (let j = 0; j < 4; j++) {
      const x = -w + 0.03 + j * 0.21;
      s.fill([x, yb, 0], [0.105, 0, 0], [hb * 0.85, -hb, 0], 50, { part, white: 1, ink: 0.13 });
    }
  };
  bar(y0 - hb, 0); bar(y0 - 2 * hb, 1);
  s.spores(260, { off: 0.045, c: [0, 0.12, 0] });
  return s;
}

/** MOTION DESIGN: an easing curve between two keyframe diamonds, with its two straight handles; a glint rides it */
function curve() {
  const s = new PSet(), P = KIND.path;
  const K0 = [-0.4, 0.3], K1 = [0.4, -0.3], C0 = [-0.02, 0.3], C1 = [0.02, -0.3];
  const bz = (/** @type {number} */ t) => { const m = 1 - t; return [m * m * m * K0[0] + 3 * m * m * t * C0[0] + 3 * m * t * t * C1[0] + t * t * t * K1[0], m * m * m * K0[1] + 3 * m * m * t * C0[1] + 3 * m * t * t * C1[1] + t * t * t * K1[1]]; };
  // the axes behind, quiet
  s.line([-0.46, -0.42, -0.06], [-0.46, 0.42, -0.06], { white: 0.08, ink: 0.17, dens: 105 });
  s.line([-0.46, 0.42, -0.06], [0.46, 0.42, -0.06], { white: 0.08, ink: 0.17, dens: 105 });
  for (let j = 1; j <= 5; j++) s.line([-0.46 + j * 0.172, 0.42, -0.06], [-0.46 + j * 0.172, 0.385, -0.06], { white: 0.1, ink: 0.18, dens: 200 });
  // the curve: short pieces of an even length, so the run of points is even along it
  const N = 96; let prev = bz(0);
  for (let i = 1; i <= N; i++) { const q = bz(i / N); s.line([prev[0], prev[1], 0], [q[0], q[1], 0], { kind: P, u0: (i - 1) / N, u1: i / N, white: 0.75, ink: 0.3, dens: 460, jit: 1.5 }); prev = q; }
  const n1 = s.n;
  for (const [K, Cp, u] of [[K0, C0, 0], [K1, C1, 1]]) {
    s.line([K[0], K[1], 0.02], [Cp[0], Cp[1], 0.02], { white: 0.35, ink: 0.24, dens: 150 });
    const e = 0.032;
    s.poly([[Cp[0] - e, Cp[1] - e, 0.02], [Cp[0] + e, Cp[1] - e, 0.02], [Cp[0] + e, Cp[1] + e, 0.02], [Cp[0] - e, Cp[1] + e, 0.02]], { white: 0.8, ink: 0.3, dens: 220 });
    const d = 0.078;
    s.poly([[K[0] - d, K[1], 0.05], [K[0], K[1] - d, 0.05], [K[0] + d, K[1], 0.05], [K[0], K[1] + d, 0.05]], { kind: P, u, white: 1, ink: 0.36, dens: 260 });
    s.fill([K[0] - d, K[1], 0.05], [d, -d, 0], [d, d, 0], 120, { kind: P, u, white: 1, ink: 0.16 });
  }
  s.spores(260, { off: 0.04, to: n1 });
  return s;
}

/** AI-GENERATED CONTENT: a frame whose one side is scattered points that resolve into ordered rows across it */
function gen() {
  const s = new PSet(), w = 0.45, h = 0.33;
  s.plate([[-w, -h], [w, -h], [w, h], [-w, h]], 0, 0.06, { white: 0.6, ink: 0.34, dens: 150 });
  const n0 = s.n, ROWS = 10, PER = 104;
  for (let r = 0; r < ROWS; r++) {
    const y = -0.25 + r * (0.5 / (ROWS - 1));
    for (let i = 0; i < PER; i++) {
      const k = r * PER + i, x = -0.39 + 0.78 * (i + 0.5 + (hash(k * 3 + 1) - 0.5) * 0.9) / PER;
      // where it stands before it resolves: thrown about the frame's own air
      const off = [(hash(k * 3 + 2) - 0.5) * 0.3, (hash(k * 3 + 3) - 0.5) * 0.42 - (y * 0.35), (hash(k * 3 + 4) - 0.5) * 0.5];
      s.put([x, y, 0], SZ * (0.86 + 0.28 * hash(k * 3 + 5)), 0.3, 0.55, { part: 1, n: off, rank: fr((k + 0.5) * PHI) });
    }
  }
  s.spores(260, { off: 0.045, to: n0 });
  return s;
}

/** the nine, in their fixed order: shell 0 engineering, 1 AI systems, 2 creative (three each) */
export const BODIES = Object.freeze([
  { id: "stack", shell: 0, mode: MODE.stack, make: stack },
  { id: "tess", shell: 0, mode: MODE.still, make: tess },
  { id: "apart", shell: 0, mode: MODE.apart, make: apart },
  { id: "agents", shell: 1, mode: MODE.glint, make: agents },
  { id: "chain", shell: 1, mode: MODE.glint, make: chain },
  { id: "term", shell: 1, mode: MODE.blink, make: term },
  { id: "clap", shell: 2, mode: MODE.clap, make: clap },
  { id: "curve", shell: 2, mode: MODE.glint, make: curve },
  { id: "gen", shell: 2, mode: MODE.resolve, make: gen },
]);

/* ================================================================ the mark */

/** the mark's depth behind each half's face, and how far the two halves stand apart (units: its height is 1) */
const M_DEPTH = 0.32, M_GAP = 0.045;
/** how far a grain's own facet leans off its face (the tangent's span): the key light picks a few out as the mark turns */
const FACET = 0.9;

/** bilinear alpha of a mask @param {Float32Array} a @param {number} W @param {number} x @param {number} y */
function at(a, W, x, y) {
  const x0 = Math.floor(x - 0.5), y0 = Math.floor(y - 0.5), tx = x - 0.5 - x0, ty = y - 0.5 - y0;
  const g = (/** @type {number} */ i, /** @type {number} */ j) => (i < 0 || j < 0 || i >= W || j >= W ? 0 : a[j * W + i]);
  return (g(x0, y0) * (1 - tx) + g(x0 + 1, y0) * tx) * (1 - ty) + (g(x0, y0 + 1) * (1 - tx) + g(x0 + 1, y0 + 1) * tx) * ty;
}
/** the 0.5 contour of a mask as segments, pixel centres at +0.5 (marching squares, as cover/world.js) @param {Float32Array} a @param {number} W */
function contour(a, W) {
  /** @type {number[][]} */ const segs = [];
  for (let j = 0; j < W - 1; j++) for (let i = 0; i < W - 1; i++) {
    const p = a[j * W + i] - 0.5, q = a[j * W + i + 1] - 0.5, r = a[(j + 1) * W + i + 1] - 0.5, t = a[(j + 1) * W + i] - 0.5;
    const k = (p > 0 ? 1 : 0) | (q > 0 ? 2 : 0) | (r > 0 ? 4 : 0) | (t > 0 ? 8 : 0);
    if (k === 0 || k === 15) continue;
    const e = [];
    if ((p > 0) !== (q > 0)) e.push([i + 0.5 + p / (p - q), j + 0.5]);
    if ((q > 0) !== (r > 0)) e.push([i + 1.5, j + 0.5 + q / (q - r)]);
    if ((t > 0) !== (r > 0)) e.push([i + 0.5 + t / (t - r), j + 1.5]);
    if ((p > 0) !== (t > 0)) e.push([i + 0.5, j + 0.5 + p / (p - t)]);
    if (e.length === 2) segs.push([e[0][0], e[0][1], e[1][0], e[1][1]]);
    else if (e.length === 4) { segs.push([e[0][0], e[0][1], e[3][0], e[3][1]]); segs.push([e[1][0], e[1][1], e[2][0], e[2][1]]); }
  }
  return segs;
}
/** n points along the segments, evenly by running length, each with the contour's outward normal
 *  @param {number[][]} segs @param {number} n @param {number} phase @param {Float32Array} a @param {number} W */
function along(segs, n, phase, a, W) {
  const len = segs.reduce((s, q) => s + Math.hypot(q[2] - q[0], q[3] - q[1]), 0), step = len / Math.max(1, n);
  /** @type {number[][]} */ const pts = [];
  let acc = phase * step;
  for (const s of segs) {
    const sl = Math.hypot(s[2] - s[0], s[3] - s[1]);
    if (sl < 1e-6) continue;
    let nx = (s[3] - s[1]) / sl, ny = -(s[2] - s[0]) / sl;
    const mx = (s[0] + s[2]) / 2, my = (s[1] + s[3]) / 2;
    if (at(a, W, mx + nx * 1.5, my + ny * 1.5) > at(a, W, mx - nx * 1.5, my - ny * 1.5)) { nx = -nx; ny = -ny; }
    while (acc < sl) { const t = acc / sl; pts.push([s[0] + (s[2] - s[0]) * t, s[1] + (s[3] - s[1]) * t, nx, ny]); acc += step; }
    acc -= sl;
  }
  return pts;
}

/**
 * THE MARK, in two layers. (the lead, 22 Nov: Alberto, «per il logo puoi fare di meglio») It is A SOLID OF GRAINS now,
 * lit by one key light (orrery.wgsl.js): every grain of the cut carries a NORMAL. The cut: each half's face (an even
 * fill kept one disc inside its outline, each grain a facet a little off the face's own, so the key light picks a few
 * out and the pick moves as the mark turns), the cut edge (a chamfer between the face and the wall: bright where it
 * faces the light, dark where it faces away), and the side walls (a sheet of grains from the edge back to M_DEPTH with
 * the contour's outward normal: seen only from the side they face, light or deep cobalt by the side). The white half
 * is the hot one and a step nearer, the blue half the swarm's cobalt a step behind. The spores: the crust, motes proud
 * of the faces and of the walls by about one of their own radii, that the hand blows off the form.
 */
async function mark() {
  const url = new URL("../../../../captures/sersan-brand-end-1600.webp", import.meta.url).href;
  const img = await createImageBitmap(await (await fetch(url)).blob());
  const W = 480;
  const cv = new OffscreenCanvas(W, W), g = /** @type {OffscreenCanvasRenderingContext2D} */ (cv.getContext("2d", { willReadFrequently: true }));
  // the same crop as stage/field/atlas.js and stage/splat/gen.js (the end card's mark), twice its size
  g.drawImage(img, 646 + 33, 166 + 26, 240, 240, 0, 0, W, W);
  const px = g.getImageData(0, 0, W, W).data;
  const G = [14, 33, 61];
  const raw = [new Float32Array(W * W), new Float32Array(W * W)];
  let x0 = W, x1 = 0, y0 = W, y1 = 0;
  for (let i = 0; i < W * W; i++) {
    const r = px[i * 4], gg = px[i * 4 + 1], b = px[i * 4 + 2];
    if (Math.hypot(r - G[0], gg - G[1], b - G[2]) <= 120) continue;
    const tone = (0.2126 * r + 0.7152 * gg + 0.0722 * b) / 255 > 0.62 && b - r < 60;
    raw[tone ? 0 : 1][i] = 1;
    const x = i % W, y = (i / W) | 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  await tick();
  // a soft edge for the contour (a 3 x 3 box): its crossings then fall between the pixels, not on their steps
  const masks = raw.map((m) => { const o = new Float32Array(W * W); for (let y = 1; y < W - 1; y++) for (let x = 1; x < W - 1; x++) { let v = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) v += m[(y + j) * W + x + i]; o[y * W + x] = v / 9; } return o; });
  await tick();
  const H = y1 - y0 + 1, cx = (x0 + x1 + 1) / 2, cy = (y0 + y1 + 1) / 2;
  const X = (/** @type {number} */ x) => (x - cx) / H, Y = (/** @type {number} */ y) => (y - cy) / H;
  const s = new PSet();
  const FILL = [6200, 5400], BEV = 2200, WALL = [5600, 5200], SP_FACE = 1000, SP_WALL = 1300;
  let rr = 0;
  for (const half of [0, 1]) {
    const a = masks[half], zf = half ? -M_GAP : M_GAP;
    const segs = contour(a, W);
    await tick();
    let area = 0; for (let i = 0; i < W * W; i++) if (a[i] >= 0.5) area++;
    const sp = Math.sqrt(area / FILL[half]), ero = 0.55 * sp, sig = 0.8 * sp / H;
    const inside = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ e) => at(a, W, x, y) >= 0.5 && at(a, W, x + e, y) >= 0.5 && at(a, W, x - e, y) >= 0.5 && at(a, W, x, y + e) >= 0.5 && at(a, W, x, y - e) >= 0.5;
    // the face: the white half is the hot one; the blue half is the swarm's own cobalt with a lit edge
    const n = Math.ceil((x1 - x0 + 1) * H * FILL[half] / area);
    for (let i = 0, got = 0; i < n; i++, rr++) {
      const x = x0 + fr(0.5 + rr * A21) * (x1 - x0 + 1), y = y0 + fr(0.5 + rr * A22) * H;
      if (inside(x, y, ero)) {
        // the grain's facet: a normal a little off the face's own
        const jx = (hash(rr * 3 + 11) - 0.5) * FACET, jy = (hash(rr * 3 + 12) - 0.5) * FACET, jl = Math.hypot(jx, jy, 1);
        s.put([X(x), Y(y), zf], sig, half ? 0.085 : 0.09, half ? 0 : 1, { part: half, n: [jx / jl, jy / jl, 1 / jl], rank: fillRank(Math.min(0.9999, (got + 0.5) / FILL[half])) }); got++;
      }
    }
    // the cut edge: a chamfer half a grain inside the outline and a hair behind the face, its normal between the
    // face's and the wall's
    along(segs, BEV, 0.5, a, W).forEach((p, j) => s.put([X(p[0] - p[2] * 0.5 * sp), Y(p[1] - p[3] * 0.5 * sp), zf - 0.005], sig * 0.95, half ? 0.2 : 0.22, half ? 0.4 : 1,
      { part: half, n: [p[2] * 0.8, p[3] * 0.8, 0.6], rank: fr((j + 0.5) * PHI) }));
    await tick();
    // the side walls: a sheet of grains (their place along the outline and their depth an even pair), dimmer toward the back
    along(segs, WALL[half], 0.37, a, W).forEach((p, j) => {
      // (an even pair alone drew ridges across the wall, a fingerprint: each depth a little off its even place)
      const dz = Math.pow(Math.min(1, Math.max(0, fr(0.5 + j * PHI) + (hash(j * 7 + 31 + half * 977) - 0.5) * 0.36)), 0.85);
      s.put([X(p[0]), Y(p[1]), zf - 0.012 - (M_DEPTH - 0.012) * dz], sig * 1.05, 0.25 * (1 - 0.5 * dz), 0.1, { part: half, n: [p[2], p[3], 0], rank: fr((j + 0.5) * A21 + 0.13) });
    });
    await tick();
    // the spores: over the face (their normal toward the reader) and off the side walls (the contour's outward normal)
    const S0 = 0.0085, s0 = 9000 + half * 5000;
    for (let i = 0, got = 0; got < SP_FACE && i < SP_FACE * 6; i++) {
      const x = x0 + fr(0.37 + (rr + i) * A21) * (x1 - x0 + 1), y = y0 + fr(0.71 + (rr + i) * A22) * H;
      if (!inside(x, y, 0)) continue;
      const h5 = Math.pow(hash(s0 + i * 5), 5), off = 0.03 * (0.8 + 1.6 * hash(s0 + i * 5 + 1));
      s.put([X(x), Y(y), zf + off], S0 * (0.78 + 1.75 * h5), 0.16 / (1 + 2.2 * h5), 0.2 + 0.35 * hash(s0 + i * 5 + 2), { kind: KIND.spore, part: half, n: [0, 0, 1], u: hash(s0 + i * 5 + 3), rank: (got + 0.5) / SP_FACE });
      got++;
    }
    rr += SP_FACE * 6;
    const wall = along(segs, SP_WALL, 0.25, a, W);
    wall.forEach((p, i) => {
      const h5 = Math.pow(hash(s0 + 70000 + i * 5), 5), off = 0.03 * (0.8 + 2.4 * Math.pow(hash(s0 + 70000 + i * 5 + 1), 1.4)), nx = p[2], ny = p[3];
      const z = zf - M_DEPTH * Math.pow(hash(s0 + 70000 + i * 5 + 4), 1.5);
      s.put([X(p[0]) + nx * off, Y(p[1]) + ny * off, z], S0 * (0.78 + 1.75 * h5), 0.16 / (1 + 2.2 * h5), 0.1 + 0.3 * hash(s0 + 70000 + i * 5 + 2), { kind: KIND.spore, part: half, n: [nx, ny, 0], u: hash(s0 + 70000 + i * 5 + 3), rank: fr((i + 0.5) * PHI + 0.3) });
    });
    await tick();
  }
  return { set: s, aspect: (x1 - x0 + 1) / H };
}

/* ================================================================ the hulls (run B)
 * What a figure's box on screen is made of (layout.js orreryBoxes): the points that reach furthest in 128 directions,
 * taken over the whole of what moves inside the figure (orrery.wgsl.js, orrery.js anim()), so a box holds everything
 * the figure ever draws, however it stands. */
/** how far what moves inside a body goes: the apart cube's widest gap and its pulled block's share, the stack's
 *  gaps, the clapper's stick wide open (rad). orrery.js anim() stays inside these. */
export const MOVES = Object.freeze({ apart: 0.095, pull: 2.3, stack: 0.035, clap: 0.36 });
const HULL_DIRS = (() => {
  /** @type {number[][]} */ const out = [];
  for (let i = 0; i < 128; i++) { const y = 1 - (2 * (i + 0.5)) / 128, r = Math.sqrt(1 - y * y), a = i * 2.399963229728653; out.push([r * Math.cos(a), y, r * Math.sin(a)]); }
  return out;
})();
/** a hull being gathered: add(from, to) takes a run of the points, done() gives the xyz of the furthest ones
 *  @param {number[]} d REC floats a point @param {string} id the figure */
function hullAcc(d, id) {
  const K = HULL_DIRS.length, best = new Float64Array(K).fill(-1e9), pick = new Float32Array(K * 3);
  const take = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ z) => {
    for (let k = 0; k < K; k++) { const q = HULL_DIRS[k], v = q[0] * x + q[1] * y + q[2] * z; if (v > best[k]) { best[k] = v; pick[k * 3] = x; pick[k * 3 + 1] = y; pick[k * 3 + 2] = z; } }
  };
  return {
    add(/** @type {number} */ from, /** @type {number} */ to) {
      for (let i = from; i < to; i++) {
        const o = i * REC, x = d[o], y = d[o + 1], z = d[o + 2], fl = d[o + 11] | 0, kind = (fl >> 4) & 7, part = (fl >> 7) & 31;
        if (id === "apart") {
          const m = MOVES.apart * (part & 8 ? MOVES.pull : 1);
          take(x + (part & 1 ? m : -m), y + (part & 2 ? m : -m), z + (part & 4 ? m : -m));
        } else if (id === "stack") { take(x, y + (part - 1) * MOVES.stack, z); take(x, y - (part - 1) * MOVES.stack, z); }
        else if (id === "clap" && part === 1) {
          for (let k = 0; k <= 3; k++) { const a = (MOVES.clap * k) / 3, dx = x - CLAP_HINGE[0], dy = y - CLAP_HINGE[1]; take(CLAP_HINGE[0] + dx * Math.cos(a) + dy * Math.sin(a), CLAP_HINGE[1] - dx * Math.sin(a) + dy * Math.cos(a), z); }
        } else if (id === "gen" && kind === 0 && part === 1) { take(x, y, z); take(x + d[o + 4], y + d[o + 5], z + d[o + 6]); }
        else take(x, y, z);
      }
    },
    done: () => pick,
  };
}
/** a body's hull, at once (the nine are a few thousand points each) @param {{ d: number[], n: number }} s @param {string} id */
export function hullOf(s, id) { const h = hullAcc(s.d, id); h.add(0, s.n); return h.done(); }
/** the nine bodies' hulls without the mark (no canvas: the lane's scan runs it in node) */
export function bodyHulls() { return BODIES.map((b) => hullOf(b.make(), b.id)); }

/* ================================================================ the order and the pack */

/** how many of a body's points a tier keeps (those under its share by rank) @param {PSet} s @param {number} share */
function countOf(s, share) { let m = 0; for (let i = 0; i < s.n; i++) if (s.rk[i] < share) m++; return m; }
/** a body's points under a tier's share (by rank: a fair sample of every line, fill and batch of motes), with the
 *  body's index in their flags @param {PSet} s @param {number} body @param {number} share @param {Float32Array} out @param {number} o */
function packInto(s, body, share, out, o) {
  let m = 0;
  for (let i = 0; i < s.n; i++) {
    if (s.rk[i] >= share) continue;
    const a = i * REC, b = (o + m) * REC;
    for (let j = 0; j < REC - 1; j++) out[b + j] = s.d[a + j];
    out[b + REC - 1] = s.d[a + REC - 1] + body;
    m++;
  }
  return m;
}

/** @type {Map<string, Promise<any>>} */ const BUILT = new Map();
/**
 * Every point of the figure for a tier, built once (in slices: a body a task) and kept.
 * Resolves { data, count, ranges: [{ id, start, count, all }], aspect (the mark's width / height), ms, slice (the
 * longest task, ms) }: body 0 is the mark, 1..9 the nine in BODIES' order.
 * @param {"A" | "B" | "C"} tier
 */
export function buildPoints(tier) {
  const key = tier in TIER_SHARE ? tier : "A";
  let p = BUILT.get(key);
  if (!p) { p = build(/** @type {any} */ (key)); BUILT.set(key, p); p.catch(() => BUILT.delete(key)); }
  return p;
}
/** @param {"A" | "B" | "C"} tier */
async function build(tier) {
  const share = TIER_SHARE[tier], t0 = performance.now();
  let slice = 0, work = 0;
  const timed = async (/** @type {() => any} */ fn) => { await tick(); const t = performance.now(); const v = fn(); const d = performance.now() - t; slice = Math.max(slice, d); work += d; return v; };
  const tm = performance.now();
  const M = await mark();
  const markMs = performance.now() - tm;
  /** @type {PSet[]} */ const sets = [M.set];
  for (const b of BODIES) sets.push(await timed(() => b.make()));
  // the hulls (layout.js orreryBoxes): the mark's in runs of a few thousand points, a task each
  /** @type {Float32Array[]} */ const hulls = [];
  { const h = hullAcc(M.set.d, "mark"); for (let i = 0; i < M.set.n; i += 5000) { const a = i; await timed(() => h.add(a, Math.min(M.set.n, a + 5000))); } hulls.push(h.done()); }
  for (let i = 0; i < BODIES.length; i++) { const s = sets[1 + i], id = BODIES[i].id; hulls.push(await timed(() => hullOf(s, id))); }
  const total = sets.reduce((s, x) => s + countOf(x, share), 0);
  const data = new Float32Array(total * REC);
  const ranges = [];
  let o = 0;
  for (let i = 0; i < sets.length; i++) {
    const s = sets[i];
    const m = await timed(() => packInto(s, i, share, data, o));
    ranges.push({ id: i ? BODIES[i - 1].id : "mark", start: o, count: m, all: s.n });
    o += m;
  }
  return { data, count: total, ranges, hulls, aspect: M.aspect, tier, ms: Math.round(performance.now() - t0), markMs: Math.round(markMs), slice: Math.round(slice * 10) / 10, work: Math.round(work) };
}
