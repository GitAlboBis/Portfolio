// @ts-check
/**
 * scenes/cover/shared.js — what the cover's scenes share (spec 50 §1 FIRST VIEWPORT, §4 cover; lane COVER).
 * A folder, never a scene name: the host imports only stage/scenes/NAME.js.
 *
 *  - `C`, one object in module memory read and written by hero.js and now.js in the host's page order (hero, now)
 *    every frame (world.js: the hall, its camera); case.js and case/glow.js use its `field` slot for a case's glow.
 *  - (wave 7, STAGE) the index left the home (the director's decision 2: the home is one continuous scroll through every
 *    page's experience), and with it index.js and the formations only it drew here (Now's old field, the fan's outlines,
 *    About's path emblem, Obla's outline emblem). The prism stays under "More work" in the cases (lib/prism.js and the
 *    plates' prism).
 */

export const clamp = (/** @type {number} */ x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export const sstep = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const mix = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ t) => a + (b - a) * t;
export const ease = (/** @type {number} */ t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

/**
 * The cover's shared state.
 * world: the hall's layout for this viewport (world.js ensureWorld); cam, camT: the camera of the frame at host time camT
 * (world.js coverCamera, the same object for hero.js and now.js); at: seconds of the arrival (hero.js); nowTop: Now's
 * top in the document (the end of the flight); field: the glow behind Now's plate (and a case's, case/glow.js)
 * ks, kv, kT: the flight's damped progress (world.js flightK)
 * @type {{ world: any, cam: any, camT: number, at: number, nowTop: number, field: any, ks?: number, kv?: number, kT?: number, ign?: any, ignAt?: any }}
 */
export const C = { world: null, cam: null, camT: -1, at: 0, nowTop: 0, field: null };

/* (wave 7, COSMOS) the index's still lattice of points (`rest`, unused since the index lost it) is gone with the grid:
   nothing of a lattice anywhere */
