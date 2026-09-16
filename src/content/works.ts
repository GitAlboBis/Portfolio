/**
 * Works — Selected Work entries. Drives the galleries (top-level card fields) and
 * the /work/[slug] case-study pages (the `study` block, EN/IT).
 *
 * SOURCE OF TRUTH: the September 2026 CV, transcribed in PRODUCT.md §9. Every
 * number in `metrics`, `highlights` and the study prose appears verbatim in the
 * CV; nothing is invented or rounded. Where the CV gives no date, no URL or no
 * figure, the field is left out rather than guessed. Roles and technical terms
 * stay in English in both locales (project rule).
 */
export type Localized = { en: string; it: string };
/** Every entry on file is confirmed against the CV (PRODUCT.md §9). */
export type WorkStatus = "confirmed";
/** Who can open the delivered thing: a public URL, a client's product, studio-internal, or academic. */
export type WorkAccess = "public" | "client" | "internal" | "academic";
/**
 * One row of the Measured table (REDESIGN-SPEC §E.9, §I): a single `MeasuredRow`
 * renders it. Pairs from the CV are `{ before, after, unit }` ("52% → 68%" → before
 * "52", after "68", unit "%"); single figures are `{ value }` ("17", "48,000", "0").
 * `before`/`after` are bare numerals in the CV's own notation (decimal point) so a
 * consumer can parse them for the proportional double bar; `unit` carries the symbol.
 * `source` is the provenance cell printed on every row.
 */
export interface WorkMetric {
  label: Localized;
  /**
   * Display figure. For pairs it equals the "after" string with its unit
   * ("68%", "1.74 s"); for single figures it is the verbatim CV figure.
   * Set on single figures; a pair carries `before`/`after`/`unit` instead.
   */
  value?: string;
  /** "Before" numeral of a CV pair, without unit. */
  before?: string;
  /** "After" numeral of a CV pair, without unit. */
  after?: string;
  /** Unit symbol of a pair ("%", "s", "ms"); localized because IT may spell some out. */
  unit?: Localized;
  /** Provenance: where and when the figure was measured ("161-question bilingual evaluation set · SerSan 2026"). */
  source: Localized;
}
export interface WorkLink {
  label: string;
  /** Absent while `pending` is set: the CV names the thing but gives no public address. */
  href?: string;
  /** Declared hole (PRODUCT.md §8.1): the sub-form prints "URL: pending" / "Film link: pending". */
  pending?: "url" | "film";
}
/** Phase-band role tag the job carries in the Work performed table (REDESIGN-SPEC §E.3 role tags). */
export type PhaseRole = "Engineer" | "Creative Lead" | "Full-Stack";
/** A real capture of a public site (WP-7, `public/captures/*`, provenance in the EXIF and PROVENANCE.md). */
export interface WorkCapture {
  src: string;
  /** Printed next to the capture ("capture · Sep 2026"). */
  label: Localized;
  width: number;
  height: number;
}

export interface Work {
  slug: string;
  title: string;
  org: string;
  year: string;
  /** Short role label for the card. */
  role: string;
  /** Role tag stamped on the row (Engineer / Creative Lead / Full-Stack). */
  phaseRole: PhaseRole;
  stack: string[];
  status: WorkStatus;
  /** Real capture of the public site, only where one exists (sersan-io, spherenode). */
  capture?: WorkCapture;
  /** Ruled SVG schematic drawn in the sub-form (REDESIGN-SPEC §B napkin raise): RAG pipeline or the six-phase job order. */
  schematic?: "rag" | "job-order";
  access?: WorkAccess;
  /** Employer / engagement line, e.g. "Sersan Limited · London · Remote". */
  orgMeta?: string;
  /** Engagement period as written in the CV, e.g. "Jun – Sep 2026". */
  period?: string;
  /** One factual sentence for cards and index rows. */
  hook?: Localized;
  /** 3–6 bullet facts. */
  highlights?: Localized[];
  /** Full case-study content (EN/IT) for /work/[slug]. */
  study?: {
    summary: Localized;
    problem: Localized;
    action: Localized;
    result: Localized;
    metrics?: WorkMetric[];
    links?: WorkLink[];
  };
}

const SERSAN_ORG = "SerSan · AI Studio";
const SERSAN_META = "Sersan Limited · London · Remote";
const SERSAN_ROLE = "Software & AI Engineer · Creative Lead";

/* Provenance cells (Measured / Work performed). One constant per source so the
 * wording is identical on every row it applies to. */
const SRC_SERSAN: Localized = { en: "SerSan · 2026", it: "SerSan · 2026" };
const SRC_EVAL_SET: Localized = {
  en: "161-question bilingual evaluation set · SerSan 2026",
  it: "Set di valutazione bilingue da 161 domande · SerSan 2026",
};
const SRC_LIGHTHOUSE: Localized = { en: "Lighthouse · sersan.io · 2026", it: "Lighthouse · sersan.io · 2026" };
const SRC_REAL_PHONES: Localized = { en: "Measured on real phones · SerSan 2026", it: "Misurato su telefoni reali · SerSan 2026" };
const SRC_ALS: Localized = { en: "ALS MCL Civitanova · 2026", it: "ALS MCL Civitanova · 2026" };
const SRC_UNICAM: Localized = { en: "University of Camerino · GitHub", it: "Università di Camerino · GitHub" };
const UNIT_PCT: Localized = { en: "%", it: "%" };
const UNIT_S: Localized = { en: "s", it: "s" };
const UNIT_MS: Localized = { en: "ms", it: "ms" };
const CAPTURE_LABEL: Localized = { en: "capture · Sep 2026", it: "cattura · set 2026" };

export const works: Work[] = [
  // ── 1. SphereNode ─────────────────────────────────────────────────────────
  {
    slug: "spherenode",
    title: "SphereNode",
    org: SERSAN_ORG,
    orgMeta: SERSAN_META,
    year: "2026",
    role: SERSAN_ROLE,
    phaseRole: "Engineer",
    access: "public",
    capture: { src: "/captures/spherenode-1600.webp", label: CAPTURE_LABEL, width: 1600, height: 1000 },
    stack: [
      "React 18",
      "Vite",
      "Supabase",
      "Postgres",
      "RLS",
      "Realtime",
      "pgvector",
      "Edge Functions",
      "Whop",
      "Cloudflare Stream",
      "Capacitor",
    ],
    status: "confirmed",
    hook: {
      en: "Vertical SaaS that replaced eight tools for the Italian retail-trading market, live at spherenode.com.",
      it: "SaaS verticale che ha sostituito otto strumenti per il mercato italiano del retail trading, online su spherenode.com.",
    },
    highlights: [
      {
        en: "Replaced Circle, Teachable, Zoom, Intercom, HubSpot, Mailchimp, Stripe and Notion for the Italian retail-trading market.",
        it: "Ha sostituito Circle, Teachable, Zoom, Intercom, HubSpot, Mailchimp, Stripe e Notion per il mercato italiano del retail trading.",
      },
      {
        en: "Payments-to-entitlement pipeline rebuilt as a tested state machine; five revenue-critical defects closed.",
        it: "Pipeline pagamenti → entitlement riscritta come state machine testata; cinque difetti critici per il fatturato chiusi.",
      },
      {
        en: "Six access-control defects closed before public launch, plus a 33-finding security audit remediated in one batch.",
        it: "Sei difetti di access control chiusi prima del lancio pubblico, più un audit di sicurezza da 33 finding rimediato in un unico batch.",
      },
      {
        en: "Silent outage of 21 scheduled jobs root-caused; monitoring and alerting built so it cannot go unnoticed again.",
        it: "Outage silenzioso di 21 job schedulati: causa individuata, monitoring e alerting costruiti perché non possa più passare inosservato.",
      },
      {
        en: "Trading Journal analytics engine validated against real broker exports; live-session video on Cloudflare Stream.",
        it: "Motore di analytics del Trading Journal validato su export reali dei broker; video delle sessioni live su Cloudflare Stream.",
      },
      {
        en: "Release manager for 21 of 49 production releases, including the public launch.",
        it: "Release manager di 21 delle 49 release di produzione, incluso il lancio pubblico.",
      },
    ],
    study: {
      summary: {
        en: "A production platform for the Italian retail-trading market that replaced eight separate tools, Circle, Teachable, Zoom, Intercom, HubSpot, Mailchimp, Stripe and Notion, with one product: courses, live sessions, payments and entitlements, a Trading Journal and a bilingual AI mentor.",
        it: "Una piattaforma in produzione per il mercato italiano del retail trading che ha sostituito otto strumenti separati, Circle, Teachable, Zoom, Intercom, HubSpot, Mailchimp, Stripe e Notion, con un solo prodotto: corsi, sessioni live, pagamenti ed entitlement, un Trading Journal e un mentor AI bilingue.",
      },
      problem: {
        en: "A paywalled product heading to public launch, with tiered access, live video, recurring payments and scheduled jobs: a single access-control or entitlement defect leaks paid content or strands paying customers, and a failing job can stay invisible while every dashboard reports success.",
        it: "Un prodotto a pagamento in arrivo al lancio pubblico, con accessi a livelli, video live, pagamenti ricorrenti e job schedulati: un solo difetto di access control o di entitlement fa uscire contenuti a pagamento o lascia fuori clienti paganti, e un job che fallisce può restare invisibile mentre ogni dashboard segnala successo.",
      },
      action: {
        en: "I rebuilt the payments-to-entitlement pipeline as a tested state machine and closed five revenue-critical defects: access surviving cancellation, disputes and unknown events defaulting to open, empty lookups downgrading paying users, duplicate rows stranding paid customers, and out-of-order events resurrecting revoked access. I closed six access-control defects before public launch, among them an unauthenticated leak of the Elite portfolio dashboard, a tier leak exposing 206 live sessions and 79 transcripts to free accounts, and a permission rule letting any member edit or unpublish any live course, and remediated a 33-finding security audit in one batch. I root-caused a silent outage in which 21 scheduled jobs had been dead for weeks while every dashboard still reported success, then built the monitoring and alerting that had been missing. I built the Trading Journal analytics engine (trade reconstruction from broker fills, gross-versus-net classification, pip and live-FX sizing, a multi-account cash-flow ledger), validated against real broker exports, and the live-session video pipeline on Cloudflare Stream: RTMP ingest with a fallback path for corporate networks that block it, adaptive playback, and a recording flow that stopped losing sessions to failed renders.",
        it: "Ho riscritto la pipeline pagamenti → entitlement come state machine testata e chiuso cinque difetti critici per il fatturato: accessi che sopravvivevano alla cancellazione, dispute ed eventi sconosciuti che aprivano l'accesso per default, lookup vuoti che declassavano utenti paganti, righe duplicate che bloccavano clienti paganti, eventi fuori ordine che resuscitavano accessi revocati. Ho chiuso sei difetti di access control prima del lancio pubblico, tra cui un leak non autenticato della dashboard portafoglio Elite, un leak di tier che esponeva 206 sessioni live e 79 trascrizioni agli account gratuiti e una regola di permessi che lasciava a qualunque membro modificare o rimuovere qualsiasi corso live, e ho rimediato in un unico batch a un audit di sicurezza da 33 finding. Ho individuato la causa di un outage silenzioso in cui 21 job schedulati erano fermi da settimane mentre ogni dashboard segnalava ancora successo, poi ho costruito il monitoring e l'alerting che mancavano. Ho costruito il motore di analytics del Trading Journal (ricostruzione dei trade dai fill del broker, classificazione gross/net, sizing in pip e FX live, ledger di cash-flow multi-account), validato su export reali dei broker, e la pipeline video delle sessioni live su Cloudflare Stream: ingest RTMP con un percorso di fallback per le reti aziendali che lo bloccano, playback adattivo e un flusso di registrazione che ha smesso di perdere sessioni per render falliti.",
      },
      result: {
        en: "SphereNode launched publicly and runs in production at spherenode.com. I acted as release manager for 21 of its 49 production releases, including the public launch.",
        it: "SphereNode è stato lanciato pubblicamente ed è in produzione su spherenode.com. Sono stato release manager di 21 delle sue 49 release di produzione, incluso il lancio pubblico.",
      },
      metrics: [
        {
          value: "8",
          label: { en: "tools replaced by one platform", it: "strumenti sostituiti da una sola piattaforma" },
          source: SRC_SERSAN,
        },
        {
          value: "21 / 49",
          label: {
            en: "production releases shipped as release manager, including the public launch",
            it: "release di produzione gestite come release manager, incluso il lancio pubblico",
          },
          source: SRC_SERSAN,
        },
        {
          value: "5",
          label: {
            en: "revenue-critical defects closed in the payments-to-entitlement pipeline",
            it: "difetti critici per il fatturato chiusi nella pipeline pagamenti → entitlement",
          },
          source: SRC_SERSAN,
        },
        {
          value: "6",
          label: { en: "access-control defects closed before public launch", it: "difetti di access control chiusi prima del lancio pubblico" },
          source: SRC_SERSAN,
        },
        {
          value: "33",
          label: { en: "security-audit findings remediated in one batch", it: "finding dell'audit di sicurezza rimediati in un unico batch" },
          source: SRC_SERSAN,
        },
        {
          value: "21",
          label: {
            en: "scheduled jobs found dead for weeks, root-caused, now monitored",
            it: "job schedulati fermi da settimane: causa individuata, ora monitorati",
          },
          source: SRC_SERSAN,
        },
      ],
      links: [{ label: "spherenode.com", href: "https://spherenode.com" }],
    },
  },

  // ── 2. Sphere AI ─────────────────────────────────────────────────────────
  {
    slug: "sphere-ai",
    title: "Sphere AI",
    org: SERSAN_ORG,
    orgMeta: SERSAN_META,
    year: "2026",
    role: "Software & AI Engineer",
    phaseRole: "Engineer",
    schematic: "rag",
    access: "public",
    stack: ["RAG", "pgvector", "Embeddings", "Semantic chunking", "LLM relevance grader", "LLM evaluation", "Guardrails", "Supabase"],
    status: "confirmed",
    hook: {
      en: "SphereNode's bilingual RAG mentor, grounded only in the proprietary curriculum and measured on a 161-question evaluation set.",
      it: "Il mentor RAG bilingue di SphereNode, ancorato solo al curriculum proprietario e misurato su un set di valutazione da 161 domande.",
    },
    highlights: [
      {
        en: "Grounded only in the proprietary curriculum: semantic chunking, embeddings in pgvector, tier-aware retrieval with a curated fast path for canonical answers.",
        it: "Ancorato solo al curriculum proprietario: chunking semantico, embedding in pgvector, retrieval consapevole del tier con una fast path curata per le risposte canoniche.",
      },
      {
        en: "Generation layer with an LLM relevance grader on top.",
        it: "Livello di generazione con un grader LLM di rilevanza a valle.",
      },
      {
        en: "Asks for clarification instead of guessing; refuses questions built on a false premise or asking for unsafe actions.",
        it: "Chiede chiarimenti invece di indovinare; rifiuta le domande costruite su una premessa falsa o che chiedono azioni non sicure.",
      },
      {
        en: "Requires live evidence before answering anything time-sensitive; static FAQ content never stands in for current market information.",
        it: "Richiede evidenze live prima di rispondere a qualsiasi tema sensibile al tempo; i contenuti statici delle FAQ non sostituiscono mai l'informazione di mercato corrente.",
      },
      {
        en: "Trading Journal exposed to the mentor as a consent-gated, owner-only data source, personal data excluded by default.",
        it: "Trading Journal esposto al mentor come sorgente dati owner-only con consenso esplicito, dati personali esclusi per default.",
      },
    ],
    study: {
      summary: {
        en: "Sphere AI is the bilingual (IT/EN) RAG mentor inside SphereNode. It answers only from the platform's proprietary curriculum: semantic chunking and embeddings in pgvector, tier-aware retrieval with a curated fast path for canonical answers, and a generation layer with an LLM relevance grader on top.",
        it: "Sphere AI è il mentor RAG bilingue (IT/EN) dentro SphereNode. Risponde solo a partire dal curriculum proprietario della piattaforma: chunking semantico ed embedding in pgvector, retrieval consapevole del tier con una fast path curata per le risposte canoniche, e un livello di generazione con un grader LLM di rilevanza a valle.",
      },
      problem: {
        en: "A mentor for retail traders must not guess, must not answer questions it should withhold, must not leak content locked behind a higher tier, and must never present static FAQ text as current market information. Before this work, on a 161-question bilingual evaluation set, it followed its answer policy 52% of the time and over-answered 56% of the questions it should have withheld.",
        it: "Un mentor per trader retail non deve tirare a indovinare, non deve rispondere a domande da trattenere, non deve far uscire contenuti bloccati dietro un tier superiore e non deve mai presentare testo statico di FAQ come informazione di mercato corrente. Prima di questo lavoro, su un set di valutazione bilingue da 161 domande, rispettava la propria answer policy nel 52% dei casi e rispondeva oltre il dovuto al 56% delle domande da trattenere.",
      },
      action: {
        en: "I designed and built the retrieval and generation stack, then the guardrails behind the numbers: the mentor asks for clarification instead of guessing, refuses questions built on a false premise or asking for unsafe actions, requires live evidence before answering anything time-sensitive, and never lets static FAQ content stand in for current market information. I made the Trading Journal available to the mentor as a consent-gated, owner-only data source with personal data excluded by default, and measured every change against the 161-question bilingual evaluation set.",
        it: "Ho progettato e costruito lo stack di retrieval e generazione, poi i guardrail dietro ai numeri: il mentor chiede chiarimenti invece di indovinare, rifiuta le domande costruite su una premessa falsa o che chiedono azioni non sicure, richiede evidenze live prima di rispondere a qualsiasi tema sensibile al tempo e non lascia mai che contenuti statici di FAQ sostituiscano l'informazione di mercato corrente. Ho reso il Trading Journal disponibile al mentor come sorgente dati owner-only, con consenso esplicito e dati personali esclusi per default, e ho misurato ogni modifica sul set di valutazione bilingue da 161 domande.",
      },
      result: {
        en: "On the 161-question set: answer-policy accuracy 52% → 68%, over-answering on questions it should withhold 56% → 16%, clarification precision 75% → 94% and recall 32% → 90%, unsupported claims 1.9% → 0.6%, citation correctness 100%, with zero locked-content leaks and zero fabricated citations.",
        it: "Sul set da 161 domande: accuratezza dell'answer policy 52% → 68%, over-answering sulle domande da trattenere 56% → 16%, precision delle richieste di chiarimento 75% → 94% e recall 32% → 90%, affermazioni non supportate 1,9% → 0,6%, correttezza delle citazioni 100%, con zero leak di contenuti bloccati e zero citazioni inventate.",
      },
      metrics: [
        {
          value: "68%",
          before: "52",
          after: "68",
          unit: UNIT_PCT,
          label: { en: "answer-policy accuracy", it: "accuratezza dell'answer policy" },
          source: SRC_EVAL_SET,
        },
        {
          value: "16%",
          before: "56",
          after: "16",
          unit: UNIT_PCT,
          label: { en: "over-answering on questions it should withhold", it: "over-answering sulle domande da trattenere" },
          source: SRC_EVAL_SET,
        },
        {
          value: "94%",
          before: "75",
          after: "94",
          unit: UNIT_PCT,
          label: { en: "clarification precision", it: "precision delle richieste di chiarimento" },
          source: SRC_EVAL_SET,
        },
        {
          value: "90%",
          before: "32",
          after: "90",
          unit: UNIT_PCT,
          label: { en: "clarification recall", it: "recall delle richieste di chiarimento" },
          source: SRC_EVAL_SET,
        },
        {
          value: "0.6%",
          before: "1.9",
          after: "0.6",
          unit: UNIT_PCT,
          label: { en: "unsupported claims", it: "affermazioni non supportate" },
          source: SRC_EVAL_SET,
        },
        {
          value: "100%",
          label: {
            en: "citation correctness, with zero fabricated citations and zero locked-content leaks",
            it: "correttezza delle citazioni, con zero citazioni inventate e zero leak di contenuti bloccati",
          },
          source: SRC_EVAL_SET,
        },
      ],
      links: [{ label: "spherenode.com", href: "https://spherenode.com" }],
    },
  },

  // ── 3. Maintech OMA ──────────────────────────────────────────────────────
  {
    slug: "maintech-oma",
    title: "Maintech OMA",
    org: SERSAN_ORG,
    orgMeta: SERSAN_META,
    year: "2026",
    role: SERSAN_ROLE,
    phaseRole: "Full-Stack",
    schematic: "job-order",
    access: "client",
    stack: ["Vite", "React 18", "TypeScript", "Supabase", "Postgres 17", "RLS", "Edge Functions", "TanStack Query"],
    status: "confirmed",
    hook: {
      en: "Custom ERP for a heavy-vehicle workshop of about 50 staff, founded from the application scaffold to the first database schema.",
      it: "ERP su misura per un'officina di veicoli pesanti da circa 50 persone, fondato dallo scaffold applicativo al primo schema del database.",
    },
    highlights: [
      {
        en: "'Diesel & Safety' design system: design tokens, light and dark themes, a component library.",
        it: "Design system 'Diesel & Safety': design token, tema light e dark, libreria di componenti.",
      },
      {
        en: "Database-first security: nine roles, default-deny on every table, per-site segregation, permissions held in the database rather than in tokens.",
        it: "Sicurezza database-first: nove ruoli, default-deny su ogni tabella, segregazione per sede, permessi conservati nel database e non nei token.",
      },
      {
        en: "The first database test suite exposed three live defects, fixed before they reached production.",
        it: "La prima suite di test sul database ha fatto emergere tre difetti reali, corretti prima che arrivassero in produzione.",
      },
      {
        en: "Job orders on a six-phase state machine with role-gated transitions and safe numbering under concurrency.",
        it: "Ordini di lavoro su una state machine a sei fasi con transizioni vincolate al ruolo e numerazione sicura in concorrenza.",
      },
      {
        en: "Ten trade portals: connector console, article-level price comparison, a cache that never degrades a good supplier response.",
        it: "Dieci portali di settore: console dei connettori, confronto prezzi a livello di articolo, una cache che non degrada mai una buona risposta del fornitore.",
      },
      {
        en: "High-severity privilege escalation on supplier credentials closed.",
        it: "Chiusa una privilege escalation ad alta severità sulle credenziali dei fornitori.",
      },
    ],
    study: {
      summary: {
        en: "A custom ERP for a heavy-vehicle workshop with about 50 staff across mechanics, mechatronics, auto-electrics, bodywork and refrigeration. I founded the system: the application scaffold, the 'Diesel & Safety' design system (design tokens, light and dark themes, a component library) and the first database schema the rest of the product was built on.",
        it: "Un ERP su misura per un'officina di veicoli pesanti con circa 50 persone tra meccanica, meccatronica, elettrauto, carrozzeria e refrigerazione. Ho fondato il sistema: lo scaffold applicativo, il design system 'Diesel & Safety' (design token, tema light e dark, libreria di componenti) e il primo schema del database su cui è stato costruito il resto del prodotto.",
      },
      problem: {
        en: "A workshop ERP handles job orders, vehicles with inspection deadlines, parts pricing and supplier credentials for nine kinds of user across several sites. Permissions enforced only in the client or in tokens can be bypassed; pricing data and supplier credentials need protection at the database level.",
        it: "Un ERP d'officina gestisce ordini di lavoro, veicoli con scadenze di revisione, prezzi dei ricambi e credenziali dei fornitori per nove tipologie di utente su più sedi. I permessi applicati solo nel client o nei token si possono aggirare; i dati di prezzo e le credenziali dei fornitori vanno protetti a livello di database.",
      },
      action: {
        en: "I designed a database-first security model that cannot be bypassed from the client: nine roles, default-deny access rules on every table, per-site data segregation, and permissions held in the database rather than in tokens; the first database test suite written against it exposed three live defects, fixed before they reached production. I delivered the domain core: customers, vehicles with equipment and inspection deadlines, job orders on a six-phase state machine with role-gated transitions and safe numbering under concurrency, a parts catalogue with multi-supplier price comparison, and purchase orders. I activated the supplier integration across ten trade portals, with a connector console, article-level price comparison and a caching layer that never degrades a good supplier response.",
        it: "Ho progettato un modello di sicurezza database-first che non si può aggirare dal client: nove ruoli, regole di accesso default-deny su ogni tabella, segregazione dei dati per sede e permessi conservati nel database invece che nei token; la prima suite di test sul database scritta contro questo modello ha fatto emergere tre difetti reali, corretti prima che arrivassero in produzione. Ho consegnato il cuore del dominio: clienti, veicoli con attrezzature e scadenze di revisione, ordini di lavoro su una state machine a sei fasi con transizioni vincolate al ruolo e numerazione sicura in concorrenza, un catalogo ricambi con confronto prezzi multi-fornitore e ordini d'acquisto. Ho attivato l'integrazione fornitori su dieci portali di settore, con una console dei connettori, confronto prezzi a livello di articolo e un layer di cache che non degrada mai una buona risposta del fornitore.",
      },
      result: {
        en: "Delivered the domain core, the supplier integration across ten portals and a security model that holds at the database level. Closed a high-severity privilege escalation that let any user with price access alter where supplier credentials were sent.",
        it: "Consegnati il cuore del dominio, l'integrazione fornitori su dieci portali e un modello di sicurezza che tiene a livello di database. Chiusa una privilege escalation ad alta severità che permetteva a qualunque utente con accesso ai prezzi di cambiare la destinazione delle credenziali dei fornitori.",
      },
      metrics: [
        {
          value: "9",
          label: { en: "roles, with default-deny access rules on every table", it: "ruoli, con regole di accesso default-deny su ogni tabella" },
          source: SRC_SERSAN,
        },
        {
          value: "6",
          label: { en: "phases in the job-order state machine, transitions gated by role", it: "fasi della state machine degli ordini di lavoro, transizioni vincolate al ruolo" },
          source: SRC_SERSAN,
        },
        {
          value: "10",
          label: { en: "trade portals integrated, with article-level price comparison", it: "portali di settore integrati, con confronto prezzi a livello di articolo" },
          source: SRC_SERSAN,
        },
      ],
    },
  },

  // ── 4. sersan.io ─────────────────────────────────────────────────────────
  {
    slug: "sersan-io",
    title: "sersan.io",
    org: SERSAN_ORG,
    orgMeta: SERSAN_META,
    year: "2026",
    period: "Jun – Sep 2026",
    role: "Sole engineer and designer",
    phaseRole: "Creative Lead",
    access: "public",
    capture: { src: "/captures/sersan-io-1600.webp", label: CAPTURE_LABEL, width: 1600, height: 1000 },
    stack: ["Next.js 16", "React 19", "three.js (WebGPU/TSL)", "React Three Fiber", "GSAP", "Lenis", "Tailwind v4", "Vercel"],
    status: "confirmed",
    hook: {
      en: "The studio's WebGPU-first site: one continuous 3D canvas carrying seventeen scroll-locked scenes, built alone between June and September 2026.",
      it: "Il sito WebGPU-first dello studio: un'unica canvas 3D continua che attraversa diciassette scene bloccate allo scroll, costruito da solo tra giugno e settembre 2026.",
    },
    highlights: [
      {
        en: "One continuous 3D canvas, seventeen scroll-locked scenes, automatic fallback without WebGPU, recovery if the graphics context is lost.",
        it: "Un'unica canvas 3D continua, diciassette scene bloccate allo scroll, fallback automatico senza WebGPU, recupero se il contesto grafico va perso.",
      },
      {
        en: "Compute shaders: a particle brand mark, a 48,000-particle wordmark intro, an 80,000-cell portrait morph lit from generated depth maps.",
        it: "Compute shader: un marchio a particelle, un'intro del wordmark da 48.000 particelle, un morph del ritratto da 80.000 celle illuminato da depth map generate.",
      },
      {
        en: "Raymarched black hole, custom refractive crystal material, selective-bloom post-processing chain.",
        it: "Buco nero in raymarching, materiale cristallo rifrattivo custom, catena di post-processing con bloom selettivo.",
      },
      {
        en: "Device tiering: the full scene on weak mobile GPUs at a quarter of the pixels, without removing a single effect.",
        it: "Device tiering: la scena intera sulle GPU mobile deboli a un quarto dei pixel, senza togliere un solo effetto.",
      },
      {
        en: "Lighthouse Accessibility 100 and SEO 100; reduced-motion paths and non-JavaScript equivalents for every 3D section.",
        it: "Lighthouse Accessibility 100 e SEO 100; percorsi reduced-motion ed equivalenti senza JavaScript per ogni sezione 3D.",
      },
      {
        en: "Mobile layouts rebuilt, accessible touch targets restored across the site, mobile home page cut to two-thirds of its length.",
        it: "Layout mobile rifatti, touch target accessibili ripristinati in tutto il sito, home mobile ridotta a due terzi della sua lunghezza.",
      },
    ],
    study: {
      summary: {
        en: "I rebuilt the studio's public site single-handedly, as engineer and designer, into a WebGPU-first experience: one continuous 3D canvas carries seventeen scroll-locked scenes across the site, with an automatic fallback for machines without WebGPU and recovery if the graphics context is lost.",
        it: "Ho rifatto da solo il sito pubblico dello studio, come engineer e designer, in un'esperienza WebGPU-first: un'unica canvas 3D continua porta diciassette scene bloccate allo scroll attraverso il sito, con fallback automatico per le macchine senza WebGPU e recupero se il contesto grafico va perso.",
      },
      problem: {
        en: "A studio that sells WebGPU, 3D and motion work needs a site that proves it in the browser, on phones as well as desktops, without failing on machines that lack WebGPU, without giving up accessibility or SEO, and without a second team.",
        it: "Uno studio che vende lavoro WebGPU, 3D e motion ha bisogno di un sito che lo dimostri nel browser, su telefono come su desktop, senza fallire sulle macchine senza WebGPU, senza rinunciare ad accessibilità e SEO, e senza un secondo team.",
      },
      action: {
        en: "I wrote the GPU work in compute shaders: a particle brand mark, a 48,000-particle wordmark intro and an 80,000-cell portrait morph lit from generated depth maps, plus a raymarched black hole, a custom refractive crystal material and a selective-bloom post-processing chain. I designed a device-tiering system that runs the full scene on weak mobile GPUs at a quarter of the pixels without removing a single effect, and added reduced-motion paths and non-JavaScript equivalents for every 3D section. I rebuilt the mobile layouts, restored accessible touch targets across the site after tracing every undersized control to a single styling rule, and cut the mobile home page to two-thirds of its length.",
        it: "Ho scritto il lavoro GPU in compute shader: un marchio a particelle, un'intro del wordmark da 48.000 particelle e un morph del ritratto da 80.000 celle illuminato da depth map generate, più un buco nero in raymarching, un materiale cristallo rifrattivo custom e una catena di post-processing con bloom selettivo. Ho progettato un sistema di device tiering che fa girare la scena intera sulle GPU mobile deboli a un quarto dei pixel senza togliere un solo effetto, e ho aggiunto percorsi reduced-motion ed equivalenti senza JavaScript per ogni sezione 3D. Ho rifatto i layout mobile, ripristinato touch target accessibili in tutto il sito dopo aver ricondotto ogni controllo sottodimensionato a una singola regola di stile, e ridotto la home mobile a due terzi della sua lunghezza.",
      },
      result: {
        en: "Live at sersan.io. Lighthouse Accessibility 100 and SEO 100; the full scene runs on weak mobile GPUs; every 3D section has a reduced-motion and a non-JavaScript equivalent.",
        it: "Online su sersan.io. Lighthouse Accessibility 100 e SEO 100; la scena intera gira sulle GPU mobile deboli; ogni sezione 3D ha un equivalente reduced-motion e uno senza JavaScript.",
      },
      metrics: [
        {
          value: "17",
          label: { en: "scroll-locked scenes on one continuous 3D canvas", it: "scene bloccate allo scroll su un'unica canvas 3D continua" },
          source: SRC_SERSAN,
        },
        {
          value: "48,000",
          label: { en: "particles in the wordmark intro, in compute shaders", it: "particelle nell'intro del wordmark, in compute shader" },
          source: SRC_SERSAN,
        },
        {
          value: "80,000",
          label: { en: "cells in the portrait morph, lit from generated depth maps", it: "celle nel morph del ritratto, illuminato da depth map generate" },
          source: SRC_SERSAN,
        },
        { value: "100", label: { en: "Lighthouse Accessibility", it: "Lighthouse Accessibility" }, source: SRC_LIGHTHOUSE },
        { value: "100", label: { en: "Lighthouse SEO", it: "Lighthouse SEO" }, source: SRC_LIGHTHOUSE },
        {
          value: "0",
          label: {
            en: "effects removed on weak mobile GPUs: the full scene at a quarter of the pixels",
            it: "effetti tolti sulle GPU mobile deboli: la scena intera a un quarto dei pixel",
          },
          source: SRC_SERSAN,
        },
      ],
      links: [{ label: "sersan.io", href: "https://sersan.io" }],
    },
  },

  // ── 5. Domus Tua ─────────────────────────────────────────────────────────
  {
    slug: "domus-tua",
    title: "Domus Tua",
    org: SERSAN_ORG,
    orgMeta: SERSAN_META,
    year: "2026",
    role: SERSAN_ROLE,
    phaseRole: "Creative Lead",
    access: "client",
    stack: ["Next.js 16", "GSAP", "Lenis", "Supabase"],
    status: "confirmed",
    hook: {
      en: "Real-estate brand platform: a cinematic scroll experience with complete reduced-motion and no-JavaScript alternatives, and mobile LCP cut from 4.75 s to 1.74 s.",
      it: "Piattaforma brand immobiliare: un'esperienza scroll cinematografica con alternative complete reduced-motion e senza JavaScript, e LCP mobile da 4,75 s a 1,74 s.",
    },
    highlights: [
      {
        en: "Animated intro, arched page transitions, chapter-based storytelling.",
        it: "Intro animata, transizioni di pagina ad arco, storytelling a capitoli.",
      },
      {
        en: "Complete reduced-motion and no-JavaScript alternatives; no layout shift.",
        it: "Alternative complete reduced-motion e senza JavaScript; zero layout shift.",
      },
      {
        en: "Mobile delay traced to the cookie banner; intro rebuilt to run in CSS rather than JavaScript.",
        it: "Ritardo su mobile ricondotto al cookie banner; intro riscritta per girare in CSS invece che in JavaScript.",
      },
      {
        en: "Legacy URL redirects verified against the live listing catalogue; structured data for listings, breadcrumbs and FAQs; the site's AI assistant persona with its identity and safety rules.",
        it: "Redirect degli URL legacy verificati sul catalogo annunci live; dati strutturati per annunci, breadcrumb e FAQ; la persona dell'assistente AI del sito con la sua identità e le sue regole di sicurezza.",
      },
    ],
    study: {
      summary: {
        en: "A real-estate brand platform. I art-directed and built the site's cinematic scroll experience (animated intro, arched page transitions, chapter-based storytelling) with complete reduced-motion and no-JavaScript alternatives and no layout shift, then made it fast on real phones and prepared its launch.",
        it: "Una piattaforma brand per l'immobiliare. Ho curato la direzione artistica e costruito l'esperienza scroll cinematografica del sito (intro animata, transizioni di pagina ad arco, storytelling a capitoli) con alternative complete reduced-motion e senza JavaScript e zero layout shift, poi l'ho resa veloce su telefoni reali e ne ho preparato il lancio.",
      },
      problem: {
        en: "On real phones the site's largest-contentful-paint was 4.75 s and its blocking time 572 ms. The launch also had to keep legacy listing URLs working and expose structured data for the listings.",
        it: "Su telefoni reali il largest-contentful-paint del sito era di 4,75 s e il blocking time di 572 ms. Il lancio doveva inoltre mantenere funzionanti gli URL legacy degli annunci ed esporre dati strutturati per gli annunci.",
      },
      action: {
        en: "I art-directed and built the scroll experience: animated intro, arched page transitions and chapter-based storytelling, each with a complete reduced-motion and a no-JavaScript alternative, and no layout shift. I traced the mobile delay to the cookie banner and rebuilt the intro to run in CSS rather than JavaScript. I prepared the launch: legacy URL redirects verified against the live listing catalogue, structured data for listings, breadcrumbs and FAQs, and the site's AI assistant persona with its identity and safety rules.",
        it: "Ho curato la direzione artistica e costruito l'esperienza scroll: intro animata, transizioni di pagina ad arco e storytelling a capitoli, ciascuno con un'alternativa completa reduced-motion e una senza JavaScript, e zero layout shift. Ho ricondotto il ritardo su mobile al cookie banner e riscritto l'intro perché girasse in CSS invece che in JavaScript. Ho preparato il lancio: redirect degli URL legacy verificati sul catalogo annunci live, dati strutturati per annunci, breadcrumb e FAQ, e la persona dell'assistente AI del sito con la sua identità e le sue regole di sicurezza.",
      },
      result: {
        en: "Mobile largest-contentful-paint 4.75 s → 1.74 s and blocking time 572 ms → 274 ms, with the cinematic experience kept and no layout shift.",
        it: "Largest-contentful-paint mobile 4,75 s → 1,74 s e blocking time 572 ms → 274 ms, con l'esperienza cinematografica mantenuta e zero layout shift.",
      },
      metrics: [
        {
          value: "1.74 s",
          before: "4.75",
          after: "1.74",
          unit: UNIT_S,
          label: { en: "mobile largest-contentful-paint", it: "largest-contentful-paint mobile" },
          source: SRC_REAL_PHONES,
        },
        {
          value: "274 ms",
          before: "572",
          after: "274",
          unit: UNIT_MS,
          label: { en: "mobile blocking time", it: "blocking time mobile" },
          source: SRC_REAL_PHONES,
        },
        { value: "0", label: { en: "layout shift", it: "layout shift" }, source: SRC_SERSAN },
      ],
      // PRODUCT.md §8.1: the CV names no public address for Domus Tua.
      links: [{ label: "Domus Tua", pending: "url" }],
    },
  },

  // ── 6. SerSan brand identity & brand film ────────────────────────────────
  {
    slug: "sersan-brand",
    title: "SerSan brand identity & brand film",
    org: SERSAN_ORG,
    orgMeta: SERSAN_META,
    year: "2026",
    role: "Art direction · Motion graphics · VFX · 3D · Video",
    phaseRole: "Creative Lead",
    access: "public",
    stack: ["Art direction", "Brand identity", "Typography", "Motion graphics", "VFX", "3D", "After Effects", "Compositing", "Colour grading", "Sound design"],
    status: "confirmed",
    hook: {
      en: "The SerSan visual identity (hexagonal mark, custom display typeface, colour system) and a 64-second 4K brand film in fourteen scenes, directed and produced from concept to final cut.",
      it: "L'identità visiva SerSan (marchio esagonale, font display su misura, sistema colore) e un brand film 4K da 64 secondi in quattordici scene, diretto e prodotto dal concept al final cut.",
    },
    highlights: [
      {
        en: "Hexagonal mark, custom display typeface and colour system, carried across the website, the 3D scenes and the video work.",
        it: "Marchio esagonale, font display su misura e sistema colore, portati con coerenza su sito, scene 3D e lavoro video.",
      },
      {
        en: "Fourteen-scene narrative built on the studio's positioning, from concept and script to final cut.",
        it: "Narrazione in quattordici scene costruita sul posizionamento dello studio, dal concept e dallo script al final cut.",
      },
      {
        en: "Motion and VFX: a light orb igniting each interface element it passes, hexagon screen transitions, 3D product scenes, a closing morph from the final line into the brand mark, 4K kinetic typography throughout.",
        it: "Motion e VFX: un orb di luce che accende ogni elemento d'interfaccia che attraversa, transizioni a schermo esagonali, scene 3D di prodotto, un morph finale dall'ultima frase al marchio, tipografia cinetica in 4K per tutta la durata.",
      },
      {
        en: "Post-production end to end: compositing, colour and a sound-design pass timed to the cut.",
        it: "Post-produzione da cima a fondo: compositing, colore e un passaggio di sound design sincronizzato al montaggio.",
      },
    ],
    study: {
      summary: {
        en: "I designed the SerSan visual identity, the hexagonal mark, a custom display typeface and the colour system, and carried it across the website, the 3D scenes and the video work. I then directed and produced the studio's brand film: a 64-second 4K piece taken from concept and script through to final cut.",
        it: "Ho disegnato l'identità visiva SerSan, il marchio esagonale, un font display su misura e il sistema colore, e l'ho portata con coerenza sul sito, nelle scene 3D e nel lavoro video. Ho poi diretto e prodotto il brand film dello studio: un pezzo 4K da 64 secondi, dal concept e dallo script al final cut.",
      },
      problem: {
        en: "A new AI studio needed one identity that holds across a WebGPU website, 3D scenes and video, and a film that states its positioning in about a minute, with direction, motion, VFX and post-production handled by one person.",
        it: "Un nuovo studio AI aveva bisogno di un'unica identità che tenesse tra sito WebGPU, scene 3D e video, e di un film che ne enunciasse il posizionamento in circa un minuto, con regia, motion, VFX e post-produzione in mano a una sola persona.",
      },
      action: {
        en: "I designed the hexagonal mark, the custom display typeface and the colour system. I structured the film as a fourteen-scene narrative built on the studio's positioning and directed it from concept and script to final cut. I created its motion design and VFX: a light orb that ignites each interface element it passes, hexagon screen transitions, 3D product scenes and a closing morph from the final line into the brand mark, with 4K kinetic typography throughout. I handled post-production end to end: compositing, colour and a sound-design pass timed to the cut.",
        it: "Ho disegnato il marchio esagonale, il font display su misura e il sistema colore. Ho strutturato il film come narrazione in quattordici scene costruita sul posizionamento dello studio e l'ho diretto dal concept e dallo script al final cut. Ne ho creato motion design e VFX: un orb di luce che accende ogni elemento d'interfaccia che attraversa, transizioni a schermo esagonali, scene 3D di prodotto e un morph finale dall'ultima frase al marchio, con tipografia cinetica in 4K per tutta la durata. Ho gestito la post-produzione da cima a fondo: compositing, colore e un passaggio di sound design sincronizzato al montaggio.",
      },
      result: {
        en: "One identity across the website, the 3D scenes and the video work, and a finished 64-second 4K brand film in fourteen scenes.",
        it: "Un'unica identità tra sito, scene 3D e lavoro video, e un brand film 4K da 64 secondi in quattordici scene, finito.",
      },
      metrics: [
        {
          value: "64 s",
          label: { en: "brand film, in 4K, from concept and script to final cut", it: "brand film, in 4K, dal concept e dallo script al final cut" },
          source: SRC_SERSAN,
        },
        {
          value: "14",
          label: { en: "scenes built on the studio's positioning", it: "scene costruite sul posizionamento dello studio" },
          source: SRC_SERSAN,
        },
        { value: "4K", label: { en: "kinetic typography throughout", it: "tipografia cinetica per tutta la durata" }, source: SRC_SERSAN },
      ],
      // PRODUCT.md §8.1/§8.4: no public link to the film yet (NDA question open).
      links: [
        { label: "sersan.io", href: "https://sersan.io" },
        { label: "Brand film", pending: "film" },
      ],
    },
  },

  // ── 7. Badante24h ────────────────────────────────────────────────────────
  {
    slug: "badante24h",
    title: "Badante24h",
    org: "ALS MCL Civitanova",
    orgMeta: "Freelance · Marche, Italy",
    year: "2026",
    period: "Jan 2026 – Present",
    role: "Full-Stack Developer · Freelance",
    phaseRole: "Full-Stack",
    access: "client",
    stack: ["Next.js 15", "React 19", "TypeScript", "Supabase", "PostGIS", "Serwist (PWA)", "Web Push (VAPID)", "Leaflet", "Sentry", "GitHub Actions"],
    status: "confirmed",
    hook: {
      en: "Production PWA matching families with caregivers in the Italian home-care market.",
      it: "PWA in produzione che mette in contatto famiglie e caregiver nel mercato italiano dell'assistenza domiciliare.",
    },
    highlights: [
      {
        en: "Full offline support via a custom Service Worker (Serwist) and VAPID-signed Web Push notifications.",
        it: "Supporto offline completo via Service Worker custom (Serwist) e notifiche Web Push firmate VAPID.",
      },
      {
        en: "Real-time messaging between families and caregivers on Supabase Realtime, with integrated push notifications.",
        it: "Messaggistica in tempo reale tra famiglie e caregiver su Supabase Realtime, con notifiche push integrate.",
      },
      {
        en: "Sub-second geospatial search with PostGIS 3 (GiST indexes, WGS-84 geography); Leaflet maps and open-source geocoding (Photon + Nominatim), no paid map API.",
        it: "Ricerca geospaziale sub-secondo con PostGIS 3 (indici GiST, geography WGS-84); mappe Leaflet e geocoding open source (Photon + Nominatim), nessuna API di mappe a pagamento.",
      },
      {
        en: "Row-Level Security on every sensitive table, RBAC middleware, HSTS, a restrictive CSP whitelist: zero known auth vulnerabilities at launch.",
        it: "Row-Level Security su ogni tabella sensibile, middleware RBAC, HSTS, una whitelist CSP restrittiva: zero vulnerabilità auth note al lancio.",
      },
      {
        en: "Sentry across client, server and edge with a tunnel route bypassing ad-blockers; a localised IT/EN admin dashboard for caregiver identity verification; CI/CD on GitHub Actions.",
        it: "Sentry su client, server ed edge con una tunnel route che aggira gli ad-blocker; una dashboard admin IT/EN per la verifica d'identità dei caregiver; CI/CD su GitHub Actions.",
      },
    ],
    study: {
      summary: {
        en: "A production PWA that matches families with home-care caregivers across the Italian domiciliary-care market.",
        it: "Una PWA in produzione che mette in contatto famiglie e caregiver nel mercato italiano dell'assistenza domiciliare.",
      },
      problem: {
        en: "Families and caregivers needed to find each other and talk in real time, with offline support, verified caregiver identities and geospatial search, without paying for third-party map APIs.",
        it: "Famiglie e caregiver dovevano trovarsi e parlarsi in tempo reale, con supporto offline, identità dei caregiver verificate e ricerca geospaziale, senza pagare API di mappe di terze parti.",
      },
      action: {
        en: "I built a full PWA on Next.js 15 App Router, React 19 and TypeScript (strict) with Supabase. Full offline support via a custom Serwist Service Worker and VAPID-signed Web Push. Real-time family-to-caregiver messaging over Supabase Realtime with integrated push. Sub-second geospatial search with PostGIS 3 (GiST indexes, WGS-84 geography), Leaflet maps and open-source geocoding (Photon + Nominatim), avoiding third-party map APIs entirely. End-to-end hardening: Row-Level Security on every sensitive table, RBAC middleware, HSTS, a restrictive CSP whitelist and VAPID push. Sentry across three runtime layers (client / server / edge) with a tunnel route bypassing ad-blockers, a localised IT/EN admin dashboard for caregiver identity verification, server-side image optimisation (Sharp), and automated CI/CD on GitHub Actions.",
        it: "Ho realizzato una PWA completa su Next.js 15 App Router, React 19 e TypeScript (strict) con Supabase. Supporto offline totale via Service Worker custom (Serwist) e Web Push firmate VAPID. Messaggistica famiglie-caregiver in tempo reale su Supabase Realtime con push integrate. Ricerca geospaziale sub-secondo con PostGIS 3 (indici GiST, geography WGS-84), mappe Leaflet e geocoding open source (Photon + Nominatim), evitando del tutto le API di mappe di terze parti. Hardening end-to-end: Row-Level Security su ogni tabella sensibile, middleware RBAC, HSTS, una whitelist CSP restrittiva e push VAPID. Sentry su tre layer di runtime (client / server / edge) con una tunnel route che aggira gli ad-blocker, una dashboard admin IT/EN per la verifica d'identità dei caregiver, ottimizzazione immagini server-side (Sharp) e CI/CD automatizzata su GitHub Actions.",
      },
      result: {
        en: "Shipped to production with full offline capability, real-time messaging and sub-second geospatial search, with zero known auth vulnerabilities at launch and error blind-spots reduced to near zero.",
        it: "Rilasciata in produzione con piena capacità offline, messaggistica in tempo reale e ricerca geospaziale sub-secondo, con zero vulnerabilità auth note al lancio e punti ciechi sugli errori ridotti quasi a zero.",
      },
      metrics: [
        { value: "0", label: { en: "known auth vulnerabilities at launch", it: "vulnerabilità auth note al lancio" }, source: SRC_ALS },
        { value: "<1 s", label: { en: "geospatial caregiver search (PostGIS 3)", it: "ricerca geospaziale dei caregiver (PostGIS 3)" }, source: SRC_ALS },
        {
          value: "3",
          label: { en: "runtime layers covered by Sentry: client, server, edge", it: "layer di runtime coperti da Sentry: client, server, edge" },
          source: SRC_ALS,
        },
      ],
      // PRODUCT.md §8.1: production URL not confirmed by Alberto yet.
      links: [{ label: "Badante24h", pending: "url" }],
    },
  },

  // ── 8. Voice AI Agent for Microsoft Teams ───────────────────────────────
  {
    slug: "doit-voice-ai-agent",
    title: "Voice AI Agent for Microsoft Teams",
    org: "DOIT S.r.l · Fabriano",
    orgMeta: "Internship · Fabriano, Italy",
    year: "2025–2026",
    period: "Nov 2025 – Feb 2026",
    role: "AI & Software Developer · Internship",
    phaseRole: "Engineer",
    access: "client",
    stack: ["Azure Speech", "Copilot Studio", "Power Automate", "Dynamics 365", "Angular", "TypeScript"],
    status: "confirmed",
    hook: {
      en: "Hands-free appointment management in Teams from audio notes: create and update meetings, search colleagues and Dynamics 365 contacts, send invitations.",
      it: "Gestione degli appuntamenti in Teams a mani libere da note audio: crea e aggiorna riunioni, cerca colleghi e contatti Dynamics 365, invia inviti.",
    },
    highlights: [
      {
        en: "Create and update meetings, search colleagues and Dynamics 365 contacts, add contacts, send invitations, all from natural-language speech.",
        it: "Creare e aggiornare riunioni, cercare colleghi e contatti Dynamics 365, aggiungere contatti, inviare inviti, tutto da parlato in linguaggio naturale.",
      },
      {
        en: "Real-time speech-to-text with Azure Speech Services.",
        it: "Speech-to-text in tempo reale con Azure Speech Services.",
      },
      {
        en: "Orchestration in Copilot Studio and Power Automate.",
        it: "Orchestrazione in Copilot Studio e Power Automate.",
      },
      {
        en: "Pro-Code Angular + TypeScript front-end bridging the Low-Code layer; consistent UX across Teams and the standalone web app.",
        it: "Front-end Pro-Code Angular + TypeScript che fa da ponte al layer Low-Code; UX coerente tra Teams e la web app standalone.",
      },
    ],
    study: {
      summary: {
        en: "A hands-free voice AI agent inside Microsoft Teams for managing appointments from audio notes.",
        it: "Un agente vocale AI a mani libere dentro Microsoft Teams per gestire gli appuntamenti da note audio.",
      },
      problem: {
        en: "Field users needed to manage appointments in Microsoft Teams without typing: create and update meetings, find colleagues and Dynamics 365 contacts, add contacts and send invitations from a spoken note, a capability the client's toolset did not have.",
        it: "Gli utenti sul campo dovevano gestire gli appuntamenti in Microsoft Teams senza digitare: creare e aggiornare riunioni, trovare colleghi e contatti Dynamics 365, aggiungere contatti e inviare inviti da una nota vocale, una funzione che il toolset del cliente non aveva.",
      },
      action: {
        en: "I designed and delivered a voice agent that creates and updates meetings, searches colleagues and Dynamics 365 contacts, adds contacts and sends invitations, all from natural-language speech. Real-time speech-to-text with Azure Speech Services, orchestrated through Copilot Studio and Power Automate. I built the Pro-Code Angular + TypeScript front-end that bridges the Low-Code automation layer, keeping the UX consistent across Teams and the standalone web app.",
        it: "Ho progettato e consegnato un agente vocale che crea e aggiorna riunioni, cerca colleghi e contatti Dynamics 365, aggiunge contatti e invia inviti, tutto da parlato in linguaggio naturale. Speech-to-text in tempo reale con Azure Speech Services, orchestrato tramite Copilot Studio e Power Automate. Ho realizzato il front-end Pro-Code Angular + TypeScript che fa da ponte al layer di automazione Low-Code, mantenendo la UX coerente tra Teams e la web app standalone.",
      },
      result: {
        en: "A working hands-free assistant that turns spoken intent into calendar and CRM actions, consistent across Teams and the web; real-time speech input was a feature previously absent from the client's toolset.",
        it: "Un assistente a mani libere funzionante che trasforma l'intento parlato in azioni su calendario e CRM, coerente tra Teams e web; l'input vocale in tempo reale era una funzione prima assente dal toolset del cliente.",
      },
    },
  },

  // ── 9. Agricultural Supply Chain Platform ────────────────────────────────
  {
    slug: "agricultural-supply-chain",
    title: "Agricultural Supply Chain Platform",
    org: "University of Camerino",
    orgMeta: "Academic · Software Engineering exam project",
    year: "B.Sc.",
    role: "Software Engineering exam · Team of 3",
    phaseRole: "Full-Stack",
    access: "academic",
    stack: ["Java", "Spring Boot", "Spring Security", "PostgreSQL", "JWT", "REST", "Unified Process", "UML"],
    status: "confirmed",
    hook: {
      en: "Multi-actor supply-chain platform with 10 roles, built by a team of 3 as the Software Engineering exam project at the University of Camerino.",
      it: "Piattaforma di filiera multi-attore con 10 ruoli, costruita da un team di 3 come progetto d'esame di Ingegneria del Software all'Università di Camerino.",
    },
    highlights: [
      {
        en: "Unified Process from requirements and use-case modelling to a layered Spring Boot implementation.",
        it: "Unified Process dai requisiti e dalla modellazione dei casi d'uso a un'implementazione Spring Boot a livelli.",
      },
      {
        en: "MVC, Repository + Service Layer, GRASP principles, JWT-based RBAC.",
        it: "MVC, Repository + Service Layer, principi GRASP, RBAC basato su JWT.",
      },
      {
        en: "Gang-of-Four design patterns throughout; full UML artefacts.",
        it: "Design pattern Gang-of-Four in tutto il progetto; artefatti UML completi.",
      },
      {
        en: "Relational PostgreSQL schema linking producers, products, certifications, events and marketplace orders; REST APIs with geographic search.",
        it: "Schema PostgreSQL relazionale che collega produttori, prodotti, certificazioni, eventi e ordini del marketplace; REST API con ricerca geografica.",
      },
    ],
    study: {
      summary: {
        en: "A multi-actor platform modelling an agricultural supply chain with 10 roles (producers, curators, animators, buyers), built as the Software Engineering exam project by a team of 3.",
        it: "Una piattaforma multi-attore che modella una filiera agricola con 10 ruoli (produttori, curatori, animatori, acquirenti), realizzata come progetto d'esame di Ingegneria del Software da un team di 3.",
      },
      problem: {
        en: "Coordinate ten different actors across an agricultural supply chain with clean role separation, secure authentication and a maintainable, documented design.",
        it: "Coordinare dieci attori diversi lungo una filiera agricola con netta separazione dei ruoli, autenticazione sicura e un design manutenibile e documentato.",
      },
      action: {
        en: "We followed the Unified Process from requirements and use-case modelling to a layered Spring Boot implementation (MVC, Repository + Service Layer, GRASP principles) with JWT-based RBAC on Spring Security. Gang-of-Four design patterns throughout; a relational PostgreSQL schema linking producers, products, certifications, events and marketplace orders, exposed via REST APIs with geographic search and documented with full UML artefacts.",
        it: "Abbiamo seguito lo Unified Process dai requisiti e dalla modellazione dei casi d'uso a un'implementazione Spring Boot a livelli (MVC, Repository + Service Layer, principi GRASP) con RBAC basato su JWT su Spring Security. Design pattern Gang-of-Four in tutto il progetto; uno schema PostgreSQL relazionale che collega produttori, prodotti, certificazioni, eventi e ordini del marketplace, esposto via REST API con ricerca geografica e documentato con artefatti UML completi.",
      },
      result: {
        en: "A working multi-role platform with a documented, pattern-driven architecture and a REST API, delivered as a team of 3. The repository is public on GitHub.",
        it: "Una piattaforma multi-ruolo funzionante con architettura documentata e guidata dai pattern e una REST API, consegnata da un team di 3. Il repository è pubblico su GitHub.",
      },
      metrics: [
        { value: "10", label: { en: "roles: producers, curators, animators, buyers", it: "ruoli: produttori, curatori, animatori, acquirenti" }, source: SRC_UNICAM },
        { value: "3", label: { en: "people in the team", it: "persone nel team" }, source: SRC_UNICAM },
      ],
      links: [{ label: "GitHub", href: "https://github.com/daveeCity/IDS_GROUP_PROJECT" }],
    },
  },
];

export const worksConfirmed = works.filter((w) => w.status === "confirmed");
