# 20 · Cases spec: one case page per work, in the rivista grammar

> **Status:** build contract for the cases lane, 2026-10-09, branch `feat/water-hero`. Written by the case-system architect, read-only on product files. Alberto is away and asked us to decide ourselves, so every choice below is taken (the decisions are listed in §0) and none of them is a question for him.
> **Scope:** the static prototype `public/proto/rivista/` (V1 "Carta e cobalto"): `assemble.mjs`, `parts/*`, `fx-nav.js` (four small changes, §1.5), `fx-scroll.css` §10 (a few rules, §2.4), the probes that name `case.html` (§1.6), and one new gate script (§4).
> **Binding:** `docs/redesign/rivista-motion/10-motion-canon.md` (§0 Alberto's decisions, §5 the refused list), `docs/redesign/water-hero/30-hero-build-spec.md` (§1.6 the band, §4.4 claims, §8–§9), `public/proto/rivista/water/engine/CONTRACTS.md` (§18 band, §21 R3/R4/R5), `_refs/hero-water/05-taste-history.md`. **Facts:** only `PRODUCT.md` §3 and §9. `src/content/works.ts` is a derived copy of the CV; where the two disagree, PRODUCT wins.
> **Path legend:** `rv/` = `public/proto/rivista/`. `P:n` = `PRODUCT.md` line n. `W:n` = `src/content/works.ts` line n.

---

## 0. What this spec decides

Today all nine "Open" tiles of the home rail (`rv/parts/c-main.index.html:30-110`) point at `case.html`, the SphereNode case, and its next-work link returns to the rail (`rv/parts/c-main.case.html:122-125`). After this lane, every work has its own page, built from one template and one data file, and the reader can walk the issue from 01 to 09 and back to 01 without leaving the grammar.

| # | Decision | Why |
|---|---|---|
| D-C1 | **Flat files** `rv/case-<slug>.html`, slugs exactly as `works.ts` (`spherenode`, `sphere-ai`, `maintech-oma`, `sersan-io`, `domus-tua`, `sersan-brand`, `badante24h`, `doit-voice-ai-agent`, `agricultural-supply-chain`). No folder scheme. | Every relative URL in `parts/head.html` (`fx.css`, the five `fx-*.js`, `water/engine/` resolved from the script src) and in the partials (`index.html#work`) keeps working unchanged; `fx-nav.js`'s `/\/proto\/rivista\//` filter (`fx-nav.js:1245`) matches; the per-path storage keys (`rv-hero-rect|<path>`, `rv-y|<path>`) are already per page. Same slugs as the Next app's `/work/[slug]`, so the later port is a rename. |
| D-C2 | `case.html` becomes a **generated redirect stub** to `case-spherenode.html`; the probes that open `case.html` are moved to `case-spherenode.html` in the same commit (§1.6). | Two documents for one work is a maintenance trap (two `rv-y` keys, two hero-rect caches, the claims gate scanning it twice, an ambiguous next chain). A stub keeps old links and bookmarks alive. |
| D-C3 | **One data file, one renderer.** `rv/parts/cases.json` carries every word and number of the nine pages, each fact with its `src` (`P:n`); `rv/parts/c-main.case.mjs` renders a case's `<main>` content from it. `parts/c-main.case.html` is retired once the generated SphereNode passes the diff of §5 B3. | A number lives in exactly one place, next to its citation, where the gate (§4) can read it. No raw HTML in the data: the renderer escapes text, so the data ports to `works.ts`/`dict.ts` cleanly. |
| D-C4 | A work with no photograph gets a **typographic Fig. 01 plate**, the same figure its rail tile prints, at display scale, with the printed gap "No photograph on file". No illustration, no generated still, no stock image, no isometric SVG. | `PRODUCT.md` §5 (`P:58`): no screenshots of the SerSan works beyond the two captures. A generated image presented as the work would be a fabricated record, and G5 (paid generation) is closed. Alberto dislikes 2D stand-ins and procedural fakes (`05-taste-history.md` §1.1, 2026-07-14); a printed figure is neither: it is the page's own type. |
| D-C5 | **Every case page keeps the closing band with the water** (`#contact`, `[data-gl-host="band"]`). It is the one renderer on the page. | It is the site's WebGPU proof and the contact, on every page. The engine already loads only the band set on a non-home page (`fx-water.js:533`, spec 30 §9.3) and seeds the beads from `location.pathname` (`water/engine/band.js:71`), so every case gets its own rain for free. |
| D-C6 | The next-work link is an **S5 cut** in rail order, 09 wraps to 01. The tiles keep their cuts: S4 "Stacco" for the two capture tiles (01, 04), S5 for the seven type tiles. | S4 needs a capture on both ends; only spherenode and sersan.io have one. `data-pt="grow"` on the type tiles is not implemented anywhere (it falls through to S5 in `fx-nav.js:792-796`) and stays as a reserved name. |
| D-C7 | **SphereNode's chapter 02 is compacted** to the mentor's one-line description, one measured row and a link to the Sphere AI case; the full before/after ledger and the guardrails move to `case-sphere-ai.html`. | With a Sphere AI page of its own, the same five pairs printed on three pages (home ledger, SphereNode, Sphere AI) is padding. |
| D-C8 | The Maintech schematic draws the **domain core** the CV lists, with the job order's six phases **unnamed** (01–06). The Next app's phase names (Intake · Diagnosis · Estimate · Work · Test · Release, used by `src/components/work/Schematic.tsx` via `dict.ts`) are the job-order world's invention and never appear. | `P:140-142` says "a six-phase state machine with role-gated transitions" and names no phase. |
| D-C9 | Two figures from `works.ts` are **not printed as figures**: sersan.io's `"0"` effects removed (`W:502`) and Badante24h's `"<1 s"` (`W:719`). They print as the CV's words: "without removing a single effect", "Sub-second". | Both are re-notations of words; the CV block of the work contains neither "0" nor "1" for them, so the scoped gate (§4) would rightly fail them. |
| D-C10 | The site stays EN-only (the header prints "Italian version coming"); the data shape takes an `it` twin per string later (canon R-21). | Out of scope today. |

---

## 1. File plan

### 1.1 Files

| File | Status | Owner | What |
|---|---|---|---|
| `rv/parts/cases.json` | new | cases lane | The nine cases, in rail order. Schema §1.2. |
| `rv/parts/c-main.case.mjs` | new | cases lane | `export function render(c, ctx) → string`: the case's `<main>` content (hero → band). Pure: no `Date`, no randomness, no file reads, so `assemble.mjs` stays "a pure function of its inputs" (`assemble.mjs:8-11`). |
| `rv/assemble.mjs` | edit | cases lane | Generates `case-<slug>.html` × 9 and the `case.html` stub; `--check` covers them and runs the structural asserts of §1.4. |
| `rv/case-<slug>.html` × 9 | generated | — | Never hand-edited. |
| `rv/case.html` | generated stub | — | §1.3. |
| `rv/parts/c-main.case.html` | retired | — | Deleted once B3 (§5) passes. |
| `rv/parts/c-main.index.html` | edit (9 hrefs) | WP-C | Each tile's `href="case.html"` → `case-<slug>.html` (lines 30, 40, 50, 60, 70, 80, 90, 100, 110). Optional: tile 08's plate word (§3.8). Nothing else. |
| `rv/parts/a-header.case.html` | unchanged | WP-A | Shared by all nine. |
| `rv/parts/head.html` | optional edit | WP-A | A `{{DESC}}` placeholder for the meta description (§1.3). P2. |
| `rv/fx-nav.js` | edit | WP-A | N1–N5, §1.5. |
| `rv/fx-scroll.css` §10 | edit | WP-C | §2.4. Then `node assemble.mjs` regenerates `fx.css`. |
| `scripts/check-claims-proto.mjs` | new | cases lane | §4. |
| `scripts/probes/rivista-motion/cases.mjs` | new | cases lane | §5 B7. Headless only, through `launch()` of `scripts/probes/water/lib.mjs`. |
| probes naming `case.html` | edit | cases lane | §1.6. |

### 1.2 `cases.json` schema

One array, rail order. Every string is plain text (the renderer escapes it). Every entry that carries a fact carries `src`.

```jsonc
[
  {
    "slug": "sphere-ai",                 // = works.ts slug, = file name case-<slug>.html
    "tile": "02",                        // = data-tile-id on the home rail
    "label": "Sphere AI",                // the short name: tile data-pt-label, S5 cover, <title>, next-link
    "titleLines": ["Sphere AI"],         // h1, one span per stair line (≤ 3); long names step (.sc-l2 / .sc-l3)
    "overline": [                        // printed left to right, .page-hero .overline
      { "t": "SerSan", "src": "P:96" },
      { "t": "Inside SphereNode", "src": "P:105" },
      { "t": "Live at spherenode.com", "src": "P:101" }
    ],
    "ornament": "grounded",              // one italic accent word or phrase, from the CV's own vocabulary (src)
    "lead": { "t": "…", "src": "P:105-108" },
    "cta": { "label": "Visit spherenode.com", "href": "https://spherenode.com", "src": "P:45" },  // or null
    "fields": [ { "k": "URL", "v": "pending", "src": "P:76" } ],   // printed gaps beside / instead of the CTA
    "fig": {                              // Fig. 01: one of two kinds
      "kind": "plate",                    // "capture" | "plate"
      "figure": "68%", "word": false,     // the printed figure (or a word, is-word style)
      "figLine": "answer-policy accuracy, from 52%",
      "gap": "No photograph on file",
      "caption": ["Fig. 01 · Answer-policy accuracy", "On a 161-question bilingual evaluation set."],
      "src": "P:108-109"
      // capture kind instead: "img": "/captures/…-1600.webp", "srcset": […], "alt": "…", "caption": [...], "src": "public/captures/PROVENANCE.md"
    },
    "chapters": [ /* typed chapters, §2.2, in reading order; numbering is generated */ ],
    "onFile": [ { "k": "Studio", "v": "Sersan Limited · London · Remote", "src": "P:97" }, … ],
    "stack": { "t": "RAG · pgvector · …", "src": "W:243, P:105-107" }
  }
]
```

`claimsScope` is not in the data: the gate maps slug → PRODUCT anchors itself (§4.2), so the data cannot widen its own scope.

### 1.3 `assemble.mjs`

- `PAGES` keeps `index.html` as it is. The nine case pages are appended from `cases.json`:
  - `out: "case-" + c.slug + ".html"`; `vars: { TITLE: c.label + " · Alberto Tuveri · Rivista prototype", HOME: "" }`;
  - parts: `head.html`, `<body id="top">`, `a-header.case.html`, `<main id="main" data-case="<slug>" data-tile="<NN>">`, **the rendered main** (`render(c, { next, all })`), `</main>`, `c-footer.html`, `a-overlays.html`, `</body>\n</html>`.
  - `next` = the case after `c` in the array, the last wrapping to the first.
- The renderer is loaded with a top-level `await import("./parts/c-main.case.mjs")` (Node 22.17 on this machine, ESM already). A part entry may now be `{ render, data }` beside a file name and a literal string; `piece()` gains that branch and nothing else changes.
- `case.html` is a literal page (no fx scripts): `<!doctype html>`, charset, viewport, `<title>SphereNode · Alberto Tuveri</title>`, `noindex`, `<link rel="canonical" href="case-spherenode.html">`, `<meta http-equiv="refresh" content="0; url=case-spherenode.html">`, `<style>html,body{background:#f6f3ec}</style>` (no white flash), `<script>location.replace("case-spherenode.html"+location.search+location.hash)</script>` (keeps `?debug=1`, adds no history entry), and a plain link for no-script.
- `--check` stays "stale → exit 1" for all eleven outputs and `fx.css`, and adds the asserts of §1.4 (they read only the built strings, so `--check` still writes nothing).
- Optional (P2): `{{DESC}}` in `head.html:10`; the index passes today's sentence, a case passes its `lead.t`.

### 1.4 Structural asserts (`assemble.mjs --check`, exit 1 on any)

1. Every `[data-tile-id="NN"] a.tile-link` in `index.html` has `href="case-<slug>.html"` for the case with `tile === "NN"`, and `data-pt-label === c.label`. No `href="case.html"` remains in any built page.
2. A capture tile (`data-pt="flip"`) exists exactly for the cases with `fig.kind === "capture"`, and the stem of its `data-pt-hero` equals the stem of the case's `[data-case-hero] img` src (the S4 contract, `fx-nav.js:604-606`).
3. The next links form one cycle of nine in rail order.
4. Each case page: exactly one `h1`, one `[data-band]`, one `[data-gl-host="band"]`, one `[data-band-copy]`; `[data-case-hero]` present only on capture cases; no duplicate `id`.
5. The band markup is byte-identical across the ten pages that have it (fx-hero mounts it, fx-water reads its keep-out rects, canon P14).

### 1.5 S4 / S5 / the route record: what `fx-nav.js` needs

The cuts already key everything by path, so most of the system works unchanged for nine pages: the record's `to` is `url.pathname` and the head script accepts it only on that path (`head.html:26-27`); the hero rect cache and the hero src are per path (`fx-nav.js:63-64`, `516-528`); `arrive()` finds its host by `[data-case-hero]` forward and by `[data-tile-id]` back (`fx-nav.js:1039-1041`); prefetch covers `a[data-pt]`, `a[data-back]`, `a.next-link` (`fx-nav.js:1210`). Four defects appear the moment there are nine destinations, and one improvement makes "Back to the index" professional for the seven S5 tiles. All in `fx-nav.js` (WP-A); none touches the motion lexicon.

| # | Today | Failure with nine pages | Change |
|---|---|---|---|
| **N1** | `rv-origin` (session, 10 min) is written by a forward flip (`fx-nav.js:637-648`) and read by any back cut from any case (`flipBack`, `:700-702`). It does not record which case it belongs to. | Reader: tile 01 (S4) → next → 02 → next → 03 → next → 04 sersan.io → "Back to the index". `flipBack` finds a fresh origin (tile 01) and flies the **sersan.io** capture into the **SphereNode** tile's slot; the home finds no match and dissolves it (`:1149-1155`). A visible wrong move. | `lastOrigin.path = url.pathname`. `flipBack` returns false unless `org.path === location.pathname` and `org.tileId` is set (it then falls to S5 back). |
| **N2** | Only a flip writes an origin. | The seven S5 tiles return to `#work` top, i.e. the rail at tile 01, whatever tile the reader opened. | Write the origin in `go()` for every forward link inside `[data-tile-id]` (S4 and S5), measured before `FX.lock` (the same fields: `tileId, path, scrollY, railP, railLeft, hc, hh, v, w, h, t`). `flipForward` reuses the helper (its `rest` measure stays as is). |
| **N3** | The S5 arrival places the page with `scrollToHash()` only (`fx-nav.js:1165`). | Same as N2. | `go()`: for a link with `data-back="origin"` whose origin matches (`path`, < 10 min, same `w`/`h`/`v`), the S5 record carries `scrollY, railP, railLeft, tileId`. `arrive()` S5 branch: if `typeof a.scrollY === "number"`, place exactly as the flip-back does (`FX.scroll.restore({ y, railP })`, the phone rail's `scrollLeft`, the one-frame recheck of `:1111-1118`, `FX.scroll.syncRail()`), else `scrollToHash()`. It happens under the covering sheet, so the jump is never seen. Canon R-11's promise ("the rail frame the reader left") now holds for every tile. |
| **N4** | `flipBack` runs for **any** `data-back` link while the hero is ≥ 20 % visible (`:774`, `:795`). | Existing defect, now on two pages: "About" in the case header (`index.html#path`) flies the capture back into the rail and lands at the origin's scroll, not on About. | The back flip only for `data-back="origin"` (the hero's "Back to the index") and for links whose hash is `#work`. "About" and the brand mark take S5 back to their own target. The renderer writes `data-back="origin"` on the hero ghost link; the header partial keeps plain `data-back`. |
| **N5** | `warmHeroSrc` warms only the first flip link (`:1365-1366`, one boolean `prefetched`). | Tile 04's destination is never warmed. Harmless today (an unknown src lets the flip run) but the stem guard of `:606` is then off for it. | Warm every `a[data-pt="flip"]` path once (a `Set`), at idle, as now. |

Not changed: `cacheHero` (per path), `heroTarget`'s cold estimate (§6 R1), the bfcache reverse (`onPageShow`, it uses the heap origin of the flip that left), the S5 cover/uncover, the head script.
Reserved for later (P2): a deep-linked case (no origin) could still send the reader to its own tile (`<main data-tile>` → a new `FX.scroll.tileY(id)` in fx-scroll). Until then it lands on `#work`, as today.

### 1.6 Probes that name `case.html`

Moved to `case-spherenode.html` in the same commit (the stub would make Playwright's `goto` race a client redirect):

- `scripts/probes/water/w5_case.mjs:14`, `w5b_case.mjs:7`, `w7_band.mjs:61, 100, 170, 334` (`?debug=1` kept).
- `scripts/probes/water/w8_claims.mjs:46`: iterate `index.html` plus every `case-*.html` (glob), not `["index.html", "case.html"]`.
- `scripts/probes/rivista-motion/blocks.mjs:41`, `idle.mjs:128`.
- `scripts/probes/rivista-motion/restore.mjs:346` and `:373`: the regex `/case\.html/` → `/case-[a-z0-9-]+\.html/` (tile 01 now opens `case-spherenode.html`).
- `scripts/probes/rivista-motion/s4.mjs` needs no edit (it clicks tile 01 and reads `location.pathname`).
- `_rev_*` review scripts are one-offs; leave them.

---

## 2. The case template

### 2.1 Anatomy (reading order)

```
page-hero        overline · h1 (stair) · ornament · lead · CTA row (btn | printed fields) + "Back to the index"
Fig. 01          capture (S4 lands here) | typographic plate
01 · What it is  stair headline · lead (the work in one paragraph) · Stack aside
02 … 0N          the evidence chapters this work has facts for (§2.2), numbered in order
0N · On file     the record: studio/client, role, period, place, team, access, links, declared gaps
Next work        NN · label → , S5
#contact band    "Write to me." with the water (one renderer)
```

The chapter numbers and the Fig. numbers are generated; the data only orders the chapters.

### 2.2 Chapter types

| Type | Markup it reuses (all exist today) | Required? | Data |
|---|---|---|---|
| `hero` | `rv/parts/c-main.case.html:1-13` verbatim: `.page-hero.sc-sheet`, `.overline[data-reveal="hero"]`, `h1#case-h.d1.page-title[data-lines="hero"]`, `.ornament`/`.orn-rule`, `.lead[data-lines="hero-lead"]`, `.cta-row` with `.btn[data-wipe="hero"]` and `.ghost[data-reveal="hero"][data-back="origin"]` | always | `overline`, `titleLines`, `ornament`, `lead`, `cta`, `fields` |
| `fig-capture` | `:14-19`: `figure.media-full > .frame.r-169[data-media="case-hero"][data-case-hero] > .frame-inner.over[data-parallax] > img` + `.caption-row` with the `sc-roll` "Visit" link | capture cases (01, 04) | `fig` |
| `fig-plate` | `figure.media-full > .frame.case-plate[data-media="case-hero"] > .sc-plate` (the tile plate's markup, `c-main.index.html:41`) + `.caption-row` (two spans, no link). **No** `data-case-hero` (that attribute means "a capture S4 can land on"), no `data-parallax` (nothing inside to drift). | the seven type cases | `fig` |
| `what` | `:22-37` without the replaced list: eyebrow, `h2.d1.stair[data-lines]`, `.split.s-57.c-what-body` with `.lead[data-lines="lead"]` and the `.stack` aside | always | `headline[]`, `lead`, `stack` |
| `replaced` | `:26-29`: the eight-tool strike grid + "→ SphereNode" | SphereNode only | `tools[]` |
| `measured` | `:47-88`: `.metric-list` of `.metric[data-bars]` rows, `.from`/`.arr`/`.to`, `.bars` (aria-hidden) | when the work has before → after pairs (Sphere AI, Domus Tua) | `rows[]`: `{ label, from, to, unit, src }` or `{ label, value, src }`; `basis` (the "measured on" line) |
| `facts` | `:103-117`: `.facts` of `.fact` (`.num` with `.sc-rise`, `h3.d3`, `.body`) | when the work has single figures | `items[]`: `{ num, title, body, src }`; `num` may be a word |
| `list` | `:89-98`: the `.guard` ordered list (`01`–`0N` rows, a rule each) | when the work's evidence is a set of things, not numbers | `items[]`: `{ t, src }` |
| `schematic` | new: `figure.case-schematic` with an inline ruled SVG (1 px `--ink` boxes, 1 px `--accent` arrows, `.label`-style text), `aria-hidden`, and the same labels as a visible `ol` beside or below it; Fig. 02 caption | Sphere AI, Maintech OMA (the two works with `schematic` in `works.ts`, `W:241`, `W:351`) | `nodes[]`, `outcomes[]` |
| `onfile` | new: `dl.onfile`, hairline rows (`--line`), term in `.label.stone`, value in `.body` / `.d4`; a pending value prints in `--stone` as a field ("URL: pending") | always | `onFile[]` |
| `next` | `:119-128`: `.chapter.next > a.next-link[data-pt-label][data-pt-sub="NN · Next work"]`; the body line is the next case's tile line; the sentence "In this prototype the link returns to the work rail" goes | always | generated from `next` |
| `band` | `:130-137` byte-identical | always | none |

Component sources (searched 2026-10-09, per the routing rule; nothing is installed, the mechanism is re-expressed on the rivista tokens):
- `onfile` takes the hairline-row reading of the 21st.dev **Table** by originui (id 88, "vertical lines"): rows separated by 1 px rules, no radii, no zebra, no card.
- An optional "In this file" contents list under the hero (P2) takes the 21st.dev **Table of Contents** by mohammadshehadeh (id 18113: an IntersectionObserver marks the active heading, smooth scroll respects reduced motion): a static hairline list of the chapter names with anchor links (canon R-19 glide), the active one marked with the existing accent dash. Refused from the same search: the spring-magnified tick rails (zanwei 22596, ruixen 19825: pointer-driven, springs), the "mercury" gooey rail (nikolas-sapa 33300: liquid edge), Magic UI **scroll-progress** (the AT ring is already the honest dial, MC-13), Lucas Marques's **Hairline** isometric figures (36602 and family: pointer-responsive decorative SVG, P9, and the 2D stand-in Alberto rejects), shadcnblocks **casestudy-5** (a bento of cards).

### 2.3 Which chapters each work gets

| | hero | Fig. 01 | what | replaced | schematic | measured | facts | list | onfile | next | band |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 SphereNode | ● | capture | ● | ● | | 1 row (D-C7) | ● | | ● | 02 | ● |
| 02 Sphere AI | ● | plate | ● | | ● | ● | | guardrails | ● | 03 | ● |
| 03 Maintech OMA | ● | plate | ● | | ● | | ● | | ● | 04 | ● |
| 04 sersan.io | ● | capture | ● | | | | ● ● | GPU work | ● | 05 | ● |
| 05 Domus Tua | ● | plate | ● | | | ● | | launch | ● | 06 | ● |
| 06 Brand film | ● | plate | ● | | | | ● | identity, motion | ● | 07 | ● |
| 07 Badante24h | ● | plate | ● | | | | ● | what it does | ● | 08 | ● |
| 08 Voice AI Agent | ● | plate (word) | ● | | | | | does, built with | ● | 09 | ● |
| 09 Supply Chain | ● | plate | ● | | | | | method | ● | 01 | ● |

### 2.4 How a work with few facts still reads finished

The rule: **a short file is a short article, not a long article with holes.**
- Every chapter is earned by facts in its scope (§4.2). No chapter is printed to fill a slot: no "Results coming soon", no empty metric list, no placeholder card.
- The minimum page is: hero, Fig. 01, 01 What it is, one evidence chapter, On file, next, band. The Voice AI Agent (no figure, no link, no photograph) has two evidence chapters of words and still reaches a full scroll at 1440.
- A gap is a **field**, printed where a reader looks for the thing: "URL: pending" where the button would be, "No photograph on file" at the foot of the plate, "Figures: none on file" in the On-file sheet. Never a greyed button, never a fake one.
- Rhythm without padding: chapters alternate the head's side (`stair` / `stair-r`) and the evidence form (facts → list → sheet), so a three-chapter file still has the issue's tempo. The chapter gap is the canon's `clamp(6rem, 14vh, 11rem)`; a short file gets no extra air.
- The type plate is the opener's image: a figure at display scale is a magazine opener, not a missing picture. Its tile plate printed the same figure, so the reader arriving through S5 sees the figure they clicked.

CSS the lane adds to `fx-scroll.css` §10 (WP-C), all on existing tokens:
- `.case-plate`: `.frame` (paper-deep) at **2:1** from 1024 px (`.r-21`, new beside `.r-169`; 16:9 reads empty around one figure), **4:5** below; the `.sc-plate` inside with the figure at `min(22cqi, 34vh)` (the tile's `9vw` cap is for a 76 vw tile), the gap line at the foot, the plate's hairlines at `--line`. The plate rule's hover fill (`.sc-plate-r.is-fig::after`) is off on the case (it is not a link).
- `html.rv-motion.sc-hold [data-case-hero]` (`fx-scroll.css:362`) → `html.rv-motion.sc-hold [data-media="case-hero"]`, so a plain load holds the type plate exactly as it holds a capture (otherwise it prints, is hidden by the curtain at build and replays: a flash).
- `.onfile` (dl grid: term column 12 rem from 768 px, stacked below), `.case-schematic` (SVG max-width 100 %, row on ≥ 768 px and column below, as `Schematic.tsx` does).
- Nothing moves that does not already move: the plate takes the R-08 curtain (`buildMedia`, `data-media`), the facts/list/sheet rows the existing rule + rise ladder, the schematic boxes print with their block (no draw-on of strokes, no count-up, canon §5).

---

## 3. Per work: chapters and exact facts

Copy rules for the renderer's text: headlines are the page's own words (not claims) and contain no digits; every digit printed in `<main>` above the band is in the work's scope (§4.2); numbers are printed final (canon: no count-up); ranges use "–", pairs use "→".

### 3.1 · 01 SphereNode → `case-spherenode.html` (S4 in and out)

The page exists and is approved in its grammar; it is regenerated from the data with D-C7 and the On-file sheet.

| Chapter | Content | Facts (verbatim) | Source |
|---|---|---|---|
| hero | overline | SerSan · Since May 2026 · Live at spherenode.com | P:96, P:101 (the date is the SerSan engagement; the CV gives SphereNode no own date) |
| | h1 / label | SphereNode | P:101, W:118 |
| | ornament | in production | P:101 ("production platform") |
| | lead | A vertical SaaS that replaced eight tools for the Italian retail-trading market, with Sphere AI, its bilingual RAG mentor, built in. | P:102-105 |
| | CTA | Visit spherenode.com → https://spherenode.com | P:45, W:228 |
| Fig. 01 | capture | `/captures/spherenode-1600.webp` (+800w); alt "The spherenode.com home page: a dark trading-community landing with a green accent."; caption "Fig. 01 · spherenode.com" / "Home page, captured September 2026." | `public/captures/PROVENANCE.md` (2026-09-16) |
| 01 What it is | replaced | Circle · Teachable · Zoom · Intercom · HubSpot · Mailchimp · Stripe · Notion → SphereNode | P:102 |
| | headline | Eight tools, / one platform | P:102 ("eight tools") |
| | lead | A production platform for the Italian retail-trading market that replaced eight separate tools with one product: courses, live sessions, payments and entitlements, a Trading Journal and a bilingual AI mentor. | W:172 (from P:102-129) |
| | stack | React 18 · Vite · Supabase (Postgres, RLS, Realtime, pgvector, Edge Functions) · Whop · Cloudflare Stream · Capacitor | P:103-104 |
| 02 Sphere AI (compact) | lead | Sphere AI is the bilingual (IT/EN) RAG mentor inside SphereNode, answering only from the proprietary curriculum. | P:105-106 |
| | 1 measured row | Answer-policy accuracy 52% → 68%, on a 161-question bilingual evaluation set | P:108 |
| | link | "Read the Sphere AI file →" `case-sphere-ai.html` (S5, `data-pt-label="Sphere AI"`, `data-pt-sub="02 · Selected work"`) | — |
| 03 What had to hold at launch | lead | A paywalled product with tiered access, live video, recurring payments and scheduled jobs, where a single defect leaks paid content or strands paying customers. | W:176 (from P:115-123) |
| | fact | **5** Revenue-critical defects closed: the payments-to-entitlement pipeline rebuilt as a tested state machine: access surviving cancellation, disputes and unknown events defaulting to open, empty lookups downgrading paying users, duplicate rows stranding paid customers, out-of-order events resurrecting revoked access. | P:115-117 |
| | fact | **6** Access-control defects closed before launch: among them a tier leak exposing 206 live sessions and 79 transcripts to free accounts, alongside a 33-finding security audit remediated in one batch. | P:118-121 |
| | fact | **21** Silent scheduled jobs: dead for weeks while every dashboard still reported success; root-caused, then the missing monitoring and alerting built. | P:122-123 |
| | fact | **21/49** Production releases as release manager, including the public launch; plus the live-session video pipeline on Cloudflare Stream and the Trading Journal analytics engine. | P:124-129 |
| 04 On file | rows | Studio: SerSan · Sersan Limited · London · Remote — Role: Software & AI Engineer · Creative Lead — Access: public, spherenode.com | P:96-97, W:120-124 |
| next | | 02 · Sphere AI | — |

### 3.2 · 02 Sphere AI → `case-sphere-ai.html` (S5)

| Chapter | Content | Facts (verbatim) | Source |
|---|---|---|---|
| hero | overline | SerSan · Inside SphereNode · Live at spherenode.com | P:96, P:105, P:101 |
| | h1 / label | Sphere AI | P:105, W:235 |
| | ornament | grounded | P:105 ("grounded only in the proprietary curriculum") |
| | lead | SphereNode's bilingual RAG mentor, grounded only in the proprietary curriculum and measured on a 161-question evaluation set. | W:246 (P:105-108) |
| | CTA | Visit spherenode.com | W:338, P:45 |
| Fig. 01 | plate | **68%** · "answer-policy accuracy, from 52%" · "No photograph on file"; caption "Fig. 01 · Answer-policy accuracy" / "On a 161-question bilingual evaluation set." | P:108, tile `c-main.index.html:41` |
| 01 What it is | headline | It asks / before it guesses | P:112 |
| | lead | Sphere AI is the bilingual (IT/EN) RAG mentor inside SphereNode. It answers only from the platform's proprietary curriculum: semantic chunking and embeddings in pgvector, tier-aware retrieval with a curated fast path for canonical answers, and a generation layer with an LLM relevance grader on top. | W:273, P:105-107 |
| | stack | RAG · pgvector · Embeddings · Semantic chunking · LLM relevance grader · LLM evaluation · Guardrails · Supabase | W:243 (P:103, P:105-107) |
| 02 The pipeline (Fig. 02 schematic) | nodes | Proprietary curriculum → Semantic chunking → Embeddings in pgvector → Tier-aware retrieval (with a curated fast path) → Generation → LLM relevance grader | P:105-107 |
| | outcomes | Answers · Asks for clarification · Refuses | P:112-113 |
| 03 Measured, before and after | basis | 161-question bilingual evaluation set | P:108 |
| | rows | Answer-policy accuracy 52% → 68% · Over-answering on questions it should withhold 56% → 16% · Clarification precision 75% → 94% · Clarification recall 32% → 90% · Unsupported claims 1.9% → 0.6% · Citation correctness 100%, with zero locked-content leaks and zero fabricated citations | P:108-111; W:288-337 |
| | bars | widths = the percentages themselves (`--w:52%` / `68%` …), as the built page does | geometry, not printed |
| 04 The guardrails | list | Asks for clarification instead of guessing. · Refuses questions built on a false premise or asking for unsafe actions. · Requires live evidence before answering anything time-sensitive. · Never lets static FAQ content stand in for current market information. · Reads the Trading Journal only as a consent-gated, owner-only source, personal data excluded by default. | P:112-114, P:125-126 |
| 05 On file | rows | Studio: SerSan · Sersan Limited · London · Remote — Role: designed and built it (Software & AI Engineer) — Lives in: SphereNode, spherenode.com — Evaluation: 161-question bilingual set, IT/EN | P:97, P:105, W:239, P:108 |
| next | | 03 · Maintech OMA | — |

### 3.3 · 03 Maintech OMA → `case-maintech-oma.html` (S5)

| Chapter | Content | Facts (verbatim) | Source |
|---|---|---|---|
| hero | overline | SerSan · Client system · No public address | P:96, P:32 ("cliente, interno"), W:352 |
| | h1 / label | Maintech OMA | P:130 |
| | ornament | database-first | P:137 |
| | lead | Custom ERP for a heavy-vehicle workshop of about 50 staff, founded from the application scaffold to the first database schema. | W:356 (P:132-136) |
| | CTA | none; field "No public address: a client system" | W:352; P:76 (still requested) |
| Fig. 01 | plate | **9** · "roles, default-deny on every table" · "No photograph on file"; caption "Fig. 01 · Nine roles" / "Permissions held in the database, not in tokens." | P:137-138, tile `:51` |
| 01 What it is | headline | Founded / from the scaffold | P:134 |
| | lead | A custom ERP for a heavy-vehicle workshop with about 50 staff across mechanics, mechatronics, auto-electrics, bodywork and refrigeration. I founded the system: the application scaffold, the 'Diesel & Safety' design system (design tokens, light and dark themes, a component library) and the first database schema the rest of the product was built on. | W:387, P:132-136 |
| | stack | Vite · React 18 · TypeScript · Supabase (Postgres 17, RLS, Edge Functions) · TanStack Query | P:130-131 |
| 02 The domain core (Fig. 02 schematic) | nodes | Customers → Vehicles (equipment, inspection deadlines) → Job orders (six-phase state machine, role-gated transitions, safe numbering under concurrency) → Parts catalogue (multi-supplier price comparison) → Purchase orders. The six phases are drawn as 01–06, **unnamed** (D-C8). | P:140-142 |
| 03 What holds at the database | fact | **9** Roles: default-deny access rules on every table, per-site data segregation, permissions held in the database rather than in tokens. | P:137-138 |
| | fact | **3** Live defects: exposed by the first database test suite written against the model, fixed before they reached production. | P:138-139 |
| | fact | **6** Phases: job orders on a state machine with role-gated transitions and safe numbering under concurrency. | P:140-141 |
| | fact | **10** Trade portals: a connector console, article-level price comparison and a caching layer that never degrades a good supplier response; and a high-severity privilege escalation closed that let any user with price access alter where supplier credentials were sent. | P:143-145 |
| 04 On file | rows | Studio: SerSan — Client: a heavy-vehicle workshop, about 50 staff — Role: founded the system and its architecture — Access: client system, no public address — Photograph: none on file | P:96, P:132, P:134, W:352, P:76 |
| next | | 04 · sersan.io | — |

### 3.4 · 04 sersan.io → `case-sersan-io.html` (S4 in and out)

| Chapter | Content | Facts (verbatim) | Source |
|---|---|---|---|
| hero | overline | SerSan · Jun – Sep 2026 · Live at sersan.io | P:148 |
| | h1 / label | sersan.io | P:148 |
| | ornament | WebGPU-first | P:150 |
| | lead | The studio's WebGPU-first site: one continuous 3D canvas carrying seventeen scroll-locked scenes, built alone between June and September 2026. | W:437 (P:148-151). Keep it ≤ 2 lines at 1440 (§6 R1). |
| | CTA | Visit sersan.io → https://sersan.io | P:45, W:510 |
| Fig. 01 | capture | `/captures/sersan-io-1600.webp` (+800w); alt "The sersan.io intro: the SerSan particle mark above a glowing wordmark." (the tile's); caption "Fig. 01 · sersan.io" / "Intro, captured September 2026." | `public/captures/PROVENANCE.md` (2026-09-16); tile `c-main.index.html:61` |
| 01 What it is | headline | One canvas, / seventeen scenes | P:151 |
| | lead | I rebuilt the studio's public site single-handedly, as engineer and designer, into a WebGPU-first experience: one continuous 3D canvas carries seventeen scroll-locked scenes across the site, with an automatic fallback for machines without WebGPU and recovery if the graphics context is lost. | W:468, P:148-152 |
| | stack | Next.js 16 · React 19 · three.js (WebGPU/TSL) · React Three Fiber · GSAP + Lenis · Tailwind v4 · Vercel | P:149 |
| 02 Written in compute shaders | fact | **17** Scroll-locked scenes on one continuous 3D canvas. | P:151 |
| | fact | **48,000** Particles in the wordmark intro. | P:153 |
| | fact | **80,000** Cells in the portrait morph, lit from generated depth maps. | P:153-154 |
| | list | A particle brand mark · A raymarched black hole · A custom refractive crystal material · A selective-bloom post-processing chain | P:153-155 |
| 03 On every device | fact | **100** Lighthouse Accessibility. | P:157 |
| | fact | **100** Lighthouse SEO. | P:157 |
| | body | A device-tiering system runs the full scene on weak mobile GPUs at a quarter of the pixels, without removing a single effect; reduced-motion paths and non-JavaScript equivalents for every 3D section; mobile layouts rebuilt, accessible touch targets restored after tracing every undersized control to a single styling rule, the mobile home page cut to two-thirds of its length. (No "0" figure: D-C9.) | P:156-161 |
| 04 On file | rows | Studio: SerSan — Role: sole engineer and designer — Period: Jun – Sep 2026 — Access: public, sersan.io | P:148, W:430 |
| next | | 05 · Domus Tua | — |

### 3.5 · 05 Domus Tua → `case-domus-tua.html` (S5)

| Chapter | Content | Facts (verbatim) | Source |
|---|---|---|---|
| hero | overline | SerSan · Client work · URL: pending | P:96, W:523, P:76 |
| | h1 / label | Domus Tua | P:162 |
| | ornament | cinematic | P:163 |
| | lead | Real-estate brand platform: a cinematic scroll experience with complete reduced-motion and no-JavaScript alternatives, and mobile LCP cut from 4.75 s to 1.74 s. | W:527 (P:162-166) |
| | CTA | none; field "URL: pending" | W:585, P:76 |
| Fig. 01 | plate | **1.74 s** · "mobile LCP, from 4.75 s" · "No photograph on file"; caption "Fig. 01 · Mobile largest-contentful-paint" / "Measured on real phones." | P:165, tile `:71` |
| 01 What it is | headline | A cinematic scroll, / art-directed | P:163 |
| | lead | A real-estate brand platform. I art-directed and built the site's cinematic scroll experience (animated intro, arched page transitions, chapter-based storytelling) with complete reduced-motion and no-JavaScript alternatives and no layout shift, then made it fast on real phones and prepared its launch. | W:550, P:163-168 |
| | stack | Next.js 16 · GSAP · Lenis · Supabase | P:162 |
| 02 Fast on the phone in your hand | lead | The mobile delay was traced to the cookie banner and the intro rebuilt to run in CSS rather than JavaScript. The cinematic experience stayed, with no layout shift. | P:164-166 (the home ledger's wording, `c-main.index.html:183`) |
| | rows | Mobile largest-contentful-paint 4.75 s → 1.74 s · Mobile blocking time 572 ms → 274 ms | P:165-166, P:34; W:565-581 |
| | bars | before 100 %, after 36.6 % and 47.9 % (after ÷ before, computed by the renderer, aria-hidden) | geometry |
| 03 Prepared for launch | list | Legacy URL redirects verified against the live listing catalogue · Structured data for listings, breadcrumbs and FAQs · The site's AI assistant persona, with its identity and safety rules | P:167-168 |
| 04 On file | rows | Studio: SerSan — Role: art direction and build — URL: pending — Photograph: none on file | P:96, P:163, P:76 |
| next | | 06 · Brand film | — |

### 3.6 · 06 SerSan brand identity & brand film → `case-sersan-brand.html` (S5)

| Chapter | Content | Facts (verbatim) | Source |
|---|---|---|---|
| hero | overline | SerSan · Identity and film · Film link: pending | P:169, P:76, P:79 |
| | h1 | Brand identity / and brand film | P:169, W:592 |
| | label | Brand film | tile `:80` |
| | ornament | concept to final cut | P:172 |
| | lead | The SerSan visual identity (hexagonal mark, custom display typeface, colour system) and a 64-second 4K brand film in fourteen scenes, directed and produced from concept to final cut. | W:602 (P:170-173) |
| | CTA | Visit sersan.io (the identity carried across the website) + field "Film link: pending" | W:655-656, P:170-171 |
| Fig. 01 | plate | **64 s** · "in 4K, fourteen scenes" · "No photograph on file"; caption "Fig. 01 · The brand film" / "Directed and produced, concept and script to final cut." | P:172-173, tile `:81` |
| 01 What it is | headline | One identity, / site to film | P:170-171 |
| | lead | I designed the SerSan visual identity, the hexagonal mark, a custom display typeface and the colour system, and carried it across the website, the 3D scenes and the video work. I then directed and produced the studio's brand film. | W:625, P:170-173 |
| | disciplines (stack slot) | Art direction · Motion graphics · VFX · 3D · Video | P:169 |
| 02 The identity | list | The hexagonal mark · A custom display typeface · The colour system · Carried across the website, the 3D scenes and the video work | P:170-171 |
| 03 The film | fact | **64 s** In 4K, from concept and script to final cut. | P:172-173 |
| | fact | **14** Scenes: a narrative built on the studio's positioning. | P:173 |
| | fact | **4K** Kinetic typography throughout. | P:176 |
| | list | A light orb that ignites each interface element it passes · Hexagon screen transitions · 3D product scenes · A closing morph from the final line into the brand mark · Post-production end to end: compositing, colour and a sound-design pass timed to the cut | P:174-177 |
| 04 On file | rows | Studio: SerSan — Role: art direction · motion graphics · VFX · 3D · video — Film link: pending — Still: none on file | P:169, P:76, P:79 |
| next | | 07 · Badante24h | — |

### 3.7 · 07 Badante24h → `case-badante24h.html` (S5)

| Chapter | Content | Facts (verbatim) | Source |
|---|---|---|---|
| hero | overline | ALS MCL Civitanova · Freelance · Jan 2026 – Present | P:178-179 |
| | h1 / label | Badante24h | P:180 |
| | ornament | in production | P:180 ("production PWA") |
| | lead | Production PWA matching families with caregivers in the Italian home-care market. | P:180, W:675 |
| | CTA | none; field "URL: pending" | W:727, P:76 |
| Fig. 01 | plate | **Sub-second** (word) · "geospatial caregiver search, PostGIS 3" · "No photograph on file"; caption "Fig. 01 · Caregiver search" / "GiST indexes, WGS-84 geography." | P:185-186, tile `:91` |
| 01 What it is | headline | Families and caregivers, / in real time | P:180, P:183 |
| | lead | A production PWA that matches families with home-care caregivers across the Italian domiciliary-care market, architected and shipped on Next.js 15 App Router, React 19, TypeScript strict and Supabase. | W:702, P:180-182 |
| | stack | Next.js 15 · React 19 · TypeScript · Supabase · PostGIS · Serwist (PWA) · Web Push (VAPID) · Leaflet · Sentry · GitHub Actions | W:672 (P:181-192) |
| 02 What it does | list | Full offline support via a custom Service Worker (Serwist) and VAPID-signed Web Push notifications · Real-time messaging between families and caregivers on Supabase Realtime (WebSocket), with integrated push · Sub-second geospatial search with PostGIS 3 (GiST indexes, WGS-84 geography), Leaflet maps and open-source geocoding (Photon + Nominatim), no paid map API | P:181-187 |
| 03 Hardened | fact | **0** Known auth vulnerabilities at launch: Row-Level Security on every sensitive table, RBAC middleware, HSTS, a restrictive CSP whitelist, VAPID-signed push. | P:188-189 ("zero") |
| | fact | **3** Runtime layers under Sentry: client, server and edge, with a tunnel route bypassing ad-blockers. | P:190-191 |
| | body | A localised IT/EN admin dashboard for caregiver identity verification, server-side image optimisation (Sharp), CI/CD on GitHub Actions. ("<1 s" is not printed: D-C9.) | P:191-192 |
| 04 On file | rows | Client: ALS MCL Civitanova — Role: Full-Stack Developer · Freelance — Period: Jan 2026 – Present — Place: Marche, Italy — URL: pending | P:178-179, P:76 |
| next | | 08 · Voice AI Agent | — |

### 3.8 · 08 Voice AI Agent for Microsoft Teams → `case-doit-voice-ai-agent.html` (S5) — the thin file

| Chapter | Content | Facts (verbatim) | Source |
|---|---|---|---|
| hero | overline | DOIT S.r.l · Internship · Nov 2025 – Feb 2026 | P:193-194 |
| | h1 | Voice AI Agent / for Microsoft Teams | P:195, W:734 |
| | label | Voice AI Agent | tile `:100` |
| | ornament | hands-free | P:195 |
| | lead | Hands-free appointment management in Teams from audio notes: create and update meetings, search colleagues and Dynamics 365 contacts, send invitations. | W:745, P:195-198 |
| | CTA | none (no link on file); the ghost "Back to the index" alone | W:766-783 (no `links`) |
| Fig. 01 | plate | **Hands-free** (word) · "appointments in Microsoft Teams, from audio notes" · "No photograph on file"; caption "Fig. 01 · Voice to calendar" / "No figure on file." | P:195-196 |
| 01 What it is | headline | Spoken intent, / calendar actions | P:195-198 |
| | lead | A voice AI agent inside Microsoft Teams that turns spoken intent into calendar and CRM actions, for field users who manage appointments without typing; real-time speech input was a feature previously absent from the client's toolset. | W:768, W:780, P:195-202 |
| | stack | Azure Speech · Copilot Studio · Power Automate · Dynamics 365 · Angular · TypeScript | W:742 (P:197-199) |
| 02 What it does | list | Creates and updates meetings · Searches colleagues and Dynamics 365 contacts · Adds contacts · Sends invitations — all from natural-language speech | P:196-197 |
| 03 How it is built | list | Real-time speech-to-text with Azure Speech Services · Orchestration in Copilot Studio and Power Automate · A Pro-Code Angular + TypeScript front-end bridging the Low-Code automation layer, one UX across Teams and the standalone web app | P:197-202 |
| 04 On file | rows | Company: DOIT S.r.l — Role: AI & Software Developer · Internship — Period: Nov 2025 – Feb 2026 — Place: Fabriano, Italy — Figures: none on file — Photograph: none on file | P:193-194 |
| next | | 09 · Supply Chain | — |

**Missing:** any figure (`W:766-783` has no `metrics`; `P:37` has no number), any link, any still. The tile today prints "—" and "no figure on file" (`c-main.index.html:101`). Recommended (WP-C, one edit): the tile takes the same word plate as the case ("Hands-free"), so the issue never prints a bare dash as its picture; the "No figure on file" gap moves to the caption.

### 3.9 · 09 Agricultural Supply Chain Platform → `case-agricultural-supply-chain.html` (S5)

| Chapter | Content | Facts (verbatim) | Source |
|---|---|---|---|
| hero | overline | University of Camerino · Software Engineering exam · Public on GitHub | P:239-241 |
| | h1 | Agricultural / supply chain | P:239 |
| | label | Supply Chain | tile `:110` |
| | ornament | team of three | P:245 ("team of 3") |
| | lead | Multi-actor supply-chain platform with 10 roles, built by a team of 3 as the Software Engineering exam project at the University of Camerino. | W:799, P:241-245 |
| | CTA | Read the repository → https://github.com/daveeCity/IDS_GROUP_PROJECT | P:240, P:45 |
| Fig. 01 | plate | **10** · "roles, built by a team of three" · "No photograph on file"; caption "Fig. 01 · Ten roles" / "Producers, curators, animators, buyers." | P:243-245, tile `:111` |
| 01 What it is | headline | Ten actors, / one chain | P:243 |
| | lead | A multi-actor platform modelling an agricultural supply chain with 10 roles (producers, curators, animators, buyers), built as the Software Engineering exam project by a team of 3. | W:822, P:243-245 |
| | stack | Java · Spring Boot · Spring Security · PostgreSQL · JWT · REST · Unified Process · Design Patterns · UML | P:241-242 |
| 02 The method | list | The Unified Process, from requirements and use-case modelling to a layered Spring Boot implementation · MVC, Repository + Service Layer, GRASP principles · JWT-based RBAC on Spring Security · Gang-of-Four design patterns throughout · A relational PostgreSQL schema linking producers, products, certifications, events and marketplace orders, exposed via REST APIs with geographic search · Full UML artefacts | P:244-248 |
| 03 On file | rows | University: University of Camerino — Course: Software Engineering exam project — Team: 3 — Repository: public on GitHub — Period: not on file | P:239-245 |
| next | | 01 · SphereNode (wrap) | — |

**Missing / forbidden:** no date for this project (`W:792` is "B.Sc."); `P:49` lists "2024" and "Backend Engineer" as **not in the CV**: neither may appear.

### 3.10 The home (`index.html`) after this lane

Only the nine `href`s change (and optionally tile 08's word). The rail captions, plates, the ledgers and the capabilities stay; the claims gate (§4) now covers them too, with the tile plates checked against their own work's scope.

---

## 4. The claims gate for the prototype: `scripts/check-claims-proto.mjs`

Run after `node public/proto/rivista/assemble.mjs`. Exit 1 on any miss. No dependencies (Node 22). It is stricter than the Next app's gate (`scripts/check-claims.mjs`), which only asks whether a number appears anywhere in §3/§9: a figure from one work printed on another passes there and fails here.

### 4.1 What it reads

- `PRODUCT.md` §3 and §9 (sliced as `check-claims.mjs:26-32` does).
- `rv/parts/cases.json`.
- `rv/index.html` and every `rv/case-*.html` (glob, so a tenth case is covered without an edit). The stub `case.html` is skipped.

From each page it keeps the **reader-visible text**: it drops `<script>`, `<style>`, comments and `aria-hidden="true"` subtrees, and keeps the text nodes plus the values of `alt`, `aria-label`, `title`, `data-pt-label`, `data-pt-sub` (both are printed on the S5 cover) and `<title>`. Entities are decoded (`&amp;`, `&nbsp;`, `&#8239;`).

### 4.2 Scopes

| Region | Scope (the PRODUCT text a number must appear in) |
|---|---|
| `index.html` `<main>` (except the band), and every page's header, footer, band and `<title>` | global: §3 + §9 (as `check-claims.mjs`) |
| A tile `[data-tile-id="NN"]` on the index | its work's scope (below) |
| A case page's `<main>` up to the band | its work's scope, read from `<main data-case>` |

Work scopes are §3's item for the work plus a §9 block cut between two anchor strings (anchors, not line numbers, so an edit of PRODUCT does not break the gate); every SerSan work also gets the SerSan header block (`SerSan — AI Studio` … `Work delivered at SerSan:`, P:96-100):

| slug | §3 item | §9 from anchor | §9 to anchor |
|---|---|---|---|
| spherenode, sphere-ai | 1 (P:31) | `SphereNode · production platform` | `Maintech OMA — workshop ERP` |
| maintech-oma | 2 (P:32) | `Maintech OMA — workshop ERP` | `--- page 2 ---` |
| sersan-io | 3 (P:33) | `sersan.io — studio website` | `Domus Tua — real-estate` |
| domus-tua | 4 (P:34) | `Domus Tua — real-estate` | `Brand identity & brand film` |
| sersan-brand | 5 (P:35) | `Brand identity & brand film` | `ALS MCL Civitanova` |
| badante24h | 6 (P:36) | `ALS MCL Civitanova` | `DOIT S.r.l` |
| doit-voice-ai-agent | 7 (P:37) | `DOIT S.r.l` | `Istituzione Paritaria Scuole Boccaccio Jan 2019` |
| agricultural-supply-chain | 8 (P:38) | `Agricultural Supply Chain Platform · Academic` | `Personal & open-source work` |

Plus one explicit, cited extra per capture case: the capture year ("captured September 2026") from `public/captures/PROVENANCE.md`. The table lives in the script, never in the data.

### 4.3 Checks

1. **Every number in scope.** Tokens and normalisation as `check-claims.mjs:43-58` (thousands "48,000"/"48.000", decimal comma "4,75", "%" stripped; a digit glued to a letter on its left is an identifier: "ES2024", "v4", "WebGL2"); number words of the CV count as digits (the `WORDS` map of `check-claims.mjs:35-41`, "zero" … "twenty", "fifty"). Note that "3D" and "4K" yield 3 and 4: both are in the scope of every page that prints them. Whitelist, and only this: **two-digit zero-padded indices** `01`–`09` (chapter, figure, list and rail indices are always zero-padded; a claim never is), and the rail total `/ 09`. Years are **not** whitelisted on a case page: they must be in scope too, which catches a "2024" on the UniCam page (P:49). A tech version ("React 19", "Postgres 17", "PostGIS 3") is checked like any number: it is in its work's §9 block.
2. **Pairs as pairs.** Every `measured` row with `from`/`to` must match one PRODUCT pair in scope: `from` … (`→` or `to`) … `to`, units and decimal comma normalised ("4,75 s → 1,74 s" in §3 matches "4.75 s → 1.74 s"; "from 4.75 s to 1.74 s" in §9 too).
3. **No hand-typed numbers.** Every number printed in a case's `<main>` (outside the whitelist) is also in that case's `cases.json` entry. The template carries no digits.
4. **Tile ↔ case.** Each tile's plate figure equals its case's Fig. 01 figure, and is in that work's scope.
5. **Bar geometry.** Each `.bars` width equals the value the renderer computes from the row (the percentage itself, or after ÷ before for time rows). Geometry, not a claim, checked against the data.
6. **Forbidden strings** (case-insensitive, whole page): the `P:49` list ("five years", "Selected Work 2021", "Lodestar", "<5min", "96 commits", "Backend Engineer", "Based in Camerino", "TBD", "Project I"), "real caustics", "sun glints", "physically accurate", and the company e-mail domain `sersan.dev` (`P:45`: never published).
7. **Every `src` resolves.** Each `P:n` / `P:a-b` in `cases.json` points inside §3 or §9, and the cited lines contain at least one of the fact's numbers (a cheap guard against a stale citation).

Output: one `MISS  <page>  "<token>"  …context…  (scope: <slug>)` line per failure, then a per-page summary (`numbers checked / in scope / whitelisted`). Its acceptance test is part of the build (§5 B2): seeding "68%" on the Maintech page, "2024" on the UniCam page and "21" on the Domus page each exits 1.

`scripts/probes/water/w8_claims.mjs` keeps its own job (figcaptions, `.hr-cap`, the colophon carry no numeric token) and iterates all case pages (§1.6).

---

## 5. Build order for the lane

Each step ends with `node public/proto/rivista/assemble.mjs` and `--check`; nothing is "done" without the visual proof of B8. Probes headless only (`launch()` from `scripts/probes/water/lib.mjs`); the static server on 5178 is already running and is never stopped. The director commits.

| Step | Work | Acceptance |
|---|---|---|
| **B0** | Baseline: `assemble --check`; run `w5_case`, `w7_band`, `s4`, `restore`, `blocks --case`, `idle --case` on today's tree; screenshot `case.html` at 1440×900 and 390×844 @2. | Numbers and frames on disk to compare against. |
| **B1** | Write `cases.json` from §3, every fact with its `src`. | JSON parses; nine entries; tiles 01–09 in order. |
| **B2** | `check-claims-proto.mjs` first, run on the data and today's `index.html` / `case.html`. | OK on today's pages; the three seeded errors of §4.3 each exit 1. |
| **B3** | `c-main.case.mjs` + `assemble.mjs` (§1.3–1.4); generate `case-spherenode.html` only. | A DOM diff of its `<main>` against today's `case.html` shows only: the next link (href, label, body line), D-C7's compact chapter 02, the new chapter 04 On file, `data-back="origin"`. Then retire `parts/c-main.case.html`. |
| **B4** | `fx-scroll.css` §10 rules (§2.4). | `/styleguide`-level check by eye: plate, sheet and schematic at 1440 and 390 in V1. |
| **B5** | Generate the other eight; change the nine tile hrefs (and tile 08's word, optional); the `case.html` stub. | `--check` passes the structural asserts; the claims gate passes all ten pages. |
| **B6** | `fx-nav.js` N1–N5 (§1.5). | `s4.mjs` unchanged numbers for tile 01; the same run for tile 04 (`__nvDrift` cold and warm reported); new: S5 forward from tile 07 and "Back to the index" lands with `railProgress()` within 0.01 of the origin and tile 07 in view (1440) / the phone rail's `scrollLeft` within 2 px (390); the N1 walk (01 → 02 → 03 → 04 → Back) ends in an S5 back, never a flip into tile 01; "About" from a case lands on `#path`. |
| **B7** | Probe URLs (§1.6); new `cases.mjs`: for each of the nine pages at 1440×900 and 390×844 @2: console 0 errors (one warn allowed on `?gl=0`), no horizontal overflow, one `h1`, the band host present and `fx:gl:state` reaching `run` or `sleep` after the R3 gate, every next link going to the next case, the 09 → 01 wrap. | `w5_case` and `w7_band` pass on `case-spherenode.html`; `cases.mjs` all true. |
| **B8** | Visual gate: full-page captures of all nine at both sizes (tiled below 16,384 device px, `scripts/probes/_recapture.mjs` style), plus `--reduce` and `?gl=0` for 01, 04, 08; **look at every frame**. | A reviewer can say for each page: the hero reads, the plate reads as an opener and not as a hole, no chapter is empty, the band is there. |
| **B9** | Lighthouse mobile (gl-off lab, `w8_lighthouse` style) on `case-spherenode`, `case-sersan-io`, `case-doit-voice-ai-agent`; the bfcache walk of §6 R3. | ≥ 85 gl-off on each (the home's lab is 86–87); seam numbers within R5's measured rates. |

---

## 6. Risks

| # | Risk | What happens | Mitigation |
|---|---|---|---|
| R1 | **S4 cold landing on sersan.io.** `heroTarget`'s cold estimate (`fx-nav.js:500-512`) assumes SphereNode's hero skeleton: a one-line title, a lead of about two lines, a CTA row, the 16:9 plate at ≈ 0.69 vh. | A taller sersan.io hero moves the plate down: the arrival re-points further (MC-07 keeps it on one clock, but a long re-point reads as a second push). | Keep the 04 hero to the same skeleton (§3.4: one-line title, lead ≤ 2 lines at 1440, one button). B6 reports `__nvDrift` cold; above 40 px, shorten the lead. The warm cache (`cacheHero`, per path) lands within 2 px from the second visit. |
| R2 | **The sersan.io capture is too heavy for the hand-over.** `sersan-io-1600.webp` is 198,486 bytes; `toData` hands a data URL over only below 160,000 (`fx-nav.js:556`). Desktop picks the 1600w on the rail. | The arriving page paints the travelling image from the network: the blank-overlay frames FIX D5 removed (≈ 300 ms when the server revalidates) come back for tile 04 only. The 800w (27 KB) on a phone is fine. | Measure first (B6 strip at the seam). Fix by one of two: raise the cap to 224 KB if the commit task stays < 8 ms with the larger record (fx-nav, WP-A), or re-encode the 1600w at ≤ 155 KB with `scripts/capture-sites.mjs` and update `PROVENANCE.md` and its EXIF / sidecar (the raster provenance rule). Prefer the cap: the capture stays untouched. |
| R3 | **bfcache and one engine per case page.** Each case page links its own WebGPU band device once the R3 still-page gate opens (≈ fx:ready + 2.4 s idle; `CONTRACTS.md` §21). Chrome keeps up to six documents; walking 01 → 09 by next links is eight cuts, so from the seventh each store evicts the oldest page and its context teardown runs ≈ 150 ms after a commit (R5). | Rare seam stalls (R5 measured 1/40 case-first, a 100–117 ms LoAF before a case's first paint), and up to six live band devices held in the cache. | Accepted as measured by R5 (the rule "never release under a cut" stands; the realm-frame release is a product decision not taken). B9 walks 01 → 09 → 01 twice with the bfcache on (plain Chrome profile, headless) and logs `domInteractive`, LoAFs before first paint and `device.lost` events: pass = no `device.lost`, stalls at or below R5's rate. Keep every case page bfcache-eligible: no `unload` handler, no `no-store`. |
| R4 | **The band costs the same on every page.** `requestAdapter` is one ≈ 180 ms task on the GPU main thread per new document (R3); a reader who scrolls continuously never gives the gate a still page. | The band shows paper until the first pause; the drops arrive then (by design). | Nothing to change: R3/R4 already gate a plain case load and an arrival. Do not add a second renderer (canon §5) and do not mount anything else on the band host (P14). |
| R5 | **Stale origin and wrong back flights.** N1 / N4. | A capture flown into another work's tile; "About" landing on the rail. | N1 and N4 are required, not optional; B6 tests both. |
| R6 | **Cover label vs title.** The S5 cover prints `data-pt-label` ("Brand film") and the page then raises its h1 ("Brand identity and brand film"). | A one-beat mismatch on 06, 08 and 09. | Accepted: the label is the work's short name and the h1 its full name, and both are true; the structural assert keeps the label identical everywhere it appears (tile, next link, `<title>`). |
| R7 | **Probe churn.** Eleven probe lines move to `case-spherenode.html` (§1.6). | A water-lane probe run against the stub could race the client redirect. | All moved in the same commit; the stub exists for people, not probes. |
| R8 | **The type plate reads as a hole.** | A big paper-deep box with one number can read as "image missing". | 2:1 not 16:9 on desktop, the figure at display scale, its rules and the gap line printed as a ledger page (the tile plate's grammar, FIX J3); judged on the B8 frames, and the caption names the figure, never the absence. |
| R9 | **Facts drift between the home, the cases and `works.ts`.** | The same figure worded three ways. | The gate's tile ↔ case check (§4.3 4); the port to Next later regenerates `works.ts` study fields from `cases.json`, not the other way round. |

---

## 7. Hand-off notes for the director

- Some of the prose in `works.ts` is framing written from the CV, not CV sentences (for example sersan.io's problem "…without a second team", `W:472`). The case pages use the CV's own wording where §3 gives it, and `works.ts` only where its sentence is a faithful condensation; nothing on a case page comes from `works.ts` alone.
- A newer CV sits untracked at `Dati/CVAlbertoTuveri-2026-09.pdf`. This spec cites `PRODUCT.md` only; if PRODUCT is re-transcribed from it, re-run the gate: every scope moves with the anchors.
- Alberto has two open questions on file that this lane prints as gaps and does not answer: stills or URLs for Maintech OMA, Domus Tua, Badante24h and the brand film (`P:76`), and whether the brand film may be shown (`P:79`).
