"use client";

import { useEffect, useState } from "react";

/*
  Static hero "A" mark — the graceful fallback shown where the WebGPU fluid "A"
  (WaterBallHero) would live, on devices/browsers without navigator.gpu. The
  fluid centerpiece otherwise vanishes entirely there, leaving the hero empty;
  this keeps the brand mark present, on the same CSS sea gradient, sized and
  centered like the fluid letter.

  It is purely decorative (aria-hidden) — the hero's sr-only <h1> carries the
  page meaning. The glyph is a real Fraunces "A" (var(--font-display)) rather
  than an SVG path: it inherits the exact display typeface, stays razor-crisp at
  any DPR, and reads unmistakably as the same letter as the fluid mark.

  Motion: a gentle, once-only entrance (fade + settle + glow bloom). Fully
  honored against prefers-reduced-motion — reduced-motion renders the final
  resting state immediately, with no animation.
*/

// Soft celeste halo behind the foam glyph — layered radial glows in the brand
// accent (--color-celeste). Tuned to bloom, not wash out, over the sea gradient.
const GLOW =
  "radial-gradient(closest-side, rgb(155 211 238 / 0.55), rgb(155 211 238 / 0.18) 55%, transparent 78%)";

export function HeroMarkFallback() {
  // Drives the one-shot entrance. Stays `false` (resting state rendered) when
  // the user prefers reduced motion; otherwise flips true on mount to play it.
  const [entered, setEntered] = useState(false);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setReduced(prefersReduced);
    if (prefersReduced) {
      setEntered(true);
      return;
    }
    // next frame so the initial (pre-entrance) styles paint first -> the CSS
    // transition actually runs.
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const transition = reduced
    ? undefined
    : "opacity 1100ms cubic-bezier(0.22,1,0.36,1), transform 1500ms cubic-bezier(0.22,1,0.36,1), filter 1400ms cubic-bezier(0.22,1,0.36,1)";

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center"
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? "scale(1)" : "scale(1.06)",
          filter: entered ? "blur(0px)" : "blur(10px)",
          transition,
          willChange: reduced ? undefined : "opacity, transform, filter",
        }}
      >
        {/* Celeste halo — sits behind the glyph, sized generously around it. */}
        <div
          aria-hidden
          className="absolute"
          style={{
            width: "min(92vmin, 46rem)",
            height: "min(92vmin, 46rem)",
            background: GLOW,
            opacity: entered ? 1 : 0,
            transition: reduced
              ? undefined
              : "opacity 1600ms ease-out 200ms",
          }}
        />
        {/* The foam "A" — real Fraunces display glyph, crisp at any DPR. */}
        <span
          style={{
            position: "relative",
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            lineHeight: 1,
            // Matches the fluid letter's screen footprint (clamped, viewport-fluid).
            fontSize: "clamp(14rem, 56vmin, 34rem)",
            color: "var(--color-foam)",
            letterSpacing: "-0.02em",
            // Inner depth + outer celeste bloom so the foam letter glows without
            // a hard edge, echoing the translucent water mark.
            textShadow:
              "0 2px 28px rgb(7 34 46 / 0.45), 0 0 56px rgb(155 211 238 / 0.55), 0 0 120px rgb(155 211 238 / 0.32)",
            userSelect: "none",
          }}
        >
          A
        </span>
      </div>
    </div>
  );
}
