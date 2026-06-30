"use client";

import * as React from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";

type WordGenerateProps = {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
  /** Blur-in (desktop only — paint cost). */
  blur?: boolean;
  start?: string;
  stagger?: number;
};

/**
 * WordGenerate — words materialize out of blur one-by-one as the heading enters
 * (Aceternity `text-generate-effect`, re-implemented on GSAP SplitText; once-on-enter
 * on the shared Lenis<->GSAP ScrollTrigger, no second loop). `autoSplit` re-splits
 * when the variable font loads; `aria:"auto"` keeps the original string for screen
 * readers. reduced-motion -> plain, fully visible text (gsap.from leaves the resting
 * state). Apply ONE per section, on a heading without another reveal.
 */
export function WordGenerate({
  as: Tag = "div",
  className,
  children,
  blur = true,
  start = "top 85%",
  stagger = 0.06,
}: WordGenerateProps) {
  const ref = React.useRef<HTMLElement>(null);
  const reduced = useUI((s) => s.reducedMotion);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced) return;
      const useBlur = blur && window.matchMedia("(min-width: 48rem)").matches;

      const split = SplitText.create(el, {
        type: "words",
        autoSplit: true,
        aria: "auto",
        onSplit(self) {
          return gsap.from(self.words, {
            autoAlpha: 0,
            ...(useBlur ? { filter: "blur(10px)" } : {}),
            duration: 0.5,
            ease: "power2.out",
            stagger,
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
