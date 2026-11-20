# q-film — the third wave's film and final set (port 5311)

- Task: gates, a look at every scene step (1440 DPR 2 and phone), the final set in .shots/q-final/, the numbers, a verdict.
- Changes no site file (only on a trivial gate failure).
- Status: DONE 2026-11-12. Servers 9620/24292 stopped; no browser left.
- Servers: python pid 9620 on 5311 (tree), pid 24292 on 5312 (HEAD export in scratchpad head-qfilm). Kill before return.
- Gates: assemble --check 0; claims OK; node --check on 12 changed js clean.
- Console: en 16 + it 16 pages clean (inv console). Steps d/m: no CONSOLE lines.
- Stills: .shots/q-film/steps-d (76), steps-m; sheets q-final/pages.png, pages-phone.png; gallery.png (3x3 full size).
## Look (ranked, as Alberto)
1. Gen (Consulting s1): the made S still has a knitted, grainy texture inside, not flat glass; at page size reads "noisy".
2. Plates (gallery/case): a thin bright arris + a pale side strip on the right; much better than the aluminium band, but
   on the bright captures (SerSan.io, Domus) the four-sided pale rim still hints a frame. Not a metal band any more.
3. Obla listening: 7 strokes in an arc above/beside the head still read as half a sun's rays / a "surprise" doodle.
4. Phone dawn (Contact, every closing): the ink threads cross at a shallow angle, a flat blue X above and below
   "WRITE TO ME."; on the phone's cover closing they also cross over the night strip above the dawn edge. Desktop near-parallel.
5. Shafts: one diagonal band per page, parallel; no X, no V on any desktop/phone step. Slightly brighter than the cover's.
- Nothing over text on any still; no water, no discs, no round spots.
6. Phone path, mid-scroll (site-phone film ~15 s): the incoming pane's numerals (NOV 2025) slide down onto the DOM
   dates line "NOV 2025 - FEB 2026" for a moment; at rest they are clear. Also a small soft blue comet head of the line.
7. Cut to the cover: ~0.25 s of empty night between the sign leaving and the lit hall (1.05-1.25 s); name lit at 1.3 s,
   foot at ~2.4 s (2D timer). Reads as a breath, not a fault.
## Numbers (tree vs HEAD on 5312)
- First frame ms, median (d 1440 DPR2 / m phone): cover 365 vs 352 / 334 vs 338 (n=7); Work 333 vs 319 / 292 vs 288;
  About 306 vs 308 (n=5) / 282 vs 276; cut Work>case 223 vs 226 / 207 vs 203. Equal within noise.
- Long tasks >50 ms after first frame: About d first run 51,54 (HEAD 53 too); n=5 rerun none. Elsewhere none.
- GPU peak/median, 1440 DPR2: hero 1.51/1.12, now 1.68/1.04, index 3.12/2.18, gallery 2.41/1.44, evidence 1.50/1.13,
  stack 2.24/1.86, path 2.12/1.59, consult 2.46/1.04, obla 2.19/0.81, case 2.20/1.63, dawn <= 2.46/1.44, contact 0.14.
  1920 DPR1 max peak 2.28 (obla dawn); phone max peak 0.87. Swarm tier A 160k desktop (tier B forced on phone runs).
- Sleep: 0 frames in 3 s after 19 s quiet, mouse on page, on all 8 pages x 3 viewports.
## Final set (.shots/q-final/)
pages.png, pages-phone.png, gallery.png (3x3, 2880x1800 each), cuts.png (4 strips at 50 ms, incl. case>cover),
site.mp4 45.0 s, site-phone.mp4 17.2 s, cuts.mp4 10.0 s, splat.mp4 10.0 s: all H.264 yuv420p 30 fps; six frames
each opened (fr-site.png, fr-cuts-splat.png, fr-phone.png in .shots/q-film/).
