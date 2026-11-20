// @ts-check
/**
 * threads — the straight edge where the night becomes morning (spec 50 §1, §4 "dawn", §5 "Dawn").
 *
 * A few long fine strokes, ruled straight, lie across the page's closing edge: each one crosses it once at its own
 * shallow angle (a few degrees, alternately rising and falling), like strings or rays, so they cross one another too
 * (on a phone they all lean alike, near-parallel: on a narrow screen the crossings read as a flat X).
 * No curve anywhere: a curve over a horizon reads as a wave (lane LIGHT, fix round). Above the edge a stroke is light
 * on the night; the points that cross the edge stop being light and are cobalt ink on the white (the stage decides it
 * per fragment, from the day rectangles). A stroke is only as long as the room above and below allows (the night's
 * last text, the day's first text), and its two ends come out of the dark, never start on a cut. Calm: the particles
 * only slide along their strokes; nothing pours, drips or pools.
 *
 * Local space: css px ("px"), y = 0 on the edge, negative above it (the night). The scene (scenes/dawn.js) writes
 * `input` every frame: the viewport, how far the day may go before its first text, the tier's ink factor.
 */
import { rng } from "../night/lib.js";

const N = 180;

export const input = { vw: 1440, vh: 900, phone: false, room: 140, inkK: 1 };

/** @param {any} H @param {number} vw @param {number} vh @param {boolean} phone @param {number} room */
function build(H, vw, vh, phone, room) {
  const K = phone ? 4 : 5, r = rng(907), out = [];
  const xL = -vw / 2 - 60, xR = vw / 2 + 60;
  for (let k = 0; k < K; k++) {
    // where it crosses the edge, spread across the width
    const xc = (-0.42 + (0.84 * (k + 0.25 + 0.5 * r())) / K) * vw;
    // its slope: a few degrees, alternately rising and falling (a phone is narrow: a little steeper, or the strokes
    // would not cross the edge inside the screen)
    // (wave 4, PRISM) on a phone they all lean the same way and nearly alike (alternate leans crossed as a flat X above
    // and below the close's title on a narrow screen): near-parallel rules
    // (wave 5, GLASS2) and their slopes within a third of a degree: two strokes a little apart in slope still met inside
    // the screen
    const deg = phone ? 6.6 + 0.3 * r() : 2.2 + 4.2 * r();
    const m = (phone ? -1 : k % 2 ? 1 : -1) * Math.tan((deg * Math.PI) / 180);
    // how far it may reach above (night) and below (day)
    const up = vh * (phone ? 0.035 + 0.04 * r() : 0.06 + 0.08 * r());
    const down = Math.max(12, Math.min(room, vh * (0.05 + 0.08 * r())));
    // the x range where y = m (x - xc) stays inside [-up, down], cut to the screen
    const xa = xc + (m > 0 ? -up / m : down / m), xb = xc + (m > 0 ? down / m : -up / m);
    const x0 = Math.max(xL, Math.min(xa, xb)), x1 = Math.min(xR, Math.max(xa, xb));
    if (x1 - x0 < 40) { out.push([[xL, -4000, 0, 0], [xL + 1, -4000, 0, 0]]); continue; }   // parked, unseen
    const z0 = -20 + 26 * r(), z1 = z0 + (r() - 0.5) * 16;    // depth changes linearly: the stroke stays straight
    const ink = 0.75 + 0.25 * r(), pts = [];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40, x = x0 + (x1 - x0) * u, y = m * (x - xc);
      // the two ends come out of the dark (unless the stroke runs off the screen there)
      const fa = x0 > xL + 1 ? Math.min(1, u / 0.18) : 1, fb = x1 < xR - 1 ? Math.min(1, (1 - u) / 0.18) : 1;
      // light carries more energy per point than ink on white: the night part is fainter per point
      pts.push([x, y, z0 + (z1 - z0) * u, ink * (y < 0 ? 0.8 : 1) * fa * fb]);
    }
    out.push(pts);
  }
  return H.join(out.map((l) => H.polyline(l, N, { closed: false })));
}

export default {
  share: 0.3, fill: 1, fit: "px", emit: -1, capacity: 5 * N,
  targets: (/** @type {any} */ H) => build(H, 1440, 900, false, 140),
  look: { ink: 0.12, size: 0.62, mistInk: 0, mistSize: 1.1 },
  motion: { spring: 4.5, speed: 1500, inertia: 0.2, fuzz: 0.2 },
  // almost no curl: a ruled stroke stays ruled
  flow: { amp: 0.25, wavelength: 260, evolution: 0.05, z: 0.2 },
  respond: { hand: 0.6, wind: 0.25, fadeIn: 0.8, fadeOut: 1.2 },
  tails: { share: 0, length: 60, emitters: 60 },
  /** @param {any} c */
  update(c) {
    const st = c.state, I = input;
    const key = [Math.round(I.vw), Math.round(I.vh / 40), I.phone ? "p" : "", Math.round(I.room / 20)].join(",");
    if (st.key !== key) { st.key = key; c.setTargets(build(c.H, I.vw, I.vh, I.phone, I.room)); }
    // the particles slide along their strokes, slowly (simulated time: still when the stage rests)
    return { shift: c.time * 6, ink: I.inkK * (I.phone ? 0.3 : 1) };
  },
};
