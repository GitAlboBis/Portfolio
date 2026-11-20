# r-splat — Gaussian splatting in the stage (lane SPLAT, port 5303)

- Owns: stage/splat/** (new: splat.js, splat.wgsl.js, formats.js, gen.js), stage/dev.html (?view=splat).
- Status: DONE 2026-11-12. No page shows splats in this wave; the bench proves the pass.
- Run/look: `python scripts/serve-static.py 5303 public` →
  `http://127.0.0.1:5303/proto/rivista/stage/dev.html?view=splat` (params in the file's header: settle=, orb=, only=,
  n=, n2=200000, fmt=ply|splat, aperture=, room=0, splat=0, failsplat=1, t=). Probes: `.shots/r-splat/_scripts/`
  (bench.mjs `<tag> "<query>" [w h dpr]`, live.mjs).

## Decisions
- Sort on the GPU (compute, on the stage's encoder through ARRIVE's `compute` hook): 16-bit key of distance from the
  eye (far first, 0..16384 px), histogram of 65536 bins with atomics, a single-workgroup scan (256 bins a thread), a
  scatter, then `drawIndirect`. Measured: 0.16–0.20 ms GPU whatever the count (flat: the scan dominates), zero
  main-thread work, exact every frame (settle moves the splats on the GPU, so a CPU sort would need to redo the
  settle maths too). The alternative, a CPU counting sort: 1.31 ms for 200k in V8 (a worker), plus 0.8 MB of indices
  uploaded per refresh and a frame of lag. Within a bin the order is not stable (atomics); bins are 0.25 px deep, no
  flicker seen.
- Layer "over" (after the swarm and chips): a settled figure covers the light behind it. No depth buffer: a swarm
  point in front of a figure is covered too. With plates on screen the hook draws the pass into the light plates bend:
  a splat is ALWAYS behind plates (bent by them, like the swarm's pass A), even one placed in front: a scene keeps
  figures off plates' rects or behind them.
- Draw: 3D covariance through the set's matrix, the camera rows and the Jacobian of `stageScreenV`, + the stage's
  depth of field + 0.3 backing px² low-pass, opacity × sqrt(det ratio) (energy kept); quad along the conic's
  eigenvectors, cut at 1/255 (max 3σ; 2.2σ for settled surfaces). Fog, near fade, bokeh fade, keep-outs, dawn (cobalt
  ink), clock: all the stage's. Bloom reads it.
- Bounded fill: a splat widened past 3× its own sharp footprint (min 160 backing px²) is kept with a stable hash
  chance, survivors carry the energy (the swarm's rule). Without it, defocus made the relief cost 0.63 ms instead of
  0.05.
- Surfaces (a generated block or a relief): back-facing tiles are culled in the key pass once settled.
- Scatter at settle 0: an even wide box (1.6 : 0.9 : 1.2 × spread), never a ball (the first try made round soft
  white blobs: forbidden); one splat in six shows as a point (opacity 0.35, sigma 1 css px), the rest arrive as they
  settle; a hash stagger of 0.6; drift on the stage's clock (stops at rest).

## Measured (bench, this PC, tier A unless said; each twice)
- 200,000 splats at 1440×900 DPR 2: draw 0.82–0.85 ms + sort 0.18–0.19 ms = about 1.0 ms (limit 1.2).
- 1920×1080 DPR 1, 200k: 0.68 + 0.19 = 0.87 ms. Phone 390×844 DPR 2 tier B, 86,683 splats: 0.11 + 0.17 = 0.28 ms
  (limit 0.6 for 60k). The phone numbers come from this desktop GPU emulating a phone; a real phone is not measured.
- Bench scene alone (148k, defocused relief): 0.44 + 0.18 ms. The A alone (25k, large on screen): 0.06 ms.
- Formats round trip (40k synthetic): .ply pos 0, scale 3e-7 rel, rot 8e-8, colour 0; .splat pos/scale 0, rot 3e-5
  (byte quantised), colour 0. capNearest(10k of 40k): radius 0.26 vs 0.45.
- ?failsplat=1: init rejects, `[stage] pass "splat" off: …` (debug log only), stage draws, no warning or error.
  busy() settles to false after uploads and the 450 ms fade.

## FOR THE SCENE LANES
```js
import { putSplats, gen, loadSplats } from "../splat/splat.js";   // importing registers the pass "splat"
await putSplats("A", gen.letter({ text: "A", colors: { light: "#f4f1ea", dark: "#2340c9" } }));  // ~25k splats
await putSplats("mark", gen.mark({ colors }));                     // ~40k, white half + blue half
await putSplats("now", gen.relief(img, { cols: 260, depth: 0.05 })); // an image as low relief (~42k at 260 cols)
await putSplats("cap", loadSplats(url, { cap: 150000 }));          // a .ply (3DGS) or .splat file of the site's own
// in the scene's frame():
return { ..., passes: { splat: { sets: [
  { id: "A", pos: [x, y, z], size: 480, rot: [yaw, pitch, roll], settle: 0..1,
    alpha?, shade?, light?: [x, y, z], ambient?, spread?, point?, pointAlpha?, drift?, stagger?, surface? } ] } } };
```
- pos: viewport css px at the current scroll, z px toward the reader (free camera space); size: css px per local unit
  (generated figures are 1 tall: size = height); settle 0 → mist of points, 1 → the solid figure; up to 8 sets.
- Pool per tier: A 400k, B 150k, C 60k; sets are stored nearest-first so a cap keeps the core.
- Cost: sort ~0.18 ms flat whenever a set is asked; draw ~0.06 ms for a block in focus; defocus costs (bounded).
- After `putSplats` resolves, call `stage.input()` once if the stage may be asleep: the upload (64k splats a frame)
  and the 450 ms fade only run on drawn frames.
- Not done: the generators run on the main thread (letter ~30–40 ms of distance transforms, yielding between steps;
  fine on a bench, a page should build sets at idle or move gen.js into a Worker); no spherical harmonics beyond
  degree 0; no per-plate depth split (always behind plates); no depth test against the swarm; ARRIVE's createStage
  can resolve before the swarm pipelines and `frame()` then threw in particles() (the bench waits for the "swarm
  ready" log line); a real .ply capture from a phone scan was never tried (nothing downloaded).
