# INTEGRATE lane — notes (round "Storia")

- Lane: INTEGRATE (port 5185). Owns the whole round now (parts, styles, strings, fx-stage.js, stage/**); not water/engine/**; no commits.
- Plan: cross-lane requests -> assemble + gates -> captures EN/IT 1440/390 + --reduce + --nogpu + a case page -> judge per chapter -> one fix batch -> recapture once -> this file.
- State: nothing built yet.
- How to run and look: `python scripts/serve-static.py 5185 public`, `GATE_MAX_STEPS=30 node scripts/visual-gate.mjs integ/<tag> proto/rivista/index.html ... --base=http://127.0.0.1:5185`.

## Log
- assemble (fx-stage.js now in every page's module list), --check exit 0, claims OK.
- r1 gates (visual-gate, GATE_MAX_STEPS=30): EN+IT home stage on CLEAN; --reduce home+case CLEAN; --nogpu home+case CLEAN (1 known warning); case CLEAN.
- d1 glide captures EN 1440 (.shots/integ/d1): plume, ring, current, letter, mist, fall, gen, cut, code, agents, obla 1-5, dawn, contact.
- Found and fixed (batch 1): phone figure boxes not on screen during their steps (sticky above the entries, fx-scroll.css §12c + fx-scroll.js scenes on at every width + fx-stage.js reading line 0.7 below 1024); Obla's body drawn as a pale ghost on the contact band once the night left the screen (character.js: no band = not drawn); gen sharp by half its step (was 0.7); code typed by 0.6 with a 12 % head start (was 0.85 from empty).
