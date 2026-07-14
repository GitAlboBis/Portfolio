"use client";

import * as React from "react";
import { useUI } from "@/store/ui";

/*
  SeaBackdrop — the REAL evening sea behind the water "A".

  A photoreal golden-hour ocean loop (Kling 3.0 from a single still used as BOTH
  start and end frame -> the native `loop` attribute closes seamlessly, no
  double-buffer tricks). The WebGPU letter composites transparently over it, so
  the "A" stands over actual shimmering water — sun right of center, exactly
  where the refraction cubemap keeps it.

  Layers (all aria-hidden, fixed, z-0 — DOM order stacks them):
  • the poster still paints IMMEDIATELY (LCP-safe, 16:9 cover) over the CSS
    gradient failsafe;
  • the video fades in over the poster once it can play. Mobile gets the 960
    encode; desktop the 1600.
  • reduced-motion: poster only — an honest photograph, zero motion, zero video
    bytes (the effect never mounts a <video>).
*/

const POSTER = "/coast/sea-poster.webp";
const SRC_DESKTOP = "/coast/sea-loop-1600.mp4";
const SRC_MOBILE = "/coast/sea-loop-960.mp4";

export function SeaBackdrop() {
  const reduced = useUI((s) => s.reducedMotion);
  const [src, setSrc] = React.useState<string | null>(null);
  const [live, setLive] = React.useState(false);

  React.useEffect(() => {
    if (reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setSrc(window.innerWidth < 768 ? SRC_MOBILE : SRC_DESKTOP);
  }, [reduced]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={POSTER} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {src && (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          src={src}
          onCanPlay={() => setLive(true)}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
          style={{ opacity: live ? 1 : 0 }}
        />
      )}
    </div>
  );
}
