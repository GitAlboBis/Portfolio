"use client";

import {
  createElement,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/*
  ScrollText — the "tide-line" scroll-reveal.

  Adapted from the ui-layouts "Scroll Text" / Codrops word-reveal technique
  (https://www.ui-layouts.com/components/scroll-text ·
   https://tympanus.net/codrops/hub/). The ui-layouts page ships its source via
  CLI/GitHub rather than inline, so the underlying technique was RECONSTRUCTED
  from the classic GSAP ScrollTrigger word-reveal recipe (per-word spans, a
  single scrubbed timeline, staggered tweens) and confirmed against the GSAP
  docs via Context7, then re-themed for this site.

  The effect: a large statement that surfaces from the deep. Each word starts as
  faint MIST (low opacity, blurred, pushed down, deep-teal) and, as the line
  scrolls up through the viewport, fills word-by-word to crisp FOAM white with a
  brief celeste "wet glint" as the tide-line passes over it — as if the sentence
  were breaking the surface of the water left-to-right.

  How it animates (one ScrollTrigger, scrubbed so it tracks Lenis exactly):
    - words split into inline-block spans (spaces preserved);
    - a timeline tweens each word mist -> foam, staggered across the line, so the
      "reveal front" sweeps the sentence as you scroll;
    - scrub:true binds timeline progress to scroll position — already inside the
      ONE Lenis<->GSAP ticker wired by ScrollProvider, so no second rAF here;
    - a separate quick celeste-glint pulse rides each word as it crosses, then
      releases, giving the wet-surface shimmer.

  Accessibility / perf contract (mirrors PressureHeading in this codebase):
    - renders a real heading element carrying the SAME className, so typography
      and layout match the static element it replaces;
    - the animated, split copy lives in an aria-hidden <span>; assistive tech
      reads a clean sr-only copy of the full string;
    - prefers-reduced-motion => fully static crisp heading, no GSAP, no split;
    - all ScrollTriggers/tweens are scoped to this instance and reverted on
      unmount via gsap.context, so nothing leaks between mounts.

  Generic by design: pass an already-translated string (the parent section owns
  i18n via useLanguage), so this file needs no translation keys.
*/

type ScrollTextProps = {
  /** Visible statement. Pass already-translated copy from the parent section. */
  children: string;
  /** Heading level — keeps the document outline correct. Default h2. */
  as?: "h2" | "h3" | "p";
  /** Existing class to inherit (e.g. "heading-2 text-foam"). */
  className?: string;
  /** Stable id for aria-labelledby wiring. */
  id?: string;
  /**
   * How far apart consecutive words light up, as a fraction of the timeline.
   * Higher => a longer, slower "wave" sweeping the line. Default 0.9.
   */
  spread?: number;
};

// --- tuning -----------------------------------------------------------------
const MIST_OPACITY = 0.16; // resting opacity of an un-surfaced word
const MIST_BLUR = 6; // px of blur while submerged
const MIST_RISE = "0.18em"; // how far each word sits below its line, sunken
const REVEAL_EASE = "power2.out";

export function ScrollText({
  children,
  as = "h2",
  className,
  id,
  spread = 0.9,
}: ScrollTextProps) {
  const hostRef = useRef<HTMLElement | null>(null);
  const wordsRef = useRef<HTMLSpanElement[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return; // static crisp heading — leave the DOM untouched

    const host = hostRef.current;
    const words = wordsRef.current.filter(Boolean);
    if (!host || words.length === 0) return;

    gsap.registerPlugin(ScrollTrigger);

    // gsap.context scopes every tween/ScrollTrigger created inside it to this
    // instance; ctx.revert() on cleanup kills them and restores inline styles.
    const ctx = gsap.context(() => {
      // Resting "submerged" state.
      gsap.set(words, {
        opacity: MIST_OPACITY,
        filter: `blur(${MIST_BLUR}px)`,
        yPercent: 0,
        y: MIST_RISE,
        color: "var(--color-mist)",
        // wet glint, painted via a CSS var the span's text-shadow reads.
        "--glint": 0,
      });

      // ONE scrubbed timeline; words surface in sequence as the line scrolls.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: host,
          // Begin as the statement enters the lower viewport, finish as it
          // clears the upper-middle — the whole line surfaces during its pass.
          start: "top 85%",
          end: "top 35%",
          scrub: true,
        },
      });

      // Stagger spreads the per-word tweens across the timeline so the reveal
      // front sweeps left-to-right. `each` is derived from word count so the
      // sweep length is stable regardless of sentence length.
      const each = (spread * 1) / Math.max(1, words.length);

      tl.to(words, {
        opacity: 1,
        filter: "blur(0px)",
        y: "0em",
        color: "var(--color-foam)",
        ease: REVEAL_EASE,
        duration: 0.5,
        stagger: { each, from: "start" },
      });

      // Wet glint: a short celeste flash that rides each word as it surfaces,
      // then fades — overlaid on the same staggered front (yoyo back to 0).
      tl.to(
        words,
        {
          "--glint": 1,
          duration: 0.18,
          ease: "sine.inOut",
          stagger: { each, from: "start", yoyo: true, repeat: 1 },
        },
        0,
      );
    }, host);

    // Layout settles after fonts/sticky sections; nudge a refresh so the
    // start/end pixels are measured correctly (ScrollProvider also refreshes).
    const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 120);

    return () => {
      window.clearTimeout(refreshId);
      ctx.revert();
    };
  }, [children, spread]);

  // Split into words, preserving single spaces as their own tokens so real
  // spaces render between the inline-block words.
  const tokens = splitWords(children);
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

  return createElement(as, {
    id,
    className,
    ref: hostRef,
    children: [
      <span key="visible" aria-hidden="true" style={VISIBLE_STYLE}>
        {inner}
      </span>,
      <span key="sr" className="sr-only">
        {children}
      </span>,
    ],
  });
}

// Each word is inline-block so transform/blur/opacity apply per word; the
// text-shadow reads the --glint var so the celeste wet-flash can be tweened
// numerically. calc() scales the glint blur+alpha by --glint (0..1).
const WORD_STYLE: CSSProperties = {
  display: "inline-block",
  willChange: "transform, opacity, filter",
  transformOrigin: "center bottom",
  backfaceVisibility: "hidden",
  // @ts-expect-error — custom property is valid inline CSS, not in the typings.
  "--glint": 0,
  textShadow:
    "0 0 calc(var(--glint) * 0.5em) rgba(155, 211, 238, calc(var(--glint) * 0.85))",
};

const VISIBLE_STYLE: CSSProperties = {
  display: "inline-block",
};

// Split keeping single spaces as their own tokens so inline-block words don't
// collapse the whitespace between them.
function splitWords(text: string): string[] {
  return text.split(/(\s+)/).flatMap((part) => {
    if (part.trim() === "") return part.length ? [" "] : [];
    return [part];
  });
}
