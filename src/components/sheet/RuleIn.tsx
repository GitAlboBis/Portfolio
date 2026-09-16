"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/cn";

/**
 * RuleIn — the RULE-IN verb (REDESIGN-SPEC §C.7.1) as a generic wrapper.
 *
 * Every new field or row is DRAWN before it is read: the top rule scales
 * `scaleX 0→1` from the left in 320ms `rule`; the content appears 90ms later,
 * `opacity 0→1` in 180ms with no translation (the type is already printed —
 * the rule reveals it). `rows` staggers the direct children marked
 * `[data-row]` by 40ms. One ScrollTrigger, `once: true`, start `top 85%`,
 * never re-run.
 *
 * Reduced motion → static: the rule is drawn and the content is visible from
 * the first paint (matchMedia read at effect time; nothing branches at
 * render, so SSR and hydration trees match). The rule is a real 1px element
 * (not a border) so it can scale; callers that already own a top border pass
 * `rule={false}`.
 */
export interface RuleInProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Draw the top rule (default true). */
  rule?: boolean;
  /** Stagger direct children marked `data-row` by 40ms. */
  rows?: boolean;
  /** Extra delay (s) before the rule starts — for sibling fields on one line. */
  delay?: number;
  /** Rule colour class (default `bg-ink`). */
  ruleClassName?: string;
}

export function RuleIn({
  rule = true,
  rows = false,
  delay = 0,
  ruleClassName,
  className,
  children,
  ...rest
}: RuleInProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const ruleRef = React.useRef<HTMLSpanElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const line = ruleRef.current;
      const body = bodyRef.current;
      if (!root || !body) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const rowEls = rows
        ? Array.from(body.querySelectorAll<HTMLElement>(":scope > [data-row]"))
        : [];
      const textTargets = rowEls.length ? rowEls : [body];

      // Initial states: drawn by the effect (layout-effect timing under
      // useGSAP), so the SSR markup is complete and nothing flashes.
      if (line) gsap.set(line, { scaleX: 0, transformOrigin: "0% 50%" });
      gsap.set(textTargets, { opacity: 0 });

      const tl = gsap.timeline({
        delay,
        scrollTrigger: { trigger: root, start: "top 85%", once: true },
      });
      if (line) tl.to(line, { scaleX: 1, duration: DUR.rule, ease: EASE.rule }, 0);
      tl.to(
        textTargets,
        {
          opacity: 1,
          duration: DUR.text,
          ease: "none",
          stagger: rowEls.length ? STAGGER.rows : 0,
        },
        0.09,
      );
      // Hard guarantee: whatever happens to the trigger (resize, refresh
      // races) the type is readable once the timeline has played.
      tl.eventCallback("onComplete", () => {
        gsap.set([line, ...textTargets].filter(Boolean), { clearProps: "opacity,transform" });
      });
    },
    { scope: rootRef, dependencies: [rows, delay] },
  );

  return (
    <div ref={rootRef} className={cn("relative", className)} {...rest}>
      {rule ? (
        <span
          ref={ruleRef}
          aria-hidden
          className={cn("pointer-events-none absolute inset-x-0 top-0 h-px", ruleClassName ?? "bg-ink")}
        />
      ) : null}
      <div ref={bodyRef} className="contents">
        {children}
      </div>
    </div>
  );
}
