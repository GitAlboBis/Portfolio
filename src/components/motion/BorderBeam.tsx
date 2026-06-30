"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type BorderBeamProps = {
  /** Comet size (px). */
  size?: number;
  /** Border ring thickness (px). */
  width?: number;
  /** Sweep duration (s). */
  duration?: number;
  /** Gradient head + mid colours (CSS). */
  from?: string;
  via?: string;
};

/**
 * BorderBeam — a single warm comet sweeps the CTA's rounded border once on hover
 * (Magic UI border-beam re-themed to tokens; the framer-motion infinite loop becomes
 * a one-shot GSAP `offsetDistance` tween, per our motion rule). The comet rides the
 * border via CSS `offset-path: rect(...)` and is clipped to a thin ring by the
 * standard padding + mask-composite border trick.
 *
 * Drop as the FIRST child of a `relative overflow-hidden rounded-*` CTA. pointer:fine
 * + motion-allowed only (gsap.matchMedia); a no-op otherwise. Decorative (aria-hidden).
 */
export function BorderBeam({
  size = 64,
  width = 1.5,
  duration = 0.9,
  from = "var(--color-ember)",
  via = "var(--color-amber)",
}: BorderBeamProps) {
  const ringRef = React.useRef<HTMLSpanElement>(null);
  const blobRef = React.useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const ring = ringRef.current;
      const blob = blobRef.current;
      if (!ring || !blob) return;
      const cta = ring.parentElement;
      if (!cta) return;

      const mm = gsap.matchMedia();
      mm.add("(hover: hover) and (prefers-reduced-motion: no-preference)", () => {
        const sweep = () =>
          gsap.fromTo(
            blob,
            { offsetDistance: "0%", autoAlpha: 1 },
            {
              offsetDistance: "100%",
              duration,
              ease: "power2.inOut",
              overwrite: true,
              onComplete: () => gsap.set(blob, { autoAlpha: 0 }),
            },
          );
        cta.addEventListener("mouseenter", sweep);
        return () => cta.removeEventListener("mouseenter", sweep);
      });
    },
    { scope: ringRef },
  );

  return (
    <span
      ref={ringRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={{
        padding: width,
        // standard gradient-border mask: content-box layer XOR full layer = the ring band
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        maskComposite: "exclude",
      }}
    >
      <span
        ref={blobRef}
        className="absolute aspect-square opacity-0"
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          background: `linear-gradient(to left, ${from}, ${via}, transparent)`,
        }}
      />
    </span>
  );
}
