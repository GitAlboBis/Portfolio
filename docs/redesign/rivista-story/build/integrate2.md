# INTEGRATE lane, spec 30 round — notes

- Lane: INTEGRATE 2 (port 5190). Owns the whole round now; no commits, headless only, captures under .shots/integ2/.
- State: DONE. Cross-lane requests applied, round 1 captured and judged, one fix batch, round 2 captured, gates green.
  Server 5190 stopped (the temporary 5178 one too); 5179 untouched.
- How to run and look: `python scripts/serve-static.py 5190 public`; `GATE_MAX_STEPS=30 node scripts/visual-gate.mjs
  integ2/<tag> <routes> --base=http://127.0.0.1:5190`; one-off scratch scripts in the session scratchpad: `cap2.mjs`
  (glide like a reader + `__stageHost` state; `?debug=1`), `cuts2.mjs` (the cuts), `sheet2.mjs` (contact sheets).

## Gates (final)

- `node public/proto/rivista/assemble.mjs` then `--check`: exit 0 (2 editions, 9 cases, 192 strings each language).
- `node scripts/check-claims-proto.mjs`: OK, 32 pages, numbers in scope, 16 Italian pages print the English numbers.
- visual-gate round 1, EN and IT, all 8 pages (cover, work, about, consulting, obla, contact, case-sersan-io, 404),
  1440x900 and 390x844, stage on: CLEAN, 0 errors / 0 warnings. `--reduce` and `--nogpu` (cover, work, consulting): CLEAN.
- visual-gate round 2 after the fixes (the 6 issue pages EN+IT stage on, `--reduce`, `--nogpu`): CLEAN; r3 (both
  covers after the last lens change): CLEAN.
- Cuts (desktop EN, phone IT): cover -> Work, cover -> Consulting, Consulting -> Obla ("On to Obla"), Obla -> Contact,
  rail tile -> case (S4), "Back to the index" -> Work rail at the tile: every landing right, console clean.

## Done (cross-lane requests)

1. `stage/dev.html` takes its adapter and device from `./gpu.js` (`requestAdapter`, `createDevice`): nothing under
   `stage/` imports `water/` any more. (CRLF kept: the diff is three lines.)
2. `stage/stage.js` header: the device line no longer says "the water engine's".
3. Share card (CUT's open item): `og-card-jobs.mjs` homeCard is now the printed cover (name across the card, ornament,
   role + sentence, signature; no figure, so no caption). Its CSS is its own (`COVER_CSS`) so the nine case cards keep
   their hash. `og-cards.mjs` fit reads the cover's measure from `data-fit`. Drawn on the default base (a temporary
   5178 server, stopped) so `--check` hashes match. `hero.fig` / `hero.still` removed from strings.mjs and from
   READ_BY_MODULES; `meta.home.ogAlt` rewritten EN/IT to describe the new card (the 12 issue pages' og/twitter alt).

## The fix batch (from round 1)

1. **The capital A was still a figure** (spec 30 §1): Consulting's `gen` condensed the water A from fx-plate-v1.webp and
   `cut` laid four A frames on its timeline. `stage/night/lib.js` plate() now samples the SerSan mark from the brand
   film's end card (`/captures/sersan-brand-end-1600.webp`, provenance in its sidecar), weighted by distance from the
   card's navy ground, light brightest on the white half. It ties step 1 to step 2 (Video editing, proof: Brand film).
2. **Light streaks over the dusk strip's sentences** (legibility law): `fall` put its long drips at 0.7..0.97 of the
   width, the free side of the old night block's head; the dusk strip's rows run the full measure. The long drips now
   keep to both margins (as on a phone). `stage/day/fall.js`.
3. **The row lens on In this issue was a half-pill**: caps' tops and the last letter outside it, a double image.
   `fx-stage.js`: ph = 1.32 x the line, pw = word + 0.8 ph, capped on a phone so the pill stops short of the screen
   edge; `drop.js`: the lens dome lower (sz 0.34 -> 0.26) so the magnified word stays inside.
4. **About 400 px of empty paper above "Write to me." on every page** (PAGES's open item): `.band` is no longer 16:9,
   `min-height: max(30rem, 62svh)` (phone rule unchanged). `fx-scroll.css` §8, `fx.css` regenerated.

## Final captures (one line each)

- `.shots/integ2/en/proto_rivista_index_html-desktop-00.png` the cover at 1440: the glass body over TUVERI bending R, T,
  V, E, a ring of cobalt ink round it, caption "160,000 points · 1.0 ms GPU", statement and action in the first screen.
- `.shots/integ2/cap/cover-d/toprest.png` the same at rest (awake false). `en/..index_html-mobile-00.png` the phone cover.
- `.shots/integ2/cap/cover-d/now.png` the drop in the left margin beside Now, the ring arc at Fig. 02's corner.
- `.shots/integ2/sh-r5-lens.png` (crops of `cap/r4-lens/ix0.png`, `cap/r4-lens-m/ix.png`) the row lens holding WORK
  with air, at 1440 and 390; `cap/r2-cover/ix1.png` on ABOUT.
- `.shots/integ2/cap/r2-cover/dusk.png`, `dusk2.png` the dusk strip: drips of light only in the margins, both rows clean.
- `.shots/integ2/cap/r2-cover/band.png` the shorter band, the pool beside "Write to me." under the night's foot.
- `.shots/integ2/sh-en-work-d.png` Work: rail with the lens over SphereNode / Sphere AI / Domus Tua tiles, Evidence
  ledgers legible under the mist; `r2-en/proto_rivista_work_html-desktop-09.png` the band now close after the ledgers.
- `.shots/integ2/sh-en-about-d.png` About: beads on the Capabilities and path rules bending the cap tops.
- `.shots/integ2/sh-r2-consult.png` Consulting: the SerSan mark condensing out of noise, the strip of frames with the
  playhead, the hub and six agents. `sh-en-night-d.png` Consulting and Obla (round 1; Obla's five states).
- `.shots/integ2/sh-cuts-d.png`, `sh-cuts-m.png` the cuts, desktop EN and phone IT.
- `.shots/integ2/sh-it-d.png`, `sh-r2-pages.png` the Italian pages holding the same elements (LAVORI lens, Scrivimi).
- `.shots/integ2/sh-rm-ng.png` printed states: cover with the still line, Consulting's empty ruled boxes with the still.
- `public/proto/rivista/og/og-home.jpg`, `og/it/og-home.jpg` the new cover cards.

## Still wrong, ranked by how much a reader would notice

1. **The cover's body has a flat, sliced-looking top edge** at 1440 (the key soft-box reflection on its flat crown reads
   as a cut); otherwise the best thing on the site. A GLASS look tweak (key height / crown), not done here.
2. **Night -> night cut** (Consulting -> Obla): the night sheet rises over a night page, so the passage reads only by the
   name; a hairline or the paper's tone on the sheet's top edge would show the move.
3. **Ring around Fig. 02** reads as one blue crayon arc at the plate's corner more than a turning ring.
4. **Phone**: the drop in Now's margin grazes the first letters of the copy (20 px margin); the cut sheet's sub line
   ("07 · In questo numero") is clipped at the foot mid-reveal; long Italian rows ("Consulenza" + "Leggi") sit tight.
5. **Gutter**: on full night pages the html ground is night, so a classic scrollbar's track stays night beside the
   paper band and footer (the 15 px strip in headless captures).
6. **Pill highlight**: a bright specular streak across the row lens's middle; readable, a little chrome.
7. Not judged live: lean, ripple, hover lens, focus pulls were seen on frozen headless frames only.

## Frame cost seen (GPU timestamps, moving, `__stageHost` stats)

Tier A 1440x900: cover with the body 1.04 ms; Now 0.53; In this issue 0.39..0.44; dusk 0.34..0.39; band 0.30..0.38;
Consulting gen 0.18, cut 0.13..0.42, agents 0.81..0.89; Obla 0.10..0.46. Phone 390x844 DPR 2 (tier B, 80k): cover
0.28, contents 0.25. All well inside the 3 ms budget.

## Dead code and files no page uses any more (for a sweep)

- `fx-water.js`, `fx-gl.js`, `dev-water.html`, `dev-gl.html`, `water/**` (only dev pages and `scripts/port-mpm-kernels.mjs`
  use the engine); `fx-plate-v1.webp`, `fx-plate-v2.webp`, `fx-plate-v3.webp` (+ sidecars): now unreferenced (the card
  and the night figures no longer read v1); `figs/fig02-*.webp` (+ `scripts/probes/rivista-next/fig02.mjs`).
- `assemble.mjs` WATER assert can stay (it guards against their return).
- `fx-core.js`: the intro entry path, `FX.gl` slot; `fx-nav.js`: `measureStage` / `overPlate`, `fx:intro:*` listeners.
- `stage/glass/demos.js` is bench-only (dev.html); `gl=debug:1..6` branch in `glass.wgsl.js`.
- Probes that drive S1, S3, the band water or chapters now on other pages: `scripts/probes/water/*`,
  `scripts/probes/rivista-motion/{intro,buttons,cases-nav,idle,restore,rail,s4,strip,cases,blocks}.mjs`, `_rev_*`.

## Proposed commits (in order; each keeps --check and the claims gate green)

1. `media(rivista story): the cover's share card is the printed cover` — `scripts/media/og-card-jobs.mjs`,
   `scripts/media/og-cards.mjs`, `public/proto/rivista/og/og-home.jpg`, `og/it/og-home.jpg`, `og/og-manifest.json`,
   `parts/strings.mjs`, and the 12 generated issue pages whose og/twitter alt changed (`index, work, about, consulting,
   obla, contact` .html and the same under `it/`).
2. `build(rivista story, host run 2 + integration)` — `fx-stage.js`, `stage/day/beads.js`, `stage/day/page.js`,
   `stage/day/letter.js` (deleted), `stage/day/drop.js`, `stage/day/fall.js`, `docs/.../build/host2.md`.
3. `build(rivista story, night): gen and cut draw the SerSan mark, not the A` — `stage/night/lib.js`, `gen.js`, `cut.js`.
4. `build(rivista story, bench): the bench takes its device from stage/gpu.js` — `stage/dev.html`, `stage/stage.js`.
5. `style(rivista story): the 404's contents; a shorter band` — `fx-nav.css`, `fx-scroll.css`, `fx.css`,
   `docs/.../build/pages.md`.
6. `docs(rivista story): integration notes` — `docs/.../build/integrate2.md`.
