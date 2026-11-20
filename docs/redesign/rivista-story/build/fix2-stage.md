# FIX2-STAGE lane notes

- Lane: FIX2-STAGE (port 5197). Owns stage/** and fx-stage.js.
- State: STARTED. Brief = verdict.md regression 1, fix 3 remainder, pool, rings, phone Consulting, cover body.
- Base: HEAD fae54f7.
- Progress: item 1 fixed (it1); item 2 begun (draw.wgsl day alpha cut, it2 captures); run cut once, resumed
  (run 2) from git diff. Items 2-6 next.

## 2. Pale dust on paper (fix 3)

- Run 1 cut faint discs in draw.wgsl (per disc). A/B on Work (`.shots/fix2-stage/glide/work-head-d-top.png` vs
  `work-d-top.png`): that cut ERASED Work's four cobalt threads (they are many faint discs that add up). Reverted:
  draw.wgsl.js is back to HEAD.
- Now: the threshold is on the SUM. stage.js renders every particle into the ink texture on every frame (not only
  with glass) and blits it; `dayInk()` in glass.wgsl.js keeps day alpha >= 0.3, drops < 0.16 (premultiplied), night
  untouched. pageAt (what glass sees) uses the same curve.
- fall.js: drips stop 48 px short of the night's visible foot (`room`); dawn.js: its drips end on the edge (no ink
  past it). These were the pale/cobalt tails under the dusk strip.
- With glass on, the ink in front of the glass went straight to the canvas: now it goes through the ink texture again
  (passes C, D in stage.js) with the same day rule. mist.js: no ink under weight 0.22..0.5 (a few particles on a long
  thread = a speckled column).
- Threshold now smoothstep(0.2, 0.36, a). Work's threads stay (crisper, `.shots/fix2-stage/glide/work3-d-top.png`).
- Found on the way (regression-1 family): on the phone the drop crossing from the About row to the dusk edge painted
  bare paper over the row's sentence. fx-stage.js: each row's sentence (`.nv-ix-k`) is now in the row's backdrop part
  and in the gate's bendables, so it is bent, never deleted.

## 3-6 (in progress)

- 4: the band title's glyph rect is the first keep-out (no ink over its letters).
- 3: settle.js lays two rings under the drop (z < 0, so the glass bends them); pool.js: edge 0.42, dispersion 0.02,
  key 0.95, rim 1.8.
- 5: cause = tier B (touch/<768) has half the particles and the night figures did not take page.inkK: half as bright,
  read as unresolved. `inkFor()` (night/lib.js) and gen.js now multiply by page.inkK. Not a timing problem
  (`.shots/fix2-stage/run2j/sheet-m.png`: resolved at 0.5 s, only faint).
- 6: drop.js body dome sz 0.56 -> 0.74; body look: dispersion 0.017, reflect 1.35, key 1.3, rim 2.1.

## 1. Row lens erased WORK (regression 1)

- Reproduced at 390 (`.shots/fix2-stage/before/m-path-contents-*.png`): Now -> Fig. 02 -> In this issue, blank pill.
- Cause: the rows enter the backdrop set while still 1.4 vh below the screen; their lines are [data-reveal] not yet
  `.is-in` (opacity 0), so the raster painted no glyphs; the key (`r0,r1`) never changed after the reveal, so the
  raster was never redone (the 450/1300 ms redraws were long over). The glass then sampled bare paper over WORK.
- Fix: `backdrop.js` reports every node not at rest (pending reveal, running finite animation, transform, opacity
  ~0) as `unsettled`; `fx-stage.js` keeps `BD.ok` (parts at rest + rect of the raster on the GPU), rasterises again
  every 0.3 s (then 1 s) until every part is at rest, nulls it on measure. `gate()`: a figure is drawn (opacity, not
  size: `glass.js` `a.vis`) only when every bendable node under its footprint is in `BD.ok`; the drop waits in the
  margin until its row is in. Missing/stale backdrop = figure waits or is not drawn.
