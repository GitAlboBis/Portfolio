# u-fix — HEROFIX lane (port 5261), round 11b

- Owns: stage/scenes/hero.js, now.js, cover/** (world.js, shared.js), parts/b-hero.html, css/page-cover.css.
- Run: `python scripts/serve-static.py 5261 public`; one-off scripts in .shots/u-fix/_scripts/ (shoot.mjs, stills.mjs,
  park.mjs copied from u-critic with port 5261; probe.mjs: stills at times + `stage.stats().field`; crop.mjs: 1:1
  crops). Backups of v2 files: .shots/u-fix/*.before.js. Server stopped.
- Connector search: none new (the field engine is FIELD's; the scene only returns data). No new component.

## Done (per critic finding)
1. Speckle at 1920 DPR1: FIXED. Face disc = FACE_K 0.8 x the even spacing of its fill points (world.js `faceSize`),
   face share 0.5 -> 0.64, ink no longer doubled by tier. rest/c-w1.png solid at 1920 DPR1.
2. Opening pile-up: FIXED (mostly). IGN_DT 0.07 -> 0.1, spawn -0.32 D -> -0.13 D, opening yaw -0.9 -> -0.6 (phone
   -0.42 on the name's axis). open-d/, open-m/ sheets: letters land one by one; a brief smear on the igniting letter.
3. Hall late / stickers / two SerSan: FIXED in part. w4 (sersan-brand) removed (markup too); plates in at 1.0 s +
   0.22 s each; desktop three plates larger, turned, one below the name on the right; Now plate lifted (ly -0.5 vh).
4. Shafts as static: FIXED in part. Real field lights on the same axes (haze 0.055, soft core), dust share 0.1, only
   from just above the name to mid-way down, gathered to the core. Dust columns still read as speckle below the name.
5. Flight vanish: FIXED in part. flightK: damped follower (0.26 s) on the scroll; hero 150 -> 190 svh so the eye is
   through the name before Now's text; aperture stays shut until k 0.86; longer near fade; Now keep-outs only from k
   0.45. Letters still leave over ~2 frames at the end of the pass, onto the lit wall and the chips (no empty dark).
6. Plate over letter (engine, no depth test): avoided in the scene: hall plates and Now's plate dip to ~6 % while the
   letters sweep past (k 0.11-0.48). fly-d2/ sheet: no cut letter.
7. Grey sheen: in part. Dust off the plates, sweep at the name's height, turns -0.2/+0.22. Still seen at some pointer
   angles (sweep/ sheet) and with the field forced off (probe/ff-5000.png) = the plates' soft-box reflection (engine).
8. Phone swollen letters / plate on TUVERI: plates moved to the top band, smaller; ink not doubled; edges still soft.
9. Deep smear: T 0.6 -> 0.45 em, deep ink lower. Not re-measured with a crop.
10. Pointer: orbit 0.16 -> 0.2 yaw; the hand aims a shaft onto the wall (spring, weight).

## The field in the hall (world.js hallField, hero.js, now.js)
- chips 9000 (phone 7000) A's from the name back (depth 0.7) and SerSan marks deep (0.19) around Now's plate; cap 7.
- wall at z -0.6 D, cell 0.058 D, extent ~3.2x viewport; fog widened to [2.0, 5.6] D so it stays in the hall.
- lights: two fixed shafts, the hand's shaft (desktop; damped spring to the pointer), one sweep every 10 s
  (SWEEP_S 4.2), the first at 2.2 s of the opening. All length 16000 (6000 did not reach the wall).
- now.js returns the same chips/wall (no lights) from k 0.88: the plate lands among the marks (fly-d/f01440.jpg).
- Cost: rest 1440 DPR2 A 1.43 ms, 1920 DPR1 up to 2.3 ms in a sweep, phone B 0.37-0.87 ms; no halving.

## Needs elsewhere
- stage/plates (engine): plates are composited over the swarm with no depth test (finding 6); a per-slab control of
  the soft-box reflection (finding 7).
