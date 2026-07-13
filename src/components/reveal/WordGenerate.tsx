"use client";

import * as React from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { DUR, EASE, STAGGER } from "@/lib/motion";
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
export const WordGenerate = React.memo(function WordGenerate({
  as: Tag = "div",
  className,
  children,
  blur = true,
  start = "top 85%",
  stagger = STAGGER.words,
}: WordGenerateProps) {
  const ref = React.useRef<HTMLElement>(null);
  const reduced = useUI((s) => s.reducedMotion);
  const text = typeof children === "string" ? children : null;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      // Repair the text if a React re-render wiped a prior split (see ScrollWords).
      if (text !== null) el.textContent = text;
      if (reduced) return;
      const useBlur = blur && window.matchMedia("(min-width: 48rem)").matches;

      const split = SplitText.create(el, {
        type: "words",
        autoSplit: true,
        aria: "auto",
        onSplit(self) {
          return gsap.from(self.words, {
            autoAlpha: 0,
            ...(useBlur ? { filter: "blur(10px)" } : {}),
            duration: DUR.swell,
            ease: EASE.tide,
            stagger,
            scrollTrigger: { trigger: el, start, once: true },
          });
        },
      });

      return () => split.revert();
    },
    // revertOnUpdate: revert the prior split/ScrollTrigger before re-running on a
    // locale change — @gsap/react otherwise defers cleanup to unmount (leak).
    { scope: ref, dependencies: [reduced, blur, start, stagger, text], revertOnUpdate: true },
  );

  // SplitText aria:"auto" names this host; naming is prohibited on bare p/span/div
  // (axe aria-prohibited-attr) — group is the lightest role that permits it.
  const role = typeof Tag === "string" && /^(p|span|div)$/.test(Tag) ? "group" : undefined;
  return React.createElement(Tag, { ref, className, role }, children);
});
