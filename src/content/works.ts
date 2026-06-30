import { palette, type Mood } from "@/content/tokens";

/**
 * Works — Selected Work entries. Drives the gallery/showcase (top-level card fields)
 * and the /work/[slug] case-study pages (the `study` block, EN/IT).
 *
 * Content is transcribed from the CONFIRMED bio/project facts in docs/07-PROJECTS.md
 * (Problem → Action → Result). No invented metrics. The two SerSan entries are
 * `provisional` (placeholder content, WIP badge) until Alberto confirms — they carry
 * no `study`. Moods use ONLY Golden Hour tokens; real stills (textureSrc) TBD.
 */
export type Localized = { en: string; it: string };
export type WorkStatus = "confirmed" | "provisional";
export interface WorkMetric {
  value: string;
  label: Localized;
}
export interface WorkLink {
  label: string;
  href: string;
}

export interface Work {
  slug: string;
  title: string;
  org: string;
  year: string;
  /** Short role label for the card (kept simple/neutral). */
  role: string;
  stack: string[];
  status: WorkStatus;
  /** Atmospheric mood (tokens only) — drives this slide's background blobs. */
  mood: Mood;
  /** Optional project still (WebP). When absent the plane shows a duotone gradient. */
  textureSrc?: string;
  /** Full case-study content (EN/IT) for /work/[slug]. Absent for provisional. */
  study?: {
    summary: Localized;
    problem: Localized;
    action: Localized;
    result: Localized;
    metrics?: WorkMetric[];
    links?: WorkLink[];
  };
}

export const works: Work[] = [
  {
    slug: "badante24h",
    title: "Badante24h",
    org: "ALS MCL Civitanova",
    year: "2026",
    role: "Full-Stack Developer · Freelance",
    stack: ["Next.js 15", "React 19", "TypeScript", "Supabase", "PostGIS", "Serwist (PWA)", "Web Push (VAPID)", "Leaflet", "Sentry", "GitHub Actions"],
    status: "confirmed",
    mood: { base: palette.paper, blob1: palette.amber, blob2: palette.coral },
    study: {
      summary: {
        en: "A production PWA that matches families with home-care caregivers across the Italian domiciliary-care market.",
        it: "Una PWA di produzione che mette in contatto famiglie e caregiver nel mercato italiano dell'assistenza domiciliare.",
      },
      problem: {
        en: "Families and caregivers needed a fast, trustworthy way to find each other — working offline on low-end phones, with real-time messaging and verified identities, at near-zero infrastructure cost.",
        it: "Famiglie e caregiver avevano bisogno di un modo veloce e affidabile per trovarsi — funzionante offline su telefoni di fascia bassa, con messaggistica in tempo reale e identità verificate, a costo infrastrutturale quasi nullo.",
      },
      action: {
        en: "Built a full PWA on Next.js 15 App Router, React 19 and TypeScript (strict) with Supabase. Full offline support via a custom Serwist Service Worker and VAPID-signed Web Push. Real-time family↔caregiver messaging over Supabase Realtime with integrated push. Sub-second geospatial search with PostGIS 3 (GiST indexes, WGS-84 geography), Leaflet maps and open-source geocoding (Photon + Nominatim) for zero map-API cost. End-to-end hardening: Row Level Security on every sensitive table, RBAC middleware, HSTS, a CSP whitelist and VAPID push. Sentry across three layers (client / server / edge), a localized IT/EN admin dashboard for identity verification, server-side image optimization (Sharp), and GitHub Actions CI/CD with sub-5-minute deploys.",
        it: "Realizzata una PWA completa su Next.js 15 App Router, React 19 e TypeScript (strict) con Supabase. Supporto offline totale via Service Worker custom (Serwist) e Web Push firmate VAPID. Messaggistica famiglie↔caregiver in tempo reale su Supabase Realtime con push integrate. Ricerca geospaziale sub-secondo con PostGIS 3 (indici GiST, geography WGS-84), mappe Leaflet e geocoding open-source (Photon + Nominatim) a costo zero di map API. Hardening end-to-end: Row Level Security su ogni tabella sensibile, middleware RBAC, HSTS, whitelist CSP e push VAPID. Sentry su tre layer (client / server / edge), dashboard admin localizzata IT/EN per la verifica d'identità, ottimizzazione immagini server-side (Sharp), e CI/CD con GitHub Actions con deploy sotto i 5 minuti.",
      },
      result: {
        en: "Shipped to production with full offline capability, real-time messaging and sub-second geospatial search — and zero known auth vulnerabilities at launch.",
        it: "Rilasciata in produzione con piena capacità offline, messaggistica in tempo reale e ricerca geospaziale sub-secondo — e zero vulnerabilità auth note al lancio.",
      },
      metrics: [
        { value: "0", label: { en: "known auth vulns at launch", it: "vulnerabilità auth note al lancio" } },
        { value: "<1s", label: { en: "geospatial search", it: "ricerca geospaziale" } },
        { value: "<5min", label: { en: "deploy cycle", it: "ciclo di deploy" } },
      ],
    },
  },
  {
    slug: "doit-voice-ai-agent",
    title: "Voice AI Agent for Microsoft Teams",
    org: "DOIT · Lodestar Group",
    year: "2025–2026",
    role: "AI & Software Developer · Internship",
    stack: ["Azure Speech", "Copilot Studio", "Power Automate", "Dynamics 365", "Angular", "TypeScript"],
    status: "confirmed",
    mood: { base: palette.paperDeep, blob1: palette.coral, blob2: palette.ember },
    study: {
      summary: {
        en: "A hands-free voice AI agent inside Microsoft Teams for managing appointments by voice note.",
        it: "Un agente vocale AI hands-free dentro Microsoft Teams per gestire gli appuntamenti tramite note vocali.",
      },
      problem: {
        en: "Busy professionals needed to manage meetings without typing — creating and updating appointments, finding colleagues and contacts, and sending invites, entirely through natural-language voice.",
        it: "Professionisti impegnati avevano bisogno di gestire le riunioni senza digitare — creare e aggiornare appuntamenti, trovare colleghi e contatti, e inviare inviti, interamente tramite voce in linguaggio naturale.",
      },
      action: {
        en: "Built a voice agent that creates and updates meetings, searches colleagues and contacts in Dynamics 365, adds contacts and sends invites — all from natural-language voice notes. Real-time speech-to-text with Azure Speech Services, orchestrated through Copilot Studio + Power Automate. Built a Pro-Code Angular + TypeScript front-end that bridges to the Low-Code layer, keeping the UX consistent between Teams and a standalone web app.",
        it: "Costruito un agente vocale che crea e aggiorna riunioni, cerca colleghi e contatti in Dynamics 365, aggiunge contatti e invia inviti — tutto da note vocali in linguaggio naturale. Speech-to-text in tempo reale con Azure Speech Services, orchestrato tramite Copilot Studio + Power Automate. Realizzato un front-end Pro-Code Angular + TypeScript che fa da ponte verso il layer Low-Code, mantenendo la UX coerente tra Teams e una web app standalone.",
      },
      result: {
        en: "A working hands-free assistant that turns spoken intent into real calendar and CRM actions, with a consistent experience across Teams and web.",
        it: "Un assistente hands-free funzionante che trasforma l'intento vocale in azioni reali su calendario e CRM, con un'esperienza coerente tra Teams e web.",
      },
    },
  },
  {
    slug: "agricultural-supply-chain",
    title: "Agricultural Supply Chain Platform",
    org: "University of Camerino · Academic",
    year: "2024",
    role: "Backend Engineer · Team of 3",
    stack: ["Java", "Spring Boot", "Spring Security", "PostgreSQL", "JWT", "REST", "UML"],
    status: "confirmed",
    mood: { base: palette.paper, blob1: palette.ember, blob2: palette.rose },
    study: {
      summary: {
        en: "A multi-actor platform modelling an agricultural supply chain with 10 distinct roles, built as a university software-engineering project.",
        it: "Una piattaforma multi-attore che modella una filiera agricola con 10 ruoli distinti, realizzata come progetto universitario di ingegneria del software.",
      },
      problem: {
        en: "Coordinate ten different actors across an agricultural supply chain with clean role separation, secure auth and a maintainable, well-documented design.",
        it: "Coordinare dieci attori diversi lungo una filiera agricola con netta separazione dei ruoli, autenticazione sicura e un design manutenibile e ben documentato.",
      },
      action: {
        en: "Designed and built a Spring Boot backend with Spring Security and JWT auth over a PostgreSQL database, exposing a REST API. Followed the Unified Process, applied GoF design patterns and modelled the system with UML, in a 3-person team across 96 commits.",
        it: "Progettato e realizzato un backend Spring Boot con Spring Security e auth JWT su database PostgreSQL, esponendo una REST API. Seguito lo Unified Process, applicati i design pattern GoF e modellato il sistema con UML, in un team di 3 persone e 96 commit.",
      },
      result: {
        en: "A working multi-role platform with a documented, pattern-driven architecture and a clean REST API — delivered as a team.",
        it: "Una piattaforma multi-ruolo funzionante con architettura documentata e pattern-driven e una REST API pulita — consegnata come team.",
      },
      links: [{ label: "GitHub", href: "https://github.com/daveeCity/IDS_GROUP_PROJECT" }],
    },
  },
  {
    slug: "sersan-project-1",
    title: "SerSan — Project I",
    org: "SerSan · AI Studio",
    year: "2026",
    role: "Software Engineer",
    stack: ["TBD"],
    status: "provisional",
    mood: { base: palette.paperDeep, blob1: palette.rose, blob2: palette.dusk },
  },
  {
    slug: "sersan-project-2",
    title: "SerSan — Project II",
    org: "SerSan · AI Studio",
    year: "2026",
    role: "Software Engineer",
    stack: ["TBD"],
    status: "provisional",
    mood: { base: palette.paper, blob1: palette.amber, blob2: palette.dusk },
  },
];

export const worksConfirmed = works.filter((w) => w.status === "confirmed");
