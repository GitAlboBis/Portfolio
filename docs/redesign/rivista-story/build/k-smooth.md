# k-smooth — the jerk at the end of each slide (wave 8, lane SMOOTH)

- **Done:** all of the brief. Cause (below, 1–7) fixed in lib/camera.js (`follow`, `glideK`, `softMin`,
  `softClamp`), gallery.js, stack.js, path.js, stage.js (`pivotStep`; the plates' windows weighed by presence) and
  fx-stage.js (the pivot blended by weight; textures made again by the scene on screen). Proven (below, "The proof").
- **Next:** nothing of the brief is left (the second continuation closed "Not done", below); the director commits
  (cut at 12:38, resumed 16:53, cut ~18:00, resumed 19:55, closed 20:40).
  **Resumed again 21 Nov evening (continuation run)** for the "Not done" items only: the lags of evidence, the cases,
  Obla (and `stations`, night/shot.js, the glide of Consulting, Obla and the path) on springs, their recordings, the
  home's slides and path.js's phone springs recorded, GPU on the phone (tier B) and at 1920.
  **Cut again at ~18:00 and resumed 19:55** (server on 5402 again, pid 6784): the code of the springs is on disk
  (case.js, case/figures.js, evidence.js, obla.js, path.js, night/shot.js); `cont.sh`'s recordings (17:50–17:57) were
  made before rec.mjs recorded the drawn pivot (`spiv`), so their desktop eye numbers where a pivot jumps are the
  scene's raw pivot, not the frame: re-recorded with `spiv`. Phone: the case opener's plate stops dead at the end of
  its turn (caseo-m 1283 px/s in one frame at 375 ms; live 629): checking the u rate (`S.uR`) on a phone.
  - **20:00 found and fixed (case.js):** on a phone the opener's turn (`e`, a smoothstep of u) ended in 50 ms at
    1000 px/s of scroll (`rec/cro-m`: 1043 → 600 → 255 → 0 px/s, the plate standing still while the page still ran),
    and counted at step 1's rate (uR 1.75 in scene mode) it ended 180 px sooner than HEAD. Now one quintic
    (`glideK`) over HEAD's own span (0.72 / 0.55 of step 1 to 0.28 / 0.2 of step 2, each in its own length) at one
    rate: `rec/cro-m2` 1290 → 1196 → 1087 → 967 → 763 → 577 → 447 → 324 px/s over 120 ms, ending with the scroll.
  - Also on springs now: path.js the panes' step back (`h<j>`), night/obla.js the character's state weights, body
    parameters, colour and look (`approach` → `follow`; a weight a hair past 0/1 is read through its share `tot`).
  - **Headless Chrome now runs rAF at 7 ms** (it ran at 17.5 ms at 17:50): recordings of 17:50 and of now are not
    comparable; an.mjs now times frames by the stage's own dt (the hook's `performance.now()` stamped two frames 1 ms
    apart: one-frame spikes of 12 000 px/s out of nothing) and `--tail` keeps only the ends of the slides.
  - **The live site is down:** https://portfolio-jet-eta-24.vercel.app answers 404 `DEPLOYMENT_NOT_FOUND` on every
    address since ~20:06 (live-caseo-d2 at 20:05 was the last that loaded). HEAD is served from its own tree instead:
    `git archive HEAD public` into `.shots/k-smooth/head`, `python scripts/serve-static.py 5403 .shots/k-smooth/head/public`.
- **Decisions:** every value a slide drives rides a critically damped spring (`follow`: continuous speed, lands exactly,
  no overshoot on a still target), never a first-order lag; the gallery's glide is one quintic per boundary; the
  orbit's pivot is the apex itself (and any pivot that jumps is handed over, stage.js); on a phone the gallery's
  apex and the stack keep to the free band they stand in (hysteresis 0.8, a text pushes them with a cushion of
  20 px, the glass steps back while it lies over a text); the stack's layers dissolve into each other, one etched
  texture per layer, all eight made ahead.
- **How to run:** `python scripts/serve-static.py 5402 public` (assembled pages; scripts live), then from
  `.shots/k-smooth/_scripts/`: `node rec.mjs <tag> work.html --from=gallery+1.3 --n=5` (desktop wheel notches, the
  pointer at 980,470) or `--m --pat=jsfling` (a phone's fling), `node an.mjs <tag>` (graph `rec/<tag>.png`, the worst
  frame-to-frame velocity steps); `node strip.mjs <tag> about.html --from=stack+1.3 --save=52-83` (every compositor
  frame, kymographs, a 16 ms strip); `node evict.mjs index.html gallery` (texture layers held after a round trip).
- **How to look:** `rec/*.png` (graphs), `strip/<tag>/frames-*.png` and `kymo-*.png`.

## The cause, with numbers (21 Nov, HEAD 551f252, assembled pages on 5402, headless Chrome)

Recorded per stage frame: the scroll, the gallery's `s`/target, the camera each scene asks for (pos, target, lens,
pivot) and the stage's damped orbit, every plate's world box projected with that camera (`an.mjs`), rAF and LoAF.
No long animation frame and no rAF gap over 24 ms in any run: the jerk is not a dropped frame. It is five things.

1. **Gallery, the apex hand-over (desktop and phone).** The orbit's pivot and the focus distance were the plate with
   `near > 0.5`: when `s` crosses n + 0.5 they jump from the leaving plate (u = −0.5: 445 px in front of the page, far
   right, already faded) to the arriving one (u = +0.5: 344 px behind). With the pointer at 980,470 (orbit ≈ 0.065 rad)
   the eye jumped 49 px in one frame (`rec/w-notch-z2.png`: a 2946 px/s spike one frame wide at 3.0 s) and every plate
   jumped 40–45 px (2731 px/s); the focus snapped (the arriving plate's focus factor 0.43 → 1 in one frame). Phone
   (no orbit): the focus snap only.
2. **Gallery, a hesitation mid-glide.** `hold()` was two mirrored smoothsteps meeting at the boundary, so the glide's
   speed fell back to the base slope (0.16) exactly where the plates trade places: ds/dt 0.64 → 0.45 → 0.64 plates/s
   inside one gesture (`rec/w-notch-z2.png`, 2.88 s).
3. **Gallery, phone: the band.** The apex band was measured again every frame while `local` ∈ (0.3, 0.7) (following
   the scrolling text) and frozen outside: the plate's clamp limits jumped as that window opened and closed: +46 px in
   one frame at local 0.303, +31 at 0.303, −22 at 0.697, +27 at 0.303 (`rec/w-jf.json`, an.mjs top list).
4. **Stack: the etched name.** The name swapped texture (bright ↔ faint) on the frame `on` crossed 0.5, and the first
   time a texture was asked the layer drew one frame with no name at all: `strip/a2/frames-52-83.png` frame 68 is
   blank glass between "CORE" (67) and "FRONT-END" (69). The brightest thing in the frame popped.
5. **Stack, phone: first-order lags on targets that jump.** The band fit (cy0, sc0, fade) jumps when a text starts or
   stops crossing; a first-order lag answers a jump at full speed at once: 0 → 1363 px/s in one frame at 4.7 s, 1257
   at 9.4 s, 1056 at 14.1 s, then a sawtooth decay (`rec/a-jf.png`).

6. **Stack (and every page with plates): a plate's window came in whole.** The swarm is drawn in two passes split by
   the plates' screen rectangles (draw.wgsl.js ZWin): a point in front of ANY plate covering it is drawn over the
   plates. The stack's next layer came in as glass at alpha 0.013 with its whole rectangle, and the points of the sheet
   of light between it and the layer in step left that layer's glass in one frame: `strip/a6`–`a8`, frame 82 (855 ms):
   a frame change of 3.9 against 1.8–2.0 (`strip/a8/dd.png`: the streaks inside "CORE" and the letters change at once;
   the live site has the same flash, `strip/live-a`, 2.63 against 0.79). It came again at the slide's end as the
   leaving layer went. Fix (stage.js, the windows): a plate's rectangle grows from its centre with its presence (whole
   from alpha 0.5): `strip/a9`, no frame above its neighbours (max 2.29).

7. **Phone, the band refit after the slide.** With the first fix (springs on the old band logic) the phone stack still
   moved a second time half a second after the slide (`rec/a-jf-B.png`: 53 px, the band's middle taken the moment
   the arriving text touched it), and a band fitted to where the step's text stands at local 0.5 (tried) left the
   plate under the text when the reader stopped at local 0.58–0.85 (the gallery's plate at alpha 0.08 at rest,
   `rec/w-jf-B`). Now the band follows the text with hysteresis and a cushion: `rec/a-jf-F` (max step 116 px/s, at a
   slide's start, against 1406 at HEAD), `rec/w-jf-C` (163, a band change mid-slide, against 2448); at rest the
   plate in step is whole (`w2:1.00@692`, `l1 1.0`).

Found on the way (same family, fixed in this lane):
- **Host: the pivot of the lead scene.** `freeBlend` took the orbit's pivot from the heaviest scene: where two scenes
  trade the frame (gallery → evidence, stack → path, the home's parts) the pivot jumps as in 1. A case's chapters
  (mist.js) hand their pivot from figure to figure and to none (the camera's target) the same way.
- **Home: texture layers evicted, never asked again** (fixed: fx-stage.js `held`, revived by the scene on screen, each
  at most once in 1.5 s, etches from their words; `evict-back-after.png` shows SphereNode's capture again). The plates hold 16 texture layers (LRU). In the home the
  stack's 16 etched names evict the gallery's captures; the host kept them as "ready", so back in the gallery every
  plate was empty glass (`evict.mjs index.html gallery`: w1, w2, now, spherenode, sphere-ai, sersan-io, domus-tua,
  sersan-brand, the supply chain and three etched works GONE; `.shots/k-smooth/evict-back.png`).

Not the cause: Lenis (lerp 0.1 = a first-order lag of 0.167 s, its end is an exponential: smooth), the room's subject
light (already followed with weight, 0.35 s), the plates' module (no damping of its own), frame drops (none).

## The proof (21 Nov, 17:00–17:35, this machine; CPU 25–48 %)

- **Recordings** (`rec/`, `node an.mjs <tag>`: the worst frame-to-frame step of a plate's screen speed): desktop
  gallery `w-notch-C` 106 px/s at 1326 px/s (the glide's own acceleration; HEAD `w-notch` 2362, the apex jump);
  desktop stack `a-notch-C` 42 at 258 (a slide's start); phone gallery `w-jf-C` 163 (a band change mid-slide, the
  spring starting; HEAD 2448); phone stack `a-jf-F` 116 at a slide's start (HEAD 1406). At the end of every slide
  the speed comes down as one smooth curve (`rec/w-notch-B.png`, `rec/a-jf-F.png`); no rAF gap over 24 ms, no LoAF.
- **Strips at 16 ms** (`strip/<tag>/frames-*.png`, kymographs `kymo-col.png`): `wd` (Work, 1440), `ad` (About, 1440:
  CORE dissolves into FRONT-END, no blank frame), `am` and `wm` (390, the whole screen: the plates settle with the page;
  the frame changes that stand out in the phone's tail are the page's own 1 px scroll steps, the text moving);
  `a9` the window flash gone. The home: `evict-back-after.png` (back in the gallery after the whole page: captures in).
- **Gates:** assemble `--check` 0; claims OK; Astro build in `.shots/k-smooth/dist`: PARITY OK, asserts ok, claims OK.
  The Astro build flies Work → About (`fly1.mjs`, `fly-about.png`): stage on, the stack's eight names held, no error.
- **GPU** (`_scripts/gpu.sh`, l-integrate's `gpuhome.mjs`, 1440×900 DPR 2 tier A, two rounds, this build on 5402
  against the live site in the same minutes; ms, rest median/max, peak):

  | scene | this lane | live (HEAD) |
  |---|---|---|
  | Work gallery | rest 1.72–1.73 / 1.78–1.84, peak 2.17–2.18 | rest 1.67–1.68 / 1.74–1.89, peak 2.31–2.32 |
  | Work evidence | 0.60 / 0.65–0.66, peak 0.84–0.86 | 0.60 / 0.64–0.69, peak 0.87–1.43 |
  | About stack | 1.43–1.44 / 1.62–1.74, peak 2.62 (p95 1.79) and 2.09 | 1.44 / 1.68–1.72, peak 2.08 and 1.94 (p95 1.80) |
  | About path | 1.14 / 1.29–1.32, peak 1.45–1.47 | 1.12–1.13 / 1.27–1.29, peak 1.46–1.47 |

  The swarm never halved (160 000 drawn). The stage sleeps: 0 frames in 3 s after 19 s of quiet (About).

## The second continuation (21 Nov, 19:55–20:40): what "Not done" held, done

- **On springs** (`follow`, lib/camera.js): case.js `kx`, `dx`, `hide`; case/figures.js `av`, `hide`, `mY`, `hy`, `mk`,
  `grow`; evidence.js `dock`, `grow0/1`; obla.js the band (`gy`, `gh`; the hop stays a hop: weight 0, moved unseen,
  back at rest); path.js the phone's `fy`, `fit`, `clear` and the panes' step back `h<j>`; night/obla.js the character's
  state weights, body parameters, colour and look. `stations()` (night/shot.js: Consulting, Obla, the path) is a quintic.
- **The case opener's turn** (case.js `e`): one quintic over HEAD's own span at one rate (the rate step at the step
  boundary gone: desktop HEAD 1980 px/s in one frame mid-turn, now 468, and that only in the arrival's fade at a 0.31).
- **Recordings, mine against HEAD in the same minutes** (`cont2.sh`, `cont3.sh`; `./cmp.sh <tags>`: the worst step of a
  plate's screen speed, px/s @ the speed after it, over the whole run and over the ends of the slides only):

  | scene | mine: all / ends | HEAD: all / ends |
  |---|---|---|
  | case opener, desktop | 468 (fade-in) / 190 | 1980 (mid-turn) / 167 |
  | case opener, phone | 1342 (a fling's start) / 438 (leaving, a 0.31) | 957 (a fling's start) / 342 |
  | home gallery, desktop · phone | 77 / 77 · 169 / 150 | 3754 / 29 · 4062 / 1574 |
  | home stack, desktop · phone | 20 / 20 · 35 / 13 | 23 / 23 · 1415 / 1415 |
  | path, phone (panes) | 207 / 23 | 1389 / 15 |

  The eye at the ends of the slides (world px/s): Consulting desktop 324 vs HEAD 311, phone 134 vs 134; Obla desktop
  103 vs 103, phone 47 vs 48; evidence 7.7 vs 8.7; a case's measured chapter 14 vs 18 (all run 28 vs 43: the pivot
  handed over). What is left at the ends is the scroll's own grain, the same on HEAD: at 7 ms frames Lenis moves the page
  0, 1 or 2 whole px a frame and a fling's tail creeps by lone px (`eyev.mjs consult-d3 2780 2960`: the eye 645 ↔ 324
  px/s with the page's 2 ↔ 1 px). Frames over 24 ms only in the first 800 ms of a run (the first gesture after the
  jump to the start), on both builds: mine 35–70 ms gaps in 4 of 13 runs and a LoAF of 53 / 70 ms in 2 (no script in
  it: rendering); HEAD 28–84 ms gaps and LoAFs of 50–85 ms in its GSAP ticker. None later, in any slide.
- **Looks:** `strip/opener-phone-kymo.png` (mine and HEAD: the plate's rows bend into their place in one smooth curve
  at the end of the turn), `strip/ob-sheet-s.png` (Obla on its springs: the character whole, its blink, the cosmos
  behind); `strip/cl` (a case's list) and `strip/hob` for the record.
- **GPU** (`gpu2.sh`, l-integrate's `gpuhome.mjs`, two rounds, mine on 5402 against HEAD's tree on 5403; CPU 0–3 % in
  round 1, up to 51 % at the end of round 2; ms, rest median/max, peak):

  | scene | phone 390 DPR 2, tier B: mine | HEAD | 1920 DPR 1: mine | HEAD |
  |---|---|---|---|---|
  | Work gallery | 0.63 / 0.67–0.69, 0.66–0.67 | 0.63 / 0.67–0.70, 0.65–0.67 | 1.34–1.35 / 1.39–1.44, 1.80–1.88 | 1.30–1.32 / 1.38–1.39, 2.09–2.19 |
  | Work evidence | 0.25 / 0.29–0.30, 0.39–0.40 | 0.25 / 0.29–0.31, 0.39 | 0.52–0.55 / 0.58–0.65, 0.82–0.83 | 0.52–0.55 / 0.57–0.62, 0.81 |
  | About stack | 0.38 / 0.42–0.43, 0.49 | 0.38 / 0.42–0.44, 0.50–0.51 | 1.13–1.15 / 1.19–1.31, 1.38–1.39 | 1.14–1.15 / 1.20–1.22, 1.48–1.56 |
  | About path | 0.56–0.57 / 0.61–0.64, 1.26–1.29 | 0.56–0.57 / 0.60–0.66, 1.32–1.33 | 1.01–1.02 / 1.05–1.21, 1.14–1.16 | 1.01–1.02 / 1.06–1.18, 1.19 |

  Under every limit (1.5 ms on the phone, 2.4 at 1920); the swarm never halved (80 000 drawn on the phone, 160 000 at
  1920); the stage sleeps (0 frames in 3 s after 19 s of quiet, About, both sizes). The gallery at rest is 0.02–0.04 ms
  over HEAD at 1920 (as at 1440: 1.72 against 1.67), its peak 0.2–0.3 ms under.
- **Gates** (20:09): assemble `--check` 0, claims OK; the Astro build in `.shots/k-smooth/dist`: PARITY OK, asserts ok,
  claims OK.
- **For the director:** the live site answered 404 `DEPLOYMENT_NOT_FOUND` on every address from ~20:06 (see above);
  HEAD's numbers here are its own tree served locally.
