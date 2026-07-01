"use client";

import * as React from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";

type Stop = { offset: number; color: string };

/**
 * A rail that fades in at both ends so it reads as a continuous "spine" without
 * hard stubs above the first node / below the last — no height measurement
 * needed. One accent only (ember), per the two-accents-max rule.
 */
const RAIL_STOPS: Stop[] = [
  { offset: 0, color: "transparent" },
  { offset: 0.08, color: "var(--color-ember)" },
  { offset: 0.85, color: "color-mix(in oklab, var(--color-ember) 55%, transparent)" },
  { offset: 1, color: "transparent" },
];

/**
 * DrawLine — a reusable "stroke draws itself on scroll" primitive (Skiper19
 * SVG draw-on-scroll, CLAUDE.md §6), rewritten on our GSAP/Lenis stack. The
 * stroke length is normalized with SVG `pathLength="1"`, so a single
 * strokeDashoffset 1→0 tween draws the whole path regardless of its real pixel
 * size — robust to responsive height + variable-font reflow (no measurement).
 * The tween is SCRUBBED to a scroll window on the PARENT (the shared
 * Lenis<->GSAP ScrollTrigger — never a second scroll loop).
 *
 * strokeDashoffset on a hairline is a few-px repaint, not layout — the cheapest
 * way to honor the reference's "draw" look. Decorative → aria-hidden. Under
 * prefers-reduced-motion (store) the path is simply rendered fully drawn.
 *
 * Default geometry is a vertical rail (the /about journey timeline); pass a
 * custom `d` + `viewBox` to draw any path on scroll.
 */
export function DrawLine({
  className,
  d = "M1 0 L1 100",
  viewBox = "0 0 2 100",
  strokeWidth = 2,
  stops = RAIL_STOPS,
  start = "top 80%",
  end = "bottom 62%",
}: {
  className?: string;
  /** SVG path data (default: a vertical line spanning the viewBox). */
  d?: string;
  viewBox?: string;
  strokeWidth?: number;
  /** gradient stops along the path (start→end). */
  stops?: Stop[];
  /** ScrollTrigger start (mapped to the parent element). */
  start?: string;
  /** ScrollTrigger end. */
  end?: string;
}) {
  const ref = React.useRef<SVGSVGElement>(null);
  const gradId = "draw-" + React.useId().replace(/:/g, "");
  const reduced = useUI((s) => s.reducedMotion);
  // userSpaceOnUse (not the default objectBoundingBox): a vertical line has a
  // zero-width bbox, and an objectBoundingBox gradient on a zero-area box is
  // undefined → the stroke silently doesn't paint. Span the viewBox height.
  const vbHeight = Number(viewBox.split(/\s+/)[3]) || 100;

  useGSAP(
    () => {
      const svg = ref.current;
      if (!svg || reduced) return;
      const path = svg.querySelector<SVGPathElement>("[data-draw]");
      if (!path) return;

      const tween = gsap.fromTo(
        path,
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: { trigger: svg.parentElement ?? svg, start, end, scrub: true },
        },
      );
      // Variable fonts change the container height → recompute trigger positions
      // once the fonts swap (no second scroll loop).
      if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    // revertOnUpdate: revert the prior scrub tween/ScrollTrigger on a reduced-motion
    // flip before re-running (else @gsap/react defers cleanup to unmount).
    { scope: ref, dependencies: [reduced, start, end], revertOnUpdate: true },
  );

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      className={className}
      viewBox={viewBox}
      preserveAspectRatio="none"
      fill="none"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="0"
          y2={vbHeight}
        >
          {stops.map((s, i) => (
            <stop key={i} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>
      <path
        data-draw
        d={d}
        pathLength={1}
        stroke={`url(#${gradId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        // Hidden until the scrub draws it (belt-and-suspenders with the fromTo's
        // immediateRender); left undrawn-static under reduced-motion → fully shown.
        style={reduced ? undefined : { strokeDasharray: 1, strokeDashoffset: 1 }}
      />
    </svg>
  );
}

export default DrawLine;
