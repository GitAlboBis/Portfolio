# Portfolio Alberto Tuveri — Indice della suite di documentazione

> Scopo: questo file e la **mappa di navigazione** della documentazione operativa del portfolio. Ogni documento qui elencato e una direttiva vincolante che gli agenti AI devono seguire alla lettera per costruire il sito (immersivo, scroll-driven, a tema mare/oceano della Sardegna, qualita Awwwards). La PROSA delle direttive e in italiano; tutto il codice, gli identificatori, i token di design e il copy del sito sono in inglese.

## Come usare questa suite

- Il punto di ingresso assoluto e `CLAUDE.md` (regole d'oro, voce, routing skill+MCP, gates). Leggilo per primo, sempre.
- Questa `docs/README.md` e solo l'indice: non contiene specifiche, rimanda ai documenti corretti.
- Ogni documento ha uno scopo unico e non ridondante. Non duplicare contenuto tra file: rimanda con il path del MANIFEST.
- I path nei cross-reference sono **assoluti** e identici a quelli qui sotto.

## Indice dei documenti

| File | Scopo (1 frase) | Leggi PRIMA di |
|------|-----------------|----------------|
| `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/CLAUDE.md` | Master entry: regole d'oro, convenzione di voce, routing di skill e MCP, gates, indice generale. | Qualsiasi attivita: e il primo file da aprire in ogni sessione. |
| `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/README.md` | Indice navigabile della suite (questo file). | Orientarsi tra i documenti / decidere cosa aprire. |
| `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/00-PRD.md` | Product Requirements: visione, obiettivi, audience, narrativa/UX, sitemap, content model, criteri di successo, scope/non-goals. | Decidere COSA costruire e perche; definire contenuti e sezioni. |
| `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/01-TECHSTACK.md` | Stack e versioni vincolanti, convenzioni server/client, struttura file, budget perf/a11y, package manager, deploy. | Scaffolding del progetto, scelta dipendenze, setup build/deploy. |
| `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/02-DESIGN.md` | Art direction oceano, token colore/tipografia/spazio/motion, estetica componenti, voce del copy, librerie di ispirazione. | Scrivere CSS/Tailwind, creare componenti UI, definire il copy. |
| `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/03-ARCHITECTURE.md` | Cartelle, Canvas WebGL globale + overlay DOM, sync Lenis<->R3F, sistema scroll, store Zustand, i18n EN/IT, routing, mappa scena<->sezione. | Impostare l'architettura, gli store, lo scroll, il routing, l'i18n. |
| `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/04-3D-HERO-WATER-LOGO.md` | Logo 'A' a fluido MLS-MPM su WebGPU (vendored WaterBall) + render Screen-Space-Fluid, riempimento procedurale della 'A', churn velocity-based, fallback CSS sea gradient, tuning live-tuned via leva. | Implementare l'hero 3D e il solver fluido WebGPU. |
| `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/05-CINEMATIC-SCROLL.md` | Cinematica come frame-sequence WebP scrubbata, fusa nell'hero (timeline GSAP sticky), 2D canvas indicizzato da heroStore.video, preload e fallback reduced-motion. | Implementare lo scrub della cinematica fusa nell'hero. |
| `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/06-REFERENCES.md` | Riferimenti di qualita (Lusion, Awwwards, Codrops, Three.js Journey, magicui, uiverse.io, ui-layout): studiare-non-copiare. | Cercare ispirazione tecnica/estetica prima di progettare un effetto. |
| `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/07-PROJECTS.md` | Bio di Alberto + schede progetto (Badante24h, DOIT voice AI, Agricultural Supply Chain) + voci Sersan provvisorie. | Scrivere il contenuto delle sezioni About e Work/Projects. |
| `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/08-CONTEXT7.md` | Context7 MCP: setup, regola operativa, librerie, skill di fallback per docs version-specific. | Toccare API di librerie con versioni precise (Next 16, three 0.184, R3F 9). |
| `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/09-MCP.md` | Routing MCP/connettori per task: Blender, Higgsfield, Context7, claude-in-chrome, Vercel, Figma/Canva, Supabase; setup e passi manuali. | Usare un MCP (asset 3D, video, QA visivo, deploy, docs). |
| `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/10-SKILLS.md` | Tabella di routing delle skill installate per task + regola di scoperta/uso autonomo. | Scegliere quali skill invocare per un dato task. |
| `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/11-WORKFLOW.md` | Workflow operativo agenti: gates, loop di QA visivo, done-when, orchestrazione sub-agenti, disciplina commit. | Eseguire qualsiasi task di build: definisce processo e criteri di "fatto". |
| `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/12-PARTICLE-PHYSICS.md` | Base di conoscenza fisica delle particelle: PBD (constraint projection), PBF (fluidi incomprimibili: density constraint, s_corr, vorticity, XSPH), Unified Particle Physics (shape matching, attrito, sleeping, diffuse particles); + mappatura sul nostro hero MLS-MPM e parametri. | Toccare il solver del fluido (`src/webgl/waterball/mls-mpm/*`), tarare splash/forma, o valutare un solver alternativo (PBF). |

## Ordine di lettura consigliato (nuovo agente)

Segui questa sequenza la prima volta che entri nel progetto. Dopo, apri solo i documenti pertinenti al task.

1. `CLAUDE.md` — regole d'oro, voce, gates (obbligatorio, sempre per primo).
2. `docs/00-PRD.md` — cosa stai costruendo e perche.
3. `docs/02-DESIGN.md` — l'art direction e i token: ti danno il "look" prima del codice.
4. `docs/01-TECHSTACK.md` — versioni e convenzioni con cui scriverai.
5. `docs/03-ARCHITECTURE.md` — come si incastrano Canvas globale, scroll, store, i18n.
6. `docs/04-3D-HERO-WATER-LOGO.md` + `docs/05-CINEMATIC-SCROLL.md` — i due pezzi WebGL forti (leggi 04 prima di 05).
7. `docs/06-REFERENCES.md` — qualita di riferimento da studiare (non copiare).
8. `docs/07-PROJECTS.md` — i contenuti reali (bio + progetti).
9. `docs/08-CONTEXT7.md`, `docs/09-MCP.md`, `docs/10-SKILLS.md` — gli strumenti (docs version-specific, connettori, skill).
10. `docs/11-WORKFLOW.md` — il processo: gates, QA visivo, done-when, commit.

## Convenzioni di cross-reference

- Quando un documento rimanda a un altro, usa il path assoluto del MANIFEST (colonna "File" qui sopra).
- E ammesso, in alternativa, un link markdown **relativo** tra file dentro `docs/` (es. `./03-ARCHITECTURE.md`): e una forma valida quanto il path assoluto, coerente con l'uso gia presente in `04-3D-HERO-WATER-LOGO.md` e `05-CINEMATIC-SCROLL.md`.
- Quando aggiorni le specifiche, modifica il documento di competenza, **non** duplicare in piu file.
- La fonte di verita per stack, token e narrativa e distribuita: stack -> `01-TECHSTACK.md`, token/design -> `02-DESIGN.md`, contenuti -> `07-PROJECTS.md`. In caso di conflitto, vince il documento di competenza, poi `CLAUDE.md`.
