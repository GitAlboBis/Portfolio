# FIX-PAGE lane — material fixes 4, 6, 7, 8 (part) and two lesser items from review.md

- Lane: FIX-PAGE (port 5195, stopped). Owns parts/*, assemble.mjs, the five fx-*.css, fx-core.js, fx-hero.js, fx-nav.js, fx-scroll.js.
- Base: HEAD 60cd604. The stage lane edits stage/** and fx-stage.js in the same tree at the same time: those diffs are not mine.
- State: DONE. Gates green, captures looked at, console clean.

## Edits

- Fix 4, `fx-scroll.css` §13a: under reduced motion `.ix-row .nv-ix-v .sc-roll-b { display: none }`. Every other roll in
  the built pages was listed (About proof/See the work, case figs/Visit, Next work/Open, Work kickers/Open): only the
  contents rows print the same word twice.
- Fix 6, `fx-scroll.css` §12b: the night ground on `<html>` is `html[data-night-page]:has(.hdr.is-night)`; the cover's
  `<html>` stays transparent (paper from body) and its scrollbar paper while the header is over the dusk strip.
- Fix 7, cause: `parts/head.html` set `gl-off` only when `!('gpu' in navigator)`; a browser (and the gate's --nogpu)
  with `navigator.gpu` present but undefined kept the scenes' scrub layout. Now `!navigator.gpu`. `fx-scroll.js` also
  folds the scenes (drops `[data-on]`, `ScrollTrigger.refresh()`) if `gl-off` arrives after build. No-GPU Consulting is
  now 3694 px at 1440, the same as reduced motion.
- Fix 8 (part): the dusk strip's "By night" / "Di notte" h2 and `ix.night` deleted; the section loses its
  `aria-labelledby` (no unnamed duplicate region); `.ix-dusk .nv-ix-list { margin-top: 0 }`. The role line stays.
- Lesser, phone seam: the sticky figure's foot is a 1 px `--line` rule with a 1.25 rem band under the caption; copy now
  passes under a straight ruled sheet edge.
- Lesser, IT Obla row: "… e ogni mattina alle 08:00 fa rapporto." (claims gate OK).

## Open

- Stage lane: when the stage dies before its first draw on a night page (no adapter, fallback adapter), `teardown`
  sets no `gl-off`, so the scenes keep the scrub layout. Adding `gl-off` there would fold them via fx-scroll.js.
- Docs lane: DESIGN.md lines 441 and 876 and 40-as-built.md line 14 still name the "By night" label.
