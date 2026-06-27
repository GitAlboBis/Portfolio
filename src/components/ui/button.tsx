"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
  Pill buttons — cinematic-ocean language, now with haptic motion.
  - signal: solid foam -> celeste on hover (primary CTA), soft celeste cast shadow
  - outline: frosted "water glass" (secondary)
  The whole control is MAGNETIC: on a fine pointer it drifts toward the cursor
  and springs back on a custom curve; presses compress it. Touch + reduced-motion
  get the calm static button. Variant names kept stable for existing call sites.
*/
const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full font-sans text-xs font-semibold uppercase tracking-[0.2em] transition-[background-color,border-color,color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        signal:
          "bg-foam text-abyss hover:bg-celeste hover:shadow-[0_20px_55px_-26px_rgb(155_211_238/0.75)]",
        outline: "water-glass text-foam hover:border-celeste/60",
        ghost: "text-foam/80 hover:text-foam",
        link: "text-foam/90 underline-offset-4 hover:underline",
      },
      size: {
        md: "h-12 px-7",
        sm: "h-9 px-5",
      },
    },
    defaultVariants: { variant: "signal", size: "md" },
  },
);

type ButtonProps = VariantProps<typeof buttonVariants> & {
  children: ReactNode;
  className?: string;
  href?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  ariaLabel?: string;
};

function Sheen() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 -left-1/4 w-1/4 -skew-x-12 bg-foam/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:animate-[water-sheen_0.9s_ease] motion-reduce:hidden"
    />
  );
}

const MAGNET_STRENGTH = 0.28; // how far the control leans into the cursor
const MAGNET_MAX = 9; // px clamp

export function Button({
  children,
  className,
  variant,
  size,
  href,
  type = "button",
  onClick,
  ariaLabel,
}: ButtonProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);

  const onMove = (e: PointerEvent<HTMLSpanElement>) => {
    const el = wrapRef.current;
    if (!el || e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const clamp = (v: number) =>
      Math.max(-MAGNET_MAX, Math.min(MAGNET_MAX, v * MAGNET_STRENGTH));
    el.style.transform = `translate3d(${clamp(dx).toFixed(2)}px, ${clamp(
      dy * 0.7,
    ).toFixed(2)}px, 0)`;
  };
  const onLeave = () => {
    const el = wrapRef.current;
    if (el) el.style.transform = "translate3d(0,0,0)";
  };

  const classes = cn(buttonVariants({ variant, size }), className);
  const inner = (
    <>
      <Sheen />
      <span className="relative z-10 inline-flex items-center gap-2.5">
        {children}
      </span>
    </>
  );

  const control = href ? (
    <a
      href={href}
      className={classes}
      aria-label={ariaLabel}
      onClick={onClick}
      {...(href.startsWith("http")
        ? { target: "_blank", rel: "noreferrer" }
        : {})}
    >
      {inner}
    </a>
  ) : (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {inner}
    </button>
  );

  return (
    <span
      ref={wrapRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ transform: "translate3d(0,0,0)" }}
      className="inline-flex transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform"
    >
      {control}
    </span>
  );
}

export { buttonVariants };
