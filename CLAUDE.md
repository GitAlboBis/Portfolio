# CLAUDE.md — Portfolio Alberto Tuveri · **THE JOB ORDER** (redesign 2026-09)

> **Cervello operativo del progetto.** Claude Code lo legge per primo: orienta qualsiasi agente in 60 secondi — mondo, regole d'oro, stato reale del codice, design system, routing skill/MCP, gate, comandi.
>
> **Riscritto 2026-09-17** alla chiusura di **WP-10** (fix batch + finish review + documentazione). **Supersede ogni versione precedente**: la direzione "Golden Hour" (carta calda, ember/amber, Bricolage Grotesque + DM Sans, hero a tutto schermo) è stata **rifiutata da Alberto il 2026-09-14** e **rimossa dal codice** nel commit `782f3e9`. Il mondo attuale è **"The job order"**: un ordine di lavoro d'officina, carta `#f5f4ef` e giallo di sicurezza `#ffc400`, timbri rossi, una sola famiglia (Archivo variabile), nessuna ombra, nessuna sezione scura.
>
> **Companion:** [`DESIGN.md`](./DESIGN.md) (sistema visivo, scritto dal mondo costruito) · [`REDESIGN-SPEC.md`](./REDESIGN-SPEC.md) (contratto di build) · [`PRODUCT.md`](./PRODUCT.md) (verità di prodotto) · [`HANDOFF.md`](./HANDOFF.md) (continua-da-qui) · [`PLAN.md`](./PLAN.md) (prossimi passi).

---

## 0. FONTE DI VERITÀ — leggi questo prima di qualsiasi `.md`

Il **codice** è la verità su design e architettura. In conflitto doc-vs-codice **vince il codice**, poi `DESIGN.md`, poi `REDESIGN-SPEC.md`, poi questo file.

| Cosa | Fonte di verità autorevole |
|---|---|
| Sistema visivo (colore, tipografia, motion, componenti, refuse list) | **`DESIGN.md`** + `.impeccable/design.json` (machine-readable), mirrorati nel codice: `src/app/globals.css` (`@theme` + `@layer components`), `src/content/tokens.ts`, `src/lib/motion.ts`, e la route **`/styleguide`** (contratto vivo, rapporti AA calcolati a runtime) |
| Contratto di build (direzione, raise, spec sezione per sezione, WP) | **`REDESIGN-SPEC.md`** §A–§L |
| Verità di prodotto: fatti, numeri, buchi dichiarati | **`PRODUCT.md`** §3 (prove) e §9 (CV trascritto). **Nessun numero sul sito che non sia lì** — gate: `node scripts/check-claims.mjs` |
| Architettura / flusso pagina | `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/_providers/Smooth.tsx`, `src/lib/phases.ts` |
| Copy EN/IT | `src/content/dict.ts` (`useDict()`, shape EN ≡ IT validata zod) |
| Stack / versioni / package manager | `package.json` — è **npm** |
| Stato + prossimi passi | `HANDOFF.md` + `PLAN.md` |

⚠ **Doc storici, NON autorevoli:** `ANIMATION-PLAN.md`, `CODEDROPSPLAN.md`, `IDEAS.md`, `docs/**` (tranne `docs/redesign/`). Qualsiasi riga che parli di *ocean*, *marea/tide*, *Golden Hour*, *sunset*, *ember*, *Bricolage/DM Sans*, *depth gallery*, *icon cloud*, *TechCloud*, *WorkHorizontal* descrive mondi **eliminati**. La chiave `localStorage` dello store è ancora `"ocean-ui"`: nome legacy ma funzionante, **non rinominare** senza migrazione.

---

## 1. Identità & mondo

Portfolio personale di **Alberto Tuveri** — Software & AI Engineer · Creative Lead in SerSan. Sito **single-page + sotto-moduli**, bilingue **EN/IT**. Obiettivo di qualità: **Awwwards Site of the Day** (stima onesta del finish reviewer: *Honorable Mention territory* oggi, SOTD plausibile ma non favorito).

**THESIS.** Il sito è un unico **ordine di lavoro** d'officina: un foglio rigato che accumula prove timbrate attraversando sei fasi — **Intake · Diagnosis · Estimate · Work · Test · Release** — che sono anche il percorso del visitatore. La metafora è un fatto del CV (Maintech OMA, l'ERP d'officina che ha fondato: nove ruoli, state machine a sei fasi), non un costume.

**OWN-WORLD.** Carta `#f5f4ef`, inchiostro `#141414`, grafite `#5a5a57`; **giallo di sicurezza `#ffc400` come regione intera** (banda fasi sticky, colonna letture del banco, pannello Release ≈ un terzo della superficie), mai come striscia; rosso timbro `#b40f29` solo per timbri, link e frecce. **Una sola famiglia**, Archivo variabile con asse di larghezza (125 / 112 / 100 / 87 / 75). Campi rigati 1px a bordi condivisi, tabelle a hairline, righe di perforazione, timbri ruotati −3,5°, un banco prova incorniciato. **Niente ombre, gradienti, vetro, mono, sezioni scure.** Riconoscibile a contenuto rimosso: un modulo giallo-e-carta con timbri rossi.

**Signature interaction.** La banda fasi gialla è sticky e **timbra** ogni fase al passaggio (verbo STAMP), il contatore sale `1 / 6 → 6 / 6` e non torna mai indietro; `aria-current="step"` la segue; la cella **Email** è fissa su ogni route.

**La prova viva.** Il banco prova sulla home: fluido **MLS-MPM · screen-space fluid su WebGPU raw** (solver vendorizzato da `matsuoka-601/WaterBall`), dentro un riquadro 760×540 con la colonna gialla di letture **lette dal motore** (Particles, Solver, Render, Frame ms misurati, DPR applicato, Tier, State). Niente è mai simulato: senza renderer il riquadro mostra un **fotogramma catturato da questo motore**, etichettato, e la riga di motivo si stampa nelle letture.

---

## 2. REGOLE D'ORO (vincolanti)

- **Voce.** La PROSA delle direttive (doc, commenti di processo) è in **italiano**. Codice, identificatori, nomi file, token e **copy del sito** sono in **inglese** (l'IT vive in `dict.ts`).
- **Mai dichiarare "fatto" senza PROVA VISIVA.** Ogni task si chiude solo dopo `npm run dev` + **`node scripts/visual-gate.mjs <tag> <route…>`**: screenshot **desktop 1440×900 + mobile 390×844 DPR2** e **console pulita** (0 errori, 0 warning rilevanti). Niente screenshot guardati = niente "done". Vale per ogni sub-agente.
  - Cattura full-page di pagine lunghe: **mai oltre 16.384 px di device pixel** (soffitto texture di Chrome: oltre, lo screenshot torna *ricucito male* e replica sezioni già viste). La home a 390 DPR2 è ~25.000 px → si cattura **a tile** (`scripts/probes/_recapture.mjs`).
- **Bilingue EN/IT.** Ogni stringa visibile passa per `src/content/dict.ts`. **Mai** hardcodare copy nei componenti. Parità verificata: stesso numero di stringhe visibili nei due locali su ogni route × viewport.
- **Non inventare contenuti.** Ogni numero deve esistere in `PRODUCT.md` §3/§9 — `node scripts/check-claims.mjs` è il gate. Un buco si **stampa come campo** ("no photograph on file", "URL: pending", "not in the catalogue"), mai come card segnaposto.
- **Context7 prima del codice** su librerie versionate (Next 16, React 19, Tailwind v4, GSAP 3.15, Lenis 1.3, three 0.184, zustand 5, zod 4). Le API cambiano tra versioni.
- **Budget di performance non negoziabile.** **Un solo renderer pesante in tutto il sito** (il banco su `/`); ogni altra regione è DOM/CSS/SVG. Animare solo `transform`/`opacity` (e `clip-path` per lo swap delle letture); un solo ticker (Lenis ↔ GSAP condiviso in `Smooth.tsx`); `IntersectionObserver` per il gate del rAF; dispose al cambio route. Target misurati: **Lighthouse mobile ≥ 80 su `/`** (85–86) e **≥ 90 sulle sotto-route** (91).
- **Accessibilità AA.** **axe 0 serious / 0 critical** su 7 route × 2 viewport, più le varianti reduced-motion e no-WebGPU. Canvas `aria-hidden`; focus-visible 2px `safety` + 1px `ink` interno (invertito sul giallo); contrasto ≥ 4,5:1 (le due coppie vietate sono stampate come FAIL su `/styleguide`, a scala large-text); `prefers-reduced-motion` = versione statica e leggibile di OGNI effetto.
- **Il testo non attraversa mai l'opacità parziale su un fondo colorato.** Uno swap di testo è un **wipe** (`clip-path`), non una dissolvenza: una dissolvenza passa per rapporti di contrasto arbitrariamente bassi.
- **G4 — il solver è congelato.** `src/webgl/waterball/mls-mpm/**` e `common.ts` sono **sola lettura**: parametri e fisica hand-tuned. Tutto ciò che serve si fa **render-side o di montaggio**. La **Fase B** (sostituire in `g2p.wgsl.ts` l'asse mediano a 3 segmenti con un SDF di box, cioè la "vasca" al posto del campo a forma di A) è **dietro sblocco esplicito di Alberto** — vedi `REDESIGN-SPEC.md` §F e la domanda aperta L.1.
- **Commit piccoli e atomici** su `feat/redesign-2026-09` (un Work Package = un commit). **Il commit lo fa il direttore**, non i sub-agenti.
- **Non installare MCP/skill inutili** (consumano context). Solo gli essenziali del routing (§7).

---

## 3. Stato attuale & mappa file

**Branch:** `feat/redesign-2026-09`. **WP-0 → WP-10 costruiti**; la finish review è passata con disposizione **fix**, il batch F1–F13 è applicato, `DESIGN.md` e `.impeccable/design.json` esistono. Restano: risposte di Alberto (§9, `REDESIGN-SPEC` §L), media mancanti, Fase B, deploy.

**HOME `/`** → `header-strip` (layout) → `job-order-header` (nome 88px + Role) → `phase-band` (sticky) → **cover** `#phase-intake` (banco prova + riepilogo "Line items on file" + cella Release) → `Intake` → `Diagnosis` (Findings) → `Estimate` (Parts catalogue) → `#phase-work` (Work performed, 5 righe + "4 more line items ↓") → `#phase-test` (Measured) → `#phase-release` (pannello Release) → `Footer`.

**Route:** `/` · `/work` (tutte e 9 le righe) · `/work/[slug]` (9 sotto-moduli SSG su copia carbone) · `/about` (Owner) · `/styleguide` (contratto vivo) · `404`.

| Area | File |
|---|---|
| Token e tipografia | `src/app/globals.css` (`@theme` palette · `:root` spaziatura/z/easing · `@layer components` scala `.f-*` e primitive) · `src/content/tokens.ts` (mirror JS/WGSL) |
| Motion | `src/lib/motion.ts` (`DUR`, `EASE`, `STAGGER`) · `src/lib/gsap.ts` (registrazione unica + CustomEase `rule`/`stamp`/`sheet`) |
| Scroll backbone | `src/app/_providers/Smooth.tsx` (Lenis sul `gsap.ticker`, `html lang` dal locale, `data-motion="reduced"`) |
| Chrome del foglio | `src/components/sheet/`: `HeaderStrip.tsx` (strip + skip link route-aware) · `PhaseBand.tsx` + `usePhaseStamps.ts` · `Stamp.tsx` · `Field.tsx` · `RuleIn.tsx` · `Perforation.tsx` · `LocaleToggle.tsx` · `src/lib/phases.ts` |
| Banco prova | `src/components/bench/TestBench.tsx` (figura, cover still, cross-fade) · `BenchReadouts.tsx` (colonna gialla, swap a wipe, riga `State`) · `src/webgl/CanvasHost.tsx` (gate route + WebGPU + RM) · `src/webgl/waterball/**` (motore; `mls-mpm/**` **intoccabile**) · `src/webgl/store/heroStore.ts` (bus strumenti: `compiling → warming → live`, o `still`/`lost`) |
| Sezioni home | `src/components/sections/`: `JobOrderHeader.tsx` · `Intake.tsx` · `Diagnosis.tsx` · `Estimate.tsx` · `Measured.tsx` + `MeasuredRow.tsx` · `Release.tsx` · `useRowStagger.ts` |
| Work | `src/components/work/`: `WorkTable.tsx` (una sola tabella per home e `/work`) · `Loupe.tsx` (lente d'ispezione) · `SubForm.tsx` (sotto-modulo) · `Schematic.tsx` (SVG rigato) · `WorkIndex.tsx` |
| About / Footer / 404 | `src/components/about/{AboutJourney,JourneyTimeline}.tsx` · `src/components/footer/Footer.tsx` · `src/app/not-found.tsx` |
| Transizioni / preloader | `src/components/transition/{RouteTransition,CoverOverlay,TransitionLink}.tsx` + `src/app/template.tsx` · `src/lib/sheet.ts` · `src/components/Preloader.tsx` |
| Contenuto | `src/content/`: `dict.ts` (EN/IT zod) · `works.ts` (9 lavori, `MeasuredRow` strutturato, `capture`) · `findings.ts` · `career.ts` · `src/data/skills.ts` |
| SEO | `src/app/{layout,icon,opengraph-image,sitemap,robots}.tsx/ts` + `src/app/work/[slug]/opengraph-image.tsx` + `src/lib/site.ts` |
| Script | `scripts/visual-gate.mjs` (gate visivo) · `scripts/check-claims.mjs` (numeri vs PRODUCT) · `scripts/capture-sites.mjs` · `scripts/capture-bench.mjs` · `scripts/gen_workshop_cubemap.py` · `scripts/probes/**` (a11y-gate, wp10-evidence, _recapture, sonde puntuali) |

---

## 4. Stack (one-liner)

Next.js **16.2.10** (App Router) · React **19.2.7** · TypeScript strict · **npm** su Windows · Tailwind CSS **v4** (CSS-first `@theme`) · **WebGPU raw** (MLS-MPM SSF, `navigator.gpu`-only; fallback = fotogramma catturato) · wgpu-matrix 3 · gsap **3.15** + @gsap/react · lenis **1.3** · zustand **5** · zod **4** · Archivo variabile via `next/font/google` (asse `wdth`) · playwright (dev). Deploy su **Vercel**.

> `three` / `@react-three/*` / `postprocessing` / `simple-icons` sono ancora in `package.json` ma **il mondo attuale non li usa**: nessuna scena R3F, nessun logo. Rimuoverli è housekeeping in `PLAN.md`.

---

## 5. Design system

**Vive in [`DESIGN.md`](./DESIGN.md)** (+ `.impeccable/design.json` per i consumatori macchina), scritto **dal mondo costruito** a fine build. Lì ci sono: palette con ruoli e coppie AA calcolate, Archivo e la scala `.f-*` con i valori, griglia/spaziatura/perforazione, scala z, grammatica di motion (RULE-IN, STAMP, copertura di route, ciò che non si anima mai, reduced-motion), componenti, e la **refuse list**.

Il **contratto vivo** è la route **`/styleguide`**: bilingue, con hex e rapporto AA **calcolati a runtime** (`src/lib/contrast.ts`), incluse le due coppie vietate stampate come FAIL.

Per cambiare il sistema: aggiorna `globals.css` + `tokens.ts` + `motion.ts` **insieme**, verifica su `/styleguide`, poi rispecchia in `DESIGN.md` e `.impeccable/design.json`.

---

## 6. Librerie sorgente → cosa prendere + come ESTRARRE il codice

Le tecniche di queste librerie sono **riferimenti da cui prendere il meccanismo**, **non** dipendenze da importare: lo stack qui è **GSAP + Lenis** e **WebGPU raw**. Si studia, si riscrive sui token del progetto, si valida l'API con **Context7**.

| Libreria | URL | Cosa prendere | Stato nel build |
|---|---|---|---|
| **GSAP** | https://gsap.com/ | ScrollTrigger (`once`), Flip, CustomEase, Observer | usato (motore di tutto) |
| **transitions.dev** | https://transitions.dev/ | 04 text-states-swap · 07 panel-reveal · 16 tabs-sliding | ri-espressi: swap delle letture (come **wipe**), stagger dei campi, toggle EN/IT |
| **Aceternity UI** | https://ui.aceternity.com/registry/lens.json | Lens | ri-espresso come `Loupe.tsx` (mask radiale + `quickTo`, nessuna dipendenza) |
| **Magic UI** | https://magicui.design/r/<name>.json | number-ticker, icon-cloud, marquee | **valutati e rifiutati** (i numeri non si animano, niente loghi) |
| **Codrops / Tympanus** | https://tympanus.net/codrops/hub/ | timing dell'handoff Flip | studiato |
| **ui-layouts / Skiper / vengeanceUI / Uiverse** | — | micro-pattern | cherry-pick, ri-tematizzati |

**Come estrarre:** `WebFetch` sulle doc-page; Magic UI espone il sorgente via `https://magicui.design/r/<name>.json`, Aceternity via `https://ui.aceternity.com/registry/<name>.json`. **Studia, non incollare.**

---

## 7. Routing SKILL + MCP

Il toolchain è il plugin **`claude-ui-toolchain` → `ui-design`** (97 skill + 6 MCP + hook di routing). Le skill hanno il prefisso `ui-design:`; i server MCP si chiamano `plugin:ui-design:<name>`. L'hook `UserPromptSubmit` inietta la tabella di routing sui prompt che sembrano UI/front-end (`#design` la forza, `#nodesign` la salta).

| Ambito / task | Skill | MCP / connettore |
|---|---|---|
| Direzione, finish review, detect meccanico, `DESIGN.md` | **`ui-design:impeccable`** (`detect`, `document`, `craft-floor`, `embed-prompt`) | — |
| Gusto e qualità visiva, review | `ui-design:design-taste-frontend`, `ui-design:frontend-design`, `ui-design:high-end-visual-design`, `ui-design:stop-slop`, `ui-design:ui-review` | `magicuidesign`, `ui-layouts-mcp` |
| Motion / scroll / GSAP | `ui-design:gsap-scrolltrigger`, `ui-design:gsap-core`, `ui-design:gsap-timeline`, `ui-design:gsap-performance`, `ui-design:transitions-dev`, `ui-design:transitions-polish`, `ui-design:improve-animations` | `context7` (gsap 3.15, lenis 1.3) |
| WebGPU / WGSL / shader | `ui-design:shader-programming-glsl`, `webgpu-threejs-tsl` (reference WGSL) — **mai sul solver, G4** | `context7` |
| A11y | **`ui-design:fixing-accessibility`**, `ui-design:ui-a11y` | `scripts/probes/a11y-gate.mjs` (axe-core) |
| Performance / Lighthouse | **`ui-design:lighthouse`**, `ui-design:fixing-motion-performance` | Chrome DevTools MCP |
| Next.js / React / TS | — (usa Context7 e le skill `vercel:*`) | `context7`, Vercel MCP |
| QA visivo (obbligatorio) | `ui-design:verification-before-completion` | **`scripts/visual-gate.mjs`** (Playwright) |
| Deploy / preview / log | `vercel:deploy`, `vercel:status` | Vercel MCP |

**GateGuard / ECC:** il profilo hook di ECC è impostato su **minimal** (`ecc/setup.json`) — niente gate automatici che interrompano il loop; i gate reali di questo progetto sono i comandi di §10.

**Regola MCP:** Context7 **prima** di scrivere codice su lib versionate; prova visiva per OGNI chiusura; nessun MCP a pagamento senza sblocco G5.

---

## 8. Metodo di lavoro (loop per ogni unità)

```
① Context7 (API della lib) + se serve estrai il meccanismo dalla libreria sorgente (§6)
② Costruisci/adatta al mondo "job order" (§1, DESIGN.md) — token, EN/IT via dict.ts,
   numeri solo da PRODUCT.md §3/§9
③ npm run dev → node scripts/visual-gate.mjs <tag> <route…>   (desktop+mobile, console pulita)
④ Giudica con gusto: è SOTD-level? il craft floor regge (contrasto, spaziatura, misura,
   stati, superfici del browser, copy)? se no → ②
⑤ npm run typecheck + npm run build verdi + node scripts/check-claims.mjs
   → il direttore committa (commit atomico) → prossima unità
```

Per fan-out su file disgiunti: sub-agenti — **ma ogni sub-agente passa comunque il gate visivo**. Delegare senza verifica visiva è l'errore da non ripetere.

---

## 9. Gate & conferme con Alberto (🔵 = stop & confirm)

- **G3 — Merge su `main` / deploy produzione:** 🔵 solo con ok esplicito di Alberto (salvo mandato esplicito in senso contrario).
- **G4 — Solver del fluido** (`src/webgl/waterball/mls-mpm/**`, `common.ts`): **congelato**. La **Fase B** (vasca rettangolare al posto del campo a forma di A) richiede sblocco esplicito e comporta una modifica al CV.
- **G5 — Generazione asset a pagamento** (Higgsfield/Blender): 🔵 conferma prima di spendere crediti.
- **Contenuti:** nessun claim non verificabile in `PRODUCT.md`. Le domande aperte sono in `REDESIGN-SPEC.md` §L (L.1–L.7) e riprese in `HANDOFF.md`.
- Ad ogni gate vale la regola: **niente "fatto" senza prova visiva** + console pulita.

---

## 10. Comandi & verifica

```bash
npm run dev            # http://localhost:3000  (Chrome, per WebGPU)
npm run typecheck      # tsc --noEmit
npm run build          # next build — ESEGUI da C:\Users\alber\Portfolio con la MAIUSCOLA
                       # (il casing della cwd fa doppio-caricare l'AsyncLocalStorage di Next:
                       #  "Expected workStore to be initialized". Vercel/Linux non è affetto.)

node scripts/check-claims.mjs                       # ogni numero del sito è in PRODUCT.md §3/§9
node scripts/visual-gate.mjs final "" work work/sersan-io about
                                                    # gate visivo: 1440×900 + 390×844, console pulita
                                                    # (route senza slash iniziale: Git Bash le convertirebbe in path)
node scripts/visual-gate.mjs rm "" --reduce         # prefers-reduced-motion
node scripts/visual-gate.mjs nogpu "" --nogpu       # navigator.gpu undefined → still etichettato

node scripts/probes/a11y-gate.mjs                   # axe-core, 7 route × 2 viewport (exit 1 su serious)
node scripts/probes/wp10-evidence.mjs               # parità EN/IT, tastiera, stati degradati
node scripts/probes/_recapture.mjs                  # catture a tile sotto il soffitto 16.384px

node scripts/capture-sites.mjs                      # ricattura sersan.io e spherenode.com
node scripts/capture-bench.mjs                      # ricattura il fotogramma del banco (Chrome WebGPU)
python scripts/gen_workshop_cubemap.py              # rigenera public/cubemap/*.png
# /styleguide                                       # contratto vivo del design system
```

---

## 11. Nota su contenuti

- **9 lavori, tutti confermati** in `src/content/works.ts` (nessun "provisional"): `spherenode`, `sphere-ai`, `maintech-oma`, `sersan-io`, `domus-tua`, `sersan-brand`, `badante24h`, `doit-voice-ai-agent`, `agricultural-supply-chain`. Ognuno ha `/work/[slug]` SSG.
- **Media mancanti (buchi dichiarati, `PRODUCT.md` §8.1):** solo `sersan-io` e `spherenode` hanno una cattura reale (`public/captures/*`); gli altri stampano "no photograph on file". Domus Tua e il brand film stampano "URL: pending" / "Film link: pending". `/about` stampa "Photograph: none on file".
- **Voice AI Agent:** il CV non dà numeri → la cella Measured stampa "—", mai una cifra inventata.
- **Provenienza dei raster:** tutti e 12 i raster spediti portano la loro origine incorporata (PNG in un chunk `tEXt`, WebP in un sidecar `<file>.webp.json` + EXIF). Verifica: `impeccable embed-prompt --scan public/captures public/bench public/cubemap` → *0 missing*.
- **Nota CV (`REDESIGN-SPEC` §L.2):** sulla voce "Personal Portfolio" le clausole "drone footage scrubbed to the scroll", "simulated water with real caustics" e "Lighthouse desktop 98/96/100/100" **non sono più vere** su questo sito e vanno rimosse o rimisurate; "sun glints" → "tube highlights".
- **Email pubblica:** `albertotuveri@gmail.com`. *(L'email aziendale `alberto.t@sersan.dev` NON va usata sul sito.)*
