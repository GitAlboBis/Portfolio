# 00 — Product Requirements Document (PRD)

> Scopo: definire COSA deve essere il portfolio di Alberto Tuveri (visione, audience, narrativa, content model, requisiti, criteri di successo, scope) prima ancora di decidere COME costruirlo. Questo file e la fonte di verita sul "prodotto"; il "come" tecnico vive in `docs/01-TECHSTACK.md`, `docs/03-ARCHITECTURE.md` e nei doc 3D/cinematica. Ogni agente AI che lavora al sito deve leggere questo documento prima di scrivere codice.

> Aggiornato 2026-06-27 per riflettere il codice (hero MLS-MPM WebGPU + cinematica frame-sequence fusa nell'hero). Riconciliato dal loop docs-driven-build.

---

## 0. Come leggere questo documento

- La prosa e in ITALIANO (la legge Alberto e la leggono gli agenti). Tutto cio che e codice, identificatori, nomi di file/componenti, token di design e COPY del sito e in INGLESE.
- Le sezioni "Requisiti" usano parole vincolanti: DEVE (requisito obbligatorio), DOVREBBE (forte raccomandazione), PUO (opzionale).
- I cross-reference puntano sempre ai path del MANIFEST (vedi sezione finale "Cross-reference").
- Quando un dato e marcato `PROVVISORIO` significa che va confermato con Alberto prima del lancio (vedi sezione 11 "Open questions").

---

## 1. Visione e obiettivo

Il portfolio e un'esperienza web immersiva, single-page, scroll-driven, a tema MARE/OCEANO della Sardegna, con qualita visiva da **Awwwards Site of the Day** (riferimento di livello: `lusion.co`).

L'obiettivo di prodotto e UNO e misurabile: **in meno di 10 secondi dal primo paint, chi atterra sul sito deve percepire Alberto Tuveri come un Software Engineer full-stack + AI di alto livello, e ricordarsi del sito.** Il "colpo d'occhio" e la lettera `A` ad acqua reale renderizzata in WebGPU (fluido MLS-MPM con render Screen-Space-Fluid, vedi `docs/04-3D-HERO-WATER-LOGO.md`) sospesa sopra la cinematica di Pan di Zucchero (frame-sequence fusa nell'hero, vedi `docs/05-CINEMATIC-SCROLL.md`); insieme raccontano in modo non verbale "questa persona sa costruire cose difficili e ha gusto".

Obiettivi specifici, in ordine di priorita:

1. **Credibilita tecnica.** Dimostrare competenza full-stack + AI integration tramite la qualita stessa dell'artefatto (3D real-time, WebGPU, performance, accessibilita) e tramite le schede progetto (`Badante24h`, DOIT voice AI agent, Sersan, academic supply chain).
2. **Memorabilita.** Identita visiva forte e coerente (oceano Sardegna) che differenzia Alberto dai portfolio generici "Next.js + Tailwind template".
3. **Conversione.** Rendere ovvio e a basso attrito il passo successivo: contattare Alberto (email, LinkedIn) o vedere il lavoro in dettaglio.
4. **Racconto personale.** Legare la persona al luogo (Iglesias / Masua / Pan di Zucchero, Sulcis-Iglesiente) senza scadere nel diario: il mare e metafora, non decorazione fine a se stessa.

Non-obiettivo di questa visione: NON e un sito "tech demo" fine a se stesso. Ogni effetto deve servire il messaggio "assumimi / lavora con me". Se un effetto costa 60fps o l'accessibilita, l'effetto perde.

---

## 2. Audience

Tre profili primari, da progettare esplicitamente:

| Profilo | Chi e | Cosa cerca in <60s | Implicazione di design |
| --- | --- | --- | --- |
| **Recruiter tech internazionale** | Talent / technical recruiter, anche non madrelingua IT | Ruolo, stack, seniority, link a codice/LinkedIn, prova di consegna in produzione | Copy EN di default chiaro; stack scannabile (S5); progetti con metriche; contatti sempre raggiungibili |
| **CTO / founder di studio AI** | Decisore tecnico (es. profilo come SerSan) | Profondita reale: WebGPU/GPGPU, AI orchestration, sicurezza, qualita ingegneristica | L'artefatto stesso e la prova; schede progetto con problema/azione/risultato; tesi su agentic security come segnale |
| **Cliente freelance** | PMI / studio che vuole un prodotto (PWA, web app) | Affidabilita, esempi simili al suo bisogno, "puo consegnare?" | `Badante24h` come case di produzione end-to-end; CTA "Get in touch" sempre visibile |

Vincoli derivati dall'audience:
- **Bilingue EN/IT obbligatorio.** Lingua di default EN (audience internazionale); toggle a IT. Vedi content model (sez. 6) e `docs/03-ARCHITECTURE.md` per l'i18n.
- **Mobile reale.** Recruiter aprono link da telefono. Il sito DEVE degradare con eleganza su mobile (vedi sez. 7 e `docs/01-TECHSTACK.md`).
- **Tempo di attenzione corto.** Il valore va comunicato anche a chi NON scrolla fino in fondo: hero + prima piega devono gia dire chi e Alberto.

---

## 3. Tono e personalita

- **Voce del sito (copy EN/IT):** sicura ma non arrogante; tecnica ma leggibile; calda nel racconto personale, asciutta nelle metriche. Frasi brevi. Verbi concreti (built, shipped, designed, secured), non aggettivi vuoti.
- **Personalita visiva:** cinematografica, profonda, "premium". Dark-first oceanico. Movimento intenzionale e ingegnerizzato, mai gratuito. Silenzi e spazio negativo ammessi: l'eleganza sta anche in cio che NON si muove.
- **Antipattern da evitare nel copy:** buzzword AI generiche ("synergy", "cutting-edge", "passionate about technology"), muri di testo, esclamativi, emoji nel copy del sito.
- **Riferimento di gusto:** Lusion (profondita, materia, restraint). La guida estetica completa e in `docs/02-DESIGN.md`; le reference di studio (non da copiare) in `docs/06-REFERENCES.md`.

---

## 4. Narrativa scroll — sezione per sezione (S1..S6)

Esperienza principale: una long-page immersiva guidata dallo scroll virtualizzato (Lenis guida le transizioni di scena, non l'altezza del DOM; vedi `docs/03-ARCHITECTURE.md`). Lo sfondo visivo e composito (gradiente CSS "sea" + `VideoBackdrop` su canvas 2D + `WaterBallHero` su WebGPU raw), NON un Canvas R3F persistente. La mappa scena<->sezione e dettagliata in `docs/03-ARCHITECTURE.md`.

> Nota architetturale (codice): S1 HERO e S3 CINEMATICA sono **fusi in un'unica sezione pinnata** (`src/components/sections/hero.tsx`, sticky ~600vh con timeline GSAP scrubbata). Non esiste piu una sezione cinematica autonoma. Il modello narrativo qui sotto resta valido a livello di prodotto (cosa percepisce l'utente), ma la cinematica e implementata come beat interno all'hero, non come scena separata.

### S1 — HERO

- **Scopo:** colpo d'occhio + identita in <10s. E la sezione che "vende" l'intero sito.
- **Contenuto:** la lettera `A` resa come **acqua reale** — fluido MLS-MPM su WebGPU (vendorizzato da `matsuoka-601/WaterBall` in `src/webgl/waterball/`), riempita proceduralmente via `initFromHomes()` (tre tratti a capsula sull'asse medio della `A`; nessun GLB caricato a runtime), con render chain Screen-Space-Fluid (depth -> bilateral -> thickness -> gaussian -> fluid), reflect/refract su cubemap, composito premultiplied sopra la footage. Il mark e la sola lettera `A` (non `AT/A`). Titolo liquido (`LiquidText`): `Portfolio` poi `Alberto Tuveri`. Ruolo: `Software Engineer — Full-Stack & AI`. Tagline marina breve (EN/IT). Cue di scroll (`Scroll to dive`). NB: **nessuna CTA inline** `View work` / `Get in touch` nell'hero — le CTA vivono in nav (`Get in touch`) e nel footer S6.
- **Cosa succede allo scroll:** una sola timeline GSAP scrubbata scrive `heroStore` (`explode` / `reveal` / `video`) che i tre layer leggono. Beat: entry (la `A` d'acqua sul primo frame) -> ~8-24% **explode** (la `A` "scoppia" sulla footage e svanisce) -> ~24-56% la footage scrubba da sola (il beat cinematico) -> ~56-86% **reveal** (`Portfolio` poi `Alberto Tuveri` emergono dall'acqua) -> ~86-100% hold del title card prima dell'unpin. La fisica del fluido e un motore velocity-based (inflate/gravity/restore/speedGate/leashRadius confinato sull'asse medio della `A`); parametri **live-tuned via leva, soggetti a sign-off GATE-6**. Dettaglio fisica/shading/tier in `docs/04-3D-HERO-WATER-LOGO.md`.
- **Done-when (sezione):** 60fps desktop sull'hero; `prefers-reduced-motion` congela un frame centrale della sequenza (~0.5) e mostra il title card statico; cue/contenuto accessibili da tastiera.
- **Fallback (codice):** l'hero WebGPU e **WebGPU-only**. In assenza di `navigator.gpu`, `WaterBallHero` ritorna `null` e resta visibile il solo gradiente "sea" CSS (in `CanvasHost`). **Non esiste un path WebGL2.** Questo aggiorna i requisiti storici "doppio backend / fallback WebGL2": vedi nota in sez. 7.1.

### S2 — INTRO / ABOUT

- **Scopo:** dare un volto e una storia al talento tecnico.
- **Contenuto:** chi e Alberto in poche frasi — full-stack + AI engineer, dalla Sardegna (Iglesias) a Camerino (Marche). Tono personale ma professionale. Eventuale richiamo testuale al legame con il mare/Pan di Zucchero come ponte verso S3. Fonte biografica: `docs/07-PROJECTS.md`.
- **Cosa succede allo scroll:** reveal del testo con split-text GSAP (parole/righe che emergono dal "fondo"); parallax leggero; lo sfondo WebGL transita dalla dispersione dell'hero verso un tono d'acqua piu calmo/profondo che prepara la cinematica.
- **Done-when:** testo leggibile da screen reader nell'ordine corretto; nessun layout shift; reveal disattivato in reduced-motion.

### S3 — CINEMATICA (fusa nell'hero)

> Stato (codice): NON e piu una sezione standalone. La cinematica e il beat centrale dell'hero pinnato (sez. S1). `cinematic-placeholder.tsx` e stato eliminato; non esiste zoom-into-clip ne overlay WebGL VideoPlane.

- **Scopo:** picco emotivo e firma del sito. Lega persona + luogo + abilita.
- **Contenuto:** sequenza immersiva di **Pan di Zucchero** (Masua) scrubbata dallo scroll. Implementata come **frame-sequence WebP**: 136 frame `public/frames/f_000.webp` … `f_135.webp` disegnati su un canvas 2D in `src/components/video-backdrop.tsx`, indicizzati da `heroStore.video` (preload con concorrenza 6, DPR clampato a 1.5). La `A` d'acqua "scoppia" sopra la footage durante il beat explode. NB: gli mp4 raw Higgsfield in `public/video/` (`hf_20260624_*.mp4`) sono **source-only** (untracked), non serviti a runtime; la sorgente di verita renderizzata e la sequenza WebP.
- **Cosa succede allo scroll:** lo scroll fa da timeline (scrub) sulla frame-sequence dal primo movimento; la `A` d'acqua esplode e svanisce, poi la footage scrubba da sola, poi emerge il title card. Nessuna transizione-zoom in un secondo clip. Spec completa (scrub, preload, fallback) in `docs/05-CINEMATIC-SCROLL.md`.
- **Done-when:** su `prefers-reduced-motion` la sequenza e congelata su un frame centrale (~0.5) — nessun autoplay pesante; nessun blocco dello scroll; budget di rete rispettato (preload limitato).

### S4 — WORK / PROJECTS

- **Scopo:** la prova. Trasformare la percezione in evidenza verificabile.
- **Contenuto:** card progetto con formato **ruolo -> problema/azione/risultato -> stack -> metriche**. Progetti, in ordine:
  1. **Badante24h** (ALS MCL Civitanova) — PWA di produzione, matching famiglie<->caregiver. Offline (Serwist), Web Push VAPID, realtime Supabase, ricerca geospaziale PostGIS sub-secondo, hardening RLS/RBAC/CSP, Sentry 3-layer.
  2. **DOIT voice AI agent** (DOIT S.r.l / Lodestar) — Voice AI per Microsoft Teams, gestione appuntamenti hands-free; Azure Speech + Copilot Studio + Power Automate; front-end Angular pro-code.
  3. **Sersan projects** — 2 progetti (dettagli `PROVVISORIO`, da confermare con Alberto). Mostrare come placeholder credibili finche non definiti.
  4. **Agricultural Supply Chain Platform** (academic) — Java/Spring, 10 ruoli, GoF/UML, team di 3.
  - Dettaglio completo dei contenuti in `docs/07-PROJECTS.md`. Schema dati in sez. 6.
- **Cosa succede allo scroll:** le card entrano con reveal sequenziale; possibile pinning leggero per "tenere" una card mentre si scrollano i dettagli; hover magnetico sui CTA delle card. Eventuale route di dettaglio `/work/[slug]` (vedi sez. 5).
- **Done-when:** ogni card ha ruolo, stack e almeno una metrica; navigabile da tastiera; leggibile senza JS-motion.

### S5 — SKILLS / STACK

- **Scopo:** scansione rapida della competenza tecnica per recruiter/CTO.
- **Contenuto:** competenze raggruppate (vedi sez. 6 per il modello dati): `Core`, `Front-End`, `Back-End / DB`, `Cloud / DevOps`, `AI`. Resa pulita, tipografica (mono per le label), niente "barre percentuali" finte.
- **Cosa succede allo scroll:** reveal a gruppi; micro-animazioni discrete; nessun effetto che ostacoli la lettura.
- **Done-when:** lista completa, ordinata per rilevanza, leggibile da screen reader come gruppi etichettati.

### S6 — CONTACT / FOOTER

- **Scopo:** chiudere il loop -> conversione.
- **Contenuto:** email `albertotuveri@gmail.com`, LinkedIn (`linkedin.com/in/albertotuveri`), GitHub (`github.com/GitAlboBis`), CTA finale. Toggle lingua EN/IT. Eventuale banner cookie minimale (solo se servono analytics). Form di contatto: vedi nota in sez. 6 e scope (sez. 10).
- **Cosa succede allo scroll:** la scena WebGL si "posa" (superficie d'acqua calma / orizzonte); reveal finale del CTA con magnetic hover.
- **Done-when:** tutti i contatti sono link reali e copiabili; CTA raggiungibile da tastiera; focus states visibili.

---

## 5. Sitemap e route

```text
/                      Long-page scrollytelling (S1 HERO -> S6 CONTACT). Default EN.  [costruita]
/work/[slug]           (OPZIONALE) Dettaglio progetto. slug ∈ { badante24h, doit-voice-ai-agent, sersan-project-1, sersan-project-2, agricultural-supply-chain }  [non costruita]
/sitemap.xml           Generato (src/app/sitemap)        [non costruito — GATE 8]
/robots.txt            Generato (src/app/robots)          [non costruito — GATE 8]
/opengraph-image       OG image (statica o generata)      [non costruita — GATE 8]
```

> Stato (codice): solo `/` e attualmente costruita. `sitemap.xml`, `robots.txt`, OG image e JSON-LD `Person` sono **non ancora implementati** e ricadono nel gate perf/a11y/SEO (GATE 8 in `docs/11-WORKFLOW.md`, not-started). Gli slug effettivi dei progetti sono quelli in `src/data/projects.ts` (vedi sopra).

- La home e la priorita assoluta. Le route `/work/[slug]` sono **OPZIONALI in v1**: si implementano solo se le card non bastano a raccontare il progetto. Se non implementate, le card restano self-contained.
- i18n via cookie + toggle, una sola URL per pagina (vedi `docs/03-ARCHITECTURE.md`): nessun routing `/en` `/it`. Il PRD richiede solo che EN e IT siano entrambi raggiungibili e che il default sia EN.

---

## 6. Content model

Tutti i contenuti del sito vivono in `src/data` (vedi `docs/03-ARCHITECTURE.md`). Il copy e bilingue: ogni stringa visibile ha varianti `en` e `it`. **Nota (codice):** i tipi sono plain TypeScript, **non zod** — niente schema runtime; `projects.ts` e un singolo file con i tipi e l'array esportato.

### 6.1 Project

```ts
// src/data/projects.ts — forma reale nel codice
type Localized = Record<Lang, string>;           // Lang = "en" | "it"
type ProjectStatus = "confirmed" | "provisional";
type ProjectMetric = { value: string; label: Localized };  // es. value "<1s", label "geospatial search"
type ProjectLink = { label: string; href: string };

type Project = {
  slug: string;                 // "badante24h" | "doit-voice-ai-agent" | "sersan-project-1" | "sersan-project-2" | "agricultural-supply-chain"
  status: ProjectStatus;        // Sersan = "provisional"
  title: string;                // brand/nome (NON localizzato)
  org: string;                  // "ALS MCL Civitanova" | "DOIT · Lodestar Group" | "SerSan · AI Studio" | "University of Camerino · Academic"
  period: string;               // "2026" | "2025–2026" | "2026 – present" | "2024"
  role: Localized;              // es. "Full-Stack Developer · Freelance"
  problem: Localized;           // contesto / problema
  action: Localized;            // cosa ha fatto Alberto
  result: Localized;            // esito / impatto
  stack: string[];              // tag tecnici (EN, non localizzati): "Next.js 15", "PostGIS", ...
  metrics?: ProjectMetric[];    // value + label LOCALIZZATA (non string[])
  links?: ProjectLink[];
  order: number;                // ordine di display ascendente (1..5)
};

// export: projects: Project[]  +  projectsSorted (ordinato per order)
```

Regole:
- I contenuti dei progetti sono la trascrizione fedele di `docs/07-PROJECTS.md`. Non inventare metriche.
- I progetti Sersan hanno `status: "provisional"` con placeholder `[[TBD]]` / `[[DA DEFINIRE]]` finche Alberto non fornisce i dettagli (sez. 11). **Mantenerli provisional — non inventare.**
- Differenze rispetto a versioni storiche di questo doc: il campo si chiama `title` (non `name`), esiste `order` (non c'era), `metrics` e `ProjectMetric[]` con label localizzata (non `string[]`), non esistono i campi `cover` / `liveUrl`, non c'e validazione `zod`.

### 6.2 Skill group

```ts
// src/data/skills.ts — forma reale nel codice (NESSUN campo id)
type SkillGroup = {
  label: Localized;             // titolo del gruppo (bilingue)
  items: string[];              // proper nouns NON localizzati: "TypeScript", "React", "Azure (AD, Speech)", ...
};

// export: skillGroups: SkillGroup[]  — 6 gruppi:
//   "Core" · "Front-End" · "Back-End & Data" · "Cloud & DevOps" · "AI & Agents" · "Testing & Tooling"
```

> Aggiornamento rispetto al doc storico: i gruppi sono **6** (aggiunto `Testing & Tooling`), le label sono quelle sopra (es. `Back-End & Data`, `AI & Agents`), e **non esiste il campo `id`**.

### 6.3 Copy / i18n

```ts
// src/data/translations/{en,it}.ts — il Dictionary e NESTED per-sezione, non flat
type Dictionary = {
  meta: { eyebrow: string };
  nav: { work: string; about: string; skills: string; contact: string; cta: string };
  hero: { role: string; tagline: string; scrollCue: string };
  intro: { ... };
  cinematic: { ... };
  work: { ... };
  skills: { ... };
  // ... una chiave per sezione
};
// accesso via hook useLanguage(): t.hero.role, t.nav.cta, ...
```

- Default EN. Parita di contenuto tra EN e IT (nessuna sezione "solo IT" o "solo EN").
- I nomi tecnici, gli stack tag e i brand restano in EN in entrambe le lingue.
- **Nota (codice):** il `Dictionary` e un oggetto nidificato per-sezione, NON un `Record<string, string>` piatto. L'i18n e gestito da `src/components/language-provider.tsx` (hook `useLanguage`, cookie-based).

### 6.4 Asset

| Asset | Path | Note |
| --- | --- | --- |
| Mark `A` (GLB) | `public/models/a-mark.glb` · `public/models/a-liquid.glb` | Presenti nel repo ma **NON caricati a runtime**: la `A` d'acqua e riempita proceduralmente via `initFromHomes()` (vedi S1 / `docs/04-3D-HERO-WATER-LOGO.md`). Non esiste `at-mark.glb`. |
| Cinematica (frames) | `public/frames/f_000.webp` … `f_135.webp` | 136 frame WebP serviti su canvas 2D (`video-backdrop.tsx`). Sorgente di verita renderizzata. Spec/scrub in `docs/05-CINEMATIC-SCROLL.md`. |
| Cinematica (sorgente) | `public/video/hf_20260624_*.mp4` | mp4 raw Higgsfield, **source-only / untracked** — non serviti a runtime. |
| Cubemap | `public/cubemap/` | Env map per reflect/refract del fluido. |
| Reduced-motion | (frame ~0.5 della sequenza) | Nessun poster dedicato: in reduced-motion si congela un frame centrale (vedi S1/S3). |
| OG / favicon | `src/app/` + `public/` | OG image + favicon/manifest **non ancora costruiti** (GATE 8; vedi sez. 7 SEO/PWA). |

### 6.5 Backend del form contatti (condizionale)

- Se il contatto resta `mailto:` + link social -> nessun backend. **Default v1.**
- Se serve un form con persistenza/anti-spam -> usare Supabase SOLO per questo (vedi `docs/09-MCP.md`). Decisione aperta (sez. 11).

---

## 7. Requisiti

### 7.1 Funzionali (DEVE)

- DEVE essere una single-page scrollytelling con le sezioni S1..S6 nell'ordine della sez. 4 (con S1 ed S3 fusi in un'unica sezione pinnata, vedi sez. 4).
- DEVE essere bilingue EN/IT con toggle e default EN; parita di contenuto.
- DEVE avere l'hero ad acqua reale (fluido MLS-MPM WebGPU) — spec in `docs/04-3D-HERO-WATER-LOGO.md`. **Nota di realta (codice):** l'implementazione e **WebGPU-only**; il fallback in assenza di `navigator.gpu` e il solo gradiente CSS "sea" (NON c'e path WebGL2). Il requisito storico "doppio backend / WebGL2" e quindi superato; un fallback piu ricco resta una decisione aperta (sez. 11).
- DEVE avere la cinematica scroll-scrubbed (frame-sequence WebP fusa nell'hero) con stato statico in reduced-motion — spec in `docs/05-CINEMATIC-SCROLL.md`.
- DEVE mostrare i progetti con formato problema/azione/risultato + stack + metriche.
- DEVE esporre contatti reali (email, LinkedIn, GitHub) raggiungibili senza scroll fino in fondo. **Nota (codice):** l'hero NON ha CTA inline `View work` / `Get in touch`; il requisito e attualmente soddisfatto da nav (`Get in touch`) + footer S6. Le CTA hero restano opzionali, non un requisito vincolante.

### 7.2 Non-funzionali (DEVE salvo dove indicato)

- **Performance:** 60fps su desktop recente durante hero e scroll. Degrado elegante su mobile (riduci densita particellari/postprocessing) e con `prefers-reduced-motion`. Lazy-load di scene 3D e video. **Lighthouse Performance >= 80 su mobile** (target di gate). Budget dettagliati in `docs/01-TECHSTACK.md`.
- **Accessibilita (AA):** contenuto leggibile da screen reader; 3D/video decorativi `aria-hidden`; focus states visibili; navigazione completa da tastiera; contrasto testo AA sui token oceano (verificare `--foam` su `--abyss`/`--deep`). `prefers-reduced-motion` DEVE neutralizzare la sim fluida WebGPU e gli scrub della frame-sequence (mostra stati statici: title card + frame centrale).
- **SEO / OG:** metadata per `/` (title, description, canonical), `sitemap.xml`, `robots.txt`, OpenGraph image, structured data `Person`. Title e description in EN di default, localizzati dove possibile. (Skill: `seo`, `schema-markup`, `fixing-metadata`.)
- **PWA:** OPZIONALE in v1. Se attivata, manifest + favicon set + theme-color oceano. Non e un requisito di lancio.
- **Browser/Device:** ultimi Chrome/Edge/Safari/Firefox desktop; iOS Safari e Android Chrome recenti su mobile. WebGPU dove disponibile, altrimenti fallback automatico (no errori visibili all'utente).
- **Privacy:** banner cookie minimale SOLO se si introducono analytics/cookie non strettamente necessari; altrimenti niente banner.

---

## 8. Criteri di successo / Done-when del prodotto

Il prodotto e "done" per la v1 quando TUTTI i seguenti sono veri (gate di lancio):

- [ ] Le 6 sezioni S1..S6 esistono, nell'ordine, con il contenuto della sez. 4.
- [ ] L'hero ad acqua (MLS-MPM WebGPU) gira a 60fps su desktop recente; in assenza di WebGPU il fallback (gradiente CSS "sea") e pulito e senza errori visibili. (Path WebGL2 NON previsto — vedi sez. 7.1 / open question sez. 11.)
- [ ] La cinematica scroll-scrubbed (frame-sequence WebP) funziona su desktop e in reduced-motion congela un frame centrale senza bloccare lo scroll.
- [ ] Bilingue EN/IT completo, default EN, parita di contenuto, toggle funzionante.
- [ ] Tutti i progetti reali (Badante24h, DOIT, supply chain) presenti con problema/azione/risultato + stack + metriche. Sersan (2 card) presente come `provisional` con placeholder `[[TBD]]`.
- [ ] Contatti reali e copiabili; CTA `Get in touch` raggiungibile da tastiera (in nav + footer). CTA inline nell'hero opzionale.
- [ ] Lighthouse Performance mobile >= 80; nessun errore in console; nessun layout shift evidente (CLS basso).
- [ ] A11y: navigazione tastiera completa, focus states, screen-reader order corretto, reduced-motion rispettato, contrasto AA.
- [ ] SEO/OG: metadata, sitemap, robots, OG image presenti.
- [ ] Deploy preview Vercel verde; QA visivo via `claude-in-chrome` superato su desktop + mobile (vedi `docs/11-WORKFLOW.md`).

Metriche di esito (post-lancio, non bloccanti per il merge ma da osservare): tempo sulla pagina, scroll-depth fino a S4/S6, click su CTA contatto, condivisioni/segnalazioni Awwwards.

---

## 9. Pipeline asset e dipendenze di prodotto (sintesi)

Il PRD non descrive il "come" tecnico (vedi i doc dedicati), ma fissa le dipendenze di contenuto che bloccano lo sviluppo:

- **Mark `A`**: i GLB `a-mark.glb` / `a-liquid.glb` esistono nel repo ma NON sono caricati a runtime — la `A` d'acqua e generata proceduralmente (`initFromHomes()`). Nessuna dipendenza bloccante da un GLB per l'hero. Vedi `docs/04-3D-HERO-WATER-LOGO.md`.
- **Cinematica (frames)**: la footage e una sequenza di 136 WebP in `public/frames/` (renderizzate da sorgenti Higgsfield mp4 in `public/video/`, source-only). Vedi `docs/05-CINEMATIC-SCROLL.md` e `docs/09-MCP.md`.
- **Copy progetti** da `docs/07-PROJECTS.md`; dettagli Sersan = bloccanti per quelle due card (restano `provisional`).

---

## 10. Scope e NON-goals (v1)

**In scope (v1):**
- Single-page scrollytelling S1..S6, bilingue EN/IT.
- Hero 3D ad acqua + cinematica scroll.
- Schede progetto + skills + contatti.
- SEO/OG, a11y AA, performance budget.
- Route `/work/[slug]` SOLO se necessarie.

**Fuori scope / NON-goals (v1):**
- ❌ Blog / CMS / editor di contenuti. (I contenuti vivono in `src/data`, versionati nel repo.)
- ❌ E-commerce, pagamenti, checkout.
- ❌ Autenticazione utente / area riservata / account.
- ❌ Backend complesso. Eventuale Supabase SOLO per il form contatti, se confermato (sez. 6.5 / 11).
- ❌ Analytics pesanti / tracking di marketing (al piu, analytics privacy-friendly minimale).
- ❌ Dark/light theme switch (il sito e dark-first oceano per design; vedi `docs/02-DESIGN.md`).
- ❌ Sound design attivo di default (pattern `audioStore` previsto ma OFF di default; opt-in utente).
- ❌ Lingue oltre EN/IT.
- ❌ Supporto a browser obsoleti privi di qualsiasi fallback (si garantisce solo il degrado elegante descritto in sez. 7.2).

---

## 11. Open questions (da confermare con Alberto)

1. **Progetti Sersan** (`PROVVISORIO`): nomi, problema/azione/risultato, stack e metriche dei 2 progetti realizzati per SerSan. Finche non forniti -> `status: "provisional"`.
2. **Ruolo/date Sersan**: il CV PDF non riporta ancora "SerSan — Software Engineer (mag 2026 – presente)"; confermare label e periodo esatti per S2/S4.
3. **Route di dettaglio `/work/[slug]`**: servono in v1 o le card bastano?
4. **Form contatti**: solo `mailto:`/social (default) oppure form con backend Supabase + anti-spam?
5. **PWA**: attivarla in v1 o rimandarla?
6. **Analytics / cookie banner**: si introduce analytics (e quindi banner) o si resta a zero cookie?
7. **Asset reali del backflip**: esiste girato reale da usare/ricreare con Higgsfield, o si genera interamente AI? (impatta `docs/05-CINEMATIC-SCROLL.md`).
8. **Dominio**: dominio finale per OG/canonical e deploy Vercel.
9. **Fallback hero su device senza WebGPU**: oggi l'hero e WebGPU-only e il fallback e il solo gradiente CSS "sea" (niente WebGL2, niente `A` statica). Va bene per la v1 o serve un fallback visivo piu ricco (es. immagine statica della `A`) per Safari/Firefox senza WebGPU e per mobile? (impatta `docs/04-3D-HERO-WATER-LOGO.md` e i criteri di sez. 8).
10. **Parametri fluido (leva)**: i valori inflate/gravity/restore/speedGate/leashRadius dell'hero sono live-tuned via leva e attendono sign-off a GATE-6.

---

## 12. Cross-reference (MANIFEST)

- `CLAUDE.md` — master entry: regole d'oro, voce, routing skill+MCP, gates, indice.
- `docs/README.md` — indice della suite di documentazione.
- `docs/01-TECHSTACK.md` — stack + versioni, convenzioni, struttura file, budget perf/a11y, deploy.
- `docs/02-DESIGN.md` — art direction oceano, token, tipografia, motion, voce del copy, ispirazioni.
- `docs/03-ARCHITECTURE.md` — cartelle, Canvas globale + overlay DOM, sync Lenis<->R3F, store Zustand, i18n EN/IT, routing, mappa scena<->sezione.
- `docs/04-3D-HERO-WATER-LOGO.md` — hero `A` ad acqua reale (fluido MLS-MPM WebGPU, render Screen-Space-Fluid), fisica velocity-based, shading, tier, fallback.
- `docs/05-CINEMATIC-SCROLL.md` — cinematica Pan di Zucchero (frame-sequence WebP fusa nell'hero), scroll-scrub, preload, fallback reduced-motion.
- `docs/06-REFERENCES.md` — riferimenti di qualita (studiare, non copiare).
- `docs/07-PROJECTS.md` — bio Alberto + schede progetto + voci Sersan provvisorie.
- `docs/08-CONTEXT7.md` — Context7 MCP: setup, regola operativa, librerie.
- `docs/09-MCP.md` — routing MCP/connettori per task.
- `docs/10-SKILLS.md` — routing delle skill installate per task.
- `docs/11-WORKFLOW.md` — workflow operativo agenti: gates, loop QA visivo, done-when, commit.
