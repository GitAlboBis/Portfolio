# l-stage — STAGE (the home's stage), wave 7

- Done (run 1, on disk; its notes were cut at 23:38 and are completed here from git diff):
  now.js (read `field.wall`, gone with COSMOS: the scene threw, no plate/keep-outs over Now; asks the hero's look);
  contact.js (the line falls back to the h2 in the home; draws the edge of day's threads at Contact's straight edge);
  fx-stage.js (looks mixed by weight, `lookOf`; scenes registered AHEAD of the reader, `nearAt` + `pump` + `pumpIdle`,
  S.ready; Back aims at `__rvSoftY`); stage.js (the swarm restored with hysteresis: RESTORE_K 0.5, 4 s calm, doubled
  after a rebound within 12 s, cap 60 s; `restores` in stats); case/etch.js (one etch for gallery + case: balanced rows,
  line size floor 96..136 canvas px, U+00A0 holds); gallery.js (imports etchCanvas; lineup spread over L.n works; plates
  behind an etched plate step back); index.js deleted, cover/shared.js trimmed; "nine" comments; README (index gone).
- Done (run 2, 21 Nov 03:38-05:20):
  - contact.js: in the home the dawn close's sharp straight camera (aperture 0.2, the pointer orbit kept as 0.4 x
    PTR_FOLLOW) and the strokes' upper band from Contact's own top (it spanned the whole document). Before: the edge's
    threads and the strokes were a blurred haze across the edge (blended with Obla's open lens).
  - obla.js: its light, body and points (ink, through a wrapped formation `oblaLit`) go while the day's edge rises
    below the figure (the report card crossed into the paper as an ink ghost); on a phone its band stays under its own
    section's top and the character comes up as the part takes the screen (it stood huge and grey across Consulting's
    "WRITE TO ME"). Both also improve Obla's own page close.
  - gallery.js: a plate behind an etched face all but goes in the opening row (cover x3 -> a tenth): SphereNode's
    capture no longer reads through "EARNED AUTONOMY".
  - stage.js + sim.wgsl.js: restored points appear on their targets (radius -1 sentinel; zeroed records flew in from
    the document's corner); the ink per point eases back after a restore (no dip, no flash).
  - fx-stage.js: `?budget=<ms>` (with ?debug=1) to watch halving/restore on a fast GPU; a cold load imports only the
    scenes near the reader (`loadScenes(aimY)`, lazy scenes; `loadLazy` in the pump, page order kept); boot.js fetches
    only the first three scenes of a page with more than four; field.js `webEarly` + boot.js start the cosmos's web in
    the adapter/device wait (it was on the first frame's critical path).
  - README: the field is the cosmos (lights, chips, cosmos), the room's text.
- Proof (run 2): looks h1/ (1440), hm/ hm2/ hm3/ (390), hd1/ (1920), hit/ (IT gallery), hg/ (opening row); joins as
  strips j1/ (five joins), j2/ j3/ (Obla -> Contact after the fixes); flights strip/ home2about, plate2case, case2home,
  back, back2 (Back lands at y 16813 exactly; the near scenes adopt first, 7 ahead); swarm.mjs (budget 0.8: 6
  halvings, 3 restores over the whole scroll down and up; heap 11.2/14.4/14.8 MB, listeners 142, formations 22 flat);
  GPU gpu-r1.log, gpu-r2.log (CPU 0-31 %); first frames ff.mjs; sleep 0 frames in 3 s after 19 s (Obla part).
- Measured (21 Nov 04:09-04:32, two rounds, lane home part / HEAD page on the live site, rest median, peak max):
  1440 DPR 2 A: hero 0.80/1.04, peak 1.29-1.31/1.50-1.83; Now 1.48/1.70, 2.34-2.39/2.47-3.11; gallery 1.70-1.72/
  1.59-1.65, 2.26-2.31/2.00-2.11 (eleven plates against nine); evidence 0.61/0.82; stack 1.27/1.70, 1.73-2.14/
  3.13-3.91; path 1.14/1.36; consult 0.53/0.79; Obla 0.29/0.51; Contact 0.16/0.14. 1920 DPR 1: Now 1.63/1.81, peak
  2.72-2.84/2.52-2.67 (p95 2.25-2.58/2.39); gallery 1.55/1.24, 2.00-2.04/1.87-1.90; the rest under HEAD. Phone B:
  all rest <= 0.78, peaks <= 1.25 (HEAD 1.30). The swarm never halved. First frame (assembled pages, local, 7 rounds):
  lane home 387 ms median, HEAD cover 331 (before run 2's boot work: 420/331).
- How to run: assemble + --check + claims; Astro into .shots/l-stage/dist (from web/); serve 5383:
  `python scripts/serve-static.py 5383 .shots/l-stage/dist public` (dist holds copies of fx-*.js and stage/: rebuild
  after a stage edit). HEAD read-only: `git archive bc438dd public` in .shots/l-stage/headsrc (served on 5394 for ff).
- How to look: `.shots/l-stage/_scripts/`: home.mjs (a still per part step), joins.mjs (joins at 50 ms), fly.mjs
  (flights), swarm.mjs (whole scroll), gpuhome.mjs + gpu.sh (GPU per part), ff.mjs / bootlog.mjs / res.mjs (first frame).

## Decisions
- The joins keep each part's own figure (none is carried across): between two parts the frame is the cosmos
  travelling, never empty. The night's temperature follows the home's whole scroll (cool at the hero, warm toward
  Contact: one page that ends at the dawn).
- The restore bar is half the budget (a frame cost affine in the count cannot exceed the budget after doubling), and a
  halving within 12 s of a restore doubles the calm needed: hysteresis, never a pumping.

## Needs elsewhere
- MOTION (fx-nav.js / strings.mjs `cut.index`): the cut's card names the home "Index" / "Indice" (strip back/,
  case2home/): the index left the home.
- DOCS: DESIGN.md "The room" and "The cover" still describe the wall and the index; CLAUDE.md §1 (the index, the
  prism at the cover). stage/scenes/README.md is updated.
