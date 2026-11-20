# v-integrate — chain 10, integration (port 5254)

- Status: DONE (2026-11-11). Gates green. Server 5254 stopped, no process of mine left.
- Owner: integration may touch any file under public/proto/rivista, only what integration needs.
- How to run: `python scripts/serve-static.py 5254 public`; one-off scripts in `.shots/v-integrate/_scripts/`
  (gpu.mjs, inv.mjs, backfwd.mjs, shoot.mjs `<tag> arrive|sweep|fly|rest [--m]`, stills.mjs `desk|mid|phone [--it] [--first]`,
  midfly.mjs (park mid-flight), steps.mjs (scene steps on screen + still), pstrip.mjs (PAGE's strips), cuts.mjs [--m],
  stack.mjs (vertical sheets)); captures under `.shots/v-integrate/`.

## Needs elsewhere from the lanes: what was done
- PAGE → case.js `const HDR = 64`: DONE. case.js reads `--hdr` from the root (rem → px) once per viewport (64 phone, 72 desktop).
- HERO → README `ctx.look`: DONE, one row in the ctx table of stage/scenes/README.md.
- HERO → CLAUDE.md / DESIGN.md / HANDOFF (the cover is no longer flat name + one plate + rays): NOT DONE here (outside
  public/proto/rivista; a docs lane's job).
- HERO → engine (LOOK.far/near from a free camera's fog/near automatically): DECLINED. The cover asks it with ctx.look, one
  line; an automatic rule would change every scene's clamp for no visible gain.
- ENGINE: none. PAGE's open note (stage over text on a programmatic jump): not reproduced with a reader's wheel; left.

## Found by the look and fixed (small, certain)
1. Cover, desktop, pointer to the left edge: the near-left plate slid across the "A" and drew a grey blurred double of it
   (h-sweep/f04800.jpg). world.js: that plate stands at sx −0.01 (was 0.045). After: h-sweep3/f04800.jpg, clear.
2. Cover: the foot's keep-outs cut a hard dark rectangle out of the beams behind the role line, the sentence and the
   buttons. hero.js: at rest it asks `keepFeather: 40` (6 from the first scroll on), keep-outs padded 4 px (was 14).
   After: h-sweep3/f04800.jpg, the beams fade into the text area.
3. Cover, phone, a reader who stops mid-flight (k 0.36–0.42): the screen was flooded by out-of-focus letters, giant white
   blobs (st/phone-en-index-deep.png, first run). world.js coverCamera: on a phone, while the eye crosses the name, near
   0.08→0.22 D and nearFull 0.26→0.62 D. After: mid-m3.png (k .32 letters sharp, .36 fading, .39 gone, no flood).
4. Obla and About on a phone, at rest between two steps: the text on screen stayed dimmed (opacity 0.12, words out)
   because the "step in focus" was the next step, whose box is nearer the middle but whose text is still below the fold.
   fx-scroll.js pick(): it measures each step's text block (`.sc-in`) instead of the step's box. After:
   probe/steps-obla-0.45-m.png, steps-about-0.22-m.png (text whole, op 1).
5. Work's gallery on a phone: the near plate's foot sat on "02 / 09" (the larger type lifts the step's first line).
   gallery.js layout: phone ay 0.40 of the height (was 0.42). After: probe/steps-work-0.32-m.png, clear.

## Numbers
Start-up (boot-timing.mjs, port 5254, median of 3, ms; first frame):
| page | before chain 10 (w-integrate) | after | plates pipeline | long tasks |
|---|---|---|---|---|
| cover 1440 | 642 | 657 (605/657/681) | 326–388 | 1 of 3 runs: 50–53 ms at ~610–630 (the formations' build) |
| cover 390 | 635 | 678 (630/678/743) | 329–437 | none |
| case cold 1440 | 613 | 671 (663/671/690) | ~340 | none |
| case cold 390 | 623 | 643 | 349–435 | none |
| case by a cut 1440 | 414 (engine's own baseline 455) | 517 (503/517/534; a 4th run 453) | 366–438 | none |
| case by a cut 390 | 413 | 517 (439/517/721) | 372–416 | none |
The cut's first frame waits for the sim compile (372 ms in the full timeline): not this chain's. The numbers sit within
the run-to-run spread the engine lane saw (455 vs 455 before/after its change); about +40–60 ms on cold loads and +60–100
on a case after a cut against chain 9's table, measured on a different day: worth a second look, not a regression found.

GPU median (gpuMs, pointer moving 3 s, gpu.mjs):
| page | 1440 DPR 2 tier A | 1440 DPR 1 tier A | 390 DPR 2 tier B |
|---|---|---|---|
| cover at rest | 3.12 | 2.22 | 1.08 |
| cover mid-flight | 2.08 (0.65 at k .5) | 0.66 | 0.77 (0.32 at k .5) |
| Work gallery | 1.92 | 1.76 | 0.74 |
| About stack | 3.69 (budget halved 3× → 20k points) | 2.93 (halved 1× → 80k) | 0.23 |
| case (sersan.io) | 1.73 | 1.88 | 0.18 |
Bloom on, console clean on every page.

Invariants (inv.mjs, backfwd.mjs): ?stage=0, ?gl=0, reduced motion: adapter 0, device 0, no stage-on, console clean;
reduced-motion About is plain flow with every word (inv/reduced.png). Forced bloom failure: stage on, bloom off, clean.
Lost device: rebuilt on a second device, drawing. Back/Forward after a cut (work → case-spherenode → back → forward):
stage-on and canvas on all three, no errors.

## The state of the site (end of chain 10)
The four lanes run together. The cover is a hall: the name stands in light with depth, tall plates at several distances,
crossing beams; the pointer orbits the eye with real parallax; the scroll flies through the name to the Now plate and
hands over to Now without a seam, desktop and phone, English and Italian. Bloom is on everywhere but the dawn and costs
~0.15 ms. Nothing a visitor reads is small: header 17/18 px, buttons 18/20 px bold, labels 15/16 px; the header, the
buttons and the rows hold their lines at 1440, 1024 and 390 in both languages. Titles rise, rows stagger, buttons wipe,
the header steps away and back, the phone menu is a sheet, the cut is a title card, and to Contact the sheet is the
dawn. Console clean on every page walked.

## Still wrong, in order
1. The cover's first 1.4 s is the flat page name (it rises as page type, then the light takes it over at 1.45 s): the
   brief's "points fly in along straight lines and build the letters" does not read; the opening is type → glow, then
   the camera pull-back (1.55–3.7 s) is the real move. The hero's arrival is the one thing to rethink (hero-desk.png row 1–3).
2. At rest the letters keep a fine speckle at their edges (points, not type); in the flight the near letters are coarse.
3. Cover: a near plate passing the lens shows as a lit grey bar for a moment (desktop deep still, pages-desk frame 1;
   phone at k ~.5, pages-phone frame 1). By design of the near fade, but it reads as a grey card.
4. The cut: for ~100 ms the title card's name and the arriving page's h1 show together, one sharp, one blurred
   (motion.png row 2, gal-case-0700): a double.
5. Soft round discs: Consulting's agents and the cover's index emblem, Obla's grainy halo (unchanged from chain 9).
6. About's stack on a phone steps back while the next step's text approaches and stays away at rest between steps:
   a screen with one short text block and nothing else (pages-phone frame 3). Deliberate in chain 9; now longer to the eye.
7. About's stack at 1440 DPR 2 is halved three times by the GPU budget (20k points): the swarm around it is thin there.
8. Consulting's first figure is a flat dark square with a frame (unchanged; type-desk row 4) — the weakest first screen.
9. From chain 9, still open: case glow cloudy at 2x, Supply Chain diagram labels small at 1440, a case's opening shows
   text alone ~0.5 s, the case scene's cost (2.5 ms at 1440 A), the phone gallery's sliver of the next capture.
Fixed by chain 10 and removed from the list: the cover's motes (gone with the old hero), the empty first seconds (now the
hall), small type in buttons, menu and labels.

## Open first, in order (the five best frames of the hero first)
1. .shots/v-integrate/h-rest/rest.png — the hall at rest, 1440 DPR 2.
2. .shots/v-integrate/h-sweep3/f04800.jpg — pointer at the left: beams, parallax, the plates, the foot soft.
3. .shots/v-integrate/h-fly/f01080.jpg (or the row 2 of h-fly/sheet0.jpg) — the flight through the name.
4. .shots/v-integrate/h-arr-m/f03600.jpg — the phone at the end of the arrival.
5. .shots/v-integrate/mid-d2/k1.5.png — arriving at Now after the flight.
6. .shots/v-integrate/hero-desk.png — arrival (100 ms, 4 s), the rest still, the pointer sweep.
7. .shots/v-integrate/hero-desk-fly.png — the flight into Now and back, then the Italian arrival.
8. .shots/v-integrate/hero-phone.png — the phone: arrival, flight, and the mid-flight parks after fix 3.
9. .shots/v-integrate/type-desk.png (1440, EN | IT), type-desk-1024.png, type-phone.png (EN row, IT row).
10. .shots/v-integrate/motion.png — gallery → case cut (100 ms), the cut to Consulting, a step's entrance, Evidence
    counting, button and link hover/press, the header's rule and its return; motion-phone.png — menu open/close,
    header → Contact with its dawn sheet, the dawn close.
11. .shots/v-integrate/pages.png — one deep step of every page type, 1440 then 390.

## Files changed in chain 10, by topic (commit one topic at a time)
- The engine (ENGINE): stage/stage.js, stage/wgsl/frame.wgsl.js, stage/wgsl/draw.wgsl.js, stage/wgsl/bloom.wgsl.js (new),
  stage/plates/plates.js, fx-stage.js (free camera blend, bloom, rest, clock, cut push — and HERO's two host hunks: ctx.look
  and the invisible .btn keep-out; stage them with the hero or with `git add -p`), stage/scenes/lib/camera.js (new),
  stage/scenes/README.md (also integration's ctx.look row), stage/dev.html; notes build/v-engine.md.
- The type and the page's motion (PAGE): css/tokens.css, type.css, chrome.css, cuts.css, base.css, blocks.css, case.css,
  dawn.css, print.css, parts/a-header.html, parts/a-overlays.html, fx-nav.js, fx-scroll.js (also integration's pick()
  hunk), fx.css and the 32 generated pages; notes build/v-page.md.
- The hero (HERO): stage/scenes/cover/world.js (new; also integration's plate sx and phone near-fade hunks),
  stage/scenes/hero.js (also integration's keepFeather/padding hunk), stage/scenes/now.js, stage/scenes/cover/shared.js,
  parts/b-hero.html, css/page-cover.css; notes build/v-hero.md.
- Integration (this lane): stage/scenes/case.js (--hdr), stage/scenes/gallery.js (phone ay), fx-scroll.js (pick by text
  block), world.js and hero.js hunks above, README ctx.look row; notes build/v-integrate.md.
