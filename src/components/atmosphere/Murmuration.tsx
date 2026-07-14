"use client";

import dynamic from "next/dynamic";
import { useUI } from "@/store/ui";
import { useHydrated } from "@/lib/use-hydrated";
import { LazyOnView } from "@/components/motion/LazyOnView";

/*
  Murmuration — shell for the About flock (same split as WorksGallery/
  WorksGalleryCanvas): this file has NO three/R3F imports, so the WebGL chunk
  stays off the initial bundle. The canvas is code-split (dynamic, ssr:false)
  and only mounts once the About band nears the viewport (LazyOnView).

  Reduced-motion: a murmuration IS motion — there is no honest static version
  of it, so we mount nothing and the band rests on GoldenHaze's static
  atmosphere (bleeds, horizon, grain). `&& hydrated` mirrors WorksGallery:
  the store flag is false in the server HTML, so branching before hydration
  would mismatch.
*/

const MurmurationCanvas = dynamic(
  () => import("@/components/atmosphere/MurmurationCanvas").then((m) => m.MurmurationCanvas),
  { ssr: false },
);

export function Murmuration() {
  const reduced = useUI((s) => s.reducedMotion);
  const hydrated = useHydrated();
  if (reduced && hydrated) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* NEGATIVE rootMargin: About starts flush under the 100dvh hero, so a
          positive margin would mount the GL context at first paint. -280 defers
          it until the hero is ~1/3 scrolled away; the flock entering as a loose
          cloud (form ramps from 0) makes the late mount read as arrival. */}
      <LazyOnView style={{ position: "absolute", inset: 0 }} rootMargin={-280}>
        <MurmurationCanvas />
      </LazyOnView>
    </div>
  );
}
