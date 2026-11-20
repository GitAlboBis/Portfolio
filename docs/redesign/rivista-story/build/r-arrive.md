# r-arrive — lane ARRIVE (port 5300)

Owns: fx-stage.js, stage/stage.js, stage/boot.js, stage/scenes/README.md.
Order: 1 extra pass hook (for the splat lane) · 2 the cut as one gesture · 3 every page opens lit · 4 signals for the 2D layer · 5 stage-dead → printed page · 6 proof.

## FOR THE SPLAT LANE (done, in stage.js + fx-stage.js; README "An extra pass")

`import { registerPass } from "../stage.js"` (same URL the host imports: no query string). Register from your module
at import time; every stage of the page (now or later) calls `init` once with its device. A scene switches it on by
returning `passes: { <id>: cfg }`; the host sends the heaviest scene's cfg with `cfg.weight` = the scenes' blend (0..1).
Absent → not drawn, and with nothing registered the frame is exactly HEAD's.

```js
// stage/splat/pass.js
import { registerPass } from "../stage.js";
registerPass({
  id: "splat", layer: "under",            // "under": after the field's wall, before the swarm; "over": after swarm + chips
  async init(api) {                       // { device, format, frameLayout, frameWGSL, noiseWGSL, blend, tier, log }
    const mod = api.device.createShaderModule({ code: api.frameWGSL + MY_WGSL });   // group 0 = StageFrame (stageView, stageProject, fog via clip)
    const pipe = await api.device.createRenderPipelineAsync({ layout: api.device.createPipelineLayout({ bindGroupLayouts: [api.frameLayout, myLayout] }),
      vertex: { module: mod, entryPoint: "vs" }, fragment: { module: mod, entryPoint: "fs", targets: [{ format: api.format, blend: api.blend }] } });
    let cfg = null;
    return {
      set(c) { cfg = c; return true; },                  // c = the scene's cfg + weight
      compute(encoder, ctx) { /* sort by depth: ctx.R, ctx.P, ctx.O, ctx.D, ctx.clip, ctx.time */ },
      encode(pass, ctx) { pass.setPipeline(pipe); pass.setBindGroup(1, myGroup); pass.draw(4, count); },   // group 0 already set
      busy() { return false; },                          // true keeps the stage drawing (loading); must SETTLE to false
      destroy() { /* free buffers */ },
    };
  },
});
// a scene: frame(ctx) { return { ..., passes: { splat: { scene: "hall", strength: 1 } } }; }
```
Output premultiplied, sRGB-encoded like the discs (stageOETF). With plates on screen the pass draws into the light the
plates bend (always behind the plates). The bloom reads it. A throw in init/compute/encode turns only the pass off
(one `[stage] pass "id" off:` line with ?debug=1). `stage.stats().passes` = { id: { ready, failed, on } }.

## FOR THE SCENE / KIT LANES: the arrival flag
`ctx.arrival = { cut, under, age }` — cut: this page was reached by a cut between pages (the stage first drew under the
arriving sheet); under: the sheet still covers the page now; age: seconds since the stage's first frame on this page
(host clock). A scene/room that ramps its light from its first frame should be at FULL light when `arrival.cut` (no
rise), or at most a 250 ms rise on a cold load. (Status: being built, see below.)

## FOR THE 2D LAYER: signals (fx-stage.js dispatches; nothing else)
- `fx:stage:frame` (window event via FX.emit, detail { arrival, under, t }): the stage's first frame on this page.
  Late listeners: `html.stage-on`.
- `fx:stage:lit` (same detail): the subject is lit. A scene module with `litSignal: true` says when (`lit: true` in its
  answer); a page without one is lit at its first frame; at most 4 s after the first frame anyway. Late: `html.stage-lit`.
- `FX.stage = { expected, frame: Promise, lit: Promise, frameAt, litAt }` — both resolve at once when no stage will draw
  (not allowed, or html.stage-dead).

## Status
- done 1: extra pass hook (stage.js registerPass, host `passes`, README). Tested: a test pass draws behind plates; a
  WGSL error in a pass turns only the pass off (validation scope around init's sync part).
- done 2 (engine side): the push is faster (pushS 0.34, ease-out), longer (pushDolly 0.24 D) and grows the picture about
  the leading scene's subject (stage.cut(on, {x,y} fractions); host: o.subject or the fig's centre). An arrival
  (data-arrive at script time) builds the stage at once, under the sheet; canvas opacity 1 with no transition there.
- done 3: createStage no longer waits for the swarm's pipelines (sim compute ~0.4 s to compile on Windows: it held the
  first frame past the sheet). The room (field, bloom, plates when in) draws first; the swarm joins (stage.swarm,
  whenSwarm; advance() waits). The host waits for the field (whenField, cap 0.5 s) before the first frame. First frame
  weights snap to their targets (scenes, formations, the orbit camera): nothing rises from zero.
  Arrival timeline after (about.html by a cut, page ms): field in 172, FIRST FRAME 195, sheet uncovered 122 → gone 415,
  plates 448, swarm 473. Before: first frame 487 (after the sheet had left).
- done 4 (signals), 5 (stage-dead adds html.gl-off: the printed rules everywhere; ST.refresh; not on pagehide).
- Tried and dropped: compiling the sim after the plates (each ~350 ms intrinsic; the sim only got later).
- done 5 (completed): on stage-dead every `.sc-step[data-stage-step]` gets st-on (FX.mo.step(el, true) first): the
  steps' text showed nothing under gl-off before (no one handed it over). Looked: dead-work.png = gl0-work.png.
- slabTexture: one upload per task (the textures waiting for the glass resumed in one 54-64 ms task on Work once the
  first frame came before them).
- done 6 PROOF (2026-11-12): strips `.shots/r-arrive/strip/{b,a}-{g2case,hdr2about,case2cover}` (50 ms) and
  `{b,a}-cold-{work,about,consulting}` (100 ms). Push visible 0–250 ms; arriving room drawn at ~690 ms from the click
  (HEAD ~945, after the sheet had gone); cold About lit at ~800 ms (HEAD ~1300). First frames (median, ms) mine/HEAD:
  desktop index 351/572, work 290/552, about 278/551, consulting 303/558, obla 317/563, case 288/549, cut 184/471;
  phone 391/608, 287/565, 285/553, 317/555, 299/560, 323/549. No long task > 50 ms after the first frame.
  Sleep 0 frames on 7 pages; Back/Forward fine; ?stage=0, ?gl=0, reduced: 0 adapter requests; console clean on 32
  pages; failfield/faildevice: faildevice now gl-off (printed). Gates: --check ok, claims OK.
- DONE. Servers stopped.

## Needs elsewhere
- fx-nav.js `arrive()` (or fx-motion's cutIn): before the card clears, also wait for `FX.stage.frame` (race with a cap of
  ~250 ms, like FX.mo.prepared): the sheet uncovers at ~120 ms of the new page and the room's first frame is at ~195 ms,
  so today the sheet starts leaving ~75 ms before the room is drawn under it.
- stage/scenes/lib/room.js (and stage/field fade): when `ctx.arrival.cut`, `fade: 0` (the field's own 0.25 s fade-in
  runs from its pipelines being ready, partly while the sheet is already leaving).
- stage/scenes/hero.js: `litSignal: true` in the module and `lit: true` in the answer once the name is lit (~1.45 s), so
  `fx:stage:lit` / FX.stage.lit mean the cover's name (today the cover is "lit" at its first frame).

## Run and look
- servers: `python scripts/serve-static.py 5300 public` (mine), 5305 serves `.shots/r-arrive/_before/public` (HEAD).
- `.shots/r-arrive/_scripts/strip.mjs <tag> g2case|hdr2about|case2cover|cold:<route> --port=5300|5305 [--ms=50]` →
  `.shots/r-arrive/strip/<tag>/sheet.jpg`; `bt.mjs cut --base=...` the arrival's timeline; passtest.mjs the hook.
