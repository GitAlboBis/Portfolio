# CLAUDE.md — Portfolio Alberto Tuveri (Master Entry Point)

> **Cervello operativo del progetto.** Claude Code lo legge per primo: orienta qualsiasi agente in 60 secondi — visione, regole d'oro, stato reale del codice, design system, **librerie sorgente + come estrarne il codice**, routing skill/MCP, gates, backlog.
>
> **Riscritto 2026-06-30** per riflettere la direzione reale **GOLDEN HOUR**, letta dal codice (non dai doc). **Supersede** la vecchia versione "ocean + cinematica frame-WebP" e tutti i file in `docs/` (storici, direzione abbandonata).
>
> **Companion VIVI:** [`HANDOFF.md`](./HANDOFF.md) (continua-da-qui) · [`PLAN.md`](./PLAN.md) (backlog prioritizzato P0→P2) · [`WATER-WAVE-PLAN.md`](./WATER-WAVE-PLAN.md) (fisica/render del fluido).
> **STORICI (non fidarsi del contenuto, ma vale ciò che è riportato qui):** `IMPLEMENTATION-PLAN.md` — la prosa "ocean" è obsoleta, **ma le sue librerie-sorgente, le istruzioni di estrazione e il metodo restano validi e sono riportati nella §6 di questo file**. `DESIGN-SYSTEM.md` (vedi §0). `docs/*`.

---

## 0. FONTE DI VERITÀ — leggi questo prima di qualsiasi `.md`

Il **codice** è la verità su design e architettura. In caso di conflitto doc-vs-codice **vince il codice**, poi `HANDOFF.md` / `PLAN.md`, poi questo file. I `.md` storici NON sono autorevoli.

| Cosa | Fonte di verità autorevole |
|---|---|
| Design system (colore, tipografia, motion, primitive) | **Claude Design** (progetto canonico, vedi sotto) → mirrorato nel codice: `src/app/globals.css` (`@theme`) + `src/content/tokens.ts` + route **`/styleguide`** (contratto vivo) |
| Architettura / flusso pagina | `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/_providers/Smooth.tsx`, `src/store/ui.ts` |
| Copy EN/IT | `src/content/dict.ts` (`useDict()`, validato zod) |
| Stack / versioni / package manager | `package.json` (è **npm**, non bun) |
| Stato + backlog narrativo | `HANDOFF.md` + `PLAN.md` |

**Il design system canonico vive in Claude Design** (system design), non in un `.md` locale:
> 🎨 **Claude Design — "Alberto Tuveri — Golden Hour Portfolio"** · id `d5833b7a-0744-4bb8-bec0-367ce50698e8`
> https://claude.ai/design/p/d5833b7a-0744-4bb8-bec0-367ce50698e8 (privato; le card HTML del sistema vivono anche in `design-system/**`)

Da lì il sistema è stato **tradotto nel codice** (`globals.css` @theme + `tokens.ts`) — quella è la copia operativa. Per cambiare il sistema: aggiorna Claude Design, poi rispecchialo nei token (e in `/styleguide`).

⚠ **DRIFT noto:** il vecchio `DESIGN-SYSTEM.md` "Ocean v1" è stato **archiviato** in `docs/DESIGN-SYSTEM-ocean-v1.md` con banner storico (housekeeping D1, 2026-08-07) — non esiste più un design-system `.md` a root: la verità è Claude Design → token (§0). Il commento "Fraunces/Hanken" in `layout.tsx` è residuo: i font realmente caricati sono **Bricolage Grotesque + DM Sans**. La chiave `localStorage` dello store è `"ocean-ui"`: nome legacy ma funzionante, **non rinominare** senza migrazione.

---

## 1. Identità & Visione

Portfolio personale di **Alberto Tuveri** — Software Engineer, Full-stack + AI Integration. Sito **immersivo, single-page, scroll-driven**. Obiettivo di qualità: **Awwwards Site of the Day** (nord assoluto: `lusion.co`, Awwwards SOTD, l'art-direction system di `https://getdesign.md/bmw-m/design-md`).

**Direzione = GOLDEN HOUR.** Pagina **light, warm-white**, illuminata da un tramonto: accento **ember** (arancio `#ee5b23`) come gioiello, con calore coral/amber/rose e un contrappunto freddo **dusk**; una sola banda **night** scura per il dramma (Contact/Footer). Tipo a volume pieno (**Bricolage Grotesque**) su **DM Sans** pulito; motion che frena come la marea.

**Visione in una frame:** l'utente arriva su una **lettera "A" d'acqua viva** — un fluido a griglia **MLS-MPM su WebGPU raw** (solver vendorizzato da `matsuoka-601/WaterBall`, in `src/webgl/waterball/**`), reso **Screen-Space-Fluid translucido** che **riflette un cielo di tramonto** (cubemap sunset, Narrow-Range depth filter, rifrazione che campiona l'environment). Il colore dell'acqua resta teal **per scelta**: il calore arriva dal riflesso, non da un tint. La 'A' è riempita proceduralmente (nessun GLB a runtime). Sotto l'hero, contenuto editoriale su `bg-paper`: About → Works (depth gallery) → Tech sphere → poi la banda night Contact → Footer.

**Mood richiesto dal committente:** ULTRA-animato, alto livello, creativo — **NON minimale**. Poche feature MEDIOCRI = fallimento; pochi momenti **ECCEZIONALI** + micro-polish ovunque = vittoria. Ogni animazione è intenzionale e ingegnerizzata. Il sito è bilingue **EN/IT**.

---

## 2. REGOLE D'ORO (vincolanti)

- **Voce.** La PROSA delle direttive (doc, commenti di processo) è in **italiano**. Codice, identificatori, nomi file/componenti, token di design e **copy del sito** sono in **inglese**.
- **Mai dichiarare "fatto" senza PROVA VISIVA.** È la lezione che ha prodotto gli obbrobri: costruire alla cieca è vietato. Ogni task si chiude solo dopo aver **avviato il sito** (`npm run dev`) e **guardato il risultato con `claude-in-chrome`**: screenshot **desktop (1440) + mobile (390)** + **console pulita** (`read_console_messages`, zero errori/warning rilevanti) + verifica del comportamento atteso. Niente screenshot = niente "done". Vale anche per ogni sub-agente delegato.
- **Bilingue EN/IT.** Ogni stringa visibile passa per `src/content/dict.ts` (`useDict()`, shape `en`≡`it` validata zod in dev). **Mai** hardcodare copy nei componenti.
- **Context7 prima del codice** su librerie versionate (Next 16, React 19, Tailwind v4, GSAP 3.15, Lenis 1.3, three 0.184, drei, postprocessing, zustand 5, zod 4). Le API cambiano tra versioni — non andare a memoria.
- **Performance budget non negoziabile.** 60fps desktop recente; **degrado elegante** su mobile e `prefers-reduced-motion`; **Lighthouse mobile ≥ 80** (raggiungibile solo sul tier degradato: una canvas, DPR ≤1.5, FX pesanti off). Animare **solo `transform`/`opacity`**; `IntersectionObserver` per gate del rAF; **un solo ticker** (Lenis↔GSAP già condiviso in `Smooth.tsx`); pausa/dispose offscreen delle scene 3D. Scaling del fluido = `NUM_PARTICLES` + **DPR cap (~1.5)**.
- **Accessibilità AA.** 3D/decorativo `aria-hidden`; `focus-visible` (outline ember) preservato; contrasto ≥4.5:1; `prefers-reduced-motion` = versione **statica e leggibile** per OGNI effetto; navigazione tastiera; reading order corretto.
- **Una sola banda light-inversion.** Il sito è light; la banda `night` (Contact/Footer) è l'unica inversione e va usata **una volta sola** — è il payoff drammatico.
- **Due accenti max** per vista: ember (primario) + un secondario (amber/coral/rose/dusk) come gioiello raro. Niente neon, niente gradienti SaaS (l'unico gradiente sanzionato è `--gradient-sunset`).
- **Commit piccoli e atomici** su feature branch (un Work Package per branch, es. `feat/wp4-icon-cloud`). Branch prima di toccare `main`.
- **Non inventare contenuti.** Bio/progetti/metriche solo da fonti confermate (`docs/07-PROJECTS.md` per la bio; 3 Works confermati in `works.ts`, i 2 SerSan sono **provvisori** — vedi §11). Se manca un dato, segnalalo come buco aperto.
- **Niente regressioni.** Prima di sostituire qualcosa di "tenuto" (§3), screenshot before/after.
- **Non installare MCP/skill inutili** (consumano context). Usa solo gli essenziali del routing (§7).

---

## 3. Stato attuale & mappa file (Golden Hour)

**HOME** `src/app/page.tsx` → **Nav** (+ `MenuOverlay`) → `HeroScrollSettle` → `#hero` (sezione `h-dvh` vuota: il fluido WebGPU fisso di `CanvasHost` + il gradiente sunset si leggono attraverso questa banda) → layer opaco `bg-paper`: **About** → **WorksGallery** (depth fly-through, `#works`) → **Tech sphere** (`TechCloud`) → poi la banda **night**: **Contact** → **Footer**.

**ROUTE aggiuntive** (oltre alla home): **`/work`** (`app/work/page.tsx` → `WorkIndex` → **galleria orizzontale scroll-driven** `WorkHorizontal`: runway sticky n·100vh, lo scroll verticale scrubba il track laterale, ogni slide apre il suo case study; ha sostituito il carosello 3D `WorkCarousel` — eliminato — su richiesta di Alberto, 2026-07-02) · **`/work/[slug]`** (case study SSG dei 3 progetti confermati, PARC + metriche, bilingue) · **`/about`** (`AboutJourney`: bio lunga + education + experience + thesis) · **`/styleguide`** (contratto vivo del design system). **Transizione di rotta:** `app/template.tsx` → `RouteTransition` (sunset-curtain ad ogni navigazione client, gated sul Preloader, reduced-motion-safe). ⚠ **Works su DUE superfici, entrambe → `/work/[slug]`:** la **depth gallery** vive sulla home (`#works`), la **galleria orizzontale** vive su `/work` — coesistono *per scelta* (la gallery era stata rimossa per errore e ripristinata: NON eliminarne nessuna delle due).

| Area | File | Note |
|---|---|---|
| Token (verità design) | `src/app/globals.css` (`@theme`) + `src/content/tokens.ts` | `palette`, `sunsetStops`, `Mood`. Mirror 1:1 |
| Tipografia / utility | `globals.css` `@layer components` | `.t-hero/.t-display/.t-title/.t-lead/.t-body(.--mute)/.t-eyebrow/.t-meta/.t-index`, `.container-edit`, `.grid-edit` (+`.col-meta/.col-read/.col-wide/.col-half-r`), `.bleed`, `.glass`, `.hairline`, `.eyebrow-tick`, `.rule-node`, scope `.night` |
| Styleguide vivo | `src/app/styleguide/page.tsx` → **`/styleguide`** | Contratto visivo del design system |
| Scroll backbone | `src/app/_providers/Smooth.tsx` | Lenis guidato da `gsap.ticker` (un loop), guard reduced-motion, espone `window.__lenis` |
| GSAP | `src/lib/gsap.ts` | Punto unico di registrazione (ScrollTrigger + SplitText + useGSAP) |
| State | `src/store/ui.ts` (zustand) | `locale`, `soundEnabled`, `reducedMotion`, `activeWork`, `loaded`, `menuOpen`; persist (`locale`+`sound`) chiave `ocean-ui` |
| Copy EN/IT | `src/content/dict.ts` | `useDict()`, zod-validated. Sezioni: nav/hero/about/works/tech/contact/footer |
| Button (CVA) | `src/components/ui/button.tsx` | `primary/secondary/ghost/night`, sheen su hover (non loop) |
| Reveal / motion primitives | `src/components/reveal/{Reveal,ScrollText,WordGenerate,FlipText,ShimmerText}.tsx` + `src/components/motion/{Parallax,Magnetic,Appear,Marquee,BorderBeam}.tsx` + `src/lib/scroll-choreo.ts` | Re-tematizzati dalle reference §6 sullo stack GSAP/Lenis (no Framer) |
| Nav + Menu | `src/components/nav/Nav.tsx`, `src/components/nav/MenuOverlay.tsx` | Fluid-island pill: scroll hide/reveal + reveal-on-pointer-top + active-section indicator. Cursore custom **rimosso** (`Cursor.tsx` dead code) |
| Sezioni | `src/components/sections/About.tsx`, `Tech.tsx`, `Contact.tsx`; `src/components/footer/Footer.tsx`; `src/components/Preloader.tsx`; `src/components/hero/HeroScrollSettle.tsx` | |
| Works — home (gallery) | `src/components/works/WorksGallery.tsx` | R3F depth fly-through + mood ramp per progetto + caption con link **Open case →** / **All work ↗** + fallback list reduced-motion |
| Works — index `/work` (orizzontale) | `src/components/work/WorkIndex.tsx` (shell `/work`) + `src/components/work/WorkHorizontal.tsx` (runway sticky + scrub GSAP, drift contrapposto di titolo/numerale, click slide → `/work/[slug]`, skip-pill focus-visible, fallback list reduced-motion) | |
| Works — case study | `src/components/work/WorkCaseStudy.tsx` + `src/app/work/[slug]/page.tsx` (SSG, `generateStaticParams` sui 3 slug confermati) | |
| Works — dati | `src/content/works.ts` | ✅ progetti **REALI**: `badante24h`, `doit-voice-ai-agent`, `agricultural-supply-chain` (confermati, PARC EN/IT) + `sersan-project-1/2` (**provisional**, WIP, no case-study page). Still WebP via `Work.textureSrc` ancora da fornire (oggi gradienti duotone) |
| About | `src/components/about/AboutJourney.tsx` + `src/app/about/page.tsx` | bio/education/experience/thesis da `dict.journey` |
| Route transition | `src/components/transition/RouteTransition.tsx` + `src/app/template.tsx` | sunset-curtain reveal client-nav |
| SEO | `src/app/{icon,opengraph-image,sitemap,robots}.tsx/ts` + `layout.tsx` (metadata, OG/Twitter, canonical) + Person JSON-LD | `NEXT_PUBLIC_SITE_URL` da settare in deploy |
| **Hero fluido (GATE G4)** | `src/webgl/waterball/**` + `src/webgl/CanvasHost.tsx` (gated a `/`) + `src/webgl/store/heroStore.ts` | Render upgrade già applicati: `render/bilateral.wgsl.ts` (Narrow-Range), `render/fluid.wgsl.ts` (refract env + edge/foam), `render/fluidRender.ts`. Solver in `mls-mpm/*` |
| Sunset cubemap | `public/cubemap/*.png` (gen: `scripts/gen_sunset_cubemap.py`) | Riflessi golden-hour |
| Tech sphere | `src/components/tech-cloud.tsx` + `src/data/skill-icons.ts` | Engine tenuto; da elevare a vero 3D icon cloud (WP-4) |
| Claude Design (system design **canonico**) | progetto claude.ai/design "Alberto Tuveri — Golden Hour Portfolio" (id `d5833b7a-0744-4bb8-bec0-367ce50698e8`) + `design-system/**` (card HTML locali) | Vedi §0 — qui nasce il sistema, i token lo rispecchiano |

**Tenere (verificato a schermo):** hero water "A" che riflette il tramonto; nav + menu overlay; About (split-text); Works depth gallery (fly-through + cross-fade + mood ramp per progetto + caption sincronizzata + fallback list reduced-motion); Contact (night) + Footer; design system + `/styleguide`.

---

## 4. Stack (one-liner)

Next.js **16.2.6** (App Router) · React **19.2.4** · TypeScript strict · **npm** (no bun in questo env; esiste `bun.lock` ma si usa npm) · Tailwind CSS **v4** (CSS-first `@theme`) · **WebGPU raw** (MLS-MPM SSF hero, `navigator.gpu`-only; fallback = sunset gradient CSS) · **wgpu-matrix 3** · three **0.184** + @react-three/fiber **9.6** + drei **10.7** + @react-three/postprocessing **3** / postprocessing **6.39** (per la Works gallery R3F) · gsap **3.15** + @gsap/react · lenis **1.3** · zustand **5** · zod **4** · class-variance-authority + clsx + tailwind-merge · simple-icons **16** · leva (dev) · playwright (dev). Deploy su **Vercel**.

**Confine renderer:** l'hero è **raw WebGPU** sulla propria canvas (non condivide context né postprocessing pmndrs); la gallery/sfera sono R3F/WebGL. **Un renderer pesante per regione di scroll**; `IntersectionObserver` fa da gate e *dispone* (non solo pausa) all'handoff, con fallback poster su `device.lost`/`webglcontextlost`.

---

## 5. Design system (Golden Hour) — token REALI

Token in **un solo `@theme`** in `globals.css` (`--color-*` → auto `bg-*/text-*/border-*/ring-*`), mirror in `src/content/tokens.ts`. (Per AA pairs e specimen vivi: `/styleguide`.)

| Token | Hex | Uso |
|---|---|---|
| `paper` | `#fbf6ef` | Ground pagina (warm white) |
| `paper-deep` | `#f1e4d3` | Superfici, card, hairline |
| `ink` | `#2a1a14` | Testo primario (espresso caldo) |
| `ink-mute` | `#6e5447` | Testo muted — AA su paper (≈6.5:1) |
| `amber` | `#f2a33c` | Golden hour — fill, grandi accenti |
| `coral` | `#ff8a4c` | Peach-coral — fill, mid del gradiente |
| `ember` | `#ee5b23` | **Accento PRIMARIO** — CTA (testo ink), display |
| `ember-ink` | `#bc410f` | Arancio più scuro per **testo** arancio AA su paper (≈5:1) |
| `rose` | `#e15d6b` | Rose-red del tramonto — accento, gradiente |
| `dusk` | `#5e4b7e` | Viola crepuscolare freddo — contrappunto/profondità |
| `night` | `#2a1820` | L'unica sezione scura / footer (testo = paper) |
| `rule` / `rule-strong` | `rgb(42 26 20 / .14)` / `/ .28` | Hairline |

- **Gradiente unico sanzionato:** `--gradient-sunset` (golden → dusk, `118deg`). Niente altri gradienti SaaS.
- **Tipografia:** `--font-display` = **Bricolage Grotesque** (variable, display), `--font-sans` = **DM Sans** (variable, testo/label). Peso guidato da `font-weight` + `font-optical-sizing:auto` (niente micro-gestione di assi — quello era il vecchio sistema Fraunces). Classi: `.t-hero/.t-display/.t-title/.t-lead/.t-body/.t-eyebrow/.t-meta/.t-index`.
- **Motion (tidal easings):** `--ease-tide` `cubic-bezier(.16,1,.3,1)` (primario), `--ease-dive` `(.65,0,.35,1)` (transizioni), `--ease-drift` `(.33,0,.67,1)` (ambient). Reveal split-text gated su `document.fonts.ready`.
- **Componenti:** `.glass` (fill solido di default; blur reale solo sotto `@supports`/`prefers-reduced-transparency`), Button CVA, cursore custom (no `mix-blend screen` sul fluido), marks (`.eyebrow-tick`, `.hairline`, `.rule-node`).
- **Quality bar UI** (skill `ui-ux-pro-max`, in ordine di priorità): ① Accessibilità (contrasto, focus, keyboard) ② Touch/interazione (target ≥44px, feedback) ③ Performance (CLS, lazy, transform-only) ④ Coerenza di stile/icone (SVG, no emoji) ⑤ Layout responsive ⑥ Typography & color tokens ⑦ Animazione (150–300ms micro, reduced-motion). Usa la **Pre-Delivery Checklist** della skill prima di chiudere ogni task UI.

---

## 6. Librerie sorgente → cosa prendere + come ESTRARRE il codice  *(da `IMPLEMENTATION-PLAN.md` §4 — riportato qui)*

Le tecniche di queste librerie sono i **riferimenti da cui prendere il codice**, **NON** da importare 1:1: lo stack qui è **GSAP + Lenis (non Framer Motion)** e **three (non R3F per l'hero)** → **riscrivere le tecniche con GSAP/three**, ri-tematizzate Golden Hour (colori dai token, texture `colorSpace = SRGB`).

| Libreria | URL | Cosa prendere |
|---|---|---|
| **GSAP** | https://gsap.com/ | ScrollTrigger (pin/scrub), ScrollSmoother, **Observer**, **Flip**, **SplitText**, **MotionPath**, CustomEase — il motore di tutto |
| **Codrops / Tympanus** | https://tympanus.net/codrops/hub/ · https://tympanus.net/ | tecniche WebGL (caustics, particle fields, displacement/refraction su immagini, transizioni a tendina), scroll-driven camera |
| **Magic UI** | https://magicui.design/docs/components/icon-cloud · https://magicui.design/ | **Icon Cloud** (sfera 3D di loghi, cobe-style) → tech stack; marquee, border-beam, particles, text-reveal |
| **Aceternity UI** | https://ui.aceternity.com/components/focus-cards | Focus Cards (focus uno/sfoca gli altri) → progetti |
| **ui-layouts** | https://www.ui-layouts.com/components/scroll-text | Scroll Text (reveal parola-per-parola scrubbato) |
| **Skiper UI** | https://skiper-ui.com/v1/skiper19 | Skiper19 = SVG-follow-scroll (path che si disegna allo scroll) |
| **vengenceUI** | https://www.vengenceui.com/components/flip-fade-text | Flip Fade Text (flip per-carattere) |
| **Uiverse** | https://uiverse.io/elements | bottoni/cursori/micro-elementi (cherry-pick raffinati) |
| **anim master lib** | https://animmasterlib.dev/scroll | ricette scroll-animation pronte |
| **Dribbble** | https://dribbble.com/ | moodboard / direzione (studiare, non copiare) |

**Come estrarre il codice (istruzioni operative):**
- Usa **`WebFetch`** sulle doc-page. Magic UI e Aceternity espongono il **sorgente via registry JSON**:
  - Magic UI: `https://magicui.design/r/<name>.json` — es. `https://magicui.design/r/icon-cloud.json`
  - Aceternity: `https://ui.aceternity.com/registry/<name>.json` — es. `https://ui.aceternity.com/registry/focus-cards.json`
- Per i **loghi tech** usa `simple-icons` (già in `package.json`, bundle — **no CDN a runtime**), non fetch esterni.
- Studia, NON incolla: prendi il *meccanismo* (es. Fibonacci-sphere + matrice di rotazione per l'icon cloud; mask-reveal scrubbato per lo scroll-text) e riscrivilo sullo stack del progetto. Per librerie versionate, valida le API con **Context7** prima di scrivere.

---

## 7. Routing SKILL + MCP

> Riconciliato con le skill **realmente disponibili**. La colonna *intent* riporta i nomi citati da `IMPLEMENTATION-PLAN.md` (indicano l'intento); la colonna *Skill reale* dice cosa usare davvero. **L'utente ha chiesto esplicitamente di usare `ui-ux-pro-max`** come skill UI/UX di riferimento.
>
> **Aggiornato 2026-06-30 — skill installate in `.claude/skills/` (project-level):** `webgpu-threejs-tsl` (Dan Greenheck, MIT — repo: **https://github.com/dgreenheck/webgpu-claude-skill**) + un **set curato** da `sickn33/antigravity-awesome-skills` (repo: **https://github.com/sickn33/antigravity-awesome-skills** · indice plugin: `docs/users/plugins.md` — la repo ha ~1700 skill: installato solo il pertinente, NON tutto — regola d'oro): `high-end-visual-design`, `frontend-design`, `design-taste-frontend`, `editorial-design`, `gradient-design`, `duotone-design`, `swiss-design`, `animejs-animation`, `fixing-motion-performance`, `3d-web-experience`, `frontend-lighthouse`, `application-performance-performance-optimization`, `accessibility-compliance-accessibility-audit`, `fixing-accessibility`, `fixing-metadata`. Più i preinstallati `awwwards-loop`, `docs-driven-build`. La skill UI/UX primaria **`ui-ux-pro-max`** è user-level (`C:\Users\alber\.claude\skills\ui-ux-pro-max`).

| Ambito / task | **Skill reale da usare** | Intent citato nel piano | MCP / connettore |
|---|---|---|---|
| Gusto, art-direction, design system, UI, token, review visuale | **`ui-ux-pro-max`** (primaria) + (installate) `high-end-visual-design`, `frontend-design`, `design-taste-frontend`, `editorial-design`, `gradient-design`, `duotone-design`, `swiss-design` + `design`, `design-system`, `ui-styling` | ui-tokens, tailwind-design-system, radix-ui-design-system | shadcn MCP (componenti) |
| Componenti UI / pattern / "magic-ui-style" | **`ui-ux-pro-max`**, `ui-styling` | magic-ui-generator, react-ui-patterns | shadcn MCP |
| Scroll-driven / GSAP / parallax / camera / motion | (installate) **`animejs-animation`**, **`fixing-motion-performance`** + `ui-ux-pro-max` (regole animazione) | scroll-experience | **Context7** (gsap 3.15, lenis 1.3) |
| WebGL / shader / three / postprocessing / icon cloud 3D / TSL / WGSL | (installate) **`webgpu-threejs-tsl`** (three.js WebGPU + TSL, node materials, compute, post-processing, WGSL integration, device-loss — utile per gallery R3F, icon cloud, e come reference WGSL per l'hero raw-WebGPU) + **`3d-web-experience`** (R3F/Spline/configuratori 3D) + `ui-ux-pro-max` per il giudizio visivo | threejs-shaders, shader-programming-glsl, threejs-postprocessing, threejs-skills, threejs-interaction | **Context7** (three 0.184) |
| Next.js App Router / React / TS qualità & perf | *(usa Context7)* | nextjs-app-router-patterns, react-best-practices, react-component-performance, typescript-pro, zustand-store-ts | **Context7**, Vercel docs |
| Performance / a11y / SEO hardening | (installate) perf: **`frontend-lighthouse`** (CI gate Core Web Vitals), **`application-performance-performance-optimization`**, **`fixing-motion-performance`** · a11y: **`accessibility-compliance-accessibility-audit`**, **`fixing-accessibility`** · SEO/OG: **`fixing-metadata`** · + `ui-ux-pro-max` priority rules §1–3 | web-performance-optimization, wcag-audit-patterns | claude-in-chrome (audit) |
| **QA VISIVO (obbligatorio)** | **`claude-in-chrome`**, **`verify`** | ui-visual-validator, ui-review, verification-before-completion | **claude-in-chrome** (screenshot desktop+mobile, console) |
| Code review / cleanup / sicurezza | **`code-review`**, **`simplify`**, **`security-review`** | — | — |
| Loop autonomo verso SOTD | **`awwwards-loop`** (jury 8 critici → backlog → optimizer → verifier) | — | — |
| Build docs-driven a gate | **`docs-driven-build`** | — | — |
| Ricerca riferimenti / tecniche | **`deep-research`** | — | WebFetch / WebSearch |
| Copy EN/IT (hand-author in `dict.ts`) | *(nessuna skill)* | copywriting, ux-copy, avoid-ai-writing | — |
| Gen asset (img/video/3D) — **GATE G5 a pagamento** | — | remotion | **Higgsfield MCP** (img/video/3D), Blender (manuale) |
| Deploy / preview / log | *(usa Vercel MCP)* | vercel-deployment | **Vercel MCP** |
| AI integration / Claude API | **`claude-api`** | — | — |

**Regola MCP:** Context7 **prima** di scrivere codice su lib versionate; claude-in-chrome per OGNI prova visiva; Higgsfield/Blender solo dietro sblocco G5.

---

## 8. Metodo di lavoro (loop per ogni unità) + Work Packages

**Loop obbligatorio per ogni unità di lavoro:**
```
① Context7 (API lib) + se serve estrai il codice dalla libreria sorgente (WebFetch / registry JSON, §6)
② Costruisci/adatta al mood Golden Hour, usando la skill assegnata (§7) — token, EN/IT via dict.ts
③ npm run dev → claude-in-chrome: screenshot desktop(1440)+mobile(390), console pulita
④ Giudica con gusto (ui-ux-pro-max + Pre-Delivery Checklist): è SOTD-level? se no → ②
⑤ npm run typecheck + next build verdi → commit atomico → prossimo WP
```
Per fan-out su file disgiunti: sub-agenti / workflow — **ma ogni sub-agente passa comunque il gate visivo** (delegare senza verifica visiva è l'errore da non ripetere).

**Work Packages** (spec completa Goal/Wow/Source/Skills/Files/Acceptance in `IMPLEMENTATION-PLAN.md` §5; backlog prioritizzato vivo in `PLAN.md`):

| WP | Obiettivo | File chiave (attuali) |
|---|---|---|
| WP-1 | Art-direction system & color-grade della discesa (già impostato nei token) | `globals.css`, `tokens.ts` |
| WP-2 | Preloader cinematografico (gated su `document.fonts.ready` + first frame) | nuovo `src/components/preloader.tsx`, `layout.tsx` |
| WP-3 | GSAP scroll choreography + parallax multi-layer (pin/scrub/Observer) | `Smooth.tsx`, nuovo `src/lib/scroll-choreo.ts`, sezioni |
| **WP-4 ⭐** | **Tech stack = vero 3D Icon Cloud WebGL** (loghi simple-icons, draggable, glow) — **priorità #1** | `src/components/tech-cloud.tsx`, `src/data/skill-icons.ts` |
| WP-5 | Galleria progetti cinematografica (tilt/refraction, focus + DoF, horizontal) | `WorksGallery.tsx`, `works.ts` |
| WP-6 | Hero camera scroll-driven + profondità (NON toccare il solver — **G4**) | `CanvasHost.tsx`, overlay |
| WP-7 | Reveal di testo premium (SplitText mask-reveal scrubbato; no jitter cheap) | `Reveal.tsx`, sezioni |
| WP-8 | Transizioni di sezione & ambient WebGL (sotto il contenuto, mai sotto AA) | nuovo `section-transition.tsx` |
| WP-9 | Identità d'interazione: cursore + magnetismo + micro-detail | `button.tsx`, `Nav.tsx`, cursore |
| WP-10 | Performance & A11y hardening (tier-scaling, lazy-mount, no leva in prod) | trasversale, `next.config.ts` |
| WP-11 | QA finale & consegna (desktop+mobile, console, EN/IT, fallback WebGPU) | trasversale |

**Sequenza consigliata** (da `PLAN.md`/`IMPLEMENTATION-PLAN.md`): WP-1 → WP-3 → **WP-4 ⭐** → (WP-5 + WP-7 in parallelo) → (WP-9 + WP-8) → WP-6 → WP-2 → WP-10 + WP-11.

**Backlog immediato (P0 da `PLAN.md`):** ① Works reali (serve input Alberto) ② Hero scroll-settle ③ Componenti dalle reference re-tematizzati (marquee skills, shimmer CTA, text-animation hero).

---

## 9. Gates & conferme con Alberto (🔵 = stop & confirm)

- **G3 — Merge su `main` / deploy produzione:** 🔵 solo con ok esplicito di Alberto.
- **G4 — Hero FLUID** (`src/webgl/waterball/**`, physics/feel hand-tuned): **NON toccare** params/solver senza sblocco esplicito. La *resa* (shading/edge/foam) si migliora solo se Alberto sblocca.
- **G5 — Generazione asset a pagamento** (Higgsfield/Blender): 🔵 conferma prima di spendere crediti.
- **Contenuti:** Works/progetti e voci SerSan sono provvisori → 🔵 conferma copy prima di pubblicare claim.
- Ad ogni gate vale la regola: **niente "fatto" senza prova visiva** + console pulita.

---

## 10. Comandi & verifica

```bash
npm run dev          # http://localhost:3000  (apri in Chrome per WebGPU)
npm run typecheck    # tsc --noEmit
npm run build        # next build (gate prima del commit)
# /styleguide        # contratto vivo del design system

# Verifier dello skill docs-driven-build (se usato):
bash .claude/skills/docs-driven-build/verifier.sh        # typecheck + build
node .claude/skills/docs-driven-build/verify-visual.mjs  # console-clean + screenshot

# Asset:
node scripts/gen-mobile-frames.mjs   # (se servono frame mobile)
python scripts/gen_sunset_cubemap.py # rigenera la cubemap sunset dell'hero
```

---

## 11. Nota su contenuti

- **Works = REALI (3 confermati) + SerSan provvisori.** `src/content/works.ts` ha 3 progetti **confermati** con PARC EN/IT completo + `/work/[slug]`: `badante24h`, `doit-voice-ai-agent`, `agricultural-supply-chain`. Mancano gli **still WebP** via `Work.textureSrc` (sia la depth gallery sia la galleria orizzontale `/work` rendono gradienti duotone; serve un branch texture).
- **SerSan ×2 = PROVVISORI.** `sersan-project-1/2` hanno `status: "provisional"`, badge WIP, **niente** pagina `/work/[slug]` (sulla galleria orizzontale/depth gallery mostrano "WIP" invece di aprire). Dettagli/metriche da confermare con Alberto — non pubblicare claim non verificati. Il CV PDF non è aggiornato su SerSan: la verità sulla bio è `docs/07-PROJECTS.md`.
- **Email contatto (pubblica):** `albertotuveri@gmail.com` (in `dict.ts`, en+it). *(L'email aziendale `alberto.t@sersan.dev` NON va usata sul sito.)*
