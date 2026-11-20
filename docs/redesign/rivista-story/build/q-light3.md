# q-light3 — lane LIGHT3 (port 5310)

- Task: 1 the X goes (parallel shafts) · 2 plates cut glass (thin rim) · 3 Obla no sun · 5 cover lit after a cut · 4 gen clean · 6 phone path · 7 splat bench.
- Base: HEAD cc90cf3, tree clean at start. Captures in .shots/q-light3/ (x1 shafts, x2 plates, x3/x4 obla+consult, x5 gen).
- My server: python pid 30112 on 5310 (kill before return).

## Done so far
1. room.js: both blades lean the same way (from the upper right, as the cover's shaft); the main one swings to and fro
   on the stage's clock inside the sweep (never leaves the frame, env 1); the second (0.62 radius, 0.55 strength, 0.6
   haze) keeps a fixed distance (>= half the frame) on the seed's side and fades as it leaves the sweep. Seed sets
   phase, side, slant. Looked: x1 sheet, no X on work/about/consult/obla/case.
2. plates.wgsl.js: with s.edge > 0 (gallery + case only) the side faces go dark (x0.24) and the light is a thin line
   on the arris (~2 css px), brighter toward the upper-right corner, a faint spectral split (35 %). gallery/case
   bevels 11/12 -> 4.5 (words), 3.5 (captures). Looked: crop2-w2/w3/c.
3. night/obla.js: idle and approval have no rays (points hidden behind the body); listening = 7 short strokes of
   different lengths above/beside, pulsing in turn; thinking = three small squares above the head lit in turn.
4. night/gen.js: made picture = even rows (path 2) over the mark's cells, three flat tones, holes filled; plate points
   sorted in reading order. Mottle much reduced; a fine weave remains at 1:1.
5. hero.js: litSignal: true, lit once at >= 1.45; a cover reached by a cut starts its opening at 2.0 s (name lit, hall
   full, eye on its last 0.6 s while the sheet leaves). Cold strip before/after: same opening (strip/cold-pair.jpg);
   cut strip: name lit at 1000 ms instead of igniting 1000-2600 (strip/cut-before, cut-after). The 2D foot still rises
   on its own timer (~2.4 s after the click): the 2D layer's, not mine.
6. path.js: on a phone only the pane in step (deeper panes fade 0.3..0.75 nodes ahead): no ghost numerals, no stacked
   dates at the head (m6 before, m6b after).
7. dev.html splat: default only A + mark (relief=1, capture=1 to add), scatter spread 0.8, pointAlpha 0.2, stagger 3,
   room glow 1; POINTS_SHARE 0.16 -> 0.07 (splat.wgsl.js); relief marked NOT FIT FOR A PAGE in splat/gen.js.
- Band check (120 css px medians): cover's shaft core ~0.15, pages' shafts 0.16-0.20.
## Gates (all run, servers 5310/5311 stopped)
- assemble --check exit 0; check-claims-proto OK (nothing the build reads was touched).
- Stills: fd/ (8 pages, 1440 DPR 2) and fm/ (6 pages, phone), sheets fd-sheet.png, fm-sheet.png: no X, no V, no
  crossed shafts on any step. Console clean in both logs; inv console en+it 32 pages clean.
- GPU (_scripts/gpu-*.log) peak/median at 1440 DPR 2: all <= 2.98/2.28 except one obla peak 3.74 that did not repeat
  (re-runs 2.21, 2.45); 1920 DPR 1 <= 2.09; phone <= 0.89. No long task. Sleep: 0 frames on 7 pages (+ every gpu run).
- States: inv-states and inv-fail identical to r-integrate's; states2 22 runs clean.
- Text crops (text-sheet.png) clean with the stage on.
- Cover at rest vs HEAD (HEAD exported by git archive to the scratchpad, served on 5311), grabbed by screencast:
  HEAD/HEAD 0.255 mean abs, HEAD/mine 0.158: noise. NOTE: a Playwright page.screenshot() on the cover woke HEAD's stage
  (the hand's orbit then moved, 0.075 rad) but not mine: screenshots of the cover at rest differ by that orbit only.
- Band (120 css px medians): cover's shaft core ~0.15, pages' shafts 0.16-0.20.

## Open
- gen still shows a fine weave at 1:1 inside the made mark (much less than the speckle; reads flat at page size).
- Thinking squares have a dim speckled fill (could be outlines only).
- The cover's foot after a cut still rises on its own timer (~2.4 s after the click): 2D layer.
- Splat bench on the phone frames the figures too large (cut at the top).
- Desktop path keeps the deeper panes' numerals beside the pane in step (only the phone was asked).
