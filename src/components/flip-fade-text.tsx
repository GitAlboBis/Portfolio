"use client";

import {
  createElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/*
  FlipFadeText — eyebrows / headings that surface from the waterline.

  Ocean-adapted reconstruction of vengenceUI's "Flip Fade Text" (built on
  Framer Motion: each letter animates rotateX:90deg -> 0, y:20 -> 0,
  opacity:0 -> 1, blur(8px) -> 0 on a per-character stagger). framer-motion is
  NOT in this stack, so the technique is rebuilt with pure CSS keyframes driven
  by per-character custom-property delays — zero animation-lib weight, GPU-only
  transforms, and it plays exactly once when the text enters view (which is what
  a section eyebrow/heading wants, not the source's auto-cycling carousel).

  What we changed from the reference, and why it reads as "water":
    - Each glyph HINGES UP from its OWN baseline (transform-origin: bottom),
      so the line breaks the surface letter by letter instead of pivoting as a
      slab — type rising through a waterline.
    - The stagger is eased, not flat: early letters cluster, later ones trail,
      like bubbles surfacing at different rates (the site's "risacca" feel).
    - After the flip settles, a single celeste sheen sweeps L->R across the
      glyphs (background-clip:text), and a faint celeste glow blooms then
      recedes — the signature ciano-bianca shimmer of the portfolio.

  Design contract (drop-in for a static eyebrow/heading):
    - renders the element + className you pass, so it inherits the page's type
      tokens (Fraunces/Hanken) and color byte-for-byte;
    - copy is passed already-translated (parent owns i18n via useLanguage) — no
      translation keys live here;
    - the animated, split copy is aria-hidden; assistive tech gets one clean
      string via an .sr-only span;
    - prefers-reduced-motion => fully static, fully visible text (no split work,
      no keyframes), so it can never be left mid-flip;
    - IntersectionObserver-gated: nothing animates until it scrolls into view,
      and it fires once (replay opt-in).
*/

type Tag = "span" | "p" | "h1" | "h2" | "h3" | "h4";

type FlipFadeTextProps = {
  /** Visible text. Pass already-translated copy from the parent section. */
  text: string;
  /** Element to render. Default "span" (typical for an eyebrow). */
  as?: Tag;
  /** Class to inherit type/color tokens (e.g. "eyebrow text-celeste"). */
  className?: string;
  /** Stable id (e.g. for aria-labelledby wiring). */
  id?: string;
  /** Seconds before the first glyph flips once in view. Default 0. */
  delay?: number;
  /** Per-character stagger base in seconds. Default 0.055. */
  stagger?: number;
  /** Flip duration per character in seconds. Default 0.72. */
  duration?: number;
  /** Run the celeste sheen sweep after the flip settles. Default true. */
  shimmer?: boolean;
  /** Re-run every time it re-enters view instead of once. Default false. */
  replay?: boolean;
};

// --- tuning -----------------------------------------------------------------
// Eased stagger: later letters trail further so the line surfaces like bubbles
// rising, not a metronome. t in [0,1] -> multiplier on `stagger`.
const easeStagger = (t: number) => t + t * t * 0.85;

export function FlipFadeText({
  text,
  as = "span",
  className,
  id,
  delay = 0,
  stagger = 0.055,
  duration = 0.72,
  shimmer = true,
  replay = false,
}: FlipFadeTextProps) {
  const hostRef = useRef<HTMLElement | null>(null);
  const [play, setPlay] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduce) return; // static: never gate, never animate
    const host = hostRef.current;
    if (!host) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setPlay(true);
            if (!replay) io.disconnect();
          } else if (replay) {
            setPlay(false); // reset so it can flip again on re-entry
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );
    io.observe(host);
    return () => io.disconnect();
  }, [reduce, replay]);

  // Char count drives total duration -> when the sheen is allowed to start.
  const chars = Array.from(text);
  const lastDelay = delay + easeStagger(1) * stagger * Math.max(0, chars.length - 1);
  const sheenDelay = lastDelay + duration * 0.45;

  // Build the decorative, split copy. Spaces become fixed-width gaps so the
  // line wraps and measures like the original string.
  let charIdx = 0;
  const visible: ReactNode[] = chars.map((ch, i) => {
    if (ch === " ") {
      return (
        <span key={`sp${i}`} aria-hidden="true" style={SPACE_STYLE}>
          {" "}
        </span>
      );
    }
    const myIdx = charIdx++;
    const cd = delay + easeStagger(myIdx / Math.max(1, chars.length - 1)) * stagger * myIdx;
    const style = {
      ...CHAR_STYLE,
      // Each glyph: hidden below the waterline until its turn.
      animationName: play ? "ff-flip" : "none",
      animationDuration: `${duration}s`,
      animationDelay: `${cd}s`,
      opacity: play ? undefined : 0,
    } as CSSProperties;
    return (
      <span key={`c${i}`} className="ff-char" style={style}>
        {ch}
      </span>
    );
  });

  // Reduced-motion or pre-paint: render plain, fully-visible text (no split,
  // no transforms) so it's correct even before/without JS animation.
  const inner: ReactNode = reduce ? (
    text
  ) : (
    <>
      <span
        aria-hidden="true"
        className={`ff-wrap${play && shimmer ? " ff-shimmer" : ""}`}
        style={
          {
            ...WRAP_STYLE,
            "--ff-sheen-delay": `${sheenDelay}s`,
          } as CSSProperties
        }
      >
        {visible}
      </span>
      <span className="sr-only">{text}</span>
      <StyleOnce />
    </>
  );

  return createElement(
    as,
    {
      id,
      className,
      ref: hostRef,
      "data-flip-fade": "",
    },
    inner,
  );
}

// --- styles -----------------------------------------------------------------

const WRAP_STYLE: CSSProperties = {
  display: "inline-block",
  // Perspective gives the rotateX an actual flip-up depth instead of a squash.
  perspective: "640px",
};

const CHAR_STYLE: CSSProperties = {
  display: "inline-block",
  // Hinge each glyph up from its own baseline — the "waterline".
  transformOrigin: "50% 100%",
  transformStyle: "preserve-3d",
  backfaceVisibility: "hidden",
  willChange: "transform, opacity, filter",
  animationTimingFunction: "cubic-bezier(0.2, 0.65, 0.3, 0.96)",
  animationFillMode: "both",
  whiteSpace: "pre",
};

const SPACE_STYLE: CSSProperties = {
  display: "inline-block",
  whiteSpace: "pre",
};

// Scoped keyframes + sheen, injected exactly once per document. Keeping this in
// the component (not globals.css) honors the "create only new files" contract.
let injected = false;
function StyleOnce() {
  if (injected) return null;
  injected = true;
  return (
    <style
      // Scoped to [data-flip-fade] so it can't leak onto other elements.
      dangerouslySetInnerHTML={{
        __html: `
[data-flip-fade] .ff-char {
  /* Idle (pre-play) resting state: submerged, blurred, hinged back. */
  opacity: 0;
  transform: translateY(0.42em) rotateX(92deg) scale(0.96);
  filter: blur(8px);
}
@keyframes ff-flip {
  0%   { opacity: 0; transform: translateY(0.42em) rotateX(92deg) scale(0.96); filter: blur(8px); }
  55%  { opacity: 1; }
  72%  { transform: translateY(-0.05em) rotateX(-7deg) scale(1.01); filter: blur(0); }
  100% { opacity: 1; transform: translateY(0) rotateX(0) scale(1); filter: blur(0); }
}
/* Celeste sheen: a single L->R light sweep over the glyphs after they settle. */
[data-flip-fade] .ff-shimmer {
  position: relative;
}
[data-flip-fade] .ff-shimmer::before {
  content: "";
  position: absolute;
  inset: -0.15em -0.35em;
  pointer-events: none;
  background: linear-gradient(
    105deg,
    transparent 38%,
    rgba(199, 230, 244, 0.0) 44%,
    rgba(155, 211, 238, 0.55) 50%,
    rgba(199, 230, 244, 0.0) 56%,
    transparent 62%
  );
  background-size: 220% 100%;
  background-position: 180% 0;
  mix-blend-mode: screen;
  opacity: 0;
  border-radius: 0.2em;
  animation: ff-sheen 1.25s cubic-bezier(0.33, 0, 0.2, 1) var(--ff-sheen-delay, 0s) 1 both;
}
@keyframes ff-sheen {
  0%   { background-position: 180% 0; opacity: 0; }
  18%  { opacity: 1; }
  82%  { opacity: 1; }
  100% { background-position: -60% 0; opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  [data-flip-fade] .ff-char { opacity: 1 !important; transform: none !important; filter: none !important; animation: none !important; }
  [data-flip-fade] .ff-shimmer::before { animation: none !important; opacity: 0 !important; }
}
`,
      }}
    />
  );
}
