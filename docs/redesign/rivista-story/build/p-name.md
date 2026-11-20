# p-name — the cover's name built of Gaussian splats, behind ?name=splat (port 5323)

- Done: cover/splatname.js (new: build per glyph, a set per letter, settle per letter, hand-over of the swarm's
  face/outlines via C.nameSplat); hero.js/now.js/world.js lines behind the switch; splat.js/splat.wgsl.js: 16 sets,
  splatShown(id), shadeColor + emit per set; gen.js extrude options rings/ringSigma/sideGrid/sides/sideFade (defaults =
  the bench's old output). Desktop rest, opening, hand, flight looked at (.shots/p-name/s3, s4, fs2, fs3).
- DONE 2026-11-12. Looked: rest at 1440/1920/phone vs HEAD (s3, w1920-crop-cmp, phone-crop-cmp), opening strips
  (o3 vs oh), flight (fs3 vs fh), hand sweep (fs2), failsplat (fsp: today's name, plates unmoved), ?stage=0 /
  reduced / ?gl=0 with the switch = without it (0.000 % differ). GPU with the switch (twice, other lanes rendering):
  rest 1.00-1.04 desktop (HEAD 1.44), 0.79-0.84 at 1920, 0.30 phone; hero peaks 0.97-1.06 / 0.76-0.88 / 0.29; now/index
  peaks noisy (1.1-8.7, also HEAD 4-15). 0 frames in 3 s after 19 s quiet. First frame median 481 ms (HEAD 480);
  blocks ready 0.22-0.32 s into the opening; no long task after the first frame. Gates: --check 0, claims OK.
- Still wrong: no per-plate depth for the pass (plates moved/faded under the switch instead); the face's glow is
  softer than the swarm's; the opening still has the swarm's streaks plus a local scatter round each settling letter;
  the right sides of the letters under the hand catch a white bloom fringe; reached by a cut the blocks settle at
  arrival rather than being already there (S.ready per letter starts on the frame they are on the GPU).
- Decisions: depth 0.42 of the letter height; light from upper right/front so the sides the rest pose sees are cobalt,
  darker to the back (sideFade 0.85); three edge rings (0.9/2.1/3.3 px in: one ring left a dashed grey line inside the
  edge); emit 0.5 (an opaque face does not glow: the bloom treats alpha as glass); masks at 0.8 (phone 0.62) of the
  layout raster: ~99k splats desktop, ~84k phone (tier B pool 150k); built from font load (prebuild) in idle slices:
  first frame = HEAD's, name ready 0.22-0.32 s into the opening. Plates: the splat pass is always behind plates, so under
  the switch the left plate stands wider/lower and leaves at the flight's start (k 0.02-0.1); right plate 0.05 wider.
- Needs elsewhere: stage.js — the extra "over" pass split by each plate's depth (as the swarm's ZWin), so a set in
  front of a plate draws over it; then the plate moves in hero.js can go.
- How to run and look: python scripts/serve-static.py 5323 public; index.html?name=splat (&debug=1, &nsdbg=late|nosides|emit=0.7);
  scripts .shots/p-name/_scripts/ (look.mjs tag query d|m|d1 port, fly.mjs tag port query d|m, ff.mjs port query d|m runs).
