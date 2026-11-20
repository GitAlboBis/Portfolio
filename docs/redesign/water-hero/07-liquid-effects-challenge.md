# 07 · Liquid effects challenge: a skeptic's pass on the 06 shortlist

> Skeptic pass, 2026-09-18, branch `feat/redesign-2026-09`. I was read-only on the project and wrote only this file. The input is `06-liquid-effects-shortlist.md`, checked against `01-proto-contract.md`, `02-water-engine.md` and `05-taste-history.md`.
> **Checked today:**
> - `gh api` on 7 repos, plus 3 full licence texts.
> - 4 three.js example files, read from source.
> - 7 web pages, via WebFetch and WebSearch.
> - One free connector sweep: 21st.dev `search`, ui-layouts `search_components` and Magic UI `searchRegistryItems`. I made no `get_component` calls and no OriginKit calls. Mobbin needs authorisation and was unavailable.
>
> **Labels.** *(verified)* means I confirmed it today. *(06, unverified)* means I took 06's word for it.

---

## 0. Verdict in one screen

| Pick | Effect | Verdict | Reason in one line | Change or replacement |
|---|---|---|---|---|
| A1 | Hero caustics | **KEEP, with fixes** | The strongest "real water" cue on paper, and the only way the claim "caustics" can be true | Derive the shadow from the optics instead of painting an occluder. Stop citing three.js `webgpu_caustics`, which uses a texture instead of tracing (§1) |
| A2 | Hero lensing + dispersion | **KEEP, revised** | Lensing is right; the dispersion spread of water is invisible, so its 6 taps are wasted | Use the exact exit-ray hit on the plate plane (02 §9.2), not the MTM offset. One tap. Dispersion off. Keep the paper backdrop out of the tone map |
| A3 | Band: one drop, one ring | **KEEP, revised** | Physical, cheap and settles on its own, but it puts text over water and its pointer trail looks like jquery.ripples | Put the water in a plate beside the copy. Drops come only from click or tap. Show the drop falling |
| A4 | Preloader: the A forms from particles | **KEEP, revised** | Exactly on brief, but the particle→SDF cross-dissolve is the riskiest frame on the page | Pour the water into the glyph and reveal the SDF body with a rising fill line. Compile pipelines async. Reject fallback adapters |
| A5 | Index pointer wake | **DEMOTE → backlog** | The Lusion link is inference. It is cursor-only, which contradicts 06's own reasoning and the mobile doctrine. It depends on K4 | — |
| A6 | Waterline match cut | **DEMOTE → DOM only** | Unseen's fame does not transfer: its mechanism blends two GL scenes, and our case page is a DOM page load | Ship the 1 px meniscus on the rising sheet edge at 0 GPU cost. Move the Unseen dive to S3 (NEW) |
| A7 | Surfacing reveal (Paper Water) | **DROP** | Procedural noise, which 05 bans (the «troppo artificiale» dislike) and which 06's own filter 4 bans. Its fame is design-tool adoption, not awards | K2 "drying film" on the first reveal only, gated on K4, or nothing |
| — | Cursor left empty | **KEEP** | Supported by a verified quote from an award team (§1) | — |
| NEW | **S3: the dive through the A** | **ADD** | This is the one slot where Unseen's award-winning "diving under the water" applies literally. Scroll-driven, and no extra renderer | — |

---

## 1. Evidence spot-check

| Claim in 06 | Status | Source | Note |
|---|---|---|---|
| Gentle Rain: SOTD, physical caustics on a light page | **verified**, with a caveat | awwwards.com/sites/gentlerain-ai · tympanus.net/codrops/2025/01/16/case-study-gentle-rain/ | SOTD **7.28**, a middling SOTD score. Light page confirmed. Caustics are computed physically, but the finished look is «caustics combined with dithering», and dithered highlights are exactly what 05 §5.2 #2 rejects. The site ships three performance versions for 60 fps. The SOTD date 2024-12-25 is *(06, unverified)* |
| "Pavel-style fluid is overused" (the case for an empty cursor) | **verified** | same Codrops case study | Zajno dropped the fluid sim because it «had already been used on many websites» |
| Unseen: SOTM Feb 2023, a dive under water | **verified** | awwwards.com/unseen-studio-by-unseen-studio-wins-sotm-february-2023.html | The article says «diving under the water effect to reach the projects page». Both scenes are rendered to two render targets and blended in a "transition pass" |
| Lusion v3: SOTD, Animations 10/10 | **verified** | awwwards.com/sites/lusion-v3 | SOTD 2023-10-02, score 8.25. Developer award 8.41, Animations/Transitions **10.00** |
| Lusion's pointer effect is a flowmap | **not supported** | discourse.threejs.org/t/57385 | The only answer (mjurczyk, 2023-10-26) calls it «a 2D displacement map» applied to the rendered frame. It says nothing about a flowmap. "Same family" is inference |
| matsuoka-601 Codrops feature | **verified** | tympanus.net/codrops/2025/02/26/webgpu-fluid-simulations-high-performance-real-time-rendering/ | MLS-MPM + SSF + Narrow-Range filter. Runs on an iPad Air 3 |
| Licences | **verified** | `gh api` | webgl-water: the `water.js` header reads "Released under the MIT license". OGL: `package.json` says `Unlicense`. Paper Shaders: plain Apache-2.0 text with no extra clauses. jeantimex and WaterBall: MIT. Stars: Paper 3,458, OGL 4,651, webgl-water 1,275, jeantimex 264, WaterBall 399 (all match 06) |
| "three.js ships `webgpu_caustics`" (evidence for A1) | **exists, but misleading** | `mrdoob/three.js/examples/webgpu_caustics.html` (three.js 115,623★, MIT) | It is a **fake**. `castShadowNode` looks up a caustic *image* (`Caustic_Free.jpg`) by the refraction vector, with an RGB offset. Do not cite it for A1 and do not use it as a donor. `webgpu_compute_water` and `webgl_gpgpu_water` exist and are the right three.js evidence for K2 |
| Cliché reference for A3's pointer trail | **verified** (new) | `sirxemic/jquery.ripples` | 1,135★, MIT, created 2013. It is the template-site "water ripples on a background" |
| Connector sweep (new) | **done** | 21st `search`, ui-layouts, Magic UI | 21st's Paper-derived "Water" items are described as «animated gradient/noise backgrounds». "Caustic Pool" is a WebGL2 wave equation with real caustics, but it has no fame and "keeps moving when you leave it alone", which fails WCAG 2.2.2. "Liquid Ripple/Dissolve" page transitions are concentric or fractal-noise, which are curved or procedural and so banned. ui-layouts only has liquid *glass* and gradient, both banned. Magic UI "Ripple" is CSS rings. **Nothing beats the mechanisms already on the table.** |
| drei and Paper npm downloads · homunculus Honorable Mention · jeantimex on Codrops Jan 2026 · Codrops Flowmap 2019 | *(06, unverified)* | — | None of these changes a verdict |

---

## 2. Pick by pick

### A1 · Hero caustics: KEEP, with fixes

**Fame.**
- Real, but it is Wallace's fame: a canonical 2011 Chrome Experiment.
- The demo's *look* (a tiled pool and a sphere) is dated. The *phenomenon* on paper is not: light focused onto a white sheet does not read as 2011.
- Gentle Rain proves only that physical caustics on a light page can reach SOTD. Its finish (dithering) is one we reject.

**Physics error in 06.**
- 06 replaces the demo's sphere shadow with "the extruded A's occlusion". Clear water does not occlude.
- The dark rim and the bright core both come from the optics:
  `I = areaRatio · T_fresnel(θ_in) · exp(−σ·d)`.
  - The meniscus bevel diverges light (and gives total internal reflection), which makes the dark rim.
  - The curvature focuses light, which makes the bright core.
- A painted occluder shadow would make the caption "caustics traced from the simulated surface" half false.

**Geometry.**
- Wallace models one interface over a floor.
- That is exact if the A **rests on the plate**: the back face touching the paper is the pool floor.
- If the letter stands off the page (02 §9.2 samples "the plate plane behind"), add the analytic second refraction at the flat back face. That is one more `refract`, about 0 ms.
- State in the build which model is used.

**Resolution.** 128² across the plate is about 9 px per cell at 1440, which is marginal for Cormorant hairlines. Lay the grid over the glyph's bounding box, not over the whole plate.

**Unchanged.** Fit, performance (0.2–0.4 ms, estimated) and licence (MIT header, jeantimex MIT) are all fine.

### A2 · Hero lensing: KEEP, revised

1. **Recorded dislike.**
   - On 06-24 Alberto rejected see-through refraction: «il colore è il materiale».
   - 06 keeps colour in the material, which is correct. Even so, this is the only pick that re-tests a verbatim dislike.
   - Show him a lensing on/off A/B still before anything else is built on it.
2. **Dispersion does nothing visible.**
   - `(1−1/1.331) − (1−1/1.337) = 0.0034`, which is 1.35% of the offset.
   - A 30 px lensing offset therefore splits by about 0.4 px. Six taps buy nothing visible.
   - Use one tap plus a mip level picked from thickness for the frosted core. This also removes the rainbow-rim risk entirely.
3. **Wrong donor.**
   - MeshTransmissionMaterial and Heckel's `N.xy·thickness` offset are screen-space tricks for rasterised meshes.
   - The engine raymarches the SDF (02 §9.2), so the exit ray's hit on the plate plane is **exact and costs nothing extra**.
   - Keep the MTM-style offset only for the SSF droplets.
4. **Seam risk that 06 missed.**
   - K1 tone maps (ACES or AgX). If the Canvas-2D paper backdrop goes through the tone map, the canvas paper will not equal the DOM `#f6f3ec`, and the plate will show as a window.
   - Composite the refracted backdrop in display space and tone map only the water's own HDR terms (reflection, glints, caustic excess). Alternatively, pre-apply the inverse tone map to the backdrop.
   - Acceptance: zero pixel difference between DOM paper and canvas paper at the plate edge.

### A3 · Band, one drop, one ring: KEEP, revised

1. **It breaks 06's own filter 5** ("no text over water"; 05 §4.2 and §5.1.10). A3 puts the band copy on the sheet and only caps the caustic contrast under it. Two fixes:
   - **Preferred:** the water lives in a **framed plate** inside the band. The canon says figures are plates, with the caption outside. The copy sits on dry paper.
   - **No layout change:** the existing `setObstacle({type:"rects"})` boxes become dry islands, as reflecting boundaries in K2. Test whether rectangular islands read as holes (card-like), which would break the canon.
2. **The interaction is a cliché.**
   - Drops that follow pointer movement are the jquery.ripples look (2013, 1,135★). Traced caustics raise the render, but the gesture stays a cliché.
   - Drop on **click or tap only**, at most one every ~600 ms. That also gives touch parity.
3. **A ring from nowhere reads as a UI ripple.**
   - Render the **drop falling**: a 250–350 ms SDF droplet with K1 optics, so the ring has a cause and the A's reprise is visible.
   - The cost is marginal.
4. **Checks that hold.** It settles in under 5 s, so WCAG 2.2.2 is met without a pause control. Budget 0.3–0.5 ms while active (estimate).

### A4 · Preloader, the A forms: KEEP, revised

**Fame.** Verified: the Codrops feature and the stars. No award use, which 06 already states honestly.

**The riskiest frame on the page.**
- SSF cannot hold Cormorant hairlines (02 TL;DR 3). The "cross-dissolve by density" would show a blob sharpening into a glyph, which reads as a morph trick.
- Replace it with a **pour into a vessel**:
  - The SDF body is revealed by a rising **fill plane**, whose level is the poured fraction.
  - Particles render only the falling stream and the splash on the rising surface.
  - Particles that cross the fill plane inside the glyph are absorbed and recycled. The caller owns `particleBuffer` and `changeNumParticles` (02 §9.2 point 5).
- The two representations are never compared on screen, and the pour becomes **G4-free**: no glyph confinement is needed.

**Load path.**
- **Pipeline compilation:** 7 compute + 6 render pipelines today, plus SDF, K2 and K3. Use `createComputePipelineAsync` / `createRenderPipelineAsync`, and start them at boot, before the count.
- **LCP:** a hero name at opacity 0 is not an LCP candidate until it fades in, so every extra second of preloader is an extra second of LCP. The pour must fit inside the real load time and the canon's 1–2.6 s. If it has not finished, it keeps pouring inside the hero; it never holds the count.
- **Fallback adapters:** headless or lab runs may get a software adapter. Reject `adapter.info.isFallbackAdapter` and show the still. A SwiftShader MLS-MPM would wreck TBT.

**The count.**
- Bind it to `min(load progress, plate share)`.
- Add a ceiling: after it, the plate share is forced to 100 and the pour finishes in the hero.

### A5 · Index pointer wake: DEMOTE → backlog

- **Evidence.**
  - Lusion's SOTD and its 10/10 are real, but nothing shows Lusion uses a flowmap (§1).
  - The flowmap's own fame is OGL (4,651★, Unlicense verified) and a 2019 Codrops demo. The 2019–22 "image smear on hover" was the default Codrops-portfolio move, which puts it at popular-but-dated risk.
- **Internal contradictions.**
  - 06 leaves the cursor slot empty because Alberto wants motion «con lo scroll, non con il cursore» (08-21). It then makes this effect cursor-only.
  - It also switches the effect off on coarse pointers. That is the mobile removal Alberto calls a fallback (05 §1.2).
- **Dependencies.** It needs K4, which is unanswered, and a DOM↔canvas handoff that is unproven (§3.2).
- **If revived:** drive it from pointer *and* touch, and pass the handoff probe first.

### A6 · Waterline match cut: DEMOTE → DOM only

**Unseen's mechanism cannot be used here.**
- It renders both pages as GL scenes and blends them in a transition pass.
- Here the case study is a DOM page on a real page load, so none of that mechanism applies.
- The actual proposal, displacement under a rising line on a moving image, has no award precedent. Its fame is borrowed.

**Perception.**
- Refraction on an image that travels for 1.1 s reads as compression smear.
- It is also a second move on the image, which breaks S4's rule that one image makes one move.
- The cost (K4, a K2 field and the seeding) is out of proportion to 1.1 s.

**What survives.**
- The **waterline itself**: a 1 px meniscus riding the `sheetEl` clip edge. It is DOM, costs 0 GPU, is allowed by the canon, and is trivially off under reduced motion.
- Unseen's dive moves to S3, where it applies literally (NEW, below).
- GPU refraction under the line becomes a later experiment, built only behind a probe.

### A7 · Surfacing reveal: DROP

1. **Procedural.**
   - Paper's `getCausticNoise` is 6 iterations of rotated sin/cos accumulation (read from source today). It is stateless noise, not a surface.
   - That is 05 §5.2 #3 ("procedural-fake"; «troppo artificiale», 07-14) and 06's own filter 4. 06 rejects Bruno Simon's rings for the same reason.
2. **Fame from adoption, not awards.** 21st.dev sells the port as «animated gradient/noise backgrounds». It is a background texture, not water.
3. **Two waters.** 06's own coherence audit names it Risk 1: procedural caustics next to traced ones.
4. **Canon.** A 0.9 s caustic shimmer on every tile is a veil over media, even if a brief one. Water on every tile also dilutes the one living A («pochi momenti ECCEZIONALI»).
5. **The licence is fine** (plain Apache-2.0). It is not the problem.

**Replacement.** A **K2 drying film**, using the Wallace integrator already in the set.
- A row of drops is seeded along the reveal's clip edge and damped to zero in 0.9 s.
- It is physical, and the same water as A1 and A3.
- It is gated on K4 and runs on the **first index reveal only**, with at most 2 running at once.
- If K4 is refused, there is no replacement: the canon line-mask stays.
- Honest fame: the mechanism is famous (Wallace; three.js `webgpu_compute_water`), but no award site ships this exact reveal.

### Cursor left empty: KEEP

This is right for three reasons:
- the category rut named in PRODUCT §7,
- the one-water rule,
- the verified Zajno quote above.

The pointer still pokes the A and drops into the band plate.

### NEW · S3: the dive through the A

**The move.**
- S3 "Otturatore" already plans a camera move *into or through the water* while the next sheet rises on a hairline (05 §5.1.7, 01 §4.7).
- Build it in the hero's own raymarcher. When the camera origin enters the SDF, the march starts inside. The whole plate becomes water lensing the paper grain and hairlines behind it.
- The rising sheet's hairline coincides with the camera crossing the surface, so the page surfaces into the next chapter.

**Why.**
- This is Unseen's verified «diving under the water» where the mechanism applies literally: one GL scene and a camera.
- It is scroll-scrubbed, which is Alberto's rule, and matches his own references (igloo, Lusion: «uno scroll immersivo»).
- No extra renderer: it lives in the hero's scroll region.

**Guards.**
- No horizon, no sea and no blue fill. This is a pass through a letter on paper, not the Golden Hour dive (05 §5.2 #1).
- No type behind the water during the crossing.
- Mobile gets a shorter scrub. 01 §4.7 is desktop-only today, which is a parity gap to close.
- Reduced motion: S3 stays static, as it is today.

**Cost.** The same shader with a camera-inside branch, at roughly hero cost, only in the hero region.

---

## 3. Cross-cutting problems in 06

1. **Self-contradictions.**
   - Text over water (A3) breaks filter 5.
   - Procedural caustics (A7) break filter 4.
   - A cursor-only effect with mobile removal (A5) contradicts the reason 06 gives for the empty cursor.
2. **K4's "pixel-identical" handoff is unproven.** It is spec-valid for one `GPUDevice` to configure several canvases, but four things can break the handoff:
   - **Resampling:** `<img>` gets high-quality downscaling, while a canvas without mips samples bilinearly, so sharpness jumps at the swap. Generate mips and match the backing size.
   - **Colour:** `copyExternalImageToTexture` into sRGB against a colour-managed `<img>` can shift on P3 displays or with embedded ICC profiles.
   - **Alpha:** premultiplied-alpha edges.
   - **First frame:** a possible flash when the layer leaves `display:none`.

   Probe all four before building any entry that depends on K4.
3. **Tone-map seam.** The paper backdrop must not go through ACES or AgX (A2 point 4).
4. **Load path.** Async pipelines, a fallback-adapter gate, and a preloader that never extends LCP (A4).
5. **Budget** (estimates; add `timestamp-query` first, 02 §9.1 #9).
   - **Hero region at rest:** SDF raymarch 1.5–3 + K2 0.3 + K3 0.2–0.4 + one lensing tap ≤ 0.1, which comes to **≈ 2.1–3.8 ms**.
   - **Hero peaks:** +1–3 ms during a splash.
   - **Preloader:** ≤ 3 ms of simulation plus SSF.
   - **Headroom:** with A5 and A7 out of the core set, only one region is live at a time, so "one heavy renderer" holds without K4.

---

## 4. Final recommended set (8)

| # | Slot | Effect | Donor mechanism | Proof (verified today unless marked) | Status |
|---|---|---|---|---|---|
| 1 | Hero, look | **The water lenses the page**: exact exit-ray lensing, one tap, thickness-mip core, dispersion off, backdrop kept out of the tone map | 02 §9.2 raymarch; WaterBall/Splash absorption (MIT) | drei and three.js lineage *(06, unverified)*; WaterBall MIT | core; A/B with Alberto first |
| 2 | Hero, look | **Caustics traced onto the paper**, with the shadow derived from the optics and a wet contact | Wallace area-ratio, jeantimex WebGPU port (MIT) | webgl-water 1,275★; Gentle Rain SOTD 7.28, physical caustics on a light page | core |
| 3 | Hero, interaction | **The poke**: a radial slow-motion splash that recomposes, with rings on the face | MLS-MPM free fluid (G4-free) + K2 | WaterBall 399★; Codrops 2025-02-26 | core |
| 4 | Preloader | **The pour**: water fills the Cormorant A, a rising fill line reveals the body, then it docks without a reboot | MLS-MPM stream + SDF fill plane | as #3 | core |
| 5 | S3 scroll | **The dive through the A**: the camera passes the surface as the next sheet rises | Unseen's "diving under the water", rebuilt in the hero raymarcher | Unseen SOTM Feb 2023 + the article quote | core (new) |
| 6 | S4 transition | **The waterline**: a 1 px meniscus riding the rising sheet edge | DOM clip edge | canon hairline; the cost of GPU refraction is not justified | core, 0 GPU |
| 7 | Band | **One drop, one ring**, in a framed plate beside the copy: a visible falling drop, drops from click or tap only, flat within 4 s | Wallace K2 + K3 | three.js `webgpu_compute_water` / `webgl_gpgpu_water` exist | core |
| 8 | Reveal | **Drying film** on the first index reveal | Wallace K2 on K4 | mechanism fame only | optional, gated on K4 |

**Backlog:** A5, the index wake. **Cursor:** empty. **Dropped:** A7, Paper Water.

---

## 5. The unifying water language: the waterline

The canon already draws the page with hairlines. The water language should make that hairline the surface of the water, not add a second vocabulary. Every liquid moment is then either the A itself or a waterline crossing the page:
- the fill line rising through the letter while it pours;
- the surface the camera passes through in S3;
- the meniscus riding the sheet that lifts a work into its case study;
- the single ring spreading from the drop in the closing plate.

All of them share one optics (η 1.333, Fresnel against the same paper-studio light, Beer-Lambert that turns cobalt only with depth) and one key light. Cobalt appears only in deep water, in the 1 px meniscus and in the caustic's shadow lobe. The pointer never paints: it only disturbs water that already exists. Every waterline returns the page to still print within about a second, except the band ring (flat within 4 s) and the A. The A is the one living object, calm, with a pause in its caption. So the site reads as a magazine whose rules happen to be the edges of water, not as a set of liquid effects.

---

## 6. Questions for Alberto (replace 06 §D)

1. **G4.** The pour (#4) and the poke (#3) can be G4-free. Does he still want particles *resting inside* the glyph? That needs the glyph-SDF confinement edit in `g2p.wgsl.ts`.
2. **Lensing A/B (#1).** Show a still with lensing on and one with it off, against his 06-24 rule «il colore è il materiale».
3. **Band layout (#7).** A framed water plate beside the copy, or dry islands around the copy?
4. **K4.** It now gates only #8 (and backlog A5). A "no" costs the page nothing core.
5. **Meniscus colour (#6).** Cobalt or ink? Carried over from 06.
