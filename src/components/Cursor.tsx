"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Cursor — a refined custom pointer: a tight dot that tracks precisely + a ring
 * that trails it, both ember (legible on the warm paper, the night band, and the
 * hero). It hides the native cursor (a body class) only when active, and the ring
 * swells over interactive elements. Mounted once in the layout.
 *
 * Gated to pointer:fine + prefers-reduced-motion:no-preference — touch and
 * reduced-motion users keep the native cursor untouched (the component bails out
 * and never adds the hide-class). Restores the native cursor on unmount.
 * Decorative (aria-hidden).
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.classList.add("has-custom-cursor");
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, autoAlpha: 0 });

    const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.34, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.34, ease: "power3.out" });

    let shown = false;
    const onMove = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.to([dot, ring], { autoAlpha: 1, duration: 0.25, overwrite: true });
      }
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };
    const onOver = (e: PointerEvent) => {
      const interactive = (e.target as Element)?.closest?.(
        "a,button,[role='button'],input,textarea,select,label,[data-cursor='hover']",
      );
      gsap.to(ring, { scale: interactive ? 1.85 : 1, duration: 0.28, ease: "power3.out" });
      gsap.to(dot, { scale: interactive ? 0.4 : 1, duration: 0.28, ease: "power3.out" });
    };
    const hide = () => {
      shown = false;
      gsap.to([dot, ring], { autoAlpha: 0, duration: 0.2, overwrite: true });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("blur", hide);
    document.addEventListener("pointerleave", hide);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("blur", hide);
      document.removeEventListener("pointerleave", hide);
      gsap.killTweensOf([dot, ring]);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} aria-hidden className="cursor-ring" />
      <div ref={dotRef} aria-hidden className="cursor-dot" />
    </>
  );
}
