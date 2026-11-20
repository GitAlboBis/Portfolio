# s-cover3 — COVER3 lane (port 5281), round 12 "the lit hall" (decisions A-H)

- Owns: stage/scenes/hero.js, now.js, cover/**, parts/b-hero.html, css/page-cover.css; field/** (new opts, default = HEAD), plates/** (per-plate sheen only), guarded hunks in fx-stage.js / stage.js.
- State: DONE. Servers 5281 and 5283 stopped; no process left.
- Run: python scripts/serve-static.py 5281 public; scripts in .shots/s-cover3/_scripts/ (probe.mjs stills+stats, crop.mjs); HEAD copy on 5283.

## Plan
- A wall: hallField gets a NAME light (wide blade, aspect ~3, from just in front of the name along the eye ray onto the
  wall, chips 0.3, haze 0, ~1/3 of a blade's peak, on with the name's ignition) and two TRAVELLING BLADES (lights from
  high above in front, target sliding across the wall on c.clock.time, period 22 s, half a cycle apart, envelope at the
  wrap so the jump is unseen; tint 0.55 cool / 0 warm, haze ~0.04). The old fixed shafts and the 10 s sweep go (4 lights:
  name, cool, warm, hand). Fog pushed out ([2.8, 7] D) so the wall is not fogged away; keep-outs already darken text.
- B chips: field option `rim` (0..1, the cut edge's colour toward paper; default 0 = HEAD) in FU.shapes.w; option
  `clear: { rect, z }` (no chip nearer than view depth z inside a screen rect: the name's face) in a new slot (FIELD_SIZE
  38 -> 40, default zeros = HEAD). Size classes by shapes: near big A's (scale), mid A's, deep marks, far dust; box front
  pushed to near the lens; counts tuned by looking (150-300 visible).
- C shafts: the dust formation weight 0 (no speckle columns); the blades' haze is the shaft (soft 1 = brighter core).
- D name: rest yaw -0.27, pitch -0.11 (from below), lens 0.62 with Rd scaled by the lens (frame size unchanged);
  LAYERS 7, crisp small discs, each dimmer; T 0.6 em.
- E plates: two desktop plates w 0.27, sx 0.04 / 0.96, turned 0.5 rad toward the centre, different depths, alpha 0.6
  peak, glow (lit edge). Phone: one in the top band. Sheen control only if still grey.
- F camera: rest arc +-0.044 rad yaw (phone 0.087) + push-in on c.clock.time; orbit 0.30 / 0.14 (phone 0).
- G opening: OPEN_S 2.6, start low (pitch -0.25) near the A; plates from frame 1 dim -> full by 1.8 s; foot --fd
  2600/2800; field option `fade` (s, default 0.7) -> 0.2 on the cover; field module fetched in parallel in prepareStage
  (compile still after sim+draw); canvas fade 250 ms on the cover (fx-stage.js).
- H flight: path keys keep; check lens blend to 1 at the end; chips through the flight.

## Done (keep current)
- Engine (field): chips `rim` + `clear {rect, point}` (FU.extra 38, FU.clear 39; FIELD_SIZE 40x16), field `fade` (s),
  field `hazeEnd` (px, head2.w): all default to HEAD's image. stage.js: field module fetched in parallel. fx-stage.js:
  canvas fade 250 ms on the cover.
- world.js: lens 0.62 rest pose from below (yaw -0.28, pitch -0.115), Wn 0.68, LAYERS 6, T 0.9 em, deep share 0.34
  (shafts' dust off), plates two flanking the name (cut by the frame), hallField rewritten (name light, two blades on
  BLADE_S 30 s, hand blade; chips 11000 in four classes, rim 1, edge 0.4, clear rect of the name), rest arc + push-in,
  orbit 0.30/0.14, fog [3, 7] D, OPEN_S 2.6 from low near the A. hero.js: plates dim from frame 1 -> 0.62 peak by 1.8 s.
- Looked: probe/a5-4500.png (rest, wall + chips + blade seen), c5-far.png (receding outlines as lines of points).
- Later: blades off 0.4 (one in the opening view), field fade 0.12, blades full from frame 1, keep-outs from 2.2 s,
  phone plate sx 0.74 sy 0.115 w 0.46, left plate turn -0.32 (no grey sheen at three pointer spots, probe/sheen.png).
  Per-plate sheen control NOT built (avoided by the turn). now.js unchanged (hallField stays compatible).

## Gates and numbers
- assemble exit 0, --check exit 0, check-claims OK (32 pages).
- Bench vs HEAD copy (5283): field, gallery, stack frozen max diff 0-2; work 5, case 13 (0.001 % px > 8) = run noise.
- GPU at rest (final.mjs, 6 samples incl. blades crossing): 1440 DPR2 A 1.23-1.24 ms (HEAD 1.32-1.39); 1920 DPR1
  0.93-0.95 (HEAD 0.97-1.03); phone B 0.32-0.36 (HEAD 0.35-0.36). No halving.
- First frame desktop: HEAD 703/700/713, mine 731/698/658 ms; phone HEAD 670/634, mine 660/678. One 70-80 ms long
  task before the first frame (the hero world, as at HEAD), none after.
- States (st/, final/states.png): it, failfield (name + plates, no field), stage=0, gl=0, reduce, nodevice and
  noadapter (stage-dead, flat name) all as expected; console clean.

## Still wrong (ranked, cold)
1. The first ~0.7 s is still empty night (stage start-up); the room then comes up dim over ~1 s and the blades' haze
   reads from ~2 s, not from the first frame (G partly met).
2. The left plate sits half behind "AL" and the orbit slides the plates under the letters: busier than "objects
   beside the name"; the plates still read partly as screens.
3. Letter faces glow past their outline (soft, a little burnt); the receding outlines read as stippled lines, not
   crisp lines.
4. Flight: the name leaves within ~250 ms at the gap; coming back the swarm streaks across Now as blue noise for a
   second; the opening's igniting letter smears for a frame.
5. Grey soft-box sheen avoided only by the left plate's turn (checked at 3 pointer spots + the sweep film); no per-plate
   control exists.
6. Phone: the plate stands close to the top of "TO"; the first letter starts cut at the top-left in the opening.
