# EFFECTS PLAN · Rivista prototype · Alberto Tuveri

Art direction for motion, 2026-09-17. Scope: `C:/Users/alber/Portfolio/public/proto/rivista/` (static prototype, later ported to Next.js 16 + React 19).

**What this plan rests on.** All four scout reports read in full; frames of every shortlisted item looked at; `port/index.html` read; canon (`u2-canon.md`), Domus primitives (`u1-motion-primitives.md`), `PRODUCT.md` §3/§9 read; `index.html`, `case.html`, `proto.css`, `proto.js` read in full; 34 screenshots of `.shots/proto-rivista/r2` looked at. The dev server answered (HTTP 200), so I also measured the live prototype and built two scratch proofs, because two of my decisions were not covered by any scout:

| Scratch evidence (git-ignored) | Result |
|---|---|
| `.wf-out/rivista/fx/art-director/measure.mjs` | Page is 16,180 px = **17.98 viewports** at 1440x900. Hero media top at y=780 of 900. Horizon section 5,130 px (32% of the page). rAF p50 16.7 / p95 16.9 / max 25 ms while scrolling. GPU: Adreno X1-85 via ANGLE D3D11, WebGL2 yes, `EXT_color_buffer_float` yes, `KHR_parallel_shader_compile` yes, `EXT_disjoint_timer_query_webgl2` yes, line width range 1..1. |
| `art-director/flow-poc.html` + `poc-*.png` | The new hero visual (S2) works on this machine: **GPU median 0.8 to 1.1 ms/frame** at 1440x900 with 16,384 particles and a 2160x1350 trail buffer, JS 0.1 to 0.2 ms. Phone-sized plate 0.24 to 0.35 ms. |
| `art-director/cap-tendina.mjs` + `tendina-v1-*.png` | The paper-tone column wipe (S5) reads clearly over the real page. |
| Context7 `/websites/gsap_v3` | `containerAnimation` requires `ease:"none"` on the container tween. The current `buildHorizon` breaks this rule. |

Ease names used below: **out** = `cubic-bezier(0.16,1,0.3,1)` (GSAP `expo.out`) · **io** = `cubic-bezier(0.66,0,0.22,1)` (CustomEase `domus.inOut`) · **soft** = `cubic-bezier(0.22,0.9,0.36,1)` (`domus`) · **xio** = `cubic-bezier(0.87,0,0.13,1)` (`expo.inOut`) · **exit** = GSAP `power2.in` · **lin** = linear, scrubs only.

---

## 1. Creative thesis

**Ink, cut, measure.** Alberto is three people in one CV: the engineer who writes the database rules, the renderer who pushes 120,000 particles through a GPU, and the director who cuts a 64-second film. The page is a printed sheet that those three people are still working on, and every motion belongs to one of them. **Ink** is the renderer: things arrive the way ink reaches paper. The live figure is a fluid drawn in the canon's own hairlines, display lines rise from the press through their masks, the manifesto inks in word by word under the reader's scroll, rules are drawn left to right. **Cut** is the director: a navigation is an edit, never a fade to nothing. One image carries across the cut (tile to case hero, and back), everything else leaves through its mask first, and ordinary links get a wipe in the magazine's own column grid. **Measure** is the engineer: figures are printed final, never counted up; the only numbers that move are instruments reading something real (load progress, GPU frame time, rail index), set in fixed-width cells. One ease family for the whole site (out for entrances, io for travel, lin for scrubs), so density reads as one calm voice. If a motion is not ink, a cut or a measurement, it is not in the site.

---

## 2. Critique of the current prototype (r2)

Files are in `C:/Users/alber/Portfolio/.shots/proto-rivista/r2/`.

1. **The proof is below the fold.** `desktop-v1-01-hero.png`: the live media starts at y=780 of 900 (measured), so 13% of it shows. The right third of the first viewport (x 990 to 1440, y 90 to 560) is empty paper. PRODUCT.md asks for the work to lead from the first viewport.
2. **The blob is a plastic toy, not liquid on paper.** `desktop-v1-00-pre-b.png`, `desktop-v1-02-band.png`, `desktop-v2-02-band.png`: metaballs with softbox window reflections, a 2019 3D look. `mobile-v1-01-hero.png`: it splits into an "8" balloon. It is the "blob" rut PRODUCT.md §7 names, and the same object is reused in the band, so the closing moment is a repeat.
3. **Template preloader, and the name plays twice.** `desktop-v1-00-pre-a.png`: centred lockup, rule, role. Then the hero lockup rises again. `pre-b`: ghost "A T" letters and a ghost header show through the fading panel, a muddy double exposure.
4. **The rail is seven empty cards.** `desktop-v1-03-rail-10.png`, `desktop-v1-02-scroll-3.png`: 7 of 9 tiles are beige rectangles with a number top-left and a name bottom-left, 60% void. They read as unloaded cards in a carousel. No index on desktop (`.rail-progress` is hidden under `[data-on]`), captions are static.
5. **Measured is long, empty and contradicts itself.** `desktop-v1-04-measured-12.png`: manifesto cut by the left edge, 65% empty. 5,130 px for three panels, a second horizontal scroll right after the rail (same trick twice), an ERA-style rotateY char flip (luxury real-estate voice), and the container tween uses a non-linear ease with `containerAnimation` (against GSAP docs).
6. **The transition bounces and is not reversible.** `desktop-v1-06-trans-1/2.png`: the tile grows to the whole viewport, so a dark screenshot is the entire screen for about 1 s (upscaled and soft in `mobile-v1-06-trans-1.png`). `desktop-v1-07-arrive-0.png`: it then shrinks back into the hero slot: zoom in, zoom out. Title arrives late, ornament last. Back (`desktop-v1-10-back-0/1.png`) is a generic beige wipe: the image never returns to its tile.
7. **Between chapters nothing lives.** `desktop-v1-02-scroll-6.png`: 380 px of bare paper with nothing in motion. Every chapter runs the same eyebrow, title, lead fade. No rule is ever drawn, nothing has an exit state.
8. **The conversion line is the smallest display text.** `desktop-v1-02-scroll-8.png`: the email is set in d4 on a beige slab, which is also a second background tone (breaks one-paper).
9. **Mobile menu is 55% empty.** `mobile-v1-02-menu.png`: three words, then nothing.
10. **Micro-interactions are default.** Nav underline is instant `text-decoration`, buttons only swap colour, no cursor, no press state.
11. Keep: the reduced-motion page (`rm-01-hero.png`) is complete and beautiful. That bar stays.

---

## 3. Signature moments (five)

### S1 · "Registro": preloader to hero handoff
**Sources.** Joffrey Spitzer handoff (codrops-transitions #4, https://tympanus.net/codrops/2026/02/18/joffrey-spitzer-portfolio-a-minimalist-astro-gsap-build-with-reveals-flip-transitions-and-subtle-motion/, live https://joffreyspitzer.com/, frames `joffrey-handoff/sheet.png`): one element travels from loader to its content slot while a sheet rolls up. Lusion rolling digits (saved-references #9, https://lusion.co/, `lusion/intro-03115ms.png`). ERA principle "the page is already under the curtain" (saved-references #1).

**Idea.** The preloader shows no big name. It shows instruments: a rolling counter and a rule, the header brand already in its final place, and a window onto the live flow (S2). At 100 the window travels into the hero slot while the paper sheet rolls up and the name rises once.

**DOM** (static HTML in `parts/b-preloader.html`, first child of `<body>`, `aria-hidden`):
`.hr-pre[data-pre]` > `.hr-pre_sheet` (paper, full screen) · `.hr-pre_count[data-pre-count]` (three digit cells, each `width:.6em; overflow:hidden`, holding two stacked numerals) · `.hr-pre_rule > i[data-pre-rule]` · `.hr-pre_meta.label` ("Loading · `<span data-pre-what>`fonts`</span>`"). The window is the GL canvas itself in float mode (section 6) with `z-index: var(--z-pre-gl)`. Header gets `z-index: var(--z-pre-hdr)` and hidden nav under `html[data-preloader]`.

**Progress is real.** `tasks = [variant fonts, GL program link, obstacle texture, DOMContentLoaded]`; `p = done/total`; shown value follows Lusion: `shown += (100p - shown)(1 - e^(-7dt))`, capped by `elapsed/1000*100` (1 s minimum, no fake delay). `[data-pre-what]` prints the task in flight (`FONTS`, `SHADERS`, `READY`).

**Timeline, first visit, desktop** (T = shown reaches 100 and fonts are ready, cap 1500 ms, plus a 120 ms hold):

| t | element | from → to | dur | ease |
|---|---|---|---|---|
| 0 (CSS) | digits | `translateY(108%)` → 0, stagger 60 | 900 | out |
| 0 (CSS) | rule track, meta | opacity 0 → 1 | 400 | lin |
| ≥250, GL ready | window (canvas clip-path) | `inset(50% 23vw 50% 23vw)` → `inset(22vh 23vw 22vh 23vw)`; sim pre-warmed 90 steps | 900 | out |
| T | digits | yPercent → -112, stagger 40 | 500 | io |
| T | rule | scaleX 1 → 0, origin right | 450 | io |
| T | window | centre rect → hero slot rect (`[data-gl-slot="hero"]`), glyph uniform follows the window centre | 1100 | xio |
| T+150 | sheet | `inset(0)` → `inset(0 0 100% 0)` (rolls up) | 1000 | io |
| T+450 | `fx:intro:handoff`: lockup chars rise (existing CSS film, 45 ms per char) | 108% → 0 | 1250 | out |
| T+700 | nav items (WP-A listens) rise from masks, stagger 60 | 110% → 0 | 700 | out |
| T+1250 | canvas z drops to `--z-gl`, `data-preloader` removed, Lenis starts, `fx:ready` | | | |

Total about 2.4 s. Skip on pointerdown or a content key: `timeScale(3)`. CSS failsafe removes the sheet at 5.2 s if JS never arrives. Once per session (`rv-intro-seen`), never with a hash, an arrival record or reduced motion. **Repeat visit:** no sheet; the window opens in its slot from a horizontal slit (`inset(50% 0 50% 0)` → slot, 900 ms out) and the lockup rises at 150 ms.

**Variants.** Digits in the display face at `clamp(5rem,17vw,17rem)`, bottom-left at `--pad` / 9vh. V1 Cormorant 600 lining figures, V2 Geist 500 tabular, V3 Instrument Serif 400. The fixed-width cells make the three behave the same. No dark panel in any variant.

### S2 · "Carta corrente": the hero visual
**Source.** None of the scouts covered a fluid stand-in, so I built and measured it: `art-director/flow-poc.html` (`?v=1|2|3&ts=1.5&gain=0.5`), stills `poc-v_1_hud_0_ts_1_5_gain_0_5.png`, `poc-v_2_…`, `poc-slot-v1.png`, `poc-phone-v1.png`. WP-B starts from this file.

**What to build.** A live flow field drawn in ink hairlines, on a paper-deep plate: about 16k particles advected by a divergence-free current that runs left to right like reading, leaving 1 px trails that fade into the paper. In the middle of the current stands a large **"A" as a blind emboss**: the letter body is `--paper` on the `--paper-deep` plate, no ink ever touches it, and the streamlines part around it like water round a stone. 10% of the strokes are the accent ink. It reads as an engraved endpaper that moves. It is also honest: particles on a field is the small sibling of the MLS-MPM hybrid the production hero runs, and the CV's own claim is a fluid held in the shape of an "A".

**Why it is intentional in all three variants.** The glyph is rasterised in each variant's display face, so the plate changes character with the identity: V1 a high-apex Cormorant A with cobalt threads (cyanotype engraving), V2 a geometric Geist A with teal threads (a CFD plot from the lab), V3 a condensed Instrument Serif A in bottle green (marbled endpaper). On variant switch the coverage buffers recolour instantly and the flow re-routes around the new letter in about 1 s.

**Exact recipe (verified values).** Raw WebGL2, no library.
- Particles: interleaved `pos.xy, age, seed`, two buffers, **transform feedback** update, RK2 midpoint integration, `dt` clamped to 33 ms.
- Field: `psi(p,t) = ramp(p) * (0.105*p.y + 0.115*g(1.35p + (0, 0.045t)) + 0.05*g(3.1p - (0.07t, 0)))`, `v = (dpsi/dy, -dpsi/dx)` by central differences, e = 0.004. `g` is gradient noise. Multiplying the potential by `ramp` (Bridson) makes the flow exactly tangent to the glyph.
- Obstacle texture RGBA8 512²: **R** = glyph coverage blurred 10 px (`ramp = 1 - smoothstep(0.03, 0.55, R)`), **G** = sharp coverage (emboss fill), **B** = ink-free interior: flood fill from the border on a 128² grid with the glyph dilated 5 cells, unreachable and not glyph = interior (counter and the gap between the legs), blurred 3 px. Without B the counters fill with fingerprint-like eddies (seen in the first PoC pass).
- Life `2.2 + 3.8*hash(seed)` s. Stagnant ink dries: `|v| < 0.035` adds `6dt` to age (this removed the heavy accent outline seen in the first pass). Kill at `ramp < 0.30`, `B > 0.4` or out of bounds; respawn uniform, re-roll once if `ramp < 0.45` or `B > 0.3`.
- Draw: instanced `GL_LINES` (prev from buffer A, curr from buffer B, a respawned particle collapses to a point), additive into an **RG8** trail target: R = ink, G = accent (10% of particles, gain 2.2). Line gain 0.5 with a 1.5x trail buffer. Fade in 0.5 s, fade out over the last 0.7 s, halo `smoothstep(0.30,0.78,ramp) * (1 - smoothstep(0.15,0.4,B))`.
- Trail decay, time-based: `k = 0.965^(60dt)`; `t = max(t*k - (1.2/255)*60dt, 0)`. The subtraction prevents 8-bit ghosting.
- Composite: `c = ground; c = mix(c, paper, smoothstep(.35,.65,G))` (hero only) `; c = mix(c, ink, 0.86R); c = mix(c, accent, min(1, 1.35G));` plus ±1/255 hash grain. Colours are read from the CSS tokens, so coverage is colour-agnostic.
- Pointer (fine pointer only): gaussian drag `v += e^(-d²/0.012) * pointerVel * 1.4`, strength decays 0.96 per frame. Scroll couples in: drift `U = 0.105 * (1 + min(1.5, 0.08|lenis.velocity|))`.
- To tighten in production: glyph blur 7 px, kill at 0.18, and put 30% of respawns in a ring just outside the halo so the downstream wake fills (visible as a pale wedge in `poc-slot-v1.png`).

**Placement.** Desktop ≥1024: a slot in the empty right third of the first viewport, x 69vw to the right edge (full-bleed right), from under the header to the lockup baseline, about 446x470 at 1440x900. Under it a caption in label style: `FIG. 01 · FLOW FIELD, RENDERED LIVE` and an instrument row read from the engine (`16,384 PARTICLES · WEBGL2 · 1.1 MS GPU · DPR 1.5`, GPU value omitted when the timer extension is missing), then the existing sentence "A WebGL2 stand-in for the WebGPU MLS-MPM fluid that runs on the real site." Below 1024: full-bleed 4:5 plate under the CTA.
**Second composition, the closing band.** Same engine, ground = `--paper` (the page itself comes alive, no beige slab), no emboss, and the obstacle is **the sentence**: the line boxes of "LET'S BUILD THE NEXT ONE." and the email, padded 0.4em, so the current parts around the type and no stroke ever runs under a letter. This is the one place the canon allows text over media, and physics guarantees the contrast.

### S3 · "Otturatore": the scroll set piece
**Sources.** Layered Zoom Scroll / Telescope (codrops-scroll-text-media #1, https://tympanus.net/codrops/2025/10/29/building-a-layered-zoom-scroll-effect-with-gsap-scrollsmoother-and-scrolltrigger/, demo https://tympanus.net/Tutorials/TelescopeZoom/, frames `telescope_fine_y380.png`, `telescope_fine_y540.png`): a title parts while a window grows to the full viewport. ERA sticky uncover sheet, squared (saved-references #6, `era/hero-75.png`) and ERA hero parallax-out (saved-references #10).

**Engineering idea.** The flow always simulates across the whole viewport. The page only sees it through a window (CSS `clip-path` on a fixed canvas). Growing the window reveals more of the same field: no resize, no reallocation, no texture upload, so the expansion is perfectly smooth. The hero screen is sticky, so the slot never moves relative to the viewport and nothing has to track scroll.

**DOM.** `.hr-stage[data-on]` (height `100svh + 100svh travel + 100svh cover`) > `.hr-screen` (sticky, `top:0`, 100svh, grid `minmax(0,1fr) clamp(18rem,31vw,34rem)`): lockup and hero row in column 1, `[data-gl-slot="hero"]`, caption and CTA in column 2. The next section gets `margin-top: calc(-1 * var(--hero-cover))`, `z-index: var(--z-sheet)`, paper background and a 1 px top hairline. WP-B writes `--hero-cover: 100svh` on `<html>` only while the stage is on. `data-on` is set by JS, so no-JS, mobile and reduced motion keep a plain static hero.

**Scrub** (`trigger .hr-stage, start "top top", end "+=100svh", scrub 0.5`, progress p):

| p | element | change |
|---|---|---|
| 0 → 0.40 | lockup line 1 / line 2 | leave up through their masks (yPercent → -118) while parting: xPercent -6 / +6, line 2 lags 0.04 |
| 0 → 0.15 | ornament | opacity → 0 |
| 0 → 0.30 | label, h1, CTA, caption | opacity → 0, y → -24 px; `inert` at p > 0.3 |
| 0.10 → 0.60 | window top, bottom, right | slot insets → 0 (the blade opens to full height on the right) |
| 0.30 → 0.85 | window left | slot left → 0 (the blade sweeps left; it crosses x = 65vw after the lockup has gone, so text never sits over the plate) |
| 0.10 → 0.85 | glyph | centre slot → viewport centre, scale 0.46 → 0.95; drift x1 → x1.6 |
| 0.85 → 1 | hold | full-viewport flow, header hidden by the existing scroll-down rule |
| cover phase | next section | rises over the pinned plate as a straight-edged paper sheet; when it reaches the top the GL loop sleeps |

Particles caught inside the moving glyph die at once (`ramp` rule), so the letter stays clean while it travels.

### S4 · "Stacco": home to case, a match cut, and back
**Sources.** Infinite Scroll Gallery Flip (codrops-transitions #1 and codrops-scroll-text-media #3, https://tympanus.net/codrops/2026/07/30/building-an-infinite-gsap-scroll-gallery-with-parallax-and-flip-transitions/, demo https://tympanus.net/Tutorials/InfiniteScrollGSAPGallery/, frames `infinite-open/sheet.png`, `infinite-close/sheet.png`): neighbours leave, one image travels with an inner counter-scale, type sets after; close reverses. ERA "hide only what is visible" (saved-references #4, `era/trans-00556ms.png`). Mechanism kept from r2: fixed overlay with `clip-path` frame plus image transform (transform and clip only), arrival painted from an inline script.

**The change that fixes the bounce.** The image makes **one move**: tile rect → the case hero's real rect (full-bleed 16:9 whose top sits at about 0.69 vh, clipped by the viewport bottom). It never fills the screen. The target rect comes from a cache `rv-hero-rect|<slug>|<variant>|<w>x<h>` (localStorage, written on every case visit), else from an estimate; on arrival a difference over 2 px is settled in 300 ms io under the rising title.

**Forward, t from click:**

| t | element | change | dur | ease |
|---|---|---|---|---|
| 0 | lock (`FX.lock`), Lenis stop, cursor label collapses | | | |
| 0 | visible captions and heads (`FX.exits`) | lines yPercent → -110, stagger 20 | 300 | exit |
| 0 | other tiles' media | `inset(0)` → `inset(0 0 100% 0)`, stagger 40 outward from the clicked tile | 450 | io |
| 0 | overlay frame `.nv-img` | clip from tile rect → target rect | 1100 | io |
| 0 | overlay image | tile cover-transform → hero cover-transform, inner scale 1.12 → 1 | 1100 | io |
| 120 | paper sheet `.nv-sheet` (under the image, over the page) | `inset(100% 0 0 0)` → `inset(0)` | 600 | io |
| 1100 | commit: write `rv-pt` {type:"flip", src, rect, x, y, s, label, sub, t} and `rv-origin` {tileId, rect, scrollY, v, w, h, t}; navigate. Deadline navigation at 1500 regardless | | | |

**Arrival (case).** The head script turns the record into CSS variables (`--pt-t/r/b/l`, `--pt-x/y/s`) so the overlay and the sheet are correct at first paint with no deferred JS. Then: fonts cap 900 → measure, settle, cache → decode the real hero → swap overlay for the real figure in one frame (its curtain is skipped) → sheet removed (same colour as the page, invisible) → overline fade-up at 0, title lines rise at +80 (1050 out, stagger 90), lead lines +250, CTA +350, ornament +450.

**Back.**
- *Link with `data-back`* and the hero at least 35% visible and a fresh `rv-origin` (10 min, same viewport size and variant): visible type exits, sheet wipes down from the top (500 io), overlay travels hero rect → stored tile rect (1000 io), navigate with `rv-pt` type "flip-back" and the stored `scrollY`. Home arrival: overlay painted at the tile rect from first paint → build → `FX.scroll.restore({y})` (refresh, immediate scroll, rail tween snapped to its progress, no slide-in) → settle if over 2 px → swap for the real tile → sheet leaves upward (500 io) → other tiles unroll (600 io, stagger 40 outward) → captions rise. Otherwise: S5 in the back direction.
- *Browser Back, bfcache* (`pageshow`, `persisted`): the home DOM is frozen in its committed state, so the exact reverse runs in place (overlay → its own tile, sheet away, tiles unroll, captions rise), 900 ms, zero network.
- *Browser Back without bfcache* (`navigation.type === "back_forward"`): start under the sheet, no overlay, let the browser restore scroll, then sheet up and tiles unroll.
- *Forward into a bfcached case page:* `FX.nav.reset()` clears any frozen overlay, unlocks, no animation.
- *Click during a running transition:* the lock is taken synchronously in the click handler; while locked, capture-phase `click`, `keydown` (Enter, Space) and `pointerdown` on links are swallowed and `<main>` is `inert`. No queueing, no reversal after commit. Six seconds after a lock with no `pagehide`: full reset.
- Modified clicks, `target`, `download`, other origins: native.

**Prototype scope.** Only tile 01 matches the single case page. The rule is generic: `data-pt="flip"` runs only when `data-pt-hero` equals the destination's hero source; every other tile uses S5 with its project label.

### S5 · "Tendina": the cut for ordinary links
**Source.** Vengeance UI Reveal Loader (design-mcp-catalogs #3, https://www.vengenceui.com/components/reveal-loader, vanilla port measured in `port/index.html`, frames `port-08-cover-400ms.png`, `-700ms`, `-1000ms`, `-1600ms`). I changed its material: the scout frames show a black ziggurat and then about 500 ms of dead black screen. In **paper-deep columns with hairline column rules** the same gesture is the magazine's grid asserting itself (my frames `tendina-v1-0300ms.png`, `-0850ms.png`, `-1350ms.png`).

**DOM** (created by JS; a static copy in `parts/a-overlays.html` for arrival first paint): `.nv-cols` > 10 × `<i>` (5 below 768), each `background: var(--paper-deep); border-left: 1px solid var(--line); border-top: 1px solid var(--stone)`; `.nv-cols_copy`: AT ring at the header position, label (d1, own `overflow:hidden` mask, bottom-left at 12vh), sub label.

| t | element | change | dur | ease |
|---|---|---|---|---|
| 0 | lock, visible type exits | | 300 | exit |
| 0 | columns | yPercent 101 → 0, stagger 35 from centre (last lands at 660) | 500 | io |
| 0 | AT ring | 30 → 240 deg/s | 300 | soft |
| 500 | label | yPercent 112 → 0 (it must wait for the left columns; at 220 it rose over live page content in my first capture) | 600 | out |
| 600 | sub label | opacity 0 → 1 | 300 | lin |
| 700 | commit and navigate (deadline 1300) | | | |
| arrival | covered from first paint; after ready (fonts cap 900, refresh, hash scroll) label → -112 | | 350 | exit |
| +100 | columns | 0 → -101, stagger 35 from the edges; `fx:ready` at +150 so the new title rises while the columns clear | 550 | io |
| end | ring eases back to 30 deg/s (1100 soft), unlock | | | |

Back direction mirrors it: columns descend from the top and leave downward. Same-page anchors get no cover: Lenis `scrollTo` 1.4 s. The variant switcher reuses `FX.nav.cover/uncover` with the variant name as label.
**Hidden states by `gsap.set` only.** A CSS `translateY(101%)` plus a `yPercent` tween kept the columns off screen in my first harness run, because GSAP reads the computed pixel matrix into `y`.

---

## 4. Section by section

**Home**

| Section | Enter | Scroll | Hover / focus | Exit |
|---|---|---|---|---|
| Header | S1 | solid after 24 px: its bottom hairline draws L→R (600 out); hides on scroll down | nav word mask roll (450 out); accent dash before the current section | stays during S4 |
| Hero | S1, S2 | S3 | pointer drags the current; CTA: section 5 | S3 |
| Now at SerSan | arrives as the uncover sheet; eyebrow fade-up; title lines; **lead as rising lines** (110% → 0, 900 out, stagger 80); link draws | square media: curtain `inset(100% 0 0 0)` → 0 (1400) with inner 1.15 → 1, parallax ±5% | label cursor "Visit" on the media | title lines leave upward on leave-back (400 exit) |
| Work head | two staircase lines with counter-parallax (xPercent -4/+6 → +4/-6, scrub 0.25) | | | |
| Rail (existing set piece, upgraded) | tiles unroll once (`inset(0 0 100% 0)` → 0, stagger 80) | track stays `ease:"none"`, `scrub 0.6` (GSAP rule); captions rise through `containerAnimation` at "left 90%"; inner pan ±6%; per-tile media 1.08 → 1; runway factor 0.85 → 0.6; **desktop index `01 / 09`** with mask-rolling digits and the 2 px progress line | media 1.04 (600 out), caption title rule draws, label cursor "Open" | S4 / S5 |
| Type tiles | become **ledger plates**: figure at `min(34cqi, 9vw)` on the baseline, three hairline rules, index top-left, name in d3; printed, never counted | | the figure's rule redraws in accent | |
| Measured | **Scroll ink** replaces the horizon (design-mcp-catalogs #5, https://magicui.design/docs/components/text-reveal, frames `port-01-ink-p0.3.png`): 180vh section, sticky 100vh, the d1 manifesto inks word by word, opacity 0.22 → 1, `stagger 1`, scrub 0.6 | then two ledgers in normal flow, head cell `position:sticky; top:22vh`; per row: rule draws (900 out), label fades, **figures rise as printed lines**, bars are ruled in 1100 out (after-bar in accent) | | |
| Capabilities | one rule per grid row draws L→R; numbers rise; heads and bodies fade-up, stagger 90 | | hovered cell: number turns accent, its rule redraws in accent (300) | |
| Path | row rule draws, `when` label rises in a mask, title fade-up | | none (rows are not interactive) | |
| Closing band | S2 band composition; title lines rise; **email at d2** with double-line draw | current quickens with scroll velocity | email is the one magnetic target (±12 px, fine pointer) | |
| Footer | top rule draws, column heads rise stagger 80 | | `.link-draw` underline (350 soft) | |

**Case page**

| Section | Enter | Scroll | Hover |
|---|---|---|---|
| Page hero | S4 or S5 arrival; plain load: title lines, lead lines, media curtain | media parallax ±5%, push-in 1 → 1.06 while leaving | label cursor "Visit" on the media |
| 01 What it is | head sticky at 18vh while the right column scrolls; tools rise stagger 40 under a drawn rule | | |
| 02 Sphere AI | same ledger component as home; guardrail rows: rule draw, number mask roll | | |
| 03 Reliability | four numerals rise as printed lines, rules draw | | |
| Next work | d1 lines rise | | arrow +0.12em (450 soft), label cursor "Next"; click = S5 with the project label |
| Band, footer | as home | | |

---

## 5. Micro-interactions

- **Links.** `.ghost` keeps its two-line swap (300 soft). Primary email: double hairline drawn in opposite directions (design-mcp-catalogs #12, https://www.vengenceui.com/components/line-hover-link): 300 ms `cubic-bezier(.7,0,.2,1)` and 400 ms +100 `cubic-bezier(.2,1,.8,1)`. Footer and inline links: `.link-draw`. All also on `:focus-visible`, all under `(hover:hover) and (pointer:fine)`.
- **Buttons.** `.btn`: a duplicate label layer in `--accent-dark` is revealed by `clip-path: inset(0 100% 0 0)` → `inset(0)` (350 out); the arrow leaves top-right and re-enters from bottom-left (300); `:active { transform: scale(.98) }` 120 ms.
- **Label cursor** (fine pointer, hover capable, motion allowed). The system cursor stays. One fixed square tag `.nv-cursor` (paper, 1 px ink hairline, label 1rem, leading 1.75rem dash), offset 18/18 px, follows with `quickTo` x/y 450 ms power3, word rises in a mask over `[data-cursor="Open|Next|Visit"]` (250 out), leaves in 150. Never on touch.
- **Mobile menu.** Opens with five paper columns descending, stagger 30 **from the right** where the button is (450 io); items gain index numbers, rules draw, words rise (800 out, stagger 60, existing); the empty half is filled with the email at lead size, LinkedIn, GitHub and EN / IT. Close 300 ms. `MENU` ↔ `CLOSE` is a mask roll. Focus trap, Escape and scroll lock stay.
- **AT ring.** 30 deg/s, `30 + 10|v|` with scroll (existing), 240 deg/s during a transition.
- **Variant switcher** (prototype chrome): S5 in place with the variant name; `?chrome=0` hides it for captures.

---

## 6. Architecture

**One WebGL2 context, one scene.** `fx-gl.js` owns the only canvas, used by the preloader window, the hero plate and the closing band. **Image transitions stay in the DOM, deliberately:** a GL image plane cannot survive a cross-document navigation (new document, new context), so it would need a DOM twin at both ends, a swap seam, and a decode plus texture upload at click time, for no visual gain on square unbent rects. The module keeps a `scenes` extension point; in the Next.js port, where the layout persists, a `plane` scene can add the Lusion paper bend (saved-references #8) to S4.

- **Two placements.** `float`: canvas `position:fixed; inset:0`, revealed through a `clip-path` window; used only where the slot is static in the viewport (scroll-locked preloader, sticky hero stage). `dock`: canvas absolutely fills its host and scrolls natively; used for the band everywhere and for the hero below 1024. Hero and band are many viewports apart, so the switch and its buffer reallocation are never visible.
- **Loop gating.** Driven by the single `gsap.ticker` (no second rAF). States `off | sleep | run`. Sleep when: host not intersecting (IntersectionObserver, rootMargin 25%), hero stage fully covered, tab hidden, context lost, or covered by a transition; asleep means `visibility:hidden` and zero GL calls. Before first sight `warm(90)`. `webglcontextlost` → poster; `restored` → rebuild.
- **Resolution.** Drawing buffer = CSS px x `min(DPR, 1.5)`. Trail buffer = CSS px x 1.5 (supersampled hairlines at DPR 1, verified). Hard cap 3.2 MP per buffer: `scale = min(1.5, sqrt(3.2e6 / cssArea))`, so a 4K window never explodes.
- **Tiers.** A: 16,384 particles (desktop). B: 8,192 (touch or under 768). C: 4,096 with trail x1 (`deviceMemory <= 4`). After 90 frames, a GPU median over 5 ms drops one tier, never back up.
- **Textures.** Only the generated obstacle texture (2D canvas, about 5 ms, rebuilt on `fx:variant` and width resize).
- **Fallback.** The slot contains a real `<img>` poster per variant (`fx-plate-v1/2/3.webp`, captured from the engine, alt text, caption "Still frame captured from this engine"). The canvas sits above it. No WebGL2, a shader error or a JS failure leaves the poster: content visible if scripts fail. `html.gl-off` also turns the S3 stage off.

---

## 7. Performance budget and measurement

| Budget | Value |
|---|---|
| Main-thread JS per frame while scrolling | ≤ 4 ms p95 |
| Flow GPU cost | ≤ 2 ms median tier A (measured 0.8 to 1.1), ≤ 1 ms phone plate (measured 0.24 to 0.35) |
| Any frame during a signature moment | ≤ 25 ms (r2 baseline max 25); no long task over 50 ms after `fx:ready` |
| Layout reads per frame in steady state | 0 (rects cached on `refreshInit` and `fx:resize`) |
| Promoted layers | ≤ 12; `will-change` only while active |
| New JS | ≤ 45 kB unminified per module, no new library |
| GPU memory | trails 2 x RG8 ≤ 3.2 MP, particles about 0.5 MB |
| CLS | 0: splits after fonts, fixed counter cells |
| Home length | ≤ 15.5 viewports at 1440x900 (from 17.98) |

**Method.** (1) rAF cadence recorder as in `measure.mjs`: p50, p95, p99, max, counts over 20 and over 34 ms. (2) **30 Hz rule for this machine:** if p50 ≈ 33.3 ms with p95 - p50 < 2 ms the display presents at 30 Hz; judge the ratio of frames over 1.5 x p50, not absolute ms. (3) GPU: `EXT_disjoint_timer_query_webgl2`, **median or p25 over ≥ 120 frames, never mean or p95**: queries that straddle the swap read one vsync (I saw a bimodal 1 ms / 16 ms). (4) JS: `performance.now()` around the ticker callback. (5) `PerformanceObserver("longtask")` across each signature moment. (6) Frame sequences: step timelines with `tl.time(t)` or a CDP screencast; never return a GSAP object from `page.evaluate` (the serialisation hangs, it cost me a run). (7) Matrix: V1, V2, V3 x 1440x900 DPR 1 and 390x844 DPR 2 x motion on and off.

---

## 8. Reduced motion and mobile

| Effect | Reduced motion | Mobile (< 1024, touch) |
|---|---|---|
| S1 | no preloader; page static at first paint | counter and sheet roll-up only (inset 1rem); the docked plate opens in place from a slit; never over 2.5 s |
| S2 | `warm(180)`, one composited frame, sleep: a still engraving; no pointer, no scroll coupling | dock mode, tier B or C, 4:5 full-bleed plate under the CTA |
| S3 | stage off: static hero | stage off; plate reveals with the media curtain, parallax halved |
| S4 | 150 ms opacity cover → navigate → 150 ms uncover | same morph; target is the full-width hero; other tiles roll with stagger 0 |
| S5 | 200 ms opacity cover, 200 ms uncover, label static | 5 columns, stagger 45, same timings |
| Lines, reveals, rules | final state, no tween (existing) | same motion; rise distance 1.5rem |
| Scroll ink | section auto height, all words full ink | not sticky; words ink per line on enter |
| Rail | vertical-safe static track (existing) | native horizontal scroll with snap, CSS pan, 2 px progress (existing); index shown |
| Ledgers, bars | printed | same as desktop, no sticky head |
| Cursor, magnetic, nav roll | off | off (no hover) |
| Band | still frame, sentence readable on clean paper | dock, tier B |
| Menu | 150 ms opacity | as specified |

---

## 9. Build order: module split, three parallel packages, contract

**Principle.** Nobody edits a file someone else owns. The legacy four files are not loaded any more; they move to `r2/` as reference. The pages are **assembled from partials**, so three agents never touch the same HTML file.

**Scaffold (WP-A, first 40 minutes, one commit).** `assemble.mjs` (Node, no deps): `index.html = head + <body id="top"> + b-preloader + a-header.index + <main id="main"> + b-hero + c-main.index + </main> + c-footer + a-overlays + </body></html>`; `case.html = head + body + a-header.case + <main> + c-main.case + </main> + c-footer + a-overlays`; `{{TITLE}}` and `{{HOME}}` are replaced per page; a missing partial becomes an HTML comment, so the pages build from minute one. Everyone runs `node assemble.mjs` after editing a partial; output is deterministic, so concurrent runs cannot lose an update. If `fx-core.js` or `assemble.mjs` do not exist yet, B or C may create them verbatim from this section; after that only A edits them. Meanwhile B works in `dev-gl.html` (standalone) and C ports legacy scroll code against the contract.

| Package | Owns (under `public/proto/rivista/`) | Scope |
|---|---|---|
| **WP-A "Navigazione"** | `assemble.mjs`, `parts/head.html`, `parts/a-header.index.html`, `parts/a-header.case.html`, `parts/a-overlays.html`, `fx-core.css`, `fx-core.js`, `fx-nav.css`, `fx-nav.js`, `r2/*` | scaffold, core, S4, S5, header behaviour, AT ring, menu, label cursor, links and buttons, switcher, head boot script |
| **WP-B "Carta corrente"** | `parts/b-preloader.html`, `parts/b-hero.html`, `fx-hero.css`, `fx-gl.js`, `fx-hero.js`, `dev-gl.html`, `fx-plate-v1.webp`, `fx-plate-v2.webp`, `fx-plate-v3.webp` | S1, S2, S3, band GL composition, posters, tiers, GL fallbacks |
| **WP-C "Impaginazione"** | `parts/c-main.index.html`, `parts/c-main.case.html`, `parts/c-footer.html`, `fx-scroll.css`, `fx-scroll.js` | every section of home and case, rail upgrade, scroll ink and ledgers, band copy, footer, exits, restore |

`fx-core.css` = tokens, base, type, layout, buttons, links, media base, reveal base, reduced-motion kill switch (copied from `proto.css` §1 to 5, 8, 16, 20). A base change is requested from A, or overridden under your own prefix: `nv-` (A), `hr-` (B), `sc-` (C).

**Script order** (all `defer`): gsap, ScrollTrigger, SplitText, Flip, CustomEase, lenis, `fx-core.js`, `fx-gl.js`, `fx-hero.js`, `fx-scroll.js`, `fx-nav.js`. At load a module only calls `FX.register`.

**Namespace (`fx-core.js`).**
```js
window.FX = {
  flags: { motion, fine, touch, desktop, gl },      // booleans, live via matchMedia
  on(evt, fn), once(evt, fn), emit(evt, detail),    // window CustomEvents named "fx:*"
  lenis, scrollTo(target, { immediate }),
  lock(reason), unlock(reason), locked,             // ref-counted; toggles html[data-fx-locked], inert on <main>, Lenis stop/start
  fonts(ms),                                        // Promise: variant faces loaded, or cap
  register(name, { init(ctx), build(ctx), onVariant(v), onResize(e) }),
  exits: [],                                        // functions returning Promises; A awaits all before a cut
  gl: null, hero: null, scroll: null, nav: null     // filled by their owners
};
```
**Boot order.** (1) flags, variant sync, CustomEase `domus`, `domus.inOut`, `dtOut`, plugin registration, `ScrollTrigger.config({ ignoreMobileResize: true })`. (2) Lenis on the GSAP ticker, stopped under `data-preloader` or `data-arrive`. (3) `init` in order gl, hero, scroll, nav, each in try/catch; a failing module sets `html.fx-fail-<name>` and must leave content visible. (4) `await FX.fonts(arriving || preloader ? 900 : 1500)`. (5) `build` in the same order, `ScrollTrigger.refresh()`, `fx:built`. (6) Entry: `data-preloader` → `FX.hero.intro()`; `data-arrive` → `FX.nav.arrive()`; else emit `fx:ready`. (7) A live change of reduced motion reloads the page (existing).

**Events** (`detail`): `fx:ready {entry:"intro"|"arrive"|"plain"}` once · `fx:built {}` · `fx:intro:handoff {}` · `fx:variant {from,to}` (after fonts) · `fx:resize {w,h,widthChanged}` (debounced 200 ms) · `fx:lock {locked,reason}` · `fx:nav:start {kind:"flip"|"cols"|"fade", dir:"fwd"|"back", href, label}` · `fx:nav:covered {kind}` · `fx:nav:arrived {kind}` · `fx:nav:reset {}` · `fx:gl:state {state:"off"|"sleep"|"run", tier, host}` · `fx:gl:stats {n, gpuMs|null, dpr}` at 1 Hz.

**Cross-package functions.** Callers feature-detect (`FX.scroll?.exitVisible?.()`), so each package runs alone.
- B: `FX.gl.mount(el,{mode:"float"|"dock", ground:"deep"|"paper"})`, `window(rect|null)`, `setObstacle({type:"glyph",char,font}|{type:"rects",els,pad})`, `params {drift, glyphX, glyphY, glyphScale}` (plain tweenable object), `warm(n)`, `wake()`, `sleep()`, `recolor()`, `stats`; `FX.hero.intro()`.
- C: `FX.scroll.exitVisible({dir})`, `enterVisible()`, `restore({y})` (refresh, immediate scroll, rail snapped), `tileRect(id)`, `rebuildText()`.
- A: `FX.nav.go(a)`, `cover({label,sub,dir})`, `uncover({dir})`, `arrive()`, `reset()`, `state`.

**DOM hooks.** Core: `html[data-variant]`, `.rv-js`, `.rv-motion`, `[data-preloader]`, `[data-arrive]`, `[data-fx-locked]`. A: `[data-hdr]`, `[data-menu]`, `[data-menu-btn]`, `[data-switcher]`, `[data-back]`, `[data-pt]`, `[data-pt-label]`, `[data-pt-sub]`, `[data-pt-hero]`, `[data-cursor]` (B and C place `data-pt*` and `data-cursor` in their markup, only A reads them). B: `[data-pre*]`, `[data-gl-slot]`, `[data-gl-host]`, `[data-hero-*]`. C: `[data-reveal]`, `[data-lines]`, `[data-rule]`, `[data-ink]`, `[data-media]`, `[data-parallax]`, `[data-railway]`, `[data-rail]`, `[data-track]`, `[data-tile-id]`, `[data-bars]`, `[data-case-hero]`, `[data-band-copy]`. C keeps `<div class="gl-host" data-gl-host="band">` as the first child of `.band` and never styles `.gl-canvas`. State-scoped selectors belong to the owner of the state (`html[data-preloader] .nav` is B's).

**CSS custom properties** (`fx-core.css`, read-only for B and C): colour and type tokens as today; `--ease-out`, `--ease-io`, `--ease-soft`, `--ease-xio`; `--d-micro:.25s`, `--d-reveal:.9s`, `--d-wipe:.5s`, `--d-travel:1.1s`. Runtime: `--hero-cover` (B writes on `<html>`, C consumes on its first section), `--rail-p` (C), `--pt-t/r/b/l`, `--pt-x/y/s` (A's head script).
**z-index scale.** `--z-gl:1` · `--z-hero:2` · `--z-sheet:3` (`main > section:not(.hr-stage), .foot`: relative, paper background) · `--z-menu:59` · `--z-header:60` · `--z-cursor:70` · `--z-nav-sheet:88` · `--z-nav-img:89` · `--z-cols:90` · `--z-pre:95` · `--z-pre-gl:96` · `--z-pre-hdr:97` · `--z-switcher:120` · `--z-skip:200`.
**Storage** (all in try/catch): session `rv-pt` (8 s), `rv-origin` (10 min), `rv-intro-seen`; local `rv-variant`, `rv-hero-rect|slug|v|WxH`.
**House rules.** Hidden states by `gsap.set` only, inside `matchMedia` motion-ok · animate transform, opacity, clip-path only · no transform on an ancestor of sticky or fixed · hidden blocks with focusables use opacity plus `inert`, never `autoAlpha` · guarded safety timers · one ticker · never publish a phone number, public email is albertotuveri@gmail.com, numbers only from PRODUCT.md §3 and §9.

**Order inside each package.** A: scaffold → core → S5 → S4 forward → S4 back, bfcache and lock → menu, cursor, links → switcher. B: PoC into `fx-gl.js` with tiers and sleep → hero layout and posters → S3 → S1 → band composition (after `fx:built`). C: partials and base styles → lines, reveals, rules, exits → rail → scroll ink and ledgers → capabilities, path, footer → case page → `restore`.

---

## 10. Acceptance checks

**S1.** Frames every 100 ms from first paint. Must show: header brand fixed in place from frame 1; digits rolling inside fixed cells; a window with live ink before 100; a single continuous window travel from centre to slot while the sheet rolls up; the name rising once. Must not: show the big name inside the preloader; any ghost of hero text through the sheet; a trail restart when the window lands; a layout shift when the sheet goes; block over 5.2 s; appear on a repeat visit, with a hash, on arrival, or with reduced motion.
**S2.** Stills at 1440x900 in V1, V2, V3 and at 390x844. Must show: the letter as a lighter paper shape, legible; streamlines parting round it; accent strokes present but under about 12%; a different A per variant; caption numbers read from the engine. Must not: a dark or accent outline piled against the glyph; strokes inside the letter, its counter or between the legs; stair-stepped lines at DPR 1; any draw call while the hero is covered or the tab hidden (assert `fx:gl:state` sleep and a flat call counter for 1 s); GPU median over 2 ms on tier A; an empty beige rectangle if WebGL2 is off (poster must show).
**S3.** Frames at p = 0, .2, .4, .6, .85, 1 and scrubbed backwards. Must show: lines leaving through their masks while parting; the blade opening to full height, then sweeping left; the A gliding to centre and growing; a straight-edged sheet with a hairline rising over a still-moving plate. Must not: any frame with text over the plate; a canvas resize or a trail reset during the scrub; a jump at pin start or end; the stage active under 1024, with reduced motion or without JS; a focusable hero control reachable while invisible.
**S4.** CDP screencast, click on tile 01, in three variants and on mobile. Must show: neighbours rolling up and captions leaving; one image, one move, landing full-bleed low in the viewport; identical pixels on the last frame before and the first frame after navigation; title rising above the landed image; reverse returning into the same tile at the same rail position. Must not: the image covering the full viewport; a second visible move (settle over 2 px after the cache is warm); a white or empty frame; a header flicker; a rail that slides in after back; a second click starting anything; a stuck overlay after browser Back or Forward (bfcache and non-bfcache both tested); scroll locked 6 s after an aborted navigation.
**S5.** Frames at 150, 300, 450, 850 ms and on arrival at +100, +350 ms. Must show: a paper staircase with hairline tops from the centre; a covered spread with nine column rules, the destination name and the ring; columns leaving from the edges while the new title is already rising. Must not: the label visible over uncovered page content; a dark frame; a gap between columns at fractional widths (overlap 1 px); columns that never enter (the CSS-transform trap); focus reaching the page under the cover.
**Sections.** One screenshot per section per variant, motion on and off: every rule drawn, every figure printed in its final value in the very first frame it is visible (no intermediate numerals in any frame), no text under 16 px, no element left hidden 2.5 s after it enters the viewport, tab order intact through the rail and the ledgers.

---

## 11. Rejected, and why

- **Ink (black) column cover**, as measured by the scout: black ziggurat, then a dead black screen; breaks one-paper. The paper version keeps the gesture.
- **Lusion shape-iris transition:** a rotating dark shutter with a logo mark is Lusion's signature and needs a full dark beat.
- **Barba sheet-shrink:** 2.4 s, scales whole long pages, dark backdrop, reads as an app switcher.
- **ERA window-dive preloader as is:** an 8 to 10 s film with an arch; only its "page under the curtain" principle is kept.
- **Layers clip flip-book preloader, Sticky Grid work wall, Staggered archive grid, scroll-based Flip galleries, One-element travelling photo, Expanding image in typography, Two-plate merge, SVG mask blinds:** all need 5 to 15 strong images; 7 of 9 works have no photograph on file (PRODUCT.md §5, §8). Fake imagery is not an option. Two-plate merge is the first candidate once case media exist.
- **Pixelated image load and WebGL pixel-grid reveal:** on dark UI screenshots they read as a loading fault, and they add a second media vocabulary next to the curtain.
- **Motion-hover bend with RGB shift, Lusion bend plane:** a GL image plane cannot survive a cross-document navigation; planned as the `plane` scene in the SPA port.
- **ERA `horScroll` ease on the rail:** GSAP requires `ease:"none"` on a `containerAnimation` tween (checked in the docs); caption triggers would drift.
- **ERA rotateY char flips:** luxury real-estate voice; the existing manifesto flip goes too.
- **Blurry text reveal, blur-in-up:** `filter: blur` on text is the costliest item in any report, and blur is outside the canon.
- **Scramble labels:** labels are proportional faces in V1 and V3, so the width jitters.
- **Weight-proximity wordmark:** needs a variable font; only V2 has one.
- **Velocity marquee:** repeats the closing sentence; a marquee is a category cliché (PRODUCT.md §7).
- **Dual-wave text:** already shipped in the rejected Golden Hour world.
- **Plate tilt:** a SaaS device-mock gesture; 3D tilt fights a flat printed page.
- **Stacked sheets:** the case chapters here are text ledgers; scaling text sheets under each other hurts reading. Keep for chapters with media.
- **Loupe:** good for production case studies with detailed UI captures; the two captures on file are hero shots.
- **Footer uncover:** Domus removed it for stacking conflicts with sticky set pieces; low value.
- **Replacing the system cursor, magnetic everything, UI sounds:** noise; one label tag and one magnetic target.
- **Cross-document View Transitions:** would give S4 natively in Chromium, but Firefox has no cross-document support and React's `<ViewTransition>` is canary on 19.2 (scout note). Revisit as progressive enhancement in the port.
