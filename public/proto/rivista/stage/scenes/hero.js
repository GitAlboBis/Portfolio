// @ts-check
/**
 * hero — the cover's first scene, version 2 (round 11, lane HERO2): a world seen by a moving camera
 * (scenes/cover/world.js says what stands in it and how the shot runs).
 *
 * The page's h1 is the accessible name and the whole first screen of the printed states; while the stage is expected it
 * is transparent from the first paint (css/page-cover.css) and the name exists only as light. The scene runs:
 *   0 – 1.3 s   THE IGNITION: from darkness, the letters ignite one after another, A to I, 70 ms apart: each letter's
 *               points streak in along straight lines out of the depth behind it and lock into place (outline first,
 *               then the face; the contour layers follow a beat later); the glow flares with each letter. The camera,
 *               close and low at the first letter, arcs toward the front and pulls back (world.js, 2.9 s).
 *   1.4 – 3 s   THE HALL: the shafts of light switch on one by one (light running down them), the lit plates of his
 *               work fade up in the depth (each once its capture is decoded), the camera settles; the foot rises at
 *               about 2 s (css). Any scroll, key or press runs the rest of it at once; a reader restored lower down
 *               gets the hall at rest. Once per load.
 *   rest        a slow drift on the stage's clock, the pointer's orbit, a band of light crossing the letters now and
 *               then; the scroll flies the camera through the name to Now's plate (now.js returns the same camera).
 *
 * The foot of the first screen (role, sentence, the button and two links) is real text: the swarm keeps out of it at
 * rest and no plate is placed over it or over the header.
 */
import { C, clamp, sstep, mix } from "./cover/shared.js";
import { face, deep, shafts, sheen, ensureWorld, prepareWorld, coverCamera, flightK, hallField, liveKeeps } from "./cover/world.js";

/** seconds from the stage's first frame of the world: the first letter's ignition, the gap between two letters */
// (round 11b) 100 ms a letter (v2: 70): each lands before the next starts, so no two letters' streaks cross
const IGN0 = 0.15, IGN_DT = 0.1, DEEP_LAG = 0.16;
/** the shafts switch on one by one */
const SHAFT0 = 1.3, SHAFT_DT = 0.4, SHAFT_S = 0.6;
/** the lit plates (round 12): in the room from the first frame, dim, at their light by PLATE_FULL s */
const PLATE_DIM = 0.22, PLATE_FULL = 1.8, PLATE_PEAK = 0.62;
/** (wave 3, LIGHT3) a cover reached by a CUT starts its opening here (s): the name lit, the hall at full light, the eye
 *  on the last part of its move (OPEN_S 2.6) while the sheet leaves; a cold load still starts at 0 */
const CUT_AT = 2.0;
/** the name is lit (the h1's .is-lit moment): the host's fx:stage:lit waits for it (litSignal) */
const LIT_AT = 1.45;
/** a capture per plate (the img[data-slab] ids of parts/b-hero.html) */
const TEX = ["w1", "w2"];

// (lane NAME) ?name=splat: the name built of gaussian blocks (cover/splatname.js, imported only with the switch)
const NAME_SPLAT = typeof location !== "undefined" && /[?&]name=splat(?:&|$)/.test(location.search);
/** @type {any} */ let SN = null;
if (NAME_SPLAT) import("./cover/splatname.js").then((m) => { SN = m; }, () => {});

// (round 12, COVER3FIX) the world is built ahead, while the stage's pipelines compile (boot.js fetches this module as
// soon as the DOM is parsed): the name's raster and targets (~70 ms) no longer stand between the pipelines and the
// first frame. The tier is guessed as tier.js would (a touch or narrow screen: B); a wrong guess is rebuilt on frame 1.
if (typeof document !== "undefined" && document.fonts && typeof location !== "undefined") {
  const pre = () => {
    try {
      const E = document.documentElement, vw = E.clientWidth, vh = E.clientHeight;
      const q = new URLSearchParams(location.search).get("tier");
      const touch = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
      const tier = q && /^[ABC]$/.test(q) ? q : touch || innerWidth < 768 ? "B" : "A";
      // (lane n-fix-flight) reached by a flight (the router): in slices between the flight's frames, never one long task
      const W = /** @type {any} */ (window);
      if (vw > 0 && vh > 0) { if (W.__rvRouter && W.__rvArrive && W.__rvArrive.fly) prepareWorld({ vw, vh, phone: vw < 760, tier }); else ensureWorld({ vw, vh, phone: vw < 760, tier }); }
      // (lane NAME, ?name=splat only) the name's blocks are built from here, beside the stage's boot
      if (NAME_SPLAT) import("./cover/splatname.js").then((m) => m.prebuild(), () => {});
    } catch { /* built on the first frame instead */ }
  };
  document.fonts.load('800 100px "Sofia Sans Extra Condensed"').then(() => setTimeout(pre, 0), () => {});
}

// a key during the opening runs it to its end (the pointer and the scroll are read from ctx)
let keyed = false;
if (typeof addEventListener === "function") addEventListener("keydown", () => { keyed = true; }, { passive: true });

/** the reveal's upper bound at time t through consecutive ranges [a, b] starting at t0 + i dt, each lasting dur
 *  @param {number[][]} R @param {number} t @param {number} t0 @param {number} dt @param {number} dur */
function sweep(R, t, t0, dt, dur) {
  let hi = -0.01, cur = -1;
  for (let i = 0; i < R.length; i++) {
    const p = clamp((t - (t0 + i * dt)) / dur);
    if (p <= 0) break;
    hi = mix(R[i][0], R[i][1], p) + (p >= 1 ? 0.0005 : 0);
    cur = i;
  }
  return { hi, cur };
}

export default {
  formations: { face, deep, shafts, sheen },
  // (lane n-fix-flight) what this scene must have before its first frame after a flight: the name's sets, built in
  // slices (cover/world.js prepareWorld); the host starts it with the modules and waits for it before the room stands
  /** @param {{ vw: number, vh: number, phone: boolean, tier?: string }} c */
  prepare: (c) => prepareWorld(c),
  blend: false,
  glassEntry: true,
  // (wave 3, LIGHT3) the cover says when its subject, the name, is lit (fx-stage.js: fx:stage:lit, FX.stage.lit)
  litSignal: true,
  /** @param {any} c */
  frame(c) {
    const s = c.state, vw = c.vw, vh = c.vh, y = c.scrollY, sec = c.section;
    C.nowTop = Math.max(1, sec.y + y + sec.h);
    const W = ensureWorld(c);
    if (!W) return null;
    // ------------------------------------------------ the opening's clock: once per load, from the first frame the world
    // exists; a reader restored lower down gets the hall at rest; a scroll, a key or a press runs it to its end
    // (wave 3, LIGHT3) reached by a cut (ctx.arrival.cut): no cold three-second opening; the hall is lit under the sheet
    if (s.at == null) { s.at = y > vh * 0.12 ? 99 : c.arrival && c.arrival.cut ? CUT_AT : 0; s.y0 = y; keyed = false; }
    if (Math.abs(y - s.y0) > 3 || c.pointer.down || keyed) s.fast = true;
    s.at += (c.dt || 0) * (s.fast ? 6 : 1);
    const at = (C.at = s.at);
    // ------------------------------------------------ the ignition: the reveal sweeps the letters; the points that join
    // start behind the letter now igniting (the outline from half way, the face from the depth)
    const Lt = W.letters, D = W.D;
    const fr = sweep(Lt.map((/** @type {any} */ l) => [l.f0, l.f1]), at, IGN0, IGN_DT, IGN_DT);
    const dr = sweep(Lt.map((/** @type {any} */ l) => [l.d0, l.d1]), at, IGN0 + DEEP_LAG, IGN_DT, IGN_DT);
    const done = at > IGN0 + DEEP_LAG + IGN_DT * (Lt.length + 1);
    const lf = Lt[Math.max(0, fr.cur)], ld = Lt[Math.max(0, dr.cur)];
    const igniting = !done && fr.cur >= 0;
    const sw = sweep(W.sets.shafts.ranges, at, SHAFT0, SHAFT_DT, SHAFT_S);
    C.ign = done ? { shafts: at > SHAFT0 + SHAFT_DT * 2 + SHAFT_S ? undefined : [0, sw.hi, 0.02] } : {
      face: [0, fr.hi, 0.002],
      // the outline streaks in out of the depth; the face then lights on its place (a crowd of points in flight
      // over the letter read as a burnt block)
      // (round 12, COVER3FIX) a short streak (0.3 of the way from the spawn): from the opening's oblique eye a full one
      // crossed the neighbours as a white smear
      emit: fr.cur >= 0 && fr.hi < lf.fo ? 0.3 : 0,
      // (round 11b) from just behind the letter (v2: a third of D behind, whose streaks crossed the neighbours)
      // (round 12, COVER3FIX) nearer still (-0.13 D smeared the igniting letter over its neighbours)
      spawn: [lf.cx, lf.cy, -0.06 * D, lf.h * 0.22],
      deep: [0, dr.hi, 0.002],
      emitDeep: 0.3,
      spawnDeep: [ld.cx, ld.cy, -0.06 * D, ld.h * 0.22],
      shafts: [0, sw.hi, 0.02],
    };
    if (at >= 90) C.ign = {};
    // the camera's focus follows the letter that is igniting
    C.ignAt = igniting ? [W.X0 + lf.cx, W.Y0 + lf.cy, W.Zn] : null;
    // the hall is deeper than a page: the sim's z range widened (the name two eye-distances in front of the page); the
    // foot's keep-outs fall off softly at rest, the pages' own fall from the first scroll on
    const k = flightK(c);
    // (round 12, COVER3FIX) soft keep-outs in Now's view too: a 6 px feather cut a hard dark rectangle out of the lit wall
    // around Now's text, which read as a card
    if (typeof c.look === "function") c.look({ far: Math.round(-2.6 * D), near: Math.round(4.7 * D), keepFeather: y < vh * 0.02 || (k > 0.45 && y < C.nowTop + vh * 0.5) ? 40 : 6 });
    const camera = coverCamera(c);
    // ------------------------------------------------ the swarm (fixed to the viewport: the camera moves, never the hall)
    const view = { x: 0, y: 0, w: vw, h: vh };
    const nameW = 1 - sstep(0.7, 0.95, k);
    const swarm = [
      { id: "face", weight: nameW, rect: view },
      { id: "deep", weight: nameW, rect: view },
      // the shafts and the sheen hold their slots from the first frame (a weight that rose later pulled particles
      // across the lit name): what shows is the shafts' reveal and the sheen's ink
      // (round 12) the shafts' dust is gone: the shafts are the field's blades of light (a column of points read as static)
      { id: "shafts", weight: 0, rect: view },
      { id: "sheen", weight: 1 - sstep(0.02, 0.12, k), rect: view },
    ];
    // ------------------------------------------------ the lit plates: each fades up in its turn, once the glass can draw
    // and its capture is decoded; gone by the end of the flight
    const glass = c.glass || { ready: true };
    s.texAt ??= {};
    const slabs = [];
    const spl = !!(SN && SN.live());
    for (const p of W.plates) {
      const id = TEX[p.i], img = c.imgs[id], tex = img && img.tex ? img.tex : null;
      if (tex && glass.ready && s.texAt[id] == null) s.texAt[id] = c.time;
      if (!tex || !glass.ready) continue;
      const tIn = sstep(0, 0.6, c.time - s.texAt[id]);
      const on = mix(PLATE_DIM, 1, sstep(0.2, PLATE_FULL, at));
      // the plates stay in the flight: the engine sorts each point against each plate's own mid plane (draw.wgsl.js
      // ZWin), so a letter in front of a plate is drawn over it; they leave only at the far end of the flight
      // (lane NAME, ?name=splat only) the left plate leaves as the flight begins: the eye's path crosses it in front of
      // the letters, and the splat pass is drawn behind every plate (stage.js: no per-plate depth for an extra pass)
      const a = tIn * on * PLATE_PEAK * (1 - sstep(0.8, 0.97, k)) * (spl && !p.i ? 1 - sstep(0.02, 0.1, k) : 1);
      if (a <= 0.002) continue;
      slabs.push({
        // (lane NAME, ?name=splat only) the plates stand a little wider: the splat pass draws behind every plate (stage.js),
        // so a plate's corner may not reach under a letter
        id: p.id, cx: p.cx + (spl ? (p.i ? 0.05 : -0.16) * W.frameW : 0), cy: p.cy + (spl && !p.i ? 0.06 * W.frameH : 0), cz: p.cz - (1 - on) * 0.12 * D,
        yaw: p.yaw + (1 - on) * (p.i % 2 ? -0.1 : 0.1), pitch: 0.015, roll: 0,
        w: p.w, h: p.h, t: p.t, tex, inset: Math.max(4, p.w * 0.035), bevel: 4,
        alpha: a, glow: 0.7, sharp: 1,
        // (round 12, COVER3FIX) the broad face keeps a breath of the studio (the bevels all of it): never a grey card
        sheen: 0.12,
      });
    }
    // ------------------------------------------------ keep-outs: the foot's text, at rest only (once the flight starts
    // the foot leaves focus and the letters come at the eye through its place: a keep-out there cut bands out of them)
    const keepouts = [];
    // (round 12) from just before the foot enters (2.6 s): before it the lit wall runs under its empty place
    if (y < vh * 0.02 && at > 2.2) for (const t of c.texts) if (t.tag !== "h1") keepouts.push({ x: t.x - 4, y: t.y - 4, w: t.w + 8, h: t.h + 8 });
    // (round 12, COVER3FIX) the header's words, always (a chip had touched ABOUT)
    // (at rest only: in the flight the letters come at the eye through that band, and the header leaves on the scroll)
    if (y < vh * 0.02) for (const r of liveKeeps(c, false)) keepouts.push(r);
    // ------------------------------------------------ the glow: it flares as each letter locks, then settles to a halo
    let flare = 0;
    if (!done) for (let i = 0; i < Lt.length; i++) { const d = at - (IGN0 + i * IGN_DT + 0.3); flare = Math.max(flare, Math.exp(-(d * d) / 0.012)); }
    const settle = sstep(0.2, 1.6, at);
    // ------------------------------------------------ the field (world.js hallField): the chips, the wall, the light.
    // The hand's blade follows the pointer with weight (a damped spring, a little slower than the camera's orbit); the
    // two travelling blades run on the stage's clock (they stand still when the stage sleeps)
    s.ax ??= 0.25; s.ay ??= 0; s.avx ??= 0; s.avy ??= 0; s.hand ??= 0;
    const p = c.pointer, dt = Math.min(0.1, c.dt || 0);
    const tx = p.present ? clamp(p.nx, -1, 1) : 0.25, ty = p.present ? clamp(p.ny, -1, 1) : 0;
    if (dt > 0) {
      const w = 3.2;
      s.avx += (w * w * (tx - s.ax) - 2 * 0.8 * w * s.avx) * dt; s.ax += s.avx * dt;
      s.avy += (w * w * (ty - s.ay) - 2 * 0.8 * w * s.avy) * dt; s.ay += s.avy * dt;
      s.hand += ((p.present ? 1 : 0.4) - s.hand) * (1 - Math.exp(-dt / 0.6));
      // (INTEGRATE) settle exactly, or a value creeping by one ulp changes the field every frame and the stage never sleeps
      if (Math.abs((p.present ? 1 : 0.4) - s.hand) < 1e-3) s.hand = p.present ? 1 : 0.4;
      if (Math.abs(tx - s.ax) < 1e-4 && Math.abs(s.avx) < 1e-4) { s.ax = tx; s.avx = 0; }
      if (Math.abs(ty - s.ay) < 1e-4 && Math.abs(s.avy) < 1e-4) { s.ay = ty; s.avy = 0; }
    }
    const field = hallField(c, { at, k, lights: true, aim: [s.ax, s.ay], hand: s.hand * sstep(1.6, 2.6, at), time: c.clock ? c.clock.time : c.time });
    const passes = SN ? SN.nameFrame(c) : null;
    return {
      ...(passes ? { passes } : {}),
      swarm, slabs, keepouts, camera, field,
      rest: 14, lit: at >= LIT_AT,
      // (wave 5, GLASS2, ?name=splat only) the blocks' face is paper white at most 1, where the swarm's face stacks past
      // it: a stronger, lower bloom gives the face the same halo of light (without the switch: HEAD's numbers)
      bloom: { strength: (0.22 + 0.18 * settle + 0.4 * flare * (1 - settle * 0.5)) * (1 - 0.4 * k) * (passes ? 2.2 : 1), threshold: passes ? 0.38 : 0.5, knee: 0.3, plates: 0.1 },
    };
  },
};
