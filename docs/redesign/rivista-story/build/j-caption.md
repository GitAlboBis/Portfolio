# j-caption — lane J2a GRAMMAR + GALLERY of the phone wave (the caption at the foot, the gallery first)

- **Lane:** J2a of the phone wave (`build/j-mobile.md`), launched 23 Nov 2026 on HEAD `2e7a046` (the director's `6f9434c` since: HANDOFF.md only, `public/` identical), Opus 5.5 max. No commit, push, stash or branch switch: the director commits.
- **Question:** under 1024 px each step's text travels up through the figure's band and every scene dodges it (`build/j-walk.md` finding 1). Build an opt-in caption grammar (the step's `.sc-in` held at the foot of the sticky view, the figure owns the band above), opt the gallery in (work.html and the home's Work part, EN and IT), drop the gallery's phone dodges, keep the desktop identical.
- **Ports:** 5440 the tree (`public`, pid in `.shots/j-caption/pids.txt`), 5441 HEAD's export (`.shots/j-caption/head/public`), 5442 the Astro build (`.shots/j-caption/dist` + `public`). Scratch and captures: `.shots/j-caption/`, probes in `.shots/j-caption/_scripts/`.
- **State: DONE** (23 Nov). Built in `css/scene.css`, `fx-scroll.js`, `fx-stage.js`, `stage/scenes/gallery.js` and the
  Work partial (`fx-motion.js` was touched and put back: no change there); two rounds of looking, the measures twice,
  the printed states, the gates and the documents (CLAUDE.md §1 and §4, DESIGN.md, `60-as-built.md` G4,
  `stage/scenes/README.md`). Nothing committed: the director commits. Servers stopped.

## Built, and what the first round showed (23 Nov)

- First stills (`.shots/j-caption/v1-work-p3/`): one caption at a time at the foot, the plate whole in the band. Found:
  (1) the host's text block for a gallery step was the step's `li` itself (a text element holding the caption), read in
  its flow place a screen above its words: the keep-out never followed the held caption (canvas-alone stills: filaments
  across the caption). Fixed: in a caption scene each step's caption (`.sc-in`, the sticky box) is ONE text block, so
  its rect is read where it is held. (2) The last caption, held on past the scene's end, stood over the dawn's paper on
  Work (ink on ink, `v1` stop 24). Fixed: the last step's caption has no hold below (`:last-child`): it leaves with the
  scene, and the last plate swings out past the eye (the read plate's own gesture) as it goes (`gallery.js` `out`,
  local 0.42..0.6; first tried at 0.3..0.55, which left the band empty for a reader resting in the last step, strip
  `t1-tree-home-p3/strip-e`). (3) Over an etched plate the queue stepped right and stood cut by the screen's edge: with
  the caption it steps up (the band has room above the plate).
- Desktop unchanged, proved (`_scripts/desk.mjs`, tree 5440 against HEAD 5441, at rest at 5 to 8 places through the
  gallery): the page with the canvas hidden is pixel-identical (0 px over 2/255) and what the host asks the stage for
  (plates, keep-outs, formations, dawn, night; not the camera's clock drift) is deep-equal, at 1440x900 DPR 2 (work.html
  and the home) and 1920x1080 DPR 1 (work.html, it/work.html). Pairs in `.shots/j-caption/desk-*/pair*.jpg`.
- Touch, the home at 393x852 DPR 3 (`_scripts/touch.mjs`, CDP touch strokes, tree against HEAD, same strokes): two
  captions seen at once 0 frames (HEAD n/a: its non-active steps stand at 0.12); a seen caption moving: only its rows'
  own 0.9rem rise (1-2 px a frame while it comes in); plates over a seen caption 0 frames (HEAD 966-1991 frames, up to
  235 px); light over the seen caption (canvas alone, p95 > 25): 0 frames, max 2 (HEAD up to 9 frames, max 219); pops
  0-1 a segment (HEAD 6-12): the one left is the read plate fading out at the right edge during a 2,600 px/s flick
  with a 34 ms frame (0.36 to 0.10).
- The scene's ENDS, second and third fix (strips `t2`/`t3`/`t4-tree-home-p3`): (4) at the entry the head caption,
  held at the foot from early on, stood under the opening row while the view still rose with the section (the row
  drawn over "ELEVEN WORKS", p95 109): now the first caption stands at its step's foot (a top margin of 100svh less the
  room; first tried with `align-self: flex-end`, which with the negative bottom margin pushed it 1,278 px below) and is
  held only once the view stands: it comes up with the scene. (5) The last plate swung out early and left the band
  empty while its caption scrolled away slowly: now the band rises with the last caption from local 0.5 (plate and
  caption leave together). (6) The last caption, let go at the foot line, rode with its link touching the dawn's edge:
  the last step keeps the room as padding, so it is let go as its step's end reaches the view's foot and rides that far
  above the next scene.
- Round 1 of looking (`round1.log`; strips in `r1-*`): tree work EN 393x852, HEAD the same, Astro home IT 390x844, HEAD
  the same, Astro work IT 390x844; segments: entry flick, hand-over drag (550 px/s), flick (1,500), fast flick (2,600),
  exit flick and drag, back flick. Tree and Astro: two captions seen 0, plates over a seen caption 0 (the home's exit
  drag counts About's first layer below the riding caption: the probe's box runs from the caption to the screen's
  foot), pops 0-1 (the read plate at 2,600 px/s), light over a seen caption 0 frames except the work exit before fix 6
  (3 frames). HEAD: plates over the text up to 230 px in 704-4,657 frames, pops 2-10, light 3-31 frames up to 230.
  Side by side: `pair-b-home-it.jpg` (HEAD above: SPHERE AI rises to the top while the plates hop below it; the tree
  below: it holds at the foot, clears at 1,200 ms, MAINTECH OMA rises in its place, the plate settles in the band).
- Printed states unchanged, proved (`_scripts/plain.mjs`, full-page screenshots tree against HEAD): `?stage=0`, `?gl=0`,
  reduced motion and print, at 390x844 DPR 2 (work and the home, EN and IT) and 1440x900 (work EN and IT): 24 pairs,
  0 channels over 2/255, the same heights; in every one scene mode is off.
- SMOOTH's law, k-smooth's `rec.mjs --m` + `cmp.sh` (records `.shots/k-smooth/rec/jc-*.json`), the worst velocity
  step of a plate on screen at a slide's end (TAIL): work, jsfling, 123 px/s (HEAD 361); the home's gallery 116 (HEAD
  360); work with CDP touch flings 134 (HEAD 346). The eye as HEAD (1.7-2.0 against 1.9-3.2 world px/s; under touch 56
  against 43, both at near rest, both with 35 ms frame gaps).
- GPU round 1 (`gpu-g1.log`, `_scripts/gpugal.mjs`, the stage's timestamps; in place = step 3 at rest twice, travel = a
  scroll over three hand-overs): phone tier B 390x844, work 0.43/0.46 and 0.43/0.47 at rest (HEAD 0.46/0.49), travel
  peak 0.49 p95 0.45 (HEAD 0.46, 0.46); the home 0.38-0.39 (HEAD 0.40-0.41), peak 0.45 p95 0.44 (HEAD 0.47, 0.44).
  Desktop 1440 identical (1.24/1.29; peak 1.36). Sleep: 0 frames in 3 s after 19 s quiet (tree and HEAD). Swarm never
  halved (80,000 / 160,000 drawn throughout).
- First frame round 1 (`ff-1.log`, the figure lane's `ff2.mjs` pointed at 5440/5441, ten alternated pairs after a
  thrown-away warm-up): the home on a phone (with the flight to Now) median 323 ms against HEAD's 317 (quartiles
  318-346 / 302-334); work on a phone (with a scroll two screens into the gallery) 311 against 308 (292-323 / 295-309),
  one long frame after it on the tree (58 ms at 412 ms, `field/atlas.js`: the chips' own slices, not this lane's code);
  work at 1440 at rest 317 against 345. Within the runs' own spread.
- The plain checks (`_scripts/floor.mjs`, at rest in each of the twelve steps, tree): 393x852 work EN and 360x740 the
  home IT: the smallest type in a shown caption 16 px (the phone's labels; the floor is 15); one caption shown and one
  taking taps at a time; no horizontal overflow; the caption's last line 42 px over the screen's foot at 393x852 (the
  head of the home at 360x740 is still riding up with its section at local 0.4, as designed). The keyboard: 40 presses
  of Tab from the top reach the gallery's eleven links (the order wraps, 22 stops in all), and at every one its step
  has come to the reading line and into focus, the link on screen at 782 px (its caption 0.65-0.75 opaque 260 ms after
  the key, still coming into focus).
- After round 1, two changes: (7) the grammar holds only on an upright screen (`orientation: portrait`, the CSS's
  media query and fx-scroll's `capMQ`): a phone held sideways has no height for a caption and a band (at 844x390 the
  caption would take the screen); the orientation, unlike a height threshold, never flips as Safari's bar comes and
  goes. (8) The gallery's old fade where a text meets a plate stays as a guard in caption mode, within 12 px instead of
  40: the designed layouts never reach it (0 frames of a plate over a seen caption in every stroke), but a page zoomed
  far in (a caption taller than the room under the band) would otherwise get glass over its words.

## Round 2 of looking, on the final tree (`round2.log`; the confirmation)

- Stills every half screen through the gallery (27 stops each, at rest, `r2-st-*/sheet.jpg`): the tree's work EN
  393x852, work IT 390x844, the home EN 393x852 and IT 390x844, the Astro build's work EN 393x852 and the home IT
  390x844: one caption at the foot at every stop, the plate whole in the band above it, the same size and place for
  every step; the light over the shown caption (canvas alone, p95 over the night) at most 2/255 on every sheet (HEAD's
  same stops: at most 7). Side by side with HEAD at the same stops: `pair-stills-work-en.jpg` (HEAD above: within each
  step its text sits low, then rides to the top with the plate hopping below it; the tree below: the caption stays at
  the foot, the plate in the band).
- Touch strokes (`r2-tree-work-en-p3`, `r2-astro-home-it-p2`, `r2-tree-home-en-p3`, HEAD `r2-head-home-en-p3`): on the
  tree and the Astro build, in every stroke (entry, drag at 550 px/s, flicks at 1,500 and 2,600 px/s, exit flick and
  drag, back): two captions seen at once 0 frames; a plate over a seen caption 0 frames (the home's exit drag counts
  About's first layer below the riding caption, 40 frames: the probe's box runs from the caption to the screen's foot);
  light over a seen caption 0 frames (one at -165 ms on work, a screencast frame from before the stroke and the hidden
  style: j-walk's known artefact); pops 0, or 1 at 2,600 px/s (the plate just read, 0.6 to 0.35 or 0.51 to 0.18 across
  one frame). HEAD's home, the same strokes: plates over the text in 1,264-1,741 frames (up to 229 px), pops 3-6, light
  over the text in 6-10 frames (up to 156). Side by side, HEAD above, the tree below: `pair-r2-b-drag-home-en.jpg`,
  `pair-r2-d-fast-home-en.jpg` (the 2,600 px/s flick at 50 ms: BRAND FILM clears at 400 ms, OBLA rises in its place
  from 500, the plates glide in the band), `pair-r2-a-entry-home-en.jpg`, `pair-r2-e-exit-home-en.jpg`.

## Measures, round 2 (`measure2.log`, a quiet machine, CPU 0-17 %)

- GPU (`gpugal.mjs`): phone tier B work 0.43/0.47 at rest twice (HEAD 0.46/0.48-0.49), travel peak 0.48 p95 0.46 (HEAD
  0.47, 0.46); the home 0.38-0.39/0.43 (HEAD 0.40-0.41/0.43-0.44), peak 0.47 p95 0.44 (HEAD 0.46, 0.44); 1920x1080
  DPR 1 work 1.04/1.09 (HEAD 1.04/1.08), peak 1.19 p95 1.13 (HEAD 1.18, 1.11); the home 1.10-1.20 (HEAD 1.09-1.20), peak
  1.23 p95 1.18 (HEAD 1.20, 1.17). Under every limit (2.4 at 1920, 1.5 on a phone). Asleep: 0 frames in 3 s after 19 s
  of quiet, tree and HEAD. Never halved: 80,000 (B) and 160,000 (A) drawn throughout, 0 halvings.
- Now with the figure lane's own `gpunow.mjs` on these ports (phone): the flight 0.44 peak both; Now in place
  0.79/0.80-0.81 both; the l-stage place 0.13/0.14 at rest, peak 0.81 (HEAD 0.83). The orrery as HEAD.
- First frame (`ff2.mjs`, ten alternated pairs): the home on a phone 321 ms median against 317 (quartiles 315-324 /
  303-318), work on a phone 293 against 292 (289-296 / 288-295); no long frame after it on either. With round 1 (323 /
  317, 311 / 308): the home's median 4-6 ms over HEAD's, inside the spread of both. Its likely share: the host's own
  measure (`?debug=1`, `[stage] measured … in X ms`, `_scripts/meas.mjs`, five loads each) costs 7.5-10.7 ms on the
  home against 6.0-6.7 and 4.6-6.0 on work against 2.7-4.4: the twelve captions are twelve more sticky boxes to
  flatten and resolve (20 against 8 on the home). The captions' height is read from what the measure already reads
  (each caption's glyphs and its sticky box's natural top: no layout read, one style read); a first version that read
  each caption's children cost a little more.
- Re-checked after that last change to the host (the captions' height from the glyphs, 10 px taller than from the boxes:
  the display line's glyphs stand over its line box): the desktop at 1440 identical to HEAD at five places (DOM 0 px,
  the stage's inputs deep-equal); it/work at 390x844, 27 stills, light over the shown caption at most 2, one caption at
  a time; the home's drag, fast flick and exit: no caption pair, no plate over a caption, no pop, no light.

## Gates on the final tree (`gate-*.log`)

`assemble.mjs` exit 0 and `--check` exit 0 (structural asserts ok: 2 editions, 11 works); `check-claims-proto.mjs` OK, 34
pages; from `web/`: `build.mjs --outDir ../.shots/j-caption/dist` 34 pages, `parity.mjs` PARITY OK (150 shared files, 0
differ), `asserts.mjs` ok (34 pages, 1,154 local references), the claims on that build OK; `VERCEL_ENV=production node
web/scripts/release.mjs` exit 0 with its three `[release]` lines (34 pages, 32 in the sitemap, 159 files, 5.4 MB).
Servers 5440, 5441, 5442 stopped by pid (29756, 21688, 33908), the ports closed.

## For J2b (what this lane learned, scene by scene)

- **Opting in is one attribute** (`data-caption` on the scene's section). Before it: measure the scene's captions on
  a phone (`_scripts/caph.mjs`, change its selector): the host gives the figure the band above the TALLEST caption, for
  every step, so one tall step shrinks every step's band. Shorten by layout, never by size (the floor is 15 px; the
  gallery's captions are 245-315 px, 29-43 % of the screen, and leave a band of 280-420 px).
- **What breaks generically and is already handled:** a step that is itself a text element (the gallery's `li`) was
  the host's text block, read in its flow place (now each caption `.sc-in` is one block); `align-self: flex-end` with a
  negative bottom margin pushes a box down by that margin (the first caption is placed by its top margin); a last
  caption held past the scene's end sits on the next scene (no hold below the last step, its room kept as padding); a
  first caption held early sits under the figure while the view still rises (the first caption is placed at its step's
  foot and rides up with the scene). The home's part opener needs nothing (its first caption enters with its section).
- **Now** (`now.js`, `stage/orrery/`): Now has no steps; its text (title, lead, body, two links, the nine names on a
  phone) is far taller than a caption. The caption grammar does not fit it as is: either Now gets steps (two or three
  captions, the orrery held in the band above for the whole of Now, as j-walk asks), or Now keeps flow and the orrery's
  band (`orreryAsk`, `stacked`) is held for the whole of Now instead of leaving at its second half-screen.
- **About's stack** (`stack.js` 162-207: the free band, the push with `softClamp`/`softMin`, the glass stepped back as
  it crosses to another band): with a caption all of that goes on a phone (`L.cap`-style branch); the stack stands in
  `c.fig`, the same place every step, and its slide is centred on the hand-over (the stack's own `off`). Its captions
  hold `.tools` rows: measure them first.
- **About's path** (`path.js` 189-295: a pane steps back while a text comes within 64 px, the line dims while its near
  end is within 72 px of a text): both go; with the band never crossed the phone can run the desktop's walk along the
  line through two or three panes (j-walk change 2), and the empty frame at the path's head (`walk 049`) closes.
- **Consulting** (`consult.js`: figures in `inset(c.fig)`, cut away by the text's keep-outs as the text crosses them):
  with captions the keep-outs hold only the caption, so the figures stand whole; give the walk between the four figures
  the band. The splat mark's grey blob and the faint film strip (j-walk 061, 065) are figure matters, not the grammar's.
  Its captions hold `.co-act` buttons (`.btn`): the host's keep list already follows a caption's visibility (`capAt`).
- **Obla** (`obla.js` 43-89: the character keeps to the widest free band and hops, fades, moves unseen, comes back):
  the hop goes; the character stands in `c.fig`. Its fields table (`.ob-fields`) makes one step's caption tall: measure.
- **The joins:** with two caption scenes meeting, the first's last caption leaves riding just above the next section's
  top and the next's first caption comes up with its section: text moves with the page there, as a document scrolls,
  never through a held figure. Make each scene's figure leave with its last caption (the gallery's band rises with it
  from local 0.5 of its last step) and enter with its first (the view rising). The gallery's exit into About's stack is
  the first such join to look at once the stack opts in.
- **The hero's empty tail** (j-walk strip a: one flick from the name lands in the void before Now): not the caption's
  matter; shorten the hero's tail on a phone or light Now's figure earlier.
- **Probes to reuse** (all in `.shots/j-caption/_scripts/`, gallery selectors to generalise): `touch.mjs` (strokes,
  per-rAF captions seen, plates over a seen caption, pops, light over it in a canvas-alone run), `stills.mjs` (sheets
  and light), `floor.mjs` (type, taps, overflow, keyboard), `desk.mjs` (desktop invariance), `plain.mjs` (printed
  states), `gpugal.mjs`/`gpugal.sh`, `ff2.mjs`, `pairstrip.mjs` (HEAD above, tree below).

## Read before building

- CLAUDE.md §0–6, §8; DESIGN.md (scale, scene grammar, Work, Motion, Do/Don't); j-mobile.md, j-walk.md and its captures
  (s009, strip-d, strip-e, zoom-c-3500: the plate in step hopping round its own text, the queue popping at the right
  edge, the glass over the first 40 px of a rising title); craft-floor.md; the `impeccable` context (mode Experience).
- **Fonti (connectors):** Magic UI (text effects: gradient, shiny, aurora: refused, DESIGN.md bans glow and gradient
  text) and ui-layouts ("Sticky Scroll", "Scroll Text": React and framer-motion sections) searched; nothing taken. The
  caption is the house's own sticky view and the step beats `fx-motion.js` already plays.
- The caption heights on a phone (`_scripts/caph.mjs`, tree = HEAD): work steps 245 px (two lines of body) or 273
  (three), the head 285 (EN) / 315 (IT); at 393x852 the tallest is 37 % of the screen, at 360x740 43 %. Type 16 px and up.

## The design (decided before the edit)

- **Opt-in:** `data-caption` on the scene's section (the gallery's, in `parts/c-main.work.html`). The grammar applies
  only in scene mode, under 1024 px (`max-width: 1023.98px`, the same query as the rest of the phone rules; since change
  7 below also `orientation: portrait`) and with `html.fs-on` (fx-scroll running): before fx-scroll runs, or if it never does, the steps keep today's grammar. At
  scroll 0 on work.html both grammars put the head's caption at the same place (the foot), so the switch is not seen.
- **The hold (css/scene.css):** the step box stays one screen (the scroll drives everything, one step a screen). Its
  `.sc-in` becomes a box of NO height at the step's top, its lines standing above that line (a flex column justified to
  its end), `position: sticky; top: calc(100svh - max(var(--s5), env(safe-area-inset-bottom)))`: its foot is held at
  the view's foot. Held from the TOP in svh, so Safari's bar coming and going never moves it and its foot is always
  above the bar and the home indicator. Negative margins (`-60svh` above, `-150svh` below) make each caption's hold
  run from its step's top at 1.55 screens down to -1.55: the caption in focus is held a screen after it leaves focus in
  either direction, so it is still in place while it goes (at 4,000 px/s that is over 200 ms; the hand-over takes 120).
  Captions never travel while seen.
- **Which caption shows:** the step whose BOX holds the reading line (fx-scroll.js pick, for a caption scene; the
  host's own `stepping()` uses the same line). None outside the scene's steps. The others: opacity 0, no taps.
- **The hand-over (house motion, nothing new):** the leaving caption clears in 120 ms (opacity and the focus pull's
  6 px blur, linear); the arriving one comes into focus after those 120 ms (`--focus-in`, the step focus pull) while
  fx-motion's step beats play as they do (its title from behind its straight mask at 120 ms + 70 ms a line, its rows
  from 260 ms). (First built with the home's Work part opener played at its caption's focus, since the head caption,
  held early, crossed 85 % of the view unseen; once the first caption rides up with its section (below, fix 4) the
  opener's own rule meets it where the reader does, and `fx-motion.js` went back to HEAD.)
- **The host (fx-stage.js):** per caption scene it measures the tallest caption and the stick line; the figure's band
  (figOf "top") ends a gap above the tallest caption, the same for every step (the plate never resizes between steps);
  `ctx.caption { top, foot }`. Only the captions on screen count as text (the one in focus and the one leaving, 0.2 s
  after it lost focus): the keep-outs, `ctx.texts`, `ctx.textRects()` and the other scenes' yields see no hidden
  caption. Refract type inside a caption is not rastered (no glass ever crosses the caption band).
- **The gallery (gallery.js, phone with a caption):** the plate in step stands in the band, whole, centred, its size
  set once per layout; no band-follow, no clamp, the hide on overlap kept only as a 12 px guard that never fires in
  these layouts (change 8 below); the glide is centred on the hand-over (off 0); the queue's vanishing point inside
  the frame; nothing pops. The desktop's branch untouched.
