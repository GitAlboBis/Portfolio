# v-engine — round 10, the ENGINE lane (port 5251)

- Owns: stage/stage.js, stage/wgsl/**, stage/plates/**, stage/gpu.js, stage/tier.js, stage/boot.js, stage/helpers.js, fx-stage.js, stage/scenes/README.md, stage/scenes/lib/**, stage/dev.html, stage/scenes/bench.html
- Goal: free camera (one for points + plates), bloom, the cut as a camera move, longer rest per scene, bench view=fly
- Run: python scripts/serve-static.py 5251 public ; bench http://127.0.0.1:5251/proto/rivista/stage/dev.html?view=gallery&t=2500&hud=0
- Scripts (git-ignored): .shots/v-engine/_scripts/bench.mjs (frozen bench views), gpu.mjs (GPU medians on real pages)

## Done
- Baseline (before any change), captures in .shots/v-engine/before/ (bench) and gpu-before/ (pages).
  Bench still-frame GPU ms (1440x900 DPR 2, tier A): gallery 1.31, stack 4.82, dawn 0.61, cover 0.89.
  Pages while moving (gpuMs median, tier A 1440 DPR1): cover 1.63, gallery 1.73, stack 2.87 (already halved once to 80k), case 1.86.
  Phone 390 DPR2 (tier B): cover 1.07, gallery 0.72, stack 0.23 (no plate on screen at that scroll), case 0.18.

- Built (not committed): frame.wgsl camO + clip + stageFade; draw.wgsl near/fog fade, bokeh cap, per-plate depth classes
  (ZWin modes 1/2); stage.js free camera (setFree, freeStep, lookBasis, orbitAbout, exported orbitPose), cut push,
  rest window, bloom (wgsl/bloom.wgsl.js, bloomKit in prepareStage, encodeBloom), 4 timestamp spans; plates.js origin +
  near/fog fade + focus softness + soften; fx-stage.js free blend, rest, bloom, ctx.clock, cut push on fx:nav:start;
  scenes/lib/camera.js (cameraPath, mixPose, drift); dev.html view=fly and free=1.
- Proofs so far: bench gallery/stack/dawn/cover identical before/after (max diff 2, only the GPU-ms digits differ);
  free=1 (orbit camera driven as free camera) = same picture (gallery >8: 0.02 %, stack 0.13 %: float rounding).
  Pages GPU after (bloom 0): cover 1.65, gallery 1.73, stack 2.88, case 1.85 (A); phone B 1.11/0.72/0.23/0.18: unchanged.
  Bloom cost (fly bench): A 1440 DPR2 0.15 ms; B 1440 0.09, B phone 0.05; C 1440 0.06, C phone 0.035.
- Found and fixed: with plates at several depths a far plate drew over nearer points (the old split at the frontmost
  plate). Free camera now classifies points per plate (draw.wgsl ZWin); the orbiting camera keeps the old split (identity).

- Invariants verified (.shots/v-engine/_scripts/inv.mjs, rest.mjs, cut.mjs, hostfree.mjs):
  ?stage=0, ?gl=0, reduced motion: 0 adapter / 0 device requests, no stage-on, console clean.
  ?failbloom=1 (forced WGSL error in the bloom): stage on, bloom.failed true, console clean (module made inside a scope).
  Lost device (a controllable `lost` injected): rebuilt on a second device, drawing, bloom ready again, console clean.
  Rest: default awake at 4 s, asleep at 6.5 s; rest 14: awake at 13.5 s, asleep at 15.6 s.
  Cut: fx:nav:start pushes (0.13 -> 1.0 in ~0.32 s), fx:nav:reset returns to 0; the real click cut runs, console clean.
  Host free blend (cover with now.js routed to a free camera + bloom 0.9 + rest 14): free + bloom 0.61 in its share,
  back to the orbiting camera on the index; console clean.
  Start-up (boot-timing.mjs, HEAD served from a git archive on 5252 vs this tree): cover first frame 628 vs 629 ms;
  work 569 vs 635 (the sim compile varies run to run, 350-436 ms, both trees); case after a cut 455 vs 455.
  The bloom's pipelines compile in parallel (114-137 ms) and are ready with the glass; nothing waits for them.
- Gates: assemble 0, --check 0, check-claims OK.

## FOR THE HERO LANE
Read stage/stage.js header "THE FREE CAMERA" and stage/scenes/README.md (answer + "A camera path"). In short:
- Return from frame(c): `camera: { pos:[x,y,z], target:[x,y,z], roll, lens, focus, aperture, near, nearFull, fog:[a,b],
  bokeh, damp, orbit:{yaw,pitch,damp,pivot}, parallax, snap }`, plus `rest: 14` and `bloom: 0.6..1.0` (or
  `{ strength, threshold, knee, plates }`).
- Units: x, y viewport css px at the current scroll (sticky scene = fixed world), z px toward the reader, page plane 0.
  Distances (focus, near, nearFull, fog) from the eye in px. D (lens 1) = clamp(1.25 x diag, 1100, 2600): 2122 at
  1440x900, 1162 at 390x844. Straight view = pos [vw/2, vh/2, D], target [vw/2, vh/2, 0].
- Defaults: lens 1, aperture 1 (x LOOK.aperture 0.024 px blur per px of depth), focus = target distance, near 0.08 D,
  nearFull 0.26 D, bokeh 14 px, damp 0.55 s (use 0 for a path), orbit none (give yaw ~0.06-0.12, pitch ~0.04-0.07).
- Helper: `import { cameraPath, mixPose, drift } from "./lib/camera.js"`; `cameraPath(keys)(k)` -> pose; keys
  `{ at, pos, target, roll, lens, focus, aperture }`, missing fields carry, focus null = target distance, ends at rest.
  `drift(c.clock.time, amp)` for the idle drift: ALWAYS c.clock.time (the stage's own clock), never c.time.
- Formations: the word with real thickness = a glyph set with z spread (see dev.html DEMO.word: H.glyph + z in
  +-0.11 units, emit: -1 so points fly in from where they are; scale via update). Ink 0.16 at 90k targets glows.
- Costs measured: bloom A 0.15 ms (1440 DPR2), B 0.05-0.09, C 0.035-0.06. Fly bench frame 1.2-3.3 ms on A with 4 plates.
- Do not: drive a camera from wall time at rest (stage never sleeps); put a plate between the camera path and the
  lens without letting near/nearFull fade it (a plate passing within ~0.26 D fades, by design); expect the host to
  smooth a free camera (it does not: damp is yours); use bloom on a dawn scene (masked anyway); set plates' `sharp`
  for depth of field in free mode (the stage softens them from focus/aperture already; plateFocus: false to opt out).
- Bench: stage/dev.html?view=fly (p=0..1 frozen with &t=3000; live loops every period s; bloom=, orbit=0, fog=0) and
  view=gallery|stack&free=1 (the orbiting camera driven as a free camera: same picture).

## Needs elsewhere
- None required. (The cut's push lasts LOOK.pushS 0.4 s; if the PAGE lane makes the sheet faster than ~0.3 s the push
  is only partly seen, harmless.)

## Decisions
- (see below as they come)
- Connectors (one search, 21st `search` "webgpu bloom post-processing camera fly-through particles"): Grid Bloom, Quantum Nebula (three.js UnrealBloom), Particle Orbit (vgpu HDR bloom). Take as mechanism: threshold + mip chain blur + additive composite (the dual-filter / Unreal shape). Refuse: three.js and its EffectComposer (the stage is raw WebGPU with no dependency), HDR float swap chain, vignette/CRT finishes (would lift the night ground / read as a filter).
