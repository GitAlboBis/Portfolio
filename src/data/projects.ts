import type { Lang } from "@/data/translations/types";

export type Localized = Record<Lang, string>;
export type ProjectStatus = "confirmed" | "provisional";

export type ProjectMetric = { value: string; label: Localized };
export type ProjectLink = { label: string; href: string };

export type Project = {
  slug: string;
  status: ProjectStatus;
  /** Brand/product name — not localized. */
  title: string;
  org: string;
  period: string;
  role: Localized;
  problem: Localized;
  action: Localized;
  result: Localized;
  stack: string[];
  metrics?: ProjectMetric[];
  links?: ProjectLink[];
  /** display order (ascending) */
  order: number;
};

export const projects: Project[] = [
  {
    slug: "badante24h",
    status: "confirmed",
    title: "Badante24h",
    org: "ALS MCL Civitanova",
    period: "2026",
    order: 1,
    role: {
      en: "Full-Stack Developer · Freelance",
      it: "Full-Stack Developer · Freelance",
    },
    problem: {
      en: "Italian families and home-care workers had no trustworthy, real-time way to find and reach each other.",
      it: "Famiglie e caregiver in Italia non avevano un modo affidabile e in tempo reale per trovarsi e contattarsi.",
    },
    action: {
      en: "Architected and shipped a production PWA: offline-first via a custom Service Worker, real-time messaging over Supabase Realtime, sub-second geospatial search on PostGIS, and end-to-end security hardening.",
      it: "Architettata e rilasciata una PWA di produzione: offline-first con Service Worker custom, messaggistica real-time su Supabase Realtime, ricerca geospaziale sub-secondo su PostGIS e hardening di sicurezza end-to-end.",
    },
    result: {
      en: "Zero known auth vulnerabilities at launch, full offline support with push notifications, and solo deploy cycles under five minutes.",
      it: "Zero vulnerabilità auth note al lancio, supporto offline completo con notifiche push e cicli di deploy in solo sotto i cinque minuti.",
    },
    stack: [
      "Next.js 15",
      "React 19",
      "TypeScript",
      "Supabase",
      "PostGIS",
      "Serwist (PWA)",
      "Web Push (VAPID)",
      "Leaflet",
      "Sentry",
      "GitHub Actions",
    ],
    metrics: [
      { value: "0", label: { en: "known auth vulns at launch", it: "vulnerabilità auth note al lancio" } },
      { value: "<1s", label: { en: "geospatial search", it: "ricerca geospaziale" } },
      { value: "<5min", label: { en: "solo deploy cycle", it: "ciclo di deploy in solo" } },
    ],
  },
  {
    slug: "doit-voice-ai-agent",
    status: "confirmed",
    title: "Voice AI Agent for Microsoft Teams",
    org: "DOIT · Lodestar Group",
    period: "2025–2026",
    order: 2,
    role: {
      en: "AI & Software Developer · Internship",
      it: "AI & Software Developer · Tirocinio",
    },
    problem: {
      en: "Field users needed hands-free appointment and CRM management inside Microsoft Teams.",
      it: "Gli utenti sul campo avevano bisogno di gestire appuntamenti e CRM a mani libere dentro Microsoft Teams.",
    },
    action: {
      en: "Built a voice-driven AI agent: speech-to-text via Azure Speech, orchestration through Copilot Studio + Power Automate over Dynamics 365, with a pro-code Angular front-end bridging the low-code layer.",
      it: "Realizzato un agente AI vocale: speech-to-text con Azure Speech, orchestrazione via Copilot Studio + Power Automate su Dynamics 365, con front-end pro-code in Angular a ponte sul layer low-code.",
    },
    result: {
      en: "Hands-free meeting creation, contact search and invitations from natural-language speech — a capability previously absent from the client's toolset.",
      it: "Creazione meeting, ricerca contatti e inviti a mani libere dal linguaggio naturale — una capacità prima assente negli strumenti del cliente.",
    },
    stack: [
      "Azure Speech",
      "Copilot Studio",
      "Power Automate",
      "Dynamics 365",
      "Angular",
      "TypeScript",
    ],
  },
  {
    slug: "sersan-project-1",
    status: "provisional",
    title: "SerSan — Project I",
    org: "SerSan · AI Studio",
    period: "2026 – present",
    order: 3,
    role: { en: "Software Engineer", it: "Software Engineer" },
    problem: { en: "[[TBD — to confirm with Alberto]]", it: "[[DA DEFINIRE — da confermare con Alberto]]" },
    action: { en: "[[TBD]]", it: "[[DA DEFINIRE]]" },
    result: { en: "[[TBD]]", it: "[[DA DEFINIRE]]" },
    stack: ["TBD"],
  },
  {
    slug: "sersan-project-2",
    status: "provisional",
    title: "SerSan — Project II",
    org: "SerSan · AI Studio",
    period: "2026 – present",
    order: 4,
    role: { en: "Software Engineer", it: "Software Engineer" },
    problem: { en: "[[TBD — to confirm with Alberto]]", it: "[[DA DEFINIRE — da confermare con Alberto]]" },
    action: { en: "[[TBD]]", it: "[[DA DEFINIRE]]" },
    result: { en: "[[TBD]]", it: "[[DA DEFINIRE]]" },
    stack: ["TBD"],
  },
  {
    slug: "agricultural-supply-chain",
    status: "confirmed",
    title: "Agricultural Supply Chain Platform",
    org: "University of Camerino · Academic",
    period: "2024",
    order: 5,
    role: { en: "Backend Engineer · Team of 3", it: "Backend Engineer · Team di 3" },
    problem: {
      en: "A multi-actor agricultural supply chain (10 roles) needed a rigorous, well-modelled management platform.",
      it: "Una supply chain agricola multi-attore (10 ruoli) richiedeva una piattaforma di gestione rigorosa e ben modellata.",
    },
    action: {
      en: "Designed and built a layered Spring Boot platform following the Unified Process — MVC, Repository + Service layers, GoF patterns, JWT-based RBAC — with full UML artefacts.",
      it: "Progettata e costruita una piattaforma Spring Boot a strati seguendo lo Unified Process — MVC, Repository + Service layer, pattern GoF, RBAC con JWT — con artefatti UML completi.",
    },
    result: {
      en: "A relational PostgreSQL schema linking producers, products, certifications and orders, exposed via documented REST APIs with geographic search.",
      it: "Uno schema PostgreSQL relazionale che collega produttori, prodotti, certificazioni e ordini, esposto via REST API documentate con ricerca geografica.",
    },
    stack: ["Java", "Spring Boot", "Spring Security", "PostgreSQL", "JWT", "REST", "UML"],
    links: [{ label: "GitHub", href: "https://github.com/daveeCity/IDS_GROUP_PROJECT" }],
  },
];

export const projectsSorted = [...projects].sort((a, b) => a.order - b.order);
