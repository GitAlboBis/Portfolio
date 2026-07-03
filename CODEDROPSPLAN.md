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

---

## P0 — prossimi, on-theme + senza immagini (alto valore, basso rischio)

### 1. Dual Wave Text — grande titolo che entra "a onda"  ⭐ prossimo
- **Repo:** `ValentinDBS/codrops-tutorial-text-animation` · categoria **text/scroll**, tag *wave*.
- **Perché perfetto:** scritte GRANDI + movimento a **onda** = mare, senza immagini. Complementa
  (non duplica) i reveal esistenti (che sono word-fade). Warm editorial.
- **Dove:** un headline-statement (es. About lead, o un titolo di sezione). Un solo punto (no saturazione).
- **Re-theme:** onda calda tidal-eased; colori ink/ember. reduced-motion → testo statico.

### 2. On-Scroll Typography Animations — variante "big type" scrubbata
- **Repo:** `codrops/OnScrollTypographyAnimations` (Set 1 + "Some More") · **text/scroll**.
- **Perché:** type editoriale grande e pulito su scroll (visto live: elegante, non glitch). Cherry-pick
  **UNA** variante bold (scala/mask) per un titolo-firma; niente da aggiungere alla saturazione word-level.
- **Re-theme:** Bricolage a volume pieno, warm; welded allo scroll (scrub).

### 3. Lightweight Water Distortion — increspatura d'acqua ambientale
- **Repo/fonte:** `codepen.io/ksenia-k/pen/RwXVMMY` (shader leggero) · **background/hover**, tag *water*.
- **Perché:** on-theme puro (acqua) e **leggero** (a differenza dei sim pesanti). Una lieve increspatura
  su un background di sezione o su hover → "l'interfaccia si muove come l'acqua".
- **Rischio/nota:** WebGL — tienilo **sottile + gated** (IntersectionObserver, DPR≤1.5, dispose offscreen),
  non sovrapporre alle scene esistenti; reduced-motion → statico. Coordina con il budget perf.

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
**1 (Dual Wave Text)** → **3 (Water Distortion ambientale, sottile)** → **2 (big-type variant)** → poi
**4/5** dietro confirm-feel. Gli image-driven appena arrivano le still (`Work.textureSrc`).
