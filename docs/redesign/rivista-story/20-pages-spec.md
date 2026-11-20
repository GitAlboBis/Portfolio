# The issue as pages — spec (amends `10-story-spec.md` §2)

> Written 2026-11-10 by the director on Alberto's feedback of the same day, after he opened the first build:
> «ok per ora vabene , ma non voglio che sia tutta una spa , ma che ci siano pagine diverse . non mi piace che quando
> clicco per esempio in consulting , mi scorra nella stessa pagina infondo .»
> Everything in `10-story-spec.md` stands except its §2 (one long home) and "home page only" in §3.1.

## 1. The rule

A word in the navigation opens a page. It never scrolls the page the reader is on. The issue is a set of pages; the
home is its cover and its contents page. Going from one page to another is a cut by sheet (S5 "Tendina", already
built), and the cut into a night page is the sharp passage between the two worlds.

## 2. Pages (English at the root, Italian twins in `it/`)

| page | file | world | what it holds, in order |
|---|---|---|---|
| Cover | `index.html` | day, ending at dusk | the hero with the water A (Fig. 01) and its preloader, unchanged · 01 Now (the sheet that rises over the A, unchanged) · **In this issue**: the contents of the issue, one entry per page below · the dusk strip (§4) · the contact band |
| Work | `work.html` | day | 02 Work: the head and the rail of nine works · Fig. 03, the passes · 03 Evidence: the manifesto and the two ledgers · the band |
| About | `about.html` | day | 04 Capabilities · 05 About: the path and the thesis · the band |
| Consulting | `consulting.html` | night | 06 Consulting: the head and the scene with its four entries, the closing line and the button · a ghost link on to Obla · the band (morning) |
| Obla | `obla.html` | night | 07 Obla: the head and the scene with its five entries and the two fields · the band (morning) |
| Contact | `contact.html` | day | 08 Contact: the band as the page itself, full height, with the address, the copy control, LinkedIn and GitHub |
| the nine cases | `case-<slug>.html` | day | unchanged; their way back is the Work page |
| 404 | `404.html` | day | unchanged, with the new list of pages |

- Every section moves with its markup, its strings, its styles and its motion: nothing is rewritten, nothing is
  duplicated. A chapter exists on exactly one page.
- A page that is not the cover opens the way a case opens: its first chapter's head is the page's opener (eyebrow,
  display title, lead), arriving with the case arrival film. No new opener component.
- Chapter numbers stay 01 to 08 across the issue.

## 3. In this issue (the cover's contents)

A typographic index in the grammar of the Capabilities list and of the cases' "In this issue": one hairline row per
page, the chapter numbers in cobalt, the page's name as a display line, one sentence that carries a true fact from
that page (a number already printed there, in its own scope), and the verb that rolls on hover ("Read"). Rows: Work
(02–03), About (04–05). Consulting (06) and Obla (07) are not in this list: they are the dusk strip. Contact is the
band below. No cards, no thumbnails, no icons.

## 4. The dusk strip (the cover's last sheet before the band)

A short night sheet on the cover, laid over the page like the other sheets, holding two rows in the same grammar as
§3: 06 Consulting and 07 Obla, each with its one sentence and "Read". It carries `data-night`, so on the cover the
ink still gathers on its edge, pours over it and comes out as light (`fall`), and the reader sees where the night
begins. Clicking a row cuts to the night page.

## 5. Navigation

- Header: Work, About, Consulting, Contact, each a link to its page; add Obla if it fits on one line from 1024 up in
  both languages, otherwise it lives in the menu, in the dusk strip and at the foot of the Consulting page. The current
  page carries the section dash. The brand goes to the cover.
- Menu: the eight chapters, each a link to its page (to an anchor on that page when the chapter is not the first
  there: `work.html#measured`, `about.html#path`, `index.html#now`).
- Every page-to-page link is an S5 cut carrying the destination's name. When the destination is a night page the
  sheet is the night ground with the name in paper; when it is a day page the sheet is paper-deep as today. A rail
  tile to its case, and back, stays S4; the way back lands on the Work page's rail, on the tile the reader left.
- The reader's place across a change of language works on every page as it does today.
- Old addresses keep working: `index.html#work`, `#measured`, `#capabilities`, `#path`, `#consult`, `#obla`,
  `#contact` are sent to the new page by the head script before the first paint (`location.replace`).
- On a full night page the header is in its night state from the first paint (an attribute on `<html>` written by
  the build, not by script), the page ground is the night, and the stage treats the whole viewport as night.

## 6. The stage and the water on each page

- The stage runs on every page that has `data-stage` sections, not only the cover. Section names and formations are
  the ones of `10-story-spec.md`: the cover has `rest`, `plume`, `ring`, `mist` over the contents, `fall` on the dusk
  strip; Work has `current`, `letter`, `mist`; About has `mist`; Consulting has `gen`, `cut`, `code`, `agents`; Obla
  has `obla`; Contact and every band have `dawn`.
- The water engine loads as it does on a case page today (the band set) on every page but the cover (hero set) and
  the 404 (none). The stage takes its device from it on every page.
- The preloader stays on the cover only.

## 7. Build facts the lane must keep true

- `assemble.mjs` builds every page twice from one set of partials and one source of strings; the structural and
  parity asserts cover the new pages; nothing is edited by hand in a generated page.
- Head: each page has its own title and description in both languages, `hreflang` pairs, and a share card (made with
  the existing `scripts/media/og-cards.mjs` if it can; otherwise the cover's card, recorded as a gap).
- `node scripts/check-claims-proto.mjs` reads the new pages; every number keeps its scope.
- Reduced motion, no WebGPU, no script and print are complete on every page.
- The probes under `scripts/probes/rivista-motion/` that address `index.html#…` are not rewritten in this round; list
  the ones that now point at a moved chapter in the notes.

## 8. Lane

One lane, PAGES, after the build chain of `10-story-spec.md` has finished and been committed. It owns `parts/*`,
`assemble.mjs`, the five `fx-*.css`, `fx-core.js`, `fx-nav.js`, `fx-scroll.js`, `fx-hero.js` only if the cover needs
it, `fx-stage.js` (the page conditions and the full-night page), `scripts/check-claims-proto.mjs` and
`scripts/media/og-cards.mjs` if they must learn the new pages. It does not touch `water/engine/**` or `stage/**`
except a formation's mapping in `fx-stage.js`. Notes in `docs/redesign/rivista-story/build/pages.md`. Then one
integration pass looks at every page in both editions at 1440 and 390, with the cuts between them.
