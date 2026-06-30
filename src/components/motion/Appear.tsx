"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";

type AppearProps = {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  /** Stagger the element's DIRECT children (rows/list). 0 = animate the element. */
  stagger?: number;
  /** Rise distance (px). */
  y?: number;
  /** Soft blur-in (desktop only, ≤8px — paint cost). */
  blur?: boolean;
  /** ScrollTrigger start. */
  start?: string;
};

/**
 * Appear — the high-end "scroll entry": a heavy fade-up (transform/opacity, with an
 * optional soft desktop blur) that fires once as the block enters, on the shared
 * Lenis<->GSAP ScrollTrigger. With `stagger`, the element's direct children rise in
 * sequence (organic rhythm). reduced-motion -> fully visible, no motion (gsap.from
 * leaves the resting state, so nothing is ever left hidden if it doesn't run).
 */
export function Appear({
  children,
  as: Tag = "div",
  className,
  stagger = 0,
  y = 28,
  blur = false,
  start = "top 85%",
}: AppearProps) {
  const ref = React.useRef<HTMLElement>(null);
  const reduced = useUI((s) => s.reducedMotion);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced) return;
      const useBlur = blur && window.matchMedia("(min-width: 48rem)").matches;
      const targets = stagger > 0 && el.children.length ? el.children : el;

      gsap.from(targets, {
        y,
        autoAlpha: 0,
        ...(useBlur ? { filter: "blur(8px)" } : {}),
        duration: 0.9,
        ease: "power3.out",
        ...(stagger > 0 ? { stagger } : {}),
        scrollTrigger: { trigger: el, start, once: true },
      });
    },
    { scope: ref, dependencies: [reduced, stagger, y, blur, start] },
  );

  return React.createElement(Tag, { ref, className }, children);
}
