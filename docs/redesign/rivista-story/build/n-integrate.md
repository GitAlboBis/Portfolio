# n-integrate: the wave put together (wave 5, 13 November, from 05:22, Opus 5.5, alone on the machine)

- Done (05:23): gates green. `node --check` on the 20 changed scripts ok; assemble --check exit 0; claims OK (32
  pages); Astro build into `.shots/n-integrate/dist` exit 0, PARITY OK (144 shared files, 0 differ), asserts ok (32
  pages, 980 references), claims on the build OK (`logs/gates-1.log`, `logs/gates-astro-1.log`).
- HEAD baselines: `web/dist` IS HEAD's Astro build (built 22:14 on 12 Nov; its shared files equal `git show HEAD:` once
  CRLF is ignored), served read-only on 5346; `git archive HEAD public` in `_before/public`, served on 5348.
- Servers (bash nohup, pids in `logs/srv*.pid`): 5345 = `.shots/n-integrate/dist public`, 5346 = `web/dist`,
  5347 = `public` (assembled, live), 5348 = `_before/public`.
- Running (05:35): batch A (`_scripts/runA.sh`): inv2 console/states/fail/bf on 5345 and 5347, walk EN + IT (with
  AudioContext counts), deep links, pairs d/m/it, floor, sleep on both builds. Logs `logs/A-*.log`.
- Astro build (5345), batch A so far: console clean on all 32 pages (en, it); AudioContexts 0 after a scroll and 1
  (running) after a neutral click on every page. Printed states: reduced motion and no script hide nothing; ?stage=0 and
  ?gl=0 hide the same below-the-fold rows as wave 4 / HEAD (work 67, about 54...: the rows reveal on scroll, identical
  counts in o-integrate's HEAD log); ?sound=0: no context after a click. ?failfield=1 keeps the stage, a forced device
  failure falls back to gl-off with h1 visible, ?name=splat&failsplat=1 keeps the stage and the h1. Back / Forward /
  reload: one canvas, the stage drawing after each, console clean. TO CHECK against HEAD: print emulated after load shows
  the inactive scene steps at opacity 0.12 (about 110 nodes on About).
- Assembled build (5347): the same on every count (console clean on 32 pages, contexts 0/1, printed states as HEAD,
  fail modes, Back / Forward). Seen once under load: a cold `case-maintech-oma?sound=0` with the device at 2.5 s and the
  header at opacity 0 until 2 s (`_scripts/hdrprobe.mjs`; 2 of 3 runs normal, HEAD 2 of 2 normal): re-check quiet.
- Walk, 25 checks by clicks (EN and IT, Astro): console clean, every h1 visible, no dead scroll; counts start / after 11:
  listeners 92 / 90 (wave 4: 77 / 75: the sound's listeners), timeouts 0 / 2, observers 11, triggers 0, tweens 1, Lenis
  1, canvases 1, formations 11 / 11, textures 2 / 3, AudioContexts 0 / 1 (one, running, through every soft
  navigation), live voices 0 at rest. The deep link dropped ?debug=1 so the end counts and the sleep read null: walk
  patched (`after 18` before the reload, deep link with ?debug=1), rerun queued. Two "NO LINK" index-row steps are the
  probe's selector (wave 4's log has the same two).
- Deep links + reloads (6 pages) and the plain states under the router: whole on both builds, console clean.
- Cut pairs (desktop EN, IT; phone): fx:nav events in order every time, never twice; covered 406-417 ms (Contact
  511-515), arrived 1045-1139 ms, Work 1259-1306 (over the flight lane's 1200), phone 861-1047. The phone work->case
  click fails in the probe (wave 4's log has the same failure).
- Type floor (9 pages x 7 viewports x 2 languages): no text under the floor anywhere ("small 0" on all 126 rows).
- Asleep with the sound running (a neutral click, a scroll, the mouse on the page; 0 frames in 3 s after 19 s): 11 pages
  x 2 builds, all 0 (`logs/A-sleep-*.log`). Batch A done 06:50.
- Walk rerun (`A-walk2-en.log`): counts start / after 11 / after 18 (7 more soft navigations) / end (after a reload and
  a deep link): listeners 92/90/90/90, timeouts 0/2/2/2, observers 11, triggers 0, tweens 1, Lenis 1, canvases 1,
  formations 11/11/2 (Obla)/11, textures 2/3/0/3, AudioContexts 0/1/1/1, voices alive 0/0/1/0, heap 8.3/14.0/16.1/8.5
  MB; asleep at the end (0 frames), console clean.
- Print emulated after a view with the stage on: IDENTICAL to HEAD (`A-printH-5346.log` vs `A-print2-5345.log`): the
  inactive steps print at 0.12 there too. Not this wave's; open for print.css.
- GPU 1440x900 DPR 2 tier A, quiet, round 1 (`B-gpu-d-1.log`, `B-gpuch-d-1.log`): peaks hero 1.52, now 2.27, index
  2.70, gallery 2.91, evidence 1.49, stack 2.64, path 2.44, consult 2.19, obla 1.53, contact 0.14, dawn <= 1.51; case
  opener 2.27 / 2.29 / 2.43 (sphere-ai, supply-chain, sersan-io); chapters 1.02 to 2.47; no long task, no halving,
  asleep on every page.
- Flights 1440 DPR 2, round 1 (`B-flight-d-1.log`): median 1.78, p90 2.29; max <= 2.56 on five routes; WORK TO ABOUT
  3.97 and 3.41 (out, u 0.73-0.77, 6-7 plates): over 3.3 on a quiet machine. Gaps: cover to Work 154 ms at the door
  (first visit), Work to a case 59 / 87 ms while leaving.
- sphere-ai fast passes, round 1 (`B-trace2-1.log`): 6 of 6 with 0 halvings, nothing over 2.5 ms.
- GPU 1920x1080 DPR 1 (`B-gpu-d1-1.log`, `B-gpuch-d1-1.log`): gallery 2.70 (wave 4 measured 2.62 on the same code
  path: over 2.4 since wave 4, not this wave's), index 2.06, consult 1.95, others <= 1.72; case opener 1.87 / 1.94,
  chapters <= 1.98; asleep. Flights at 1920 (`B-flight-d1-1.log`): median 1.42, Work to About 3.11 (wave 4: 2.24-2.25
  on that route, 2.64 max): the glass door costs about 0.5 ms more at its worst frame; other routes <= 2.36.
- Phone 390x844 DPR 2 tier B (`B-gpu-m-1.log`, `B-gpuch-m-1.log`): every scene <= 0.89, case opener 0.99 / 0.86,
  chapters <= 0.79, 80,000 points, no halving, asleep.
- ROUND 2, quiet: flights 1440 (`B-flight-d-2.log`): Work to About 3.96 / 3.43 again (out, u 0.73-0.77, 6-7 plates),
  every other route <= 2.56, median 1.82: THE FLIGHT PEAK IS NOT CERTIFIED: one route has two frames over 3.3 in both
  rounds. Phone flights max 0.89 / 0.88. Case opener 2.26 / 2.26 / 2.33 (round 1 2.27 / 2.29 / 2.43): CERTIFIED.
  sphere-ai fast passes 6 of 6 again: 12 of 12 with 0 halvings and nothing over 2.5 ms: CERTIFIED. Scenes round 2
  (`B-gpu-d-2.log`): gallery 3.11 (round 1 2.91; HEAD 3.05), index 2.85 (HEAD 2.89): within 3.3, as HEAD.
- HEAD at 1440 (`B-gpuH-d.log`, `B-gpuchH-d.log`): gallery 3.05, index 2.89, stack 2.53, case opener 2.26-2.38: the
  scenes cost what they cost at HEAD.
- nav6 is blind on this wave (it waits for wave 4's portal value: "standing" -1); the click-to-room times come from
  pairs (above). It did show one thing: on the cover the FIRST click of a visit started the flight 171 ms (desktop) and
  299 ms (phone) after the click, every later click 2-4 ms: the sound's first gesture (new AudioContext) sits in front
  of the flight. To measure: `_scripts/firstclick.mjs` (sound on vs ?sound=0, several runs).
- First frames against HEAD (`B-first-*.log`, quiet, before 07:20): Astro desktop (2 runs, 18 pages): mostly within
  the noise, THE COVER later in both runs (mine 763 / 632, HEAD 548 / 511); contact 998 / 517 vs 604 / 511. Astro phone
  (3 runs): mine later on 10 of 17 pages by 18 to 88 ms (cover 572 vs 514, sersan-io 490 vs 429, it/index 608 vs 538),
  equal or earlier on 7; the sum over the pages +3.6 %. Assembled desktop (2 runs, 9 pages): mine earlier or equal on 7
  (cover 734 / 544 vs 872 / 597), About 1497 / 593 vs 606 / 541 once. Assembled phone (3 runs): cover 692 vs 556, the
  rest equal or earlier. Long tasks of 51-73 ms after the first frame on both trees (supply-chain 72-73 mine, 71 HEAD).
- 07:23: ANOTHER JOB TOOK THE MACHINE (14 `lune.exe` simulations from C:/Users/alber/cashapp, CPU 100 %, not ours, left
  alone): the six-run re-measure of the cover (`B-first2-*.log`, 1400 to 9900 ms on both trees) is void. Stills run
  now (`runC1.sh`: steps, case chapters, header); strips, films and the first-click measure wait for a quiet machine
  (`runC2.sh`).
- Stills (batch C1, under the other job's load): `n-final/pages.png` (85 desktop stills, a still per scene step of
  every page), `n-final/pages-phone.png` (72), `n-final/cases.png` (sersan-io and supply-chain, every chapter, desktop
  over phone), `n-final/header.png` (1:1: 1920 DPR 1, 1440 DPR 2 armed / on / off / Contact, 390 DPR 2; EN and IT).
  Looked at: the cases read (what plate big and cropped, list stack 01-06, counts as dashes / fields / 10x10 boards,
  record plate far; phone counts under the numbers); header: four bars, a flat rule when off, ink on Contact, `title`
  Sound / Suono, remembered. The cover's first still shows "ALBE" and a blurred foot 3 s after load: taken at 100 % CPU,
  to retake when quiet before judging.
- Sound offline render works here: the 30 s demo, mean -31.3 dB, max -13.1 dB (`demo.wav`).
- RESUMED 17 November 17:36 (Fable 5.2, second run; the first was cut at 08:03 on 13 November). HEAD is 2406dcf
  (the director's HANDOFF.md and PLAN.md at 17:37: the site at HEAD is c0c2b07's, so the HEAD copies stand), the tree
  as left. THE MACHINE IS NOT QUIET: CPU 97-100 % at 17:37 from other sessions' jobs on other projects
  (vitest, tsc and `npm ci` in C:/Users/alber/Obla-acp, Obla-tx, Obla-sla, Obla-m3: not ours, never stopped). A load
  watch (`_scripts/load.mjs`, log `logs/load.log`) runs beside every timing measure; a run taken above 35 % load is
  marked and not used for a verdict. The probes' own Chrome runs at High priority (`_scripts/hl.mjs`: it stops
  nobody's job). The other jobs come and go: quiet gaps of minutes from 18:00.
- THE COVER'S NAME ON A COLD LOAD (strips at 100 ms, `strip/cold-d-mine`, `cold-d-head`, `cold-m-*`, `cold-d-asm*`):
  the name writes itself letter by letter from 1.3 s to 2.3-2.4 s after the navigation and the foot is in by 2.6-2.9 s,
  ON BOTH TREES (HEAD: 1.3 to 2.4-2.5 s, foot 2.7-3.0 s). The «ALBE» of the first run's still was the other job's
  100 % CPU, not a slower build: this wave's sliced build of the name changes nothing a cold load shows.
- FIRST FRAMES AGAINST HEAD, taken only in quiet gaps (`_scripts/firstQ.mjs`: 8 pairs a page, the order alternating,
  load under 35 % before each pair; `logs/Q-first-astro-*.log`), median mine / HEAD (min): Astro desktop cover
  546 / 615 (487 / 475), contact 550 / 505 (391 / 410); Astro phone cover 618 / 671 (518 / 528), case-sersan-io
  628 / 660, it/index 568 / 596. Per pair mine - HEAD: median -44, +29, -40, -11, -30 ms. The second load of a pair is
  about 100 ms slower whichever tree it is (the alternating order cancels it): the first run's "cover later"
  (2 runs, always the same order) is not confirmed. NO MEASURABLE DIFFERENCE; no long task over 50 ms after the first
  frame in these 40 pairs on either tree. (Six plain runs each under load, `D-first-*.log`: the same, noisier.)
- THE FIRST CLICK OF A VISIT (`D-firstclick-*.log`, quiet; `_scripts/clickgap.mjs`, 3 runs each): with the sound on the
  flight starts 36-42 ms after the press, 91-130 ms in a browser that has not played sound yet (one long task of
  100-126 ms at the press: the browser's new AudioContext); with ?sound=0 4-8 ms. In every film the first click shows
  as 120-176 ms with no new frame. A second hitch is not the sound's: 53-122 ms with no presented frame at the door
  (600-820 ms after the press, the page change), with and without the sound.
- FLIGHTS AS STRIPS at 50 ms (quiet, `strip/d-*`, `m-*`; `n-final/flights.png`, 6 flights; `flights-phone.png`):
  click to the new room 1072 (gallery to a case), 1109 (Work to About), 1117 (About to Obla), 1090 (About to Contact),
  1176 (a case to the cover), 1055 (Back); phone 913 / 950. Console clean. Looked at (`flights-look-a/b.png`): plates
  grow and pass, the door stands in the wall at 450-500 ms, 3-4 frames (150-200 ms) of plain grey glass with seams,
  the new room seen through the glass from 650-750 ms, the title rising from 950 ms; toward Contact two nearly blank
  paper frames (550-600 ms); toward the cover the name arrives doubled through the glass and never stops.
- FILMS in `n-final/` (H.264 yuv420p 30 fps, screencast at 57 fps captured, each opened as 12-20 extracted frames in
  `filmcheck/*.jpg`): `flights.mp4` 15.8 s (six navigations, Back included; taken at load 22 -> 90), `site.mp4`
  48.8 s (cover to Contact; TAKEN UNDER LOAD 100 %, two gaps: 176 ms at the first click, 69 ms), `site-phone.mp4`
  18.6 s (quiet), `cases.mp4` 29.6 s (sersan-io top to bottom 16.4 s, then supply-chain on the phone 13.1 s, on the
  night ground; quiet), `sound.mp4` 31.4 s (quiet): the walk's own cues (671, logged from the live engine with their
  times: `n-final/sound-cues.json`) rendered offline by `sound/render.mjs` and muxed (AAC 48 kHz; mean -30.9 dB, max
  -13.4 dB; spectrogram `filmcheck/sound-spectrum.png`: the room from the first gesture at 0.67 s, the rows' tones at
  8.7-13.8 s, the three cuts at 14.2, 21.5 and 28.3 s, the steps between). Picture and sound share one clock by
  construction; nobody has heard it.
- Assembled build, first frames in quiet gaps (`D-Q-first-asm-*.log`, 8 pairs a page): desktop cover 613 / 598
  (min 532 / 545), About 628 / 640; phone cover 558 / 663 (467 / 487), case-sersan-io 443 / 478. No measurable
  difference, no long task over 50 ms after the first frame.
- The header on a cold `case-maintech-oma?sound=0` (assembled; `D-hdr-asm.log`, quiet): 4 of 4 normal (opacity 0.95+
  by 0.5 s, one device, the stage on by 0.5-1 s), HEAD 3 of 3: the first run's one late header was the load.
- `site.mp4` taken again quiet (18:35, load 6 -> 5): 48.5 s; gaps 279 ms at the film's first frame (the cold load),
  87 ms at the first click, 69 ms at the first door. The cover's still taken again quiet (`cover-top-quiet.jpg`):
  the whole name, the foot and the toggle stand 3 s after a cold load, desktop and phone.
- THE COMMIT SPLIT (files do not overlap between topics): (1) the flight: fx-nav.js, fx-motion.js, fx-stage.js,
  css/cuts.css, stage/stage.js, stage/plates/plates.js, stage/plates/plates.wgsl.js, stage/scenes/hero.js,
  stage/scenes/contact.js, stage/scenes/cover/world.js, web/src/router/rv-router.js; (2) the sound: fx-sound.js,
  sound/render.mjs, parts/a-header.html, parts/head.html, parts/strings.mjs, css/chrome.css, fx-scroll.js; (3) the
  cases: parts/c-main.case.mjs, css/case.css, stage/scenes/case.js, stage/scenes/case/figures.js,
  stage/scenes/mist.js, assemble.mjs, web/scripts/asserts.mjs; (4) generated: fx.css and the 34 pages; (5) notes:
  build/n-*.md. Not to commit: `_shots/`, `bash.exe.stackdump`, `.claude/launch.json`.
- FLIGHTS, GPU, THIRD ROUND, quiet (18:58, load 5; `D-flight-d-3.log`): Work to About 3.89 and 3.36 ms (out, u 0.73-
  0.76, 6-7 plates) once more; every other route <= 2.52; median 1.78, p90 2.30; never under 160,000 points; no frame
  for 139 ms at the door on cover to Work (first visit), 44 ms on Work to About. THE FLIGHT PEAK STAYS NOT CERTIFIED:
  one route, two frames, 3.4 to 4.0 ms against 3.3, in three quiet rounds of three.
- Stills taken again quiet (18:36-18:58): `n-final/pages.png` (84), `pages-phone.png` (72), `cases.png` (every chapter
  of sersan-io and supply-chain, desktop over phone). Looked at all three and at `header.png`: every page whole, text
  clean, counts as dashes / fields / boards beside their rows, the list stack, the record's plate far, no stat card.
- GATES AGAIN, 17 November 19:01 (`logs/gates-2*.log`, `gates-astro-2.log*`): node --check on 22 changed scripts ok;
  assemble --check exit 0; claims OK (32 pages); Astro build into `dist` exit 0 (32 pages), PARITY OK (144 shared,
  0 differ), asserts ok (980 references), claims on the build OK. On that build: console clean on 32 pages (16 en,
  16 it), no AudioContext after a scroll and one after a neutral click (`D-console-5345.log`); the walk by clicks
  again (`D-walk-en.log`, taken under the other jobs' load): 25 navigations, every h1 visible, counts start / after
  11 / after 18 / end: listeners 92/90/90/90, timeouts 0/2/2/2, observers 11, triggers 0, tweens 1, Lenis 1, canvases
  1, formations 11/11/2/11, textures 2/3/0/3, AudioContexts 0/1/1/1, heap 8.3/14.4/17.4/8.7 MB; asleep at the end,
  console clean. The cover's four index rows by a real click and by a tap (`_scripts/rowsnow.mjs`): all four fly
  (the walk's two "NO LINK" are its selector).
- I changed no file of the site in either run. Servers 5345-5348 and the load watch stopped by pid at 19:14; nothing
  of the lane listens, no headless Chrome left; 5178 and 5180 untouched. The films' temporary frames are deleted.
- STILL WRONG, RANKED: (1) nobody has heard the sound; (2) the first click of a visit: the flight starts 36-130 ms
  late and the picture holds 87-176 ms (the sound's AudioContext in the press): the other way (fly at once, the room
  comes in on arrival) is the director's or Alberto's call; (3) in every flight 150-200 ms of plain grey glass, and
  toward Contact two nearly blank paper frames; (4) on a first visit 53-139 ms with no frame at the door (the page
  change); (5) Work to About: two frames at 3.4-4.0 ms GPU (limit 3.3), 3.11 at 1920 DPR 1 (wave 4: 2.24-2.64);
  (6) the gallery at 1920 DPR 1 2.70 ms against 2.4 (wave 4: 2.62, not this wave's); (7) leaving Contact or any
  morning view is still the sheet cut; the assembled pages keep wave 4's cut; (8) cases: More work and the phone's
  record without a figure, the phone's long list and schematic chapters stand as text after their band; (9) Work
  arrives at 1259-1306 ms on a first visit (budget 1200), the cover at 1176; (10) after Back on the assembled pages
  the room waits for the next press; (11) print after a view with the stage on shows the inactive steps at 0.12
  (the same at HEAD); long tasks of 51-73 ms after the first frame on some pages (the same at HEAD).
- CERTIFIED on a quiet machine, each at least twice: the case opener 2.26-2.43 ms; sphere-ai 12 of 12 fast passes with
  no halving; first frames not later than HEAD on both builds, desktop and phone (quiet pairs). NOT CERTIFIED: the
  flight peak (above).
- Decisions: none. I own no file and fixed nothing: nothing I found is small and mine.
- How to run and look: `python scripts/serve-static.py 5345 .shots/n-integrate/dist public` (Astro build),
  `5346 web/dist` (HEAD's Astro build), `5347 public`, `5348 .shots/n-integrate/_before/public`; scripts in
  `.shots/n-integrate/_scripts/` (`hl.mjs` the boosted launcher, `load.mjs` the load watch, `firstQ.mjs`, `clickgap.mjs`,
  `films.mjs`, `frames.sh`, `flightsheet2.mjs`, `rowsnow.mjs`); the final set in `.shots/n-final/`.
