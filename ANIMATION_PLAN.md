# ANIMATION_PLAN.md — "LA MAREA" · Overhaul motion verso Awwwards SOTD

> **Documento operativo dell'overhaul animazioni** (missione 2026-07-13, carta bianca creativa).
> **v2 — riconciliato con `main@8a7fdc4`** dopo il fast-forward (+38 commit: hero ink,
> continuous curtain, lane Codrops, motion package 2026-07-12). Companion: `CODEDROPSPLAN.md`
> (lane demo Codrops), `HANDOFF.md`, `PLAN.md`. Si aggiorna a fine lavori (§8).
>
> Direttive di Alberto recepite: **migliorare i works, non sostituirli** (le choreografie
> esistenti — runway con spotlight/odometro, depth fly-through — restano l'ossatura);
> le 6 reference passate in chat sono **ispirazione selettiva**, non lista da clonare.
> Regole invariate: CLAUDE.md §2 (bilingue, prova visiva, G4, una banda night, AA, budget).

---

## 1. Identità di motion — **LA MAREA** (cinematica & pesante)

Una sola mano: **il moto dell'acqua al tramonto**. Tutto decelera come la marea — parte
deciso, frena a lungo, si posa. La velocità di scroll è il segnale di modulazione globale
(marquee già accelera; il layer GL dei works si piegherà con essa). Le transizioni sono
sipari di tramonto (`curtainPath`: menu + route + exit-cover, già unificati su main).

1. **Settle lungo**: entrate con `tide`, durate dalla scala `--dur-*`. Mai easing default.
2. **Scrub lineare + Lenis**: scroll-welded = `ease: none`; l'easing percepito è il lerp di Lenis.
3. **Velocità = materia**: `lenis.velocity` alimenta UNA deformazione per superficie.
4. **Choreografia**: stagger canonici (0.025 chars / 0.06 words / 0.12 blocchi), un solo wow per viewport.
5. **Reduced-motion = versione statica completa** (regola di casa, ovunque).

## 2. Token di motion (Pass 1 — ✅ costruiti in questo branch)

**CSS** (`globals.css`): `--ease-tide/dive/drift` (esistenti) + **`--ease-crest`** (overshoot
d'onda) in `@theme`; scala durate **`--dur-ripple/wave/swell/tide/breaker`** (0.15/0.3/0.6/1.1/1.8s)
in `:root`. **JS** (`src/lib/motion.ts`): `DUR`, `EASE`, `STAGGER`, `VELOCITY_GAIN` — mirror 1:1.
**GSAP** (`src/lib/gsap.ts`): CustomEase registrate con gli stessi nomi + plugin `Flip`,
`Observer`, `CustomEase` ora disponibili dal punto unico.

Migrati ai token: RouteTransition, WordGenerate, Appear, JourneyTimeline, caption WorksGallery.
**Eccezioni sanzionate** (feel revisionati in prod, si toccano solo con A/B visivo): FlipText
`back.out(1.2)` (wordmark footer), gli scrub (`ease:none`), MenuOverlay/Nav (hand-tuned).
Debito ripagato: `aria-label` Marquee bilingue via `dict.tech.ariaMarquee`; `Reveal.tsx` (orfano) rimosso.

## 3. Già SOTD su main (si tiene, non si regredisce)

Hero fluido "A" + **HeroCopy** (h1/ruolo/tagline SplitText + sink scrubbato col drain) ·
**Continuous curtain** (CoverOverlay exit + RouteTransition enter + TransitionLink) ·
Nav fluid-island + MenuOverlay · **RollLink** (identità hover unica) · TideReveal ·
TideSurge · DualWaveText · ScrollWords/ScrollText/WordGenerate/ShimmerText/DrawLine ·
Parallax/Magnetic/Appear/Marquee/BorderBeam · **ShallowWater** (caustiche su /about,
/work, case study) · **Nightfall** (sticky-stack giorno→notte) · NightSky · TechCloud ·
runway /work con **spotlight + odometro** · depth gallery home (canvas lazy, demand-loop) ·
footer wordmark FlipText · next-project handoff nei case study.

**Scelte di gusto documentate:** niente glitch/terminal; effetti senza immagini finché
mancano le still (`Work.textureSrc`); cursore custom rimosso deliberatamente (non si
reintroduce quello vecchio; un eventuale cursore nuovo va ricostruito visibile e flawless
— fuori scope di questo overhaul).

## 4. Cosa manca (le passate di questo branch)

### Pass 2 — ⭐ /work runway: layer GL sotto le slide (il flagship)
**Additivo**: la choreografia DOM esistente (drift titoli/numerali, spotlight, odometro,
snap) non si tocca. Sotto ogni slide entra un piano R3F con:
- **Artwork generativo per progetto** (niente still finte — coerente con la regola "senza
  immagini"): fragment shader dai token `mood` con pattern distintivo per slug (geografie
  d'acqua per badante24h, spettro vocale per il voice agent, campi/filari per la supply
  chain, glifo WIP calmo per i SerSan) + grain + vignette. Pipeline `textureSrc` pronta:
  quando arrivano le still, CoverUV le monta al posto del pattern.
- **Bend da velocità** (meccanismo webgl-carousel, variante cheap senza FBO):
  `pos.y += sin(uv.x·π)·uVelocity` + micro RGB-split ∝ velocità. A riposo: piatto.
- **Reveal per slide** (r3f-image-reveal): noise-reveal `uProgress` al primo ingresso.
- **Parallax interno** (horizontal-parallax): l'artwork scorre contro il track (~±8%).
Convenzioni di casa: canvas demand-loop + rect-poll gate, DPR ≤1.5, dispose, fallback
(niente canvas = slide attuali, che restano complete), reduced-motion = lista esistente.

### Pass 3 — Home depth gallery: stessi artwork, camera con intenzione
Il modulo shader degli artwork è condiviso (un file). Nel `WorksGalleryCanvas`:
piani col pattern del progetto (al posto del duotone), banking laterale sul cambio
focus + micro dolly-in (`uFocus` tweenato con `tide`), pointer-parallax conservato.

### Pass 4 — Contapunti & preloader counter
- **Preloader**: counter percentuale (tabular-nums) legato al progresso reale
  (fonts + primo frame), uscita a sipario coerente (`curtainPath`) — l'ingegneria
  esistente (failsafe CSS, gate fonts) resta.
- **Metriche case study**: i valori (`0`, `<1s`, `<5min`) contano all'ingresso (once,
  `tide`), primitive riusabile `CountUp`.

### Pass 5 — Sweep residuo dei token + micro-polish
MenuOverlay/Nav/Preloader alle durate token dove non cambia il feel; `--dur-*` nelle
utility CSS che hanno literal; verifica EN/IT. (Solo dove il feel resta identico.)

### Pass 6 — Wildcard: **"La 'A' ritorna nelle stelle"**
Nella banda night, le stelle di NightSky si accendono in **costellazione a forma di A**
quando il footer entra (linee sottili che si disegnano, poi respirano). L'eroe d'acqua
dell'alba ritorna come costellazione al buio — chiude il cerchio giorno→notte dopo
Nightfall. Uniform `uConstellation` scrubbata nel fragment esistente; reduced-motion:
costellazione già accesa, statica.

### Pass 7 — QA hardening
Prova visiva completa (1440 + 390 reali, console pulita, EN/IT), reduced-motion su ogni
nuova superficie, fps con DevTools, Lighthouse (mobile ≥80 da CLAUDE.md, desktop ≥90),
aggiornamento §8. Le probe Playwright esistenti (`_curtain.mjs`, `_runway.mjs`, …) si
riusano dove pertinenti.

## 5. Mappa reference → uso (dossier in scratchpad/dossiers/*.md)

| Reference | Meccanismo estratto | Dove |
|---|---|---|
| `supahfunk/webgl-carousel` | velocità smoothed → UNA manopola di distorsione; slot-settle lungo | Pass 2 (bend) |
| `davidfaure/horizontal-parallax-gallery` | parallax interno contro il track | Pass 2 |
| `colindmg/r3f-image-reveal-effect` | noise reveal `uProgress` | Pass 2/3 |
| `biazo/codrops-animate-shaders-with-gsap` | GSAP tweena uniforms come pattern | Pass 2/3 |
| `codrops/OnScrollFilter` | turbolenza ∝ velocità | **parcheggiato** (saturazione testo — il sito ha già 6 trattamenti tipografici) |

## 6. Budget performance (vincolante)
Un ticker (gsap.ticker+Lenis); rAF extra solo quelli auto-gated esistenti; canvas /work in
demand-loop rect-poll (pattern di casa); DPR ≤1.5 ovunque; DOM solo transform/opacity;
will-change solo su elementi in animazione costante; texture/pattern generati una volta;
zero CLS; console pulita; 60fps desktop, degrado mobile (bend dimezzato, segmenti ridotti).

## 7. Esecuzione
Branch `feat/awwwards-motion` (basato su `main@8a7fdc4`), commit atomici per pass, build
verde + prova visiva prima di ogni commit. **Merge su main = G3** (ok esplicito di Alberto).

## 8. Consuntivo (si compila a fine lavori)
- **Pass 1 ✅** — token system LA MAREA: `--ease-crest` + `--dur-*` (CSS), `DUR/EASE/STAGGER/
  VELOCITY_GAIN` (`src/lib/motion.ts`), CustomEase tide/dive/drift/crest + Flip/Observer
  (`src/lib/gsap.ts`); migrazioni: RouteTransition, WordGenerate, Appear, JourneyTimeline,
  caption WorksGallery; Marquee bilingue; Reveal.tsx rimosso.
  **Manopole**: curve in `@theme` (globals.css) + `src/lib/motion.ts` (un punto per tutto il sito).
