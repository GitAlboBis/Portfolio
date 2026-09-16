"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, STAGGER } from "@/lib/motion";

/**
 * useRowStagger — the row half of the RULE-IN verb (REDESIGN-SPEC §C.7.1) for
 * the sheet's tables.
 *
 * `RuleIn` draws the rule above a block and fades its body in; it cannot reach
 * the rows of a `<table>` (they are never its direct children), so the four
 * ruled tables of the sheet — Work performed, Findings, Parts catalogue,
 * Measured — stagger their own `<tbody>` rows here: opacity only, 180ms, 40ms
 * apart, one ScrollTrigger, `once: true`, start `top 85%`. No translation: the
 * type is already printed, the rule reveals it.
 *
 * Reduced motion → nothing runs and nothing is set: the rows are readable from
 * the first paint (the check is at effect time, so SSR and hydration match).
 */
export function useRowStagger(
  scope: React.RefObject<HTMLElement | null>,
  /** re-arm when the rendered rows change (locale flip, row count) */
  dependencies: unknown[] = [],
): void {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const rows = gsap.utils.toArray<HTMLElement>("tbody > tr", root);
      if (!rows.length) return;

      gsap.set(rows, { opacity: 0 });
      const tween = gsap.to(rows, {
        opacity: 1,
        duration: DUR.text,
        ease: "none",
        stagger: STAGGER.rows,
        scrollTrigger: { trigger: root, start: "top 85%", once: true },
        onComplete: () => gsap.set(rows, { clearProps: "opacity" }),
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        gsap.set(rows, { clearProps: "opacity" });
      };
    },
    { scope, dependencies },
  );
}
