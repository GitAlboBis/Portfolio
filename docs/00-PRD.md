# 00 — Product Requirements Document (PRD)

> Scopo: definire COSA deve essere il portfolio di Alberto Tuveri (visione, audience, narrativa, content model, requisiti, criteri di successo, scope) prima ancora di decidere COME costruirlo. Questo file e la fonte di verita sul "prodotto"; il "come" tecnico vive in `docs/01-TECHSTACK.md`, `docs/03-ARCHITECTURE.md` e nei doc 3D/cinematica. Ogni agente AI che lavora al sito deve leggere questo documento prima di scrivere codice.

---

## 0. Come leggere questo documento

- La prosa e in ITALIANO (la legge Alberto e la leggono gli agenti). Tutto cio che e codice, identificatori, nomi di file/componenti, token di design e COPY del sito e in INGLESE.
- Le sezioni "Requisiti" usano parole vincolanti: DEVE (requisito obbligatorio), DOVREBBE (forte raccomandazione), PUO (opzionale).
- I cross-reference puntano sempre ai path del MANIFEST (vedi sezione finale "Cross-reference").
- Quando un dato e marcato `PROVVISORIO` significa che va confermato con Alberto prima del lancio (vedi sezione 11 "Open questions").

---

## 1. Visione e obiettivo

Il portfolio e un'esperienza web immersiva, single-page, scroll-driven, a tema MARE/OCEANO della Sardegna, con qualita visiva da **Awwwards Site of the Day** (riferimento di livello: `lusion.co`).

L'obiettivo di prodotto e UNO e misurabile: **in meno di 10 secondi dal primo paint, chi atterra sul sito deve percepire Alberto Tuveri come un Software Engineer full-stack + AI di alto livello, e ricordarsi del sito.** Il "colpo d'occhio" e il logo 3D ad acqua (hero GPGPU a due strati, vedi `docs/04-3D-HERO-WATER-LOGO.md`) e la cinematica di Pan di Zucchero (vedi `docs/05-CINEMATIC-SCROLL.md`); insieme raccontano in modo non verbale "questa persona sa costruire cose difficili e ha gusto".

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

Esperienza principale: una long-page immersiva guidata dallo scroll virtualizzato (Lenis guida le transizioni di scena, non l'altezza del DOM; vedi `docs/03-ARCHITECTURE.md`). Un unico Canvas R3F persistente sotto un overlay DOM con il contenuto. La mappa scena<->sezione e dettagliata in `docs/03-ARCHITECTURE.md`.

### S1 — HERO

- **Scopo:** colpo d'occhio + identita in <10s. E la sezione che "vende" l'intero sito.
- **Contenuto:** logo 3D `AT` / `A` reso come nuvola di particelle d'acqua (GPGPU a due strati: body = volume d'acqua scuro/teal, skin = goccioline/spray luminosi ciano-bianchi). Nome `Alberto Tuveri`. Ruolo: `Software Engineer — Full-Stack + AI`. Tagline marina breve (EN/IT). CTA primario `View work`, secondario `Get in touch`.
- **Cosa succede allo scroll:** a riposo le particelle ondeggiano leggermente (moto guidato da curl-noise). Al movimento del puntatore/drag, la skin schizza come spray e rientra come risacca (molla under-damped). Iniziando a scrollare, l'hero si "ritira" (il logo si disperde/affonda parzialmente) e cede spazio a S2 con crossfade di scena. Dettaglio fisica/shading/tier in `docs/04-3D-HERO-WATER-LOGO.md`.
- **Done-when (sezione):** 60fps desktop sull'interazione hero; reduced-motion mostra una versione statica leggibile; CTA accessibili da tastiera.

### S2 — INTRO / ABOUT

- **Scopo:** dare un volto e una storia al talento tecnico.
- **Contenuto:** chi e Alberto in poche frasi — full-stack + AI engineer, dalla Sardegna (Iglesias) a Camerino (Marche). Tono personale ma professionale. Eventuale richiamo testuale al legame con il mare/Pan di Zucchero come ponte verso S3. Fonte biografica: `docs/07-PROJECTS.md`.
- **Cosa succede allo scroll:** reveal del testo con split-text GSAP (parole/righe che emergono dal "fondo"); parallax leggero; lo sfondo WebGL transita dalla dispersione dell'hero verso un tono d'acqua piu calmo/profondo che prepara la cinematica.
- **Done-when:** testo leggibile da screen reader nell'ordine corretto; nessun layout shift; reveal disattivato in reduced-motion.

### S3 — CINEMATICA

- **Scopo:** picco emotivo e firma del sito. Lega persona + luogo + abilita.
- **Contenuto:** video immersivo di **Pan di Zucchero** (Masua), scrubbato dallo scroll, che transita con uno **zoom** dentro la clip Higgsfield del **backflip/tuffo di Alberto dallo scoglio** (anch'essa animata dallo scroll). Overlay WebGL: DOF, particelle, color grade oceanico, transizione-zoom. Asset in `public/video/`.
- **Cosa succede allo scroll:** lo scroll fa da timeline (scrub) sul primo clip; raggiunta una soglia, parte la transizione-zoom che entra nel secondo clip; al termine la scena ricede verso il contenuto progetti. Spec completa (scrub, soglie, fallback poster, perf) in `docs/05-CINEMATIC-SCROLL.md`.
- **Done-when:** su mobile/reduced-motion il video e sostituito da poster statico (no autoplay pesante); nessun blocco dello scroll; budget di rete rispettato (lazy-load).

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
/                      Long-page scrollytelling (S1 HERO -> S6 CONTACT). Default EN.
/work/[slug]           (OPZIONALE) Dettaglio progetto. slug ∈ { badante24h, doit-voice-ai-agent, sersan-<tbd>, supply-chain }
/sitemap.xml           Generato (src/app/sitemap)
/robots.txt            Generato (src/app/robots)
/opengraph-image       OG image (statica o generata)
```

- La home e la priorita assoluta. Le route `/work/[slug]` sono **OPZIONALI in v1**: si implementano solo se le card non bastano a raccontare il progetto. Se non implementate, le card restano self-contained.
- i18n via cookie + toggle, una sola URL per pagina (vedi `docs/03-ARCHITECTURE.md`): nessun routing `/en` `/it`. Il PRD richiede solo che EN e IT siano entrambi raggiungibili e che il default sia EN.

---

## 6. Content model

Tutti i contenuti del sito vivono in `src/data` (vedi `docs/03-ARCHITECTURE.md`), tipizzati e validati con `zod` (`docs/01-TECHSTACK.md`). Il copy e bilingue: ogni stringa visibile ha varianti `en` e `it`.

### 6.1 Project

```ts
// src/data/projects.ts (forma indicativa; lo schema zod canonico vive in src/data)
type LocalizedText = { en: string; it: string };

type Project = {
  slug: string;                 // "badante24h" | "doit-voice-ai-agent" | ...
  name: string;                 // brand/nome (NON localizzato)
  org: string;                  // "ALS MCL Civitanova" | "DOIT S.r.l (Lodestar Group)" | "SerSan — AI Studio" | "Universita di Camerino"
  role: LocalizedText;          // es. "Full-Stack Developer (Freelance)"
  period: string;               // "Jan 2026" | "Nov 2025 – Feb 2026"
  problem: LocalizedText;       // contesto / problema
  action: LocalizedText;        // cosa ha fatto Alberto
  result: LocalizedText;        // esito / impatto
  stack: string[];              // tag tecnici (EN, non localizzati): "Next.js 15", "PostGIS", ...
  metrics?: string[];           // es. "sub-second geo search", "zero known auth vulns at launch"
  links?: { label: string; href: string }[];
  status: "confirmed" | "provisional"; // Sersan = "provisional" (schema zod canonico in docs/07-PROJECTS.md)
  cover?: string;               // path asset in /public (immagine/poster)
};
```

Regole:
- I contenuti dei progetti sono la trascrizione fedele di `docs/07-PROJECTS.md`. Non inventare metriche.
- I progetti Sersan hanno `status: "provisional"` finche Alberto non fornisce i dettagli (sez. 11).
- Nota: lo "stato di pubblicazione" (`confirmed`/`provisional`) NON indica se un progetto ha una URL live. La presenza di una URL pubblica si rappresenta col campo opzionale `liveUrl` (o un entry in `links`), non con `status`.

### 6.2 Skill group

```ts
type SkillGroup = {
  id: "core" | "frontend" | "backend-db" | "cloud-devops" | "ai";
  label: LocalizedText;         // titolo del gruppo
  items: string[];              // skill in EN: "TypeScript", "React 19", "PostgreSQL", "Azure Speech", ...
};
```

### 6.3 Copy / i18n

```ts
// src/data/translations/{en,it}.ts
type Dictionary = Record<string, string>; // chiavi stabili EN; valori localizzati
// Esempio chiavi: hero.role, hero.cta.viewWork, hero.cta.contact, about.body, contact.cta
```

- Default EN. Parita di contenuto tra EN e IT (nessuna sezione "solo IT" o "solo EN").
- I nomi tecnici, gli stack tag e i brand restano in EN in entrambe le lingue.

### 6.4 Asset

| Asset | Path | Note |
| --- | --- | --- |
| Logo 3D | `public/models/at-mark.glb` | GLB ottimizzato (Draco/Meshopt + KTX2). Pipeline Blender in `docs/04-3D-HERO-WATER-LOGO.md`. |
| Cinematica | `public/video/` | Clip Pan di Zucchero + backflip Higgsfield. Spec/scrub in `docs/05-CINEMATIC-SCROLL.md`. |
| Poster fallback | `public/video/` | Frame statico per mobile/reduced-motion. |
| OG / favicon | `src/app/` + `public/` | OG image + favicon/manifest (vedi sez. 7 SEO/PWA). |

### 6.5 Backend del form contatti (condizionale)

- Se il contatto resta `mailto:` + link social -> nessun backend. **Default v1.**
- Se serve un form con persistenza/anti-spam -> usare Supabase SOLO per questo (vedi `docs/09-MCP.md`). Decisione aperta (sez. 11).

---

## 7. Requisiti

### 7.1 Funzionali (DEVE)

- DEVE essere una single-page scrollytelling con le sezioni S1..S6 nell'ordine della sez. 4.
- DEVE essere bilingue EN/IT con toggle e default EN; parita di contenuto.
- DEVE avere il logo 3D ad acqua nell'hero con doppio backend (WebGPU-native via compute/TSL, fallback WebGL2, fallback statico) — spec in `docs/04-3D-HERO-WATER-LOGO.md`.
- DEVE avere la sezione cinematica scroll-scrubbed con fallback poster — spec in `docs/05-CINEMATIC-SCROLL.md`.
- DEVE mostrare i progetti con formato problema/azione/risultato + stack + metriche.
- DEVE esporre contatti reali (email, LinkedIn, GitHub) raggiungibili senza scroll fino in fondo (es. anche in nav/hero CTA).

### 7.2 Non-funzionali (DEVE salvo dove indicato)

- **Performance:** 60fps su desktop recente durante hero e scroll. Degrado elegante su mobile (riduci densita particellari/postprocessing) e con `prefers-reduced-motion`. Lazy-load di scene 3D e video. **Lighthouse Performance >= 80 su mobile** (target di gate). Budget dettagliati in `docs/01-TECHSTACK.md`.
- **Accessibilita (AA):** contenuto leggibile da screen reader; 3D/video decorativi `aria-hidden`; focus states visibili; navigazione completa da tastiera; contrasto testo AA sui token oceano (verificare `--foam` su `--abyss`/`--deep`). `prefers-reduced-motion` DEVE disattivare la sim GPGPU pesante e gli scrub video (mostra stati statici).
- **SEO / OG:** metadata per `/` (title, description, canonical), `sitemap.xml`, `robots.txt`, OpenGraph image, structured data `Person`. Title e description in EN di default, localizzati dove possibile. (Skill: `seo`, `schema-markup`, `fixing-metadata`.)
- **PWA:** OPZIONALE in v1. Se attivata, manifest + favicon set + theme-color oceano. Non e un requisito di lancio.
- **Browser/Device:** ultimi Chrome/Edge/Safari/Firefox desktop; iOS Safari e Android Chrome recenti su mobile. WebGPU dove disponibile, altrimenti fallback automatico (no errori visibili all'utente).
- **Privacy:** banner cookie minimale SOLO se si introducono analytics/cookie non strettamente necessari; altrimenti niente banner.

---

## 8. Criteri di successo / Done-when del prodotto

Il prodotto e "done" per la v1 quando TUTTI i seguenti sono veri (gate di lancio):

- [ ] Le 6 sezioni S1..S6 esistono, nell'ordine, con il contenuto della sez. 4.
- [ ] L'hero 3D ad acqua gira a 60fps su desktop recente e ha i tre livelli di fallback funzionanti (WebGPU / WebGL2 / statico).
- [ ] La cinematica scroll-scrubbed funziona su desktop e degrada a poster su mobile/reduced-motion senza bloccare lo scroll.
- [ ] Bilingue EN/IT completo, default EN, parita di contenuto, toggle funzionante.
- [ ] Tutti i progetti reali (Badante24h, DOIT, supply chain) presenti con problema/azione/risultato + stack + metriche. Sersan presente come `provisional`.
- [ ] Contatti reali e copiabili; CTA `Get in touch` e `View work` raggiungibili da tastiera.
- [ ] Lighthouse Performance mobile >= 80; nessun errore in console; nessun layout shift evidente (CLS basso).
- [ ] A11y: navigazione tastiera completa, focus states, screen-reader order corretto, reduced-motion rispettato, contrasto AA.
- [ ] SEO/OG: metadata, sitemap, robots, OG image presenti.
- [ ] Deploy preview Vercel verde; QA visivo via `claude-in-chrome` superato su desktop + mobile (vedi `docs/11-WORKFLOW.md`).

Metriche di esito (post-lancio, non bloccanti per il merge ma da osservare): tempo sulla pagina, scroll-depth fino a S4/S6, click su CTA contatto, condivisioni/segnalazioni Awwwards.

---

## 9. Pipeline asset e dipendenze di prodotto (sintesi)

Il PRD non descrive il "come" tecnico (vedi i doc dedicati), ma fissa le dipendenze di contenuto che bloccano lo sviluppo:

- **Logo `at-mark.glb`** prodotto via Blender MCP (text-to-3D + ottimizzazione gltf-transform). Senza GLB, l'hero usa un placeholder. Vedi `docs/04-3D-HERO-WATER-LOGO.md` e `docs/09-MCP.md`.
- **Video cinematica** generati con Higgsfield MCP. Senza clip, S3 usa poster placeholder. Vedi `docs/05-CINEMATIC-SCROLL.md` e `docs/09-MCP.md`.
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

---

## 12. Cross-reference (MANIFEST)

- `CLAUDE.md` — master entry: regole d'oro, voce, routing skill+MCP, gates, indice.
- `docs/README.md` — indice della suite di documentazione.
- `docs/01-TECHSTACK.md` — stack + versioni, convenzioni, struttura file, budget perf/a11y, deploy.
- `docs/02-DESIGN.md` — art direction oceano, token, tipografia, motion, voce del copy, ispirazioni.
- `docs/03-ARCHITECTURE.md` — cartelle, Canvas globale + overlay DOM, sync Lenis<->R3F, store Zustand, i18n EN/IT, routing, mappa scena<->sezione.
- `docs/04-3D-HERO-WATER-LOGO.md` — logo AT/A particelle d'acqua GPGPU, doppio backend, fisica, shading, tier, pipeline Blender.
- `docs/05-CINEMATIC-SCROLL.md` — cinematica Pan di Zucchero + backflip, scroll-scrub, transizione-zoom, fallback.
- `docs/06-REFERENCES.md` — riferimenti di qualita (studiare, non copiare).
- `docs/07-PROJECTS.md` — bio Alberto + schede progetto + voci Sersan provvisorie.
- `docs/08-CONTEXT7.md` — Context7 MCP: setup, regola operativa, librerie.
- `docs/09-MCP.md` — routing MCP/connettori per task.
- `docs/10-SKILLS.md` — routing delle skill installate per task.
- `docs/11-WORKFLOW.md` — workflow operativo agenti: gates, loop QA visivo, done-when, commit.
