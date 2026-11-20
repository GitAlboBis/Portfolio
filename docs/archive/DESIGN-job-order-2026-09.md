> **HISTORIC.** Superseded on 2026-10-09 by the rivista V1 world "Carta e cobalto" (`public/proto/rivista/`); the live system is [`/DESIGN.md`](../../DESIGN.md). Kept for history only: do not build from it.

---
name: The Job Order — Alberto Tuveri
description: A workshop job order that stamps its six phases as you scroll it, with a live WebGPU fluid running in a framed test bench and the frame time printed in the margin.
colors:
  paper: "#f5f4ef"
  paper-field: "#ebe9e1"
  paper-carbon: "#dcd9cf"
  ink: "#141414"
  graphite: "#5a5a57"
  graphite-deep: "#4a4a47"
  stamp: "#b40f29"
  stamp-deep: "#8a0a1f"
  safety: "#ffc400"
  oil: "#c98a2a"
  rule-soft: "rgb(20 20 20 / 0.22)"
typography:
  display:
    fontFamily: "Archivo, 'Arial Narrow', Arial, sans-serif"
    fontSize: "clamp(3.25rem, 1rem + 5.6vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Archivo, 'Arial Narrow', Arial, sans-serif"
    fontSize: "clamp(1.75rem, 1rem + 1.8vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.015em"
    fontVariation: "'wdth' 112"
  lead:
    fontFamily: "Archivo, 'Arial Narrow', Arial, sans-serif"
    fontSize: "clamp(1.125rem, 1rem + 0.6vw, 1.5rem)"
    fontWeight: 400
    lineHeight: 1.35
    fontVariation: "'wdth' 100"
  title:
    fontFamily: "Archivo, 'Arial Narrow', Arial, sans-serif"
    fontSize: "clamp(0.9375rem, 0.8rem + 0.35vw, 1.125rem)"
    fontWeight: 500
    lineHeight: 1.3
    fontVariation: "'wdth' 100"
  body:
    fontFamily: "Archivo, 'Arial Narrow', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    fontVariation: "'wdth' 100"
  cell:
    fontFamily: "Archivo, 'Arial Narrow', Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "tabular-nums lining-nums"
    fontVariation: "'wdth' 100"
  label:
    fontFamily: "Archivo, 'Arial Narrow', Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 75"
  meta:
    fontFamily: "Archivo, 'Arial Narrow', Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
    fontVariation: "'wdth' 87"
  stamp:
    fontFamily: "Archivo, 'Arial Narrow', Arial, sans-serif"
    fontSize: "clamp(1rem, 0.9rem + 0.5vw, 1.25rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.04em"
    fontVariation: "'wdth' 75"
  strip:
    fontFamily: "Archivo, 'Arial Narrow', Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    fontVariation: "'wdth' 87"
rounded:
  none: "0"
spacing:
  row: "8px"
  field-pad: "16px 20px"
  field-pad-mobile: "12px 16px"
  caption-h: "24px"
  cell-h: "56px"
  band-h: "56px"
  band-h-mobile: "48px"
  gutter: "clamp(1.25rem, 3.3vw, 3rem)"
  section-gap: "clamp(2rem, 8vh, 6rem)"
  section-gap-after: "2rem"
  measure: "68ch"
components:
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "{spacing.field-pad}"
  field-filled:
    backgroundColor: "{colors.paper-field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "{spacing.field-pad}"
  phase-cell:
    backgroundColor: "{colors.safety}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    height: "{spacing.band-h}"
  stamp-filled:
    backgroundColor: "{colors.stamp}"
    textColor: "{colors.paper}"
    typography: "{typography.stamp}"
    rounded: "{rounded.none}"
    padding: "0.35em 0.6em"
  table-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.cell}"
    height: "{spacing.cell-h}"
    padding: "12px 16px"
  table-row-hover:
    backgroundColor: "{colors.paper-field}"
    textColor: "{colors.ink}"
  release-panel:
    backgroundColor: "{colors.safety}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "40px 0"
---

# Design System: The Job Order — Alberto Tuveri

## Overview

**Creative North Star: "The Workshop Job Order"**

The site is one printed job order on workshop paper. Everything on it is a field
with a stamped caption, a measured value and a provenance cell — employer, date,
link — and the only thing alive on the sheet is the engineer's own GPU fluid,
running inside a framed test bench with the frame time printed in the margin
beside it. The form is not a costume: it comes from Maintech OMA, the workshop
ERP the owner founded, whose six-phase state machine — Intake · Diagnosis ·
Estimate · Work · Test · Release — is also the visitor's path down the page. The
sticky yellow phase band accumulates rubber stamps as you scroll, one per region,
counting 1 / 6 to 6 / 6, and it never un-stamps: a job card only fills up.

The density is documentary, not editorial. Fields share their rules instead of
repeating them, tables are hairlines, numerals are tabular everywhere a figure
appears, and structure — rows, rules, perforations, stamps — is the page's only
ornament. There is one typeface at four widths, no shadow anywhere, no gradient,
no glass, no monospace costume, no dark section. Yellow is a region, never a
stripe: the band, the instrument column and the signature panel together are
about a third of the surface, and that commitment is what makes the page
recognisable with every word removed.

What this world refuses is as load-bearing as what it does: the near-black hero
with a giant name and a blob on the cursor, the logo bento, the "Selected Works"
grid with hover-reveal, and the white typographic list that is its mirror image.
Nothing here is decorative, and nothing is claimed that is not measured.

**Key Characteristics:**
- Workshop paper and safety yellow, with stamp red reserved for stamps, links and arrows.
- One family — Archivo variable — read at four widths: 125 / 112 / 100 / 87 / 75.
- Flat by direction: a single 1px ink rule is the only elevation in the system.
- Every fact carries a provenance cell; every hole is printed as a field, never as a placeholder.
- Two motion verbs, RULE-IN and STAMP, and numbers that never animate.

## Colors

Three sheets of paper, one ink, one graphite, one red and one yellow — eleven
values, no spare greys: the palette is declared with `--color-*: initial`, so a
colour that is not below does not exist in the build.

### Primary
- **Safety Yellow** (`#ffc400`): the region colour. The sticky phase band, the
  112px instrument column beside the bench, the mobile readout strip, the
  signature cell in the first viewport, the full Release panel, and the outer
  focus ring. Never a stripe, never a highlight, never a hover state.
- **Stamp Red** (`#b40f29`): rubber stamps, links, and the drawn arrow of a
  before→after pair. Stamps are always FILLED — red ground, paper lettering —
  because outlined red on yellow measures 3.68:1 and is forbidden.

### Secondary
- **Stamp Deep** (`#8a0a1f`): the one stamp lettering that may sit directly on
  the yellow band (6.13:1).
- **Oil** (`#c98a2a`): the fluid's diffuse reference. It is a WGSL constant in
  `src/webgl/waterball/render/fluid.wgsl.ts`, never text, never a UI colour.

### Neutral
- **Workshop Paper** (`#f5f4ef`): the ground of the whole site, every route.
- **Field Fill** (`#ebe9e1`): field interiors, alternating table rows, the bench
  backdrop behind the fluid, and the row-hover state.
- **Carbon Copy** (`#dcd9cf`): the ground of `/work/[slug]` — the sub-form is a
  carbon copy, an 8px-offset paper sheet on a darker one.
- **Ink** (`#141414`): all primary text, every 1px rule, and all text on yellow.
- **Graphite** (`#5a5a57`) / **Graphite Deep** (`#4a4a47`): provenance, captions
  and units, on paper and on the carbon copy respectively.
- **Rule Soft** (`rgb(20 20 20 / 0.22)`): the hairline between table rows.

### AA pairs (computed, WCAG 2.x — printed live on `/styleguide`)

| fg | bg | ratio | use |
|---|---|---|---|
| `#141414` | `#f5f4ef` | 16.73 | body, headings, values |
| `#5a5a57` | `#f5f4ef` | 6.28 | meta on paper |
| `#b40f29` | `#f5f4ef` | 6.27 | links, arrows, stamps on paper |
| `#141414` | `#ffc400` | 11.53 | phases, counter, Email, readouts, Release |
| `#8a0a1f` | `#ffc400` | 6.13 | stamp lettering on the band |
| `#f5f4ef` | `#b40f29` | 6.27 | paper lettering inside a filled stamp |
| `#141414` | `#ebe9e1` | 15.15 | values in fields, alternate rows |
| `#5a5a57` | `#ebe9e1` | 5.69 | meta in fields |
| `#b40f29` | `#ebe9e1` | 5.68 | links in fields |
| `#141414` | `#dcd9cf` | 13.04 | sub-form body |
| `#4a4a47` | `#dcd9cf` | 6.30 | meta on the carbon copy |
| `#b40f29` | `#dcd9cf` | 4.89 | links on the carbon copy |

### Named Rules

**The Region Rule.** Yellow is only ever a whole region with its own 1px ink
border — band, instrument column, signature cell, Release panel. If a yellow
shape is thinner than the thing it contains, it is wrong.

**The Ink-On-Yellow Rule.** Secondary text on yellow is `ink`, never graphite:
`#5a5a57` on `#ffc400` is 4.33:1 and is a forbidden pair. `/styleguide` prints
both forbidden pairs with their computed ratio and a FAIL verdict, at large-text
scale so the specimen itself is not a violation.

**The Filled Stamp Rule.** A stamp on the yellow band is filled red with paper
lettering. There is no outlined red stamp anywhere in the build.

## Typography

**Display Font:** Archivo variable (with `"Arial Narrow", Arial, sans-serif`)
**Body Font:** Archivo variable — the same file
**Label/Mono Font:** none. There is no second face and no monospace: readouts are
`font-variant-numeric: tabular-nums lining-nums`, not a code costume.

**Character:** one industrial grotesque read at four widths. The width axis, not
a second family, separates a wide printed name from condensed uppercase field
captions and a plain-width body — so the whole sheet is visibly one material,
the way a real form is printed by one machine.

### Hierarchy
- **Display** `.f-name` (800, `clamp(3.25rem, 1rem + 5.6vw, 5.5rem)` = 52 → 88px, lh 0.95, `wdth` 125): the owner's name. One per site.
- **Headline** `.f-headline` (700, `clamp(1.75rem, 1rem + 1.8vw, 2.5rem)`, lh 1.05, `wdth` 112): the Release ask, sub-form and styleguide headings.
- **Lead** `.f-lead` (400, `clamp(1.125rem, 1rem + 0.6vw, 1.5rem)`, lh 1.35, measure 58ch): the positioning sentence in the Owner field.
- **Title** `.f-role` (500, `clamp(0.9375rem, 0.8rem + 0.35vw, 1.125rem)`, lh 1.3): role lines, group headings, the signature ask.
- **Body** `.f-body` (400, 1rem, lh 1.55, measure `var(--measure)` = 68ch): prose in Findings and the sub-forms.
- **Cell** `.f-cell` (400, 0.9375rem, lh 1.4, tabular, wrap 44ch): every table cell and every readout value.
- **Label** `.f-caption` (600, 0.8125rem, +0.06em, uppercase, `wdth` 75): the printed caption of every field and column.
- **Meta** `.f-meta` (400, 0.8125rem, `wdth` 87): provenance, units, capture labels.
- **Stamp** `.f-stamp` (700, `clamp(1rem, 0.9rem + 0.5vw, 1.25rem)`, +0.04em, uppercase, `wdth` 75): LIVE, STILL, RELEASED, VOID.
- **Strip** `.f-strip` (500, 0.75rem, `wdth` 87): the header strip and the readout labels.

### Named Rules

**The One Material Rule.** Never add a second family or a monospace. If a run of
text needs to read differently, move it on the width axis (125 / 112 / 100 / 87 /
75), not to another typeface.

**The Printed Name Rule.** The name is printed, not assembled: no SplitText, no
per-character reveal, no count-up. The rule above it draws, and the type is
simply there.

**The Measure Rule.** Prose caps at `var(--measure)` (68ch), cells at 44ch, the
lead at 58ch. A scan list may take the sheet measure but never exceed it.

## Layout

Twelve columns at **gap 0**: fields touch on shared rules, so two adjacent fields
never draw two lines. A field draws only its top and left rule; the enclosing
`.fields` grid closes right and bottom. Page gutters are `--gutter`
(`clamp(1.25rem, 3.3vw, 3rem)`, 20 → 48px) applied once, by the `.sheet` class.

Vertical rhythm: `--row` 8px, `--section-gap` `clamp(2rem, 8vh, 6rem)` above a
phase heading and `--section-gap-after` 2rem below it, `--cell-h` 56px per table
row, `--caption-h` 24px per field caption. Field padding is `16px 20px`, and
`12px 16px` below 768px — the same fields printed tighter so a phone's first
viewport still reaches the line items.

The bench is fixed geometry: `--bench-w/--bench-h` 760×540 desktop and 350×230
below 768px, expressed as an unwrapped `aspect-ratio` (`--bench-ratio`) so the
box reserves its space and the page never shifts. The instrument column is
exactly 112px beside it on desktop and becomes a strip beneath it on mobile.

Breakpoint: one, at 768px (Tailwind `md`), plus `xl` (1280px) where the first
viewport's cover goes from stacked to bench-left / summary-right. Tables become
label/value pairs below `md`, keeping their roles so the semantics survive the
`display: block`.

### Named Rules

**The Shared Rule Rule.** Two touching fields share one 1px line. If you can see
a 2px line anywhere, a field is drawing a border the grid already closed.

**The One Renderer Rule.** One heavy renderer exists on the whole site — the
bench on `/`. `/work`, `/work/[slug]`, `/about`, `/styleguide` and the 404 mount
no canvas at all.

## Elevation & Depth

**There are no shadows in this system.** `box-shadow` appears in exactly three
declarations in `globals.css`, all of them focus rings. Depth is declared once,
as a **1px ink rule**, and everything else is flat: fields, tables, the bench
frame, the yellow regions, the stamps. The single physical gesture in the build
is the sub-form on `/work/[slug]` — a `paper` sheet offset 8px on a
`paper-carbon` ground, a carbon copy lying under its top sheet, drawn with
position and colour rather than with a shadow.

The z scale is one list and nothing in the code may add to it:
`--z-sheet 0` · `--z-bench 1` · `--z-band 20` · `--z-loupe 30` · `--z-cover 40`
· `--z-preloader 50` · `--z-skip 60`.

### Named Rules

**The Flat Rule.** No shadow, no blur, no glass, no gradient — the only
`radial-gradient` in the stylesheet draws the 6px perforation punch-hole. If a
surface needs to read as lifted, give it a rule, not a shadow.

## Shapes

Every corner is square: `border-radius: 0` everywhere, including the focus ring
and the scrollbar thumb. The form language is a ruled box — caption top-left
inside, value beneath, 1px ink border shared with its neighbours. Three recurring
shapes carry the world: the **ruled field**, the **hairline table row**
(`rule-soft` between rows, full ink rules at the head and foot), and the
**perforation** — a 1px dotted rule with a 6px punched hole at each margin, drawn
in CSS, used between sections. Stamps are the only rotated element on the site:
−3.5°, always.

## Components

### Header strip (`sheet/HeaderStrip.tsx`)
The provenance of the sheet, on every route: four contiguous `.f-strip` cells —
employer · date · Status OPEN · the EN|IT toggle — 48px tall, 40px on mobile. It
carries the skip link as its first child, inside `role="banner"`, route-aware:
`#phase-work` on the sheet, `#main` everywhere else.

### Phase band + stamps (`sheet/PhaseBand.tsx`, `usePhaseStamps.ts`, `Stamp.tsx`) — the signature
Full-bleed safety yellow, `position: sticky; top: 0`, 56px (48px mobile). Six
equal cells with 1px ink rules, a `n / 6` counter and a persistent **Email** cell
on every route. Each `#phase-<id>` region is a `ScrollTrigger` (`start: "top 60%"`,
`once: true`); on entry a filled stamp lands on its cell with the STAMP verb and
the role tag prints in ink beneath it. `aria-current="step"` follows the current
phase; every cell is a real anchor with a real target on every route. On mobile
the row scrolls with snap and the current cell scrolls itself into view.

### Field (`sheet/Field.tsx`) and RuleIn (`sheet/RuleIn.tsx`)
The captioned ruled box, and the primitive that draws a rule before its contents
are read. `tone="field"` fills with `paper-field`.

### Work table + Loupe (`work/WorkTable.tsx`, `work/Loupe.tsx`)
One table component for the sheet and for `/work` — there is no second gallery.
`variant="full"` prints Item · Measured · Role · Client · period · Open, 56px
rows, the whole row clickable and forwarding to its own title link so pointer and
keyboard take the identical path. `variant="summary"` is the cover block: its own
caption, Item and Measured only, two rows on a phone and five on the sheet. The
two jobs with a real capture carry a 160×100 cell under the **Loupe** — a second
copy of the same file at 2× under a `radial-gradient` mask, positioned by
`gsap.quickTo` on the shared ticker, with a 1px ink rim so it reads as a lens.
The glass never arms on a coarse pointer or under reduced motion, and its
magnified layer is attached at idle so a phone never downloads it.

### MeasuredRow + double bar (`sections/MeasuredRow.tsx`)
`{ label, before, after, unit, source }` printed, plus two ruled ink bars whose
lengths are proportional to the two numerals — the delta counted by eye, with no
animation and no colour coding. A figure that is not a numeric pair gets no bar.
The only motion is the 1.5px stamp-red arrow drawing itself 240ms after the row.
On mobile the shared provenance is hoisted to the group header and a row prints
its own source only when it differs.

### Test bench + readouts (`bench/TestBench.tsx`, `bench/BenchReadouts.tsx`)
A printed figure: caption ABOVE the frame, never over the fluid; the fluid inside
a 1px ink box on `paper-field`; the instrument readouts beside it in yellow —
Particles · Solver · Render · Frame · DPR · Tier · State — at a 24px pitch, every
value read from the engine. The box holds the engine's own captured frame while
the pipelines compile and while the sample settles, then cross-fades to the live
frame over 320ms and stamps LIVE. With no WebGPU or under reduced motion it stays
the captured still with the word STILL on a ruled `paper-field` plate, and the
State readout prints the reason.

### SubForm + Schematic (`work/SubForm.tsx`, `work/Schematic.tsx`)
The carbon copy: Customer · Job · Problem reported · Work performed · Measured ·
Parts · Links. Parts are numbered units carrying the `skills.ts` group id, or the
printed words "not in the catalogue" — a blank cell would read as a data gap.
Sphere AI and Maintech OMA add a ruled SVG schematic: pure boxes and 1.5px
arrows, no hand-drawn style.

### Footer and 404
Footer: the copyright line and the four public links after a perforation. 404: an
empty job order with a large filled VOID stamp, "No job order at this address."
and a "Job order ↖" cell.

### Buttons and links
There is no button component in the built world — every control is an anchor or a
band cell. Links are `.link`: stamp red, 1px underline at 3px offset, thickening
to 2px in 120ms on hover and focus. On yellow the link is ink at 4px offset; the
signature address is ink at 8px offset with a 56px target.

### Browser surfaces
All six are themed from the palette: `::selection` ink-on-paper, `caret-color`
stamp, `scrollbar-color: ink paper-field` with a ruled track, the focus ring
(2px safety + 1px ink inner, inverted to ink + paper on yellow),
`text-underline-offset` 3/4/8px by context, and tabular lining numerals wherever
a figure appears.

### Motion grammar
Two verbs, and nothing else:

- **RULE-IN** — a rule scales `scaleX 0→1` from the left in 320ms `--ease-rule`
  `cubic-bezier(.16,1,.3,1)`; the type appears 90ms later, opacity only, no
  translation: the type was already printed, the rule reveals it. Table rows
  stagger 40ms under one ScrollTrigger. `once: true`, start `top 85%`, never
  replayed.
- **STAMP** — `scale 1.18→1`, `rotate −1°→−3.5°`, `opacity 0→1`,
  `blur(1.2px)→blur(.4px)` in 220ms `--ease-stamp`
  `cubic-bezier(.2,.9,.25,1.03)`, then 60ms of `translateY 1px`. Reserved for the
  six phase cells, LIVE on the bench, RELEASED on the signature and VOID on the
  404.

Micro: row hover fills with `paper-field` in 120ms; a link underline goes 1→2px
in 120ms; a text-state swap is a **150ms clip wipe** — the value is clipped away
left-to-right in 75ms, printed, and clipped back in from the right — never a
fade, because a fade drags the glyphs through arbitrarily low contrast.

Route cover: a flat `paper` sheet rises `100%→0` in 420ms `--ease-sheet` with an
ink rule printing downward; total ≤ 600ms; GSAP Flip carries the clicked row
title into the sub-form heading.

**Never animated:** numbers (no count-up, no reel — a printed value is final at
first paint), body copy, the bench canvas (no transform, ever), and the yellow
regions.

**Reduced motion:** every rule at `scaleX 1`, all six stamps already impressed
with the counter driven by a plain scroll listener, the route cover replaced by a
150ms swap, and the bench a labelled still. The choreographic durations
(`--dur-stamp/rule/sheet/print`) go to 0 on both `[data-motion="reduced"]` and
the `prefers-reduced-motion` media query; the local feedback swaps stay.

## Do's and Don'ts

### Do:
- **Do** print every fact with a provenance cell — employer · date · link — and every hole as a field ("no photograph on file", "URL: pending", "not in the catalogue").
- **Do** keep yellow as a whole region with its own ink border, at roughly a third of the surface.
- **Do** read text from `src/content/dict.ts` (zod-validated, EN ≡ IT). No visible string is ever written in a component.
- **Do** use `tabular-nums lining-nums` wherever a figure appears, and let the arrow — never a colour — say the direction of a delta.
- **Do** move on the width axis (125 / 112 / 100 / 87 / 75) when text needs to read differently.
- **Do** keep the two motion verbs. A new interaction is expressed as a rule drawing or a stamp landing, or it is not expressed.
- **Do** give every degraded state a printed reason on a known ground ("Renderer not available on this device"), and label the still frame it shows.

### Don't:
- **Don't** add a shadow, gradient, glass, blur, dark section, monospace face, icon card, kicker over a heading that is not a real field caption, or a gradient-filled letterform.
- **Don't** animate a number, the body copy, the canvas, or a yellow region.
- **Don't** put text over the fluid; the caption is above the frame and the readouts are beside it.
- **Don't** cross-fade text through opacity on a coloured ground — wipe it.
- **Don't** put graphite on yellow (4.33:1) or an outlined red stamp on yellow (3.68:1).
- **Don't** add a z-index that is not one of the seven in the scale, or a colour that is not one of the eleven.
- **Don't** mount a second heavy renderer; the bench on `/` is the only one.
- **Don't** print a figure that is not in `PRODUCT.md` §3/§9 — `node scripts/check-claims.mjs` is the gate.
- **Don't** ship a raster without embedded provenance (`impeccable embed-prompt --scan public/...`).
