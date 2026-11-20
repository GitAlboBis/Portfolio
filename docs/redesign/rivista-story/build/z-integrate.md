# INTEGRATE lane (wave 3) — notes · DONE (two rounds, the ceiling)

- State: every lane's work looked at as a reader walks it; one fix batch applied, the fixed frames captured again.
  Gates green. Server 5207 stopped; 5179 untouched. Nothing committed.
- How to run and look: `python scripts/serve-static.py 5207 public`; scratchpad scripts `zi-cap.mjs <tag> <route> d|m
  auto|targets` (wheel scroll to each step, 2 s still, screenshot, GPU stats, console) and `zi-cuts.mjs <tag> [m]`;
  contact sheets with `sheet3.mjs` (sharp). Captures in `.shots/z-integrate/`, printed states in
  `.shots/z-integrate-r/` (reduce) and `.shots/z-integrate-n/` (no WebGPU).

## Gates (last run, after every change)
- `node public/proto/rivista/assemble.mjs`: structural asserts ok (2 editions, 9 cases, 6 on a capture, 161 strings).
- `--check`: exit 0 (the 20 share cards recorded with their new hashes).
- `node scripts/check-claims-proto.mjs`: OK, 32 pages, 16 Italian pages print their English pages' numbers.
- visual-gate `--reduce` and `--nogpu` on cover, Work, Consulting (desktop + phone): CLEAN, 0 errors, 0 warnings.
- Every stage capture (8 EN pages × 2 sizes, IT cover/Work/Contact, the cuts): console clean, no GPU errors.

## Fix batch 1 (what I changed)
1. `css/tokens.css`: `--z-stage: 40`. The canvas read `var(--z-stage, 50)`, a token nobody defined, so it sat at 50,
   over the phone menu (45): the hero plate and its bent "ERT/ERI" drew on top of the open menu. Now canvas 40 < menu
   45 < header 50 < cut sheet 90. (Seen: `.shots/z-integrate/cuts/m-A-cover-to-work-menu.png`; fixed:
   `cuts2/menus.png`.)
2. `css/dawn.css`: `.dawn-in { margin-block: auto }`: the close's words sit in the middle of the morning. The last
   frame of every page had the address at the top over ~60 % empty white.
3. `fx-stage.js`: a second ResizeObserver on `.sc-track` and `[data-dawn]` re-measures marks when a scene's track
   changes height (WORK lane's request).
4. `stage/scenes/gallery.js`: the last plate fades in the second half of its step (phone: it lingered as a dim empty
   box over "Measured before and after.").
5. Share cards redrawn in the night studio (`scripts/media/og-card-jobs.mjs`, `og-cards.mjs`): night ground, Sofia
   Sans, no ring, no ornament, no "Fig." folio; key words in the display face for the three cases without a capture.
   They were the cream Cormorant magazine: the first thing a LinkedIn reader would have seen. ogHash no longer hashes
   the server URL. 20 cards redrawn, manifest rewritten, provenance embedded (impeccable embed-prompt). Alt strings
   `meta.home.ogAlt`, `meta.case.ogAlt`, `meta.case.ogPlate` rewritten in both languages; `hero.orn` (the old
   ornament, read only by the card) deleted with its READ_BY_MODULES entry.
6. Favicon set redrawn: `scripts/media/icon-glyph.py` writes "AT" in Sofia Sans Extra Condensed 800, warm white on
   night (was the cobalt Cormorant A on paper); `chrome-icons.mjs` renders it on night; `site.webmanifest`
   background/theme `#0c0e14`.
7. Dead files deleted: `stage/day/arcs.js` (no scene imports it), `scripts/media/og-ring.svg` (only the old cards).

Cross-lane requests found already done: `js.stage.points` / `js.instr.gpu` exist (the instrument line prints
"160,000 points · 0.66 ms GPU"); `stage/dev.html` resolves formations from its own DEMO table first.

## Final captures (looked at)
- `r1-cover/d-00-top.png` — first viewport: the name on one line, the plate at 18° over ERI with the spectral fringe,
  the beam behind it, button and links right, instrument line. The best type frame of the site.
- `r1-cover/sheet-a.png` — travel (plate soft mid-way), index with no cue, and the Work fan, About line with five
  ticks, Consulting hub, emblems on hover.
- `r1-cover/d-01-step_0.png` — Now: sersan.io inside the glass with its frame of light.
- `r1-work/sheet.png` — Work at 1440: nine plates in a row, each step's plate near and sharp, etched plates (9 /
  SUB-SECOND / HANDS-FREE), the evidence bars on their rows, the dawn close.
- `r1-about/sheet.png` — the stack of eight etched layers (each step slides one out), the path's five etched panes.
- `r1-consulting/sheet.png`, `r1-obla/sheet.png` — the night figures unboxed, text in its column, dawn closes.
- `r1-contact/sheet.png` — WRITE TO ME. across the measure, ink threads above and below, no glass.
- `r1-case-sersan-io/sheet.png`, `r1-404/sheet.png` — the case template and 404 in the new system.
- `r1-*/msheet.png` (index, work, about, consulting, obla, contact) — the phone at 390×844 DPR 2.
- `it-sheet.png` — Italian cover, index cues, Work steps, evidence, Contact (SCRIVIMI.).
- `sheet-reduce-cover-work.png` — reduced motion: whole pages in plain flow with the real captures.
- `cuts/sheet-d.png`, `cuts/sheet-m.png` — cover→Work, Work→case, cover→Contact (the dawn sheet), during and after.
- `cuts2/menus.png` — phone menu after the z-index fix; the dawn sheet rising on the phone.
- `r2-work/msheet.png` — phone Supply Chain → evidence head: no ghost plate after the fix.
- `r2-cover/sheet.png` — the dawn close at the end of the cover and of a case, words now in the middle.
- `og-sheet.png`, `og/og-home.jpg` (in the tree) — the new share cards; `icons.png` — the new favicon.

## Still wrong, by what a visitor notices first
1. The cover's beam is quiet: the upper half of the first viewport is mostly dark with one faint streak. The frame
   holds on the type and the plate, but Work's gallery frames are richer in light. A brighter or nearer beam
   (hero.js, COVER) is the first thing to try if Alberto finds the cover too still.
2. Consulting's agents (step 4 and the close) and the cover's Consulting emblem draw their out-of-focus nodes as soft
   round blue discs; Obla's idle state has a grainy round halo. They are the kept figures, as built; they read as
   bokeh and graph nodes, not water, but they are the closest thing on the site to "a bead".
3. Consulting's intro (gen's noise frame) is a square of static with slightly wavering edges.
4. The Now plate's frame of light is a dotted, slightly sparkly line rather than a clean edge.
5. Evidence bars are drawn by particles: a little grainy at rest, strays for about a second as they settle (phone).
6. The header stays `--night-2` over the dawn ground: a dark bar over the white at the end of every page.
7. The legal line ("The light and the glass are drawn live…") also prints on Contact, which has no glass.
8. The Supply Chain capture is a cream redraw of the class diagram (`vpp-plate.mjs`, "in the rivista's style"): it is
   the work's real diagram, but it is the one cream picture on the night pages.
9. Phone stack layers show dotted far edges at DPR 2 (CORE's thin-layer aliasing).

## Frame cost seen (GPU timestamp, tier A desktop, tier B phone, during the walks)
Max per page at 1440: cover 1.19 ms, About 1.22, Consulting 1.10, IT index 1.05, Work 0.91, case 0.66, Obla 0.48,
Contact 0.12. Phone: 0.28–0.54 ms. Everything under the 3 ms budget.

## Dead code and dead files now
- `public/proto/rivista/fx-fonts.css` (Cormorant/Figtree): no page loads it; only `scripts/media/vpp-plate.mjs` (the
  Supply Chain diagram redraw) reads it. Keep with that tool or retire both.
- `scripts/probes/rivista-motion/*` read the deleted fx-*.css: historic.
- `stage/scenes/bench.html` and `stage/dev.html`: dev benches, not shipped pages (keep, or exclude from a deploy).
- `.claude/launch.json` and `_shots/`: local, untracked, never commit.

## Proposed commits for the director (in order; media before the build that --check reads)
1. `feat(rivista stage): plates of glass, one camera and dawn rectangles replace the liquid bodies` —
   `stage/plates/*`, `stage/stage.js`, `stage/wgsl/frame.wgsl.js`, `stage/wgsl/draw.wgsl.js`,
   `stage/glass/backdrop.js`, `stage/dev.html`; deleted `stage/glass/{glass,glass.wgsl,demos}.js`; `build/z-core.md`.
2. `feat(rivista host): scene loader and the night, dawn, contact and mist scenes` — `fx-stage.js`,
   `stage/scenes/{README.md,bench.html,lib/raster.js,consult.js,obla.js,dawn.js,mist.js}`, `stage/day/threads.js`,
   `stage/night/mist.js`; deleted `stage/day/{beads,current,dawn,drop,fall,lens,mist,page,plume,pool,rest,ring,
   settle}.js`; `build/z-host.md`.
3. `feat(rivista system): the night studio, Sofia Sans and the scene grammar` — `css/{fonts,tokens,base,type,chrome,
   scene,blocks,dawn,case,cuts,print}.css`, `parts/{head.html,a-header.html,a-overlays.html,c-footer.html,
   c-footer.contact.html,c-main.case.mjs,c-main.404.mjs,c-main.consult.html,c-main.contact.html}`, `fx-core.js`,
   `fx-nav.js`, `fx-scroll.js`; deleted `fx-core.css`, `fx-nav.css`, `fx-hero.css`, `fx-scroll.css`, `fx-hero.js`;
   `scripts/check-claims-proto.mjs`; `build/z-system.md`.
4. `feat(rivista cover): hero plate over the name, Now in the glass, the index emblems` — `stage/scenes/{hero,now,
   index}.js`, `stage/scenes/cover/shared.js`, `css/page-cover.css`, `parts/b-hero.html`, `parts/c-main.index.html`;
   `build/z-cover.md`.
5. `feat(rivista work): nine plates in depth and the measured bars` — `stage/scenes/{gallery,evidence}.js`,
   `css/page-work.css`, `parts/c-main.work.html`; `build/z-work.md`.
6. `feat(rivista pages): About's stack and path, Contact, Consulting and Obla in the new type` —
   `stage/scenes/{stack,path,contact}.js`, `css/{page-about,page-night,page-contact}.css`, `parts/c-main.about.html`,
   `parts/c-main.obla.html`; `build/z-rest.md`.
7. `feat(rivista media): share cards and favicon redrawn in the night studio` — `scripts/media/{og-card-jobs.mjs,
   og-cards.mjs,icon-glyph.py,chrome-icons.mjs}`, `og/*.jpg`, `og/it/*.jpg`, `og/og-manifest.json`, `icons/*`,
   `site.webmanifest`; deleted `scripts/media/og-ring.svg` (never committed: untracked, nothing to stage).
8. `build(rivista): strings, assemble and the generated pages of both editions` — `parts/strings.mjs`,
   `assemble.mjs`, `fx.css`, every built `*.html` and `it/*.html`; `build/z-integrate.md`.
   (Commits 3–6 and 8 share `parts/strings.mjs` and the built pages: if the director wants every commit to pass
   `--check`, fold 3–8 into one commit or commit 8's files with each; the stage commits 1–2 build alone.)
