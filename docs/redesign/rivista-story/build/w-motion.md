# w-motion — the 2D layer as a title sequence (Anime.js 4 + WAAPI)

- Lane MOTION2D, port 5293, captures .shots/w-motion/. Owns fx-core/fx-scroll/fx-nav, new fx-motion.js, css/**, parts/**, assemble.mjs.
- Done: fx-motion.js (opening, steps, cut out/in, menu, hand, copy, header scene name), css/motion.css (hold, steps,
  hairline, odometer, header scene/reading line, menu row hand), head.html loader (mo-wait, mo-arr, __rvAnime),
  a-header.html (scene name, reading line, menu arrows), fx-nav hooks, fx-scroll step hook, assemble CSS list. Gates green.
  Looked: openings Work desk/phone, cover; Work step; cuts gallery→case, About→Contact, case→cover; phone menu.
- Fixed while looking: arrival card clear raced the sheet (now the sheet leaves on the clear's end); Contact's title and
  the header were not held (CSS specificity) so the opening could not claim them on an arrival; arrive() waits ≤300 ms
  for FX.mo.prepared; splitText lines are no longer reverted (the revert re-wrapped the lead under the eye).
- Next: openings About/Consulting/Obla/Contact, hand strips, floor.mjs + pairs.mjs, first frame vs HEAD, Italian.
- Fonti — 21st.dev "Text Reveal (Mask)" (soralabs): take the mechanism (letters rise behind a straight mask), refuse
  its React/motion runtime; Magic UI "Number Ticker": take the idea of a numeral that moves to its value, refuse its
  JS-engine count (here an odometer on transform, compositor only); "Rectangular Text Reveal": refused (coloured
  blocks sweeping text read as faux light).
- How to run: python scripts/serve-static.py 5293 public; node public/proto/rivista/assemble.mjs && --check; node scripts/check-claims-proto.mjs

## Decisions
- Anime.js **4.5.0** (latest 4.x, published 2026-06-22), jsDelivr `+esm` per subpath: `animejs@4.5.0/waapi/+esm` (10 KB) and
  `animejs@4.5.0/text/+esm` (13 KB). Each +esm bundle is self-contained (its own copy of the core), so modules are not
  mixed across bundles: `timeline` (35 KB) and `svg` are NOT loaded (below).
- **No createTimeline().sync() for the WAAPI beats.** Read in timeline.js 4.5.0: sync() pauses the WAAPI animation and
  drives its currentTime from the JS engine's ticker every frame, which puts every synced beat back on the main thread
  (the thing WAAPI is here to avoid while the stage owns the main thread). A page's "timeline" is a cue sheet instead:
  every beat is one `waapi.animate` with its own delay from one t0, so the whole sequence runs on the compositor.
- anime's waapi individual transforms (x, y) are animated through registered custom properties (`--translateY`), which
  are not composited: every beat animates `transform`, `opacity` and `clip-path` as whole properties.
- anime commits the final value inline at finish (commitStyles + cancel): beats that end at rest clear their inline
  transform / clip afterwards so no element keeps a layer.
- splitText (animejs/text) only for running text split into LINES (the leads of the first screen): its addEffect
  re-runs after fonts and width changes; the split stays after the lines have risen (a revert re-wrapped the lead under
  the eye: whole-word lines vs the browser's hyphen break and text-wrap: pretty). Display titles are split into
  letters by fx-motion itself, keeping each word whole and putting the font's kerning back as a per-letter margin
  (measured before and after the split), and never with an accessible duplicate: the stage's backdrop rasteriser
  walks the [data-refract] text nodes and would paint a hidden copy.
- SVG trace of the Supply Chain diagram: the case prints the diagram as a webp capture (no inline SVG on any page);
  inlining the SVG is a change of the case's media, not of the 2D layer: left open.
- Numbers that tick are odometers (a column of digits moved by transform on WAAPI), so no JS engine is loaded.

## State at return (2026-11-12)
- Gates: assemble --check exit 0; check-claims-proto OK. floor.mjs (1920/1440/1024/390, en+it): small 0 everywhere.
  pairs.mjs (32 desktop cuts): twice 0 on every pair, order start>covered>uncovered>arrived, arrived 903–1043 ms
  (cover arrivals the longest, ~1000 ms). Console clean on every page probed.
- Long tasks: none from this code (lt.mjs, motion vs ?fx=core,scroll,nav,stage: the cover's one 62–76 ms task is
  there without the module too). First frame: HEAD copy vs HEAD + only this lane's files, 4 runs each on the cover:
  medians 686 vs 677 ms (noise). The anime import starts once the scripts have settled, not with them.
- Library blocked: whole by 2.5 s (CSS hold plays at 1.6 s). Library 3.2 s late: claims nothing (no second entrance).
- Final sheets: .shots/w-motion/final/.

## What GSAP still does (five lines)
1. Its ticker drives Lenis (the smooth wheel) and is the page's one rAF loop for scroll work (fx-core.js).
2. ScrollTrigger: refresh/update after build and on Lenis scroll (pins and measured layouts of the scene grammar).
3. gsap.matchMedia() is handed to modules in ctx (fx-core), and gsap.parseEase gives the anchor glide its ease.
4. FX.whenStill polls on the GSAP ticker.
5. Nothing on screen is tweened by GSAP any more: entrances, steps, the cut card, the menu, the hand are Anime.js WAAPI
   beats or CSS. A later round could replace Lenis's ticker with a plain rAF and drop GSAP if ScrollTrigger goes.

## Still wrong (ranked)
1. A page without the cover waits for the stage's first frame (0.6–1.1 s) on a dark screen before the opening starts
   (the brief's rule); at HEAD the first screen rose at once. If it reads as a slow load, start the header at once and
   only the title with the stage.
2. Arriving after a cut, the screencast shows the sheet without its card for ~250 ms (the card's name is painted late,
   fonts swap / first paint of the new document); not new in this round, but the card is the cut's whole point.
3. The cover's cut arrival lands ~1000 ms (others ~910): the wait for FX.mo.prepared (≤300 ms) plus the clear.
4. Not built: the Supply Chain diagram tracing itself (the case prints a webp; the SVGs exist in public/captures/ but
   are not inlined anywhere), years ticking on About's path, the case record's numerals ticking.
5. The header's scene name is desktop only (no room beside MENU at 390 px).
6. The display titles of the opening stay split into letters (kerning is restored as per-letter margins, measured);
   reduced motion and no-script read the unsplit text (identical glyph positions by construction, not re-measured
   after a later font swap).

## Needs elsewhere
- (none required) fx-stage.js could emit `fx:stage:first` and the cover's hero.js `fx:stage:lit` (name locked) so the
  opening need not watch html.stage-on with a MutationObserver and guess the 2.25 s of the hall.
