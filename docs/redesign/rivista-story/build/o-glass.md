# o-glass (GLASS2, port 5331; HEAD copy served on 5332 from .shots/o-glass/_before)

- Done: 1 prism clear glass (plates.wgsl.js prLights/prEnv, entry point along the ray: the grey bar was the old
  per-normal push putting a 10 px band at full bevel; hairline arrises; hairline strip reflection on the right face;
  room mirrored in faces/TIR; tint 0.3). 2 internal beam top->exit, fan from one exit point, stations right and down
  (no V), phone shaft steep. Obla's emblem forms (it was off-screen in the old probe). 3 throughOther keeps sheen cut,
  etch, edge line; the prism sees plates through it; Work's fan plates clear (sheen 0.08, edge 0.45).
  4 contact.js phone pairs near-parallel; threads.js phone slopes within 0.3 deg; consult/obla close their aperture as
  the dawn edge rises (the phone's dawn strokes were a soft blue band). 5 gen made = splat mark (consult.js GM, gen.js
  GEN.cover, splat/gen.js mark passes rings/sides). 6 splatname.js: frontal light, night-cobalt shade, emit 0.9, white face.
- Next: (resumed after cut, 2nd session) gates PASS (assemble --check 0, claims OK, web build/asserts/claims/parity OK); now final looks, text crops, GPU, sleep, states, bench guard; 7 if time.
- Decisions: "facet where light turns inside" = the beam drawn inside the glass (a lit parallelogram read as a grey card).
- Run/look: q.mjs 5331 <tag> d|m|d1 [row]; rows.sh; page.mjs; edge.mjs; gen.mjs; cover.mjs (all in .shots/o-glass/_scripts).

## Session 2 (resumed after the cut)
- Done: gates (assemble --check 0, claims OK, web build/asserts/claims/parity OK, re-run after the last edits).
  contact.js: desktop pairs near-parallel too (desktop still crossed as a flat X over/under WRITE TO ME).
  hero.js (?name=splat only): bloom x2.2, threshold 0.38: the splat face now glows like today's name.
- Checks: text crops index/contact on vs stage=0 clean; console clean 32 pages; sleep 0 frames on 7 pages; states
  same hidden counts as HEAD; failsplat ok; bench gallery/stack identical to HEAD (0 px differ); first frames = HEAD.
  GPU: index peak 2.90 (d) 1.71 (d1) 0.51 (m); consulting single-frame spikes to 6-7 ms in both mine and HEAD (noise:
  another lane rendering); medians 1.1-1.3.
- Stays: 7 (pipeline compile) not attempted.
- Needs elsewhere: stage.js extra pass depth vs plates (the splat name pushes the left plate off-frame, hero.js).
