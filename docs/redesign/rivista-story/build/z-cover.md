# z-cover — COVER lane notes (wave 2, port 5204)

- **Done (run 1):** `stage/scenes/{hero,now,index}.js`, `stage/scenes/cover/shared.js`; `b-hero.html` (name in two
  .ln spans, tail mark), `c-main.index.html` (data-stage-mark="ix-*" on the titles), `css/page-cover.css`. Looked at
  v1–v11 in `.shots/cover/` (1440 and 390). Gates green after v11.
- **State: DONE (run 1).** Italian cover, --reduce and --nogpu printed states looked at (CLEAN); final captures in
  `.shots/cover/final/` (desk-sheet.png, phone-sheet.png and the named frames). Gates: assemble 0, --check 0 (a run
  in between saw obla.html stale from the REST lane; rebuilt, green), claims OK. Server 5204 stopped.
- **Open:** the travel's mid frame is a soft dark plate (by design: the focus pull hides the capture switching on);
  the hero beam is quiet (deep, DOF-soft); `stage/scenes/cover/` is a folder inside HOST's scenes tree (mine).
- **How to run and look:** `python scripts/serve-static.py 5204 public` (background); captures with the one-off
  `shoot.mjs` in the session scratchpad (headless, `launch()` of scripts/lib/headless.mjs) into `.shots/cover/<tag>/`.

## Decisions (the frames)

- **One plate across hero and now.** The host prefixes slab ids by scene, so two scenes cannot hand one plate over
  without a double. `now.js` (blend:false, near from scroll 0 because the now section starts one screen down) owns
  THE plate for both: at scroll 0 it floats over the name's tail (`data-stage-mark="tail"` on "eri" in the h1, read by
  `hero.js` and shared through `scenes/cover/shared.js`); through the first screen of scroll it travels in document
  space to the figure's half of Now, turns to face the reader, and racks out of focus at mid-way, where the sersan.io
  capture switches on inside it (the focus verb hides the switch), then comes sharp holding it. After that it rides
  with the Now section and leaves upward with it (no pop).
- **The hero's swarm is a beam**: a sheaf of fine straight threads of light from deep in the upper left of the room,
  gathering into a waist right behind the plate (thin = cobalt, gathered = white, so the plate's bevels split it and
  its edges light) and fanning out past the right edge. Plus sparse dust in depth. Straight lines, no wave: nothing
  liquid.
- **The hero's foot (role, sentence, actions, instrument) leaves focus on the first third of scroll** (CSS scroll
  timeline, scene mode only), so the plate never passes over the button on its way to Now.
- **Index emblems** in the right half (desktop): Work = a fan of nine small clear plates with light behind; About = a
  line in depth with five bright nodes; Consulting = the hub and its agents (night/agents.js, reused); Obla = its
  outline in light (superellipse pillow + hem + eyes, from night/character.js's numbers). No cue: the calm field
  (night/mist.js).
- Shared formations live in `stage/scenes/cover/` (a folder, never a scene name: the host imports only
  `scenes/NAME.js`).
- **Yaw of the hero plate: -0.32 rad (18°), not 25°.** At 25° the CORE studio's key soft box floods the face into a
  wide grey stripe at rest (v7/yaw3.png, middle); at 18° the plate reads as clear thick glass, ERI bent with the
  spectral fringe, and the pointer swings the band onto it. 32° shows dashed far edges.
- **Now's pose is anchored to the Now section, never to its view** (the sticky view of a one-step scene reports the
  wrong y once the section scrolls: v2 showed the plate stuck over the index).
- **The halo** sits 170 px behind the page, sized and placed through the stage's perspective (eye 1.25 × diagonal)
  so it shows as a thin line of light ~5 % outside the plate's edges. Crisp (fuzz 0.4, flow 0.6).
- **About's emblem**: five upright ticks on a line (a timeline), not knots: round knots on a thread read as beads.
- **Calm field**: a still lattice of points through the room's depth (formation `rest`), seen from three quarters.
  A horizontal line of light was tried and refused (read as a horizon over water, v9); a lattice turning with the
  pointer streaked like rain (the stage's shutter), so it is still: only the camera's few degrees move it.
- **Phone index**: the rows span the screen (a row's link is a full-width text block), so the emblem is a small living
  mark (96–150 px) standing on the cued title's baseline at the right; keep-outs are the titles' glyphs only.
- **Phone Now**: the text is long; the plate takes the band between the header and the text's first line.
- Connector search (21st.dev): "Disc Reveal List" — taken as a mechanism only: the other rows dim while one is under
  the hand (CSS :has, page-cover.css). Nothing installed.

## Look log
- v1: first frames. v2: Now plate stuck over the index (fixed). v3: emblems. v4/v5m/v6m: phone. v7: yaw A/B.
  v8: the travel strip. v9: horizon line refused. v10/v11: lattice.
