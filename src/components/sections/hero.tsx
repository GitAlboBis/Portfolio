"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLanguage } from "@/components/language-provider";
import { useHeroStore } from "@/webgl/store/heroStore";
import { LiquidText } from "@/components/liquid-text";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/*
  HERO — one pinned, scroll-driven sequence over the Pan di Zucchero footage.
  The footage (VideoBackdrop, in CanvasHost) is the BACKGROUND and scrubs from the
  very first scroll; the transparent water "A" (WaterBallHero) floats over it; the
  liquid title (LiquidText) reveals last. One scrubbed GSAP timeline writes the
  heroStore that all three read.

  Beats (scroll order):
    entry     — water "A" over the first video frame (entry focus-pull on mount)
    ~8-24%    explode  — the "A" bursts on the footage and fades out
    ~24-56%   the footage scrubs alone (the cinematic beat)
    ~56-86%   reveal   — "Portfolio" then "Alberto Tuveri" emerge from water
    ~86-100%  hold     — the title card holds before the hero unpins
  Throughout, heroStore.video = raw scroll progress so the footage never stops.
*/
export function Hero() {
  const { t } = useLanguage();
  const rootRef = useRef<HTMLElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const setHero = (p: { explode?: number; reveal?: number; video?: number }) =>
        useHeroStore.getState().set(p);

      if (reduce) {
        gsap.set(cueRef.current, { autoAlpha: 0 });
        gsap.set(scrimRef.current, { opacity: 1 });
        setHero({ explode: 1, reveal: 1, video: 0.5 });
        return;
      }

      const proxy = { explode: 0, reveal: 0 };
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          onUpdate: (self) => setHero({ video: self.progress }), // footage scrubs from scroll 0
        },
      });

      // fade the scroll cue as we leave the top
      tl.to(cueRef.current, { autoAlpha: 0, duration: 0.2 }, 0);

      // explode EARLY — the "A" bursts on the footage, then fades out
      tl.to(
        proxy,
        { explode: 1, duration: 0.8, onUpdate: () => setHero({ explode: proxy.explode }) },
        0.4,
      );

      // reveal LATE — "Portfolio" then "Alberto Tuveri" emerge; scrim darkens for legibility
      tl.to(
        proxy,
        { reveal: 1, duration: 1.5, onUpdate: () => setHero({ reveal: proxy.reveal }) },
        2.8,
      );
      tl.to(scrimRef.current, { opacity: 1, duration: 1.3, ease: "power1.in" }, 2.8);

      // hold the finished title card before the hero unpins
      tl.to({}, { duration: 0.7 });
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} id="hero" className="relative z-10 h-[600vh]">
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        {/* Base legibility veil over the footage (subtle) */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(4,16,24,.34) 0%, transparent 26%, transparent 60%, rgba(4,16,24,.5) 100%)",
          }}
        />
        {/* Reveal scrim — darkens behind the title as it emerges (animated) */}
        <div
          ref={scrimRef}
          aria-hidden
          className="absolute inset-0"
          style={{
            opacity: 0.18,
            background:
              "radial-gradient(62% 52% at 50% 50%, rgba(4,16,24,.72), rgba(4,16,24,.28) 60%, transparent 80%)",
          }}
        />

        {/* Liquid-reveal title (Portfolio + Alberto Tuveri) */}
        <LiquidText />

        {/* Scroll cue (entry only) */}
        <div
          ref={cueRef}
          className="absolute inset-x-0 bottom-10 z-30 flex flex-col items-center gap-3"
        >
          <span className="label text-foam/80">{t.hero.scrollCue}</span>
          <span aria-hidden className="h-10 w-px bg-foam/40" />
        </div>
      </div>
    </section>
  );
}
