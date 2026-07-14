"use client";

import * as React from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useUI } from "@/store/ui";
import { useDict } from "@/content/dict";
import { useHydrated } from "@/lib/use-hydrated";
import { marea } from "@/lib/sound";

/*
  AscentSurface — "LA RISALITA": the missing half of the dive.

  LA COSTA's drone film ends UNDERWATER in teal god-rays — and until now the
  page simply went back to paper. This band completes the arc: you hang in the
  real underwater light (a palindrome loop cut from the SAME footage the scrub
  lands on — perfect continuity, zero generated pixels), bubbles rise past you,
  and scroll performs the ascent. Near the top, the PAPER of the site descends
  as a living waterline — two counter-drifting wave strips with a foam edge —
  and when the line crosses the camera you BREAK THE SURFACE: droplets burst
  up onto the page, a `surface-break` CustomEvent fires (the escort flock
  scatters), and the MAREA sound engine un-muffles (underwater lowpass opens).

  Mechanics follow FilmScrub's house rules: sticky 100dvh inside an Nvh
  section; ONE scrubbed timeline; bytes lazy via IO but layout owned from
  first paint (no CLS); transform/opacity only; reduced-motion = honest still
  with the full caption; video muted/playsinline/aria-hidden.
*/

const HEIGHT_VH = 230;
/** sheet is 140% of the sticky viewport tall; travel takes its wavy bottom
    edge from just above the fold to PAST it (yPercent of OWN height) — the
    edge must end BELOW 100vh or the unpinned band's last frame keeps a
    waterline strip at its seam with the next section (seen in QA) */
const SHEET_FROM = -104.29; // bottom edge at -6vh (fully hidden above)
const SHEET_TO = -21.43; //   bottom edge at 110vh (pure paper, waves gone)
/** scrub progress at which the waterline crosses mid-viewport = the break */
const BREAK_P = 0.75;

/* ── deterministic helpers (SSR === client; precision fixed — hydration rule) ── */
function hashFr(i: number, salt: number, n: number) {
  const x = Math.sin((i + salt) * 127.1 + n * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function bubbles(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const fr = (n: number) => hashFr(i, 7, n);
    const r = (x: number, d = 2) => Number(x.toFixed(d));
    return {
      left: r(3 + fr(1) * 94),
      size: r(2.5 + fr(2) * 6, 1),
      dur: (6.5 + fr(3) * 8).toFixed(1),
      delay: (-fr(4) * 15).toFixed(1),
      sway: ((fr(5) * 2 - 1) * 2.4).toFixed(2),
      peak: (0.16 + fr(6) * 0.3).toFixed(2),
    };
  });
}

function droplets(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const fr = (n: number) => hashFr(i, 19, n);
    const r = (x: number, d = 2) => Number(x.toFixed(d));
    return {
      left: r(8 + fr(1) * 84),
      size: r(3 + fr(2) * 4, 1),
      amber: fr(3) > 0.7,
      rise: r(34 + fr(4) * 86, 1),
      fall: r(26 + fr(5) * 40, 1),
      at: r(fr(6) * 0.12, 3),
      riseDur: r(0.28 + fr(7) * 0.18, 3),
      fallDur: r(0.4 + fr(8) * 0.22, 3),
    };
  });
}

/* ── the living waterline: a 2-period wave path (drifts -50% seamlessly) ── */
const WAVE_W = 2880;
const WAVE_H = 44;
function wavePath(amp: number, yBase: number, halfPeriods: number, flip: boolean) {
  const step = WAVE_W / halfPeriods;
  let d = `M0 0 L0 ${yBase}`;
  for (let i = 0; i < halfPeriods; i++) {
    const x1 = ((i + 1) * step).toFixed(1);
    const up = (i % 2 === 0) !== flip;
    const cy = (yBase + (up ? -amp : amp)).toFixed(1);
    d += ` Q${((i + 0.5) * step).toFixed(1)} ${cy} ${x1} ${yBase}`;
  }
  d += ` L${WAVE_W} 0 Z`;
  return d;
}
const WAVE_MAIN = wavePath(11, 22, 16, false);
const WAVE_FOAM = wavePath(13, 20, 16, true);

const BUBBLES = bubbles(22);
const DROPLETS = droplets(16);

export function AscentSurface() {
  const t = useDict();
  const reduced = useUI((s) => s.reducedMotion);
  // reducedMotion is true on the very FIRST client render for reduced visitors
  // while the server HTML is the animated tree — render-time branches must
  // wait one pass or hydration mismatches (house rule, see use-hydrated.ts).
  // The hook is called UNCONDITIONALLY: `reduced` is live (Smooth.tsx tracks
  // the media query), so short-circuiting it would change the hook count.
  const hydrated = useHydrated();
  const showReduced = reduced && hydrated;
  const root = React.useRef<HTMLElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [src, setSrc] = React.useState<string | null>(null);

  // lazy BYTES, not lazy LAYOUT (FilmScrub pattern)
  React.useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setSrc(window.innerWidth < 768 ? "/coast/ascent-960.mp4" : "/coast/ascent-1600.mp4");
          io.disconnect();
        }
      },
      { rootMargin: "900px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  // the loop decodes only while the band is actually on screen — play/pause is
  // keyed to VISIBILITY (a pin-window toggle would leave it running when the
  // user stops one viewport short, and frozen when re-approaching from above)
  React.useEffect(() => {
    if (reduced || !src) return;
    const el = root.current;
    const video = videoRef.current;
    if (!el || !video) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void video.play().catch(() => {});
      else video.pause();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, src]);

  useGSAP(
    () => {
      const section = root.current;
      if (!section || reduced) return;

      // -1 sentinel: the FIRST onUpdate (creation/restored-scroll refresh) only
      // establishes the baseline — a reload landing below the band must not
      // fire a phantom surface-break (burst + audio swell + flock kick).
      let lastP = -1;
      let lastBurst = 0;
      let lastSubFlag = false;
      const setSubFlag = (flag: boolean) => {
        if (flag === lastSubFlag) return;
        lastSubFlag = flag;
        // the escort can't follow you underwater — the sky empties (Escort listens)
        window.dispatchEvent(new CustomEvent("submerge", { detail: flag }));
      };

      // droplet burst — built once, replayed on each surface break
      const burst = gsap.timeline({ paused: true });
      gsap.utils.toArray<HTMLElement>("[data-asc-drop]").forEach((d, i) => {
        const spec = DROPLETS[i % DROPLETS.length];
        burst
          .fromTo(
            d,
            { y: 6, opacity: 0 },
            { y: -spec.rise, opacity: 0.95, duration: spec.riseDur, ease: "power2.out" },
            spec.at,
          )
          .to(d, { y: spec.fall, opacity: 0, duration: spec.fallDur, ease: "power1.in" }, spec.at + spec.riseDur);
      });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            // ears break the surface just before the eyes do
            marea.setSubmerged(Math.min(1, Math.max(0, (0.78 - p) / 0.1)));
            setSubFlag(p < 0.74);
            const now = performance.now();
            if (lastP >= 0 && p > BREAK_P && lastP <= BREAK_P && now - lastBurst > 1200) {
              lastBurst = now;
              burst.restart();
              marea.surfaceBreak();
              window.dispatchEvent(new CustomEvent("surface-break"));
            }
            lastP = p;
          },
          onToggle: (self) => {
            if (!self.isActive) {
              marea.setSubmerged(0);
              setSubFlag(false);
            }
          },
        },
      });

      tl
        // the camera rises: the world streams downward, the surface nears
        .fromTo("[data-asc-world]", { yPercent: -6, scale: 1, y: 0 }, { yPercent: 6, scale: 1.06, y: 0, duration: 0.75 }, 0)
        // the sun blooms as the water thins overhead
        .fromTo("[data-asc-glow]", { opacity: 0.08 }, { opacity: 0.5, duration: 0.42 }, 0.3)
        // the held-breath line hangs in the water…
        .fromTo("[data-asc-deep]", { y: 44, opacity: 0 }, { y: 0, opacity: 1, duration: 0.1 }, 0.06)
        // …then sinks past you as you rise
        .to("[data-asc-deep]", { y: 130, opacity: 0, duration: 0.16 }, 0.52)
        // the page descends as a waterline; you break through it
        .fromTo(
          "[data-asc-sheet]",
          { yPercent: SHEET_FROM, y: 0 },
          { yPercent: SHEET_TO, y: 0, duration: 0.36 },
          0.58,
        )
        // pad the timeline to duration EXACTLY 1 so tween positions and the
        // onUpdate thresholds (BREAK_P, submerge ramps) share the same p-space
        // — scrub maps scroll progress to timeline.progress, so a 0.94-long
        // timeline would shift every beat ~6% early relative to the math above
        .to({}, { duration: 0.06 }, 0.94);

      return () => {
        marea.setSubmerged(0);
        setSubFlag(false);
        burst.kill();
      };
    },
    // revertOnUpdate: without it @gsap/react defers cleanup to unmount, so the
    // src-attach re-run would ADD a second scrubbed trigger + burst timeline
    // (double surface-break events, double flock kicks — seen in QA as breaks=2)
    { scope: root, dependencies: [reduced, src], revertOnUpdate: true },
  );

  /* ── reduced motion: the honest still — no pin, no video, full sentence ── */
  if (showReduced) {
    return (
      <section ref={root} aria-label={t.ascent.eyebrow} className="relative bg-night">
        <div className="relative min-h-dvh overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/coast/ascent-poster.webp" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[46vh]"
            style={{
              background:
                "linear-gradient(to top, color-mix(in oklab, var(--color-night) 84%, var(--color-dusk)), transparent)",
              opacity: 0.7,
            }}
          />
          <div className="container-edit absolute inset-x-0 bottom-0 pb-[clamp(2.5rem,7vh,5rem)]">
            <p className="t-eyebrow eyebrow-tick text-paper/85">{t.ascent.eyebrow}</p>
            <h2 className="t-display mt-4 max-w-[18ch] text-paper">
              {t.ascent.deep} {t.ascent.breathe}
            </h2>
            <p className="t-meta mt-5 text-paper/75">{t.ascent.meta}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={root} aria-label={t.ascent.eyebrow} className="relative bg-night" style={{ height: `${HEIGHT_VH}vh` }}>
      <div className="sticky top-0 h-dvh overflow-hidden">
        {/* the real underwater light — palindrome loop of LA COSTA's own tail */}
        <div data-asc-world aria-hidden className="absolute inset-x-0 -top-[12%] -bottom-[12%] will-change-transform">
          {src ? (
            <video
              ref={videoRef}
              aria-hidden
              muted
              playsInline
              loop
              preload="auto"
              src={src}
              poster="/coast/ascent-poster.webp"
              className="h-full w-full object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/coast/ascent-poster.webp" alt="" className="h-full w-full object-cover" />
          )}
        </div>

        {/* seam feather against LA COSTA's released last frame above */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-night to-transparent opacity-60" />

        {/* the sun blooming through the thinning water */}
        <div
          data-asc-glow
          aria-hidden
          className="absolute inset-0"
          style={{
            opacity: 0.08,
            background:
              "radial-gradient(58% 42% at 50% -6%, rgb(255 214 150 / 0.85), rgb(255 190 120 / 0.24) 45%, transparent 72%)",
          }}
        />

        {/* rising breath — deterministic, pure CSS (GoldenMotes discipline) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {BUBBLES.map((b, i) => (
            <span
              key={i}
              className={`asc-bubble${i % 2 ? " max-md:hidden" : ""}`}
              style={
                {
                  left: `${b.left}%`,
                  width: `${b.size}px`,
                  height: `${b.size}px`,
                  "--bub-dur": `${b.dur}s`,
                  "--bub-delay": `${b.delay}s`,
                  "--bub-sway": `${b.sway}rem`,
                  "--bub-peak": b.peak,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        {/* the held breath, hanging in the light — a soft depth scrim rides
            behind the words so paper stays AA even through the bright shafts
            (house rule: caption over footage always gets a dusk veil) */}
        <div data-asc-deep className="absolute inset-0 z-10 flex items-center" style={{ opacity: 0 }}>
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 w-[72%]"
            style={{
              background:
                "radial-gradient(58% 46% at 26% 50%, color-mix(in oklab, var(--color-night) 78%, var(--color-dusk)) 0%, color-mix(in srgb, color-mix(in oklab, var(--color-night) 78%, var(--color-dusk)) 55%, transparent) 55%, transparent 78%)",
              opacity: 0.58,
            }}
          />
          <div className="container-edit relative w-full">
            <p className="t-eyebrow eyebrow-tick text-paper/85">{t.ascent.eyebrow}</p>
            <h2 className="t-display mt-4 max-w-[14ch] text-paper">{t.ascent.deep}</h2>
            <p className="t-meta mt-5 text-paper/75">{t.ascent.meta}</p>
          </div>
        </div>

        {/* THE SURFACE — the page itself, descending as a living waterline.
            Inline transform keeps it parked above the fold before (or without) JS. */}
        <div
          data-asc-sheet
          className="absolute inset-x-0 top-0 z-20 h-[140%] will-change-transform"
          style={{ transform: `translate3d(0, ${SHEET_FROM}%, 0)` }}
        >
          {/* paper body (1px overlap into the wave so no hairline gap) */}
          <div aria-hidden className="absolute inset-x-0 top-0 bottom-[43px] bg-paper" />

          {/* waterline: counter-drifting wave strips + foam edge */}
          <div aria-hidden className="absolute inset-x-0 -bottom-[18px] h-[62px] overflow-hidden">
            {/* leading translucent foam front (drifts one way, sits lower) */}
            <div className="asc-wave-track top-[10px]" style={{ "--wave-dur": "17s", animationDirection: "reverse" } as React.CSSProperties}>
              <svg className="h-[44px] w-full" viewBox={`0 0 ${WAVE_W} ${WAVE_H}`} preserveAspectRatio="none">
                <path d={WAVE_FOAM} fill="var(--color-paper)" opacity="0.35" />
              </svg>
            </div>
            {/* the solid paper edge (drifts the other way) with wet shadow + foam glint */}
            <div className="asc-wave-track top-0" style={{ "--wave-dur": "12s" } as React.CSSProperties}>
              <svg className="h-[44px] w-full" viewBox={`0 0 ${WAVE_W} ${WAVE_H}`} preserveAspectRatio="none">
                <path d={WAVE_MAIN} transform="translate(0 4)" fill="rgb(42 26 20 / 0.2)" />
                <path d={WAVE_MAIN} fill="var(--color-paper)" />
                <path d={WAVE_MAIN} fill="none" stroke="rgb(255 244 230 / 0.9)" strokeWidth="2" opacity="0.85" />
                <path d={WAVE_MAIN} fill="none" stroke="rgb(255 244 230 / 0.5)" strokeWidth="6" opacity="0.3" />
              </svg>
            </div>
          </div>

          {/* droplets thrown onto the page at the break (GSAP one-shot) */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0">
            {DROPLETS.map((d, i) => (
              <span
                key={i}
                data-asc-drop
                className="absolute rounded-full"
                style={{
                  left: `${d.left}%`,
                  bottom: "12px",
                  width: `${d.size}px`,
                  height: `${d.size}px`,
                  opacity: 0,
                  background: d.amber
                    ? "color-mix(in srgb, var(--color-amber) 55%, white)"
                    : "color-mix(in srgb, var(--color-dusk) 26%, white)",
                }}
              />
            ))}
          </div>

          {/* the release, printed on the page you just surfaced onto */}
          <div className="absolute inset-x-0" style={{ bottom: "45dvh" }}>
            <div className="container-edit">
              <p className="t-display max-w-[14ch] text-ink">{t.ascent.breathe}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
