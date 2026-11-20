# o-fix (wave 4, FIX lane, port 5330)
- done: notes stub created; nothing else yet.
- next: read o-router.md, o-glass.md, o-critic.md; fix critic findings 1..8 in order (broken pages first).
- decisions: (none yet)
- run/look: python scripts/serve-static.py 5330 public (and web/dist); captures in .shots/o-fix/, scripts in .shots/o-fix/_scripts/.
- needs elsewhere: (none yet)

## Log
- F1 language switch (Astro): FIXED. Cause: the head's inline boot differs EN/IT (../ list) so Astro's runScripts ran
  it again on the first cross-folder swap (second loader, second adapter+boot.js, second fx-stage building its own
  stage). rv-router.js swapPage marks every inline script of the new doc data-astro-exec. repro langabout: "adopted"
  both ways, 1 canvas, it/about shows COMPETENZE (.shots/o-fix/repro/langabout-5330/t6000.jpg).
- F2 double click: FIXED. fx-nav onClick swallows any link click while leaving; router click handler ignores clicks
  while a job is pending; fx-stage adopt() sends the portal to 0 when there is no portal arrival. dbl3: p=0 at 1.5 s.
- F3 portal: portal.js PORTAL.door (doorPose): a tall thin pane met head on in the middle (a little toward the clicked
  side), its arrises part from the middle and leave on both sides, deep rims (bevel 0.16 w) bend the room/title as they
  pass; no sweep from the side, thin (14..40 px) so no side-face column; no dispersion through it (one ray) and no glow.
  plates.wgsl.js: disp only when the plate's own dispersion > 0 (identical image for others: spread 0 = 3 equal rays).
- F4 GPU: stage.js swarm half past p 0.2, quarter past 0.35 (leaving only); the portal not traced below p 0.04 coming out.
  gpu.mjs x2 @1440 DPR2: flight median 1.76/1.79, p90 2.58/2.59, max 2.91/2.92 (was 4.05); rest 1.75.
  1920 DPR1: p90 2.06, max 2.66, rest 1.37. phone: max 1.50, rest 0.41.
- F3 cont.: the "grey column" was NOT the beam: (a) desktop: the room's hand blade (room.js) revealed once the plates
  left and the eye pushed in -> room.js hand and subject lights fade with ctx.flight (fx-stage passes flight = portal p);
  (b) the door's own side face at yaw 0.2 (side -1) -> dYaw0 0.06 / dYaw1 0.02. Also rimSheen 0 (plates.js) cuts the
  studio from the door's rims and the transmitted env of rimSheen plates has no soft boxes (plates.wgsl.js channelOut).
  Strips .shots/o-fix/strip/{d,m}-g2case/sheet.jpg: no column, no sweep; two arrises part/close; middle still dark.
- F5 prism: index.js ONE ray leaves (the cued row's, else the last; K 0 for the rest): no fan; prism edge 0.9 -> 0.4,
  glow 0.6 -> 0.45. Still reads partly as an outline; phone flare not re-checked at 1:1.
- F6: Obla's station 0.75 -> 0.645 vh (no longer across the dawn edge; its emblem is Obla's face, kept); gen's sampling
  marks are straight ticks of 3 segments (were tiny rings). STAYS: the blurred cobalt dawn threads under the index
  (camera blend with the index's deep focus; dawn.js already asks focus D), Consulting's agents nodes as glowing dots.
- F7 chips: night/shot.js LIT 11000/7000 -> 4200/2800, room.js default 9000/6000 -> 4000/2600 (stats: 14850 -> 5670).
- F8 Back/Forward drift: not reproduced in back.mjs (1000 -> 0 -> 1000 exact); the walk still shows y 4/22/29 on a
  case/about after back: STAYS.
- Checks: gates OK both builds (check exit 0, claims OK, build/asserts/claims, PARITY OK); walk EN + walk IT 25 navs
  each: canvas 1, listeners 77->76, observers 10, triggers 0, lenis 1, heap 6.6->7.8 MB, console clean; rows EN/IT OK;
  states (reduced, stage=0, gl=0, no WebGPU) complete; asleep 0 submits on 5 pages; assembled 4 cuts + back/fwd clean.
  GPU flight 1440 DPR2 p90 2.58/2.59 max 2.90/3.01, rest 1.75; 1920 p90 2.07/2.05 max 2.63/2.62, rest 1.35; phone max
  1.44, rest 0.41. Servers 5330/5339 stopped.
- Needs elsewhere: case.js and mist.js (not this lane) still ask chips 7000 on desktop (cases' rooms denser than the
  others now); cover/world.js 11000 (the cover's hall, not thinned).
