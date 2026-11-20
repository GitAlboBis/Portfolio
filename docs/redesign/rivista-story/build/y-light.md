# y-light — LIGHT lane notes (fix round, port 5211) · DONE (run 2)

- State: the three fixes done and looked at at 1440x900 and 390x844 DPR 2. Gates green. Server 5211 stopped, 5179
  untouched. Nothing committed.
- How to run and look: `python scripts/serve-static.py 5211 public` (background); one-off
  `<scratchpad>/yl-shoot.mjs <tag> [d|m|dm] [top,now,nowmid,dawn-index,dawn-work,contact]` → `.shots/y-light/<tag>/`
  (headless, ?debug=1, prints __stageHost GPU stats). Before: `.shots/y-light/before/` (= the committed state).

## Done
1. Cover (hero.js, cover/shared.js; begun in run 1, kept): the beam is now a sheaf of 64 straight rays x 64 points
   (was 30 quadratic threads) from a wide deep disc in the upper left (its far end reads under the header) through a
   bright narrow waist right behind the plate's upper half, ABOVE the name's capitals, running on past the plate and
   fading. share 0.62, ink 0.11, speed 1800 so the rays are formed inside the first 5 s rest window, curl amp 0.8 (a ray
   stays straight). Motes: 26 near points (z +170..+420) drawn large, soft, dim by the depth of field, upper room
   and right, never on the foot's left column; ink x2.6 on a phone (the inkArea scale quartered them). The name's
   capitals, line by line, are keep-outs (only the page's mist reaches them); the foot's text blocks too. Focus -330.
2. Now (now.js, cover/shared.js): the dotted `halo` frame is gone. New `field`: 36,000 targets (one per point: several
   points stacked on one target drew the sparkling dots), deep at z -520 out of focus: a squared-off glow as wide as
   the plate (bright under its four edges, so the plate's rims catch it) plus a long faint slanted band whose ends
   show past the glass. ink 0.16, x2.2 on a phone. The capture inside the plate untouched.
3. Dawn lines (day/threads.js, scenes/contact.js): every curve is gone. threads: 5 (phone 4) ruled strokes, each one
   straight at 2.2–6.4° (phone 5–11°), alternately rising and falling, crossing the edge once, cut to the room above
   (the night's last text) and below (the day's first text), ends fading in; depth linear (a straight line stays
   straight under perspective); curl 0.25. Contact: two straight strokes per band (over and under the line), 4.5°
   (phone 8°) at most, each pair crossing once, the upper pair right of the middle and the lower left of it (two
   crossings on one vertical read as a bow); curl 0.25.

## Decisions
- Kept run 1's beam composition (v5): the director asked for presence and depth, this frame has both and the name
  and foot stay clean. On the phone the sheaf comes down into the plate's top edge from the upper left (a cone of
  rays): the top 45 % of the screen now holds the light.
- The Now field is a soft cloud behind the plate, slightly mottled at DOF size; it reads as backlight, not a frame.
- GPU (tier A, 1440 DPR 2): cover 1.5–1.8 ms, Now 1.35–1.5 ms, dawn closes 0.17 ms, Contact 0.14 ms. Phone (tier B):
  0.64–0.70 ms. All under 3 ms.

## Looked at (final)
- `.shots/y-light/r2e/d-top.png`, `m-top.png` — cover first viewport: rays, waist at the plate, motes, name clean.
- `.shots/y-light/r2e/d-now.png`, `r2d/m-now.png` — Now: no outline, soft field behind, rims lit, capture sharp.
- `.shots/y-light/r2f/d-dawn-index.png`, `r2b/m-dawn-index.png` — cover close: ruled strokes across the edge.
- `.shots/y-light/r2b/d-dawn-work.png`, `r2g/m-dawn-work.png` — Work close, same.
- `.shots/y-light/r2g/d-contact.png`, `r2f/m-contact.png` — Contact: two crossing pairs of straight strokes.

## Open
- A few captures under load came out before the stage switched on (html.stage-on not reached in 15 s while other
  lanes ran Chrome); a retry with a 40 s wait drew normally. Not a defect of the scenes (console clean).
- The motes are soft round out-of-focus discs (asked for); dim, but they are bokeh: if the director reads them as
  beads, drop `motes` from hero.js's swarm list (one line).
- Not mine, from the brief: About's thin stack layers on the phone (stage/scenes/stack.js) — skipped as told.
- The plate's dashed far edge in the cover frame is the GLASS lane's.
