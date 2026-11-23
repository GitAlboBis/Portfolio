// @ts-check
/**
 * obla — Obla's scene (spec 50 §4; the character as built, spec 10 §6.2): the agent that works at night. One figure,
 * night/obla.js: the character's lit body and the light around it, both following its state, which follows the step
 * (0 the intro: idle; 1 listening, 2 thinking, 3 working, 4 approval, 5 sleeping, then the morning report at the end
 * of step 5). It fills the figure's half of the view (ctx.fig), unboxed. As the morning rises past the middle of the
 * screen the host lets its light go (every blended scene does).
 */
import obla from "../night/obla.js";
import { DEPTH, eyeD, home, shot, stations, lookFor, roomFor, bloomOf, SEED, LIT, clearOf } from "../night/shot.js";
import { follow } from "./lib/camera.js";
/** @param {number} a @param {number} b @param {number} x */
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** (wave 1, NIGHT) the five states are five places in the room (and the intro's): x in viewport widths, y in heights,
 *  z in eye distances D. The character walks deeper into the room through the night; the eye follows it (a gain under
 *  1, so the walk also shows on screen), a blade on it. */
const PLACES = {
  desk: [[0, 0, 0], [-0.07, 0.02, -0.16], [0.08, -0.03, -0.32], [-0.05, 0.03, -0.46], [0.07, 0, -0.6], [0, 0.02, -0.74]],
  phone: [[0, 0, 0], [-0.03, 0, -0.14], [0.03, 0, -0.28], [-0.03, 0, -0.4], [0.03, 0, -0.52], [0, 0, -0.64]],
};

/** (wave 7, STAGE) how much of the night is left under Obla as the morning comes up (frame() writes it; the figure's
 *  update reads it in the same frame): its points fade where they stand, never released lit to drift over the day */
const DAY = { k: 1 };
const oblaLit = { ...obla, update(/** @type {any} */ c) {
  const r = obla.update ? obla.update(c) : null;
  return DAY.k < 1 && r ? { ...r, ink: (r.ink ?? 1) * DAY.k * DAY.k } : r;
} };

export default {
  formations: { obla: oblaLit },
  /** @param {any} c */
  frame(c) {
    const f = c.fig, m = Math.min(f.w, f.h) * (c.phone ? 0.03 : 0.06);
    let rect = { x: f.x + m, y: f.y + m, w: Math.max(1, f.w - 2 * m), h: Math.max(1, f.h - 2 * m) };
    // the body is drawn opaque: with the figure on top and the text across (a phone, a narrow window) Obla keeps to
    // the widest band of the figure's half that no text crosses, smaller as a step's text rises into it, and steps
    // back when the band is too thin; its light keeps off the text (INTEGRATE, from DRIVE: on the phone the character
    // sat over "OBLA", "LAVORA", "RIFERISCE" as the steps scrolled up under it)
    let w = 1;
    /** @type {any[]} */ let keepouts = [];
    if (c.side === "top") {
      // PHONE lane (chain 9): the band is looked for over the whole screen under the header, not only the figure's top
      // part: as the opening's text scrolls up into the top of the screen, the character takes the free room below it
      // instead of shrinking to a dim mark under the header with the lower half empty. It never slides across the
      // text to get there: when the best band changes side, it fades, moves while unseen, and comes back.
      // (wave 7, STAGE) and never above the section's own top: in the home Obla comes up under Consulting's last block,
      // whose text is not this scene's (c.texts): the band ran from the header down over it, and the character stood
      // huge and grey across "WRITE TO ME", cut by that text's keep-outs. On Obla's own page the section starts at 0.
      // 60: under the header; (wave 9, J3 VIEWPORT) and its top safe area under a notch (c.safeTop, 0 elsewhere)
      const hd = 60 + (c.safeTop || 0);
      const fh = rect.h, y0 = Math.max(hd, c.section ? c.section.y : hd), y1 = c.vh - Math.max(16, m), pad = 14;
      const cut = c.texts.filter((/** @type {any} */ t) => t.y < y1 && t.y + t.h > y0 && t.x < rect.x + rect.w && t.x + t.w > rect.x)
        .map((/** @type {any} */ t) => [t.y - pad, t.y + t.h + pad]).sort((/** @type {number[]} */ a, /** @type {number[]} */ b) => a[0] - b[0]);
      /** @type {number[][]} */ const free = [];
      let at = y0;
      for (const [a, b] of cut) { if (a > at) free.push([at, a]); at = Math.max(at, b); }
      if (y1 > at) free.push([at, y1]);
      const s = c.state, dt = Math.min(0.1, c.dt || 0);
      const size = (/** @type {number[]} */ b) => b[1] - b[0];
      let best = free.reduce((p, q) => (size(q) > size(p) ? q : p), [y0, y0]);
      // keep to the band that holds the character unless another is clearly larger (no flicker between two equal ones)
      if (s.gy != null) {
        const mid = s.gy + s.gh / 2, here = free.find((b) => b[0] <= mid && b[1] >= mid);
        if (here && size(here) * 1.25 >= size(best)) best = here;
      }
      let gy = best[0], gh = Math.max(1, size(best));
      // never larger than the figure's own part of the screen: centred in a taller band
      if (gh > fh * 1.08) { gy += (gh - fh * 1.08) / 2; gh = fh * 1.08; }
      if (s.gy == null) { s.gy = gy; s.gh = gh; s.hop = 0; }
      // a band that does not hold the character's centre is on the other side of a text block: hop, do not slide
      const mid = s.gy + s.gh / 2, far = mid < best[0] || mid > best[1];
      // (while it waits to hop it holds still: its springs at rest)
      if (far) { s.hop += dt; s.gyV = 0; s.ghV = 0; } else s.hop = 0;
      // (the hop: it moved while unseen and comes back at rest there)
      if (s.hop > 0.3) { s.gy = gy; s.gh = gh; s.gyV = 0; s.ghV = 0; s.hop = 0; }
      else if (!far) {
        // (wave 8, lane SMOOTH) the band rides critically damped springs (lib/camera.js follow), landing exactly (a
        // creeping value keeps the stage awake): the first-order lag it rode set off at full speed in one frame when a
        // text entered the band or left it, and braked with a corner in its speed as the page stopped
        follow(s, "gy", gy, dt, 0.07, 0.05);
        follow(s, "gh", gh, dt, 0.07, 0.05);
      }
      rect = { x: rect.x, y: s.gy, w: rect.w, h: s.gh };
      const room = s.gh / fh;
      w = s.hop > 0 ? 0 : room < 0.3 ? 0 : room > 0.5 ? 1 : (room - 0.3) / 0.2;
      // (wave 7, STAGE) in the home the character comes up as Obla's part takes the screen (its top above the upper
      // third), not half seen under the screen's edge while Consulting's last block is read
      w *= sstep(0.55, 0.25, (c.section ? c.section.y : 0) / c.vh);
      keepouts = c.texts.map((/** @type {any} */ r) => ({ x: r.x - 8, y: r.y - 6, w: r.w + 16, h: r.h + 12 }));
    }
    // ------------------------------------------------ the place in the room and the shot
    const D = eyeD(c.vw, c.vh), ph = c.phone;
    // (wave 8, lane SMOOTH) one count through every step, the intro's too: station k stands at the middle of step k and
    // the walk to the next crosses its boundary. The intro (step 0) was held at 0 to its end, so the first walk began
    // halfway through, in one frame: the eye jumped about 100 px (6236 px/s for a frame on the live site, rec/live-obla)
    const x = c.step + c.local - 0.5;
    const kf = stations(Math.max(0, x), 6);
    const P = (ph ? PLACES.phone : PLACES.desk).map((p) => [p[0] * c.vw, p[1] * c.vh, p[2] * D]);
    const i0 = Math.min(4, Math.floor(kf)), fk = kf - i0;
    const T = [0, 1, 2].map((j) => P[i0][j] + (P[i0 + 1][j] - P[i0][j]) * fk);
    DEPTH.obla = T[2];
    const world = { x: rect.x + T[0], y: rect.y + T[1], w: rect.w, h: rect.h };
    const gain = ph ? 0.88 : 0.68, H = home(c);
    const piv = [world.x + world.w / 2, world.y + world.h / 2, T[2]];
    const pose = { ...H, pos: [H.pos[0] + gain * T[0], H.pos[1] + gain * T[1], H.pos[2] + gain * T[2]],
      target: [H.target[0] + gain * T[0], H.target[1] + gain * T[1], T[2]], pivot: piv };
    pose.focus = H.pos[2] + gain * T[2] - T[2];
    const R = roomFor(c, {
      seed: SEED.obla, wall: { z: -1.4 * D }, eye: [c.vw / 2, c.vh / 2, D],
      subject: { x: piv[0], y: piv[1] + 0.3 * c.vh, z: piv[2], w: rect.w * 0.8, h: 1.5 * c.vh },
      ...LIT(c),
      // (wave 2, FIX) no chip between the eye and the character inside its box (chips crossed its face at every step)
      clear: clearOf(c, pose, piv, Math.min(rect.w, rect.h) * 0.62, Math.min(rect.w, rect.h) * 0.56, 0),
    });
    lookFor(c, R);
    /* (wave 7, STAGE) THE MORNING COMES UP UNDER OBLA (the home's edge into Contact, and Obla's own close): its light
       and its body go while the day's straight edge rises through the screen below the figure, before the edge reaches
       it. The host lets a night scene's light go only once the edge passes the middle of the screen; Obla's figure
       stands in the upper half, so at a reader's pace its report card was still lit when the edge reached it and
       crossed into the day as an ink ghost on the paper, and its light blurred into a haze under the morning's sharp
       camera. */
    const day = c.dawn && c.dawn.length ? Math.min(...c.dawn.map((/** @type {any} */ d) => d.y)) : Infinity;
    DAY.k = day < Infinity ? sstep(rect.y + rect.h, rect.y + rect.h + 0.12 * c.vh, day) : 1;
    w *= DAY.k;
    return {
      swarm: [{ id: "obla", weight: w, rect: world }],
      keepouts: [...R.keepouts, ...keepouts],
      // (wave 5, GLASS2) the lens closes as the section leaves the screen (consult.js: the dawn's strokes stay sharp)
      camera: shot(c, pose, { fog: [3.2 * D, 7.5 * D], aperture: 0.6 * (c.section ? 0.02 + 0.98 * sstep(0.8, 1.15, (c.section.y + c.section.h) / c.vh) : 1) }),
      bloom: bloomOf(0.5), field: R.field, rest: 14,
    };
  },
};
