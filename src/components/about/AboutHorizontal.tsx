"use client";

import * as React from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { TornEdge } from "@/components/atmosphere/TornEdge";
import { WaterPrint } from "@/components/about/WaterPrint";

/*
  AboutHorizontal — the long version, travelled sideways.

  Port of era-residence.com's horizontal scroller, from Alberto's reverse
  engineering (domus-tua-site/reverse-engineering/era-residence, README §11 and
  main.pretty.js:2596-2651). Their "The concept" / "New Golden Mile" views are
  not vertical sections at all — they are panels of one horizontal scroller.

      const t = track.scrollWidth - area.offsetWidth;
      area.style.height = `${track.scrollWidth}px`;
      gsap.to(track, { x: -t, ease: "horScroll",          // cubic-bezier(.25,0,.75,1)
        scrollTrigger: { trigger: area, start: "2.5% top", end: "97.5% bottom", scrub: .25 } });

  THE SIGNATURE IS THE NON-LINEARITY: `horScroll` starts the track slow,
  accelerates through the middle and brakes into the last panel; `scrub: .25`
  adds the catch-up glide. Drop either and it is an ordinary carousel.

  THE PANELS ARE NO LONGER BARE TYPE (Alberto: "tutto molto vuoto"). Each one
  is now an editorial composition in three depths, all counter-drifting
  against the travel (what stops the row reading as one rigid sheet):
    · a GHOST NUMERAL (01–04) on the deepest layer
    · a PHOTOGRAPHIC SCRAP torn out of the paper (TornEdge) — the bio and the
      thesis scraps LIVE: WaterPrint runs the brief's water-distortion-over-
      image shader on them (snippet E, DOSSIERS §9b); education and experience
      rest as stills (calm panels between the two living ones)
    · the text column in front, revealed by a per-panel choreography as the
      panel ENTERS THE FRAME horizontally: the heading splits to chars that
      rise out of a mask, the scrap wipes open (clip-path) while its image
      settles out of a zoom, the numeral drifts in, list rows cascade.
  `containerAnimation` cannot drive those triggers (it requires a LINEAR
  container ease; horScroll is the signature), so panel entry is computed in
  the track tween's own onUpdate from offsetLeft + x — no DOM reads per frame.

  Desktop only, exactly like upstream (`min-width: 992px`): below that the
  panels are plain stacked blocks (scraps and numerals are lg-only). Reduced
  motion: no pin, no track, no reveals — the stacked column again.
*/

const BREAKPOINT = 992;

/* the journey's photographic matter — real Sulcis, one scrap per chapter */
const SCRAPS = {
  bio: "/coast/masua-cliff.webp", // the coast the bio starts from — ALIVE
  education: "/coast/sulcis-map.webp", // the map: where the studying happened
  experience: "/coast/arch-poster.webp", // Porto Flavia — engineering in rock
  thesis: "/coast/ascent-poster.webp", // underwater light — the research — ALIVE
} as const;

const scrapBase =
  "pointer-events-none absolute hidden overflow-hidden bg-paper-deep " +
  "shadow-[0_28px_70px_rgb(42_26_20/0.18)] lg:block motion-reduce:lg:hidden";

const numBase =
  "pointer-events-none absolute hidden select-none font-display font-bold leading-none " +
  "lg:block motion-reduce:lg:hidden";
const numStyle = { color: "color-mix(in oklab, var(--color-ink) 5%, transparent)" };

/* One torn photographic scrap; `living` runs the WaterPrint shader on it.
   Module-level ON PURPOSE: defined inside the component it would be a new
   component type every render, and React would remount the subtree — GL
   context churn in WaterPrint on every locale/fonts re-render. */
function Scrap({
  src,
  living = false,
  seeds,
  className = "",
}: {
  src: string;
  living?: boolean;
  seeds: [number, number];
  className?: string;
}) {
  return (
    <div aria-hidden data-hz-par className={`${scrapBase} ${className}`}>
      <div data-hz-scrap className="absolute inset-0 overflow-hidden">
        <div data-hz-scrap-inner className="absolute inset-0">
          {living ? (
            /* -inset-[20%] = a 140% box: the shader frames its image at 1/1.4
               of the canvas (its deliberate wobble bleed), so oversizing by
               exactly 1.4 makes the photo fill the torn window edge-to-edge
               while the bleed lives outside the clip — layout, not shader
               dilution */
            <WaterPrint src={src} className="absolute -inset-[20%]" />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={src}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {/* the site's duotone pull — marries the scrap to the paper world */}
          <div
            className="absolute inset-0 mix-blend-multiply"
            style={{ background: "var(--color-amber)", opacity: 0.1 }}
          />
        </div>
        <TornEdge side="top" seed={seeds[0]} />
        <TornEdge side="bottom" seed={seeds[1]} />
      </div>
    </div>
  );
}

export function AboutHorizontal() {
  const t = useDict();
  const locale = useUI((s) => s.locale);
  const reduced = useUI((s) => s.reducedMotion);
  const areaRef = React.useRef<HTMLDivElement>(null);
  const screenRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [fontsReady, setFontsReady] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (document.fonts?.ready ?? Promise.resolve()).then(() => alive && setFontsReady(true));
    return () => {
      alive = false;
    };
  }, []);

  useGSAP(
    () => {
      const area = areaRef.current;
      const track = trackRef.current;
      // fonts gate: SplitText must measure the real display face
      if (!area || !track || reduced || !fontsReady) return;

      const mm = gsap.matchMedia();
      mm.add(`(min-width: ${BREAKPOINT}px)`, () => {
        // upstream: the section becomes as TALL as the track is WIDE, so one
        // viewport of vertical scroll buys one viewport of horizontal travel
        const distance = track.scrollWidth - area.offsetWidth;
        area.style.height = `${track.scrollWidth}px`;
        // upstream refreshes in the same breath, and it matters: every trigger
        // below this section was measured against the old (collapsed) height
        ScrollTrigger.refresh();

        /* ── per-panel entry choreography ─────────────────────────────── */
        const panels = gsap.utils.toArray<HTMLElement>("[data-hz-panel]", track);
        const splits: SplitText[] = [];
        const tls = panels.map((panel) => {
          const tl = gsap.timeline({ paused: true });
          const head = panel.querySelector<HTMLElement>("[data-hz-head]");
          const scrap = panel.querySelector<HTMLElement>("[data-hz-scrap]");
          const inner = panel.querySelector<HTMLElement>("[data-hz-scrap-inner]");
          const num = panel.querySelector<HTMLElement>("[data-hz-num]");
          const rises = panel.querySelectorAll<HTMLElement>("[data-hz-rise]");
          if (head) {
            // words,chars: chars alone are inline-blocks and the browser then
            // wraps at ANY character ("coast t / o systems" — measured); the
            // word wrappers restore word-level line breaking
            const split = SplitText.create(head, { type: "words,chars", mask: "chars" });
            splits.push(split);
            tl.from(
              split.chars,
              { yPercent: 120, rotate: 5, duration: 0.7, stagger: 0.022, ease: "power4.out" },
              0,
            );
          }
          // autoAlpha only: the numeral's transform belongs to the deep-drift
          // scrub (one transform owner per element — the repo rule)
          if (num) tl.from(num, { autoAlpha: 0, duration: 1.1, ease: "power2.out" }, 0);
          if (scrap)
            tl.from(
              scrap,
              // the paper tears open sideways onto the photograph
              { clipPath: "inset(0% 100% 0% 0%)", duration: 0.9, ease: "power3.inOut" },
              0.08,
            );
          if (inner)
            tl.from(inner, { scale: 1.16, duration: 1.3, ease: "power2.out" }, 0.08);
          if (rises.length)
            tl.from(
              rises,
              { y: 26, autoAlpha: 0, duration: 0.6, stagger: 0.07, ease: "power3.out" },
              0.16,
            );
          return tl;
        });

        // panel 0 enters with the section itself (vertically)
        const st0 = ScrollTrigger.create({
          trigger: area,
          start: "top 62%",
          onEnter: () => tls[0]?.play(),
          onLeaveBack: () => tls[0]?.reverse(),
        });

        // panels 1+ enter horizontally: their screen-left = offsetLeft + track x.
        // Cached offsets, live x from the tween target — zero layout reads/frame.
        let lefts = panels.map((p) => p.offsetLeft);
        const check = () => {
          const x = gsap.getProperty(track, "x") as number;
          const vw = window.innerWidth;
          for (let i = 1; i < panels.length; i++) {
            const sx = lefts[i] + x;
            if (sx < vw * 0.62) tls[i].play();
            else if (sx > vw * 0.85) tls[i].reverse(); // hysteresis — no flutter
          }
        };

        const tw = gsap.to(track, {
          x: -distance,
          ease: "horScroll",
          scrollTrigger: {
            trigger: area,
            start: "2.5% top",
            end: "97.5% bottom",
            scrub: 0.25,
            invalidateOnRefresh: true,
            onRefresh: () => {
              lefts = panels.map((p) => p.offsetLeft);
            },
          },
          onUpdate: check,
        });

        /* ── counter-drift, three depths (never one rigid sheet) ───────── */
        const drift = (attr: string, from: number[], to: number[]) =>
          gsap.fromTo(
            area.querySelectorAll<HTMLElement>(`[${attr}]`),
            { xPercent: gsap.utils.wrap(from) },
            {
              xPercent: gsap.utils.wrap(to),
              ease: "none",
              scrollTrigger: { trigger: area, start: "top top", end: "bottom bottom", scrub: 0.25 },
            },
          );
        const drifts = [
          drift("data-hz-drift", [-5, 25, -15], [5, -25, 25]), // titles (upstream's values)
          drift("data-hz-num", [-22, 18, -16, 24], [22, -18, 16, -24]), // deepest: numerals
          drift("data-hz-par", [-6, 8, -5, 7], [6, -8, 5, -7]), // scraps, gently
        ];

        return () => {
          tw.scrollTrigger?.kill();
          tw.kill();
          drifts.forEach((d) => {
            d.scrollTrigger?.kill();
            d.kill();
          });
          st0.kill();
          tls.forEach((tl) => tl.kill());
          splits.forEach((s) => s.revert());
          // the measured height and the scrubbed styles must not survive a
          // rebuild, or the next measure starts from the last one's leftovers
          area.style.removeProperty("height");
          gsap.set(track, { clearProps: "transform" });
          area
            .querySelectorAll<HTMLElement>("[data-hz-drift],[data-hz-num],[data-hz-par]")
            .forEach((el) => gsap.set(el, { clearProps: "all" }));
        };
      });

      return () => mm.revert();
    },
    { scope: areaRef, dependencies: [reduced, locale, fontsReady], revertOnUpdate: true },
  );

  /*
    The `motion-reduce:` variants are load-bearing, not decoration. The GSAP
    track tween is skipped under reduced motion — but the CSS breakpoint would
    still lay the panels out in a row, so the track would sit there horizontal
    and never translate and three of the four panels would be UNREACHABLE.
    Reduced motion therefore falls back to the same stacked column mobile gets,
    purely in CSS (zero hydration surface). The scraps and numerals are lg-only
    AND motion-reduce-hidden: absolutely-positioned matter over a stacked
    column would sit on the text.
  */
  const panelBase =
    "relative flex h-full w-screen shrink-0 flex-col justify-center px-[var(--gutter,1.25rem)] py-[var(--section-y)] " +
    "lg:w-[74vw] lg:px-[6vw] lg:py-0 " +
    "motion-reduce:lg:h-auto motion-reduce:lg:w-full motion-reduce:lg:px-[var(--gutter,1.25rem)] motion-reduce:lg:py-[var(--section-y)]";

  return (
    <div ref={areaRef} className="relative">
      <div
        ref={screenRef}
        className="lg:sticky lg:top-0 lg:flex lg:h-dvh lg:items-center lg:overflow-hidden motion-reduce:lg:static motion-reduce:lg:block motion-reduce:lg:h-auto motion-reduce:lg:overflow-visible"
      >
        <div
          ref={trackRef}
          className="lg:flex lg:h-full lg:flex-none motion-reduce:lg:block motion-reduce:lg:h-auto"
        >
          {/* 01 — the bio, in full: the coast itself, alive under the water */}
          <section className={panelBase} data-hz-panel aria-labelledby="hz-bio">
            <span aria-hidden data-hz-num className={`${numBase} right-[4vw] top-[8vh] text-[24vw]`} style={numStyle}>
              01
            </span>
            <Scrap
              src={SCRAPS.bio}
              living
              seeds={[17, 23]}
              className="right-[5vw] top-1/2 aspect-[3/2] w-[26vw] -translate-y-1/2"
            />
            <div className="relative z-10">
              <p className="t-eyebrow eyebrow-tick mb-8" data-hz-rise>
                {t.journey.eyebrow}
              </p>
              <h3 id="hz-bio" className="t-title max-w-[16ch]" data-hz-head data-hz-drift>
                {t.journey.title}
              </h3>
              <div className="mt-8 max-w-[46ch] space-y-5">
                {t.journey.bio.map((p, i) => (
                  <p key={i} className="t-body t-body--mute" data-hz-rise>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </section>

          {/* 02 — education: the map of where it happened */}
          <section className={panelBase} data-hz-panel aria-labelledby="hz-edu">
            <span aria-hidden data-hz-num className={`${numBase} left-[30vw] bottom-[6vh] text-[24vw]`} style={numStyle}>
              02
            </span>
            <Scrap
              src={SCRAPS.education}
              seeds={[29, 31]}
              className="right-[6vw] bottom-[12vh] aspect-[4/5] w-[19vw]"
            />
            <div className="relative z-10">
              <h3 id="hz-edu" className="t-title" data-hz-head data-hz-drift>
                {t.journey.educationTitle}
              </h3>
              <ol role="list" className="mt-10 max-w-[46ch]">
                {t.journey.education.map((e, i) => (
                  <li
                    key={i}
                    data-hz-rise
                    className="border-t border-[var(--color-rule)] py-6 first:border-t-0 first:pt-0"
                  >
                    <p className="t-meta text-ink-mute">{e.period}</p>
                    <p className="t-lead mt-1">{e.title}</p>
                    <p className="t-body t-body--mute mt-1">{e.org}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* 03 — experience: Porto Flavia, engineering carved into the cliff */}
          <section className={panelBase} data-hz-panel aria-labelledby="hz-exp">
            <span aria-hidden data-hz-num className={`${numBase} right-[8vw] top-[6vh] text-[24vw]`} style={numStyle}>
              03
            </span>
            <Scrap
              src={SCRAPS.experience}
              seeds={[37, 41]}
              className="right-[5vw] top-[14vh] aspect-[3/2] w-[24vw]"
            />
            <div className="relative z-10">
              <h3 id="hz-exp" className="t-title" data-hz-head data-hz-drift>
                {t.journey.experienceTitle}
              </h3>
              <ol role="list" className="mt-10 max-w-[46ch]">
                {t.journey.experience.map((e, i) => (
                  <li
                    key={i}
                    data-hz-rise
                    className="border-t border-[var(--color-rule)] py-6 first:border-t-0 first:pt-0"
                  >
                    <p className="t-meta text-ink-mute">{e.period}</p>
                    <p className="t-lead mt-1">{e.org}</p>
                    <p className="t-body t-body--mute mt-1">{e.role}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* 04 — the thesis: the underwater light, alive again */}
          <section className={panelBase} data-hz-panel aria-labelledby="hz-thesis">
            <span aria-hidden data-hz-num className={`${numBase} left-[34vw] top-[10vh] text-[24vw]`} style={numStyle}>
              04
            </span>
            <Scrap
              src={SCRAPS.thesis}
              living
              seeds={[43, 47]}
              className="right-[6vw] top-1/2 aspect-[3/2] w-[24vw] -translate-y-1/2"
            />
            <div className="relative z-10">
              <h3 id="hz-thesis" className="t-title max-w-[14ch]" data-hz-head data-hz-drift>
                {t.journey.thesisTitle}
              </h3>
              <p className="t-body t-body--mute mt-8 max-w-[46ch]" data-hz-rise>
                {t.journey.thesis}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default AboutHorizontal;
