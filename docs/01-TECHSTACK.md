# 01 — TECH STACK

> Scopo: definire lo stack tecnico VINCOLANTE del portfolio di Alberto Tuveri, le convenzioni di codice (server/client, Tailwind v4 CSS-first, TypeScript strict), la struttura delle cartelle top-level, la gestione degli asset, i budget di performance e accessibilita, e la configurazione di deploy su Vercel. Questo file e legge come legge: gli agenti AI lo seguono alla lettera. La prosa e in italiano; codice, identificatori, token e copy del sito sono in inglese.

---

## 0. Regola d'oro: Context7 PRIMA di scrivere codice di libreria

Prima di scrivere o modificare codice che usa una qualsiasi libreria elencata qui sotto, l'agente DEVE recuperare la documentazione version-specific via **Context7 MCP** (vedi `docs/08-CONTEXT7.md`). Le API di `three` (TSL/WebGPU), `@react-three/fiber` 9, GSAP 3 + `@gsap/react`, Lenis 1.3, Tailwind v4 e Next.js 16 cambiano spesso e le risposte a memoria sono frequentemente sbagliate. Flusso obbligatorio:

1. `resolve-library-id` per ottenere l'ID Context7 (es. `/pmndrs/react-three-fiber`).
2. `get-library-docs` con il topic specifico (es. "useGSAP ScrollTrigger", "WebGPURenderer TSL compute").
3. Solo dopo, scrivere il codice.

Se Context7 non e ancora configurato, fermarsi e seguire il setup in `docs/08-CONTEXT7.md`. Fallback skill quando Context7 e giu: vedi tabella in `docs/10-SKILLS.md` (es. `threejs-skills`, `nextjs-app-router-patterns`, `context7-auto-research`).

---

## 1. Tabella libreria → versione (VINCOLANTE)

Partire ESATTAMENTE da queste versioni. Verificare le ultime patch via Context7/npm allo scaffold, ma NON cambiare major senza approvazione di Alberto (annotare in `openQuestions`). Le versioni con `.x` significano "ultima patch/minor di quella riga".

| Area | Pacchetto | Versione | Note |
|---|---|---|---|
| Framework | `next` | **16** | App Router, Turbopack di default |
| UI runtime | `react`, `react-dom` | **19** | Server Components di default |
| Linguaggio | `typescript` | **5.x** | `strict: true` obbligatorio |
| Package manager | `bun` | **1.x** | unico PM; niente npm/pnpm/yarn |
| Styling | `tailwindcss` | **4.x** | config CSS-first in `globals.css` |
| Styling (build) | `@tailwindcss/postcss` | **4.x** | plugin PostCSS Tailwind v4 |
| 3D core | `three` | **0.184.0** | `WebGPURenderer` + TSL, fallback WebGL2 |
| 3D React | `@react-three/fiber` | **9.6.x** | renderer R3F per React 19 |
| 3D helpers | `@react-three/drei` | **10.7.x** | loaders, helpers, controls |
| 3D postproc | `@react-three/postprocessing` | **3.0.x** | wrapper R3F per postprocessing |
| Postproc core | `postprocessing` | **6.39.x** | Bloom, DOF/Bokeh, effetti HDR |
| Animazione | `gsap` | **3.15.x** | timeline + ScrollTrigger |
| Animazione React | `@gsap/react` | **2.1.2** | `useGSAP` hook |
| Smooth scroll | `lenis` | **1.3.x** | scroll virtualizzato, sync con loop R3F |
| Stato | `zustand` | **5.0.x** | store globali (vedi `docs/03-ARCHITECTURE.md`) |
| Validazione | `zod` | **4.x** | schema env + form contatti |
| UI primitives | `@radix-ui/react-*` | latest | dialog (nav mobile), accordion, tabs, tooltip |
| Debug | `leva` | **0.10.1** | tree-shaken/escluso in prod |
| Icone | `lucide-react` | latest | icon set unico |

Tooling 3D / asset pipeline (dev dependencies, non a runtime nel bundle): `@gltf-transform/cli` (Draco/Meshopt + KTX2/Basis), `gltfjsx` (genera componenti R3F tipizzati dai GLB). Vedi sezione 6 e `docs/04-3D-HERO-WATER-LOGO.md`.

Tooling qualita (dev): `eslint`, `prettier`, `vitest`, `@playwright/test`. Nota: la verifica VISIVA in QA si fa con **claude-in-chrome** (screenshot/console/network), non con Playwright MCP — vedi `docs/09-MCP.md` e `docs/11-WORKFLOW.md`.

---

## 2. Package manager: bun (comandi canonici)

`bun` e l'unico package manager. Non committare `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`: solo `bun.lock`.

```bash
# install dipendenze
bun install

# dev server (Turbopack, Next 16)
bun run dev            # -> http://localhost:3000

# build di produzione
bun run build

# avvio del build di produzione (verifica locale pre-deploy)
bun run start

# lint + format
bun run lint           # eslint
bun run format         # prettier --write .

# test
bun run test           # vitest (unit)
bun run test:e2e       # playwright (smoke e2e, opzionale)

# aggiungere/rimuovere pacchetti (rispettare le versioni della tabella)
bun add three@0.184.0
bun add -d @gltf-transform/cli
```

Script `package.json` attesi (l'agente che fa lo scaffold li crea):

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

---

## 3. Convenzioni Server / Client Components

Next.js 16 App Router: **i componenti sono Server Components di default.** `"use client"` e l'eccezione, non la regola. Aggiungerlo SOLO quando il componente usa almeno uno di:

- React hooks di stato/effetto (`useState`, `useEffect`, `useReducer`, `useRef` per DOM/animazione);
- event handler del browser (`onClick`, `onScroll`, `onPointerMove`, ...);
- Browser API (`window`, `document`, `IntersectionObserver`, `matchMedia`, WebGL/WebGPU, audio);
- animazioni (GSAP, `useGSAP`, Lenis) o qualsiasi cosa di `@react-three/fiber` / `three`;
- store Zustand consumati con hook reattivi;
- librerie che richiedono il client (`leva`, `lenis`, `gsap`).

Regole pratiche:

- Tutto cio che e WebGL/WebGPU (`src/webgl/**`) e `"use client"`. Il `<Canvas>` R3F vive in un `CanvasHost` client globale (vedi `docs/03-ARCHITECTURE.md`).
- Le sezioni di contenuto statico (testo, heading, layout della long-page) restano Server Components; al loro interno si annidano isole client (split-text reveal, parallax) marcate `"use client"`.
- `app/layout.tsx` e `app/page.tsx` restano server quanto possibile; il provider dello smooth-scroll e del Canvas si montano via un wrapper client esplicito.
- I dati statici (`src/data/projects`, `src/data/translations`) si importano da Server Components quando il consumo non e interattivo; passare al client solo cio che serve.
- `import "server-only"` su moduli che NON devono finire nel bundle client (es. lettura segreti, util server-side come ottimizzazione immagini con Sharp).
- Mai mettere segreti in codice client. Le env esposte al browser hanno prefisso `NEXT_PUBLIC_`; tutto il resto resta server-side e va validato con Zod all'avvio.

Validazione env con Zod (pattern):

```ts
// src/lib/env.ts  (import "server-only" dove serve)
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

export const env = schema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
```

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

`src/app/globals.css` (estratto — la palette completa e in `docs/02-DESIGN.md`, qui i token oceano canonici):

```css
@import "tailwindcss";

@theme {
  /* surfaces (dark-first) */
  --color-abyss: #05131A;        /* page base */
  --color-deep: #0A2430;         /* surface */
  --color-surface-elev: #103240; /* elevated surface */

  /* ink / foreground */
  --color-foam: #EAF6F6;         /* primary ink */
  --color-ink-mute: #88A2A8;     /* sea grey */

  /* hairline */
  --color-rule: rgba(234, 246, 246, 0.10);

  /* accent (cold -> hot) */
  --color-aqua: #1FC8C8;         /* accent signal */
  --color-aqua-hot: #7DF9FF;     /* foam cyan */
  --color-abyss-glow: #0E5A6B;   /* deep accent */
  --color-gold: #FFC27A;         /* golden hour, usare con estrema parsimonia */
}
```

Regole d'uso:

- Usare SOLO i token sopra (e quelli aggiuntivi definiti in `docs/02-DESIGN.md`). Niente hex hardcoded nelle classi/JSX: usare `text-foam`, `bg-abyss`, `border-rule`, `text-aqua`, ecc.
- I colori delle PARTICELLE acqua NON sono CSS: vivono come costanti GLSL/TSL in `src/webgl/gpgpu/gpgpuConfig` — `COL_COLD = [0.06, 0.30, 0.34]` (teal scuro, a riposo), `COL_HOT = [0.75, 0.98, 1.0]` (ciano-bianco, in moto). Vedi `docs/04-3D-HERO-WATER-LOGO.md`.
- Font caricati via `next/font` (vedi sezione 5) ed esposti come `--font-display`, `--font-body`, `--font-mono` in `@theme`.
- Dark-first: lo sfondo base e `--color-abyss`; non implementare un toggle light a meno che `docs/02-DESIGN.md` non lo richieda.
- `cn()` helper (clsx + tailwind-merge) in `src/lib/utils` per comporre classi condizionali.

---

## 5. Tipografia via next/font

Font (Fontshare/locali) caricati con `next/font` per evitare layout shift e richieste esterne in runtime. Default BLOCCATO:

- **Display**: `Editorial New` (serif premium con corsivo) — heading grandi.
- **Body**: `Switzer` (grotesque moderno) — testo corrente.
- **Mono**: `JetBrains Mono` — eyebrow/label uppercase, numeri tabellari, micro-copy tecnico.

Pattern (font locali in `src/app/fonts/`, esposti come CSS variables):

```ts
// src/app/fonts.ts
import localFont from "next/font/local";

export const display = localFont({
  src: "./fonts/EditorialNew-Variable.woff2",
  variable: "--font-display",
  display: "swap",
});
export const body = localFont({
  src: "./fonts/Switzer-Variable.woff2",
  variable: "--font-body",
  display: "swap",
});
```

`JetBrains Mono` puo arrivare da `next/font/google`. Le `variable` si applicano su `<html>` in `app/layout.tsx` e si agganciano in `@theme` (`--font-display: var(--font-display)` ecc.). Alternative display (Cormorant/Gambetta) sono solo PROPOSTE in `docs/02-DESIGN.md`: il default resta `Editorial New`.

---

## 6. Struttura cartelle top-level e gestione asset

Layout `src/` top-level (la mappa di dettaglio, gli store e la sync Lenis↔R3F sono in `docs/03-ARCHITECTURE.md` — NON duplicarla qui):

```text
src/
  app/          # App Router: layout.tsx, page.tsx, globals.css, metadata,
                # sitemap.ts, robots.ts, opengraph-image, fonts.ts
  components/   # sezioni (S1..S6), ui/ (primitives), fx/ (effetti DOM)
  webgl/        # CanvasHost, FrameDriver, PostFX, HeroLogo, scene, gpgpu/,
                # materials/, geometry/, curves/, store/, renderer/
  lib/          # utils (cn), lenis-singleton, site, env
  data/         # translations (en/it), projects
```

Asset statici in `public/` (serviti as-is, accessibili da URL root):

```text
public/
  models/       # at-mark.glb  (logo AT/A ottimizzato — Draco/Meshopt + KTX2)
  video/        # clip cinematiche (Pan di Zucchero, backflip Higgsfield)
  fonts/        # solo se NON gestiti da next/font
  og/           # immagini OpenGraph/poster generati
```

Regole asset (VINCOLANTI):

- **Niente `import` di asset binari** (GLB, mp4, texture pesanti) nel codice. Referenziarli per path pubblico: `useGLTF("/models/at-mark.glb")`, `<video src="/video/clip-a-approach.mp4">` (naming canonico in `docs/05-CINEMATIC-SCROLL.md`). Questo tiene fuori i binari dal bundle JS e permette lazy-load/streaming.
- GLB del logo: deve stare in `public/models/at-mark.glb`, gia ottimizzato con `gltf-transform` (Draco o Meshopt per le mesh, KTX2/Basis per le texture). Pipeline completa in `docs/04-3D-HERO-WATER-LOGO.md`.
- Video: encode AV1/H.264 + poster statico; il file vive in `public/video/`. Scrub-by-scroll e fallback in `docs/05-CINEMATIC-SCROLL.md`.
- Immagini di contenuto/OG: passare per `next/image` (ottimizzatore Vercel, formati avif/webp, vedi sezione 7).
- SVG inline come componenti React quando serve animarli/colorarli con token; SVG statici decorativi in `public/`.

---

## 7. Budget di performance (OBBLIGATORIO)

Target e regole di degrado. Ogni PR che tocca scena 3D, video o postprocessing DEVE essere verificata contro questi numeri (QA visivo via claude-in-chrome, vedi `docs/11-WORKFLOW.md`).

- **60fps** su desktop recente con la scena hero attiva. Se non regge, scalare PRIMA la densita della pelle (skin) GPGPU, poi il postprocessing, infine il corpo (body).
- **Lighthouse Performance ≥ 80 su mobile** (throttling default). Misurare prima del deploy di milestone.
- **Tier GPU per il particellare** (dettaglio in `docs/04-3D-HERO-WATER-LOGO.md`):
  - `full`: ~256² o 448² punti per strato.
  - `lite`: ~128² / 224² punti per strato.
  - `off`: nessuna sim montata (mobile debole, batteria, `prefers-reduced-motion`).
- **`prefers-reduced-motion: reduce`**: niente sim GPGPU, niente scroll-scrub aggressivo; mostrare fallback statico (billboard analitico alle posizioni `home`, vedi doc 3D) e disabilitare parallax/curtain non essenziali. Lenis puo restare ma con animazioni ridotte.
- **Lazy-load**: scene 3D e video NON nel critical path. Caricare la scena hero quando il Canvas e in viewport / dopo il preloader; caricare le clip cinematiche on-demand quando la sezione S3 si avvicina (IntersectionObserver / progress Lenis). Usare `dynamic(() => import(...), { ssr: false })` per i moduli WebGL.
- **Un solo `requestAnimationFrame`**: Lenis guida un unico loop sincronizzato con R3F. Mai due RAF concorrenti (vedi `docs/03-ARCHITECTURE.md`).
- **Degrado mobile**: ridurre risoluzione DPR del Canvas (clamp `dpr` 1–1.5), ridurre/eliminare DOF e Bloom selettivo, ridurre densita particelle al tier `lite`/`off`.
- **Bundle**: `leva` tree-shaken/escluso in prod; `three`/postprocessing solo nei chunk client lazy; niente librerie 3D nel bundle iniziale della pagina.
- **Immagini**: ottimizzatore Next/Vercel con `formats: ["image/avif", "image/webp"]`, `qualities: [75, 90]`, `minimumCacheTTL` annuale (vedi snippet sezione 9).

Checklist perf per ogni feature 3D/video:

- [ ] Misurato fps reale con la scena montata (claude-in-chrome console / stats).
- [ ] Verificato comportamento con `prefers-reduced-motion: reduce`.
- [ ] Verificato tier `lite` e `off` (forzati via store o emulazione).
- [ ] Lighthouse mobile ≥ 80.
- [ ] Nessun secondo RAF; Lenis e R3F sincronizzati.
- [ ] Asset 3D/video lazy, non nel bundle iniziale.

---

## 8. Accessibilita (baseline AA)

Il 3D/video e decorativo: il sito DEVE essere comprensibile e navigabile senza di esso. Regole minime (audit con skill `accessibility-compliance-accessibility-audit`, `wcag-audit-patterns`, `screen-reader-testing` — vedi `docs/10-SKILLS.md`):

- **3D e video decorativi `aria-hidden="true"`** e fuori dal tab order. Il loro contenuto informativo (nome, ruolo, tagline) esiste anche come testo reale nel DOM, leggibile da screen reader.
- **Contenuto leggibile**: ogni sezione ha heading semantici (`<h1>`..`<h2>`..), testo selezionabile, landmark (`<main>`, `<nav>`, `<footer>`).
- **Navigazione da tastiera**: tutti i CTA/link sono `<a>`/`<button>` reali, focusabili in ordine logico; nav mobile via Radix Dialog (focus trap + ESC inclusi).
- **Focus states** visibili e a contrasto sufficiente (mai `outline: none` senza sostituto).
- **Contrasto AA**: testo `--foam` su `--abyss`/`--deep` rispetta WCAG AA (verificare ogni coppia testo/sfondo; `--ink-mute` solo per testo secondario di taglia adeguata).
- **Reduced motion**: vedi sezione 7; rispettare la preferenza utente per tutte le animazioni.
- **Toggle lingua EN/IT** raggiungibile da tastiera e annunciato correttamente (`lang` aggiornato sull'elemento radice — vedi i18n in `docs/03-ARCHITECTURE.md`).
- **Media**: i video decorativi sono `muted` + senza autoplay con audio; se in futuro c'e audio (vedi `audioStore`, off di default) servono controlli accessibili.

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
  experimental: {
    // abilitare solo se necessario e dopo verifica Context7
  },
};

export default nextConfig;
```

Note deploy:

- `bun run build` deve passare pulito (zero errori TS, zero warning ESLint bloccanti) prima del deploy.
- Variabili d'ambiente: configurare su Vercel; quelle client devono avere prefisso `NEXT_PUBLIC_`. Validare con Zod (sezione 3).
- Se il form contatti richiede backend, usare Supabase SOLO se davvero necessario (vedi `docs/09-MCP.md`); altrimenti niente backend.
- Headers di sicurezza/cache: definibili in `next.config` o `vercel.json` se servono; non sovra-ingegnerizzare per un portfolio statico.

---

## 10. TypeScript strict, ESLint, Prettier

- **`tsconfig.json`**: `"strict": true` (non negoziabile), piu `noUncheckedIndexedAccess`, `noImplicitOverride`, `forceConsistentCasingInFileNames`. Niente `any` non giustificato; per i nodi/uniform GLSL/TSL usare tipi precisi o `unknown` + narrowing.
- **Path alias**: `@/*` → `src/*` (configurato in `tsconfig.json`, allineato a Next).
- **ESLint**: config `next/core-web-vitals` + `next/typescript`. Lint pulito e un gate di merge.
- **Prettier**: formattazione unica per tutto il repo; `bun run format` prima del commit. Niente conflitti di stile con ESLint (usare `eslint-config-prettier` se necessario).
- **gltfjsx** genera componenti tipizzati: non editarli a mano, rigenerarli dal GLB.

---

## 11. Cross-reference (path dal MANIFEST)

- Visione/UX/sitemap: `docs/00-PRD.md`
- Art direction, palette completa, tipografia, motion: `docs/02-DESIGN.md`
- Cartelle di dettaglio, Canvas globale + overlay, sync Lenis↔R3F, store, i18n, routing: `docs/03-ARCHITECTURE.md`
- Logo acqua GPGPU 2 strati, doppio backend, fisica, shading, tier, pipeline Blender: `docs/04-3D-HERO-WATER-LOGO.md`
- Cinematica scroll-scrub, transizione-zoom, fallback video: `docs/05-CINEMATIC-SCROLL.md`
- Riferimenti di qualita (Lusion, Codrops, Three.js Journey): `docs/06-REFERENCES.md`
- Bio + schede progetto: `docs/07-PROJECTS.md`
- Context7 (setup + regola operativa): `docs/08-CONTEXT7.md`
- Routing MCP/connettori per task: `docs/09-MCP.md`
- Routing skill installate per task: `docs/10-SKILLS.md`
- Workflow agenti, gates, loop QA visivo, commit: `docs/11-WORKFLOW.md`
- Master entry / regole d'oro / indice: `CLAUDE.md`
