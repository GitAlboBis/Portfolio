# PRODUCT.md — Verità di prodotto del portfolio (redesign 2026-09)

> Documento di **verità di prodotto** (chi, per chi, cosa deve provare, con quali asset e vincoli). Lo leggono per primi Impeccable, l'hook `ui-design` e ogni agente che tocca la UI. **Non** contiene decisioni visive: quelle vivono in `DESIGN.md` (scritto a fine build dal mondo costruito, non prima).
> Fonte dei fatti: **`CVAlbertoTuveri202609.pdf` (settembre 2026)**, trascritto in fondo (§9). Sostituisce `docs/07-PROJECTS.md` e ogni copy oggi in `src/content/*` per tutto ciò che riguarda ruolo, esperienze, progetti, skill, formazione.
> Voce: prosa in italiano; fatti, nomi di stack, copy del sito in inglese (poi tradotti in IT in `dict.ts`).

---

## 1. Cos'è

Portfolio personale di **Alberto Tuveri**. Un sito statico, non un'app (`public/proto/rivista/`, riallineato il 2026-11-11 al sito rifatto da zero): sei pagine separate sul fondo notturno, copertina (`index.html`), Work, About, Consulting, Obla, Contact (l'alba), più nove pagine di caso e un 404; ogni pagina è fatta di scene a tutto schermo con il palco WebGPU sopra e chiude all'alba con l'indirizzo. Bilingue **EN (default) / IT**: due edizioni costruite da una sola sorgente di parole (`parts/strings.mjs`, `parts/cases.json`), l'italiano in `it/`; il cambio di lingua porta alla stessa pagina dell'altra edizione.

**Il meccanismo unico del soggetto in una frase:** un ingegnere che copre *l'intero* stack — dallo schema del database e dal security hardening fino al rendering WebGPU in tempo reale e alla motion design — e che dirige anche l'output creativo (identità, brand film). Il portfolio deve **dimostrare** questa ampiezza, non dichiararla.

## 2. Per chi (scena reale)

| Pubblico | Scena | Cosa deve capire in 45 secondi | Azione |
|---|---|---|---|
| Recruiter / CTO / head of engineering (EN) | Laptop, dopo il CV, mezz'ora tra un colloquio e l'altro | Chi è, che ruolo copre, tre prove concrete con numeri, dove lavora ora | Scrivere una mail · aprire LinkedIn/GitHub |
| Studio / agenzia creativa / cliente (EN/IT) | Desktop + telefono, valuta gusto e capacità tecnica insieme | Che sa fare WebGPU/3D/motion **e** brand/film, con esempi pubblici (sersan.io, spherenode.com) | Aprire i case study · contattare |
| Mercato italiano (IT) | Telefono | Lo stesso, in italiano, senza perdere nulla | Idem |

**Modalità (Impeccable): Experience** — il lavoro guida dalla prima viewport e l'interfaccia arretra — con un innesto **Persuade**: offerta intelligibile (chi/cosa), azione visibile (contatto), prova che solo lui può mostrare (WebGPU dal vivo, numeri veri).

**Successo:** un visitatore che se ne va dopo una viewport sa descrivere un'ora dopo *cosa* ha visto (non un mood). Chi scorre trova prove, numeri e un modo per contattarlo senza cercare.

## 3. Cosa deve provare (le prove, dal CV)

Fatti pubblicabili, **solo** questi numeri (mai inventarne):

1. **SphereNode** (spherenode.com, pubblico) — SaaS verticale che ha sostituito 8 tool per il retail-trading italiano. **Sphere AI**: mentor RAG bilingue; su un set di valutazione di 161 domande: answer-policy accuracy **52% → 68%**, over-answering **56% → 16%**, clarification precision **75% → 94%** e recall **32% → 90%**, unsupported claims **1.9% → 0.6%**, citation correctness **100%**, zero leak di contenuti bloccati. Pipeline pagamenti→entitlement come state machine testata (5 difetti revenue-critical chiusi); 6 difetti di access-control chiusi pre-lancio (+ audit da 33 finding); outage silenzioso di **21 job schedulati** root-caused + monitoring; Trading Journal analytics; video live su Cloudflare Stream; release manager di **21 delle 49** release di produzione.
2. **Maintech OMA** (cliente, interno) — ERP per officina veicoli pesanti (~50 persone): architettura fondata da zero, design system "Diesel & Safety" (token, light/dark, libreria componenti), modello di sicurezza database-first (**9 ruoli**, default-deny su ogni tabella), state machine a **6 fasi** per gli ordini di lavoro, integrazione fornitori su **10 portali**, privilege escalation ad alta severità chiusa.
3. **sersan.io** (pubblico) — sito dello studio rifatto da solo, WebGPU-first: **17 scene scroll-locked** su un solo canvas 3D; compute shader: marchio a particelle, intro wordmark da **48.000 particelle**, morph ritratto da **80.000 celle**; black hole raymarched, materiale cristallo rifrattivo, selective bloom; device tiering (scena intera su GPU mobile deboli a ¼ dei pixel); **Lighthouse Accessibility 100 e SEO 100**; layout mobile rifatti, home mobile ridotta a 2/3.
4. **Domus Tua** (cliente) — piattaforma brand immobiliare: intro animata, transizioni ad arco, storytelling a capitoli, alternative reduced-motion e no-JS, zero layout shift; **LCP mobile 4,75 s → 1,74 s**, **TBT 572 ms → 274 ms**; redirect legacy, structured data, persona dell'assistente AI.
5. **Identità SerSan + brand film** — marchio esagonale, display typeface custom, sistema colore; brand film **64 secondi in 4K, 14 scene**, motion/VFX/3D, post-produzione completa (compositing, colore, sound design).
6. **Badante24h** (ALS MCL Civitanova, freelance, gen 2026–oggi) — PWA in produzione: offline via Service Worker, Web Push VAPID, messaggistica realtime, ricerca geospaziale **sub-secondo** (PostGIS), RLS ovunque, **zero vulnerabilità auth note al lancio**, Sentry su 3 layer.
7. **Voice AI Agent per Microsoft Teams** (DOIT S.r.l, stage, nov 2025–feb 2026) — agente vocale hands-free (Azure Speech, Copilot Studio, Power Automate, Dynamics 365) + front-end Angular.
8. **Agricultural Supply Chain Platform** (UniCam, accademico, team di 3, repo pubblico) — Spring Boot, JWT RBAC, **10 ruoli**, Unified Process, GoF, UML.
9. **Questo portfolio** — hero WebGPU con fluido da **120.000 particelle** tenuto nella forma di una "A" (rifrazione, schiuma, glint, scritto direttamente contro l'API GPU); drone footage proprio, color-graded, scrubbato allo scroll. *(Sono claim del CV: se il redesign li elimina, il CV va aggiornato — decisione da segnalare ad Alberto.)*

**Identità:** "Software & AI Engineer · Creative Lead · Full-Stack · WebGPU / 3D & Motion". SerSan — AI Studio (Sersan Limited, London, remote), maggio 2026–oggi. **M.Sc. Artificial Intelligence Systems, Università di Trento** (set 2026–oggi); **B.Sc. Computer Science, Università di Camerino** (gen 2022–apr 2026), tesi *"From Autocomplete to Agentic Orchestration: Architectural Analysis and Security of OS-Level Agents"*; diploma tecnico IT, Ist. Boccaccio Iglesias (2017–2020). Lingue: italiano madrelingua, inglese B1 → C1 in corso.

**Skill (8 gruppi, dal CV):** Core · Front-End · 3D & Graphics · Back-End & DB · AI · Cloud & DevOps · Testing & Tooling · Creative (elenco esatto in §9).

**Link pubblici:** albertotuveri@gmail.com · linkedin.com/in/albertotuveri · github.com/GitAlboBis · spherenode.com · sersan.io · github.com/daveeCity/IDS_GROUP_PROJECT. **Il telefono non si pubblica.** L'email aziendale SerSan non si pubblica.

## 4. Cosa NON è vero / non va detto

- Non è nel CV (da togliere): "five years", "Selected Work 2021—2026", "Lodestar Group", "<5min deploy", "96 commits", "2024" e "Backend Engineer" per il progetto UniCam, "Based in Camerino", i placeholder "SerSan — Project I/II · TBD".
- La narrativa **Sardegna / Masua / Pan di Zucchero / "interfacce che si muovono come l'acqua"** è una scelta di storytelling delle versioni precedenti, non un fatto del CV (il CV cita Iglesias solo per diploma e stage). Può sopravvivere solo come dettaglio biografico, mai come tesi del sito. Alberto ha rifiutato il look che ne derivava.

## 5. Asset disponibili (reali, in repo)

- **Il palco WebGPU del sito** (2026-11-11): `public/proto/rivista/stage/**` con l'host `fx-stage.js`, WGSL scritto a mano, nessuna dipendenza: uno sciame di punti (luce sulla notte, inchiostro all'alba) e lastre di vetro tagliato che tengono le catture dei lavori e piegano lo sciame e il tipo dei titoli; disegna dal vivo le scene di ogni pagina (la lastra sul nome in copertina, la galleria dei nove lavori, le barre misurate, la pila delle competenze, il percorso, le figure di Consulting e Obla). Il personaggio di Obla è disegnato dalle funzioni di forma dell'app (`C:/Users/alber/Obla/apps/obla/src/character/`), letto, mai modificato.
- **La A d'acqua** (motore `public/proto/rivista/water/`, `fx-water.js`, le tavole `fx-plate-v*.webp`, la figura delle passate `figs/`): **tolta dal sito e cancellata dal tree** il 2026-11-10 per decisione di Alberto; resta nella storia git fino a `ac7e83f`. Il fluido MLS-MPM della vecchia app `src/webgl/waterball/**` è storico come il resto di `src/`.
- **Video drone** (propri, DJI Air 3S) e still delle versioni precedenti: non sono più nel repo (`public/coast`, `public/works`, `public/frames` non esistono); i master sono sul PC di Alberto. Il sito vivo non usa video.
- **Asset della vecchia app ancora nel repo:** `public/bench/*`, `public/cubemap/*` (cubemap tramonto): **dead weight** per il sito vivo, da togliere insieme a `src/` se il port a Next.js viene abbandonato.
- **Still dei lavori** (tutti in `public/captures/`, origine di ciascuno in `public/captures/PROVENANCE.md` e nell'EXIF del file): catture dei siti pubblici **sersan.io** e **spherenode.com** (16 set 2026) e della preview cliente di **Domus Tua** `domus-tua-ten.vercel.app` (9 ott 2026, mai linkata: il link resta pending); per **Sphere AI** un ritaglio della cattura della pagina live del mentor fatta per il promo SerSan (3 set 2026, intestazione d'account ed elenco conversazioni tolti); per il **brand film** due fotogrammi del master 4K (900 e 1560, render aerender dell'8 set 2026); per la **Supply Chain** UniCam un ridisegno del class diagram «Project class diagram 4» dal modello Visual Paradigm del team (ridisegnato l'11 novembre sul fondo notturno in Sofia Sans, stesso modello). **Nessuno** still di Maintech OMA, Badante24h (l'hero pubblico stampa lo stato vuoto dei profili) e Voice AI Agent; **nessun** ritratto di Alberto; **nessun** link al brand film.
- Catturabili subito con Playwright (siti pubblici): **sersan.io**, **spherenode.com**, il repo GitHub del progetto UniCam.

## 6. Vincoli (non negoziabili)

- Stack (sito vivo, 2026-11-11): HTML, CSS e JavaScript scritti a mano, assemblati da Node (`public/proto/rivista/assemble.mjs`, nessuna dipendenza) e serviti statici · GSAP 3.15.0 + Lenis 1.3.26 da jsDelivr (**un solo ticker**, `fx-core.js`) · WebGPU raw con WGSL a mano per il palco, niente three.js · strumenti: Playwright su Chrome headless, `sharp`, Python per il server statico. L'app Next.js in `src/` è storica finché Alberto non decide il port.
- **Bilingue**: ogni parola visibile passa da `parts/strings.mjs` o `parts/cases.json` (ogni voce un gemello EN/IT); `assemble.mjs --check` rifiuta una stringa senza gemello, inglese rimasto su una pagina italiana, due pagine gemelle con elementi diversi. Title, description, `hreflang` e share card per pagina e per lingua.
- **Performance**: un solo canvas WebGPU per pagina (il palco), budget GPU per tier (A 3,5 ms; misurato 1,5–1,8 ms in copertina a 1440×900, 0,64–0,70 ms al telefono), conteggio dimezzato se si sfora; il palco si muove solo per 5 s dopo un input e poi non disegna più; Lighthouse mobile ≥ 80 (ultimo dato 4 ottobre, prima del sito nuovo: da rimisurare); nel DOM si animano solo opacità e sfocatura (il verbo «focus») e la traslazione del foglio del taglio.
- **Accessibilità AA** sulla notte e all'alba: contrasto ≥ 4,5:1 (testo `#cfcabf` su `#0c0e14` 11,81:1, etichette `#9a958a` 6,47:1, all'alba testo `#3a3f4b` su `#f3f4f6` 9,58:1; il cobalto non è mai testo sulla notte), `focus-visible` (sulla notte con `--accent`, all'alba con `--cobalt`), tastiera, reading order, canvas `aria-hidden`, nulla che il lettore debba sapere esiste solo nel canvas; `prefers-reduced-motion`, assenza di WebGPU, assenza di script e stampa = la pagina completa in flusso semplice con le immagini vere; `html lang` coerente con l'edizione.
- **Nessun contenuto inventato**: numeri e claim solo da §3/§9 (§10–§11 per Consulenza e Obla, solo in ambito globale; gate `scripts/check-claims-proto.mjs`); ciò che manca resta un buco dichiarato; Obla senza riga di stato, per decisione di Alberto.
- Push, merge e deploy solo con il sì esplicito di Alberto (il branch del sito, `feat/water-viva`, non è mai stato pushato). La chiave `localStorage` `ocean-ui`, il solver G4 e il deploy automatico di `main` su Vercel riguardano la vecchia app.

## 7. Il "solco" della categoria (da evitare, Impeccable §3)

Pagina che questa categoria spedisce sempre: sfondo quasi nero, nome gigante, blob che segue il cursore, bento di skill con loghi, griglia "Selected Works" con hover-reveal, marquee di loghi tech, gradiente viola "AI". Opposto prevedibile: lista tipografica bianca minimale. **Entrambi sono il solco**: la direzione scelta deve essere riconoscibile con tutto il contenuto rimosso e derivare dal mondo del soggetto (rendering, particelle, film, officina, trading, brand system), non dalla categoria.

## 8. Domande aperte per Alberto (buchi dichiarati)

1. Still/screenshot o link per **Maintech OMA**, **Domus Tua** (URL pubblico?), **brand film** (embed/link?), **Badante24h** (URL prod?).
2. Un **ritratto** (foto) da usare, o preferenza per nessun volto.
3. Conservare un accenno biografico alla Sardegna (Iglesias) in `/about`? (Oggi: no nel copy principale.)
4. Il **brand film SerSan** può essere mostrato pubblicamente (NDA)?
5. Se il redesign abbandona hero-fluido o drone-scrub, aggiornare la voce "Personal Portfolio" del CV.

## 9. CV — trascrizione integrale (settembre 2026, telefono omesso)

```

--- page 1 ---
Alberto Tuveri
Software & AI Engineer · Creative Lead · Full-Stack · WebGPU / 3D & Motion
SUMMARY
Software and AI engineer comfortable across the entire stack — from database schema design and security hardening to real-
time WebGPU rendering and motion design. Currently Software & AI Engineer and Creative Lead at SerSan, where I own the
front-end, 3D and motion layer of everything the studio ships, build the AI layer of a live trading platform, and direct the studio's
creative output — brand identity, brand film and video. B.Sc. in Computer Science (University of Camerino, 2026); currently
studying for an M.Sc. in Artificial Intelligence Systems at the University of Trento.
WORK EXPERIENCE
SerSan — AI Studio May 2026 – Present
Software & AI Engineer · Creative Lead · Sersan Limited (London) · Remote
Custom software, automation and AI studio. Own the front-end, WebGPU/3D and motion layer of what the studio ships, the AI
work on its flagship platform, and the studio's creative direction.
Work delivered at SerSan:
SphereNode · production platform, live at spherenode.com
Vertical SaaS that replaced eight tools (Circle, Teachable, Zoom, Intercom, HubSpot, Mailchimp, Stripe, Notion) for the
Italian retail-trading market — React 18 · Vite · Supabase (Postgres, RLS, Realtime, pgvector, Edge Functions) · Whop ·
Cloudflare Stream · Capacitor.
Designed and built Sphere AI, the platform's bilingual (IT/EN) RAG mentor, grounded only in the proprietary curriculum:
semantic chunking and embeddings in pgvector, tier-aware retrieval with a curated fast path for canonical answers, and
a generation layer with an LLM relevance grader on top.
Raised its answer reliability, measured on a 161-question bilingual evaluation set: answer-policy accuracy 52% → 68%,
over-answering on questions it should withhold 56% → 16%, clarification precision 75% → 94% and recall 32% → 90%,
unsupported claims 1.9% → 0.6%, citation correctness 100%, with zero locked-content leaks and zero fabricated
citations.
Built the guardrails behind those numbers: the mentor asks for clarification instead of guessing, refuses questions built
on a false premise or asking for unsafe actions, requires live evidence before answering anything time-sensitive, and
never lets static FAQ content stand in for current market information.
Rebuilt the payments-to-entitlement pipeline as a tested state machine, closing five revenue-critical defects — access
surviving cancellation, disputes and unknown events defaulting to open, empty lookups downgrading paying users,
duplicate rows stranding paid customers, and out-of-order events resurrecting revoked access.
Closed six access-control defects on a paywalled product before public launch, including an unauthenticated leak of the
Elite portfolio dashboard, a tier leak exposing 206 live sessions and 79 transcripts to free accounts, and a permission
rule letting any member edit or unpublish any live course — alongside a 33-finding security audit remediated in one
batch.
Root-caused a silent outage in which 21 scheduled jobs had been dead for weeks while every dashboard still reported
success, then built the monitoring and alerting that had been missing so the same failure cannot go unnoticed again.
Built the Trading Journal analytics engine — trade reconstruction from broker fills, gross-versus-net classification, pip
and live-FX sizing, multi-account cash-flow ledger — validated against real broker exports, and made it available to the
mentor as a consent-gated, owner-only data source with personal data excluded by default.
Built the live-session video pipeline on Cloudflare Stream — professional RTMP ingest with a fallback path for corporate
networks that block it, adaptive playback, and a recording flow that stopped losing sessions to failed renders — and
acted as release manager for 21 of the platform's 49 production releases, including the public launch.
Maintech OMA — workshop ERP · Vite · React 18 · TypeScript · Supabase (Postgres 17, RLS, Edge Functions) ·
TanStack Query
Custom ERP for a heavy-vehicle workshop (~50 staff across mechanics, mechatronics, auto-electrics, bodywork and
refrigeration).
Founded the system and its architecture — the application scaffold, the 'Diesel & Safety' design system (design tokens,
light and dark themes, a component library) and the first database schema — the foundation the rest of the product was
built on.
Designed a database-first security model that cannot be bypassed from the client: nine roles, default-deny access rules
on every table, per-site data segregation and permissions held in the database rather than in tokens; the first database
test suite written against it exposed three live defects, fixed before they reached production.
Delivered the domain core: customers, vehicles with equipment and inspection deadlines, job orders on a six-phase
state machine with role-gated transitions and safe numbering under concurrency, a parts catalogue with multi-supplier
price comparison, and purchase orders.
Activated the supplier integration across ten trade portals — a connector console, article-level price comparison and a
caching layer that never degrades a good supplier response — and closed a high-severity privilege escalation that let
any user with price access alter where supplier credentials were sent.

--- page 2 ---
sersan.io — studio website · sole engineer and designer · Jun – Sep 2026
Next.js 16 · React 19 · three.js (WebGPU/TSL) · React Three Fiber · GSAP + Lenis · Tailwind v4 · Vercel.
Rebuilt the studio's public site single-handedly as a WebGPU-first cinematic experience: one continuous 3D canvas
carrying seventeen scroll-locked scenes across the site, with an automatic fallback for machines without WebGPU and
recovery if the graphics context is lost.
Wrote the GPU work in compute shaders — a particle brand mark, a 48,000-particle wordmark intro and an 80,000-cell
portrait morph lit from generated depth maps — plus a raymarched black hole, a custom refractive crystal material and
a selective-bloom post-processing chain.
Designed a device-tiering system that runs the full scene on weak mobile GPUs at a quarter of the pixels without
removing a single effect, and reached Lighthouse Accessibility 100 and SEO 100 with reduced-motion paths and non-
JavaScript equivalents for every 3D section.
Brought the whole experience to phones: rebuilt the mobile layouts, restored accessible touch targets across the site
after tracing every control being undersized to a single styling rule, and cut the mobile home page to two-thirds of its
length.
Domus Tua — real-estate brand platform · Next.js 16 · GSAP · Lenis · Supabase
Art-directed and built the site's cinematic scroll experience — animated intro, arched page transitions and chapter-
based storytelling — with complete reduced-motion and no-JavaScript alternatives, and no layout shift.
Made it fast on real phones: mobile largest-contentful-paint from 4.75 s to 1.74 s and blocking time from 572 ms to 274
ms, after tracing the delay to the cookie banner and rebuilding the intro to run in CSS rather than JavaScript.
Prepared the launch: legacy URL redirects verified against the live listing catalogue, structured data for listings,
breadcrumbs and FAQs, and the site's AI assistant persona with its identity and safety rules.
Brand identity & brand film · Art direction · Motion graphics · VFX · 3D · Video
Designed the SerSan visual identity — the hexagonal mark, a custom display typeface and the colour system — and
carried it consistently across the website, the 3D scenes and the video work.
Directed and produced the studio's brand film: a 64-second 4K piece taken from concept and script through to final cut,
structured as a fourteen-scene narrative built on the studio's positioning.
Created its motion design and VFX — a light orb that ignites each interface element it passes, hexagon screen
transitions, 3D product scenes and a closing morph from the final line into the brand mark — with 4K kinetic typography
throughout.
Handled post-production end to end: compositing, colour and a sound-design pass timed to the cut.
ALS MCL Civitanova Jan 2026 – Present
Full-Stack Developer · Freelance · Marche, Italy
Badante24h — production PWA matching families with caregivers in the Italian home-care market.
Architected and shipped a full production PWA (Next.js 15 App Router, React 19, TypeScript strict, Supabase) with full
offline support via a custom Service Worker (Serwist) and VAPID-signed Web Push Notifications.
Built real-time messaging between families and caregivers using Supabase Realtime (WebSocket) with event-driven
subscriptions — a core product feature enabling instant in-app communication and integrated push notifications.
Engineered sub-second geospatial caregiver search using PostGIS 3 (GiST indexes, WGS-84 geography type), with
interactive maps via Leaflet/React-Leaflet and open-source geocoding (Photon + Nominatim) — avoiding costly third-party
map APIs entirely.
Hardened platform security end-to-end: Row-Level Security on every sensitive table, RBAC middleware (Next.js), HSTS,
restrictive CSP whitelist, and VAPID-signed push — achieving zero known auth vulnerabilities at launch.
Reduced observable error blind-spots to near-zero by integrating Sentry across 3 runtime layers (client / server / edge) with
a tunnel route bypassing ad-blockers, and delivered a localised (IT/EN) admin dashboard for caregiver identity verification
with server-side image optimisation (Sharp) and automated CI/CD on GitHub Actions.
DOIT S.r.l Nov 2025 – Feb 2026
AI & Software Developer · Internship · Fabriano, Italy
Designed and delivered a voice-powered AI agent for Microsoft Teams enabling hands-free appointment management from
audio notes: creating and updating meetings, searching colleagues and Dynamics 365 contacts, adding contacts and
sending invitations — all from natural-language speech processed by Azure Speech Services and orchestrated via Copilot
Studio and Power Automate.
Built the Pro-Code front-end in Angular + TypeScript that bridges the Low-Code automation layer, keeping UX consistent
across Teams and the standalone web app.
Integrated Azure Speech Services for real-time speech-to-text input, enabling hands-free interaction for field users — a
feature previously absent from the client's toolset.
Istituzione Paritaria Scuole Boccaccio Jan 2019 – Jan 2020
Network Technician Intern · Iglesias, Sardinia · School-Work Alternance
Planned and executed full structured-cabling of a two-floor school building; configured access points and switches to deliver
stable connectivity across 20+ classrooms.
SKILLS
Core: TypeScript · JavaScript (ES2024) · Python · Java · C / C++ · C#
Front-End: React 19 · Next.js 16 (App Router) · Angular · Tailwind CSS v4 · GSAP · Lenis · Framer Motion
3D & Graphics: WebGPU · WGSL / TSL · three.js · React Three Fiber · GLSL / WebGL2 · GPGPU compute · Blender

--- page 3 ---
Back-End & DB: Node.js · Deno · Spring · Supabase · PostgreSQL · PostGIS · pgvector · MySQL
AI: RAG & embeddings · LLM evaluation & guardrails · OpenAI / Anthropic / Gemini · Copilot Studio · Power
Automate · Dataverse · Dynamics 365 · Claude Code / MCP
Cloud & DevOps: Vercel · Azure (AD, Speech) · Cloudflare (Stream / R2) · GitHub Actions · Sentry · Docker
Testing & Tooling: Playwright · Vitest · pgTAP · Lighthouse CI · ESLint · Prettier · Git
Creative: Motion graphics & VFX (After Effects) · Video editing & post-production · Brand identity & logo design · Art
direction · Typography · Sound design
Languages: Italian (Native) · English B1 — C1 in progress
EDUCATION
University of Trento Sep 2026 – Present
M.Sc. in Artificial Intelligence Systems · Trento, Italy
University of Camerino Jan 2022 – Apr 2026
B.Sc. in Computer Science · Camerino, Italy
Thesis: From Autocomplete to Agentic Orchestration: Architectural Analysis and Security of OS-Level Agents
Analysed the architectural evolution from deterministic code completion to autonomous agentic systems (MCP, RAG, multi-agent
orchestration); mapped OS-level attack vectors (prompt injection, tool poisoning, MAS kill chain) against MITRE ATLAS and OWASP
Agentic Top 10; proposed Zero-Trust defence strategies for enterprise agentic pipelines.
Istituzione Paritaria Scuole Boccaccio Sep 2017 – Jan 2020
IT Technical Diploma · Iglesias, Sardinia
PROJECTS
Personal Portfolio · Personal · Next.js 16 · WebGPU / WGSL · WebGL2 · GSAP
Bilingual (EN/IT) cinematic portfolio.
Built a WebGPU hero in which a 120,000-particle fluid simulation is held in the shape of a living letter 'A', with real-time
refraction, foam and sun glints, written directly against the GPU API.
Shot and colour-graded my own drone footage as the cinematic backbone, scrubbed frame-accurately to the scroll,
alongside simulated water with real caustics and seamless page-to-page transitions — Lighthouse desktop 98/96/100/100.
Agricultural Supply Chain Platform · Academic · University of
Camerino · github.com/daveeCity/IDS_GROUP_PROJECT
Software Engineering exam project · Java · Spring Boot · Spring Security · PostgreSQL · JWT · REST · Unified Process ·
Design Patterns · UML
Designed and built a multi-actor supply chain management platform (10 roles: producers, curators, animators, buyers)
following the Unified Process: from requirements and use-case modelling to a layered Spring Boot implementation (MVC,
Repository + Service Layer, GRASP principles) with JWT-based RBAC — team of 3.
Applied Gang-of-Four Design Patterns throughout; modelled a relational PostgreSQL schema linking producers, products,
certifications, events and marketplace orders, exposed via REST APIs with geographic search and documented with full
UML artefacts.
Personal & open-source work: github.com/GitAlboBis
```

## 10. Consulenza (round "Storia", 2026-11-10)

La sezione 06 della home. Fonte: il messaggio di Alberto del 2026-11-09, verbatim:

> «il sito deve avere anche una sezione dedicata alla mia consulenza per generare contenuti con ai , video editing ,
> claude code best practice , sviluppo e collaudo di sistemi multi agente sia aziendali che utenti privati , e sezione
> del mio progetto personale Obla . tutto dev essere immersivo 3d»

- I quattro servizi: contenuti generati con l'AI (immagini, video, testi); montaggio video; Claude Code, buone pratiche;
  sistemi multi-agente, sviluppo e collaudo.
- Per chi: aziende e privati.
- Le prove stampate accanto ai servizi rimandano a fatti già in questo file: il brand film (§3, §9), Obla (§11), la tesi
  triennale *From Autocomplete to Agentic Orchestration* (§9). Il primo servizio non ha una prova pubblica: si stampa
  "Proof · On request".
- Non si stampano prezzi, pacchetti, nomi di clienti né numeri.

## 11. Obla, il progetto personale (round "Storia", 2026-11-10)

La sezione 07 della home. Fonti (dati, sola lettura): `C:/Users/alber/Obla/.claude/prds/obla.prd.md` (Problem, Scope
"MVP", Open Questions risolte il 2026-10-01/02), `C:/Users/alber/Obla/docs/adr/0011-cuscino-fantasma-e-reskin-legale-di-coucou.md`
(il personaggio), `C:/Users/alber/Obla/apps/obla/src/character/shape.ts`, `engine.ts`, `palette.ts` e `src/style.css`
(la forma e i colori del personaggio).

- Obla è l'agente personale di Alberto: una sola voce a cui parla invece di aprire sessioni, scrivere prompt e
  controllare a mano. Vive sul suo desktop, gira sulla sua macchina, risponde solo a lui. Per una persona sola, non è
  distribuito.
- Ascolta: il nome o un tasto tenuto premuto; la parola di attivazione e la catena vocale girano in locale.
- Pensa: un piccolo modello locale giudica la richiesta, un secondo tiene la conversazione, solo il lavoro vero passa a
  Claude Code (il modello a quattro livelli, confermato il 2026-10-01).
- Lavora: apre la sessione Claude Code giusta sulla repo giusta con il brief già scritto; il personaggio vola sulla
  finestra in cui il lavoro succede.
- Chiede: ciò che esce dalla macchina (un messaggio, un push, un deploy, una cancellazione) aspetta il sì di Alberto su
  una carta di approvazione.
- Riferisce: il report del mattino alle 08:00 (progetti, lavori, sessioni), a voce o scritto. La memoria sta in note
  Markdown che Alberto può leggere e modificare.
- Gira su: Windows, Tauri, Rust, modelli locali, Claude Code.
- Il personaggio: un cuscino chiaro (una superellisse) con l'orlo inferiore a onde e due occhi ovali verticali; la forma
  esatta e i colori sono quelli di `shape.ts`, `engine.ts` e `style.css` (i numeri di disegno restano lì: non sono
  affermazioni del sito).
- **Decisione di Alberto (2026-11-09): il sito non stampa nessuno stato del progetto** («come il primo, ma senza dire a
  che punto è, dobbiamo sviluppare la sezione come se fosse già completato»). Non si stampano clienti, l'indirizzo
  dell'azienda, nomi di modelli, dettagli di sicurezza, nomi di altri prodotti, obiettivi scritti come risultati.
  "08:00" è l'unico numero della sezione.
