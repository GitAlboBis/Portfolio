# HOST+DAY lane notes

- Lane: HOST+DAY (port 5183). Owns fx-stage.js, stage/day/**, the device accessor in fx-water.js.
- Plan: 1) device accessor in fx-water.js; 2) fx-stage.js host; 3) day formations; 4) look at 1440 and 390.
- **State (run 3, done):** built, looked at 1440 and 390 (EN, plus IT at 1440), controls run, server on 5183 stopped.
- How to run and look: `python scripts/serve-static.py 5183 public`, then the scratch capture script
  `<scratchpad>/cap.mjs <tag> <w> <h> <dpr> <query|-> name=y|name=@sel:frac|name=@night:frac|name=@nightEnd:frac ...`
  (outside the repo). It routes the home and appends `'fx-stage.js'` to the head's module list (the PAGE lane's
  assemble.mjs leaves it out of the built pages while the file was missing), glides to each position in quarter
  viewport steps like a reader, waits, captures to `.shots/host/<tag>/`. env: WAIT, RM=1, NOGPU=1, PAGE=it/index.html,
  RESIZE=w,h, JUMP=1. `?debug=1` exposes `window.__stageHost` (info(), last formations / night / keep-outs).

## For the director (integration)

- **Run `node public/proto/rivista/assemble.mjs`**: fx-stage.js now exists, so every built page goes stale (the head's
  module list gains it). Only the PAGE lane / director runs assemble; this lane did not.
- Strings used: `stage.points` and `instr.gpu` (both exist; IT prints "160.000 punti · 0,2 ms GPU").

## What is built

- `fx-water.js`: one getter `api.device` (null until linked / after a failure / while a lost device is re-requested).
  The signal is the existing `fx:gl:linked` (first link and every re-link after a loss) + `device.lost`. Nothing else.
- `fx-stage.js`: gates (home, motion, gl, not gl-off, WebGPU, no ?stage=0), start after fx:ready + whenStill + the
  water's device, fixed canvas (z var(--z-stage), pointer-events none, aria-hidden), defensive imports of the 13
  formation modules, the one-ticker tick (scroll + velocity, weights, rects, sectionProgress, scene, night band,
  keep-outs, pointer), sticky-aware document rects measured on build / resize / ST refresh / body resize, inputs open
  the 5 s window, instrument line, html.stage-on, error scopes on every GPU call, device loss -> rebuild on the new
  device, pause under nav covers / the menu, pagehide.
- `stage/day/`: `page.js` (what the host knows beyond the contract) + rest, plume, ring, current, letter, mist, fall, dawn.

## Decisions

- Every day formation has `share: 1` and its density set by `fill`: the active formations tile the population, so a
  change of section is a migration. `emit: -1` everywhere: arriving particles fly in from where they were.
- Section weights: 40 viewport rows (centre-weighted); a row belongs to the LAST section (DOM order) covering it,
  because later sheets lie over earlier ones (Now over the hero, night over the held About, band over the held Obla).
- **The passage runs in order mist -> fall -> gen.** mist's weight is cut by 0.88 x fall's, and the Consulting
  figures ramp in only once the night's top edge has risen from 0.62 to 0.2 of the viewport. The rank parity puts
  mist and gen on the same end of the population, so without this gen pulled its particles straight out of the mist
  window above and they rained across the day's text as ink. Now the margins gather on the edge, pour as light,
  and the figure takes its particles from the fall, through the night, as light.
- Sticky boxes: measured with every sticky ancestor flattened to `position: static !important` for one read, then
  resolved per tick from the scroll alone: `stuck = max(natTop, min(y + top, cbBottom - h - mb))`, outermost first.
- Rects outside the contract's "anchor or section": plume = the viewport; fall and dawn = a box two viewports tall
  centred on the night's top edge / visible foot (local y 0 is the edge); rest = the water A's box (fx-hero's own
  placement); mist = the union of evidence, ledgers, caps, path (and passes where the letter box is display:none).
- The water A is not kept out. Keep-outs: `.frame` holding an image, `.btn`, `[data-rail]`, `.passes-list`,
  `[data-stage-keepout]`.
- Every stage GPU call runs in error scopes: fx-water's `uncapturederror` handler would otherwise turn the WATER off.
- Ink per tier: `page.inkK` = 160k / the tier's count.
- **Tone rule found on the real page:** the stage gives every polyline of a path set the same share of particles,
  whatever its length. So ink per target must follow length (fall's drips: ink x L/Lref; dawn's short drips get
  much less than its long strata), and a narrow screen packs a full-width line closer (fall's pool, current's belts:
  ink x width factor).
- **Light needs energy:** below the edge the same particle adds light; at day ink levels it reads as dim navy. Fall's
  drips and dawn's strata carry ~4x the ink per particle of their day parts.
- mist = a window three viewports tall around the reader, rebuilt every 40 px of scroll, threads as fixed curves of
  document y: all its particles are near the screen (before: 90 % sat off screen down an 8000 px union and the
  margins were invisible), and the ink runs along the threads with the scroll.
- ring = hand-built shallow ellipse (long axis along the frame's TL-BR diagonal, 1.76 x half side; minor 0.42;
  depth +-0.34): the arcs past the corners are sharp ink. A true steep tilted circle put the visible arcs at +-285 px
  depth: blurred brush strokes.
- Long migrations: `speed` ~1000 px/s on the day formations (the spring caps near the target; vmax only bites far).
- Phone: plume runs at 5 px from the screen edge and sweeps above the A's caption; fall has 8 + 8 margin drips,
  10 short ones over the column, the rest held back with no ink, and 0.6 of the desktop ink.

## Look log (captures in .shots/host/)

- r3a: everything too faint; ring a blurred arc over the lead; mist invisible; light drips dim navy.
- r3b: drips readable as light; letter vanished (particles in flight: jump captures), ring = blurred strokes.
- r3c: ring sharp; captures glide; mist still invisible (window fix next); rain of ink above the edge.
- r3d/r3e: letter back (cobalt A, edges), mist threads in margins, passage ordered: clean day above the edge.
- p3a..p3d (390): plume hugs the edge, phone drips thinned (p3b had white saturated bars), dawn rebalanced.
- final/: last 1440 pass. ctl-s0, ctl-rm, ctl-nogpu: controls. it3: Italian + resize.

## Open

- A jump across the page (a nav link) sends particles on trips of thousands of px: seconds of streaks. Gliding
  readers do not see it; captures that jump do.
- Pointer stir and the letter's drag-spin are not judged (captures are frozen frames): look live in the browser pane.
- At 1440 Fig. 02 touches the right edge, so the ring shows its TL arc and only part of its BR arc.
- The mist's free strands (formation mistInk 0.012) make a faint, wide, grey-blue arc over the right of the text in
  the mist chapters: mist-level, but the director may want it lower.
- dawn's strata of light are subtle (a dim horizon); the drips into the band read clearly as ink and fade with it.
- Headless only: the additive light on the premultiplied canvas was not seen on a headed compositor.
