# Map · Rivista prototype · core, navigation and chrome (slice A)

Source root: C:/Users/alber/Portfolio/public/proto/rivista/. Files read in full: fx-core.js (392 lines), fx-core.css (360), fx-nav.js (962), fx-nav.css (283), fx-fonts.css (350), assemble.mjs (101), parts/head.html (70), parts/a-header.index.html (33), parts/a-header.case.html (33), parts/a-overlays.html (35), parts/b-preloader.html (12), parts/c-footer.html (25). Skimmed: index.html (468), case.html (305). For section 5 I also read the S1 preloader code in fx-hero.js lines 1-130 and 260-430 and fx-hero.css lines 125-175 (owner WP-B), because the preloader DOM is in my slice but its logic lives there.

Vocabulary: WP-A = navigation (prefix nv-), WP-B = hero/GL/preloader (prefix hr-), WP-C = scroll/text (prefix sc-). "Plan §9" and "plan §5" refer to .wf-out/rivista/fx/EFFECTS-PLAN.md. "Fix" labels (A*, D*, J*, MQ-*) come from .wf-out/rivista/build/reports/review-fix.json.

---

## 1. fx-core.js: the FX namespace

### 1.1 Script order and boot (fx-core.js lines 7-24, 298-392)

All scripts are "defer", in this order (parts/head.html lines 59-69): gsap 3.15.0, ScrollTrigger, SplitText, Flip, CustomEase (all from cdn.jsdelivr.net/npm/gsap@3.15.0/dist/), lenis 1.3.26 (cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js, plus lenis.css), then fx-core.js, fx-gl.js, fx-hero.js, fx-scroll.js, fx-nav.js. At parse time a module only calls FX.register(name, { init, build, onVariant, onResize }).

boot() runs on DOMContentLoaded (or setTimeout 0 if readyState is already "complete"), line 390-391:

1. syncLinks(); mq.motion "change" listener reloads the page (line 301); window "resize" listener (debounced 200 ms, line 254-265) fires each("onResize", {w, h, widthChanged}) then emit("fx:resize").
2. FIX A8 breakpoint anchor (lines 303-335): a scroll listener samples the first visible "main > section, footer" at most every 200 ms and never within 700 ms of a resize; when mq.desktop (min-width: 1024px) changes, after 450 ms it ScrollTrigger.refresh()es, recomputes y = section top + ratio * height, scrollTo(y, {immediate: true}) plus window.scrollTo, ST.update().
3. entry is decided from html attributes: data-preloader -> "intro", data-arrive -> "arrive", else "plain" (line 337).
4. If gsap or ScrollTrigger are missing (hasG false): every module is set "off", html gets fx-off-<name> for each and class fx-static, plainEntry("GSAP is missing...") and return (lines 339-345).
5. G.registerPlugin(ScrollTrigger, SplitText, Flip, CustomEase) (only those present); ST.config({ ignoreMobileResize: true }) (line 349).
6. CustomEase registration (lines 350-354):
   - "domus" = "M0,0 C0.22,0.9 0.36,1 1,1" (the CSS twin is --ease-soft: cubic-bezier(0.22, 0.9, 0.36, 1))
   - "domus.inOut" = "M0,0 C0.66,0 0.22,1 1,1" (CSS twin --ease-io: cubic-bezier(0.66, 0, 0.22, 1))
   - "dtOut" = "0.25,1,0.5,1" (CSS twin --ease-dt: cubic-bezier(0.25, 1, 0.5, 1))
   - not custom but used everywhere: "expo.out" (CSS twin --ease-out: cubic-bezier(0.16, 1, 0.3, 1)) and "expo.inOut" (CSS twin --ease-xio: cubic-bezier(0.87, 0, 0.13, 1)).
7. initLenis() (lines 136-142): only if hasG, window.Lenis and flags.motion. new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, anchors: false, autoRaf: false }); lenis.on("scroll", ScrollTrigger.update); gsap.ticker.add((time) => lenis.raf(time * 1000)); gsap.ticker.lagSmoothing(0). One ticker for the whole page: no other rAF loop is allowed (the AT ring, the header check and the preloader counter all ride gsap.ticker).
8. If entry is not "plain": lock("entry") and a 6000 ms guarded timer that forces plainEntry("entry film did not call FX.ready within 6 s: forced plain entry") (lines 357-361).
9. ctx = { FX, gsap, ScrollTrigger, mm: gsap.matchMedia(), page, variant, entry, arrive: window.__rvArrive || null } (lines 363-368). mm is the shared gsap.matchMedia(): hidden states must be set inside a motion-ok query.
10. await phase("init", ctx, "init") over ORDER = ["gl", "hero", "scroll", "nav"] (extra registered names appended after). Each hook in try/catch; an async hook is raced against 3000 ms and boot continues with a console.warn if slower (lines 210-228). A throwing module gets state "fail", html.fx-fail-<name>, and if name is "scroll" html.rv-ready is removed so the reveal base cannot keep content hidden (lines 196-201).
11. await fonts(entry === "plain" ? 1500 : 900) (line 371).
12. await phase("build", ctx, "built"); ScrollTrigger.refresh(); emit("fx:built", {}) (lines 372-374).
13. Entry handoff: entry "intro" -> FX.hero.intro(); entry "arrive" -> FX.nav.arrive(); a missing owner function or a rejected promise -> fail(owner, fn, err) then plainEntry() (lines 376-387).

### 1.2 Flags (lines 50-64)

mq = { motion: "(prefers-reduced-motion: no-preference)", fine: "(hover: hover) and (pointer: fine)", touch: "(pointer: coarse)", desktop: "(min-width: 1024px)" }. flags.motion / fine / touch / desktop are live getters on matchMedia. flags.gl getter = "WebGL2RenderingContext" in window AND html does not have class gl-off; the setter (used by fx-gl after a failed context or link) toggles html.gl-off.

### 1.3 Event bus (lines 38, 66-85)

- on(evt, fn, opts) / once(evt, fn) / emit(evt, detail). Names are normalised: "ready" becomes "fx:ready". Events are window CustomEvents; the handler receives (detail, event). on() returns an unsubscribe function.
- STICKY = Set("fx:ready", "fx:built", "fx:intro:handoff"): once fired, a late listener is called on the next microtask with the stored detail; a sticky event cannot fire twice (emit returns early).
- emit("fx:ready") is redirected to ready(detail.entry) so it fires exactly once.
- Full event catalogue seen in the slice: fx:ready {entry: "intro" | "arrive" | "plain"}, fx:built {}, fx:intro:handoff {} (emitted by fx-hero), fx:variant {from, to}, fx:lock {locked, reason}, fx:resize {w, h, widthChanged}, fx:nav:start {kind, dir, href, label}, fx:nav:covered {kind: "flip" | "flip-back" | "cols" | "variant"}, fx:nav:uncovered {}, fx:nav:arrived {kind}, fx:nav:reset {}. From other modules and consumed here: fx:gl:state {state: "run" | "off" | ...}, fx:gl:stats {n, gpuMs, dpr}.

### 1.4 Lock ref-count (lines 156-176)

holds = Map(reason -> count). lock(reason = "anon") increments, unlock(reason) decrements (deletes at 0), unlock("*") clears every hold (used by nav reset after an aborted navigation and on bfcache restore). applyLock: toggles html[data-fx-locked], sets document.getElementById("main").inert = locked, lenis.stop() / lenis.start(), emits fx:lock. Reasons in use: "entry" (boot), "menu" (mobile menu), "nav" (a cut or a variant switch). FX.locked getter = any hold.

### 1.5 fonts(), variant, syncLinks (lines 39-43, 87-132)

- FONTS[1] = ['300 1em "Cormorant Garamond"', '500 1em "Cormorant Garamond"', '600 1em "Cormorant Garamond"', 'italic 500 1em "Cormorant Garamond"', '300 1em "Figtree"', '400 1em "Figtree"', '500 1em "Figtree"', '600 1em "Figtree"'] (V2 and V3 lists exist but are dead for the port).
- fonts(ms = 1500, v = variant()): Promise.race of (Promise.all(document.fonts.load(each)).then(() => document.fonts.ready)) against wait(ms). Resolves immediately if document.fonts is missing.
- variant() = html[data-variant] || "1". setVariant(v) (only "1" | "2" | "3"): sets data-variant, localStorage "rv-variant", syncLinks(), await fonts(2500, v), each("onVariant", v), ST.refresh(), emit("fx:variant"). For the port this whole machinery is dropped: V1 is the only identity.
- syncLinks(): rewrites every internal "*.html" href to carry ?v= and the KEEP switches ["chrome", "fx", "gl"], replaceState the current URL with ?v=, and sets aria-pressed on [data-switcher] button[data-v]. Prototype-only.

### 1.6 scrollTo (lines 143-154)

scrollTo(target, { immediate = false, offset = 0, duration = 1.4 }): lenis.scrollTo(target, { immediate, offset, duration, force: true }) when Lenis exists, else window.scrollTo on the measured rect top.

### 1.7 ready / plainEntry (lines 230-251)

ready(entry) is idempotent: clears the 6 s entry timer, unlock("entry"), stores and dispatches fx:ready {entry}. Owners remove their own state attribute first (data-preloader by hero, data-arrive by nav). plainEntry(why) warns, removes data-preloader and data-arrive, removes class rv-pre-run, calls ready("plain").

### 1.8 Public surface (lines 267-296)

window.FX = { flags, on, once, emit, lenis (getter), scrollTo, lock, unlock, locked, fonts, register, exits: [], runExits(detail) (Promise.all over every registered exit, errors swallowed; nav calls it before a cut), gl, hero, scroll, nav (filled by owners in init), variant (getter), setVariant, syncLinks, ready, isReady, page ("home" if html[data-home] else "case"), modules (state copy), has(name), version: "scaffold-1" }.

### 1.9 URL switches and head script (parts/head.html lines 11-49)

Runs inline before first paint: ?v=1|2|3 -> data-variant (default "1", "V1 Carta e cobalto chosen by Alberto on 2026-09-18"); html.rv-js always; html.rv-motion unless prefers-reduced-motion: reduce; html.fx-nochrome unless ?chrome=1 (switcher hidden by default); ?gl=0 -> html.gl-off; ?fx=a,b (read by fx-core) runs only the listed modules (core always on). Arrival record: sessionStorage "rv-pt" is read and removed; accepted only if Date.now() - s.t < 8000 and s.to === location.pathname; otherwise a back_forward navigation entry (performance.getEntriesByType("navigation")[0].type) yields {type: "back", label: "", sub: ""}. When a record exists: html[data-arrive=<type>], window.__rvArrive = record, html.sc-film when type is "flip" (FIX D5), and the geometry is written as CSS custom properties on html.style: --pt-t/--pt-r/--pt-b/--pt-l (px), --pt-x/--pt-y (px), --pt-s (unitless). Preloader gating: data-preloader plus class rv-pre-run and window.__rvT0 = performance.now() only when html[data-home] AND no reduced motion AND no arrival record AND no location.hash AND sessionStorage "rv-intro-seen" is unset. Font preload links for the current variant (V1: the Cormorant variable file, the Figtree variable file, the Cormorant italic file). Finally --hd = "1.85s" under the preloader, "0.45s" on an arrival, "0.15s" plain (the delay of the CSS first-paint films).

### 1.10 Reduced motion handling

Three layers: (a) the head script leaves html.rv-motion off, so every CSS film keyed on html.rv-motion never starts; (b) fx-core.css section 10 kills all animation and transition durations to 0.001ms under prefers-reduced-motion: reduce and neutralises .frame-inner.over; (c) FX.flags.motion false means: no Lenis, no AT ring tick, no label cursor, no magnet, the menu and the covers fall back to 0.15-0.2 s opacity fades, the S4 flip forward still runs but as a set-and-fade (flipForward under !motion) and flipBack refuses. A live change of the media query reloads the page (line 301).

### 1.11 Port verdict, item by item

| Prototype piece | In the Next/React port |
|---|---|
| Module registry, ORDER, phase("init"/"build"), ?fx= switch, fx-off-* / fx-fail-* classes, fx-static | Drop. React component tree plus useGSAP replaces the registry. Keep the principle: content is never hidden unless the owning effect is mounted (hidden states only via gsap.set inside a matchMedia motion query). |
| Lenis on gsap.ticker, lagSmoothing(0), lenis.on("scroll", ST.update) | Already exists in src/app/_providers/Smooth.tsx. Keep, verify the Lenis options match (lerp 0.1, smoothWheel, wheelMultiplier 1, anchors false, autoRaf false). |
| flags (motion, fine, touch, desktop, gl) | A useMediaFlags() hook or a small zustand slice; gl flag becomes part of the existing heroStore. |
| Event bus with sticky events | Replace with zustand store state (ready, built, introHandoff booleans plus navigation phase). Sticky semantics come for free from state. |
| lock ref-count (data-fx-locked, main.inert, lenis.stop/start) | A useScrollLock(reason) hook or store action pair; keep the ref-count and the "*" reset. |
| fonts() | next/font/google makes the faces self-hosted and preloaded; keep a document.fonts.ready race (900/1500 ms) before the intro timeline only. |
| variant, setVariant, syncLinks, switcher | Drop entirely; V1 tokens only. |
| CustomEase "domus", "domus.inOut", "dtOut" | Register once in src/lib/gsap.ts (which today registers rule/stamp/sheet: replace). |
| ST.config({ ignoreMobileResize: true }) | Keep, in gsap.ts. |
| prefers-reduced-motion change -> reload | Drop; use gsap.matchMedia() queries and the existing data-motion="reduced" attribute in Smooth.tsx. |
| A8 breakpoint anchor | Keep as a hook if the port keeps pinned stages that rebuild at 1024 px; otherwise drop. |
| 6 s entry guard, 3 s async-hook guard, failsafe CSS animations | Keep the idea as timeouts inside the preloader and transition components. |
| head script (variant, rv-motion, arrival record, --pt-*) | The cross-document arrival record disappears in an SPA (see section 4.9). The preloader gate (once per session, home only, no hash, no reduced motion) becomes a sessionStorage check in the Preloader component; rv-motion becomes the data-motion attribute. |
| ready / plainEntry | Store action "ready(entry)". |

---

## 2. CSS tokens for V1 (fx-core.css) and the primitives

### 2.1 Colour (fx-core.css lines 29-52, selector ":root, html[data-variant="1"]")

--paper: #f6f3ec · --paper-deep: #ede7dc · --ink: #24211e · --graphite: #48443e · --stone: #6b665d · --line: #dcd5c8 · --accent: #2340c9 · --accent-dark: #1a2f99 · --on-accent: #ffffff.

Roles observed: paper = page and sheets; paper-deep = header when solid, menu and cover columns, media frame ground; ink = text, hairline on skip link; graphite = lead and body copy; stone = labels, captions, lang toggle; line = every hairline; accent = links hover, eyebrow, ornament, focus ring, selection background, buttons; accent-dark = button hover fill.

### 2.2 Type tokens (lines 40-51, 94-115)

--f-display: "Cormorant Garamond", "CG Fb", "Times New Roman", serif · --f-text: "Figtree", "Figtree Fb", system-ui, sans-serif · --f-orn: "Cormorant Garamond", "CG Fb", serif · --w-display: 500 · --w-hero: 600 · --lh-display: 0.92 · --tr-display: 0em · --tr-hero: -0.01em · --display-scale: 1.1 · --ch-t: 0.638em (width of "0" in Figtree) · --ch-d: 0.477em (width of "0" in Cormorant) so measures set in ch never re-wrap on a font swap (FIX D4 / MQ-07).

Scale (":root", lines 94-108):
- --t-hero: clamp(3.1rem, 13vw, 13rem)
- --t-page: calc(clamp(3rem, 8vw, 9rem) * var(--display-scale))
- --t-d1: calc(clamp(2.4rem, min(10vh, 6.5vw), 7.5rem) * var(--display-scale))
- --t-d2: calc(clamp(2.3rem, min(6.4vh, 4.2vw), 4.5rem) * var(--display-scale))
- --t-d3: calc(clamp(1.5rem, min(4.5vh, 2.8vw), 2.6rem) * var(--display-scale))
- --t-d4: clamp(1.45rem, 1.8vw, 1.75rem)
- --t-lead: clamp(1.35rem, 1.72vw, 1.55rem)
- --t-body: 1.1875rem

Spacing: --pad: 8vw (5vw below 768) · --gut: 6vw · --chap: clamp(6rem, 14vh, 11rem) (clamp(4rem, 10vh, 6rem) below 768) · --hdr: clamp(4.5rem, 10vh, 6rem) (4.25rem below 768). Breakpoints used: 767.98px max (phone), 1023.98px max / 1024px min (desktop), 768px min (tablet grid). [id] { scroll-margin-top: 6.5rem }.

### 2.3 Motion tokens and z scale (lines 118-153)

Eases: --ease-out: cubic-bezier(0.16, 1, 0.3, 1) · --ease-io: cubic-bezier(0.66, 0, 0.22, 1) · --ease-soft: cubic-bezier(0.22, 0.9, 0.36, 1) · --ease-xio: cubic-bezier(0.87, 0, 0.13, 1) · aliases --ease-expo = --ease-out, --ease-domus = --ease-soft, --ease-domus-inout = --ease-io · --ease-dt: cubic-bezier(0.25, 1, 0.5, 1). Durations: --d-micro: 0.25s · --d-reveal: 0.9s · --d-wipe: 0.5s · --d-travel: 1.1s.

z scale: --z-gl: 1 · --z-hero: 2 · --z-sheet: 3 · --z-menu: 59 · --z-header: 60 · --z-cursor: 70 · --z-nav-sheet: 88 · --z-nav-img: 89 · --z-cols: 90 · --z-pre: 95 · --z-pre-gl: 96 · --z-pre-hdr: 97 · --z-switcher: 120 · --z-skip: 200.

Runtime properties written by JS: --hero-cover (hero, on html), --rail-p (scroll), --pt-t/r/b/l and --pt-x/y/s (head script), --hd (head script and handoff()).

### 2.4 Base (lines 156-196)

html { overflow-x: clip; scrollbar-color: var(--stone) var(--paper) }; html.lenis and html.lenis body { height: auto }; .lenis.lenis-smooth { scroll-behavior: auto !important }; .lenis.lenis-stopped { overflow: hidden }. body: background var(--paper), color var(--ink), font-family var(--f-text), font-size var(--t-body), weight 400, line-height 1.5, antialiased, transition background-color 0.3s var(--ease-soft). Resets: img block max-width 100%; a color inherit; p/h1-h4/ol/ul/figure margin 0; lists no padding, list-style none. ::selection { background: var(--accent); color: var(--paper) }. :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 0 }. main[tabindex="-1"]:focus, section[tabindex="-1"]:focus { outline: none } (FIX A5). .sr-only standard clip pattern. .skip: fixed, left var(--pad), top 0.75rem, z var(--z-skip), paper background, 1px ink border, translateY(-200%) until :focus, font 600 1rem/1.2 uppercase 0.08em, min-height 44px (FIX A10).

### 2.5 Type classes (lines 199-255)

- h1, h2, h3 { font-weight: var(--w-display); text-transform: uppercase } · h4 { 400, uppercase }.
- .display, .d1, .d2, .d3: font-family var(--f-display), weight var(--w-display), letter-spacing var(--tr-display), uppercase, lining-nums. .d1 size --t-d1 line-height --lh-display · .d2 --t-d2 / 0.95 · .d3 --t-d3 / 1.05.
- .d4: --f-text, --t-d4, weight 300, line-height 1.2, uppercase, letter-spacing 0.01em.
- .page-title: --t-page / --lh-display.
- .lead: --t-lead, 300, 1.4, graphite, max-width calc(var(--ch-t) * 50).
- .body: --t-body, 1.5, graphite, max-width calc(var(--ch-t) * 60).
- .label: --f-text 1rem 600 / 1.3, uppercase, letter-spacing 0.08em (the house label style, also used by .btn, .ghost, .brand-name, .nav a, .menu-btn, .nv-cursor).
- .stone { color: var(--stone) } · .ui { 1rem / 1.4 }.
- .eyebrow: inline-flex, gap 0.5rem, accent colour, ::before 1.75rem x 1px currentColor at opacity 0.6.
- .stair: children spans display block; second line padding-left 0.62em, third 1.7em (.sc-l2 / .sc-l3 twins for post-SplitText markup); .stair-r right aligned with padding-right instead.
- .ornament: block, z 2, --f-orn italic 500, no transform, accent, size calc(var(--t-d2) * 1.25), line-height 1, margin -0.42em 0 0 34vw (phone: -0.12em / 40vw, FIX A12), pointer-events none. .orn-rule is V2 only (display none in V1).

### 2.6 Layout (lines 258-276)

.row { padding-inline: var(--pad) } · .chapter { padding-block: var(--chap); position: relative } · .head > * + * { margin-top: 2rem } and .head > .eyebrow + * { 1.5rem } · .split grid gap clamp(3rem, 8vh, 6rem) var(--gut); at 1024px columns 1fr 1.1fr centred, .s-57 = 5fr 7fr, .s-75 = 7fr 5fr. Sheet rule: :where(main > section:not(.hr-stage), .foot) { position: relative; z-index: var(--z-sheet); background: var(--paper) } (every section after the hero stage is an opaque paper sheet above the GL plate; zero specificity so .band can override).

### 2.7 Buttons and links (fx-core.css 279-305, fx-nav.css 145-179)

- .btn: inline-flex, gap 0.6rem, label font, padding 1.05rem 2rem, 1.5px accent border, accent fill, --on-accent text; fx-nav adds position relative, overflow hidden, z 0, and a ::before layer in --accent-dark with clip-path inset(0 100% 0 0) that opens to inset(0) in 0.35s var(--ease-out) on hover/focus-visible (a left-to-right fill wipe replaces the flat colour swap); :active scale(0.98) 0.12s; svg 1.1em; on fine pointer the arrow plays nv-arrow 0.3s var(--ease-io) (0%: none; 44%: translate(0.75em, -0.75em) opacity 0; 45%: translate(-0.75em, 0.75em) opacity 0; 100%: none), i.e. the arrow leaves top-right and re-enters bottom-left.
- .ghost: inline-flex, gap 0.5rem, padding 0.4rem 0, ink, label font, colour transition 0.3s soft; two 1.5px hairlines at bottom 0.05rem: ::before ink at opacity 0.9 shrinks from the right (transform-origin right center, 0.3s soft) while ::after accent grows from the left (scaleX 0 -> 1, 0.3s soft, delay 0.08s); text turns accent. .ghost.big = 300 var(--t-d4)/1.2 no uppercase, spacing 0.01em; .ghost.plain-case = no uppercase, 400. The mailto ghost has its own curves: ::before 0.3s cubic-bezier(0.7, 0, 0.2, 1), ::after 0.4s cubic-bezier(0.2, 1, 0.8, 1) 0.1s.
- .link-draw and .foot li a:not(.btn):not(.ghost): a printed 1px --line rule as background-image at 0 100%, plus a ::after currentColor 1px that scales in from the left in 0.35s soft on hover/focus-visible.
- @media (pointer: coarse) { .btn, .ghost { min-height: 2.75rem } }.

### 2.8 Media base (lines 308-324)

.frame { position: relative; overflow: hidden; background: var(--paper-deep) } · ratios .r-169, .r-11, .r-32, .r-45 · .frame-inner { position: absolute; inset: 0 } and .frame-inner.over { transform: scale(1.12) } (the over-scale the S4 target estimate assumes, k = 1.12) · .frame img cover · .media-full margin-top clamp(2rem, 5vh, 3.5rem) · .caption-row flex wrap, gap 0.25rem 2rem, space-between, padding-top 1rem, 1rem/1.4 stone, with .label in ink.

### 2.9 Reveal base and first-paint films (lines 330-349)

html.rv-ready.rv-motion [data-reveal] { opacity: 0; transform: translateY(2.5rem); transition: opacity/transform var(--d-reveal) var(--ease-out) } -> .is-in restores; below 1024 the offset is 1.5rem. rv-ready is set only by fx-scroll in the same tick it wires the IntersectionObserver, and removed by core if scroll fails. Ornament film: html.rv-motion .ornament { animation: rv-orn 1.4s var(--ease-out) calc(var(--hd, 0.15s) + 0.55s) both } (from opacity 0 translateX(6vw)); under [data-hero-now] the -b twin with delay 0.4s. Shared keyframes declared here: rv-orn, rv-orn-b, rv-rise / rv-rise-b (translateY(108%) -> none), rv-fade-up / rv-fade-up-b (opacity 0 translateY(2.5rem) -> visible). Rule: set animation: none on the element before a GSAP tween because "both" fill outranks inline styles.

### 2.10 Masks and nav primitives (fx-nav.css)

- .nv-roll: inline-block, relative, overflow hidden; > span { display block; transition transform 0.45s var(--ease-out) }; the second span is absolute at translateY(100%); on fine-pointer hover/focus-visible the first goes to translateY(-100%) and the twin to 0 (word roll). Under reduced motion the twin is display none and hover falls back to underline.
- .nv-cursor (built by JS): fixed, z --z-cursor, pointer-events none, paper background, 1px ink border, padding 0.25rem 0.6rem, 500 1rem/1.75rem label font, opacity 0 by default (FIX MQ-10: no permanent layer); .nv-cursor_m mask height 1.75rem; hidden hard under html[data-fx-locked].
- Metric-matched fallback faces (fx-core.css lines 17-20, V1 only): "CG Fb" = local Times New Roman with size-adjust 96.3%, ascent-override 95.9%, descent-override 29.8%, line-gap-override 0% (italic: 87% / 106.2% / 33%); "Figtree Fb" = local Arial, weight 100-550: size-adjust 100.5%, ascent 94.5%, descent 24.9%; weight 551-900 = Arial Bold: 95.3% / 99.7% / 26.2%. These give CLS 0 during the swap. With next/font/google the adjustFontFallback option generates the same thing automatically.
- Owned by WP-C but used by the footer partial: .sc-rule (absolute 1px --line hairline, transform-origin left, drawn by JS under motion), .sc-rule-bleed (extends by -var(--pad) both sides), .sc-rise (display block, a rise through its own mask), .sc-draw (::after 1px currentColor underline drawn left to right 0.35s soft).

### 2.11 Prototype-only CSS to drop

.var-only / .v1 .v2 .v3 (variant-conditional copy), html.fx-nochrome, .switcher and everything in fx-nav.css section 7, html[data-variant="2"|"3"] blocks, the Geist / Hanken / Instrument fallback faces.

---

## 3. fx-fonts.css and what the Next port needs

fx-fonts.css is a copy of the Google Fonts CSS served from the prototype origin (FIX A9 / MQ-07 / D4) so the stylesheet is not a render-blocking cross-origin request; the woff2 files still come from fonts.gstatic.com with font-display: swap, latin and latin-ext subsets only (unicode-range blocks quoted at lines 16 and 25). Every rule is font-display: swap.

V1 faces declared (lines 10-152):
- Cormorant Garamond italic 500: latin-ext co3smX5slCNuHLi8bLeY9MK7whWMhyjYrGFEsdtdc62E6zd5wDD-htM8Efs.woff2, latin co3smX5slCNuHLi8bLeY9MK7whWMhyjYrGFEsdtdc62E6zd5wDD-iNM8.woff2 (path s/cormorantgaramond/v21/).
- Cormorant Garamond normal 300, 500, 600: all three weights point to the same two files, latin-ext co3bmX5slCNuHLi8bLeY9MK7whWMhyjYp3tKgS4.woff2 and latin co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.woff2 (one variable file per family, as the head comment says).
- Figtree normal 300, 400, 500, 600: all four point to latin-ext s/figtree/v9/_Xms-HUzqDCFdgfMm4q9DbZs.woff2 and latin _Xms-HUzqDCFdgfMm4S9DQ.woff2 (variable file).
- V2 (Geist, Geist Mono) and V3 (Hanken Grotesk, Instrument Serif) rules at lines 153-350 are dead for the port.

The head script preloads for V1 exactly three files: cormorantgaramond/v21/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.woff2, figtree/v9/_Xms-HUzqDCFdgfMm4S9DQ.woff2, cormorantgaramond/v21/co3smX5slCNuHLi8bLeY9MK7whWMhyjYrGFEsdtdc62E6zd5wDD-iNM8.woff2 (latin only) with rel=preload as=font crossorigin, plus a preconnect to fonts.gstatic.com.

Font usage: Cormorant Garamond weight 500 for display (.d1/.d2/.d3, page-title, mark-mono), 600 for the hero lockup and the preloader counter (--w-hero), italic 500 for the ornament; weight 300 appears only in the FX.fonts wait list ("Cormorant 300 in wait list" in FIX.progress) and in no CSS rule of this slice. Figtree 300 (d4, lead, ghost.big, menu mail), 400 (body), 500 (nav links, cursor), 600 (labels, buttons, brand, menu button).

For the port, next/font/google replaces all of this: Cormorant_Garamond with weight ["300", "500", "600"], style ["normal", "italic"], subsets ["latin", "latin-ext"], display "swap", variable "--f-display" (and reuse it for --f-orn); Figtree with weight ["300", "400", "500", "600"] or the variable axis, subsets ["latin", "latin-ext"], display "swap", variable "--f-text". Next self-hosts the files and emits size-adjust fallbacks (adjustFontFallback, on by default), so fx-core.css section 0 and the preload links are not needed. Keep the --ch-t / --ch-d tokens for measures (they depend only on the real faces). The current src/app/layout.tsx loads Archivo: replace it. Verify the API surface against Context7 for Next 16 before writing (the variable name option and the weight array form).

---

## 4. fx-nav: every feature, DOM contract and timeline

### 4.1 Init and DOM contract (fx-nav.js lines 917-961)

init(ctx) resolves: colsRoot = [data-nv-cols], colsGrid = .nv-cols_grid inside it, colEls = its ten "i" children, labelEl = [data-nv-label], subEl = [data-nv-sub], sheetEl = [data-nv-sheet], imgEl = [data-nv-img], imgTag = img inside it. It registers capture-phase listeners: click / keydown / pointerdown -> swallow (blocks every input while state.busy; keydown only Enter, Space), click -> onClick, window pageshow -> onPageShow, pagehide -> clear the safety timer. Then initHeader, initHandoff, initRing, initMenu, initSpy, initCursor, initSwitcher, initPrefetch, and FX.nav = { go, cover, uncover, arrive, reset, state } where state = { busy, kind, dir, entry }.

build(ctx): initMagnet(); on the case page FX.once("fx:ready") then setTimeout(cacheHero, 1500); on the home page warmHeroSrc() for the first a[data-pt="flip"][href]; if no data-arrive, set html[data-nv-live] (this switches off the CSS failsafe animations on the overlays). onVariant clears the columns' transform; onResize calls clearOverlays() when not busy.

### 4.2 Header behaviour on scroll (lines 113-150, fx-nav.css 12-34)

DOM: header.hdr[data-hdr], fixed, inset 0 0 auto 0, z --z-header, height --hdr, flex space-between, padding-inline --pad, transparent background, transition background-color 0.3s soft and transform 0.55s io; ::after is the bottom hairline (1px --line, scaleX 0, origin left, transition transform 0.6s out). States: .is-solid -> background --paper-deep and the hairline draws left to right; .is-hidden -> translateY(-101%).

Logic runs on gsap.ticker (one scrollY read per tick, no-op while unchanged): is-solid when (y > 24 and not over the plate) or the menu is open. Hide/show only when the menu is closed and no cut is running: over the S3 plate always hidden; on the first read hidden if y > 360; scrolling down by more than 4 px with y > 360 hides; scrolling up by more than 4 px or y < 360 shows. Plate window: stageA = top of .hr-stage[data-on] + 0.08 vh, stageB = top + 2 vh - 2 px, measured on ScrollTrigger "refresh" and fx:built. focusin on the header always shows it. This ports to a small hook that subscribes to Lenis scroll (or the ticker) and toggles two classes; the plate window depends on the S3 stage of the hero slice.

Brand: a.brand (inline-flex, gap 0.85rem, min-height 44px) with .mark (44 x 44, 38 on phones) holding svg.mark-ring (the AT ring: 60 tick lines on a 96 x 96 viewBox, 4 cardinal ticks at stroke 1.4 opacity 0.9 and 56 at stroke 1 opacity 0.5) and .mark-mono "AT" (--f-display, --w-display, 17px, 15px on phones). .brand-name 600 1rem uppercase 0.08em.

### 4.3 Nav links, underline and word roll (lines 152-183, fx-nav.css 36-67)

nav.nav[aria-label="Primary"] shows above 1024 px (display none below); gap clamp(1.25rem, 2.4vw, 2.5rem). Each link is 500 1rem uppercase 0.08em, padding-left calc(1.25em + 0.55rem) reserving room for the accent dash: ::before 1.25em x 1.5px --accent, scaleX 0 origin left, transition 0.45s out; a[aria-current="true"]::before scales to 1 (FIX MQ-12: the room is reserved so no word moves). There is no underline on desktop links: the "underline" is this dash. .nav .lang is stone with the active language in ink 600.

Scroll spy (initSpy): links with data-nv-sec="work" | "path" | "contact" map to the ids in their href hash; an IntersectionObserver with rootMargin "-45% 0px -50% 0px" sets aria-current="true" on the one whose section crosses the middle band. Handoff (initHandoff, requested by WP-B): on fx:intro:handoff the first span of each .nav a .nv-roll and of .menu-btn .nv-roll rises fromTo yPercent 110 -> 0, 0.7 s expo.out, stagger 0.06, clearProps transform; .nav .lang fades 0 -> 1 in 0.7 s with delay 0.06 * items.length.

### 4.4 Mobile menu (lines 185-250, fx-nav.css 69-131)

DOM: button.menu-btn[data-menu-btn][aria-expanded][aria-controls="menu"][aria-label="Open the menu"] with an .nv-roll of "Menu" / "Close" (min-width 4.6em, height 1.2em); div.menu#menu[data-menu][role="dialog"][aria-modal="true"][aria-label="Menu"][hidden] containing .nv-menu_cols (five "i" paper-deep columns with 1px --line left borders and a 1px paper-deep box-shadow to hide sub-pixel seams; fixed inset var(--hdr) 0 0 0, pointer-events none) and .nv-menu_in (relative, min-height 100%, padding 2rem var(--pad) 4rem, column flex) with the list and .menu-foot. Menu is fixed inset var(--hdr) 0 0 0, z --z-menu (59, under the header at 60), overflow-y auto, overscroll-behavior contain, visibility hidden unless .is-open or .is-closing. The menu button is shown only below 1024 px.

Open (set(true)): menuOpen, .is-open on menu and button, aria-expanded true, aria-label "Close the menu", header forced .is-solid and shown, FX.lock("menu"), .foot / [data-switcher] / .skip set inert (FIX A3); columns fromTo yPercent -101 -> 0, 0.45 s domus.inOut, stagger { each: 0.03, from: "end" }; .nv-menu_in opacity is set 0 then switched to 1 at 0.4 s in one step (FIX MQ-06) so the CSS rises are seen on paper: each li::after hairline draws scaleX 0 -> 1 in 0.7 s out with delay calc(0.18s + var(--k) * 0.06s), each .mi word rises translateY(110%) -> 0 in 0.8 s out with delay calc(0.42s + var(--k) * 0.06s) (--k is the li index, set by JS). First focusable link receives focus after 120 ms.
Close (set(false)): .is-closing, inner fades to 0 in 0.12 s, columns to yPercent -101 in 0.3 s domus.inOut, stagger { each: 0.02, from: "start" }, delay 0.08; on complete .is-closing is removed and inner opacity cleared; FX.unlock("menu"). Reduced motion: 0.15 s opacity fades. Keyboard: Escape closes and focuses the button; Tab is trapped on the ring [btn, ...visible menu links] (FIX A3); crossing to min-width 1024px closes it; any click on a link inside closes it. Menu lists: numbered 01 / 02 / 03 in .nv-menu_n (2.2em wide, stone, tabular-nums); links are .d2 with baseline flex and padding 1.1rem 0; .menu-foot pushes to the bottom with padding-top clamp(2.5rem, 7vh, 4.5rem); .nv-menu_mail is 300 var(--t-lead)/1.25 ink with a 1px ink underline that retracts to the right on hover; .nv-menu_else is a flex row gap 1.75rem margin-top 1.25rem; .nv-menu_lang margin-top 1.25rem.

### 4.5 AT ring, label cursor, magnet (lines 88-111, 252-297)

Ring: ring = { speed: 30, rot: 0, els: all .mark-ring }; tickRing on gsap.ticker rotates by speed deg/s (dt capped at 100 ms) and writes style.transform = rotate(Ndeg) to every ring (header mark and the cover's copied mark). ringTo(v, dur) tweens speed with ease "domus"; ringFast = 240 deg/s in 0.3 s (during a cut), ringSlow = 30 in 1.1 s. With Lenis, scroll velocity drives speed = min(420, 30 + 10 * |velocity|) in 0.3 s and returns to slow 100 ms after the last scroll event, unless a cut is running.
Label cursor (fine pointer and motion only): a div.nv-cursor with .nv-cursor_m > span appended to body; quickTo x and y (0.45 s, power3) following the pointer at +18 px; the label is read from the nearest [data-cursor] ancestor of the pointer target (values in use: "Open", "Visit", "Next"); shows with a 0.15 s opacity and the word rises fromTo yPercent 100 -> 0 in 0.25 s expo.out; hides on window blur, document pointerleave, no target, or while busy.
Magnet: the one [data-band] a[href^="mailto:"] (unless it already has data-magnetic, driven by WP-C): quickTo x/y 0.5 s power3, offset = (dx * 0.28, dy * 0.6) clamped to plus or minus 12 px, released on pointerleave.

### 4.6 S5 "Tendina" column wipe (lines 299-348, fx-nav.css 182-200)

DOM: div.nv-cols[data-nv-cols][aria-hidden] fixed inset 0 z --z-cols (90), overflow hidden, visibility hidden, pointer-events none; .nv-cols_grid (absolute flex) with ten "i" columns (flex 1 1 0, background --paper-deep, border-left 1px --line, border-top 1px --stone, box-shadow 1px 0 0 --paper-deep); below 768 px the 6th to 10th are display none (five columns). .nv-cols_copy fills the overlay, padding 0 var(--pad) 12vh, content justified to the bottom: span.mark.nv-cols_mark[data-nv-mark] (the ring copied from the header at parse time, positioned top calc(var(--hdr) / 2 - 22px) left var(--pad)), p.nv-cols_label.d1 > span[data-nv-label] (overflow hidden mask, padding 0.08em 0 0.02em), p.nv-cols_sub.label > span[data-nv-sub] (margin-top 1rem, stone, masked).

Parameters: colCount = 5 below 768 else 10; colStep = 0.045 s below 768 else 0.035 s.

cover({label, sub, dir}) timeline: t = 0 columns fromTo yPercent (dir "back" ? -101 : 101) -> 0, 0.5 s domus.inOut, stagger { each: colStep, from: "center" }; t = 0.5 label fromTo yPercent 112 -> 0, 0.6 s expo.out; t = 0.6 sub fromTo yPercent 112 opacity 0 -> 0 / 1, 0.3 s none; t = 0.7 resolve (commit while the label is still settling so the arrival paints it finished). Reduced motion: everything set, 0.2 s opacity fade in.

uncover({dir}) timeline: t = 0 label and sub to yPercent (dir "back" ? 112 : -112), 0.35 s power2.in; t = 0.1 columns to yPercent (dir "back" ? 101 : -101), 0.55 s domus.inOut, stagger { each: colStep, from: "edges" }; onComplete hides the root, clears transforms, emits fx:nav:uncovered. Reduced motion: 0.2 s opacity fade out.

### 4.7 S4 "Stacco" match cut, forward (lines 350-471, fx-nav.css 203-233)

Overlays: div.nv-sheet[data-nv-sheet] fixed inset 0 z --z-nav-sheet (88) background --paper hidden; div.nv-img[data-nv-img] fixed inset 0 z --z-nav-img (89) overflow hidden hidden, containing img[alt=""][decoding="sync"][fetchpriority="high"]. The img is an uncropped cover box of the viewport at the capture's own aspect --pt-ar (default 1.6): width max(100vw, calc(100vh * ar)), height max(100vh, calc(100vw / ar)), centred by negative margins so GSAP owns transform exclusively (a fix from r4: CSS translate was being folded into the GSAP transform).

Geometry helpers: boxToInset(rect) -> {t, r, b, l} distances from the viewport edges (clamped at 0); insetOf -> "inset(tpx rpx bpx lpx)"; coverXf(box, nw, nh) -> {x, y, s} = the translate and scale that make the viewport-covering image show the same object-fit: cover crop it shows inside box (Sv = max(vw/nw, vh/nh), St = max(box.w/nw, box.h/nh), s = St / Sv, x/y = box centre minus viewport centre).

heroTarget(path): reads localStorage "rv-hero-rect|<path>|<variant>|<w>x<h>" ({f: frame rect, i: image rect, n: natural size}); cold cache estimate = full-bleed 16:9 frame whose top sits at 0.69 vh, with the image over-scaled by k = 1.12 (matches .frame-inner.over). cacheHero() writes that record on every case visit at rest (scrollY <= 4), 1.5 s after fx:ready, plus localStorage "rv-hero|<path>" = the hero img currentSrc. warmHeroSrc(path): on the home page, once, in requestIdleCallback (timeout 1200) fetches the case HTML and regexes data-case-hero ... <img src> into "rv-hero|<path>", so the tile can be validated against the destination hero (stem() strips "-1600w.webp"-style suffixes so different srcset widths match).

flipForward(a, url, label, sub, commit): requires the tile img (a .tile-media or the link itself as frame), imgEl, a known hero src whose stem equals the tile's data-pt-hero or src, and a complete image. Sets imgTag.src, starts toData(src) (fetch as blob, under 160000 bytes, to a data URL; FIX D5: the next document otherwise revalidated the capture and painted blank for about 300 ms). Sets the overlay to the tile's clip inset and cover transform, shows the sheet. Writes lastOrigin and sessionStorage "rv-origin" = { tileId (from [data-tile-id]), rect {t (page y), l, w, h}, railLeft (nearest horizontal scroller scrollLeft), railP (FX.scroll.railProgress()), scrollY, v, w, h, t }. Timeline: t = 0 the other .tile-media roll up to clip-path inset(0 0 100% 0) in 0.45 s domus.inOut, stagger { each: 0.04, from: idx of this tile }; t = 0 clip object cur tweens to the target inset over 1.1 s domus.inOut (onUpdate writes imgEl.style.clipPath); t = 0 imgTag x/y/scale to the target cover transform, 1.1 s domus.inOut; t = 0.12 sheet fromTo clip inset(100% 0 0 0) -> inset(0) in 0.6 s domus.inOut (a paper sheet rises under the image); t = 0.8 commit(record()) (FIX MQ-03: mid-flight commit, the arrival finishes the move); deadline setTimeout 1500 ms. record() = { type: "flip", src, data, label, sub, rect: current inset, x, y, s: current transform }. Reduced motion: set final state and fade the sheet in 0.15 s then commit.

### 4.8 S4 back cut (lines 473-520)

flipBack: needs [data-case-hero] with an img, motion on, the hero at least 20% visible (ratioOf, FIX D3), a "rv-origin" younger than 600000 ms (10 min) recorded at the same viewport size and variant, and a complete image. From = the visible hero slice; to = the tile rect from the origin, translated by the origin scrollY (boxFrom(org.rect, org.scrollY)). Timeline: t = 0 sheet fromTo inset(0 0 100% 0) -> inset(0), 0.5 s domus.inOut; t = 0 clip to the tile inset, 1.0 s domus.inOut; t = 0 image transform, 1.0 s domus.inOut; t = 0.75 commit; deadline 1500 ms. record type "flip-back" also carries tileId, scrollY, railLeft, railP and dest (the target inset).

### 4.9 go(), commit, abort, lock/unlock (lines 522-567, 776-841)

onClick (capture phase): ignores modified clicks, targets other than _self, downloads, cross-origin; same-path links with a hash call anchorTo(hash) (closes the menu, Lenis scrollTo with duration 1.4 or immediate under reduced motion, then gives the target section tabindex -1 and focuses it after 60 ms, FIX A5; "#top" scrolls to 0); only paths matching /\/proto\/rivista\// are intercepted, everything else is a normal navigation.

go(a): state.busy = true synchronously, FX.lock("nav"), chromeInert(true) (header, menu, footer, switcher, skip get inert; core already made main inert), closeMenu(), cursorHide(), ringFast(). Reads data-back (dir "back" else "fwd"), data-pt-label, data-pt-sub. commit(rec) runs once: writes rec.to = pathname and rec.t = Date.now() into sessionStorage "rv-pt" then location.href = url. Safety: 6000 ms timer calls reset() unless document.hidden (a navigation that never happens must not wall the page). FX.runExits({dir}) lets other modules play their exits. Kind selection: data-pt="flip" and motion and flipForward succeeds -> "flip"; data-back and flipBack succeeds -> "flip-back"; flip without motion -> "flip" (static); otherwise "cols" (cover then commit with type "cols" or "back", with a 1300 ms deadline, 500 ms under reduced motion). Emits fx:nav:start then fx:nav:covered.

reset(): clears the timer, busy false, chromeInert(false), clearOverlays() (kills tweens, hides sheet/img/cols, clears clip-path/opacity/transform), removes data-arrive, ringSlow(), FX.unlock("*"), emits fx:nav:reset.

### 4.10 arrive() (lines 569-774)

Called by core when html[data-arrive] is set. Reads window.__rvArrive, sets html[data-nv-live] (stops the CSS failsafes), state.entry = type. finish() = remove data-arrive, busy false, chromeInert(false), ringSlow, emit fx:nav:arrived, FX.ready("arrive"); a 4000 ms guard calls clearOverlays + finish.

Flip and flip-back arrivals: the overlay is set from the record (clip inset a.rect, transform a.x/a.y/a.s, sheet visible at inset(0)); for back, the scroll position is restored via FX.scroll.restore({y, railP}) when it exists, else ST.refresh + Lenis immediate scrollTo + window.scrollTo + ST.update; forward arrivals call scrollToHash(). host = the case hero [data-case-hero] (fwd) or [data-tile-id="<id>"] .tile-media (back); a horizontal rail is re-scrolled to a.railLeft. If the real img stem matches a.src: host gets data-nv-arrived (WP-C skips that figure's curtain); await Promise.race(real.decode(), 900 ms) then one rAF; FIX MQ-02: if the restored scrollY drifted by more than 2 px it is re-applied (and setRailProgress(a.railP)); measure want (host inset) and wantXf; drift = max edge difference between the record rect and want; miss = for back only, the difference between want and a.dest (exposed as window.__nvDrift / __nvMiss for the capture harness). Forward: the sheet is hidden and finish() is called at once (FIX D5: the title rises while the image settles), the host is hidden until the swap. If miss > 40 px: finish, wait until painted(host) (up to 1200 ms), then 0.25 s opacity dissolve of image and sheet (never a second slide). Else if drift > 2: settle the clip and transform in 0.42 s ease "domus"; else set. Then finish(), await painted(host) (visibility, opacity >= 0.95 and no clip-path larger than 1 px on the host and its first 8 descendants), two rAFs, hide overlay and sheet in the same frame, restore the other tiles fromTo inset(0 0 100% 0) -> inset(0) in 0.6 s domus.inOut stagger 0.04 from the host index. No stem match: finish, image fades 0.35 s and the sheet leaves upward inset(0 0 100% 0) in 0.55 s domus.inOut at 0.1 (0.15 s each under reduced motion).

S5 arrivals (type "cols" or "back"): setCopy(label, sub), columns and copy set to rest, scrollToHash(), finish() after 150 ms (the columns leave while the new title already rises), await uncover({dir}).

### 4.11 bfcache (lines 843-866)

onPageShow with e.persisted: if the overlay image is still visible and lastOrigin survived on the heap (a frozen home page coming back from a case), the cut runs backwards in place: clip from the current inset to the tile, 0.9 s domus.inOut; image transform 0.9 s; sheet leaves inset(0 0 100% 0) 0.6 s at 0.2; other tiles return at 0.25 with stagger 0.04; onComplete reset() and FX.scroll.enterVisible(). Otherwise reset().

### 4.12 Prefetch (lines 799-815)

pointerover / focusin on a[data-pt], a[data-back], a.next-link appends link rel=prefetch for the destination path once (FIX MQ-03).

### 4.13 What is cross-document and must be redesigned for client-side routing

Every part of S4/S5 that exists to survive a full document swap: the sessionStorage "rv-pt" record (8 s TTL) and "rv-origin" (10 min TTL), the head script that turns the record into --pt-* variables and data-arrive before first paint, the parse-time inline script in a-overlays.html that copies the ring and fills the img/label from window.__rvArrive, the data-URL handover (toData), warmHeroSrc's HTML regex, the rv-hero-rect localStorage cache and the cold 0.69 vh estimate, the CSS failsafe animations nv-failsafe 0.3s linear 3.5s on the overlays, link rel=prefetch, the mid-flight commit at 0.8 s / 0.75 s and the 1500 ms deadline, painted() polling and the two-rAF swap, window.pageshow bfcache reversal, location.href navigation and the /proto/rivista/ path filter.

In Next.js App Router the overlays live in a persistent layout, so: the travelling image and the sheet stay mounted across the route change; go() becomes an onClick on a TransitionLink that starts the cover / flip timeline, calls router.push at the commit point (the existing src/components/transition/{RouteTransition,CoverOverlay,TransitionLink}.tsx and src/app/template.tsx are the natural home), and the arrival is the new page's mount effect: measure the real [data-case-hero] rect after decode(), settle the overlay in 0.42 s domus, hide in the same frame as the real figure paints. The origin rect for the back cut can live in the zustand store instead of sessionStorage (still keyed by viewport size), and the hero-rect cache is unnecessary because the destination page can be measured live after mount (it must wait for fonts and layout). Scroll restoration on back: disable the browser's automatic restoration for these routes and restore scrollY plus rail progress yourself before the overlay leaves (the MQ-02 logic). The label/sub copy comes from dict.ts (EN/IT), not from data-pt-label attributes. Keep the guards: 6 s safety reset, 4 s arrival guard, swallow() of input while busy, lock("nav") and chromeInert.

---

## 5. Preloader S1 "Registro"

DOM (parts/b-preloader.html): div.hr-pre[data-pre][aria-hidden="true"] > div.hr-pre_sheet[data-pre-sheet] (absolute inset 0, --paper) + div.hr-pre_foot (absolute, left/right --pad, bottom 9vh, 7vh below 1024) containing p.hr-pre_count[data-pre-count] with three span.hr-dig > span.hr-dig_in (style --i:1, --i:2 on the second and third) > span.hr-dig_st holding eleven i cells "0 1 2 3 4 5 6 7 8 9 0" (the 11th is a duplicate 0 so the wrap is seamless); div.hr-pre_rule > i[data-pre-rule]; p.hr-pre_meta.label "Loading · " span[data-pre-what] "Fonts". No name is shown: instruments only; the live window is the GL canvas in float mode above the sheet.

CSS (fx-hero.css 133-171): html[data-preloader] { overflow: hidden }; the header is lifted to --z-pre-hdr (97) and .nav / .menu-btn are opacity 0 pointer-events none; html.hr-pre-out gives them a 0.7 s out transition with 0.25 s delay. .hr-pre fixed inset 0 z --z-pre (95), display none unless html[data-preloader] (then block, cursor pointer, and a CSS failsafe hr-pre-failsafe 0.5s var(--ease-io) 5.2s forwards to opacity 0 visibility hidden). Counter: --cell: 1.12em, --f-display at --w-hero (600), size clamp(4.5rem, 14vw, 14rem) (clamp(4rem, 26vw, 9rem) below 1024), line-height 1, letter-spacing --tr-hero, lining tabular nums; each .hr-dig is 0.6em wide and one cell high with overflow hidden; each i cell is --cell high. Rule: width min(22rem, 60vw), 1px --line track, ink i scaleX from the left; meta margin-top 0.9rem stone with the task word in ink. FIX D2: everything is painted by CSS from the first frame; nothing starts hidden.

Progress (fx-hero.js 37-91): tasks = { fonts (FX.fonts(1500) resolved), dom (true at init), shaders (gl.linked, or no engine), plate (share of the chunked warm-up: clamp01(1 - gl.warmLeft / 90) in float mode, else 1) }. target = (fonts + shaders + plate + dom) / 4 * 100. Every ticker frame: shown += (target - shown) * (1 - exp(-9 * dt)) with dt clamped to 0.001-0.05 s; snaps to 100 when target >= 100 and shown > 99.4; capped by elapsed ms / 10 (so it can never be faster than one second from __rvT0) and by 100. counterDone = shown >= 99.9 or elapsed > 2600 ms. paintCounter(v): digit k of the three (hundreds, tens, units) uses gear(v, k): units = v mod 10 continuous; higher digits = floor digit plus a roll during the last 10% of the lower digit (odometer feel); each strip gets transform translateY(calc(-pos * var(--cell))); the rule gets scaleX(v / 100); the meta word is "Fonts" until fonts, then "Shaders" until linked, then "Plate" until plate is 1, then "Ready". stopCounter paints 100.

Intro timeline (intro(), lines 277-321), started by core after build; writes sessionStorage "rv-intro-seen" = "1"; waits for counterDone plus an 80 ms hold; a pointerdown on the preloader or Space / Enter / Escape sets tl.timeScale(3):

| t (s) | Tween |
|---|---|
| 0 | the three digit strips (.hr-dig_in) to yPercent -112, 0.5 s domus.inOut, stagger 0.04 (CSS animation removed first) |
| 0 | rule i scaleX to 0 from the right, 0.45 s domus.inOut |
| 0 | meta opacity to 0, 0.3 s |
| 0 (float only) | gl.clip {t, l, r, b} to the hero slot rect, 1.1 s expo.inOut; gl.params glyphX/glyphY to the slot centre and glyphScale to 0.46, 1.1 s expo.inOut |
| 0.15 | sheet clipPath to inset(0 0 100% 0), 1.0 s domus.inOut (the paper lifts upward) |
| 0.45 | handoff(): html.hr-pre-out, remove data-preloader and rv-pre-run, --hd rewritten to the elapsed seconds so the hero CSS film starts now, gl.setZ("var(--z-gl)"), emit fx:intro:handoff (nav rises, see 4.3), hr-pre-out removed after 2 s |
| 0.75 (dock mode only) | slitOpen() |
| 1.25 (float) / 0.95 (dock) | remove key listener, pre.remove(), applyStage(0) if the stage is on, FX.ready("intro") |

GL dependency: float = flags.desktop and flags.motion and flags.gl. In float mode the canvas is mounted at init in "float" mode with the glyph "A" obstacle, lifted to --z-pre-gl (96, between the preloader sheet at 95 and the header at 97), its clip starts collapsed at the centre of openRect() (top 0.14 vh, left 0.23 vw, width 0.54 vw, bottom = min(0.86 vh, foot top - 0.05 vh)) and opens in 0.9 s expo.out on the first fx:gl:state "run" (guarded by a 1600 ms timeout, FIX MQ-01); gl.warm(90) chunks the warm-up that the counter reads. Without GL (phone, reduced motion, no WebGL2) the preloader is only the sheet and the counter, and plate counts as done. The 2600 ms elapsed cap and the 5.2 s CSS failsafe and the 6 s core guard bound the worst case.

Port notes: the existing src/components/Preloader.tsx is the mount point; the once-per-session rule and the gates (home only, no hash, no reduced motion, no arrival) move into it; the counter tasks become the store's real signals (fonts ready, engine compiling -> warming -> live in heroStore); the CSS-first paint of the counter (no hidden initial state) must be kept.

---

## 6. Header, footer and overlay partials: structure, copy, links, attributes

### 6.1 a-header.index.html (home)

- a.skip[href="#main"]: "Skip to content".
- header.hdr[data-hdr] > a.brand[href="#top"][aria-label="Alberto Tuveri, home"] > span.mark.hdr-mark[aria-hidden="true"] (svg.mark-ring viewBox 0 0 96 96 stroke currentColor, 60 line ticks; span.mark-mono "AT") + span.brand-name "Alberto Tuveri".
- nav.nav[aria-label="Primary"]: a[href="#work"][data-nv-sec="work"] "Work" (nv-roll twin aria-hidden), a[href="#path"][data-nv-sec="path"] "About", a[href="#contact"][data-nv-sec="contact"] "Contact", span.lang with sr-only "Language: English. Italian version coming." and visible aria-hidden "EN / IT" (EN in b).
- button.menu-btn[type="button"][aria-expanded="false"][aria-controls="menu"][aria-label="Open the menu"][data-menu-btn] > span.nv-roll[aria-hidden] "Menu" / "Close".
- div.menu#menu[data-menu][role="dialog"][aria-modal="true"][aria-label="Menu"][hidden]: div.nv-menu_cols[aria-hidden] with five i; div.nv-menu_in > ul > li a.d2 (href #work, #path, #contact) each with i.nv-menu_n.label[aria-hidden] "01" / "02" / "03" and span.mi "Work" / "About" / "Contact"; div.menu-foot: p.label.stone.nv-menu_h "Write to me", a.nv-menu_mail[href="mailto:albertotuveri@gmail.com"] "albertotuveri@gmail.com", ul.nv-menu_else with a.link-draw "LinkedIn" (https://www.linkedin.com/in/albertotuveri, rel noopener) and "GitHub" (https://github.com/GitAlboBis, rel noopener), span.label.stone.nv-menu_lang with the same sr-only sentence and "EN / IT".

### 6.2 a-header.case.html (case)

Identical except: a.brand[href="index.html"][data-back][data-pt-label="Index"][data-pt-sub="Alberto Tuveri"]; nav Work = a[href="index.html#work"][data-back][data-pt-label="Selected work"][data-pt-sub="Index"], About = a[href="index.html#path"][data-back][data-pt-label="About"][data-pt-sub="Index"], Contact stays a[href="#contact"][data-nv-sec="contact"]; the menu's Work / About links carry the same data-back / data-pt-label / data-pt-sub triplets.

### 6.3 a-overlays.html

div.nv-cols[data-nv-cols][aria-hidden="true"] > div.nv-cols_grid (ten i) + div.nv-cols_copy > span.mark.nv-cols_mark[data-nv-mark] + p.nv-cols_label.d1 > span[data-nv-label] + p.nv-cols_sub.label > span[data-nv-sub]; div.nv-sheet[data-nv-sheet][aria-hidden]; div.nv-img[data-nv-img][aria-hidden] > img[alt=""][decoding="sync"][fetchpriority="high"]; the inline first-paint script (copies .hdr .mark innerHTML into [data-nv-mark]; from window.__rvArrive sets img.src = a.data || a.src, label and sub text); div.switcher[data-switcher] with button.switcher_tab[data-switcher-tab][aria-expanded="false"][aria-controls="switcher-opts"] (span.switcher_now[data-switcher-now] "V1", span.sr "Prototype identity variant, show the three variants") and div.opts#switcher-opts[role="group"][aria-label="Prototype identity variant"] with p[aria-hidden] "Identity" and three buttons data-v 1/2/3 aria-pressed: "V1 Carta e cobalto", "V2 Laboratorio", "V3 Verde bottiglia". The switcher is prototype chrome: drop.

### 6.4 c-footer.html

footer.foot.row > i.sc-rule.sc-rule-bleed[data-rule] + div.foot-grid with three columns: (1) h2 > span.sc-rise "Alberto Tuveri", p.body[data-reveal] "Software & AI Engineer and Creative Lead at SerSan. M.Sc. in Artificial Intelligence Systems at the University of Trento."; (2) h2 "Elsewhere", ul[data-reveal][style="transition-delay:80ms"] with a.sc-draw "LinkedIn" and "GitHub" (same URLs, rel noopener); (3) h2 "Colophon", ul.stone[data-reveal][style="transition-delay:240ms"]: li with variant-conditional spans (V1 text: "Cormorant Garamond & Figtree"), li "GSAP, Lenis, WebGL2", li "Prototype, September 2026". div.legal > i.sc-rule[data-rule] + span "© 2026 Alberto Tuveri" + span "Prototype for review. Not the live site.". Footer CSS (fx-scroll.css 280-291): padding-top clamp(4rem, 10vh, 7rem), grid gap 3rem, 1fr 1fr at 768, 1.6fr 1fr 1fr at 1024; h2 300 var(--t-d4)/1.2 --f-text uppercase 0.01em; li a inline-block padding-block 0.6rem (44 px targets); .legal margin-top clamp(3rem, 8vh, 5rem), padding 1.5rem 0 calc(1.5rem + env(safe-area-inset-bottom)), stone 1rem, flex space-between.

Every string above must move to src/content/dict.ts with an IT twin (the lang toggle today is a static "EN / IT" with "Italian version coming": the port has a real LocaleToggle). The colophon line "Prototype, September 2026" and the legal "Prototype for review. Not the live site." are prototype copy to replace. The footer bio sentence must be checked against PRODUCT.md §9 by scripts/check-claims.mjs.

---

## 7. z-index scale and stacking rules

From bottom to top (values from fx-core.css lines 136-149):
1. --z-gl 1: the single GL canvas (docked in the hero, or in the band host).
2. --z-hero 2: the hero screen and type over the canvas.
3. --z-sheet 3: every main > section that is not .hr-stage, and .foot, as opaque --paper sheets (the :where rule), so the plate is only ever visible through the hero stage or the band host.
4. --z-menu 59: the mobile menu, under the header so the header stays clickable.
5. --z-header 60: header.hdr; under html[data-preloader] it is lifted to --z-pre-hdr 97 (above the preloader) with its nav hidden.
6. --z-cursor 70: the label cursor (opacity 0 when html[data-fx-locked]).
7. --z-nav-sheet 88 and --z-nav-img 89: the S4 paper sheet, then the travelling image above it.
8. --z-cols 90: the S5 columns, above everything of the page and above the S4 overlays.
9. --z-pre 95: the preloader sheet; --z-pre-gl 96: the canvas while the preloader runs (float mode, gl.setZ("var(--z-pre-gl)"), returned to --z-gl at handoff); --z-pre-hdr 97: the header during the preloader.
10. --z-switcher 120 (prototype only) and --z-skip 200: the skip link is always on top.

Rules: the overlays never hide page content (they are chrome; every hidden state belongs to an overlay or to a class that only fx-nav.js sets). html[data-fx-locked] hides the cursor and the switcher options. The menu, footer, switcher and skip link are made inert during a cut (chromeInert) and while the menu is open (A3), and main is inert whenever the lock count is positive. Under html[data-preloader] the document is overflow hidden.

---

## 8. Deferred items and open fixes found in code and reports

From .wf-out/rivista/build/FIX.progress.md (status DONE, deferred list) and review-fix.json:
- J12 (minor, content): the same sersan.io capture appears twice on the home (Now image and rail tile 04); needs a second capture via scripts/capture-sites.mjs or a typographic plate for tile 04.
- J13 (minor, jury): the three variants differ only by tokens; moot for the port (V1 only).
- MQ-08 (minor, motion/perf): every home arrival at a restored scroll position logs a layout shift of 1.0 at fx:built because the S3 stage grows to 300svh and the rail runway is sized while the viewport sits mid-page, under the cover. Suggested fix: static stage height and a cached --rail-run written before first paint. In the port this becomes: size the pinned stage in CSS, not in an effect.
- A13 (minor, GL/band): on phones one eddy of flow lines is trapped between the band headline and the email; the one-rect obstacle attempt was worse and was reverted.
- fx-nav.js line 77: scroller() is "only used while WP-C's FX.scroll.restore() is missing; restore() wins whenever it exists" (restore exists in fx-scroll.js line 605, so scroller() is the fallback only).
- fx-nav.js line 604-606: painted() exists because "WP-C skips the curtain on [data-nv-arrived]; until it does, this waits the curtain out" (fx-scroll honours data-nv-arrived at line 249, so this is a belt-and-braces poll).
- The lang toggle is a stub: "Language: English. Italian version coming." (both headers, twice each).
- Footer colophon and legal lines are prototype copy.
- Prototype-only surfaces to remove: the identity switcher, ?v/?fx/?chrome/?gl switches, syncLinks, the V2/V3 tokens and fallback faces, the noindex robots meta, the data-URI favicon.
- The prefers-reduced-motion change handler reloads the page (fx-core.js line 301): acceptable in a static prototype, not in the SPA.
- The 6 s entry guard, the 3 s async-hook race, the 4 s arrival guard, the 6 s navigation safety, the 3.5 s CSS overlay failsafes and the 5.2 s preloader failsafe are the prototype's answers to "never wall the page": the port needs the same guarantees in React terms.


## KEY FACTS
- V1 tokens (fx-core.css 29-52): --paper #f6f3ec, --paper-deep #ede7dc, --ink #24211e, --graphite #48443e, --stone #6b665d, --line #dcd5c8, --accent #2340c9, --accent-dark #1a2f99, --on-accent #ffffff; fonts Cormorant Garamond (display, orn) + Figtree (text); --w-display 500, --w-hero 600, --lh-display 0.92, --display-scale 1.1, --ch-t 0.638em, --ch-d 0.477em.
- Type scale: --t-hero clamp(3.1rem,13vw,13rem); --t-page clamp(3rem,8vw,9rem)*1.1; --t-d1 clamp(2.4rem,min(10vh,6.5vw),7.5rem)*1.1; --t-d2 clamp(2.3rem,min(6.4vh,4.2vw),4.5rem)*1.1; --t-d3 clamp(1.5rem,min(4.5vh,2.8vw),2.6rem)*1.1; --t-d4 clamp(1.45rem,1.8vw,1.75rem); --t-lead clamp(1.35rem,1.72vw,1.55rem); --t-body 1.1875rem; label = Figtree 600 1rem uppercase 0.08em.
- Spacing and breakpoints: --pad 8vw (5vw under 768), --gut 6vw, --chap clamp(6rem,14vh,11rem), --hdr clamp(4.5rem,10vh,6rem) (4.25rem under 768); breakpoints 767.98 / 1023.98 / 1024 / 768; [id] scroll-margin-top 6.5rem; no radii, no shadows, hairlines only.
- Eases: --ease-out cubic-bezier(0.16,1,0.3,1) = expo.out; --ease-io (0.66,0,0.22,1) = CustomEase domus.inOut 'M0,0 C0.66,0 0.22,1 1,1'; --ease-soft (0.22,0.9,0.36,1) = CustomEase domus 'M0,0 C0.22,0.9 0.36,1 1,1'; --ease-xio (0.87,0,0.13,1) = expo.inOut; dtOut '0.25,1,0.5,1'. Durations --d-micro 0.25s, --d-reveal 0.9s, --d-wipe 0.5s, --d-travel 1.1s.
- z scale: gl 1, hero 2, sheet 3, menu 59, header 60, cursor 70, nav-sheet 88, nav-img 89, cols 90, pre 95, pre-gl 96, pre-hdr 97, switcher 120, skip 200. Every main > section:not(.hr-stage) and .foot is an opaque paper sheet at z 3 via a zero-specificity :where rule.
- Lenis config: new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, anchors: false, autoRaf: false }), lenis.on('scroll', ScrollTrigger.update), gsap.ticker.add(t => lenis.raf(t*1000)), lagSmoothing(0), ScrollTrigger.config({ ignoreMobileResize: true }); exactly one ticker for ring, header check, counter and Lenis.
- Lock is ref-counted by reason ('entry', 'menu', 'nav'; '*' clears all): toggles html[data-fx-locked], main.inert, lenis.stop/start, emits fx:lock. Sticky events: fx:ready {entry}, fx:built, fx:intro:handoff; nav events fx:nav:start/covered/uncovered/arrived/reset.
- Boot order: flags, plugins, CustomEase, Lenis, lock('entry') + 6 s guard, init(gl, hero, scroll, nav), fonts(900 or 1500 ms race), build(...), ST.refresh, fx:built, then hero.intro() / nav.arrive() / plain. A module that throws gets html.fx-fail-<name> and its content stays static; core removes rv-ready if scroll fails.
- Reduced motion: head script omits html.rv-motion; fx-core.css kills all animation/transition durations; FX.flags.motion false = no Lenis, no ring, no cursor, no magnet, 0.15-0.2 s opacity fades for menu and covers, flipBack refused; a live media-query change reloads the page (drop in SPA).
- Fonts: fx-fonts.css self-hosts the Google @font-face rules (files still on fonts.gstatic.com, font-display swap, latin + latin-ext); Cormorant 300/500/600 and Figtree 300-600 each map to ONE variable woff2; metric-matched local fallbacks 'CG Fb' (Times, size-adjust 96.3%) and 'Figtree Fb' (Arial, 100.5% / 95.3%) give CLS 0. Port: next/font/google Cormorant_Garamond [300,500,600 + italic 500] and Figtree [300,400,500,600], replacing Archivo in layout.tsx.
- Header: fixed, height --hdr, transparent; .is-solid (paper-deep + hairline ::after drawn scaleX 0->1 in 0.6s) when scrollY > 24 or menu open; .is-hidden (translateY(-101%), 0.55s io) when scrolling down more than 4 px past 360, always over the S3 plate window (stage top + 0.08vh to top + 2vh); shown on scroll up, y < 360 or focusin. Checked on gsap.ticker by scroll position, not events.
- Nav links: Figtree 500 1rem uppercase 0.08em with padding-left calc(1.25em + 0.55rem) reserving a 1.25em x 1.5px accent dash (::before scaleX, 0.45s out) shown on aria-current='true', set by an IntersectionObserver with rootMargin '-45% 0px -50% 0px' over #work / #path / #contact. Hover is a word roll (.nv-roll twin spans, translateY 100% -> 0, 0.45s out) on fine pointers; underline fallback under reduced motion.
- Mobile menu (below 1024): dialog role, aria-modal, five paper-deep columns fromTo yPercent -101 -> 0 in 0.45s domus.inOut stagger 0.03 from end; inner copy switched on at 0.4 s; li hairlines draw 0.7s out delay 0.18s + k*0.06s; words rise 0.8s out delay 0.42s + k*0.06s; close: inner 0.12s fade, columns out 0.3s stagger 0.02 from start delay 0.08; Escape, focus trap on [btn, links], lock('menu'), footer/skip inert, closes at 1024.
- S5 Tendina cover: 10 columns (5 under 768), step 0.035s (0.045s under 768), columns from yPercent 101 (or -101 for back) to 0 in 0.5s domus.inOut stagger from center; label (d1) rises 112% -> 0 in 0.6s expo.out at 0.5; sub at 0.6 for 0.3s; commit at 0.7 s. Uncover: copy leaves 0.35s power2.in, columns leave 0.55s domus.inOut stagger from edges at 0.1; direction flips for back.
- S4 Stacco forward: tile img -> case hero rect; overlay img is a viewport-cover box clipped with clip-path inset(t r b l) and moved with translate+scale computed by coverXf (same object-fit cover crop); other tiles roll up (clip inset(0 0 100% 0), 0.45s, stagger 0.04 from the tile index); clip + transform travel 1.1s domus.inOut; a paper sheet rises under it from 0.12 s for 0.6s; commit at 0.8 s (deadline 1.5 s). Back: gated by hero >= 20% visible, rv-origin younger than 10 min at the same viewport and variant; sheet 0.5s, travel 1.0s, commit at 0.75 s.
- S4 arrival: the record is applied before first paint via --pt-t/r/b/l, --pt-x/y/s on html.style and html[data-arrive]; arrive() waits img.decode() (max 900 ms) + 1 rAF, re-applies the restored scrollY if drifted more than 2 px, settles the overlay in 0.42s 'domus' if the edge drift exceeds 2 px, dissolves in 0.25s if the back target missed by more than 40 px, then swaps overlay for the real figure after painted() plus two rAFs; [data-nv-arrived] tells fx-scroll to skip that figure's curtain; 4 s guard.
- Everything cross-document must be redesigned for client-side routing: sessionStorage rv-pt (8 s) and rv-origin (10 min), localStorage rv-hero and rv-hero-rect caches, the cold 0.69vh 16:9 hero estimate with k = 1.12, the head script and the parse-time overlay script, data-URL handover, HTML-regex warmHeroSrc, link rel=prefetch, CSS nv-failsafe 3.5 s animations, pageshow bfcache reversal, location.href commits; overlays should live in the persistent layout with router.push at the commit point and measurement of the real hero after mount.
- Safety: state.busy taken synchronously in the click handler; swallow() blocks click/keydown/pointerdown while busy; chromeInert makes header, menu, footer, switcher and skip inert during a cut; 6 s safety reset (unlock('*'), overlays cleared) if the navigation never happens; menu closed, cursor hidden, AT ring accelerates to 240 deg/s during a cut and returns to 30 deg/s.
- Preloader S1: three rolling digit strips (11 cells, --cell 1.12em, Cormorant 600 clamp(4.5rem,14vw,14rem)), a real-progress rule (width min(22rem,60vw)) and 'Loading · Fonts/Shaders/Plate/Ready'; progress = (fonts + shaders + plate + dom) / 4, smoothed by 1 - exp(-9 dt), capped at elapsed ms / 10 and 2600 ms; exit after 100 + 80 ms: digits yPercent -112 0.5s stagger 0.04, rule scaleX 0 0.45s, sheet clip inset(0 0 100% 0) 1.0s at 0.15, handoff at 0.45 s (emits fx:intro:handoff, rewrites --hd), ready at 1.25 s (float) or 0.95 s; skip on pointerdown/Space/Enter/Escape = timeScale 3.
- Preloader gating (head script): home only, no reduced motion, no arrival record, no location.hash, sessionStorage rv-intro-seen unset; sets html[data-preloader], class rv-pre-run and window.__rvT0. In float mode (desktop + motion + WebGL2) the GL canvas sits at z 96 between the preloader sheet (95) and the header (97) and its clip window opens 0.9s expo.out on the first fx:gl:state 'run' (1600 ms guard).
- Buttons and links: .btn accent fill with an accent-dark ::before clip-path wipe inset(0 100% 0 0) -> inset(0) in 0.35s out, :active scale(0.98), arrow keyframe nv-arrow 0.3s (leaves top-right, re-enters bottom-left); .ghost two 1.5px hairlines (ink retracts to the right while accent grows from the left, 0.3s soft, 0.08s delay); .link-draw / .sc-draw printed --line rule redrawn in currentColor 0.35s soft; focus ring 2px accent offset 3px; selection accent on paper.
- Label cursor (fine pointer + motion): div.nv-cursor with quickTo x/y 0.45s power3 at +18 px, label from the nearest [data-cursor] ('Open', 'Visit', 'Next'), word rises 0.25s expo.out; opacity 0 at rest (no permanent layer) and forced hidden under html[data-fx-locked]. One magnet on the band mailto link (0.28 / 0.6 factors, clamp 12 px).
- Copy to move into dict.ts: 'Skip to content', 'Alberto Tuveri, home', 'Work', 'About', 'Contact', 'Open the menu' / 'Close the menu', 'Menu' / 'Close', 'Write to me', 'albertotuveri@gmail.com', 'LinkedIn', 'GitHub', footer bio 'Software & AI Engineer and Creative Lead at SerSan. M.Sc. in Artificial Intelligence Systems at the University of Trento.', 'Elsewhere', 'Colophon', 'Cormorant Garamond & Figtree', 'GSAP, Lenis, WebGL2', '© 2026 Alberto Tuveri'; the lang toggle is a stub ('Italian version coming') and the legal line 'Prototype for review. Not the live site.' is prototype copy.
- Section ids and nav contract: #top (body), #main, #work, #path (About), #contact (band, data-band); case page links back with data-back + data-pt-label/data-pt-sub; tiles carry data-tile-id, data-pt='flip' | 'grow', data-pt-hero, data-pt-label, data-pt-sub, data-cursor; the case hero is [data-case-hero] inside .frame.r-169 with data-media='case-hero'.
- Deferred in the prototype: J12 (duplicate sersan.io capture on tile 04, needs a new capture), J13 (variant signatures, moot), MQ-08 (arrival CLS 1.0 at fx:built because the 300svh stage and rail runway are sized in JS mid-page: size them in CSS in the port), A13 (mobile band eddy between headline and email, attempt reverted).
- Prototype-only surfaces to drop: identity switcher and V2/V3 tokens, ?v / ?fx / ?chrome / ?gl switches, syncLinks, .var-only spans, fx-static class, noindex meta, data-URI favicon, the reload-on-reduced-motion-change handler.

## OPEN QUESTIONS
- The S3 plate window used by the header (stageA / stageB from .hr-stage[data-on]) and the exact hero slot geometry belong to the hero slice: confirm whether the port keeps the sticky S3 stage, because the header hide rule and MQ-08 both depend on it.
- FX.fonts waits for Cormorant Garamond 300 but no CSS rule in this slice uses weight 300 (display is 500, hero 600): confirm whether the hero or scroll slice uses it before loading it through next/font.
- A13 (band eddy on phones) and the band magnet depend on fx-gl's obstacle union: whether the port keeps the WebGL2 flow engine or the existing WebGPU MLS-MPM bench decides if these carry over at all.
- The tile 'grow' transition (data-pt='grow' on the eight typographic tiles) is handled as a plain S5 column cover in fx-nav (only 'flip' has a dedicated path); whether a distinct grow cut was ever specified is not visible in this slice (check EFFECTS-PLAN.md and the scroll slice).
- Link interception in the prototype is limited to /proto/rivista/ paths and .html files; the port's TransitionLink must define which routes get S4 (home -> /work/[slug] with a real capture: today only spherenode and sersan-io have one) versus S5.
- The footer bio sentence ('Software & AI Engineer and Creative Lead at SerSan. M.Sc. in Artificial Intelligence Systems at the University of Trento.') must be validated against PRODUCT.md §9 before it enters dict.ts; I did not verify it.
- The head script writes --hd 1.85s / 0.45s / 0.15s for the hero CSS film; in the SPA the arrival case (0.45s) no longer exists as a document load, so the hero slice must decide how the film is timed on client-side arrival.
