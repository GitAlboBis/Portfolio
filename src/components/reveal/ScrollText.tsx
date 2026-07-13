"use client";

import * as React from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";

type ScrollTextProps = {
  as?: React.ElementType;
  id?: string;
  className?: string;
  children: React.ReactNode;
  /** Start of the scrub window (heading entering). */
  start?: string;
  /** End of the scrub window (reveal complete). Keep it short so the heading isn't
   *  left half-shown while reading. */
  end?: string;
  /** Stagger between lines, as a fraction of the scrub window. */
  stagger?: number;
};

/**
 * ScrollText — masked line reveal SCRUBBED to scroll position (the WP-7 companion
 * to Reveal's once-on-enter). Each line rises out of its own mask as the heading
 * passes through a short scroll window, and reverses on scroll-up — the reveal is
 * welded to the scroll, not fired once. SplitText runs client-side after hydration
 * (no SSR mismatch); `autoSplit` re-splits when the variable font loads; the tween
 * is scrubbed to the SHARED Lenis<->GSAP ticker (no second scroll loop). Under
 * prefers-reduced-motion it renders plain, fully-visible text. Apply ONE per
 * section, on a heading without another reveal — not everywhere.
 */
export const ScrollText = React.memo(function ScrollText({
  as: Tag = "div",
  id,
  className,
  children,
  start = "top 88%",
  end = "top 48%",
  stagger = 0.12,
}: ScrollTextProps) {
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

      const split = SplitText.create(el, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        aria: "auto",
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 115,
            autoAlpha: 0,
            ease: "none",
            stagger,
            scrollTrigger: { trigger: el, start, end, scrub: true },
          });
        },
      });

      return () => split.revert();
    },
    // revertOnUpdate: revert the prior split/ScrollTrigger + its ResizeObserver /
    // fonts listener before re-running on a locale change (else deferred to unmount).
    { scope: ref, dependencies: [reduced, start, end, stagger, text], revertOnUpdate: true },
  );

  // SplitText aria:"auto" names this host; naming is prohibited on bare p/span/div
  // (axe aria-prohibited-attr) — group is the lightest role that permits it.
  const role = typeof Tag === "string" && /^(p|span|div)$/.test(Tag) ? "group" : undefined;
  return React.createElement(Tag, { ref, id, className, role }, children);
});
