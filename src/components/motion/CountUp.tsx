"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE } from "@/lib/motion";
import { useUI } from "@/store/ui";

type CountUpProps = {
  /** The final metric string — numeric core with optional affixes ("<1s", "96", "<5min"). */
  value: string;
  as?: React.ElementType;
  className?: string;
  start?: string;
};

/**
 * CountUp — a metric that counts to its value as it enters (once, on the shared
 * ScrollTrigger). The numeric core is parsed out and tweened; affixes ("<", "s",
 * "min") stay put. A target of 0 counts DOWN from 24 — zero is the achievement
 * (e.g. "0 known auth vulns"), so it should be arrived at, not stated.
 * SSR/no-JS/reduced-motion: the final value is in the HTML the whole time.
 */
export function CountUp({ value, as: Tag = "p", className, start = "top 85%" }: CountUpProps) {
  const ref = React.useRef<HTMLElement>(null);
  const reduced = useUI((s) => s.reducedMotion);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      el.textContent = value; // repair after any re-render (see ScrollWords)
      if (reduced) return;

      const m = value.match(/^([^0-9]*)(\d+)(.*)$/);
      if (!m) return; // non-numeric metric — leave it static
      const [, prefix, num, suffix] = m;
      const target = parseInt(num, 10);
      const from = target === 0 ? 24 : 0;

      const obj = { v: from };
      const render = () => {
        el.textContent = `${prefix}${Math.round(obj.v)}${suffix}`;
      };
      render();
      const tween = gsap.to(obj, {
        v: target,
        duration: DUR.tide,
        ease: EASE.tide,
        onUpdate: render,
        scrollTrigger: { trigger: el, start, once: true },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: ref, dependencies: [reduced, value, start], revertOnUpdate: true },
  );

  return React.createElement(Tag, { ref, className }, value);
}
