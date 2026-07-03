# CODEDROPSPLAN — demo Codrops da implementare (Golden Hour)

> Piano vivo per aggiungere **qualità** al portfolio prendendo spunto dai demo di
> **Codrops** (`https://tympanus.net/codrops/hub/all/codrops/` + ricerca `?s=<kw>&type=web_demo`).
> Ogni voce ha il **repo GitHub** (il pulsante `<>` del demo) da cui **studiare e copiare il
> meccanismo**. Companion: `CLAUDE.md` §6 (metodo di estrazione), `IDEAS.md`, `PLAN.md`.

## Metodo (vincolante — §6 di CLAUDE.md)
- **Studia il meccanismo dal repo `<>`, NON importare 1:1.** Riscrivi sul nostro stack:
  **GSAP 3.15 + Lenis 1.3** (un solo ticker, `Smooth.tsx`) **+ three 0.184 / R3F** dove serve.
- **Niente nuove dipendenze pesanti** (no ScrollSmoother — usiamo Lenis; no PixiJS). Valida le
  API versionate con **Context7** prima di scrivere.
- **Ri-tematizza Golden Hour:** tema **mare → acqua → tramonto**; colori dai token
  (ember/amber/coral/rose/dusk, `paper`/`ink`); **scritte grandi e definite** (Bricolage);
  motion che **frena come la marea** (`--ease-tide`); **niente glitch/terminal** (scelta di Alberto).
- **Preferisci effetti SENZA immagini** finché non esistono le still reali (`Work.textureSrc`).
- Ogni effetto = **un componente self-contained** (come `TideReveal`), **reduced-motion + a11y**,
  animare `transform`/`opacity`, **prova visiva** (desktop+mobile+console) + `build` verde, su
  **feature branch**, merge dopo ok visivo di Alberto (G3).

---

## ✅ Fatto
| Effetto | Repo `<>` | Dove | Note |
|---|---|---|---|
| **TideReveal** (mask reveal → **marea**) | `Hiro-kiii/Scroll-Transition` (On-Scroll SVG Mask Transitions) | Tech heading "La corrente in cui lavoro" | Meccanismo mask+ScrollTrigger ri-tematizzato: la scritta affiora da una linea d'acqua morbida (niente linea visibile), `scrub:1.5`. Shipped su `main`. |
| **DualWaveText** (headline **entra a onda**) | `ValentinDBS/codrops-tutorial-text-animation` (Scroll-Driven Dual-Wave Text) | h1 di `/about` (`journey.title` — "la costa del Sulcis": semantica motivata) | ⚠ REFRAME dallo studio del repo: il demo originale NON è un'entrance — è 2 colonne speculari di ~48 righe che cavalcano una sinusoide scroll-driven (fase = `waveNumber·i + waveSpeed·progress·2π`, smoothing `quickTo`) + thumbnail centrale image-driven (bloccata dalle still). Portato il MECCANISMO su un'entrance one-shot per-char SplitText: somma di **due sinusoidi contro-vaganti** (il "dual" = swell + risacca) con inviluppo che decade + fronte di reveal. Gated su `ui.loaded` (il wipe del Preloader scopre riga vuota, niente playback coperto), failsafe senza trigger, reduced-motion → statico. Sostituisce WordGenerate sull'h1 (riduce il reveal più ripetuto). Branch `feat/dual-wave-text` — in attesa di ok visivo (G3). La variante fedele a doppia colonna resta possibile come pattern di sezione quando arrivano le still (`Work.textureSrc`). |
| **ShallowWater** (increspatura d'acqua **ambientale**) | `codepen.io/ksenia-k/pen/RwXVMMY` (Lightweight Water Distortion, MIT — mirror `tysev44/kentrosneep`) | Intro di `/about`, `/work` (dissolve dove parte la runway orizzontale) e `/work/[slug]` (dissolve prima delle metriche) — le route senza WebGL; home/styleguide restano senza per scelta (una scena per regione di scroll) | Porting **procedurale senza immagini**: lo swell simplex del pen disloca il campo sin/cos ruotato (10 layer, LOW=6) esattamente come `surface_noise_uv = 2uv + outer·.2`, ma il campo dipinge caustiche golden-hour sulla carta invece di distorcere una texture; battigia ondulata che dissolve in carta asciutta; risposta locale al pointer (fine only). Intensificato su richiesta di Alberto (shading ≤.55, campo più denso, waterline più bassa — sempre nei cap AA). Convenzioni NightSky (rAF geometry-gated, DPR≤1.5, dispose, failsafe bg-paper, reduced-motion → frame statico). Review avversariale (11 agenti): 3 fix confermati — repaint-on-resize (buffer discard = nero opaco su alpha:false, fatale senza loop), fase grana wrappata (uTime·60 unbounded collassa fract fp32 in strisce), luce caustica schiarita verso paper (ember-ink ≥4.5:1 AA) — + back-port dei primi due a NightSky. **MERGED su main @ 829611c** (mandato auto-merge di Alberto 2026-07-03). |
| **TideSurge** (headline che **risale come la marea**, scrubbata) | `codrops/OnScrollTypographyAnimations` — **FX2** (Set 1) | h2 del Contact sulla home ("Let's make something that moves." — la riga di chiusura) | Il meccanismo FX2 (char da sotto, stirati verticalmente, che si assestano: yPercent 120→0 + scaleY ~2→1 da origine top, back-ease, **scrub**) riscritto su GSAP SplitText, welded allo scroll (scrub 1.2, reversibile). Sostituisce il FlipText once-on-enter sulla chiusura. Review avversariale: finestre **clamp()-wrapped** (Contact chiude il documento: un end non clampato sta oltre maxScroll sui viewport alti — 1920×1080 congelava le ultime lettere a metà surge per sempre; verificato e riprodotto), niente will-change (uno scrub non "completa" mai → avrebbe tenuto 28 layer compositor per l'intera sessione), rimosso `autoSplit` inerte (hook solo per type "lines" — anche da DualWaveText). Gate con pass 1920×1080 + 1600×1200 (settle-check per-char). **MERGED su main @ bcfd557.** BONUS della review: root-cause del bug hydration reduced-motion (store risolve matchMedia a module-load → branch a render-time mismatcha) → fixato per WorksGallery/WorkHorizontal (`useHydrated`) e DrawLine (dash seedato nell'effect) @ 2cc0858. |

---

## P0 — prossimi, on-theme + senza immagini (alto valore, basso rischio)

### ~~2. On-Scroll Typography Animations — variante "big type" scrubbata~~ ✅ → TideSurge (vedi Fatto)

### ~~3. Lightweight Water Distortion — increspatura d'acqua ambientale~~ ✅ → ShallowWater (vedi Fatto)

---

## P1 — buoni, con dipendenze o da confermare

### 4. Grid Layout Transitions con GSAP **Flip**
- **Repo:** `Ibaliqbal/grid-layout-transition` · **transition/layout**. Introduce **Flip** (tecnica non
  ancora usata). Utile per un morph elegante (es. griglia skill/chips del Tech). *Serve contenuto a griglia.*

### 5. Sticky Grid Scroll / scroll-stacking di sezione
- **Fonte:** hub Codrops (card "Sticky Grid Scroll", ha `<>`). Ristruttura il ritmo di scroll di una sezione
  (sticky + recede). = **IDEAS #7** → **confirm feel** prima (cambia il ritmo della home).

### 6. On-Scroll Text Motion (satto-style)
- **Repo:** `codrops/ScrollTextMotion` · **text**. Kinetic type editoriale. Rischio saturazione testo → un
  solo punto, solo se distinto dai reveal attuali.

### 7. Async / Kinetic Page Transitions (exit-cover)
- **Repo:** `codrops/KineticTypePageTransition` (kinetic type) + card "Async Page Transitions" (hub).
- **Nota:** abbiamo già la **sunset-curtain** route transition; qui solo per l'**exit-cover** (IDEAS #3,
  rischio medio: intercetta ogni `Link`) o per studiare il kinetic-type. Non duplicare la tenda.

---

## P2 — cinematic / sperimentale (rischio o invasività)

### 8. Telescope Zoom on Scroll
- **Repo:** `joffreysp/telescope-zoom` · **scroll/cinematic**. Momento di zoom cinematografico.
- **Rischio:** usa **ScrollSmoother** (va riscritto su Lenis) + immagini + **invasivo** sullo scroll
  funzionante. Parcheggiato: valuta come momento self-contained, non nel flusso home esistente.

### 9. Infinite Parallax Scroll (GSAP + Lenis) / Cinematic 3D Scroll
- **Repo:** `joebentaylor1995/infinite-scroll-with-parallax` (stack identico) · `JosephASG/codrops-cinematic-scroll-animations` (R3F).
- **Nota:** l'infinite non calza ovvio in un portfolio; il cinematic-3D è pesante/ridondante con hero+gallery.

---

## 🔒 Bloccati su **still reali** (`Work.textureSrc`) — riprendere quando arrivano le immagini
Tutti gli effetti image-driven, ottimi ma inutili senza foto dei progetti:
- **3D Image Rotations on Scroll** — `codrops/RotatingOnScrollAnimations`
- **Thumbnail Flow (GSAP MotionPath)** — `Ibaliqbal/codrops-motion-path-transition`
- **On-Scroll Horizontal Parallax Gallery** — `davidfaure/horizontal-parallax-gallery-codrops`
- **Wave Motion Effect on an Image** — `marioecg/codrops-wave-motion` *(onda su immagine — molto on-theme)*
- **Skeleton Fluid / X-Ray Reveal (hover)** — hub (`<>`) — reveal fluido su immagine (bellissimo con stills)
- **Smooth WebGL Transitions on Scroll (Phenomenon)** — `vaneenige/scroll-transitions-webgl`
- **3D Image Tube / Pixel Image / Dithering** — hub — trattamenti d'immagine

---

## ❌ Scartati (fuori mood)
- **Terminal-like Typography hover** (`codrops/LineTextHoverAnimations`), **Shuffling/Repetitive Typography**
  — glitch/scramble: Alberto non li vuole (mood scritte grandi/definite, non "hacker").
- **False Earth · WebGL Snake · Pixel Voxel · Buildings Wave · 3D Sneaker Grid** — off-theme.
- **WebGPU Water / Stylized Water / sim pesanti** (`matsuoka-601/waterball` è **già** la nostra "A") —
  ridondanti con l'hero + costosi.
- **Menu demos** (EaseReverse Clip Menu, Underwater Nav PixiJS, MenuFullGrid) — abbiamo già il menu
  sunset-curtain; niente doppioni.
- **Bayer Dithering background** — estetica retro, fuori Golden Hour.

---

## Sequenza consigliata
~~1 (Dual Wave Text)~~ ✅ → ~~3 (Water Distortion → ShallowWater)~~ ✅ → ~~2 (big-type → TideSurge)~~ ✅ →
**prossimi: 4 (Flip grid) / 5 (sticky-stack)** — entrambi **dietro confirm-feel di Alberto** (il 4 vuole un
contenuto a griglia, il 5 cambia il ritmo di scroll della home). Gli image-driven appena arrivano le still
(`Work.textureSrc`).
