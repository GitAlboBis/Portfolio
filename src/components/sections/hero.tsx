"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/components/language-provider";

/* Placeholder silhouette of Pan di Zucchero in its real colors (pale sunlit
   limestone in a turquoise sea). Replaced later by the bright drone / Higgsfield
   footage mounted in this same slot — see docs/05-CINEMATIC-SCROLL.md. */
function Scoglio() {
  return (
    <svg
      viewBox="0 0 600 720"
      className="h-[80vh] w-auto max-w-none"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <linearGradient id="lime" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#f0e8d6" />
          <stop offset="40%" stopColor="#d9c49a" />
          <stop offset="78%" stopColor="#b9ad97" />
          <stop offset="100%" stopColor="#8f9499" />
        </linearGradient>
        <linearGradient id="topHaze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="16%" stopColor="#fff" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id="hazeMask">
          <rect x="0" y="0" width="600" height="720" fill="url(#topHaze)" />
        </mask>
      </defs>
      <g mask="url(#hazeMask)">
        <path
          d="M150 720 L188 506 L210 458 L232 346 L250 298 L272 224 L292 156 L300 122 L312 174 L330 258 L348 314 L366 388 L386 470 L410 560 L436 720 Z"
          fill="url(#lime)"
        />
        <path
          d="M300 122 L312 174 L330 258 L348 314 L366 388 L386 470 L410 560 L436 720 L360 720 L330 470 L312 300 Z"
          fill="#76858c"
          opacity="0.45"
        />
        <path
          d="M272 224 L292 156 L300 122 L312 174 L330 258 L300 250 L284 232 Z"
          fill="#6f7c4c"
          opacity="0.55"
        />
        <path d="M120 720 L138 612 L150 580 L164 612 L176 720 Z" fill="url(#lime)" />
      </g>
    </svg>
  );
}

const clamp01 = (a: number, b: number, x: number) =>
  Math.min(1, Math.max(0, (x - a) / (b - a)));

export function Hero() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const portfolioRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const rockRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const update = () => {
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const raw = total > 0 ? -rect.top / total : 0;
      const p = reduce ? 0.62 : Math.min(1, Math.max(0, raw));

      // Phase A — "Portfolio"
      const pOut = clamp01(0, 0.16, p);
      if (portfolioRef.current) {
        portfolioRef.current.style.opacity = String(1 - pOut);
        portfolioRef.current.style.transform = `translateY(${pOut * -2.4}vh)`;
      }

      // Phase B — "ALBERTO TUVERI" rises into view (water reveal); Phase C — drifts behind the rock
      const reveal = clamp01(0.12, 0.42, p);
      const behind = clamp01(0.52, 1, p);
      if (h1Ref.current) {
        h1Ref.current.style.clipPath = `inset(${(1 - reveal) * 100}% 0 0 0)`;
      }
      if (titleRef.current) {
        titleRef.current.style.opacity = String(reveal * (1 - behind * 0.6));
        titleRef.current.style.transform = `translateY(${behind * -4}vh) scale(${1 + behind * 0.12})`;
      }

      // Scoglio rises from the sea, IN FRONT of the title
      const rise = clamp01(0.42, 1, p);
      if (rockRef.current) {
        rockRef.current.style.transform = `translateY(${(1 - rise) * 46 - 4}%) scale(${1 + rise * 0.3})`;
      }

      // scroll cue (phase A only)
      if (cueRef.current) {
        cueRef.current.style.opacity = String(1 - clamp01(0, 0.1, p));
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
    <section ref={sectionRef} id="hero" className="relative h-[300vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* bright Mediterranean: azure sky -> turquoise -> deep sea */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg,#5a9ccd 0%,#86bee2 34%,#bcddee 50%,#cfe6f0 53%,#2f93ab 60%,#176a8d 76%,#0c3d57 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: [
              "radial-gradient(38% 16% at 24% 16%, rgba(255,255,255,.55), transparent 70%)",
              "radial-gradient(30% 12% at 70% 12%, rgba(255,255,255,.45), transparent 70%)",
              "radial-gradient(26% 10% at 52% 26%, rgba(255,255,255,.35), transparent 70%)",
            ].join(","),
          }}
        />

        {/* legibility scrim behind the title */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(58% 46% at 50% 42%, rgba(6,28,42,.40), transparent 72%)",
          }}
        />

        {/* big white name with a celeste wave-shimmer, revealed bottom-up */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p
            ref={portfolioRef}
            className="label mb-6 text-foam/85"
          >
            Portfolio
          </p>
          <div ref={titleRef} className="will-change-transform" style={{ opacity: 0 }}>
            <h1
              ref={h1Ref}
              className="display-hero uppercase"
              style={{
                backgroundImage:
                  "linear-gradient(100deg,#ffffff 0%,#ffffff 38%,var(--color-celeste) 50%,#ffffff 62%,#ffffff 100%)",
                backgroundSize: "250% 100%",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
                animation: "title-shimmer 7s linear infinite",
                filter: "drop-shadow(0 2px 26px rgba(4,16,24,.55))",
                letterSpacing: "0.01em",
                clipPath: "inset(100% 0 0 0)",
              }}
            >
              Alberto
              <br />
              Tuveri
            </h1>
          </div>
        </div>

        {/* the scoglio, rising in FRONT so the title passes behind it */}
        <div
          ref={rockRef}
          aria-hidden
          className="absolute inset-x-0 bottom-0 z-20 flex justify-center will-change-transform"
          style={{ transform: "translateY(42%) scale(1)" }}
        >
          <Scoglio />
        </div>

        {/* foam at the sea base */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 z-10 h-[22vh]"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(207,234,240,.26) 45%, rgba(13,61,87,.5))",
          }}
        />

        {/* scroll cue */}
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
