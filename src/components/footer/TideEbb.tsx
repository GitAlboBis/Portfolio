"use client";

import * as React from "react";
import { gsap } from "@/lib/gsap";
import { useUI } from "@/store/ui";
import { marea } from "@/lib/sound";
import { wavePath, waveCrest, WAVE_W } from "@/lib/wave";

/*
  TideEbb — "IL RIFLUSSO": the closing tide.

  The site is BORN from water (the hero "A" erupts from the sea) and dives
  back under it mid-page (LA COSTA → LA RISALITA) — so the page should END
  in water too. At the very bottom of the night band a body of dark water
  laps at the page's edge: two counter-drifting crest strips (the RISALITA
  waterline language — .asc-wave-track + src/lib/wave.ts), a moonlit foam
  line, star glints twinkling on the swell, and a slow 9s tidal breath.

  ECOSYSTEM: reaching the absolute end of the page, the sea rises to meet
  you — a one-shot lift of the water body, a soft MAREA surf swell, and a
  "tide-touch" CustomEvent for future listeners. Cooldown-guarded.

  Decorative only (aria-hidden, no text). Reduced-motion is handled entirely
  in CSS media guards (no render-time branch → zero hydration surface): the
  drift/breath/twinkle animations stop, leaving still water; the scroll
  listener is gated at effect time.
*/

/* svg height: tall enough that the down-fill outlasts the worst combined
   upward shift (breath -6 + lift -10) inside the bled layer */
const H = 120;
const FAR = wavePath(9, 26, 12, true, { fill: "down", height: H });
const MAIN = wavePath(12, 20, 16, false, { fill: "down", height: H });
const CREST = waveCrest(12, 20, 16, false);

/** the water layer BLEEDS this far below the visible strip, so the breath
    (-6px) and the touch lift (-10px) can raise it without ever detaching its
    bottom edge from the page edge (the clip box stays static) */
const BLEED = 24;

/* star glints riding the crest zone — deterministic (hash-fract, toFixed);
   tops are in the bled layer's coordinates (+BLEED) */
const GLINTS = Array.from({ length: 9 }, (_, i) => {
  const fr = (n: number) => {
    const x = Math.sin((i + 3) * 127.1 + n * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  return {
    left: (4 + fr(1) * 92).toFixed(2),
    top: (BLEED + 30 + fr(2) * 34).toFixed(1),
    size: (1.4 + fr(3) * 1.4).toFixed(1),
    dur: (4 + fr(4) * 4).toFixed(1),
    delay: (-fr(5) * 8).toFixed(1),
    peak: (0.25 + fr(6) * 0.35).toFixed(2),
  };
});

export function TideEbb() {
  const reduced = useUI((s) => s.reducedMotion);
  const liftRef = React.useRef<HTMLDivElement>(null);

  // the sea rises to meet you at the page's end (effect-time only — safe)
  React.useEffect(() => {
    if (reduced) return;
    const el = liftRef.current;
    if (!el) return;
    // grace period: browser scroll restoration dispatches scroll events while
    // the page is still settling — the sea shouldn't leap during load. After
    // it, `last = -Infinity` means only INTER-trigger spacing is throttled.
    const armedAt = performance.now() + 800;
    let last = -Infinity;
    const onScroll = () => {
      const end = document.documentElement.scrollHeight - window.innerHeight;
      if (end - window.scrollY > 24) return;
      const now = performance.now();
      if (now < armedAt || now - last < 2600) return;
      last = now;
      marea.surfaceBreak();
      window.dispatchEvent(new CustomEvent("tide-touch"));
      gsap.fromTo(
        el,
        { y: 0 },
        { y: -10, duration: 0.65, ease: "sine.out", yoyo: true, repeat: 1, overwrite: "auto" },
      );
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      // tween lives outside any GSAP context — kill + clear by hand (house lesson)
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: "y" });
    };
  }, [reduced]);

  return (
    // static clip glued to the page edge — the moving layers live INSIDE it,
    // over-tall by BLEED, so breath/lift never expose a seam at the bottom
    <div aria-hidden className="pointer-events-none relative h-[96px] overflow-hidden">
      <div
        ref={liftRef}
        className="absolute inset-x-0 will-change-transform"
        style={{ top: `-${BLEED}px`, bottom: `-${BLEED}px` }}
      >
        <div className="tide-breathe absolute inset-0">
          {/* far swell — translucent, drifting the other way */}
          <div className="asc-wave-track" style={{ top: `${BLEED + 8}px`, "--wave-dur": "27s", animationDirection: "reverse" } as React.CSSProperties}>
            <svg className="h-[120px] w-full" viewBox={`0 0 ${WAVE_W} ${H}`} preserveAspectRatio="none">
              <path d={FAR} fill="color-mix(in oklab, var(--color-night) 52%, var(--color-dusk))" opacity="0.5" />
            </svg>
          </div>
          {/* main body + moonlit foam on the crest */}
          <div className="asc-wave-track" style={{ top: `${BLEED + 18}px`, "--wave-dur": "17s" } as React.CSSProperties}>
            <svg className="h-[120px] w-full" viewBox={`0 0 ${WAVE_W} ${H}`} preserveAspectRatio="none">
              <path d={MAIN} fill="color-mix(in oklab, var(--color-night) 63%, var(--color-dusk))" />
              <path d={CREST} fill="none" stroke="rgb(244 237 229 / 0.32)" strokeWidth="1.6" />
              <path d={CREST} fill="none" stroke="rgb(242 163 60 / 0.14)" strokeWidth="5" />
            </svg>
          </div>
          {/* stars caught on the water */}
          {GLINTS.map((g, i) => (
            <span
              key={i}
              className="tide-glint"
              style={
                {
                  left: `${g.left}%`,
                  top: `${g.top}px`,
                  width: `${g.size}px`,
                  height: `${g.size}px`,
                  "--tg-dur": `${g.dur}s`,
                  "--tg-delay": `${g.delay}s`,
                  "--tg-peak": g.peak,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
