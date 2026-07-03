"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useUI } from "@/store/ui";

/**
 * Smooth — the single scroll backbone. Side-effect only (renders null), mounted
 * once in the root layout.
 *
 * Lenis drives gsap.ticker (one rAF loop for the whole site); the SAME Lenis
 * instance/velocity feeds the R3F Works gallery — never a second smooth-scroll
 * loop (would fight). Under prefers-reduced-motion we DON'T jack scroll: native
 * scroll stays, ScrollTrigger still works, and we record the preference in the
 * store so every animated component can branch.
 */
export function Smooth() {
  const setReducedMotion = useUI((s) => s.setReducedMotion);
  const locale = useUI((s) => s.locale);

  // Keep the document language in sync with the runtime EN/IT toggle: the SSR shell
  // ships lang="en", so without this a screen reader would announce the Italian copy
  // with an English voice (WCAG 3.1.1/3.1.2). Bilingual site, single URL → sync here.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);

    let lenis: Lenis | null = null;
    let tick: ((t: number) => void) | null = null;

    if (!mq.matches) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
      lenis.on("scroll", ScrollTrigger.update);
      tick = (t: number) => lenis?.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      // Expose for the gallery (reads lenis.scroll / lenis.velocity in useFrame).
      (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    }

    return () => {
      mq.removeEventListener("change", apply);
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, [setReducedMotion]);

  return null;
}
