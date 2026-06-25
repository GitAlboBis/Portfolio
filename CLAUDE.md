# CLAUDE.md — Portfolio Alberto Tuveri (Master Entry Point)

> Scopo: questo e il cervello operativo del progetto. Claude Code lo legge per primo. Orienta qualsiasi agente in 30 secondi: regole d'oro, indice della documentazione, routing skill+MCP, gates. Il dettaglio sta nei file `docs/*` del MANIFEST — qui solo l'essenziale e i puntatori.

## 1. Identita & Visione

Portfolio personale di **Alberto Tuveri** — Software Engineer, Full-Stack + AI Integration. Sito **immersivo, single-page, scroll-driven**, a tema **mare/oceano della Sardegna** (cuore emotivo: Pan di Zucchero / Masua, Sulcis-Iglesiente). Obiettivo di qualita: **Awwwards Site of the Day** (riferimento di livello: `lusion.co`).

Visione in una frame: l'utente arriva su un **logo 3D "AT/A" reso come nuvola di particelle d'acqua** (GPGPU a due strati: corpo = volume d'acqua scuro/teal, pelle = schiuma ciano-bianca che schizza al passaggio del mouse e rientra come una risacca), scorre dentro una **cinematica di Pan di Zucchero** che zooma nel **backflip/tuffo di Alberto dallo scoglio**, e attraversa bio, progetti, skill e contatti — il tutto guidato da uno scroll virtualizzato (Lenis) sincronizzato in un unico frame loop con il canvas R3F persistente. Ogni animazione e intenzionale e ingegnerizzata; il sito e bilingue **EN/IT**.

## 2. REGOLE D'ORO (vincolanti)

- **Voce**: la PROSA delle direttive e in **italiano**. Codice, identificatori, nomi file/componenti, token di design e **copy del sito** sono in **inglese**. Le label dei token e i nomi tecnici restano in inglese anche nei doc.
- **Bilingue EN/IT**: ogni stringa visibile passa per `src/data/translations` (en/it). Mai hardcodare copy nei componenti.
- **Mai dichiarare "fatto" senza PROVA VISIVA**: screenshot via `claude-in-chrome` su **desktop + mobile**, **console del browser pulita** (zero errori/warning rilevanti), e verifica del comportamento atteso. Vedi gate QA in `docs/11-WORKFLOW.md`.
- **Prima di scrivere codice** che tocca three / @react-three/fiber / drei / postprocessing / GSAP / Lenis / Next.js / Tailwind v4 / zustand / zod: **consultare Context7** per le API version-specific (vedi `docs/08-CONTEXT7.md`). Non andare a memoria su API che cambiano tra versioni.
- **Performance budget non negoziabile**: 60fps desktop recente; **degrado elegante** su mobile (riduci particellari/postprocessing) e su `prefers-reduced-motion`; lazy-load di scene 3D e video; **Lighthouse performance >= 80 mobile**. Se 60fps non regge, scalare PRIMA la densita della pelle. Dettaglio in `docs/01-TECHSTACK.md` e `docs/04-3D-HERO-WATER-LOGO.md`.
- **Accessibilita**: 3D/video decorativi `aria-hidden`; contenuto leggibile da screen reader; focus states, navigazione tastiera, contrasto AA.
- **Commit piccoli e atomici**: un commit per unita di lavoro coerente; messaggi chiari. Branch prima di toccare il default. Vedi disciplina in `docs/11-WORKFLOW.md`.
- **Non inventare contenuti**: bio, progetti e metriche vengono ESCLUSIVAMENTE da `docs/07-PROJECTS.md`. Se manca un dato, segnalalo come buco aperto — non riempirlo a fantasia.
- **Non installare MCP/skill inutili** (consumano context). Usa solo gli essenziali del routing (sezione 5).

## 3. Stack (one-liner)

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · **bun** · Tailwind CSS v4 (CSS-first) · three 0.184 (WebGPURenderer+TSL, fallback WebGL2) · @react-three/fiber 9.6 · drei 10.7 · postprocessing 6.39 · gsap 3.15 + @gsap/react · lenis 1.3 · zustand 5 · zod 4 · Radix · leva · lucide-react. Deploy su **Vercel**. → Dettaglio completo, versioni e budget in **`docs/01-TECHSTACK.md`**.

## 4. Indice della Documentazione (MANIFEST)

| File | Contenuto | Quando consultarlo |
|---|---|---|
| `docs/README.md` | Indice della suite di documentazione | Punto di ingresso per navigare i doc |
| `docs/00-PRD.md` | Product Requirements: visione, obiettivi, audience, narrativa/UX, sitemap, content model, criteri di successo, scope/non-goals | Prima di prendere decisioni di prodotto o ambito |
| `docs/01-TECHSTACK.md` | Stack + versioni, convenzioni server/client, struttura file, budget perf/a11y, package manager, deploy | Allo scaffold e a ogni scelta tecnica/di dipendenza |
| `docs/02-DESIGN.md` | Art direction oceano, token colore/tipografia/spazio/motion, estetica componenti, voce del copy, ispirazioni | Quando tocchi UI, stile, token, copy |
| `docs/03-ARCHITECTURE.md` | Cartelle, Canvas globale + overlay DOM, sync Lenis↔R3F, sistema scroll, store Zustand, i18n EN/IT, routing, mappa scena↔sezione | Prima di creare moduli/scene o cablare lo scroll |
| `docs/04-3D-HERO-WATER-LOGO.md` | Logo AT/A a particelle d'acqua GPGPU 2 strati, doppio backend, fisica molla, shading acqua, Bloom/DOF, tuning, tier, pipeline Blender | Per tutto il lavoro sull'hero 3D |
| `docs/05-CINEMATIC-SCROLL.md` | Cinematica Pan di Zucchero + backflip Higgsfield, scroll-scrub, transizione-zoom, overlay WebGL, perf, fallback | Per la sezione cinematica (S3) |
| `docs/06-REFERENCES.md` | Riferimenti di qualita: Lusion, Awwwards, magicui, uiverse.io, ui-layout, codrops, threejs-journey (studiare, non copiare) | Per ispirazione e benchmark di qualita |
| `docs/07-PROJECTS.md` | Bio Alberto + schede progetto + voci Sersan provvisorie | Per QUALSIASI contenuto testuale/biografico |
| `docs/08-CONTEXT7.md` | Context7 MCP: setup, regola operativa, librerie, skill fallback | Prima di scrivere codice su librerie versionate |
| `docs/09-MCP.md` | Routing MCP/connettori per task: Blender, Higgsfield, Context7, claude-in-chrome, Vercel, Figma/Canva, Supabase; setup + passi manuali | Quando ti serve un MCP/connettore |
| `docs/10-SKILLS.md` | Tabella di routing delle skill installate per task + regola di scoperta/uso autonomo | Per scegliere la skill giusta per il task |
| `docs/11-WORKFLOW.md` | Workflow operativo: gates, loop QA visivo, done-when, orchestrazione sub-agenti, disciplina commit | A inizio e fine di ogni unita di lavoro |
| `docs/12-PARTICLE-PHYSICS.md` | Fisica delle particelle (PBD constraint-projection · PBF fluidi incomprimibili: density constraint, s_corr, vorticity, XSPH · Unified: shape matching, attrito, sleeping, diffuse/foam particles) + mappatura sul nostro solver MLS-MPM e tabella parametri | Prima di toccare il solver fluido (`src/webgl/waterball/mls-mpm/*`), tarare splash/forma, o valutare PBF come alternativa |

## 5. Routing Rapido SKILL + MCP

Tabella di primo livello. Dettaglio MCP in `docs/09-MCP.md`, dettaglio skill in `docs/10-SKILLS.md`.

| Se stai facendo… | Usa skill | Usa MCP / connettore |
|---|---|---|
| Scrivo shader GPGPU / TSL / GLSL | `threejs-shaders`, `shader-programming-glsl`, `threejs-postprocessing` | **Context7** (three 0.184 / TSL) |
| Monto scene R3F / loader / materiali | `threejs-skills`, `threejs-fundamentals`, `threejs-materials`, `threejs-loaders` | **Context7** |
| Scroll-driven / motion | `scroll-experience`, `animejs-animation`, `fixing-motion-performance` | **Context7** (gsap, lenis) |
| Next.js App Router / React / TS | `nextjs-app-router-patterns`, `react-best-practices`, `typescript-pro`, `zustand-store-ts` | **Context7**, `vercel:nextjs` |
| Design system / UI / token | `frontend-design`, `high-end-visual-design`, `tailwind-design-system`, `ui-tokens`, `radix-ui-design-system` | Figma / Canva (opzionali) |
| **Genero il GLB del logo AT/A** | `3d-web-experience`, `threejs-geometry` | **Blender MCP** (setup manuale richiesto) |
| **Genero il video cinematica** | `remotion`, `remotion-best-practices` | **Higgsfield MCP** |
| **QA visivo** (screenshot desktop+mobile, console) | `ui-visual-validator`, `ui-review`, `verification-before-completion` | **claude-in-chrome** (sostituisce Playwright per la verifica visiva) |
| Deploy / preview / log | `vercel-deployment`, `vercel:nextjs`, `vercel:verification` | **Vercel MCP** |
| Performance / a11y | `web-performance-optimization`, `accessibility-compliance-accessibility-audit`, `wcag-audit-patterns` | claude-in-chrome (audit) |
| SEO / meta / OG / PWA | `seo-technical`, `schema-markup`, `fixing-metadata`, `favicon`, `manifest` | — |
| Copy EN/IT | `copywriting`, `ux-copy`, `avoid-ai-writing`, `professional-proofreader` | — |
| Backend form contatti (solo se serve) | `zod-validation-expert`, `native-data-fetching` | **Supabase** (solo se necessario) |
| Orchestrazione / piano | `writing-plans`, `planning-with-files`, `subagent-driven-development`, `dispatching-parallel-agents` | — |

## 6. Gates (sintesi — dettaglio in `docs/11-WORKFLOW.md`)

Sequenza con punti di **conferma esplicita con Alberto** (🔵 = stop & confirm):

1. **Allineamento PRD** — leggi `docs/00-PRD.md`. 🔵 Conferma visione, audience, scope.
2. **Setup MCP** — Context7 e Blender richiedono passi (Blender e manuale, lo fa Alberto). 🔵 Conferma MCP attivi.
3. **Scaffold** — Next 16 + bun + Tailwind v4 + struttura cartelle (`docs/01`, `docs/03`). Preview deploy. 🔵
4. **Design system** — token oceano + tipografia + componenti base (`docs/02`). 🔵 Conferma art direction.
5. **Architettura runtime** — Canvas globale, FrameDriver, Lenis↔R3F, store Zustand, i18n (`docs/03`).
6. **Hero 3D water logo** — pipeline Blender→GLB→GPGPU 2 strati, doppio backend, tier (`docs/04`). 🔵 Conferma feel.
7. **Cinematica** — generazione video Higgsfield, scroll-scrub, zoom-transition (`docs/05`). 🔵 Conferma clip.
8. **Sezioni contenuto** — About, Work/Projects, Skills, Contact da `docs/07`. 🔵 Conferma copy e progetti Sersan.
9. **Perf + a11y + SEO pass** — budget, reduced-motion, Lighthouse, meta/OG, sitemap/robots.
10. **QA visivo finale + deploy** — screenshot desktop+mobile, console pulita, preview Vercel. 🔵 Conferma go-live.

Ad ogni gate vale la regola: **niente "fatto" senza prova visiva** e console pulita.

## 7. Nota su contenuti provvisori

I **due progetti realizzati per SerSan** (ruolo corrente, Software Engineer da maggio 2026) sono **PROVVISORI**: dettagli e metriche da confermare con Alberto. Trattali come placeholder in `docs/07-PROJECTS.md`; non pubblicare claim non verificati. Il CV PDF NON e aggiornato sul ruolo SerSan — la fonte di verita per la bio e `docs/07-PROJECTS.md`.
