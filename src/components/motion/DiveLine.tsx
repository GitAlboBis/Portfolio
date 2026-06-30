"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * DiveLine — a thin "descent thread" in the left gutter that DRAWS as you scroll
 * the whole page (Skiper19 / the classic stroke-dash draw, re-themed; GSAP
 * ScrollTrigger scrub on the shared Lenis ticker — no second scroll loop). An
 * ember→coral→amber gradient stroke fills top→bottom as the dive deepens, a literal
 * thread pulling you down through the sections.
 *
 * Decorative (aria-hidden), pointer-events-none, above the content layer but below
 * the nav, hidden on small screens (no gutter room). reduced-motion → fully drawn,
 * static. Mounted on the home route only (page.tsx).
 */
export function DiveLine() {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const pathRef = React.useRef<SVGPathElement>(null);

  useGSAP(
    () => {
      const path = pathRef.current;
      if (!path) return;
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(path, { strokeDashoffset: 0 });
        return;
      }
      gsap.to(path, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });
    },
    { scope: wrapRef },
  );

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none fixed top-0 z-30 hidden h-dvh md:block"
      style={{ left: "clamp(0.75rem, 2.4vw, 2.75rem)", width: 26 }}
    >
      <svg width="26" height="100%" viewBox="0 0 26 1000" preserveAspectRatio="none" fill="none">
        <defs>
          <linearGradient id="diveGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-ember)" />
            <stop offset="0.6" stopColor="var(--color-coral)" />
            <stop offset="1" stopColor="var(--color-amber)" />
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          d="M13 0 C 24 160, 2 330, 13 500 C 24 670, 2 840, 13 1000"
          stroke="url(#diveGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
