# 11 - WORKFLOW

> Aggiornato 2026-06-27 per riflettere il codice (hero MLS-MPM WebGPU + cinematica frame-sequence). Riconciliato dal loop docs-driven-build.

> Scopo: definire il workflow operativo che ogni agente AI deve seguire per costruire il portfolio di Alberto Tuveri — gates numerati con punti di conferma, loop di QA visivo obbligatorio, criteri di "done", orchestrazione dei sub-agenti e disciplina di commit. Questo file e la procedura; i contenuti di merito vivono negli altri documenti della suite (vedi `docs/README.md`).

Questo documento si legge insieme a `CLAUDE.md` (regole d'oro e routing) e presuppone che le fonti di verita restino i file in `docs/`. Quando una decisione tocca contenuti (cosa scrivere, quali colori, quale fisica) NON improvvisare: rimanda al documento competente. Quando tocca processo (quando fermarsi, come verificare, quando chiedere) la regola e qui.

---

## 0. Principi non negoziabili

1. **Context7 prima del codice.** Prima di scrivere o modificare codice che usa una libreria versionata (Next.js 16, React 19, three 0.184, R3F 9.6, drei 10.7, gsap 3.15, lenis 1.3, zustand 5, zod 4, Tailwind v4), interroga Context7 per la documentazione della versione esatta. Regola operativa e fallback in `docs/08-CONTEXT7.md`. Non fidarti della memoria: le API di queste versioni cambiano.
2. **Non inventare contenuti.** Bio, metriche di progetto, date, copy: solo da `docs/00-PRD.md` e `docs/07-PROJECTS.md`. Le voci Sersan sono PROVVISORIE e vanno trattate come tali (placeholder marcati, mai dati inventati). Se manca un'informazione, e una `openQuestion` da portare ad Alberto, non un buco da riempire a fantasia.
3. **Chiedi conferma ai gate.** Ogni gate numerato ha un punto di STOP esplicito. Non superare un gate senza il via libera di Alberto quando indicato. Meglio una domanda in piu che mezza giornata di lavoro nella direzione sbagliata.
4. **Nessun "fatto" senza prova visiva e console pulita.** Vale per ogni sezione e per ogni gate con output visivo. Dettaglio nel loop di QA (sezione "QA visivo obbligatorio").
5. **Voce.** Prosa delle direttive in italiano; codice, identificatori, token, copy del sito in inglese. Il sito e bilingue EN/IT (`docs/03-ARCHITECTURE.md`, sezione i18n).

---

## Gate (sequenza vincolante)

I gate sono sequenziali. Ogni gate elenca: **obiettivo**, **deliverable**, **STOP/conferma**. Non si lavora su due gate aperti in parallelo (i sub-agenti possono parallelizzare DENTRO un gate, vedi "Orchestrazione").

### GATE 0 — Verifica e setup MCP

**Obiettivo:** garantire che gli strumenti necessari siano connessi PRIMA di iniziare.

- Verifica lo stato dei connettori essenziali per questo progetto: **Blender** (asset 3D), **Higgsfield** (video cinematica), **Context7** (docs), **claude-in-chrome** (QA visivo), **Vercel** (deploy). Dettagli e comandi in `docs/09-MCP.md`.
- Context7 e Blender NON sono connessi di default. Context7 si aggiunge via CLI:

```bash
claude mcp add --transport http context7 https://mcp.context7.com/mcp
```

- Blender MCP richiede passi manuali una-tantum che **solo Alberto** puo eseguire (installare `uv`, Blender 3.0+, addon BlenderMCP, "Connect to Claude", chiave Hyper3D/fal.ai). Gli agenti non possono installarlo ne avviarlo.

**STOP — conferma Alberto:** elenca cosa risulta connesso e cosa manca. Se manca Blender o Context7, fermati e chiedi ad Alberto di completare i passi manuali (riportandoli da `docs/09-MCP.md`). Non procedere al GATE 1 finche gli essenziali non sono pronti o Alberto non autorizza esplicitamente a procedere senza.

### GATE 1 — Piano

**Obiettivo:** concordare la struttura prima di scrivere codice.

**Deliverable (proposta scritta, niente codice ancora):**
- Struttura delle cartelle (allineata a `docs/03-ARCHITECTURE.md`: `src/app`, `src/components`, `src/webgl`, `src/webgl/gpgpu`, `src/lib`, `src/data`, ecc.).
- Architettura dei componenti: Canvas R3F persistente globale + overlay DOM, mappa scena 3D <-> sezione (S1..S6 di `docs/00-PRD.md`).
- Piano delle scene 3D: HERO water logo (`docs/04-3D-HERO-WATER-LOGO.md`), cinematica (`docs/05-CINEMATIC-SCROLL.md`).
- Ordine di esecuzione dei gate successivi e dipendenze sugli asset (GLB del logo, video Pan di Zucchero/backflip).

**STOP — conferma Alberto:** presenta il piano e attendi l'ok. Non scaffoldare nulla prima dell'approvazione.

### GATE 2 — Scaffold

**Obiettivo:** progetto vuoto ma deployabile, con stack e token in piedi.

**Deliverable:**
- Init Next.js 16 (App Router, Turbopack) + React 19 + TypeScript strict, package manager **bun**.
- Tailwind CSS v4 (config CSS-first in `src/app/globals.css`, `@tailwindcss/postcss`); token oceano come CSS variables (hex canonici da `docs/02-DESIGN.md`).
- Dipendenze 3D/motion/stato: `three@0.184.0`, `@react-three/fiber@9.6.x`, `@react-three/drei@10.7.x`, `@react-three/postprocessing@3.0.x`, `postprocessing@6.39.x`, `gsap@3.15.x` + `@gsap/react@2.1.2`, `lenis@1.3.x`, `zustand@5.0.x`, `zod@4.x`, `leva@0.10.1`, `lucide-react`, Radix primitives. Versioni vincolanti da `docs/01-TECHSTACK.md`; verifica le ultime via Context7 allo scaffold ma parti da queste.
- Font via `next/font`: Display "Editorial New", Body "Switzer", Mono "JetBrains Mono".
- Deploy preview **vuoto** su Vercel (MCP) per validare la pipeline.

Comandi indicativi (verificare i flag correnti con Context7 / docs Vercel):

```bash
bun create next-app@latest . --typescript --app --turbopack
bun add three @react-three/fiber @react-three/drei @react-three/postprocessing postprocessing
bun add gsap @gsap/react lenis zustand zod lucide-react
bun add -d leva
```

**STOP — conferma Alberto:** condividi l'URL della preview Vercel (anche se mostra solo una pagina vuota con i token applicati). Conferma che build e deploy funzionano end-to-end.

### GATE 3 — Sistema base (foundation)

**Obiettivo:** l'impalcatura runtime su cui poggiano tutte le sezioni.

**Nota sul pivot (2026-06):** l'architettura runtime ha abbandonato il Canvas R3F persistente. Lo stato shipped (branch `feat/hero-scroll-narrative`) NON monta nessun `<Canvas>` R3F: `CanvasHost` compone tre layer DOM/WebGPU puri. Vedi `docs/03-ARCHITECTURE.md` per la mappa aggiornata.

**Deliverable (stato shipped):**
- `CanvasHost` (`src/webgl/CanvasHost.tsx`): monta in stack il gradiente mare CSS (fallback base sempre presente), `VideoBackdrop` (`src/components/video-backdrop.tsx`, 2D `<canvas>`) e `WaterBallHero` (`src/webgl/waterball/WaterBallHero.tsx`, WebGPU raw). Nessun `<Canvas>` R3F.
- Scroll: `ScrollProvider` (`src/components/scroll-provider.tsx`) guida Lenis tramite `gsap.ticker` (un solo loop). Lo smooth scroll virtualizzato alimenta `scrollStore` e `heroStore`.
- Store Zustand effettivamente in uso: `scrollStore` e `heroStore` (campi `explode` / `reveal` / `video`).
- i18n EN/IT: provider `src/components/language-provider.tsx`, hook `useLanguage`, persistenza via cookie; dictionary nested per-sezione in `src/data`.

**Codice dormiente / da NON usare come riferimento attivo (openQuestion: rimuovere o riattivare — sign-off Alberto):** `FrameDriver.tsx`, `renderer/createRenderer.ts`, `SceneErrorBoundary.tsx`, `pointerStore`, `fxStore`, `heroDragStore` sono dead code nell'albero attivo (nessun import li raggiunge, nessun `<Canvas>` montato). Il loop del frame vive dentro `WaterBallHero` (RAF proprio + `IntersectionObserver` per l'idle).

**Non costruito (deliverable rimandati):** preloader con percentuale e transizioni di sezione/route (curtain + crossfade) NON sono implementati. Restano come openQuestion di GATE 7/rifinitura.

**STOP — conferma Alberto:** preview deployata; scroll fluido verificato, lingua commutabile. QA visivo (vedi loop) prima di chiudere il gate.

### GATE 4 — HERO acqua (priorita visiva massima)

**Obiettivo:** la lettera "A" come fluido d'acqua su WebGPU. Questo e il pezzo che decide la percezione "Awwwards" del sito: **falla eccellente prima di proseguire**. Il mark e "A" (non "AT/A").

**Nota sul pivot (2026-06):** l'hero NON e piu il sistema a particelle GPGPU a due strati con doppio backend descritto nelle prime stesure. Lo stato shipped e un solver **MLS-MPM su griglia, WebGPU raw**, vendorizzato da `matsuoka-601/WaterBall`. Riferimento d'architettura: `docs/04-3D-HERO-WATER-LOGO.md` e `docs/12-PARTICLE-PHYSICS.md`.

**Deliverable (stato shipped):**
- Solver fluido MLS-MPM in `src/webgl/waterball/mls-mpm/` (`*.wgsl.ts` + `mls-mpm.ts`). La "A" e riempita proceduralmente via `initFromHomes()` (tre tratti a capsula sull'asse mediale); **nessun GLB caricato a runtime**.
- `g2p.wgsl` e un motore di churn/confinamento velocity-based sull'asse mediale della "A" (inflate / gravity / restore / speedGate / leashRadius): modifica la **velocita**, non direttamente la posizione.
- Render chain Screen-Space-Fluid in `src/webgl/waterball/render/` (`*.wgsl.ts` + `fluidRender.ts`): sphere -> depth -> bilateral -> thickness -> gaussian -> fluid; reflect/refract via cubemap; output premultiplied composito sopra il `VideoBackdrop`.
- **WebGPU-only**: guard `navigator.gpu` -> se assente ritorna `null`. NON esiste path WebGL2; il fallback e il gradiente mare CSS montato da `CanvasHost`. Loop proprio (RAF) con idle via `IntersectionObserver`.
- Input dallo store: legge `explode` / `reveal` / `video` da `heroStore`.
- Valori di tuning (forze del churn, confinamento, soglie velocity-gate, parametri SSF/shading) sono **live-tuned via leva, soggetti a sign-off GATE-6**: non trattarli come finali in questo doc.

**STOP — conferma Alberto:** demo dell'hero su preview, con QA visivo desktop + mobile e prova che il fallback CSS-gradient funzioni dove manca WebGPU. **Feel dell'hero NON ancora firmato** (tuning leva aperto). Non si passa oltre finche l'hero non e giudicato "eccellente" da Alberto. E il gate dove conviene investire piu iterazioni.

### GATE 5 — Cinematica

**Obiettivo:** la sequenza cinematica Pan di Zucchero + backflip/tuffo, scrubbata dallo scroll (`docs/05-CINEMATIC-SCROLL.md`).

**Nota sul pivot (2026-06):** la cinematica NON e piu una sezione S3 separata con `<video>` Higgsfield + zoom-into-clip + overlay WebGL. E **fusa nell'hero** (`src/components/sections/hero.tsx`, timeline GSAP sticky ~600vh). `cinematic-placeholder.tsx` e stato eliminato.

**Deliverable (stato shipped):**
- Sequenza di **136 frame WebP** in `public/frames/f_000.webp` .. `f_135.webp`, disegnati su un `<canvas>` 2D in `src/components/video-backdrop.tsx`, indicizzati da `heroStore.video` (progresso scroll dell'hero).
- Preload throttlato (concorrenza 6, per non decodificare tutte le 136 still 1920px insieme), DPR clampato a 1.5.
- `prefers-reduced-motion`: congela un frame a meta sequenza (~0.5), nessuno scrub.
- Le sorgenti grezze Higgsfield (`public/video/hf_20260624_*.mp4`) sono **SOURCE-ONLY** (untracked): servono solo per estrarre i frame, non vengono caricate a runtime.

**STOP — conferma Alberto:** QA visivo dello scrub (desktop + mobile), nessun jank evidente durante lo scroll, frame freezato corretto a reduced-motion.

### GATE 6 — Sezioni rimanenti

**Obiettivo:** completare il contenuto.

**Deliverable:** S2 INTRO/ABOUT, S4 WORK/PROJECTS (Badante24h, DOIT voice AI, Sersan PROVVISORI, academic supply chain — card con ruolo, problema/azione/risultato, stack, metriche), S5 SKILLS/STACK (Core, Front-End, Back-End/DB, Cloud/DevOps, AI), S6 CONTACT/FOOTER (email, LinkedIn, GitHub, toggle EN/IT, eventuale banner cookie minimale). Eventuali route `/work/[slug]`. Contenuti da `docs/00-PRD.md` e `docs/07-PROJECTS.md`, tutto bilingue.

**STOP — conferma Alberto:** QA visivo per ogni sezione man mano che entra. Le voci Sersan restano marcate come provvisorie finche Alberto non fornisce i dettagli.

### GATE 7 — Rifinitura (perf + a11y + SEO + Lighthouse)

**Obiettivo:** portare il sito sopra i budget.

**Checklist:**
- [ ] 60fps su desktop recente; degrado elegante su mobile (riduci particellari/postprocessing) e `prefers-reduced-motion`.
- [ ] Lazy-load scene 3D e video.
- [ ] Lighthouse performance **>= 80 su mobile**.
- [ ] A11y: 3D/video decorativi `aria-hidden`, contenuto leggibile da screen reader, focus states, navigazione da tastiera, contrasto AA.
- [ ] SEO/meta: metadata, sitemap/robots, opengraph (`src/app`), schema dove utile.
- [ ] `next.config`: `images` formats avif+webp, qualities `[75,90]`, `minimumCacheTTL` annuale.
- [ ] Console del browser pulita (zero error/warning rilevanti) su tutte le sezioni.

**STOP — conferma Alberto:** report Lighthouse mobile + audit a11y; QA visivo finale full-page.

### GATE 8 — Consegna

**Obiettivo:** rilascio.

**Deliverable:** build di produzione verde, deploy Vercel finale (dominio definitivo se previsto), `README.md` di progetto (setup, run, deploy, struttura). Aggiornare `docs/` con eventuali decisioni prese in corsa.

**STOP — conferma Alberto:** consegna URL finale + README; verifica che i "done-when" del progetto siano soddisfatti (sezione finale, rimanda a `docs/00-PRD.md`).

---

## QA visivo obbligatorio (loop dopo OGNI sezione)

Nessuna sezione e "fatta" senza prova visiva e console pulita. Dopo ogni sezione / gate con output visivo, esegui questo loop con **claude-in-chrome** (sostituisce Playwright MCP per la verifica visiva; vedi `docs/09-MCP.md`):

1. Avvia l'app (preview Vercel o dev locale) e naviga alla sezione.
2. **Screenshot desktop** (viewport ~1440px) e **mobile** (viewport ~390px).
3. Confronta con i riferimenti di qualita (`docs/06-REFERENCES.md`: Lusion, Awwwards, codrops, ecc.). Studiare, non copiare.
4. **Leggi la console del browser**: zero error, zero warning rilevanti. Leggi anche le richieste di rete se ci sono asset 3D/video (404, payload sospetti).
5. Verifica il comportamento a `prefers-reduced-motion` e il fallback (per hero/cinematica).
6. Se qualcosa non va: **itera**. Non dichiarare done.

Applica le skill `verification-before-completion` e `ui-visual-validator` come gate finale di ogni sezione. La frase "sembra a posto" senza screenshot + console non e accettabile.

**Nota tooling (2026-06):** `package.json` espone SOLO gli script `dev` / `build` / `start` / `typecheck` — NON sono installati eslint / prettier / vitest / `@playwright/test` (`playwright` e presente solo come libreria browser, non come test runner). Di conseguenza il QA automatizzabile e: `bun run typecheck` (zero errori TS) + la verifica visiva via **claude-in-chrome**. Non c'e una suite di test o un linter da far girare in CI; la prova visiva + console pulita resta il gate vincolante.

**Definizione di "done" per una sezione:**
- [ ] Screenshot desktop e mobile catturati e confrontati col riferimento.
- [ ] Console pulita; nessun 404 sugli asset.
- [ ] 60fps desktop / degrado corretto su mobile.
- [ ] `prefers-reduced-motion` rispettato.
- [ ] Copy corretto in EN e IT.
- [ ] A11y di base (focus, aria-hidden sui decorativi, contrasto).

---

## Disciplina di commit

- **Commit piccoli e descrittivi**, uno per unita logica di lavoro. Niente commit-monstre di fine gate.
- **Lavora su branch**, mai direttamente sul branch di default. Un branch per feature/gate (es. `gate-4-hero-water`, `feat/cinematic-scroll`).
- **Preview deploy a ogni milestone** (fine di ogni gate, e ogni volta che serve QA visivo su URL reale).
- Usa le skill `commit`, `create-branch`, `create-pr` per coerenza di messaggi e flusso PR.
- Apri PR a fine gate; il merge avviene dopo il QA visivo e l'ok di Alberto.
- Messaggi di commit in inglese, imperativi e concisi (es. `add velocity-gated restore to mls-mpm churn`).

---

## Orchestrazione dei sub-agenti

**Quando parallelizzare:** solo per task indipendenti DENTRO lo stesso gate, dove non ci sono dipendenze di file o di stato. Esempi validi: mentre un agente tara il solver fluido (`src/webgl/waterball/mls-mpm/*`, GATE 4), un altro prepara i dati delle card progetto (`src/data`, GATE 6 anticipabile a livello dati); oppure un agente scrive il copy EN/IT mentre un altro costruisce i componenti di layout. Esempi NON validi: due agenti sullo stesso store Zustand (`heroStore`/`scrollStore`), o sui medesimi `*.wgsl.ts` del render chain SSF.

**Pattern di riferimento (skill):** `dispatching-parallel-agents`, `subagent-driven-development`, `multi-agent-patterns`. Ogni sub-agente riceve: il gate corrente, i documenti `docs/` rilevanti, e un done-when esplicito. Il coordinatore raccoglie, fa il QA visivo unificato e integra.

**Regola anti-collisione:** se due task possono toccare gli stessi file, NON parallelizzarli; serializzali o usa git worktree separati (`using-git-worktrees`).

**Sistema di tracciamento — DECISIONE BLOCCATA (2026-06): flusso LEGGERO.**
- **Leggero (SCELTO):** `CLAUDE.md` + `docs/` come fonte di verita (la suite `docs/` E gia la spec), gates espliciti di questo file, QA visivo obbligatorio, **git come journal** (commit piccoli per milestone), il **Workflow multi-agente** per i pezzi parallelizzabili, e la TaskList della sessione per il tracking in-session. Motivazione: il portfolio e un singolo build creativo coeso; gli hook di Trellis iniettano contesto a ogni prompt e rallentano il loop veloce "modifica shader -> screenshot -> ritocca" che un sito WebGL richiede. Si tengono le parti buone (gates, agenti paralleli, disciplina git) senza la macchina pesante.
- **Spec-driven (Trellis) — NON adottato ora:** sistema `.trellis` (spec/tasks/journal) + hooks `.claude` (session-start, inject-subagent-context, inject-workflow-state) + agenti custom, come sul repo Sersan. Riconsiderarlo solo se il progetto cresce (piu siti, team, lavoro multi-settimana).

---

## Regole trasversali (sempre attive, in ogni gate)

1. **Context7 prima del codice** su ogni libreria versionata (`docs/08-CONTEXT7.md`).
2. **Non inventare contenuti**; Sersan = provvisorio; informazioni mancanti = `openQuestion`, non invenzione.
3. **Conferma ai gate**: rispetta gli STOP.
4. **Prova visiva + console pulita** prima di ogni "done".
5. **Performance e a11y non sono il GATE 7 e basta**: si tengono d'occhio da subito (lazy-load, reduced-motion, contrasto). Il GATE 7 e la rifinitura finale, non il primo momento in cui ci si pensa.
6. **Skill discovery autonoma**: usa il routing in `docs/10-SKILLS.md` per scegliere la skill giusta per ogni task; se non sei sicuro, cerca tra le skill installate prima di reinventare.
7. **Non installare MCP inutili** (consumano context): essenziali = Blender, Higgsfield, Context7, claude-in-chrome, Vercel (`docs/09-MCP.md`).

---

## Done-when del progetto

I criteri di "done" complessivi del prodotto (obiettivi, audience, criteri di successo, scope/non-goals) sono definiti in `docs/00-PRD.md`. Sintesi operativa per chiudere il GATE 8:

- [ ] Tutte le sezioni S1..S6 implementate, bilingui EN/IT, con QA visivo superato.
- [ ] Hero water logo giudicato "eccellente" da Alberto; cinematica scrub fluida.
- [ ] Lighthouse performance >= 80 mobile; a11y AA; console pulita.
- [ ] Fallback (reduced-motion, GPU deboli, mobile) verificati.
- [ ] Build prod verde + deploy Vercel finale + `README.md`.
- [ ] Voci Sersan: o completate con i dati reali forniti da Alberto, o esplicitamente segnate come provvisorie/placeholder approvati.
- [ ] Tutti i criteri di successo di `docs/00-PRD.md` soddisfatti.
