# r-critic — wave 2's cold eye (port 5304, captures .shots/r-critic/)

- Done: stills per step at 1440 DPR2 (steps-d), phone (steps-m, steps-m2), 1920 (steps-d1); cold loads, four cuts at 50 ms, fast gallery (film/); text crops (text/); states, splat bench, pointer sweep (misc/); GPU peak + sleep (gpu.mjs). Server 5304 stopped. No site file changed.
- Decisions: A partly (Work, cases, About, Consulting, Obla lit; the cover's index still a dark room; blades are soft vertical columns); B reached on desktop, not on the phone (Badante's etched plate a ghost at its step, twice); C reached on desktop, phone and 1920 show a passed pane's huge dim numerals behind the text; D mostly (push seen, room lit under the sheet; ~100 ms of blank sheet after the card; the cover arrives dark and rebuilds its name); E reached; F partly (Obla rays good, chips cross its face; gen at rest is grain, not a sharp mark).
- GPU: peaks 3.08 (index) / 3.03 (evidence) at 1440x2, phone ≤ 0.99, 1920 rest ≤ 1.57; no long tasks; 0 frames in 3 s after 19 s quiet on all six pages.
- Needs elsewhere (from the lanes, still open): fx-stage.js slab passthrough lacks "edge" (line 705); fx-nav.js arrive() should wait for FX.stage.frame.
- How to run: python scripts/serve-static.py 5304 public; node .shots/r-critic/_scripts/{steps,film,textcrops,gpu,misc}.mjs.
