"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type MagneticProps = {
  children: React.ReactNode;
  className?: string;
  /** Pull as a fraction of the pointer's offset from the element centre. */
  strength?: number;
};

/**
 * Magnetic — the wrapped element eases toward the pointer while hovered
 * (gsap.quickTo) and snaps back on leave. Renders an inline-block span (so it can
 * wrap a button/link/anchor). pointer:fine only; a no-op under prefers-reduced-
 * motion (the element just stays put). transform-only.
 */
export function Magnetic({ children, className, strength = 0.35 }: MagneticProps) {
  const ref = React.useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (!window.matchMedia("(pointer: fine)").matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

      // Cache the box on enter/resize instead of measuring on every pointermove — the
      // element's rect only changes on layout, not per hover-move. Avoids a forced
      // layout read per event (×5 Magnetic wrappers in the nav).
      let box: DOMRect | null = null;
      const measure = () => {
        box = el.getBoundingClientRect();
      };
      const onEnter = () => {
        measure();
        el.style.willChange = "transform"; // promote only while hovered, not permanently
      };
      const onMove = (e: PointerEvent) => {
        if (!box) measure();
        xTo((e.clientX - (box!.left + box!.width / 2)) * strength);
        yTo((e.clientY - (box!.top + box!.height / 2)) * strength);
      };
      const reset = () => {
        xTo(0);
        yTo(0);
        el.style.willChange = "";
        box = null;
      };

      el.addEventListener("pointerenter", onEnter);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", reset);
      window.addEventListener("resize", measure);
      return () => {
        el.removeEventListener("pointerenter", onEnter);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", reset);
        window.removeEventListener("resize", measure);
      };
    },
    { scope: ref, dependencies: [strength] },
  );

  return (
    <span ref={ref} className={className} style={{ display: "inline-block" }}>
      {children}
    </span>
  );
}
