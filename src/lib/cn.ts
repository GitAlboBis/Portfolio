import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn — class-name composer.
 *
 * clsx flattens conditional class lists; twMerge resolves Tailwind utility
 * conflicts so the LAST writer wins (critical for CVA variant overrides — e.g.
 * passing `className="bg-shallow"` to a button whose variant sets `bg-deep`
 * must yield `bg-shallow`, not both). Without twMerge cva overrides ship as
 * class-order bugs.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
