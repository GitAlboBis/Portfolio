// @ts-check
/**
 * night/lib.js — what the night's figures share (spec "Storia" §3.5, NIGHT lane).
 *
 *  - plate():   the SerSan mark from the brand film's end card (public/captures/sersan-brand-end-1600.webp,
 *               provenance in its sidecar), sampled once into weighted points (a promise, cached): the
 *               picture that `gen` condenses and `cut` lays on its strip. (Until spec 30 it was the water A
 *               of Fig. 01; the A is no figure anywhere now.)
 *  - Sets:      a tiny builder of target sets in local units (points, lines, rectangles)
 *  - ease and clamp helpers
 *
 * Every figure lives on the night ground (light, not ink). No text is ever drawn in the canvas.
 */

import { DEPTH } from "./shot.js";
const FIG_IDS = ["", "gen", "cut", "code", "agents"];

export const clamp = (/** @type {number} */ x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export const smooth = (/** @type {number} */ e0, /** @type {number} */ e1, /** @type {number} */ x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
export const mix = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ t) => a + (b - a) * t;
/** exponential approach of `cur` to `to` with time constant tau (s) */
export const approach = (/** @type {number} */ cur, /** @type {number} */ to, /** @type {number} */ dt, /** @type {number} */ tau) => cur + (to - cur) * (1 - Math.exp(-dt / Math.max(tau, 1e-4)));

/**
 * The ink multiplier that sets how a figure's tone follows the size of its box. The stage scales ink
 * with the rect's area (inkArea), which keeps a cloud's tone; a line's brightness follows its length
 * instead. Returned from update(), this makes the stage's net factor (area ratio)^p: p = 1 for a
 * figure of filled areas, 0.5 for one of thin lines, in between for a mix.
 * @param {{ w: number, h: number }} rect @param {number} inkArea @param {number} [p]
 */
export const inkFor = (rect, inkArea, p = 0.5) => Math.pow(clamp((rect.w * rect.h) / inkArea, 0.25, 4), p - 1);

/**
 * The scene's progress through one step: 0 before it, local inside it, 1 after it.
 * @param {{ step: number, local: number }} scene @param {number} k 1-based step
 */
export const stepProgress = (scene, k) => (scene.step > k ? 1 : scene.step === k ? clamp(scene.local) : 0);

/**
 * The rack focus of a cross-blend between two consulting figures (css px of depth for `offset`).
 * The host blends the outgoing and the incoming figure by weight around a step boundary; instead
 * of a double exposure on the page plane, the outgoing one recedes into the depth of field (a
 * faint veil behind) and the incoming one arrives from a little in front, coming into focus.
 * @param {{ weight: number, scene: { step: number } }} c @param {number} k this figure's step
 */
export function rackFocus(c, k) {
  // (wave 1, NIGHT) a figure set at its own place in the room's depth (night/shot.js DEPTH) stands there: the eye
  // walks to it instead of the figure racking in and out of focus on the page plane
  const id = FIG_IDS[k];
  if (id && typeof DEPTH[id] === "number") return DEPTH[id];
  const out = 1 - clamp(c.weight);
  if (out <= 0.001) return 0;
  const e = smooth(0, 1, out);
  return c.scene.step > k ? -560 * e : 220 * e;
}

/**
 * The hurry of a figure that has just changed (fix-stage, finish review: "night figures streak for two to three
 * seconds after a step change"). When `key` changes (the scene's step, or the state it asks for), the figure's
 * motion runs fast for a moment: a stiffer spring, a higher top speed, less inertia and a calmer flow, easing back to
 * the figure's own motion over `span` seconds. A figure that comes back on screen after being away also hurries (its
 * key is stale). Returned as a partial `motion` and `flow` for update()'s result.
 * @param {any} c the update ctx @param {string | number} key @param {{ spring: number, speed: number, inertia: number }} m
 * @param {number} [amp] the figure's flow amplitude @param {number} [span] s
 */
export function hurry(c, key, m, amp = 3, span = 1.4) {
  const s = c.state;
  if (s.hKey !== key) { s.hKey = key; s.hT = c.time; }
  const k = s.hT != null ? 1 - smooth(0.2, span, c.time - s.hT) : 0;
  return {
    motion: { spring: m.spring * (1 + 1.6 * k), speed: m.speed * (1 + 2.2 * k), inertia: m.inertia * (1 - 0.6 * k) },
    flow: { amp: amp * (1 - 0.7 * k) },
    k,
  };
}

/**
 * The camera inside a figure box (spec 30 §2, "a camera that may orbit"; fix-stage, from the finish review's ceiling):
 * it turns a little with the scroll through the scene and with the reader's pointer, damped, so a figure reads as a
 * body in depth and not a flat front. Returns [pitch, yaw] in radians to add to the figure's rotation. It moves only
 * on simulated time (dt is 0 while the stage rests), so it stands still with the rest of the page.
 * @param {any} c the update ctx @param {number} prog 0..1, how far the reader is through the figure's own stretch
 * @param {number} [yawMax] @param {number} [pitchMax] @param {number} [tau] s
 */
export function camera(c, prog, yawMax = 0.22, pitchMax = 0.12, tau = 0.7) {
  const s = c.state, p = c.pointer;
  const px = p.present ? clamp(p.local.x / 1.6, -1, 1) : 0, py = p.present ? clamp(p.local.y / 1.6, -1, 1) : 0;
  const sp = clamp(prog) - 0.5;
  const ty = yawMax * (0.55 * px + 0.9 * sp), tp = pitchMax * (0.6 * py - 0.5 * sp);
  s.cam ??= [tp, ty];
  s.cam[0] = approach(s.cam[0], tp, c.dt, tau);
  s.cam[1] = approach(s.cam[1], ty, c.dt, tau);
  return s.cam;
}

/**
 * A growable list of targets (x, y, z, ink) in local units.
 */
export class Sets {
  constructor(cap = 4096) { this.d = new Float32Array(cap * 4); this.n = 0; }
  /** @param {number} x @param {number} y @param {number} z @param {number} w */
  push(x, y, z, w) {
    if ((this.n + 1) * 4 > this.d.length) { const nd = new Float32Array(this.d.length * 2); nd.set(this.d); this.d = nd; }
    const j = this.n * 4; this.d[j] = x; this.d[j + 1] = y; this.d[j + 2] = z; this.d[j + 3] = w; this.n++;
  }
  /** a straight run of points from a to b (z and ink constant) @param {number} n */
  line(ax = 0, ay = 0, bx = 0, by = 0, n = 32, z = 0, w = 1) {
    for (let i = 0; i < n; i++) { const t = n > 1 ? i / (n - 1) : 0.5; this.push(ax + (bx - ax) * t, ay + (by - ay) * t, z, w); }
  }
  /** the outline of a rectangle, `density` points per local unit @param {number} density */
  rect(x0 = 0, y0 = 0, x1 = 0, y1 = 0, density = 400, z = 0, w = 1) {
    const nx = Math.max(2, Math.round((x1 - x0) * density)), ny = Math.max(2, Math.round((y1 - y0) * density));
    this.line(x0, y0, x1, y0, nx, z, w); this.line(x1, y0, x1, y1, ny, z, w);
    this.line(x1, y1, x0, y1, nx, z, w); this.line(x0, y1, x0, y0, ny, z, w);
  }
  /** @returns {{ data: Float32Array, path: number, closed: boolean }} */
  set() { return { data: this.d.subarray(0, this.n * 4), path: 0, closed: false }; }
}

/**
 * The SerSan mark as weighted points: { pts: Float32Array of (x, y, light), n }.
 * x, y in [-1, 1] on the crop (square). The density follows where the mark is (its distance from the
 * card's navy ground); `light` is brightest on the white half and lower on the blue half, so the
 * picture reads as the mark, now made of light.
 */
/** @type {Promise<{ pts: Float32Array, n: number }> | null} */
let platePromise = null;
export function plate(n = 16000) {
  if (platePromise) return platePromise;
  platePromise = (async () => {
    const url = new URL("../../../../captures/sersan-brand-end-1600.webp", import.meta.url).href;
    const img = await createImageBitmap(await (await fetch(url)).blob());
    // a square crop around the mark (the card is 1600 x 1000, the mark spans about 690..900 x 200..440)
    const S = 300, sx = 646, sy = 166, R = 300;
    const cv = new OffscreenCanvas(R, R), cx = /** @type {OffscreenCanvasRenderingContext2D} */ (cv.getContext("2d", { willReadFrequently: true }));
    cx.drawImage(img, sx, sy, S, S, 0, 0, R, R);
    const px = cx.getImageData(0, 0, R, R).data;
    const wt = new Float64Array(R * R), lit = new Float32Array(R * R);
    const P = [14, 33, 61];   // the card's ground
    let acc = 0;
    for (let i = 0; i < R * R; i++) {
      const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
      const d = Math.hypot(r - P[0], g - P[1], b - P[2]);
      const m = d < 24 ? 0 : Math.min(1, (d - 24) / 60);
      const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      lit[i] = 0.22 + 0.78 * Math.pow(clamp((L - 0.3) / 0.6), 1.3);
      acc += m;
      wt[i] = acc;
    }
    const pts = new Float32Array(n * 3);
    let a = 0x9e3779b9 >>> 0;
    const rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    for (let k = 0; k < n; k++) {
      const t = rnd() * acc;
      let lo = 0, hi = wt.length - 1;
      while (lo < hi) { const m = (lo + hi) >> 1; if (wt[m] < t) lo = m + 1; else hi = m; }
      const x = lo % R, y = (lo / R) | 0;
      pts[k * 3] = ((x + rnd()) / R) * 2 - 1;
      pts[k * 3 + 1] = ((y + rnd()) / R) * 2 - 1;
      pts[k * 3 + 2] = lit[lo];
    }
    return { pts, n };
  })();
  return platePromise;
}

/** A seeded generator (mulberry32). @param {number} seed */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
