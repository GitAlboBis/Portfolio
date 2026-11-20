# 10 · Component and effect scout for the rivista (V1 "Carta e cobalto")

> **Status:** scout report, read-only lane, 2026-10-09, branch `feat/water-hero`. Nothing in `public/` was edited.
> **Scope:** `public/proto/rivista/` (home `index.html`, case `case.html`). The static stack is HTML + GSAP 3.15 (ScrollTrigger, **SplitText**, CustomEase; all loaded by the deferred loader at `parts/head.html:93-95`) + Lenis 1.3.26. React/Framer sources are references to re-express in GSAP/CSS. They are never imported.
> **Binding filters applied to every candidate:**
> - `docs/redesign/rivista-motion/10-motion-canon.md` §0 (Alberto's decisions), §2 P1–P14 and §5 (the refused list);
> - `docs/redesign/water-hero/30-hero-build-spec.md` §8–§9 and `public/proto/rivista/water/engine/CONTRACTS.md` (one GL canvas per page; the engine and `FX.gl` are off-limits);
> - `_refs/hero-water/05-taste-history.md`: Alberto wants sersan-level real 3D, clean DOM type with line masks, big type that moves with the scroll and mobile parity. He hates flat 2D stand-ins, procedural fakes and 2D line backdrops;
> - the golden rules: no invented facts or numbers (`PRODUCT.md` §3/§9, `src/content/works.ts`), no "done" without visual proof, and headless probes only.
>
> **Sources queried, in order:**
> 1. **21st.dev:** 16 free `search` calls and one `get_inspiration` call. **`get_component`: 2 of 2 used**, on #34516 (appica-dev, Table of Contents) and #30554 (ssychui, Project Index). The quota is now 0.
> 2. **Magic UI:** `listRegistryItems` (all 78 components) plus three searches.
> 3. **ui-layouts:** searches and docs.
> 4. **OriginKit:** searches, `list_components(animation)` (53 items), and `fetch` of `text-wipe` and `mask-text-reveal`.
> 5. **Vengeance UI:** categories plus three searches.
> 6. **shadcn:** `@aceternity` is **not configured**. There is no `components.json` and this lane is read-only, so I did not create one. Aceternity is mirrored on 21st under `manuarora700`, and I listed it there (30 items).
> 7. **Skills:** `transitions-dev` (I read 16 tabs-sliding, 21 accordion and 24 learn-more-hover), `awwwards-animations` and `design-spells`. designspells.com lists no editorial-family spell; its 20 entries are minigames, orbs and skeuomorphic timers.

---

## 0. Verdict in one paragraph

The connectors offer almost nothing the rivista can take as is. About 85 % of what they rank highest is a cursor follower, a blur, a count-up, a marquee, a second WebGL renderer, or a hover preview, and all of those are banned by §5.

What they do offer is **structure** that a professional editorial portfolio still lacks:
- a **running head** and **contents** on the case page;
- a **contents index** of all nine works at the end of a case;
- an **editorial 404**;
- a **copy-address** affordance;
- a **colophon wordmark** that echoes the masthead.

The one piece that answers Alberto's "3D, WebGPU, WebGL" ask without a second canvas is a figure the connectors cannot sell: **Fig. 02, a contact sheet of stills captured from this engine, one plate per render pass**. The engine already exposes `captureDebugView(viewName, w, h)` (`water/engine/index.js:759-772`), and debug ids exist for `sdf`, `normal`, `thickness`, `beer`, `ao`, `wet` and `steps` (`water/engine/render.js:32-35`). The poster probe `scripts/probes/water/w8_posters.mjs` already writes the provenance the claim "captured from this engine" needs.

Add a **print stylesheet**, so that the canon's "reduced motion is the printed issue" becomes literally true. With that, the build lanes have a P1 set that is beautiful, honest and on-canon.

---

## 1. Ranked shortlist

| # | Candidate | Verdict | Effort | Priority | Lane (canon §8 ownership) |
|---|---|---|---|---|---|
| C1 | Fig. 02 · one frame of the A, pass by pass (engine contact sheet) | **take** | M | P1 | S (`c-main.index.html`, `fx-scroll.*`) + a probe for the stills |
| C2 | Case running head (folio) + contents line | **take** | S–M | P1 | N (`a-header.case.html`, `fx-nav.*`) + S (`c-main.case.html`) |
| C3 | "In this issue": a contents index of the nine works at the end of the case | **adapt** | S | P1 | S (`c-main.case.html`, `fx-scroll.*`) |
| C4 | Print stylesheet: the printed issue | **take** | S | P1 | C (`fx-core.css`) |
| C5 | Copy the address (verb rolls to "Copied") | **take** | S | P1 | S (`c-main.*` band) + N (menu foot) |
| C6 | Ledger bars on one printed scale, with "lower is better" | **adapt** | XS–S | P1 | S |
| C7 | Colophon wordmark (the masthead echoed at the back cover) | **adapt** | S | P2 | S (`c-footer.html`, `fx-scroll.*`) |
| C8 | Editorial 404 "Not on file" | **adapt** | S–M | P2 | C (`assemble.mjs`) + new parts |
| C9 | Chapter folios: home eyebrows numbered 01–06, menu numbers aligned | **adapt** | XS | P2 | S + N |
| C10 | Capabilities: "Proof · X" becomes a link that rolls to "See the work" | **adapt** | XS | P2 | S |
| C11 | Italic accent word in a few display titles | **adapt** | XS | P2 | S |
| C1b | Fig. 02 B side: one large plate + a pass switcher (click, straight wipe) | **adapt** (A/B only) | S | P2 | S |
| C12 | Pipeline schematic (a technical drawing of the engine's passes) | **adapt** (P3, only beside C1) | M | P3 | S |
| C13 | EN / IT switch with a sliding 1 px indicator | **adapt**, deferred until the IT copy exists (MC-28) | S | deferred | N |

---

## 2. Candidates in detail

### C1 · Fig. 02 · "One frame of the A, pass by pass" (engine contact sheet) — **take**

- **Source.**
  - The engine itself: `captureDebugView(viewName, w, h)` (`water/engine/index.js:759-772`, which swaps the shade to a debug view, renders, `captureRGBA`, restores) and `DEBUG_IDS` (`water/engine/render.js:32-35`).
  - Provenance pipeline: `scripts/probes/water/w8_posters.mjs` (lossless WebP, EXIF + `<file>.webp.json`; CONTRACTS §20).
  - Layout idiom: the photographer's contact sheet. No connector item fits. The 21st "Image Compare" family (#19955 diceui `compare-slider`, #31523 wensity `before-after-card`) only informs the B side C1b.
- **What it does.** A row of four straight-edged plates, all at the dock composition of the hero:
  - **02a** the shaded frame;
  - **02b** the signed distance field;
  - **02c** thickness;
  - **02d** normals.

  Each plate carries a printed caption naming the pass. The row sits under one figure caption: "Fig. 02 · One frame of the A, pass by pass. Stills captured from this engine." The plates unroll once, like the rail tiles (R-09: `inset(0 0 100% 0)` → 0, `--d-travel`, `--ease-out`, stagger 0.08, `top 82%`, once). At rest nothing moves.
- **Where.** Home, as a short chapter after Path (`#path`) and before the contact band, under the eyebrow "Colophon". A reader who has just seen the live A in the hero sees how it is made, then meets it live again in the band. At 390 px the grid is 2×2.
- **Why it fits.**
  - It is the **only** way to show WebGPU craft without a second GL canvas: the plates are `<img>`, and the page keeps one canvas.
  - It is real engine output, not a 2D stand-in (taste §1.1, §5.2-3).
  - Straight plate edges (P4), calm at rest (P10), printed under reduced motion (P12).
  - It respects R-17: the chapter has triggered reveals and no scroll-linked move.
- **How to adapt.**
  1. Add a headless probe (`scripts/probes/water/w9_passes.mjs`, using `launch()` from `scripts/probes/water/lib.mjs`). It opens `index.html?v=1&debug=1` as a repeat visit, applies the poster's `setView` / `setPlacement` (CONTRACTS §20), calls `captureDebugView` for `sdf`, `thickness` and `normal`, and reuses `fx-plate-v1.webp` as 02a. Write lossless WebP at 2× box-downsampled, with EXIF and the sidecar. The engine exposes this through `opts.debug` (`index.js:1071`); confirm the exact handle on `window.__water` / `eng.debug` before writing the probe.
  2. Before choosing the four views, **judge each still**. A debug view that reads as noise or flat grey is dropped and replaced by `beer` or `ao`.
  3. Markup: `figure.passes` > `ol` > four `li > figure.frame > img` + `figcaption.label`. Use the existing `.frame` / `.frame-inner` classes and tokens. No radius, no shadow, 1 px `--line` between plates.
  4. Captions are copy only. No numbers, no "particles" (M9 has not shipped, spec §8 Q1), and **no caustic plate**: the hero ships with caustics off (R1, spec §9.5), so a caustic still would describe something the page does not do.
- **Effort.** M: a probe plus four stills, one partial, about 40 lines of CSS, and the unroll reused from `fx-scroll.js`.
- **Risks.** A greyscale SDF still could read as "2D" to Alberto. Lead with the shaded frame, keep the passes the same size as the shaded one, and title them as passes of *this* frame. Never use them as a backdrop.

### C1b · Fig. 02, B side: one plate with a pass switcher — **adapt** (A/B only)

- **Source.**
  - transitions.dev **16 tabs sliding**: JS writes the active tab's `offsetLeft` / `offsetWidth`, CSS owns the tween, and first paint and resize write with `transition:none`.
  - The 21st compare sliders (#19955, #31523, #35049) for keyboard handling.
- **What it does.** One large plate and four labels under it ("Shaded · Distance · Thickness · Normals"). A click or Enter wipes the next still in over the current one with a straight edge.
- **How to adapt.**
  - The pill becomes a **1 px cobalt underline**, moved with `transform: translateX() scaleX()` (not `width`), over `--d-hover`, `--ease-soft`.
  - The still enters with `clip-path: inset(0 100% 0 0)` → `inset(0)` over `--d-wipe`, `--ease-io`. The previous still stays under it, so there is no cross-fade over a photograph (P3).
  - Use `role="tablist"`, roving tabindex and arrow keys.
  - A **drag** divider is refused as the default (P9: a handle pulled by the pointer). If Alberto wants one, it is a native `<input type="range">` with no spring.
- **Verdict.** It ships only if Alberto prefers it to the contact sheet. The contact sheet is more "print" and has no state.

### C2 · Case running head (folio) + contents line — **take**

- **Source.** 21st **#34516 appica-dev "Table of Contents"**. I read the code. It provides:
  - IntersectionObserver scroll-spy over heading ids;
  - a fallback to the heading closest to the root's top when none intersects;
  - `aria-current="location"` on the current link;
  - one indicator whose `top` / `height` are measured from the active links.
- **What it does.**
  1. **Running head.** In the case header at ≥ 1024 px, beside the brand, a folio reads "SphereNode · 02 Sphere AI". It swaps as the reader crosses chapters, the way a magazine's running head changes per article section.
  2. **Contents line.** Under the case hero lead, one hairline row of anchor links: "01 What it is · 02 Sphere AI · 03 Reliability · Next work". The current entry carries `aria-current="location"` and a 1 px cobalt rule under it.
- **Why it fits.**
  - It is the case-study structure a professional portfolio is expected to have.
  - The scroll drives the swap (P9), and the swap is a roll inside its own box (R-16).
  - Nothing moves at rest (P10). It is useful on the phone too: the contents line wraps, and the running head is hidden below 1024 px.
- **How to adapt.**
  - Replace React state and IntersectionObserver with **one ScrollTrigger per chapter** (`start: "top 50%"`, `end: "bottom 50%"`, `onToggle`). That keeps one ticker and Lenis-correct positions. Keep the closest-heading fallback for the page end, so the last chapter stays current when "Next" is too short to reach 50 %.
  - The label swap reuses the **informative roll** (`.sc-roll`: two stacked labels, `translateY(-100%)`, `--d-roll`, `--ease-out`, `overflow:clip`; `fx-scroll.css:61-64`).
  - The indicator is a 1 px rule moved with `transform` (`translateX` + `scaleX`, `--d-hover`, `--ease-soft`), never `top` / `height`. The canon animates transform, opacity and clip only.
  - Anchor clicks use `FX.scrollTo` (R-19, `domus.inOut`, 1.1 / 1.4 s); focus moves to the target.
  - Reduced motion: the head swaps instantly.
- **Effort.** S–M.
- **Lanes.** N owns the header partial; S owns the contents line in `c-main.case.html`. Hand-off: S emits `fx:chapter` with the index; N's running head listens.

### C3 · "In this issue": contents index of the nine works at the end of a case — **adapt**

- **Source.** 21st **#30554 ssychui "Project Index"**. I read the code. It provides:
  - bare rows (title · tag · year · arrow) with a `border-top` hairline and `tabular-nums` years;
  - an arrow that nudges on hover;
  - keyboard focus that opens the cover beside the row.
- **What is stripped.**
  - **The floating cover that follows the cursor** on a spring. §5 refuses hover-preview images, and P9 refuses anything that follows the pointer.
  - **The dimming of the other rows to 30 %.** Ink at 30 % on paper is about 1.6:1, an AA failure while hovering.
  - The shadow and the radius.
- **What it does.** The case page's "Next work" section (`c-main.case.html`, `section.next`) grows into a contents page. Nine rows: `No · Title · Where · Year · [Open]`. The current case is marked "This case" (`aria-current="page"`), and the next one keeps its large `d1` link above the list.
- **Data.** Only `works.ts` fields that are on file: `year` (L121, 238, 348, 428, 520, 595, 667, 737, 792) and the rail captions' "where" text already printed on the home. There are no new numbers.
- **How to adapt.**
  - Rows enter through the block engine's row batch (R-06, `top 90%`, `--st-block`). Rows are links, so they fade with opacity only (P13).
  - Hover and `:focus-visible` (gated by `(hover:hover) and (pointer:fine)` for transforms):
    - the row's `sc-rule` turns cobalt;
    - the arrow moves `translateX(0.12em)` over `--d-hover`, `--ease-soft` (R-15, next-work link);
    - the verb rolls "Open" (R-16).
  - In the prototype only SphereNode has a case page. Every other row links to `index.html#work`, through the S5 cut, until its case exists. Say so in a code comment, not on the page.
- **Effort.** S.

### C4 · Print stylesheet: the printed issue — **take**

- **Source.** No connector has it. It is editorial practice, and the canon's own metaphor (P12: "Reduced motion is the printed issue").
- **What it does.** `@media print` in `fx-core.css`:
  - **Ground.** The paper becomes white and the ink stays `--ink`.
  - **Hidden.** Header chrome, menu, preloader, overlays and every `canvas`.
  - **Shown.** The `hr-poster` still (already "a still frame captured from this engine"); the band still where the engine shows its still.
  - **Reveal states.** Every hidden reveal state is forced to its printed pose: `opacity:1`, `transform:none`, `clip-path:none`. Reuse the reduced-motion kill switch at `fx-core.css:449` (§10).
  - **The rail** uses the existing reduced-motion 3-column index (`fx-scroll.css:151-160`).
  - **Links.** External links print their URL after the text in `--stone` (`a[href^="http"]::after{content:" · " attr(href)}`).
  - **Page breaks.** `break-inside: avoid` on `figure`, `.metric`, `.tl-row`, `.cap`, `.fact`, `.tile`.
  - **Page.** `@page { margin: 18mm 16mm }`.
- **Why it fits.** Zero runtime cost, no motion, and on-concept: a magazine that really prints. Recruiters do print portfolios.
- **Verification.** A headless `page.pdf()` with Playwright through `launch()`. Never a visible Chrome.
- **Effort.** S.

### C5 · Copy the address — **take**

- **Sources.**
  - 21st **#28469 ncdai "Copy Button"**: the success and error state model. Its haptics and audio are dropped, because UI sound is refused in §5.
  - 21st #27943 uiable "Copy Link Button".
  - transitions.dev **04 text-states-swap**, re-expressed **without its blur** as the existing `.sc-roll`.
- **What it does.** Beside or under `albertotuveri@gmail.com` in the contact band (`.sc-email`) and in the menu foot (`.nv-menu_mail`), a ghost button reads "Copy address". A click calls `navigator.clipboard.writeText` and the label rolls to "Copied" in place. A visually hidden `role="status"` says "Address copied".
- **How to adapt.**
  - The mailto link stays the primary action.
  - "Copied" holds until `pointerleave`, `blur` or the next scroll, so it is input-driven. **No timer**: P10 says nothing but the water writes a style 1.5 s after the last input.
  - The band copy members are water keep-out obstacles, read once at mount (P14, `fx-water.js:249-285`). The button must therefore be in the static markup at mount, with a fixed inline size equal to the wider label, and must never change its box.
  - Entrance: opacity only (P13).
  - Failure, when the clipboard API is denied: the label rolls to "Select and copy" and the address text is selected.
- **Effort.** S.

### C6 · Ledger bars on one printed scale, with "lower is better" — **adapt**

- **Source.** 21st **#29470 eugeneshilow "Paired Bars"**: grouped bars for exactly two measurements per subject, on one gridded scale.
- **What it does.** The existing ledgers (`c-main.index.html` `.sc-ledgers`, and case chapter 02) keep their bars.
  - Each ledger gains one printed scale under its list: 1 px graphite ticks at 0 / 50 / 100 % with `label` numerals. They are printed, not animated.
  - The two metrics where the after-bar is shorter *because things got better* gain a small `label` "lower is better": "Over-answering on questions to withhold" (56 % → 16 %) and "Unsupported claims" (1.9 % → 0.6 %). A skimmer then never reads a shrinking cobalt bar as a regression.
- **Why it fits.** Honesty and readability with no new motion. The bars keep their straight `scaleX` from 0, once per row (R-06). No count-up (§5). All figures are already on the page.
- **Effort.** XS–S. Copy flag: "lower is better" is new copy; the IT twin comes later in `dict.ts`.

### C7 · Colophon wordmark (the masthead echoed at the back cover) — **adapt**

- **Sources.** 21st **#29772 scrollxui "Footer with Minimal Outline"** (a large brand watermark that animates into view on scroll), #35508 kedhareswer "Giant Wordmark Footer", #872 arihantcodes "Large Name Footer".
- **What it does.** At the very end of the footer, "ALBERTO TUVERI" is set in the display face (Cormorant 600, uppercase, the hero lockup's tracking) across the full measure. It is cropped by its own mask and rises in that mask with the last part of the scroll. It is the back cover answering the masthead.
- **What is stripped.** The **outline / text-stroke** (a type gimmick); any ghosted watermark opacity (decoration); the light beams and dithered dots of the siblings (perpetual motion).
- **How to adapt.**
  - The mask is a `overflow:clip` box around the line, padded 0.12 em (R-04 pitfall).
  - `yPercent 112 → 0`, `ease "none"`, scrub 0.5, from `top bottom` to `bottom bottom`, so it lands exactly when the page bottoms out. It never hangs half-risen.
  - Size it so one line fits ≥ 1024 px, and set it on two lines below.
  - It is the footer's only scroll-linked move (R-17 lists none for the footer today). It touches no gl-host ancestor (P14).
  - Reduced motion: printed.
- **Why it fits.** Alberto's taste: "big type that moves with the scroll", «non mi piacciono le scritte piccole».
- **Risk.** The giant-footer-wordmark is a 2025–26 trend. It earns its place here only as the masthead's echo, so keep exactly the lockup's typography.
- **Effort.** S.

### C8 · Editorial 404 "Not on file" — **adapt**

- **Sources.**
  - 21st **#29401 ziegfiroyt "Editorial Not Found Split"**: an oversized heading, recovery actions and a hairline list of destinations.
  - #9999 efferd "not found 2": large masked type.
  - #21523 mohammadshehadeh "Not Found 404 Page": a suggested-routes list.
- **What it does.** A `404.html`:
  - eyebrow "Error 404";
  - a `d1` line-mask title "Not on file.";
  - lead "This page is not part of this issue.";
  - a hairline list (Selected work · About · Contact · SphereNode), each row with the "Open" roll;
  - beside it, `fx-plate-v1.webp` as "Fig. 404 · Still frame captured from this engine".
  
  The page mounts no GL. Zero canvases respects "one canvas per page", and a 404 should be light.
- **How to adapt.** `assemble.mjs` (lane C) gains a third page from `a-header.case.html`, a new `c-main.404.html` and `c-footer.html`. `python http.server` does not route misses to `404.html`, so test by opening the file directly. Vercel routing comes later, at deploy.
- **Effort.** S–M.

### C9 · Chapter folios — **adapt**

- **Source.** Print idiom. The case page already numbers its chapters ("01 · What it is").
- **What it does.** Home eyebrows become "01 · Now", "02 · Selected work", "03 · Evidence", "04 · Capabilities", "05 · Path", "06 · Contact". The menu numbers (`a-header.*.html`, `.nv-menu_n` 01 / 02 / 03 for Work / About / Contact) change to the chapter folios (02 / 05 / 06), so one number means one chapter everywhere.
- **Effort.** XS (copy and markup). It pairs with C2's running head.

### C10 · Capabilities: proof links — **adapt**

- **Source.** The rivista's own informative roll (R-16). The 21st #2777 vaib215 "Flip Links" is per-letter and refused (§5 per-letter flips).
- **What it does.** Each `.cap-proof` ("Proof · Supply chain") becomes a link to that work. On hover or focus it rolls to "See the work". On the home the target is the rail tile, so R-19 applies: the path crosses the rail runway, so it jumps and replays the destination's entrance.
- **Effort.** XS.

### C11 · Italic accent word in display titles — **adapt**

- **Source.** 21st **#19257 soralabs "Text Reveal (Mask)"**: line masks that keep inline emphasis.
- **Mechanism.** Cormorant Garamond italic is already declared and preloaded (`fx-fonts.css:12-24`; the third v1 file in `parts/head.html:80`), so it adds no new font weight.
- **What it does.** One italic word in three or four display titles at most ("Nine works, *on file*", "Measured *before* and after.", "Write to *me*."). This is a print idiom (the serif italic accent).
- **How to adapt.** SplitText line masks carry the `<em>` as is. Pad the masks for the italic overshoot (R-04 pitfall, 0.12 em). There is no motion change.
- **Effort.** XS.

### C12 · Pipeline schematic — **adapt** (P3, only next to C1)

- **Sources.**
  - 21st #18352 pulkitxm "Line Draw SVG" and #35190 kevingirelli "Signature" (stroke-dashoffset on scroll or in view);
  - Magic UI `file-tree`, as an information model only.
- **What it does.** A small captioned SVG schematic of the engine's real stages, from spec §3.4: glyph raster → jump-flood distance field → height profile (multigrid) → traced body → shade → composite on paper. It uses hairline boxes and **orthogonal** connectors, and each segment draws once (`stroke-dashoffset`, `--d-travel`, `--ease-io`).
- **Taste warning.** Alberto rejected the 2D hairline backdrop on 2026-09-18 (taste §0, §2 #9). This must stay a captioned figure the size of a plate, beside C1. It is never a background, never iso-contours of the A, and never in the hero.
- **Effort.** M.

### C13 · EN / IT switch with a sliding 1 px indicator — **adapt**, deferred

- **Source.** transitions.dev **16 tabs sliding**, re-expressed: the pill becomes a 1 px cobalt underline moved with `translateX` + `scaleX`, over `--d-hover`, `--ease-soft`, written without a transition on first paint. The 21st #7450 flag dropdown is refused (flags, a dropdown, card chrome).
- **What it does.** The header `.lang` and the menu foot `.nv-menu_lang` become two real links, `EN | IT`. Today they read "Italian version coming" (`a-header.index.html:11`).
- **Status.** The canon's R-21 swap beat (MC-28) applies, and this waits for the IT copy. Build nothing until `dict.ts` has IT.

---

## 3. Popular effects refused (the build lanes must not reintroduce them)

**The five most tempting, because the connectors rank them highest:**

| # | Effect | Seen in | Refusing rule |
|---|---|---|---|
| R1 | **Hover-preview image list**: a floating cover that follows the cursor over a text index | 21st #30554 Project Index (its cover), #9607 Project Showcase, #28258 Hover Image List, #31229 Super Hover List, #36226 Index List Image Gallery, #9860 Cinematic List; Vengeance `image-reveal-list`, `cursor-card` | §5 "hover-preview images" (the category rut); P9: nothing follows the pointer |
| R2 | **Count-up / ticker / slot-machine numbers** | Magic UI `number-ticker`; Vengeance `stats-counter`, `animated-number`; transitions.dev 02 number pop-in, 26 spinning counter; 21st #29358 Animated Chart (springs up) | §5 count-ups; R-05: a figure is final from its first visible frame |
| R3 | **Blur reveals and cross-blur swaps** | Magic UI `blur-fade`, `progressive-blur`; 21st #27105 Text Blur Reveal, #23571 ddoemonn Text Reveal, #19240 asanshay Reveal; transitions.dev 04 / 07 / 18 / 21 (their blur); Vengeance `morph-text`, `gooey-text-reveal` | §5 blur (a veil on type, GPU cost) |
| R4 | **Cursor followers, magnets, lens and spotlight** | awwwards-animations Quick Patterns 1–2; Magic UI `smooth-cursor`, `pointer`, `lens`, `magic-card`; 21st #31745 Proximity Sidebar, #10757 SVG Mask Effect; Aceternity `pointer-highlight`, `diagram-card` | P9; R-16; §5 followers and magnets (Q8: native cursor) |
| R5 | **A second WebGL / three.js renderer for a decorative effect or transition** | Vengeance `scroll-dissolve-reveal`, `ripple-displacement-slider`, `books-showcase`, `circular-gallery`; OriginKit's whole `animation` set (`miura-image-fold`, `fibre-image-tear`, `liquid-sphere`, `grain-mass`, …); Magic UI `globe`, `particles`, `floating-3d-particles`, `icon-cloud`; Aceternity `3d-globe`, `cloud-shader` | One GL canvas per page (taste §4.1); §5 "a second renderer for a transition" |

**Also refused (extended list):**

| Effect | Seen in | Rule |
|---|---|---|
| Infinite and velocity marquees | Magic UI `marquee`, `scroll-based-velocity`; ui-layouts `scroll-text`, `scroll-text-marquee` | P10 perpetual motion; §5 velocity-linked type |
| Scramble / decode / split-flap text | Magic UI `hyper-text`; Aceternity Encrypted Text #18575, Text Flipping Board #18574; Vengeance `ascii-glitch-ripple` | §5 scramble («orribili», taste:33) |
| Card tilt, glare, 3D cards | transitions.dev 19; Aceternity 3D Card Effect #3105; Magic UI `glare-hover`; OriginKit `interactive-grid` | §5 card tilt and glare; cards are banned |
| Curved, gooey or liquid masks; circle reveals | 21st #25479 Inversion Circle, #33300 TOC Minimap Mercury; Vengeance `gooey-*`, `liquid-text`; Magic UI `animated-theme-toggler` (circle clip); Aceternity `squiggly-*` | P4 straight edges only |
| Perpetual shimmer, beams and glowing borders | Magic UI `border-beam`, `shine-border`, `shimmer-button`, `animated-shiny-text`, `dia-text-reveal`; transitions.dev 15; Aceternity `glowing-effect`, `pulse-beams` | P10 calm at rest; WCAG 2.2.2 |
| A coloured block wiping across each line | 21st #19260 Text Reveal Block, #9902 Text Block Animation, #28388 Dual Wipe Reveal | P1 one lexicon: the line mask owns type entrances, and the sheet owns the block wipe (S1/S4/S5) |
| A scroll-drawn timeline beam on Path | Aceternity Timeline #857; 21st #35029 Scroll animated timeline, #28273 Growth Story Timeline | R-17: one scroll-linked move per chapter, and Path already has the stair drift (MC-20). Its rows already draw their rules on trigger |
| A reading-progress bar or ring | Magic UI `scroll-progress`, `animated-circular-progress-bar`; 21st #28517, #18715 | It duplicates the AT ring dial (MC-13, Q2), which already *is* honest page progress |
| An accordion for the capability list | transitions.dev 21; 21st #9602 Interactive Accordion | It hides printed content (the issue should read whole), and the recipe fades through blur |
| Hover-expanding panels | 21st #27010 Hover Expand Gallery; Vengeance `highlight-grid`, `expandable-bento-grid` | P9: the pointer changes layout; hover-reveal rut |
| Iso-contour or flow-line "technical" backdrops of the A | (idea level; OriginKit `outline-typeflow`, `reactive-lines`) | Taste: the 2D hairline backdrop "Carta corrente" was rejected on 2026-09-18 |
| Device mockups around captures | Magic UI `safari`, `iphone`, `android` | Radius and chrome; captures are plates on paper |
| Hand-drawn highlighter | Magic UI `highlighter` | P4 (curved strokes) |
| Confetti, cool-mode, fireworks | Magic UI `confetti`, `cool-mode`; designspells' Chrome Lighthouse fireworks | §5 decorative motion |
| A code-comparison figure | Magic UI `code-comparison`, `terminal` | A third (mono) family and a dev-blog look. The stills in C1 show the craft better |

---

## 4. Already in the prototype: do not add again

| Connector item | The rivista already has |
|---|---|
| Magic UI `text-reveal` (words ink with scroll) | The Measured ink screen (`fx-scroll.js:706-752`, rest opacity 0.52 for 3:1) |
| 21st #19257 / #18595 / OriginKit `mask-text-reveal` (line or clip masks) | The SplitText line masks (R-04) |
| OriginKit `text-wipe` (GSAP clip `inset` wipe) | The CTA wipe (R-07, MC-05) |
| awwwards-animations "Image Reveal" (`inset(100%…)` + scale) | The plate curtain and settle (R-08, MC-18) |
| transitions.dev 04 text swap / 24 learn-more chevron | The informative roll `.sc-roll` (R-16) and the masked arrow (R-15) |
| Custom `::selection` | `fx-core.css:244` (cobalt with paper text) |
| A scroll-spy pill on the home | The header section dash (R-13) |

---

## 5. Rules every adopted candidate keeps

1. **Tokens only** (P1): durations, eases and staggers from canon §3, with no literal seconds in `fx-*` modules.
2. **No new motion grammar.** Entrances use the line mask, the fade-up, the rise, the unroll or the wipe. Hovers use colour, rules or the in-box roll.
3. **Interactive members enter with opacity only** (P13). **Gl-host ancestors never move** (P14). This matters for C5 in the band.
4. **Facts.** Captions and rows use only what `PRODUCT.md` §3/§9 and `works.ts` print today. "Still frame captured from this engine" must stay literally true: C1's stills come from the engine through a provenance-writing probe.
5. **Copy.** C3, C5, C6, C8 and C9 introduce EN copy. The prototype has no IT yet, and the Next app routes everything through `dict.ts`.
6. **Proof.** Every lane closes on the visual gate: 1440×900 and 390×844 at DPR 2, clean console, `prefers-reduced-motion`. Probes are **headless** through `launch()` in `scripts/probes/water/lib.mjs`. Generated files come from `node public/proto/rivista/assemble.mjs`, then `--check`.

---

## 6. Source index

| Ref | Where |
|---|---|
| 21st #34516 Table of Contents (appica-dev), **code read** | https://21st.dev/@appica-dev/components/toc |
| 21st #30554 Project Index (ssychui), **code read** | https://21st.dev/@ssychui/components/project-index |
| 21st #29772 Footer with Minimal Outline (scrollxui) | https://21st.dev/@scrollxui/components/footer-with-minimal-outline |
| 21st #35508 Giant Wordmark Footer · #872 Large Name Footer | https://21st.dev/@kedhareswer/components/kiln-wordmark-footer · https://21st.dev/@arihantcodes_1f7b8c4d/components/large-name-footer |
| 21st #29401 Editorial Not Found Split · #9999 not found 2 · #21523 Not Found 404 | https://21st.dev/@ziegfiroyt/components/error34 · https://21st.dev/@efferd/components/not-found-2 · https://21st.dev/@mohammadshehadeh/components/not-found-01 |
| 21st #28469 Copy Button (ncdai) · #27943 Copy Link Button (uiable) | https://21st.dev/@ncdai/components/copy-button · https://21st.dev/@uiable/components/button-copy |
| 21st #29470 Paired Bars (eugeneshilow) | https://21st.dev/@eugeneshilow/components/paired-bars |
| 21st #19257 Text Reveal (Mask) (soralabs) | https://21st.dev/@soralabs/components/text-reveal-mask |
| 21st #19955 Compare Slider (diceui) · #31523 Image Comparison Slider (wensity) | https://21st.dev/@diceui/components/compare-slider · https://21st.dev/@wensity/components/before-after-card |
| 21st #18352 Line Draw SVG · #35190 Signature | https://21st.dev/@pulkitxm/components/line-draw-svg · https://21st.dev/@kevingirelli/components/signature |
| transitions.dev 16 / 21 / 24 / 04 | `~/.claude/skills/transitions-dev/16-tabs-sliding.md`, `21-accordion.md`, `24-learn-more-hover.md`, `04-text-states-swap.md` |
| OriginKit `text-wipe`, `mask-text-reveal` | https://www.originkit.dev/components/text-wipe · https://www.originkit.dev/components/mask-text-reveal |
| Magic UI registry (78 components, all reviewed) | https://magicui.design/r/<name>.json |
| Engine capture API | `public/proto/rivista/water/engine/index.js:759-772` (`captureDebugView`), `:1029` (`captureRGBA`), `render.js:32-35` (`DEBUG_IDS`), CONTRACTS §20 (posters) |
