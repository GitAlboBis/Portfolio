# z-host — HOST lane notes (spec 50 §5, §3)

- Lane: HOST, port 5203. Owns `fx-stage.js`, `stage/scenes/**`, `stage/day/**`, `stage/night/**`.
- State: DONE (run 1). Gates green (assemble exit 0, `--check` exit 0, claims OK 32 pages). Servers 5203/5204 stopped.

## Done

- `fx-stage.js` rewritten as the scene loader (spec 50 §3, §5): imports `stage/scenes/NAME.js` per `[data-stage]`
  (missing/failing skipped); ctx per frame (view, fig, step/steps/local/progress/through, cue, pointer, scroll velocity,
  tier, share/weight, marks, imgs, texts, media, dawn, ground, etch, texture); blends scenes by viewport share; one
  `stage.set` per frame with formations (top 4), `dawn` rects, legacy `night`, `camera` (+ `follow`), `slabs` (top 12,
  extras `etch/inset/bevel/ior/dispersion/tint` passed through), keepouts, focus pull on a change of leading scene.
  `<img data-slab>` loaded as slab textures (a copy, when the section is near); `[data-refract]` rasterised for
  `setBackdrop` while a slab shows; instrument line; html.stage-on; device/visibility/cut pause as before; tick on GSAP's
  ticker or rAF, a throwing tick turns the stage off.
- A case page's main is the `mist` scene (the swarm as mist only, pictures kept out).
- Night scenes (blend true) let their light go as the dawn edge enters (gone by 0.62 vh): no light figure crosses into
  the day as ink blots.
- `stage/scenes/lib/raster.js`: `rasteriseType` and `etch` (display face, uppercase, white on transparent).
- Scenes: `consult.js`, `obla.js` (figures as built, unboxed, in the figure's half), `dawn.js` + `day/threads.js`,
  `contact.js` + `day/arcs.js`, `mist.js` + `night/mist.js`. README with the API and a 36-line example (run on the bench
  against the live core: a plate with etched words + swarm, `.shots/host/x1/e2.png`).
- Bench: `stage/scenes/bench.html` (real fx-stage.js + an FX stand-in).
- Deleted (working tree only, not staged): `stage/day/{beads,current,dawn,drop,fall,lens,mist,page,plume,pool,rest,
  ring,settle}.js`.

## Decisions

- Formation ids `<scene>:<id>`; order = page order. Scenes answer in VIEWPORT px.
- Figure's half: `data-stage-side`, else `top` under 1024 px (the stacked layout), else opposite `sc-left`/`sc-right`,
  else measured from the steps' first child.
- Step numbers come from `data-stage-step` (0 = intro). Reading line 0.5 vh.
- Tokens: paper `--dawn`, ink `--dawn-ink`, accent `--cobalt`, night `--night`, nightAccent `--accent` (if `--cobalt`).
- The camera: host blends (0.2 s) and sends `follow` 0.035 x the scenes' `pointer`; the stage damps and applies it.
- Dawn threads: 5 (3 phone), slow tanh S across the edge, light above, cobalt below, slide only. Contact arcs: 6 (5 phone)
  partial ellipses round the display line, outer ones stop short of the header, settle ~1.7 s; text blocks keep-outs.

## Look log (.shots/host/)

- r1 (1440 Consulting): c0 intro (gen's noise frame), c2 cut, d1 threads at the edge. f2/d1: no blots after the fade.
- r2 (1440 Obla): o2 thinking, d1; k1 contact. r4/k1 contact with 6 arcs. f3/d0 Obla fading as the dawn enters.
- p1/p2/p3 (390): Consulting cut on top, Obla working, dawn threads, contact arcs. m2/m0 case page mist.
- host-reduce, host-nogpu (visual gate): printed pages, CLEAN.

## Open / for other lanes

- SYSTEM: `strings.mjs` has no `stage.points` ("{n} points" / «{n} punti») nor `instr.gpu` ("{ms} ms GPU"): the
  instrument line stays empty until they exist (host writes nothing when FX.t returns the id).
- COVER/WORK/REST: until `hero.js`, `now.js`, `index.js`, `gallery.js`, `evidence.js`, `stack.js`, `path.js` exist,
  their pages log one 404 per missing module (the scene is skipped; the console is not clean on those pages).
- CORE: `stage/dev.html` registers old day formations by id (`rest, plume, ring, current, mist, fall, dawn`), now gone.
- Contact at 1440: outer arcs pass close under the link row (keep-outs hold; tune if it reads crowded).
