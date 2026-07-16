"use client";

import * as React from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";

type FlipTextProps = {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
  start?: string;
  /** Window event that sends a one-shot wave through the chars (ecosystem
      hook — e.g. "tide-touch": the sea reaches the footer, the name ripples
      like it's standing in the water). Decorative; never runs under reduced. */
  rippleOn?: string;
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
  rippleOn,
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

      // Ecosystem ripple — a wave travels through the letters: each char dips,
      // lifts, and settles elastically, staggered left→right. `y` (px), never
      // yPercent: the entrance owns yPercent, so the two compose instead of
      // fighting. The tween is born in an event listener (async, outside the
      // context) → killed manually in cleanup (the async-tween lesson).
      let ripple: gsap.core.Tween | null = null;
      const onRipple = () => {
        ripple?.kill();
        ripple = gsap.to(split.chars, {
          keyframes: [
            { y: 5, duration: 0.16, ease: "power2.in" },
            { y: -9, duration: 0.24, ease: "power2.out" },
            { y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" },
          ],
          stagger: { each: 0.03, from: "start" },
        });
      };
      if (rippleOn) window.addEventListener(rippleOn, onRipple);

      return () => {
        if (rippleOn) window.removeEventListener(rippleOn, onRipple);
        ripple?.kill();
        split.revert();
      };
    },
    { scope: ref, dependencies: [reduced, start, text, rippleOn], revertOnUpdate: true },
  );

  // SplitText aria:"auto" names this host; naming is prohibited on bare p/span/div
  // (axe aria-prohibited-attr) — group is the lightest role that permits it.
  const role = typeof Tag === "string" && /^(p|span|div)$/.test(Tag) ? "group" : undefined;
  return React.createElement(Tag, { ref, className, role }, children);
}
