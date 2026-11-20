# Scout 02 — the host and the page

> Read-only map of `public/proto/rivista/` (`rv/`) at `feat/water-viva`, HEAD `a42e0b0`, written 2026-11-09 for the designers and builders of the "rivista bianca in 3D + night worlds" round. Code wins over this file. No line numbers on purpose: search by the symbol names given.
>
> Status: IN PROGRESS — sections are filled one by one; a section that still says "(pending)" was not reached.

## 0. One-screen summary

(pending)

## 1. Boot: from the head script to `FX.ready`

Files: `parts/head.html` (the inline head script), `fx-core.js` (`boot`, `phase`, `ready`, `plainEntry`), `fx-water.js` (module `"gl"`), `fx-hero.js` (`intro`), `fx-nav.js` (`arrive`).

### 1.1 What is on `<html>` before the first paint

`assemble.mjs` writes `<html lang="{{LANG}}" data-variant="1"{{HOME}}>`: `{{HOME}}` is ` data-home` on the home, empty on a case, ` data-nogl` on the 404. The **inline head script** (sync, in `<head>`, before the stylesheet link) then decides everything a stylesheet needs, and writes it on `<html>`:

| Written | When | Read by |
|---|---|---|
| class `rv-js` | always (script runs) | every "hidden until revealed" CSS rule is scoped under it |
| class `rv-motion` | `prefers-reduced-motion` is not `reduce` | every motion rule in the five stylesheets |
| class `gl-off` | `?gl=0`, or no `navigator.gpu`, or `html[data-nogl]` | poster path (fx-hero.css), `FX.flags.gl` |
| `data-arrive="<type>"` + `window.__rvArrive` | a fresh `sessionStorage["rv-pt"]` record (< 8 s, `to === location.pathname`), else a `back_forward` navigation (`{type:"back"}`). Types seen: `flip`, `back`, the S5 sheet types (see §3/§8) | fx-nav.css §6 (cover painted at first paint), `fx-core` (entry = arrive) |
| `--pt-t/r/b/l/x/y/s`, `--pt-ar`, `--pt-from-*`, `--pt-to-*`, `--pt-dur`, `--pt-delay`, `data-pt-go`, `--nv-lab-dur`, `--nv-lab-delay`, `--nv-sub-delay`, `data-nv-lab`, `data-nv-lift`, class `sc-film` | on an arrival: the cut's geometry and the leaving page's clock | fx-nav.css §6 keyframes continue the move across the document seam |
| class `rv-rhold` | a reload that the boot will restore (`rv-y|<path>` or `rv-place` record) | fx-core.css holds the first paint; `boot` removes it after its restore step |
| class `sc-hold` | a plain case load with motion | fx-scroll.css §10 holds the case hero; `FX.ready` removes it |
| `data-preloader` + class `rv-pre-run` + `window.__rvT0` | home, motion, no arrival, no hash, `rv-intro-seen` not in sessionStorage, no fresh `rv-place`, **not `gl-off`** | S1 (fx-hero.css §3, `fx-hero.js intro`) |
| `--hd` (5.4 s / 0.45 s / 0.15 s), `--tempo` (`?tempo=` 0.25–4) | always | hero film delays, intro tempo |
| `window.__rvGpu = { t, used:false, p: navigator.gpu.requestAdapter(opts) }` | plain **home** entry with motion, no preloader, not gl-off, no `?gpufail=` | `fx-water.js requestRealAdapter` consumes it once. Options: `{}` on Windows, `{ powerPreference: "high-performance" }` elsewhere |
| three `<link rel="preload" as="font">` (gstatic woff2: Cormorant Garamond roman, Figtree, Cormorant italic) | always | fewer font swaps |
| `window.__rvJs = { done, boot, t0, t1 }` | always | the deferred loader, below |

### 1.2 The module list and how it is loaded (MC-33)

The head script holds one array `JS` of ten URLs, in run order:

1. `https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js`
2. `…/ScrollTrigger.min.js` 3. `…/SplitText.min.js` 4. `…/CustomEase.min.js`
5. `https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js`
6. `fx-core.js` 7. `fx-water.js` 8. `fx-hero.js` 9. `fx-scroll.js` 10. `fx-nav.js`

- On `html[data-nogl]` (404) `fx-water.js` is spliced out of the list.
- They are **not** `<script defer>`: `jgo()` inserts one `<script async=false>` per URL into `document.head` **after the first frame** (`requestAnimationFrame` → `setTimeout(0)` → `jarm`) and never before the document is parsed. A hidden tab (no rAF) starts them from `load` / `visibilitychange`.
- `async=false` keeps insertion order = execution order. Each `onload`/`onerror` counts down; when all ten have settled `__rvJs.done = true` and `__rvJs.boot()` runs (fx-core set `J.boot = boot`; if it loaded late it checks `J.done`). A CDN failure therefore still boots: `fx-core` sees no GSAP and goes static.
- Under `it/` `assemble.mjs relocate()` rewrites `'fx-*.js'` to `'../fx-*.js'`; on the 404 `rooted()` rewrites them to `SITE.base + file`. **A new script file must be named `fx-<letters>.js`** to be relocated by those two regexes (`/'(fx-[a-z]+\.js)'/g`), and must be added to the `JS` array by hand.
- `?fx=core,gl,hero` (fx-core `allow`): only the listed modules get `init`; the others get state `off` and class `fx-off-<name>` on `<html>`. Names are the **registry names** (`gl`, `hero`, `scroll`, `nav`), not file names; `core` is always on. `?fx`, `?gl`, `?chrome`, `?blocks`, `?exit` are carried along internal `.html` links by `syncLinks()` (`KEEP`) when present.

### 1.3 What blocks the first paint

- The inline head script (sync, small, no network).
- `fx.css`: one local stylesheet, the **only render-blocking resource** (generated; ~103 KB of source before the comment strip). The `@font-face` rules are in it (`fx-fonts.css`), the font files are preloaded.
- Nothing else. No script, no CDN request, no WebGPU call sits before the first paint, except `__rvGpu`'s `requestAdapter` on a plain home entry, which is asynchronous (it is placed there *because* it freezes the compositor for ~180 ms and nothing is on screen yet: CONTRACTS §21 R4).
- The LCP element on the poster path is `img.hr-poster.v1` (`fetchpriority="high"`, 892×940).

### 1.4 Registration, then `boot()`

At evaluation each module only calls `FX.register(name, { init, build, onVariant, onResize })`. `fx-water.js` registers as **`"gl"`** and, at evaluation, calls `startPrewarm()` when the page is not "gated" (`gated()` = `html[data-arrive]` or not the home). Init/build order is `ORDER = ["gl","hero","scroll","nav"]`; **a module registered under any other name runs after `nav`**, in registration order (`names()`).

`boot()` (fx-core), in order:

1. `syncLinks()`; listeners: a live change of `prefers-reduced-motion` → `savePlace()` + `location.reload()`; debounced resize (200 ms) → each module's `onResize` + `fx:resize`; the 1024 px breakpoint anchor (re-`refresh` and put the reader back on the same section ratio).
2. `entry` = `"intro"` (`data-preloader`) | `"arrive"` (`data-arrive`) | `"plain"`. `readMotion()` fills `FX.motion = { D, S, E, bezier, tempo, exit() }` from the CSS custom properties of fx-core.css §2 (`--d-*`, `--st-*`, `--ease-*`, `--tempo`).
3. No GSAP (CDN down): every module `off`, class `fx-static`, `plainEntry()`; the page is a complete static document.
4. `gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase)`; `ScrollTrigger.config({ ignoreMobileResize: true })`; CustomEase `domus`, `domus.inOut`, `rv.out`, `dtIn`.
5. `initLenis()` (motion only, §3). On a non-plain entry: `FX.lock("entry")` (Lenis stopped, `<main inert>`, `html[data-fx-locked]`) and a 6 s safety timer that forces a plain entry.
6. `ctx = { FX, gsap, ScrollTrigger, mm: gsap.matchMedia(), page: "home"|"case", variant, entry, arrive }`.
7. `phase("init")` over the modules, each in `try/catch`; an async `init` may hold the boot at most 3 s. A throwing module gets `fx-fail-<name>` and its content must stay visible.
8. `await FX.fonts(entry === "plain" ? 1500 : 900)`.
9. `phase("build")`; on a covered entry (intro / arrive) it yields between modules (`yieldBuild`, a 32 ms frame slice) so the cover keeps painting.
10. `ScrollTrigger.refresh()`, then the reader's place: `takePlace()` (language switch / RM reload: nth `main > section`, ratio), else `hashY()`, else `takeReloadY()`; applied through `FX.scroll.restore({ y })`.
11. `rv-rhold` removed; `fx:built` emitted (sticky).
12. Entry film: `intro` → `FX.hero.intro()` (which ends with `FX.ready("intro")`); `arrive` → `FX.nav.arrive()` (ends with `FX.ready("arrive")`); else `plainEntry()` → `FX.ready("plain")`.
13. `FX.ready(entry)`: runs once; removes `sc-hold` / `rv-rhold`, `unlock("entry")`, dispatches `fx:ready { entry }` (sticky).

Sticky events (late listeners still get them): `fx:ready`, `fx:built`, `fx:intro:handoff`, `fx:nav:landed`.

Other globals a builder will meet: `window.FX` (namespace: `flags`, `on/once/emit`, `lenis`, `scrollTo`, `motion`, `whenStill`, `still`, `lock/unlock/locked`, `fonts`, `register`, `exits`/`runExits`, `gl`, `hero`, `scroll`, `nav`, `page`, `has`, `t`, `num`, `lang`, `yieldBuild`); `window.__rvWater` (the frozen water flag set, published before the engine is imported); `window.__water` (only with `?debug=1`).

## 2. How the one canvas is hosted

(pending)

## 3. The scroll system

(pending)

## 4. The home's DOM, chapter by chapter

(pending)

## 5. Adding a new home chapter, end to end

(pending)

## 6. Degraded paths

(pending)

## 7. Probes and gates that touch all this

(pending)

## 8. Day and night

(pending)

## What this means for an immersive stage under the whole page

(pending)

## Unknowns

(pending)
