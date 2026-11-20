# 45 · The old MLS-MPM water "A": an archaeology dossier

> Reader-only reconstruction, 2026-10-09, for the question Alberto asked today:
> «il logo 3d "A" fatto di acqua, avevo prima un effetto in webgpu super realistico, ma che era da completare, poi l'abbiamo abbandonato. valuta se reinserirlo, o fare qualcosa che c'entri con quello stile» · «adesso c'è un altro stile, ma non so se lo preferisco ora come ora».
>
> Sources: `git log --all -- src/webgl/waterball` and every commit and branch listed in §1; the code at `main` (Golden Hour, fluid last touched by `444681b`), at `HEAD` (`src/webgl/waterball/**`, the job-order "oil" version from `d33a2d6`) and at the first port `69efa96`; the HANDOFF versions at `b4de047` and `592d6f4`; `docs/archive/{WATER-WAVE-PLAN,04-3D-HERO-WATER-LOGO,12-PARTICLE-PHYSICS}.md`; `main:IMPROVEMENT_BACKLOG.md`; the memory notes (`hero-pivoted-to-liquid-mesh-webgpu`, `ssf-fluid-hero-wip`, `hero-water-realism-reference`, `hero-water-flock-realism`, `hero-mark-is-letter-a`, `hero-rethink-g4-unlocked`, `rivista-water-hero-mission`, `awwwards-loop`); the dossiers `_refs/hero-water/02-water-engine.md` (the engine audit of 2026-09-18, which this file cites rather than repeats) and `05-taste-history.md`; the spec `30-hero-build-spec.md`; the rivista engine `public/proto/rivista/water/engine/CONTRACTS.md`; and every image on disk that shows the old A (§2).
>
> Nothing was run: no dev server, no Chrome, no GPU. Every number is read from code, from a commit message, or from 02's replica script (its Appendix A). Quotes from Alberto are verbatim where they come from his own messages, and marked *paraphrase* where they come from a commit message or a memory note.

---

## 0. TL;DR

1. **What it was.** A faithful port of `matsuoka-601/WaterBall` (raw WebGPU, MLS-MPM, 2 compute substeps per frame) whose spherical attractor was replaced by a **three-capsule medial axis of a sans "A"** (apex, two legs, crossbar; half-width 5 cells in an 80×60×18 grid). It was rendered with screen-space fluid (depth splat, narrow-range filter, thickness, normals from depth), lit by a cubemap. Between 2026-06-25 and 2026-08-06 it gained perpetual churn, a speed-gated splash under the cursor, ballistic droplet arcs, velocity foam, a sun glint, dispersion, a birth fountain from the sea, a contact line with the sea video and a scroll "drain" with a camera dolly. It was the full-viewport hero of the Golden Hour site and was **deployed to production** (merge `1f234f5`/`3dcaede`, 2026-07-14, Alberto: "mergia e continua").
2. **Why it felt "super realistic".** It was a **real particle fluid at full-screen scale**: it moved by itself, sprayed real droplets when touched, rained them back in arcs, and was born from a fountain. The optics were secondary and, on stills, weak.
3. **Why it was "da completare".** The letter was a rounded, monoline, ultra-bold sans blob with a closed counter and no serifs. The body read as jelly, with iridescent and orange rims. The slow-motion feel was never signed off. The foam/spray layer, cohesion, sleeping and a mobile tier were never built. Performance was never measured on the GPU. It was abandoned with the Golden Hour world (rejected 2026-09-14), briefly survived as amber oil in the job-order bench (09-16/17), then was replaced by the rivista's SDF letter (09-18).
4. **Best version.** `main` (tip `881f68c`; fluid files last changed by `444681b`, 2026-08-06). Its look was set on 2026-07-14 by `35b751c` + `7ea05ac` + `ecb1b96` + `36192d4`. It is the version Alberto saw live in production, approved by merge, the most complete, and the one behind «era nella giusta strada» (§6).
5. **Portability.** The solver kernels port to the rivista engine with a strip-types script. The A confinement, the SSF renderer, the leva knobs and the frame-locked clock do not port. The spec already schedules the honest re-entry: **M9**, the MLS-MPM splash layer (§3.7 of the spec, 12 h, stretch, G4 unlocked). Bringing the old letter back as the hero contradicts the spec's §2 fidelity, the solver floor (a Cormorant hairline is about 1–2.5 cells), the G15 "settle in 5 s" rule, and Alberto's own R1/R2 verdicts (§7).

---

## 1. Timeline: every version, with Alberto's verdict

### 1.1 Prehistory (before MLS-MPM)

| commit · branch | date | what | fate / verdict |
|---|---|---|---|
| `91333fd`, `71b9118` · `feat/hero-water-logo-a` | 06-24 | GPGPU water-particle "A" on WebGL2 from `a-mark.glb` (a Georgia-Bold **serif** A, extruded) | Replaced: he wanted *liquid*, not a particle cloud (05 §2 #2) |
| `c41a5a2`, `19251c1` · `feat/hero-liquid-mesh-webgpu` | 06-24 | Liquid mesh A (`MeshPhysicalNodeMaterial` transmission) + "faithful Splash SSF water" with a `?hero=mesh|ssf` A/B toggle | Bridge. `9bef233` (`feat/hero-mesh-pbr`) made the PBR glass mesh the default on a side branch |
| `77cd3c3` … `ce16608` · `fix/ssf-water-faithful-port` | 06-24/25 | TSL SSF port of WaterBall; flat-tint root cause found (refraction weighted 98 % at F0 0.02) | «l'acqua non dipende dallo sfondo/mondo 3D nelle repo clonate — il colore è il materiale» (06-24, memory `ssf-fluid-hero-wip`): see-through refraction rejected; look must come from the material plus a real cubemap reflection |
| memory `ssf-fluid-hero-wip` | 06-24/25 | Alberto asks: «implementa perfettamente waterball ma al posto della ball una A» | The turn that produced the engine below |

### 1.2 The MLS-MPM A (raw WebGPU, `src/webgl/waterball/**`)

| commit | date | what changed | look evidence | Alberto's verdict |
|---|---|---|---|---|
| `69efa96` | 06-25 | **First faithful embed** of WaterBall (`.ts` + `.wgsl.ts`), own WebGPU canvas. A = 3 capsules with a **firm wall** (`v += n·(d − 5)·6`), z-slab, 40,000 cap, `dt 0.20`, viscosity 0.25 (WaterBall 0.1), WaterBall's sky cubemap, teal Beer-Lambert `density 0.7`, specular ×0. Old liquid/ssf/gpgpu/mesh code deleted. `docs/12-PARTICLE-PHYSICS.md` added | none on disk | Asked for it (the line above) |
| `058e109` | 06-26 | **Home-lock**: particles seeded on sampled homes (`initFromHomes`), velocity-gated restore, distance leash, un-stick nudge; leva panel | none | Superseded the same night: water "frozen at rest" and an «ingorgo» on recompose (`b4de047` message, HANDOFF) |
| `b4de047` | 06-26 | **"Living water A"**: WaterBall's own confined-sphere forces moved to the A's medial axis — `inflate 4` (push out) + `gravity` (pull in) → perpetual churn; speed-gated `hold` lets a fast poke escape (splash) and reels slow water home; `dt 0.13`, viscosity 0.45 (slow motion); camera sway | "Verified live in Chrome: continuous churn, splash sprays out, slow recompose" (commit) | Tuned live with him via leva; HANDOFF "DA FINIRE" list opens here (§4) |
| `7737fc1` · `origin/feat/ssf-a-volume` | 06-26 | "per claude pc fisso": analysis clones of Splash/WaterBall + `SSF-WATER-REFACTOR-PLAN.md` | — | — |
| `9445c18` | 06-27 | WIP snapshot: hero + 136-frame WebP cinematic, `liquid-text.tsx`, explode/reveal beats; "Tuning is still OPEN … not yet signed off" | none | Same day: hero «fa schifo»; title animations «orribili»; floating cards «non c'entrano niente»; the spiky white explosion «effetti sullo schermo orribili» (memory `hero-rethink-g4-unlocked`). Chose "Liquid Monogram" (keep the water A). **G4 unlocked** |
| `3f25966` | 06-27 | Kill the white silhouette spikes in `fluid.wgsl`; explode → scroll-scrubbed downward drain | static only | *Paraphrase* (`540cb50`): "was a downward rush, not a splash; force too high" |
| `540cb50` | 06-27 | Explode = **radial slow-motion burst** + 4 leva knobs (`explodeOut 4, Grav 2.5, Damp 0.08, Cap 16`) | "scattered particles render spiky in the SSF pipeline" (commit) | "Final baked values pending Alberto's live tuning" — never recorded as baked |
| `979e2ac` | 06-27 | **Densify**: cap 40k → 120k, fill spacing 0.66 → 0.5 "to kill SSF spikes" | — | *Paraphrase*: "more particles to fix the spiky dispersal". Side effect found later (02 §2.2): real count 74,403 at ρ/ρ0 = 2.0, **2.67× the tube volume → the balloon letter** |
| `7094231` | 06-29 | Golden Hour redesign: **narrow-range depth filter** (Truong & Yuksel), refraction now samples a **generated sunset cubemap**, thin-edge foam fade | — | Golden Hour world adopted |
| `0f41ed3` | 07-01 | Dissolve the **orange edge fringe**: `THICK_FADE 0.5 → 1.15`, grazing rim pulled to deep teal | — | *Paraphrase*: «the teal water + sunset reflection are perfect; only the orange contours were unwanted». The only explicit "perfect" on record |
| `35b751c` | 07-14 | **Photoreal pass**: backlit sun glint (`pow 420 × 1.5`) + sheen, animated micro-ripples, per-channel IOR dispersion, velocity foam (`rg16float` thickness, `SPEED_REF 7`), **positional ballistic gravity** on escaped droplets, density 0.7 → 0.38, `pokeForce 0.85`, `MOUSE_RADIUS 9 → 7`, sunset cubemap with a luminous sea + glitter column | QA "rest/splash/settle/drain/reform 1440+390", adversarial review 5 lenses × 3 verifiers (frames in a session scratchpad that no longer exists) | Mandate: «pieno controllo, lasciami a bocca aperta», then «continua a migliorare e aggiungere cose bellissime animate» (memory) |
| `7ea05ac` | 07-14 | density 0.34 (initial fill still read murky); dev handle | probe frames, not kept | **Merged to main and deployed** on his "mergia e continua" (memory `hero-water-flock-realism`) |
| `f486478` → `50f3beb` | 07-14 | CIELO VIVO: a procedural WGSL sky+sea under the A (density re-lit to 0.30), then replaced by a photographic Kling loop | — | Procedural sky: «troppo artificiale, dev'essere tutto realistico» (05 §1.1). The 0.30 density stayed |
| `ecb1b96` | 07-14 | **LA NASCITA**: `initFountain` — every particle spawns on a sheet at the sea line with a velocity aimed at its home over 1.8 s (5–20 % vertical overshoot for a crest); measured 0.9 s veils, 1.9 s half-born, 5.2 s calm | — | Shipped (merged) |
| `36192d4` | 07-14 | **IL CONTATTO**: below `waterline = 0.86·H` the legs refract, melt into the sea video and get a foam belt; preloader ink A "cola" into the fountain | legs dissolving at the bottom of `_shots/webgpu/1-initial-1440.png` | Shipped. A mirror reflection was tried and dropped |
| `b82512f` | 08-06 | Bird flocks removed; the `hero-splash` dispatch goes with them | — | — |
| `444681b` · `feat/webgpu-hardening` → main | 08-06 | Resize (partial rebuild of the screen-sized half), `device.lost` → fallback, duplicate `copyPosition` removed, per-frame garbage removed. Mouse-velocity DPR bug **A8 flagged, not fixed** (G4) | `_shots/webgpu/*` (2026-08-05) | Last change to the fluid on `main` |
| `68b323d`, `eb85c92`, `d33a2d6` · `feat/redesign-2026-09` | 09-16/17 | **Job order**: the same solver (forked at `664d6e4`, before `444681b`) re-staged as an instrument in a 760×540 bench, re-lit as **amber hydraulic oil** (3-stop depth ramp, workshop cubemap, wet coat, cream foam, `thickness_gain`), tiers 120k/60k caps, readouts, 4.2 s "settle before you show" | `public/bench/tank-still-1520.webp` | World rejected (by 09-18; no transcript on this machine). Golden Hour world rejected 2026-09-14 |
| — | 09-18 | Rivista bianca chosen; the flat embossed A + 2D lines rejected | — | «il logo in 3d della A fatta di acqua era nella giusta strada. mancava solo perfezionamento e lavoro aggiuntivo per creare un esperienza bella, e super realistica» (05 §0) |
| — | 10-09 | — | — | «avevo prima un effetto in webgpu super realistico, ma che era da completare, poi l'abbiamo abbandonato» |

**Two lineages.** `main` carries the Golden Hour engine with the August hardening. `feat/redesign-2026-09` (and therefore `HEAD`) forked at `664d6e4`, before `444681b`. `g2p.wgsl.ts` is byte-identical on both. `HEAD`'s `mls-mpm.ts` still has the duplicate `copyPosition` dispatch and the per-frame allocations. Its `fluid.wgsl.ts` is the oil shader.

---

## 2. What it looked like: the images on disk

No frame from June or July survives. The July 14 QA set (`f-rest-a.png` … `f-reform.png`) was written by `_water_qa.mjs` to the scratchpad of session `5e9f7af7`, which is gone. Everything below is from 2026-08-05/07 (`main`, the photoreal peak plus hardening) or 2026-09-16 (the oil bench). All Golden Hour captures are dev builds, so the leva panel sits top-right.

**The 9 representative images:**

| # | path | what it shows |
|---|---|---|
| 1 | `_shots/webgpu/1-initial-1440.png` | **The A at rest on main, 1440×900.** A huge translucent letter fills about 80 % of the viewport height (≈ 15 CSS px per grid cell) over the sunset sea video. The body is a mottled teal-green jelly with sunset warmth refracted through it. Pink/green iridescent rims on the right flank. Rounded monoline sans form, **closed counter** (a dark knot where the counter should be), no serifs. The legs melt into the sea below the waterline (IL CONTATTO). The name and tagline overlap the left foot. |
| 2 | `_shots/webgpu/5-final-1440.png` | **Same, later, after the resize cycle.** The most "inflatable" frame: fat pillowy strokes, a flat pale face, and a continuous **salmon/orange halo** ringing the whole silhouette. The `0f41ed3` fringe fix was partly undone when `35b751c` lowered `THICK_FADE` to 0.9. |
| 3 | `_shots/liquidswap/dive-f2.png` | **Scroll drain, mid-beat.** The apex thins into a column. A chain of discrete, sharply refracting **droplets** runs down the left edge, and the body shows streaks and sheets. The single most "water" frame on disk: the particle nature shows. |
| 4 | `_shots/liquidswap/intro-dive-a.png` | **Drain, later.** Translucent veils with cyan specular streaks, a dozen **beads** with dark refraction rims scattered over the body, the base going to mist. Reads as spray, still murky in the core. |
| 5 | `_shots/liquidswap/dive-f1.png` | **Preloader handoff.** The ink sans "A" of the Golden Hour preloader (dark brown, solid) over a washed-out sunset, with the **birth fountain**'s pale veils rising behind it (LA NASCITA + the "cola" preloader of `36192d4`). |
| 6 | `_shots/liquidswap/intro-settled.png` | **Rest, with page integration.** The A whole, iridescent rim, olive core, and the dome of the paper sheet (the August intro) rising at the bottom. Shows how the letter sat behind the page. |
| 7 | `_shots/webgpu/3-resized-640.png` | **640 px wide.** The letter overflows the viewport. Murky olive-green body, lumpy surface, pink rim halo. Small viewports magnify the 1-cell lumps. |
| 8 | `_shots/after-noflock/home-390-000.png` | **Phone 390×844 on main.** No tier and a fixed camera distance (72): the letter is wider than the screen, so only the legs read. Leva covers the top. Mobile was never designed for this engine. |
| 9 | `public/bench/tank-still-1520.webp` | **Job-order oil, 2026-09-16, 74,403 particles, DPR 1.5, rest after 8 s** (`PROVENANCE.md`). A **golden inflated balloon A** on grey paper. Dithered, moiré "hatching" highlights (the NDC depth-precision bug, 02 §5.1), a soft grey halo, smeared feet, no counter. Same solver, worst shading. |

**For contrast (not the old engine):** `_shots/water-hero/r1/r1_full_k0.45.png`, the current "Tipo d'acqua" at R1. It shows the exact Cormorant A (hairline crossbar, bracketed serifs, apex), clear water, foot menisci and beads, on paper.

Also on disk with the old A: `_shots/webgpu/{2-resized-1024,4-back-to-1440}.png`, `_shots/{before,after-iter2,after-noflock}/home-{1440,768,390}-000.png`, `_shots/liquidswap/{intro-dive-b,intro-dive-c,dive-f3}.png`, `public/bench/tank-still-700.webp` (a downscale of #9, not a phone capture). The `about-*`, `journey`, `arch`, `hz`, `reveal`, `seams`, `tear*`, `underpaper`, `approach` sets do not show the A (`arch/hero-002.png` is the hero with the canvas empty).

**Read across the set.** At rest the old A never looked like clear water. It looked like a big, glowing, translucent gel letter in a sunset. It looked like water **when it moved**: droplets, veils, arcs (images 3–5). That matches Alberto's memory of "super realistico" (an effect, a motion) better than any still does.

---

## 3. The engine at its peak (`main`, `444681b`) — anatomy

Full-depth audit: `_refs/hero-water/02-water-engine.md` §1–§6. The essentials:

### 3.1 Solver (frozen files on every branch since 06-27)

- **Kernels per substep** (`@workgroup_size(64)`, one compute pass, **2 substeps per rAF frame**): `clearGrid` → `p2g_1` (mass + APIC momentum, 27 cells × 4 atomics) → `p2g_2` (density, Tait EOS `k·((ρ/ρ0)^5 − 1)` clamped ≥ 0, viscous stress, 27 × 3 atomics) → `updateGrid` (normalise, mouse poke, zero boundary cells) → `g2p` (APIC gather, advect, **A confinement**, splash forces, caps, walls) → `copyPosition` (twice on `HEAD`, once on `main`). `spawnParticles` is never dispatched.
- **Constants:** `stiffness 3`, `restDensity 4`, `dynamic_viscosity 0.45` (WaterBall 0.1, first port 0.25), `dt 0.13` (WaterBall/first port 0.20), fixed point `1e7`. **dt is per frame, not per second**: 2× speed at 120 Hz, 0.5× at 30 fps.
- **Grid:** `INIT_BOX [80, 60, 18]` = 86,400 cells used, cell buffer sized for 80³ (8.2 MB).
- **Particles:** `NUM_PARTICLES = 120000` is a **cap**. The fill uses `baseSpacing 0.5`, which gives **74,403 particles** (8 per cell, ρ/ρ0 = 2.0). Before `979e2ac`: cap 40,000 at spacing 0.66 ≈ 32,000. Bench tiers: desktop cap 120k → 74,403; mobile cap 60k → 55,594 (02 §1.5). `numParticlesMax = 200,000` (16 MB particle buffer, 6.4 MB posvel). "120,000 particles" was never a true count.

### 3.2 How the A was confined

- **Shape:** the medial axis apex (40, 48), feet (26, 12) and (54, 12), crossbar at y = 26 (`tcross 0.611`), each a **capsule of radius `halfW = 5`**, z-centre 9. The seed is a square cross-section (|z − zc| ≤ 5); g2p confines with the 3D distance (a round tube). Stroke/cap ≈ 0.22: a Black-weight rounded grotesque. The counter in the definition is at most 2.1 cells wide, so it closes at rest (02 §2.2).
- **Forces (g2p, after the APIC advect):**
  - `inflate 4.0` pushes outward inside the tube: the churn engine, never settles.
  - `gravity 0.05 · hold` pulls toward the axis.
  - `restoreK 0.1 · overflow · hold` recalls water outside the tube.
  - `hold = max(conf, leash)`, with `conf = 1 − speed/speedGate (1.5)` (speed measured from the grid *before* the forces, so a fast poke escapes) and `leash = overflow/leashRadius (60)`.
  - `ballistic 0.35` downward, gated **positionally** (`smoothstep(8, 16, dAxis)`; a speed gate collapsed the A in QA).
  - `explode` (0..1, the scroll drain) multiplies the confinement by `calm = 1 − explode` and adds a radial burst + gravity + damping.
  - Speed cap `mix(60, explodeCap 16, explode)`; un-stick nudge `toAxis·0.05` near dead boundary cells; predictive wall push at `[3, box − 4]`.
- **Earlier models:** a firm wall (`69efa96`), then home-lock with a velocity-gated restore (`058e109`). Both were dropped for dead water and recompose jams.

### 3.3 Seeding and beats

- `initFromHomes`: a uniform jittered fill of the A volume; instant reform after a drain.
- `initFountain` (LA NASCITA): spawn at y 2–5 under each column, `v = (home − spawn)/(216 · 0.13)` so it arrives in 1.8 s, plus a 5–20 % vertical overshoot. Plays once per load.
- **Scroll drain** (`HeroScrollSettle.tsx` on main): `explode = progress` of the hero's own height (`scrub: true`). Camera dolly `72 → 56`. Canvas fade after 0.78. GPU idle at 1.0. **Reform = an instant `initFromHomes` re-seed** when scrolled back below 0.02, a teleport rather than a recomposition.
- **Entry:** a GSAP "focus pull" (scale 1.14, blur 16 px → 0 over 1.9 s, a lens vignette).
- **Camera sway:** yaw `0.18·sin(0.35t)`, pitch `0.099·cos(0.35t)`, ramped over 2.5 s. Auto-rotate off. Drag-orbit and wheel-zoom disabled.

### 3.4 Interaction

- **Poke** (`updateGrid`): reads the **previous frame's filtered SSF depth** at the cursor. If the cursor is over fluid, it reconstructs the surface point. Every cell within `MOUSE_RADIUS 7` gets `(r² − d²)/r² · pokeForce 0.85 · mouseVel` (view-plane cursor velocity rotated to world). It needs a moving cursor over the water; a still cursor or a click does nothing. Hover is tracked on `window`.
- **Bug A8 (main):** `calcPlaneCoord` divides CSS px by backing px, so the poke is 1/DPR weaker on HiDPI. Flagged for G4 and never fixed on main; it was incidentally fixed on the bench.
- No click splash, no touch-specific path, no scroll-velocity coupling. Scroll only drives the drain.

### 3.5 Render: screen-space fluid (17 render passes per frame)

| pass | target | constants |
|---|---|---|
| depth splat | `r32float` view-z + `depth32float`, `frag_depth` written | sphere impostor `MLS_DIAMETER 1.4`, size `1.4·clamp(ρ/ρ0·4)`, **velocity-stretched** (`STRETCH 2.0`, area-preserving) |
| narrow-range depth filter ×4 (X,Y) | `r32float` ping-pong | `depth_threshold = 0.7·10 = 7` wu; `projected_particle_constant = blurFilterSize·1.4·0.05·(H/2)/tan(fov/2)`; `blurFilterSize 12` (main) / 21 (bench); `max_filter_size 100` |
| thickness splat (additive) | `rg16float` | r = Σ `0.038·√(1 − r²)`; g = r × `clamp(|v|/7)` (the foam signal) |
| thickness Gaussian ×3 (X,Y) | `rg16float` ping-pong | fixed 30 px radius, σ 10 px (not world-scaled) |
| shade (`fluid.wgsl`) | swapchain, `alphaMode "premultiplied"`, clear transparent | below |

**Shading at the peak (main):**
- Normals: from 4 depth neighbours through an NDC round trip (`near 0.1, far 300`), keeping the smaller |dz| per axis. This is the precision source of the bench's moiré (02 §5.1), plus world-space `ripplePerturb` at amplitude 0.035.
- Refraction: the **cubemap** along `refract(rayDir, N, 1/1.327 | 1/1.333 | 1/1.340)` per channel (dispersion), × Beer-Lambert `exp(−0.30·thickness·(1 − (0, 0.7375, 0.95)))`.
- Fresnel: Schlick F0 0.02, mixed with a mirror reflection of the cubemap (LOD 0). The thinnest rim is pulled to `edgeCool (0.04, 0.30, 0.40)`.
- Foam: `smoothstep(0.22, 0.62, speedAvg)·(0.25 + 0.75·facing) × 0.8`, sunset-warm white.
- Sun: a **backlit sun** at `(0.32, 0.11, −0.94)`, glint `pow(ndh, 420)·1.5` + sheen `pow(ndh, 22)·0.085`. `min(color, 1)` keeps the premultiplied invariant.
- Alpha: `max(smoothstep(0, 0.9, thickness), foam spray)`.
- Contact branch (`fs`): below `0.86·H` a wobble refraction, a melt (`refl_strength 0.85`) and a sparkling foam belt.

**Environment:** first WaterBall's "Sky Box – Sunny Day" (06-25), then `gen_sunset_cubemap.py` (06-29; luminous sea + glitter column from 07-14). The bench used `gen_workshop_cubemap.py` (dark floor, two tube fixtures, a light bank). All `rgba8unorm` 512²×6, LDR, **no mips**, sRGB bytes treated as linear, no tone map.

**Composite:** none inside the GPU. The canvas is transparent over the DOM (the sea video `SeaBackdrop` on main, the paper box on the bench). The water never sees what is behind it; its "background" is the cubemap at infinity. That is the root of the jelly read (02 §5.2).

### 3.6 Performance (what is actually known)

- **Measured:** only the rAF delta. The bench readout printed **"Frame 16.7 ms"** at 74,403 particles, DPR 1.5, desktop (`PROVENANCE.md`): vsync-capped, it proves "60 Hz on the dev machine" (the same PC whose RX 7800 XT the rivista probes report), nothing about GPU cost. `_webgpu_qa.mjs` 7/7 (resize, DPR cap) on 2026-08-05. **No timestamp query anywhere in the old engine.**
- **Derived per frame** (02 §6): ≈ 28.1 M `atomicAdd` (P2G, made worse by the 2× overdensity), ≈ 33–41 M impostor fragments across two splats, ≈ 61 M (depth filter) + ≈ 100 M (thickness blur) texel loads, 14 compute dispatches + 17 render passes.
- **Page level:** Golden Hour Lighthouse prod desktop 98/96/100/100, mobile 77 (07-13), 73–74 locally after the WP-10 fixes (`30a65a0`, 07-25), peak 84. Job order 85–86 mobile / 99 desktop. These are dominated by JS and LCP, not by the fluid.
- **Idle:** IntersectionObserver on `#hero` and the menu idle the loop. Otherwise the churn runs every frame forever; no sleep state exists.

### 3.7 Mobile

- **Main:** no tier at all. Same 74,403 particles, DPR cap 1.5, a full-viewport canvas, fixed camera distance 72. On a 390×844 portrait the visible width is ≈ 27 cells for a 38-cell-wide letter, so the A is **cropped**; only the legs show (image #8). The HANDOFF of 06-26 says «Su mobile resta da provare»; `04-3D-HERO-WATER-LOGO.md` §10 leaves the tier as an open question.
- **Bench:** `benchTier()` (≤ 767 px or ≤ 4 cores) → cap 60k (real 55,594), DPR 1.0, 350×230 box ≈ 3.39 px per cell. `thickness_gain` 2.0 over-thickens by ≈ 1.5× (the real particle ratio is 1.34).

### 3.8 Fallbacks and a11y

- **Main:** reduced motion or no `navigator.gpu` → the engine is never mounted; the CSS sunset gradient + the sea-video poster show. No still from the engine. `device.lost` → unmount to the same fallback.
- **Bench:** a captured still of this engine with a reason line; a `warming` state that hides the first 4.2 s of rendered time.
- The canvas is `aria-hidden` + `pointer-events: none`. Perpetual autonomous motion with no pause control (WCAG 2.2.2, 05 §4.2).

---

## 4. What was unfinished or disliked

| # | item | source | status when abandoned |
|---|---|---|---|
| U1 | **The letterform**: 3 capsules = rounded monoline sans, round terminals, no serifs, no stroke contrast, pointless apex, **closed counter** | 02 §2.2; 05 §2 ("inflatable sausage A"); images #1, #2, #9 | Inherent to the confinement; never addressed |
| U2 | **Balloon / pillow volume**: ρ/ρ0 = 2.0 fill, rest volume 2.67× the tube, stroke swells to ≈ 7.9 cells; the front face pressed flat against the z-wall at 14 | 02 §2.2; `979e2ac` (spacing 0.66 → 0.5 "to kill SSF spikes") | Traded spikes for balloons; never rebalanced |
| U3 | **SSF needles / spikes** on dispersal and thin sheets | Alberto 06-27 («effetti sullo schermo orribili»); `540cb50` ("scattered particles render spiky"); `979e2ac`; WATER-WAVE-PLAN §3 (cause = soft EOS + confinement ejecting sparse sheets) | Masked (densify, narrow-range filter, edge fade, white-tint removed in `3f25966`); the physical cause was never fixed |
| U4 | **Orange / iridescent rims** | `0f41ed3` (Alberto: orange contours unwanted); image #2 shows the halo again after `35b751c`'s `THICK_FADE 0.9`; dispersion + fresnel ≈ 1 on filter-rounded rims (02 §5.2) | Partly fixed, then partly regressed |
| U5 | **Jelly / gel body**, mottled green patches | 02 §5.2: refraction at infinity, per-channel Beer-Lambert on a hand-scale letter; images #1, #6 | Never addressed |
| U6 | **Honey motion** (γ = 5 EOS gives ≈ 0 restoring pressure near rest, viscosity 0.45, dt 0.13) | `docs/archive/WATER-WAVE-PLAN.md` §2–§4: a full fix plan "analysed, NOT applied" (γ 1, k 50, visc 0.1, 1 substep, soft reflecting container) | Parked; the plan itself says it fights the A's legibility |
| U7 | **Slow-motion feel never signed off** | HANDOFF `b4de047` "DA FINIRE 1"; `9445c18` "tuning still OPEN … not yet signed off"; `540cb50` "final baked values pending"; a `timeScale` knob proposed | Defaults frozen as G4 by agents, never by Alberto |
| U8 | **Recompose** not crisp after heavy splashing; reform after the drain is an instant re-seed pop; settling takes ≈ 4 s from cold | `058e109` open items; `WaterBallHero` reform path; bench F2 (`SETTLE_MS 4200`) | Worked around (hidden behind the still on the bench) |
| U9 | **Foam/spray layer ("Option B")**: ephemeral sprite particles that fade | HANDOFF `b4de047` "DA FINIRE 2"; `12-PARTICLE-PHYSICS.md` "Polish ancora aperto" | Never built (foam = a colour mix on the body only) |
| U10 | **`s_corr` cohesion, vorticity confinement, sleeping** | HANDOFF `b4de047` "DA FINIRE 3"; `12-PARTICLE-PHYSICS.md` | Never built; no sleep = the GPU never idles at rest |
| U11 | **Mobile**: no tier on main, cropped letter at 390, never verified on a phone; bench tier over-thickened | HANDOFF 06-26; `04-…LOGO.md` §10 open question; image #8; 02 §1.5 | Half-done on the bench only |
| U12 | **Performance unmeasured** (no GPU timestamps; vsync-capped readout) | 02 §6 | Never measured |
| U13 | **Frame-locked dt**: motion speed depends on the refresh rate; `Math.random` seeds: no two loads alike, stills not reproducible | 02 §1.4, §3 | Never fixed |
| U14 | **Mouse poke 1/DPR weaker on HiDPI** (A8) | `main:IMPROVEMENT_BACKLOG.md` A8, `444681b` | Flagged for Alberto, not fixed on main |
| U15 | **Moiré / hatched highlights** (NDC depth precision, thresholded wet coat) | 02 §5.1, image #9 | Found after abandonment (5-line fix proposed, never applied) |
| U16 | **No weight on the page**: no shadow, no caustic, no wet contact; the "real caustics" CV clause belonged to `ShallowWater` on /about, not the hero | 05 §4.4; CLAUDE.md §11 | Never built for the A |
| U17 | **Drain motion unverified** in automation (rAF paused in unfocused tabs); feel left to Alberto live | `3f25966`, memory `hero-rethink-g4-unlocked` | Never recorded as approved |
| U18 | **Code debt**: duplicate `copyPosition` + per-frame garbage on `HEAD`; full rebuild per resize on the bench; module-global `renderUniforms` (one engine per page); leva in every dev capture | 02 §6–§8 | Fixed on main only |

---

## 5. Why it read as "super realistic", and what the rivista A does differently

This is the archaeologist's reading of the evidence, not a decision.

| quality Alberto remembers | old engine (main) | rivista "Tipo d'acqua" today |
|---|---|---|
| **It is a real fluid** | 74,403 MLS-MPM particles; the shape *emerges* from physics | An SDF body; motion from a heightfield (waves), analytic drops and an analytic pour. No particles (M9 not built, so "particles" may not appear in copy) |
| **It is alive by itself** | Perpetual churn, camera sway, ripples: never still | G15: everything settles ≤ 5 s after the last input, then zero submits |
| **Touch → splash** | Sweeping the cursor sprays real droplets that arc and rain back | A click drops a drop: crater, rings, crown, beads ("molto" preset, D34). Hover moves the lamp and never deforms the letter |
| **Scale** | Full-bleed, ≈ 700 px tall at 1440×900 | A plate of 446×468 CSS with C ≈ 223 px at rest; full-screen only in S3 (glyphScale 0.95) |
| **Colour and light** | Saturated teal, backlit sunset, golden glints | Clear water, cool cast σ 0.6, paper studio. The physics finding of spec §9 confirms it reads as water but restrained |
| **Birth** | A fountain erupting from the sea into the letter (≈ 2–5 s) | A Plateau–Rayleigh pour into an invisible mould during the preloader (approved at R2) |
| **Letterform** | Rounded sans blob | The exact Cormorant A (contour to ≈ 0.1 texel) |

The old effect won on **life, scale and particles**. It lost on **form, material and stillness**. Every point Alberto rejected (spikes, orange rims, flat/2D stand-ins, the box) is on the form side. Every point he praised (water + reflection «perfect», «nella giusta strada», «super realistico») is on the effect side. A return "in that style" is mostly a question of particles, autonomous life and scale, not of the SSF letter.

---

## 6. The best version

**`main` @ `881f68c`** (fluid files last changed by `444681b`, 2026-08-06; look set on 2026-07-14 by `35b751c` photoreal + `7ea05ac` density + `ecb1b96` birth + `36192d4` contact, merged as `1f234f5`/`3dcaede`).

Why this one:
- It is the only version **deployed to production** and approved by merge ("mergia e continua"), the one Alberto lived with for two months, and therefore the one he means by "prima avevo".
- It has the full feature set: birth fountain, churn, speed-gated splash with ballistic arcs, velocity foam, sun glint, dispersion, contact line, scroll drain with dolly, resize and device-loss handling.
- Every later change is a regression for this question: the oil bench darkened, boxed, dithered and shrank it; the redesign branch lost the August hardening.

Runner-up for *colour alone*: `0f41ed3` (2026-07-01), the only explicit «perfect» on record (water colour + reflection), but with no glint, foam or arcs.

**To see it again side by side** (not run here): `git worktree add ../pf-main main`, `npm ci`, `npm run dev` in it, open `/` in real WebGPU Chrome in the foreground. Leva is visible in dev, and the preloader is skipped with `sessionStorage["at-preloader-seen"] = "1"`.

---

## 7. Portability into `public/proto/rivista/water/engine`

### 7.1 The engine's rules the old code must meet (CONTRACTS §0, §9)

- Plain JS ES modules with `// @ts-check`, WGSL in `wgsl/*.wgsl.js` template strings, **no build step, no npm deps** (`math.js` replaces wgpu-matrix).
- Pipelines through `PipelineCache` with `create*PipelineAsync`, resources inside error scopes. The cache already reserves a pipeline set named **`"mpm"`** (`gpu.js:143`).
- Core-safe formats. The old `r32float` render targets read with `textureLoad` and the blendable `rg16float` thickness are legal. The spec's M9 brick uses `r32float` storage with manual trilinear.
- Canvas `alphaMode "opaque"` with an **exact-paper composite** and manual sRGB OETF. The old premultiplied-over-DOM output has no place; anything must be drawn inside the engine's trace or composite.
- **Fixed 60 Hz accumulator** (`registerStep`), **mulberry32 seeds**, **honest motion** (`setBusy` only while something moves; idle = zero submits).
- Units **C = 1** (ink-bbox height), floor y = 0, the A on z = 0. The old sim lives in grid cells of an 80×60×18 box.
- Extension point: `export async function plugin(internals)` gets `device, render, registerStep, registerFrame, setBusy, glyph, placement…`, plus `render.registerPass / setChunk / setGroup`. No M0 file needs editing.

### 7.2 Path 1: bring the old hero back as it was

Possible, and technically the cheapest way to "see it again". Steps:
1. Strip the `.ts` with Node 22 `stripTypeScriptTypes` and rewrite the extensionless imports (02 §8).
2. Wrap the React host as a plugin: device, cubemap, 7 compute + 6 render pipelines.
3. Render SSF into offscreen textures and composite them over the paper in the engine's composite.
4. Bring the cubemap.

About 1–2 days (estimate, not measured). **What the contract says against it:**
- **Spec §2.1 fidelity:** the silhouette must be the exact Cormorant contour to ≈ 0.1 texel. The old letter is a 3-capsule sans and *cannot* become Cormorant. At its 46-cell cap height a Cormorant hairline is ≈ 1–2.5 cells, under the ≈ 3-cell floor of a quadratic MPM kernel + 1.4-cell impostors + filters (02 §2.3). The capsule field cannot represent serifs at any resolution.
- **Spec §0.5:** "B's thesis (MPM body is the resting letter …)" is rejected because "fill noise becomes normal noise, which is the moiré that sank the job-order still". §3.7: "MPM never represents the resting letter."
- **G15 (§0.3):** motion stops ≤ 5 s after the last input. The old churn is perpetual by design (its whole "life").
- **Budgets (§3.4–3.5):** the plate p95 is ≤ 2 ms on tier A (today 1.31). The old engine's ≈ 28 M atomics + ≈ 160 M texel loads per frame at full viewport were never timed and would need a new tier ladder.
- **Claims (§4.4):** "120,000" was never a real count (74,403). Any particle number must come from the engine.
- **Alberto's own verdicts:** R1 «Acqua, si va avanti» (09-20), R2/R2b (09-22) approved the current body, pour and click. The 05 dossier's trap #1 and #2 (Golden Hour world, balloon/jelly SSF A) are this path.
- **G4** is unlocked (memory, spec §3.7), so the gate is not the blocker; taste and the contract are.

### 7.3 Path 2: M9, the MLS-MPM splash layer (already scheduled; Q1 → (a), spec §8)

The spec's design (§3.7, M9 row of §5: E2, **12 h, stretch**; files `engine/mpm/**`, `scripts/port-mpm-kernels.mjs`; budget +0.3–0.6 ms dGPU / +1.5–2.5 ms iGPU while active, 0 otherwise):
- **Brick:** a local 64×64×32 grid at h = 0.016 C around the event (131,072 cells × 16 B = 2 MB), lazily created on the first event.
- **Seeding:** 2,048 / 1,024 / 512 particles per event (tiers A/B/C), hashed, rejection-sampled inside the body within 0.07 C of the hit, v = 1.1 C/s along the normal + 0.35 C/s radial.
- **Physics:** confinement **deleted**; gravity 12 C/s²; EOS γ 1, k 50, visc 0.08; dt 0.2, 1 substep, fixed 60 Hz; speed cap 1 cell/substep; fixed point stays 1e7.
- **Coupling:** particles entering the body are absorbed and become a face-wave impulse; clusters landing on the floor become beads (via the drops system); loners evaporate; sleep (0 dispatches) ≤ 2 s after the event.
- **Render:** no SSF. Splat the density into the brick, one binomial pass, iso-surface clipped outside the body (`φ' = max(φ, −f_body)`), smin-unioned into the same trace and optics.

**What carries over from the old code:**

| old file (lines) | M9 fate |
|---|---|
| `clearGrid.wgsl.ts` (18), `p2g_1.wgsl.ts` (66) | Port verbatim (rename bindings, brick dims as overrides) |
| `p2g_2.wgsl.ts` (97) | Port; the EOS exponent is a literal `5.` → 1; `stiffness` 3 → 50, viscosity → 0.08 |
| `updateGrid.wgsl.ts` (119) | Keep normalise + boundary; **drop** the SSF-depth mouse raycast and `RenderUniforms`; add gravity; free-slip on the brick walls |
| `g2p.wgsl.ts` (223) | Keep lines 50–101 (APIC gather + advect); **delete 103–209** (A confinement, explode, un-stick); add the body-SDF absorb (needs the glyph group / `sdf.wgsl.js` chunk), the CFL cap and the floor landing flag |
| `copyPosition` (25) | Once, or fold into the splat |
| `spawnParticles` | Drop (CPU-seeded per event) |
| `mls-mpm.ts` (618 HEAD / 669 main) | Rewrite as `engine/mpm/mpm.js`: buffers, PipelineCache set `"mpm"`, `registerStep`, `setBusy`; no `initFromHomes`/`initFountain`/leva/SplashParams |
| `render/**` (SSF, ≈ 1,300 lines), `camera.ts`, `WaterBallHero.tsx`, the cubemaps | Not ported |

**Old lessons that still apply:**
- Never put a backtick in WGSL template strings.
- Fixed-point headroom ±214.7 per cell (the spec's cap keeps node momentum ≤ 20).
- A speed gate on gravity collapses a held shape (moot once the confinement is deleted).
- The premultiplied clamp is moot with an opaque canvas.
- Velocity-stretched impostors (`STRETCH 2`) and velocity foam (`SPEED_REF 7`) are good ideas for the droplet look, if the brick iso-surface reads too smooth.

### 7.4 Path 3: "something in that style" inside the contract (options, flagged)

Each option is a lever on the qualities of §5. None is decided, and each is checked against the rule it touches.
1. **A larger M9:** a crown at the pour's apex impact and the click splash with real particles, as specced. It brings back the "particles" claim honestly. No rule broken.
2. **A scroll "release" beat:** at S3 the exact A gives some or all of its water to MPM (rejection-seeded from the body, like M9's seeding but over the whole letter), as the old drain did. Then it re-forms from the SDF, which never needs particles to hold a hairline. The cost scales with the count; it needs its own budget and an R-gate. Touches §3.7 ("MPM never represents the resting letter": respected, since the letter is gone while particles fly) and G15 (motion only while scrolling).
3. **Scale and colour knobs** (glyphScale at rest, σ, the environment): the cheapest way toward the old full-bleed, saturated impression. They touch R1/R3 decisions, so Alberto chooses.
4. **Perpetual life** (old churn, sway): forbidden by G15 unless Alberto lifts it, with a WCAG 2.2.2 pause control as the price (05 §4.2).

### 7.5 Bottom line

The old engine's *solver* is portable and already has a scheduled home (M9). Its *letter* is not portable: it is the part that caused every look complaint, and the spec and Alberto's R1/R2 verdicts rest on replacing it. The honest way to "reinsert it" is particles where water is free (M9, possibly the S3 release beat), on top of the exact Cormorant body.
