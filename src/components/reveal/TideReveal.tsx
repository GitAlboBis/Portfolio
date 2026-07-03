"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";

/**
 * TideReveal — a re-theme of the Codrops "On-Scroll SVG Mask Transitions" mechanism
 * (a ScrollTrigger-driven, scrubbed mask reveal) to the site's sea → sunset identity:
 * the copy EMERGES FROM A RISING TIDE. A soft, feathered waterline (a CSS mask driven by
 * the `--tide` custom prop, 0→1) climbs over the block as it passes a short scroll window
 * — no visible line, just the copy surfacing from below like the sea coming in. Welded to
 * scroll (reverses on scroll-up), on the SHARED Lenis<->GSAP ticker — no second loop.
 *
 * Best on ONE big display heading. No-JS / SSR / prefers-reduced-motion → the content is
 * fully shown with no mask (the mask is only applied once the client effect runs), so
 * nothing is ever trapped hidden.
 */
export function TideReveal({
  as: Tag = "div",
  id,
  className,
  children,
  start = "top 76%",
  /** End of the scrub window (tide fully in) — completes by the time the heading
   *  reaches a comfortable reading position, so it's never left half-shown. */
  end = "top 48%",
}: {
  as?: React.ElementType;
  id?: string;
  className?: string;
  children: React.ReactNode;
  /** Start of the scrub window (heading entering). */
  start?: string;
  end?: string;
}) {
  const ref = React.useRef<HTMLElement>(null);
  const reduced = useUI((s) => s.reducedMotion);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced) return;
      const content = el.querySelector<HTMLElement>("[data-tide-content]");
      if (!content) return;

      // Soft rising waterline as a CSS mask on the content. `--tide` 0→1 lifts the
      // gradient stops from below the block (hidden) to above it (fully shown); the
      // feathered band between the stops is the water edge — no hard line.
      const mask =
        "linear-gradient(to top, #000 calc(var(--tide) * 150% - 34%), rgba(0,0,0,0) calc(var(--tide) * 150% - 4%))";
      gsap.set(content, { "--tide": 0, maskImage: mask, webkitMaskImage: mask });

      const tween = gsap.to(content, {
        "--tide": 1,
        ease: "none",
        // scrub: 1.5 → the tide eases toward the scroll position over ~1.5s instead of
        // tracking 1:1, so the reveal feels a touch slower and more graceful.
        scrollTrigger: { trigger: el, start, end, scrub: 1.5 },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: ref, dependencies: [reduced, start, end] },
  );

  return React.createElement(
    Tag,
    { ref, id, className },
    <span key="c" data-tide-content style={{ display: "block" }}>
      {children}
    </span>,
  );
}
