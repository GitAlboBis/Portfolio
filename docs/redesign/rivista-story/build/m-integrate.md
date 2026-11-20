# m-integrate — wave 6 (m-), integration (20 November, from 11:52, Opus 5.5 max)

- Done: gates (node --check 21 scripts; assemble 0, --check 0, claims OK; Astro into `.shots/m-integrate/dist`:
  PARITY OK, asserts ok 980, claims OK); two small fixes (below); the walk by clicks on the Astro build (clean);
  the release run once (`VERCEL_ENV=production node web/scripts/release.mjs`: exit 0, 32 pages, 151 files, 5.1 MB).
- Next (as run 1 left it; all done since): crawl of the 32 pages (Astro, release), printed states, release nav, GPU
  once, the final look, commit split.
- **Cut at 12:33 by the 5-hour limit in item 4; continued at 15:55 (run 2).** Run 2: (a) item 4's table, done (below;
  run 2 measured lane against HEAD 16:00–16:11); (b) DOCS' three comments, done (`node --check` ok on the three);
  (c) the final set in `.shots/m-final/` (pages.png from run 1's `steps-d/`, the rest by `_scripts/look.sh`);
  (d) the final gates and the release once more. Servers of run 2: 5367 (this Astro build) stopped 16:25; 5368 (HEAD)
  stopped 16:13; no node, python or chrome process of this lane left.
- **Run 2 done (16:25).** Next: nothing of the brief; the director commits by the split below. Final gates (16:25, on
  the final tree): `node --check` on the 21 changed scripts and again on the three commented ones: ok; `assemble.mjs
  --check` exit 0; claims OK (32); Astro into `.shots/m-integrate/dist`: exit 0, PARITY OK, asserts ok (32 pages, 9
  cases, 980 references), claims OK; the release (16:17): exit 0 and its three `[release]` lines. `git status`: the same
  36 modified, 103 deleted and 11 new files as at the start of run 2 (notes and comments only added by it).
- Decisions: see "Small fixes"; nothing else changed in the site.
- How to run: Astro build `.shots/m-integrate/dist` served on 5367 (`.shots/m-integrate/dist public`); assembled pages
  on 5368 (`public`); the release `web/release` from its root on 5369. Probes in `.shots/m-integrate/_scripts/`.
- How to look: `.shots/m-integrate/` (walk-5367/sheet.jpg, printed/, release-nav/, strip/), `.shots/m-final/`.

## Small fixes (each with Edit, minimal)

- `web/scripts/release.mjs` LEFT_OUT: keeps `captures/agricultural-supply-chain-detail.svg` (TITLES' needs-elsewhere:
  fx-motion.js reads it at run time to trace the Supply Chain figure; without it the deployed figure stayed printed).
  The svg holds no script element (checked). Release now 151 files.
- `stage/field/field.wgsl.js` fsWall and fsHaze return through `stageGrainLight` (GLASS' needs-elsewhere: one 8-bit
  step of grain where there is light, 0 on a float16 canvas; the night stays black).
- Comments only (DOCS' needs-elsewhere, run 2): `stage/stage.js` header (`flyState` with `door` and `cover`, `stats()`
  with `hdr`, `aber`, `fly`, `field`, `passes`, `prepare` and `reserve` listed; the two inner flyState comments too);
  `stage/scenes/case/figures.js` header (the record on a phone too, the phone's thread, the `more` kind: More work's
  prism); `fx-motion.js` snap() comment (520 ms a column, 45 ms apart, 90 ms between years, as the code runs).

## Item 4, the GPU (stage timestamps `stats().gpuLastMs`; 1440×900 DPR 2 tier A unless said)

Run 1 (12:13–12:25, `logs/gpu.log`, `gpu.sh`): CPU **40 %** at the start of the first block (cover, Work, About: noisy),
0–3 % for the second block and the six flights, **54 %** before the 1920 block (noisy), 1–2 % for the phone.
Run 2 (16:00–, `logs/gpu2.log`, `gpu2.sh`): lane (5367) then HEAD (4000240's Astro build, `.shots/m-fly/headsrc/`, on
5368) page by page, CPU 2–10 %. Rest = the worst stop per scene, median/max of 1.4 s of frames; peak = the worst frame of
a reader's scroll by wheel with the hand moving (`gpusc.mjs`). Swarm 160,000 unless said. Limits: rest 2.6, peak 3.3;
1920 DPR 1 2.4; phone (tier B) 1.5; the swarm never halved at rest.

Run 1, the scenes not measured again in run 2 (all with the whole swarm, asleep after 19 s: 0 frames in 3 s everywhere):

| Scene (run 1) | rest | peak |
|---|---|---|
| Work: gallery / evidence / dawn | 2.13/2.23 · 1.76/2.10 · 0.77/1.27 (noisy block) | 3.28 · 2.36 · 1.73 |
| Obla / its dawn | 1.96/2.43 · 0.25/0.26 | 2.52 · 2.13 |
| Contact | 0.24/0.24 | 0.24 |
| Work at 1920 DPR 1: gallery / evidence (noisy block) | 1.70/1.79 · 1.55/1.67 | **3.07** · 2.08 |
| Phone, tier B: hero / now / index (80,000 = tier B's whole swarm) | 0.66/0.69 · 0.92/1.07 · 0.74/0.79 | 0.80 · 0.47 · 0.45 |

The flights (run 1, FLY's `gpufly2.mjs`; out / in = the worst frame leaving / arriving; swarm whole on every one),
beside FLY's run 3 (`m-fly.md`, its two rounds) and HEAD (FLY's table, same day):

| Flight | INTEGRATE | FLY run 3 | HEAD |
|---|---|---|---|
| Work→About | **3.88 / 3.73** | 3.73 / 3.48 · 3.86 / 4.18 | 5.47 / 3.72 |
| About→Work | 2.89 / **4.24** | 2.75 / 3.77 · 3.66 / 4.49 | 3.14 / 4.93 |
| Consulting→Obla | **3.48 / 3.50** | 4.06 / 3.25 | 3.72 / 3.36 |
| Index→Work | **3.72** / 2.85 | 3.54 / 2.69 · 3.65 / 3.09 | 3.83 / 4.29 |
| About→Contact | 3.16 / 2.29 | 2.73 / 2.18 | 3.17 / 2.14 |
| Contact→Work | 1.46 / **3.85** | 1.41 / 4.54 | sheet cut |
| Work→About, 1920 DPR 1 (noisy block) | **3.04 / 2.79** | 2.93 / 2.72 | 4.83 / 2.83 |
| Work→About, phone tier B | 1.00 / 1.12 | worst 1.39 | worst 2.46 |

Run 2, lane against HEAD page by page (CPU 1–29 %, quiet but for one 29 % reading before HEAD's Consulting):

| Scene | rest, lane | rest, HEAD | peak, lane | peak, HEAD |
|---|---|---|---|---|
| Cover: hero / now | 0.98/1.07 · 1.56/1.76 | 1.14/1.25 · 1.68/1.88 | 2.46 · 3.04 | 2.56 · **3.34** |
| Cover: index | 2.02/2.15, **swarm halved to 80,000** | 2.61/2.76, **halved to 80,000** | **3.62** | **3.62** |
| About: stack | **2.69/2.89, halved to 80,000** | **2.91/3.26, halved twice, 40,000** | **3.55** | **4.09** |
| About: path | 1.80/2.02 (halved) | 2.56/2.67 (40,000) | 1.87 | 3.01 |
| Consulting | 2.33/2.59 | 2.37/2.64 | 3.30 | **3.69** |
| Case (sphere-ai): the opener | **2.71/2.81** | **2.81/3.03, halved to 80,000** | **3.39** | **3.55** |
| Case: what / schematic / measured / list | 1.85/2.02 · 2.09/2.19 · 1.23/1.38 · 2.04/2.16 | 1.88/2.02 · 2.24/2.37 · 1.05/1.44 · 2.67/2.80 | 1.81 · 2.43 · 1.70 · 2.41 | 1.75 · 2.40 · 1.28 · 2.95 |
| Case: More work (the prism) / dawn | 1.67/1.83 · 0.61/0.84 | 1.06/1.92 · 0.40/0.62 (no prism at HEAD) | 2.04 · 1.19 | 1.78 · 0.87 |

(HEAD's case ran after a 97 % CPU reading: another session's job; its halving may be the load's. The lane's case ran at
3 %.) Run 1's case at 0–3 %: opener 2.76/2.86, peak 3.53, the same picture.

**Against the limits** (not chased, as the brief says): over are the swarm's halving on the cover's index and on
About's stack (HEAD too, About twice); at rest About's stack 2.69–2.76 and a case's opener 2.71–2.76 (limit 2.6); the
peaks of the cover's index 3.55–3.62, About's stack 3.55–3.76, a case's opener 3.39–3.53 (limit 3.3); five of the six
flights at 1440 (3.48–4.24; About→Contact 3.16 / 2.29 is under) and Work→About at 1920 (3.04 / 2.79, limit 2.4). Every
scene number over a limit is at or under HEAD's in the same hour (the index's peak equal, 3.62); of the flights over,
two arrivals stand within 0.15 of HEAD's numbers from FLY's hour (Work→About in 3.73 against 3.72, Consulting→Obla in
3.50 against 3.36), the rest under. Under the limits a case's chapters read a little above HEAD's halved and noisy run
(measured peak 1.70 against 1.28; More work 1.67 at rest, where HEAD had no prism). Under: every scene of Work, Obla,
Contact and Consulting at rest; the gallery at 1920 at rest (1.70); everything on the phone (worst 1.12). Against FLY's
table the flights fall within its two rounds (Consulting→Obla out 3.48 against its 4.06). Asleep everywhere.

Run 1 saw the same halvings (cover and About at 80,000) in its noisy block. Where the swarm halves: the stage halves it
when the median of 30 timed frames passes TIER_BUDGET_MS (3.5 ms, tier A) **while moving**, and a page keeps the halved
swarm to its end (the next page starts whole). On the cover it is the reader's scroll through the index with the hand
on a row (GLASS: the emblem's points flying in, the swarm's and the field's cost); on About the scroll through the
stack. HEAD halves in the same places, About twice.

## Item 5, the look (run 2, on this Astro build at 5367; `look.sh`; every sheet opened and judged)

- `m-final/pages.png`: run 1's desktop stills (`steps-d/`, 1440 DPR 2, 3 s of quiet, the site as now: only comments
  changed since), 53 steps of the cover, Work, About, Consulting, Obla, Contact; per-page sheets `steps-d/_sheet-*.png`
  and 1:1 crops of Contact's heading looked at. Text clear everywhere at rest (Contact's ink strokes above and below
  the heading, never through it); About's dates apart on every step of the path.
- `m-final/flights.png` (7 flights at 50 ms, desktop DPR 1; per-flight `strip/<tag>/sheet.jpg` looked at): gallery →
  Maintech OMA, Work → About, About → Obla, About → Contact, Contact → the cover, sersan.io → the cover, Back (Maintech
  → Work). Each flies, the room is seen through the door, the title rises; toward Contact the day comes up from the
  bottom as a straight edge (550–650 ms), then 650–800 ms are Contact's paper with only its ink strokes before "WRITE TO
  ME." rises; from Contact the door is a dark slit that widens on the paper (200–450 ms), then the cover's name through
  the glass. No rAF gap over 34 ms but one of 35 ms (Contact → cover, at 366 ms) and one presented gap of 42 ms there;
  console clean on all seven. Events: covered at 210 ms, arrived at 971–1024 ms.
- `m-final/index.png`: the prism at rest, with the hand on Work (the ray to the fan of nine), About (the line of five
  nodes), Obla (its outline); the phone (the prism small right of ABOUT, the row being read); a 1:1 crop. Clear of the
  rows; the swarm halved during this probe too (`drawn 80000, halvings 1`), the phone whole (tier B, 0.40 ms).
- The Supply Chain diagram (`diag/`): traced while drawing, at rest as printed; console clean.

## Still wrong (ranked: what Alberto would notice first; none of it small enough for this lane)

1. The swarm halves (160,000 → 80,000) during a reader's scroll on the cover's index with the hand on a row, and on
   About's stack, and stays halved to the end of that page (HEAD the same, About twice to 40,000).
2. GPU over the limits on this GPU (table above), at or under HEAD's but for two arrivals within 0.15: five of six
   flights at 1440 (3.48–4.24 against 3.3; HEAD 3.14–5.47), Work→About at 1920 (3.04 / 2.79 against 2.4; HEAD
   4.83 / 2.83); at rest About's stack 2.69–2.76 and a case's opener 2.71–2.76 against 2.6 (HEAD 2.91 / 2.81); peaks
   of the index 3.62 (HEAD 3.62), the stack 3.55 (HEAD 4.09), a case's opener 3.39 (HEAD 3.55).
3. Toward Contact, 650–800 ms after the click the frame is Contact's paper with only its faint ink strokes before the
   title rises: the day edge is right, but for 150 ms it reads close to an empty sheet.
4. The gallery's Maintech OMA plate etches «9 / roles, default-deny on every table»: the one plate on the site that
   carries a number (CLAUDE.md: no figure is a rectangle carrying a number). Wave 5's design, unchanged.
5. Nobody has heard the sound; Safari, Firefox, a real phone and a real HDR screen were never tried.
6. From the lanes, unchanged: 10 of 63 Italian scene names end in an ellipsis at 390 px (TITLES); the Supply Chain
   diagram's labels are ~3 px tall at 1440 (TITLES); the door's two lit seams run the frame's height as two bright
   lines for ~100 ms (FLY); `vercel.json` `handle: filesystem` is deprecated in Vercel's docs, still compiled (RELEASE).

## The commit split (for the director; no file in two topics; order = suggested commit order)

1. **The prism and the post** (GLASS; plates also carry FLY's door glass and lean rays): `stage/plates/plates.wgsl.js`,
   `stage/plates/plates.js`, `stage/scenes/index.js`, `stage/scenes/lib/prism.js`, `stage/gpu.js`,
   `stage/wgsl/frame.wgsl.js`, `stage/wgsl/bloom.wgsl.js`.
2. **The flight** (FLY; `stage.js` also GLASS' HDR canvas, aberration and blit skip; `field.wgsl.js` also the grain):
   `fx-nav.js`, `fx-stage.js`, `css/cuts.css`, `stage/stage.js`, `stage/scenes/gallery.js`, `stage/field/field.wgsl.js`,
   `web/src/router/rv-router.js`.
3. **The sound**: `fx-sound.js`.
4. **The cases and About** (ROOMS; `case.css` also TITLES' `.tr` layer): `stage/scenes/case/figures.js`,
   `stage/scenes/mist.js`, `stage/scenes/path.js`, `css/case.css`.
5. **The 2D** (TITLES; `fx-motion.js` also FLY's card of the cut): `fx-motion.js`, `fx-scroll.js`, `css/motion.css`,
   `css/chrome.css`, `parts/c-main.case.mjs`.
6. **The generated pages and fx.css**: `fx.css`, `case-agricultural-supply-chain.html`,
   `it/case-agricultural-supply-chain.html`.
7. **The release and the old app's removal**: `web/scripts/release.mjs`, `vercel.json`, `package.json`,
   `package-lock.json`, `.gitignore`, `README.md`, and the 103 deletions (`src/**`, `next.config.ts`, `tsconfig.json`,
   `postcss.config.mjs`, `public/bench/**`, `public/cubemap/**`; list in `.shots/m-release/deleted-files.txt`).
8. **The notes**: `docs/redesign/rivista-story/build/m-*.md` (fly, glass, sound, rooms, titles, release, integrate, docs).
9. **The documents** (DOCS, and the director's diary): `CLAUDE.md`, `DESIGN.md`, `HANDOFF.md` and whatever else DOCS
   changes (`.impeccable/design.json`, `60-as-built.md`, `stage/scenes/README.md`).
- Run 2's three comments go with their topics: `stage/stage.js` with the flight (2), `stage/scenes/case/figures.js`
  with the cases and About (4), `fx-motion.js` with the 2D (5).
- Not to commit: `_shots/`, `bash.exe.stackdump`, `.claude/launch.json` (ignored by the new `.gitignore`).
- Paths in 1–6 are under `public/proto/rivista/` unless they start with `web/`.

## Proof

- Walk by clicks (Astro, 5367, `logs/walk.log`, `walk-5367/sheet.jpg` looked at): 25 navigations, every h1 visible,
  counts flat (listeners 93 → 91 → 91 → 91, formations 11 at start and end, textures 2 → 3, heap 8.4 → 8.9 MB, one
  AudioContext), full loads 5 (as wave 5), console clean, 0 frames in 3 s after 19 s of quiet. The two "NO LINK" are
  the walk's selector for the index rows (as in wave 5).
- Console on the 32 pages (Astro, `crawl2.mjs`, `logs/crawl-astro.log`): each read to its end at 1440: 32 clean, every
  request 200, the stage lit on the 30 that have one.
- Printed states (`printed.mjs`, `printed/sheet.jpg` looked at): `?stage=0` and reduced motion on the cover, Work and the
  Supply Chain case: no canvas, no text hidden in main, every scene as flow with its pictures (the cover's two hero
  captures are not asked for in the flow, by design). A header probe (`hdrq.mjs`): with `?stage=0` the nav goes away on
  the way down and comes back at the top, as with the stage (a scrollTo-then-shoot still had caught it away).
- The first click (SOUND's `first.mjs --fresh 2` on 5367, load 3–5 %): start +3/+4 ms, arrived +975/+978, no
  AudioContext in the flight, one made at +2470/+2487 (42–45 ms) running, no long task, console clean.
- The release (item 3): `VERCEL_ENV=production node web/scripts/release.mjs` exit 0 (its asserts 892 references, claims
  OK, the self-check: every named address a file with the same capitals); 32 pages, 30 in sitemap.xml, 151 files,
  5.1 MB; robots.txt `Allow: /` + the sitemap; sitemap 30 urls with en/it/x-default alternates. Served from its root on
  5369: five navigations by clicks (`nav5.mjs`, `release-nav/sheet.jpg` looked at): cover → Work → a case → About →
  Contact → cover, each flew (fx:nav:start/covered/arrived, flight phase seen, ~500 canvas frames per 3.5 s), no full
  load, 77 requests all 200, none under /proto/rivista/, console clean. Every page of the release read to its end from
  the root (`crawl2.mjs http://127.0.0.1:5369/ web/release`, `logs/crawl-release.log`): 32 clean, every request 200,
  none under /proto/rivista/; `/404.html` and `/it/404.html` opened directly load their styles and scripts from the root
  (a relative one would have asked `/it/fx.css` and failed). `captures/agricultural-supply-chain-detail.svg` answers 200.
- The release once more on the final tree (run 2, 16:17, `logs/release2.log`): `VERCEL_ENV=production node
  web/scripts/release.mjs` exit 0, its asserts (892 references) and claims OK, the three `[release]` lines: the address
  and robots "index, follow" with robots.txt allowing all and naming the sitemap; 32 pages (30 in sitemap.xml), 151
  files, 5.1 MB; 30 files left out. The release holds the drawing and run 2's three edited files.
