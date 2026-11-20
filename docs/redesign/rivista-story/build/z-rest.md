# z-rest — lane REST (wave 2), port 5206

## Status: DONE (run 1). Gates green. Server 5206 stopped.

## Done (on disk, nothing committed)
- `stage/scenes/stack.js` (new). Eight flat plates (t 15, bevel 3). The scene turns the stack itself to the
  three-quarter view, V = X(a)·Y(b) with slab signs, about the stack's own centre. It does not use the stage camera,
  because the host sends no pivot and the camera turns about the centre of the viewport. Head: the block is closed
  (gap 14) with light running far through it. Steps: the layers part round layer k (tanh); layer k slides toward the
  reader with glow 1 and a strong etch; the others are soft (sharp .55) with a faint etch (rgba .17). A sheet of 7
  threads (formation "light") lies in layer k's plane. The formation's rotate is [-pitch, -yaw, roll] of euler(V),
  because the formation's x and y signs are the slab's negated (checked on screen). Turn b runs 0.94 → 0.60 with
  the scroll, damped. The etch on each layer is its step's h2, so the Italian page shows the Italian names.
- `stage/scenes/path.js` (new). One polyline (formation "light", emit 0: emit -1 made a spray at the reveal edge)
  through five upright panes. Each pane is etched with the month and year of its step's label, read from the DOM.
  The camera follows the line: the formation offset puts node k at the focus, the line shows from 0.32 S before it,
  and passed nodes fade out. Head: a pull-back overview (pivot 1.25 S, z −320, focus point moved left) that damps into
  step 1.
- `stage/scenes/contact.js` (rewritten; it no longer imports `day/arcs.js`). The HOST arcs were blurry nested
  ellipses and read as ripples. The new figure is two pairs of fine crossing threads, all in focus: domes over the
  capitals and bowls under them. They stay in the free bands between the header, the line and the foot, open out from
  behind the line over 2.4 s, then the ink slides along them. The display line's keep-out is its capitals (the host's
  glyph box is the content area, 1.2 em; the caps run from 0.189 to 0.763 of it, measured).
- `css/page-contact.css`: the line across the measure (EN 4.27 em, IT 3.13 em, max 24rem). Below it, the sentence
  on the left and the address with its controls on the right; one column on the phone.
- `css/page-about.css`: tools measure. Plain flow (no sc-on, or gl-off) at ≥1024 px: the groups and the path in two
  columns of ruled rows.
- `css/page-night.css`: Obla head order, step-line measure, Consulting close.
- `parts/c-main.obla.html`: "Personal project" moved from an eyebrow above OBLA to a quiet label under the lead.
- No new strings.

## Gates (last run)
- assemble ok (162 strings); `--check` exit 0; check-claims-proto OK (32 pages).
- visual-gate `--reduce` (about, obla, contact) CLEAN; `--nogpu` (about, consulting) CLEAN.
- Stage captures: console clean, no GPU errors (about, contact, consulting, obla, it/about, it/contact).

## Open / for other lanes
- HOST: `stage/day/arcs.js` is no longer used by any scene (contact.js has its own threads).
- HOST: the agents figure (Consulting step 4 and the close) draws its out-of-focus nodes as soft round discs. Obla's
  idle state has a grainy round halo. Both are "as built", but they come closest to the rule that nothing may read
  as a drop or a ripple.
- HOST/CORE: the host could pass `camera.cx/cy` (a pivot) so a scene can orbit its own figure with the real camera.
  Stack and path turn their own figures for now.
- Stack: the top layer's faint "CORE" etch stays readable at every step, because nothing covers it.
- Phone stack plates show dotted edges at DPR 2 (CORE's known thin-layer aliasing).

## How to run and look
- `python scripts/serve-static.py 5206 public` (background), then
  `node <scratchpad>/rest-cap.mjs <tag> about.html d|m top s:stack:4 s:path:2 el:#write:0.45 [--seq=N]`
  → `.shots/z-rest/<tag>/` (the scratchpad's cap.mjs belongs to the WORK lane).

## Look log
- stk1: etch upside down (plates had pitch +π/2, bottom face up), fixed with −π/2. stk3: good frames, dull head, so
  the head's light was boosted.
- pth1: overview panes over the title, so the line was turned to the upper left. pth4: the swing threw a pane into
  the text, replaced by a pull-back. pth5: phone spray at the reveal edge, fixed with emit 0.
- ct1/ct2: the threads entered the header and the phone showed nested circles, so the bands and sagitta were capped
  and the keep-out set to the capitals (ct4).
