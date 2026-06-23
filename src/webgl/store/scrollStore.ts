import { create } from "zustand";

export type SectionId =
  | "hero"
  | "intro"
  | "cinematic"
  | "work"
  | "skills"
  | "contact";

/*
  Normalized scroll bounds per section [start, end] in 0..1.
  PROVISIONAL: tune to the real DOM heights once sections exist in page.tsx
  (docs/03-ARCHITECTURE.md, open question on BOUNDS).
*/
export const SECTION_BOUNDS: Record<SectionId, [number, number]> = {
  hero: [0.0, 0.16],
  intro: [0.16, 0.3],
  cinematic: [0.3, 0.56],
  work: [0.56, 0.8],
  skills: [0.8, 0.9],
  contact: [0.9, 1.0],
};

function sectionFor(progress: number): SectionId {
  for (const id of Object.keys(SECTION_BOUNDS) as SectionId[]) {
    const [a, b] = SECTION_BOUNDS[id];
    if (progress >= a && progress < b) return id;
  }
  return "contact";
}

type ScrollState = {
  /** global scroll progress 0..1 */
  progress: number;
  velocity: number;
  activeSection: SectionId;
  set: (p: { progress: number; velocity?: number }) => void;
};

export const useScrollStore = create<ScrollState>((set) => ({
  progress: 0,
  velocity: 0,
  activeSection: "hero",
  set: ({ progress, velocity = 0 }) =>
    set({ progress, velocity, activeSection: sectionFor(progress) }),
}));
