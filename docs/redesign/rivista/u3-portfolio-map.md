# U3 — Portfolio repo map for the "rivista bianca" re-skin

Repo: `C:/Users/alber/Portfolio`, branch `feat/redesign-2026-09` (clean, HEAD d33a2d6). Read-only survey, every claim below was checked in the files.

## (a) CONTENT: keep as-is

| File | What it holds | Notes for the re-skin |
|---|---|---|
| `src/content/works.ts` (846 l) | `Work[]`, 9 entries: spherenode, sphere-ai, maintech-oma, sersan-io, domus-tua, sersan-brand, badante24h, doit-voice-ai-agent, agricultural-supply-chain. `study` {summary, problem, action, result, metrics: WorkMetric[], links: WorkLink[]}, EN/IT `Localized`. `WorkMetric` = `{label, value?}` or `{before, after, unit}` + `source`. `capture` only on spherenode + sersan-io (`/captures/*-1600.webp`). `worksConfirmed` export feeds the sitemap. | Keep data. Two job-order-flavoured fields: `phaseRole: "Engineer"/"Creative Lead"/"Full-Stack"` (l.49, 67) and `schematic?: "rag" \| "job-order"` (l.73; maintech-oma = "job-order", sphere-ai = "rag"). Harmless to keep. The type comments reference REDESIGN-SPEC §E.9, not binding. |
| `src/content/career.ts` (132 l) | `identity`, `experience[]`, `education[]` (with thesis), `links` + `linkList` (email, linkedin, github, sersan, spherenode) | Keep. |
| `src/content/findings.ts` (95 l) | `Finding[]` {work slug, finding, fix, source} — the Diagnosis table rows | Keep the data. Rendered only by `Diagnosis.tsx` + `SubForm.tsx`. |
| `src/data/skills.ts` (76 l) | `skillGroups` (8 groups, CV verbatim) + `languages` | Keep. Rendered by `Estimate.tsx` ("Parts catalogue") and SubForm. |
| `src/content/dict.ts` (690 l) | "use client"; zod `sectionSchema`, `Dict` type, `en`/`it` objects, dev-only `sectionSchema.parse(en/it)`, `useDict()` reads `useUI().locale`. Also exports `PHASE_IDS`/`PhaseId` (used by `src/lib/phases.ts`). | Keep the mechanism (zod shape, EN≡IT parity, `useDict`). Sections split below. |

### dict.ts sections, world-neutral vs job-order

Neutral, reuse (maybe re-key/rename captions only):
- `header.name`, `header.role1`, `header.role2`, `header.degree` (identity; `header.caption` "Job order"/"Ordine di lavoro" and `roleCaption` are form captions)
- `intake.positioning` (the one-line positioning sentence, good lead paragraph)
- `work.indexTitle` ("Things I've built"), `work.noPhoto`, `work.captureLabel`, `work.none` ("—" for Voice AI Agent)
- `subform.pendingUrl`, `subform.pendingFilm` (declared holes, PRODUCT.md §8.1)
- `release.headline`, `release.cta`, `release.email`, `release.links.*`
- `about.captions.{summary,experience,education,thesis,languages,photograph}`, `about.noPhoto`
- `bench.readouts.*`, `bench.values.*`, `bench.settling/running`, `bench.tier.*`, `bench.reasonNoGpu/Reduced/Lost`, `bench.compiling` (engine-honest status strings; wording "bench/test bench" is world-flavoured, the reason lines are neutral)
- `a11y.skipMain`, `a11y.langToggle`; `a11y.skip` points at "work performed" (#phase-work)
- `meta.title/description` (client mirror of `src/lib/site.ts` siteMeta; `meta` has no component consumer)
- `footer.copyright`

Job-order specific (need NEW copy keys in the rivista world, or deletion):
- `strip` (employer/date/"Status · OPEN") — HeaderStrip provenance
- `phases` (Intake/Diagnosis/Estimate/Work/Test/Release + roleTag) and `band` (counter "{n} / 6", back "Job order ↖", ariaLabel) — PhaseBand nav
- `header.caption`, `header.roleCaption`
- `intake.ownerCaption` ("Owner/Titolare"), `intake.currentCaption`
- `bench.caption` ("Test bench/Banco prova"), `bench.figure` (mentions "letter-A field"), `bench.live`/`bench.still` stamp words
- `diagnosis.caption/cols` ("Findings", finding/fix/source)
- `estimate.caption/cols` ("Parts catalogue", Part group/Qty/Items)
- `work.caption` ("Work performed"), `work.summaryCaption` ("Line items on file"), `work.cols` (Item/Measured/Role/Client/Open), `work.more` ("4 more line items")
- `measured.caption/cols/pair` (Before/After/Source — the table model is fine, captions are form-speak)
- `subform.partNoGroup` ("not in the catalogue"), `subform.fields` (Customer/Job/Problem reported/Work performed/Parts/Links), `subform.next` ("Next line item")
- `release.caption` ("Release/Consegna"), `release.stamp` ("RELEASED")
- `about.captions.owner`
- `notFound.title` ("No job order at this address."), `notFound.stamp` ("VOID")
- `styleguide.*` (entire block: palette roles, AA uses, type samples, band, motion verbs) — tied to the 11-colour sheet palette
- Rivista needs new keys the dict does not have: nav/menu labels (Work, About, Contact), hero/section display titles, "scroll", preloader film words, rail/panel labels, monogram label, "next project".

`check-claims.mjs` scans `dict.ts`, `works.ts`, `findings.ts`, `career.ts` (not skills.ts). Its WHITELIST (l.66-75) holds job-order figures: "6" (band counter), "4" ("4 more line items"), "1600"/"1000", "4.5", "1.18", "3.5" (stamp scale/rotation). Prune when the copy goes.

## (b) INFRA: keep

- `src/app/_providers/Smooth.tsx` (66 l): the only scroll loop. Lenis `{lerp: 0.1, smoothWheel, wheelMultiplier: 1}`, `lenis.on("scroll", ScrollTrigger.update)`, `gsap.ticker.add(t => lenis.raf(t*1000))`, `lagSmoothing(0)`, `window.__lenis` (used by RouteTransition, visual-gate, probes). Syncs `<html lang>` from the locale, `<html data-motion="reduced">`, `useUI.reducedMotion`. Under reduced motion there is no Lenis (native scroll). World-neutral. Keep.
- `src/lib/gsap.ts` (30 l): single `registerPlugin(ScrollTrigger, SplitText, Flip, Observer, CustomEase, useGSAP)`. Registers CustomEases `rule`, `stamp`, `sheet` (job-order names, mirrored by `--ease-*` in globals.css and `EASE` in motion.ts). Keep the file, rename/replace the eases together with `motion.ts` + globals.css.
- `src/store/ui.ts` (61 l): zustand persist `{locale, reducedMotion, loaded}`, `partialize` → only `locale` persisted, **`name: "ocean-ui"` must NOT be renamed** (load-bearing: stored visitor locale). `initialReducedMotion` resolved at store creation to avoid a from-state flash. No menu/sound state (comment: "the phase band IS the nav"); a rivista menu would add state here.
- Navigation handshake (mechanics world-neutral, artwork job-order):
  - `src/components/transition/TransitionLink.tsx` (66 l): intercepts only primary-button, unmodified, internal string hrefs with a different pathname; hash-only same-path hops fall through (template does not remount); `stashFlip(e.currentTarget)` before `coverAndNavigate(() => router.push(href))`; `dropFlip()` if no overlay. Consumers: PhaseBand, not-found, SubForm, WorkTable.
  - `src/components/transition/CoverOverlay.tsx` (166 l): mounted ONCE in `layout.tsx` (must survive the route swap). Module-level `controller` + `navigating` latch (second click swallowed). `cover` sets `[data-page-root]` inert, then a 2.5 s `gsap.delayedCall` → `bail()` (animated retract) if the push never lands. `handoff()` on pathname change (passive effect, after the entering route's pre-paint cover) clears instantly; skips if a newer cover `tl.isActive()`. Sheet element takes pointer-events while covering; host `aria-hidden`, `pointer-events-none`.
  - `src/components/transition/RouteTransition.tsx` (160 l) + `src/app/template.tsx`: ENTER. Runs `useGSAP` with `dependencies: [pathname]` (keyed on `usePathname()` because the root template only remounts on top-level segment change: `/work` → `/work/<slug>` was a hard cut). Module `firstMount` skips the hard load (Preloader owns it). Retires the previous run manually (useGSAP `deferCleanup` with deps). `setCovered` pre-paint, page `autoAlpha 0→1`, `liftTimeline`, `playFlip` at 0.02 s. Hash navs: `lenis.scrollTo(target, {immediate})` now, on `document.fonts.ready`, at 1.4 s, and on complete (~1300 px font drift measured in prod). `ScrollTrigger.refresh(true)` on complete (a bare refresh() reflows mid-glide). `data-page-root` on the content div.
  - `src/lib/sheet.ts` (245 l): artwork + timelines (`SHEET_CLASS "absolute inset-0 bg-paper"`, `RULE_CLASS` 1px ink rule, `SHEET_HOST_CLASS` fixed z `--z-cover`), `clearSheet`, `setCovered`, `coverTimeline`, `retractTimeline`, `liftTimeline`, reduced-motion = 150 ms opacity swap. Flip hand-off: `stashFlip`/`playFlip`/`dropFlip`, `data-flip-id="work-title-<slug>"` (set in SubForm h1 and next-link, WorkTable rows), 3 s TTL, try/catch everywhere. **GSAP percent trap documented here (l.53-66):** SSR inline `translate3d(0,-100%,0)` is read by GSAP as `y: -<viewport>px`, so every `yPercent` stacks on top → always pass `y: 0` with `yPercent` (the `Y0` constant). The re-skin rewrites the artwork (e.g. a white panel / mask wipe) but keeps the export surface and these rules.
- `src/components/Preloader.tsx` (183 l): SSR'd `#preloader.preloader` (aria-hidden, `suppressHydrationWarning`) + inline `SKIP_SCRIPT` placed AFTER the div: hides it pre-paint when `sessionStorage["at-preloader-seen"]` or `?nopre`. `unlock` (setLoaded(true) + write the key) fires at the START of the lift; `finish` sets display none. Exit waits `Promise.all([race(fonts.ready, 1.1 s), 620 ms min])`. Reduced motion: fade 0.3 s. CSS failsafe in `globals.css` l.406-421: `animation: preloader-failsafe 0.4s … 3s forwards` (translateY(-100%) + hidden). The artwork (strip + safety band skeleton with `data-print` rules, `bg-safety`) is job-order and gets replaced by the film; keep the skip/robustness logic and the `at-preloader-seen` key (visual-gate + probes set it via addInitScript).
- SEO:
  - `src/app/layout.tsx` (155 l): `Archivo` via next/font (variable, `wdth` axis, `--font-archivo`) → replace font; `metadata` (metadataBase SITE, title default/template, description, keywords, openGraph without url/title at root on purpose, twitter, robots); Person JSON-LD (CV facts only); `viewport.themeColor "#f5f4ef"` (paper) → change to the new white; mounts `Preloader`, `Smooth`, `CoverOverlay`, `HeaderStrip`, `PhaseBand layoutMount` (last two are job-order chrome).
  - `src/lib/site.ts` (78 l): `SITE` resolution (NEXT_PUBLIC_SITE_URL → VERCEL_PROJECT_PRODUCTION_URL → VERCEL_URL → localhost, warn not throw), `siteName`, `defaultLocale`, `siteMeta` en/it (title, description, ogLocale), `titleTemplate`. Keep.
  - Per-route metadata with own canonical + og:url: `src/app/page.tsx`, `src/app/work/page.tsx`, `src/app/about/page.tsx`, `src/app/work/[slug]/page.tsx` (`generateStaticParams` over `works`). Keep the metadata exports.
  - `src/app/sitemap.ts` (12 URLs, styleguide excluded), `src/app/robots.ts` (disallow `/styleguide`). Keep; adjust if styleguide dies.
  - `src/app/opengraph-image.tsx` (189 l), `src/app/work/[slug]/opengraph-image.tsx` (204 l, first Measured pair), `src/app/icon.tsx` (52 l): logic keep, ARTWORK is job-order (strip, safety band, stamps, yellow favicon) → redraw. `src/app/fonts/og-fonts.ts` loads static Archivo TTFs (`archivo-400`, `archivo-cond-700`, `archivo-wide-800`) and exports `OG_COLOR` (sheet hex) / `OG_FAMILY`; Satori can't read variable fonts or woff2 → new face needs static TTF instances.
- Other lib: `src/lib/use-hydrated.ts` (`useHydratedLocale`, used by LocaleToggle + Styleguide), `src/lib/cn.ts`, `src/lib/contrast.ts` (AA ratio at runtime, styleguide only). `src/components/ui/button.tsx` is imported by nobody.
- `package.json`: npm; scripts `dev`, `build`, `start`, `typecheck`. Unused deps still listed: three, @react-three/*, postprocessing, simple-icons. `leva` (dev) is used by WaterBallHero, dev-only branch.

## (c) WebGPU fluid engine `src/webgl/**`

**FROZEN (G4, read-only):** `src/webgl/waterball/mls-mpm/**` (clearGrid, copyPosition, g2p — holds the letter-A confinement, mls-mpm.ts, p2g_1, p2g_2, spawnParticles, updateGrid) and `src/webgl/waterball/common.ts` (288-byte `renderUniformsValues` layout, `numParticlesMax = 200000`). Also `SPLASH_DEFAULTS`/`CAM_DEFAULTS` in WaterBallHero are commented "G4: FROZEN". Phase B (box SDF instead of the A in g2p) needs Alberto's explicit unlock.

Look / colour constants that a light-background re-light would touch (render-side, allowed):
- `src/webgl/waterball/render/fluid.wgsl.ts` (274 l): `SUN_DIR_WORLD`, `SUN_COLOR` (0.94,0.96,1.0), `FOAM_COLOR` (0.95,0.90,0.80), oil depth ramp `OIL_FILM` (0.93,0.74,0.42) / `OIL_MID` (0.79,0.54,0.16 = token `oil` #c98a2a) / `OIL_DEEP` (0.42,0.215,0.055), `EDGE_TINT` (0.70,0.45,0.18), `override thickness_gain`, `density = 0.55`, IORs 1.327/1.333/1.340, `F0 = 0.035`, ripple amp 0.011, foam gate smoothstep(0.38,0.86)·0.45, wet coat 0.52, glint pow 260·0.6, sheen pow 12·0.09, `THICK_FADE = 1.4`. No-fluid pixels return transparent (the DOM backdrop shows through). Legacy sea-reflection branch inactive (`refl_strength = 0`).
- `src/webgl/waterball/render/fluidRender.ts` (519 l): pipeline build; `thickness_gain` specialized at pipeline creation (l.197-199); fluid pass `clearValue {0,0,0,0}` transparent (l.439); debug sphere pass clears to (0.7,0.7,0.75,1) (l.450). Other render shaders: bilateral, depthMap, fullScreen, gaussian, sphere, thicknessMap (`*.wgsl.ts`).
- `src/webgl/waterball/WaterBallHero.tsx` (623 l): `PARTICLES_DESKTOP 120000`, `PARTICLES_MOBILE 60000`, `DPR_CAP {desktop 1.5, mobile 1.0}`, `benchTier()`, `particleCountForTier`, `thicknessGainForTier` (= budget ratio), `INIT_BOX [80,60,18]`, `FOV 45°`, `FRAME_MARGIN 1.2`, `AUTO_ROTATE false`, `FRAME_WINDOW_MS 500`, `SETTLE_MS 4200` (rendered time before "live"), canvas `alphaMode: "premultiplied"`, IntersectionObserver gating the rAF (l.548), `dev.lost.then` → "lost", cubemap loaded from `/cubemap/{posx,negx,posy,negy,posz,negz}.png` (l.509-530), orbit/zoom disabled, camera sway.
- `scripts/gen_workshop_cubemap.py`: seamless 6×512 PNG faces, strictly neutral grey workshop (FLOOR #3c3c3a, WALL_LOW #55554f → WALL_HIGH #90908a, SEAM, CEILING #b4b4ae, TUBE #f4f6fa, TUBE_HALO #d2d4d8, BANK #e8eaee on +Z) → `public/cubemap/*.png` (+ contact sheet in `.shots/wp3b/`). A white rivista environment = regenerate with lighter values. Raster provenance is embedded (tEXt chunk) — keep that when regenerating.
- `src/content/tokens.ts`: `oilLinear [0.79,0.54,0.16]` (JS mirror of OIL_MID).
- Captured still: `public/bench/tank-still-{700,1520}.webp` + `PROVENANCE.md`; regenerate with `scripts/capture-bench.mjs` after a re-light (crops `.bench-box` minus 1px border → selector coupling).

Gating:
- `src/webgl/CanvasHost.tsx` (64 l): `BENCH_ROUTES = new Set(["/"])` → returns null elsewhere (unmount disposes device + `resetBench`). Gate resolved after mount: no `navigator.gpu` → `still/nogpu`; reduced motion → `still/reduced` (both set `tier: benchTier()`, zeros elsewhere); else `<WaterBallHero/>`. Listens to the reduced-motion media query.
- `src/webgl/store/heroStore.ts` (85 l): `BenchStatus = "compiling" | "warming" | "live" | "still" | "lost"`; `reason: "nogpu" | "reduced" | "lost" | null`; readouts `frameMs` (500 ms avg), `particles` (sim.numParticles), `dpr` (applied), `tier`; legacy `explode/reveal/video` unused; `resetBench()`; dev-only `window.__heroStore` (capture-bench + probes read it). Only `status` is read reactively (TestBench); numbers are read on the gsap.ticker by BenchReadouts.
- Consumers to rewrite: `src/components/bench/TestBench.tsx` (still + cross-fade + LIVE stamp; `aspect-ratio: var(--bench-ratio)`) and `BenchReadouts.tsx` (yellow column, clip-path wipe via custom properties on the shared ticker). Engine honesty rule (no simulated numbers, still labelled) should carry over.

## (d) Job-order VISUAL layer: delete or rewrite

- `src/components/sheet/*`: `HeaderStrip.tsx` (strip + route-aware skip link: `#phase-work` on "/", `#main` elsewhere — keep the skip-link logic), `PhaseBand.tsx` (sticky yellow nav, `layoutMount` self-hides on "/", Email cell) + `usePhaseStamps.ts`, `Stamp.tsx`, `Field.tsx`, `RuleIn.tsx`, `Perforation.tsx`, `LocaleToggle.tsx` (EN/IT toggle with sr-only `a11y.langToggle`, hydration-safe — keep the behaviour, re-skin). `src/lib/phases.ts` (PHASES, anchors, `BAND_OFFSET -56`, `STAMP_START "top 60%"`, `routePhase`) goes with the band.
- `src/components/bench/*` (TestBench, BenchReadouts): rewrite as the rivista "live" media block.
- `src/components/sections/*`: JobOrderHeader, Intake, Diagnosis, Estimate, Measured + MeasuredRow, Release, useRowStagger.
- `src/components/work/*`: WorkTable (home summary + `/work` table; Flip ids), Loupe (Aceternity-lens mask), SubForm (396 l, the case study; Flip h1), Schematic (ruled SVG rag/job-order), WorkIndex.
- `src/components/about/{AboutJourney,JourneyTimeline}.tsx`, `src/components/footer/Footer.tsx`, `src/app/not-found.tsx` ("VOID" stamp), `src/app/styleguide/{page,StyleguideSheet}.tsx` (357 l).
- `src/app/page.tsx` composition (JobOrderHeader → PhaseBand → `#phase-intake` cover → … → Footer; `main#main tabIndex=-1`).
- `src/app/globals.css` (422 l): `@theme` with `--color-*: initial` and the 11 sheet colours (paper, paper-field, paper-carbon, ink, graphite, graphite-deep, stamp, stamp-deep, safety, oil, rule-soft); `@theme inline` font `--font-archivo`; `:root` gutter/col/row/cell-h/band-h/field-pad/section-gap/measure/bench-w/h/ratio, z scale (`--z-sheet 0, bench 1, band 20, loupe 30, cover 40, preloader 50, skip 60`), `--ease-rule/stamp/sheet/hover`, `--dur-*`; reduced-motion zeroing on `:root[data-motion="reduced"]` + media query; `@layer base` (selection ink/paper, focus ring safety+ink, yellow-region inversion, skip-target no-ring, ruler scrollbars); `@layer components` `.f-name .f-headline .f-lead .f-role .f-body .f-cell .f-caption .f-meta .f-stamp .f-strip`, `.sheet .field .fields .field-caption .rule-top .rule-bottom .rule-soft .perforation .band-h .cell-h .bench-box .stamp .stamp--filled .link .row-hover`; `.preloader` shell + failsafe keyframes (keep the failsafe).
- `src/content/tokens.ts` (sheet palette mirror + `oilLinear`), `src/lib/motion.ts` (`DUR` hover .12/swap .15/text .18/stamp .22/rule .32/sheet .42/print .5, `EASE` rule/stamp/sheet, `STAGGER.rows .04`): rewrite together with globals.css and gsap.ts CustomEases.
- Docs describing the job order (not code, will go stale): `DESIGN.md`, `.impeccable/design.json`, `REDESIGN-SPEC.md`, `CLAUDE.md`, `HANDOFF.md`, `PLAN.md`.

## (e) Gates and scripts: keep

- `scripts/visual-gate.mjs` (158 l): `node scripts/visual-gate.mjs <tag> [routes] [--reduce] [--nogpu] [--base=]`; Chrome channel + `--enable-unsafe-webgpu`; 1440×900 DPR1 + 390×844 DPR2; skips preloader via `at-preloader-seen` init script; steps a viewport at a time through `window.__lenis.scrollTo(y, {immediate, force})`; `.shots/<tag>/…`; exit 1 on console errors. World-neutral.
- `scripts/check-claims.mjs` (112 l): numbers in dict/works/findings/career must be in PRODUCT.md §3/§9; prune the job-order whitelist; add any new content file to `CONTENT_FILES`.
- `scripts/probes/a11y-gate.mjs` (139 l): axe 4.10.2 from cdnjs, wcag2a..22aa + best-practice, 7 routes (includes `/styleguide`, `/work/sersan-io`, `/work/sphere-ai`, 404) × 2 viewports; exit 1 on serious/critical. Update `ROUTES` if styleguide is dropped.
- `scripts/probes/wp10-evidence.mjs` (282 l): EN/IT parity, keyboard (checks focus ring on the yellow band — job-order coupled), 16384 guard, bench stills via `.bench-box` selector — needs selector updates.
- `scripts/probes/_recapture.mjs` (94 l): tiled captures under `CEILING = 16384`; waits past the bench settle on "/".
- `scripts/capture-sites.mjs` (182 l): real captures of sersan.io + spherenode.com, cookie banners declined, EXIF provenance, → `public/captures`.
- `scripts/capture-bench.mjs` (216 l): waits for `__heroStore` status "live", crops `.bench-box` minus border → `public/bench/*.webp` + PROVENANCE.md (selector coupling).
- `scripts/probes/_*.mjs` (~70 files): historical one-off probes, many from dead worlds (tide, nightfall, wordmark, menu, curtain, runway); not gates.

## (f) Risks and traps

1. **Windows build casing:** `npm run build` only from `C:\Users\alber\Portfolio` (capital P/U), else "Expected workStore to be initialized" (dual AsyncLocalStorage load). Vercel/Linux unaffected. (CLAUDE.md §10, memory windows-build-casing.)
2. **Backticks in WGSL:** every `*.wgsl.ts` exports `` export default `…` `` (each file has exactly 2 backticks). A backtick or `${` inside a WGSL comment closes the template and breaks `tsc`; it bit twice (memory ssf-water-state, redesign-2026-09). WGSL validity is only checked at runtime in the browser.
3. **aspect-ratio must be unitless:** `globals.css` l.359-361 and `TestBench.tsx` l.99-100: `760px / 540px` is invalid and silently dropped; use `760 / 540`.
4. **GSAP reads SSR percent transforms as px:** inline `translate3d(0,-100%,0)` → GSAP parses `y: -<vh>px`, then `yPercent` stacks → cover sits a viewport too high. Always set `y: 0` alongside `yPercent` (`src/lib/sheet.ts` `Y0`). Applies to any rivista mask/panel that SSRs a percent transform.
5. **RouteTransition must key on `usePathname()`,** not on mount: the root template remounts only on top-level segment change, so `/work` → `/work/<slug>` got no enter. With deps, useGSAP defers cleanup → retire the previous run manually.
6. **CoverOverlay must live in layout.tsx,** not template.tsx (a template remount kills it mid-cover); hand-off is a passive effect after the enter's layout-effect snap; keep the 2.5 s bail, the latch, `inert` on `[data-page-root]`, hash re-snaps (fonts.ready + 1.4 s), `ScrollTrigger.refresh(true)`.
7. **16,384 px screenshot ceiling:** full-page shots taller than that in device px come back stitched wrong (home at 390 DPR2 ≈ 25,000 px) → tile with `_recapture.mjs`. A rivista with huge vw/vh titles and a pinned horizontal rail will be even taller.
8. **No invented numbers:** PRODUCT.md §3/§9 is the claims source; `check-claims.mjs` gates dict/works/findings/career. Holes print as fields ("URL: pending", "no photograph on file"), Voice AI Agent Measured = "—".
9. **`ocean-ui` localStorage key** stays; **`at-preloader-seen` sessionStorage key** is read by the gate scripts.
10. **One heavy renderer only** (CanvasHost on "/"); IO-gated rAF; dispose on route change; Lighthouse mobile ≥ 80 on `/`, ≥ 90 sub-routes. A scroll-driven horizontal rail must be DOM/CSS + ScrollTrigger on the shared Lenis ticker.
11. **Solver frozen (G4):** re-light only in `render/**`, `WaterBallHero.tsx` look params (not SPLASH/CAM defaults), cubemap script. Premultiplied alpha: colour must never exceed alpha (fluid.wgsl clamps) — on a white page, a light oil body with low alpha rims may wash out; `THICK_FADE`, `EDGE_TINT`, density are the levers.
12. **Text never crosses partial opacity on colour** (current rule: swaps are clip-path wipes). On a white ground a fade-up of dark text is fine contrast-wise, but the AA gate still runs mid-animation-free states only.
13. **Server components can't import dict.ts** ("use client"): metadata/OG read `src/lib/site.ts`; keep the two in sync by hand.
14. **Satori OG fonts** must be static TTF (no variable, no woff2); `og-fonts.ts` degrades to the built-in face if files are missing.
15. `leva` import in WaterBallHero relies on the `IS_DEV` literal for tree-shaking; don't restructure that branch.
16. Stale caches: a corrupted `.next` can serve old CSS after a big globals.css swap → `rm -rf .next` (memory codrops-lane).
