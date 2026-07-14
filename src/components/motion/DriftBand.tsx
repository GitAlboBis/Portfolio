"use client";

import * as React from "react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { VELOCITY_GAIN } from "@/lib/motion";

/*
  DriftBand — kinetic type seam (decorative, aria-hidden).

  Two full-bleed rows of display-scale text drifting in OPPOSITE directions;
  scroll velocity boosts the tempo and scroll direction steers both rows, so
  the band feels physically dragged by the page. Mechanism from 21st.dev
  "Scroll Velocity Text (opposing rows)", rewritten from motion/react onto the
  ONE shared gsap.ticker reading Lenis velocity (same pattern as Marquee.tsx —
  never a second scroll loop). Seamless wrap = modulo on the first copy's
  width; transform-only writes on exactly two tracks.

  Gates: IntersectionObserver (ticks only on screen), document.hidden, and
  prefers-reduced-motion (no ticker at all → a static editorial type band,
  first copies left-aligned). The whole band is aria-hidden: both lines echo
  copy that already exists for AT elsewhere (works h2 / hero tagline).
*/

const COPIES = 5;

const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

type DriftRow = {
  text: string;
  /** Base drift direction: 1 = leftward track motion, -1 = rightward. */
  dir: 1 | -1;
  /** Visual voice: ink ghost fill or ember stroke outline. */
  variant: "ink" | "stroke";
};

export function DriftBand({ rows, className }: { rows: DriftRow[]; className?: string }) {
  const root = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = root.current;
    if (!el) return;

    type RowState = { track: HTMLElement; unit: number; pos: number; base: number; cur: number };
    const state: RowState[] = Array.from(el.querySelectorAll<HTMLElement>("[data-drift-track]")).map(
      (track) => {
        const base = Number(track.dataset.dir) || 1;
        return { track, unit: 0, pos: 0, base, cur: base };
      },
    );
    if (!state.length) return;

    const measure = () =>
      state.forEach((r) => {
        r.unit = (r.track.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
      });
    measure();
    const ro = new ResizeObserver(measure);
    state.forEach((r) => ro.observe(r.track));

    let inView = false;
    const io = new IntersectionObserver(([e]) => (inView = e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);

    const SPEED = 80; // px/s at rest — a slow, tidal drift
    const tick = (_time: number, deltaMs: number) => {
      if (!inView || document.hidden) return;
      const lenis = (window as unknown as { __lenis?: { velocity?: number } }).__lenis;
      const v = (lenis?.velocity ?? 0) * VELOCITY_GAIN;
      const boost = Math.min(Math.abs(v) * 0.045, 4); // up to ~5× under a hard flick
      // Scroll direction steers the band (dead zone so rest keeps the base drift).
      const sign = v > 0.5 ? 1 : v < -0.5 ? -1 : 0;
      const dt = deltaMs / 1000;
      for (const r of state) {
        if (sign) r.cur = r.base * sign;
        if (r.unit <= 0) continue;
        r.pos += r.cur * SPEED * (1 + boost) * dt;
        r.track.style.transform = `translate3d(${-wrap(0, r.unit, r.pos)}px,0,0)`;
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div ref={root} aria-hidden className={cn("relative flex flex-col gap-2", className)}>
      {rows.map((row, i) => (
        <div key={i} className="overflow-hidden whitespace-nowrap">
          <div data-drift-track data-dir={row.dir} className="flex w-max items-center will-change-transform">
            {Array.from({ length: COPIES }).map((_, c) => (
              <span
                key={c}
                className={cn(
                  "drift-line inline-flex shrink-0 items-center",
                  row.variant === "stroke" ? "drift-line--stroke" : "drift-line--ink",
                )}
              >
                {row.text}
                <span className="mx-[0.55em] inline-block size-[0.13em] rounded-full bg-ember/50" />
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
