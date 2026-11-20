# u-integrate — chain 11b integration (port 5265)

- State: DONE. Servers stopped (5265 mine, 5266 the HEAD baseline in .shots/u-integrate/_before). 5178 untouched.
- Run/look: `python scripts/serve-static.py 5265 public`; one-off scripts in .shots/u-integrate/_scripts/ (smoke, shoot,
  park, park2, walk, cuts, floor, gpu [PORT=], inv, states, backfwd, boot-timing, prof, film [--m], sheet, rows, crops).

## Done in this lane
- **Plates over nearer letters (Needs elsewhere of u-fix and u-critic), FIXED.** Cause: the particle draw sorted each
  point against a plate's CENTRE depth (draw.wgsl ZWin), so a turned plate's near half hid letters standing in front of
  it. Now each plate sends its mid plane (normal toward the eye) and a point is in front when dot(n, p) >= w. Window
  256 -> 512 bytes (stage.js `WIN`, field.js `win`, draw.wgsl.js and field.wgsl.js `ZWin.pl`), plates.js `last[].plane`.
  hero.js and now.js no longer dip their plates to 6 % in the flight: the letters now pass as walls in front of the
  plates (flyA/f01200.jpg, f01320.jpg; park/p025.png).
- **Long tasks after the first frame, FIXED.** field/atlas.js built its three shapes in one ~75 ms task; now one
  shape per task (the 70 + 50 ms tasks after the first frame are gone).
- Declined: a per-slab control of the plates' soft-box sheen (u-fix finding 7): the slab uniform is full (16 floats
  used), it needs a layout change in plates.js / plates.wgsl.js; listed below.

## Gates
- assemble exit 0 (structural asserts ok); --check exit 0; check-claims-proto OK (32 pages). No share card asked.

## Numbers (this machine, alone; before = HEAD tree served on 5266 in the same session)
- First frame, cover desktop: before 794 / 854 / 948 ms; after 857 / 882 / 886 (median 882 vs 854). Phone 829-847.
  A case loaded directly 762-858 (phone 818-1186, noisy). A case by a cut: desktop 615-786, phone 559-613 (before:
  749-773 desktop in the same session; the chain-8 "520 ms" was on a quieter machine).
- Long tasks in the first second: one 92-105 ms task right before the first frame (the hero world: nameSets,
  contour, raster; before: 55-110 ms). Nothing after it.
- GPU median while moving (tier A unless said, halvings 0 unless said):
  1440 DPR2: cover 1.47, flight 1.35, gallery 1.19, stack 3.24 (HALVED x3, 20k points), case 1.54.
  1440 DPR1: cover 0.78, flight 0.54, gallery 1.09, stack 2.14, case 1.17.
  390 DPR2 (tier B): cover 0.37, flight 0.38, gallery 0.46, stack 0.14, case 0.10.
  Work's gallery and About's stack identical before/after (gallery 1.21 vs 1.21; stack 3.26-3.30 vs 3.28-3.31, the
  halving is at HEAD too). Consulting 0.28 vs 0.28, Obla 0.24 vs 0.24.
- Invariants: stage=0, gl=0, reduced motion -> 0 adapter / 0 device calls, no stage-on; failbloom -> stage on, bloom
  failed; lost device -> second device, stage on; forced device / adapter failure on the cover -> `stage-dead`, flat
  name in paper, cue hidden (st/nodevice.png); failfield -> field failed, stage draws (0.52 ms); Back / Forward after
  a cut -> stage-on both ways. Console clean on every page visited (EN and IT, desktop and phone).
- Type floor (floor.mjs, 9 pages x 5 widths x 2 languages): 0 text nodes under the floor; nav 18/18/20/24/28,
  buttons 18/20/20/23/26 px at 390/1024/1440/1920/2560; header never wraps.

## Still wrong (in order)
1. The opening still starts on ~0.8 s of empty night (first letter at ~0.8-1.0 s); arriving by a cut on the cover it is
   ~1 s of night after the sheet leaves (cuts/case-cover-*.jpg). The igniting letter smears for a frame or two.
2. Plates catch a grey soft-box sheen at some pointer angles (Sphere plate top left, Domus plate): hero-sweep.png rows
   7-8, film at 9 s. Needs a per-slab sheen control in plates (slab uniform full).
3. Shafts still read as columns of dust more than volumes of light; at rest the chips are almost invisible (by
   design) and only glint when a sweep crosses them; the hand's shaft is hard to read in the sweep strip.
4. About's stack at 1440 DPR2 halves the swarm three times (3.2 ms, 8 plates): pre-existing at HEAD.
5. Letter edges a little bumpy at 1:1 and the face glows past its outline (hero-rest-crops.png); far better than v1.
6. Consulting's first figure (`gen`) reads as a square of noise in a frame (pre-existing).
7. A cut shows the card's name, then the page's own h1 a few frames later (never together, 0 frames overlap).
8. Desktop film runs 17.3 s (opening 6.5 s incl. rest, sweep 4.5 s, flight 5 s); trim if needed.

## Open first (director)
1. .shots/u-integrate/hero-rest.png — the hall at rest, 1440 DPR 2, full size.
2. .shots/u-integrate/hero-open.png — the opening, 100 ms frames, 3.5 s.
3. .shots/u-integrate/hero-rest-crops.png — 1:1 letters DPR2 (row 1), v1 vs v2 at 1920 DPR1 (row 2), DPR1 (row 3),
   chips: SerSan marks and A's in the flight at DPR2 / DPR1, and at rest (row 4).
4. .shots/u-integrate/park-stills.png — four parked stills of the flight: letters in front of the plates, the wall
   lit, the chips around Now's plate.
5. .shots/u-integrate/hero-fly.png — the flight down and back plus the parked stills.
6. .shots/u-integrate/hero-phone.png — phone at rest, the flight, parked stills.
7. Films: .shots/u-integrate/cover.mp4 (1440x900, 17.3 s, 3.4 MB) and .shots/u-integrate/cover-phone.mp4
   (780x1688, 13.2 s, 2.3 MB); H.264 yuv420p 30 fps; frames checked in .shots/u-integrate/filmcheck/.
- Then: hero-open-phone.png, hero-sweep.png, type.png (1440 | 1920 | 390, seven pages), cut.png / cut-phone.png
  (gallery -> case, header -> Contact, case -> cover, 50 ms), pages.png (every scene through its steps).

## Files changed in this chain, by topic (for one commit each)
- **The field's engine:** stage/field/field.js, field.wgsl.js, atlas.js (new); stage/stage.js (field hooks, `WIN`
  window); stage/dev.html (view=field); stage/scenes/README.md ("The field"); fx-stage.js (the scenes' field lines).
- **The hero v2 with the critic's fixes and the field in the hall:** stage/scenes/cover/world.js, cover/shared.js,
  hero.js, now.js; parts/b-hero.html; css/page-cover.css; parts/strings.mjs (hero.scroll); fx-stage.js (stage-dead).
- **Type that scales, the cut and the pictures:** css/tokens.css, chrome.css, cuts.css, type.css, print.css, case.css;
  parts/a-overlays.html; fx-nav.js; fx-scroll.js.
- **Integration (this lane):** stage/wgsl/draw.wgsl.js, stage/field/field.wgsl.js (ZWin planes), stage/plates/plates.js
  (`last[].plane`), stage/stage.js (`WIN` 512, the window write), stage/field/field.js (`win`), stage/field/atlas.js
  (one shape per task), hero.js and now.js (no plate dip in the flight).
- Generated: every page in rv/ and rv/it/, fx.css. Notes: build/t-field.md, u-hero.md, u-fix.md, u-critic.md,
  u-page.md, u-integrate.md.
- Note: stage.js and fx-stage.js carry hunks of more than one topic (field hooks + WIN; field forwarding + stage-dead);
  commit them with the field's engine, or split with `git add -p`.
