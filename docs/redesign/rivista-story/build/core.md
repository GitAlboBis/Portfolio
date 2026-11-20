# CORE lane — build notes

- **Lane:** CORE (port 5182). Owns `public/proto/rivista/stage/**` except `stage/day/**` and `stage/night/**`.
- **Plan:** `stage/stage.js` (API, sim, draw, rest, tiers) + `stage/wgsl/*.wgsl.js` + `stage/helpers.js` + bench `stage/dev.html`; iterate the look on headless captures at 1440x900 and 390x844 (DPR 2).
- **State (run 2, done):** built, running on the bench, console clean, `tsc --checkJs` clean on stage.js + helpers.js. Look iterated v1..v12 on captures in `.shots/core/`. Rest, budget halving, body extension point, keep-outs, edge, timestamps verified. Server on 5182 stopped. Returned to the director.
- **Best captures:** `v11-rest.png` (day still after the window: ring of fine threads + mist), `final-day.png` / `v9-ring.png` (day, keep-out), `v12-phone-day.png` (A in ink, tendrils, 390x844 DPR 2), `v9-night.png` + `v12-phone-night.png` (the A as light), `v12-edge.png` (the edge), `v12-migrate.png` (ring -> letter half way), `v10-body.png` (body extension point), `v11-budget.png` (40k after two halvings, tone held).

## Files

| file | what |
|---|---|
| `stage/stage.js` | `createStage()`, the API doc at the top (the only thing HOST+DAY and NIGHT need to read), packing, rank allocation, rest, budget, timestamps, advance |
| `stage/helpers.js` | `H`: `rng`, `gauss`, `cloud`, `ring`, `box`, `polyline`, `join`, `fromWeights`, `fromImage`, `glyph` |
| `stage/wgsl/frame.wgsl.js` | `StageFrame` uniform (group 0) + `stageScreen`, `stageClip`, `stageProject`, `stageNight`, `stageKeep`, `stageOETF` (bodies start their shader with it) |
| `stage/wgsl/noise.wgsl.js` | pcg hash, gradient noise with derivatives, divergence-free flow `flowAt` |
| `stage/wgsl/sim.wgsl.js` | the compute pass; `Slot` (11 vec4) per active formation |
| `stage/wgsl/draw.wgsl.js` | instanced gaussian discs: perspective, DOF with energy kept, shutter streak, stochastic area cap, day ink / night light per fragment |
| `stage/dev.html` | bench (own adapter + device via `water/engine/gpu.js`) |

## Decisions

- **Stable sharing = rank intervals with parity ends.** Each particle has a fixed rank (R4 low-discrepancy axis of its index). A formation owns a rank interval of length `weight x share`. Formations with even `order` stack from rank 0 upward, odd ones from rank 1 downward (higher order outermost). Two neighbours in page order always sit at opposite ends, so cross-blending them moves only the particles at the border: a migration, never a pop and never a churn of the incoming one. Registration order = order, so the host must register in page order (or set `order`).
- **One blend for day and night:** premultiplied over. Day fragment `(ink*a, a)`; night fragment `(light*e, 0)` = pure addition. Decided per fragment by the band, so the edge is exact.
- **Colours in encoded space:** the page composites in sRGB-encoded space, so the discs use the tokens' encoded values; ink mixes exactly like a CSS layer of cobalt at opacity a.
- **Rest:** window 5 s from `input()`; then activity ramps 1 -> 0 over 1 s (smoothstep on dt); at 0 the sim stops and `frame()` returns false with zero submits unless something is dirty (scroll, resize, set changes: redraw without motion).
- **Budget:** median GPU ms of 30 timed moving frames over `TIER_BUDGET_MS` (A 3.5, B 6, C 9) halves the drawn count (floor 20k), gain doubles the ink per particle. Without timestamps: median frame interval over 1/40 s.

## How to run and look

```
python scripts/serve-static.py 5182 public
http://127.0.0.1:5182/proto/rivista/stage/dev.html?f=mist:1,ring:1        (live)
...&t=3000                     frozen: advance 3 s then hold (captures)
...&then=letter:1&t2=700       then switch formations and advance 0.7 s (migration half way)
f=id[@anchor]:weight,...       demos: ring, letter, mist, glow (= letter, put in the night box with letter@glow)
y= | at=ring|letter|glow|night|nightEnd&atv=0.5   scroll position
px=&py=&down=1&pvx=&pvy=       pointer; sv= scroll velocity; step/local/progress; sp; n=; tier=; look=k:v,...; mist=ink:0.02; night=0; hud=0
```

## Look log (what changed and why, captures in .shots/core/)

- v1: ring = thick brush, mist = faint dots. -> ring ink 0.11 -> 0.018; mist strands longer (perStrand 170 -> 640 -> 900, threads per strand 1..3) so a thread has ~1 particle per px.
- v2: mist read as marbled paper, uniform. -> a slow noise field (1150 px) gathers the mist into zones with clear water between; more strands far from the page (depth exponent 2.6 -> 1.7).
- v4: straight tails along the flow only smeared the letter. -> `tails`: a share of a formation's particles leave from a few emitter targets and follow the streamline (3 steps), many per emitter: tendrils.
- v6: phone night A saturated: same particles in a smaller box. -> `inkArea` per formation (ink scales with rect area, 0.25..4).
- v7: blurred discs vanished: each contributed < 1 step of the 8-bit canvas and rounded away. -> stochastic rounding per fragment (hash of pixel and disc, shared by the 4 channels): faint veils accumulate.
- v8: night went cyan (dim threads +0,+20,+20): after scaling a faint value to one step, green sat at 0.49 step and the D3D float->unorm conversion (0.6 ULP tolerance) rounded it up. -> every channel floor(x*255 + h)/255: exact steps, nothing left to the hardware.
- v8: light whiteness came from per-particle ink, so `inkArea` changed hue. -> whiteness = lightWhite (0.22, every disc) + lightSharp (0.35) x focus: sums go white before a channel clips; blurred veils stay cobalt.

## Measured (AMD RX 7800 XT, Chrome headless, timestamp queries, tier A, 160k particles; compute + render pass)

| viewport | backing | moving, median GPU ms | max |
|---|---|---|---|
| 1440x900 DPR 1 | 1440x900 | 0.51 | 0.73 |
| 2560x1440 DPR 1 | 2385x1342 (3.2 MP cap) | 0.71 | 0.90 |
| 390x844 DPR 2 | 585x1266 (DPR cap 1.5) | 0.55 | 0.67 |
| forced budget 0.2 ms | 1440x900 | halves 160k -> 80k -> 40k, then 0.19 | |

Pipelines compile in 310-390 ms (async). Rest: 879 submits at 7.5 s after the last input, still 879 at 10 s (zero submits at rest).

## Notes for the other lanes

- HOST: register formations in page order (`rest, plume, ring, current, letter, mist, fall, gen, cut, code, agents, obla, dawn`) so neighbours land on opposite ends of the rank space; call `input()` on scroll / pointer / touch / key; give `scrollVelocity` (px/s, positive down); give `night` in viewport px or null; keep-outs in viewport px, max 16 (the stage keeps the first 16).
- The stage opens its 5 s window at creation, so the first formation fades up from nothing.
- Formations: tune `look.ink` with `inkArea` set to the rect you tuned on. Bound ink 0.02-0.05 per particle reads as ink; mist ink 0.03-0.05 with `fill: 0`.
- Over text keep `look.mistInk` <= 0.04 and no dense targets: the legibility law.

## Open

- Pointer stir judged only in a frozen capture (`v12-stir.png`, inconclusive): judge it live in the browser pane.
- Four active formations: two of them share an end of the rank space; the inner one slides while the outer grows (churn in the outgoing one). Acceptable; neighbours in page order never collide.
- Halving is one way for the session (no climb back).
- Night whiteness is per disc (22 % paper in every disc, +35 % when sharp) and the sum does the rest; there is no density resolve pass (the spec forbids a tone-map pass).
