# r-integrate (wave 2, port 5305; HEAD copy on 5310 from .shots/r-integrate/_before) — DONE 2026-11-12, servers stopped

- FIX (where the pieces meet): fx-nav.js arrive() waits for FX.stage.frame (race 250 ms) as well as FX.mo.prepared before
  the card clears (the ARRIVE/FIX Needs elsewhere). Strips show the room lit under the leaving sheet, title rising on it.
- Gates: --check 0, claims OK, node --check on every changed JS; console clean on 32 pages (EN+IT).
- First frame ms mine/HEAD (median of 3), desktop: index 334/562, work 304/554, about 275/566, consulting 325/594, obla
  321/576, contact 277/539, case 287/553, it/about 291/569, cut work>case 204/447, cut about>consulting 187/441.
  Phone: 316/557, 283/550, 286/542, 321/542, 298/562, 245/519, 284/564, 272/537, cuts 201/448, 195/441. No long task >50 ms.
- GPU peak/median 1440x2: hero 1.47, now 1.95, index 3.08, gallery 2.47, evidence 1.51, stack 2.58, path 2.25, consult
  2.50-2.75 (one 3.64 spike not reproduced in 2 reruns), obla 2.22, case 2.21, chapters 1.90-2.65 (one 3.44 spike),
  dawn <= 2.42. 1920x1: <= 2.12. Phone B: <= 0.98. Sleep: 0 frames in 3 s on all 8 pages, three sizes.
- Invariants: stage=0/gl=0/reduced: 0 adapter, 0 device, complete pages; failfield ok; failsplat: pass off, console
  clean; faildevice -> gl-off printed; Back/Forward ok; floor ok (no small text at any size); 33 desktop pairs ok,
  phone pairs ok (work->case fails only in the script: wheel on a touch context; a tap works, phonecase.mjs).
- Final set: .shots/r-final/ (pages, pages-phone, gallery, cuts, opens, text, states .png; site 45 s, site-phone 25 s,
  cuts 9.1 s, splat 10 s mp4, H.264 yuv420p 30 fps; six frames each looked at in .shots/r-integrate/fx/).
- Scripts: .shots/r-integrate/_scripts/ (first, gpu, inv, pairs, floor, steps, film, tour, splatfilm, failsplat,
  textcrops, states2, misc, sheet, stack, phonecase).
