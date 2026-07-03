"use client";

import * as React from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";

type DualWaveTextProps = {
  as?: React.ElementType;
  id?: string;
  className?: string;
  children: React.ReactNode;
  start?: string;
  /** Seconds the swell takes to settle. */
  duration?: number;
  /** Beat before the swell starts once triggered — absorbs the RouteTransition
   *  curtain (~0.76s) on client navigations so the wave isn't played covered. */
  delay?: number;
  /** Spatial frequency — radians of wave phase per character (crest tightness). */
  waveNumber?: number;
  /** Full wave cycles that travel through the line while it settles. */
  waveSpeed?: number;
};

/**
 * DualWaveText — the Codrops "Dual-Wave Text" mechanism (Valentin Descombes:
 * sine phase = waveNumber * index + waveSpeed * progress * 2π driving mirrored
 * columns of rows, targets smoothed through persistent quick-setters) re-imagined
 * as a ONE-SHOT entrance for a single display headline: each character rides the
 * sum of TWO counter-traveling sines (the "dual" — an incoming swell meeting its
 * backwash) whose envelope decays as the settle progress eases out, so the line
 * surfaces, undulates once and comes to rest like water finding level. Once-on-enter
 * on the shared Lenis<->GSAP ScrollTrigger (no second loop); per-char values go
 * through gsap.quickSetter — no per-frame tween allocation, the source's quickTo
 * trick. SSR / no-JS / reduced-motion render the plain, fully visible text (chars
 * are only hidden inside the client effect). transform/opacity only; `aria:"auto"`
 * keeps the original string for screen readers. Apply to ONE headline per page.
 */
export const DualWaveText = React.memo(function DualWaveText({
  as: Tag = "div",
  id,
  className,
  children,
  start = "top 85%",
  duration = 1.8,
  delay = 0.5,
  waveNumber = 0.55,
  waveSpeed = 1,
}: DualWaveTextProps) {
  const ref = React.useRef<HTMLElement>(null);
  const reduced = useUI((s) => s.reducedMotion);
  // Wait for the Preloader to wipe away on hard loads — the ScrollTrigger would
  // otherwise fire at hydration and play the whole swell under the opaque sheet.
  const loaded = useUI((s) => s.loaded);
  const text = typeof children === "string" ? children : null;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      // Repair the text if a React re-render wiped a prior split (see ScrollWords).
      if (text !== null) el.textContent = text;
      if (reduced) return;

      const split = SplitText.create(el, {
        type: "words,chars",
        autoSplit: true,
        aria: "auto",
        onSplit(self) {
          const chars = self.chars;
          const n = Math.max(chars.length, 1);
          const setY = chars.map(
            (c) => gsap.quickSetter(c, "yPercent") as (v: number) => void,
          );
          const setO = chars.map(
            (c) => gsap.quickSetter(c, "opacity") as (v: number) => void,
          );

          const TWO_PI = Math.PI * 2;
          const LIFT = 62; // resting swell offset (yPercent) at progress 0
          const AMP = 30; // wave amplitude (yPercent) at progress 0
          const FRONT = 0.4; // width of the traveling reveal front (fraction of the line)

          const state = { p: 0 };
          const apply = () => {
            const p = state.p;
            const env = Math.pow(Math.max(1 - p, 0), 1.4); // swell dies as the line settles
            for (let i = 0; i < n; i++) {
              const swell = Math.sin(
                waveNumber * i + waveSpeed * p * TWO_PI - Math.PI / 2,
              );
              const backwash = Math.sin(
                -1.8 * waveNumber * i + 0.6 * waveSpeed * p * TWO_PI + Math.PI / 3,
              );
              setY[i](env * (LIFT + AMP * (swell + 0.6 * backwash)));
              setO[i](gsap.utils.clamp(0, 1, (p * (1 + FRONT) - i / n) / FRONT));
            }
          };

          // Pre-`loaded` (under the Preloader sheet, which reveals top-down at its
          // exit) the chars hide immediately so the wipe uncovers an empty line, and
          // a trigger-less long-delay tween is the failsafe: if the preloader never
          // reports, the swell still plays after its 2.4s CSS failsafe wipe. The
          // `loaded` flip re-runs the effect (revertOnUpdate) into the real path.
          const tween = gsap.to(state, {
            p: 1,
            duration,
            ease: "power3.out",
            onUpdate: apply,
            ...(loaded
              ? { delay, scrollTrigger: { trigger: el, start, once: true } }
              : { delay: 3.2 }),
          });
          apply(); // seed positions now (and re-sync after an autoSplit rebuild)
          return tween;
        },
      });

      return () => split.revert();
    },
    // revertOnUpdate: revert the prior split/ScrollTrigger before re-running on a
    // locale change — @gsap/react otherwise defers cleanup to unmount (leak).
    {
      scope: ref,
      dependencies: [reduced, loaded, start, duration, delay, waveNumber, waveSpeed, text],
      revertOnUpdate: true,
    },
  );

  return React.createElement(Tag, { ref, id, className }, children);
});
