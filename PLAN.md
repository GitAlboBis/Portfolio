# PLAN — Next steps (prioritized)

> Backlog for the Golden Hour portfolio. See **`HANDOFF.md`** for current state + file map, **`CLAUDE.md`** for the operational brain (rules, reference links + code-extraction, skill routing, gates), **`WATER-WAVE-PLAN.md`** for the water sim.
> Updated **2026-06-30** (end of the big build+effects session).

## ✅ Done (this session — see HANDOFF for the commit list)
- **CLAUDE.md** rewritten to Golden Hour (+ §6 reference links/extraction, skill routing). Skills installed under `.claude/skills/`.
- **Multi-page**: `/about` (bio/education/experience, real confirmed content) + `/work/[slug]` case studies (3 confirmed projects) + **route transition** (sunset curtain via `template.tsx`).
- **Selected Work**: real project data in `works.ts`; **3D arc carousel** (`WorkCarousel`) → click a card opens its `/work/[slug]`.
- **Fluid-island nav** (floating glass pill, scroll hide/reveal + reveal-on-pointer-top + active indicator).
- **Motion system**: parallax backbone, Reveal/ScrollText/WordGenerate/FlipText/ShimmerText, Appear, Marquee (velocity), border-beam CTA, magnetic CTA/wordmark, hero scroll-settle, Preloader.
- **SEO**: metadata, OG/Twitter cards, favicon (`icon.tsx`), `opengraph-image.tsx`, sitemap, robots, Person JSON-LD.
- **Email** → public `albertotuveri@gmail.com`. Custom cursor removed (native cursor restored).

## ▶ Immediate next (recommended order)
1. **Re-verify `155115d` visually** (account switch left it build-green but not browser-checked): native cursor visible · nav reappears when reaching to the top after scrolling down · clicking a Works card opens `/work/[slug]`.
2. **Get real SerSan ×2 content** from Alberto (titles, Problem→Action→Result, stack) → fill `works.ts` (currently `provisional` WIP) + flip status to `confirmed` so they get `/work` pages. *(Blocking those two cards. 🔵)*
3. **Perf & A11y pass** (WP-10, no input): Lighthouse mobile ≥80 (skill `frontend-lighthouse`), axe (skill `accessibility-compliance-accessibility-audit`/`fixing-accessibility`), reduced-motion end-to-end, lazy-mount heavy scenes, ensure `leva` is out of the prod bundle, true-mobile 390px QA.
4. **Cleanup**: delete the now-unused `src/components/works/WorksGallery.tsx` (replaced by the carousel) + the dead `src/components/Cursor.tsx` & `.cursor-*`/`html.has-custom-cursor` CSS in `globals.css`. Reconcile the package manager (npm vs the stray `bun.lock`).

## 🎛 Ready-to-build effect presets (already researched — mechanism + reimplementation extracted, NO new deps)
These came from Workflow research against the CLAUDE.md §6 references; re-implement on our GSAP/Lenis/three stack. Full notes were in the session's workflow outputs — re-run the research workflow if you need them again.
- **Premium menu overlay** (Codrops): rebuild `MenuOverlay.tsx` with ONE reversible timeline + **SplitText `mask:"lines"`** line reveal + a CSS **hamburger→X morph** toggle (replace the text "Menu"/"Close").
- **Sticky scroll-stacking sections** (Codrops): wrap home sections so they pin (CSS `sticky`, NOT ScrollTrigger pin) + recede (scale/blur) as the next slides over — *restructures the home scroll rhythm, confirm feel first*.
- **Tide-rail nav extras**: a side dot-rail (buoys) + scroll-progress hairline + GSAP-Flip sliding active indicator.
- **Sunset curtain — full version**: add the EXIT cover (intercept internal links → cover → `router.push`) so the curtain covers *before* leaving, not just reveals on enter (medium risk — touches every internal Link).
- (Rejected/parked: SVG-mask blinds transition; View Transitions API — experimental, fights the WebGPU canvas.)

## 🔵 Needs Alberto / gates
- **SerSan project content** (above).
- **`NEXT_PUBLIC_SITE_URL`** env on deploy (absolute OG/canonical/sitemap).
- **G4** — hero fluid (`src/webgl/waterball/**`) params/feel: don't retune without explicit ok.
- **G3** — merge to `main` / production deploy: Alberto's ok.
- **G5** — paid asset generation (Higgsfield/Blender clip + portrait).
- **Feel review** of the accumulated motion/transitions/nav/carousel — taste sign-off.

## P1/P2 (from the original plan, still open)
- Gallery depth-of-field (only if returning to an R3F gallery) · real project stills (WebP) via `Work.textureSrc` (carousel/cards currently render duotone gradients) · ambient WebGL layer (caustics, under content) · wave physics in `WATER-WAVE-PLAN.md` (only with the "A" as a soft reflecting container) · then **deploy to Vercel** (G3).

## Housekeeping
- Rewrite or archive the dated `docs/*` and `DESIGN-SYSTEM.md` (still "Ocean") for Golden Hour, or delete to avoid confusion (CLAUDE.md already supersedes them).
