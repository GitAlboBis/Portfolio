// @ts-check
/**
 * stage.js — the stage of the site (spec 50 §5): one swarm of points with a memory, plates of clear
 * glass, one camera, the night and its dawn. Raw WebGPU, no dependency.
 *
 * ================================================================ THE API (read this, nothing else)
 *
 *   import { createStage, H } from "./stage/stage.js";
 *   const stage = await createStage({ device, canvas, tier: "A", tokens, log });
 *
 * device  the page's one GPUDevice, asked for by the host (fx-stage.js) through ./gpu.js. The stage
 *         itself never requests an adapter.
 * canvas  a full-viewport canvas (the host sizes it in CSS: position fixed, 100vw x 100vh,
 *         pointer-events none, aria-hidden). The stage configures it with alphaMode "premultiplied".
 * tier    "A" | "B" | "C": 160k / 80k / 40k particles, DPR scale 1 / 0.85 / 0.7; the plates drop the
 *         spectral split on B and C, and on C the plates seen through plates, the second reflection and
 *         the edge light (PLATE_TIER).
 * tokens  { paper, ink, accent, night, nightAccent } as "#rrggbb". paper = the dawn ground (--dawn),
 *         accent = the cobalt the points are drawn in (ink at dawn, thin light at night), night = the
 *         night ground (--night), nightAccent = --accent. ink is unused by the shaders.
 * look    optional overrides of LOOK (below); plateLook optional overrides of PLATE_LOOK (plates/plates.js).
 * kit     optional: prepareStage({ device }) called earlier on the same device (stage/boot.js does it from the head
 *         script): every pipeline already compiling. Without it createStage starts them itself.
 * onError optional: called if the plates' pipeline fails after createStage resolved (the host turns the stage off).
 *
 * (wave 2, ARRIVE) createStage resolves with its resources made; no pipeline holds it. The field, the bloom and the
 * plates draw from the frame their own pipelines are in; the swarm joins when its two are (stage.swarm, stage.whenSwarm;
 * advance() waits for them). Before wave 2 it resolved once the SWARM's two pipelines were compiled. Until
 * it is, slabs are kept but not drawn (the one-pass frame). stage.glass = { ready, at, failed } says when plates can
 * draw (at: performance.now ms); stage.whenGlass resolves true then (false on a failure). slabTexture waits for it.
 *
 * Every tick the host calls, in this order:
 *   stage.set({ ... })            the page as it is now (fields below; omitted fields keep their value)
 *   stage.frame(dtSec) -> bool    draws when it must; false = nothing submitted (rest)
 * and on every reader input (scroll, pointer move/down, touch, key):
 *   stage.input()                 opens the 5 s window ("Rest")
 * and on a viewport change:
 *   stage.resize(cssW, cssH, dpr)
 *
 * set({
 *   formations: [ { id, weight, rect: { x, y, w, h },            up to 4; weight 0..1; rect in DOCUMENT px
 *                   sectionProgress, scene: { step, local, progress } } ],
 *   scroll:   { x, y },                       document px of the viewport's top-left corner
 *   dawn:     [ { x0, y0, x1, y1 } ],         up to 2, VIEWPORT px: inside them a point is ink (cobalt,
 *                                             premultiplied over), everywhere else it is light. [] = all night;
 *                                             one rect covering the viewport = a page that is all dawn.
 *                                             (Legacy: night { top, bottom } | null is still read when dawn is
 *                                             absent, as the old band: outside it is dawn, null = all dawn.)
 *   camera:   { yaw, pitch, dolly,            THE ORBITING CAMERA (below: THE FREE CAMERA, when camera.pos is given).
 *               cx?, cy?, cz?, follow?, snap? } radians, radians, px toward the reader. One camera for the swarm
 *                                             and the plates; it turns and pushes the view about the pivot
 *                                             (cx, cy: viewport px, default the viewport's centre; cz: px, 0).
 *                                             yaw > 0 swings the camera right (the scene's right side comes
 *                                             nearer); pitch > 0 raises it (we look down on the scene). Zero is
 *                                             the straight view: a point at z = 0 lands on its DOM position.
 *                                             Damped (LOOK.cameraDamp) on simulated time; the pointer adds up to
 *                                             `follow` rad (default LOOK.cameraFollow; 0 for a scene whose
 *                                             figures must stay registered to DOM rows). snap: no damping.
 *   slabs:    [ { id, cx, cy, cz,             up to 12 plates of glass (MAX_SLABS). cx, cy: the centre in
 *                 yaw, pitch, roll,           VIEWPORT css px as it would sit at cz = 0 (document = scroll + c);
 *                 w, h, t,                    cz: depth in px toward the reader (0 = the page plane); w, h, t:
 *                 tex, alpha, glow, sharp,    width, height, thickness in css px at cz = 0. yaw brings the
 *                 etch?, inset?, bevel?,      plate's right edge toward the reader, pitch its top edge, roll
 *                 ior?, dispersion?, tint? } ] turns it clockwise. tex: a texture id (slabTexture) held at
 *                                             mid-thickness, or null (clear). alpha: presence 0..1. glow: how much
 *                                             the edges light up with the swarm behind, 0..1 (default 0.5).
 *                                             sharp: focus 0..1 (1 sharp; lower = soft and dim). Added fields:
 *                                             etch: a texture id whose ALPHA is etched (frosted) at mid-thickness;
 *                                             inset: css px between the image and the edges (default 3 % of the
 *                                             smaller side); bevel: px of the rounded arris (default 2.5..7 by
 *                                             size); ior (1.5), dispersion (0.014), tint (1) per plate.
 *   keepouts: [ { x, y, w, h } ],             up to 16, VIEWPORT px; no ink inside them
 *   pointer:  { x, y, down, present },        VIEWPORT px; optional vx, vy (px/s) override the measured velocity.
 *                                             It also swings the studio's two soft lights across the plates.
 *   aim:      { x, y } | null                 (wave 1, KIT) the hand's orbit input in -1..1, given by the host on a
 *                                             touch screen (a horizontal drag); null or absent = the pointer's place
 *                                             (as before). It turns the eye exactly as the pointer would (the free
 *                                             camera's orbit, the orbiting camera's follow), with the same damping.
 *   scrollVelocity: px / s,                   positive when the page scrolls down
 *   mist:     { ink, size, flow, wavelength } the ambient mist of the particles no formation holds (ink 0 = none)
 *   focus:    z                               the depth in sharp focus for the swarm (px, 0 = the page; orbiting camera)
 *   rest:     s                               seconds of motion after the last input (default WINDOW_S = 5; 1..60): a
 *                                             scene whose camera drifts at rest asks for more (e.g. 14); the 1 s
 *                                             ease to stillness stays. 0 or absent = the default.
 *   bloom:    k | { strength, threshold?,     light that glows: bright cores bleed softly into the dark (wgsl/bloom.wgsl.js).
 *               knee?, plates? }              strength 0 = today's picture (default; nothing runs); 0.5..1.2 reads as
 *                                             glow; threshold 0..1 on the brightest channel (LOOK.bloomThreshold 0.3),
 *                                             knee (0.25), plates: how much glass pixels glow vs light (0.15). The dawn
 *                                             never glows (masked by the dawn rectangles); where nothing is bright the
 *                                             canvas stays exactly as transparent as drawn. Cost: BLOOM_TIER.
 * })
 *
 * THE FREE CAMERA (round 10): set({ camera: { pos, ... } }). A camera that travels through a world. Space: x, y are
 * VIEWPORT css px at the current scroll (document = scroll + x), z px toward the reader; the page plane is z = 0 and
 * a sticky scene's world stays put while its section is stuck. The pose that draws exactly like the straight orbiting
 * camera is pos [w/2, h/2, D], target [w/2, h/2, 0], lens 1, where D = clamp(1.25 x the viewport's diagonal, 1100,
 * 2600) (orbitPose() turns any orbiting camera into its free pose). Fields:
 *   pos: [x, y, z]       the eye                                   target: [x, y, z]  what it looks at (default ahead)
 *   roll: rad            > 0 turns the camera clockwise             lens: 1            the focal length as a multiple of
 *                                                                                     D (0.5 wide and strong, 2 long and flat)
 *   focus: px            distance from the eye in sharp focus (default: the target's distance; rack focus = animate it)
 *   aperture: 1          multiple of LOOK.aperture (0 = all sharp; plates soften with it too unless plateFocus: false)
 *   near: px, nearFull: px  nearer than `near` nothing draws; between the two a point or a plate fades out softly (a
 *                        dolly goes THROUGH things: they never explode at the lens). Defaults 0.08 D and 0.26 D.
 *   fog: [start, end]    eye distances (px): past `end` the hall has fallen into the night (default none)
 *   bokeh: 14            css px of disc blur past which a point fades (no large soft discs in front of things; 0 = off)
 *   damp: s              the pose's damping (default LOOK.cameraDamp 0.55; 0 = a scripted move, exact every frame)
 *   orbit: { yaw, pitch, damp, pivot }   the pointer's orbit about pivot (default the target): rad at the viewport's
 *                        edge, its own damping (default 0.55 s). Real parallax: near things slide against far ones.
 *   parallax: 1          the pointer's small eye offset and the scroll's lean (0 = none)
 *   snap: true           no damping this frame (a cut in the film)
 * One camera for points, plates and bodies (stageView / stageFade in wgsl/frame.wgsl.js). With plates at several
 * depths the free camera sorts the points per plate (a near point is never hidden by a far plate). A scene describes a
 * move with scenes/lib/camera.js (cameraPath: keyed poses, smooth through the keys). A host that blends scenes blends
 * free poses (fx-stage.js). Old fields only = the orbiting camera, drawn exactly as before.
 *
 * stage.cut(on)                              the cut between pages as a camera move: on = the eye pushes in
 *                                            (LOOK.pushDolly x D) and the focus goes soft over LOOK.pushS on real time;
 *                                            off = back (a cancelled cut). The host calls it on fx:nav:start / reset.
 *                                            cut(on, at, { instant: true }) starts there (an arrival opens pushed in).
 * stage.portal(to, { ms, from, side })       (lane PORTAL) the cut as a flight through a portal of glass: one tall
 *                                            plate pinned to the eye (scenes/lib/portal.js) whose progress runs to `to`
 *                                            (0 the room, 1 the eye inside the glass) in `ms` on real time; from: set the
 *                                            progress first; side -1 | 1: where it swings in from. Returns whether the
 *                                            glass can draw now. stage.portalState -> { p, to, drawn }.
 * stage.fly(mode, { ms, msIn, side, dawn, back, door })
 *                                           (lane n-flight) the cut under the router as ONE dolly of the eye along its
 *                                            view axis, through a door of cut glass standing in the room's wall: "out"
 *                                            leaving (an ease-in to the door; the page changes there), "in" arriving
 *                                            (the eye a stretch behind the new opening pose, the door still just ahead
 *                                            for a few frames, slowing into the pose), "off". back: the same path run
 *                                            backward. On real time; it survives reset(). stage.flyState ->
 *                                            { phase, u, d, z, dir, door, cover } (LOOK.flyDoor; fly() below). door: a
 *                                            door stands in this flight; cover: its glass hides the whole frame now (the
 *                                            frame a room prepared in the shadow takes the stage: fx-stage.js).
 * stage.reset()                             (lane o-router) a page leaves, the stage stays (a soft navigation): every
 *                                            formation, slab, keep-out, extra pass and the backdrop are let go; the
 *                                            device, pipelines, swarm, camera, clock and portal stay. Register again.
 * stage.clock -> { time, activity, awake }   the stage's simulated seconds (they stop at rest): drive an idle drift
 *                                            with it, never with wall time, or the stage never sleeps.
 * stage.whenBloom                            resolves true once the bloom can draw (false: its pipelines failed; the
 *                                            stage draws without it, one line in the debug log).
 *
 * stage.slabTexture(id, source) -> Promise   an image a plate may hold (tex) or carry etched (etch): an
 *                                            HTMLImageElement, ImageBitmap, canvas or OffscreenCanvas. Same id
 *                                            again replaces it. Up to 16 live textures (least recently used
 *                                            evicted). Etched lettering: draw it on a transparent canvas, the
 *                                            alpha is the etch; size the canvas to the plate's aspect.
 * stage.setBackdrop(canvas, rect)            what plates bend: the display type the host rasterised with
 *                                            rasteriseBackdrop (./glass/backdrop.js), in DOCUMENT px; null, null
 *                                            clears it. Outside it a plate sees the ground (night, or dawn).
 * stage.register(id, formation) -> Promise   builds its targets (and its body), resolves when it can draw.
 *                                            Register in page order (or give formation.order): the order's
 *                                            parity decides which end of the population it draws from, so
 *                                            two neighbours in page order never fight for the same particles.
 * stage.prepare(formation) -> Promise        (lane m-fly) a formation's slow part done ahead, nothing on stage touched:
 *                                            its targets and its body's pipelines ({ set, body }); register(id,
 *                                            formation, pre) then takes it at once. Never registered: destroy pre.body.
 * stage.reserve(n)                           (lane m-fly) room for n target points made ahead, the room on stage keeping
 *                                            its own: a page prepared in the shadow then registers with nothing to wait for.
 * stage.advance(ms) -> Promise               deterministic: simulates ms at 60 Hz with no clock, then draws
 *                                            once and holds (captures). The stage is at rest afterwards.
 * stage.stats() -> { simulated, drawn, gpuMs, tier, halvings, awake, activity, submits,
 *                    passMs: [sim, ink, canvas, bloom], platesOn, plates, plateTier, focus, camera, dawn, push, rest, bloom,
 *                    hdr: { on, format, why }, aber, fly, field, passes }   hdr: the canvas (float16 HDR or 8 bit, THE
 *                                            POST); aber: the aberration in speed now, in css px (exactly 0 at rest)
 * stage.plates                               the plates of the last frame: [{ id, z (view), quad (screen) }]
 * stage.look(partial), stage.plateLook(partial)   live look overrides (bench).
 *                                            Device lost or replaced: destroy() the stage, create a new one on
 *                                            the new device and register the formations again (it keeps nothing).
 * stage.destroy()
 *
 * ================================================================ A FORMATION (plain data + small functions)
 *
 *   export default {
 *     share: 0.5,                 fraction of the whole population it takes at weight 1 (default 0.5)
 *     fill: 1,                    fraction of its strands that take a target; the rest are its own mist
 *     fit: "contain",             local space, see below: "contain" | "stretch" | "px"
 *     inkArea: 300000,            optional: the css px² of the rect the ink was tuned on; on other
 *                                 rects the ink per particle scales with the area (0.25..4), so a
 *                                 figure keeps its tone from desktop to phone
 *     targets: (H) => H.ring({ r: 0.9 }),          TargetSet or Promise<TargetSet>, built once at register
 *                                 (before any rect is known: write it in local units)
 *     capacity: 0,                targets it may later hold through ctx.setTargets (default: the first set's size)
 *     look:    { ink: 0.5, size: 1.4, mistInk: 0.03, mistSize: 1.2 },
 *     motion:  { spring: 2.2, speed: 420, inertia: 0.35, fuzz: 6 },   1/s, px/s, s, css px of scatter
 *     flow:    { amp: 22, wavelength: 260, evolution: 0.08, z: 0.6 }, curl flow: px/s, px, 1/s, depth share
 *     respond: { hand: 1, wind: 1, fadeIn: 1.6, fadeOut: 2.2 },
 *     tails:   { share: 0.2, length: 80, emitters: 120 },  a share of its particles leave from a few
 *                                 emitter points and curl downstream along the flow: tendrils of ink
 *     carry: 1,                   how much of its box's motion its visible ink follows at once (default 1:
 *                                 a sticky figure's ink rides with its box; 0: the ink chases its
 *                                 moving targets with the spring)
 *     emit: 0,                    how a particle that was invisible appears: 0 on its target,
 *                                 1 at the spawn point, -1 it flies in from wherever it is
 *     spawn: [0, 0, 0, 30],       local point + radius in css px (emit 1)
 *     update(ctx) { return { rotate: [rx, ry, rz], shift, reveal: [lo, hi, feather], ink, ... }; },
 *     body: { layer: "under", async init(api) { ...; return { encode(pass, ctx) {} }; } },
 *   };
 *
 * update(ctx) runs once per drawn frame while the formation is active. ctx = { id, weight, rect,
 * sectionProgress, scene, pointer: { x, y, down, present, vx, vy, clicked, doc: {x, y}, local: {x, y},
 * inside }, time, dt, view: { w, h }, scroll, state (a scratch object kept for the formation),
 * setTargets(set), H }. It returns any of: rotate [rx, ry, rz] (radians, applied yaw-pitch-roll),
 * scale (number or [sx, sy, sz]), offset [x, y, z] (css px), shift (targets: slides particles along
 * a path, or rotates a cloud's assignment), reveal [lo, hi, feather] (only targets whose normalised
 * index is inside show), ink (multiplier), emit, spawn, look / motion / flow / respond / tails
 * (partial overrides). Anything not returned keeps the formation's static value.
 *
 * Local space. Targets are written in local units around the centre of the formation's rect,
 * x right, y down, z toward the reader. "contain": one unit is half the rect's smaller side (a
 * shape inside [-1, 1] fits); "stretch": x and y units are half the rect's width and height (z as
 * contain); "px": one unit is one css px.
 *
 * The body (one extension point for drawn bodies). body.init(api) gets { device, format,
 * frameLayout, frameWGSL, noiseWGSL, blend, multisample } and builds its own pipeline (layout:
 * [api.frameLayout, its own group 1 ...]) with createRenderPipelineAsync, colour target
 * { format, blend }. Its shader starts with api.frameWGSL: the StageFrame uniform at group 0 and
 * stageProject(), stageNight(), stageKeep(), stageOETF(). encode(pass, ctx) runs inside the stage's
 * render pass with group 0 already set, before the particles ("under") or after them ("over"); it
 * sets its own pipeline and groups and draws. Output is premultiplied sRGB-encoded, like the discs.
 *
 * ================================================================ PLATES (spec 50 §5)
 *
 * The stage's only objects: boxes of clear glass with straight edges, drawn analytically (plates/
 * plates.wgsl.js): the ray of the stage's own camera against an oriented box, refraction in and out (one
 * ray per colour on tier A), a rounded arris a few px wide where the light lines and the spectral split
 * live, Fresnel reflection of two soft rectangular lights the pointer swings plus a strip and a fixed
 * rim, a faint cool tint with the path, an image at mid-thickness or frosted etched type, edges lit by
 * the swarm behind, softness out of focus. A plate bends the swarm behind it (pass A, below), the
 * display type of the backdrop, and the plates behind it.
 * With no plate on screen the frame is the one-pass frame described below (same cost). With one, the
 * frame takes two passes: the swarm behind the frontmost plate's centre (view z) and the "under" bodies
 * go to a texture; the canvas gets that texture, the plates far to near, the swarm in front of them and
 * the "over" bodies. Plates never pass over body copy: keep text blocks out of their rects (the scene's
 * job; plates ignore keep-outs).
 * Bench: stage/dev.html?view=cover|gallery|stack|dawn (see its header).
 *
 * ================================================================ WHAT IT DOES
 *
 * One compute pass integrates every particle (wgsl/sim.wgsl.js): curl flow, spring to its target,
 * the hand, the wind of the scroll, damping. One render pass draws instanced soft discs
 * (wgsl/draw.wgsl.js): the camera, perspective, depth of field with energy kept, light at night and
 * ink at dawn decided per fragment by the dawn rectangles, keep-outs. The formations of the frame share the
 * population in proportion to weight x share, by rank: every change of weights is a migration.
 * Rest: it moves only inside a 5 s window (set({ rest }) lengthens it) opened by input(), then slows to stillness over 1 s and
 * stops submitting (the canvas keeps its last frame). A dirty frame (scroll, resize, set changes)
 * redraws without moving anything. Budget: when GPU frames stay over the tier's budget the drawn
 * count halves (never under FLOOR), and the ink per particle doubles so the tone holds.
 */

import { frameWGSL, FRAME, FRAME_SIZE } from "./wgsl/frame.wgsl.js";
import { noiseWGSL } from "./wgsl/noise.wgsl.js";
import { simWGSL, SLOT_SIZE } from "./wgsl/sim.wgsl.js";
import { drawWGSL } from "./wgsl/draw.wgsl.js";
import { bloomWGSL, BLOOM_SIZE } from "./wgsl/bloom.wgsl.js";
import { platesKit, makePlates, PLATE_LOOK, PLATE_TIER, MAX_SLABS } from "./plates/plates.js";
import * as H from "./helpers.js";
import { portalPose, portalSlab } from "./scenes/lib/portal.js";
import { canvasSetup } from "./gpu.js";

export { PLATE_LOOK, PLATE_TIER, MAX_SLABS };

/** (lane m-glass, plan 70 phase 4) THE POST, in the passes the stage already runs (no pass of its own):
 *  - the grain (wgsl/frame.wgsl.js stageGrain): a dither of one 8-bit step in the passes that write smooth dark light
 *    (the plates, the rays; the field's when it calls it), seeded from the stage's clock;
 *  - the aberration in speed: red and blue part toward the frame's corners while the eye moves fast through the room (a
 *    flight, a fast camera move): ABER_PX css px at a corner at full speed, 0 below ABER_LIN (eye distances D per s) and
 *    ABER_ANG (rad per s of the axis), exactly 0 at rest. Drawn where the room's light is read from pass A: the blit and
 *    the glass (plates.wgsl.js fsBlit, behindPage);
 *  - the HDR canvas (gpu.js canvasSetup): float16 with extended tone mapping where the screen and the browser show more
 *    than paper white; there the light may rise to HDR_CEIL (as written, encoded: about three times paper white) instead
 *    of clipping at 1. Elsewhere, and with ?hdr=0, the 8-bit canvas of before. */
const ABER_PX = 3.0, ABER_LIN = [0.6, 2.6], ABER_ANG = [1.5, 4.0], HDR_CEIL = 1.6;

export { H, frameWGSL, noiseWGSL };

/** Particles by tier (spec 3.3). */
export const TIER_COUNTS = Object.freeze({ A: 160000, B: 80000, C: 40000 });
/** DPR scale by tier (the water engine's TIERS[t].dprScale). */
export const TIER_DPR = Object.freeze({ A: 1.0, B: 0.85, C: 0.7 });
/** GPU ms (median of 30 timed frames) above which the drawn count halves. */
export const TIER_BUDGET_MS = Object.freeze({ A: 3.5, B: 6.0, C: 9.0 });
/** The fewest particles that still read as ink. */
export const FLOOR = 20000;
/** The rest window (s) and the soft stop (s). */
export const WINDOW_S = 5.0;
export const STOP_S = 1.0;
/** Same pixel cap as the water engine (tier.js MAX_PIXELS). */
const MAX_PIXELS = 3.2e6;
// bytes of one depth window of the particle draw (draw.wgsl.js ZWin: 4 + 12 rectangles + 12 planes, vec4 each;
// a multiple of the 256-byte uniform offset alignment). field.js binds the same windows (field.wgsl.js mirrors ZWin).
export const WIN = 512;

/** The look, tuned on captures (see docs/redesign/rivista-story/build/core.md). */
export const LOOK = Object.freeze({
  eye: 1.25,          // eye distance = eye x the viewport diagonal (clamped 1100..2600 px)
  far: -700, near: 450, focus: 0,
  focusPull: 0.45,    // s: how fast the focus follows set({ focus })
  aperture: 0.024,    // css px of blur radius per px of depth
  maxRadius: 34,      // largest disc sigma (css px)
  shutter: 0.035,     // s of motion streak
  inkGain: 1.0, keepFeather: 6,
  quantum: 1.0,       // 1: stochastic rounding of every fragment to an exact 8-bit step; 0: off
  lightGain: 1.0,
  lightWhite: 0.22,   // paper-white mixed into every disc of light (keeps piles from clipping to neon)
  lightSharp: 0.35,   // more white for a sharp disc
  nightAlpha: 0.0,
  // the ambient mist (particles no formation holds); ink 0 = none
  mistInk: 0.0, mistSize: 1.25, mistFlow: 26, mistWavelength: 420, mistSpring: 0.6, mistInertia: 0.5, mistEvolution: 0.05, mistZ: 0.6,
  perStrand: 900,     // particles per strand of mist at the tier's full count
  pointerRadius: 150, pointerStrength: 1.0,
  parallax: 18,       // eye offset (css px) at the viewport's edge
  lean: 0.012,        // eye offset per px/s of scroll velocity
  wind: 0.22,         // document px/s of wind per px/s of scroll velocity
  cameraDamp: 0.55,   // s: how fast the camera follows set({ camera })
  cameraFollow: 0.035, // rad the pointer adds to the camera at the viewport's edge (camera.follow overrides)
  // the free camera's defaults (camera.pos given): distances from the eye as fractions of the lens's D
  nearGone: 0.08,     // nothing nearer than this (x D) draws
  nearFull: 0.26,     // ... and from here on a point or a plate is whole (between: a soft fade, never a blot)
  bokeh: 14,          // css px of disc blur past which a point fades out (no large soft discs in front of things)
  orbitDamp: 0.55,    // s: the pointer's orbit, default damping
  // the cut (stage.cut): one short straight push before the sheet covers the page; (wave 2, ARRIVE) faster and longer,
  // its speed up front (an ease-out: most of it is seen before the rising sheet hides the page), toward the subject
  pushDolly: 0.24,    // x D px the eye moves forward
  pushAperture: 2.2,  // the aperture's multiple at the end of the push (the focus goes soft)
  pushS: 0.34,        // s, the push's length (and the way back on a cancelled cut)
  // (lane n-flight) THE FLIGHT (stage.fly): the cut under the router as one dolly of the eye along its own view axis.
  // Distances are multiples of the lens's D (the eye stands D in front of the page plane). Leaving, the eye accelerates
  // toward a door of cut glass standing flyDoor x D behind the page plane (in the room's wall), straight ahead, and
  // into it (below). Arriving, the eye stands a stretch behind the new room's opening pose and slows into it (a cubic
  // ease-out whose first speed is the eye's speed in the glass). Back is the same path run backward.
  // (lane n-fix-flight) THE DOOR IS A BLOCK. The frosted pane read as a grey card (n-critic 3) and the eye stopped in
  // front of it (n-critic 4). Now the door is a long block of the plates' own cut glass standing in the wall: its front
  // face flyDoor x D behind the page plane, flyLen x D deep. The leaving ends AT the front face; then the eye is IN the
  // glass and goes on, slowing as light does in glass and never still (an exponential approach to flyIn x D of depth):
  // the page changes there, and what is seen while it changes is the room beyond with its mirrored bands sliding out of
  // the frame (plates.wgsl.js isDoor), under the light inside the glass. Arriving, the rest of the glass falls away
  // behind the eye in flyGlow s. flyVeil: the light inside it, from across the room and with the eye in it.
  // flySwap and flyHold are no longer read (kept for a look() that names them).
  // (lane m-fly) The room that arrives takes the stage as soon as the door hides the whole frame (flyState.cover), so
  // it is seen THROUGH the glass from the door's first full frame to its last: no hold when the page is ready. The
  // light inside the glass is all but gone (flyVeil: at 0.05 it was the plain grey of the frames in the glass); the
  // glass is clear in the middle and dense along its walls (plates.wgsl.js). A page that is late: the eye goes on into
  // the block as before and the room it left stays behind the back face as its last picture (the frozen ink).
  flyDoor: 0.55, flySwap: 0.3, flyHold: 0.09, flyLen: 1.5, flyIn: 0.9, flyVeil: [0.006, 0.014], flyGlow: 0.22,
  // light that glows (set({ bloom })): 0 = today's picture
  bloomThreshold: 0.3, bloomKnee: 0.25, bloomPlates: 0.15,
});

/** Bloom by tier: the first level's divisor of the backing size and the number of levels (spec: tier A at most
 *  +0.8 ms at 1440 x 900, half of that work on B, a quarter on C). */
export const BLOOM_TIER = Object.freeze({ A: { div: 2, levels: 5 }, B: { div: 4, levels: 4 }, C: { div: 4, levels: 3 } });

/** Defaults of a formation (see the header). */
const DEF = Object.freeze({
  share: 0.5, fill: 1, fit: "contain", emit: 0,
  look: { ink: 0.5, size: 1.4, mistInk: 0.03, mistSize: 1.2 },
  motion: { spring: 2.2, speed: 420, inertia: 0.35, fuzz: 6 },
  flow: { amp: 22, wavelength: 260, evolution: 0.08, z: 0.6 },
  respond: { hand: 1, wind: 1, fadeIn: 1.6, fadeOut: 2.2 },
  tails: { share: 0, length: 80, emitters: 120 },
});

/** @typedef {{ x: number, y: number, w: number, h: number }} Rect */
/** @typedef {{ step: number, local: number, progress: number }} Scene */
/** @typedef {{ id: string, weight: number, rect?: Rect, sectionProgress?: number, scene?: Scene }} ActiveIn */

/** @param {string} hex @returns {[number, number, number]} encoded 0..1 */
function hexRGB(hex) {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => parseInt(c + c, 16)) : [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return [v[0] / 255, v[1] / 255, v[2] / 255];
}
/** @param {number} c */
const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

/**
 * Run fn inside validation and out-of-memory scopes; throw with label if either fires.
 * @template T @param {GPUDevice} device @param {string} label @param {() => T} fn @returns {Promise<T>}
 */
async function scoped(device, label, fn) {
  device.pushErrorScope("out-of-memory");
  device.pushErrorScope("validation");
  /** @type {any} */ let out, thrown = null;
  try { out = fn(); } catch (e) { thrown = e; }
  const pv = device.popErrorScope(), pm = device.popErrorScope();
  const [v, m] = await Promise.all([pv, pm]);
  if (thrown) throw thrown;
  if (v || m) throw new Error(`[stage] ${label}: ${(v || m)?.message}`);
  return out;
}

/* ================================================================ AN EXTRA PASS (wave 2, ARRIVE: for the splat lane)
   A module outside this file adds a pass to every stage of the page: registerPass(def), with
     def = { id, layer: "under" | "over", rank?: number,
             async init(api) -> inst }      api: { device, format, frameLayout, frameWGSL, noiseWGSL, blend, tier, log }
     inst = { set?(cfg) -> bool (true: redraw), compute?(encoder, ctx), encode(pass, ctx), busy?() -> bool, destroy?() }
   The stage calls init once per stage (at once if a stage exists, else when one is made; a throw or a rejection leaves
   the stage drawing without it, one line in the debug log). The pass draws only while a scene asks for it (the host
   sends stage.set({ passes: { [id]: cfg } }); cfg.weight 0..1 is the scenes' blend), into the same target as the swarm
   (the canvas, or with plates on screen the light the plates bend: always BEHIND the plates), so the bloom reads it.
   layer "under": after the field's wall, before the swarm; "over": after the swarm and the chips (rank orders passes of
   one layer). encode runs inside the stage's render pass with group 0 (the StageFrame: camera, fog, clock, dawn) set;
   compute runs on the frame's encoder before any render pass (a sort). ctx = { cfg, R, P, O, D, clip, free, time, dt,
   view, scroll, allDawn, platesOn, bw, bh, dpr }. With no pass registered or none asked the frame is exactly HEAD's. */
/** @type {Map<string, any>} */ const PASSES = new Map();
/** @type {Set<(def: any) => void>} */ const PASS_LISTEN = new Set();
/** register an extra pass (see above); the same id again replaces it. Returns a function that removes it.
 *  @param {{ id: string, layer?: "under" | "over", rank?: number, init: (api: any) => any }} def */
export function registerPass(def) {
  if (!def || typeof def.id !== "string" || typeof def.init !== "function") throw new Error("[stage] registerPass: { id, init } wanted");
  PASSES.set(def.id, def);
  for (const l of PASS_LISTEN) { try { l(def); } catch { /* a stage that is gone */ } }
  return () => { if (PASSES.get(def.id) === def) { PASSES.delete(def.id); for (const l of PASS_LISTEN) { try { l({ id: def.id, removed: true }); } catch { /* gone */ } } } };
}

/** Rotation yaw (y) · pitch (x) · roll (z), column-major 3x3 as three columns. @param {number[]} r */
function rot(r) {
  const [rx, ry, rz] = r;
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
  // R = Ry * Rx * Rz
  const m = [
    [cy * cz + sy * sx * sz, cx * sz, -sy * cz + cy * sx * sz],
    [-cy * sz + sy * sx * cz, cx * cz, sy * sz + cy * sx * cz],
    [sy * cx, -sx, cy * cx],
  ];
  return m; // m[k] = column k
}

/** v rotated about the pivot by the orbit [yaw, pitch] (yaw about the vertical, then pitch about the camera's
 *  horizontal): yaw > 0 swings the camera right, pitch > 0 raises it. @param {number[]} v @param {number[]} piv @param {number[]} o */
function orbitAbout(v, piv, o) {
  if (!o[0] && !o[1]) return v;
  let x = v[0] - piv[0], y = v[1] - piv[1], z = v[2] - piv[2];
  const cy = Math.cos(o[0]), sy = Math.sin(o[0]);
  [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  // the horizontal axis across the line of sight (perpendicular to the vertical and to (x, z))
  const l = Math.hypot(x, z) || 1, rx = z / l, rz = -x / l;
  const cp = Math.cos(o[1]), sp = Math.sin(o[1]);
  // Rodrigues about r = (rx, 0, rz): r x v = (0*z - rz*y, rz*x - rx*z, rx*y - 0*x)
  const dot = rx * x + rz * z;
  const cxv = -rz * y, cyv = rz * x - rx * z, czv = rx * y;
  const nx = x * cp + cxv * sp + rx * dot * (1 - cp), ny = y * cp + cyv * sp, nz = z * cp + czv * sp + rz * dot * (1 - cp);
  return [piv[0] + nx, piv[1] + ny, piv[2] + nz];
}

/** The view rows (right, down, back) of an eye at E looking at T, turned by roll about the line of sight (roll > 0:
 *  the camera turns clockwise, the world anticlockwise on screen). World y is down. @param {number[]} E @param {number[]} T @param {number} roll */
function lookBasis(E, T, roll) {
  let f = [T[0] - E[0], T[1] - E[1], T[2] - E[2]];
  const fl = Math.hypot(f[0], f[1], f[2]);
  f = fl > 1e-6 ? f.map((x) => x / fl) : [0, 0, -1];
  // right = f x down(0, 1, 0)
  let r = [-f[2], 0, f[0]];
  const rl = Math.hypot(r[0], r[2]);
  r = rl > 1e-5 ? [r[0] / rl, 0, r[2] / rl] : [1, 0, 0];
  const b = [-f[0], -f[1], -f[2]];
  // down = back x right
  const d = [b[1] * r[2] - b[2] * r[1], b[2] * r[0] - b[0] * r[2], b[0] * r[1] - b[1] * r[0]];
  if (!roll) return [r, d, b];
  const c = Math.cos(roll), s = Math.sin(roll);
  return [[r[0] * c + d[0] * s, r[1] * c + d[1] * s, r[2] * c + d[2] * s], [d[0] * c - r[0] * s, d[1] * c - r[1] * s, d[2] * c - r[2] * s], b];
}

/**
 * The free camera's pose (viewport px at the current scroll, z toward the reader) that draws exactly what the orbiting
 * camera { yaw, pitch, dolly, cx, cy, cz } draws (a host blends an old scene's camera with a free one through it).
 * @param {{ yaw?: number, pitch?: number, dolly?: number, cx?: number | null, cy?: number | null, cz?: number }} c
 * @param {{ w: number, h: number }} view @param {number} D the lens's eye distance at lens 1 (stage: baseD)
 * @returns {{ pos: number[], target: number[] }}
 */
export function orbitPose(c, view, D) {
  const yaw = c.yaw || 0, pitch = c.pitch || 0, dolly = c.dolly || 0;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const R = [[cy, 0, -sy], [sy * sp, cp, cy * sp], [sy * cp, -sp, cy * cp]];
  const P = [c.cx ?? view.w / 2, c.cy ?? view.h / 2, c.cz || 0];
  /** view point -> world (R transposed) @param {number[]} q */
  const back = (q) => { const v = [q[0] - P[0], q[1] - P[1], q[2] - P[2] - dolly]; return [0, 1, 2].map((k) => P[k] + R[0][k] * v[0] + R[1][k] * v[1] + R[2][k] * v[2]); };
  return { pos: back([view.w / 2, view.h / 2, D]), target: back([view.w / 2, view.h / 2, 0]) };
}

/** The one blend of every pass: premultiplied over. @type {GPUBlendState} */
const BLEND = {
  color: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
  alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
};

/** the WGSL messages of a module whose pipeline failed, for the log
 *  @param {GPUShaderModule} mod @param {string} code @param {string} label @param {any} e */
async function pipeError(mod, code, label, e) {
  let msg = "";
  try {
    const info = await mod.getCompilationInfo(), lines = code.split("\n");
    msg = info.messages.filter((x) => x.type === "error").map((x) => `${x.lineNum}:${x.linePos} ${x.message}\n    ${(lines[x.lineNum - 1] || "").trim()}`).join("\n");
  } catch { /* the device may be gone */ }
  return new Error(`[stage] pipeline ${label}: ${(e && e.message) || e}${msg ? "\n" + msg : ""}`);
}

/**
 * The stage's pipelines, all started at once (BOOT: the stage starts early). Nothing here needs the page, a canvas
 * or the tier: stage/boot.js calls it from the head script as soon as the device answers, while the scripts and the
 * fonts load and while a cut's sheet is up; createStage({ kit }) then waits only for the swarm's two pipelines, and
 * the plates join the frame when theirs resolve (stage.glass). Every promise in the kit is already caught (a failure
 * is read where it is awaited, never an unhandled rejection in the console).
 * @param {{ device: GPUDevice, log?: (m: string) => void }} o
 */
export function prepareStage(o) {
  const { device } = o;
  const t0 = performance.now();
  // (lane m-glass) the canvas's format: the preferred 8-bit one, or float16 on an HDR screen (gpu.js canvasSetup)
  const cv = canvasSetup(device);
  const format = cv.format;
  const frameLayout = device.createBindGroupLayout({ label: "stage.frameLayout", entries: [
    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
  ] });
  const simLayout = device.createBindGroupLayout({ label: "stage.simLayout", entries: [
    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
  ] });
  const drawLayout = device.createBindGroupLayout({ label: "stage.drawLayout", entries: [
    { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "read-only-storage" } },
    { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
  ] });
  const simCode = frameWGSL + noiseWGSL + simWGSL;
  const drawCode = frameWGSL + noiseWGSL + drawWGSL;
  const simMod = device.createShaderModule({ label: "stage.sim", code: simCode });
  const drawMod = device.createShaderModule({ label: "stage.draw", code: drawCode });
  // the swarm's first (the first frame waits for these two only), then the plates'
  const sim = device.createComputePipelineAsync({
    label: "stage.sim", layout: device.createPipelineLayout({ bindGroupLayouts: [frameLayout, simLayout] }),
    compute: { module: simMod, entryPoint: "sim" },
  }).catch(async (e) => { throw await pipeError(simMod, simCode, "sim", e); });
  const draw = device.createRenderPipelineAsync({
    label: "stage.draw", layout: device.createPipelineLayout({ bindGroupLayouts: [frameLayout, drawLayout] }),
    vertex: { module: drawMod, entryPoint: "vs" },
    fragment: { module: drawMod, entryPoint: "fs", targets: [{ format, blend: BLEND }] },
    primitive: { topology: "triangle-list" },
  }).catch(async (e) => { throw await pipeError(drawMod, drawCode, "draw", e); });
  const plates = platesKit({ device, format, frameLayout, frameWGSL, blend: BLEND });
  // the bloom's last: it never delays the swarm's first frame; a failure leaves the stage drawing without it
  const bloom = bloomKit(device, format, frameLayout);
  // THE FIELD (stage/field/, round 11): its module and pipelines once the swarm's are in (never before the first frame);
  // a missing or failing module leaves the stage drawing without it
  // (round 12) the module is fetched at once, in parallel; its pipelines still compile only after the swarm's
  const fieldMod = import("./field/field.js");
  fieldMod.catch(() => {});
  // (round 12, COVER3FIX) and its pipelines start as soon as the module is in, beside the swarm's (they took ~110 ms after
  // the swarm's and landed just after the first frame: the cover's lit room came up late); queued after the plates'
  const field = fieldMod.then((m) => m.fieldKit({ device, format, frameLayout }));
  for (const p of [sim, draw, plates, bloom, field]) p.catch(() => {});
  return { device, format, hdr: cv.hdr, hdrWhy: cv.why, frameLayout, simLayout, drawLayout, sim, draw, plates, bloom, field, t0 };
}

/** The bloom's pipelines (wgsl/bloom.wgsl.js), compiled off the main path. @param {GPUDevice} device
 *  @param {GPUTextureFormat} format @param {GPUBindGroupLayout} frameLayout */
async function bloomKit(device, format, frameLayout) {
  const t0 = performance.now();
  const layout = device.createBindGroupLayout({ label: "bloom.layout", entries: [
    { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
    { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
    { binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
  ] });
  // ?failbloom=1 (a test): the bloom's shader does not compile; the stage must keep drawing without it, silently
  const fail = typeof location !== "undefined" && /[?&]failbloom=1/.test(location.search);
  const code = frameWGSL + noiseWGSL + bloomWGSL + (fail ? " fn broken( { " : "");
  // inside a validation scope: a shader that fails to compile is read here, never an uncaptured error that would
  // turn the whole stage off
  device.pushErrorScope("validation");
  const mod = device.createShaderModule({ label: "stage.bloom", code });
  const modErr = await device.popErrorScope();
  if (modErr) throw new Error("[stage] bloom shader: " + modErr.message.split(String.fromCharCode(10))[0]);
  const pl = device.createPipelineLayout({ bindGroupLayouts: [frameLayout, layout] });
  const ADD = { color: { srcFactor: "one", dstFactor: "one", operation: "add" }, alpha: { srcFactor: "zero", dstFactor: "one", operation: "add" } };
  const mk = (/** @type {string} */ fs, /** @type {GPUTextureFormat} */ f, /** @type {GPUBlendState | undefined} */ blend) => device.createRenderPipelineAsync({
    label: "bloom." + fs, layout: pl, vertex: { module: mod, entryPoint: "vsFull" },
    fragment: { module: mod, entryPoint: fs, targets: [blend ? { format: f, blend } : { format: f }] }, primitive: { topology: "triangle-list" },
  });
  try {
    const [pre, down, up, comp] = await Promise.all([mk("fsPrefilter", "rgba16float"), mk("fsDown", "rgba16float"), mk("fsUp", "rgba16float", ADD), mk("fsComposite", format, ADD)]);
    return { layout, pre, down, up, comp, ms: performance.now() - t0 };
  } catch (e) { throw await pipeError(mod, code, "bloom", e); }
}

/**
 * @param {{ device: GPUDevice, canvas: HTMLCanvasElement | OffscreenCanvas, tier?: "A" | "B" | "C",
 *   tokens: { paper: string, ink: string, accent: string, night: string, nightAccent: string },
 *   look?: Partial<typeof LOOK>, plateLook?: any, log?: (m: string) => void, count?: number, budgetMs?: number,
 *   kit?: any, onError?: (e: any) => void }} o  kit: prepareStage's answer for this device (else it is made here);
 *   onError: the plates' pipeline failed after the stage was made (the host turns the stage off)
 */
export async function createStage(o) {
  const { device, canvas } = o;
  const log = o.log ?? (() => {});
  const tier = o.tier ?? "A";
  const look = { ...LOOK, ...(o.look || {}) };
  const N = Math.max(FLOOR, Math.min(o.count ?? TIER_COUNTS[tier], 400000));
  let drawn = N;
  let drawNow = N;   // (lane o-router) the points drawn this frame: drawn, or half of it behind the cut's glass
  let halvings = 0;
  const budgetMs = o.budgetMs ?? TIER_BUDGET_MS[tier];
  /* (wave 7, STAGE) the swarm comes back: see budget(). calm: seconds of moving frames in a row whose median sat under
     the restore bar; need: the calm a restore takes (doubled after a restore that was halved again soon: never a
     pumping); restoredAt / halvedAt: performance.now() of the last of each */
  const RESTORE_K = 0.5, RESTORE_S = 4, REBOUND_S = 12;
  let restores = 0, calm = 0, needCalm = RESTORE_S, restoredAt = -1e9;
  /* inkFrom / inkAt: after a restore the ink per point (N / drawn) eases from the halved count's over the time the
     points that came back take to fade in (the sim's default rise, 1.5 / s, on the stage's clock): the swarm's light
     neither dips nor flashes */
  let inkFrom = 0, inkAt = -1;
  const strands = Math.max(64, Math.round(TIER_COUNTS[tier] / look.perStrand));

  // ---------------------------------------------------------------- colours
  const T = o.tokens;
  const enc = { paper: hexRGB(T.paper), ink: hexRGB(T.ink), accent: hexRGB(T.accent), night: hexRGB(T.night), nightAcc: hexRGB(T.nightAccent) };
  /** @param {[number, number, number]} c */ const L3 = (c) => c.map(lin);

  // ---------------------------------------------------------------- resources
  const kit = o.kit && o.kit.device === device ? o.kit : prepareStage({ device, log });
  const format = kit.format;
  const context = /** @type {GPUCanvasContext} */ (canvas.getContext("webgpu"));
  if (!context) throw new Error("[stage] getContext('webgpu') returned null");
  const tsOn = device.features.has("timestamp-query");
  // (lane m-glass) the HDR canvas: asked for when the kit chose float16 (gpu.js); on when the context says "extended"
  let hdrOn = false;

  const res = await scoped(device, "resources", () => {
    // TEXTURE_BINDING: the bloom reads the canvas as drawn (no copy of the frame)
    /** @type {any} */ const cfg = { device, format, alphaMode: "premultiplied", colorSpace: "srgb", usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING };
    if (kit.hdr) cfg.toneMapping = { mode: "extended" };
    context.configure(cfg);
    if (kit.hdr) { try { const c = /** @type {any} */ (context).getConfiguration(); hdrOn = !!(c && c.toneMapping && c.toneMapping.mode === "extended"); } catch { hdrOn = false; } }
    const frameBuf = device.createBuffer({ label: "stage.frame", size: FRAME_SIZE, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const slotBuf = device.createBuffer({ label: "stage.slots", size: 4 * SLOT_SIZE, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const partBuf = device.createBuffer({ label: "stage.particles", size: N * 32, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    const { frameLayout, simLayout, drawLayout } = kit;
    const frameGroup = device.createBindGroup({ label: "stage.frameGroup", layout: frameLayout, entries: [{ binding: 0, resource: { buffer: frameBuf } }] });
    // the depth window of the particle draw (view z): all (no plate), behind the plates (pass A), in front of them (pass B)
    const winBuf = device.createBuffer({ label: "stage.window", size: WIN * 3, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    device.queue.writeBuffer(winBuf, 0, new Float32Array([-1e9, 1e9, 0, 0]));
    const drawGroups = [0, 1, 2].map((k) => device.createBindGroup({ label: "stage.drawGroup" + k, layout: drawLayout, entries: [
      { binding: 0, resource: { buffer: partBuf } },
      { binding: 1, resource: { buffer: winBuf, offset: WIN * k, size: WIN } },
    ] }));
    /** @type {any} */ let ts = null;
    if (tsOn) {
      // four spans per frame at most (sim, ink, canvas, bloom), two stamps each, three frames in flight
      ts = {
        set: device.createQuerySet({ label: "stage.ts", type: "timestamp", count: 24 }),
        resolve: device.createBuffer({ label: "stage.ts.resolve", size: 256 * 3, usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC }),
        staging: [0, 1, 2].map((i) => ({ buf: device.createBuffer({ label: "stage.ts.read" + i, size: 64, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST }), busy: false })),
        slot: 0,
      };
    }
    return { frameBuf, slotBuf, partBuf, frameLayout, simLayout, drawLayout, frameGroup, drawGroup: drawGroups[0], drawGroups, winBuf, ts };
  });

  const blend = BLEND;

  // targets: one storage buffer for every registered formation, grown on demand
  let tgtCap = 0, tgtUsed = 0;
  /** @type {GPUBuffer | null} */ let tgtBuf = null;
  /** @type {GPUBindGroup | null} */ let simGroup = null;
  /** (lane m-fly) one growth at a time: two formations registered in the same task both grew the buffer from the same
   *  old one, and the second copy read a buffer the first had destroyed (the cover reached by a flight: the stage died)
   *  @type {Promise<any>} */
  let tgtQ = Promise.resolve();
  /** @param {number} need vec4 count */
  const ensureTargets = (need) => (tgtQ = tgtQ.then(() => growTargets(need), () => growTargets(need)));
  /** @param {number} need vec4 count */
  async function growTargets(need) {
    if (tgtBuf && need <= tgtCap) return;
    const cap = Math.max(65536, 1 << Math.ceil(Math.log2(Math.max(need, 1))));
    const old = tgtBuf, oldCap = tgtCap;
    const nb = await scoped(device, "targets", () => device.createBuffer({ label: "stage.targets", size: cap * 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC }));
    if (old) {
      const e = device.createCommandEncoder({ label: "stage.targets.grow" });
      e.copyBufferToBuffer(old, 0, nb, 0, oldCap * 16);
      device.queue.submit([e.finish()]);
      old.destroy();
    }
    tgtBuf = nb; tgtCap = cap;
    simGroup = device.createBindGroup({ label: "stage.simGroup", layout: res.simLayout, entries: [
      { binding: 0, resource: { buffer: res.slotBuf } },
      { binding: 1, resource: { buffer: res.partBuf } },
      { binding: 2, resource: { buffer: tgtBuf } },
    ] });
  }
  await ensureTargets(1);

  // ---------------------------------------------------------------- pipelines (started by prepareStage)
  // (wave 2, ARRIVE) the swarm's two no longer hold the first frame: the room (the field, the plates, the bloom) draws as
  // soon as its own pipelines are in, and the swarm joins when its are (the sim's compute pipeline takes ~0.4 s to compile
  // on Windows: the arriving sheet was gone before the room could draw). advance() (captures) waits for it.
  /** @type {GPUComputePipeline | null} */ let simPipe = null;
  /** @type {GPURenderPipeline | null} */ let drawPipe = null;
  let swarmAt = 0;
  const swarmReady = Promise.all([kit.sim, kit.draw]).then(([s, d]) => {
    simPipe = s; drawPipe = d; swarmAt = performance.now(); st.dirty = true;
    log(`[stage] swarm ready: ${N} particles, tier ${tier}, swarm pipelines ${(performance.now() - kit.t0).toFixed(0)} ms after they started, timestamps ${tsOn ? "on" : "off"}`);
    return true;
  });
  const swarmOK = swarmReady.then(() => true, (e) => { log(`[stage] swarm failed: ${(e && e.message) || e}`); if (o.onError) o.onError(e); return false; });
  log(`[stage] ready: tier ${tier}, the swarm ${simPipe ? "in" : "joins when its pipelines are"}, timestamps ${tsOn ? "on" : "off"}`);

  // ---------------------------------------------------------------- state
  const F32 = new Float32Array(FRAME_SIZE / 4);
  const U32 = new Uint32Array(F32.buffer);
  const S32 = new Float32Array((4 * SLOT_SIZE) / 4);
  const st = {
    cssW: 1, cssH: 1, dpr: 1, bw: 1, bh: 1,
    scrollX: 0, scrollY: 0, scrollV: 0,
    /** @type {{ x0: number, y0: number, x1: number, y1: number }[]} */ dawn: [],
    /** @type {Rect[]} */ keep: [],
    pointer: { x: -1e4, y: -1e4, down: false, present: false, vx: /** @type {number | null} */ (null), vy: /** @type {number | null} */ (null) },
    pv: [0, 0], prevPtr: /** @type {number[] | null} */ (null), wasDown: false,
    /** @type {ActiveIn[]} */ active: [],
    /** @type {any[]} */ slabs: [], platesOn: false,
    camT: { yaw: 0, pitch: 0, dolly: 0, cx: /** @type {number | null} */ (null), cy: /** @type {number | null} */ (null), cz: 0, follow: /** @type {number | null} */ (null) },
    cam: { yaw: 0, pitch: 0, dolly: 0, cx: 0, cy: 0, cz: 0 }, camSet: false,
    // the free camera (camera.pos given): its target pose, its damped pose, the pointer's damped orbit
    free: false, /** @type {any} */ fT: null, /** @type {any} */ fC: null, orb: [0, 0],
    /** @type {{ x: number, y: number } | null} */ aim: null,
    camO: [0, 0, 0], clip: [0, 0, 0, 0], bokeh: 0, D: 1000, aperture: look.aperture, parallax: 1,
    // the cut's push (stage.cut): 0..1, its direction; the rest window (s) a scene may lengthen; the bloom
    push: 0, pushTo: 0, pushAt: [0.5, 0.5], windowS: WINDOW_S, bloom: 0, bloomT: /** @type {any} */ ({}),
    // (lane PORTAL) the cut's portal of glass (stage.portal, scenes/lib/portal.js): progress 0 (the room) .. 1 (inside
    // the glass), where it runs to, how fast (s for a whole run), the clicked side, its presence (a portal whose glass
    // joined late enters, never pops)
    portal: 0, portalTo: 0, portalS: 0.3, portalSide: 1, portalFade: 1, portalDrawn: false,
    // (lane n-flight) the flight (stage.fly): its state (null: none), the eye's extra dolly along its view axis (px),
    // and whether the next camera a page sets starts on its pose (an arrival: the dolly is the only move)
    /** @type {any} */ fly: null, flyZ: 0, flySnap: false,
    // (lane m-glass) the aberration in speed (css px at a corner) and the eye's place and axis of the frame before
    aber: 0, /** @type {number[] | null} */ aberE: null, /** @type {number[] | null} */ aberF: null,
    /** @type {number[][]} */ camR: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], camP: [0, 0, 0],
    focus: look.focus, focusTarget: look.focus, focusZ: look.focus,
    time: 0, frameIndex: 0, activity: 1, lastInput: performance.now(),
    eye: [0, 0], wind: 0,
    dirty: true, seeded: false, destroyed: false, submits: 0, simCount: 0,
    mist: { ink: look.mistInk, size: look.mistSize, flow: look.mistFlow, wavelength: look.mistWavelength },
    /** @type {number[]} */ gpu: [], /** @type {number[]} */ dts: [], gpuLast: /** @type {number | null} */ (null), passMs: [0, 0, 0, 0],
  };

  // ---------------------------------------------------------------- the plates, once their pipelines are in
  // Until then the frame is the swarm's one-pass frame: slabs are kept and drawn from the first frame the plates can
  // (the host tells the scenes through stage.glass, so a plate enters instead of popping). A texture asked for before
  // waits for them; the backdrop given before is held and handed over.
  /** @type {any} */ let plates = null;
  let glassAt = 0, glassFailed = false;
  /** @type {any} */ let bdHeld = null;
  /** @type {any} */ const lookHeld = { ...(o.plateLook || {}) };
  /** @type {Promise<boolean>} */
  const glassReady = kit.plates.then((/** @type {any} */ pk) => {
    if (st.destroyed) return false;
    plates = makePlates({ device, format, tier, log, look: lookHeld }, pk);
    plates.ensureInk(st.bw, st.bh);
    if (bdHeld) { plates.setBackdrop(bdHeld.source, bdHeld.rect); bdHeld = null; }
    glassAt = performance.now();
    st.dirty = true;
    log(`[stage] glass ready: plates pipeline ${pk.ms.toFixed(0)} ms`);
    return true;
  }, (/** @type {any} */ e) => {
    glassFailed = true;
    if (!st.destroyed) { log(`[stage] glass failed: ${(e && e.message) || e}`); if (o.onError) o.onError(e); }
    return false;
  });

  // ---------------------------------------------------------------- the bloom, once its pipelines are in
  // Off (today's picture) until a scene asks for it (set({ bloom })); a failed pipeline leaves the stage drawing
  // without it, with one line in the debug log and nothing in the console.
  /** @type {any} */ let bloom = null;
  let bloomFailed = false;
  /** @type {Promise<boolean>} */
  const bloomReady = Promise.resolve(kit.bloom).then((/** @type {any} */ bk) => {
    if (!bk) throw new Error("no bloom kit");
    if (st.destroyed) return false;
    bloom = { kit: bk, levels: /** @type {any[]} */ ([]), w: 0, h: 0,
      ubuf: device.createBuffer({ label: "bloom.u", size: BLOOM_SIZE, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }),
      smp: device.createSampler({ label: "bloom.smp", magFilter: "linear", minFilter: "linear", addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge" }) };
    log(`[stage] bloom ready: pipelines ${bk.ms.toFixed(0)} ms`);
    st.dirty = true;
    return true;
  }, (/** @type {any} */ e) => { bloomFailed = true; if (!st.destroyed) log(`[stage] bloom off: ${(e && e.message) || e}`); return false; });

  // ---------------------------------------------------------------- THE FIELD, once its pipelines are in (stage/field/)
  // Off until a scene asks (set({ field })); a failure leaves the stage drawing without it (one line in the debug log).
  /** @type {any} */ let field = null;
  /** @type {any} */ let fieldHeld = null;
  /** @type {any} */ let cosmosHeld = null;   // (wave 7) the page's place in the cosmos, until the field is in
  let fieldFailed = false, fieldBusy = false;
  /** @type {Promise<boolean>} */
  const fieldReady = Promise.resolve(kit.field).then((/** @type {any} */ fk) => {
    if (!fk) throw new Error("no field kit");
    if (st.destroyed) return false;
    field = fk.make({ device, tier, winBuf: res.winBuf, win: WIN, log, colors: { paper: enc.paper, accent: enc.accent, light: enc.nightAcc } });
    if (fieldHeld) field.set(fieldHeld);
    if (cosmosHeld) field.journey(cosmosHeld);
    log(`[stage] field ready: pipelines ${fk.ms.toFixed(0)} ms` + (fk.web ? `, the cosmos's web ${fk.web.ms.toFixed(0)} ms (${fk.web.nGal + fk.web.nStar} points)` : ""));
    st.dirty = true;
    return true;
  }, (/** @type {any} */ e) => { fieldFailed = true; if (!st.destroyed) log(`[stage] field off: ${(e && e.message) || e}`); return false; });
  /** the field threw: it leaves the frame (one line in the debug log) @param {any} e */
  const fieldOff = (e) => { log(`[stage] field off: ${(e && e.message) || e}`); try { field.destroy(); } catch { /* gone */ } field = null; fieldFailed = true; };

  // ---------------------------------------------------------------- AN EXTRA PASS (registerPass, above)
  /** @type {Map<string, { def: any, inst: any, failed: boolean }>} */ const passes = new Map();
  /** @type {Record<string, any>} */ let passCfg = {};
  let passBusy = false;
  /** @param {string} id @param {any} e */
  const passOff = (id, e) => { const p = passes.get(id); log(`[stage] pass "${id}" off: ${(e && e.message) || e}`); if (p) { try { p.inst && p.inst.destroy && p.inst.destroy(); } catch { /* gone */ } p.inst = null; p.failed = true; } st.dirty = true; };
  /** @param {any} def */
  function addPass(def) {
    const old = passes.get(def.id);
    if (old && old.inst) { try { old.inst.destroy && old.inst.destroy(); } catch { /* gone */ } }
    if (def.removed) { passes.delete(def.id); st.dirty = true; return; }
    const rec = { def, inst: /** @type {any} */ (null), failed: false };
    passes.set(def.id, rec);
    // init's synchronous part (its shader modules) runs inside a validation scope: a WGSL error turns the pass off, never
    // the stage (an uncaptured error would); after its first await a pipeline error rejects createRenderPipelineAsync
    /** @type {any} */ let first;
    device.pushErrorScope("validation");
    try { first = def.init({ device, format, frameLayout: res.frameLayout, frameWGSL, noiseWGSL, blend: BLEND, tier, log }); } catch (e) { first = Promise.reject(e); }
    const scope = device.popErrorScope();
    Promise.all([first, scope]).then(([inst, err]) => { if (err) throw new Error(err.message.split("\n")[0]); return inst; })
      .then((inst) => {
        if (st.destroyed || passes.get(def.id) !== rec) { try { inst && inst.destroy && inst.destroy(); } catch { /* gone */ } return; }
        if (!inst || typeof inst.encode !== "function") throw new Error("init gave no encode()");
        rec.inst = inst;
        if (passCfg[def.id] && inst.set) inst.set(passCfg[def.id]);
        log(`[stage] pass "${def.id}" ready (${def.layer === "over" ? "over" : "under"} the swarm)`);
        st.dirty = true;
      }).catch((e) => { if (!st.destroyed) passOff(def.id, e); });
  }
  PASS_LISTEN.add(addPass);
  for (const def of PASSES.values()) addPass(def);
  /** the passes a scene asked for this frame, in order, for one layer @param {string} layer */
  const passList = (layer) => [...passes.values()].filter((p) => p.inst && passCfg[p.def.id] && (p.def.layer === "over" ? "over" : "under") === layer)
    .sort((a, b) => (a.def.rank || 0) - (b.def.rank || 0));

  /** the bloom's levels at the backing size (tier: the first level's divisor, the count) */
  function ensureBloom() {
    if (!bloom || (bloom.w === st.bw && bloom.h === st.bh && bloom.levels.length)) return;
    for (const l of bloom.levels) l.tex.destroy();
    bloom.levels = [];
    const cfg = BLOOM_TIER[tier];
    let w = Math.max(1, Math.ceil(st.bw / cfg.div)), h = Math.max(1, Math.ceil(st.bh / cfg.div));
    for (let i = 0; i < cfg.levels && w >= 8 && h >= 8; i++) {
      const tex = device.createTexture({ label: "bloom.l" + i, size: [w, h], format: "rgba16float", usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING });
      const view = tex.createView();
      const group = device.createBindGroup({ label: "bloom.g" + i, layout: bloom.kit.layout, entries: [
        { binding: 0, resource: view }, { binding: 1, resource: bloom.smp }, { binding: 2, resource: { buffer: bloom.ubuf } }] });
      bloom.levels.push({ tex, view, group, w, h });
      w = Math.max(1, w >> 1); h = Math.max(1, h >> 1);
    }
    bloom.w = st.bw; bloom.h = st.bh;
  }

  /** @type {Map<string, any>} */
  const formations = new Map();
  let orderNext = 0;

  // ---------------------------------------------------------------- formations
  /**
   * @param {string} id @param {any} def
   */
  async function register(id, def, pre) {
    const rec = { id, def, order: def.order ?? orderNext++, ready: false, off: 0, count: 0, cap: 0, path: 0, closed: false, state: {}, body: null, out: {}, bodyLayer: "under" };
    formations.set(id, rec);
    // (lane m-fly) pre: what prepare() made ahead. With it and room in the buffer nothing here waits: the formation is
    // ready when this call returns (a takeover registers a whole page in one task)
    const set = pre ? pre.set : def.targets ? await def.targets(H, null) : null;
    if (set && set.data && set.data.length) {
      const n = set.data.length / 4, cap = Math.max(n, def.capacity || 0);
      // its place is taken before anything waits (formations registered in one task follow one another in the buffer)
      rec.off = tgtUsed; rec.cap = cap; tgtUsed += cap;
      if (!(tgtBuf && tgtUsed <= tgtCap)) await ensureTargets(tgtUsed);
      if (formations.get(id) !== rec) return rec;   // the stage was reset meanwhile
      writeTargets(rec, set);
    }
    if (def.body && def.body.init) {
      rec.bodyLayer = def.body.layer === "over" ? "over" : "under";
      rec.body = pre ? pre.body : await def.body.init({ device, format, frameLayout: res.frameLayout, frameWGSL, noiseWGSL, blend, multisample: { count: 1 } });
    }
    rec.ready = true;
    st.dirty = true;
    log(`[stage] formation "${id}" ready: ${rec.count} targets${rec.path ? ` (paths of ${rec.path})` : ""}${rec.body ? ", with a body" : ""}`);
    return rec;
  }

  /**
   * (lane m-fly) A formation's slow part, done ahead with nothing of the stage touched: its targets (the scene's own
   * function, on the main thread) and its body's pipelines. The room on stage is not disturbed; register(id, def, pre)
   * then takes it at once. A prepared formation that is never registered: destroy pre.body.
   * @param {any} def @returns {Promise<{ set: any, body: any }>}
   */
  async function prepare(def) {
    const set = def.targets ? await def.targets(H, null) : null;
    const body = def.body && def.body.init ? await def.body.init({ device, format, frameLayout: res.frameLayout, frameWGSL, noiseWGSL, blend, multisample: { count: 1 } }) : null;
    return { set, body };
  }

  /** @param {any} rec @param {H.TargetSet} set */
  function writeTargets(rec, set) {
    const n = Math.min(set.data.length / 4, rec.cap);
    if (!tgtBuf || n <= 0) { rec.count = 0; return; }
    device.queue.writeBuffer(tgtBuf, rec.off * 16, set.data.buffer, set.data.byteOffset, n * 16);
    rec.count = n; rec.path = set.path >= 2 ? set.path : 0; rec.closed = !!set.closed;
  }

  // ---------------------------------------------------------------- host input
  /** @param {any} s */
  function set(s) {
    if (s.scroll && (s.scroll.x !== st.scrollX || s.scroll.y !== st.scrollY)) { st.scrollX = s.scroll.x; st.scrollY = s.scroll.y; st.dirty = true; }
    // dawn: up to two viewport rectangles where a point is ink; everywhere else it is light
    /** @type {any[] | null} */ let dawn = null;
    if (Array.isArray(s.dawn)) dawn = s.dawn;
    else if ("night" in s) {
      // legacy (the old night band): outside the band was day
      const n = s.night;
      dawn = n ? [{ x0: -1e5, y0: -1e5, x1: 1e5, y1: n.top }, { x0: -1e5, y0: n.bottom, x1: 1e5, y1: 1e5 }] : [{ x0: -1e5, y0: -1e5, x1: 1e5, y1: 1e5 }];
    }
    if (dawn) {
      const d = dawn.filter((r) => r && r.x1 > r.x0 && r.y1 > r.y0).slice(0, 2).map((r) => ({ x0: +r.x0, y0: +r.y0, x1: +r.x1, y1: +r.y1 }));
      if (JSON.stringify(d) !== JSON.stringify(st.dawn)) { st.dawn = d; st.dirty = true; }
    }
    // (lane n-flight) the first camera after a flight's arrival starts on its pose (no swing from the page before: the
    // flight's dolly is the only move)
    if (s.camera && st.flySnap) { st.flySnap = false; s = { ...s, camera: { ...s.camera, snap: true } }; }
    if (s.camera && (s.camera.pos || s.camera.position)) setFree(s.camera);
    else if (s.camera) {
      if (st.free) { st.free = false; st.camSet = false; }
      const c = s.camera, t = st.camT;
      const nt = { yaw: +c.yaw || 0, pitch: +c.pitch || 0, dolly: +c.dolly || 0, cx: typeof c.cx === "number" ? c.cx : null,
        cy: typeof c.cy === "number" ? c.cy : null, cz: +c.cz || 0, follow: typeof c.follow === "number" ? c.follow : null };
      if (JSON.stringify(nt) !== JSON.stringify(t)) { Object.assign(t, nt); st.dirty = true; }
      if (!st.camSet || c.snap) { Object.assign(st.cam, { yaw: t.yaw, pitch: t.pitch, dolly: t.dolly, cx: t.cx ?? st.cssW / 2, cy: t.cy ?? st.cssH / 2, cz: t.cz }); st.camSet = true; st.dirty = true; }
    }
    if (s.slabs) {
      const a = s.slabs.slice(0, MAX_SLABS);
      if (JSON.stringify(a) !== JSON.stringify(st.slabs)) { st.slabs = a.map((/** @type {any} */ f) => ({ ...f })); st.dirty = true; }
    }
    if (s.keepouts) {
      const k = s.keepouts.slice(0, 16);
      if (JSON.stringify(k) !== JSON.stringify(st.keep)) { st.keep = k.map((/** @type {Rect} */ r) => ({ ...r })); st.dirty = true; }
    }
    if (s.pointer) Object.assign(st.pointer, { vx: null, vy: null }, s.pointer);
    if ("aim" in s) st.aim = s.aim && isFinite(s.aim.x) && isFinite(s.aim.y) ? { x: Math.max(-1, Math.min(1, s.aim.x)), y: Math.max(-1, Math.min(1, s.aim.y)) } : null;
    if (typeof s.scrollVelocity === "number") st.scrollV = s.scrollVelocity;
    if (s.mist) Object.assign(st.mist, s.mist);
    if (s.formations) {
      const a = s.formations.slice(0, 4);
      if (JSON.stringify(a) !== JSON.stringify(st.active)) { st.active = a.map((/** @type {any} */ f) => ({ ...f })); st.dirty = true; }
    }
    if (typeof s.focus === "number" && s.focus !== st.focusTarget) { st.focusTarget = s.focus; }
    if ("rest" in s) { const w = typeof s.rest === "number" && s.rest > 0 ? Math.max(1, Math.min(60, s.rest)) : WINDOW_S; if (w !== st.windowS) st.windowS = w; }
    if ("bloom" in s) {
      const b = s.bloom, o = b && typeof b === "object" ? b : { strength: +b || 0 };
      const k = Math.max(0, Math.min(4, +o.strength || 0));
      const t = { threshold: o.threshold ?? look.bloomThreshold, knee: o.knee ?? look.bloomKnee, plates: o.plates ?? look.bloomPlates };
      if (k !== st.bloom || JSON.stringify(t) !== JSON.stringify(st.bloomT)) { st.bloom = k; st.bloomT = t; st.dirty = true; }
    }
    // the field: a scene's { lights, chips, cosmos } or a host's [{ field, weight }] (stage/field/field.js)
    if ("field" in s) {
      if (field) { try { if (field.set(s.field)) st.dirty = true; } catch (e) { fieldOff(e); } }
      else fieldHeld = s.field || null;
    }
    // (wave 7, COSMOS) where the page is in the cosmos: the host's { key, slug, y, vh, max, parts } (stage/cosmos/web.js
    // journeyOf); kept across reset() (the room that arrives sets its own when it takes the stage, behind the door)
    if ("cosmos" in s && s.cosmos) {
      cosmosHeld = s.cosmos;
      if (field) { try { if (field.journey(s.cosmos)) st.dirty = true; } catch (e) { fieldOff(e); } }
    }
    // the extra passes a scene asked for: { id: cfg } (null or absent id = off)
    if ("passes" in s) {
      /** @type {Record<string, any>} */ const want = s.passes && typeof s.passes === "object" ? s.passes : {};
      const k = JSON.stringify(want);
      if (k !== JSON.stringify(passCfg)) {
        passCfg = JSON.parse(k);
        for (const [id, cfg] of Object.entries(passCfg)) { const p = passes.get(id); if (p && p.inst && p.inst.set && cfg) { try { p.inst.set(cfg); } catch (e) { passOff(id, e); } } }
        st.dirty = true;
      }
    }
  }

  /** a point given as [x, y, z] or { x, y, z } @param {any} v @param {number[] | null} d */
  const P3 = (v, d) => (Array.isArray(v) ? [+v[0] || 0, +v[1] || 0, +v[2] || 0] : v && typeof v === "object" ? [+v.x || 0, +v.y || 0, +v.z || 0] : d);
  /** the free camera (see the header: camera.pos given) @param {any} c */
  function setFree(c) {
    const pos = /** @type {number[]} */ (P3(c.pos || c.position, [0, 0, 0]));
    const target = /** @type {number[]} */ (P3(c.target, [pos[0], pos[1], 0]));
    const ob = c.orbit || {};
    const num = (/** @type {any} */ v, /** @type {number | null} */ d) => (typeof v === "number" && isFinite(v) ? v : d);
    const nt = {
      pos, target, roll: num(c.roll, 0), lens: Math.max(0.2, Math.min(5, num(c.lens, 1) || 1)),
      focus: num(c.focus, null), aperture: Math.max(0, num(c.aperture, 1) ?? 1),
      near: num(c.near, null), nearFull: num(c.nearFull, null), fog: Array.isArray(c.fog) && c.fog.length >= 2 ? [+c.fog[0], +c.fog[1]] : null,
      bokeh: Math.max(0, num(c.bokeh, look.bokeh) ?? look.bokeh), damp: Math.max(0, num(c.damp, look.cameraDamp) ?? 0),
      orbit: { yaw: num(ob.yaw, 0), pitch: num(ob.pitch, 0), damp: Math.max(0, num(ob.damp, look.orbitDamp) ?? 0), pivot: ob.pivot ? P3(ob.pivot, null) : null },
      parallax: Math.max(0, num(c.parallax, 1) ?? 1), plateFocus: c.plateFocus !== false,
    };
    if (JSON.stringify(nt) !== JSON.stringify(st.fT)) { st.fT = nt; st.dirty = true; }
    if (!st.fC || c.snap || !st.free) {
      // a switch from the orbiting camera starts from its pose (no jump); the first camera or a snap starts on target
      const from = !st.free && st.camSet && !c.snap ? orbitPose(st.cam, { w: st.cssW, h: st.cssH }, baseD()) : null;
      st.fC = { pos: [...(from ? from.pos : nt.pos)], target: [...(from ? from.target : nt.target)], roll: from ? 0 : nt.roll, lens: from ? 1 : nt.lens,
        focus: nt.focus, aperture: nt.aperture };
      if (c.snap || !from) st.orb = [0, 0];
      st.dirty = true;
    }
    st.free = true; st.camSet = true;
  }

  /** the lens's eye distance at lens 1 (px) */
  function baseD() { return Math.min(2600, Math.max(1100, look.eye * Math.hypot(st.cssW, st.cssH))); }

  /** the cut's push: on (the sheet is rising) or off (the cut was cancelled); at: the subject it pushes toward, as
   *  fractions of the viewport ({ x, y } 0..1; default the centre) @param {boolean} on @param {{ x: number, y: number } | null} [at] @param {{ instant?: boolean }} [o] */
  function cut(on, at, o) {
    st.pushTo = on ? 1 : 0;
    // (lane PORTAL) instant: start there (an arrival opens with the eye still pushed in, inside the portal's glass)
    if (o && o.instant) st.push = st.pushTo;
    if (on) st.pushAt = at && isFinite(at.x) && isFinite(at.y) ? [Math.max(0.1, Math.min(0.9, at.x)), Math.max(0.1, Math.min(0.9, at.y))] : [0.5, 0.5];
    st.lastInput = performance.now(); st.dirty = true;
  }
  /**
   * (lane PORTAL) the cut as a flight through a portal of glass: run the progress toward `to` (0 the room, 1 the eye
   * inside the glass) in `ms` for a whole run; `from` sets it first (an arrival starts at 1 under its sheet); side: the
   * clicked link's side (-1 left, 1 right). Returns whether the glass can draw now (the plates' pipeline is in): a host
   * that needs the frame filled by glass (the leaving half) checks it. One call each way: when the stage survives a
   * navigation, portal(1) at the click and portal(0) on arrival are one continuous flight.
   * @param {number} to @param {{ ms?: number, from?: number, side?: number }} [o]
   */
  function portal(to, o) {
    const op = o || {};
    st.portalTo = Math.max(0, Math.min(1, +to || 0));
    if (typeof op.from === "number") st.portal = Math.max(0, Math.min(1, op.from));
    if (typeof op.ms === "number" && op.ms >= 0) st.portalS = op.ms / 1000;
    if (op.side === -1 || op.side === 1) st.portalSide = op.side;
    // a portal that cannot draw yet enters when the glass joins (portalFade rises in step)
    st.portalFade = plates ? 1 : 0;
    st.lastInput = performance.now(); st.dirty = true;
    return !!plates;
  }
  /** the portal's progress now and where it runs @returns {{ p: number, to: number, drawn: boolean }} */
  const portalState = () => ({ p: st.portal, to: st.portalTo, drawn: st.portalDrawn === true });

  /** a smooth step from a to b @param {number} a @param {number} b @param {number} x */
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  /**
   * (lane n-flight) THE FLIGHT: the cut under the router as one dolly of the eye (see LOOK.flyDoor). On real time.
   *   fly("out", { ms, msIn, side, dawn, back, door })
   *                         leaving: the eye accelerates forward from where it is, at a door of clear cut glass that
   *                         stands in the room's wall straight ahead (door: false = no door: a page seen in the morning);
   *                         back: it accelerates backward, out through the door this room was entered by
   *   fly("in", { ms, back, door })
   *                         arriving (after reset() and the new page's register): the eye stands a stretch behind the
   *                         opening pose, the door it came through still just ahead for a few frames, and slows into
   *                         the pose; back: it stands just in front of this room's own door, deep in the room, and
   *                         draws back to the pose
   *   fly("off")            no flight (a cancelled cut): the eye is where the scenes put it
   * The two directions are each other's mirror in time (one path, one door per wall).
   * stage.flyState -> { phase: "out" | "hold" | "in" | null, u, d (the door's distance x D; 0 none), z (px), dir,
   *                     door (a door stands in this flight), cover (its glass hides the whole frame now) }
   * @param {"out" | "in" | "off"} mode
   * @param {{ ms?: number, msIn?: number, side?: number, dawn?: boolean, back?: boolean, door?: boolean }} [o]
   */
  function fly(mode, o) {
    const op = o || {}, D = st.D;
    const Zf = (1 + look.flyDoor) * D;                                // the eye's travel to the door's front face
    // the backward travel: a forward arrival run in reverse (its length after a usual 70 ms in the glass)
    const Bb = Math.min(1.5 * D, Math.max(0.4 * D, 0.42 * Zf));
    if (mode === "out") {
      const dir = op.back ? -1 : 1, T = Math.max(0.15, (op.ms || 520) / 1000);
      st.fly = { phase: "out", dir, t: 0, T, z0: st.flyZ, side: op.side === -1 ? -1 : 1, dawn: !!op.dawn, door: op.door !== false, vEnd: 0, vNow: 0, B: Bb,
        r0: (look.flyLen - 0.33) * D, night: !!op.night };
      st.inkHeld = false;
    } else if (mode === "in") {
      const f = st.fly, dir = op.back ? -1 : 1, T = Math.max(0.15, (op.ms || 520) / 1000);
      // forward: the arrival's first speed is the eye's speed in the glass now (one motion through the door): B = v T / 3
      // (a cubic ease-out); with no leaving before it, a usual one's
      const vh = f && f.dir === dir && f.vNow ? f.vNow : 0.63 * 2 * Zf / 0.52;
      const B = Math.min(1.5 * D, Math.max(0.4 * D, (vh * T) / 3));
      // the glass left to cross is what the leaving left (a page that came late: the eye went deeper into it)
      const was = f && f.door && f.dir === dir ? doorNow() : null;
      // (lane m-fly) the door as the leaving left it: its front face still ahead (df0 > 0: the room took the stage as soon
      // as the door hid the frame) or already behind the eye (a late page: the eye went on into the glass). tc: the
      // moment of the arrival at which the eye is at the front face; from there the rest of the block falls away
      const df0 = dir > 0 && was && was.a > 0 && was.df > 0 ? Math.min(was.df, 0.6 * B) : 0;
      const tc = df0 > 0 ? T * (1 - Math.cbrt(Math.max(0, 1 - df0 / B))) : 0;
      st.fly = { phase: "in", dir, t: 0, T, B, L: Zf + 0.2 * D, side: f ? f.side : 1, dawn: !!op.dawn, door: op.door !== false && !!(f ? f.door : true),
        df0, tc, r0: df0 > 0 ? look.flyLen * D : was && was.a > 0 ? was.db : (look.flyLen - 0.33) * D, night: false };
      st.flyZ = dir > 0 ? -B : st.fly.L; st.flySnap = true; st.inkHeld = false;
    } else { st.fly = null; st.flyZ = 0; st.inkHeld = false; }
    st.lastInput = performance.now(); st.dirty = true;
  }
  /** the fast part of a flight (the plates of the page pass the lens, the eye is at or in the glass): the plates are
   *  drawn lean then (plates.js f.lean). Leaving: from 0.3 of the way; in the glass; arriving: until 0.42 of the way */
  // (lane m-fly) ... and arriving for as long as the door's glass is over the frame (its front face now passes the eye
  // after the arrival began: full shading for a block that covers every pixel was the flight's new peak, 4 to 7 ms)
  const flyFast = () => {
    const f = st.fly; if (!f) return false;
    const u = Math.min(1, f.t / f.T);
    return f.phase === "hold" || (f.phase === "out" ? u > 0.3 : u < 0.42 || (!!f.door && f.dir > 0 && f.t < (f.tc || 0) + look.flyGlow + 0.02));
  };
  /** (lane m-fly) whether the door hides the whole frame now: its glass is opaque from edge to edge, so whatever stands
   *  on the stage can change behind it unseen (the page that arrives takes the stage then) @param {{ a: number, df: number }} dn */
  function doorCover(dn) {
    if (!dn || dn.a < 0.999) return false;
    if (dn.df <= 0) return true;
    const dv = doorView();
    return dn.df <= 0.94 * st.D * (dv.w / 2 - Math.abs(dv.x - st.cssW / 2)) / (st.cssW / 2);
  }
  /** the depth of glass ahead of the eye at which the seams of the door's back face stand just outside the frame */
  function doorGone() {
    const te = st.cssW / 2 / st.D, sp = te / Math.hypot(1, te) / 1.5, tp = sp / Math.sqrt(Math.max(1e-6, 1 - sp * sp));
    return 0.9 * (doorView().w / 2) / Math.max(1e-3, tp);
  }
  /**
   * The door this frame: its presence a, its front and back faces' distances ahead of the eye (px; df < 0: the eye is in
   * the glass) and the light inside it g (0..1).
   *  forward, leaving   the block stands in the wall; it comes up once the page's text has left (0.17 to 0.3 s); its
   *                     light rises as its front face comes (the last 0.5 D)
   *  in the glass       the eye goes on into it, the back face coming
   *  forward, arriving  the rest of the glass falls away behind the eye in flyGlow s, its light with it
   *  backward           the same film run backward: leaving, the eye backs into the door it came in by (its seams enter
   *                     from the frame's edges, its light rises over the last flyGlow s); arriving, it draws back out of
   *                     the front face of the door in this room's wall, which shrinks to its place and goes
   */
  function doorNow() {
    const f = st.fly;
    if (!f || !f.door || !plates) return { a: 0, df: 0, db: 0, g: 0 };
    const D = st.D, Zf = (1 + look.flyDoor) * D, len = look.flyLen * D, G = look.flyGlow;
    const v0 = look.flyVeil[0], v1 = look.flyVeil[1];
    const u = Math.min(1, f.t / f.T);
    if (f.dir > 0) {
      if (f.phase === "in") {
        // (lane m-fly) the front face still ahead: the block as it stands, the new room through all of it
        const tin = f.t - (f.tc || 0);
        if (tin < 0) {
          const df = Math.max(1, f.df0 - f.B * (1 - Math.pow(1 - f.t / f.T, 3)));
          return { a: 1, df, db: df + len, g: v0 + (v1 - v0) * (1 - smooth(0, 0.5 * D, df)) };
        }
        if (tin >= G) return { a: 0, df: 0, db: 0, g: 0 };
        const k = 1 - tin / G, rg = doorGone();
        return { a: 1, df: -0.5 * D, db: f.r0 > rg ? rg + (f.r0 - rg) * k * k : f.r0, g: v1 * k * k };
      }
      const df = Zf - st.flyZ;
      // (lane m-fly) the night's door on a morning ground never fades in (a pane of grey on the paper): it OPENS, a
      // straight slit of night that widens (doorView), whole from its first frame
      const a = f.phase !== "out" ? 1 : f.night ? (f.t >= 0.13 ? 1 : 0) : smooth(0.17, 0.3, f.t);
      return { a, df, db: df + len, g: v0 + (v1 - v0) * (1 - smooth(0, 0.5 * D, df)) };
    }
    if (f.phase === "in") {
      const df = Zf - st.flyZ, k = Math.max(0, 1 - f.t / G);
      return { a: 1 - smooth(0.5, 0.96, u), df, db: df + len, g: v0 + (v1 - v0) * k * k };
    }
    const k = f.phase === "hold" ? 1 : Math.max(0, 1 - (f.T - f.t) / G);
    return { a: smooth(0, 0.12, f.t), df: -0.5 * D, db: f.r0 - f.B - st.flyZ, g: v1 * k * k };
  }
  const flyState = () => {
    const f = st.fly;
    if (!f) return { phase: null, u: 1, d: 0, z: 0, dir: 0, door: false, cover: false };
    const dn = doorNow();
    // (lane m-fly) door: a door stands in this flight; cover: its glass hides the whole frame now
    return { phase: f.phase, u: Math.min(1, f.t / (f.T || 1)), d: dn.a > 0 ? dn.df / st.D : 0, z: st.flyZ, dir: f.dir, door: !!(f.door && plates), cover: doorCover(dn) };
  };
  /** the flight's progress on real time @param {number} dt */
  function flyStep(dt) {
    const f = st.fly;
    if (!f) return;
    // a frame long in coming (the stage woke for the click, a busy click handler) must not jump the eye: at most 1/30 s
    f.t += f.t === 0 ? Math.min(dt, 1 / 60) : Math.min(dt, 1 / 30);
    const D = st.D;
    if (f.phase === "out" || f.phase === "hold") {
      const u = Math.min(1, f.t / f.T);
      // leaving forward: from wherever the eye was (z0) an ease-in to the door's front face (u^2: it gathers speed to the
      // end); backward: the forward arrival in reverse (u^3)
      const L = f.dir > 0 ? (1 + look.flyDoor) * D - f.z0 : -f.B - f.z0;
      f.vEnd = Math.abs(f.dir > 0 ? 2 * L / f.T : 3 * L / f.T);
      if (u < 1) { st.flyZ = f.z0 + L * (f.dir > 0 ? u * u : u * u * u); f.vNow = f.vEnd * (f.dir > 0 ? u : u * u); }
      else {
        // in the glass: the eye goes on from its last speed, slowing, never still (the page is changing): an exponential
        // approach to flyIn x D of depth (backward 0.4 D: the eye backs away through the door it came in by)
        f.phase = "hold";
        const S = (f.dir > 0 ? look.flyIn : 0.4) * D, tau = S / Math.max(1, f.vEnd), k = 1 - Math.exp(-(f.t - f.T) / tau);
        f.hk = k; f.vNow = f.vEnd * (1 - k);
        st.flyZ = f.z0 + L + f.dir * S * k;
      }
    } else if (f.phase === "in") {
      const u = Math.min(1, f.t / f.T), r = 1 - u;
      st.flyZ = f.dir > 0 ? -f.B * r * r * r : f.L * r * r;
      if (u >= 1) { st.fly = null; st.flyZ = 0; }
    }
    st.lastInput = performance.now();
  }
  /** the door's section in the eye's view before the dolly: straight ahead, a step toward the clicked side (the eye
   *  passes a little off its axis: one band is wider than the other), tall, whole in the frame from across the room */
  function doorView() {
    const f = st.fly, vw = st.cssW, vh = st.cssH;
    // (the night's door opening on the paper: its width from a slit to the whole, 0.13 to 0.36 s into the leaving)
    const open = f && f.night && f.phase === "out" ? Math.max(0.004, smooth(0.13, 0.36, f.t)) : 1;
    const w = Math.max(0.31 * vw, 0.24 * vh) * open, h = 1.2 * vh;
    // (lane m-fly) bevel 0.07 w folded a strip of the room over at each seam of the back face (a second piece of a
    // title beside the first); a narrow cut bends it and no more
    return { x: vw / 2 + (f ? f.side : 1) * 0.07 * w, y: vh * 0.52, w, h, bevel: 0.024 * w };
  }
  /** the door as a slab of the plates' API: a block of cut glass fixed in the room (the dolly carries the eye to it,
   *  into it and through it), its faces where doorNow says @param {{ a: number, df: number, db: number, g: number }} dn */
  function doorSlab(dn) {
    const f = st.fly, dv = doorView(), D = st.D;
    // the front face never more than half a D behind the eye (the eye in the glass sees only its walls and its back)
    const df = Math.max(dn.df, -0.5 * D), depth = Math.max(8, dn.db - df), dc = df + depth / 2;
    const v = { x: dv.x, y: dv.y, z: D - dc - st.flyZ, yaw: 0, w: dv.w, h: dv.h, t: depth,
      alpha: dn.a, edge: 1, glow: 0, sheen: 0.2, bevel: dv.bevel, ior: 1.5, dispersion: df > 0.6 * D ? 0.006 : 0 };
    const sl = portalSlab(v, { R: st.camR, P: st.camP, O: [st.camO[0], st.camO[1], st.camO[2] - st.flyZ], scroll: { x: st.scrollX, y: st.scrollY } });
    const { rimSheen, ...door } = /** @type {any} */ (sl);   // its bevels mirror the studio, as every plate in the room
    // tint: a block this deep at the plates' absorption would be a dark blue window (its light path is 1.5 D)
    // through: the plates of the room stand behind the glass only on an arrival (leaving, the room is in front of it)
    // (lane m-fly) night: the room beyond the glass is the night whatever ground is on screen (a morning view left by a
    // flight: the door is the night standing on the paper); the glass no longer floods to paper toward Contact (the
    // morning arrives as an edge of day the host sweeps across the frame, seen through the glass)
    return { ...door, id: "door", shape: "door", near: false, inset: 2, tint: 0.12, light: dn.g, paper: 0, night: f.night ? 1 : 0, through: f.phase === "in" };
  }


  /** the push's eased amount: an ease-out going in (the move is seen while the page still shows), smooth going back */
  const pushE = () => (st.pushTo > 0 ? 1 - Math.pow(1 - st.push, 3) : st.push * st.push * (3 - 2 * st.push));

  /** @param {HTMLCanvasElement | OffscreenCanvas | ImageBitmap | null} source @param {Rect | null} rect */
  function setBackdrop(source, rect) {
    if (plates) plates.setBackdrop(source, rect); else bdHeld = source && rect ? { source, rect } : null;
    st.dirty = true;
  }

  /** @type {Promise<any>} */ let texTurn = Promise.resolve();
  /** @param {string} id @param {HTMLImageElement | ImageBitmap | HTMLCanvasElement | OffscreenCanvas} source */
  async function slabTexture(id, source) {
    if (!plates && !(await glassReady)) throw new Error(`[stage] slabTexture "${id}": no plates`);
    // (wave 2, ARRIVE) one upload per task: the textures that waited for the glass all resumed in one task (a 60 ms
    // long task on Work now that the first frame no longer waits for the swarm and lands before them)
    const turn = texTurn.then(() => new Promise((r) => setTimeout(r, 0)));
    texTurn = turn;
    await turn;
    if (st.destroyed) return;
    await plates.slabTexture(id, source);
    st.dirty = true;
  }

  function input() {
    st.lastInput = performance.now();
  }

  /** @param {number} cssW @param {number} cssH @param {number} dpr */
  function resize(cssW, cssH, dpr) {
    const area = Math.max(1, cssW * cssH);
    const eff = Math.min(dpr || 1, 1.5, Math.sqrt(MAX_PIXELS / area)) * TIER_DPR[tier];
    st.cssW = cssW; st.cssH = cssH; st.dpr = eff;
    st.bw = Math.max(1, Math.round(cssW * eff)); st.bh = Math.max(1, Math.round(cssH * eff));
    if (canvas.width !== st.bw) canvas.width = st.bw;
    if (canvas.height !== st.bh) canvas.height = st.bh;
    if (plates) plates.ensureInk(st.bw, st.bh);
    st.dirty = true;
  }

  // ---------------------------------------------------------------- packing
  /** Fill the 4 slots from the active formations: rank intervals, axes, parameters. @param {number} dt */
  function packSlots(dt) {
    S32.fill(0);
    /** @type {any[]} */ const items = [];
    for (const a of st.active) {
      const rec = formations.get(a.id);
      if (!rec || !rec.ready || !(a.weight > 0)) continue;
      items.push({ a, rec, len: Math.max(0, Math.min(1, a.weight)) * (rec.def.share ?? DEF.share) });
    }
    const total = items.reduce((s, x) => s + x.len, 0), k = total > 1 ? 1 / total : 1;
    const bottom = items.filter((x) => x.rec.order % 2 === 0).sort((p, q) => q.rec.order - p.rec.order);
    const top = items.filter((x) => x.rec.order % 2 === 1).sort((p, q) => q.rec.order - p.rec.order);
    let lo = 0;
    for (const x of bottom) { x.lo = lo; x.hi = lo + x.len * k; lo = x.hi; }
    let hi = 1;
    for (const x of top) { x.hi = hi; x.lo = hi - x.len * k; hi = x.lo; }
    items.forEach((x, i) => writeSlot(i, x, dt));
  }

  /** @param {number} i @param {any} x @param {number} dt */
  function writeSlot(i, x, dt) {
    const { a, rec } = x, def = rec.def;
    const rect = a.rect || { x: st.scrollX, y: st.scrollY, w: st.cssW, h: st.cssH };
    const ctx = makeCtx(rec, a, rect, dt);
    /** @type {any} */ let out = {};
    if (def.update) { try { out = def.update(ctx) || {}; } catch (e) { log(`[stage] update "${rec.id}" threw: ${e}`); } }
    rec.out = out;
    const lk = { ...DEF.look, ...def.look, ...out.look };
    const mo = { ...DEF.motion, ...def.motion, ...out.motion };
    const fl = { ...DEF.flow, ...def.flow, ...out.flow };
    const rp = { ...DEF.respond, ...def.respond, ...out.respond };
    const tl = { ...DEF.tails, ...def.tails, ...out.tails };
    const fit = def.fit ?? DEF.fit;
    const u = fit === "px" ? 1 : Math.min(rect.w, rect.h) / 2;
    let sx = fit === "stretch" ? rect.w / 2 : u, sy = fit === "stretch" ? rect.h / 2 : u, sz = u;
    const sc = out.scale;
    if (typeof sc === "number") { sx *= sc; sy *= sc; sz *= sc; } else if (Array.isArray(sc)) { sx *= sc[0]; sy *= sc[1]; sz *= sc[2] ?? 1; }
    const R = rot(out.rotate || def.rotate || [0, 0, 0]);
    const off = out.offset || [0, 0, 0];
    const ox = rect.x + rect.w / 2 + off[0], oy = rect.y + rect.h / 2 + off[1], oz = off[2] || 0;
    const sp = out.spawn || def.spawn || [0, 0, 0, 30];
    const spw = [ox + R[0][0] * sx * sp[0] + R[1][0] * sy * sp[1] + R[2][0] * sz * sp[2],
      oy + R[0][1] * sx * sp[0] + R[1][1] * sy * sp[1] + R[2][1] * sz * sp[2],
      oz + R[0][2] * sx * sp[0] + R[1][2] * sy * sp[1] + R[2][2] * sz * sp[2]];
    const rv = out.reveal || def.reveal || [0, 1, 0];
    const b = i * (SLOT_SIZE / 4);
    const put = (/** @type {number} */ k, /** @type {number[]} */ v) => { S32.set(v, b + k * 4); };
    put(0, [R[0][0] * sx, R[0][1] * sx, R[0][2] * sx, x.lo]);
    put(1, [R[1][0] * sy, R[1][1] * sy, R[1][2] * sy, x.hi]);
    put(2, [R[2][0] * sz, R[2][1] * sz, R[2][2] * sz, def.fill ?? DEF.fill]);
    put(3, [ox, oy, oz, out.emit ?? def.emit ?? DEF.emit]);
    put(4, [spw[0], spw[1], spw[2], sp[3] ?? 30]);
    put(5, [rec.off, rec.count, rec.path, out.shift ?? 0]);
    put(6, [rv[0], rv[1], rv[2] ?? 0, rec.closed ? 1 : 0]);
    put(7, [mo.spring, mo.speed, mo.inertia, mo.fuzz]);
    put(8, [fl.amp, fl.wavelength, fl.evolution, fl.z]);
    // inkArea: the ink was tuned on a rect of that many css px²; on another rect the same particles
    // cover another area, so the ink per particle follows the area and the tone holds (phone, desktop)
    const ia = def.inkArea ? Math.max(0.25, Math.min(4, (rect.w * rect.h) / def.inkArea)) : 1;
    const inkK = (out.ink ?? 1) * ia;
    put(9, [lk.ink * inkK, lk.size, lk.mistInk * inkK, lk.mistSize]);
    put(10, [rp.hand, rp.wind, rp.fadeIn, rp.fadeOut]);
    put(11, [tl.share, tl.length, Math.max(1, tl.emitters), 0]);
    // the carry: the box's motion since the last simulated frame this formation was in (0 when it just arrived)
    const cy = def.carry ?? 1;
    const so = rec.simOrg, cont = so && rec.simAt === st.simCount;
    put(12, cont && dt > 0 ? [(ox - so[0]) * cy, (oy - so[1]) * cy, (oz - so[2]) * cy, 0] : [0, 0, 0, 0]);
    if (dt > 0) { rec.simOrg = [ox, oy, oz]; rec.simAt = st.simCount + 1; }
  }

  /** @param {any} rec @param {ActiveIn} a @param {Rect} rect @param {number} dt */
  function makeCtx(rec, a, rect, dt) {
    const p = st.pointer, fit = rec.def.fit ?? DEF.fit;
    const doc = { x: p.x + st.scrollX, y: p.y + st.scrollY };
    const u = fit === "px" ? 1 : Math.min(rect.w, rect.h) / 2;
    const ux = fit === "stretch" ? rect.w / 2 : u, uy = fit === "stretch" ? rect.h / 2 : u;
    return {
      id: rec.id, weight: a.weight, rect, sectionProgress: a.sectionProgress ?? 0,
      scene: a.scene || { step: 0, local: 0, progress: 0 },
      pointer: {
        x: p.x, y: p.y, down: !!p.down, present: !!p.present, vx: st.pv[0], vy: st.pv[1],
        clicked: !!p.down && !st.wasDown, doc,
        local: { x: (doc.x - rect.x - rect.w / 2) / ux, y: (doc.y - rect.y - rect.h / 2) / uy },
        inside: doc.x >= rect.x && doc.x <= rect.x + rect.w && doc.y >= rect.y && doc.y <= rect.y + rect.h,
      },
      time: st.time, dt, view: { w: st.cssW, h: st.cssH }, scroll: { x: st.scrollX, y: st.scrollY },
      state: rec.state, H,
      /** @param {H.TargetSet} s */ setTargets: (s) => writeTargets(rec, s),
    };
  }

  /** The camera's rotation (rows) and pivot from its damped state: world -> view = R (p - pivot) + pivot + dolly z.
   *  yaw > 0 swings the camera to the right about the pivot (the scene's right side comes nearer); pitch > 0
   *  raises it (we look down on the scene). */
  function camMatrix() {
    const D0 = baseD();
    const pe = pushE();
    const pushZ = look.pushDolly * D0 * pe;
    // (lane n-flight) the flight's dolly: straight along the view axis, on top of the cut's push (never both at once)
    const flyZ = st.flyZ;
    st.aperture = look.aperture * (1 + (look.pushAperture - 1) * pe);
    if (!st.free) {
      const c = st.cam, cy = Math.cos(c.yaw), sy = Math.sin(c.yaw), cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
      st.camR = [[cy, 0, -sy], [sy * sp, cp, cy * sp], [sy * cp, -sp, cy * cp]];
      st.camP = [st.scrollX + c.cx, st.scrollY + c.cy, c.cz];
      st.camO = [st.camP[0] + pushXY(pushZ, D0)[0], st.camP[1] + pushXY(pushZ, D0)[1], st.camP[2] + c.dolly + pushZ + flyZ];
      st.D = D0; st.focusZ = st.focus;
      // (lane n-flight) in a flight the orbiting camera takes the free one's lens rules: what comes near fades softly
      // and large out-of-focus discs fade, so the page passes the eye instead of exploding on it
      if (st.fly) { st.clip = [look.nearGone * D0, look.nearFull * D0, 0, 0]; st.bokeh = look.bokeh; }
      else { st.clip = [0.2 * D0, 0.2 * D0, 0, 0]; st.bokeh = 0; }
      st.parallax = 1;
      return;
    }
    const t = st.fT, c = st.fC;
    const piv = t.orbit.pivot || c.target;
    const E = orbitAbout(c.pos, piv, st.orb), T = orbitAbout(c.target, piv, st.orb);
    const B = lookBasis(E, T, c.roll);
    const D = D0 * c.lens;
    st.camR = B;
    st.camP = [st.scrollX + E[0], st.scrollY + E[1], E[2]];
    const pxy = pushXY(pushZ, D);
    st.camO = [st.scrollX + st.cssW / 2 + pxy[0], st.scrollY + st.cssH / 2 + pxy[1], D + pushZ + flyZ];
    st.D = D;
    const fd = c.focus ?? Math.hypot(T[0] - E[0], T[1] - E[1], T[2] - E[2]);
    st.focusZ = D - fd;
    st.aperture *= c.aperture;
    const near = t.near ?? look.nearGone * D, nf = Math.max(near + 1, t.nearFull ?? look.nearFull * D);
    st.clip = [near, nf, t.fog ? t.fog[0] : 0, t.fog ? t.fog[1] : 0];
    st.bokeh = t.bokeh; st.parallax = t.parallax;
  }

  /** (lane m-glass) THE ABERRATION IN SPEED: how fast the eye travels through the room now, as the css px by which red
   *  and blue part at the frame's corners (frame.band.z). The eye is taken in the viewport's space at the current scroll
   *  (a page's own scroll moves the page, not the eye: no aberration), with the turn of its axis; under ABER_LIN and
   *  ABER_ANG (the hand's orbit, the parallax, a reader's scroll of a sticky scene) it is 0, at the flight's speed it is
   *  ABER_PX; it follows in 60 ms and is exactly 0 once the eye has stopped, so the stage sleeps on a clean frame
   *  @param {number} dtReal */
  function aberStep(dtReal) {
    const R = st.camR, O = st.camO, P = st.camP;
    const ev = [st.scrollX + st.cssW / 2 + st.eye[0] - O[0], st.scrollY + st.cssH / 2 + st.eye[1] - O[1], st.D - O[2]];
    const E = [0, 1, 2].map((k) => P[k] + R[0][k] * ev[0] + R[1][k] * ev[1] + R[2][k] * ev[2] - (k === 0 ? st.scrollX : k === 1 ? st.scrollY : 0));
    const F = [-R[2][0], -R[2][1], -R[2][2]];
    let want = 0;
    if (st.aberE && st.aberF && dtReal > 5e-4) {
      const lin = Math.hypot(E[0] - st.aberE[0], E[1] - st.aberE[1], E[2] - st.aberE[2]) / Math.max(1, st.D) / dtReal;
      const ang = Math.hypot(F[0] - st.aberF[0], F[1] - st.aberF[1], F[2] - st.aberF[2]) / dtReal;
      const m = Math.max(0, Math.min(1, Math.max((lin - ABER_LIN[0]) / (ABER_LIN[1] - ABER_LIN[0]), (ang - ABER_ANG[0]) / (ABER_ANG[1] - ABER_ANG[0]))));
      want = m * m * (3 - 2 * m) * ABER_PX;
    }
    st.aberE = E; st.aberF = F;
    if (dtReal > 0) st.aber += (want - st.aber) * (1 - Math.exp(-dtReal / 0.06));
    if (want === 0 && st.aber < 0.03) st.aber = 0;
  }

  /** the view-space shift that makes the push grow the picture about the subject (st.pushAt) instead of the centre: a
   *  point of the view plane at the subject stays where it is @param {number} pushZ @param {number} D */
  function pushXY(pushZ, D) {
    if (!pushZ) return [0, 0];
    const k = -pushZ / Math.max(1, D);
    return [(st.pushAt[0] - 0.5) * st.cssW * k, (st.pushAt[1] - 0.5) * st.cssH * k];
  }

  /** the free camera's damped pose and the pointer's orbit @param {number} dt simulated s @param {number} px @param {number} py */
  function freeStep(dt, px, py) {
    const t = st.fT, c = st.fC;
    const k = t.damp <= 0 ? 1 : dt > 0 ? 1 - Math.exp(-dt / t.damp) : 0;
    if (k > 0) {
      for (let i = 0; i < 3; i++) { c.pos[i] += (t.pos[i] - c.pos[i]) * k; c.target[i] += (t.target[i] - c.target[i]) * k; }
      c.roll += (t.roll - c.roll) * k; c.lens += (t.lens - c.lens) * k; c.aperture += (t.aperture - c.aperture) * k;
      c.focus = t.focus == null ? null : c.focus == null || k >= 1 ? t.focus : c.focus + (t.focus - c.focus) * k;
    }
    const o = t.orbit, ko = o.damp <= 0 ? 1 : dt > 0 ? 1 - Math.exp(-dt / o.damp) : 0;
    st.orb[0] += (o.yaw * px - st.orb[0]) * ko;
    st.orb[1] += (-o.pitch * py - st.orb[1]) * ko;
  }

  /** @param {number} dt simulated seconds this frame */
  function packFrame(dt) {
    const put = (/** @type {number} */ k, /** @type {number[]} */ v) => F32.set(v, k * 4);
    put(FRAME.view, [st.cssW, st.cssH, st.scrollX, st.scrollY]);
    put(FRAME.backing, [st.bw, st.bh, st.bw / st.cssW, st.bh / st.cssH]);
    put(FRAME.cam, [st.D, st.eye[0], st.eye[1], st.aperture]);
    put(FRAME.clock, [st.time, dt, st.activity, st.frameIndex]);
    // (lane m-glass) z: the aberration in speed; w: the light's ceiling as written (1 on the 8-bit canvas, as its own clamp)
    put(FRAME.band, [st.dawn.length, look.nightAlpha, st.aber, hdrOn ? HDR_CEIL : 1]);
    for (let i = 0; i < 2; i++) { const r = st.dawn[i]; put(FRAME.dawn + i, r ? [r.x0, r.y0, r.x1, r.y1] : [0, 0, 0, 0]); }
    put(FRAME.camX, [...st.camR[0], 0]); put(FRAME.camY, [...st.camR[1], 0]); put(FRAME.camZ, [...st.camR[2], 0]);
    put(FRAME.camP, [...st.camP, st.free ? 0 : st.cam.dolly]);
    put(FRAME.camO, [...st.camO, st.bokeh]);
    put(FRAME.clip, st.clip);
    const p = st.pointer;
    put(FRAME.pointer, [p.x, p.y, p.down ? 1 : 0, p.present ? 1 : 0]);
    put(FRAME.pointerV, [st.pv[0], st.pv[1], look.pointerRadius, look.pointerStrength]);
    let dnow = Math.min(drawNow, drawn);
    // (wave 7, STAGE) the ink per point eases back after a restore (budget())
    if (inkAt >= 0) {
      const k = 1 - Math.exp(-Math.max(0, st.time - inkAt) * 1.5);
      if (k > 0.995 || drawNow < drawn || inkFrom >= drawn) inkAt = -1;
      else dnow = inkFrom + (dnow - inkFrom) * k;
    }
    put(FRAME.wind, [st.wind, st.scrollV, N / dnow * (TIER_COUNTS[tier] / N), st.mist.ink]);
    put(FRAME.depth, [look.far, look.near, st.focusZ, look.maxRadius]);
    put(FRAME.free, [strands, st.mist.size, st.mist.flow, st.mist.wavelength]);
    put(FRAME.free2, [look.mistSpring, look.mistInertia, look.mistEvolution, look.mistZ]);
    put(FRAME.paper, [...L3(enc.paper), 1]);
    put(FRAME.ink, [...L3(enc.ink), 1]);
    put(FRAME.accent, [...L3(enc.accent), 1]);
    put(FRAME.night, [...L3(enc.night), 1]);
    put(FRAME.nightAcc, [...enc.nightAcc, 1]);
    put(FRAME.paperS, [...enc.paper, 1]);
    put(FRAME.accentS, [...enc.accent, 1]);
    put(FRAME.nightS, [...enc.night, 1]);
    const pl = L3(enc.paper), al = L3(enc.accent);
    put(FRAME.sigma, [0, 1, 2].map((c) => Math.log(pl[c] / Math.max(al[c], 1e-4))).concat([0]));
    put(FRAME.lookDay, [look.inkGain, look.keepFeather, look.shutter, look.quantum]);
    // (lane m-glass) w: the grain, one 8-bit step (none on a float16 canvas: no bands to break)
    put(FRAME.lookNight, [look.lightGain, look.lightSharp, look.lightWhite, format === "rgba16float" ? 0 : 1]);
    U32.set([drawn, dnow, st.keep.length, 0], FRAME.count * 4);
    for (let i = 0; i < 16; i++) {
      const r = st.keep[i];
      put(FRAME.keep + i, r ? [r.x, r.y, r.x + r.w, r.y + r.h] : [0, 0, 0, 0]);
    }
  }

  /** Scatter the particles in the first view volume (all invisible: they appear where they are asked to). */
  function seed() {
    const a = new Float32Array(N * 8), r = H.rng(11);
    for (let i = 0; i < N; i++) {
      a[i * 8] = st.scrollX + (r() * 1.4 - 0.2) * st.cssW;
      a[i * 8 + 1] = st.scrollY + (r() * 1.4 - 0.2) * st.cssH;
      a[i * 8 + 2] = look.far + r() * (look.near - look.far);
      a[i * 8 + 7] = look.mistSize;
    }
    device.queue.writeBuffer(res.partBuf, 0, a);
    st.seeded = true;
  }

  // ---------------------------------------------------------------- one frame
  /**
   * @param {number} dtReal seconds since the last call (for the damped camera and the pointer)
   * @param {number} dtSim simulated seconds (0: draw only)
   * @param {boolean} draw
   */
  function step(dtReal, dtSim, draw) {
    if (!st.seeded) seed();
    // pointer velocity (damped), unless the host gives it
    const p = st.pointer;
    if (p.vx != null && p.vy != null) { st.pv = [p.vx, p.vy]; }
    else if (p.present && st.prevPtr && dtReal > 0) {
      const k = 1 - Math.exp(-dtReal / 0.08);
      st.pv[0] += ((p.x - st.prevPtr[0]) / dtReal - st.pv[0]) * k;
      st.pv[1] += ((p.y - st.prevPtr[1]) / dtReal - st.pv[1]) * k;
    } else { st.pv = [0, 0]; }
    st.prevPtr = p.present ? [p.x, p.y] : null;
    // the damped eye: the pointer's parallax and the lean of the scroll; the wind
    if (dtSim > 0) {
      const ex = (p.present ? -((p.x - st.cssW / 2) / (st.cssW / 2)) * look.parallax : 0) * st.parallax;
      const ey = ((p.present ? -((p.y - st.cssH / 2) / (st.cssH / 2)) * look.parallax * 0.6 : 0) + Math.max(-24, Math.min(24, -st.scrollV * look.lean))) * st.parallax;
      const ke = 1 - Math.exp(-dtSim / 0.6);
      st.eye[0] += (ex - st.eye[0]) * ke; st.eye[1] += (ey - st.eye[1]) * ke;
      const kw = 1 - Math.exp(-dtSim / 0.25);
      st.wind += (Math.max(-600, Math.min(600, st.scrollV * look.wind)) - st.wind) * kw;
      st.focus += (st.focusTarget - st.focus) * (1 - Math.exp(-dtSim / look.focusPull));
      // the camera: toward its target, the pointer adding a few degrees; damped on simulated time
      const t = st.camT, c = st.cam, fo = t.follow ?? look.cameraFollow;
      const px = st.aim ? st.aim.x : p.present ? (p.x - st.cssW / 2) / (st.cssW / 2) : 0, py = st.aim ? st.aim.y : p.present ? (p.y - st.cssH / 2) / (st.cssH / 2) : 0;
      const kc = 1 - Math.exp(-dtSim / look.cameraDamp);
      c.yaw += (t.yaw + fo * px - c.yaw) * kc; c.pitch += (t.pitch - fo * 0.6 * py - c.pitch) * kc; c.dolly += (t.dolly - c.dolly) * kc;
      c.cx += ((t.cx ?? st.cssW / 2) - c.cx) * kc; c.cy += ((t.cy ?? st.cssH / 2) - c.cy) * kc; c.cz += (t.cz - c.cz) * kc;
      st.time += dtSim;
    }
    if (st.free) freeStep(dtSim, st.aim ? st.aim.x : p.present ? (p.x - st.cssW / 2) / (st.cssW / 2) : 0, st.aim ? st.aim.y : p.present ? (p.y - st.cssH / 2) / (st.cssH / 2) : 0);
    // the cut's push runs on real time (it must finish before the sheet covers the page)
    if (st.push !== st.pushTo) {
      const d = dtReal / look.pushS;
      st.push = st.pushTo > st.push ? Math.min(st.pushTo, st.push + d) : Math.max(st.pushTo, st.push - d);
    }
    // (lane PORTAL) the portal's flight, on real time too (the sheet's timing is real time)
    if (st.portal !== st.portalTo) {
      const d = dtReal / Math.max(0.05, st.portalS);
      st.portal = st.portalTo > st.portal ? Math.min(st.portalTo, st.portal + d) : Math.max(st.portalTo, st.portal - d);
    }
    if (plates && st.portalFade < 1) {
      // a portal whose glass joins late: it enters (a 120 ms rise) only while the eye is still well inside it; on the
      // way out past the middle it is skipped (a plate never pops in to leave at once)
      if (st.portalFade === 0 && st.portalTo < st.portal && st.portal < 0.5) st.portal = st.portalTo;
      st.portalFade = Math.min(1, st.portalFade + dtReal / 0.12);
    }
    flyStep(dtReal);
    camMatrix();
    aberStep(dtReal);
    packSlots(dtSim);
    packFrame(dtSim);
    // plates: when one is on screen the frame takes the two-pass path
    const pe = pushE();
    /** @type {any[]} */ let slabList = st.slabs;
    // (lane n-flight) the door stands in the room while the eye flies at it (first: the nearest at the end)
    const dn = st.fly ? doorNow() : null;
    if (dn && dn.a > 0.004 && dn.db > 4) slabList = [doorSlab(dn), ...st.slabs].slice(0, MAX_SLABS);
    st.portalDrawn = false;
    // (lane o-fix) coming out, the last few hundredths of the flight draw the room alone: the portal there is all but
    // transparent, and tracing it with the whole room back was the flight's single peak (3.4 ms)
    if (plates && st.portal > (st.portalTo < st.portal ? 0.04 : 0.001)) {
      const v = portalPose(st.portal, { vw: st.cssW, vh: st.cssH, D: st.D, side: st.portalSide });
      // the room's etched plates (no image) step back as the glass comes: seen through another plate they are shaded
      // without their etch or their own light (plates.wgsl.js throughOther) and would read as grey cards in the portal
      const k = 1 - (st.portalFade * Math.min(1, Math.max(0, (st.portal - 0.12) / 0.4)));
      const room0 = k >= 1 ? st.slabs : st.slabs.map((/** @type {any} */ s) => (s.etch && !s.tex ? { ...s, alpha: (s.alpha ?? 1) * k * k * (3 - 2 * k) } : s));
      // (lane o-router) the glass pays for itself: as it comes over the frame the room's own plates, more and more seen
      // only through it (the costly plate-through-plate path), leave; past p 0.3 the portal is the one plate.
      // Leaving: the four nearest the eye go over p 0.08 .. 0.3, the farther ones as soon as the glass starts (p 0 .. 0.2;
      // a room of nine plates seen through the portal cost 2 ms more). Coming out into the new room: the four nearest
      // return over p 0.18 .. 0.02, the farther ones only as the glass is all but gone (p 0.04 .. 0)
      const outw = st.portalTo < st.portal;
      const kr = outw ? 1 - Math.min(1, Math.max(0, (st.portal - 0.02) / 0.16)) : 1 - Math.min(1, Math.max(0, (st.portal - 0.08) / 0.22));
      const nearSet = new Set(room0.length > 4 ? [...room0].sort((x, y) => (y.cz || 0) - (x.cz || 0)).slice(0, 4) : room0);
      const kf = 1 - Math.min(1, st.portal / (outw ? 0.04 : 0.2));
      const room = kr <= 0 ? [] : room0.map((/** @type {any} */ s) => {
        const a = nearSet.has(s) ? kr : kf;
        return a >= 1 ? s : { ...s, alpha: (s.alpha ?? 1) * a };
      }).filter((/** @type {any} */ s) => (s.alpha ?? 1) > 0.001);
      slabList = [portalSlab(v, { R: st.camR, P: st.camP, O: st.camO, scroll: { x: st.scrollX, y: st.scrollY } }, { fade: st.portalFade }), ...room].slice(0, MAX_SLABS);
      st.portalDrawn = st.portalFade >= 1;
    }
    st.platesOn = draw && !!plates && slabList.length > 0 && plates.pack({
      slabs: slabList, R: st.camR, pivot: st.camP, origin: st.camO, scroll: { x: st.scrollX, y: st.scrollY },
      view: { w: st.cssW, h: st.cssH }, D: st.D, eye: st.eye, pointer: st.pointer, dt: dtSim, dpr: st.dpr,
      free: st.free ? { near: st.clip[0], nearFull: st.clip[1], fog: st.clip[3] > st.clip[2] ? [st.clip[2], st.clip[3]] : null,
        focusZ: st.focusZ, aperture: st.aperture, plateFocus: st.fT.plateFocus } : null,
      soften: pe,
      // (lane n-flight) the orbiting camera's plates fade near the lens in a flight, as the free camera's do
      // (lane m-fly) ... but not arriving forward: the eye comes up from behind its resting place and never passes a
      // plate, so the room is drawn by the rule it rests by (a plate nearer than 0.7 D is not drawn). Faded instead,
      // the plates nearest the lens covered the frame all the way in: Work cost 4.6 ms arriving and 3.3 at rest
      nearFade: !st.free && st.fly && !(st.fly.phase === "in" && st.fly.dir > 0) ? [st.clip[0], st.clip[1]] : null,
      // (lane m-fly) 2 while leaving: no plate is looked for behind another either (the door shows none then), and no
      // pixel takes its extra edge rays in either fast part (plates.js)
      lean: flyFast() ? (st.fly.phase === "in" ? 1 : 2) : 0,
      // (lane m-fly, run 3) the door's glass hides the whole frame: the plates behind it are seen through it (packed, not
      // drawn: each of their pixels was shaded twice, once under the door and once through it)
      doorCover: !!(dn && dn.a > 0.004 && dn.db > 4 && doorCover(dn)),
    });
    if (st.platesOn) {
      const W = new Float32Array(256);
      if (!st.free) { W.set([-1e9, plates.splitZ, 0, 0], 0); W.set([plates.splitZ, 1e9, 0, 0], 128); }
      else {
        // the free camera's deep world: per plate, its screen rectangle and its mid plane (draw.wgsl.js ZWin)
        const L = plates.last.slice(0, 12);
        for (const [o, mode] of [[0, 1], [128, 2]]) {
          W.set([0, 0, mode, L.length], o);
          L.forEach((/** @type {any} */ q, /** @type {number} */ i) => { W.set(q.quad, o + 4 + i * 4); W.set(q.plane, o + 52 + i * 4); });
        }
      }
      device.queue.writeBuffer(res.winBuf, WIN, W);
    }
    st.wasDown = !!p.down;
    device.queue.writeBuffer(res.frameBuf, 0, F32);
    device.queue.writeBuffer(res.slotBuf, 0, S32);

    const enc = device.createCommandEncoder({ label: "stage.frame" });
    const ts = res.ts && draw ? res.ts : null;
    let tsSlot = -1;
    if (ts) { const s = ts.staging.findIndex((/** @type {any} */ x) => !x.busy); if (s >= 0) { tsSlot = ts.slot; ts.slot = (ts.slot + 1) % 3; ts.stIdx = s; } }
    const tsW = (/** @type {number} */ k) => (tsSlot >= 0 ? { querySet: ts.set, beginningOfPassWriteIndex: tsSlot * 8 + k * 2, endOfPassWriteIndex: tsSlot * 8 + k * 2 + 1 } : undefined);
    const tsB = (/** @type {number} */ k) => (tsSlot >= 0 ? { querySet: ts.set, beginningOfPassWriteIndex: tsSlot * 8 + k * 2 } : undefined);
    const tsE = (/** @type {number} */ k) => (tsSlot >= 0 ? { querySet: ts.set, endOfPassWriteIndex: tsSlot * 8 + k * 2 + 1 } : undefined);
    // the bloom this frame: asked for, its pipelines in, and some night on screen (the dawn never glows)
    const allDawn = st.dawn.some((r) => r.x0 <= 0 && r.y0 <= 0 && r.x1 >= st.cssW && r.y1 >= st.cssH);
    const glow = draw && !!bloom && st.bloom > 0.001 && !allDawn;
    // the field this frame (null: nothing asked, or nothing to draw)
    /** @type {any} */ let fOn = null;
    fieldBusy = false;
    if (draw && field) {
      // (wave 7, COSMOS) eye: the projection's eye offset (frame.cam.yz), the cosmos's eye in the room; fly: no impulse
      // starts in a flight
      try { fOn = field.pack({ R: st.camR, P: st.camP, O: st.camO, scroll: { x: st.scrollX, y: st.scrollY }, view: { w: st.cssW, h: st.cssH }, D: st.D, time: st.time, allDawn, eye: st.eye, fly: !!st.fly }); fieldBusy = !!(fOn && fOn.busy); }
      catch (e) { fieldOff(e); fOn = null; }
    }
    const fWall = (/** @type {GPURenderPassEncoder} */ rp) => { if (fOn && field) field.encodeWall(rp); };
    const fChips = (/** @type {GPURenderPassEncoder} */ rp, /** @type {number} */ k) => { if (fOn && field) field.encodeChips(rp, k); };
    // the extra passes this frame (registerPass): none registered or none asked = nothing here, HEAD's frame
    passBusy = false;
    /** @type {any[]} */ let pUnder = [], pOver = [];
    /** @type {any} */ let pCtx = null;
    if (draw && passes.size) {
      pUnder = passList("under"); pOver = passList("over");
      if (pUnder.length || pOver.length) {
        pCtx = { R: st.camR, P: st.camP, O: st.camO, D: st.D, clip: st.clip, free: st.free, time: st.time, dt: dtSim, view: { w: st.cssW, h: st.cssH },
          scroll: { x: st.scrollX, y: st.scrollY }, allDawn, platesOn: st.platesOn, bw: st.bw, bh: st.bh, dpr: st.dpr };
        for (const p of [...pUnder, ...pOver]) {
          try { if (p.inst.compute) p.inst.compute(enc, { ...pCtx, cfg: passCfg[p.def.id] }); if (p.inst.busy && p.inst.busy()) passBusy = true; }
          catch (e) { passOff(p.def.id, e); }
        }
        pUnder = pUnder.filter((p) => p.inst); pOver = pOver.filter((p) => p.inst);
      }
    }
    /** @param {GPURenderPassEncoder} rp @param {any[]} list */
    const xPass = (rp, list) => {
      for (const p of list) {
        try { p.inst.encode(rp, { ...pCtx, cfg: passCfg[p.def.id] }); } catch (e) { passOff(p.def.id, e); }
        rp.setBindGroup(0, res.frameGroup);
      }
    };
    const simulate = dtSim > 0;
    if (simulate) st.simCount++;
    if (simulate && simGroup && simPipe) {
      const cp = enc.beginComputePass({ label: "stage.sim", timestampWrites: tsW(0) });
      cp.setPipeline(simPipe);
      cp.setBindGroup(0, res.frameGroup);
      cp.setBindGroup(1, simGroup);
      cp.dispatchWorkgroups(Math.ceil(drawn / 64));
      cp.end();
    }
    let inkRan = false;
    if (draw) {
      /** @param {GPURenderPassEncoder} rp @param {string} layer */
      const bodies = (rp, layer) => {
        for (const a of st.active) {
          const rec = formations.get(a.id);
          if (!rec || !rec.ready || !rec.body || rec.bodyLayer !== layer || !(a.weight > 0)) continue;
          const rect = a.rect || { x: st.scrollX, y: st.scrollY, w: st.cssW, h: st.cssH };
          try { rec.body.encode(rp, { ...makeCtx(rec, a, rect, dtSim), out: rec.out }); } catch (e) { log(`[stage] body "${rec.id}" threw: ${e}`); }
          rp.setBindGroup(0, res.frameGroup);
        }
      };
      /** @param {GPURenderPassEncoder} rp @param {number} k 0 all, 1 behind the plates, 2 in front of them */
      const particles = (rp, k) => { if (!drawPipe) return; rp.setPipeline(drawPipe); rp.setBindGroup(1, res.drawGroups[k]); rp.draw(6, Math.min(drawNow, drawn)); };
      const clear = { r: 0, g: 0, b: 0, a: 0 };
      const cur = context.getCurrentTexture();
      const view = cur.createView();
      if (!st.platesOn) {
        // the frame as it always was: one pass, every particle
        const rp = enc.beginRenderPass({ label: "stage.draw", colorAttachments: [{ view, loadOp: "clear", storeOp: "store", clearValue: clear }], timestampWrites: tsW(2) });
        rp.setBindGroup(0, res.frameGroup);
        fWall(rp);
        if (pUnder.length) xPass(rp, pUnder);
        bodies(rp, "under");
        particles(rp, 0);
        fChips(rp, 0);
        if (pOver.length) xPass(rp, pOver);
        bodies(rp, "over");
        rp.end();
      } else {
        // A: what the plates bend (the bodies under, the light behind the plates) into the ink texture
        // (lane m-fly) a late page, the eye gone on into the door's glass with the room it left behind it: nothing of
        // that room is ahead to draw, and an empty ink was the flat glass of the passage. The last picture drawn before
        // the eye went in stays behind the back face (the glass reads it by the ray's direction: a room far beyond),
        // until the new room takes the stage. The pass is not run at all then.
        const inkKey = st.bw + "x" + st.bh;
        const held = !!(st.fly && st.fly.phase === "hold" && st.fly.dir > 0 && st.fly.door && st.inkKey === inkKey);
        st.inkHeld = held;
        if (!held) {
        inkRan = true; st.inkKey = inkKey;
        const ra = enc.beginRenderPass({ label: "stage.ink", colorAttachments: [{ view: plates.inkView, loadOp: "clear", storeOp: "store", clearValue: clear }], timestampWrites: tsW(1) });
        ra.setBindGroup(0, res.frameGroup);
        fWall(ra);
        if (pUnder.length) xPass(ra, pUnder);
        bodies(ra, "under");
        particles(ra, 1);
        fChips(ra, 1);
        if (pOver.length) xPass(ra, pOver);
        ra.end();
        }
        // B: the canvas: that light texel for texel, the plates far to near, the swarm in front, the bodies over
        const rb = enc.beginRenderPass({ label: "stage.draw", colorAttachments: [{ view, loadOp: "clear", storeOp: "store", clearValue: clear }], timestampWrites: tsW(2) });
        rb.setBindGroup(0, res.frameGroup);
        // (lane m-glass) the blit (pass A into the canvas, with the aberration in speed) is not drawn while the door's
        // glass hides the whole frame (plates.js covered): every one of its pixels was painted over
        if (!plates.covered) plates.encodeBlit(rb);
        plates.encodePlates(rb);
        particles(rb, 2);
        fChips(rb, 2);
        bodies(rb, "over");
        rb.end();
      }
      if (glow) encodeBloom(enc, cur, view, tsB(3), tsE(3));
    }
    if (tsSlot >= 0) {
      const sb = ts.staging[ts.stIdx];
      enc.resolveQuerySet(ts.set, tsSlot * 8, 8, ts.resolve, 256 * tsSlot);
      enc.copyBufferToBuffer(ts.resolve, 256 * tsSlot, sb.buf, 0, 64);
      sb.busy = true;
    }
    device.queue.submit([enc.finish()]);
    st.submits++;
    st.frameIndex++;
    if (tsSlot >= 0) {
      const sb = ts.staging[ts.stIdx], sim = simulate, gl = inkRan, bl = glow;
      sb.buf.mapAsync(GPUMapMode.READ).then(() => {
        const v = new BigUint64Array(sb.buf.getMappedRange().slice(0));
        sb.buf.unmap(); sb.busy = false;
        const span = (/** @type {number} */ k) => (v[2 * k + 1] > v[2 * k] && v[2 * k] > 0n ? Number(v[2 * k + 1] - v[2 * k]) / 1e6 : 0);
        const ms = (sim ? span(0) : 0) + (gl ? span(1) : 0) + span(2) + (bl ? span(3) : 0);
        st.gpuLast = ms;
        st.passMs = [sim ? span(0) : 0, gl ? span(1) : 0, span(2), bl ? span(3) : 0];
        if (sim) { st.gpu.push(ms); if (st.gpu.length > 30) st.gpu.shift(); }
      }, () => { sb.busy = false; });
    }
  }

  /**
   * The bloom: the canvas as drawn -> threshold at a half or a quarter -> down the levels -> up, added -> added to the
   * canvas's colour (its alpha untouched). @param {GPUCommandEncoder} enc @param {GPUTexture} cur @param {GPUTextureView} view
   * @param {any} tsBegin @param {any} tsEnd
   */
  function encodeBloom(enc, cur, view, tsBegin, tsEnd) {
    ensureBloom();
    const L = bloom.levels, kb = bloom.kit;
    if (!L.length) return;
    const t = st.bloomT;
    device.queue.writeBuffer(bloom.ubuf, 0, new Float32Array([t.threshold, t.knee, st.bloom, t.plates, 0, 0, 0, 0]));
    const src = device.createBindGroup({ label: "bloom.src", layout: kb.layout, entries: [
      { binding: 0, resource: cur.createView() }, { binding: 1, resource: bloom.smp }, { binding: 2, resource: { buffer: bloom.ubuf } }] });
    const pass = (/** @type {GPURenderPipeline} */ pipe, /** @type {GPUTextureView} */ target, /** @type {GPUBindGroup} */ g, /** @type {boolean} */ load, /** @type {any} */ tw) => {
      const rp = enc.beginRenderPass({ label: "stage.bloom", colorAttachments: [{ view: target, loadOp: load ? "load" : "clear", storeOp: "store", clearValue: { r: 0, g: 0, b: 0, a: 0 } }], timestampWrites: tw });
      rp.setPipeline(pipe); rp.setBindGroup(0, res.frameGroup); rp.setBindGroup(1, g); rp.draw(3); rp.end();
    };
    pass(kb.pre, L[0].view, src, false, tsBegin);
    for (let i = 0; i + 1 < L.length; i++) pass(kb.down, L[i + 1].view, L[i].group, false, undefined);
    for (let i = L.length - 2; i >= 0; i--) pass(kb.up, L[i].view, L[i + 1].group, true, undefined);
    pass(kb.comp, view, L[0].group, true, tsEnd);
  }

  /** Halve the drawn count when the frames stay over budget (only while moving); (wave 7, STAGE) and bring it back
   *  when they stay well under it. @param {number} dt */
  function budget(dt) {
    // (lane o-router) the cut's flight is a few hundred ms of its own cost (the portal's plate over the whole frame), not
    // the page's: its frames never count toward halving the swarm, which now outlives the page
    if (st.portal > 0.001 || st.portalTo > 0 || st.fly) { st.gpu = []; st.dts = []; calm = 0; return; }
    let over = false, under = false;
    if (tsOn) {
      if (st.gpu.length >= 30) { const s = st.gpu.slice().sort((x, y) => x - y); over = s[15] > budgetMs; under = s[15] < budgetMs * RESTORE_K; }
    } else {
      st.dts.push(dt); if (st.dts.length > 90) st.dts.shift();
      if (st.dts.length >= 90 && st.frameIndex > 120) { const s = st.dts.slice().sort((x, y) => x - y); over = s[45] > 1 / 40; }
    }
    if (over && drawn > FLOOR) {
      drawn = Math.max(FLOOR, Math.floor(drawn / 2)); halvings++;
      st.gpu = []; st.dts = []; calm = 0;
      // halved again soon after a restore: the next restore waits twice as long (up to a minute): never a pumping
      if (performance.now() - restoredAt < REBOUND_S * 1000) needCalm = Math.min(60, needCalm * 2);
      log(`[stage] over budget: drawn count halved to ${drawn}`);
      return;
    }
    /* (wave 7, STAGE) THE WHOLE SWARM BACK. A halving used to hold for the rest of the page, and the home is one long
       page: one dense part halved it and every part after drew half the points. Once the timed frames have stayed under
       half the budget (the median of the last 30) through `needCalm` seconds of moving frames in a row, the drawn count
       doubles back, a step at a time (the points it doubled with would cost what they cost before: the bar leaves them
       the room). The points that come back start from nothing on their targets and fade in (their records zeroed: they
       stood still, unsimulated, where the halving left them), never flying in from where they were. Only with the GPU's
       own timestamps (without them a frame's length is the display's, not the GPU's: no room can be read). */
    if (under && drawn < N) {
      calm += dt;
      if (calm >= needCalm) {
        const d2 = Math.min(N, drawn * 2);
        // ink 0 and a radius of -1: the sim lets each one appear on its target (sim.wgsl.js), never fly in
        const rec = new Float32Array((d2 - drawn) * 8);
        for (let j = 7; j < rec.length; j += 8) rec[j] = -1;
        try { device.queue.writeBuffer(res.partBuf, drawn * 32, rec); } catch (e) { return; }
        log(`[stage] under budget for ${calm.toFixed(1)} s: drawn count back to ${d2}`);
        // the ink per point eases back as the points that came back take theirs (no dip of the swarm's light)
        inkFrom = drawn; inkAt = st.time;
        drawn = d2; restores++; restoredAt = performance.now();
        st.gpu = []; calm = 0;
      }
    } else if (!under) calm = 0;
  }

  /** @param {number} dtSec @returns {boolean} drew */
  function frame(dtSec) {
    if (st.destroyed) return false;
    const dt = Math.max(0, Math.min(dtSec || 0, 0.1));
    const open = performance.now() - st.lastInput < st.windowS * 1000;
    if (st.push !== st.pushTo || st.portal !== st.portalTo || (st.portal > 0.001 && st.portalFade < 1) || st.fly) st.dirty = true;
    if (st.fly) st.lastInput = performance.now();
    st.activity = open ? Math.min(1, st.activity + dt / 0.25) : Math.max(0, st.activity - dt / STOP_S);
    const a = st.activity, ease = a * a * (3 - 2 * a);
    if (a <= 0 && !st.dirty) return false;
    const dtSim = a > 0 ? Math.min(dt, 1 / 30) * ease : 0;
    // (lane o-router) the glass pays for itself, leaving: once it covers most of the frame (p > 0.3, on its way in) the
    // swarm behind it, pushed close to the eye, draws half its points at twice the ink, a quarter past p 0.6 (the tone
    // holds, all of them still simulate); the arriving half and the room at rest draw them all
    // (lane o-fix) half past p 0.2, a quarter past p 0.35: the door's rims crossing the middle of a dense room (the index)
    // were the flight's peak (3.4 ms at 1440 DPR 2)
    drawNow = !(st.portalTo > 0) || st.portal <= 0.2 ? drawn : Math.max(FLOOR, drawn >> (st.portal > 0.35 ? 2 : 1));
    // (lane n-flight) the door near the eye covers most of the frame (its rays the costly path): half the points then
    // (lane n-fix-flight) ... and through the flight's fast part (the page's plates growing over the frame as they pass
    // the lens were its peak, 3.4 to 3.5 ms: n-critic 13), and while the eye is in the glass, arriving too
    if (st.fly) {
      const f = st.fly, dn = f.door ? doorNow() : null, u = f.t / f.T;
      if ((f.phase === "out" && u > 0.45) || f.phase === "hold" || (dn && dn.a > 0.004 && dn.df < 0.45 * st.D)) drawNow = Math.max(FLOOR, drawn >> 1);
    }
    step(dt, dtSim, true);
    if (a > 0) budget(dt);
    st.dirty = fieldBusy || passBusy;   // the field fading in (or a pass still loading) keeps drawing; false when none is asked
    return true;
  }

  /** Deterministic: simulate ms at 60 Hz, then draw once and rest. @param {number} ms */
  async function advance(ms) {
    await swarmOK;
    const n = Math.max(1, Math.round((ms / 1000) * 60));
    st.activity = 1;
    for (let i = 0; i < n; i++) {
      step(1 / 60, 1 / 60, i === n - 1);
      if (i % 30 === 29) await device.queue.onSubmittedWorkDone();
    }
    st.activity = 0; st.lastInput = -1e12; st.dirty = false;
    await device.queue.onSubmittedWorkDone();
  }

  function stats() {
    const s = st.gpu.slice().sort((x, y) => x - y);
    return {
      simulated: drawn, drawn, capacity: N, tier, halvings, restores, strands,
      gpuMs: s.length ? s[s.length >> 1] : st.gpuLast, gpuLastMs: st.gpuLast, timestamps: tsOn,
      awake: st.activity > 0, activity: st.activity, submits: st.submits, frames: st.frameIndex,
      backing: [st.bw, st.bh], dpr: st.dpr,
      swarm: { ready: !!simPipe, at: swarmAt }, passMs: st.passMs, platesOn: st.platesOn, plates: st.platesOn ? plates.count : 0, plateTier: plates ? plates.tier : null, glass: !!plates, focus: st.focus,
      camera: st.free ? { free: true, pos: st.fC.pos.map(Math.round), target: st.fC.target.map(Math.round), roll: st.fC.roll, lens: st.fC.lens, orbit: [...st.orb], D: Math.round(st.D) } : { ...st.cam },
      dawn: st.dawn.length, push: st.push, portal: st.portal, fly: flyState(), rest: st.windowS, bloom: { on: !!bloom, failed: bloomFailed, strength: st.bloom, levels: bloom ? bloom.levels.length : 0 },
      hdr: { on: hdrOn, format, why: kit.hdrWhy ?? null }, aber: Math.round(st.aber * 1000) / 1000,
      field: field ? field.stats() : { on: false, ready: false, failed: fieldFailed },
      passes: Object.fromEntries([...passes.entries()].map(([id, p]) => [id, { ready: !!p.inst, failed: p.failed, on: !!(p.inst && passCfg[id]) }])),
    };
  }

  /** (lane o-router) a page leaves but the stage stays (the Astro build's soft navigation): every formation (its targets'
   *  room in the one buffer, its body) is let go, the slabs, keep-outs, extra passes and the backdrop are cleared; the
   *  device, the pipelines, the swarm (its points keep their memory: they drift as mist until the next page's figures
   *  take them), the camera, the clock and the portal stay. The buffer keeps its size, so twenty pages never grow it. */
  function reset() {
    for (const rec of formations.values()) { try { rec.body?.destroy?.(); } catch { /* ignore */ } }
    formations.clear(); tgtUsed = 0; orderNext = 0;
    st.active = []; st.slabs = []; st.keep = [];
    passCfg = {};   // a pass is drawn only while a scene asks for it (passList)
    if (plates) plates.setBackdrop(null, null); else bdHeld = null;
    // every page starts with the whole swarm, as on a load: a page that halved it does not halve the next one's
    drawn = N; st.gpu = []; st.dts = []; calm = 0; needCalm = RESTORE_S; inkAt = -1;
    st.dirty = true;
  }

  function destroy() {
    st.destroyed = true;
    for (const rec of formations.values()) { try { rec.body?.destroy?.(); } catch { /* ignore */ } }
    if (plates) plates.destroy();
    if (field) { try { field.destroy(); } catch { /* gone */ } }
    PASS_LISTEN.delete(addPass);
    for (const p of passes.values()) { try { p.inst && p.inst.destroy && p.inst.destroy(); } catch { /* gone */ } }
    passes.clear();
    if (bloom) { for (const l of bloom.levels) l.tex.destroy(); bloom.ubuf.destroy(); }
    res.winBuf.destroy();
    res.frameBuf.destroy(); res.slotBuf.destroy(); res.partBuf.destroy(); tgtBuf?.destroy();
    if (res.ts) { res.ts.set.destroy(); res.ts.resolve.destroy(); for (const s of res.ts.staging) s.buf.destroy(); }
    try { context.unconfigure(); } catch { /* ignore */ }
  }

  return {
    register, prepare,
    /** (lane m-fly) room for n target points made ahead (the room on stage keeps its own): a takeover then registers a
     *  whole page with nothing to wait for @param {number} n */
    reserve: (n) => ensureTargets(Math.max(1, n | 0)),
    setBackdrop, slabTexture, set, input, resize, frame, advance, stats, destroy, cut, portal, reset, fly,
    /** (lane n-flight) whether the plates hold this texture now @param {string} id */
    hasTexture: (id) => !!(plates && plates.hasTexture && plates.hasTexture(id)),
    /** (lane n-flight) the flight now: { phase: "out" | "hold" | "in" | null, u, d, z, dir, door, cover } */
    get flyState() { return flyState(); },
    /** (lane PORTAL) the portal's progress now (0 the room, 1 inside the glass), its target, whether it drew whole */
    get portalState() { return portalState(); },
    /** the stage's own clock: simulated seconds (they stop at rest) and the activity 0..1 (a scene's idle drift reads it) */
    get clock() { return { time: st.time, activity: st.activity, awake: st.activity > 0 }; },
    /** resolves true once the bloom can draw (false if its pipelines failed) */
    whenBloom: bloomReady,
    /** (wave 2, ARRIVE) resolves true once the swarm can draw (false: its pipelines failed and onError was called) */
    whenSwarm: swarmOK,
    get swarm() { return { ready: !!simPipe, at: swarmAt }; },
    /** resolves true once the field can draw (false if its module or pipelines failed: the stage draws without it) */
    whenField: fieldReady,
    /** @param {any} l */ plateLook: (l) => { Object.assign(lookHeld, l); if (plates) plates.look(l); st.dirty = true; },
    /** the plates of the last frame (id, view z, screen rect), for a host or a bench */
    get plates() { return plates ? plates.last : []; },
    /** whether plates can draw yet, and since when (performance.now ms; 0 until then); failed: their pipeline failed */
    get glass() { return { ready: !!plates, at: glassAt, failed: glassFailed }; },
    /** resolves true once plates can draw (false if their pipeline failed or the stage was destroyed first) */
    whenGlass: glassReady,
    /** @param {Partial<typeof LOOK>} l */ look: (l) => { Object.assign(look, l); if (typeof l.focus === "number") st.focus = st.focusTarget = l.focus; st.dirty = true; },
    get count() { return drawn; },
    format, frameLayout: res.frameLayout,
  };
}
