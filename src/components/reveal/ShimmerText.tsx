"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";

type ShimmerTextProps = {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  /** Resting text colour. */
  base?: string;
  /** The travelling highlight colour. */
  sheen?: string;
  /** ScrollTrigger start. */
  start?: string;
};

/**
 * ShimmerText — a single warm sheen sweeps across the glyphs ONCE as the text
 * enters (the Magic UI text-shimmer technique re-themed to tokens; deliberately
 * NOT a perpetual loop, per the motion rule). A mostly-`base` gradient with a
 * bright `sheen` band is clipped to the text and its position is tweened once on
 * the shared ScrollTrigger.
 *
 * SSR/no-JS/reduced-motion safe: the clip + transparent fill are applied only by
 * the effect, so without JS (or under reduced motion) the text renders in its
 * normal inherited colour. Apply sparingly — one shimmer per view.
 */
export function ShimmerText({
  children,
  as: Tag = "span",
  className,
  base = "var(--color-ink)",
  sheen = "var(--color-ember)",
  start = "top 85%",
}: ShimmerTextProps) {
  const ref = React.useRef<HTMLElement>(null);
  const reduced = useUI((s) => s.reducedMotion);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced) return;

      // 300%-wide gradient (base everywhere but a thin sheen band) ALWAYS covers the
      // 100% text for any position in [0%,100%] — only the sheen transits across, so
      // the glyphs are never left unpainted (the bug a narrower size + no-repeat hit).
      gsap.set(el, {
        backgroundImage: `linear-gradient(110deg, ${base} 45%, ${sheen} 50%, ${base} 55%)`,
        backgroundSize: "300% 100%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "0% 0",
      });
      el.style.setProperty("-webkit-background-clip", "text");
      el.style.setProperty("background-clip", "text");
      el.style.setProperty("-webkit-text-fill-color", "transparent");
      el.style.setProperty("color", "transparent");

      gsap.to(el, {
        backgroundPosition: "100% 0",
        duration: 1.4,
        ease: "power2.inOut",
        scrollTrigger: { trigger: el, start, once: true },
        onComplete: () => {
          // rest as solid `base` — bulletproof against any clip edge case.
          el.style.removeProperty("background-image");
          el.style.setProperty("-webkit-background-clip", "border-box");
          el.style.setProperty("background-clip", "border-box");
          el.style.setProperty("-webkit-text-fill-color", base);
          el.style.setProperty("color", base);
        },
      });
    },
    { scope: ref, dependencies: [reduced, base, sheen, start] },
  );

  return React.createElement(Tag, { ref, className }, children);
}
