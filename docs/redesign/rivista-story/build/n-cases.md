# n-cases: a case as one continuous shot, a figure of light per chapter

Lane CASES, wave 5. First run 22:37 to 22:59 on 12 Nov (cut), second run 23:20 to about 01:10 (finished). Nothing is
committed: the director commits.

## Done
- `parts/c-main.case.mjs`: every chapter prints `data-ch="<type>"`. No other change to the page: the `<main>` of all
  18 case pages equals HEAD once `data-ch` is removed.
- `assemble.mjs` and `web/scripts/asserts.mjs`: one assert each, a case's chapters carry their types in the data's
  order (checked red on a copy with one attribute removed: exit 1; green on the build).
- `stage/scenes/case/figures.js` (new, 480 lines): reads the chapters from the page every 1.5 s, gives the room its
  text keep, two formations (`barsDef`, `lineDef`) and `chapterFigures(c, EYE)`: ONE figure in frame, chosen by the
  reading line, rising in from below and leaving upward and deeper.
  - what: the work's plate (the opener's texture or its etched key words), parked turned at depth.
  - teaser, facts: a clear plate turned the other way with the row being read etched (its number and its title, read
    from the row).
  - schematic: one column of small plates, one per node in order, each a step right and deeper, the name etched from
    a quarter of the width; a straight line of light threaded down BEHIND the plates' left margins (each plate bends
    it), lit down to the node being read; later nodes dimmer.
  - measured: bars of light on the rows, the before dim, the after bright, lengths from the template's `--w`.
  - list: a stack of thin plates with lit bevels, every number etched faint, the item being read lifted and lit.
- `stage/scenes/mist.js`: the figure's plates and formations, its light behind it (room subject), the orbit's pivot on
  it, the bloom a little up with its presence; `speedLens` on the scroll's speed.
- `stage/scenes/case.js`: shares the opener's plate (`CASE.tex / etch / asp`); `caseEye` sways and lifts down the
  chapters as one smooth function of the scroll.
- `css/case.css`, scene mode only (`html.sc-on:not(.gl-off)`): desktop chapter grid 2fr / 5.4fr / 4.6fr (the last
  third free for the figure) and the facts' number column 3fr (on the narrower measure "48,000" broke in two); phone:
  a 40svh band above each chapter except measured; the printed bars hidden while the stage draws.
- Phone: the figure stands in the whole band and rides with the page; the band's passage up the screen plays the
  chapter's items through it (a schematic's nodes slide along the line). Measured: bars in the rows' own strips.

## Decisions
- One figure at a time, a short hand-over (0.18 of the viewport height): at most six plates (schematic 6, list 5).
- The schematic's line: a zigzag through the plates read as a lightning stroke, a line beside them ran through
  nothing, a row with the line under it (phone) read as a horizon. One column, one straight line behind the glass.
- A phone's measured rows keep clear only their words (and a note under a strip), so the bars can stand in the strips.
- The layout cache is keyed by the page too (on the Astro build the modules outlive a navigation).

## Measured (final code, the Astro build of this lane served on 5342; other lanes were rendering: noisy)
- GPU 1440x900 DPR 2 tier A, at rest per chapter: what 1.0, schematic 1.5 to 1.6, measured 0.8, list 1.4 to 1.9,
  facts 1.1 (limit 2.6). Peak over a reader's scroll, chapters: 2.02, 1.80, 1.98, 2.96, 2.84, 1.67 over six runs
  (limit 3.3). 1920 DPR 1: rest 0.7 to 1.2, peak 1.47. Phone: rest 0.3 to 0.56, peak 0.69.
- Asleep: 0 frames in 3 s after 19 s of quiet on every run (desktop, 1920, phone). No long task during the scroll.
- First frame against HEAD (served from `git archive` on 5343), five loads each, median: desktop 653 vs 752 and 606
  vs 623, later 1065 vs 1038; phone 789 vs 1159, later 1000 vs 851. Inside the noise.
- Text: the canvas hidden at the same scroll against the stage on, over every line of text of every chapter of
  sphere-ai, maintech-oma, domus-tua: desktop max 10/255 and no pixel over 24; phone max 7/255 and no pixel over 24.
- Printed states (`?stage=0`, `?gl=0`, reduced motion, desktop and phone): same words and pictures as HEAD, the
  scene-mode layout off, the printed bars visible, no canvas.
- Astro build: a routed click from one case to the next keeps the stage (one canvas) and the next case's chapter has
  its figure; no console error.

## Open
- THE SWARM WAS HALVED in 3 of about 14 reader passes on sphere-ai (never on maintech-oma or domus-tua in the same
  sessions): `[stage] over budget` between the schematic and the measured chapter. Single samples of 5 to 7 ms
  appear at changing places, also with no plate in frame, and a slow even scroll shows 0.8 to 1.7 ms throughout, so
  the cause read as GPU contention from the other lanes. Not proven: re-measure on a quiet machine
  (`node .shots/n-cases/_scripts/trace2.mjs case-sphere-ai`).
- The opener's peak (scene "case", not changed here) read 2.46 and 2.74 before 00:13 and 3.41 to 6.78 after the
  host and the engine were edited by another lane: for INTEGRATE.
- Still wallpaper: the record and "More work" have no figure; between two chapters the free third is empty for
  about two frames at reading pace; on a phone the text under the band stands alone for whole screens.
- May read as a card: the facts and teaser plate (a rectangle with the number the text beside it already prints),
  and at 1440 every plate is about 450 px wide, a third of the frame, not architectural in scale.
- The schematic's line reads cobalt, not white, and on a phone it is the strongest thing in the band.
- The opener's plate leaves upward and the "what" plate rises from below: two plates, not one plate flying to its
  place.

## How to run and look
- Serve the lane's build: `python scripts/serve-static.py 5342 .shots/n-cases/dist public` (stopped on return).
- Stills: `node .shots/n-cases/_scripts/chap.mjs d|m|d1 [--items] [--tag=x] case-<slug>` (BASE=.../it/ for Italian).
- Sheets: `sheet.mjs`; strip: `strip.mjs d case-<slug>`; text: `textproof.mjs d|m case-<slug>...`; GPU, sleep,
  halvings: `gpu.mjs d|m|d1 case-<slug>`; fast passes: `trace2.mjs`; printed states: `printed.mjs`; routed click:
  `nav.mjs`; numbers on one line: `wrap.mjs` (its `.mx-n` flags are false: the hidden "to").
- Captures: `.shots/n-cases/d5` (final desktop stills and sheets), `m5` (phone), `it1` (Italian and 1920), `d8`
  (spherenode, sersan-io), `strip-d`, `strip-d2`, `d5/crops-1to1.png`, `text-d`, `text-m4`, `nav`.
