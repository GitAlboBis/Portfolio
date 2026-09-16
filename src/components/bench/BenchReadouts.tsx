"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { useDict } from "@/content/dict";
import { useHeroStore } from "@/webgl/store/heroStore";

/**
 * BenchReadouts — the instrument column of the test bench (REDESIGN-SPEC §E.5).
 *
 * A yellow REGION (`safety`) with ink, tabular lettering at a 24px line pitch:
 * `Particles · Solver · Render · Frame · DPR · Tier` on desktop (112px column
 * beside the box), three of them in a strip under the box on mobile.
 *
 * INSTRUMENT HONESTY (§B raise 1): every value is READ FROM THE ENGINE through
 * `heroStore` — `particles` is `sim.numParticles` after tiering, `frame` is the
 * measured 500ms moving average, `dpr` is the ratio actually applied to the
 * canvas backing store, `tier` is the same function that picked the particle
 * count. Nothing counts up, nothing is simulated: a value the engine has not
 * produced prints an em dash, and a bench with no renderer prints the reason
 * line instead (rendered by TestBench inside the box).
 *
 * MOTION (§E.5): the readouts refresh every 500ms with a 150ms opacity swap
 * (transitions.dev 04 text-states-swap re-expressed as a GSAP tween). The
 * cadence is driven from the SHARED `gsap.ticker` — never a second rAF, and
 * never a React re-render per frame: the ticker writes straight into the value
 * nodes, so the only re-render here is the rare status flip in TestBench.
 * Reduced motion → the text is swapped with no fade.
 */

/** the readout rows, in printed order */
const COLUMN_KEYS = ["particles", "solver", "render", "frame", "dpr", "tier"] as const;
/** the three that fit the mobile strip (the ones that move) */
const STRIP_KEYS = ["particles", "frame", "dpr"] as const;
type Key = (typeof COLUMN_KEYS)[number];

/** value the engine has not produced — never a placeholder number */
const DASH = "—";
/** readout cadence, ms — mirrors FRAME_WINDOW_MS in WaterBallHero */
const REFRESH_MS = 500;

export interface BenchReadoutsProps extends React.HTMLAttributes<HTMLDListElement> {
  /** `column` = 112px beside the box (desktop); `strip` = three readouts under it (mobile). */
  variant?: "column" | "strip";
}

export function BenchReadouts({ variant = "column", className, ...rest }: BenchReadoutsProps) {
  const t = useDict();
  const rootRef = React.useRef<HTMLDListElement>(null);
  const valueRefs = React.useRef<Partial<Record<Key, HTMLElement | null>>>({});
  /** what is currently printed, so an unchanged value never re-swaps */
  const printed = React.useRef<Partial<Record<Key, string>>>({});

  const keys: readonly Key[] = variant === "strip" ? STRIP_KEYS : COLUMN_KEYS;

  const labels: Record<Key, string> = {
    particles: t.bench.readouts.particles,
    solver: t.bench.readouts.solver,
    render: t.bench.readouts.render,
    frame: t.bench.readouts.frame,
    dpr: t.bench.readouts.dpr,
    tier: t.bench.readouts.tier,
  };

  // One sample of the instruments. Called on the ticker, not at render time.
  const sample = React.useCallback((): Record<Key, string> => {
    const s = useHeroStore.getState();
    return {
      // sim.numParticles after tiering (120,000 / 60,000) — grouped for reading
      particles: s.particles > 0 ? s.particles.toLocaleString("en-US") : DASH,
      solver: t.bench.values.solver,
      render: t.bench.values.render,
      // measured moving average; keeps its last real value when the context is lost
      frame: s.frameMs > 0 ? `${s.frameMs.toFixed(1)} ${t.bench.values.frameUnit}` : DASH,
      dpr: s.dpr > 0 ? s.dpr.toFixed(1) : DASH,
      tier: s.tier === "mobile" ? t.bench.tier.mobile : t.bench.tier.desktop,
    };
  }, [t]);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const write = (key: Key, next: string, immediate: boolean) => {
        const el = valueRefs.current[key];
        if (!el || printed.current[key] === next) return;
        printed.current[key] = next;
        if (immediate || reduced) {
          el.textContent = next;
          gsap.set(el, { opacity: 1 });
          return;
        }
        // 150ms text-state swap: out 75ms, print, in 75ms (opacity only)
        gsap.killTweensOf(el);
        gsap
          .timeline()
          .to(el, { opacity: 0, duration: DUR.swap / 2, ease: "none" })
          .add(() => {
            el.textContent = next;
          })
          .to(el, { opacity: 1, duration: DUR.swap / 2, ease: "none" });
      };

      const apply = (immediate: boolean) => {
        const s = sample();
        for (const key of keys) write(key, s[key], immediate);
      };
      apply(true);

      // cadence on the SHARED ticker (Lenis steps the same one) — no second rAF
      let acc = 0;
      const tick: gsap.TickerCallback = (_time, deltaTime) => {
        acc += deltaTime;
        if (acc < REFRESH_MS) return;
        acc = 0;
        apply(false);
      };
      gsap.ticker.add(tick);

      return () => {
        gsap.ticker.remove(tick);
        // listener-born tweens are outside this context: kill them by hand
        const els = keys.map((k) => valueRefs.current[k]).filter(Boolean) as HTMLElement[];
        if (els.length) {
          gsap.killTweensOf(els);
          gsap.set(els, { clearProps: "opacity" });
        }
      };
    },
    { scope: rootRef, dependencies: [variant, t] },
  );

  const isStrip = variant === "strip";

  return (
    <dl
      ref={rootRef}
      className={cn(
        "bg-safety text-ink",
        // the box already draws its own 1px ink frame — the readouts close the
        // remaining sides so the two never double a line
        isStrip
          ? "grid w-full grid-cols-3 border border-t-0 border-ink"
          : "flex w-[112px] min-w-[112px] flex-col border border-l-0 border-ink",
        className,
      )}
      {...rest}
    >
      {keys.map((key, i) => (
        <div
          key={key}
          className={cn(
            "px-3 py-2",
            isStrip ? (i > 0 ? "border-l border-rule-soft" : "") : i > 0 ? "rule-soft" : "",
          )}
        >
          <dt className="f-strip leading-[24px]">{labels[key]}</dt>
          <dd
            ref={(el) => {
              valueRefs.current[key] = el;
            }}
            className="f-cell leading-[24px] [font-variation-settings:'wdth'_87]"
          >
            {DASH}
          </dd>
        </div>
      ))}
    </dl>
  );
}
