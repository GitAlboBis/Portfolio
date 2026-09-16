import type { Localized } from "@/content/works";

/**
 * career.ts — identity, experience, education and public links, transcribed from
 * the September 2026 CV (PRODUCT.md §9). Dates, employers, roles and places are
 * the CV's own; nothing is inferred. Roles and degree names stay in English in
 * both locales (project rule); IT periods use Italian month abbreviations and
 * "oggi" for Present. No phone number, no company e-mail: only the public links.
 */

export interface ExperienceEntry {
  period: Localized;
  org: string;
  role: string;
  /** Contract type and place, e.g. "Freelance · Marche, Italy". */
  meta: Localized;
  /** The CV's one-line description of the engagement, where it has one. */
  note?: Localized;
}

export interface EducationEntry {
  period: Localized;
  org: string;
  degree: Localized;
  /** Place. */
  meta: Localized;
  thesis?: { title: string; abstract: Localized };
}

export interface ExternalLink {
  label: string;
  href: string;
  /** Human-readable form for display ("linkedin.com/in/albertotuveri"). */
  display: string;
}

export const identity = {
  name: "Alberto Tuveri",
  roleLine: "Software & AI Engineer · Creative Lead",
  subLine: "Full-Stack · WebGPU / 3D & Motion",
  positioning: {
    en: "I own the front-end, 3D and motion layer of everything SerSan ships, and the AI layer of its live trading platform.",
    it: "Costruisco il front-end, il livello 3D e motion di tutto ciò che SerSan mette in produzione, e la parte AI della sua piattaforma di trading live.",
  } satisfies Localized,
  /** The CV SUMMARY paragraph. */
  summary: {
    en: "Software and AI engineer comfortable across the entire stack, from database schema design and security hardening to real-time WebGPU rendering and motion design. Currently Software & AI Engineer and Creative Lead at SerSan, where I own the front-end, 3D and motion layer of everything the studio ships, build the AI layer of a live trading platform, and direct the studio's creative output: brand identity, brand film and video. B.Sc. in Computer Science (University of Camerino, 2026); currently studying for an M.Sc. in Artificial Intelligence Systems at the University of Trento.",
    it: "Software e AI engineer a mio agio su tutto lo stack, dalla progettazione dello schema del database e dall'hardening di sicurezza al rendering WebGPU in tempo reale e al motion design. Oggi Software & AI Engineer e Creative Lead in SerSan, dove curo il front-end, il livello 3D e motion di tutto ciò che lo studio mette in produzione, costruisco la parte AI di una piattaforma di trading live e dirigo l'output creativo dello studio: identità di marca, brand film e video. Laurea triennale in Informatica (Università di Camerino, 2026); oggi studente della laurea magistrale in Artificial Intelligence Systems all'Università di Trento.",
  } satisfies Localized,
};

export const experience: ExperienceEntry[] = [
  {
    period: { en: "May 2026 – Present", it: "Mag 2026 – oggi" },
    org: "SerSan — AI Studio",
    role: "Software & AI Engineer · Creative Lead",
    meta: { en: "Sersan Limited (London) · Remote", it: "Sersan Limited (Londra) · Remoto" },
    note: {
      en: "Custom software, automation and AI studio. I own the front-end, WebGPU/3D and motion layer of what the studio ships, the AI work on its flagship platform, and the studio's creative direction.",
      it: "Studio di software su misura, automazione e AI. Curo il front-end, il livello WebGPU/3D e motion di ciò che lo studio mette in produzione, il lavoro AI sulla sua piattaforma di punta e la direzione creativa dello studio.",
    },
  },
  {
    period: { en: "Jan 2026 – Present", it: "Gen 2026 – oggi" },
    org: "ALS MCL Civitanova",
    role: "Full-Stack Developer",
    meta: { en: "Freelance · Marche, Italy", it: "Freelance · Marche, Italia" },
    note: {
      en: "Badante24h: a production PWA matching families with caregivers in the Italian home-care market.",
      it: "Badante24h: una PWA in produzione che mette in contatto famiglie e caregiver nel mercato italiano dell'assistenza domiciliare.",
    },
  },
  {
    period: { en: "Nov 2025 – Feb 2026", it: "Nov 2025 – Feb 2026" },
    org: "DOIT S.r.l",
    role: "AI & Software Developer",
    meta: { en: "Internship · Fabriano, Italy", it: "Stage · Fabriano, Italia" },
    note: {
      en: "A voice-powered AI agent for Microsoft Teams: hands-free appointment management from audio notes.",
      it: "Un agente AI vocale per Microsoft Teams: gestione degli appuntamenti a mani libere da note audio.",
    },
  },
  {
    period: { en: "Jan 2019 – Jan 2020", it: "Gen 2019 – Gen 2020" },
    org: "Istituzione Paritaria Scuole Boccaccio",
    role: "Network Technician Intern",
    meta: { en: "School-Work Alternance · Iglesias, Sardinia", it: "Alternanza scuola-lavoro · Iglesias, Sardegna" },
    note: {
      en: "Planned and executed the full structured cabling of a two-floor school building; configured access points and switches for stable connectivity across 20+ classrooms.",
      it: "Pianificato ed eseguito il cablaggio strutturato completo di un edificio scolastico su due piani; configurati access point e switch per una connettività stabile in oltre 20 aule.",
    },
  },
];

export const education: EducationEntry[] = [
  {
    period: { en: "Sep 2026 – Present", it: "Set 2026 – oggi" },
    org: "University of Trento",
    degree: { en: "M.Sc. in Artificial Intelligence Systems", it: "Laurea magistrale in Artificial Intelligence Systems" },
    meta: { en: "Trento, Italy", it: "Trento, Italia" },
  },
  {
    period: { en: "Jan 2022 – Apr 2026", it: "Gen 2022 – Apr 2026" },
    org: "University of Camerino",
    degree: { en: "B.Sc. in Computer Science", it: "Laurea triennale in Informatica" },
    meta: { en: "Camerino, Italy", it: "Camerino, Italia" },
    thesis: {
      title: "From Autocomplete to Agentic Orchestration: Architectural Analysis and Security of OS-Level Agents",
      abstract: {
        en: "Analysed the architectural evolution from deterministic code completion to autonomous agentic systems (MCP, RAG, multi-agent orchestration); mapped OS-level attack vectors (prompt injection, tool poisoning, MAS kill chain) against MITRE ATLAS and OWASP Agentic Top 10; proposed Zero-Trust defence strategies for enterprise agentic pipelines.",
        it: "Analisi dell'evoluzione architetturale dal completamento deterministico del codice ai sistemi agentici autonomi (MCP, RAG, orchestrazione multi-agente); mappatura dei vettori d'attacco a livello di sistema operativo (prompt injection, tool poisoning, MAS kill chain) su MITRE ATLAS e OWASP Agentic Top 10; proposta di strategie di difesa Zero-Trust per pipeline agentiche enterprise.",
      },
    },
  },
  {
    period: { en: "Sep 2017 – Jan 2020", it: "Set 2017 – Gen 2020" },
    org: "Istituzione Paritaria Scuole Boccaccio",
    degree: { en: "IT Technical Diploma", it: "Diploma tecnico in Informatica" },
    meta: { en: "Iglesias, Sardinia", it: "Iglesias, Sardegna" },
  },
];

export const links = {
  email: { label: "Email", href: "mailto:albertotuveri@gmail.com", display: "albertotuveri@gmail.com" },
  linkedin: { label: "LinkedIn", href: "https://www.linkedin.com/in/albertotuveri", display: "linkedin.com/in/albertotuveri" },
  github: { label: "GitHub", href: "https://github.com/GitAlboBis", display: "github.com/GitAlboBis" },
  sersan: { label: "SerSan", href: "https://sersan.io", display: "sersan.io" },
  spherenode: { label: "SphereNode", href: "https://spherenode.com", display: "spherenode.com" },
} satisfies Record<string, ExternalLink>;

/** The same links in display order. */
export const linkList: ExternalLink[] = [links.email, links.linkedin, links.github, links.sersan, links.spherenode];
