"use client";

import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useHeroStore } from "@/webgl/store/heroStore";

/*
  HeroScrollSettle — the scroll WRITER for the hero "A" dive (PLAN P0 #2, route b).

  WaterBallHero's RAF loop ALREADY READS `heroStore.explode` every frame and feeds
  it to the sim as a pre-tuned "drain" beat: as explode rises 0->1 the water "A"
  loses surface tension and POURS DOWNWARD into the dive (g2p), the canvas fades as
  it merges into the sea, and scrolling back up REVERSES it (the reader calls
  initFromHomes to reform the "A"). The original writer (the deleted hero.tsx) was
  removed in the clean-slate reset, leaving the reader half-wired. This restores the
  writer.

  G4-safe: we do NOT touch src/webgl/waterball/** or any solver/feel param — we only
  scrub the already-wired `explode` input from scroll position. PLAN explicitly
  sanctions this route ("write a small scroll value into heroStore, read it in
  WaterBallHero") for the scroll-settle.

  - Mapped to the hero's own height: explode = scroll progress over the first
    viewport (start "top top" -> end "bottom top"), so the dive completes exactly as
    the opaque About layer rises to cover the fixed canvas.
  - prefers-reduced-motion: no writer is created -> explode stays 0 -> the "A" holds
    calm (CanvasHost also never mounts the fluid under reduced motion anyway).
  - Renders null. Mounted on the home route only (page.tsx).
*/
export function HeroScrollSettle() {
  useGSAP(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const set = useHeroStore.getState().set;
    const trigger = ScrollTrigger.create({
      trigger: "#hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => set({ explode: self.progress }),
    });

    return () => {
      trigger.kill();
      set({ explode: 0 }); // reset so the "A" is whole again if we remount
    };
  });

  return null;
}
