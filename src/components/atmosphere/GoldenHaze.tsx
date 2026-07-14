"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";

/*
  GoldenHaze — the About band's atmosphere (decorative, aria-hidden).

  The band between the hero's sunset and the works' mood ramp used to read as a
  dead warm-white gap. This paints the sky CONTINUING behind the paper:

  • top bleed — the hero's afterglow melts into the page instead of a hard cut;
  • a faint warm haze where the murmuration gathers (the flock itself lives in
    Murmuration.tsx — this layer just keeps the sky from being sterile);
  • a horizon hairline that draws itself across the band;
  • film grain (static SVG turbulence tile — painted once, never re-rendered);
  • bottom bleed — paper pre-echoes the works gallery's amber/coral mood.

  Transform/opacity only; every layer is aria-hidden; reduced-motion gets the
  full static picture (horizon drawn, haze parked, zero listeners).
*/

const GRAIN =
  "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23g)'/></svg>\")";

export function GoldenHaze() {
  const root = React.useRef<HTMLDivElement>(null);
  // Reactive store flag (mirrored from the media query by Smooth.tsx) so a
  // mid-session Reduce Motion flip re-runs the effect and reverts the scrubs.
  const reduced = useUI((s) => s.reducedMotion);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const section = el.closest("section") ?? el;
      const haze = el.querySelector("[data-haze]");
      const horizon = el.querySelector("[data-horizon]");

      // The warm haze drifts down on a deeper layer — parallax depth.
      gsap.fromTo(
        haze,
        { y: "-6vh" },
        {
          y: "12vh",
          ease: "none",
          force3D: true,
          scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
      // The horizon draws itself while the band enters.
      gsap.fromTo(
        horizon,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top 85%", end: "center 45%", scrub: true },
        },
      );
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none absolute inset-0 select-none"
    >
      {/* Hero afterglow melting into the paper (kills the hard seam). */}
      <div
        className="absolute inset-x-0 top-0 h-[30vh]"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in oklab, var(--color-amber) 17%, var(--color-paper)), transparent)",
        }}
      />

      {/* Warm haze — a faint afterglow where the flock gathers (no disc: the
          murmuration is the protagonist, this only warms the sky behind it). */}
      <div
        data-haze
        className="absolute right-[-24vw] top-[-14vh] aspect-square w-[clamp(30rem,66vw,64rem)] md:right-[-8vw]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-amber) 26%, transparent) 0%, color-mix(in srgb, var(--color-coral) 11%, transparent) 46%, transparent 70%)",
        }}
      />

      {/* Horizon — draws itself across the band as it enters. */}
      <div
        data-horizon
        className="hairline absolute left-[6%] right-[6%] top-[56%] origin-left"
      />

      {/* Film grain — static tile, painted once (editorial paper physicality). */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: GRAIN, backgroundSize: "140px 140px", opacity: 0.05, mixBlendMode: "multiply" }}
      />

      {/* The paper pre-echoes the works gallery's amber/coral mood ramp. */}
      <div
        className="absolute inset-x-0 bottom-0 h-[26vh]"
        style={{
          background:
            "linear-gradient(to top, color-mix(in oklab, var(--color-coral) 18%, var(--color-paper)), transparent)",
        }}
      />
    </div>
  );
}
