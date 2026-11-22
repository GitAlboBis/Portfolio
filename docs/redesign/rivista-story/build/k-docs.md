# k-docs — the documents on the site as built after wave 8 (k-)

- **Done:** read the lanes' notes (k-sound, k-smooth, k-fix2d, k-fix3d; k-orrery and k-integrate as they stand) and
  checked their facts in the code on disk (below). CLAUDE.md corrected (07:50–08:20): §0, §1 (world, table, flights,
  refused worlds), §2 (no sound; a slide ends without a jerk; 16 ms strips), §3, §4 (branch, file map, switches), §5,
  §6 (probes, deploy parent `37cc8e2`, the plate shader and atlas rules), §7 (the sound, the hero's cue), §8 rewritten.
  DESIGN.md from the front matter to Consulting and Obla (07:55, then the 5-hour limit cut the lane).
  **Run 2 (22 Nov, 13:57, resumed from these notes):** the code re-checked (only INTEGRATE's three small fixes changed
  since 07:40); the live site still 404 at 13:58; the director's diary of 12:56 adds that the deploy of `37cc8e2`
  exists and is green behind Vercel's login, so the domain is no longer assigned to the project (Settings → Domains).
  Run 2, 13:57–14:15: CLAUDE.md «Per il deploy» and §8's first open item (the domain, not the deployment); DESIGN.md
  from «The dawn close» to the end (the door's lines, the day's edge, the router's frame, the 404, the opener's turn,
  the list figure, the windowed diagram, the stage's start, wave 8's limits, «A slide ends without a jerk» under The
  eye, the Sound section cut to a statement, Do/Don't, the files that move together).
  .impeccable/design.json: `node .shots/k-docs/_scripts/sync.mjs` (idempotent; narrative re-synced, the sound's
  extension cut to one entry «none», the Sound toggle component and the header's toggle html/css removed, motion.slide
  added, stage start/cut/eye/plates/between-pages/switches, breakpoints, geometry.target, budget.wave-limits);
  `node .shots/m-docs/_scripts/mirror.mjs` MIRROR OK; the header's css equals HEAD's minus the toggle's rules.
  60-as-built.md: header note, rows A6 A11 A14 A18 A24 B4 B5 B6 B11, section C, the D/E «still open» cells
  closed by wave 8, the line on wave 7 online and the domain's 404, section F (F1 sound, F2 slides, F3 2D, F4 stage).
  Scenes' README.md: header, `prepare` on a cold load, `texts` bottom-sticky, `texture` remade (held,
  TEXFROM), the orbit's pivot handed over, «A slide» section (follow, glideK, softMin, softClamp, an example from
  gallery.js), the arrival's slices, the flight's door lines / edge of day / the 0.45 ms shader rule, «More» bullets.
  INTEGRATE's print.css fix (the canvas off the paper, the home's name as type) is in DESIGN.md's Print.
  README.md: ten case studies, 34 pages, eleven works, no sound, the home as one journey. PLAN.md §0:
  «Adesso (22 novembre)»: wave 8 built, the domain to put back in Vercel (Alberto), the director's steps, ORRERY, the
  open items; wave 7 as history. CLAUDE.md §6: INTEGRATE's probes. impeccable `document` (check only): the sidecar's
  format holds (schemaVersion 2, the narrative verbatim, components' refersTo as at HEAD).
- **Next:** nothing left in the brief. Proof (14:13): the stale-word scan of the owned files (only history and the
  no-sound rule name the sound), MIRROR OK, the sync idempotent, every table's cells even, §8 with no closed item left
  open; `assemble --check` exit 1 only for `fx.css is stale` after INTEGRATE's `css/print.css` edit of 14:08 (its
  assemble to run), claims OK (34 pages).
- **Decisions:** no new document. ORRERY (the Now figure) is not on the tree (overlay `.shots/orrery/www`, until the
  director's «via libera»): one line among the open items, nothing as built. INTEGRATE's open items are the director's.
  The live site's 404 (DEPLOYMENT_NOT_FOUND) goes under «Per il deploy» as a fact.
- **How to run and look:** documents only; each statement checked with grep/Read in the code on disk (INTEGRATE may
  still change it); the narrative mirror checked by the sync script's parse.
- **Needs elsewhere:** INTEGRATE: `node public/proto/rivista/assemble.mjs` after its `css/print.css` fix (fx.css stale
  at 14:13). Optional, not mine: `css/print.css` line 9 still hides `[data-stage-instr]` and `.hero-instr`, which no page
  carries any more (dead selectors); `parts/c-main.index.html` writes the name «SerSan Agent OS» in the partial (a
  proper name, the same in both editions).

## Facts checked in the code (22 Nov, 07:40–07:50)

- Sound: no `fx-sound.js`, no `sound/`, no toggle in `parts/a-header.html`, no `chrome.sound`, no `?sound`, no
  `__rvSound*`, no AudioContext anywhere in `public/proto/rivista` or `web/`; `release.mjs` LEFT_OUT has no `sound/`;
  `?fx=` modules are scroll, nav, motion, stage; `fx:part` is still emitted (fx-nav.js) and nothing listens.
  "Sound design" stays (Alberto's craft: `cap.8.sound`, strings 210-211, cases.json 602); Obla's "lines of sound"
  are a drawn figure (night/obla.js).
- INTEGRATE already fixed: motion.css phone scene name `right: calc(var(--gut) + 5rem)`, cuts.css `.hdr-snd` gone,
  fx-scroll.js lane tag gone.
- The director (21 Nov, Alberto «togli questo dalla home : Scroll / 160,000 points · 0.92 ms GPU»): `.hero-cue` and
  `[data-stage-instr]` gone from b-hero.html; no page carries `data-stage-instr` (fx-stage.js still writes into any;
  `js.instr.gpu` stays).
- SMOOTH: lib/camera.js `follow`, `softMin`, `softClamp`, `glideK`; stage.js `pivotStep` (PIV_JUMP, PIV_S), the
  plates' windows grown with presence; fx-stage.js pivots mixed by weight, `held()` / TEXFROM (16 layers, once in
  1.5 s); gallery.js one quintic per boundary (0.16 even + 0.84 glideK 0.24..0.76), `follow(S,"s",…,0.09)`, phone band
  (hysteresis 0.8, springs 0.14); stack.js the two across a boundary dissolve (glassK), one texture per layer, eight
  made ahead one a frame, phone band softClamp cushion 20 / softMin; night/shot.js `stations()` glideK 0.16..0.84;
  case.js turn one quintic at one rate; evidence.js, obla.js, night/obla.js, path.js, case/figures.js on follow.
- FIX2D: Maintech fig «Default-deny» / «on every table, permissions held in the database», caption «The security
  model» / «Nine roles, and it cannot be bypassed from the client.»; Badante24h figLine «… on PostGIS»; 404
  `ui.backHome` «Back to the home page» / «Torna alla pagina iniziale», `nf.pages` «Pages» / «Pagine», `cut.index`
  gone; `data-scene-short` (ev.short, path.short, co.short, chapters' `short`, a case opener's label), fx-motion.js
  `label()` / `fits()`; the record's name without its index; cases.json `crop` → `.cs-frame`; `.cs-stills.is-wide`
  from 1024 px; `.ob-fields` `data-stage-keepout`; Now `.now-go` with sersan.io and the SerSan Agent OS case.
- FIX3D: stage.js `doorSlab` edge from `tallK`, plates.wgsl.js `edgeOf` thousandths / `edgeLine`, seams 0.3 inside;
  stage.js `dayY` → plates.js door cut at the edge of day; fx-stage.js `dayRose`; rv-router.js after-swap one frame
  later on a flight; atlas.js `cellBytesGen` / `sliced` (4 ms); cover/world.js generator; hero.js slices; field.js and
  bloomKit scopes beside the pipelines; fx-stage.js `FIRST` {0.5, 0.5}, `whenReady` quiet path; boot.js prefetches
  tier.js; path.js phone (reveal +0.2, bokeh 5, `lh` dim within 72 px, wind 0.02); figures.js list etches nothing;
  fx-stage.js Stick B / cbT / mt / vh; `__stageHost.last.keepRects`.
- Live site: `curl -I https://portfolio-jet-eta-24.vercel.app/` → 404, `X-Vercel-Error: DEPLOYMENT_NOT_FOUND` at
  07:44 on 22 Nov (SMOOTH and FIX3D saw it from 20:06 on 21 Nov). origin/main = `37cc8e2` (wave 7's squash).
