# r-night — GLOW-NIGHT lane (wave 2), port 5302

- Owns: stage/scenes/{stack,path,consult,obla,index,dawn,contact}.js, stage/night/**, stage/day/**.
- Goal: decisions A (lit room), B, C (path panes + full line), F (Obla rays, gen mosaic), shot.js pivot settles.
- Status: DONE 2026-11-12 (servers 5302 / 5307 stopped). The director looks at .shots/r-night/final/ and commits.
- Next: nothing in the lane; see Still wrong.
- Run/look: python scripts/serve-static.py 5302 public; .shots/r-night/_scripts/ (steps.mjs <page> <scenes> <tag> [--m|--hd] [--q=] [--only=]: a still per step after quiet; hover.mjs index rows; sleep.mjs <page> <fraction>: submits in 3 s after 20 s quiet with a pointer; gpu.mjs; first.mjs mine vs HEAD copy on 5307 from _before/).

## Diagnosis (baseline .shots/r-night/b0/, beside .shots/s-final/rest-1440.png)
- PATH: panes black cards, the line a short streak out of the pane in step, wall at -2.4 D (sparse chips, far small blades), last step showed SEP 2026.
- STACK: grid and glass read; chips sparse, no blade with body.
- CONSULT: chips sparse; gen a grainy mark with horizontal bands.
- OBLA: a soft round halo of points round the character.
- INDEX: no emblem without a cue (the rest lattice barely there).

## Done
- night/shot.js: LIT(c) = the kit's `glow: 1` (GLOW-WORK's room.js: the cover's columns of light, larger rimmed chips) + the cover's chip count (11000 / 7000) + the blades swept on the figure's half; roomFor passes fade 0 when `ctx.arrival.cut`, else 0.2 s. (An own variant moving the blades to the side, x1.7, was tried, A/B in kit/sheet.png, and dropped for the kit's: one studio for every page.)
- path.js (C): the eye goes back to the straight view only once the LAST step's text has left the screen (it blended from progress 0.93): JAN 2022 stands beside the B.Sc. at its last step (final/about.png, phone too). Panes as lit stations: node spacing 0.34 D (was 0.5), wall -1.85 D, wider sway so the far panes stand apart (1920: NOV / JAN 2022 separate, hd/about-path3.png), glow 1, sharp >= 0.72, bevel 9, sheen 0.6, tint 0.2. The line: PER 2600, even through all five, deep focus (aperture 0.28: at 0.7 the line past the pane in step blurred past the bokeh limit and faded = the comet). Settling eases.
- stack.js: damp settles (1e-3): About sends 0 frames at rest (was 2 per 3 s); LIT room.
- gen.js (F): the preview is a MOSAIC: aligned square cells (1/16, 1/10, 1/6 of the side by distance from the line), each one flat square at the cell's average light with a 14 % gap, points on a stratified lattice in the cell, no boiling flow (amp 0.6, fuzz 0.25); the made part even (ink 0.62..1). g1/crop0.png.
- night/obla.js (F): idle and approval halos are short straight rays (14 / 10), listening streams in on 12 straight rays in the figure's plane (was a sphere: a round cloud). Character untouched.
- obla.js: phone band eases settle; LIT room. consult.js: LIT room. index.js: the fan spring settles; rotations rounded (outline's yaw crept); rest lattice ink x2.4, outline x1.4; the emblem's place keeps a dim subject light between cues; LIT room.

## Numbers (GPU median ms, other lanes' Chrome running: ~50 processes; measured twice where a halving showed)
- 1440 DPR2 rest / peak: About stack 2.13 / 2.23, path 1.9-2.0 / 2.33 (HEAD copy path 1.33: +0.6 for the lit line and room); Consulting 1.03-1.31 / 2.19; Obla 0.85-1.03 / 2.40; index 1.18-1.43 / 2.15. Halvings: one or two showed in 3 of ~25 runs (About, Consulting) and not on rerun; HEAD runs alternated with mine showed none either way: contention, not reproducible.
- 1920 DPR1: About 1.37 / 1.51, Consulting <= 1.22 / 2.13, Obla 0.62 / 2.14. Phone B: About <= 0.94 / 1.02, Consulting <= 0.32 / 0.67, Obla <= 0.41.
- Asleep with a pointer on the page after 20 s: About (stack, path), Consulting, Obla, index: 0 submits in 3 s.
- First frame (3 runs, median, mine / HEAD copy): about 309 / 579, consulting 302 / 562, obla 318 / 576, index 350 / 546 (ARRIVE's host work in the tree); no long task > 50 ms after it.
- States: it/about, it/consulting clean; ?failfield=1 (Obla in the plain night, no room), ?stage=0 and ?gl=0 printed pages; visual-gate --reduce CLEAN on about / consulting / obla; console clean everywhere.
- Gates: assemble --check exit 0, check-claims OK (no build input touched).

## Still wrong (ranked by what Alberto would notice first)
1. The night rooms are lit, but not the cover's density of light: the cover has its bright name lighting the hall; here the subject (a pane, a layer, a figure of points) is dimmer, and chips read sparser at the edges. Beside the cover's frame they belong to the same film, a darker reel of it.
2. Path: the line near the eye is a broad grainy band of points (its nearest part is out of focus) and makes an S through the first pane at the head; the panes' glass is still darker than the lit wall behind it (clear plates show only the swarm and the wall through the ink plane; a plates/ look, not mine).
3. Passed path panes fade past the eye as large ghost dates (NOV 2025 at the B.Sc. step, phone and desktop), dim but legible above the step's label.
4. gen's made mark still reads speckled at 1440 (the plate's sampled points are uneven); the mosaic below the line reads as squares now.
5. Obla's idle rays read a little like a drawn sun; thinking's tilted rings are still soft clouds of points either side of the body.
6. Phone: Consulting's head shows gen dim (the figure is small and deep in the band above the text).
7. Index: the Obla row's hover was not verified by my script (the row sits at the bottom edge at 1440x900); wave 1 looked at it.

## Needs elsewhere
- none required. (plates/: a clear plate with nothing bright behind it reads darker than the lit wall around it, see Still wrong 2.)
