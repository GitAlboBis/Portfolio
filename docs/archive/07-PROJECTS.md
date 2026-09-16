# 07 — PROJECTS & BIO

> Aggiornato 2026-06-27 per riflettere il codice (content model `src/data/projects.ts` + `src/data/skills.ts` come effettivamente shippati). Riconciliato dal loop docs-driven-build. I **fatti** bio/progetti confermati NON sono stati toccati; sono state allineate solo le PRESCRIZIONI del content model (tipo TS al posto di zod, file singolo, skills, periodi/metriche come da codice).

> Scopo: fonte di verita unica per tutto il **copy di contenuto** del portfolio — biografia di Alberto Tuveri, raggruppamento delle skill, e schede progetto — in **EN + IT pronti all'uso**. Gli agenti che costruiscono le sezioni S2 ABOUT, S4 WORK/PROJECTS e S5 SKILLS (vedi `docs/00-PRD.md` e `docs/03-ARCHITECTURE.md`) copiano da qui, non inventano. Le stringhe di sezione vivono in `src/data/translations` (en/it); le schede progetto in `src/data/projects.ts` e i gruppi skill in `src/data/skills.ts`. Le label tecniche, i nomi di stack e gli slug restano in inglese; la prosa di queste direttive e in italiano.

---

## 0. Regole d'uso di questo documento

1. **Confermato vs Da confermare.** Ogni blocco e marcato con `[CONFIRMED]` (dato dal CV/LinkedIn, usabile subito) o `[PROVISIONAL]` (placeholder da validare con Alberto — vedi sezione 6 "Open questions"). Un agente NON deve pubblicare contenuto `[PROVISIONAL]` come fosse definitivo: usare i placeholder testuali esatti riportati qui.
2. **Bilingue.** Per ogni testo c'e la coppia EN (primaria, default) e IT. Le chiavi i18n sono identiche tra le due lingue. Sorgente i18n: `src/data/translations/en.ts` e `src/data/translations/it.ts`. Nota: il dizionario e **nidificato per-sezione** (`hero`, `intro`, `work`, `skills`, …), non flat.
3. **Content model progetti.** Ogni progetto e un oggetto `Project` (plain TypeScript `type`, NO zod) — vedi schema reale in sezione 4.0. Tutti i progetti vivono in **un solo file** `src/data/projects.ts` (array `projects`, piu `projectsSorted`). NON ci sono file per-slug, ne `index.ts`/`types.ts` dedicati, ne validazione `ProjectSchema.parse()`. La verifica e affidata a `tsc` (script `typecheck`), non a Vitest.
4. **Voce del copy.** Tono: tecnico, asciutto, orientato al risultato. Niente superlativi vuoti ("amazing", "cutting-edge"). Struttura Problem → Action → Result. Metriche concrete dove esistono. Per le linee guida estetiche del copy vedi `docs/02-DESIGN.md`.
5. **Privacy / verita.** Non inventare metriche. Se un numero non e nel knowledge pack, lascialo come placeholder `[[TBD: ...]]`, mai un valore inventato.

---

## 1. BIO — Alberto Tuveri

> Nota sul mapping i18n (stato del codice 2026-06-27): la bio attualmente **shippata** e una versione *condensata* sotto la chiave `intro.*` di `src/data/translations/{en,it}.ts` — `intro.eyebrow`, `intro.heading`, `intro.body1`, `intro.body2` — piu `hero.tagline`. Le chiavi prescrittive `bio.tagline` / `bio.short` / `bio.long` / `bio.thesis` qui sotto rappresentano il copy *completo* di riferimento (CV-grade), non ancora interamente cablato. Quando la S2 ABOUT verra estesa, queste chiavi vanno aggiunte/riconciliate. I **testi** confermati restano la fonte di verita; cio che e provvisorio e solo *quali* di questi blocchi sono gia montati nel sito (openQuestion).

### 1.0 Dati anagrafici e contatti `[CONFIRMED]`

| Campo | Valore |
|---|---|
| Name | Alberto Tuveri |
| Role | Software Engineer — Full-Stack + AI Integration |
| Origin | Iglesias, Sardinia (Sulcis-Iglesiente; Pan di Zucchero / Masua coastline) |
| Based in | Camerino, Marche, Italy |
| Phone | +39 375 880 9005 |
| Email | albertotuveri@gmail.com |
| LinkedIn | linkedin.com/in/albertotuveri |
| GitHub | github.com/GitAlboBis |
| Languages | Italian (native), English (B1 → C1, in progress) |

> Nota copy: l'email pubblica del sito e `albertotuveri@gmail.com`. L'email `alberto.t@sersan.dev` e l'indirizzo aziendale SerSan e **non** va esposta nel portfolio salvo richiesta esplicita di Alberto.

### 1.1 Short bio — una riga (hero / meta) `[CONFIRMED]`

Chiave i18n: `bio.tagline`

```
EN: Software engineer building full-stack products and AI-driven systems — from the cliffs of Sardinia to the hills of Camerino.
IT: Software engineer che costruisce prodotti full-stack e sistemi guidati dall'AI — dalle scogliere della Sardegna alle colline di Camerino.
```

### 1.2 Short bio — paragrafo (about hero / og:description) `[CONFIRMED]`

Chiave i18n: `bio.short`

```
EN:
Alberto Tuveri is a software engineer focused on full-stack development and AI
integration. He ships production web apps with Next.js, React and TypeScript,
designs secure backends on Supabase and PostgreSQL, and builds AI agents that
turn natural language into real actions. Born on the mining coast of Iglesias,
Sardinia, he now studies and works from Camerino.
```

```
IT:
Alberto Tuveri e un software engineer specializzato in sviluppo full-stack e
integrazione AI. Realizza web app in produzione con Next.js, React e TypeScript,
progetta backend sicuri su Supabase e PostgreSQL, e costruisce agenti AI che
trasformano il linguaggio naturale in azioni concrete. Nato sulla costa
mineraria di Iglesias, in Sardegna, oggi studia e lavora da Camerino.
```

### 1.3 Long bio — sezione S2 ABOUT `[CONFIRMED]`

Chiave i18n: `bio.long`. Da spezzare in 3 paragrafi animati (split-text reveal, vedi `docs/03-ARCHITECTURE.md` per la mappa scena↔sezione).

```
EN:
I'm Alberto, a software engineer who works across the whole stack — from GPU
shaders and React front-ends down to PostGIS queries and CI pipelines — with a
particular focus on integrating AI into real products.

I grew up in Iglesias, on the Sulcis-Iglesiente coast of Sardinia, where the
sea around Pan di Zucchero shaped how I see things: clean lines, deep structure,
and a respect for what's underneath the surface. I'm finishing my B.Sc. in
Computer Science at the University of Camerino, with a thesis on the security of
OS-level AI agents — from simple autocomplete to autonomous agentic
orchestration.

Recently I've shipped a production PWA that matches families with caregivers
across Italy, built a hands-free voice AI agent for Microsoft Teams, and joined
SerSan — AI Studio as a software engineer. I care about systems that are fast,
secure, and genuinely useful.
```

```
IT:
Sono Alberto, un software engineer che lavora su tutto lo stack — dagli shader
GPU e i front-end React fino alle query PostGIS e alle pipeline CI — con un
focus particolare sull'integrazione dell'AI in prodotti reali.

Sono cresciuto a Iglesias, sulla costa del Sulcis-Iglesiente in Sardegna, dove
il mare attorno a Pan di Zucchero ha plasmato il mio modo di vedere le cose:
linee pulite, struttura profonda, e rispetto per cio che sta sotto la
superficie. Sto completando la laurea triennale in Informatica all'Universita
di Camerino, con una tesi sulla sicurezza degli agenti AI a livello di sistema
operativo — dall'autocomplete all'orchestrazione agentica autonoma.

Di recente ho rilasciato una PWA in produzione che mette in contatto famiglie e
caregiver in tutta Italia, ho costruito un agente vocale AI hands-free per
Microsoft Teams, e sono entrato in SerSan — AI Studio come software engineer.
Mi interessano i sistemi veloci, sicuri e davvero utili.
```

### 1.4 Tesi — micro-copy `[CONFIRMED]`

Chiave i18n: `bio.thesis`

```
EN:
B.Sc. thesis — "From Autocomplete to Agentic Orchestration: Architectural
Analysis and Security of OS-Level Agents". Maps the evolution from code
completion to autonomous agentic systems (MCP, RAG, multi-agent orchestration),
catalogues OS-level attack vectors (prompt injection, tool poisoning, multi-agent
kill chains) against MITRE ATLAS and the OWASP Agentic Top 10, and proposes
Zero-Trust defensive strategies.
```

```
IT:
Tesi triennale — "From Autocomplete to Agentic Orchestration: Architectural
Analysis and Security of OS-Level Agents". Mappa l'evoluzione dal completamento
del codice ai sistemi agentici autonomi (MCP, RAG, orchestrazione multi-agente),
cataloga i vettori di attacco a livello OS (prompt injection, tool poisoning,
kill chain multi-agente) rispetto a MITRE ATLAS e OWASP Agentic Top 10, e
propone strategie difensive Zero-Trust.
```

### 1.5 Education `[CONFIRMED]`

| Period | Item |
|---|---|
| 2022 – Apr 2026 | B.Sc. Computer Science, University of Camerino |
| — | Technical IT Diploma, Ist. Boccaccio, Iglesias |

---

## 2. SKILLS — raggruppate per dominio `[CONFIRMED]`

Sorgente per la sezione **S5 SKILLS/STACK**: `src/data/skills.ts`. I nomi tecnologici NON si traducono; si traduce solo la `label` di gruppo (`Localized` = `{ en, it }`). Lo shape effettivo e `SkillGroup = { label: Localized; items: string[] }` — **niente** campo `id` ne `provenBySite`; l'ordine e quello dell'array `skillGroups`.

| Label EN | Label IT | Items (English, do not translate) |
|---|---|---|
| Core | Core | TypeScript, JavaScript, Python, Java, C / C++, C# |
| Front-End | Front-End | React, Next.js, Angular, Tailwind CSS, Three.js / WebGL, GSAP, Framer Motion |
| Back-End & Data | Back-End & Dati | Node.js, Spring, Supabase, PostgreSQL, PostGIS, MySQL |
| Cloud & DevOps | Cloud & DevOps | Azure (AD, Speech), Vercel, GitHub Actions, Sentry, Docker |
| AI & Agents | AI & Agenti | Copilot Studio, Dataverse, Dynamics 365, Power Automate, MCP, RAG, Multi-agent orchestration |
| Testing & Tooling | Testing & Tooling | Vitest, Playwright, ESLint, Prettier, Git |

> Nota: `Three.js / WebGL` (non WebGPU) e incluso in `Front-End` — corrisponde al codice. Il portfolio gira su WebGPU (hero MLS-MPM), ma la skill dichiarata resta `Three.js / WebGL`; se si vuole esporre WebGPU come competenza "provata dal sito" e una decisione di copy aperta (openQuestion), oggi NON c'e alcun flag `provenBySite` nel data file.
>
> Nota: Framer Motion e una competenza personale di Alberto; lo stack del PORTFOLIO usa GSAP, non Framer Motion (vedi `docs/01-TECHSTACK.md`). Entrambe restano elencate in `Front-End`.

Snippet del data file (shape reale):

```ts
// src/data/skills.ts
export type SkillGroup = { label: Localized; items: string[] };

export const skillGroups: SkillGroup[] = [
  { label: { en: "Core",            it: "Core" },            items: ["TypeScript", "JavaScript", "Python", "Java", "C / C++", "C#"] },
  { label: { en: "Front-End",       it: "Front-End" },       items: ["React", "Next.js", "Angular", "Tailwind CSS", "Three.js / WebGL", "GSAP", "Framer Motion"] },
  { label: { en: "Back-End & Data", it: "Back-End & Dati" }, items: ["Node.js", "Spring", "Supabase", "PostgreSQL", "PostGIS", "MySQL"] },
  { label: { en: "Cloud & DevOps",  it: "Cloud & DevOps" },  items: ["Azure (AD, Speech)", "Vercel", "GitHub Actions", "Sentry", "Docker"] },
  { label: { en: "AI & Agents",     it: "AI & Agenti" },     items: ["Copilot Studio", "Dataverse", "Dynamics 365", "Power Automate", "MCP", "RAG", "Multi-agent orchestration"] },
  { label: { en: "Testing & Tooling", it: "Testing & Tooling" }, items: ["Vitest", "Playwright", "ESLint", "Prettier", "Git"] },
];
```

> openQuestion: il data file elenca `Vitest` / `Playwright` / `ESLint` / `Prettier` in `Testing & Tooling` come *competenze* di Alberto, ma il tooling del REPOSITORY non installa eslint/prettier/vitest (script `package.json` = solo `dev`/`build`/`start`/`typecheck`; vedi `docs/01-TECHSTACK.md`). Sono claim di skill personali, non di stack del progetto — lasciare come sono salvo diversa indicazione di Alberto.

---

## 3. EXPERIENCE — timeline `[CONFIRMED unless noted]`

Sorgente per un'eventuale mini-timeline nella S2 ABOUT o S4 WORK. Ordine: piu recente prima.

| # | Period | Company | Role | Status |
|---|---|---|---|---|
| 1 | May 2026 – present | SerSan — AI Studio | Software Engineer | `[CONFIRMED]` role; projects `[PROVISIONAL]` |
| 2 | Jan 2026 | ALS MCL Civitanova | Full-Stack Developer (Freelance) | `[CONFIRMED]` |
| 3 | Nov 2025 – Feb 2026 | DOIT S.r.l (Lodestar Group), Fabriano | AI & Software Developer (Internship) | `[CONFIRMED]` |
| 4 | 2019 – 2020 | Ist. Boccaccio, Iglesias | Network Technician (Intern) | `[CONFIRMED]` |

> Il CV PDF **non** riporta ancora SerSan: e il ruolo corrente (da maggio 2026). Trattare la voce SerSan come confermata per il *ruolo*, provvisoria per i *progetti*.

---

## 4. PROJECT CARDS — sezione S4 WORK

### 4.0 Content model `Project` (schema reale)

Plain TypeScript `type` in `src/data/projects.ts` — **niente zod**, niente `ProjectSchema`. `Localized = Record<Lang, string>` (chiavi `en`/`it`). Lo shape effettivo:

```ts
// src/data/projects.ts
export type Localized = Record<Lang, string>;
export type ProjectStatus = "confirmed" | "provisional";
export type ProjectMetric = { value: string; label: Localized };
export type ProjectLink = { label: string; href: string };

export type Project = {
  slug: string;                 // url + anchor, kebab-case, English
  status: ProjectStatus;
  /** Brand/product name — NOT localized (plain string) */
  title: string;
  org: string;                  // company/org, not localized
  period: string;               // free text, language-neutral ("2026", "2025–2026")
  role: Localized;
  problem: Localized;
  action: Localized;
  result: Localized;
  stack: string[];              // English tech names
  metrics?: ProjectMetric[];    // optional
  links?: ProjectLink[];        // optional; { label, href } — no `kind` enum
  order: number;                // display order (ascending)
};

export const projects: Project[] = [ /* ... */ ];
export const projectsSorted = [...projects].sort((a, b) => a.order - b.order);
```

Differenze rispetto alla vecchia prescrizione (allineate al codice): `title` e una **string** (non `Localized`); il campo azienda si chiama **`org`** (non `company`); **non** esiste un campo `context` (la scheda usa Problem → Action → Result); `links` non ha il campo `kind`; `metrics` e `links` sono **opzionali**; non c'e `z.string().url()` — `href` e una stringa qualsiasi.

Regola di rendering: per nascondere un link, **ometterlo** dall'array `links` (campo opzionale) anziche passare `href: ""`. Se `status === "provisional"` la card mostra un badge `WORK IN PROGRESS` (EN) / `IN LAVORAZIONE` (IT) e i campi `[[TBD]]` restano visibili come tali.

Ordine display in S4 (`projectsSorted`): `order` 1=Badante24h, 2=DOIT Voice AI, 3=SerSan Project I, 4=SerSan Project II, 5=Agricultural Supply Chain.

---

### 4.1 Badante24h — ALS MCL Civitanova `[CONFIRMED]`

`slug: "badante24h"` · `status: "confirmed"` · `order: 1` · `title: "Badante24h"` · `org: "ALS MCL Civitanova"` · `period: "2026"`

| Field | EN | IT |
|---|---|---|
| Title (string) | Badante24h | Badante24h |
| Org | ALS MCL Civitanova | ALS MCL Civitanova |
| Role | Full-Stack Developer · Freelance | Full-Stack Developer · Freelance |
| Period | 2026 | 2026 |

```
CONTEXT
EN: A production PWA that matches families with home-care caregivers across the
    Italian domiciliary-care market.
IT: Una PWA di produzione che mette in contatto famiglie e caregiver nel mercato
    italiano dell'assistenza domiciliare.

PROBLEM
EN: Families and caregivers needed a fast, trustworthy way to find each other —
    working offline on low-end phones, with real-time messaging and verified
    identities, at near-zero infrastructure cost.
IT: Famiglie e caregiver avevano bisogno di un modo veloce e affidabile per
    trovarsi — funzionante offline su telefoni di fascia bassa, con messaggistica
    in tempo reale e identita verificate, a costo infrastrutturale quasi nullo.

ACTION
EN: Built a full PWA on Next.js 15 App Router, React 19 and TypeScript (strict)
    with Supabase. Full offline support via a custom Serwist Service Worker and
    VAPID-signed Web Push. Real-time family<->caregiver messaging over Supabase
    Realtime (event-driven WebSocket subscriptions) with integrated push.
    Sub-second geospatial search with PostGIS 3 (GiST indexes, WGS-84 geography),
    Leaflet / React-Leaflet maps and open-source geocoding (Photon + Nominatim)
    for zero map-API cost. End-to-end hardening: Row Level Security on every
    sensitive table, RBAC middleware in Next.js, HSTS, a CSP whitelist and VAPID
    push. Sentry across three layers (client / server / edge) with an
    anti-adblock tunnel route. Localized IT/EN admin dashboard for caregiver
    identity verification, server-side image optimization (Sharp), and GitHub
    Actions CI/CD with sub-5-minute deploys.
IT: Realizzata una PWA completa su Next.js 15 App Router, React 19 e TypeScript
    (strict) con Supabase. Supporto offline totale via Service Worker custom
    (Serwist) e Web Push firmate VAPID. Messaggistica famiglie<->caregiver in
    tempo reale su Supabase Realtime (subscription WebSocket event-driven) con
    push integrate. Ricerca geospaziale sub-secondo con PostGIS 3 (indici GiST,
    geography WGS-84), mappe Leaflet / React-Leaflet e geocoding open-source
    (Photon + Nominatim) a costo zero di map API. Hardening end-to-end: Row Level
    Security su ogni tabella sensibile, middleware RBAC in Next.js, HSTS,
    whitelist CSP e push VAPID. Sentry su tre layer (client / server / edge) con
    tunnel route anti-adblock. Dashboard admin localizzata IT/EN per la verifica
    d'identita dei caregiver, ottimizzazione immagini server-side (Sharp), e
    CI/CD con GitHub Actions con deploy sotto i 5 minuti.

RESULT
EN: Shipped to production with full offline capability, real-time messaging and
    sub-second geospatial search — and zero known auth vulnerabilities at launch.
IT: Rilasciata in produzione con piena capacita offline, messaggistica in tempo
    reale e ricerca geospaziale sub-secondo — e zero vulnerabilita auth note al
    lancio.
```

**Stack (come da codice):** `Next.js 15`, `React 19`, `TypeScript`, `Supabase`, `PostGIS`, `Serwist (PWA)`, `Web Push (VAPID)`, `Leaflet`, `Sentry`, `GitHub Actions`. La prosa ACTION sopra cita anche `Photon`/`Nominatim`/`Sharp`/`PostgreSQL`: descrittivi nel copy ma NON nell'array `stack` shippato.

**Metrics (come da codice, 3 voci):**
| value | label EN | label IT |
|---|---|---|
| `0` | known auth vulns at launch | vulnerabilità auth note al lancio |
| `<1s` | geospatial search | ricerca geospaziale |
| `<5min` | solo deploy cycle | ciclo di deploy in solo |

**Links:** nessuno nel data file (campo `links` omesso → nessun bottone). Repo pubblico/privato e URL di produzione restano openQuestion (sezione 6).

---

### 4.2 Voice AI Agent for Microsoft Teams — DOIT S.r.l `[CONFIRMED]`

`slug: "doit-voice-ai-agent"` · `status: "confirmed"` · `order: 2` · `title: "Voice AI Agent for Microsoft Teams"` · `org: "DOIT · Lodestar Group"` · `period: "2025–2026"`

| Field | EN | IT |
|---|---|---|
| Title (string) | Voice AI Agent for Microsoft Teams | Voice AI Agent for Microsoft Teams |
| Org | DOIT · Lodestar Group | DOIT · Lodestar Group |
| Role | AI & Software Developer · Internship | AI & Software Developer · Tirocinio |
| Period | 2025–2026 | 2025–2026 |

> Nota: il codice usa `org: "DOIT · Lodestar Group"` (senza "S.r.l, Fabriano") e `period: "2025–2026"`. La forma estesa "DOIT S.r.l (Lodestar Group), Fabriano · Nov 2025 – Feb 2026" resta valida come dato anagrafico/CV ma NON e cio che renderizza la card.

```
CONTEXT
EN: A hands-free voice AI agent inside Microsoft Teams for managing appointments
    by voice note.
IT: Un agente vocale AI hands-free dentro Microsoft Teams per gestire gli
    appuntamenti tramite note vocali.

PROBLEM
EN: Busy professionals needed to manage meetings without typing — creating and
    updating appointments, finding colleagues and contacts, and sending invites,
    entirely through natural-language voice.
IT: Professionisti impegnati avevano bisogno di gestire le riunioni senza
    digitare — creare e aggiornare appuntamenti, trovare colleghi e contatti, e
    inviare inviti, interamente tramite voce in linguaggio naturale.

ACTION
EN: Built a voice agent that creates and updates meetings, searches colleagues
    and contacts in Dynamics 365, adds contacts and sends invites — all from
    natural-language voice notes. Real-time speech-to-text with Azure Speech
    Services, orchestrated through Copilot Studio + Power Automate. Built a
    Pro-Code Angular + TypeScript front-end that bridges to the Low-Code layer,
    keeping the UX consistent between Teams and a standalone web app.
IT: Costruito un agente vocale che crea e aggiorna riunioni, cerca colleghi e
    contatti in Dynamics 365, aggiunge contatti e invia inviti — tutto da note
    vocali in linguaggio naturale. Speech-to-text in tempo reale con Azure Speech
    Services, orchestrato tramite Copilot Studio + Power Automate. Realizzato un
    front-end Pro-Code Angular + TypeScript che fa da ponte verso il layer
    Low-Code, mantenendo la UX coerente tra Teams e una web app standalone.

RESULT
EN: A working hands-free assistant that turns spoken intent into real calendar
    and CRM actions, with a consistent experience across Teams and web.
IT: Un assistente hands-free funzionante che trasforma l'intento vocale in azioni
    reali su calendario e CRM, con un'esperienza coerente tra Teams e web.
```

**Stack (come da codice):** `Azure Speech`, `Copilot Studio`, `Power Automate`, `Dynamics 365`, `Angular`, `TypeScript`.

**Metrics:** nessuna nel data file (campo `metrics` omesso) — il progetto e qualitativo. Eventuali numeri (es. riduzione tempo di scheduling) sono openQuestion — non inventare.

**Links:** nessuno (campo `links` omesso): progetto aziendale interno, repo/live non pubblici.

---

### 4.3 SerSan — Project I `[PROVISIONAL]`

`slug: "sersan-project-1"` · `status: "provisional"` · `order: 3` · `org: "SerSan · AI Studio"` · `period: "2026 – present"`

> ATTENZIONE AGENTE: contenuto PLACEHOLDER. Non pubblicare come definitivo. Mostrare badge `WORK IN PROGRESS` / `IN LAVORAZIONE`. Compilare solo dopo conferma di Alberto (vedi sezione 6).

| Field | EN | IT |
|---|---|---|
| Title (string, current code) | SerSan — Project I | SerSan — Project I |
| Org | SerSan · AI Studio | SerSan · AI Studio |
| Role | Software Engineer | Software Engineer |
| Period | 2026 – present | 2026 – present |

> Il `title` shippato e il placeholder "SerSan — Project I"; il titolo *reale* del progetto resta openQuestion (`problem`/`action`/`result` sono `[[TBD]]` nel codice).

Nel codice i campi `problem`/`action`/`result` sono valorizzati con i placeholder letterali (`[[TBD …]]` EN / `[[DA DEFINIRE …]]` IT). NON c'e un campo `context` ne una chiave i18n separata `projects.placeholder.body`: il copy di riempimento, se serve, va aggiunto in fase di build delle card o direttamente nei campi `[[TBD]]`. Testo di riempimento suggerito finche e provvisorio:

```
EN: Details coming soon. This project was built at SerSan · AI Studio and is
    being prepared for the portfolio.
IT: Dettagli in arrivo. Questo progetto e stato realizzato in SerSan · AI Studio
    ed e in fase di preparazione per il portfolio.
```

**Stack (code):** `["TBD"]` (placeholder; non assumere AI/full-stack). **Metrics:** assenti (campo omesso). **Links:** assenti (campo omesso).

---

### 4.4 SerSan — Project II `[PROVISIONAL]`

`slug: "sersan-project-2"` · `status: "provisional"` · `order: 4` · `org: "SerSan · AI Studio"` · `period: "2026 – present"`

> Identico trattamento di 4.3. Placeholder fino a conferma.

| Field | EN | IT |
|---|---|---|
| Title (string, current code) | SerSan — Project II | SerSan — Project II |
| Org | SerSan · AI Studio | SerSan · AI Studio |
| Role | Software Engineer | Software Engineer |
| Period | 2026 – present | 2026 – present |

```
PROBLEM / ACTION / RESULT  EN/IT: [[TBD — confirm with Alberto]]
```

**Stack (code):** `["TBD"]`. **Metrics / Links:** assenti (campi omessi).

---

### 4.5 Agricultural Supply Chain Platform — Academic `[CONFIRMED]`

`slug: "agricultural-supply-chain"` · `status: "confirmed"` · `order: 5` · `title: "Agricultural Supply Chain Platform"` · `org: "University of Camerino · Academic"` · `period: "2024"`

| Field | EN | IT |
|---|---|---|
| Title (string) | Agricultural Supply Chain Platform | Agricultural Supply Chain Platform |
| Org | University of Camerino · Academic | University of Camerino · Academic |
| Role | Backend Engineer · Team of 3 | Backend Engineer · Team di 3 |
| Period | 2024 | 2024 |

```
CONTEXT
EN: A multi-actor platform modelling an agricultural supply chain with 10
    distinct roles, built as a university software-engineering project.
IT: Una piattaforma multi-attore che modella una filiera agricola con 10 ruoli
    distinti, realizzata come progetto universitario di ingegneria del software.

PROBLEM
EN: Coordinate ten different actors across an agricultural supply chain with
    clean role separation, secure auth and a maintainable, well-documented design.
IT: Coordinare dieci attori diversi lungo una filiera agricola con netta
    separazione dei ruoli, autenticazione sicura e un design manutenibile e ben
    documentato.

ACTION
EN: Designed and built a Spring Boot backend with Spring Security and JWT auth
    over a PostgreSQL database, exposing a REST API. Followed the Unified Process,
    applied GoF design patterns and modelled the system with UML, in a 3-person
    team across 96 commits.
IT: Progettato e realizzato un backend Spring Boot con Spring Security e auth JWT
    su database PostgreSQL, esponendo una REST API. Seguito lo Unified Process,
    applicati i design pattern GoF e modellato il sistema con UML, in un team di
    3 persone e 96 commit.

RESULT
EN: A working multi-role platform with a documented, pattern-driven architecture
    and a clean REST API — delivered as a team.
IT: Una piattaforma multi-ruolo funzionante con architettura documentata e
    pattern-driven e una REST API pulita — consegnata come team.
```

**Stack (come da codice):** `Java`, `Spring Boot`, `Spring Security`, `PostgreSQL`, `JWT`, `REST`, `UML`. (`GoF Design Patterns` / `Unified Process` restano citati nella prosa ACTION, non nell'array `stack`.)

**Metrics:** nel codice il campo `metrics` e **assente** per questo progetto. I valori `10 ruoli` / `team di 3` / `96 commit` sono fatti confermati citati nella prosa; se si vogliono esporre come badge metrici vanno aggiunti esplicitamente all'array `metrics` (decisione aperta).

**Links (come da codice):** `[{ label: "GitHub", href: "https://github.com/daveeCity/IDS_GROUP_PROJECT" }]`. Lo shape e `{ label, href }` — non c'e il campo `kind`.

---

## 5. CHECKLIST DI BUILD per la sezione S4 (per l'agente)

- [x] Content model in **un solo file** `src/data/projects.ts`: `type Project` (plain TS, no zod), array `projects`, export `projectsSorted` (ordinato per `order`). NIENTE `types.ts`/`index.ts` dedicati ne file per-slug.
- [x] Gruppi skill in `src/data/skills.ts` (`type SkillGroup`, array `skillGroups`).
- [ ] Tipi garantiti da `tsc` (`bun run typecheck`). NON usare `ProjectSchema.parse()` ne Vitest (non installato — vedi `docs/01-TECHSTACK.md`).
- [ ] Le card `provisional` mostrano il badge WIP; per nascondere un link **omettere** il campo `links` (opzionale) anziche usare `href === ""`.
- [ ] Bio va in `src/data/translations/{en,it}.ts` (dizionario nidificato per-sezione). Stato attuale: bio condensata sotto `intro.*` (`eyebrow`/`heading`/`body1`/`body2`) + `hero.tagline`; le chiavi `bio.*` complete sono da cablare quando la S2 ABOUT si estende. Le skills NON stanno nelle translations: vivono in `src/data/skills.ts`.
- [ ] Non esporre `alberto.t@sersan.dev`; email pubblica = `albertotuveri@gmail.com`.
- [ ] Nessuna metrica inventata: ogni `[[TBD]]` resta tale finche Alberto conferma.
- [ ] Copy passa per le skill `copywriting` / `avoid-ai-writing` / `professional-proofreader` prima del merge (vedi `docs/10-SKILLS.md`).

---

## 6. OPEN QUESTIONS — cosa serve da Alberto

Decisioni e asset da raccogliere prima di considerare questo documento "completo". Marcare risolto quando confermato.

1. **SerSan Project #1 e #2** — titolo, contesto, Problem/Action/Result, stack, metriche, eventuali link/screenshot. Sono i due blocchi `[PROVISIONAL]` (4.3, 4.4). Bloccante per la pubblicazione di quelle card.
2. **Badante24h** — il repo e pubblico o privato? C'e un URL di produzione linkabile? Eventuali screenshot/asset per la card.
3. **DOIT Voice AI Agent** — esiste materiale condivisibile (demo video, screenshot anonimizzati)? Confermare che non ci sono vincoli NDA prima di descriverlo nel dettaglio.
4. **Metriche aggiuntive** — esistono numeri verificabili per DOIT (es. % tempo risparmiato) o Badante24h (es. utenti/match) che Alberto vuole esporre?
5. **Foto / asset personali** — serve la clip Higgsfield del tuffo a Pan di Zucchero per S3 (vedi `docs/05-CINEMATIC-SCROLL.md`) e, opzionalmente, un ritratto per S2.
6. **Lingua di default** — confermare che il sito apre in EN con toggle IT (assunto corrente da `docs/00-PRD.md`).
7. **Voce "SerSan" nel CV** — il PDF non e aggiornato; confermare il mese d'inizio esatto (assunto: maggio 2026) e il titolo esatto del ruolo.
8. **Diploma / dettagli education** — anno esatto del diploma all'Ist. Boccaccio (placeholder attuale: data assente).

---

## 7. CROSS-REFERENCES

- Visione, sitemap, content model d'insieme → `docs/00-PRD.md`
- Stack, versioni, struttura `src/data`, tooling (no zod/Vitest a runtime) → `docs/01-TECHSTACK.md`
- Voce del copy, token, estetica delle card → `docs/02-DESIGN.md`
- Store i18n, mappa scena↔sezione, routing `/work/[slug]` → `docs/03-ARCHITECTURE.md`
- Skill `Three.js / WebGL` (hero gira su WebGPU MLS-MPM) → `docs/04-3D-HERO-WATER-LOGO.md`
- Asset video del tuffo (open question #5) → `docs/05-CINEMATIC-SCROLL.md`
- Routing skill di copy/QA → `docs/10-SKILLS.md`
- Gates e disciplina di pubblicazione → `docs/11-WORKFLOW.md`
