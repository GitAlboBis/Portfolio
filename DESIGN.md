---
name: Lo studio di notte — Alberto Tuveri
description: Every page is a room of the same lit studio at night, seen by one travelling eye. A near-black blue ground, warm white type in one condensed grotesk family set like film titles, a back wall ruled as a grid, chips of cut glass shaped as the letter A and the SerSan mark, blades of light, one swarm of points that becomes every figure, thick plates of clear cut glass that hold the work and bend the light and the type behind them, a flight through a door of glass between pages, a synthesized room sound, and a straight edge at the end of every page where the night becomes morning.
colors:
  night: "#0c0e14"
  night-2: "#12151d"
  ink: "#f4f1ea"
  body: "#cfcabf"
  mute: "#9a958a"
  line: "#262a36"
  accent: "#8fa2ff"
  cobalt: "#2340c9"
  dawn: "#f3f4f6"
  dawn-ink: "#0c0e14"
  dawn-body: "#3a3f4b"
  dawn-mute: "#5d6270"
  dawn-line: "#d6d9e0"
typography:
  mega:
    fontFamily: "'Sofia Sans Extra Condensed', 'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "clamp(5rem, 18.5vw, 21rem)"
    fontWeight: 800
    lineHeight: 0.86
    letterSpacing: "0"
  d1:
    fontFamily: "'Sofia Sans Extra Condensed', 'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "clamp(3.5rem, 9vw, 9.5rem)"
    fontWeight: 800
    lineHeight: 0.86
    letterSpacing: "0"
  d2:
    fontFamily: "'Sofia Sans Extra Condensed', 'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "clamp(2.2rem, 4.4vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "0"
  # the reading sizes below are the phone's; from 1024 px they are fluid clamps that grow with the screen
  # (rv/css/tokens.css, the media query): the Typography section gives both.
  lead:
    fontFamily: "'Sofia Sans', 'Barlow', system-ui, sans-serif"
    fontSize: "clamp(1.375rem, min(1.9vw, 1.07rem + 0.714vw), 2.125rem)"
    fontWeight: 400
    lineHeight: 1.38
  body:
    fontFamily: "'Sofia Sans', 'Barlow', system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
  small:
    fontFamily: "'Sofia Sans', 'Barlow', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "'Sofia Sans Condensed', 'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.06em"
  action:
    fontFamily: "'Sofia Sans Condensed', 'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.04em"
  nav:
    fontFamily: "'Sofia Sans Condensed', 'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.06em"
  metric:
    fontFamily: "'Sofia Sans Extra Condensed', 'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "clamp(1.75rem, 2.6vw, 2.5rem)"
    fontWeight: 800
    lineHeight: 1
    fontFeature: "tnum, lnum"
  address:
    fontFamily: "'Sofia Sans', 'Barlow', system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3.6vw, 3.25rem)"
    fontWeight: 500
    lineHeight: 1.1
rounded:
  none: "0"
spacing:
  gut: "clamp(1rem, 3vw, 3rem)"
  s1: "0.25rem"
  s2: "0.5rem"
  s3: "1rem"
  s4: "1.5rem"
  s5: "2.5rem"
  s6: "4rem"
  s7: "6.5rem"
  s8: "10rem"
  col: "34rem"
  hdr: "4rem"
  btn-h: "3.5rem"
  target-min: "2.75rem"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.none}"
    padding: "0 1.6em 0 1.5em"
    height: "{spacing.btn-h}"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.night}"
  quiet-link:
    textColor: "{colors.ink}"
    typography: "{typography.action}"
  quiet-link-hover:
    textColor: "{colors.accent}"
  header:
    textColor: "{colors.ink}"
    typography: "{typography.nav}"
    height: "{spacing.hdr}"
  header-solid:
    backgroundColor: "{colors.night-2}"
    textColor: "{colors.ink}"
    height: "{spacing.hdr}"
  header-dawn:
    backgroundColor: "{colors.dawn}"
    textColor: "{colors.dawn-ink}"
    height: "{spacing.hdr}"
  sound-toggle:
    textColor: "{colors.body}"
    typography: "{typography.nav}"
    height: "{spacing.target-min}"
    width: "{spacing.target-min}"
  sound-toggle-off:
    textColor: "{colors.mute}"
  menu:
    backgroundColor: "{colors.night-2}"
    textColor: "{colors.ink}"
    typography: "{typography.d1}"
  cut-sheet:
    backgroundColor: "{colors.night-2}"
    textColor: "{colors.ink}"
    width: "100vw"
    height: "100vh"
  cut-sheet-dawn:
    backgroundColor: "{colors.dawn}"
    textColor: "{colors.dawn-ink}"
    width: "100vw"
    height: "100vh"
  cut-card-flight:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
  index-row:
    textColor: "{colors.ink}"
    typography: "{typography.d1}"
  metric-row:
    textColor: "{colors.ink}"
    typography: "{typography.metric}"
  dawn-close:
    backgroundColor: "{colors.dawn}"
    textColor: "{colors.dawn-body}"
    height: "100svh"
  selection:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.night}"
  selection-dawn:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.dawn}"
---

<!-- Rewritten 2026-11-17 FROM THE CODE of public/proto/rivista/ and web/ by the DOCS lane of wave 5 (notes
     docs/redesign/rivista-story/build/n-docs.md): feat/water-viva with wave 5, committed by the director in f5c8e77 … 3868582 (the
     flight, the sound, the cases' figures). It replaces the version of 2026-11-11, which stopped at round 10 and is in
     git at 0769075. The code wins over any doc, this file included. Machine twin: .impeccable/design.json.
     Contracts: docs/redesign/rivista-story/50-from-zero-spec.md and 70-continuous-world-plan.md; where the build left
     them: docs/redesign/rivista-story/60-as-built.md. Numbers quoted from a lane's measures name the lane's notes;
     everything else was read in the file it cites. -->
# Design System: Lo studio di notte — Alberto Tuveri

> **Source of truth.** The prototype `public/proto/rivista/` (abbreviated `rv/`), in two editions: English at the root,
> Italian in `rv/it/`. When this file and the code disagree, the code wins and this file is stale. Citations name the
> file and the selector or token to search for. The pages and `rv/fx.css` are generated twice from the same parts:
> by `rv/assemble.mjs`, and by the Astro project in `web/`. The stage is `rv/fx-stage.js` (the page host) and
> `rv/stage/**` (the engine; its API is the header of `rv/stage/stage.js`, a scene's API is
> `rv/stage/scenes/README.md`). Facts printed on the page: only `PRODUCT.md` §3, §9, §10 and §11 (gate:
> `node scripts/check-claims-proto.mjs`).

## Overview

**Creative North Star: "One lit studio at night, one travelling eye"**

Every page is a room of the same studio at night, and the reader's scroll moves one eye through it in a single
continuous shot. The room is near-black blue and it is lit: a back wall ruled as a grid in relief, chips of cut glass
shaped as the letter A and as the SerSan mark hanging at every depth, blades of light that travel across the wall. In
the room, one swarm of points with a memory becomes every figure the story needs (a name, a line through the room,
bars of measured figures, the agents of a system, Obla's outline), and thick plates of clear cut glass with straight
edges hold the real work and bend the light and the display type behind them. The type is warm white, one condensed
grotesk family set in capitals like the titles of a film, and the page's 2D layer moves like a title sequence. Between
pages the eye flies through a door of glass. The room has a sound. Every page ends at a straight edge where the night
becomes morning: a white ground, the same points as cobalt ink, and the address to write to.

With all content removed: a dark room with a faintly ruled wall, chips of glass in the air, two slanted shafts of
light, and standing plates catching the studio's lights.

**Key characteristics**

- One ground (`--night`) on every page but Contact, which is the morning whole (`--dawn`).
- One superfamily, Sofia Sans, in three widths and three roles: display, text, labels. No serif, no mono.
- Structure in the DOM is a 1 px rule (`--line`) and the step from `--night` to `--night-2`. Square corners. No CSS
  shadow, glow, gradient or backdrop blur anywhere: every glow is the canvas's.
- One accent for marks (`--accent`, a light periwinkle) and one cobalt surface (`--cobalt`, the filled button; the ink
  at dawn).
- Every page is one continuous shot: a scene never swaps a figure in place, the eye travels from one to the next.
- The motion verbs are **focus** (text comes into focus, steps pull focus) and **the rise** (display type comes up
  from behind a straight mask, letter by letter). No text slides in from a side.
- Text is sacred: the canvas is drawn over the page, and nothing of it stands over a block of text at rest.
- Nothing a visitor reads is small: the floor is 15 px on a phone, 16 px on a desktop, 18 px at 1920.
- Separate pages. On the Astro build, the one that goes online, the stage stays alive between them and the cut is a
  flight through a door of cut glass; on the assembled pages it is a push into a portal of glass under a rising sheet.
- A synthesized sound, on by default from the visitor's first press, with a toggle in the header; a first press on a
  link flies at once and silent, and the room comes in after the arrival.

**Refused** (spec 50 §0–§1, and Alberto's words since): a page with effects laid over it; organic blobs and anything
liquid, to the eye or to the ear (no drop, bead, pool, drip, ripple, wave, wet edge, reflecting floor or horizon line;
no surf, drip or bubble in the sound); large soft round discs, round spots or rings of light, rain-like lines; light
that draws a figure (an X, a V, a cross); rainbows; the anonymous particle galaxy; glassmorphism (frosted panels, blur
as UI chrome); floating cards (a rectangle carrying a number); and every trait of the white magazine this site was
(cream paper, Cormorant Garamond, Figtree, the hairline layout with staircase titles, "Fig. NN", the magazine's words).

## Colors

Thirteen tokens in `rv/css/tokens.css` (`:root`), unchanged since the build from zero. Inside the morning (`.dawn`,
`html[data-ground="dawn"] main`, `.legal-page`) the night's names are remapped to the dawn values in
`rv/css/dawn.css`, so every component reads unchanged on both grounds.

| token | value | OKLCH | role |
|---|---|---|---|
| `--night` | `#0c0e14` | oklch(16.5% 0.013 270.5) | the ground of every page but Contact |
| `--night-2` | `#12151d` | oklch(19.6% 0.017 268.8) | the header once scrolled, the menu, the cut's sheet, the picture well |
| `--ink` | `#f4f1ea` | oklch(95.9% 0.010 87.5) | display type, values, the button's label |
| `--body` | `#cfcabf` | oklch(84.0% 0.016 86.4) | running text, the header's items at rest |
| `--mute` | `#9a958a` | oklch(67.1% 0.017 86.4) | labels, meta, the "before" of a figure, the instrument line, the scene's name in the header |
| `--line` | `#262a36` | oklch(28.6% 0.023 270.5) | rules, the scrollbar |
| `--accent` | `#8fa2ff` | oklch(73.6% 0.136 273.8) | indices, the role line, marks, the hovered quiet link, focus, selection, the reading line, the hairline that draws |
| `--cobalt` | `#2340c9` | oklch(45.1% 0.213 267.0) | the filled button; the address at dawn; the swarm's ink at dawn and its thin light at night |
| `--dawn` | `#f3f4f6` | oklch(96.7% 0.003 264.5) | the morning's ground, the dawn cut sheet |
| `--dawn-ink` | `#0c0e14` | oklch(16.5% 0.013 270.5) | display type at dawn |
| `--dawn-body` | `#3a3f4b` | oklch(36.8% 0.022 267.4) | running text at dawn |
| `--dawn-mute` | `#5d6270` | oklch(49.7% 0.023 269.9) | labels at dawn |
| `--dawn-line` | `#d6d9e0` | oklch(88.5% 0.010 267.4) | rules at dawn |

On the stage the same four colours are the whole palette: the night ground, paper white (`--ink`, `--dawn`), cobalt,
and the periwinkle accent; the index's rays run from paper white through two cooler whites to a light cobalt
(`stage/scenes/index.js` `RGB`), and glass shows a faint spectral split on its bevels (tier A). No rainbow. On an HDR
screen the canvas is float16 and the stage's light may rise above paper white instead of clipping at it (see "The
post"); the DOM's colours are the same on every screen.

### Contrast (computed, WCAG 2.x; recorded in the header of `rv/css/tokens.css`)

| pair | ratio |
|---|---|
| ink / body / mute / accent on `--night` | 17.10 / 11.81 / 6.47 / 8.07 |
| ink / body / mute / accent on `--night-2` | 16.18 / 11.17 / 6.12 / 7.63 |
| ink on cobalt (the button) | 7.03 |
| dawn-ink / dawn-body / dawn-mute / cobalt on `--dawn` | 17.53 / 9.58 / 5.54 / 7.21 |

Body text holds AA on both grounds. **Forbidden pairs:** cobalt on the night (2.43: never text on the night); the rule
colours as type (`--line` on night 1.35, `--dawn-line` on dawn 1.28).

### Named Rules

**The One Light Rule.** On the night the only light is the canvas's. The DOM has no glow, no gradient, no shadow and no
blur behind anything; colour in the DOM is type, a 1 px rule, the step to `--night-2`, or the cobalt button.

**The Remap Rule.** The morning is the night's tokens remapped, never a parallel set of components. A component that
needs its own dawn variant is wrong; a dawn value outside `rv/css/tokens.css` and `rv/css/dawn.css` is wrong.

**The Four Colours Rule.** Night, paper white, cobalt, the accent. Light on the stage is tinted between paper white
and cobalt (a room's `temp` runs cool at the top of a page and warm toward its dawn); nothing else is a colour.

## Typography

**One superfamily, Sofia Sans** (Google Fonts, variable weight, latin and latin-ext, `rv/css/fonts.css`; the head
script preloads the three latin files). The recorded fallback is Barlow with Barlow Condensed in the same roles.

| role | face | where |
|---|---|---|
| display | Sofia Sans Extra Condensed 800, capitals, line-height 0.86, tracking 0 | `.t-mega`, `.t-d1`, `.t-d2` (`rv/css/type.css`) |
| text | Sofia Sans 400 and 500 | `.t-lead`, `.t-body`, the address |
| labels | Sofia Sans Condensed 600, capitals, tracking 0.06em (`--tr-label`) | `.t-label`, meta, counters, captions, the scene's name in the header |
| actions | Sofia Sans Condensed 700, capitals, tracking 0.04em (`--tr-btn`) | `.btn`, `.q` |
| the header | Sofia Sans Condensed 700, capitals, tracking 0.06em; the name 1.12 × and 0.04em | `.hdr-name`, `.hdr-nav a`, `.hdr-menu`, `.lang`, `.hdr-snd` |

### Scale (`rv/css/tokens.css`)

Alberto, 2026-11-11: «Le scritte piccole non mi piacciono , sopratutto nei bottoni e nel menu». **The floor** every
lane's probe holds (`.shots/n-integrate/_scripts/floor.mjs`): no rendered text under 15 px on a phone, 16 px on a
desktop, 18 px from 1900 px wide. The tokens sit above it: the phone values are fixed rem; from 1024 px each reading
size is `clamp(rem floor, rem + vw, rem cap)`, growing with the screen from about 1200 px wide and capped near 2400.

| token | phone | from 1024 px | px at 1440 / 1920 / 2560 | use |
|---|---|---|---|---|
| `--t-mega` | `clamp(5rem, 18.5vw, 21rem)` | the same | | the cover's name (capped at the measure / 5.2), "WRITE TO ME." on Contact (Italian: measure / 3.13, at most 24rem), the Obla title |
| `--t-d1` | `clamp(3.5rem, 9vw, 9.5rem)` | the same | | page titles, the menu's page names, the index rows' titles |
| `--t-d2` | `clamp(2.2rem, 4.4vw, 4.5rem)`, line-height 0.9 | the same | | step titles |
| `--t-lead` | `clamp(1.375rem, min(1.9vw, 1.07rem + 0.714vw), 2.125rem)` / 1.38 | the same | 27 / 31 / 34 | leads, measure 32em |
| `--t-body` | `1.125rem` (18 px) | `clamp(1.25rem, 0.78125rem + 0.5208vw, 1.5rem)` | 20 / 22.5 / 24 | running text, line-height 1.55, measure 36em |
| `--t-btn` | `1.125rem` (18 px) | `clamp(1.25rem, 0.6875rem + 0.625vw, 1.625rem)` | 20 / 23 / 26 | the filled button and the quiet links, weight 700; the cut's index line |
| `--t-nav` | `1.125rem` (18 px) | `clamp(1.125rem, 0.5rem + 0.8333vw, 1.75rem)` | 20 / 24 / 28 | the header's items, the phone's MENU, the sound toggle |
| `--t-lang` | `1.125rem` (18 px) | `clamp(1.125rem, 0.375rem + 0.8333vw, 1.5rem)` | 18 / 22 / 24 | EN / IT in the header |
| `--t-small` | `1rem` (16 px) | `clamp(1.0625rem, 0.5625rem + 0.625vw, 1.4375rem)` | 18 / 21 / 23 | the rows' secondary lines, the tool lists' notes, the legal line |
| `--t-label` | `1rem` (16 px) / 1.35 | `clamp(1rem, 0.5rem + 0.625vw, 1.375rem)` | 17 / 20 / 22 | overlines, fields, counters, captions, the role line, the instrument line |

(The px columns are the stylesheet's own table, in its comment.) Heights that go with it: the header `--hdr` 4rem on a
phone, `clamp(4.5rem, 1.8rem + 3vw, 6rem)` from 1024 px; the filled button `--btn-h` 3.5rem, then
`clamp(4rem, 2.2rem + 2vw, 5.25rem)`; the scene's text column `--col` 34rem, then 27.2 body ems.

Page-level sizes outside the scale: the key words of a work without a capture `clamp(4rem, 9vw, 9rem)`
(`.wk-words-fig`), the figures `clamp(1.75rem, 2.6vw, 2.5rem)` (`.mx-n`), the dawn's line `clamp(4.5rem, 15vw, 17rem)`
(`.dawn-h`), the cut's name `clamp(4.5rem, 15vw, 16rem)` (`.cut-name`), the menu's page names
`clamp(2.25rem, min(15vw, 10.5svh), 6.5rem)`, the address `clamp(1.5rem, 3.6vw, 3.25rem)` (`.dawn-mail a`).

### Figures and numerals

Every number on the site uses tabular lining figures. The arrow between a before and an after is the text face's
glyph, in `--accent`. A numeral that changes (the gallery's counter, the cut's index line) is an odometer: columns of
0–9 moved by transform (`.od`, `rv/css/motion.css`), with the printed figure kept beside it for readers. A count
counts up once from zero to its printed figure (the measured rows; the counts of a case's record). **A year never
counts**: beside About's path and in a case's record it snaps to its value, each digit's column turning from 0
(`fx-motion.js` `snap`). The instrument line prints "{n} points · {ms} ms GPU" through `FX.t` / `FX.num`, only while the stage draws.

### The Italian edition

The Italian pages are the same site set in Italian, not a layer over the English one. Every page is built twice from
the same parts, and the words come from one source where English and Italian sit side by side: `rv/parts/strings.mjs`
for what a template prints, `rv/parts/cases.json` for the nine works. Type, scale, layout and motion are the same in
both editions; where Italian runs long it is reworded or held together, not shrunk. The build checks it
(`assemble.mjs --check`, `italian()` and `editions()`; the Astro build's `web/scripts/asserts.mjs` repeats the output
checks):

- The apostrophe is ’, never the straight one; a quotation stands in caporali « ».
- The decimal comma and the point of the thousands; a no-break space between a number and its unit.
- Months in lowercase; sentence case.
- Names of products and technologies and role titles stay as they are. Never *ingegnere* (a protected title).
- Words that must not part are held by a no-break space or a no-wrap span; that span and `<em>` are the only markup a
  string may carry.
- Every string has its twin; no English is left on an Italian page; the two editions of a page hold the same
  elements; the language control leads to the same page of the other edition and back.
- Every number is its English page's number: `scripts/check-claims-proto.mjs` compares the two editions of every page.

### Named Rules

**The One Family Rule.** Sofia Sans in three widths is the only type, on the page, on the cut's card, in the share
cards, in the favicon and in the etched words on the glass. A serif, a monospace or a second family is out of the
system.

**The Film Title Rule.** Every display line is capitals in the extra-condensed face, tight (0.86), untracked, set to
fill its measure. Lowercase display does not exist.

**The Floor Rule.** 15 px on a phone, 16 px on a desktop, 18 px at 1920, for everything a visitor reads; buttons and
the menu first. A new size sits on the scale tokens, never written by hand.

## Layout

### The scene grammar (`rv/css/scene.css`, spec 50 §3)

```
<section class="sc sc-left|sc-right" data-stage="NAME" style="--steps:N">
  <div class="sc-view" data-stage-anchor="NAME" aria-hidden="true"></div>   sticky, 100svh, empty: the stage draws here
  <div class="sc-track">
    <div class="sc-step" data-stage-step="1"><div class="sc-in"> … real text … </div></div>
  </div>
</section>
```

- **Scene mode** is `html.sc-on:not(.gl-off)`: the head script sets `sc-on` when there is motion, WebGPU and no
  `?stage=0`. A scene is then `--steps × 100svh` tall; its view is sticky and empty; each step is one screen.
- `--steps` counts the blocks, an intro (`data-stage-step="0"`) included. Both builds assert it.
- The text keeps to one half: a column of at most `--col` on the side the class names. Below 1024 px the figure takes
  the top of the screen and the text the lower part.
- The view is never boxed: no border, no frame, no caption inside it.
- Without scene mode (reduced motion, no WebGPU, no script, print, a dead stage) a scene is plain flow: its blocks in
  order, with their real pictures (`[data-stage-poster]`, hidden in scene mode, where the stage reads them as
  textures).
- **A case's chapters** are not sticky scenes: they are ordinary sections (`section[data-ch]`) over the `mist` scene.
  In scene mode, from 1024 px, each chapter's row leaves its last third free for its figure of light
  (`grid-template-columns: 2fr 5.4fr 4.6fr`, `rv/css/case.css`), and "More work"'s rows keep the same two thirds
  (`max-width: 61.6%`); below 1024 px a chapter whose figure is a plate (`what`, `schematic`, `list`) opens with a
  free band of 40svh above its index, and the record with one of 36svh.

### Space

One gutter, `--gut` = `clamp(1rem, 3vw, 3rem)`, and one rhythm on a 4 px base whose steps roughly double (`--s1`
0.25rem … `--s8` 10rem). Tight inside a group, generous between groups, more above a title than below
(`rv/css/blocks.css`). Targets are at least 2.75rem.

### Breakpoints and input

| width | what changes |
|---|---|
| ≥ 1024 px | the header shows its five pages, EN / IT, the scene's name and the sound toggle after the language; scenes put text and figure side by side; the reading sizes turn fluid |
| < 1024 px | the five pages live in the menu (a full sheet); the sound toggle sits beside MENU; the scene's name stands under the header's name; scenes stack the figure over the text |
| < 768 px | the stage takes tier B; a flight is shorter (430 ms out, 400 in) |
| < 760 px | the cover's name breaks into two lines; a scene's `ctx.phone` is true |

On a touch screen a horizontal drag orbits the stage's eye; the vertical scroll and pinch zoom stay the browser's
(`touch-action: pan-y pinch-zoom` on the body while the stage draws).

### Z scale

The stage's canvas sits over the page and under the chrome: canvas `--z-stage` 40 < menu 45 < header 50 < cut sheet 90
< skip link 100.

## Elevation & Depth

There is no elevation in the DOM: no shadow, no blur, no gradient. Depth exists only on the stage, in real perspective:
the eye stands D = clamp(1.25 × the viewport's diagonal, 1100, 2600) px in front of the page plane (2122 px at
1440×900, 1162 at 390×844); the room's wall stands behind the page plane (the room kit's default −0.6 D), the chips
hang between the wall and the eye, the plates stand at their own depths, and a free camera travels through all of it
with depth of field, a focus the scenes pull, and fog. In the DOM, a surface is told from the ground by the step from
`--night` to `--night-2` and by a 1 px rule.

### Named Rules

**The Text Is Sacred Rule.** The canvas is drawn over the page. No light, chip, haze, ray or plate stands over a block
of DOM text at rest: a scene keeps its text clear (`c.textRects()`, keep-outs, the room's dimmed wall round a block),
and a plate whose box meets a block of text fades out until the text has passed. Proof: 1:1 crops with the stage on
and with `?stage=0`.

## Shapes

Every corner is square (`rounded.none`); the button, the menu, the cut's sheet and every picture well are rectangles.
Strokes are 1 px (the hairline that draws, the reading line) or 2 px (the header's travelling rule, a link's drawn
rule). The sound toggle is four straight bars. On the stage: plates are boxes with straight edges and a rounded arris
a few pixels wide; the prism is a triangular prism; the door of a flight is a deep block; chips are cut as the letter
A, the SerSan mark or a facet; blades of light have straight sides (a section 1.8 times as wide as tall by default:
a round section reads as a spotlight disc); a wall is a ruled grid. Nothing on the site, in the DOM or on the stage,
is a blob, a dome, a ring or a drop.

## Components

### Header and language (`rv/css/chrome.css`, `rv/css/motion.css`, `rv/parts/a-header.html`, `rv/fx-nav.js`)

The name as a label at left; the name of the scene in view after it (from 1024 px; below, under it), then Work, About, Consulting, Obla,
Contact, EN / IT and the sound toggle at right. No ground until the reader scrolls (`html.is-scrolled`), then
`--night-2` with a bottom rule. The current page is `--ink` with a rule under it (`aria-current="page"`); the others
`--body`, hover `--ink`. EN / IT: the edition being read in ink, the other a link in `--mute`. **Over the morning** the
header takes the ground under it, as a straight cut with no fade: on Contact (`html[data-ground="dawn"]`) and on every
other page while the dawn close is under it (`html[data-hdr-ground="dawn"]`); the open menu keeps it night.

- **The scene's name** (`.hdr-scene`): the heading of the scene in view, the page's own words, set as a label
  in `--mute` after a short rule; it changes behind a straight mask (`fx-motion.js`). Decoration (`aria-hidden`).
  From 1024 px it follows the header's name on its line. Below 1024 px it stands under the header's name, which rises
  0.6em to make room (`.hdr.has-scene`, by `translate`: the header's entrance owns `transform`), behind a 1rem rule;
  it ends 7.75rem plus the gutter from the right edge, clear of the sound toggle and MENU, and hides while the menu is
  open, the name coming back down. A name longer than its room ends in an ellipsis.
- **The reading line** (`.hdr-read`): a 1 px `--accent` line along the header's foot, drawn as far as the page has
  been read; linked to the scroll on the compositor (`animation-timeline: scroll(root)`), only where the browser can.
- **The travelling rule** (`.hdr-rule`): one 2 px rule under the page being read that travels to the item under the
  hand and back (0.42 s, `--ease-rise`).
- **Step-away:** on a long page the header steps away while the reader goes down (past 0.8 of the first screen, after
  48 px of travel) and comes back as soon as they go up 24 px, at the dawn close, at the top, or while the menu or a
  cut holds the page (`html.hdr-away`).

### The sound toggle (`.hdr-snd`, `rv/css/chrome.css`; `rv/fx-sound.js`)

A real button with `aria-pressed`, an `aria-label` and the same word as `title` ("Sound" / "Suono",
`chrome.sound`), at least 2.75rem to touch. Four straight bars as tall as the header's capitals, standing on their
baseline, square, no glow, in the header's own colour. Three states (`data-snd-state`): **armed** (before the first
gesture: the bars stand still at their heights), **run** (they move, transform only), **off** (`aria-pressed="false"`:
they lie down as one flat rule and the button turns `--mute`). On a phone it sits beside MENU; from 1024 px after the
language group, behind a rule like the language's own. At dawn it takes the dawn greys and hovers cobalt. Shown only
with script and only while the sound's module runs (hidden under `html.fx-off-sound` and in print). Under reduced
motion the bars do not move.

### Menu (below 1024 px)

A full sheet of `--night-2` (z 45), a dialog that keeps focus inside, closed by Esc or the button. The five pages in
the display face at `clamp(2.25rem, min(15vw, 10.5svh), 6.5rem)` with their index in `--accent`; each row answers the
hand with a hairline drawn under it from the left and an arrow that travels. The address, the copy control, LinkedIn,
GitHub and the language at the foot. It opens as a straight sheet (its bottom edge comes down from the header, a
clip, in `--d-sheet`), the page names rising from behind their masks; it closes faster (`--d-sheet-out`).

### Filled button and links (`rv/css/type.css`)

- `.btn`: the one cobalt surface of the night; label `--ink` in the action face; `--btn-h` tall. Hover: an `--ink`
  ground fills in from the left edge and the type turns `--night`, the arrow travels; it leaves faster. Pressed, it
  sinks (1 px down, 0.985). At dawn the label is `--dawn` and the fill `--dawn-ink`.
- `.q`: a label in ink at the button's size and weight; hover turns it `--accent`, draws a 2 px rule under it from the
  left (0.32 s) and moves its arrow; pressed, it sinks 1 px.
- `.ln-in`, the address at dawn and on Contact: a 1 px rule rests under the link in the line colour; on hover or focus
  a 2 px rule in the text's colour is drawn from the left over it and leaves faster.
- `.copy`: the copy control beside an address; it says "Copied" (or "Selected" when the clipboard refuses) in place,
  the confirmation rising from its mask with a hairline under it.

### The cover (`index.html`: scenes `hero`, `now`, `index`)

- **Hero: the lit hall** (`rv/stage/scenes/cover/world.js`, `hero.js`; `rv/parts/b-hero.html`,
  `rv/css/page-cover.css`). In the DOM: the name, `h1`, on one line across the measure (two on a phone); under it the
  role line in `--accent` and the sentence, "Write to me" and two quiet links, the instrument line, and a scroll cue
  (a label over a short straight line). In scene mode the hero is 190svh tall (the flight) and the name is never flat
  type: the `h1` is transparent from the first paint and stays the accessible name; it shows as printed type only if
  the stage dies (`html.stage-dead`) or has not drawn by 6 s. On the stage:
  - **The name** stands 2 D in front of the page plane as a volume of light: a front face that takes most of the swarm
    (0.6 of it), six receding contour layers in cobalt behind it (0.34), a band of light that crosses the letters now
    and then.
  - **The opening** (once per load, 2.6 s): the letters ignite one after another while the eye, close and low at the
    first letter, arcs toward the front and pulls back; the name counts as lit at 1.45 s (`fx:stage:lit`), and the foot
    rises once the hall stands. Any scroll, key or press runs the rest at once. Reached by a cut, the cover arrives
    with its hall and its name already lit. On a cold load the name writes itself from about 1.3 s to 2.4 s after
    the navigation and the foot is in by 2.6–2.9 s (`build/n-integrate.md`, both trees): a still with half the name
    lit is the opening, not a fault.
  - **The hall**: the back wall's grid, lit by the name's own light and by two blades that travel across it on the
    stage's clock; chips cut as the A and the SerSan mark at every depth, none over the name; two plates holding
    captures of his work (SphereNode, Sphere AI) flanking the name; far behind, the lit plate that holds sersan.io.
  - **Rest**: the eye drifts on the stage's clock (rest window 14 s) and the hand orbits it about the name (up to 0.30
    rad of yaw and 0.12 of pitch on a desktop, 0.08 and 0.04 on a phone). **Flight**: the scroll flies the eye through
    the name to Now's plate and ends on the page's straight view, so Now takes over without a seam (`coverCamera`,
    shared by `hero.js` and `now.js`).
  - Behind `?name=splat` the name is built of solid blocks of Gaussian splats instead (`cover/splatname.js`); the
    default is the name of points.
- **Now.** "Now at SerSan": the date label, title, lead, body, link. Its plate is in the hall from the first frame,
  the far lit window, and stands exactly in its place, sharp, when Now's view reaches the top; it then rides up with
  Now. The pointer turns it a few degrees with inertia.
- **Index: the prism.** Four large rows (Work, About, Consulting, Obla), each a link with its index, its sentence and
  "Open". In the half the rows leave free stands a large triangular prism, a solid of clear cut glass. The room's one
  shaft comes down onto its left face near the apex; inside, its light crosses the glass as a beam (a soft straight
  core with a breath of light round it, bent by the faces, fainter in their total reflections, red and blue a breath
  apart where it leaves: `plates.wgsl.js` `prBeam`), and it goes out by the right face as **one ray** for the row
  under the hand (or with the keyboard's focus; at first, Work), swinging to another row in about 0.3 s. Each face
  takes a few hundredths of the tone of the room it faces (lighter turned up, darker turned down), so the faces part
  by tone as a cut block's do; the arrises light up near where the light enters and leaves, and fall away elsewhere
  (an even line round every edge read as an outline drawing). At the ray's station in the room's depth the swarm gathers that row's
  emblem: a fan of nine small plates (Work), a line of light with five nodes (About), the hub and its agents
  (Consulting), Obla's outline. On a phone the prism is small, right of the cued row's title. Nothing crosses the rows'
  text.

### Work (`work.html`: scenes `gallery`, `evidence`)

One continuous shot for the page (`gallery.js` `workEye`): the eye starts a little back, low and left, pushes in and
pans right along the gallery, and holds square to the page by the measured rows.

- **Gallery.** Head "Nine works" and the lead, then one step per work: counter, kind, name, one line, "Open the case".
  Nine plates in depth; the plate in step near and sharp, the others queued deeper and softer; the pointer tilts the
  near plate. Six plates hold their capture; three are clear glass with the case's key words etched (frosted) in the
  display face. A plate gives way where another scene's text crosses it (`yields`).
- **Evidence.** "Measured before and after." and the lead; then the two sets of figures as rows: label, before →
  after. Per row the swarm draws two bars of light to the exact lengths (before dim, after bright, a faint full-length
  guide) on the row's line; the wall's grid is the chart's paper behind them. On a phone the bars are drawn inside the
  row. The printed bars (`.mx-bars`) keep their place and turn invisible while the stage draws.

### About (`about.html`: scenes `stack`, `path`)

- **Stack.** "Capabilities": eight layers seen from three quarters. Only the layer in step and its neighbours are
  glass; the far layers are outlines of light (eight traced plates halved the swarm). The layer in step slides toward
  the reader with its group's name etched.
- **Path.** One line of light through five upright panes, each etched with the month and year of its step. The line
  stands still and the eye flies along it: each pane passes close and lit, the passed ones go out past the eye. On a
  wide screen the line bows (each step to the next node a little longer than the last) and ends, feathered, inside
  the figure's half; every frame each pane's box is projected with the frame's real eye (the drift, the hand's orbit,
  the speed lens), and a pane that would come within 6 to 30 px of a shown one steps back, nearest its step first, no
  station skipped: the dates never collide (`path.js`). On a phone one pane at a time, as before. Beside the text the
  step's years snap to their value each time it comes into focus.

### Consulting and Obla (`consulting.html`, `obla.html`: scenes `consult`, `obla`)

Consulting's four figures of light (`gen`, `cut`, `code`, `agents`) each stand at their own place in the room's depth
and the eye walks from one to the next, never a cut and never a figure swapping in place; the same points leave the
figure behind and gather at the next. `gen`'s made mark is a thin block of Gaussian splats laid over the points'
picture. Obla's character in light follows its state through the page's steps (idle, listening, thinking, working,
approval, sleeping, then the morning report). Obla carries no status line. Plain flow prints Obla's still as inline
SVG.

### The dawn close (`rv/parts/c-footer.html`, `rv/css/dawn.css`, scene `dawn`)

Every page but Contact ends with `footer.dawn#write[data-dawn]`: a full screen of `--dawn` under a straight edge:
"WRITE TO ME.", the address in cobalt, the copy control and the links, then the legal line and "Back to top". On the
stage the points that cross the edge stop being light and are ink; five straight ruled strokes (four on a phone) lie
across the edge, each crossing it once at a shallow angle; on a phone they all lean alike. The dawn never glows. The
close is the same bytes on every page (asserted) but the 404's, which differs only in its engine line (`nf.engine`).

### Contact (`contact.html`: scene `contact`, `html[data-ground="dawn"]`)

The morning whole. "WRITE TO ME." across the measure, then the sentence and the address with its controls. On the
stage the points are cobalt ink: fine straight strokes above and below the line, near-parallel, all leaning alike,
clear of every letter. No glass.

### The cut between pages (`rv/css/cuts.css`, `rv/fx-nav.js`, `rv/fx-stage.js`, `rv/stage/stage.js`)

The events, a contract nobody renames: `fx:nav:start { to, side, dawn, back, ms, door, glass, day }` at the click
(`ms` the planned time until the new room stands, `door` until the page changes, `glass` until the eye is in the
glass, `day` the morning in the view being left: 0 none, 1 the dawn close on screen, 2 the whole view, Contact),
`fx:nav:covered { to }` when the page changes, `fx:nav:arrived {}` when the new room stands; also
`fx:nav:uncovered` and `fx:nav:reset`. Reduced motion: none of it, the browser's own navigation.

- **The flight** (the Astro build, where the stage outlives the page; `stage.fly`). The old page's text leaves by its
  own masked exit (every block on screen goes up behind a straight mask, 150 ms each, out by 190 ms; nothing in the
  DOM rides the camera), and **the page changes at 200 ms** (`fx-nav.js` `SWAP_MS`), while the eye is still in the
  room it leaves: the router goes on drawing that room while the new page's host comes up in the shadow (its scenes
  loaded, their formations prepared, their first frame run undrawn, the first screen's captures uploaded:
  `fx-stage.js` `shadow`). The eye accelerates through the lit room, plates growing and passing, toward a tall **door
  of cut glass** standing in the room's wall, 0.55 D behind the page plane: a deep block of the plates' own glass. The
  new room takes the stage in one task at the first frame where the door's glass hides the whole frame
  (`stage.flyState.cover`), so **through the door the new room is seen from its first full frame to its last**: every
  ray is carried on to the plane of the back face and leaves there flat (nothing mirrored: the name is never doubled,
  no corridor appears); the pane's two tall sides are bands a little denser and cooler, the room stretched outward
  from the seam, each with one straight lit seam carrying the faint split; the top and bottom walls draw nothing.
  Never a pane of flat grey glass, never a blank. The card (the destination's index line, a hairline, its name) is
  read as light type over the room while the door is ahead and clears before the eye is through (no card over a view
  with the morning in it). The eye goes on inside the glass, slowing and never still, while the block falls away in
  0.22 s; it slows into the opening pose and the title rises when it is nearly still. 520 ms out and 520 in on a
  desktop, 430 and 400 on a phone. Back runs the same path backward; a flight from or toward the morning is always
  flown forward. **Toward Contact** the morning arrives as a straight edge of day that crosses the frame from the
  bottom in 200 ms from the takeover, seen through the door's glass (`fx-stage.js` `DAY_MS`; `css/cuts.css`
  `.cut-ground` keeps the old ground under the canvas until then): never a sheet of blank paper. **A view already in
  the morning** (Contact, a page's dawn close) flies too: its door is the night standing on the paper, opening from
  0.13 s as a straight slit that widens. While the eye travels fast, red and blue part toward the frame's corners
  (the aberration in speed, under "The post"). A first press of a visit flies at once and silent (see "Sound").
- **The portal and the sheet** (the assembled pages, where every cut is a new document; they are not published). The camera pushes in toward
  the leading scene's subject (0.24 D, the focus going soft, 0.34 s) and the eye flies into a tall plate of glass that
  swings in from the clicked link's side (`stage.portal`, 300 ms); once the glass fills the frame the straight-edged
  sheet floods in over it in the same tone (`--night-2`; `--dawn` toward Contact) and the title card plays: the index
  line whose numeral counts from the page being read to the destination, a rule across the sheet, the name rising
  letter by letter. The page changes under it; arriving, the card clears first (`--d-cut-clear`), the sheet leaves
  upward (`--d-cut-out`) and the eye comes out of the glass (350 ms). The card's name and the arriving page's title
  are never on screen together.

### The case template (`rv/parts/c-main.case.mjs`, `rv/css/case.css`, `rv/stage/scenes/case.js`, `case/figures.js`)

The nine cases on the night ground: the opener, the chapters with their index in the margin, the record, "More work"
(one cycle of nine, asserted). The page is one shot (`case.js` `caseEye`).

- **The opener** is a scene, `case`, of two steps: the text ("what it is"), then the work's picture with its caption.
  On the stage the picture is the work's plate, the same plate as its step in the Work gallery (its capture held at
  mid-thickness, or its key words etched). It arrives once per load from deep in the room; in step 1 it stands in the
  figure's half beside the title, turned some twenty degrees; in step 2 it turns square and comes near above its
  caption. A wide picture can carry a framing (`plateCrop` in `cases.json`).
- **Every chapter has a figure of light** in the room beside its text, the same figure for the same chapter type on
  all nine cases (`section[data-ch]`, asserted by both builds):

| chapter | figure |
|---|---|
| `what` | the work's own plate, large and deep in the room, turned, its far edge past the frame: a wall of glass, not a card |
| `facts` | **the count**: each row's number as units of light on the row's own line (on a phone, under the number), lit one by one as the row comes up; "21/49" is 49 units with 21 bright, zero an empty rule, thousands a fine field of dots; a value that is not a count ("4K") has none |
| `teaser`, `measured` | bars of light on the rows, the before dim and the after bright, as long as the row's own printed bars |
| `schematic` | one plate per node, its name etched, joined by a line of light that runs to the node being read |
| `list` | a stack of thin plates, one per item, the item being read lifted toward the reader with its number etched |
| the record | the work's plate again, far back in the room and turned the other way: the shot ends on the plate it opened with (a phone: in its band, smaller, further back) |
| "More work" | the index's figure (More work is the index of the nine): a prism of cut glass with the cover's values in the free third, the room's shaft into it from above, and one ray out of it to the verb of the row under the hand or with focus, else the row being read; on a phone the prism alone, small, centred in the gap between the cued row's title and its verb, 8 px clear of its glyphs (a row with no room has none), hopping rows with a 0.2 s fade. No plate carries a word |

  Two figures never share the frame (at most six plates). No figure is a rectangle carrying a number: the page prints
  the numbers. On a phone `measured`, `teaser` and `facts` carry their light on the rows with no band, and past its
  band a `list`'s or a `schematic`'s rows carry a thread of light down the numbers' column, from under each number to
  above the next, lit row by row as the rows pass 72 % of the frame.
- **The record's numbers** (`.cs-dl`, `fx-scroll.js` `record`), once as it comes into view, in scene mode only: a
  count ("161", "circa 50") counts up from zero in its held box, from the left; a year snaps to its value; with the
  row's stagger. The text ends byte for byte as printed; the printed states print the values.
- **The Supply Chain's class diagram traces itself** (agricultural-supply-chain, `figure.cs-still[data-trace]`;
  `fx-motion.js` `traceLoad`, `trace`; `.tr` in `rv/css/case.css`). Its drawing (`/captures/<stem>.svg`, the vector
  the picture was rendered from) is read a screen and a half ahead and set over the picture without its connectors;
  as the figure enters, each connector's straight segments draw under a straight clip from where the line starts, one
  after another as a pen would (the grey structure first, then the accent thread of the traceability as one line),
  heads and labels appearing as the pen reaches them; then the drawing's own connectors take over (the same vector:
  the rest state is the printed picture). Live scene mode only; a drawing not in within 0.8 s of the entrance opens
  as printed. Every printed state shows the picture.
- A picture the stage does not draw (a chapter's still) enters once: a straight edge rises from its foot and opens it
  while it settles from 106 % (`.rv-pic`, `rv/css/type.css`). Plain flow prints every picture as a plain image.

### The 404 (`rv/parts/c-main.404.mjs`, `rv/parts/c-footer.404.html`)

The type alone: "Error 404", "Not found.", the lead, every page and every work listed. No stage (`data-nogl`): the head
script never asks for the adapter. Its close is the dawn close with its own engine line. Its paths are rooted.

### Head, favicon and share cards

Every page's head is written by the build: title, description, robots, canonical, the hreflang pair, Open Graph and
Twitter, the Person JSON-LD on the cover. The favicon is "AT" in Sofia Sans Extra Condensed 800, warm white on night;
`site.webmanifest` background and theme `#0c0e14`. The share cards (`og/*.jpg`, `og/it/*.jpg`) are drawn in the night
studio. The Astro build adds only the router: two `astro-view-transitions` metas and one module script
(`web/scripts/parity.mjs`, `ALLOWED`).

### Print (`rv/css/print.css`)

Black on white, every scene as plain flow with its real pictures, no header, menu, cut, stage, sound toggle or copy
control; the button becomes an outlined label.

## The stage

One fixed, full-viewport WebGPU canvas above the pages (`aria-hidden`, `pointer-events: none`), drawn by
`rv/stage/stage.js` on its own device. Nothing the reader needs to know exists only in the canvas.

**The start.** On every page that will have a stage the head script asks for the GPU adapter before the first paint
and imports `rv/stage/boot.js`, which makes the device and starts every pipeline at once while the page loads. The
room draws first: the field, the bloom and the plates draw from the frame their own pipelines are in, and the swarm
joins when its two are. The canvas comes up in 250 ms at its first drawn frame (at once under an arriving sheet).
`html.stage-on` while it draws; `html.stage-lit` and `fx:stage:lit` once the subject is lit (a scene with
`litSignal`, else the first frame); `html.stage-dead` if it stops, which returns the scenes to the printed page.

**The stage between pages.** Under the Astro build's router the page leaves and the stage stays (`stage.reset()`
lets go of the page's formations, slabs and keep-outs; the device, pipelines, swarm, eye and clock remain;
`window.__rvKeep` hands it to the next page's host). In a flight the next page's host comes up while the room left
behind is still on the stage: it prepares its formations (`stage.prepare`, room in the targets buffer by
`stage.reserve`), runs its scenes' first frame undrawn and uploads the first screen's captures, holding whatever
would change the room still on stage; it takes the stage in one task when the door hides the frame. On the assembled
pages every page builds its own.

### The room: the field (`rv/stage/field/`) and the kit (`rv/stage/scenes/lib/room.js`)

Opt-in and stateless: a scene returns `field: { lights, chips, wall }` and the stage draws a back **wall** as an
analytic plane ruled as a grid in relief (a wall facing the room, never a floor: no edge, no horizon), up to 16,000
**chips** of cut glass (tier B half, C a quarter) shaped as the letter A, the SerSan mark, a facet or a scene's own
mask, and up to four **lights**: blades with straight sides, with haze. Nothing of it draws in the dawn or over a
keep-out; if its pipelines fail the stage draws without it.

`room(c, o)` puts any scene in the cover's hall with one call: the wall, chips at every depth (4,000 on a desktop,
2,600 on a phone at tier A: depth, not a pattern over everything), two blades that travel across the wall on the
stage's clock (one is always in the room), the hand's blade on a desktop, an optional light that follows a subject,
and the scene's text kept clear: the wall is dimmed round a block of text, never cut out (a hole the size of a block
read as a black card). `temp` runs the light from cool (toward cobalt) to warm (paper white): a page runs cool at the
top and warms toward its dawn. **Light never draws a figure:** a room's blades are parallel shafts leaning alike, a
main one and a narrower one well apart, placed by the page's seed.

### The swarm

One compute pass integrates every point (curl flow, a spring to its target, the hand, the wind of the scroll,
damping); one render pass draws instanced soft discs with depth of field. Points are light on the night and cobalt ink
inside the dawn rectangles, decided per fragment. Formations share the population by weight; every change of weights
is a migration. Tiers: A 160,000 points (DPR scale 1), B 80,000 (0.85), C 40,000 (0.7). Budget: when the median of 30
GPU frames stays over A 3.5 ms, B 6 ms or C 9 ms, the drawn count halves (never under 20,000) and the ink per point
doubles. A point whose blur disc would pass 14 px fades out: no large soft discs in front of things.

**Rest.** The stage moves only inside a window opened by an input (scroll, pointer, touch, key): 5 s unless a scene
asks for more (`rest`, 1–60 s; every night scene asks 14 s, since its eye drifts), slows to stillness over 1 s, then
submits nothing, with a mouse resting on the page too. Whatever moves at rest runs on the stage's own clock
(`c.clock.time`), which stops at rest, and settles exactly.

### The glass (`rv/stage/plates/`)

A plate is a box of clear glass drawn analytically (a ray against an oriented box, no marching), up to 12 per frame:
the ray bends entering and leaving (ior 1.5) with a three-way spectral split on tier A; a rounded arris a few pixels
wide carries the light lines and the split; Fresnel reflection of a studio of soft rectangular lights that the pointer
swings; a faint cool tint with the path through the glass; an optional image at mid-thickness, or frosted etched type;
edges that brighten with the swarm behind them; softness out of focus. What a plate bends is the room behind it (the
wall, the chips, the shafts, an extra pass), the swarm, and the rasterised display type (`[data-refract]`). Two more
solids share the tracer: **the prism** (a slab with `shape: "prism"`: a triangular prism inscribed in the plate's box,
with two refractions and one internal reflection, and a beam drawn inside its glass between two points of its outline,
`PRISM_BEAM` in `plates.js`, its light carried in the slab's `inset` as −(1 + k)) and **the door** of a flight (a
deep block the stage itself adds, whose rays are carried through to the room beyond). No shadow blob, no caustic, no
ripple. Where two parallel flat faces part the three colours by less than a device pixel, one ray carries all three; a
plate out of focus takes no extra edge rays; plates behind a door that hides the frame are not drawn. Tiers: B drops
the spectral split; C also drops plates seen through plates, the second reflection and the edge light.

### The eye

One camera for the room, the swarm and the plates. A scene that returns `camera.pos` moves a **free camera** through
the room (position, target, roll, lens, rack focus, aperture, fog, a near fade so the eye goes through things without
anything bursting at the lens); a scene that returns `{ yaw, pitch, dolly }` uses the older orbiting camera, and the
host mixes both kinds as free poses by weight. **One shot per page:** every scene of a page asks one function of the
scroll for the eye (`workEye`, `caseEye`, `coverCamera`; `lib/page.js`), so the eye never jumps at a boundary between
scenes. The reader's speed widens the lens a little (at most 6 %); at rest the eye drifts; the hand orbits it about
the subject (the pointer on a desktop, a horizontal drag on a touch screen). Nothing in the DOM follows the pointer.

Up to two viewport rectangles are day (`dawn`): inside them a point is ink. On Contact the whole viewport is day.

### The glow (bloom; `rv/stage/wgsl/bloom.wgsl.js`)

The canvas's own light: a scene returns `bloom` (a strength, or `{ strength, threshold, knee, plates }`) and bright
cores bleed softly into the dark. Every night scene asks for it now (strengths between about 0.1 and 0.6; the cover
more during its opening's flare). The dawn never glows; where nothing is bright the canvas stays as transparent as
drawn. Levels by tier (`BLOOM_TIER`): A half size and five levels, B a quarter and four, C a quarter and three. With a
lit wall on screen a scene keeps its strength at 0.8 or less.

### The post (grain, aberration in speed, HDR; `rv/stage/stage.js` "THE POST")

Plan 70's phase 4, inside the passes the stage already runs (no pass of its own). Bokeh, the pointer's trail and
chips on other pages are not built.

- **The grain** (`stageGrain`, `stageGrainLight` in `rv/stage/wgsl/frame.wgsl.js`): a dither of one 8-bit step,
  triangular and mean zero, added to the encoded colour just before the write in the passes that write smooth dark
  light (the plates, the rays, the field's wall and haze), only where there is light, so the night between stays
  black. At 1:1 it is not seen as noise; it only breaks the bands of the dark gradients. Seeded from the stage's clock:
  the last frame keeps its grain and the stage sleeps. 0 on an HDR canvas.
- **The aberration in speed** (`aberStep`): while the eye travels fast through the room (a flight, a fast camera
  move), red and blue part toward the frame's corners, up to 3 css px at a corner; exactly 0 at rest and under a
  reader's scroll of the page. It is drawn where the room's light is read back (the blit and the glass), not on the
  plates' own faces or the swarm in front of them. `stage.stats().aber`.
- **The HDR canvas** (`rv/stage/gpu.js` `canvasSetup`): where the screen shows more than paper white
  (`dynamic-range: high`) and a float16 canvas configured with extended tone mapping reads back "extended", the canvas
  is `rgba16float`: the plates' and the rays' light may rise to 1.6 as written (about three times paper white) and the
  swarm's piles go above it, the display's headroom clipping them; every value up to paper white, and the glow, are as
  on the 8-bit canvas. Elsewhere, and with `?hdr=0`, the 8-bit canvas exactly as before; a browser that cannot answer
  gets it silently. `?hdr=1` forces float16 on any screen (a probe's switch). `stage.stats().hdr` is
  `{ on, format, why }`. The dawn never glows.

### Extra passes (`registerPass`)

A module outside the engine can add a drawn layer every stage of the page draws, switched on by a scene with
`passes: { id: cfg }`. Two exist: **`rays`** (`lib/prism.js`: up to eight straight thin rays of light with a soft
core, added light only; the index's prism and More work's) and **`splat`** (`rv/stage/splat/`: Gaussian splatting, anisotropic 3D
gaussians projected as ellipses and sorted by depth on the GPU, with loaders for `.ply` and `.splat` and generators
for a letter, the mark, a relief; cap by tier A 400,000, B 150,000, C 60,000; used by Consulting's made mark and, behind
`?name=splat`, the cover's name). With plates on screen a pass draws into the light the plates bend. A pass that
fails turns only itself off (`?failsplat=1` forces it).

### Limits the waves hold (the lanes' briefs; measures in `build/n-integrate.md` and `build/m-*.md`)

GPU 2.6 ms at rest and 3.3 ms at peak at 1440×900 DPR 2 tier A, 2.4 ms at 1920×1080 DPR 1, 1.5 ms on a phone (tier
B); the swarm never halved at rest; first frames not later than the commit before; no long task over 50 ms after the
first frame. Certified on a quiet machine, each at least twice: the case opener (2.26–2.43 ms), sphere-ai's fast
passes with no halving, first frames not later than HEAD on both builds (wave 5). Wave 6 brought the gallery at rest
under its limits (2.57–2.58 ms at 1440 DPR 2 with the whole swarm, 1.92–1.96 at 1920 DPR 1) and a first visit to Work
standing at 976–980 ms (budget 1200). Open after wave 6, each under HEAD at the same hour on a GPU slower than on 17
November: the flights' peaks, 3.5–4.5 ms at 1440 DPR 2 and 2.9–3.05 at 1920 DPR 1, with the swarm never halved; About
at rest 2.66 ms; the index with Work under the hand still halving the swarm in noisy rounds (`build/m-fly.md`,
`build/m-glass.md`). The final stills and films of wave 5 are in `.shots/n-final/`.

## Motion

Tokens in `rv/css/tokens.css`; read by `fx-core.js` as `FX.motion`.

| token | value | use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | every arrival |
| `--ease-io` | `cubic-bezier(0.66, 0, 0.22, 1)` | the cut's sheet, the anchor glide |
| `--ease-in` | `cubic-bezier(0.5, 0, 0.75, 0)` | every departure |
| `--ease-rise` | `cubic-bezier(0.19, 1, 0.22, 1)` | every rise, the button's fill, the header's rule |
| `--focus-in` · `--focus-out` · `--focus-blur` | `0.7s` · `0.233s` · `10px` | text coming into and leaving focus |
| `--line-gap` | `60ms` | between the lines of a title |
| `--d-hover` · `--d-hover-out` · `--d-press` | `0.18s` · `0.12s` · `0.1s` | hover in; a hover leaves faster; a press sinks |
| `--d-rise` · `--d-rise-out` | `0.82s` · `0.26s` | a display line rising from its mask; leaving |
| `--row-gap` · `--d-row` | `55ms` · `0.6s` | rows in stagger |
| `--d-hdr` | `0.42s` | the header coming back |
| `--d-sheet` · `--d-sheet-out` | `0.46s` · `0.28s` | the phone menu opening; closing |
| `--d-cut` · `--d-cut-clear` · `--d-cut-out` | `0.42s` · `0.1s` · `0.28s` | the cut's sheet rising; its card clearing on arrival; the sheet leaving upward |
| `--d-travel` · `--d-media` | `1.1s` · `1.4s` | the anchor glide and its cap |
| `--mo-safe` (`rv/css/motion.css`) | `0.5s` (`0.3s` when a cut is landing) | how long the first screen's CSS entrances wait for the title sequence to claim them |

- **The title sequence** (`rv/fx-motion.js`, `rv/css/motion.css`). Anime.js 4 through its WAAPI module moves the
  page's DOM: transform, opacity and straight clip-paths only, so every beat runs on the compositor while the main
  thread serves the stage. It directs: the **opening** of every page (the header's words, the label, the title letter
  by letter from behind its straight mask, a hairline that draws, the lead's lines, the buttons), started by the
  stage's first frame; each **scene step** (the block enters in time with the eye's travel between steps and leaves
  faster, all at once); the **cut's card**; the **menu's** rows; the copy's confirmation; the **press** of every
  control; the scene's name in the header. If the library never arrives the CSS entrances play on their own and the
  page is whole by about 2.5 s.
- **Focus** (`rv/css/type.css`, `rv/fx-scroll.js`): `[data-focus]` and `[data-focus-lines]` come into focus once, when
  they first enter the viewport. In scene mode the step nearest the middle of the viewport is `.is-active` and sharp;
  the others are at opacity 0.12 and blur 6 px. `fx:step { scene, step, of }` is sent when a scene's active step
  changes.
- **The rise.** A display line comes up from behind a straight mask and settles, like a film title. Display type the
  stage bends through its glass (`[data-refract]`) never moves, since the host measures its glyphs: it gets a curtain
  only.
- **New 2D elements**: the hairline that draws (1 px, the accent; `.mo-hl`), the odometer (`.od`), the scene's name
  and the reading line in the header, the menu row's hairline and arrow, pictures that enter (`.rv-pic`); since wave 6
  the years that snap, the record's counts and the diagram that traces itself (see "The case template").
- **A year snaps** (`fx-motion.js` `snap`): every year written in About's path steps (`.stp-when`) and in a case's
  record becomes an odometer once (the printed year kept beside it for readers), and each column turns from 0 to its
  digit, 45 ms apart, in 520 ms on `--ease-io`, starting while the text comes into focus: a year is never read at
  0000. About's years snap each time their step comes into focus, the record's once.
- **Hover** is a change of colour with a fill or a rule drawn from the left, and an arrow that travels; it leaves
  faster than it came. The cursor is the native one. Nothing in the DOM follows the pointer.
- **Reduced motion:** no stage, no sticky stepping, no blur, no rise, no title sequence, no count, no header
  step-away, no menu sheet, no cut; every page complete and in order. A live change of the preference reloads the page
  at the reader's place. Without WebGPU (`?gl=0`), with `?stage=0`, with a failed field or splat pass, with a dead
  stage, without script and in print nothing is left hidden or moved.
- Scrolling runs on Lenis on GSAP's ticker (`fx-core.js`).

## Sound

`rv/fx-sound.js` (plan 70 §3.6; Alberto: «acceso di default.»). Everything is synthesized with the Web Audio API: no
audio file, nothing from the network. **No `AudioContext` exists before the visitor's first click, touch or key
press** (a scroll does not count), and it is never made by reading the visitor's media devices to warm the audio
service. A key that only moves the focus (Tab, Shift…) makes the engine and leaves it silent, so a keyboard reaches
the toggle before any sound. At a press or a key that acts, the room fades in over 1.5 s to a low level. The toggle
turns it off at once and on again; the choice is remembered (`localStorage` "rv-sound"); a hidden tab is silent.
`?sound=0` keeps it off for the visit.

**The first press that leaves** (wave 6; the director's choice of 17 November). A document's first `AudioContext` is
one task of the browser's own (50 to 160 ms on a cold or busy machine). When the visit's first press, tap or Enter is
on a link to another page, nothing is made in it: the flight starts at once and silent (3 ms after the press, as with
`?sound=0`). Under the router the document stays, so once the new room stands (`fx:nav:arrived`; `fx:ready` after a
plain swap) and its opening has played, the context is made in an idle moment on the activation the page already
has, and the room fades in over 2.4 s; a browser that will not run it without a fresh gesture keeps it suspended,
silently, until the next one. On the assembled pages that click ends the document: nothing is made, and the next
page starts at its first gesture (once a visit). No press makes a context while a cut is in flight. Any other first
gesture starts the room in the gesture, as before (`build/m-sound.md`).

| role | what plays |
|---|---|
| room | a chord of up to four pure tones between 220 and 790 Hz, each page its own, over a soft air; Contact brighter; every page as loud to the ear as the cover |
| eye | the scroll lights two overtones of the room's chord, as loud as it is fast, silent at rest; no noise |
| glass | a scene's step, when the reader's own scroll brought it: a short touch of glass, its pitch a degree of the page's mode, panned a little toward the figure's side |
| index | the cover's four rows: four notes of one chord, the row under the hand held softly |
| cut | a rising rush of air that tops when the eye is in the door's glass, and there the door: a low touch of glass and two bright ones leaving the centre; the largest gesture of the site, scheduled whole at the click |
| hand | a press: a tick one almost does not hear; the copy control: two rising notes; the menu's sheet: a short breath |
| Obla | each of its five states: a two-note motif in the character's voice |

A limiter and a ceiling end the chain. Under the Astro build's router one engine survives the navigations; on the
assembled pages each page starts again. **Nothing here has been heard**: every level is a measure
(`build/n-fix-sound.md`, `build/m-sound.md`), and whether it sounds right is Alberto's to judge by ear. Nothing may read as water to the
ear: no surf, drip or bubble.

## Do's and Don'ts

### Do

- **Do** set every display line in Sofia Sans Extra Condensed 800 capitals at the scale tokens, filling its measure.
- **Do** keep the ground `--night` on every page but Contact, and end every page at the dawn edge.
- **Do** put a new scene in the room (`room(c, o)`) and give its page one continuous shot: one function of the scroll
  for the eye, shared by the page's scenes.
- **Do** keep text clear of the canvas: `c.textRects()` as keep-outs, the room's dimmed wall, plates that fade where a
  block of text meets them; prove it with 1:1 crops, stage on and `?stage=0`.
- **Do** put the real work inside the glass (the captures as textures) and keep the same pictures in the DOM for every
  printed state.
- **Do** write every visible word in `parts/strings.mjs` or `parts/cases.json`, in both languages, and print only
  numbers that exist in `PRODUCT.md`.
- **Do** keep everything a visitor reads at 15 px or more on a phone, 16 px on a desktop, 18 px at 1920, on the scale
  tokens; buttons and the header first.
- **Do** drive anything that moves at rest with the stage's clock, and let it settle exactly, so the stage sleeps.
- **Do** move the DOM on the compositor only (transform, opacity, straight clips), through `fx-motion.js`.
- **Do** look at 1440×900 and 390×844 at DPR 2, 1920×1080 at DPR 1, both editions and both builds before calling a
  change done; judge motion on strips of frames (50 ms for a cut).

### Don't

- **Don't** bring back anything that reads as water, to the eye or to the ear: a drop, bead, pool, drip, ripple, wave,
  wet edge, reflecting floor or horizon line; surf, a drip or a bubble in the sound.
- **Don't** draw large soft round discs, round spots or rings of light, or rain-like lines; **don't** let light draw a
  figure (an X, a V, a cross); no rainbow.
- **Don't** bring back the white magazine: cream paper as a ground, Cormorant, Figtree, staircase titles, "Fig. NN",
  issue / in print / colophon / plate / In this issue / Read.
- **Don't** add a CSS shadow, glow, gradient, backdrop blur or rounded corner; **don't** use the bloom on a dawn scene.
- **Don't** use cobalt as text on the night, or a rule colour as type.
- **Don't** make a figure a floating card: no rectangle of glass carrying a number the page already prints.
- **Don't** box a scene's view (no border, frame or caption inside it).
- **Don't** slide text in from a side; **don't** move display type the stage bends (`[data-refract]`).
- **Don't** let anything in the DOM follow the pointer.
- **Don't** make the `AudioContext` before a real activation, add an audio file, or warm the audio service by reading
  the visitor's media devices.
- **Don't** add a second canvas, a 3D library or a second family.

## Changing the system

### Files that move together

- A token: `rv/css/tokens.css`, then both builds; the stage reads `--dawn`, `--cobalt`, `--night`, `--accent` and
  `--z-stage` at boot.
- A string: `rv/parts/strings.mjs` (both languages), the partial that prints `{{t:id}}`, then both builds; if it
  reaches a share card, `node scripts/media/og-cards.mjs <page>`.
- A scene: `rv/stage/scenes/NAME.js` and the section with `data-stage="NAME"` in its partial; the page's
  `css/page-*.css` for its text column; the page's eye if the scene joins a shot.
- The room: `rv/stage/scenes/lib/room.js` (the kit), `rv/stage/field/` (the engine side); the bench
  `rv/stage/dev.html?view=room|field`.
- The glass: `PLATE_LOOK` in `rv/stage/plates/plates.js` and the shader in `plates.wgsl.js`; the bench
  `rv/stage/dev.html?view=cover|gallery|stack|dawn`.
- The cut: `rv/fx-nav.js` (events, the card, the text's exit), `rv/fx-stage.js` (push, portal, flight, the hand-over),
  `rv/stage/stage.js` (`cut`, `portal`, `fly`, `LOOK.fly*`), `rv/css/cuts.css`, `web/src/router/rv-router.js`;
  `rv/fx-sound.js` reads the same event.
- A case's chapter figure: `rv/stage/scenes/case/figures.js`, `rv/css/case.css` (the free third, the phone's band),
  `data-ch` in `rv/parts/c-main.case.mjs`.
- The sound: `rv/fx-sound.js`; `node public/proto/rivista/sound/render.mjs` renders a list of cues to a WAV without a
  browser window (a tool, not a page of the site).
- The post: `rv/stage/stage.js` ("THE POST": `ABER_PX`, `HDR_CEIL`), `rv/stage/wgsl/frame.wgsl.js` (the grain),
  `rv/stage/gpu.js` (`canvasSetup`); a pass that writes smooth dark light calls `stageGrainLight` before its write.
- The release: `web/scripts/release.mjs` (`ORIGIN`, `LEFT_OUT`: a new file no visitor loads goes there; one a page
  loads is checked, capitals included) and `vercel.json` at the root (routes, redirects, headers, the two 404).

### Gates (all headless)

```bash
node public/proto/rivista/assemble.mjs --check        # exit 0
node scripts/check-claims-proto.mjs                   # OK, 32 pages
# the Astro build, into your own folder (from web/; never into web/dist)
node scripts/build.mjs --outDir ../.shots/<lane>/dist
node scripts/parity.mjs --built=../.shots/<lane>/dist/proto/rivista     # PARITY OK
node scripts/asserts.mjs --built=../.shots/<lane>/dist/proto/rivista
node ../scripts/check-claims-proto.mjs --dir=../.shots/<lane>/dist/proto/rivista
# before a push (from the root): the release, which runs the Astro build and its gates with the site's address
VERCEL_ENV=production node web/scripts/release.mjs     # ends with three [release] lines
```

Then open the captures and look at them.
