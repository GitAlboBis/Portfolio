"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";
import { TornEdge } from "@/components/atmosphere/TornEdge";

/*
  DetailCut — one frame of the case-study photo essay.

  The study reuses its single project still the way a magazine feature reuses
  the shoot: the wide shot opens the piece, then DETAIL CROPS punctuate the
  chapters — same photograph, tighter framing, washed toward the chapter's
  mood. The paper tears open (TornEdge) onto a window where the crop drifts
  (parallax) and settles out of its zoom (Ken Burns) as you scroll past.

  Transform ownership (one owner per element, never shared):
    [data-cut-drift]  — GSAP scrubbed translateY (parallax)
    static mid layer  — CSS scale(zoom) + transform-origin at the focal point
                        (the art-directed magnification; never animated)
    [data-cut-zoom]   — GSAP scrubbed scale 1.12→1 (the settle)

  Decorative: aria-hidden (the caption is sighted-only garnish derived from
  dict labels — no information lives here). Reduced-motion: no tweens; the
  static zoom keeps the detail reading. The still is already warm in HTTP
  cache (Warmup) and on-screen above (the banner), so loading="lazy" is free.
*/

type DetailCutProps = {
  src: string;
  /** Focal point of the crop — both object-position and the zoom origin. */
  focal: string;
  /** Art-directed magnification of the detail (static CSS scale). */
  zoom: number;
  /** Chapter mood color, multiplied over the photograph at low opacity. */
  tint: string;
  /** Sighted-only caption under the window ("Detail 01 — Badante24h"). */
  caption: string;
  /** TornEdge seeds [top, bottom] — deterministic variety per cut. */
  seeds: [number, number];
  /** "full" = full-bleed band · "inset" = editorial window on the grid. */
  variant?: "full" | "inset";
  /** Window height (any CSS length). */
  height?: string;
  /** Extra classes on the outer figure (spacing lives at the call site). */
  className?: string;
};

export function DetailCut({
  src,
  focal,
  zoom,
  tint,
  caption,
  seeds,
  variant = "full",
  height = "44svh",
  className = "",
}: DetailCutProps) {
  const reduced = useUI((s) => s.reducedMotion);
  const ref = React.useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || reduced) return;
      const drift = root.querySelector("[data-cut-drift]");
      const zoomEl = root.querySelector("[data-cut-zoom]");
      if (!drift || !zoomEl) return;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true },
      });
      // 1.06: the settle must never push the source past its resolution
      // ceiling (the stills are 1280px — see the zoom note in WorkCaseStudy)
      tl.fromTo(drift, { y: -26 }, { y: 26 }, 0).fromTo(
        zoomEl,
        { scale: 1.06 },
        { scale: 1 },
        0,
      );
      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    // revertOnUpdate: a live reduced-motion flip re-runs and early-returns —
    // without it the scrubbed styles of the old build would linger (from-residue).
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );

  const win = (
    <div className="relative w-full overflow-hidden" style={{ height, minHeight: "300px" }}>
      {/* drift layer overscans 10% (>=30px at the 300px min height) so the
          ±26px parallax can never expose the window edge, even at zoom≈1 */}
      <div data-cut-drift className="absolute inset-x-0 -inset-y-[10%]">
        <div
          className="h-full w-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: focal }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-cut-zoom
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            style={{ objectPosition: focal }}
          />
        </div>
      </div>
      {/* duotone wash — marries the crop to the chapter's mood (multiply keeps light) */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-multiply"
        style={{ background: tint, opacity: 0.16 }}
      />
      {/* foot scrim — the fibre shadow under the lower tear needs depth to sit in */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: "linear-gradient(to top, rgb(42 26 20 / 0.26), transparent)" }}
      />
      <TornEdge side="top" seed={seeds[0]} />
      <TornEdge side="bottom" seed={seeds[1]} />
    </div>
  );

  if (variant === "inset") {
    return (
      <figure aria-hidden ref={ref} className={`container-edit ${className}`}>
        <div className="grid-edit">
          <div className="col-half-r">
            {win}
            <figcaption className="t-meta mt-3 text-ink-mute">{caption}</figcaption>
          </div>
        </div>
      </figure>
    );
  }

  return (
    <figure aria-hidden ref={ref} className={`relative ${className}`}>
      {win}
      <figcaption className="container-edit mt-3">
        <span className="t-meta text-ink-mute">{caption}</span>
      </figcaption>
    </figure>
  );
}
