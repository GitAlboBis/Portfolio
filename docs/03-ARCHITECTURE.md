# 03 — ARCHITECTURE

> Aggiornato 2026-06-27 per riflettere il codice (hero MLS-MPM WebGPU + cinematica frame-sequence). Riconciliato dal loop docs-driven-build.

Scopo: definire l'architettura tecnica del portfolio di Alberto Tuveri — struttura cartelle, host di rendering (CSS sea gradient + VideoBackdrop 2D + WaterBallHero WebGPU), sincronizzazione dello scroll (Lenis guidato da `gsap.ticker`), store Zustand, i18n EN/IT, routing App Router e la mappa scena↔sezione. Questo file è una direttiva operativa: gli agenti AI devono seguirlo alla lettera. Per stack e versioni vedi `docs/01-TECHSTACK.md`; per i token e l'art direction vedi `docs/02-DESIGN.md`; per l'hero ad acqua vedi `docs/04-3D-HERO-WATER-LOGO.md`; per la cinematica vedi `docs/05-CINEMATIC-SCROLL.md`; per la fisica del fluido vedi `docs/12-PARTICLE-PHYSICS.md`; per la narrativa/sitemap vedi `docs/00-PRD.md`.

> NOTA DI RICONCILIAZIONE — Questo documento descriveva un'architettura **R3F a Canvas persistente con GPGPU a 2 strati**. La realtà spedita è diversa e questo file ora la rispecchia:
> - L'hero NON è R3F. È un embed **raw WebGPU** di `matsuoka-601/WaterBall` (solver MLS-MPM su griglia, render Screen-Space-Fluid), vendored sotto `src/webgl/waterball/`, con il proprio canvas, il proprio RAF e teardown manuale. Marchio = lettera **"A"** (non "AT/A").
> - NON esiste un `<Canvas>` R3F montato. `CanvasHost` monta un **CSS sea gradient** + **VideoBackdrop** (canvas 2D, frame-sequence WebP) + **WaterBallHero** (WebGPU).
> - Lo scroll è guidato da `ScrollProvider` via `gsap.ticker` (Lenis), NON da `FrameDriver`/`useFrame`.
> - Diversi moduli pensati per il vecchio piano (`FrameDriver.tsx`, `renderer/createRenderer.ts`, `SceneErrorBoundary.tsx`, `store/pointerStore.ts`, `store/heroDragStore.ts`, `store/fxStore.ts`) sono **orfani**: presenti nel repo ma non importati dall'albero attivo. Sono marcati come **"orphaned, decisione pendente"** — non vanno cancellati da questo doc, solo segnalati.

---

## 1. Principio architetturale fondante

Il sito è una **single-page scrollytelling** immersiva (sezioni S1→S5, vedi `docs/00-PRD.md`). L'architettura si regge su tre pilastri:

1. **Livelli di fondo fissi, montati una volta nel layout.** `CanvasHost` (in `layout.tsx`) monta tre livelli `fixed inset-0`: il CSS sea gradient (fallback ultimo), il VideoBackdrop (canvas 2D), e WaterBallHero (canvas WebGPU). Non si crea/distrugge un host per sezione.
2. **Loop separati, ma una sola sorgente di scroll.** A differenza del piano originale (un unico `requestAnimationFrame` R3F), la realtà spedita ha più RAF indipendenti — quello di WaterBallHero e quello di VideoBackdrop — ciascuno con il proprio `IntersectionObserver` che lo mette in idle quando l'hero esce dallo schermo. **La sincronizzazione condivisa riguarda solo lo scroll**: Lenis è guidato da `gsap.ticker` (un solo clock per smooth-scroll + tutti i `ScrollTrigger`); l'hero legge lo stato pubblicato (`heroStore`) una volta per frame via `getState()`, senza re-render React.
3. **Separazione netta visuale ↔ DOM**: i canvas (gradient, video, acqua) sono il livello di fondo (`fixed`, `aria-hidden`, `pointer-events:none`); il contenuto testuale/semantico è DOM overlay sopra. Gli screen reader leggono il DOM; i canvas sono decorativi.

```
┌─────────────────────────────────────────────┐
│  <body>                                       │
│  ┌─────────────────────────────────────────┐ │
│  │ CanvasHost (montato in layout.tsx)       │ │  ← NESSUN <Canvas> R3F
│  │   #sea-backdrop  (div CSS gradient, -z-10)│ │     livelli fixed inset-0
│  │   VideoBackdrop  (canvas 2D, z-0)        │ │     RAF + IntersectionObserver propri
│  │   WaterBallHero  (canvas WebGPU, z-0)    │ │     (montato solo se !reduced-motion)
│  └─────────────────────────────────────────┘ │
│  ScrollProvider (null render; guida Lenis)    │  ← gsap.ticker -> lenis.raf
│  SiteNav (fixed, z alto)                      │
│  ┌─────────────────────────────────────────┐ │
│  │ DOM overlay = <main> (page.tsx)          │ │  ← sezioni semantiche, copy EN/IT
│  │   Hero (#hero, 600vh sticky) · Intro ·   │ │     guida l'altezza scrollabile
│  │   Work · Skills · Contact                │ │
│  └─────────────────────────────────────────┘ │
│  SiteFooter                                   │
└─────────────────────────────────────────────┘
```

L'altezza scrollabile è data dal DOM overlay (sezioni reali con altezza in `vh`; l'hero è una sezione `h-[600vh]` con un blocco `sticky`). Lenis virtualizza lo scroll; il timeline GSAP scrubato dell'hero pubblica `heroStore.{explode,reveal,video}`; `scrollStore` espone `progress` 0..1 e `velocity` per la nav. **I livelli di fondo reagiscono allo stato, non manipolano l'altezza del DOM.**

---

## 2. Struttura cartelle completa (`src/`)

Albero canonico **come spedito**. I path sono vincolanti per i cross-reference tra agenti. I moduli marcati `[ORPHAN]` esistono nel repo ma non sono importati dall'albero attivo (vedi nota di riconciliazione e §6).

```
src/
├─ app/                          # Next.js 16 App Router
│  ├─ layout.tsx                 # root layout async: legge cookie lang -> <html lang>, font
│  │                             #   (Fraunces + Hanken Grotesk via next/font/google),
│  │                             #   monta LanguageProvider > CanvasHost + ScrollProvider +
│  │                             #   SiteNav + {children} + SiteFooter. export const metadata.
│  ├─ page.tsx                   # single-page (server component): <main> con Hero + un wrapper
│  │                             #   z-10 bg-abyss che contiene Intro, Work, Skills, Contact.
│  └─ globals.css                # Tailwind v4 CSS-first (@theme), design token --color-* (docs/02)
│
├─ components/
│  ├─ sections/                  # una cartella per sezione della scrollytelling
│  │  ├─ hero.tsx                # S1 — sezione #hero h-[600vh] sticky; timeline GSAP scrubato
│  │  │                          #   che scrive heroStore (explode/reveal/video). Contiene LiquidText.
│  │  ├─ intro.tsx               # S2 — intro/about
│  │  ├─ work.tsx                # S3 — griglia progetti (consuma src/data/projects.ts) [export WorkSection]
│  │  ├─ skills.tsx              # S4 — stack raggruppato (src/data/skills.ts) [export SkillsSection]
│  │  └─ contact.tsx            # S5 — contatti [export Contact]
│  ├─ ui/                        # primitive UI
│  │  ├─ button.tsx              # Button = CVA variants (signal/outline/ghost/link)
│  │  ├─ container.tsx           # wrapper di larghezza/padding
│  │  ├─ eyebrow.tsx             # micro-label sopra i titoli
│  │  ├─ reveal.tsx              # wrapper reveal (scroll-in)
│  │  └─ section-heading.tsx     # heading di sezione
│  ├─ language-provider.tsx      # "use client": context i18n EN/IT + cookie; hook useLanguage (§7)
│  ├─ scroll-provider.tsx        # "use client": guida Lenis via gsap.ticker; pubblica scrollStore (§4)
│  ├─ liquid-text.tsx            # "use client": titolo liquido (Portfolio + Alberto Tuveri); legge heroStore.reveal
│  ├─ video-backdrop.tsx         # "use client": canvas 2D, frame-sequence WebP indicizzata da heroStore.video (§3)
│  ├─ site-nav.tsx               # nav fissa
│  └─ site-footer.tsx            # footer
│
├─ webgl/
│  ├─ CanvasHost.tsx             # "use client": monta #sea-backdrop (CSS) + VideoBackdrop + WaterBallHero (§3)
│  ├─ waterball/                 # embed raw-WebGPU di matsuoka-601/WaterBall (NO R3F) — vedi docs/04
│  │  ├─ WaterBallHero.tsx       # client component: canvas WebGPU, init async abortabile, RAF + teardown,
│  │  │                          #   IntersectionObserver idle, leva "splash"/"camera", legge heroStore.explode
│  │  ├─ camera.ts               # camera orbit/zoom (orbit+zoom OFF: la pagina deve scrollare)
│  │  ├─ common.ts               # uniforms/views condivisi, numParticlesMax
│  │  ├─ mls-mpm/                # solver MLS-MPM su griglia (compute WGSL)
│  │  │  ├─ mls-mpm.ts           # MLSMPMSimulator: reset/initFromHomes (riempie la "A" da 3 capsule), execute
│  │  │  ├─ clearGrid.wgsl.ts    # compute: azzera la griglia
│  │  │  ├─ spawnParticles.wgsl.ts
│  │  │  ├─ p2g_1.wgsl.ts        # particle->grid (massa/momento)
│  │  │  ├─ p2g_2.wgsl.ts        # particle->grid (stress)
│  │  │  ├─ updateGrid.wgsl.ts   # integrazione griglia + boundary
│  │  │  ├─ g2p.wgsl.ts          # grid->particle + ENGINE "A": inflate/gravity/restore/
│  │  │  │                       #   speedGate/leashRadius (modifica la VELOCITÀ sull'asse mediale della "A")
│  │  │  └─ copyPosition.wgsl.ts # copia posizioni per il render
│  │  └─ render/                 # Screen-Space-Fluid: sphere->depth->bilateral->thickness->gaussian->fluid
│  │     ├─ fluidRender.ts       # FluidRenderer: orchestrazione della catena SSF
│  │     ├─ sphere.wgsl.ts       # particelle come sfere
│  │     ├─ depthMap.wgsl.ts     # depth pass
│  │     ├─ bilateral.wgsl.ts    # bilateral blur del depth
│  │     ├─ thicknessMap.wgsl.ts # spessore (Beer-Lambert)
│  │     ├─ gaussian.wgsl.ts     # blur dello spessore
│  │     ├─ fullScreen.wgsl.ts   # vertex fullscreen
│  │     └─ fluid.wgsl.ts        # composizione finale: cubemap reflect/refract, alpha PREMULTIPLICATO
│  │                             #   (la "A" si compone SOPRA il VideoBackdrop)
│  ├─ FrameDriver.tsx            # [ORPHAN] useFrame R3F (guida Lenis + pointer). Non importato. Decisione pendente.
│  ├─ SceneErrorBoundary.tsx     # [ORPHAN] error boundary per subtree 3D R3F. Non importato. Decisione pendente.
│  ├─ renderer/
│  │  └─ createRenderer.ts       # [ORPHAN] factory WebGPURenderer R3F + detection backend/tier. Non importato.
│  └─ store/                     # Zustand stores (vedi §6)
│     ├─ scrollStore.ts          # ATTIVO — progress/velocity/activeSection (scritto da ScrollProvider)
│     ├─ heroStore.ts            # ATTIVO — explode/reveal/video (bus timeline hero -> WaterBallHero/VideoBackdrop/LiquidText)
│     ├─ pointerStore.ts         # [ORPHAN] pointer NDC/world per il vecchio GPGPU R3F. Non importato.
│     ├─ heroDragStore.ts        # [ORPHAN] hover/drag sul marchio. Non importato.
│     └─ fxStore.ts              # [ORPHAN] tier/heroRenderMode/webgpu del vecchio piano. Non importato.
│
├─ webgpu-types.d.ts             # tipi WebGPU
│
├─ lib/
│  ├─ utils.ts                   # cn() (clsx + tailwind-merge), helpers
│  └─ lenis-singleton.ts         # ATTIVO — istanza Lenis singleton (autoRaf:false); getLenis/destroyLenis
│
└─ data/
   ├─ projects.ts                # schede progetto tipizzate (plain TS, NO zod) — vedi docs/07-PROJECTS.md
   ├─ skills.ts                  # skillGroups: 6 gruppi (incl. "Testing & Tooling")
   └─ translations/
      ├─ types.ts                # type Dictionary nested per-section (shape canonica EN==IT)
      ├─ en.ts                   # dizionario inglese (default)
      └─ it.ts                   # dizionario italiano
```

Note di posizionamento:
- L'i18n è DOM-side: vive in `src/components/language-provider.tsx` (NON in `webgl/store/`), vedi §7.
- Gli asset GLB del marchio sono in `public/models/a-mark.glb` e `public/models/a-liquid.glb`. **OPEN QUESTION**: nessuno dei due è caricato a runtime — la "A" è riempita proceduralmente da `initFromHomes()` (3 strokes a capsula) in `mls-mpm.ts`. I GLB restano nel repo come asset sorgente; chiarire con Alberto se vanno rimossi o se serviranno per una pipeline futura.
- Asset cinematica: la frame-sequence è in `public/frames/f_000..f_135.webp` (136 frame). Gli mp4 grezzi Higgsfield in `public/video/hf_20260624_*.mp4` sono **SORGENTE-ONLY** (untracked) — da cui la sequence è stata decodificata. Il cubemap del cielo è in `public/cubemap/{posx,negx,posy,negy,posz,negz}.png`.
- I moduli NON costruiti rispetto al piano originale: `app/providers.tsx`, `app/opengraph-image.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/work/[slug]/`, `lib/site.ts`, e lo `audioStore`. Vedi §8 e §10.

---

## 3. Host di rendering: CSS gradient + VideoBackdrop + WaterBallHero

`CanvasHost` è montato UNA volta in `layout.tsx`, fuori dal flusso scrollabile. Non c'è alcun `<Canvas>` R3F. Monta tre livelli (codice fedele in `src/webgl/CanvasHost.tsx`):

```tsx
// src/webgl/CanvasHost.tsx (struttura reale)
export function CanvasHost() {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    // reduced-motion: non montare MAI la simulazione WebGPU
    setAnimate(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return (
    <>
      {/* 1. Fallback ultimo: nessun canvas, solo un gradient mare CSS */}
      <div id="sea-backdrop" aria-hidden className="fixed inset-0 -z-10" style={{ background: SEA_GRADIENT }} />
      {/* 2. Footage Pan di Zucchero come SFONDO dell'hero (canvas 2D) */}
      <VideoBackdrop />
      {/* 3. Acqua "A" WebGPU SOPRA il footage (solo se !reduced-motion) */}
      {animate && <WaterBallHero />}
    </>
  );
}
```

Regole:
- **NESSUN R3F.** WaterBallHero apre il proprio `GPUDevice`/`GPUCanvasContext`, configura `alphaMode: "premultiplied"` (così la "A" si compone sopra il VideoBackdrop), istanzia `MLSMPMSimulator` + `FluidRenderer`, e gira un RAF proprio con teardown completo (`device.destroy()`) on unmount. Init async abortabile (StrictMode-safe).
- **WebGPU-ONLY.** All'avvio WaterBallHero controlla `navigator.gpu` e `requestAdapter()`; se assente → `setUnsupported(true)` → ritorna `null`. **Non c'è un path WebGL2 di fallback** per l'acqua: il fallback è il CSS sea gradient (`#sea-backdrop`) che resta sempre dietro.
- `VideoBackdrop` (`src/components/video-backdrop.tsx`) è un canvas 2D `fixed inset-0`: precarica 136 still WebP (concorrenza 6, DPR clamp 1.5), e per frame disegna lo still indicizzato da `heroStore.video` (cover-fit). Su `prefers-reduced-motion` congela un frame mid-sequence (`prog = 0.5`). Ha un `IntersectionObserver` su `#hero`: fuori vista, il loop fa skip del draw.
- Tutti i livelli sono `aria-hidden` + `pointer-events:none`. Il contenuto leggibile è nel DOM overlay (`app/page.tsx`), in un container `relative z-10 bg-abyss`.
- **Idle off-screen**: sia WaterBallHero sia VideoBackdrop osservano `#hero` con `IntersectionObserver` e mettono in idle il proprio RAF quando l'hero non è visibile, per non sprecare GPU/CPU nelle sezioni di lettura.

---

## 4. Sincronizzazione dello scroll: Lenis guidato da `gsap.ticker`

Diversamente dal piano R3F (un solo `useFrame` che avanzava Lenis), la realtà spedita usa la ricetta canonica **Lenis + GSAP senza R3F**: Lenis è creato con `autoRaf: false` e fatto avanzare dal ticker di GSAP, così smooth-scroll e ogni `ScrollTrigger` condividono UN solo rAF.

`lenis-singleton.ts` crea l'istanza senza autoRaf (codice reale):

```ts
// src/lib/lenis-singleton.ts
let instance: Lenis | null = null;
export function getLenis(): Lenis | null {
  if (typeof window === "undefined") return null;
  if (!instance) {
    instance = new Lenis({ autoRaf: false, lerp: 0.1, smoothWheel: true });
  }
  return instance;
}
export function destroyLenis() { instance?.destroy(); instance = null; }
```

`ScrollProvider` (`src/components/scroll-provider.tsx`, render `null`) è il modulo che rianima e guida Lenis. Su `prefers-reduced-motion` salta Lenis del tutto e lascia che lo scroll nativo guidi `ScrollTrigger` (pagina pienamente navigabile).

```ts
// src/components/scroll-provider.tsx (struttura reale)
gsap.registerPlugin(ScrollTrigger);
if (reduce) return;                         // reduced-motion: scroll nativo
const lenis = getLenis();
lenis.on("scroll", () => {                  // tieni i trigger in sync + pubblica lo store
  ScrollTrigger.update();
  useScrollStore.getState().set({ progress: lenis.progress ?? 0, velocity: lenis.velocity ?? 0 });
});
gsap.ticker.add((time) => lenis.raf(time * 1000)); // UN solo clock (s -> ms)
gsap.ticker.lagSmoothing(0);                // niente clamp del delta al refocus del tab
// ScrollTrigger.refresh() dopo ~300ms + su 'load' (font/sticky assestati)
```

Punti chiave:
- **Un solo clock di scroll**: `gsap.ticker` avanza `lenis.raf(time*1000)`. Non esistono rAF concorrenti per lo scroll.
- `gsap.ticker.lagSmoothing(0)` evita che GSAP comprima il delta dopo un freeze, mantenendo scrub e fisica del timeline coerenti.
- `ScrollTrigger.refresh()` è chiamato dopo che il layout (font, sezioni sticky) si è assestato, così gli start/end dei beat sono misurati corretti.
- I RAF dell'hero (WaterBallHero, VideoBackdrop) **non** passano da qui: sono loop indipendenti che leggono `heroStore` via `getState()`. La sincronia tra timeline e hero è data dallo store, non da un clock condiviso.

---

## 5. Sistema di scroll dell'hero: timeline scrubato + heroStore

L'hero (`src/components/sections/hero.tsx`) è una sezione `#hero h-[600vh]` con un blocco interno `sticky top-0 h-screen`. Un singolo timeline GSAP **scrubato** (`scrub: 1`, `trigger: #hero`, `start: top top`, `end: bottom bottom`) pilota tutta la sequenza scrivendo `heroStore`. Tre lettori indipendenti consumano lo store: WaterBallHero (`explode`), VideoBackdrop (`video`), LiquidText (`reveal`).

### 5.1 heroStore — bus timeline → lettori

```ts
// src/webgl/store/heroStore.ts (shape reale)
type HeroState = {
  explode: number;  // 0..1 — WaterBallHero rileva il rising edge e fa partire il burst one-shot, poi fade del canvas
  reveal: number;   // 0..1 — LiquidText: una "waterline" ondulata scopre prima "Portfolio", poi "Alberto Tuveri"
  video: number;    // 0..1 — progress grezzo dello scroll hero; indicizza la frame-sequence del VideoBackdrop
  set: (p: Partial<Pick<HeroState, "explode" | "reveal" | "video">>) => void;
};
```

Beat (ordine di scroll, vedi commento in `hero.tsx`):

| Beat | ~range scroll hero | Effetto |
|---|---|---|
| entry | 0% | "A" d'acqua sul primo frame del footage (focus-pull on mount in WaterBallHero) |
| explode | ~8–24% | la "A" esplode sul footage e il canvas svanisce (burst one-shot ~1s, non scrubato) |
| cinematic | ~24–56% | il footage scrubba da solo (`heroStore.video` = progress grezzo) |
| reveal | ~56–86% | "Portfolio" poi "Alberto Tuveri" emergono dall'acqua; lo scrim si scurisce per leggibilità |
| hold | ~86–100% | la title card tiene prima che l'hero si unpinni |

`heroStore.video` = `self.progress` dell'intero scrub (in `onUpdate`), così il footage non si ferma mai durante l'hero.

### 5.2 scrollStore — progress globale + sezione attiva (per la nav)

`scrollStore` è scritto da `ScrollProvider` ad ogni evento `scroll` di Lenis. Serve alla nav e a eventuali consumatori futuri; **non** è il bus dell'hero (quello è `heroStore`).

```ts
// src/webgl/store/scrollStore.ts (shape reale)
export type SectionId = "hero" | "intro" | "cinematic" | "work" | "skills" | "contact";

// Confini normalizzati 0..1 per sezione. PROVVISORI: da tarare sulle altezze DOM reali.
export const SECTION_BOUNDS: Record<SectionId, [number, number]> = {
  hero:      [0.0,  0.16],
  intro:     [0.16, 0.30],
  cinematic: [0.30, 0.56],
  work:      [0.56, 0.80],
  skills:    [0.80, 0.90],
  contact:   [0.90, 1.00],
};

type ScrollState = {
  progress: number;            // 0..1 sull'intero documento
  velocity: number;
  activeSection: SectionId;    // derivata da progress via SECTION_BOUNDS
  set: (p: { progress: number; velocity?: number }) => void;
};
```

> OPEN QUESTION (BOUNDS): i confini `SECTION_BOUNDS` sono dichiarati PROVVISORI nel codice e vanno tarati sulle altezze DOM reali. Nota che `SectionId` include ancora `"cinematic"` come banda separata, ma nella realtà spedita la cinematica è **fusa nell'hero** (frame-sequence dentro `#hero`): non esiste una sezione DOM `cinematic` indipendente. Allineare `SECTION_BOUNDS` alle 5 sezioni reali (Hero/Intro/Work/Skills/Contact) è una decisione pendente — da confermare con Alberto in GATE perf/a11y.

### 5.3 Backend WebGPU

Niente detection R3F nell'albero attivo. WaterBallHero fa la propria guardia inline: se `!navigator.gpu` o `requestAdapter()` fallisce → render `null` e resta il CSS sea gradient. La logica di `createRenderer.ts`/`isWebGPUBackend()` apparteneva al path R3F ed è ora **orfana** (§6). Dettaglio del solver e del render SSF in `docs/04-3D-HERO-WATER-LOGO.md`; fisica del fluido in `docs/12-PARTICLE-PHYSICS.md`.

---

## 6. Store Zustand: elenco e responsabilità (stato reale)

Regola: store piccoli e mono-responsabilità; i lettori ad alta frequenza (RAF dell'hero) leggono via `getState()`, NON via hook reattivo, per non triggerare React ogni frame.

| Store | Stato (shape reale) | Responsabilità | Stato |
|---|---|---|---|
| `heroStore` | `explode`, `reveal`, `video` (tutti 0..1), `set()` | Bus tra il timeline GSAP dell'hero (writer, `hero.tsx`) e i lettori RAF (WaterBallHero, VideoBackdrop, LiquidText). | **ATTIVO** |
| `scrollStore` | `progress`, `velocity`, `activeSection`, `set()` | Progress globale + sezione attiva, scritto da `ScrollProvider`. Per la nav / consumatori futuri. | **ATTIVO** |
| `pointerStore` | `active`, `ndc`/`smooth` (Vector2), `world`/`worldPrev`/`worldVel` (Vector3), `speed`, `setActive()` | Pointer NDC/world per il push particelle del vecchio GPGPU R3F (mutato da `FrameDriver`). | **[ORPHAN]** — non importato; decisione pendente |
| `heroDragStore` | `hovering`, `setHovering()` | Hover/drag sul marchio per gating della repulsione GPGPU. | **[ORPHAN]** — non importato; decisione pendente |
| `fxStore` | `tier` (`"full"\|"lite"\|"off"`), `heroRenderMode` (`"liquid-mesh"\|"particles-2layer"\|"static"`), `reducedMotion`, `webgpu`, `set()` | Quality gating del vecchio piano (densità/postFX/tecnica hero). | **[ORPHAN]** — non importato; decisione pendente |

Note:
- Gli `[ORPHAN]` riflettono iterazioni precedenti dell'hero (GPGPU 2 strati R3F, poi liquid-mesh TSL). Non sono cablati nell'albero attivo. **Non cancellarli da questo doc**: vanno rimossi dal codice solo dopo sign-off di Alberto (potrebbero servire se l'hero verrà riportato su R3F).
- `audioStore` (sound design onda) del piano originale **non è mai stato costruito**.
- Il tuning live del fluido NON passa da uno store: WaterBallHero usa pannelli **leva** (`splash`, `camera`) letti via ref. I valori sono **live-tuned via leva, soggetti a sign-off GATE-6** — non trattarli come finali (vedi `docs/04` e `docs/12`).

---

## 7. i18n EN/IT

Bilingue EN/IT. Default EN. La preferenza è persistita su **cookie** (`lang`) per la lettura server-side; il layout server legge il cookie e imposta `<html lang>` + passa `initialLang` al provider. Il provider client gestisce solo il toggle runtime (riscrive il cookie, aggiorna `document.documentElement.lang`, niente reload). **Non c'è mirror su `localStorage`** (solo cookie) e **non c'è routing `/en` `/it`** (una sola URL).

Il provider reale è `src/components/language-provider.tsx` (NON `app/providers.tsx`, che non esiste), l'hook è `useLanguage`:

```tsx
// src/components/language-provider.tsx (struttura reale)
const DICTS: Record<Lang, Dictionary> = { en, it };
export function LanguageProvider({ initialLang = "en", children }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.cookie = `lang=${l};path=/;max-age=31536000;samesite=lax`;
    document.documentElement.lang = l;
  }, []);
  return <LanguageContext.Provider value={{ lang, t: DICTS[lang], setLang }}>{children}</LanguageContext.Provider>;
}
export function useLanguage() { /* throws if used outside provider */ }
```

```tsx
// src/app/layout.tsx (estratto reale) — cookie nel server -> <html lang> + initialLang
const lang = ((await cookies()).get("lang")?.value as Lang) ?? "en";
return (
  <html lang={lang} className={`${fraunces.variable} ${hanken.variable}`}>
    <body>
      <LanguageProvider initialLang={lang}>
        <CanvasHost /> <ScrollProvider /> <SiteNav /> {children} <SiteFooter />
      </LanguageProvider>
    </body>
  </html>
);
```

Il dizionario è **nested per-section** (non flat). Il contratto è in `src/data/translations/types.ts`:

```ts
// src/data/translations/types.ts (shape reale, estratto)
export type Dictionary = {
  meta: { eyebrow: string };
  nav: { work: string; about: string; skills: string; contact: string; cta: string };
  hero: { role: string; tagline: string; scrollCue: string };
  intro: { eyebrow: string; heading: string; body1: string; body2: string };
  cinematic: { eyebrow: string; caption: string };
  work: { eyebrow: string; heading: string; lead: string; wip: string; roleLabel: string; stackLabel: string };
  skills: { eyebrow: string; heading: string };
  contact: { eyebrow: string; heading: string; lead: string; emailCta: string; availability: string };
  footer: { tagline: string; builtWith: string; location: string; rights: string };
  gauge: { surface: string; seabed: string };
};
```

Regole i18n:
- `en.ts` e `it.ts` devono soddisfare lo stesso `Dictionary` (errore di compilazione se divergono).
- I componenti leggono `t.<section>.<key>` via `useLanguage()`. Il contenuto progetto/skill vive in `src/data/projects.ts` e `src/data/skills.ts` come campi `{ en, it }` (`Localized`), non nel `Dictionary`.
- Tutto il COPY è in inglese di default; la versione IT è una traduzione. Label dei token di design e nomi tecnici restano in inglese (vedi `CLAUDE.md`).

---

## 8. Routing (App Router) — stato reale

| Route | File | Render | Stato |
|---|---|---|---|
| `/` | `app/page.tsx` | Server | **Costruito.** Single-page: `<main>` con Hero + Intro/Work/Skills/Contact. |
| metadata | `app/layout.tsx` `export const metadata` | — | **Costruito.** Title template, description, openGraph base (statici, in inglese). |
| `/work/[slug]` | `app/work/[slug]/page.tsx` | Server (SSG) | **NON costruito.** Pianificato per il dettaglio progetto (`generateStaticParams` da `projects.ts`). Decisione pendente (MVP single-page). |
| `sitemap.xml` | `app/sitemap.ts` | — | **NON costruito.** GATE perf/a11y/SEO. |
| `robots.txt` | `app/robots.ts` | — | **NON costruito.** GATE perf/a11y/SEO. |
| OG image | `app/opengraph-image.tsx` | — | **NON costruito.** GATE perf/a11y/SEO (al momento solo `openGraph` testuale in `metadata`). |

> NOTA: `metadataBase` e i metadati statici sono in `layout.tsx`. Non esiste `lib/site.ts` (il piano lo prevedeva per i metadati centralizzati): è **NON costruito** — i valori sono inline nel layout. Quando arriverà il GATE SEO, valutare se centralizzare in `lib/site.ts` e aggiungere `sitemap`/`robots`/`opengraph-image`.

---

## 9. Mappa SCENA ↔ SEZIONE (stato reale)

L'unico livello "scena" attivo è l'**hero** (acqua WebGPU + footage). Le altre sezioni sono DOM puro su `bg-abyss`; non c'è un sistema multi-scena WebGL per sezione (era il piano R3F, non spedito).

| Sezione | Range scroll | Livello attivo | Note |
|---|---|---|---|
| S1 Hero (`#hero`, 600vh sticky) | 0% → fine hero | WaterBallHero (acqua "A") + VideoBackdrop (footage) | Pilotati da `heroStore`; idle off-screen via IntersectionObserver |
| S2 Intro | dopo l'hero | DOM (`bg-abyss`) | nessun WebGL |
| S3 Work | — | DOM | griglia progetti |
| S4 Skills | — | DOM | stack raggruppato |
| S5 Contact | — | DOM | contatti |

Regole:
- Quando `#hero` esce dal viewport, sia WaterBallHero sia VideoBackdrop mettono in idle il proprio RAF (skip compute + draw). Nessuna GPU sprecata nelle sezioni di lettura.
- La cinematica (footage Pan di Zucchero) **non** è una sezione separata: è la frame-sequence dentro l'hero, indicizzata da `heroStore.video`. Vedi `docs/05-CINEMATIC-SCROLL.md`.

---

## 10. Caricamento / reduced-motion / degrado

Sequenza di boot e degrado, come spedito:

1. **Reduced-motion (capability gate principale)**:
   - `CanvasHost` non monta affatto `WaterBallHero` se `prefers-reduced-motion: reduce` (`animate = false`).
   - `VideoBackdrop` congela un frame mid-sequence (`prog = 0.5`) invece di scrubare.
   - `ScrollProvider` salta Lenis e lascia lo scroll nativo.
   - Il timeline dell'hero (`hero.tsx`) imposta uno stato finale statico (`explode:1, reveal:1, video:0.5`) e nasconde il cue di scroll.

2. **WebGPU assente**: WaterBallHero ritorna `null` (guardia `navigator.gpu` + `requestAdapter`). Resta il CSS sea gradient (`#sea-backdrop`) + il VideoBackdrop. **Nessun path WebGL2** per l'acqua.

3. **Idle off-screen**: `IntersectionObserver` su `#hero` per entrambi i loop RAF dell'hero.

4. **Preload frame-sequence**: VideoBackdrop precarica i 136 WebP con concorrenza 6 e DPR clamp 1.5 (no decode simultaneo di tutti gli still).

5. **Font**: Fraunces + Hanken Grotesk via `next/font/google` con `display: "swap"`.

> NON costruiti rispetto al piano originale: il **Preloader con percentuale** (`components/fx/Preloader.tsx`), il **capability check tier** (`fxStore`/`detectTier` sono orfani), il watchdog FPS, e il gating `full→lite→static→off`. La realtà spedita ha un degrado più semplice: reduced-motion → niente acqua; WebGPU assente → niente acqua. Una strategia tier più ricca è una decisione pendente per il GATE perf/a11y.

### Checklist di accettazione architettura (stato reale)
- [ ] `CanvasHost` monta i tre livelli fissi (CSS gradient + VideoBackdrop + WaterBallHero) una sola volta nel layout; **nessun `<Canvas>` R3F**.
- [ ] WaterBallHero apre/chiude il proprio `GPUDevice` con teardown completo; init async abortabile (StrictMode-safe).
- [ ] Lenis con `autoRaf:false` guidato da `gsap.ticker` in `ScrollProvider`; `ScrollTrigger.update` su evento Lenis; `gsap.ticker.lagSmoothing(0)`.
- [ ] `heroStore` (explode/reveal/video) è il bus hero; `scrollStore` (progress/activeSection) alimenta la nav; letture RAF via `getState()`, non hook reattivi.
- [ ] reduced-motion: WaterBallHero NON montato; VideoBackdrop congela frame 0.5; scroll nativo; titolo in stato finale.
- [ ] WebGPU assente → WaterBallHero ritorna `null`; resta il CSS sea gradient (nessun WebGL2 per l'acqua).
- [ ] i18n via cookie + `<html lang>`; provider = `components/language-provider.tsx`, hook `useLanguage`; `en.ts`/`it.ts` conformi a `Dictionary` nested.
- [ ] Canvas/livelli `aria-hidden` + `pointer-events:none`; contenuto semantico nel DOM overlay leggibile da screen reader.
- [ ] Idle off-screen via IntersectionObserver su `#hero` per entrambi i loop dell'hero.
- [ ] Moduli `[ORPHAN]` (`FrameDriver`, `createRenderer`, `SceneErrorBoundary`, `pointerStore`/`heroDragStore`/`fxStore`) flaggati come decisione pendente, non cablati.
- [ ] Lighthouse performance ≥ 80 mobile; 60fps desktop recente (vedi budget in `docs/01-TECHSTACK.md`).
