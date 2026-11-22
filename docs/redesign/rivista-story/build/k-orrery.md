# k-orrery — the figure in "Now at SerSan" (wave 8, lane ORRERY; session portfolioalbertotuveri-viva-27)

- **Brief (the director, 21 Nov, 20:20):** Alberto: «nella sezione 1 now at sersan , non mi piace la card con lo
  screenshot del sito . al posto della card possiamo fare qualcosa di molto piu wow. allo stesso livello del logo a
  doppio strato di spore che ho fatto nel sito di sersan . sorprendimi . puoi fare anche un sistema solare dove cosa
  ruotano sono i tipi di lavori che faccio (quindi le competenze ) […] e al centro c'è il logo 3d di sersan». The
  plate with the sersan.io capture goes; in its place a 3D figure: the SerSan mark in two layers of light at the
  centre, his competencies turning round it (figures of points, or stones of cut glass), on orbits never drawn.
- **Rules of this lane:** until the director's «via libera» only NEW files (this note, new modules under `stage/`,
  `.shots/orrery/`); never now.js, strings.mjs, the partials, the CSS, fx-stage.js, stage.js (FIX2D and FIX3D own
  them). Ports 5420–5429. Headless probes only (`launch()`). No commit, no download, no install.
- **State (21 Nov, 20:45):** scouting. Read: scenes/README.md, scenes/now.js, scenes/bench.html, serve-static.py
  (with two roots a non-page file comes from the LAST root that has it: an overlay root goes last). The impeccable
  context ran from its cached engine.
- **Next:** the maps in `.shots/orrery/maps/*.md` (engine pass API, the cover's shot, light figures, the sersan.io
  logo, facts, probes, glass), then the design, then the build on an overlay root served with `public`.
- **Asked and answered (Alberto, 21 Nov, about 20:55, with the question tool):** «reverse engineering» is nowhere in
  PRODUCT.md, strings.mjs or cases.json: he chose **«Sì, mettila»** (it orbits, labelled "Reverse engineering"; the
  source is his words of 21 November: the director records them in PRODUCT.md before the label is printed).
  «Aziende automatizzate»: he chose **"Business automation" / «Automazione aziendale»** (backed by "custom software,
  automation and AI studio" and SerSan Agent OS, PRODUCT.md §3.10). He also offered Blender («se serve blender fammi
  sapere che te lo apro»): not needed so far, the figures are generated in code.
- **Sources looked at before building (no component enters the site):** Magic UI "Orbiting Circles", "Particles",
  "Floating 3D Particles"; ui-layouts "Sparkles"; Vengeance UI "Solar System" (tech logos on drawn orbits); OriginKit
  nothing; 21st.dev not connected in this session. All refused: DOM or canvas-2D components that draw the orbit's
  ring and bubbles of logos (the category's rut, PRODUCT.md §7), or a second canvas. The figure is the stage's own.
- **Run 1 (read-only maps) was cut:** `wf_df9a0f74-c33`, seven readers launched 20:50, all stopped at 20:57 by the
  5-hour limit (shared with the director's lanes); no map was written. The lesson is CLAUDE.md §3's own: one lane at
  a time. No reader is relaunched: the builder reads what it needs.
- **The director, 22 Nov, 00:58:** the «via libera» comes only when the whole wave 8 is back (FIX2D, FIX3D, INTEGRATE
  and DOCS), since INTEGRATE runs the gates over the whole tree. Until then: new files and the bench only.
- **Where the lane's files live until then:** in an OVERLAY root, `.shots/orrery/www/proto/rivista/…`, at the URL
  paths they will have on the site (`stage/orrery/*.js`, and a copy of `stage/scenes/now.js` carrying the change),
  served with `python scripts/serve-static.py 5420 public .shots/orrery/www` (pages from `public`, any other file from
  the overlay first). Nothing under `public/` changes before the «via libera».

## The design (the lead's decisions, 22 Nov; Alberto: «sorprendimi»)

- **One extra pass, id `orrery`** (`registerPass`), stateless on the stage's clock. It takes the plate's place in the
  cover's one shot: the same place, entrance, ride and leave; far behind the name it is the small lit thing the eye
  flies to. The swarm's soft field stays behind the mark. No slab in Now any more.
- **The centre: the SerSan mark as a volume of light in two layers.** The cut: a white-hot front face of fine points
  with receding cobalt contour layers behind it (the cover name's recipe). The spores: larger soft motes hovering just
  off the form, breathing along its normals and sliding along it (the feel of the sersan.io logo, read in its source).
- **Nine bodies in three shells**, on nested orbits seen from about 45°, never drawn and never crossing the mark on
  screen: engineering (Full-stack software · 3D & WebGPU · Reverse engineering), AI systems (Multi-agent systems ·
  Business automation · Claude Code practice), creative (Video editing · Motion design · AI-generated content). Each a
  small figure of points with straight edges and its own spores, swaying so it stays readable. No sphere, ring, gear
  or disc; lines read as lines of light, never as beads on a thread.
- **Words** drawn by the pass as light at the type floor, only for the bodies on the near arc and the one under the
  hand. At integration the same words are a DOM list: the figure's accessible content, and what the printed states
  show where the picture was (no new image file).
- **Arrival:** from the hero's rest pose a small bright mark in dust; the bodies condense as the flight ends (a
  function of the scroll, so it reverses). **The hand** tilts the system a few degrees with the plate's spring; a
  press flashes the core; the body under the pointer comes forward and names itself.
- **Italian labels (for the strings, at integration):** Software full-stack · 3D e WebGPU · Reverse engineering ·
  Sistemi multi-agente · Automazione aziendale · Claude Code (Consulting's own wording) · Montaggio video · Motion
  design · Contenuti generati con l'AI.
- **Run 2 (the build):** workflow `orrery-build`, run `wf_04dff27e-709` (task `wo92r7gdi`), launched 22 Nov 01:10,
  one agent at a time (builder, critic, at most one fix round). Script:
  `C:\Users\alber\.claude-albi\projects\C--Users-alber-Desktop-PortfolioAlbertoTuveri-viva\fcd41c0d-79e9-4b80-83ca-74bed9dfd9c1\workflows\scripts\orrery-build-wf_04dff27e-709.js`
  (the full brief is in it). To continue after a cut, from the same session: that `scriptPath` with
  `resumeFromRunId: 'wf_04dff27e-709'`; from another session, launch the script by its path: the builder continues
  from the "Build log" below.

## What the lead still owes (after the build)

1. Look at the captures the builder and the critic list; decide; one more fix round only for what Alberto would mind.
2. Message the director (`SendMessage` to `portfolioalbertotuveri-viva-3f`): the summary, the files, the numbers,
   the paths of the captures, what waits for the «via libera». Servers stopped (ports 5420–5429 free).
3. After the director's «via libera» (the whole wave 8 back), the integration: copy
   `.shots/orrery/www/proto/rivista/stage/orrery/` to `public/proto/rivista/stage/orrery/`; carry `now.diff` onto the
   real `stage/scenes/now.js` as FIX3D left it; the nine words in `parts/strings.mjs` (EN and IT twins) and as a DOM
   list in `parts/c-main.index.html` in place of `<figure class="now-fig" data-stage-poster>` (the list is what the
   printed states show; with the stage on it stays in the accessibility tree); its styles in `css/page-cover.css`;
   `now.alt` goes if nothing prints it; «reverse engineering» recorded in PRODUCT.md by the director before it is
   printed. Then the gates: `assemble.mjs`, `--check`, `check-claims-proto.mjs`, the Astro build into
   `.shots/orrery/dist` with parity, asserts and claims; then the pages looked at, both editions, the three sizes,
   stage on and `?stage=0`; GPU against the live site; the stage asleep. No commit: the director commits.

## Build log (the builder writes below)

- **22 Nov, builder run A, step 0 (state on arrival).** Nothing existed before this run: no `.shots/orrery/`, no
  log entry, ports 5420 and 5421 free. Plan: (1) read the engine (scenes/README.md, now.js, cover/shared.js and
  world.js, lib/prism.js, splat.js and its WGSL, draw/frame WGSL, registerPass and busy() in stage.js, the pass
  weight in fx-stage.js, the mark in atlas.js and gen.js) and the sersan.io mark's source; (2) write
  `.shots/orrery/www/proto/rivista/stage/orrery/` (bodies.js: the point lists; orrery.wgsl.js; labels.js; orrery.js:
  the pass) and the overlay copy of `stage/scenes/now.js`; (3) serve on 5420, ONE batched round of looking at the
  three sizes, one fix batch, one confirming round; (4) the numbers; (5) `now.diff`, "For integration", server stopped.
- **Files so far:** none. **Server:** not started.
- **22 Nov, run A, milestone 1: EVERYTHING EXISTS AND DRAWS** (first load clean: `[orrery] ready: tier A, 48,265 points
  (built in 258 ms, longest slice 3 ms)`, `[stage] pass "orrery" ready (over the swarm)`, GPU 0.43 ms for Now at 1440).
  - **Servers (this run's, to stop by pid):** 5420 = `public` + the overlay (pid 31732), 5421 = `public` alone (pid 16848).
  - **The overlay** `.shots/orrery/www/proto/rivista/`: `stage/orrery/bodies.js` (the points: the mark from the end
    card's crop, the nine bodies, the golden-step order, the tier prefix), `stage/orrery/orrery.wgsl.js` (the sprites,
    the words), `stage/orrery/labels.js` (the words' atlas, 2D canvas at the DPR), `stage/orrery/orrery.js` (the pass
    `orrery`, `orreryLayout`, `orreryStats`), `stage/scenes/now.js` (the copy with the change between
    `(wave 8, ORRERY) begin / end` marks).
  - **Probes** `.shots/orrery/_scripts/`: `facts.mjs` (what the engine says), `look.mjs` (stills along the flight, the
    pass's stats and console), `sheet.mjs` (contact sheets and crops).
  - **Facts found in the code (they change the brief):** (1) the host runs a scene's `frame` only from 1.6 screens above
    its section (`fx-stage.js`, `near`): with the hero 190svh tall, Now's frame does not run at the hero's rest pose (y <
    0.3 vh), so nothing Now returns is drawn there; the live site's plate, too, only comes in a sixth of the way down
    the flight (`stats().plates` 2 at rest, 3 at y 342). For the figure to be seen from the rest pose the HERO's answer
    must ask for the pass: in the overlay now.js wraps `hero.frame` at run time (a bench bridge, `FROM_REST`), since
    this lane may not edit hero.js; at integration it is two lines in hero.js. (2) `blend: false` gives the pass
    weight 1 whenever a scene asks: the figure's presence is its own `a`. (3) The stage redraws whenever the JSON of the
    passes' config changes: every number Now sends is rounded and settles exactly, or the stage never sleeps. (4) With
    plates on screen an "over" pass is drawn into the light the plates bend (behind the hero's two plates).
  - **The recipe taken from the sersan.io mark** (`sersan-v2-main/src/webgl/gpgpu/sporePresets.ts`, `gpgpuConfig.ts`,
    read only): two shells sampled on the mark's surface, a bright pinned CORE (emission 1, stiff spring, it only
    shivers) under an outer CRUST of spores pushed out along the normal by about one radius (`normalOffset` 0.022 of
    the mark's height, `volumeJitter` 0.015), spore diameter the mark's height / 47 with a variance of 0.7 to 1.45,
    packed until they touch; the crust is dim at rest and sprays, hangs and eases back under the cursor (under-damped
    spring), showing the core; a dark solid under both. Here: the core is the cut (the white-hot face of fine points
    and its receding contours), the crust is the spores (motes 0.8 to 2.6 px of sigma, proud of the form by 0.03 to
    0.09 of its height, few large and many small, breathing along their normals and sliding along the form on the
    stage's clock, lifting and lighting under the hand); cobalt and paper white only, light and not shaded balls.
- **Next:** ONE batched round of looking (1440: the flight in eight stills, a strip, 1:1 crops; 390; 1920), one fix
  batch, one confirming round; then the numbers.

### run B (22 Nov, from 06:40): the continuation

- **run B, step A (what was on disk).** Run A was cut at about 01:50 after its second round of looking; its log stops
  at milestone 1. On disk: the four modules and the scene copy in the overlay (bodies.js 462 lines, labels.js 49,
  orrery.js 341, orrery.wgsl.js 297, scenes/now.js 302); the probes `facts.mjs`, `look.mjs`, `sheet.mjs`, `strip.mjs`
  and `fix1.py`; three rounds of captures (r0, r1, r2). No server was running (ports 5420 to 5429 free). The real
  `public/proto/rivista/stage/scenes/now.js` is unchanged since run A copied it (170 lines, last commit `bd7fe4a`,
  not in `git status`): FIX3D has not touched it so far.
  - **What fix1.py changed (run A, 01:44, not logged then):** orrery.js: the system faces the straight view's eye from
    its resting place (`hx`, `hy`), the inner orbits a little wider on a low band, the mark 2 px taller, the dust dim
    far down the hall, the spores' light by the figure's size, the word's distance from its body; the WGSL: the
    spores' light, a quieter flash; bodies.js: the mark one contour layer deeper, a cooler face, fewer wall spores,
    larger motes; now.js: `planeAt` and the far placing (at rest in the empty room under the name, then dead ahead
    behind the gap in the name), `hx` / `hy` sent, the glow behind the mark at half strength, a softer bloom.
  - **Servers of run B (to stop by pid):** 5420 = `public` + the overlay, **pid 2000**; 5421 = `public` alone,
    **pid 12872**.
  - **Next:** step B, the lead's fix batch (the carousel, the words, the arrival, the far mark, the phone), with the
    gap probe.
- **run B, step B (the fix batch; done 22 Nov, about 08:40).** Files: a NEW module `stage/orrery/layout.js` (pure: no
  GPU, no DOM; the pass and the probe evaluate the same functions; node can import it), `orrery.js` and
  `orrery.wgsl.js` rewritten round it, `bodies.js` (the hulls; the tiers by rank), `labels.js` (a word's box cut to
  its ink), the scene copy `scenes/now.js` (the fit; `A` alone). The throw-away patches are `_scripts/fix2a.py` …
  `fix2e.py`; the probes `gap.mjs` (the proof, in the page), `scan.mjs` (the same proof in node, for tuning),
  `sizes.mjs`, `ext.mjs`, `dbg.mjs`, `tiers.mjs`, `hov.mjs`, `cast.mjs`, `room.mjs`.
  1. **The carousel** (`layout.js`). One angular speed, a turn in `TURN` = 80 s of the stage's clock; the nine 40
     degrees apart, the shells alternating 1, 2, 3 round the turn (stack, agents, clap, tess, chain, curve, apart, term,
     gen); every period of a body's own life (sway, nod, a breath of 2.2 % in its radius, a bob of 7 % of its unit
     off its plane) and of the mark's sway DIVIDES the turn, so the system comes back exactly after 80 s and a scan
     of one turn has seen every pose there is. **Two shapes of fixed proportions**, every length a share of `A` (the
     outer orbit's radius), so what is proved at one size holds at every size: `open` (the figure's half: radii 0.69,
     0.84, 1, the planes leant 32.9, 39.2 and 43.1 degrees, nested, each turned a few degrees about the view axis;
     a body's unit 0.184 A, the mark 0.555 A tall) and `band` (a phone's low band, below). The scene fits `A` to its
     room with the shape's reach (`EXTENT`, the probe's own measure) and keeps 40 px past it all round on a desktop.
     Each body has a size of its own against the unit (a cube seen corner-on is wider than a flat figure: 0.76 to 1).
  2. **A figure's reach, and the gap.** `bodies.js` keeps for each figure a HULL: the points that reach furthest in
     128 directions, over the whole of what moves inside it (the cube's blocks apart, the stack's gaps, the clapper
     open, the scattered points, the motes). `orreryBoxes` turns the hull as the figure stands, projects it, pads it
     for the motes' drift (4 px, less on a small figure) and takes its least and most along SIX directions (every 30
     degrees: a box's sides and a hexagon's). The gap between two figures is the widest clear band along those six: it
     is never more than the true distance between what the two draw. (A plain box was wrong for the mark: a body
     passing a hexagon's empty corner "overlapped" it.)
  3. **The words** (`orreryWords`): the body under the hand first, then the nearest the front; three on a desktop
     (a window of 59.6 degrees each side of the front), one at a time in a band (the one leaving is out before the
     next comes in); under its body's box on the near arc, over it on the far arc; a word that would come within 11
     px of the mark, of ANY body or of a word already standing fades and is gone at 5 px, before it touches. The
     window's own fade is 1.3 degrees of turn, about 0.3 s.
  4. **The arrival**: no dust across the system any more. A body is not there until its turn; then each point comes
     from a scatter one and a half of the body's size round the body's own place; the nine in their order round the
     turn, 0.02 of the flight apart (about 34 px of scroll at 1440).
  5. **The far mark**: it takes no share of the stage's lens (sharp at any distance); under 16 css px on screen (12 in
     a band) it fades and is gone at 12 (9); its motes come in only from 40 px up. At the hero's rest pose it is 33
     px at 1440 and 16 px on the phone.
  6. **The phone** (`band`): nine bodies of 44 px do not fit a band 378 x 225 at one scale with a mark in the middle
     and the far arc clear of it, so the band's carousel is seen by an eye of its own, close (2.1 A): what is near is
     large, what is far small (the pass places and sizes each body so that the stage's own camera, straight, shows
     exactly that). Its three orbits are solved from where their near and far arcs must pass (0.545 A under the mark's
     centre, 0.46 A over it), so they nest across only. One word at a time; a third of the hand's tilt; less sway.
  7. **Found on the way, and fixed: the tiers.** Run A's tier was a golden step over a body's whole list; for some
     lengths (the clapper's 2014 points: 55 steps come back one short) that keeps runs of twenty points and drops
     sixteen, so a phone's tier B drew DASHES, and its low-density lines DOTS (the law: a line is never a row of
     dots). Now every point carries a rank given by what it belongs to (along a line the golden rotation of its own
     index, in a fill the order it was made in) and a tier keeps the points under its share: A all, B 70 %, C 45 %,
     each point wider by nearly as much as they are fewer.
  - **THE GAP PROBE** (`node .shots/orrery/_scripts/gap.mjs 5420 r4 1280,1440,1920,390`): in the page, the pass's own
    proof (`orreryProof` -> `layout.js orreryScan`: the real hulls, the words' atlas, the config the scene sends), the
    clock stepped through a whole turn in 1600 steps, under the straight view. Smallest gap between two bodies /
    between a body and the mark (css px):
    | size | A | the mark | a body at the front | bodies | body and mark | the hand at its furthest | a body held |
    |---|---|---|---|---|---|---|---|
    | 1280x800 | 247.7 | 120 x 137 | 47 to 58 | **42.7** | **23.3** | 23.1 / 11.0 | 39.7 / 22.0 |
    | 1440x900 | 313.4 | 152 x 174 | 60 to 74 | **53.2** | **28.6** | 28.3 / 13.1 | 49.6 / 27.2 |
    | 1920x1080 | 462.9 | 224 x 257 | 90 to 110 | **80.0** | **43.1** | 44.1 / 20.1 | 74.4 / 41.6 |
    | 390x844 (tier B) | 146.5 | 57 x 65 | 45 to 54 (20 to 25 at the back) | **11.1** | **10.9** | 6.5 / 5.0 | (no pointer) |
    Room left past every figure's reach (left, right, up, down): 40, 42, 144, 152 at 1280; 41, 42, 139, 143 at 1440;
    43, 40, 108, 96 at 1920; 4, 4, 1, 30 on the phone (the 30: the word's line). Words: at 1440 and 1920 three at once
    all the turn, none ever gives way, the least clear a lit word is 24.8 px (62.3 at 1920); at 1280 the third gives
    way 13 % of the turn (2.8 words on average) and a lit word is never nearer than 5.5 px to anything; on the phone
    one, never nearer than 43.6 px, no word for 4.6 % of the turn (the hand-over). The type: 16 css px at 1280, 17 at
    1440, 20 at 1920, 16 on the phone.
    The scan's straight view against the camera a frame is drawn with: 0.6 px on the phone; 8 to 16 px on a desktop
    with a pointer on the page (the hand turns the eye a little: the whole figure shifts together, the gaps hold: the
    live frame's own gaps were 54 / 36 at 1440).
  - **Looked at** (`.shots/orrery/r3`, `r4`): Now in place at 1440 and on the phone, the flight at both (six stills
    each), the far mark 1:1, a strip of twelve frames 52 ms apart (the browser's screencast), the hand on a far and
    on a side body, a press, 1:1 crops. Nothing collides; the far mark is the small sharp mark; no cloud in the
    arrival; the phone's lines are lines.
  - **Next:** step C's last sheets (1920, 1280), then the numbers.

### The lead finishes run B (22 Nov, 13:56 to 14:35)

The builder was cut at 07:55 by the 5-hour limit, in step D (run `wf_c5eb66ff-07c`, `built: null`). The director asked
at 12:58 for light usage until INTEGRATE and DOCS return (no workflows, no parallel agents): the lead finished inline.

- **What the builder did after its last entry (07:25 to 07:55), read from its transcript.** The last sheets
  (`r3/v-now-1920-1280.png`). The GPU probe `gpunow.mjs` + `gpunow.sh` (l-stage's method with Now's own places) and four
  rounds: `gpu-r1.log`, `gpu-r2.log`, then `gpu-f1.log`, `gpu-f2.log` on the code as it is now. **The live site answers
  404 `DEPLOYMENT_NOT_FOUND` on every address** (the director knows: since 21 Nov 20:06), so "the live site" here is
  HEAD's own export, `git archive 551f252 public` in `.shots/orrery/head/public`, served on 5422. After r2 the phone's
  tier was trimmed in `bodies.js` (`TIER_SHARE` B 0.7 -> 0.56, C 0.45 -> 0.4, `fillRank`, every other contour layer of
  the mark the full tier's alone): Now in place on the phone cost 0.82 ms against HEAD's 0.77. `?failorrery=1` tried.
  `ffnow.mjs` written, never run.
- **The lead's two changes, both in the overlay's `scenes/now.js`** (seen in `r7`, proved in `r8`, `r9`):
  1. `FROM_REST = false`. At the hero's rest pose a 33 px white-hot SerSan mark under ALBERTO TUVERI was a second
     focal point in a first view Alberto did not ask to change. The hero's first view is as it is online, and
     **hero.js needs no line at integration** (the bridge and `import hero` go).
  2. **The figure is lit only once the name is behind the eye**: `lit = sstep(0.42, 0.56, k)` in its presence `a`, and
     the pass is not asked for while `a` is 0. From k 0.17 to 0.3 the far mark stood ON the name's letters, a dark
     spot with the mark in it (on the phone's two lines, on the V of TUVERI: `r7/v-enter-m.png`). Now: the name
     passes, a small mark lights far ahead in the open cosmos, the nine condense round it as it comes
     (`r8/v-enter-d.png`, `r8/v-enter-m.png`).
- **The numbers.** The stage's own timestamps, ms. The machine was NOT quiet in any round (the wave's other lanes were
  probing on the same GPU): overlay and HEAD were taken minutes apart in the same round, so they compare; the single
  frames in the peaks are noise on both. Rounds f1, f2 (07:47), s1 (14:17, with the lead's changes).
  | 1440x900 DPR 2 (limits 2.6 / 3.3) | the figure (5420) | HEAD, the plate (5422) |
  |---|---|---|
  | the flight, hero to Now: peak (p95) | 1.52 (1.42) · 1.28 (1.19) · 1.33 (1.20) | 1.45 (1.25) · 1.46 (1.24) · 1.35 (1.26) |
  | Now in place, at rest (two medians a round) | 0.89, 1.14 · 0.86, 1.11 · 1.03, 1.16 | 1.21, 1.47 · 1.21, 1.46 · 1.24, 1.48 |
  | Now 0.3 of a screen on (l-stage's place), at rest | 2.00 · 2.01 · 2.03 | 2.07 · 2.07 · 2.10 |
  | its peak over two screens (p95) | 3.44 (2.65) · 2.59 (2.52) · 3.12 (2.25) | 2.39 (2.32) · 3.44 (2.31) · 3.22 (2.42) |

  | 1920x1080 DPR 1 (limit 2.4) | the figure | HEAD |
  |---|---|---|
  | the flight: peak (p95) | 1.08 (0.97) · 1.66 (1.00) | 1.10 (0.95) · 1.09 (0.95) |
  | Now in place, at rest | 1.22, 1.17 · 2.44 (frames of 3.5 and 7.3 in it), 1.28 | 1.38, 1.41 · 1.37, 1.40 |
  | l-stage's place, at rest | 2.03 · 1.96 | 1.97 · 1.98 |
  | its peak (p95) | 2.82 (2.04) · 2.08 (1.99) | 2.80 (2.62) · 3.21 (2.90) |

  | phone 390x844 DPR 2, tier B (limit 1.5) | the figure | HEAD |
  |---|---|---|
  | the flight: peak (p95) | 0.48 (0.40) · 0.49 (0.40) · 1.22 (0.40) | 0.48 (0.42) · 0.98 (0.42) · 0.69 (0.54) |
  | Now in place, at rest | 0.80, 0.82 · 0.83, 0.83 · 0.81, 0.81 | 0.78, 0.78 · 0.78, 0.78 · 0.77, 0.78 |
  | l-stage's place, at rest | 0.15 · 0.16 · 0.16 | 0.22 · 0.22 · 0.21 |
  | its peak (p95) | 0.94 (0.88) · 0.93 (0.88) · 0.91 (0.86) | 0.93 (0.87) · 0.89 (0.84) · 0.89 (0.81) |

  - **Read:** on a desktop the figure costs LESS than the plate where it stands (Now in place) and the same everywhere
    else. **On the phone Now in place is 0.03 to 0.05 ms over HEAD** (0.80 to 0.83 against 0.77 to 0.78; the limit is
    1.5): with the pass off it is 0.78 to 0.80, so the pass itself is about 0.02. Not chased further: a lower tier
    share turns lines into dots.
  - **The swarm:** never halved in any of the fifteen `gpunow` runs on the overlay (tier A 160,000, tier B 80,000,
    `halvings 0 -> 0`). Two halvings were seen elsewhere, both with the pass NOT drawing and other lanes on the GPU:
    07:44 with `?failorrery=1` at 1440, 14:23 in a `look.mjs` run at k 0.3 (before the figure is lit). To be checked
    again on a quiet machine with HEAD beside it.
  - **Asleep:** 0 frames submitted in 3 s after 19 s of quiet with Now in place, at 1440 (f1, s1 and after the last
    change) and on the phone (r2, f2, s1).
  - **The first frame** (`ff2.mjs`, the lead's: one warm-up load thrown away, pairs alternated and their order
    swapped, every long animation frame with the scripts the browser blames): 1440, ten pairs: median 382 ms with the
    figure against 417 for `public` alone (quartiles 351 to 434 against 374 to 540); phone, eight pairs: 355 against
    338 (quartiles 352 to 415 against 315 to 351). No frame over 50 ms after the first frame in any load of either;
    the long frames before it are the page's own on both (boot.js; the page's `end` listener with cover/world.js
    `step`). The builder's `ffnow.mjs` (the overlay always first, no warm-up) had said 399 against 344: the order of
    the loads and the machine's load, not the figure. The module is imported after `fx:stage:frame`; its points are
    built in 345 to 399 ms in slices of at most 2.3 ms (`[orrery] ready: tier A, 48,416 points`; tier B 21,798).
  - **The failure path** (`?failorrery=1`): `[stage] pass "orrery" off: [orrery] off on purpose`, everything else
    draws, Now is its text with the room behind it (`r6/fail-d-k1.png`, `r6/fail-m-k1.png`). The nine words are then
    nowhere on the page: at integration the list prints as type when the pass is off.
- **Looked at by the lead** (`.shots/orrery/`): `r6/v-now-d-whole.png` and `v-now-d-half.png` (Now in place at 1440,
  whole and 1:1), `r6/v-flight-d.png`, `r6/m-k1.png` (the phone), `r6/d1-k1.png` (1920), `r6/v-rest-d.png` (the
  hero's first view), `r6/v-fail-d.png`, `r3/v-crops-1440.png`, `r3/v-hover.png`; `r7`, `r8`, `r9` (the entrance).
  Nothing touches anything; the mark reads as the SerSan mark with its halo of spores; three words on a desktop, one
  on the phone; the entrance is clean. **The one thing left to Alberto's eye:** at 44 to 64 px the nine bodies read
  as fine line figures beside the mark's solid light. Not reopened (bounded passes). If he minds, the levers are the
  faces' light (the fills' `ink`, 0.06 to 0.08 in bodies.js) and a body's unit (0.184 A in layout.js, with the gap
  probe run again).
- **`now.diff`:** `.shots/orrery/now.diff` (the real scene against the overlay's, 299 lines), refreshed 14:25.
- **Servers:** 5420, 5421, 5422 stopped by pid at the end of this step. **5420 is up again since about 15:00 on 22 Nov
  (pid 26236)**: Alberto asked where he could see the figure («dove posso vederlo?») and opens
  `http://127.0.0.1:5420/proto/rivista/index.html` himself; stop it by pid when he has looked. To start again:
  `python scripts/serve-static.py 5420 public .shots/orrery/www` · `… 5421 public` · `… 5422 .shots/orrery/head/public`.

## For integration (after the director's «via libera»; nothing below is done)

1. **Read first** what changed near Now: the director will say (FIX3D: the home's first frame and boot.js; SMOOTH:
   `lib/camera.js` `follow`). The real `stage/scenes/now.js` was untouched at 14:00 on 22 Nov (as committed in
   `bd7fe4a`): if it still is, the overlay's file replaces it; if not, carry `now.diff` by hand.
2. **Copy** `.shots/orrery/www/proto/rivista/stage/orrery/` (five modules) to `public/proto/rivista/stage/orrery/`.
3. **`stage/scenes/now.js`**, from the overlay's, with the bench parts out: no `import hero`, no bridge, no
   `FROM_REST`; `BENCH_WORDS` goes: the nine names are read from the list the markup prints (their order is the
   bodies': stack, tess, apart, agents, chain, term, clap, curve, gen), once per language, and again after a change
   of language in flight (as `path.js` and `stack.js` re-read their labels); when the pass is off (the import
   rejects, its init fails, `?failorrery=1`) the list prints as type.
4. **The markup** (`parts/c-main.index.html`): the nine names as a list in place of
   `<figure class="now-fig" data-stage-poster><img data-slab="now" …></figure>`; no `data-slab` any more (the capture
   is no longer loaded as a texture). Check first what `[data-stage-poster]` does with the stage on (`css/scene.css`)
   and where the host takes `c.fig` from: the figure's box must keep the room the scene fits `A` to.
5. **The strings** (`parts/strings.mjs`, EN and IT twins): Full-stack software / Software full-stack · 3D & WebGPU /
   3D e WebGPU · Reverse engineering · Multi-agent systems / Sistemi multi-agente · Business automation /
   Automazione aziendale · Claude Code practice / (Consulting's own Italian wording) · Video editing / Montaggio
   video · Motion design · AI-generated content / Contenuti generati con l'AI; a label for the list; `now.alt` goes
   if nothing prints it. «Reverse engineering» is Alberto's own word (21 Nov) and he confirmed it with the question
   tool: the director records it in PRODUCT.md before it is printed.
6. **The styles** (`css/page-cover.css`): the printed list on the type scale (no size written by hand), the old
   picture's rules out.
7. **The gates:** `node public/proto/rivista/assemble.mjs`, `--check` (an assertion may name the old figure),
   `node scripts/check-claims-proto.mjs`; from `web/`: `node scripts/build.mjs --outDir ../.shots/orrery/dist`,
   `parity.mjs`, `asserts.mjs`, the claims on it. The mark's source is `/captures/sersan-brand-end-1600.webp`
   (already published: `field/atlas.js` reads it); `bodies.js` reaches it with a path relative to the module: check it
   on the release, where the site is at the root.
8. **Look:** both editions, 1440x900 and 390x844 DPR 2, 1920x1080 DPR 1, the stage on, `?stage=0`, reduced motion,
   `?failorrery=1`, print; a strip at 50 ms; the Astro pages too (a flight to another page and Back).
9. **Measure on a quiet machine, twice:** `sh .shots/orrery/_scripts/gpunow.sh <tag> d "5420 5422" d d1 m` (with the
   overlay replaced by the integrated tree's port), `ff2.mjs` at both sizes, the sleep, the halvings with HEAD beside.
10. `impeccable detect --json <changed targets>` once; one independent review of the change; then the message to the
    director. No commit: the director commits.

**The director's answers (22 Nov, about 14:50), to the lead's status message:**
- The «via libera» comes WITH A COMMIT SHA: rebuild `now.diff` and every edit against that commit, not against the
  disk as it is today (INTEGRATE is still running and may touch the files again).
- The order before it: wave 8 returns (INTEGRATE, DOCS), the director commits by topic, the production address
  changes in a commit of its own (the real domain is https://albertotuveri.sersan.io; portfolio-jet-eta-24.vercel.app
  was detached from the project on 21 Nov: that is the 404), wave 8 goes online, PRODUCT.md, then the «via libera».
  Until then: no agents, no workflows.
- PRODUCT.md: the director records «Reverse engineering» and «Business automation» / «Automazione aziendale» in a
  commit of their own before the «via libera». Print nothing that is not there by then.
- The phone's 0.03 to 0.05 ms over HEAD is accepted if a quiet measure at integration keeps it within about 0.05
  (limit 1.5). Over 0.1: tell the director before changing any lever.
- The thin bodies at 44 to 64 px: the director puts it to Alberto with the captures.
- Wave 8 and the five files: `now.js` unchanged. `parts/c-main.index.html`: `.now-go` holds two links (sersan.io and
  the SerSan Agent OS case); the `now-fig` line untouched. `parts/strings.mjs`: `chrome.sound`, `hero.scroll` gone,
  `nf.pages` new, no `now.*` changed. `css/blocks.css`: `.hero-instr` out, Now's rules at lines 42-48.
  `css/page-cover.css`: the hero's scroll cue is a comment now, a new `.now-go { display: flex; … }` at the end.

**Facts read for it on 22 Nov, 14:40 (from the tree as wave 8 left it; read again before editing):**
- The figure's box does not come from the figure's element: `fx-stage.js` `figOf` (line 1148) takes it from the
  text's right edge (`m.tx1`) and the view. Taking the `<figure>` out of the layout changes nothing for `c.fig`.
- `css/scene.css:47`: `html.sc-on:not(.gl-off) [data-stage-poster] { display: none; }`. A list with that attribute
  would leave the accessibility tree in scene mode: the nine names go in a list WITHOUT it, hidden to the eye in scene
  mode the way a screen-reader-only block is (its 1 px box is dropped from `c.texts` by the host's own
  `nat.w > 1` filter), and shown as type when the pass is off. `css/print.css:10` shows posters in print.
- `css/blocks.css:43-47` are the old picture's rules (`.now-fig img`, `.now-fig`).
- Consulting already names four of the nine (`parts/strings.mjs`): `co.3.name` is «Claude Code best practice» /
  «Claude Code, buone pratiche»; its description says «AI content generation», «video editing», «multi-agent
  systems» / «contenuti generati con l'AI», «montaggio video», «sistemi multi-agente». Use the site's own names where
  it has them (the bench says «Claude Code practice», «AI-generated content»), then run the gap probe again in both
  languages: the Italian names are longer.
- `stage/scenes/path.js:138-147` is the pattern for words read from the page: read once, read again when the
  element they came from has left the document (the Astro router keeps the module across pages and languages).
- `assemble.mjs` asserts nothing about Now's figure (its `data-slab` checks are the gallery's and the cases'); line
  625 checks the home's scenes in order. `now.alt` is `strings.mjs:81`.
