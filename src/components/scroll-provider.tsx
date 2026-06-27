"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis, destroyLenis } from "@/lib/lenis-singleton";
import { useScrollStore } from "@/webgl/store/scrollStore";

/*
  The single scroll engine for the whole app. Revives the (previously dormant)
  Lenis singleton WITHOUT R3F: Lenis is advanced by GSAP's ticker so smooth-scroll
  and every ScrollTrigger share ONE rAF, the canonical Lenis + GSAP recipe.

    lenis.on("scroll", ScrollTrigger.update)   // keep triggers in sync
    gsap.ticker.add(t => lenis.raf(t * 1000))  // one clock (s -> ms)
    gsap.ticker.lagSmoothing(0)                // never clamp on tab refocus

  It also republishes lenis.progress/velocity into scrollStore (the site-nav and
  future scenes read it). On prefers-reduced-motion we skip Lenis entirely and let
  native scroll drive ScrollTrigger, so the page is still fully navigable.
*/
export function ScrollProvider() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = getLenis();
    if (!lenis) return;

    const onScroll = () => {
      ScrollTrigger.update();
      useScrollStore.getState().set({
        progress: lenis.progress ?? 0,
        velocity: lenis.velocity ?? 0,
      });
    };
    lenis.on("scroll", onScroll);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // ScrollTrigger measures positions on the next tick; refresh once the layout
    // (fonts, sticky sections) has settled so beat start/end points are correct.
    const refresh = () => ScrollTrigger.refresh();
    const id = window.setTimeout(refresh, 300);
    window.addEventListener("load", refresh);

    return () => {
      window.clearTimeout(id);
      window.removeEventListener("load", refresh);
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(raf);
      destroyLenis();
    };
  }, []);

  return null;
}
