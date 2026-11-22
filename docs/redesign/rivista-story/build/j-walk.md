# j-walk — the whole home walked as a phone reader does (lane WALK, read-only, phase 1)

- **Lane:** WALK of workflow `mobile-understand`, 22 Nov 2026 (second run, Opus 5.5 max; the first run fell on the Fable limit at step 0). Read-only: nothing under `public/`, `web/`, `scripts/` changes. Scratch and captures in `.shots/j-walk/`, probes in `.shots/j-walk/_scripts/`. Ports 5432 to 5434 (none started yet; the live site needs no server).
- **Question:** Alberto on his iPhone (Safari, iOS 26): the phone is not well designed, bugs, animations crooked and not continuous, they show behind the words, it is not one continuous scroll through a world as on a desktop. On his phone the name of light never appears.
- **Target:** the live site https://albertotuveri.sersan.io (the Astro build), Chrome headless through `launch()` of `scripts/lib/headless.mjs`, 393 x 852 DPR 3 and 390 x 844 DPR 2, isMobile + hasTouch, EN and IT; desktop 1440 x 900 DPR 2 for the same places.
- **Plan:** (1) stills every half screen, phone and desktop, contact sheets; (2) real touch scrolls, strips at 50 ms across every join; (3) the phone branches of every scene from the code; (4) type floor, tap targets, clipping, header, menu, safe areas, first screen.
- **State:** run 2 DONE (all four steps; the summary and the five changes at the end of this file). No server was started
  (the live site needs none); every headless Chrome closed. Step 1 DONE: phone walk EN (88 stops, `.shots/j-walk/walk-p3-en/`, sheets `sheet-p3-en-0..5.jpg`), desktop walk at the same places (`walk-d-en/`), pair sheets `pair-en-0..7.jpg` (phone left; desktop right with its canvas alone under it). Step 2 running: `touch.mjs` (13 finger segments, strips in `touch-p3-en/`). Then `plain.mjs` (type floor, taps, sides, header, menu), the IT walk. Probes in `.shots/j-walk/_scripts/` (facts, walk, sheet, touch, plain, gtest).
- **Probe fact:** in headless Chrome, CDP `Input.synthesizeScrollGesture` with `gestureSourceType: "touch"` does NOT scroll the page (0 px, `gtest.mjs`); `Input.dispatchTouchEvent` strokes do, with the browser's own fling (a 360 px flick at ~2,200 px/s travelled 521 px). touch.mjs uses those.

## The walk at rest, phone 393 x 852 DPR 3, EN (first read of the sheets)

- Light over text AT REST is clean in Chrome: on 88 stops the worst text block (glyph box, canvas alone, active step) has p95 excess <= 4/255 over the night and <= 4 % of its pixels lit. The keep-outs hold when the page stands still. "Behind the words" is therefore a motion matter (or Safari's): see the strips.
- The figures are small on the phone: lit share of the top 55 % of the frame 0.2-12 %, of the lower part 0-16 %.
- The pattern on every scene with steps (gallery, stack, path, consult, Obla): the figure sits ABOVE the step's text when the text is low (local ~0.76) and moves BELOW the text or to the middle when the text rides up (local ~0.26): `009` (SerSan Agent OS plate under its own text), `041`, `047` (the stack under AI / Creative), `073`, `079` (Obla under the text). The figure hops round its text twice a step.
- Two figures at once at the joins: `048` (the path's SEP 2026 pane standing ON the stack's CREATIVE layer, with the line's blue flame beside it; CAMERINO's title already at the foot), `006` (the nine printed names at the top and the gallery's lineup). (`030` has one CORE only: a misread of the thumbnail, checked 1:1.)
- Near-empty frames: `002` (hero 0.79: cosmos + one tiny mark), `005` (Now's text only), `066` (consult step 3 head), `069` (consult 04 text, no figure).
- The queue of plates is cut by the right edge of the screen (`008`, `024`, `026`), the vanishing point at 0.9 vw.
- The path's line on a phone reads as one bright curved blue blade beside each pane (a comet/feather), not a line through five stations.
- Consulting's figures: a grey noisy blob (`061`, `062`: the splat mark before it resolves), a nearly invisible film strip (`065`), short bright dashes in a line (`070`, `071`).
- Against the desktop at the same places (`pair-en-*.jpg`): the desktop keeps ONE composition per scene (text column left, the figure in the right half, the figure never meets the text), the phone changes composition every half screen. Path: the desktop shows two or three panes on one long line; the phone one pane and a short bent blade of blue beside it (`049`: no pane at all at the path's head while the desktop shows SEP and MAY). Now: the desktop's orrery is large with its nine names round it and rides the whole of Now; the phone's is a 200 px band under the header with one name (`004`) and is gone by `005`.

## Step 2: the finger (touch.mjs; strips in `.shots/j-walk/touch-p3-en/`, `strip-*.jpg` seen, `hide-*.jpg` the canvas alone)

Numbers: segments a, b in `.shots/j-walk/touch-p3-en.log`; c to m in `touch-p3-en-2.log` and `touch-p3-en/summary.json`.
Method: real touch strokes (CDP dispatchTouchEvent), screencast, a strip every 50 ms with the step's text lines (green,
clipped by their masks) and the plates the stage was asked for (red, projected through the frame's free camera: checked,
the hero's w1 box sits on the plate); the same stroke again with every word transparent, and per frame the p95 of the
light over the active step's lines (> 25/255 over the night = lit). The second run is not frame-identical (the finger's
timing varies by tens of ms), so it shows what CAN happen within one stroke, not the same frame.

- **a, hero flight** (flick, 546 px): the foot leaves in 250 ms, the name then holds still ~300 ms while the page has
  moved (the flight's damped follower, 0.26 s), zooms for ~1.4 s after the finger stopped, dissolves into blue points
  1.6-1.9 s and from 1.9 s the frame is EMPTY (cosmos only) and stays so: one natural flick lands the reader in the void
  between the name and Now (k 0.34; Now's figure is lit only from k 0.42-0.56). No light over text.
- **b, Now to Work** (flick, 485 px): the orrery leaves upward at the top edge within 150 ms; from 600 ms on the frame is
  Now's last lines and the nine printed names in the top half and an EMPTY lower half, at rest: text on the void.
- **c, Work steps, reading drag** (two strokes, 1070 px): the DEFAULT-DENY plate stands above MAINTECH OMA's text; the
  text rises into it and the plate fades out within ~100 ms (seen run, 3500-3600 ms); in the second run the same plate
  is drawn ON the label, the title and the first line at p95 93 and 86 for ~100 ms before it goes
  (`zoom-c-3500.jpg`): the gallery's rule (`gallery.js` 321-326: alpha x (1 - overlap/40)) draws the glass over the first
  40 px of a rising text. 13 of 446 frames lit, 2 pops (w6 0.63 -> 0.34, w4 0 -> 0.49), plate boxes on text lines in
  13 frames (<= 15 px).
- **d, Work steps, flick** (303 px): no light over text; 5 pops: the queue's plates w6, w7, w8 jump from ~0.2 to
  ~0.8 alpha within 40 ms as the glide starts (they pop into the top right corner, cut by the edge).
- **e, Work to About** (flick, 470 px): the Supply Chain plate stands above the rising SUPPLY CHAIN text; at 500-600 ms
  the text reaches it and it fades out (0.96 -> 0.13 in 80 ms); 600-1200 ms no plate, a faint ghost of the stack's
  CORE appears and goes; at 1250-1350 ms the Supply Chain plate comes back BELOW its text and stays there: one plate
  out, a ghost, the plate back on the other side (strip-e). (The lit frames at negative times are an artefact: text
  lines hidden under the opaque header, whose accent rule counted as light; the probe now skips them.)
- **f stack flick, h path drag, j consult flick, k consult -> Obla, l Obla flick, m Obla -> Contact**: no light over the
  active text in Chrome, no pops logged (consult and Obla have no plates); Obla's flick is the best passage on the
  phone: the character grows, takes the middle, the three windows of "It works" come up above it, continuously.
- **g stack -> path** (flick): plate boxes on text lines in 10 frames (<= 32 px), light p95 <= 44 (the CREATIVE layer and
  the SEP pane meeting the leaving text). **i path -> consult**: 2 frames at p95 152 at 96-109 ms (the pane/blade at the
  head of Consulting's text).
- **What Chrome does NOT show and a phone may:** in Chrome headless the canvas and the page scroll in step (the
  projected boxes sit on the plates in every strip). On iOS Safari the page scrolls on the compositor during a fling
  while the canvas is redrawn from `scrollY` on rAF; any frame of lag puts every keep-out hole and every figure
  (velocity x latency) px off its text: at 2,000 px/s one frame is 33 px, two are 66 px, against keep-out falls of
  24 px (gallery, `KEEP_FEATHER_PHONE`) and pads of 8-16 px. Hypothesis for «si vedono dietro le scritte» on the real
  phone; only a screen recording of a fling on it can settle it (askAlberto).

## Step 4: the plain things (plain.mjs, EN and IT, 393 x 852; `.shots/j-walk/plain-p3-*/`)

- Type floor (DOM): no visible text under 16 px in either language (sizes 16 to 126 px). Canvas type: the etched line
  under an etched plate's figure is ~9 css px of capitals, ~13 px type, on the phone's plate in step (`_etch009.jpg`
  at 1:1: "EACH AGENT ACTS ON ITS OWN"): `case/etch.js` LINE_MIN 96 of a 1600 canvas, set for 1440, scales with a
  plate ~275 px wide (and down to 130 px when the band squeezes it): under the 15 px phone floor.
- Nothing past the sides (scrollWidth 393 = 393); the plates of the gallery's queue are cut by the screen's right edge
  (canvas, by design of the vanishing point at 0.9 vw).
- Tap targets: 40 on the home, short ones: the address link at the end (266 x 29) and in the menu (361 x 24); the
  menu's language link is 14 px wide (EN) / 20 px (IT), 50 tall; "Obla" inline links 37 x 44. The menu itself is
  good (items 361 x 56, 18 px labels, CLOSE 58 x 44).
- Header: transparent over the hero, then an OPAQUE bar (#12151d, a bottom border, a short accent rule) once scrolled;
  it steps away scrolling down and comes back scrolling up, cutting the world's top 64 px with a flat band.
- Safe areas: only `.sc-step` padding-bottom and the case captions use `env(safe-area-inset-bottom)`; the header has no
  `safe-area-inset-top` (viewport-fit=cover). Alberto's screenshot puts the hero foot ~157 px higher than Chrome's
  393 x 852 (ABOUT at page y ~614 against 771): his first screen (100svh) is ~695 px, the status bar ~59 and the
  bottom bar ~98 px out of it. The canvas is sized 100vw x 100vh (stage.js header) and the views 100svh: on Safari
  those differ (DEVICE's lane).
- First screen: in Chrome the name of light is there (two lines), with cosmos, chips, one plate top right, the foot;
  on his iPhone only the plate and the foot. Same plate, same place: the plates pipeline draws on his phone, the
  points (swarm + field) do not.

## Step 3: what the phone gets, from the code (live = HEAD `15fb573`)

- **The host** (`fx-stage.js`): `phone = vw < 760` (ctx.phone); `side = "top"` for every scene with steps under 1024 px (measure), `figOf` gives the figure the TOP 55 % of the sticky view; tier B on touch (`stage/tier.js`: touch or < 768 px), 80k points, stage DPR min(dpr, 1.5) x 0.85 (`stage.js` 1283). The step's text is at the bottom of its one-screen step (`css/scene.css` phone block, `align-items: flex-end`), so every step's text TRAVELS from the foot of the screen to the top, through the figure's 55 %, while the figure's view is sticky. On a desktop the text column and the figure's half never meet.
- **How each scene answers the travelling text on a phone** (each a different rule):
  - gallery: the plate in step moves to the tallest free band (above or below the text), and a text block crossing a plate hides it (`gallery.js` 185-213, 308-326); the queue fans to vp 0.9 vw (cut by the edge).
  - stack: the stack keeps to its free band, is pushed by the text, crosses to another band with its glass stepped back (`stack.js` 162-207).
  - path: only the pane in step; a pane steps back while a text comes within 64 px; the whole line dims while its near end is within 72 px of a text (`path.js` 189-295).
  - consult: figures stay in the top 55 % (`inset(c.fig)`); the text crossing them is cut out by the keep-outs (`room` keepouts), so the figure vanishes under the text instead of moving (`069`).
  - Obla: the character keeps to the widest free band and HOPS (fades, moves unseen 0.3 s, comes back) when the band changes side (`obla.js` 43-89).
  - Now: the orrery sits in the band between the header and Now's text (`now.js` orreryAsk, `stacked`), one name at a time; the nine names are printed as type under Now.
  - hero: one plate (w1, under the header, top right) instead of two; the name in two lines, the flight goes between the lines (`cover/world.js` 487-546).
  - cases (not in the home): the figure stands in a free band case.css opens ABOVE each chapter (a band in the document, not in the sticky view): the one scene where the phone has its own layout rather than a dodge.
- **Quieter on purpose:** room chips 800 instead of 1,200 and tier B 0.8 of that (`lib/room.js` 47-48), haze 0.09 x 0.7, the gallery's room `dim: 0.1`, the mist `dim 0.35`, the path's bokeh 5 px, the orrery's bloom 0.14 (desktop 0.24): the phone's world is deliberately dimmer and emptier.

## Facts (live, Chrome headless, 393 x 852 DPR 3, isMobile, hasTouch, EN; `.shots/j-walk/facts/p3-en.json`)

- Stage on in 0.64 s, tier B (touch), 80,000 points, canvas 501 x 1086 for a 393 x 852 view (stage DPR 1.275 = min(3, 1.5) x 0.85: the light is drawn at 1.3x while the type is at 3x). GPU 0.36 ms at rest on the hero. Console clean.
- In Chrome the first screen HAS the name of light (two lines, ALBERTO / TUVERI), the cosmos's filaments, chips, and the one plate top right (the same plate, same place as on Alberto's iPhone). So on his iPhone the plates draw and everything made of points (swarm: the name; field: cosmos + chips) does not: DEVICE's question, not WALK's. Everything below is judged on what Chrome draws.
- The home is 37,887 px = 44.5 phone screens: hero 0-1619 (190svh), Now 1619-2761, Work/gallery 2760-12984 (12 steps of one screen), About/stack 12984-20652 (9), About/path 20652-25764 (6), Consulting 25764-30876 (5 steps in 6 screens), Obla 30876-36840 (6 steps in 7 screens), Contact 36840-37692 (one screen), then the legal line.
- On a phone EVERY scene is side "top" (`fx-stage.js` measure: `cw < 1024 && steps` -> "top"; the hero by its text's width): the figure is given the top 55 % of the sticky view (`figOf`), the text sits in the lower part (`css/scene.css` phone block: `align-items: flex-end`).

## The phone, place by place (Chrome headless on the live site; B = bug, L = a law broken, D = design)

- **Hero** (0-1619): D: the name in two lines with the one plate top right reads well at rest. D: the flight lags the
  finger (the name holds ~300 ms, then zooms ~1.4 s after the finger stopped) and a single flick (546 px) ends on an
  EMPTY frame (cosmos only, strip a, walk 002); on the desktop the same place is empty too, but a phone reader flicks
  into it every time. On Alberto's iPhone the name, cosmos and chips are missing altogether (DEVICE).
- **Now** (1619-2761): D: the orrery is a 200 px band under the header with one name (walk 004), gone by Now's second
  half-screen (005); the end of Now is text over an empty lower half at rest (strip b). Desktop: a large orrery with nine
  names for the whole of Now.
- **Work** (2760-12984): D/B: the plate in step moves to whichever free band is tallest, above or below its text
  (009: SerSan Agent OS's plate under its own text, top half empty), fades out within ~100 ms when its text rises into
  it and comes back on the other side (strip e: Supply Chain out at 500-600 ms, a faint CORE ghost, back below at
  1250 ms); the queue's plates pop in (alpha 0.2 -> 0.8 in 40 ms, strip d) at the top right, cut by the screen's edge.
  L (in motion): the rule alpha x (1 - overlap/40) draws the glass over the first 40 px of a rising text (zoom-c-3500:
  p95 93 over MAINTECH OMA's label and title). L: the etched line on the plates is ~13 px type (~9 px capitals).
- **About, stack** (12984-20652): D: the stack sits above the text for 01-04 and below it for 05 AI and 08 Creative
  (041, 047), crossing its text with its glass stepped back. **About, path** (20652-25764): D: one pane at a time and a
  short bent blade of blue beside it (a flame / comet head, 048-058), not the desktop's line through two or three
  panes; 049 has no pane at all; L-possible: the blade reads as a drop / comet. Join stack -> path: the SEP 2026 pane
  stands on the CREATIVE layer (048), CAMERINO's title already at the foot: two scenes' figures in one band.
- **Consulting** (25764-30876): D: the figures stay in the top 55 % and the text crossing them cuts them out (keep-outs),
  so a flick leaves the text alone on the screen (strip j: from 500 ms to the end, no figure; walk 066, 069); the made
  mark first shows as a grey noisy blob (061, 062); the film strip is nearly invisible (065). L-possible: at the scene's
  end the agents' nodes blur into bright slanted pills in a row (070, `_s070.jpg`): rain-like.
- **Obla** (30876-36840): D: the best passage on a phone (strip l: the character grows, the windows of "It works" come
  up above it), but it HOPS below its text at local ~0.76 (073, 079: fade, move unseen 0.3 s, come back).
- **Contact** (36840-): fine: the day's edge, "Write to me.", the address; tap target of the address 29 px tall.
- **Everywhere:** DOM type >= 16 px, nothing past the sides, the menu good; the header an opaque bar when scrolled up;
  no `safe-area-inset-top`; the language link 14-20 px wide.

## Five changes that would do most to make the phone one continuous journey (hypotheses, none built)

1. **The text never crosses the figure's band on a phone.** Root cause of the hops, pops, vanishing figures and light
   at the text's edge: on a phone the step's text is at the foot of a one-screen step and travels up through the
   sticky view's top 55 % where the figure stands (scene.css phone block, figOf), and each scene invents its own dodge.
   Smallest test: on < 1024 px make each step's `.sc-in` sticky at the foot of the view (as a case's caption already
   is: `css/case.css` 53, `bottom: max(26svh, env(safe-area-inset-bottom))`) so the captions hold the lower band and
   hand over in place (the title sequence's masks), while the scroll drives the world above them.
2. **Then one rule for the band, and the desktop's shot inside it.** With the band never crossed, drop the six dodges
   (gallery band-follow and hide, stack push, path step-back and line dim, Obla hop, Consulting's keep-out cut) and let
   each scene run its desktop shot in the phone's band: the dolly along the plates, the stack sliding, the walk along
   the path's line through several panes, the walk between Consulting's four figures, Obla's walk.
3. **No empty frames, no two figures in one band.** Overlap the leaving and the arriving scene on the phone as the
   desktop's blend does, and keep Now's orrery for the whole of Now: the voids at the hero's tail (strip a), Now's end
   (strip b), the path's head (049) and between Consulting's figures (strip j) close; at the joins one figure leaves
   before the next stands in its place (048, strip e).
4. **The canvas in step with the finger on a real phone.** Chrome shows the figures in step with the page; iOS Safari
   scrolls the page on the compositor during a fling and the canvas follows from `scrollY` on rAF, so every keep-out
   and figure can stand (speed x lag) px off its text (33-66 px at 2,000 px/s against 24 px falls). Measure first on
   the phone (a screen recording); then widen the keep-outs or dim the light by the host's reader speed (`spd`, 0..1)
   while the page runs.
5. **The phone's own frame and plain layer.** Views, canvas and header on the same viewport (100svh views, a 100vh
   canvas, no `safe-area-inset-top` on the header: Alberto's first screen is ~695 px, not 852), the header without an
   opaque bar over the world, the etched line >= 15 px on a phone (`case/etch.js` LINE_MIN from the plate's size on
   screen), the language link and the address >= 44 px.
