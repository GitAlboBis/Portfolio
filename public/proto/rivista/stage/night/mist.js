// @ts-check
/**
 * mist — the calm field (spec 50 §1, §3): the swarm at rest in the room, deep behind the page. Sparse points of light
 * spread through the depth (most of them far, soft by depth of field), drifting on a slow curl flow. Over text the
 * swarm is mist: well under a tenth of the screen's area carries light. A formation any scene may register (its rect
 * is the area it fills: the viewport, a half, a band).
 *
 * The points are written in "stretch" units (x, y in [-1.15, 1.15] of the rect, a little past its edges so the field
 * has no border), z in css px toward the reader: far -620 .. -140.
 */
import { rng } from "./lib.js";

const N = 2400;

/** @param {number} seed */
function field(seed) {
  const r = rng(seed), d = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const far = Math.pow(r(), 0.7);                         // most points far
    d[i * 4] = (r() * 2 - 1) * 1.15;
    d[i * 4 + 1] = (r() * 2 - 1) * 1.15;
    d[i * 4 + 2] = (-140 - 480 * far) / 400;                // stretch: z in contain units of a 800 px rect
    d[i * 4 + 3] = 0.35 + 0.65 * r() * r();                  // a few brighter points among many faint ones
  }
  return { data: d, path: 0, closed: false };
}

export default {
  share: 0.35, fill: 1, fit: "stretch", inkArea: 1300000, capacity: N, emit: 0, carry: 0.85,
  targets: () => field(73),
  look: { ink: 0.05, size: 1.1, mistInk: 0, mistSize: 1.1 },
  motion: { spring: 0.9, speed: 160, inertia: 0.6, fuzz: 10 },
  flow: { amp: 14, wavelength: 520, evolution: 0.04, z: 0.5 },
  respond: { hand: 0.6, wind: 0.5, fadeIn: 2.4, fadeOut: 2.4 },
  tails: { share: 0, length: 60, emitters: 60 },
};
