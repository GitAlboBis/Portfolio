# 40 · M9 plan: the MLS-MPM splash layer

> WebGPU lane, 2026-10-09. Status: **plan**, nothing built. Authority: spec 30 §3.7 (the solver), §3.3 / §3.4 / §3.5 / §3.6 (formats, passes, tiers, timestep), §4.4 (claims), §5 row M9 and §5.2 (kill rule), §8 Q1 → (a) (Alberto, 2026-09-18: "M9 is scheduled immediately after v1"), §9 (D19–D36). Binding beside it: `water/engine/CONTRACTS.md` §13–§21, the motion canon `docs/redesign/rivista-motion/10-motion-canon.md` §0 and §5, Alberto's taste (`_refs/hero-water/05-taste-history.md`: a radial slow-motion splash with visible droplets, then a smooth recompose; never needles, never an explosion; mobile parity).
>
> Read for this plan: the spec, CONTRACTS, `engine/index.js`, `render.js`, `body.js`, `drops.js`, `pour.js`, `waves.js`, `tier.js`, `gpu.js`, `wgsl/sdf.wgsl.js`, `wgsl/drops.wgsl.js`, `wgsl/shade-hero.wgsl.js` (chunk list), the host lines of `fx-water.js` / `fx-hero.js` / `dev-water.html`, the probes `lib.mjs`, `w2_body.mjs`, `w4_motion.mjs`, `w8_claims.mjs`, the dossier `45-old-fluid-a-dossier.md` §7.3, and the old solver `src/webgl/waterball/mls-mpm/*` (read only; it stays frozen there).
>
> Every cost below is an **estimate** until the M9 probes print `timestamp-query` numbers. Every "D-M9-n" is a proposed decision for the director to ratify (Alberto is away; nothing here waits on him except the two items marked **Alberto**).

---

## 0. Summary

- **What M9 adds.** Free water in the air simulated by MLS-MPM in a local brick: the **click splash** (M9a) and, as a gated add-on, a **spray at the apex impact of the pour** (M9b). The resting letter, the crater dent, the ring and the crown sheet stay analytic. MPM water is a density iso-surface clipped outside the body and smin-unioned into the **same** trace and optics. There is no SSF and no second renderer.
- **No compile on the S1 path (M9a).** The splash chunk and its four group-3 bindings ride the recompile that already happens after the pour settles: the held M4 commit (D20b). The compute kernels compile at idle after formation. The first event costs a bind-group swap and three allocations, never a compile. A click that lands before the kernels are ready gets today's analytic crown.
- **Sleep is guaranteed.** Every particle ends **absorbed** (a face-wave impulse), **landed** (a bead through `drops.landBead`), **harvested** (an analytic drop through `drops.spawn`) or **evaporated** (a loner) by 1.6 s after the event. 0 dispatches by 2.0 s, enforced by a CPU hard stop even if a readback stalls.
- **The rest look does not change.** With no live particles the splash hook returns its input, so the composed shade is pixel-identical to HEAD (acceptance: 0 differing px, plate / full / mobile).
- **Gates.** M9 stays behind `?mpm=1` until the w9 acceptance passes. M9b stays behind `?mpmpour=1` and off by default until **Alberto** sees it: the canon's refused list forbids re-choreographing the pour without him.

---

## 1. Findings that shape the plan (from the code, not the spec text)

| # | finding | where | consequence |
|---|---|---|---|
| F1 | The K2 hook (`liquidsSDF`) runs **before** K3 (`fillSDF`). During the pour, K3 cuts everything below it at the level plane, so MPM water unioned in K2 would vanish above the level. The pour unions its own liquids after the cut for this reason (CONTRACTS §17.1) | `sdf.wgsl.js` `bodySDFWith` L145–155 | A new hook **K4 `splashSDF(p, f)` after `fillSDF`** (D-M9-1) |
| F2 | The spec's seed speed (1.1 C/s along the normal + 0.35 C/s radial = 1.15 C/s) exceeds its own CFL cap. 1 cell per substep at h 0.016 C and 60 Hz is **0.96 C/s** | §3.7 table | The cap clamps the launch (direction kept); a 2-substep knob is the A/B (D-M9-4) |
| F3 | A uniform seed velocity translates the blob rigidly: no stretch, so no jet and no pinch | §3.7 "v = 1.1 + 0.35" | Peak values per spec, with a centre-weighted, depth-graded profile (D-M9-4) |
| F4 | The S1 boot compile is an accepted FAIL (364–428 ms against a 300 ms target), and the worst cold run leaves **14 ms** to the 2.6 s counter cap (D20). D20a/b allow one hero compile before the first run | spec §9.6, CONTRACTS §19.3 | The apex spray cannot ride the boot for free. It is split out as M9b with its own compile gate |
| F5 | The post-settle recompile already exists: waves + liquids + the pour's detach (`detachAfterS 0`) land in ONE recompile after "settled" (repeat visits: right after link). `HELD_CHUNKS` controls it | `waves.js` L73 and L141–193, `pour.js` L645 | The splash chunk joins `HELD_CHUNKS` and rides that commit: 0 extra compiles (D-M9-2) |
| F6 | The pour's 4 analytic crown droplets carry the 2 **seeded beads** (D22) and 2 droplets absorbed by the level (D26). A physical sim cannot land on the seeds | `pour.js spawnCrown` L775–805 | At the apex, MPM **adds** a spray; the 4 droplets stay (D-M9-3) |
| F7 | The `"sdf"` chunk's `requires` list lives in `shade-hero.wgsl.js` L889, not in `sdf.wgsl.js` | `shade-hero.wgsl.js` | The K4 hook is a one-token edit there + the default text in `sdf.wgsl.js` / `index.js` |
| F8 | ext0–ext3 are owned (pour, caustics, waves/drops, dent) and ext4 is the band's | CONTRACTS §15.2, §18.3 | MPM uses its own uniform at group 3, never a frame ext slot |
| F9 | Handoffs to the CPU (wave impulses, beads, drops) need a readback; `__water.advance(ms)` is synchronous | `dev-water.html` L262 | A fixed latency L = 4 steps + ACK/parking; probes call `mpm.flush()` between chunks of ≤ 4 steps (D-M9-6) |
| F10 | Analytic drops spawned while the liquids chunk is held are refused (`spawn` needs `live`, D31). `landBead` does not check `live`: its bead would not be drawn until the commit | `drops.js` L460–462 | During the pour (M9b) landed MPM clusters stay **parked in the MPM field** until drops is live |
| F11 | `drops.spawn` applies face adhesion to every kind except `"click"` | `drops.js` L618–624 | Harvested MPM droplets need a new kind `"free"` (ballistic, no adhesion) |
| F12 | ≤ 8 timed passes per frame (16 queries); ≤ 8 storage buffers per stage | `gpu.js` TimestampRing, core limits | MPM times 2 passes (a split profile alternates frames); its buffers are packed into 4 |
| F13 | Canon §5: no pointer forces, no perpetual motion, no second renderer; re-choreographing the pour needs Alberto | canon §5 | No drag-poke into MPM; sleep is mandatory; one shade; M9b default off |
| F14 | `lib.mjs` reads `RV_BASE` only in the uncommitted working tree; `ROOT` is hard-coded to the main checkout; a worktree has no `node_modules` | `git diff`, `lib.mjs` L8–11 | Checklist step 0 (§10) |

---

## 2. Units and constants

Brick-local grid units, as in the old kernels: positions in cells, mass in "particle mass" units, sim time `dt = 0.2` per fixed step.

| quantity | world | grid | note |
|---|---|---|---|
| cell h | 0.016 C (3.6 px at the plate, 7.4 px at full screen) | 1 | |
| brick | 1.024 × 1.024 × 0.512 C | 64 × 64 × 32 = 131,072 cells | one allocation; dims per event kind (§3.1) |
| step | 1/60 s (the engine's fixed accumulator) | dt = 0.2 | 1 s = 12 grid time units |
| velocity | 1 C/s | 5.208 cells/unit | v_C/s = 0.192 · v_grid |
| **CFL cap** | **0.96 C/s** | 5 cells/unit = 1 cell/step | clamped in the grid update and in G2P |
| gravity | 12 C/s² (slow motion, as everywhere) | 5.208 cells/unit² (Δv 1.04/step) | in the grid update |
| seed speed (spec) | 1.1 normal + 0.35 radial (peaks) | 5.73 + 1.82 → clamped to 5 | F2 |
| EOS | p = k (ρ/ρ0 − 1), γ 1, **k 50**, clamp p ≥ −c·k (cohesion c = 0 default) | ρ0 = 4 | sound speed √(k/ρ0) = 3.54 → 0.71 cell/step < 1 |
| viscosity | μ 0.08 | | |
| fixed point | 1e7 | i32 range ±214.7 | node momentum ≤ ρ0 · 5 = 20 at rest density, ≤ 40 at 2× compression |
| particle mass | m = ρ0 · V_seed / (h³ N) | | the seeded volume at rest density, at every tier: the dynamics do not depend on N |
| particles per event | 2,048 / 1,024 / 512 (tiers A / B / C) | capacity 2 × N (two overlapping events) | |
| iso | ρ̃ = 0.5 ρ0 | | smallest visible droplet ≈ 1 cell radius (0.016 C), about 50 particles at tier A |
| smin | k = 0.5 h = 0.008 C | | |
| latency L | 4 steps (67 ms) | | CPU handoffs, §3.5 |
| deadline | event + 96 steps (1.6 s) | | everything still alive is harvested |
| hard stop | event + 120 steps (2.0 s) | | the CPU stops dispatching whatever the readbacks say |

---

## 3. Data flow per event

### 3.1 Lifecycle and brick placement

| state | what exists | dispatches | shade |
|---|---|---|---|
| **dormant** (module listed, plugin loaded) | `internals.mpm`, constants, no GPU resource | 0 | the default K4 stub (identity) |
| **chunk-live** (after the held commit) | 1×1×1 placeholders at bindings 9–12, `ctl.x = 0` | 0 | the real splash chunk, early-out on `ctl.x == 0`: pixel-identical |
| **precompiled** (idle after formation) | the `"mpm"` pipeline set built | 0 | same |
| **armed** (at the click, 0.32 s before the impact) | the brick, the particle buffer, the field textures allocated once (≈ 3.5 MB tier A), bind-group swap | 0 | same |
| **active** | particles alive | sim per step + field per frame | `ctl.x = 1` |
| **draining** | only parked particles waiting for an ACK | sim only for ACK steps | `ctl.x = 1` |
| **asleep** | resources kept, field cleared | 0 | `ctl.x = 0`, bounds restored exactly (rest identity) |

**Brick placement** (CPU, at the event, written to the params ring):
- **click** (dims 64 × 64 × 32): x ∈ x_hit ± 0.512; y from `max(−2h, y_hit − 0.60)` up 1.024 C, so the floor lies inside the brick for any hit below y 0.59; z from z_hit − 0.128 to z_hit + 0.384 (8 cells behind the face, 24 in front).
- **apex** (M9b, dims 32 × 80 × 32 inside the same 131,072-cell allocation): x ∈ x_apex ± 0.256, y ∈ [−0.032, 1.248] (the floor and 0.25 C above the apex), z ∈ ±0.256.
- Particles never come within 2.5 cells of a brick face (except the floor): G2P harvests them first, so the 3×3×3 stencil never leaves the brick (an index guard stays as a safety net). Grid walls are **open**, with no sticky or free-slip wall: an invisible wall would show as water sliding along a plane. The floor is a real boundary (no-penetration on floor nodes).

### 3.2 The click splash (M9a), step by step

`s0` = the fixed step in which `drops.js` finds the click drop touching the face (`bodyF ≤ r`).

1. **Tap (t = −0.32 s).** `drops.tapAt` → the analytic click drop starts falling (unchanged). New: `I.mpm?.prepare()` allocates the resources on the first event ever and commits the real bind group (same layout → `render.refresh` keeps the pipeline and swaps the group). The fall hides this work.
2. **Impact (CPU, step s0, inside `drops.onStep → impact()`).** Unchanged: the crater dent and the ring impulse (`W.setDent`, `W.impulse`), the crown **sheet** (D25), the bubble. New: before the crown droplets, `if (I.mpm?.splash({ kind: "click", x, y, z: zs, r: d.r, step, id: d.id })) skip the droplets; else today's 12–14 droplets`. `splash()` returns false (→ analytic fallback, counted) when the chunk is not live, the `"mpm"` set is not built, the scene is not the hero, S3 is mid-scrub (0 < g < 0.72, see §3.6), the tier has MPM off, or the capacity is full. When it accepts: the event id e = `seedFor(seed, step, id)`, the brick placement, `internals.bounds.set("mpm", brickBox)` (drops widens the march box in its next `updateBounds`), `setBusy("mpm", true)`, and the step-s0 record in the params ring.
3. **GPU sim, per fixed step s (one encoder pass `mpm:sim`, `phase: "step"`, looping `ctx.steps` ≤ 4 inside one compute pass, then one `copyBufferToBuffer` of the events block into a staging ring):**
   1. `csSeed` (only at s0, N threads). Hashed per (particle index, e, try ≤ 16): a point in the ball of radius **0.07 C** around the hit; accept when the **GPU body SDF** (the rest body: `glyph` + `body` + `sdf` with `sdfHookDefaultsWGSL`, the same text the caustic trace composes) reads f < −0.25 h. The normal n̂ = −∇f at the hit (central differences). Velocity: `v = v_n(r, d) n̂ + v_r(r) r̂_t`, where r = the distance from the hit in the face plane, d = the depth below the face, `v_n = 1.1 (1 − 0.5 (r/0.07)²)(1 − 0.45 d/0.07)` C/s and `v_r = 0.35 r/0.07` C/s. The peaks are the spec's numbers; the profile makes the central column faster and its shallow tip fastest, so it stretches into a jet. Converted to grid units and clamped at the cap. An atomic counter tallies accepted and tried samples. State `INSIDE`, C = 0.
   2. `csSeedMass` (only at s0). V_seed = V_ball · accepted / tried. Every new particle gets m = ρ0 · V_seed / (h³ N). This is GPU-only: no CPU volume estimate and no 160 KB upload.
   3. `csClear` (ported `clearGrid`).
   4. `csP2G1` (ported `p2g_1`). Mass `m·w` and APIC momentum `m·w·(v + C·Δ)` in fixed point; mass-0 particles skip.
   5. `csP2G2` (ported `p2g_2`). Density gather; `vol = m / ρ`; **γ 1, k 50, μ 0.08**; momentum `−vol · 4 · stress · dt · w · Δ`.
   6. `csGrid` (ported `updateGrid`). `v = mom / mass`; `v.y −= g·dt`; clamp |v| ≤ 1/dt; floor nodes `v.y = max(v.y, 0)`. Deleted: the SSF-depth mouse raycast, `RenderUniforms` and the sticky box walls.
   7. `csG2P` (ported `g2p`). APIC gather (`C = 4 B`), advect, clamp |v|. Deleted: the A confinement, explode, ballistic gate, un-stick and walls (old L103–209). Then the **state machine** (§3.4) using the same GPU body SDF, with the fill cut `max(f, p.y − ext0.x)` while a pour runs (M9b). It writes absorptions into the face grid, landings into the floor grid and harvests into the coarse grid (fixed-point i32 sums of mass, m·x and m·v), and NaN-guards.
   8. `csAck` (only when the CPU wrote ACKs). Kills (mass 0) the parked particles of the acknowledged cells.
   9. `csEvents` (every step; one workgroup). Builds events from the three grids:
      - **ABSORB** per 0.064 C face cell with mass > 0.
      - **LAND** per floor local maximum whose 3×3 neighbourhood holds ≥ 5 particles and has not grown for 4 steps.
      - **HARVEST** per coarse cell flagged by G2P.
      - **evaporate** parked floor particles whose 3×3 sum is < 5 at settle.

      It also writes the tallies (live, seeded, absorbed, landed, harvested, evaporated, returned, nan; mass in fixed point) tagged with the step.
4. **CPU handoffs (MPM's step hook, registered after drops', at step s ≥ t + L).** It applies the readback of step t:
   - ABSORB → `waves.impulse({ x, y, radius: 0.06, strength: DROPS.waveCrown · clamp(r_eq / 0.022, 0.4, 1), step: s })`. Here r_eq is the equivalent sphere of the absorbed volume (V = mass · h³ / ρ0). Nearby cells are merged so MPM adds ≤ 4 impulses per step (`WAVE_MAX_IMP` is 64 per submission). The G3 radius floor holds.
   - LAND → `drops.landBead({ x, z, r: r_eq, squashMs: 80 })`, which squashes the cluster's sphere to a 75° cap and lets it dry (8 s), wet mark and merge (D19). Then an ACK.
   - HARVEST → `drops.spawn({ x, y, z, r: r_eq, vx, vy, vz, kind: "free" })` at the position extrapolated over the latency (harvested particles keep moving in MPM until their ACK, so nothing freezes in the air). Then an ACK. If `spawn` returns null (the drops cap), no ACK is sent and the particles keep flying in MPM.
   - Tallies → `mpm.stats`. If live = 0 and no event is pending: `ctl.x = 0`, a last field clear, `bounds.set("mpm", null)` one step before `setBusy("mpm", false)` (the rest box comes back exactly, which keeps the rest pixel identity). Asleep.
5. **GPU field, per presented frame while active (compute pass `mpm:field`, `phase: "frame"`).** `csSplat` → `csSmooth` → `csCoarse` (§4.1). The shade then draws the splash through K4.

**Timeline** (t after the impact):

| t | event |
|---|---|
| 0 | the ring, sheet and dent start; particles seeded |
| +33 ms | first particles cross the face |
| +67 ms | first CPU handoffs (absorbed rings) |
| 0.1–0.6 s | the jet stretches and pinches; droplets fly |
| ≤ 1.2 s | most particles land or are absorbed (the cap makes the fall slow) |
| 1.6 s | the deadline harvests whatever is still in the air |
| ≈ 1.7 s | asleep |
| 2.0 s | hard stop |

### 3.3 The apex spray during the pour (M9b, `?mpmpour=1`)

- **Trigger.** `pour.js onStep` at the impact (`tp ≥ tImpact`): after `spawnCrown(step)` (unchanged), `I.mpm?.apexCrown({ x: L.xApex, y: L.yApex, step })`.
- **Seed.** An emitter, not a body seed (the mould is empty at the apex at t 0.25). It emits N_apex = 25 % of the tier count over 9 steps (0.15 s) inside the pool sphere (r = 1.3 r0 = 0.023 C on the apex). Velocity: radial in x-z 0.5–0.9 C/s plus upward 0.4–0.8 C/s, hashed and capped. Total volume V_apex = 1.2e-4 C³ (a look knob).
- **Absorption.** The GPU body test includes the fill cut from `frame.ext0.x`: water entering the filled section below the level is absorbed (a ring, through the held-but-integrating waves, D20b). Water entering the empty mould above the level falls through it until the level takes it, as the analytic droplets do (D26).
- **Landing.** Drops is not live during the pour (F10). Landed clusters stay **parked in the field**: drawn by MPM, no dispatches after the deadline. The ACK waits for `drops.live` (the post-settle commit) and the handoff to `landBead` happens then. The seeded beads keep landing exactly on their seeds (D22).
- **Compile path.** This is the only part that needs the splash chunk in the **boot** shade. When `"pour"` and `"mpm"` are both listed:
  - `loadModule("shade-hero")` composes the real splash chunk, exactly like D20a does for `"fill"`;
  - `attachPlaceholder({ pour, mpm })` adds bindings 9–12;
  - the boot keeps ONE hero compile, a larger one.
- **Ship gate.** Boot compile median delta ≤ 25 ms over 6 interleaved cold compiles; `counterDone` < 2.6 s in 10 of 10 cold runs; `w6_pour` all phases green; **Alberto's look review**. Otherwise M9b stays off and the analytic crown stays (spec §5.2, line 850).

### 3.4 Particle states (G2P, one u32 per particle packed into the vec3 padding, with the event id)

| state | enter | effect |
|---|---|---|
| `INSIDE` | seeded in the body | drawn by nobody: the clip `max(φ, −f_body)` hides it |
| `AIR` | f_body > +0.5 h | free fluid, drawn |
| `ABSORBED` | AIR and f_body < −0.25 h (re-entry) | mass 0 now; its mass and normal momentum go to the face cell → ABSORB |
| `RETURNED` | INSIDE for 15 steps | mass 0, no impulse (it never left the water) |
| `LANDED` | AIR, y ≤ y_floor + 0.5 h, v.y ≤ 0 | parked (v = 0, still splatted) → LAND or evaporate |
| `HARVEST` | within 2.5 cells of a side face, or the deadline | keeps flying until ACK → HARVEST event |
| `DEAD` | ACK, evaporation, NaN guard | mass 0 |

The particle struct stays **80 B**: `position vec3f, flags u32` (state 4 bits, event 12 bits), `v vec3f, mass f32`, `C mat3x3f`. The old struct left those two slots as padding. Mass sums use fixed-point integer atomics, so every reduction is order-independent and the GPU state is deterministic per step.

### 3.5 Latency, ACK and determinism

- Each sim submission ends with `copyBufferToBuffer(events → staging[i])`, a ring of **6** `MAP_READ` buffers. At the next `registerFrame` the plugin calls `mapAsync` on the copies submitted earlier, never awaited. If every staging buffer is busy, the events block is not cleared, so nothing is lost.
- Events tagged t are applied at **exactly step t + L**. A readback that arrives later is applied on arrival and counted in `stats.late` (it must read 0 in the probes).
- ACKs go to the GPU in the next sim submission (a uniform list of cell ids + step). Until then the parked or harvested particles stay drawn, so the handoff overlaps for one step at most. Both shapes are smin-unioned, so the overlap neither flashes nor double-darkens.
- **Manual mode** (`?debug=1&manual=1`): `__water.mpm.flush()` awaits every outstanding readback. The probes advance ≤ 4 steps per call and flush in between, so strips are step-exact and 60 Hz and 120 Hz runs produce identical particle buffers at equal step indices.

### 3.6 Concurrency and scope rules

- **Two events overlapping.** A second impact inside the current brick (minus 0.1 C margin) seeds into the same brick with its own event id (capacity 2N). An impact outside it, or with the capacity full, returns false: the analytic crown plays.
- **Scene.** MPM runs only while the hero scene is current. A switch to the band freezes it: no dispatches, the field stays. It resumes on return.
- **Steps per submission.** MPM takes ≤ 4 steps per submission and drops the rest (`stats.skippedSteps`). This keeps `warm(60)` from fast-forwarding a splash.
- **S3.** MPM refuses events while 0 < g < 0.72, so the analytic crown plays there. TUVERI is visible in that range and the no-text-over-water probe was never run with a 1 C brick.
- **Never.** Reduced motion, gl-off, case pages (`HERO_MODULES` only) and the band.
- **No pointer forces.** No drag-poke into MPM: canon §5, "pointer as a light, not a force".

---

## 4. Rendering

### 4.1 Field passes (frame phase, while active)

1. `csSplat`: every particle with m > 0 (AIR, LANDED, HARVEST) adds `m·w` (quadratic B-spline, 27 nodes) into a `u32` fixed-point accumulator of 64 × 64 × 32 cells (512 KB). Integer atomics keep it order-independent. The accumulator is cleared by `encoder.clearBuffer` before the pass. The pass also records the tight AABB of live particles (atomic min/max) in the `mpmLive` block.
2. `csSmooth`: **one** 3 × 3 × 3 binomial pass (`[1,2,1]³ / 64`), decoded to `f32` and written to **`mpmField`, a 64 × 64 × 32 `r32float` 3D texture** (storage write, sampled with `textureLoad`; no `float32-filterable`, as §3.3 says). It also records:
   - the max |∇ρ̃| (finite differences, atomicMax on the f32 bits) in `mpmLive`, the self-calibrated Lipschitz scale;
   - per 4³ block, the max ρ̃ into a 16 × 16 × 8 occupancy.
3. `csCoarse`: **one workgroup** (256 threads, 2,048 cells, 8 KB of workgroup memory). Occupancy (max ρ̃ > 0.5 iso over the block plus one fine voxel) → an 8-iteration 26-neighbour chamfer → `mpmCoarse` (`r32float` 16 × 16 × 8, in coarse cells). This is the empty-space skip.

### 4.2 The K4 hook and the splash chunk

`sdf.wgsl.js bodySDFWith` changes in one line: `return splashSDF(p, fillSDF(p, f));`. The default `fn splashSDF(p : vec3f, f : f32) -> f32 { return f; }` joins `sdfHookDefaultsWGSL`, so the floor bake and the caustic trace still see the rest body. MPM water therefore casts no traced caustic; caustics are off on the hero anyway (R1).

Chunk `"splash"` (`engine/mpm/wgsl/mpm-chunk.wgsl.js`), a sketch:

```wgsl
@group(3) @binding(9)  var mpmField  : texture_3d<f32>;            // r32float rho~, textureLoad only
@group(3) @binding(10) var<uniform> mpm : MpmShade;                 // ctl (active, dims), origin + h, iso, k, clamp, coarse
@group(3) @binding(11) var mpmCoarse : texture_3d<f32>;            // r32float coarse distance (coarse cells)
@group(3) @binding(12) var<storage, read> mpmLive : array<u32, 8>;  // tight AABB (cells), slope (f32 bits), live
fn splashSDF(p : vec3f, f : f32) -> f32 {
  if (mpm.ctl.x == 0u) { return f; }                                // asleep: exact identity
  let dBox = mpmBoxDist(p);                                         // to the TIGHT live box + 2 h
  let k = mpm.field.z;
  if (dBox > f + k) { return f; }                                   // cannot change f (smin is exact there)
  var phi = dBox;
  let dc = mpmCoarseDist(p);                                        // (coarse - 1) * 4 h, conservative (L-inf <= L2)
  if (dc > 0.0) { phi = max(phi, dc); }
  else { phi = max(phi, clamp((mpm.field.x - mpmTrilinear(p)) * mpmSlopeInv(), -mpm.field.w, mpm.field.w)); }
  return bodySmin(f, max(phi, -f), k);                              // clipped outside the body, then smin (k 0.5 h)
}
```

- Every consumer of `bodySDF` / `bodySDFSmooth` sees the splash: the primary march, coverage AA, the normal and specular-AA taps, the inner march (refraction, TIR, Beer cobalt over the real path), re-entry, the `holes` / `mask` / `normal` views, and the keep-out mask.
- **Lipschitz.** `max`, `smin` and the box distance are 1-Lipschitz. The density term is scaled by `1 / max(|∇ρ̃|_max, floor)` and clamped to ±2 h, so the step scale 0.75 stays valid. `?dbg=holes` must read 0 during a splash.
- **Normals.** Trilinear interpolation gives a C0 field, so cell facets may show in highlights (3.6 px cells at the plate). Two A/B options, judged in a 400 % crop:
  - `?mpminterp=quad`: quadratic B-spline, 27 `textureLoad`, C1;
  - `?mpmsmooth=2`: a second binomial pass.

  Hardware filtering of an `rgba16float` copy is a third option but deviates from §3.3; flag it if chosen.

### 4.3 Bindings and limits

- **Group 3** gains 9–12 (`FRAGMENT | COMPUTE`, like 5–8). They are declared by the chunk and added with `internals.hero.group.setEntry`. The caustic trace's own layout uses 8–10 in a **separate** layout, so there is no conflict (§15.3).
- **Hero shade after M9.** 8 sampled textures (9 with caustics) of the 16 allowed, 5 uniform buffers of 12, 2 fragment storage buffers of 8.
- **Sim layout.** Group 0 frame, 1 glyph (`render.glyphLayout`), 2 empty, 3 = MPM's own: binding 0 is the **same** body uniform buffer, so the `"body"` chunk text is reused verbatim, as the caustic trace does. Then particles, cells, aux (floor, face and coarse grids), events (tallies, live, ACK list) and the params ring (uniform, dynamic offsets, 256 B stride, 64 steps). That is 4 storage buffers of 8.
- **Field layout.** Particles, accumulator and live block are 3 storage buffers; field and coarse are 2 of 4 storage textures.

### 4.4 The compile path (no recompile of the boot shade, no stall on the click)

| moment | what compiles | where |
|---|---|---|
| boot / S1 (M9a) | nothing new; the boot shade keeps the default K4 stub (an inlined identity: identical cost) | — |
| plugin init (before `linked`) | nothing: `mpm.js` queues `{ splash chunk }` + placeholder entries 9–12 into `heroCommit` as a **held** chunk | `waves.js` committer |
| pour `"settled"` (or right after link on a repeat visit) | the ONE post-settle recompile, now with waves + liquids + pour detach + splash; the previous shade draws meanwhile; the result is pixel-identical at rest | Dawn workers, off the S1 path |
| idle after formation (`fill ≥ 1`, the hero commit resolved, `render.pending` settled, the band build-ahead done, then `requestIdleCallback` or a 200 ms timeout) | the `"mpm"` set: ≈ 9 sim kernels + 3 field kernels via `PipelineCache.compute(…, "mpm", …)`, cold ≈ 33–45 ms each; the two that include the body SDF more | Dawn workers; they never hold a swap (CONTRACTS §21) |
| first event | allocation + one bind-group swap (same layout) | no compile |
| a click before the set is built | the analytic crown, `stats.fallbacks++` | — |

`live` follows the active shade (D31): `mpm.live` is true when the drawing shade declares `@binding(9) var mpmField`.

---

## 5. Tiers, budget, GPU timing

| tier | particles / event | capacity | sim per step (est.) | field per frame (est.) | shade delta in a splash (est.) | splash p95 target |
|---|---|---|---|---|---|---|
| A (dGPU) | 2,048 | 4,096 | 0.10–0.25 ms | 0.04–0.10 ms | +0.2–0.5 ms | **plate ≤ 2.6 ms** (M9 acceptance; HEAD measures 1.31 with the analytic splash, CONTRACTS §19.3) |
| B (iGPU / phone) | 1,024 | 2,048 | 0.5–1.0 ms | 0.2–0.4 ms | +0.6–1.2 ms | ≤ 8 ms (tier B dock budget) |
| C | 512 | 1,024 | — | — | — | ≤ 12 ms |

- Memory after the first event: ≈ 3.5 MB at tier A (particles 320 KB, grid 2 MB, accumulator 512 KB, field 512 KB, small grids and rings ≈ 60 KB). It is kept until `destroy()`. Nothing is allocated before the first event (§3.3 of the spec).
- **Timing.** Two timed passes, `mpm:sim` and `mpm:field`; the existing passes (shade, waves, wet; caustics off) leave room under the 8-pass ceiling. `?mpmprof=1` splits them per kernel (seed, clear, p2g1, p2g2, grid, g2p, events | splat, smooth, coarse) and alternates frames (sim kernels on even frames, field kernels on odd) to stay ≤ 8. The HUD and `mpm.stats.passes` report 1 s medians and the p95 over the splash window. Probes run with `--enable-webgpu-developer-features` for unquantised timestamps (`lib.mjs` does).
- **Levers if the plate p95 misses 2.6 ms, in this order:**
  1. indirect dispatch of clear / smooth / splat over the tight AABB (`dispatchWorkgroupsIndirect`, args written by `csSplat`);
  2. the field passes at 30 Hz while the sim keeps 60 Hz;
  3. tier A count 2,048 → 1,024;
  4. the splash term skipped on secondary paths (re-entry only sees the letter);
  5. MPM off on tier C (analytic crown).

  If the levers fail, the kill rule applies (§8).
- S3 at full screen (2.9 MP) is not an M9 acceptance. The DPR ladder (p95 ≤ 5 ms) guards it, and w9 reports the number.

---

## 6. Files

### 6.1 New

| file | role |
|---|---|
| `water/engine/mpm/mpm.js` | the plugin `export async function plugin(internals)`; `MpmSystem`:<br>- lifecycle §3.1, events, brick placement, lazy resources, the passes (`mpm:sim` and `mpm:field`, both kind `"encoder"`: the events copy and the accumulator `clearBuffer` need the command encoder; each opens one timed compute pass through `ctx.timestampWrites`), the readback ring, handoffs, ACKs, sleep, the hard stop, destroy;<br>- `internals.mpm = { splash(o), apexCrown(o), prepare(), flush(), setVisible(on), live, ready, active, info, stats, setKnobs(k), readParticles() }` (`setVisible(false)` forces `ctl.x = 0` for one capture: the probe's MPM-only mask);<br>- registers `registerStep("mpm")` (after drops) and `registerFrame("mpm")`, plus `registerDestroy`, `setBusy("mpm")` and `bounds.set("mpm")` |
| `water/engine/mpm/config.js` | `MPM` constants (§2), unit conversions, tier counts `{ A: 2048, B: 1024, C: 512 }`, knob defaults; `tier.js` stays untouched |
| `water/engine/mpm/kernels/*.wgsl.js` | the ported kernels (§6.2), then edited: `clearGrid`, `p2g_1`, `p2g_2`, `updateGrid`, `g2p` keep their names; `spawnParticles` → `seed`; `copyPosition` deleted; new `seedMass`, `ack`, `events` |
| `water/engine/mpm/wgsl/mpm-common.wgsl.js` | Particle / Cell structs, fixed point, B-spline weights, PCG hash, `MpmStep` params |
| `water/engine/mpm/wgsl/mpm-field.wgsl.js` | `csSplat`, `csSmooth`, `csCoarse` |
| `water/engine/mpm/wgsl/mpm-chunk.wgsl.js` | the `"splash"` chunk (§4.2) and `debugViews`: `mpm` (a ρ̃ slice), `mpm-coarse` |
| `water/engine/mpm/kernels/PORTED.md` | not a report: a 10-line provenance note (source paths, sha256, date, the frozen-source rule) written by the port script |
| `water/dev/mpm.html` | the bench page (§6.4) |
| `scripts/port-mpm-kernels.mjs` | the one-off port (§6.2) |
| `scripts/probes/water/w9_mpm.mjs` | the probe (§6.5) |

### 6.2 `scripts/port-mpm-kernels.mjs`

- Node 22.17 (`node:module` `stripTypeScriptTypes`, mode `"strip"`; the ExperimentalWarning is expected).
- **Reads** `src/webgl/waterball/mls-mpm/{clearGrid,p2g_1,p2g_2,updateGrid,g2p,spawnParticles,copyPosition}.wgsl.ts` and `mls-mpm.ts`, **never writes there**.
- **Rewrites** specifiers `'./x.wgsl'` → `'./x.wgsl.js'`. `mls-mpm.ts` becomes `kernels/mls-mpm.ref.js`, a reference that nothing imports.
- **Headers.** It prepends to each file a header comment (source path, sha256, date, "edit here; `src/webgl/waterball/**` stays frozen") with no backtick inside the template strings, and writes `kernels/PORTED.md`.
- **Refusals.** It refuses to overwrite a target that differs from its own port output. `--check` exits 1 if a source's sha256 no longer matches the header, so the frozen solver is proven untouched.
- **Commits.** The raw port is committed alone; the edits come in later commits, so `git diff` shows exactly what changed in the solver.

### 6.3 Hooks into existing files (minimal, additive)

| file | edit | size |
|---|---|---|
| `wgsl/sdf.wgsl.js` | `DEFAULT_SPLASH_WGSL`; append it to `sdfHookDefaultsWGSL`; `return splashSDF(p, fillSDF(p, f));` | 6 lines |
| `wgsl/shade-hero.wgsl.js` L889 | `"sdf"` requires + `"splash"` | 1 token |
| `index.js` | `DEFAULT_SPLASH_WGSL` (identical text); a `DEFAULT_HOOK_CHUNKS` entry; `KNOWN_MODULES.mpm = ["./mpm/mpm.js"]`. M9b only: compose the real splash chunk at boot when `"pour"` and `"mpm"` are both listed (the D20a pattern) | 8 lines (+6 for M9b) |
| `body.js attachPlaceholder` | M9b only: `o.mpm` → placeholder entries 9–12 | 6 lines |
| `waves.js` L73 | `HELD_CHUNKS` + `"splash"` | 1 token |
| `drops.js` | `impact()`: the `I.mpm?.splash(…)` gate around the crown-droplet loop only (dent, ring, sheet, bubble unchanged); `tapAt()`: `I.mpm?.prepare()`; `onStep`: no adhesion for kind `"free"` | 8 lines |
| `pour.js` | M9b only: `I.mpm?.apexCrown({ x, y, step })` after `spawnCrown(step)`; the absorbed / stray rules stay | 1 line |
| `dev-water.html` | `detectModules`: push `"mpm"` when `mpm/` is listed and `?mpm=1`; forward `?mpmpour` and the `mpm*` knobs; `__water.mpm` | 6 lines |
| `fx-water.js` | `HERO_MODULES` + `"mpm"`; filter it out unless `?mpm=1` (like caustics) and under reduced motion; `stats.particles` and `fx:gl:stats.particles` plumbing | 8 lines |
| `fx-hero.js` L596 | the caption token (§7), **TBC copy** | 2 lines |
| `scripts/probes/water/w8_claims.mjs` | the live derivation learns the particles token | 3 lines |
| `scripts/probes/water/lib.mjs` | `ROOT = process.env.RV_ROOT \|\| …` (worktree lanes; §10 step 0) | 1 line |
| `CONTRACTS.md` | new §22 (M9): hook K4, bindings 9–12, `internals.mpm`, events, states, numbers | doc |

Nothing in `src/webgl/waterball/**`, `glyph.js`, `render.js`, `gpu.js`, `tier.js`, `caustics.js` or `band.js` changes. `assemble.mjs` changes only if a `parts/*.html` file changes, which this plan does not need. If any part is touched, run `node public/proto/rivista/assemble.mjs` and then `--check`.

### 6.4 `water/dev/mpm.html`

The pattern of `dev/pour.html`: the bench (`dev-water.html?debug=1&manual=1&mpm=1`) in an iframe, driven through `__water`.

- **Targets.** Stem, crossbar, hairline, serif, paper, apex crown (M9b).
- **Views.** Plate, full (g 1), side (yaw −70°, for the jet profile), mobile (tier B).
- **Knobs.**
  - Solver: `substeps 1 | 2`, `k`, `mu`, `rho0`, `cohesion`, `count`.
  - Seeding: `seedR`, `vN`, `vR`, `depthGrade`, `centreGrade`, `jetTilt`.
  - Field and shade: `iso`, `smooth 1 | 2`, `interp tri | quad`, `smin k`.
  - Handoffs: `L`, `deadline`, `harvest isolated 0 | 1`, `land threshold`, `bead squashMs`.
  - `keepSheet 1 | 0` (A/B of D-M9-3).
- **Read-outs.** The HUD per pass (and per kernel with `mpmprof`), live count, the tallies and the accounting error, `late`, `fallbacks`, the events log.
- **Controls.** A 12-frame strip at 50 ms (rest and side views); play / step / scrub; "soak" (auto-click every 2.5 s).

### 6.5 `scripts/probes/water/w9_mpm.mjs`

Headless through `launch()` of `lib.mjs` (never a visible window). Every page `assertAdapter` (no fallback adapter). Shots go to `_shots/water-hero/M9/`, the report to `w9_report.json`. Phases, each with its pass rule:

| phase | how | pass |
|---|---|---|
| `baseline` | **run on the untouched worktree first**: offscreen captures plate / full / mobile at rest, twice | self-diff 0 → `head_<view>.png` |
| `rest` | `?mpm=1`, wait for `mpm.live` and idle | 0 differing px vs `head_*` at all 3 views; `mpm.info.allocated === false`. Also run `w2_body identical`: PASS |
| `residue` | a splash, then advance 20 s (the beads dry and their marks fade) | capture = `head_*` (0 px); `ctl.x 0`; bounds = the rest box |
| `compile` | `index.html` first visit (S1) and repeat visit, `?mpm=1` | `shade:hero` compiles before the first run = HEAD's count (1); total hero compiles in the visit = HEAD's count; no `mpm:*` pipeline before `"settled"` (repeat: before linked + idle); 0 compiles across the first click; that click's rAF gap ≤ 20 ms |
| `strip` | manual mode; a click on the stem; 12 frames at 50 ms at the full view (A ≈ 460 px) and the side view; MPM-only mask = the capture with `mpm.setVisible(false)` diffed against the capture with it on, at the same step (\|Δ\| > 6/255) | **jet pinch**: the connected components ≥ 4 px detached from the letter go from 0 to ≥ 3 within 0.1–0.6 s; no component < 4 px persists 2 frames (no specks or needles) |
| `sleep` | live mode; one click; sample `mpm.stats.dispatches` and the engine submits | dispatches constant from impact + 2.0 s; `mpm.active false`; `bounds.mpm null`; the engine idles 5.0 s after the last input (submits constant) |
| `determinism` | the same click advanced at 16.67 ms and at 8.33 ms per call, flushing between | `readParticles()` sha at equal step indices identical; tallies identical; `drops.readState()` identical |
| `soak` | (a) accelerated: an in-page loop, 36,000 steps (10 min) in chunks of 4 with `flush()`, an event every 150 steps cycling 6 targets; (b) 120 s real time (ticker live, auto-click every 2.5 s) | NaN counter 0; per minute \|Σ outcomes − Σ seeded\| / Σ seeded < 0.5 %; in-flight \|Σ node mass − Σ particle mass\| / Σ < 1e-4 per step (sampled); `late` 0 (b); `skippedSteps` 0; JS heap growth < 5 MB (b); buffer sizes constant |
| `perf` | `view=plate`, DPR 1.5, `?awake=1`, 20 clicks 1.5 s apart; frames in [impact, impact + 1 s] | **total p95 ≤ 2.6 ms**; the per-pass p95 table (`mpm:sim`, `mpm:field`, shade, waves, wet); report only for tier B / C forced, mobile dock and full g = 1 |
| `holes` | frozen at impact + 0.15 / 0.3 s, `debug.holesCount()` at yaw −25…+15° | holes 0, false hits 0 |
| `paper` | w0's 20 untouched points per view during and after a splash | exact bytes (246, 243, 236) |
| `mobile` | 390 × 844 @3x, tier B, a tap on the stem | the splash strip; p95 ≤ 8 ms; consoles clean |
| `copy` | the instrument sampled every 100 ms through a click, at 1024 and 1440 | no "particles" before the first event or after sleep; during the event the string = `{n} particles · WebGPU · {ms} ms GPU · DPR {dpr}` derived from the latest `fx:gl:stats` (n = the spawned count); 2 lines at 1024; reduced motion and gl-off never show it; `w8_claims` PASS |
| `fallback` | `?mpmfail=pipeline` | the analytic crown plays; exactly one `console.warn`; no error |
| `pour` (M9b) | `?mpmpour=1`, 10 cold S1 runs + `w6_pour`, `w5_bootsplit` | the §3.3 ship gate; the seeded beads land on their seeds; the apex spray strip |
| `console` | every phase | 0 errors, 0 warnings (except `fallback`), 0 `__gpuErrors` |

Page-level regression after M9 (existing probes, against 5179): `w0_paper`, `w2_body` (smoke, holes, identical), `w4_motion` (with `?mpm=0` the strips must be hash-identical to HEAD), `w5_boot` ×3, `w5_bootsplit`, `w5_timeline`, `w6_pour`, `w7_band`, `w8_perf`, `w8_claims`, and the visual gate at 1440 × 900 + 390 × 844 (headless).

---

## 7. Copy and claims (spec §4.4)

- **Instrument (flagged TBC for Alberto).** `{n} particles · WebGPU · {ms} ms GPU · DPR {dpr}`, shown **only while MPM water is on screen**:
  - n = `stats.particles`, the count the engine spawned for the splash being drawn (2,048 / 1,024 / 512, or the M9b emitter count); 0 → no token;
  - it replaces the rays token while it shows (one count at a time; caustics are off on the hero anyway);
  - the line changes at the existing 1 Hz `fx:gl:stats` cadence and on idle, as a plain text swap (no fade, no count-up, canon §5);
  - "2,048 particles" is shorter than the measured 2-line "65,536 caustic rays", so 1024 should stay at 2 lines; the `copy` phase measures it.
- **Unchanged.** The label "Fig. 01 · An A of water, rendered live", the colophon "GSAP, Lenis, WebGPU", the `.hr-still` line and the poster alts. The static pages still never print "particles" (the `w8_claims` NEVER list stays on the static hero, figcaptions, colophon and preloader).
- **Still never.** A particle count for the resting letter; "simulation" for the letter; "physically accurate"; "real caustics"; "MLS-MPM" on the page (it is true but jargon, and not needed). `stats.n` stays = rays (shape compatibility, §4.1).
- **Tell Alberto (not an edit here).** PRODUCT.md §9's CV clause "a 120,000-particle fluid simulation held in the shape of a living letter 'A'" stays false after M9: the letter is designed, and the old count was 74,403. A true wording once M9 ships: "a WebGPU water letter with an MLS-MPM particle splash (2,048 particles per splash on desktop)".

---

## 8. Risks and fallbacks

| risk | sign | response |
|---|---|---|
| **Budget**: plate p95 > 2.6 ms in a splash | `perf` | the levers of §5 in order. Then the kill rule (spec §5.2, line 850): **ship M0–M8 without M9**; `?mpm=1` never becomes the default; the analytic crown stays |
| The post-settle recompile grows | `w8_perf compile` | off the critical path; report the delta. If it exceeds +80 ms, move the splash chunk to its own idle commit (a second background compile, still pixel-identical at rest) |
| **M9b breaks the S1 margin** | `pour` gate | M9b stays off (the analytic crown at the apex); M9a is unaffected |
| The CFL cap makes the launch short and the fall floaty | the strip reads "syrupy" | the `harvest isolated` handoff (isolated clusters → `"free"` analytic drops, uncapped); `substeps 2` (cap 1.92 C/s, sim cost ×2) |
| A uniform jet sprays into mist instead of droplets | the pinch phase fails | `cohesion` (p ≥ −0.04 k, proposal B's weak cohesion), `centreGrade` / `depthGrade` |
| Cell facets in highlights | 400 % crop | `interp quad` or `smooth 2` (§4.2) |
| Holes or over-steps from the density field | `holes` > 0 | slope floor up, clamp ±1 h, the coarse skip bias |
| Readback latency > L | `late` > 0 | L = 6; the ring of 6 already covers it; a manual flush keeps the probes exact |
| Specks or needles (the 06-27 dislike) | the strip's small components | iso up, `smooth 2`, raise the loner threshold |
| Handoff pops (blob → sphere bead, blob → capsule drop) | per-frame luminance change > 2 % in the local crop | bead start angle 110–120° (the landed blob is already flat); harvest only isolated clusters |
| Drops caps full (48 / 32 / 24) | `spawn` null | no ACK: the cluster stays in MPM; the deadline then evaporates it (counted) |
| Device loss mid-splash | `w8_loss` | `recoverWaterEngine` re-creates the plugin lazily (no allocation, no re-splash) |
| Tier downgrade mid-splash | `downgrade` event | the next event uses the new count; buffers sized at the first event |
| Text over water in S3 | — | events refused while 0 < g < 0.72 |
| The worktree probes read the main checkout | `ROOT` | `RV_ROOT` (§10 step 0) |

---

## 9. Proposed decisions (director, ratify or amend; recorded as spec §9.9 once built)

- **D-M9-1** The hook K4 `splashSDF` comes after K3 (F1).
- **D-M9-2** The splash chunk rides the held post-settle commit. There is no compile on S1 for M9a; the kernels compile at idle after formation.
- **D-M9-3** At the click, MPM replaces only the crown droplets (the dent, ring, sheet and bubble stay). At the apex, MPM adds a spray and the pour's 4 droplets stay. `keepSheet` is the A/B.
- **D-M9-4** The spec's seed speeds become **peaks** of a centre- and depth-graded profile, clamped at the 0.96 C/s cap. 1 substep is the default and 2 the A/B.
- **D-M9-5** GPU hashed seeding with the GPU body SDF; mass normalised per event to ρ0 × the seeded cells.
- **D-M9-6** Handoffs by readback at a fixed L = 4 steps with ACK and parking; `flush()` in manual mode.
- **D-M9-7** Harvest to analytic `"free"` drops at the brick sides and at the 1.6 s deadline; a CPU hard stop at 2.0 s.
- **D-M9-8** Group-3 bindings 9–12 and MPM's own uniform; no frame ext slot.
- **D-M9-9** The brick dims per event kind inside one 131,072-cell allocation (64 × 64 × 32 click, 32 × 80 × 32 apex).
- **D-M9-10** The instrument token `{n} particles` while MPM water is on screen (copy **TBC, Alberto**).
- **D-M9-11** MPM is refused at 0 < g < 0.72, in the band scene, under reduced motion and on case pages.
- **D-M9-12** Rollout:
  - `?mpm=1` until w9 passes; then default on for the click, with `?mpm=0` as the off switch.
  - M9b (`?mpmpour=1`) stays off until **Alberto's** look review (canon §5).

---

## 10. Build checklist (one engineer lane, own worktree, own server)

Estimate: M9a 16–20 h (the spec's 12 h did not count the handoff and determinism machinery), M9b +5 h. Each step ends with its gate green and a staged diff. **The director commits**; the lane never commits, never pushes and never touches `src/webgl/waterball/**`. The lane never stops the 5178 server and never opens a visible Chrome window.

0. **Setup.**
   - **Wait** for the director to commit the in-flight tree edits (at least `scripts/probes/water/lib.mjs`'s `RV_BASE`); a worktree starts from a commit.
   - `git -C C:/Users/alber/Desktop/PortfolioAlbertoTuveri worktree add C:/Users/alber/Desktop/PortfolioAlbertoTuveri-m9 -b feat/water-hero-m9 feat/water-hero`.
   - `New-Item -ItemType Junction -Path C:\Users\alber\Desktop\PortfolioAlbertoTuveri-m9\node_modules -Target C:\Users\alber\Desktop\PortfolioAlbertoTuveri\node_modules` (Playwright and sharp resolve from the worktree).
   - Server: `python -m http.server 5179` from the worktree's `public/` (background).
   - Every probe runs with `RV_BASE=http://127.0.0.1:5179/proto/rivista/` and `RV_ROOT=C:/Users/alber/Desktop/PortfolioAlbertoTuveri-m9` (add the one-line `RV_ROOT` to `lib.mjs` if it is not there). Shots go to `_shots/water-hero/M9/`.
   - Smoke: `node scripts/probes/water/w2_body.mjs smoke` and `w0_paper.mjs` against 5179.
1. **Baselines at HEAD.** Write `w9_mpm.mjs` with the `baseline` phase only. Run `baseline`, then `w2_body identical`, `w4_motion` (record the strip hashes), `w5_bootsplit`, `w6_pour identical`, `w8_perf tables` (the analytic splash p95) and `w8_claims`, all against 5179. These numbers are the reference for every later diff.
2. **Port.** Write `port-mpm-kernels.mjs`, run it once, run `--check`. Gate: the files exist, `src/webgl/waterball/**` is unchanged (`git status`), the type-check (`npx tsc --allowJs --checkJs --noEmit …`, CONTRACTS §0) is clean on `mpm.js` stubs. The director commits the raw port alone.
3. **The K4 hook** (`sdf.wgsl.js`, `shade-hero.wgsl.js` L889, `index.js` defaults + `KNOWN_MODULES.mpm`, `waves.js HELD_CHUNKS`). Gate: `w9 rest` 0 px; `w2_body identical` PASS; `w6_pour identical` PASS; `w5_bootsplit` one compile with an unchanged median (± noise).
4. **The solver.** `config.js`, `mpm-common`, the kernel edits of §3.2 (EOS, mass, gravity, CFL, open walls, floor, state machine, seed, seedMass, events, ack), and `mpm.js` with lazy resources, the passes, the readback ring, the handoffs, sleep and the hard stop. Bench only (`?mpm=1`). Gate:
   - `dev/mpm.html` loads; the tallies balance after one click; consoles clean;
   - a GPU readback shows particles leaving the face; NaN 0.
5. **The field and the chunk** (`mpm-field`, `mpm-chunk`, placeholders via the held commit, debug views). Gate: a click shows water; `holes` 0; `paper` exact; the 400 % crop judged and `interp` / `smooth` chosen.
6. **The `drops.js` hook and the handoffs** (`splash` gate, `prepare`, kind `"free"`). Gate: `w4_motion` with `?mpm=0` hash-identical to step 1; with `?mpm=1` the beads land, rings ring and droplets are harvested; `late` 0.
7. **Look tuning on `dev/mpm.html`** against Alberto's rules: a radial slow-motion splash, visible droplets, no needles, a smooth recompose, and a read at 100 % at the plate like "molto". Keep the knob table in the report.
8. **w9 phases** `strip`, `sleep`, `determinism`, `soak` (a + b), `perf`, `holes`, `paper`, `mobile`, `fallback`, `console`. Apply the §5 levers if `perf` fails; the kill rule if they are exhausted.
9. **Host and copy** (`fx-water.js` gate and stats, `fx-hero.js` token, `w8_claims` derivation). Gate: `w9 copy`; `w8_claims` PASS; reduced motion and gl-off unchanged (`w5_still`, `w5_case`).
10. **Page regression** (the list under §6.5) at 1440 × 900 and 390 × 844, headless, plus `w9 compile` on S1 and on a repeat visit. Look at every screenshot before calling anything done.
11. **M9b** (optional, `?mpmpour=1`): the `index.js` / `body.js` boot composition, the `pour.js` hook, the apex dims, parking until drops is live. Gate: §3.3; if it fails, it stays off and the plan says so in the report.
12. **Docs.** CONTRACTS §22; spec §9.9 with the ratified D-M9-n; the w9 numbers (adapter, tier, dpr, per-pass p95, total p95, submits after idle, console counts, the soak accounting) for the commit message. Then the director decides D-M9-12's default-on and carries the TBC copy and M9b to Alberto.
