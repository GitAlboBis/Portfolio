# PAGES lane — notes (spec 20, amended by spec 30)

- Lane: PAGES (port 5188). Owns parts/*, assemble.mjs, the five fx-*.css, fx-core.js, fx-hero.js, fx-nav.js, fx-scroll.js, check-claims-proto.mjs, og-cards.mjs. Not stage/**, not fx-stage.js.
- How to run and look: `python scripts/serve-static.py 5188 public`; `GATE_MAX_STEPS=30 node scripts/visual-gate.mjs pages/<tag> proto/rivista/index.html … --base=http://127.0.0.1:5188`.

## Plan (run 1)

1. strings (meta per page, contents sentences, dusk label, "Read", "On to Obla")
2. partials: one header `a-header.html` with `{{LINK:page#anchor}}` links (assemble writes href, direction, label, sub,
   aria-current, data-pt-night); `c-main.index.html` = Now + In this issue + dusk strip + band; new
   `c-main.work.html`, `c-main.about.html`, `c-main.consult.html`, `c-main.obla.html`; contact = `bandPage()` in c-main.case.mjs
3. assemble: page table, html attributes (data-page, data-issue, data-night-page), asserts for the new pages
4. head: old-hash redirect, data-nv-night on a night arrival
5. fx-nav: S5 sheet night variant, same-page link, pathname normalisation, header night from first paint
6. fx-core FX.page = data-page; fx-scroll opener hold `.pg-open`
7. CSS: opener, contents rows, dusk strip, band page, night page ground, nav current dash
8. claims gate reads every page; gates; look

## State
- Built (run 1): steps 1-8 on disk; assemble + --check + claims OK (32 pages). Next: look (visual gate, cuts script).
- Run 2 (cut run resumed): run 1 committed by the director as 91918f1, tree clean. Done: gates, visual gate of the 12
  pages (EN+IT, 1440 and 390, stage on) CLEAN; --reduce (cover, consulting, it/obla, 404) and --nogpu (cover EN+IT,
  consulting) CLEAN; cuts (inline scratch script, headless): header word to a day page and to a night page, the brand
  back, browser back, a rail tile to its case (S4) and "Back to the index" to the Work rail at the tile, desktop EN and
  phone IT, console clean; old addresses index.html#work/#measured/#capabilities/#path/#consult/#obla/#contact land on
  their pages (EN+IT); language switch on about.html keeps the place.
- Fix (run 2): the 404's contents. "02 – 03" broke over two lines in a 2.5rem column, the pages list had no closing
  rule, the "Selected work" label sat tight under it. fx-nav.css §10: numbers nowrap, the desktop number column 5rem
  (the cover's), each 404 list closes on a hairline, the label gets room above, and on a phone the cover's grammar
  (numbers over the name, sentence full width). Captures .shots/pages/404b/.

## Decisions
- Obla has no word in the header (five words do not hold one line at 1024 in Italian): menu, dusk strip, foot of
  Consulting. So the Obla page's header carries no section dash.
- Share cards: every new page uses its edition's cover card (og/og-home.jpg, og/it/og-home.jpg) — recorded gap; that
  card itself still shows the water A until og-card-jobs.mjs learns the new cover (CUT lane's open item).

## Open
- The band (CUT lane's 16:9 paper field) leaves ~400px of empty paper above "Write to me." on every page; after the
  last chapter's own foot that reads as ~900px of nothing on About and Work at 1440. Left as built: it is the stage's
  dawn field and the drop's rest; a shorter band (2:1, or min-height only) is a one-line change in fx-scroll.css §8.
- Probes that address moved chapters on index.html (spec 20 §7, not rewritten): rivista-motion/cases-nav.mjs,
  idle.mjs, restore.mjs (index.html#work…), rail.mjs, s4.mjs, strip.mjs, cases.mjs, blocks.mjs (the rail, ledgers,
  path on the home), and the _rev_* reviews.
- The gate captures show a 15px paper strip at the right of the header and the night bands at 1440: the headless
  scrollbar gutter, present before this round (.shots/cut/b).

## Sources (spec 30 §6)
- 21st.dev `search` "editorial table of contents index list hover row page transition": Project Index (cover image follows the
  cursor on hover), Table of Contents (scroll spy), Editorial service list (numbered accordion), Interactive List Preview
  (clipped image + difference blend). Magic UI "page transition": theme togglers with clip reveals. Taken as mechanism:
  numbered hairline rows with a verb that answers the hover (already the site's `.nv-ix` and `.sc-roll`). Refused: any
  image that follows the cursor (nothing follows the pointer in the DOM), accordions (a row is a link to a page), blend
  inversions and circular clip reveals (the cut is a straight sheet). No paid call, nothing imported.
