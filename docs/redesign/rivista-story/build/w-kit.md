# w-kit — the room kit (wave 1, lane KIT, port 5290)

## Done
- `stage/scenes/lib/room.js` (new): `room(c, o) -> { field, keepouts, look }`, the cover's lit hall for any scene
  (wall grid, A + SerSan-mark chips with rim, two travelling blades on c.clock.time with haze, the hand's blade, an
  optional subject light, text kept clear). Options: center, eye, wall {z,size,alpha}, chips, depth, scale, temp, dim,
  seed, blades, period, haze, hand, subject, keep, pad, header, clear, fade, alpha, off. Lighter on B/C. Cover untouched.
- `fx-stage.js`: measure() now records FINAL layout boxes (axis-aligned transforms from the block down are undone,
  pure reads; #now-h measured 43,1897 320x267 = its risen glyph box; HEAD had it 116 px low). `ctx.textRects(o)`,
  `ctx.speed` (0..1, up 0.12 s / down 0.7 s, 0 at rest), `ctx.aim` (pointer or touch drag). Touch: horizontal drag ->
  `stage.set({ aim })`, released to 0; body `touch-action: pan-y pinch-zoom` while the stage draws. Header rects
  measured (M.hdr). Debug: `__stageHost.M`, `last.speed`, `last.aim`.
- `stage/stage.js`: `aim` input (overrides the pointer for the free camera's orbit and the orbiting follow).
- `lib/camera.js`: `speedLens(lens, speed, max=0.06)`.
- `stage/dev.html?view=room` (sweep, temp, dim, n2, seed, speed, keep=0, field=0, t=).
- README "The room".

## Proof (all looked at)
- Bench field/gallery/stack frozen: max diff 0 vs HEAD copy. Cover at rest: diff at clock noise (HEAD vs HEAD 0.9 %
  px>8, mine 0.4-2 %, same chip/wall shimmer pattern). Work + case: identical to HEAD's fx-stage/stage on the current
  tree (max 26 / 17); against the pure HEAD copy they differ because of other lanes' edits (see Open).
- Room GPU (frozen, still, no swarm in the view): 0.42 ms 1440 DPR2 A, 0.32 ms 1920 DPR1, 0.07 ms phone B.
- Touch probe: drag 180 px -> orbit 0.038 rad (cover phone yaw), released -> 0.004 after 2.5 s; vertical drag scrolled 345 px.
- Speed probe (work): 0 at rest, 0.69 under fast wheel, smooth fall, 0 when quiet.
- Measure +2-3 ms (max 6.6 ms); first frame on the cover 1043-1078 ms vs HEAD 1086-1193 ms.
- Gates: assemble --check exit 0, check-claims OK.

## FOR THE SCENE LANES
```js
import { room, eyeD } from "./lib/room.js";
import { cameraPath, speedLens } from "./lib/camera.js";
const R = room(c, { temp: 0.2 + 0.6 * pageProgress, seed: PAGE_SEED, subject: { x, y, z, w, h } /* centre */ });
if (c.look) c.look({ ...R.look, /* your far/near */ });
return { camera: { ...pose, lens: speedLens(pose.lens, c.speed), damp: 0, orbit: { yaw: 0.12, pitch: 0.06, damp: 1.1 }, fog: [3 * D, 7 * D] },
         bloom: { strength: 0.45, threshold: 0.5, knee: 0.3, plates: 0.1 }, field: R.field, keepouts: [...R.keepouts, ...yours], rest: 14 };
```
- temp 0 cool (cobalt) .. 1 warm (paper); dim 0..1; chips default 9000/6000 (B 80 %, C 60 %, then the field's tier
  halving); depth 0..1; wall.z default -0.6 D. keep defaults to c.textRects({ pad: 14 }) (text final boxes, display
  titles, controls, header).
- The scene still does: the camera path (one continuous shot), bloom (<= 0.8 with the lit wall), its own keep-outs
  beyond text, ONE c.look call including R.look (keepFeather 40, outward only). Same seed for every scene of a page
  (lights of crossfading scenes pool, four strongest kept). Room is fixed to the viewport, like the cover's hall.
- Cost: ~0.42 ms at 1440 DPR2 tier A, ~0.07 ms phone B, on top of swarm and plates.

## Open
- Other lanes' current edits change Work and the case at rest against HEAD (the text column wraps differently, a
  hairline under the title, and the gallery's plates were faint/missing in my 30 s still): not from this lane (same
  picture with HEAD's fx-stage.js + stage.js on the current tree). For the director / MOTION lane to look at.
- Not done: the cover still runs its own liveKeeps (left alone as asked); scenes may now drop it for c.textRects.

## Run / look
python scripts/serve-static.py 5290 public; .shots/w-kit/_scripts/{bench,room,rects,touch,speed,mtime}.mjs
