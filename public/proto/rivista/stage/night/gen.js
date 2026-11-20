// @ts-check
/**
 * gen — Consulting 1, AI content generation (spec "Storia" §3.5, §6.1).
 *
 * A picture arriving out of noise, the way a diffusion model makes one: at the start of the step
 * every point of the picture sits at a random place inside the frame (a field of light, no image);
 * as the step advances each point slides from its noise toward its place in the picture on a
 * sampling schedule that is quick at first and slow on the last detail, and the field turns into
 * the SerSan mark from the brand film's end card (lib.js plate()). From about two thirds of the step it holds still and sharp. The frame of the
 * picture is drawn from the first moment, and a row of short marks under it lights one by one:
 * the sampling steps.
 *
 * Two formations (lane LIGHT, round x): the default export is the picture, whose noise lives on the curl flow; the
 * named export `frame` is the ruled frame and the sampling marks, a formation of their own with no flow, no scatter
 * and no hand or wind, so the border stands still while the noise boils inside it (a formation has one flow for all
 * its points: when the frame was part of the picture its edges trembled with the noise). Both take the same rect,
 * rotation, scale and offset, so they read as one figure; consult.js registers both and gives them one weight.
 */
import { Sets, plate, rng, clamp, smooth, mix, stepProgress, rackFocus, hurry } from "./lib.js";
import { DEPTH } from "./shot.js";

const N_IMG = 15000;
const HALF = 0.8;            // the frame's half side (local units: half the box's smaller side)
const TICKS = 28;
/** (wave 3) the made picture's rows: at most this many targets (the default export's capacity) */
const MADE_CAP = 120000;

/** (wave 5, GLASS2) how far the made mark of splats covers the points' picture (scenes/consult.js writes it): the
 *  points fade under the solid mark */
export const GEN = { cover: 0 };

/** @type {{ img: Float32Array, noise: Float32Array, th: Float32Array } | null} */
let base = null;

/** σ: how much of the picture is still to come (1 at the start of the step, 0 by its middle) @param {number} p */
// sharp by half the step (INTEGRATE: at 0.7 the reader had read the entry before the picture formed)
const sigma = (p) => { const s = clamp((p - 0.02) / 0.48); return Math.pow(1 - s, 1.4); };
/** σ for a scene's step and local (consult.js: when the picture is made) @param {{ step: number, local: number }} sc */
export const genSigma = (sc) => sigma(stepProgress(sc, 1));

/** (wave 1, NIGHT) the generation, read at a glance: the picture resolves from the top down behind a straight scan
 *  line, the way a sampler's preview fills in. Above the line the SerSan mark stands sharp; just under it the same
 *  mark in coarse square cells (a low-resolution preview: each cell is a filled square of points, as bright as the
 *  picture is there); further down only larger cells and a sparse grain of noise. At the page's first screen the
 *  picture is already half made (the first screen opens on a lit figure); through step 1 the line runs to the bottom.
 *  @param {number} sg σ */
const lineAt = (/** @type {number} */ sg) => -HALF + 2 * HALF * (1 - 0.58 * sg);

/** @param {number} sg */
function build(sg) {
  if (!base) return null;
  const S = new Sets(N_IMG);
  const { img, noise, th } = base;
  const Ys = lineAt(sg);
  // (wave 2, GLOW-NIGHT) the preview as a MOSAIC: square cells on aligned grids (three sizes, coarser further from the
  // line), each cell one flat square of light as bright as the picture is there on average, with a dark gap between
  // cells; the points sit on a stratified lattice inside their cell (no random grain, no flow: the squares hold). It
  // read as a grainy mark with horizontal bands; now it reads as pixels that resolve into the mark behind the line.
  const side = 2 * HALF, Q = [side / 16, side / 10, side / 6];
  // (wave 2, FIX) the made part on a fine lattice too (q0, ~1/96 of the side): the plate's random sample read as blue
  // grain, TV static; on a regular lattice of small even cells the mark reads sharp, a finished image of light
  const Q0 = side / 96;
  const qOf = (/** @type {number} */ below) => below <= 0 ? Q0 : Q[below < 0.22 * HALF ? 0 : below < 0.6 * HALF ? 1 : 2];
  /** @type {Map<string, number[]>} */ const cells = new Map();
  for (let i = 0; i < N_IMG; i++) {
    const ix = img[i * 3] * HALF, iy = img[i * 3 + 1] * HALF;
    const below = iy - Ys;
    const q = qOf(below), gx = Math.floor(ix / q), gy = Math.floor(iy / q), k = q + ":" + gx + ":" + gy;
    const a = cells.get(k) || [0, 0, 0];
    a[0] += img[i * 3 + 2]; a[1]++;
    cells.set(k, a);
  }
  if (sg < 0.01) return made(cells, Q0);
  for (let i = 0; i < N_IMG; i++) {
    const L = img[i * 3 + 2];
    const ix = img[i * 3] * HALF, iy = img[i * 3 + 1] * HALF;
    const below = iy - Ys;
    void L;
    const q = qOf(below), gx = Math.floor(ix / q), gy = Math.floor(iy / q);
    const a = /** @type {number[]} */ (cells.get(q + ":" + gx + ":" + gy));
    // the point's place on a lattice inside the cell (its own index picks the slot; filled squares, 14 % gap)
    const n = Math.max(2, Math.ceil(Math.sqrt(a[1]))), slot = a[2]++, u = (slot % n + 0.5) / n, v = (Math.floor(slot / n) % n + 0.5) / n;
    const avg = a[0] / a[1];
    // the made part: the fine cell's lattice, even light (no gap: at this size a gap is a shimmer)
    if (below <= 0) { S.push((gx + (0.5 + (u - 0.5) * 0.9)) * q, Math.min(Ys - 0.002, (gy + (0.5 + (v - 0.5) * 0.9)) * q), 0, 0.66 + 0.34 * avg); continue; }
    const x = (gx + 0.07 + 0.86 * u) * q, y = Math.max(Ys + 0.006, (gy + 0.07 + 0.86 * v) * q);
    const far = clamp(below / HALF);
    S.push(x, y, 0.01, (0.22 + 0.75 * avg) * (1 - 0.35 * far));
  }
  void th; void noise;
  return S.set();
}

/** (wave 3, LIGHT3) the made picture: a mark with clean flat faces. The plate's random sample left each fine cell with
 *  its own count of points (2 to 7) on its own little lattice and its own light: speckle inside the mark once made.
 *  Now the cells the mark covers (a cellular pass fills the odd empty cell inside and drops a stray one at the edge)
 *  are crossed by even rows of light (paths, below), each cell's light its neighbourhood's mean quantised to three
 *  tones (the faces). @param {Map<string, number[]>} cells @param {number} q */
function made(cells, q) {
  const pre = q + ":";
  /** @type {Map<string, { gx: number, gy: number, n: number, avg: number }>} */ const C = new Map();
  for (const [k, a] of cells) if (k.startsWith(pre)) { const [, gx, gy] = k.split(":").map(Number); C.set(gx + ":" + gy, { gx, gy, n: a[1], avg: a[0] / a[1] }); }
  const counts = [...C.values()].map((c) => c.n).sort((a, b) => a - b);
  const med = counts.length ? counts[counts.length >> 1] : 1;
  const on = (/** @type {number} */ gx, /** @type {number} */ gy) => { const c = C.get(gx + ":" + gy); return !!c && c.n >= 0.4 * med; };
  const nb8 = (/** @type {number} */ gx, /** @type {number} */ gy) => { let k = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && on(gx + dx, gy + dy)) k++; return k; };
  // candidates: every cell with points and its empty neighbours (holes inside the mark)
  /** @type {Map<string, number[]>} */ const cand = new Map();
  for (const c of C.values()) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) cand.set((c.gx + dx) + ":" + (c.gy + dy), [c.gx + dx, c.gy + dy]);
  /** @type {{ gx: number, gy: number, L: number }[]} */ const keep = [];
  for (const [gx, gy] of cand.values()) {
    const k = nb8(gx, gy), self = on(gx, gy);
    if (!(self ? k >= 3 : k >= 6)) continue;
    // the neighbourhood's mean light, quantised to three tones: flat faces
    let s = 0, m = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const c = C.get((gx + dx) + ":" + (gy + dy)); if (c) { s += c.avg; m++; } }
    const L = m ? s / m : 0.6;
    keep.push({ gx, gy, L: L < 0.42 ? 0.55 : L < 0.72 ? 0.8 : 1 });
  }
  keep.sort((a, b) => a.gy - b.gy || a.gx - b.gx);
  // the faces as PATHS: every cell crossed by n straight rows, one segment of the cell's width each, all segments of
  // one length and in reading order (row by row down the mark, left to right along a row). The stage spreads a path's
  // particles evenly along it, so the light lies flat whatever the tier's count; as points (one target each, a
  // low-discrepancy count of particles per target) the face read as mottle. n: rows as close as the particles along
  // them at about 48,000 particles for the picture (tier A gives it 64,000)
  const n = Math.max(2, Math.min(8, Math.round(Math.sqrt(48000 / Math.max(1, keep.length)))));
  /** @type {number[]} */ const d = [];
  for (let k0 = 0; k0 < keep.length;) {
    let k1 = k0;
    while (k1 < keep.length && keep[k1].gy === keep[k0].gy) k1++;
    for (let r = 0; r < n; r++) {
      const y = (keep[k0].gy + (r + 0.5) / n) * q;
      for (let k = k0; k < k1; k++) { const c = keep[k], w = 0.66 + 0.34 * c.L; d.push(c.gx * q, y, 0, w, (c.gx + 1) * q, y, 0, w); }
    }
    k0 = k1;
  }
  return { data: new Float32Array(d), path: 2, closed: false };
}

const FSEG = 0.04;          // local units of one segment of the frame's rule (a sampling mark is one segment)
/** the frame and the sampling marks as paths of two targets (straight segments): the stage spreads a path's
 *  particles evenly between its ends, so a rule is an even line with square corners and every segment gets the same
 *  light. The marks are lit as the schedule passes them. @param {number} sg */
function frameSet(sg) {
  /** @type {number[]} */ const d = [];
  const seg = (/** @type {number} */ ax, /** @type {number} */ ay, /** @type {number} */ bx, /** @type {number} */ by, /** @type {number} */ w) => d.push(ax, ay, 0, w, bx, by, 0, w);
  const run = (/** @type {number} */ ax, /** @type {number} */ ay, /** @type {number} */ bx, /** @type {number} */ by, /** @type {number} */ w) => {
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / FSEG));
    for (let i = 0; i < n; i++) seg(ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n, ax + ((bx - ax) * (i + 1)) / n, ay + ((by - ay) * (i + 1)) / n, w);
  };
  const e = HALF + 0.04;
  // the scan line: a straight rule across the frame where the picture is being made (gone once it is whole)
  if (sg > 0.01) { const Ys = lineAt(sg); run(-e, Ys, e, Ys, 0.95); }
  run(-e, -e, e, -e, 0.42); run(e, -e, e, e, 0.42); run(e, e, -e, e, 0.42); run(-e, e, -e, -e, 0.42);
  // the sampling steps: short marks under the frame, one segment each (a segment of the rule's length, so a mark gets
  // as many points as one: half the light per point keeps the marks' tone of the first build, half the rule's)
  const done = 1 - sg;
  for (let k = 0; k < TICKS; k++) {
    const x = -e + (k + 0.5) * ((2 * e) / TICKS);
    const on = smooth(0, 0.04, done - k / TICKS);
    // (lane o-fix) a mark one segment long drew, with the points' disc, as a tiny ring: now a short straight tick of three
    // segments (three times the points, a third of the light each), so it reads as a rule, never a round spot
    for (let j = 0; j < 3; j++) seg(x, HALF + 0.1 + j * 0.04, x, HALF + 0.14 + j * 0.04, (0.5 / 3) * (0.12 + 0.6 * on));
  }
  return { data: new Float32Array(d), path: 2, closed: false };
}

/** what the picture and its frame share each frame: the step's σ and the figure's place @param {any} c */
function pose(c) {
  const sg = sigma(stepProgress(c.scene, 1));
  // leaving for the next figure, the picture shrinks into the place where cut's monitor stands
  // (the picture becomes the frame on screen); arriving, it comes into focus from in front
  const placed = typeof DEPTH.gen === "number";
  const leaving = !placed && c.scene.step > 1 ? smooth(0, 0.75, 1 - clamp(c.weight)) : 0;
  const u = Math.min(c.rect.w, c.rect.h) / 2;
  return {
    sg,
    scale: mix(1, 0.47, leaving),
    offset: [0, -0.5 * u * leaving, placed ? DEPTH.gen : c.scene.step > 1 ? 0 : rackFocus(c, 1)],
    rotate: [0.04 * sg, -0.2 * sg, 0],
  };
}

/** the ruled frame and the sampling marks: still (consult.js registers it beside the picture, same weight) */
export const frame = {
  share: 0.1, fill: 1, fit: "contain", inkArea: 300000, capacity: 1024, emit: 0,
  look: { ink: 0.025, size: 1.2, mistInk: 0, mistSize: 1.2 },
  motion: { spring: 6, speed: 900, inertia: 0.1, fuzz: 0 },
  flow: { amp: 0, wavelength: 140, evolution: 0.12, z: 0 },
  respond: { hand: 0, wind: 0, fadeIn: 2.2, fadeOut: 2.6 },
  tails: { share: 0, length: 40, emitters: 40 },
  targets: () => frameSet(1),
  /** @param {any} c */
  update(c) {
    const s = c.state, P = pose(c);
    // the marks' light follows the schedule (a rebuild only when it has moved)
    const key = Math.round(P.sg * 200);
    if (s.key !== key) { s.key = key; c.setTargets(frameSet(P.sg)); }
    return { scale: P.scale, offset: P.offset, rotate: P.rotate, motion: hurry(c, c.scene.step >= 1 ? 1 : 0, { spring: 6, speed: 900, inertia: 0.1 }).motion };
  },
};

export default {
  // the picture's share of the first build (0.5 for picture and frame) less the frame's part: the same points a target
  share: 0.4, fill: 0.97, fit: "contain", inkArea: 300000, capacity: MADE_CAP,
  look: { ink: 0.025, size: 1.2, mistInk: 0.012, mistSize: 1.2 },
  motion: { spring: 4.5, speed: 640, inertia: 0.2, fuzz: 1.0 },
  flow: { amp: 9, wavelength: 140, evolution: 0.12, z: 0.8 },
  respond: { hand: 0.7, wind: 0.4, fadeIn: 2.2, fadeOut: 2.6 },
  emit: 0,
  async targets() {
    const P = await plate(N_IMG);
    const r = rng(41), noise = new Float32Array(N_IMG * 3), th = new Float32Array(N_IMG);
    for (let i = 0; i < N_IMG; i++) {
      noise[i * 3] = (r() * 2 - 1) * HALF;
      noise[i * 3 + 1] = (r() * 2 - 1) * HALF;
      noise[i * 3 + 2] = (r() * 2 - 1) * 0.38;
      th[i] = 0.08 + 0.84 * r();
    }
    // (wave 3, LIGHT3) the plate's points in reading order (row of fine cells, then x): the made picture's rows are
    // in the same order, so when the schedule ends and the faces turn into rows every particle stays in its own part of
    // the mark instead of crossing it (a particle picks its target by its place in the list)
    const img = P.pts, ix = Array.from({ length: N_IMG }, (_, i) => i), Q0 = 2 * HALF / 96;
    const ky = (/** @type {number} */ i) => Math.floor(img[i * 3 + 1] * HALF / Q0) * 8 + img[i * 3] * HALF;
    ix.sort((a, b) => ky(a) - ky(b));
    const sorted = new Float32Array(N_IMG * 3);
    ix.forEach((i, k) => { sorted[k * 3] = img[i * 3]; sorted[k * 3 + 1] = img[i * 3 + 1]; sorted[k * 3 + 2] = img[i * 3 + 2]; });
    base = { img: sorted, noise, th };
    return /** @type {any} */ (build(1));
  },
  /** @param {any} c */
  update(c) {
    const s = c.state;
    const p = stepProgress(c.scene, 1);
    const sg = sigma(p);
    if (s.sg == null || Math.abs(sg - s.sg) > 0.003 || (sg === 0 && s.sg !== 0)) {
      const set = build(sg);
      if (set) { c.setTargets(set); s.sg = sg; }
    }
    // while it is noise the field boils; once it is a picture it holds still
    const calm = 1 - sg;
    const P = pose(c);
    return {
      scale: P.scale,
      offset: P.offset,
      rotate: P.rotate,
      // (wave 2) the mosaic holds still: a boiling flow blurred its squares into grain
      flow: { amp: 0.6, wavelength: 220, evolution: 0.04, z: 0.2 },
      // arriving from the fall it lands fast (fix-stage)
      motion: { ...hurry(c, c.scene.step >= 1 ? 1 : 0, { spring: 4.5, speed: 640, inertia: 0.2 }).motion, fuzz: sg < 0.01 ? 0 : 0.06 + 0.19 * sg },
      // (wave 2, FIX) a made picture holds still (the flow's drift read as static on the lattice)
      // (wave 4, PRISM) and its points a little larger with no fuzz, so the rows of light close into flat faces
      ...(sg < 0.01 ? { flow: { amp: 0, wavelength: 220, evolution: 0, z: 0 }, look: { size: 1.9 } } : {}),
      // denser light once made: the lattice's points merge into a solid mark, white where it is dense
      // (wave 4, PRISM) made, its larger points carry the light of the old small ones (the same tone, flatter)
      ink: (sg < 0.01 ? 0.92 : 1 + 0.9 * calm) * (1 - GEN.cover),
    };
  },
};
