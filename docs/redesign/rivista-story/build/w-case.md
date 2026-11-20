# w-case — lane CASE2 (chain 9), port 5243

- Status: DONE (2026-11-11). Gates: assemble ok, --check exit 0, check-claims-proto OK (32 pages).
- Done:
  1. Arrival (case.js): `glassEntry: true`; starts on the first frame `ctx.glass.ready` and the cut's sheet has
     started to leave (no texture wait). Sizes are composed at the pose's own depth (P0) and the arrival's depth really
     shrinks the plate (round 8 divided by the arriving depth, so it never looked far). Visible from frame 1 (alpha
     ramp 0.04 of the arrival), sharp from 0.3; a capture still decoding arrives as clear glass and takes its print with
     a short focus dip. Phone: starts higher (0.5 vh) over the empty top. A reader restored lower: 0.45 s focus pull.
     The glow is drawn at the plate's FINAL place (P0) from the stage's first frame.
  2. Keep-out edge: the glow's reach (REACH 0.74 x its size) is held CLEAR = 44 px off every text block (per block the
     axis that keeps more glow is shortened; squeezed under ~0.3 it thins away). New `case/glow.js` = now.js's even
     low-discrepancy glow WITHOUT the slanted band (its ends ran into the title column).
  3. Etched plates (plates.wgsl.js): the face of a slab with an etch keeps 4 % of the studio reflections (bevels keep
     theirs: `rk`), so no soft-box band / grey card in any pose of the turn; the frost is the brightest thing on the
     plate (warm white + a breath of cobalt + the swarm behind), full only where the etch is full (the stack's faint
     names stay faint). Same in the Work gallery (shared shader). Case etched plate glow 0.8 → 0.85.
  4. Blotchy field: the glow's and the mist's brightness now ride on INK (C.field.ink, a mist wrapper), never on weight
     (the stage gives points by weight: dimming by weight thinned the field into separate discs).
  5. Caption link: figcaption.has-q is a flex row (words box + link box, column-gap s3); a wrapped link starts at the
     left edge. Markup in c-main.case.mjs (span.cs-cap-t), CSS in case.css.
  6. Phone step 2: plate as wide as the screen (vw − 20) standing right on its caption; case.css lifts the caption to
     bottom: 26svh so the pair sits at the optical centre.
  7. Supply Chain: cases.json fig `plateCrop: [0.085, 0.066, 0.915, 0.902]` → `data-slab-crop` on the case's img (after
     data-stage-poster: assemble's regex); case.js crops the decoded picture into a canvas texture "case:crop". The
     gallery keeps the whole picture. Labels gain ~25 %; still too small to read at 1440 (the drawing's own scale).
- GPU (?debug=1 stats, headless tier A): case 1440 2.2–2.7 ms (was 1.45–1.65 with the thinned field), 390 0.8 ms.
  The cost is the glow kept at full weight (40k points); it is what makes it smooth.
- How to look: `.shots/w-case/_scripts/` cap.mjs (--w/--h), strip.mjs (cold|cut, 100 ms x 30), turn.mjs, freeze.mjs
  (needs a temporary `window.__caseArr` hook in case.js, removed).
- Needs elsewhere: none. Note for the director: a clear (non-etched) capture plate shows a grey soft-box sheen for one
  or two frames while its texture is not yet in (s2-sc d-cold frames 5–6); it is soft and far, left as is.
