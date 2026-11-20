# 12 · Audit findings (2026-10-09, before the S1 build)

> Two independent art-director audits of the rivista prototype at HEAD 065ebc1 (desktop 1440x900, phone 390x844 DPR 2). Shots in _shots/rivista-next/audit-d and audit-m. Findings B1 (nine Open links) and the media gaps are being fixed by stage S1 (cases + real media); re-validate every other finding against the current tree before acting.

## Desktop 1440×900 at DPR 1, in headless Chrome through script

**Overall.** The V1 'Carta e cobalto' world is coherent and calm. The type scale is clean (d1 99 / d2 63 / d3 44 / lead 24.8 / body 19 / label 16), the chapter rhythm is steady, and the ledgers, strike list and timeline are well judged. Computed contrast passes AA everywhere: the lowest is 'No photograph on file' in stone on paper-deep at 4.63:1, and the button is white on cobalt at 7.93:1. Focus rings are visible, the console is clean on every load, mobile composition and the menu are good, and nothing breaks the refused list.

As an Awwwards SOTD candidate it fails on three counts:
- **Navigation honesty.** 7 of 9 tiles open the SphereNode case, behind a cover that names the wrong project.
- **Prototype traces.** Titles, meta, the colophon, the legal line, case copy, ?v=1 in the URL and a fake EN/IT toggle all show to readers.
- **Visual evidence.** 7 of 9 tiles are absence plates, and 7 of them do not show the project's name. The case page has one image across about 7 viewports. The hero's WebGPU proof covers about 0.9% of the first viewport at 1.14:1, so the page talks about 3D more than it shows it.

The fixes need no new effects and no second renderer. Alberto already has the real material: Domus Tua captures and the SerSan identity in sersan-v2, and sersan.io scenes (including the 80k-cell portrait morph of himself) that can be captured as stills with provenance. A per-work case template can be fed from works.ts.

With B1, B2, M1, M2 and M4 done, this reads as a professional editorial portfolio at Honorable Mention level. Making the hero A more present (M3, gated to Alberto) is what would move it toward SOTD.

Notes on the evidence:
- impeccable detect: the cream-palette flags are false positives (V1 pins the paper colour). The design-system flags come from the stale job-order DESIGN.md (m7). all-caps-body is mostly labels; the real one is the hero sentence (p5).
- 21st.dev and Magic UI were searched for fitting mechanisms only. limeplay 'Player Layout' and ln-dev7 'Gallery Grid with Captions' are usable once restyled to hairlines. Magic UI backlight (luminous edge) and video-text (text over media) fall under canon §5, and the modal hero-video-dialog was not taken.
- Nothing was written outside _shots/rivista-next/audit-d and the scratchpad.

**Top 5.**
1. 1. Give each work its own case and point every tile at it (B1). Generate case-<slug>.html from the works.ts data through assemble.mjs, deep-link tile 02 to the Sphere AI chapter, and chain 'Next work'. Today 7 of 9 'Open' links land on SphereNode under a cover that names another project. This is the largest gap in professionalism.
1. 2. Put real images into the rail and the cases, using material Alberto already made (M2, M4, M5). Use the Domus Tua captures from sersan-v2 case-studies; four sersan.io scene frames (48k-particle wordmark, 80k-cell portrait morph of Alberto, black hole, crystal) as stills with provenance; a SerSan identity plate; and two more spherenode.com product captures. Recompose the Now plate so it stops duplicating tile 04. The remaining type plates become named typographic covers, and 'No photograph on file' is stated once instead of 7×.
1. 3. Remove every prototype trace and the fake control (B2, M6). Fix the titles and meta, add OG tags and a real favicon, rewrite the colophon and legal lines, delete the case 'In this prototype…' sentence, stop the ?v=1 URL rewrite in fx-core.js syncLinks(), and take 'EN / IT' out of the nav and the menu until IT ships.
1. 4. Print the project name on all nine tiles (M1): change seven sr-only spans to <h3 class="d3"> and shorten tile 05's label so every caption runs label → title → body on one baseline. Small effort, immediate gain in clarity and polish across the whole rail.
1. 5. Make the water A read as the hero, and tidy its column (M3, m5). Gated to the water lane and Alberto's R-review: deeper cobalt absorption in the core, a crisper reflection, and the A at about 55–60% of the plate height (today it is about 0.9% of the viewport at 1.14:1). The DOM lane can fix the caption overshoot at once (≈1338 vs the 1310 edge) and align caption, CTA and ghosts on one edge.

### B1 · blocker · Seven of nine 'Open' links land on another project's case (SphereNode); the cover even names the wrong project first
- Evidence: Clicking tile 03 shows the S5 cover 'MAINTECH OMA · 03 Selected work' (d-cut03-t700.png), then lands on the SphereNode case (d-cut03-t3200.png). Tile 04 does the same: the cover reads 'SERSAN.IO' (d-cut04-t700.png) and the page lands on SphereNode (d-cut04-t3200.png). report-cut.json shows the same h1 'SphereNode' and hero /captures/spherenode-1600.webp for both. In parts/c-main.index.html all nine tiles have href="case.html". Tile 02 (Sphere AI) reaches the right page but at its top, not at its chapter. On the case, 'Next work · sersan.io →' goes to index.html#work, and its own copy says so (d-case-08-y5760.png).
- Fix: Build one case per work. Turn parts/c-main.case.html into a template and let assemble.mjs emit case-<slug>.html from a data module that mirrors the EN fields of src/content/works.ts (title, summary, stack, outcomes, capture). Point each tile's href at its own case. Tile 02 goes to case-spherenode.html#c2-h, the existing '02 · Sphere AI' chapter (give it an id). Chain 'Next work' by rail index. Interim, if the full set cannot ship now: build sersan.io and Domus Tua first (the assets exist, see M2/M4). Make the other five tiles non-links that print their facts in the caption with no 'Open' verb. Never send a tile to another project's page.
- Kind/effort: markup+content+js / L

### B2 · blocker · Prototype leftovers are visible to every reader: titles, meta, colophon, legal line, case copy, ?v=1 in the URL, blank favicon
- Evidence: report-home-rail.json: title 'Alberto Tuveri · Rivista prototype'. The meta description reads 'Prototype: Alberto Tuveri's portfolio in the rivista bianca canon.' robots is noindex. There are no og:/twitter: tags and no canonical. The case title is 'SphereNode · Alberto Tuveri · Rivista prototype'. The footer colophon prints 'Prototype, September 2026' and the legal line prints 'Prototype for review. Not the live site.' (d-walk-19-y13680.png, m-walk-09-end.png). The case's next-work body says 'In this prototype the link returns to the work rail.' (d-case-08-y5760.png). After a cut the address bar reads 'case.html?v=1' (report-cut.json), because fx-core.js:92-105 syncLinks() writes ?v= into every internal href and calls history.replaceState on every load. The favicon in parts/head.html is a data-URI paper-coloured square, so it is effectively blank.
- Fix: In assemble.mjs, change the TITLE vars to 'Alberto Tuveri — Software & AI Engineer, Creative Lead' and '<Work> — Alberto Tuveri'. Rewrite the meta description from the CV summary. Add og:title, og:description and og:image, plus twitter:card. For og:image, use a 1200×630 still captured from the engine, with provenance like fx-plate-v1.webp. Add a canonical link. Use the AT ring from the header as an SVG favicon. Keep robots noindex only until release. In parts/c-footer.html, replace the colophon's third item with a true build line and remove the 'Prototype for review' span. In parts/c-main.case.html, delete the 'In this prototype…' sentence. In fx-core.js syncLinks(), write v only when it differs from '1' or when ?chrome=1 is set, and never replaceState a default v into the URL.
- Kind/effort: markup+js+content / S

### M1 · major · Seven rail tiles hide the project name: only SphereNode and sersan.io have a visible title
- Evidence: Tiles 02, 03 and 05-09 show only a label ('02 · SERSAN · RAG MENTOR') and a body line. The names Sphere AI, Maintech OMA, Domus Tua, Brand film, Badante24h, Voice AI Agent and Supply Chain never appear on screen: d-rail-03.png, d-rail-06.png, d-rail-09.png, d-walk-05-y3600.png, d-walk-07-y5040.png. In the markup, each of these tiles has <span class="sr-only">Sphere AI</span> where the photo tiles have <h3 class="d3">. The caption rhythm therefore changes from tile to tile (label → title → body on 01/04, label → body elsewhere).
- Fix: In parts/c-main.index.html, replace the seven <span class="sr-only">…</span> with <h3 class="d3">…</h3>, as on tiles 01 and 04, so all nine captions share label → title → body. Also stop tile 05's label wrapping onto two lines ('05 · SERSAN · REAL-ESTATE BRAND PLATFORM'), which pushes its title below its neighbours: shorten it to '05 · SerSan · real-estate platform'.
- Kind/effort: markup / S

### M2 · major · The rail reads as an inventory of absences: seven beige plates stamped 'No photograph on file', with uneven baselines and text that zooms on hover
- Evidence: d-walk-05-y3600.png, d-walk-06-y4320.png, d-walk-07-y5040.png and d-rail-09.png show seven near-identical paper-deep panels. 'NO PHOTOGRAPH ON FILE' is the most repeated string on the page (7×). Tile 08 is two empty statements stacked ('—', 'no figure on file'). Tile 07's word figure puts its rule at y≈455 while the others sit at y≈476, and its label orphans '3' ('PostGIS / 3'). Hover scales the typographic plate by 1.04, so the figure grows and shifts (d-tile02-hover.png; fx-scroll.css:100-103). Real material already exists on disk: C:/Users/alber/Desktop/sersan-v2-main/public/case-studies/domus-tua-preview.webp (1600×940, a real Domus Tua capture already published on sersan.io), domus-tua/{preloader,sweep}-poster.webp with their .mp4 files, and the SerSan identity in sersan-v2-main/public/og-image.png (mark plus type).
- Fix: (1) Put a real image on Domus Tua: the sersan-v2 preview, re-encoded to 1600/800 WebP with provenance EXIF and a public/captures/PROVENANCE.md row, like the existing captures. Put a real plate on the identity tile 06 from the SerSan identity asset or a sersan.io mark frame (see M4). (2) Redesign the remaining type plates as named typographic covers: the work's name in Cormorant d2 at the top of the plate, then the figure and its label, and no per-plate gap stamp. State the gap once in the Work lead, e.g. 'Two are public sites, captured here; the others are printed as figures', and keep only that line. (3) In fx-scroll.css, scope the .tile-zoom scale to .tile.photo, keep the cobalt rule on .tile.type, and remove the focus-visible scale on type plates. (4) Pin .sc-plate .fig and the is-fig rule to a single baseline for .is-word too, and give .fig-l text-wrap: balance. Reference mechanism only: the 21st.dev 'Gallery Grid with Captions' (ln-dev7/gallery-02) puts captions under the media. Restyle it to hairlines, with no cards, radii or gradient thumbs.
- Kind/effort: asset+markup+css / M

### M3 · major · The hero's WebGPU proof is nearly invisible at 1440: the water A is about 0.9% of the viewport at 1.14:1 against the paper
- Evidence: Measured on d-hero-rest.png: the A covers 11,824 px at an average contrast of 1.14:1 against paper rgb(246,243,236), and the right stroke samples at 1.07:1. z-hero-A-zoom.png shows a milky, frosted-acrylic body. d-00b-hero-after-intro.png shows the first viewport reads as 'big name + faint glyph'. On mobile the A is larger but just as pale (m-00-top.png). The taste dossier (§5.1 items 3, 4 and 9) asks for water that 'reads as water even on plain paper' at 'real scale'.
- Fix: This belongs to the water lane and is gated (fx-water.js and water/engine/** are off-limits to the DOM lanes; the changes need Alberto's R-review per spec 30 §9). Render-side, give the thick core a deeper Beer–Lambert absorption toward cobalt #2340c9 and a crisper environment reflection and highlight thread, so that edges run clear and cores read at 2–3:1. In the dock composition, scale the A to about 55–60% of the plate height. Do not touch the solver or the pour choreography. DOM-only part: see m7.
- Kind/effort: js+asset / M

### M4 · major · No visual proof of 3D, WebGPU or creative lead beyond the water A; the one 3D image is used twice and badly cropped
- Evidence: The only 3D imagery on the home is one sersan.io capture used twice: in the Now plate (d-walk-02-y1440.png, d-walk-03-y2160.png), where the 1:1 frame cuts the SERSAN wordmark at both sides and the mark at the top, and again as tile 04 two viewports later (d-rail-03.png). The 'Creative' capability's proof is the text label 'BRAND FILM' (d-walk-15-y10800.png), which points to a tile with no image. Capabilities 'Proof' labels are plain <p class="label cap-proof">, not links. The About/Path chapter is chronology only, with no person in it. Real material exists: sersan.io runs a 48,000-particle wordmark, an 80,000-cell portrait morph of Alberto (source photo public at sersan-v2-main/public/founders/alberto-headshot.webp), a raymarched black hole and a refractive crystal (PRODUCT.md §3.3).
- Fix: Extend scripts/capture-sites.mjs to capture sersan.io at four scroll positions: the wordmark intro, the portrait morph, the black hole and the crystal. Use the same Playwright Chrome settings and EXIF provenance, and add rows to public/captures/PROVENANCE.md. Use the frames as stills, with no second renderer and no motion at rest. (a) Now plate: the portrait-morph frame, recomposed for 1:1, with the caption 'Fig. 02 · The author as 80,000 cells, from sersan.io'. This gives the Now chapter real 3D proof and fills the missing portrait in one move. (b) Tile 04: the wordmark frame. (c) A sersan.io case with a four-frame plate captioned 'Frames from one continuous WebGPU canvas'. (d) Turn each capability's 'Proof' into an <a> to its tile or case. Refused alternatives, and why: a GLB viewer of the SerSan mark is a second renderer (canon §5). Magic UI 'backlight' is a luminous edge. 'video-text' puts text over media.
- Kind/effort: asset+markup / M

### M5 · major · The case page is about 7 viewports of type with a single image, and that image is the client's marketing page
- Evidence: d-case-00-y0.png through d-case-10-end.png: after Fig. 01 (the full-bleed spherenode.com home, d-case-01-y720.png) there is no other figure. 'Eight tools, one platform', 'It asks before it guesses', the metric list, the guardrails and 'What had to hold' are all text. There is no image of the mentor, the Trading Journal or the platform UI.
- Fix: Recapture spherenode.com, which is public, at two or three product sections (courses or membership, the live-session area if public), declining cookies as in PROVENANCE.md. Set them as Fig. 02/03 plates between chapters 01 and 02, and after 03. If a film is wanted, sersan-v2-main/public/case-studies/spherenode/features.mp4 can be a user-initiated plate: poster plus a printed 'Play' control in the figcaption, playing once with no loop and the poster under reduced motion. Its poster shows a cookie banner, so cut a clean frame first. Mechanism reference: 21st.dev limeplay 'Player Layout' (structural frame plus a bottom control layer), restyled to paper and hairlines with no controls over the image. Not the hover-preview tile and not a modal dialog.
- Kind/effort: asset+markup / M

### M6 · major · 'EN / IT' in the primary nav and the menu looks like a language toggle but is not a control
- Evidence: d-header-full.png, d-nav-hover.png, m-menu-open.png. parts/a-header.index.html and a-header.case.html contain <span class="lang"><span class="sr-only">Language: English. Italian version coming.</span><span aria-hidden="true"><b>EN</b> / IT</span></span> in the nav and again in .nv-menu_lang. It sits in the nav row with a 35 px gap, where the links have 64 px gaps, so it reads as a fourth nav item.
- Fix: Remove .lang from both headers and from the menu foot until IT ships (canon R-21 is deferred). If a language note is wanted, print it once in the footer colophon as plain text ('English edition; Italian in preparation'), never in the nav.
- Kind/effort: markup / S

### m1 · minor · Path/About: the timeline steps right row by row, there are 13 d2 uppercase headings in a row, and there is no human paragraph
- Evidence: d-walk-16-y11520.png and d-walk-17-y12240.png: tl-body starts at x≈432, then 480, 525, 571 and 617 (fx-scroll.css:279 padding-left: calc(var(--k) * 3.2vw)), which reads as misalignment and narrows the thesis. Every row title is d2 uppercase, right after 8 d2 capability names (d-walk-13/14/15). The kind label wraps and leaves a trailing '·' ('SEP 2026 – PRESENT ·' / 'EDUCATION'). The lead is pure chronology. The CV SUMMARY paragraph (PRODUCT.md §9), which is the real 'about', is not used.
- Fix: In fx-scroll.css, remove the --k indent on .tl-body and align every row on one column. Set .tl-what to d3. Make '· Education' unbreakable (white-space: nowrap on .tl-kind, including the separator). Use the CV summary sentence as the Path lead. Pair it with the portrait-morph plate from M4 if that plate does not go into Now.
- Kind/effort: css+content / S

### m2 · minor · Ledger bars: tiny stubs for the 1.9%→0.6% row, no before/after key on the home page, a mis-hyphenated metric name
- Evidence: The 'Unsupported claims' bars render as 12 px and 4 px stubs that read as debris (d-walk-11-y7920.png, d-case-05-y3600.png). Each metric stacks a graphite bar, a cobalt bar and a hairline, with no legend on the home page. The label reads 'MOBILE LARGEST-CONTENTFUL-PAINT'.
- Fix: For metrics under 5%, drop the bars and print the figures only, or draw them on a printed 0–5% scale. Put one key in the ledger eyebrow ('graphite before · cobalt after'). Rename the label to 'Mobile Largest Contentful Paint' (parts/c-main.index.html).
- Kind/effort: markup+css / S

### m3 · minor · Nav hover leaves no resting state, the focus ring is lopsided, and the nav gaps are uneven
- Evidence: d-nav-hover.png is identical to rest: the roll returns the same word and nothing else changes. d-nav-focus.png: the 2 px outline around 'WORK' includes the 33 px section-dash slot on the left, so the ring sits off-centre. Gaps are 64/64/35 px with EN/IT.
- Fix: In fx-nav.css, set the colour to cobalt on :hover and :focus-visible over --d-hover soft, as R-15 does for links. Move the section dash to a ::before outside the anchor's padding box (negative left), so the outline hugs the word. Removing .lang (M6) fixes the gap rhythm.
- Kind/effort: css / S

### m4 · minor · Footer headings are Figtree light caps, unlike any other heading; the colophon is thin and there is no back-to-top
- Evidence: d-walk-20-end.png and m-walk-09-end.png: 'ALBERTO TUVERI / ELSEWHERE / COLOPHON' are Figtree 300 uppercase (fx-scroll.css:317), the only Figtree headings on the site. The colophon is three lines, one of which is the prototype line (B2).
- Fix: Style .foot h2 as the site's .label (Figtree 600, 16 px, tracked, stone) or as Cormorant d3. Rewrite the colophon as true lines, e.g. 'Set in Cormorant Garamond and Figtree', 'Scroll by GSAP and Lenis; the A is rendered live in WebGPU'. Add a 'Back to top' text link at the right of .legal. A CV link is optional and only for a phone-less export, since PRODUCT.md §3 forbids publishing the phone.
- Kind/effort: css+content / S

### m5 · minor · Hero right column: the caption overshoots the content margin and three different left edges compete
- Evidence: d-hero-rest.png: 'FIG. 01 · AN A OF WATER, RENDERED LIVE' ends at x≈1338, while the content edge (nav 'IT', 'Write to me', 'About') is x=1309/1310. The caption starts at x=978, the A at about 1075 and the CTA at 1101.
- Fix: In fx-hero.css, constrain .hr-cap to the content column: right-align it to 1310, or give the caption, the CTA block and the ghosts one shared left edge. DOM only, with no change to the gl host.
- Kind/effort: css / S

### m6 · minor · The claims gate does not scan the rivista prototype
- Evidence: scripts/check-claims.mjs:22 CONTENT_FILES lists only src/content/*.ts, so the numbers in public/proto/rivista/parts/*.html (68%, 1.74 s, 64 s, 21/49, 206, 79, 33, 161) are never checked. The ones I spot-checked are correct against PRODUCT.md §3/§9.
- Fix: Add parts/*.html to the scan, stripping tags and comments first, so every new figure on the site passes the same gate.
- Kind/effort: js / S

### m7 · minor · DESIGN.md and .impeccable/design.json still describe 'The job order', so tools judge rivista against the wrong world
- Evidence: impeccable detect flags cobalt #2340c9, white-on-cobalt, Figtree and Cormorant as 'outside DESIGN.md' on both pages (design-system-color ×2 and design-system-font ×2 per page).
- Fix: Write a rivista DESIGN.md from the built prototype (impeccable document against public/proto/rivista), or mark the job-order DESIGN.md as historic and point to the rivista one.
- Kind/effort: content / S

### p1 · polish · Tool lists in Capabilities break with a separator at the start of a line
- Evidence: d-walk-13-y9360.png, row 02: line 2 starts '· Tailwind CSS v4 · GSAP'. The 05 AI row breaks the same way.
- Fix: Wrap each tool in <span class="tool"> with the '·' as a trailing ::after inside a nowrap pair, or apply text-wrap: pretty to .cap-tools.
- Kind/effort: markup+css / S

### p2 · polish · A 15 px light strip shows at the right edge during the preloader and the cut covers
- Evidence: d-00a-preloader.png, d-cut03-t700.png and d-cut04-t700.png: the strip at x 1425-1440 is #f6f3ec next to the #ede7dc sheet. html reserves scrollbar-gutter: stable (fx-core.css:207), and fixed sheets cannot paint into the gutter while the page is locked.
- Fix: While a cover is up (html[data-preloader], the S4/S5 covered states, menu open), set html{background:var(--paper-deep)} so the gutter matches the sheet.
- Kind/effort: css / S

### p3 · polish · View-source shows dev notes, A/B variant posters and the switcher
- Evidence: index.html carries 'COPY TBC (Alberto, spec 30 §4.4), placeholders in use', owner notes, v2/v3 posters with Geist and Instrument Serif alt text, and the hidden V1/V2/V3 switcher. impeccable detect reports 'undersized-ui-text 10px V1' and 'broken-image: <img> with no src' (the [data-nv-img] overlay img).
- Fix: Add a release mode to assemble.mjs that strips HTML comments, drops the switcher markup and the v2/v3 posters, and gives the overlay <img> a 1×1 transparent src.
- Kind/effort: js+markup / S

### p4 · polish · Case overline items are separated only by gaps, so they read as one run-on line
- Evidence: d-case-00-y0.png: 'SERSAN  SINCE MAY 2026  LIVE AT SPHERENODE.COM'. The home uses '·' separators.
- Fix: Add a '·' separator between .overline spans with CSS ::before, matching the home labels.
- Kind/effort: css / S

### p5 · polish · The hero statement is a 70-character sentence in uppercase serif
- Evidence: d-hero-rest.png: 'FROM DATABASE SCHEMA TO REAL-TIME WEBGPU RENDERING AND MOTION DESIGN.' runs three uppercase lines. impeccable detect counts all-caps-body 16× on index, mostly labels, but this is the long one.
- Fix: Keep uppercase for the d1 titles, as the canon requires, but set #hero-h1, which is a sentence, in sentence case Cormorant. It reads faster and contrasts with the name lockup.
- Kind/effort: css / S

## 390x844 at DPR 2 (isMobile, hasTouch), headless Chrome chann

**Overall.** On a phone the prototype is calm, honest and technically clean, but it does not yet read as the finished portfolio of an engineer and creative lead. I judge it Honourable Mention territory today. It can reach Site of the Day only once the work index and the 3D proof are fixed.

**What holds:**
- Console is clean on both pages, and the page never scrolls sideways at 390.
- Every text pair passes AA: ink on paper 14.45:1, graphite 8.72, stone on paper 5.14, stone on paper-deep 4.63, cobalt on paper 7.16, white on cobalt 7.93. The 1.32:1 hairlines are decorative.
- Focus rings show on the filled button, the ghost links, the tiles, the email and the menu button.
- Every figure on the page traces to PRODUCT.md §3/§9 or works.ts. I spot-checked 'PostGIS 3' at PRODUCT:185 and 'audio notes' at works.ts:745.
- The preloader hands over cleanly to the docked water A, with the live readout 'WebGPU · 0.2 ms GPU · DPR 1.27'. The ?gl=0 still is labelled honestly.
- Measured is the most convincing chapter: a printed ledger of real before and after figures.

**What fails a jury:**
- The work rail, the core of a portfolio: 7 of 9 tiles have no visible name, print 'No photograph on file', and every 'Open' lands on the same SphereNode case.
- Prototype labels are printed for every reader, and '?v=1' sits in the address bar.
- 'EN / IT' looks like a switch and does nothing.
- On the phone, d1 and d2 are almost the same size, so timeline and capabilities rows outshout the chapter titles.
- Two craft defects: the case title collides with its ornament, and keyboard focus is invisible in the mobile menu.
- The site proves WebGPU only through the hero A. sersan.io, his strongest 3D work, appears as one still that opens the wrong case.

**What the fixes use:**
- Real media already found by the media scout: the Sphere AI capture, the Domus Tua still that sersan.io already publishes, and the brand-film frames (NDA pending).
- The vetted on-canon items from the component scout: C1 engine contact sheet, C3 contents index, C5 copy address, C6 ledger scale, C7 colophon wordmark, C10 proof links.
- No second renderer and nothing from canon §5. The hero composition and the band choreography stay as Alberto approved them.

The probe scripts are in the session scratchpad (audit-m/audit-m.mjs and verify-m.mjs), headless only; no product files were touched.

**Top 5.**
1. 1. Make the work rail a finished proof sheet. Every tile shows its name (M2). Sphere AI, Domus Tua and the brand film get real captures (M1); the brand film waits on the NDA. The 'No photograph on file' stamps go. The phone uses one tile aspect, so all nine captions start on one line. This alone moves the heart of the site from 'empty archive' to 'portfolio'.
1. 2. Give every tile an honest destination (B1). Build the case pages from 20-cases-spec.md (sersan.io and Sphere AI first). Make the remaining tiles non-link plates until their case exists, and point the case page's 'Next work' at the next real case.
1. 3. Remove the prototype skin in one S-sized pass (B2, M3, m7, m9): page titles and description, the colophon and legal 'Prototype' lines, the case's 'In this prototype…' sentence, the ?v=1 URL rewrite, the inert EN / IT, and the switcher and V2/V3 payload. Then add the AT favicon, an OG image and theme-color.
1. 4. Show the WebGPU and 3D craft in plates, not in a second canvas (M6):
- a sersan.io case with real scene stills and a muted recording that plays only on tap;
- scout C1 'Fig. 02 · One frame of the A, pass by pass', stills captured from this engine;
- one factual method line and a 'Tap the water' hint on Fig. 01;
- the brand-film frame as the creative-lead proof.
1. 5. One CSS craft pass on the phone:
- the type ladder (d1/d2, timeline and capabilities sizes; M7);
- balanced labels with bound separators (m5);
- the case title/ornament collision (M5);
- a visible focus ring in the mobile menu (M4);
- the sticky cobalt MENU (m3);
- the rail index at tile 08 (m1).

### B1 · blocker · All nine work tiles, plus the case page's 'Next work', open the same SphereNode case
- Evidence: facts.json dom['index.html'].links: all nine tile hrefs are 'case.html?v=1' (parts/c-main.index.html:31-111). hover-tile-03.png: the Maintech OMA tile shows the verb 'OPEN' and leads to the SphereNode case. case-08-y6080.png, y≈690-1100 device px: 'Next work · sersan.io →' points to index.html#work.
- Fix: Generate one case per work as docs/redesign/rivista-next/20-cases-spec.md describes (cases.json → assemble.mjs emits case-<slug>.html), and point each tile's href and data-pt-* at its own case. The next-link goes to the real next case. Until a case exists, the tile is not a link: drop the <a>, the .sc-roll-b 'Open' verb and data-pt. Two honest interim targets exist: Sphere AI can deep-link to the Sphere AI chapter of the SphereNode case (#c2-h), and Supply Chain to its public repo github.com/daveeCity/IDS_GROUP_PROJECT (PRODUCT §3.8).
- Kind/effort: markup + content + js (fx-nav route record) / L (S for the interim non-link tiles)

### B2 · blocker · Readers see the prototype skin: page titles, description, colophon, legal line, a case sentence and ?v=1 in the URL
- Evidence: facts.json: the titles are 'Alberto Tuveri · Rivista prototype' and 'SphereNode · Alberto Tuveri · Rivista prototype'; the meta description is 'Prototype: Alberto Tuveri's portfolio in the rivista bianca canon.'. home-16-y11506.png: the colophon says 'Prototype, September 2026' (y≈1200) and the legal line says 'Prototype for review. Not the live site.' (y≈1500). case-08-y6080.png y≈1050: 'In this prototype the link returns to the work rail.'. verify.json url: '…/index.html?v=1'. fx-core.js:104 writes ?v=1 with history.replaceState, and syncLinks appends it to every internal link.
- Fix: assemble.mjs:28 and :45: set TITLE to 'Alberto Tuveri — Software & AI Engineer, Creative Lead' and 'SphereNode — Alberto Tuveri'. parts/head.html:9: use a factual description from the PRODUCT §3 identity line. parts/c-footer.html: replace the colophon's third line with 'Designed and built by Alberto Tuveri, 2026' and delete the 'Prototype for review' span. parts/c-main.case.html: delete the prototype sentence from the next-link. fx-core.js syncLinks: write v and the KEEP flags only when they are already in the URL, never v=1 by default. Keep robots noindex until the deploy, then flip it.
- Kind/effort: content + markup + js / S

### M1 · major · Seven of nine rail tiles print 'No photograph on file': the work index reads as an empty archive, and its captions sit at two heights
- Evidence: rail-02, 03, 05, 06, 07, 08 and 09.png show 'NO PHOTOGRAPH ON FILE' at the plate foot (y≈970 device px). rail-08.png is empty twice over: '—', 'no figure on file' and 'No photograph on file'. facts.json rail.tiles: photo media are 185 css px tall and plates 370 px, so the captions start 185 px apart (home-03 and home-04: tile 01's caption sits at y≈1590 and tile 02's one step lower). Contrast of the plate label (stone on paper-deep) is 4.63:1, a pass by a thin margin.
- Fix: (1) Use real plates where media now exists (docs/redesign/rivista-next/11-media-scout.md §0) and switch those li to class 'tile photo':
- tile 02: public/captures/sphere-ai-{800,1600}.webp, already captured with a sidecar;
- tile 05: Domus Tua, from a fresh capture of the public preview, or sersan-v2-main/public/case-studies/domus-tua-preview.webp, which sersan.io already publishes (add a sidecar and a PROVENANCE row);
- tile 06: public/captures/sersan-brand-end-*.webp, once the director clears the NDA line (PRODUCT §8.4).
(2) Delete p.label.sc-plate-gap from the plates that remain (c-main.index.html:41-111). A typographic plate is honest without apologising.
(3) Below 768 px, give .tile.type .tile-media aspect-ratio 16/10 (fx-scroll.css ≈L94) and scale the figure down, so every caption starts on one line.
(4) Tile 08: replace the figure '—' with the true word figure 'Hands-free' and the line 'voice agent inside Microsoft Teams' (works.ts:768).
- Kind/effort: asset + markup + css / M

### M2 · major · Seven of nine tiles show no work name; the name exists only as sr-only text
- Evidence: rail-02.png, caption y≈1080-1220: '02 · SerSan · RAG mentor / Measured on a 161-question bilingual evaluation set.' 'Sphere AI' is a <span class="sr-only"> (c-main.index.html, tiles 02, 03, 05-09). rail-07.png: '07 · ALS MCL Civitanova · Freelance' with no 'Badante24h' anywhere. FIX J3's premise that 'the caption carries the name' does not hold.
- Fix: In parts/c-main.index.html, replace each <span class="sr-only">Name</span> with <h3 class="d3">Name</h3>, as tiles 01 and 04 already do. Keep the label row for index · org · kind.
- Kind/effort: markup / S

### M3 · major · 'EN / IT' looks like a language toggle but does nothing
- Evidence: menu-open.png, menu foot y≈1535: 'EN / IT', with EN in bold ink and IT in stone, which reads as a switch. parts/a-header.index.html:11 and :29 (and the same lines in a-header.case.html) mark it aria-hidden and add sr-only 'Italian version coming.' Tapping IT does nothing.
- Fix: Remove both visible spans (header nav and menu foot) until the Italian edition ships. Then 30-it-edition-spec.md §1.4 and scout C13 add a real control. Keep html lang="en" and add no 'coming soon' copy.
- Kind/effort: markup / S

### M4 · major · Keyboard focus is invisible on the mobile menu links (WCAG 2.4.7)
- Evidence: verify-menu-focus-zoom.png: '02 About' is focused and matches :focus-visible, but no ring shows. verify.json menuFocus: the a and li rects are identical ([20,175,351,74]) and li has overflow:hidden, so the 2 px outline at offset 3 px (fx-core.css:245) is clipped by fx-nav.css:114.
- Fix: fx-nav.css:114: take the clip off the li and clip only the type mask around .mi. Then either give `.menu li a:focus-visible` an outline-offset of -3px (an inset ring), or use `overflow:clip; overflow-clip-margin:6px`.
- Kind/effort: css / S

### M5 · major · On the case page the H1 'SPHERENODE' collides with its italic ornament 'in production' at 390
- Evidence: zoom-case-title-ornament.png and case-00-y0.png y≈500-560: the 'd' ascender of 'production' cuts into the N of SPHERENODE. The cause is fx-scroll.css:339 `.page-hero .ornament { margin-top:-0.35em }`, which has no phone rule. The home has one (FIX A12, fx-core.css:314-315).
- Fix: Add `@media (max-width:767.98px){ .page-hero .ornament{ margin-top:0.05em; margin-left:12vw } }` to fx-scroll.css, mirroring FIX A12.
- Kind/effort: css / S

### M6 · major · (d) The 3D / WebGPU / creative-lead proof stops at the water A
- Evidence: home-02-y1520.png: the Now plate is a single still of sersan.io. rail-04.png: the sersan.io tile opens the SphereNode case. home-09-y6840.png: 'Proof sersan.io' is not a link. home-00-y0.png: the Fig. 01 caption names neither the method nor the fact that the water reacts to a tap. Creative direction (identity, the 64 s film) appears only as the label 'Proof Brand film' and a plate with no picture.
- Fix: Everything below stays inside canon §5 and keeps one GL canvas per page.
(1) case-sersan-io.html (20-cases-spec §3.4): plates of real scenes captured headless from public sersan.io (the particle wordmark, the portrait morph, the black hole), plus a muted recording in a plate that plays only on tap, with a poster frame and a play/pause control in the figcaption. Never autoplay, so P10 and WCAG 2.2.2 hold.
(2) Scout C1 'Fig. 02 · One frame of the A, pass by pass': stills captured from this engine with captureDebugView (shaded, SDF, thickness, normals), in a 2×2 grid at 390, placed after Path.
(3) Fig. 01 caption: add one method line from PRODUCT §3.9 ('written directly against the GPU API') and a 'Tap the water' hint. The splash is shipped (spec 30 §9.8 D34); check the tap on a phone before printing the hint.
(4) Brand film: tile 06 and case-sersan-brand with the film's end-card frame, once the NDA is cleared.
- Kind/effort: asset + markup + content / L

### M7 · major · The phone type ladder collapses: chapter titles, sub-heads and list items are all about 40 px
- Evidence: facts.json type @390: d1 42.24px, d2 40.48px (a ratio of 1.04), d3 26.4px, hero lockup 50.7px. home-12-y9120.png: the timeline h3 'M.SC. IN ARTIFICIAL INTELLIGENCE SYSTEMS' runs 4 lines at 40 px and outshouts the chapter h2 'Camerino, Trento, London' (42 px, home-11). home-08 to home-11: Capabilities names at d2 plus tool lists at lead size (21.6 px light) make that chapter ≈2,300 css px long.
- Fix: fx-core.css, @media (max-width:767.98px) on :root: --t-d1 ≈ clamp(2.9rem,13vw,3.4rem) (≈52 px) and --t-d2 ≈ 1.9rem (≈30 px). fx-scroll.css: .tl-what (L272) and .cap-nm (L250) use --t-d3 below 768, and .cap-tools (L251) uses var(--t-body). Aim for a step ratio of at least 1.25.
- Kind/effort: css / S-M

### m1 · minor · The rail index reads 09 / 09 while tile 08 is the snapped tile
- Evidence: rail-08.png, y≈1380 device px: '09 / 09' with tile 08 at the left edge. fx-scroll.js:578 computes floor(p·n)+1 with p = scrollLeft/room; on the native rail the last tile can never snap left, so p overshoots.
- Fix: For the native phone rail, compute the index from the tile whose offsetLeft − pad is nearest to scrollLeft, and use the last tile when scrollLeft ≥ room − 1.
- Kind/effort: js / S

### m2 · minor · Pressing Tab to an off-screen tile does not scroll the phone rail
- Evidence: verify-rail-tab-02.png, verify.json railTab: tile 02 has focus at x 328-624 in a 390 px viewport, and railScroll stays 0. The focus ring is mostly off-screen.
- Fix: In the native-rail branch of fx-scroll.js, on a keyboard focusin (not after a mousedown, per canon R-09), call rail.scrollTo({left: tile.offsetLeft − pad}).
- Kind/effort: js / S

### m3 · minor · The MENU / CLOSE label stays cobalt after a tap (sticky hover)
- Evidence: header-midpage-up.png: 'MENU' is cobalt after the menu closes. verify.json menuBtnAfterTap: color rgb(35,64,201), :hover true. The cause is fx-nav.css:84, `.menu-btn:hover`, which is not gated.
- Fix: Move `.menu-btn:hover` inside @media (hover:hover) and (pointer:fine) and keep :focus-visible outside it, as MC-17 does for the nav.
- Kind/effort: css / XS

### m4 · minor · Ledger bars: tiny values draw specks, nothing marks 'lower is better', and the two ledgers use different scales
- Evidence: home-06-y4560.png y≈1010: 'Unsupported claims 1.9% → 0.6%' draws 2 px specks. Over-answering, LCP and TBT improve as the cobalt bar shrinks, with no cue. Sphere AI bars use an absolute percentage scale, while Domus bars are relative to the before value (home-07 y≈710-1000).
- Fix: Apply scout C6:
- one printed scale per ledger, stated once;
- a 'lower is better' micro-label on over-answering, unsupported claims, LCP and TBT;
- no bars on rows whose value is under 3 % of the scale (print the figures only).
- Kind/effort: markup + css / S

### m5 · minor · Labels wrap onto one-word lines and leave '·' separators dangling
- Evidence: home-01-y760.png: 'SOFTWARE & AI ENGINEER · CREATIVE / LEAD'. home-00-y0.png: 'FIG. 01 · AN A OF WATER, RENDERED / LIVE'. zoom-rail07-orphan-dot.png: '07 · ALS MCL CIVITANOVA · / FREELANCE'.
- Fix: fx-core.css:284 .label: add text-wrap: balance. In the partials, bind each separator to its word with a no-break space before the '·'.
- Kind/effort: css + markup / XS

### m6 · minor · (e) The footer and colophon read like a template
- Evidence: home-15-y11400.png: the footer heads 'ALBERTO TUVERI / ELSEWHERE / COLOPHON' are set in Figtree 300 uppercase, untracked (fx-scroll.css:317), a fourth style used nowhere else. The footer has no email and no back-to-top link. The colophon lists fonts and libraries plus 'Prototype'.
- Fix: .foot h2: use the .label style (16 px, 600, tracking 0.08em, stone) or Cormorant d3. Add the email with scout C5 'copy the address', and a 'Back to top' link. Colophon: 'Set in Cormorant Garamond and Figtree · Water written directly against the GPU API (WebGPU) · GSAP, Lenis' (PRODUCT §3.9), plus the scout C7 wordmark.
- Kind/effort: markup + css / S

### m7 · minor · Metadata is not ready for sharing or an Awwwards submission
- Evidence: facts.json meta and verify.json chrome:
- no og:* or twitter:* tags, no canonical, no JSON-LD;
- the favicon is a blank paper square (head.html:8);
- no theme-color, no apple-touch-icon;
- robots is 'noindex, nofollow'.
- Fix: parts/head.html:
- og:title, og:description, og:image (a 1200×630 still in the fx-plate-v1 composition, with the name);
- the AT mark as an SVG favicon plus a 180 px apple-touch-icon;
- theme-color #f6f3ec;
- a canonical link per page;
- Person JSON-LD with the public links of PRODUCT §3.
Flip robots at launch.
- Kind/effort: markup + asset / S-M

### m8 · minor · (e) The Capabilities 'Proof' labels name works but link nowhere
- Evidence: home-08-y6080.png y≈835 and ≈1380, home-09 to home-10: 'PROOF SUPPLY CHAIN', 'PROOF DOMUS TUA' and 'PROOF SERSAN.IO' are labels, not links.
- Fix: Apply scout C10: each Proof becomes a link to its case, or to its tile until the case exists, and its verb rolls to 'See the work' (the R-16 roll, on paper).
- Kind/effort: markup / S

### m9 · minor · Prototype payload still ships (variant switcher, V2/V3 posters and CSS, dev pages)
- Evidence: verify.json chrome:
- the variant switcher is in the DOM (display none) and ?chrome=1 shows it to anyone;
- the v2/v3 posters are present;
- fx.css (112 KB unminified) carries 12 [data-variant=2|3] rule blocks and var-only spans.
The directory listing of public/proto/rivista shows dev-gl.html, dev-water.html and assemble.mjs served beside the pages.
- Fix: Give assemble.mjs a release target that drops V2/V3, the switcher and the var-only spans. Exclude the dev pages and the assembler from the deploy.
- Kind/effort: js + css / S

### m10 · minor · The first phone viewport shows the name twice and does not say 'Creative Lead'
- Evidence: home-00-y0.png: the header 'ALBERTO TUVERI' sits above the giant lockup 'ALBERTO TUVERI / engineer'. The role 'Software & AI Engineer · Creative Lead' and the CTA appear only after a scroll (home-01-y760.png y≈290). Alberto approved the phone composition as it is (spec 30 §9.7), so the hero itself does not move.
- Fix: On the home, while the lockup is in view, the header brand shows the role 'Software & AI Engineer · Creative Lead' (label style) in place of the duplicated name, and swaps back once the lockup leaves. Use an R-04 line roll inside its own mask. The hero is untouched.
- Kind/effort: markup + css + js / S

### m11 · minor · (e) 'About' lands on a CV timeline with no sentence in Alberto's own voice
- Evidence: home-11-y8360.png and home-12-y9120.png: the nav 'About' goes to #path, which holds a headline, a dates lead and five timeline rows. Nothing says how he leads the creative work.
- Fix: Use the CV SUMMARY as the Path lead (PRODUCT §9, facts verbatim: owns the front-end, 3D and motion layer; directs the studio's creative output, brand identity, brand film and video).
- Kind/effort: content / S

### p1 · polish · The verb roll on two-line tile labels leaves an empty line
- Evidence: focus-tile-01.png y≈1050-1090: 'OPEN' replaces the two-line label '01 · SERSAN · LIVE AT SPHERENODE.COM' and leaves a blank line above 'SPHERENODE'.
- Fix: Keep tile labels to one line on the phone (e.g. '01 · SerSan', with the URL moving to the body line), or centre .sc-roll-b in the full height of the box.
- Kind/effort: css + content / XS

### p2 · polish · The case overline is ragged
- Evidence: case-00-y0.png y≈320-375: 'SERSAN    SINCE MAY 2026 / LIVE AT SPHERENODE.COM', with wide gaps and an uneven wrap.
- Fix: Set it as one dot-separated label like the rail captions, with balanced wrapping.
- Kind/effort: css / XS

### p3 · polish · Job-order 'on file' vocabulary leaks into the magazine
- Evidence: home-03-y2280.png: 'Nine works, on file'. The rail adds 'No photograph on file' ×7 and 'no figure on file' — at least 9 occurrences.
- Fix: Retitle the work chapter 'Nine works' (or 'Selected work'); M1 removes the plate lines. Do not add date ranges: '2021—2026' is a banned claim (PRODUCT §4).
- Kind/effort: content / XS

### p4 · polish · Two links are under the 44 px touch size
- Evidence: facts.json taps: the band email is 240×27 css px, and the case link 'Fig. 01 · spherenode.com' is 240×21. They pass 2.5.8 through spacing, but they sit below the comfortable size.
- Fix: Add padding-block (with a matching negative margin) so each hit area is at least 44 px and the layout does not move.
- Kind/effort: css / XS
