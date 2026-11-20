// @ts-check
/**
 * case/glow.js — the glow behind a case's plate (CASE2, chain 9). Now's glow (now.js, lane LIGHT: a squared-off field
 * as wide as the plate, flat behind it, soft past its edges, drawn from a low-discrepancy sequence so every region gets
 * its fair share of points: one smooth field, never patches of cloud), without Now's long slanted band: on a case the
 * band's ends ran into the title's column and its keep-out cut them square.
 *
 * Its light is set by INK, not by weight: the stage gives a formation points in proportion to its weight, so a glow
 * dimmed by its weight thins into separate soft discs (the blotches of round 8). The scene keeps its weight at 1 and
 * sets C.field.ink (0..1) for how bright it is.
 */
import { C } from "../cover/shared.js";

const GN = 40000;
/** the d-dimensional R sequence (Roberts): the k-th coordinate of point i, in [0, 1) */
const PHI6 = (() => { let x = 1.2; for (let k = 0; k < 40; k++) x = Math.pow(1 + x, 1 / 7); return x; })();
const AL = [1, 2, 3, 4, 5, 6].map((k) => 1 / Math.pow(PHI6, k));
const R = (/** @type {number} */ i, /** @type {number} */ k) => (0.5 + i * AL[k]) % 1;
/** an even spread of u in (0, 1) to a normal deviate (logistic approximation, enough for a soft edge) */
const nrm = (/** @type {number} */ u) => { const v = Math.min(1 - 1e-6, Math.max(1e-6, u)); return 0.5513 * Math.log(v / (1 - v)); };
/** @param {{ sw: number, sh: number, z: number, D: number }} q */
function glowSet(q) {
  const d = new Float32Array(GN * 4);
  // the super-gaussian per axis: flat behind the plate, falling off past its edges (reach about 0.7 of the size)
  const sg = (/** @type {number} */ u, /** @type {number} */ e) => { const t = u * 2 - 1; return Math.sign(t) * Math.pow(Math.abs(t), 0.7) + Math.max(-2.2, Math.min(2.2, nrm(e))) * 0.16; };
  for (let i = 0; i < GN; i++) {
    const z = q.z + nrm(R(i, 4)) * 30, s = q.D / (q.D - z);
    const x = sg(R(i, 0), R(i, 2)) * q.sw * 0.5, y = sg(R(i, 1), R(i, 3)) * q.sh * 0.5, w = 0.62 + 0.38 * R(i, 5);
    d[i * 4] = x / s; d[i * 4 + 1] = y / s; d[i * 4 + 2] = z; d[i * 4 + 3] = w;
  }
  return { data: d, path: 0, closed: false };
}
export const glow = {
  share: 0.3, fill: 1, fit: "px", inkArea: 300000, capacity: GN, carry: 1, emit: 0,
  targets: () => glowSet({ sw: 600, sh: 600, z: -520, D: 2100 }),
  look: { ink: 0.16, size: 1.3, mistInk: 0, mistSize: 1.1 },
  motion: { spring: 3.6, speed: 1600, inertia: 0.22, fuzz: 0 },
  flow: { amp: 1.2, wavelength: 900, evolution: 0.02, z: 0.2 },
  respond: { hand: 0.3, wind: 0.5, fadeIn: 1.2, fadeOut: 1.2 },
  /** @param {any} c */
  update(c) {
    const q = C.field;
    if (q) {
      const key = `${Math.round(q.sw / 6)},${Math.round(q.sh / 6)},${Math.round(q.z / 8)},${Math.round(q.D / 20)}`;
      if (c.state.key !== key) { c.state.key = key; c.setTargets(glowSet(q)); }
    }
    // the ink per point scales with the rect's area (inkArea): a phone's plate is a quarter of the tuned one
    const k = q && typeof q.ink === "number" ? q.ink : 1;
    return { ink: (q && q.phone ? 2.2 : 1) * k };
  },
};
