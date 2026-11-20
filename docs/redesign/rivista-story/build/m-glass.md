# m-glass — GLASS lane (wave 6, resumed 20 November, Opus 5.5 max)

- **Done:** items 1 and 2 built and looked at (the prism as a solid of cut glass; the grain; the aberration in speed; the
  HDR canvas with `?hdr=0` / `?hdr=1`); item 3 measured twice against HEAD (below, "Numbers"). Gates green on the
  final tree; servers 5362 and 5372 stopped.
- **Next:** nothing of the brief; see "Open" and "Needs elsewhere".
- **How to run:** Astro build into `.shots/m-glass/dist`; `python scripts/serve-static.py 5362 .shots/m-glass/dist public`
  (stage edits under public/ are live on the Astro pages without a rebuild). HEAD: `python scripts/serve-static.py 5372
  .shots/m-fly/headsrc/dist .shots/m-fly/headsrc/public`.
- **How to look:** `.shots/m-glass/_scripts/idx.mjs <port> <tag> d|m|d1 [query]` (index rest + each row, prism crops in
  `.shots/m-glass/look/`); `idxpass.mjs <port> [--rows] [--d1] [--m] [--q=]` (GPU per pass on the index); `hdr.mjs`
  (`?hdr=1` against `?hdr=0`); `strip.mjs <tag> hdr2about --port=5362 --dpr=1 --debug` (a flight at 50 ms, with the
  aberration's series); `cost.sh <port> <tag>` (item 3, one round).

## What changed (files)

- `stage/plates/plates.wgsl.js` — **the prism** (`shadePrism`, `prChannel`, `prEnv`, new `prBeam`, `prBeamSet`,
  `prOutline`): the beam is drawn inside the glass between two points of the triangle's outline, just behind the
  triangle the eye sees (a soft straight core, a breath of light round it, fainter again in the faces' total
  reflections, red and blue 0.6 % of its length apart at the exit); every face and every total reflection takes a few
  hundredths of the room it faces (lighter turned up, darker turned down, with Fresnel: the faces part by tone, as a
  cut block's do); the arrises light up near where the beam enters and leaves and fall to 0.13 elsewhere (an even
  line round every edge read as an outline drawing); one ray instead of three through the two caps away from the beam
  (`oneRay` as the slabs have it). **The post**: `fsBlit` reads red and blue apart by the aberration (one load at
  rest, as before); `behindPage` reads each channel's ray shifted (no read more; the door's one ray in a flight's fast
  part is not split: two more reads there cost its arrival); `fsPlate` writes under the light's ceiling with the grain. The slabs' and the
  door's shading are as FLY left them (`oneRay`, `chExit`, `chTurned`, `sharp < 0.8`, `nearK`, `drawFrom`).
- `stage/plates/plates.js` — `PRISM_BEAM` and `prismOutline` (the beam's two points; index.js aims at them), the
  prism's beam packed in its image rect and its light in `look.z` (from `inset` = -(1 + k): the host passes inset
  through), `covered` (the door hides the whole frame).
- `stage/scenes/index.js` — the shaft's core ends where the beam enters, the row's ray starts where it leaves (`enter`,
  `leave`, computed in the prism's own space); the line drawn behind the prism for the light turning inside is gone;
  the beam's light follows the cued ray (0.6 + 0.4 x its light); the fan's nine plates trace one ray (dispersion 0).
- `stage/scenes/lib/prism.js` — the rays write under the light's ceiling, with the grain on their halo's tail.
- `stage/wgsl/frame.wgsl.js` — `stageGrain(frag)` and `stageGrainLight(c, frag)`; band.z the aberration, band.w the
  light's ceiling, lookNight.w the grain's amplitude.
- `stage/wgsl/bloom.wgsl.js` — the prefilter reads the canvas under paper white (the glow on an HDR canvas is today's).
- `stage/gpu.js` — `canvasSetup(device)`: the format and the tone mapping (HDR only where `dynamic-range: high` and a
  float16 canvas reads back "extended"; `?hdr=0` never, `?hdr=1` always, a probe's switch).
- `stage/stage.js` — `prepareStage` takes the format from `canvasSetup`; `createStage` configures `toneMapping:
  extended` on it and checks it (`stats().hdr = { on, format, why }`); `aberStep` (the eye's speed in the viewport's
  space and the turn of its axis → css px, 0 at rest); the blit is skipped while the door hides the whole frame;
  `stats().aber`.
- Not touched: `fx-stage.js` (HDR needed nothing of the host), the flight's code.

## Decisions

- **The prism** keeps its pose and the rays' layout (both approved by earlier critics: no V). A steeper view of the
  long faces (pitch -0.95) was tried: it read as a glass tent; the triangle seen nearly face-on reads as the prism.
- **The beam** rides in the glass, so its light is bent where the glass bends it and the shaft and the ray meet the
  silhouette where the beam does (its plane is 0.9 of the half length toward the eye: just behind the front triangle).
  Its light rides the slab's `inset` because the host passes only inset, bevel, ior, dispersion, tint, sheen, edge.
- **The grain** cannot break a band once the 8-bit write has made it (a dither added after the write rounds back to
  the same step): it sits in each pass that writes smooth dark light, just before the write. Mine: the plates, the
  rays, (the bloom's composite already had its own dither). The field's wall and haze write the largest dark
  gradients and are not mine: see "Needs elsewhere". On the float16 canvas the grain is 0.
- **The aberration** lives where the room's light is read from pass A (no pass of its own): the blit and the glass. It
  does not reach the plates' own faces or the swarm in front of them; at a corner, at the flight's speed, it is 3 css px.
  The eye's place is taken in the viewport's space, so a reader's scroll of the page is not a camera move.
- **HDR**: the light's ceiling as written is 1.6 (encoded; about 2.9 times paper white in linear light) for the plates
  and the rays; the swarm's additive piles go above it uncapped (no pass can read them back without a pass of its own);
  the display's own headroom clips them. The glow is today's (the prefilter reads under 1).
- **The blit is skipped** while the door's glass hides the whole frame (each of its pixels was painted over): a little
  less in the flight's peak frames.

## Looked at

- The index at rest and with each row under the hand, 1440 DPR 2 (`look/g4-*.png`, crops `g4-*-prism.png`,
  `g4-cmp.png` About and Work side by side) and the phone (`look/g4m-crop.png`): the shaft comes down onto the left
  face near the apex, the beam crosses the triangle inside the glass with the faint split and leaves by the right face
  toward the row's emblem; the right face and the total reflections have a tone, the cap is clear, the edges are thin
  and lit only near the light. Nothing over the rows' text. Before: `look/h0-*.png` (an outline drawing).
- Forced HDR on this standard screen (`look/hdr-cmp.png`, `hdr.mjs`): `stats().hdr = { on: true, format: "rgba16float",
  why: "forced" }`, console clean, the picture today's but for the name's glow (fixed after: the prefilter reads under
  1). Two standard runs differ by 1.7 / 255 on average (the swarm moves); forced HDR by 3.7 before the fix.
- The grain (`look/grain-cmp.png`, 1:1 crops with the levels stretched five times, before / after): no band in the
  rays' halo or in the prism's new face tones.
- A flight Work → About at 50 ms (`strip/ab1/sheet.jpg`, `look/aber-corner.png`): the aberration is 0 until 100 ms
  after the click, 3 css px from about 390 to 650 ms, back to exactly 0 by 976 ms; the corner's grid lines and chips
  part red and blue in speed and not at rest. No rAF gap over 34 ms, no screencast gap over 40 ms, no error.

## Numbers (item 3; stage timestamps, `cost.sh`, `fly.sh`; lane on 5362, HEAD 4000240 on 5372, same hour, one tree at a time)

Round A, CPU 22 % then 1–6 % (medians over 1.5–1.8 s; "top" is the worst single frame, where GPU preemption shows):

| | lane | HEAD |
|---|---|---|
| Index at rest, 1440 DPR 2 | 2.16 | 3.02 |
| Index, Work under the hand | 2.81 (top 8.78), swarm whole | 3.13 (top 3.97), **swarm halved to 80,000** |
| Index, About / Consulting / Obla | 2.30 / 1.83 / 1.84 | 2.44 / 2.08 / 2.32 (halved) |
| Index at rest, 1920 DPR 1 | 1.83 | 2.57 |
| Index, Work / About, 1920 DPR 1 | 2.41 / 2.33 | 2.40 / 2.40 |
| Index on the phone (tier B) | 0.38 | |
| Cover at rest (load), 1440 DPR 2 / 1920 DPR 1 | 2.43 / 1.96 | |
| Gallery at rest, 1440 DPR 2 / 1920 DPR 1 | 2.14 / 1.89 | |

Round B, **noisy** (CPU 40 % and 54 % at the lane's start, other sessions' jobs on the GPU: HEAD's gallery and the
lane's both rose by a third against round A):

| | lane | HEAD |
|---|---|---|
| Index at rest, 1440 DPR 2 | 2.99 | 3.07 |
| Index, Work under the hand | 3.16 (top 4.06), **halved** | 3.17 (top 4.13), **halved** |
| Index, About / Consulting / Obla (after the halving) | 2.44 / 2.08 / 2.07 | 2.50 / 2.13 / 2.37 |
| Index at rest, 1920 DPR 1 | 2.61 | 2.62 |
| Index, Work, 1920 DPR 1 | 2.80, halved | 2.79, halved |
| Index on the phone | 0.38 | 0.42 (round A) |
| Cover at rest, 1440 DPR 2 / 1920 DPR 1 | 2.43 / 1.96 | 2.42 / 1.93 (round A) |
| Gallery at rest, 1440 DPR 2 / 1920 DPR 1 | 3.30 / 2.49 | 3.35 (halved) / 2.90 (round A) |

Reading: the lane is never above HEAD at the same hour; the prism's new glass costs about 0.1 ms in the canvas pass
(0.82 against 0.71 in round B); the cover is unchanged (the post adds nothing measurable). The index with Work under the
hand halved the swarm in round B on both trees: the fan's nine plates were then given one ray and no extra edge rays
(`index.js`, after these rounds): see "After the fan".

The flights (`fly.sh`, FLY's `gpufly2.mjs`; out / in = the worst frame leaving / arriving), this GPU slower again
(the gallery at rest 3.33 in the same round, 2.14 in round A):

| | lane | HEAD |
|---|---|---|
| Work → About, 1440 DPR 2, A | 5.41 / 4.30, swarm whole | 5.09 / 4.08, **swarm halved** |
| Index → Work, 1440 DPR 2, A | 4.08 / 3.94 | 4.01 / 4.50 |
| Work → About, 1920 DPR 1, A | 4.50 / 3.45 | 5.03 / 2.80 |
| Work → About, 1440 DPR 2, B | 4.74 / 4.30, whole | 4.92 / 4.12, **halved** |
| Index → Work, 1440 DPR 2, B | 3.96 / 3.87 | 3.96 / 4.28 |
| Work → About, 1920 DPR 1, B | 4.25 / 3.33 | 5.14 / 2.85 |

The arrival at 1920 DPR 1 stood 0.5–0.6 over HEAD in both rounds: the door's two extra reads for the aberration in
its one-ray frames were taken out, and then (GPU faster again, twice) Work → About at 1920 DPR 1 was **3.01 / 2.85**
(rest 1.99), FLY's run 3 being 2.93 / 2.72.

### After the fan

The fan's nine plates on one ray and no extra edge rays: the canvas pass with Work under the hand fell from 1.08–1.43 to
0.81 ms. The index at rest was 2.80 in that run (the GPU slow again), and Work under the hand still halved the swarm in
its first frames (the emblem's points flying in, streaked, in the ink pass: the swarm's and the field's cost, not the
glass's). Sleep: 0 frames in 3 s after 19 s of quiet on the index and after a flight, aber 0, no error (`sleep.mjs`).

## Open (for the director)

- **No real HDR screen was tried.** The float16 canvas was forced on this standard screen (`?hdr=1`): it configures,
  reads back "extended", draws without an error and looks as today (values above paper white clip on this screen). How
  bright the swarm's piles rise on a true HDR display (the cover's name) is for Alberto's eye; `?hdr=0` turns it off.
- **The grain on the field** (the largest dark gradients) waits for the two lines in "Needs elsewhere".
- **The aberration** is drawn where the room's light is read from pass A (the room behind the plates, the room seen
  through glass); the plates' own faces and the swarm in front of them are not split (that needs a pass of its own).

## Needs elsewhere

- **`stage/field/field.wgsl.js`** (the field's lane, or INTEGRATE): the grain on the wall and the haze, the largest dark
  gradients of the night (the shafts' fall on the wall, the haze along them). Two returns, nothing else:
  `fsWall`: `return vec4f(stageGrainLight(col * fade * mask, in.pos.xy), 0.0);`
  `fsHaze`: `return vec4f(stageGrainLight(col * mask, in.pos.xy), 0.0);`
  (`stageGrainLight` is in `frame.wgsl.js`, which the field's shader already starts with; 0 on an HDR canvas; only
  where there is light, so the night stays black.)
- **DOCS** (`CLAUDE.md` switches table, `DESIGN.md`, `60-as-built.md`): `?hdr=0` (the 8-bit canvas of before) and
  `?hdr=1` (the float16 canvas forced, a probe's switch); `stats().hdr`, `stats().aber`; the prism's beam inside the
  glass (DESIGN.md "Index: the prism"); the grain and the aberration in speed (plan 70 phase 4: bokeh, the pointer's
  trail and chips on other pages not done, by the brief).
