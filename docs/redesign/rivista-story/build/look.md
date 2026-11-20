# LOOK lane — notes

- Lane: LOOK (port 5191, stopped). Base ac7e83f. Owns stage/glass/**, stage/day/**, stage/night/**, fx-stage.js (look only).
- State: DONE. Gates green (assemble exit 0, --check exit 0, check-claims-proto OK, 32 pages). No commits.
- Another lane edited the same worktree at the same time (fx-core*, fx-nav*, pages, HANDOFF.md; deleted
  scripts/probes/water/, figs/, dev-*.html, fx-gl.js…): not mine, untouched. My one-off harness copies launch().
- Harness (session scratchpad, not in the repo): `cap.mjs <plan.mjs>`: headless Chrome, `?debug=1`, and for the
  sequences Playwright's `page.clock` (rAF and performance.now on a fake clock, one frame = 1/60 s), so every frame
  is reproducible; `sheet.mjs` makes contact sheets. Captures under `.shots/look/`.

## Changes

1. **The cover's body** (`stage/day/drop.js` BODY, `glass.wgsl.js`, `glass.js`). Every volume is now centred on the page
   (z = 0) and cut by it: a dome standing on the paper, a reading stone. Every ray leaves by the foot, so the body is
   one clean plano-convex magnifier with a full round crown (before: a squashed ellipsoid resting on a point, smin
   plateau = the "sliced" top with the key mirrored flat). Outline: a heavy oval and a smaller lobe up to the right,
   waist filled = one pebble of water. Dome height 0.86 R (centre magnification about 1.3, letters bent, still read).
   - Lean is a shear in the shader (`fx2.zw`): the crown goes over, the foot stays (before: blobs slid whole).
   - Key soft box smaller (0.24 x 0.14, softer edge 0.025): reads as a studio box on a curved crown, not a sheet.
   - Thin spectral edge: dispersion grows toward the rim (x (1 + 2.5 (1 - cos i)^2)); clean type in the middle.
   - Shadow and caustic rewritten: one footprint for the whole figure (the body's field sliced near the page, cast
     away from the key by its height), pale inside, darker outline, a seam at the foot, a crescent of light along the
     far edge split per channel (offset scaled to the shadow's width) + a faint spot. Before: per-blob rings and spots
     summed (four caustic spots under the body = milky). Softness follows the body's smaller size (height for a pill).
     Caustic seen through the body at 0.45 (was 1.3). Caustic tint near white (colour is in the split edge).
   - Cover: shadow 0.18, caustic 1.1, reach 0.5, edge band 1.0. Drop: shadow 0.13, caustic 0.25, soft 1.3 (its
     crescent read as a second bead).
2. **Row lens** (drop.js LENS): the pill's volumes are cut by the page too: one smooth rim, no broken outline, no
   chrome streak (seen with the key at rest, up-right and below-left). On a phone the pill stops 8 px from the screen
   edge (fx-stage.js). The drop no longer sinks into the dusk strip while a row holds it (the sink pulled it half off
   ABOUT); a hovered row calls the lens only while near the middle (a hover left by a scroll held it).
3. **Ring around Fig. 02** (`stage/day/ring.js`): a circle of nine threads 1.25 half-sides round the frame's centre,
   tilted 0.36 rad: it shows past the middle of each side (gutter, above, below the caption; the right arc runs off
   the page with the frame). Three arcs of one circle read as a ring; the long diagonal ellipse showed one arc at a
   corner. Shallow tilt and a gentler flow with the scroll (shift sp x 300): at 0.5 rad / x 720 it smeared to haze.
4. **Glass keeps a clear margin from copy** (fx-stage.js): drop radius <= (pad - 6 - 1.5) / 2, centre <= pad - 6 - r
   (phone: a 6 px bead, 6.5 px from the copy); it goes down the margin only once it is in it (a flick never drags it
   over the statement).
5. **Rail lens**: its raster now holds its tile and both neighbours (a hovered neighbour is never crossed blank), and
   `backdrop.js` draws images from their own pixels: `naturalWidth` is density-corrected under a srcset (a 1600 px
   file in an 864 px slot reports 864) and `drawImage` reads file pixels, so the lens showed the top-left of the
   capture blown up (giant white "rke" / "sa" letters); object-position is respected too. Lens volumes cut by the page.
6. **Rest ink on a phone** (`rest.js`): flow, ink and mist follow the body's size: the orbit was a blue haze round the
   small phone body.

## Motion judged (sequences, `.shots/look/seq/s1/`, `rail/w3`, `ring/g2`, `rows/r3`)

- Lean and spring back (`seq/s1/lean-sheet.png`): no snap; the key swing moves the shadow smoothly (0.35 s damping).
- Ripple (`ripple-sheet.png`): one ring out, damped, no tearing of the outline.
- Leave and the drop travelling down (`slow-sheet.png`, `leave-sheet.png`, phone `phone-sheet.png`): continuous.
- Rail lens hover (`rail/w3-sheet.png`): comes from the current tile across the gap, follows the hand, returns.
- Focus pull: seen only as a softening of the page's ink at a chapter change; nothing to fix seen.

## Night figures (`.shots/look/night/n1/`: cd, cm, od, om sheets)

Consulting gen / cut / code / agents and Obla's five states read at both sizes. Weak and NOT fixed: Obla "It asks"
at 1440: after about 1.5 s still, vertical streaks build in the card and across the face (`night/ask-sheet2.png`, same
without pointer input). Particles are stretched along screen velocity by the draw shader's shutter, so something
in that state keeps moving vertically (not tails: share is 0). Not found in the budget.

## Final captures (`.shots/look/final/`)

cover-rest/-motion/-third, contents, work-rail, about, consulting, obla; each at 1440 and 390. Sheets:
`.shots/look/final-d.png`, `final-m.png`.

## GPU (timestamp queries, `stats().gpuMs`, moving)

1440 tier A: cover 0.93 ms (sim 0.14, ink 0.40, canvas 0.29), contents 0.55, work 0.39, about 0.46, consulting
(agents) 0.80, obla 0.34. 390 DPR 2 tier B: cover 0.31, contents 0.29, work 0.14, about 0.25, consulting 0.36,
obla 0.15. Before: cover 1.02 ms (the body costs about the same; the shadow now evaluates the field twice per pixel).

## Open

- Obla "It asks" streaks (above).
- A soft vertical ink line runs down the left margin on About and on the phone cover below the hero (mist /
  plume): seen in `final/about-1440.png`, `final-m.png`; not a glass figure, not chased.
- The phone bead (6 px) is small: it reads as a bead, barely as glass.
- Dead debug: `gl=debug` branch in glass.wgsl.js stays (one uniform branch).
- I stopped one headless Chrome (pid 17192) after killing my own duplicate capture run: it should have been that
  run's browser; if another lane lost a probe browser at that moment, that was it.
