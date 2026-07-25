"use client";

/*
  NightSkyLazy — code-splits the night-sky shader OUT of the home's critical
  JS graph. LazyOnView already deferred the GL *context*; this defers the
  *module* too (WP-10: the boot chunks were carrying below-the-fold shader
  code through the LCP dependency chain). ssr:false is safe: the wrapper's
  solid bg-night failsafe IS the server render.
*/

import dynamic from "next/dynamic";

export const NightSkyLazy = dynamic(
  () => import("@/components/atmosphere/NightSky").then((m) => m.NightSky),
  { ssr: false },
);
