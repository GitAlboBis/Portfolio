"use client";

import { z } from "zod";
import { useUI } from "@/store/ui";

/**
 * Bilingual EN/IT dictionary. Every visible string lives here — never hardcode
 * copy in components. `en` and `it` must share the same shape (validated by zod
 * in dev). Tone: spare, confident, maritime; an engineer who builds things that
 * move. Technical terms (roles, stack) stay in English even in IT.
 */

const sectionSchema = z.object({
  nav: z.object({
    work: z.string(),
    about: z.string(),
    contact: z.string(),
    menu: z.string(),
    close: z.string(),
  }),
  hero: z.object({
    eyebrow: z.string(),
    name: z.string(),
    role: z.string(),
    tagline: z.string(),
    /** The one jewel word inside `tagline` (must be a substring of it). */
    taglineAccent: z.string(),
    scroll: z.string(),
  }),
  about: z.object({
    eyebrow: z.string(),
    lead: z.string(),
    body: z.string(),
  }),
  works: z.object({
    eyebrow: z.string(),
    title: z.string(),
    open: z.string(),
    problem: z.string(),
    action: z.string(),
    result: z.string(),
    stackLabel: z.string(),
    roleLabel: z.string(),
    wip: z.string(),
    back: z.string(),
    next: z.string(),
  }),
  tech: z.object({
    eyebrow: z.string(),
    title: z.string(),
    marquee: z.array(z.string()),
    ariaMarquee: z.string(),
  }),
  contact: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    cta: z.string(),
    email: z.string(),
  }),
  journey: z.object({
    eyebrow: z.string(),
    title: z.string(),
    lead: z.string(),
    bio: z.array(z.string()),
    educationTitle: z.string(),
    education: z.array(z.object({ period: z.string(), title: z.string(), org: z.string() })),
    experienceTitle: z.string(),
    experience: z.array(z.object({ period: z.string(), org: z.string(), role: z.string() })),
    thesisTitle: z.string(),
    thesis: z.string(),
    more: z.string(),
    back: z.string(),
  }),
  footer: z.object({
    place: z.string(),
    sound: z.string(),
    rights: z.string(),
    email: z.string(),
    top: z.string(),
  }),
});

export type Dict = z.infer<typeof sectionSchema>;

const en: Dict = {
  nav: { work: "Work", about: "About", contact: "Contact", menu: "Menu", close: "Close" },
  hero: {
    eyebrow: "Software Engineer · Full-stack & AI",
    name: "Alberto Tuveri",
    role: "Full-stack engineer · AI at the edge",
    tagline: "I build interfaces that move like water.",
    taglineAccent: "water",
    scroll: "Scroll to dive",
  },
  about: {
    eyebrow: "01 — About",
    lead: "Calm on the surface. Alive underneath.",
    body: "Five years turning hard problems into things that feel inevitable — full-stack systems, AI pipelines, and the occasional shader. I care about the moment an interface stops feeling like software and starts feeling like a place.",
  },
  works: {
    eyebrow: "Selected Work · 2021—2026",
    title: "Things I've built",
    open: "Open case",
    problem: "The problem",
    action: "What I built",
    result: "The result",
    stackLabel: "Stack",
    roleLabel: "Role",
    wip: "Work in progress",
    back: "All work",
    next: "Next project",
  },
  tech: {
    eyebrow: "02 — Stack",
    title: "The current I work in.",
    marquee: [
      "Full-stack engineering",
      "AI integration",
      "Real-time systems",
      "WebGL & shaders",
      "Design engineering",
      "Interaction",
      "Performance",
    ],
    ariaMarquee: "Fields I work in",
  },
  contact: {
    eyebrow: "03 — Contact",
    headline: "Let's make something that moves.",
    cta: "Write to me",
    email: "albertotuveri@gmail.com",
  },
  journey: {
    eyebrow: "The long version",
    title: "From the Sulcis coast to systems that move.",
    lead: "Software engineer — full-stack & AI integration.",
    bio: [
      "I'm Alberto, a software engineer who works across the whole stack — from GPU shaders and React front-ends down to PostGIS queries and CI pipelines — with a particular focus on integrating AI into real products.",
      "I grew up in Iglesias, on the Sulcis-Iglesiente coast of Sardinia, where the sea around Pan di Zucchero shaped how I see things: clean lines, deep structure, and a respect for what's underneath the surface.",
      "Recently I've shipped a production PWA that matches families with caregivers across Italy, built a hands-free voice AI agent for Microsoft Teams, and joined SerSan — AI Studio as a software engineer. I care about systems that are fast, secure, and genuinely useful.",
    ],
    educationTitle: "Education",
    education: [
      { period: "2022 — 2026", title: "B.Sc. Computer Science", org: "University of Camerino" },
      { period: "", title: "Technical IT Diploma", org: "Ist. Boccaccio, Iglesias" },
    ],
    experienceTitle: "Experience",
    experience: [
      { period: "May 2026 — present", org: "SerSan · AI Studio", role: "Software Engineer" },
      { period: "Jan 2026", org: "ALS MCL Civitanova", role: "Full-Stack Developer · Freelance" },
      { period: "Nov 2025 — Feb 2026", org: "DOIT · Lodestar Group", role: "AI & Software Developer · Internship" },
      { period: "2019 — 2020", org: "Ist. Boccaccio, Iglesias", role: "Network Technician · Intern" },
    ],
    thesisTitle: "B.Sc. thesis",
    thesis:
      "“From Autocomplete to Agentic Orchestration: Architectural Analysis and Security of OS-Level Agents” — maps the evolution from code completion to autonomous agentic systems (MCP, RAG, multi-agent orchestration) and proposes Zero-Trust defensive strategies against OS-level attack vectors.",
    more: "Selected work",
    back: "Back to home",
  },
  footer: {
    place: "Masua · 39°09′N 8°25′E",
    sound: "Ambient",
    rights: "All rights reserved",
    email: "Email",
    top: "Top",
  },
};

const it: Dict = {
  nav: { work: "Lavori", about: "Chi sono", contact: "Contatti", menu: "Menu", close: "Chiudi" },
  hero: {
    eyebrow: "Software Engineer · Full-stack & AI",
    name: "Alberto Tuveri",
    role: "Full-stack engineer · AI sul bordo",
    tagline: "Costruisco interfacce che si muovono come l'acqua.",
    taglineAccent: "acqua",
    scroll: "Scorri per immergerti",
  },
  about: {
    eyebrow: "01 — Chi sono",
    lead: "Calmo in superficie. Vivo sotto.",
    body: "Cinque anni a trasformare problemi difficili in cose che sembrano inevitabili — sistemi full-stack, pipeline AI e qualche shader. Mi interessa il momento in cui un'interfaccia smette di sembrare software e inizia a sembrare un luogo.",
  },
  works: {
    eyebrow: "Lavori scelti · 2021—2026",
    title: "Cose che ho costruito",
    open: "Apri caso",
    problem: "Il problema",
    action: "Cosa ho costruito",
    result: "Il risultato",
    stackLabel: "Stack",
    roleLabel: "Ruolo",
    wip: "In lavorazione",
    back: "Tutti i lavori",
    next: "Prossimo progetto",
  },
  tech: {
    eyebrow: "02 — Stack",
    title: "La corrente in cui lavoro.",
    marquee: [
      "Ingegneria full-stack",
      "Integrazione AI",
      "Sistemi real-time",
      "WebGL & shader",
      "Design engineering",
      "Interazione",
      "Performance",
    ],
    ariaMarquee: "Gli ambiti in cui lavoro",
  },
  contact: {
    eyebrow: "03 — Contatti",
    headline: "Facciamo qualcosa che si muove.",
    cta: "Scrivimi",
    email: "albertotuveri@gmail.com",
  },
  journey: {
    eyebrow: "La versione lunga",
    title: "Dalla costa del Sulcis a sistemi che si muovono.",
    lead: "Software engineer — full-stack & integrazione AI.",
    bio: [
      "Sono Alberto, un software engineer che lavora su tutto lo stack — dagli shader GPU e i front-end React fino alle query PostGIS e alle pipeline CI — con un focus particolare sull'integrazione dell'AI in prodotti reali.",
      "Sono cresciuto a Iglesias, sulla costa del Sulcis-Iglesiente in Sardegna, dove il mare attorno a Pan di Zucchero ha plasmato il mio modo di vedere le cose: linee pulite, struttura profonda, e rispetto per ciò che sta sotto la superficie.",
      "Di recente ho rilasciato una PWA in produzione che mette in contatto famiglie e caregiver in tutta Italia, ho costruito un agente vocale AI hands-free per Microsoft Teams, e sono entrato in SerSan — AI Studio come software engineer. Mi interessano i sistemi veloci, sicuri e davvero utili.",
    ],
    educationTitle: "Formazione",
    education: [
      { period: "2022 — 2026", title: "Laurea triennale in Informatica", org: "Università di Camerino" },
      { period: "", title: "Diploma tecnico informatico", org: "Ist. Boccaccio, Iglesias" },
    ],
    experienceTitle: "Esperienza",
    experience: [
      { period: "Mag 2026 — oggi", org: "SerSan · AI Studio", role: "Software Engineer" },
      { period: "Gen 2026", org: "ALS MCL Civitanova", role: "Full-Stack Developer · Freelance" },
      { period: "Nov 2025 — Feb 2026", org: "DOIT · Lodestar Group", role: "AI & Software Developer · Tirocinio" },
      { period: "2019 — 2020", org: "Ist. Boccaccio, Iglesias", role: "Tecnico di rete · Tirocinio" },
    ],
    thesisTitle: "Tesi triennale",
    thesis:
      "“From Autocomplete to Agentic Orchestration: Architectural Analysis and Security of OS-Level Agents” — mappa l'evoluzione dal completamento del codice ai sistemi agentici autonomi (MCP, RAG, orchestrazione multi-agente) e propone strategie difensive Zero-Trust contro i vettori di attacco a livello OS.",
    more: "Lavori scelti",
    back: "Torna alla home",
  },
  footer: {
    place: "Masua · 39°09′N 8°25′E",
    sound: "Ambiente",
    rights: "Tutti i diritti riservati",
    email: "Email",
    top: "Su",
  },
};

// Dev-only shape guard: surfaces en/it drift early.
if (process.env.NODE_ENV !== "production") {
  sectionSchema.parse(en);
  sectionSchema.parse(it);
}

export const dict: Record<"en" | "it", Dict> = { en, it };

/** Returns the active-locale dictionary tree. Usage: const t = useDict(); t.hero.name */
export function useDict(): Dict {
  const locale = useUI((s) => s.locale);
  return dict[locale];
}
