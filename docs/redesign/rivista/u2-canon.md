# U2: the "rivista bianca" canon, turned into rules for Alberto's portfolio

Sources (read-only, branch `claude/rivista-bianca`, working tree): `DESIGN.md`, `PRODUCT.md`, `.impeccable/design.json`,
`docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md`, `docs/superpowers/plans/2026-09-10-rivista-bianca.md`,
`docs/piano-documento-finale.md` §5 and §8, plus the code: `app/globals.css` (`@theme`), `app/components/Reveal.tsx`,
`app/components/motion/{TextLines,Parallax,HorizontalRail}.tsx`, `app/lib/motion/gsap.ts`.
Live capture: Domus dev server on :3321, Playwright + Chrome, 1440x900 and 390x844 DPR2.
Screenshots: `scratchpad/rivista/domus-shots/` (57 PNG files).

> Warning: the live build has moved past `DESIGN.md` in two places. (1) The home hero is no longer "lockup on the left,
> 16:9 video underneath". It is a full-width photo with the lockup centred on top of it (11 Sept update: "the photo goes back behind the lockup").
> (2) The "five stars" film fills the gold stars with gradients, which breaks the canon's own "no gradients" rule. The rules below come from the
> code and the live pixels, and they fix those two points where they need it.

---

## 1. The canon: TRANSFERABLE rules (exact values)

### 1.1 Surface and colour grammar (the structure, not Domus's colours)
- **One background from header to footer.** No section changes background, no tonal bands, no cards. Sections are told apart by empty space and hairlines alone.
  - Domus measures: body `rgb(249,245,239)`, header transparent, and `cream-deep` + a 1px hairline once scroll passes **24px** (0.3s colour transition).
- **Five neutrals and one accent**, with fixed roles:
  `paper` (the only background) · `paper-deep` (the placeholder rectangle under each photo or video while it loads, and the header after scrolling) ·
  `ink` (headings and base text, never #000) · `graphite` (lead and body copy) · `stone` (secondary text, labels, legal line, placeholders; still ≥ 4.5:1) ·
  `line` (1px hairlines only, never text) · `accent` (eyebrow, one accent word per chapter, filled CTA, round icon buttons, focus ring, selection, the active chip underline or active field line).
- **The counted-accent rule.** On any one screen the accent covers at most "one button and one word". It never fills a surface and never colours a paragraph.
- **Accent-dark** is used only for the hover and focus state of filled accent surfaces.
- **Selection:** accent background with paper-coloured text.
- **Dark surfaces:** only the preloader panel. White text only on accent buttons and on the closing video band.

### 1.2 Type scale in vw/vh (code values, `@theme` in `globals.css`)
| Token | Value | Weight · line-height | Role | Measured 1440x900 | Measured 390x844 |
|---|---|---|---|---|---|
| `--text-hero` | `clamp(3.1rem, 13vw, 13rem)` | 800 · 0.9, tracking −0.02em | the single lockup on the first screen (not an h1) | 187px | 50.7px |
| `--text-d1` | `clamp(2.4rem, min(10vh, 6.5vw), 7.5rem)` | 500 · 0.92 | page h1 and full-width chapter heads, one per page | **90px** (10vh wins) | 38.4px (the clamp floor) |
| `--text-d2` | `clamp(2.3rem, min(6.4vh, 4.2vw), 4.5rem)` | 500 · 0.95 | standard chapter head, big subhead beside a photo, mobile menu items | 57.6px | 36.8px |
| `--text-d3` | `clamp(1.5rem, min(4.5vh, 2.8vw), 2.6rem)` | 500 · 1.05 | the hero's H1 (under the lockup), row titles, half-column titles, quotes | 40.3px | 24px |
| `--text-d4` | `clamp(1.45rem, 1.8vw, 1.75rem)` | 300 · 1.2 | footer and list column heads, sub-titles | 25.9px | 23.2px |
| `--text-lead` | `clamp(1.35rem, 1.72vw, 1.55rem)` | **300** · 1.4, graphite, `max-width: 50ch` | the editorial paragraph, one or two per chapter (the most-used class) | 24.8px | 21.6px |
| `--text-body` | `1.1875rem` (19px) | 400 · 1.5, max 60ch | running text, lists, fields | 19px | 19px |
| `--text-ui` | `1rem` | 400 · 1.3 | the site minimum: legal line, notices | 16px | 16px |
| label | `1rem` | 600 · 1.3, **uppercase, tracking 0.08em** | eyebrow, buttons, chips, field labels (nav uses weight 500) | 16px | 16px |

- **The uppercase rule:** `h1, h2, h3, h4 { text-transform: uppercase }` in the stylesheet (h1–h3 at 500, h4 at 400). `blockquote` stays in sentence case.
- **The 16px rule:** no text below 1rem anywhere, and inputs are forced to 16px below 768px (so iOS does not zoom).
- **The column rule:** size follows the column, not the hierarchy. d1 and d2 go only on heads that own the full width. In a half column next to media, heads are d2 or d3. Heads stop at 14–28ch; there is no general `max-width` container.
- **Display tracking:** 0 on uppercase serif (the `display-tight` class is `line-height: 0.92; letter-spacing: 0`). Only the sans lockup takes −0.02em.
- Seen live: d1 titles span 60–75% of the width at 1440 (for example "PERCHÉ SCEGLIERE / DOMUS TUA", 886px wide, 2 lines). Two to four lines of d1 fill about a third of the viewport height. The lead sits right underneath, 2–3 lines at 25px weight 300. The contrast between heavy uppercase and light lowercase is the look.

### 1.3 Spacing, grid, rhythm
- **Row** `.dt-row`: `padding-inline: 8vw` (115px at 1440), **5vw below 768px** (19.5px at 390). No page `max-width`.
- **Chapter** `.dt-chapter`: `padding-block: clamp(6rem, 14vh, 11rem)` (measured 126px at 900h), mobile `clamp(4rem, 10vh, 6rem)` (84px at 844h). Every section uses it. There is more space above a title than below it.
- **Vertical rhythm inside a chapter:** eyebrow→title `1.5rem` · title→lead `2rem` · lead→CTA `2rem` · block→block `clamp(3rem, 8vh, 6rem)` or `clamp(4rem, 10vh, 8rem)` · title→media `clamp(1.5rem, 4vh, 3rem)` · above the first screen `clamp(2rem, 6vh, 4rem)`; step lists `mt-[10vh]`.
- **Grid:** two columns from lg (1024), gutter **6vw**, almost always asymmetric: `5fr 7fr`, `1.2fr 1fr`, `1fr 1.1fr`, `1.25fr 1fr`, `2fr 3fr`, `1fr 1.2fr`. Media on one side, text on the other, alternating from row to row.
- **Lists:** 2 columns (md), 3 columns (lg), column gap 3–4vw, row gap `4rem`. Each item is a hairline on top, a number (label in accent, e.g. `01`), a d3 title, then 19px body. This is the /vendi risk grid, the most "editorial" pattern seen live.
- **Numbered steps:** `01.`…`09.` set at **d1 weight 300**, d3 title, body text.
- **Breakpoints:** sm 640 · md 768 (section effects) · lg 1024 (set pieces) · 2xl 1536. Motion media queries use a 767.98 / 1023.98 split.
- **Anchors:** `scroll-margin-top: 6.5rem`.

### 1.4 Media treatment
- Always the full width of its column or of the page, **fixed aspect ratio, `object-cover`, border-radius 0**, no frame, veil, vignette, gradient or caption on top. Every medium sits on a `paper-deep` rectangle while it loads.
- Ratios: `aspect-video` 16:9 for video and the closing band, `aspect-square` for chapter photos, `4/5` for portraits. Rail tiles are 4/5, 3/2 or 4/3 with vw widths (**phone/tablet/desktop: 78/52/34 · 92/78/63.75 · 92/70/56.67 vw**).
- Parallax on chapter photos: `speed -0.04` → ±0.56% of the element's own height, linear scrub across the whole pass, half travel below 768px.
- Video: a facade with the real poster plus a **96px round accent play button** (white triangle, scale 1.05 on hover, 0.3s). The iframe loads on click.
- One `priority` image per page (the LCP).
- Text over an image happens exactly once: the closing video band.

### 1.5 Hairlines, shapes, depth
- Hairline `1px line`: header after scroll, footer top, legal line, list separators, mobile menu items. Separation comes from hairlines or empty space, never from a surface.
- **Radius 0 everywhere.** The only curve is the **round icon button**: play 96px, arrows 56px (1px ink outline → filled accent), floating action 56px, social 44px (paper with a line border → accent), photo controls 44px, FAQ "+" 32px. A word never goes inside a circle.
- **No shadows** (the one exception is a hover halo on social icons, which is optional and I would drop it), no blur, no glass, no gradients.
- Focus: `outline: 2px solid accent; outline-offset: 3px` on everything. Fields have no ring: their bottom line turns accent instead.
- Depth comes from scale (huge titles, huge media) and from two-plane motion (the rail moves while the photos inside it pan the other way).

### 1.6 Components
- **Chapter head cell** (opens every section): eyebrow (label in accent, with a `::before` dash `1.75rem × 1px`, opacity 0.6, gap 0.5rem) → d1/d2 uppercase title → (one ornamental accent word, `aria-hidden`, indented 14–24vw, overlapping the title's last line by about −0.4em) → graphite lead ≤ 50ch → ghost link. Left-aligned by default. One chapter per page may be right-aligned (Domus "Metodo").
- **Buttons** `.dt-btn`: inline-flex, gap 0.6rem, label 1rem/600/uppercase/0.08em, line-height 1.2, `transition: background-color .25s, color .25s, border-color .25s`, min-height 2.75rem on coarse pointers, trailing ArrowUpRight 1.1em (stroke 1.4).
  - `cta-solid`: filled accent, white text, 1.5px accent border, padding `1.05rem 2rem` (sm `0.8rem 1.4rem`, lg `1.2rem 2.4rem`), accent-dark on hover. **One per screen.**
  - `cta` outline: transparent, 1.5px accent border, accent text, fills on hover.
  - `ghost` (everything else): no box, padding `0.4rem 0`, ink text, `underline` 1.5px, `text-underline-offset: 0.35em`, accent on hover. `ghost-dark` (white) only on the closing band.
- **Inline links:** `.link-underline` (background-size 0→100% × 1.5px, 0.4s expo) or `.link-draw` (::after scaleX 0→1, 0.35s, origin left). Nav: underline offset 0.4em for hover and for the current page.
- **Fields:** no box, only a 1px ink bottom line, padding `0.75rem 0`, 19px, label above in label style (stone). On focus the line turns accent. Checkbox 20px with `accent-color`.
- **Chips / tabs:** uppercase labels in stone, min-height 2.75rem, 2px transparent bottom line, selected = accent line plus ink text (`aria-pressed`). Seen live in the contact form ("VOGLIO VENDERE" underlined).
- **Header (desktop ≥ lg):** height `clamp(5rem, 12vh, 7.5rem)`, logo `clamp(150px, 14vw, 220px)`. It scrolls away (it is not sticky) and splits into two rows: brand and mark on top, uppercase nav right-aligned underneath. Below lg it is sticky with a "MENU / CHIUDI" underlined word, and the menu is a full-screen paper panel with d2 uppercase items separated by hairlines (current item in accent), then the CTA and the language switch.
- **Footer:** light, in the page flow, hairline on top, padding-top `clamp(4rem, 10vh, 7rem)`, columns `1.4fr 1fr 1fr 1fr` with gap 3rem. Column heads are **d4 weight 300 uppercase**, lists at 19px, bare links that underline on hover (offset 4px), a legal line at 16px in stone above a final hairline, safe-area bottom padding.
- **Mobile action bar** (below 640): fixed, paper, hairline on top, a full-width CTA plus one 52px round button. Portfolio equivalent: an "Email" CTA.

### 1.7 Motion gestures (code values)
Easing tokens: `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)` · `--ease-soft: cubic-bezier(0.32, 0.72, 0, 1)` ·
`--ease-domus: cubic-bezier(0.22, 0.9, 0.36, 1)` (GSAP CustomEase `domus` = `M0,0 C0.22,0.9 0.36,1 1,1`, `domus.inOut` = `M0,0 C0.66,0 0.22,1 1,1`) ·
`dtOut 0.25,1,0.5,1` · `dtHorScroll 0.25,0,0.75,1`. Reference site: `cubic-bezier(.2,.65,.3,1)`.
Durations: micro 0.3 · short 0.6 · reveal 0.9 · hero 1.4 · transition 1.1. Staggers: chars 0.06 · words 0.10 · lines 0.11 · cards 0.12. Rise distance 48px (never 100+).

1. **Lines rising from a mask** (`TextLines`): SplitText `type: "lines", mask: "lines"`, `yPercent 112 → 0`, **1.05s `expo.out`, stagger 0.09s**, trigger `top 86%`, `toggleActions: "restart none none reverse"`, `autoSplit`, split only after `document.fonts.ready`, `aria: "none"`.
   Optional exit mode: `yPercent → −110`, 0.4s `power2.in`, stagger/2, on leave-back.
   **Observed live** (Servizi h2, frames about 150ms apart): frame 0 shows only the accents of line 1 above the mask edge while the eyebrow is at about 15% opacity; frame 1 has the three lines at roughly 70/60/40% of their rise, visibly staggered, each cut flat by its own mask (letters are never faded); frame 3 is settled. The whole beat reads in about 0.6s, then a long exponential tail.
2. **Fade-up** (`Reveal`, CSS + IntersectionObserver): `opacity 0 → 1`, `translateY(2.5rem) → 0`, **0.9s ease-out-expo**, `threshold 0.12`, `rootMargin 0 0 -8% 0`, reversible (it leaves when out of view), stagger by `transitionDelay` 80–200ms, 2.5s safety timer, `will-change` only while hidden.
3. **Parallax drift:** scrub, transform only, `speed × 14` yPercent (±0.56% at −0.04), half travel below 768px. Rail: inner photo `xPercent ±depth(6)`.
4. **Scroll-driven horizontal rail** (`HorizontalRail runway={120}`): ≥1024 with motion allowed, the track parks in the middle of the screen (sticky inside a corridor = track height + 120svh) and translates by its whole overflow, `ease: none`, `scrub 0.6`; the photos pan the opposite way by ±4%. Below 1024: native horizontal scroll with snap, CSS parallax via `--rail-p`, and a 2px × 4rem progress indicator (track in ink at 15%, cursor in accent). Tile gap `clamp(0.75rem, 1.6vw, 1.75rem)`, left padding `clamp(1.25rem, 5vw, 5rem)`.
   **Observed live:** three large tiles (4/5, 16:10-ish, 3/2) about 610px tall at 1440x900, with a 19px caption under each and the first tile cut by the left edge, so the page clearly moves sideways.
5. **Horizontal panels** (`HorizonScroller`, ≥lg): a sticky screen where two panels slide horizontally while the page scrolls down. Panel 1 is a manifesto with a per-character entrance (seen live: letters of the last line rising with opacity 0.4→1 and letter-spacing collapsing). Panel 2 has d1 title steps in counter-parallax, and its photo opens like a curtain (clip). Below lg, without JS or with reduced motion, it becomes two stacked blocks.
6. **Rotating mark:** a ring of 60 ticks plus a monogram turning clockwise at 30°/s (one turn per 12s). With scroll velocity it goes to `30 + 10·|v|` in 0.3s (domus ease) and settles back in 1.1s. Shown in the header from lg at 44px.
7. **Preloader film** (the structure transfers; the arch door and the espresso panel do not): once per session (sessionStorage), never with reduced motion or a URL hash, skipped by a tap or a key, CSS-driven with a JS failsafe. Structure: dark panel → lockup letters rise (0.12s start, stagger 0.075) → signature at 0.60s → loading line 0.60→2.15s → mask opens onto the page 2.25→3.35s → dive 3.13→4.63s → autohide 4.73s / failsafe 5.23s.
   **Observed live:** at 3.4s the page is revealed inside a round-topped mask that is still growing, and the lockup letters are fading into the hero.
8. **Closing video band:** 16:9 at full width, `min-h: 70svh`, video scaled 1.14 to crop, white d1 title ≤ 12ch plus a `ghost-dark` link at d4 300, bottom-left at `bottom: 12vh`.
   **Observed live:** the white d1 over a bright aerial shot of a pool loses contrast in places. Do not copy this unless the media is controlled (see §3).
- Rules: animate only transform, opacity and clip-path; every animation sits inside `gsap.matchMedia("(prefers-reduced-motion: no-preference)")`; hidden states are set only by JS (the text is always in the initial HTML); no transforms on ancestors of sticky or fixed elements; one Lenis instance on the GSAP ticker with `ScrollTrigger.config({ ignoreMobileResize: true })`; hidden states that contain links use `opacity`, never `autoAlpha`.
- Domus explicitly **refused** page transitions and a custom cursor. Alberto explicitly **wants** transitions, so they are the main extension (§3.4).

### 1.8 Do / Don't (transferable)
**Do:** one background · titles measured against the viewport, uppercase, line-height 0.92–0.95 · the same chapter cell everywhere · accent only for accents and conversion (one filled CTA per screen, the rest are underlined uppercase links) · media full width, square-cornered, on paper-deep · all text ≥ 16px · hairlines and empty space as the only separators · every animation reversible and inside motion-ok · the page stays beautiful when frozen (reduced motion = complete static page).
**Don't:** radii (except round icon buttons) · shadows, blur, gradients, veils or vignettes on media · cards, boxes, pills · dark surfaces outside the preloader · text below 16px · more than one ornamental accent word per chapter, or putting one over a photo · d1/d2 in half a column · extra pinned sections beyond the registered set pieces · flowers or drawn ornaments · stats without a source.

---

## 2. DOMUS-SPECIFIC (do not carry over)
- Red `#d20a0a` / `#a30707`, the selection in red, the red eyebrow.
- Gold `#c9a227` on the Google-rating stars, and the whole five-star film (a star-shaped mask, the Top Agency photo, the golden glint).
- Playfair Display (the didone), Plus Jakarta Sans with `ss01/cv01`, the Pinyon Script red ornamental word and the "Raffaela Rizza" signature. `--font-brand` = Jakarta 800 for the lowercase "Domus **Tua**" lockup.
- The espresso preloader panel `#1c1512` with warm radial gradients, the arch door mask (24vw → 36vw → 125vw), the Raffaela cut-out silhouette, the "heart" monogram badge on a paper disc.
- Real-estate content: valuation CTA "Richiedi la valutazione", "Vendi/Cerco casa", Open Domus, Domus D.O.C., Metodo 01–09, Trustindex, video reviews, the WhatsApp floating button and mobile bar, the property search form, the team portraits rail, the aerial pool closing video, Tradate/Varese territory.
- The warm `photo-warm` filter (`saturate 1.06 contrast 1.02 sepia .05`).
- The "no AI in the copy" brand rule (the opposite of Alberto's case).
- The 5-language client-side i18n (Alberto uses EN/IT).
- Page length: 32,306px at 1440 (≈36 viewports) and 33,293px at 390. Far too long for a portfolio; aim for 10–14 viewports on `/`.

---

## 3. Translation to Alberto's portfolio (Software & AI Engineer · Creative Lead)

### 3.1 Role map
| Domus element | Portfolio element |
|---|---|
| Header: logo, rotating mark, 9 uppercase nav items | Wordmark "ALBERTO TUVERI" (label weight 600, or display d4) at left · **rotating mark** = a 60-tick ring around an "AT" monogram, same 30°/s + scroll-velocity rule · nav `WORK · ABOUT · CONTACT` + `EN / IT` + a persistent `EMAIL` ghost link |
| Hero lockup "Domus Tua" at 13vw | **"ALBERTO / TUVERI"** in the display face, uppercase, `clamp(3.1rem, 13vw, 13rem)`, 2 lines, line-height 0.9 (at 1440, "TUVERI" ≈ 6 characters × 13vw fits inside the 84vw row) |
| Pinyon signature under the lockup | The one ornamental accent element on the first screen: V1/V3 an italic serif word in accent ("engineer"), V2 an accent hairline plus the role in label style |
| H1 d3 "Vendi casa a Tradate…" | H1 d3, ≤ 28ch: "Software & AI engineer. I build products, pipelines and the motion that sells them." (copy from `dict.ts`; no invented numbers) |
| 16:9 hero video / photo behind the lockup | **The live WebGPU MLS-MPM fluid as full-bleed 16:9 media**: square, no frame, cleared to `paper` (or `ink` fluid on paper), `aspect-video w-full`, `object-cover` equivalent. The readouts become a **caption row under the media** in label style, separated by hairlines (`PARTICLES 40,000 · SOLVER MLS-MPM · FRAME 6.8 MS · DPR 1.5 · TIER HIGH`, all read from the engine), not a yellow column. The fallback is the captured still with the caption "Still frame captured from this engine". The lockup stays **above** the media, not over it (text is never over an image). |
| Filled CTA "Richiedi la valutazione" (one per screen) | `cta-solid` **"Start a project"** / `mailto:` (the single conversion) · ghost links "Selected work ↓", "About" |
| Chapter "Come lavoriamo / Perché Domus Tua" horizontal panels | **"How I work"**: two horizontal panels ≥lg. Panel 1 is a manifesto (per-character entrance). Panel 2 is "Engineering × Creative lead" with the d1 steps in counter-parallax and a capture that opens like a curtain |
| Team rail (`HorizontalRail runway 120`) | **Selected work rail**: 9 works as 16:9 / 4:5 / 3:2 tiles (real captures for `sersan-io` and `spherenode`; missing media become a **typographic tile** on paper-deep with the d2 title and "no photograph on file", which is canon-compatible because it is a paper-deep rectangle, not a card). Caption under each tile: `NAME` d3 + role/year at 19px. Tile click = page transition to `/work/[slug]` |
| Metodo 01.–09. numbered steps | **Measured results**: `01.`… d1 weight 300 number, d3 title, body line with the source figure (only numbers in `PRODUCT.md` §3/§9; Voice AI prints "—") |
| Open Domus benefit columns / /vendi risk grid | **Capabilities**: 3-column hairline list (AI & agents · Web & WebGPU · Creative direction & motion), d4 weight 300 uppercase heads, 19px items with an accent 1.75rem dash |
| Services 3-column photo grid | **Education & path**: rows, not photos. d2 head "M.Sc. Trento …", lead, hairline timeline rows (year label · role d3 · place body) |
| Contact chapter (form "a filo") | **Contact**: d1 "LET'S BUILD THE NEXT ONE." + email at d2 as a ghost link (underline 1.5px, offset 0.35em) + optional bottom-line form with chips `PROJECT · ROLE · TALK` |
| Closing video band (white d1 over video) | **Closing fluid band**: the same engine at 16:9 `min-h 70svh`. Budget rule "one heavy renderer": **re-parent the single canvas** (or pause the hero instance and resume here, gated by IntersectionObserver), or use a **recorded clip of the engine** labelled as such. Because we control the clear colour, set the title in `ink` on a paper-cleared fluid, or in white only over an ink-coloured fluid: this fixes the legibility problem seen on Domus |
| Footer 4 columns | brand + one-line lead · Contact (email, GitHub, LinkedIn) · Pages · Colophon (stack, "fluid solver: WaterBall MLS-MPM", fonts). Legal line at 16px in stone |
| Mobile action bar | Paper bar with a full-width `EMAIL` CTA (no WhatsApp) |

### 3.2 Page set
`/` (hero · How I work panels · Selected work rail · Measured · Capabilities · Path · Contact · closing band) ·
`/work` (all 9 as alternating `5fr 7fr` media/text rows) · `/work/[slug]` (inner PageHero: eyebrow → d1 `clamp(3rem, 8vw, 9rem)` title → accent word → lead → 16:9 media → risk-grid style "Problem / Build / Result" 3-column hairline list → next-project band) · `/about`.

### 3.3 "More motion than Domus": what gets added, still inside the canon
All of it is transform/opacity/clip-path only, inside motion-ok, reversible, and static with reduced motion.
1. **Page transitions** (Domus had none; Alberto asked for them). A **square paper sheet wipe**: an overlay in `paper` rises with `clip-path: inset(100% 0 0 0) → inset(0)` in 0.55s `domus.inOut`, the route swaps under cover, then the overlay leaves `inset(0) → inset(0 0 100% 0)` in 0.65s while the new page's d1 runs `TextLines` (delay 0.15s). Total ≈ 1.1s (the `dur.transition` token). A variant for work tiles: the tile's media rectangle **Flip-expands** to the 16:9 hero of `/work/[slug]` (square corners, no curve). Skip on hash links and with reduced motion (instant swap).
2. **Preloader film** without the arch: paper panel (not dark, or `ink` if one dark moment is wanted, as Domus allows exactly one) → "ALBERTO / TUVERI" letters rise (stagger 0.06) → a 1px loading hairline 0→100% driven by the real WebGPU warm-up states (`compiling → warming → live`) → a **centred 16:9 rectangle** opens to full bleed (`clip-path: inset(30% 25%) → inset(0)`, 1.0s domus) onto the live hero. About 2.5–3s, once per session, skip on input, failsafe timer.
3. **Hero media entrance:** the 16:9 fluid rises 10vh and un-clips from `inset(0 0 100% 0)` (1.4s `dur.hero`). Then a subtle scroll drift (Parallax −0.04) and a slight scale 1.0→1.06 while it leaves.
4. **TextLines with `exit`** on every d1/d2 (the out-state makes a long page feel continuous).
5. **Rail with two planes** (track plus media pan ±4%) and a 2px progress cursor in accent.
6. **Rotating mark** tied to scroll velocity.
7. **Hover micro-motion:** tile media `scale 1.03` in 0.6s expo inside overflow-hidden; ghost links draw the underline (`.link-draw`, 0.35s); round arrow buttons fill with accent (0.25s).
8. **Measured numbers** do **not** tick up (honesty: they are read, not performed); they rise line by line with the list.

---

## 4. Three identity variants (no yellow, no gold, no purple gradients). All ratios are WCAG 2.x, computed.

### V1 "Carta e cobalto": closest to the rivista bianca
Warm paper, graphite ink, one saturated cobalt, uppercase serif display.
| Token | Hex |
|---|---|
| paper | `#f6f3ec` |
| paper-deep | `#ede7dc` |
| ink | `#24211e` |
| graphite | `#48443e` |
| stone | `#6b665d` |
| line | `#dcd5c8` |
| accent (cobalt) | `#2340c9` |
| accent-dark | `#1a2f99` |

AA pairs: ink/paper **14.45** · graphite/paper **8.72** · stone/paper **5.14** · stone/paper-deep **4.63** · cobalt/paper **7.16** · cobalt/paper-deep **6.44** · white/cobalt **7.93** · white/cobalt-dark **10.99** · paper/ink **14.45** · line/paper 1.32 (hairline only, never text).
Fonts: **Cormorant Garamond** 500, 600 + italic 500 (display d1–d3 uppercase; italic accent word) · **Figtree** 300, 400, 600 (lead 300, body 400, labels 600).
Feel: the white magazine with a signed-ink cobalt instead of a brand red, so it reads as a literate engineer's journal, calm and expensive.

### V2 "Laboratorio": technical
Cool white, near-black ink, one cool teal accent, uppercase grotesk display.
| Token | Hex |
|---|---|
| paper | `#f5f6f7` |
| paper-deep | `#eceef0` |
| ink | `#0f1113` |
| graphite | `#363b41` |
| stone | `#5b6269` |
| line | `#d9dde1` |
| accent (signal teal) | `#00766c` |
| accent-dark | `#005a52` |

AA pairs: ink/paper **17.49** · graphite/paper **10.44** · stone/paper **5.72** · stone/paper-deep **5.32** · teal/paper **5.10** · teal/paper-deep **4.74** · white/teal **5.51** · white/teal-dark **8.13** · paper/ink **17.49** · line/paper 1.26 (hairline only).
Fonts: **Geist** 300, 400, 500, 600 (display d1–d3 uppercase at 500 with `letter-spacing: -0.02em` and line-height 0.9; lead 300; labels 600 at 0.08em) + optional **Geist Mono** 400 only for the engine readout caption row.
Feel: a clean lab bench in daylight; the fluid can be rendered in the same teal, so the accent and the proof are one material.

### V3 "Verde bottiglia": editorial
Paper, graphite, a deep bottle-green accent, a condensed high-contrast serif.
| Token | Hex |
|---|---|
| paper | `#f2eee6` |
| paper-deep | `#e8e2d6` |
| ink | `#26231f` |
| graphite | `#443f39` |
| stone | `#6a645b` |
| line | `#d8d1c3` |
| accent (bottle green) | `#1d4a39` |
| accent-dark | `#133328` |

AA pairs: ink/paper **13.52** · graphite/paper **9.00** · stone/paper **5.06** · stone/paper-deep **4.54** · green/paper **8.68** · green/paper-deep **7.79** · white/green **10.04** · white/green-dark **13.71** · paper/ink **13.52** · line/paper 1.31 (hairline only).
Fonts: **Instrument Serif** 400 + italic 400 (display d1–d3 uppercase at 400, line-height 0.9; the italic is the one ornamental word per chapter) · **Hanken Grotesk** 300, 400, 600 (lead, body, labels).
Feel: a printed quarterly with a bound green spine; quieter and more authored than V1, and the deep accent never shouts.
Note: this accent is dark, so use it for words, rules and filled CTAs, and never for large fills. A hover on a filled CTA goes to accent-dark (13.7:1 with white).

### Comparison (Domus reference)
Domus: graphite/paper 9.18 · stone/paper 5.24 · red/paper 5.10 · white/red 5.54. All three variants match or beat it on every text pair.

---

## 5. Evidence: screenshots (`scratchpad/rivista/domus-shots/`)
- Preloader: `d-00-preloader-1s.png` (espresso panel, lockup forming, Raffaela silhouette), `d-00-preloader-3.4s.png` (arch mask opening onto the page), `d-00-after-preloader.png`.
- Home desktop 1440x900: `d-01-home-top.png` … `d-13-home-y31406.png` (12 equal steps over 32,306px).
- Home mobile 390x844 DPR2: `m-01-home-top.png` … `m-13-home-y32449.png`.
- Set pieces: `d-set-horizon-{15,40,65,90}.png` (horizontal panels), `d-set-star-{20,50,80}.png`, `d-set-rail-{10,50,90}.png` (team rail), `d-set-band.png` (closing band).
- TextLines frames: `d-tl-frame0..3.png` + `d-tl-frame-end.png` (Perché Domus Tua), `d-tl2-frame0..5.png` (Servizi h2, ≈150ms apart, 700px crop).
- Inner pages: `{d,m}-inner-vendi-{top,1,2}.png`, `{d,m}-inner-chi-siamo-{top,1,2}.png`.

## 6. Live look, described
- **First viewport (desktop, live build):** light header, 106px, with the mark and logo on the left and a 9-item uppercase nav (16px, weight 500) on a second right-aligned row. Under it, a full-width photo band 540px tall (60% of the viewport) with "Domus / Tua" centred on the photo in Jakarta 800 at about 145px cap height (2 lines, 55% of the width, graphite + red) and the Pinyon signature overlapping. Under the band, centred: the eyebrow in stone, a d3 H1 on 3 lines (40px Playfair uppercase), then the red CTA at the fold. Mobile: a 390×500 hero photo, the same stack, a full-width red CTA at the bottom.
- **Chapter screens:** about 40% of each screen is empty paper. A d1 head covers 60–75% of the width, set 115px from the left edge. The lead at 25px/300 feels as big as a normal site's H3 but light. Photos are square and hard-edged, often touching the right edge of the viewport (the /vendi media and the horizon panel photo go full-bleed right), with no frames.
- **Inner page hero (/vendi, /chi-siamo):** the eyebrow at 176px from the top, the title `clamp(3rem, 8vw, 9rem)` → 115px uppercase on 2 lines filling 60% of the width, the red Pinyon word overlapping the second line, a 3-line lead, a solid CTA + ghost link, a row of three uppercase reassurance labels in stone, then a full-bleed photo starting at 850px. This is the purest expression of the canon and the best template for `/work/[slug]`.
- **Mobile:** d1 falls to the 38px clamp floor, so heads run 3–4 lines. The lead at 21.6px dominates. The 5vw gutter is only 19.5px. Fixed round buttons and the mobile action bar cover content at the bottom right (avoid stacking two fixed circles in the portfolio).
- **Motion observed:** mask-cut line rises with a visible stagger and a long expo tail (≈0.6s visible, 1.05s total); the eyebrow, lead and link fade up 2.5rem after the title; the horizontal panels slide a whole screen sideways under a sticky viewport; the rail moves three tall photos sideways while you scroll down; the preloader ends by opening a mask onto the already-rendered page (strong continuity: the page is under the curtain, not loaded after it).
- **Canon breaches seen live (lessons):** gold stars with metallic gradients; white d1 over a bright aerial video with no contrast control; an overall length of about 36 viewports.

## 7. Dev server hygiene
- Started `npx next dev -p 3321` (PID 23572 → 18608), stopped with `taskkill /PID 23572 /T /F`. Port 3000 (PID 22348) was not touched.
- `git -C C:/Users/alber/domus-tua-site status --short`: **empty** (no tracked or untracked changes). Only the git-ignored `.next/` cache was written by the dev server. `next-env.d.ts` and `tsconfig.tsbuildinfo` still carry their 2026-09-11 timestamps. Nothing was reverted or committed.
