# w-integrate — wave 1 (plan 70 phase 1 + the 2D title sequence) integration lane (port 5295)

- Status: DONE 2026-11-12. Servers 5295/5300 stopped; 5178 untouched. (Chain 9's notes of the same name live in git at cdd0371.)
- Next: nothing; the director looks at .shots/w-final/ and commits by topic (end of file).
- Decisions: two small fixes where the pieces meet (room.js hand blade, hero.js hand) so the stage sleeps with a pointer on the page.
- How to run: `python scripts/serve-static.py 5295 public`; HEAD copy on 5300 from .shots/w-integrate/_before/; scripts in .shots/w-integrate/_scripts/w1-*.mjs; captures in .shots/w-integrate/w1/.

## Log
- Servers: 5295 (pid 10024, tree), 5300 (pid 5940, HEAD copy in .shots/w-integrate/_before). Kill those pids only.
- Gates at start: assemble ok, --check ok, claims OK (32 pages); node --check ok on 31 changed/new JS files.
- First frame (w1-first.mjs, 3 runs alternating, median ms, mine/HEAD): d index 562/559, work 548/550, about 567/548,
  consulting 560/576, obla 575/559, case-io 549/529, case by a cut 451/437; m index 543/539, work 534/547, about 539/539,
  consulting 543/537, obla 559/557, case-io 564/529, cut 454/431. Long tasks >50 ms after the first frame: none.
  Cases are consistently ~20-35 ms later than HEAD (direct and by a cut); the rest is within noise.
- GPU (fix3d gpu.mjs, PORT=5295; ms rest/peak, halvings 0 everywhere): 1440x2: index max 2.30/3.07 (rows), hero 1.42/1.46,
  work <=1.89/1.93, about <=1.65/1.74, consulting <=1.42, obla <=1.08, contact 0.14, case-mt <=2.22/2.22, case-io <=2.08/2.11.
  1920x1: <=1.99/2.03 (index), cases <=1.83. Phone: <=0.85 (case opener).
- Invariants: ?stage=0, ?gl=0, reduced motion: adapter 0, device 0, no stage-on on 10 pages (en/it, a case, 404); reduced
  motion shows every text block at once; with ?stage=0/?gl=0 the blocks under the fold wait for the scroll's focus verb
  exactly as at HEAD (same counts). ?failfield=1: stage on, page complete. Forced device failure: stage off, no errors,
  same as HEAD. Back/Forward after a cut and a header cut: stage on, frames on the next wheel, console clean.
  Console: clean on all 32 pages (walked with the wheel). Type floor (fix2d floor.mjs, 2560/1920/1440/1024/390, en+it):
  nothing small. Cut pairs (pairs.mjs): 32/32 desktop in order, none twice; phone it: all but work->case, whose click
  times out in the script at HEAD too (script, not site).
- FOUND + FIXED (stage/scenes/lib/room.js, the hand's blade): with a mouse pointer on the page the stage NEVER slept on
  Work, About, Consulting, Obla and the cases (70 frames per 3 s after 19 s quiet; HEAD 0). Cause: the hand light's
  strength eased on real time (c.dt) and crept by one ulp each frame, so the field changed and the stage redrew. Fix:
  snap S.hand and the aim spring when converged, round that strength to 1e-5. Same pattern in stage/scenes/hero.js
  (HEAD's cover never slept with a pointer either): snapped. After: 0 frames on every page; About 2 frames per 3 s
  (its camera pivot creeps by one ulp: night/shot.js, left, noted).
- Look (desktop stills .shots/w-integrate/w1/pages-d, sheets pd-work/pd-about/pd-rest.png; film w-final/site.mp4 45 s):
  every page stands in the lit room (grid, chips, bloom); Work's dolly and Evidence's bars on the grid read; the case
  opener pushes in with its plate. Found: About's path at its last step (B.Sc., Jan 2022 - Apr 2026) returns to the
  straight view where the nearest pane says SEP 2026 (path.js m = sstep(0.93,1,progress)) - a date beside the wrong
  entry. Between steps the gallery shows a plate and text of different works for a beat (fast scroll). One film frame
  at the end of the fast run showed the canvas cut by a straight edge (lower half flat): not reproduced in a 120 ms
  strip of the same travel (w1/ev.png); noted as a transient.
- Final set (.shots/w-final/): pages.png (68 desktop stills, 1440x2), pages-phone.png (64), travel.png (six 12-frame strips
  at 150 ms from site.mp4), titles.png (About's opening and the cut to Obla at 50 ms), text.png (stage on vs ?stage=0),
  states.png (stage=0, gl=0, reduce, failfield, forced device failure, it/, 404, no script, print). Films, H.264 yuv420p
  30 fps, frames extracted and looked at: site.mp4 45.0 s 1440x900, site-phone.mp4 25.0 s 780x1688, titles.mp4 12.0 s
  (About and Consulting openings, the phone menu inset on the night ground since a 1440 screen has no menu, the cut to Obla).
- Gates at the end: assemble exit 0, --check exit 0, claims OK (32 pages), node --check room.js/hero.js ok.

## Still wrong, ranked
1. About's path, last step: the B.Sc. (Jan 2022 - Apr 2026) stands beside the SEP 2026 pane (the shot returns to the
   straight view from progress 0.93). Desktop and phone. path.js.
2. A cut lands on ~300 ms of empty night after the card clears, then the page's title, then the room lights up
   (~0.5 s): the sheet, the card and the camera's push are not one gesture yet (titles.png 9.55-9.95 s).
3. Every page but the cover opens on ~0.5 s of dark before the title rises (titles.png 0.3-0.6 s).
4. Obla's character is a glossy rounded body with a soft round halo: the closest thing on the site to the water rule.
5. Forced device failure (and any stage-dead): scenes stay in step mode, posters display:none: a case shows its caption
   with no image (states.png e-case-nodevice-1). Same at HEAD.
6. Cases first frame ~20-35 ms later than HEAD (direct and by a cut); other pages equal.
7. About sends 2 frames per 3 s at rest (night/shot.js camera pivot creeps by one ulp).
8. Gallery between steps: a plate and the text of different works for a beat on a fast scroll; Consulting's gen reads
   as a grainy mark rather than an image being made.
