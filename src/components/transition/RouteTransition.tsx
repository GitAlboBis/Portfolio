"use client";

import * as React from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

// Module-level: the Preloader owns the very first intro, so the route transition
// only plays on genuine client-side navigations (not the initial hard load).
let firstMount = true;

/**
 * RouteTransition — the per-route enter transition (Next App Router template.tsx
 * remounts this on every navigation). A Golden Hour SUNSET CURTAIN: a fixed
 * --gradient-sunset panel is covering when the new route mounts, then retracts
 * UPWARD (origin top, scaleY 1→0) like a rising sun while the new page fades in
 * beneath it. transform/opacity only; the panel is a fixed sibling so it never
 * creates a containing block for the page's fixed Nav. reduced-motion → no curtain;
 * first hard load → skipped (the Preloader owns it).
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const curtainRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      const curtain = curtainRef.current;
      if (!el || !curtain) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (firstMount) {
        firstMount = false;
        return;
      }
      const lenis = (window as unknown as { __lenis?: { scrollTo: (t: number, o?: object) => void } }).__lenis;
      lenis?.scrollTo(0, { immediate: true });

      gsap.set(curtain, { scaleY: 1, transformOrigin: "50% 0%", autoAlpha: 1 });
      gsap.set(el, { autoAlpha: 0 });

      gsap
        .timeline({
          onComplete: () => {
            gsap.set(curtain, { autoAlpha: 0, scaleY: 0 });
            gsap.set(el, { clearProps: "opacity,visibility" });
            ScrollTrigger.refresh();
          },
        })
        .to(el, { autoAlpha: 1, duration: 0.5, ease: "power2.out" }, 0.18)
        .to(curtain, { scaleY: 0, duration: 0.7, ease: "power3.inOut" }, 0);
    },
    { scope: ref },
  );

  return (
    <>
      <div
        ref={curtainRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[80]"
        style={{ background: "var(--gradient-sunset)", transform: "scaleY(0)", opacity: 0 }}
      />
      <div ref={ref}>{children}</div>
    </>
  );
}
