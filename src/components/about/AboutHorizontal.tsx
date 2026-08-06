"use client";

import * as React from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";

/*
  AboutHorizontal — the long version, travelled sideways.

  Port of era-residence.com's horizontal scroller, from Alberto's reverse
  engineering (domus-tua-site/reverse-engineering/era-residence, README §11 and
  main.pretty.js:2596-2651). Their "The concept" / "New Golden Mile" views are
  not vertical sections at all — they are panels of one horizontal scroller.

  Architecture, theirs:

      .loc-scroll-area          ← height := track.scrollWidth  (JS)
        .loc-scroll-area_screen ← position: sticky; top: 0; display: flex
          .loc-scroll-area_track ← flex: none; display: flex   (panels in a row)

      const t = track.scrollWidth - area.offsetWidth;
      area.style.height = `${track.scrollWidth}px`;
      ScrollTrigger.refresh();
      gsap.to(track, {
        x: -t,
        ease: "horScroll",                                   // cubic-bezier(.25,0,.75,1)
        scrollTrigger: { trigger: area, start: "2.5% top", end: "97.5% bottom", scrub: .25 },
      });

  THE SIGNATURE IS THE NON-LINEARITY. Every horizontal scroller maps wheel to x
  linearly; this one does not. `horScroll` starts the track slow, accelerates it
  through the middle and brakes into the last panel, and `scrub: 0.25` adds a
  quarter-second of catch-up so the track keeps gliding after the wheel stops.
  Drop either and it becomes an ordinary sideways carousel.

  Also faithful: the 2.5%/97.5% trigger inset (the track is already still at both
  ends before the section hands over), and the title-line counter-parallax with
  `gsap.utils.wrap` — lines drift by different amounts and in different
  directions, which is what stops a row of panels reading as one rigid sheet.

  Desktop only, exactly like upstream (`min-width: 992px` via matchMedia): below
  that the panels are plain stacked blocks and the page scrolls normally. That is
  their behaviour, and it is also the honest one — a pinned horizontal track on a
  phone fights the scroll gesture.

  Reduced motion: no pin, no track, the panels stack. Same output as mobile.
*/

const BREAKPOINT = 992;

export function AboutHorizontal() {
  const t = useDict();
  const locale = useUI((s) => s.locale);
  const reduced = useUI((s) => s.reducedMotion);
  const areaRef = React.useRef<HTMLDivElement>(null);
  const screenRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const area = areaRef.current;
      const track = trackRef.current;
      if (!area || !track || reduced) return;

      const mm = gsap.matchMedia();
      mm.add(`(min-width: ${BREAKPOINT}px)`, () => {
        // upstream: the section becomes as TALL as the track is WIDE, so one
        // viewport of vertical scroll buys one viewport of horizontal travel
        const distance = track.scrollWidth - area.offsetWidth;
        area.style.height = `${track.scrollWidth}px`;
        // upstream refreshes in the same breath, and it matters: every trigger
        // below this section was measured against the old (collapsed) height
        ScrollTrigger.refresh();

        const tw = gsap.to(track, {
          x: -distance,
          ease: "horScroll",
          scrollTrigger: {
            trigger: area,
            start: "2.5% top",
            end: "97.5% bottom",
            scrub: 0.25,
            invalidateOnRefresh: true,
          },
        });

        // counter-drift so the row never reads as one rigid sheet
        const lines = area.querySelectorAll<HTMLElement>("[data-hz-drift]");
        const drift = gsap.fromTo(
          lines,
          { xPercent: gsap.utils.wrap([-5, 25, -15]) },
          {
            xPercent: gsap.utils.wrap([5, -25, 25]),
            ease: "none",
            scrollTrigger: {
              trigger: area,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.25,
            },
          },
        );

        return () => {
          tw.scrollTrigger?.kill();
          tw.kill();
          drift.scrollTrigger?.kill();
          drift.kill();
          // the measured height and the scrubbed x must not survive a rebuild,
          // or the next measure starts from the last one's leftovers
          area.style.removeProperty("height");
          gsap.set(track, { clearProps: "transform" });
          gsap.set(lines, { clearProps: "transform" });
        };
      });

      return () => mm.revert();
    },
    { scope: areaRef, dependencies: [reduced, locale], revertOnUpdate: true },
  );

  /*
    The `motion-reduce:` variants are load-bearing, not decoration. The GSAP
    track tween is skipped under reduced motion — but the CSS breakpoint would
    still lay the panels out in a row, so the track would sit there horizontal
    and never translate and three of the four panels would be UNREACHABLE.
    (Measured: dy=0, dx=893 at 1440 with prefers-reduced-motion.) Reduced motion
    therefore falls back to the same stacked column mobile gets. Done purely in
    CSS so it adds no hydration surface — the store's reducedMotion is true on a
    reduced visitor's first client render but false in the server HTML.
  */
  const panelBase =
    "flex h-full w-screen shrink-0 flex-col justify-center px-[var(--gutter,1.25rem)] py-[var(--section-y)] " +
    "lg:w-[62vw] lg:px-[6vw] lg:py-0 " +
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
          {/* 01 — the bio, in full */}
          <section className={panelBase} aria-labelledby="hz-bio">
            <p className="t-eyebrow eyebrow-tick mb-8">{t.journey.eyebrow}</p>
            <h3 id="hz-bio" className="t-title max-w-[16ch]" data-hz-drift>
              {t.journey.title}
            </h3>
            <div className="mt-8 max-w-[52ch] space-y-5">
              {t.journey.bio.map((p, i) => (
                <p key={i} className="t-body t-body--mute">
                  {p}
                </p>
              ))}
            </div>
          </section>

          {/* 02 — education */}
          <section className={panelBase} aria-labelledby="hz-edu">
            <h3 id="hz-edu" className="t-title" data-hz-drift>
              {t.journey.educationTitle}
            </h3>
            <ol role="list" className="mt-10 max-w-[46ch]">
              {t.journey.education.map((e, i) => (
                <li
                  key={i}
                  className="border-t border-[var(--color-rule)] py-6 first:border-t-0 first:pt-0"
                >
                  <p className="t-meta text-ink-mute">{e.period}</p>
                  <p className="t-lead mt-1">{e.title}</p>
                  <p className="t-body t-body--mute mt-1">{e.org}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* 03 — experience */}
          <section className={panelBase} aria-labelledby="hz-exp">
            <h3 id="hz-exp" className="t-title" data-hz-drift>
              {t.journey.experienceTitle}
            </h3>
            <ol role="list" className="mt-10 max-w-[46ch]">
              {t.journey.experience.map((e, i) => (
                <li
                  key={i}
                  className="border-t border-[var(--color-rule)] py-6 first:border-t-0 first:pt-0"
                >
                  <p className="t-meta text-ink-mute">{e.period}</p>
                  <p className="t-lead mt-1">{e.org}</p>
                  <p className="t-body t-body--mute mt-1">{e.role}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* 04 — the thesis */}
          <section className={panelBase} aria-labelledby="hz-thesis">
            <h3 id="hz-thesis" className="t-title max-w-[14ch]" data-hz-drift>
              {t.journey.thesisTitle}
            </h3>
            <p className="t-body t-body--mute mt-8 max-w-[52ch]">{t.journey.thesis}</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default AboutHorizontal;
