// @ts-check
/**
 * scenes/cover/shared.js — what the cover's three scenes share (spec 50 §1 FIRST VIEWPORT, §4 cover; lane COVER).
 * A folder, never a scene name: the host imports only stage/scenes/NAME.js.
 *
 *  - `C`, one object in module memory read and written by hero.js, now.js and index.js in the host's page order
 *    (hero, now, index) every frame (world.js: the hall, its camera).
 *  - the formations written for the cover (the hall's own, the name, beams and dust, are in world.js):
 *      field    Now's light: the swarm gathered as a soft band deep behind the plate that holds the capture, so the
 *               plate's edges catch it; no outline
 *      fanlight the outlines of the index's fan of nine small plates, in light, just behind them
 *      path     About's emblem: one line of light through the room with five nodes
 *      outline  Obla's emblem: its outline in light (the pillow, the hem, the two eyes), from night/character.js
 *    Lines are straight or drawn from the product's own shapes: no wave, no drop, nothing liquid (spec 50 §0).
 */
import { rng } from "../../night/lib.js";
import { BODY, HEM, EYE } from "../../night/character.js";

export const clamp = (/** @type {number} */ x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export const sstep = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const mix = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ t) => a + (b - a) * t;
export const ease = (/** @type {number} */ t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

/**
 * The cover's shared state.
 * world: the hall's layout for this viewport (world.js ensureWorld); cam, camT: the camera of the frame at host time camT
 * (world.js coverCamera, the same object for hero.js and now.js); at: seconds of the arrival (hero.js); nowTop: Now's
 * top in the document (the end of the flight); field: the glow behind Now's plate; fan: the index's fan of plates
 * ks, kv, kT: the flight's damped progress (world.js flightK)
 * @type {{ world: any, cam: any, camT: number, at: number, nowTop: number, field: any, fan: any, ks?: number, kv?: number, kT?: number, ign?: any, ignAt?: any }}
 */
export const C = { world: null, cam: null, camT: -1, at: 0, nowTop: 0, field: null, fan: null };

/** a gaussian from a generator @param {() => number} r */
const g = (r) => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-9))) * Math.cos(2 * Math.PI * r());

/* ================================================================ field (now) */
const FDN = 36000;
/**
 * Now's light: the swarm gathered deep BEHIND the plate that holds the capture, as a soft field, not an outline: a
 * broad glow as wide as the plate, densest behind its middle and still bright under its four edges (so the plate's own
 * edges catch it), falling off a little past them; plus a long faint band at a shallow slant (the hero's sheaf, come
 * down), whose ends show past the glass on either side and fade to nothing. Deep out of focus, and one target per
 * point (no grain: several points stacked on one target drew a sparkling dot). No frame, no line, no row of points.
 * q: the plate's size on screen (sw, sh), the field's depth (z), the eye's distance (D).
 * @param {{ sw: number, sh: number, z: number, D: number }} q
 */
function fieldSet(q) {
  const r = rng(57), d = new Float32Array(FDN * 4);
  const a = 0.26, ca = Math.cos(a), sa = Math.sin(a);
  for (let i = 0; i < FDN; i++) {
    const z = q.z + g(r) * 30, s = q.D / (q.D - z);
    let x, y, w;
    if (i < FDN * 0.78) {
      // the glow: a squared-off gaussian (a super-gaussian per axis), flat behind the plate, soft past its edges
      const sg = () => { const u = r() * 2 - 1, v = Math.sign(u) * Math.pow(Math.abs(u), 0.7); return v + g(r) * 0.16; };
      x = sg() * q.sw * 0.5; y = sg() * q.sh * 0.5; w = 0.5 + 0.5 * r();
    } else {
      // the band: long and thin, at a slant, fading toward its ends
      const u = g(r) * q.sw * 0.75, v = g(r) * q.sh * 0.07;
      x = u * ca - v * sa; y = u * sa + v * ca; w = 0.6 + 0.4 * r();
    }
    d[i * 4] = x / s; d[i * 4 + 1] = y / s; d[i * 4 + 2] = z; d[i * 4 + 3] = w;
  }
  return { data: d, path: 0, closed: false };
}

export const field = {
  share: 0.3, fill: 1, fit: "px", inkArea: 300000, capacity: FDN, carry: 1, emit: 0,
  targets: () => fieldSet({ sw: 600, sh: 600, z: -520, D: 2100 }),
  look: { ink: 0.16, size: 1.3, mistInk: 0, mistSize: 1.1 },
  motion: { spring: 3.6, speed: 1600, inertia: 0.22, fuzz: 3 },
  flow: { amp: 2, wavelength: 600, evolution: 0.03, z: 0.2 },
  respond: { hand: 0.3, wind: 0.5, fadeIn: 1.2, fadeOut: 1.2 },
  /** @param {any} c */
  update(c) {
    const q = C.field;
    if (q) {
      const key = `${Math.round(q.sw / 6)},${Math.round(q.sh / 6)},${Math.round(q.z / 8)},${Math.round(q.D / 20)}`;
      if (c.state.key !== key) { c.state.key = key; c.setTargets(fieldSet(q)); }
    }
    // the ink per point scales with the rect's area (inkArea): a phone's plate is a quarter of the tuned one
    return q && q.phone ? { ink: 2.2 } : {};
  },
};

/* ================================================================ fanlight (index, Work) */
const FN = 9, FP = 520;
/** the outlines of the fan's plates, in "px" around the emblem's centre @param {{ plates: any[], z: number }} q */
function fanSet(q) {
  const d = new Float32Array(FN * FP * 4), r = rng(9);
  for (let k = 0; k < FN; k++) {
    const p = q.plates[k] || q.plates[0];
    const hw = p.w / 2, hh = p.h / 2, per = 2 * (p.w + p.h), cr = Math.cos(p.roll), sr = Math.sin(p.roll);
    for (let i = 0; i < FP; i++) {
      let s = (i / FP) * per, x, y;
      if (s < p.w) { x = -hw + s; y = -hh; } else if ((s -= p.w) < p.h) { x = hw; y = -hh + s; }
      else if ((s -= p.h) < p.w) { x = hw - s; y = hh; } else { s -= p.w; x = -hw; y = hh - s; }
      x += g(r) * 0.6; y += g(r) * 0.6;
      const j = (k * FP + i) * 4;
      d[j] = p.x + x * cr - y * sr; d[j + 1] = p.y + x * sr + y * cr; d[j + 2] = q.z + p.z * 0.3; d[j + 3] = 0.7 + 0.3 * (k === 4 ? 1 : 0);
    }
  }
  return { data: d, path: 0, closed: false };
}
export const fanlight = {
  share: 0.22, fill: 1, fit: "px", inkArea: 300000, capacity: FN * FP, carry: 1, emit: -1,
  targets: () => fanSet({ plates: Array.from({ length: FN }, (_, k) => ({ x: 0, y: 0, z: 0, w: 80, h: 110, roll: (k - 4) * 0.15 })), z: -60 }),
  look: { ink: 0.045, size: 0.95, mistInk: 0.006, mistSize: 1.1 },
  motion: { spring: 7, speed: 1400, inertia: 0.1, fuzz: 0.4 },
  flow: { amp: 0.6, wavelength: 200, evolution: 0.05, z: 0.2 },
  respond: { hand: 0.2, wind: 0.3, fadeIn: 3, fadeOut: 3 },
  /** @param {any} c */
  update(c) {
    const q = C.fan;
    if (q) { const key = q.key; if (c.state.key !== key) { c.state.key = key; c.setTargets(fanSet(q)); } }
    return {};
  },
};

/* ================================================================ path (index, About) */
const PN = 5, PL = 6, PLN = 220, PK = 420;
/** one line through the room, near at the left and deep at the right, with five nodes (contain units) */
function pathSet() {
  const r = rng(23), d = new Float32Array((PL * PLN + PN * PK) * 4);
  const A = [-0.98, 0.36, 0.3], B = [0.94, -0.3, -0.8];
  let j = 0;
  for (let l = 0; l < PL; l++) {
    const oy = g(r) * 0.006, oz = g(r) * 0.02, ink = 0.5 + 0.4 * r();
    for (let i = 0; i < PLN; i++) {
      const u = i / (PLN - 1);
      d[j++] = mix(A[0], B[0], u); d[j++] = mix(A[1], B[1], u) + oy; d[j++] = mix(A[2], B[2], u) + oz; d[j++] = ink;
    }
  }
  for (let n = 0; n < PN; n++) {
    const u = 0.08 + (n / (PN - 1)) * 0.84, c = [mix(A[0], B[0], u), mix(A[1], B[1], u), mix(A[2], B[2], u)];
    // a node: a short upright tick of light across the line (the last, now, a little taller), a few points thick
    const half = n === PN - 1 ? 0.15 : 0.1;
    for (let i = 0; i < PK; i++) {
      const v = (i / (PK - 1)) * 2 - 1;
      d[j++] = c[0] + g(r) * 0.0035; d[j++] = c[1] + v * half; d[j++] = c[2] + g(r) * 0.004;
      d[j++] = n === PN - 1 ? 1 : 0.8;
    }
  }
  return { data: d, path: 0, closed: false };
}
export const path = {
  share: 0.2, fill: 1, fit: "contain", inkArea: 300000, emit: -1, carry: 1,
  targets: pathSet,
  look: { ink: 0.05, size: 1.0, mistInk: 0.008, mistSize: 1.1 },
  motion: { spring: 5, speed: 1100, inertia: 0.14, fuzz: 1 },
  flow: { amp: 2, wavelength: 200, evolution: 0.05, z: 0.3 },
  respond: { hand: 0.3, wind: 0.3, fadeIn: 3, fadeOut: 3 },
  /** @param {any} c */
  update(c) {
    const p = c.pointer, s = c.state;
    s.yaw ??= 0; s.pitch ??= 0;
    const ty = p.present ? clamp(p.local.x / 1.8, -1, 1) * 0.2 : 0, tp = p.present ? clamp(p.local.y / 1.8, -1, 1) * 0.1 : 0;
    s.yaw += (ty - s.yaw) * (1 - Math.exp(-c.dt / 0.8)); s.pitch += (tp - s.pitch) * (1 - Math.exp(-c.dt / 0.8));
    return { rotate: [0.18 + s.pitch, -0.25 + s.yaw, 0] };
  },
};

/* ================================================================ outline (index, Obla) */
const ON = 4800;
/** Obla's outline (night/character.js's numbers: the superellipse pillow, its ghost hem, the two eyes), contain units */
function outlineSet() {
  const r = rng(31), d = new Float32Array(ON * 4), R = 0.78, e = 2 / 2.7;
  const sg = (/** @type {number} */ v) => (v < 0 ? -1 : 1);
  let j = 0;
  const put = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ z, /** @type {number} */ w) => { d[j++] = x; d[j++] = y; d[j++] = z; d[j++] = w; };
  const nBody = Math.round(ON * 0.72), nEye = Math.round(ON * 0.14);
  for (let i = 0; i < nBody; i++) {
    const a = r() * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    let x = BODY.rx * R * sg(ca) * Math.pow(Math.abs(ca), e);
    let y = BODY.ry * R * sg(sa) * Math.pow(Math.abs(sa), e) - BODY.lift * R;
    if (sa > 0) y += HEM.amp * R * (0.5 - 0.5 * Math.cos(2 * HEM.crests * a)) * (1 - HEM.damping * Math.abs(ca)) * Math.min(1, 4 * sa);
    const o = g(r) * 0.006;
    put(x + o, y + o, g(r) * 0.01, 0.7 + 0.3 * r());
  }
  for (const side of [-1, 1]) {
    const yaw = side * EYE.sp, cx = Math.sin(yaw) * BODY.rx * R, cy = -Math.sin(EYE.p) * BODY.ry * R * -1 - 0.06;
    const ew = EYE.w * R * Math.cos(yaw) * 0.5, eh = EYE.h * R * 0.5;
    for (let i = 0; i < nEye; i++) {
      const a = r() * Math.PI * 2, f = Math.sqrt(r());
      put(cx + Math.cos(a) * ew * f, cy + Math.sin(a) * eh * f, 0.02, 0.9);
    }
  }
  while (j < d.length) { const a = r() * Math.PI * 2; put(Math.cos(a) * 0.95, Math.sin(a) * 0.75, -0.4 + g(r) * 0.2, 0.15); }
  return { data: d, path: 0, closed: false };
}
export const outline = {
  share: 0.2, fill: 1, fit: "contain", inkArea: 300000, emit: -1, carry: 1,
  targets: outlineSet,
  look: { ink: 0.05, size: 1.0, mistInk: 0.008, mistSize: 1.1 },
  motion: { spring: 5, speed: 1100, inertia: 0.14, fuzz: 1 },
  flow: { amp: 2, wavelength: 200, evolution: 0.05, z: 0.3 },
  respond: { hand: 0.3, wind: 0.3, fadeIn: 3, fadeOut: 3 },
  /** @param {any} c */
  update(c) {
    const p = c.pointer, s = c.state;
    s.yaw ??= 0;
    const ty = p.present ? clamp(p.local.x / 1.8, -1, 1) * 0.25 : 0;
    s.yaw += (ty - s.yaw) * (1 - Math.exp(-c.dt / 0.8));
    return { rotate: [0, s.yaw, 0] };
  },
};

/* ================================================================ rest (index, no cue) */
const LX = 9, LY = 7, LZ = 5, LP = 6;
/** the swarm at rest in the figure's half: a still lattice of small points through the room's depth (the studio's
 *  measured volume), seen from three quarters; every emblem gathers from it and returns to it (contain units) */
function restSet() {
  const r = rng(61), d = new Float32Array(LX * LY * LZ * LP * 4);
  let j = 0;
  for (let a = 0; a < LX; a++) for (let b = 0; b < LY; b++) for (let k = 0; k < LZ; k++) {
    const x = -0.95 + (1.9 * a) / (LX - 1), y = -0.72 + (1.44 * b) / (LY - 1), z = -0.95 + (1.3 * k) / (LZ - 1);
    const ink = 0.55 + 0.45 * r();
    for (let q = 0; q < LP; q++) { d[j++] = x + g(r) * 0.003; d[j++] = y + g(r) * 0.003; d[j++] = z + g(r) * 0.003; d[j++] = ink; }
  }
  return { data: d, path: 0, closed: false };
}
export const rest = {
  share: 0.06, fill: 1, fit: "contain", inkArea: 300000, emit: -1, carry: 1,
  targets: restSet,
  look: { ink: 0.05, size: 0.9, mistInk: 0.004, mistSize: 1.1 },
  motion: { spring: 4, speed: 900, inertia: 0.16, fuzz: 0.3 },
  flow: { amp: 0.5, wavelength: 300, evolution: 0.04, z: 0.2 },
  respond: { hand: 0.4, wind: 0.4, fadeIn: 2.4, fadeOut: 2.4 },
  // still: the lattice never turns by itself (the camera's few degrees of the pointer give it its depth)
  update() { return { rotate: [0.32, -0.62, 0] }; },
};
