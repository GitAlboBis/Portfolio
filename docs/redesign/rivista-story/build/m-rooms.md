# m-rooms (wave 6, lane ROOMS) — started 2026-11-20 (first run cut before any change; second run on Opus 5.5)

## Done (uncommitted; the director commits)
- **3, THE PATH'S DATES** (`stage/scenes/path.js`). Cause, measured with a model (`_scripts/pmodel.mjs`): seen down the
  line through the long lens every pane after the next converged on one vanishing point, and the sine sway swung nodes
  2 and 3 back over the pane in step. Fix: (1) a wide screen's line BOWS (each step to the next node a little longer,
  a third of the old sine on it for the S), node 0 lower-left at the head (0.14/0.78, vanishing toward 0.46/0.16);
  (2) THE GUARD: each pane's box projected every frame with the frame's real eye (pose + clock drift via `shot()`,
  the hand's orbit mirrored with the stage's damping, the speed lens), nearest-its-step first, a pane within 6..30 px
  of a shown one steps back, no skipping a station; (3) the line ends, feathered (0.12), 6 % of the width inside the
  figure's edge (its tip pointed at the heading). Phone unchanged (one pane at a time).
- **1, MORE WORK** has the index's figure: a prism of cut glass (`shape: "prism"`, the cover's values) in the free third
  (`css/case.css`: More work's rows keep 61.6 % in scene mode from 1024 px), the room's shaft into it from above, ONE
  ray out of it to the verb of the row under the hand / with focus, else the row being read (`case/figures.js`
  kind "more"; `mist.js` imports `lib/prism.js` and forwards `passes`). A phone: the prism alone, small, centred in the
  gap between the cued row's title and its verb, 8 px clear of the row's glyphs (rows with no room have none), hopping
  rows with a 0.2 s fade. Also fixed: More work's label was sticky (the chapters' margin rule) and slid over the titles.
- **2, THE PHONE**: the record has a band (36svh) and the work's plate again, smaller, further back, turned the other
  way; a list's and a schematic's rows past their band carry a THREAD of light down the numbers' column, from under
  each number to above the next, lit row by row as rows pass 72 % of the frame (the counts' machinery: `tallySet`
  learned a vertical strand; keep rects split into the words' column + each number).
- Looked at: path sheets 1440/1920/390 en, 1440 it, a travel strip (`.shots/m-rooms/r2/`); cases desktop and phone,
  agricultural-supply-chain, sersan-io, sphere-ai (`c1`..`c3`), 1:1 crop of the phone prism.

## Next
- Gates (assemble, --check, claims), Astro build into `.shots/m-rooms/dist` + parity, asserts, claims; GPU once (case
  opener + one chapter); stop the server (python pid 13544 on 5364).

## Decisions
- The path keeps its travelling shot; panes that cannot stand clear are not drawn (the line's knots still mark them).
- More work's figure is the prism (More work is an index; the cover's index has the prism): no plate with a word or a
  number, no card. The phone's in-row figure is light (the counts' language), not small glass.

## How to run and look
- Server: `python scripts/serve-static.py 5364 public` (assembled pages, stage live).
- `node .shots/m-rooms/_scripts/path.mjs <d|m|d1> <en|it> <tag> [--strip=2]`; `cases.mjs <d|m|d1> <tag> [--it] pages...`.

## Needs elsewhere
- DOCS (DESIGN.md "The case template" table and 60-as-built): More work's prism; the phone's record plate and the
  thread under the numbers; About's path bow and guard.
