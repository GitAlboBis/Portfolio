import type { Lang } from "@/data/translations/types";

export type Localized = Record<Lang, string>;
export type SkillGroup = { label: Localized; items: string[] };

/*
  Skill groups for the Skills section (docs/07). Items are proper nouns (not
  localized); only the group label is bilingual. Note: Framer Motion is a
  personal skill — the portfolio's own stack uses GSAP (see docs/01-TECHSTACK.md).
*/
export const skillGroups: SkillGroup[] = [
  {
    label: { en: "Core", it: "Core" },
    items: ["TypeScript", "JavaScript", "Python", "Java", "C / C++", "C#"],
  },
  {
    label: { en: "Front-End", it: "Front-End" },
    items: ["React", "Next.js", "Angular", "Tailwind CSS", "Three.js / WebGL", "GSAP", "Framer Motion"],
  },
  {
    label: { en: "Back-End & Data", it: "Back-End & Dati" },
    items: ["Node.js", "Spring", "Supabase", "PostgreSQL", "PostGIS", "MySQL"],
  },
  {
    label: { en: "Cloud & DevOps", it: "Cloud & DevOps" },
    items: ["Azure (AD, Speech)", "Vercel", "GitHub Actions", "Sentry", "Docker"],
  },
  {
    label: { en: "AI & Agents", it: "AI & Agenti" },
    items: ["Copilot Studio", "Dataverse", "Dynamics 365", "Power Automate", "MCP", "RAG", "Multi-agent orchestration"],
  },
  {
    label: { en: "Testing & Tooling", it: "Testing & Tooling" },
    items: ["Vitest", "Playwright", "ESLint", "Prettier", "Git"],
  },
];
