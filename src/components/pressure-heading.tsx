"use client";

import {
  createElement,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useScrollStore } from "@/webgl/store/scrollStore";

/*
  PressureHeading — type suspended in water under pressure.

  A drop-in wrapper for a section title that physically reacts to REAL scroll
  velocity (read from scrollStore each frame, the same Lenis-fed signal the
  site-nav and scenes use). As the current rushes past, the letters lag and
  shear through it — a velocity-mapped vertical skew + slight vertical stretch,
  with a faint celeste chromatic split (text-shadow offsets) that mimics light
  bending under deep-sea pressure. When scrolling stops, everything settles
  back to crisp, with a touch of spring overshoot so it feels like water
  rebounding, not a CSS easing.

  Design contract (matches the static heading it replaces):
    - renders an <h2>/<h3> (configurable) carrying the SAME heading className,
      so layout/typography are byte-identical to the element it swaps out;
    - the animated transform lives on an INNER aria-hidden <span> so the
      distortion never reaches assistive tech — screen readers get clean text;
    - per-word mode splits the visible text into word spans that each lag with
      a small phase offset, so the distortion flows across the line like a
      ripple instead of moving as one rigid block;
    - prefers-reduced-motion => fully static, crisp heading (no rAF, no split);
    - rAF only runs while the heading is in view (IntersectionObserver-gated)
      AND only does layout work when values actually change (idle = no writes).

  It is intentionally generic: copy is passed in already-translated (the parent
  section owns i18n via useLanguage), so this file needs no translation keys.
*/

type PressureHeadingProps = {
  /** Visible text. Pass already-translated copy from the parent section. */
  children: string;
  /** Heading level — keeps the document outline correct. Default h2. */
  as?: "h2" | "h3";
  /** Existing heading class to inherit (e.g. "heading-1 text-foam"). */
  className?: string;
  /** Stable id for aria-labelledby wiring (e.g. "skills-heading"). */
  id?: string;
  /**
   * Flow the distortion across words with a per-word phase lag (ripple).
   * Off => the whole line shears as one block. Default true.
   */
  perWord?: boolean;
  /** Overall distortion strength multiplier. Default 1. */
  intensity?: number;
};

// --- tuning -----------------------------------------------------------------
// Lenis velocity is roughly px/frame-ish and routinely lands in the ~0..40
// band on a brisk flick. We normalize against this so the effect saturates on
// a hard scroll but stays subtle on a gentle one.
const VELOCITY_NORM = 38;
const MAX_SKEW_DEG = 7; // vertical shear at full current
const MAX_STRETCH = 0.06; // +6% scaleY — type elongating under flow
const MAX_ABERRATION = 2.6; // px of celeste/teal chromatic split
const SPRING = 0.16; // how fast the smoothed velocity chases the target
const PER_WORD_PHASE = 0.55; // 0..1 — how much later each word reacts
const SETTLE_EPSILON = 0.02; // below this the rAF idles (no DOM writes)

export function PressureHeading({
  children,
  as = "h2",
  className,
  id,
  perWord = true,
  intensity = 1,
}: PressureHeadingProps) {
  const wordsRef = useRef<HTMLSpanElement[]>([]);
  const inViewRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  // Smoothed, signed velocity in [-~1, ~1] after normalization.
  const smoothedRef = useRef(0);
  // Last applied magnitude per word, to skip redundant style writes.
  const lastAppliedRef = useRef<number[]>([]);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // static crisp heading — leave the DOM untouched

    const words = wordsRef.current.filter(Boolean);
    if (words.length === 0) return;
    lastAppliedRef.current = words.map(() => Number.NaN);

    // Apply the water distortion to a single word given a signed strength s.
    const paint = (el: HTMLSpanElement, s: number) => {
      const mag = Math.abs(s);
      const skew = s * MAX_SKEW_DEG * intensity;
      const stretch = 1 + mag * MAX_STRETCH * intensity;
      const ab = mag * MAX_ABERRATION * intensity;
      // Two opposed shadows — celeste leading, deep-teal trailing — split along
      // the flow axis so the glyph edges fringe like refracted light.
      el.style.transform = `skewY(${skew.toFixed(3)}deg) scaleY(${stretch.toFixed(4)})`;
      el.style.textShadow =
        ab < 0.05
          ? "none"
          : `0 ${(-ab).toFixed(2)}px 0 rgba(155,211,238,0.55), 0 ${ab.toFixed(2)}px 0 rgba(47,147,171,0.45)`;
    };

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);

      // Target = current normalized scroll velocity (signed), clamped.
      const raw = useScrollStore.getState().velocity;
      const target = Math.max(-1.4, Math.min(1.4, raw / VELOCITY_NORM));

      // Spring toward target — gives lag on acceleration and overshoot-free
      // settle when the current dies.
      smoothedRef.current += (target - smoothedRef.current) * SPRING;
      const base = smoothedRef.current;

      // If everything is at rest and already painted clean, skip DOM writes.
      const restingClean =
        Math.abs(base) < SETTLE_EPSILON &&
        lastAppliedRef.current.every((v) => v === 0);
      if (restingClean) return;

      const snapToZero = Math.abs(base) < SETTLE_EPSILON;

      for (let i = 0; i < words.length; i++) {
        // Per-word phase: later words react to a slightly older velocity so the
        // shear flows along the line as a ripple.
        const phase = perWord
          ? 1 - (i / Math.max(1, words.length - 1)) * PER_WORD_PHASE
          : 1;
        const s = snapToZero ? 0 : base * phase;

        // Skip the write if this word is effectively unchanged.
        const prev = lastAppliedRef.current[i];
        if (Math.abs(s - prev) < 0.002 && !(s === 0 && prev !== 0)) continue;

        paint(words[i], s);
        lastAppliedRef.current[i] = s;
      }
    };

    const start = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      // Resolve to crisp when leaving view so it never freezes mid-shear.
      smoothedRef.current = 0;
      for (let i = 0; i < words.length; i++) {
        paint(words[i], 0);
        lastAppliedRef.current[i] = 0;
      }
    };

    // Gate the rAF on visibility — no work for an off-screen heading.
    const host = words[0]?.closest("[data-pressure-heading]");
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        inViewRef.current = visible;
        if (visible) start();
        else stop();
      },
      { rootMargin: "10% 0px" },
    );
    if (host) io.observe(host);

    return () => {
      io.disconnect();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [children, perWord, intensity]);

  // Split into words while preserving spaces, so the visible line is identical
  // to the plain string but each word can lag independently.
  const tokens = perWord ? splitWords(children) : [children];

  let wordIndex = 0;
  const inner: ReactNode[] = tokens.map((tok, i) => {
    if (tok === " ") return <span key={`s${i}`}> </span>;
    const myIndex = wordIndex++;
    return (
      <span
        key={`w${i}`}
        ref={(el) => {
          if (el) wordsRef.current[myIndex] = el;
        }}
        style={WORD_STYLE}
      >
        {tok}
      </span>
    );
  });

  return createElement(
    as,
    {
      id,
      className,
      "data-pressure-heading": "",
      // Distortion is decorative; expose the clean text to assistive tech and
      // hide the animated, split copy.
      children: [
        <span key="visible" aria-hidden="true" style={VISIBLE_STYLE}>
          {inner}
        </span>,
        <span key="sr" className="sr-only">
          {children}
        </span>,
      ],
    },
  );
}

// Each word is an inline-block so transform/scaleY apply per glyph-group;
// will-change keeps it on its own layer during a flick.
const WORD_STYLE: CSSProperties = {
  display: "inline-block",
  willChange: "transform",
  transformOrigin: "center",
  // No CSS transition: the rAF spring IS the smoothing.
  backfaceVisibility: "hidden",
};

const VISIBLE_STYLE: CSSProperties = {
  display: "inline-block",
};

// Split keeping single spaces as their own tokens so we can render real spaces
// between inline-block words (which would otherwise collapse).
function splitWords(text: string): string[] {
  return text.split(/(\s+)/).flatMap((part) => {
    if (part.trim() === "") return part.length ? [" "] : [];
    return [part];
  });
}
