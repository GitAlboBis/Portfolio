"use client";

/*
  EscortLazy — code-splits the companion-flock canvas out of the home's
  critical JS graph (WP-10). The escort is invisible until scroll velocity
  summons it, so a ~1s late chunk mount is imperceptible; ssr:false is safe
  (it renders a decorative canvas, nothing at rest).
*/

import dynamic from "next/dynamic";

export const EscortLazy = dynamic(
  () => import("@/components/atmosphere/Escort").then((m) => m.Escort),
  { ssr: false },
);
