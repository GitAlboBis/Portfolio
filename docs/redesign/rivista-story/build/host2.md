# HOST lane, wave B (spec 30) — notes

- Lane: HOST (port 5189). Owns fx-stage.js, stage/day/**, new helpers under stage/ (stage/gpu.js, stage/tier.js).
- State: run 2. Run 1 was cut after building most of the lane; the director committed it in 91918f1 (without notes).
  Run 2 checked everything on captures, fixed what the captures showed, and recorded it here.
- State: DONE (run 2). Gates: visual-gate default (EN+IT cover, work, about, obla) CLEAN; --reduce (cover, about) CLEAN;
  --nogpu (cover, it/work) CLEAN; ?stage=0 cover printed, console clean. Server 5189 stopped.
- Next: integration pass (page-by-page, cuts between pages).
- Run and look: `python scripts/serve-static.py 5189 public`; one-off capture script outside the repo
  (`<scratchpad>/cap.mjs <tag> <page> <w> <h> <dpr> name=Y|name=@sel:frac[~px,py][!rest] ...`, `?debug=1`, glides like
  a reader, prints `__stageHost` state, captures to `.shots/host2/<tag>/`). `?debug=1` exposes `window.__stageHost`.

## What is built (run 1 + run 2)

- **Own device** (spec 30 §1): `stage/gpu.js` (describeAdapter, adapterOptions, requestAdapter, createDevice) and
  `stage/tier.js` (chooseTier), copied from water/engine and trimmed. fx-stage.js imports nothing from `water/`. The head
  script's early request (`window.__rvGpu`) is used once on a plain cover load; otherwise the request runs in build(),
  which starts only after fx:ready + FX.whenStill (so never under a cut). Fallback adapter = off. A lost device rebuilds
  the stage once; a second loss or "destroyed" leaves the printed page. Teardown destroys the stage's own device.
- **Every page**: on wherever `[data-stage]` exists and the page is not a case (`main[data-case]`) or the 404
  (`html[data-nogl]`). Off under reduced motion, `html.gl-off`, `?gl=0`, `?stage=0`, no WebGPU.
- **Full night page**: `html[data-night-page]` (the PAGES lane writes it on consulting/obla; agreed name). Night from
  above the viewport down to the band's top (`[data-stage="contact"]`), so the band is morning.
- **Run 2: a page builds only what it can show** (`needs()` from the contract attributes): hero -> rest, plume; now ->
  ring; work -> current; consult -> gen/cut/code/agents; obla -> obla; a `[data-night]` block on a day page -> fall; a band
  or night -> dawn; any other section -> mist. Glass: lockup -> drop, rail tiles -> lens, caps/path rows -> beads, band
  box -> pool. (Before, the cover compiled the four Consulting figures and Obla's body for nothing.)
- **Glass figures** (`stage/day/`): `drop.js` (body over the name -> drop in the margin -> flat lens over each row of In
  this issue -> sinks into the dusk strip's edge), `lens.js` (Work rail, current tile or the hovered one, follows the
  hand inside the frame), `beads.js` (registered twice, the two Capabilities/path rows nearest the reading line),
  `pool.js` (the band, beside "Write to me."). `rest.js` = ink orbiting the body. `letter.js` deleted (spec 30 §1).
- **Backdrop**: rasterised outside the tick (task + again at 0.45 s and 1.3 s for type caught mid-reveal), key = the set of
  nodes; measure() (build, resize, ScrollTrigger refresh, body resize, fonts ready / loadingdone) resets it. The rail
  lens rasterises its tile and moves the raster with the track's GSAP x.
- **Camera/light**: key light follows the pointer and bodies turn with the scroll (glass engine); focus pulled to -170
  for 0.52 s at each change of dominant chapter, then lands on the bodies' mean depth.

## Run 2 fixes (from captures)

1. Row lens never engaged (reading line 0.55 vh, tolerance in row heights): now the row nearest the screen's middle
   holds the drop while within 0.2..0.34 vh of it, so the drop steps row to row. The pill now spans the whole word.
2. Display-line rects: a Range over the element returned the block span's full-width box (beads ran to x 1200 over
   blank paper on the path). glyphs() now unions the rects of the text nodes only.
3. Beads sized on the line's font size (`fs`), not its box (two-line path titles grew beads that blotted letters);
   R = 0.3 lh, bulb up to 2.1 r below the neck so it reaches the cap tops.

## Decisions

- No glass on the night pages (spec 30 §3): only the band's pool shows on consulting/obla (it is day there).
- The rail lens is called by hover (`pointerover` matched against measured tiles, no layout read), touch ignored.
- Text blocks are keep-outs by placement: drop rides the margin (x = 0.48 pad), lens pills sit on the display line
  only, beads span the display line's glyphs only, pool sits in the empty band box clear of title and copy.

## Sources (spec 30 §6)

21st.dev `search` "glass lens magnifier following scroll over list rows, droplet refraction": MagnifierLens, Liquid Glass
Cursor (spring-tracked lens morphing circle -> pill on text targets), Lens Card, Liquid Glass (SVG displacement), Fractal
Glass, Liquid Glass Carousel; Magic UI `lens` (CSS zoom). Taken as mechanism: the lens that morphs from a round drop to
a pill over a text target (the row lens) and the damped follow. Refused: DOM/SVG displacement filters and CSS zoom (they
cannot bend the stage's ink and are not lit), the cursor-lens itself (nothing follows the pointer in the DOM; here the
lens rides the rail and only follows the hand inside a hovered frame). No paid call, nothing imported.

## For other lanes / director

- `stage/dev.html` (GLASS lane's file) still imports `../water/engine/gpu.js`: point it at `./gpu.js`
  (`requestAdapter`, `createDevice`) so nothing under stage/ imports water/.
- `stage/stage.js` header line "device: the page's one GPUDevice (the water engine's). The stage never requests an
  adapter." is stale (GLASS/CORE file).
- Dead for a later sweep: `fx-water.js`, `water/**` as far as the site goes.

## Look log (.shots/host2/)

- c1: cover 1440 top (pointer), top-rest, s1 (drop in margin), s2/s3 (no lens: bug 1), dusk, band.
- c3: row lens over WORK and ABOUT (fixed). w1: Work rail lens (current tile; hovered Maintech tile bending its "9").
- a2/a4/a5: beads on Capabilities and the path (bug 2, bug 3, fixed). a6: beads at 390.
- p1: phone cover. n1/n2: consulting/obla (night pages, no glass; pool in the band). k1: contact page.
