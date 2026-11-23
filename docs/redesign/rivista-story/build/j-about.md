# j-about — J2c1 ABOUT: the stack and the path on an upright phone (captions + the rail)

- Lane J2c1 of the phone wave, on `e33bd73` (branch `feat/water-viva`), Opus 5.5 max; no commits (the director commits).
- Scope: About's stack and path opt in to captions (`data-caption`) and to the rail (`data-place`), home part AND about.html;
  joins Work → stack (home) and stack → path (home and about.html); phone dodges out (stack.js 162-207, path.js 189-295).
- Scratch and captures `.shots/j-about/` (outside git); ports 5452 (tree), 5453 (HEAD export), 5454 (Astro build).
- Status: DONE (18:10). Built, two rounds of looking, the measures, one batch of fixes (16:40 `S.rk`, 17:15 the stack's
  `outK`, the path's end), the confirmation round (17:47-18:05), the gates green on the final tree (18:02), documents
  written (CLAUDE.md §1, DESIGN.md, `stage/scenes/README.md`, `60-as-built.md` G9). Nothing committed: the director commits.
- Servers, all STOPPED by pid at 18:20 (ports 5452-5454 free, no headless Chrome left): 5452 the tree, launcher 13288 /
  listener 3144; 5453 HEAD's export (`.shots/j-about/head/public`, `git archive e33bd73 public`), launcher 36968 / listener
  12816; 5454 the Astro build (`.shots/j-about/dist` + `public`, built 16:26 on the final markup), launcher 25248 / listener 9072.
- Fonti (connectors, searched before building): ui-layouts "Sticky Scroll", "Horizontal Scroll", "Scroll Text"; Magic UI
  "Scroll Based Velocity" and its card effects: DOM text and cards moved by the scroll or sideways (CLAUDE.md §2 forbids it),
  neon and gradient cards (DESIGN.md bans glow): nothing taken. The caption is the house's sticky grammar, the rail the
  stage's own camera. impeccable context run (no surface brief for about.html; DESIGN.md and CLAUDE.md direct); no question
  tool in this subagent: the brief and the project's documents decide.

## Measured before building (`_scripts/caph.mjs`, the glyphs' union of each step's text, HEAD = tree)

- Stack (390x844): head 141 (about.html; the home's head is the same once its lines are in), steps 213-311 EN / 213-343 IT;
  05 (AI, eight tools, 5-7 rows) the tallest: 311-343 at 390-393, 375 at 360x740 (51 % of the screen). Type 16 and up.
- Path: head 247 EN / 278 IT (three display lines + the lead), steps 136-208 EN / 136-240 IT. Type 16 and up.

## Built (in the tree, not committed)

- `parts/c-main.about.html`: `data-caption data-place` on `#stack` and `#path` (both builds read this partial: about.html
  and the home's About part); the head comment says why.
- `css/page-about.css`: in the caption grammar only, the stack's captions shortened by layout (tools' gap 0.2em 1em, title
  → tools and tools → proof `--s3`): 05 is 284 EN / 313 IT at 390 (was 311 / 343), 343 at 360x740 (was 375). Type unchanged.
- `stage/scenes/stack.js`: `cap` branch (c.caption): the stack in `c.fig`, centred under the header's room (CAP_HDR 80 +
  safeTop), sized to hold the shot's travel (CAP_SPAN 1.32), right of the middle by CAP_DX 0.09 of the width while open (the
  eye stands right of it: measured 30-45 px left otherwise, its corner and sheet past the left edge); the free band, the push
  and the glass stepping back go (the text guard stays, only fires for a zoomed page); ?debug=1 exports every layer and the sheet for the extent probe (`_scripts/stackext.mjs`).
- `stage/scenes/path.js`: `cap` branch: the line laid in the band as held (CAPW: S, V, the desktop's bow, the eye L 0.92 D,
  SIDE 0.2/-0.08, F, PW 98, OFF), chosen offline with path.js's own math (`_scripts/pathsearch.mjs`): at rest on each
  station the pane in step whole, the next clear of it by the guard's 30 px, the third where room allows; two or three panes
  (`1 - sstep(2.2, 3, d)`), the guard (GAP) as on a desktop; no free band, no step back within 64 px (a guard at 0 px), no line
  dimming; no straight view at the end (`gone` 0); the world (line rect, panes, subject) moves with the view by `dy` (f.y)
  while the eye stays, so the figure leaves with its last caption; the share factor is 1 while a join of the rail is under
  way; its ink weighted as on a desktop; the line begins 0.08 (not 0.2) past the pane.
- `fx-stage.js`: (1) a yielding scene's plates (`yields`: the stack, the gallery) do not yield while a join of the rail is
  under way: at the stack → path hand-over the stack's last layer (l7) dropped 1 → 0.39 in one frame as the path's head
  caption came into focus (the yield's 140 px straight-view box reached it; `t1-sp-tree-en-p2`, a, b, e: one pop each; after:
  0). (2) A comment on why the formations keep the share at a join (below).
- TRIED AND DROPPED: a `figure: true` swarm entry weighed by `bwF` (whole at a join) for the stack's outlines and sheet and
  the path's line. With it, at the join's start the path's line jumped to its weight, the swarm's rank intervals moved at
  once (stage.js packSlots: a later scene's formation comes first) and the stack's outlines emptied and streamed toward the
  path while in frame; without it (the share, as HEAD and J2r) the points pass gradually and the line gathers after the pan
  (`pair-fig-sp-zoom.jpg`: share | whole at 1200 ms, share | whole at 3050 ms). Removed from the host and both scenes.

## First look (390x844, about.html and the home, tree against HEAD; `v1-*`, `v2-home-pc`)

- about.html: one caption at the foot every step, the stack whole in its band (after CAP_DX/CAP_SPAN: x 46-355, y 100-424,
  band 80-440; 360x740 IT x 85-288, sc 0.63); the stack → path join one take (the stack's outlines leave left, SEP 2026 and
  MAY 2026 come in from the right, CAMERINO hands over at the foot). The path at rest: two or three panes on a bowed line.
- The home: Work → stack one take (Supply Chain's plate leaves left, the closed CORE block comes in from the right,
  CAPABILITIES hands over at the foot); stack → path as on about.html.
- A transient: 2.2 s after a jump of two stations the path's near line was a wide blurred band; after 4 s (and mid-walk at
  rest) the line is crisp: check the walk in motion (strips).
- The path's exit into Consulting (home; Consulting is not a caption scene yet, J2c2): with `dy` the figure rises with its
  last caption; from local 1.0 of the last step (its caption hidden) to Consulting's title (about +5.4 .. +5.75 screens)
  the frame has neither text nor figure. HEAD had the path's last text there (no figure either). J2c2's rail closes it.

## The look, round 1 (after the build, 390-393, EN/IT)

- The path's near line: the phone's long feather (0.26) reached a node and a half back toward the eye and drew a wide soft
  band from the screen's left edge under the pane in step (`v3-it-p3`, +12); in the caption band the reveal is 0.1 / 0.1
  (fades in from just behind the node in step): a thin line from the pane in step through the panes ahead (`v4-it-path`).
- The first strokes (`t2-*`, 390 EN, both joins, the tree): two captions seen 0, a seen caption travelling 0 (gs's back
  drag: the gallery's last caption's rows rising 1-2 px a frame as it comes in, fx-motion's), a figure over a seen caption
  0, empty frames 0, the figures overlapping 0 (the least gap 126-168 px), pops 0 (after the yield fix), light over a seen
  caption 0 frames (worst p95 3). Looked at: `t2-gs-tree-en-p2/strip-b-join-drag.jpg`, `t2-sp-tree-en-p2/strip-b-join-drag.jpg`.

## Batches (background, 16:5x; logs `.shots/j-about/touch.log`, `meas.log`)

- `touch.sh`: jtouch at both joins, the tree 390/393 EN/IT, the Astro build IT 390 / EN 393, HEAD EN 390 / IT 393, the
  home's sp once; 16 ms strips (a, e) tree and HEAD at 390 EN.
- `meas.sh`: SMOOTH records (rrec) both joins both ways, tree and HEAD; GPU tier B two rounds (gpujoin) with the sleep;
  ff2 (the home with its flight, about.html at rest); desk (1440 DPR 2, 1920 DPR 1, sideways, the phone before the join);
  layout, plain; later parts; the header's name.

## The path's end (found while the batches ran, 16:4x)

- With the walk's eye kept deep in the room to the end (no `gone` in the band), the home's path → Consulting exit swung
  the blended camera as Consulting's share began: at +5.2 screens the JAN 2022 pane moved ~100 px right and ~20 up while
  its caption rose 170 (`pair-pathexit.jpg`). `gone` returned for the band, by the scroll: the eye back at the straight
  view over local 0.5..0.9 of the last step (the caption hides at once at local 1, so its text's foot cannot drive it).
  To confirm: `v5-home-pc` (queued at the end of `meas.sh`).

## Round 1 of the batch: one law broken, fixed at 16:40 (the confirmation round reruns the sp tree runs)

- `T-sp-tree-it-p3` c (a 2,554 px/s fling that ran 1,569 px, through the join's end into the path's first step): the
  path's two panes dropped 1 → 0.69 in one frame on screen as the join ended: whole while the join was under way (`bwF`),
  then the damped weight `S.w`, which SCENE_S's 0.16 s left at 0.69 in a fling that fast. Fixed in `fx-stage.js`: a rail
  scene keeps its figures whole after a join while it holds most of the screen (`S.rk`, let go like the weight only once
  its share falls under a half). Runs started before 16:40:36 (sp tree en/it p2/p3, sp astro it-p2) are pre-fix.
- The same stroke counts p1's caption "travelling" 49 frames by 1 px: its rows rising into place as it comes into focus
  (fx-motion's step beats; J2a and J2r saw the same), not a caption moving with the page.

## Touch batch, round 1 (16:31-17:06; `touch.log`, `node _scripts/tsum.mjs`)

- The tree, both joins, 390 DPR 2 and 393 DPR 3, EN and IT (8 runs, 56 strokes), the Astro build (4 runs, 28), the home's
  sp at 390 EN (7): two captions seen at once 0, a figure over a seen caption 0, empty frames 0, the figures overlapping 0
  (least gap 124-168 px; both figures in frame 17-491 frames a stroke), light over a seen caption 0 frames (worst p95 4),
  pops 0 but the one fixed at 16:40 (above). "Travel" only in the back strokes: the arriving caption's rows rising 1-2 px
  a frame as it comes into focus (4-7 frames).
- HEAD, the same strokes (EN 390, IT 393): sp: empty frames 45-403 a stroke, a figure over the text 8-20 frames, light
  over the text in 0-37 frames (p95 up to 87), the two figures in frame together 0-11 frames (64-84 px apart, one above
  the other); gs: empty 0-15, figures over the text 0, light 0, the two figures in frame 0-16 frames (497-515 px apart).
  HEAD's captions are not held (its texts scroll): "two seen" and "travel" are n/a for it.
- 16 ms strips (S16-*: forward and back flicks, every compositor frame 150-1350 ms; tree and HEAD at 390 EN): the tree's
  figures stand in their bands and the eye pans, no frame skips a figure, the caption holds and hands over in place;
  HEAD's caption rides up through the band while the stack fades out and comes back under it (`pair16-sp-a-en.jpg`), and
  the gallery's plate rides off the top while the CORE block rises from below without its caption (`pair16-gs-a-en.jpg`).
- Looked at: `T-sp-tree-en-p2`, `T-sp-tree-it-p2`, `T-sp-tree-en-p3`, `T-gs-tree-it-p3` (`sheet-run.jpg`: 7 strokes x 16
  frames), `pair-sp-b-en-p2.jpg`, the two 16 ms pairs.

## SMOOTH, round 1 (`.shots/k-smooth/rec/ja-*`, `_scripts/jran.mjs`; 390x844, EN; the tree and HEAD in the same minutes)

- gs (the home, join 13420..14264): the eye at the join's ends 0 to -5 px/s forward (the scroll at 480-3,333 px/s), 20 at
  the start going back; -114 at the end going back is the stack's own opening closing on its springs as the reader comes
  back to its head (HEAD the same, -114). 50 ms windows: the eye's worst step 504-529 px/s against the scroll's own
  530-576 in flings (the scroll's grain), 36 against 162 in the steady crawl; the gallery's last plate and the stack's first
  layer 499-543 in flings, 35-37 in the crawl (HEAD's: 160 and 19 vertical in the crawl, its plate riding off).
- sp (about.html, join 6752..7596): at the join's start -38, 23, -14 px/s (forward, back, crawl): the stack's own way back
  to the straight view, a LINE of the scroll that stopped the eye dead at progress 1, where the join begins (HEAD: -166
  and -28 there). Fixed at 17:15: a quintic in the caption band (`stack.js` `outK`); the records again in the confirmation
  round. At the end 22-33 and -54/-58 px/s: the path's own move from the straight view toward the walk (a smoothstep from
  local 0.35, no corner; HEAD 58-60, -131). 50 ms: the eye 482-525 against the scroll's 507-579 in flings, 35 against 162 in
  the crawl; the plates (the stack's last layer, the path's first pane) 471-554 in flings, 34-37 in the crawl (HEAD: the
  stack's layer 235-614 vertical, its hop).
- No rAF gap over 24 ms, no LoAF, no error in any record.

## GPU, round 1 and 2 (`meas.log`, gpujoin.mjs, tier B 390x844 DPR 2, the tree 5452 and HEAD 5453 alternated, CPU 0-9 %)

| place (ms: median/max at rest twice; peaks: peak (p95)) | sp tree (r1 · r2) | sp HEAD | gs tree | gs HEAD |
|---|---|---|---|---|
| held (B - vh) | 0.28/0.32 · 0.28-0.29/0.32-0.33 | 0.31/0.34-0.36 | 0.24-0.25/0.28-0.32 | 0.24-0.26/0.29-0.30 |
| mid (the hand-over, both figures) | 0.26-0.27/0.29-0.33 | 0.29/0.34-0.35 | 0.26/0.29-0.30 | 0.28/0.32-0.34 |
| head (B) | 0.39/0.43-0.44 | 0.47-0.48/0.51-0.53 | 0.32-0.33/0.36-0.37 | 0.35/0.38-0.39 |
| the join's steps, peak | 0.40 (0.35-0.36) | 0.61-0.64 (0.53) | 0.39-0.40 (0.35) | 0.42-0.44 (0.39) |
| back up, peak | 0.47-0.48 (0.43-0.44) | 0.62 (0.56-0.57) | 0.41-0.42 (0.39-0.40) | 0.44-0.47 (0.42) |

- The swarm never halved (80,000 drawn throughout, halvings 0 → 0, every run); consoles clean.
- Asleep (round 1, 19 s of quiet at the hand-over, frames in 3 s): sp the tree 1, HEAD 0; gs the tree 22, HEAD 24 (HEAD
  does not sleep at that place either). Being looked into (`sleepdbg.mjs`, queued in `confirm.sh`).

## First frame, desktop, sideways, printed states (`meas.log`)

- First frame (ff2.mjs, ten alternated pairs after a thrown-away warm-up, phone tier B, CPU 0-6 %): the home with its
  flight to Now 361 ms median against HEAD's 362 (quartiles 347-389 / 350-380); about.html at rest 311 against 319
  (293-422 / 286-330; two slow tree loads, 905 and 697 ms, each with one long task before its first frame, 624 and 533
  ms). After the first frame one long frame in one load of each tree run (53-54 ms, blocking 0, `field/atlas.js`: the
  chips' atlas, as J2a saw), none on HEAD; consoles clean.
- Desktop (desk.mjs, HEAD against the tree at rest; the DOM layer with the canvas hidden pixel against pixel, `stage.set`
  deep-equal, the host's measure of every scene, `fx:step`): about.html 1440 DPR 2 at 9 places, 1920 DPR 1 at 5, it/about
  1920 at 4, it/index 1920 at 5 (the About part): everything equal, `M.rail` null. index.html 1440 at 7 places (the home's
  About part): DOM 0 px, set and steps equal, the host's measure differs somewhere in Obla's part (y 36-38 k: its rows
  and fields table, the scenes after About): measdiff queued (HEAD against HEAD too: J2r found 0.1 px load-to-load jitter).
- Sideways (844x390 DPR 2): about.html at 5 places and the home at 5: everything equal, `M.rail` null.
- The phone before the join (the home's gallery, 5 places up to 0.6 screens before the gs join): DOM 0 px, `stage.set` and
  `fx:step` equal; the measure differs by what this lane adds (the stack and path as caption scenes, the rail's places
  [0, 0, 429, 858, 1287, 1287, 1287, 1287]).
- Printed states: layout.mjs 48 pairs (390, 393 DPR 3, 1440 x `?stage=0`, `?gl=0`, reduced motion, print x about.html,
  it/about, the home, it/index): every box and height equal; plain.mjs 32 full-page pairs (390, 1440): 0 channels
  different in all.

## For J2c2 (drafted while the batches ran)

- Opting in: `data-caption` + `data-place` on Consulting's and Obla's sections makes path → consult and consult → obla
  joins in the home (on their own pages each is one rail scene: nothing changes). Measure the captions first (caph.mjs):
  the path's band ends at 502 (IT) / 533 (EN) at 390, so Consulting's first caption must start below it; the path's last
  caption (B.Sc. + thesis) is 208 EN / 240 IT tall (top at 564 IT at 390): Consulting's band must end above it.
- At a join the host makes slabs and extra passes whole and skips the yields (this lane); swarm formations keep the share
  (tried whole: the swarm's rank intervals jump and empty the leaving figure). Consulting's four figures are formations:
  look at how they pass to and from the path's line and Obla's character during the pan.
- A scene's own factor of its share (the path's panes had `sstep(0.6, 0.9, share)`) must be 1 while `c.rail.join`.
- A camera deep in its room at a scene's end must be back near the straight view before the next scene's camera weighs
  in (the blend swings otherwise): the path does it over local 0.5..0.9 of its last step, i.e. the first 40 % of the pan
  once path → consult is a join; look at the path leaving with its eye pulling back.
- In a caption band drive nothing from the caption's text box at the scene's end (the caption hides at once at local 1);
  a figure that must leave with its view moves in the world (`dy`), not by re-aiming the eye.
- The empty window at the home's path → Consulting exit (+5.4 .. +5.75 screens, no text, no figure) closes with the rail.
- Probes in `.shots/j-about/_scripts/` take the join or the scene as a parameter: jtouch (`--join`: add consult/obla),
  gpujoin (`--to`), rrec + jran (`--join=y0,y1 --ids`), desk (`--sel`), stackext, floorab (`--sc`), sheetrun (a run's
  contact sheet), tsum (a batch's laws per stroke), caph, stills (`--sel --offs`), pathsearch (a figure's geometry
  chosen offline with the scene's own math).

## Next

- Touch strokes at both joins (EN/IT, 390/393, tree + Astro, side by side with HEAD), SMOOTH both ways, GPU tier B at each
  join's peak (2 rounds), sleep, halvings, first frame, desktop/sideways/printed identity, later parts, header names, type
  floor; the `figure` flag checked against off; gates; documents.

## Draft of 60-as-built G9 (superseded: the row is in `60-as-built.md`)

G9 | **About on a phone: the stack and the path on the caption and on the rail** (the phone wave, lane J2c1 ABOUT;
Alberto, 23 November: «Al posto di scrollare e far si che sia tutto verso il basso nel mondo su telefono , possiamo fare
I movimento nello spazio dimensionale come facciamo gia su desktop», «un movimento nel mondo 4D verso destra per esempio
per le card di capabilities , non che si slidano verso destra», and for the captions «bloccando lo scroll pinnando la
posizione»). Before: each step's text travelled up through the figure's band and both scenes dodged it (the stack kept
to a free band, pushed with a cushion, its glass stepping back as it crossed a text; the path showed one pane at a time,
stepping back within 64 px of a text, its line dimming within 72 px), the path's head had no pane at all, and the gallery
→ stack and stack → path joins went down the page with two scenes' figures in one band (`build/j-walk.md` 041, 047-049).
Now ... (what each scene does; the joins; the host's three rules: yields off at a join, formations keep the share, S.rk).
Proof: ... | Where: `parts/c-main.about.html`, `css/page-about.css`, `stage/scenes/stack.js`, `stage/scenes/path.js`,
`fx-stage.js`, the generated pages and `fx.css`, CLAUDE.md §1, DESIGN.md, `stage/scenes/README.md`; `build/j-about.md` |
Still open: the home's path → Consulting exit has a short frame with neither text nor figure until J2c2's rail; ...

## The confirmation round (17:47-18:05; `confirm.log`)

- The sp runs that ran before the fixes, again (tree 390/393 EN/IT, the Astro build IT 390: 35 strokes): every law 0,
  pops 0 (the 2,554 px/s fling through the join's end included).
- J2r's own join (Now into Work, `rtouch.mjs`, 390 EN, 7 strokes): the tree as HEAD (empty 0, overlap 0, gap 63-76 px, lit
  0 frames); HEAD's fast flick has its own pop (1) and the tree none (`S.rk` holds there too).
- SMOOTH after the stack's quintic (`jc-sp-tree-*`): the eye where the scroll crosses the join's start 0, 1 and 0 px/s
  (forward, back, crawl; it was -38, 23, -14), at its end 20-55 (the path's own smooth move); the plates' worst 50 ms step
  in the crawl 26-28 px/s (was 34-37), in flings 464-557 against the scroll's own 513-576.
- Asleep (`sleepdbg.mjs`, 19 s of quiet, then 3 s): about.html at the hand-over 0 frames (gpujoin's own check: 1, twice;
  HEAD 0). The home at the gallery into the stack's hand-over: 13 frames on the tree AND on HEAD, with the stage not awake
  (activity 0) and `stage.set` unchanged through the 3 s: not the scenes' values; HEAD's own at that place.
- The desktop home's measure (`measdiff.mjs`, 1440): HEAD against the tree equal in one load, 0.1 px in Obla's rows in the
  other; HEAD against HEAD 0.4-1.5 px in the same rows: the load-to-load jitter J2r saw, not this lane.
- The keyboard (floorab.mjs, 393 EN, 40 Tabs): 20 stops in the stack's links (the order wraps), each with its step in
  focus and its caption shown, 0.73-0.78 opaque 260 ms after the key (still coming into focus, J2a's measure); the link at
  768-782 px of 852.
- Looked at: `pair16-sp-a-en.jpg`, `pair16-gs-a-en.jpg`, `T-gs-astro-it-p2` and `T-sp-tree-home-en-p2` sheets, the path's
  exit (`v5-home-pc`: with the pull-back the figure rises with its caption and leaves; the window with no text and no
  figure remains, +5.4..+5.75) and about.html's end into the dawn (`v5-about-end`: the caption above the day's edge, then
  WRITE TO ME on the paper).

## Gates on the final tree (18:02; `gate-*.log`)

`assemble.mjs` exit 0 (fx.css up to date, structural asserts ok), `--check` exit 0, the claims OK (34 pages); from `web/`:
`build.mjs --outDir ../.shots/j-about/dist` 34 pages, `parity.mjs` PARITY OK (150 shared files, 0 differ), `asserts.mjs`
ok (34 pages, 1,154 local references), the claims on the build OK; `VERCEL_ENV=production node web/scripts/release.mjs`
exit 0 with its three `[release]` lines (34 pages, 32 in the sitemap, 159 files, 5.5 MB). The design detector
(`impeccable detect`) on `css/page-about.css` and `parts/c-main.about.html`: no finding.

## The Astro build's router into About (`_scripts/astroab.mjs`, 5454, 390x844, EN and IT)

- From work.html, a click on the header's About flown by the router (soft): the marks on the sections `stack+out path+in
  dawn`, `M.rail` with its one join at y 7,596 (dx 429), the eye x 209 before the join, 417 at the hand-over (the stack's
  last layer and the path's first two panes in the frame), 636 after it; the header "Capabilities" / "Competenze" at the
  stack's last caption and no name at the path's head (its caption holds the scene's title); consoles clean.

## The director's four notes, proved (the follow-up, 23 Nov evening)

- A short follow-up of this lane, on the same uncommitted tree (`e33bd73` + J2c1). Notes: (1) the textures at Work →
  stack, (2) the stack's own law in the caption, (3) about.html's path at the dawn, (4) the years that snap.
- Servers: 5455 the tree (`python scripts/serve-static.py 5455 public`, launcher 30916 / listener 3144), 5456 HEAD's
  export (`git archive e33bd73 public` into `.shots/j-about/head2`, served from `head2/public`, launcher 33352 / listener
  5440). Probes in `.shots/j-about/_scripts/` (new ones named below), captures in `.shots/j-about/n*-*/`.

### Note 1, the textures at Work → stack: FAILED after a visit to the page's end, fixed (wave 9, J2c1 CHECK)

- New probes: `texjoin.mjs` (CDP finger strokes across the home's gallery → stack join; per rAF what the host handed the
  stage for every plate, its picture `tex` / etched `etch`, its box on screen through the frame's camera, whether the
  stage holds each texture right then; every texture console line stamped; 50 ms strips of the screencast, each frame
  labelled with its blanks) and `evictj.mjs` (k-smooth's `evict.mjs` on an upright phone, across a join: a reader's walk
  down and back, the textures named / GONE at each stop, per rAF a plate drawn without its picture or name).
- First round, the tree at 390 EN (`n1-gs-tree-en-p2`, 8 strokes: forward flick, drag, fast flick, slow drag; back
  flick, drag, fast flick, a long walk back into the gallery): a plate drawn ON SCREEN without its picture or name 0
  frames, a texture id the stage no longer holds 0. But 28-74 `[stage] texture … lost its layer: made again` lines a
  stroke: while both scenes hold the screen the gallery's six page captures (asked every frame through `ctx.imgs`, five
  drawn raw on earlier plates, one under its lifted picture), its lifted picture, its five etched words and the stack's
  eight names (made again a few times a second while it is on screen, all eight though one or two are glass) are 20
  textures for the plates' 16 layers, and they take each other's layers all the time. HEAD the same strokes
  (`n1-gs-head-en-p2`): 0 blank, the same churn (37-75 lines a stroke). `evictj` on the tree: across the join and back 0;
  to the page's end and back up, 2 rAF frames of the last plate without its picture (out of the frame there).
- Second round, strokes that stress it (`n1b-*`): the first arrival right after the load (the stack makes its eight
  names as the reader comes), ping-pong flicks and drags across the join, and the same strokes after a visit to the
  page's end. The tree: first arrival and ping-pong 0; AFTER THE END the last plate (Supply Chain) came into the frame
  as EMPTY GLASS: a back flick from the stack's head 168 rAF frames (`n1b-gs-tree-en-p2/strip-l-flick-after-end.jpg`:
  600 → 1700 ms the plate slides in from the left with no picture, its caption under it; the picture lands at 1750),
  a slow walk back 75 frames (0.5 s on screen). HEAD the same strokes (`n1b-gs-head-en-p2`): 0 (its plate rides off the
  top and the two figures do not share the screen there).
- The cause, from the stamped lines (`l-flick-after-end/log.json`): the lifted picture was made again at 202 ms (the
  1.5 s window of `fx-stage.js` `held()` starts), the stack's names cap2-cap5 were made again at 413 ms (the stack on
  screen at its head) and cap5 took layer 6, the lifted picture's: at that moment the plate stood whole OUT of the frame
  (the eye at the stack's place; the rail keeps a join's figures whole), and `plates.js` marks as drawn only the plates
  on screen, so its picture was the least recently drawn. From 420 ms the host handed the plate with no picture, the
  window refused to make it again until 1706 ms, and the plate slid into the frame at 600 ms.
- The fix (`fx-stage.js`, wave 9, J2c1 CHECK): a texture that a plate handed to the stage THIS frame names is asked
  urgently (`held(id, true)` in the slab loop): made again at once, not after the 1.5 s window, unless its last making
  never landed (`landed`: a failing source keeps the window). Only another texture's making can take its layer, so it
  is never made twice for nothing; everything else (`ctx.imgs`, the scenes' periodic look) keeps the window. The
  stack's names and the path's dates were already made again at once by `etch()` (it rasters anew when not held); the
  gallery's lifted pictures and etched words, made once by the scene, were the ones left waiting.
- Proved (the same 13 strokes: first arrival, a-h, ping-pong i-j, after the end k-l): the tree at 390 EN, 393 EN,
  390 IT, 393 IT (`n1c-*`, 52 strokes; `n1d-*`, the same 52 again, run with a second change since dropped as a no-op,
  below) and once more on the final code at 393 EN (`n1f-gs-tree-en-p3`, 13): 117 strokes, a plate drawn on screen
  without its picture or name 0 frames but one (below), a texture the stage no longer holds 0; the lifted picture, when
  it is lost while its plate stands out of the frame, is made again at once and back the next frame
  (`n1c-gs-tree-en-p2`, `l-flick-after-end`: lost 220 ms, back 227; `k-back-after-end`: 5,503 → 5,513). Looked at:
  `n1c-gs-tree-en-p2/strip-l-flick-after-end.jpg` and `n1f-gs-tree-en-p3/strip-l-flick-after-end.jpg` (the plate
  slides in from the left with its class diagram in every frame), `n1-gs-tree-en-p2/strip-a-fwd-flick.jpg`,
  `strip-e-back-flick.jpg`. `evictj --full` with the on-screen test (`n1e-evict-gs-tree-en-p2-full`): down to the end and
  back up, the last plate without its picture 2 rAF frames, both OUT of the frame; HEAD the same walk 0.
- Left, for the director: (a) one rAF frame (393 EN, `n1c-gs-tree-en-p3` a-fwd-flick, 423 ms) the stack's closed block
  came into the frame at the right edge without CORE: the stack's other names, made again at 419 ms, took CORE's layer
  while the block stood out of the frame, and `stage.slabTexture` uploads one texture per task (`stage.js` texTurn), so
  a texture made again is drawn from the next frame; not seen again in 52 later strokes. Tried and dropped: taking a
  canvas as held as soon as `slabTexture` returned (it never is: `_scripts/etchorder.mjs`, `hasTexture` false right
  after the call). Protecting the textures of a plate held whole out of the frame is `plates.js`'s LRU (it marks only
  plates on screen as drawn), outside this lane's code. (b) The churn itself (28-145 "made again" lines a stroke while
  the gallery and the stack share the screen: 20 textures for 16 layers, the six page captures asked every frame) is
  HEAD's too. (c) Out of the join: a pane of the path is drawn on its FIRST frame without its date (the date is made
  that frame and handed over the next), on HEAD at alpha 0.01-0.04, on the tree n0 and n1 at 1 (out of the frame, at
  the stack → path join) and n2-n4 at 0.02-0.34 in a 1,500 px/s walk (`_scripts/pathetch.mjs`; `evictj`: two of them on
  screen): the caption band brings two or three panes in at once. One frame each, the first time only.

### Note 2, the stack's own law in the caption: HOLDS

- New probe `stacklaw.mjs`: at rest in the middle of every step (the head and the eight) and across every boundary
  (local 0.96 of a step, the boundary itself, 0.04 of the next), a still and what the host handed the stage (which
  layers are glass, their presence, the etched name and whether the stage holds it), the outlines' formation weight, the
  caption shown, `stage.stats().plates`; then a slow finger down through the nine steps and back up, per rAF.
- about.html 390 EN (`n2-tree-about-en-p2`) and it/about.html 393 IT (`n2-tree-about-it-p3`): at rest at every step
  exactly one glass layer, the step's (l(k-1) at step k), presence 1, its name etched and held (cap0..cap7 = the steps'
  titles: Core … Creative, Linguaggi … Creatività), `plates: 1` drawn; the outlines' formation at weight 1 (the other
  seven are outlines of light). At the head the closed block's top layer (l0, CORE) is the glass one, as on HEAD.
  Across each of the seven boundaries two layers dissolve, presences summing to one: 0.835 + 0.166, 0.511 + 0.489 on
  the boundary, 0.166 + 0.835 (sum 1.000-1.001), the caption handing over at the boundary. The walk (14,189-14,356 rAF
  frames): one glass layer 12,302-12,721 frames, two 1,635-1,887, three or more 0, a glass layer without its name 0,
  the presences' sum off one by 0.01 at most.
- Looked at: `n2-tree-about-en-p2/sheet.jpg` (all 30 places), `17-s5_rest.jpg` (AI: one glass layer, AI etched, seven
  outlines, the caption at the foot), `15-s4_5_0.jpg` (BACK-END & DB and AI melting into each other).

### Note 3, about.html's path at the dawn: two of four held, the paper FAILED, fixed (wave 9, J2c1 CHECK)

- New probes: `dawnpath.mjs` (stills at rest with the day's edge at 1.1 … 0.1 of the screen: the frame as drawn and the
  same frame with the canvas hidden; on every pixel that is paper in the DOM alone, the drawn frame against #f3f4f6;
  a red mask of what differs; the scene's plates projected through the frame's camera against the edge; then a slow
  drag, a flick and a drag back across the edge, 50 ms strips, per rAF the same plate test), `dawnwho.mjs` (the same
  paper count with the dawn's threads, or the path's line, or its air taken out of what the stage is given: what
  disappears was drawn by it), `dawnforms.mjs` (the formations and the frame's camera at each place), `viewy.mjs`.
- Before (the tree, 390 EN, `n3-tree-about-en-p2`; HEAD `n3-head-about-en-p2`; work.html as the reference
  `n3-tree-work-en-p2`): no plate over the paper (0 in every still and every film frame); the path's line never on the
  paper (`dawnwho`: taking the line out changes no paper pixel); the last caption rises with the page above the edge.
  BUT the paper: with the edge at 0.8 → 0.65 of the screen the dawn's threads lay on the paper as soft blue lines up to
  211 px BELOW the edge (38-41 k px over 8 levels), and the path's air left faint dots (1-3 levels, 1-8 k px). The
  camera says why (`dawnforms`): one camera draws the frame, and the path's eye is on its way back from behind the
  last pane to the straight view over local 0.5..0.9 of the last step, exactly while the edge rises from the screen's
  foot to 0.6 of it; the threads lie on the page at the edge, and through that camera they land below it. HEAD was
  worse (its eye deep until the last text has gone: the threads across WRITE TO ME. at 0.4). On Work the camera
  stands at the straight view and the threads cross the edge from its first frame.
- Tried and dropped: the eye back by local 0.5 instead of 0.9 (`n3b-tree-about-en-p2`): the threads at the edge from the
  start, but the band stood EMPTY under the last caption (local 0.4-0.5: the straight view of the caption band shows
  only the far pane, cut by the right edge), against the caption grammar's own law.
- The fix (`stage/scenes/path.js`, wave 9, J2c1 CHECK): in the caption band at the scene's end, while the eye is not yet
  back (m < 1) and the day is on screen, a keep-out over the day (no ink inside it), lifted from the edge down as the
  eye arrives (m 0.85..1). Only about.html's phone grammar reaches it (the home's path ends in Consulting, no day; a
  desktop has no caption band).
- After (390 EN `n3c-tree-about-en-p2`, 393 IT `n3c-tree-about-it-p3`): the paper EXACTLY #f3f4f6 on every paper pixel
  with the edge at 0.95, 0.9, 0.85, 0.8, 0.75, 0.7 (100.00 %, 64-393 k px); from 0.6 the threads cross the edge, their
  ink within 40-43 px below it, as on Work (41-49), the rest of the paper 96-98 % exact (the threads' own halo, Work's
  the same); no plate over the paper in stills or films (drag, flick, back); the line never on the paper. Looked at:
  `n3c-tree-about-en-p2/sheet.jpg` and `n3c-tree-about-it-p3/sheet.jpg` (the paper clean, no red in the masks until the
  threads), `drag-keep.jpg` (1,800-3,400 ms, clean paper as the edge rises), `drag-keep-end.jpg` against Work's
  `n3c-tree-work-en-p2/drag-end.jpg` (right after a drag both show the threads as a soft band of dots AT the edge,
  settling into lines).
- Its last caption and pane: the caption rises with the page above the edge, as Work's; the pane (JAN 2022 / GEN 2022)
  leaves by receding as the eye comes back and fading with the morning (alpha 0.95 → 0.04 from edge 0.95 to 0.7),
  never over the paper, while the straight view's other panes show faintly as it goes (0.04-0.2). It does not RISE
  with its caption as Work's plate does: J2c1's `dy` (the view's y, `f.y`) is 0 there, because the sticky view
  (`.sc-view`, margin-bottom -100svh) stands at the top until the section has wholly left (`viewy.mjs`: viewTop 0 with
  the section's foot at 591; the same on the home). Left for the director: a pane that rides up with its caption needs
  the scene's own lift (the gallery's `out`), not the view's y.

### Note 4, the years snap: HOLDS

- New probes: `snapcount.mjs` (every beat of a year's column, `Element.animate` on an `.od-s` inside `.stp-when`, logged
  from the page's first script; per rAF each step's focus and its caption's opacity; a finger down the path a screen at
  a time to the dawn and back up to the head, then flicks both ways) and `snapfilm.mjs` (the dates line of the arriving
  caption cut from the screencast every 33 ms, enlarged).
- about.html 390 EN, it/about.html 393 IT, the home 390 EN (`n4-tree-about-en-p2`, `n4-tree-about-it-p3`,
  `n4-tree-home-en-p2`): every time a step with years came into focus its years snapped exactly once (down 5/5, up
  5/5, flicks 2-3 each way; 15, 13, 15 snaps), a focus with no snap 0, a focus with two 0, a snap begun out of focus 0,
  a snap run under a caption held clear 0, every snap seen (its caption at opacity 1 while its beats ran). A year turns
  three columns (the 0 stands still), two years six; the beats start 40 ms after the focus, 45 ms apart, 90 ms a year,
  520 ms each, over by 695-786 ms. The head (no year) never snaps.
- Looked at `n4f-tree-about-en-p2/snap-3-4.jpg` (and 2-3, 4-3): JAN 2026 clears, NOV 2025 – FEB 2026 comes into focus
  with its columns turning from 0000 through 2011, 2024 to 2025 and 2026, still by 2,080 ms.

### Gates on the final tree (19:28-19:30)

`assemble.mjs` exit 0 (pages and fx.css up to date, structural asserts ok), `--check` exit 0, the claims OK (34 pages);
from `web/`: `build.mjs --outDir ../.shots/j-about/dist2` 34 pages, `parity.mjs` PARITY OK (150 shared files, 0 differ),
`asserts.mjs` ok (34 pages, 1,154 references), the claims on the build OK; `VERCEL_ENV=production node
web/scripts/release.mjs` exit 0, three `[release]` lines (34 pages, 32 in the sitemap, 159 files, 5.5 MB). Logs
`.shots/j-about/gate2-*.log`. The code changed in this follow-up: `fx-stage.js` (held urgent, `landed`) and
`stage/scenes/path.js` (the day's keep-out); no page or `fx.css` changed. Not changed: HANDOFF.md, build/j-mobile.md
(HANDOFF.md shows modified in the tree: not by this follow-up). A desktop and a phone held sideways are untouched by
construction: the keep-out lives only in the caption band, and the urgent ask changes only when a lost texture is made
again. Servers 5455 and 5456 stopped by pid at the end (ports free, no probe process left). Nothing committed.
