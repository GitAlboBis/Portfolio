# r-work — GLOW-WORK lane (wave 2), port 5301

- Owns: stage/scenes/{gallery,evidence,case,mist}.js, case/**, lib/{room,page,camera}.js, stage/field/**, stage/plates/**.
- Goal: decisions A, B, C(n/a here), F(n/a) on work.html + nine cases: rooms lit like the cover, plates that read.
- Status: DONE 2026-11-12 (servers 5301/5306 stopped; 5178 untouched). For the director to look and commit.
- Next: nothing in this lane; the host needs one word (Needs elsewhere).
- Run: python scripts/serve-static.py 5301 public; captures in .shots/r-work/.
  Scripts: .shots/r-work/_scripts/{shoot.mjs <tag> <page> [--m|--d1] [--steps=gallery:0-9,evidence:1-3], sheet.mjs, lum.mjs}

## Diagnosis (baseline .shots/r-work/base, base-sheet.png, at rest after 3 s)
- Measured: room p50 luma 0.07-0.12 (cover 0.07): the room is not darker on average; what the cover has and these lack is
  LIGHT WITH BODY (blade shafts in haze, visible), CHIPS you see (cover: hundreds bright, rimmed; here dozens, tiny) and a
  wall grid outside the subject's patch.
- GALLERY: lit patch behind the plate only, no blade on screen in 10/10 stills (room blades start in front of the page
  at z 0.2 D and their travel sweeps off the right edge a third of the time). Plates at rest read; Sphere AI p99 0.55,
  Supply Chain p99 0.35 (dark diagram); etched words are fine-ish but small line, bevels thin, edges barely lit.
  -> room `glow` option (cover's blade geometry, travel kept in frame, more and larger chips, unlit wall raised); captures
  lifted to a peak ~0.85 on a canvas (levels) in the scene; etched plates: bevel wider, larger line.
- EVIDENCE: bars bright, wall lit in the middle, no blade, few chips. -> same room glow; bars over a lit wall.
- CASE opener / MIST chapters: chapters dim 0.8, no blades, 3600 chips: a dark room. -> glow with blades kept on the figure's
  side, dim lowered; etched case plate bevels.

## Done (keep current)
- lib/room.js `glow` 0..1 (default 0 = today's image): blades come down close in front of the wall (z wallZ+0.28D,
  lean 0.4 vw: more lean turned the blade edge-on and it vanished), travel round the eye inside the frame (0.34 wallW),
  strength 1.45, haze 0.17/0.12; chips x1.35, middle A x1.3, near 0.1 x2.7, edge 0.55, rim 1; unlit wall 0.05.
  gallery + evidence pass glow 1 (g6-sheet.png: a column of light and >100 chips on every still).
- plates: `edge` 0..1 per plate (default 0): the bevels lit paper white of their own (plates.wgsl.js edgeOf, packed in
  look.x above the glow). NEEDS the host to pass "edge" through (see Needs elsewhere); my shoot.mjs patches it in flight.
- case/lift.js: a dark capture drawn once with its levels set (per-channel ground to black, top 1 % near paper, gain
  <= 3.6); Sphere AI and the Supply Chain diagram now read (lines bright on dark glass). Own Image copy (the page's <img>
  is never decoded while the stage draws: naturalWidth 0).
- gallery: etched line 0.27 of the figure (was 0.2), bevel 11, edge 0.6/0.36; travel mostly in the outer fifth of each
  step (hold d*0.16 + 0.42 sm(0.24,0.5,|d|)).

## Needs elsewhere
- fx-stage.js (ARRIVE lane / director), the slab passthrough list (line ~678 at HEAD):
  `for (const k of ["inset", "bevel", "ior", "dispersion", "tint", "sheen"])` -> add `"edge"`. Without it the plates'
  edge light is simply off (today's image); with it the gallery's and the case's plates have lit bevels.

- gallery travel: continuous `hold(x)` about the nearest work, centred 0.22 of a step after the boundary on every
  device: a step's title is on screen from ~0.2 of its step to ~0.2 of the next (measured, _scripts/gdbg.mjs), so the
  plates glide while the two texts trade places (sd-sheet.png: no plate beside another work's text on a fast wheel).
- phone: ONE band per step (measured while the step's text rests; an unmeasured step takes the last one's): no hop
  (sm-sheet.png). A text block crossing the band hides the plate, never moves it.
- case.js: room glow 1, chips 7000 desktop, phone dim 0.3; plate edge 0.6/0.36; dark captures and the crop leveled
  (withLevels); the glow behind an etched plate halved (it read as a soft cloud in the glass). mist.js: chapters lit
  (glow 1, two blades on the figure's side, dim 0.15/0.35, 7000/4000 chips), text kept by keepDim.
- room.js: `fade` 0 when ctx.arrival.cut (ARRIVE's flag): a page reached by a cut is lit under the sheet.

## Proof (looked at)
- final/work-d.png (cover's rest frame + 13 Work stills 1440x2), final/work-m.png (phone), final/cases.png (six cases),
  c-sheet.png (three cases incl. chapters), d1-sheet.png (1920x1), mc-sheet.png (phone cases), st-sheet.png (states),
  crop-chap.png / crop-g9.png (1:1: chips and haze off the text), sd-sheet.png / sm-sheet.png (travel strips).
- GPU ms rest/peak, halvings 0 unless said (other lanes' browsers running): 1440x2 Work 1.22-2.17 / <=3.21 (evidence
  end with the hand moving), case-mt 1.60-2.17/2.21, case-ai 0.81-2.08/2.11 (halv 2 once in the chapters, not at d1);
  1920x1 <=1.81/1.82; phone B <=0.87.
- Sleep with the mouse on the page (_scripts/sleep.mjs, 19 s quiet): Work gallery/evidence and case opener/chapters
  0 frames in 3 s.
- First frame (_scripts/first.mjs, 3 runs, mine vs HEAD copy on 5306): work 306/558, case-mt 308/554, case-ai 304/581,
  cut to a case 189/449 ms (ARRIVE's host work is in the tree); no long task > 50 ms after it.
- States: ?stage=0, ?gl=0, reduced motion: stage off, printed page; ?failfield=1 Work and a case: stage on, no room;
  Italian Work fine; console clean everywhere.
- Gates: assemble --check exit 0; check-claims-proto OK (32 pages); node --check on every file I touched.

## Still wrong (ranked, what Alberto would see first)
1. The plates' lit bevels need the host's one word ("edge" in fx-stage.js's passthrough). Without it the plates are
   as at HEAD: edges barely lit, the etched glass read only by its words.
2. The blades are soft vertical columns, not the cover's slanted shafts with a bright core: leaning them more turned
   the blade edge-on and it vanished (room.js lean 0.4). On some stills (a case opener at a given clock time) the
   column is faint. A blade with a brighter core / its own roll is the next step (field section, not tried).
3. The edge light reads a little like a metal frame on a phone (plate small, bevel 11-12 px).
4. On a fast wheel a plate still passes dim for ~one frame (90 ms) between two works; the phone hides the plate while
   the outgoing text crosses its band (a beat of empty room above the text).
5. Evidence end (with the hand moving) peaks at 3.21 ms at 1440x2: inside 3.3, close.
6. Sphere AI's capture is leveled hard (gain ~2.7): its ground is black, its UI lines bright; it reads, but it is
   brighter than the live page.
