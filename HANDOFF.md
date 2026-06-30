# HANDOFF — Alberto Tuveri Portfolio (Golden Hour)

> Last updated: **2026-06-30** (end of the big build+effects session). This is the "continue here" doc.
> Operational brain: **`CLAUDE.md`** (rewritten Golden Hour — golden rules, file map, reference links + code-extraction, skill/MCP routing, gates). Backlog: **`PLAN.md`**. Water sim/render: **`WATER-WAVE-PLAN.md`**.
> ⚠ Source of truth = the **code** + this doc. `DESIGN-SYSTEM.md` on disk is still "Ocean v1" (stale); `docs/*` describe the abandoned dark-ocean direction. The Golden Hour design system is **Claude Design** (`d5833b7a-0744-4bb8-bec0-367ce50698e8`) mirrored in `globals.css` @theme + `src/content/tokens.ts` + `/styleguide`.

## What this is
Single-page + a few routes, scroll-driven portfolio. **Golden Hour**: light warm-white page lit by a sunset (ember `#ee5b23` primary · amber · coral · rose · dusk + one dark `night` band). Type **Bricolage Grotesque** (display) + **DM Sans**. Hero = raw-WebGPU water "A" reflecting a sunset. Bilingual EN/IT. Awwwards SOTD target.

## Run it
```bash
npm run dev          # http://localhost:3000  (npm only — no bun in this env; bun.lock present but unused)
npm run typecheck    # tsc --noEmit
npm run build        # next build — the pre-commit gate (also prerenders /about, /work/[slug], icon/og/sitemap/robots)
# /styleguide        # live design-system contract
```
A dev-only **leva** panel (top-right, home) tunes the hero fluid (`IS_DEV`-gated, absent in prod).

## Pages / routes
- **`/`** (`src/app/page.tsx`): Nav (fluid island) → `HeroScrollSettle` → `#hero` (fixed WebGPU "A" + sunset gradient) → `bg-paper`: **About** → **WorkCarousel** (3D arc, `#works`) → **Tech** (marquee + icon cloud) → night band: **Contact** → **Footer**.
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
| Works | `src/components/works/WorkCarousel.tsx` (3D arc → click card opens `/work/[slug]`) + `src/content/works.ts` (real projects + case-study data) |
| Tech | `src/components/sections/Tech.tsx` + `tech-cloud.tsx` (icon cloud) + `data/skill-icons.ts` |
| Sections | `components/sections/About.tsx`, `Contact.tsx`, `footer/Footer.tsx` |
| Motion primitives | `components/motion/{Parallax,Magnetic,Appear,Marquee}.tsx` · `components/reveal/{Reveal,ScrollText,WordGenerate,FlipText,ShimmerText}.tsx` |
| Preloader | `src/components/Preloader.tsx` (SSR sheet, CSS failsafe) |
| SEO | `app/{icon,opengraph-image,sitemap,robots}.tsx/ts` + `layout.tsx` metadata + Person JSON-LD |
| Skills | `.claude/skills/**` — `webgpu-threejs-tsl` + a curated antigravity set (design/motion/3d/perf/a11y/seo) + `awwwards-loop`, `docs-driven-build`. CLAUDE.md §7 routes tasks→skills. |

## Done & verified (this session — 17 commits, newest first)
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
- **Verify the last fix (`155115d`) visually in the new session** — cursor removal, nav reveal-on-pointer-top, and work-card→case-study click are **build-green but not browser-re-checked** (account switch). Quick eyeball of: native cursor visible; nav reappears when you move to the top after scrolling down; clicking a Works card opens its `/work/[slug]`.
- **Custom cursor removed**: `src/components/Cursor.tsx` + the `.cursor-*` / `html.has-custom-cursor` CSS in `globals.css` are now **dead code** (no longer mounted). Delete or rebuild a *visible* custom cursor if wanted — do NOT re-mount the old one (it hid the native cursor with nothing visible).
- **`WorksGallery.tsx`** (old R3F depth gallery) is **unused** (replaced by `WorkCarousel`). `DiveLine.tsx` was deleted. Kept R3F deps for the gallery are now only used by… nothing on the home — consider removing `WorksGallery.tsx` or repurposing.
- **SerSan ×2** projects are **provisional placeholders** (`works.ts`, status `provisional`, WIP badge, no `/work` page). Need real titles/PARC/stack from Alberto.
- **`THREE.Clock` deprecation warning** in console = internal to R3F (not our code), benign.
- **`NEXT_PUBLIC_SITE_URL`** must be set on deploy so OG/canonical/sitemap are absolute (falls back to localhost).
- **Hero fluid = GATE G4**: don't retune `src/webgl/waterball/**` params without Alberto's ok. Deploy/merge `main` = **G3**. Paid asset gen (Higgsfield/Blender) = **G5**.
- `resize_window` (claude-in-chrome) didn't change the rendered viewport in-session → true-mobile 390px QA still pending.

See **`PLAN.md`** for the prioritized backlog + the ready-but-unbuilt effect presets.
