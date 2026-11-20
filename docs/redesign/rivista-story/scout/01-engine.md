# Scout map 01 — the water engine

Scope: `public/proto/rivista/water/engine/**` at HEAD `a42e0b0` (branch `feat/water-viva`). Read-only survey for the story designers and builders. Paths are relative to `public/proto/rivista/water/engine/` unless they start with `public/` or `docs/`. "CONTRACTS" = `CONTRACTS.md` in that folder (2,027 lines, read whole); `§n` = its section n.

Status of this file: IN PROGRESS — sections are filled one by one; a section still marked `(pending)` has not been written yet. Sections 0 and 1 are written from CONTRACTS plus `index.js` and `render.js` read in full.

## 0. Inventory

About 21,000 lines of hand-written JS + WGSL, no dependency, no build step, `// @ts-check` + JSDoc. WGSL lives in `*.wgsl.js` modules as template strings (rule: never a backtick in a WGSL comment).

| file | lines | role |
|---|---:|---|
| `index.js` | 1328 | `createWaterEngine(opts)`, `recoverWaterEngine`, `KNOWN_MODULES`, the module loader, `internals` (the plugin API), the frame loop, the Breath Window, tier adaptation, the default hook chunks |
| `render.js` | 644 | `class Renderer`: the Frame uniform, WGSL chunk composition, shade selection and async compile, registered passes, capture |
| `gpu.js` | 475 | adapter / device, error scopes, `PipelineCache`, `TimestampRing`, readback helpers |
| `math.js` | 399 | vec / mat4, `lensShiftCamera`, `keyRig`, eases, `mulberry32`, colour |
| `tier.js` | 250 | `TIERS`, the DPR rule, `DprLadder`, `Downgrade` |
| `scenes.js` | 60 | two scene slots, "hero" and "band" |
| `glyph.js` | 1087 | `bakeGlyph`: the letter's distance field and thickness profile (group 1) |
| `env.js` | 540 | `bakeEnv`: the studio environment cube (group 2) |
| `body.js` | 502 | `HeroGroup` (bind group 3 of the hero shade), `HeroBody` (`BodyParams`, the floor map) |
| `caustics.js` | 638 | traced caustics plugin (built, **off** on the page since R1) |
| `waves.js` | 762 | face-wave heightfield plugin + `heroCommitter` (the debounced group-3 commit) |
| `drops.js` | 1071 | click drop, crown, beads, bubbles, wet marks |
| `light.js` | 194 | hover light + breath offsets (sub-plugin of waves) |
| `pour.js` | 912 | the S1 pour (preloader) |
| `band.js` | 565 | the closing band "after the rain" (second scene) |
| `dive.js` | 364 | the S3 dive camera (lab flag `?dive=1`) |
| `mpm-slots.js` | 179 | group-3 bindings 9..12 for the MPM water |
| `wgsl/*.wgsl.js` | 5,164 | 17 chunk modules; the big ones: `shade-hero` 1124, `profile` 594, `shade-band` 449, `caustic-trace` 436, `glyph-jfa` 404, `env` 380, `waves` 377, `sdf` 370 |
| `mpm/mpm.js` + `config.js` + `debug.js` | 1,749 | the MLS-MPM click crown (opt-in, `?water=viva`) |
| `mpm/kernels/*` | 1,463 | 9 compute kernels + `mls-mpm.ref.js` (CPU reference) |
| `mpm/wgsl/*` | 886 | `mpm-common`, `mpm-field` (density → signed distance volume), `mpm-chunk` (the K4 "splash" chunk) |
| `mpm/release/*` | 2,100 | the S3 "breath" (the letter exhaled as particles): **killed**, lab flag only |
| `CONTRACTS.md` | 2027 | the binding reference; §22.9, §22.15, §22.16 describe today |

Outside the folder but part of the system: the host `public/proto/rivista/fx-water.js` (boot, canvas mounting, flags, ticker), `fx-hero.js` (placement, S1/S3 timelines), the bench `public/proto/rivista/dev-water.html`, the lab pages `water/dev/*.html`, the probes `scripts/probes/water/*`, the two baked assets `water/assets/a-sdf-1024.png` and `env-cycles-1024.png`.

## 1. The frame

### 1.1 Device and context

- `gpu.js requestWaterAdapter()` never throws for "no WebGPU"; it **rejects a fallback (software) adapter**. `powerPreference` is omitted on Windows. `createWaterDevice()` requests exactly one optional feature, `"timestamp-query"`, and only when offered. No other feature or raised limit is requested: everything is "core-safe" (CONTRACTS §0).
- Format rules pinned in §0: never r16float / r32float as filterable storage; storage textures are rgba16float; r16float only as render target + sampled; rg16uint for JFA seeds; every pipeline through `create*PipelineAsync` (via `PipelineCache`); resource creation during setup inside `scoped()` error scopes.
- `configureCanvas(device, canvas)`: format `navigator.gpu.getPreferredCanvasFormat()` (bgra8unorm on Windows), **`alphaMode: "opaque"`**, `colorSpace: "srgb"`, usage `RENDER_ATTACHMENT | COPY_SRC`. The swapchain view is not an `-srgb` format: shaders write sRGB-encoded bytes by hand (`srgbOETF` in `wgsl/common.wgsl.js`).
- Consequence for the story: the canvas cannot be transparent over the page. HTML shows *through* it only where the canvas is clipped away (the host clips with CSS `clip-path` and the engine scissors to the same rect); everywhere else the canvas paints the paper's own bytes so it is indistinguishable from the page ground.
- One canvas per page (law in `DESIGN.md`, "The water A"), re-parented by the host between the hero and the band. `eng.attach(canvas)` accepts an `HTMLCanvasElement` or an `OffscreenCanvas`.
- Cost of the device, measured (§21 R3–R5): `requestAdapter` is a ~180 ms task on Chrome's `CrGpuMain` thread that **freezes every swap of the browser** while it runs; the host therefore asks for it either before the first paint (home, head script `window.__rvGpu`) or only on a still page (case pages, arrivals: 400 ms of quiet input + 600 ms calm). Destroying the context at a page change costs 15–500 ms in the seam; the rule is "the host never releases its GPU context under a cut" and both pages stay bfcache-eligible.

### 1.2 One presented frame (`index.js present()`, `render.js`)

`eng.frame(dtSec)` is driven by the host from `gsap.ticker`. When it decides to draw:

1. CPU: fixed-step hooks (`stepHooks`, 60 Hz accumulator, ≤ 3 steps per frame, excess time dropped), then per-frame hooks (`frameHooks`).
2. `render.writeFrame(buildFrame(tw, th))`: one `queue.writeBuffer` of the 512-byte Frame uniform.
3. One command encoder `water.frame`:
   - **"step"-phase registered passes** (only when steps > 0), in ascending `order` — e.g. the wave integrator `"waves"` (compute, order 10), the MPM kernels.
   - **"frame"-phase registered passes**, in `order` — e.g. the caustic trace / splat / blur, the wet-mark stamp, the MPM field build.
   - **The ONE render pass `water.shade`**: a single colour attachment = the swapchain texture view, `loadOp: "clear"` to the exact ground colour, optional `setScissorRect`, the active shade pipeline, bind groups 0..maxGroup, `draw(3)` (one full-screen triangle, `vs_fullscreen` + `fs_shade`).
   - point copies for pending `readPixels`, timestamp resolve.
4. One `queue.submit`.

There is **no depth buffer, no MSAA, no intermediate HDR target, no post chain, no vertex geometry**. The whole picture is one fragment shader that sphere-traces a signed distance field and returns `Shade { rgb, touched }`; `compositeOut` (in `wgsl/composite.wgsl.js`) applies a shoulder above 0.93, the exact sRGB OETF and a static ±1 LSB blue-noise dither, or returns the paper's exact bytes when `touched == 0`. No tone map, grain, bloom, vignette or chromatic aberration anywhere (§7).

Every registered pass runs **before** the shade; nothing can draw after it or on top of it today (`encodeShade` ends the pass right after its one draw). ≤ 8 timed passes per frame (`TimestampRing`, 16 queries).

### 1.3 Bind groups (the device default of 4 groups is fully used)

| group | owner | contents |
|---|---|---|
| 0 | `render.js` (`frameLayout`, `frameBindGroup`) | b0 `frame : Frame` uniform (512 B, VERTEX\|FRAGMENT\|COMPUTE) · b1 `blueNoise` 64×64 r8unorm (`textureLoad`) |
| 1 | glyph (`render.glyphLayout`, `setGlyph`) | b0 `d2` r16float · b1 `profile` rgba16float · b2 filtering sampler · b3 `GlyphParams` uniform (32 B) |
| 2 | env (`render.envLayout`, `setEnv`) | b0 `texture_cube<f32>` rgba16float with GGX mips · b1 filtering sampler |
| 3 | "pass-specific" (`render.setGroup(3, …)` or a shade's `own[3]`) | hero: `body.js HeroGroup` — 0 `BodyParams` (368 B), 1 floor map (rgba8unorm 576×160), 2 sampler, 3–4 caustic atlas + sampler, 5–6 wave texture + sampler, 7 liquids storage buffer, 8 `PourParams` (448 B), 9–12 MPM (3D field, uniform 96 B, 3D coarse, storage 32 B), 16 `DiveParams` (48 B). Band: its own group 3 = one storage buffer `bandPrims` |

Groups 1–2 are visible to FRAGMENT|COMPUTE so compute passes can bind the same glyph / env. A shade that does not use a group gets an empty group, so loading an unrelated module never recompiles it. `ShadeDef.own` lets a shade bring its own bind group for **any** index 1..3 (used by the band so the hero plugins never touch it).

Hero shade resource use after M9 (§22.2): sampled textures 8 of 16 (9 with caustics), uniform buffers 5 of 12, fragment storage buffers 2 of 8.

### 1.4 The Frame uniform (`FRAME_LAYOUT` in `wgsl/common.wgsl.js`, `packFrame` in `render.js`; 512 B, append-only)

`viewProj`, `invViewProj`, `camPos`, `time`, `viewport` (x, y, w, h in backing px), `keyDir`, `keyAz`, `keyEl`, `pixelAngle`, `kappa`, `glyphScale` (the drawn scale), `keyRot` (world → env bake frame), `paperLin`, `paperDeepLin`, `inkLin`, `accentLin`, `groundSrgb` (the active ground's bytes / 255 = the exact output), `groundLin`, `ground` (0 paper-deep = hero, 1 paper = band), `tier`, `flags` (1 reduced motion, 2 rules, 4 capture, 8 scissor, 16 manual), `debug`, `drift`, `dpr`, `frameIndex`, `simStep`, `camRight`, `yaw`, `camUp`, `pitch`, `camFwd`, `dist`, `glyphXY`, `aspect`, `g` (S3 path parameter), then five `vec4f` extension slots written with `render.setFrameExt(i, v4)`:

| slot | owner | contents |
|---|---|---|
| `ext0` | pour | (fill level, phase, clock, rate) |
| `ext1` | caustics | (weight, atlasW, atlasH, windowW) |
| `ext2` | waves + drops | (wave amplitude gate 0\|1, peak amplitude, live liquid primitive count, 0) |
| `ext3` | waves | the dent (x, y, radius, depth) |
| `ext4` | band | (count, beads, drops, marks) |

**No ext slot is free.** `ext0`–`ext3` are only read by hero chunks and `ext4` only by the band shade, so a third scene's shade could reuse a slot while it is the current scene, but the clean route is a uniform of its own in its own group 3.

There is exactly **one** Frame per frame: one camera, one viewport, one placement, one ground. Nothing in `render.js` loops over views.

### 1.5 Shade composition and selection

- `render.chunks: Map<name, { code, requires }>`; `composeShade` concatenates `common` → `camera` (slot, empty today) → `env` → `cove` → `glyph` → `sdf` → extra chunks in resolution order → the shade's own `code` → `fullscreenWGSL` → `compositeWGSL`. Only the chunks a shade (transitively) `requires` are included.
- `refresh()` picks: the `?dbg=` debug view if registered and satisfiable, else the production shade (`setShade`), else exact paper. A changed composition compiles **asynchronously** (`createRenderPipelineAsync`) while the previous shade keeps drawing; identical in-flight requests are deduplicated; the latest request wins.
- `render.built: Map<key, ActiveShade>` keeps every pipeline that resolved. `buildShade(def)` compiles a shade ahead; a `refresh` whose plan equals a built entry switches **synchronously** (this is how hero ↔ band switch without a compile). `setGroup` with the same layout object is a bind-group swap, no compile.
- Pipeline keys are `"shade:" + def.name` — one built entry per name (the latest code / layouts).

### 1.6 What a frame costs (stated in CONTRACTS; AMD RX 7800 XT, Chrome headless, timestamp queries; nothing measured by this scout)

| state | backing | GPU p95 |
|---|---|---|
| exact paper shade | any | 0.001–0.006 ms |
| hero at rest, plate, tier A (old scale 0.46) | 670×702 | 0.32 ms |
| hero at rest, full screen (S3 g = 1) | 2160×1350 (2.92 MP) | 1.12 ms |
| hero worst state (click splash), full screen | 2160×1350 | 3.93 ms (budget 5); 4.44 with caustics |
| plate click at the default scale 0.58 | 670×702 | 2.33–2.41 ms (budget 2.6) |
| band shade (≈ 19 beads) | 2160×1215 | 0.25–0.27 ms (budget 0.5) |
| dive (lab), wheel through | 1425×900 | 3.05 ms (budget 5) |
| MPM crown click, full screen | 2160×1350 | 3.96 ms |

Tier budgets (`tier.js`): p95 plate 2 / 8 / 12 ms and S3 5 / 9 / 12 ms for A / B / C; B and C are iGPU / phone budgets that were never measured on such hardware.

Compile cost (the other budget): `shade:paper` ≈ 12–18 ms; `shade:band` 87–124 ms; `shade:hero` rest 270 ms (61 KB of WGSL), + waves + drops 319 ms, + pour 364–428 ms, + dive +95 ms. The ≤ 300 ms target is "an accepted, reported FAIL". Boot on the home: linked 469–676 ms, first live frame 1.0–1.3 s from T0. D3D12 inlines everything, so shade size ≈ compile time; every hook body must stay "small and branch-light" (§15.1).

### 1.7 The idle rule — the Breath Window (`BREATH_S = 5.0` in `index.js`)

`frame()` renders only when at least one holds: an input opened a window less than 5.0 s ago (`pointer`, `tap`, `scrollVelocity(v ≠ 0)`, `poke`, `enter`, `startPour`), a plugin reports real motion (`internals.setBusy(name, true)`), something marked the frame dirty (`setPlacement` / `setScissor` / `setTokens` / `setScene` / `setGround` / `setOverride` / a shade change / `setDive`), `setAwake(true)` (bench only), `force`, or a pending `readPixels`. Otherwise it returns at once: **zero `getCurrentTexture`, zero submits** (probed: 0 submits over 2 s). The fixed-step simulation advances only while "moving". `setS3Progress` opens no window and marks nothing dirty.

"Honest motion" (G15 / D30): a plugin may hold `setBusy` only while something really moves; every fade must end within 5 s of its cause. A design that keeps something moving forever (ambient particles, a drifting camera) breaks this rule by construction: it is a product decision (`CLAUDE.md` §1: "si muove da sola solo per 5 secondi dopo un input del lettore"), not a technical limit — the engine has `setAwake` and `setBusy`.

Scroll-driven change is already inside the rule: a placement that changes every tick marks the frame dirty every tick.

### 1.8 Tiers and adaptation (`tier.js`, `index.js`)

- `chooseTier({ touch, width, vendor, deviceMemory, forced })`: C when `deviceMemory ≤ 4`; B for touch, width < 768 or an Intel / Qualcomm / ARM / Imagination adapter; else A.
- DPR rule: `contractDpr = min(dpr, 1.5, sqrt(3.2e6 / (cssW · cssH)))`; effective DPR = that × tier scale (1 / 0.85 / 0.7) × the S3 ladder factor. **The backing never exceeds 3.2 MP**: a 2560×1440 viewport-sized canvas is drawn below CSS resolution (≈ 0.93).
- Per tier: glyph field 2048 / 1024 / 1024, profile 512 / 512 / 256, wave grid 128×112 / 96×84 / 64×56, caustic rays 256² / 192² / 128², march step budgets, caps on drops / beads / bubbles.
- `DprLadder` (float mode only): steps the DPR 1.5 → 1.25 → 1.0 when the p95 of the last 30 timed frames exceeds the tier's S3 budget; climbs back only after 8 s under 70 % of it; drops 6 samples after a step. `Downgrade`: one shot, frames 60–150 after formation, median over 7 ms (A) / 11 ms (B) → next tier; plugins re-allocate with a bind-group swap, 0 shade compiles.
- The adaptation sample excludes passes named `mpm:*` and `release:*` (their cost does not scale with pixels). A new fixed-cost compute system needs the same exemption or it will drag the DPR down for the session (that happened once: §22.12).
- Device loss: `eng.snapshot()`, `recoverWaterEngine(prev, { canvas })` → a new engine in ≈ 300 ms, letter formed, never re-poured.

## 2. What the body is

(pending)

## 3. Every moving system

(pending)

## 4. Extension points

(pending)

## 5. Compute

(pending)

## 6. Candidate capabilities (a)–(i)

(pending)

## Unknowns

(pending)
