# u-hero — round 11, the cover's hero version 2 (lane HERO2, port 5261)

- Owns: stage/scenes/hero.js, now.js, cover/**, parts/b-hero.html, css/page-cover.css, strings.mjs (hero.scroll only),
  assemble.mjs (one cover assertion), fx-stage.js (one small hero need, below).
- Run: `python scripts/serve-static.py 5261 public` (background, stop before return); one-off scripts in
  .shots/u-hero/_scripts/ (git-ignored); captures in .shots/u-hero/<tag>/.

## Done
- Read v1 (world.js, hero.js, now.js, shared.js), v-hero/v-engine/v-integrate notes, draw.wgsl, sim.wgsl, stage.js API.
- Measured the engine's particle -> target mapping (.shots/u-hero/_scripts/mult.mjs, mult2.mjs): j = floor(u * count)
  over the formation's rank strip is NOT a bijection: with as many targets as particles 22 % of targets get none and
  22 % get two (Poisson-like at every block size). This, not only the random draw, is v1's speckle. Consequence: an
  even target set alone cannot make an even face; the face is made even by EXPOSURE (the interior saturates to white,
  where a missing or doubled point cannot show) plus a dense outline run (the silhouette), and the unsaturated parts
  (the depth) are drawn as soft contour layers in their own formation with a larger disc (more points under each
  kernel, so the noise averages out).

## Decisions
- Formations (4 slots at most): `face` (front face fill + dense outline; order 102, bottom, always rank [0, share)),
  `deep` (8 contour layers through 0.7 em, larger softer discs, cobalt toward the back; order 100), `shafts` (three
  broad slabs of fine points, the dust is in them; order 103, top), `sheen` (a band of light that travels across the
  rim and the layers on the stage clock; order 101). now.js's `field` only from the start of the flight (k > 0.25), so
  at most four formations are ever asked for.
- The name is laid out by world.js itself (the h1 is only read for its text, face, weight and tracking): one line on a
  desktop, two on a phone. The flat h1 is transparent from the first paint under sc-on (css), never shown as flat type
  while the stage is expected.
- Ignition: `reveal` sweeps the face targets letter by letter (ordered A..I, each letter outline then fill), 70 ms a
  letter; revealed points start at the spawn point behind the current letter (emit 1; the outline from half way,
  emit 0.5) and fly in on the speed-capped spring: straight streaks of light out of the depth.
- Connector search (21st `search` "particle text 3D extruded light volumetric god rays scroll cue"): five "Particle
  Text" components (glyph pixels sampled into points, pointer repulsion, critically damped spring back) and Quantum
  Nebula (three.js bloom). Take as mechanism: points sampled from the glyph's pixels, a spring that returns them after
  the hand (no bounce). Refuse: canvas-2D / three.js renderers, random sampling, gradients and colour cycling, the
  "explode on click" (the stage is raw WebGPU and the name must stay still and crisp).

- (restart 2, after the cut) ON DISK: world.js v2 (face/deep/shafts/sheen, layout, plates, opening pose, flight),
  hero.js v2 (ignition clock, sweep reveal, plates, bloom flare), now.js (field only from the flight), css (h1
  transparent under sc-on, stage-dead/6 s safety net, scroll cue), b-hero.html (cue + 4 hidden captures),
  strings hero.scroll, fx-stage.js `stage-dead` class on death. Never run yet.

- (restart 2) Ran and looked; fixes after looking: the four formations take the whole population (a free 8 %
  streaked through the opening); shafts and sheen hold their slots from frame 1 (a weight rising at 1.4 s pulled
  points across the lit name), shown by reveal / ink; hidden points fade out fast (fadeOut 10: no rain-like streaks
  on the phone); the outline streaks in (emit 1), the face lights in place (emit 0: no burnt block); opening camera
  farther (0.95 D, yaw -0.9 -> rest -0.245, aperture 0.12); rest aperture 0.1; depth layers dimmer (T 0.6 em, ink
  0.045, falloff); shafts finer (size 2, ink 0.11, depths closer to the name: no thinned blotches); hand 0.14 (the
  letters no longer warp); plates' yaw +-0.1; plates re-placed (desktop w4 low-left; phone three in the top band,
  Now's plate top centre: nothing over the foot's text); bloom 0.4 at rest; css: stage-dead hides cue and 150svh.
- Numbers: rest A 1440 DPR2 0.9-1.0 ms GPU, phone B 0.34 ms; first frame 752 ms; gates OK.

## Next / still not as good as wanted
- Flight: the letters grow and vanish in ~2 frames of a quick scroll (near fade); no long "walls on both sides".
- Plates catch a grey soft-box sheen at some pointer angles (sphere-ai, Now plate).
- Shafts read as dust columns, not yet luminous volumes; face edges a little fuzzy at DPR 1, faint holes inside.
- Duplicate SerSan logos (Now plate + brand-film frame) in one view.

## Needs elsewhere
- (none yet)
