# p-portal — the cut as a flight through a portal of glass (port 5322)

Owns: fx-stage.js, stage/stage.js, stage/boot.js (untouched), stage/scenes/lib/portal.js (new), fx-nav.js, css/cuts.css.

## Done
- `stage/scenes/lib/portal.js`: `portalPose(p, {vw, vh, D, side})` (the portal in VIEW space: a tall plate of clear cut
  glass, thin (3.5 % of its width), edge light rising with p, studio sheen off while it turns, on face-on; tall enough
  (1.75 vh) that its top and bottom never enter the frame) and `portalSlab(pose, {R, P, O, scroll})` (view -> the
  plates' slab: centre and yaw/pitch/roll undone through the frame's camera, so it reads the same under the orbiting
  camera, the free one and the push). `sharp: 60` keeps it sharp under the push's soften and the free camera's focus.
- `stage.js`: `stage.portal(to, {ms, from, side})` (returns whether the glass can draw now), `stage.portalState`
  ({p, to, drawn}), `stage.cut(on, at, {instant})`; the portal runs on real time, is put first in the plates' list each
  drawn frame, keeps the stage drawing while it moves; a glass that joins late enters (120 ms) only while p > 0.5 on
  the way out, else it is skipped; the room's etched plates step back as the glass comes (seen through another plate,
  plates.wgsl.js throughOther drops their etch and light: About's stack read as a grey card).
- `fx-stage.js`: fx:nav:start {side} -> push + portal(1, 300 ms) when the glass can draw -> `html.cut-portal`; at p 0.9
  `html.cut-full` and the stage pauses 140 ms later (the sheet is opaque). Arrival with `__rvArrive.portal`: the stage
  opens pushed in and inside the glass (cut instant, portal from 1); on fx:nav:uncovered the eye comes out (push back,
  portal 1 -> 0 in 350 ms), never waiting for the glass (PORTAL_WAIT_MS 0). Reset / pageshow: portal off, classes off.
- `fx-nav.js`: side = the clicked link's half; fx:nav:start {to, side, dawn}; fallback `cut-full` at 340 ms; rv-pt
  records {side, portal}; reset clears the classes.
- `css/cuts.css`: under `cut-portal` the rising sheet is held at opacity 0 (its card plays on its own clock, fx-motion
  untouched); under `cut-full` it floods in in 110 ms (night-2, or the dawn toward Contact = the glass floods to paper).

## ONE API, for the persistent stage (Astro router, later wave)
The two halves are one progress on one stage: at the click `stage.portal(1, {ms: 300, side})`; while p = 1 swap the
scenes (the eye is inside the glass, the frame is glass); then `stage.portal(0, {ms: 350})` and `stage.cut(false)`. No
sheet, no class: drop `cut-portal` / `cut-full` and the arrival code in fx-stage.js (ARR_PORTAL, comeOut).

## Measured (headless, other lanes rendering: noisy)
- Cut timing unchanged vs HEAD (strips, ms from click, mine/HEAD): uncovered 892/940, 784/825, 838/880; arrived
  1181/1232, 1081/1132, 1133/1176. First frame after a cut 753–778 / 720–825. pairs: 32 rows twice 0 (desktop); phone
  same as before (its work->case click fails in the script, as in r-integrate's log).
- GPU while leaving Work (1440x900 DPR 2, tier A): median 3.1 ms at full cover (HEAD 1.55), max 3.4–3.6 (HEAD max 5–7,
  noise): AT the 3.3 peak limit while the glass covers the frame (last ~3 frames). Phone 0.41 (HEAD 0.24).
- Asleep after (0 submits in 3 s after 19 s quiet), Back/Forward clean, console clean, ?stage=0 / ?gl=0 / reduced: no
  class, plain sheet.

## Open
- On this machine the arriving page's plate pipeline is in at 435–850 ms page time, after the sheet starts leaving
  (~310): so the arriving half is the push back only (the eye comes out, soft to sharp); the glass falls away only when
  the plates are already in (looked on a bench: arr-about4). Making it always visible needs the plate pipeline faster
  or cached (plates lane).
- Body text is covered (not bent) while the glass sweeps across it (~150 ms): the glass bends only data-refract type.

## Needs elsewhere
- stage/plates/plates.wgsl.js `throughOther`: a plate seen through another one is shaded without its etch, its edge
  light and its sheen cut (it takes full reflections): an etched plate behind the portal reads as a grey card. Today
  stage.js fades etched plates while the portal is up; with the fix that fade can go.
- stage/scenes/README.md (not mine): a line on `stage.portal` / `ctx`-free use, pointing here.

## Run and look
- `python scripts/serve-static.py 5322 public`; HEAD copy on 5327 (`.shots/p-portal/_before/public`).
- `.shots/p-portal/_scripts/strip.mjs <tag> g2case|hdr2about|hdr2contact|case2cover --port=5322|5327 [--ms=25|50] [--m] [--debug]`
- `arrlook.mjs <tag> <route>` (the arriving half with the glass in), `checks.mjs [--m] [--port=]` (GPU through a cut,
  sleep, Back/Forward, console), `plain.mjs` (stage=0, gl=0, reduced), `pairs.mjs [--m]`.
