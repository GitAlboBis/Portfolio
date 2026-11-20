# WORK lane — notes (spec 50 §4, wave 2) — DONE

## Done (on disk, nothing committed)
- stage/scenes/gallery.js (new). Frames:
  - head ("Nine works"): the nine plates at once, a row of glass standing in depth across the figure's half, all
    turned alike, the first nearest (lineup); it gives way to the travel as step 1 comes up (K damped 0.16 s).
  - steps: an arc bulging toward the reader. The plate in step at the apex (near, sharp, yaw −0.28, pointer tilt by a
    damped spring), the queue converging up-right behind it (deeper, softer, turned, seen through the near glass), the
    read plate leaving right past the camera twice as fast as the next arrives. Plates hold through the middle of a step
    (hold()), travel at its edges; s damped (tau 0.16 s). The last plate stays at the apex and leaves with the scene.
  - placement composed in screen space, converted through the stage's perspective (D = 1.25 x diag, 1100..2600).
  - six captures as tex; three etched canvases (figure + line, display face, from the step's [data-slab-words] DOM:
    no word in the script) via ctx.texture; the host gates slab.etch on its texture being held.
  - swarm: "rail" (7 strands along the arc's floor, px fit, setTargets when the layout changes, shift with travel,
    from the apex back) + the night mist (rotated a little with the travel). Keep-outs over the text.
  - a plate gives way (alpha) where a text block passes through it (phone, between steps): never over body copy.
- stage/scenes/evidence.js (new). Two formations (set1, set2): cloud targets sorted by x, revealed by one sweep from
  the left edge (reveal [0, grow]); target count = the set's particles at the tier (spare targets left gaps); carry 1 so
  bars ride their rows. Desktop: bars in the figure's half on each row's line (before dim, 2 strands; after bright,
  4 strands; a faint full-length guide); set 1 is drawn early under the head as a centred chart and docks onto its rows
  during step 2. Phone: bars in each row's strip under its numbers. Rows under 3 % both: no bars (the row's own words).
- css/page-work.css: gallery title card low-left on desktop (flex-end, 15svh), name clamp(2.75rem, 6.2vw, 6.5rem),
  tabular figures; .mx-bars keep their place in scene mode and go invisible under html.stage-on.
- parts/strings.mjs: + work.lg1.eyebrow ("Sphere AI · SerSan", same: true); parts/c-main.work.html prints it instead
  of the literal.

## Decisions
- No camera move from the scenes (gallery camera 0 with pointer 0.5; evidence pointer 0): the travel is the plates
  moving along a fixed arc, so the composition is exact in screen space; the host's pointer follow adds parallax.
- A layout shift on stage-on made the host's measured rows stale (ResizeObserver watches body height, which the
  sticky scenes' min-height keeps constant): bars landed 18 px per row off. Fixed by never changing layout on stage-on.
- Phone evidence: no early chart (a set is taller than the figure's part of the screen).

## Open (for others)
- HOST: measure() is not re-run when a section's inner layout changes but body height does not (sticky scenes have a
  fixed min-height). Any lane that toggles layout on html.stage-on will see stale marks.
- HOST/CORE: on a phone (tier B, DPR scale 0.85) thin particle bars read soft; fine at rest, transient strays while
  particles migrate in from the mist.
- During a long jump (End key, anchor) the gallery travels through the intermediate plates (s damped): intended.
- On a phone, between two steps the plate hides while the leaving text crosses it (about half a screen of scroll).

## Run / look
- python scripts/serve-static.py 5205 public → http://127.0.0.1:5205/proto/rivista/work.html?debug=1
- capture script (session scratchpad, not in the repo): cap.mjs <tag> d|m g0 g3 g3.92 e2 … (gN gallery step N,
  eN evidence step N, .NN = place in the step); env LANG2=it, PX/PY pointer, SEQ=ms,ms, FM=1/ST=1/PL=1 debug.
- final captures: .shots/z-work/final/, .shots/z-work/final2/, it/, ptr/; printed: .shots/z-work-r, .shots/z-work-n
