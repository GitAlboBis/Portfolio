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

  Ocean-adapted reconstruction of vengenceUI's "Flip Fade Text": each glyph hinges
  up from its own baseline (rotateX 92deg -> 0, y/​blur/​opacity in) on an eased
  per-character stagger, then a celeste sheen sweeps L->R. Pure CSS keyframes
  (no animation lib), GPU-only transforms, plays once on enter-view.

  SSR-SAFETY (important): the server and the FIRST client render output PLAIN TEXT
  (identical markup), so hydration never mismatches. Only AFTER mount do we swap in
  the split, animated glyphs. Keyframes are injected into <head> once (never as a
  child of a <p>/<h2>, which is invalid nesting and was the prior hydration bug).

  Contract: renders the element + className you pass (inherits type/color tokens);
  copy is already-translated (parent owns i18n); animated copy is aria-hidden with a
  clean .sr-only string; prefers-reduced-motion => static visible text.
*/

type Tag = "span" | "p" | "h1" | "h2" | "h3" | "h4";

type FlipFadeTextProps = {
  text: string;
  as?: Tag;
  className?: string;
  id?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  shimmer?: boolean;
  replay?: boolean;
};

const easeStagger = (t: number) => t + t * t * 0.85;

const KEYFRAMES_ID = "ff-flip-keyframes";
const KEYFRAMES_CSS = `
[data-flip-fade] .ff-char {
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
[data-flip-fade] .ff-shimmer { position: relative; }
[data-flip-fade] .ff-shimmer::before {
  content: ""; position: absolute; inset: -0.15em -0.35em; pointer-events: none;
  background: linear-gradient(105deg, transparent 38%, rgba(199,230,244,0) 44%, rgba(155,211,238,0.55) 50%, rgba(199,230,244,0) 56%, transparent 62%);
  background-size: 220% 100%; background-position: 180% 0; mix-blend-mode: screen;
  opacity: 0; border-radius: 0.2em;
  animation: ff-sheen 1.25s cubic-bezier(0.33,0,0.2,1) var(--ff-sheen-delay, 0s) 1 both;
}
@keyframes ff-sheen {
  0% { background-position: 180% 0; opacity: 0; }
  18% { opacity: 1; } 82% { opacity: 1; }
  100% { background-position: -60% 0; opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  [data-flip-fade] .ff-char { opacity: 1 !important; transform: none !important; filter: none !important; animation: none !important; }
  [data-flip-fade] .ff-shimmer::before { animation: none !important; opacity: 0 !important; }
}
`;

function ensureKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(KEYFRAMES_ID)) return;
  const el = document.createElement("style");
  el.id = KEYFRAMES_ID;
  el.textContent = KEYFRAMES_CSS;
  document.head.appendChild(el);
}

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
  const [mounted, setMounted] = useState(false);
  const [play, setPlay] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    ensureKeyframes();
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!mounted || reduce) return;
    const host = hostRef.current;
    if (!host) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setPlay(true);
            if (!replay) io.disconnect();
          } else if (replay) {
            setPlay(false);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );
    io.observe(host);
    return () => io.disconnect();
  }, [mounted, reduce, replay]);

  // SSR + first client render (and reduced-motion): PLAIN TEXT — identical markup
  // on server and client, so hydration matches. Enhancement happens post-mount.
  if (!mounted || reduce) {
    return createElement(
      as,
      { id, className, ref: hostRef, "data-flip-fade": "" },
      text,
    );
  }

  const chars = Array.from(text);
  const lastDelay =
    delay + easeStagger(1) * stagger * Math.max(0, chars.length - 1);
  const sheenDelay = lastDelay + duration * 0.45;

  let charIdx = 0;
  const visible: ReactNode[] = chars.map((ch, i) => {
    if (ch === " ") {
      return (
        <span key={`sp${i}`} aria-hidden="true" style={SPACE_STYLE}>
          {" "}
        </span>
      );
    }
    const myIdx = charIdx++;
    const cd =
      delay +
      easeStagger(myIdx / Math.max(1, chars.length - 1)) * stagger * myIdx;
    const style = {
      ...CHAR_STYLE,
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

  const inner: ReactNode = (
    <>
      <span
        aria-hidden="true"
        className={`ff-wrap${play && shimmer ? " ff-shimmer" : ""}`}
        style={
          { ...WRAP_STYLE, "--ff-sheen-delay": `${sheenDelay}s` } as CSSProperties
        }
      >
        {visible}
      </span>
      <span className="sr-only">{text}</span>
    </>
  );

  return createElement(
    as,
    { id, className, ref: hostRef, "data-flip-fade": "" },
    inner,
  );
}

const WRAP_STYLE: CSSProperties = {
  display: "inline-block",
  perspective: "640px",
};

const CHAR_STYLE: CSSProperties = {
  display: "inline-block",
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
