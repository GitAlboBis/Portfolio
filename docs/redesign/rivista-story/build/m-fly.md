# m-fly — the flight, wave 6 (lane FLY)

Run 1 (20 Nov 02:31–03:04) was cut by the 5-hour limit. Run 2 (07:31–08:03, Fable 5.2) was cut by Fable's weekly limit;
its transcript digest is `.shots/m-fly/run2-digest.md`. Run 3 (from 08:04, Opus 5.5) continued from the code on disk and
closes the lane: the GPU (item 5), the proof of items 6 and 7, gates, these notes.

## What the flight is now (runs 1–2, all in FLY's files)

- **The page changes at 200 ms** (`fx-nav.js` `SWAP_MS`), as soon as the old text has left. The stage outlives the page:
  the router keeps drawing the room left behind while the new page's host comes up **in shadow** (`fx-stage.js`
  `shadow`, `HELD`, `stage.prepare`), with scenes loaded, formations prepared, a first frame run undrawn and the first
  screen's captures uploaded. **The takeover** is one task, at the first frame where the door hides the whole frame
  (`stage.flyState.cover`, `stage.js` `doorCover`). From then on the new room is seen through the glass (items 1, 6, 7).
- **The door** (`plates.wgsl.js`, the door branch of `shadeAt` and `channelOut`): every ray is carried on to the plane
  of the back face and leaves there flat. Nothing is mirrored, so the name is never doubled and no corridor appears.
  The pane's two tall sides are bands read on that plane (`dBx`), a little denser and cooler, with the room stretched
  outward from the seam. Each side has one straight lit seam with the faint split and a groove. The top and bottom
  walls draw nothing. `flyVeil` is 0.006 / 0.014. When the page comes late, the ink pass is held (`st.inkHeld`).
- **Toward Contact** (item 2): the ground through the door is the one under the pixel (`dCss`). The day rises as a
  straight edge (`fx-stage.js` `DAY_MS`, `dayAt`). `cuts.css` `.cut-ground` keeps the old ground until the takeover.
  The card stays light (`html:is(.cut-fly, .cut-flown) .cut.is-dawn`). Ink strokes start at 700 ms.
- **Leaving a morning view** flies too (`day` in `fx:nav:start`, `stage.fly("out", { night })`). The night's door
  opens as a straight slit that widens (`doorNow`, `doorView` open, 0.13–0.36 s).
- **The cover reached by a flight** used to die: two formations grew the targets buffer from the same old one. Now
  `ensureTargets` is a chain, plus `stage.reserve(n)`, and `fx-stage.js` reserves ahead in the shadow. One name lands,
  still by 2 s.
- **Router**: the page fetched ahead (pointerover, pointerdown, focus, touchstart) is kept and parsed at the click, with
  `leaveOld` in a task of its own before the swap. **Card**: its clearing is the card's own delayed animations.
- **First visit** (items 6, 7): the gallery's lifted captures are asked for one at a time while the eye arrives
  (`gallery.js`). Asked together, they made a 52 ms task at the door.
- **Lean flights** (`stage.js` `flyFast`, `plates.js` flags 16 and 32): leaving and arriving take no extra edge rays,
  and while leaving, only the door is looked for behind a plate. Arriving, a room is drawn by its resting rule (no
  `nearFade` forward).

## Run 3: the GPU (item 5)

Measured, then changed, then measured again (`.shots/m-fly/_scripts/passes.mjs`, `abflags.mjs`, `flyser.mjs`,
`gpufly2.mjs`). Each change keeps the picture: 1:1 crops against HEAD at 1920 DPR 1 and 1440 DPR 2 show the same
plates (`look/r3-g-cmp-d1.png`, `look/r3-g-cmp-d2.png`).

- `plates.wgsl.js` **the split where it shows**: through two parallel flat faces (in by one, out by the opposite, no
  bevel, no total reflection, not the door), the three channels leave in one direction and are less than one device px
  apart (red to blue). There the middle channel's ray colours all three. Bevels, side faces, turned rays and the door
  keep three rays (`oneRay`, `chExit`, `chTurned`).
- `plates.wgsl.js` **no extra edge rays on a plate out of focus** (`sharp < 0.8`; the prism and the door keep theirs).
  In the gallery's row they cost a quarter of the frame, and the crops show no difference.
- `plates.wgsl.js` **the near flag is computed only where extra rays can follow**: not in a lean frame (flag 16), not
  on a plate out of focus. This took 0.45 ms off the Work→About leaving peak.
- `plates.js` and `stage.js` **plates behind a door that hides the frame are packed but not drawn** (`drawFrom`,
  `f.doorCover`). They are still seen through the door's own search, and before this each of their pixels was shaded
  twice. The arrival strips (`look/j1-doors.jpg`, `look/k3-phone.jpg`) show the room whole through the glass.
- `field.wgsl.js` **the wall**: each shaft is traced once per pixel (it was traced twice), and the grain's noise runs
  only where a shaft lights the wall. The picture is the same. On Work at 1440 DPR 2 this ended the swarm's halving.

### Numbers (stage timestamps, quiet machine, CPU 1–18 %). HEAD = 4000240 built with Astro in `.shots/m-fly/headsrc/dist`, same hour

| | HEAD today | lane, run 3 |
|---|---|---|
| Gallery at rest, 1440 DPR 2 | 3.23–3.36, **swarm halved to 80,000** | **2.57–2.58, 160,000** |
| Gallery at rest, 1920 DPR 1 | 2.79–2.80 | **1.92–1.96** (limit 2.4) |
| About at rest, 1440 DPR 2 | 2.85 | 2.66 (field 0.5, swarm 1.3) |
| Work→About, 1440 DPR 2, out / in | 5.47 / 3.72 | 3.73 / 3.48 · 3.86 / 4.18 |
| About→Work | 3.14 / 4.93 | 2.75 / 3.77 · 3.66 / 4.49 |
| Index→Work | 3.83 / 4.29 | 3.54 / 2.69 · 3.65 / 3.09 |
| Consulting→Obla | 3.72 / 3.36 | 4.06 / 3.25 (3.39 / 3.40 one change earlier) |
| About→Contact | 3.17 / 2.14 | 2.73 / 2.18 |
| Contact→Work | sheet cut | 1.41 / 4.54 (3.69–3.76 one change earlier) |
| Work→About, 1920 DPR 1, out / in | 4.83 / 2.83 | 2.93 / 2.72 |
| Phone 390×844 DPR 2, worst frame | 2.46 | 1.39 |

The swarm is never halved on any route or at rest. **This machine is slower today than on 17 November**: HEAD's own
Work→About peak is 5.47 against wave 5's 3.89–3.97, and its phone flights reach 1.6–2.5 against 0.89. That is why every
comparison above is HEAD against the lane at the same hour. The **bloom pass** sometimes jumps by 0.7–0.9 ms (once by
5.5 ms) on a single frame. This happens at rest and on HEAD too: it is GPU preemption caught in the timestamps, not work
of the frame, and it is what separates the two rounds' tops.

## Run 3: proof looked at

- Strips at 50 ms: About→Work and Work→About (`look/j1-doors.jpg`): the room is seen through the glass from 450–500
  ms, with no grey frame and no blank, and the title rises. On the phone (`look/k3-phone.jpg`): both flights are whole.
  No rAF gap over 34 ms, no screencast gap over 40 ms, console clean.
- First visit, cover→Work, twice (`strip/k1-c2w`, `k2-c2w`): no gap over 34 ms (rAF) or 40 ms (presented frames),
  `fx:nav:arrived` at **976–980 ms** (budget 1200; wave 5: 1259–1306). Items 6 and 7 hold.
- Gates on the final tree: node --check on all ten files; assemble 0; --check 0; claims OK (32); Astro build 0, PARITY
  OK, asserts ok (980), claims on the build OK.
- Not loaded again in run 3: impeccable and DESIGN.md (run 3 changed only cost, and the crops are the check).

## Open (for the director)

- **Item 5 is not closed on today's GPU.** Flight peaks are 3.5–4.5 at 1440 DPR 2 (limit 3.3) and 2.9–3.05 at 1920
  (limit 2.4), each 0.3 to 1.7 ms under HEAD at the same hour. Three things cost the most:
  - Leaving Work: the 7–8 gallery plates pass the lens, about 2.7–3.1 ms of plate shading. A depth pre-pass of the
    held (opaque image) regions would stop shading plates hidden under a nearer plate's capture.
  - An arrival's last door frames (u 0.42–0.5): the door over the frame with its search, plus the swarm in front.
  - About at rest: 2.66 against 2.6. Of that, the field wall is 0.5 ms; its keep-out loop could take the minimum
    distance before one smoothstep.
- Contact's and the cover's strips were not taken again in run 3; their shader paths changed only by the optimizations
  above.

## Needs elsewhere

- For **GLASS** (after FLY on `stage/plates/**`, `stage.js`, wgsl): keep `oneRay` / `chExit` / `chTurned`, the
  `sharp < 0.8` rule for extra rays (prism excluded), `nearK`, and `drawFrom` / `doorCover`. A rebuilt prism keeps its
  own path (`shadePrism` is untouched).
- Nothing for other lanes' files.

## How to run and look

- Build: from `web/`, `node scripts/build.mjs --outDir ../.shots/m-fly/dist`. Serve from the root with
  `python scripts/serve-static.py 5361 .shots/m-fly/dist public`. HEAD's Astro build is served with
  `python scripts/serve-static.py 5371 .shots/m-fly/headsrc/dist .shots/m-fly/headsrc/public`; its `node_modules`
  junction was removed, and it is not rebuilt.
- Probes in `.shots/m-fly/_scripts/`: `strip.mjs <tag> <mode> [--m] [--first]` (frames every 50 ms, gaps, events);
  `multi.mjs` (sheets); `gpufly2.mjs` (`PORT=`, `--d1`, `--m`, `--pairs=work>about`); `passes.mjs <port> <page>
  [--d1] [--q=]` (GPU per pass at rest); `flyser.mjs` (per-frame passes through one flight); `abflags.mjs` (plate
  features switched off live); `still.mjs`.
