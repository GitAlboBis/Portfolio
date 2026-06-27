"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getLenis } from "@/lib/lenis-singleton";
import { useLanguage } from "@/components/language-provider";
import { useScrollStore, SECTION_BOUNDS } from "@/webgl/store/scrollStore";

/*
  DepthGauge — a dive-computer ruler pinned to the right edge of the descent.

  A slim calibrated instrument that reads the global scroll progress and renders
  the journey from 'Surface' (top) to 'Seabed' (bottom): a hairline track, a
  travelling indicator, a live depth readout in metres, and section tick marks
  that brighten as you pass them and smooth-scroll (Lenis) to their section when
  clicked. NatGeo dive-instrument restraint — celeste hairlines on near-invisible
  glass, never neon.

  Behaviour:
  - Hidden under `lg` (small screens / where the mobile menu lives).
  - Revealed only AFTER the hero unpins (progress past the hero band), fading in
    so it never competes with the hero mark.
  - The indicator + readout are written to the DOM imperatively from a single
    rAF, driven by the scrollStore — the component does NOT re-render per frame.
  - prefers-reduced-motion: no rAF travel and no CSS transitions; the gauge
    snapshots the current depth on each (native) scroll event — a static,
    fully-navigable instrument.
  - Decorative hairlines/readout are aria-hidden; the section ticks are real,
    keyboard-focusable navigation controls with accessible names.
*/

/** Calibrated full-scale depth at the Seabed (decorative, dive-computer feel). */
const MAX_DEPTH_M = 1200;

/** Section ticks, top→bottom. `at` is the normalized scroll where the section
    begins (start of its band); `id` is the DOM id the tick scrolls to. */
const TICKS: ReadonlyArray<{ id: string; at: number; key: TickKey }> = [
  { id: "about", at: SECTION_BOUNDS.intro[0], key: "about" },
  { id: "work", at: SECTION_BOUNDS.work[0], key: "work" },
  { id: "skills", at: SECTION_BOUNDS.skills[0], key: "skills" },
  { id: "contact", at: SECTION_BOUNDS.contact[0], key: "contact" },
];

type TickKey = "about" | "work" | "skills" | "contact";

/** Progress past which the hero has unpinned and the gauge may appear. */
const REVEAL_AT = SECTION_BOUNDS.hero[1];

/** Fixed-nav offset so a tick lands its section clear of the top bar. */
function navOffset(): number {
  if (typeof window === "undefined") return 0;
  const px = getComputedStyle(document.documentElement).getPropertyValue(
    "--nav-h",
  );
  const n = parseFloat(px);
  // --nav-h is in rem; convert to px (fallback 80).
  return Number.isFinite(n) ? n * 16 : 80;
}

export function DepthGauge() {
  const { t } = useLanguage();
  const reduce = usePrefersReducedMotion();

  // Whether the gauge is mounted-visible (hero has unpinned at least once).
  const [revealed, setRevealed] = useState(false);

  // Imperative DOM targets — written from rAF, never trigger React renders.
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const readoutRef = useRef<HTMLSpanElement | null>(null);
  const tickElsRef = useRef<Array<HTMLButtonElement | null>>([]);

  // Smoothed progress the indicator chases (gives the needle a touch of mass).
  const shownRef = useRef(0);

  // Paint the gauge from a given progress value (0..1).
  const paint = useCallback(
    (p: number) => {
      const pct = Math.min(100, Math.max(0, p * 100));

      if (indicatorRef.current) {
        indicatorRef.current.style.transform = `translateY(${pct}cqh)`;
      }
      if (fillRef.current) {
        fillRef.current.style.height = `${pct}%`;
      }
      if (readoutRef.current) {
        const depth = Math.round(p * MAX_DEPTH_M);
        readoutRef.current.textContent = String(depth);
      }
      // Brighten ticks we have passed.
      for (let i = 0; i < TICKS.length; i++) {
        const el = tickElsRef.current[i];
        if (!el) continue;
        const passed = p >= TICKS[i].at - 0.001;
        el.dataset.passed = passed ? "true" : "false";
      }
    },
    [],
  );

  // Drive paint. Reduced-motion: snapshot on native scroll (no rAF, no easing).
  // Otherwise: a single rAF eases shownRef toward the store's progress and
  // reveals the gauge once the hero has unpinned.
  useEffect(() => {
    // Reveal latch (works in both modes): subscribe to progress crossing.
    const checkReveal = (p: number) => {
      if (p >= REVEAL_AT) setRevealed((r) => (r ? r : true));
    };
    checkReveal(useScrollStore.getState().progress);

    if (reduce) {
      const onScroll = () => {
        const p = useScrollStore.getState().progress;
        checkReveal(p);
        shownRef.current = p;
        paint(p);
      };
      // scrollStore is only published by Lenis (skipped under reduced-motion in
      // ScrollProvider), so derive progress straight from the document here.
      const onNative = () => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        const p = max > 0 ? doc.scrollTop / max : 0;
        useScrollStore.getState().set({ progress: p });
        onScroll();
      };
      onNative();
      window.addEventListener("scroll", onNative, { passive: true });
      window.addEventListener("resize", onNative, { passive: true });
      return () => {
        window.removeEventListener("scroll", onNative);
        window.removeEventListener("resize", onNative);
      };
    }

    let raf = 0;
    const tick = () => {
      const target = useScrollStore.getState().progress;
      checkReveal(target);
      // Critically-damped-ish chase: fast enough to feel pinned to scroll,
      // soft enough to read as a weighted needle.
      shownRef.current += (target - shownRef.current) * 0.18;
      if (Math.abs(target - shownRef.current) < 0.0002) {
        shownRef.current = target;
      }
      paint(shownRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, paint]);

  const goTo = useCallback((domId: string) => {
    const el = document.getElementById(domId);
    if (!el) return;
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(el, { offset: -navOffset() });
    } else {
      // Reduced-motion / no-Lenis fallback: native anchored scroll.
      const y =
        el.getBoundingClientRect().top + window.scrollY - navOffset();
      window.scrollTo({ top: y, behavior: "auto" });
    }
  }, []);

  return (
    <div
      className={[
        "pointer-events-none fixed right-0 top-0 z-40 hidden h-dvh select-none",
        "items-center pr-5 lg:flex xl:pr-7",
        "transition-opacity duration-700 ease-out motion-reduce:transition-none",
        revealed ? "opacity-100" : "opacity-0",
      ].join(" ")}
      aria-hidden={!revealed}
    >
      <div className="relative flex h-[58vh] max-h-[560px] min-h-[360px] flex-col items-center">
        {/* Surface label */}
        <span
          aria-hidden
          className="label mb-3 text-[0.6rem] tracking-[0.3em] text-mist/70"
        >
          {t.gauge.surface}
        </span>

        {/* The ruler: container query context so the indicator can travel in
            `cqh` (% of the track height) regardless of the track's pixel size. */}
        <div
          className="relative w-9 flex-1 [container-type:size]"
          aria-hidden
        >
          {/* Glass spine */}
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-foam/15" />

          {/* Travelled fill (Surface→needle), faint celeste */}
          <div
            ref={fillRef}
            className="absolute left-1/2 top-0 w-px -translate-x-1/2 bg-celeste/45"
            style={{ height: "0%" }}
          />

          {/* Calibration hairlines: minor ticks every 10% */}
          {Array.from({ length: 11 }).map((_, i) => (
            <span
              key={i}
              className="absolute left-1/2 h-px w-2 -translate-x-1/2 bg-foam/15"
              style={{ top: `${i * 10}%` }}
            />
          ))}

          {/* Section ticks — the only interactive controls */}
          {TICKS.map((tick, i) => (
            <button
              key={tick.id}
              ref={(el) => {
                tickElsRef.current[i] = el;
              }}
              type="button"
              onClick={() => goTo(tick.id)}
              aria-label={`${t.gauge.depthLabel}: ${t.nav[tick.key]}`}
              data-passed="false"
              className={[
                "group pointer-events-auto absolute left-1/2 flex h-6 -translate-x-1/2 -translate-y-1/2 items-center",
                "cursor-pointer focus-visible:outline-none",
              ].join(" ")}
              style={{ top: `${tick.at * 100}%` }}
            >
              {/* Major tick mark — brightens once passed; ring on focus/hover */}
              <span
                aria-hidden
                className={[
                  "block h-px w-4 origin-left bg-foam/30 transition-[width,background-color,box-shadow] duration-300 ease-out",
                  "group-hover:w-6 group-hover:bg-celeste group-focus-visible:w-6 group-focus-visible:bg-celeste",
                  "group-data-[passed=true]:bg-celeste/80 motion-reduce:transition-none",
                ].join(" ")}
              />
              {/* Section name — fades in on hover/focus only (kept quiet) */}
              <span className="label pointer-events-none ml-2 whitespace-nowrap text-[0.55rem] tracking-[0.22em] text-celeste opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
                {t.nav[tick.key]}
              </span>
            </button>
          ))}

          {/* The travelling indicator (needle). translateY in cqh = % of track. */}
          <div
            ref={indicatorRef}
            className="absolute left-1/2 top-0 -translate-x-1/2 will-change-transform"
            style={{ transform: "translateY(0cqh)" }}
          >
            <span className="block h-px w-7 -translate-y-1/2 bg-celeste shadow-[0_0_6px_rgba(155,211,238,0.6)]" />
          </div>
        </div>

        {/* Seabed label */}
        <span
          aria-hidden
          className="label mt-3 text-[0.6rem] tracking-[0.3em] text-mist/70"
        >
          {t.gauge.seabed}
        </span>

        {/* Live depth readout — decorative instrument figure. */}
        <div aria-hidden className="mt-2 flex items-baseline gap-1 text-foam">
          <span
            ref={readoutRef}
            className="tabular text-sm font-medium leading-none"
          >
            0
          </span>
          <span className="label text-[0.55rem] tracking-[0.2em] text-mist/70">
            {t.gauge.unit}
          </span>
        </div>
      </div>
    </div>
  );
}

/** SSR-safe prefers-reduced-motion hook. */
function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduce;
}
