"use client";

import * as React from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

// Module-level: the Preloader owns the very first intro, so the route transition
// only plays on genuine client-side navigations (not the initial hard load).
let firstMount = true;

/**
 * RouteTransition — the per-route enter animation (Next App Router template.tsx
 * remounts this on every navigation). A Golden Hour clip-wipe: the new page reveals
 * bottom-up via clip-path + a soft fade (the same wipe family as MenuOverlay), then
 * clears its props. clip-path + opacity ONLY — no transform — so the page's fixed
 * Nav keeps its viewport anchoring during the reveal. reduced-motion → no tween.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (firstMount) {
        firstMount = false;
        return;
      }
      const lenis = (window as unknown as { __lenis?: { scrollTo: (t: number, o?: object) => void } }).__lenis;
      lenis?.scrollTo(0, { immediate: true });

      gsap.fromTo(
        el,
        { autoAlpha: 0, clipPath: "inset(0 0 12% 0)" },
        {
          autoAlpha: 1,
          clipPath: "inset(0 0 0% 0)",
          duration: 0.6,
          ease: "power3.out",
          onComplete: () => {
            gsap.set(el, { clearProps: "clipPath,opacity,visibility" });
            ScrollTrigger.refresh();
          },
        },
      );
    },
    { scope: ref },
  );

  return <div ref={ref}>{children}</div>;
}
