# w-boot — the stage starts early (lane BOOT, chain 9, port 5241)

- Status: DONE (2026-11-11). Gates green, invariants checked, strips looked at.
- Owns: parts/head.html, fx-stage.js, stage/stage.js, gpu.js, tier.js, plates/**, scenes/README.md, hero.js, now.js,
  cover/**, dev.html, and the new stage/boot.js.
- Run: python scripts/serve-static.py 5241 public ; scripts under .shots/w-boot/_scripts/ (git-ignored):
  boot-timing.mjs (director's, + SUMMARY line, --q), strip.mjs (CDP screencast, a frame every 100 ms, contact sheet;
  `cover|cut [--m] [--base=]`), bench.mjs (dev.html frozen + pipeline compile times), inv.mjs (invariants), late.mjs
  (plate pipeline held back 1.2 s, page restored mid-gallery). HEAD copy for "before": .shots/w-boot/head (port 5242).

## What changed
1. head.html: on EVERY page with a stage (not reduced motion, ?stage=0, ?gl=0, no navigator.gpu, the 404, or a ?fx=
   list without "stage"; with or without a cut's sheet) the head asks for the adapter and imports stage/boot.js
   (via `new Function('u','return import(u)')`, base from the fx-stage.js entry of the loader list, so it/ works).
2. stage/boot.js (new): takes the adapter, drops a software one, requests the device, calls prepareStage (every
   pipeline started at once: sim, draw, plate, blit, mips), prefetches the page's scene modules + raster.js after
   DOMContentLoaded. Answer in window.__rvStage.p; an uncaptured error before the host takes the device is silenced and
   remembered (host then turns off).
3. stage.js: prepareStage(o) exported (layouts + all async pipelines, rejections pre-caught); createStage({kit,
   onError}) waits only for sim+draw; the plates are made when their kit resolves (stage.glass {ready, at, failed},
   stage.whenGlass); slabs are not drawn until then; slabTexture waits; backdrop and plateLook held.
4. plates.js: platesKit (pipelines) / makePlates (sync) / createPlates (old API). mips.js: mipKit async (was a sync
   createRenderPipeline).
5. plates.wgsl.js (goal 3): ONE call site of shadeAt in fsPlate (the 3 rays in a loop that breaks when not near an
   edge) and ONE call site of channelOut in shadeAt (dispersion and plain in one loop). The backend inlines every call;
   two sites each had doubled the code. Bench (dev.html cover, gallery, stack, &t=2500&hud=0): gallery and stack
   pixel-identical, cover identical but for the instrument digits and 2 px off by 1/255. Compile 1110 -> 340-450 ms
   (one honest attempt was enough).
6. fx-stage.js: requestDevice takes the boot's answer first (fallback: the old path, also used by a rebuild after a lost
   device); ctx.glass = { ready, age, late }; slabs dropped until ready; scenes without `glassEntry: true` get a 0.45 s
   focus pull (alpha 0->1, sharp 0.3->1) when the glass joins after the first frame.
7. now.js: glassEntry: true; the cover's plate ENTERS on the first frame the glass can draw: from deep in the upper room
   (down the beam, over the dark, never over the capitals: a far plate over them read as a small ghost "ERI"), small
   and soft, into place and focus in 0.85 s; a page restored lower down gets a 0.45 s focus pull.
8. dev.html awaits stage.whenGlass before freezing. README: "The glass signal". Canvas fade kept at 700 ms (the swarm
   now comes up with the type's own focus entrance; it reads as one arrival).

## Timings (boot-timing.mjs, headless Chrome, real GPU, fresh profile, 1440x900 / --m 390x844 DPR 2, ms)
| page | before: first frame | glass | plate compile | after: first frame | glass | plate compile | long tasks |
|---|---|---|---|---|---|---|---|
| cover | 1813 | 1780 | 1098 | 682 (670) | 628 | 430 | none / none |
| case cold | 1996 | 1969 | 1087 | 687 | 647 | 427 | none / none |
| work cold | 2077 | 2036 | 1164 | 672 | 629 | 350 | none / none |
| case by a cut | 1808 | 1781 | 1185 | 496 | 433 | 360 | none / none |
| cover --m | 1905 | 1875 | 1126 | 671 | 643 | 455 | none / none |
| case by a cut --m | 1731 | 1705 | 1127 | 442 | 388 | 342 | none / none |
The swarm's sim pipeline (wgsl/sim, not this lane's) is now the floor: +360..500 ms after the device (~180 ms).
GPU median, cover tier A: before 1.02 / 1.01, after 1.04 / 1.03 / 0.98 ms (unchanged). Budgets, WINDOW_S, STOP_S untouched.

## Invariants (inv.mjs, all console clean)
plain cover / it case: stage on. Reduced motion, ?stage=0, ?gl=0, 404, ?fx=core,nav, no WebGPU: adapter asked 0 times,
0 stage files fetched. Software adapter, refused device, plate pipeline failing, sim pipeline failing: stage off,
printed page, no console line. bfcache back: stage-on kept. Instrument line only with stage-on. Lost device: rebuild
path unchanged (fallback requestDevice, createStage makes its own kit) — not forced in a test.

## Looked at
- .shots/w-boot/strip/{before,after}-cover-d/sheet.jpg: before, text alone until ~1.9 s and the plate appears with the
  canvas; after, the room comes up at ~0.6 s and the plate arrives down the beam (arr-crop.jpg: 0.6..1.4 s).
- .shots/w-boot/strip/{before,after}-cover-m/sheet.jpg (+ after arr-crop.jpg): same on the phone; plate comes from above
  the name.
- .shots/w-boot/strip/{before,after}-cut-d/sheet.jpg: the sheet moves evenly in both; the case plate lands ~1.4 s after
  the click (before ~2.8 s).
- .shots/w-boot/bench/{old,n1}-{cover,gallery,stack}.png: shader before/after.
- .shots/w-boot/late/sheet.jpg: glass held back 1.2 s, restored mid-gallery: first frame after the join soft and
  translucent (the pull), then sharp.

## For CASE2 (stage/scenes/case.js — not edited here)
Read `c.glass` ({ ready, age, late }; README "The glass signal"). Add `glassEntry: true` to the default export, and
start the arrival only when `c.glass.ready`: in the arrival block, `const ready = c.glass.ready && (!!tex || S.etched ||
S.wait > 1.6);` (today the 1.6 s fallback could start it before plates can draw on a slow machine; a texture id already
implies ready). With the early boot the glass is usually ready ~0.4 s after a cut, before the sheet leaves, so the
arrival can start right after the sheet (S.wait > 0.12): the remaining gap is the texture decode.

## Open
- A restored mid-gallery capture (late.mjs) showed the w5 plate at two different places in consecutive shots
  (j0/j2 left-centre, j1/j3 right): gallery.js's own pose while the restore settles, or the PHONE lane's live edit of
  gallery.js; not this lane's file — worth a look.
- The sim pipeline compile (wgsl/sim.wgsl.js) is the floor of the first frame now.
