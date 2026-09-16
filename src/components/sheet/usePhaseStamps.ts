"use client";

import * as React from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useUI } from "@/store/ui";
import { useHydrated } from "@/lib/use-hydrated";
import type { PhaseId } from "@/content/dict";
import { PHASES, isSheetRoute, phaseAnchor, phaseIndex, routePhase, STAMP_START } from "@/lib/phases";

export type StampState = Record<PhaseId, boolean>;

const none = (): StampState => ({
  intake: false,
  diagnosis: false,
  estimate: false,
  work: false,
  test: false,
  release: false,
});
const all = (): StampState => ({
  intake: true,
  diagnosis: true,
  estimate: true,
  work: true,
  test: true,
  release: true,
});

export interface PhaseStamps {
  /** Which cells carry a stamp. Accumulates; never un-stamps. */
  stamped: StampState;
  /** The current step (`aria-current="step"`): the furthest stamped phase. */
  current: PhaseId | null;
  /** The `n` of "n / 6" — 0 until the first stamp. */
  count: number;
  /** True once the triggers are armed (after hydration). */
  armed: boolean;
}

/**
 * usePhaseStamps — the signature interaction (REDESIGN-SPEC §E.3).
 *
 * One `ScrollTrigger` per `#phase-<id>` region found in the page, `once: true`,
 * start `top 60%`: when the region enters, its phase is stamped and stays
 * stamped — the band accumulates like a real job card; the counter follows the
 * furthest stamp. Armed AFTER hydration (the regions belong to the page below
 * the band; sticky × ScrollTrigger wants the layout settled) and re-armed on
 * every route change. A locale flip re-flows the sheet, so positions are
 * refreshed, debounced 160ms.
 *
 * Sub-routes carry their phase pre-stamped (WORK on /work*, INTAKE on /about)
 * and still stamp any `#phase-*` region they happen to contain.
 *
 * Reduced motion: all six stamped at load; the counter follows a native scroll
 * listener (no impacts, no tweens) — the position is still information.
 */
export function usePhaseStamps(pathname: string): PhaseStamps {
  const hydrated = useHydrated();
  const locale = useUI((s) => s.locale);
  const [stamped, setStamped] = React.useState<StampState>(none);
  const [current, setCurrent] = React.useState<PhaseId | null>(null);
  const [armed, setArmed] = React.useState(false);

  // Reset on route change (the route phase is applied below, after hydration).
  React.useEffect(() => {
    setStamped(none());
    setCurrent(null);
    setArmed(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!hydrated) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pre = routePhase(pathname);

    const regions = PHASES.map((id) => ({ id, el: document.getElementById(phaseAnchor(id)) })).filter(
      (r): r is { id: PhaseId; el: HTMLElement } => !!r.el,
    );

    const stamp = (id: PhaseId) => {
      setStamped((s) => (s[id] ? s : { ...s, [id]: true }));
      setCurrent((c) => (c === null || phaseIndex(id) > phaseIndex(c) ? id : c));
    };

    if (reduced) {
      // §C.7 RM: every stamp already impressed; the counter reads position.
      setStamped(all());
      const compute = () => {
        const line = window.innerHeight * 0.6;
        let last: PhaseId | null = pre;
        for (const r of regions) {
          if (r.el.getBoundingClientRect().top <= line) last = r.id;
        }
        setCurrent(last);
      };
      compute();
      window.addEventListener("scroll", compute, { passive: true });
      window.addEventListener("resize", compute);
      setArmed(true);
      return () => {
        window.removeEventListener("scroll", compute);
        window.removeEventListener("resize", compute);
      };
    }

    if (pre) stamp(pre);

    const ctx = gsap.context(() => {
      for (const r of regions) {
        ScrollTrigger.create({
          trigger: r.el,
          start: STAMP_START,
          once: true,
          onEnter: () => stamp(r.id),
        });
      }
    });
    setArmed(true);

    // Fonts settle the sheet's heights after first paint: measure again once.
    let alive = true;
    document.fonts?.ready?.then(() => alive && ScrollTrigger.refresh());

    return () => {
      alive = false;
      ctx.revert();
    };
  }, [hydrated, pathname]);

  // Locale flip → the copy re-flows → positions move. Debounced 160ms.
  React.useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 160);
    return () => window.clearTimeout(t);
  }, [locale, hydrated]);

  // Before the effects run (SSR, hydration pass) a sub-route already reads its
  // pre-stamped phase, so the counter never flashes "0 / 6" on /work or /about.
  const resolved = current ?? (isSheetRoute(pathname) ? null : routePhase(pathname));
  const count = resolved ? phaseIndex(resolved) + 1 : 0;

  return { stamped, current: resolved, count, armed };
}
