"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";
import { TornEdge } from "@/components/atmosphere/TornEdge";

/*
  TearDolly — the case study's wide shot: you enter the project by flying
  THROUGH the torn paper into the photograph.

  Port of the GreenSock "ScrollTrigger Image Zoom" dolly (CodePen YzbPYMx,
  studied in _refs/DOSSIERS.md §1). The magnification is deliberately split
  between a 2D scale and a Z translation under CSS perspective:

      perspective P = 500px   (on the clipping parent)
      translateZ  z = 350px   + scale 2   (on the front plane)
      total = 2 × P/(P−z) = 2 × 3.333 = 6.667×

  A flat scale reads as a zoom; the split makes the plane's EDGES sweep
  outward faster than its centre — the parallax signature of physically
  moving toward it. The layer behind scales only 1.1 on the same timeline
  position: the ~6:1 front/back ratio is what makes the eye read two planes.
  `power1.inOut` on a scrubbed timeline = the scrub is NOT linear; entering
  and leaving the tunnel decelerates. Travel is the reference's `+=150%`
  (250vh wrapper − 100vh sticky child).

  Ours, not theirs: the FRONT plane is not the photograph. The stills are
  1280px sources — a 6.667× dolly on one magnifies WebP blocking, not
  photography (the measured ceiling is ~1.5×, see WorkCaseStudy's zoom note).
  The front plane here is the site's own torn PAPER — an SVG aperture with
  TornEdge's fibre grammar — which has no resolution ceiling, while the
  photograph rides the 1.1 back plane, inside its ceiling. "La carta si
  lacera per rivelare le fotografie" is the site's stated language; flying
  through the tear is that sentence as a camera move. CSS sticky instead of
  ScrollTrigger pin (the Nightfall lesson: this codebase does not mix pins
  into sticky-heavy pages).

  Decorative: aria-hidden (org · year already live as real text in the intro
  meta block). Reduced-motion: static poster — the photograph full-bleed, no
  paper front, wrapper collapsed to one band — handled purely in CSS
  (motion-reduce: variants, zero hydration surface) plus an effect-time
  early return, the WorkApproach pattern.
*/

const VB_W = 1440;
const VB_H = 900;
/** The aperture: centered, ~3:2 at the 1440×900 design viewport. The SVG
 *  stretches with preserveAspectRatio="none", so these are viewport
 *  fractions — the window follows the screen's aspect (portrait on phones). */
const WIN = { x: 405, y: 264, w: 630, h: 372 };

/**
 * The torn window — one evenodd path: full-bleed paper minus a jagged
 * aperture. Same deterministic hash-fract jitter as TornEdge (SSR == client,
 * precision fixed), same ~26-unit fibre pitch, walked around the perimeter.
 */
function aperturePath(seed: number) {
  const fr = (i: number, n: number) => {
    const x = Math.sin((i + seed * 31.7) * 127.1 + n * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  // centered jitter ±9 + TornEdge's alternating ±2.5 bias — the same visual
  // amplitude its 26-unit band produces
  const j = (i: number, c: number) =>
    (fr(i, c) - 0.5) * 18 + (i % 2 ? 2.5 : -2.5) * fr(i, c + 7);

  const { x, y, w, h } = WIN;
  const nx = Math.round(w / 26);
  const ny = Math.round(h / 26);
  let d = "";
  let i = 0;
  for (let k = 0; k <= nx; k++, i++)
    d += `${k ? "L" : "M"}${(x + (k * w) / nx).toFixed(1)} ${(y + j(i, 1)).toFixed(1)} `;
  for (let k = 1; k <= ny; k++, i++)
    d += `L${(x + w + j(i, 2)).toFixed(1)} ${(y + (k * h) / ny).toFixed(1)} `;
  for (let k = 1; k <= nx; k++, i++)
    d += `L${(x + w - (k * w) / nx).toFixed(1)} ${(y + h + j(i, 3)).toFixed(1)} `;
  for (let k = 1; k < ny; k++, i++)
    d += `L${(x + j(i, 4)).toFixed(1)} ${(y + h - (k * h) / ny).toFixed(1)} `;
  return `M0 0 H${VB_W} V${VB_H} H0 Z ${d}Z`;
}

type TearDollyProps = {
  src: string;
  /** object-position of the photograph behind the tear. */
  focal?: string;
  /** Project mood color, multiplied over the photograph (DetailCut grammar). */
  tint: string;
  /** Sighted-only caption riding the paper under the window ("org · year"). */
  caption: string;
  /** Deterministic tear variety per study. */
  seed?: number;
  className?: string;
};

export function TearDolly({
  src,
  focal = "50% 42%",
  tint,
  caption,
  seed = 1,
  className = "",
}: TearDollyProps) {
  const reduced = useUI((s) => s.reducedMotion);
  const wrapRef = React.useRef<HTMLElement>(null);
  const d = React.useMemo(() => aperturePath(seed), [seed]);
  const cx = WIN.x + WIN.w / 2;
  const cy = WIN.y + WIN.h / 2;

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      if (!wrap || reduced) return;
      const plane = wrap.querySelector("[data-tear-plane]");
      const back = wrap.querySelector("[data-tear-back]");
      const seam = wrap.querySelector("[data-tear-seam]");
      if (!plane || !back || !seam) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap,
          // sticky child is stuck for exactly (wrapper − viewport) = 150vh —
          // the reference's `end: "+=150%"` without a pin-spacer
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });
      tl.to(
        plane,
        { scale: 2, z: 350, transformOrigin: "center center", ease: "power1.inOut", duration: 1 },
        0,
      ).to(
        back,
        { scale: 1.1, transformOrigin: "center center", ease: "power1.inOut", duration: 1 },
        "<",
      );
      // the bottom seam only exists once the photograph actually reaches the
      // viewport's bottom edge (window-bottom × magnification ≥ viewport at
      // ~0.53 of the scrub) — before that it would be a fibre shadow floating
      // on solid paper
      tl.to(seam, { autoAlpha: 1, duration: 0.15, ease: "none" }, 0.45);

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        // scrubbed inline styles must not survive a reduced-motion rebuild
        // (from-residue lesson) — and a live perspective transform promotes
        // the layer, so it must not outlive the effect either
        gsap.set([plane, back, seam], { clearProps: "all" });
      };
    },
    { scope: wrapRef, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <figure
      ref={wrapRef}
      aria-hidden
      className={`relative h-[250vh] motion-reduce:h-[52svh] motion-reduce:min-h-[300px] ${className}`}
    >
      <div className="sticky top-0 h-dvh overflow-hidden motion-reduce:relative motion-reduce:h-full">
        {/* back plane — the photograph, tinted toward the project's mood */}
        <div data-tear-back className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            style={{ objectPosition: focal }}
          />
          <div
            className="pointer-events-none absolute inset-0 mix-blend-multiply"
            style={{ background: tint, opacity: 0.16 }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
            style={{
              background: "linear-gradient(to top, rgb(42 26 20 / 0.26), transparent)",
            }}
          />
        </div>

        {/* the portal — perspective on the clipping parent turns the paper
            into something you fly through, not an overflowing sheet */}
        <div
          className="absolute inset-0 overflow-hidden motion-reduce:hidden"
          style={{ perspective: "500px" }}
        >
          <div data-tear-plane className="absolute inset-0">
            <svg
              className="h-full w-full"
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              preserveAspectRatio="none"
            >
              {/* lifted-fibre shadow just inside the window (TornEdge's ink,
                  biased down — lit from above) */}
              <path
                d={d}
                fillRule="evenodd"
                fill="rgb(42 26 20 / 0.22)"
                transform={`translate(${cx} ${cy + 2}) scale(0.982) translate(${-cx} ${-cy})`}
              />
              <path d={d} fillRule="evenodd" fill="var(--color-paper)" />
            </svg>
            {/* the caption rides the paper and flies past with it */}
            <span
              className="t-meta absolute text-ink-mute"
              style={{ left: `${((WIN.x / VB_W) * 100).toFixed(2)}%`, top: "72.5%" }}
            >
              {caption}
            </span>
          </div>
        </div>

        {/* the band's own seam stays torn when it hands off to the metrics.
            Hidden until the dolly exposes the photo at the bottom edge (the
            timeline fades it in); the reduced-motion poster shows it always. */}
        <div
          data-tear-seam
          className="absolute inset-x-0 bottom-0 z-10 opacity-0 motion-reduce:opacity-100"
        >
          <TornEdge side="bottom" seed={seed + 51} />
        </div>
      </div>
    </figure>
  );
}
