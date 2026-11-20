# o-router — the stage stays alive between pages (plan 70, phase 3)

- Done: plan (below). Code written (router, Router.astro, Page.astro metas, fx-stage adopt/handOver, stage.reset,
  fx-nav soft cut + fly, fx-core leave/softY, head __rvHead, cuts.css cut-soft, portal block, serve-static two roots,
  parity ALLOWED); strips exist in .shots/o-router/strip (8). CUT at ~16:43; resumed 17:18, finished 17:58.
- Resumed (17:18-17:58): (1) the swarm HALVED during a flight and stayed halved on every later page (the stage now
  outlives the page): stage.js budget() ignores the portal's frames; stage.reset() gives the next page the whole swarm.
  (2) GPU in flight p90 4.4 ms -> 3.1-3.3 ms (1440 DPR2 A): stage.js drawNow (leaving, glass over the frame: half the
  points at p>0.3, a quarter at p>0.6, ink compensated, all still simulate); the room's plates under the portal: the 4
  nearest leave over p 0.08..0.3, the farther ones over p 0..0.2; coming out the 4 nearest return over p 0.18..0.02, the
  rest over p 0.04..0. (3) portal.js edge 0.12 + 0.88*ss(0.4,0.9,p): the arris dim while it sweeps. (4) rv-router.js: the
  language link (en <-> it/) loaded ../fx.css against the old address (404, unstyled page): a page in another folder is
  written absolute at parse (DOMParser hook) - Astro preloads and swaps before it moves the address bar. (5) CRLF that
  had crept into cuts.css and Site.astro put back to LF.
- Results: all gates OK (assemble --check 0, claims OK, web build/asserts/claims, PARITY OK with the 3 router allowances);
  floor OK; 20 navigations: listeners 75, observers 10, timeouts 1, frames 2, triggers 0, tweens 1, lenis 1, canvas 1,
  formations/textures per page, no growth; asleep 0 submits; console clean; 1 load in 20 navs + back/back/forward. Soft
  cut: swap ~272 ms, new room's first frame ~60-110 ms after the swap, arrived 660-830 ms (faster than the 900-1100 asked);
  card name and arriving title never together (25 pairs). Assembled build (5333) vs HEAD (5334): pairs and first frames
  the same within noise. Deep link + reload on 6 pages, ?stage=0, ?gl=0, reduced, failfield, failsplat: OK, soft swap.
  Way back: a throwing swap and a page that never boots both end loaded for real. GPU numbers noisy (o-glass renders).
- Needs elsewhere (o-glass, stage/plates/plates.wgsl.js): the portal still reads as (a) a 1-2 px white hairline sweeping
  across while it is at a slant (its arris/bevel highlight; edge already dimmed from portal.js) and (b) a soft grey vertical
  column inside it (the room's light beam mirrored in its faces / TIR), at p 0.2-0.6 both ways: strips g2case, hdr2about,
  m-g2case. The glass shows mostly as the room displaced across its arris.
- Run and look: below (port 5330; captures .shots/o-router/). Probes in _scripts: soft, nav20, gpu (+gpu3 per pass),
  strip, pairs (PORT=), first (MINE= HEAD=), states, wayback, lang, pstill.

## Commands
```
cd web && npm run build                                   # → web/dist (Astro + the router)
python scripts/serve-static.py 5330 web/dist public       # first web/dist, then public/: stage/script edits live without a rebuild
#   → http://127.0.0.1:5330/proto/rivista/   (the assembled pages: python scripts/serve-static.py <port> public, unchanged)
```

## Plan (written before code)
1. Router: NOT `<ClientRouter />` (its click handler takes every same-origin link and its style/prefetch come with it). A
   component `web/src/components/Router.astro` prints one processed `<script>` that shadows `document.startViewTransition`
   (no browser view transition: the browser would freeze rendering and snapshot the canvas; fallback "swap"), then
   dynamic-imports `astro:transitions/client` (navigate, swapFunctions). Page.astro adds the two metas
   (`astro-view-transitions-enabled`, `astro-view-transitions-fallback=swap`). Assembled pages: none of this, same code paths as today.
2. What persists: the stage's canvas (`canvas.fx-stage`, made by fx-stage.js) and the cut's sheet (`[data-cut]`) are lifted
   out of the old body and put into the new one by our own swap (`astro:before-swap` → `event.swap`); the GPUDevice,
   pipelines, swarm buffers, camera, clock and the portal's progress live in `window.__rvKeep` (fx-stage hands it over).
   The header is NOT persisted (aria-current, the language link and the rule differ per page; it is cheap).
3. What is rebuilt per page: everything else, by giving each page a fresh script realm: on the swap the old page's
   listeners on window/document/<html>/media queries/fonts/GPUDevice, its observers, timeouts, intervals and rAFs are
   removed (a small tracker installed by the router, persistent code uses the saved originals), GSAP's tweens and
   ticker are stopped; then gsap, ScrollTrigger, Lenis and fx-core…fx-stage are executed again (from the HTTP cache),
   as on a load. Scenes/formations, textures, text rects, Lenis, ScrollTriggers, steps, titles: their own boot.
   The head's boot classes: head.html exposes `window.__rvHead(arrival)`; the router calls it after swapRootAttributes.
4. One soft navigation, in order: click (fx-nav) → fx:nav:start → stage.push + portal(1, 300 ms), card plays over the glass
   (no flat sheet; the dawn sheet floods only toward Contact) → navigate() at once (the fetch runs during the flight) →
   loader waits for the fetch AND the glass full (p ≥ 0.9, cap 420 ms) → before-swap: old page leaves (handOver, purge),
   a bridge rAF keeps drawing the stage (frame only) → swap (canvas + sheet carried over) → __rvHead({soft arrival}) →
   after-swap: scroll, scripts again → new fx-stage adopts the stage (stage.reset(): old formations' targets/bodies
   freed, then the new scenes registered, weights snapped) → first frame, bridge stops → FX.nav.arrive(): card clears,
   fx:nav:uncovered → portal 1→0 (the eye comes out), push back; title rises.
5. Back/Forward: popstate → before-preparation (traverse) → the same flight with the side mirrored (-1 back, +1 forward),
   card from a link to that page if one is on screen, else no card; scroll restored from history.state after build.
6. Reduced motion, ?stage=0, no WebGPU: the router still swaps (no flight, no sheet); the new page boots plain.
7. THE WAY BACK: any throw in our swap/after-swap, a fetch Astro cannot use, or no FX ready 5 s after the swap → plain
   navigation (`location.href = to` / `location.reload()` once the URL is the new one). A page without the metas
   (another site, a download) is Astro's own full navigation.
8. 404: data-nogl → the new fx-stage is not allowed → it destroys the kept stage (device, canvas).
