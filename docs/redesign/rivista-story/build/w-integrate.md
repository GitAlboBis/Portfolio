# w-integrate — chain 9's integration lane (port 5244)

- Status: DONE (2026-11-11). Gates green, timings measured, final look laid out in six sheets (end of this file).
- Next: nothing; the director commits by topic (list at the end).
- Decisions: the arrival turns the other way (no soft-box frame); a short text block hides a case plate fully.
- How to run: `python scripts/serve-static.py 5244 public`; captures under `.shots/w-integrate/`.
- Owner: integration may touch any file under public/proto/rivista, only what integration needs.

## Log
- Gates at start: assemble ok, --check 0, claims OK. Timings measured (table at the end). Invariants (w-boot inv.mjs on 5244): all as BOOT reported, console clean.
- BOOT's request for CASE2 (glassEntry + c.glass.ready in case.js): already done by CASE2 (case.js `glassEntry: true`, arrival on ctx.glass). Nothing to do.
- FOUND + FIXED: the arriving plate (cover now.js and case case.js) turned through the yaw where the studio's soft box
  fills its face: one 100 ms frame of a flat grey card (cover: over "UVE"; case: the whole capture washed grey). Both
  arrivals now come in turned the other way (`P.yaw += 0.4 * k`, was `-= 0.55 * k`); the rest pose is unchanged.
  Looked: .shots/w-integrate/strip/try-b/arr.png (cover 700–1200 ms), strip/try-cut/arr.png (cut 1200–2000 ms): no grey frame.
- Run cut once here. On disk after the cut: strips cover/about/cut d+m, boot-desk.png, boot-phone.png; the timing table
  was not written -> measure again. Next: timings, look at boot sheets, case walks, phone, pages, write the end.
- Timings re-measured (3 runs each, median; port 5244, everything together):
  cover d 642/589/384, m 635/585/380; case cold d 613/577/373, m 623/584/377; work cold d 616/584/394, m 612/580/362;
  case by a cut d 414/359/312, m 413/343/300 (first frame / glass / plate compile ms). Long tasks: none in 24 runs.
- Case walks taken (case-d, case-m: maintech, sersan-io, it/supply chain; gallery → arrival → step 1 → turn → step 2 →
  chapter → More work → next case). Console clean.
- FOUND + FIXED (case.js): on the phone, at rest between step 1 and 2 (scrollY 490 on case-sersan-io), the plate drew at
  46 % over the lead's last line and the two buttons. Cause: c.texts measures the LINES of text (the buttons' row is 20 px
  tall) and the hide ramp needed 36 px of overlap. Now each block is padded 12 px and the ramp is min(36, its size).
  The glow (field) also fades and gives back its points when the plate is hidden or squeezed (it had crowded into its
  0.2-size rect: a bright blot under the buttons). Looked: probe/fast-sheet.png (before) → fast-sheet3.png (after).
- Back/Forward after a cut (work → case-spherenode → back → forward): stage-on and the canvas on every page, plates drawn,
  console clean (probe/bf-sheet.png). Restore mid-scene by reload (work gallery step 5, About stack step 3, sersan-io
  step 2, Now; d and m): every scene draws within 0.8 s, no pop; the w5 plate BOOT saw in two places stays in one place
  in all five frames (restore-d.png, restore-m.png): not reproduced, nothing changed in gallery.js.
- CASE2's note (a clear capture plate's grey soft-box sheen while its texture loads): gone with the reversed arrival
  yaw (strip try-cut, case-desk arrival frames).
- Gates after the last change: assemble ok, --check exit 0, check-claims-proto OK (32 pages).

## The state of the site (end of chain 9)
The three lanes' work runs together. The stage now starts in about 0.6 s on every cold load and about 0.41 s on a case
reached by a cut (it was 2.2 s and 1.9 s): the first second of the cover already shows the room, the beam and the
plate coming down into place; a case's plate is in place about 1.2 s after the click, while the sheet still leaves.
Etched plates read (the frost is the brightest thing on them; no grey card in the turn). On the phone the Evidence head
has its chart, Obla's character keeps to free room in all five states, the gallery's etched steps read. Integration
fixed two things: the arriving plate (cover and case) no longer turns through the soft box's grey frame, and a case's
plate no longer draws over the buttons on the phone between step 1 and 2. Console clean on every page walked.

## Start-up (boot-timing.mjs; median of 3; ms; headless Chrome, real GPU, fresh profile)
| page | before chain 9 (director): first frame | after: first frame | plates drawable | plate compile | long tasks |
|---|---|---|---|---|---|
| cover 1440 | 2220 | 642 | 589 | 384 | none |
| cover 390 | ~1900 (BOOT's before) | 635 | 585 | 380 | none |
| case cold 1440 | ~2000 (BOOT) | 613 | 577 | 373 | none |
| case cold 390 | — | 623 | 584 | 377 | none |
| work cold 1440 | ~2080 (BOOT) | 616 | 584 | 394 | none |
| work cold 390 | — | 612 | 580 | 362 | none |
| case by a cut 1440 | 1912 | 414 | 359 | 312 | none |
| case by a cut 390 | ~1730 (BOOT) | 413 | 343 | 300 | none |
Plates were drawable together with the first frame before; plate compile was 1.1–1.2 s. Invariants (inv.mjs, once
each): ?stage=0, ?gl=0, reduced motion, the 404: adapter asked 0 times, no stage module fetched, printed page complete;
Back/Forward after a cut alive.

## Still wrong, in order
1. Soft round discs: Consulting's agents (step 4 and the close), the Consulting emblem on the cover, Obla's grainy halo
   at rest (pages.png, desktop and phone). Obla's character itself is a glossy rounded body: by design, but the
   closest thing on the site to what the water rule forbids.
2. The cover's 26 motes are soft round discs, as requested; to remove them, take `motes` out of hero.js's swarm list.
3. About's first screen: from about 1.4 s the arriving points sparkle as specks over the top plate, then settle into
   streams under the stack that read as dashed lines (about-t.png, crop-about.png). Not from this chain (stack.js
   untouched; plate shader pixel-identical), but now visible earlier because the stage starts earlier.
4. The case glow behind an etched plate is cloudy at 2x (crop-mt-s1.png: a mottled cobalt fog, not a smooth glow).
5. Supply Chain: the class diagram's box labels are still too small to read at 1440 in step 2 (crop helps ~25 %).
6. A case's opening still shows text alone for ~0.5 s after the sheet (the plate arrives ~1.2 s after the click).
7. On the phone between a case's step 1 and 2, and on a tall screen in the stack and Obla, the figure steps back while
   text passes: a short empty beat (deliberate; Alberto should see it live).
8. Cost: the case scene 2.5 ms GPU at 1440 tier A (the glow kept at full weight); plate edges three rays per edge pixel.
9. The phone gallery's queued plates at the right edge show a bright sliver of the next capture (phone.png gal-03/07).
Fixed by chain 9 and removed: the empty first ~2 s (start-up), the Evidence head's empty half on the phone, the dim
etched plates and their grey card in the turn, the phone gallery's capture through etched words.

## Open first, in order
1. .shots/w-integrate/boot-desk.png — cover cold load (100 ms frames, 3 s), then a case reached by a cut, then About.
2. .shots/w-integrate/boot-phone.png — the same at 390.
3. .shots/w-integrate/case-desk.png — Maintech (etched), sersan.io, Supply Chain (it): gallery → arrival (300 ms) →
   step 1 → turn → step 2 → chapter → More work → next case.
4. .shots/w-integrate/case-phone.png — the same at 390 (row 3: the fixed turn, no plate over the buttons).
5. .shots/w-integrate/phone.png — Evidence head and dock, the gallery's three etched steps, Obla (it) first screen and states.
6. .shots/w-integrate/pages.png — every page at rest, 1440 then 390. Then restore-d.png / restore-m.png, about-t.png.

## Files changed in chain 9, by topic (commit one topic at a time)
- The start-up (BOOT): parts/head.html, stage/boot.js (new), fx-stage.js, stage/stage.js, stage/plates/plates.js,
  stage/plates/mips.js, stage/plates/plates.wgsl.js (also CASE2's etched-face hunk: stage with `git add -p`),
  stage/scenes/README.md, stage/dev.html, stage/scenes/now.js (BOOT's arrival + integration's yaw line), the 32
  generated pages (head); notes build/w-boot.md.
- The phone (PHONE): stage/scenes/evidence.js, stage/scenes/obla.js, stage/scenes/gallery.js; notes build/w-phone.md.
- The case scene (CASE2): stage/scenes/case.js, stage/scenes/case/glow.js (new), css/case.css, parts/c-main.case.mjs,
  parts/cases.json, fx.css and the 18 case pages (regenerated), plates.wgsl.js (etched hunk); notes build/w-case.md.
- Integration (this lane): now.js and case.js (the arrival yaw `+= 0.4 * k`), case.js (the hide padded to the block and
  its ramp min(36, size); the glow's ink and weight follow the hide and the squeeze); notes build/w-integrate.md.
- Scripts used (git-ignored, .shots/w-integrate/_scripts/): boot-timing.mjs, strip.mjs, walk.mjs, grid.mjs,
  restore.mjs, backfwd.mjs, probe-io.mjs, probe-fast.mjs.
