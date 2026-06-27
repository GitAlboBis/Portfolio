"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import { useLanguage } from "@/components/language-provider";
import { useHeroStore } from "@/webgl/store/heroStore";

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);

/*
  Bespoke, authored ease curves (registered once, referenced by name). The reveal
  rises with a soft anticipation and a gentle settle so the name "breathes" up out
  of the water instead of sliding linearly; the scrim lands a touch earlier for
  legibility.
*/
const EASE_EXPLODE = "hero-explode";
const EASE_REVEAL = "hero-reveal";
const EASE_SCRIM = "hero-scrim";
if (!gsap.parseEase(EASE_EXPLODE)) {
  CustomEase.create(EASE_EXPLODE, "M0,0 C0.16,0.84 0.3,1 1,1");
  CustomEase.create(EASE_REVEAL, "M0,0 C0.22,0.04 0.18,0.86 0.4,0.94 0.62,1.02 0.72,1 1,1");
  CustomEase.create(EASE_SCRIM, "M0,0 C0.3,0 0.2,1 1,1");
}

/*
  HERO — "Liquid Monogram" (Direction A). One pinned, scroll-driven sequence over
  the Pan di Zucchero footage. The footage (VideoBackdrop, in CanvasHost) scrubs
  from the first scroll; the transparent water "A" (WaterBallHero) floats over it;
  the title is REAL DOM type revealed by a clean bottom-up line-mask (no wobble, no
  per-letter tint, no glitch). No floating glass cards: the location is a cinematic
  lower-third, the name lockup lands in the graded resting frame.

  Beats (scroll order):
    entry     — water "A" over the first video frame; scroll cue breathes
    ~8-22%    explode  — the "A" disperses (drain, reworked in a later stage)
    ~22-56%   the footage scrubs alone — the cinematic dive; "Masua" lower-third
    ~56-86%   reveal   — eyebrow → "Alberto / Tuveri" → tagline, line-masked
    ~86-100%  hold     — the title lockup holds before the hero unpins
  Throughout, heroStore.video = raw scroll progress so the footage never stops.
*/
const CAPTION_IN_START = 0.24;
const CAPTION_IN_END = 0.34;
const CAPTION_OUT_START = 0.48;
const CAPTION_OUT_END = 0.55;

function captionOpacity(v: number): number {
  if (v <= CAPTION_IN_START || v >= CAPTION_OUT_END) return 0;
  if (v < CAPTION_IN_END) return (v - CAPTION_IN_START) / (CAPTION_IN_END - CAPTION_IN_START);
  if (v <= CAPTION_OUT_START) return 1;
  return 1 - (v - CAPTION_OUT_START) / (CAPTION_OUT_END - CAPTION_OUT_START);
}

export function Hero() {
  const { t } = useLanguage();
  const rootRef = useRef<HTMLElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const cueDotRef = useRef<HTMLSpanElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const setHero = (p: { explode?: number; reveal?: number; video?: number }) =>
        useHeroStore.getState().set(p);

      if (reduce) {
        // Static resting frame: A dispersed, mid-dive footage, title lockup shown
        // (no `from` tweens are created, so the DOM stays at its visible state).
        gsap.set(cueRef.current, { autoAlpha: 0 });
        gsap.set(scrimRef.current, { opacity: 1 });
        if (captionRef.current) captionRef.current.style.opacity = "0";
        setHero({ explode: 1, reveal: 1, video: 0.5 });
        return;
      }

      // The cinematic lower-third opacity rides the footage scrub window (video),
      // driven imperatively off the store (no React re-render per scroll frame).
      const applyCaption = (video: number) => {
        if (captionRef.current) captionRef.current.style.opacity = String(captionOpacity(video));
      };
      applyCaption(useHeroStore.getState().video);
      const unsub = useHeroStore.subscribe((s) => applyCaption(s.video));

      // standalone, looping "breath": a celeste dot glides down the hairline at the
      // top. Time-based (not scroll), killed under reduced-motion above.
      gsap.set(cueDotRef.current, { yPercent: -20, autoAlpha: 0 });
      const cueLoop = gsap.to(cueDotRef.current, {
        duration: 1.9,
        repeat: -1,
        repeatDelay: 0.45,
        keyframes: [
          { autoAlpha: 1, duration: 0.16, ease: "power1.out" },
          { yPercent: 260, duration: 0.68, ease: "sine.inOut" },
          { autoAlpha: 0, duration: 0.16, ease: "power1.in" },
        ],
      });

      const proxy = { explode: 0 };
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          onUpdate: (self) => setHero({ video: self.progress }),
        },
      });

      // fade the scroll cue the moment we leave the top
      tl.to(cueRef.current, { autoAlpha: 0, duration: 0.18, ease: "power2.in" }, 0);

      // BEAT 1 — explode EARLY: the "A" disperses (quick launch, long tail).
      tl.to(
        proxy,
        {
          explode: 1,
          duration: 0.8,
          ease: EASE_EXPLODE,
          onUpdate: () => setHero({ explode: proxy.explode }),
        },
        0.4,
      );

      // BEAT 2 — HELD: the footage scrubs ALONE (the cinematic dive). The eye rests
      // on Pan di Zucchero; the "Masua" lower-third rides this window.
      tl.addLabel("held", 1.2);
      tl.to({}, { duration: 1.6 }, "held");
      tl.addLabel("revealStart", ">");

      // BEAT 3 — reveal LATE: the title lockup surfaces, line-masked (eyebrow →
      // name lines → tagline). Real DOM type; the scrim darkens just ahead.
      tl.to(scrimRef.current, { opacity: 1, duration: 1.3, ease: EASE_SCRIM }, "revealStart");
      tl.from(
        ".hero-eyebrow",
        { opacity: 0, y: 22, filter: "blur(8px)", duration: 0.6, ease: EASE_REVEAL },
        "revealStart",
      );
      tl.from(
        ".hero-line-inner",
        {
          yPercent: 118,
          opacity: 0,
          filter: "blur(16px)",
          stagger: 0.16,
          duration: 1.25,
          ease: EASE_REVEAL,
        },
        "revealStart+=0.12",
      );
      tl.from(
        ".hero-tagline",
        { opacity: 0, y: 18, filter: "blur(6px)", duration: 0.7, ease: EASE_REVEAL },
        "revealStart+=0.85",
      );

      // BEAT 4 — hold the finished lockup before the hero unpins
      tl.to({}, { duration: 0.7 });

      return () => {
        cueLoop.kill();
        unsub();
      };
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} id="hero" className="relative z-10 h-[600dvh]">
      <div className="sticky top-0 flex h-dvh w-full items-center justify-center overflow-hidden">
        {/* Base legibility veil over the footage (subtle, top + bottom) */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(4,16,24,.34) 0%, transparent 26%, transparent 56%, rgba(4,16,24,.58) 100%)",
          }}
        />
        {/* Reveal scrim — darkens behind the title as it surfaces (animated) */}
        <div
          ref={scrimRef}
          aria-hidden
          className="absolute inset-0"
          style={{
            opacity: 0.18,
            background:
              "radial-gradient(64% 54% at 50% 50%, rgba(4,16,24,.74), rgba(4,16,24,.30) 60%, transparent 82%)",
          }}
        />

        {/* Cinematic lower-third — the location credit, in the footage's dark band.
            No box: a soft gradient + letterspacing carry it (film-credit style).
            Opacity rides heroStore.video via the subscription above. */}
        <div
          ref={captionRef}
          aria-hidden
          className="pointer-events-none absolute bottom-[13%] left-[6%] z-20 max-w-md text-left"
          style={{ opacity: 0 }}
        >
          <div
            aria-hidden
            className="absolute -inset-x-8 -inset-y-6 -z-10"
            style={{
              background:
                "radial-gradient(120% 120% at 0% 100%, rgba(4,16,24,.62), transparent 70%)",
            }}
          />
          <span
            className="block font-mono text-celeste"
            style={{ fontSize: "0.72rem", letterSpacing: "0.34em", textTransform: "uppercase" }}
          >
            {t.cinematic.eyebrow}
          </span>
          <p
            className="mt-2 font-serif text-foam"
            style={{ fontSize: "clamp(1.15rem,2.2vw,1.6rem)", textShadow: "0 1px 18px rgba(4,16,24,.7)" }}
          >
            {t.cinematic.caption}
          </p>
        </div>

        {/* Title lockup — REAL DOM type, line-masked reveal. The visible <h1> is the
            name; the role + tagline are quiet editorial lines. No glass cards. */}
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
          <p
            className="hero-eyebrow font-sans text-celeste/85"
            style={{
              fontSize: "clamp(0.7rem,1vw,0.82rem)",
              letterSpacing: "0.34em",
              textTransform: "uppercase",
              fontWeight: 600,
              filter: "blur(0px)",
            }}
          >
            {t.hero.role}
          </p>
          <h1
            className="hero-name mt-5 font-serif font-medium text-foam"
            style={{ fontSize: "clamp(3rem,11.5vw,9.5rem)", lineHeight: 0.9, letterSpacing: "-0.012em" }}
          >
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="hero-line-inner block" style={{ filter: "blur(0px)" }}>
                Alberto
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="hero-line-inner block" style={{ filter: "blur(0px)" }}>
                Tuveri
              </span>
            </span>
          </h1>
          <p
            className="hero-tagline mt-6 max-w-[34ch] font-sans text-mist"
            style={{ fontSize: "clamp(0.95rem,1.4vw,1.15rem)", filter: "blur(0px)" }}
          >
            {t.hero.tagline}
          </p>
        </div>

        {/* Scroll cue (entry only) — a celeste dot breathes down the hairline */}
        <div
          ref={cueRef}
          className="absolute inset-x-0 bottom-10 z-30 flex flex-col items-center gap-3"
        >
          <span
            className="font-mono text-foam/80"
            style={{
              fontSize: "0.66rem",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              textShadow: "0 1px 12px rgba(4,16,24,.7)",
            }}
          >
            {t.hero.scrollCue}
          </span>
          <span aria-hidden className="relative block h-10 w-px overflow-visible bg-foam/30">
            <span
              ref={cueDotRef}
              className="absolute left-1/2 top-0 block size-1.5 -translate-x-1/2 rounded-full bg-celeste"
              style={{ boxShadow: "0 0 8px rgba(155,211,238,.9)" }}
            />
          </span>
        </div>
      </div>
    </section>
  );
}
