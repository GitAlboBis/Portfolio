# r-fix — wave 2 fix lane (port 5301)

- Started 2026-11-12. Task: answer the 13 critic findings (r-critic.md) in order, then per-page checks.
- Done: #10 fx-stage passes "edge". #5 field.js `across` on a light (width axis held; the x->y reference flip at
  |dir.y|<0.95 turned leaning blades edge-on); room.js glow blades lean 1.05 vw, narrower (0.048 D, aspect 3.6,
  spread 0.012, soft 0.38), haze x1.9: slanted shafts with edges (blade2/). #1 index.js wall -0.6 D, sweep [0,1]
  on desktop, subject 0.5/0.6 (idx2/index-y2.9.png: grid, two shafts, chips).
- Done (2): gallery.js: the clear (etched) plate no longer steps aside from its own face (clearI); phone apex clamped
  into its band. Badante 1.0 at y5869 (was 0.17). #11 same cause: fast film shows one dim frame (100 ms) instead of 300.
- Done (3,9): path.js: panes projected with the frame's pose and held to 0 where they meet text (every step, not only
  the straight view); passed panes leave by d=-0.4; panes stand up-left of the line (beside it, not through).
- Done (4): shot.js project()/clearOf(); obla.js and path.js pass the field's `clear` (all chips in the subject's box).
- Done (6 part): field.js builds the chip atlas at creation (not at the first ask).
- Done (8): gen.js: the made part on a fine lattice (1/96), flow off and fuzz 0.06 once made, ink x1.9: a sharp mark
  with stepped edges (gen2/crop.png); some speckle inside remains.
- Needs elsewhere: fx-nav.js arrive(): wait for FX.stage.frame (cap ~250 ms) before the card clears (#6).
  hero.js: litSignal + no cold intro on arrival.cut (#7). splat/: look (#12, splat lane).
- Proof so far: steps-d/sheet-a.png, sheet-b.png (beside rest-1440), steps-m2/sheet.png, steps-d1/sheet.png,
  film/fast-gallery.png, text/sheet.png (text clean), gpu-d.log / gpu-m.log (peaks <= 3.13 index, sleep 0 frames on
  all), cover/pair.png (same image; diff = the clock phase of ARRIVE's earlier start: 0.9 offset-matched vs 0.4 noise).
- Run: python scripts/serve-static.py 5301 public (+5306 for .shots/r-fix/_before/public); scripts in _scripts/:
  still.mjs <m|d|d1> <page> <tag> s<i>|y<f>..., dbgm.mjs (state at a step), steps/gpu/film/textcrops (critic's), cover.mjs, states2.mjs, first.mjs.
- Atlas: eager ONLY under an arriving sheet (data-arrive): on cold loads it cost ~60 ms of first frame (A/B measured).
- Numbers: first frame ms mine/HEAD desk index 349/558, work 368/571 (305 without eager atlas), about 343/567,
  consulting 416/562 (306 w/o), obla 352/559, case 344/572, cut 195/437; phone work 359/551, about 324/559, obla 349/560.
  No long task > 50 ms. GPU peak 1440x2: index 3.07-3.13 (as the critic's 3.08), gallery 2.47, consult 2.50, others
  <= 2.3; rest <= 2.14; 1920x1: <= 2.05; phone B <= 0.97. Sleep 0 frames on all six (mouse on page).
- States: gl=0 / failfield / IT / 404 clean (states/), reduced + stage=0 same as HEAD (misc vs misc-head). Gates OK.
- Cut film film/cut-hdr-obla.png: push 200-300 ms, chips come with the room (850 ms); one blank sheet frame at 700
  ms remains (fx-nav, Needs elsewhere).
- STATUS: DONE 2026-11-12, servers 5301/5306 stopped.
- Captures: .shots/r-fix/ ; scripts in .shots/r-fix/_scripts/
