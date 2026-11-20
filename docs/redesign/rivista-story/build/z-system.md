# z-system — SYSTEM lane notes (spec 50 §2, §3, §4, §6, §7)

## Status: wave-1 baseline DONE; gates green (assemble, --check exit 0, check-claims-proto OK + --selftest ok)

## Done (on disk, nothing committed)
- Type: css/fonts.css from the served Google CSS (2026-11-10): Sofia Sans, Sofia Sans Condensed, Sofia Sans Extra
  Condensed, variable 1–1000, latin + latin-ext. Served as the spec expects: no Barlow fallback needed. The head
  preloads the three latin files.
- Stylesheets, new, under css/: fonts, tokens, base, type, chrome, scene, blocks, dawn, case, cuts, print, and the
  five empty page files page-cover / page-work / page-about / page-night / page-contact (wave 2). fx.css is built from
  them in that order (page files before print). Deleted: fx-core.css, fx-nav.css, fx-hero.css, fx-scroll.css, fx-hero.js.
  KEPT: fx-fonts.css (the old Cormorant/Figtree faces) because scripts/media/og-card-jobs.mjs and vpp-plate.mjs draw
  the old share cards with it; delete it when the cards are redrawn.
- Partials rewritten: head.html, a-header.html, a-overlays.html (the cut sheet), b-hero.html, c-main.index.html,
  c-main.work.html, c-main.about.html, c-main.consult.html, c-main.obla.html, c-main.case.mjs (case template +
  gallery steps), c-main.404.mjs, c-footer.html (the dawn close); new: c-main.contact.html, c-footer.contact.html.
- strings.mjs rewritten (magazine words out: issue, in print, colophon, plate, In this issue, Read, Fig. NN, the
  ornament; new copy of spec 50 §4 in: work.head, ui.openCase, ix.work, ct.line, dawn.engine, ui.more, ui.allWork, nf.*).
- assemble.mjs: pages table (indices 01–05, dawn for Contact), html[data-ground], footers per page, CSS list, new
  structural asserts (gallery steps/pictures, More-work cycle, one h1, ground, dawn close identical, scene grammar
  view + --steps count, sections on one page). The old long header comment is marked as history.
- Scripts: fx-core.js adapted (fonts, eases, no SplitText/CustomEase, ORDER scroll/nav); fx-scroll.js and fx-nav.js
  rewritten small; fx-hero.js deleted. Loader: gsap, ScrollTrigger, lenis, fx-core, fx-scroll, fx-nav, fx-stage.
- scripts/check-claims-proto.mjs: check 4 (key words ↔ case) moved to the new markup; the selftest seeds inside <main>.
  scripts/media/og-ring.svg + og-card-jobs.mjs: the old ring kept byte for byte so the share-card hashes hold.

## Contrast (computed)
ink 17.10 / body 11.81 / mute 6.47 / accent 8.07 on --night; ink 16.18 / body 11.17 / mute 6.12 / accent 7.63 on
--night-2; ink on cobalt 7.03; dawn-ink 17.53 / dawn-body 9.58 / dawn-mute (#5d6270, added) 5.54 / cobalt 7.21 on
--dawn. Cobalt on night 2.43: never text on the night. Body text holds AA everywhere.

## Contract for the other lanes (HOST, wave 2)
- Scene mode = `html.sc-on:not(.gl-off)` (head script: motion + WebGPU + no ?stage=0). Without it: plain flow and
  `[data-stage-poster]` shown. In scene mode posters are display:none.
- `.sc` carries `--steps:N` = its `.sc-step` blocks (intro included); height N×100svh. Intro = `data-stage-step="0"`;
  steps 1…N; an outro block (Consulting, Obla) has no data-stage-step. Asserted by the build.
- Text side by class: `.sc-left` (text left, the figure's half is the RIGHT) / `.sc-right` (figure LEFT). Cover now and
  index, gallery, evidence, stack, consult = left; path, obla = right. Hero has neither.
- fx-scroll sets `.is-active` on the step nearest the middle (FX.scroll.activeStep(sc) returns its number).
- Work gallery: each `li.sc-step.wk[data-stage-step=n][data-tile-id=NN]`; six hold `<img data-slab="SLUG">`
  (loading=lazy, inside a display:none poster in scene mode: HOST must fetch img.currentSrc||src itself), three hold
  `[data-slab-words="SLUG"]` with `.wk-words-fig` and `.wk-words-line`. Cover now: `<img data-slab="now">`
  (sersan-io-blackhole-sq).
- Evidence rows: `li.metric[data-stage-mark="before after"]` fractions of the full bar (time rows against their before).
- Index rows: `a.ix-a[data-stage-cue="work|about|consult|obla"]`.
- data-refract: hero name (`"name"`), display titles (`"title"`).
- Dawn: `footer.dawn#write[data-dawn][data-stage="dawn"]` with an absolute `.dawn-view[data-stage-anchor="dawn"]`;
  Contact: `section#contact.sc[data-stage="contact"][data-dawn]`, html[data-ground="dawn"].
- Instrument line: `[data-stage-instr="hero"]`, visible only under html.stage-on.
- Cuts: sessionStorage `rv-pt` {t,to,label,sub,dawn}; head sets `html[data-arrive="cut"]` (+ `data-cut-dawn`); events
  fx:nav:start / covered (leaving), uncovered / arrived (arriving), reset (bfcache). FX.lock("menu") while the menu is
  open, FX.lock("nav") while a sheet rises. `html.is-scrolled`, `html.menu-open`.
- html[data-night-page] and data-issue are gone; use html[data-ground] and html[data-page].
- First-screen text uses `data-focus="load"` / `data-focus-lines="load"` (CSS plays it, paused under data-arrive);
  everything else `data-focus` / `data-focus-lines` (fx-scroll adds .is-in once in view).

## Open
- The share cards (og/*.jpg, both editions) are still the old look; inputs untouched so --check stays green.
- scripts/probes/rivista-motion/* (strip, tokens…) read the retired stylesheets: historic tools now.
- Touch: a tapped header button keeps its :hover colour (sticky hover); harmless.
- Arrows "→" between before/after are the text face's glyph (data typography, read by the claims gate).

## Run / look
- `python scripts/serve-static.py 5201 public` → http://127.0.0.1:5201/proto/rivista/
- `GATE_MAX_STEPS=16 node scripts/visual-gate.mjs z-system proto/rivista/work.html --base=http://127.0.0.1:5201`
- captures: .shots/z-system/ (scene mode), .shots/z-system-r/ (--reduce), .shots/z-system-n/ (--nogpu)
