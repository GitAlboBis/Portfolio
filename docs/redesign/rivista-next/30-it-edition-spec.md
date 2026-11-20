# 30 · The Italian edition: generated pages, one strings source, a native Italian copy

> **As built, 2026-10-11** (commits `6452ceb`, `3a2e319`, `00f4fa5` on `feat/water-hero`). The text below is the plan as written on 2026-10-09 and is left as it was; this note records what the tree holds. The decisions D-I1 to D-I10 were built: generated pages under `rv/it/`, one source of strings, a real control, and **a change of language that is an S5 cut to the twin page and keeps the reader's place, never a swap of the text in place**. Where the build departs from the text:
> - **Where the strings live.** As planned, in two files. `rv/parts/strings.mjs`: every word a template prints, `{ en, it }` by id (default export, plus `LANGS`, `UI`, `S404`, `jsWords`, `READ_BY_MODULES`). `rv/parts/cases.json`: the nine works, every field a twin `{ "en", "it" }`. Not in §2.1: an Italian equal to its English must be marked `same: true`; the only markup a string may carry is `<em>` and `<span style="white-space:nowrap">` (no `.nb` class, no `.sr-only`, `<b>` or `<i>`), and the no-wrap span is exempt from the same-tags check, because it is typography, like a no-break space: each language holds together the words it needs.
> - **Placeholders (§1.3, §2.3).** One `{{META}}` writes the whole head (title, description, robots, canonical, the hreflang set, icons, Open Graph, the JSON-LD), in place of `{{TITLE}}`, `{{DESC}}` and `{{HREFLANG}}`. `{{EN}}` is the built name of `{{EN_ON_IT}}`. `{{I18N}}` is printed on the home only, the one page whose scripts write words. There is no `{{R}}`: `relocate()` in `assemble.mjs` points a page of `it/` one level up for what the editions share, so no partial knows its depth.
> - **Environment (§1.3).** `RV_ORIGIN` (not `RV_SITE`) makes canonical, hreflang and og URLs absolute; `RV_ROBOTS` sets the robots value. `og:locale` is `en_GB` / `it_IT`.
> - **Pages the spec did not know.** The 404 (stage S2) is built in both editions with rooted paths: `rv/404.html`, `rv/it/404.html`. The share cards have an Italian set, `rv/og/it/`, because their words are drawn into the image.
> - **The scripts' words (§2.4).** Keys are read without the `js.` prefix (`FX.t("pre.water")`). The menu button's two names come from `data-nv-open` / `data-nv-close` on the button, not from `FX.t`. There is no `js.sw.sub`: the switcher left the pages in S2.
> - **The place (§1.6, step 2).** `fx-core.js` itself listens for a click on `a[data-lang]` in the capture phase and writes `rv-place` for the twin's path; `fx-nav.js` does not call a `FX.savePlace`. Step 6: no `p` field was added to the origin record; it was already scoped to the case page's own path (`org.path !== location.pathname`), so a case reached through a change of language holds no origin for an S4 back. Not tried separately in this round.
> - **Gates (§2.3, §2.5).** The asserts run in `assemble.mjs --check`: I-1 to I-3 and I-6 to I-9, and, in place of I-4, a comparison of the elements of the two pages of each pair. The parity of the figures (I-5) is check 8 of `scripts/check-claims-proto.mjs`. **The runtime probe `scripts/probes/rivista-i18n/parity.mjs` was not written** (Alberto's process rule of 2026-10-11: no new measurement scripts): the lane tried the switch headless by hand, and the existing `menu.mjs` and `buttons.mjs` ran against `it/` through `RV_BASE`. The existing axe gate ran on two Italian cases, the Italian 404 and the Italian home on 2026-10-11: no violation.
> - **Target size (§1.4).** Padded to at least 24 × 24 px as specified; in the touch menu to a 2.75rem target.
> - **The canon (§1.8).** Recorded in the canon's §0 on 2026-10-11.
> - **The copy (§4).** §4.2 is the first draft. The Italian in the tree was rewritten by the build lane and read by an editor; Alberto's own read, as a native speaker, is still to come.

> **Status:** build contract for the IT lane, 2026-10-09, branch `feat/water-hero`. Written by the localisation architect. I did not edit any product file. Alberto is away and asked us to decide ourselves, so every choice below is already made (§0). The Italian copy in §4 is a finished draft. Alberto (a native speaker) reads it once at R3. That read is a review, not a blocker.
> **Scope:** the static prototype `public/proto/rivista/` (V1 "Carta e cobalto"): `assemble.mjs`, `parts/*` (plus `parts/strings.mjs`, new), `fx-core.js` (three small additions), `fx-nav.js` (five small changes), `fx-hero.js` (DOM strings only, never an `FX.gl` write), `fx-nav.css` (the language control), `fx-core.css` (one utility). New probe: `scripts/probes/rivista-i18n/parity.mjs`.
> **Binding:**
> - `docs/redesign/rivista-motion/10-motion-canon.md`: §0, P3, P12, P14, R-12, R-21, MC-28, the invariants of §8;
> - `docs/redesign/water-hero/30-hero-build-spec.md` §4.4: the caption copy and the "never print" list;
> - `public/proto/rivista/water/engine/CONTRACTS.md`;
> - `_refs/hero-water/05-taste-history.md` §2.3: EN ≡ IT, `html lang` follows the locale;
> - `docs/redesign/rivista-next/20-cases-spec.md`: the nine case pages and `cases.json`. This spec composes with it, see §1.2 and §2.6.
>
> **Facts:** only `PRODUCT.md` §3 and §9. For Italian wording that already exists, the precedents are `src/content/dict.ts` (`it`), `src/content/works.ts` (`it` twins) and `src/data/skills.ts`.
> **Path legend:** `rv/` = `public/proto/rivista/`.
> **Evidence:** three headless probes, all using `launch()` from `scripts/probes/water/lib.mjs`. They live in `C:\Users\alber\AppData\Local\Temp\claude\…\scratchpad\it-edition\`, outside the repo:
> - `inventory.mjs`: counts every visible and announced string;
> - `fit.mjs` and `fit2.mjs`: swap the Italian draft into the live EN page in memory, then measure line counts and overflow at 1440, 1024 and 390 DPR 2;
> - `natural.mjs`: measures the natural width of each stair line.
>
> The results are quoted in §3.7 and §4.1.

---

## 0. What this spec decides

| # | Decision | Why, in one line |
|---|---|---|
| D-I1 | **Separate generated pages** under `rv/it/` (`it/index.html`, `it/case-<slug>.html`), built by `assemble.mjs` from the same partials and one strings source. **No in-place swap.** | SEO and `html lang` from the first byte. The cuts, the route record and every per-path cache already work page by page. The water engine re-measures its band obstacles only at mount. No SplitText or pin rebuild runs at runtime (§1.1). |
| D-I2 | The fake "EN / IT" label becomes a **real control**. The current language is printed and marked `aria-current`. The other one is a link with `hreflang` and `lang` and an accessible name that contains the visible code. Its target is at least 24 × 24 px. | WCAG 2.5.3 Label in Name and 2.5.8 Target Size. The current sr-only "Italian version coming" goes (§1.4). |
| D-I3 | **The URL is the language.** No `Accept-Language` redirect, no cookie, no stored preference in the prototype. Every internal link stays inside its language folder. | It is shareable and crawlable, and it survives bfcache and Back. Nothing can silently flip a reader's language (§1.5). |
| D-I4 | **A language change is an S5 "Tendina" cut.** The sheet carries the destination's own name ("Italiano" / "English") and the edition line. **The reader keeps their place:** the section and the ratio within it travel in the existing `rv-place` record. | One navigation grammar on the whole site (R-12). P3 holds for free. It reuses MC-16's place machinery (§1.6). |
| D-I5 | **One strings source**, `rv/parts/strings.mjs`, keyed by id with EN and IT side by side. It covers the home, the case template, the header, menu, overlays, footer, alt texts, aria-labels, `<title>`, description and the JS-written words. Per-case content lives in `cases.json` (spec 20) as `{ en, it }` twins. | One place per kind of copy. `--check` fails on any missing twin (§2). |
| D-I6 | **Parity is enforced twice.** At build time: same ids, same inline-tag shape, the same figures after decimal normalisation, and no English leaking into the IT text. At runtime: the same count of visible strings per page × viewport, plus a working language cut (§2.5). | The project rule "EN ≡ IT" becomes a gate, not a promise. |
| D-I7 | **Italian conventions:** decimal comma (`1,74 s`, `1,9%`), NBSP between a number and its unit, lowercase months (`set 2026 – oggi`), typographic apostrophe `’`, caporali `« »`, accented capitals from lowercase source (`È`, never `E'`) (§3.3). | The Italian norm, and the precedent already set in `dict.ts`, `works.ts` and `PRODUCT.md`. |
| D-I8 | **The "engineer" ornament stays in English** (`lang="en"`). The case ornament "in production" becomes "in produzione". | In Italy, *ingegnere* is a protected professional title: it requires an engineering degree plus the State exam and the Albo. Alberto's degrees are in Informatica and AI Systems. Roles stay English by project rule anyway, and Italian italic already marks a foreign word (§3.6). |
| D-I9 | **R-21's in-place "dim, swap, rise" recipe is superseded.** MC-28 is re-scoped to "the language cut" (§1.8). | R-21 was written for the in-place model that D-I1 rejects. |
| D-I10 | **The IT edition ships whole.** Every page in both languages lands in one lane, after spec 20's cases lane has landed. Partial coverage fails `--check`. | A toggle must never lead to a missing page. Two lanes rewriting `assemble.mjs` at once is the collision to avoid. |

---

## 1. The mechanism

### 1.1 Generated pages versus an in-place swap

| Concern | Generated pages (chosen) | In-place swap (rejected) |
|---|---|---|
| **SEO** | Each language has its own URL, indexable on its own, with `hreflang` alternates and a self-canonical. | One URL. Crawlers index the EN document only. `hreflang` has nothing to point at. |
| **`html lang`, screen readers, hyphenation, `text-transform`** | Correct from the first byte (`<html lang="it">`). The browser never pronounces Italian with English rules, not even for a frame. | Server HTML says `en`. JS flips it after boot, so the first paint and no-JS readers get the wrong language. |
| **S4/S5 cuts, route record** (`rv-pt` 8 s, `rv-origin` 10 min, `--pt-*` at first paint) | Unchanged. A language change is just another S5 navigation (§1.6). `rv-pt.to === location.pathname` already scopes the record. | A new kind of transition outside the cut grammar, with its own lock, its own exits and its own focus handling. The canon's R-21 needed a separate recipe for exactly this reason. |
| **Per-path caches** (`rv-hero\|<path>`, `rv-hero-rect\|<path>\|…`, `rv-y\|<path>`) | Separate keys per language, for free. This matters: the Italian case lead and title wrap differently, so the case hero's top moves. The S4 cut lands on the cached rect of *its own* page. | The path does not change, so the cached hero rect stays the EN one and the next S4 lands off by the wrap delta. |
| **bfcache, Back** | Back from `it/` restores the EN document from bfcache, already in English, through the existing `onPageShow → reset()` path. | Back after a swap needs `pushState`/`popstate` plumbing that swaps everything again, on a page that may be frozen mid-film. |
| **SplitText and ScrollTrigger** | Each page splits its own text at boot (13 `[data-lines]` on the home, 10 on the case today). There is nothing to rebuild at runtime. The S3 stage and the rail runway measure Italian heights at their first refresh. | All of these must revert and re-split under a dim: 23 splits, the counter-parallax tweens on `#work-h`, the `onBelow` resets. Then the pins refresh with new heights, mid-scroll. That is MC-28's own acceptance risk ("every split rebuilt with no orphan line"). |
| **The water engine** (off-limits) | It mounts fresh on every page. The band keep-out rects (`fx-water.js` `rectBoxes()`, L282-313) are measured at mount on the Italian "Scrivimi." line. | `remeasureRects()` runs only at link, mount, resize and variant change (`fx-water.js` L573, 796, 833, 962). A text swap changes the "Write to me." line box, so the drops would avoid an obstacle that is no longer there. Fixing that needs a new call into `FX.gl` from outside the band host, which canon P14 and the off-limits list forbid. |
| **No JS, failure paths** | It is a plain link, and the page is complete. | No JS means no Italian. |
| **Cost** | One page load per switch. On the cut, the GPU starts only on a still page, as for any arrival. | It saves one load, and pays for it with everything above. |

**Verdict: generated pages.** A language change is a change of edition. In this magazine metaphor that means another printed issue, not a dissolve.

### 1.2 URLs and files

| Page | EN (today) | IT (new, generated) |
|---|---|---|
| Home | `rv/index.html` | `rv/it/index.html` |
| Case | `rv/case-<slug>.html` × 9 (spec 20 D-C1) | `rv/it/case-<slug>.html` × 9 |
| Stub | `rv/case.html` → `case-spherenode.html` (spec 20 D-C2) | none (no old Italian links exist) |

**Why a folder, when spec 20 D-C1 chose flat files.** D-C1's worry is relative URLs. Inside `it/`, every page-to-page link (`index.html#work`, `case-<slug>.html`, the next-work chain) stays **byte-identical to EN** and resolves inside the folder. So neither the partials nor spec 20's renderer need to know the language for their hrefs. Only the **asset** references climb a level. There are exactly nine of them, in two partials, and they get a `{{R}}` prefix (`""` for EN, `"../"` for IT):

| Partial | Reference | Becomes |
|---|---|---|
| `parts/head.html` | `<link rel="stylesheet" href="fx.css">` | `href="{{R}}fx.css"` |
| `parts/head.html` (loader list `JS=[…]`) | `'fx-core.js','fx-water.js','fx-hero.js','fx-scroll.js','fx-nav.js'` | `'{{R}}fx-core.js'` … (5) |
| `parts/b-hero.html` | `src="fx-plate-v1.webp"`, `v2`, `v3` | `src="{{R}}fx-plate-v1.webp"` … (3) |

Everything else is already safe:
- `/captures/…` is root-absolute;
- the engine resolves from the script's own URL (`fx-water.js` L71: `new URL("water/engine/", SCRIPT.src)`);
- the fonts come from gstatic, and no CSS `url()` is relative (checked);
- `fx-nav.js` L1245 (`/\/proto\/rivista\//`) matches `/proto/rivista/it/`.

The production URL scheme (`/` and `/it/` at the domain root) maps one to one.

**One existing bug this exposes (must fix):** `fx-core.js` `syncLinks()` (L92-106) rewrites every internal href to `u.pathname.split("/").pop() + search + hash`, which flattens the directory. The toggle would then point at its own language: `it/index.html` becomes `index.html` on the EN page, and `../index.html` becomes `index.html` (that is, `it/index.html`) on the IT page.

Fix: keep the authored path and rewrite only the query.

```js
const path = h.split(/[?#]/)[0];
a.setAttribute("href", path + u.search + u.hash);
```

### 1.3 Head and SEO, per page and language

`parts/head.html` gains placeholders that assemble fills:

```html
<html lang="{{LANG}}" data-variant="1"{{HOME}}>
…
<title>{{TITLE}}</title>
<meta name="robots" content="noindex, nofollow">          <!-- prototype: both editions stay noindex -->
<meta name="description" content="{{DESC}}">              <!-- spec 20 §1.3 P2 placeholder, now per language -->
{{HREFLANG}}
<script type="application/json" id="rv-i18n">{{I18N}}</script>
```

`{{HREFLANG}}` emits three tags per page: `en`, `it` and `x-default` (pointing at EN), plus a self-referencing `<link rel="canonical">`. Google requires absolute URLs. `assemble.mjs` takes `SITE = process.env.RV_SITE || ""`. With an empty `SITE` it emits root-relative hrefs, which is valid HTML. That is harmless here because the prototype is `noindex`. Production sets the origin.

`{{LANG}}` is `en` or `it`. Do not use `it-IT`: hreflang `it` is the right granularity, because the audience is Italian speakers, not one country.

### 1.4 The language control

**Visible:** the same `EN / IT` in both editions, always in that order. The current code is bold ink. The other is stone and turns accent on hover and focus, like the nav words. There is no roll on it, because it is a quiet control.

**EN page:**

```html
<p class="lang" role="group" aria-label="Language">
  <span class="lang-now" aria-current="true"><b aria-hidden="true">EN</b><span class="sr-only">English, current language</span></span>
  <span class="lang-sep" aria-hidden="true">/</span>
  <a class="lang-alt" href="it/index.html" hreflang="it" lang="it" data-lang="it"
     data-pt-label="Italiano" data-pt-sub="Edizione italiana">IT<span class="sr-only"> · Italiano</span></a>
</p>
```

**IT page** (EN stays first visually, so the link comes first):

```html
<p class="lang" role="group" aria-label="Lingua">
  <a class="lang-alt" href="../index.html" hreflang="en" lang="en" data-lang="en"
     data-pt-label="English" data-pt-sub="English edition">EN<span class="sr-only"> · English</span></a>
  <span class="lang-sep" aria-hidden="true">/</span>
  <span class="lang-now" aria-current="true"><b aria-hidden="true">IT</b><span class="sr-only">Italiano, lingua attuale</span></span>
</p>
```

- `href` is the **counterpart of this page** (`{{ALT}}`). On `case-sersan-io.html` it is `it/case-sersan-io.html`. `assemble.mjs` builds the whole snippet as `{{LANGSWITCH}}` from the page's language and output path, so no partial hand-writes it.
- **Label in Name (2.5.3):** the link's name "IT · Italiano" contains the visible "IT". With `lang="it"` on the link, a screen reader says "Italiano" with Italian phonetics.
- **Current state:** `aria-current="true"` on the current code. The group name ("Language" / "Lingua") gives screen-reader users the context.
- **Target size (2.5.8):** `.lang-alt` gets `display:inline-block; padding: .4em .5em; margin: -.4em -.5em`, so the box is at least 24 × 24 px while the type stays in place. Focus-visible matches the nav links.
- **CSS scope (lane N):** today's `.nav a` rules (`fx-nav.css` L43-73) would give the control the section dash's left padding, its `::before` and the roll hover. Re-scope them to `.nav > a`, because the three section links are direct children of `<nav>`. The control then keeps only `.nav .lang`'s type (500 1rem, uppercase, 0.08em).
- **Where:**
  - `.nav .lang` in both headers. It keeps its class, because `fx-nav.js` L251 fades it in on the chrome cue (opacity on paper is allowed by P3).
  - `.nv-menu_lang` in the mobile menu (same markup, label scale). The menu's focus trap already collects `a[href]`.
- **Removed:** the sr-only "Language: English. Italian version coming." in four places (`a-header.index.html` L11 and L30, `a-header.case.html` L11 and L30).
- **No JS:** a plain link.

### 1.5 Persistence

- **The URL is the language.** Internal links are relative inside each folder, so a reader who chose IT stays in IT on every cut, Back and reload.
- **No automatic redirect** from `Accept-Language` or geography:
  - Google's guidance: crawlers arrive without the header;
  - readers keep control (an Italian recruiter reading the EN CV link stays in English);
  - bfcache and the S1 film never meet a redirect in the head.
- **No storage in the prototype.** A preference stored and never read would be dead code.
- **Production (out of scope, noted):** if the bare domain root ever needs to honour a choice, Vercel middleware can read a cookie that the toggle writes on an explicit click. The decision is made server-side, never by a client redirect.
- **The capture switches still travel.** `?v=`, `chrome`, `fx`, `gl`, `blocks` and `exit` are carried by `syncLinks()` onto the toggle like any internal link, once the §1.2 path fix is in.

### 1.6 The cut between languages

1. **Click** (`fx-nav.js` `onClick`, L1233-1248): the toggle is same-origin and under `/proto/rivista/`, so `go(a)` runs. It has no `data-pt="flip"` and no `data-back`, so `kind = "cols"`, `dir = "fwd"`: the S5 sheet rises from below. The cover prints `data-pt-label` ("Italiano") in its mask on the paper-deep sheet, with `data-pt-sub` ("Edizione italiana") under it. Under reduced motion it is the R-12 path: the paper fades in 0.2 s, then the label prints.
2. **The place** (new, lane N + C):
   - `fx-core.js` exports `FX.savePlace(toPath)`. It is today's `savePlace()` (L413-418) with `to` taken as a parameter.
   - At the top of `go(a)`, while the layout is still at rest (the MC-31 read-before-write order), `if (a.hasAttribute("data-lang")) FX.savePlace(url.pathname)`.
   - The record is `{ i, r, to, t }`: the index of the first `main > section, footer` on screen and the ratio into it. The two editions share partials, so index `i` is the same section in both languages.
3. **Commit:** `rv-pt = { type: "cols", label, sub, rg, lt, ld, sd, to, t }`, exactly as for any S5 cut.
4. **Arrival (IT document):**
   - The head script reads `rv-pt` (scoped by `to === location.pathname`) and paints the sheet with "Italiano" from the first paint (P7's name continuation included).
   - `seen` is set from `rv-place` (`parts/head.html` L64), so S1 never plays on a language cut.
   - The boot's `takePlace()` (L420) restores the same section and ratio **under the cover**, before `FX.nav.arrive()`. `arrive()` calls `scrollToHash()` only when there is a hash, so nothing undoes the restore.
   - The sheet then leaves while the page is already standing where the reader was.
5. **bfcache and Back:** Back returns to the EN document from bfcache. `onPageShow` sees no frozen image overlay, so it calls `reset()`, the existing path for every S5 cut. Without bfcache, the head script's `back_forward` record gives the bare S5 arrival and `takeReloadY()` places it (R-02 rule 4).
6. **S4 back across a language change:** the case's "Back to the index" uses `rv-origin`, recorded on the home that started the S4. If that home was the other edition, the tile rect is wrong, because the Italian lead above the rail wraps differently. Fix (lane N):
   - add `p: location.pathname` to `lastOrigin` (L648);
   - in `flipBack()` (L700), require `org.p === url.pathname`. Otherwise the cut falls back to S5, which is honest, rather than "miss > 40 then dissolve".
7. **Prefetch:** add `a[data-lang]` to the `initPrefetch()` selector (L1210), so the other edition's document is warm by the time the pointer lands.
8. **No JS:** a plain navigation to the top of the other edition.

### 1.7 What stays the same between editions

- The variant (`rv-variant` in localStorage).
- The S1 gate (`rv-intro-seen`, per session).
- The water engine and its laws, the motion tokens and every film.
- The per-char lockup "Alberto Tuveri" (a name).

The band rain is seeded from `location.pathname` (`water/engine/band.js:71`, spec 20 D-C5), so the IT page rains a different, equally deterministic pattern. That is accepted and needs no change.

### 1.8 Canon amendment (for the director)

- **R-21 · Language swap → Language cut.** The canon text becomes:

  > "A change of language is a navigation to the other edition (`it/` ↔ root): an S5 cut whose label is the destination's endonym and whose sub is the edition line; the reader's place travels in `rv-place`. Reduced motion: the R-12 paper fade."

  The in-place dim/swap/rise recipe is withdrawn.
- **MC-28 acceptance becomes:**
  - a toggle click shows the sheet leaving within the R3 cut-exit budget (`?exit=out`);
  - the arrival lands on the same section with |Δratio| ≤ 0.05;
  - no `.btn` is ever below opacity 1 (P3 holds by construction);
  - the IT visual gate shows no orphan line in the measured risky slots of §3.7.

---

## 2. The strings source

### 2.1 File and format

`rv/parts/strings.mjs`: an ES module, no dependencies. It is readable side by side, it can carry comments and fit notes, and `assemble.mjs` imports it directly (Node 22, ESM).

```js
/* Rivista copy, EN and IT side by side. One entry per visible or announced string. Edit here, then: node assemble.mjs
   Fields: en, it (required, non-empty) · html (optional: allows the inline whitelist) · note (never shipped). */
export default {
  "hero.h1": {
    en: 'From database schema to <span class="nb">real-time</span> WebGPU rendering and motion design.',
    it: 'Dallo schema del database al rendering WebGPU <span class="nb">in tempo reale</span> e al motion design.',
    html: true, note: "d3 uppercase · 3 lines at 1440/1024, 4 at 390 in both (measured)",
  },
  "chrome.nav.work": { en: "Work", it: "Lavori" },
  // …
};
```

- **Ids** are `area.slot[.n]`: `chrome.*`, `lang.*`, `cut.*`, `pre.*`, `hero.*`, `now.*`, `work.*`, `t01.*`…`t09.*`, `ev.*`, `lg1.*`, `lg2.*`, `m.*`, `fig.*`, `caps.*`, `cap.*`, `path.*`, `tl.*`, `band.*`, `foot.*`, `sw.*`, `case.*` (template), `js.*` (JS-written words), `meta.*`. Stair titles get **one id per line** (`now.h.1`), so the part keeps its `<span class="sc-l2">` structure.
- **Escaping:** text is HTML-escaped (`& < > "`), so the string can sit in a text node or an attribute.
- **`html: true`** permits only this inline whitelist: `<span class="nb">`, `<span class="sr-only">`, `<b>`, `<i>`. Anything else fails the build.
- **Tag-shape parity:** an `html` entry's EN and IT must contain **the same tags in the same order**. This keeps the DOM text-node count identical between editions, which makes the runtime parity probe (§2.5) exact. It is why the IT h1 also carries one `.nb` span, around "in tempo reale".
- `.nb { white-space: nowrap }` moves into `fx-core.css` and replaces today's inline `style` on the EN h1.
- **Language of parts is not in the strings.** A whole element that is English on the IT page gets ` lang="en"` from a `{{EN_ON_IT}}` placeholder on the element itself. It emits nothing on EN, so the shapes stay equal (§3.5).

### 2.2 Invariants: what stays literal in the partials

These never enter the strings file; they are the same bytes in both editions:
- **Proper and product names:** Alberto Tuveri, SerSan, Sersan Limited, SphereNode, Sphere AI, Maintech OMA, sersan.io, Domus Tua, Brand film, Badante24h, Voice AI Agent, Supply Chain, ALS MCL Civitanova, DOIT S.r.l, Camerino, Trento, LinkedIn, GitHub, the eight replaced tools (Circle … Notion), the three variant names (already Italian), and the thesis title (an English title; `lang="en"` on IT).
- **Role titles:** "Software & AI Engineer · Creative Lead", "Full-Stack Developer", "AI & Software Developer". Project rule; `lang="en"` on IT.
- **Stack and tool lists**, except the AI and Creative lines (`cap.5.tools`, `cap.8.tools`). Those carry translatable words.
- **Other literals:** `albertotuveri@gmail.com` and the URLs; integers and codes (`01`…`09`, `Fig. 01`, `52%`, `9`, `21/49`, `4K`, `100%`); arrows and separators; the rail index digits; the preloader digit cells; `GSAP, Lenis, WebGPU`; `© 2026 Alberto Tuveri`.
- **Figures with a unit or a decimal are not invariants.** They are `fig.*` entries (`fig.1-74`: `1.74 s` / `1,74 s`).
- **Units:** EN and IT both use NBSP before them (§3.3).

### 2.3 How `assemble.mjs` consumes it

`assemble.mjs` becomes a matrix of **languages × templates** (it composes with spec 20 §1.3):

```js
import STRINGS from "./parts/strings.mjs";
const LANGS = { en: { dir: "", R: "" }, it: { dir: "it/", R: "../" } };
// templates: index (as today) + the nine cases from cases.json (spec 20); the case.html stub is EN-only
```

For each language and template, `build()`:
1. concatenates the parts as today; spec 20's renderer receives `ctx = { lang, t }`;
2. replaces, in this order:
   - `{{R}}`, `{{LANG}}`, `{{HOME}}`;
   - `{{TITLE}}` (from `meta.title.home`, or the case `label` + `meta.title.suffix`);
   - `{{DESC}}`, `{{ALT}}`, `{{LANGSWITCH}}`, `{{HREFLANG}}`, `{{EN_ON_IT}}`;
   - `{{I18N}}`: the JSON of every `js.*` id in this language, `<` escaped as `\u003c`;
   - then every `{{t:<id>}}`;
3. writes `out = dir + file` through the same temp-file-and-rename it uses today.

Any leftover `{{…}}` is now an **error**, not today's warning.

**`--check`** keeps "stale → exit 1" for every output (11 EN + 10 IT pages + `fx.css`) and adds the i18n asserts below. They read only the built strings, so it still writes nothing.

| # | Assert | Fails when |
|---|---|---|
| I-1 | Every `{{t:id}}` resolves | an id is missing, or `en`/`it` is empty |
| I-2 | Every id is used | an orphan id (stale copy). Warning in a normal build, error under `--check` |
| I-3 | Tag shape | an `html` entry's EN and IT tag sequences differ, or a tag is off the whitelist |
| I-4 | Same `{{t:}}` count per template in EN and IT | a template built only partially |
| I-5 | Figure parity | the multiset of numerals in a page's visible text differs between EN and IT after normalising: `,` → `.` inside numbers, NBSP → space, and spelled numbers mapped (eight↔otto, nine↔nove, ten↔dieci, three↔tre, six↔sei, fourteen↔quattordici, seventeen↔diciassette, zero↔zero, two↔due). `one` is excluded because Italian "una/un" is also the article. This is the "same claims and numbers exactly" rule as a gate. |
| I-6 | English leak | the IT pages' visible text outside `[lang="en"]` contains an English-only stopword: *the, and, of, with, from, to, on, for, at, by, before, after, open, visit, back, next, file, work, works, about, contact, loading, ready*. It is matched as a whole word, case-insensitive, after removing the §2.2 invariant names. |
| I-7 | Italian typography (on `it` values) | a straight `'` (must be `’`); `E'`/`e'` for `è`; `"…"` quotes (must be `« »`); a decimal point inside an Italian figure; a plain space between a number and `s`/`ms`; an uppercase month name |
| I-8 | Toggle integrity | a page's `{{ALT}}` target is not among the built outputs, or the `hreflang` set is not symmetric (EN → IT → EN) |
| I-9 | Partial coverage | any `cases.json` text field lacks its `it` twin (D-I10). The message lists the paths. |

Spec 20's claims gate (`scripts/check-claims-proto.mjs`) also iterates `it/*.html`, using the same per-slug scopes and I-5's decimal normalisation. An IT page proves the same figures as its EN twin, or the build fails.

### 2.4 Strings written by JavaScript

- **`fx-core.js`** reads `#rv-i18n` once at load and exposes:
  - `FX.lang` (the value of `html[lang]`);
  - `FX.t(key, vars)`: `{name}` interpolation. A missing key returns the key and calls `warn()`, which fails the clean-console gate;
  - `FX.num(n, digits)`: `Intl.NumberFormat(FX.lang, { minimumFractionDigits: digits, maximumFractionDigits: digits })`.
- **Call sites:**

| File:line | Today | Becomes |
|---|---|---|
| `fx-hero.js:114` | `"Ready" / "Fonts" / "Shaders" / "Water"` | `FX.t("js.pre.ready")` … The preloader's static "Loading · " and the initial step come from `{{t:}}` in `b-preloader.html`. |
| `fx-hero.js:596` | `s.rays.toLocaleString("en-US") + " caustic rays"` | `FX.t("js.instr.rays", { n: FX.num(s.rays, 0) })`. Shown only while a caustic chunk is live. |
| `fx-hero.js:597` | `s.gpuMs.toFixed(1) + " ms GPU"` | `FX.t("js.instr.gpu", { ms: FX.num(s.gpuMs, 1) })`, so Italian prints `1,2 ms GPU` |
| `fx-hero.js:598` | `"DPR " + s.dpr` | `FX.t("js.instr.dpr", { dpr: FX.num(s.dpr, s.dpr % 1 ? 1 : 0) })`, so Italian prints `DPR 1,5` |
| `fx-nav.js:339` | `"Close the menu" / "Open the menu"` | `FX.t("js.menu.close")` / `FX.t("js.menu.open")`. The initial `aria-label` in the markup comes from `{{t:}}`. |
| `fx-nav.js:1314` | `"Identity V" + v` | `FX.t("js.sw.sub", { v })` |

The `fx-hero.js` lines are DOM writes, outside the canon's off-limits `FX.gl` ranges. `nb()` keeps working on the localised tokens. The S5 cover's label and sub come from `data-pt-*` attributes, which are already per edition, so no JS change is needed there.

### 2.5 Runtime parity probe: `scripts/probes/rivista-i18n/parity.mjs`

It is headless, through `launch()`, and runs per template × {1440 × 900, 390 × 844 DPR 2} × {EN, IT}:
1. **Count parity:**
   - visible text nodes (non-empty, outside `script`/`style`, excluding the lockup's per-letter spans `.ch` and the preloader's digit cells `.hr-dig i`: 46 nodes on the home, none on the case);
   - plus `alt`, `aria-label` and `title` attributes, `<title>` and `meta[name=description]`;
   - plus the `data-pt-label` and `data-pt-sub` pairs.

   EN and IT must match **exactly**. Tag-shape parity (I-3) makes this exact rather than approximate.
2. **Lang:** `document.documentElement.lang`; `hreflang` alternates resolve with HTTP 200; the toggle's computed accessible name contains its visible code; `aria-current` is on the current code; the toggle box is at least 24 × 24 px.
3. **The cut:** scroll the home to the middle of the rail runway and of the Path chapter, click the toggle, wait for `fx:nav:landed`. Then check:
   - `location.pathname` is the counterpart;
   - the first section on screen has the same index, with |Δratio| ≤ 0.05;
   - S1 did not run;
   - the console is clean (0 errors, 0 relevant warnings).

   Repeat under `--reduce`. Repeat on the case: S4 from the IT home, toggle to EN, then "Back to the index", which must fall back to S5 per §1.6 step 6.
4. **Fit:** the slots of §3.7 at the three widths: no stair line on two lines where EN has one, and no element spilling its column.

Then the usual gates for every new page:

```
node scripts/visual-gate.mjs it "it/" "it/case-spherenode.html"
node scripts/visual-gate.mjs it-rm "it/" --reduce
node scripts/visual-gate.mjs it-nogpu "it/" --nogpu
```

The axe gate (`scripts/probes/a11y-gate.mjs`) runs over the IT routes too.

### 2.6 How this composes with spec 20 (`cases.json`)

- Every human-language field of `cases.json` becomes a twin `{ "en": "…", "it": "…" }`. That covers `overline[].t`, `ornament`, `lead.t`, `cta.label`, `fields[].k` and `.v`, `fig.figLine`, `fig.gap`, `fig.caption[]`, the chapter texts, `onFile[].k` and `.v`, and `stack.t` where it carries words. `src` stays single: it cites the fact, not the wording.
- `label`, `titleLines` and `slug` stay plain where they are names. A `titleLines` entry that is a phrase takes a twin.
- The renderer reads `ctx.lang` and `ctx.t` (the case template's own words: "Visit", "Back to the index", "Next work", "No photograph on file", "Stack", "URL: in attesa"…). It still escapes all text, as spec 20 requires.
- Spec 20's structural asserts §1.4 run per language.
- **D-C10 is superseded** when this lane lands: the header no longer prints "Italian version coming".

---

## 3. Translation rules

### 3.1 Voice

- **The reader:** a design-literate Italian (studio lead, art director, CTO, recruiter), reading the way Alberto would write: plain, exact, first person singular, no slogans. The EN house voice ("a job card, not a manifesto") carries over.
- **Editing standard:** written as a native editor would write it, never re-worded from English syntax:
  - no calques ("Lavori selezionati" → **"Lavori scelti"**; "consapevole del tier" → **"che tiene conto del livello d'abbonamento"**);
  - no stacked nouns ("pipeline pagamenti → entitlement" → **"la pipeline dai pagamenti ai diritti d'accesso"**);
  - no machine tone.
- **Address:** the informal *tu* when the reader is addressed at all ("Scrivimi"). *Lei* would be stiff on a personal site. Most of the copy addresses nobody, and should stay that way.
- **Case:** sentence case in the source. The CSS uppercases display and labels. Never Title Case in Italian.

### 3.2 Claims, numbers, names

- **Same claims, same numbers.** Not one figure is added, dropped or rounded, and I-5 enforces it. Where the English is ambiguous, Italian may be **more precise but never stronger**:
  - "M.Sc. … at the University of Trento" becomes "Laurea magistrale … **in corso** all'Università di Trento". It is true per `PRODUCT.md:93-94`, "currently studying".
  - "Sub-second" becomes **"Sub-secondo"**, `PRODUCT.md` §3's own word.
- **Names stay names** (§2.2). Work titles stay as filed ("Brand film", "Supply Chain", "Voice AI Agent").
- **Degrees** use the official Italian titles: **Laurea triennale in Informatica** (B.Sc. in Computer Science, Unicam) and **Laurea magistrale in Artificial Intelligence Systems** (the Trento programme's official name is English). This is the `dict.ts` precedent.
- **Italian place names drop ", Italy"** for an Italian reader ("Trento, Italy" → "Trento"). London becomes **Londra**. This is localisation, not a claim change.
- **"Never print" in Italian, for the hero water** (spec 30 §4.4): *particelle* (until M9; sersan.io's own "marchio a particelle" is a different work and stays), *simulazione* for the resting letter, *sole*, *riflessi/scintillii* (glints), *fisicamente accurato*, *caustiche reali* (say *tracciate*). That is why the posters' "highlight" becomes **"un filo di luce"** and not "riflesso".

### 3.3 Typography

| Rule | Italian edition | Justification |
|---|---|---|
| Decimal separator | **Comma:** `1,74 s`, `4,75 s`, `1,9%`, `0,6%`, `1,2 ms GPU`, `DPR 1,5` | The Italian norm (ISO 80000-1 allows it; Italian readers parse `1.740` as one thousand seven hundred forty). It is also the project precedent: `dict.ts` ("4,75 s → 1,74 s", "sotto 4,5"), `works.ts` (`1,9% → 0,6%`) and `PRODUCT.md` §3. Machine values keep the point (`--w:1.9%`, `data-*`). |
| Thousands | Point, from four digits: `48.000` | `works.ts` precedent. Years never take one (`2026`). |
| Percent | No space: `68%` | The same as the EN page and the precedent. Italian editorial usage accepts both forms; consistency across editions wins. |
| Number + unit | **NBSP**: `1,74 s`, `572 ms`, `64 s` | A figure never breaks from its unit. Apply the same NBSP to EN (today a plain space). |
| Ranges and dates | En dash with spaces; months lowercase, abbreviated without a period: `gen feb mar apr mag giu lug ago set ott nov dic`; "Present" → **oggi**: `set 2026 – oggi`, `nov 2025 – feb 2026` | Italian lowercase months; `PRODUCT.md` writes "gen 2026–oggi". The labels are uppercased by CSS anyway. |
| Apostrophe | **`’` (U+2019)**: `d’acqua`, `all’Università`, `l’intro` | Italian has elisions everywhere, and a straight `'` in Cormorant caps looks broken. In the latin subset (U+2000-206F) of all three variants. Note: the EN copy uses straight `'` today ("studio's"). Recommend the same `’` there. |
| Quotes | **Caporali `« »`**, `“ ”` inside | Italian norm (none on the pages today; the rule is for future copy). In U+0000-00FF. |
| Accented capitals | From lowercase source plus CSS uppercase: "affidabilità" → `AFFIDABILITÀ`; "è" → `È`. **Never `E'`.** | Correct Italian. Cormorant, Figtree, Geist, Instrument Serif and Hanken Grotesk all cover U+00C0-00FF. |
| Ellipsis, dashes | `…` (U+2026), `–` for ranges, `—` only as today's "no figure" mark | As EN. |

### 3.4 Loanwords

- **Keep in English** where Italian tech and design practice keeps them: *front-end, back-end, full-stack, motion design, motion graphics, VFX, sound design, brand identity, logo design, brand film, retail trading, SaaS, ERP, PWA, RAG, embedding, guardrail, policy, recall, chunking, retrieval, pipeline, state machine, default-deny, release, release manager, job, dashboard, layout shift, LCP, Largest Contentful Paint, blocking time, canvas, scroll, home page, landing, live, freelance, stack, mentor, Trading Journal, intro, banner, cookie*.
- **Translate** whatever has a natural Italian word:
  - prove (evidence), competenze (capabilities), percorso (path), formazione, esperienza, tirocinio (internship);
  - affidabilità, servizi/strumenti, ruoli, fasi, portali di settore;
  - diritti d'accesso (entitlements), abbonamento (tier), ricavi (revenue), contestazioni (disputes), disdetta (cancellation), rilievi (audit findings);
  - monitoraggio, avvisi (alerting), montaggio (video editing), direzione artistica, tipografia, carattere (typeface), logotipo (wordmark), marchio (mark), fotogramma (still).
- **Loanwords are invariable:** *i job, le release, gli embedding, i guardrail*, never *jobs/releases*.
- **Gender:** *il canvas, la pipeline, la state machine, il job, la release, la policy, il recall, il layout shift, il brand film, la home page, l'ERP, il SaaS, la PWA, il mentor, l'intro* (f).

### 3.5 Language of parts

- `lang="en"` goes on the **whole element** when it is entirely English on an Italian page (WCAG 3.1.2):
  - the hero role label;
  - the three timeline role titles (`.tl-what` of rows 2–4);
  - the hero ornament;
  - the thesis title (the part wraps the title in a `<span{{EN_ON_IT}}>` in both editions, so the shape stays equal);
  - the EN link of the toggle.
- **No `lang` attribute** on loanwords inside Italian sentences, or on proper names: 3.1.2 exempts technical terms and names, and marking every *front-end* would make a screen reader switch voices mid-sentence.

### 3.6 The ornaments

- **Home, under the name: "engineer" stays "engineer"** (`lang="en"`, italic accent as today).
  - *ingegnere* is a protected title in Italy (an engineering degree, the State exam and enrolment in the Albo degli Ingegneri). Alberto's degrees are Informatica and AI Systems. Printing it would be an untrue professional claim on the Italian page, where it reads as exactly that.
  - Roles stay English by project rule ("Software & AI Engineer"), and the ornament echoes the role.
  - Italian typography sets foreign words in italic, so the ornament reads as intended.
  - Measured alternatives: "ingegnere" fits but is refused. "progettista" spills its column by 21 px at 1024 and 13 px at 390.
- **Case: "in production" → "in produzione"** (335 px vs 331 px at 1440; 1 line at every width).

### 3.7 Fit: the risky lines, measured

Method:
- `fit.mjs` and `fit2.mjs` load the EN page headless with `?fx=core&gl=0` (no splits or pins touch the text), wait for `document.fonts.ready` (Cormorant Garamond + Figtree), swap the Italian in, and count rendered lines and spill at 1440, 1024 and 390 DPR 2;
- `natural.mjs` measures each stair line with `white-space: nowrap` against its column.

Italian prose ran about 8–15 % longer.

| Slot | EN | IT chosen | Measured (IT vs EN) | Decision |
|---|---|---|---|---|
| `work.h.1` stair (d1) | Nine works, | **Nove lavori,** | Natural 665 px vs column 637 at 1440 (+4 %); 492 vs 450 at 1024 (+9 %). **The EN line already overflows at 1024: 461 vs 450 px, so it wraps today.** | Keep the copy. **Lane S adds a stair fit rule for both languages:** `.work-t { container-type: inline-size }` and `#work-h { font-size: min(var(--t-d1), var(--fit-work)) }`, with `--fit-work: 15.4cqi` (EN, 6.29 em longest line) and `14.4cqi` under `html[lang="it"]` (6.72 em), each with about 3 % slack. `.work .head` is a `1fr 1.35fr` grid at ≥ 1024 and a block below that, so the inline-size containment cannot collapse the column. Fallback copy if refused: "Nove opere," (615 px, fits). |
| `c1.h.1` stair (d1, case) | Eight tools, | **Otto servizi,** | "Otto strumenti," 365 vs 336 px at 390 (+8 %, wraps); "Otto servizi," 282 px | Use **servizi**: the eight are SaaS services (Circle … Notion). Keep it consistent on the case and the tile (`t01.body`, `c1.lead`, the list's aria-label). |
| `c2.h.2` stair (d1, case) | before it guesses | **prima di azzardare** | 1 line at 1440 and 1024, 2 at 390 (EN is 2 at 390 too). "prima di tirare a indovinare" wraps at 1440. | Chosen. The full idiom stays in the guardrail list (`g1`). |
| `t07.fig` (plate, is-word) | Sub-second | **Sub-secondo** | "Sotto il secondo" takes 2 lines at 1440 and 1024; "Sub-secondo" 1 line everywhere (285/403 px) | PRODUCT's own term. |
| `t02.figl` + `m.acc` | answer-policy accuracy | **accuratezza della policy** | The long form "…della policy di risposta, dal 52%" takes 2 lines at every width; the short form 1 line | Short form everywhere, plate and ledger, for one name per metric. The ledger head ("Affidabilità delle risposte") gives the context. |
| `work.nophoto` ×7 | No photograph on file | **Nessuna foto agli atti** | "Nessuna fotografia…" takes 2 lines at 1024 and 390 | Chosen. |
| `hero.still` | Still frame captured from this engine. | **Fotogramma reso da questo motore.** | "…catturato da…" takes 2 lines at 1024; "reso" 1 line (261/317 px) | Still literally true: the posters are rendered by this engine (M8b). |
| `f3.h` (d3, case) | Silent scheduled jobs | **Job fermi in silenzio** | "Job pianificati, fermi in silenzio" takes 2 lines at every width | Chosen. |
| `lg2.h` (d2) | Fast on the phone in your hand | **Veloce sul telefono in mano** | "…che hai in mano" takes 4 lines at 1024 (EN 3) | Chosen: 3 lines at every width, the same as EN. |
| `m.prec`, `m.rec` | Clarification precision / recall | **Precisione dei chiarimenti / Recall dei chiarimenti** | The long forms take 2 lines at 390 | Chosen. |
| `m.over` | Over-answering on questions to withhold | **Risposte a domande da trattenere** | "Risposte di troppo su domande da trattenere" had 1 px to spare at 1024 (456/457). The chosen form is 11 characters shorter and was not measured separately. | The shorter form says the same thing ("answering questions that should be withheld"). |
| `lg1.h` (d2) | Answer reliability, before and after | Affidabilità delle risposte, prima e dopo | 4 lines = EN at 1440 and 1024; 3 at 390; **326/327 px at 1024** | Keep; watch it in the IT gate. Fallback: "Risposte affidabili, prima e dopo". |
| `t03.body` | Job orders on a six-phase state machine… | **…su state machine a sei fasi…** (no article) | With the article it takes 3 lines at 1024 and 390 | Caption register allows it. |
| `tl.1.what` (d2) | M.Sc. in Artificial Intelligence Systems | Laurea magistrale in Artificial Intelligence Systems | +1 line at every width (3 / 3 / 5) | **Accepted:** the formal title matters to Italian HR; a timeline row grows and nothing breaks. "Magistrale in…" would fit if Alberto prefers it. |
| Header nav at 1024 | Work · About · Contact | Lavori · Chi sono · Contatti | Nav 416 → 460 px; gap to the brand 224 → 180 px | Fine. |
| `menu.btn` | Menu / Close | Menu / Chiudi | 1 line | Fine. |
| `hero.h1`, `hero.fig`, `ev.h`, `band.h`, `caps.h`, stairs `now`, `path`, `c3` | — | — | The same line counts as EN at every width | Fine. |
| Leads and bodies (`now.lead`, `work.lead`, `path.lead`, `lg2.lead`, `c1.lead`, `c2.lead`, `case.lead`, `f1.body`, `g5`) | — | — | +1 line | Prose; accepted. |
| `pre.meta` (S1 only, not measurable gl-off) | Loading · Shaders | Caricamento · Shader | 20 vs 17 characters on a full-width rule | Check in the IT intro strip. |

**Two EN defects found in passing (for the director):**
1. "Nine works," wraps at 1024 today (461 > 450 px). The fit rule above fixes both editions.
2. The EN copy has no NBSP between figures and units, and uses straight apostrophes.

---

## 4. Inventory, the full table, effort

### 4.1 Counts (probe `inventory.mjs`, EN, 1440, `?fx=core&gl=0`)

| Page | String occurrences | of which text / aria-label / alt | Unique | aria-hidden text | sr-only text | Single-glyph nodes excluded | Plus |
|---|---|---|---|---|---|---|---|
| `index.html` | **262** | 250 / 6 / 6 | **190** | 37 | 19 | 46 (13 lockup letters, 33 preloader digit cells) | `<title>`, description, 9 `data-pt-*` pairs, 4 JS families |
| `case.html` (SphereNode) | **153** | 146 / 6 / 1 | **123** | 25 | 9 | 0 | `<title>`, description, 7 `data-pt-*` pairs |

**Translatable units**, deduplicated across both templates and the chrome: **192 ids in §4.2**:
- **159** go to `parts/strings.mjs`: the home, the header, menu and overlays, the footer, the case template's words and 11 JS-written ids;
- **33** are the SphereNode case content, which moves into `cases.json` as `it` twins (spec 20);
- **182** differ in Italian, and **10** are identical by design (the `=` rows).

Beyond these, the **§2.2 invariants** (names, roles, stacks, integers) stay literal in the partials. The other eight cases add about 240 strings once spec 20 has written them (E6).

### 4.2 The strings, EN | IT

Notes: "=" means the Italian is identical (kept). ⊙ means fit-measured (§3.7). `‹…›` marks the `.nb` nowrap span. Figures use NBSP where marked `␣`.

**Head and meta**

| id | EN | IT |
|---|---|---|
| `meta.title.home` | Alberto Tuveri · Rivista prototype | Alberto Tuveri · Prototipo Rivista |
| `meta.title.suffix` | · Alberto Tuveri · Rivista prototype | · Alberto Tuveri · Prototipo Rivista |
| `meta.desc` | Prototype: Alberto Tuveri's portfolio in the rivista bianca canon. | Prototipo: il portfolio di Alberto Tuveri nel canone «rivista bianca». (Per-page descriptions are spec 20's `{{DESC}}`, in both languages.) |

**Chrome: header, menu, language, cut labels**

| id | EN | IT |
|---|---|---|
| `chrome.skip` | Skip to content | Vai al contenuto |
| `chrome.brand.aria` | Alberto Tuveri, home | Alberto Tuveri, pagina iniziale |
| `chrome.nav.aria` | Primary | Principale |
| `chrome.nav.work` | Work | Lavori |
| `chrome.nav.about` | About | Chi sono |
| `chrome.nav.contact` | Contact | Contatti |
| `chrome.menu.word` | Menu | = |
| `chrome.menu.word.close` | Close | Chiudi |
| `chrome.menu.dialog` (aria-label) | Menu | = |
| `js.menu.open` (also the initial aria-label) | Open the menu | Apri il menu |
| `js.menu.close` | Close the menu | Chiudi il menu |
| `chrome.menu.write` | Write to me | Scrivimi |
| `lang.group` | Language | Lingua |
| `lang.current` (sr) | English, current language | Italiano, lingua attuale |
| `lang.name.en` / `lang.name.it` (constants, the endonyms) | English | Italiano |
| `lang.edition.en` / `lang.edition.it` (cut sub, constants) | English edition | Edizione italiana |
| `cut.work` (data-pt-label; tile sub "0N · …") | Selected work | Lavori scelti |
| `cut.index` | Index | Indice |
| `cut.about` | About | Chi sono |
| `cut.next` | Next work | Lavoro successivo |

**S1 preloader and the hero instrument (JS)**

| id | EN | IT |
|---|---|---|
| `js.pre.loading` | Loading | Caricamento |
| `js.pre.fonts` | Fonts | Font |
| `js.pre.shaders` | Shaders | Shader |
| `js.pre.water` | Water | Acqua |
| `js.pre.ready` | Ready | Pronto |
| `js.instr.rays` | {n} caustic rays | {n} raggi caustici |
| `js.instr.gpu` | {ms} ms GPU | = (the number is localised: `1,2 ms GPU`) |
| `js.instr.dpr` | DPR {dpr} | = (`DPR 1,5`) |
| `js.sw.sub` | Identity V{v} | Identità V{v} |

**Hero**

| id | EN | IT |
|---|---|---|
| `hero.orn` | engineer | = (`lang="en"`, §3.6) |
| `hero.h1` ⊙ | From database schema to ‹real-time› WebGPU rendering and motion design. | Dallo schema del database al rendering WebGPU ‹in tempo reale› e al motion design. |
| `hero.fig` ⊙ | Fig. 01 · An A of water, rendered live | Fig. 01 · Una A d’acqua, in tempo reale |
| `hero.still` ⊙ | Still frame captured from this engine. | Fotogramma reso da questo motore. |
| `hero.cta` | Write to me | Scrivimi |
| `hero.ghost.work` | Selected work | Lavori scelti |
| `hero.ghost.about` | About | Chi sono |
| `hero.alt.v1` | A capital A in Cormorant Garamond made of clear water, standing on paper: a faint cool cast in the stem, a highlight along the right stroke, two small bubbles, a wet rim at its feet and one bead beside the right foot. | Una A maiuscola in Cormorant Garamond fatta d’acqua limpida, in piedi sulla carta: una lieve dominante fredda nell’asta, un filo di luce lungo il tratto destro, due piccole bolle, un bordo bagnato alla base e una goccia accanto al piede destro. |
| `hero.alt.v2` | A capital A in Geist made of clear water, standing on paper: a mint cast through the stroke, a highlight along its edges, two small bubbles, a wet rim at its feet and one bead beside the right foot. | Una A maiuscola in Geist fatta d’acqua limpida, in piedi sulla carta: una dominante color menta nel tratto, un filo di luce lungo i bordi, due piccole bolle, un bordo bagnato alla base e una goccia accanto al piede destro. |
| `hero.alt.v3` | A capital A in Instrument Serif made of clear water, standing on paper: a pale green-grey cast in the stem, a highlight along the right stroke, two small bubbles, a wet rim at its feet and one bead beside the right foot. | Una A maiuscola in Instrument Serif fatta d’acqua limpida, in piedi sulla carta: una pallida dominante grigioverde nell’asta, un filo di luce lungo il tratto destro, due piccole bolle, un bordo bagnato alla base e una goccia accanto al piede destro. |
| (role label) | Software & AI Engineer · Creative Lead | = (`lang="en"`) |

**Now**

| id | EN | IT |
|---|---|---|
| `now.eyebrow` | Now · since May 2026 | Oggi · da maggio 2026 |
| `now.h.1` | Now at | Oggi in |
| `now.lead` | I own the front-end, WebGPU/3D and motion layer of what the studio ships, the AI work on its flagship platform, and the studio's creative direction. | Sono responsabile del front-end, del WebGPU/3D e del motion di ciò che lo studio mette in produzione, del lavoro AI sulla sua piattaforma di punta e della direzione creativa dello studio. |
| `now.body` | SerSan is a custom software, automation and AI studio: Sersan Limited, London. I work remote, as Software & AI Engineer and Creative Lead. | SerSan è uno studio di software su misura, automazione e AI: Sersan Limited, Londra. Lavoro da remoto, come Software & AI Engineer e Creative Lead. |
| `alt.sersan-io` (×2: Now plate, tile 04) | The sersan.io intro: the SerSan particle mark above a glowing wordmark. | L’intro di sersan.io: il marchio SerSan a particelle sopra un logotipo luminoso. |

**Selected work (rail)**

| id | EN | IT |
|---|---|---|
| `work.eyebrow` | Selected work | Lavori scelti |
| `work.h.1` ⊙ | Nine works, | Nove lavori, |
| `work.h.2` | on file | agli atti |
| `work.lead` | A trading platform and its AI mentor, a workshop ERP, a WebGPU studio site, a real-estate platform and a brand film at SerSan, and three projects from outside it. | Una piattaforma di trading e il suo mentor AI, un ERP d’officina, il sito WebGPU dello studio, una piattaforma immobiliare e un brand film realizzati in SerSan, più tre progetti esterni. |
| `work.open` (×9 tiles, next link) | Open | Apri |
| `work.nophoto` ⊙ (×7) | No photograph on file | Nessuna foto agli atti |
| `t01.cap` | 01 · SerSan · live at spherenode.com | 01 · SerSan · online su spherenode.com |
| `t01.body` | Vertical SaaS that replaced eight tools for the Italian retail-trading market. | SaaS verticale che ha sostituito otto servizi per il mercato italiano del retail trading. |
| `alt.spherenode.tile` | The spherenode.com home page, dark with a green accent. | La home page di spherenode.com, scura con un accento verde. |
| `t02.figl` ⊙ | answer-policy accuracy, from 52% | accuratezza della policy, dal 52% |
| `t02.cap` | 02 · SerSan · RAG mentor | 02 · SerSan · mentor RAG |
| `t02.body` | Measured on a 161-question bilingual evaluation set. | Misurata su un set di valutazione bilingue di 161 domande. |
| `t03.figl` | roles, default-deny on every table | ruoli, default-deny su ogni tabella |
| `t03.cap` | 03 · SerSan · workshop ERP | 03 · SerSan · ERP d’officina |
| `t03.body` ⊙ | Job orders on a six-phase state machine, ten trade portals. | Ordini di lavoro su state machine a sei fasi, dieci portali di settore. |
| `t04.cap` | 04 · SerSan · Jun – Sep 2026 | 04 · SerSan · giu – set 2026 |
| `t04.body` | Seventeen scroll-locked scenes on one continuous WebGPU canvas. | Diciassette scene agganciate allo scroll su un unico canvas WebGPU continuo. |
| `fig.1-74` (tile 05, ledger) | 1.74␣s | 1,74␣s |
| `t05.figl` | mobile LCP, from 4.75␣s | LCP su mobile, da 4,75␣s |
| `t05.cap` | 05 · SerSan · real-estate brand platform | 05 · SerSan · piattaforma brand immobiliare |
| `t05.body` | Blocking time 572␣ms → 274␣ms, no layout shift. | Blocking time 572␣ms → 274␣ms, nessun layout shift. |
| `t06.figl` | in 4K, fourteen scenes | in 4K, quattordici scene |
| `t06.cap` | 06 · SerSan · identity and film | 06 · SerSan · identità e film |
| `t06.body` | Hexagonal mark, custom display typeface, colour system. | Marchio esagonale, carattere display su misura, sistema colore. |
| `t07.fig` ⊙ | Sub-second | Sub-secondo |
| `t07.figl` | geospatial caregiver search, PostGIS 3 | ricerca geospaziale dei caregiver, PostGIS 3 |
| `t07.cap` | 07 · ALS MCL Civitanova · freelance | = |
| `t07.body` | Zero known auth vulnerabilities at launch. | Zero vulnerabilità di autenticazione note al lancio. |
| `t08.figl` | no figure on file | nessun dato agli atti |
| `t08.cap` | 08 · DOIT S.r.l · internship | 08 · DOIT S.r.l · tirocinio |
| `t08.body` | Hands-free appointments in Microsoft Teams from audio notes. | Appuntamenti in Microsoft Teams a mani libere, da note audio. |
| `t09.figl` | roles, built by a team of three | ruoli, progetto di un team di tre |
| `t09.cap` | 09 · University of Camerino | 09 · Università di Camerino |
| `t09.body` | Agricultural supply-chain platform on Spring Boot, JWT RBAC. | Piattaforma di filiera agricola su Spring Boot, RBAC con JWT. |

**Evidence and the two ledgers**

| id | EN | IT |
|---|---|---|
| `ev.eyebrow` | Evidence | Prove |
| `ev.h` | Measured before and after. | Misurato prima e dopo. |
| `ev.lead` | Two sets of figures with a before and an after: a 161-question bilingual evaluation set for Sphere AI, and page speed on real phones for Domus Tua. | Due serie di numeri con un prima e un dopo: un set di valutazione bilingue di 161 domande per Sphere AI e la velocità delle pagine su telefoni reali per Domus Tua. |
| `ev.aria` | Before and after | Prima e dopo |
| `lg1.h` ⊙ | Answer reliability, before and after | Affidabilità delle risposte, prima e dopo |
| `lg1.lead` | On a 161-question bilingual evaluation set. Citation correctness 100%, with zero locked-content leaks and zero fabricated citations. | Su un set di valutazione bilingue di 161 domande. Citazioni corrette al 100%, con zero fughe di contenuti bloccati e zero citazioni inventate. |
| `m.acc` ⊙ | Answer-policy accuracy | Accuratezza della policy |
| `m.over` ⊙ | Over-answering on questions to withhold | Risposte a domande da trattenere |
| `m.prec` ⊙ | Clarification precision | Precisione dei chiarimenti |
| `m.rec` ⊙ | Clarification recall | Recall dei chiarimenti |
| `m.uns` | Unsupported claims | Affermazioni non supportate |
| `m.to` (sr, between the pair) | to | poi (both with a space on each side, ` to ` / ` poi `: the spans are adjacent, and a screen reader would otherwise read "52%poi68%") |
| `fig.1-9` / `fig.0-6` | 1.9% / 0.6% | 1,9% / 0,6% |
| `fig.4-75` | 4.75␣s | 4,75␣s |
| `lg2.eyebrow` | Domus Tua · real phones | Domus Tua · telefoni reali |
| `lg2.h` ⊙ | Fast on the phone in your hand | Veloce sul telefono in mano |
| `lg2.lead` | The mobile delay was traced to the cookie banner and the intro rebuilt to run in CSS rather than JavaScript. The cinematic experience stayed, with no layout shift. | Il ritardo su mobile è stato ricondotto al banner dei cookie e l’intro è stata riscritta per girare in CSS invece che in JavaScript. L’esperienza cinematografica è rimasta, senza layout shift. |
| `m.lcp` | Mobile largest-contentful-paint | Largest Contentful Paint su mobile |
| `m.tbt` | Mobile blocking time | Blocking time su mobile |

**Capabilities**

| id | EN | IT |
|---|---|---|
| `caps.eyebrow` | Capabilities | Competenze |
| `caps.h` | What I build with | Con cosa costruisco |
| `caps.lead` | Eight groups of tools, each tied to the work that proves it. | Otto gruppi di strumenti, ciascuno legato al lavoro che lo dimostra. |
| `caps.proof` (×8) | Proof | Prova |
| `cap.1` … `cap.8` | Core · Front-End · 3D & Graphics · Back-End & DB · AI · Cloud & DevOps · Testing & Tooling · Creative | Linguaggi · Front-End · 3D e grafica · Back-End e DB · AI · Cloud e DevOps · Test e strumenti · Creatività (the `skills.ts` precedent; Front-End and AI kept) |
| `cap.5.tools` | RAG & embeddings · LLM evaluation & guardrails · OpenAI / Anthropic / Gemini · Copilot Studio · Power Automate · Dataverse · Dynamics 365 · Claude Code / MCP | RAG ed embedding · Valutazione degli LLM e guardrail · OpenAI / Anthropic / Gemini · Copilot Studio · Power Automate · Dataverse · Dynamics 365 · Claude Code / MCP |
| `cap.8.tools` | Motion graphics & VFX (After Effects) · Video editing & post-production · Brand identity & logo design · Art direction · Typography · Sound design | Motion graphics e VFX (After Effects) · Montaggio video e post-produzione · Brand identity e logo design · Direzione artistica · Tipografia · Sound design |

**About · path (timeline)**

| id | EN | IT |
|---|---|---|
| `path.eyebrow` | About · path | Chi sono · percorso |
| `path.h.3` (Camerino, Trento, kept) | London | Londra |
| `path.lead` | A B.Sc. at Camerino, an M.Sc. in AI Systems at Trento, and professional work since November 2025, remote for a London studio since May 2026. | Una laurea triennale a Camerino, una magistrale in AI Systems a Trento e incarichi professionali da novembre 2025: da maggio 2026 da remoto per uno studio di Londra. |
| `tl.kind.edu` / `tl.kind.exp` | · Education / · Experience | · Formazione / · Esperienza |
| `tl.1.when` | Sep 2026 – Present | set 2026 – oggi |
| `tl.1.what` ⊙ | M.Sc. in Artificial Intelligence Systems | Laurea magistrale in Artificial Intelligence Systems |
| `tl.1.where` | University of Trento · Trento, Italy | Università di Trento · Trento |
| `tl.2.when` | May 2026 – Present | mag 2026 – oggi |
| `tl.2.where` | SerSan, AI studio · Sersan Limited (London) · Remote | SerSan, studio AI · Sersan Limited (Londra) · Da remoto |
| `tl.3.when` | Jan 2026 – Present | gen 2026 – oggi |
| `tl.3.where` | ALS MCL Civitanova · Badante24h, a production PWA · Freelance · Marche, Italy | ALS MCL Civitanova · Badante24h, una PWA in produzione · Freelance · Marche |
| `tl.4.when` | Nov 2025 – Feb 2026 | nov 2025 – feb 2026 |
| `tl.4.where` | DOIT S.r.l · a voice AI agent for Microsoft Teams · Internship · Fabriano, Italy | DOIT S.r.l · un agente vocale AI per Microsoft Teams · Tirocinio · Fabriano |
| `tl.5.when` | Jan 2022 – Apr 2026 | gen 2022 – apr 2026 |
| `tl.5.what` | B.Sc. in Computer Science | Laurea triennale in Informatica |
| `tl.5.where` | University of Camerino · Camerino, Italy | Università di Camerino · Camerino |
| `tl.thesis.sr` | Thesis: | Tesi: |
| (roles rows 2–4, the thesis title) | as EN | = (`lang="en"`) |

**Closing band and footer**

| id | EN | IT |
|---|---|---|
| `band.eyebrow` | Contact | Contatti |
| `band.h` | Write to me. | Scrivimi. |
| `foot.bio` | Software & AI Engineer and Creative Lead at SerSan. M.Sc. in Artificial Intelligence Systems at the University of Trento. | Software & AI Engineer e Creative Lead in SerSan. Laurea magistrale in Artificial Intelligence Systems in corso all’Università di Trento. |
| `foot.else` | Elsewhere | Altrove |
| `foot.colophon` | Colophon | = |
| `foot.fonts.v1` / `v2` / `v3` | Cormorant Garamond & Figtree / Geist & Geist Mono / Instrument Serif & Hanken Grotesk | Cormorant Garamond e Figtree / Geist e Geist Mono / Instrument Serif e Hanken Grotesk |
| `foot.date` | Prototype, September 2026 | Prototipo, settembre 2026 |
| `foot.legal` | Prototype for review. Not the live site. | Prototipo in revisione. Non è il sito pubblicato. |

**Prototype switcher (`?chrome=1`)**

| id | EN | IT |
|---|---|---|
| `sw.tab.sr` | Prototype identity variant, show the three variants | Variante d’identità del prototipo, mostra le tre varianti |
| `sw.aria` | Prototype identity variant | Variante d’identità del prototipo |
| `sw.heading` | Identity | Identità |

**Case template words** (owned here and passed to spec 20's renderer as `ctx.t`)

| id | EN | IT |
|---|---|---|
| `case.back` | Back to the index | Torna all’indice |
| `case.visit` (caption roll, CTA verb) | Visit | Visita |
| `case.cta` | Visit {host} | Visita {host} |
| `case.stack` | Stack | = |
| `case.pending.url` / `case.pending.film` | URL: pending / Film link: pending | URL: in attesa / Link al film: in attesa (the `dict.ts` precedent) |
| `case.since` | Since {month} {year} | Da {month} {year} (Italian months lowercase) |
| `case.live` | Live at {host} | Online su {host} |
| `case.captured` | Home page, captured {month} {year}. | Home page, catturata a {month} {year}. |
| `case.replaced.sr` | Replaced by | Sostituiti da |
| `case.next.note` (prototype only) | In this prototype the link returns to the work rail. | In questo prototipo il link torna alla galleria dei lavori. |

**The SphereNode case content** (today's `c-main.case.html`). These strings move into `cases.json` as `it` twins when spec 20 lands. Its D-C7 moves the ledger and the guardrails to `case-sphere-ai.html`, and the translations move with them.

| id | EN | IT |
|---|---|---|
| `sn.orn` | in production | in produzione |
| `sn.lead` | A vertical SaaS that replaced eight tools for the Italian retail-trading market, with Sphere AI, its bilingual RAG mentor, built in. | Un SaaS verticale che ha sostituito otto servizi per il mercato italiano del retail trading, con Sphere AI, il suo mentor RAG bilingue, integrato. |
| `sn.alt` | The spherenode.com home page: a dark trading-community landing with a green accent. | La home page di spherenode.com: una landing scura per una community di trading, con un accento verde. |
| `sn.c1.eyebrow` | 01 · What it is | 01 · Che cos’è |
| `sn.c1.h.1` ⊙ / `.2` | Eight tools, / one platform | Otto servizi, / una piattaforma |
| `sn.c1.aria` | The eight tools it replaced | Gli otto servizi che ha sostituito |
| `sn.c1.lead` | A production platform for the Italian retail-trading market that replaced eight separate tools with one product: courses, live sessions, payments and entitlements, a Trading Journal and a bilingual AI mentor. | Una piattaforma in produzione per il mercato italiano del retail trading che ha sostituito otto servizi separati con un solo prodotto: corsi, sessioni live, pagamenti e diritti d’accesso, un Trading Journal e un mentor AI bilingue. |
| `sn.c2.h.1` / `.2` ⊙ | It asks / before it guesses | Chiede / prima di azzardare |
| `sn.c2.lead` | Sphere AI is the bilingual (IT/EN) RAG mentor inside SphereNode. It answers only from the proprietary curriculum: semantic chunking and embeddings in pgvector, tier-aware retrieval with a curated fast path for canonical answers, and an LLM relevance grader on top. | Sphere AI è il mentor RAG bilingue (IT/EN) dentro SphereNode. Risponde solo a partire dal curriculum proprietario: chunking semantico ed embedding in pgvector, retrieval che tiene conto del livello d’abbonamento con una corsia rapida curata per le risposte canoniche e, a valle, un LLM che ne giudica la pertinenza. |
| `sn.c2.set` | 161-question bilingual evaluation set · before → after | Set di valutazione bilingue di 161 domande · prima → dopo |
| `m.cite` | Citation correctness · zero fabricated citations | Citazioni corrette · zero citazioni inventate |
| `sn.c2.guard` | The guardrails behind the numbers | I guardrail dietro i numeri |
| `sn.g1` | Asks for clarification instead of guessing. | Chiede chiarimenti invece di tirare a indovinare. |
| `sn.g2` | Refuses questions built on a false premise or asking for unsafe actions. | Rifiuta le domande costruite su una premessa falsa o che chiedono azioni non sicure. |
| `sn.g3` | Requires live evidence before answering anything time-sensitive. | Esige dati in tempo reale prima di rispondere a ciò che dipende dal momento. |
| `sn.g4` | Never lets static FAQ content stand in for current market information. | Non lascia mai che i contenuti statici delle FAQ prendano il posto delle informazioni di mercato aggiornate. |
| `sn.g5` | Reads the Trading Journal only as a consent-gated, owner-only source, personal data excluded by default. | Legge il Trading Journal solo con il consenso del titolare e solo per il titolare, con i dati personali esclusi per impostazione predefinita. |
| `sn.c3.eyebrow` | 03 · Reliability | 03 · Affidabilità |
| `sn.c3.h.1` / `.2` / `.3` | What had / to hold / at launch | Cosa doveva / reggere / al lancio |
| `sn.c3.lead` | A paywalled product with tiered access, live video, recurring payments and scheduled jobs, where a single defect leaks paid content or strands paying customers. | Un prodotto a pagamento con accessi a livelli, video live, pagamenti ricorrenti e job pianificati, dove un solo difetto fa uscire contenuti a pagamento o lascia a piedi clienti paganti. |
| `sn.f1.h` | Revenue-critical defects closed | Difetti critici per i ricavi, risolti |
| `sn.f1.body` | The payments-to-entitlement pipeline rebuilt as a tested state machine: access surviving cancellation, disputes and unknown events defaulting to open, empty lookups downgrading paying users, duplicate rows stranding paid customers, out-of-order events resurrecting revoked access. | La pipeline dai pagamenti ai diritti d’accesso riscritta come state machine testata: accessi che sopravvivevano alla disdetta, contestazioni ed eventi sconosciuti che aprivano l’accesso per default, ricerche vuote che declassavano utenti paganti, righe duplicate che lasciavano a piedi clienti paganti, eventi fuori ordine che riattivavano accessi revocati. |
| `sn.f2.h` | Access-control defects closed before launch | Difetti di controllo accessi risolti prima del lancio |
| `sn.f2.body` | Among them a tier leak exposing 206 live sessions and 79 transcripts to free accounts, alongside a 33-finding security audit remediated in one batch. | Tra questi, una falla tra livelli che esponeva 206 sessioni live e 79 trascrizioni agli account gratuiti; in più, un audit di sicurezza da 33 rilievi risolto in un’unica tornata. |
| `sn.f3.h` ⊙ | Silent scheduled jobs | Job fermi in silenzio |
| `sn.f3.body` | Dead for weeks while every dashboard still reported success. Root-caused, then the missing monitoring and alerting built so it cannot go unnoticed again. | Fermi da settimane mentre ogni dashboard segnalava ancora successo. Trovata la causa, poi costruiti il monitoraggio e gli avvisi che mancavano, perché non possa più passare inosservato. |
| `sn.f4.h` | Production releases as release manager | Release di produzione come release manager |
| `sn.f4.body` | Including the public launch. Plus the live-session video pipeline on Cloudflare Stream and the Trading Journal analytics engine. | Compreso il lancio pubblico. In più, la pipeline video delle sessioni live su Cloudflare Stream e il motore di analisi del Trading Journal. |
| `sn.next.body` | Seventeen scroll-locked scenes on one continuous WebGPU canvas. | Diciassette scene agganciate allo scroll su un unico canvas WebGPU continuo. |

The other eight cases are written by the spec 20 lane. Their Italian twins follow §3, with the same terms (glossary in §3.4).

### 4.3 Effort, for one lane

| Step | Work | Estimate |
|---|---|---|
| E1 | `strings.mjs` from §4.2 (transcription; the Italian is done) | 1.5 h |
| E2 | Tokenise the partials: ~190 literals → `{{t:}}`; `{{R}}` ×9; `{{EN_ON_IT}}` ×6; `{{LANGSWITCH}}` ×4 | 2.5 h |
| E3 | `assemble.mjs`: the language matrix, placeholders, `{{HREFLANG}}`, `{{I18N}}`, asserts I-1…I-9 | 3 h |
| E4 | JS: `FX.t`/`FX.lang`/`FX.num`/`FX.savePlace`; the `syncLinks` path fix; fx-nav ×5 (menu label, switcher, place on `data-lang`, `rv-origin.p`, prefetch); fx-hero ×4 | 2 h |
| E5 | CSS: `.lang` control and target size, `.nb`, the stair fit rule (lane S's rule, §3.7) | 1.5 h |
| E6 | `cases.json` twins for the eight other cases (about 30 strings each, about 240 in all), after spec 20 lands | 4–6 h |
| E7 | `parity.mjs`, then the gates: visual EN+IT × 2 templates × 2 viewports, `--reduce`, `--nogpu`, axe, the language-cut probe | 3 h |
| | **Total** | **about 2–2.5 lane-days** (1.5 without E6) |

---

## 5. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | The lane touches every lane's files (head, header, hero, main, footer, `assemble.mjs`, three fx modules). A parallel lane means a merge conflict, or a stale `{{t:}}`. | It runs **alone**, after spec 20's cases lane commits (D-I10). One commit per step E1–E7, with the director committing. |
| R2 | An EN edit made after tokenisation lands as a literal in a partial and never reaches Italian. | I-6 (the English-leak scan of the IT build) catches it at `--check`. I-2 catches orphaned ids. |
| R3 | `syncLinks()` flattens paths and sends the toggle to its own language. | §1.2 fix, plus the I-8 toggle-integrity assert, plus probe step 3. |
| R4 | A missed relative asset under `it/` (404, broken CSS). | Only 9 references, listed in §1.2. The visual gate's clean console (a 404 is an error) and a probe check that every subresource returns 200. |
| R5 | An S4 back across languages lands on the wrong rect. | `rv-origin.p` guard (§1.6 step 6); otherwise S5. |
| R6 | The place restore under an S5 arrival misbehaves on the rail runway or the S3 stage (MC-16 was only proven on reloads). | Probe step 3 parks mid-rail and mid-Path, at both widths. If it fails, restore with `FX.scroll.restore({ y })` after `fx:nav:landed` instead (one frame under the leaving sheet). |
| R7 | Fit: "Nove lavori," and future copy break the stairs. | The §3.7 fit rule for both languages, plus fit step 4 of the probe. The fallback copy is listed. |
| R8 | The Italian draft has an awkward phrase that only a native reader would catch. | It was written to §3 by a native-level editor, and the precedents were reused. Alberto reads §4.2 at R3, which does not block the build. Copy flags stay in the strings file `note`s. |
| R9 | Claim drift through translation ("1,9%" vs "1.9%", a spelled number lost). | I-5 figure parity, plus spec 20's claims gate over `it/*.html`. |
| R10 | The professional-title claim ("ingegnere"). | D-I8: the ornament stays "engineer" inside a `lang="en"` element, which I-6 skips. |
| R11 | The GPU starts twice on a quick EN → IT → EN toggle. | It is the same path as any cut. The covered arrival starts its GPU only on a still page (commit f3d3c13). There is nothing new to defend. |
| R12 | SEO in production: hreflang without absolute URLs. | `RV_SITE` must be set for any indexable build. `--check` warns when `noindex` is absent and `RV_SITE` is empty. |

---

## 6. Build checklist (one lane)

1. **Preconditions:**
   - spec 20's lane has committed;
   - `node rv/assemble.mjs --check` is green;
   - the static server answers on `http://127.0.0.1:5178/proto/rivista/` (never stop it).
2. **E1** `parts/strings.mjs` from §4.2. Check the typography by eye against §3.3.
3. **E2** Tokenise:
   - `head.html`: `{{LANG}}`, `{{R}}` ×6, `{{DESC}}`, `{{HREFLANG}}`, `{{I18N}}`;
   - `b-preloader.html`, `b-hero.html` (`{{R}}` ×3, `{{EN_ON_IT}}` on the role label and the ornament);
   - `a-header.*.html` (`{{LANGSWITCH}}` in the nav and the menu; delete the four "Italian version coming");
   - `c-main.index.html`, `c-footer.html`, `a-overlays.html`;
   - `data-pt-*` attributes included.
4. **E3** `assemble.mjs`: the language matrix and asserts I-1…I-9. Run `node rv/assemble.mjs` and then `--check`. Expect 11 EN + 10 IT pages + `fx.css`, all green.
5. **E4** JS changes (the `fx-core`, `fx-nav` and `fx-hero` lines of §1.2, §1.6 and §2.4).
6. **E5** CSS:
   - `.lang` and `.lang-alt` in `fx-nav.css` §1;
   - `.nb` in `fx-core.css`;
   - the stair fit rule in `fx-scroll.css` (lane S's rule).

   Run `node rv/assemble.mjs` (it regenerates `fx.css`).
7. **E6** `cases.json` `it` twins for all nine cases; I-9 must be green.
8. **E7** Probes and gates, all headless:
   - `parity.mjs` (counts, lang, the cut at 1440 and 390, `--reduce`, the S4-back fallback, fit);
   - `visual-gate.mjs` for `it/`, `it/case-spherenode.html` and two more cases;
   - `--reduce` and `--nogpu` on `it/`;
   - `a11y-gate.mjs` over the IT routes;
   - Lighthouse mobile gl-off on `it/` (it must equal EN within noise: same bytes plus about 2 KB of strings).

   Look at every screenshot. Console clean.
9. **Canon:** hand the §1.8 amendment to the director (R-21 and MC-28 re-scoped). Spec 20's D-C10 is superseded.
10. **Hand-off note for Alberto (R3):**
    - read §4.2;
    - confirm "Lavori scelti", "Chi sono" and "agli atti";
    - confirm the ornament decision (D-I8);
    - confirm the formal "Laurea magistrale" versus "Magistrale" (§3.7).

    Then the director commits.
