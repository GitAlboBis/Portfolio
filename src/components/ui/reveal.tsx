"use client";

import {
  Children,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "@/lib/utils";

/*
  Section-entrance primitive — Cinematic Ocean register.

  One IntersectionObserver gate, four restrained entrances. Each variant is a
  CSS-transition recipe (transform / opacity / clip-path) so the primitive stays
  SSR-safe and free of any animation-library coupling; it shares no clock with
  the hero fluid or the Lenis/GSAP ticker.

    fade-up    quiet rise + fade (the calm default)
    clip-up    rises while a bottom-anchored clip-path opens — content "surfaces"
    mask-wipe  a vertical wipe uncovers the block top→bottom, like a tide line
    stagger    direct children rise in sequence (cards, lists)

  Content already in the viewport at mount reveals immediately (hero-adjacent,
  above-the-fold). Below the fold reveals once, on scroll. Respects
  prefers-reduced-motion: renders fully visible with no transform, clip or delay.
*/

export type RevealVariant = "fade-up" | "clip-up" | "mask-wipe" | "stagger";

export function Reveal({
  children,
  className,
  delay = 0,
  variant = "fade-up",
  stagger = 90,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Lead-in delay in ms applied to the whole block (or first staggered child). */
  delay?: number;
  variant?: RevealVariant;
  /** Per-child step in ms for the `stagger` variant. */
  stagger?: number;
  /** Element tag to render as. */
  as?: "div" | "ul" | "ol" | "section";
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    // Already (even partially) on screen at mount -> reveal now.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The stagger variant animates each direct child independently.
  if (variant === "stagger") {
    const items = Children.toArray(children);
    return (
      <Tag
        ref={ref as Ref<never>}
        className={cn("motion-reduce:!transition-none", className)}
      >
        {items.map((child, i) => (
          <div
            key={i}
            className={cn(
              "transition-[transform,opacity] duration-700 ease-out will-change-transform motion-reduce:!transform-none motion-reduce:!opacity-100 motion-reduce:!transition-none",
              shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
            )}
            style={{
              transitionDelay: shown ? `${delay + i * stagger}ms` : "0ms",
            }}
          >
            {child}
          </div>
        ))}
      </Tag>
    );
  }

  const variantClass = VARIANT_HIDDEN[variant];
  const transitionClass = VARIANT_TRANSITION[variant];

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn(
        transitionClass,
        "will-change-transform motion-reduce:!transform-none motion-reduce:!opacity-100 motion-reduce:!transition-none",
        shown ? VARIANT_SHOWN[variant] : variantClass,
        className,
      )}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

/* Per-variant transition + hidden/shown states (Tailwind utilities only). */

const VARIANT_TRANSITION: Record<RevealVariant, string> = {
  "fade-up": "transition-[transform,opacity] duration-700 ease-out",
  "clip-up": "transition-[transform,opacity,clip-path] duration-[900ms] ease-out",
  "mask-wipe": "transition-[clip-path,opacity] duration-[1000ms] ease-out",
  // Unused for the early-returned stagger branch; kept for type completeness.
  stagger: "transition-[transform,opacity] duration-700 ease-out",
};

const VARIANT_HIDDEN: Record<RevealVariant, string> = {
  "fade-up": "translate-y-6 opacity-0",
  "clip-up": "translate-y-8 opacity-0 [clip-path:inset(38%_0_0_0)]",
  "mask-wipe": "opacity-0 [clip-path:inset(0_0_100%_0)]",
  stagger: "",
};

const VARIANT_SHOWN: Record<RevealVariant, string> = {
  "fade-up": "translate-y-0 opacity-100",
  "clip-up": "translate-y-0 opacity-100 [clip-path:inset(0_0_0_0)]",
  "mask-wipe": "opacity-100 [clip-path:inset(0_0_0%_0)]",
  stagger: "",
};

/*
  Word-stagger for section headings. Splits visible text into words (preserving
  spaces) and lifts each in sequence behind a per-word mask — an editorial,
  on-brand "type surfacing" effect. Falls back to plain, fully-visible text on
  prefers-reduced-motion. SSR renders the readable text immediately (one mount
  flash is avoided because the gate keys off the same in-view check).
*/
export function RevealText({
  text,
  className,
  delay = 0,
  stagger = 55,
  id,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  id?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [shown, setShown] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    setAnimate(true);

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const words = text.split(" ");

  return (
    <h2 ref={ref} id={id} className={className}>
      {/* Plain text until JS arms the animation, so SSR + reduced-motion are readable. */}
      {!animate ? (
        text
      ) : (
        words.map((word, i) => (
          <span
            key={i}
            className="inline-block overflow-hidden align-bottom"
          >
            <span
              className={cn(
                "inline-block transition-[transform,opacity] duration-[800ms] ease-out will-change-transform",
                shown ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
              )}
              style={{
                transitionDelay: shown ? `${delay + i * stagger}ms` : "0ms",
              }}
            >
              {word}
            </span>
            {i < words.length - 1 ? " " : null}
          </span>
        ))
      )}
    </h2>
  );
}
