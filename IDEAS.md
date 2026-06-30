# IDEAS — prossime mosse forti (Golden Hour)

> Idee di feature ad alto livello pensate in sessione, **ground sulle reference §6 di
> `CLAUDE.md`** (Codrops/Tympanus, Magic UI, Aceternity, Skiper/ui-layouts, GSAP) — da
> **riscrivere** sullo stack GSAP/Lenis/three e ri-tematizzare Golden Hour, mai importate 1:1.
>
> Companion: **`PLAN.md`** (backlog), **`HANDOFF.md`** (stato), **`CLAUDE.md`** (regole/routing/§6).
> Convenzione (regola §2): **prosa IT**, codice/identificatori/file/token **EN**.
> Formato voce: **Obiettivo · Reference · Meccanismo (sul nostro stack) · File · Rischio · Gate**.

---

## ✅ Fatto in questa sessione (contesto — tutto su `main`)
- **Atmosfera crepuscolo** WebGL dietro la banda night ("il sole è appena tramontato"): afterglow + stelle + braci, fragment shader raw — `src/components/atmosphere/NightSky.tsx`.
- **Scroll-progress "sun arc" rail** (golden→dusk in cima) — `src/components/nav/ScrollProgress.tsx`.
- **Guard `overflow-x: clip`** su html/body (fix overflow orizzontale del marquee che spingeva fuori la X del menu) — `globals.css`.
- **Menu sunset-curtain** (Codrops *shape-overlays* + SplitText `mask:"lines"`), toggle **hamburger→X**, a11y completa — `MenuOverlay.tsx`, `MenuToggle.tsx`.
- **Read-along** sul corpo About (Aceternity *Text Generate*, scrubbed allo scroll) — `src/components/reveal/ScrollWords.tsx`.

---

## P0 — alto impatto, basso rischio (additive, ship subito)

### 1. `/about` cinematografico
- **Obiettivo**: la pagina più testuale del sito respira come la home.
- **Reference**: Skiper19 *SVG draw-on-scroll* (path che si disegna allo scroll) + Aceternity *Text Generate* (già in `ScrollWords`).
- **Meccanismo**: (a) `ScrollWords` (read-along) sui paragrafi `j.bio`. (b) **linea-timeline SVG verticale** lungo la colonna Education/Experience che si auto-disegna via `stroke-dashoffset` scrubbato a ScrollTrigger, con **nodi ember** che si accendono all'ingresso di ogni voce.
- **File**: `src/components/about/AboutJourney.tsx` (+ nuovo `src/components/reveal/DrawLine.tsx`).
- **Rischio**: basso (rotta SSG separata, additivo). **Gate**: nessuno.

### 2. Read-along site-wide
- **Obiettivo**: linguaggio editoriale coerente in tutta la lettura lunga.
- **Reference**: Aceternity *Text Generate* (scrubbed).
- **Meccanismo**: applica `ScrollWords` ai paragrafi lunghi dei case study `/work/[slug]` (PARC) e alla `thesis` di `/about`.
- **File**: `src/components/work/WorkCaseStudy.tsx`, `AboutJourney.tsx`.
- **Rischio**: basso. **Gate**: nessuno.

### 3. Route transition = sunset shape-overlay (promuovi il curtain del menu)
- **Obiettivo**: la transizione di rotta usa lo **stesso curtain SVG** del menu → un solo linguaggio "tramonto→notte" tra nav e pagine.
- **Reference**: Codrops *Dynamic Shape Overlays* (ykob) — già implementato in `MenuOverlay`.
- **Meccanismo**: estrai `curtainPath()` in un util condiviso (`src/lib/curtain.ts`); in `RouteTransition` integra il path-morph multi-layer (ember→night) all'enter. Opzionale: **exit cover** (intercetta i `Link` interni → curtain copre → `router.push` → reveal).
- **File**: `src/components/transition/RouteTransition.tsx`, `src/app/template.tsx`, nuovo `src/lib/curtain.ts`.
- **Rischio**: enter-only basso; **exit cover medio** (tocca ogni Link interno). **Gate**: feel-confirm per l'exit cover.

---

## P1 — alto impatto, rischio medio / con dipendenze

### 4. Works cinematografico (DoF + focus) — ⛔ **BLOCCATO su still reali**
- **Obiettivo**: la depth-gallery diventa cinematografica — progetto a fuoco nitido, gli altri in **depth-of-field** caldo; l'attivo "pops".
- **Reference**: Aceternity *Focus Cards* + Codrops DoF/bokeh.
- **Meccanismo**: `@react-three/postprocessing` `DepthOfField` sulla Canvas, `focusDistance` legato al piano attivo + scala/luminosità sull'attivo.
- **Perché bloccato**: i piani oggi sono **gradienti procedurali duotone** (`FRAG` in `WorksGallery`) — una DoF su un gradiente liscio è quasi invisibile. Serve prima `Work.textureSrc` (still reali) per avere dettaglio da sfocare. *(Verificato leggendo il codice: nessuna texture, solo shader gradiente.)*
- **File**: `src/components/works/WorksGallery.tsx`, `src/content/works.ts`.
- **Rischio**: medio (pezzo "tenuto" + perf postprocessing su mobile → tier-scaling/DPR cap).
- **Gate**: **still reali WebP** (vedi Blocchi).

### 5. Tide-rail wayfinding (buoys + GSAP Flip)
- **Obiettivo**: dot-rail laterale coi marker di sezione; indicatore attivo che scorre con **GSAP Flip**. Complementa la top-rail (progresso %) senza duplicarla (qui = sezione/posizione).
- **Reference**: GSAP **Flip** + pattern nav Codrops.
- **File**: nuovo `src/components/nav/SectionRail.tsx`. **Rischio**: basso-medio. **Gate**: feel-confirm (possibile ridondanza con l'active-indicator del nav pill).

### 6. Spotlight ember cursor-follow (banda night)
- **Obiettivo**: un alone caldo segue il puntatore sulla banda night → "il calore risponde a te".
- **Reference**: Aceternity *Spotlight* + le braci di `NightSky`.
- **Meccanismo**: uniform `uMouse` in `NightSky`; afterglow/braci reagiscono al puntatore (solo `pointer:fine`, gated; mai su touch).
- **File**: `src/components/atmosphere/NightSky.tsx`. **Rischio**: basso (mio componente, già pronto a estendersi). **Gate**: nessuno.

---

## P2 — gating / sperimentale (confirm feel o gate)
- **7. Sticky scroll-stacking** delle sezioni (Codrops) — *ristruttura il ritmo della home*, da CSS `sticky` + recede (scale/blur). → **confirm feel** prima.
- **8. Hero scroll-driven** camera/overlay sul fluido — **G4**: non toccare solver/params senza ok esplicito.
- **9. Image displacement/refraction hover** sulle card Works (Codrops) — dopo le texture (come #4).
- **10. Icon-cloud constellation** — link-lines morbide tra icone vicine (cobe/Magic UI) come idle ambient. Basso impatto (la cloud è già forte).

---

## 🔒 Blocchi / gate trasversali
- **Still reali WebP** via `Work.textureSrc` → sblocca **#4** e **#9** (oggi depth-gallery e carosello rendono gradienti duotone). Input Alberto o generazione **G5**.
- **SerSan ×2** provvisori (status `provisional`, niente `/work/[slug]`) → titoli/PARC/stack da confermare.
- **G3** merge/deploy `main` = ok Alberto *(concesso in questa sessione)*. **G4** hero fluid. **G5** asset a pagamento (Higgsfield/Blender).
- **`NEXT_PUBLIC_SITE_URL`** da settare in deploy per OG/canonical/sitemap assoluti.

---

## Sequenza consigliata
**1 (`/about`) → 6 (spotlight night) → 3 (route-transition enter) → 2 (read-along site-wide)** — tutti additivi e shippabili. Poi, appena arrivano le still: **4 (Works DoF) → 9**. **5/7** solo dietro feel-confirm.
