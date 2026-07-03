# HANDOFF — Alberto Tuveri Portfolio (Golden Hour)

> Last updated: **2026-07-03** (Codrops lane: ShallowWater + TideSurge + Nightfall in-flight). This is the "continue here" doc.

---

## ⏯ CONTINUA DA QUI — sessione 2026-07-03 (lane Codrops, mandato AUTO-MERGE)

**Mandato attivo di Alberto:** ogni feature della lane Codrops si mergia su `main` **in automatico** (push = deploy Vercel). Restano gated solo G4 (solver fluido), G5 (asset a pagamento) e i contenuti.

### Già su `main` (deployato)
| Cosa | Merge | Note |
|---|---|---|
| **ShallowWater** — velo di caustiche golden-hour (port procedurale del pen MIT `ksenia-k/RwXVMMY`; sorgente mirror: repo GitHub `tysev44/kentrosneep`) | `829611c` | Su /about + /work + /work/[slug]; **intensificato** su richiesta (shading ≤.55, campo più denso, waterline più bassa) nei cap AA. Hardening da review: repaint-on-resize, fase grana wrappata, luce verso paper. Back-port (repaint + grana) a NightSky. |
| **TideSurge** — h2 del Contact risale come marea, scrubbato (Codrops OnScrollTypography FX2) | `bcfd557` | Sostituisce FlipText (file tenuto, ora inutilizzato). Finestre **clamp()** (bug viewport alti riprodotto e fixato), no will-change, no autoSplit inerte (tolto anche da DualWaveText). |
| **fix hydration reduced-motion** | `2cc0858` | `src/lib/use-hydrated.ts` gate i branch a render-time (WorksGallery, WorkHorizontal); DrawLine seeda il dash nell'effect. /, /about, /work reduced = 0 errori console. |
| docs CODEDROPSPLAN aggiornati | `6bd040d` | |

### ⚠ IN CORSO — branch `feat/nightfall` (NON mergiato, working tree con edit non committati)
**Cos'è:** #5 della lane — sticky-stack del passaggio giorno→notte sulla home. `<Nightfall><Tech/></Nightfall>` (`src/components/home/Nightfall.tsx` NUOVO): la card Tech si pinna col fondo al fold (`--nf-top = innerHeight − cardH` da ResizeObserver, sticky + **spacer 100vh reale** — lo sticky è confinato al CONTENT box del parent, il padding NON dà corsa), la banda night (`#nightfall`, classi `nightfall-cover z-20 flex min-h-screen flex-col` in `page.tsx`, `margin-top:-100vh`) le sale sopra; scrub GSAP (trigger `#nightfall`, top bottom→top top) fa arretrare la card (scale→.955) + velo crepuscolare (opacity→.45). Contact ha `flex-1` (footer ancorato al fondo del band min-h-screen). CSS in `globals.css` `.nightfall-*` con flattening reduced-motion **in CSS puro** (no branch a render-time). **Gate `_nightfall.mjs`: ALL PASS** (desktop/tall/mobile/reduced) · typecheck+build verdi.

**Review avversariale completata: 4 finding confermati (2 riprodotti con Playwright dai verifier). Stato fix:**
1. ✅ **APPLICATO** — `tech-cloud.tsx` (gate ~riga 277): il loop ora dorme anche se un antenato ha `[data-scene-covered]` (era il **major**: il cloud renderizzava per sempre dietro la banda notte opaca — doppia GPU a fondo pagina).
2. ✅ **APPLICATO** — `Nightfall.tsx` importa `ScrollTrigger` da `@/lib/gsap` (serve per il fix 5).
3. ⏳ **DA FARE (senza questo il fix 1 è INERTE!)** — in `Nightfall.tsx`, nello scrollTrigger dello scrub aggiungere `onUpdate: (self) => card.toggleAttribute("data-scene-covered", self.progress > 0.995)` (e toglierlo nel cleanup) così la card marca la copertura totale.
4. ⏳ **DA FARE** — pin solo post-hydration: in `globals.css` togliere `position/top` dalla base `.nightfall-card` e metterli su `.nightfall-card[data-nf-ready]`; in `Nightfall.tsx` `dock()` setta `card.dataset.nfReady = ""`. (Finding: il fallback `top: 0px` pre-hydration/no-JS inverte il dock — la coda di Tech passa sotto la notte senza mai essere leggibile.)
5. ⏳ **DA FARE** — AA nel mid-handoff parcheggiabile: velo → **gradiente** `linear-gradient(to top, <color-mix night/dusk>, transparent 62%)` (il buio precede il bordo della notte, la zona alta col testo resta pulita) + alza il max opacity 0.45→0.55 in `Nightfall.tsx`. (Finding: eyebrow ember-ink sotto 4.5:1 da progress ≈27% con velo piatto.)
6. ⏳ **DA FARE** — desync EN↔IT: `ScrollTrigger.refresh()` debounced (~200ms) quando cambia la geometria — dentro `dock()` al cambio reale di altezza card + un ResizeObserver su `document.body` (il shift può venire da About sopra la runway; riprodotto: +27px su mobile IT).
7. ⏳ Poi: aggiorna `_nightfall.mjs` (assert `data-scene-covered` presente a fondo pagina; il check veil-opacity con i nuovi valori) → `node _nightfall.mjs` ALL PASS → `npm run typecheck` + `npm run build` → commit su `feat/nightfall` → **merge --no-ff su main + push** (mandato) → tick su `CODEDROPSPLAN.md` (#5) → aggiorna memoria (`codrops-lane.md`).

### Note operative della sessione
- **Mistero "velo meno definito" RISOLTO:** era la **cache Turbopack corrotta** (`.next`) dopo un crash "Jest worker" del dev server — serviva CSS/chunk stantii. Fix: kill del processo node su :3000 → `Remove-Item -Recurse -Force .next` → `npm run dev`. Il codice del velo non era cambiato.
- Gate Playwright (root, untracked): `_water.mjs` (velo multi-route) · `_surge.mjs` (TideSurge, incl. viewport alti + settle per-char) · `_nightfall.mjs` (stack) · `_pinprobe.mjs`/`_cssprobe.mjs` (probe usa-e-getta).
- Dopo il merge di Nightfall la lane ha esaurito gli item sbloccati: #4 (Flip grid) vuole contenuto a griglia, gli image-driven aspettano le still (`Work.textureSrc`). Vedi `CODEDROPSPLAN.md`.

---
> Operational brain: **`CLAUDE.md`** (rewritten Golden Hour — golden rules, file map, reference links + code-extraction, skill/MCP routing, gates). Backlog: **`PLAN.md`**. Water sim/render: **`WATER-WAVE-PLAN.md`**.
> ⚠ Source of truth = the **code** + this doc. `DESIGN-SYSTEM.md` on disk is still "Ocean v1" (stale); `docs/*` describe the abandoned dark-ocean direction. The Golden Hour design system is **Claude Design** (`d5833b7a-0744-4bb8-bec0-367ce50698e8`) mirrored in `globals.css` @theme + `src/content/tokens.ts` + `/styleguide`.

## What this is
Single-page + a few routes, scroll-driven portfolio. **Golden Hour**: light warm-white page lit by a sunset (ember `#ee5b23` primary · amber · coral · rose · dusk + one dark `night` band). Type **Bricolage Grotesque** (display) + **DM Sans**. Hero = raw-WebGPU water "A" reflecting a sunset. Bilingual EN/IT. Awwwards SOTD target.

## Run it
```bash
npm run dev          # http://localhost:3000  (npm only — no bun in this env; bun.lock present but unused)
npm run typecheck    # tsc --noEmit
npm run build        # next build — the pre-commit gate (also prerenders /about, /work, /work/[slug], icon/og/sitemap/robots)
# /styleguide        # live design-system contract
```
A dev-only **leva** panel (top-right, home) tunes the hero fluid (`IS_DEV`-gated, absent in prod).

## Pages / routes
- **`/`** (`src/app/page.tsx`): Nav (fluid island) → `HeroScrollSettle` → `#hero` (fixed WebGPU "A" + sunset gradient) → `bg-paper`: **About** → **WorksGallery** (depth fly-through, `#works`) → **Tech** (marquee + icon cloud) → night band: **Contact** → **Footer**.
- **`/work`** (`app/work/page.tsx` → `components/work/WorkIndex.tsx`): the "all work" index — minimal header (wordmark→`/`, EN/IT toggle, back-to-home) + the **3D arc carousel** (`WorkCarousel`); each card opens its `/work/[slug]`. *(The home keeps the depth gallery; this is the dedicated explorer — both coexist, both link to case studies.)*
- **`/about`** (`app/about/page.tsx` → `components/about/AboutJourney.tsx`): long bio + **Education** + **Experience** timeline + thesis. Real confirmed content from `docs/07-PROJECTS.md`. Bilingual via `dict.journey`.
- **`/work/[slug]`** (`app/work/[slug]/page.tsx` → `components/work/WorkCaseStudy.tsx`): SSG case studies for the 3 confirmed projects (badante24h, doit-voice-ai-agent, agricultural-supply-chain). PARC content + metrics + stack, bilingual.
- **Route transition**: `app/template.tsx` → `components/transition/RouteTransition.tsx` — a **sunset-curtain** reveal on every client navigation (firstMount-gated for the Preloader, reduced-motion-safe).

## Key files
| Area | File(s) |
|---|---|
| Tokens (truth) | `src/app/globals.css` (`@theme`) + `src/content/tokens.ts` |
| Copy EN/IT | `src/content/dict.ts` (`useDict`, zod) — nav/hero/about/works(+labels)/tech(+marquee)/contact/journey/footer |
| Scroll backbone | `src/app/_providers/Smooth.tsx` (Lenis ← `gsap.ticker`, `window.__lenis`) |
| GSAP reg | `src/lib/gsap.ts` (ScrollTrigger + SplitText + useGSAP) · `src/lib/scroll-choreo.ts` (`useParallax`) |
| State | `src/store/ui.ts` (zustand: locale/sound/reducedMotion/activeWork/loaded/menuOpen; persist key `ocean-ui`) |
| Nav | `src/components/nav/Nav.tsx` (**fluid-island pill**, scroll hide/reveal + reveal-on-pointer-top + active indicator) + `MenuOverlay.tsx` |
| Hero (GATE G4) | `src/webgl/waterball/**` + `src/webgl/CanvasHost.tsx` (home-only) + `HeroScrollSettle.tsx` (writes `heroStore.explode`) + `webgl/store/heroStore.ts` |
| Works (home) | `src/components/works/WorksGallery.tsx` (R3F depth fly-through, mood ramp per project, caption with **Open case →** / **All work ↗** links, reduced-motion list fallback) |
| Works (index) | `src/components/work/WorkIndex.tsx` (`/work` page shell) + `src/components/works/WorkCarousel.tsx` (3D arc → click card opens `/work/[slug]`) + `src/content/works.ts` (real projects + case-study data) |
| Tech | `src/components/sections/Tech.tsx` + `tech-cloud.tsx` (icon cloud) + `data/skill-icons.ts` |
| Sections | `components/sections/About.tsx`, `Contact.tsx`, `footer/Footer.tsx` |
| Motion primitives | `components/motion/{Parallax,Magnetic,Appear,Marquee}.tsx` · `components/reveal/{Reveal,ScrollText,WordGenerate,FlipText,ShimmerText}.tsx` |
| Preloader | `src/components/Preloader.tsx` (SSR sheet, CSS failsafe) |
| SEO | `app/{icon,opengraph-image,sitemap,robots}.tsx/ts` + `layout.tsx` metadata + Person JSON-LD |
| Skills | `.claude/skills/**` — `webgpu-threejs-tsl` + a curated antigravity set (design/motion/3d/perf/a11y/seo) + `awwwards-loop`, `docs-driven-build`. CLAUDE.md §7 routes tasks→skills. |

## Done & verified (this session — 18 commits, newest first)
`82feb3a` feat(works): **restore depth gallery on home + add `/work` carousel index** (both coexist, both link to `/work/[slug]`) — verified in browser: home gallery + `/work` carousel render, console clean ·
`155115d` fix: visible cursor + nav reveal-on-approach + work cards open case study on click ·
`4d68e6a` feat(nav): fluid-island floating glass pill ·
`25bcd20` feat(transition): sunset-curtain route reveal ·
`94eff49` fix: public email → `albertotuveri@gmail.com` ·
`3fbacb6` route enter-transition ·
`e1725fc` feat(seo): metadata/OG/favicon/sitemap/robots/JSON-LD ·
`1fd8978` feat(work): 3D arc carousel ·
`39dedcb` feat(work): real project data + `/work/[slug]` case studies ·
`463dda0` feat(about): `/about` page ·
`f10e013` WordGenerate + 3D char-flip + velocity Marquee ·
`0284c96` revert: removed the side dive-line (disliked) ·
`4293bc8` border-beam CTA ·
`f57f55a` (dive-line, later reverted) ·
`3931197` more text effects + scroll entries (Footer/Contact/Works) ·
`45982c5` PLAN done-markers ·
`a048d36` Preloader ·
`180d565` ocean→Golden Hour comments ·
`6a6b803` (custom cursor — later removed in 155115d) ·
`d2add75` ScrollText (Tech) ·
`b3ae6c2` parallax backbone.
(Earlier: `1bcdcaa` CLAUDE.md rewrite, `56b86ff` skills install.)

Every commit: `npm run build` green + console clean. Motion system, multi-page, SEO, transitions, and the 3D works carousel all shipped, re-themed from the CLAUDE.md §6 reference libraries (Codrops/Magic UI/Aceternity/Skiper/GSAP) on our GSAP/Lenis/three stack.

## Known issues / gotchas
- **Verify the cursor/nav fix (`155115d`) visually** — the home depth gallery + `/work` carousel were re-checked this session (render + console clean), but `155115d`'s cursor removal + nav reveal-on-pointer-top still want a quick eyeball: native cursor visible; nav reappears when you move to the top after scrolling down. (Work-card→case-study click is now confirmed working on both `/` gallery and `/work` carousel.)
- **`WorksGallery` (home) and `WorkCarousel` (`/work`) BOTH ship by design** — the depth gallery was wrongly removed once; it's restored. Don't delete either; both feed `/work/[slug]`. R3F deps are needed by `WorksGallery` (home), so they stay.
- **Custom cursor removed**: `src/components/Cursor.tsx` + the `.cursor-*` / `html.has-custom-cursor` CSS in `globals.css` are now **dead code** (no longer mounted). Delete or rebuild a *visible* custom cursor if wanted — do NOT re-mount the old one (it hid the native cursor with nothing visible). `DiveLine.tsx` was deleted earlier.
- **SerSan ×2** projects are **provisional placeholders** (`works.ts`, status `provisional`, WIP badge, no `/work/[slug]` page; on `/work` the card shows "WIP" instead of opening). Need real titles/PARC/stack from Alberto.
- **`THREE.Clock` deprecation warning** in console = internal to R3F (not our code), benign.
- **`NEXT_PUBLIC_SITE_URL`** must be set on deploy so OG/canonical/sitemap are absolute (falls back to localhost).
- **Hero fluid = GATE G4**: don't retune `src/webgl/waterball/**` params without Alberto's ok. Deploy/merge `main` = **G3**. Paid asset gen (Higgsfield/Blender) = **G5**.
- `resize_window` (claude-in-chrome) didn't change the rendered viewport in-session → true-mobile 390px QA still pending.

See **`PLAN.md`** for the prioritized backlog + the ready-but-unbuilt effect presets.
