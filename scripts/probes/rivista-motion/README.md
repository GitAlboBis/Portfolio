# rivista-motion probes (lane P)

Probes for the motion canon, `docs/redesign/rivista-motion/10-motion-canon.md` (§6 acceptance, §8 lane P).
They drive real Chrome (`channel:"chrome"`, **headless**, WebGPU) through Playwright against the static server.
They never write product files.

## Before you run

- Serve `public/` on port 5178 (`python scripts/serve-static.py 5178 public`; never `python -m http.server`, which
  refuses parallel connections). The probes never start a server.
- Every probe is headless (Alberto, 2026-09-27: no Chrome windows on the desktop). Chrome is launched only through
  `launch()` of `scripts/lib/headless.mjs`, which forces headless; WebGPU, rAF and the CDP screencast work the same.
  `RV_HEADED=1` opens the windows only when Alberto wants to watch. For a look by hand use the built-in browser pane.
- Run from any cwd: `node scripts/probes/rivista-motion/<probe>.mjs`.
- `RV_BASE=<url>` points a probe at another copy of the prototype. The default is `http://127.0.0.1:5178/proto/rivista/`.
  To take a stable baseline while other lanes are editing, serve a snapshot of HEAD next to the live tree:

  ```bash
  mkdir -p public/_<copy> && git archive HEAD public/proto/rivista | tar -x -C public/_<copy>
  RV_BASE=http://127.0.0.1:5178/_<copy>/public/proto/rivista/ node scripts/probes/rivista-motion/menu.mjs
  rm -rf public/_<copy>         # never commit it; an RV_BASE copy under public/_* breaks the S4 route record
  ```

- Output goes to `_shots/rivista-motion/P/<probe>/`. Each probe writes a JSON report, the numbered frames with a
  `strip.json`, and a `contact.jpg` sheet for each strip. Open the contact sheet with Read and look at it.
  A verdict alone is not the gate.
- Each probe prints one line per check, `[PASS]`, `[FAIL]` or `[N/A]` followed by the id and the numbers. It exits 1
  if any check fails. `info.*` lines are diagnostics that the canon does not require.

## The harness

| File | What it is |
|---|---|
| `effop.js` | The effective opacity of an element: the product of `opacity` over it and every ancestor, and 0 under `visibility:hidden` or `display:none`. It defines `window.__effop(elOrSelector)` and `window.__effopAll(selector)` when injected (`page.addInitScript({ path })`). From Node, `createRequire(import.meta.url)("./effop.js")` gives `{ effop, effopAll, SOURCE }`. |

What `open(browser, url, o)` installs in every document of the page:

- **An event recorder.** Every `fx:*` event dispatched on `window` goes into `__probe.ev`, apart from `fx:gl:stats`. It also records `@pointerdown`, `@click`, `@keydown`, `@load` and `@pagehide` marks.
- **Long tasks.** A `PerformanceObserver` (`longtask`, buffered) writes to `__probe.lt`.
- **Refresh timing.** A setter trap on `window.ScrollTrigger` times every `ScrollTrigger.refresh()` into `__probe.rf`.
- **A per-frame sampler.** `window.__probeSampler()` runs once per rAF while armed and writes to `__probe.s`. Pass its source as `o.sampler`. Arm it with `arm(page)` or `o.arm`. It stays armed across a navigation, so an arrival is sampled from its first frame.
- **One clock.** Every record is stamped in **epoch ms** (`performance.timeOrigin + now`). The CDP frames carry the compositor swap time, `metadata.timestamp`. So both documents of a cut and the film share one clock.
- **Across navigation.** On `pagehide` each document's records are flushed to `sessionStorage`. `collect(page)` returns every document, oldest first.

`analyse(frames, {outDir, t0, region, bare, spikeK = 4})` records these for each frame:

- the mean luminance over `region`;
- `|Δ|` to the previous frame;
- a **spike** flag when `|Δ| > 4 ×` the running median of the earlier deltas (floor 0.6);
- a **bare paper** flag for each `bare` region, when at least 99.5 % of its pixels are within 10 of `--paper` #f6f3ec or `--paper-deep` #ede7dc.

The CLI films one scripted interaction:

```bash
node strip.mjs work.html --seen --wheel 900 --ms 2500 --tag rail-wheel
node strip.mjs case-spherenode.html --seen --click "a.ghost[data-back]" --ms 2500 --bare 0,0,1440,900 --tag back
node strip.mjs index.html --vp 390x844 --seen --click "[data-menu-btn]" --ms 1200 --tag menu
```

## The P0 checks

| Probe | Canon item | What it asserts |
|---|---|---|
| `menu.mjs` | MC-06 | 390×844 @2x, touch. **MC-06.open**: no frame shows menu type (effective opacity of `.nv-menu_in` > 0.01) while any column is < 100 % down. **MC-06.words**: the words start 0–1 frame after the columns first cover the page. `info.close` runs the same test on the close. |
| `longtask.mjs [--cpu 4]` | MC-31 | On work.html (the rail lives there since the issue became pages): two rounds of forward and back cuts. There is no long task (> 50 ms) between the click and the landing, which is the last frame the overlay is visible. It lists each long task with the `fx:*` events and `ScrollTrigger.refresh` calls inside it. Use `--cpu 4` for the Lighthouse-mobile CPU factor; the M8b traces that motivated MC-31 were throttled. |

## The P1 checks

| Probe | Canon item | What it asserts |
|---|---|---|
| `tokens.mjs [--static] [--json]` | MC-09b (gate), MC-09a (twins) | **Static**: greps `fx-{core,hero,scroll,nav}.{js,css}` (comments blanked, line numbers kept) for literal motion values: JS named eases (`power*`, `expo.*`, other GSAP families), `duration/delay/stagger/each/repeatDelay: <number>`, token fallbacks (`D.reveal \|\| 0.9`), a tween's literal position parameter or `"+=0.2"`, `delayedCall(<n>)`, times or `cubic-bezier(` inside JS strings; CSS non-zero times and `cubic-bezier(`. Allowlisted (listed in the JSON with the reason): the token definitions (`--d-*`, `--st-*`, `--ease-*`, `--tempo`), the reduced-motion kill switch, fx-core's token module and CustomEase lines, fx-hero's `INTRO` block, tweens whose target is `gl().clip`/`gl().params`/a variable bound to one, and dur literals inside a scrubbed tween or timeline. Any other hit fails its file. **Runtime**: `FX.motion` D/S/bezier equal the §3 table; `rv.out`, `dtIn`, `domus`, `domus.inOut` are registered. `RV_DIR=<dir>` greps another copy. |

## Also here

- `cases-walk.mjs` walks the nine cases by their next-work links, 01 -> 09 -> 01 twice (18 S5 cuts): no GPU device
  lost, seam stalls at or below R5's rate. Output in `_shots/rivista-next/cases/walk/`.

## Retired (rivista-story sweep, 2026-11-10)

intro, buttons, s4, rail, cases, cases-nav, blocks, idle, restore, rhythm and the `_rev_*` reviews drove the water
intro (S1), the S3 stage, the band's water or chapters that left the long home for their own pages; they were deleted
with the water engine. `git show ac7e83f:scripts/probes/rivista-motion/<file>` brings one back to rewrite.
