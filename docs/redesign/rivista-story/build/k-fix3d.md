# k-fix3d — FIX3D (the stage's defects), wave 8

- Done: the five items of the brief and five more defects (below), each looked at; both builds pass every gate;
  GPU twice against HEAD, the first frame 7 times, sleep. Two runs: the first was cut during the proof (21-22 Nov,
  01:00-01:45), the second (22 Nov, 06:30-07:45) found that the cut run's door fixes made the plate shader 0.45 ms
  dearer on every page and moved them out of the shader.
- Next: nothing of the brief. The director: "Needs elsewhere" at the end.
- Decisions: below, per item.
- How to run: `python scripts/serve-static.py 5404 .shots/k-fix3d/dist .shots/k-fix3d/headroot public` (mine at
  /proto/rivista/, stage and scripts live from public/; HEAD 551f252's Astro build at /head/proto/rivista/, built from
  `git archive 551f252 web public` in `.shots/k-fix3d/headtree`). The live site answers 404 DEPLOYMENT_NOT_FOUND since
  21 Nov 20:06 (still at 07:00 on 22 Nov): every HEAD number here is HEAD's own build, served beside mine, same minutes.
- How to look: `.shots/k-fix3d/_scripts/` — strip.mjs (flights, `--ms=16`, `--head`), pass.mjs (GPU per pass at rest),
  gpu.sh + gpuhome.mjs + gpufly.mjs (GPU rounds), fp.mjs (first frame), cap.mjs (a case opener's caption), listfig.mjs,
  gstep.mjs (phone gallery), depth.mjs, fail.mjs (?failfield/bloom/splat), prof.mjs (a flight's long frames).

## The items

1. **About's path on the phone** (page and home): `stage/scenes/path.js` — on a phone the line begins 0.2 of its
   length past the pane in step (was 0.06), its discs fade from 3 css px of blur (camera bokeh 5, the stage's 12), the
   whole line dims on a spring while its first two nodes come within 72 css px of a text block (`st.lh`), the scroll's
   wind on the line 0.02 (was 0.25). Strips `strip/ph-path-g`, `ph-path-home`, against HEAD's `ph-path-head`: HEAD's
   blurred sails over "University of Trento" are gone (1:1 `ph-path-g-4.jpg`). GPU phone path: rest 0.47 against HEAD
   0.56-0.58, peak 0.94-0.96 against 1.27-1.29.
2. **The door's seams**: the bright full-height bars (400-500 ms into a flight) were the door's ARRISES (edge light 1:
   strength 1.65) with its seams. `stage/stage.js` doorSlab sets the door's `edge` per frame from its face's height on
   screen (tallK = smoothstep(0.85, 1.35, 1.2 D / df); edge = max(0.001, 1 - tallK)); `stage/plates/plates.js` packs
   the edge in thousandths; `plates.wgsl.js` edgeOf reads thousandths and edgeLine(ek) = 0.55 min(100 ek, 1) + 1.1 ek
   (identical from 0.01 up, fading to nothing below); the seams keep their outside level inside the block (0.3, was
   1.0). Strip `strip/w2a-16f` (16 ms): faint grey edges, no bar (`seams-final.jpg`; HEAD `w2a-16h`, pair
   `seams-pair.jpg`).
3. **Toward Contact**: `fx-stage.js` `dayRose` (the title rises with the day's first frame); `stage.js` passes `dayY`
   (the top of a dawn rect across the frame down to its foot) and `plates.js` cuts a door whose room is the morning
   (not s.night) at it and no longer counts it as covering the frame. Strip `strip/a2c-e`: the edge rises from 550 ms,
   "WRI" at 650, "WRITE T" at 700; no blank page. The card goes with the day's first frame (fx-nav cancels it at settle).
4. **Contact -> home**: the cut run sliced the atlas's distance transforms (`field/atlas.js`, 4 ms MessageChannel
   slices, same bytes) and the cover name's contour (`cover/world.js`, a generator). Run 2 found the swap itself (the
   home is the longest page): one frame of 49-70 ms at ~215 ms on both builds. `web/src/router/rv-router.js`
   astro:after-swap: on a flight the page's scripts start a frame after the swap (O.raf -> O.st 0). Three flights at DPR
   1: rAF gaps over 34 none / none / none (HEAD 63, 49 + 35, 56); presented-frame max 27 / 28 / 28 (HEAD 35 / 35 / 42);
   the room seen 30 ms sooner (fx:stage:frame 481 against 510, arrived 985 / 1014). Work -> About and About -> Contact:
   no gap over 34 either. Strip `strip/c2h-m1` looked at.
5. **The home's first frame**: `stage.js` bloomKit and `field.js` fieldKit read their error scopes beside the pipelines;
   `hero.js` the name's sets in slices on a cold load too, after a frame; `fx-stage.js` the cold build registers only
   the first screen's scenes (`FIRST`), waits for their `prepare` with the field (cap 0.5 s), starts at fx:ready when
   nothing moves (`whenReady` quiet path); `boot.js` prefetches `tier.js`. Seven rounds alternated (fp.mjs --cache, CPU
   13 % -> 3 %): median **364 ms against HEAD's 385** (lane 338-392 without two cold-fetch rounds of 405 and 695).
6. **More, found on the way**:
   - `case/figures.js` the `list` figure etched each item's number ("01" .. "06") on its thin plates: a rectangle with
     a number (CLAUDE.md §1). Clear glass now, the read layer still lifts and lights (`list-mine.jpg`, HEAD
     `list-head.jpg` with "03").
   - `fx-stage.js` the measure knew only boxes held by their TOP: a case opener's step-2 caption is held by its bottom
     (`case.css` `.cs-look .sc-in`, HEAD too), so its keep-out stood a screen below and the cosmos's filaments crossed the
     caption at rest (FIX2D's crop). A Stick may carry B / cbT / mt / vh; `at()` resolves it. `cap-mine2-crop.png`
     (1440 IT Maintech) clear, `cap-head-crop.png` crossed; `cap-ph.jpg` (phone) clear. Debug only:
     `__stageHost.last.keepRects`.
   - The plate shader's register cliff (run 2): every new value carried through shadeAt (once per colour channel) or
     to the end of fsPlate cost every plate of every page 0.45 ms — Work at rest 2.20 ms against HEAD's 1.67 with the
     cut run's door code (canvas pass 1.48 against 1.03); a comment or a changed constant cost nothing (variants A, E,
     H, K, S, T, Z kept in `.shots/k-fix3d/plates.wgsl.var*.js`). Both door fixes now live on the CPU (items 2, 3).
     After: canvas pass 1.027 against HEAD 1.046.
   - Checked, not changed: the phone gallery's plate in step stands in the frame under its text (`gph-home-sheet.jpg`:
     SMOOTH's band fixed it); Work reached by a flight from the home's hero keeps the hall's depth range (INTEGRATE's
     F4) but the still at +6 s is the same as Work loaded and it costs less (1.7 against 2.1 ms); the name's points
     streaming in from ~1000 to ~1450 ms after Contact -> home are the same on HEAD (the arrival's design).
   - Not done (optional, FIX2D's suggestion): a figure beside the Supply Chain's list rows on a wide screen.

## Proof (22 Nov)

- Gates at 07:35: assemble 0 (169 strings), --check 0, claims OK 34 pages; Astro into `.shots/k-fix3d/dist` 0, PARITY
  OK (145 shared, 0 differ), asserts ok (34 pages, 1156 refs), claims on the build OK.
- GPU, two rounds on the final tree (`gpu-r2.log`, `gpu-r3.log`; CPU 1-31 %), lane / HEAD, rest (median) and peak:
  home hero 0.80 / 0.80-0.83, 1.27-1.29 / 1.29 (one HEAD frame 1.87); Now 1.45-1.47 / 1.45-1.47, 2.38-2.40 /
  2.41-2.45; gallery 1.70 / 1.70-1.71, 2.12 / 2.28-2.29; case opener 1.80-1.84 / 1.80-1.84, 2.28-2.32 / 2.26-2.29;
  phone About stack 0.37-0.38 / 0.38-0.41, 0.47 / 0.47-0.54; phone path 0.47 / 0.56-0.58, 0.94-0.96 / 1.27-1.29;
  1920 Now 0.77-1.18 / 0.78-1.22, peaks 2.15 / 2.25 / 2.15 against HEAD 2.76 / 2.76 / 2.93 (one lane frame of 7.28 in
  round 2, p95 2.18, not seen again in three more runs); 1920 gallery 1.35-1.36 / 1.55-1.58, 1.75-1.77 / 2.03-2.04.
  Flights (final shader, `gpufly`): Work -> About out 2.51 / 2.56, in 2.19 / 2.12; About -> Contact out 1.47 / 1.50, in
  1.27 / 1.45; Contact -> home out 0.98-1.02 / 0.99, in 2.05-2.11 / 2.06-2.09. The swarm never halved (160 000; phone
  80 000). Work at rest before a flight 1.72-1.75 / 1.66-1.68 (SMOOTH's gallery, its own stillWrong; the canvas pass
  is equal).
- Sleep: 0 frames in 3 s after 19 s quiet (home 1440, About phone, Maintech case 1440).
- ?failfield=1, ?failbloom=1, ?failsplat=1: the stage on, lit, drawing, console clean.

## Needs elsewhere

- Docs lane: CLAUDE.md / DESIGN.md — the list figure carries no number; the door's lines fade as it fills the frame
  (edge in thousandths, `edgeLine`); toward Contact the door stops at the edge of day (`dayY`); the router starts a
  flown page's scripts a frame after the swap; the plate shader's register cliff as a rule for later lanes (no new
  value through shadeAt: pack it on the CPU); the measure reads bottom-sticky boxes; `__stageHost.last.keepRects`.
- ORRERY / the director: `stage/field/atlas.js` builds its cells in 4 ms slices (`cellBytesGen`, `sliced`); a new mark
  there should go through the same path.
- The director: the live site answers 404 DEPLOYMENT_NOT_FOUND on every address (since 21 Nov 20:06).

## Log

- Run 2: server 5404 pid 15040, stopped before returning.
