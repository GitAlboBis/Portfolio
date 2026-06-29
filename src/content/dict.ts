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
  }),
  tech: z.object({
    eyebrow: z.string(),
    title: z.string(),
  }),
  contact: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    cta: z.string(),
    email: z.string(),
  }),
  footer: z.object({
    place: z.string(),
    sound: z.string(),
    rights: z.string(),
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
    scroll: "Scroll to dive",
  },
  about: {
    eyebrow: "01 — About",
    lead: "Calm on the surface. Alive underneath.",
    body: "Five years turning hard problems into things that feel inevitable — full-stack systems, AI pipelines, and the occasional shader. I care about the moment an interface stops feeling like software and starts feeling like a place.",
  },
  works: { eyebrow: "Selected Work · 2021—2026", title: "Things I've built", open: "Open case" },
  tech: { eyebrow: "02 — Stack", title: "The current I work in." },
  contact: {
    eyebrow: "03 — Contact",
    headline: "Let's make something that moves.",
    cta: "Write to me",
    email: "alberto.t@sersan.dev",
  },
  footer: { place: "Masua · 39°09′N 8°25′E", sound: "Ambient", rights: "All rights reserved" },
};

const it: Dict = {
  nav: { work: "Lavori", about: "Chi sono", contact: "Contatti", menu: "Menu", close: "Chiudi" },
  hero: {
    eyebrow: "Software Engineer · Full-stack & AI",
    name: "Alberto Tuveri",
    role: "Full-stack engineer · AI sul bordo",
    tagline: "Costruisco interfacce che si muovono come l'acqua.",
    scroll: "Scorri per immergerti",
  },
  about: {
    eyebrow: "01 — Chi sono",
    lead: "Calmo in superficie. Vivo sotto.",
    body: "Cinque anni a trasformare problemi difficili in cose che sembrano inevitabili — sistemi full-stack, pipeline AI e qualche shader. Mi interessa il momento in cui un'interfaccia smette di sembrare software e inizia a sembrare un luogo.",
  },
  works: { eyebrow: "Lavori scelti · 2021—2026", title: "Cose che ho costruito", open: "Apri caso" },
  tech: { eyebrow: "02 — Stack", title: "La corrente in cui lavoro." },
  contact: {
    eyebrow: "03 — Contatti",
    headline: "Facciamo qualcosa che si muove.",
    cta: "Scrivimi",
    email: "alberto.t@sersan.dev",
  },
  footer: { place: "Masua · 39°09′N 8°25′E", sound: "Ambiente", rights: "Tutti i diritti riservati" },
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
