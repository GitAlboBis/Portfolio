# u-page — round 11, PAGE2 lane (port 5262)

- Status: DONE and looked at (21:50). Gates green (assemble, --check 0, claims OK).
- Run / look: python scripts/serve-static.py 5262 public; one-off scripts in .shots/u-page/_scripts/.

## Done
- tokens.css: fluid reading sizes from ~1200 px (clamp rem floor + vw, rem cap); phone label 16, phone nav (MENU) 18;
  --t-lang new; --hdr and --btn-h grow; --col = 27.2 body ems on a desktop; lead min(1.9vw, body slope) cap 34 px;
  --d-cut-clear 0.1s, --d-cut-out 0.32s; the stale legal-line comment corrected (legal uses --t-small).
- chrome.css: header lang at --t-lang.
- cuts.css + a-overlays.html + fx-nav.js: arrival clears the card (words go up, sub and rule fade) for 100 ms while
  the sheet still covers, THEN the sheet leaves, data-arrive goes, fx:nav:uncovered fires; arrived on the sheet's own
  transform transitionend (children's transitionend no longer eats the once-listener).
- type.css + fx-scroll.js: figure.cs-still enters once (.rv-pic: clip from the foot + scale 1.06 → 1, caption after
  280 ms), waits for decode (max 1.2 s); links in running text (.ln-in, dawn/contact address) draw a 2 px rule.
- print.css: rv-pic and the drawn rule reset.

## Looked (after the cut, 21:30-21:50)
- floor.mjs over 9 pages x 7 viewports x 2 languages: 0 text nodes under the floor (16 at 1440, 18 at 1920, 15 phone);
  header never wraps (gap >= 22 px at 1024 IT); the 2560 h-scroll on case-sersan-io is gone (rerun).
- pairs.mjs (new): 30 header pairs + gallery->case + case->work, EN and IT desktop, 6 pairs phone: events always
  start>covered>uncovered>arrived; the card's name never on screen with the arriving h1 (0 frames); arrived 880-970 ms.
- --d-cut-out 0.32 -> 0.28 s (tokens.css, fx-nav.js fallback, cuts.css comment): the cut lands at ~900 ms.
- cuts.mjs strips (50 ms), desktop + phone: the card clears before the sheet leaves; dawn sheet to Contact the same.
- Pictures: the case stills opened on an EMPTY box: Chrome's own lazy load fired ~2.4 s after the figure was on
  screen. fx-scroll.js now switches a .rv-pic image to eager 150 % of a screen before it enters; strips now show the
  picture rising from its foot (pics/, pics-m/). Reduced motion and print: still plain (dbg-reduce.png).

## Scale as measured (px; 390 / 1024 / 1440 / 1920 / 2560)
nav 18/18/20/24/28 · name 20.2/20.2/22.4/26.9/31.4 · lang 18/18/18/22/24 · btn 18/20/20/23/26 (h 56/64/64/74/84)
· label & small 16/17/18/21/23 · body 18/20/20/22.5/24 · lead 22/22/27.4/30.8/34 · --hdr 64/72/72/86/96

## Decisions
- Connector search (21st.dev "image clip-path reveal on scroll"): found unlumen "Scroll Reveal Image" (width expands,
  zoom out, spring radius) and clip-path shape images; taken as mechanism: the picture settles from a small overscale
  while a mask opens; refused: radius morphs, springs, shaped masks (square corners, straight edges only here).
- The overscale widened the page at 2560 (a transformed box counts in scroll overflow): .rv-pic { overflow-x: clip }.
- Fluid sizes start where the vw term passes the round-10 floor (nav ~1200 px, label ~1280, body ~1440): continuous,
  no jump at 1440; below that round 10's sizes hold.

## Needs elsewhere
- (none yet)
