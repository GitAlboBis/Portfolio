import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Mono uppercase label — the recurring "depth coordinate" motif. */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}
