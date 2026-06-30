"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

export type ParallaxOpts = {
  /** translateY (px) when the element enters from the bottom of the viewport. */
  from?: number;
  /** translateY (px) when it exits the top. Defaults to the mirror of `from`. */
  to?: number;
  /** ScrollTrigger start (default spans the element's full pass-through). */
  start?: string;
  /** ScrollTrigger end. */
  end?: string;
};

/**
 * scroll-choreo — the WP-3 motion backbone (one helper, reused per section).
 *
 * useParallax returns a ref; the attached element is translated on Y from
 * `from`->`to` as it passes through the viewport, scrubbed to the SHARED
 * Lenis<->GSAP ticker (ScrollTrigger.update is already wired to lenis 'scroll' in
 * Smooth.tsx — never a second scroll loop). It animates transform ONLY (no layout
 * / paint), and is a no-op under prefers-reduced-motion. Give sibling layers
 * different `from/to` amplitudes to get multi-depth parallax (heading vs eyebrow
 * vs body move at different speeds). Cleaned up by useGSAP's context on unmount.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(opts: ParallaxOpts = {}) {
  const ref = useRef<T>(null);
  const { from = 48, to = -from, start = "top bottom", end = "bottom top" } = opts;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const tween = gsap.fromTo(
        el,
        { y: from },
        {
          y: to,
          ease: "none",
          force3D: true,
          scrollTrigger: { trigger: el, start, end, scrub: true },
        },
      );
      // Recompute once the variable fonts swap + tall content (gallery) settle,
      // so trigger positions are accurate without a second scroll loop.
      const refresh = () => ScrollTrigger.refresh();
      if (document.fonts?.ready) document.fonts.ready.then(refresh);

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: ref },
  );

  return ref;
}
