# PAGE lane (fix round y) — notes

- State: items 1 and 2 DONE and looked at (resumed run re-read d-sheet/m-sheet: header dawn over the edge, night
  above, night when menu open; OK). Item 5 DONE (data). Now item 3 (walk).
- State: ALL ITEMS DONE (1, 2, 3, 5 fixed; 4 needs no change). Gates: assemble 0, --check 0, claims OK. Server 5213
  stopped; 5179 untouched. Returned.
- 4 DONE, no change to stack.js: before GLASS's fix the phone stack showed dotted far edges
  (.shots/y-page/stack0/m-stage-01-about_html.png); after it (plates.wgsl.js prefiltered lights + edge rays) the
  edges are continuous at 390 DPR 2, EN and IT (.shots/y-page/stack1/*.png). Layers stay t = 10 on the phone.
- 3 DONE: DOM audit (scratchpad ypage/audit.mjs: overflow, collisions, orphans, steps taller than the screen, focus
  walk, links) on stage d/m, reduce d/m (focus), nogpu d/m, EN+IT, all page types: one real defect, IT Work evidence
  step 809>764 px on phone (title under the header) -> fixed in css/page-work.css (phone padding of .metric/.mx/step).
  The other hits are false positives (tall display line boxes; two-line headings by design) checked by eye
  (.shots/y-page/w3, w4, w5). 102 links, 0 dead; focus rings present, none clipped/under the header. Visual walk of the
  IT edition, stage on, 1440+390: .shots/y-page-walk/sheet-*.png, console clean, nothing broken.
  Open (not fixed, a director's call): 404 has no stage, yet its dawn line says "The light and the glass are drawn
  live…" (the footer is asserted byte-identical on every page; read it as the site's colophon, or give 404 its own).
- 5: `cases.json`: 30 "Fig. 01 · " folios removed from captions (15 fields × EN/IT); supply-chain `rail.alt` and
  `fig.alt` now say light lines / dark ground / traceability links in blue (both languages). `c-main.case.mjs`
  capText no longer strips a folio (none left). Share cards do not read captions or alts (og-card-jobs: alt="",
  figLine): no og redraw needed; --check exit 0.
- Decisions:
  - 1: `fx-nav.js` header() sets `html[data-hdr-ground="dawn"]` while `footer[data-dawn]`'s top < `.hdr` bottom (scroll,
    resize, ResizeObserver on body); not on Contact (its ground is dawn already). Attribute name is NOT `data-hdr`
    (that is the header's own hook, `$("[data-hdr]")` would then match <html>). `css/chrome.css`: the Contact header
    rules now read `:is(html[data-ground="dawn"], html[data-hdr-ground="dawn"])`; menu open over dawn = night header;
    focus ring cobalt over dawn, accent in the night menu. No transition on .hdr: an instant cut both ways.
  - Pre-existing bug fixed on the way: the menu's "EN" (lang-now) took the dawn ink on Contact (dark on --night-2):
    the rule is now scoped to `.hdr .lang-now`.
  - 2: new string `ct.engine` (EN "The ink is drawn live by an engine written directly against the GPU API, in
    WebGPU." / IT «L’inchiostro è disegnato dal vivo da un motore scritto direttamente sull’API della GPU, in
    WebGPU.»), used only in `parts/c-footer.contact.html`.
  - Captures: `.shots/y-page/h1/d-sheet.png`, `m-sheet.png` (rows = pages; cols = above edge / over edge / end /
    [phone: menu open] / back up), `d-work-hdr-zoom.png`, `m-menu-foot.png`. Script: scratchpad `ypage/hdr.mjs`.
- How to run: `python scripts/serve-static.py 5213 public` (background); captures in `.shots/y-page/`.
- Owns: css/** except page-cover.css, parts/**, assemble.mjs, fx-nav.js, fx-core.js, fx-scroll.js, stage/scenes/stack.js (item 4 only).
