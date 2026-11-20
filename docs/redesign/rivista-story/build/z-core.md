# z-core — lane CORE (spec 50 §5): plates of glass, the camera, dawn rectangles, the bench

- **State (run 1, done):** plates, camera, dawn and bench built and looked at; tsc --checkJs clean (stage.js, plates/*.js, glass/backdrop.js); gates green; server 5202 stopped.
- **Next (other lanes):** HOST drives `stage.set({ slabs, camera, dawn })` and `stage.slabTexture()`; the API is the header of `stage/stage.js` (nothing else to read).
- **Run and look:** `python scripts/serve-static.py 5202 public`, then `http://127.0.0.1:5202/proto/rivista/stage/dev.html?view=cover` (live), `&t=2500` frozen, `&hud=0`; views `cover | gallery | stack | dawn | plain`; see the comment at the top of dev.html for every parameter.

## Files

| file | what |
|---|---|
| `stage/plates/plates.wgsl.js` | the plate material: ray against an oriented box (slab test), coverage from the box's distance field at the slab planes, rounded arris (bevel) normals, Fresnel reflection of the studio, refraction in and out per channel (tier A), one total internal reflection, exit loss, plates seen through plates, page + swarm behind, image at mid-thickness, frosted etch, Beer tint, the second (inner) reflection, edge light from the swarm, defocus |
| `stage/plates/plates.js` | `createPlates()` (owned by stage.js): image array (one layer per texture, mips, LRU over 16), backdrop with mips, ink texture, packing (world → view through the camera, yaw/pitch/roll axes, projected screen rect, far-to-near order), the studio's swing with the pointer, `PLATE_LOOK`, `PLATE_TIER` |
| `stage/plates/mips.js` | mip chain of an rgba8unorm texture, layer by layer |
| `stage/stage.js` | header API rewritten (plates, camera, dawn); `slabTexture`, `set({ slabs, camera, dawn })`, damped camera, two-pass frame with plates; `registerGlass` removed |
| `stage/wgsl/frame.wgsl.js` | `stageView` (camera), `stageScreenV`, `stageScreen = stageScreenV(stageView)`, `stageDawnAt`, `stageNight` from the dawn rects; FRAME grows to 45 vec4 (`dawn`, `camX..camZ`, `camP`); `band` is now (dawn count, night alpha) |
| `stage/wgsl/draw.wgsl.js` | the points in view space: depth window, DOF and cull on view z; night alpha from `band.y` |
| `stage/glass/backdrop.js` | kept (fx-stage imports it there); grounds default now `[data-night], [data-dawn]`, fallback ground `#0c0e14` |
| `stage/dev.html` | the bench, rewritten in the new world (Sofia Sans from Google Fonts, night tokens of spec 50 §2) |
| deleted | `stage/glass/glass.js`, `glass.wgsl.js`, `demos.js` (the ellipsoid bodies, their shadow, caustic, ripple) |

## The contract as built (spec 50 §5, pinned names kept; added fields marked +)

- `stage.slabTexture(id, source)` → Promise. Image, bitmap, canvas, OffscreenCanvas. Stretched into one layer of a 2d-array (1024 / 768 / 512 px by tier) with its mips; the aspect is kept and the shader fits it back (cover for `tex`, contain for `etch`). Etch reads ALPHA.
- `slabs: [{ id, cx, cy, cz, yaw, pitch, roll, w, h, t, tex, alpha, glow, sharp, +etch, +inset, +bevel, +ior, +dispersion, +tint }]`, ≤ 12. cx, cy = viewport px of the centre as it would sit at cz = 0 (document = scroll + c); yaw brings the right edge toward the reader, pitch the top edge, roll is clockwise.
- `camera: { yaw, pitch, dolly, +cx, +cy, +cz, +follow, +snap }`. Pivot default = viewport centre on the page plane. yaw > 0 swings the camera right; pitch > 0 raises it. Damped 0.55 s on simulated time (stops with the rest); the pointer adds `follow` rad (default 0.035; pass 0 for figures registered to DOM rows). First set snaps.
- `dawn: [{ x0, y0, x1, y1 }]`, ≤ 2, viewport px. [] = all night. A rect over the whole viewport = Contact. Legacy `night: {top,bottom} | null` still read when `dawn` is absent (old meaning: outside the band is dawn).
- tokens: `paper` = `--dawn`, `accent` = `--cobalt`, `night` = `--night`, `nightAccent` = `--accent`.
- `stats()` adds `platesOn, plates, plateTier, camera, dawn`; `stage.plates` = last frame's plates `[{ id, z, quad }]`; `stage.plateLook({...})` live (keys `"name.i"` set one array entry).

## Decisions

- **Analytic, not marched.** Slab test against the box; no SDF marching. Antialiasing: the ray against the box inflated by one pixel, coverage from the box's distance field sampled at the 9 slab planes the ray crosses (its closest approach). Works face-on and at three quarters.
- **The studio by azimuth / elevation**, not by `r.xy / r.z`: a plate turned 25° right of centre reflects rays near 65° azimuth, which a front plane never reaches (v1: no reflection at all). Key: a narrow tall soft box at az 1.1 (half 0.02 rad); fill: narrow at az −0.38; overhead: a long thin strip on the ceiling plane (x, z per unit height) for plates seen from above and every top arris; a dim sweep for faint body; a fixed rim behind. Narrow boxes are the point: a flat face spans only ~0.15 rad, so a wide box floods it into a grey card (v4, v6-stack refused).
- **Lights only in reflection.** Rays that leave the glass going back see the page and the swarm, never the lights (v8: the rim seen straight through put a grey veil on every face-on plate).
- **Exit arris softer (0.45 rad) than the entry (0.785):** fewer pixels flip between refraction and total reflection along the far edges, which drew dashed lines.
- **Swarm split at the frontmost plate's centre (view z).** Points behind go to the ink texture and are bent; points in front draw over. With plates at many depths, points between a far and a near plate are bent by the far one too (accepted).
- **The camera is in `stageScreen`**, so every existing body (night figures) and the hand's hit test inherit it; zero = identity, every figure draws as before.
- **Plates read the page plane in VIEW space**: the DOM type does not move with the camera, so the backdrop stays registered to the screen whatever the camera does.
- Sources (connector search): 21st.dev "Prism Hero" (bevelui) renders the headline to a canvas texture that the glass bends, which is the mechanism we already had (backdrop.js). Taken as confirmation of the mechanism only; "Liquid Glass" (SVG displacement) and "Fractal Glass" (strip refraction) refused as the old liquid look and a costume.

## Measured (AMD RX 7800 XT, Chrome headless, timestamp queries, median of 30 moving frames, pointer circling)

| case | whole stage | sim | ink pass | canvas pass |
|---|---|---|---|---|
| A, 1440x900, cover (1 plate + threads + dust) | 0.37 ms | 0.05 | 0.22 | 0.08 |
| A, 1440x900, gallery (5 plates, 3 on screen, captures) | 0.34 ms | 0.05 | 0.13 | 0.16 |
| A, 1440x900, stack (8 plates overlapping, seen through each other) | 1.21 ms | 0.05 | 0.68 | 0.48 |
| B, 1440x900, cover (80k, backing 1224x765, no split) | 0.16 ms | 0.03 | 0.12 | 0.04 |
| C, 1440x900, stack (40k, backing 1008x630, no through / inner / glow) | 0.19 ms | 0.02 | 0.13 | 0.06 |
| A, 390x844 DPR 2, cover (backing 585x1266) | 0.79 ms | 0.06 | 0.68 | 0.06 |

The whole stage stays under 1.3 ms at 1440x900 on tier A (budget 3 ms). The ink pass dominates when the swarm is blurred far behind; the plates cost 0.07–0.48 ms.

## Captures (`.shots/core/`, the ones to keep)

- `best-cover-1440.png`: the cover frame. ALBERTO TUVERI across the measure, the plate turned 25° over ERI with a soft-box band on its face, the V doubled with a spectral fringe at the arris, the threads bent through it. `best-cover-1440-zc.png` is the same plate at DPR 2, cropped.
- `best-cover-390.png`: the phone (name on two lines, plate over TUVERI's last letters).
- `v9-bev-pair.png`: the band at rest (left) and swung off by the pointer, with the plate turned by it (right).
- `best-gallery-1440.png` (captures inside the glass, the near plate sharp, neighbours soft and dim), `best-gallery-etch-1440.png` (a clear plate with SUPPLY CHAIN etched and frosted), `best-gallery-390.png`.
- `best-stack-1440.png`, `best-stack-390.png`: eight thin layers from three quarters, one lifted, the overhead strip as a band across them.
- `best-dawn-1440.png`, `best-dawn-390.png`: the straight edge, light on night, cobalt ink at dawn. `dawnall-1440.png`: the whole viewport dawn.
- `tierC-cover-1440.png`: the cheap path.
- Look log: `v1` (no reflection: lights in the wrong space), `v2` (band floods the face), `v3` (outline only: needs body), `v4`–`v5` (band + sweep), `v6`/`v7` stack (overhead box too wide = grey cards), `v8-rim-pair` (broad rim = milky, refused), `dbg-*` (the veil hunt).

## For HOST and the scenes

- Read only the header of `stage/stage.js`.
- Plates need a backdrop to bend type: `rasteriseBackdrop({ nodes: [...document.querySelectorAll("[data-refract]")] })` then `stage.setBackdrop(bd.canvas, bd.rect)`; again on resize and font load. Outside the backdrop a plate sees the ground.
- Keep body copy out of a plate's screen rect (`stage.plates[i].quad`): a plate draws opaque over the DOM and shows only what the backdrop holds.
- The swarm a plate bends is read from one plane behind it (`PLATE_LOOK.inkZ` = −320 view z, or 120 behind the frontmost plate); put the formations that should be bent behind the plates (z < the plate's cz).
- A dawn rect only changes how the points are drawn; the DOM paints the dawn ground itself.
- Focus: `set({ focus })` is the swarm's sharp depth; a plate's own focus is its `sharp`.

## Open

- The thin layers of the stack (t = 9) show dotted far edges at 1x (aliasing of a 3 px side face); a scene can use t ≥ 14 or the bench's bevel 2.5. Not fixed.
- The night figures in `stage/night/` were not re-checked against the camera (identity at zero; HOST owns them).
- The bench's swarm (threads, dust) is a stand-in; the scenes write the real formations.
- The phone gallery arc of the bench is too wide (a bench composition; WORK owns the real one).
