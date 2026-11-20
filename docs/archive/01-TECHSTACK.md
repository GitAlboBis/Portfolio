# 01 — TECH STACK

> Scopo: definire lo stack tecnico VINCOLANTE del portfolio di Alberto Tuveri, le convenzioni di codice (server/client, Tailwind v4 CSS-first, TypeScript strict), la struttura delle cartelle top-level, la gestione degli asset, i budget di performance e accessibilita, e la configurazione di deploy su Vercel. Questo file e legge come legge: gli agenti AI lo seguono alla lettera. La prosa e in italiano; codice, identificatori, token e copy del sito sono in inglese.

> Aggiornato 2026-06-27 per riflettere il codice (hero MLS-MPM WebGPU + cinematica frame-sequence). Riconciliato dal loop docs-driven-build.

---

## 0. Regola d'oro: Context7 PRIMA di scrivere codice di libreria

Prima di scrivere o modificare codice che usa una qualsiasi libreria elencata qui sotto, l'agente DEVE recuperare la documentazione version-specific via **Context7 MCP** (vedi `docs/08-CONTEXT7.md`). Le API di `three` (TSL/WebGPU), `@react-three/fiber` 9, GSAP 3 + `@gsap/react`, Lenis 1.3, Tailwind v4 e Next.js 16 cambiano spesso e le risposte a memoria sono frequentemente sbagliate. Flusso obbligatorio:

1. `resolve-library-id` per ottenere l'ID Context7 (es. `/pmndrs/react-three-fiber`).
2. `get-library-docs` con il topic specifico (es. "useGSAP ScrollTrigger", "WebGPURenderer TSL compute").
3. Solo dopo, scrivere il codice.

Se Context7 non e ancora configurato, fermarsi e seguire il setup in `docs/08-CONTEXT7.md`. Fallback skill quando Context7 e giu: vedi tabella in `docs/10-SKILLS.md` (es. `threejs-skills`, `nextjs-app-router-patterns`, `context7-auto-research`).

> Nota importante sull'hero: l'hero acqua NON usa `@react-three/fiber` ne il renderer R3F. E un modulo **raw WebGPU** (MLS-MPM + Screen-Space-Fluid) vendorizzato da `matsuoka-601/WaterBall` in `src/webgl/waterball/`, con il proprio device WebGPU, le proprie pipeline WGSL e il proprio RAF loop. Dettaglio in `docs/04-3D-HERO-WATER-LOGO.md`. Le voci R3F/postprocessing qui sotto restano nel grafo delle dipendenze ma al momento NON sono montate in produzione (vedi nota "INSTALLATO MA NON USATO").

---

## 1. Tabella libreria → versione (VINCOLANTE)

Partire ESATTAMENTE da queste versioni — sono allineate a `package.json` su branch `feat/hero-scroll-narrative`. Verificare le ultime patch via Context7/npm allo scaffold, ma NON cambiare major senza approvazione di Alberto (annotare in `openQuestions`).

| Area | Pacchetto | Versione | Note |
|---|---|---|---|
| Framework | `next` | **16.2.6** | App Router, Turbopack |
| UI runtime | `react`, `react-dom` | **19.2.4** | Server Components di default |
| Linguaggio | `typescript` | **^5** | `strict: true` obbligatorio |
| Package manager | `bun` | **1.x** | unico PM; `bun.lock` canonico |
| Styling | `tailwindcss` | **^4** | config CSS-first in `globals.css` |
| Styling (build) | `@tailwindcss/postcss` | **^4** | plugin PostCSS Tailwind v4 (devDep) |
| 3D core | `three` | **0.184.0** | usato come libreria; l'hero gira su WebGPU raw, NON su R3F |
| WebGPU math | `wgpu-matrix` | **^3.3.0** | matrici/vettori per camera e pipeline dell'hero WaterBall |
| 3D React | `@react-three/fiber` | **9.6.1** | INSTALLATO MA NON USATO nell'albero attivo (vedi nota sotto) |
| 3D helpers | `@react-three/drei` | **10.7.7** | INSTALLATO MA NON USATO nell'albero attivo |
| 3D postproc | `@react-three/postprocessing` | **3.0.4** | INSTALLATO MA NON USATO nell'albero attivo |
| Postproc core | `postprocessing` | **6.39.1** | INSTALLATO MA NON USATO nell'albero attivo |
| Animazione | `gsap` | **^3.15.0** | timeline + ScrollTrigger (cinematica sticky in `hero.tsx`) |
| Animazione React | `@gsap/react` | **2.1.2** | `useGSAP` hook |
| Smooth scroll | `lenis` | **^1.3.23** | scroll virtualizzato, guidato da `gsap.ticker` in `scroll-provider.tsx` |
| Stato | `zustand` | **5.0.14** | store globali (vedi `docs/03-ARCHITECTURE.md`) |
| Validazione | `zod` | **^4.4.3** | DEPENDENCY presente ma NON ancora usata a runtime (backlog form contatti) |
| UI primitives (CVA) | `class-variance-authority` | **^0.7.1** | variants per il Button (`signal/outline/ghost/link`) |
| Class utils | `clsx` + `tailwind-merge` | **^2.1.1 / ^3.6.0** | helper `cn()` in `src/lib/utils.ts` |
| Debug | `leva` | **0.10.1** | tuning live dell'hero (devDep); tree-shaken/escluso in prod |

> **INSTALLATO MA NON USATO (albero attivo)**: `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `postprocessing` restano in `package.json` come residuo della precedente architettura R3F/GPGPU, ma nessun componente montato li importa (NON esiste un `<Canvas>` R3F in produzione). Stessa cosa per `zod` (nessuno schema a runtime al momento). Decidere se rimuoverli o ricablarli e un **openQuestion** per il gate perf/cleanup — non assumere che siano vivi.

> **openQuestion**: `@radix-ui/react-*` e `lucide-react`, dati per scontati nelle direttive storiche, NON sono attualmente in `package.json`. La nav mobile e le icone vanno verificate prima di citarli come dipendenze: aggiungerli con `bun add` solo quando un componente li usa davvero.

Tooling 3D / asset pipeline: gli asset GLB (`a-mark.glb`, `a-liquid.glb`) NON sono caricati a runtime (l'hero riempie la "A" proceduralmente, vedi `docs/04`). Eventuali tool come `@gltf-transform/cli` / `gltfjsx` restano opzionali e NON sono installati: usarli ad-hoc solo se serve rigenerare un GLB.

**Tooling qualita — stato reale (backlog)**: al momento NON sono installati `eslint`, `prettier`, `vitest`, ne `@playwright/test`. L'unico `playwright` presente e la **browser library** (`playwright@^1.61.1`, devDep), NON il test runner. La verifica VISIVA in QA si fa con **claude-in-chrome** (screenshot/console/network), vedi `docs/09-MCP.md` e `docs/11-WORKFLOW.md`. Lint/format/unit-test/e2e sono lavoro di BACKLOG (gate perf/a11y/SEO): quando verranno introdotti, aggiornare questa sezione e gli script.

---

## 2. Package manager: bun (comandi canonici)

`bun` e l'unico package manager; `bun.lock` e il lockfile canonico. **Non committare `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`.** Nota: nel working tree esiste uno `package-lock.json` spurio (npm) — **deve essere eliminato** (`rm package-lock.json`) per non confondere CI e contributor.

```bash
# install dipendenze
bun install

# dev server (Next 16; Turbopack e il default in dev, nessun flag --turbopack necessario)
bun run dev            # -> http://localhost:3000

# build di produzione
bun run build

# avvio del build di produzione (verifica locale pre-deploy)
bun run start

# type-check senza emit
bun run typecheck      # tsc --noEmit

# aggiungere/rimuovere pacchetti (rispettare le versioni della tabella)
bun add three@0.184.0
```

Script `package.json` ESISTENTI (questi e solo questi):

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  }
}
```

> NON esistono script `lint` / `format` / `test` / `test:e2e`. Sono backlog (vedi sezione 1, "Tooling qualita"). Non inventarli nei comandi finche i tool non vengono installati. Il gate di merge sui tipi e `bun run typecheck`.

---

## 3. Convenzioni Server / Client Components

Next.js 16 App Router: **i componenti sono Server Components di default.** `"use client"` e l'eccezione, non la regola. Aggiungerlo SOLO quando il componente usa almeno uno di:

- React hooks di stato/effetto (`useState`, `useEffect`, `useReducer`, `useRef` per DOM/animazione);
- event handler del browser (`onClick`, `onScroll`, `onPointerMove`, ...);
- Browser API (`window`, `document`, `IntersectionObserver`, `matchMedia`, WebGPU/Canvas 2D, audio);
- animazioni (GSAP, `useGSAP`, Lenis) o qualsiasi modulo WebGPU dell'hero (`src/webgl/**`);
- store Zustand consumati con hook reattivi;
- librerie che richiedono il client (`leva`, `lenis`, `gsap`).

Regole pratiche:

- Tutto cio che e WebGPU/Canvas (`src/webgl/**`, `src/components/video-backdrop.tsx`) e `"use client"`. L'hero si monta in un `CanvasHost` client globale che NON usa un `<Canvas>` R3F: monta un gradiente CSS "sea" di fallback, il `VideoBackdrop` (canvas 2D) e `WaterBallHero` (raw WebGPU). Vedi `docs/03-ARCHITECTURE.md`.
- Le sezioni di contenuto statico (testo, heading, layout della long-page) restano Server Components dove possibile; al loro interno si annidano isole client (split-text reveal, parallax) marcate `"use client"`.
- `app/layout.tsx` legge il cookie `lang` lato server e monta i provider client (`LanguageProvider`, `ScrollProvider`) e `CanvasHost`.
- I dati statici (`src/data/projects`, `src/data/skills`, `src/data/translations`) si importano da Server Components quando il consumo non e interattivo; passare al client solo cio che serve.
- Mai mettere segreti in codice client. Le env esposte al browser hanno prefisso `NEXT_PUBLIC_`; tutto il resto resta server-side.

> **openQuestion / backlog**: il pattern `src/lib/env.ts` con validazione Zod e `import "server-only"` NON e attualmente implementato (non esistono ne `env.ts` ne `server-only` nel codebase). Introdurlo SOLO quando compaiono env reali da validare (es. backend form contatti). Finche non c'e, non documentarlo come "in essere".

---

## 4. Tailwind CSS v4 — CSS-first + token

Tailwind v4 si configura **CSS-first**: niente `tailwind.config.js` con la palette; i token vivono in `src/app/globals.css` come CSS variables dentro `@theme`. PostCSS usa `@tailwindcss/postcss`.

`postcss.config.mjs`:

```js
const config = {
  plugins: { "@tailwindcss/postcss": {} },
};
export default config;
```

`src/app/globals.css` — sistema **"Cinematic Ocean" (lineage NatGeo)**. Estratto fedele (palette completa e razionale in `docs/02-DESIGN.md`):

```css
@import "tailwindcss";

@theme {
  /* Palette — natural ocean, deep surfaces */
  --color-abyss: #07222e;        /* deep sea base (dark sections) */
  --color-deep: #0b2c3a;         /* deeper surface */
  --color-tide: #5aa7be;         /* natural mid sea-blue (mai neon) */
  --color-foam: #f4fafb;         /* near-white text/surfaces */
  --color-mist: #9fbac6;         /* muted text on dark */
  --color-ink: #0b2731;          /* deep text for LIGHT sections */
  --color-ink-mute: #5c7884;     /* muted text on light */
  --color-celeste: #9bd3ee;      /* THE accent — light sky-blue, paired with white */
  --color-celeste-soft: #c7e6f4;
  --color-sun: #9bd3ee;          /* back-compat alias -> celeste (GOLD RIMOSSO) */

  /* Bright Mediterranean surface (hero) */
  --color-sky: #8fc1e2;
  --color-shallow: #2f93ab;
  --color-limestone: #e3dac6;
  --color-rule: rgb(244 250 251 / 0.14);
  --color-rule-ink: rgb(11 39 49 / 0.14);

  /* Type */
  --font-display: var(--font-fraunces), ui-serif, Georgia, serif;
  --font-sans: var(--font-hanken), ui-sans-serif, system-ui, sans-serif;
}
```

Regole d'uso:

- Usare SOLO i token sopra (e quelli aggiuntivi in `docs/02-DESIGN.md`). Niente hex hardcoded nelle classi/JSX: usare `text-foam`, `bg-abyss`, `border-rule`, `text-celeste`, ecc.
- **Niente "electric cyan"**: l'accento e `--color-celeste` (#9bd3ee, sky-blue tenue) abbinato al bianco. Le aliases legacy `--color-aqua`/`--color-aqua-hot` risolvono a toni naturali, non a neon. `--color-sun` e un alias di `--color-celeste`: **il gold e stato rimosso** dalla direzione artistica (`--color-gold` sopravvive solo come back-compat morto — non usarlo).
- I colori dell'acqua dell'hero NON sono CSS: vivono come uniform/costanti negli shader WGSL di `src/webgl/waterball/render/` (Screen-Space-Fluid: depth/thickness/fluid + reflect/refract da cubemap). NON esiste piu `src/webgl/gpgpu` ne le costanti `COL_COLD`/`COL_HOT`. Per la palette acqua vedi `docs/04-3D-HERO-WATER-LOGO.md` (valori live-tuned via leva, soggetti a sign-off GATE-6).
- Font esposti come `--font-display` / `--font-sans` in `@theme` (vedi sezione 5).
- Dark-first: lo sfondo base e `--color-abyss`; `color-scheme: dark` su `:root`.
- `cn()` helper (clsx + tailwind-merge) in `src/lib/utils.ts` per comporre classi condizionali.

Classi tipografiche definite in `globals.css` (con clamp inline): `.display-hero`, `.heading-1`, `.heading-2`, `.lead`, `.label`, `.eyebrow` (alias legacy di `.label`). I bottoni usano **variants CVA** (`signal/outline/ghost/link`) nel componente Button, NON classi `.btn-*`.

---

## 5. Tipografia via next/font/google

Font caricati con **`next/font/google`** direttamente in `src/app/layout.tsx` (NON esiste `src/app/fonts.ts`, NON ci sono font locali in `src/app/fonts/`). Default BLOCCATO:

- **Display / serif (reading)**: `Fraunces` — heading grandi e corpo editoriale, con corsivo. Esposto come `--font-fraunces` → `--font-display`/`--font-serif`.
- **Sans (label/eyebrow)**: `Hanken Grotesk` — small-caps label, micro-copy. Esposto come `--font-hanken` → `--font-sans`/`--font-mono`.

> NON c'e una famiglia mono dedicata: `--font-mono` risolve a Hanken. NON usare `Editorial New`, `Switzer` o `JetBrains Mono` — sono direttive storiche superate.

Pattern reale (in `layout.tsx`):

```ts
import { Fraunces, Hanken_Grotesk } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});
```

Le `variable` si applicano su `<html>` (`className={\`${fraunces.variable} ${hanken.variable}\`}`) e si agganciano in `@theme` (`--font-display: var(--font-fraunces)`, `--font-sans: var(--font-hanken)`).

---

## 6. Struttura cartelle top-level e gestione asset

Layout `src/` top-level (la mappa di dettaglio, gli store e la sync Lenis↔frame loop sono in `docs/03-ARCHITECTURE.md` — NON duplicarla qui):

```text
src/
  app/          # App Router: layout.tsx (font + provider), page.tsx, globals.css
  components/   # language-provider, scroll-provider, site-nav, site-footer,
                # liquid-text, video-backdrop (canvas 2D cinematica), sections/, ui/
  webgl/        # CanvasHost (host non-R3F), waterball/ (hero raw WebGPU), store/
                #   waterball/mls-mpm/   -> solver MLS-MPM (*.wgsl.ts + mls-mpm.ts)
                #   waterball/render/    -> Screen-Space-Fluid (*.wgsl.ts + fluidRender.ts)
                #   waterball/camera.ts, common.ts, WaterBallHero.tsx
  lib/          # utils (cn), lenis-singleton
  data/         # translations (en/it + types), projects, skills
```

> **Codice morto nell'albero `webgl/`**: `FrameDriver.tsx`, `SceneErrorBoundary.tsx`, `renderer/` e gli store `pointerStore`/`fxStore`/`heroDragStore` esistono ma NON sono importati da nulla di montato. Store effettivamente usati: `scrollStore` e `heroStore` (`explode`/`reveal`/`video`). Trattarli come cleanup di BACKLOG, non come architettura attiva.

Asset statici in `public/` (serviti as-is, accessibili da URL root):

```text
public/
  models/       # a-mark.glb, a-liquid.glb  (NON caricati a runtime: la "A" e procedurale)
  frames/       # f_000.webp .. f_135.webp  (sequenza cinematica, 136 frame, drawn su canvas 2D)
  cubemap/      # env cubemap per reflect/refract dell'hero Screen-Space-Fluid
  video/        # mp4 Higgsfield sorgente (hf_20260624_*.mp4) — SOURCE-ONLY, untracked
  images/       # immagini di contenuto
```

Regole asset (VINCOLANTI):

- **Niente `import` di asset binari** (GLB, webp pesanti, mp4) nel codice. Referenziarli per path pubblico (es. la sequenza `\`/frames/f_${n}.webp\``), cosi i binari restano fuori dal bundle JS e si possono lazy-load/streamare.
- La cinematica e una **sequenza di 136 WebP** (`public/frames/f_000..f_135.webp`) disegnata su un canvas 2D in `video-backdrop.tsx`, indicizzata da `heroStore.video` (preload concorrenza 6, DPR clamp 1.5). NON c'e un VideoPlane WebGL ne una `<video>` scrubbata. Gli mp4 Higgsfield in `public/video/` sono la SORGENTE da cui i frame sono estratti, e NON sono tracciati in git. Dettaglio in `docs/05-CINEMATIC-SCROLL.md`.
- I GLB in `public/models/` sono asset di riferimento/storici: l'hero NON li carica a runtime. Pipeline e razionale in `docs/04-3D-HERO-WATER-LOGO.md`.
- Immagini di contenuto/OG: passare per `next/image` (ottimizzatore Vercel, formati avif/webp, vedi sezione 7).
- SVG inline come componenti React quando serve animarli/colorarli con token; SVG statici decorativi in `public/`.

---

## 7. Budget di performance (OBBLIGATORIO)

Target e regole di degrado. Ogni PR che tocca hero WebGPU, cinematica o effetti DEVE essere verificata contro questi numeri (QA visivo via claude-in-chrome, vedi `docs/11-WORKFLOW.md`).

- **60fps** su desktop recente con l'hero MLS-MPM attivo. Se non regge, scalare PRIMA il conteggio particelle / risoluzione della griglia del solver, poi i passaggi Screen-Space-Fluid (bilateral/gaussian/thickness).
- **Lighthouse Performance ≥ 80 su mobile** (throttling default). Misurare prima del deploy di milestone.
- **WebGPU-ONLY per l'hero**: `WaterBallHero` ha un guard `navigator.gpu` e, in assenza di WebGPU, ritorna `null`. NON esiste un path di fallback WebGL2: il fallback visivo e il **gradiente CSS "sea"** montato da `CanvasHost`. Su browser senza WebGPU (o `prefers-reduced-motion`) l'utente vede il gradiente + la cinematica frame-sequence, mai l'errore.
- **`prefers-reduced-motion: reduce`**: niente sim fluida aggressiva; la cinematica **freeza un frame a meta sequenza (~0.5)** invece di scrubbare; le transizioni CSS sono azzerate (vedi media query in `globals.css`).
- **Idle when off-screen**: l'hero usa un `IntersectionObserver` per sospendere il proprio RAF loop quando non e in viewport.
- **Un solo frame loop per dominio**: Lenis e guidato da `gsap.ticker` (`scroll-provider.tsx`), un'unica sorgente per lo scroll. L'hero WebGPU ha il proprio RAF interno (idle-gated) — accettabile perche indipendente e sospeso fuori viewport. Mai due RAF concorrenti per la STESSA responsabilita.
- **Degrado mobile**: ridurre risoluzione/particelle dell'hero, DPR del canvas cinematica gia clampato a 1.5.
- **Bundle**: `leva` tree-shaken/escluso in prod; i moduli WebGPU dell'hero in chunk client lazy; niente lib pesanti nel bundle iniziale della pagina.
- **Immagini**: ottimizzatore Next/Vercel con `formats: ["image/avif", "image/webp"]`, `qualities: [75, 90]`, `minimumCacheTTL` annuale (vedi snippet sezione 9).

Checklist perf per ogni feature hero/cinematica:

- [ ] Misurato fps reale con l'hero montato (claude-in-chrome console / stats).
- [ ] Verificato comportamento con `prefers-reduced-motion: reduce` (frame freeze).
- [ ] Verificato il fallback gradiente CSS su browser senza WebGPU.
- [ ] Lighthouse mobile ≥ 80.
- [ ] RAF dell'hero sospeso fuori viewport (IntersectionObserver).
- [ ] Asset (frames/cubemap) lazy, non nel bundle iniziale.

---

## 8. Accessibilita (baseline AA)

L'hero WebGPU e la cinematica sono decorativi: il sito DEVE essere comprensibile e navigabile senza di essi. Regole minime (audit con skill `accessibility-compliance-accessibility-audit`, `wcag-audit-patterns`, `screen-reader-testing` — vedi `docs/10-SKILLS.md`):

- **Hero/cinematica decorativi `aria-hidden="true"`** e fuori dal tab order. Il loro contenuto informativo (nome, ruolo, tagline) esiste anche come testo reale nel DOM, leggibile da screen reader.
- **Contenuto leggibile**: ogni sezione ha heading semantici (`<h1>`..`<h2>`..), testo selezionabile, landmark (`<main>`, `<nav>`, `<footer>`).
- **Navigazione da tastiera**: tutti i CTA/link sono `<a>`/`<button>` reali, focusabili in ordine logico.
- **Focus states** visibili e a contrasto sufficiente (`:focus-visible` con outline celeste in `globals.css`; mai `outline: none` senza sostituto).
- **Contrasto AA**: testo `--color-foam` su `--color-abyss`/`--color-deep` rispetta WCAG AA; `--color-mist` solo per testo secondario di taglia adeguata.
- **Reduced motion**: vedi sezione 7; la cinematica freeza, le animazioni CSS sono azzerate.
- **Toggle lingua EN/IT** raggiungibile da tastiera; `lang` impostato sull'elemento radice da `app/layout.tsx` (cookie-based, provider `language-provider.tsx`, hook `useLanguage` — vedi `docs/03-ARCHITECTURE.md`).
- **Media**: gli mp4 sorgente non sono serviti all'utente; la cinematica e una sequenza di immagini muta.

---

## 9. Deploy: Vercel + next.config

Deploy su **Vercel** (via Vercel MCP, vedi `docs/09-MCP.md`). Preview deploy a OGNI milestone; il QA visivo (claude-in-chrome) gira sulla preview URL prima del merge. Production deploy solo dopo gate verde (vedi `docs/11-WORKFLOW.md`).

`next.config.ts` consigliata (punto di partenza; allinearsi alle ultime opzioni Next 16 via Context7):

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
    minimumCacheTTL: 31536000, // 1 anno
  },
};

export default nextConfig;
```

Note deploy:

- `bun run build` deve passare pulito (zero errori TS) prima del deploy. Il type-check standalone e `bun run typecheck`. (Lint come gate e BACKLOG: ESLint non e ancora installato.)
- Eliminare lo `package-lock.json` spurio prima di committare: il lockfile canonico e `bun.lock` (vedi sezione 2).
- Variabili d'ambiente: configurare su Vercel; quelle client devono avere prefisso `NEXT_PUBLIC_`.
- Se il form contatti richiede backend, usare Supabase SOLO se davvero necessario (vedi `docs/09-MCP.md`); altrimenti niente backend. La validazione Zod degli input (e l'eventuale `env.ts`) sono backlog legato a questo.
- Headers di sicurezza/cache: definibili in `next.config` o `vercel.json` se servono; non sovra-ingegnerizzare per un portfolio statico.

---

## 10. TypeScript strict

- **`tsconfig.json`**: `"strict": true` (non negoziabile) e `@/*` → `src/*` come path alias. Gate di tipi: `bun run typecheck` (`tsc --noEmit`).
- **openQuestion**: i flag extra storicamente citati (`noUncheckedIndexedAccess`, `noImplicitOverride`, `forceConsistentCasingInFileNames`) NON sono attualmente impostati nel `tsconfig.json`. Aggiungerli e un miglioramento desiderabile ma da confermare con Alberto prima di abilitarli (potrebbero richiedere fix diffusi). Non documentarli come "in essere".
- Niente `any` non giustificato; per i tipi WebGPU usare `@webgpu/types` (gia in devDependencies) o `unknown` + narrowing.
- **ESLint / Prettier**: NON installati al momento (vedi sezione 1). Quando verranno introdotti come backlog: config `next/core-web-vitals` + `next/typescript` per ESLint, `eslint-config-prettier` per evitare conflitti. Finche non ci sono, non esistono script `lint`/`format`.

---

## 11. Cross-reference (path dal MANIFEST)

- Visione/UX/sitemap: `docs/00-PRD.md`
- Art direction, palette Cinematic Ocean completa, tipografia, motion: `docs/02-DESIGN.md`
- Cartelle di dettaglio, CanvasHost non-R3F, sync Lenis↔gsap.ticker, store, i18n, routing: `docs/03-ARCHITECTURE.md`
- Hero acqua MLS-MPM WebGPU + Screen-Space-Fluid, riempimento procedurale "A", tuning, fallback: `docs/04-3D-HERO-WATER-LOGO.md`
- Cinematica frame-sequence (136 WebP), scroll-scrub sticky, fallback reduced-motion: `docs/05-CINEMATIC-SCROLL.md`
- Riferimenti di qualita (Lusion, Codrops, matsuoka-601/Splash): `docs/06-REFERENCES.md`
- Bio + schede progetto: `docs/07-PROJECTS.md`
- Context7 (setup + regola operativa): `docs/08-CONTEXT7.md`
- Routing MCP/connettori per task: `docs/09-MCP.md`
- Routing skill installate per task: `docs/10-SKILLS.md`
- Workflow agenti, gates, loop QA visivo, commit: `docs/11-WORKFLOW.md`
- Fisica delle particelle / solver fluido: `docs/12-PARTICLE-PHYSICS.md`
- Master entry / regole d'oro / indice: `CLAUDE.md`
