"use client";

import { type ReactNode } from "react";
import { useParallax, type ParallaxOpts } from "@/lib/scroll-choreo";

type ParallaxProps = ParallaxOpts & {
  children: ReactNode;
  className?: string;
};

/**
 * Parallax — JSX layer wrapper over useParallax. Wrap a section element to give it
 * a scroll-driven depth drift; vary `from` across sibling layers for multi-depth
 * parallax. Renders a plain <div> (className passes through, so it can take grid
 * placement classes like `col-meta`). Decorative motion only — content is
 * unaffected and reduced-motion disables it.
 */
export function Parallax({ children, className, ...opts }: ParallaxProps) {
  const ref = useParallax<HTMLDivElement>(opts);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
