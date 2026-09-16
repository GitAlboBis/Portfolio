"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useUI } from "@/store/ui";

/**
 * Smooth — the single scroll backbone. Side-effect only (renders null), mounted
 * once in the root layout.
 *
 * Lenis drives gsap.ticker (one rAF loop for the whole site; `lerp .1`, the
 * §C.7 contract) and is exposed as `window.__lenis` for `scrollTo` consumers
 * (the phase band, the visual gate). Never a second smooth-scroll loop.
 *
 * Three document-level syncs live here and nowhere else:
 *   - `<html lang>` follows the EN/IT toggle (the SSR shell ships "en").
 *   - `<html data-motion="reduced">` mirrors prefers-reduced-motion so CSS
 *     (`:root[data-motion="reduced"]`) and components key on ONE attribute that
 *     arrives after hydration (no render-time branch, no mismatch).
 *   - the store's `reducedMotion` flag, for effect-time reads.
 * Under reduced motion we don't jack scroll: native scroll stays, ScrollTrigger
 * still works.
 */
export function Smooth() {
  const setReducedMotion = useUI((s) => s.setReducedMotion);
  const locale = useUI((s) => s.locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setReducedMotion(mq.matches);
      if (mq.matches) root.setAttribute("data-motion", "reduced");
      else root.removeAttribute("data-motion");
    };
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
      (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    }

    return () => {
      mq.removeEventListener("change", apply);
      root.removeAttribute("data-motion");
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, [setReducedMotion]);

  return null;
}
