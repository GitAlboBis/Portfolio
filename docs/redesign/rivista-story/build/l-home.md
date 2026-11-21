# l-home — the home as one continuous scroll (wave 7, lane HOME)

## Done (2026-11-20, all four items of the brief)

- **One composition for both builds**: `parts/c-main.home.mjs` (new): `HOME` (work, about, consult, obla, contact, the menu's order), `partMain(key)` → `<main id="main" data-part="KEY">` for each page, `asPart(html)` (the opener `<h1` → `<h2`; `data-focus="load"` / `data-focus-lines="load"` → in-view `data-focus` / `data-focus-lines`), `homeMain(read)` → `<main id="main">` + `b-hero.html` + `c-main.index.html` (Now only) + one `<section class="part" data-part="KEY" aria-label="{{t:sec.KEY}}">` per page wrapping that page's own partial through `asPart` + `</main>`.
- **The home** (both builds, both languages): scenes `hero now gallery evidence stack path consult obla contact`; no index; no dawn close; closes with `c-footer.contact.html`, now `footer.legal-page[data-dawn]` (home and Contact). In scene mode 40,572 px tall at 1440; printed 21,497 (EN) / 21,687 (IT) at 1440, 21,525 at 390.
- **The pages**: diff against HEAD = `main[data-part=KEY]` on work/about/consulting/obla/contact, and `data-dawn` on Contact's legal line. Printed (reduced motion) 1440 DPR 1, pixel compare against the live site: work, contact, about, consulting, obla, 404, case-sersan-io → **0 px differ** each; stage on, Work and Contact first viewport side by side: same.
- **Styles**: `css/page-work|about|night|contact.css` rescoped `html[data-page=X] …` → `html [data-part=X] …` (attribute moved from html to the part, html kept: same specificity, same cascade); `page-cover.css` keeps `html[data-page="home"]` (hero and Now only), its index rules removed; `blocks.css` `.ix-in`, `.ix-h` and the scene-mode `.ix-in` rule removed (the 404 keeps the rows); `dawn.css` tokens + `.btn`, `base.css` selection + focus, `print.css` grounds: also `[data-part="contact"]` (and `.legal-page` for selection/focus). `print.css`: the reset also takes `transition: none` and `.hero-foot, .mo-own, .mo-own > .ln, .mo-w, .mo-c` (printing after a read with the stage on showed 304 blocks at 0.12 mid-fade and the cover's foot at 0: now 0 hidden; the live site prints Work the same broken way, 109 blocks).
- **Strings**: `ix.*` now printed only by the 404 → `"ix."` added to `READ_BY_MODULES`; comments updated.
- **Gates**: `assemble.mjs` asserts: (3) one h1 holds; (4) the reference dawn close is Work's; Contact and the home: no dawn close, one `section.ct#contact[data-dawn]`, the legal line `[data-dawn]` right after `</main>`, exactly 2 `[data-dawn]`; CHAPTERS = where each section lives (now: home; each page's sections: page + home; index: nowhere); (7) the home: scenes in order each once, nothing of the index, parts in order named `sec.*`, each part = its page's main through `asPart` (links' `data-back`/`aria-current` normalised), ends with Contact's part then the legal line. Same ported in `web/scripts/asserts.mjs`. `parity.mjs` needed no change (generic over the 32 pages): PARITY OK.
- **Astro**: `web/src/lib/site.mjs` (imports the home module; `coverMain()`, `pageMain(key, partial)`; RAIL also for the home), `MainCover.astro` (coverMain), `MainWork|About|Consulting|Obla|Contact.astro` (pageMain), `Site.astro` (home closes with FooterContact).

## Gates (last run, after every change)

assemble exit 0 + `--check` exit 0 (structural asserts ok) · claims OK 32 pages · Astro build exit 0 · PARITY OK (fx.css byte-identical, 145 shared files same) · asserts ok · claims on the build OK · `VERCEL_ENV=production node web/scripts/release.mjs` exit 0, three `[release]` lines.

## Looked (`.shots/l-home/`)

- `p1440/` (EN ?stage=0 DPR 2): sheet, joins, end; `p390/` (EN DPR 2); `it1440/` (IT DPR 2): the whole journey in order, the one straight edge into Contact's white morning; 1 h1, 0 hidden text, 7/7 pictures, no overflow, no text < 15 px, no console error. `states.mjs`: ?gl=0, reduced motion (EN, IT), print: complete.
- `stage/sheet.png` (stage on, 1440 DPR 2, 12 stills): every part's scene draws in turn (hall, Now's plate, gallery, evidence bars, the stack, the path, consult's mark, Obla). Seen, for STAGE/MOTION: Contact's ink strokes do not draw in the home (contact.js looks for an h1); the header stays night over Contact's white part (fx-nav finds `footer[data-dawn]` = the legal line); the grid wall is still there (COSMOS's).
- Bug caught by the look: the Edit tool dropped the trailing space of a replace_all (`[data-part="contact"].ct-in`); fixed with sed, then the pixel compares.
- `impeccable detect` once: 94 findings, all on the inherited system (sr-only 1 px, caps labels, existing clamp sizes), none from this change.

## Needs elsewhere

See the return (STAGE: contact.js h2 line, the scenes' order and joins in one document, the two [data-dawn] grounds; MOTION: fx-nav's dawn element, the openers' in-view hooks, the header's part name, the sound's room per part).

## How to run and look

`node public/proto/rivista/assemble.mjs` (+ `--check`), `node scripts/check-claims-proto.mjs`; from web/: `node scripts/build.mjs --outDir ../.shots/l-home/dist`, `parity|asserts --built=../.shots/l-home/dist/proto/rivista`, claims `--dir=…`; serve `python scripts/serve-static.py 5381 .shots/l-home/dist public`; probes in `.shots/l-home/_scripts/` (home.mjs, states.mjs, stage.mjs, cmp.mjs, cmp2.mjs, printwhy.mjs).
