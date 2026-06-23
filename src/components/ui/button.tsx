import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-[0.18em] transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        signal: "bg-aqua text-abyss hover:bg-aqua-hot",
        outline: "border border-aqua/40 text-foam hover:border-aqua hover:text-aqua",
        ghost: "text-ink-mute hover:text-foam",
        link: "text-aqua underline-offset-4 hover:underline",
      },
      size: {
        md: "h-11 px-6",
        sm: "h-9 px-4",
      },
    },
    defaultVariants: { variant: "signal", size: "md" },
  },
);

type ButtonProps = VariantProps<typeof buttonVariants> & {
  children: ReactNode;
  className?: string;
  /** When set, renders an <a>. External (http) links open in a new tab. */
  href?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  ariaLabel?: string;
};

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
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

export { buttonVariants };
