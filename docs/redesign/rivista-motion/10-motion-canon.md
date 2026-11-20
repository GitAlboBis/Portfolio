# 10 · Rivista motion canon: animations, transitions and effects that feel professional and smooth

> **Status:** build contract, **revision 2** (2026-09-24), branch `feat/water-hero`. Revision 1 was written by the lead motion designer from four reader reports (domus-tua-site, sersan-v2, the references, the rivista inventory). Revision 2 folds in the taste critique and the feasibility/performance critique. Every line reference was opened again; where prose and code disagreed, the code won.
> **Scope:** the static prototype `public/proto/rivista` (V1 "Carta e cobalto"): `fx-core.*`, `fx-hero.*` (DOM lines only), `fx-scroll.*`, `fx-nav.*`, `parts/*.html`, `assemble.mjs`.
> **Off-limits:** `fx-water.js`, `fx-gl.js`, `water/engine/**`, and every write to `FX.gl` inside `fx-hero.js`:
> - in `intro()`, the `if (float && gl())` travel block (L331-339), the `slitOpen` cue (L343) and the phone dock (L346);
> - `slitOpen` itself (L279-294), the gl lines of `applyStage` (L226-237), and the band host (L158-182, L434-456).
>
> The sheet tween (L341) and `handoff()` (L296-305) are DOM and may change. The water has its own motion law: a 5.0 s breath window, then honest idle (`docs/redesign/water-hero/30-hero-build-spec.md:223-228`). Nothing here changes it.
> **Path legend:** `rv/` = `public/proto/rivista/` · `domus/` = `C:\Users\alber\domus-tua-site\` · `sersan/` = `C:\Users\alber\Desktop\sersan-v2-main\` · `refs/` = `_refs/` · `taste` = `_refs/hero-water/05-taste-history.md`.
> **Evidence already on disk:** `_shots/rivista-motion/inventory/{desktop,mobile,reduced}/` and `inv1-3.json` (headed Chrome, WebGPU, 144 Hz). Lighthouse gl-off lab: `_shots/water-hero/M8b/lh_gloff_1-3.json`.

## 0. Alberto's decisions (2026-09-24) — these OVERRIDE anything below and any build prompt

- **Q1 scroll weight: ×1 as today**, plus the flick lead clamp of MC-14. The ×0.7 B side is dropped.
- **Q3 covers: NO hairline.** The one-sheet grammar stays (S1, S4, S5 are the same translated paper sheet), but its moving edge carries **no line of any colour and no shadow**. The edge must still read (the "dead air" of MC-01 is bare paper over bare paper): it reads **by tone** — the sheet is `--paper-deep` (#ede7dc) over `--paper` (#f6f3ec), or the reverse where the page is deep — a tone step, never a stroke. Every "1 px ink hairline" in MC-01, MC-12, R-03 and R-12 reads as "a tone edge". Mobile menu: the default (five columns, stagger flattened to ≤ 0.015 s).
- **Q8 cursor: native.** MC-26a / MC-26b as written (the label cursor and the magnet removed; the verb rolls in place).
- **Q9 no WebGPU: skip S1.** On the gl-off path (no `navigator.gpu`, `?gl=0`, a forced failure before the window opens) the preloader is skipped and the page enters on the poster through the plain entry; new item **MC-32 (P1, lane H + C)**, acceptance: Lighthouse mobile gl-off ≥ 80 with the LCP render delay gone, 0 console errors, one warn.
- **R3 decisions (Alberto, 2026-10-04)** — they override the recipes below:
  - **Cut exit: `?exit=out` becomes the default.** A click or tap must show the cut leaving within 50–100 ms; the canon's slow `--ease-in` exit stays only as the B side `?exit=in`.
  - **S1 sheet: the default deep sheet stays** (one paper-deep sheet, the pour window as a paper box); `?sheet=lip` is dropped as an option.
  - **S3: the Now sheet keeps its 1 px edge line** (the only drawn moving edge on the site; paper over paper has no tone step).
  - **Performance: adopt the deferred script loader now** (lab median 84 vs 78 without it), with a full regression of the boot on every page, rather than waiting for a Vercel preview measurement.
  - Accepted as built: R-17's Work-head counter-parallax starting at `top 45%`.
- **Language, as built (2026-10-11, under Alberto's delegation of that day): R-21 and MC-28 are re-scoped.** A change of language is not R-21's in-place "dim, swap, rise". It is a navigation to the same page of the other edition (`rv/it/` ↔ the root), taken as an **S5 cut** (R-12): the sheet carries the destination's own name ("Italiano" / "English") over its edition line, the reader's place travels in `rv-place` and is put back under the arriving sheet, and S1 does not replay. Reduced motion takes R-12's own path; without script it is a plain link. R-21's mechanism below is withdrawn. MC-28's acceptance becomes: the cut leaves like any other cut (`?exit=out`), the arrival lands on the section the reader left, and no `.btn` is ever below opacity 1, which P3 now gets by construction because nothing is dimmed. Built in `00f4fa5` (`assemble.mjs` `langSwitch()`, `fx-core.js`, `fx-nav.js`); the reasons are in `docs/redesign/rivista-next/30-it-edition-spec.md` §1.1, §1.6 and §1.8. No timing was measured for it.
- **Defaults taken without a question:** Q2 the AT ring is an honest progress dial; Q4 the counter creeps ≤ 1/3 of the open band; Q5 type resets invisibly below the fold and replays on re-entry; Q6 no DOM frame around the pour window; Q7 the straight curtain (the lama only as an A/B); Q10 the postcard close as P2; TEMPO scales the DOM cues and CSS only, never the water's travel.

---

## 1. Thesis

Professional and smooth, for this magazine, means the page moves the way a careful editor handles a printed issue:
- paper sheets, straight clip edges and 1 px hairlines travel on one family of curves;
- type rises out of its own line;
- entrances are long and settle (0.9–1.25 s);
- exits are about three times quicker (0.35 s);
- each move starts before the last one lands, so there is never dead air;
- things arrive in a declared order: the content first, the chrome last.

The scroll and the reader's clicks drive every move; the idle clock drives none. The pointer lights things but moves nothing. At rest only the water A is alive, and only inside its own breath window. Everything else is print.

It refuses:
- curved, noise or liquid edges;
- blur, veils, glitch and scramble;
- per-letter wobble, count-ups, bounce and elastic springs;
- anything that follows the pointer (follower and label cursors) and pointer forces (magnets);
- scroll-jacking and JS snap. Native CSS scroll-snap on the phone's horizontal rail is allowed;
- decorative spin, perpetual or velocity-driven;
- any text crossing partial opacity on cobalt or on a photograph.

---

## 2. Principles

Each principle is a rule that a probe or a film strip can fail.

| # | Rule | Source | Check |
|---|---|---|---|
| P1 | **One lexicon, twinned.** Every duration, ease, stagger and distance comes from §3. The CSS custom property and the GSAP name are byte-identical twins. Modules contain no literal numbers. | `domus/app/lib/motion/gsap.ts:106-173` ↔ `domus/app/globals.css:536-565`, enforced by `motion-tokens.test.ts`. `sersan/src/app/globals.css:72`. Gap today: about 22 literal durations in `rv/fx-*.js`. | `tokens.mjs` (MC-09b) greps `rv/fx-{core,hero,scroll,nav}.{js,css}` for literal seconds, `cubic-bezier(`, `power*` and `expo.*` outside the token module and the allowlist. Any hit exits 1. |
| P2 | **Reveals enter long and leave short.** A reveal's exit (a cut exit, a hover-out, a label out) takes 0.35 s on `--ease-in`, is ≤ 0.4× its entrance and is never delayed. **Covers and menus** use their own open/close pair on different curves, with close ≤ 0.7× open. | `domus/app/lib/motion/reveal-engine.ts:1-12`. `domus/docs/effetti-reference.md:307` («Uscire deve essere più secco che entrare»). `sersan/src/components/fx/beat-choreographer.ts:21-33`. | Token probe, plus a ratio assert per recipe. |
| P3 | **No text crosses partial opacity on colour.** A filled cobalt control enters and leaves with a clip wipe. Opacity fades are allowed only for type on paper. The rule applies to the **effective** opacity (the product over the element and all its ancestors), because computed opacity is not inherited. | `CLAUDE.md` §2. Wrappers that fade today: `.hero-cta[data-hero-reveal]` (`rv/parts/b-hero.html:50`), `.hr-act.hr-fade` (`:49`, written by `rv/fx-hero.js:214-217`), `.cta-row[data-reveal=hero]` (`rv/parts/c-main.case.html:9`). | 60 fps screencast: for every `.btn` in every frame, the product of `opacity` up to `<html>` is exactly 0 or 1. |
| P4 | **Straight edges only.** A mask is `inset()` or a straight-edged `polygon()`. Hairlines are 1 px, horizontal or vertical. | `domus/app/lib/motion/clip.ts:44-58` (`assertStraight`, C01 «niente curvo»). `refs/hero-water/07-liquid-effects-challenge.md:244-252`. | grep for `circle(`, `ellipse(`, `path(` or `url(` inside `clip-path`/`mask` in `rv/` returns 0. |
| P5 | **Type replays without flapping; media plays once.** A block enters at `top 86%`. It resets **invisibly** only once it is fully below the viewport (its top below 100 %), and replays on re-entry. Anything that left through the top stays printed. Plates, the tile unroll and the strikes play once per page view. | `sersan/src/components/fx/lusion-type.ts:257-292` (reset only when fully out). `domus/app/lib/motion/reveal-engine.ts:91-104` (EXIT_LINE 0.85: a 15 % band between enter and exit). Gap today: enter and leave-back share one line (`rv/fx-scroll.js:155`). | `blocks.mjs`: (a) down/up/down leaves no element at opacity < 1 or transform ≠ none after settling; (b) **park** each block's top at 86 % ± 8 px, and at 100 % ± 8 px, for 2 s each: 0 re-triggers. |
| P6 | **One trigger per block.** A block's rule, eyebrow, title, lead and figures start from one ScrollTrigger at fixed offsets. | `domus/app/lib/motion/text-roles.ts:83-101`. `sersan/src/components/fx/beat-choreographer.ts:96-120`. Gap today: start lines at 95/94/90/88/86 % plus an IO at −8 %. | `blocks.mjs` logs each member's first-motion time. The spread must equal the declared offsets ±1 frame. |
| P7 | **No dead air, and no pile-up.** The next move starts before the previous one lands, overlapping it by at least 25 %. Inside a choreography, no interval longer than 150 ms passes with nothing visible moving. Paper moving on paper does not count: a moving sheet must carry a visible edge. No more than **three** motion groups may start inside any 0.3 s window. | `sersan/src/webgl/SignatureLine.tsx:152-165` (commits e8bafb7, e4f009e). `taste:53` («tra un movimento e l'altro deve passare meno tempo», «meccanica»). Sersan 27a4d93 («si vede la camera che si sposta nel logo dietro le scritte»). | Film strips of the hand-off, the S4 back arrival and the menu, with the group-start count logged per 0.3 s. |
| P8 | **One clock per film, one knob.** A film is started by the event it follows (an attribute or class change, or a GSAP timeline cue), never by rewriting a delay measured on another clock. The intro's cues live in one constant block that is scaled by a single `TEMPO`. | `domus/app/lib/motion/intro-constants.ts:1-16, 48-76` (seven clocks became one; Alberto retimed domus from 9.26 s to «dimezzato», 4.63 s). Gap: `rv/fx-hero.js:301`. | Each cue's first moved frame is ≤ 2 frames after its timeline time × TEMPO. |
| P9 | **The scroll drives; the pointer lights.** Type moves with the scroll. Hover changes colour and lines, and rolls text only inside the element's own box. Nothing follows the pointer and nothing is pulled by it. | `taste:54` («con lo scroll, non con il cursore»). `refs/hero-water/03-sersan-quality.md:335` («pointer as a light, not a force»). Domus client: no custom cursor, no magnetic (`domus/docs/wow-layer-plan.md:67-74`). | No hover transform leaves its mask. `document.querySelectorAll('.nv-cursor,[data-magnetic]').length === 0`. |
| P10 | **Calm at rest.** Only the water moves on its own. Chrome moves only on scroll or input, and within 1.5 s of the last input nothing but the water writes a style. | `taste:132` (WCAG 2.2.2). `30-hero-build-spec.md:223-228`. Gap: `rv/fx-nav.js:88-111` (the ring turns at 30°/s forever). | `idle.mjs`: after 6 s without input, sample every non-canvas transform for 1 s. It must be unchanged, with 0 style writes. The GSAP ticker itself keeps running (Lenis, the header read, the water); the probe counts writes, not ticks. |
| P11 | **Every cover is bounded and heals itself.** Any overlay, lock or hidden state has a guard and ends open. | `sersan/src/app/template.tsx:25-34`, `sersan/src/components/navbar.tsx:265` (FAILSAFE_MS 1200). `domus/app/components/motion/SmoothScroll.tsx:92-104`. Already in `rv`: `fx-core.js:360` (6 s), `fx-nav.js:469/566`, `fx-hero.css:153`. | Throw inside `fx-nav` mid-cut. The page must be usable within the guard. |
| P12 | **Reduced motion is the printed issue.** No Lenis, preloader, scrub or stage. Covers use ≤ 0.2 s linear opacity on paper. Every hidden state is set by JS inside a motion-ok `gsap.matchMedia`. A live change of the preference reloads the page, and the reader's place survives the reload. | `domus/DESIGN.md:303`. `sersan/src/components/smooth-scroll-provider.tsx:33-48`. `rv/fx-core.css:357-360`, `rv/fx-core.js:301`. | `node scripts/visual-gate.mjs rm "" --reduce` finds 0 elements at opacity < 1 after load. Toggling the preference mid-page returns to the same section (MC-16). |
| P13 | **Pointer targets never slide.** A block member that is or contains a link or button (`a[href], button, summary, input, select, textarea, [tabindex]:not([tabindex="-1"])`) enters with opacity only (a clip wipe for a `.btn`), never with a translate. | `domus/app/lib/motion/text-roles.ts:88` (`INTERACTIVE`, demoted from rise to opacity). Gap today: the Now ghost link `sersan.io` fades up 2.5 rem (`rv/parts/c-main.index.html:8`). | `blocks.mjs`: every interactive member's bounding box is constant across its entrance. |
| P14 | **Never move a gl-host ancestor.** No reveal, block, drift or postcard transform may touch `.band`, `.band-copy`, `.hr-plate`, `.hr-frame` (apart from the existing curtain) or any ancestor of `[data-gl-host]`. Band members that the water reads as obstacles keep their boxes still. | `fx-water` measures the host with `getBoundingClientRect`, transforms included (`rv/fx-water.js:165-212, 736-743`). It reads the band keep-out rects once, at mount, via `getClientRects` (`:249-285`, called by `mountBand`, `rv/fx-hero.js:158-165`). The band eyebrow `p[data-reveal]` sits at translateY(2.5 rem) at mount: a latent 40 px error. | Log the band keep-out rects at mount and after all reveals settle: Δ ≤ 1 px. |

---

## 3. Tokens (one table)

The table decides two things.
- **Eases.** The prototype's four eases stay. `in` is added for exits. Exact GSAP twins are registered, so CSS films and GSAP tweens trace the same curve. `dtOut` (`rv/fx-core.js:353`) and `--ease-dt` (`rv/fx-core.css:129`) are retired; neither is used.
- **Durations.** Every value maps to one usage. Near-duplicates collapse onto that usage ("match on usage, not the nearest number"). Pointer feedback has its own fast tokens: hover feedback slower than about 0.35 s reads as lag.

| Kind | Token (CSS) | Value | GSAP twin | Usage | Replaces today |
|---|---|---|---|---|---|
| ease | `--ease-out` | `cubic-bezier(0.16,1,0.3,1)` | CustomEase **`rv.out`** (new) | every entrance: lines, rises, fade-ups, rules, bars, captions, inner settle, text rolls, the tile zoom | `expo.out`, `power3`, `(0.2,1,0.8,1)` (`rv/fx-nav.css:166`, `rv/fx-scroll.css:274`) |
| ease | `--ease-io` | `cubic-bezier(0.66,0,0.22,1)` | `domus.inOut` (`rv/fx-core.js:352`) | travel and covers: the S1/S4/S5 sheets, the S4 image, menu columns, the plate clip, the anchor glide, the CTA wipe | Lenis's default easing in `FX.scrollTo`; `(0.7,0,0.2,1)` (`rv/fx-nav.css:165`) |
| ease | `--ease-soft` | `cubic-bezier(0.22,0.9,0.36,1)` | `domus` (`rv/fx-core.js:351`) | small UI state: underline swaps, colour, header | — |
| ease | `--ease-xio` | `cubic-bezier(0.87,0,0.13,1)` | `expo.inOut` | the S1 window travel only (off-limits). No DOM use | — |
| ease | **`--ease-in`** (new) | `cubic-bezier(0.5,0,0.75,0)` | CustomEase **`dtIn`** (`domus/app/lib/motion/gsap.ts:116`) | every exit | `power2.in` |
| ease | linear | `linear` | `"none"` | scrubs, ink, the rail track (containerAnimation needs it), the ring dial, reduced-motion opacity | — |
| dur | `--d-press` | 0.12 s | `D.press` | `:active` scale 0.98, the menu type-off step | 0.12 |
| dur | `--d-micro` | 0.25 s | `D.micro` | chrome state: header background, `lang` opacity | 0.25 |
| dur | **`--d-hover`** (new) | 0.3 s | `D.hover` | pointer feedback: `.btn` fill, underline swaps, link colour, arrow nudge | 0.3 / 0.35 |
| dur | `--d-exit` | 0.35 s | `D.exit` | every reveal exit (group cap 0.75 s), menu close | 0.3 / 0.35 / 0.4 |
| dur | `--d-roll` | 0.45 s | `D.roll` | **text rolls only**: nav roll, informative hover roll, index digits, section dash | 0.45 |
| dur | `--d-wipe` | 0.5 s | `D.wipe` | covers: S4/S5 sheet, menu columns, neighbour roll, header hide/show | 0.45 / 0.5 / 0.55 |
| dur | **`--d-zoom`** (new) | 0.6 s | `D.zoom` | tile hover zoom (in and out) | 0.6 |
| dur | `--d-reveal` | 0.9 s | `D.reveal` | fade-ups, rises, rules, leads, captions, strikes, the CTA wipe, nav words | 0.7 / 0.8 / 0.9 |
| dur | `--d-title` | 1.05 s | `D.title` | display-title lines | 1.05 |
| dur | `--d-travel` | 1.1 s | `D.travel` | S4 image travel, plate clip, bars, tile unroll | 1.0 / 1.1 |
| dur | `--d-name` | 1.25 s | `D.name` | the lockup chars only | 1.25 |
| dur | `--d-media` | 1.4 s | `D.media` | plate inner settle, ornament, anchor-glide cap | 1.2 / 1.4 / 1.5 / 1.6 |
| dur | `--d-rm` | 0.2 s linear | `D.rm` | reduced-motion covers, on paper only | 0.15 / 0.2 |
| stagger | `--st-char` | 0.045 s | `S.char` | name chars, per line (≤ 7 × 0.045 = 0.315 s) | 0.04 / 0.045 |
| stagger | `--st-word` | 0.06 s | `S.word` | nav words, menu items | 0.06 |
| stagger | `--st-line` | 0.09 s (title) · 0.08 s (lead) | `S.line`, `S.lead` | masked lines | 0.08 / 0.09 |
| stagger | `--st-item` | 0.05 s | `S.item` | rises, captions, strike items | 0.05 / 0.06 / 0.07 |
| stagger | `--st-block` | 0.1 s, capped at 5 | `S.block` | rows arriving together in one batch | 0.08 |
| stagger | `--st-col` | 0.035 s (≥ 768) · 0.045 s (< 768) | `S.col` | mobile-menu columns (unless Q3 flattens them) | 0.03 / 0.035 / 0.045 |
| stagger | exit | entry / 2, min 0.02 s | — | every exit stagger | 0.02 |
| distance | lines | yPercent 112 in · **reset +112 (invisible)** · −110 cut exit | — | masked lines | −110 on leave-back today |
| distance | rise | yPercent 110 | — | printed figures in masks | same |
| distance | fade-up | 2.5 rem ≥ 1024 · 1.5 rem below; **0 for interactive members (P13)** | — | body type on paper | same |
| distance | cut exit | y −18 px | — | blocks leaving before a cut | same |
| distance | caption / ornament / plate | 26 px · 6 vw · settle scale 1.08 → 1 | — | rail captions, ornament, plate img | 1.15 → 1 today |
| distance | drift / parallax / pan | stair ±24 px ≥ 1024, ±8 px below, **Path only** · parallax yPercent ±5 (±2.5 on phone) at scale 1.12 · pan xPercent ±2.5 | — | scroll-linked moves | stair drift is new |
| distance | pointer | tile zoom 1.04 · press 0.98 · no magnet | — | micro | magnet ±12 px removed |
| trigger | reveals | block enter `top 86%`, invisible reset once the block's top is below 100 % · row batch `top 90%` (interval 0.1, batchMax 4) · media `top 88%` once · captions `left 90%` (containerAnimation) · band title `top 70%` · rail runway start +2.5 %, end −2.5 % of its height | — | reveals | 95/94/90/88/86 % + IO; no hysteresis; no dead zone |
| scroll | Lenis 1.3.26 | `lerp 0.1, smoothWheel true, syncTouch false, anchors false, autoRaf false, wheelMultiplier 1`, on `gsap.ticker` with `lagSmoothing(0)`; `ST.update` on scroll; `ST.config({ignoreMobileResize:true})`. **Added:** a wheel-only lead clamp of ±0.5625·innerHeight inside `virtualScroll`. **B side of Q1:** `wheelMultiplier 0.7`. Never `duration`/`easing` in the constructor | — | smooth wheel; touch stays native | no clamp (`rv/fx-core.js:136-146`) |
| scroll | `FX.scrollTo` | `easing: gsap.parseEase("domus.inOut")`; 1.1 s if \|Δ\| ≤ 1.5·innerHeight, else 1.4 s; if the path crosses a sticky stage, jump immediately and replay the destination's entrance | — | anchors, "top" | 1.4 s on Lenis's default ease (`rv/fx-core.js:144`) |
| intro | `TEMPO` | 1 (read from `?tempo=` for review only) | `INTRO` constant block in `fx-hero.js` | scales every DOM cue of the intro and the CSS film durations through `--tempo` | seven delays on three clocks |
| policy | reduced motion | No Lenis, preloader, stage, scrub, split, parallax, pan or drift. Covers use `--d-rm` linear opacity on paper. Hover becomes an instant colour or underline. The rail becomes a 3-column index. The water shows its own still. Kill switch at `rv/fx-core.css:357-360`; a live change reloads and restores the place | — | everything | same (keep), plus the place |

**Twinning rule.** `FX.motion = {D, E, S}` is read once from `getComputedStyle(document.documentElement)` in boot, before `phase("init")` (around `rv/fx-core.js:356`), so JS never retypes a number. `rv.out` ("0.16,1,0.3,1") and `dtIn` ("0.5,0,0.75,0") are registered next to the existing eases at `rv/fx-core.js:350-354`. Allowlisted literals: the engine files, the off-limits `FX.gl` tweens, the S3 `seg()` breakpoints, and the `INTRO` block (it *is* the token for the intro).

---

## 4. Recipe catalog

Each recipe gives its source, what the visitor sees, the mechanism with numbers, where it goes, the reduced-motion path, and pitfalls. "Keep" means the prototype already does it right.

### R-01 · Smooth scroll on one ticker
- **Source.** `rv/fx-core.js:136-146`. `domus/app/components/motion/SmoothScroll.tsx:108-118` (the same numbers, `wheelMultiplier 1`, on the site Alberto approved in this canon) and `:92-104` (a self-healing stop). `sersan/src/lib/lenis-singleton.ts:30-60, 198-303` (lead clamp, resync).
- **Sees.** A wheel notch glides and settles in about 0.5 s. A hard flick cannot run ahead of the eye. Touch keeps native inertia.
- **Mechanism.**
  - Lenis runs on `gsap.ticker` (`lenis.raf(time*1000)`), with `lagSmoothing(0)`; `lenis.on("scroll", ST.update)`.
  - `lerp 0.1` (τ ≈ 158 ms), `smoothWheel true`, `syncTouch false`, `wheelMultiplier 1`.
  - **Lead clamp (MC-14).** In `virtualScroll`, for wheel events only:
    ```js
    lead = lenis.targetScroll - lenis.animatedScroll;
    data.deltaY = clamp(lead + data.deltaY, -L, L) - lead;   // L = 0.5625 * innerHeight
    return true;
    ```
    In the local 1.3.23 build, `onVirtualScroll` passes `data` to `virtualScroll` before destructuring it (`node_modules/lenis/dist/lenis.mjs:556-558`), so the mutation is honoured. Re-verify against 1.3.26 (Context7, or the CDN source) before shipping.
  - The clamp is what makes a flick feel heavy without slowing single notches. On the rivista home (300 svh of S3, the rail runway, 180 vh of ink, and «la home è troppo lunga» on domus), ×0.7 would mean about 43 % more notches. It stays the B side of Q1.
- **Where.** `rv/fx-core.js:136-146`.
- **Reduced motion.** No Lenis; native scroll.
- **Pitfalls.**
  - In 1.3.x, `duration`/`easing` in the constructor silently replaces `lerp`.
  - The Lenis stylesheet's `.lenis:not(.lenis-autoToggle).lenis-stopped{overflow:clip}` outranks `rv/fx-core.css:162` (`overflow:hidden`), so `clip` applies today. Every `FX.lock` needs a release path.
  - Teleports (Ctrl+End, scrollbar drag, find-in-page) leave `animatedScroll` stale; resync.
  - A forced `ST.refresh()` during a glide cancels it and costs a 139–181 ms long task (M8b traces). Refresh only when still (`FX.whenStill`, modelled on `domus/app/lib/motion/gsap.ts:199-218`).

### R-02 · Page load, scroll restore, back/forward, hash
- **Source.** Domus 455257f with `domus/app/globals.css:239-272`. `sersan/src/components/fx/hero-intro-gate.tsx` (COLD_LOAD_RELEASE, 319b12b). In `rv`: `parts/head.html:11-49`, `fx-scroll.js:597-625`, `fx-nav.js:843-866`, `fx-core.js:301-335`.
- **Rules.**
  1. Never set `html { scroll-behavior: smooth }` (`rv/fx-core.css:159-161` complies; keep).
  2. `history.scrollRestoration` stays `auto`. The head script skips the preloader on a hash, an arrival, or `rv-intro-seen`.
  3. Reload mid-page: build → `ST.refresh()` → re-read `scrollY` one frame later and re-apply it if it moved (MQ-02) → blocks above are printed → `applyStage(p)` at the restored p → rail captions synced (MC-03).
  4. bfcache (`pageshow.persisted`): the cut runs backwards in place in 0.9 s, then `enterVisible()`. Keep.
  5. Hash on load: an immediate jump, then the target block's entrance plays.
  6. Crossing 1024 px: the place keeper. Keep.
  7. **Reduced-motion change (MC-16).** Before `location.reload()` (`rv/fx-core.js:301`), write the place keeper's anchor to `sessionStorage` (`rv-place`: section index + ratio). Boot restores it with an immediate jump. A live Lenis ↔ native swap (domus, sersan) would mean tearing down every module's films and splits; the reload plus the place is the honest, cheap path.
- **Reduced motion.** The same rules; no films.
- **Pitfalls.** A `ScrollTrigger` created while already in view never fires `onEnter` (`rv/fx-scroll.js:166-174`; the block engine must handle it). A restore that lands mid-film must pin the film's end state.

### R-03 · Preloader to hero: the counter, the sheet edge and one intro clock (DOM side only)
- **Source.**
  - `rv/fx-hero.js:43-97` (counter) and `:296-357` (exit timeline). `rv/fx-hero.css:14-60, 146-198`.
  - Lusion: real progress, never under 1 s (`sersan/docs/recon-2026-08-17/LUSION_DOSSIER.md` §3). `sersan/src/components/fx/preloader.tsx`.
  - `domus/app/lib/motion/intro-constants.ts:48-76` (`TEMPO`) and `domus/app/lib/motion/hero.ts:121-151`.
  - Sersan fafa7fe («non si vede l'animazione»: an entrance spent under a cover) and 27a4d93 (DOM text arrived while the camera still moved).
  - `taste:52` («portano un elemento dal preloader alla hero»).
- **Diagnosis (revision 2).** The measured gap between 3.14 and 3.84 s in `inv1.json` is not idle time. It is the S1 sheet lifting (from 0.15 to 1.15 on the timeline). The sheet is solid paper (`.hr-pre_sheet{background:var(--paper)}`, `rv/fx-hero.css:154`) over bare paper, with no visible edge, so the lift reads as nothing. The fix is to make the edge visible and to key the name to it. Starting the name earlier would hide it: the lockup sits at the top of the hero (`rv/fx-hero.css:18-22`), and the sheet retracts bottom-up. At 1440×900 the ALBERTO line (about 11–27 % of the viewport) is uncovered only at about 0.80 on the timeline, while chars started at 0.50 would already be past 90 % of their rise.
- **Sees.**
  1. Digits turn honestly; at 100 there is an 80 ms hold.
  2. The digits roll out upward and the rule collapses. The paper sheet lifts **with a 1 px ink hairline on its moving bottom edge**, the same edge the S4 and S5 sheets carry. The live window travels into the plate.
  3. As the edge clears each line of the name, that line rises: TUVERI first (the reveal runs bottom-up), then ALBERTO.
  4. The A lands. The label, sentence and ornament follow, then the CTA is wiped on, and **last** the nav words and the brand name.
- **The one clock (MC-01).** The `INTRO` block in `fx-hero.js` holds timeline seconds. Every DOM cue is a `tl.add(cue, t·TEMPO)` on the existing intro timeline. Each cue sets an attribute, and the CSS film keyed to that attribute starts at that instant. Values at 1440×900:

  | t (s) | Cue | Motion | Owner |
  |---|---|---|---|
  | 0 | digits, rule, meta | digits −112 % in 0.5 s io, stagger 0.04; rule scaleX 0 in 0.45 s; meta out 0.3 s (keep) | H |
  | 0 | window travel | 1.1 s `expo.inOut` (gl, untouched) | gl |
  | 0.15 | **sheet** | `.hr-pre_sheet` goes `translateY(0) → translateY(-101%)`, 1.0 s io, instead of `clip inset(0 0 100% 0)` (`rv/fx-hero.js:341`). The sheet is `inset:0 0 -1px 0` with `border-bottom:1px solid var(--ink)`, so the hairline starts just below the fold | H |
  | 0.45 | `handoff()` | `data-preloader` removed, gl z, `fx:intro:handoff` (keep) | H |
  | edge(l2) + 1 frame ≈ 0.71 | **TUVERI** | `.lk-line.l2[data-now] .ch`: `rv-rise-b`, `--d-name` 1.25 s, `--ease-out`, delay (i − 7)·0.045 | H |
  | edge(l1) + 1 frame ≈ 0.82 | **ALBERTO** | `.lk-line.l1[data-now] .ch`: same, delay i·0.045 | H |
  | 1.10 | the A lands | (gl, untouched) | — |
  | 1.15 | **said** | `data-hero-now`: label and h1 `rv-fade-up-b` 0.9 s out (h1 +0.08); ornament `rv-orn-b` 1.4 s out | H |
  | 1.25 | `FX.ready("intro")` | keep (float path; 0.95 without float) | H |
  | 1.30 | **CTA** | `.btn` `rv-wipe-b` 0.9 s io; the ghosts `rv-fade-up-b`, opacity only (P13) | H |
  | 1.40 | **chrome** | `data-hero-chrome` + `fx:intro:chrome`: nav words yPercent 110 → 0, 0.9 s out, stagger 0.06; `lang` opacity 0.25 s; brand name rises (MC-21) | H emits, N moves |

  - `edge(line)`: measure each `.lk-line` mask's top once, before the timeline is built (a read-only DOM read). Solve `1 − ease_io(u) = top / innerHeight` by bisection on `gsap.parseEase("domus.inOut")`. The cue is `0.15 + u·1.0 + 1/60`, clamped to [0.45, 1.1]. At 1440×900 this gives 0.69 + 1 frame for TUVERI (top ≈ 26 %) and 0.80 + 1 frame for ALBERTO (top ≈ 11 %). The phone gets its own values from the same formula.
  - Group starts per 0.3 s: 0–0.3 digits+rule+meta+sheet (4 is legacy, kept), 0.45–0.75 TUVERI, 0.75–1.05 ALBERTO, 1.1–1.4 said + CTA, 1.4 chrome. No 0.3 s window after the hand-off starts more than 2 groups (P7).
  - Overlap (P7): the sheet edge moves continuously from 0.15 to 1.15. The name lines start while the edge is still travelling. The said group starts while the chars are at about 35 % of their rise.
  - `TEMPO` scales the cue times, and `--tempo` scales the CSS durations (`animation-duration: calc(var(--d-name) * var(--tempo, 1))`). It does **not** scale the gl tweens, so `TEMPO ≠ 1` is a review-only knob unless Alberto also retimes the water's travel, which needs his yes.
- **Counter (MC-15, Q4).** The chase stays: `shown += (target − shown)·(1 − e^(−9·dt))`, with a **cap** at `elapsed·100` (`rv/fx-hero.js:91`; revision 1 wrongly called it a floor). The four tasks (fonts, shaders, plate, dom) run in parallel. The "open step" is the first incomplete one in `preWhat` display order (`:77`). Its band may creep by at most 1/3 of the band (8.3 points), on `(1 − e^(−t_open/0.9 s))`. The creep is labelled a visual chase, not progress. A real sub-signal (for example, a read-only count of linked pipelines, if `fx-water` exposes one) replaces the creep. The 2.6 s `counterDone` guard (`:81`) is unchanged, so LCP does not move.
- **Fallback paths (MC-01).** Every path that ends the preloader without the timeline must print the hero at once. One class does it: `html.fx-hero-print` maps the lockup chars, `[data-hero-reveal]`, `[data-hero-wipe]`, the ornament and the nav to their `-b` films with delay 0 (CSS in `fx-hero.css`, lane H).
  - The early return at `rv/fx-hero.js:308` adds the class (lane H).
  - `plainEntry` (`rv/fx-core.js:245-251`) adds it in one line (lane C). That covers `fx-static` (GSAP missing), an `intro()` rejection (`:381`) and the 6 s forced entry. At 6 s any cue that already ran has finished its film, so the delay change re-times nothing visible.
  - The head script's `--hd` under the preloader goes from 1.85 s to 5.4 s. The base film then serves only as the no-JS failsafe, and lands after the preloader's own 5.2 s failsafe (`rv/fx-hero.css:153`).
  - Specificity: the per-line rule `html.rv-motion .lk-line[data-now] .ch` must outrank the whole-lockup rules, so that a later attribute never changes the delay of a running char film.
- **Where.** `rv/parts/head.html:48`, `rv/fx-hero.js:296-357` (DOM lines only), `rv/fx-hero.css:146-198`, `rv/fx-core.css:340-349`, `rv/parts/b-hero.html`.
- **Reduced motion.** No preloader and no film; the page is printed.
- **Pitfalls.**
  - Changing `animation-delay` on a running CSS animation re-times it from its creation; it does not restart it. That is the measured rewind (h1 visible at 3078 ms, gone at 3170 ms; `inventory/desktop/flicker-2977-3078-3170.png`). Switch the animation **name**.
  - Text held hidden for more than 1 s above the fold uses `from { opacity: 0.02 }`, not 0, so Chromium keeps it as an LCP candidate (`domus/app/globals.css:1715-1740`, `domus/app/lib/motion/gsap.ts:175`). Under the solid sheet, and on paper at 0.02, it is invisible.
  - The `-b` branch carries its own delays (`rv/fx-hero.css:196-197`, `rv/fx-core.css:343`). All three change.
  - `hr-pre-out` fades the nav in 0.7 s with a 0.25 s delay (`rv/fx-hero.css:148-149`). Key it to `[data-hero-chrome]` instead.
  - Every `FX.gl` line in `intro()` stays byte-identical. The `skip()` `timeScale(3)` stays.

### R-04 · Text: masked line rise, invisible reset
- **Source.** `rv/fx-scroll.js:92-197`. `sersan/src/components/fx/heading-choreographer.tsx:38-61`; mask headroom at `sersan/src/app/globals.css:455-481`. `sersan/src/components/fx/lusion-type.ts:257-292`. `taste:62`.
- **Sees.** Titles rise line by line out of their own masks. Scrolling back up, nothing moves backwards: a block resets out of sight once it is fully below the fold, and rises again when the reader comes back down. Before a cut the lines leave upward with the page.
- **Mechanism.**
  - Split: SplitText `type:'lines', mask:'lines', aria:'none', autoSplit`.
  - Enter at `top 86%`: `fromTo yPercent 112 → 0`, `--d-title`, `--ease-out`, stagger 0.09. A lead uses 0.9 s and 0.08.
  - Reset (MC-11): a second trigger, `start:'top bottom'`, `onLeaveBack` → `gsap.set(lines, {yPercent:112})`. The block is off-screen, so there is no exit tween. Parking anywhere between 86 % and 100 % cannot flap.
  - Cut exit: −110, `--d-exit`, `--ease-in`, stagger 0.02.
  - Always `fromTo` with explicit endpoints, and a new tween per pass. A split rebuilds its tweens in `onSplit`.
- **Where.** `rv/fx-scroll.js:92-197`.
- **Reduced motion.** No split; the text is printed.
- **Pitfalls.**
  - `from` + `invalidate().restart()` re-captures the hidden pose (`sersan/src/components/fx/heading-choreographer.tsx:191-195`).
  - Masks clip Cormorant descenders and italic overshoot. Pad them 0.12 em and cancel with a negative margin.
  - `gsap.killTweensOf` strips targets (`rv/fx-scroll.js:122-123`).
  - Pre-hide with `visibility` too, so a font swap re-wraps nothing that counts (MQ-07).
  - `onSplit` writes (`G.set`, `:153-154`) and then reads `getBoundingClientRect` (`:168`) per element: one forced layout per title. Read all rects first, or rely on `st.isActive` after refresh.

### R-05 · Body type on paper: fade-ups, printed figures, strikes
- **Source.** `rv/fx-scroll.js:42-90, 217-236, 507-521`. Domus `ctn` (`domus/app/lib/motion/text-roles.ts:34-81`). `rv/fx-scroll.js:16-17`.
- **Mechanism.**
  - Fade-up: opacity 0 → 1 plus `translateY(2.5rem)` (1.5 rem below 1024), `--d-reveal`, `--ease-out`, CSS transition. An interactive member fades in place (P13).
  - Reset: when the block is fully below the fold, remove `.is-in` under `.rv-reset { transition: none }` for one frame, so it does not leave through its 0.9 s entrance transition.
  - Rises: yPercent 110 → 0, `--d-reveal`, `--ease-out`, stagger 0.05. Reset: set +110.
  - Strikes: scaleX 0 → 1, `--d-reveal`, `--ease-out`, delay 0.45, stagger 0.05, once.
  - A figure's value is final from its first visible frame.
- **Where.** The same lines; they move into the block engine (MC-10).
- **Reduced motion.** Printed.
- **Pitfalls.** `focusin` prints its block immediately (`rv/fx-scroll.js:84-87`, keep). Never hide a link container with `autoAlpha`/`visibility`: it leaves the tab order and kills the focusin net (`domus/app/lib/motion/gsap.ts:32-36`).

### R-06 · Section header block: one trigger, one ladder
- **Source.** `domus/app/lib/motion/text-roles.ts:83-101`. `sersan/src/components/fx/beat-choreographer.ts:96-120`.
- **Sees.** In each chapter, one phrase: the hairline draws left to right, the eyebrow lifts, the title lines rise, the lead follows, the figures rise.
- **Mechanism (MC-10).**
  - `data-block` on the header wrapper. One enter trigger (`top 86%`) and one reset trigger (`top bottom`, onLeaveBack). The block timeline is built **fresh at each `onEnter`**, because autoSplit replaces line elements.

    | Member | Starts at | Motion |
    |---|---|---|
    | Rule | 0 | scaleX 0 → 1, `--d-reveal` out, origin left |
    | Eyebrow | 0.10 | fade-up (opacity only if it holds a link) |
    | Title | 0.15 | lines |
    | Lead | 0.35 | lines 0.9 / 0.08 |
    | Rises | 0.45 | rise |
    | Body | 0.50 | fade-up; links opacity only |

  - Rows (`.metric`, `.cap`, `.tl-row`): one row-level trigger folds rule, rise and bars together (today each `.metric` has three: `:209`, `:226`, `:293`). Batched with `ScrollTrigger.batch(rows, {start:'top 90%', interval:0.1, batchMax:4})`, rows staggered by `--st-block`. Inside a row: rule 0, rise 0.1, bars 0.15 (`--d-travel` out), reveal 0.2.
  - Ledgers trigger on `.sc-ledger`, never on the sticky head (`rv/fx-scroll.css:191`).
  - The 2.5 s failsafe (`rv/fx-scroll.js:182-186`) covers every member kind, not only `[data-lines]`.
  - A/B switch: **`?blocks=1`**, read in `fx-scroll` init. Never `?fx=blocks`: `fx` is core's module allowlist (`rv/fx-core.js:181-185, 213`), so it would turn every other module off. Add `blocks` to `KEEP` (`rv/fx-core.js:89`) so the switch survives links.
- **Where.** `rv/fx-scroll.js:42-300`; `data-block` in `rv/parts/c-main.index.html`, `c-main.case.html`, `c-footer.html`.
- **Reduced motion.** Nothing is armed.
- **Pitfalls.**
  - Create triggers top to bottom, or set `refreshPriority`. Keep the `fx:ready` gate (`rv/fx-scroll.js:673-676`).
  - Never put `data-block` on `.band`, `.band-copy`, `.hr-plate` or any gl-host ancestor (P14). The band eyebrow becomes line-masked or opacity-only.
  - The ink screen is its own recipe.

### R-07 · Filled buttons and the CTA: wipe, never fade
- **Source.** `CLAUDE.md` §2. `rv/parts/b-hero.html:49-50`, `rv/parts/c-main.case.html:9`, `rv/fx-scroll.js:558-576`, `rv/fx-scroll.css:317`, `rv/fx-hero.js:212-225`. The emil-design-eng clip reveal. `sersan/src/components/navbar.tsx:866-950`.
- **Sees.** The cobalt button is laid down left to right like ink. Its label is fully opaque whenever it is visible. It leaves by being wiped off to the right. The ghost links beside it fade on paper.
- **Mechanism (MC-05).**
  1. **Move the reveal off the wrappers.**
     - Hero: `data-hero-reveal` moves from `.hero-cta` to `.ghosts`, and the `.btn` gets `data-hero-wipe`.
     - Case: `data-reveal="hero"` moves from `.cta-row` to its ghost link, and the `.btn` gets `data-wipe`. `rv/fx-scroll.css:317` hides `[data-wipe]` with `clip-path: inset(0 100% 0 0)`, not opacity.
  2. **Enter.** `clip-path: inset(0 100% 0 0) → inset(0 0 0 0)`, `--d-reveal`, `--ease-io`. CSS `@keyframes rv-wipe`/`rv-wipe-b` with `animation-fill-mode: backwards`, so no clip remains at rest. GSAP paths use `clearProps: "clip-path"`.
  3. **Exit** (cut, S3). `inset(0 0 0 100%)`, `--d-exit`, `--ease-in`. `exitVisible` (`rv/fx-scroll.js:564, 575`) wipes `[data-wipe]` and fades the rest.
  4. **S3.** `.hr-act` gets `data-fade="wipe"`. In the DOM `fades` loop (L214-225 only): the translate stays on `.hr-act`; opacity is written to its non-`.btn` children; `.btn` gets `clip-path: inset(0 0 0 ${100·f}%)`. `tabindex −1` stays keyed on f > 0.98.
- **Where.** `rv/fx-core.css` §6 (`.btn`, L279-305) and §8 (L340-349, the keyframes), `rv/fx-hero.css:193-198`, `rv/parts/b-hero.html:49-50`, `rv/fx-hero.js:212-225`, `rv/fx-scroll.js:52-61, 558-576`, `rv/fx-scroll.css:317`, `rv/parts/c-main.case.html:9`.
- **Reduced motion.** Printed.
- **Pitfalls.** A clip left at `inset(0)` clips the 2 px focus outline at offset 3 px (`rv/fx-core.css:181`); hence `backwards` and `clearProps`. Hover fill and press are in R-15.

### R-08 · Plates: straight curtain and settle
- **Source.** `rv/fx-scroll.js:238-283`. The awwwards-animations image reveal. `rv` FIX J8.
- **Sees.** The plate opens from its bottom edge upward, like a sheet being uncovered. The capture settles by a few percent after the edge has landed.
- **Mechanism (MC-18).**
  - Figure clip `inset(100% 0 0 0)` → `inset(0)`, `--d-travel` 1.1 s, `--ease-io`. Today it is 1.4 s expo.out: 80 % of the travel happens in the first ~0.3 s, a snap and then a crawl.
  - The settle stays on the **img**: scale 1.08 → 1, `--d-media`, `--ease-out`, from 0 (today 1.15 over 1.6 s, `rv/fx-scroll.js:251, 254`). `.frame-inner[data-parallax]` belongs to `buildParallax` (`:274-277`), so it never takes a second owner.
  - Trigger `top 88%`, once; skip `[data-nv-arrived]`.
- **Lama (MC-19, Q7, default off).** A slanted leading edge that straightens (`domus/app/lib/motion/lama.ts:17-60`) is domus's signature image move (Alberto A36), so on the portfolio it risks reading as the client site. It ships only if Alberto picks it over the straight curtain in a side-by-side.
- **Reduced motion.** Printed.
- **Pitfalls.** The IO watches the figure, not a host inside a clip (`rv/fx-hero.js:185-186`). Above about 1.5× scale, 1280 px rasters show blocks (`refs/DOSSIERS.md:63-81`).

### R-09 · The work rail
- **Source.** `rv/fx-scroll.js:302-455`, `rv/fx-scroll.css:61-168`. `domus/docs/effetti-reference.md` §2.10 («il moto segue il dito, i contenuti no»; «senza la zona morta il pin scatta»), `domus/app/components/motion/HorizonScroller.tsx:332-333`.
- **Sees.** The rail sticks in the centre while vertical scroll moves the track. Tiles unroll once, like a proof sheet. Captions rise as their tile passes 90 %. The 01/09 index rolls in its mask. Hover zooms the capture 4 %, turns the figure rule cobalt, and rolls the caption's verb in place (R-16).
- **Mechanism.**
  - Keep: track x with `ease "none"`, scrub 0.6; pans xPercent ±2.5.
  - **Dead zone (MC-29).** The runway starts 2.5 % of its height after `top <top>px`, and ends 2.5 % before its end (`rv/fx-scroll.js:390-391`), so the stick never snaps on entry or exit.
  - Unroll: `inset(0 0 100% 0)` → 0, `--d-travel`, `--ease-out`, stagger 0.08, `top 82%`, once.
  - Captions: y 26 and opacity 0 → 1, `--d-reveal`, `--ease-out`, stagger 0.05 at 0.1, `left 90%` on the containerAnimation. Leave-back plays the reverse at timeScale 2.5. Captions sit on paper, never over a photograph.
  - Index digits: yPercent −10·d, `--d-roll`, `--ease-out`.
  - Tile hover: `.tile-zoom` scale 1.04, `--d-zoom` 0.6 s, `--ease-out`, the same on hover out; gated by `(hover:hover) and (pointer:fine)` (today ungated at `rv/fx-scroll.css:75`, so it sticks after a tap).
  - The phone rail keeps native CSS scroll-snap.
  - Fixes: MC-02, MC-03.
- **Refused.** A floating hover-preview image over a text list (`06` filter 3).
- **Reduced motion.** A 3-column index (`rv/fx-scroll.css:151-160`), no pan.
- **Pitfalls.**
  - MQ-13: `@property --rail-p` with `inherits:false`.
  - The keyboard fix must not fire on mouse focus: Chrome focuses the anchor on mousedown (+992 px in `inv4`).
  - The DESK matchMedia's `refresh` listener (MC-03) is removed on revert (`rv/fx-scroll.js:429-439`).

### R-10 · S4 "Stacco": tile to case (forward)
- **Source.** `rv/fx-nav.js:350-471, 629-760`. `sersan/src/components/fx/flip-handoff-overlay.tsx:17-95`. `sersan/src/app/template.tsx:62-216`. `refs/hero-water/06-liquid-effects-shortlist.md:295-333`.
- **Sees.** On a click the visible type leaves upward, and the neighbour tiles roll up. A paper sheet with a 1 px ink hairline edge rises from the bottom. The capture travels into the case hero's rect. The case paints the same frame, its title and lead rise, and the image lands **once**, in one continuous move.
- **Mechanism.**
  - Keep: exits `--d-exit`; neighbour roll `inset(0 0 100% 0)` `--d-wipe` io, stagger 0.04 from the tile index; image rect over `--d-travel` io; commit at 0.8 s, deadline 1.5 s; decode raced against 900 ms, then 2 rAF after `painted()`; data URL < 160 KB; prefetch on pointerover/focusin.
  - **MC-04, no ghost.** The source `.tile-media` gets `visibility:hidden` after `imgTag.decode()` + 1 rAF (still before 0.5 s; at t = 0 the overlay covers it exactly). Restore it in `clearOverlays()` (covers `reset`, `onResize`, `arrive`) and at the end of the `onPageShow` reverse.
  - **MC-07, one move on one clock.**
    - The record carries t_c (the committed fraction, 0.8/1.1 = 0.727, at 94.1 % of the travel on `domus.inOut`) and the committed rect.
    - The continuation starts **at first paint**. The head script (`rv/parts/head.html:29-38`) reads the destination rect from `localStorage` `rv-hero-rect|<path>|<v>|<W>x<H>` (`rv/fx-nav.js:55`) and writes `--pt-to-*`. `.nv-img` then transitions clip-path and transform over `(1 − t_c)·1.1 s` with a CSS `linear()` easing sampled (16 points) from `domus.inOut` on [t_c, 1]. The travel continues on its original curve instead of restarting on a new one.
    - After decode + 1 rAF, JS measures the real rect. If it differs, only the endpoint is re-pointed: the remaining frames interpolate from the committed start to the measured rect on the same eased clock. Above 40 px, the 0.25 s dissolve stays.
    - Without a stored rect (a first visit), the landing uses the same `linear()` continuation from boot.
  - **MC-12.** The sheet becomes `translateY(101%) → 0` with `border-top:1px solid var(--ink)`, shared with S1 and S5. Convert every clip site: `rv/fx-nav.js:466, 514, 657, 756, 864`, the `clearProps` at `:575` (add `transform`), `rv/fx-nav.css:225`, `rv/fx-scroll.css:312`. The back direction toggles `border-bottom`. A composited transform replaces a full-viewport clip-path repaint. Keep emitting `fx:nav:covered`/`uncovered` (they pause the water, `rv/fx-water.js:840-848`).
  - The case CTA wipes (MC-05); the ornament starts with the title (MC-22).
- **Where.** `rv/fx-nav.js:350-471, 629-760`, `rv/fx-nav.css:202-233`, `rv/parts/head.html:29-38`.
- **Reduced motion.** The overlay is set at the target; the sheet fades over `--d-rm`; then commit.
- **Pitfalls.** "complete" is not "painted". The travelling image is the uncropped cover at the capture's own aspect. The sheet is a sibling, never an ancestor, of fixed elements. The forward cut calls `finish()` mid-travel (`rv/fx-nav.js:710`): the `fx:ready` refresh must not run then (MC-31).

### R-11 · S4 back cut: case to its tile, same rail frame
- **Source.** `rv/fx-nav.js:473-520, 653-749`, `rv/fx-scroll.js:597-629`.
- **Sees.** "Back to the index": the type leaves, a sheet drops from the top, and the hero slice travels back into its tile at the rail frame the reader left. The neighbours unroll around it while the captions, work head and header arrive. There is never a moment of a lone tile on bare paper.
- **Mechanism (MC-08).** `enterVisible()` does nothing on a fresh document (`exited` is null, `rv/fx-scroll.js:38, 581-582`), so the arrival instead:
  1. calls `railApi.sync()` (MC-03), so the captions match the rail frame;
  2. starts the neighbour unroll right after `rv/fx-nav.js:703` (`--d-wipe` io, stagger 0.04 from the index);
  3. calls `finish()` (hence `FX.ready`) at t0, as the forward cut does (`:705-711`);
  4. removes `is-hidden` from the header on arrival (the first tick at y > 360 hides it, `:139`).
  - Keep: sheet 0.5 s, travel `--d-travel`, commit 0.75, the ≥ 20 %-visible rule, origin < 10 min, same viewport. MC-07 applies (24.5 px drift today).
- **Reduced motion.** The back cut is off; the S5 opacity path is used.
- **Pitfalls.** `restore()` maps y to the rail frame the reader saw, scrub lag included. `snapScrubs()` calls `progress(1)` on every scrub.

### R-12 · S5 "Tendina": one paper sheet with a hairline edge (MC-12, Q3)
- **Source.** Today `rv/fx-nav.js:299-348`: 10 columns centre-out, which read as a bar chart (`inventory/desktop/sheet-16-cols-forward.png`). `sersan/src/components/navbar.tsx:245-610` and `template.tsx:62-216` (one sheet: cover 0.38, hold 0.12, lift 0.62; one continuous upward gesture; failsafe 1.2 s). Era's barba fade is refused.
- **Sees.** A paper-deep sheet rises over the old page with a 1 px ink hairline on its top edge. The destination name rises in its mask on the sheet. The same sheet keeps going up and leaves through the top while the new title is already rising.
- **Mechanism.**
  - Cover: `translateY(101%) → 0`, `--d-wipe` 0.5, `--ease-io`. Label yPercent 112 → 0, `--d-reveal`, `--ease-out` at 0.25; sub at 0.35. Commit at 0.7 (keep).
  - Uncover: label −112, `--d-exit`, `--ease-in`; sheet `0 → −101%`, `--d-wipe` io at 0.1. `finish()` at 150 ms (keep). The uncover uses its own pair (P2).
  - Back: mirrored. Deadline 1.3 s (keep).
- **Where.** `rv/fx-nav.js:299-348`, `rv/fx-nav.css:181-200`, `rv/parts/a-overlays.html`.
- **Reduced motion.** Root opacity 0 → 1 over `--d-rm`, linear (keep).
- **Pitfalls.** On arrival the sheet paints covered from the first frame (keep). The cover mark copies `.hdr .mark` (`rv/parts/a-overlays.html:17-19`); both headers have it (`rv/parts/a-header.case.html:4`). Revision 1 said the case had none; that was wrong.

### R-13 · Header, nav, section dash, AT ring
- **Source.** `rv/fx-nav.js:88-183`, `rv/fx-nav.css:11-67`. `sersan/src/components/navbar.tsx:645-730`. Domus `RotatingMark.tsx`/`mark.ts` is **not** a source any more (see the refused list).
- **Mechanism.**
  - The position is read per tick (keep).
  - Solid past 24 px: background over `--d-micro` soft; the hairline `::after` draws over `--d-wipe` out.
  - Hide past 360 px going down (4 px hysteresis): `translateY(-101%)`, `--d-wipe` io. Always hidden over the S3 plate (keep).
  - Section dash: scaleX, `--d-roll` out.
  - Word roll: ±100 %, `--d-roll` out, fine pointer only. Informative variant in R-16.
  - Nav at the intro: on `fx:intro:chrome` (R-03), not on the hand-off. yPercent 110 → 0, `--d-reveal` out, stagger 0.06.
  - **Ring (MC-13, Q2), default (c), an honest dial.** rotation = page scroll progress × 360°, written only in the Lenis `scroll` handler (Lenis emits it for native touch scroll too), `ease "none"`. No velocity boost and no cut spin. At rest nothing writes. The S5 cover copy is static. Option (a) is a static ring.
- **Reduced motion.** A static ring. Hover shows an underline; the twin label is hidden.
- **Pitfalls.** `ringSlow()` is called from `reset`, `finish` and the switcher (`rv/fx-nav.js:97, 586, 641, 907`); all four go.

### R-14 · Mobile menu
- **Source.** `rv/fx-nav.js:185-250`, `rv/fx-nav.css:69-131`. `sersan/src/components/navbar.tsx:84-96, 866-950` (open and close are different gestures, each interruptible).
- **Mechanism.**
  - Open: 5 columns (the menu always has 5), yPercent −101 → 0, `--d-wipe` io, stagger 0.03 from `"end"`. Q3 asks whether to flatten the stagger to ≤ 0.015 s, or to use the one-sheet drop with a hairline edge. The same bar-chart critique applies here as to S5.
  - **MC-06.** JS writes `menu.style.setProperty('--covered', covered + 's')`, with `covered = 0.45 + 4·0.03 = 0.57 s` (0.62 s after MC-09). CSS uses `calc(var(--covered) + var(--k)*0.06s)` for `.mi` and `li::after` (`rv/fx-nav.css:110, 115`). Today the type is at 0.40 s, 170 ms early.
  - Close: type off over `--d-press`; columns to −101 over `--d-exit` io, stagger 0.02 from `"start"`, delay 0.08 (close 0.7× open, P2).
  - `FX.lock('menu')`, inert chrome, focus trap: keep. `fx:lock` with reason `menu` pauses the water; keep emitting it.
- **Reduced motion.** Opacity over `--d-rm`, linear.
- **Pitfalls.** Release the lock on close, on crossing 1024 px (keep) and on navigation.

### R-15 · Hover and focus micro-interactions
- **Source.** `rv/fx-core.css:279-305`, `rv/fx-nav.css:144-179`, `rv/fx-scroll.css:263-300, 347-351`. `domus/app/globals.css:1166-1176`. emil-design-eng (press 0.97–0.98; hover gated; never animate what the keyboard triggers).
- **Mechanism (MC-17).**
  - **Links.** A text link's rule redraws scaleX 0 → 1 from the left, `--d-hover` soft, and leaves from the right. A ghost link's ink `::before` retracts right while its cobalt `::after` draws from the left (+0.08 s), both `--d-hover` soft; colour to cobalt over `--d-hover`.
  - **Buttons.** `.btn` fill `::before`: `inset(0 100% 0 0) → 0`, `--d-hover`, `--ease-out`. The arrow exits top-right and re-enters bottom-left inside its own mask, `--d-hover`, `--ease-io` (today the `nv-arrow` keyframes fade an icon on cobalt through opacity 0, `rv/fx-nav.css:158-163`). `:active` scale 0.98 over `--d-press`.
  - **Email in the band.** The ghost underline swap only. No magnet.
  - **Next-work link.** Colour over `--d-hover`; arrow translateX 0.12 em over `--d-hover` soft, gated (today ungated, `rv/fx-scroll.css:350-351`).
  - **Focus.** `:focus-visible` is a 2 px accent outline at offset 3, **instant**. Every hover affordance also fires on `:focus-visible`. Every hover *transform* sits inside `@media (hover:hover) and (pointer:fine)`.
- **Reduced motion.** Colour only; lines appear at once.
- **Pitfalls.** No `transition: all`, no transition on `outline`.

### R-16 · Cursor: native only; the verb rolls in place
- **Source.** The label cursor (`rv/fx-nav.js:252-282`) and both magnets (`rv/fx-nav.js:284-297`, dead fallback; `rv/fx-scroll.js:523-550`, `[data-magnetic]` at `rv/parts/c-main.index.html:244`) are removed. Reasons:
  - P9 and `taste:54`: text moving with the cursor;
  - the domus client rejected both followers and magnets (`domus/docs/wow-layer-plan.md:67-74`);
  - 3 of the 4 award references have no custom cursor, and the slot is intentionally empty (`refs/hero-water/06-liquid-effects-shortlist.md:374-381`);
  - its 0.15 s opacity fade crosses photographs on the rail (P3);
  - tiles stacked three hover affordances;
  - the magnet moved an element that the water reads as an obstacle (P14).
- **Replacement (MC-26), the informative roll.** This is the one award-reference trait never shipped (`wow-roadmap-references.md:10`). Two stacked labels in a clip box: the caption's index or kind ("02 · Selected work") and the verb ("Open", "Visit", "Next"). On hover or `:focus-visible` the pair moves translateY −100 %, `--d-roll`, `--ease-out`; it rolls back on out. It sits on paper, inside its own box.
- **Reduced motion.** The verb is printed after the label, with no roll.
- **Refused.** Every follower (dot, ring, label, particle, blend blob), `cursor:none`, snapping, magnets.

### R-17 · Scroll choreography rhythm
- **Source.** `loops/awwwards-loop/STATE.md:16-18, 26-28`. `domus/docs/wow-layer-plan.md:6-9` (one signature per viewport). `domus/app/components/Posizionamento.tsx:104-127`. `taste:51,54`.
- **Map (home).**

  | Chapter | Scroll-linked move | Status |
  |---|---|---|
  | Hero S3 | sticky 300 svh, scrub 0.5 | accepted, untouched |
  | Now | plate parallax | keep; **no drift** (it rises over the pinned water plate) |
  | Work | rail runway + head counter-parallax, scrub 0.25 | keep, plus the dead zone |
  | Measured | ink, sticky 180 vh, scrub 0.6 | keep |
  | Ledgers / Caps | triggered only | — |
  | Path | **stair drift** | new |
  | Contact band | the water arrives once | — |
  | Footer | — | — |

- **Rule.** Each chapter owns at most one scroll-linked move and one set of triggered reveals. No viewport holds two scroll-linked moves.
- **Stair drift (MC-20, Path only).** The **mask wrappers** drift, never the split lines (a moving line crops glyphs at the mask's edges). Line 1 −24 → +24 px, line 2 +24 → −24 px, line 3 −12 → +12 px at ≥ 1024; ±8 px below. `ease "none"`, scrub 0.25, `top bottom` → `bottom top`. The section gets `overflow-x: clip`. The drift is created inside `onSplit` and killed on each re-split, like the counter case (`rv/fx-scroll.js:158-164`).
- **Optional (MC-30, A/B).** A velocity-modulated title reveal: with `f = clamp(|v|/45, 0, 1)`, yPercent ×(1 + 0.18f), duration ×(1 − 0.12f), stagger ×(1 + 0.55f) (`sersan/src/components/fx/heading-choreographer.tsx:52-54, 242-282`). It would be the only velocity-linked element. It ships only if Alberto's eye prefers it.
- **Reduced motion.** None.
- **Pitfalls.** A climax peaks on content, never on an empty screen. S3 is not re-choreographed.

### R-18 · Closing band and footer entrance
- **Source.** `rv/fx-hero.js:158-182` (band mount, off-limits). `rv/fx-water.js` L32-37 (BAND_ENTER_RATIO 0.3, off-limits).
- **Sees.** When 30 % of the band is visible, the drops arrive (the water's own behaviour), and "Write to me." rises in its line masks on the same beat. The email draws its rules. Footer rows rise with their hairlines.
- **Mechanism.** The band title triggers at `top 70%`, the same geometry as the water's arrival. Nothing listens to or calls the engine. Band members keep their boxes still: line masks for the h2, opacity only for the eyebrow and the email (P13, P14). The footer uses the block engine (rows batched at `top 90%`).
- **Reduced motion.** The engine's own still; the type is printed.

### R-19 · Anchor glide
- **Source.** `rv/fx-nav.js:777-789`, `rv/fx-core.js:143-146`. `sersan/marketing/03-channels/site-showcase.md` §7.5.
- **Mechanism (MC-14, MC-24).** `easing: gsap.parseEase("domus.inOut")` (`CustomEase.get` is not guaranteed to return a function); 1.1 s for |Δ| ≤ 1.5·innerHeight, otherwise 1.4 s. If the path crosses the S3 stage or the rail runway, jump immediately, then `ST.update()` and snap the scrubs (expose `snapScrubs` from `rv/fx-scroll.js:598-603`, or call `FX.scroll.restore`), so the S3 lockup and the rail do not rewind on screen for 0.5 s. Never `ST.refresh` here. The destination block's entrance plays. Focus moves to the target (keep).
- **Reduced motion.** Immediate.

### R-20 · Postcard close (MC-27, P2)
- **Source.** `domus/app/components/Congedo.tsx:52-54` (sides lg t8/r22/b8/l22 %, tablet 4/14, phone 4/10), `:277-278, 298-303` (scrub 0.9); `dtCartolina` = (0.45,0,0.15,1) at `domus/app/lib/motion/gsap.ts:132-134`. Alberto asked for it twice (A53, A79 «si deve chiudere prima»).
- **Sees.** On the case page, as the reader scrolls past the full-bleed capture (`figure.media-full`, `rv/parts/c-main.case.html:14`), the image draws in to a framed postcard on paper with straight edges, and the text continues below it.
- **Mechanism.** Scrubbed `clip-path: inset(t r b l)` on `.frame[data-case-hero]` from 0 to the sides above, eased `dtCartolina` inside a scrub of 0.9. The trigger runs from `top top` to `bottom 40%`. It is armed only if the page left below the figure is ≥ 25 % of the viewport (the taste critic's reading of domus; verify at build). **One move per viewport:** the case hero's `data-parallax` is removed. The S4 landing pose is re-measured, because the arrival rect changes when the inner has no parallax offset.
- **Reduced motion.** None; the image stays full-bleed.
- **Pitfalls.** The clip starts only after the S4 arrival has landed (`[data-nv-arrived]` clears first).

### R-21 · Language swap (MC-28, deferred until IT ships)
- **Source.** `sersan/src/components/language-provider.tsx:36-40` (dim 0.35 in 0.15 s, swap, rise in 0.2 s). The rivista header prints «Italian version coming» today (`rv/parts/a-header.index.html:11`).
- **Mechanism.** One designed beat. Type on paper dims to 0.35 over 0.15 s (`--ease-in`). Then the strings swap, and every SplitText instance reverts and re-splits (autoSplit, or `revert()` plus a new split). Then type rises back to 1 over 0.2 s (`--ease-out`). Filled buttons are never dimmed (P3): their labels swap under a 0.2 s wipe. ScrollTrigger refreshes once, via `FX.whenStill`.
- **Reduced motion.** An instant swap.

---

## 5. Refused list

| We do not take | Seen in | Why not |
|---|---|---|
| Curved, noise or liquid masks: circle reveals, noise frontiers, metaball tears, liquid dissolves, era's arch window | `refs/r3f-image-reveal-effect`, `refs/threjs-metaballs-carousel`, `refs/Liquid-Morphology-Slideshow` (`refs/DOSSIERS.md:235-406`); `ERA_DOSSIER` §3 | Curves are banned (`domus/app/lib/motion/clip.ts:44-58`). Noise is «troppo artificiale» (`taste:39`). |
| Blur, cross-blur, filter transitions | transitions.dev blur tokens; sersan beat exit blur 6 px | A veil on type, and GPU cost on large layers (`refs/DOSSIERS.md:138-139`). |
| Scramble/decode labels and slot-machine rolls on words | `sersan/src/components/fx/label-scrambler.tsx`, `roll-letters.tsx` | «orribili» (`taste:33`). The rail's two-digit index roll stays: a printed counter in its mask. |
| Per-letter flip titles (rotateY 90) | `domus/app/lib/motion/text-roles.ts:34-81` | Domus's signature; the portfolio uses a clean line mask (`taste:62`). Per-char motion stays on the name only. |
| Count-up numbers | Magic UI number-ticker; `sersan/src/components/ui/count-up.tsx` | Honest figures are printed final (`rv/fx-scroll.js:16-17`). |
| Velocity skew, stretch or deformation of type | LA MAREA (`ANIMATION_PLAN.md:21-25`); `sersan/src/components/sections/fit-section.tsx:89-90` | Not a Lusion trait. The only candidate velocity link is MC-30, and that is optional. |
| JS snap, scroll-jacking, GSAP pin | `sersan/src/lib/scroll-snap.ts:64-104` | The reader owns the page; set pieces are sticky corridors. Native CSS scroll-snap on the phone's horizontal rail is allowed. |
| Elastic, back and overshoot eases | `sersan/src/components/ui/magnetic.tsx`; transitions.dev bounce | A calm magazine never bounces a close. |
| Every pointer follower, including the label cursor; `cursor:none` | `rv/fx-nav.js:252-282` (removed); `sersan/src/components/fx/custom-cursor.tsx`; domus dot+ring | P9; the domus client's rejection; the empty cursor slot (`06:374-381`). |
| Magnets and pointer forces | `rv/fx-scroll.js:523-550`, `rv/fx-nav.js:284-297` (removed); `sersan/src/components/ui/magnetic.tsx` | «pointer as a light, not a force»; rejected by the domus client; it moved a water obstacle. |
| A rotating brand mark: perpetual, velocity-boosted or spinning during cuts | `domus` `RotatingMark.tsx`/`mark.ts` («il cuore deve ruotare in senso orario»); `rv/fx-nav.js:88-111` | It is a real-estate brand gesture, and a 240°/s cut spin is a loading-spinner cliché. The ring is a dial or static (Q2). |
| Card tilt and glare; hover-preview images; RGB split | `sersan/src/components/fx/card-tilt-controller.tsx` | Cards are banned, hover-reveal is the category rut, fringes are a recorded dislike (`taste:37`). |
| Glitch ticks, chromatic fringes, luminous edges | `sersan/src/components/fx/cut-tick.module.css` | «niente transizione glitch» (fafa7fe); Alberto turned the edge glow off (2e61dbd). |
| Fake progress, fixed-timer preloaders | era's fake 4 s line (`refs/DOSSIERS.md:459-464`) | S1 stays honest. The creep is capped at 1/3 of an open band and labelled a chase (Q4). |
| A DOM frame around the water during the pour | revision 1's MC-23 | Alberto approved the pour's composition as is (spec §9.7–§9.8), and R1 removed every box around the water (`rv/fx-hero.css:56`). Moved to Q6. |
| The lama as the default plate reveal | `domus/app/lib/motion/lama.ts` | Domus's signature image move; brand-identity risk. Q7 only. |
| UI sound | `sersan/src/lib/audio/uiSounds.ts` | Out of scope. |
| Perpetual decorative motion | `domus/app/components/motion/FotoSlide.tsx` | WCAG 2.2.2 and P10. |
| A second renderer for a transition | Lusion paper fold (`domus/app/lib/motion/lastra.ts`) | One GL canvas per page (`taste` §4.1). |
| Telescope stacks and 6.7× dollies | `refs/telescope-zoom` | Busy, blur cost, and raster blocks above 1.5×. |
| Whole-page fades | era barba fade 0.8 s | A navigation is an edit (`rv/fx-nav.js:4-14`). |
| `html{scroll-behavior:smooth}`; `duration`/`easing` in the Lenis constructor | domus 455257f | It breaks the native restore, and it silently disables `lerp`. |
| Re-choreographing S3, the pour or the band arrival; any write to `FX.gl`; retiming the gl travel through `TEMPO` without Alberto | — | Accepted by Alberto (`30-hero-build-spec.md` §9.5–§9.8). |

---

## 6. Backlog

**How to verify.**
- Headed real Chrome (`channel:"chrome"`, WebGPU), window in the foreground.
- Server: `python -m http.server 5178` in `public/`, then `http://localhost:5178/proto/rivista/index.html` and `case.html`.
- Clear `sessionStorage` for the intro.
- Viewports: 1440×900, and 390×844 at DPR 2, with a clean console.
- Strips go to `_shots/rivista-motion/<id>/`. Probes live in `scripts/probes/rivista-motion/`: `strip.mjs`, `tokens.mjs`, `blocks.mjs`, `idle.mjs`, `restore.mjs`, `rhythm.mjs`, and `effop.js` (effective opacity).
- Headless cannot judge feel: Alberto watches every P0 and P1 live.
- The lab runs on `python http.server` (no compression, no h2), so the gl-off Lighthouse 0.74–0.76 is partly the environment. Compare before and after on the same setup.

| ID | P | Title | Lane | Depends on | Risk |
|---|---|---|---|---|---|
| MC-01 | P0 | One intro clock: sheet edge, name per line, chrome last | H (+ one line in C) | P | med |
| MC-02 | P0 | Rail focus jump on mouse click | S | — | low |
| MC-03 | P0 | Captions lost after the back cut | S | — | low |
| MC-04 | P0 | S4 ghost double image | N | — | low |
| MC-05 | P0 | Filled buttons wipe, never fade (wrappers fixed) | H → S | P (effop) | low–med |
| MC-06 | P0 | Menu type shows over the page | N | — | low |
| MC-07 | P0 | S4 arrival: one move on one clock | N | MC-31 | med–high |
| MC-08 | P0 | Back arrival without bare paper | N | MC-03, MC-31 | low–med |
| MC-31 | P0 | No `ST.refresh` long task mid-cut | S | MC-09a (`FX.whenStill`) | low |
| MC-09a | P1 | Tokens, additive half | C | — | low |
| MC-10 | P1 | Block engine, `?blocks=1` | S | MC-09a, MC-11 | med–high |
| MC-11 | P1 | Invisible reset with hysteresis | S | — | low |
| MC-12 | P1 | One sheet grammar for S4 and S5 | N | S edits `fx-scroll.css:312` | med |
| MC-13 | P1 | The ring becomes a dial (Q2) | N | — | low |
| MC-14 | P1 | Lead clamp and anchor easing (Q1) | C | — | med |
| MC-15 | P1 | Counter creep ≤ 1/3 band (Q4) | H | MC-01 | low |
| MC-16 | P1 | Restore suite, plus place across the RM reload | P (+ C for the reload) | all P0 | low / unknown |
| MC-26a | P1 | Remove the label cursor and the fallback magnet | N | — | low |
| MC-26b | P1 | Remove `[data-magnetic]`; informative verb roll | S | — | low |
| MC-17 | P1 | Hover and focus audit | serial, last | all lanes | low |
| MC-09b | P1 | Token sweep and `tokens.mjs` gate | serial, last | all lanes | med |
| MC-18 | P2 | Plate curtain v2 | S | MC-10 | low |
| MC-19 | P2 | Lama, A/B only (Q7) | S | MC-18 | low (taste) |
| MC-20 | P2 | Stair drift on Path, plus the rhythm probe | S | MC-10 | low |
| MC-21 | P2 | Brand name and nav on the chrome cue | N | MC-01 (the event) | low |
| MC-22 | P2 | Case arrival order | S | MC-05 | low |
| MC-24 | P2 | Anchor jumps across sticky stages | N | MC-14 | low |
| MC-25 | P2 | Head weight: inline `lenis.css`, drop Flip, preconnect, concat CSS | C | — | low |
| MC-27 | P2 | Postcard close on the case capture | S | MC-07 | med |
| MC-28 | P2 | Language swap recipe (when IT ships) | S | IT copy | low |
| MC-29 | P2 | Rail runway dead zone | S | — | low |
| MC-30 | P2 | Velocity-modulated titles, A/B only | S | MC-10 | low (taste) |

Revision 1's MC-23 (a DOM frame around the S1 window) left the backlog; it is now Q6.

### P0 · makes it feel professional now

**MC-01 · One intro clock.**
- **Spec.** R-03, entirely:
  1. The S1 sheet becomes a translate with an ink hairline on its moving bottom edge.
  2. The `INTRO` block is scaled by `TEMPO`, and every DOM cue is a timeline cue.
  3. `handoff()` no longer rewrites `--hd` (delete `rv/fx-hero.js:300-301`).
  4. `.lk-line[data-now]` is set per line from the solved edge time; `data-hero-now` at 1.15; the CTA at 1.30; `data-hero-chrome` + `fx:intro:chrome` at 1.40.
  5. The `-b` delays are rewritten (`rv/fx-hero.css:196-197`, `rv/fx-core.css:343`), with 0.02 as the hidden opacity.
  6. `--hd` under the preloader is 5.4 s (`rv/parts/head.html:48`).
  7. The fallback paths are covered by `html.fx-hero-print` (the L308 early return in H; `plainEntry` in C covers `fx-static`, an `intro()` rejection and the 6 s force).
- **Reduced motion.** No preloader; printed.
- **Acceptance.** `strip.mjs` from counter = 100 to `fx:ready` + 1 s, at 1440 and 390:
  1. each lockup line's mask area is fully uncovered ≥ 1 frame before its first `.ch` moves, and ≥ 80 % of each char's rise travel falls in visible frames;
  2. the sheet hairline is visible in every frame from 0.15 to 1.15;
  3. h1 opacity never decreases (the 3078 → 3170 ms drop is gone);
  4. no interval > 150 ms after 0.15 with no visible edge or type moving;
  5. no 0.3 s window after the hand-off starts more than 2 motion groups;
  6. the nav words' first frame is ≥ 0.25 s after the A lands;
  7. `?tempo=2` doubles every DOM cue and CSS duration, and leaves the gl travel untouched.

  Fallbacks: with `fx-hero.js` blocked, the name is visible by 6.7 s. With GSAP blocked (`fx-static`) and with a forced plain entry, it is visible within 1 frame of the preloader's removal. Re-run the gl-off Lighthouse probe; LCP may move.

**MC-02 · Rail focus jump.** The first line of `onFocus` becomes `if (!e.target.matches(':focus-visible')) return;`. *Acceptance:* a mousedown + mouseup on tile 02 gives ΔscrollY = 0 and navigation starts. Tabbing to tile 05 lands it fully in view.

**MC-03 · Captions after the back cut.** Keep each tile's `{tl, st}` in `railApi`. `railApi.sync()` sets `tl.progress(st.isActive || st.progress > 0 ? 1 : 0)`. Call it at the end of `restore()` and on the ScrollTrigger `refresh` event; remove that listener in the DESK revert (`rv/fx-scroll.js:429-439`). *Acceptance:* in `inv3` `capsAfterBack`, every caption left of 90 % has opacity 1 and transform none. Re-shoot `14-home-after-back.png`.

**MC-04 · No ghost image.** R-10: hide after decode + 1 rAF; restore in `clearOverlays()` and at the end of the `onPageShow` reverse. *Acceptance:* in a strip from 0 to 0.8 s, no frame shows two copies of the capture, and no frame shows neither copy.

**MC-05 · Filled buttons wipe.**
- **Spec.** R-07: move the reveal attributes off the wrappers; wipe keyframes with fill `backwards`; the S3 `data-fade="wipe"` branch; `exitVisible` wipes.
- **Acceptance.**
  - Strips of the hero entrance, S3 p 0 → 0.12, the case arrival and one cut exit. In every frame, every `.btn`'s **effective** opacity (`effop.js`, the product up to `<html>`) is in {0, 1}.
  - After a Tab at rest, the focus ring is fully visible (computed `clip-path` is `none`).
- **Risk.** Touch only L212-225 of `fx-hero.js`, never L226-237.

**MC-06 · Menu type timing.** R-14 (`--covered` from JS, `calc()` in CSS). *Acceptance:* in a 30 ms mobile strip, no menu type shows while any column is < 100 % down, and the words start within 1 frame of full cover.

**MC-07 · One move on one clock.**
- **Spec.** R-10: first-paint continuation with a `linear()` sample of `domus.inOut` on [t_c, 1]; endpoint re-pointed on the same clock; the 40 px dissolve fallback.
- **Acceptance.** Forward and back, warm and cold cache (`localStorage` cleared):
  - the overlay's centre-y never reverses direction;
  - per-frame |Δvelocity| stays under 0.35 px/ms² (a kick fails);
  - the residual correction is ≤ 8 px;
  - no second slide;
  - on a warm cache the landing is ≤ 1.25 s after the click.

  Log `__nvDrift`.
- **Risk.** The most tuned path in the prototype. It needs MC-31, or a refresh lands mid-move.

**MC-08 · Back arrival without bare paper.** R-11 steps 1–4. *Acceptance:* re-shoot `sheet-13` from 0 to 1.6 s: no interval > 150 ms with only the returned tile on paper; captions correct at t0; header visible from t0.

**MC-31 · No refresh long task mid-cut.**
- **Spec.**
  - Add `FX.whenStill(fn)` in core (MC-09a): it runs `fn` once Lenis velocity is 0 and no overlay is moving.
  - In the `fx:ready` handler (`rv/fx-scroll.js:677-679`), skip `ST.refresh()` when `scrollY` and `document.documentElement.scrollHeight` are unchanged since `fx:built` (boot already refreshed, `rv/fx-core.js:373`). Otherwise defer the refresh with `FX.whenStill`.
- **Acceptance.** In a performance trace of the forward and back cuts, no task over 50 ms falls between the click and the landing. TBT does not rise.

### P1

**MC-09a · Tokens, additive (lane C, first).** Add the new CSS variables (`--d-press`, `--d-hover`, `--d-exit`, `--d-roll`, `--d-zoom`, `--d-title`, `--d-name`, `--d-media`, `--d-rm`, `--ease-in`, `--tempo`). Read `FX.motion` before `phase('init')`. Register `rv.out` and `dtIn`; drop `dtOut` and `--ease-dt`. Add `FX.whenStill`. Add `blocks` to `KEEP`. *Acceptance:* `FX.motion.D.reveal === 0.9`; visual gate unchanged.

**MC-10 · Block engine.**
- **Spec.** R-06, behind `?blocks=1`, which covers:
  - offsets, fresh timelines on each enter, and row-level triggers;
  - `.sc-ledger` as the ledger trigger;
  - the failsafe for every member kind;
  - the invisible reset (MC-11);
  - link-safe members (P13) and gl-host safety (P14);
  - reads before writes in `onSplit`.
- **Acceptance.**
  - `blocks.mjs`: members start at the declared offsets ±1 frame;
  - three down/up/down cycles give identical strips;
  - parking at 86 % ± 8 px and 100 % ± 8 px gives 0 re-triggers;
  - End then Home leaves 0 hidden elements;
  - the ScrollTrigger count is logged and lower than today;
  - no forced layout inside `onSplit` in the trace;
  - the band keep-out rects Δ ≤ 1 px.
- **Risk.** It touches every reveal on both pages.

**MC-11 · Invisible reset.** R-04/R-05: a reset trigger at `top bottom` (onLeaveBack), set poses +112 and +110, `.rv-reset` without a transition for fade-ups. Cut exits keep −110. *Acceptance:* in the scroll-up strip, no reveal element moves on screen. The next entrance starts at +112 with no jump. The park test gives 0 flaps.

**MC-12 · One sheet grammar.** R-12, plus every S4 clip site in R-10. *Acceptance:* forward and back strips at 1440 and 390 show exactly one straight edge with a 1 px ink hairline in every frame; commit ≤ 0.7 s; the new title is rising before the sheet leaves; the variant switch still works; the water pauses and resumes on covered/uncovered.

**MC-13 · The ring becomes a dial.** R-13 option (c). Remove `tickRing`'s perpetual write, `ringFast`/`ringSlow`, and the four call sites. *Acceptance:* `idle.mjs` counts 0 style writes after 6 s. At 50 % page progress the ring reads 180° ± 1°. During a cut the ring does not move.

**MC-14 · Lead clamp and anchors.** R-01 and R-19. Check `virtualScroll` against 1.3.26 first. *Acceptance:* at 1440×900, one notch travels 100 ± 3 px (×1) and is 95 % settled in ≤ 0.5 s; 20 notches in 400 ms travel ≤ 1250 px; touch stays native. Alberto gives an A/B verdict (×1 + clamp against ×0.7 + clamp) on S3, the rail and the ink.

**MC-15 · Counter creep.** R-03 counter. *Acceptance:* the digits change at least every 150 ms until 100. No step's logged value exceeds `start + 1/3·band` before its event. The guard is unchanged.

**MC-16 · Restore suite, and the place across the RM reload.**
- **Spec.** Reload at y ∈ {0, mid-S3 (1.2 vh), mid-rail, mid-ink, footer} × {1440, 390}; back/forward with bfcache on and off; hash loads `#work` and `#contact`; resize 1100 → 1000 → 1100; toggle `prefers-reduced-motion` mid-page (R-02 rule 7, lane C).
- **Acceptance.** 1 s after each load: |Δy| ≤ 2 px (for the RM toggle, the same section with ratio ± 0.05), 0 hidden type in the viewport, S3's p and the rail frame match, clean console. Contact sheet in `_shots/rivista-motion/MC-16/`.

**MC-26a / MC-26b · Cursor and magnets out; the verb rolls in place.**
- **Spec.** R-16.
  - N deletes `initCursor`, `initMagnet`, `.nv-cursor` CSS and `cursorHide` callers.
  - S deletes `buildMagnetic` and `data-magnetic`, strips `data-cursor` from the markup, and adds the two-label roll to the tile captions, the case capture caption and the next-work link.
- **Acceptance.** P9's selector check returns 0. In the hover and Tab strips, the verb rolls inside its box, and the box's bounding rect is constant.

**MC-17 · Hover and focus audit (serial, after the lanes).** R-15, plus the gates on `rv/fx-scroll.css:75, 350-351` and the masked arrow. *Acceptance:* a hover strip and a Tab strip per interactive element at 1440; every hover change also appears on focus; the outline has no transition; `tokens.mjs` reports 0 hits; hover responses complete in ≤ 0.35 s, except the tile zoom (0.6 s).

**MC-09b · Token sweep (serial, last).** Replace every literal with its §3 token across all files. Land the `tokens.mjs` gate with the §3 allowlist. *Acceptance:* `tokens.mjs` exits 0; the visual gate passes on index and case at both sizes; before/after strips of the line rise, a rise, S5, the menu and the nav roll, judged by Alberto.

### P2

| ID | Spec | Reduced motion | Acceptance |
|---|---|---|---|
| MC-18 | R-08: clip 1.1 s io; img settle 1.08 → 1 over 1.4 s out; wrapper untouched. | Printed. | Now-figure strip: the edge is monotone and lands at 1.1 s; the capture's top-left headline is never cropped. |
| MC-19 | R-08 lama, behind `?plate=lama`, A/B only. | Printed. | Side-by-side strip with MC-18; Alberto decides. |
| MC-20 | R-17 stair drift on Path only: mask wrappers, ±24/±8 px, `overflow-x: clip`. `rhythm.mjs` logs, per 0.25 vh of scroll, whether any transform changed. | None. | Mask `scrollWidth ≤ clientWidth` throughout (no clipped glyph); no horizontal page scroll at 390; drifted lines never overlap; no chapter has more than 0.6 vh without motion. |
| MC-21 | Wrap `.brand-name` (`rv/parts/a-header.index.html:5`) in a roll mask. `html[data-preloader] .brand-name` sits at yPercent 110 (CSS in `rv/fx-nav.css`). On `fx:intro:chrome`, it rises with the nav words (`initHandoff` targets, `rv/fx-nav.js:156`), which move from the hand-off to the chrome cue. | Printed. | S1 frames contain no name in the header; the brand name and nav start ≥ 0.25 s after the A lands. |
| MC-22 | On an `sc-film` arrival: `html.rv-motion.sc-film .ornament` uses `rv-orn` over 1.1 s out, delay 0.3 s (in `rv/fx-scroll.css`). Order: overline and title 0.06, lead 0.25, ornament 0.3, CTA wipe 0.35. | Printed. | Arrival strip: the ornament is done before the CTA wipe ends. |
| MC-24 | R-19 jump rule, plus the scrub snap. | Immediate. | "Work" from the top shows no fast-forward through S3 and no 0.5 s rewind; the work head's entrance plays; focus lands on `#work`. |
| MC-25 | Remove the CDN `lenis.css` (`rv/parts/head.html:55`) and copy all its 1.3.26 rules into `fx-core.css` §3 (height auto; stopped `overflow:clip`; `[data-lenis-prevent]` `overscroll-behavior:contain`; iframe `pointer-events:none`; the `autoToggle` transition), deleting L162. Drop `Flip.min.js` (`head.html:63`, `fx-core.js:347`; about 58 ms of bootup). Add `<link rel=preconnect href=https://cdn.jsdelivr.net crossorigin>`. `assemble.mjs` concatenates the five local stylesheets. | n/a | No `lenis.css` or `Flip` in the network log; one local stylesheet; the gl-off Lighthouse median does not fall (render-blocking waste was 937–1000 ms for `lenis.css`). |
| MC-27 | R-20 postcard close on the case capture; the case hero's parallax is removed. | None. | Strip: the edges are straight and monotone, the final inset is 8/22 % at 1440 and 4/10 % at 390, and the S4 landing still has ≤ 8 px residual. |
| MC-28 | R-21, when the IT copy exists. | Instant. | The swap strip shows no `.btn` below opacity 1, and every split is rebuilt with no orphan line. |
| MC-29 | R-09 dead zone: runway start +2.5 %, end −2.5 % of its height. | n/a | Strip across the rail's entry and exit: no frame-to-frame jump > 2 px in the track. |
| MC-30 | R-17 velocity-modulated titles, behind `?vt=1`. | None. | At \|v\| ≥ 45 the durations are 0.88× and the staggers 1.55×; Alberto decides. |

---

## 7. Open questions for Alberto

Each has a recommended default.

1. **Scroll weight.** Keep ×1 per notch and add only the flick clamp? Or also take sersan's ×0.7 («il nostro mi pare troppo veloce»), which means about 43 % more notches on a home already called long? *Default: ×1 + clamp; ×0.7 as the B side, A/B live in one sitting.*
2. **The AT ring.** (a) static; (b) velocity spinner (refused, listed for completeness); (c) an honest dial that turns with page progress and never on its own. *Default: (c).*
3. **Covers.** S5 becomes one paper sheet with a 1 px hairline, the same sheet as S4 and S1. For the mobile menu: keep the five columns, flatten their stagger to ≤ 0.015 s, or use the one-sheet drop from the top? Ink or cobalt hairline? *Default: one sheet everywhere, ink hairline; the menu flattens its stagger to 0.015 s.*
4. **The S1 counter during the shader link** (it sits at 050 for about 0.7 s). Creep by at most a third of the open step, labelled as a visual chase, or stay strictly still until a real sub-signal exists? *Default: creep ≤ 1/3.*
5. **Replay.** Type resets invisibly once it is fully below the fold and replays when the reader comes back down (sersan's model). Or print once per page view? *Default: replay.*
6. **A frame around the pour?** Revision 1 proposed a 1 px ink frame following the S1 window. It changes the composition you approved in R2/R2b. *Default: no frame. The sheet's hairline already fixes «paper on paper»; a side-by-side strip is available on request.*
7. **The lama** (domus's slanted blade) on the Now plate, against the straight bottom-up curtain? *Default: straight curtain; lama shown side-by-side only.*
8. **The label cursor** was removed in favour of the verb rolling in place. Do you want it back? If so, it becomes a paper chip that wipes in, never fades, over photographs. *Default: gone.*
9. **Performance, product side.** Without WebGPU there is no live window to show, yet S1 still delays the poster (about 4.0 s of the 4.4–4.5 s gl-off LCP is render delay). Skip S1 on the gl-off path? *Default: skip; LCP would drop to about FCP.*
10. **Postcard close** on the case capture (the domus Congedo move you asked for twice)? *Default: yes, P2, after the S4 work.*

---

## 8. Build lanes

The lanes are disjoint by file, so they can run in parallel. Hand-offs are named; anything shared is committed serially.

| Lane | Owns (exclusive) | Items, in order |
|---|---|---|
| **P** · probes (start first; no product files) | `scripts/probes/rivista-motion/{strip,tokens,blocks,idle,restore,rhythm}.mjs`, `effop.js` | the harness; `effop.js` (effective opacity: the product of ancestor opacities); the park test in `blocks.mjs`; then MC-16's suite, reporting failures to the owning lane |
| **C** · core | `fx-core.js`; `fx-core.css` §2–§3; `parts/head.html:51-65`; `assemble.mjs` | MC-09a (incl. `FX.whenStill`, `blocks` in `KEEP`, and the one `fx-hero-print` line in `plainEntry` for MC-01) → MC-25 → MC-14 → MC-16's RM-reload place (`fx-core.js:301`) |
| **H** · hero DOM | `fx-hero.js` DOM lines only (never L226-237, L279-294, L331-339, L343, L346, L158-182, L434-456); `fx-hero.css`; `parts/b-hero.html`; `fx-core.css` §6 (`.btn`) and §8 (L340-349); `parts/head.html:48` | MC-01 (emits `fx:intro:chrome`) → MC-05 hero part (defines `rv-wipe`/`rv-wipe-b`) → MC-15 |
| **S** · scroll | `fx-scroll.js`, `fx-scroll.css`, `parts/c-main.index.html`, `parts/c-main.case.html`, `parts/c-footer.html` | MC-02, MC-03, MC-11, MC-31 → MC-05 case part (after H's keyframes) → MC-26b → MC-10 → MC-18, MC-20, MC-22, MC-29 → MC-19, MC-27, MC-30 → MC-28 (deferred) |
| **N** · nav | `fx-nav.js`, `fx-nav.css`, `parts/a-overlays.html`, `parts/a-header.*.html`, `parts/head.html:29-38` | MC-04, MC-06, MC-13, MC-26a, MC-21 (listens to H's event; falls back to the hand-off if the event is absent) → MC-12 (S changes `fx-scroll.css:312`) → MC-07 (after S's MC-31) → MC-08 (after S's MC-03 and MC-31) → MC-24 (after C's MC-14) |
| **serial, last** | all of the above | MC-17 (hover audit across `fx-core.css` §6, `fx-nav.css` §4, `fx-scroll.css`) → MC-09b (the literal sweep and the `tokens.mjs` gate) |

**Shared-file rules.**
- `parts/head.html`: C edits L51-65, H edits L48, N edits L29-38. The lines differ; commit them one after another.
- `fx-core.css`: C owns §2–§3; H owns §6 and §8.
- Every lane passes the visual gate (1440×900 and 390×844 DPR 2, clean console) before handing off. The director commits one item per commit.

**Invariants every lane keeps.**
1. One ticker: Lenis on `gsap.ticker` with `lagSmoothing(0)` (`rv/fx-core.js:136-142`). No new looping `requestAnimationFrame`; one-shot waits are fine.
2. Entrances wait for the sticky `fx:ready` (`rv/fx-core.js:236-244`); keep the `linesOpen` gate (`rv/fx-scroll.js:673-676`).
3. Modules only call `FX.register` at load. Init order is gl, hero, scroll, nav (`rv/fx-core.js:37`).
4. The route record: `rv-pt` lives 8 s and is read and removed by the head script; `rv-origin` lives 10 min; `rv-intro-seen` gates S1; `--pt-*` paint the arrival at first paint.
5. P14: never transform a gl-host ancestor.
6. Keep emitting `fx:nav:covered`, `fx:nav:uncovered`, `fx:nav:reset` and `fx:lock` (menu): they pause the water.
7. A new CSS keyframe must end visible under the kill switch (`rv/fx-core.css:357-360`), and must not leave a clip at rest (`backwards` fill).
