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

      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      };
      const reset = () => {
        xTo(0);
        yTo(0);
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", reset);
      return () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", reset);
      };
    },
    { scope: ref, dependencies: [strength] },
  );

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: "inline-block", willChange: "transform" }}
    >
      {children}
    </span>
  );
}
