# CUT lane — notes (round "Storia", spec 30)

- Lane: CUT (port 5187). Owns parts/*, assemble.mjs, the five fx-*.css, fx-core.js, fx-hero.js, fx-nav.js, fx-scroll.js, check-claims-proto.mjs; in fx-stage.js only how the device is obtained. Not stage/**.
- State: run 1 DONE. Gates green, looked at, server stopped.
- How to run and look: `python scripts/serve-static.py 5187 public`, `GATE_MAX_STEPS=30 node scripts/visual-gate.mjs cut/<tag> proto/rivista/index.html proto/rivista/it/index.html proto/rivista/case-sersan-io.html --base=http://127.0.0.1:5187` (+ `--reduce`, `--nogpu`). Captures: `.shots/cut/{a1,a2,b,rm,ng,c}`.

## Done

1. **Out of every page:** preloader S1 (`parts/b-preloader.html` deleted, out of assemble's parts), hero plate + posters + instrument line, the S3 stage (fx-hero.js rewritten: 690 -> 33 lines), the band's `gl-host`, Fig. 03 `#fig02` with its `pass.*` strings and `buildPasses` (fx-scroll.js), `fx-water.js` out of the head's JS list, the 404's water still. Water flags die with fx-water.js (not loaded). `?gl=0` still = gl-off. Head script: no `data-preloader`, `--hd` 0.15 s / 0.45 s, early `window.__rvGpu` kept on a plain cover load with motion (now also skipped under `?stage=0`).
2. **Cover hero** (`parts/b-hero.html`, `fx-hero.css` rewritten): the lockup set across the page (`--t-hero: max(3.1rem, min(18vw, 25svh))` desktop, `min(19.5vw, 28svh)` phone), ornament, then Fig. 01's caption, role + sentence, CTA. `.hr-screen` is a 4-row grid, min 100svh: name / open field (1fr) / caption / foot; desktop: two columns under the name (said left; caption over the action on the right edge). `figure.hr-fig` is `display: contents`; its `.hr-glass[data-stage-anchor="glass"]` spans rows 1-2 full width (the name and the field under it), empty, no border, no paint, under the type. Caption `data-stage-instr="hero"` with `.st-live` / `.st-instr` / `.st-still` (PAGE lane's switches, fx-scroll.css §12c). `data-refract="lockup"` on `.lockup`. Arrival: the CSS first-paint film (chars rise, said + caption fade up, ornament, button wipe).
3. **Now** is an ordinary chapter (`sc-sheet` removed; `--hero-cover` gone); figure and `data-stage-anchor="ring"` kept.
4. **Band** (`band()` in c-main.case.mjs): paper field + copy, `.band-box[data-stage-anchor="band"]` (desktop: right of the title, 46% -> pad, 10vh -> 12vh from the foot; phone: above the copy, 34svh). Assert 4 now counts the band box; new assert: no `data-gl-host`, `'fx-water.js'`, `hr-poster`, `data-pre`, `fx-plate-v*`, `#fig02` on a page.
5. **Strings:** `cover.fig` / `cover.fig.live`, `stage.still` (was `co.still`, now shared by Fig. 01 and Fig. 04), `foot.water` -> `foot.ink` (colophon, EN/IT per spec), removed `pre.*`, `js.pre.*`, `hero.alt.v1-3`, `hero.fig.live`, `pass.*`, `js.instr.rays|particles|dpr`. `data-refract="title"` on every home chapter head's h2 (now, work, ms, cap, path, consult, obla) and the band's h2.
6. **fx-stage.js device:** `requestDevice()` imports `water/engine/gpu.js` + `tier.js` (helpers + tier rule), uses `window.__rvGpu` once, else requests the adapter at build (already gated on fx:ready + whenStill); fallback adapter = off; `uncapturederror` -> off silently; a lost device rebuilds once (`rebuilt`), a second loss or `destroyed` -> off; teardown for good destroys the stage's own device. Tier now from `chooseTier` (was FX.gl.tier). The hero letter mapping (`letterModel`) left as is: it finds no poster and no `.hr-frame`, sets `page.a.ok = false`, plume falls back (it handles that); passes absence only drops `letter` and the passes term of mist. No break.
7. CSS cleanup: fx-core.css (dead tokens `--cue-plate`, `--guard-pre`, `--tempo`, `--z-gl`, `--z-pre*`; print rules for plate/poster/passes/gl), fx-scroll.css (§1 sheet without `--hero-cover`, §3b passes, §12d letter box), fx-nav.css (404 figure).

## Gates (final)
- `node public/proto/rivista/assemble.mjs` + `--check` exit 0; `node scripts/check-claims-proto.mjs` OK (22 pages).
- visual-gate: default EN+IT home + case-sersan-io (stage on) CLEAN; `--reduce` home + case + 404 CLEAN; `--nogpu` EN+IT home CLEAN. Console 0 errors / 0 warnings.

## Sources (spec 30 §6)
- 21st.dev `search` "editorial magazine hero large serif name lockup with figure caption" (Editorial Image Hero, Editorial Hero, Hero Recursive Type, Variable Font Proximity Hero) and Magic UI "hero text reveal" (gradient / shiny / aurora text): taken as mechanism only the editorial split (big type head, a statement and the action on a foot line); refused every image hero, gradient or shimmer text and pointer-driven type (the site's laws: one ink, nothing follows the pointer in the DOM). No paid call, nothing imported.

## Decisions
- **The printed cover has no hole:** the glass box takes no visual room (it overlays the name and the field), so without the stage the cover is name / field / caption with the still line / statement + action. The caption's second line (instrument or still) always exists: no shift when `stage-on` arrives (the 1fr field absorbs any difference).
- **Share card gap (spec 30 §1):** og-home.jpg (EN/IT) still shows the water A's still with "Fig. 01 · The letter A in water" / "Still frame captured from this engine." Its inputs `hero.fig` and `hero.still` stay in strings.mjs, read by `scripts/media/og-card-jobs.mjs` only (listed in `READ_BY_MODULES`), and `meta.home.ogAlt` still describes that card (it is true of the image). Changing them now would make assert 6 fail (stale card) or print a caption that lies about the picture. Redraw the card on the new cover (og-card-jobs.mjs `homeCard` needs a new figure: not this lane's file), then drop the two strings and rewrite ogAlt.
- 404: the type alone, no figure (spec 30: the A is no figure anywhere).
- Case pages' chapter heads have no `data-refract` yet (the stage runs on the home only); add when the stage reaches them.

## Dead code left for a later sweep
- `fx-water.js`, `fx-gl.js`, `water/**` (dev pages still use the engine), `fx-plate-v1/v2/v3.webp` (+ sidecars; v1 is the share card's picture), `figs/fig02-*.webp` (+ `scripts/probes/rivista-next/fig02.mjs`), `scripts/probes/water/w8_posters.mjs`.
- fx-core.js: the intro entry path (`entry === "intro"`, `fx-hero-print` in plainEntry, `ORDER` "gl", `FX.gl` slot).
- fx-nav.js: `measureStage` / `overPlate` (`.hr-stage[data-on]`, never present), `fx:intro:chrome` / `fx:intro:handoff` listeners, the `--hero-cover` comment in measureHero.
- fx-stage.js: `letterModel` and the poster / heroFrame measures (HOST lane), `SECTIONS`/`ORDER` entries for `passes` / `letter`; `stage/day/letter.js`.
- Probes under `scripts/probes/rivista-motion/` and `scripts/probes/water/` that drive S1/S3/the band water will fail.

## Open
- Stage `rest` draws nothing on the cover today (ink 0, no glass yet): with the stage on, Fig. 01's box is empty until the GLASS/HOST lanes land; the caption already says "drawn live" and prints the points line. Phone instrument reads "0,0 MS GPU" (measured median rounds to 0).
- `stage/stage.js` was modified by another lane during this run (not touched here).
