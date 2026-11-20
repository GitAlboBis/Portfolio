# v-page — PAGE lane (round 10): nothing small, more motion in the page

- Status: DONE and looked at (2026-11-11). Gates green: assemble, --check exit 0, check-claims OK. Server 5252 stopped.
- Owns: css/*.css (not page-cover.css), parts/* (not b-hero.html, c-main.index.html), fx-core.js, fx-scroll.js, fx-nav.js, assemble.mjs assertions only.
- Run/look: python scripts/serve-static.py 5252 public (from the worktree root); one-off scripts in .shots/v-page/_scripts/.

## Done
- tokens.css: new scale (phone / desktop ≥1024): --t-label 15/16 px, --t-small 16/17, --t-btn 18/20, --t-nav 17/18,
  --t-body 18/20, --t-lead clamp(1.375rem, 1.9vw, 1.875rem); --tr-label 0.06em, --tr-btn 0.04em; --hdr 64/72 px;
  --btn-h 56/64 px. Motion tokens: --d-rise .82s / --d-rise-out .26s, --ease-rise, --row-gap 55ms, --d-row .6s,
  --d-hdr .42s, --d-sheet .46s / --d-sheet-out .28s, --d-cut .42s, --d-cut-out .38s, --d-hover-out, --d-press.
- type.css: labels, button (700, ink wipe from the left edge via ::before scaleX, arrow travels, press sinks), quiet
  link (button's label size, 2 px rule drawn from the left), the rise (mask = the line's own box: translateY(104%) +
  clip-path bottom inset 104% together), .rv-split/.rv-wipe words, .rv-row stagger, reduced-motion off switch.
- chrome.css + a-header.html: header 17/18 px items, name larger, enters on load (staggered), steps away on scroll
  down (html.hdr-away), one travelling rule (.hdr-rule, fx-nav.js); menu opens as a clip sheet, lines rise, closes faster.
- cuts.css + a-overlays.html + fx-nav.js: the cut is a title card (index line, rule across, name's words rising);
  page leaves at --d-cut + 40 ms; arrival sheet leaves in --d-cut-out. Events unchanged.
- fx-scroll.js: splits step/chapter titles into words, marks rows, .st-on per step in scene mode (enter / faster exit),
  IO once outside; Evidence's figures count up (text node restored byte for byte; sr-only copy while counting);
  one ST.refresh after the first screen's refract lines have risen (the host re-measures at rest).
- blocks.css, case.css, base.css, dawn.css, print.css: every hardcoded small size moved onto the scale.
- Connector search (21st.dev "text mask line reveal"): found soralabs "Text Reveal (Mask)" and the block-wipe reveals;
  taken as mechanism: a line slides up inside an overflow mask; refused: the coloured block wipes and SplitText (no
  plugin here); the mask is done with clip-path on the line itself, so no wrapper element is added.

## Decisions
- Refract titles ([data-refract]) never move: the host measures their glyphs; they get the clip-only wipe (.rv-wipe).
- Header step-away only past 0.8 vh, after 48 px down; back after 24 px up, at the dawn, under focus, menu, cut.

## Needs elsewhere
- stage/scenes/case.js: `const HDR = 64` hardcodes the header height; --hdr is now 72 px on a desktop (4.5rem). Read
  --hdr from CSS (getComputedStyle(document.documentElement).getPropertyValue("--hdr")) or use 72 at ≥1024 px.
- HERO lane: the shared type scale and motion are in css/tokens.css + css/type.css: use [data-focus-lines="load"] > .ln
  for the name's lines (rise on load), .btn / .q as they are; [data-refract] lines that rise on load are re-measured by
  one ScrollTrigger.refresh after they settle (fx-scroll.js settle()).

## Looked at (.shots/v-page/)
- look.mjs: every page type, 1440/1180/1024/390, EN+IT: no visible text under the floor, header on one line, no h-scroll,
  buttons 64/56 px tall, labels 20/18 px, console clean.
- strip.mjs: cut (title card), phone menu open/close, About step entrance, Evidence count-up (texts end exact),
  button/link hover, header rule, header away/back, phone dawn close.
- rows.mjs: case record, More work, 404 lists, Obla fields at 1024 and 390 IT: columns hold.
- plain.mjs: ?gl=0, ?stage=0, reduced motion: nothing left hidden or moved.
- Fixed after looking: the header stayed away over the dawn (order of the dawn test), tap highlight on the phone,
  the language divider's height.

## Motion added
| Where | What moves | How long | Easing |
|---|---|---|---|
| page h1 lines (load) | each .ln rises from its own mask, 60 ms apart | 0.82 s | --ease-rise |
| step / chapter titles | words rise per line (refract titles: clip wipe only), exit all at once | 0.82 s in / 0.26 s out | rise / ease-in |
| rows (tools, Evidence, More work, record, fields, gallery step parts) | up 0.9rem + fade, 55 ms apart | 0.6 s / 0.23 s out | rise / ease-in |
| Evidence figures | count 0 → printed value, once | 1.0–1.4 s | quart out |
| button | ink wipes in from the left edge, arrow travels; press sinks 1 px | 0.34 s in / 0.12 s out; 0.1 s | rise / out |
| quiet link | 2 px rule drawn from the left, arrow travels | 0.32 s / 0.12 s | rise / out |
| header | words drop in on load (staggered 45 ms); steps away on scroll down, back on up; one rule travels between items | 0.7 s; 0.42 s / 0.28 s; 0.42 s | rise; rise / in; rise |
| phone menu | sheet edge comes down (clip), lines rise 50 ms apart, foot follows; closes faster | 0.46 s / 0.28 s | rise / in |
| the cut | sheet rises; index, a rule across, the name's words rise 45 ms apart; page leaves at 460 ms; arrival sheet leaves up | 0.42 s + 0.38 s | io / rise |
| dawn close | title words rise, address and links follow 55 ms apart | 0.82 s / 0.6 s | rise |

## Open
- The stage draws over text in passing on a programmatic jump (Obla's character over the fields at the dawn edge,
  phone): the stage's, seen during a FX.scrollTo, not a reader's wheel.
