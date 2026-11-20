# 30 · Hero build spec: "Tipo d'acqua", final (the contract the implementers follow)

> Lead architect, 2026-09-18. Inputs: dossiers 01–07, proposals 20 (A, "Tipo d'acqua"), 21 (B, "FONDERIA") and 22 (C, "GETTO"), and the three judge verdicts. The five captures were inspected: the Golden Hour teal balloon, the job-order oil balloon with moiré, the flow-field plate, sersan's layered "S2" and Lusion's DDD "D".
> **Measured today** (Playwright, `channel:"chrome"`, against the live prototype at `127.0.0.1:5178`):
> - caption line counts at the narrowest desktop column (286.7 px at 1024 wide) and at 1440 (§4.4);
> - the S3 path of the glyph box against the *visible* (mask-clipped) lockup words over p ∈ [0, 1] (§1.4).
>
> All other costs are estimates, to be replaced by `timestamp-query` numbers at M0 and M3.
>
> **Units.** C = 1 world unit = the ink-bbox height of the A. The contract's glyph box is C / 0.538 = 1.859 C. "Plate" means S2 at 1440×900 with `glyphScale` 0.46, where C = 223 px.
>
> **Supersedes** 20/21/22 wherever they differ. When this spec and a dossier disagree on the FX.gl contract, 01 wins unless §4 names the change explicitly.

---

## 0. Decision

### 0.1 Scores and weighted totals

Weights: realism 0.25 · taste_fit 0.25 · wow 0.15 · feasibility 0.15 · performance 0.10 · integration 0.10.

**Weighted total per judge** (each cell = Σ weight × that judge's score):

| judge (lens) | A · standing glyph | B · MPM + glyph skin | C · puddle (GETTO) | judge's pick |
|---|---|---|---|---|
| J1 art director / Alberto's taste | **7.50** | 5.95 | 6.60 | A |
| J2 realism engineering | 6.75 | 5.78 | **7.23** | C |
| J3 delivery / perf / integration | **7.40** | 6.30 | 6.70 | A |
| **mean (consensus)** | **7.22** | 6.01 | 6.84 | **A** |

**Criterion means across the three judges** (they reproduce the same totals):

| criterion (weight) | A | B | C |
|---|---|---|---|
| realism (0.25) | 7.00 | 6.50 | **8.17** |
| taste_fit (0.25) | **8.00** | 5.67 | 4.33 |
| wow (0.15) | **8.67** | 7.00 | 6.17 |
| feasibility (0.15) | 5.33 | 4.00 | **7.83** |
| performance (0.10) | 6.67 | 6.00 | **9.00** |
| integration (0.10) | 7.00 | 7.17 | 7.17 |
| **weighted** | **7.22** | 6.01 | 6.84 |

**Winner: A, "Tipo d'acqua".** The page's own Cormorant Garamond 600 "A" becomes a standing body of water on the plate paper, and it throws a traced A of light.

**The disagreement, and how it is resolved.** J2 (realism) ranks C first. A wins the consensus by 0.38, and almost all of that margin is taste_fit: A leads by 3.67 points there, worth 0.92 of weighted score. C recovers 0.29 on realism, 0.38 on feasibility and 0.23 on performance. If taste_fit weighed 0.15 and realism 0.35, C would win (7.23 vs 7.12).

So the result is decided by Alberto's brief: «il logo in 3d della A fatta di acqua», and "2D" is the word he rejected. J2's objections are all engineering and optics, not taste, which means they can be grafted in. This spec therefore builds A's standing glyph, but with C's physics wherever physics decides the look:
- a surface-tension (screened-Poisson) profile that makes the faces convex, so they are not glassy flat slabs;
- caustics stored as ΔE, so untouched paper stays exact;
- a floor on the wave wavelength;
- env-only specular;
- the analytic Plateau–Rayleigh stream.

It also adds a hard look gate with Alberto (R1, after M2) and a cheap fallback. If R1 still reads as glass, the same glyph fields, optics, caustics and composite render C's puddle instead ("GETTO mode", about 1 day, §5.4).

### 0.2 What ships, in one paragraph

A 3D Cormorant "A" of clear water stands on the plate's paper in a horizonless paper cove. It is lit by a studio softbox with bright-field black flags. Its faces are gently domed by surface tension, and its silhouette is the exact type contour to about 0.1 texel.
- **Preloader.** It is poured into an invisible mould: a real Plateau–Rayleigh stream hits the apex, rivulets run down both legs, and the level rises in both legs like communicating vessels. The last quarter of the count is the fill.
- **Light.** The light it bends lands on the paper as a traced caustic "A of light". The cursor moves the lamp; it never deforms the letter.
- **Touch.** A click drops a drop: a crater, rings, and a slow-motion radial crown. Beads land on the floor, each holding an upside-down A, and dry with a fading wet mark.
- **Scroll.** In S3 the camera orbits and the light is scrubbed until the water A and the light A stand side by side.
- **Closing band.** The same water returns as beads "after the rain".
- **Rest.** Everything settles by itself within 5 s of the last input, then the GPU does nothing.
- **Particles.** MLS-MPM comes back as a real particle splash layer (M9, G4), off the critical path.

### 0.3 Grafts adopted (source → where it lives in this spec)

| # | graft | from | where |
|---|---|---|---|
| G1 | Face profile from a screened-Poisson / Young–Laplace solution. Convex faces lens the page and give the caustic a physical focus | C (answers J2) | §2.1 |
| G2 | Caustics stored as ΔE (+I at new positions, −1 at old), so unlit paper is exactly 0; cached when surface and light are static | C, B | §2.4 |
| G3 | Wavelength floor: impulse radius ≥ 0.06 C, wave grid ≥ 2 px/cell at the plate, normals from filtered η | C (answers J2) | §2.6 |
| G4 | Env-only specular, Kaplanyan specular AA, no thresholds on env luminance | B, C, 04 | §2.3 |
| G5 | Analytic stream with a Plateau–Rayleigh varicose ripple (λ = 9 r₀) that pinches into 3 drops | C | §1.1, §2.1 |
| G6 | Pour into a vessel: a fill level reveals the exact body; particles never have to hold a hairline | 07 A4 | §1.1 |
| G7 | Wet paper under the feet, under landed drops and along trails (×0.94 luminance, +5 % saturation, fades over 6 s) | B | §2.5 |
| G8 | Beads that lens an inverted A, each with its own caustic dot; bubbles with a silver TIR rim, entrained only by events | C, B | §1.2, §2.1 |
| G9 | "Pull a serif out, it heals" (analytic tendril): a SHOULD, cuttable | B | §1.2 (M4b) |
| G10 | S3 camera and light derived from `glyphScale` inside the engine (no fx-hero `gm` edit); light scrub sweeps the caustics; paper-only DoF | B | §1.4 |
| G11 | Virtual `warmLeft` = the fill, so the counter needs no progress-weight edit | B | §4.1 |
| G12 | Adaptive pour length; skip → pour ×3 | C | §1.1 |
| G13 | Mobile pour-on-reveal in the docked plate; hero IO watches `.hr-plate` (fixes the curtain quirk) | C | §1.5, §4.3 |
| G14 | "After the rain" band: beads only, a persistent scene slot, text rects kept dry | C, B | §1.6 |
| G15 | Motion stops ≤ 5 s after the last input, then zero submits: WCAG 2.2.2 with no Pause control and no new copy | B, C | §1.2 |
| G16 | `isFallbackAdapter` counts as no WebGPU; `requestAdapter()` runs **before** the engine is `import()`ed | B, J3 | §3.9, §4.1 |
| G17 | Core-format discipline: never use r16float/r32float as filterable storage; rgba16float storage, r16float only as render target and sampled | B, J3 | §3.3 |
| G18 | Deterministic seeds (mulberry32 on the sim step); 60/120 Hz identical-strip test | C, B | §3.6, §6 |
| G19 | Split first-frame pipelines from deferred ones; measure cold compile at M0 | J3 | §3.4 |
| G20 | `math.js` instead of vendoring wgpu-matrix: zero dependencies | B, C | §3.1 |
| G21 | Line discipline: no printed marks by default; one baseline only as an R1 A/B | C, J1 | §2.5 |
| G22 | M2 look gate with Alberto before any motion work is judged | C, 07, J1 | §5 R1 |

### 0.4 Fatal flaws the judges found, and the fix for each

| flaw (judge) | fix in this spec |
|---|---|
| Flat parallel faces read as glass or ice; the stem barely deflects the page (J1, J2) | Domed faces (G1, κ 0.45 by default, A/B at R1), wet footprint, resting bubbles seeded by the pour, beads with an inverted A, a foot meniscus. Fallback: GETTO mode |
| "Soft bright core" caustic is unfounded for flat faces (J2) | Convex faces give a real cylindrical-lens focus. The spec promises no caustic shape; the trace decides it, and no shape is printed |
| Light A hidden or clipped at S2; `glyphScale` 0.58 pushes it past x = 1468 (J1, J2) | `glyphScale` stays **0.46**. Key moved to camera-right and lowered (az +30°, el 24°); wall at 0.8 C. The light A lands 0.35 C left and 0.41 C down, inside the plate. Acceptance: ≥ 30 % of caustic energy visible outside the water silhouette (M3) |
| MPM φ ∪ SDF is fat and lumpy during the pour, then pops at the absorb (J2) | The committed pour is analytic: fill level + stream + rivulets on the exact body. MPM (M9) renders only free fluid in air, is clipped outside the body, and is absorbed on re-entry |
| Speed cap 12 cells/step overflows the 1e7 fixed point and breaks CFL (J2) | Cap at 1.0 cell/substep. Node momentum ≤ 4 ppc × 5 = 20 ≪ 214.7 (§3.7) |
| No silhouette coverage AA; jaggies crawl under the breathe (J2) | Cone-coverage AA from the ray's closest approach (§2.2); no perpetual breathe |
| 256×224 wave grid ≈ 1.1 px/cell with no floor → moiré (J2) | 128×112 grid (≈ 2.2 px/cell at the plate), impulse radius ≥ 0.06 C, σ 1.5-cell filtered normals (G3) |
| Unsmoothed r_in breaks the Lipschitz margin (J2) | Smoothed r̃_in (σ 0.006 C), a slope-limiting relaxation of T and ρ (|∇T| ≤ 0.6, |∇ρ| ≤ 0.3), step scale 0.75, bisection, a `holes` probe that must read 0 |
| Shade cost optimistic by 1.5–2×; full screen more like 4–6 ms (J2) | Re-estimated (§3.4): plate 0.8–1.1 ms shade; S3 uses a DPR ladder; p95 budgets enforced by timestamps |
| Scope ≈ 53 h with MPM last and a cut line (J3) | Committed scope M0–M8 has no MPM on the critical path. MPM is M9 (G4 stretch) and Q1 asks Alberto to confirm |
| Mobile float window unsupported by the contract, with a swap flash (J3) | Mobile keeps the counter-only preloader, then the same pour plays in the docked plate as it opens (G13). Q2 |
| Caption measured at 3 lines at 1024 (J3) | New instrument string measured today at 2 lines at 1024 (§4.4) |
| r16float storage texture is not core (J3) | G17 |
| Cold compile of about 14 heavy pipelines on the one visit that shows the preloader (J3) | G19. The caustics come in deferred and fade in with the water (honest: no water, no caustic) |
| Most fx-hero edits of the three (J3) | 4 small fx-hero edits and 1 CSS rule, no fx-core edit (§4.3) |
| 20 s of autonomous motion forces a Pause toggle (J3) | G15 |
| Rules on the cove wall echo the rejected "2D lines" (J1) | Off by default; one baseline only as an R1 A/B (G21) |
| Only half of MLS-MPM survives; Alberto may feel it was demoted (J1) | Named honestly to Alberto (Q1) with M9 scheduled, not dropped |

### 0.5 Rejected ideas (and why)

- **B's thesis (MPM body is the resting letter, column-fill skin).** Fill noise becomes normal noise, which is the moiré that sank the job-order still. It needs four coupled representations (≈ 66 MB). The "serif snap" is a φ cross-dissolve, the morph trick 07 A4 warns against.
- **B's 12° near-top-down camera.** The stem wall is ≈ 3 px, so the plate reads as a decal: "2D" again.
- **B's 7 printed construction marks (cobalt apex axis, crop marks, scale bar).** Test-bench chrome and 2D lines, both rejected worlds.
- **B's dew formation (beads rolling in).** It depends on the snap. The pour is stronger and legible.
- **C's thesis (a relief lying on the page, crest 0.05 C).** Not a standing 3D letter. Kept only as the R1 fallback.
- **C's dry letterpress matrix.** It echoes the blind emboss Alberto rejected on 2026-09-18.
- **C's "147,456 water cells" caption.** False: it counts dry cells.
- **A's perpetual motion** (a 20 s light drift, a camera breathe, a bubble timer) and its Pause/Play toggle. Replaced by G15.
- **A's `glyphScale` 0.58 and the `gm = seg(.22,.85)` edit.** The composition change clips the light A. Measured today at 0.46: the glyph *box* crosses the visible TUVERI box for p ≈ 0.41–0.58, but the A's ink does not; at p = 0.55 the hairline is still ≈ 55 px clear (§1.4). The edit is kept only as a last resort if the M5 mask probe fails.
- **A's mobile live window with a float→dock swap.** It is outside the contract and has a flash risk (Q2).
- **A's progress-weight edit (0.60 fill).** G11 needs no edit. The optional edit is flagged in §4.3, not scheduled.
- **A's second full A in the band (the back-lit reprise).** A second letter dilutes the one living A and costs about 1 ms on case pages.
- **Per-channel dispersion (body exit and caustic R/G/B).** Water's Δn gives a split of about 0.4 px on a 30 px offset (07 A2): invisible, and it costs 3× the lookups. Single IOR 1.333.
- **A's 3-channel caustic raster, its r16float storage grid, wgpu-matrix vendoring, and a TS-strip build for new code.** Replaced by the choices in §3.
- **HDR "extended" canvas.** Progressive, not needed for SOTD on SDR. Moved to stretch M10.
- **Glyph raster in a Worker (C).** The document's `FontFace` does not expose its URL, so a worker would need a second font-loading path. Instead: main-thread `OffscreenCanvas` raster in idle time, measured at M1. The worker is adopted only if that task is longer than 16 ms.

---

## 1. Experience script (shot by shot)

**Ease family** (the prototype's own):

| name | curve | GSAP / engine name |
|---|---|---|
| **out** | `(.16,1,.3,1)` | `expo.out`, `--ease-out` |
| **io** | `(.66,0,.22,1)` | `domus.inOut` |
| **soft** | `(.22,.9,.36,1)` | `domus` |
| **xio** | `(.87,0,.13,1)` | `expo.inOut` |
| **dt** | `(.25,1,.5,1)` | `dtOut` |

- **Durations:** micro 0.25 · reveal 0.9 · wipe 0.5 · travel 1.1.
- **Engine-scripted curves** use the same beziers through `math.js` (`ease.out/io/soft/xio/dt`).
- **Physical motion** (light damping, springs, ring-down) uses dt-normalised `exp(−λ·dt)`.

### 1.0 The stage (every shot)

- **Set: a horizonless paper cove.**
  - Floor y = 0; wall z = −0.8 C; a quarter-circle cove of radius 0.3 C joins them. Floor and wall extend to infinity.
  - Both are painted in the host ground token: `--paper-deep` for the hero, `--paper` for the band.
  - The A stands with the bottom of its ink bbox on y = 0. The ink-bbox centre is (0, 0.5, 0) and the letter's mid-plane is z = 0.
- **Camera.**
  - 22° vertical fov, orbiting the target (0, 0.5 C, 0).
  - Rest: **yaw +8°** (the camera sits to the right and sees the lit right-hand side faces), **pitch −6°** (slightly above).
  - Distance D = 4.78 / `glyphScale` C (10.4 C at 0.46, 5.03 C at 0.95).
  - `glyphX/Y` become an **off-axis lens shift**: the principal point is placed so the target projects exactly at the contract position. The A's perspective is therefore identical in the plate and at full screen (01 §8.1.7).
- **Light rig** (one rig for env reflection, refraction, caustics and AO; §2.3).
  - **Key softbox:** camera-right, **az +30°, el 24°** (az measured from +z toward +x).
  - **Strip fill:** camera-left.
  - **Overhead scrim.**
  - **Black flags** near the horizon.

### 1.1 S1 · Preloader (desktop ≥ 1024, float, 1440×900)

`t` counts from the first `fx:gl:state run`. The engine emits `run` only **after its first frame has been presented**, so the window never opens onto a hidden canvas (no paper → paper-deep flash). `t_run` = T0-relative time of that event (s). Measured today with WebGL2: 1.10 s. The M0 cold-compile probe sets the real value for WebGPU.

**Pour timing.**
- Fill duration **F = clamp(2.45 − t_run − 0.25, 0.80, 1.20) s**, so F ≈ 1.05 s at t_run 1.15.
- **Slow device:** if `run` arrives after T0 + 2.20 s, the pour is fast-forwarded hidden (`formNow`) and the window opens on a formed A.
- **Skip gesture:** fx-hero calls `hurry(3)` (§4.3); the pour rate ×3.

| t (s) | window (fx-hero, unchanged) | water (engine) | counter |
|---|---|---|---|
| 0.00 | opens from a point to 777.6×363.5 (0.9 s **out**); the A is centred at sim (0.800, 0.658), scale 0.46, cap 223 px, apex at y ≈ 196 | dry paper-deep window; the invisible mould is not drawn | Fonts / Shaders done ≈ 75 |
| 0.10 | — | the **stream** enters from the window's top edge: capsule r₀ 0.018 C (≈ 4 px), leading bulb, slow-motion gravity 12 C/s² | label **"Water"** (flag) |
| 0.25 | — | **impact on the apex**: 3–5 crown droplets (r 0.006–0.012 C) spray radially in slow motion; 2 land on the floor as seeded beads; 1–2 bubbles are entrained into the heavy stem | — |
| 0.25–0.45 | — | two **rivulets** race down the inner line of each leg (r = 0.35·r̃_in of that leg, 0.20 s, **soft**) | — |
| 0.45 → 0.25+F | — | **the level rises in both legs at once**, communicating vessels: foot serifs → crossbar (≈ 55 % volume, the level slows as the section widens) → upper legs → apex. The counter triangle stays empty. The free surface is the level plane with a meniscus rounding (smax k 0.012 C) and a 2-mode analytic slosh per leg. The caustic fades in as the water arrives (0.4 s **soft**, only once the deferred pipelines are ready) | digits 75 → 100 track the fill exactly (virtual `warmLeft`, §4.1) |
| 0.25+F−0.20 | — | the emitter throttles (**out**); the stream's varicose ripple (λ = 9 r₀, amplitude 0.08 → 0.45 r₀ toward the impact) **pinches into 3 drops**; the last drop rings the apex (a face-wave impulse) | 100 |
| counterDone + 0.08 → +1.1 | clip → plate slot, 1.1 s **xio**; A → (1.352, 0.600), scale 0.46 | the window's screen acceleration (second difference of `glyphX/Y`) becomes a lateral tilt impulse on the face waves (and on the free surface if the fill is not finished); ring-down ≈ 0.6 s | digits leave (fx-hero) |
| +0.45 | `handoff()`: z 96 → 1 | — | — |
| +1.25 | `FX.ready("intro")` | at rest; the **breath window** (§1.2) continues to the 5.0 s mark from the first pour frame, then the engine idles | — |

**Resulting times** at t_run 1.15:
- counterDone ≈ 2.50–2.60 s (the 2.6 s cap still guards it);
- handoff ≈ 3.0 s;
- `FX.ready` ≈ 3.8 s, about **+0.8 s** over today's 2.99 s (flag for Alberto: the preloader is now the show).

Everything stays under the 5.2 s CSS failsafe and the 6 s core guard.

**Once per session:** sessionStorage `rv-pour-seen`. Repeat visits use `slotSlit()` onto a formed A.

### 1.2 S2 · The hero at rest, and interaction

**Plate.** 446.4×468 at (993.6, 126). `glyphScale` 0.46 (unchanged), so the A is 223 px tall and 255 px wide. The feet are at ≈ 70 % of plate height and there is ≈ 95 px of paper each side.

**What the still frame shows:**
- A clear, standing Cormorant A:
  - the heavy right stem is a domed slab, 0.11 C thick;
  - the hairline is a round rod ≈ 0.021 C (≈ 4.7 px);
  - the serifs are bracketed; the apex is slightly rounded (0.004 C opening).
- The softbox reflection runs as a long highlight down the right half of each domed stroke.
- The left rims draw themselves as dark lines (the flags).
- Cobalt deepens only in the stem and the junctions: T = (0.85, 0.89, 0.98) through the stem.
- **The light A**: the traced caustic of the whole letter on the cove, offset ≈ 0.35 C left and 0.41 C down. Its left stroke and the lower half of the figure are visible beside and below the water A: bright focused lines, and a dark refraction band inside each shadow edge.
- Contact:
  - a foot meniscus;
  - faint cone AO (≤ −12 %);
  - wet paper in a 0.015 C band around the feet.
- **Evidence that it is liquid, left by the pour** (so the first still already says "water, not glass"):
  - 2 seeded beads on the floor near the right foot, each lensing an **upside-down A** and throwing a caustic dot;
  - 1–2 small bubbles clinging under the stem/crossbar junction, with silver TIR rims.

**The motion rule** (WCAG 2.2.2, G15):
- The engine moves on its own only inside a **breath window**. A window starts at the first pour frame, or at any input (pointer move, press, wheel/scroll, touch, key), and lasts **5.0 s**.
- Inside a window:
  - ring-downs finish;
  - a "breath" runs: light yaw ±2.5°, camera yaw ±0.6° and pitch ±0.3°, Lissajous 11 s / 17 s, fading in over 0.6 s (**soft**) and out over the last 1.2 s (**io**);
  - drops dry on their own clock (8 s), but drying is a fade of a *still* bead, not movement.
- When the window closes the engine goes **idle**: zero `getCurrentTexture`, zero submits. The state stays `run` (§4.1), and the canvas keeps its last frame.
- No Pause control and no new copy are needed.

**Pointer and touch.** Fine pointer only for hover; touch has tap and scroll.

| input | effect | parameters |
|---|---|---|
| **hover** (anywhere while the hero is visible) | **the pointer is the key light** (sersan's rule): highlights crawl along the rims, the flag lines move, the light A swings across the paper; nothing deforms | az = 30° + 14°·px, el = 24° + 8°·py (px, py ∈ [−1, 1] = pointer relative to the plate centre ÷ half the viewport); damped λ 4 s⁻¹; clamped az ∈ [12°, 62°], el ∈ [10°, 40°], so it never crosses the view axis |
| **click / tap on the letter** | **a drop falls where you click** (07 A3: the ring has a visible cause). A sphere r 0.03 C falls from 0.6 C above the hit point in 0.32 s (slow motion, g 12 C/s²). Then: a face dent 0.02 C (radius 0.06 C) that recovers in 0.6 s and rings; a radial crown of 6–10 droplets (0.8–1.4 C/s, 55–70°) that fall back into the letter (absorbed as face-wave drops) or land as beads; 1 bubble entrained by hard impacts | cooldown 350 ms; ≤ 1 drop in flight; the crater ring reflects off the letter's own edges |
| **click / tap on paper** | the drop lands as a bead after a 120 ms squash | beads ≤ 24 (tier A); the oldest shrinks away over 8 s |
| **press + drag across the body** | a finger through the face: paired dent + bow-wave drops along the path | strength 0.0025·speed (≤ 0.006 C), radius 0.06 C |
| **press + drag outward from the rim** (SHOULD, M4b, G9) | **pull a serif out, it heals**: an analytic tendril (capsule, smin k 0.008 C) stretches from the rim toward the pointer. Past 0.12 C it necks and pinches 1–3 beads that fall to the floor. On release it snaps back with a spring (ζ 0.5) and the stroke re-forms in 1.2–1.5 s | tendril radius tapers from 0.6·r̃_in to 0.15·r̃_in |
| **scroll / wheel** | Lenis velocity → a lateral tilt impulse `clamp(0.012·v, ±0.2)` on the face waves; the faces slop and the caustic flares briefly | ×(drift / 0.105) |
| **keyboard** | none (the canvas is `aria-hidden`); a key press only opens a breath window | — |

Events that make bubbles: an apex impact during the pour, hard click impacts, a tendril snap-back. Maximum 5 bubbles. A bubble rises in about 3 s, pops at the top surface, and leaves 1 ring and 2 micro-drops.

### 1.3 Beads and drying (hero floor)

- A bead is a sessile cap with a 75° contact angle and a base of 0.006–0.035 C. It refracts the scene behind it, so near the letter it holds an **inverted A**, and it throws an analytic caustic dot with a dark annulus.
- It dries over 8 s: the cap volume shrinks with an **out** ease, then a wet mark (×0.94) fades over 6 s.
- A bead touched by the re-forming letter or by a new drop merges (smin), with a 0.25 s wobble.

### 1.4 S3 · Otturatore (desktop ≥ 1024, 300 svh; fx-hero `applyStage` unchanged)

The engine derives everything from **g = clamp01((glyphScale − 0.46)/0.49)**. That is exactly fx-hero's `gm = seg(p, .08, .80)`, so fx-hero needs no edit.

| driver | mapping | ease |
|---|---|---|
| camera yaw | +8° → **−18°** over g ∈ [0.30, 1]: the camera orbits left, the light A separates to the left by parallax | io |
| camera pitch | −6° → −10° over g ∈ [0.30, 1] | io |
| distance | D = 4.78/glyphScale (contract dolly) | — |
| **light scrub** | key az 30° → **58°**, el 24° → **16°** over g ∈ [0.72, 1]. This starts only after TUVERI has fully left its mask (p ≥ 0.60 ⇔ g ≥ 0.72), so no caustic ever moves under type. The caustics sweep across the cove as you scroll, every frame traced | io |
| energy | `drift` 0.105 → 0.168 scales scroll-slosh gain and breath amplitude ×1.6 | — |
| paper-only DoF | the caustic/AO lookup is blurred by CoC 0 → 3 px at g = 1 (atlas mips); **the letter stays sharp** (macro-lens read) | — |

- **p = 1 (scroll 900):** full screen, A cap ≈ 460 px. Light-A offset on the wall ≈ (−1.28 − 0.26) = −1.54 C horizontally and −0.43 C vertically. The A is 1.15 C wide, so **the water A and the light A stand side by side**. The lower part of the light A bends along the cove.
- **Acceptance (M5):** ≥ 60 % of the caustic energy lies outside the water silhouette and inside the viewport.
- **900 → 1800:** pinned while the "Now" sheet rises on its hairline. The water is still, except for scroll-slosh.
- **At 1800:** `sleep(true)`. `onEnterBack` → `wake()` with no re-pour, because every field is world-space and persists.
- **Stretch M10: the dive.** Across 900 → 1800 the camera walks through the front face of the stem; the march starts inside the SDF; the last frame is the page magnified ×1.33 through water. It must cross the surface exactly when the sheet's hairline crosses the plate centre, with no horizon, no sea and no blue fill (07 NEW).

**Text-over-water, measured today** (glyph box at 0.46 against the *visible* word boxes, i.e. word ∩ `.lk-line` mask):

| p | glyph *box* ∩ visible TUVERI | A *ink* (left hairline at the word's lowest visible y) to TUVERI's right edge |
|---|---|---|
| 0.41–0.58 | up to 3,467 px² | always clear: ≈ 119 px at p .45 · 84 px at .50 · 55 px at .55 · 41 px at .576 |
| ≥ 0.60 | 0: TUVERI is fully masked | — |

So `gm` stays. **M5's probe uses the engine's exact silhouette and caustic mask** (§6.4) over 60 values of p and must read **0 px** of water and 0 px of |ΔE| > 2/255 inside the visible word boxes. If it fails, fix it engine-side first (delay the yaw start); edit fx-hero `gm` only as a last resort, flagged.

### 1.5 Mobile (390×844, dock, tier B)

- **Plate.** 390×488 at y 630 (≈ 44 % visible at load); glyph (0.3996, 0.5) × 0.687, so the A is 180 px tall. Contract DPR (1.5) × tier-B scale 0.85 = **1.275** (497×622 backing).
- **Preloader.** Counter only, as today (the plate share counts 1 in dock). No float window (Q2).
- **The pour waits for the reader** (G13). It uses the same pour, stream, rivulets, level, crown and beads as desktop, driven by the same code, and starts at the first of:
  - (a) `fx:intro:handoff` + 0.35 s (≈ when `slitOpen` is 10 % open), if `.hr-plate` is ≥ 40 % in view;
  - (b) an IntersectionObserver on `.hr-plate` crossing 0.60.

  F = 1.10 s fixed. Once per session.
- **Plain entry, repeat visit, or hash:** a formed A.
- **Input:** tap = a drop; scroll = slosh. There is no hover light (touch), so the light breathes inside breath windows only. Touch drag stays with page scroll (`pan-y`), so there is no tendril on touch: an input difference, not an effect difference.
- **S3:** none (contract, desktop only). Mobile S3 parity is a backlog item (07 NEW), not in this build.

### 1.6 Closing band `#contact`: "after the rain" (home and case pages)

- **Same canvas, dock mode, `ground:"paper"`.** Persistent scene slot: the hero fields stay allocated, so returning to the hero never re-pours.
- **View.** Orthographic, top-down onto the band paper (the page *is* the paper). Key az 30°, el 40°.
- **At rest.** 18–26 sessile beads, log-normal radii (median 0.9 % of band height, range 0.4–2.2 %), seeded (mulberry32, the page path as seed).
  - The copy rects from `setObstacle({type:"rects"})`, padded 0.4 em (0.24 em vertically, fx-gl's rule), are **hydrophobic**: no bead ever sits under type.
  - Each bead shows a dark bright-field rim, a softbox highlight, a caustic crescent offset from the light, and a wet footprint.
- **Arrival** (first band entry per page view, motion only): 4 drops fall "toward the page" in slow motion (0.3 s, growing sphere with a converging caustic) and burst into beads.
- **Hover:** light. **Tap/click on dry paper outside the rects:** one drop (cooldown 600 ms). **Drag:** pushes beads; touching beads coalesce with a 0.25 s wobble.
- **Motion rule:** as §1.2, still ≤ 5 s after the last input. Cost ≈ 0.2–0.35 ms while moving, 0 at rest.
- **Case pages** load and compile only the band pipelines (§3.4).

### 1.7 Reduced motion

- No preloader, no Lenis, no stage; the plate is docked (contract).
- `warm(40)` + `warm(180)` builds the fields and sets the **formed** A with the pour's resting evidence: 2 beads and 1 bubble, seeded, at the rest light. The engine renders once, then `sleep(false)`.
- The instrument omits the GPU time.
- **`.hr-still` "Still frame captured from this engine." is also shown under reduced motion**: 1 CSS rule, flagged (§4.3).
- The band renders its beads once, still. No arrival drops.

### 1.8 No WebGPU

- **Detection.** The head script adds `gl-off` when `!("gpu" in navigator)` (§4.3). An async failure calls `fail()`:
  - `requestAdapter()` returns null, or `adapter.info.isFallbackAdapter` (or legacy `adapter.isFallbackAdapter`) is set: in both cases **the engine module is never downloaded**;
  - `requestDevice` rejects;
  - a pipeline or WGSL error;
  - `device.lost`.
- **What `fail()` does:** removes the canvas, sets `FX.flags.gl = false` (→ `html.gl-off`), emits `fx:gl:state off`, and logs one `console.warn`.
- **Result.**
  - The poster `fx-plate-v1.webp` (892×940) is **recaptured from this engine** (M8) at the dock composition, and `.hr-still` shows.
  - The caption instrument is hidden (existing CSS). S3 is off (no stage). The band is plain paper.
  - With `?gl=0` the same.

---

## 2. Look bible

### 2.1 Geometry

**Glyph.**
- The page's own `600 {0.84·S}px "Cormorant Garamond"` (read from `--w-hero` / `--f-display`), placed exactly as `paintGlyph()` does: `textAlign center`, `textBaseline alphabetic`, `y = S/2 + gh/2 − descent`.
- Rasterised at S = 2048 (tier A) or 1024 (B, C).
- Signed distance d2 by JFA+1 with anti-aliased sub-texel seeding (`d −= (α − 0.5)·texel`), converted to C units (C = ink-bbox height). Error ≤ 0.1 texel, which is 0.07 px at full screen.

**Liquid corrections.** A closing of 0.008 C turns concave corners into fillets. An opening of 0.004 C rounds the apex and serif tips, since water cannot hold a point.

**Profile fields** (512², rgba16float, baked once):

| field | definition |
|---|---|
| r̃_in | medial half-width: a walk along −∇d2 (≤ 16 steps), then a Gaussian with σ 0.006 C |
| S | screened Poisson `S − ℓc²∇²S = 1` inside the closed glyph, S = 0 on the contour, **ℓc = 0.09 C** (C's Young–Laplace form) |
| u | `clamp(S / S_strip(r̃_in), 0, 1)`, with `S_strip(a) = 1 − 1/cosh(a/ℓc)`. A smooth cross-stroke coordinate: 0 at the rim, 1 on the medial line, for thin and wide strokes alike |
| T (half-thickness) | `T_med = min(0.055 C, 1.15·r̃_in)`; **`T = max(ρ, T_med·(1 − κ·(1 − u)))`**, κ = dome, **default 0.45** (R1 A/B: 0 / 0.45 / 0.8) |
| ρ (rim radius) | `min(0.026 C, 0.97·r̃_in, T_med)` |
| m (wave taper) | `smoothstep(ρ, ρ + 0.02 C, −d2)` |

- **Lipschitz relaxation** (after the bake): `T ← min(T, T_n + 0.6·dx)` and `ρ ← min(ρ, ρ_n + 0.3·dx)` over the 8 neighbours, 8 iterations. Both only decrease, so |∇T| ≤ 0.6 and |∇ρ| ≤ 0.3.
- **Results:** the stem (≈ C/8 wide) is 0.11 C thick at its crown with domed faces; the hairline is a round rod ≈ 0.021 C; a serif ≈ 0.014 C. Junctions swell naturally (S is larger there).

**Body SDF** (evaluated in every trace):
```
d  = d2(p.xy)                                   // bicubic B-spline via 4 bilinear taps
Te = T(p.xy) + m·η_side(p.xy) + dent(p)         // η_side = front/back wave height for sign(p.z)
q  = vec2(d + ρ, |p.z| − Te + ρ)
f  = length(max(q, 0)) + min(max(q.x, q.y), 0) − ρ
f  = smin(f, skirt(p), 0.012)                   // foot meniscus: body cross-section at y=0.005,
                                                //   dilated 0.015 C, 0.01 C tall (only when p.y < 0.03)
f  = smin(f, drops, stream, rivulets, tendril)  // k = 0.3·r for drops, 0.006 C for rivulets
f_fill = smax(f, p.y − y_f − η_s(p.x, leg), 0.012)   // S1 only: fill level + slosh
```
- Seen from the front, the silhouette is the exact type contour.
- **Lipschitz ≤ ≈ 1.25** (slopes 0.6/0.3, wave slope ≤ 0.25), so the **step scale is 0.75**.

**Stream.** Capsule from above the window edge to the apex, radius `r₀(1 + a(y)·sin(2π(y − v t)/λ))`, r₀ 0.018 C, λ 0.162 C, a from 0.08 to 0.45 toward the impact. When pinched: 3 spheres.

**Droplets / beads / bubbles.**
- Drops: spheres, r 0.006–0.03 C, stretched along velocity (≤ 1.6:1).
- Beads: spherical caps, 75°, base 0.006–0.035 C.
- Bubbles: spheres, r 0.008–0.016 C, air inside water.
- Sub-2-px drops: analytic impostors with coverage compensation `α *= clamp(diamPx/1.25, 0, 1)²`.

### 2.2 Trace and anti-aliasing

1. **Outer trace.** Start at the entry into the scene's bounding volume (letter AABB ∪ drops ∪ stream).
   - Tiers A/B/C: ≤ 48 / 40 / 32 steps.
   - ε = 0.5·r_pix, where r_pix = t·pixelAngle.
   - Then 4 bisection steps. f32 world space throughout; there is no depth buffer round-trip.
2. **Coverage AA.** Track `c = min(f/r_pix)` along the ray.
   - Hit: α = 1, unless the pixel's closest approach at the silhouette gives `α = clamp(0.5 − c, 0, 1)`.
   - Miss with c < 0.5: shade the closest point and blend it with α over the cove.
   - This antialiases the silhouette analytically, with no TAA.
3. **Normal.** 4-tap tetrahedral gradient with h = max(0.0015 C, 0.5·r_pix), on bicubic d2.
4. **Specular AA.** Normal variance = |N(h) − N(2h)|²; `α² = clamp(α₀² + min(2·0.15·var·4, 0.2), 0, 1)`, α₀ = 0.015 (Kaplanyan/Filament, with no screen derivatives in non-uniform flow).

### 2.3 Optics per water pixel (exact recipe)

| step | recipe |
|---|---|
| Fresnel | exact unpolarised dielectric (04 §5.2), **n = 1.333**, F0 = 0.0204; TIR → 1 |
| Reflection | 1) analytic ray test against the cove (planes + cylinder) → the paper shading of §2.5 at the hit, so the rims reflect the real paper and its caustic. 2) Otherwise the studio cubemap at the GGX mip for α. Downward rays never read the cubemap |
| Refraction in | `refract(V, N, 1/1.333)`. March inside along −f: tiers A/B/C ≤ 24 / 20 / 16 steps, step 0.75·|f|, minimum 0.002 C |
| Exit / TIR | refract out; if the angle exceeds the critical 48.6°, reflect and continue: ≤ 2 bounces, ≤ 12 steps each. **Single IOR, dispersion off** |
| Behind | the exit ray → an analytic cove hit → paper (§2.5); or 1 re-entry test (≤ 12 steps) → a cheap second level (Fresnel-weighted env + paper through Beer, no further TIR) |
| Beer–Lambert | over the real inner path length L: **σ = 0.36·(−ln accent_lin) C⁻¹**. V1 cobalt #2340c9 → σ = (1.47, 1.07, 0.19), so the stem face-on gives T = (0.85, 0.89, 0.98). "Milk" on long paths: `T = mix(T, lum(T), 0.35·smoothstep(0.1, 0.3, L))`. Read `--accent` at runtime (V2 and V3 follow their own accent) |
| Bubbles | ray–sphere tests during the inner march (≤ 5): water→air Fresnel from inside → silver TIR rim with a clear, minifying centre |
| Beads / drops | analytic sphere/cap, two interfaces + TIR; the exit ray re-enters the scene trace once, so beads near the letter show an **inverted A** |
| Combine | `F·reflection + (1 − F)·T·transmitted`, then **min(col, 1.35)** (value ceiling) |

**Environment.** Procedural rgba16float cubemap, 256² per face, 6 GGX mips, built once in compute (≈ 1 ms dGPU / 4 ms iGPU). It is baked in the **key-light frame** and sampled through `R = rotY(az − 30°)·rotX(el − 24°)`, so moving the light rotates the whole rig with no re-bake.

| element | placement (rest) | size | linear radiance |
|---|---|---|---|
| key softbox | camera-right, az +30°, el 24° | 1.5:0.45, 18° across, 5 % soft edge | **10** |
| strip fill | camera-left, az −60°, el 15° | 0.08 × 0.9 | 3 |
| overhead scrim | zenith | 60° disc | 1.6 |
| ambient | the rest of the upper hemisphere | — | 0.08 |
| **black flags** | horizon bands el −5°…+12° on both sides (except behind the key and fill) + the camera-side lower hemisphere | — | **0.015** |

- **No analytic specular lobe anywhere** (no `pow(n·h, …)`); all highlights are env × Fresnel.
- At grazing angles the flags draw the dark contour: bright-field lighting, 04 §5.5.

### 2.4 Caustics (traced; the only thing allowed to be called "caustics")

- **Light-view trace.** An orthographic grid perpendicular to the key direction, covering the letter's footprint plus 0.1 C margin (≈ 1.5 × 1.4 C).
  - Tiers A/B/C: **256² / 192² / 128² rays**.
  - Each ray traces the same body SDF: entry → inner march → TIR (≤ 2) → exit.
  - It then intersects the cove analytically and stores `{landing uv, I, branchId, L_recv}` in a storage buffer.
  - I = (1 − F_in)(1 − F_out)·exp(−σ·L)·Π(TIR). Rays that miss land at their old position with I = 1.
  - **Atlas parametrisation:** u = x; v = arc length along the cove profile (floor → cove → wall). Extent 3.2 × 2.6 C.
  - Atlas size: tier A 1024×832, B 768×624, C 512×416, **r16float render target** (renderable, blendable, filterable in core).
- **ΔE raster** (G2). Two additive passes of the (n−1)² triangle grid:
  - **+** pass: vertices at the *new* landing uv; the fragment writes `I · |det(dpdx(old), dpdy(old))| / |det(dpdx(new), dpdy(new))|` (the true Jacobian).
  - **−** pass: vertices at the *old* uv; the fragment writes −1.
  - Drop triangles whose corners have different `branchId` or land > 3 texels apart; that gap is the dark refraction band.
  - Untouched paper is **exactly 0**, because misses cancel bit-exactly (1.0 − 1.0).
- **Blur.** Separable, radius = `L_recv·tan 9°` (the softbox half-angle; `L_recv` is the analytic distance from the receiver to the z = 0 plane along −L). Build 4 mips for S3's paper DoF.
- **Cache.** Re-trace only if the light changed by > 0.05°, or the surface is changing (wave energy > ε, a drop, stream or tendril is alive, or the fill level moved). Otherwise reuse: 0 ms.
- **Energy check** (M3). ΣΔE·area = −(reflected + absorbed) ± 5 %.
- **Formation.** The caustic weight ramps 0 → 1 over 0.4 s (**soft**) when the deferred caustic pipelines become ready. During the pour the caustic exists only where water exists.

### 2.5 The paper stays exactly paper

- **Canvas.** `navigator.getPreferredCanvasFormat()` (bgra8unorm on Windows), `alphaMode "opaque"`, `colorSpace "srgb"`, usage `RENDER_ATTACHMENT | COPY_SRC` (for the capture hook). The encode is manual: linear → exact sRGB OETF in the shader.
- **Paper radiance.** `col = token_lin × (1 + 0.7·ΔE_blur) × AO × wetAlbedo`, where the key share is 0.7.
  - **AO**: SDF cone AO along the receiver normal, 5 taps, ×0.3 (water is transparent), ≤ −12 %, gone by 0.08 C.
  - **wetAlbedo**: a 256² r8unorm wet map over the floor (feet band 0.015 C, landed drops, trails). Wet paper: luminance ×0.94 and saturation +5 %, fading over 6 s after it dries.
- **Exact bytes.** A pixel is *untouched* when it has no water or drop coverage, |ΔE| < 1/1024, AO = 1 and wet = 1. It is written as **the token's sRGB bytes ÷ 255**, which quantise back to exactly (237, 231, 220) for `--paper-deep` and (246, 243, 236) for `--paper`.
  - The clear value of the frame is the same exact colour (loadOp `clear`, so pixels outside the scissor are exact too).
- **Water and caustic pixels only.** A paper-anchored shoulder: identity to K = 0.93, then `K + (1 − K)(1 − e^{−e/(1−K)})`. Then the OETF. Then a **static** 64² blue-noise TPDF dither of ±1 LSB, masked off untouched paper.
- **Never:** a global tone map, film grain, bloom, a vignette or chromatic aberration.
- **Printed marks.** None by default. `?rules=1` draws **one** 1 px `--line` baseline (an analytic SDF line, razor-sharp under magnification) under the letter, for the R1 A/B only (G21).

### 2.6 Waves (the only surface detail)

- **Grids.** Front and back heightfields over 1.25 × 1.10 C around the letter: **128×112** (tier A), 96×84 (B), 64×56 (C). At the plate that is ≈ 2.2 px per cell.
- **Integrator.** Wallace, verbatim (`_refs/webgpu-water/src/shaders/water/update.frag.wgsl`): `v += (avg4 − η)·2.0; v *= 0.985; η += v`. 2 substeps at a fixed 60 Hz, masked by the glyph (reflecting at d2 = 0). The rear face gets 0.4× the amplitude of front impulses.
- **Floor** (G3):
  - drop and dent impulse radius ≥ **0.06 C** (≥ 13 px at the plate, ≥ 27 px at full screen);
  - normals from η filtered with a σ = 1.5-cell Gaussian;
  - |η| ≤ 0.006 C and slope ≤ 0.25 (both clamped).
- **Ring-down.** e-fold ≈ 0.55 s, gone in ≈ 1.5 s.
- **Still water is optically flat**: no perpetual ripples, no noise normals, nothing procedural.

### 2.7 Anti-artifact rules (every one is checked by a probe or a dbg view)

1. No static surface detail, procedural noise, sparkle cells or perpetual sines.
2. No analytic specular lobes. No thresholds on env luminance. Prefiltered env plus specular AA.
3. Silhouettes by coverage AA. Bicubic d2. No TAA. Dither is static only.
4. Lipschitz: step 0.75, slope-limited T/ρ, bisection. `?dbg=holes` must show 0 at yaw −25°…+15° for κ 0 / 0.45 / 0.8.
5. Wave floor as in §2.6. `?dbg=normal` at 400 % shows no lattice.
6. Single IOR; no coloured rims. The only tint is Beer from `--accent`.
7. Caustics: discontinuity rejection, softbox blur, energy ±5 %. `?dbg=dE`.
8. Paper exactness probe: 0 differing untouched pixels.
9. A fixed timestep and deterministic seeds, so strips are reproducible.
10. The value ceiling of 1.35 and the shoulder. No blown rectangle, no grey-down of the paper.
11. **No text over water.** The float canvas is clipped to the plate in S2. The S3 mask probe = 0 px. The band keeps type dry.

---

## 3. Architecture

### 3.1 Files (prototype build; engine authored for reuse)

**Language decision: plain JavaScript ES modules with JSDoc and `// @ts-check`. No TypeScript strip step.**
- The static prototype serves files as they are, and there is no esbuild.
- `tsc` 5.9.3 (already in node_modules) type-checks the engine with `--allowJs --checkJs --noEmit` as a lint gate.
- Next.js imports the same files with `allowJs`.
- WGSL lives in `*.wgsl.js` modules that export template strings. Shared chunks are composed by `${}` interpolation. **Never put a backtick in a WGSL comment.** The `#include` directives of the webgpu-water clone are inlined by hand.
- The MPM kernels (M9 only) are copied once from `src/webgl/waterball/mls-mpm/*.wgsl.ts` by `scripts/port-mpm-kernels.mjs`: Node 22 `stripTypeScriptTypes` + a specifier rewrite. They are then edited in their new home. `src/webgl/waterball/**` stays untouched.

```
public/proto/rivista/
  fx-water.js                 classic `defer` script (≈ 8 KB), replaces fx-gl.js in parts/head.html.
                              FX.register("gl") synchronously; FX.gl = api (pending); after 2 rAF:
                              requestAdapter → reject null/fallback → import("./water/engine/index.js").
                              Owns every DOM concern: canvas placement, clip/CSS, IO pour trigger,
                              pointer/touch mapping, gating, rects measuring, events, stats.
  dev-water.html              standalone bench (own rAF, no FX): HUD with per-pass ms, URL knobs, ?dbg=,
                              ?capture=, ?bake=sdf. Not linked from the site (the same role as dev-gl.html)
  water/
    engine/index.js           createWaterEngine(opts) → Engine  (framework-free, DOM-free except canvas/OffscreenCanvas)
    engine/gpu.js             device + features (timestamp-query), error scopes, async pipeline cache
                              (first-frame set / deferred set, raced 4 s), timestamp ring, capture readback
    engine/math.js            vec/mat4, lens-shift perspective, orbit, invert (~120 lines), bezier eases, mulberry32
    engine/tier.js            tier choice, DPR rule, adaptive DPR ladder, one-shot downgrade
    engine/glyph.js           font raster (OffscreenCanvas, idle) → JFA → closing/opening → r̃_in, S, u, T, ρ, m
                              → Lipschitz relax → V(y) LUT → CPU d2 copy (256²) for hit tests
    engine/env.js             softbox/flags cubemap + GGX prefilter (compute)
    engine/body.js            rest-body uniforms, dome κ, fill level + slosh, stream, rivulets, tendril, pour state machine
    engine/waves.js           front/back heightfields, impulses (drop, dent, drag, tilt), filtered normals
    engine/drops.js           drops, crown, beads (sessile, drying, merge), bubbles, wet map
    engine/caustics.js        light-view trace, ΔE raster (±), blur + mips, cache logic
    engine/render.js          the one shade pass (cove + body trace + drops + composite + exact paper + dither), debug views
    engine/scenes.js          scene slots: "hero" and "band"; persistence across mounts
    engine/wgsl/*.wgsl.js     common, sdf, glyph-jfa, profile, env, waves, drops, caustic-trace, caustic-raster,
                              blur, shade-hero, shade-band, composite
    engine/mpm/**             (M9 only) ported + edited MLS-MPM splash kernels, density brick
    assets/a-sdf-1024.png     baked fallback d2 (16-bit split into R/G, lossless), fetched ONLY if the font check fails
scripts/
  sync-water-engine.mjs       copies public/proto/rivista/water/engine/** → src/webgl/water/engine/** with a sha256
                              manifest; `--check` exits 1 on drift (Next.js port time)
  port-mpm-kernels.mjs        (M9) one-off strip + rewrite
  probes/water/*.mjs          Playwright probes w0…w8 (§6)
```

**Next.js reuse.**
- `water/engine/**` imports no FX, no GSAP and no DOM (except its canvas).
- The port copies it verbatim (`sync-water-engine.mjs`) and writes a ≈ 100-line `WaterPlate.tsx` host: dynamic import, `ssr:false`, driven by `gsap.ticker`, copy through `dict.ts` (EN/IT).
- The host re-implements only what `fx-water.js` does.
- The old Golden Hour engine (`src/webgl/waterball/**`) is not used by the new path.

### 3.2 Engine API (internal; fx-water.js and the future React host are its only callers)

```js
const eng = await createWaterEngine({ device, adapterInfo, tier, seed, fontFace: '600 {px}px "Cormorant Garamond"',
                                     tokens, scenes: ["hero","band"] | ["band"], onStats, onEvent });
eng.attach(canvas)                           // configure context (format, opaque, srgb, usage RT|COPY_SRC)
eng.setView({ cssW, cssH, dpr, mode })       // reallocates the swapchain + screen-size targets only
eng.setScene("hero"|"band", { rects? })      // band rects in drawing px (fx-gl's measuring, ported)
eng.setGround("deep"|"paper"); eng.setTokens({ paper, paperDeep, ink, accent })
eng.setPlacement({ glyphX, glyphY, glyphScale, drift })   // every frame
eng.setScissor({ t, r, b, l, on })           // CSS px → backing px
eng.pointer({ x, y, down, type }) · eng.tap({ x, y }) · eng.scrollVelocity(v)
eng.armPour() · eng.startPour({ fill }) · eng.hurry(k) · eng.formNow()
eng.warm(steps)                              // fixed 1/60 s steps, no present
eng.frame(dtSec) → { submitted: boolean }    // accumulator + render, or nothing when idle
eng.stats  → { rays, gpuMs, dpr, tier, fill, idle, passes: {name: ms} }
eng.capture({ w, h, ss: 2 }) → Promise<ImageBitmap>   // posters and probes
eng.debug  → { mask(), readPixel(x,y), setTime(t), holesCount() }   // only with ?debug=1
eng.lost   → Promise<GPUDeviceLostInfo>;  eng.destroy()
```

### 3.3 Representations and formats (tier A; sizes for B/C in §3.5)

| role | representation | size | format (core-safe) |
|---|---|---|---|
| letterform | 2D signed distance d2 (closed/opened) | 2048² | r16float (render target + sampled) |
| JFA transients | seed coordinates | 2048² ×2 | rg16uint (renderable, `textureLoad`), **freed after the bake** |
| profile | u, T, ρ, m | 512² | rgba16float |
| hit tests | d2 copy on the CPU | 256² | Float32Array (one `mapAsync`) |
| volume LUT | V(y), 256 entries + letter volume | — | CPU |
| face waves | η, v (front) / η, v (back) | 128×112 ×2 ping-pong | rgba16float (storage) |
| drops / beads / bubbles / capsules | analytic primitives | 48 / 24 / 5 / 8 | storage buffer, 48 B each |
| wet map | floor wetness | 256² | r8unorm |
| caustic rays | landing uv, I, branch, L_recv | 256² | storage buffer vec4f |
| caustic atlas | ΔE (+ blur ping-pong, 4 mips) | 1024×832 | r16float |
| environment | cubemap, 6 GGX mips | 256²×6 | rgba16float (storage for the bake) |
| (M9) MPM brick | density, local to an event | 64×64×32 | r32float **storage + manual trilinear** (no `float32-filterable` needed) |

Steady memory ≈ 22 MB on tier A. There is no MPM allocation until M9 fires.

### 3.4 Passes, in order, with costs (estimates, replaced by timestamps at M0/M3)

**One-time bake** (under the counter, ≤ 1 ms GPU slices; dGPU / iGPU):
- raster ≈ 3–6 ms CPU (idle callback);
- JFA ×3 (2048² raw, 1024² closing and opening) 3 / 14 ms, sliced 3 passes per frame;
- profile + multigrid (5 levels, 8 V-cycles) 0.6 / 2.5 ms;
- Lipschitz relax 0.1 / 0.4;
- env 1 / 4;
- V(y) + d2 readback < 1 ms.

**Pipeline sets** (G19).

| set | pipelines | gates |
|---|---|---|
| **First-frame** | bake passes, env, `shade-hero` (body + stream + rivulets + fill + drops + composite), `composite-only` | `linked` and the first `run` |
| **Deferred** | caustic trace, caustic raster ±, blur, drops update, waves update | created right after link; each feature switches on when its pipeline resolves (the caustic fades in) |
| **Band** | `shade-band`, drops update | case pages compile only this |
| **MPM** (M9) | its kernels | lazily, on the first event that needs them |

All pipelines use `create*PipelineAsync`, raced against 4 s. Cold-compile time per pipeline is logged at M0 with a cleared shader cache.

**Per frame (S2 plate, float scissored to 446×468 CSS).** Tier A at DPR 1.5 = 0.47 MP, ≈ 27 % water. Tier B iGPU at DPR 1.25.

| # | pass | tier A dGPU ms | tier B iGPU ms |
|---|---|---|---|
| 1 | waves: 2 substeps ×2 faces | 0.01 | 0.04 |
| 2 | drops / beads / bubbles / wet | < 0.01 | 0.02 |
| 3 | caustic trace (skipped when cached) | 0.30–0.50 | 1.2–2.0 (192²) |
| 4 | caustic raster ± | 0.10–0.20 | 0.4–0.6 |
| 5 | caustic blur + mips | 0.05 | 0.15 |
| 6 | shade: cove + trace + composite (scissor = clip) | **0.80–1.10** | 2.5–3.5 |
| | **total, light moving** | **1.3–1.8** | 4.3–6.3 |
| | total, caustics cached | 0.8–1.1 | 2.5–3.5 |
| | idle | **0** | **0** |

**Other states.**

| state | tier A dGPU | other tiers | how |
|---|---|---|---|
| **S3 full screen** | 2.9 MP at DPR 1.5 → shade 3.0–4.5 ms | tier B iGPU at DPR 1.0: 5.5–8 ms | the DPR ladder (§3.5) holds tier A at p95 ≤ 5 ms |
| **S1 window** | ≈ 0.63 MP scissored, ≈ 1–1.5 ms | — | — |
| **Mobile dock** (A16 / Adreno 740 class) | — | tier B, 0.31 MP: 3–5 ms | — |
| **Band** | 0.2–0.35 ms while moving, 0 at rest | — | — |
| **M9 MPM while active** | +0.3–0.6 ms | +1.5–2.5 ms iGPU | 0 dispatches otherwise |

**p95 budgets** (enforced):

| state | p95 |
|---|---|
| tier A plate | ≤ 2.0 ms |
| tier A S3 | ≤ 5.0 ms |
| tier B mobile dock | ≤ 8 ms |
| tier B iGPU S3 | ≤ 9 ms |
| tier C | ≤ 12 ms |
| band | ≤ 0.5 ms |
| main thread per frame | ≤ 0.4 ms, no allocations |

**Levers if M3 misses budget**, in this order:
1. an entry-distance prepass at ¼ resolution (conservative minimum t);
2. drop the outer steps to 40;
3. caustic grid down one tier;
4. S3 DPR ladder earlier.

### 3.5 Tiers, DPR and adaptive resolution (no effect is removed at any tier)

| | A | B | C |
|---|---|---|---|
| chosen when | default | touch, width < 768, or `adapter.info.vendor` ∈ {intel, qualcomm, arm, imagination} | `deviceMemory ≤ 4`, or one downgrade |
| DPR | contract rule `min(dpr, 1.5, √(3.2e6/area))` × 1.0 | × 0.85 | × 0.70 |
| d2 / profile / waves | 2048² / 512² / 128×112 | 1024² / 512² / 96×84 | 1024² / 256² / 64×56 |
| caustic rays / atlas / rate | 256² / 1024×832 / on change | 192² / 768×624 / ≤ 30 Hz | 128² / 512×416 / ≤ 20 Hz |
| steps: outer / inner / TIR / re-entry | 48 / 24 / 12 / 12 | 40 / 20 / 10 / 10 | 32 / 16 / 8 / 8 |
| drops / beads / bubbles | 48 / 24 / 5 | 32 / 16 / 4 | 24 / 12 / 3 |

- **S3 DPR ladder** (float, full screen): [1.5, 1.25, 1.0] × tier scale.
  - If the p95 of the last 30 frames exceeds the budget: step down now.
  - Step up only after 8 s under 70 % of budget (sersan's asymmetric hysteresis, no flip-flop).
  - A step reconfigures the canvas only; all fields are size-independent.
- **One-shot downgrade.** Over frames 60–150 after formation: median GPU > 7 ms (A) or > 11 ms (B) → next tier, re-emit `fx:gl:state`.
- **Without `timestamp-query`** (Safari, Firefox): use the fps band [48, 58] over 2.5 s windows.

### 3.6 Timestep and determinism

- **Fixed 60 Hz accumulator** for waves (2 substeps), drops, beads, fill and slosh, tendril, bubbles, and M9.
- At most 3 steps per rendered frame; excess time is dropped, so the sim slows rather than spirals.
- Camera, light damping, clip and breath run at render rate on the ticker's dt, clamped to [0.001, 0.033].
- **Seeds:** mulberry32 keyed by (step index, event id). Posters, the reduced-motion still and probe strips are therefore reproducible, and 60 Hz and 120 Hz produce identical sim states at equal step indices.

### 3.7 Solver changes (M9, G4 unlocked; MLS-MPM splash layer)

MPM never represents the resting letter. It simulates **free water in the air**: the crown at the pour's apex impact, and the click splash.

| item | Golden Hour / proposal A | this spec |
|---|---|---|
| domain | 80×60×18 global box | a **local brick** 64×64×32 cells at h = 0.016 C (≈ 1.0 × 1.0 × 0.5 C), placed around the event |
| confinement | 3 capsules, inflate, leash, explode, un-stick nudges | **deleted**. Free fluid under gravity (slow motion 12 C/s²). The body SDF is a solid: particles entering f_body < 0 are **absorbed** (mass 0) and injected as a face-wave impulse at the entry point. The floor at y = 0: landing clusters (≥ 5 particles within 1 cell) become one bead of summed volume; loners evaporate |
| EOS / viscosity | Tait γ 5, k 3 / 0.45 | **γ 1, k 50 / 0.08** (Splash values) |
| clock | dt 0.13 × 2 substeps per rAF | **dt 0.2, 1 substep, fixed 60 Hz** (§3.6) |
| speed cap | 60 (or A's 12 cells/step) | **1.0 cell per substep (CFL)**. Node momentum ≤ 4 ppc × 5 = 20 ≪ i32/1e7 = 214.7 |
| fixed point | 1e7 | 1e7 (10× headroom at the cap) |
| seeding | `Math.random` | hashed per (particle index, event id); rejection-sampled inside the body within 0.07 C of the hit, v = 1.1 C/s along the normal + 0.35 C/s radial |
| count per event | — | 2,048 / 1,024 / 512 (tiers A/B/C) |
| duplicate `copyPosition` | present | removed |
| render | SSF | splat the density into the brick (r32float storage), one 3×3×3 binomial pass, `φ = iso(ρ̃)`, **clipped to outside the body**: `φ' = max(φ, −f_body)`. Unioned by smin (k 0.5 cell) into the same trace and optics. No SSF |
| sleep | perpetual | 0 dispatches once no particles remain (≤ 2 s after an event) |

**Acceptance:** a jet visibly pinches into droplets, mass drift < 0.5 %/min in a 10-minute soak, no NaN, and 0 dispatches 2 s after the event.

**Claims:** "particles" may appear in copy only after M9 ships, and only for particles that were actually spawned (§4.4).

### 3.8 GPU timing

- **Setup.** Optional feature `timestamp-query`. Per-pass `timestampWrites` (beginning/end) into a 64-query set (a ring of 4 frames). `resolveQuerySet` → a QUERY_RESOLVE buffer → copied into one of 3 MAP_READ staging buffers. `mapAsync` without awaiting; skip the frame if all 3 are busy.
- **Reporting.** 1 s medians per pass and in total → `stats.passes` and `stats.gpuMs`.
- **Quantisation.** Chrome quantises timestamps to 100 µs by default. Probes launch Chrome with `--enable-webgpu-developer-features` (or `chrome://flags/#enable-webgpu-developer-features`) to get raw values. M0 verifies that sub-0.1 ms values appear.
- **The caption shows the 1 s median of the total**, and omits it when timestamps are unavailable or under reduced motion.

### 3.9 Adapter, device and loss

```
init (sync): if !FX.flags.gl → FX.gl = null; return.  FX.gl = api (pending).
+2 rAF:  adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" })
         if (!adapter || adapter.info?.isFallbackAdapter || adapter.isFallbackAdapter) → fail("no-adapter")
         import("./water/engine/index.js")            // never downloaded without a real adapter (Lighthouse lab)
         device = await adapter.requestDevice({ requiredFeatures: ts ? ["timestamp-query"] : [] })
         device.addEventListener("uncapturederror", e → fail(e.error)) ; device.lost.then(onLost)
         first-frame pipelines + bakes (need FX.fonts) → linked = true → replay the pending queue
onLost(info): if (destroying) return; toOff() (state off, canvas hidden, poster back);
         if (info.reason !== "destroyed" && !retried): retried = true; after 1 s re-request the device,
         rebuild pipelines + fields from the cached raster, formNow() (never re-pour), restore the last
         scene/mount/state. A second loss → stay off.
```

**Covered arrivals (R3, 2026-10-04; CONTRACTS §21).** `requestAdapter` is one ~180 ms task on the GPU process's main thread that holds every compositor swap (anything moving freezes; a still page shows nothing), so a page reached by a cut (S4, S5, the cold back) starts its GPU only after `fx:nav:landed`, once the reader's input has been quiet for 400 ms and nothing finite animates on screen, held 600 ms; the input is never capped, so a reader who scrolls on never meets the freeze and the host keeps its paper / poster until the first pause.

**Plain loads (R4, 2026-10-04; CONTRACTS §21).** A plain case load (typed URL, reload, shared link) runs the same still-page gate from `fx:ready`: its only host, the band, is far below the fold. A plain home entry with motion asks for the adapter in the head script, before the first paint (`window.__rvGpu`, consumed once by `fx-water.js`): the task ends while nothing is on screen, at the cost of a first paint ~90 ms later on the bench, and the lockup rises without a freeze. The S1 intro keeps D12 unchanged; reduced motion, gl-off and `?gpufail=` never ask early.

**The page-change seam (R5, 2026-10-04; CONTRACTS §21).** Leaving a page tears its WebGPU context down in Chrome, one synchronous step on the GPU process's main thread: with the bfcache off it runs in the next document's commit (1–3 seams in 40 over 120 ms on an idle machine, every other one +15–20 ms of `domInteractive`), with the bfcache on (Chrome's default) every page is cached and the teardown runs at a later eviction (0–1 in 40, borderline). A release under the cut's cover was built and measured: destroying the device moves nothing, owning the context in a hidden iframe moves all of it but costs the same 64–163 ms of swap-blocking GPU time wherever it lands, and a cut has no still moment (S4 commits mid-flight, S5 while the name rises): at the S4 click it froze the start of every forward cut. So the host never releases under a cut; a bfcache restore keeps its device and its formed A.

**Fonts.**
- After `FX.fonts`: `document.fonts.load('600 430px "Cormorant Garamond"', "A")` then `document.fonts.check(...)`.
- If the check fails 1.5 s later, fetch `assets/a-sdf-1024.png` and decode it with `createImageBitmap(..., {colorSpaceConversion: "none", premultiplyAlpha: "none"})`, so the A is never Times.
- `onVariant` rebuilds the glyph if `--f-display` / `--w-hero` changed, then `formNow()`.

---

## 4. FX.gl contract mapping and edits

### 4.1 Method by method (fx-water.js; 01 §2 and §8 are the reference)

| contract | implementation |
|---|---|
| `FX.register("gl", {init, build, onVariant, onResize})`, sync | classic `defer` script in the fx-gl slot of `parts/head.html` (after fx-core, before fx-hero). No top-level await |
| `init` | `!FX.flags.gl` → `FX.gl = null`. Else `FX.gl = api`, `pending = true`; adds `ctx.gsap.ticker.add(tick)`, `pointermove`/`pointerdown`/`pointerup` on window, `visibilitychange`, nav cover/lock listeners; boot at +2 rAF (§3.9) |
| `get linked` | device + first-frame pipelines + env + glyph fields + tokens ready (drives "Shaders") |
| `mount(el, {mode, ground})` → bool | idempotent per (el, mode, ground). Re-parents the one canvas: float = `position:fixed; inset:0` on body; dock = absolute in the host. `className "gl-canvas"`, `aria-hidden="true"`, `pointer-events:none`, `visibility:hidden` until the first presented frame. `ground` → `setGround`; host `hero` → scene hero, `band` → scene band. Measures synchronously, so `stats.w/h` are valid right away (fx-hero's dock placement reads them). Works while pending |
| `setZ(z)` | style z-index; remembered if the canvas does not exist yet |
| `window(rect)` | kept: sets `clip` from a rect (unused, compatibility) |
| `setObstacle({type:"glyph"})` | **no-op** (the A is always the lockup's A; rebuilt on `onVariant`) |
| `setObstacle({type:"rects", els, pad})` | fx-gl's rect measuring **ported verbatim** (fx-gl.js L260–295: `.sc-line` mask offsets, 0.4 em pad, ×0.6 vertically) → band keep-out rects in drawing px. Re-measured on resize and variant |
| `params {glyphX, glyphY, glyphScale, drift}` | read every tick → `setPlacement`. glyphX/Y → lens shift; glyphScale → dolly **and** the S3 path g (§1.4); drift → energy gain |
| `clip {t,r,b,l,on}` | CSS `clip-path: inset()` written every tick only when the string changes, float only, also while pending. The same insets × dpr become `setScissorRect` (fixes 01's ≈ 6× wasted fill). **Any clip change ends idle** (new pixels must be drawn) |
| `warm(n)` / `get warmLeft` | Queue ≤ 220 fixed steps, 10 per tick, **also while asleep**. The first chunk presents a frame (`drawn`); the queue emptying presents a frame and emits `fx:gl:stats`. If the pour is **not armed**, the first warm call forms the A (`formNow`) and the steps settle it. If the pour is **armed** (desktop float intro: `html[data-preloader]` present at init, motion, and `rv-pour-seen` unset), `warm(90)` is absorbed and **`warmLeft = ceil(90·(1 − fill))`** (virtual, G11), 90 until the pour starts. fx-hero's `plate = 1 − warmLeft/90` then equals the fill, with no fx-hero edit |
| `wake()` | → `run` (deferred if pending or covered). **`fx:gl:state run` is emitted only after the first presented frame.** On the first run of an armed float intro, `startPour()` |
| `sleep(hide)` | → `sleep`. `hide` → canvas `visibility:hidden`; `false` → keep the last frame (no `getCurrentTexture`, no submit) |
| `get state` | `"off" | "sleep" | "run"`. Internal **idle** (the 5 s motion rule) keeps `state = "run"`, sets `stats.idle = true`, and makes zero submits. Any input, param, clip, scroll or view change ends idle |
| `get stats` | `{n, gpuMs, dpr, tier, state, host, w, h}` + `{rays, fill, idle, scene}`. **`n = rays`**, kept for shape compatibility; the caption writer changes in the same commit (§4.3) |
| `fx:gl:stats` | `{n, gpuMs|null, dpr, tier, rays}` at 1 Hz **while submitting**, once when a warm queue empties, once on entering idle |
| `fx:gl:state` | `{state, tier, host}` on every transition, including the downgrade re-emit and `off` |
| `scrollVelocity(v)` | tilt impulse (§1.2); band: bead wobble; ends idle |
| `recolor()` | re-read `--paper/--paper-deep/--ink/--accent` (hex) → `setTokens` |
| `resize()` / `onResize` | measure (float = window, dock = host rect); if changed → `setView` (swapchain + screen-size targets only), then present one frame. **No re-warm, no re-pour** |
| `onVariant` | tokens + font check → glyph rebuild if needed → `formNow()` |
| new: `hurry(k)` | pour rate ×k (called by the skip gesture) |
| gating | port fx-gl's: `visibilitychange` hidden → `sleep(false)`, visible → `wake()`; `fx:nav:covered` / `fx:lock{menu}` → still frame + remember `wakeAfter`; `fx:nav:uncovered` / `fx:nav:reset` / unlock → `wake()` if `wakeAfter && host && !hidden` |
| pointer | `pointermove` on window when `FX.flags.fine` and a host is visible: mapped into drawing px by mode (float: viewport; dock: host rect) → `eng.pointer`. `pointerdown`/`up` whose client point lies inside the current clip rect (float) or the host rect (dock) → tap/click/drag classification (tap ≤ 250 ms and ≤ 10 px). CPU hit test on the 256² d2 copy at z = front face |
| mobile pour trigger | listens to sticky `fx:intro:handoff` and to its own IntersectionObserver on `.hr-plate` (threshold [0.4, 0.6]); §1.5 |
| device loss | §3.9 |

### 4.2 Events, one by one

| event | direction | behaviour |
|---|---|---|
| `fx:gl:state {state, tier, host}` | emits | every transition; the first `run` only after the first presented frame (it opens the S1 window) |
| `fx:gl:stats {n, gpuMs, dpr, tier, rays}` | emits | as §4.1 |
| `fx:gl:linked` | emits | kept (no consumer) |
| `fx:intro:handoff` (sticky) | consumes | mobile pour trigger |
| `fx:nav:covered / uncovered / reset`, `fx:lock{reason:"menu"}` | consumes | gating |
| `fx:ready` | — | not needed (`slotSlit` is fx-hero's; the engine is already formed) |
| `visibilitychange`, core `onResize`, `onVariant` | consumes | as §4.1 |

### 4.3 Required edits outside the engine (each flagged for Alberto where it is copy)

| file | edit | type |
|---|---|---|
| `parts/head.html` L66 | `<script defer src="fx-gl.js">` → `<script defer src="fx-water.js">` | code |
| `parts/head.html` head script, after the `?gl=0` line | `if(!('gpu' in navigator)) d.classList.add('gl-off');` | code. **This replaces any fx-core edit**: `flags.gl` already reads `gl-off`, so fx-core (WP-A) stays untouched |
| `fx-hero.js` L71 | label `"Plate"` → `"Water"` | **copy, flag** |
| `fx-hero.js` L156–168 `observeHosts` | observe `.hr-plate` (the figure) instead of `heroHost`; `e.target === plateEl` → `heroVisible`. Fixes the curtain quirk (01 §6) | code |
| `fx-hero.js` L288 | `const skip = () => { tl.timeScale(3); const g = gl(); if (g && g.hurry) g.hurry(3); };` | code |
| `fx-hero.js` L379–382 caption writer | `const bits = [nb(s.rays.toLocaleString("en-US") + " caustic rays"), "WebGPU"];` then the existing ms and DPR tokens | **copy, flag** |
| `fx-hero.css` after L77 | `html.rv-js:not(.rv-motion):not(.gl-off) .hr-still { display: block; }` (reduced motion shows the labelled still) | **copy-visibility, flag** |
| `parts/b-hero.html` | label `Fig. 01 · An A of water, rendered live`; the 3 poster `alt` texts (§4.4); update the HTML comment | **copy, flag** |
| `parts/b-hero.html` posters | `fx-plate-v1/v2/v3.webp` **recaptured from this engine** (M8), same names, 892×940 | asset |
| `parts/c-footer.html` | colophon `GSAP, Lenis, WebGL2` → `GSAP, Lenis, WebGPU` | **copy, flag** |
| `parts/b-preloader.html` | comment only ("the window onto the live water …") | — |
| `assemble.mjs` | **no code change**. Run `node assemble.mjs`, then `--check` must exit 0. The engine sync lives in `scripts/sync-water-engine.mjs`, so WP-A's assembler is untouched | — |
| `fx-core.js` | **none** | — |
| `fx-gl.js`, `dev-gl.html` | unreferenced after the swap; kept for rollback (revert the one head line) until Alberto approves, then removed in a cleanup commit | — |
| *optional, not scheduled* | fx-hero `progress()` weights so that the whole count reads the fill (C's 3-line edit) | flag only if Alberto asks |

`glyphScale` 0.46, `gm`, the clip choreography, the stage and the band mount **do not change**.

### 4.4 Caption, claims and posters

Measured today (Figtree loaded, `.hr-instr` 286.7 px wide at 1024 and 403.2 px at 1440):

| string | lines at 1024 | lines at 1440 |
|---|---|---|
| today: "16,384 particles · WebGL2 · 0.1 ms GPU · DPR 1" | 2 | 2 |
| **new: "65,536 caustic rays · WebGPU · 1.2 ms GPU · DPR 1.5"** | **2** ✓ | 2 |
| A's: "16,384 particles poured · caustics traced · 1.2 ms GPU · DPR 1.5" | 3 ✗ | 2 |
| label today: "Fig. 01 · Flow field, rendered live" | 2 | 1 |
| **new label: "Fig. 01 · An A of water, rendered live"** | 2 (same as today) | **1** ✓ |
| "Fig. 01 · The letter A in water, rendered live" | 2 | 2 ✗ |

| slot | text (EN; IT goes to `dict.ts` at port time) | true by construction because |
|---|---|---|
| label (flag) | **Fig. 01 · An A of water, rendered live** | the engine renders every frame; with `gl-off`, `.hr-still` qualifies it as today |
| instrument (flag) | **`{rays} caustic rays · WebGPU · {ms} ms GPU · DPR {dpr}`** (tier A 65,536; B 36,864; C 16,384) | `rays` is read from the engine: the size of the light-view grid that traced the caustic now on screen (cached or not); `ms` is the timestamp 1 s median, omitted when null; `dpr` is the real backing ratio |
| preloader (flag) | **Loading · Water** | the plate share is the fill fraction |
| `.hr-still` | "Still frame captured from this engine." (unchanged) | posters recaptured at M8; the reduced-motion frame is rendered by the engine on this device |
| poster alt v1 (flag; finalise against the captured frame) | "A capital A in Cormorant Garamond made of clear water, standing on paper, with the light it bends falling on the paper beside it." | it describes the capture |
| colophon (flag) | GSAP, Lenis, WebGPU | the stack |
| **never print** | "particles" (until M9 ships, and then only spawned counts); "simulation" for the resting letter; "sun", "glints", "physically accurate", "real caustics" (say "traced") | — |

**Tell Alberto** once M3 is verified on screen: the CV clause «simulated water with real caustics» becomes true again for the hero if it is worded "real-time water with caustics traced from its surface". The waves and drops are simulated; the resting shape is designed.

**Posters.** `dev-water.html?capture=plate&v=1|2|3&seed=1`:
- dock composition (`glyphScale = min(0.88, 0.86·892/940)`, centred), rest light, pour evidence seeded;
- rendered at 1784×1880 and box-downsampled to 892×940 (`eng.capture({ss:2})`);
- WebP q 0.9 through `OffscreenCanvas.convertToBlob`.

`?capture=mobile` (4:5) and `?capture=band` are for review decks only.

---

## 5. Milestones (build order, parallel lanes, acceptance)

Owners: **E1** optics/render, **E2** geometry/simulation, **E3** integration/tooling.
- Every milestone ends with screenshots at **1440×900 and 390×844**, a **clean console** (0 errors, 0 WebGPU validation warnings), and the listed probes, run on real WebGPU Chrome (§6).
- Each milestone touches only the files listed, so the lanes do not collide.
- One feature branch, `feat/water-hero`, atomic commits per milestone.

| M | lane · est. | files (disjoint) | deliverable | acceptance (screenshot or probe) |
|---|---|---|---|---|
| **M0** | E3 · 5 h | `dev-water.html`, `engine/gpu.js`, `math.js`, `tier.js`, `wgsl/composite`, `scripts/probes/water/w0_*` | harness, device, fallback rejection, timestamp ring + HUD, exact-paper composite, capture/readPixel hook, pipeline-compile logging | **w0**: 20 canvas points = (237,231,220) on deep and (246,243,236) on paper at 1440 and 390. HUD shows per-pass ms with sub-0.1 ms resolution (developer flag). Cold `create*PipelineAsync` times logged with the cache cleared. Adapter info logged, `isFallbackAdapter === false` |
| **M1** | E2 · 7 h (parallel with M0) | `engine/glyph.js`, `wgsl/glyph-jfa`, `wgsl/profile`, `assets/a-sdf-1024.png` | raster → JFA → corrections → r̃_in/S/u/T/ρ/m → relax → V(y) → CPU copy; `?dbg=sdf|profile`; `?bake=sdf` | **w1**: the d2 = 0 isoline vs the DOM Cormorant A at the same box, **Hausdorff ≤ 0.5 px** at plate scale and at 4×. Raster long task ≤ 16 ms (else move it to a Worker). Letter volume printed. max |∇T| ≤ 0.6, max |∇ρ| ≤ 0.3 |
| **M2a** | E1 · 4 h (parallel with M0/M1) | `engine/env.js`, `wgsl/env`, cove parts of `wgsl/shade-hero` | env bake + GGX mips, cove analytic hit, lens-shift camera, light rig rotation | `?dbg=env` cube strip; the cove shades to exact paper everywhere (w0 still passes) |
| **M2b** | E1 · 8 h (needs M1) | `engine/render.js`, `wgsl/sdf`, `wgsl/shade-hero` | body trace, coverage AA, spec AA, Fresnel, refraction, TIR, re-entry, Beer, bubbles/beads (static seeds), AO, wet footprint, κ, `?rules=`, `?dbg=normal|steps|holes|mask` | plate still at 1440 and a full-screen still (g = 1). **w2**: holes = 0 at yaw −25…+15 for κ 0 / 0.45 / 0.8. No hatching in a 400 % crop. w0 passes. **→ R1 (Alberto): look gate** |
| **M3** | E1 · 7 h | `engine/caustics.js`, `wgsl/caustic-*`, `wgsl/blur` | light-view trace, ΔE ±, blur + mips, cache, deferred fade-in | **w3**: energy −(R+A) ± 5 %. Light-A visibility at S2 ≥ **0.30** (energy outside the water mask, inside the plate). Hover pair az 16° vs 44° moves the light A ≥ 0.1 C. Per-pass timestamp table vs §3.4 |
| **M4** | E2 · 9 h (+ M4b 3 h, SHOULD) | `engine/waves.js`, `engine/drops.js`, `wgsl/waves`, `wgsl/drops`, the tendril part of `engine/body.js` | waves, impulses (tilt, scroll, drag), click drop → crater/rings/crown → beads (inverted A, caustic dot, drying, wet), event bubbles, motion rule + idle, fixed step; M4b tendril heal | **w4**: a 6-frame strip at 60 ms spacing of a click on the stem (drop, crater, ring reflecting off the stem edge, crown, beads). A bead 4× crop shows an inverted A. **60/120 Hz strips hash-identical** at equal step indices. **0 submits 5.0 s after the last input** (logged submit counter) |
| **M5** | E3 · 9 h (starts after M0 with a stub engine that renders exact paper + a formed body once M2b lands) | `fx-water.js`, `parts/head.html`, `fx-hero.js` (the 4 edits), `fx-hero.css` (1 rule), `parts/b-hero.html` (copy placeholders marked TBC), `parts/c-footer.html`, `scripts/probes/water/w5_*` | the full contract, S1 with a formed A (no pour yet), S3 camera path from glyphScale, band rects, gating, device-loss path, `?gpufail=adapter|device|pipeline|lost` | **w5**: 01 §8.5 reproduced, with the timing re-baselined for WebGPU (the first `run` ≤ 400 ms after `fx:built` and t_run ≤ 1.4 s on Alberto's dGPU, logged; z 96 → 1 at handoff; clip ends `inset(126px 0px 306px 993.6px)`; `fx:ready{intro}` at tl + 1.25 s; scroll 0/900/1800 → `inset(0)`, glyph (0.8, 0.5) × 0.95, `sleep` at 1800, wake without re-warm). **S3 mask probe: 0 px water and 0 px |ΔE| > 2/255 in the visible word boxes over 60 values of p.** p = 1: light-A ≥ 60 % outside the water. 390: dock 390×488, tier B. Reduced motion: one still, `.hr-still` shown, no GPU ms. `?gl=0`, no-`navigator.gpu` and every `?gpufail`: poster + `.hr-still`, 0 errors. `node assemble.mjs --check` exits 0 |
| **M6** | E2 (+ E1 for stream/rivulet shading) · 9 h | the pour machine in `engine/body.js`, the stream/rivulet/fill parts of `wgsl/sdf` and `shade-hero`, the pour trigger in `fx-water.js` | stream + varicose pinch, apex crown, rivulets, communicating-vessel level + slosh, virtual `warmLeft`, adaptive F, `hurry`, slow-device `formNow`, the caustic fade-in, mobile pour-on-reveal, `rv-pour-seen` | **w6**: 1440 strip at run + 0.1/0.3/0.6/0.9/1.2 s + mid-travel + at rest. **Counter log: plate share = fill ± 0.02 each tick.** **Frame-to-frame mean luminance change ≤ 2 %** around fill completion and handoff (no pop). 390 strip at handoff + 0.4/0.8/1.2/1.6 s. **→ R2 (Alberto): the formation, live in the browser pane** |
| **M7** | E1 · 5 h | `wgsl/shade-band`, `engine/scenes.js` | "after the rain" band, arrival drops, keep-out rects, tap drop, case-page lazy set | **w7**: band at 1440 and 390: 0 water px inside the padded text rects; settles ≤ 5 s; band p95 ≤ 0.5 ms; case page compiles only the band set (logged) |
| **M8** | E3 · 7 h | `tier.js` tuning, posters, final copy (after Alberto's OK), `scripts/probes/water/w8_*` | tiers, S3 DPR ladder, downgrade, device-loss re-request, poster recapture ×3, claims check | **w8**: per-pass p95 tables for `?tier=A|B|C` within §3.4 budgets; S3 ladder engages under forced load; a forced `device.destroy()` via `?gpufail=lost` → poster, then re-request → formed A. **Lighthouse mobile ≥ 80** on `/proto/rivista/index.html` (lab = the gl-off path) **and** a live run on Alberto's phone. Posters diffed against a live frame (≤ 2/255 mean). **→ R3 (Alberto): the full page, desktop and mobile** |
| **M9** | E2 · 12 h, **stretch, G4** (Q1) | `engine/mpm/**`, `scripts/port-mpm-kernels.mjs` | the §3.7 splash layer (apex crown during the pour, click splash) | a strip of a jet pinching into droplets; 0 dispatches 2 s after; 10-minute soak with no NaN and mass drift < 0.5 %/min; plate p95 during a splash ≤ 2.6 ms |
| **M10** | E1 · 6 h, stretch | `wgsl/shade-hero` (camera-inside branch), `gpu.js` HDR | the S3 dive (900→1800), HDR `extended` with the paper identical in both modes | the dive strip; no horizon or blue fill; the paper probe passes in both modes |

**Critical path:** M0 → M1 → M2b → R1 → M3 → M6 → R2 → M8 → R3, ≈ 45 h in one lane. With three lanes, committed M0–M8 ≈ 70 h ≈ 3 working days including reviews. M9 and M10 follow.

### 5.1 Reviews with Alberto (gates, not questions)

- **R1, after M2b: the look.** Six freeze-frames. **Plate and full screen × κ 0 / 0.45 / 0.8**, rules off, plus κ 0.45 with `?rules=1` (one baseline, the lensing A/B that 07 asks for). Judged live in the browser pane.
  - **This re-tests his 06-24 dislike of see-through** («il colore è il materiale»). The material read comes from Beer cobalt, bright-field rims and the softbox, not from what is behind.
  - Go/no-go before any motion is judged.
- **R2, after M6:** the formation and the first interactions, live.
- **R3, after M8:** the full page, desktop and phone, and the copy set of §4.4.

### 5.2 Kill criteria and fallbacks

| trigger | response |
|---|---|
| R1 reads as glass even at κ 0.8 | raise ρ to 0.035 C, add a slow drip under the crossbar inside breath windows. If that still fails: **GETTO mode**, about 1 day. The same `glyph.js` fields (S becomes the rest height), the same optics, caustics and composite. The body SDF switches to a heightfield lying on the floor and the camera pitch goes to 30°→50° (C's §2). Alberto chooses |
| Pour illegible at F ≈ 1.05 s | drop the rivulets and fill straight from the feet; F up to 1.2 s |
| Plate p95 over 2.0 ms after the levers | tier A caustics at 192² |
| M9 blows its budget | ship M0–M8; the analytic crown stays |

---

## 6. Verification plan

### 6.1 Where to look

| purpose | tool | notes |
|---|---|---|
| **Live judging** (motion, feel, R1–R3) | the **built-in browser pane** at `http://127.0.0.1:5178/proto/rivista/index.html` and `…/dev-water.html` | supports WebGPU; foreground only (an occluded window freezes rAF and produces phantom states). Screenshots via the pane |
| **Probes** (numbers, strips, stills) | Playwright `chromium.launch({channel:"chrome", args:["--enable-unsafe-webgpu","--enable-features=Vulkan","--ignore-gpu-blocklist","--enable-webgpu-developer-features"]})`, importing Playwright from `node_modules` (pattern of `scripts/probes/_proto_gpu_probe.mjs`) | Playwright's bundled chromium has no dxil.dll, so no WebGPU device. **Every probe first logs `adapter.info` and fails if `isFallbackAdapter`** (never judge SwiftShader) |
| **The page composite** | `page.screenshot()` after `__water.freeze()` (with `?debug=1`: `sleep(false)`, then 2 frames) | CDP screenshots can stall or miss an active WebGPU canvas (memory: *qa-screenshot-stall-webgl*); freezing removes the race |
| **The canvas itself** (exact pixels) | `__water.capture()` (renders to an `rgba8unorm` offscreen, `copyTextureToBuffer`, `mapAsync`, PNG) and `__water.readPixel(x,y)` (reads the last presented frame through `COPY_SRC`) | used for paper exactness, masks and strips |
| **Deterministic strips** | `?debug=1&manual=1`: the engine ignores the ticker and the probe calls `__water.advance(ms)` then captures | reproducible 6-frame strips independent of rAF (M4, M6). S1 timeline strips use real time with freeze-and-capture at marks |

### 6.2 Performance

- `timestamp-query` per pass; 1 s medians and p95 over 600 frames; `?tier=A|B|C` forced; `?hud=1` table.
- Screenshots of the HUD are attached to M3 and M8.
- Without the developer flag, values are 100 µs-quantised: flag that in the report.
- CPU: `performance.now()` around `tick` (≤ 0.4 ms) and the long-task observer (no task > 50 ms after DOMContentLoaded).
- Idle: a submit counter exposed on `__water.stats.submits` must stay constant 5.0 s after the last input.
- Lighthouse mobile (M8): the lab run proves the gl-off path (the engine is never downloaded: check the network log); a real-phone run proves the live path does not lag.

### 6.3 Stills (reduced motion and no GPU)

| still | how |
|---|---|
| reduced motion | Playwright context `reducedMotion: "reduce"`: no preloader, dock plate, one presented frame, `.hr-still` visible, instrument without ms, state `sleep`. Screenshots at 1440 and 390 |
| no WebGPU | `addInitScript(() => { delete Navigator.prototype.gpu; })` → `html.gl-off`, no canvas, poster v1, `.hr-still`, 0 console errors, and no request for `water/engine/*` in the network log |
| forced failures | `?gpufail=adapter` (null adapter), `?gpufail=device`, `?gpufail=pipeline`, `?gpufail=lost` (device destroyed after 3 s): the same end state, plus exactly one `console.warn` |

### 6.4 The masks (no text over water, band keep-out)

- With `?debug=1`, `__water.mask()` returns an r8 mask at half resolution: water coverage + beads + |ΔE| > 2/255.
- **S3:** the probe scrolls 60 values of p (`FX.lenis.scrollTo(y, {immediate:true, force:true})`, then waits 700 ms for scrub 0.5) and intersects the mask with the **visible** word boxes (word rect ∩ `.lk-line` mask rect, as measured today). It must be 0 px.
- **Band:** the mask ∩ the padded text rects = 0 px.

### 6.5 Numbers every probe prints (appended to the milestone commit message)

adapter vendor/architecture · tier · dpr · t_run · linked time · counterDone · handoff · ready · per-pass p95 · total p95 · submits after idle · console error count.

---

## 7. Open questions for Alberto

None of these blocks M0–M5. Q1 must be answered before M9 is scheduled, and Q2 before M6's mobile branch.

**Q1 · MLS-MPM's role (you asked to evolve that engine).** The resting letter cannot be particles: a Cormorant hairline is about 2 cells, below the solver's floor. The committed build is an exact water glyph with an analytic pour and splash. MLS-MPM comes back as a real particle splash layer (M9) for the apex crown and your click, and "particles" appears in the caption only once it runs.
- **(a)** Ship v1 without MPM, then M9 right after, off the critical path. ← **recommended**
- (b) MPM must be in v1's pour even if the review slips about 1.5 days.
- (c) Drop MPM entirely.

**Q2 · The phone preloader.**
- **(a)** A counter-only preloader, then the same pour plays in the plate as it opens, about 0.35 s after the handoff. On a 390×844 phone the plate is 44 % visible at load. ← **recommended**
- (b) A live window inside the phone preloader like desktop. This needs a float→dock swap on mobile that the contract does not support today, costs about 1 extra day, and carries a flash risk.

**Flags for approval (copy, not questions; built as TBC placeholders):**
- the label "Fig. 01 · An A of water, rendered live";
- the instrument "{rays} caustic rays · WebGPU · {ms} ms GPU · DPR {dpr}";
- the preloader "Loading · Water";
- the colophon "GSAP, Lenis, WebGPU";
- the poster alt texts;
- `.hr-still` visible under reduced motion;
- `FX.ready` ≈ +0.8 s later on the first visit (the pour).

---

## 8. Amendments (decisions by Alberto, 2026-09-18)

- **Q1 → (a).** Ship v1 (M0–M8) without MLS-MPM; M9 (the MPM splash layer: apex crown during the pour + click splash) is scheduled **immediately after v1**, off the critical path. "Particles" appears in copy only once M9 runs, and only for spawned counts.
- **Q2 → (b), overriding the recommendation.** Phones get the **live preloader window like desktop**: the S1 float window with the pour runs on 390×844 too, then hands off to the docked plate. This supersedes §1.5 "Preloader. Counter only" and the `desktop &&` guard in fx-hero's window logic. Requirements for M6 (mobile branch):
  1. The window rect on mobile is centred and sized from the viewport (≈ 88 vw × 42 svh), the A at the same world placement rules (lens shift).
  2. The float→dock swap must be **flash-free**: the engine keeps presenting into the same canvas; the swap is a re-parent + clip change done between two presented frames, with the plate's first docked frame rendered before the float canvas is hidden (double-buffer by keeping the float canvas visible until the dock canvas has presented once, or re-parent without clearing). Acceptance: a 60 fps frame strip across the swap on a 390×844 Chrome emulation shows no paper→paper-deep flash and no blank frame (mean luminance change ≤ 2 % frame to frame).
  3. Mobile budget unchanged (tier B, p95 ≤ 8 ms during the pour); the pour F on mobile = 1.10 s.
  4. Reduced motion and no-WebGPU on mobile are unchanged (still + counter-less entry).

---

## 9. Amendments after the M2b / M3 reviews (director, 2026-09-19)

Three independent reviews (look, WebGPU code, spec compliance) of the finished M2b body and the M3 caustics found that the body is implemented **to the number** of §2 and still **reads as a clear glass letter, not water**, and that two rules of this spec are internally inconsistent. The decisions below (D1–D18 of the fix batch) amend the text; where a number changes, the new number is the contract.

**Physics finding (recorded, not a bug).** With the §2.1 profile (ρ 0.026 C, T_med 0.055 C, κ 0.45) the rims are ball lenses (f ≈ 0.05 C) and the domed stem a lens of f ≈ 0.16 C, while the receiver sits 0.3–1.0 C behind at el 24°. Light through the letter has diverged 3–6× before it lands: the "light A" of §1.2 is a **soft translucent shadow with focused light only under the feet and serifs**, not bright lines. The measured offset holds (−0.30 C vs the predicted −0.32; wall drop 0.41). R1 shows this and, as the alternative, **κ 0.1** (a dome that focuses at the receiver). The bright-lines wording of §1.2 is withdrawn.

### 9.1 Caustics (§2.4)
- **Energy of dropped triangles.** The − pass writes **−(1 − Ī)** for a triangle dropped by the discontinuity test (only the physically lost share is removed; its undeflected transmitted light stays where it fell). Branch-mismatch and lost-at-start drops stay as they were. With this the energy identity holds against **RA alone** (measured −0.4 % plate, −0.7 % full, +2.2 % mobile).
- **Discontinuity test.** Defined on the **difference of the corner deflections** (new − old), not on the landing distance, with the threshold in world units: **0.05 C (= 2ρ)**, i.e. 16 / 12 / 8 texels at tiers A / B / C.
- **Atlas window.** u ∈ **[−2.4, 1.2]** (3.6 C), v unchanged, so the light A survives az up to 62° (hover clamp, S3 end). Tier-A texel stays 0.003125 C: atlases **1152×936 / 864×702 / 576×468**.
- **Light-view grid.** The orthographic plane is lifted along −L until every grid corner is above the floor; lost-at-start rays carry a flag bit and are excluded from the − pass and from the stats (no wedge at el 10°).
- **Sampling.** The shade samples the atlas with an **anisotropic footprint** (`causticDEGrad`, both axes in texels), so the foreshortened floor is not over-blurred at rest; the S3 CoC term of §1.4 is added on top later.
- **Blur.** A C1 tent (two box stages) with half-width r·√2 per stage, so its σ equals the single box of radius L_recv·tan 9°; the radius floor (0.75 texels) and the Jacobian clamp (64) are recorded in CONTRACTS.md.
- **Atlas format.** The sampled atlas is **rgba16float** with 4 mips (r16float stays for the raw splat target); the memory figure of §3.3 grows by ≈ 10 MB at tier A.

### 9.2 Body and optics (§2.1–§2.3, §2.5)
- **Black flags.** The env-band flags of §2.3 cannot reach a rim in this set (the wall 0.8 C behind the letter occludes them). The flags are therefore **set geometry seen by secondary rays only**: two vertical black flats beside/behind the letter (radiance 0.015) plus a lit-sweep limit beyond which a reflection sees the studio; primary rays keep the infinite exact paper. Numbers in CONTRACTS.md §13; `?cards=0` is the A/B.
- **Specular AA.** The normal variance is measured **across the real pixel footprint** (screen-axis displaced stencils), constants unchanged.
- **Re-entry.** A re-entered body gets the full interaction (march, TIR ≤ 2, bubbles), a superset of the cheap second level; the cost is compile time (accepted deviation: ≈ 270–300 ms cold vs the 250 ms target).
- **Beads.** Contact angle **118°** by default (a 75° cap cannot image the letter from the rest camera); base 0.035 C, bead 0 within 0.05 C of the right foot; `?beadangle=75` is the A/B. The inverted-A acceptance moves to M4 (drops).
- **Bubbles.** On the mid-plane (z ≈ 0), r 0.016 C, coverage AA and the sub-2-px impostor α of §2.1, rims lit by the key.
- **Foot contact.** Skirt at the spec numbers (outward reach ≤ 0.02 C, no flange); the wet band darkens to **×0.85–0.90** over 0.015 C along the whole contact line and AO reaches −12 % there.
- **AO.** "Normalised 5-tap cone occlusion × 0.12" replaces "× 0.3".
- **σ.** The default stays 0.36·(−ln accent_lin): Beer over the real path is measured within 0.4 % of the prediction, and the cool grey it gives the stem **is** this spec's cobalt. Whether that is enough is exactly what R1 judges: the R1 set carries σ **0.36 / 0.6 / 1.0** at the plate.

### 9.3 Engine and page
- **Masks.** Two masks: a strict one (any non-exact pixel, used by the exact-paper probe) and a **keep-out mask** at this spec's threshold (|ΔE| > 2/255, water or bead coverage, AO or wet touched) used by the host and by the S3 "no text over water" probe (§6.4).
- **Boot.** The hero shade compiles in parallel with the glyph bake (static group-3 layout first) and the caustic chunk swap costs one compile; the adapter is requested at init. Reduced motion renders its single frame with the caustic live.
- **Case pages** never request the hero modules (glyph, shade-hero, caustics); a console warning on a production page is a failure.
- **Teardown.** Plugins register a destroy hook run first by `destroy()`.
- **Debug views** `?dbg=dE` and `?dbg=wet` exist (rule 7 of §2.7).
- **Hygiene.** `.gitattributes` forces LF on `*.js`, `*.mjs`, `*.md`.

### 9.4 R1 (§5.1), restated
Judged live and on stills: plate and full × κ **0 / 0.1 / 0.45 / 0.8**, rules off, plus κ 0.45 with `?rules=1`; the σ A/B (0.36 / 0.6 / 1.0), `?cards=0`, the `ground:paper` variant, `?beadangle=75`; the M2b-only set (no caustic) beside the integrated one; the page at 1440 and 390. Framing for Alberto: a clear standing letter of water whose material read (cobalt, wet contact, the shadow) is the open question; the kill fallback of §5.2 (GETTO) stands.

### 9.5 R1 verdict (Alberto, 2026-09-20 00:30) — **go**
Set: `_shots/water-hero/r1/` (50 files) + the contact sheet `R1-tipo-d-acqua.html`. **The letter reads as water: motion goes ahead (M4, M6).** The look adopted, now the engine's and the page's defaults:
- **σ = 0.6**·(−ln accent_lin) (over the spec's 0.36): the stem measures (207, 208, 213), transmission (0.737, 0.789, 0.930) = the Beer prediction to ΔE 0; a visible cool cast, the hairline stays clear.
- **κ = 0.45** (unchanged).
- **The plate stands on the page's paper** (`ground: "paper"`, `.hr-frame` and `.gl-host` backgrounds `--paper`): no paper-deep box; the exact-paper rule now holds against (246, 243, 236) on the hero. §1.0's "paper-deep for the hero" is withdrawn; the poster recapture (M8) follows the new ground.
- **No caustic shadow on the hero.** The M3 system stays built and verified; the host and the bench load it only with `?caustics=1`. The "light A" of §1.2 and the hover rule "the light A swings across the paper" (§1.2 table) are suspended: hover still moves the key light (rims, highlights). Whether the caustic returns during the pour (M6) or under hover is a later A/B.
- **Beads at 75°** (the spec's cap) and **no flag cards** (light rims everywhere; `?cards=` re-enables them for A/Bs). §9.2's "black flags" paragraph is therefore an available variant, not the default.
- Still open after R1 (carried into M4–M8): the dotted far-edge rim on the stem's right silhouette, the 274 ms compile, the first run at 600–730 ms after `fx:built`, the inverted-A beads.

### 9.6 After M4 / M6 (director, 2026-09-21): the motion decisions D19–D32
Built as three plugins on the Hooks chunks (waves, liquids, fill; CONTRACTS §15–§17), reviewed by a motion and a code reviewer, fixed in four lanes and verified independently (R2 set in `_shots/water-hero/r2/`). The decisions, now the contract:
- **Beads (D19).** A live bead is described by its base radius and cap height, never by its sphere radius; the smin key is 0.3·base; under 0.3 px of height (or 8 % of its volume) it hands over to its wet mark through a 0.25 s fade. §1.3's "sessile cap, 75°" stands; the inverted-A promise is withdrawn at 75° (a low cap cannot image the letter from the rest camera).
- **One compile on the S1 path (D20).** The fill chunk is composed at boot when the pour module is listed (a 448 B placeholder at binding 8), so arming is a bind-group swap; the M4 chunks commit only after the pour settles; a watchdog forms the letter when the chunk is not live within 1.0 s. Measured: the stream at run + 0.10 s, settled at 2.50 s, one hero compile before the first run. §1.1's table holds with t_run ≤ 1.4 s; on this machine t_run spreads 1.10–1.48 s and the worst cold run leaves 14 ms to the 2.6 s counter cap (M8 lever: the boot compile, 340–370 ms).
- **The pour's look (D21).** Tapered rivulets on a smooth medial spline from the true apex junction, tips on the paper, the apex pool blended into the column, the varicose amplitude **0.30 r₀** within 3 λ of the impact (over §1.1's 0.45), static bubbles revealed by the level, the level from −0.01 C with volumeAt eased over 0.15 s, the floor's AO/wet ramped over 0.3 s. **Open:** the column has no highlight of its own and reads pale grey at 100 % (a shading decision: a per-liquid roughness floor or a wider key reading for the pour).
- **Seeded beads (D22)** land squashed from droplets sized to their volume and grow 2.2× with a wobble (`landVia: "static"`; the drops path behind the knob).
- **Phones (D23).** Below 1024 px the hero is one flex column (lockup · ornament · plate · sentence · CTA) so the docked letter is wholly inside the first viewport (frame 264–752 at 390×844, centre 0.60 H); §1.5's "plate at y 630" is superseded. Taste flag: the 4:5 frame leaves ≈ 165 px of paper above the apex; a 1:1 frame or a dolly to glyphScale ≈ 0.55 during the travel are the options.
- **Waves (D24).** Zero-mean tilt ramps, a tilt budget under the ±0.006 C clamp, a GPU settle machine that fades the field over 15 steps before clearing; **WAVE_DAMP 0.97** (§2.6's 0.985 gave a 1.1 s e-fold under Wallace's scheme; 0.97 gives the spec's observable 0.55 s).
- **The click (D25).** Drop r **0.04 C** (over §1.2's 0.03), 8–10 crown droplets r 0.010–0.014 C, drag 6, a crown sheet on the rim for 0.13 s. At the plate the event spans ≈ 30 px; louder is a taste knob for R2.
- **Absorbed droplets (D26)** aim at the stem's medial line; nothing vanishes. **Skip (D27)** listens on window for the whole exit. **Hover (D28)** divides by the plate's half width: ±14° at its edges. **Pour robustness (D29)**: hurry clamped [1, 3], substepped slosh, ±0.006 C. **Honest motion (D30)**: busy only on real motion; the wet stamp every 6th step; once idle, drying on 100 ms ticks (≈ 48 submits in the 10 s after the breath window, then none). **Live flags (D31)** from the active shade code. **Probes and docs (D32)** as listed in CONTRACTS §16–§17; the compile budget stays an accepted FAIL (340–370 ms with the pour chunk, target 300).
- **R2** (§5.1) is put to Alberto on the choreography and the honest motion; the pour's material (the column's highlight) is the first polish after it.

### 9.7 R2 verdict (Alberto, 2026-09-22 00:15)
- **The pour: "bene, ma prima la colonna."** The choreography (stream, rivulets, communicating-vessel level, formation, the phone's live window and exit) is approved; the **material of the column and the rivulets** (pale grey, no highlight of its own) must be solved **before** M7/M8. Target: the stream and the rivulets read as water at 100 % — a highlight of their own, depth by thickness, the cool cast of the body, no white plastic — and the rivulet trail reads as wet paper.
- **The click: louder.** A splash that reads at 100 %: larger drop and droplets, a higher crater ring, a brighter rim specular; the 350 ms cooldown and the honest-motion rule stay.
- **Phone composition: as it is** (the letter centred in the 4:5 frame with air above; the name below).
- **Hover: wider** (the light's excursion up to ±25° at the plate's edges, clamps of §1.2 kept). **Scroll: visible** (the tilt must read at the plate: raise the tilt budget to the §2.6 ceiling and let the highlight swing; the ceiling and slope of §2.6 stay the anti-artifact floor).

### 9.8 R2b, the polish, and its verdict (2026-09-22)
Two lanes, verified independently (`_shots/water-hero/r2b/`, `R2b-colonna.html`); commits `a4a531c` (feel) and `a418c3b` (column).
- **D33 The column's optics.** The fill chunk records the liquid kind at every SDF evaluation and answers `fillOptics(alpha) → (alpha, horizon dip, card top)`; the pour's liquids get a fixed per-kind roughness (stream 0.05, rivulet head 0.08, crown droplet 0.12), read the studio down to 6° below the horizon, and the rivulet head is a bulb of at least r + 0.007 C; the letter keeps its own shading (rest shade pixel-identical). Measured: a 1 px highlight thread on the column (+12 % over its body on the best row, +8 % median), bulb heads; **at 100 % the column stays pale**: a 0.036 C clear rod reflects F0 = 2 % and cannot carry the stem's cool cast (its Lab b +1…+2 vs the stem's −5), the trail stays ×0.94–0.97. The per-kind flag cards (dark edges seen only by paths through the pour's liquids) are built and OFF.
- **D34 The click.** SPLASH presets (d25 / forte / **molto** = default): drop r 0.05 C, 12–14 crown droplets r 0.016–0.022 C at 60–75° and 1.3×, drag 4, crater radius 0.08 C with the ring impulse at the §2.6 ceiling, sheet 0.18 s / lift 0.05 C, 8–10 beads of base 0.024–0.038 C; the §1.2 numbers (0.03 C drop, 6–10 droplets) are superseded.
- **D35 Hover** azGain 25 / elGain 14 (§1.2's 14 / 8 superseded), clamps kept: the stem's highlight band swings 6.5–8.7 px at the plate.
- **D36 Scroll** tilt budget 0.9 × the ceiling, gain 0.027 (one notch fills it): the tilt reaches 0.006 C for ≈ 0.3 s, the highlight band swings ≈ 3 px; **the 6 px target is off the table under §2.6** (a 2° tilt).
- **Alberto's verdict (00:50):** **the column as it is, go ahead** (the cards stay off; no further round); **the click "molto" stays**; **the scroll shimmer is accepted** (no §2.6 exception, no scroll-coupled light). §9.7's precondition is closed by decision, not by physics: recorded as such.
- Carried forward: CONTRACTS §15.1 (`fillOptics`), §16.4–16.5 (setSplash / setTiltGain / the R2 numbers), §17.1 (misc.w = packMaterial, setMaterial) still need their lines; w6's two informational keys should move out of `report.pass`; the bead early-out bound in drops.wgsl.js is a lower bound of the true distance, not of the cap SDF (harmless by construction, wording to fix); the bubble rims flicker by single pixels after a scroll (pre-existing).

### 9.9 R5, 2026-10-11, by delegation: the letter's presence at rest
Alberto delegated the choice («si per tutto, fai tu. dev essere perfetto»); the director decided on lane PRES's crops (`_shots/water-hero/viva/PRES/look/`). The contract is CONTRACTS §22.15.
- **The decision.** The hero A is drawn at rest at scale **0.58** with **σ = 1.0**·(−ln accent_lin), no flag cards, κ 0.45 unchanged: what `?presence=1&sigma=1` showed. For the page this supersedes §9.5's σ 0.6 and the resting scale 0.46 as the DRAWN scale. The stage scale still runs 0.46 → 0.95 and the S3 mapping is rebased on it, so the full-screen letter is the same; the engine's own constants are untouched (the page sends the set).
- **The reason.** At 0.46 / 0.6 the letter was a ghost on the paper: mean letter-to-paper contrast 1.13 at the plate, at full screen and on the phone. Scale 0.58 with σ 1.0 measures 1.228 at the plate (lane PRES) with 24 dark-edge pixels: a clear tinted body with no drawn edge, clean at full screen. The flag cards were left out because they draw the edge (298 dark pixels at the plate, and at full screen a grey band that eats the key streak).
- **The cost** is the scale, not the tint: a plate click measured 2.33–2.41 ms p95 against the 2.6 budget (lane PRES, three rounds, tier A, DPR 1.5); σ costs nothing. Not re-measured for R5.
- **Behind flags, unchanged:** `?presence=0` is the R2b look, kept for the comparison; `?presence=2` is the default plus the flag cards (an A/B); the click crown (`?water=viva`, `mpm`) and the dive (`?dive=1`) stay lab flags.
- **The stills follow.** The reduced-motion still and the poster (`fx-plate-v1.webp`, recaptured with `w8_posters.mjs`) are now the same letter as the live one at rest: the rest pose, the new tint, the new size. Until R5 both were drawn with the rig at g 0.73 (a turned letter with dark edges), because the dock's fit scale was passed as the stage scale; R5 fixes that with the default.
- **With it:** the pour race fix (`pour.js`: the boot bindings are read from the layout that was built, and the swap waits until every one of them is there; under network latency the plate could fall to the poster).
- Alberto can overturn any of it: the previous look is one URL away.
