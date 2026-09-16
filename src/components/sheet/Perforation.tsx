import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Perforation — the tear line between sections (REDESIGN-SPEC §C.4):
 * `border-top: 1px dotted ink` plus two 6px paper holes punched at the
 * margins. Pure CSS (`.perforation` in globals.css); decorative — the
 * sectioning is done by the regions themselves, so it is hidden from AT.
 */
export function Perforation({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("perforation", className)} {...rest} />;
}
