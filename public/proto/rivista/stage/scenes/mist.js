// @ts-check
/**
 * mist — the swarm as mist only (spec 50 §4: the nine cases, and any section that names it): the calm field of
 * night/mist.js over the whole viewport, light on the night, ink inside a day rectangle. The host gives this scene to a
 * case page's main (main[data-case]). The section's pictures are keep-outs: no point lies on a capture.
 *
 * (wave 1, lane WORK; wave 2, GLOW-WORK) The chapters stand in the same room as the opener, lit as it is (room glow):
 * two blades on the figure's side with their haze, chips at every depth; the text kept clear by the kit's keepDim (the
 * wall dimmed round each block, never cut into a dark card) (lib/room.js). The eye is the case page's (case.js caseEye): one continuous
 * shot with the opener, so the host mixes two equal poses at their boundary.
 *
 * (lane CASES) Every chapter has its figure of light in the room beside its text (case/figures.js): the work's plate, a
 * line of light through the nodes, bars of light, a stack of thin plates; the room's subject light stands behind it and
 * the hand orbits the eye about it.
 *
 * (wave 6, lane ROOMS) More work, the index of the nine, has the index's figure: the prism and its ray (lib/prism.js
 * registers the pass "rays"; case/figures.js says where).
 */
import mist from "../night/mist.js";
import { room } from "./lib/room.js";
import { speedLens, drift } from "./lib/camera.js";
import { caseEye, CASE, CASE_SEED } from "./case.js";
import { chapterFigures, barsDef, lineDef } from "./case/figures.js";
import "./lib/prism.js";

export default {
  formations: { mist, bars: barsDef, line: lineDef },
  /** @param {any} c */
  frame(c) {
    const phone = c.vw < 1024, EYE = caseEye(c, CASE.arrive), C = EYE.pos, D = EYE.D;
    const F = chapterFigures(c, EYE);
    const media = c.media.map((/** @type {any} */ r) => ({ x: r.x - 4, y: r.y - 4, w: r.w + 8, h: r.h + 8 }));
    // the chapters' text as the page lays it out (the host's own list stops at its first blocks on a long page)
    const keep = [...(F.keep.length ? F.keep : c.textRects({ pad: 14, max: 10 })), ...media].slice(0, 14);
    // (wave 2, GLOW-WORK) lit as the opener: two blades on the figure's side, their haze, chips at every depth; the
    // text kept clear by the kit's keepDim (the wall dimmed round it, never cut)
    const R = room(c, { temp: EYE.temp, seed: CASE_SEED, eye: C, keep, dim: phone ? 0.35 : 0.15, chips: phone ? 4000 : 7000, hand: false, glow: 1, sweep: phone ? undefined : [0.3, 1],
      // the figure's light: a broad soft band on the wall behind it
      subject: F.subject || undefined,
      // the captures are keep-outs too: the wall stays faint across them
      keepDim: { floor: 0.12 } });
    // (lane CASES) a phone with a measured chapter on screen: a short fall, or the bars in the rows' strips fade under it
    if (c.look) c.look({ ...R.look, keepFeather: phone ? (F.barsNear ? 8 : 24) : 80 });
    const dr = drift(c.clock ? c.clock.time : 0, phone ? 5 : 9);
    const pos = [C[0] + dr[0], C[1] + dr[1], C[2] + dr[2]];
    return {
      swarm: [...F.swarm, { id: "mist", weight: 0.8 - 0.3 * F.p, rect: { x: 0, y: 0, w: c.vw, h: c.vh } }],
      slabs: F.slabs,
      keepouts: R.keepouts,
      field: R.field,
      camera: {
        pos, target: [C[0] + dr[0] * 0.5, C[1] + dr[1] * 0.5, C[2] - D], lens: speedLens(1, c.speed), focus: D, aperture: 0.9, damp: 0,
        // the hand turns the eye about the figure (the bars on their rows: barely)
        orbit: { yaw: phone ? 0.1 : 0.12, pitch: 0.05, damp: 1.1, ...(F.pivot ? { pivot: F.pivot } : {}) }, fog: [3 * D, 7 * D],
      },
      bloom: { strength: 0.3 + 0.12 * F.p, threshold: 0.55, knee: 0.3, plates: 0.08 + 0.06 * F.p },
      rest: 14,
      ...(F.passes ? { passes: F.passes } : {}),
    };
  },
};
