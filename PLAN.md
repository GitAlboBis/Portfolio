# PLAN — Next steps (prioritized)

> Backlog for the Golden Hour portfolio. See **`HANDOFF.md`** for current state + file map, **`CLAUDE.md`** for the operational brain (rules, reference links + code-extraction, skill routing, gates), **`WATER-WAVE-PLAN.md`** for the water sim.
> Updated **2026-07-16 (bis)**. Latest shipped (HANDOFF §2026-07-16 bis): **② CASE STUDY VIVI FATTO** (IL SERVIZIO FOTOGRAFICO, `f648546`) + **④ WORKS GALLERY DoF FATTO** (RACK FOCUS, P1 chiuso) + **⑤ ECOSISTEMA FATTO** (LA MAREA TOCCA IL NOME, `1b8100d` — wordmark ripple su tide-touch + ScrollProgress underwater/flare). Review avversariali: 21+10 agenti, 5+2 finding fixati. Osservazione preload fantasma CHIUSA (RSC prefetch by-design). **Prossimo round: ③ beat drone — BLOCCATO su questo PC (URL Drive/LUT/master sull'altro PC — serve il link da Alberto); kling loop case study (G5).**
> (Storico) 2026-07-16: ① MENU-PORTALE (d9a5cf5) + warm-up progressivo + bump deps + 18 skill. **WP-10 mobile VERDE: Lighthouse mobile prod = 84** (2026-07-15).
> (Storico) 2026-07-12: motion package merged @ `5c9d12c` — hero ink, RollLink/.link, footer wordmark, next-project loop, runway spotlight+odometer.

## ✅ Done 2026-07-12 (motion package — dettagli in HANDOFF)
- Hero copy over the water "A" (h1 reale, AA pixel-misurato, no-WebGPU fallback rescued) · RollLink char-roll + .link underline-draw (partition table in RollLink.tsx) · footer FlipText wordmark + © dinamico · next-project handoff band sui case study · /work spotlight + odometer + will-change cleanup.
- **Continuous Curtain SHIPPED (2026-07-12, `f4eb0dc`+`f5c7827`)**: exit-cover via TransitionLink + CoverOverlay (handoff/bail/inert), hash-nav multi-snap, 11-scenario QA matrix. Sbloccato il prossimo candidato: shared-title handoff /work→case study (prototipa, gate spietato).

## ✅ Done (this session — see HANDOFF for the commit list)
- **CLAUDE.md** rewritten to Golden Hour (+ §6 reference links/extraction, skill routing). Skills installed under `.claude/skills/`.
- **Multi-page**: `/about` (bio/education/experience, real confirmed content) + `/work/[slug]` case studies (3 confirmed projects) + **route transition** (sunset curtain via `template.tsx`).
- **Selected Work** (two surfaces, both → `/work/[slug]`): home keeps the **depth fly-through gallery** (`WorksGallery`, `#works`, caption "Open case →" / "All work ↗"); **`/work`** is the dedicated index — a **3D arc carousel** (`WorkCarousel` via `WorkIndex`) where clicking a card opens its case study. Real project data in `works.ts`.
- **Fluid-island nav** (floating glass pill, scroll hide/reveal + reveal-on-pointer-top + active indicator).
- **Motion system**: parallax backbone, Reveal/ScrollText/WordGenerate/FlipText/ShimmerText, Appear, Marquee (velocity), border-beam CTA, magnetic CTA/wordmark, hero scroll-settle, Preloader.
- **SEO**: metadata, OG/Twitter cards, favicon (`icon.tsx`), `opengraph-image.tsx`, sitemap, robots, Person JSON-LD.
- **Email** → public `albertotuveri@gmail.com`. Custom cursor removed (native cursor restored).

## ▶ Immediate next (recommended order)
1. **Re-verify `155115d` visually** (cursor + nav): native cursor visible · nav reappears when reaching to the top after scrolling down. *(Done this session: home depth gallery + `/work` carousel render + console clean + card→`/work/[slug]` click — `82feb3a`.)*
2. **Get real SerSan ×2 content** from Alberto (titles, Problem→Action→Result, stack) → fill `works.ts` (currently `provisional` WIP) + flip status to `confirmed` so they get `/work` pages. *(Blocking those two cards. 🔵)*
3. **Perf & A11y pass** (WP-10, no input): Lighthouse mobile ≥80 (skill `frontend-lighthouse`), axe (skill `accessibility-compliance-accessibility-audit`/`fixing-accessibility`), reduced-motion end-to-end, lazy-mount heavy scenes, ensure `leva` is out of the prod bundle, true-mobile 390px QA.
4. **Cleanup**: delete the dead `src/components/Cursor.tsx` & `.cursor-*`/`html.has-custom-cursor` CSS in `globals.css`. Reconcile the package manager (npm vs the stray `bun.lock`). *(Note: `WorksGallery.tsx` is **kept** — it's the home gallery; do NOT delete it.)*

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
- ~~**Gallery depth-of-field**~~ ✅ FATTO 2026-07-16 bis (RACK FOCUS, `f648546`) · ~~real project stills via `Work.textureSrc`~~ ✅ (still Higgsfield montate su entrambe le superfici, 26bc7de) · ambient WebGL layer (caustics, under content) · wave physics in `WATER-WAVE-PLAN.md` (only with the "A" as a soft reflecting container).

## Housekeeping
- Rewrite or archive the dated `docs/*` and `DESIGN-SYSTEM.md` (still "Ocean") for Golden Hour, or delete to avoid confusion (CLAUDE.md already supersedes them).
