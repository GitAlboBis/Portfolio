# 46 · Direction HYBRID, "Tipo vivo": the exact A is the skin, MLS-MPM is its water

> Lead WebGPU creative technologist, 2026-10-09. One direction argued as well as it can be argued, then its risks.
> Inputs read: `30-hero-build-spec.md` (§0–§9, R1/R2/R2b verdicts), `CONTRACTS.md` (§0–§21), the engine
> (`public/proto/rivista/water/engine/**`: `sdf.wgsl.js`, `drops.wgsl.js`, `index.js`, `tier.js`), the old solver at
> `444681b` (`p2g_1`, `p2g_2`, `updateGrid`, `g2p`, `mls-mpm.ts` constants), the archaeology dossier `45`, the
> rejected proposal B (`_refs/hero-water/21-proposal-B-mpm-hybrid.md`) and the panel's objections to it (spec §0.4–§0.5),
> `_refs/hero-water/05-taste-history.md` and `07` (A3, A4), the shot sets `_shots/water-hero/r1`, `r2`, `r2b`,
> `_shots/rivista-motion/r3/home-d`, and the Golden Hour captures `_shots/webgpu/1-initial-1440.png`,
> `_shots/liquidswap/dive-f2.png`.
>
> **Measured for this document** (no GPU work, CPU only): the reservoir volumes below come from the baked glyph SDF
> `public/proto/rivista/water/assets/a-sdf-1024.png` with the §2.1 profile model
> (`scratchpad/water-eval/hybrid_volumes.py`). Sanity check: model letter volume **0.01604 C³** vs the engine's
> measured **0.01696 C³** (w1), −5 %. Every GPU millisecond in this file is an **estimate** until H0/H4 timestamps.
>
> Units as the contract: C = 1 = the ink height of the A. Plate = 1440×900, `glyphScale` 0.46, C = 223 px.

---

## 0. The thesis in one paragraph

The approved letter does not change. The exact Cormorant A (§2.1 body SDF, Hausdorff ≤ 0.5 px, R1 "Acqua, si va
avanti") stays the **rest shape and the optical surface**. Inside it lives a real **MLS-MPM fluid**, the WaterBall
kernels Alberto asked for on 2026-06-25, now held by the letter's own SDF instead of three capsules. The particles are
**invisible while they sit inside the letter**, and they **become the surface wherever they leave it**: the renderer
traces `smin(f_body, φ_particles)` in the same ray march, with the same Fresnel, refraction, TIR and Beer. So the
resting frame is **bit-identical** to today's R2b plate (and the posters stay true without a recapture), while every
motion is real water: a finger drags a ridge through the stem, a click throws the letter's own water into a crown that
rains back or beads on the paper, a scroll sloshes the volume, and the pour's impact and run-down are particles that the
level actually counts. When the motion ends, the exact contour comes back by construction, and the GPU goes to zero.

**What it is, concretely:** ≈ 33,000 particles on desktop, ≈ 9,900 on phones (counts computed in §3.2), a 110×95×40 grid at
h = 0.012 C (2.7 px per cell at the plate), a density brick traced in the existing shade through one new hook line, and
a sleep rule that makes all of it cost **0 ms at rest**.

**What it is not:** it does not bring back the Golden Hour world, the capsule letter, SSF, perpetual churn, or a
resting surface made of particles. Those are the four things that sank the old A and proposal B.

---

## 1. Why this direction, against the record

### 1.1 What each past A got wrong, and what the hybrid does instead

| failure (where it is recorded) | cause | hybrid |
|---|---|---|
| Sausage/balloon sans A (Golden Hour, job order; dossier 45 "unfinished" 1–2) | 3-capsule medial axis, `halfW` 5, fill at 2.67× tube volume | The letter is the exact glyph SDF; particles only fill an **inset** of it (§3.2), at ρ/ρ0 = 1 |
| SSF needles, «effetti sullo schermo orribili» (2026-06-27) | sparse sheets splatted as velocity-stretched impostors in screen space | No SSF. A world-space density field, B-spline filtered, traced by the same sphere tracer; loners below the iso are not drawn |
| Moiré, dithered highlights (job-order still; spec §0.5 rejecting B) | NDC depth precision, fill noise turned into normal noise | The rest surface is never particle-derived. **Rest identity: 0 differing pixels** vs the R2b shade is an acceptance probe (H1) |
| Honey motion, never signed off (b4de047 "DA FINIRE", 540cb50) | Tait γ 5, ν 0.45, dt 0.13 frame-locked | γ 1, k 50, ν 0.08 (Splash / spec §3.7), fixed 60 Hz with 1–3 substeps |
| Perpetual churn, GPU never idle, no WCAG 2.2.2 answer | WaterBall's inflate force by design | Sleep: rest damping after 1.5 s of quiet, hard freeze at 5.0 s; the frozen reservoir is inside the SDF, so freezing is invisible |
| A pop on reform (the drain re-seeded the letter) | the shape was the particles | The shape is the SDF; nothing re-seeds on screen |
| Mobile cropped, never tested | no tier | Tier B/C constants (§3.8), same effects at fewer particles |

### 1.2 The 2026-09-18 panel's objections to an MPM hybrid (proposal B), answered one by one

| objection (spec §0.4/§0.5) | why it does not apply here |
|---|---|
| "Fill noise becomes normal noise: the moiré that sank the job-order still" | B rendered the resting letter from a column-fill skin blended with density. Here the brick is **sampled only inside the AABB of particles that breach the inset wall**; at rest that AABB is empty, `ext4.x = 0`, and `particlesSDF` returns `f` before any texture tap. The rest shade is the R2b shade, byte for byte |
| "Four coupled representations, ≈ 66 MB" | Two new ones: particles and the grid (with the brick sampled from the grid's density). Tier A adds ≈ 16.6 MB (§3.2) |
| "The serif snap is a φ cross-dissolve, the morph trick 07 A4 warns against" | No cross-dissolve anywhere. The pour keeps the approved **level cut** (G6); the level is now driven by delivered particle mass |
| "MPM φ ∪ SDF is fat and lumpy during the pour, then pops at the absorb" | Particles below the level are **inside** the cut body, so the union hides them by construction: there is no absorb event to pop. During the pour the particle field is clipped to the mould, so the silhouette stays the type even when the inside churns |
| "Speed cap 12 cells/step overflows the fixed point, breaks CFL" | CFL ≤ 0.8 cell per substep, enforced on the GPU. Node momentum ≤ 16 (ppc 8, 2× compression) × 5 = 80 ≪ 214.7 at 1e7 |
| "Hairlines are under-resolved in the sim" | Accepted and designed around: the hairline is 0.0195–0.041 C wide (measured, p5–p50), i.e. 1.6–3.4 cells, so it holds **no particles**. It is pure SDF, and its motion is the M4 face waves. Particles never have to hold a hairline |

### 1.3 The one-sentence reason to build it

The current A won R1 on its look and R2 on its choreography, and its remaining weakness is exactly what Alberto names
on 2026-10-09: it is not *alive*. Its splash is 12–14 identical analytic spheres, its scroll answer is a 3 px shimmer
because the heightfield is capped at 0.006 C (D36: "the 6 px target is off the table"), and nothing inside the letter
ever moves. The hybrid is the only direction that keeps every approved frame and makes the motion physically real.

---

## 2. What the reader sees and feels

All times from the events named; all numbers are tier A at the plate unless stated.

### 2.1 Arrival (S1 preloader, desktop 1440×900, first visit)

| t | today (R2, approved) | hybrid |
|---|---|---|
| 0.00 | window opens on dry paper | same |
| 0.10 | the analytic column enters (r₀ 0.018 C, varicose λ 9 r₀, D21) | **same column**: above the grid it stays analytic (CFL, §3.6) and keeps the approved D33 material |
| 0.25 | impact: 3–5 analytic crown droplets, 2 seeded beads | impact: the column's flux turns into particles at the apex (≈ 275 per 60 Hz step). A ragged crown of 300–800 particles sprays in slow motion; most fall back; 2 clumps land and become the two seeded beads **because they landed** (floor histogram → `landBead`) |
| 0.25–0.45 | two analytic rivulets race down the inner lines | **right leg:** the water itself runs down the stem channel inside the invisible mould, a clear moving volume bounded by the type's contour; **left (hairline) leg:** the D21 analytic rivulet stays (no particle channel exists there, 1.6–3.4 cells) |
| 0.45 → 0.25+F | level rises in both legs (communicating vessels) on a clock | level rises in both legs, **driven by the delivered mass** × ledger L (§3.6), EMA 0.1 s, monotone. Above the level, the particle layer sloshes; below it, the exact body |
| end | 3-drop pinch, last drop rings the apex | same analytic pinch; the last drop's impact is particles |
| handoff | 1.1 s xio travel, lateral tilt on the face waves | the window's acceleration is also a body force on the particles still moving (≤ 0.6 s ring-down) |

The counter 75 → 100 then reads water that actually arrived (G11, `warmLeft = 90·(1 − fill)`, fill from the mass
ledger). If the `mpm` pipelines are not live by the impact (t_run + 0.25 s), a watchdog runs the **R2 analytic pour
end to end**: the visitor sees the approved pour, never a broken one.

### 2.2 Rest

Pixel-identical to `_shots/water-hero/r2b/page_rest_1440_plate_2x.png`: the domed cobalt-cast stem, the clear
hairline, the foot meniscus, the 75° beads, the two bubbles. After the 5.0 s breath window: 0 submits, as today.
The instrument (hybrid flag only) reads, for example, "33,104 particles · WebGPU · {ms} ms GPU · DPR 1.5"; the count is read from
the engine at seeding and the ms token is omitted when null, as today.

### 2.3 Hover

The pointer is still the key light (D35: ±25° of azimuth at the plate edges, clamps 12–62° / 10–40°). New, and gated
(§8 R-H1): a pass faster than 400 px/s **across the letter** is a draft on the water. The face highlight wobbles along
the path, and 2–3 tracer micro-bubbles (r 0.006–0.010 C, 1.3–2.2 px) in the stem drift with the flow for about 1 s,
then rise and pop at the top surface. Slower hover moves only the light, so sersan's rule "the pointer is the light"
still holds at reading speed.

### 2.4 Press and drag: a finger through the water

This upgrades the §1.2 row "press + drag across the body", today a heightfield dent, into real flow.
- A ridge of water up to 1 cell high (0.012 C: **2.7 px at the plate, 5.5 px at full screen**, about 2× the
  heightfield's 0.006 C ceiling) travels with the finger along the stem's face, with a wake of ripples behind it.
  Inside, the flow turns around the finger and carries the tracers.
- Dragging outward past the rim faster than 0.7 C/s tears water out: a rivulet necks into clumps that bead on the
  paper. This is the G9 "pull a serif out, it heals" made physical, at the stem and the feet. The hairline keeps the
  analytic tendril.
- On release the ridge sinks back; the exact contour returns within **2.5 s** (probe H3), and the motion stops within 5 s.

### 2.5 Click

The approved "molto" drop (r 0.05 C, 0.32 s slow-motion fall, D34) is kept. At impact:
- Its volume becomes ≈ 2,400 particles. The ≈ 1,500 particles of the letter's own water within 0.08 C of the hit get
  the impact impulse (cone 60–75°, 1.3 C/s, D34's numbers). The crown is therefore **the drop plus the letter**, not
  12–14 identical spheres: 15–40 droplets of mixed size, some still joined by necks for a few frames.
- Droplets that fall back on the letter re-enter it. Their momentum through the surface is fed to the face waves
  (§3.5 skin flux), so **each one rings where it lands**.
- 6–10 droplets land on the paper and become the approved analytic beads, with their wet marks and drying.
- The drop's own volume overflows: ≤ 1 small bead at the nearest foot, about 0.6 s later.
- The crater dent and the crown sheet (D25/D34) stay as they are. The contour is exact again at +2.5 s, with 0 submits
  at +5.0 s apart from the D30 drying ticks.

### 2.6 Scroll

A wheel notch is a body force on the reservoir (`a = −clamp(0.015·Δv, ±0.6) C/s²` along the page's motion). The water
lags, the stem's upper surface bulges toward the trailing side, and the highlight swings **≥ 6 px at the plate**. That
is the R2 ask «Scroll: visible», which D36 had to give up at about 3 px under the §2.6 ceiling. A hard flick (≥ 2× a
notch) throws 1–3 droplets off the apex, and they bead. In S3 the camera orbits exactly as today; the same physics
runs in world space, and the engine sleeps at scroll 1800.

### 2.7 Phone (390×844, tier B, dock)

- **The live preloader window** (spec §8 Q2 (b)) gets the same particle impact and stem flow (≈ 9,900 particles,
  h 0.016 C ≈ 2.9 px).
- **Tap:** the same particle splash (≈ 1,000 + 1,000 particles).
- **Scroll:** slosh.
- **No hover and no press-stir**, because touch drag is page scroll: an input difference, not an effect difference, as
  §1.5 already rules for the tendril.

### 2.8 Reduced motion and no WebGPU

- **Reduced motion:** the `mpm` module is never requested. The still is the rest frame, bit-identical.
- **No WebGPU:** the poster is unchanged; the engine and the `mpm` module are never downloaded.
- **MPM failure** (pipeline or WGSL error): a non-fatal `module` event, and the page runs exactly today's R2b
  behaviour.

---

## 3. Engine design

### 3.1 Three rules that make it safe

1. **Rest identity.** With the reservoir seeded and asleep, the composed shade with the `mpm` module equals the shade
   without it: **0 differing pixels** at the plate, full screen and mobile (the w2 `identical` harness).
2. **Visibility by breach.** A particle shows only when it pushes past the inset wall, either as a bulge (inside the
   outer half-cell of the body) or as free water. Inside, it is hidden by the union.
3. **Strictly additive.** Every hybrid motion has the approved analytic version as its automatic fallback: D34 crown,
   R2 pour, M4 drag dent. No pinned signature changes; the contract additions are listed in §3.9.

### 3.2 Representations and memory (computed from the glyph SDF, `hybrid_volumes.py`)

Inset wall δ_w = 1.5 h. That leaves 0.5 h for the iso and 0.5 h for the smin key k, so a particle cloud resting against
the wall has φ ≥ h at the body surface, and `bodySmin(f, φ, k)` returns `f` exactly.

| tier | h (C) | px/cell plate · full · dock | reservoir volume (% of V_L) | ppc | **reservoir particles** | cap | grid cells | substeps (events / pour) |
|---|---|---|---|---|---|---|---|---|
| A | 0.012 | 2.7 · 5.5 · — | 0.00712 C³ (42 %) | 8 | **≈ 33,000** | 40,000 | 110×95×40 = 418 k | 2 / 3 |
| B | 0.016 | 3.6 · — · ≈ 2.9 | 0.00509 C³ (30 %) | 8 | **≈ 9,900** | 12,000 | 83×72×30 = 179 k | 2 / 2 |
| C | 0.020 | 4.5 · — · ≈ 3.6 | 0.00340 C³ (20 %) | 6 | **≈ 2,500** | 5,000 | 66×57×24 = 90 k | 2 / 2 |

The stroke widths measured on the ridge (full width, C) are p5 0.0195 · p50 0.041 · p95 0.153. The stem and the
thick serif joins hold the particles; the hairline, crossbar and fine serifs are SDF-only.

| buffer / texture | format | tier A | tier B |
|---|---|---|---|
| particles `{pos, state, v, age, C}` | storage, 80 B (WaterBall struct + 2 packed u32 in the pads) | 3.2 MB | 0.96 MB |
| grid `{vx, vy, vz, mass}` | storage, 4×i32 fixed point 1e7 | 6.7 MB | 2.9 MB |
| frozen-island mass (the clear value of sleeping cells, §3.4) | storage, i32 | 1.7 MB | 0.7 MB |
| density splat | storage, i32 | 1.7 MB | 0.7 MB |
| **brick** (φ_est, vx, vy, vz) | `texture_3d<f32>` **rgba16float**, storage-write + filterable in core | 3.3 MB | 1.4 MB |
| floor histogram (landing) | storage, 32×16 bins × 4 i32 + 3 MAP_READ staging buffers | < 0.01 MB | < 0.01 MB |
| tracers | storage, 12 × vec4f | — | — |
| **added** | | **≈ 16.6 MB** (≈ 22 + 10 MB today) | ≈ 6.7 MB |

### 3.3 The solver (port map from `444681b`, constants)

`scripts/port-mpm-kernels.mjs` strips the `.wgsl.ts` files from `git show 444681b:src/webgl/waterball/mls-mpm/*`
(Node 22 `stripTypeScriptTypes` + a specifier rewrite) into `engine/mpm/wgsl/*.wgsl.js`. `src/webgl/waterball/**` is
never touched.

| kernel | from the old code | change |
|---|---|---|
| `clearGrid` | verbatim | the clear value is the frozen-island mass (0 when nothing sleeps) |
| `p2g_1` | verbatim (27 cells × 4 atomics, APIC `Q = C·dist`) | skips frozen particles |
| `p2g_2` | verbatim stencil | EOS `pow(ρ/ρ0, 5.) − 1` → **`ρ/ρ0 − 1`**, k 3 → **50**, clamp `max(−0., …)` → **`max(−0.1·k, …)`** (weak tension: cohesive clumps and necks; MLS-MPM has no surface tension), ν 0.45 → **0.08** |
| `updateGrid` | normalise + zero the 2-cell boundary | **deletes** the SSF-depth mouse raycast; **adds** gravity 12 C/s² (slow motion, spec §3.7), the stir force (§3.5), the scroll body force, the click/pour impulses from a step-indexed uniform ring |
| `g2p` | the APIC gather and advect (old L50–101) verbatim, `C = B·4` | **deletes** the confinement, inflate, leash, explode, un-stick and box walls (old L103–209); **adds** the soft SDF wall, state flags, the skin flux, the floor histogram, the CFL clamp |
| `copyPosition`, `spawnParticles` | — | dropped (the duplicate dispatch was a bug, `444681b`) |

**Units and clock.** Positions in grid cells, the fixed 60 Hz step of §3.6 split into n substeps, with
`n = clamp(ceil(v_max·Δt_step / 0.8h), 1, n_max)` decided by the event schedule (step-indexed, so deterministic):
- tier A: Δt = 1/120 s gives v ≤ 1.15 C/s at CFL 0.8; 1/180 s gives 1.73 C/s;
- the "molto" crown speed of 1.04–1.82 C/s gets 2 substeps, clamped on the GPU at 0.8 h per substep.

**Fixed point.** Node mass ≤ 16 (ppc 8 at 2× compression); momentum ≤ 16 × 5 cells/sim-time = 80 < 214.7.

**Determinism.** Integer atomics are associative, so P2G sums are order-independent. The simulation is bit-identical
across runs on one GPU, and 60 Hz and 120 Hz produce identical states at equal step indices (G18). Seeds use mulberry32
over (particle index, event id).

### 3.4 Body → particles: the letter holds its water

- **The container is the body SDF itself.** `g2p` binds groups 1 (glyph) and 3 (body), which are already visible to
  COMPUTE, and calls `bodySDF(p)` from the `sdf` chunk composed with `sdfHookDefaultsWGSL` (the rest body), exactly as
  the floor bake and the caustic trace do. That is 5 texture taps per particle per substep.
- **Soft wall** for a particle with `f_b > −δ_w`:
  `v −= n · k_w · (f_b + δ_w) / Δt · hold`, and the outward normal velocity is removed when `hold = 1`.
  - `hold = 1 − smoothstep(0.35, 0.70, v·n)` in C/s: **the wall is as soft as the water is fast**. This is b4de047's
    speed-gated hold, the behaviour Alberto lived with for two months, made exact.
  - Stirring at reading speed stays inside; an impact or a fast drag breaks through.
- **States.** `bound` (f_b < 0), `free` (f_b > 2h: no wall, gravity only), `guest` (drop-injected particles, retired
  when they re-enter), `frozen`, `retired`. Particles that leave the grid fly ballistically (positional integration,
  no MPM) until they land or re-enter.
- **Sleep, the WCAG 2.2.2 rule (G15).**
  - After 1.5 s without input: `v *= 0.97` per substep.
  - A cell whose speed stays below 0.01 h/Δt for 30 steps freezes: its particles stop stepping, and their mass is
    baked into the frozen-island clear value.
  - At 5.0 s after the last input everything freezes, whatever its speed. This is invisible, because frozen particles
    are inside the SDF.
  - Then `setBusy("mpm", false)` and **0 dispatches**.
  - Frozen islands are also the main performance lever: only the event region steps.

### 3.5 Particles → surface, pointer → particles: the two-way coupling

- **Bulges (geometry).** A particle that crosses into the outer half-cell of the body moves the union surface outward,
  by up to ≈ 1 h. That is real geometry, so it is **not** bounded by §2.6's heightfield ceiling.
- **Skin flux (waves).**
  - **What is summed.** For bound particles with `f_b ∈ [−δ_w − h, −δ_w + h]` on the faces (|n_z| > 0.7), `g2p`
    `atomicAdd`s the normal velocity `v·n` into a front/back i32 buffer on the wave grid (128×112 at tier A).
  - **How it enters the waves.** The wave step adds `η += c_s·Σ(v·n)/Σw·Δt`, with c_s = 0.5, under the unchanged
    0.006 C clamp and slope 0.25.
  - **What it gives.** Flow under the surface ripples the face before any particle breaches, and droplets that re-enter
    ring where they land.
  - **Contract.** One additive API in `waves.js` (§3.9).
- **Pointer to grid (the stir).**
  - **Where it acts.** The hit is `internals.input.hit()` refined to the front face with T. Its pointer velocity is
    unprojected at the face depth, in C/s, clamped to 1.2. Grid nodes within R_s = 0.06 C (5 cells) and 0.08 C of
    depth get `Δv = k_s·w(r)·(v_ptr − v_node)`. This is velocity matching, not a force spike, so nothing is flung.
  - **Strength.** Press-drag k_s 0.35 per substep. Hover k_s 0.08, and only above 400 px/s (R-H1).
- **Tracers.**
  - **What they are.** ≤ 12 micro-bubbles, entrained at the stir point when the stir speed exceeds 0.5 C/s, advected
    by the grid velocity sampled in `g2p`'s pass, rising at 0.15 C/s, and popping at the top surface with 1 ring.
  - **How they are drawn.** The shade's existing bubble ray–sphere code (silver TIR rims) reads them from a storage
    buffer.
  - **What they give.** They are the honest cue of flow *inside* clear water: you only see moving water through what
    it carries.
- **Landing, re-entry and conservation.**
  - **Landing.** Free particles below y = 0.5 h outside the body go to a 32×16 floor histogram. The CPU reads it at
    10 Hz without awaiting `mapAsync`. A bin with ≥ 20 particles in 0.2 s becomes `drops.landBead({x, z, r =
    ∛(3V/4π)})`, and those particles retire. Single landers evaporate (counted in `stats`).
  - **Re-entry.** A particle that re-enters the body becomes `bound` again (guests retire).
  - **Retired mass.** It is re-seeded invisibly inside the body, on the rest lattice, while the region is asleep.
  - **Honest note.** The letter's volume is the type's, not the particles'. The ledger is visual: **an overflow bead
    leaves, and the reservoir is topped up out of sight.**

### 3.6 The pour

- **The column stays analytic above the grid.** The approved column is ≈ 3.5 C/s at the impact under g = 12 C/s². At
  h = 0.012 that needs 5 substeps per 60 Hz step, so particles take over **at the impact**: the column's flux is
  injected at the apex, clamped to the CFL speed. A fully particle column (r 0.04 C, mass-true) is an A/B (R-H4).
- **Flux.** Q = π(0.018)²·3.5 = 3.56·10⁻³ C³/s, i.e. ≈ 275 particles per step at tier A, about 17,000 over F ≈ 1.05 s.
- **Mould.** The inset body is the container. The stem channel is (0.153 − 2δ_w) wide × (0.110 − 2δ_w) thick
  ≈ 0.117 × 0.074 C, about 10 × 6 cells, so particles flow down it under gravity. During S1 the particle field is
  clipped to the mould (`max(φ, f_b)`), so nothing pokes out of the contour except impact spray.
- **Level ledger.** `y_f = V⁻¹(min(1, L·M_delivered / V_L))`, with V(y) the existing LUT and EMA 0.1 s.
  - L = V_L / (Q·F) ≈ 0.01696 / 0.00374 = **4.5** at tier A.
  - That is the fiction R2 already approved (a thin column fills the letter in about 1 s), now **quantified and
    printed in `stats.pour.ledger`**, not hidden.
- **Hidden seeding.** The rest of the reservoir (≈ 16,000 particles) is seeded on the lattice *below* the level as it
  rises, hidden by the cut body.
- **Watchdog.** If set `mpm` is not live by t_run + 0.25 s, the R2 analytic pour runs end to end (`pour.js`
  `impactVia: "analytic"`). The same applies with `?mpmfail=1`.

### 3.7 Rendering: the union in the same trace

**Splat and resolve** (one timed pass, `mpm:brick`, only when something breaches or flies):
1. **Breach box.** An atomic min/max of the cells of breaching and free particles, padded by 3 cells, is written into
   an indirect-dispatch args buffer.
2. **Splat.** A quadratic B-spline density splat (27 i32 atomics) of every particle inside that box. Bound particles
   are included, so the iso is right at the breach.
3. **Resolve over the box only.**
   - The density is smoothed by one binomial 3³ pass.
   - The brick then stores a narrow-band distance estimate,
     `φ = h·(iso − ρ̃) / max(|∇ρ̃|·h, 0.25·iso)`, clamped to [−1.5 h, +4 h] (iso = 0.5 ρ0), plus the grid velocity
     in yzw.
4. **Box to the shade.** The box goes to the shade through `MpmRender` (binding 11), and `ext4.x` = 1 while it is
   non-empty.

**Hook K2b**, one added line in `bodySDFWith` (between the skirt smin and `liquidsSDF`):
```wgsl
f = particlesSDF(p, f, smoothProfile);   // K2b: MPM water that breached the inset wall (stub: return f)
```
```wgsl
// chunk "particles" (mpm.js): @group(3) @binding(9) mpmBrick : texture_3d<f32> (rgba16float), @binding(10) mpmSamp,
// @binding(11) var<uniform> mpmR : MpmRender  (boxMin, boxMax, brickOrigin, invBrickSize, h, iso, k)
fn particlesSDF(p : vec3f, f : f32, smooth : bool) -> f32 {
  if (frame.ext4.x == 0.0) { return f; }                                   // rest: zero taps
  if (any(p < mpmR.boxMin.xyz) || any(p > mpmR.boxMax.xyz)) { return f; } // outside the breach box
  let uvw = (p - mpmR.brickOrigin.xyz) * mpmR.invBrickSize.xyz;
  let phi = select(textureSampleLevel(mpmBrick, mpmSamp, uvw, 0.0).x,      // march: 1 trilinear tap
                   mpmBspline8(uvw), smooth);                              // normals: 8-tap cubic B-spline
  return bodySmin(f, phi, mpmR.k);                                          // k = 0.5 h
}
```

**Optics.** The union surface goes through the unchanged `heroShade`: exact Fresnel at n 1.333, refraction, ≤ 2 TIR
bounces, Beer over the real inner path (a crown droplet's interior is a real path), the paper and floor lookups,
coverage AA and Kaplanyan specular AA (the normal variance comes from the B-spline field).
- No new lobe, no foam colour, no dispersion.
- Crest foam and aeration exist only as knobs, off (Alberto 2026-06-24: foam on crests only, no full-body whitening).

**Lipschitz.** φ_est can exceed slope 1 in poorly sampled spots. The existing step scale 0.75 covers up to 1.33. The
`holes` view must read 0 on the scripted splash frames (H1); if it does not, the step scale drops to 0.6 when the
particle term won the min (a private flag).

**What the hybrid removes from the shade.** In the click state the 12–14 analytic crown capsules leave the `liquids`
loop; they were the costliest term at full screen (§19.3: "the crown droplets in the SDF: A full 3.9"). One brick tap
replaces an O(n) loop.

### 3.8 Tiers

| | A | B | C |
|---|---|---|---|
| h · ppc · reservoir · cap | 0.012 · 8 · ≈ 33 k · 40 k | 0.016 · 8 · ≈ 9.9 k · 12 k | 0.020 · 6 · ≈ 2.5 k · 5 k |
| click: drop particles + letter share | 2,400 + 1,500 | 1,000 + 1,000 | 450 + 450 |
| substeps events / pour | 2 / 3 | 2 / 2 | 2 / 2 |
| tracers | 12 | 8 | 6 |
| brick | grid res, rgba16float | same | same |

As §3.5 rules, no effect is removed at any tier. The DPR ladder and the downgrade (§19) already re-allocate per tier
without shade compiles; `mpm` re-seeds on a tier change while asleep.

### 3.9 Plug-in points (additive to CONTRACTS; to be written as §22)

| where | addition |
|---|---|
| `index.js` | `KNOWN_MODULES.mpm = ["./mpm/mpm.js", "./mpm/wgsl/*.wgsl.js"]` (plugin); `DEFAULT_PARTICLES_WGSL` stub `fn particlesSDF(p : vec3f, f : f32, s : bool) -> f32 { return f; }`, registered like K1–K3 |
| `wgsl/sdf.wgsl.js` | the one K2b line above; `"sdf"` requires `"particles"` (stub → w2 `identical` 0 px) |
| group 3 | 9 brick, 10 sampler, 11 `MpmRender` uniform, 12 tracers (storage, read). Fragment storage buffers: 2 of 8; sampled textures: 8 of 16 |
| Frame | `ext4 = (mpm live 0/1, h, iso, k)`; ext4 is the last free slot (§15.2) |
| `internals.mpm` | `{ live, count, eject({x,y,z,r,n,v,coneDeg}), inject({x,y,z,vx,vy,vz,rate}), stir({x,y,z,vx,vy,vz,r,k}), bodyForce(ax, ay), seedRest(), ledger, info, readState(), whenReady }` |
| `waves.js` | `internals.waves.addSource(buffer)`: the skin-flux buffer read in `csWave` with gain c_s (0 when absent) |
| `drops.js` | `crownVia: "mpm" | "analytic"` (mpm when `internals.mpm.live`) |
| `pour.js` | `impactVia`; the right rivulet off when mpm is live |
| `wgsl/shade-hero.wgsl.js` | the bubble loop also reads ≤ 12 tracers from binding 12 behind a flag (stub: none) |
| `tier.js` | `mpm: { h, ppc, cap, substeps, ejectN, tracers }` per tier |
| `gpu.js` | nothing: pipeline set `"mpm"` is already reserved |
| host `fx-water.js` | `HERO_MODULES` + `"mpm"` only under `?water=hybrid` (H6); the instrument's `{n} particles` token behind the same flag |

---

## 4. Performance

### 4.1 This machine (AMD Radeon RX 7800 XT, rdna-3, Windows, Chrome), p95 GPU ms

"Today" is measured (CONTRACTS §13.5, §19.3, default set, caustics off). "Hybrid" is an **estimate**.

**Sim cost model.**
- WebGPU-Ocean (matsuoka-601, same kernels) states "~100,000 particles on integrated graphics" at 2 steps per frame.
  Assuming the sim takes at most half of a 16.7 ms frame, that is ≈ 40 µs per 1,000 particle-substeps on an iGPU.
- This dGPU is taken as 5–8× faster: 5–8 µs per 1,000 particle-substeps.
- Phones are taken as 2–4× slower than an iGPU on atomics: 80–160 µs.
- Frozen islands step only the event region, ≈ 5–8 k particles at tier A.

| state | budget | today | hybrid (all particles step) | hybrid (frozen islands) |
|---|---|---|---|---|
| A plate rest / idle | ≤ 2.0 | 0.32 / 0 | **0.32 / 0** (identical) | same |
| A plate hover draft | ≤ 2.0 | ≈ 0.5 | 0.7–1.0 | 0.6–0.8 |
| A plate press-drag stir | ≤ 2.0 | ≈ 0.6 | 0.9–1.3 | 0.7–0.9 |
| A plate click (worst today) | ≤ 2.0 | **1.31** | 1.6–1.9 | **1.2–1.5** (the crown loop leaves the shade) |
| A S1 window, pour | ≤ 2.0 | ≤ 1.31 | 1.7–2.1 | 1.4–1.7 |
| A full g = 1, click | ≤ 5.0 | **3.93** | 3.9–4.6 | 3.5–4.1 |
| A full g = 1, slosh | ≤ 5.0 | ≈ 1.2 | 1.8–2.6 | 1.5–2.0 |
| B dock (this dGPU), click | ≤ 8 | 0.75 | 1.0–1.4 | 0.9–1.1 |
| MPM per click, tier A | — | — | 74 k particle-substeps → 0.37–0.6 | 16 k → 0.08–0.13 |
| splat + resolve | — | — | 0.03–0.10 | same |
| CPU per frame | ≤ 0.4 | — | +0.05 (uniform ring, histogram read at 10 Hz, no allocations) | same |

### 4.2 Phones (tier B, budget p95 ≤ 8 ms)

- **Shade.** The spec's phone estimate for the dock is 3–5 ms.
- **MPM per tap.** 24 k particle-substeps at 80–160 µs per 1,000 gives **1.9–3.8 ms**; frozen islands bring it to
  **0.6–1.3 ms**.
- **Total during a tap.** 4–6.3 ms, at rest unchanged.
- **Unknown.** This is the weakest number in this file: phone atomics have never been measured on this engine, and
  Alberto's real phone is the only judge (M8's live run).
- **Levers, in order:**
  1. frozen islands (built by default);
  2. 1 substep on B with the crown speed clamped at 0.96 C/s;
  3. the B cap down to 6 k;
  4. the downgrade to C (2.5 k).

### 4.3 Compile and boot

- **Set `mpm`.** 7 compute pipelines (clearGrid, p2g1, p2g2, updateGrid, g2p, splat, resolve). The M0 cold compile of a
  small compute pipeline is 33–45 ms, so ≈ 0.25–0.32 s serialised in Dawn's workers, off `CrGpuMain` (§21: compiles
  never hold a swap).
- **Not on the critical path.** On a pour visit the set starts right after the hero shade; on other visits it starts
  at `linked` + idle.
- **Before the set is live,** a click runs D34 and the pour runs R2.
- **The hero shade** gains the K2b stub (≈ 0 ms) and, under the flag, the particles chunk: est. +20–40 ms on the
  364 ms boot compile, which is already an accepted FAIL against 300 ms.

### 4.4 Fallbacks and stills

- **Reduced motion:** `mpm` is not requested; one presented frame, identical to today's (`w5_still`).
- **No WebGPU:** `gl-off`, the poster, and no request for `water/engine/*` or `mpm/*`.
- **Posters** `fx-plate-v1/v2/v3.webp` need **no recapture**: the rest frame is identical, and the probe proves it
  (mean diff 0).
- **Device loss:** recovery (§19.2) re-seeds the reservoir at rest (`seedRest`); it never re-pours.
- **Lighthouse:** the gl-off lab path is unchanged (86 / 92 median).

---

## 5. Honesty: what becomes true, and what is never printed

| claim | status with the hybrid |
|---|---|
| "{n} particles" in the instrument (flag only until R-H) | **true**: n = live count read from the engine (reservoir + free), e.g. 33,104 on tier A. Measured fit: the 51-character string "65,536 caustic rays · WebGPU · 1.2 ms GPU · DPR 1.5" sets in 2 lines at 1024 (spec §4.4); "33,104 particles · WebGPU · 1.4 ms GPU · DPR 1.5" is 48 characters |
| "MLS-MPM" (case study, colophon) | **true**: the water's motion is solved by MLS-MPM on the visitor's GPU |
| CV "120,000-particle fluid" | was **never** true (74,403). The new true figure is the seeded count printed by H0 (≈ 33 k desktop). Tell Alberto to use that number or none |
| "simulation" for the resting letter | **never**: the rest shape is designed (the type), the motion is simulated |
| "the pour fills the letter with simulated water" | **never**: the level ledger is × 4.5 (§3.6) and is printed in stats, not in copy |
| "real caustics" | still **not** true: caustics are off on the hero since R1, and with `?caustics=1` the trace sees the rest body only, not the particles |
| "sun glints" | never (studio softbox) |
| "Still frame captured from this engine." | stays true: the rest frame is identical, verified by H1 |

The `check-claims` gate is unchanged: no static number enters the copy; every number is read from the engine.

---

## 6. Why Alberto, quote by quote

**What it answers:**
- **2026-09-18:** «il logo in 3d della A fatta di acqua era nella giusta strada. mancava solo perfezionamento e lavoro
  aggiuntivo per creare un esperienza bella, e super realistica». The hybrid is literally *that* engine (the WaterBall
  MLS-MPM kernels, ported line for line) given the right letter and finished.
- **2026-10-09:** «avevo prima un effetto in webgpu super realistico, ma che era da completare». It closes, item by item,
  the old HANDOFF's "DA FINIRE" list:
  - cohesion: the tension clamp;
  - the spray layer: particles in flight;
  - sleeping;
  - a mobile tier;
  - a crisp recompose: the exact SDF;
  - the slow-motion feel: g 12 C/s² with ν 0.08, not honey.
- **2026-06-25:** «implementa perfettamente waterball ma al posto della ball una A». The kernels are verbatim where
  WaterBall is physics (P2G/G2P/APIC); only the forces that made the sausage go.
- **2026-06-27** (paraphrase, 540cb50): "a radial slow-motion splash that recomposes". The click is exactly that, with
  real mixed-size droplets, and the recompose is exact.
- **2026-06-27:** «effetti sullo schermo orribili» (the spiky white explosion). No SSF, no stretched impostors, no white
  foam: droplets are traced iso-surfaces with the letter's own optics.
- **2026-08-25:** «sono le particelle che si illuminano in movimento che fanno la linea illuminata». The particles are
  the truth, shown exactly when they move, the family of his 48,000-particle sersan wordmark.
- **2026-07-14:** «troppo artificiale, dev'essere tutto realistico». No procedural noise and no perpetual sine: every
  added motion is solved.
- **R2, 2026-09-22:** «Scroll: visible» and "the click: louder". The hybrid reaches the 6 px swing D36 had to give up,
  and a crown with real volume.
- **2026-09-09:** Lusion on the iPhone «identico a quello desktop … non lagga». Same effects on tier B at about a third of
  the particles.
- **R1, 2026-09-20:** «Acqua, si va avanti»; **R2b:** the column, the click "molto" and the shimmer accepted. All of it
  is kept frame for frame: the hybrid spends none of the approvals already won.

**What it risks:**
- **2026-10-09:** «adesso c'è un altro stile, ma non so se lo preferisco ora come ora». The hybrid answers "da
  completare" (the motion), **not** "un altro stile" (the pale, clear, small-plate look). If his doubt is the look
  itself (scale, saturation, the full-bleed drama of the Golden Hour A), this direction alone does not fix it. Those
  are separate knobs (resting `glyphScale`, σ, environment) for a separate R-gate.
- **Sersan's rule "the pointer is the light"** and spec §0.2 "the cursor … never deforms the letter", plus 07 A3's
  warning that drops following the pointer are the jquery.ripples cliché. The hover draft breaks the letter of that
  rule. It is gated (R-H1): press-drag is the primary stir, and the hover draft is off with one flag.
- **2026-06-24:** foam only on crests, no full-body whitening. Aeration stays off by default.
- **R2's approved pour.** The right rivulet becomes particle flow inside the mould. That is a visible change to a
  signed-off beat, so it is A/B'd (R-H4) and falls back to R2 automatically.

---

## 7. Risks (ranked) and kill criteria

1. **Rest identity breaks.**
   - **Risk.** A stale brick texel, a non-empty breach box at rest, or a residual jitter that keeps particles past the
     wall, and the job-order moiré is back.
   - **Guard.** The H1 probe (0 px at plate, full and mobile, after 600 idle steps and after a click + 6 s).
   - **Kill.** If the probe cannot reach 0 px, the brick renders **free particles only** (f_b > 2 h) and bulges are
     dropped: the stir then shows through waves and tracers only.
2. **Particle surfaces read as grain or jelly at 2.7 px cells** (5.5 px at full screen). MLS-MPM has no surface tension;
   the tension clamp can over-clump (tensile instability) or leave crumbs.
   - **Guard.** B-spline normals, the iso and k knobs, `?dust=0`, 4× crops at H2.
   - **Kill.** The click reverts to the D34 analytic crown, with particles only as the secondary spray.
3. **The stir is invisible, or reads as a cliché.**
   - **Invisible:** a 2.7 px ridge and 1.5 px tracers at the plate may simply not register.
   - **Cliché:** the hover draft may read as the 2013 ripple effect.
   - **Guard.** R-H1 with numbers (the band swing in px).
   - **Kill.** Press-drag only.
4. **Phone performance is unmeasured.** Atomics on Adreno/Mali are 2–4× slower by assumption; the tap estimate is
   4–6.3 ms against an 8 ms budget. Levers as in §4.2; the final check is Alberto's phone, live.
5. **Lipschitz and holes in motion.** φ_est is not a true distance: silhouette holes or false hits on fast droplets.
   - **Guard.** `holes` = 0 on scripted frames; the step scale drops to 0.6 inside the breach box.
6. **Compile and boot.** About 0.3 s of extra Dawn compile. On a slow first visit the particle pour may often fall
   back to the analytic one, so most first visitors could see R2, not the hybrid pour. Measured at H0/H5, never
   assumed.
7. **Honesty bookkeeping.**
   - **What is not physical.** The level ledger (× 4.5), guest particles retiring, and the reservoir topped up out of
     sight.
   - **Why it is acceptable.** Each is documented and printed in `stats`, and none is put in copy.
   - **Where it could still surface.** It is a risk only if a future caption over-claims "simulated".
8. **Shared hot files.** The K2b line in `sdf.wgsl.js`, the tracer loop in `shade-hero.wgsl.js`, `waves.js`, `drops.js`
   and `pour.js` are all owned by earlier lanes. One integration owner merges them in a fixed order (§9); each edit is
   additive and behind a stub.
9. **Sleep never reached.** A pressure solver under gravity jitters, which would breach G15.
   - **Guard.** Rest damping plus the hard freeze at 5.0 s, invisible inside the SDF.
   - **Probe.** 0 dispatches by 5.0 s after the last input.
10. **The taste mismatch of §6.** The work can be excellent and still miss what Alberto doubts. That is why the
    hybrid ships behind a flag next to today's A (§10), never instead of it, until he chooses.

---

## 8. The R-H gate (for Alberto when he is back; not a question now)

| item | A | B | default |
|---|---|---|---|
| R-H1 hover | light only | light + draft > 400 px/s | B, at low gain |
| R-H2 click | D34 analytic crown | particle crown (drop + letter water) | particles |
| R-H3 scroll | today's shimmer (3 px) | slosh (≥ 6 px) + flick droplets | slosh |
| R-H4 pour | R2 analytic | particle impact and stem flow, analytic column (L 4.5) · option: particle column r 0.04 C | particle impact |
| R-H5 dust | loners hidden | loners as ≥ 1 px beads | hidden |

---

## 9. Build plan (agent lanes in git worktrees, each with its own static server)

**Setup.**
- **Integration branch.** `feat/water-hybrid` off `feat/water-hero`. One worktree per lane, at
  `C:\Users\alber\Desktop\pw-hyb-<lane>`, each serving `public/` with
  `python -m http.server <port> --bind 127.0.0.1`:
  - S (sim) on 5181;
  - R (render) on 5182;
  - I (interaction) on 5183;
  - P (pour) on 5184;
  - H (host, A/B and probes) on 5185.
- **Probes.** Headless only (`scripts/probes/water/lib.mjs launch()`), real Chrome channel, the adapter asserted
  non-fallback, `RV_BASE` pointing at the lane's port.
- **Merges and commits.** The director merges in milestone order; no lane pushes. Each lane commits atomically per
  milestone; the director commits the integration.

| M | lane · est. | files (disjoint) | deliverable | acceptance probe |
|---|---|---|---|---|
| **H0** sim core | S · 8 h | `scripts/port-mpm-kernels.mjs`, `engine/mpm/mpm.js`, `engine/mpm/wgsl/*`, `water/dev/mpm.html`, `scripts/probes/water/h0_mpm.mjs` | ported kernels with §3.3 changes, soft SDF wall, states, sleep, step-indexed event ring, `registerPass` (phase "step", ONE timed pass "mpm"), seeding (count printed), `?dbg=particles` (bench only) | seeded count printed per tier; 600 idle steps → **0 dispatches by step 300**; scripted impulse → NaN 0, count conserved, max \|v\| ≤ 0.8 h/substep, every particle back inside f_b < −δ_w by +2.5 s; **particle-buffer hash identical across 2 runs and 60 vs 120 Hz drives** at step 600; 10-min soak no NaN; cold compile of set "mpm" logged per pipeline |
| **H1** brick + union | R · 10 h | `engine/mpm/brick.js`, `engine/mpm/wgsl/brick.wgsl.js`, `particles` chunk, **1 line** in `wgsl/sdf.wgsl.js`, stub in `index.js`, `h1_*.mjs` | breach box + indirect args, splat, resolve, K2b hook, bindings 9–11, ext4, `?dbg=phi` | **h1_identity: 0 differing px** with mpm vs without at plate / full / mobile, at rest and 6 s after a click; **h1_holes: holes 0 / false hits 0** on 6 scripted frames × yaw −25…+15°; shade p95 delta inside the box ≤ +0.3 ms plate / +0.8 ms full |
| **H2** click | I · 10 h | `drops.js` (`crownVia`), `engine/mpm/landing.js`, `h2_click.mjs` | drop → particles at impact, letter-water ejection, landing → beads via the histogram, re-entry → skin flux, guests and overflow bead, analytic fallback | 8-frame strip at 60 ms + 4× crops: **≥ 10 distinct droplets at +180 ms**, ≥ 4 beads by +1.2 s; at +2.5 s **0 px outside the bead/wet keep-out** vs rest; 0 submits at +5.0 s apart from D30 drying; w4 burst (17 taps in 7 s) plate p95 ≤ 2.0 ms |
| **H3** stir + slosh | I · 8 h | `engine/mpm/stir.js`, `waves.js` (`addSource`, additive), tracer loop flag in `wgsl/shade-hero.wgsl.js`, `h3_stir.mjs` | press-drag and hover draft, scroll body force, skin flux, tracers | scripted press-drag at 0.6 C/s across the stem: **highlight band displacement ≥ 6 px** at the plate (D36 today ≈ 3), tracer travel ≥ 0.05 C, rest identity within 2.5 s of release; wheel notch: swing ≥ 6 px; flick ≥ 2× notch: ≥ 1 apex droplet, a notch: 0 |
| **H4** sleep, tiers, perf | S + H · 6 h | `engine/mpm/islands.js`, `tier.js` (`mpm` fields), `h4_perf.mjs` | frozen islands, tier constants, ladder and downgrade feeding, loss re-seed, set ordering | per-pass p95 tables A/B/C × rest / hover / stir / click / pour / S3 **within §4.1 budgets**; `w8_loss` passes with mpm (recovery re-seeds, no re-pour); reduced motion: no `mpm/*` request in the network log; `w5_case`: no mpm on case pages |
| **H5** pour | P · 10 h | `pour.js` (`impactVia`), `engine/mpm/pour-mpm.js`, `h5_pour.mjs` | impact injection, stem-channel flow, mould clip, mass ledger level, hidden seeding, watchdog | the w6 phases on the hybrid: **counter = fill ± 0.02** (mass-driven), frame-to-frame luminance change ≤ 2 % at fill end and handoff, phone pour at 390 (Q2 (b) window); `?mpmfail=1` → **w6 `identical` to R2**; boot: one hero compile before the first run (D20) |
| **H6** A/B + R-H set | H · 6 h | `fx-water.js` (flag), `fx-hero.js` instrument token behind the flag, `_shots/water-hero/rh/RH-tipo-vivo.html`, CONTRACTS §22, HANDOFF | the flag, the comparison sheet, the docs | every existing probe green with the flag **off** (no regression); w5 / w6 / w7 / w8 green with it **on**; clean console at 1440 and 390 |

**Critical path:** H0 → H1 → (H2 ∥ H3) → H4 → H5 → H6, ≈ 46 h in one lane, ≈ 32 h wall-clock with lanes I and P in
parallel. A review and fix batch after H3 and after H5 (motion and code reviewers, 8 h) brings the total to **≈ 66 h**.

---

## 10. A/B plan (side by side with today's A, never instead of it)

1. **Flag.** `index.html?water=hybrid` adds `"mpm"` to `HERO_MODULES` and the `{n} particles` instrument token. It is
   persisted in `sessionStorage` (`rv-water`) so the S4 / S5 cuts and the band keep it. `?water=` with any other
   value restores today's A, which stays the default.
   - Sub-flags: `&stir=press|draft`, `&click=analytic|mpm`, `&scroll=shimmer|slosh`, `&pour=analytic|mpm|column`,
     `&dust=1`.
2. **Dev page.** `water/dev/hybrid.html`: one engine with key `H` toggling `mpm` live. Because rest is identical, the
   switch is seamless and the difference shows only in motion, which is the point.
   - **Scripted beats on keys 1–6:** drag, click, notch, flick, pour, phone.
   - **HUD:** per-pass ms, the particle count and the ledger.
3. **Comparison sheet** `_shots/water-hero/rh/RH-tipo-vivo.html` (the R1 / R2b sheet format).
   - **Pairs:** current | hybrid strips for each beat: rest, hover, press-drag, click, wheel notch, flick, pour, S3 at
     g = 1, phone tap, phone pour. Each at 1440 and 390, with 4× crops.
   - **Proofs:** the per-pass ms table and the H1 identity diff image (all black, 0 px) beside the rest frames.
   - **R-H table:** §8 at the top with its defaults.
4. **Live links in the sheet** for the browser pane (foreground, WebGPU): `…/index.html` vs `…/index.html?water=hybrid`.
