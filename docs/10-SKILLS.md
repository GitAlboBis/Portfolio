# 10 - SKILLS: Routing delle Skill Claude Code per task

> Aggiornato 2026-06-27 per riflettere il codice (hero MLS-MPM WebGPU + cinematica frame-sequence). Riconciliato dal loop docs-driven-build.

> Scopo: mappare le skill Claude Code installate e RILEVANTI per il portfolio di Alberto Tuveri al task/fase giusti, cosi che ogni agente le invochi autonomamente al momento opportuno. Questo file e una direttiva di routing, non un tutorial: dice QUALE skill, QUANDO (trigger) e PER QUALE file della suite.

## Premessa operativa

Nell'ambiente sono installate migliaia di skill (vedi la lista `available-skills` iniettata a runtime). Questo documento elenca SOLO quelle pertinenti alla costruzione di un portfolio immersivo 3D/scroll-driven con lo stack canonico (vedi `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/01-TECHSTACK.md`). Le skill sono uno dei tre moltiplicatori a disposizione dell'agente, da combinare sempre:

1. SKILL (questo file): conoscenza di dominio + procedura, caricata via tool `Skill`.
2. MCP / connettori (vedi `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/09-MCP.md`): azioni esterne (Blender, Higgsfield, Vercel, claude-in-chrome).
3. Context7 (vedi `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/08-CONTEXT7.md`): documentazione version-specific delle librerie (three 0.184, R3F 9.6, Next 16, GSAP 3.15, Lenis 1.3).

Regola d'oro: una skill da' il "come si fa bene", Context7 da' "l'API esatta di QUESTA versione", l'MCP claude-in-chrome verifica "che funzioni davvero a schermo". Non sono alternative: si usano insieme.

## Come invocare una skill

Usa il tool `Skill` con il nome esatto (senza slash iniziale). Per skill con namespace di plugin usa la forma `plugin:skill` (es. `vercel:nextjs`, `vercel:turbopack`, `supabase:supabase`). Invoca la skill PRIMA di scrivere codice sul task, non dopo. Se una skill matcha il task, caricarla e un requisito bloccante.

```bash
# pattern concettuale (l'agente usa il tool Skill, non la shell)
Skill(skill="threejs-shaders")        # skill non namespaced
Skill(skill="vercel:turbopack")       # skill di plugin
```

---

## Tabella di routing per area

Legenda colonna "File": documento della suite (path da MANIFEST) o fase di lavoro a cui la skill si applica. I file 3D/HERO/CINEMATIC sono `docs/04-3D-HERO-WATER-LOGO.md` e `docs/05-CINEMATIC-SCROLL.md`.

### 3D / WebGL / WebGPU / shader

| Skill | Quando invocarla (trigger) | File / fase |
|---|---|---|
| `3d-web-experience` | Inizio di qualsiasi scena 3D interattiva nel browser; planning della pipeline GLB->R3F. | `docs/03-ARCHITECTURE.md`, `docs/04` |
| `threejs-skills` | Indice/orchestratore delle sotto-skill three; caricala quando non sai quale three-skill serve. | `docs/04`, `docs/05` |
| `threejs-fundamentals` | Setup scene/camera/renderer, render loop, basi WebGPU prima di toccare il compute/WGSL. | `docs/03`, `docs/04` |
| `threejs-geometry` | Riferimento per ragionare sulla forma della 'A' (medial axis / capsule strokes riempiti in `initFromHomes()` in `src/webgl/waterball/mls-mpm/mls-mpm.ts`); nessun GLB caricato a runtime, la geometria e procedurale. | `docs/04` |
| `threejs-materials` | Modello di materiale acqua per il render Screen-Space-Fluid (translucenza teal, Beer-Lambert, fresnel, reflect/refract cubemap) — utile come glossario concettuale anche se l'hero e raw WebGPU/WGSL, non un materiale three. | `docs/04` |
| `threejs-shaders` | Scrittura WGSL/TSL: passi SSF in `src/webgl/waterball/render/*.wgsl.ts` (sphere->depth->bilateral->thickness->gaussian->fluid) e churn engine in `mls-mpm/g2p.wgsl.ts` (velocity-based). | `docs/04`, `docs/05` |
| `shader-programming-glsl` | Riferimento per GLSL/algoritmi shader portabili a WGSL; l'hero NON ha backend WebGL2/FBO (e WebGPU-only, fallback = gradiente CSS in `CanvasHost`). | `docs/04` |
| `threejs-lighting` | Illuminazione/ambiente per il render acqua (cubemap reflect/refract); palette `--color-celeste` + bianco, GOLD rimosso. | `docs/04` |
| `threejs-loaders` | Solo per asset GLB sorgente in pipeline Blender (`public/models/a-mark.glb`, `a-liquid.glb`); NON caricati a runtime nell'hero spedito. | `docs/04` |
| `threejs-textures` | KTX2/Basis, cubemap (`public/cubemap`), gestione mipmaps e colorspace per il render acqua. | `docs/04` |
| `threejs-postprocessing` | Riferimento concettuale a Bloom/DOF/grade; NB: `postprocessing` + `@react-three/postprocessing` sono installati ma UNUSED nell'hero spedito (il blur/compositing e fatto nei passi WGSL SSF). | `docs/04`, opzionale |
| `threejs-interaction` | Pointer/raycast e coordinate normalizzate; NB: l'interazione hero passa per `heroStore` (explode/reveal/video), non per `pointerStore` (dead code). | `docs/04` |
| `threejs-animation` | Animazioni di scena, clip, mixaggio temporizzato (non lo scrub Lenis, quello e GSAP). | `docs/05` |
| `spline-3d-integration` | SOLO se si valuta un import Spline come scorciatoia prototipale; non e la pipeline canonica (Blender lo e). | valutazione opzionale |

### Scroll / motion

| Skill | Quando invocarla (trigger) | File / fase |
|---|---|---|
| `scroll-experience` | Progettazione dell'intera long-page scroll-driven; sync Lenis<->R3F in UN solo rAF. | `docs/03`, `docs/05` |
| `fixing-motion-performance` | Quando lo scroll scatta, il jank supera il budget, o ScrollTrigger desincronizza dal canvas. | QA perf, `docs/05` |
| `magic-animator` | Generazione rapida di micro-interazioni/transizioni di sezione come bozza da rifinire a mano. | `docs/02`, sezioni S1-S6 |
| `animejs-animation` | SOLO se si introduce anime.js per micro-animazioni DOM fuori dal dominio GSAP; non e canonico (GSAP lo e). | opzionale |
| `magic-ui-generator` | Bozze di pattern UI animati (eyebrow reveal, marquee, badge) da adattare ai token oceano. | `docs/02` |

### Next / React / TypeScript

| Skill | Quando invocarla (trigger) | File / fase |
|---|---|---|
| `nextjs-app-router-patterns` | Layout/route/`page.tsx`, Server vs Client Components, route `/work/[slug]`, metadata. | `docs/01`, `docs/03` |
| `nextjs-best-practices` | Scaffolding iniziale Next 16 + Turbopack, `next.config`, images avif/webp. | `docs/01` |
| `react-best-practices` | Composizione componenti sezione, hook discipline, boundary client per il Canvas. | `docs/03` |
| `react-patterns` | Pattern avanzati (provider, context per i18n, portal per overlay DOM sul canvas). | `docs/03` |
| `react-component-performance` | Memoizzazione, evitare re-render del Canvas persistente, `useFrame` discipline. | QA perf, `docs/03` |
| `react-state-management` | Decisione su confini di stato globale vs locale; precede `zustand-store-ts`. | `docs/03` |
| `zustand-store-ts` | Implementazione store tipizzati ATTIVI: `scrollStore`, `heroStore` (explode/reveal/video). NB: `pointerStore`/`heroDragStore`/`fxStore` esistono ma sono dead code (nessun import nell'albero attivo). | `docs/03` |
| `native-data-fetching` | Caricamento `src/data` (translations EN/IT, projects) lato server senza fetch client inutili. | `docs/03`, `docs/07` |
| `typescript-pro` | TS strict generale, tipi dei componenti R3F, props delle sezioni. | tutta la codebase |
| `typescript-expert` | Quando servono pattern TS non banali su API three/R3F tipizzate. | `docs/04` |
| `typescript-advanced-types` | Tipi generici complessi (es. mappe scena<->sezione, dizionari i18n type-safe). | `docs/03` |
| `zod-validation-expert` | SOLO per il form contatti (S6) se si introduce zod. NB: `src/data/projects.ts` e plain TS (type, single file), NESSUN zod a oggi. | `docs/07`, S6, opzionale |

### Design / UI

| Skill | Quando invocarla (trigger) | File / fase |
|---|---|---|
| `high-end-visual-design` | Prima di qualsiasi lavoro estetico premium (livello Awwwards); calibrazione del gusto. | `docs/02`, `docs/06` |
| `frontend-design` | Traduzione art direction oceano in layout/componenti reali. | `docs/02` |
| `frontend-dev-guidelines` | Convenzioni di implementazione front-end coerenti su tutta la codebase. | `docs/01`, `docs/03` |
| `design-taste-frontend` | Code review estetico: spacing, gerarchia, ritmo tipografico Fraunces (display/serif) + Hanken Grotesk (sans). | `docs/02`, QA visivo |
| `web-design-guidelines` | Linee guida generali di design web quando si decide una sezione da zero. | `docs/02` |
| `ui-ux-pro-max` | Decisioni UX di alto livello su flusso, affordance, gerarchia delle CTA. | `docs/00`, `docs/02` |
| `uxui-principles` | Principi fondamentali quando un pattern e dubbio. | `docs/02` |
| `minimalist-ui` | Mantenere il sito "less is more": il 3D e protagonista, il chrome DOM e essenziale. | `docs/02` |
| `tailwind-design-system` | Setup token CSS-first Tailwind v4 in `src/app/globals.css`, mapping hex oceano -> CSS variables. | `docs/01`, `docs/02` |
| `tailwind-patterns` | Pattern di utility ricorrenti (layout, responsive, dark-first). | `docs/02`, `docs/03` |
| `ui-tokens` | Definizione formale dei design token in `@theme` con prefisso `--color-*` (`--color-abyss`, `--color-foam`, `--color-celeste`, ...) e scale spazio/tipo. GOLD rimosso. | `docs/02` |
| `ui-setup` | Bootstrap della cartella `src/components/ui` e delle primitive. | `docs/03` |
| `core-components` | Implementazione delle primitive riutilizzabili (Button magnetic, Eyebrow, SectionShell). | `docs/02`, `docs/03` |
| `ui-component` / `ui-pattern` / `ui-page` | Costruzione granulare componente/pattern/pagina secondo i token bloccati. | sezioni S1-S6 |
| `radix-ui-design-system` | Integrazione Radix per nav mobile (dialog), accordion, tabs, tooltip accessibili. | `docs/03`, S6 |
| `shadcn` | SOLO se si adotta una primitive shadcn come base; restilizzare sui token oceano, niente look default. | opzionale |
| `artifact-design` | Quando si produce un mockup/artifact standalone per validare un look con Alberto. | preview/design review |

### Performance

| Skill | Quando invocarla (trigger) | File / fase |
|---|---|---|
| `web-performance-optimization` | Lighthouse < 80 mobile, LCP/CLS/INP fuori budget, lazy-load scene 3D e video. | QA perf, `docs/01` |
| `application-performance-performance-optimization` | Profiling end-to-end (bundle, runtime, GPU tier); se < 60fps scala il NUMERO di particelle del fluido MLS-MPM (e la risoluzione dei passi SSF), non una "densita pelle". | QA perf, `docs/04`, `docs/05` |

### Accessibilita (A11y)

| Skill | Quando invocarla (trigger) | File / fase |
|---|---|---|
| `accessibility-compliance-accessibility-audit` | Audit a11y formale prima di ogni milestone/deploy. | gate A11y, `docs/11` |
| `wcag-audit-patterns` | Verifica contrasto AA (foam su abyss), focus states, ordine tab. | gate A11y, `docs/02` |
| `ui-a11y` | Aria-hidden su 3D/video decorativi, alternative testuali, semantica landmark. | `docs/03`, sezioni |
| `fixing-accessibility` | Quando un audit ha trovato violazioni da correggere. | gate A11y |
| `screen-reader-testing` | Verifica che il contenuto sia leggibile da screen reader malgrado il canvas. | gate A11y |

### QA / test

| Skill | Quando invocarla (trigger) | File / fase |
|---|---|---|
| `webapp-testing` | Strategia di test della web app. NB: NESSUN runner installato a oggi (no Vitest/Playwright test; gli script `package.json` sono solo dev/build/start/typecheck) — usare prima di introdurre un framework di test. | `docs/11` |
| `e2e-testing` / `e2e-testing-patterns` | Flussi end-to-end (nav, toggle EN/IT, form contatti, route progetto) se/quando si adotta un runner E2E. | `docs/11` |
| `playwright-skill` | SOLO se si introduce Playwright per test headless in CI (non installato come test runner oggi; per la QA VISIVA usa claude-in-chrome, vedi `docs/09`). | CI, opzionale |
| `ui-visual-validator` | Validazione visiva contro l'art direction; usato in tandem con screenshot claude-in-chrome. | gate QA visivo, `docs/11` |
| `ui-review` / `ux-audit` | Review di una sezione finita: estetica, ritmo, coerenza dei token. | gate QA visivo |
| `verification-before-completion` | Checklist done-when prima di dichiarare un task concluso. | `docs/11`, ogni gate |

### Deploy / Vercel

| Skill | Quando invocarla (trigger) | File / fase |
|---|---|---|
| `vercel-deployment` | Procedura generale di deploy/preview a ogni milestone. | `docs/11`, `docs/01` |
| `vercel:nextjs` | Specificita Next su Vercel (runtime, edge, image optimization). | `docs/01` |
| `vercel:turbopack` | Configurazione/diagnosi build Turbopack. | `docs/01` |
| `vercel:vercel-functions` | SOLO se il form contatti richiede una function/edge handler. | S6, opzionale |
| `vercel:deployments-cicd` | CI/CD GitHub Actions -> Vercel, preview deploy automatici. | `docs/11` |
| `vercel:env-vars` | Gestione variabili d'ambiente (chiavi Supabase/Sentry se usate). | `docs/01`, `docs/09` |
| `vercel:shadcn` | Se si adottano primitive shadcn nel contesto Vercel. | opzionale |
| `vercel:react-best-practices` | Best practice React allineate alle raccomandazioni Vercel. | `docs/03` |
| `vercel:verification` | Verifica post-deploy che il preview sia sano. | gate deploy |

### SEO / meta / PWA

| Skill | Quando invocarla (trigger) | File / fase |
|---|---|---|
| `seo` / `seo-fundamentals` | Impostazione SEO base del portfolio (single-page + route progetto). | `docs/00`, `docs/03` |
| `seo-technical` | Sitemap/robots/canonical, hreflang EN/IT, performance come fattore SEO. | `docs/03` |
| `schema-markup` | JSON-LD Person/CreativeWork per Alberto e i progetti. | `docs/03`, `docs/07` |
| `fixing-metadata` | Correzione metadata Next (`metadata` export, OpenGraph). | `docs/03` |
| `progressive-web-app` | SOLO se si decide di rendere il portfolio installabile; non obbligatorio. | opzionale |
| `favicon` | Generazione favicon/icone (tema goccia d'acqua/AT). | `docs/03` |
| `manifest` | `manifest.webmanifest` se si abilita la PWA. | opzionale |

### Video / asset

| Skill | Quando invocarla (trigger) | File / fase |
|---|---|---|
| `remotion` / `remotion-best-practices` | Se si esportano frame-sequence per lo scrub deterministico o si ricodificano i video Higgsfield. | `docs/05` |
| `image-studio` | Editing/composizione di immagini (poster video, texture, OG image). | `docs/02`, `docs/05` |
| `fal-generate` / `ai-studio-image` / `imagen` | Generazione asset AI (poster, OG, texture caustiche/foam) quando serve un'immagine ad-hoc. | `docs/02`, `docs/05` |

### Copy

| Skill | Quando invocarla (trigger) | File / fase |
|---|---|---|
| `copywriting` | Stesura del copy EN del sito (hero tagline, about, CTA). | `docs/02`, `docs/07`, sezioni |
| `beautiful-prose` | Quando il copy about/intro deve avere qualita letteraria (tono marino, personale). | S2, `docs/07` |
| `ux-copy` | Microcopy funzionale (label CTA, stati form, toggle EN/IT). | sezioni, S6 |
| `avoid-ai-writing` | Pass finale su ogni copy per togliere il tono "scritto da AI". | review copy |
| `professional-proofreader` / `copy-editing` | Proofread/edit finale EN e IT prima del deploy. | review copy |

### Portfolio-specifiche

| Skill | Quando invocarla (trigger) | File / fase |
|---|---|---|
| `interactive-portfolio` | All'avvio del progetto, per pattern strutturali di portfolio interattivi premium. | `docs/00`, `docs/03` |
| `agentfolio` | Riferimento per portfolio che mostrano competenze AI/agentic (la tesi e l'esperienza di Alberto). | `docs/00`, `docs/07` |

### Meta / orchestrazione

| Skill | Quando invocarla (trigger) | File / fase |
|---|---|---|
| `context7-auto-research` | Prima di usare un'API di libreria con versione bloccata: auto-research della doc corretta. | sempre, vedi `docs/08` |
| `writing-plans` / `planning-with-files` | Stesura del piano di lavoro e dei file di stato (versione leggera del workflow). | `docs/11` |
| `executing-plans` | Esecuzione disciplinata di un piano gia scritto. | `docs/11` |
| `brainstorming` | Esplorazione di opzioni di design/feature prima di committare una direzione. | `docs/00`, `docs/02` |
| `subagent-driven-development` | Quando un task si scompone in sub-agenti paralleli (es. piu sezioni in parallelo). | `docs/11` |
| `dispatching-parallel-agents` / `multi-agent-patterns` | Orchestrazione di piu agenti su task indipendenti. | `docs/11` |
| `using-git-worktrees` | Lavoro parallelo su branch isolati senza conflitti. | `docs/11` |
| `commit` / `create-branch` / `create-pr` / `git-pushing` | Disciplina git: branch -> commit -> PR -> push solo quando richiesto. | `docs/11` |
| `mcp-builder` | SOLO se servisse un MCP custom (improbabile per questo progetto). | opzionale |
| `skill-creator` | SOLO se servisse incapsulare una procedura ricorrente del progetto in una skill. | opzionale |

---

## Regola di scoperta e uso autonomo (vincolante)

Prima di un task non banale, l'agente DEVE, in quest'ordine:

1. Cercare se esiste una skill pertinente nella lista `available-skills` (cerca per parola chiave: il dominio del task, es. "shader", "scroll", "zustand", "a11y", "vercel").
2. Caricarla con il tool `Skill` PRIMA di scrivere codice. Se piu skill matchano, carica prima l'orchestratrice/indice (es. `threejs-skills`) o la piu specifica.
3. Combinarla con Context7 per l'API esatta della versione bloccata (`docs/08-CONTEXT7.md`) e con l'MCP giusto per l'azione/verifica (`docs/09-MCP.md`).
4. Chiudere il task con verifica: `verification-before-completion` + QA visivo via claude-in-chrome (`docs/11-WORKFLOW.md`).

Anti-pattern: scrivere shader/scene/animazioni "a memoria" senza caricare la skill e senza Context7. Le versioni dello stack (three 0.184 con TSL/WebGPU, WebGPU raw + WGSL per l'hero MLS-MPM, Next 16, GSAP 3.15, Lenis 1.3) cambiano API rispetto alla conoscenza pregressa: la skill + Context7 evitano regressioni.

## Combo concrete per i task chiave

Hero acqua (fluido MLS-MPM WebGPU, mark 'A') - `docs/04`:

```text
Skill: threejs-shaders + shader-programming-glsl (algoritmi shader -> WGSL)
       + zustand-store-ts (heroStore: explode/reveal/video) + scroll-experience
Context7: WebGPU/WGSL (compute pipeline, storage buffers), three@0.184 (TSL come riferimento),
          wgpu-matrix (math camera). NB: niente R3F/MeshSurfaceSampler/FBO nell'hero.
Codice: src/webgl/waterball/ — mls-mpm/*.wgsl.ts + mls-mpm.ts (sim + initFromHomes() per la 'A'),
        render/*.wgsl.ts + fluidRender.ts (SSF: sphere->depth->bilateral->thickness->gaussian->fluid,
        reflect/refract cubemap), camera.ts, common.ts. WaterBallHero WebGPU-only (guard navigator.gpu;
        fallback = gradiente CSS in CanvasHost).
MCP: claude-in-chrome (screenshot hero, FPS, console pulita). Blender solo per asset sorgente a-mark.glb.
Verifica: ui-visual-validator + fixing-motion-performance se < 60fps
          (scala il NUMERO di particelle, non una densita di "foam"; valori live-tuned via leva,
          soggetti a sign-off GATE-6)
```

Cinematica Pan di Zucchero + backflip (FUSA nell'hero, frame-sequence WebP) - `docs/05`:

```text
Skill: scroll-experience + fixing-motion-performance (+ remotion / image-studio per (ri)generare
       o ottimizzare la frame-sequence WebP dai sorgenti Higgsfield)
Context7: gsap@3.15 ScrollTrigger + @gsap/react useGSAP, lenis@1.3 (sync via gsap.ticker)
Codice: public/frames/f_000..f_135.webp (136 frame) -> src/components/video-backdrop.tsx
        (canvas 2D, indicizzato da heroStore.video; preload concurrency 6, DPR clamp 1.5);
        timeline GSAP sticky ~600vh in src/components/sections/hero.tsx. reduced-motion congela
        un frame a meta sequenza (~0.5). NESSUNA sezione S3 separata, niente zoom-into-clip,
        niente VideoPlane WebGL.
MCP: Higgsfield = SOLA fonte dei frame (mp4 sorgente in public/video/, untracked) ->
     claude-in-chrome (scrub QA + network/asset)
Verifica: fixing-motion-performance, ui-review
```

Scaffolding iniziale del progetto - `docs/01`, `docs/03`:

```text
Skill: nextjs-best-practices + nextjs-app-router-patterns + tailwind-design-system
       + ui-tokens + react-state-management -> zustand-store-ts
Context7: next@16 (App Router/Turbopack), tailwindcss@4 (config CSS-first)
MCP: Vercel (preview deploy iniziale)
Verifica: verification-before-completion
```

Deploy a milestone - `docs/11`:

```text
Skill: vercel-deployment + vercel:turbopack + vercel:verification + vercel:deployments-cicd
MCP: Vercel (deploy_to_vercel, build/runtime logs) -> claude-in-chrome (QA sul preview URL)
Verifica: vercel:verification + ui-review
```

A11y audit - gate A11y `docs/11`:

```text
Skill: accessibility-compliance-accessibility-audit + wcag-audit-patterns + ui-a11y
       -> fixing-accessibility (per le correzioni) + screen-reader-testing
MCP: claude-in-chrome (tab order, focus visibili, contrasto a schermo)
Verifica: aria-hidden su 3D/video decorativi; contenuto leggibile; contrasto AA (foam su abyss)
```

Copy EN/IT - `docs/02`, `docs/07`:

```text
Skill: copywriting + beautiful-prose (about) + ux-copy (microcopy)
       -> avoid-ai-writing -> professional-proofreader / copy-editing
Nota: copy del sito in INGLESE (default), poi traduzione IT in src/data/translations.
```
