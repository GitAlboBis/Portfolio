"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { useDict } from "@/content/dict";
import { Stamp } from "@/components/sheet/Stamp";
import { BenchReadouts } from "@/components/bench/BenchReadouts";
import { CanvasHost } from "@/webgl/CanvasHost";
import { useHeroStore } from "@/webgl/store/heroStore";

/**
 * TestBench — the figure of the job order (REDESIGN-SPEC §E.5, engine §F).
 *
 * A printed figure, not a hero: the caption is ABOVE the frame, the fluid runs
 * INSIDE a ruled box (760×540 desktop / 350×230 mobile, `paper-field` ground,
 * 1px ink frame — `.bench-box` in globals.css), and the instrument readouts sit
 * beside it in the yellow region (a strip under the box on mobile).
 *
 * HARD RULES of the figure:
 *   • NO text over the fluid — every word lives in the caption, the readouts,
 *     or (only when there is no fluid) on the still surface itself;
 *   • NO transform on the canvas or its wrapper, ever;
 *   • the engine is mounted through CanvasHost, which resolves the gate after
 *     mount (no WebGPU / reduced motion → no engine) and unmounts — disposing
 *     the device — on a route change.
 *
 * STATUS (from heroStore, written by the engine):
 *   compiling → the box prints `bench.compiling`, readouts print em dashes;
 *   live      → LIVE stamps beside the caption at the first rendered frame,
 *               the box carries nothing but the fluid;
 *   still/lost→ the box becomes the labelled still: the word `bench.still` in
 *               ink over the `paper-field` ground with the printed reason
 *               (`bench.reasonNoGpu` / `bench.reasonReduced` / `bench.reasonLost`).
 *
 * Standalone by design: the home sheet mounts it inside its first viewport
 * (the cover of the order), and nothing else on the site carries an engine.
 */
export type TestBenchProps = React.HTMLAttributes<HTMLElement>;

export function TestBench({ className, ...rest }: TestBenchProps) {
  const t = useDict();
  // the ONLY reactive reads of the bench: status flips a handful of times per
  // mount (compiling → live, or → still). The numbers never re-render React.
  const status = useHeroStore((s) => s.status);
  const reason = useHeroStore((s) => s.reason);

  const reasonLine =
    reason === "nogpu"
      ? t.bench.reasonNoGpu
      : reason === "reduced"
        ? t.bench.reasonReduced
        : reason === "lost"
          ? t.bench.reasonLost
          : null;

  const isStill = status === "still" || status === "lost";

  return (
    <figure
      className={cn(
        // the figure is exactly as wide as the instrument it captions:
        // the box alone on mobile, box + 112px readout column on desktop
        "m-0 w-[var(--bench-w)] max-w-full md:w-[calc(var(--bench-w)+112px)]",
        className,
      )}
      {...rest}
    >
      {/* caption ABOVE the frame (§E.5) — never over the fluid */}
      <figcaption className="flex items-end justify-between gap-6 pb-3">
        <span className="block">
          <span className="f-caption block text-graphite">{t.bench.caption}</span>
          <span className="f-meta mt-1 block max-w-[68ch] text-ink">{t.bench.figure}</span>
        </span>
        {/* LIVE lands as a STAMP at the first rendered frame (§E.5 motion) */}
        {status === "live" ? (
          <Stamp label={t.bench.live} variant="live" active className="shrink-0" />
        ) : null}
      </figcaption>

      <div className="flex items-stretch">
        {/* box + (mobile) strip share the box width; the column sits beside them */}
        <div className="w-[var(--bench-w)] min-w-0 max-w-full">
          {/* `.bench-box` (globals.css) carries the width and the ratio:
              `aspect-ratio: var(--bench-ratio)` — 760/540 desktop, 350/230
              under 768px, both UNITLESS (a `760px / 540px` ratio is invalid and
              collapses the box). Nothing local overrides it. */}
          <div className="bench-box relative overflow-hidden">
            {/* the engine fills the box absolutely (WaterBallHero: `absolute inset-0`) */}
            <CanvasHost />

            {status === "compiling" ? (
              <p className="absolute inset-0 grid place-items-center px-6 text-center f-meta text-graphite">
                {t.bench.compiling}
              </p>
            ) : null}

            {isStill ? (
              <>
                {/* The captured frame of THIS engine (WP-7b): shot from the live
                    bench on the home sheet with Chrome WebGPU, cropped to the inside
                    of the ruled frame (the frame is drawn by `.bench-box`, so the
                    raster must not carry a second one), provenance embedded in
                    EXIF + public/bench/PROVENANCE.md. Plain <img>: a decorative,
                    fixed-size raster inside an aspect-ratio box — no CLS to
                    solve, nothing for the image optimiser to do.
                    alt="" on purpose: the caption above the frame and the STILL
                    label + reason line below already carry the meaning. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/bench/tank-still-1520.webp"
                  srcSet="/bench/tank-still-700.webp 700w, /bench/tank-still-1520.webp 1520w"
                  sizes="(max-width: 767px) 350px, 760px"
                  width={1520}
                  height={1079}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 grid place-content-center justify-items-center gap-2 px-6 text-center">
                  <span className="f-stamp text-ink">{t.bench.still}</span>
                  {/* the reason line was graphite while the ground was bare
                      paper-field (5.70:1). Over the captured amber body graphite
                      measures 2.50:1 — an AA failure the still would have
                      introduced — so on the still surface it prints in ink
                      (6.01:1 measured over the amber body). Same string, same
                      place, same size: only the ink is darker. */}
                  {reasonLine ? <span className="f-meta text-ink">{reasonLine}</span> : null}
                </div>
              </>
            ) : null}
          </div>

          {/* mobile: yellow strip of three readouts under the box */}
          <BenchReadouts variant="strip" className="md:hidden" />
        </div>

        {/* desktop: 112px yellow column beside the box */}
        <BenchReadouts variant="column" className="hidden md:flex" />
      </div>
    </figure>
  );
}
