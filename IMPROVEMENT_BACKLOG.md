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
| A10 | **`tech-cloud` had no `webglcontextlost` handler** — the one raw `THREE.WebGLRenderer` left (gallery + murmuration are R3F, which owns this). A driver reset left the rAF loop rendering on a dead context. Also `renderer.dispose()` without `forceContextLoss()`: three's objects are freed but the GL context lives until GC, and browsers cap live contexts (~16), so repeated client navigations can kill an older context out from under a live component. | `tech-cloud.tsx:103-118,418-429` | M | S | L | ✅ done (iter 3) |
| A11 | Audited the other canvases: `MurmurationCanvas`, `WorksGalleryCanvas` and the gallery are **R3F-managed** (`<Canvas>` owns resize/DPR/context), `NightSky` and `ShallowWater` already handle context loss. **No gap** — recorded so the audit isn't repeated. | — | — | — | — | ✅ verified clean |

## B. Reference effects → sections (brief §1/§2, mapping in `_refs/DOSSIERS.md`)

| # | Effect | Target | I | E | R | Status |
|---|---|---|---|---|---|---|
| B1 | webgpu-water height-field + real caustics | `ShallowWater` → interactive, cursor-dropped ripples | H | L | M | ✅ done (iter 2) |
| B2 | GreenSock perspective dolly (P=500 / z=350 / scale 2 = 6.667×, back plane 1.1). ⚠ **Front plane must be the torn PAPER, not the photo** — our stills are 1280px and already upscaled ~1.13× at 1440, so 6.667× magnifies WebP blocking. `TornEdge` is SVG (no ceiling) and "paper tears to reveal photographs" is already the site's language. Constraint + reasoning in `DOSSIERS.md §1`. | `/work/[slug]` opening — fly through the tear | H | M | M | pending (retargeted) |
| B3 | telescope-zoom layered convergence (`[1,.85,.6,.45,.3,.15]`, fly-past `from:"center"`, sharpen `from:"end"`) | `/work` arrival beat above the runway | H | L | M | ✅ done (iter 4) |
| B4 | r3f-image-reveal noise-torn frontier (`1 − clamp(cnoise(warp) + 12.5d − 7p, 0, 1)`) | `/work` runway stills | M | M | L | ✅ done (iter 5) |
| B5 | metaballs tear-apart (`radius/dist`, 121 pts, shuffled 0.5 windows) — **fix the disabled row stagger on port** | `WorksGallery` project cross-fade | M | M | M | pending |
| B6 | three-skull morphological erosion reveal (`min` of 5 noise-warped taps, `+0.015`/frame recovery) | paper → sea pointer reveal on the `bg-paper` band | M | L | M | pending |
| B7 | Liquid-Morphology bell envelope `sin(pπ)·0.2` + counter-scale `s1/s2` — **re-centre the unsigned y noise** | `MenuOverlay` route-preview crossfade | M | S | L | pending |
| B8 | Ripple snippet: 3 decaying wave trains (freq 1:1.3:1.8, decay 8:6:4, amp 0.08) | response to the live `tide-touch` / `surface-break` events | M | S | L | pending |
| B9 | aurelia plankton density law + inverted-fog bloom mask | `AscentSurface` underwater depth | L | M | L | pending |
| — | liquid1 CDN bundle · dot-ring preloader · PP Neue Montreal | **no home — reasons recorded** in `DOSSIERS.md §9c/9d/9e` | — | — | — | ✅ recorded |

## C. Composition / polish found in the visual audit

| # | Finding | Evidence | I | E | R | Status |
|---|---|---|---|---|---|---|
| C1 | `/work` mid-runway composition is weak: still half-clipped at the left edge, next title clipped at the right, large empty paper void between. | `_shots/before/work-1440-030.png` | H | M | M | ✅ addressed (iter 4 arrival + iter 5 torn frontier — the still now dissolves into the paper instead of ending on a clipped rectangle) |
| C2 | `WorksGallery` mood wash was very heavy at mid-scroll — the still nearly drowned in ember. Root cause was NOT the plane duotone (0.14, mild) but the background blobs at `0.55`/`0.50`: at those weights each blob nearly *replaces* the base at its centre, and both centres sit mid-field so they stacked. Halved to `0.28`/`0.24` on Alberto's call. | `_shots/seams/light-030.png` | M | S | M | ✅ done (iter 9) |

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

### Iteration 4 — B3: `/work` gets an arrival (`WorkApproach`)
Port of `joffreysp/telescope-zoom`. Reading the reference's `mask.png` changed the plan: it is a
**crab silhouette**, so the effect is not a zoom but ONE shape repeated at six depths, each showing
the same photograph through it, all converging to scale 1 so the nested copies **register into a
single shape**. Our equivalent shape was already sitting there — the letter **"A"** the whole site
is built on (water hero, constellation, murmuration). So `/work` now assembles that "A" out of the
project photography while the projects fly past the camera.

Kept verbatim: the `[1,.85,.6,.45,.3,.15]` stack and its accelerating ratios; `--progress` set from
a **JS-eased** `power1.inOut` of scroll progress (the timeline itself scrubs linearly — two
different curves, both needed); `perspective:100vh` + `z:100vh` so the flyers' projection scale runs
1 → ∞; stagger `amount .2 from "center"` on the fly-past and `from "end"` on the sharpen (deepest
layer first); convergence at `0.6 + delay .1`, sharpen at `0.6 + delay .4`; headline throw ±66vw
(±100vw ≤768px).

Ours, not theirs: `background-clip: text` instead of a raster mask (a typeface has no resolution
ceiling — the opposite of the B2 problem); **CSS `sticky` instead of ScrollTrigger `pin`**, because
the runway below is itself a sticky ScrollTrigger surface and this repo already paid for mixing them
(Nightfall). A 200vh wrapper + 100vh sticky child reproduces the reference's geometry exactly with
no pin-spacer to disturb the runway's measurements.

⚠ Caught in QA: putting `--progress` in an inline style **broke hydration** — the store resolves
`reducedMotion` from matchMedia at module load, so it is already true on a reduced-motion visitor's
first client render but false in the server HTML. Fixed by removing the render-time branch entirely:
the default lives in a class (`[--progress:0]`) and the effect owns the live value. Reduced-motion
also collapses the wrapper to one screen via `motion-reduce:h-dvh` — pure CSS, zero hydration
surface — so a reduced-motion visitor doesn't scroll two viewports of decoration to reach the list.

### Iteration 5 — B4: the runway reveal was mislabelled; ported for real
`WorkRunwayCanvas`'s header already claimed *"noise-front tide reveal per slide
(r3f-image-reveal)"*. The shader underneath was **not** that technique — it was a vertical wipe:
a Y coordinate, one un-warped `aw_fbm`, a smoothstepped 0.22-wide band, and an edge that froze the
instant `uReveal` hit 1. Replaced with the actual algorithm, read from the source:

```
displacedUv = vUv + cnoise(vec3(vUv * 5.0, uTime * 0.1));
strength    = cnoise(vec3(displacedUv * 5.0, uTime * 0.2));
strength   += distance(vUv, vec2(0.5)) * 12.5 - 7.0 * uProgress;
alpha       = (1.0 - clamp(strength, 0.0, 1.0)) * smoothstep(0.0, 0.7, uProgress);
```

Radial, not vertical. Domain-warped **before** the ×5 (that total scramble is what makes the edge
churn). Two time scales (0.1 / 0.2) so the fields never lock. **No smoothstep on the edge** — the
linear ramp between the clamp bounds is the effect, and `12.5` sets the band to `0.08` UV with
`±0.08` noise jitter, i.e. jitter ≈ band width, which is what reads as *torn*. Corners never open
(`d ≤ 0.56` at p=1) — upstream's deliberate permanent vignette, and here also the fix for C1.
`uTime` keeps advancing after the reveal completes, so the frontier churns forever (measured: two
settled frames 900 ms apart still differ).

`cnoise` (Stefan Gustavson's classic Perlin 3D) vendored verbatim into `src/webgl/noise.ts` with
`rv_` prefixes so it can never collide with `ARTWORK_GLSL` or a three.js chunk.

**Not ported, recorded why:** the reference's vertex wave `position.z += (1-p)·sin(dc·20 − p·5)`.
That demo uses a **perspective** camera where z displacement shows as foreshortening; this canvas is
`<Canvas orthographic>`, so it would produce exactly zero pixels of change — dead code wearing the
effect's name.

### Iteration 6 — both bird flocks removed (Alberto's request)
Removed **LA SCIA** (`Escort` / `EscortLazy`, the gull glyphs that followed the whole home page on
scroll velocity, plus the ambient horizon gulls) and the **MURMURATION** (`Murmuration` /
`MurmurationCanvas`, the WebGL boid flock that idled into the letter "A" on the About band).
4 files deleted, 2 mount points removed.

Cleaned up rather than left dangling:
- `warm.ts` no longer prefetches the (now nonexistent) murmuration chunk on `/about`.
- `hero-splash` had **exactly one listener** (Escort). Both dispatches removed from
  `WaterBallHero`, along with the per-frame `Math.hypot` + `performance.now()` throttle that
  existed only to fire it — a small render-loop saving.
- `marea` (the typed easter egg) also had **only** those two listeners. The egg keeps its own
  sunset-curtain sweep, but rather than let it dispatch into nothing the nav's day-arc now answers
  it, exactly as it already answers `tide-touch` and `surface-break`.
- `submerge` / `surface-break` keep their dispatches — `ScrollProgress` still listens.
- Eight stale comments across `GoldenHaze`, `AscentSurface`, `TideEgg`, `Tech`,
  `WorksGalleryCanvas`, `tech-cloud`, `WorkApproach` and `About` that described the flocks as live.

Kept on purpose: `GoldenHaze` (it paints the sky, not the flock) and `GoldenMotes` (golden pollen,
not birds).

### Iteration 7 — scrolling type strips out, the arch seam in
**Removed** both kinetic scrolling-text strips: `DriftBand` (the counter-drifting "Things I've
built" / hero-tagline seam closing the About band) and `Marquee` (the Tech keyword ticker, which
additionally sat between two full-bleed `border-y` rules — literally drawing the seam we want to
erase). Both component files deleted; nothing else imported them.

**Added `ArchRise`** — the era-residence arch, ported from Alberto's own reverse engineering
(`domus-tua-site/reverse-engineering/era-residence`). The incoming section is a dome that rises from
the bottom and covers the outgoing one, so the two never meet on a line.

From `css/arch-dome.css`: `border-top-{left,right}-radius: 50rem` with `html { font-size: 1vw }`,
i.e. **50vw** — on a full-width layer the two radii sum to the width and the top edge becomes a true
semicircle. Plus a negative `margin-top` pulling the dome up over what precedes it.

Two things learned the hard way, both measured here:
1. **The element must be at least as tall as the radius.** CSS shrinks border radii proportionally
   when they don't fit, so a 50vw radius on a 24vh cap silently collapses to a 24vh radius — rounded
   corners, not a dome. First attempt did exactly that.
2. **The dome must BE the incoming surface, not a cap above it.** A separate cap in `--color-paper`
   sitting over a band tinted by `GoldenHaze` re-introduced a visible horizontal join — the exact
   cut it was meant to erase.
3. `overflow: clip`, never `hidden` — clip doesn't create a scroll container, so the `sticky`
   descendants (Nightfall, the coast film, the ascent) keep working.

`overlap` is the dome's apex height above the outgoing section's bottom edge. 26vh buried the hero
h1 before any scrolling; **6vh** leaves the hero clean at rest and lets the dome arrive as you move.

**Still open on the "no cuts" brief:** the other seams (Works→Coast, Coast→Ascent, Ascent→Tech,
Tech→night) still meet on straight edges or `TornEdge` tears. Same treatment to apply, plus the
cloud-style dissolve between two light surfaces from the era reference.

### Iteration 8 — the home gallery stills stop being rectangles
Alberto: the arch is for the cuts **inside** the page; the route curtain stays as it is.

Hunted the remaining in-page cuts by measuring section offsets and sampling the seam frames rather
than guessing. Most of this site's internal seams are already *designed* transitions — `TornEdge`
tears into the film bands, the ascent's living waterline, Nightfall's sticky day-under-night stack.
The one genuinely raw cut left was in `WorksGalleryCanvas`:

```glsl
float fe = uBlur * 0.12 + 1e-4;   // ← feather proportional to DEFOCUS
```

so the plane **in focus** (`uBlur = 0`) ended on a razor-sharp rectangle — a photograph stopping
dead against the mood wash on four straight lines, right in the middle of the home scroll.

Replaced with the same domain-warped Perlin frontier used on the `/work` runway
(`colindmg/r3f-image-reveal-effect`, MIT), applied to the plane's **border distance** instead of a
radial ramp so the still dissolves on every side while staying a still: 0.075 band, ±0.055 jitter,
linear ramp (a smoothstepped edge reads as a soft rectangle, not a torn one). The defocus melt still
multiplies on top, so out-of-focus planes lose their borders entirely rather than merely tearing.

⚠ Gotcha: backticks inside a comment **within a JS template literal** terminate the string —
`// the feather used to be \`uBlur * 0.12\`` broke the shader into a syntax error. Caught by tsc.

**Still open on "no perceived cuts":** the cloud-style volumetric dissolve between two light
surfaces (Alberto's third screenshot) — a different mechanism from the arch (a volume eating the
boundary, not a shape rising) and needs its own band. And C2, the Works mood wash, remains a taste
call: it is heavy enough at mid-scroll that the still is nearly drowned.

### Iteration 10 — the long version, travelled sideways
Alberto: put the full long version straight into the home About, and give it the era-residence
horizontal scroll.

`AboutHorizontal` ports era-residence's scroller (README §11, `main.pretty.js:2596-2651`). Their
"The concept" / "New Golden Mile" views are not vertical sections — they are panels of one
horizontal scroller. Architecture and values kept verbatim:

- `area.style.height = track.scrollWidth` → one viewport of vertical scroll buys one viewport of
  horizontal travel; `screen` is `sticky top-0`, `track` is the flex row.
- `gsap.to(track, { x: -(track.scrollWidth - area.offsetWidth), ease: "horScroll",
  scrollTrigger: { start: "2.5% top", end: "97.5% bottom", scrub: .25 } })`
- **`horScroll` = `cubic-bezier(.25,0,.75,1)`, registered in `lib/gsap.ts` alongside the site's own
  eases.** This is the signature: every horizontal scroller maps wheel→x linearly, this one does
  not — it starts slow, accelerates through the middle, brakes into the last panel. `scrub: .25`
  adds the catch-up glide. Drop either and it is an ordinary sideways carousel.
- Title counter-drift via `gsap.utils.wrap([-5,25,-15]) → ([5,-25,25])`, scrub .25 — what stops a
  row of panels reading as one rigid sheet.
- Desktop only (`min-width: 992px` matchMedia), exactly like upstream.

The home About keeps its statement as the entry; the four panels (bio, education, experience,
thesis) now carry what used to live behind the "THE LONG VERSION →" link. `/about` is untouched and
still reachable.

⚠ Caught in QA: **reduced motion left three of four panels unreachable.** The GSAP tween is skipped,
but the CSS breakpoint still laid the panels out in a row — so the track sat there horizontal and
never translated (measured dy=0, dx=893 at 1440). Fixed with `motion-reduce:` variants that fall
back to the same stacked column mobile gets — pure CSS, so zero hydration surface. Verified in all
three modes: mobile column, reduced column, desktop row.
