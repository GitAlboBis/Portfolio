"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/components/language-provider";

/* Sparse, faint starfield (twilight sea sky). */
const STARS = [
  "radial-gradient(1.3px 1.3px at 14% 18%, rgba(244,250,251,.75), transparent 60%)",
  "radial-gradient(1px 1px at 28% 42%, rgba(244,250,251,.5), transparent 60%)",
  "radial-gradient(1.2px 1.2px at 47% 24%, rgba(244,250,251,.6), transparent 60%)",
  "radial-gradient(1px 1px at 63% 38%, rgba(244,250,251,.45), transparent 60%)",
  "radial-gradient(1.4px 1.4px at 78% 20%, rgba(244,250,251,.6), transparent 60%)",
  "radial-gradient(1px 1px at 88% 48%, rgba(244,250,251,.4), transparent 60%)",
  "radial-gradient(1px 1px at 36% 62%, rgba(244,250,251,.35), transparent 60%)",
  "radial-gradient(1.1px 1.1px at 70% 66%, rgba(244,250,251,.4), transparent 60%)",
].join(",");

/* Placeholder silhouette of Pan di Zucchero (the sea stack near Masua).
   The peak dissolves into haze at the top via a gradient mask. Replaced later
   by the Higgsfield / real footage of the scoglio (see docs/05-CINEMATIC-SCROLL.md). */
function Scoglio() {
  return (
    <svg
      viewBox="0 0 600 700"
      className="h-[80vh] w-auto max-w-none"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <linearGradient id="rock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2f5666" />
          <stop offset="45%" stopColor="#173e4f" />
          <stop offset="100%" stopColor="#0a2530" />
        </linearGradient>
        <linearGradient id="rockFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="34%" stopColor="#fff" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id="rockMask">
          <rect x="0" y="0" width="600" height="700" fill="url(#rockFade)" />
        </mask>
      </defs>
      <g mask="url(#rockMask)">
        <path
          d="M150 700 L188 486 L210 440 L232 332 L250 286 L272 214 L292 150 L300 118 L312 168 L330 246 L348 300 L366 372 L386 452 L410 540 L436 700 Z"
          fill="url(#rock)"
        />
        {/* lit edge */}
        <path d="M300 118 L312 168 L330 246 L300 250 Z" fill="#3f6a7c" opacity="0.7" />
      </g>
    </svg>
  );
}

export function Hero() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const rockRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const update = () => {
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      const e = reduce ? 0.55 : p;
      if (rockRef.current) {
        rockRef.current.style.transform = `translate3d(0, ${(1 - e) * 26 - 2}%, 0) scale(${1.04 + e * 0.22})`;
        rockRef.current.style.opacity = String(0.4 + e * 0.6);
      }
      if (titleRef.current) {
        titleRef.current.style.transform = `translate3d(0, ${e * -3.5}vh, 0)`;
      }
      if (cueRef.current) {
        cueRef.current.style.opacity = String(Math.max(0, 1 - e * 3.2));
      }
    };

    update();
    if (reduce) return;
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section ref={sectionRef} id="hero" className="relative h-[220vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* twilight sea sky */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #061c27 0%, #0a2a39 45%, #14475c 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-70"
          style={{ backgroundImage: STARS }}
        />

        {/* the scoglio, rising from below as you scroll */}
        <div
          ref={rockRef}
          aria-hidden
          className="absolute inset-x-0 bottom-0 flex justify-center will-change-transform"
          style={{ transform: "translate3d(0,24%,0) scale(1.04)", opacity: 0.4 }}
        >
          <Scoglio />
        </div>

        {/* sea / foam at the base */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[20vh]"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(90,167,190,.20) 55%, rgba(207,234,240,.14))",
          }}
        />

        {/* big white name, in front of the rising rock */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div ref={titleRef} className="will-change-transform">
            <p className="label mb-6 text-foam/75">Portfolio</p>
            <h1
              className="display-hero uppercase text-foam"
              style={{
                textShadow: "0 2px 40px rgba(4,16,24,.55)",
                letterSpacing: "0.01em",
              }}
            >
              Alberto
              <br />
              Tuveri
            </h1>
          </div>
        </div>

        {/* scroll cue */}
        <div
          ref={cueRef}
          className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-3"
        >
          <span className="label text-foam/70">{t.hero.scrollCue}</span>
          <span aria-hidden className="h-10 w-px bg-foam/30" />
        </div>
      </div>
    </section>
  );
}
