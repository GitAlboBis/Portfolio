"use client";

import * as React from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";

type RevealProps = {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
  /** Blur-in ("rising through murk"). Desktop only — dropped on mobile/reduced. */
  blur?: boolean;
  /** ScrollTrigger start. Default "top 80%". */
  start?: string;
  /** Stagger between lines. */
  stagger?: number;
};

/**
 * Reveal — masked split-text line reveal on scroll. Lines rise from below their
 * own mask with a tidal ease. `autoSplit` re-splits when the Fraunces variable
 * font finishes loading (no FOUT-broken split). Under reduced motion it renders
 * plain, fully visible text (gsap.from leaves the final state visible, so if the
 * animation never runs nothing is hidden).
 */
export function Reveal({
  as: Tag = "div",
  className,
  children,
  blur = false,
  start = "top 80%",
  stagger = 0.08,
}: RevealProps) {
  const ref = React.useRef<HTMLElement>(null);
  const reduced = useUI((s) => s.reducedMotion);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced) return;

      const useBlur = blur && window.matchMedia("(min-width: 48rem)").matches;

      const split = SplitText.create(el, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        aria: "auto",
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 110,
            autoAlpha: 0,
            ...(useBlur ? { filter: "blur(6px)" } : {}),
            duration: 1.0,
            stagger,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start, once: true },
          });
        },
      });

      return () => split.revert();
    },
    { scope: ref, dependencies: [reduced, blur, start, stagger] },
  );

  return React.createElement(Tag, { ref, className }, children);
}
