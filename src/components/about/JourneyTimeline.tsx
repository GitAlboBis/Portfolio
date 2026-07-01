"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";
import { DrawLine } from "@/components/reveal/DrawLine";

export type JourneyEntry = {
  period: string;
  /** headline — education: degree; experience: org. */
  primary: string;
  /** sub — education: org; experience: role. */
  secondary: string;
};

/**
 * JourneyTimeline — the editorial timeline for /about's Education & Experience.
 * A single self-drawing ember rail (DrawLine, §6) runs down the reading column;
 * each entry carries a node that IGNITES (scale + opacity, fired once) as it
 * enters, and its copy rises with it. The list stays a plain <ul> for screen
 * readers + keyboard; the rail and nodes are aria-hidden decoration.
 * reduced-motion → rail fully drawn, nodes lit, no scroll motion.
 */
export function JourneyTimeline({ items }: { items: JourneyEntry[] }) {
  const ref = React.useRef<HTMLUListElement>(null);
  const reduced = useUI((s) => s.reducedMotion);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || reduced) return;

      // Copy rises once as each row enters (matches the page's Appear rhythm).
      gsap.utils.toArray<HTMLElement>(".tl-row", root).forEach((row) => {
        gsap.from(row, {
          y: 16,
          autoAlpha: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: row, start: "top 85%", once: true },
        });
      });

      // Nodes ignite (transform/opacity only — compositor-cheap).
      gsap.utils.toArray<HTMLElement>(".tl-node", root).forEach((node) => {
        gsap.fromTo(
          node,
          { scale: 0.35, autoAlpha: 0.25 },
          {
            scale: 1,
            autoAlpha: 1,
            duration: 0.55,
            ease: "back.out(2.2)",
            scrollTrigger: { trigger: node, start: "top 82%", once: true },
          },
        );
      });
    },
    // revertOnUpdate: on a reduced-motion flip, revert the prior per-row/per-node
    // ScrollTriggers before re-running (else @gsap/react defers cleanup to unmount).
    { scope: ref, dependencies: [reduced, items.length], revertOnUpdate: true },
  );

  return (
    <ul ref={ref} className="col-read relative">
      {/* Self-drawing ember rail down its own gutter, inset far enough that the
          first node clears the oversized col-meta heading's text overflow.
          `h-full` (not inset-y) because an <svg> is a replaced element — top/
          bottom won't stretch it. */}
      <DrawLine className="pointer-events-none absolute left-[29px] top-0 h-full w-[2px] sm:left-[37px]" />
      {items.map((e, i) => (
        <li key={i} className="relative py-6 pl-10 sm:pl-14">
          <span
            aria-hidden="true"
            className="tl-node absolute left-6 top-7 h-[11px] w-[11px] rounded-full sm:left-8"
            style={{
              background: "var(--color-ember)",
              boxShadow: "0 0 0 4px color-mix(in oklab, var(--color-ember) 16%, transparent)",
            }}
          />
          <div className="tl-row flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <span>
              <span className="block font-display text-2xl font-semibold text-ink">
                {e.primary}
              </span>
              <span className="t-body t-body--mute">{e.secondary}</span>
            </span>
            {e.period ? <span className="t-meta shrink-0">{e.period}</span> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default JourneyTimeline;
