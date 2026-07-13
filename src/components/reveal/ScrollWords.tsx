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
 *
 * IMPORTANT — React.memo + text-in-deps: SplitText mutates the <p>'s DOM (word
 * spans), but React still owns that element's text in its VDOM. A plain re-render
 * (zustand `persist` rehydrating the locale, the preloader flipping `loaded`, any
 * parent re-render) would reconcile the <p> back to the raw string and silently
 * WIPE the split before you ever scroll to it — killing the effect. memo skips
 * those unrelated re-renders; when the copy genuinely changes (locale) we re-assert
 * the text and re-split. Children are always plain strings here.
 */
export const ScrollWords = React.memo(function ScrollWords({
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
  const text = typeof children === "string" ? children : null;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      // Re-assert the plain text before (re)splitting — repairs the element if a
      // React reconciliation wiped a prior split or a cleanup reverted stale copy.
      if (text !== null) el.textContent = text;
      if (reduced) return;

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
    // revertOnUpdate: on a locale change (text dep) revert the previous split +
    // ScrollTrigger BEFORE re-running — @gsap/react otherwise defers cleanup to
    // unmount, leaking triggers and letting a re-split capture stale copy.
    { scope: ref, dependencies: [reduced, start, end, dim, text], revertOnUpdate: true },
  );

  // SplitText aria:"auto" names this host; naming is prohibited on bare p/span/div
  // (axe aria-prohibited-attr) — group is the lightest role that permits it.
  const role = typeof Tag === "string" && /^(p|span|div)$/.test(Tag) ? "group" : undefined;
  return React.createElement(Tag, { ref, className, role }, children);
});

export default ScrollWords;
