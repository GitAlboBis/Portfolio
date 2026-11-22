// @ts-check
/**
 * shot.js — ONE STUDIO, ONE CAMERA PER PAGE (wave 1, lane NIGHT; plan 70 phase 1): what the night pages' scenes
 * (stack, path, consult, obla, index) share to stand in the cover's lit room (scenes/lib/room.js) and to be one
 * continuous shot.
 *
 *  - pageK(c)        0..1 down the whole page (the document's scroll), for the room's temperature: cool (toward
 *                    cobalt) at the top, warm (paper) toward the dawn close
 *  - sink(c, r, z)   a screen rect (viewport px) as the WORLD rect that the straight view shows exactly there when it
 *                    stands at depth z (z < 0 behind the page plane): a figure set in the room's depth keeps the place
 *                    and the size the page gave it; the moving eye then adds the parallax of its depth
 *  - aimAt(c, A, F, v)  a free pose that sees the world point A at the screen point F from the eye A + v (the eye
 *                    travels with the subject; the subject stays on its side of the text)
 *  - shot(c, pose, o)   the camera a scene returns: the pose plus the stage's clock drift at rest, the hand's orbit
 *                    about the subject (0.22 / 0.10 rad, a horizontal drag on touch), the lens that widens a little
 *                    with a fast scroll, damp 0 (the path is exact: a continuous shot, never a cut)
 *  - home(c)         the straight view (the page as laid out): every page's shot starts and ends near it, so two
 *                    scenes mixed by weight, and the dawn's straight view, never pull the eye across the room
 *  - DEPTH           a figure's own z offset (css px), keyed by formation id: the night figures add it to their
 *                    offset (consult walks through the room from one figure's place to the next)
 *  - stations(x, n)  a continuous index 0..n-1 from a reader's place x (steps): it holds on a station while the
 *                    step is read, and travels across the boundary (smooth, no damping: the scroll is the clock)
 *
 * Anything that moves at rest runs on c.clock.time (the stage sleeps when it stops).
 */
import { room, eyeD } from "../scenes/lib/room.js";
import { speedLens, drift, glideK } from "../scenes/lib/camera.js";

export { eyeD };

export const clamp = (/** @type {number} */ x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const mix = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ t) => a + (b - a) * t;
export const sstep = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/** @type {Record<string, number>} figure id -> its z offset in px (consult's walk through the room) */
export const DEPTH = {};

/** the page's scroll height, read at most every 1.5 s (a layout read; the page's height barely changes) */
let docH = 0, docT = -1e9;
/** 0..1 down the page @param {any} c */
export function pageK(c) {
  const now = typeof performance !== "undefined" ? performance.now() : 0;
  if (now - docT > 1500 && typeof document !== "undefined") { docT = now; docH = document.documentElement.scrollHeight; }
  const max = Math.max(1, docH - c.vh);
  return clamp((c.scrollY || 0) / max);
}

/** the room's temperature for a place on the page: cool at the top, warm toward the dawn @param {any} c */
export const tempOf = (c) => 0.12 + 0.76 * sstep(0.02, 0.95, pageK(c));

/** a screen rect seen at depth z by the straight view, as the world rect there
 * @param {any} c @param {{ x: number, y: number, w: number, h: number }} r @param {number} z */
export function sink(c, r, z) {
  const D = eyeD(c.vw, c.vh), k = (D - z) / D, cx = c.vw / 2, cy = c.vh / 2;
  const mx = r.x + r.w / 2, my = r.y + r.h / 2;
  const X = cx + (mx - cx) * k, Y = cy + (my - cy) * k;
  return { x: X - (r.w * k) / 2, y: Y - (r.h * k) / 2, w: r.w * k, h: r.h * k, cx: X, cy: Y, z };
}

/** the straight view @param {any} c */
export function home(c) {
  const D = eyeD(c.vw, c.vh);
  return { pos: [c.vw / 2, c.vh / 2, D], target: [c.vw / 2, c.vh / 2, 0], roll: 0, lens: 1, focus: D, aperture: 1 };
}

/**
 * The eye at A + v, turned so that the world point A shows at the screen point F (for a view that looks mostly down
 * -z: the target is moved sideways by the screen offset at A's distance).
 * @param {any} c @param {number[]} A @param {{ x: number, y: number }} F @param {number[]} v
 */
export function aimAt(c, A, F, v) {
  const D = eyeD(c.vw, c.vh), L = Math.hypot(v[0], v[1], v[2]) || 1;
  const k = L / D;
  const pos = [A[0] + v[0], A[1] + v[1], A[2] + v[2]];
  const target = [A[0] + (c.vw / 2 - F.x) * k, A[1] + (c.vh / 2 - F.y) * k, A[2]];
  return { pos, target, roll: 0, lens: 1, focus: L, aperture: 1, pivot: A };
}

/** (wave 2, FIX) where the world point P lands on screen for a pose's eye (no roll, the stage's lens: the straight view
 *  maps the page plane 1:1), and the screen px per world px there; null behind the eye
 *  @param {any} c @param {any} pose @param {number[]} P @returns {{ x: number, y: number, k: number, z: number } | null} */
export function project(c, pose, P) {
  const D = eyeD(c.vw, c.vh);
  const f = [pose.target[0] - pose.pos[0], pose.target[1] - pose.pos[1], pose.target[2] - pose.pos[2]];
  const fl0 = Math.hypot(f[0], f[1], f[2]) || 1, fw = [f[0] / fl0, f[1] / fl0, f[2] / fl0];
  const rl = Math.hypot(fw[2], fw[0]) || 1, r = [-fw[2] / rl, 0, fw[0] / rl];
  const d = [r[1] * fw[2] - r[2] * fw[1], r[2] * fw[0] - r[0] * fw[2], r[0] * fw[1] - r[1] * fw[0]];
  const v = [P[0] - pose.pos[0], P[1] - pose.pos[1], P[2] - pose.pos[2]];
  const z = v[0] * fw[0] + v[1] * fw[1] + v[2] * fw[2];
  if (z < 0.02 * D) return null;
  const k = D / (pose.lens || 1) / z;
  return { x: c.vw / 2 + (v[0] * r[0] + v[1] * r[1] + v[2] * r[2]) * k, y: c.vh / 2 + (v[0] * d[0] + v[1] * d[1] + v[2] * d[2]) * k, k, z };
}

/** (wave 2, FIX) the chips' clear volume in front of a subject: no chip between the eye and the subject inside its box
 *  on screen (the field's `clear`; chips crossed Obla's face and the path's numerals). P its centre (world), w h its
 *  size (world px), pad (screen px) @param {any} c @param {any} pose @param {number[]} P @param {number} w @param {number} h */
export function clearOf(c, pose, P, w, h, pad = 24) {
  const s = project(c, pose, P);
  if (!s) return null;
  const W = w * s.k + 2 * pad, H = h * s.k + 2 * pad;
  // every chip in the box, the ones behind the subject too: a figure of points draws before the chips with no depth
  // between them, so a chip behind Obla still drew across its face
  return { rect: [s.x - W / 2, s.y - H / 2, W, H], point: [P[0], P[1], P[2] - 3 * eyeD(c.vw, c.vh)] };
}

/** a continuous station index from x in steps (0 = the first station's middle), holding on each. (wave 8, lane SMOOTH)
 *  The travel is a quintic (lib/camera.js glideK: no speed and no acceleration at either end), so the eye leaves a
 *  station and lands on the next without a corner; the smoothstep it was stopped the deceleration dead at the landing
 *  (a bump at the end of every walk). Over 0.16..0.84 of the way: the smoothstep's peak speed over 0.22..0.78, the
 *  same holds (the quintic's ends are flatter) @param {number} x @param {number} n */
export function stations(x, n) {
  const xs = clamp(x, 0, n - 1), i = Math.min(n - 2, Math.floor(xs));
  return clamp(i + glideK(0.16, 0.84, xs - i), 0, n - 1);
}

/** a pose between two @param {any} a @param {any} b @param {number} t */
export function mixP(a, b, t) {
  const m = (/** @type {number} */ x, /** @type {number} */ y) => x + (y - x) * t;
  return {
    pos: a.pos.map((/** @type {number} */ x, /** @type {number} */ i) => m(x, b.pos[i])),
    target: a.target.map((/** @type {number} */ x, /** @type {number} */ i) => m(x, b.target[i])),
    roll: m(a.roll || 0, b.roll || 0), lens: m(a.lens ?? 1, b.lens ?? 1), focus: m(a.focus, b.focus), aperture: m(a.aperture ?? 1, b.aperture ?? 1),
    pivot: a.pivot && b.pivot ? a.pivot.map((/** @type {number} */ x, /** @type {number} */ i) => m(x, b.pivot[i])) : a.pivot || b.pivot,
  };
}

/**
 * The camera a night scene returns.
 * @param {any} c @param {any} pose { pos, target, roll, lens, focus, aperture, pivot? }
 * @param {{ drift?: number, yaw?: number, pitch?: number, fog?: number[], aperture?: number }} [o]
 */
export function shot(c, pose, o = {}) {
  const D = eyeD(c.vw, c.vh), t = c.clock ? c.clock.time : 0;
  const d = drift(t, o.drift ?? (c.phone ? 8 : 14));
  const pos = [pose.pos[0] + d[0], pose.pos[1] + d[1], pose.pos[2] + d[2]];
  const target = [pose.target[0] + d[0] * 0.5, pose.target[1] + d[1] * 0.5, pose.target[2]];
  /** @type {any} */ const cam = {
    pos, target, roll: pose.roll || 0, lens: speedLens(pose.lens ?? 1, c.speed), focus: pose.focus,
    aperture: (pose.aperture ?? 1) * (o.aperture ?? 0.8),
    damp: 0, fog: o.fog || [2.6 * D, 6.5 * D], bokeh: 12,
    orbit: { yaw: o.yaw ?? (c.phone ? 0.14 : 0.22), pitch: o.pitch ?? (c.phone ? 0.06 : 0.1), damp: 1.1 },
  };
  if (pose.pivot) cam.orbit.pivot = pose.pivot;
  return cam;
}

/** the look a night page asks for: a deeper room than the page's default, soft fall round the kept text; every scene
 *  of a page asks the SAME (far in D) or the stage's look flips every frame @param {any} c @param {any} R @param {number} [far] */
export function lookFor(c, R, far = 1.7) {
  const D = eyeD(c.vw, c.vh);
  if (typeof c.look === "function") c.look({ far: Math.round(-far * D), near: Math.round(0.9 * D), ...R.look });
}

/** (wave 1, FIX3D) the tallest band of the screen, between the header and the bottom, that no text block crosses in
 *  the columns x0..x1 (a phone: the figure moves into it instead of hiding while a step's text scrolls through)
 *  @param {any} c @param {number} x0 @param {number} x1 @param {number} [pad] @param {number} [top] @returns {number[]} [y0, y1] */
export function freeBand(c, x0, x1, pad = 16, top = 64) {
  const cuts = c.texts.filter((/** @type {any} */ r) => r.x < x1 && r.x + r.w > x0)
    .map((/** @type {any} */ r) => [r.y - pad, r.y + r.h + pad]).sort((/** @type {number[]} */ p, /** @type {number[]} */ q) => p[0] - q[0]);
  let best = [0, 0], at = top;
  for (const [p, q] of cuts) { if (p - at > best[1] - best[0]) best = [at, p]; at = Math.max(at, q); }
  if (c.vh - at > best[1] - best[0]) best = [at, c.vh];
  return best;
}

/** per page: the same seed for every scene of a page (their blades coincide in a crossfade) */
export const SEED = { about: 5, consult: 7, obla: 9, cover: 3 };

/** (wave 2, GLOW-NIGHT) the night rooms as lit as the cover's hall: the kit's glow, the cover's chip count, and the
 *  blades kept on the figure's half of the wall so one always crosses beside the subject instead of under the text's
 *  dimmed wall. Spread into roomFor's options.
 *  @param {any} c */
export function LIT(c) {
  const side = c.side;
  const sweep = c.phone || side === "top" || side === "full" ? [-0.85, 0.85] : side === "left" ? [-1, 0.3] : [-0.3, 1];
  // the kit's glow (GLOW-WORK, room.js): the cover's blades (columns from high above, close in front of the wall) and
  // its denser, larger, rimmed chips; Work and the cases ask the same, so every room of the studio is lit alike
  // (lane o-fix) 11000 / 7000 -> 4200 / 2800 (x 1.35 lit): the chips covered the index and every room and competed with
  // the prism, the plates and the emblems
  return { glow: 1, chips: c.phone ? 2800 : 4200, sweep };
}

/** the room for a night scene @param {any} c @param {any} o */
export function roomFor(c, o) {
  // on a phone the wall fills the whole screen behind the text: it stays quieter there
  const wall = c.phone ? { alpha: 0.55, ...(o.wall || {}) } : o.wall;
  // (wave 2) a page reached by a cut opens on its room already lit under the leaving sheet (ARRIVE's ctx.arrival);
  // a cold load rises in 0.2 s (decision E: at most 250 ms)
  const fade = c.arrival && c.arrival.cut ? 0 : 0.2;
  return room(c, { temp: tempOf(c), fade, ...o, wall });
}

/** the bloom of a night room (≤ 0.8 with the lit wall) @param {number} [s] */
export const bloomOf = (s = 0.5) => ({ strength: s, threshold: 0.5, knee: 0.3, plates: 0.08 });
