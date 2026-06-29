"use client";

import { useEffect, useState } from "react";
import { WaterBallHero } from "@/webgl/waterball/WaterBallHero";

/*
  Hero canvas host (clean-slate, minimal).

  Mounts ONLY the vendored matsuoka-601/WaterBall raw-WebGPU MLS-MPM fluid "A"
  (src/webgl/waterball). It runs on its own WebGPU canvas + RAF loop — NOT R3F —
  and self-guards WebGPU support (renders null when absent). We mount it only when
  WebGPU is present AND motion is allowed; otherwise the CSS sea gradient stands
  alone as the ultimate fallback.

  The old hero composition (Pan di Zucchero frame-scrub VideoBackdrop, static
  fallback mark, scroll-driven explode/drain) was removed in the reset. heroStore
  still exists and WaterBallHero reads heroStore.explode each frame — with no
  scroll writer it stays 0, so the "A" simply churns/breathes in place. The
  scroll-driven beats get rewired when the new hero is designed.

  Accessibility: the canvas is aria-hidden + pointer-events:none (set inside
  WaterBallHero). Decorative only.
*/

const SEA_GRADIENT =
  "linear-gradient(180deg,#5a9ccd 0%,#86bee2 34%,#bcddee 50%,#cfe6f0 53%,#2f93ab 60%,#176a8d 76%,#0c3d57 100%)";

export function CanvasHost() {
  // false during SSR + under prefers-reduced-motion; resolved client-side after
  // mount (navigator.gpu is unknown during SSR, so we never SSR the canvas).
  const [showFluid, setShowFluid] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setShowFluid(!reduce && typeof navigator !== "undefined" && !!navigator.gpu);
  }, []);

  return (
    <>
      {/* CSS sea backdrop — ultimate fallback (no canvas at all). */}
      <div
        id="sea-backdrop"
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{ background: SEA_GRADIENT }}
      />
      {showFluid && <WaterBallHero />}
    </>
  );
}
