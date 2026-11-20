# x-drive — the site driven with real input (lane DRIVE, port 5233)

- Done (run 2, 2026-11-11): the whole walk a–k, with real wheel, pointer, touch swipes, taps, keys, at 1440×900 and 390×844 DPR 2, EN and IT. No console error in any walk.
- Next: nothing in this lane; the "Needs elsewhere" below are for INTEGRATE / the stage.

## Fixed (my files)
1. css/type.css — the cover's first-screen text (`[data-focus="load"]`) blinked: the "fx-scroll not here yet" fallback rule outranked it, so the lower lines were shown sharp at first paint and replayed their focus when fx-scroll arrived (on a throttled link a visible blink at ~2.5 s). The fallback now leaves "load" text out: the focus plays once, at first paint. Looked: .shots/x-drive/a-cold-d-slow.jpg (before/after).
2. fx-core.js — turning the phone (390×844 → 844×390 → back) lost the reader's place: the scenes relay out, the browser clamps scrollY on the shorter page, and back in portrait the reader was 2 600 px from where they were (Consulting's close → middle of the blocks). The 1024 px breakpoint anchor now runs on every width change, takes a trailing sample (the throttle missed where a scroll came to rest), and waits for the unlock when the menu holds the page. Measured: y 5064 → 5064 after landscape and back with the menu open (was 5064 → 2492). Resize 1440→900→600→390→1440 mid-About keeps step 4.
3. css/chrome.css — the phone menu in landscape had 104 px lines (five taller than the 390 px screen); the size is now capped by the height too (min(15vw, 10.5svh)); portrait unchanged. Looked: .shots/x-drive/e-landscape.png.

## Walked and fine
- a cold load: type comes into focus, no wrong ground, stage starts ~2.5–3 s (6 s throttled) without a jump.
- b pointer across the plate (lights and tilt), wheel to Now and the index, rows hovered (others step back), click → cut.
- c every cut (header, menu, index row, gallery → case, More work, All work, Contact's dawn sheet, logo), Back/Forward after each: page alive, sheet gone, no lock, place kept; reload mid-scene keeps y.
- d language switch mid-scene lands on the same step (Work step 5, About stack 5), and back.
- e menu open/close, focus trap, Esc returns focus to the button, page doesn't scroll under it.
- f Work 9 steps + Evidence + close, About stack + path (IT), Consulting, Obla (IT phone), flings up and down: no step stuck, no blank sticky view, nothing left unfocused.
- g Tab through cover and Work: ring always visible, never under the header; skip link visible and works.
- i rest: awake until ~5.5 s, asleep by 7 s; first input wakes it with no jump.
- j ?stage=0, reduced motion, ?gl=0, no JS: complete identical plain pages (cover, Work, Domus Tua case).
- k Axe: 0 critical; the only "serious" are color-contrast on steps out of focus (scene mode's designed dim) — with --reduce all four scene pages are 0.

## Decisions
- The wheel lead clamp (fx-core leadClamp, 0.56 vh) makes a hard flick travel ~3 000 px: deliberate (MC-14), kept.
- The close has no Contact link by design; the dawn sheet comes from the header/menu.
- Not testable headless: a hidden tab (Playwright keeps visibilityState "visible").

## Needs elsewhere
1. STAGE (stage/scenes/obla.js or the keep-out in fx-stage.js): on the phone Obla's character draws opaque OVER the body text as the steps scroll up under it. it/obla.html, 390×844, swipe 0.45 vh at a time: at y≈365 "OBLA" and its paragraph are under the figure; y≈2918 "LAVORA"; y≈4742 "RIFERISCE". Capture .shots/x-drive/f-obla-m-it-1-read.jpg.
2. STAGE (stack scene keep-out): about.html at 900×900 and at 200 % zoom (720×450), the stack's front plate covers the step's title and tool list ("BACK-END & DB", "Spring", "PostGIS"). Captures .shots/x-drive/h-resize.jpg (900), .shots/x-drive/h-zoom200.png.
3. CASE lane: case-domus-tua.html figcaption stays at its unrevealed opacity in the Axe run (contrast 1.15) — check its data-focus reveal fires.
4. STAGE (small): the stage appears with a pop (the plate is there from one frame to the next, ~2.5 s; ~6 s on a slow link). A fade-in would read better.
5. STAGE (small): on About the top layer of the stack reads "CORE" in English and "LINGUAGGI" in Italian at the same step (.shots/x-drive/d-lang-about-m.jpg) — check the incised names match.

## How to run and look
python scripts/serve-static.py 5233 public; scripts in .shots/x-drive/_scripts/ (lib.mjs + `a-cold.mjs d|m [slow] [it]`, `b-cover.mjs d|m`, `c-cuts.mjs d|m [it]`, `d-lang.mjs d|m page`, `e-menu.mjs e|h|i`, `f-scenes.mjs d|m page [it]`, `g-keys.mjs page n [390]`, `g-skip.mjs`, `j-plain.mjs`, `copy.mjs`); contact sheets in .shots/x-drive/*.jpg.
