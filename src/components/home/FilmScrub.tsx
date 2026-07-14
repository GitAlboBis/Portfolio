"use client";

import * as React from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";

/*
  FilmScrub — the shared scroll-scrubbed film band (the Apple/awwwards video-
  scrub pattern, house-ruled). Used by CoastInterlude (home, LA COSTA) and the
  journey's LA ROCCIA band (/about). Mechanics:

  • the section is `heightVh` tall; a sticky 100dvh inner pins the frame while
    scroll drives the film. ScrollTrigger only writes a 0..1 target; the seek
    happens on the SHARED gsap.ticker with a lerp — direct writes per scroll
    event stutter, the lerp keeps 24fps footage silky and coasts to a stop.
  • footage must be encoded scrub-friendly (dense keyframes — ffmpeg -g 6).
  • bytes are lazy (src attaches via IO ~900px out) but the section OWNS its
    height from first paint — no CLS.
  • caption rises on a scrub as the band enters; a dusk scrim keeps paper
    text AA over bright footage.
  • reduced-motion: no video at all — the poster still, full caption, no pin.
  • <video> is muted/playsinline/aria-hidden; the caption is real content.
*/

export type FilmScrubProps = {
  srcDesktop: string;
  srcMobile: string;
  poster: string;
  eyebrow: string;
  title: string;
  meta: string;
  /** pin length in vh (default 260) */
  heightVh?: number;
};

export function FilmScrub({ srcDesktop, srcMobile, poster, eyebrow, title, meta, heightVh = 260 }: FilmScrubProps) {
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
          setSrc(window.innerWidth < 768 ? srcMobile : srcDesktop);
          io.disconnect();
        }
      },
      { rootMargin: "900px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, srcDesktop, srcMobile]);

  useGSAP(
    () => {
      const section = root.current;
      const video = videoRef.current;
      if (!section || reduced) return;

      // caption rises as the band takes the viewport (scrubbed, reversible)
      gsap.fromTo(
        "[data-film-reveal]",
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
      aria-label={eyebrow}
      className="relative bg-night"
      style={{ height: reduced ? "100dvh" : `${heightVh}vh` }}
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
            poster={poster}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          // reduced-motion / pre-load: the honest still
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
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
          <p data-film-reveal className="t-eyebrow eyebrow-tick text-paper/85">
            {eyebrow}
          </p>
          <h2 data-film-reveal className="t-display mt-4 max-w-[16ch] text-paper">
            {title}
          </h2>
          <p data-film-reveal className="t-meta mt-5 text-paper/75">
            {meta}
          </p>
        </div>
      </div>
    </section>
  );
}
