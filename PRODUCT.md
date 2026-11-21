# PRODUCT.md — Verità di prodotto del portfolio (redesign 2026-09)

> Documento di **verità di prodotto** (chi, per chi, cosa deve provare, con quali asset e vincoli). Lo leggono per primi Impeccable, l'hook `ui-design` e ogni agente che tocca la UI. **Non** contiene decisioni visive: quelle vivono in `DESIGN.md` (scritto a fine build dal mondo costruito, non prima).
> Fonte dei fatti: **`CVAlbertoTuveri202609.pdf` (settembre 2026)**, trascritto in fondo (§9). Sostituisce `docs/07-PROJECTS.md` e ogni copy oggi in `src/content/*` per tutto ciò che riguarda ruolo, esperienze, progetti, skill, formazione.
> Voce: prosa in italiano; fatti, nomi di stack, copy del sito in inglese (poi tradotti in IT in `dict.ts`).

---

## 1. Cos'è

Portfolio personale di **Alberto Tuveri**. Un sito statico, non un'app (`public/proto/rivista/`, riallineato il 2026-11-11 al sito rifatto da zero): sei pagine separate sul fondo notturno, copertina (`index.html`), Work, About, Consulting, Obla, Contact (l'alba), più dieci pagine di caso e un 404; ogni pagina è fatta di scene a tutto schermo con il palco WebGPU sopra e chiude all'alba con l'indirizzo. Bilingue **EN (default) / IT**: due edizioni costruite da una sola sorgente di parole (`parts/strings.mjs`, `parts/cases.json`), l'italiano in `it/`; il cambio di lingua porta alla stessa pagina dell'altra edizione.

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
10. **SerSan Agent OS** (SerSan, interno, repository privato; dopo il CV, letto nel codice il 20 novembre 2026) — il sistema multi-agente interno di SerSan, costruito da Alberto per lo studio: idea, proposta e direzione sue (proposta del 24 ottobre 2026, approvata dalla direzione di SerSan il 10 novembre 2026), codice dal 10 al 20 novembre 2026 con ogni commit sotto la sua identità, prodotto dirigendo una sessione Claude Code coordinatrice e **due** esecutrici con le sue direttive scritte. Dopo una chiamata con un cliente o ogni mattina gli agenti preparano riassunti, note per il CRM, cose da fare, follow-up, brief delle riunioni e uno stand-up degli agenti. **10 agenti** (9 accesi) su **3 corsie**: catene a schema (il codice sceglie passi e destinatari, il modello scrive solo dentro schemi Zod rigidi, senza strumenti), sessioni Claude Agent SDK a turni, Claude Code; un router manda ogni lavoro a una di **6 destinazioni** (una regola di codice, una catena su un modello open-weight ospitato in casa, una catena su Claude API, una sessione SDK, la corsia Claude Code, una persona), mosso da **12 tipi di evento**; un decisore risponde alle domande chiuse con una probabilità e sotto la soglia (0,80) manda il lavoro sulla strada più prudente. Gli agenti si passano il lavoro su una bacheca comune; un freno passa la decisione a una persona dopo **8 passaggi** o quando una coppia di agenti si rimbalza il lavoro più di due volte; una persona può fermare, correggere o rilanciare un compito. Il Cancello è l'unico componente che esegue azioni verso l'esterno: ogni azione ha uno di **quattro** livelli di autonomia, da **L0** (la fa una persona) a **L3** (esce da sola entro tetti giornalieri), con in mezzo **L1** (una carta che una persona approva) e **L2** (una finestra a tempo con un pulsante Stop), per agente, tipo di azione e classe di destinatario (**10 classi, 9 tipi di azione**); da L1 a L2 dopo **5 approvazioni di fila e 30 giorni** senza segnali negativi, da L2 a L3 dopo **15 finestre pulite e 60 giorni**, sempre con la conferma del responsabile; la discesa è automatica; pagamenti sempre manuali; cancellazioni, credenziali, segreti e permessi vietati nel codice; un controllo dei contenuti prima di ogni uscita L2 o L3; un registro solo in aggiunta, imposto da trigger; un arresto di emergenza; ogni messaggio inviato senza una persona porta una riga che dice che l'ha preparato un'AI. **2.513 test automatici passati e 0 falliti** il 20 novembre 2026 (macchina Linux di laboratorio, 222 file, 371 s; 2.514 su Windows), da **777** alla chiusura della prima milestone il 12 novembre; la suite deve dare nomi, esiti e conteggi identici in **tre** giri di fila; **28 scenari** di guasto end-to-end e **6** prove di continuità (il Cancello giù, due approvazioni nello stesso istante, istruzioni nascoste in un testo di terzi, l'arresto di emergenza, il motore che muore a metà catena, tre clienti in parallelo senza scambi), ognuno chiuso dal controllo che nessuna uscita abbia superato il suo livello. Revisioni avversarie del codice: prima milestone **12** difetti confermati (**1** critico, **4** alti, **7** medi), ciascuno corretto con un test visto fallire prima; seconda milestone **17** e **13** (nessuno critico o alto). In **11** giorni: **304** commit su main (**191** senza merge), **82** pull request, circa **96.000** righe di TypeScript (**37.600** di sorgente, **58.600** di test), **7** pacchetti, PostgreSQL 16 con **41** tabelle in **3** schemi. Il progetto completo della proposta: **57** agenti in nove squadre; questi 10 sono i primi costruiti. **Stato: costruito e collaudato, non in produzione**: gira su macchine di sviluppo con dati finti e un modello a copione al posto dei modelli veri; nessuna corsa con un modello vero (aspetta la chiave API). *(Fonti: repository privato SerSan Agent OS, letto il 20 novembre 2026 in sola lettura sul main di quel giorno: `README.md`, `.claude/prds/sersan-agent-os.prd.md`, `docs/attivita.md`, `docs/direttive.md`, il registro di esecuzione della milestone 2 in `docs/superpowers/plans/`, `agenti/*.yaml`, `config/livelli.yaml`, `config/instradamento.yaml`, `config/decisore.yaml`, `packages/motore/src/freno.ts`, `packages/motore/src/bacheca.ts`, `packages/contratti/src/limiti-fissi.ts`, `packages/scenari/test/`, i conteggi con git; repository privato dei documenti di SerSan Agent OS: `LEGGIMI.md`, `docs/01-panoramica.md`.)*
11. **Obla** (progetto personale, repository privato; dopo il CV, letto nel codice il 20 novembre 2026) — il sistema multi-agente personale di Alberto sul suo PC Windows, solo per lui e non distribuito (§11). **4 livelli** con ruoli fissi, «gli LLM propongono, il codice esegue»: il codice deterministico (un demone TypeScript e l'isola Tauri) è l'unico livello che produce effetti fuori dal PC, dopo una carta di approvazione; un giudice locale risponde alle domande chiuse, come quale agente prende un lavoro; un capo di gabinetto locale tiene la conversazione e scrive i brief; ogni lavoro è una sessione Claude Code. Un capo di gabinetto e agenti su **11 profili** (code, design, release, research, docs, motion, content, qa, prod, product, review); **6** agenti configurati sul suo PC. Sulla corsia più nuova (in costruzione) gli agenti si chiamano tra loro con un freno nel codice (di default **3** passi, **8** lavori, **20** USD e **6** in attesa per catena, tetto **10** passi, nessun agente due volte su un percorso, uno stop ferma tutta la catena) e si riuniscono in stanze di 2–6 agenti. Modelli scelti misurando sulla sua GPU: Gemma 4 12B l'unico sopra la soglia di 0,90 su **130** casi di tool calling in italiano (0,908), il giudice Qwen3-4B all'84,8% su **627** richieste di instradamento, Vulkan da 7 a 9 volte più veloce di ROCm. **3.288 commit in 47 giorni** (dal 2 ottobre al 17 novembre 2026), il 99,8% sotto la sua identità; circa **135.700** righe di sorgente (TypeScript circa 115.600, Rust circa 20.200); **67** ADR; sulla corsia più nuova **513** file di test TypeScript con **8.010** chiamate `it()`/`test()` e **487** test Rust; **712** criteri di accettazione in **8** registri, **422** con la loro evidenza (M1 10/10, SL+AG 161/161, PA 118/118 integrate). La ricerca è girata come un workflow di **51** agenti. *(Fonti: repository privato Obla, letto il 20 novembre 2026 in sola lettura: la corsia `ac/vertical-slice` (`CLAUDE.md`, `.claude/prds/obla.prd.md`, `docs/adr/`, `protocol/src/`, `packages/oblad/src/`, `research/README.md`), le corsie `m2`, `m3` e `ms3` per ciò che aggiungono, i registri `tests/acceptance/*.json`, i conteggi con git.)*

**Identità:** "Software & AI Engineer · Creative Lead · Full-Stack · WebGPU / 3D & Motion". SerSan — AI Studio (Sersan Limited, London, remote), maggio 2026–oggi. **M.Sc. Artificial Intelligence Systems, Università di Trento** (set 2026–oggi); **B.Sc. Computer Science, Università di Camerino** (gen 2022–apr 2026), tesi *"From Autocomplete to Agentic Orchestration: Architectural Analysis and Security of OS-Level Agents"*; diploma tecnico IT, Ist. Boccaccio Iglesias (2017–2020). Lingue: italiano madrelingua, inglese B1 → C1 in corso.

**Skill (8 gruppi, dal CV):** Core · Front-End · 3D & Graphics · Back-End & DB · AI · Cloud & DevOps · Testing & Tooling · Creative (elenco esatto in §9).

**Link pubblici:** albertotuveri@gmail.com · linkedin.com/in/albertotuveri · github.com/GitAlboBis · spherenode.com · sersan.io · github.com/daveeCity/IDS_GROUP_PROJECT. **Il telefono non si pubblica.** L'email aziendale SerSan non si pubblica.

## 4. Cosa NON è vero / non va detto

- Non è nel CV (da togliere): "five years", "Selected Work 2021—2026", "Lodestar Group", "<5min deploy", "96 commits", "2024" e "Backend Engineer" per il progetto UniCam, "Based in Camerino", i placeholder "SerSan — Project I/II · TBD".
- La narrativa **Sardegna / Masua / Pan di Zucchero / "interfacce che si muovono come l'acqua"** è una scelta di storytelling delle versioni precedenti, non un fatto del CV (il CV cita Iglesias solo per diploma e stage). Può sopravvivere solo come dettaglio biografico, mai come tesi del sito. Alberto ha rifiutato il look che ne derivava.

## 5. Asset disponibili (reali, in repo)

- **Il palco WebGPU del sito** (2026-11-11): `public/proto/rivista/stage/**` con l'host `fx-stage.js`, WGSL scritto a mano, nessuna dipendenza: uno sciame di punti (luce sulla notte, inchiostro all'alba) e lastre di vetro tagliato che tengono le catture dei lavori e piegano lo sciame e il tipo dei titoli; disegna dal vivo le scene di ogni pagina (la lastra sul nome in copertina, la galleria dei nove lavori, le barre misurate, la pila delle competenze, il percorso, le figure di Consulting e Obla). Il personaggio di Obla è disegnato dalle funzioni di forma dell'app (repository privato Obla, `apps/obla/src/character/`), lette, mai modificate.
- **La A d'acqua** (motore `public/proto/rivista/water/`, `fx-water.js`, le tavole `fx-plate-v*.webp`, la figura delle passate `figs/`): **tolta dal sito e cancellata dal tree** il 2026-11-10 per decisione di Alberto; resta nella storia git fino a `ac7e83f`. Il fluido MLS-MPM della vecchia app `src/webgl/waterball/**` è storico come il resto di `src/`.
- **Video drone** (propri, DJI Air 3S) e still delle versioni precedenti: non sono più nel repo (`public/coast`, `public/works`, `public/frames` non esistono); i master sono sul PC di Alberto. Il sito vivo non usa video.
- **Still dei lavori** (tutti in `public/captures/`, origine di ciascuno in `public/captures/PROVENANCE.md` e nell'EXIF del file): catture dei siti pubblici **sersan.io** e **spherenode.com** (16 set 2026) e della preview cliente di **Domus Tua** `domus-tua-ten.vercel.app` (9 ott 2026, mai linkata: il link resta pending); per **Sphere AI** un ritaglio della cattura della pagina live del mentor fatta per il promo SerSan (3 set 2026, intestazione d'account ed elenco conversazioni tolti); per il **brand film** due fotogrammi del master 4K (900 e 1560, render aerender dell'8 set 2026); per la **Supply Chain** UniCam un ridisegno del class diagram «Project class diagram 4» dal modello Visual Paradigm del team (ridisegnato l'11 novembre sul fondo notturno in Sofia Sans, stesso modello). **Nessuno** still di Maintech OMA, Badante24h (l'hero pubblico stampa lo stato vuoto dei profili) e Voice AI Agent; **nessun** ritratto di Alberto; **nessun** link al brand film; **nessuna** cattura di SerSan Agent OS e di Obla (repository privati; il personaggio di Obla lo disegna il palco). Catturabili di nuovo in ogni momento con Playwright (siti pubblici): **sersan.io**, **spherenode.com**, il repo GitHub del progetto UniCam.

## 6. Vincoli (non negoziabili)

- Stack (sito vivo, 2026-11-11): HTML, CSS e JavaScript scritti a mano, assemblati da Node (`public/proto/rivista/assemble.mjs`, nessuna dipendenza) e serviti statici · GSAP 3.15.0 + Lenis 1.3.26 da jsDelivr (**un solo ticker**, `fx-core.js`) · WebGPU raw con WGSL a mano per il palco, niente three.js · strumenti: Playwright su Chrome headless, `sharp`, Python per il server statico. Online va la build Astro delle stesse pagine (`web/`, rilasciata da `web/scripts/release.mjs`); la vecchia app Next.js è tolta dal tree (ondata 6).
- **Bilingue**: ogni parola visibile passa da `parts/strings.mjs` o `parts/cases.json` (ogni voce un gemello EN/IT); `assemble.mjs --check` rifiuta una stringa senza gemello, inglese rimasto su una pagina italiana, due pagine gemelle con elementi diversi. Title, description, `hreflang` e share card per pagina e per lingua.
- **Performance**: un solo canvas WebGPU per pagina (il palco), budget GPU per tier (A 3,5 ms; misurato 1,5–1,8 ms in copertina a 1440×900, 0,64–0,70 ms al telefono), conteggio dimezzato se si sfora; il palco si muove solo per 5 s dopo un input e poi non disegna più; Lighthouse mobile ≥ 80 (ultimo dato 4 ottobre, prima del sito nuovo: da rimisurare); nel DOM si animano solo opacità e sfocatura (il verbo «focus») e la traslazione del foglio del taglio.
- **Accessibilità AA** sulla notte e all'alba: contrasto ≥ 4,5:1 (testo `#cfcabf` su `#0c0e14` 11,81:1, etichette `#9a958a` 6,47:1, all'alba testo `#3a3f4b` su `#f3f4f6` 9,58:1; il cobalto non è mai testo sulla notte), `focus-visible` (sulla notte con `--accent`, all'alba con `--cobalt`), tastiera, reading order, canvas `aria-hidden`, nulla che il lettore debba sapere esiste solo nel canvas; `prefers-reduced-motion`, assenza di WebGPU, assenza di script e stampa = la pagina completa in flusso semplice con le immagini vere; `html lang` coerente con l'edizione.
- **Nessun contenuto inventato**: numeri e claim solo da §3/§9 (§10–§11 per Consulenza e Obla, solo in ambito globale; gate `scripts/check-claims-proto.mjs`); ciò che manca resta un buco dichiarato; Obla senza riga di stato, per decisione di Alberto.
- Push, merge e deploy solo con il sì esplicito di Alberto (il branch del sito, `feat/water-viva`, non è mai stato pushato e non si pusha: la sua storia tiene `47e914d`). Dall'ondata 6 il deploy automatico di `main` su Vercel pubblica lo studio di notte (la build Astro, `web/scripts/release.mjs`): su `main` va un solo commit con l'albero finale (online dal 20 novembre 2026 con lo squash `208c3de`; CLAUDE.md §6). La chiave `localStorage` `ocean-ui` e il solver G4 erano della vecchia app, tolta dal tree nell'ondata 6.

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

### Dopo il CV: due sistemi multi-agente (letti nel codice il 20 novembre 2026)

Il CV di settembre non li ha ancora. Per About e per il passo SerSan del percorso valgono come il CV; i numeri e le prove stanno in §3 (voci 10 e 11), la pagina di Obla in §11. Parole di Alberto del 20 novembre, riportate nel brief dell'ondata 7: «in consulting e about mi sembra , per quanto riguarda le mie skills multi agente , come proof quella piu importante è lo sviluppo del mas aziendale , non solo lo stage dove ho lavorato con microsoft studio ,che ha confronto è ridicolo», «ed anche obla», «scrivendo che obla è un mio progetto personale , e MAS è per Sersan». Obla si scrive come suo progetto personale, il sistema multi-agente come costruito per SerSan.

- **SerSan Agent OS — the company's multi-agent system** · SerSan · ottobre – novembre 2026. Il sistema multi-agente interno dello studio, costruito da Alberto per SerSan: idea, proposta e direzione sue, codice dal 10 al 20 novembre 2026 con ogni commit sotto la sua identità, prodotto dirigendo una sessione Claude Code coordinatrice e due esecutrici con le sue direttive scritte. Agenti con ruoli fissi su tre corsie, un router, passaggi di consegna su una bacheca comune con un freno che chiama una persona, un Cancello che fa uscire un'azione solo al livello di autonomia che l'agente si è guadagnato, e test che rompono apposta ogni pezzo (§3 voce 10). Stack: TypeScript su Node.js 22, Claude Agent SDK, Model Context Protocol (un server MCP dentro il processo che dà gli strumenti alle sessioni), Anthropic API, modelli open-weight ospitati in casa su un'API compatibile con OpenAI, Zod (uno schema rigido per ogni uscita di un modello), Fastify, PostgreSQL 16, Vitest, GitHub Actions. Costruito e collaudato, non in produzione. *(Repository privato SerSan Agent OS, letto il 20 novembre 2026: `README.md`, `package.json` e `packages/*/package.json`, `.claude/prds/sersan-agent-os.prd.md`, `docs/direttive.md`; repository privato dei documenti: `LEGGIMI.md`.)*
- **Obla — personal multi-agent system** · progetto personale · ottobre – novembre 2026. Un capo di gabinetto a cui Alberto parla e agenti con un nome a cui passa il lavoro, sul suo PC (§3 voce 11, §11). Stack: TypeScript su Node.js 22, Rust e Tauri, Claude Agent SDK, Model Context Protocol, llama.cpp su Vulkan con modelli locali, SQLite, Obsidian, Vitest. *(Repository privato Obla, letto il 20 novembre 2026: `package.json` e `packages/*/package.json`, `apps/obla/Cargo.toml`, `docs/adr/0001-quattro-livelli-t0-t3.md`, `docs/adr/0007-modelli-locali-llama-cpp-vulkan.md`.)*
- **Competenze che si aggiungono al gruppo AI del CV** (About, il gruppo «AI»): sistemi multi-agente (ruoli, passaggi di consegna, guardrail, collaudo dei guasti), Claude Agent SDK, Claude Code e MCP, modelli open-weight in locale (llama.cpp), output strutturato con schemi (Zod). Copilot Studio, Power Automate, Dataverse e Dynamics 365 restano gli strumenti dello stage DOIT (2025–2026): nel gruppo AI al massimo una menzione breve, mai la faccia delle competenze AI.

## 10. Consulenza (round "Storia", 2026-11-10)

La sezione 06 della home. Fonte: il messaggio di Alberto del 2026-11-09, verbatim:

> «il sito deve avere anche una sezione dedicata alla mia consulenza per generare contenuti con ai , video editing ,
> claude code best practice , sviluppo e collaudo di sistemi multi agente sia aziendali che utenti privati , e sezione
> del mio progetto personale Obla . tutto dev essere immersivo 3d»

- I quattro servizi: contenuti generati con l'AI (immagini, video, testi); montaggio video; Claude Code, buone pratiche;
  sistemi multi-agente, sviluppo e collaudo.
- Per chi: aziende e privati.
- Le prove stampate accanto ai servizi rimandano a fatti già in questo file: il brand film (§3, §9) per il montaggio, Obla
  (§11) per Claude Code. Il primo servizio non ha una prova pubblica: si stampa "Proof · On request".
- **Il quarto servizio, i sistemi multi-agente** (dal 20 novembre, parole di Alberto in §9, «Dopo il CV»): la prova più
  forte è **SerSan Agent OS**, il sistema multi-agente costruito per SerSan (§3 voce 10), poi **Obla**, il suo progetto
  personale (§3 voce 11, §11). Il testo del servizio dice che cosa fa davvero un sistema così: ruoli, passaggi di
  consegna con un freno che chiama una persona, un cancello davanti a ogni azione che esce, i test che mostrano che cosa
  succede quando un pezzo si guasta. La tesi triennale *From Autocomplete to Agentic Orchestration* (§9) non è più la
  prova del servizio: resta nel percorso di About. Lo stage DOIT con Copilot Studio non è una prova delle competenze
  multi-agente.
- Non si stampano prezzi, pacchetti, nomi di clienti né numeri. Dal 20 novembre SerSan Agent OS ha il suo caso in Work
  (`case-sersan-agent-os.html`, il primo dei lavori): la prova rimanda lì, come ogni prova che ha un caso.

## 11. Obla, il progetto personale (round "Storia", 2026-11-10; corretto sul codice il 2026-11-20)

La pagina Obla e la sua parte della home. Fonti (dati, sola lettura): il repository privato Obla, letto il 20 novembre
2026 sulla corsia più nuova, `ac/vertical-slice` (`CLAUDE.md`, il PRD `.claude/prds/obla.prd.md`, gli ADR in
`docs/adr/`, `protocol/src/`, `packages/oblad/src/`), le corsie `m2`, `m3` e `ms3` per ciò che aggiungono, i registri di
accettazione `tests/acceptance/*.json`; il personaggio: `docs/adr/0011-cuscino-fantasma-e-reskin-legale-di-coucou.md`,
`apps/obla/src/character/shape.ts`, `engine.ts`, `palette.ts` e `src/style.css`. Fino al 19 novembre questa sezione
leggeva il PRD della prima corsia (`m1/vertical-slice`, ultimo commit il 28 ottobre), che segna ancora «pending» ogni
tappa dopo M1: per ciò che Obla fa vale il codice delle corsie.

- Obla è il **sistema multi-agente personale** di Alberto, il suo progetto personale: un capo di gabinetto a cui parla
  (`@obla`, un modello locale dietro un'isola sempre in primo piano sul desktop) e gli agenti con un nome a cui passa il
  lavoro, invece di aprire sessioni, scrivere prompt e controllare a mano. Vive sul suo desktop; il demone, l'isola e i
  modelli locali girano sulla sua macchina (nessuna porta di rete in ascolto: i processi si parlano su stdio e named
  pipe, ADR-0006); risponde solo a lui. Per una persona sola, non è distribuito («Not for», PRD). Fino al 20 novembre il
  sito lo diceva «una sola voce»: dall'AG (unito il 29–30 ottobre) è un capo di gabinetto più agenti con un nome.
- **Quattro livelli** con ruoli fissi (ADR-0001), «gli LLM propongono, il codice esegue»: T0 il codice deterministico
  (il demone `oblad` in TypeScript e l'isola `obla.exe` in Tauri), l'unico livello che produce effetti fuori dal PC; T1 il
  giudice locale, per le domande chiuse a schema fisso, come quale agente prende un lavoro quando Alberto non ne nomina
  uno (se tarda o sbaglia lo schema la domanda torna ad Alberto; non decide mai un effetto); T2 il capo di gabinetto
  locale, che tiene la conversazione in italiano con strumenti che non inviano, non pubblicano, non pagano e non
  cancellano (il brief lo scrive il codice); T3 i lavoratori, ognuno una sessione Claude Code con il setup di Alberto
  (skill, hook, MCP) in un suo worktree git.
- **Gli agenti**: un capo di gabinetto più agenti su undici profili (code, design, release; research, docs, motion,
  content, qa, prod, product, review), sei configurati sul suo PC (capo di gabinetto, code, content, design, product,
  research). Sulla corsia `ac` (in costruzione) si passano il lavoro con `chain_call` sotto un freno scritto nel codice
  (§3 voce 11) e si riuniscono in stanze con turni decisi dal codice; un organigramma, un revisore a fine lavoro, una
  routine che passa il risultato a un altro agente.
- **Ascolta** (la pagina: «It listens»): la catena vocale locale (la parola «obla» o un tasto tenuto premuto, modelli
  ONNX in locale, ADR-0010) è sulla corsia `m2`, collegata al demone il 17 novembre e non ancora unita. La pagina la
  descrive come finita, per la decisione del 2026-11-09 (sotto).
- **Pensa** («It thinks»): il giudice locale e il capo di gabinetto locale; solo il lavoro vero passa a Claude Code. I
  modelli sono stati scelti misurando sulla sua GPU (§3 voce 11); i loro nomi non vanno sulla pagina.
- **Lavora** («It works»): ogni lavoro va all'agente che serve, una sessione Claude Code sulla repo giusta con il brief
  già scritto dal codice; gli agenti si passano il lavoro entro limiti scritti nel codice (corsia `ac`). Il personaggio
  che vola sulla finestra del lavoro è sulla corsia `m3` (in costruzione): dal 20 novembre la pagina non lo stampa più,
  per far posto agli agenti.
- **Chiede** («It asks»), corretto il 20 novembre. La pagina diceva «tutto ciò che esce dalla macchina aspetta il mio
  sì»: lo smentiscono i documenti del progetto. Il PRD elenca due residui (un connettore dentro un lavoro di codice può
  scrivere o inviare senza carta; in un lavoro con le credenziali del PC un comando che il guardrail non riconosce può
  agire senza carta); le regole «Sempre», create da una carta, lasciano passare gli effetti uguali successivi
  (ADR-0040); il traffico di Claude Code verso Anthropic è un flusso cloud dichiarato (ADR-0022). Vero, ed è ciò che la
  pagina dice ora: i modelli propongono e il codice esegue; un push (solo lo sha approvato), una pull request, un merge
  o una cancellazione aspettano il sì di Alberto su una carta di approvazione; un messaggio a terzi resta come bozza
  nella sua Gmail, e lo invia lui (ADR-0045; gli invii dalla casella di un agente dopo una carta sono sulla corsia
  `ms3`).
- **Riferisce** («It reports»): il report delle 08:00, scritto (M1); a voce con la corsia `m2`. Ha tredici sezioni:
  lavori, sessioni, repo, approvazioni, budget, memoria, agenti, regole, routine, consegne, impostazioni, catene, stanze
  (`protocol/src/report.ts`); la pagina ne nomina alcune. La memoria sta in un vault Obsidian di note Markdown che
  Alberto può leggere e modificare (ADR-0009).
- **Gira su**: Windows; TypeScript su Node.js 22 (il demone, il lavoratore, il protocollo, l'interfaccia dell'isola:
  circa 115.600 delle 135.700 righe di sorgente); Rust e Tauri (circa 20.200); llama.cpp su Vulkan con modelli locali;
  Claude Agent SDK e Model Context Protocol; SQLite; Obsidian. Fino al 20 novembre la pagina diceva solo «Windows,
  Tauri, Rust, local models, Claude Code».
- Il personaggio: un cuscino chiaro (una superellisse) con l'orlo inferiore a onde e due occhi ovali verticali; la forma
  esatta e i colori sono quelli di `shape.ts`, `engine.ts` e `style.css` (i numeri di disegno restano lì: non sono
  affermazioni del sito). Parti di `obla.exe` derivano da un'app open source con licenza MIT, citata in
  `apps/obla/NOTICE`; il personaggio, le icone e i suoni sono originali.
- Lo stato (per questi documenti, mai per la pagina): tappe integrate con il registro di accettazione completo (M1 il
  29 ottobre, SL+AG il 29–30 ottobre, PA l'8 novembre); quattro corsie in costruzione fino al 17 novembre (agenti che si
  chiamano tra loro, sorveglianze e posta, mani, voce e Telegram), non unite; nessun commit dopo il 17 novembre. Lo usa
  solo Alberto, sul suo PC; l'uso quotidiano prolungato non è misurato.
- **Decisione di Alberto (2026-11-09): il sito non stampa nessuno stato del progetto** («come il primo, ma senza dire a
  che punto è, dobbiamo sviluppare la sezione come se fosse già completato»). Non si stampano clienti, l'indirizzo
  dell'azienda, nomi di modelli, dettagli di sicurezza, nomi di altri prodotti, obiettivi scritti come risultati.
  "08:00" è l'unico numero della sezione.
- **Il 20 novembre** (parole in §9, «Dopo il CV»): Obla è una prova delle competenze multi-agente di Alberto, in
  Consulting e in About, e si scrive come suo progetto personale. La decisione del 9 novembre resta: la pagina descrive
  come finite le funzioni in costruzione (la voce, il report a voce, i passaggi tra agenti), ma non dice nulla che il
  codice smentisca. Nessun numero nuovo sulla pagina: i numeri di Obla stanno in §3 voce 11, per Work.
