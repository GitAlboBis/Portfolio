# y-glass — lane GLASS (fix round after the from-zero build)

- Task: thin side faces and far edges of a plate drew as a dashed line (cover 390 DPR 2, About's stack). Fix the AA in the plate material; look and cost otherwise unchanged.
- State (run 2, done): fix in `stage/plates/plates.wgsl.js` only; bench (tiers A, B, C), real pages (cover 390/1440, About stack 390/1440, Work gallery 1440) and the scene bench (stack, gallery) looked at. Gates green (assemble, --check exit 0, check-claims OK). Server 5212 stopped; 5179 untouched. Nothing committed.
- Run / look: `python scripts/serve-static.py 5212 public`; `stage/dev.html?view=stack&t=2500&hud=0` (`&layers=12` = the budget case, `&tier=B|C`); captures in `.shots/y-glass/<tag>/` (`before/`, `final/`; `z-*.png` are 3x crops).

## The cause (three, found with debug views now removed)

1. **The studio's narrow soft boxes reflected by the arris.** The key box is 0.02 rad wide; across a 2.5–5 px bevel the reflected ray sweeps ~1.5 rad, so the box became a line ~0.1 px wide: one bright pixel every few (tier C: dots; more rays only made dashes).
2. **A thin side face (3 px at 1x) and the exit through it** (total reflection flips, the hard `side` glow switch): geometry under a pixel, one ray per pixel.
3. **Plates seen through plates** (`throughOther`): hit-or-miss silhouette, one ray, so the far edge of the layer below drew dotted through the layer above. Plus the second reflection (`inner`) switched off hard at total reflection.

## The fix (plates.wgsl.js only)

- **Prefiltered lights:** `lightsOf(r, soft, dim, fa)`: every soft box is widened by `fa`, the angle one pixel of that ray spans, and dimmed so it keeps its light (`keepLight`, exactly 1 when fa = 0: flat faces unchanged). `fa` comes from how fast the bevel turns the normal (`turnRate` = amax / bevel inside it) x the pixel's footprint on the face; through the glass it follows Snell (ic cos in / cos out) and the exit bevel. Used by the face reflection, the transmitted ray that turns back to the lights, the second reflection, plates seen through.
- **Two extra rays per edge pixel** (centre ± (0.25, 0.375) px, averaged in linear light) only where the entry or exit point is within two pixel footprints of an edge of its face, or the ray meets the plate seen through near its edge. The extra rays share one `throughOther` lookup across the three channels (the centre ray keeps one per channel). The rest of the plate keeps one ray.
- **Second reflection** fades with the exit's own Fresnel (1 face-on) instead of a hard cut at total reflection.
- **Plate seen through:** antialiased presence (box distance at the slab planes vs the beam width), like the plate's own silhouette.
- **`onBox`** on an edge takes the face that faces the ray (a tie used to pick a face turned away).
- **The page behind** (backdrop) is read at the mip level of the beam's width where the ray lands (`fa` x distance): the name squashed through a thin face no longer breaks into a column of dashes (cover, phone). On a flat face fa = 0: unchanged.
- The cut run's partial edits: debug block and backdrop mips 6 -> 9 discarded (mips would have changed the blur of soft plates); `dev.html` `layers=1..12` kept (the budget case).

## Cost (AMD RX 7800 XT, bench `t=2500`, median still frame, whole stage)

| case | before | after |
|---|---|---|
| A, 1440, stack of 12 (budget case) | 1.40 ms | 2.27 ms |
| A, 1440, stack of 8 | 1.11 | 1.69 |
| A, 390 DPR 2, stack of 8 | 1.21 | 1.60 |
| A, 1440, cover | 0.28 | 0.33 |
| A, 390 DPR 2, cover | 0.65 | 0.67 |
| A, 1440, gallery | — | 0.45 |
| B / C, 390, stack | — | 0.76 / 0.28 |

Tried and refused: four extra rays (stack of 12: 3.57 ms, same look as two); the arris widened to the footprint in `throughOther` (the seen-through edges went broad and dark).

## Captures looked at

- `before/z-stack390.png`, `before/z-cover390.png`, `before/z-row.png`: the defect (dotted far edges, dashed thin face, dotted spectral fringe).
- `final/z-stack390.png`, `final/z-row.png`, `final/z-C.png`, `final/z-Bcover390.png`, `final/bench-cover-1440.png`, `final/bench-stack-390.png`: continuous lines on A, B, C.
- `before/z-index-left.png` vs `pages3/z-index-left.png`: the cover's thin left face on the phone (the reported defect) before and after.
- `before/z-cov.png` vs `pages2/z-cov.png`: the 1440 cover plate, same face, band, refraction and spectral fringe; the dashed verticals now whole.
- `pages3/about-stack-1440.png`, `pages3/z-about390.png`, `pages3/work-gallery-1440.png`, `pages3/index-1440.png`, `scenes/scenes-1440.png`, `scenes/scenes-390.png`: the real pages and the scene bench.

## Open

- Edge pixels cost three rays: the stack of 12 went 1.40 -> 2.27 ms (budget 3). The scene bench's moving stack at 1440 reads 2.3 ms GPU on its instrument line.
- The letters seen right at the arris are now soft (prefiltered) instead of stair-stepped; the spectral split is kept.
