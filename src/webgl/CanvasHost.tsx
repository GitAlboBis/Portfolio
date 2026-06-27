"use client";

import { useEffect, useState } from "react";
import { WaterBallHero } from "@/webgl/waterball/WaterBallHero";
import { VideoBackdrop } from "@/components/video-backdrop";
import { HeroMarkFallback } from "@/components/hero-mark-fallback";

/*
  Hero host. The animated visual is now a faithful embed of matsuoka-601/WaterBall
  (raw WebGPU MLS-MPM fluid, vendored under src/webgl/waterball). It runs on its own
  WebGPU canvas — NOT R3F — and self-guards WebGPU support (renders null when absent).
  The old R3F/SSF/photo-backdrop hero was removed. R3F stays available in the repo for
  the scroll cinematic (later).

  Fallback: when WebGPU is unavailable the fluid "A" returns null and the hero
  centerpiece would vanish — so we render a static foam "A" mark (HeroMarkFallback)
  in its place, over the CSS sea gradient. The same static mark stands in when the
  user prefers reduced motion (the sim is intentionally never mounted there).

  Accessibility: the canvas + fallback mark are aria-hidden + pointer-events:none;
  the hero's sr-only <h1> carries meaning. On prefers-reduced-motion we skip the
  simulation entirely and show the (non-animated) static mark.
*/

const SEA_GRADIENT =
  "linear-gradient(180deg,#5a9ccd 0%,#86bee2 34%,#bcddee 50%,#cfe6f0 53%,#2f93ab 60%,#176a8d 76%,#0c3d57 100%)";

export function CanvasHost() {
  // false during SSR + when prefers-reduced-motion; flips on after mount otherwise.
  const [animate, setAnimate] = useState(false);
  // WebGPU support, resolved client-side AFTER mount (navigator.gpu is unknown
  // during SSR). `null` = not yet checked -> render nothing for the centerpiece
  // to avoid an SSR/first-paint mismatch; true/false once known.
  const [hasWebGPU, setHasWebGPU] = useState<boolean | null>(null);

  useEffect(() => {
    setAnimate(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setHasWebGPU(typeof navigator !== "undefined" && !!navigator.gpu);
  }, []);

  // Mount the live fluid only when WebGPU is present AND motion is allowed.
  const showFluid = hasWebGPU === true && animate;
  // Static foam "A" stands in whenever the fluid can't/shouldn't run:
  // no WebGPU, or reduced-motion (sim intentionally skipped). Wait until the
  // client checks resolve so we never flash the fallback over a supported hero.
  const showFallback = hasWebGPU !== null && !showFluid;

  return (
    <>
      {/* CSS sea backdrop — ultimate fallback (no canvas at all). */}
      <div
        id="sea-backdrop"
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{ background: SEA_GRADIENT }}
      />
      {/* Pan di Zucchero footage = hero background; scrubs from the first scroll.
          Mounted BEFORE the water so the (transparent) "A" composites over it. */}
      <VideoBackdrop />
      {showFluid && <WaterBallHero />}
      {showFallback && <HeroMarkFallback />}
    </>
  );
}
