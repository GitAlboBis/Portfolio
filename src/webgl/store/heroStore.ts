import { create } from "zustand";

/*
  Hero FX bus — the non-reactive bridge between the GSAP scroll timeline (the
  WRITER, in hero.tsx) and the raw-WebGPU WaterBallHero RAF loop (the READER).
  The sim/canvas read getState() once per frame; nothing here triggers a React
  re-render. Keep it tiny.

  explode:  0..1 progress of the "logo explodes" beat. WaterBallHero detects the
            rising edge to fire the one-shot particle burst, and uses the value
            to fade the canvas out as the splash dissipates.
  reveal:   0..1 progress of the liquid text reveal. A wavy "waterline" sweeps
            down the title block as this grows, so "Portfolio" (top) emerges
            first, then "Alberto Tuveri". Read by LiquidText.
  video:    0..1 raw hero scroll progress. Drives the Pan di Zucchero frame-scrub
            backdrop (VideoBackdrop) which sits BEHIND the transparent water "A"
            and scrubs from the very first scroll.
*/
type HeroState = {
  explode: number;
  reveal: number;
  video: number;
  set: (p: Partial<Pick<HeroState, "explode" | "reveal" | "video">>) => void;
};

export const useHeroStore = create<HeroState>((set) => ({
  explode: 0,
  reveal: 0,
  video: 0,
  set: (p) => set(p),
}));
