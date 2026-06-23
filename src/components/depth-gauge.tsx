"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/components/language-provider";
import { useScrollStore } from "@/webgl/store/scrollStore";

const MAX_DEPTH = 40;

export function DepthGauge() {
  const { t } = useLanguage();
  const markerRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const marker = markerRef.current;
    const readout = readoutRef.current;
    if (!marker || !readout) return;

    const render = (progress: number) => {
      const clamped = progress < 0 ? 0 : progress > 1 ? 1 : progress;
      const depth = Math.round(clamped * MAX_DEPTH);
      marker.style.transform = `translate(-50%, -50%) translateY(${clamped * 40}vh)`;
      readout.textContent = `${depth} m`;
    };

    render(useScrollStore.getState().progress);
    const unsub = useScrollStore.subscribe((s) => render(s.progress));
    return () => unsub();
  }, []);

  return (
    <aside
      aria-hidden="true"
      className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 select-none md:flex sm:right-6"
    >
      <div className="flex flex-col items-center gap-3">
        <span className="font-mono text-[0.5rem] uppercase tracking-[0.32em] text-ink-mute/70">
          {t.gauge.surface}
        </span>

        <div className="relative h-[40vh] w-px bg-rule">
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-aqua/30"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 translate-y-1/2 rotate-45 bg-rule"
          />

          <div
            ref={markerRef}
            className="absolute left-1/2 top-0 flex items-center"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            <span className="h-1.5 w-1.5 rotate-45 bg-aqua shadow-[0_0_8px_rgba(31,200,200,0.7)]" />
            <span
              ref={readoutRef}
              className="absolute right-full mr-3 whitespace-nowrap font-mono text-[0.625rem] tracking-[0.2em] text-aqua"
            >
              0 m
            </span>
          </div>
        </div>

        <span className="font-mono text-[0.5rem] uppercase tracking-[0.32em] text-ink-mute/70">
          {t.gauge.seabed}
        </span>
      </div>
    </aside>
  );
}
