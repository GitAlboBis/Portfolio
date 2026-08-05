# IMPROVEMENT BACKLOG

> Autonomous creative-engineering loop. One coherent improvement per iteration:
> AUDIT → PRIORITIZE → THINK → IMPLEMENT → VERIFY → COMMIT.
> Reference study notes: `_refs/DOSSIERS.md` (+ `_refs/_dossier_parts/*.md`). `_refs/` is gitignored
> and must never be imported.
> Baseline established 2026-08-05: `_routesweep.mjs` **ALL CLEAN** (5 routes × 2 viewports),
> visual baseline in `_shots/before/` (3 viewports × 4 routes × scroll stops).

Legend — **I** = impact, **E** = effort, **R** = risk. Gates per `CLAUDE.md §9`
(🔵 G3 merge to main · G4 hero solver · G5 paid assets).

---

## A. WebGPU / render-loop correctness (brief §4)

| # | Finding | Evidence | I | E | R | Status |
|---|---|---|---|---|---|---|
| A1 | **No resize handling anywhere in `src/webgl`.** `canvas.width/height` set once at init; no `ResizeObserver`, no `resize` listener, no `context.configure` on resize. Consequences: SSF depth/thickness/depth-test textures stay at the initial size; the `screenWidth`/`screenHeight` pipeline-overridable constants and the `projected_particle_constant` filter constant go stale; `texel_size` uniform goes stale; the camera projection aspect (`camera.reset`) is never recomputed → the "A" stretches. | `grep resize\|ResizeObserver src/webgl` = **0 hits**; `WaterBallHero.tsx:218-227`, `camera.ts:97-101`, `fluidRender.ts:48-56,205-227` | H | M | M | ✅ done (iter 1) |
| A2 | **No `device.lost` handling.** `CLAUDE.md §4` claims a poster fallback on `device.lost`; the code never touches it. On a driver reset the rAF loop keeps encoding onto a dead device — per-frame console errors, frozen canvas, no fallback. | `grep 'device.lost\|\.lost' src/webgl` = **0 hits**; `WaterBallHero.tsx:197-455` | H | S | L | ✅ done (iter 1) |
| A3 | **`copyPosition` compute pass dispatched twice, back-to-back, identical bind group + pipeline.** The kernel is purely idempotent (copies `position`, `v`, `density` into `posvel`) so the second dispatch is 100 % wasted GPU work: `2 substeps × ceil(120000/64) = 3750` redundant workgroups **per frame**. Not a solver change — the physics is bit-identical (G4-safe). | `mls-mpm.ts:592-597`; kernel body `copyPosition.wgsl.ts:19-25` | M | S | L | ✅ done (iter 1) |
| A4 | **Per-frame garbage in the render loop.** `changeBoxSize()` allocates a fresh `ArrayBuffer`+`Float32Array` every frame and writes a **constant** value; `execute()` rebuilds a 5-view `canvasInfoViews` object every frame; `renderer.execute()` allocates a 4-byte ArrayBuffer + view every frame. ~7 allocations/frame ≈ 420/s. | `mls-mpm.ts:539-545,605-610`; `WaterBallHero.tsx:416`; `fluidRender.ts:349-352` | M | S | L | ✅ done (iter 1) |
| A5 | **`canvas.style.opacity` written on every single frame** even when unchanged — a style write inside the render loop that dirties style on every tick. | `WaterBallHero.tsx:392` | M | S | L | ✅ done (iter 1) |
| A6 | **`context.getCurrentTexture().createView()` called for both the fluid and sphere pass descriptors every frame**, though only one path executes. Two views allocated, one used. | `fluidRender.ts:431,442` | L | S | L | ✅ done (iter 1) |
| A7 | **ImageBitmaps never `.close()`d** after `copyExternalImageToTexture` — 6 decoded bitmaps held until GC. | `WaterBallHero.tsx:231-253` | L | S | L | ✅ done (iter 1) |
| A8 | 🔵 **Mouse velocity is DPR-dependent.** `camera.calcPlaneCoord` divides `event.clientX` (CSS px) by `canvas.width` (backing px). The constant term cancels in the velocity difference but the scale does not: the poke is **1/DPR weaker** on HiDPI. Same gesture ⇒ different physics per display. **Fixing changes the tuned feel on Alberto's screen ⇒ G4 territory — do not fix silently.** | `camera.ts:142-155` vs `WaterBallHero.tsx:218-222,429` | M | S | **G4** | ⏸ flagged, needs Alberto |
| A9 | Dead code: `calcMouseVelocity` computes `velX`/`velY` and never uses them. | `camera.ts:135-136` | L | S | L | ✅ done (iter 1) |

## B. Reference effects → sections (brief §1/§2, mapping in `_refs/DOSSIERS.md`)

| # | Effect | Target | I | E | R | Status |
|---|---|---|---|---|---|---|
| B1 | webgpu-water height-field + real caustics | `ShallowWater` → interactive, cursor-dropped ripples | H | L | M | ✅ done (iter 2) |
| B2 | GreenSock perspective dolly (P=500 / z=350 / scale 2 = 6.667×, back plane 1.1) | `/work/[slug]` opening wide shot | H | M | L | pending |
| B3 | telescope-zoom layered convergence (`[1,.85,.6,.45,.3,.15]`, fly-past `from:"center"`, sharpen `from:"end"`) | `/work` arrival beat above the runway | H | L | M | pending |
| B4 | r3f-image-reveal noise-torn frontier (`1 − clamp(cnoise(warp) + 12.5d − 7p, 0, 1)`) | `/work` runway stills | M | M | L | pending |
| B5 | metaballs tear-apart (`radius/dist`, 121 pts, shuffled 0.5 windows) — **fix the disabled row stagger on port** | `WorksGallery` project cross-fade | M | M | M | pending |
| B6 | three-skull morphological erosion reveal (`min` of 5 noise-warped taps, `+0.015`/frame recovery) | paper → sea pointer reveal on the `bg-paper` band | M | L | M | pending |
| B7 | Liquid-Morphology bell envelope `sin(pπ)·0.2` + counter-scale `s1/s2` — **re-centre the unsigned y noise** | `MenuOverlay` route-preview crossfade | M | S | L | pending |
| B8 | Ripple snippet: 3 decaying wave trains (freq 1:1.3:1.8, decay 8:6:4, amp 0.08) | response to the live `tide-touch` / `surface-break` events | M | S | L | pending |
| B9 | aurelia plankton density law + inverted-fog bloom mask | `AscentSurface` underwater depth | L | M | L | pending |
| — | liquid1 CDN bundle · dot-ring preloader · PP Neue Montreal | **no home — reasons recorded** in `DOSSIERS.md §9c/9d/9e` | — | — | — | ✅ recorded |

## C. Composition / polish found in the visual audit

| # | Finding | Evidence | I | E | R | Status |
|---|---|---|---|---|---|---|
| C1 | `/work` mid-runway composition is weak: still half-clipped at the left edge, next title clipped at the right, large empty paper void between. Every juror scrubbing the index sees this. | `_shots/before/work-1440-030.png` | H | M | M | pending (B3/B4 address it) |
| C2 | `WorksGallery` mood wash is very heavy at mid-scroll — the still is nearly drowned in ember; the duotone pull may be over-strength at that ramp position. Verify against intent before touching. | `_shots/before/home-1440-020.png` | M | S | M | pending |

## D. Housekeeping (pre-existing, from `PLAN.md`)

| # | Item | Status |
|---|---|---|
| D1 | `DESIGN-SYSTEM.md` still "Ocean v1" — archive or rewrite | pending |
| D2 | `.gitignore` says "bun is canonical" but the project is npm-only (`CLAUDE.md §4`) — stale comment | pending |
| D3 | SerSan ×2 content · `NEXT_PUBLIC_SITE_URL` · feel-review | 🔵 blocked on Alberto |

---

## Iteration log

### Iteration 1 — WebGPU correctness pass (A1–A7, A9) · `444681b`
Every item on the brief's §4 checklist that is present in this codebase and is **not** gated by G4.
A8 is deliberately excluded and escalated: it is a genuine portability bug, but the only correct fix
changes the hand-tuned poke strength on Alberto's own display, which `CLAUDE.md §9 G4` reserves.

### Iteration 2 — B1: `ShallowWater` becomes a real height-field water surface
Ported Evan Wallace's WebGL Water via `jeantimex/webgpu-water` (MIT) onto WebGL2: the ripple
integrator, the cosine drop kernel, the normal reconstruction and the refraction/area-ratio caustics
are reproduced verbatim (`2.0`, `0.995`, the `*0.25` 4-tap, radius `0.03`, strength `±0.01`,
IOR `1/1.333`, 2 substeps → normals → caustics, upstream's `0.75` projection margin). Dropped: the
pool box and the sphere shadow — scene-specific, meaningless here. Added: the pointer drops **real**
ripples, plus ambient agitation at a coastal cadence (the reference's own kernel, retimed to the
integrator's ~1.7 s decay so wavefronts always interfere — a "drip" cadence collapses the caustics
into lonely rings) and a 210-step pre-roll so the first paint is already in steady state.
The previous procedural field is kept intact as the fallback for WebGL1 / no renderable float, and
is what reduced-motion still renders as one static frame.
**Contrast is safe by construction**: the caustic term enters the unchanged composition through
`clamp(...,0,1)` at `ca * 0.25` with shading capped at `0.55`, so the audited AA ratios cannot move.
