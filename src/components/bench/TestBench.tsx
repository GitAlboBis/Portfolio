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
 *   compiling → the box holds the captured still of this engine; the `state`
 *               readout prints `bench.compiling`;
 *   warming   → the engine IS running and every readout is already a real
 *               measurement, but a cold start churns for about four seconds
 *               before the confined field reads as a letter (finish review F2),
 *               so the box keeps holding the captured still and the `state`
 *               readout prints `bench.settling`. Nothing claims to be live yet:
 *               the LIVE stamp has not landed;
 *   live      → the still cross-fades out over 320ms, LIVE stamps beside the
 *               caption, and the box carries nothing but the fluid;
 *   still/lost→ the box becomes the labelled still: only the word `bench.still`
 *               on a ruled `paper-field` plate (a known ground — the reason line
 *               moved into the yellow readout column, where §E.5 puts it and
 *               where its contrast is verifiable, finish review F10).
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

  const isStill = status === "still" || status === "lost";
  /* The box holds the captured frame until the live one is worth showing: while
     the pipelines build, while the sample settles, and forever in the degraded
     states. `covered` drives the cross-fade; the node is kept mounted for one
     more beat after `live` so the fade actually plays. */
  const covered = isStill || status === "compiling" || status === "warming";
  const [mountStill, setMountStill] = React.useState(true);
  React.useEffect(() => {
    if (covered) {
      setMountStill(true);
      return;
    }
    const id = window.setTimeout(() => setMountStill(false), 420);
    return () => window.clearTimeout(id);
  }, [covered]);

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
      <figcaption className="pb-3">
        {/* The stamp rides the CAPTION row, not the whole block: beside the
            figure line it stole the measure and forced a fourth line at 390px —
            18px the mobile first viewport cannot spare (finish review F4). */}
        <span className="flex items-center justify-between gap-6">
          <span className="f-caption block text-graphite">{t.bench.caption}</span>
          {/* LIVE lands as a STAMP when the settled frame is shown (§E.5 motion) */}
          {status === "live" ? (
            <Stamp label={t.bench.live} variant="live" active className="shrink-0" />
          ) : null}
        </span>
        <span className="f-meta mt-1 block max-w-[68ch] text-ink">{t.bench.figure}</span>
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

            {mountStill ? (
              <div
                className="absolute inset-0 transition-opacity duration-[320ms] ease-linear"
                style={{ opacity: covered ? 1 : 0 }}
              >
                {/* The captured frame of THIS engine (WP-7b): shot from the live
                    bench on the home sheet with Chrome WebGPU, cropped to the inside
                    of the ruled frame (the frame is drawn by `.bench-box`, so the
                    raster must not carry a second one), provenance embedded in
                    EXIF + public/bench/PROVENANCE.md. A plain img element: decorative,
                    fixed-size raster inside an aspect-ratio box — no CLS to
                    solve, nothing for the image optimiser to do.
                    alt="" on purpose: the caption above the frame, the STILL word
                    and the `state` readout beside it carry the meaning. */}
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
                {/* Only the word, and only in the degraded states — never while
                    the live frame is merely warming up (there the still is the
                    instrument's own last recorded frame, not a substitute).
                    It sits on a solid `paper-field` plate with a 1px ink rule:
                    over a variable amber image contrast cannot be verified, on a
                    flat token ground it measures 15.15:1 (§C.2). The reason line
                    is printed by the readouts, on the yellow ground (§E.5). */}
                {isStill ? (
                  <span className="absolute inset-0 grid place-content-center justify-items-center">
                    <span className="f-stamp border border-ink bg-paper-field px-3 py-2 text-ink">
                      {t.bench.still}
                    </span>
                  </span>
                ) : null}
              </div>
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
