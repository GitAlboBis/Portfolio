# 03 — ARCHITECTURE

Scopo: definire l'architettura tecnica del portfolio di Alberto Tuveri — struttura cartelle, Canvas R3F persistente + overlay DOM, sincronizzazione Lenis↔R3F in un unico `requestAnimationFrame`, sistema di scroll virtualizzato, store Zustand, i18n EN/IT, routing App Router e la mappa scena↔sezione. Questo file è una direttiva operativa: gli agenti AI devono seguirlo alla lettera. Per stack e versioni vedi `docs/01-TECHSTACK.md`; per i token e l'art direction vedi `docs/02-DESIGN.md`; per il logo ad acqua vedi `docs/04-3D-HERO-WATER-LOGO.md`; per la cinematica vedi `docs/05-CINEMATIC-SCROLL.md`; per la narrativa/sitemap vedi `docs/00-PRD.md`.

---

## 1. Principio architetturale fondante

Il sito è una **single-page scrollytelling** immersiva (sezioni S1→S6, vedi `docs/00-PRD.md`) con eventuali route di dettaglio `/work/[slug]`. L'architettura si regge su tre pilastri non negoziabili:

1. **Un solo Canvas WebGL/WebGPU**, persistente e globale, montato una volta nel layout. NON si crea/distrugge un Canvas per sezione. Le scene 3D si attivano/disattivano in base al progresso di scroll.
2. **Un solo loop di animazione** (`requestAnimationFrame`). Lenis NON gira il proprio rAF interno: è guidato dal `useFrame` di R3F. GSAP/ScrollTrigger NON usano il proprio ticker: sono agganciati allo stesso clock. Questo elimina il jitter da loop concorrenti.
3. **Separazione netta WebGL ↔ DOM**: il Canvas è il livello di fondo (visuale immersiva); il contenuto testuale/semantico è DOM overlay sopra il Canvas. Gli screen reader leggono il DOM; il Canvas è `aria-hidden`.

```
┌─────────────────────────────────────────────┐
│  <body>                                       │
│  ┌─────────────────────────────────────────┐ │
│  │ CanvasHost (fixed, inset-0, z-0)         │ │  ← un solo <Canvas> R3F, WebGPURenderer
│  │   FrameDriver · HeroLogo · CinematicScene │ │     persistente per tutta la sessione
│  │   BackgroundDrift · PostFX               │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ DOM overlay (relative, z-10)             │ │  ← sezioni semantiche, copy EN/IT
│  │   S1 Hero · S2 About · S3 Cinematic …    │ │     guida l'altezza scrollabile
│  └─────────────────────────────────────────┘ │
│  Preloader (fixed, z-50) · Cursor · LangToggle│
└─────────────────────────────────────────────┘
```

L'altezza scrollabile è data dal DOM overlay (sezioni reali con altezza in `vh`). Lenis virtualizza lo scroll; ScrollTrigger legge il progresso e lo normalizza; lo `scrollStore` espone `progress` 0..1 e la sezione attiva alle scene WebGL. **Le scene reagiscono allo stato, non manipolano l'altezza del DOM.**

---

## 2. Struttura cartelle completa (`src/`)

Albero canonico, adattato dal repo Sersan al dominio "acqua/oceano" di Alberto. I path sono vincolanti per i cross-reference tra agenti.

```
src/
├─ app/                          # Next.js 16 App Router
│  ├─ layout.tsx                 # root layout: <html lang> dinamico, font, Providers, CanvasHost, Preloader
│  ├─ page.tsx                   # single-page: monta le sezioni DOM in ordine S1..S6 (server component)
│  ├─ globals.css                # Tailwind v4 CSS-first (@import "tailwindcss"), design token come CSS vars
│  ├─ providers.tsx             # "use client": LanguageProvider + LenisProvider + leva (dev)
│  ├─ opengraph-image.tsx        # OG image generata (next/og) — vedi docs/00-PRD.md per il copy
│  ├─ sitemap.ts                 # sitemap (home + /work/[slug])
│  ├─ robots.ts                  # robots
│  └─ work/
│     └─ [slug]/
│        ├─ page.tsx             # dettaglio progetto (server component); generateStaticParams da src/data/projects
│        └─ opengraph-image.tsx  # OG per-progetto
│
├─ components/
│  ├─ sections/                  # una cartella per sezione della scrollytelling
│  │  ├─ HeroSection.tsx         # S1 — overlay DOM dell'hero (nome, ruolo, tagline, CTA)
│  │  ├─ AboutSection.tsx        # S2 — intro/about
│  │  ├─ CinematicSection.tsx    # S3 — markup scrub + pin (la scena vive in webgl/)
│  │  ├─ WorkSection.tsx         # S4 — griglia progetti (consuma src/data/projects)
│  │  ├─ SkillsSection.tsx       # S5 — stack raggruppato
│  │  └─ ContactSection.tsx      # S6 — contatti + footer
│  ├─ ui/                        # primitive UI (Radix wrappers): Dialog, Accordion, Tabs, Tooltip, Button
│  │  ├─ NavMobile.tsx           # Radix Dialog (drawer mobile)
│  │  ├─ MagneticButton.tsx      # CTA con magnetic hover
│  │  ├─ LanguageToggle.tsx      # switch EN/IT
│  │  └─ SplitText.tsx           # reveal split-text (GSAP)
│  └─ fx/                        # effetti DOM-side
│     ├─ Cursor.tsx              # cursore custom desktop (opzionale, off su touch/reduced-motion)
│     ├─ Preloader.tsx           # preloader con percentuale
│     └─ SectionReveal.tsx       # wrapper ScrollTrigger per reveal
│
├─ webgl/
│  ├─ CanvasHost.tsx             # "use client": il SOLO <Canvas> R3F (WebGPURenderer + fallback)
│  ├─ FrameDriver.tsx            # unico useFrame: guida Lenis, avanza GPGPU compute, aggiorna uniforms
│  ├─ scene/
│  │  ├─ HeroLogo.tsx            # S1 — logo AT/A a particelle d'acqua (vedi docs/04)
│  │  ├─ CinematicScene.tsx      # S3 — video scrub + transizione zoom (vedi docs/05)
│  │  └─ BackgroundDrift.tsx     # particellare di sfondo a bassa densità per S2/S4/S5/S6
│  ├─ post/
│  │  ├─ PostFX.tsx              # EffectComposer WebGL2 (postprocessing): Bloom + DOF/Bokeh
│  │  └─ PostFXNodes.tsx         # pipeline post WebGPU/TSL (node-based) equivalente
│  ├─ gpgpu/
│  │  ├─ gpgpuConfig.ts          # costanti fisica/colore/tier (SPRING, DAMPING, PUSH, RADIUS, COL_*…)
│  │  ├─ gpgpuSim.ts             # backend GLSL: GPUComputationRenderer FBO ping-pong
│  │  ├─ gpgpuNodeSim.ts         # backend WebGPU: compute shader + storage buffer (TSL)
│  │  └─ gpgpuRenderShader.ts    # vertex/fragment di render delle particelle (legge pos da buffer/texture)
│  ├─ materials/                 # materiali condivisi (acqua, foam, fresnel)
│  ├─ geometry/
│  │  └─ atMark.ts               # carica public/models/at-mark.glb, MeshSurfaceSampler front-biased
│  ├─ curves/
│  │  └─ curlNoise.ts            # curl noise per turbolenza/moto ondoso
│  ├─ renderer/
│  │  └─ createRenderer.ts       # createRenderer(): decide WebGPU(TSL) vs WebGL2(GLSL) — detection backend
│  └─ store/                     # Zustand stores WebGL-facing (vedi §6)
│     ├─ scrollStore.ts
│     ├─ pointerStore.ts
│     ├─ heroDragStore.ts
│     ├─ fxStore.ts
│     └─ audioStore.ts
│
├─ lib/
│  ├─ utils.ts                   # cn() (clsx + tailwind-merge), helpers
│  ├─ lenis-singleton.ts         # istanza Lenis singleton + LenisProvider
│  └─ site.ts                    # metadata del sito (url, name, social, default OG)
│
└─ data/
   ├─ projects.ts                # schede progetto tipizzate (vedi docs/07-PROJECTS.md)
   └─ translations/
      ├─ types.ts                # type Dictionary (shape canonica EN==IT)
      ├─ en.ts                   # dizionario inglese (default)
      └─ it.ts                   # dizionario italiano
```

Note di posizionamento:
- `languageStore` NON è in `webgl/store/`: l'i18n è DOM-side. Vive come provider in `lib/`/`providers.tsx` (vedi §7). Gli store in `webgl/store/` sono solo quelli letti dentro il loop R3F.
- Il GLB del logo va in `public/models/at-mark.glb`; i video cinematici in `public/video/`; i font self-hosted via `next/font`.

---

## 3. Architettura R3F: Canvas persistente + overlay DOM

`CanvasHost` è montato UNA volta in `layout.tsx`, fuori dal flusso scrollabile, in posizione fissa come livello di fondo. Non viene rimontato al cambio di route (è nel layout, non nella page).

```tsx
// src/webgl/CanvasHost.tsx
"use client";
import { Canvas } from "@react-three/fiber";
import { createRenderer } from "./renderer/createRenderer";
import { FrameDriver } from "./FrameDriver";
import { HeroLogo } from "./scene/HeroLogo";
import { CinematicScene } from "./scene/CinematicScene";
import { BackgroundDrift } from "./scene/BackgroundDrift";
import { PostFX } from "./post/PostFX";
import { useFxStore } from "./store/fxStore";

export function CanvasHost() {
  const heroRenderMode = useFxStore((s) => s.heroRenderMode); // "off" non monta la sim

  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        // R3F gestisce il proprio loop; lo guidiamo noi da FrameDriver (frameloop default = "always")
        gl={createRenderer}              // factory async: WebGPURenderer o WebGLRenderer
        dpr={[1, 2]}                      // clamp devicePixelRatio (perf budget)
        camera={{ fov: 35, position: [0, 0, 6] }}
        flat                              // tone mapping gestito in post
      >
        <FrameDriver />
        {heroRenderMode !== "off" && <HeroLogo />}
        <CinematicScene />
        <BackgroundDrift />
        <PostFX />
      </Canvas>
    </div>
  );
}
```

Regole:
- `gl={createRenderer}` riceve la factory async che istanzia `WebGPURenderer` (con `await renderer.init()`) o fa fallback a `WebGLRenderer`. R3F 9 supporta una factory che ritorna una Promise. La detection del backend è in §5.
- `aria-hidden="true"` sul wrapper: tutto il 3D è decorativo. Il contenuto leggibile è nel DOM overlay.
- Le scene restano montate ma si auto-disattivano (skip update + `visible=false`) quando fuori dal loro range di scroll (vedi §8). Smontarle/rimontarle ricreerebbe buffer GPU costosi.
- L'overlay DOM (`app/page.tsx`) sta in un container `relative z-10` che genera l'altezza scrollabile. Il Canvas `fixed inset-0` non scrolla: vede lo scroll solo tramite `scrollStore`.

---

## 4. Sincronizzazione Lenis ↔ R3F (un solo rAF)

Problema: Lenis ha un suo `requestAnimationFrame`, R3F ne ha un altro, GSAP un terzo. Tre loop = jitter e drift. Soluzione: **un solo loop**, quello di R3F. Lenis viene fatto avanzare manualmente dentro `useFrame`; ScrollTrigger viene agganciato a Lenis e il suo ticker disattivato.

`lenis-singleton.ts` crea l'istanza SENZA autoRaf:

```ts
// src/lib/lenis-singleton.ts
import Lenis from "lenis";

let lenis: Lenis | null = null;

export function getLenis(): Lenis {
  if (lenis) return lenis;
  lenis = new Lenis({
    autoRaf: false,          // CRITICO: NON avviamo il rAF interno di Lenis
    lerp: 0.1,               // smoothing; abbassare per scroll più "pesante"/acquatico
    smoothWheel: true,
    syncTouch: false,        // su touch usiamo lo scroll nativo
  });
  return lenis;
}

export function destroyLenis() {
  lenis?.destroy();
  lenis = null;
}
```

`FrameDriver` è l'UNICO `useFrame` che fa avanzare Lenis. Riceve il tempo in millisecondi (Lenis vuole ms; R3F dà secondi). Aggiorna lo `scrollStore` e fa avanzare il compute GPGPU.

```tsx
// src/webgl/FrameDriver.tsx
"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "@/lib/lenis-singleton";
import { useScrollStore } from "./store/scrollStore";

gsap.registerPlugin(ScrollTrigger);

export function FrameDriver() {
  const gl = useThree((s) => s.gl) as any; // WebGPURenderer ha .computeAsync/.compute

  useEffect(() => {
    const lenis = getLenis();
    // ScrollTrigger usa Lenis come sorgente di scroll, non il proprio rAF.
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.lagSmoothing(0);     // determinismo: niente lag-smoothing automatico
    // NON chiamiamo gsap.ticker.add(...) per il raf: lo guida R3F.
    return () => lenis.off("scroll", ScrollTrigger.update);
  }, []);

  useFrame((state, delta) => {
    const lenis = getLenis();
    lenis.raf(state.clock.elapsedTime * 1000); // ms — singolo rAF di tutta l'app

    // progress 0..1 globale + sezione attiva (vedi §5)
    useScrollStore.getState().setFromLenis(lenis);

    // avanza la simulazione GPGPU (WebGPU compute) PRIMA del render del frame
    if (typeof gl.compute === "function") {
      // i nodi compute sono registrati dalla scena attiva; qui si esegue il dispatch
      gl.compute(useScrollStore.getState().activeComputeNode);
    }
  });

  return null;
}
```

Punti chiave:
- `frameloop` di R3F resta `"always"` (default): è il nostro clock unico. NON impostare `frameloop="demand"` perché la simulazione GPGPU deve girare ogni frame.
- Lenis riceve `elapsedTime * 1000`. Non usare `performance.now()` separato: deve essere lo stesso clock del render.
- `gsap.ticker.lagSmoothing(0)` evita che GSAP comprima il delta dopo un freeze, mantenendo scrub e fisica coerenti.
- Su `prefers-reduced-motion`, Lenis viene creato con `lerp: 1` (nessuno smoothing) oppure non montato (scroll nativo); vedi §9.

---

## 5. Sistema di scroll: Lenis virtualizzato + ScrollTrigger + scrollStore

L'altezza è data dalle sezioni DOM. Lenis virtualizza lo scroll (smoothing). ScrollTrigger fa due cose: (a) aggiorna su evento `scroll` di Lenis; (b) definisce trigger per-sezione (pin della cinematica, reveal). Il `scrollStore` è il bus che traduce lo scroll in stato consumabile dalle scene WebGL.

### 5.1 scrollStore — progress globale + sezione attiva

```ts
// src/webgl/store/scrollStore.ts
import { create } from "zustand";
import type Lenis from "lenis";

export type SectionId = "hero" | "about" | "cinematic" | "work" | "skills" | "contact";

interface ScrollState {
  progress: number;            // 0..1 sull'intero documento
  velocity: number;            // px/frame normalizzata, per intensità FX
  activeSection: SectionId;
  sectionProgress: number;     // 0..1 DENTRO la sezione attiva
  activeComputeNode: unknown;  // nodo compute della scena attiva (WebGPU)
  setFromLenis: (lenis: Lenis) => void;
  setActiveComputeNode: (node: unknown) => void;
}

// Confini normalizzati delle sezioni (somma = 1). Allineare con le altezze DOM in page.tsx.
const BOUNDS: Array<[SectionId, number, number]> = [
  ["hero",      0.00, 0.16],
  ["about",     0.16, 0.30],
  ["cinematic", 0.30, 0.56],   // sezione più lunga: scrub + transizione zoom
  ["work",      0.56, 0.80],
  ["skills",    0.80, 0.92],
  ["contact",   0.92, 1.00],
];

export const useScrollStore = create<ScrollState>((set) => ({
  progress: 0,
  velocity: 0,
  activeSection: "hero",
  sectionProgress: 0,
  activeComputeNode: null,
  setActiveComputeNode: (node) => set({ activeComputeNode: node }),
  setFromLenis: (lenis) => {
    const progress = lenis.progress ?? 0;        // 0..1 documento
    const velocity = Math.min(Math.abs(lenis.velocity ?? 0) / 50, 1);
    const band = BOUNDS.find(([, a, b]) => progress >= a && progress < b) ?? BOUNDS.at(-1)!;
    const [activeSection, a, b] = band;
    const sectionProgress = (progress - a) / (b - a);
    set({ progress, velocity, activeSection, sectionProgress });
  },
}));
```

### 5.2 Come mappare `progress` → stato scena

- Ogni scena WebGL legge `useScrollStore` con un selector (subscribe granulare) e calcola la propria visibilità/parametri da `activeSection` + `sectionProgress`. Esempio: `HeroLogo` è pienamente attivo quando `activeSection === "hero"`, fa fade-out su `about`, è disattivato altrove.
- Le animazioni temporizzate (pin, scrub video, split-text) usano GSAP `ScrollTrigger` direttamente nei componenti `sections/` con `useGSAP({ scope })`. Lo `scrollStore` è la fonte continua per la fisica/uniform; ScrollTrigger è per gli eventi/keyframe.
- Regola anti-doppione: parametri **continui** (intensità bloom, dispersione particelle, posizione camera) → `scrollStore` + `useFrame`. Eventi **discreti** (entra/esce sezione, pin start/end) → ScrollTrigger.

### 5.3 Detection backend (WebGPU vs WebGL2)

```ts
// src/webgl/renderer/createRenderer.ts
import * as THREE from "three/webgpu";

export async function createRenderer(props: any) {
  const renderer = new THREE.WebGPURenderer({ ...props, antialias: true });
  await renderer.init();
  return renderer;
}

// Detection runtime (dove serve scegliere TSL vs GLSL):
export function isWebGPU(gl: any): boolean {
  // Il backend WebGPU lascia isWebGLBackend UNDEFINED (non false) e fornisce gl.compute.
  return gl?.backend?.isWebGLBackend !== true && typeof gl?.compute === "function";
}
```

Conseguenza per il GPGPU: se `isWebGPU(gl)` allora `gpgpuNodeSim.ts` (compute + storage buffer, lettura `positionBuffer.element(instanceIndex)` nel vertex stage); altrimenti `gpgpuSim.ts` (GLSL FBO ping-pong). Dettaglio completo in `docs/04-3D-HERO-WATER-LOGO.md`.

---

## 6. Store Zustand: elenco e responsabilità

Tutti gli store WebGL-facing in `src/webgl/store/`. Regola: store piccoli e mono-responsabilità; le scene si iscrivono con selector per evitare re-render. Gli aggiornamenti ad alta frequenza (pointer, scroll) si leggono via `getState()` dentro `useFrame`, NON via hook reattivo, per non triggerare React ogni frame.

| Store | Stato chiave | Responsabilità | Letto da |
|---|---|---|---|
| `scrollStore` | `progress`, `velocity`, `activeSection`, `sectionProgress` | Bus scroll→scena (§5). Unico writer: `FrameDriver`. | tutte le scene, FrameDriver |
| `pointerStore` | `x`, `y` (NDC -1..1), `nx`, `ny` (0..1), `inside` | Posizione mouse normalizzata per il push delle particelle (acc fromMouse). Throttle a frame. | HeroLogo, BackgroundDrift |
| `heroDragStore` | `dragging`, `dragX`, `dragY`, `inertia` | Interazione drag sul logo hero (spinta extra alla nuvola d'acqua). | HeroLogo |
| `fxStore` | `heroRenderMode` (`"full"\|"lite"\|"static"\|"off"`), `tier` (`"high"\|"mid"\|"low"`), `bloom`, `dof`, `reducedMotion` | Quality gating: decide densità particelle, post, se montare la sim. Settato dal preloader/capability check. | CanvasHost, HeroLogo, PostFX |
| `audioStore` | `enabled` (default `false`), `volume`, `unlocked` | Sound design onda opzionale; off di default; richiede gesture utente per l'unlock. | (futuro) audio layer |

`fxStore.heroRenderMode` e `tier` sono il cuore del degrado elegante:

```ts
// src/webgl/store/fxStore.ts (estratto)
import { create } from "zustand";

export type HeroRenderMode = "full" | "lite" | "static" | "off";
export type Tier = "high" | "mid" | "low";

interface FxState {
  tier: Tier;
  heroRenderMode: HeroRenderMode;
  bloom: boolean;
  dof: boolean;
  reducedMotion: boolean;
  setTier: (t: Tier) => void;
  setHeroRenderMode: (m: HeroRenderMode) => void;
}

export const useFxStore = create<FxState>((set) => ({
  tier: "high",
  heroRenderMode: "full",
  bloom: true,
  dof: true,
  reducedMotion: false,
  setTier: (tier) => set({ tier }),
  setHeroRenderMode: (heroRenderMode) => set({ heroRenderMode }),
}));
```

Mappatura tier → densità particellare (resolution per strato, vedi `docs/04`): `high` = full (256² o 448²), `mid` = lite (128² / 224²), `low`/reduced-motion = `static` (billboard analitico) o `off`. `languageStore` è trattato separatamente in §7 perché non è WebGL-facing.

---

## 7. i18n EN/IT

Bilingue EN/IT. Default EN. La preferenza è persistita su cookie (`lang`) per consentire la lettura server-side, con mirror su `localStorage` per il client. Le pagine restano **server component** dove possibile: il dizionario viene letto dal cookie nel server e passato giù; un `LanguageProvider` client gestisce solo il toggle runtime senza reload.

```ts
// src/data/translations/types.ts
export type Lang = "en" | "it";

export interface Dictionary {
  hero: { name: string; role: string; tagline: string; ctaWork: string; ctaContact: string };
  about: { heading: string; body: string };
  work: { heading: string; viewProject: string };
  skills: { heading: string; groups: Record<string, string> };
  contact: { heading: string; email: string; cta: string };
  nav: { work: string; about: string; contact: string };
}
```

```ts
// src/data/translations/en.ts  (default; it.ts ha la STESSA shape)
import type { Dictionary } from "./types";
export const en: Dictionary = {
  hero: {
    name: "Alberto Tuveri",
    role: "Software Engineer · Full-Stack + AI",
    tagline: "From the cliffs of Sardinia to the systems I build.",
    ctaWork: "View work",
    ctaContact: "Get in touch",
  },
  // … vedi docs/00-PRD.md e docs/07-PROJECTS.md per il copy completo
} as Dictionary;
```

```tsx
// src/app/providers.tsx (estratto) — il provider tiene SOLO lo switch runtime
"use client";
import { createContext, useContext, useState } from "react";
import type { Lang, Dictionary } from "@/data/translations/types";
import { en } from "@/data/translations/en";
import { it } from "@/data/translations/it";

const DICTS: Record<Lang, Dictionary> = { en, it };
const LangCtx = createContext<{ lang: Lang; t: Dictionary; setLang: (l: Lang) => void }>(null!);

export function LanguageProvider({ initialLang, children }: { initialLang: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const setLang = (l: Lang) => {
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    localStorage.setItem("lang", l);
    document.documentElement.lang = l;
    setLangState(l);
  };
  return <LangCtx.Provider value={{ lang, t: DICTS[lang], setLang }}>{children}</LangCtx.Provider>;
}

export const useI18n = () => useContext(LangCtx);
```

```tsx
// src/app/layout.tsx (estratto) — leggi il cookie nel server, imposta <html lang>
import { cookies } from "next/headers";
import { LanguageProvider } from "./providers";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = ((await cookies()).get("lang")?.value ?? "en") as "en" | "it";
  return (
    <html lang={lang}>
      <body>
        <LanguageProvider initialLang={lang}>{/* CanvasHost + overlay */}{children}</LanguageProvider>
      </body>
    </html>
  );
}
```

Regole i18n:
- I dizionari vivono in `src/data/translations/` con `types.ts` come contratto: `en.ts` e `it.ts` devono soddisfare lo stesso `Dictionary` (errore di compilazione se divergono).
- Tutto il COPY è in inglese di default; la versione IT è una traduzione. Le label dei token di design e i nomi tecnici restano in inglese (vedi voce in `CLAUDE.md`).
- Niente routing `/en` `/it`: una sola URL, toggle via cookie. Questo tiene la single-page semplice e l'SEO su un canonical per lingua (gestire `hreflang` in `metadata` se in futuro si separano le URL).

---

## 8. Routing (App Router)

| Route | File | Render | Note |
|---|---|---|---|
| `/` | `app/page.tsx` | Server | Single-page S1..S6. Sezioni server; isole client dove serve interattività. |
| `/work/[slug]` | `app/work/[slug]/page.tsx` | Server (SSG) | `generateStaticParams()` da `src/data/projects.ts`. Dettaglio progetto. |
| metadata | `app/layout.tsx` `export const metadata` + per-route `generateMetadata` | — | Title/description per lingua; canonical da `lib/site.ts`. |
| `sitemap.xml` | `app/sitemap.ts` | — | Home + tutti gli slug progetto. |
| `robots.txt` | `app/robots.ts` | — | Allow all; punta al sitemap. |
| OG image | `app/opengraph-image.tsx` + per-progetto | Edge/og | Generata con `next/og`; tema oceano. |

Il Canvas vive nel **layout**, quindi navigando da `/` a `/work/[slug]` il Canvas NON si rimonta: si può fare una transizione di scena (curtain + crossfade) mentre il DOM cambia. Le route di dettaglio sono opzionali (vedi `docs/00-PRD.md`): se MVP single-page, `/work/[slug]` può essere rinviato.

---

## 9. Mappa SCENA ↔ SEZIONE

Quale componente WebGL è attivo per quale range di scroll. `range` è in `progress` 0..1 (allineato a `BOUNDS` in §5.1). "Attivo" = aggiorna + visibile; "fade" = transizione; "idle" = montato ma non aggiorna (skip update, `visible=false`).

| Sezione | `progress` | HeroLogo | CinematicScene | BackgroundDrift | PostFX |
|---|---|---|---|---|---|
| S1 Hero | 0.00–0.16 | **attivo** (full sim) | idle | idle | Bloom+DOF forti |
| S2 About | 0.16–0.30 | fade-out → idle | idle | **attivo** (drift basso) | Bloom medio |
| S3 Cinematic | 0.30–0.56 | idle | **attivo** (scrub video + zoom) | idle | DOF locale, color grade |
| S4 Work | 0.56–0.80 | idle | fade-out → idle | **attivo** | Bloom basso |
| S5 Skills | 0.80–0.92 | idle | idle | **attivo** | Bloom basso |
| S6 Contact | 0.92–1.00 | idle | idle | **attivo** (drift verso il basso) | Bloom medio |

Regole di transizione:
- Le scene fanno crossfade nelle zone di confine (ultimo ~15% di una banda) per evitare pop. La logica vive nella scena, pilotata da `activeSection` + `sectionProgress`.
- `HeroLogo` quando passa a `idle` interrompe il `gl.compute` del suo nodo (lo `scrollStore.activeComputeNode` punta alla scena corrente) per non sprecare GPU.
- `BackgroundDrift` è una sim a densità molto bassa (es. 64²) sempre leggera; resta l'unica attiva nelle sezioni "di lettura".

---

## 10. Caricamento / preloader e gating (tier · route · reduced-motion)

Sequenza di boot, dal mount del layout al primo frame interattivo:

1. **Capability check** (client, in `providers.tsx` o `CanvasHost` pre-mount):
   - `WebGPU disponibile?` → `navigator.gpu` presente e `requestAdapter()` ok.
   - `prefers-reduced-motion`? → `matchMedia("(prefers-reduced-motion: reduce)")`.
   - `deviceMemory` / `hardwareConcurrency` + heuristica mobile → stima tier.
   - Risultato → `fxStore.setTier(...)` + `fxStore.setHeroRenderMode(...)`.

   ```ts
   function decideTier(): { tier: Tier; mode: HeroRenderMode } {
     const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
     if (reduced) return { tier: "low", mode: "static" };
     const mem = (navigator as any).deviceMemory ?? 8;
     const cores = navigator.hardwareConcurrency ?? 8;
     const mobile = matchMedia("(pointer: coarse)").matches;
     if (mobile || mem <= 4 || cores <= 4) return { tier: "mid", mode: "lite" };
     return { tier: "high", mode: "full" };
   }
   ```

2. **Preloader con percentuale** (`components/fx/Preloader.tsx`, `fixed z-50`): mostra il caricamento di GLB (`at-mark.glb`), font (`next/font` — display swap), e il primo poster video. La percentuale aggrega i progressi `useProgress` di drei + fetch dei poster. Si dissolve (curtain reveal) solo quando: renderer inizializzato + GLB campionato + primo frame GPGPU renderizzato.

3. **Gating runtime**:
   - `heroRenderMode === "off"` → `CanvasHost` non monta `HeroLogo` (nessuna sim).
   - `heroRenderMode === "static"` → build statico analitico (billboard alle home, dispersione nel vertex shader); nessun compute per-frame.
   - `tier` scala la densità: se 60fps non regge, **ridurre prima la densità della pelle** (skin), non del corpo (vedi `docs/04`). Un watchdog FPS opzionale può fare downgrade `high→mid→static` a runtime.
   - `reducedMotion` → Lenis con `lerp: 1` o scroll nativo, niente parallax/curl idle, niente autoplay video (mostra poster), niente cursore custom.

4. **Lazy-load pesanti**: `CinematicScene` e i suoi video sono caricati on-demand quando `activeSection` si avvicina a `cinematic` (preload del poster a `about`). Il bundle 3D è `dynamic(() => import(...), { ssr: false })` per non finire nel server bundle.

### Checklist di accettazione architettura
- [ ] Esiste **un solo** `<Canvas>` in tutta l'app, montato nel layout, mai rimontato per route/sezione.
- [ ] Esiste **un solo** `requestAnimationFrame`: Lenis con `autoRaf: false` guidato da `FrameDriver`; ScrollTrigger su evento Lenis; `gsap.ticker.lagSmoothing(0)`.
- [ ] `scrollStore` espone `progress` 0..1 e `activeSection`; le scene leggono lo stato, non manipolano l'altezza DOM.
- [ ] Detection backend: `gl.backend.isWebGLBackend !== true && typeof gl.compute === "function"` → TSL compute; altrimenti GLSL FBO.
- [ ] Store Zustand mono-responsabilità; letture ad alta frequenza via `getState()` in `useFrame`, non hook reattivi.
- [ ] i18n via cookie+`<html lang>`; `en.ts`/`it.ts` conformi allo stesso `Dictionary`; pagine server dove possibile.
- [ ] Canvas `aria-hidden`; contenuto semantico nel DOM overlay leggibile da screen reader.
- [ ] Gating tier/reduced-motion settato dal capability check prima del primo frame; degrado `full→lite→static→off`.
- [ ] Lighthouse performance ≥ 80 mobile; 60fps desktop recente (vedi budget in `docs/01-TECHSTACK.md`).
