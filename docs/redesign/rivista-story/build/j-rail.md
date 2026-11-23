# j-rail — J2r RAIL (wave 9, the phone): the eye travels from Now's place to Work's place; and the header's scene name during held captions

- Launched 23 Nov 2026 about 12:50 on `8835161` (branch `feat/water-viva`), lane notes from the first step; scratch and captures in `.shots/j-rail/` (outside git), probes in `.shots/j-rail/_scripts/`.
- Ports: 5449 the tree (`public`, pid 36596), 5450 HEAD's export (`.shots/j-rail/head/public`, pid 3076), 5451 the Astro build (`.shots/j-rail/dist` + `public`). Never 5178-5180 or 5420-5448. Stop each by its pid before returning.
- Topic 1 RAIL (full proofs, it moves the stage's camera): phone-only, upright, one join (the home's Now → Work part); the director's six notes in `j-mobile.md` «The director on the rail».
- Topic 2 HEADER (light proofs, committed apart): `fx-motion.js` names the scene whose caption is shown while later captions are held (the gallery, Now, any caption scene).
- State: DONE (run 2, 14:30): both topics built and proved, the gates green on the final tree, the documents written;
  servers stopped. Nothing committed: the director commits (topic 2 first: `fx-motion.js`; then topic 1).
- **Run 2** (23 Nov from about 13:37, Opus 5.5 max, run wf_0402348a-e6c; the first run was cut by the weekly limit at about
  13:30, its servers stopped by the lead at 13:34, mid-`meas3.sh`). Recorded as done by run 1 and kept: the build, the strokes,
  SMOOTH, GPU/sleep/halvings/first frame (`meas1.log`), the gates at 13:25 (all green, `gate-*.log`), and from `meas3.log`
  (not yet in these notes when cut): desktop/sideways/phone-before-the-join identity and the 24 layout pairs (below,
  «Desktop, sideways, printed»). Run 1 also wrote the CLAUDE.md, DESIGN.md and README.md passages (13:09-13:11). Left for
  run 2: `plain.mjs` (cut after 3 of 24), `later.mjs`, `hdr.mjs`, `astronav.mjs` (all cut: servers gone), topic 2's light
  proofs, 60-as-built G7/G8, checking every doc statement in the code, the gates on the final tree, the look.
  Run 2's servers: 5449 launcher pid 33488 / listener 12624, 5450 30840 / 12740, 5451 24120 / 31132 (the WindowsApps
  python launcher and its child that listens; stop both, by pid, before returning). From 14:06 5451 serves topic 2
  ALONE instead (HEAD's export + the tree's `fx-motion.js` from `.shots/j-rail/t2`: launcher 31380, listener 34508);
  the Astro build's strokes and soft navigation were done before (run 1, and `meas4.log`). At 14:29 the three listeners
  were stopped by pid (their launchers exited with them): 5449, 5450 and 5451 free.

## Built (in the tree, not committed)

- Topic 1 RAIL: `parts/c-main.index.html`, `parts/c-main.work.html` (`data-place` on Now's and the gallery's sections; `data-rail` is refused by `assemble.mjs`'s WATER markers: it was the water site's), `css/scene.css` ("the rail's join"), `fx-scroll.js` (`railJoins`: `rail-out`, `rail-in`), `fx-stage.js` ("THE RAIL": `RAIL_K`, `railOf`, `railAt`, `railRole`, `railField`; the held view, `bwF`, the shifts, `ctx.rail`, `freeBlend`'s `railE`), `stage/field/field.js` + `field.wgsl.js` (the chips' window on the eye's place, wrapped back: `extra.w`), `stage/scenes/now.js` (no ride, no fade by weight on the rail; `away`; the pass at its place; the words' band seen from the eye), `stage/scenes/gallery.js` (two guards for a rail exit, J2c's: no-ops today), the generated pages and `fx.css`.
- Topic 2 HEADER: `fx-motion.js` (`capStep`; `gone` and `capMid` in `sceneName`, `fx:step`; the part opener held in a caption waits for it; run 2: `show`'s `seq`, only the latest name is put in: «The header after a walk» below).
- Fonti (connectors, searched before building): ui-layouts "Horizontal Scroll", "Sticky Scroll", Magic UI "Scroll Based Velocity", "Scroll Progress": DOM cards translated sideways by the vertical scroll, the very thing CLAUDE.md §2 forbids (no text slides in from a side); nothing taken. The rail is the stage's own camera.
- First look (390x844 DPR 2, EN, the tree): `st1-en/sheet.jpg` (HEAD above, the tree below, at rest every eighth of a screen), `st1-en/mid3.jpg`, `t1-tree-en-p2/pan4.jpg`: the orrery leaves left, the etched plate comes in from the right, side by side at the hand-over (gap 76 px at rest, 63 in a flick), the captions hand over at the foot.
- One change after the first strokes: the orrery's let-go moved from away 0.9 to 0.92 (a fast flick back raised its presence 0.61 → 1 as its right edge came 8 px into the frame; off the frame a presence step is not seen, and the probe now counts a step only while on screen).
- A second attribute name: `data-rail` failed `assemble.mjs` (its WATER list of the water site's markers); the opt-in is `data-place`.

## The strokes (rtouch.mjs: real CDP touch strokes across the join and back; per rAF the captions seen, the figures on screen, their overlap, a figure over a seen caption, empty frames, presence steps on screen; the same stroke with every word transparent for the light over the seen caption)

- Segments: a join flick (1,900 px/s), b join drag (550), c fast flick (2,600), d slow drag (300), e back flick, f back drag, g a sideways drag at the hand-over (the hand's orbit).
- The tree, 390x844 DPR 2 EN (`t2-tree-en-p2`, 7 strokes), 393x852 DPR 3 EN (`t3-tree-en-p3`, `t3-tree-en-p3b`, 7), 390 IT (`t3-tree-it-p2`, 5), 393 IT (`t3-tree-it-p3`, 2); the Astro build (5451) 390 IT (`t3-astro-it-p2`, 4) and 393 EN (`t3-astro-en-p3`, 2): in all 27 strokes two captions seen 0, a seen caption travelling 0, a plate or the orrery over a seen caption 0, empty frames 0, the figures overlapping 0 (the least gap between the orrery's boxes and a plate present 61-77 px), presence steps on screen 0, frames with light over a seen caption 0 (worst p95 4). Both figures in the frame for 43-489 frames a stroke: the shot.
- HEAD, the same strokes (`t2-head-en-p2`, `t3-head-en-p3`, `t3-head-it-p2`): a seen caption travelling 40-158 frames a stroke (Now's last caption rides up through the band, by J2b's design), empty frames 3-7 in the fast flicks, the figures never side by side (gap 699-722: they are a screen apart vertically).
- Looked at: `t1-tree-en-p2/pan4.jpg`, `t3-tree-it-p2/pan6-it.jpg` (the pan at 50 ms, EN and IT), `pair-e-back-en.jpg` (HEAD above: the gallery's caption rides down with the plates and the frame is the cosmos alone for about 100 ms before the orrery comes down from the top; the tree below: the row pans out to the right as the orrery comes in from the left, "ELEVEN WORKS" holds at the foot and hands over in place).
- The hand's orbit at the hand-over (g, tree and HEAD): the drag turns the eye up to 0.030 rad about the pivot and it settles back on the orbit's spring (1.1 s); the pivot is the rail's (x 433 on the tree, the blend of Now's eye and the gallery's apex at its place; 181 on HEAD).

## SMOOTH at the join (`meas2.log`; rrec.mjs = k-smooth's rec.mjs with the orrery's mark; records `.shots/k-smooth/rec/jr-*.json`; ran.mjs, and k-smooth's an.mjs / cmp.sh for the plates)

- Runs, the tree and HEAD in the same minutes: four touch flings forward from a screen and a half before the join
  (`jr-*-fwd`), three JS flings back from the gallery's head (`jr-*-back`), a steady scroll of 420 px/s through the whole
  join (`jr-*-slow`).
- **The ends** (the eye's own speed where the scroll crosses the join's two ends, every crossing in every run): 0 px/s
  at the start and 0 to 2 px/s at the end on the tree, with the scroll at 420 to 4,000 px/s there (the quintic: no speed
  and no acceleration at its ends); HEAD's crossing ends with a step of 115 to 190 px/s (its camera's blend from Now's
  view to the gallery's eye as the weights settle).
- **Through the join**, the screen speed's worst step over a 50 ms window (a touch fling in headless Chrome moves the page
  24 px every ~35 ms while rAF runs at 7 ms: a place that is a function of the scroll follows that grain frame by frame,
  as the page's own text does; the window takes the grain out): the gallery's near plate, x on the tree (its pan) and y on
  HEAD (its ride): touch flings 589 against 548 px/s, the scroll's own step there 660 and 523; JS flings back 531
  against 603 (the scroll's 575 and 576); the steady scroll 74 against 167 (the scroll's own 96 and 47: HEAD's plate stops
  its ride with a corner as the gallery's view stands, the tree's pan lands on the quintic). The eye and the orrery's mark
  follow the same: the eye's step is at most 0.95 of the scroll's (the quintic's steepest slope, 1.875 x 429 / 844 px a
  px), never a step of its own. Frame by frame (an.mjs, the grain in): the plate 5,725 against 3,635 px/s forward (one 24 px
  step of the scroll in a frame of 4.0 ms against one of 6.6 ms), 1,147 against 839 back, 528 against 524 on the steady
  scroll; no rAF gap over 24 ms but one of 42 ms (HEAD) and one of 70 ms at a run's start (the tree), no LoAF but one at a
  run's start.
- **16 ms strips**, every compositor frame of a forward flick (2,158 px/s) and a back flick (1,861): `s16-tree-en-p2/strip-*-16.jpg`,
  HEAD above the tree in `pair16-a-join-en.jpg`, `pair16-e-back-en.jpg`: the orrery slides out left frame by frame while the
  row slides in from the right, no frame skips a figure, the caption holds at the foot and hands over in place (the Work
  part's title then rises letter by letter from 778 ms: its opening, played as its caption is shown, topic 2); HEAD's
  caption rides down with the plates.

## For J2c (the rail on every other join)

- **Opting in** is two attributes on a scene's section: `data-caption` (the caption at the foot, J2a/J2b) and `data-place`
  (the rail). A join is two such scenes one after the other in the page's `[data-stage]` order: on the home Work → About's
  stack → About's path → Consulting → Obla → Contact, and on a page between its own scenes (about.html: stack → path,
  the same join as in the home). Nothing else is needed for the host: places accumulate (`RAIL_K` x the width a join),
  the eye glides over each first scene's last screen, the scenes after a join stand at its place, the chips' window
  follows the eye whatever its place (the wrap), the cosmos sees the moved eye. `data-rail` is refused (the WATER list).
- **Each scene's own code**, at a join end (`c.rail.out` / `c.rail.into`): never ride with the page or fade by its weight
  (the eye's pan takes the figure out); stand the figure in `c.fig` (held at the top on the join's side by the host);
  place an extra pass at `c.rail.at` (Consulting's splat mark: its `splat` pass config); move anything placed in screen
  px (a word, a band) by `c.rail.at - c.rail.eye`; let a figure go only once the pan has taken it out of the frame (now.js
  `away` over 0.92). Already there: the gallery's two guards for its exit (its last frame's lift and its last plate's
  fade are skipped when `c.rail.out`). Still to do per scene (J2a's brief): stack.js (drop the phone's free band, the
  push and the glass stepping back; stand in `c.fig`), path.js (drop the pane stepping back and the line dimming), consult.js
  (the four figures whole in the band), obla.js (drop the hop), contact.js (its own straight camera at the dawn's edge:
  decide whether Obla → Contact is a pan into the morning or stays the vertical rise of the day: the day is a DOM band
  that rises with the page, `[data-dawn]`, not part of the world).
- **Measure before opting in**: each pair's figures' extents (geo.mjs: at the join's start the next figure wholly out
  of the frame on the right, at its end the first wholly out on the left; at mid-pan a clear gap between them; 1.1 widths
  was enough for two figures that each span the phone's width) and each scene's tallest caption against the other's band
  (at a join each figure's band must end above the caption shown during its half of the pan: here 58 px clear in IT).
- **What this lane learned**: (1) `fx:step` goes out before fx-scroll moves `.is-active` (pick): read the classes a
  microtask later. (2) A home part's opener held in a caption that waits at the foot played unseen: fx-motion.js now
  waits for its caption (topic 2's rule). (3) The figures' presence at a join must be the rail's (whole), not the rows'
  share: with the share the plates came in faded; but the air (formations), the field, the camera blend and the looks
  keep the share (the base camera still moves from Now's straight view to the gallery's eye, 7-21 px, during the pan:
  true 3D, J2b had it too). (4) A presence ramp of a leaving figure is invisible only off the frame (now.js 0.92).
  (5) HEAD's hall chips and the room's chips still cross-fade at the join (their counts and sizes mixed by weight), as
  on HEAD; with the wrap the chips stand still in the world otherwise.
- **Probes** (`.shots/j-rail/_scripts/`): geo.mjs (the join at rest: figures' boxes, captions, bands), stills.mjs (sheet,
  HEAD above), rtouch.mjs (strokes: overlap and gap of the figures, empty frames, presence steps on screen, light over a
  seen caption; `--every=16 --win=a,b` for 16 ms strips), rrec.mjs + ran.mjs (SMOOTH at the join: the eye's and the
  mark's speed steps; an.mjs / cmp.sh for the plates), gpurail.mjs (GPU at the join, sleep at the hand-over), desk.mjs
  (desktop, sideways and the phone before the join: identity; `--pl=`, `--a=`/`--b=` ports), later.mjs (every later part
  on screen where it stood), hdr.mjs (the header's name), astronav.mjs (the Astro router into the home), layout.mjs and
  plain.mjs; run 2: hrace.mjs (the header after a quick walk and a jump, N loads, `--shot`), hrace2.mjs (its timeline:
  the observers' entries, the label's text and animations), measdiff.mjs (every differing path of the host's measure),
  dbox.mjs (where two PNGs differ, crops), hdrshot.mjs (the header's name to look at), ff2t2.mjs (ff2 with `--a=`).
- **What run 2 learned**: (6) `show()` in `sceneName` let a waiting swap overwrite a later name (fixed: `seq`); any
  scene-name change that adds `update()` calls (as `fx:step` here) makes such a race show more or less often, so prove
  the header after a quick walk and a jump (hrace.mjs) and not only at rest. (7) plain.mjs's desktop difference in the fixed
  header came from its walk before the capture (the stale name was there 1.5 s and 4 s after it, `--shot` changed
  nothing): a header difference in a printed-state capture is read with hrace.mjs before it is blamed on the change. (8) The host's measure differs from load to load by 0.1 px in a text's height on work.html
  (HEAD against itself): compare measures at 0.1 px only after measdiff.mjs shows HEAD is stable there.

## GPU, sleep, halvings, first frame (`meas1.log`; gpurail.mjs, phone 390x844 DPR 2 tier B, the tree 5449 and HEAD 5450 alternated, two rounds, CPU 0-18 %)

| place | the tree (r1 · r2) | HEAD (r1 · r2) |
|---|---|---|
| held (Now's end at the foot, the join about to begin), at rest | 0.43/0.47-0.48 · 0.43/0.47 | 0.43/0.47-0.49 · 0.43/0.47-0.48 |
| mid (the hand-over), at rest | 0.66/0.72-0.73 · 0.66/0.72-0.74 | 0.50/0.55-0.56 · 0.50/0.55 |
| head (the gallery's view at the top), at rest | 0.57/0.63-0.65 · 0.57/0.63-0.65 | 0.57/0.62-0.64 · 0.57/0.62 |
| the join, steps of 40 px: peak (p95, median) | 0.72 (0.64, 0.59) · 0.69 (0.65, 0.60) | 0.80 (0.75, 0.61) · 0.79 (0.76, 0.61) |
| back up the join: peak (p95, median) | 0.73 (0.71, 0.61) · 0.73 (0.71, 0.61) | 0.76 (0.71, 0.62) · 0.77 (0.71, 0.63) |

- Read: the peak crossing the join is under HEAD's (0.69-0.73 against 0.76-0.80); a reader who stops at the hand-over has both figures whole in the frame (the orrery and the gallery's opening row) and pays 0.16 ms more than HEAD's faded crossing there (0.66 against 0.50; the limit 1.5). The swarm never halved (80,000 drawn throughout, halvings 0 → 0 in all four runs), the orrery's pass on, consoles clean. Asleep: at the hand-over, 0 frames submitted in 3 s after 19 s of quiet (the tree and HEAD).
- First frame (ff2.mjs, phone, ten alternated pairs after a thrown-away warm-up): the tree 334 ms median against HEAD's 342 (quartiles 323-375 / 323-351); no long frame after the first frame in any load; consoles clean.

## Desktop, sideways, the phone before the join, printed states, the later parts (`meas3.log` run 1, `meas4.log` run 2)

- **Desktop** (desk.mjs: the DOM layer with the canvas hidden pixel against pixel, `stage.set` deep-equal, the host's
  measure of the first four scenes deep-equal, `fx:step` equal; HEAD 5450 against the tree 5449, at rest): 1440x900 DPR 2
  the home at 12 places (the hero, the flight, Now, the gallery's head and first works), 1920x1080 DPR 1 the home at 8
  and it/index at 7, 1440 work.html at 5: every place 0 px different, set, measure and steps equal; `M.rail` null.
- **Sideways** (844x390 DPR 2, the home at 7 places through Now into the gallery): the same, `M.rail` null.
- **The phone before the join** (390x844, the home at 10 places from the hero to y 3284, 8 px before the join): the DOM 0
  px, `stage.set` deep-equal, `fx:step` equal; the host's measure differs only by what the rail adds (`railOut` /
  `railIn`, `M.rail` with its join at y 4135.6 and the places [0, 0, 429, ...]) and Now's caption height in its last
  float digits (294.67185546875044 against 294.67185546875: Now's last caption box is laid out from another margin).
- **work.html on the phone** (6 places): `stage.set`, measure and steps equal (`M.rail` null: one rail scene, no join);
  the DOM differs at one place, y 422 (the first work's caption shown): the header names the scene, "ELEVEN WORKS",
  where HEAD names none: topic 2 (`desk-work_html-m/pair1.jpg`).
- **Printed states** (layout.mjs: 24 pairs, phone / desktop / sideways x `?stage=0`, `?gl=0`, reduced motion, print x EN
  / IT, every box: 0 different. plain.mjs, full-page pixels, 16 pairs: 14 identical; the desktop home EN under `?stage=0`
  and `?gl=0` differ in the header only (the tree "— OBLA", HEAD none, 290 px x 2: investigated below, «The header after
  a walk»). `?failorrery=1` (the stage on, the pass off; Now's top, +1, +2 screens; phone and desktop, EN and IT): 10 of
  12 identical; the phone at Now's end (y 3292, the join's first pixel) EN and IT: two rows of the nine names 1 css px
  lower (2 device px, the rest of the frame 0): the edge of the last caption's hold, where HEAD lets it go to ride up
  and the tree holds it.
- **The later parts** (later.mjs, 390x844, 11 places from the gallery to Contact, EN and IT): the eye is 429 px to the
  right of HEAD's everywhere (the gallery's place: every scene after the join stands there), every plate projects to the
  same screen box within 2 px and every formation's rect less the eye's place is HEAD's within 1 px; the cosmos's
  threads differ (the eye stands elsewhere in it). `later-en/sheet.jpg`, `later-it/sheet.jpg`: looked at.

## Topic 2, the header's name (hdr.mjs: at the middle and at 0.92 of every caption step of Now and the gallery, 390x844)

- **The tree** (`meas4.log`, and `meas5.log` after the swap fix): the home EN and IT names Now ("Now at SerSan", "Oggi
  in SerSan") at its 2nd and 3rd captions and the gallery ("Eleven works", "Undici lavori") from its 1st work to its
  11th; none while the caption with the scene's own title is shown (Now's 1st, the gallery's head); work.html EN and IT
  the same for the gallery. Console clean.
- **HEAD** (the same places): no name at Now's 2nd caption and the 3rd's middle (Now named only at 0.92 of the 3rd), no
  name at the gallery's 1st work and the 2nd's middle (named from 0.92 of the 2nd): the observer's middle line and the
  held title's box, the bug.
- **The Astro build** (astronav.mjs, EN and IT): after the router's flight from work.html into the home the header names
  Now at its 3rd caption and none at the gallery's head; the rail is laid (marks, `M.rail`, the eye x 195 → 407 → 612).
- **The header after a walk** (plain.mjs's desktop `?stage=0` / `?gl=0` difference, run down): after a quick walk to
  Contact (a screen every 40 ms) and a jump to the top, the header kept "Obla" over the hero, on HEAD as on the tree
  (hrace.mjs: HEAD 2 of 5 loads, the tree 1 of 5). Root cause (hrace2.mjs, the label's text, its animations and the
  observers' entries on a timeline): `show("Obla")` starts the 200 ms out of the old name with its swap waiting on it;
  the label is emptied meanwhile by an earlier swap; the jump's `show("")` then takes the "label empty" shortcut and
  swaps at once, but the waiting swap still runs 40 ms later and puts "Obla" back for good. Fix (`fx-motion.js` `show`,
  `seq`): a swap applies only if no later name was asked for. After it: HEAD 3 of 12 loads stale, the tree 0 of 12
  (`hrace-fix.log`); the phone with the stage on, 6 loads each, both clean (`hrace-phone.log`); the names at every
  caption as before (`meas5.log`).
- **Topic 2 alone** (5451: HEAD's export + the tree's `fx-motion.js`; `meas6.log`), against HEAD in the same minutes:
  GPU tier B at Now's held end 0.42-0.43/0.45-0.46 against 0.43/0.47-0.48, the hand-over 0.50 against 0.50, the head
  0.57 against 0.57, the join's peak 0.79 against 0.79, back 0.78 against 0.74 (p95 0.71 against 0.70), never halved.
  The names at every caption (home and work, EN and IT) as the tree's; HEAD as above. The walk and the jump: both clean
  in 6 loads. The first frame (ff2t2.mjs, ten alternated pairs, phone, CPU 45-52 %: other sessions on the machine) 463
  against 521 ms median (quartiles 403-490 / 441-522), one 55 ms frame with no script at 5.3 s (the probe's scroll) in one
  load of topic 2 alone, none on HEAD, consoles clean. Again at 14:25 (CPU 68-72 %, `ff-t2-again.log`): 531 against 506
  ms (quartiles 515-544 / 490-552), no long frame after the first frame on either side (the thrown-away warm-up load
  had two, with no script: the machine's). Desktop 1440 DPR 2: the home EN and IT at the opening and at the
  gallery's first work, work.html at the opening and mid-page: the DOM 0 px, `stage.set` and `fx:step` equal; the
  measure equal but on work.html the lead's height 221.7 against 221.8 (measdiff.mjs: HEAD against HEAD gives it too,
  one load in two). The phone (5 places through Now into the gallery): 0 px (the header is out of view going down).
  The look: `hdr-sheet.jpg` (HEAD above, the tree below; Now's 2nd caption and the gallery's 1st work, EN and IT): the
  tree's header says "— NOW AT SERSAN", "— ELEVEN WORKS", "— OGGI IN SERSAN", "— UNDICI LAVORI", HEAD's nothing.
- HEAD's stale name over all runs: 7 loads of 43 in five runs (hrace 2/5, hrace2 0/6 and 2/14, hrace-fix 3/12, meas6
  0/6); the tree before the fix 1/5, after it 0/12 (and topic 2 alone 0/6).

## The look (run 2)

- Every stroke strip of the tree and of the Astro build (32: 31 paired two by two in `look/m00.jpg` … `m15.jpg`, and
  `t3-astro-en-p3/strip-a-join-flick.jpg` on its own), the IT
  pair `pair-b-drag-it.jpg` (HEAD above: the orrery rides up, three frames of the cosmos alone, "UNDICI LAVORI" comes up
  with the page; the tree below: the orrery held, the eye pans, both side by side at 2,600-2,800 ms, the hand-over in
  place), `pair16-a-join-en.jpg`, `pair16-e-back-en.jpg`, `st1-en/sheet.jpg`, `t1-tree-en-p2/pan4.jpg`, the later parts'
  sheets, `hdr-sheet.jpg`, `desk-work_html-m/pair1.jpg`: each pan reads as one take, the orrery leaving on the left with
  its name under it as the row comes in from the right (and back), no frame without a figure, the caption held at the
  foot and handed over in place (the Work part's title rising letter by letter as its caption comes, at 393 DPR 3 and
  in Italian). A stroke that stops inside the join leaves both figures in the frame, cut by its edges (the
  shot; e.g. `t3-tree-it-p2` c, `t3-astro-it-p2` a, `t3-tree-en-p3` e).
- 60-as-built rows G7 (the rail) and G8 (the header) written; CLAUDE.md §1/§4 and DESIGN.md (run 1's passages, checked
  in the code) plus the `seq` clause; README "The rail" checked.
- **The gates on the final tree** (14:21, after the `seq` fix): `assemble.mjs` (35 up to date, asserts ok), `--check`
  exit 0, the claims 34 pages OK; the Astro build into `.shots/j-rail/dist` (34 pages), `parity.mjs` PARITY OK (150 shared
  files, 0 differ), `asserts.mjs` ok, the claims on the build OK; `VERCEL_ENV=production node web/scripts/release.mjs`
  the three `[release]` lines (34 pages, 32 in the sitemap, 159 files).

## HEAD at the join (geo.mjs, 390x844 DPR 2, the tree = HEAD at the start)

- Now 1604..4136 (three caption boxes of 844), the gallery from 4136. Now's caption 3 at the foot [627, 802]; the gallery's head caption [509, 802] once held.
- At 3292 (Now's end at the view's foot) the orrery stands x 31..379, y 116..430 (A 150.4, the mark at 196, 263). At rest at 4136 the opening row stands x 37..384, y 169..370 (w1 the near etched plate 37..204, alpha 1; w8 0.49; the rest 0.12 behind the etched face).
- HEAD's join: from 3292 the orrery rides up with caption 3 (at 3503 the mark at y 52, caption 3 at 416..591) and fades with Now's weight; the plates rise with the gallery's view from below (at 3714 at y 633..822, the head caption at 981..1255, shown but under the screen). Weights cross 0.5/0.5 at 3714 (the reading line on the boundary).
- Chips: Now's hall box centre x 195, 2226 wide; the gallery's room box centre x 195, 1871 wide (both about the view's centre).

## The design (decided before the edit)

1. **The rail is the host's** (`fx-stage.js`), generic. A scene opts in with `data-rail` on its section (Now, the gallery). It is on only in the caption grammar (a phone held upright, `FX.scroll.caption`). A JOIN is two rail scenes one after the other in the page. Every scene has a PLACE on the rail: the first 0, each join adds a step of `RAIL_K` x the view's width to the right (`RAIL_K` 1.1: the two figures each span almost the phone's width; at mid-pan a clear gap between them, at each end the other wholly out of frame); a scene that is not on the rail takes the place of the rail scene before it (so the parts after Work stand where Work stands). Desktop, a phone held sideways, reduced motion, every printed state, work.html (one rail scene, no join): every place 0, the rail off, every value HEAD's.
2. **The eye's place E = f(scroll)**: across a join, over the last screen of the first scene (`y_b - vh .. y_b`, `y_b` the next section's top, the hand-over of the captions at its middle), `E` glides from one place to the next by `glideK` (the quintic: no speed and no acceleration at its ends); exact (no damping), so it reverses exactly.
3. **The camera travels, nothing is moved in screen space**: the host adds `E` to the blended free camera (pos, target; a scene without its own pivot: its target); every rail scene's world is set at its place (its slabs' `cx`, its formations' rects, its field's lights, its own orbit pivot: `+ place`), and a scene's extra passes get `ctx.rail.at` to place themselves (now.js: the orrery's `x`, `hx`). The cosmos sees the moved eye (field.js: the eye in the room is the camera's own) and the chips' window follows `E` with the chips wrapped in the world (field.js, field.wgsl.js `vsChip`: world-fixed, so near chips pass faster than far threads; at `E` 0 bit for bit as before). True parallax for everything drawn.
4. **Held at the join**: a rail scene's view (and its figure band) is held at the top on the join's side (`view.y` 0): no figure rides with the page; the figures' presence at a join is the rail's (slabs and passes whole while the eye is between the two places; the formations, the field, the cameras and the looks keep the share's weights); now.js on the rail neither rides nor fades with Now's weight: it goes out of frame with the pan and lets go only once out of it (`away`, the eye's distance from its place in steps).
5. **The captions hand over in place at the join too** (`css/scene.css`): the first scene's last caption keeps its hold below its step and the next scene's first caption its hold above (the grammar's own -60svh / -150svh), so the two hand over at the foot where the reading line crosses the boundary, as inside a scene (`rail-out`, `rail-in` set by `fx-scroll.js` on the two sections of a join). No text moves while seen; the figures stand above the captions (each band ends above its own tallest caption; at this join each figure's band also ends above the other scene's caption shown during its half of the pan: measured, EN and IT).
6. **The side**: placeOf's lateral drift is +x for every j (0.29 > 0.9 x 0.21: dx/dj > 0 everywhere), the eye's place in the cosmos moves right as the scroll goes on: the rail goes right, as Alberto said, and the cosmos agrees (no mirroring).
7. **Topic 2 (fx-motion.js)**: a heading held in a caption counts as on screen only while its caption is shown (the step `.is-active`): the header names the scene whose caption is shown (updated on `fx:step`). The same rule keeps a home part's opening, held in a caption that waits unseen at the foot (the gallery's head at the rail's join), until its caption is shown, so the Work part's title sequence plays where the reader meets it. Topic 1 relies on this at the join: commit topic 2 first (or both).
