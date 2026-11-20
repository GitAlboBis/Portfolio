// @ts-check
/**
 * camera.js — a camera path for a scene (round 10, lane ENGINE). The stage's free camera (stage/stage.js header,
 * "THE FREE CAMERA") takes a pose every frame: { pos, target, roll, lens, focus, aperture }. A path is a list of keyed
 * poses at a progress the scene computes itself in frame(c) (time since the arrival, the scroll's progress, a mix);
 * evaluated, it is smooth through every key (cubic Hermite with Catmull-Rom tangents on the keys' own spacing), and it
 * starts and ends at rest (zero tangents at the two ends) unless `ends: "through"`.
 *
 *   import { cameraPath } from "./lib/camera.js";
 *   const path = cameraPath([
 *     { at: 0,   pos: [720, 600, 3200], target: [720, 450, -400], roll: -0.04, focus: 3300, aperture: 1.4 },
 *     { at: 0.5, pos: [720, 420, 2100], target: [720, 450, 0],    roll: 0,     focus: 2100, aperture: 1 },
 *     { at: 1,   pos: [760, 450, -900], target: [800, 450, -2600] },                // focus: auto (the target)
 *   ]);
 *   const pose = path(k);   // { pos, target, roll, lens, focus, aperture } for k in [0, 1] (clamped to the keys)
 *   return { camera: { ...pose, damp: 0, orbit: { yaw: 0.06, pitch: 0.04 } } };
 *
 * A key's missing field keeps the previous key's value (the first key's defaults: roll 0, lens 1, aperture 1, focus
 * null = the distance to the target). `focus: null` anywhere means "the target's distance" at that key: the path
 * fills it in so a rack focus between a fixed distance and the target's stays smooth. Units: px of the stage's space
 * (x, y viewport css px at the current scroll, z px toward the reader; the page plane is z = 0), radians.
 */

/** @typedef {{ at: number, pos?: number[], target?: number[], roll?: number, lens?: number, focus?: number | null, aperture?: number }} Key */
/** @typedef {{ pos: number[], target: number[], roll: number, lens: number, focus: number, aperture: number }} Pose */

const FIELDS = ["px", "py", "pz", "tx", "ty", "tz", "roll", "lens", "focus", "aperture"];

/**
 * @param {Key[]} keys at least one; `at` ascending (sorted here)
 * @param {{ ends?: "rest" | "through" }} [o]
 * @returns {(k: number) => Pose}
 */
export function cameraPath(keys, o = {}) {
  const ks = keys.slice().sort((a, b) => a.at - b.at);
  if (!ks.length) throw new Error("cameraPath: no keys");
  // resolve every key to plain numbers (carry the previous key's values; focus null = the target's distance)
  /** @type {number[][]} */ const V = [];
  let prev = { pos: [0, 0, 1000], target: [0, 0, 0], roll: 0, lens: 1, aperture: 1 };
  for (const k of ks) {
    const pos = k.pos || prev.pos, target = k.target || prev.target;
    const roll = k.roll ?? prev.roll, lens = k.lens ?? prev.lens, aperture = k.aperture ?? prev.aperture;
    const focus = typeof k.focus === "number" ? k.focus : Math.hypot(target[0] - pos[0], target[1] - pos[1], target[2] - pos[2]);
    V.push([pos[0], pos[1], pos[2], target[0], target[1], target[2], roll, lens, focus, aperture]);
    prev = { pos, target, roll, lens, aperture };
  }
  const T = ks.map((k) => k.at), n = T.length;
  const through = o.ends === "through";
  // tangents per key and field (d value / d at)
  /** @type {number[][]} */ const M = V.map((_, i) => FIELDS.map((__, f) => {
    if (n < 2) return 0;
    if (i === 0) return through ? (V[1][f] - V[0][f]) / Math.max(T[1] - T[0], 1e-6) : 0;
    if (i === n - 1) return through ? (V[n - 1][f] - V[n - 2][f]) / Math.max(T[n - 1] - T[n - 2], 1e-6) : 0;
    return (V[i + 1][f] - V[i - 1][f]) / Math.max(T[i + 1] - T[i - 1], 1e-6);
  }));
  return (k) => {
    /** @type {number[]} */ let v;
    if (n === 1 || k <= T[0]) v = V[0];
    else if (k >= T[n - 1]) v = V[n - 1];
    else {
      let i = 0;
      while (i < n - 2 && k > T[i + 1]) i++;
      const h = Math.max(T[i + 1] - T[i], 1e-6), s = (k - T[i]) / h, s2 = s * s, s3 = s2 * s;
      const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
      v = FIELDS.map((_, f) => h00 * V[i][f] + h10 * h * M[i][f] + h01 * V[i + 1][f] + h11 * h * M[i + 1][f]);
    }
    return { pos: [v[0], v[1], v[2]], target: [v[3], v[4], v[5]], roll: v[6], lens: Math.max(0.2, v[7]), focus: Math.max(1, v[8]), aperture: Math.max(0, v[9]) };
  };
}

/** a pose between two poses (0: a, 1: b) @param {Pose} a @param {Pose} b @param {number} t */
export function mixPose(a, b, t) {
  const m = (/** @type {number} */ x, /** @type {number} */ y) => x + (y - x) * t;
  return { pos: a.pos.map((x, i) => m(x, b.pos[i])), target: a.target.map((x, i) => m(x, b.target[i])), roll: m(a.roll, b.roll),
    lens: m(a.lens, b.lens), focus: m(a.focus, b.focus), aperture: m(a.aperture, b.aperture) };
}

/**
 * (wave 1, KIT) A lens that widens with the reader's speed and comes back: `lens` divided by up to 1 + `max` (default
 * 0.06: at most 6 % wider) as c.speed (0..1, already smoothed by the host: up in 0.12 s, down in 0.7 s) rises, on an
 * ease so a slow scroll barely moves it. Exactly `lens` at rest (c.speed is 0 there).
 *   camera: { ...pose, lens: speedLens(pose.lens, c.speed) }
 * @param {number} lens @param {number} speed c.speed @param {number} [max] @returns {number}
 */
export function speedLens(lens, speed, max = 0.06) {
  const s = Math.max(0, Math.min(1, speed || 0)), e = s * s * (3 - 2 * s);
  return lens / (1 + Math.max(0, Math.min(0.06, max)) * e);
}

/**
 * The idle drift of a camera at rest: a slow figure of a few px on the stage's own clock (c.clock.time: simulated
 * seconds, which stop when the stage sleeps; a drift on the host's clock would keep the stage drawing forever).
 * Add it to a pose's pos (and half of it to the target for a gentle turn). @param {number} t seconds @param {number} amp px
 * @returns {number[]}
 */
export function drift(t, amp = 14) {
  return [amp * Math.sin(t * 0.21) + amp * 0.35 * Math.sin(t * 0.53 + 1.3), amp * 0.55 * Math.sin(t * 0.17 + 0.7), amp * 0.8 * Math.sin(t * 0.13 + 2.1)];
}
