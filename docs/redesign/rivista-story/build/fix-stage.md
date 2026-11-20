# FIX-STAGE lane — notes

- Lane: FIX-STAGE (port 5194). Owns `stage/**` and `fx-stage.js` only. Base HEAD `60cd604`.
- State: fixes in, gates green; final captures in `.shots/fix-stage/final/`.
- Scratch tools (session scratchpad, not in the repo): `cap.mjs` (headless capture by JSON spec), `px.mjs`, `reg.mjs`.

## What changed and why

1. Cover body (material fix 1). Cause: the body was a near hemisphere (sz ~1.05), a strong magnifier: the crown showed
   the blank gap between the lines and letters under the rim were pushed into the Fresnel band and lost; the room's
   reflection (walls 0.5 x paper) at every incidence greyed the ink seen through it. Fix: `day/drop.js` BODY sz ~0.56
   (still a full round crown, about half the height), absorb 5e-5 -> 1e-5; `glass/glass.wgsl.js` splits the studio into
   `studioRoom` + `studioLights`: the room comes in only toward the rim (contour), the lights are added on top as thin
   shapes. Measured: ink through the body 32 vs 34 outside (was 49).
2. Beads (fix 2). `day/beads.js` rewritten: one or two low drops resting on the rule, foot clear of cap height,
   caustic 0, faint shadow.
3. Day ink (fix 3). Cause: formations spread in depth (z -90..-110 to +40) went soft by depth of field (energy kept:
   peak falls with area) and summed into cool low-alpha cobalt, which reads as pale grey-violet / whitish on warm paper;
   free-strand mist added a haze. Fix: `current` 4 sharp threads in lanes (z +-16), `mist` 3 threads a side near the
   page (2 on a phone), no free mist, `rest`/`plume`/`fall` pool tightened, `ring` 5 threads with a shallow tilt.
4. Ring (fix 5): thin crisp line round the plate; Fig. 02's caption is now an ink keep-out (`fx-stage.js`).
5. Night: `night/lib.js` `hurry()` (stiffer, faster motion for ~1.4 s after a step / state change) on gen, cut, code,
   agents, obla; `stage.js` + `wgsl/sim.wgsl.js` slot `carry`: a sticky figure's ink rides with its box (the "smoke"
   above Obla's box was ink trailing the sticky box during the scroll). Obla's sessions: larger windows, frames carry
   more light, less fuzz while working.
6. Contact (ceiling): `fx-stage.js` rests the band's drop on "Write to me." on the Contact page (`.band-page`), a
   lower lens (`day/pool.js` OVER); new `day/settle.js`: rings of ink settling round the drop on every band; dawn off on
   the Contact page; the band's address is an ink keep-out. Pool glass: plano-convex, dimmer key, caustic a trace.
7. Camera in night boxes (ceiling): `night/lib.js` `camera()` (damped yaw/pitch from scroll and pointer) on agents and
   Obla (particles rotate, Obla's face turns by part of it).

## Close

- Gates: assemble exit 0, `--check` exit 0, claims OK (32 pages). Server 5194 stopped.
- GPU (headless, timestamps): cover 1440 0.40 ms (sim 0.11, ink 0.16, canvas 0.13); cover 390 0.17 ms (tier B);
  Work 0.26 ms; Consulting step 4 0.44 ms; Obla 0.22 ms. No halvings.
- Night resolve after a step change: ~0.5-0.7 s (it10 `t-sheet.png`). Note: the review's "2-3 s" frames and my own
  first night captures were partly a capture artefact (a shot taken right at the end of a glide).
- Open: on the phone cover the fall's pool at the dusk edge is still a soft band and the dawn drips under the strip
  leave short pale tails on paper; the Contact lens is calm but modest at 1440 (about 200 x 110 px).
- `settle` ink rings can cross the display line's letters (as the cover's orbit does); the address is a keep-out.
