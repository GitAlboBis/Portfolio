import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
  Pill buttons in the cinematic-ocean language.
  - signal: solid golden-sun (the one warm accent, primary CTA)
  - outline: frosted "water glass" (white-based secondary)
  Variant names kept stable so existing call sites keep working.
*/
const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-sans text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        signal: "bg-foam text-abyss hover:bg-celeste",
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
  // subtle caustic sweep on hover (disabled under reduced motion)
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 -left-1/4 w-1/4 -skew-x-12 bg-foam/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:animate-[water-sheen_0.9s_ease] motion-reduce:hidden"
    />
  );
}

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
  const classes = cn(buttonVariants({ variant, size }), className);
  const inner = (
    <>
      <Sheen />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </>
  );

  if (href) {
    const external = href.startsWith("http");
    return (
      <a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        onClick={onClick}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {inner}
      </a>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}

export { buttonVariants };
