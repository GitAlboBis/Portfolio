# j-viewport — lane J3 VIEWPORT of the phone wave (Safari's bar, the canvas's box, the safe areas)

- **Lane:** J3 of the phone wave (`build/j-mobile.md`), launched 23 Nov 2026 on HEAD `0f19daa`, Opus 5.5 max. No commit, push, stash or branch switch: the director commits.
- **Question:** when Safari's bottom bar shows and hides, the host re-measures the page twice, re-rasters the glass's type three times and resizes the stage (frameTex, bloom levels): figures jump and frames drop. Make a bar change cost nothing, keep the keep-outs on the text, add the header's safe areas (top; left/right sideways), CAP_HDR following the header, the desktop identical.
- **Ports:** 5443 the tree (`public`), 5444 HEAD's export (`.shots/j-viewport/head/public`), 5445 the Astro build (`.shots/j-viewport/dist` + `public`). Scratch and captures: `.shots/j-viewport/`, probes in `.shots/j-viewport/_scripts/`.
- **State: DONE** (23 Nov 2026). Built, probed (the bar E1/E2/E3 on the tree, HEAD and the Astro build; the desktop; the safe areas; the phone's GPU, sleep, first frame, measure time and SMOOTH in two rounds; the printed states), gates green on the final tree, documents written (CLAUDE.md §1, §2, §4; DESIGN.md; `60-as-built.md` G5; `stage/scenes/README.md`; `.impeccable/design.json`). Nothing committed: the director commits. Servers 5443 (pid 20792), 5444 (pid 32928), 5445 (pid 28380) stopped by pid, the ports closed, no headless Chrome left.
- **Not mine:** `HANDOFF.md` and `build/j-mobile.md` changed in the tree during this lane (the lead's and the director's notes: J2b NOW is next, after this lane's commit). Left alone.
- **Context7 (GSAP, /websites/gsap):** `ScrollTrigger.config({ ignoreMobileResize: true })` (fx-core.js): "vertical resizes (of 25% of the viewport height) on touch-only devices won't trigger a ScrollTrigger.refresh()": a bar change never reaches the host through ScrollTrigger's refresh. Chrome 157 here accepts CDP `Emulation.setSafeAreaInsetsOverride` (env() then reads the insets): the safe areas can be emulated.

## The bar, emulated (`_scripts/bar.mjs`; `.shots/j-viewport/bar/<tag>/`, log `bar-e2.log`)

- **How.** Headless Chrome 157, 393 wide, DPR 3, touch. The small viewport SH 695, the large HD 793 (Alberto's first
  screen as j-walk estimated it from his screenshot). E2 (iOS-like): svh, lvh and vh frozen at SH / HD px (fx.css
  rewritten on the way; the tree's canvas `100lvh` -> 793px), `documentElement.clientHeight` held at 695 (the ICB stays
  the small viewport), and the bar is the emulated viewport's height (CDP `Emulation.setDeviceMetricsOverride` 695 <->
  793): innerHeight, the layout viewport, fixed boxes, a sticky box's foot and the visual viewport move, as on iOS.
  Screenshots through CDP (`Page.captureScreenshot`: Playwright's own screenshot put its viewport back). Per change:
  `[stage] measured` and `[stage] type` lines, the canvas's width/height attributes, `GPUDevice.createTexture` by label,
  resize and visualViewport resize events. Light over text: the same run with every word transparent, p95 of the
  luminance over the night in every line box seen (DOM, clipped by its overflow ancestors), > 25 = lit.
- **Per bar change, E2:** the tree 0 measures, 0 type rasters, 0 backing changes, 0 textures made (1 resize and 1
  visualViewport resize event each); HEAD 2 measures (the window's resize and FX's onResize), 0 backing changes (its
  clientHeight does not move) but the canvas's box goes 695 -> 793 while the stage still draws 695: k = 1.1412, the
  picture stretched (a point at y lands at 1.141 y: a plate centred at 230 px jumps 32 px down and grows 14 %, the foot
  of the screen 98 px; the gallery's caption keep-out drawn 56-93 px below its caption: `bar/cmp-work-gal-rest.jpg`).
  The tree's box is 793 and its backing 501 x 1011 in both states, k 1.0001.
- **Light over text, E2** (work's gallery, the home's Now and gallery; at rest in both states, a strip across the
  change at rest, a fling down with the bar hiding 150 ms in and a fling up with it showing): the tree 0 lit frames
  everywhere (worst p95 1-3; with the bar hidden Now shows 8 more lines in the strip the bar uncovered, none lit); HEAD
  0 at rest, Now's fling down 2 lit frames (p95 30-31, 846-863 ms in, after the bar hid), its fling up 1-2 (one at
  189 ms, p95 28; the 227 at -124 ms is a screencast frame from before the hiding style: not counted since).
- **A case opener's caption, held by its bottom** (`case-sphere-ai.html`, 1.05 screens down; `bar/cmp-caseop-head-tree.jpg`,
  HEAD shown | hidden | tree shown | hidden): with the bar hidden the caption stands 98 px lower (its sticky foot is the
  layout viewport's). The tree's keep-out goes with it (vpH), the plate stays; HEAD's keep-out stays where clientHeight
  put it and is then stretched 1.141: its six text lines covered 6 / 6 shown, 5 / 6 hidden where drawn, 3 / 6 where the
  frame has it; the plate stretched over the caption's former place.
- **Now with the bar hidden** (`bar/cmp-tree-caseop-now.jpg`, right pair): the strip the bar uncovers holds WHAT I DO
  and the nine names; each has its keep-out (texts, keep-outs and day reach the canvas's foot).
- **Type rasters:** a bar change during a fling through Now cost HEAD 4 rasters of the glass's type (each measure resets
  the raster's key: now, +0.45 s, +1.3 s, and again from the second measure); the tree 0. From the hero (the display type
  near) both raster 3 times on the scroll itself, as before.
- **Strips at 50 ms across the change** (`bar/pair-now-fling-down.jpg`, `pair-now-fling-up.jpg`: HEAD above, the tree
  below, the same start y 987 / 1682; green the lines seen, red the keep-outs where the canvas draws them): from the frame
  the bar hides HEAD's keep-outs are drawn 1.141 times their place (stretched below their text, 60 px under the nine
  names at 1,200 ms), the tree's stay on their lines in every frame.
- **E1, Chrome's own height change** (every unit moves: a real resize to the page; work's gallery and the hero, at
  rest): the tree measures 2 times (the window's resize, and the body's ResizeObserver as the 100svh views grow) and
  reallocates once (frameTex 1, the bloom's 4 levels, the plates' ink texture, the backing); HEAD 3 measures and the
  same reallocation. A real resize is still measured.
- **E3, the visual viewport alone** (`Emulation.setPageScaleFactor` 1.6, a pinch zoom: visualViewport resize, no window
  resize): 0 measures, 0 rasters, 0 reallocations on both.
- **The Astro build (5445), E2** (work's gallery, the home's Now; at rest and the two flings): as the tree, 0 measures,
  0 rasters, 0 backing changes per bar change, box 793, k 1.0001, 0 lit frames of 536 (worst p95 3).
- **Not emulated:** whether Safari fires resize during the bar's animation or only at its end, and whether its layout
  viewport (so a sticky box held by its bottom, the case opener's caption, and its keep-out) moves frame by frame
  meanwhile; Safari's compositor itself (the canvas drawn on rAF while the page scrolls on the compositor: the finger
  against the canvas, Alberto's phone); a real iOS 26 floating bar's sizes (695 / 793 are j-walk's estimate).

## The desktop against HEAD (`_scripts/desk2.mjs`; `.shots/j-viewport/desk/`, `desk-all.log`)

- Whole pages at rest, the tree (5443) against HEAD (5444): the home (11 places) and work (9 / 11) at 1440 x 900 DPR 2
  and 1920 x 1080 DPR 1, about (5) and it/work (4) at 1920, a case (5) at 1440. Everywhere the canvas's box is the
  viewport (900 / 1080 = clientHeight): the tree calls `stage.resize(1440, 900, 2, 900)` / `(1920, 1080, 1, 1080)`, the
  stage's backing equal (2160 x 1350, 1920 x 1080), the frame uniform the same values by construction (boxH = cssH).
  work, about, it/work: the DOM layer (canvas hidden) pixel-identical and `stage.set` deep-equal at every place.
- Where they differed, each was looked into: (1) `bloom.plates` in the 8th decimal at Now (a damped value: HEAD against
  HEAD differs the same way); (2) a case's top at 1440, one keep-out 584 or 598 (the `.btn` measured during its row's
  rise: HEAD alone gives 598 in one load and 584 in the next); (3) the home's Consulting, Obla and end places, the DOM
  layer in some runs: whether the part's opening claimed its title after the probe's jump (`fx-motion.js` `parts()`:
  its near observer against fx-scroll's reveal). A race of HEAD's own: six loads each, HEAD's Consulting opening claimed
  2 times of 6, the tree's 4 of 6 (`_scripts/opener.mjs`); the static layout (`?stage=0`) identical to 1/64 px
  (`subpx.mjs`); the tree with HEAD's stylesheet, and HEAD against itself over the 11 places, no DOM difference; the
  same three places with 5 s of rest, in one run the tree and HEAD equal, in another not.

## The safe areas, emulated (`_scripts/safe.mjs`; CDP `Emulation.setSafeAreaInsetsOverride`; `.shots/j-viewport/safe/`)

- Upright 393 x 852 DPR 3 with the page under a status bar (top 59, bottom 34): HEAD's header 64 px with its words at
  5 px, inside the band; the tree's 123 px (64 + 59), its words at 64, its ground covering the band once scrolled,
  `ctx.safeTop` 59; the gallery's plate in step stands 59 px lower (CAP_HDR follows), Now's orrery band too
  (`sheet-upright.jpg`, `crop-hdr-scene.jpg`). Found and fixed on the way: below 1024 px the scene's name
  (`.hdr-scene`, css/motion.css) was placed at 50 % of the header's box, so under the band it stood over the name; now
  at the middle of the words (`calc(50% + env(safe-area-inset-top) / 2)`).
- Sideways 852 x 393 (left and right 59, bottom 21): HEAD's gutter 25.6 px, the header's name and the page's text
  inside the notch's band; the tree's gutter 59 px on both sides (`sheet-sideways.jpg`), the header's words on it, the
  sideways grammar otherwise HEAD's.

## The phone's measures against HEAD (Chrome 390 x 844 DPR 2, tier B, a quiet machine; `perf.sh`, logs `perf-r1.log`, `perf-r2.log`)

- In Chrome nothing has a bar: the canvas's box is clientHeight and the stage draws what HEAD drew; these say the change
  costs nothing where the frame and the box are one.
- **Round 1** (CPU 0-9 %). Gallery (`gpugal`): work at rest 0.43/0.47 and 0.43/0.44 ms (HEAD 0.43/0.47 twice), a travel's
  peak 0.48, p95 0.46 (HEAD the same); the home at rest 0.39/0.42, 0.38/0.42 (HEAD 0.39/0.43, 0.38/0.42), peak 0.47
  (HEAD 0.46), p95 0.44 both. Now (`gpunow`): the flight's peak 0.44 (HEAD 0.43), Now in place 0.79/0.80 twice (HEAD
  0.79/0.80, 0.79/0.82), the next place 0.14/0.16 (HEAD 0.13/0.16), its peak 0.78 (HEAD 0.81). The swarm never halved
  (80,000 drawn throughout, 0 halvings); asleep: 0 frames in 3 s after 19 s of quiet (work and Now, the tree; work,
  HEAD). First frame (`ff2`, ten alternated pairs): the home 359 ms median (quartiles 335-372; one load at 1,294 with a
  long frame 951 ms in) against HEAD's 344 (335-362); work 360 (324-379) against 326 (322-383); no long frame after the
  first, consoles clean.
- **A forced layout found and removed:** the host's own measure (`meas.mjs`) was 1.2-2 ms slower than HEAD's (the home
  8.7-11.8 against 7.2-8.7 ms, work 5.7-6.1 against 4.2-5.0): `vpH = innerHeight` was read after the sticky boxes were
  put back, and Chrome lays the page out to answer innerHeight. Read now with the box and the header, while the layout
  is clean: the home 7.6-8.8 against 7.4-8.2, work 4.0-5.2 against 4.7-5.6.

- **Round 2** (after the forced layout's fix; CPU 1-17 %). Gallery: work 0.43/0.46, 0.43/0.48 (HEAD 0.43/0.48,
  0.43/0.47), peak 0.48 both, p95 0.46 both; the home 0.39/0.43, 0.39/0.42 (HEAD 0.39/0.43, 0.38/0.40), peak 0.47 both.
  Now: the flight 0.43 both, in place 0.79/0.79-0.80 (HEAD 0.79/0.79-0.81), the next place 0.13-0.14/0.15 both, peak
  0.78 both. Never halved; asleep (0 frames, work and Now, the tree; work, HEAD). First frame: the home 393 ms median
  (343-521) against HEAD's 493 (390-528), work 364 (331-379) against 378 (336-413), the machine busier than in round 1
  (HEAD's loads up to 862 ms); with round 1 the two builds' medians cross (the tree 15-34 ms over in round 1, 14-100 under
  in round 2): no difference out of the spread. The host's measure: the home 7.5-9.6 ms against 7.7-9.2, work 4.7-7.2
  against 4.0-5.2.
- **SMOOTH** (k-smooth's `rec.mjs --m` and `cmp.sh`; records `.shots/k-smooth/rec/jv-*.json`): the worst velocity step
  of a plate at a slide's end (TAIL) on work with JS flings 88 px/s (HEAD 183, on a faint plate entering), the home's
  gallery 77 (HEAD 90), work with CDP touch flings 80 (HEAD 79); the eye 1.77 / 3.53 / 35 world px/s (HEAD 1.69 / 3.76
  / 38); no rAF gap over 24 ms but the touch run's 35-36 ms in both.

## Gates, the printed states, the detector

- **Gates on the final tree** (`_scripts/gates.sh`, logs `gate-*.log`): `assemble.mjs` exit 0 (fx.css up to date),
  `--check` exit 0, `check-claims-proto.mjs` OK (34 pages); from `web/`: `build.mjs --outDir ../.shots/j-viewport/dist`
  34 pages, `parity.mjs` PARITY OK (150 shared files, 0 differ), `asserts.mjs` ok (34 pages, 1,154 local references),
  the claims on the build OK; `VERCEL_ENV=production node web/scripts/release.mjs` exit 0 with its three `[release]`
  lines (34 pages, 32 in the sitemap, 159 files, 5.5 MB).
- **Printed states** (`_scripts/plain.mjs`, tree against HEAD, full-page; phone 390 x 844 and desktop 1440): heights equal
  everywhere; reduced motion 0 channels in all 6 pairs; print 0 in 5 of 6. Where `?stage=0`, `?gl=0` and the Italian
  home's print differed, HEAD differs from itself: five loads of work's `?stage=0` on a phone give HEAD two pictures
  (2 and 3 loads) and the tree one, which is one of HEAD's, bit for bit (`plainvar.mjs`); the Italian home's print, HEAD
  against HEAD 0, the tree against itself 4,056 channels, HEAD against the tree 0 on a second pair (`plainhh.mjs`): the
  same text with its ink's centroid 0.045 px apart (rasterisation, no layout change).
- **The detector** (`impeccable detect` on chrome.css, tokens.css, motion.css): one advisory, the menu's lines'
  `clamp(2.25rem, min(15vw, 10.5svh), 6.5rem)` (as DESIGN.md documents it; not this lane's).

## Fresh, on the final tree and the final Astro build (`_scripts/final.sh`, `final.log`)

- E2, the tree: work's gallery 0 measures / 0 rasters / 0 backings / 0 textures per change, its 9 lines covered by their
  keep-outs in both states, 0 lit frames of 275 in the two flings; the case opener 0 / 0 / 0 / 0, its 6 lines covered
  6 / 6 with the bar shown and hidden. E2, the Astro build: Now 0 / 0 / 0 / 0, 23 lines with the bar hidden all
  covered, 0 lit frames of 271 (worst p95 5). E1 (Chrome's own resize): measured (2) and reallocated (1), as a real
  resize must be.
- The desktop: work at 1440 all 11 places DOM 0 px, `stage.set` and the stage's size equal; the home at 1920, DOM equal
  but at Obla's place (HEAD's opening race), `stage.set` equal but `bloom.plates` in the 8th decimal at Now and one
  keep-out 1 px apart in the gallery (19 / 20, a rounding of a box read in the same race family).

## For the director

- Commit (one or two, by subject): the canvas and the measures (`fx-stage.js`, `stage/stage.js`); the safe areas
  (`css/tokens.css`, `css/chrome.css`, `css/motion.css`, `fx.css`, the five scenes, `stage/scenes/README.md`); the
  documents (CLAUDE.md, DESIGN.md, `.impeccable/design.json`, `60-as-built.md` G5, this file). `HANDOFF.md` and
  `build/j-mobile.md` changed during the lane are not mine.
- Alberto on his iPhone (Safari): Work's gallery and the home's Now while the bar hides (scrolling down) and shows
  (scrolling up): the plate, the cosmos and the orrery must not jump, stretch or slide when the bar moves, the light
  must stay off the caption and Now's text, and with the bar hidden the world must reach the screen's foot (no edge, no
  strip without stars). A case (`/case-sphere-ai.html`), its opener: the caption at the foot moves with the bar and the
  light stays off it. The header under the clock and the notch: its words below them, its dark ground covering the band
  once scrolled. Held sideways: the header's name, MENU and the text clear of the notch.
- The finger against the canvas, for his phone: a screen recording (Control Center, 60 fps) of two quick flicks, one
  through the gallery's head (the row of plates rises with its section) and one through Now; frame by frame, how far a
  plate's edge or the orrery stands from its rest place against the text while the page moves, divided by the scroll in
  one frame, is the lag in frames (two or more is visible: 33-66 px at 2,000 px/s). A slow-motion video (240 fps) of the
  screen from a second phone gives it in milliseconds. His model and iOS version say whether the page scrolls at 120 Hz
  while Safari draws the canvas at about 60 (WebKit 272226): then the canvas updates every second scroll frame.

## Built (in the tree, not committed)

- `fx-stage.js`: the canvas `height: 100%; height: max(100%, 100lvh)`; `measure()` reads the canvas's box (dh), the pixel ratio and the header's top padding (safeTop) and calls `stage.resize(cw, ch, dpr, dh)`; `layoutMoved()` + `onViewport()` on the window's resize and FX's onResize (a measure only when clientWidth, clientHeight, the box or the pixel ratio moved; innerHeight kept in `vpH` always); `at()` resolves a box held by its bottom with `vpH`; the tick keeps texts, media, `textRects()`, the keep-outs and the dawn rectangles down to dh (Contact's day too); `ctx.safeTop`.
- `stage/stage.js`: `resize(cssW, cssH, dpr, boxH)` (the backing covers the box), `packFrame` (view = the box, backing per css px over the box, the eye's y offset + (cssH - boxH) / 2), the plates' pack gets the same frame; `stats().view`; the header's API lines.
- `css/tokens.css`: `--hdr` + `env(safe-area-inset-top, 0px)` (phone and from 1024 px), `--gut` = max(the clamp, the left inset, the right inset). `css/chrome.css`: the header pads its top by the inset. `css/motion.css`: the phone's scene name in the header at the middle of the words (below the inset). `fx.css` reassembled. `.impeccable/design.json` and DESIGN.md's front matter: the two tokens.
- Scenes, each `+ c.safeTop` where they assumed the header: `gallery.js` (CAP_HDR, the queue's vanishing point, the phone line's 64), `now.js` (the orrery's band top and the labels' top), `obla.js` (60), `contact.js` (64), `case.js` (S.hdr). `stage/scenes/README.md`: `vw`/`vh` (the frame and the canvas's box) and `safeTop`.

## Facts (sources fetched 23 Nov 2026)

- **The units.** CSS Values 4 §6.1.2.1 (drafts.csswg.org/css-values-4): the large (lv*) and small (sv*) units "are fixed (and therefore stable) unless the viewport itself is resized"; the dynamic ones (dv*) "are not stable even while the viewport itself is unchanged ... can cause content to resize e.g. while the user scrolls"; the UA-default v* map to the large ones. MDN `<length>`: the same, and "all default viewport units (vh, vw, etc.) are equivalent to their large viewport counterparts".
- **The viewports on a phone.** web-platform-tests/interop-2022-viewport explainers (written with the engines): `layout-viewport.md`: "On mobile, browsers contract dynamic UA UI elements as you scroll down a page" and the layout viewport "follows the size"; "Elements that use position: fixed, are layed out against the Layout Viewport". `icb.md`: "On Mobile, the ICB remains the same size in most browsers, except for a few outliers" (those use an in-between value); `documentElement.clientHeight` measures the ICB and is not affected by pinch-zoom. `viewport-units.md`: "For all mobile browsers, the Small Viewport size follows the size of the ICB"; the large is "the ICB + size of the dynamic UA UI Elements that have retracted"; dvh is "not updated immediately", some browsers only once scrolling stops, and "Some browsers allow the Dynamic Viewport grow larger than the Large Viewport".
- **innerHeight and the visual viewport.** MDN Window.innerHeight: "The value of innerHeight is taken from the height of the window's layout viewport". MDN VisualViewport: the visual viewport shrinks with pinch-zoom and the on-screen keyboard without affecting the layout viewport; its `resize` and `scroll` events fire when it is resized or scrolled.
- **WebKit.** Bug 261185 ("[iOS] svh/dvh units are unexpectedly equal when Safari tab bar is not visible", fixed Nov 2023): Safari's small units had followed the toolbar ("our small viewport units are not spec compliant currently because we allow clients to override layout parameters"); since the fix svh is the small viewport. j-device's source for iOS 26: innerHeight changes as the floating bar collapses and expands (stevenocchipinti liquid-glass-spike).
- **What that means for HEAD on an iPhone.** The host projects into `documentElement.clientHeight` (the ICB = the small viewport, stable), the canvas is `position: fixed; height: 100%` (the layout viewport, which follows the bar): with the bar hidden the backing (small viewport tall) is stretched over a taller box, about 1.14 on Alberto's phone (793 / 695 if j-walk's estimate of his first screen holds), so every figure and keep-out slides off its text by up to ~100 px at the screen's foot. Each resize also re-measures twice (the window's resize, FX's onResize 200 ms later) and re-rasters the glass's type; the backing itself is reallocated only if clientHeight changes.

## The design (decided before the edit)

1. **The canvas:** `height: 100%` then `height: max(100%, 100lvh)` (fx-stage.js makeCanvas): never smaller than what is seen, never shrinking as the bar comes; a browser without lvh keeps 100%.
2. **The stage maps the scenes through the box:** `stage.resize(cssW, cssH, dpr, boxH)`: cssW x cssH stays the scenes' frame (clientWidth x clientHeight, as HEAD: the views are 100svh, the captions are held in svh, fx-scroll's caption line is clientHeight / 2), boxH is the canvas's own box (read once per measure). The backing covers the box; the frame uniform's view is the box, its eye offset carries (cssH - boxH) / 2 so every shader's eye (`view.xy * 0.5 + cam.yz`) stays the scenes' centre; the plates get the same (view h = box, eye offset). Where boxH = cssH (a desktop, Chrome, any browser without a bar) every value is HEAD's.
3. **The host draws the strip under the bar:** the drawn height dh = the box: texts, keep-outs, media and the dawn rectangles are kept and clipped to dh, not to the scenes' vh (a text in the strip a hidden bar uncovers keeps its keep-out; Contact's day covers the strip).
4. **A resize measures only a new layout:** the width, clientHeight (the ICB), the canvas's box and the device pixel ratio against the last measure; a bar change moves none of them (the layout viewport, innerHeight and the visual viewport do). The other measures stay (fonts, the body's height, the tracks, ScrollTrigger's refresh).
5. **Bottom-held sticky boxes** (a case opener's caption, `bottom: 26svh`) follow the scrollport's foot, which moves with the bar: the host keeps innerHeight (the layout viewport) from the resize events and resolves them with it, no measure.
6. **Safe areas:** `--hdr` includes `env(safe-area-inset-top)` and the header pads by it (everything that clears the header follows); `--gut` is at least the left and right insets (a phone held sideways); the scenes that assumed the header's 64 px add `ctx.safeTop` (gallery CAP_HDR, its phone line, now, obla, contact, case).
