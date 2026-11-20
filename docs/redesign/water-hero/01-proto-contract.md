# 01 · Rivista prototype: integration contract for a replacement hero engine

> Reader dossier, 2026-09-18. Sources are read in full: `public/proto/rivista/fx-gl.js`, `fx-hero.js`, `fx-hero.css`, `fx-core.js`, `fx-core.css`, `parts/{head,b-hero,b-preloader,c-main.index,c-main.case,c-footer,a-overlays,a-header.index}.html`, plus the GL/hero/preloader/S3 parts of `fx-scroll.js`, `fx-scroll.css`, `fx-nav.js`, `fx-nav.css`, and `dev-gl.html`, `assemble.mjs`.
> The measured numbers come from a Playwright probe (Chrome headless, `channel:"chrome"`) against `http://127.0.0.1:5178/proto/rivista/index.html`. The probe scripts are in the session scratchpad, not in the repo. Event times are in ms from document start. Headless GPU timings (about 0.06 ms) are **not** representative. The fx-gl.js header gives 0.8 to 1.1 ms GPU median at 1440x900 on Alberto's machine.
> `index.html` and `case.html` are up to date with the partials (`node assemble.mjs --check` exits 0).

---

## 0. TL;DR

* The page has **one GL engine** (`fx-gl.js`, module `"gl"`) and **one canvas** that moves between three uses: the **S1 preloader window** (float, z 96), the **hero plate "Fig. 01"** (float plus clip-path window on desktop, docked in the frame on mobile and under reduced motion), and the **closing band** `#contact` (docked, paper ground, text-box obstacles). `fx-hero.js` is the only caller and drives the engine through a small imperative API (`FX.gl`), two plain tweenable objects (`params`, `clip`) and two events (`fx:gl:state`, `fx:gl:stats`).
* A new WebGPU water engine can be a **drop-in** if it (a) registers as module **`"gl"`** and sets `FX.gl` **synchronously** in `init`, (b) implements the pending→linked→run/sleep/off lifecycle, (c) respects `params.glyphX/glyphY/glyphScale` in the same viewport sim units, (d) applies `clip` as a CSS `clip-path: inset()` on a **fixed, full-viewport float canvas** every ticker tick, and (e) emits the same two events. Things that are WebGL2-specific today are listed in §8.4 (capability flag, instrument caption string, posters, colophon).

---

## 1. `window.FX` core (fx-core.js, owner WP-A, read-only for the hero owner)

### 1.1 Boot order and script loading
`parts/head.html` loads everything as `defer`, in this order:
```html
gsap@3.15.0 · ScrollTrigger · SplitText · Flip · CustomEase · lenis@1.3.26
fx-core.js · fx-gl.js · fx-hero.js · fx-scroll.js · fx-nav.js
```
At load a module only calls `FX.register(name, { init, build, onVariant, onResize })`. Boot runs on `DOMContentLoaded`:
```js
const ORDER = ["gl", "hero", "scroll", "nav"];          // extra module names run AFTER these
1 flags, variant sync, plugins, CustomEase domus / domus.inOut / dtOut, ST.config({ ignoreMobileResize: true })
2 Lenis on gsap.ticker; FX.lock("entry") under data-preloader or data-arrive (+6 s guard → plainEntry)
3 init(ctx) in ORDER, each in try/catch          ctx = { FX, gsap, ScrollTrigger, mm: gsap.matchMedia(), page, variant, entry, arrive }
4 await FX.fonts(entry intro|arrive ? 900 : 1500)
5 build(ctx) in ORDER, ScrollTrigger.refresh(), emit fx:built
6 entry: data-preloader → FX.hero.intro() · data-arrive → FX.nav.arrive() · else FX.ready("plain")
7 a live change of prefers-reduced-motion reloads the page
```
An async `init`/`build` may return a promise, but the boot waits at most **3 s** for it (`Promise.race(..., wait(3000))`). A module that throws gets `html.fx-fail-<name>` plus one `console.warn`. A module switched off with `?fx=` gets `html.fx-off-<name>`.

**Consequence:** a new engine must be named `"gl"`, or fx-core's `ORDER` must change. `fx-hero.init` runs right after `gl.init` and reads `FX.gl` immediately.

### 1.2 Ticker and Lenis (the single loop)
```js
lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, anchors: false, autoRaf: false });
lenis.on("scroll", ST.update);
G.ticker.add((time) => lenis.raf(time * 1000));   // "the single ticker: no second rAF anywhere"
G.ticker.lagSmoothing(0);
```
Lenis is created only with GSAP present and `prefers-reduced-motion: no-preference`. The engine uses `ctx.gsap.ticker.add(tick)` with `tick(time /*s*/, deltaMs)`. The only rAFs in fx-gl are the two frames that defer context creation.

### 1.3 Event bus
`FX.on(evt, fn, {once})` / `FX.once` / `FX.emit(evt, detail)`. These are `CustomEvent`s on `window`, and names are auto-prefixed with `fx:`. **Sticky** events (late listeners still get them): `fx:ready`, `fx:built`, `fx:intro:handoff`. `FX.on` returns an unsubscribe function.
Events that concern the engine:

| event | emitted by | detail | consumed by |
|---|---|---|---|
| `fx:gl:state` | gl | `{state:"run"\|"sleep"\|"off", tier, host}` | hero: opens the preloader window on the first `run`; on `off` clears the caption and restores the poster |
| `fx:gl:stats` | gl | `{n, gpuMs\|null, dpr, tier}` at 1 Hz while running, plus once when a warm queue empties | hero: `[data-gl-instr]` caption |
| `fx:gl:linked` | gl | `{}` | **no consumer** (incidental) |
| `fx:intro:handoff` | hero | `{}` sticky | nav (the nav words rise) |
| `fx:ready` | core via `FX.ready(entry)` | `{entry}` sticky | hero `slotSlit`, scroll (lines rise) |
| `fx:nav:covered` / `fx:nav:uncovered` / `fx:nav:reset` | nav | `{kind}` | gl: pause / resume |
| `fx:lock` | core | `{locked, reason}` | gl: pauses on `reason==="menu"` |
| `fx:resize` | core (200 ms debounce, only on a real size change) | `{w,h,widthChanged}` | (modules use the `onResize` hook) |
| `fx:variant` | core | `{from,to}` | nav switcher |

### 1.4 Motion and state flags
```js
flags.motion  = matchMedia("(prefers-reduced-motion: no-preference)")
flags.fine    = "(hover: hover) and (pointer: fine)"
flags.touch   = "(pointer: coarse)"
flags.desktop = "(min-width: 1024px)"
let glOk = "WebGL2RenderingContext" in window;           // ← WebGL2-specific capability test
get gl() { return glOk && !d.classList.contains("gl-off"); }
set gl(v) { glOk = !!v; d.classList.toggle("gl-off", !glOk); }   // the engine sets false on failure
```
The head script (before first paint) sets these on `<html>`:
* `data-variant` (V1 is the fixed default; `?v=2|3` still compares), `rv-js`, and `rv-motion` unless reduced motion.
* `fx-nochrome` unless `?chrome=1`, and `gl-off` if `?gl=0`.
* `data-arrive` from the sessionStorage `rv-pt` record or a back_forward navigation.
* **`data-preloader` and `rv-pre-run`** only when `data-home && !reducedMotion && !arrival && !location.hash && !sessionStorage['rv-intro-seen']`. It also sets `window.__rvT0 = performance.now()`.
* `--hd` = `1.85s` under the preloader, `0.45s` on an arrival, `0.15s` otherwise. This is the delay of the CSS hero film.

The lock is ref-counted: `FX.lock(reason)` / `FX.unlock(reason|"*")`. While locked, `<main>` is `inert` and Lenis is stopped. `FX.ready(entry)` releases `"entry"` once. Other helpers are `FX.scrollTo`, `FX.fonts(ms)`, `FX.setVariant`, `FX.exits`/`runExits`, `FX.page` ("home"/"case"), `FX.has(name)` and `FX.modules`.

### 1.5 Tiering helpers
There are no helpers in core; tiering lives in fx-gl:
```js
const TIER_N = { A: 16384, B: 8192, C: 4096 };  const NEXT_TIER = { A: "B", B: "C", C: "C" };
function pickTier() { let t = "A";
  if (FX.flags.touch || innerWidth < 768) t = "B";
  if (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4) t = "C";  return t; }
// auto-downgrade once: at frame 90, if >30 GPU samples and median > 5 ms and tier !== C → next tier, realloc, re-emit fx:gl:state
```
DPR / pixel cap (`MAXPIX = 3.2e6` per buffer), in `measure()`:
```js
w,h = float ? innerWidth,innerHeight : host rect (rounded)
cap = Math.min(1.5, Math.sqrt(MAXPIX / (w*h)));   dpr = Math.min(devicePixelRatio, cap);
```
Measured values: 1440x900 @1x is dpr 1 (canvas 1440x900). **1440x900 @2x is dpr 1.5 (2160x1350)**. A phone at 390x844 @3x, docked 390x488, is dpr 1.5 (585x732, tier B, 8192). Derived: 1920x1080 @2x gives 1.24, and 2560x1440 @1x gives **0.93**, which is under-sampled.

---

## 2. `FX.gl`: the public API and every call site

### 2.1 Surface (fx-gl.js `api`)
```js
params: { drift: 0.105, glyphX: 0.5, glyphY: 0.5, glyphScale: 0.92 }   // plain object, GSAP-tweened
clip:   { t: 0, r: 0, b: 0, l: 0, on: false }                        // plain px insets, GSAP-tweened
get state()    "off"|"sleep"|"run"          get linked()  programs linked and GPU objects ready
get warmLeft() queued warm steps            get host()    data-gl-host of the current host ("hero"|"band"|"")
get tier()     "A"|"B"|"C"
get stats()    { n, gpuMs, dpr, tier, state, host, w, h }            // w,h = CSS px of the drawing area
mount(el, { mode: "float"|"dock", ground: "deep"|"paper" }) → bool   // idempotent; re-parents canvas, measure, obstacle
setZ(z)             // float canvas z-index; remembered if called before the canvas exists
window(rect|null)   // sets clip from a viewport rect — NOT CALLED by anyone
setObstacle({type:"glyph", char, font} | {type:"rects", els, pad})
warm(n)             // queue n sim steps (cap 220), run 10 per ticker frame; works while asleep
wake()              // → "run" (deferred if pending or covered)
sleep(hide)         // → "sleep"; hide=true hides the canvas, false keeps the last frame as a still
recolor()           // re-read CSS tokens, rebuild obstacle, warm(30) — not called externally
scrollVelocity(v)   // Lenis velocity → drift boost: drift * (1 + min(1.5, 0.08*|v|))
resize()            // measure(); if changed: rebuild obstacle + warm(30)
```
Module hooks: `init(ctx)` sets `pending = true` and `FX.gl = api` synchronously, then boots the context **two rAFs later** (`requestAnimationFrame(() => requestAnimationFrame(boot))`). It also adds `ctx.gsap.ticker.add(tick)`, a `pointermove` listener, `visibilitychange`, and listeners for nav cover/lock. `onVariant()` re-reads colours and rebuilds the glyph with the new `--f-display`, then `warm(30)`. `onResize()` calls `api.resize()`.
If `!FX.flags.gl` at init: `FX.gl = null` and return (hero then takes the poster path).

### 2.2 Lifecycle and internal states
```
init ──pending (FX.gl exists, calls queued/accepted)──► boot() after 2 rAF
   boot: getContext("webgl2",{antialias:false, alpha:false, depth:false, stencil:false, powerPreference:"high-performance"})
         KHR_parallel_shader_compile → programs link in parallel, polled each tick (linkDone())
   finishLink: VAOs, glyph texture, pickTier(), alloc, readColors(), if host: place/measure/obstacle/warm(60)
               emit fx:gl:linked; if wake was requested while pending → wake()
fail(err): ok=false; console.warn("[fx] gl: the flow plate is off, the poster stays."); remove canvas;
           FX.flags.gl = false (→ html.gl-off); setState("off")
webglcontextlost: preventDefault, lost=true, ok=false, drawn=false, setState("off"), hide canvas
webglcontextrestored: rebuild() (relink → finishLink)
```
The canvas visibility rule is `visible = wantVis && drawn && !lost` (`drawn` flips on the first presented frame, either a warm chunk or a run step). The reason is that an undrawn opaque canvas is black.

`tick(time, deltaMs)`:
1. If lost, return. If pending, `applyClip()`, poll the link, return.
2. `applyClip()` runs **every tick**. It is compositor-only and writes the style only when the string changes.
3. Warm chunk: `min(10, warmQ)` steps of 1/60 s. When the queue empties it emits `fx:gl:stats`.
4. If `state !== "run"`, return, with **zero GL calls**.
5. `dt = clamp(deltaMs/1000, 0.001, 0.033)`. Step, timer query, frame-90 downgrade check, stats at 1 Hz.

Loop gating, in the engine:
```js
visibilitychange: hidden & running → sleep(false) (hiddenPause) ; visible again → wake()
covered = fx:nav:covered | fx:lock{reason:"menu", locked:true} → if running: sleep(false), remember wakeAfter
uncovered = fx:nav:uncovered | fx:nav:reset | fx:lock{menu, locked:false} → wake() if wakeAfter && host && !hidden
wake() while covered → only sets wakeAfter; sleep(true) while covered → clears wakeAfter
```

### 2.3 Every call site (all of them are in fx-hero.js; fx-scroll, fx-nav and fx-core never touch FX.gl)

| where (fx-hero.js) | call | purpose |
|---|---|---|
| L50–53 `progress()` | `g.linked`, `g.warmLeft`, `FX.flags.gl` | S1 counter tasks "Shaders" and "Plate" |
| L117–130 `mountHero()` | `mount(heroHost,{mode: float?"float":"dock", ground:"deep"})`, `setObstacle({type:"glyph",char:"A"})`; dock only: `stats.w/h` → `params.glyphX=a/2, glyphY=.5, glyphScale=min(.88, a*.86), drift=.105` | place the plate |
| L131–139 `mountBand()` | `mount(bandHost,{mode:"dock",ground:"paper"})`, `setObstacle({type:"rects", els: h2,a,p of [data-band-copy] (visible), pad:.4})`, `warm(60)` | closing band |
| L142–155 `chooseHost()` | `sleep(true)` when no host is visible; hero: `mountHero(); warm(40); start()`; band (in `requestIdleCallback`, timeout 500): `mountBand(); start()`; `start = motion ? wake() : (warm(180), sleep(false))` | IO-driven host switch |
| L171–209 `applyStage(p)` | writes `clip.on/t/r/b/l` and `params.glyphX/glyphY/glyphScale/drift` | S3 scrub |
| L229–233 | ScrollTrigger `onLeave → sleep(true)`, `onEnterBack → wake()` (no re-warm: the float canvas kept its trail) | S3 end |
| L244 | stage cleanup: `clip.on=false; mountHero()` (→ dock) | breakpoint change |
| L256–264 `slotSlit()` | `clip` from horizontal slit to slot, 0.9 s expo.out | repeat visit on desktop |
| L272 `handoff()` | `setZ("var(--z-gl)")` | S1 → page |
| L301–307 `intro()` | `tl.to(gl().clip, …)`, `tl.to(gl().params, …)` | S1 window travels to the plate |
| L351–372 `init` (intro + float) | `mount(float)`, `setObstacle(A)`, `setZ("var(--z-pre-gl)")`, `params` at openRect, `clip` = centre point, `warm(90)`, `wake()`; `FX.on("fx:gl:state", run → openWin)`; fallback `setTimeout(openWin, 1600)` | S1 live window |
| L376–384 | `FX.on("fx:gl:stats")` → caption text | instrument |
| L386–390 | `FX.on("fx:gl:state")` off → caption "" and `setFloatSkin(false)` | poster back |
| L399, L416 | `FX.lenis.on("scroll", e => gl().scrollVelocity(e.velocity))` | drift boost |
| L406 | `mm.add("(min-width:1024px)", () => motion && flags.gl && gl() ? buildStage() : undefined)` | S3 on/off |

### 2.4 Which behaviour is essential and which is incidental

**Essential**: the preloader, plate, scroll or caption break without it.
* Synchronous `FX.gl` in `gl.init`. Accept calls while pending. The `linked` getter. `warm`/`warmLeft`, because they drive the preloader counter.
* `mount` with float/dock re-parenting; `setZ`; the `clip` object applied as CSS clip-path each tick in float mode; the `params` object read every step.
* `wake`, `sleep(hide)`, the `state` getter, and `fx:gl:state` on **every** transition. The first `run` opens the S1 window, and `off` restores the poster.
* `stats` (the `w,h` fields are used for dock placement) and `fx:gl:stats` (for the caption).
* Canvas `visibility:hidden` until the first presented frame; `aria-hidden`; `pointer-events:none`.
* A single ticker, zero GPU work while asleep, and the gating on visibility, nav covers and the menu.
* `resize()` via `onResize`. `FX.flags.gl=false` plus `state off` on any failure.

**Incidental**: droppable or internal.
* `window(rect)` (unused), the `fx:gl:linked` event (no consumer) and `recolor()` (internal only).
* The glyph texture with emboss G and interior B channels, the flow-field shaders, the trail buffers and the transform feedback.
* The `setObstacle` glyph `font` override (always null; it is derived from `--f-display`/`--w-hero`, which gives `600 430px "Cormorant Garamond"`).
* `KHR_parallel_shader_compile` (the equivalent in WebGPU is `create*PipelineAsync`) and the `EXT_disjoint_timer_query_webgl2` path (the equivalent is optional `timestamp-query`).
* The tier C `deviceMemory` rule.

---

## 3. S1 "Registro": the preloader choreography

### 3.1 Markup and CSS
```html
<div class="hr-pre" data-pre aria-hidden="true">
  <div class="hr-pre_sheet" data-pre-sheet></div>        <!-- paper, inset 0 -->
  <div class="hr-pre_foot">                               <!-- left/right var(--pad), bottom 9vh (7vh < 1024) -->
    <p class="hr-pre_count" data-pre-count> 3 × .hr-dig > .hr-dig_in > .hr-dig_st <i>0…9,0</i> </p>
    <div class="hr-pre_rule"><i data-pre-rule></i></div>  <!-- min(22rem,60vw) × 1px, fill scaleX -->
    <p class="hr-pre_meta label">Loading · <span data-pre-what>Fonts</span></p>
  </div></div>
```
* `.hr-pre { position:fixed; inset:0; z-index: var(--z-pre) /*95*/; display:none }`. Under `html[data-preloader]` it is shown, and a CSS failsafe `hr-pre-failsafe 0.5s … 5.2s forwards` fades it to hidden.
* `html[data-preloader] { overflow:hidden }`. The header is lifted to `--z-pre-hdr` (97); `.nav` and `.menu-btn` get opacity 0.
* The counter uses `--f-display` at `--w-hero`, `clamp(4.5rem, 14vw, 14rem)` (mobile `clamp(4rem, 26vw, 9rem)`), with `--cell: 1.12em`. Every cell is `translateY(calc(-pos * var(--cell)))`.

### 3.2 What the count and the rule are bound to (real progress, not a fake timer)
```js
progress() = { fonts: FX.fonts(1500) resolved, shaders: !engineOn || g.linked,
               plate: engineOn && float ? (!g.linked ? 0 : clamp01(1 - g.warmLeft / 90)) : 1, dom: true }
target = (fonts + shaders + plate + dom) / 4 * 100
shown += (target - shown) * (1 - exp(-9 dt));  shown = min(shown, (now - __rvT0)/1000*100, 100)  // never < 1 s
counterDone = shown >= 99.9 || now - T0 > 2600 ms       → exit starts after an 80 ms hold
label = !fonts ? "Fonts" : !shaders ? "Shaders" : plate < 1 ? "Plate" : "Ready"
rule <i>.scaleX = shown/100;  digits via gear(): units wrap on an 11-cell strip, the upper digits roll in the last 10 %
```
`PLATE_STEPS = 90`: the preloader queues `warm(90)` and the plate share is literally the warm-up progress. **In dock mode (mobile) the plate counts as 1**, because only fonts, shaders and DOM gate it.

### 3.3 Float window on desktop (`desktop && motion && flags.gl`), set in `hero.init`
```js
gl.mount(heroHost, { mode: "float", ground: "deep" }); gl.setObstacle({type:"glyph", char:"A"});
gl.setZ("var(--z-pre-gl)");                          // 96: above the sheet (95), under the header (97)
r = openRect(): { top: H*0.14, left: W*0.23, width: W*0.54,
                  height: max(H*0.3, min(H*0.86, footTop - H*0.05) - top) }   // clears the counter block
params: glyphX/Y = centre of r in sim units, glyphScale = 0.46
clip  : a zero-area point at the centre of r (t=cy, b=H-cy, l=cx, r=W-cx), on=true
gl.warm(90); gl.wake();
first fx:gl:state "run" → rAF → gsap.to(clip, {r's insets}, 0.9 s, "expo.out")   (fallback setTimeout 1600 ms)
```
Measured at **1440x900**: openRect = `{top:126, left:331.2, width:777.6, height:363.5}` (footTop = 534.5). Glyph sim = (0.800, 0.658), scale 0.46. The clip starts at `t 307.75 · r 720 · b 592.25 · l 720`, so the window opens from a point in both axes.

### 3.4 Exit timeline (`intro()`; t = 0 at counterDone + 80 ms)
| t (s) | tween | dur | ease |
|---|---|---|---|
| 0 | `.hr-dig_in` yPercent → −112, stagger 0.04 | 0.5 | domus.inOut |
| 0 | `[data-pre-rule]` scaleX → 0 (origin right) | 0.45 | domus.inOut |
| 0 | `.hr-pre_meta` opacity → 0 | 0.3 | none |
| 0 | **float:** `gl.clip` → plate slot insets (`t: slot.top, l: slot.left, r: W−slot.right, b: H−slot.bottom`) | **1.1** | **expo.inOut** |
| 0 | **float:** `gl.params` glyphX/Y → slot centre in sim units, glyphScale 0.46 | 1.1 | expo.inOut |
| 0.15 | `[data-pre-sheet]` clip-path → `inset(0 0 100% 0)` (the paper sheet retracts upward and reveals the page from the bottom) | 1.0 | domus.inOut |
| **0.45** | `handoff()`: `html.hr-pre-out` (2 s), remove `data-preloader`/`rv-pre-run`, `--hd` = elapsed since T0 (the name's CSS rise starts now), **`gl.setZ("var(--z-gl)")`** (96 → 1, now under `.hr-screen` z 2), emit `fx:intro:handoff` (nav words rise 0.7 s expo.out, stagger 0.06) | | |
| 0.75 | **dock only:** `slitOpen()` on `.hr-frame`: clip-path `inset(50% 0 50% 0)` → `inset(0)` | 0.9 | expo.out |
| **1.25** float / **0.95** dock | `pre.remove()`, `introRunning=false`, `applyStage(0)`, **`FX.ready("intro")`** (unlocks and Lenis starts) | | |

Skip: a `pointerdown` on the preloader, or Space/Enter/Escape, sets `tl.timeScale(3)`. Failsafes: the CSS fade at 5.2 s and the core forcing a plain entry at 6 s.
Measured at desktop 1440: lock 1002 · built 1046 · **gl linked + run 1097** · handoff 2181 · ready 2985. Measured at mobile 390: built 711 · run 747 · handoff 1772 · ready 2276.
**Handoff geometry:** at desktop 1440 the window docks from the 777.6x363.5 centre band into the 446.4x468 plate at (993.6, 126), full-bleed right. The canvas stays **fixed and full-viewport**: only the CSS clip moves. The A does not scale across the handoff (0.46 → 0.46); it only translates, from (0.8, 0.658) to (1.352, 0.600).

---

## 4. Hero layout, float technique, layers, poster, fades, S3

### 4.1 Markup (parts/b-hero.html)
```html
<section class="hero hr-stage" aria-labelledby="hero-h1">
 <div class="hr-screen">
  <div class="hr-type">  <p class="lockup">  (sr-only name + 2 × .lk-line > .lk-word > .ch[--i]) </p>
     <span class="hr-orn">…ornament "engineer"…</span>
     <div class="hr-fade hr-said row"> label + <h1 id="hero-h1" class="d3"> </div></div>
  <div class="hr-side">
   <figure class="hr-plate">
    <div class="frame hr-frame" data-hero-media data-gl-slot="hero">
     <div class="gl-host" data-gl-host="hero">
       <img class="hr-poster v1|v2|v3" src="fx-plate-v{1,2,3}.webp" width="892" height="940" fetchpriority="high" alt="…flow field…">
     </div></div>
    <figcaption class="hr-fade hr-cap" data-fade-end="early">
      <span class="label">Fig. 01 · Flow field, rendered live</span>
      <span class="hr-instr" data-gl-instr></span>
      <span class="hr-still">Still frame captured from this engine.</span></figcaption></figure>
   <div class="hr-fade hr-act" data-fade-end="early"> CTA "Write to me" + ghosts "Selected work", "About" </div>
 </div></div></section>
```
Hooks the engine side depends on: `[data-gl-slot="hero"]` (the rect the float window docks to), `[data-gl-host="hero"]` (the dock parent and the name reported in `host`), `[data-gl-instr]`, `.hr-poster.v1`, `.hr-frame`.

### 4.2 Plate geometry
CSS (fx-hero.css):
```css
.hr-screen { position:relative; z-index: var(--z-hero); padding-top: calc(var(--hdr) + clamp(1.5rem,4vh,3rem)); padding-bottom: clamp(2rem,6vh,4rem) }
@media (min-width:1024px){
  .hr-screen{ --t-hero: clamp(3.1rem,10.5vw,11rem); display:grid; grid-template-columns: minmax(0,1fr) clamp(18rem,31vw,34rem); min-height:100svh }
  .hr-plate{ order:1; display:flex; flex-direction:column; flex:1 1 auto; min-height:0 }
  .hr-frame{ flex:1 1 auto; min-height:8rem; max-height:min(52svh,34rem) }      /* right column, full bleed right */
  .hr-act{ order:2; margin-top: clamp(1.25rem,3vh,2.5rem); padding-right: var(--pad) } }
@media (max-width:1023.98px){
  .hr-act{ order:1 } .hr-plate{ order:2; margin-top: clamp(2rem,5vh,3.5rem) } .hr-frame{ aspect-ratio: 4/5 } }
.hr-frame { position:relative; overflow:hidden; background: var(--paper-deep) }
.gl-host  { position:absolute; inset:0; overflow:hidden; background: var(--paper-deep) }
```
Measured:

| viewport | `.hr-frame` (x, y, w, h) | caption | CTA | lockup | notes |
|---|---|---|---|---|---|
| **1440x900** | **993.6, 126, 446.4 x 468** (31vw; max-h = 52svh) | y 594, h 86.4 | y 759.7 | 0,126, 993.6x276.7, `font-size 151.2px` (10.5vw) | glyph at slot: sim (1.352, 0.600), scale 0.46 |
| **390x844** | **0, 629.9, 390 x 487.5** (4:5, full bleed) | y 1117.4 | y 483.4 (CTA before the plate) | 0,96.7, 390x99.3 | dock: canvas 390x488, glyph (0.3996, 0.5), scale min(.88, .8*.86)=0.687 |
| 1440x900 reduced motion | 993.6,126, 446.4x468 | | | | dock: canvas 446x468, glyph (0.4765, 0.5), scale 0.8196 |

`--hdr` = `clamp(4.5rem,10vh,6rem)` (90 px at 900 tall), or `4.25rem` below 768 px. `--pad` = `8vw`, or `5vw` below 768 px.
Glyph size, measured from `600 430px "Cormorant Garamond"` in the 512² glyph box: **cap height 275.5 px = 0.538 of the box, width 315.8 px = 0.617**. So at `glyphScale 0.46` in a 900-tall viewport the box is 414 px and the A is about **223 px tall and 255 px wide** in the 468 px plate. At `0.95` it is about **460x527 px**, centred on the full screen.

### 4.3 The float canvas and its clip-path window
```js
// float (fx-gl place()):
canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;display:block;z-index:var(--z-gl);pointer-events:none";
document.body.appendChild(canvas);   // + zWant if setZ was called earlier
canvas.style.clipPath = clip.on ? `inset(${t}px ${r}px ${b}px ${l}px)` : "none";   // each tick, only if changed
// dock:
canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none"; host.appendChild(canvas);
```
In float mode the frame steps aside with `setFloatSkin(true)`, which puts `.hr-frame.hr-float` on the frame:
```css
.hr-frame.hr-float, .hr-frame.hr-float .gl-host { background: transparent; }
.hr-frame.hr-float .hr-poster { visibility: hidden; }
```
Measured at rest (1440): canvas `1440x900`, `clip-path: inset(126px 0px 306px 993.6px)` (exactly the frame rect), z 1. The engine renders **full-viewport pixels even when only the 446x468 window is visible** (§8 S-4).
The sim coordinates in float mode are viewport-based: `x = clientX/innerWidth * aspect`, `y = 1 - clientY/innerHeight`, with `aspect = W/H` of the canvas. In dock mode they are the same, relative to the host rect.

### 4.4 Z-index layers (fx-core.css §2)
`--z-gl 1` (float canvas) · `--z-hero 2` (`.hr-screen`, text over the canvas) · `--z-sheet 3` (every later `main > section` and `.foot`, opaque paper) · `--z-menu 59` · `--z-header 60` · `--z-cursor 70` · `--z-nav-sheet 88` · `--z-nav-img 89` · `--z-cols 90` · `--z-pre 95` · **`--z-pre-gl 96`** (canvas during S1) · `--z-pre-hdr 97` · `--z-switcher 120` · `--z-skip 200`. The band host is `.gl-host[data-gl-host="band"] { background: var(--paper); z-index: 0 }` with `.band-copy` at z 2.

### 4.5 Poster fallback per variant
All three `<img class="hr-poster vN">` live inside the hero `.gl-host`. They are `display:none` by default, and `html[data-variant="N"] .hr-poster.vN` shows the right one (`object-fit: cover`, 892x940 ≈ 2x the desktop plate). The poster is visible whenever the canvas is not over it:
* no JS or no WebGL2: `.hr-still` shows via `html.gl-off | .fx-off-gl | .fx-fail-gl | :not(.rv-js)`;
* dock mode, under the canvas: the canvas is appended after the img, is absolutely positioned and paints on top once `drawn`;
* float mode: the poster is hidden (hr-float) unless the state goes `off`.

The caption instrument reserves two lines against layout shift:
```css
html.rv-js:not(.gl-off):not(.fx-off-gl):not(.fx-fail-gl) .hr-instr { display:block; min-height: 2.8em; }   .hr-instr:empty{display:none}
```
Caption writer (fx-hero.js L376–384). The strings are **hard-coded**:
```js
const bits = [nb(s.n.toLocaleString("en-US") + " particles"), "WebGL2"];
if (typeof s.gpuMs === "number") bits.push(nb(s.gpuMs.toFixed(1) + " ms GPU"));
bits.push(nb("DPR " + s.dpr));   instr.textContent = bits.join(" · ");
// → "16,384 particles · WebGL2 · 0.1 ms GPU · DPR 1"   (reduced motion: no GPU part, gpuMs null)
```

### 4.6 Hero entry film (CSS, first paint)
```css
html.rv-motion .lockup .ch        { animation: rv-rise 1.25s var(--ease-out) calc(var(--hd,.15s) + var(--i,0)*.045s) both }   /* translateY(108%)→0 */
html.rv-motion [data-hero-reveal] { animation: rv-fade-up .9s var(--ease-out) calc(var(--hd,.15s) + .5s + var(--d,0s)) both }
html.rv-motion .hr-frame.hr-curtain { animation: rv-media 1.5s var(--ease-soft) calc(var(--hd,.15s) + .35s) both }  /* clip inset(100% 0 0 0)+translateY(8vh) → none */
```
`hr-curtain` is added only when the plate is docked and the entry is not intro. Desktop with the stage on uses `slotSlit()` on `fx:ready` instead: `clip` goes from a horizontal slit at the slot's mid-height to the slot, t and b, 0.9 s expo.out.

### 4.7 S3 "Otturatore": the scroll shutter (desktop ≥1024, motion, flags.gl, FX.gl)
`buildStage()` sets `stage[data-on]` and `--hero-cover: 100svh` on `<html>`, and turns float mode on:
```css
.hr-stage[data-on] { height: 300svh; }
.hr-stage[data-on] .hr-screen { position: sticky; top: 0; height: 100svh; }
.hr-stage[data-on] + section { margin-top: calc(-1 * var(--hero-cover, 0px)); border-top: 1px solid var(--line); }   /* fx-hero.css */
.sc-sheet { position:relative; z-index: var(--z-sheet); background: var(--paper); margin-top: calc(-1 * var(--hero-cover, 0px)); }  /* fx-scroll.css, "Now" */
html[data-home] .sc-sheet::before { /* 1px var(--line) hairline on top */ }
```
The scrub is a `gsap.to(proxy,{p:1, ease:"none", scrollTrigger:{trigger: stage, start:"top top", end: "+=" + innerHeight, scrub: 0.5, invalidateOnRefresh:true}})` driving `applyStage(p)`:

| element | mapping (seg(p,a,b) = clamp01((p-a)/(b-a))) |
|---|---|
| word 1 "ALBERTO" | `translate(-6%·q1, -118%·q1)`, q1 = seg(0, .40) (it leaves its overflow mask) |
| word 2 "TUVERI" | `translate(6%·q2, (-30·h2 - 88·q2)%)`, h2 = seg(0, .35), q2 = seg(.35, .60) |
| ornament | opacity 1 − seg(0, .15) |
| `.hr-fade` (said / caption / CTA) | f = seg(0, early ? .09 : .30); opacity 1−f, translateY(−24f px); f > .98 → tabindex −1 on links and buttons (the h1 stays in the a11y tree) |
| `clip.t / clip.b / clip.r` | lerp(slot inset → 0, open = seg(.05, .50)) |
| `clip.l` | lerp(slot.left → 0, sweep = seg(.08, .62)) (the left blade is slower: it opens toward the lockup) |
| `params.glyphX/Y` | lerp(slot centre → (a/2, 0.5), gm = seg(.08, .80)) |
| `params.glyphScale` | lerp(0.46 → 0.95, gm) |
| `params.drift` | lerp(0.105 → 0.168, gm) |

The second trigger (`start "top top", end "+=" 2*innerHeight`) calls `onLeave → gl.sleep(true)` and `onEnterBack → gl.wake()`.
Measured at 1440x900: the stage is 2700 px. At **scroll 225** (p .25) the clip is `inset(70 0 170 680.8)`, glyph (1.222, 0.576) × 0.576. At **450** (p .5) `inset(0 0 0 220.8)`, glyph ×0.746. At **900** (p 1) `inset(0)` full screen, glyph (0.8, 0.5) × 0.95, drift 0.168. From **900 to 1800** the "Now" sheet (`.sc-sheet`, document y 1800) rises over the pinned full-screen plate on a hairline. At **1800** the engine goes to `sleep` and the canvas is hidden. The header (fx-nav) is forced `is-hidden` while `stageTop + 0.08vh < scrollY < stageTop + 2vh − 2`, so no header ground ever sits over the moving plate.
The cleanup when leaving ≥1024 restores the transforms and the tabindex, sets `clip.on=false`, and calls `mountHero()` (→ dock).

---

## 5. The closing band (`#contact`, home and case)
```html
<section id="contact" class="band" aria-labelledby="ct-h" data-band>
  <div class="gl-host" data-gl-host="band"></div>
  <div class="band-copy" data-band-copy> eyebrow · <h2 class="d1">Write to me.</h2> · <a class="sc-email" data-magnetic href="mailto:…"> </div></section>
```
```css
.band { position:relative; aspect-ratio:16/9; min-height:70svh; width:100%; overflow:hidden; background:var(--paper) }   /* <768: aspect auto, min-height 78svh */
.band-copy { position:absolute; left:var(--pad); right:var(--pad); bottom:12vh; z-index:2 }   (8vh on phones)
.gl-host[data-gl-host="band"] { background: var(--paper); z-index: 0 }
```
* **What it shows today:** the same hairline flow field on **paper** (not paper-deep), with no emboss. It parts around the **line boxes** of the h2, email and eyebrow (`setObstacle({type:"rects", els, pad:0.4})`, padded 0.4em and 0.24em vertically, read from `.sc-line` masks so an entrance transform does not move the obstacle).
* **When it mounts:** a separate IntersectionObserver on the band host with `rootMargin "100% 0px"` (one viewport early). `chooseHost()` gives the hero priority. The band mount runs in `requestIdleCallback` (timeout 500) and costs one chunked `warm(60)`. It is re-read on `onVariant` (next rAF) and on `onResize`.
* **How it shares the context:** `mount()` re-parents the **same canvas** into the band host in dock mode. `measure()` re-sizes the canvas and re-allocates the trails, so the hero's state is lost and the band re-warms. Measured: 1440 → band 1440x810 at dpr 1 (host "band", state run). 390 → 390x658.
* **Case page:** `hero.init` exits early (`ctx.page !== "home"`). `build` observes only the band host (plus Lenis velocity), so every page closes on this live paper.

---

## 6. Fallback paths (what happens, measured where noted)

| condition | how it is detected | result |
|---|---|---|
| **`?gl=0`** | head adds `html.gl-off` → `flags.gl` false → `gl.init` sets `FX.gl=null` | no canvas; poster v1 visible; `.hr-still` shown; caption instrument hidden; stage off (hero is a plain 100svh section; the frame gets `hr-curtain`); band is plain paper. Measured: `canvas null`, frame bg paper-deep, poster `block/visible`. |
| **no WebGL2** | `glOk = "WebGL2RenderingContext" in window` false | same as `?gl=0` |
| **context or link failure** | `boot()` throws or `checkLink` fails → `fail()` | canvas removed, `FX.flags.gl=false` → `html.gl-off`, `fx:gl:state off` → hero clears the caption and restores the poster (`setFloatSkin(false)`). If S3 was already built it keeps scrubbing the text; the plate shows the poster. |
| **`?fx=` without gl** | `html.fx-off-gl`, `FX.gl` stays null | poster + `.hr-still`; hero guards every call with `gl()` |
| **prefers-reduced-motion** | `flags.motion` false (and any live change reloads the page) | no preloader (head), no Lenis, no stage, dock plate, **no hr-curtain**; `start()` = `warm(40)+warm(180)` (capped at 220) then `sleep(false)` → **one still engraving** from the live engine; stats emitted once with `gpuMs:null` → "16,384 particles · WebGL2 · DPR 1". The CSS kill switch sets every animation/transition to 0.001 ms. |
| **mobile / tablet (<1024)** | `mm` query | no float or S3; dock plate (4:5), `hr-curtain` reveal; preloader counter only (no live window), then `slitOpen` |
| **touch or <768** | `pickTier` | tier **B** (8192) |
| **deviceMemory ≤ 4** | `pickTier` | tier **C** (4096) |
| **slow GPU** | frame 90, median GPU > 5 ms | downgrade one tier once (not below C) |
| **tab hidden** | `visibilitychange` | `sleep(false)`, `wake()` on return |
| **nav cut / variant cover / mobile menu** | `fx:nav:covered`, `fx:lock{menu}` | frozen last frame, zero GL calls, resumes on uncovered/reset/unlock |
| **offscreen** | IO on hero host (`rootMargin 25%`) and band host (`100% 0px`) | no host visible → `sleep(true)` (canvas hidden) |
| **S3 passed** | ScrollTrigger onLeave at 2vh | `sleep(true)`; onEnterBack → `wake()` without re-warm |
| **DPR** | `min(devicePixelRatio, 1.5, sqrt(3.2e6/cssArea))` | see §1.5 |
| **resize** | core onResize (200 ms debounce, only on a real change) → `gl.resize()` (re-measure; if changed: realloc trails, rebuild obstacle, `warm(30)`), hero `measureSlot()+applyStage()`, band re-mount; crossing 1024 → gsap.matchMedia builds or reverts the stage | |
| **context loss** | `webglcontextlost` (preventDefault) / `restored` | state off (poster back, canvas hidden) → relink on restore |
| **GSAP CDN missing** | `!hasG` | `html.fx-static`, all modules off, plain entry: a static page with the poster |

**Quirk found (mobile):** the hero IO watches `.gl-host`, whose ancestor `.hr-frame` runs the `hr-curtain` animation (`clip-path: inset(100% 0 0 0)` → 0 over 1.5 s). IntersectionObserver applies ancestor clip-paths, so the host counts as **not intersecting** during the reveal, and the engine goes `sleep(true)`, which hides the canvas. The probe at 390x844 recorded `run` at 702 ms, **`sleep` from 1157 to 2533 ms** while the curtain opened, and `run` again at 2686 ms. The curtain therefore reveals the **webp poster**, and the live canvas pops in afterwards. A new engine that keeps the same host observer inherits this. Observing `.hr-frame`'s parent, or the `figure`, avoids it.

Other small quirks:
* `heroHost.classList.add("hr-float")` in `init` has no CSS effect, because the CSS keys off `.hr-frame.hr-float`.
* `data-hero-now` selectors are never set.
* `rgb()` in fx-gl parses **#hex tokens only**.

---

## 7. Design tokens, variant V1 "Carta e cobalto" (fx-core.css, computed at 1440)

| token | value |
|---|---|
| `--paper` | `#f6f3ec` (page ground; also the band GL ground) |
| `--paper-deep` | `#ede7dc` (plate ground: `.frame`, `.gl-host`, the hero GL ground "deep", `.hdr.is-solid`) |
| `--ink` | `#24211e` |
| `--graphite` | `#48443e` (lead/body text) |
| `--stone` | `#6b665d` (captions, meta) |
| `--line` | `#dcd5c8` (every hairline, rules, sheet top border) |
| `--accent` | `#2340c9` (cobalt: `.btn`, eyebrow, ornament, focus ring, `::selection`, 10 % of the hairlines today) |
| `--accent-dark` | `#1a2f99` · `--on-accent` `#ffffff` |
| `--f-display` | `"Cormorant Garamond", "CG Fb", "Times New Roman", serif` (weights loaded: 300, 500, 600, italic 500) |
| `--f-text` | `"Figtree", "Figtree Fb", system-ui, sans-serif` (300 to 600) |
| `--f-orn` | `"Cormorant Garamond", "CG Fb", serif` (italic ornament "engineer") |
| `--w-display` / `--w-hero` | `500` / `600` |
| `--lh-display` `0.92` · `--tr-display` `0em` · `--tr-hero` `-0.01em` · `--display-scale` `1.1` · `--ch-t` `0.638em` · `--ch-d` `0.477em` |
| `--pad` `8vw` (<768: 5vw) · `--gut` `6vw` · `--chap` `clamp(6rem,14vh,11rem)` (<768: `clamp(4rem,10vh,6rem)`) · `--hdr` `clamp(4.5rem,10vh,6rem)` (<768: 4.25rem) |
| type scale | `--t-hero clamp(3.1rem,13vw,13rem)` (hero screen ≥1024: `clamp(3.1rem,10.5vw,11rem)`, 151.2 px at 1440) · `--t-page calc(clamp(3rem,8vw,9rem)*1.1)` · `--t-d1 calc(clamp(2.4rem,min(10vh,6.5vw),7.5rem)*1.1)` · `--t-d2 calc(clamp(2.3rem,min(6.4vh,4.2vw),4.5rem)*1.1)` · `--t-d3 calc(clamp(1.5rem,min(4.5vh,2.8vw),2.6rem)*1.1)` · `--t-d4 clamp(1.45rem,1.8vw,1.75rem)` · `--t-lead clamp(1.35rem,1.72vw,1.55rem)` · `--t-body 1.1875rem` |
| eases | `--ease-out cubic-bezier(0.16,1,0.3,1)` (≈ GSAP `expo.out`, entrances) · `--ease-io cubic-bezier(0.66,0,0.22,1)` (= CustomEase `domus.inOut`, travel) · `--ease-soft cubic-bezier(0.22,0.9,0.36,1)` (= `domus`, small UI) · `--ease-xio cubic-bezier(0.87,0,0.13,1)` (≈ `expo.inOut`, the long window travel) · `--ease-dt cubic-bezier(0.25,1,0.5,1)` (= `dtOut`) |
| durations | `--d-micro .25s` · `--d-reveal .9s` · `--d-wipe .5s` · `--d-travel 1.1s` |

The canon is **hairlines only, no radii, no shadows, no cards, uppercase display**. The one sanctioned "colour moment" is cobalt used sparingly. The GL composite reads `--paper`, `--paper-deep`, `--ink` and `--accent` at runtime (`getComputedStyle(documentElement)`).

---

## 8. Drop-in checklist for a WebGPU water engine

### 8.1 MUST: without these, the preloader, plate, S3 or caption break
1. **Module identity.** `FX.register("gl", {init, build, onVariant, onResize})` must be evaluated **synchronously at script load**, with no top-level await. The file must load after `fx-core.js` and before `fx-hero.js`. `ORDER` puts `"gl"` first, and hero.init reads `FX.gl` right away. If you prefer `FX.water`, still register as `"gl"` and set `FX.gl = FX.water = api`, or edit fx-hero's `const gl = () => FX.gl`.
2. **Synchronous API, asynchronous device.** In `init`: if `!FX.flags.gl`, then `FX.gl = null` and return. Otherwise `FX.gl = api` with `pending = true`, then request the adapter and device after two rAFs (the preloader's first frames must not wait on the driver). Build the pipelines with `createRenderPipelineAsync`/`createComputePipelineAsync`. `get linked()` flips to true only when the device, the pipelines and the size-independent buffers are ready. The counter's "Shaders" step and 25 % of the progress depend on it.
3. **Queue while pending.** `mount`, `setObstacle`, `setZ`, `warm`, `wake`, `params` and `clip` must all work before `linked`. `mount()` must accept `pending`. `wake()` while pending means "run on link". `applyClip()` runs even while pending.
4. **Capability flag.** `flags.gl` is `"WebGL2RenderingContext" in window` today and is read **synchronously** by hero (float decision, stage build). For WebGPU do one of these:
   * patch fx-core (`glOk = "gpu" in navigator`), or
   * in the head script add `gl-off` when `!("gpu" in navigator)`.
   Then on **any** async failure (`requestAdapter()` returns null, `requestDevice` rejects, a pipeline or WGSL error, `device.lost`), do the same as `fail()`: remove the canvas, set `FX.flags.gl = false` (→ `html.gl-off` → `.hr-still` + poster), emit `fx:gl:state {state:"off"}`, and call `console.warn` once.
5. **One canvas**, `className "gl-canvas"`, `aria-hidden="true"`, `pointer-events:none`, **`visibility:hidden` until the first frame is presented**. `getContext("webgpu").configure({device, format: navigator.getPreferredCanvasFormat(), alphaMode:"opaque"})`. The engine draws its own ground (`paper-deep` for the hero, `paper` for the band).
   * **float:** `position:fixed; inset:0; 100% x 100%; z-index: var(--z-gl)` (or the `setZ` value), appended to `body`, sized to `innerWidth x innerHeight` × dpr.
   * **dock:** `position:absolute; inset:0` inside the host, sized to the host rect × dpr.
   `mount` is idempotent for the same (el, mode, ground), and `host` = `el.dataset.glHost`.
6. **`clip` = `{t,r,b,l,on}`**, a plain object mutated and GSAP-tweened by hero. The engine writes `canvas.style.clipPath = on ? inset(tpx rpx bpx lpx) : "none"` **each ticker tick**, only when the string changes, and never in dock mode.
7. **`params` = `{glyphX, glyphY, glyphScale, drift}`**, a plain tweenable object, read every frame. **Coordinate contract:** x ∈ [0, aspect], y ∈ [0, 1] **y-up**, relative to the viewport (float) or the host rect (dock). `glyphScale` is the side of the square glyph box as a fraction of the drawing height. The Cormorant A cap is ≈ 0.538 × box tall and ≈ 0.617 × box wide.
   * Values hero writes: preloader 0.46 at the openRect centre; plate 0.46 at the slot centre `(1.352, 0.600)` at 1440; S3 → **0.95 at (a/2, 0.5)**; dock `min(0.88, 0.86·a)` at `(a/2, 0.5)`.
   * `drift` 0.105 → 0.168 can be reinterpreted as "flow energy".
   * A 3D engine should honour these as **screen-space placement of the A**. A lens/view-offset shift of the projection, rather than moving the A in world space, keeps the perspective of the A identical in the plate and at full screen.
8. **`warm(n)` / `get warmLeft()`.** Queue ≤ 220 steps, run in chunks on the ticker (never one long task), **even while asleep**; the reduced-motion still is built this way. The first chunk counts as `drawn`. Emit `fx:gl:stats` when the queue empties. The preloader reads `plate = 1 − warmLeft/90` in float mode, so for water, **warm = settle the fluid into the A** so the first visible frame is already a formed letter.
9. **`wake()` / `sleep(hide)` / `get state()` + `fx:gl:state {state, tier, host}` on every transition.**
   * The **first `run` opens the S1 window**; hero has a fallback at 1600 ms.
   * `off` restores the poster.
   * `sleep(false)` keeps the last frame on screen. In WebGPU that means not calling `getCurrentTexture()`, not submitting and not resizing: the canvas keeps its last presented image.
   * `sleep(true)` hides the canvas.
   * Zero GPU submissions while asleep or off.
10. **`get stats()` = `{n, gpuMs, dpr, tier, state, host, w, h}`** (`w,h` are CSS px, used by `mountHero` in dock). **`fx:gl:stats {n, gpuMs|null, dpr, tier}` at 1 Hz** while running. `gpuMs` comes from the optional `timestamp-query` feature, or is `null`.
11. **`setZ(z)`**: hero sets `var(--z-pre-gl)` (96) during S1 and `var(--z-gl)` (1) at handoff. Remember the value if it is set before the canvas exists.
12. **One loop**: `ctx.gsap.ticker.add(tick)` with `dt = clamp(deltaMs/1000, .001, .033)`, and no own `requestAnimationFrame` loop.
13. **Gating**: `visibilitychange`; `fx:nav:covered` → pause with a still; `fx:nav:uncovered` / `fx:nav:reset` → resume; `fx:lock` with `reason:"menu"`. `wake()` while covered only records the intent.
14. **`resize()` + `onResize`**: re-measure (float = window, dock = host rect), re-apply the DPR cap, re-allocate the size-dependent GPU textures (depth, thickness, bilateral or blur, normal buffers), and settle again briefly. Hero re-measures the slot and re-applies the stage itself. Crossing 1024 px swaps float and dock through `mountHero()`.
15. **Device loss**: `device.lost.then(info => …)` → state `off` (poster back). Optionally re-request the device once if `info.reason !== "destroyed"`. There is no "restored" event in WebGPU, so a rebuild means a new device and new pipelines.
16. **Budgets**: keep the DPR rule (`≤ 1.5` and `≤ 3.2 MP` per buffer). Keep tiers A, B, C, mapped to the particle count and the fluid render resolution. **Re-tune the 5 ms auto-downgrade threshold**, which was sized for a 1 ms flow field and would trip immediately on MLS-MPM plus SSF.

### 8.2 SHOULD: keeps the current feel
1. `scrollVelocity(v)` from Lenis (hero and band both register it) → a slosh or impulse on the water.
2. Pointer: `pointermove` on window, only when `FX.flags.fine` and running. Map to sim units by mode; today it is a gaussian impulse with radius² 0.012 and velocity gain 1.4.
3. `onVariant()` → re-read `--paper/--paper-deep/--ink/--accent` (hex) and `--f-display/--w-hero` if the A shape is rasterised from the font. V1 is fixed, but `?v=2|3&chrome=1` still switches.
4. **Render only inside the clip window in float mode.** Use `setScissorRect`/viewport, or skip passes whose output is fully clipped, from the known `clip` insets. Today the float canvas always renders the full viewport (1440x900, or 2160x1350 at @2x) even when only the 446x468 plate shows, which is about 6x wasted fill. This matters far more for SSF.
5. Build the A from the **same glyph** as the lockup: `600 430px "Cormorant Garamond"` rasterised into a 512² box, as in `paintGlyph()` (fx-gl.js L169–177). Use it as the SDF/target for the fluid, so the water A is the typeset A of the page.
6. Band: decide whether the closing band keeps a live GL effect. If it does, support `setObstacle({type:"rects", els, pad})` and `ground:"paper"`; a calm heightfield ripple with caustics around the text boxes maps well onto `_refs/webgpu-water`. If it does not, `mountBand` can be dropped and the band stays plain paper; in that case remove the band observer from fx-hero.
7. Observe `.hr-plate` (the figure) instead of `.gl-host` for the hero IO, to avoid the curtain quirk in §6.

### 8.3 CAN be simplified or dropped
* `window(rect)`, the `fx:gl:linked` event and the public `recolor()`: unused externally.
* `setObstacle({type:"glyph", char, font})` can become implicit (the hero is always "A"). Keep the method as a no-op for compatibility, or edit the two fx-hero calls.
* The tier C `deviceMemory` rule, the timer-query path, and all flow-field internals (glyph R/G/B channels, trails, transform feedback, `interiorChannel` flood fill).
* WebGPU allows **several canvases on one device**. The band could get its own canvas and context and skip re-parenting and trail loss. The hero preloader→plate handoff still needs the single float canvas.

### 8.4 Non-engine edits the swap requires (outside fx-gl.js)
* `parts/head.html`: replace `<script defer src="fx-gl.js">` with the new file, then run `node assemble.mjs` (regenerates index.html and case.html). Optionally add the `gl-off` rule for `!navigator.gpu`.
* `fx-core.js` L56: the capability test (`WebGL2RenderingContext` → `navigator.gpu`). fx-core is owned by WP-A, so coordinate the change or do it in the head script.
* `fx-hero.js` L379: the caption strings `" particles"` and `"WebGL2"`. The caption must stay **≤ 2 lines at the narrowest desktop column (18rem = 288 px)**, because `.hr-instr` reserves exactly 2.8em.
* Optionally, `fx-hero.js` L71: the preloader labels "Shaders" and "Plate".
* `parts/b-hero.html`: the caption label `Fig. 01 · Flow field, rendered live`, the three poster `alt` texts, `.hr-still` text, and the posters `fx-plate-v{1,2,3}.webp` (892x940, re-captured from the new engine; the mobile frame crops to 4:5 with object-fit cover). The dossier cannot promise the new copy: it needs Alberto's approval.
* `parts/c-footer.html`: the colophon `GSAP, Lenis, WebGL2`.
* `dev-gl.html` is a **standalone art-director scratch PoC** of the flow field. It has its own rAF, is not wired to FX, is not linked from the site, and takes the URL knobs `v n dpr ts dil gx gy gs decay gain acc ag hud`. The same pattern, a standalone `dev-water.html` with a HUD and knobs, is the right place to tune the water before wiring it in.

### 8.5 Minimal acceptance probe (reuse the numbers in §3–§6)
* **1440x900, fresh session:** `FX.gl.state` is `run` shortly after `fx:built` (measured 51 ms under the preloader and 237 ms on a plain entry). The canvas z is 96 during S1 and 1 after `fx:intro:handoff`. `clip` ends at `inset(126px 0px 306px 993.6px)`. `fx:ready{entry:"intro"}` fires at tl + 1.25 s. The caption shows the stats line.
* **Scroll 0 → 900 → 1800:** the clip goes to `inset(0)`, the glyph to (0.8, 0.5) × 0.95, and the state goes to `sleep` with the canvas hidden at 1800. Scrolling back wakes it with no re-warm.
* **390x844:** dock, canvas in `.gl-host`, 390x488 at dpr ≤ 1.5, tier B. `#contact` → host `band`.
* **Reduced motion:** a single still, state `sleep`, caption without the GPU part.
* **`?gl=0` and a forced failure:** no canvas, `html.gl-off`, poster + `.hr-still`, zero console errors.
