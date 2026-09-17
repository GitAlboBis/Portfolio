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
 * produced prints an em dash, and the `state` row prints the instrument's own
 * condition in words — Compiling pipelines… / Settling / Running, or the reason
 * line of a bench that has no renderer (§E.5).
 *
 * MOTION (§E.5): the readouts refresh every 500ms with a 150ms text-state swap
 * (transitions.dev 04) driven from the SHARED `gsap.ticker` — never a second
 * rAF, and never a React re-render per frame: the ticker writes straight into
 * the value nodes, so the only re-render here is the rare status flip in
 * TestBench. Reduced motion → the text is swapped with no wipe.
 *
 * THE SWAP IS A WIPE, NOT A FADE (finish review F6). A 150ms opacity fade put
 * the one number that proves the bench is alive below 0.85 opacity for about a
 * fifth of every refresh, bottoming out near 1.26:1 over the safety yellow — a
 * legibility defect no partial-opacity value can avoid, and the source of the
 * Lighthouse accessibility score oscillating 100 / 97. The verb changed, the
 * duration did not: the value is clipped away left-to-right in 75ms, the text
 * is printed, and it is clipped back in from the right in 75ms. The glyphs are
 * never translucent, so every sampled state measures the full 11.53:1.
 */

/** the readout rows, in printed order — `state` last: it is the instrument's
    own condition, and it is where the degraded-state reason line is printed
    (§E.5 puts the reason in the readouts; finish review F10 took it off the
    still, where its ground — a variable amber image — was unverifiable). */
const COLUMN_KEYS = ["particles", "solver", "render", "frame", "dpr", "tier", "state"] as const;
/** the three that fit the mobile strip (the ones that move), plus the state row
    that spans it — the reason line must have a ground on mobile too */
const STRIP_KEYS = ["particles", "frame", "dpr", "state"] as const;
type Key = (typeof COLUMN_KEYS)[number];

/** value the engine has not produced — never a placeholder number */
const DASH = "—";
/** readout cadence, ms — mirrors FRAME_WINDOW_MS in WaterBallHero */
const REFRESH_MS = 500;
/* The wipe is driven by two custom properties, never by tweening the `clip-path`
   shorthand: the browser normalises `inset(-12% 0% -12% 0%)` to the two-value
   `inset(-12% 0%)`, and GSAP then interpolates that against a four-value end
   state positionally — which made the BOTTOM edge travel and shaved descenders
   mid-tween. Tweening the numbers themselves cannot mis-align. The vertical
   −12% keeps the clip edges off the glyphs at all times. */
const WIPE_CLIP = "inset(-12% var(--wr, 0%) -12% var(--wl, 0%))";

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
    state: t.bench.readouts.state,
  };

  /** the printed condition of the instrument — never a number, never a guess */
  const stateValue = (s: ReturnType<typeof useHeroStore.getState>): string => {
    if (s.reason === "nogpu") return t.bench.reasonNoGpu;
    if (s.reason === "reduced") return t.bench.reasonReduced;
    if (s.reason === "lost") return t.bench.reasonLost;
    if (s.status === "compiling") return t.bench.compiling;
    if (s.status === "warming") return t.bench.settling;
    if (s.status === "live") return t.bench.running;
    return DASH;
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
      state: stateValue(s),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          gsap.set(el, { "--wl": "0%", "--wr": "0%" });
          return;
        }
        // 150ms text-state swap as a WIPE: out 75ms, print, in 75ms. Percentage
        // insets only (a px/% mix cannot be interpolated), and the vertical edges
        // stay outside the box so no ascender or descender is ever shaved.
        gsap.killTweensOf(el);
        gsap
          .timeline()
          .to(el, { "--wl": "100%", duration: DUR.swap / 2, ease: "none" })
          .add(() => {
            el.textContent = next;
            gsap.set(el, { "--wl": "0%", "--wr": "100%" });
          })
          .to(el, { "--wr": "0%", duration: DUR.swap / 2, ease: "none" });
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
          gsap.set(els, { clearProps: "--wl,--wr,opacity" });
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
        // ONE wrapper per readout: a `div` directly inside the `dl` is legal and
        // groups its dt/dd, a SECOND nested div is not (axe dlitem / definition-list).
        <div
          key={key}
          className={cn(
            "px-3 py-2",
            // the state row spans the mobile strip and prints label and value on
            // one line: a reason line has no business squeezed into a third of
            // 350px, and a stacked pair would cost the first viewport 25px
            isStrip
              ? key === "state"
                ? "col-span-3 flex items-baseline gap-2 border-t border-rule-soft"
                : i > 0
                  ? "border-l border-rule-soft"
                  : ""
              : i > 0
                ? "rule-soft"
                : "",
          )}
        >
          <dt className="f-strip leading-[24px]">{labels[key]}</dt>
          <dd
            ref={(el) => {
              valueRefs.current[key] = el;
            }}
            className="f-cell leading-[24px] [font-variation-settings:'wdth'_87]"
            style={{ clipPath: WIPE_CLIP }}
          >
            {DASH}
          </dd>
        </div>
      ))}
    </dl>
  );
}
