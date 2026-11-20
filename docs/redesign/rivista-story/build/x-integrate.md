# x-integrate — chain 8, integration lane (port 5234)

- Status: DONE (2026-11-11). Cross-lane requests handled, gates green, final look taken and laid out in five sheets.
- Decisions: below, per item.
- Run: python scripts/serve-static.py 5234 public ; captures under .shots/x-integrate/

## Needs elsewhere, reproduced (from x-drive; x-case and x-light asked for nothing)
1. Obla over text on the phone (it/obla.html 390): REPRODUCED (drive capture f-obla-m-it-1-read.jpg). FIXED in
   stage/scenes/obla.js: with the figure on top, the character keeps to the widest band of the figure's half (under
   the header) that no text block crosses, shrinks as a step's text rises into it, steps back below 30 % room; the
   light gets the text blocks as keep-outs. Looked: .shots/x-integrate/fix-obla/sheet.png (6 scroll points, none over text).
2. Stack plate over the step's title at 900x900 and 720x450 (200 % zoom): REPRODUCED. FIXED in stage/scenes/stack.js
   (side "top" only; desktop 1440 and the phone at rest unchanged): the stack also fits the figure's height; a text
   column at the left of the figure sends it into the room right of the text; on a short window (vh < 600) a text
   that crosses it sends it to the widest free band, sized to it; on a tall screen it steps back (alpha, light) while
   a step's text passes through it. Looked: fix-stack2/w-sheet.png, fix-stack2/m-sheet.png (phone step change strip).
3. Domus figcaption opacity (Axe): NOT REPRODUCED after the CASE lane's rebuild: the case caption now lives in step 2;
   computed opacity 1 on case-sersan-io (step 1 and 2), case-domus-tua (after a cut) and it/case-domus-tua with reduced
   motion. Nothing to change.
4. Stage pop: FIXED in fx-stage.js: the canvas starts at opacity 0 and comes up in 700 ms (--ease-out) on the first drawn frame.
5. "CORE" vs "LINGUAGGI": DECLINED, not a defect: the stack etches each step's own title, and step 01 is "Core" in
   English and "Linguaggi" in Italian (parts/strings.mjs); the two editions match step for step.

## Gates (after every change of this lane)
- node public/proto/rivista/assemble.mjs: structural asserts ok (163 strings)
- node public/proto/rivista/assemble.mjs --check: exit 0 (no share card asked for)
- node scripts/check-claims-proto.mjs: OK, 32 pages
- Console: no error on any page walked (the only log matched is the normal "[stage] off: pagehide" on leaving a page).

## The state of the site
Every lane's work runs together without conflict. The nine case pages open on their plate. The plate comes in from
deep in the room after the cut and turns in the figure's half. In step 2 it faces the reader, then hands over to calm
chapters in mist. "More work" and "All works" cut cleanly, in both languages and at both sizes. The light lane's three
fixes hold with everything on. The Evidence bars are straight and even, with clean ends. The Now glow is smooth. The
noise frame on the Consulting opening has a straight, still border. The stage now fades in over 0.7 s instead of
popping. Obla and the About stack no longer draw over body text. The 404 close has its own engine line. ?stage=0 and
reduced motion print complete pages.

## Still wrong, in order (HANDOFF §6, minus what chain 8 fixed, plus what it left)
1. Soft round discs: Consulting's agents (step 4 and the close), the Consulting emblem on the cover, Obla's grainy halo
   at rest (now also visible on the phone sheet). Still the closest thing on the site to what the water rule forbids.
2. The cover's 26 motes are soft round discs, as requested; to remove them, take `motes` out of hero.js's swarm list.
3. The case arrival leaves an empty right half (desktop) or an empty top (phone) for about 1–1.5 s after the cut
   while the texture loads, the canvas fades in and the plate travels. The first impression of a case is text alone.
4. Etched case plates (maintech, badante24h, doit) read dim in step 2. During the arrival turn on desktop
   (case-mt d-09-arr08) the clear plate briefly fills with the soft box's grey band, so it reads as a grey card for a moment.
5. Supply Chain: the class diagram's box labels are too small to read even in step 2 (bands and links read).
6. On the phone, the Evidence head ("Measured before and after") has an empty upper half: the bars appear only from step 1.
7. On a tall screen the stack and Obla now step back while a step's text passes through the figure (they no longer
   cover it). Each step change on the phone therefore has a short dim beat. This is deliberate, but Alberto should see it live.
8. Cost of plate edges (three rays per edge pixel; a 12-plate stack bench 2.27 ms of a 3.5 ms budget).
Fixed by chain 8 and removed from the list: the Consulting frame border tremble, the grain and wandering points of the
Evidence bars, the mottled glow behind Now, and the 404 close line.

## Open first, in order
1. .shots/x-integrate/case-desk.png — sersan-io arrival strip (8 frames ~300 ms apart), then gallery → step 1 →
   step 2 → chapter 1 → More work → Domus Tua arrival → Domus Tua → Work; then Supply Chain in Italian; then Maintech
   (key words only). 960 px desktop frames.
2. .shots/x-integrate/case-phone.png — the same three walks at 390.
3. .shots/x-integrate/light-desk.png — row 1: Evidence's 3 steps at rest and a step-change frame; row 2: the rest of
   the strip and the cover's first screen; row 3: Now, Consulting's opening (gen), its first block, the 404's dawn close
   with its own engine line; row 4: badante24h with ?stage=0, then it/case-domus-tua with reduced motion.
4. .shots/x-integrate/light-phone.png — the same at 390.
5. .shots/x-integrate/drive.png — the fixes of this lane: Obla on the phone (it, six points), the stack's phone step
   change, About at 720x450 (200 % zoom), the cover's cold load (canvas fading in), About at 900x900.

## Files changed in chain 8, by topic (commit one topic at a time)
- The case scene (CASE): parts/c-main.case.mjs, css/case.css, stage/scenes/case.js (new), stage/scenes/case/etch.js
  (new), fx-stage.js (mist kept on main[data-case]: the CASE hunk), assemble.mjs, parts/c-footer.404.html (new),
  parts/strings.mjs (nf.engine), generated: the 18 case pages, 404.html, it/404.html, fx.css; notes build/x-case.md.
- The light (LIGHT): stage/scenes/evidence.js, stage/scenes/now.js, stage/night/gen.js, stage/scenes/consult.js; notes build/x-light.md.
- What the drive fixed (DRIVE): css/type.css, fx-core.js, css/chrome.css (+ fx.css regenerated); notes build/x-drive.md.
- Integration (this lane): stage/scenes/obla.js, stage/scenes/stack.js, fx-stage.js (the canvas fade-in: makeCanvas's
  opacity/transition and the opacity on the first drawn frame, two hunks); notes build/x-integrate.md.
  fx-stage.js carries hunks of two topics: stage them with `git add -p`.
- Scripts used (git-ignored): .shots/x-integrate/_scripts/walk.mjs (reader walk: wheel, click, strips, cold load, DPR 2), vstack.mjs.
