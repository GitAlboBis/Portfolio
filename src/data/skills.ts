import type { Localized } from "@/content/works";

/**
 * skills.ts — the CV's SKILLS block (September 2026, transcribed in PRODUCT.md §9),
 * eight groups with every item verbatim, plus the Languages line. Nothing is
 * added or dropped: this is the full, screen-reader-honest list the UI renders as
 * text. `iconable` maps the items that have a real brand mark in simple-icons to
 * the export name used in src/data/skill-icons.ts; items with no mark (or whose
 * mark simple-icons removed, e.g. C#, Azure, Playwright, After Effects) are
 * deliberately absent, never faked with a stand-in logo.
 */
export type SkillGroup = { id: string; label: Localized; items: string[] };

export const skillGroups: SkillGroup[] = [
  {
    id: "core",
    label: { en: "Core", it: "Linguaggi" },
    items: ["TypeScript", "JavaScript (ES2024)", "Python", "Java", "C / C++", "C#"],
  },
  {
    id: "front-end",
    label: { en: "Front-End", it: "Front-End" },
    items: ["React 19", "Next.js 16 (App Router)", "Angular", "Tailwind CSS v4", "GSAP", "Lenis", "Framer Motion"],
  },
  {
    id: "3d-graphics",
    label: { en: "3D & Graphics", it: "3D e grafica" },
    items: ["WebGPU", "WGSL / TSL", "three.js", "React Three Fiber", "GLSL / WebGL2", "GPGPU compute", "Blender"],
  },
  {
    id: "back-end-db",
    label: { en: "Back-End & DB", it: "Back-End e DB" },
    items: ["Node.js", "Deno", "Spring", "Supabase", "PostgreSQL", "PostGIS", "pgvector", "MySQL"],
  },
  {
    id: "ai",
    label: { en: "AI", it: "AI" },
    items: [
      "RAG & embeddings",
      "LLM evaluation & guardrails",
      "OpenAI / Anthropic / Gemini",
      "Copilot Studio",
      "Power Automate",
      "Dataverse",
      "Dynamics 365",
      "Claude Code / MCP",
    ],
  },
  {
    id: "cloud-devops",
    label: { en: "Cloud & DevOps", it: "Cloud e DevOps" },
    items: ["Vercel", "Azure (AD, Speech)", "Cloudflare (Stream / R2)", "GitHub Actions", "Sentry", "Docker"],
  },
  {
    id: "testing-tooling",
    label: { en: "Testing & Tooling", it: "Test e strumenti" },
    items: ["Playwright", "Vitest", "pgTAP", "Lighthouse CI", "ESLint", "Prettier", "Git"],
  },
  {
    id: "creative",
    label: { en: "Creative", it: "Creatività" },
    items: [
      "Motion graphics & VFX (After Effects)",
      "Video editing & post-production",
      "Brand identity & logo design",
      "Art direction",
      "Typography",
      "Sound design",
    ],
  },
];

export const languages: { label: Localized; items: Localized[] } = {
  label: { en: "Languages", it: "Lingue" },
  items: [
    { en: "Italian (native)", it: "Italiano (madrelingua)" },
    { en: "English B1 · C1 in progress", it: "Inglese B1 · C1 in corso" },
  ],
};

/**
 * Skill item → simple-icons export name (verified against the installed package).
 * Where an item bundles several names, the mark is the one that stands for the
 * whole item ("C / C++" → the C++ mark, "GLSL / WebGL2" → WebGL, "Claude Code / MCP"
 * → Claude Code). Multi-vendor items with no single mark ("OpenAI / Anthropic /
 * Gemini") are left out.
 */
export const iconable: Record<string, string> = {
  TypeScript: "siTypescript",
  "JavaScript (ES2024)": "siJavascript",
  Python: "siPython",
  Java: "siOpenjdk",
  "C / C++": "siCplusplus",
  "React 19": "siReact",
  "Next.js 16 (App Router)": "siNextdotjs",
  Angular: "siAngular",
  "Tailwind CSS v4": "siTailwindcss",
  GSAP: "siGreensock",
  "Framer Motion": "siFramer",
  WebGPU: "siWebgpu",
  "three.js": "siThreedotjs",
  "GLSL / WebGL2": "siWebgl",
  Blender: "siBlender",
  "Node.js": "siNodedotjs",
  Deno: "siDeno",
  Spring: "siSpring",
  Supabase: "siSupabase",
  PostgreSQL: "siPostgresql",
  MySQL: "siMysql",
  "Claude Code / MCP": "siClaudecode",
  Vercel: "siVercel",
  "Cloudflare (Stream / R2)": "siCloudflare",
  "GitHub Actions": "siGithubactions",
  Sentry: "siSentry",
  Docker: "siDocker",
  Vitest: "siVitest",
  "Lighthouse CI": "siLighthouse",
  ESLint: "siEslint",
  Prettier: "siPrettier",
  Git: "siGit",
};
