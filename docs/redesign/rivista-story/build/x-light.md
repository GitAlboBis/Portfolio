# x-light — lane LIGHT, round x (2026-11-11)

Owns: stage/scenes/evidence.js, stage/scenes/now.js, stage/night/gen.js (consult.js only if item 3 needs it). Port 5232.
Items: 1 Evidence bars clean (no grain, no wanderers) · 2 Now glow smooth · 3 gen.js frame border still.
Status: DONE (run 2). Three items built, looked at, gates green. Server 5232 stopped.

## Diagnosis (from stage.js / sim.wgsl.js)
- Evidence grain: ~1 particle per target in cloud mode, each particle with its own size (0.85..1.95x) and ink jitter;
  u spreads particles unevenly over targets -> gaps and doubles. Fix: each strand as short PATH segments (seg 2): the
  sim spreads particles continuously and evenly along a path, so a strand is even with exact ends.
- Evidence wanderers: the set weights follow row visibility (vis) and grow -> every change is a rank migration, and a
  visible particle that changes formation flies across the screen. Fix: weights constant while the scene is up; show and
  hide by reveal only (a hidden target -> wantInk 0 -> the particle snaps to its place; revealed it is born there).
- Gen frame tremble: the frame shares gen's flow (amp up to 12 px/s), fuzz (to 1.6 px, re-scaled as sigma changes)
  and hand/wind. A formation has one flow for all its targets -> the frame becomes its own still formation (flow 0,
  fuzz 0, hand 0, wind 0) registered by consult.js beside gen, same rect/rotate/scale/offset.

## How to run and look
python scripts/serve-static.py 5232 public ; node .shots/x-light/_scripts/xcap.mjs <tag> <what> <d|m>

## Done (run 2)
- evidence.js: strands as path segments (SEG 10 px, dim strands 6 px with less light each), SHARE 0.085 -> 0.24 with
  INK scaled to keep the light per px, size 0.95 (phone 0.85, 3 strands 1 px apart), motion fuzz 0, flow 0, hand 0,
  wind 0, fade 3.2/3.6 per s; both sets held at weight 1 for the whole scene, lit by reveal (hidden: hi -0.05).
  Captures .shots/x-light/a3 (desktop) and a3/a6 (phone): bars straight, even, clean ends. Residual fine texture on the
  phone at tier B (its canvas runs at 0.85 DPR scale; not mine).
- Next: strips through a step change (d, m), then now.js, then gen.js + consult.js.
- evidence strips: .shots/x-light/before/sheet-{d,m}.png vs strip/sheet-{d,m}.png: before, phone frames show stray dust by
  the bars; after none, set 2 is born in place and sweeps from the left.
- now.js: its own formation `glow` (registered as now:field, the shared cover/shared.js `field` untouched) = the same
  glow + band drawn from a 6-D R sequence instead of Math.random, fuzz 0, flow 1.2/900. Same share (0.3), ink, depth.
  A first try with 50k points, share 0.4, z -600 cost +0.3 ms GPU: reverted to 40k / 0.3 / -520. GPU cover 1.22 -> 1.23.
  Capture .shots/x-light/a2/zn-cmp.png (left before, right after): smoother, rims still lit, band kept.
- gen.js: the frame and the 28 sampling marks are a named export `frame` (paths of two targets, segments of 0.04 local
  units, flow 0, fuzz 0, hand 0, wind 0); the picture keeps the noise (share 0.5 -> 0.4, capacity N_IMG; frame 0.1).
  Both share pose() (scale, offset, rotate). consult.js registers `frame` FIRST (host numbers formations in page
  order; frame 0, gen 1, cut 2, code 3, agents 4, dawn threads 5 keep every neighbour on alternate ends) and gives it
  gen's weight. Captures: .shots/x-light/a1-early/cmp.png (left before: wavy border at the noise stage; right after:
  straight ruled border), a1/d-gen.png (rest), a1/m-sheet.png (phone), a1-cut/d-gen.png (step 2 cut: no leftover).
- GPU median (tier A 1440, at rest): Work s1/s2/s3/back 0.506/0.610/0.524/0.601 -> 0.478/0.673/0.569/0.675;
  cover Now 1.221 -> 1.234; Consulting gen 0.273 -> 0.282. All rises under 0.2 ms.
- Gates: assemble --check exit 0; check-claims-proto OK (assemble not rerun: no partial, string or stylesheet touched).

## Needs elsewhere
- (none required) The residual fine texture of the phone bars comes from tier B drawing the canvas at 0.85 DPR scale
  (stage/tier.js); not changed.
