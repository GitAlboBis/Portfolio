import { palette, type Mood } from "@/content/tokens";

/**
 * Works — Selected Work entries driving the depth gallery.
 *
 * ⚠ PLACEHOLDER DATA — replace title/role/year/stack with Alberto's real projects
 * (and add `textureSrc` project stills when available). Moods use ONLY Golden Hour
 * tokens. No invented metrics; these are scaffold entries to build the gallery on.
 */
export interface Work {
  slug: string;
  title: string;
  year: string;
  role: string;
  stack: string[];
  /** Atmospheric mood (tokens only) — drives this slide's background blobs. */
  mood: Mood;
  /** Optional project still (WebP). When absent the plane shows a duotone gradient. */
  textureSrc?: string;
}

export const works: Work[] = [
  {
    slug: "tidewatch",
    title: "Tidewatch", // [[TBD]] placeholder
    year: "2024",
    role: "Full-stack · Realtime",
    stack: ["React", "WebGL", "Rust"],
    mood: { base: palette.paper, blob1: palette.amber, blob2: palette.coral },
  },
  {
    slug: "saltgrid",
    title: "Saltgrid", // [[TBD]] placeholder
    year: "2023",
    role: "AI pipeline · Backend",
    stack: ["Python", "FastAPI", "Postgres"],
    mood: { base: palette.paperDeep, blob1: palette.coral, blob2: palette.ember },
  },
  {
    slug: "lumen",
    title: "Lumen", // [[TBD]] placeholder
    year: "2023",
    role: "Design system · Frontend",
    stack: ["Next.js", "TypeScript", "Tailwind"],
    mood: { base: palette.paper, blob1: palette.ember, blob2: palette.rose },
  },
  {
    slug: "current",
    title: "Current", // [[TBD]] placeholder
    year: "2022",
    role: "Data viz · Creative dev",
    stack: ["Three.js", "GLSL", "Node"],
    mood: { base: palette.paperDeep, blob1: palette.rose, blob2: palette.dusk },
  },
];
