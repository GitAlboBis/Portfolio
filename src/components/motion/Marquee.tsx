"use client";

import * as React from "react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { useUI } from "@/store/ui";

type MarqueeProps = {
  items: string[];
  /** Accessible name for the band (bilingual — pass it from dict.ts). */
  label: string;
  className?: string;
  /** Base loop duration (s) at rest; scroll velocity speeds it up from here. */
  baseDuration?: number;
};

/**
 * Marquee — a seamless keyword ticker (Magic UI marquee, re-themed) whose speed is
 * coupled to Lenis scroll velocity: the existing shared gsap.ticker writes a single
 * `--marquee-duration` CSS var (smaller = faster), so the band quickens as you scroll
 * and eases back at rest — no second scroll loop. Duplicate tracks (the seamless-loop
 * illusion) are aria-hidden; only the first is read. Pauses on hover, edge-fade mask.
 * reduced-motion -> a static, non-scrolling keyword row (CSS `motion-reduce`).
 * Decorative band.
 */
export function Marquee({ items, label, className, baseDuration = 36 }: MarqueeProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduced = useUI((s) => s.reducedMotion);

  React.useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    let cur = baseDuration;
    const tick = () => {
      const lenis = (window as unknown as { __lenis?: { velocity?: number } }).__lenis;
      const v = Math.abs(lenis?.velocity ?? 0);
      const target = baseDuration / (1 + Math.min(v * 0.04, 3)); // cap ~4x faster
      cur = gsap.utils.interpolate(cur, target, 0.1);
      el.style.setProperty("--marquee-duration", `${cur}s`);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [reduced, baseDuration]);

  const Track = ({ hidden }: { hidden: boolean }) => (
    <div
      aria-hidden={hidden}
      className="flex shrink-0 items-center gap-[var(--marquee-gap,3rem)] pr-[var(--marquee-gap,3rem)] animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none"
    >
      {items.map((w, i) => (
        <span key={i} className="t-meta inline-flex items-center gap-[var(--marquee-gap,3rem)] whitespace-nowrap">
          {w}
          <span aria-hidden className="inline-block size-1 rounded-full bg-ember/80" />
        </span>
      ))}
    </div>
  );

  return (
    <div
      ref={ref}
      aria-label={label}
      className={cn(
        "group flex overflow-hidden py-4 select-none",
        "[--marquee-gap:3rem]",
        "[mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]",
        className,
      )}
    >
      <Track hidden={false} />
      <Track hidden />
      <Track hidden />
    </div>
  );
}
