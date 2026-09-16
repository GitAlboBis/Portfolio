# REDESIGN-SPEC — "The job order" (redesign 2026-09)

> Contratto di build del redesign. Chiude il round di direzione (seed `2c525d0e`, Impeccable `concept-seed --scope direction --mode experience`) e vincola ogni agente che tocca la UI. Le decisioni visive durevoli finiranno in `DESIGN.md` **a fine build** (scritto dal mondo costruito, mai prima). La verità di prodotto resta `PRODUCT.md`; la storia del round è in `docs/redesign/DIRECTIONS-2026-09.md`.
>
> Voce: prosa in italiano; identificatori, token, nomi file e **copy del sito** in inglese (IT tradotto in `dict.ts`). Nessun numero che non sia in `PRODUCT.md` §3/§9. Run non presidiato: le decisioni sono prese, non chieste; i buchi restano buchi dichiarati (§L).
>
> Esito del round: **direzione assegnata costruita** (job-card, rank 4 del mio elenco grounded, kind `assigned`). Nessun override: entrambi i giudici la classificano prima (tally 76 / 69 / 61) e nessuno sfidante vince entrambi gli assi. I due difetti di fattibilità nominati (confinamento "A" nel kernel `g2p.wgsl.ts` sotto G4; timbro rosso su giallo a 3,68:1) sono risolti in §F e §C senza cambiare mondo.

---

## A. DIRECTION CONTRACT

**THESIS.** Il sito è un unico *ordine di lavoro* d'officina: un foglio rigato che accumula prove timbrate da ogni mestiere che Alberto copre (schema e sicurezza default-deny, valutazione RAG, rendering compute WebGPU, motion e film) attraversando sei fasi — Intake · Diagnosis · Estimate · Work · Test · Release — che sono anche il percorso del visitatore. Rifiuta la pagina che la categoria spedisce sempre (fondo quasi nero, nome gigante, blob sul cursore, bento di loghi, griglia "Selected Works" con hover-reveal) e il suo opposto (lista tipografica bianca): qui niente è decorativo, ogni elemento è un campo con etichetta stampata, valore misurato e provenienza (employer · date · link), e l'unica cosa viva è il suo fluido GPU che gira in un banco prova con il frame time stampato a margine. Il modulo viene da Maintech OMA, l'ERP che ha fondato (nove ruoli, state machine a sei fasi): la metafora è un fatto del CV, non un costume.

**OWN-WORLD.** Carta da officina `#f5f4ef`, inchiostro `#141414`, grafite `#5a5a57`; **giallo di sicurezza `#ffc400` come regione intera** (banda fasi sticky, colonna letture del banco, pannello Release — circa un terzo della superficie), mai come striscia; rosso timbro `#b40f29` solo per timbri e link. Una sola famiglia, **Archivo variabile con asse di larghezza**: intestazioni wdth 125, etichette condensate wdth 75 maiuscole, corpo wdth 100, numerali tabellari ovunque. Componenti: campi rigati 1px a bordi condivisi, tabelle con hairline, righe di perforazione tra le sezioni, timbri di gomma ruotati −3,5° con tag di ruolo, un banco prova incorniciato. Niente ombre, gradienti, vetro, mono, sezioni scure. Riconoscibile a contenuto rimosso: un modulo giallo-e-carta con timbri rossi.

**STORY.** In una viewport il visitatore capisce che è l'ordine di lavoro di una persona: nome e riga di ruolo esatta del CV, un fluido reale che gira nel banco con particelle e millisecondi stampati, le prime cinque righe di "Work performed" con i numeri già visibili, l'email nel riquadro di firma. Scorrendo, la banda timbra le fasi al passaggio: la pagina dimostra la disciplina a stati che ha costruito per Maintech. Crede perché ogni valore ha una cella di provenienza e i numeri sono coppie prima→dopo del CV. Agisce aprendo una riga (sotto-modulo sulla copia carbone), cliccando spherenode.com / sersan.io, o scrivendo ad albertotuveri@gmail.com dalla cella Email fissa nella banda.

**FIRST VIEWPORT.** 1440×900: strip di provenienza 48px (Sersan Limited · London · Remote | Sep 2026 | Status OPEN | EN | IT); riga B 48–200: campo "Job order" con **Alberto Tuveri** a 88px wdth 125 su 8 colonne, campo "Role" su 4 colonne con le due righe di ruolo e la riga di laurea; riga C 200–256: banda gialla sticky con le sei fasi, "Intake" timbrato, contatore "1 / 6" e **cella Email** a destra; riga D 256–900: banco prova 760×540 (fluido ambra-olio su `#ebe9e1`, cornice 1px inchiostro) + colonna gialla 112px di letture (Particles 120,000 · Solver MLS-MPM · Render SSF · Frame — ms · DPR 1.5 · Tier Desktop · timbro LIVE) + tabella "Work performed" (5 righe con Measured) + riquadro "Release" con Email. 390×844: strip 40px, nome 52px, Role, banda scorrevole 48px, banco 350×230 con strip gialla di 3 letture, due righe Work, Email a tutta larghezza. Azione primaria: la cella Email (banda + firma).

**FORM.** Forma scelta: *The job order* — documentazione industriale (job card d'officina, foglio d'ispezione, timbri di fase), candidato **4 di 7** nel mio elenco grounded ordinato per risonanza, kind **assigned** dal roll; seed key **`2c525d0e`** (mode experience, candidate-count 7). Build path: **code-led** (nessuna generazione immagini in questo harness): l'ambizione vive in questo blocco FIRST VIEWPORT, nella signature interaction (§E.3) e nella grammatica di motion (§C.7), che il finish reviewer verifica nel comportamento.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

---

## B. RAISES (donazioni dalla mano battuta — righe vincolanti, non note di costume)

- **from The frame under inspection (pick):** onestà strumentale — ogni lettura del banco è letta dal motore (`sim.numParticles`, frame time misurato, DPR e tier applicati); niente di "vivo" è mai simulato; il fallback è un fotogramma catturato ed etichettato con i valori registrati, mai un riquadro vuoto.
- **from Develop tray (darkroom):** azione primaria persistente — `Email` è una cella fissa della banda fasi su ogni route; lo stato no-WebGPU / reduced-motion è un still etichettato con la riga di motivo stampata.
- **from Develop tray (darkroom), via il giudice di fattibilità:** prima→dopo come geometria — accanto a ogni coppia della tabella Measured una doppia barra rigata statica proporzionale ai due valori (una per "before", una per "after"), così il delta si conta a occhio senza animazione.
- **from The evaluation run:** delta come dato di prima classe — ogni metrica è `{ before, after, unit, source }` in `works.ts` e un solo componente `MeasuredRow` la rende, con la riga di fonte.
- **from The terminal desk:** numerali tabellari a larghezza fissa ovunque compaia un dato; la direzione del delta la dice solo la freccia, mai un colore.
- **from The simulation paper:** disciplina di didascalia — il banco ha una didascalia da figura che nomina il metodo (MLS-MPM, screen-space fluid, WebGPU) sopra il riquadro, non un titolo.
- **from The standards manual:** in `/styleguide` ogni chip di colore stampa hex e rapporto AA calcolato a runtime, EN/IT.
- **from Pieced provenance (quilt, declined):** cucitura di provenienza su ogni fatto — employer · date · link in cella propria, su ogni riga di ogni tabella.
- **from Nothing hidden (Coptic, declined):** la banda mostra sempre totale e posizione (`n / 6`) e la struttura (righe, timbri, perforazioni) è l'unico ornamento della pagina.
- **from The collection spread (album, non sviluppato):** assenza come informazione — i buchi di `PRODUCT.md` §8 si stampano come campi ("Photograph: none on file", "URL: pending", "Film link: pending"), mai come card segnaposto.
- **from The parts plate book (non sviluppato):** i ricambi sono unità numerate — il campo Parts di ogni sotto-modulo elenca lo stack con gli stessi id di `skills.ts` usati nel catalogo Estimate.
- **from The napkin explainer (zine, re-roll pool):** il meccanismo disegnato — nei sotto-moduli Sphere AI e Maintech OMA uno schema rigato in geometria pura (riquadri e frecce SVG a 1,5px: chunking → pgvector → retrieval → grader; le sei fasi dell'ordine), nessuno stile a mano.

Decisione di chiarezza (clarity wins conflicts): il lessico "veicolo" resta solo dove è vero (Maintech). Su `/about` il blocco si chiama **Owner**; nei sotto-moduli i campi sono **Customer · Job · Problem reported · Work performed · Measured · Parts · Links**.

---

## C. DESIGN TOKENS

### C.1 Palette (`@theme` in `globals.css`, mirror 1:1 in `src/content/tokens.ts`)

| Token | Hex | Ruolo |
|---|---|---|
| `paper` | `#f5f4ef` | Fondo di tutto il sito (foglio superiore) |
| `paper-field` | `#ebe9e1` | Riempimento campi, righe alterne, backdrop del banco |
| `paper-carbon` | `#dcd9cf` | Fondo dei sotto-moduli `/work/[slug]` (copia carbone) |
| `ink` | `#141414` | Testo primario, tutte le righe 1px, testo su giallo |
| `graphite` | `#5a5a57` | Meta su carta/campi: provenienza, didascalie, unità |
| `graphite-deep` | `#4a4a47` | Meta su copia carbone (graphite lì è 4,90: passa ma senza margine) |
| `stamp` | `#b40f29` | Timbri su carta, link, frecce → |
| `stamp-deep` | `#8a0a1f` | Lettering dei timbri **sulla banda gialla** (6,13:1) |
| `safety` | `#ffc400` | Solo regioni: banda fasi, colonna letture, pannello Release, anello di focus |
| `oil` | `#c98a2a` | Riferimento per `diffuseColor` del fluido — costante WGSL, mai testo |
| `rule-soft` | `rgb(20 20 20 / .22)` | Hairline tra righe di tabella |

Strategia colore: **Committed** (giallo ≈ 35% della superficie come regioni intere). Scena fisica: modulo su banco d'acciaio sotto tubi fluorescenti alle 10 del mattino → pagina chiara, nessuna banda scura.

### C.2 Coppie AA (calcolate, WCAG 2.x)

| fg | bg | ratio | uso |
|---|---|---|---|
| `#141414` | `#f5f4ef` | 16,73 | corpo, titoli, valori |
| `#5a5a57` | `#f5f4ef` | 6,28 | meta su carta |
| `#b40f29` | `#f5f4ef` | 6,27 | link, frecce, timbri su carta (qualsiasi corpo) |
| `#141414` | `#ffc400` | 11,53 | fasi, contatore, Email, letture del banco, Release |
| `#8a0a1f` | `#ffc400` | 6,13 | lettering timbro sulla banda |
| `#f5f4ef` | `#b40f29` | 6,27 | testo carta su timbro pieno (LIVE, RELEASED) |
| `#141414` | `#ebe9e1` | 15,15 | valori nei campi, righe alterne |
| `#5a5a57` | `#ebe9e1` | 5,69 | meta nei campi |
| `#b40f29` | `#ebe9e1` | 5,68 | link nei campi |
| `#141414` | `#dcd9cf` | 13,04 | corpo dei sotto-moduli |
| `#4a4a47` | `#dcd9cf` | 6,30 | meta sui sotto-moduli |
| `#b40f29` | `#dcd9cf` | 4,89 | link sui sotto-moduli (≥ 4,5) |

**Vietati** (calcolati sotto 4,5): `#5a5a57` su `#ffc400` = 4,33 → sul giallo il testo secondario è `ink`; `#c8102e` su `#ffc400` = 3,68 → nessun timbro rosso chiaro sulla banda: i timbri sulla banda sono **riempiti** `stamp` con testo `paper` (6,27) e il tag di ruolo sotto è `ink` 12px. `#c8102e` viene rimosso dalla palette (5,34 su carta ma inutile: `stamp` copre tutti gli usi).

### C.3 Tipografia

- **Archivo** (variable, wght 100–900, **wdth 62–125**, OFL) via `next/font/google`: `Archivo({ subsets:["latin"], weight:"variable", axes:["wdth"], display:"swap", variable:"--font-archivo" })` (verificare la firma `axes` con Context7 prima di scrivere `layout.tsx`). Fallback `"Arial Narrow", Arial, sans-serif` con `size-adjust`. Una sola famiglia: intestazioni larghe, etichette condensate e corpo sono visibilmente un solo materiale. Nessuna seconda faccia, nessun mono: le letture sono `font-variant-numeric: tabular-nums`.
- Scala (`@layer components`, tutte le classi senza colore incorporato — il colore lo dà il contesto):

| classe | size | wdth / wght | note |
|---|---|---|---|
| `.f-name` | `clamp(3.25rem, 1rem + 5.6vw, 5.5rem)` | 125 / 800 | lh .95, tracking −.02em |
| `.f-headline` | `clamp(1.75rem, 1rem + 1.8vw, 2.5rem)` | 112 / 700 | lh 1.05, tracking −.015em |
| `.f-lead` | `clamp(1.125rem, 1rem + .6vw, 1.5rem)` | 100 / 400 | lh 1.35, measure 58ch |
| `.f-role` | `clamp(.9375rem, .8rem + .35vw, 1.125rem)` | 100 / 500 | lh 1.3 |
| `.f-body` | `1rem` | 100 / 400 | lh 1.55, measure 68ch |
| `.f-cell` | `.9375rem` | 100 / 400 | tabular, lh 1.4, wrap 44ch |
| `.f-caption` | `.8125rem` | 75 / 600 | uppercase, tracking .06em |
| `.f-meta` | `.8125rem` | 87 / 400 | provenienza, unità |
| `.f-stamp` | `clamp(1rem, .9rem + .5vw, 1.25rem)` | 75 / 700 | uppercase, tracking .04em |
| `.f-strip` | `.75rem` | 87 / 500 | header strip |

`font-variation-settings: "wdth" <n>` per classe; `font-optical-sizing` non serve (Archivo non ha opsz).

### C.4 Spaziatura e griglia

`--gutter: clamp(1.25rem, 3.3vw, 3rem)` (20 → 48px) · `--col: 12` a gap **0** (i campi si toccano su righe condivise, `border-collapse` mentale: mai doppie linee) · `--row: 8px` · `--cell-h: 56px` (riga di tabella) · `--band-h: 56px` (48px < 768) · `--field-pad: 16px 20px` · `--caption-h: 24px` · `--section-gap: clamp(2rem, 8vh, 6rem)` sopra un'intestazione di fase, `2rem` sotto · `--measure: 68ch` · perforazione: `border-top: 1px dotted ink` + due fori 6px ai margini (solo CSS). Il banco: `--bench-w: 760px; --bench-h: 540px` desktop, `350×230` mobile, `aspect-ratio` con `max-width: 100%`.

### C.5 Livelli z (una sola scala, `:root`)

`--z-sheet: 0` (contenuto) · `--z-bench: 1` (canvas dentro il riquadro) · `--z-band: 20` (banda sticky e header strip) · `--z-loupe: 30` · `--z-cover: 40` (foglio di transizione) · `--z-preloader: 50` · `--z-skip: 60` (skip link). Nessun altro z-index nel codice.

### C.6 Easing e durate (CSS + GSAP `CustomEase`, registrati una volta in `src/lib/gsap.ts`)

| CSS var | valore | GSAP name | uso |
|---|---|---|---|
| `--ease-rule` | `cubic-bezier(.16,1,.3,1)` | `"rule"` | RULE-IN (righe che si disegnano) |
| `--ease-stamp` | `cubic-bezier(.2,.9,.25,1.03)` | `"stamp"` | STAMP (impatto) |
| `--ease-sheet` | `cubic-bezier(.65,0,.35,1)` | `"sheet"` | copertura di route |
| `--ease-hover` | `linear` | — | hover, swap di testo |
| `--dur-hover 120ms` · `--dur-swap 150ms` · `--dur-text 180ms` · `--dur-stamp 220ms` · `--dur-rule 320ms` · `--dur-sheet 420ms` · `--dur-print 500ms` | | | |

`src/lib/motion.ts` esporta gli stessi valori per GSAP (unico mirror; i vecchi `--dur-ripple/wave/swell/tide/breaker` e `--ease-tide/dive/drift` spariscono).

### C.7 Grammatica di motion (due verbi, dal banco)

1. **RULE-IN** — ogni nuovo campo o riga viene *disegnato prima di essere letto*: la riga scala `scaleX 0→1` da sinistra in 320ms `rule`; il testo appare 90ms dopo, `opacity 0→1` in 180ms senza traslazione (il tipo è già stampato, la riga lo rivela); righe di tabella con stagger 40ms. `ScrollTrigger` `once: true`, start `top 85%`, mai ri-eseguito.
2. **STAMP** — `scale 1.18→1`, `rotate −1°→−3.5°`, `opacity 0→1`, `filter blur(1.2px)→blur(.4px)`, 220ms `stamp`, poi 60ms di assestamento `translateY 1px`. Un solo impatto autoriale: timbri di fase nella banda, LIVE sul banco, RELEASED nella firma.

Micro: hover riga → `background paper-field` 120ms; link → sottolineatura 1px offset 3px che passa a 2px in 120ms; flip locale → swap di opacità 150ms in place. Scroll: documento nativo + Lenis `lerp .1` sul `gsap.ticker` condiviso (contratto `Smooth.tsx` invariato); nessun pin, nessuno scrub, solo la banda `position: sticky`. Route: il foglio `paper` sale `100%→0` in 420ms `sheet` con una riga d'inchiostro che "stampa" verso il basso; la pagina entrante RULE-IN. **Mai animati:** i numeri (nessun count-up, nessun reel: il valore è stampato), il corpo, la canvas (nessun transform), le regioni gialle. **Reduced motion:** ogni riga a `scaleX 1`, ogni timbro già impresso, copertura sostituita da swap di opacità 150ms, banco = still etichettato.

---

## D. IA + mappa route

| Route | Sezioni (ordine) | Nota |
|---|---|---|
| `/` | `header-strip` · `job-order-header` · `phase-band` · `#phase-intake` (Owner + Current work) · `#phase-test` (Test bench) · `#phase-diagnosis` (Findings) · `#phase-estimate` (Parts catalogue) · `#phase-work` (Work performed, 5 righe + "4 more line items") · `#phase-test-measured` (Measured) · `#phase-release` (Release) · `footer` | Un foglio, sei fasi; la banda è la nav; ogni fase è una regione `ScrollTrigger` con id `#phase-<id>`. Il banco vive nella fase Test ma si mostra nella prima viewport: la regione Test è quella che timbra "Test" quando la tabella Measured entra. |
| `/work` | `header-strip` · `phase-band` (WORK timbrato) · `work-performed-full` (9 righe con provenienza e cattura dove pubblica) · `release` (compatto) · `footer` | Titolo "Things I've built" (keep). Stesso componente tabella della home: una sola fonte, nessuna seconda galleria. |
| `/work/[slug]` | `header-strip` · `phase-band` (WORK + cella "Job order ↖") · sotto-modulo: Customer · Job · Problem reported · Work performed · Measured · Parts · Links · `next-line-item` · `footer` | 9 slug SSG (`generateStaticParams`): `spherenode`, `sphere-ai`, `maintech-oma`, `sersan-io`, `domus-tua`, `sersan-brand`, `badante24h`, `doit-voice-ai-agent`, `agricultural-supply-chain` (già in `works.ts`). Fondo `paper-carbon`. |
| `/about` | `header-strip` · `phase-band` (INTAKE) · Owner (summary) · Experience · Education · Thesis · Languages · Photograph (none on file) · `release` (compatto) · `footer` | Layout Experience/Education a due colonne (keep), righe da `career.ts`. |
| `404` (`not-found.tsx`) | `header-strip` · ordine di lavoro vuoto con timbro VOID · cella "Job order ↖" | "No job order at this address." |

---

## E. SPEC SEZIONE PER SEZIONE

Per ogni sezione: scopo · prove (solo `PRODUCT.md`) · layout desktop/mobile · motion · effetto/componente (riferimento di ricerca → come viene ri-espresso) · asset · reduced-motion · costo e budget renderer per regione di scroll.

**Budget renderer per regione di scroll (vincolo):** una sola regione pesante in tutto il sito — il banco prova su `/` (WebGPU raw). Ogni altra regione è DOM/CSS/SVG. `/work`, `/work/[slug]`, `/about` non montano alcun renderer.

### E.1 `header-strip` (tutte le route)
- Scopo: provenienza del foglio. Prove: "Sersan Limited · London · Remote", "Sep 2026", stato `OPEN` (parola in riquadro), `EN | IT`.
- Desktop: strip 48px di quattro celle contigue `.f-strip` grafite/ink; mobile: una riga 12px + toggle a destra (40px).
- Motion: RULE-IN una volta al load. Toggle locale: transitions.dev **16 tabs-sliding** (`…/transitions-dev/16-tabs-sliding.md`) ri-espresso come due celle rigate il cui riempimento ink si scambia in 150ms — nessuna pillola.
- Asset: nessuno. RM: statico. Costo 0,5 g.

### E.2 `job-order-header` (`/`)
- Scopo: identità. Prove: "Alberto Tuveri"; "Software & AI Engineer · Creative Lead" / "Full-Stack · WebGPU / 3D & Motion"; "B.Sc. Computer Science, University of Camerino, 2026 · M.Sc. Artificial Intelligence Systems, University of Trento, in progress".
- Desktop: 8/4 colonne di riquadri rigati; didascalia "Job order" dentro il riquadro in alto a sinistra; nome `.f-name`. Mobile: impilato, nome 52px.
- Motion: RULE-IN dei due riquadri, testo 90ms dopo. **SplitText rifiutato**: il nome è stampato.
- Costo 0,5 g.

### E.3 `phase-band` (tutte le route) — **signature interaction**
- Scopo: nav + la firma del sito. Contenuto: Intake · Diagnosis · Estimate · Work · Test · Release; tag di ruolo (`INTAKE · Engineer`, `DIAGNOSIS · Engineer`, `ESTIMATE · Full-Stack`, `WORK · Creative Lead`, `TEST · Engineer`, `RELEASE · Contact`); contatore `n / 6`; **cella Email** (`mailto:albertotuveri@gmail.com`) a destra su ogni route.
- Desktop: giallo a tutta larghezza, `position: sticky; top: 0`, 56px; sei celle uguali con righe ink 1px + cella contatore + cella Email. Mobile: 48px, riga di tab scorrevole con `scroll-snap`, contatore e Email fissi a destra; la cella corrente scorre in vista al timbro.
- Interazione: ogni regione `#phase-<id>` è un `ScrollTrigger` (`start: "top 60%"`, `once: true`); all'ingresso il timbro pieno (`stamp` con testo `paper`) atterra sulla cella (verbo STAMP) con il tag di ruolo `ink` 12px sotto; il contatore aggiorna; i timbri restano — la banda accumula come una vera job card; alla fine tutti e sei sono impressi e il pannello Release riceve RELEASED. Click su cella → `lenis.scrollTo("#phase-<id>", { offset: -56 })`. Sulle sub-route la banda persiste con WORK/INTAKE timbrato e una cella rigata "Job order ↖". Tastiera: celle = `<button>`/`<a>`, `focus-visible` = anello 2px `safety` esterno + 1px `ink` interno (sulla banda gialla l'anello è ink); `aria-current="step"` sulla fase corrente.
- Componente: GSAP ScrollTrigger (https://gsap.com/docs/v3/Plugins/ScrollTrigger) `toggleActions` con `once`; sticky è CSS. Gotcha noto (memoria Nightfall): sticky × `ScrollTrigger.refresh` → armare i trigger dopo l'idratazione e `refreshInit`-disarm.
- RM: sei timbri già impressi al load; contatore via listener nativo di scroll. Costo 1,5 g.

### E.4 `intake` (`/`, `#phase-intake`)
- Prove: frase di posizionamento "I own the front-end, 3D and motion layer of everything SerSan ships, and the AI layer of its live trading platform."; righe "SerSan — AI Studio · Software & AI Engineer · Creative Lead · May 2026 – Present" e "ALS MCL Civitanova · Full-Stack Developer · Freelance · Jan 2026 – Present" (da `career.ts`).
- Layout: campo "Owner" (7 col) con la frase `.f-lead`; campo "Current work" (5 col) come due righe di provenienza. Mobile impilato. Motion RULE-IN. Costo 0,5 g.

### E.5 `test-bench` (`/`, prima viewport) — vedi §F per il motore
- Scopo: la prova viva che solo lui può spedire. Contenuto: didascalia "Fluid under test — MLS-MPM · screen-space fluid · written against the WebGPU API"; letture `Particles` (da `sim.numParticles`), `Solver MLS-MPM`, `Render SSF`, `Frame — ms` (misurato), `DPR` (applicato), `Tier` (Desktop/Mobile); timbro `LIVE` al primo frame, parola `STILL` in ink quando WebGPU manca.
- Desktop: riquadro 760×540 con cornice 1px ink su `paper-field` + colonna gialla 112px di letture `ink` tabellari a 24px di passo. Mobile: 350×230 + strip gialla di tre letture sotto. **Nessun testo sopra il fluido; nessun transform sulla canvas.**
- Motion: LIVE = STAMP al primo frame; letture aggiornate ogni 500ms con swap di opacità 150ms (transitions.dev **04 text-states-swap** ri-espresso come tween GSAP sul ticker condiviso).
- Asset: cubemap officina rigenerata (`scripts/gen_workshop_cubemap.py` → `public/cubemap/*.png`); still di fallback `public/bench/tank-still-{1520,700}.webp` catturato dal motore reale (Playwright, Chrome WebGPU) con provenienza incorporata ("Captured frame · Sep 2026 · Chrome WebGPU").
- RM / no-WebGPU / `device.lost`: lo still nello stesso riquadro; letture stampano "Renderer paused — reduced motion" / "Renderer not available on this device" / "Context lost — still frame"; nessun valore vivo simulato.
- Budget: l'unico renderer del sito; DPR cap 1,5 desktop / 1,0 mobile; 120.000 particelle desktop, **60.000** tier mobile (la lettura stampa il numero reale); pausa quando il riquadro esce dalla viewport (gate rAF esistente in `CanvasHost`/`WaterBallHero`), dispose al cambio route. Costo 3 g.

### E.6 `diagnosis` (`/`, `#phase-diagnosis`)
- Prove (tabella "Findings", colonne finding | fix | provenance): SphereNode · 6 access-control defects closed before public launch (unauthenticated Elite dashboard leak; tier leak exposing 206 live sessions and 79 transcripts; any member could edit or unpublish any course) · 33-finding security audit remediated in one batch — SphereNode · 21 scheduled jobs dead for weeks while dashboards reported success → root-caused, monitoring and alerting built — SphereNode · payments-to-entitlement rebuilt as a tested state machine → 5 revenue-critical defects closed — Maintech OMA · first database test suite exposed 3 live defects → fixed before production; high-severity privilege escalation on supplier credentials closed — Domus Tua · mobile delay traced to the cookie banner → intro rebuilt in CSS. Provenienza: "SerSan · 2026".
- Layout: tabella rigata a tre colonne, finding/fix `.f-body`, provenienza `.f-meta` grafite allineata a destra; mobile coppie etichetta/valore. Motion RULE-IN con stagger 40ms. Costo 1 g.

### E.7 `estimate` (`/`, `#phase-estimate`)
- Prove: gli 8 gruppi di skill + Languages da `skills.ts` (Core, Front-End, 3D & Graphics, Back-End & DB, AI, Cloud & DevOps, Testing & Tooling, Creative; Languages: Italian native · English B1, C1 in progress), colonna `Qty` = numero di voci del gruppo, colonna `Items` = elenco. **Nessun prezzo** (non è nel CV).
- Layout: tabella catalogo "Part group | Qty | Items", righe alterne `paper-field`; mobile gruppo su riga + voci a capo. Icon cloud e marquee **rifiutati**. Costo 0,5 g.

### E.8 `work-performed` (`/` prime 5 righe + "4 more line items ↓" verso `/work`; `/work` tutte e 9)
- Prove (colonne Item | Measured | Role | Client · period | Open): SphereNode — vertical SaaS | replaced 8 tools · 21 of 49 production releases · spherenode.com ↗ — Sphere AI — RAG mentor | 161-question eval · accuracy 52% → 68% — Maintech OMA — workshop ERP | 9 roles · 6-phase state machine · 10 supplier portals — sersan.io — studio site | 17 scroll-locked scenes · 48,000-particle wordmark · A11y 100 / SEO 100 — Domus Tua — brand platform | mobile LCP 4.75 s → 1.74 s · TBT 572 ms → 274 ms — SerSan identity & brand film | 64-second 4K film · 14 scenes — Badante24h — production PWA | sub-second PostGIS search · zero known auth vulnerabilities at launch · Sentry ×3 layers — Voice AI Agent for Microsoft Teams | (nessun numero: cella "—") — Agricultural Supply Chain Platform | 10 roles · team of 3 · GitHub ↗.
- Layout: tabella a tutta larghezza, righe 56px, numerali tabellari; le righe con sito pubblico (sersan.io, spherenode.com) hanno una cella-miniatura 160×100 con la **lente d'ispezione** al hover; le altre stampano "no photograph on file" in grafite. Mobile: cella a due righe, miniatura a tutta larghezza sotto, tap apre il sotto-modulo.
- Motion: RULE-IN; click riga → **GSAP Flip** (https://gsap.com/docs/v3/Plugins/Flip) del titolo verso l'intestazione del sotto-modulo durante la copertura di route (handshake `TransitionLink`/`CoverOverlay` mantenuto, artwork sostituito).
- Lente: **Aceternity Lens** (https://ui.aceternity.com/registry/lens.json) e Magic UI Lens studiati → ri-espressi senza dipendenze: copia 2× della stessa immagine sotto una `mask-image: radial-gradient(circle 90px at var(--lx) var(--ly), #000 98%, transparent)`, posizione via `gsap.quickTo` su `--lx/--ly` (80ms); su touch il tap apre la cattura a tutta larghezza. Codrops Flip gallery (https://tympanus.net/codrops/2026/07/30/…) studiato solo per il timing dell'handoff.
- Asset: catture Playwright `public/captures/{sersan-io,spherenode}-{1600,800}.webp`, etichetta "capture · Sep 2026" stampata nella cella; provenienza incorporata. Le vecchie still generate (`public/works/*.webp`) **non** si usano: sono astratte, non prodotto.
- RM: tabella statica, lente disattivata (click apre). Costo 2 g.

### E.9 `test-measured` (`/`, `#phase-test`)
- Prove (Item | Before | → | After | Provenance): Sphere AI · answer-policy accuracy 52% → 68% · 161-question bilingual set — over-answering 56% → 16% — clarification precision 75% → 94% — clarification recall 32% → 90% — unsupported claims 1.9% → 0.6% — citation correctness 100% — Domus Tua · mobile LCP 4.75 s → 1.74 s — TBT 572 ms → 274 ms — sersan.io · Lighthouse Accessibility 100 · SEO 100 — Badante24h · geospatial search sub-second · zero known auth vulnerabilities at launch — SphereNode · release manager for 21 of 49 production releases.
- Layout: Before/After tabellari a destra; freccia come path SVG 1,5px in `stamp`; **doppia barra rigata statica** proporzionale ai due valori (raise darkroom); mobile "Before → After" su una riga.
- Motion: RULE-IN; la freccia si disegna (`stroke-dashoffset`) 240ms dopo la riga — l'unica motion aggiuntiva. **Magic UI Number Ticker** (https://magicui.design/r/number-ticker.json) e transitions.dev 26 spinning-counter valutati e **rifiutati**; il pattern `CountUp` di `WorkCaseStudy` viene sostituito da celle statiche. Costo 1 g.

### E.10 `release` (`/` pieno; `/work`, `/about` compatto)
- Prove: "Hiring, or building something with WebGPU, motion or AI? Write to me." · "Email albertotuveri@gmail.com" · LinkedIn linkedin.com/in/albertotuveri · GitHub github.com/GitAlboBis · SerSan sersan.io · SphereNode spherenode.com.
- Layout: pannello giallo a tutta larghezza `min-height: 60vh`, headline `.f-headline` ink, email come grande link rigato ink (target 56px), cella RELEASED (timbro pieno) in alto a destra che atterra all'ingresso. Mobile impilato. Motion: STAMP una volta. Costo 0,5 g.

### E.11 `footer` (tutte)
- "© 2026 Alberto Tuveri" + i quattro link; riga di perforazione poi strip 64px. Nessuna coordinata, nessun "Ambient". Costo 0,25 g.

### E.12 `case-study-subform` (`/work/[slug]`)
- Contenuto per lavoro (da `works.ts`, testi Badante24h/DOIT/Agri **accorciati, non riscritti**; SerSan da PROPOSAL): Customer (org · period · role), Job (one-liner), Problem reported, Work performed (bullet del CV), Measured (`MeasuredRow`), Parts (stack come unità numerate con id `skills.ts`), Links (URL pubblico / repo / "URL: pending" / "Film link: pending"). Sphere AI e Maintech OMA aggiungono lo schema rigato SVG (raise zine). Voice AI Agent: nessun numero.
- Layout: foglio `paper` sfalsato 8px su `paper-carbon` (nessuna ombra); griglia campi a due colonne; cattura sotto la lente dove pubblica. Mobile una colonna.
- Motion: copertura foglio poi RULE-IN; Flip atterra il titolo; transitions.dev **07 panel-reveal** studiato solo per il timing dello stagger dei campi. RM statico. Costo 2 g (inclusa la revisione dati `works.ts` per Measured strutturato).

### E.13 `/about` — Owner
- Contenuto: ABOUT LEAD EN/IT (PROPOSAL) `.f-lead`; Experience 4 righe, Education 3 righe da `career.ts`; tesi (paragrafo keep); Languages; campo "Photograph: none on file" (PRODUCT §8.2). Nessuna Sardegna nel copy principale (§8.3 aperto).
- Layout: tabelle rigate a due colonne (keep), mobile impilato. Motion RULE-IN. Costo 1 g.

### E.14 `404`
- Ordine di lavoro vuoto con timbro `VOID` pieno e "No job order at this address." + cella "Job order ↖". Costo 0,25 g.

---

## F. HERO ENGINE — piano di ri-messa in scena (G4 rispettato)

**Fatto verificato:** la lettera "A" non è nei dati di spawn ma è un **campo di forze di confinamento sull'asse mediano** dentro `src/webgl/waterball/mls-mpm/g2p.wgsl.ts` (righe 103–160: `apex/lfoot/rfoot`, `closestOnSeg`, `halfW = 5.0`), cioè nel kernel del solver. Il solver non ha gravità verticale libera: la "vasca riempita dal basso" della card non è realizzabile senza sblocco G4. Il gate `heroStore.explode` (splash allo scroll) e `initFountain/initFromHomes` in `mls-mpm.ts` restano intatti.

**Decisione (due fasi, la prima è il build):**

**Fase A — spedita in questo build, solver intatto.** Il fluido in prova è la fluido confinata così com'è (la "A" è la forma di confinamento del campione), ma **ri-illuminato e ri-inquadrato come strumento**: il visitatore vede olio idraulico che gira in un banco incorniciato, non un logo sul tramonto. La didascalia lo dice onestamente: "Fluid under test — MLS-MPM · screen-space fluid · confined to a letter-A field · written against the WebGPU API". Il claim CV "held in the shape of a living letter A, with real-time refraction, foam" resta **vero**; il "sun glints" diventa "tube highlights" (una clausola).

Modifiche esatte (tutte render-side o di montaggio):
1. `src/webgl/waterball/render/fluid.wgsl.ts` — costanti: `SUN_COLOR vec3f(1.0,0.80,0.52) → vec3f(0.94,0.96,1.0)` (tubo fluorescente); `FOAM_COLOR vec3f(1.0,0.955,0.885) → vec3f(0.96,0.95,0.90)`; `diffuseColor vec3f(0.0,0.7375,0.95) → vec3f(0.79,0.54,0.16)` (olio ambra = token `oil`); `density 0.30 → 0.55`; `edgeCool vec3f(0.04,0.30,0.40) → vec3f(0.28,0.16,0.05)` rinominata `edgeDark`. Il ramo "sea reflection" (righe 189–219, `waterline`/`refl_strength`) resta compilato ma inattivo.
2. `src/webgl/waterball/WaterBallHero.tsx` — `renderUniformsViews.refl_strength.set([0])`; il wrapper riga 464 da `fixed inset-0` a `absolute inset-0` dentro il riquadro del banco; dimensioni canvas da `ResizeObserver` del riquadro (backing = box × DPR cap 1,5 / 1,0); `NUM_PARTICLES` (riga 39) diventa `particleCountForTier()` = 120000 desktop / 60000 mobile (`matchMedia("(max-width: 767px)")` o `navigator.hardwareConcurrency <= 4`); la camera (`camera.reset(INIT_DISTANCE, center, FOV, ZOOM_RATE)`) rifit per l'aspetto 760×540 (`INIT_BOX [80,60,18]` è 4:3, compatibile); `HeroScrollSettle` rimosso → `explode` resta 0 (percorso intatto, inutilizzato); **poke del puntatore mantenuto**. Frame time: media mobile 500ms dei delta `performance.now()` nel loop del motore, pubblicata in `heroStore.frameMs`; `onFirstFrame` → timbro LIVE; `device.lost` → still.
3. `src/webgl/CanvasHost.tsx` — via `SEA_GRADIENT`, `#sea-backdrop`, `SeaBackdrop`, video; resta il gate `pathname === "/"` e `navigator.gpu`; il componente ora rende dentro `TestBench` (slot), non `fixed`; backdrop = `paper-field` dal DOM, cornice 1px ink dal DOM.
4. `scripts/gen_workshop_cubemap.py` (fork di `gen_sunset_cubemap.py`, stesse dimensioni/ordine `[posx,negx,posy,negy,posz,negz]` caricati in `WaterBallHero.tsx:229-230`): pareti grigio neutro `#8d8d88` con una giuntura orizzontale tenue, soffitto `posy` `#b9b9b4` con due strisce tubo `#f2f4f8` (6% della faccia, falloff 8px), pavimento `negy` `#4f4f4c`; nessun disco solare. Sostituisce `public/cubemap/*.png`.
5. `src/webgl/store/heroStore.ts` — aggiunge `frameMs`, `particles`, `dpr`, `tier`, `status: "compiling" | "live" | "still" | "lost"`; rimuove ciò che serviva a marea/ink.
6. Fallback: `public/bench/tank-still-{1520,700}.webp` (cattura del motore reale, WP-7) nello stesso riquadro; letture con riga di motivo; parola `STILL` in ink.

**Fase B — dietro sblocco G4 (domanda aperta L.1):** sostituire in `g2p.wgsl.ts` l'asse mediano a 3 segmenti con un SDF di box (vasca 70% × 45% del sim box) mantenendo `inflate/restoreK/leash` identici; nessun altro parametro cambia. Se Alberto sblocca, la didascalia perde "confined to a letter-A field" e il CV va modificato di una clausola.

**Drone footage:** rimosso dal sito in ogni caso (`public/coast/**` e componenti `FilmScrub/CoastInterlude/AscentSurface`). La clausola CV "drone footage scrubbed frame-accurately to the scroll" e "simulated water with real caustics" diventano **non vere** → segnalate (L.2). "Lighthouse desktop 98/96/100/100" non si mostra finché non rimisurato sul nuovo build.

---

## G. NAV, MENU, TRANSIZIONI, 404, OG, FAVICON, PRELOADER

- **Nav = banda fasi** (una sola implementazione in `layout.tsx`, sostituisce `Nav`, `MenuOverlay`, `MenuToggle` e le due nav inline di `/about` e `/work`). Nessun hamburger, nessun overlay a schermo intero. Skip link "Skip to work performed" → `#phase-work`.
- **Transizioni di route:** meccanica `TransitionLink` → `CoverOverlay` → `RouteTransition` (`template.tsx`) mantenuta; artwork nuovo: foglio piatto `paper` che sale 420ms `sheet` con una riga ink che "stampa" verso il basso; niente onda, niente curtain sunset; durata totale ≤ 600ms; `Flip` porta il titolo della riga nell'intestazione del sotto-modulo. Gated sul preloader come oggi (`unlock/finish`), reduced-motion = swap 150ms.
- **Preloader:** "il modulo che si stampa" — header strip e banda si rigano dall'alto in 500ms, nessun contatore, nessun marchio; skip via il flag `sessionStorage` esistente; failsafe CSS mantenuto; contenuto testuale visibile al primo paint (il preloader copre, non blocca l'HTML).
- **404:** `src/app/not-found.tsx` con la banda, ordine vuoto, timbro VOID, "Job order ↖".
- **OG image** (`opengraph-image.tsx`, 1200×630, `next/og`): header strip, "Alberto Tuveri" wide, riga di ruolo, banda gialla con INTAKE timbrato; variante per `/work/[slug]` (`src/app/work/[slug]/opengraph-image.tsx`) con WORK timbrato e la cella Measured della riga. Font Archivo caricato in `next/og` dal file locale (`fetch` del woff2 nel route handler).
- **Favicon** (`icon.tsx`): quadrato giallo 32px, cornice 2px ink, quadratino timbro in basso a destra. `theme-color #f5f4ef`.
- **Metadata:** title "Alberto Tuveri — Software & AI Engineer · Creative Lead"; description EN/IT dalla PROPOSAL; JSON-LD `Person` con `jobTitle`, `worksFor` Sersan Limited, `alumniOf` University of Camerino, `affiliation` University of Trento, `sameAs` LinkedIn + GitHub; `html lang` segue il locale (`Smooth.tsx` lo imposta già → spostare in un `LocaleHtml` effetto minimale); sitemap con `/work`, i 9 slug, `/about`.

---

## H. COPY SKELETON (EN / IT) — stop-slop: niente citabili, niente eyebrow, niente numeri di sezione

| Chiave | EN | IT |
|---|---|---|
| `strip.employer` | Sersan Limited · London · Remote | Sersan Limited · Londra · da remoto |
| `strip.date` | Sep 2026 | Set 2026 |
| `strip.status` | Status · OPEN | Stato · APERTO |
| `header.caption` | Job order | Ordine di lavoro |
| `header.name` | Alberto Tuveri | Alberto Tuveri |
| `header.role1` / `role2` | Software & AI Engineer · Creative Lead / Full-Stack · WebGPU / 3D & Motion | (invariati, regola: i ruoli restano EN) |
| `header.degree` | B.Sc. Computer Science, University of Camerino, 2026 · M.Sc. Artificial Intelligence Systems, University of Trento, in progress | Laurea triennale in Informatica, Università di Camerino, 2026 · Laurea magistrale in Artificial Intelligence Systems, Università di Trento, in corso |
| `phases` | Intake · Diagnosis · Estimate · Work · Test · Release | Accettazione · Diagnosi · Preventivo · Lavorazione · Collaudo · Consegna |
| `phases.roleTags` | Engineer · Engineer · Full-Stack · Creative Lead · Engineer · Contact | (EN) |
| `band.counter` | {n} / 6 | {n} / 6 |
| `band.email` | Email | Email |
| `band.back` | Job order ↖ | Ordine di lavoro ↖ |
| `intake.ownerCaption` | Owner | Titolare |
| `intake.positioning` | I own the front-end, 3D and motion layer of everything SerSan ships, and the AI layer of its live trading platform. | Costruisco il front-end, il livello 3D e motion di tutto ciò che SerSan mette in produzione, e la parte AI della sua piattaforma di trading live. |
| `intake.currentCaption` | Current work | Incarichi attuali |
| `bench.caption` | Test bench | Banco prova |
| `bench.figure` | Fluid under test — MLS-MPM · screen-space fluid · confined to a letter-A field · written against the WebGPU API | Fluido in prova — MLS-MPM · screen-space fluid · confinato in un campo a forma di A · scritto direttamente contro l'API WebGPU |
| `bench.readouts` | Particles · Solver · Render · Frame · DPR · Tier | Particelle · Solver · Render · Frame · DPR · Tier |
| `bench.tier` | Desktop / Mobile | Desktop / Mobile |
| `bench.live` / `bench.still` | LIVE / STILL | LIVE / STILL |
| `bench.reasonNoGpu` | Renderer not available on this device | Renderer non disponibile su questo dispositivo |
| `bench.reasonReduced` | Renderer paused — reduced motion | Renderer in pausa — movimento ridotto |
| `bench.reasonLost` | Context lost — still frame | Contesto perso — fotogramma fisso |
| `bench.compiling` | Compiling pipelines… | Compilazione delle pipeline… |
| `diagnosis.caption` | Findings | Rilievi |
| `diagnosis.cols` | Finding · Fix · Source | Rilievo · Intervento · Fonte |
| `estimate.caption` | Parts catalogue | Distinta ricambi |
| `estimate.cols` | Part group · Qty · Items | Gruppo · Q.tà · Voci |
| `work.caption` | Work performed | Lavori eseguiti |
| `work.cols` | Item · Measured · Role · Client · period · Open | Voce · Misurato · Ruolo · Cliente · periodo · Apri |
| `work.more` | 4 more line items | Altre 4 voci |
| `work.noPhoto` | no photograph on file | nessuna fotografia agli atti |
| `work.captureLabel` | capture · Sep 2026 | cattura · set 2026 |
| `work.indexTitle` | Things I've built | Cose che ho costruito |
| `measured.caption` | Measured | Misurato |
| `measured.cols` | Item · Before · After · Source | Voce · Prima · Dopo · Fonte |
| `subform.fields` | Customer · Job · Problem reported · Work performed · Measured · Parts · Links | Cliente · Lavoro · Problema segnalato · Lavori eseguiti · Misurato · Ricambi · Link |
| `subform.pendingUrl` / `pendingFilm` | URL: pending / Film link: pending | URL: in attesa / Link al film: in attesa |
| `subform.next` | Next line item | Voce successiva |
| `release.caption` | Release | Consegna |
| `release.headline` | Hiring, or building something with WebGPU, motion or AI? Write to me. | Stai assumendo, o vuoi costruire qualcosa con WebGPU, motion o AI? Scrivimi. |
| `release.cta` | Email albertotuveri@gmail.com | Scrivi a albertotuveri@gmail.com |
| `release.links` | LinkedIn · GitHub · SerSan · SphereNode | (invariati) |
| `release.stamp` | RELEASED | CONSEGNATO |
| `about.captions` | Owner · Summary · Experience · Education · Thesis · Languages · Photograph | Titolare · Profilo · Esperienza · Formazione · Tesi triennale · Lingue · Fotografia |
| `about.noPhoto` | none on file | nessuna agli atti |
| `footer.copyright` | © 2026 Alberto Tuveri | © 2026 Alberto Tuveri |
| `notFound.title` / `stamp` | No job order at this address. / VOID | Nessun ordine di lavoro a questo indirizzo. / ANNULLATO |
| `a11y.skip` | Skip to work performed | Vai ai lavori eseguiti |
| `meta.title` | Alberto Tuveri — Software & AI Engineer · Creative Lead | (invariato) |
| `meta.description` | Software & AI engineer and Creative Lead at SerSan: front-end, WebGPU/3D and motion for production platforms, the AI layer of a live trading platform, brand identity and film. | Software & AI engineer e Creative Lead in SerSan: front-end, WebGPU/3D e motion per piattaforme in produzione, la parte AI di una piattaforma di trading live, identità di marca e film. |

Works PARC: hook, Problem/Action/Result, Measured e Parts per i 9 lavori vengono dalle righe PROPOSAL WORK 1–8 (+ Agri) già trasposte in `works.ts` (commit `03575f2`); nessuna riscrittura, solo la struttura `{before, after}` (§I).

---

## I. CONTENT MODEL — modifiche

- **`src/content/dict.ts`**: sezioni nuove `strip`, `header`, `phases`, `band`, `intake`, `bench`, `diagnosis`, `estimate`, `work`, `measured`, `subform`, `release`, `about`, `footer`, `notFound`, `a11y`, `meta` (tutte le chiavi di §H); rimosse `coast`, `ascent`, `tech`, `hero` (vecchio), `contact` (vecchio), `nav` (vecchio), chiavi morte `hero.eyebrow`, `journey.more`. Shape EN ≡ IT validata zod come oggi.
- **`src/content/works.ts`**: `WorkMetric` → `{ label: Localized; before?: string; after?: string; value?: string; unit?: Localized; source: Localized }` (un `MeasuredRow` unico); nuovo campo `phaseRole: "Engineer" | "Creative Lead" | "Full-Stack"`; `textureSrc` → `capture?: { src: string; label: Localized; width: number; height: number }` valorizzato solo per `sersan-io` e `spherenode`; `links` con `pending?: "url" | "film"` per Domus Tua e brand film; `schematic?: "rag" | "job-order"` per `sphere-ai` e `maintech-oma`; `status: "provisional"` e il ramo WIP **rimossi** (9 lavori confermati). Slug invariati.
- **`src/content/findings.ts`** (nuovo): righe della tabella Diagnosis `{ work: slug; finding: Localized; fix: Localized; source: Localized }` — solo i fatti di §E.6.
- **`src/data/skills.ts`**: invariato (8 gruppi + `languages`); `iconable` e `src/data/skill-icons.ts` rimossi (niente loghi).
- **`src/content/career.ts`**: invariato (`identity`, `experience`, `education`, `links`, `linkList`).
- **`src/lib/site.ts`**: `siteName`, `title`, `description` EN/IT, `ogLocale` per locale; `NEXT_PUBLIC_SITE_URL` invariato.
- **`src/content/tokens.ts`**: solo la palette di §C.1 + `oil` per il WGSL; `sunsetStops`, `defaultMood`, `Mood` rimossi.

---

## J. WORK PACKAGES (proprietà file disgiunta; branch `feat/redesign-2026-09`, un WP = un commit atomico)

Gate visivo comune (ogni WP): `npm run dev` → `node scripts/visual-gate.mjs <wp> [route…]` (pattern del probe `_shoot.mjs`: Playwright, 1440×900 + 390×844 DPR3, `IGNORE` list, salto sezioni via `window.__lenis.scrollTo(…, {immediate:true})`, screenshot in `.shots/<wp>-{desktop,mobile}-<section>.png`, **0 errori console**), poi `npm run typecheck` e `npm run build` (da `C:\Users\alber\Portfolio` con la maiuscola: casing note in memoria). Nessun "fatto" senza screenshot.

| WP | Titolo | File (crea/modifica/**elimina**) | Dipende da | Accettazione |
|---|---|---|---|---|
| **WP-0** | Fondazione: token, font, shell, gate | `src/app/globals.css` (riscritto: `@theme` §C.1, `:root` §C.4–C.6, `@layer components` §C.3, nessun CSS di effetto); `src/content/tokens.ts`; `src/lib/motion.ts`; `src/lib/gsap.ts` (CustomEase `rule/stamp/sheet`); `src/app/layout.tsx` (Archivo `axes:["wdth"]`, monta solo Preloader · Smooth · CoverOverlay · PhaseBand slot · children · JSON-LD; via Cursor/SoundScape/TideEgg/Warmup/ScrollProgress/CanvasHost dal layout); `src/app/_providers/Smooth.tsx` (solo lang sync + Lenis); `scripts/visual-gate.mjs` (nuovo); `src/lib/use-hydrated.ts` (locale dietro `useHydrated`) | — | `/styleguide` provvisorio renderizza i token; Archivo con asse wdth visibile (verifica `font-variation-settings` a 75 e 125 nello screenshot); typecheck/build verdi; gate 1440+390 console pulita |
| **WP-1** | Contenuto | `src/content/dict.ts`; `src/content/works.ts` (struttura §I); `src/content/findings.ts` (nuovo); `src/lib/site.ts`; **elimina** `src/data/skill-icons.ts` | — | zod passa in dev EN≡IT; ogni numero rintracciabile in `PRODUCT.md` §3/§9 (script `node scripts/check-claims.mjs` opzionale: grep dei numeri contro §9); nessuna stringa hardcoded nei componenti |
| **WP-2** | Chrome del foglio: banda fasi, header strip, primitive | `src/components/sheet/HeaderStrip.tsx`, `PhaseBand.tsx`, `usePhaseStamps.ts`, `Stamp.tsx`, `Field.tsx`, `Perforation.tsx`, `RuleIn.tsx`, `LocaleToggle.tsx`; `src/lib/phases.ts`; `src/app/not-found.tsx` | WP-0, WP-1 | banda sticky su tutte le route; STAMP cumulativo verificato con screenshot a 3 fasi (`1/6`, `3/6`, `6/6`); `aria-current`; focus ring ink sul giallo; mobile tab scorrevole con snap; RM: tutti timbrati; console pulita |
| **WP-3** | Banco prova (motore) | `src/webgl/CanvasHost.tsx`; `src/webgl/waterball/WaterBallHero.tsx`; `src/webgl/waterball/render/fluid.wgsl.ts`; `src/webgl/waterball/camera.ts` (solo fit); `src/webgl/store/heroStore.ts`; `scripts/gen_workshop_cubemap.py` (nuovo); `public/cubemap/*.png`; `src/components/bench/TestBench.tsx`, `BenchReadouts.tsx`; **elimina** `src/components/hero/**`, `src/components/atmosphere/SeaBackdrop.tsx`, `src/webgl/artwork.ts`, `scripts/gen_sunset_cubemap.py`. **Intoccabili:** `src/webgl/waterball/mls-mpm/**`, `common.ts` (solo lettura) | WP-0, WP-1 | fluido ambra dentro il riquadro 760×540 / 350×230, nessun testo sopra; letture reali (screenshot con `Frame` che cambia tra due catture; `Particles 60,000` su mobile); LIVE al primo frame; no-WebGPU (Playwright headless senza `--enable-unsafe-webgpu`) → STILL + motivo; RM → still; 60fps desktop (`frameMs` medio ≤ 16,7 su Chrome WebGPU); dispose al cambio route (nessun leak: `device` distrutto); diff `git diff --stat src/webgl/waterball/mls-mpm` = 0 |
| **WP-4** | Sezioni home | `src/app/page.tsx`; `src/components/sections/Intake.tsx`, `Diagnosis.tsx`, `Estimate.tsx`, `Measured.tsx`, `MeasuredRow.tsx`, `Release.tsx`; `src/components/work/WorkTable.tsx` (condiviso), `Loupe.tsx`; `src/components/footer/Footer.tsx` (riscritto); **elimina** `src/components/sections/{About,Tech,Contact}.tsx`, `src/components/tech-cloud.tsx`, `src/components/home/**`, `src/components/footer/TideEbb.tsx` | WP-2, WP-3 | prima viewport = §A FIRST VIEWPORT (screenshot 1440×900 confrontato riga per riga: strip, nome 88px, banda, banco, 5 righe, Email); Measured senza count-up (screenshot immediato = valori finali); lente attiva solo sulle 2 catture; tabelle a coppie etichetta/valore a 390; console pulita |
| **WP-5** | `/work`, `/work/[slug]`, `/about` | `src/app/work/page.tsx`, `src/app/work/[slug]/page.tsx`, `src/app/about/page.tsx`; `src/components/work/WorkIndex.tsx` (riscritto), `WorkCaseStudy.tsx` (riscritto come `SubForm`), `Schematic.tsx` (nuovo, SVG rigato); `src/components/about/AboutJourney.tsx`, `JourneyTimeline.tsx`; **elimina** `src/components/work/{WorkHorizontal,WorkRunwayCanvas,DetailCut}.tsx`, `src/components/works/**` | WP-2, WP-4 | 9 slug SSG in `next build`; sotto-modulo su `paper-carbon` con foglio sfalsato 8px; campi `pending` stampati; nessun renderer montato (nessun `<canvas>` nel DOM); `/about` righe = `career.ts`; screenshot 1440+390 di `/work`, `/work/sphere-ai`, `/work/sersan-io`, `/about`; console pulita |
| **WP-6** | Transizioni, preloader, OG, favicon, SEO | `src/app/template.tsx`; `src/components/transition/{RouteTransition,CoverOverlay,TransitionLink}.tsx`; `src/lib/curtain.ts` → `src/lib/sheet.ts`; `src/components/Preloader.tsx`; `src/app/opengraph-image.tsx`, `src/app/work/[slug]/opengraph-image.tsx` (nuovo), `src/app/icon.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`; `src/store/ui.ts` (via `soundEnabled`, `menuOpen`; chiave `ocean-ui` **invariata**) | WP-2 | copertura ≤ 600ms, Flip del titolo riga → sotto-modulo (video/gif Playwright o 3 frame); preloader 500ms senza contatore, skip su seconda visita; OG 1200×630 renderizzato (`/opengraph-image` aperto e screenshot); sitemap con 12 URL; RM swap 150ms; console pulita |
| **WP-7** | Catture e asset con provenienza | `scripts/capture-sites.mjs` (nuovo: Playwright su sersan.io e spherenode.com, 1600 e 800, WebP ≤ 200KB, `waitUntil networkidle`, cookie declinati); `scripts/capture-bench.mjs` (nuovo: Chrome `--enable-unsafe-webgpu` sul dev server, cattura del riquadro a 1520 e 700); `public/captures/*`, `public/bench/*`; **elimina** `public/coast/**`, `public/works/*.webp` | WP-3 (per il bench) | ogni raster con prompt/origine incorporati (`impeccable embed-prompt --scan public/captures public/bench` senza segnalazioni); etichetta "capture · Sep 2026" nel DOM accanto a ogni cattura; peso totale asset home < 1,2 MB |
| **WP-8** | Styleguide vivo | `src/app/styleguide/page.tsx` | WP-0, WP-1 | bilingue via dict; chip con hex + ratio calcolato a runtime (funzione in `src/lib/contrast.ts`, nuovo); tutte le coppie §C.2 ≥ 4,5 riportate in tabella; screenshot |
| **WP-9** | Pulizia | **elimina** `src/components/atmosphere/**`, `src/components/cursor/**`, `src/components/sound/**`, `src/components/motion/{BorderBeam,DriftBand,Marquee,Parallax,Magnetic,TideEgg,Appear,CountUp}.tsx`, `src/components/reveal/**`, `src/components/nav/**`, `src/components/Warmup.tsx`, `src/lib/{sound,wave,scroll-choreo,warm}.ts`, `DESIGN-SYSTEM.md`, `IMPLEMENTATION-PLAN.md`, `WATER-WAVE-PLAN.md`, `docs/0*.md` (storici, spostati in `docs/archive/`), `design-system/**`, `bun.lock`, i 40 probe `_*.mjs` alla root (spostati in `scripts/probes/` o cancellati), `.shots/` in `.gitignore` | WP-4, WP-5, WP-6 | `npm run typecheck` e `next build` verdi senza import morti; `grep -r "ocean\|sunset\|tide\|marea" src` = solo la chiave `ocean-ui`; nessun `@keyframes` di effetto in `globals.css` |
| **WP-10** | Finish: review, a11y, perf, DESIGN.md | `.impeccable/review/{desktop,mobile}.png`; `DESIGN.md` (nuovo, dal mondo costruito), `.impeccable/design.json`; `CLAUDE.md`, `HANDOFF.md`, `PLAN.md` (riscritti al nuovo mondo); `README` del CV note | tutti | `impeccable detect --json` sui target senza tell meccanici; finish reviewer spawn con contratto §A + screenshot + craft-floor; verdetto riportato con la sua parola; axe (probe `_axe_tmp.mjs` pattern) 0 violazioni serious; Lighthouse mobile ≥ 80 su `/` (tier mobile) e ≥ 90 sulle sub-route; AA su tutte le coppie; EN/IT parità (flip locale screenshot di ogni route); ogni raster con provenienza; DESIGN.md con token e `.impeccable/design.json` |

Parallelismo: WP-0 ‖ WP-1 → WP-2 ‖ WP-3 ‖ WP-7(siti) ‖ WP-8 → WP-4 → WP-5 ‖ WP-6 → WP-7(bench) → WP-9 → WP-10. Ogni sub-agente passa comunque il gate visivo (regola d'oro).

---

## K. CLEANUP (elenco completo, eseguito in WP-9 salvo dove indicato)

- Atmosfere morte: `src/components/atmosphere/**` (Escort, GoldenHaze, GoldenMotes, Murmuration*, NightSky, SeaBackdrop, ShallowWater, TornEdge), `src/components/home/**` (AscentSurface, CoastInterlude, FilmScrub, Nightfall), `src/components/hero/**`, `src/components/footer/TideEbb.tsx`, `src/components/reveal/**` (DrawLine, DualWaveText, FlipText, ScrollText, ScrollWords, ShimmerText, TideReveal, TideSurge, WordGenerate), `src/components/motion/*` salvo `LazyOnView.tsx` e `RollLink.tsx` (valutare: il `.link` con sottolineatura 1→2px sostituisce RollLink → eliminare), `src/components/cursor/Cursor.tsx`, `src/components/sound/SoundScape.tsx`, `TideEgg.tsx`, `Warmup.tsx`, `tech-cloud.tsx`, `data/skill-icons.ts`, `webgl/artwork.ts`, `lib/{sound,wave,scroll-choreo,warm,curtain}.ts`.
- Asset: `public/coast/**` (~25 MB di mp4 + still), `public/works/*.webp` (still generate astratte), `public/cubemap/*` (sostituita), `public/frames/*` (già rimossa in `03575f2`; verificare che la cartella sia vuota).
- CSS legacy: le ~370 righe di effetti (`.cc-*`, motes, glint, ascent, tide, preloader vecchio, flip-word), 12 `@keyframes`, il kill-switch RM globale, lo scope `.night`, la variante `night` del Button, `--gradient-sunset`, le classi `.t-*` con colore incorporato, `.glass`, `.eyebrow-tick`, `.rule-node`.
- Doc stale: `DESIGN-SYSTEM.md` (Ocean v1), `IMPLEMENTATION-PLAN.md`, `WATER-WAVE-PLAN.md`, `docs/*` (→ `docs/archive/`), `design-system/**` (card Golden Hour), commenti "Fraunces/Hanken" e "golden hour" in `layout.tsx`; `CLAUDE.md`/`HANDOFF.md`/`PLAN.md` riscritti in WP-10.
- Repo hygiene: 40 script `_*.mjs` non tracciati alla root → `scripts/probes/` (o cancellati), `.shots/` ignorato, `bun.lock` + `trustedDependencies` rimossi (npm), `skills-lock.json` valutato.
- Store: `soundEnabled`, `menuOpen`, `activeWork` rimossi da `src/store/ui.ts`; chiave `ocean-ui` mantenuta (nessuna migrazione).

---

## L. DOMANDE APERTE PER ALBERTO (buchi dichiarati, non inventati)

1. **G4 — sblocco del confinamento** in `g2p.wgsl.ts` per la Fase B (vasca rettangolare al posto dell'asse mediano della "A")? La Fase A spedisce con la "A" come campo di confinamento, ri-illuminata a olio.
2. **CV — voce "Personal Portfolio":** "sun glints" → "tube highlights"; "drone footage scrubbed to the scroll", "simulated water with real caustics" e "Lighthouse desktop 98/96/100/100" **non sono più veri** sul nuovo sito → da rimuovere/rimisurare (PRODUCT §8.5). Se sblocchi G4, anche "held in the shape of a living letter A" cambia.
3. **Media mancanti** (PRODUCT §8.1): still o link per Maintech OMA, Domus Tua (URL pubblico?), brand film (link/embed, NDA §8.4), Badante24h (URL di produzione?). Finché mancano, le righe stampano "no photograph on file" / "URL: pending" / "Film link: pending".
4. **Ritratto** (§8.2): il campo "Photograph" su `/about` stampa "none on file" finché non ne fornisci uno, o conferma "nessun volto".
5. **Sardegna** (§8.3): nessun accenno nel copy principale; vuoi una riga biografica su `/about` (Iglesias, diploma e stage sono nel CV)?
6. **Framer Motion** compare nelle skill del CV: sul sito è elencato come skill (fatto del CV) ma non usato (vincolo stack) — ok?
7. **Voice AI Agent**: nessun numero nel CV → la cella Measured stampa "—". Vuoi aggiungere un dato verificabile?
