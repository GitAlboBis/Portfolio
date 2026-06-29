"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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

// Golden-hour sky — the ultimate fallback (no canvas). Mirrors --gradient-sunset.
// NOTE: the WebGPU water "A" (WaterBallHero / WGSL) still renders TEAL and must be
// reshaded to molten sunset (amber→ember) to match this direction — next shader step.
const SEA_GRADIENT =
  "linear-gradient(180deg,#ffe7bd 0%,#f2a33c 26%,#ff8a4c 46%,#ee5b23 64%,#e15d6b 82%,#5e4b7e 100%)";

export function CanvasHost() {
  // false during SSR + under prefers-reduced-motion; resolved client-side after
  // mount (navigator.gpu is unknown during SSR, so we never SSR the canvas).
  const [showFluid, setShowFluid] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setShowFluid(!reduce && typeof navigator !== "undefined" && !!navigator.gpu);
  }, []);

  // The hero water + sea backdrop belong to the landing experience only. Other
  // routes (e.g. /styleguide, /work/[slug]) render on the clean abyss ground so
  // their own content reads without the fluid bleeding behind it.
  if (pathname !== "/") return null;

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
