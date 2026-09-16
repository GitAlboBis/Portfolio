# PRODUCT.md — Verità di prodotto del portfolio (redesign 2026-09)

> Documento di **verità di prodotto** (chi, per chi, cosa deve provare, con quali asset e vincoli). Lo leggono per primi Impeccable, l'hook `ui-design` e ogni agente che tocca la UI. **Non** contiene decisioni visive: quelle vivono in `DESIGN.md` (scritto a fine build dal mondo costruito, non prima).
> Fonte dei fatti: **`CVAlbertoTuveri202609.pdf` (settembre 2026)**, trascritto in fondo (§9). Sostituisce `docs/07-PROJECTS.md` e ogni copy oggi in `src/content/*` per tutto ciò che riguarda ruolo, esperienze, progetti, skill, formazione.
> Voce: prosa in italiano; fatti, nomi di stack, copy del sito in inglese (poi tradotti in IT in `dict.ts`).

---

## 1. Cos'è

Portfolio personale di **Alberto Tuveri**. Un sito, non un'app: single-page + poche route (`/work`, `/work/[slug]`, `/about`). Bilingue **EN (default) / IT** con toggle client (dizionario unico `src/content/dict.ts`, validato zod).

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

- **Motore fluido WebGPU** `src/webgl/waterball/**` (MLS-MPM, 120k particelle, SSF render con cubemap) — **G4**: il solver e il feel sono congelati; la *resa* (colori, backdrop, forma, composizione) si può ri-mettere in scena.
- **Video drone (propri, DJI Air 3S, LUT ufficiale):** `public/coast/{coast,rock,ascent,sea-loop}-{1600,960}.mp4` + poster; still `masua-cliff.webp`, `night-sea.webp`, `sulcis-map.webp`. Pesanti (coast 8,9 MB / rock 15 MB a 1600).
- **Still dei 3 lavori vecchi:** `public/works/{badante24h,doit-voice-ai-agent,agricultural-supply-chain}.webp` (generate, 1280 px — non fotografie di prodotto).
- **Cubemap tramonto** `public/cubemap/*`; `public/frames/*` (59 WebP della vecchia direzione "frame cinematici": **dead weight** da eliminare se non usati).
- **Nessuno** screenshot/still dei lavori SerSan; **nessun** ritratto di Alberto; **nessun** link al brand film.
- Catturabili subito con Playwright (siti pubblici): **sersan.io**, **spherenode.com**, il repo GitHub del progetto UniCam.

## 6. Vincoli (non negoziabili)

- Stack: Next.js 16 App Router · React 19 · TS strict · Tailwind v4 (`@theme`) · GSAP 3.15 + Lenis 1.3 (**un solo ticker**, `Smooth.tsx`) · three 0.184 + R3F 9 · WebGPU raw per l'hero · zustand · zod · **npm** · deploy Vercel. Niente Framer Motion, niente anime.js.
- **Bilingue**: ogni stringa visibile passa da `dict.ts` (shape EN≡IT). Metadata/OG oggi hardcoded EN: da riallineare al nuovo copy.
- **Performance**: 60 fps desktop; un solo renderer pesante per regione di scroll; mobile degradato con eleganza; Lighthouse mobile ≥ 80; animare solo `transform`/`opacity` (+ blur/clip/mask se restano fluidi); byte video su mobile sotto controllo.
- **Accessibilità AA**: contrasto ≥ 4,5:1 (testo su foto/gradiente incluso), `focus-visible`, tastiera, reading order, decorativo `aria-hidden`, `prefers-reduced-motion` = versione statica e leggibile di **ogni** effetto, `html lang` coerente col locale.
- **Nessun contenuto inventato**: numeri e claim solo da §3/§9; ciò che manca resta un buco dichiarato.
- Non rinominare la chiave `localStorage` `ocean-ui` senza migrazione. Non toccare il solver (G4). Merge su `main` = deploy automatico Vercel (G3: ok esplicito di Alberto — mandato "pieno controllo" ricevuto 2026-09-14).

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
