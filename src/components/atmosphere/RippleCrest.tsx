"use client";

import * as React from "react";

/*
  RippleCrest — the ecosystem's ring of foam.

  Port of the brief's "Visual Effects Slider" ripple (CODE SNIPPET A,
  `_refs/DOSSIERS.md §9a`), collapsed from the radial 2D screen effect to
  the site's own 1D idiom: a ring expanding ALONG A WATERLINE. The three
  decaying wave trains are the effect and are kept verbatim in their ratios:

      R  = progress · maxDist · 1.5
      r1 = sin((d−R)·f)      · exp(−|d−R|·8k)
      r2 = sin((d−0.7R)·1.3f)· exp(−|d−0.7R|·6k) · 0.6
      r3 = sin((d−0.4R)·1.8f)· exp(−|d−0.4R|·4k) · 0.3

  frequency ratios 1 : 1.3 : 1.8, decay ratios 8 : 6 : 4, amplitude series
  1 : 0.6 : 0.3, the 0.7/0.4 radius lags — that spread is what reads as a
  real expanding ring rather than a single sine. (The snippet's frequency 25
  and decay 8 are per-uv; here one "uv" is the half-width of the strip, so
  the on-screen wavelengths match the reference.)

  It draws NOTHING at rest: on the named window event a ~1.9s one-shot rAF
  strokes the ring crest as a polyline in the waterline's own foam grammar
  (moonlit line + warm halo) and removes it. The base tide geometry —
  hand-tuned, CSS-drifting — is never touched (wave.ts stays static; see
  the B8 plan note in IMPROVEMENT_BACKLOG.md).

  Decorative: aria-hidden. Reduced-motion: the listener is never attached
  (effect-time media query — render never branches, zero hydration surface).
*/

const VB_W = 1440; // own viewBox: spans the visible strip once (not the 200% track)
const STEP = 6; // polyline sampling, ≈240 points
const DUR = 1900; // ms — ring reaches the edges and dissolves

export function RippleCrest({
  event,
  yBase,
  height,
  ampPx = 12,
  className = "",
}: {
  /** window CustomEvent that fires the ring (e.g. "tide-touch") */
  event: string;
  /** the waterline's rest y in the strip's viewBox units */
  yBase: number;
  /** viewBox height (must match the strip the crest rides) */
  height: number;
  /** peak crest displacement in viewBox units */
  ampPx?: number;
  className?: string;
}) {
  const pathARef = React.useRef<SVGPathElement>(null);
  const pathBRef = React.useRef<SVGPathElement>(null);
  const gRef = React.useRef<SVGGElement>(null);

  React.useEffect(() => {
    const a = pathARef.current;
    const b = pathBRef.current;
    const g = gRef.current;
    if (!a || !b || !g) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let t0 = 0;

    const HALF = VB_W / 2; // one reference "uv" = the half-width
    const F = 25 / HALF; // frequency 25 per-uv, in viewBox units
    const K = 1 / HALF; // decay base: 8k / 6k / 4k below

    const draw = (now: number) => {
      const p = (now - t0) / DUR;
      if (p >= 1) {
        a.setAttribute("d", "");
        b.setAttribute("d", "");
        g.setAttribute("opacity", "0");
        return;
      }
      raf = requestAnimationFrame(draw);
      const R = p * HALF * 1.5; // waveRadius = progress · maxDist · 1.5
      // the ring is born quiet, peaks early, dissolves at the edges
      const env = Math.sin(Math.min(1, p / 0.85) * Math.PI) * ampPx;
      let d = "";
      for (let x = 0; x <= VB_W; x += STEP) {
        const dist = Math.abs(x - HALF);
        const r1 = Math.sin((dist - R) * F) * Math.exp(-Math.abs(dist - R) * 8 * K);
        const r2 =
          Math.sin((dist - R * 0.7) * F * 1.3) * Math.exp(-Math.abs(dist - R * 0.7) * 6 * K) * 0.6;
        const r3 =
          Math.sin((dist - R * 0.4) * F * 1.8) * Math.exp(-Math.abs(dist - R * 0.4) * 4 * K) * 0.3;
        const y = yBase - (r1 + r2 + r3) * env;
        d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)} `;
      }
      a.setAttribute("d", d);
      b.setAttribute("d", d);
      g.setAttribute("opacity", String(1 - Math.max(0, (p - 0.7) / 0.3)));
    };

    const onEvent = () => {
      cancelAnimationFrame(raf);
      t0 = performance.now();
      g.setAttribute("opacity", "1");
      raf = requestAnimationFrame(draw);
    };
    window.addEventListener(event, onEvent);
    return () => {
      window.removeEventListener(event, onEvent);
      cancelAnimationFrame(raf);
      a.setAttribute("d", "");
      b.setAttribute("d", "");
    };
  }, [event, yBase, ampPx]);

  return (
    <svg
      aria-hidden
      className={`pointer-events-none ${className}`}
      viewBox={`0 0 ${VB_W} ${height}`}
      preserveAspectRatio="none"
    >
      <g ref={gRef} opacity="0">
        {/* the waterline's own foam grammar: warm halo under a moonlit line */}
        <path ref={pathBRef} d="" fill="none" stroke="rgb(242 163 60 / 0.20)" strokeWidth="5" />
        <path ref={pathARef} d="" fill="none" stroke="rgb(244 237 229 / 0.55)" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

export default RippleCrest;
