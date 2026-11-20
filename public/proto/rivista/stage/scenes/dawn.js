// @ts-check
/**
 * dawn — the close of every page (spec 50 §4, §5 "Dawn"): the section marked [data-dawn] is a day rectangle; at its
 * straight top edge the threads of day/threads.js cross from the night into the morning, light above, cobalt ink
 * below. The scene weighs itself by where the edge is (blend: false): full while the edge is in the screen's middle
 * band, nothing once the morning fills the screen or before the edge comes up. Its text blocks are keep-outs.
 */
import threads, { input } from "../day/threads.js";

const sstep = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export default {
  blend: false,
  formations: { threads },
  /** @param {any} c */
  frame(c) {
    if (c.ground === "dawn") return null;                        // a dawn page has no edge
    const edge = c.section.y, e = edge / c.vh;
    const weight = sstep(1.12, 0.8, e) * (1 - sstep(0.1, -0.3, e));
    if (weight <= 0.001) return { swarm: [] };
    // how far below the edge the day may carry ink before the first text
    const below = c.texts.filter((/** @type {any} */ t) => t.y > edge + 4).map((/** @type {any} */ t) => t.y - edge);
    input.vw = c.vw; input.vh = c.vh; input.phone = c.phone; input.inkK = c.inkK;
    input.room = Math.max(16, (below.length ? Math.min(...below) : c.vh * 0.2) - 24);
    const H = c.vh * 0.5;
    // (FIX3D) the straight view, focused on the page's plane with a short depth of field: the strokes lie on the page
    // and stay ruled and sharp (blended with a night scene's focus deep in its room they drew as soft blue curves at
    // the edge, a wave). It is the pose the host gave a scene without a camera; only the focus is new.
    const D = Math.min(2600, Math.max(1100, 1.25 * Math.hypot(c.vw, c.vh)));
    return {
      camera: { pos: [c.vw / 2, c.vh / 2, D], target: [c.vw / 2, c.vh / 2, 0], focus: D, aperture: 0.2, lens: 1, roll: 0 },
      swarm: [{ id: "threads", weight, rect: { x: 0, y: edge - H / 2, w: c.vw, h: H } }],
      keepouts: c.texts.map((/** @type {any} */ t) => ({ x: t.x - 6, y: t.y - 6, w: t.w + 12, h: t.h + 12 })),
    };
  },
};
