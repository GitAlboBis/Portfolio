import type { Localized } from "@/content/works";

/**
 * skills.ts — the CV's SKILLS block (September 2026, transcribed in PRODUCT.md §9),
 * eight groups with every item verbatim, plus the Languages line. Nothing is
 * added or dropped: this is the full, screen-reader-honest list the UI renders as
 * text. No logos: the sheet prints skills as words, in the CV's own wording.
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
