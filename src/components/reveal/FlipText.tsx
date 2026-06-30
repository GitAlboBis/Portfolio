"use client";

import * as React from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";

type FlipTextProps = {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
  start?: string;
};

/**
 * FlipText — chars hinge up into the reading plane (rotationX -90->0 + a small rise)
 * as the heading enters, plank by plank (Codrops "3D RotationX Flip" FX6, re-built on
 * GSAP SplitText; once-on-enter). Per-WORD perspective (.flip-word in globals.css)
 * keeps the vanishing point local so long headlines don't smear. transformOrigin
 * '50% 100%' = type standing up off the page. reduced-motion -> plain visible text.
 */
export function FlipText({ as: Tag = "div", className, children, start = "top 82%" }: FlipTextProps) {
  const ref = React.useRef<HTMLElement>(null);
  const reduced = useUI((s) => s.reducedMotion);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced) return;

      const split = SplitText.create(el, {
        type: "words,chars",
        wordsClass: "flip-word",
        aria: "auto",
        onSplit(self) {
          return gsap.from(self.chars, {
            rotationX: -90,
            yPercent: 50,
            autoAlpha: 0,
            transformOrigin: "50% 100%",
            ease: "back.out(1.4)",
            duration: 0.8,
            stagger: { each: 0.025, from: "start" },
            scrollTrigger: { trigger: el, start, once: true },
          });
        },
      });

      return () => split.revert();
    },
    { scope: ref, dependencies: [reduced, start] },
  );

  return React.createElement(Tag, { ref, className }, children);
}
