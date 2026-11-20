# As built — where the build left specs 10, 20 and 30

> Written 2026-11-10 by the DOCS lane from the code at `HEAD ac7e83f` plus the uncommitted LOOK and SWEEP work, read
> against `10-story-spec.md`, `20-pages-spec.md` and `30-cuts-and-glass-spec.md`. Where a later spec amends an earlier
> one, the amendment is not a departure and is not listed (the long home, the water A, Fig. 03 and `letter`, the
> borrowed device, "home page only"). The code wins; `DESIGN.md` is the system as built. Open defects are in
> `build/review.md` and `HANDOFF.md` §0.5, not here.

## The pages and the night (spec 10 §2, §4, §6–§7; spec 20)

| Spec says | Built | Why |
|---|---|---|
| 20 §5: add Obla to the header if five words fit at 1024 in both languages | Obla is not in the header: menu, dusk strip, "On to Obla" at the foot of Consulting; the Obla page's header carries no dash | five words broke the Italian header at 1024 |
| 20 §4: the dusk strip holds two rows | it also carries a stone label "By night" / "Di notte" | PAGES lane; the review asks to delete it |
| 10 §2: the day section before the night holds while the night rises; the band rises over the night | on the pages only Obla's last screen holds (`.sc-hold` + `.sc-over`); About's path no longer holds (Consulting is its own page) and the dusk strip is a plain sheet | the paging made the passage a cut (S5 night sheet) instead of a scroll |
| 20 §5: the cut into a night page is the night's sheet | built, and the night sheet's two moving edges carry the night hairline (`fx-nav.css` §5) | night-deep over night is 1.06:1: the move did not read on Consulting → Obla |
| 10 §7: six night tokens | eight: `--night-deep` (sheets, solid header) and `--night-accent-hi` (the night's hover tone) added; the filled button keeps the day's cobalt, its ring the night accent | cobalt on the night is 2.43:1 |
| 10 §4: section names `hero … contact` | the cover adds `contents` (In this issue) and `dusk` (the strip); `passes` is gone | the contents and the strip did not exist when spec 10 was written |
| 10 §4: one fig label per figure | the label and its live suffix are two strings (", drawn live" shown only under `html.stage-on`); Obla's still has its own line `ob.still` | spec 10 §8: "drawn live" only while the stage draws |
| 10 §4: sticky figure boxes | sticky from 1024; below 1024 sticky at the top on the night ground (INTEGRATE); scenes also print flat under `html.gl-off` and `?stage=0`, not only under reduced motion | a phone reader on step 3 never saw the figure change; without a stage the tall entries were empty screens |
| 10 §5: Obla's eyes 0.12 R above the middle | slightly below the middle, as the app's `engine.ts` draws them (pitch −0.12 in screen y) | the product's code wins; the spec read the sign the other way |
| 10 §6.1: proof 3 links to `#obla` | links to `obla.html`; proof lines use the house separators ("Proof · On request"), the thesis title is an italic `cite` | the issue is pages |
| 20 §7: each page its own share card | the cases have theirs; Work, About, Consulting, Obla and Contact use their edition's cover card; the cover's card is the printed cover (the name, no figure) | recorded gap; the old card showed the water A |
| 20 §7: list the motion probes that point at moved chapters | SWEEP deleted them (`intro`, `buttons`, `cases-nav`, `idle`, `restore`, `rail`, `s4`, `cases`, `blocks`, `rhythm`, the `_rev_*`), repointed `longtask.mjs` to `work.html` and kept `menu`, `tokens`, `cases-walk`, `strip`, `effop` | Alberto allowed deletions (spec 30 §1) |

## The stage (spec 10 §3; spec 30 §1–§2)

| Spec says | Built | Why |
|---|---|---|
| 10 §3.3: halve the count over budget | budgets per tier A 3.5 / B 6 / C 9 ms (median of 30 moving frames), floor 20k, ink per particle doubles; spec 30 §2 asked for "about 3 ms" at A | measured cost is 0.93 ms on the heaviest page, far under either |
| 10 §3.4: bytes in sRGB, no resolve pass | per-fragment stochastic rounding of every channel; night whiteness per disc (22 % paper, +35 % in focus) | faint veils rounded away; the night went cyan through the GPU's float-to-unorm rounding |
| 10 §3.5 `rest`: nothing, the ink is in the letter | `rest` is ink orbiting the cover's glass body, bent behind it | the letter left; spec 30 §3 asks for ink turning around the body |
| 10 §3.5 `ring`: a thin tilted ring turning round Fig. 02 | a circle of nine threads 1.25 half-sides round the frame's centre, tilted 0.36 rad, flowing gently with the scroll | a long diagonal ellipse showed one arc at a corner; a steep circle smeared to haze. The review still reads it as a smudge |
| 10 §3.5 `gen`: the A of Fig. 01 from `fx-plate-v1.webp` | the SerSan mark sampled from the brand film's end card (`/captures/sersan-brand-end-1600.webp`) | spec 30 §1: the A is no figure anywhere; the mark ties step 1 to step 2 (proof: the brand film) |
| 10 §3.5 `mist` over the union of the mist chapters | a window three viewports tall round the reader, rebuilt every 40 px of scroll | 90 % of the mist sat off screen down an 8000 px union |
| 10 §3.5 `fall`: ink pours over the night's top edge | long drips only in the two margins, as on a phone | drips on the free side of the old night head ran over the dusk strip's sentences |
| 10 §3.2 / 30 §2: focus pulls between depths | the focus goes to −170 px for 0.52 s at each change of dominant chapter, then lands on the glass bodies' depth | built as specified; never judged live |
| 30 §2: inside a figure box a camera may orbit | not built: every night figure is a front view (`code` is seen a little from the side) | not reached this round; the review lists it as the ceiling |

## Glass (spec 30 §2–§4)

| Spec says | Built | Why |
|---|---|---|
| a few smoothly blended volumes with slow noise | up to 8 ellipsoids **cut by the page plane**: a dome standing on the paper, so every ray leaves through the foot (a plano-convex reading stone); the cover dome is 0.86 R tall, about 1.3× in the middle | a body resting on a point gave a flat "sliced" crown; a tall dome turned letters into dark blobs |
| leans away from the pointer and springs back | the lean is a shear (the top leans, the foot stays); spring k 9/s, damping 0.5 | blobs that slid whole read as a body skating |
| refraction with a small dispersion | dispersion grows toward the rim (× (1 + 2.5 (1 − cos i)²)): a thin spectral edge, clean type in the middle | readable type under the body |
| a soft contact shadow and a caustic crescent | one footprint for the whole figure (the field sliced near the page), cast away from the key; a crescent split per channel; seen through the body at 0.45 | per-blob spots summed into four caustics: milky |
| two or three soft rectangular lights | a white sweep with flags, a smaller key box (0.24 × 0.14) kept off the zenith, a fixed rim | a dark room outlined the body in navy; a key at the zenith mirrored a white sheet on the crown |
| the drop sinks into the edge of the dusk strip | it does, but not while a row of the contents holds it as a lens; the lens is a flat pill cut by the page; the drop keeps at least 6 px from the copy (a 6 px bead on a phone) and moves down the margin only once it is in it | the sink pulled the lens half off ABOUT; a flick dragged the drop over the statement |
| the rail lens: a hovered tile calls it | built; its raster holds its tile and both neighbours; the backdrop draws `srcset` images from the file's own pixels and honours `object-position` | `naturalWidth` under a `srcset` is density-corrected: the lens showed giant letters from the wrong corner |
| the Contact band: the drop comes to rest beside "Write to me." | a separate figure, `pool`, in every band's empty box (no drop travels on the other pages) | each page builds only what it can show (`needs()` in `fx-stage.js`) |
| no glass on night pages unless highlights prove cheap | none; only the band's pool shows on Consulting and Obla, where the band is day | not tried |

## What left the site (spec 30 §1)

Spec 30 allowed a lane to delete what was dead; SWEEP deleted it instead of leaving it for later: `fx-water.js`,
`water/` (the engine, its CONTRACTS, its dev pages), `fx-gl.js`, `dev-water.html`, `dev-gl.html`, `case.html`, the
plates `fx-plate-v1/v2/v3.webp`, `figs/`, `scripts/probes/water/`, `scripts/env-cycles/`, `scripts/port-mpm-kernels.mjs`,
`scripts/probes/rivista-next/fig02.mjs`, and the compare variants V2/V3 in the sources. `launch()` moved to
`scripts/lib/headless.mjs`. The `assemble.mjs` WATER assert stays, to guard against their return. `?gl=0` stays.
