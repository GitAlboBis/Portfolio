# w-work — lane WORK (port 5291), wave 1 phase 1 — DONE (for the director to look and commit)

- Owns: stage/scenes/gallery.js, evidence.js, case.js, case/**, mist.js; engine owner for small guarded changes.
- Run: python scripts/serve-static.py 5291 public ; .shots/w-work/_scripts/shoot.mjs <tag> <page> [--m|--d1|--reduce] [--q=..] [--steps=gallery:0-9,evidence:1-3,case:1-2,frac:40]; strip.mjs (travel strips), gpu.mjs (rest/peak, --only=, --port=, Q=query env), fld.mjs (fields per scene)

## Plans (as built)
- GALLERY. Shot: one page eye (gallery.js `workEye`, from the document scroll only, shared by evidence): back/low/left at the head, pushes in and pans right through the gallery, square at the straight depth by the measured rows. Plates: a dolly along a line toward a vanishing point upper right (780 px of depth a step); the next plate grows into the apex in perspective, the read one swings out right; an etched plate in step sends the queue aside (desktop too now). Light: room seed 4, subject light 0.26 behind the apex, blades kept on the figure's half (sweep [0.05, 1]); bloom ~0.5. The rail of light under the plates is gone (it read as a floor line).
- EVIDENCE. Same eye; bars on the page plane, rects shifted by the eye's lateral offset (they stay on their rows); the grid is the chart's paper; subject light low (0.13) on the set in view; orbit 0.05.
- CASE. `caseEye`: back on the arrival (0.12 D), pushes in with the plate and through the two steps, pans slowly left down the chapters; the plate composed in screen px then placed for the eye; room seed 7, subject light on the plate; the glow behind the plate at half its points (GLOW_W, ink x1.5): under the free camera it cost 1.2 ms. The room's alpha follows the opener's view (blend: false scenes are pooled at full weight by the host).
- MIST (chapters). Same eye; room dim 0.8, 3600 chips, no blades, no haze (a lit wall between text blocks cut them out as dark cards).
- Phone: room dim 0.5, subject light halved, keepFeather 24 (desktop 90 Work, 80 case).

## Engine changes (guarded, HEAD's image as default)
- lib/page.js (new): span / pageK / through.
- lib/room.js: subject.strength (default 0.42), sweep [lo, hi] (default the whole wall; the hand's clamp only when sweep is given).
- fx-stage.js: glyph boxes skip a 1 px visually hidden copy (the motion layer's sr-only sentence measured 1870 px wide and cut a full-width dark band); debug only: `__stageHost.last.fields` names each scene's field and weight.
- README: the two room options, blend:false + alpha, "ONE SHOT PER PAGE".

## Numbers (1440 DPR2 / 1920 DPR1 / phone B; rest median, peak max with the hand moving)
gallery-0 1.82/1.89 · 1.47/1.52 · 0.62 | gallery-1 1.49/1.56 · 1.18/1.22 · 0.45 | evidence-2 1.08/1.12 · 0.91 · 0.36 | case-1 2.01/2.09 · 1.68/1.73 · 0.85 | case-2 1.54/1.57 · 1.23 · 0.50 | chapters 1.00 · 0.97 · 0.33. HEAD case-1 1.62, gallery 1.21. One halving seen once on gallery-3 during a run, not repeated in three more (noise from another lane's browser).
First frame (three runs, 1440 DPR1): case HEAD 653-685 ms, mine 604-680; work HEAD 612-650, mine 595-634; no long task logged.
Gates: assemble --check exit 0; check-claims-proto OK. States: ?gl=0 and reduced motion stage off and plain flow; ?failfield=1 draws without the room; Italian fine; console clean everywhere.

## Still wrong (ranked)
1. The plates are dim against the lit wall: captures read a little dull, their edges barely light; the cover's plates read brighter.
2. The header's keep-out is a dark band under the nav where the subject light reaches the top of the wall (case opener, 1920 most).
3. Gallery travel between two plates happens in a short window at the step boundary (the hold): it reads as a quick dolly, not a long glide.
4. Between the last plate and "Measured before and after." there is a second of empty room.
5. Chapters are very calm: the grid is almost gone (dim 0.8) — calm by decision, but little of the room survives there.
6. The case plate still fades out as a ghost when the opener lets go (HEAD behaviour kept).
7. Phone evidence bars sit inside the keep-out fall of their rows (feather 24): ink raised x1.45 to compensate.

## Needs elsewhere
- none.
