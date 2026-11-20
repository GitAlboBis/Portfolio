# 06 · Liquid effects shortlist: one water language for the rivista page

> Curator pass, 2026-09-18, branch `feat/redesign-2026-09`. Input: 47 candidates from 4 finders (Codrops, UI connectors, award sites, famous libraries). I merged candidates that share a mechanism, which leaves 25 mechanisms (map in Appendix A). I ranked them, kept 7 and rejected the rest.
> Read this with `01-proto-contract.md` (one engine canvas moves preloader → hero → band), `02-water-engine.md` (engine audit; §9.2 decides the letter's representation) and `05-taste-history.md` (Alberto's likes and dislikes, and the canon bans).
> **Evidence status.** I re-checked GitHub stars and licences today with `gh api` for 17 repos (Appendix B); these are marked *(verified)*. Awwwards scores, npm download counts and article dates come from the finders and are marked *(reported)*.
> **Connectors.** The finders used 21st.dev (`search` and `get_inspiration` only; `get_component` was never called), OriginKit `search`, the Magic UI registry, ui-layouts `get_docs` and the shadcn / React Bits registry JSON. Mobbin needs authorisation and was unavailable in this session. The curator made no further connector calls.

---

## 0. Verdict in one screen

| Rank | Slot | Effect | Donor (mechanism) | Proof of fame | GPU budget |
|---|---|---|---|---|---|
| 1 | **hero** | **Caustics traced from the water A onto the paper** | Evan Wallace area-ratio caustics (jeantimex WebGPU port, MIT) | 1,275★ *(verified)*, Chrome Experiments; used on the Gentle Rain SOTD 2024 | 0.2–0.4 ms |
| 2 | **hero** | **The water lenses the printed page (refraction + physical dispersion)** | Maxime Heckel dispersion loop, drei MeshTransmissionMaterial, Splash refraction | drei 9,874★ *(verified)*; MTM is the default water/glass on R3F award sites | ≤ 0.3 ms |
| 3 | **band** | **One drop, one ring: a sheet of water over the closing band, lit by caustics** | Wallace wave integrator + drop pass, verbatim | as #1; homunculus.jp fakes the same look *(reported)* | 0.3–0.5 ms, only while settling |
| 4 | **preloader** | **The A forms from particles and docks without a reboot** | matsuoka-601 MLS-MPM + SSF (WaterBall / Splash, MIT) | Codrops 2025 feature, 556 / 399 / 192★ *(verified)* | ≤ 3 ms during formation |
| 5 | **hover** | **Pointer wake through the work index** | OGL Flowmap (Unlicense) | Lusion v3 SOTD, Animations 10/10 *(reported)*; OGL 4,651★ *(verified)* | ≈ 0.1 ms |
| 6 | **transition** | **Waterline match cut (tile → case study)** | Unseen Studio "dive under the water" pass + Codrops LiquidDistortion peak-at-the-cut timeline | Unseen SOTM Feb 2023, Transitions 9.20 *(reported)* | 0.2–0.3 ms for 1.1 s |
| 7 | **reveal** | **Surfacing: the work image rises out of the water and dries** | Paper Shaders "Water" (Apache-2.0) | 3,458★ *(verified)*; upstream of 21st.dev's shader builder | 0.2–0.3 ms for 0.9 s, 0 at rest |
| — | **cursor** | **Intentionally empty** | — | — | 0 |

**The unifying rule: *one water, one light, one rest* (§C.2).** Every liquid pixel on the page uses the same optics (η 1.333, cobalt only where the water is deep), is lit by the same studio key light, and moves with the same wave kernel. Everything except the hero A returns to a still, printed page.

**Two decisions only Alberto can make (§D):** a G4 one-liner for glyph confinement and particle seeding, and whether a second canvas may run on the engine's own GPUDevice. Entries 5–7 need that second canvas.

---

## 1. How I ranked

**Score = Quality × Fame × Fit.** Each is out of 10, and these are my scores, not the finders'.
- **Quality:** professional finish.
- **Fame:** proven fame or award usage. Stars count, but use on an Awwwards-level site counts more.
- **Fit:** how well it suits a white rivista page whose hero is a super-realistic WebGPU water "A", with rich but clean motion.

**Hard filters.** A candidate that fails any of these is rejected whatever its score.
1. **One heavy renderer, one GPU device.** The WebGPU engine takes over the preloader, hero and band roles of `fx-gl.js` (01 §0). Everything else is DOM, CSS or SVG, or a light pass on the *same* `GPUDevice`. No second WebGL context and no second device.
2. **Canon bans (05 §3).** No glass, gradients, radii, shadows, cards, veils over media, dark sections, curved page transitions or gimmick text effects.
3. **Category rut (PRODUCT.md §7).** No "blob that follows the cursor" and no works grid with hover-reveal.
4. **Alberto's recorded dislikes (05 §1).**
   - 2D lines and flat stand-ins.
   - Procedural fakes («troppo artificiale»).
   - Coloured or iridescent rims.
   - Jelly or balloon water, and dithered or moiré highlights.
   - Per-letter liquid or wobble on type.
   - Full-body foam.
5. **Legibility and accessibility.**
   - No text over water.
   - Reduced motion is the static, legible version of every effect.
   - WCAG 2.2.2: water that keeps moving must settle on its own or offer a pause.
6. **Honest claims.** The page may say "caustics" only if it computes them from the simulated surface and they are verified on screen (05 §4).

**Most award-proven is not always best here.** The most famous water on the web is the Pavel Dobryakov fluid cursor (16,645★). It fails filters 1 and 3 and loses the coherence test (§C), so it is rejected.

---

## 2. Shared kernels: build once, use in several entries

The page's water is one system. Four kernels live in the engine's module set; the shortlist entries only set their parameters.

| Kernel | What it is | Used by |
|---|---|---|
| **K1 · water optics** (`water-optics.wgsl`) | One function family used for every liquid pixel. <br>• **Refraction:** η 1.333; dispersion is optional and never wider than water's real visible-range spread, η 1.331 / 1.333 / 1.337. <br>• **Absorption:** Beer-Lambert `T = exp(−σ·d)`, with `σ = −ln(cobalt_lin) · 0.12 / d_max`, where cobalt `#2340c9` is linear (0.017, 0.051, 0.583). The thickest stem transmits cobalt^0.12, a faint cobalt; thin water stays clear. <br>• **Reflection:** Fresnel F0 0.02 against one neutral paper-studio HDR env (no sunset). <br>• **Tone map:** ACES or AgX. <br>• **Light:** one key light, `L = normalize(−0.35, 0.85, 0.40)` in plate space. | 1, 2, 3, 4, 5, 6, 7 |
| **K2 · wave integrator** | The Wallace heightfield: rgba16float storage, compute passes, fixed 60 Hz step. <br>• Update: `avg = 4-tap·0.25; g += (avg − r)·2.0; g *= damping; r += g`. <br>• Drop: `d = max(0, 1 − |c·0.5+0.5 − uv|/radius); r += (0.5 − cos(dπ)·0.5)·strength`. <br>Constants verified in `_refs/webgpu-water/src/shaders/water/update.frag.wgsl` and `drop.frag.wgsl`. | 3, 6 (and the A's face ripples if 02 §9.2 is adopted) |
| **K3 · caustic projector** | For each grid vertex, refract the key light through the flat normal (`oldPos`) and through the real normal (`newPos`), then project both onto the receiving plane. Intensity is `oldArea/newArea` from `dpdx`/`dpdy`. The G channel carries the occluder's shadow. | 1, 3 |
| **K4 · surface layer** | Textured quads kept in sync with DOM rects: the curtains.js pattern, without the library. <br>• Canvas: one fixed, `pointer-events:none`, `aria-hidden` canvas, configured with the **engine's `GPUDevice`**: `getContext('webgpu').configure({ device: FX.gl.device, format, alphaMode: 'premultiplied' })`. WebGPU allows one device to render to several canvases, so this adds no second context type and no second device. <br>• At rest: `display:none` while nothing is active, so it costs nothing to composite. <br>• Rects: read once per tick, after the Lenis update. <br>• Textures: taken from the decoded `<img>` with `copyExternalImageToTexture`. <br>• Mounts after `FX.ready("intro")` plus idle time. The hero engine sleeps while the index is in view. | 5, 6, 7 |

---

## A) The shortlist (7 effects, one slot each)

### A1 · HERO: caustics traced from the water A onto the paper

**Score 10 × 9 × 10 = 900**

**Why it wins**
- On a white page, this is the strongest single cue that the A is real water. Light focused by the letter lands on the paper as bright moving veins, with a soft shadow that has a bright core. Only a transparent body casts that.
- It is physically derived, which is the only way the caption can honestly print "caustics" (05 §4).
- The technique is the canonical web water. The one recent award site with water caustics on a light page, Gentle Rain (SOTD), shows it reads as premium, not as a demo.

**Donor mechanism to port.** The source is `_refs/webgpu-water/src/shaders/water/caustics.vert.wgsl` + `caustics.frag.wgsl`, already cloned (the jeantimex port of Wallace).
- Vertex: rebuild the normal from the height texture (`ba*0.5`, `y = sqrt(1 − |ba|²)`). Refract the light through the flat normal and through the real normal (IOR 1.0/1.333) and project both onto the floor.
- Fragment: `intensity = (|dpdx(old)|·|dpdy(old)|) / (|dpdx(new)|·|dpdy(new)|) · causticIntensity`. G = the occluder's shadow (a sphere in the demo), plus the rim shadow of the pool walls.
- The demo uses a 1024² caustic render target and a 256² sim.

**Adaptation to paper, cobalt and the water A**
- **Surface:** the A's front-face normals and thickness. They come from the glyph-SDF body with K2 face ripples if 02 §9.2 is adopted, or from the SSF normal and thickness buffers otherwise.
- **Receiving plane:** the plate plane behind and under the letter. **Light:** K1's key light.
- **Shadow:** replace the sphere shadow with the extruded A's occlusion, projected along the refracted light. That gives the letter a soft shadow with a caustic core.
- **Composite onto the plate ground:** `C = ground · (1 + 0.12 · (clamp(I, 0.4, 2.2) − 1))`.
  - Bright veins are capped at `#fffdf8`.
  - Dark lobes lean `mix(#24211e, #2340c9, 0.35)` at 12% or less.
- **Dispersion:** off by default. To try it, use only the physical spread (1.331 / 1.337) and remove it the moment a coloured fringe shows (Alberto rejected coloured rims on 07-01).
- **Wet contact:** 2–3 px of darkening where the A meets the plate baseline. This is the cheap version of Arellano's contact AO, and it gives the letter weight on the page.
- **Claim gate:** the caption may say "caustics traced from the simulated surface" only once they are verified on screen. At that point, tell Alberto the CV clause about "real caustics" is true again (05 §4).

**Perf budget.** About 0.2–0.4 ms on tier A. This is an estimate; measure it with `timestamp-query`.
- Grid: 128² on tier A, 96² on B, 64² on C.
- Target: additive r16float at half the plate's backing size.
- Re-render only while the surface energy is above ε. Gate with IntersectionObserver.

**Reduced motion / no WebGPU.** The caustics are baked into the engine still. Recapture the still after this lands, so "Still frame captured from this engine" stays literally true.

**Source + licence**
- https://github.com/evanw/webgl-water: MIT, stated in the `water.js` header ("Copyright 2011 Evan Wallace, Released under the MIT license"). The repo has no LICENSE file *(verified)*.
- https://github.com/jeantimex/webgpu-water: MIT *(verified)*.
- Keep both notices in the WGSL header.
- Gentle Rain is proprietary; take only the method, from the Codrops case study.

**Evidence**
- evanw/webgl-water: 1,275★ and 268 forks *(verified)*; Chrome Experiments.
- The author co-founded Figma and wrote esbuild. His Medium post "Rendering Realtime Caustics in WebGL" is the standard reference.
- jeantimex: 264★ *(verified)*; Codrops Creative Hub, Jan 2026 *(reported)*.
- three.js ships `webgpu_caustics` *(reported)*.
- Gentle Rain (Zajno): Awwwards SOTD 2024-12-25 and a Codrops case study on 2025-01-16 *(reported)*.

---

### A2 · HERO: the water lenses the printed page (refraction + physical dispersion)

**Score 9 × 9 × 10 = 810**

**Why it wins**
- The engine audit calls this the biggest single "it's water" cue on a white page (02 §9.1 #4).
- It also removes the documented cause of the Golden Hour "jelly": refraction of an infinite cubemap instead of the page behind (02 TL;DR 4).
- A clear body reads as water only when it bends what is behind it. On the rivista, what is behind is paper grain and hairlines, so the letter bends the magazine itself.

**Donor mechanism to port**
- **Maxime Heckel's dispersion loop:** N samples of a background texture at refracted offsets, with IOR slices per channel.
- **drei MeshTransmissionMaterial:** offset scaled by thickness, and roughness mapped to a lower mip for blur.
- **WaterBall / Splash:** background sample offset along `normal·thickness`, plus Beer-Lambert absorption.

**Adaptation**
- **Backdrop texture.** The engine draws the plate's own ground with Canvas 2D into an OffscreenCanvas: paper-deep, paper grain, the plate's hairline frame, and any rule that runs behind the letter. It uploads it with `copyExternalImageToTexture` on mount, resize and variant change. There is no per-frame cost and no DOM readback.
  - No text sits behind the water (05 §4), so no type is lensed.
- **Per fluid pixel:** `off = N.xy · thickness · (1 − 1/η_i) · k`.
  - 6 taps on tier A, 3 on B and C.
  - η_i spans 1.331–1.337 only. The finder's 1.30–1.36 would paint the rainbow rims Alberto rejected.
  - For the "frosted core" of thick stems, pick the mip level from thickness.
- **Colour comes from the material, not the backdrop** (Alberto, 2026-06-24). It is K1's Beer-Lambert toward cobalt plus Fresnel against the paper-studio env. The lensing adds the "it's water" read; it does not add colour.

**Perf budget.** 0.3 ms or less on tier A. Taps run only on fluid pixels (masked by the SDF hit or SSF depth). Tier C uses a single tap.

**Reduced motion / no WebGPU.** The engine still.

**Source + licence**
- https://blog.maximeheckel.com/posts/refraction-dispersion-and-other-shader-light-effects/: the code is inside the article with no licence stated, so take the technique only.
- https://github.com/pmndrs/drei: MIT *(verified)*. three.js: MIT.
- matsuoka-601 repos: MIT *(verified)*.

**Evidence**
- drei: 9,874★ *(verified)* and about 14.8M npm downloads a month *(reported)*. MTM is the default glass/water material on R3F award sites *(reported)*.
- Heckel's article is the most-cited explanation of the technique. Codrops ran a glass-refraction follow-up on 2025-03-13 *(reported)*.
- three.js has a `webgpu_refraction` example *(reported)*.

---

### A3 · BAND: one drop, one ring, a sheet of water over the closing band

**Score 9 × 9 × 9 = 729**

**Why it wins**
- The band is the water's reprise, reduced to a single gesture: the same water, optics and light as the hero.
- The Wallace integrator is the most-proven motion for web water, and it is physically real: rings reflect off the band's frame and die out.
- It settles on its own, so WCAG 2.2.2 is met without a pause toggle. It costs almost nothing.
- It replaces the 2D hairline flow field Alberto rejected with light, not lines.

**Donor mechanism to port (verbatim)**
- `update.frag.wgsl`, `drop.frag.wgsl` and `normal.frag.wgsl`, as K2.
- Demo defaults, verified in `_refs/webgpu-water/src/main.ts`: 256² sim; pointer drop radius 0.03 and strength 0.01; seed drops ±0.01.
- Port the three fragment passes to compute on rgba16float.

**Adaptation**
- **Canvas.** Use the engine canvas already re-parented into `#contact` in dock mode (01 §5). No new canvas.
- **Choreography.**
  - When the band's ScrollTrigger first fires, one drop (strength 0.04, radius 0.035) lands at the band's golden point, in the right third, away from the copy block at the bottom left. That drop is the A's reprise.
  - The rings travel, reflect off the band's hairline frame and damp out.
  - The pointer adds drops only while it moves: radius 0.02, strength 0.006, one every 12 px or more of travel.
  - There is no idle rain and no loop. The sheet is flat again within about 4 s.
- **Look.**
  - K3 caustic light on the band paper, with the same formula as A1.
  - K1 lensing of the band's paper grain and its top hairline: the rule visibly bends as a ring crosses it, which proves this is water over print.
  - No colour is added beyond K1's shadow lobe.
- **Text.** The copy stays DOM, above the sheet.
  - Under the copy's line boxes (the rects `setObstacle` already reads), caustic contrast is capped at ±5% luminance, so ink on paper stays above 12:1.
  - Damping there is raised to 0.985, so the copy area calms first.

**Perf budget.** About 0.3–0.5 ms while active.
- Sim: 256² on tier A, 128² on tier C. Caustic grid: 96².
- Sleep when Σ|g| < ε. Gate with the existing IntersectionObserver (`rootMargin "100% 0px"`).

**Reduced motion.** Plain paper band, the same as today's `?gl=0` path.

**Source + licence.** Same as A1: MIT, keep both notices.

**Evidence**
- Same as A1.
- three.js `webgl_gpgpu_water` and `webgpu_compute_water` *(reported)*.
- homunculus.jp (Awwwards Honorable Mention, *reported*) fakes this ring look with brush sprites. The physical version is strictly better.

---

### A4 · PRELOADER: the A forms from particles and docks without a reboot

**Score 9 × 8 × 10 = 720**

**Why it wins.** It matches four things Alberto asked for (05 §1.2, §5.1):
- «Particles are the truth, shown at the right moments.»
- A preloader that hands an element to the hero (arago, donprod, oddity).
- The A forms from water once per session.
- The same shot on mobile.

MLS-MPM is the only candidate that forms and splashes real water particles in real time on WebGPU. It is already vendored and proven on this machine, and it is the reference WebGPU water on the web.

**Donor mechanism to port**
- matsuoka-601 WaterBall / Splash:
  - Simulation: P2G scatter with fixed-point `atomicAdd` → grid update → G2P (APIC).
  - Rendering: SSF (depth splats, additive thickness, Narrow-Range filter, normals from depth).
  - Splash's single substep.
- 02 §9.2 point 5: the caller can seed particles and run the kernel as a free APIC fluid, **without editing G4 files** (`explode=1`, `explodeOut=0`, `calm=0`).

**Adaptation**
- **Formation.** Seed about 32k particles (spacing 0.66, 02 §6) as a pour from the top of the preloader window into the volume of the Cormorant glyph.
- **Honest count.** The count's "plate" share becomes the settled-particle fraction. This replaces the `warm(90)` proxy (01 §3.2), so the number means something.
- **Dock without a reboot.** At `counterDone` the canvas is never rebuilt.
  - The existing clip tween docks the window into the plate (1.1 s, `expo.inOut`, 01 §3.4) while the last particles settle.
  - The glyph-SDF body (A1/A2 optics) cross-dissolves in by density. The water becomes the letter inside one continuous shot.
- **Afterwards.** The particles stay alive as the hero's splash layer: a poke gives the radial slow-motion splash that recomposes (05 §5.1 #5).
- **Look.** Droplets use K1 (same IOR, same cobalt absorption). Foam appears only on crests (06-24), never on the whole body.
- **G4.** Seeding and free-fluid mode need no solver edit. A glyph-SDF confinement does, which needs a one-line OK from Alberto.

**Perf budget**
- Formation: 3 ms or less on tier A at DPR ≤ 1.5. This is an estimate; the current frame is unmeasured (02 §6), so add `timestamp-query` first.
- Mobile: the same shot at a quarter of the pixels and about a third of the particles (Alberto's "no effect removed" doctrine). Never a 2D stand-in.

**Reduced motion / no WebGPU.** No window. Show the engine still with its printed reason line (01 §6).

**Source + licence.**
- https://github.com/matsuoka-601/WaterBall
- https://github.com/matsuoka-601/Splash
- https://github.com/matsuoka-601/WebGPU-Ocean

All three are MIT *(verified)*.

**Evidence**
- Codrops long-form article by the author, 2025-02-26, plus four Creative Hub features in 2025 *(reported)*.
- Stars: WebGPU-Ocean 556, WaterBall 399, Splash 192 *(verified)*.
- Show HN front page and two 80.lv articles *(reported)*.
- No Awwwards site is known to ship it. Its fame is "the reference WebGPU water", not award use, and the score reflects that.

---

### A5 · HOVER: pointer wake through the work index

**Score 9 × 10 × 8 = 720**

**Why it wins**
- It is the award-proven liquid pointer interaction that stays editorial and never adds colour.
- Lusion, the project's north star, uses the same family as a final displacement pass.
- It follows the pointer's direction, heals in under a second, and is the cheapest liquid interaction available.

**Donor mechanism to port.** OGL `src/extras/Flowmap.js` *(read today)*.
- 128² half-float ping-pong, `falloff 0.3`, `alpha 1`, `dissipation 0.98`.
- Stamp: velocity `·(1, −1)` with strength `1 − (1 − min(1,|v|))³`, weighted by `smoothstep(falloff, 0, |cursor|)`.
- Pointer velocity is lerped at 0.15 while moving and 0.1 while decaying (Codrops 2019 demo).
- The image shader offsets its UVs by the flow.

**Adaptation**
- **One flowmap for the whole index.** The flowmap lives in page space and covers tiles and gutters, not one map per tile. The wake crosses gutters coherently. The stamp is offset by the Lenis scroll delta, so the wake stays glued to the page. K4 draws it only inside tile rects.
- **Read as a thin water film:** `uv += flow.rg · flow.b · 0.025` (the demo uses 0.105).
  - K1 adds a glint where |∇flow| peaks: paper-white, 8% or less.
  - The B channel may shift up to 1 px toward cobalt.
  - No RGB split, no second image, no zoom, no tint.
- **Timing.** Dissipation is 0.96, so the wake heals in about 0.6 s, matching the settle time of A6 and A7.
- **Rut guard (PRODUCT §7).** Nothing is revealed on hover and nothing swaps. The water only answers motion.
- **Coarse pointers:** off.

**Perf budget.** About 0.1 ms: one 128² pass plus one extra texture fetch per tile pixel. The pass sleeps once max|flow| < 1e-3, about 3 s after the pointer stops.

**Reduced motion.** Off; tiles are static.

**Source + licence**
- https://github.com/oframe/ogl: Unlicense, per `package.json` *(verified)*. Port `Flowmap.js`, not the robin-dela demo repo, which has no licence file *(reported)*.
- Lusion is proprietary. The mechanism is inferred from a three.js forum thread that reverse-engineers it, discourse.threejs.org/t/57385 *(reported)*.

**Evidence**
- OGL: 4,651★ *(verified)*. Its author, Nathan Gordon, is at Active Theory.
- Codrops "Mouse Flowmap Deformation with OGL", 2019-09-25.
- Lusion v3: Awwwards SOTD, Oct 2023, with Animations/Transitions 10/10 *(reported)*.
- Codrops, May 2026: Thibault Guignand's portfolio uses the OGL Flowmap *(reported)*.
- Awwwards inspiration "404 Page with WebGL Mouse Flow" *(reported)*.

---

### A6 · TRANSITION: waterline match cut (tile → case study)

**Score 9 × 9 × 8 = 648**

**Why it wins**
- It translates an award-proven "dive into the next page" (Unseen: SOTM, Animations/Transitions 9.20) into the rivista grammar.
- The edge is a straight hairline, which the canon allows; curved page transitions are banned.
- The liquid lives inside the travelling image, so S4's rule "one image makes one move" stays intact.

**Donor mechanism to port**
- **Unseen Studio's transition pass:** both scenes are rendered into render targets and blended in one fragment pass by a mask. The move to Projects is a camera dive under the water. Take the mechanism only.
- **Codrops LiquidDistortion timeline:** displacement ramps to a peak exactly at the cut, then settles.
- **robin-dela hover-effect** (MIT): its opposed-direction displacement mix, only if the case hero ever differs from the tile still.

**Adaptation to S4 "Stacco"** (`fx-nav.js`, `go` timeline)
- **Drawing.** K4 draws the travelling image at the rect the GSAP tween already writes (the `cur` insets and the `imgTag` transform). The DOM image is hidden for 1.1 s at most.
- **The waterline.** It is the top edge of the paper sheet that already rises under the image (`sheetEl` clip-path inset, from 0.12 s to 0.72 s, `domus.inOut`).
  - Image pixels below the line are refracted by a 128² K2 field.
  - The field is seeded with a row of drops along the line, plus one drop at the click point.
  - A 1 px cobalt meniscus hairline rides the line. It is the only colour.
- **Envelope.** Amplitude `A(t) = A₀ · sin²(πt / 0.8)`, with A₀ ≈ 10 px at 1440.
  - Damping rises from 0.995 to 0.95 after 0.8 s, leaving less than 0.5 px of displacement at arrival.
  - The contract's "arrival settles under 2 px" handoff to the case page (painted from CSS variables) is therefore invisible.
  - Going back mirrors it.
- **S5 "Tendina".** The columns stay straight and untouched.

**Perf budget.** About 0.2–0.3 ms during 1.1 s: one quad over the image rect plus a 128² sim. The layer is hidden afterwards. The case page needs no GPU on arrival; the site is multi-page, so navigation is a real page load.

**Reduced motion.** The current reduced path, which is instant or an opacity change.

**Source + licence**
- Unseen (https://unseen.co/) is proprietary; take the mechanism from its Awwwards case study.
- https://github.com/codrops/LiquidDistortion has no licence file *(verified)*: re-implement it.
- https://github.com/robin-dela/hover-effect: MIT *(verified)*.

**Evidence**
- unseen.co: SOTD 2023-02-06 (7.99) and Site of the Month Feb 2023, with an official Awwwards case study. The same studio's BlueYard, The Sea We Breathe and OceanX 2025 were all SOTD *(reported)*.
- LiquidDistortion: 473★ *(verified)*, the canonical Codrops liquid transition.
- hover-effect: 1,883★ *(verified)*.

---

### A7 · REVEAL: surfacing, the work image rises out of the water and dries

**Score 8 × 8 × 8 = 512**

**Why it wins**
- Every work image arrives "out of the water": it surfaces while the existing line-mask reveal plays, then the water drains.
- At rest the tile is a plain, sharp photograph, with no veil (canon).
- Paper Shaders is today's most-adopted open water image filter. It is Apache-2.0 and stateless (no simulation per tile).

**Donor mechanism to port.** `paper-design/shaders` `packages/shaders/src/shaders/water.ts` *(read today)*:
- Caustic noise: six iterations of a sin/cos accumulation rotated 0.5 rad each step, then squared. There is an optional second layer (`layering`) and a simplex "waves" warp.
- Distortion: `uv += caustic · 0.02 · causticNoise · edgeMask` and `waves · 0.1 · simplex`.
- Highlights: `0.025 · highlights · causticNoise` in a highlight colour.

**Adaptation**
- **Port to WGSL on K4.** Never use Paper's `ShaderMount`: each mount opens its own WebGL2 context, which breaks the one-device rule.
- **Drive.**
  - When the tile reveals (ScrollTrigger `once`, 0.9 s `--ease-out`, in step with the current clip mask), scrub `caustic` 0.4→0, `waves` 0.3→0 and `highlights` 0.10→0.
  - When all three reach 0, the layer stops drawing the tile and the DOM image shows. The two are pixel-identical.
- **Correct refraction.** Offset along the finite-difference gradient of the caustic noise, instead of Paper's scalar push along one diagonal.
- **Colour.** Highlights are paper-white only; no cobalt over photographs.
- **Match A1.** Use the same caustic cell size on screen, the same contrast and the same time scale as the hero caustics (§C.1).

**Perf budget.** About 0.2–0.3 ms, and 0 at rest. Roughly 12 trig iterations per tile pixel for 0.9 s. Stagger reveals so no more than 2 tiles run at once.

**Reduced motion.** The current reduced path: the image is present and there is no reveal.

**Source + licence.** https://github.com/paper-design/shaders, Apache-2.0 *(verified)*. Keep the licence and NOTICE header in the ported file, and state the modifications.

**Evidence**
- 3,458★, last pushed 2026-09-17 *(verified)*.
- npm: about 2.85M downloads a month *(reported)*.
- It is the upstream of 21st.dev's shader builder, whose items read "Adapted from Paper Shaders under Apache-2.0" (seen through the 21st MCP by the connectors finder).
- No Awwwards site is cited. Its fame comes from adoption, not awards.

---

### CURSOR: intentionally empty

No standalone cursor or pointer-trail effect, for three reasons:
1. **Category rut.** PRODUCT.md §7 names "a blob that follows the cursor" as the look this category always ships.
2. **A second fluid.** Every cursor-fluid candidate (stable fluids, SplashCursor, BlueYard, Slosh, gooey, liquid mask) would be another fluid, with its own look, next to the particle A. It fails the one-water rule (§C).
3. **Alberto's direction.** He asked for motion driven by scroll, not by the cursor (2026-08-21), and the custom cursor has already been removed.

The pointer still matters. It pokes the A (A4 splash plus K2 face drops), stirs the index (A5) and drops into the band (A3). The rivista label cursor in `fx-nav.js` stays as it is.

---

## B) Considered and rejected

| Mechanism (merged candidates) | Strongest evidence | Why not |
|---|---|---|
| **Stable-fluids cursor / fields.** Pavel Dobryakov WebGL-Fluid-Simulation; React Bits SplashCursor and LiquidEther; OriginKit Fluid Trail and Liquid Distortion; BlueYard; Slosh Seltzer; ASTRODITHER | 16,645★ MIT *(verified)*; BlueYard SOTD 2025; Slosh SOTM Jun 2024 *(reported)* | • It is the "blob on the cursor" rut. <br>• Dye is ink, not water: a second fluid next to the particle A. <br>• Gentle Rain's team dropped it as the look "already used on many websites". <br>• LiquidEther is MIT + Commons Clause and paints a colour wash over paper (a gradient). <br>**Kept:** BlueYard's single ink on cream, as our one-cobalt rule; ASTRODITHER's compute fluid on the same device, as the K-rule. |
| **Brush-sprite ripple** (homunculus.jp, akella, ui-layouts Img Ripple) | homunculus Honorable Mention *(reported)* | A sprite fake of what K2 does physically; redundant with A3 and A5. Evidence merged into A3. |
| **Displacement-map hover swap** (hover-effect, gl-transitions, OriginKit Liquid Hover), used *as a hover* | 1,883★ MIT *(verified)* | A two-image hover swap is the hover-reveal rut, and the static stock-map look dates from 2018. Its formula survives inside A6. |
| **Liquid Distortion as a looping slideshow filter** (Codrops 2017) | 473★ *(verified)* | A scrolling cloud map is procedural and never rests. Its peak-at-the-cut timeline survives inside A6. |
| **Dynamic Shape Overlays**, melting SVG curtain (ykob) | 422★, no licence *(verified)* | Curved page transitions are banned in the canon (domus rule), and the melting edge reads as paint, not water. Hold it only if Alberto lifts the rule for S5. |
| **Rain and drops on glass** (Bebber RainEffect) | 1,777★, no licence *(verified)* | "Rain on a window" is a weather mood. The drops are glass lenses (glass is banned), the sim runs on the CPU, and it adds a third water behaviour to the page. |
| **Gooey threshold** (Bebber SVG goo, Gooey Cursor, Magic UI Morphing Text, Aceternity Gooey Input) | canonical 2015 technique; CreativeGooeyEffects 328★ *(verified)* | A gimmick text effect. Alberto hated per-letter liquid (2026-06-27). The preloader counter rolls; it never melts. Thin Cormorant serifs break under the threshold. |
| **Liquid glass** (liquid-glass-react, shuding/liquid-glass, kube.io, React Bits GlassSurface) | 6,171★ MIT *(verified)*; HN front page | Glass is banned in the canon. It is a 2025 Apple trend that will date fast, true refraction works only in Chromium, and a lens over serif titles is a text gimmick. |
| **Shader noise reveal** (Colin Demouge) | 53★ MIT *(reported)* | Leaves a churning noise vignette on the image at rest, which is a veil over media (banned). Fame is modest. |
| **Fluid X-ray erosion reveal** (Cullen Webber) | 44★ MIT *(reported)* | A cursor-revealed second layer is the hover-reveal rut, and we have no second scene worth revealing. |
| **OriginKit Fluid Image Reveal** (metaball mask) | 3,689 uses on a Framer marketplace *(reported)* | Blob edges (curves), marketplace fame rather than award fame, and commercial terms. |
| **OriginKit Liquid Mask Cursor** | "used by 5" *(reported)* | Fine craft but no fame, and it is a cursor blob. |
| **Igloo Inc frost-dissolve** | SOTY 2024 *(reported)* | Ice, not water: frost, chromatic aberration and glitch are the wrong material and tone. Its SDF glyph scramble is a text gimmick. |
| **Bruno Simon folio water** (TSL surface, Voronoi rain rings) | SOTM Jan 2026 *(reported)*; 1,859★ MIT *(verified)* | Procedural rings in a game world (Alberto rejects procedural fakes), written in TSL/three rather than raw WGSL. Its "waterline stripe" survives as A6's meniscus and A1's wet contact. |
| **Unseen fluid-bent mirror pool under the A** | unseen.co SOTM *(reported)* | A reflective pool under the letter restages the rejected Golden Hour "A sinking into the sea". The pointer wake is already covered by A2 plus K2 drops. Only Unseen's transition is used (A6). |
| **PBF + marching cubes + SSS** (Hector Arellano, Codrops 2025) | ex-Active Theory; 60★ *(reported)* | The author says it is not production-ready on ordinary laptops or mobile, and the letter's representation is already decided in 02 §9.2. Its contact-AO idea survives in A1. |
| **Gentle Rain dithered finish** | SOTD 2024 *(reported)* | The physics is merged into A1. The dither is rejected: dithered highlights are the trap of the rejected "job order" still (05 §5.2 #2). |
| **The Sea We Breathe breathing intro** | SOTD 2021; Webby *(reported)* | Pacing, not an effect, set in a dark underwater world. Alberto wants no dead time between moves. |
| **Blob Mixer** (noise-displaced blob) | SOTD 2021 *(reported)* | The jelly/balloon trap (05 §5.2 #2). |
| **Paper Liquid Metal as a no-WebGPU poster** | 3,458★ *(verified)* | Chrome, not water. The fallback must be a still captured from this engine (05 §4). |
| **GSAP ripple + noisy circle reveal** (Andrea Biason, Codrops 2025) | 18★ *(reported)* | The circle is a curve and the vertex ripple reads as a toy. Its pattern, GSAP tweening shader uniforms, is how every shortlist entry is driven. |
| **curtains.js / gpu-curtains** | 1,826★ MIT *(verified)* | Not an effect. Its DOM-sync pattern becomes K4, but the library would add a second engine or device. Consider gpu-curtains only if it can run on an external `GPUDevice`; verify that first. |
| **Unicorn Studio** | 2 SOTDs in 2026 *(reported)* | A closed runtime with its own canvas per scene: it breaks the one-device rule and cannot be tiered or ported. Useful only as a sketchpad to agree a look. |

---

## C) Coherence check: does it read as ONE water?

### C.1 Audit

| Effect | Optics | Motion source | Light | Colour | Rest state |
|---|---|---|---|---|---|
| A1 hero caustics | K1 | K2 on the A's face, plus particle splash | key L | cobalt only in the shadow lobe | alive but calm (pause in caption) |
| A2 hero lensing | K1 | same | key L (env) | cobalt only with depth | same |
| A3 band sheet | K1 | K2 | key L | shadow lobe | flat in ≤ 4 s |
| A4 preloader | K1 | MLS-MPM | key L (env) | cobalt only with depth | docks into A1/A2 |
| A5 index wake | K1 glint + slope | **flowmap** (a smear, not a wave) | key L | ≤ 1 px B shift | 0 after ~0.6 s |
| A6 waterline cut | K1 | K2 | — | 1 px cobalt meniscus | 0 at arrival |
| A7 surfacing | K1 slope | **procedural caustic** (not K2) | key L (highlights) | none | 0 after 0.9 s |

**Verdict: one language, with two risk points and one deliberate hierarchy.**
- **Risk 1: A7 against A1.** A procedural caustic next to a traced one will read as two different waters if their cell size, contrast or speed differ.
  - Fix: calibrate A7 against a capture of A1. Use the same on-screen cell size (target 40–70 px at 1440), the same peak contrast (about ±10%) and the same drift speed. A7 only ever fades out, so it never sits side by side with a live A1 for long.
- **Risk 2: A5's flowmap.** It is a viscous smear, not a springy wave.
  - Fix: render it only as slope (refraction plus glint), never as colour or blur, with dissipation 0.96 so it heals on the water's timescale. Alternatively, drive A5 with a K2 field (pointer drops into a 256² index-wide sheet, damping 0.97). That is more coherent but rings more; test both, and default to the flowmap for calm.
- **Hierarchy (intended).** Only the hero A is alive at rest. Every other liquid is transient and returns the page to print. That keeps "rich but clean": one living object and a page that answers it.

### C.2 The unifying rule: *one water, one light, one rest*

1. **One water.**
   - Every liquid pixel goes through K1: η 1.333, dispersion only within water's real 1.331–1.337 spread, Fresnel F0 0.02 against the same paper-studio env, and Beer-Lambert toward cobalt `#2340c9` only with depth.
   - Cobalt appears in exactly three places: (a) inside thick water, (b) as the 1 px meniscus at a waterline, (c) in the shadow lobe of caustics.
   - Never as dye, tint, glow or a rim.
2. **One light.** One key light direction (`L = normalize(−0.35, 0.85, 0.40)` in plate space) sets the caustics, glints and highlights across the whole page. Caustic cells are 40–70 px on screen at 1440 everywhere.
3. **One motion.**
   - Waves come from K2, or match its spectrum. Physics steps at a fixed 60 Hz.
   - The pointer never paints. It only disturbs water that already exists (A, band sheet, index film).
   - The GSAP layer uses only the rivista eases: `--ease-out`, `domus.inOut`, `expo.inOut`.
4. **One rest.**
   - Everything except the hero A returns to exactly zero displacement and hands back to the DOM, so the page reads as print at rest.
   - UI water settles in 0.6–1.1 s, the band within 4 s, and the hero stays alive but calm, with a pause control in the caption (WCAG 2.2.2).
5. **One device.**
   - Everything runs on the engine's `GPUDevice`.
   - At most one of these is active in any frame: hero, band, K4 surface layer, transition. Each lives in a different scroll region or moment, so the page never pays for two heavy passes.

### C.3 Timing family (all numbers from 01 §7 tokens)

| Moment | Trigger | Ease / duration | Water settle |
|---|---|---|---|
| Preloader formation → dock | real progress, 1–2.6 s → `counterDone` | clip dock 1.1 s `expo.inOut` | particles settle into the body during the dock |
| Hero poke | pointer | physics only | splash recomposes in about 1.5–2 s |
| Reveal (surfacing) | ScrollTrigger once | 0.9 s `--ease-out` (`--d-reveal`) | params reach 0 at 0.9 s |
| Index wake | pointer motion | physics only | heals in about 0.6 s |
| Waterline cut | tile click | image 1.1 s `domus.inOut` (`--d-travel`), sheet 0.6 s at +0.12 s | < 0.5 px at 1.1 s |
| Band reprise | ScrollTrigger once | physics only | flat within about 4 s |

---

## D) Open questions for Alberto (short, answer before building)

1. **G4 one-liner.** May the formation seed particles into the Cormorant glyph volume through free-fluid mode (no solver edit)? And may a glyph-SDF confinement replace the three capsules (this edits `g2p.wgsl.ts`)?
2. **Second canvas on the same GPUDevice (K4).** This changes the "one canvas" contract in 01 §0. If the answer is no, then:
   - A5 and A7 drop out.
   - A6 falls back to a DOM-only waterline: the cobalt hairline rides the rising sheet, with no refraction.
3. **Band.** Keep the caustic sheet (A3: light, cheap, settles)? Or reprise the A itself with particles, which is heavier and needs a re-warm on every entry (01 §5)?
4. **Meniscus colour in A6.** Cobalt (the page's one accent) or ink?

---

## Appendix A · Deduplication map (47 candidates → 25 mechanisms)

| Mechanism | Candidates merged | Outcome |
|---|---|---|
| Wallace heightfield + caustics | Codrops "WebGL Water / jeantimex", connectors "Caustic Pool / Water Caustic", famous-libs "Heightfield water", award "Gentle Rain" | split: K3 → **A1**, K2 → **A3** |
| MLS-MPM + SSF | Codrops "WebGPU Fluid Simulations", famous-libs "MLS-MPM WaterBall / Splash" | **A4** |
| Refraction + dispersion | famous-libs "Heckel / MTM" | **A2** |
| Flowmap / pointer displacement | Codrops "Mouse Flowmap", famous-libs "OGL Flowmap", award "Lusion v3" | **A5** |
| Transition pass + displacement at the cut | award "Unseen", Codrops "Liquid Distortion", Codrops "hover-effect", connectors "Displacement-map transition / OriginKit Liquid Hover", famous-libs "hover-effect + gl-transitions" | **A6** (as a hover: rejected) |
| Paper Shaders Water | connectors "Paper Water", famous-libs "Paper Water + Liquid Metal" | **A7** (Liquid Metal rejected) |
| Stable fluids | Codrops "Pavel", connectors "Stable-fluids (SplashCursor, OriginKit)", connectors "React Bits LiquidEther", famous-libs "Pavel", award "BlueYard", award "Slosh", award "ASTRODITHER" | rejected |
| Brush-sprite ripple | Codrops "Ripple on a texture", connectors "Img Ripple (ui-layouts)", famous-libs "homunculus ripple" | rejected (evidence → A3) |
| SVG shape overlays | Codrops "Dynamic Shape Overlays", famous-libs "Liquid-edged SVG overlays" | rejected (hold) |
| Rain on glass | Codrops "RainEffect", famous-libs "RainEffect" | rejected |
| Gooey threshold | Codrops "Creative Gooey + Gooey Cursor", connectors "Magic UI Morphing Text / Aceternity Gooey Input" | rejected |
| Liquid glass | connectors "Liquid Glass SVG", famous-libs "liquid-glass-react / shuding / kube.io" | rejected |
| Single entries | Demouge reveal · Webber X-ray · OriginKit Fluid Image Reveal · OriginKit Liquid Mask Cursor · Igloo · Bruno Simon · The Sea We Breathe · Blob Mixer · Arellano PBF · Biason GSAP · curtains.js / gpu-curtains · Unicorn Studio | rejected (curtains pattern kept as K4; Biason pattern kept as the driver idiom) |

## Appendix B · Verified today (`gh api repos/…`, 2026-09-18)

| Repo | Stars | Forks | Licence (as GitHub detects it) | Note |
|---|---|---|---|---|
| evanw/webgl-water | 1,275 | 268 | none detected | MIT stated in the `water.js` header |
| jeantimex/webgpu-water | 264 | 19 | MIT | cloned in `_refs/webgpu-water` |
| matsuoka-601/WebGPU-Ocean | 556 | — | MIT | |
| matsuoka-601/WaterBall | 399 | 56 | MIT | vendored in `src/webgl/waterball` |
| matsuoka-601/Splash | 192 | 19 | MIT | |
| oframe/ogl | 4,651 | 236 | none detected | `package.json`: Unlicense |
| paper-design/shaders | 3,458 | 152 | Apache-2.0 | pushed 2026-09-17 |
| PavelDoGreat/WebGL-Fluid-Simulation | 16,645 | 1,910 | MIT | rejected |
| pmndrs/drei | 9,874 | 839 | MIT | |
| robin-dela/hover-effect | 1,883 | 309 | MIT | |
| codrops/RainEffect | 1,777 | 299 | none | rejected |
| codrops/LiquidDistortion | 473 | 100 | none | re-implement only |
| brunosimon/folio-2025 | 1,859 | 324 | MIT | rejected |
| martinlaxenaire/curtainsjs | 1,826 | 115 | MIT | pattern only |
| rdev/liquid-glass-react | 6,171 | — | MIT | rejected |
| ykob/shape-overlays | 422 | — | none | rejected |
| codrops/CreativeGooeyEffects | 328 | — | — | rejected |

Also read from source today:
- `_refs/webgpu-water/src/shaders/water/{update,drop,caustics.vert,caustics.frag}.wgsl` and `src/main.ts`: the 256² sim, drop 0.03 / 0.01, caustic RT 1024².
- OGL `src/extras/Flowmap.js`: size 128, falloff 0.3, alpha 1, dissipation 0.98.
- Paper `packages/shaders/src/shaders/water.ts`: the 6-iteration caustic noise; distortion 0.02 · caustic; highlights 0.025.
