"use client";

import * as React from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";

/*
  CoastInterlude — "LA COSTA": the real place the whole site language comes
  from. A full-bleed, SCROLL-SCRUBBED drone shot of Pan di Zucchero at golden
  hour (Alberto's Sardinian sea stack — the same sunset the hero cubemap and
  the tokens are built from), pinned for ~1.6 viewport-heights between the
  works and the stack section: the portfolio breathes real air once before
  the night falls.

  Mechanics (the Apple/awwwards video-scrub pattern, tuned to house rules):
  • the section is 260vh tall; a sticky 100dvh inner pins the frame while
    scroll drives the film. ScrollTrigger only writes a 0..1 target; the seek
    itself happens on the SHARED gsap.ticker with a lerp — direct writes on
    every scroll event stutter, the lerp keeps the 24fps footage silky and
    coasts to a stop like the site's tidal easings.
  • footage is re-encoded for scrubbing (keyframe every 6 frames — see
    HANDOFF): 1600×900 ≈ 8.5MB desktop, 960×540 ≈ 3.2MB mobile. The <video>
    gets its src only when the band comes within ~900px (IntersectionObserver
    on the section itself — the section must OWN its height from first paint,
    so LazyOnView's mount-on-approach would CLS; only the bytes are lazy).
  • caption (eyebrow/title/meta, EN/IT via dict.coast) rises on a scrub as
    the band enters; a dusk scrim keeps paper text AA over the bright sky.
  • reduced-motion: no video at all — the poster still, full caption, no pin
    (section collapses to one viewport). The still is an honest photograph.
  • the <video> is muted/playsinline/aria-hidden; the caption is the real
    content (this is the page's one photographic beat, not decoration).
*/

const SRC_DESKTOP = "/coast/coast-1600.mp4";
const SRC_MOBILE = "/coast/coast-960.mp4";
const POSTER = "/coast/coast-poster.jpg";

export function CoastInterlude() {
  const t = useDict();
  const reduced = useUI((s) => s.reducedMotion);
  const root = React.useRef<HTMLElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [src, setSrc] = React.useState<string | null>(null);

  // Lazy BYTES, not lazy LAYOUT: the src attaches when the band nears.
  React.useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setSrc(window.innerWidth < 768 ? SRC_MOBILE : SRC_DESKTOP);
          io.disconnect();
        }
      },
      { rootMargin: "900px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  useGSAP(
    () => {
      const section = root.current;
      const video = videoRef.current;
      if (!section || reduced) return;

      // caption rises as the band takes the viewport (scrubbed, reversible)
      gsap.fromTo(
        "[data-coast-reveal]",
        { y: 44, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.09,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top 60%", end: "top 2%", scrub: true },
        },
      );

      if (!video || !src) return;
      let duration = 0;
      let target = 0;
      let current = 0;
      const onMeta = () => {
        duration = video.duration || 0;
      };
      video.addEventListener("loadedmetadata", onMeta);
      if (video.readyState >= 1) onMeta();

      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          target = self.progress;
        },
      });

      // seek on the shared ticker: lerp toward the scroll target so the film
      // glides (and settles) instead of stepping with each scroll event
      const tick = () => {
        if (!duration) return;
        current += (target - current) * 0.14;
        const seek = Math.min(duration - 0.05, Math.max(0, current * duration));
        if (Math.abs(video.currentTime - seek) > 0.001) video.currentTime = seek;
      };
      gsap.ticker.add(tick);

      return () => {
        gsap.ticker.remove(tick);
        st.kill();
        video.removeEventListener("loadedmetadata", onMeta);
      };
    },
    { scope: root, dependencies: [reduced, src] },
  );

  return (
    <section
      ref={root}
      aria-label={t.coast.eyebrow}
      className="relative bg-night"
      style={{ height: reduced ? "100dvh" : "260vh" }}
    >
      <div className="sticky top-0 h-dvh overflow-hidden">
        {src && !reduced ? (
          <video
            ref={videoRef}
            aria-hidden
            muted
            playsInline
            preload="auto"
            src={src}
            poster={POSTER}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          // reduced-motion / pre-load: the honest still
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={POSTER}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* dusk scrim — paper caption stays AA over the bright sky/sea */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[48vh]"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklab, var(--color-night) 82%, var(--color-dusk)) 0%, color-mix(in srgb, color-mix(in oklab, var(--color-night) 82%, var(--color-dusk)) 62%, transparent) 52%, transparent 100%)",
            opacity: 0.72,
          }}
        />

        <div className="container-edit absolute inset-x-0 bottom-0 pb-[clamp(2.5rem,7vh,5rem)]">
          <p data-coast-reveal className="t-eyebrow eyebrow-tick text-paper/85">
            {t.coast.eyebrow}
          </p>
          <h2 data-coast-reveal className="t-display mt-4 max-w-[16ch] text-paper">
            {t.coast.title}
          </h2>
          <p data-coast-reveal className="t-meta mt-5 text-paper/75">
            {t.coast.meta}
          </p>
        </div>
      </div>
    </section>
  );
}
