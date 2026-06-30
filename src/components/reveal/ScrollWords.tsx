"use client";

import * as React from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";

/**
 * ScrollWords — a "read-along" reveal: body copy brightens word-by-word, welded to
 * scroll. The per-word opacity stagger comes from Aceternity's Text Generate effect
 * (CLAUDE.md §6); instead of firing once on mount it is SCRUBBED to a short scroll
 * window via ScrollTrigger — the same scroll-welded approach as our ScrollText (which
 * does it per line for headings). Words sit dim (`dim`) until the reading line passes
 * through them, then settle to full — so the paragraph "lights up" as you read it.
 *
 * Opacity only (no per-word blur): on a long paragraph dozens of simultaneously
 * blurred spans would jank — opacity is compositor-cheap and reads identically. The
 * accessible string is preserved (SplitText `aria:"auto"`), `autoSplit` re-measures
 * when the variable font loads. prefers-reduced-motion → plain, fully-visible text.
 */
export function ScrollWords({
  as: Tag = "p",
  className,
  children,
  start = "top 82%",
  end = "top 42%",
  dim = 0.16,
}: {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
  start?: string;
  end?: string;
  /** resting opacity of not-yet-read words */
  dim?: number;
}) {
  const ref = React.useRef<HTMLElement>(null);
  const reduced = useUI((s) => s.reducedMotion);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced) return;

      const split = SplitText.create(el, {
        type: "words",
        aria: "auto",
        autoSplit: true,
        onSplit(self) {
          return gsap.fromTo(
            self.words,
            { opacity: dim },
            {
              opacity: 1,
              ease: "none",
              duration: 0.6,
              stagger: 0.32, // overlap → a few words resolve at once (natural reading)
              scrollTrigger: { trigger: el, start, end, scrub: true },
            },
          );
        },
      });

      return () => split.revert();
    },
    { scope: ref, dependencies: [reduced, start, end, dim] },
  );

  return React.createElement(Tag, { ref, className }, children);
}

export default ScrollWords;
