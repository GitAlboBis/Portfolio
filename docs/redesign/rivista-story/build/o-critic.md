# o-critic — the cold eye on wave 4 (router + glass), port 5332 (Astro) / 5335 (assembled)

- Done (2026-11-12, one session): walk of 25 navs, 6+3 flight strips, GPU x4, sleep on 5 pages, plain states, assembled
  build, index/prism at 3 sizes, cover +/- splat, gen, Contact phone, plates through plates, phone menu. No site file touched.
- Servers stopped (python pids 26244, 27708); no headless Chrome left.
- Scripts: .shots/o-critic/_scripts/ (walk, repro lang|langabout|dbl|single, dbl2, dbl3 <port>, strip, gpu, states,
  asm, idx, look, menu, rows). Captures: .shots/o-critic/{walk,repro,strip,states-5332,idx,look}/.

## Findings (ranked)
1. P0 LANGUAGE SWITCH BREAKS THE PAGE (Astro only). EN->IT: two canvases; the IT page builds a new stage ("device from
   the head's boot", no "adopted") while the kept canvas is carried into the body and keeps drawing the OLD page:
   it/about shows "CAPABILITIES" over "Competenze" (repro/langabout-5332/t6000.jpg); it/contact shows a blurred dawn,
   no text at all (repro/lang-5332/t6000.jpg). IT->EN adopts fine. Assembled build fine. Cause area: rv-router.js
   swapPage (cross-folder swap) + fx-stage.js KEEP/build(): the kept stage is neither adopted nor dropKeep()'d.
2. P0 DOUBLE CLICK ON A HEADER LINK LEAVES THE PORTAL AT p=1 for good (Astro only): the frame stays covered by glass,
   the page's text and plates hidden (repro/dbl2-sheet.jpg, dbl3: portalState {p:1,to:1} after 8 s; assembled p=0).
   Cause area: fx-nav.js (second click starts a second flight) + fx-stage.js adopt (no arrival -> portal never sent to 0).
3. THE FLIGHT IS STILL A WIPE: hairline sweeping L->R, a grey vertical column, then near-black frames 400-700 ms,
   hairline back; no glass reads (strip/d-g2case-mid.jpg, every desktop and phone strip). plates.wgsl.js / portal.js.
4. GPU in flight over the peak: 1440 DPR2 max 4.05-4.10 ms (p90 3.15-3.17, median 2.3); 1920 DPR1 p90 2.47 > 2.4,
   max 3.45. Rest 1.79 / 1.39. Phone fine (max 1.49). Machine quiet (no other lane rendering).
5. Prism (1:1 idx/crop-d-rest-prism.png): now dark smoked glass with warm edges, no longer a grey tent; but it reads as
   an outline drawing; the exit is a fan of 4-5 lines from one point (a figure by light); the phone flare is a small star.
6. Emblems: Obla's is a thin round outline straddling the dawn edge (a ring) with blurred cobalt bands across the dawn
   (idx/hover-obla-s.png); Consulting's is a cluster of glowing round dots; gen has a row of tiny rings under the frames.
7. Field chips ("A"s, SerSan logos) fill the index and every room; they compete with the prism and the plates.
8. Back/Forward scroll restore drifts (y 5/28/38 instead of 0) - minor.
OK: no leaks over 25 navs (listeners 77->76, observers 10, triggers 0, lenis 1, canvas 1, heap 7->8 MB); stage asleep on
5 pages (0 submits); reduced/stage=0/gl=0/no-WebGPU navigate and are complete; phone menu OK; click during a flight,
reload mid-flight, deep link, index rows OK; console clean; assembled build: 4 cuts + back/forward clean; card name and
arriving title never together; Contact phone clean; text clean in all crops; gates OK.
