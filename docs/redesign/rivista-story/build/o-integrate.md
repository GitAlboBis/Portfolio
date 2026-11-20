# o-integrate (wave 4, port 5334)
- done: nothing yet (stub)
- next: gates on both builds; numbers vs HEAD copy; 25-nav counts; invariants; final set + films
- decisions: none yet
- how to run/look: python scripts/serve-static.py 5334 <folder>; scripts in .shots/o-integrate/_scripts/

## Log
- gates (both builds): assemble --check 0, claims OK, web build/parity OK (allowed list)/asserts/claims OK; node --check on all changed JS OK.
- HEAD copy: .shots/o-integrate/_before (git archive HEAD; web/node_modules is a JUNCTION to web/node_modules: remove with cmd /c rmdir, never rm -rf).
- servers: 5334 mine Astro (web/dist), 5335 mine assembled (public), 5336 HEAD Astro, 5337 HEAD assembled. pids in _scripts/srv*.pid.
- runA.sh (functional), runB.sh (numbers) running; runC (films/final set) next.
- runA (functional) DONE, both builds: console clean 32 pages each; states stage=0/gl=0/reduced = HEAD identical (below-fold reveals only; reduced 0 hidden);
  failfield/faildevice end on working pages; failsplat ok; sleep 0 frames on 11 pages each build; type floor 126/126 ok; deep links+reload ok;
  B/F ok; pairs desktop all start>uncovered>arrived once (Astro ~660-750 ms; assembled ~1040-1117 ms); phone gallery->case pair = probe artefact (wheel on touch).
  walks EN/IT (25 navs): canvas 1, listeners 77->75->76, observers 10, triggers 0, lenis 1, heap 6.8->8.1 MB after GC, console clean, 5 full loads (reload, deep link: expected).
  walk "NO LINK" on index rows = probe artefact (rowsoft.mjs: real click on a row after a soft arrival goes to About).
  Back/Forward scroll drift 5/27/38 px still (known).
  text crops 1:1 (stage on vs ?stage=0): work s3, consulting s2, obla s2, case: clean; a field chip or two sits near the right edge of the text box (not on letters).

## Director's closing (12 November, 22:39)
- The lane was cut by the usage limit about 21:20 with runA (functional), runB (numbers) and runC (the final set and the films in .shots/o-final/) done and these notes not updated. The director closed: the four servers on 5334 to 5337 stopped; the junction .shots/o-integrate/_before/web/node_modules removed (the link only).
- Numbers from the lane's logs (_scripts/B-*.log): flight GPU at 1440 DPR 2 median 1.81, p90 2.61, max 3.17 ms (rest 1.78); 1920 DPR 1 p90 2.06, max 2.64; phone max 1.43. Per page at rest and peak within the limits, except one 6.76 ms frame on Work's evidence (median 1.16: one spike, not looked into). First frames on the Astro build within the noise of HEAD.
- The director's own checks on the committed build (server 5180): gates green on both builds; walk.mjs --port=5180: 25 arrivals, each with one h1, one main, one canvas, console clean, listeners 75 to 76, observers 10, Lenis 1, heap 8.2 MB; rowsoft on 5180: a real click on an index row after a soft arrival goes to About (the walk's NO LINK is the probe's).
- Judged: safe to show; the cut is continuous but the eye does not travel (see HANDOFF.md); wave 5 follows (n-*.md).
