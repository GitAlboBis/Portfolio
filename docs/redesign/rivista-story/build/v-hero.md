# v-hero — the cover's hero rebuilt as a world seen by a moving camera (round 10, port 5253)

- Status: DONE and looked at (2026-11-11). Gates green (assemble 0, --check 0, check-claims OK). Server 5253 stopped.
- Owns: stage/scenes/hero.js, now.js, index.js (untouched), stage/scenes/cover/**, parts/b-hero.html, parts/c-main.index.html
  (untouched), css/page-cover.css; fx-stage.js only for the hero's small needs (below).
- Run and look: `python scripts/serve-static.py 5253 public`; one-off scripts in .shots/v-hero/_scripts/
  (shoot.mjs `<tag> arrive|sweep|fly|rest [--m] [--noback]`: screencast strips + sheets; stills.mjs: DPR 2 stills, Italian,
  printed states, index; dbg.mjs / keep.mjs: host and world state). Captures in .shots/v-hero/<tag>/.

## What was built
- stage/scenes/cover/world.js (new): the hall. The page's h1 is measured (offsets, so the lines' entrance transforms do
  not matter), rasterised in its own face and extruded: 110k targets, 62 % a white-hot front face, 18 % the sides along
  the letters' edges, 20 % five thin cobalt layers behind (T = 0.4 em, 0.34 on a phone). Beams: six straight sheaves
  from high out of frame crossing behind the name, turning slowly on the stage clock. Dust: 9k points spread evenly
  on screen at every depth of the flight. Five plates (three on a phone): two near and soft, three behind and between,
  placed by where the rest pose sees them. coverCamera(): landing (straight at the name, points land on the h1) →
  pull-back and rise (1.55–3.7 s) → rest (drift + slow sway on the stage clock, pointer orbit 0.13/0.075 rad, damp
  0.9) → flight on scroll (k = scrollY / Now's top): through the gap between the words (phone: between the lines),
  focus held on the name until the eye is through, then a rack to the window; ends on the exact straight view.
- Space decision: the name stands at z = 2D in front of the page plane, so the flight ENDS on the site's own straight
  camera with the Now plate at its place (z 50): hand-over to index is seamless, everything of the hall is behind
  the eye. The world is fixed to the viewport; the scroll moves only the camera.
- hero.js: arrival clock (any scroll/press: x6), `.is-lit` on the h1 at 1.45 s (CSS fades the flat name to
  transparent only while html.stage-on), weights fade with the flight, plates come in with the pull-back, keep-outs
  of the foot at rest only, rest 14, bloom 0.15–0.65.
- now.js: the plate is in the world from the first frame (the far lit window, lifted above-right of the name on a
  desktop, below it on a phone, settling into place by k 0.78), rides up with Now after; same camera as hero.js.
- shared.js: old beam/motes removed, C now holds world/cam/at/nowTop.
- b-hero.html: no data-refract on the h1 (the flat name must not be bent as a ghost), no tail mark.
- page-cover.css: hero 150svh in scene mode (the flight), foot enters at 1.9/2.05 s, foot leaves over 2–16vh,
  `.hero-name.is-lit` transparent under stage-on. The h1 keeps its printed place (an earlier margin rule moved it
  after first paint: removed; the camera frames the name at 0.42 / 0.30 of the height instead).

## Host changes (fx-stage.js; please review, director)
1. `ctx.look(partial)`: a scene's look overrides for the stage (kept across a rebuilt stage, set once per change).
   Needed: the sim clamps every particle's z to LOOK.far..near (−700..450) — the free camera's hall could not hold a
   name 4000 px in front of the page. The cover asks far −2.6 D, near 4.7 D (harmless to the scenes below: mist ink 0).
2. Keep-outs from `.btn` are dropped while the element is invisible by opacity (checkVisibility): the hero's faded
   button cut dark bands through the letters during the flight.

## Numbers
- GPU (stats gpuMs): desktop 1440 DPR 2 tier A at rest 2.99–3.02 ms (budget 3.5); DPR 1 2.1–2.2; mid-flight 0.6–1.0;
  phone 390 DPR 2 tier B 1.07 at rest, 0.3–0.8 in flight.
- First frame (boot-timing cover): 614 / 680 / 690 ms on 5253; the director's 5178 (same tree) 660 / 681; engine
  baseline 628. Within the run-to-run spread.
- Console clean in every run.

## Needs elsewhere
- stage/scenes/README.md (ENGINE): document `ctx.look` in the ctx table.
- CLAUDE.md / DESIGN.md / HANDOFF (DOCS): the cover is no longer "flat name + one plate on its last letters + a
  sheaf of rays"; the instrument line stays (t-label).
- Engine (optional): a free-camera scene may want LOOK.far/near set automatically from its fog/near instead.

## Open
- At rest the letters keep a fine speckle (individual points) at DPR 2; reads as light, not as type. More points
  or a larger size would cost GPU.
- Desktop DPR 2 rest is 3.0 ms of a 3.5 ms budget: a slower GPU may halve the count (the stage then doubles ink).
- Connector search not run (no new UI component: the hall is the stage's own formations and plates).
