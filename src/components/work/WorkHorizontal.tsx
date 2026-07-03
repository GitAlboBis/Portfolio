"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { works } from "@/content/works";
import { LazyOnView } from "@/components/motion/LazyOnView";
import { ShallowWater } from "@/components/atmosphere/ShallowWater";

/*
  WorkHorizontal — the /work index as a scroll-driven horizontal gallery. A
  (n·100vh) runway with a sticky full-viewport stage: vertical scroll scrubs the
  slide track sideways (one screen of scroll per slide) while each slide's giant
  title and ghost index numeral drift AGAINST the travel at different speeds —
  cheap depth, no second scroll loop. Rides the global Lenis→ScrollTrigger
  backbone (Smooth.tsx): one scrubbed timeline, ease:none, position:sticky
  instead of pin (no pin-spacer to fight Lenis — same choice as the home gallery).

  transform-only animation. The stage is decorative interaction (aria-hidden,
  links tabIndex -1) mirrored by an accessible list — the same contract as the
  old arc carousel. reduced-motion → the plain editorial list.
*/

const TITLE_DRIFT = 0.2; // viewport-width fraction the title sweeps each way (foreground)
const INDEX_DRIFT = 0.09; // ghost numeral drifts slower — reads as a far layer

const pad = (v: number) => String(v).padStart(2, "0");

export function WorkHorizontal() {
  const t = useDict();
  const reduced = useUI((s) => s.reducedMotion);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const titleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const indexRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const n = works.length;

  useGSAP(
    () => {
      if (reduced) return;
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`;
            const i = Math.min(n - 1, Math.round(self.progress * (n - 1)));
            if (counterRef.current) counterRef.current.textContent = pad(i + 1);
          },
        },
      });

      // Track: n slides of 100vw each; travel (n-1) screens over (n-1) timeline units.
      tl.to(track, { xPercent: (-100 * (n - 1)) / n, duration: n - 1 }, 0);

      // Counter-drift: element i rests at x=0 exactly when its slide is centred
      // (timeline time = i) and slides opposite to the travel around that moment.
      const drift = (els: (HTMLElement | null)[], amp: number) =>
        els.forEach((el, i) => {
          if (!el) return;
          const t0 = Math.max(i - 1, 0);
          const t1 = Math.min(i + 1, n - 1);
          tl.fromTo(
            el,
            { x: () => window.innerWidth * amp * (i - t0) },
            { x: () => -window.innerWidth * amp * (t1 - i), duration: t1 - t0 },
            t0,
          );
        });
      drift(titleRefs.current, TITLE_DRIFT);
      drift(indexRefs.current, INDEX_DRIFT);
    },
    // revertOnUpdate: on a live reduced-motion flip the effect re-runs and
    // early-returns — without it the old ScrollTrigger would leak on detached DOM.
    { scope: sectionRef, dependencies: [reduced], revertOnUpdate: true },
  );

  // ── reduced-motion / no-JS friendly: a plain editorial list ────────────────
  if (reduced) {
    return (
      <section className="container-edit" style={{ paddingBlock: "var(--section-y)" }}>
        <p className="t-eyebrow eyebrow-tick mb-6">{t.works.eyebrow}</p>
        <h1 className="t-display mb-10">{t.works.title}</h1>
        {/* role="list": Tailwind preflight strips list-style, and Safari/VoiceOver
            drops implicit list semantics with it. */}
        <ol role="list" className="flex flex-col">
          {works.map((w, i) => {
            const inner = (
              <>
                <p className="t-index mb-1">{pad(i + 1)}</p>
                <p className="t-title">{w.title}</p>
                <p className="t-meta mt-2">
                  {w.org} · {w.year} · {w.role}
                </p>
              </>
            );
            return (
              <li key={w.slug} className="border-t border-[var(--color-rule)] py-7">
                {w.status === "confirmed" ? (
                  <Link href={`/work/${w.slug}`} className="block transition-opacity hover:opacity-70">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ol>
      </section>
    );
  }

  return (
    <>
      {/* Intro — settles the page title, then the runway takes over below. Sits
          over the ShallowWater atmosphere (the same shallow-water light as the
          /about intro), whose waterline dissolves before the runway begins. */}
      <div className="relative">
        <LazyOnView>
          <ShallowWater />
        </LazyOnView>
        <header
          className="container-edit relative flex min-h-[62vh] flex-col justify-end pb-[var(--block-y)]"
          style={{ paddingTop: "var(--nav-h)" }}
        >
          <p className="t-eyebrow eyebrow-tick mb-6">{t.works.eyebrow}</p>
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <h1 id="works-title" className="t-display max-w-[14ch]">
              {t.works.title}
            </h1>
            <p className="t-meta mb-2">{t.hero.scroll} ↓</p>
          </div>
        </header>
      </div>

      <section ref={sectionRef} aria-labelledby="works-title" className="relative" style={{ height: `${n * 100}vh` }}>
        <div aria-hidden className="sticky top-0 h-screen overflow-hidden">
          <ul ref={trackRef} className="flex h-full w-max will-change-transform">
            {works.map((w, i) => {
              const inner = (
                <>
                  {/* top row: provenance + WIP badge. In-slide meta reads in full
                      ink — ink-mute dips below AA where the mood blobs peak. */}
                  <div className="flex items-start justify-between gap-6">
                    <p className="t-meta text-ink">
                      {w.org} · {w.year}
                    </p>
                    {w.status === "provisional" ? (
                      <span className="rounded-full bg-night/85 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-paper">
                        {t.works.wip}
                      </span>
                    ) : null}
                  </div>

                  {/* the drifting giant title */}
                  <div
                    ref={(el) => {
                      titleRefs.current[i] = el;
                    }}
                    className="will-change-transform"
                  >
                    <h2 className="font-display text-[clamp(2.5rem,8vw,8.5rem)] font-bold leading-[0.92] tracking-[-0.03em] text-ink [text-wrap:balance]">
                      {w.title}
                    </h2>
                  </div>

                  {/* bottom row: role + stack, CTA */}
                  <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
                    <div>
                      <p className="t-meta text-ink">{w.role}</p>
                      <p className="t-meta mt-2 normal-case tracking-normal text-ink-mute">
                        {w.stack.slice(0, 4).join(" · ")}
                        {w.stack.length > 4 ? ` · +${w.stack.length - 4}` : ""}
                      </p>
                    </div>
                    {w.status === "confirmed" ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-rule-strong px-6 py-3 t-meta text-ink transition-colors duration-300 group-hover:border-ember group-hover:text-ember-ink">
                        {t.works.open} →
                      </span>
                    ) : null}
                  </div>
                </>
              );

              return (
                <li key={w.slug} className="relative h-full w-screen overflow-hidden" style={{ background: w.mood.base }}>
                  {/* mood wash — static gradients, they only translate with the track */}
                  <span
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: `radial-gradient(55% 70% at 18% 28%, ${w.mood.blob1}59, transparent 70%), radial-gradient(50% 65% at 84% 78%, ${w.mood.blob2}47, transparent 70%)`,
                    }}
                  />
                  {/* ghost index — the far parallax layer */}
                  <span
                    ref={(el) => {
                      indexRefs.current[i] = el;
                    }}
                    className="pointer-events-none absolute -bottom-[7vw] right-[2vw] font-display text-[36vw] font-bold leading-none will-change-transform"
                    style={{ color: "color-mix(in oklab, var(--color-ink) 6%, transparent)" }}
                  >
                    {pad(i + 1)}
                  </span>

                  {w.status === "confirmed" ? (
                    <Link
                      href={`/work/${w.slug}`}
                      tabIndex={-1}
                      className="group relative flex h-full flex-col justify-between px-[var(--gutter)] pb-28 pt-[calc(var(--nav-h)+1.5rem)]"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className="relative flex h-full flex-col justify-between px-[var(--gutter)] pb-28 pt-[calc(var(--nav-h)+1.5rem)]">
                      {inner}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* progress — counter + ember line, fixed inside the sticky stage */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0">
            <div className="container-edit flex items-center gap-5 pb-9">
              <p className="t-index shrink-0 text-ink">
                <span ref={counterRef}>01</span> / {pad(n)}
              </p>
              <div className="relative h-px flex-1 bg-[var(--color-rule)]">
                <div ref={barRef} className="absolute inset-0 origin-left bg-ember" style={{ transform: "scaleX(0)" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Accessible mirror, INSIDE the labelled region (the stage above is
            decorative interaction). Each link surfaces as a visible skip-pill
            when keyboard-focused — the stage itself holds nothing focusable. */}
        <ol role="list" className="fixed bottom-6 left-6 z-[70]">
          {works.map((w) => (
            <li key={w.slug}>
              {w.status === "confirmed" ? (
                <Link
                  href={`/work/${w.slug}`}
                  className="sr-only focus-visible:not-sr-only focus-visible:inline-block focus-visible:border focus-visible:border-rule-strong focus-visible:bg-paper focus-visible:px-5 focus-visible:py-3 focus-visible:text-sm focus-visible:font-medium focus-visible:text-ink"
                >
                  {w.title} — {w.role}, {w.year}
                </Link>
              ) : (
                <span className="sr-only">{`${w.title} — ${w.role} (${t.works.wip})`}</span>
              )}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
