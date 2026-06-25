"use client";

import { useEffect, useState } from "react";
import { WaterBallHero } from "@/webgl/waterball/WaterBallHero";

/*
  Hero host. The animated visual is now a faithful embed of matsuoka-601/WaterBall
  (raw WebGPU MLS-MPM fluid, vendored under src/webgl/waterball). It runs on its own
  WebGPU canvas — NOT R3F — and self-guards WebGPU support (renders null when absent,
  so the CSS sea gradient below is the static fallback). The old R3F/SSF/photo-backdrop
  hero was removed. R3F stays available in the repo for the scroll cinematic (later).

  Accessibility: the canvas is aria-hidden + pointer-events:none; on
  prefers-reduced-motion we skip the simulation entirely and show the gradient.
*/

const SEA_GRADIENT =
  "linear-gradient(180deg,#5a9ccd 0%,#86bee2 34%,#bcddee 50%,#cfe6f0 53%,#2f93ab 60%,#176a8d 76%,#0c3d57 100%)";

export function CanvasHost() {
  // false during SSR + when prefers-reduced-motion; flips on after mount otherwise.
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <>
      {/* CSS sea backdrop — static fallback (reduced-motion / no-WebGPU). */}
      <div
        id="sea-backdrop"
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{ background: SEA_GRADIENT }}
      />
      {animate && <WaterBallHero />}
    </>
  );
}
