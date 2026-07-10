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
 *
 * Hardened for the Footer wordmark (its one live call site):
 * - default start is CLAMPED — the footer sits at the very document end, where an
 *   unclamped window can land past maxScroll and never fire (the TideSurge lesson);
 * - back.out(1.2), not 1.4 — the overshoot should be almost subliminal or the type
 *   reads as a text-plugin demo;
 * - text repair + revertOnUpdate so re-renders/locale flips never stack splits.
 */
export function FlipText({
  as: Tag = "div",
  className,
  children,
  start = "clamp(top 92%)",
}: FlipTextProps) {
  const ref = React.useRef<HTMLElement>(null);
  const reduced = useUI((s) => s.reducedMotion);
  const text = typeof children === "string" ? children : null;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      // Repair the text if a prior split was wiped by a React re-render.
      if (text !== null) el.textContent = text;
      if (reduced) return;

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
            ease: "back.out(1.2)",
            duration: 0.8,
            stagger: { each: 0.025, from: "start" },
            scrollTrigger: { trigger: el, start, once: true },
          });
        },
      });

      return () => split.revert();
    },
    { scope: ref, dependencies: [reduced, start, text], revertOnUpdate: true },
  );

  return React.createElement(Tag, { ref, className }, children);
}
