# 46 · Direction "REVIVE": the fluid comes back, and it holds the Cormorant A

> Lead WebGPU creative technologist, 2026-10-09. One direction, argued as well as it can be argued, then its risks.
> Read before writing: `45-old-fluid-a-dossier.md` (the archaeology), `30-hero-build-spec.md` §0–§3, §5, §8–§9 (the
> contract and Alberto's R1/R2/R2b verdicts), `public/proto/rivista/water/engine/CONTRACTS.md` §0–§21 (the engine),
> the old kernels at `main` (`src/webgl/waterball/mls-mpm/{clearGrid,p2g_1,p2g_2,updateGrid,g2p}.wgsl.ts`),
> `_refs/hero-water/{02,04,05,07,21}`, and the shots `_shots/water-hero/{r1,r2}`, `_shots/rivista-motion/r3/home-d`,
> `_shots/webgpu/1-initial-1440.png`, `_shots/liquidswap/{dive-f2,intro-dive-a}.png`.
>
> Nothing was run: no Chrome, no dev server, no GPU. **Measured** numbers carry their source. Everything else is an
> **estimate**, to be replaced by `timestamp-query` numbers at V1/V2. Units: C = 1 = the A's ink height
> (CONTRACTS §0). Plate C = 223 px, S3 full screen C ≈ 460 px, phone dock C = 180 px.

---

## 0. TL;DR

1. **Thesis: the vessel is the type, the water is real.** The resting shape of the A is the engine's exact Cormorant body
   (the R1-approved SDF, contour to 0.1 texel). That body becomes an invisible **vessel**, and it is filled with
   **≈100,000 MLS-MPM particles** (WaterBall's kernels, the ones Alberto asked for in June) at rest density. Every
   departure from rest is real fluid: stir, splash, droplets, beads, the recompose, and the S3 "exhale" in which the
   whole letter lets its water go in a slow radial bloom and gathers itself back.
2. **The hairline problem, solved honestly.** Particles never draw an edge. The vessel draws every edge, and the
   particles decide only **whether the vessel is full there** (a capacity-normalised fill read from the solver's own
   grid mass). A Cormorant hairline is 2.35 cells at tier A, below the kernel's 3-cell floor. It holds water, empties
   and refills as a unit, and ripples through its face waves, but it never sloshes by itself. The doc states this plainly,
   with numbers (§4.5).
3. **At rest it is pixel-identical to today's R1 letter.** When the solver sleeps with the vessel full, the new hook
   returns the rest body unchanged. The posters, the reduced-motion still and the no-WebGPU path stay truthful with
   **zero** re-capture, and the anti-moiré argument of spec §0.5 does not apply.
4. **What changes is life.** It is the effect side that Alberto remembers as «super realistico» (45 §5). The engine is
   2.4× finer than the old A in each axis (cap height 112 cells vs 46). It holds 1.35× the particles of the old A
   (100,105 vs 74,403), with no balloon: 4 per cell at rest density instead of the old 8, the 2.67× overfill. It uses no
   SSF, sleeps to 0 dispatches, keeps phone parity at 36k particles, and prints a real particle count in the caption.
5. **Cost.** ≈ 70 h in three lanes, shipped behind `?water=fluid` beside the current "Tipo d'acqua" for a three-way A/B
   (old `main`, current, revived). Tier A on this RX 7800 XT, estimated: sim 1.0–1.7 ms while active, 0 at rest. Plate
   p95 ≤ 2.6 ms while active (M9's number). S3 bloom ≤ 5.0 ms with the DPR ladder. Phones ≤ 8 ms with a time-scale
   ladder that slows the water instead of removing anything.

---

## 1. The direction in one page

### 1.1 What "revive" means here (and what it refuses)

| | Path 1 of 45 (resurrect as was) | Path 2 of 45 (M9 splash brick) | **This direction** |
|---|---|---|---|
| solver | WaterBall MLS-MPM, frozen tuning (γ 5, visc 0.45, dt/frame) | WaterBall kernels, Splash constants, local 64×64×32 brick | WaterBall kernels, Splash constants, **the whole letter** on a letter-aligned grid |
| who holds the letter | 3 capsules (a sans balloon) | the SDF; MPM "never represents the resting letter" (§3.7) | the SDF is the **vessel**; MPM is **the water in it** |
| particles | 74,403 at ρ/ρ0 2.0 | 2,048 per event | **100,105** in the letter (tier A), 36,481 (B), 18,679 (C) |
| render | SSF over a DOM sea | density iso-surface clipped outside the body | grid-mass field, `max(vessel, fill)` ∪ free water, **inside the same trace and optics** |
| world | sunset cubemap, sea video | rivista studio + paper | rivista studio + paper (no sea, no sun, no horizon) |
| life | perpetual churn | crown + click only | stir, click, drag, pour, **S3 exhale/inhale**; still ≤ 5 s after input (G15) |

It refuses three things from the old hero: the letterform (capsules), the renderer (SSF: front depth only, refraction at
infinity, NDC moiré, needles), and the world (sunset, sea, teal). It keeps the solver, the particle count class, the
splash-and-recompose behaviour, the slow motion, and the full-screen moment.

### 1.2 Why this is not B ("FONDERIA"), which the spec rejected

Spec §0.5 rejected B for three reasons. This direction answers each one:

- **"Fill noise becomes normal noise" (the job-order moiré).** At rest the solver sleeps, and the hook returns the
  vessel field **unchanged**, so the normals are the R1 normals, bit for bit. While it is awake and the vessel is full,
  `max(vessel, φ_fill)` selects the vessel at the surface, so the surface normals are still the vessel's. The fill field
  shapes the surface only where water is really missing: holes, the pour's free surface, spray. Those regions are in
  motion, which is where normal detail is wanted.
- **"Four coupled representations (≈ 66 MB)."** This direction has two: the particles and the transient grid. The render
  field *is* the grid's own mass channel, resolved once per frame, so there is no second splat. The total is 60 MB at
  tier A, 22 MB at B and 12 MB at C, allocated lazily on the first wake and only on the home page.
- **"The serif snap is a φ cross-dissolve, the morph trick 07 A4 warns against."** Nothing cross-dissolves. The shape
  is never a blend of two shapes. It is one vessel that is either full or not, and fullness is a physical quantity (mass
  divided by capacity).

---

## 2. What the reader sees (frame by frame)

### 2.1 Arrival (desktop ≥ 1024, first visit; S1 timeline of spec §1.1 unchanged)

- **Default (`?water=fluid`).** The approved pour runs as today: the analytic stream, rivulets and level of R2/R2b,
  because the column's material was signed off by decision (§9.8). The solver is seeded at rest under the formed letter
  and takes over invisibly when the pour settles, at the same moment M4's held commit lands (D20b). The first frame
  after the swap is pixel-identical (§4.4).
- **A/B `?pour=mpm` (V4).** The water under the level is real.
  - At the apex impact, a slow-motion crown of ≈ 300 particles opens; 2 droplets land as beads.
  - ≈ 1,500 bound particles slide down the lower walls of both legs under gravity: the rivulets, now physical.
  - The level is **metered**. Particles are spawned in the vessel slice just under the scheduled `y_f(t)` (taken from the
    V(y) LUT), so the counter still reads the fill exactly (G11). The level's surface is the particles' own free surface.
    When the window travels 1.1 s xio to the plate, its screen acceleration becomes a lateral body force, and the level
    **really sloshes** in both legs.
  - The stream pinches (analytic, unchanged), and the last drop rings the apex as particles.
  - **Capillary lock:** 0.6 s after the fill, the bound fluid's gravity fades to 0 (the capillary regime: B §1, Bond
    ≈ 0.5). The water stops, the solver sleeps, and the letter is the R1 letter.
  - It becomes the default only if `w5_bootsplit` keeps t_run ≤ 1.4 s on the worst cold run (§7 risk 4).

### 2.2 Rest

- Pixel-identical to the R1/R2 letter: a clear Cormorant A on the page's paper, the σ 0.6 cobalt cast in the stem, the
  hairline clear, foot menisci, 2 beads, a bubble (`r1_full_k0.45.png`).
- The caption gains one token, read from the engine: **`100,105 particles · WebGPU · 0.3 ms GPU · DPR 1.5`** (§6).
- 0 submits 5.0 s after the last input (G15).

### 2.3 Hover

- **Slow pointer:** exactly R2b. The key light follows the pointer (±25° at the plate edges), highlights crawl along the
  rims, nothing deforms, and the solver stays asleep (0 sim cost).
- **Fast sweep across the letter** (≥ 600 CSS px/s with the pointer's ray inside the body; the same gate B used for its
  draft): **the stir.** In the grid update, every node within 0.06 C of the front-face hit (the §2.6 wave floor) gets
  `(1 − d²/r²) · 0.6 · v_cursor`. v_cursor is the CSS-px velocity unprojected onto the view plane at the hit depth, so
  HiDPI bug A8 cannot recur.
  - What it looks like: the stroke under the pointer dents and rings (the existing wave impulse, paired dent and bow
    wave). Where the outward normal speed passes 0.5 C/s in the rim band, **300–2,000 particles tear off** along the sweep
    direction. They arc in slow motion (gravity 12 C/s², speeds capped at 1.0 C/s), round off into droplets (the cohesion
    clamp, §4.3), and either fall back into the face (each re-entry rings it) or land on the paper as beads (R1's 75° caps,
    8 s drying).
  - **The dent heals:** 5 % overpressure pushes water back into the hole, the attraction brings the strays home, and the
    stroke closes in ≈ 1.5–2.5 s.
  - The resting bubble drifts on the water's **real current** while it moves (SHOULD, §4.6).
  - Still again ≤ 5 s after the last move. `?stir=0` is the A/B for the sersan rule "pointer as light, not force" (§7).

### 2.4 Click / tap on the letter

- The "molto" splash (D34) becomes physical. A drop of r 0.05 C (≈ 2,940 particles at tier A) falls from 0.6 C above
  the hit at ≤ 1.0 C/s, which is slow motion, since the analytic drop falls in 0.32 s. The impact makes a crater, a
  **real crown** (whatever the momentum ejects; molto's 12–14 droplets of r 0.016–0.022 C are the tuning target, not a
  script), rings on the face, and beads on the paper.
- The letter keeps the drop's water and returns to its capacity through the mass ledger (§4.3). Cooldown 350 ms,
  ≤ 1 drop in flight.
- On the paper: unchanged (the analytic bead of D22).

### 2.5 Press + drag through the body (desktop)

A capsule obstacle (r 0.02 C) follows the traced pointer inside g2p and parts the water. A wake of droplets is shed
behind it, and the stroke heals. This is B's "finger through the water" built on the real fluid, replacing the analytic
dent pair. The M4b "pull a serif out" tendril stays analytic.

### 2.6 Scroll (wheel)

The approved shimmer: the wave tilt at the §2.6 ceiling (D36). The solver stays asleep, so scrolling costs no sim time
(the R3/R4 lesson: nothing heavy runs inside a reader's scroll).

### 2.7 S3 "Otturatore" (desktop, 300 svh): the exhale and the inhale

| scroll | g / p | what happens |
|---|---|---|
| 0 → 540 | p 0 → 0.60 | as today: approach, dolly, orbit +8° → −18° (spec §1.4). TUVERI leaves its mask |
| 540 → 900 | g 0.72 → 1 | **the exhale.** A release field `e = io(g)` ramps 0 → 1. The vessel lets go (all particles free by e = 0.3), then each gets an outward target velocity of 0.6 C/s from the centroid (0, 0.5, 0), +0.25 C/s upward, plus a hashed divergence-free curl drift (deterministic). Gravity drops to 6 C/s², so the water hangs. ≈ 100k particles spread into a bloom ≈ 1.6 C wide (≈ 740 px at full screen): thousands of droplets, each a lens of the cove paper, with cobalt deepening only where they gather (Beer over the real path, σ 0.6). Ligaments and sheets form from cohesion, never needles |
| 900 | p = 1 | the bloom hangs: droplets drift and fall slowly, highlights crawl under the breath light |
| 900 → 1260 | pinned | **the inhale.** `e` → 0 and the attraction switches on. The water flies back in real flight, re-binds as it enters the vessel, and the exact A **closes from the feet up**. The last 10 % fills by overpressure. The Now sheet's edge is still in the lower 40 % of the screen, so the recompose is seen |
| 1260 → 1800 | pinned | the Now sheet rises over a formed, still letter; `sleep(true)` at 1800 (as today) |
| back up | — | it exhales again at 1260 → 900 and gathers at p 0.6. Forces follow scroll position, the flight is physics: never the same twice, never a pop (the old drain re-seeded, U8) |

- The **text-over-water rule** holds by placement: the exhale starts only at p ≥ 0.60, where TUVERI is fully masked
  (spec §1.4). The `w5_mask` probe runs over the bloom.
- The light-A side-by-side ending of §1.4 was suspended at R1 (no caustic on the hero), so S3's end beat is free. M10
  "the dive" stays a separate stretch and can follow the inhale.

### 2.8 Phone (390×844, tier B, D23 composition "as it is")

- **Same scene, fewer cells.** 36,481 particles at h = C/80 (2.25 px per cell at C = 180 px).
- Same pour in the live preloader window (Q2 → b) and the same tap drop (a real splash, real beads). Scroll shimmer as
  approved.
- Two absences, each an input or contract difference, not a removed effect: no hover stir (touch has no hover), and no
  S3 (contract: desktop only). A plate-local exhale/inhale coupled to the plate's scroll-out is offered behind
  `?bloom=plate` and measured on Alberto's phone before it is proposed.

### 2.9 Reduced motion / no WebGPU / case pages

- **Reduced motion:** the MPM module is never loaded. The still is today's still (rest = identical).
- **No WebGPU:** today's poster (`fx-plate-v1.webp`), still literally "captured from this engine" because the rest frame
  did not change.
- **Case pages:** the band "after the rain" is unchanged, and `mpm` is never requested there (`HERO_MODULES` only).

---

## 3. Why Alberto (dated quotes)

### 3.1 The quotes it answers

| date | quote (verbatim unless *paraphrase*) | how this direction answers |
|---|---|---|
| 06-24/25 | «implementa perfettamente waterball ma al posto della ball una A» | WaterBall's `clearGrid` and `p2g_1` verbatim, `p2g_2`/`updateGrid`/`g2p` ported with Splash constants. The ball becomes **the exact A** |
| 06-27 | *paraphrase* (540cb50): the burst «was a downward rush, not a splash»; he wanted a radial slow-motion splash that recomposes | the S3 exhale/inhale and the click: radial, slow (≤ 1.0 C/s, 12 C/s²), recomposing in real flight |
| 06-27 | «effetti sullo schermo orribili» (the spiky white explosion) | no SSF (the needles were SSF on sparse sheets, 45 U3), round droplets from cohesion, no white: foam stays out, the only tint is Beer cobalt |
| 07-01 | *paraphrase* (0f41ed3): the water and reflection perfect, the orange contours unwanted | single IOR 1.333, no dispersion, no coloured rims (spec §2.7 rule 6), env-only specular |
| 07-14 | «pieno controllo, lasciami a bocca aperta» · «continua a migliorare e aggiungere cose bellissime animate» | the bloom: the whole letter as ≈ 100k droplets hanging across the screen, then closing back into the Cormorant A |
| 07-14 | «troppo artificiale, dev'essere tutto realistico» | every motion comes from a solver. No procedural sky, noise, or scripted droplet counts |
| 08-25 | «avevamo detto di farlo in particelle» · «sono le particelle che si illuminano in movimento che fanno la linea illuminata» | particles appear exactly when they move: spray, ligaments and droplets catch the softbox. At rest they are invisible water |
| 08-28 | «troppo veloce … fai tutto piu lento e smooth» | CFL-capped slow motion and a slowed gravity. The weak-device ladder slows time rather than dropping frames |
| 09-03 | «non è fluida l'animazione, ma meccanica» | no tween drives the water; even the S3 exhale is a force field, not a scrub |
| 09-09 | phone «identico a quello desktop … non lagga» · «senza utilizzare quel cerchio 2d orribile come fallback» | tier B = the same scene at 36k particles, no 2D stand-in. The lag is measured on his phone at V6, not assumed |
| 09-18 | «il logo in 3d della A fatta di acqua era nella giusta strada. mancava solo perfezionamento e lavoro aggiuntivo per creare un esperienza bella, e super realistica» | literally this: the same engine, with the letter fixed (vessel) and the renderer fixed (trace), and the experience built around it (pour, stir, S3) |
| 09-18 | sersan: «ho creato la mia faccia in 3d con particelle, loghi in webgpu a strati … allo stesso livello» | a 100k-particle letter (sersan's wordmark is 48k), with the count printed from the engine |
| 09-20 | R1 «Acqua, si va avanti» | the R1 rest look is kept **pixel for pixel** |
| 10-09 | «avevo prima un effetto in webgpu super realistico, ma che era da completare» | it completes the old DA FINIRE list: spray layer (U9), cohesion and sleeping (U10), mobile tier (U11), GPU timing (U12), fixed dt and seeds (U13), A8 (U14), moiré (U15), weight on the page (U16, through the existing beads, AO and wet contact) |

### 3.2 The quotes it risks

| date | quote | the risk |
|---|---|---|
| 10-09 | «adesso c'è un altro stile, ma non so se lo preferisco ora come ora» | **At rest this IS the current style.** If his doubt is the still look (small, clear, glassy) rather than the missing life, this direction alone does not answer it. Offered knobs, not defaults: `?sigma=1.0` (deeper cobalt, an R1 A/B value) and `?scale=0.58` (the rest A 26 % taller; the light-A clipping that kept 0.46 is moot since caustics are off on the hero) |
| 06-24 | «il colore è il materiale» | the old teal saturation does not return. Thin droplets are nearly colourless and only thick clumps tint cobalt. Physically right on paper, but less "colour" than he remembers |
| sersan habit (03 §0) + 08-21 | the pointer as a **light**, not a force; «le animazioni … con lo scroll, non con il cursore» | the hover stir is a cursor-driven deformation. It is speed-gated and A/B-able (`?stir=0`) |
| 06-27 | «effetti sullo schermo orribili» | the S3 bloom is the riskiest new frame on the page: if the droplets read as grain or sparkle, it is the old explosion again. It has its own R-gate |
| 09-09 | «non lagga» | mobile atomics are 2–4× slower (B risk 6); the time-scale and DPR ladders exist, but only his phone can tell |

---

## 4. Engine design

### 4.1 Representations, sizes and memory (per tier)

The grid is **transient**: it is rebuilt from the particles every substep, as in all MLS-MPM. Its spacing and origin can
therefore change between substeps at no cost. Two presets per tier share one allocation: a fine **letter grid** at rest
and during small events, and a coarser, larger **bloom grid** for S3. Rest density scales with h³, so the fluid's
physical density is unchanged when the preset switches.

| | tier A (desktop dGPU) | tier B (phone, iGPU) | tier C (≤ 4 GB) |
|---|---|---|---|
| letter grid h₀ | **C/112** = 0.00893 C (1.99 px at the plate, 4.1 px at S3) | C/80 = 0.0125 C (2.25 px on the phone) | C/64 |
| letter box (C) | x ±0.72 · y −0.03…1.22 · z ±0.20 | same | same |
| letter cells | 162×140×45 = 1,020,600 | 116×100×32 = 371,200 | 93×80×26 = 193,440 |
| bloom grid h₁ | C/90 (5.1 px at S3) | C/64 | C/52 |
| bloom box (C) | x ±0.95 · y −0.03…1.45 · z ±0.40 | same | same |
| bloom cells (allocation) | 171×134×72 = 1,649,808 | 122×95×52 = 602,680 | 99×77×42 = 320,166 |
| cell | `{vx, vy, vz, mass, massFree}` i32 fixed point 1e7 = 20 B | | |
| grid buffer | 33.0 MB | 12.1 MB | 6.4 MB |
| particles in the letter | 4 ppc × V/h₀³ × 1.05 = **100,105** | **36,481** | **18,679** |
| reserve pool (drops) | 4,096 | 2,048 | 1,024 |
| particle buffer (80 B: WaterBall's struct; `position.w` = flags, `v.w` = event id) | 8.3 MB | 3.1 MB | 1.6 MB |
| render field: 3D `rgba16float` at the max dims (r fill_bound, g free density, b agitation, a spare), filterable in core | 171×140×72 → 13.8 MB | 122×100×52 → 5.1 MB | 99×80×42 → 2.7 MB |
| coarse occupancy (1/8 res., max fill) | 22×18×9, negligible | | |
| capacity (u16 per cell, both presets) | 5.3 MB | 1.9 MB | 1.0 MB |
| **total, allocated lazily** | **≈ 60 MB** | **≈ 22 MB** | **≈ 12 MB** |
| hairline (≈ 0.021 C) / stem (0.125 × 0.11 C) in cells | **2.35** / 14 × 12.3 | 1.68 / 10 × 8.8 | 1.34 / 8 × 7 |

- **V** is the letter volume, measured: **0.016965 C³** at κ 0.45 (`_shots/water-hero/M1/w1_report.json`).
- **The old A, for scale:** cap height ≈ 46 cells, 74,403 particles at ρ/ρ0 2.0 (45 §3.1). This direction is
  112/46 = **2.4× finer** per axis with **1.35×** the particles, because it packs 4 particles per cell at rest density
  (+5 % pressure) where the old A packed 8 (the balloon).

### 4.2 The solver: port map (`scripts/port-mpm-kernels.mjs` → `engine/mpm/wgsl/*.wgsl.js`)

The kernels stay in WaterBall's cell units (dt 0.2 per substep). The host maps C ↔ cells with (origin, h) per preset.
The port strips types with Node 22's `stripTypeScriptTypes`, rewrites specifiers, removes backticks, and leaves
`src/webgl/waterball/**` untouched.

| kernel | from `main` | change |
|---|---|---|
| `clearGrid` | 18 lines, verbatim | dims from the preset uniform; also clears `massFree` |
| `p2g_1` | 66 lines, verbatim | `+1` atomic (`massFree`) only for free particles; dormant particles return early |
| `p2g_2` | 97 lines | EOS **γ 1, k 50** (the literal `5.` → 1, stiffness 3 → 50), **viscosity 0.08** (Splash values, spec §3.7). `rest_density = 4·(h/h₀)³` per preset. **Cohesion:** `p = max(p, −0.15 k)` **for free particles only**, so spray beads into round droplets instead of grain while the bound fluid never tension-clumps |
| `updateGrid` | 119 lines | keep the normalisation and the boundary. **Drop** the SSF-depth mouse raycast and `RenderUniforms`. **Add** the stir impulse (a uniform list of ≤ 4 sphere impulses from the host), the drag capsule, and a scroll-free S3 release field. Free-slip at the box walls |
| `g2p` | 223 lines | keep lines 50–101 (the APIC gather and advect). **Delete** 103–209 (capsules, inflate, leash, explode, un-stick). **Add** the vessel (§4.3), release/rebind, attraction, per-flag gravity, CFL cap, floor landing |
| `copyPosition` | 25 lines | dropped: g2p writes in place (the duplicate dispatch of 45 U18 is gone) |
| `spawnParticles` | — | dropped: seeding is a hashed compute pass (mulberry32-style `seedFor(seed, step, event)`) |
| new `resolve` | — | once per frame: cell mass → the 3D field (fill = m_bound/capacity, free = m_free/ρ0, agitation = smoothed node speed), the coarse occupancy, and a stats block (KE, free count, bound mass, ≤ 16 landed clusters, ≤ 16 re-entry impulses, the free-particle AABB) → a 4 KB `MAP_READ` ring of 3, `mapAsync` never awaited (the TimestampRing pattern) |
| new `capacity` | — | at init, per preset: a jittered rest lattice inside the vessel at 4 ppc, deposited with the same quadratic kernel → u16. A 2.35-cell hairline therefore reads fill = 1 when occupied (the kernel deficit cancels) |

**Clock.** A fixed 60 Hz `registerStep` with **2 substeps** per step on every tier. The speed cap is **1.0 C/s** on
every tier, ≤ 1 cell per substep (0.93 at tier A, 0.67 at B, 0.53 at C), which is the CFL limit and also the slow
motion. One substep at tier C would be 1.07 cells and break it, hence 2 everywhere. Node momentum ≤ 4.2 ppc × 5
cells/unit = 21 (letter grid) and ≤ 8.1 × 5 = 40 (bloom grid, ppc 4.2·(112/90)³), both ≪ the 214.7 headroom of the 1e7
fixed point. Integer
atomics are order-independent, so a step is deterministic, and 60 Hz and 120 Hz runs are hash-identical at equal step
indices (G18).

### 4.3 The vessel: containment, release, rebind, recompose, mass ledger

`a(p)` is the engine's **rest** body SDF: the `sdf` chunk composed with `sdfHookDefaultsWGSL`, exactly as the caustic
trace composes it (CONTRACTS §15.1). Group 1 (glyph) and group 3 (body) are `FRAGMENT | COMPUTE` visible, so g2p
evaluates the **same function the shade renders**. The vessel and the rendered rest letter are one definition, and
`∇a` uses the tetrahedral 4 taps, only for particles with a > −2h.

Per particle in g2p, by flag:

- **bound** (inside the vessel)
  - Free-slip wall: if `a > −0.5h`, remove the outward normal velocity and project the position to `a = −0.5h`.
  - **Release:** in the rim band (`a > −2h`), an outward normal speed > **0.5 C/s** → the particle becomes free. This is
    the old `speedGate`, now on the exact normal.
  - Gravity 0 (the capillary lock), except during the pour (12 C/s², faded out over 0.6 s).
  - The bound fluid is seeded at **ρ/ρ0 1.05**: a 5 % overpressure that pushes water back into any hole. This is the
    old `inflate` made bounded: against a wall it reaches equilibrium (still water) instead of a perpetual churn.
- **free** (spray, crown, bloom)
  - Gravity 12 C/s² (6 during the bloom), air drag 0.6 s⁻¹, cohesion (§4.2).
  - **Attraction** when slow (`|v| < 0.6 C/s`, the old `hold`) and outside: `v += −∇a · 4 C/s² · clamp(a/0.1 C, 0, 1)`.
    This is the old `restoreK`/leash, now toward the exact glyph.
  - **Rebind** when `a < −0.5h` and `|v| < 0.35 C/s`. The entry point and momentum go to the stats block, and the host
    calls `waves.impulse()` (1–3 frames late, invisible), so a returning droplet rings the face (M9's absorb).
  - **Landing:** `y < 0.6h`, `a > 1.5h` (clear of the letter and its skirt), `|v| < 0.2 C/s` → flagged "landed". The
    resolve pass clusters landed particles on a 0.01 C floor grid, and the host calls `drops.landBead({x, z, r})` with r
    from the summed volume. Those particles go dormant (back to the pool) when the bead takes over (its 120 ms squash
    starts from the droplet's sphere, D22).
- **Mass ledger (integer, exact):** letter + in flight + beads + pool = constant. The letter's bound mass is regulated
  into **[1.00, 1.08] × capacity**.
  - Above: the next settle retires the excess from the deepest interior points (where `a < −4h`), invisible because the
    vessel stays full.
  - Below: the deficit is topped up from the pool at the same depth.
  - Drying beads return their particles to the pool.
  - This is a **stylisation** and is said so (§6): it is the price of a letter that always recomposes.
- **Sleep (G15):**
  - Inside the last 1.2 s of a breath window, bound particles get a settle drag of `v *= 0.94` per step.
  - When `KE < ε` for 30 steps, no particle is free or landing, and the stats confirm `min fill ≥ 0.6` over the vessel's
    inner band: `setBusy("mpm", false)`, 0 dispatches, and the hook's `fluid.on` drops to 0 (rest identity, §4.4).
  - Flights are ≤ 1 s and the recompose ≤ 2.5 s, so everything is still ≤ 5 s after the last input.

### 4.4 The render field and the new hook K10 "fluid"

**The one additive edit to M0/M2b files.** A fourth hook, in the same style as K1–K3: one line in `bodySDFWith` after the
skirt and before `liquidsSDF`, and its default stub in `sdf.wgsl.js` and `index.js`.

```wgsl
f = fluidSDF(p, f);          // K10: identity unless the fluid is awake (fluid.on)
f = liquidsSDF(p, f);        // K2 (unchanged)
return fillSDF(p, f);        // K3 (unchanged)
```

With the stub, the composed shade is the R1 shade, and `w2 identical` (0 px) is the acceptance of the hook edit.

**The `fluid` chunk** (`engine/wgsl/fluid.wgsl.js`, group 3 bindings **9** field / **10** sampler / **11** params; Frame
`ext4` = (on, θ, ℓ, release e)):

```wgsl
fn fluidSDF(p : vec3f, a : f32) -> f32 {
  if (frame.ext4.x == 0.0 || !inFluidBox(p)) { return a; }      // asleep or outside: the rest body, bit for bit
  let s  = fluidSample(p);            // trilinear rgba16float 3D (normals: tricubic B-spline, 8 taps, smooth path only)
  let fb = max(a, (FL_THETA - s.r) * FL_ELL);    // bound water = vessel AND occupied (theta 0.5, ell 2h)
  let ff = (FL_THETA - s.g) * FL_ELL;            // free water, no vessel
  return smin(fb, ff, 0.5 * FL_H);               // droplets merge into the letter without a seam
}
```

- **Exact edges at rest and when full.** `max(a, φ) = a` wherever φ ≤ a. With the vessel full (fill ≈ 1.05 ≫ θ), φ ≤ 0
  at the surface, so the f = 0 set is the vessel's, and so are its normals. The interior field differs (φ saturates at
  ≈ −1.1h), which only shortens inner steps. With ℓ = 2h the stem (0.11 C) needs ≈ 15–18 of the 24 inner steps.
  Acceptance: the wake/sleep hand-over frames differ by ≤ 1/255 mean (`w9_identity`).
- **Lipschitz.** |∇φ| ≈ ℓ·0.5/h = 1.0 at a free surface. max/min/smin preserve the bound. Step scale 0.75 and 4
  bisections (unchanged). `?dbg=holes` must read 0 with the fluid awake.
- **Empty-space skipping.** `inFluidBox` uses the free-particle AABB from the stats, published through
  `internals.bounds.set("mpm", box)`, so the march box grows only while water is out. In the bloom, a 1/8 coarse
  occupancy lets the outer march jump empty bricks.
- **Normals.** The smooth path (`bodySDFSmooth`) samples the field tricubically (Sigg & Hadwiger: 8 trilinear taps), so
  free surfaces are C1 and show no cell facets. Kaplanyan specular AA (unchanged) absorbs the remaining variance.
- **No SSF anywhere.** The water is in the one trace: exact refraction of the real paper, TIR ≤ 2, Beer over the true
  path, bubbles, coverage AA, the exact-paper composite. 45 U3 (needles), U4 (rims), U5 (jelly) and U15 (moiré) are SSF
  artefacts and cannot occur.
- **Liquids hook.** The analytic crown droplets of M4 are not used when the fluid is live: the crown is in the field.
  That removes the costliest term of today's splash state (the 12–14 droplets in every SDF eval: A full 3.93 ms). Beads
  stay analytic (they lens and dry).

### 4.5 The hairline, honestly

| option | numbers | verdict |
|---|---|---|
| **finer grid until the hairline is ≥ 4 cells** | h = C/190 → **465k** particles, ≈ 176M atomics per frame (≈ 4.7× today's plan) | rejected: an estimated 5–7 ms of sim on this dGPU, impossible on phones |
| **anisotropic kernels** (Yu & Turk) | 1.5–3 ms dGPU for 120k (04 §2.3) | not for the solver: anisotropy improves the *rendered* thin sheets, not the solver's resolution. Unneeded here because sheets render from the grid field |
| **surface tension (CSF on the grid)** | +1 curvature pass | a stretch (V6+). The cohesion clamp (§4.2) already beads the spray; it is not curvature-based and is not called surface tension in any copy |
| **a thicker display cut** (Cormorant 700, a hairline ×1.6) | — | rejected: it is not the page's A (spec §2.1, his typography rule 05 §1.3) |
| **vessel + capacity-normalised fill (this direction)** | edge from the SDF at 0.1 texel; occupancy from the grid mass ÷ the same-kernel capacity | **adopted** |

What it does and does not do:
- The hairline's **edge** is always exact.
- Its **occupancy** is physical: water leaves it, it empties, it refills.
- Its **internal flow** is sub-grid at 2.35 cells: it empties and refills as a unit within ≈ 0.1 s and carries no
  sloshing of its own. Its visible motion is the face waves and the droplets landing on it.
- At S3 (C = 460 px) the hairline is 9.7 px wide, so this is visible to a careful eye during a stir, and it is written
  down here so nobody claims otherwise.

### 4.6 Plug-in to the current engine and contracts (nothing pinned changes; everything additive)

- **Module.** `KNOWN_MODULES.mpm = ["./mpm/mpm.js", "./wgsl/fluid.wgsl.js"]`, a plugin
  (`export async function plugin(internals)`) awaited after shade-hero and the body (CONTRACTS §9.1, §13.1). The host
  `fx-water.js` adds `"mpm"` to `HERO_MODULES` only when `?water=fluid` or `localStorage["rv-water"] === "fluid"`.
  It is never requested off the home page, under reduced motion, or on gl-off.
- **Pipelines.** The `PipelineCache` set **"mpm"** (already reserved, `gpu.js:143`): `clear`, `p2g1`, `p2g2`, `grid`,
  `g2p`, `resolve`, `capacity`, `seed` (8 compute pipelines). They are created after `linked` in idle time and compile
  on Dawn's workers, so they never hold a swap (CONTRACTS §21 trace). Buffers are allocated on the first wake.
- **Passes.** `render.registerPass("mpm", encode, { kind: "encoder", phase: "step", order: 5 })` loops `ctx.steps × 2`
  substeps (5 dispatches each) plus one `"mpm:resolve"` frame pass, with 2 timed entries in the TimestampRing (≤ 8 per
  frame: waves, wet, shade, mpm, resolve = 5).
- **Commit.** The `fluid` chunk joins M4's debounced `heroCommit`, held while a pour is armed (D20b). Default S1
  therefore has **one** hero compile (unchanged), and the fluid chunk lands with the M4 swap after the pour settles
  (one compile of ≈ 300–400 ms on a worker; the previous shade keeps drawing). An input before that falls back to
  today's analytic splash, which is seamless.
- **Inputs.** `internals.input` (pointer, `hit()`, seq), the drops API (`landBead`), the waves API (`impulse`),
  `internals.offsets` (unchanged: the light), and `setBusy("mpm")`.
- **Events and stats.** `stats.particles` = live (letter + in flight) count, 1 Hz while submitting, once on idle.
  `emit({type: "mpm", state: "wake"|"sleep"|"release"|"inhale"|"formed", n, ms})`.
- **Device loss.** `recoverWaterEngine` restores a formed letter. The mpm plugin re-seeds at rest (no state carried;
  invisible because rest = identical).
- **Tier downgrade.** It changes h₀. It happens only while the sim sleeps, by re-seeding at rest (invisible).
- **Bubbles on the current (SHOULD).** A 1-workgroup pass reads the grid velocity at the ≤ 4 bubble positions and
  advects them while awake; written into the body uniform's bubble slots with `copyBufferToBuffer`.

---

## 5. Performance

### 5.1 The baseline (measured, CONTRACTS §19.3, RX 7800 XT rdna-3, Chrome, developer timestamps)

| state | p95 today | budget |
|---|---|---|
| tier A plate, rest (shade only) | 0.32 ms | — |
| tier A plate, worst (splash) | 1.31 ms | 2.0 |
| tier A full g = 1, worst (splash) | 3.93 ms | 5.0 |
| tier B dock (dGPU-measured) | 0.75 ms | 8 |
| boot compile, rest shade / + M4 / + pour | 270 / 319 / 364 ms (accepted FAIL vs 300) | — |
| old A (`main`), never timed on the GPU | "Frame 16.7 ms" = vsync; derived ≈ 28.1M atomics + ≈ 160M texel loads per frame (45 §3.6) | — |

### 5.2 Estimates for this direction (to be replaced by timestamps at V1/V2)

| state, tier A dGPU | sim | shade | p95 target |
|---|---|---|---|
| rest, hover-light | **0** (asleep, 0 dispatches) | 0.32 (unchanged code path) | ≤ 0.4; 0 submits at idle |
| stir / click at the plate (100k p, 2 substeps: 37.8M atomics, +massFree for the free few) | 1.0–1.7 (scaled from 04 §3A: 1–1.5 ms for WaterBall at 120k ≈ 45M atomics; + grid clear/update on 1.02M cells ≈ 0.1–0.15; resolve ≈ 0.05–0.1) | 0.6–1.2 (one trilinear 3D tap per eval in the fluid box, tricubic normals; the analytic crown loop removed) | **≤ 2.6** (M9's splash number) |
| S1 window pour, `?pour=mpm` (≈ 1.5 s) | 1.0–1.7 | 0.8–1.5 (0.63 MP scissored) | ≤ 3.0 |
| S3 bloom, full screen (all free: +5.4M atomics, bloom grid 1.65M cells) | 1.2–1.9 | 3–5 at DPR 1.5 → 1.5–2.3 at DPR 1.0 | **≤ 5.0** with the DPR ladder at level 1–2 |
| band, case pages | 0 (module never loaded) | 0.25 (measured §18.6) | ≤ 0.5 |

| state, other tiers (estimates; no phone measured here) | sim | shade | p95 |
|---|---|---|---|
| tier B phone (A16 / Adreno 740 class), 36.5k p, 2 substeps, 13.8M atomics | 1.5–3 | 3–5 (spec §3.4 dock estimate) | ≤ 8 |
| tier B laptop iGPU | 1.0–2.0 (04: ≈ 100k real-time on a Ryzen 5825U) | 2.5–3.5 plate | ≤ 8 plate / ≤ 9 S3 |
| tier C, 18.7k p, 2 substeps, 7.1M atomics | 0.6–1.6 | — | ≤ 12 |

### 5.3 Ladders, in order (no effect is ever removed)

1. **Time-scale ladder (new, sim only).** When the sim p95 > 50 % of the tier's frame budget over 30 resolved frames:
   1 substep per step **and half the sim time scale**. CFL holds, and the water moves in slower slow motion. It steps back
   up after 8 s under 35 % (the asymmetric hysteresis of `DprLadder`).
2. **The S3 DPR ladder** (unchanged: [1.5, 1.25, 1.0] × tier).
3. **The one-shot tier downgrade** (unchanged thresholds 7 / 11 ms). It switches h₀ while the sim sleeps.
4. **Kill criterion:** if the tier-A sim p95 > 2.0 ms at V1 on this machine, set h₀ = C/96 (63,040 particles, still 2.1×
   finer than the old A) and re-measure.

### 5.4 Main thread, idle, posters, Lighthouse

- **CPU per frame:** one params write, the encode of ≤ 12 dispatches, one non-awaited `mapAsync`. ≤ 0.4 ms, no
  allocations (spec §3.4).
- **Idle:** the submit counter is constant 5.0 s after the last input (G15), as today.
- **Reduced motion:** the MPM module is never loaded; one presented frame, the R1 still. **No WebGPU:** the poster
  `fx-plate-v1.webp`, unchanged and still truthful, because the rest frame is identical (`w9_identity` + the w8 poster
  diff ≤ 2/255).
- **Lighthouse:** the gl-off lab path never downloads `water/engine/*` (CONTRACTS §20–§21: gl-off 86/86/87, live 88). The
  mpm module (≈ 30–40 KB of JS/WGSL, estimate) loads only on a motion home visit with `?water=fluid`.
- **Risk to watch:** the page-change seam. R5 measured the home engine's teardown at 64–163 ms of swap-blocking GPU
  time; +60 MB of buffers may lengthen it (§7).

---

## 6. Honesty and claims

**What becomes true (printed only after V6 verifies it on screen):**
- **Caption:** `{n} particles · WebGPU · {ms} ms GPU · DPR {dpr}`.
  - `n` = the live particle count read from the engine at 1 Hz (≈ 100,1xx at tier A, ≈ 36,4xx at tier B). It moves a
    little when beads take water: real, not decoration.
  - `ms` = the 1 s timestamp median including the mpm passes while awake.
  - 48 characters at the longest, under the 51-character string measured at 2 lines at 1024 (spec §4.4).
  - Omitted under reduced motion and gl-off, where no particle exists.
- **Label:** unchanged, «Fig. 01 · An A of water, rendered live».
- **Colophon:** unchanged («GSAP, Lenis, WebGPU»). "MLS-MPM" goes in HANDOFF and the case copy, not in the caption
  (length).
- **CV (tell Alberto):** «simulated water» becomes true again *for the hero*. A correct wording: "an MLS-MPM water
  simulation of ≈ 100k particles held in a Cormorant A, ray traced in WebGPU". «real caustics» stays false while the
  caustic is off on the hero (R1).

**Never printed:** "120,000" (never a real count); "simulated letterform" or "the shape emerges from physics" (the
outline is the typeface's, by design); "surface tension" (it is a cohesion clamp); "physically accurate"; "sun",
"glints"; "caustics" (unless `?caustics=1` returns by Alberto's choice).

**Stylisations, disclosed to Alberto in the A/B sheet:**
1. The vessel: the outline is designed, the water is simulated.
2. The metered pour level (`?pour=mpm`): the level is scheduled, the water under it is simulated.
3. The reservoir top-up and retire (mass ledger, §4.3).
4. Slow-motion gravity (12 C/s², about 60× slower than real for a hand-sized letter) and the 1.0 C/s cap.
5. The cohesion clamp.

The paper stays exact: w0's untouched pixels are unchanged (the fluid writes only where it is).

---

## 7. Risks (honest)

1. **At rest it is today's letter.** If Alberto's doubt is the still look, this direction answers it only through S3
   and two knobs. Mitigation: the A/B sheet opens with motion strips, not stills; `?sigma=1.0` and `?scale=0.58` are on
   the sheet.
2. **The S3 bloom can read as grain or sparkle** (the 06-27 «orribili» explosion again). 100k particles in a 2.25 C³ box
   are ≈ 3× sparser than at rest, so many sit below the iso level, become 1-cell droplets (≈ 5 px), and twinkle under
   moving highlights. Mitigation: cohesion, a hashed curl drift for coherent sheets, specular AA, and an R-gate before it
   is default. Fallback: a partial exhale (only the stem's front layer releases, e ≤ 0.4).
3. **Performance is estimated, not measured.** Phone atomics are 2–4× slower; Dawn on Android/iOS is unknown here; the
   bloom's shade with thousands of lenses can exceed 5 ms. Mitigation: timestamps at V1, the time-scale ladder, the DPR
   ladder, the h₀ = C/96 kill switch, and a real-phone run at V6.
4. **Boot compile and t_run.** The S1 path has 14 ms of margin to the 2.6 s counter cap on the worst cold run (D20). The
   fluid chunk in the boot shade costs an estimated +40–80 ms. Hence the default commits it after the pour (D20b), and
   `?pour=mpm` ships only if `w5_bootsplit` keeps t_run ≤ 1.4 s.
5. **The hairline is under-resolved in motion** (§4.5). It can empty or fill only as a unit; a careful eye at S3 sees it.
6. **The vessel-to-free-surface seam.** Where a hole meets the vessel wall, `max()` makes a crease (a real contact line).
   Fill hovering near θ can flicker. Mitigation: fill hysteresis (θ 0.5 on the way down, 0.55 on the way up),
   agitation-weighted smoothing, and a `?dbg=fill` view.
7. **MPM has no surface tension.** Crown sheets tear into grain; the cohesion clamp may tension-clump. Tuning time is
   real (U6/U7 were never signed off in June). The bound fluid stays p ≥ 0.
8. **The stir contradicts a sersan habit** ("pointer as light"). It is speed-gated and `?stir=0`-able; Alberto decides.
9. **The mass ledger is a stylisation.** It is invisible, but a technical juror could call it a cheat; it is disclosed.
10. **Memory and the seam.** +60 MB at tier A may lengthen Chrome's teardown at the page-change seam (R5: 64–163 ms for
    today's home engine). It is measured by the existing s4/R5 probes; if it regresses, free the mpm buffers on
    `fx:nav:start` (they re-seed at rest on return).
11. **Contract amendments needed** (Alberto's decisions, not ours):
    - spec §3.7 "MPM never represents the resting letter" (here it represents the water, not the outline);
    - §1.2 "the cursor never deforms the letter" (the fast stir);
    - §1.4 S3 mapping (the exhale and inhale);
    - §4.4 the caption token.
12. **Schedule.** ≈ 70 h. This project's agents die at session limits mid-work, so state stays on disk: lanes in
    worktrees, a commit per milestone, RESUME notes.
13. **Two hero paths to maintain** until he picks. The fluid path is a plugin with one additive hook, so dropping it is
    one module line plus one stub.

---

## 8. Build plan (three lanes in git worktrees, each with its own static server)

**Setup (director, 0.5 h).**
- Create three worktrees from `feat/water-hero` HEAD:
  - `git worktree add ../pf-fluid-render -b feat/fluid-render`
  - `git worktree add ../pf-fluid-sim -b feat/fluid-sim`
  - `git worktree add ../pf-fluid-host -b feat/fluid-host`
- Each lane runs `python -m http.server 518x --bind 127.0.0.1` in its own `public/` (5180 / 5181 / 5182). Probes read
  `RV_BASE` (lib.mjs honours it), headless only (`launch()` of `scripts/probes/water/lib.mjs`).
- The files are disjoint. The director merges in order render → sim → host into `feat/water-fluid`, one commit per
  milestone, then into `feat/water-hero` only after Alberto picks.

| M | lane · est. | files | deliverable | acceptance probe |
|---|---|---|---|---|
| **V0** | render (E1) · 4 h | `wgsl/sdf.wgsl.js` (1 hook line + stub), `index.js` (stub + `KNOWN_MODULES.mpm`), `wgsl/fluid.wgsl.js` (stub) | K10 "fluid" hook | **w2 identical: 0 px** at plate / full / mobile; compile delta logged (`w5_bootsplit`) |
| **V1** | sim (E2) · 14 h | `scripts/port-mpm-kernels.mjs`, `engine/mpm/mpm.js`, `engine/mpm/wgsl/*.wgsl.js` | port; letter + bloom presets; vessel containment; capacity bake; seeding at 1.05; fixed 60 Hz × 2; stats ring; sleep; `dev/fluid.html` with a HUD | **w9_soak:** 10 min with a scripted stir every 20 s: 0 NaN, the integer ledger exact, bound mass in [1.00, 1.08], 0 dispatches ≥ 5.0 s after the last input. **w9_det:** 60/120 Hz strips hash-identical. **w9_perf sim:** tier A sim p95 ≤ 1.7 ms (kill > 2.0 → C/96) |
| **V2** | render (E1) · 10 h | `wgsl/fluid.wgsl.js`, `engine/mpm/resolve`, `?dbg=fill\|free\|agit` | the resolve pass, the 3D field + occupancy, the fluid chunk (max / smin), tricubic normals, the bounds registry | **w9_identity:** asleep 0 px vs R1 (3 views); wake/sleep hand-over mean ≤ 1/255. **w2 holes = 0** with the fluid awake (yaw −25…+15). No lattice at 400 % on a free surface (`?dbg=normal`). Shade p95 at the plate while awake ≤ 1.2 ms |
| **V3** | sim (E2) + host (E3) · 12 h | `engine/mpm/mpm.js` (stir, drop, drag, landing, re-entry), `fx-water.js` (`?water=fluid`, `?stir=`) | the stir, the particle click drop, the drag capsule, beads via `landBead`, re-entry rings, bubbles on the current (SHOULD) | **w9_click:** 12 frames at 60 ms (`?manual=1`): fall, crater, a particle crown, beads; a 4× "no dust" crop (0 specks < 2 px² isolated). **w9_stir:** a 1500 px/s sweep releases 0.5–3 %, the recompose completes ≤ 2.5 s, then 0 px vs rest. **w9_hairline:** an 8× strip during a stir off the hairline: 0 broken frames |
| **R4-fluid** | Alberto · — | `_shots/water-hero/fluid-ab/` | the first A/B: rest (identical), click, stir, phone tap | his verdict on the stir and the click; go / no-go on V4–V5 |
| **V4** | sim + render · 8 h | `engine/mpm/pour.js` (metered emitter), the `pour.js` option `levelFrom: "mpm"` | `?pour=mpm` particle pour, capillary lock, mobile window | **w6** strips with the flag; counter = fill ± 0.02; luminance step ≤ 2 % at hand-off; **w5_bootsplit** t_run ≤ 1.4 s on the worst of 5 cold runs, else the flag stays off |
| **V5** | render + sim · 10 h | `engine/mpm/mpm.js` (release field, presets switch), `fluid.wgsl.js` (occupancy skip) | the S3 exhale (g 0.72 → 1) and inhale (900 → 1260), scroll back | **w9_bloom** strip at p 0.6/0.7/0.8/0.9/1.0 and scroll 1000/1100/1260; **w5_mask 0 px** over the visible words across the bloom; full-screen p95 ≤ 5.0 ms with the ladder; the inhale ends in a 0 px rest frame |
| **V6** | host (E3) · 8 h | `tier.js` (time-scale ladder), `fx-hero.js` caption token (flag), `scripts/probes/water/w9_*`, the A/B sheet | tiers A/B/C, phone run, claims, posters check, A/B sheet | **w9_perf** per-pass p95 tables for `?tier=A\|B\|C` × rest/stir/click/pour/bloom; **w8_claims** with the particles token (equal to the engine's count); **w8_posters** diff ≤ 2/255 (unchanged files); Lighthouse gl-off unchanged; a live run on Alberto's phone at 60 fps (his eyes) |
| reviews + fix | all · 4 h | — | look / code / spec reviews, one fix batch | every w0–w9 probe green, console 0/0 |

**Critical path:** V0 → V1 → V2 → V3 → R4-fluid → V5 → V6, ≈ 58 h in one lane; ≈ 40 h of wall time across three lanes.
**Total ≈ 70 h.** This direction subsumes the scheduled M9: its apex crown and click splash are V3/V4 here.

---

## 9. A/B plan (Alberto compares three things, live, side by side)

1. **The old A, live** (what «prima avevo» means).
   - `git worktree add ../pf-main main`, `npm ci`, `npm run dev -- -p 3001` in it, opened in the built-in browser pane in
     the foreground.
   - `sessionStorage["at-preloader-seen"] = "1"` skips the preloader; leva is visible in dev.
   - This is 45 §6's recipe. It is the honest reference: he compares his memory with the thing itself.
2. **"Tipo d'acqua" today:** `http://127.0.0.1:5178/proto/rivista/index.html` (default path, untouched).
3. **"Revive":** the same page with `?water=fluid` (and `?pour=mpm`, `?stir=0`, `?sigma=1.0`, `?scale=0.58` as
   sub-variants). `localStorage["rv-water"] = "fluid"` keeps it across S4/S5 cuts while he browses. There is no on-page
   toggle: the canon has no chrome.
4. **The comparison sheet** `_shots/water-hero/fluid-ab/AB-fluido.html` (the R1/R2 contact-sheet format, captured by the
   V6 probe):
   - paired strips: rest (with the 0 px diff printed), click (analytic vs MPM, 12 frames), stir (none vs 3 sweeps),
     S3 (orbit vs exhale/inhale, 10 frames), pour (analytic vs `?pour=mpm`), phone tap;
   - a per-tier perf table and the caption strings;
   - the stylisations list (§6);
   - the contract amendments to approve (§7.11).
5. **Decision rule.** The default stays "Tipo d'acqua" until he picks. Adopting "Revive" means `HERO_MODULES` gets
   `"mpm"` unconditionally and the spec amendments are recorded. Rejecting it means removing the plugin; the V0 hook stub
   stays, harmless.
