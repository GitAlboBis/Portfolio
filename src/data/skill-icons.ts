/*
  skill-icons.ts — curated brand marks for the WP-4 Tech Stack icon cloud.

  The cloud is the SIGNATURE 3D object of the Skills section; it shows the subset
  of the stack (src/data/skills.ts) that has a recognizable, legible brand mark in
  simple-icons. Concept skills (RAG, MCP, Multi-agent orchestration, Dataverse,
  Power Automate, Copilot Studio, Dynamics 365), generic ones (PostGIS, REST), and
  marks dropped by simple-icons for trademark reasons (C#, Microsoft Azure,
  Playwright) live ONLY in the accessible bento below — they are not faked with a
  stand-in logo. The bento is the full, honest, screen-reader list; the cloud is
  the curated visual wow. Each icon path is a 24×24-viewBox SVG `d` string we draw
  to a canvas texture at runtime (no CDN, no network).
*/
import {
  siTypescript,
  siJavascript,
  siPython,
  siOpenjdk,
  siC,
  siCplusplus,
  siReact,
  siNextdotjs,
  siAngular,
  siTailwindcss,
  siThreedotjs,
  siGreensock,
  siFramer,
  siNodedotjs,
  siSpring,
  siSupabase,
  siPostgresql,
  siMysql,
  siVercel,
  siGithubactions,
  siSentry,
  siDocker,
  siVitest,
  siEslint,
  siPrettier,
  siGit,
} from "simple-icons";

export type TechIcon = {
  /** Display name shown in the hover tooltip — matches the skill semantics. */
  label: string;
  /** simple-icons 24×24 SVG path data. */
  path: string;
};

// Order roughly groups families so the Fibonacci scatter still reads as a mix.
export const techIcons: TechIcon[] = [
  { label: "TypeScript", path: siTypescript.path },
  { label: "JavaScript", path: siJavascript.path },
  { label: "Python", path: siPython.path },
  { label: "Java", path: siOpenjdk.path },
  { label: "C", path: siC.path },
  { label: "C++", path: siCplusplus.path },
  { label: "React", path: siReact.path },
  { label: "Next.js", path: siNextdotjs.path },
  { label: "Angular", path: siAngular.path },
  { label: "Tailwind CSS", path: siTailwindcss.path },
  { label: "Three.js", path: siThreedotjs.path },
  { label: "GSAP", path: siGreensock.path },
  { label: "Framer Motion", path: siFramer.path },
  { label: "Node.js", path: siNodedotjs.path },
  { label: "Spring", path: siSpring.path },
  { label: "Supabase", path: siSupabase.path },
  { label: "PostgreSQL", path: siPostgresql.path },
  { label: "MySQL", path: siMysql.path },
  { label: "Vercel", path: siVercel.path },
  { label: "GitHub Actions", path: siGithubactions.path },
  { label: "Sentry", path: siSentry.path },
  { label: "Docker", path: siDocker.path },
  { label: "Vitest", path: siVitest.path },
  { label: "ESLint", path: siEslint.path },
  { label: "Prettier", path: siPrettier.path },
  { label: "Git", path: siGit.path },
];
