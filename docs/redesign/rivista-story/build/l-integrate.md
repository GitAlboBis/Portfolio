# l-integrate — wave 7 INTEGRATE (the home as one scroll, the neural cosmos, two new works)

- Done: 1 gates green on the lanes' tree (node --check on 31 changed scripts, assemble 0, --check 0, claims OK 34 pages;
  Astro into .shots/l-integrate/dist: PARITY OK 146 shared, asserts ok 1154 refs, claims on the build OK). Fixes F1-F3.
- Done 2 (Astro build, 5385): crawl of 34 pages with the stage on: clean (console, requests, lit; 0 under /proto/
  rivista/ n/a). Home read end to end like a reader (`homeread.mjs`): 1440 88 frames, 390 83 frames: every part's
  scene drew (max share hero 1, now .82-.84, gallery 1, evidence 1, stack 1, path 1, consult 1, obla 1, contact
  .86-.93), swarm never halved (160k / 80k B), no long task > 50 ms, console clean, asleep 0 submits, counts flat
  (formations 22, listeners 69/33 start = end; heap 10.7 -> 14 MB, textures 2 -> 37 as captures load). Walk (25
  navigations, `walk.mjs`): every h1 visible, 20 flew, 5 full loads only where a document must load (cold, reload, deep
  link, Back/Forward across a full-load entry), Back to the home lands at the y it left (6517), counts flat (listeners
  92 at 11, 18, end; formations 22; heap 12.0 -> 12.6 MB), console clean, every request 200, asleep 0. Printed states
  (`held.mjs`): ?stage=0 and reduced motion, 1440 and 390, EN and IT: 0 of 317 text blocks hidden, no error.
- Done 3 (release, `VERCEL_ENV=production node web/scripts/release.mjs`, served from its root on 5387 pid 16196):
  three [release] lines (index, follow; 34 pages, 32 in sitemap.xml with case-sersan-agent-os in both editions; 155
  files, 5.4 MB; 30 left out); robots.txt `Allow: /` + the sitemap; canonical and og:image on the origin; crawl of
  the 34 pages clean, 0 requests under /proto/rivista/; the home read end to end (88 frames, every scene drew, no long
  task, console clean, asleep); the walk of 25 navigations from the root: 20 flew, every request 200, 0 under
  /proto/rivista/, console clean, counts flat. releaseReady.
- Done 4 (GPU once, 21 Nov 05:19-05:31, CPU 1-9 %: quiet; `gpu.sh` -> gpu-r1.log; the home's part on 5385 against
  the live page of HEAD, same probe, rest median of two windows / reader's-scroll peak; the swarm never halved):

  | 1440 DPR 2 A | rest lane / HEAD | peak lane / HEAD | 1920 DPR 1 | rest | peak | phone B | rest | peak |
  |---|---|---|---|---|---|---|---|---|
  | hero | 0.80 / 1.04 | 1.26 / 1.50 | | 0.70 / 0.85 | 1.06 / 1.17 | | 0.28 / 0.30 | 0.58 / 0.49 |
  | now | 1.46 / 1.70 | 2.60 / 2.66 | | 1.63 / 1.80 | 2.23 / 2.49 | | 0.78 / 0.71 | 0.89 / 0.73 |
  | gallery | 1.70 / 1.64 | 2.27 / 2.08 | | 1.55 / 1.22 | 2.02 / 1.88 | | 0.61 / 0.57 | 0.61 / 0.58 |
  | evidence | 0.61 / 0.82 | 0.84 / 1.14 | | 0.53 / 0.68 | 0.81 / 0.98 | | 0.25 / 0.29 | 0.38 / 0.43 |
  | stack | 1.27 / 1.71 | 2.30 / 2.41 | | 0.97 / 1.31 | 1.52 / 2.40 | | 0.36 / 0.42 | 0.50 / 0.49 |
  | path | 1.11 / 1.34 | 1.54 / 1.69 | | 1.00 / 1.16 | 1.12 / 1.28 | | 0.55 / 0.58 | 1.21 / 1.30 |
  | consult | 0.54 / 0.79 | 0.63 / 0.95 | | 0.37 / 0.55 | 0.56 / 1.87 | | 0.23 / 0.28 | 0.56 / 0.58 |
  | obla | 0.29 / 0.51 | 0.72 / 1.10 | | 0.26 / 0.39 | 0.52 / 0.68 | | 0.12 / 0.15 | 0.41 / 0.40 |
  | contact | 0.16 / 0.14 | 0.16 / 0.16 | | 0.13 / 0.12 | 0.16 / 0.14 | | 0.07 / 0.07 | 0.09 / 0.07 |

  Every value under the limits (2.6 / 3.3 at 1440, 2.4 at 1920, 1.5 phone). Over HEAD: the gallery (eleven plates
  against nine: +0.06 rest / +0.19 peak at 1440, +0.33 / +0.14 at 1920), the phone's Now (+0.07 / +0.16) and hero peak
  (+0.09), Contact by 0.01-0.02. Flights at 1440 (after F4; lane / HEAD, out top, in top): index>work 1.96 / 2.25,
  1.63 / 1.78; work>about 2.52 / 2.50, 2.14 / 2.30; the swarm whole.
- Done 5 (WebKit, webkit-2336, `webkit.mjs`): the home (EN, IT), Work and the new case at 1440 and 390: gl-off, the
  printed flow complete (0 hidden of 324 / 125 / 90 blocks), one h1, no overflow, console clean, no http error. The two
  "undecoded" captures of the home are `.hero-works` images, display:none in the printed flow (the same on the live
  site, `wkimg.mjs`). Seen: the display face draws lighter in this WebKit on Windows (computed 800, the variable faces
  loaded; identical on the live site, `wkfont.mjs`): not a regression, never seen on a real Safari.
- Done 6 (the final set, `.shots/l-final/`, composed by `compose.mjs`): home.png (54 stills, 1440 DPR 2), home-phone.png
  (390 DPR 2), cosmos.png (six rooms at rest + two 1:1 crops), flights.png (home->Work, Work->About, About->home,
  case->home, Back; 50 ms), pages.png (12 stills), works.png (eleven plates, the new case EN/IT, desktop and phone).
  Looked at each: every part draws, the joins hold, the card says "HOME", no name ghost after F4, the cosmos reads as
  a web of fine threads and knots behind every room, the 404 without a stage.
- Done: after F4, gates again (assemble --check 0, claims OK; Astro build, PARITY OK, asserts ok, claims OK), the
  release rebuilt (3 [release] lines, 34 pages, 155 files) and checked again (crawl + walk: running).
- Docs corrected for F4 (DOCS had finished): DESIGN.md (the eye: the mixed look) and stage/scenes/README.md (`look`).
- Done 7: the commit split (`_scripts/split.mjs`, `split.json`): 114 files, each in one topic (content 4, the two new
  works 12, the cosmos 5, the home's structure and styles 22, the home's stage 15, the 2D/header/sound 6, the
  generated pages and fx.css 35, the notes 8, the documents 7); nothing to leave out was present.
- Verified fresh at the end: F1 (`widow.mjs`: the IT tile 01 line ends «è guadagnato» at 1440 and 1920, «che si è
  guadagnato» at 390), F2 (`lang.mjs` at About's path: after the flight EN -> IT the panes read MAG / GEN 2026), F3 (the
  flight strips' card reads HOME), F4 (`after.mjs` 1.25 ms flat; the strip clean). Gates on the final tree: node
  --check on the six edited scripts, assemble 0 (nothing to write), --check 0, claims OK 34 pages; Astro build 0,
  PARITY OK (146 shared), asserts ok (1154 refs), claims on the build OK. The rebuilt release: 3 [release] lines,
  crawl 34 pages clean, walk 25 navigations clean (20 flew, every request 200, 0 under /proto/rivista/).
- Servers 5385 (pid 22812), 5386 (30272, then the test server), 5387 (16196) stopped by pid; distA removed; no
  browser, python or node process of the lane left.
- Status: DONE. Open, for the director: the gallery's GPU over HEAD (eleven plates), the first frame of the home
  (STAGE's 387 ms against HEAD's cover 331 ms, not re-measured here), the phone path's blurred band (as on HEAD),
  WebKit's lighter display face on Windows (as on HEAD), Maintech's numbered plate (wave 5).
- Seen, not changed: on the phone, scrolling through About's path, the path's line shows mid-scroll as a soft vertical
  band of blurred blue above the text (also on the live site, same frames: `.shots/l-integrate/path-ab.jpg`).
- Decisions: the home's cut name is "Home" / "Inizio" (new string `cut.home`; "Index" stayed from the cover's index).
  A page reached by a flight keeps the depth range it was flown in with (F4, wave 6's behaviour), over STAGE's "one
  page one look": the forced default made the visible ghost and the halving.
- How to run: 5385 `python scripts/serve-static.py 5385 .shots/l-integrate/dist public` (with two roots the server
  takes pages from dist and every script, stage file and fx.css from public/: a stage edit is live without a rebuild);
  5387 `... 5387 web/release`. Probes in .shots/l-integrate/_scripts/: homeread (a reader's whole page), walk (25
  navigations; --root), fly (strips; work2about added), after (GPU and state after a flight), gpu.sh + gpuhome + gpufly,
  webkit, held, pages, home, compose, split, lang, widow.
- How to look: stills and strips in .shots/l-integrate/, the final set in .shots/l-final/.

## Fixes (each with Edit, minimal)

- F1 `css/blocks.css` `.wk-words-line`: `text-wrap: pretty` (WORKS: the IT tile 01 left «GUADAGNATO» alone, stage off).
- F2 `stage/scenes/path.js` `whens()` and `stack.js` `names()`: the module-level cache of the etched labels is read
  again once its source element left the document (MOTION: after a language flight EN home -> IT home the path's panes
  kept "MAY/JAN 2026"; the router keeps the module across pages; the stack's layer names had the same cache).
- F4 `fx-stage.js` `lookKeys`: far and near join the frame's look only once a scene of the page asks for them (the
  hero and Now do). Found by the GPU round: the flight from the home's first screen to Work cost 3.9-4.2 ms "in"
  (HEAD 1.2-1.7) and halved the swarm for ~8 s; the 50 ms strip showed the hero's name hanging in Work's room from
  600 to 1150 ms, then melting into a blue cloud over the plates until ~1.6 s (`strip/fl-home2work-live` is HEAD,
  clean). Cause, proved by swapping HEAD's host into a test build (`after.mjs`, port 5386 alone, since removed):
  STAGE's lookOf forced LOOK's far/near (-700/450) on the arriving page while the swarm still stood in the hall's
  range (-2.6 D / 4.7 D). After: +600 ms 1.25, flat, no halving (HEAD 1.22); flights index>work out 1.96 in 1.63,
  work>about 2.52 / 2.14, index>about 1.93 / 1.57; the strip clean. A page reached by a flight keeps the depth range it
  was flown in with (wave 6); a page loaded has LOOK's; the home mixes as STAGE built it.
- F3 the flight card named the home "Index"/"Indice" (STAGE): `strings.mjs` `cut.home` {Home, Inizio}; ISSUE.home.label
  and BRAND in `assemble.mjs` and `web/src/lib/site.mjs`; the 404's back button card (`S404.index`) the same;
  `cut.index` stays the 404 list's title (added to READ_BY_MODULES); `ui.index` removed (nothing read it).
