"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/**
 * Button — THE JOB ORDER primitive (CVA). REDESIGN-SPEC §A / §C.
 *
 * Two real variants:
 *   primary — ink fill, paper text (16.73:1); hover = graphite-deep fill.
 *   ruled   — 1px ink border on paper; hover = paper-field fill (§C.7 micro).
 * Radius 0 (≤ 2px allowed, none used), no pill, no sheen, no shadow, no
 * gradient, no night. Hover feedback is a 120ms linear colour swap.
 * Focus: the global `:focus-visible` ring (2px safety outer + 1px ink inner).
 *
 * For links, apply `buttonVariants(...)` to an <a>.
 */
export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none",
    "rounded-none border font-semibold uppercase tracking-[0.06em]",
    "[font-variation-settings:'wdth'_87] leading-none",
    "transition-[background-color,color,border-color] duration-[var(--dur-hover)] ease-linear",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "border-ink bg-ink text-paper hover:bg-graphite-deep hover:border-graphite-deep",
        ruled: "border-ink bg-paper text-ink hover:bg-paper-field",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-5 text-[0.8125rem]",
        lg: "h-[var(--cell-h)] px-6 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </button>
  ),
);
Button.displayName = "Button";
