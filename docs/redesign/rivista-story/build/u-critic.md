# u-critic — the client's eye on the cover (hero v2), round 11b (port 5264)

- Done: own captures (opening x2 desktop + x2 phone, rest at 4 sizes + 1:1 crops, pointer H/V sweep, flight down/back
  desktop + phone, 6 parked stills each, Italian, ?stage=0, ?gl=0, reduced motion), boot-timing, GPU; read world.js,
  hero.js; read u-hero.md last. Server stopped. No site file touched.
- How to run: `python scripts/serve-static.py 5264 public`; `.shots/u-critic/_scripts/shoot.mjs <tag> arrive|sweep|vsweep|fly
  [--m] [--dpr=N] [--n=N]`, `stills.mjs [tags]`, `park.mjs [--m]`. Captures in .shots/u-critic/.
- Verdict: NOT YET to show. Better than v1 (the opening has a real moment at ~1.7 s), but see findings.

## Numbers
- First frame 770 ms desktop, 867 ms phone (slightly over 800). First letter visible ~1.0 s after navigation.
- GPU rest: A 1440 DPR2 0.99 ms, DPR1 0.57, 1920 DPR1 0.65; phone B 0.34. Flight 0.26-1.38 ms. No halving anywhere.
- Same opening on both cold loads (desktop and phone).

## Findings, ranked (most disappointing first)
1. Letters speckled at 1920x1080 DPR1 (rest/w1.png, c-w1-first.png): every face peppered with cobalt pinholes, bumpy
   edges. Fixed point budget per tier vs glyph area that grows with the viewport + the non-bijective target map
   (world.js nameSets, SH.face / dens; header comment admits it). Exposure hides it only at DPR2/1440.
2. Opening pile-up (open-d1/f01700, open-m2/f02000): 1.3-2.3 s the letters collide (ALBERTO smears into TUVERI;
   phone: TUVERI a mangled heap under ALBERTO, the O cut by the right edge). hero.js IGN_DT 0.07 + spawn -0.32 D
   behind each letter; open.from yaw -0.9 at 0.95 D looks down the line so streaks cross neighbours.
3. The hall arrives as an afterthought (open-d1 sheet rows 4-6): name alone on black 2.3-3.0 s, then plates fade in
   small and late (PLATE0 1.75 + i*0.28 + 1 s). At rest they read as five small stickers around the name (the
   "floating cards" he once rejected), two of them SerSan logos (w4 sersan-brand + Now's sersan.io plate at top centre).
4. Shafts read as grey TV-static columns, not light (rest/d1.png, m2.png): uniform hashed dust, no bright core, under
   the bloom threshold 0.5 (world.js shaftSet, inkShafts; hero.js bloom threshold).
5. Flight: name vanishes in one 120 ms frame (fly/f00720 -> f00840), then ~0.5-0.8 s of near-empty dark with blurred
   round bokeh dots (fly/f00960, park-m/p040, p060). coverCamera near/nearFull fade + nameW; aperture rack to 1.
6. A hall plate draws over a letter in front of it (fly/f00720: sphere/sersan plate cuts the U; park/p020). Slabs are
   composited over the swarm with no depth test: an engine matter (stage plates pass), not hero.js.
7. Grey soft-box sheen washes whole plates at pointer angles (sweep/f01200 code plate, f04680 SerSan plate; fly/f00840).
8. Phone: letters swollen and fuzzy, counters closing (rest/c-m2-name.png): tier B ink 2x per point (inkFace TIER.A/n);
   the Domus plate (spec w3 sy 0.37) sits on the TUVERI line against the I; top plates crowd under the header.
9. Depth reads as a hazy cobalt smear with a horizontal streak joining the letters along top/baseline
   (rest/c-d2-last.png) — the contour layers, not a block of glass-cut light; risks reading as a reflection line.
10. Pointer: the name barely answers (sweep, vsweep sheets): plates swing, the name stays a flat white face.
- OK: Italian, ?stage=0, ?gl=0, reduced motion (desktop + phone) are the calm printed page; console clean; no water,
  no magazine. Detector: only the index list's flush rules and one uppercase label (not hero).

## Checked against u-hero.md
- "faint holes inside the face at DPR1": understated; at 1920 DPR1 it is the dominant read.
- "phone: no plate covers the text below": true, but one plate sits on the name's own line.
- "name reads ~1.2 s after the first letter": seen ~1.3 s. Unexplained plate-over-letter: cause = no depth between
  slabs and points (engine).

## Needs elsewhere
- stage engine (stage/plates/plates.js or the stage's compositing order): plates must respect depth against the
  swarm (finding 6). Not a hero.js fix.
