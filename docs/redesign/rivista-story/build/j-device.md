# j-device — what a real iPhone does differently (read-only lane DEVICE, phase 1; workflow `mobile-understand`)

- **Question:** on Alberto's iPhone (Safari, iOS 26 chrome) the live home draws ONE glass plate, but not the name of
  light, not the cosmos, not the chips; animations «storte e non continue» behind the text; not one continuous scroll.
- **Rules of this lane:** nothing changed under `public/`, `web/`, `scripts/`; no commit; probes headless only through
  `launch()` of `scripts/lib/headless.mjs`; scratch `.shots/j-device/`; ports 5430, 5431 (no server was started: the
  probes ran against the live site).
- **Status:** DONE (run 2, 22 Nov, Opus 5.5 effort max, on HEAD `4e677f6` = `15fb573` + a HANDOFF line; run 1 was cut
  by the Fable limit after the header). Nothing in the tree changed but this file.

## Verdict, ranked

1. **The stage's light is written at alpha 0 and a real iPhone throws it away (likely; the screenshot is reproduced).**
   Every light the stage draws is premultiplied colour with ALPHA 0, added over the page: the swarm at night
   (`stage/wgsl/draw.wgsl.js:160` `vec4f(lightCol * e, min(e, 1.0) * frame.band.y)`, `band.y` = `LOOK.nightAlpha` =
   0, `stage/stage.js:311`, packed at `stage.js:1506`), the cosmos, the filaments, the haze and the chips
   (`stage/field/field.wgsl.js:460, 476, 521, 704` all `return vec4f(col, 0.0)`; header line 10 «Light is added
   (premultiplied colour, alpha 0)»), Now's orrery (`stage/orrery/orrery.wgsl.js:365`, alpha `e * band.y`), the bloom
   (`stage.js:581`, alpha blend zero/one), the blit of pass A (`stage/plates/plates.wgsl.js:96-107`, a copy). Only the
   plates write real alpha (`plates.wgsl.js:1283` `vec4f(enc * cov, cov)`), the dawn's ink (`draw.wgsl.js:153`) and a
   splat's solid part (`splat/splat.wgsl.js:293`). Colour above alpha is "out of range" for a premultiplied canvas: the
   WebGPU spec leaves its display undefined (gpuweb PR 4526 keeps «the visible result ... is undefined»). Chrome adds it;
   a compositor that un-premultiplies (colour matching, a filter, EDR) loses it. In headless Chrome at the iPhone's size
   (393x852 DPR 3, tier B) 97.1 % of the canvas is alpha 0 (528,275 of 544,086 backing px; 15,811 with alpha: the
   plate), and both emulations of such a compositor (a CSS colour filter on the canvas, Skia un-premultiplies; the
   canvas's own PNG laid over the page) give Alberto's screenshot: one plate top right, no name, no cosmos, no chips
   (`.shots/j-device/cmp-alberto.png`: iPhone | emulation | Chrome). Public precedent: WebKit 278926 (2024, NEW,
   InRadar) «Additive colors broken with WebGL canvas and premultiplied alpha compositing»: glass reflections drawn at
   alpha 0 vanish in Safari on macOS (Karl Dubost: shown on an external screen, black on the Retina screen).
   It also explains «not one continuous journey»: the cosmos is what fills the frame between parts; without it the
   frame between the plates is the bare night (`.shots/j-device/home-junction/sheet.png`).
2. **Which canvas loses it is open: the float16 HDR one only, or both (possible, decided by `?hdr=0`).** On an iPhone
   `matchMedia("(dynamic-range: high)")` matches, and Safari 26 has «HDR support in WebGPU Canvas» (Safari 26.0
   release notes, 15 Sep 2025), `toneMapping` (WebKit 279816) and `getConfiguration` (WebKit 281015, Oct 2024); WebKit
   272702 c5 (Tavares, Aug 2025): on iOS the extended canvas does show in HDR. So `stage/gpu.js:70-90` canvasSetup
   very likely took rgba16float + extended on his phone. The 2024 WebGL report could NOT reproduce the alpha-0 loss on
   iOS (8-bit path), which points at the new EDR path; but the same report shows the 8-bit path can lose it too on an
   Apple display. Our own HDR code is not at fault: Chrome with `?hdr=1` (on, rgba16float, forced) draws everything,
   no GPU error (`.shots/j-device/home-hdr1/`).
3. **The stage never turned itself off on the iPhone (confirmed from the screenshot + code).** A failed swarm or plate
   pipeline calls onError (`stage.js:709-714`, host `fx-stage.js:1746` off("plates: ...")); a GPU error in a frame
   (`fx-stage.js:1042-1048`) or an uncaptured one (`fx-stage.js:1289`) calls off(); off() removes the canvas and adds
   `stage-dead`, which prints the h1 (`css/page-cover.css:27-31`; also printed after 6 s without `stage-on`). The
   screenshot shows a plate drawn and no printed name: the stage was on, drawing, error-free. So a REJECTED swarm or
   field pipeline is not the cause; only a pipeline that never resolves plus a field that fails quietly could give the
   picture (unlikely: two failures; chips and haze read no storage buffer, `field.wgsl.js:151, 548`, so "storage in the
   vertex stage" cannot be the common cause). Contact decides it (the strokes are swarm ink with alpha).
4. **The scroll on a touch screen is the compositor's, the stage's is the main thread's (likely contributor to
   «storte e non continue»).** Lenis smooths the wheel only (`fx-core.js:148, 167`, syncTouch false): on the iPhone the
   page scrolls natively (up to 120 Hz on a ProMotion model) while the stage draws in rAF from `window.scrollY`
   (`fx-stage.js:754`) into a fixed canvas the compositor does not move with the page; Safari caps rAF near 60 fps on
   Pro iPhones by default (flag «Prefer Page Rendering Updates near 60fps», WebKit 272226). Whatever the canvas keeps in
   step with the page (plates sliding in a track, the cosmos's parallax, a figure entering or leaving its sticky view)
   lags the text by at least a frame and steps at half its rate. Chrome on a desktop hides it (Lenis drives the wheel
   from the same ticker); every earlier "phone" check was Chrome with a phone viewport and programmatic scrolls.
5. **Every iOS bar resize re-measures the page, twice (likely, cost unknown on the phone).** On iOS 26 `innerHeight`
   changes as the floating bar collapses and expands (stevenocchipinti liquid-glass-spike). `fx-stage.js:1900` runs
   measure() on every `resize` event, undebounced, and `fx-stage.js:1932` again 200 ms later (FX onResize,
   `fx-core.js:468-479`); ScrollTrigger ignores those (`fx-core.js:622`), the host does not. Each measure flattens every
   sticky box with style writes and reads ~100 boxes (6.7 ms in desktop Chrome: «measured 101 boxes (8 sticky)»),
   resets the glass's type raster (`fx-stage.js:453`: rastered again now, +0.45 s, +1.3 s while plates show) and calls
   stage.resize. A long task mid-fling = dropped frames.
6. **The stage's height and the canvas's box may differ on iOS (possible, needs the device).** The stage projects into
   `documentElement.clientWidth/clientHeight` (`fx-stage.js:399, 454`); the canvas is `position:fixed; width:100%;
   height:100%` (`fx-stage.js:1317`); the layout uses svh (`css/scene.css`). If iOS gives the fixed box the visible area
   (bar collapsed) while clientHeight stays the small viewport, the picture is stretched by box/clientHeight and every
   figure and keep-out slides off its text by that factor x its height on screen. Alberto's screenshot already shows a
   shorter view than Chrome's 852 (the hero foot starts at ~424 of 852 pt against 521). Measure it on the phone.
7. **Soft plates on a DPR-3 phone (confirmed, a look issue).** `stage.js:1281-1290`: backing = min(dpr, 1.5) x 0.85
   (tier B) = 1.275 px per css px: 501x1086 for 393x852, upscaled 2.35x by the compositor (desktop 1440 DPR 2: 1.5,
   0.75 per device px). The plate's capture and etched words are visibly soft in his screenshot.
8. **Tier B on an iPhone (confirmed).** `stage/tier.js:20-27` with `fx-stage.js:1276`: touch (pointer coarse) -> B;
   Safari has no `navigator.deviceMemory`, so never C. B: 80,000 points, DPR 0.85, plates without dispersion, chips x0.5,
   cosmos galaxies x0.5 / stars x0.7, bloom div 4 / 4 levels, budget 6 ms. No tier changes the alpha: `?tier=A|C` must
   leave the iPhone's picture as it is.
9. **Known iOS 26 WebGPU canvas bug (possible).** WebKit 301627 (dup of 302711): on iOS 26 a WebGPU canvas flickers and
   disappears some frames; fixed in iOS 26.4. His iOS version matters.
10. **Pass A lost (unlikely).** If WebKit lost what pass A renders into the ink texture before pass B reads it, plates
   would show and the light behind them would not. Render-to-texture then sample is basic WebGPU; Consulting decides it
   (its frames take the one-pass path: `platesOn: false`, `.shots/j-device/consult/`).

Device asks (read, no surprise): only `timestamp-query` (if offered, `stage/gpu.js:97-102`); no raised limit; canvas
format = preferred (bgra8unorm on Apple) or rgba16float; ink texture = the canvas format; bloom levels rgba16float;
images and atlas rgba8unorm; no float32 format, no filterable-float32, no dual-source, no subgroups, no f16.

## Probes (headless Chrome 22 Nov, live site, files byte-identical to HEAD by md5)

`.shots/j-device/_scripts/probe.mjs <page> <tag> [query] [waitMs]` (and `probe2.mjs`: J_EVAL runs a line first).
393x852 DPR 3, isMobile, hasTouch, ?debug=1&sound=0. Each folder: `A-chrome.png` (Chrome's composite),
`B-canvas.png` (the canvas's own pixels, un-premultiplied by the PNG encoder), `C1-filter.png` (canvas with
`filter: saturate(1.01)`), `C2-emulated.png` (B over the page without the canvas), `sheet.png` (A | C1 | C2),
`state.json` (host info, stats, sizes, log lines). Results:
- `home/`: tier B, 8-bit (`why: screen`), swarm 80,000 ready at 1.07 s, field on (900 chips, 60,280 galaxies, 3,920
  stars), glass at 1.67 s, no GPU error; alpha 0 on 97.1 % of the canvas; C1 = C2 = Alberto's screenshot.
- `home-hdr1/`: `?hdr=1`: on, rgba16float, forced; same picture, same alpha count (528,276): our HDR path draws.
- `home-nightalpha/`: `__stageHost.stage.look({ nightAlpha: 1 })`: the swarm's light carries alpha and the name
  survives both emulations (flat cobalt instead of white heat: the blend is then "over", no longer an addition).
- `contact/`: the four strokes are ink with alpha: they survive the emulation. Reference for Alberto's Contact test.
- `consult/` (1.6 screens down): one-pass frame (`platesOn: false`, the splat pass on); the cosmos vanishes in the
  emulation, only the splat's blurred solid part stays.
- `work/`, `home-junction/` (Now into Work): plates in a void once the light is gone.
- `cmp-alberto.png`: iPhone screenshot | emulation C1 | Chrome, the home's first screen.

## Tests on his phone (no deploy), fewest first

1. `https://albertotuveri.sersan.io/?hdr=0` (the 8-bit canvas): the name of light and the cosmos's dots appear ->
   only the HDR canvas loses the light (finding 2: keep the 8-bit canvas on WebKit). Same as today -> go on.
2. `https://albertotuveri.sersan.io/contact.html`: two pairs of thin cobalt strokes cross the screen (above WRITE TO
   ME. and under the links, as `.shots/j-device/contact/C1-filter.png`) -> the swarm runs; only the night's alpha-0
   light is lost (finding 1 confirmed). No strokes -> the swarm itself does not run (finding 3's residue): the
   diagnostic below is needed.
3. `https://albertotuveri.sersan.io/consulting.html`, scrolled to under «AI CONTENT GENERATION»: thin blue lines and
   dots behind the text (the cosmos) -> the light survives a frame without plates (finding 10). Only a blurred blue
   smudge -> finding 1.
4. Settings > General > About: the iOS version (26.4 fixed WebKit 301627) and the model (a Pro scrolls at 120 Hz
   while Safari draws the canvas at about 60). The screenshot is 1179x2556: 14 Pro, 15, 15 Pro or 16.
5. `https://albertotuveri.sersan.io/?fx=scroll,nav,stage` (the stage without the 2D titles' motion) against
   `https://albertotuveri.sersan.io/?fx=scroll,nav,motion` (the titles without the stage): which of the two keeps the
   crooked movement «dietro le scritte» says whether it is the canvas's plates or the 2D layer (the WALK lane's).
6. Optional, only if test 2 shows no strokes: `https://webgpureport.org` on the iPhone (adapter, features, limits,
   preferred format). It cannot test compositing, so it does not decide finding 1. Optional on-device proof of
   finding 1 without a deploy: a Safari bookmark whose address is
   `javascript:__stageHost.stage.look({nightAlpha:1})`, tapped on `https://albertotuveri.sersan.io/?debug=1`: the name
   comes back, flatter, if finding 1 holds.

## Design (not built): `?diag=1`, a plain-text report on the page

One switch, only through the director with Alberto's OK. Without it: one regex test in the head and one in the host,
nothing fetched. With it: a ~250-line module fetched after the first frame, a text refresh every 500 ms, passive
counters, one rAF counter, a second small GPUDevice for the swatches. It never changes the stage.

- **Head (`parts/head.html`, before the first paint):** `window.__rvDiag = { t0, err: [], rej: [], gpu: [], lines: [],
  n: { resize, vvResize, vvScroll, scroll, measure, raf }, sizes: [] }`; listeners `error` (message, file:line),
  `unhandledrejection`, `resize` (count; push {t, innerHeight, clientHeight, visualViewport.height} last 20),
  `visualViewport` resize/scroll, `scroll` (count). Hook `window.__rvGpu.p.then(...)`: adapter.info (vendor,
  architecture, device, description, isFallbackAdapter), features, every limit (for..in on GPUSupportedLimits).
  Append `diag.js` to the deferred list `JS` when the switch is on. Add `diag` to `KEEP` in `fx-core.js:84` so the
  switch survives a flight.
- **Boot (`stage/boot.js`, no change):** the module reads `window.__rvStage.p` again (a promise takes many thens):
  device.features and device.limits (obtained), `kit.format`, `kit.hdr`, `kit.hdrWhy`, and `.then/.catch` on
  `kit.sim`, `kit.draw`, `kit.plates`, `kit.bloom`, `kit.field` (ms and the error text: pipeError already carries the
  WGSL messages); its own `uncapturederror` listener on the device (no preventDefault) and `device.lost`.
- **Host (`fx-stage.js`):** `const DIAG = window.__rvDiag || null;` and `log = (m) => { if (DEBUG) console.log(m); if
  (DIAG) DIAG.lines.push([t, m]); }` (the stage gets the same log through createStage: swarm ready/failed, glass,
  bloom off, field off with its message, pass off, halvings, «[stage] off: <why>» with the GPU error); in measure()
  `if (DIAG) { DIAG.n.measure++; DIAG.lastMeasure = { cw, ch, ms } }`; set `window.__stageHost` when DIAG as when DEBUG.
- **The panel (`diag.js`):** a fixed `<pre>` at the bottom (15 px monospace, max 55svh, scrollable, z-index above the
  stage), buttons «Copy» (the whole report to the clipboard, to paste to the director), «Reset counters», «Hide».
  Sections: UA; dpr, dynamic-range high, color-gamut p3, pointer; adapter; device features/limits; canvas (format,
  alphaMode, colorSpace, `getConfiguration().toneMapping` of the stage's own canvas, backing size vs its rect); tier,
  drawn, halvings, restores, gpuMs, timestamps, frames, submits; swarm/glass/bloom/field/passes ready or failed and
  why; errors (window, rejections, uncaptured GPU, scope errors from the off() line, device lost); view (innerWidth/
  Height, clientWidth/Height, visualViewport w/h/offsetTop/scale, 100svh/100lvh/100dvh/100vh in px from probe divs,
  the canvas's rect height); counters since the last reset: resize events, visualViewport resizes, scrolls, measures
  (with the last ms and cw/ch), rAF per second and the longest gap in the last 5 s.
- **THE SWATCH TEST (the answer to finding 1 and 2 by eye):** four 48x48 WebGPU canvases on the night ground,
  premultiplied, cleared once: «8-bit a=0» (0.6, 0.6, 0.6, 0), «8-bit a=.6» (0.6, 0.6, 0.6, 0.6), «HDR a=0» and «HDR
  a=.6» (rgba16float, toneMapping extended). Alberto says which squares he sees grey: both a=0 gone -> both canvases
  lose alpha-0 colour; only «HDR a=0» gone -> only the HDR canvas.

## Fix hypotheses (not implemented)

- **F1 (finding 1):** keep the canvas valid premultiplied: draw the frame into an offscreen texture as today (light at
  alpha 0, added) and copy it to the canvas in a last full-screen pass that writes alpha = max(a, r, g, b), clamped to
  1 (the plates path already blits pass A: `plates.wgsl.js:96`; the bloom would read the offscreen). Over the night
  ground the result differs from today's addition by the ground x the light's brightest channel (a few 8-bit steps);
  the brightest cores clip to white either way. Cost: one pass of 0.54 MP on the phone. `nightAlpha: 1` alone is a test,
  not the fix (it turns the addition into "over": the name goes flat).
- **F1a (if `?hdr=0` brings the light back):** canvasSetup keeps the 8-bit canvas on WebKit until a real HDR device
  passes the swatch test (`stage/gpu.js:70-90`).
- **F2 (findings 5, 6):** re-measure on a resize only when the width or clientHeight changed (as ScrollTrigger's
  ignoreMobileResize), keep the type raster unless the layout moved; size the stage by the canvas's own box after the
  diagnostic's numbers.
- **F3 (finding 4):** the judder is structural on a touch screen (native scroll, a fixed canvas, rAF at 60): measure on
  the phone first (the diagnostic's rAF rate), then weigh sticky-anchored drawing against the scroll's own clock.
- **F4 (finding 7):** a higher backing cap on small DPR-3 screens (e.g. min(dpr, 2) x 0.85 = 1.7: +78 % pixels).

## Sources (fetched 22 Nov 2026)

WebKit 278926, 279373 (+ PR 36089: canvas layer `isOpaque` by alphaMode), 272702, 279816, 281015 (search), 301627,
299237, 272226; gpuweb PR 4526; Safari 26.0 release notes (developer.apple.com); Apple Developer Forums 800798
(iOS 26 clips position:fixed at the floating controls); stevenocchipinti.github.io/liquid-glass-spike.
