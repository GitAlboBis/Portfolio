"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/components/language-provider";

/* Placeholder silhouette of Pan di Zucchero (sea stack near Masua), in its real
   colors: pale sunlit limestone (warm cream + golden faces, cool shadow side,
   green cap) standing in a turquoise sea. Replaced later by the Higgsfield /
   real drone footage — see docs/05-CINEMATIC-SCROLL.md. */
function Scoglio() {
  return (
    <svg
      viewBox="0 0 600 720"
      className="h-[78vh] w-auto max-w-none"
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
          <stop offset="0%" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="16%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id="hazeMask">
          <rect x="0" y="0" width="600" height="720" fill="url(#topHaze)" />
        </mask>
      </defs>

      <g mask="url(#hazeMask)">
        {/* main sunlit mass */}
        <path
          d="M150 720 L188 506 L210 458 L232 346 L250 298 L272 224 L292 156 L300 122 L312 174 L330 258 L348 314 L366 388 L386 470 L410 560 L436 720 Z"
          fill="url(#lime)"
        />
        {/* cool shadowed face (right) */}
        <path
          d="M300 122 L312 174 L330 258 L348 314 L366 388 L386 470 L410 560 L436 720 L360 720 L330 470 L312 300 Z"
          fill="#76858c"
          opacity="0.45"
        />
        {/* green vegetation cap */}
        <path
          d="M272 224 L292 156 L300 122 L312 174 L330 258 L300 250 L284 232 Z"
          fill="#6f7c4c"
          opacity="0.55"
        />
        {/* small detached pinnacle (left), like the real stack */}
        <path d="M120 720 L138 612 L150 580 L164 612 L176 720 Z" fill="url(#lime)" />
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
      const e = reduce ? 0.5 : p;
      if (rockRef.current) {
        rockRef.current.style.transform = `translate3d(0, ${(1 - e) * 30 - 2}%, 0) scale(${1.02 + e * 0.24})`;
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
        {/* bright Mediterranean: azure sky -> turquoise -> deep sea */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg,#5a9ccd 0%,#86bee2 34%,#bcddee 50%,#cfe6f0 53%,#2f93ab 60%,#176a8d 76%,#0c3d57 100%)",
          }}
        />
        {/* soft wispy clouds */}
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

        {/* the scoglio, rising from the sea as you scroll */}
        <div
          ref={rockRef}
          aria-hidden
          className="absolute inset-x-0 bottom-0 flex justify-center will-change-transform"
          style={{ transform: "translate3d(0,28%,0) scale(1.02)" }}
        >
          <Scoglio />
        </div>

        {/* foam / sea surface at the base */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[24vh]"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(207,234,240,.28) 42%, rgba(13,61,87,.5))",
          }}
        />

        {/* legibility scrim behind the white title */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(58% 46% at 50% 42%, rgba(6,28,42,.42), transparent 72%)",
          }}
        />
        {/* gentle cinematic vignette */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            boxShadow: "inset 0 0 220px 40px rgba(6,24,38,.45)",
          }}
        />

        {/* big white name, in front of the rising rock */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div ref={titleRef} className="will-change-transform">
            <p className="label mb-6 text-foam/85">Portfolio</p>
            <h1
              className="display-hero uppercase text-foam"
              style={{
                textShadow: "0 2px 50px rgba(4,16,24,.6)",
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
          <span className="label text-foam/80">{t.hero.scrollCue}</span>
          <span aria-hidden className="h-10 w-px bg-foam/40" />
        </div>
      </div>
    </section>
  );
}
