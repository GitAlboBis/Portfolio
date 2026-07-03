"use client";

import * as React from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";

type TideSurgeProps = {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
  /** Scrub window — the surge completes by the time the line reaches `end`.
   *  clamp()-wrapped by default: Contact sits at the very end of the document,
   *  so an unclamped end can lie beyond maxScroll on tall viewports and the
   *  scrub would freeze mid-surge forever. clamp() folds the window into the
   *  scrollable range (progress hits 1 at page bottom, whatever the viewport). */
  start?: string;
  end?: string;
};

/**
 * TideSurge — the Codrops "On-Scroll Typography" FX2 mechanism (chars rise from
 * below, vertically stretched, and settle: yPercent 120 → 0, scaleY ~2 → 1 from a
 * top origin, back-eased, SCRUBBED) re-themed to the tide: each character is a
 * column of water that surges up and finds its level as you scroll — welded to the
 * scroll (reverses on scroll-up) with a soft lag (`scrub: 1.2`), the same braking
 * feel as TideReveal. For ONE signature display line; big type only.
 *
 * SSR / no-JS / reduced-motion render the plain, fully visible text (chars are
 * only transformed inside the client effect). transform/opacity only; `aria:"auto"`
 * keeps the original string for screen readers.
 */
export function TideSurge({
  as: Tag = "div",
  className,
  children,
  start = "clamp(top 88%)",
  end = "clamp(top 40%)",
}: TideSurgeProps) {
  const ref = React.useRef<HTMLElement>(null);
  const reduced = useUI((s) => s.reducedMotion);
  const text = typeof children === "string" ? children : null;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      // Repair the text if a React re-render (locale flip) wiped a prior split.
      if (text !== null) el.textContent = text;
      if (reduced) return;

      // No autoSplit: it only hooks font-load/resize re-splits for "lines" type;
      // with words/chars it is inert. No will-change either — a scrubbed trigger
      // never "completes", so the hint would pin every char's compositor layer
      // for the whole session.
      const split = SplitText.create(el, {
        type: "words,chars",
        aria: "auto",
        onSplit(self) {
          return gsap.fromTo(
            self.chars,
            {
              opacity: 0,
              yPercent: 120,
              scaleY: 2.1,
              scaleX: 0.75,
              transformOrigin: "50% 0%",
            },
            {
              duration: 1,
              ease: "back.inOut(1.7)",
              opacity: 1,
              yPercent: 0,
              scaleY: 1,
              scaleX: 1,
              stagger: 0.03,
              scrollTrigger: { trigger: el, start, end, scrub: 1.2 },
            },
          );
        },
      });

      return () => split.revert();
    },
    // revertOnUpdate: revert the prior split/ScrollTrigger before re-running on a
    // locale change — @gsap/react otherwise defers cleanup to unmount (leak).
    { scope: ref, dependencies: [reduced, start, end, text], revertOnUpdate: true },
  );

  return React.createElement(Tag, { ref, className }, children);
}
