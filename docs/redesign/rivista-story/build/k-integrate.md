# k-integrate — wave 8 (k-): the integration on the final tree

- **Done (14:42, 22 Nov):** all six items. 1 gates pass on the final tree · 2 the Astro build: 34 pages clean, the click
  walk clean, AudioContext 0, the home end to end at 1440 and 390, the printed states (one defect found and fixed) ·
  3 the release: walk by clicks, crawl, robots and sitemap right · 4 GPU (lane equal to or under HEAD's build) · 5 the
  look, `.shots/k-final/` (five images) · 6 the commit split (below). Five small fixes in all (list below).
- **Next:** nothing of the brief. The director: the live site answers 404 DEPLOYMENT_NOT_FOUND (since 21 Nov 20:06,
  still at 13:58 on 22 Nov); ORRERY's figure for Now waits for the «via libera».
- **Cut at 07:56 (22 Nov), resumed at 13:58** («riprendi»): no site file changed since the 07:42 gates (only CLAUDE.md,
  DESIGN.md, HANDOFF.md and k-docs.md, the DOCS lane's); the home end to end (1440, 390), the printed states and the
  release's crawl (34 pages clean, 0 requests under /proto/rivista/) had finished before the cut. The live site still
  answers 404 DEPLOYMENT_NOT_FOUND at 13:58 (`x-vercel-error`), so HEAD is still its own build. No process of mine was
  left (5405-5407 free).
- **Decisions:** the live site https://portfolio-jet-eta-24.vercel.app answers 404 on /, /work.html, /robots.txt (22 Nov
  07:41, as SMOOTH and FIX3D found since 21 Nov 20:06): HEAD's numbers come from HEAD's own Astro build
  (`.shots/k-fix3d/headroot`, FIX3D's `git archive 551f252`), served beside mine. ORRERY (k-orrery.md) waits for the
  director's «via libera» and lives in its overlay only: nothing of it is under public/, nothing integrated here.
- **How to run:** servers (pids in `.shots/k-integrate/pids.txt`): 5405 `python scripts/serve-static.py 5405
  .shots/k-integrate/dist public` (pid 26064), 5406 `… 5406 public` (pid 29736), 5407 `… 5407 web/release` (pid 27192).
  Probes in `.shots/k-integrate/_scripts/` (l-integrate's, retargeted; crawl.mjs and printed.mjs from m-integrate; the
  audio counter wraps AudioContext, webkitAudioContext and OfflineAudioContext before any script).
- **How to look:** captures in `.shots/k-integrate/`, the final set in `.shots/k-final/`.

## Resumed run (22 Nov, from 13:58)

- Servers: 5405 pid 24412 (`.shots/k-integrate/dist public`), 5406 pid 14748 (`.shots/k-integrate/dist
  .shots/k-fix3d/headroot public`: mine at /proto/rivista/, HEAD 551f252's Astro build at /head/proto/rivista/, its
  fx-stage.js checked identical to 551f252's), 5407 pid 21428 (`web/release`).
- 3 THE RELEASE, done: the click walk on 5407 (`walk.mjs --root`, 25 navigations: header, gallery to case, More work,
  Back/Forward, the home's parts, language, double click, a click during a flight, reload mid-flight, deep link): every
  flight flew (5 full loads where expected), every h1 visible, every request 200, 0 requests under /proto/rivista/,
  console clean, AudioContext 0, asleep (0 submits in 3 s after 19 s), counts flat (listeners 79 / 76 / 76 / 76, Lenis
  1, canvases 1, formations 22 at start and end, heap 10.9 to 12.7 MB), Back to the home landed at 6548 from 6517.
  robots.txt `Allow: /` + the sitemap; sitemap.xml 32 `<loc>`, each a file of the release, no 404; robots meta
  `index, follow` (404 `noindex`); canonicals on the site's origin.
- The home-d halving (07:51, the swarm halved twice at the gallery -> evidence join, back in 10 s) is not the lane's:
  `jump.mjs` (that jump and a reader's wheel over it, lane and HEAD, alternating, twice): the lane never halved (max
  2.4 ms), HEAD's own build halved both rounds (bloom pass 6.1-6.2 ms in 11-22 frames, 2.6-3.4 s after the jump).
- A printed-state defect found (pre-existing, print.css untouched by HEAD's wave): printed after a read with the stage
  on, the home printed without its name (the h1 stays `color: transparent`) and the fixed canvas laid its plates over
  the text. Fixed in `css/print.css` (canvas.fx-stage hidden, the home's name in ink). Proof (`printed.mjs 5405` on
  the rebuilt Astro pages, 14:21): print EN/IT 0 visible canvases (was 1), the name printed in ink above the foot
  (`printed/print-top2.png`, was `print-top.png`); ?stage=0, reduced motion and no script unchanged and complete.
- 4 GPU, done (`gpu.sh d d1 m`, 14:05-14:16, CPU 2-82 % between probes; lane on 5405 against HEAD's build on 5406, the
  same probe on the same home; rest = median of two 1.6 s windows, peak = max over a reader's wheel, p95 beside it).
  Medians lane | HEAD, ms:
  - 1440 DPR 2 tier A: hero 0.80 | 0.83 · now 1.48 | 1.50 (peak 2.50 | 2.63) · gallery 1.71 | 1.72 (peak 2.34 |
    2.29) · evidence 0.81-0.93 | 0.60 in round 1, 0.68-0.71 | 0.71-0.74 in round 2 · stack 1.27 | 1.26 · path 1.19 |
    1.19 (peak 1.74 | 2.29) · consult 0.72 | 0.91, round 2 0.57 | 0.59-0.71 · obla 0.30 | 0.30 · contact 0.16 | 0.16.
  - 1920 DPR 1: hero 0.70 | 0.72 · now 1.61 | 1.62 (peak 2.30 | 6.03) · gallery 1.34 | 1.64 (peak 1.79 | 2.39) ·
    evidence 0.51 | 0.57 · stack 0.97 | 0.97, round 2 0.92 | 0.94-0.96 · path 1.03 | 1.03 · consult 0.38 | 0.89 · obla
    0.27 | 0.27 · contact 0.13 | 0.14.
  - 390 tier B: hero 0.28 | 0.28 · now 0.77 | 0.77 (peak 0.91 | 0.89) · gallery 0.66 | 0.62-0.63 (SMOOTH's springs,
    peak 0.64 | 0.62) · evidence 0.24 | 0.25 · stack 0.36 | 0.36 · path 0.49 | 0.57 (peak 1.07 | 1.45) · consult 0.24 |
    0.25 · obla 0.14 | 0.13 · contact 0.07 | 0.07.
  - Single frames of 5-6.5 ms come on both builds in random scenes (lane: 1440 evidence 6.09 and consult 5.77 in round
    1, 1920 path 5.32 and 6.45; HEAD: 1920 now 6.03, consult 5.49, stack 4.23, phone evidence 6.37), p95 always under the
    limits (max p95 2.35, 1440 now). Not the lane's: round 2 of the 1440 scenes peaked 2.01 / 1.07, and `evpass.mjs`
    (per pass, alternating, twice) found none at 1920 path under a reader's wheel (max 1.24 / 1.34, HEAD 1.89 / 1.16)
    nor at 1440 evidence at rest (lane 0.70 / 0.74, HEAD 0.68 / 0.70). The swarm never halved (min drawn 160k / 80k).
  - Two flights (1440 DPR 2): home -> Work rest 1.10, out top 1.98, in 1.71 (HEAD 1.10, 2.09, 1.82); Work -> About
    rest 1.74, out 2.75, in 2.24 (HEAD 1.66, 2.72, 2.09). Under 3.3; the swarm whole.
- Gates again after print.css (14:19): assemble 0 (169 strings), `--check` 0, claims OK; Astro into
  `.shots/k-integrate/dist` 0, PARITY OK (145, 0 differ), asserts ok (34 pages, 1156 refs), claims OK. Release again
  (VERCEL_ENV=production, 14:20): three [release] lines, 34 pages (32 in the sitemap), 154 files, 5.3 MB.
- 5 THE LOOK, done (`look.sh`, `compose2.mjs`; the final set in `.shots/k-final/`, each opened and judged):
  - `slides.png`: Work's gallery and About's stack, 1440 (five wheel notches) and 390 (a fling), every compositor frame
    (`strip.mjs --auto`, from SMOOTH's): kymographs lane | HEAD and the lane's last ~450 ms. The lane's plates and
    layers come to rest on one smooth curve (no kink, no frame change above its neighbours: max 5.14 gallery, 2.30
    stack); HEAD shows the kink of the apex jump in the gallery and a one-frame cut in the stack (frame change 8.15).
  - `header.png`: 1440 and 390, EN and IT, the header without the toggle (EN / IT ends on the gutter, MENU alone on
    the phone), HEAD's with its toggle beside them. (The header is away while reading down, by design, `html.hdr-away`:
    the captures turn back 160 px, `pages.mjs` `^up`.)
  - `fixes.png`: FIX2D's plates (Maintech «DEFAULT-DENY», Badante24h «… on PostGIS», 1440 and the IT phone), the 404
    («Back to the home page», «Pages»), the IT Consulting scene name on the phone (HEAD cut with an ellipsis beside the
    toggle, now whole), the Supply Chain diagram, Now's second link, Obla's fields; FIX3D's door seams, the morning
    toward Contact, the list figure without numbers, the caption kept clear, the phone path. Each before is HEAD's build.
  - `flights.png`: six strips at 50 ms (home -> Work, Work -> About, About -> Contact, Contact -> home, a case -> home,
    Back to the home's Work part): each flies (nav:start +10 ms, covered ~213, lit ~487, arrived ~990), no blank or
    grey frame, toward Contact the title rises at 650 ms, from Contact the night opens as a slit on the paper, Back lands
    on the same plate; drawn 160 000, no halving, no long task in a flight.
  - `home.png`: the home end to end at 1440 (EN) and 390 (IT), a still per part step.
- A share-card defect found and fixed: the Maintech cards (EN and IT) left «DATABASE» alone on the line's second row
  (FIX2D's stillWrong). `scripts/media/og-card-jobs.mjs`: the words line in balanced rows (`text-wrap:balance` on the
  element, so only the eight words cards' input hashes change); the eight redrawn with `og-cards.mjs` (RV_BASE on
  5406): «ON EVERY TABLE, PERMISSIONS / HELD IN THE DATABASE», «SU OGNI TABELLA, PERMESSI / CONSERVATI NEL DATABASE»
  (`og-words.jpg`). Gates again (14:36): assemble 0, `--check` 0, claims OK; Astro PARITY OK, asserts ok (1156),
  claims OK; release three [release] lines, 154 files, the new cards in it.
- The final release crawled again (14:37-14:42, `crawl.mjs http://127.0.0.1:5407/ web/release`): 34 pages clean (console,
  every request 200, no AudioContext), the stage lit on 32 (the two 404s have none by design), 0 requests under
  /proto/rivista/.
- Fresh before returning (14:42): `node --check` on the 29 changed scripts 0 failures; assemble `--check` 0; claims OK;
  Astro into `.shots/k-integrate/dist` 0, PARITY OK, asserts ok (34 pages, 1156 refs), claims OK.

## 6 The commit split (for the director; every changed file once, checked against `git status`: 106 files)

`.shots/k-integrate/split.json` holds the lists. Order that keeps each step runnable: 1 → 3 → 2 → 4 → 5 → 6 → 7
(the smooth scenes import only lib/camera.js, in their own commit; the engine's halves of SMOOTH and FIX3D in
stage.js, fx-stage.js, path.js and case/figures.js go with the stage fixes). Generated pages are stale between the
source commits and the pages' commit, as in every wave; assemble's asserts pass on the whole tree.

1. **The sound removed** (11): fx-sound.js (deleted), sound/render.mjs (deleted), parts/head.html, parts/a-header.html,
   css/chrome.css, css/cuts.css, css/motion.css, fx-core.js, fx-nav.js, fx-scroll.js, web/scripts/release.mjs.
2. **The smooth slides** (8): stage/scenes/lib/camera.js, gallery.js, stack.js, evidence.js, scenes/obla.js, case.js,
   stage/night/shot.js, stage/night/obla.js.
3. **The copy and 2D fixes** (25): parts/strings.mjs (also drops the toggle's strings), cases.json, c-main.case.mjs,
   c-main.404.mjs, c-main.work.html, c-main.about.html, c-main.consult.html, c-main.obla.html, c-main.index.html,
   b-hero.html (the director's: the hero's cue and instrument line gone), css/case.css, css/page-cover.css (FIX2D's
   Now and the director's cue), css/blocks.css (`.hero-instr`), css/print.css, fx-motion.js, the eight words share
   cards (og/ and og/it/: maintech-oma, badante24h, sersan-agent-os, doit-voice-ai-agent), og/og-manifest.json,
   scripts/media/og-card-jobs.mjs.
4. **The stage fixes** (12): stage/stage.js, fx-stage.js, scenes/path.js, scenes/case/figures.js (these four carry
   SMOOTH's hunks too), stage/plates/plates.js, plates.wgsl.js, stage/field/field.js, atlas.js, scenes/hero.js,
   scenes/cover/world.js, stage/boot.js, web/src/router/rv-router.js.
5. **The generated pages and fx.css** (35): the 34 pages (17 at the root, 17 in it/) and fx.css.
6. **The notes** (7): build/k-docs.md, k-fix2d.md, k-fix3d.md, k-integrate.md, k-orrery.md (ORRERY's notes only:
   its figure lives in `.shots/orrery/`, not integrated), k-smooth.md, k-sound.md.
7. **The documents** (8, the DOCS lane's, still being written at 13:58): CLAUDE.md, DESIGN.md, HANDOFF.md, PLAN.md,
   README.md, docs/redesign/rivista-story/60-as-built.md, .impeccable/design.json, stage/scenes/README.md.

Not to commit: `.shots/`, `web/release/` (both ignored). `stage/scenes/hero.js` and `web/src/router/rv-router.js` are
CRLF in the working copy; `.gitattributes` (`*.js text eol=lf`) stores them LF.

## Small fixes made here (each with Edit)

- `css/motion.css`: the phone's scene name ends before MENU only (`right: calc(var(--gut) + 5rem)`, was `+ 7.75rem`,
  which also cleared the removed sound toggle): 44 px more for the name at 390, 22 px clear of MENU's box (SOUND and
  FIX2D's note). Its comment no longer names the toggle.
- `css/cuts.css`: `.hdr-snd` out of the flown header's `:is()` (a dead selector of the removed toggle).
- `fx-scroll.js`: the stale lane tag «(lane n-sound)» out of the fx:step contract's comment (the contract stays).
- `css/print.css` (resumed run): `canvas.fx-stage { display: none !important; }` and
  `html[data-page="home"] .hero-name { color: var(--ink) !important; animation: none !important; }` in `@media print`.
- `scripts/media/og-card-jobs.mjs` (resumed run): the words cards' line `style="text-wrap:balance"`; the eight words
  cards redrawn (`og/og-{sersan-agent-os,maintech-oma,badante24h,doit-voice-ai-agent}.jpg`, the same in `og/it/`) and
  `og/og-manifest.json`.

## Proof

- Gates (07:42): `node --check` on the 30 changed scripts 0 failures; cases.json and og-manifest.json parse; assemble 0
  (169 strings), `--check` 0, claims OK (34 pages); Astro into `.shots/k-integrate/dist` 0, PARITY OK (145, 0 differ),
  asserts ok (34 pages, 1156 refs), claims on the build OK.
- Crawl (Astro, 1440 DPR 1, every page read down): 34 pages clean, the stage lit on 32 (the two 404s have none by
  design), 0 requests under /proto/rivista/ needed, 0 AudioContext.
- Walk by clicks (Astro, 25 navigations: header, gallery to case, More work, Back/Forward, the home's parts, language,
  double click, a click during a flight, reload mid-flight, deep link): every h1 visible, every flight flew (5 full loads
  where expected: the reload, the deep link, the history entries of full loads), counts flat (listeners 79 / 76 / 76 /
  76, canvases 1, Lenis 1, the home's formations 22 at start and end, heap 10.7 to 12.4 MB), Back to the home landed at
  6542 from 6517, AudioContext 0, asleep (0 submits in 3 s after 19 s), console clean, every request 200.
- Release (VERCEL_ENV=production): exit 0; `[release] https://portfolio-jet-eta-24.vercel.app · robots "index, follow"
  …`, 34 pages (32 in the sitemap), 154 files, 5.3 MB; left out 30 files; no `sound/`, no `fx-sound.js`, no
  AudioContext in any file; robots.txt `Allow: /` and names the sitemap.

## Log

- 22 Nov 14:43: servers 5405 (pid 24412), 5406 (pid 14748), 5407 (pid 21428) stopped by pid; the three ports free; no
  headless Chrome, node or python process of this lane left. (A visible Chrome on `http://127.0.0.1:5420/` — ORRERY's
  port — was opened at 14:31 by someone else; not this lane's, left alone.)
