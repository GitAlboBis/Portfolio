# GLASS lane — build notes

- **Lane:** GLASS (port 5186). Owns `stage/glass/**` (new) + what it must change in `stage/stage.js`, `stage/wgsl/**`, `stage/helpers.js`, `stage/dev.html`.
- **State (run 1, done):** glass renderer, backdrop helper, three bench figures, API documented at the top of `stage/stage.js`. Looked at on headless captures (`.shots/glass/`), console clean, `tsc --checkJs` clean (stage.js, glass/*.js, with `--lib es2022,dom,dom.iterable --types @webgpu/types`). Server 5186 stopped.
- **Next (other lanes):** HOST writes the real figures under `stage/day/` from `stage/glass/demos.js`, calls `rasteriseBackdrop` + `setBackdrop`, drives `set({ glass, focus })`. See "For HOST" below.
- **Run and look:** `python scripts/serve-static.py 5186 public` then `http://127.0.0.1:5186/proto/rivista/stage/dev.html?glass=name&f=mist:1,orbit@glass:1&y=0` (live), add `&t=2600` to freeze, `&in=night`, `&px=&py=` pointer, `&down=1` press, `&gl=k:v` look, `&gm=k:v` motion, `&gl=debug:1..6`, `&tier=B|C`. Others: `glass=lens&at=lens&atv=0.5`, `glass=beads&at=beads&atv=0.35`.

## Files

| file | what |
|---|---|
| `stage/glass/glass.wgsl.js` | the material: SDF of up to 8 blended ellipsoids, sphere tracing in the stage camera, entry + back march + exit (three exits with dispersion), the foot in contact with the page, studio (white sweep, flags, soft boxes, rim), edge band, Fresnel, Beer with the page's cobalt, shadow + caustic, the ink blit |
| `stage/glass/glass.js` | `createGlass()` (owned by stage.js): pipelines, backdrop + ink textures, figure registry, the motion (noise, lean spring, ripple, spin with scroll, damped key), packing, tier rule `GLASS_TIER`, `GLASS_DEF`, `STUDIO` |
| `stage/glass/backdrop.js` | `rasteriseBackdrop({ nodes, rect?, grounds?, page?, scale?, pad?, maxSide? })` -> `{ canvas, rect, scale, ms }`: page ground, night blocks, each node's box (background, borders = hairlines), its images (object-fit), its text glyph by glyph at the DOM's own rects in its own font |
| `stage/glass/demos.js` | `body` (over the name), `lens` (over a plate), `beads` (on a rule, follows the box width) |
| `stage/stage.js` | `registerGlass`, `setBackdrop`, `set({ glass, focus })`, the two-pass frame, depth-windowed particle draw, 3 timed passes, `stats().passMs/glassOn/glassTier/focus`, `LOOK.focusPull` |
| `stage/wgsl/draw.wgsl.js` | `zwin` uniform at group 1 binding 1: the particle draw skips z outside [lo, hi) |
| `stage/dev.html` | the glass sections (`#gx`), `?glass=`, `&in=night`, the backdrop call, the `orbit` ink demo, hud with per-pass ms |

## Sources (spec 30 §6)

21st.dev `search` (free, no `get_component`): "Liquid Glass" (manuarora700, paceui) and "Liquid Weather glass" are SVG displacement filters on DOM (refused: a DOM filter cannot bend the stage's ink; the frosted fallback is the milky look we refuse); "Liquid Glass Logo Reveal" (WebGL2, based on zanwei/glass-icon-reveal, MIT) is the one mechanism worth taking: a signed-distance body, normals from its gradient, refraction offset from the normal, three samples for dispersion at the rim. "Fractal Glass" (strip refraction of an image) refused: a costume. Magic UI "lens" is a CSS zoom (refused: no bend, no light). ui-layouts "liquid-glass" = SVG filter cards (refused). OriginKit: nothing. Vengeance UI: glass docks and buttons (CSS blur, refused). Taken: the mechanism only, written from scratch in WGSL, ray-marched in the stage's own camera.

## Decisions

- **Two-pass only when needed.** No glass figure on screen: the old single pass, same pipelines (the draw gets a depth window of (-1e9, 1e9)). With glass: pass A into an ink texture (bodies "under", particles with z < the figures' centre plane), pass B on the canvas (shadow + caustic, ink blit texel for texel, glass, particles in front, bodies "over"). So ink behind a body is bent through it, ink in front is drawn over it, soft by depth of field.
- **The stage's camera, exactly.** The glass ray is the eye of `stageScreen` through the fragment, so the page plane stays registered to the pixel and glass moves with the same parallax as the ink.
- **A drop on the page.** The body rests on the paper (`max(sdf, -z)`): a ray reaching the foot meets the page with no air between (no second bend, no internal reflection): a plano-convex magnifier, which keeps the type under it upright and readable. Only rays leaving through the side walls bend again; trapped ones reflect back through the body to the page.
- **Dome height = magnification.** A tall dome blew letters into dark blobs that read as eyes (v12, m-grid); the cover body is low (sz about 0.6). Keep type readable, bent and enlarged.
- **Studio = white sweep with flags**, not a dark room: a dark room outlined the body in navy (v1-v2). Over white paper highlights cannot show, so the body is drawn by tone: a dark cobalt band inside the rim (a multiply, so bent type stays readable in it), deepest away from the key; a bright line on the key side; the key box is kept 0.72..1.2 off the zenith (at the zenith the flat top mirrored it as a white sheet = milky).
- **Brightness parity:** over blank paper the interior is the paper's tone (`(1 - fr + f0)`); faint cobalt absorption (Beer with `ln(paper/cobalt)`, 5e-5..1e-4 per px): stronger absorption neutralised the warm paper into grey first.
- **Shadow of clear glass:** pale inside, darker at its outer ring, a seam at the foot, a caustic spot + crescent (radius split per channel by 2.2 %, warm tint) at the far side from the key; seen through the body at 12 % (under the body the page is lit by the light it gathers).
- **Night:** room, flags and boxes go dark; the body shows by reflections, the rim and the ink light it bends; shadow fades out (dark on dark), caustic becomes faint cobalt light. Band per fragment for the body, per sample for what it sees.
- **Motion on simulated time** (stops with the stage's rest): per-blob noise, lean (spring k 9/s, damping 0.5, the top leans, the foot stays), ripple per press near the body (8 px, 360 px/s), spin with the scroll offset (0.5 rad per viewport), key damped 0.35 s. Focus: `set({ focus })`, damped by `LOOK.focusPull` on simulated time.
- **Tiers:** A 64 + 28 steps with dispersion, B 44 + 18 and C 30 + 12 without dispersion. Bodies are never dropped by the tier rule.

## Measured (AMD RX 7800 XT, Chrome headless, timestamp queries, median of 30 moving frames, pointer circling the body)

| case | whole stage | sim | ink pass | canvas pass |
|---|---|---|---|---|
| A, 1440x900, no glass (mist + ring) | 0.68 ms | 0.05 | 0 | 0.63 |
| A, 1440x900, cover body + orbit + mist | 0.89 ms | 0.06 | 0.34 | 0.49 |
| A, 1440x900, three figures registered (one on screen) | 0.87 ms | 0.05 | 0.33 | 0.50 |
| B, 1440x900 (80k, backing 1224x765) | 0.44 ms | 0.03 | 0.16 | 0.25 |
| C, 1440x900 (40k, backing 1008x630) | 0.22 ms | 0.02 | 0.05 | 0.15 |
| A, 390x844 DPR 2 (backing 585x1266) | 0.51 ms | 0.05 | 0.24 | 0.22 |

Frozen frames: lens 0.36, beads 0.43, cover by night 1.0 ms. Rest: 7.5 s after the last input `awake false` and submits unchanged 1.5 s later in every case (e.g. 2485 -> 2485). Backdrop raster of the bench cover: 1745x687 in 2.2 ms.

## Captures (`.shots/glass/`, the ones to keep)

- `best-cover-1440.png` the cover: heavy clear body over ALBERTO TUVERI, ERI and O bent through it, ink orbiting behind (bent) and in front (soft), shadow beside. `live-pair.png` (moving / at rest after the window, live).
- `best-cover-night-1440.png` the same body inside the night block: dark glass, white type bent, the ink light through it.
- `best-cover-390.png`, `best-cover-night-390.png` phone (the bench lockup is small on the phone; the host sizes the real one).
- `best-lens-1440.png`, `best-lens-night-1440.png` the lens magnifying the plate.
- `best-beads-1440.png`, `best-beads-night-1440.png`, `best-beads-390.png` beads hanging on the rule, bending the capitals under it.
- `best-motion-trio.png` still / lean under the pointer / ripple after a press.
- `reg-trio.png` regression: one-pass frame, bench body, Obla's body at night, unchanged.
- Look log: `v1`..`v16`, `d*` / `e*` / `x*` debug grids, `h-pair.png` (the lower dome that fixed the "eyes").

## For HOST (the only things to read)

- The API is at the top of `stage/stage.js` ("GLASS", "A GLASS FIGURE"). Start from `stage/glass/demos.js`.
- Register glass figures with `stage.registerGlass(id, def)`; each frame `set({ glass: [{ id, weight, rect }] })` (rect in DOCUMENT px, up to 3).
- Backdrop: `rasteriseBackdrop({ nodes: [lockup, ...[data-refract], ...plates] })` then `stage.setBackdrop(bd.canvas, bd.rect)`; again on resize, `document.fonts` changes, and when the body travels to another region (the travel down the cover to "In this issue" wants a rect covering the hero and the contents, or one raster per region; 4096 px max side by default, the scale drops to fit).
- Glass ignores the particles' keep-outs (it may cross plates). Keep body copy out of a figure's rect yourself.
- The cover body over the real lockup: size the anchor so the dome stays low over the letters (magnification); `orbit` in `dev.html` is a starting point for the ink around it (tilt about 0.8 rad so the front arc is not a smear).
- The bench imports `../water/engine/gpu.js` for its adapter (as before). Spec 30 §1 wants the stage to import nothing from `water/`: when HOST copies `gpu.js` / `tier.js` under `stage/`, point `dev.html` at the copy.

## Open

- Night pages: spec 30 §3 says no glass there this round; the material works by night (captures) if wanted.
- No degrade step at run time beyond the tier rule: the budget halving of the particles also lowers the ink pass; glass steps are fixed per tier.
- `gl=debug:1..6` stays in the shader (one uniform branch, no measurable cost); remove before release if wanted.
- The ink under a body is sampled at its screen position (no parallax for ink far behind the page): invisible at these depths, noted.
- Rest after the press ripple: the ripple ages only on simulated time, so a press near the end of a window freezes mid-wave until the next input (same law as the ink).
