# p-astro: the Astro build in web/ (parity with assemble.mjs)

- Done: web/ builds the 32 pages and fx.css BYTE-IDENTICAL to assemble.mjs (parity 32/32 at zero, shared files 142/142 the same bytes); the claims gate takes --dir; assemble's structural asserts ported and green on dist; looked at (pairs below).
- Next (director): commit web/ (not node_modules/dist/.astro), .gitignore, scripts/check-claims-proto.mjs. Re-run `npm run build && npm run parity` after the wave: parity reads the assembled files on disk, so a lane that edits css/ or a partial without assemble.mjs shows up as a difference (the Astro side is then the fresher one).
- Decisions: below.
- Run and look: below. Port 5320 (Astro dist), 5325 (live tree, for the pairs); both stopped.

## How to build, check and serve
```
cd web
npm install                 # astro 7.3.8 only (pinned; 7.4.x needs Node >= 22.23, this PC has 22.17.1)
npm run build               # node scripts/build.mjs = astro build with ASTRO_TELEMETRY_DISABLED=1 → web/dist
npm run parity              # 32 pages + fx.css vs public/proto/rivista; shared files vs public/ (exit 1 on a difference)
npm run asserts             # assemble.mjs's structural asserts on dist
npm run claims              # node ../scripts/check-claims-proto.mjs --dir=dist/proto/rivista
python ../scripts/serve-static.py 5320 dist   # → http://127.0.0.1:5320/proto/rivista/ (it/: …/it/)
```

## Decisions
- One source: the partials (parts/*.html), strings.mjs, cases.json, c-main.case.mjs and c-main.404.mjs are imported/read from public/proto/rivista/parts. Nothing copied. The partial HTML stays the one source of markup (not re-typed into .astro templates, which would make a second copy to drift while assemble.mjs is still live).
- Components (.astro, each prints its partial or template): Head, Header, Overlays, Footer, FooterContact, Footer404, MainCover/Work/About/Consulting/Obla/Contact, Case, NotFound, Raw (the shell's literals), Site (the shell), layouts/Page (finishes the page).
- lib/site.mjs is assemble.mjs's build code ported 1:1 (meta, langSwitch, i18n, LINK, rootAttrs, relocate, rooted, ship, shipCss, buildCss, the page table). Page.astro renders its slot to a string (Astro.slots.render) and runs finish() = the same fill → relocate/rooted → ship as assemble. A placeholder left or an unknown {{t:id}} throws: the Astro build fails, as assemble's does.
- Routes: index.astro, it/index.astro, [...page].astro (getStaticPaths: the other 30), fx.css.js (an endpoint). build.format 'preserve' (format 'file' turns it/index into it.html; a rest param "index" collapses to the folder), trailingSlash 'ignore', compressHTML false.
- No Astro i18n routing: the edition is a path prefix produced by getStaticPaths, exactly as today; Astro's i18n would only add redirects/fallbacks we do not want.
- Shared files (fx-*.js, stage/, icons/, og/, site.webmanifest, ../captures) are copied UNTOUCHED by integrations/shared.mjs at astro:build:done; publicDir points at a folder that does not exist, so Astro copies nothing of its own. Nothing is bundled: the page has no Astro script or style (no hoisting, no generator tag).
- Output path mirrors the live URLs: dist/proto/rivista/… and dist/captures/, so the 404's rooted /proto/rivista/ paths and /captures/ work unchanged.

## Parity (web/scripts/parity.mjs)
All 32 pages: bytes same, head 0, body 0, text 0 differences; fx.css bytes same; 142 shared files same. Allowed differences: none (ALLOWED is empty). A seeded test (a class and a word changed on a copy) is caught: head 1, body 2, exit 1; the ported asserts catch it too.

## Asserts on dist (web/scripts/asserts.mjs)
Covered: 1 gallery steps + each case's opener and plate + main[data-case]; 2 "More work" cycle; 3 one h1, data-ground, WATER; 4 dawn close (same bytes, Contact none, 404 own engine line); 5 scene grammar; chapters on one page; no case.html; no duplicate id; html[lang]; language links to the twin and back; hreflang pair + canonical; R4 every local href/src and loader script is a file OF THE BUILD (980 references, incl. /captures srcset); same elements in both editions; no English on an Italian page; 6 share-card manifest.
Not ported (source checks, not output, still run by `assemble.mjs --check` on the same parts): I-1 both languages, I-2 no unprinted string, I-3 markup whitelist, I-9 cases' twins, Italian typography. Placeholder/unknown-string checks: the Astro build itself fails.

## Looked at (.shots/p-astro/pair-*.png, Astro left, live right, 1440x900 DPR 2 and 390x844 DPR 2)
Mean |diff| per pair 0.00–1.57 (stage motion timing only); console and network clean on both. index, work, case-sphere-ai, about, contact, the same in it/, phone index and work, work scrolled to the first gallery step, work ?stage=0, about with reduced motion: the same picture.

## Open
- npm warns EBADENGINE for undici@8.12.4 (a dependency of astro 7.3.8 wants Node >= 22.19; this PC has 22.17.1). The build runs; upgrading Node to 22.23+ also unlocks astro 7.4.
- Not tried: `astro dev` (the dev server would need the shared files served: a small middleware or publicDir on a staged folder); a release build with RV_ORIGIN/RV_ROBOTS through Astro (same code path, unchecked).
- assemble.mjs and lib/site.mjs now share logic by copy; at cut-over assemble.mjs goes (or becomes a thin wrapper), and the source checks move into web/scripts.

## Next phase (no code): keeping the stage alive between pages
Where the router goes: `<ClientRouter />` (astro:transitions) in Head.astro after head.html's markup, with `transition:animate="none"` on the root (the cut's sheet is the transition, not the browser's view transition). The stage's canvas becomes markup instead of a node fx-stage.js creates: one `<canvas class="stage" data-astro-transition-persist="rv-stage">` in a partial every staged page prints (a-overlays.html), so the router moves the SAME canvas (and its GPUCanvasContext) into the next page. Persist the cut's sheet the same way (`rv-cut`). The 404 does not print it: the canvas is dropped and the stage disposed there.
fx-stage.js would have to: (1) take its canvas from the DOM if present; (2) split boot from page: keep device, pipelines, swarm buffers, camera and clock across navigations; on `astro:before-swap` freeze the scenes (the cut's push already drives `stage.cut`), on `astro:after-swap` dispose the old page's scenes, re-scan [data-stage], re-measure anchors and keep-outs, rasterize the new data-refract type, load the new scenes and blend the camera from the old pose instead of re-opening; (3) re-read #rv-i18n for the instrument line; (4) never re-ask the adapter (window.__rvGpu/__rvStage are used once).
fx-nav.js would have to: stop calling location.assign and the sessionStorage handoff (rv-pt / data-arrive); run the cut on the router's events: `astro:before-preparation` raises the sheet and starts the stage push while the router fetches, `astro:before-swap` waits for "covered", `astro:after-swap` writes the arrival state, `astro:page-load` lowers the sheet; the language link is a navigation like any other. Reduced motion and ?stage=0: the router swaps with no sheet.
The head boot script and fx-core.js: the router swaps <html>'s attributes, so the boot's classes (rv-js, rv-motion, gl-off, sc-on, mo-wait) are re-applied on `astro:after-swap`; fx-core gets an FX.reboot() for `astro:page-load` (ScrollTriggers killed and rebuilt, Lenis to 0, titles split again); the fx-* classic scripts stay loaded once (they are appended by the head loader, which must not run twice).
