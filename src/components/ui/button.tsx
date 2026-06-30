"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/**
 * Button — Golden Hour design-system primitive (CVA).
 *
 * Variants: primary (ember fill, ink text -> ember-ink + paper on hover), secondary
 * (warm outline -> ember), ghost (text-only), night (paper outline for the dark
 * band -> amber). The hover sheen fires on hover only (a state change), never a
 * perpetual decorative loop, and is removed under prefers-reduced-motion.
 *
 * For links, apply `buttonVariants(...)` to an <a>; for actions use <Button>.
 */
export const buttonVariants = cva(
  [
    "group relative inline-flex items-center justify-center gap-2 overflow-hidden",
    "font-sans uppercase tracking-[0.06em] whitespace-nowrap select-none font-semibold",
    "rounded-full transition-[transform,background-color,border-color,color]",
    "duration-300 ease-[var(--ease-tide)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        // CTA: ember fill with INK text (AA — white on ember is only large-AA),
        // darkens to ember-ink + paper text on hover.
        primary:
          "bg-ember text-ink border border-ember-ink/20 hover:bg-ember-ink hover:text-paper",
        // Secondary: warm outline that lights to ember.
        secondary:
          "bg-transparent text-ink border border-rule-strong hover:border-ember hover:text-ember-ink",
        // Ghost: text-only, tertiary/inline.
        ghost: "bg-transparent text-ink-mute hover:text-ink px-2",
        // Night-band CTA (footer / dark section): paper outline on night.
        night:
          "bg-transparent text-paper border border-paper/30 hover:border-amber hover:text-amber focus-visible:ring-amber focus-visible:ring-offset-night",
      },
      size: {
        sm: "h-9 px-5 text-xs",
        md: "h-11 px-6 text-sm",
        lg: "h-14 px-8 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Renders the hover sheen (a single warm light sweep). Default true on primary. */
  sheen?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, sheen, children, ...props }, ref) => {
    const showSheen = sheen ?? variant !== "ghost";
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {showSheen ? <Sheen /> : null}
        <span className="relative z-10 inline-flex items-center gap-2">
          {children}
        </span>
      </button>
    );
  },
);
Button.displayName = "Button";

/**
 * Sheen — a single oblique light sweep that crosses the button on hover.
 * Off-canvas at rest; translates across once per hover. Hidden under
 * reduced motion (motion-reduce:hidden).
 */
function Sheen() {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-0 -translate-x-[120%] skew-x-[-18deg]",
        "bg-gradient-to-r from-transparent via-white/45 to-transparent",
        "transition-transform duration-700 ease-[var(--ease-tide)]",
        "group-hover:translate-x-[120%]",
        "motion-reduce:hidden",
      )}
    />
  );
}
