"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import { useLanguage } from "@/components/language-provider";
import { useHeroStore } from "@/webgl/store/heroStore";
import { LiquidText } from "@/components/liquid-text";

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);

/*
  Bespoke, authored ease curves (registered once, referenced by name). These give
  the explode/reveal beats a hand-tuned feel that the built-in eases can't: the
  burst leaves fast and decays late; the title rises with a soft anticipation and
  a gentle settle so it "breathes" up out of the water instead of sliding linearly.
*/
const EASE_EXPLODE = "hero-explode";
const EASE_REVEAL = "hero-reveal";
const EASE_SCRIM = "hero-scrim";
if (!gsap.parseEase(EASE_EXPLODE)) {
  // quick launch, long tail — the "A" bursts then dissipates slowly
  CustomEase.create(EASE_EXPLODE, "M0,0 C0.16,0.84 0.3,1 1,1");
  // soft anticipation, confident rise, eased settle — the title surfaces
  CustomEase.create(EASE_REVEAL, "M0,0 C0.22,0.04 0.18,0.86 0.4,0.94 0.62,1.02 0.72,1 1,1");
  // scrim follows the reveal but lands a touch earlier for legibility
  CustomEase.create(EASE_SCRIM, "M0,0 C0.3,0 0.2,1 1,1");
}

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
/*
  CINEMATIC CAPTION window — the eyebrow + caption are pinned over the silent
  footage scrub. They fade IN as the explosion clears, HOLD through the lone
  cinematic beat, and are gone before the title starts surfacing. Driven by
  heroStore.video (raw scroll progress), mirroring the scrim/fade pattern.
*/
const CAPTION_IN_START = 0.24;
const CAPTION_IN_END = 0.34;
const CAPTION_OUT_START = 0.46;
const CAPTION_OUT_END = 0.52;

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
  const thesisRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const setHero = (p: { explode?: number; reveal?: number; video?: number }) =>
        useHeroStore.getState().set(p);

      if (reduce) {
        gsap.set(cueRef.current, { autoAlpha: 0 });
        gsap.set(scrimRef.current, { opacity: 1 });
        // final state: thesis surfaced with the title; caption (a mid-scrub-only
        // beat) is not part of the resting frame, so it stays hidden.
        if (thesisRef.current) thesisRef.current.style.opacity = "1";
        if (captionRef.current) captionRef.current.style.opacity = "0";
        setHero({ explode: 1, reveal: 1, video: 0.5 });
        return;
      }

      // DOM overlay opacities are driven imperatively off the store (no React
      // re-render per scroll frame): the thesis surfaces WITH the name (reveal),
      // the cinematic caption rides the footage scrub window (video).
      const applyOverlays = (reveal: number, video: number) => {
        if (thesisRef.current) {
          // ease the last stretch of reveal so the lines arrive just behind the name
          const o = Math.max(0, Math.min(1, (reveal - 0.35) / 0.5));
          thesisRef.current.style.opacity = String(o);
        }
        if (captionRef.current) {
          captionRef.current.style.opacity = String(captionOpacity(video));
        }
      };
      applyOverlays(useHeroStore.getState().reveal, useHeroStore.getState().video);
      const unsubOverlays = useHeroStore.subscribe((s) => applyOverlays(s.reveal, s.video));

      // standalone, looping "breath": a celeste dot glides down the hairline while
      // the user is still at the top. Lives outside the scrub timeline (time-based,
      // not scroll-based) and is killed under reduced-motion above. The keyframes
      // fade the dot in at the top, ride it down the rule, then fade it out.
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

      // fade the whole scroll cue (label + descending dot) the moment we leave top
      tl.to(cueRef.current, { autoAlpha: 0, duration: 0.18, ease: "power2.in" }, 0);

      // BEAT 1 — explode EARLY: the "A" bursts on the footage with a quick launch
      // and a long, dissipating tail (bespoke ease), then fades out.
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

      // BEAT 2 — HELD: the footage scrubs ALONE, the cinematic breath. A real,
      // explicit empty beat so the title doesn't crowd the explosion; the eye
      // rests on Pan di Zucchero before the words surface.
      tl.addLabel("held", 1.2);
      tl.to({}, { duration: 1.6 }, "held");
      tl.addLabel("revealStart", ">");

      // BEAT 3 — reveal LATE: "Portfolio" then "Alberto Tuveri" surface from the
      // water with an authored rise; the scrim darkens just ahead for legibility.
      tl.to(
        proxy,
        {
          reveal: 1,
          duration: 1.5,
          ease: EASE_REVEAL,
          onUpdate: () => setHero({ reveal: proxy.reveal }),
        },
        "revealStart",
      );
      tl.to(scrimRef.current, { opacity: 1, duration: 1.3, ease: EASE_SCRIM }, "revealStart");

      // BEAT 4 — hold the finished title card before the hero unpins
      tl.to({}, { duration: 0.7 });

      return () => {
        cueLoop.kill();
        unsubOverlays();
      };
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} id="hero" className="relative z-10 h-[600dvh]">
      <div className="sticky top-0 flex h-dvh w-full items-center justify-center overflow-hidden">
        {/* Real document heading for SR / SEO — the visible title is the WebGL LiquidText */}
        <h1 className="sr-only">Alberto Tuveri — {t.hero.role}</h1>
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

        {/* Cinematic caption — pinned over the footage during the silent scrub.
            Decorative (the words are atmosphere, not document content); opacity is
            driven by heroStore.video via the imperative subscription above. */}
        <div
          ref={captionRef}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[14%] z-20 flex flex-col items-center px-6 text-center"
          style={{ opacity: 0 }}
        >
          <div className="inline-flex flex-col items-center gap-3 rounded-2xl bg-abyss/70 px-7 py-5 backdrop-blur-sm">
            {/* Lighter celeste so the eyebrow clears >=4.5:1 even where the abyss/70
                pill sits over the brightest sunlit frame. */}
            <span className="eyebrow" style={{ color: "#c9e8f7" }}>
              {t.cinematic.eyebrow}
            </span>
            <span
              className="lead max-w-[28ch] text-foam"
              style={{ textShadow: "0 1px 14px rgba(4,16,24,.6)" }}
            >
              {t.cinematic.caption}
            </span>
          </div>
        </div>

        {/* Liquid-reveal title (Portfolio + Alberto Tuveri) */}
        <LiquidText />

        {/* Hero thesis — real, selectable, translatable copy below the WebGL title.
            Surfaces WITH the name: opacity driven by heroStore.reveal (subscription
            above). Sits in the lower band so it never fights the liquid letters. */}
        <div
          ref={thesisRef}
          className="absolute inset-x-0 bottom-[18%] z-20 flex flex-col items-center px-6 text-center"
          style={{ opacity: 0 }}
        >
          {/* Controlled dark surface: a blurred abyss pill keeps the thesis copy
              >=4.5:1 even where it surfaces over the brightest sunlit sea frame
              (a bare text-shadow read ~1.2:1 — the WCAG 1.4.3 regression). */}
          <div className="inline-flex flex-col items-center gap-3 rounded-2xl bg-abyss/70 px-7 py-5 backdrop-blur-sm">
            <p className="eyebrow text-celeste">{t.hero.role}</p>
            <p
              className="lead max-w-[34ch] text-foam"
              style={{ textShadow: "0 1px 14px rgba(4,16,24,.55)" }}
            >
              {t.hero.tagline}
            </p>
          </div>
        </div>

        {/* Scroll cue (entry only) — a celeste dot breathes down the hairline */}
        <div
          ref={cueRef}
          className="absolute inset-x-0 bottom-10 z-30 flex flex-col items-center gap-3"
        >
          {/* Controlled dark surface: a blurred abyss pill keeps the cue >=4.5:1
              even over the brightest sea frame (no fragile gradient guesswork). */}
          <span className="label rounded-full bg-abyss/70 px-4 py-2 text-foam backdrop-blur-sm">
            {t.hero.scrollCue}
          </span>
          {/* the hairline track + the descending celeste dot */}
          <span aria-hidden className="relative block h-10 w-px overflow-visible bg-foam/35">
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
