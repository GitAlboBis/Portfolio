"use client";

import * as React from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { curtainPath } from "@/lib/curtain";

// Module-level: the Preloader owns the very first intro, so the route transition
// only plays on genuine client-side navigations (not the initial hard load).
let firstMount = true;

/**
 * RouteTransition — the per-route enter transition (Next App Router template.tsx
 * remounts this on every navigation). The SAME sunset curtain as the mobile menu
 * (shared `curtainPath`, CLAUDE.md §6): the new route mounts fully covered, then a
 * deep `night` panel lifts UPWARD with a wavy edge while a golden --gradient-sunset
 * wave rides just beneath it — one "tramonto → notte" language across nav + pages.
 * The page fades in under the lifting curtain.
 *
 * Only the path `d` morphs (GSAP-driven proxies, one short one-shot — never looped);
 * the <svg> is a fixed pointer-events-none sibling, so it never becomes a containing
 * block for the page's fixed Nav. reduced-motion → no curtain; the first hard load
 * is skipped (the Preloader owns it). Enter-only — no click interception.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const leadRef = React.useRef<SVGPathElement>(null);
  const nightRef = React.useRef<SVGPathElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      const lead = leadRef.current;
      const night = nightRef.current;
      if (!el || !lead || !night) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (firstMount) {
        firstMount = false;
        return;
      }
      const lenis = (window as unknown as {
        __lenis?: { scrollTo: (t: number | HTMLElement, o?: object) => void };
      }).__lenis;
      // Cross-page HASH navs (/#works, /#contact) must land ON the section:
      // a blind scrollTo(0) clobbered Next's hash handling under the cover.
      const hashTarget = window.location.hash
        ? document.querySelector<HTMLElement>(window.location.hash)
        : null;
      lenis?.scrollTo(hashTarget ?? 0, { immediate: true });

      // Start fully covered — night over the sunset wave — with the page hidden
      // beneath. useGSAP runs in a layout effect (pre-paint), so no flash.
      night.setAttribute("d", curtainPath(1, 4.2));
      lead.setAttribute("d", curtainPath(1, 1.7));
      gsap.set(el, { autoAlpha: 0 });

      const nightP = { v: 1 };
      const leadP = { v: 1 };

      gsap
        .timeline({
          onComplete: () => {
            lead.setAttribute("d", "M0 0H0Z");
            night.setAttribute("d", "M0 0H0Z");
            gsap.set(el, { clearProps: "opacity,visibility" });
            // refresh(true) — a bare refresh() is FORCED (bypasses the
            // live-scroll guard → sync whole-doc reflow mid-Lenis-glide).
            ScrollTrigger.refresh(true);
          },
        })
        // page fades in beneath the lifting curtain
        .to(el, { autoAlpha: 1, duration: 0.5, ease: "power2.out" }, 0.2)
        // night lifts first; the sunset wave trails a beat, so a golden edge rides
        // up just beneath the retreating night — the last light before it clears.
        .to(nightP, { v: 0, duration: 0.62, ease: "power3.inOut", onUpdate: () => night.setAttribute("d", curtainPath(nightP.v, 4.2)) }, 0)
        .to(leadP, { v: 0, duration: 0.66, ease: "power3.inOut", onUpdate: () => lead.setAttribute("d", curtainPath(leadP.v, 1.7)) }, 0.1);
    },
    { scope: ref },
  );

  return (
    <>
      <svg
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[80] h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="route-sunset" x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0%" stopColor="var(--color-amber)" />
            <stop offset="42%" stopColor="var(--color-coral)" />
            <stop offset="72%" stopColor="var(--color-ember)" />
            <stop offset="100%" stopColor="var(--color-rose)" />
          </linearGradient>
        </defs>
        <path ref={leadRef} d="M0 0H0Z" fill="url(#route-sunset)" />
        <path ref={nightRef} d="M0 0H0Z" fill="var(--color-night)" />
      </svg>
      {/* data-page-root: CoverOverlay toggles `inert` here while the exit
          curtain is up, so the covered (invisible) page can't be operated
          by keyboard/AT during the pending window. */}
      <div ref={ref} data-page-root>
        {children}
      </div>
    </>
  );
}
