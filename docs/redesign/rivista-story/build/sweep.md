# Sweep lane notes (port 5192)

- Lane: SWEEP. Owns parts/*, assemble.mjs, the five fx-*.css, fx-core.js, fx-hero.js, fx-nav.js, fx-scroll.js, scripts/**,
  dead files under public/proto/rivista/ except stage/** and fx-stage.js (LOOK lane). No commits.
- State: page fixes + JS/CSS sweep written, assemble + --check green; NEXT: delete dead files, repoint scripts to
  scripts/lib/headless.mjs, gates, visual gate, network check.
- Scratch (session scratchpad): cuts.mjs (film a cut), sheet.mjs (contact sheet), crop.mjs, subprobe.mjs.

## Done so far
1. Night -> night cut: fx-nav.css §5, the night's sheet carries the night hairline (`border-block: 1px solid var(--line)`)
   on its two moving edges. Comment in fx-nav.js S5 updated (the one line allowed).
2. Gutter on night pages: fx-nav.js measureNight sets `html[data-night-known]`; fx-scroll.css §12b: once known, a
   night page's root and scrollbar follow the header (paper over the band and the footer), never under a cover.
3. Phone: the cut sheet's sub mask has 0.35em of room at its foot (padding given back by margin) — the sub was still
   ~7 px from home when the arrival uncovered and the mask cut its capitals' feet for the whole hold (measured with
   subprobe.mjs). Contents rows below 1024: the verb stands on the folio's line at the right; the name has the measure.
4. Sweep (code): compare variants V2/V3 out of fx-core.css (tokens, fallback faces, .orn-rule, switcher, .v1-3 spans),
   fx-scroll.css, fx-fonts.css (Geist, Geist Mono, Hanken, Instrument faces: 350 -> 152 lines), the `.orn-rule` span in
   b-hero.html and c-main.case.mjs; fx-core.js: intro entry, data-preloader, fx-hero-print, FX.gl slot, gl order entry,
   fx:intro:handoff sticky, setVariant/onVariant/FONTS 2-3/switcher; flags.gl now reads only html.gl-off (fx-stage.js
   reads it). fx-nav.js: measureStage/overPlate (header logic simplified), initHandoff (fx:intro:* listeners), the
   variant in the hero-rect / origin keys, [data-switcher]; fx-scroll.js onVariant hook. head.html: the variant
   setter. assemble.mjs: the case.html stub (and the literal-page branch); case.html deleted.
   Kept on purpose: `data-variant="1"` on <html> (the V1 selectors key on it), FX.scroll.rebuildText (public API),
   CSS_DROP in assemble (a guard), the WATER assert.
5. Files deleted (rm, not git rm; all in HEAD ac7e83f): see "Deleted" below. scripts/lib/headless.mjs is the one
   launcher now (launch, openPage, assertAdapter, consoleSummary, shot, decodePNG, pixelAt, writeReport; ROOT defaults
   to the checkout the file lives in, not the main tree). Repointed: capture-sites, media/og-cards, og-card-jobs
   (comment), vpp-plate, chrome-icons, sersan-scenes, rivista-motion/strip + cases-walk; longtask.mjs opens work.html.
6. Checked: tokens.mjs --static PASS (47 allowlisted, 0 hits); menu.mjs PASS through the new launcher (0/238 frames).
   Network (scratch sweep-net.mjs, scrolled to the foot): index, consulting, it/obla @390, it/index @390: 0 failures,
   0 requests to a deleted path, console 0.
   Cuts filmed after the fix (.shots/sweep/cuts/{n2n,it-m,d2n,n2d}-after.png): night->night edge now reads
   (crop n2n-02.png, n2n-16.png), the phone sub holds whole (m-after-sub.png), day->night and night->day unchanged.

## Deleted
- public/proto/rivista: fx-water.js (1416 lines), fx-gl.js (680), dev-water.html (334), dev-gl.html (257), case.html
  (18, the generated stub), water/ (76 files, 31,913 text lines + env PNG/media), fx-plate-v1/v2/v3.webp + sidecars,
  figs/ (8 fig02-*.webp + 8 sidecars).
- scripts: port-mpm-kernels.mjs (157), probes/rivista-next/fig02.mjs (247), probes/water/ (42 files, 8,510 js lines;
  launch() moved to scripts/lib/headless.mjs), env-cycles/ (studio_rig.py + rig json, 634 lines: it lit the water's
  env map), probes/_shots/water-hero/ (3 capture files of the water era).
- probes/rivista-motion: intro (196), buttons (136), cases-nav (154), idle (139), restore (417), rail (113), s4 (284),
  cases (150), blocks (303), rhythm (141), the 19 _rev_* (2,961).
## Kept on purpose
- rivista-motion: strip.mjs (the harness), effop.js, menu.mjs (mobile menu, PASS), tokens.mjs (the motion-literal gate,
  PASS), longtask.mjs (S4 cuts, now on work.html), cases-walk.mjs (the nine cases by next-work links); README rewritten.
- scripts/probes/_*.mjs, wp10-evidence.mjs, a11y-gate.mjs, check-claims.mjs, capture-bench.mjs, gen_workshop_cubemap.py,
  media/{plates,stills,vpp-plate,sersan-scenes}.mjs: the old Next app or media pipelines; not this lane's call.
- stage/glass/demos.js and glass.wgsl.js debug branch (LOOK lane's files).

## Gates (final)
- assemble.mjs + --check: exit 0 (2 editions, 9 cases, 192 strings). check-claims-proto: OK, 32 pages.
- visual-gate (port 5192, GATE_MAX_STEPS=30), every page of both editions at 1440 and 390, stage on: sweep/en CLEAN,
  sweep/it CLEAN (0 errors, 0 warnings). --reduce (cover, consulting, EN+IT): CLEAN. --nogpu (same four): CLEAN on
  the second run (the first run's browser closed before the first page loaded; nothing in the log from the site).
- Gutter checked on captures: consulting @1440 over the band/footer the right 15 px are paper, over the night night
  (.shots/sweep/gut-all.png: consulting 03, consulting 04, cover 03).
- Server 5192 stopped. State: DONE, nothing committed.

## Open / for the director
- Not touched (old Next app, a question for Alberto): src/**, next.config.ts, package.json, tsconfig.json, public/bench,
  public/cubemap, public/video, scripts/probes/_*.mjs, wp10-evidence.mjs, check-claims.mjs, capture-bench.mjs,
  gen_workshop_cubemap.py. Delete them with the app if the port to Next is dropped.
- CLAUDE.md, DESIGN.md, .impeccable/design.json, HANDOFF.md, PLAN.md still name fx-water.js, water/**, the plates,
  figs/, probes/water/lib.mjs, `python -m http.server` (DOCS lane). The launcher is now scripts/lib/headless.mjs.
- tokens.mjs still carries allowlist entries for fx-hero's INTRO / slitOpen / gl(): harmless, match nothing.
- `data-variant="1"` stays on <html> (the V1 rules key on it); dropping it means rewriting those selectors.
- The night->night edge is a 1 px #262a36 hairline: it reads on a still frame; judge it live.
- Suggested commits: (1) style: night sheet hairline, phone sub mask, contents rows, night-page gutter (fx-nav.css,
  fx-scroll.css, fx-nav.js measureNight, fx.css, generated pages); (2) refactor: compare variants, intro, plate and
  stub out of the sources (fx-core.*, fx-fonts.css, fx-hero.css, fx-nav.js, fx-scroll.*, head.html, b-hero.html,
  c-main.case.mjs, assemble.mjs, case.html); (3) chore: delete the water engine, plates, figs and their probes;
  scripts/lib/headless.mjs and the repointed scripts; rivista-motion README. Run assemble + --check after each.
