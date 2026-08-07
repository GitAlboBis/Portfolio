"use client";

import { useDict } from "@/content/dict";
import { WordGenerate } from "@/components/reveal/WordGenerate";
import { ScrollWords } from "@/components/reveal/ScrollWords";
import { Parallax } from "@/components/motion/Parallax";
import { GoldenHaze } from "@/components/atmosphere/GoldenHaze";
import { UnderPaper } from "@/components/atmosphere/UnderPaper";
import { AboutHorizontal } from "@/components/about/AboutHorizontal";

/**
 * About — first content section (the descent below the hero).
 * Editorial layout: left-rail eyebrow (col-meta) + offset reading column
 * (col-read). The lead line rises in on scroll (Reveal split-text, blur on
 * desktop). All copy from the EN/IT dictionary; all styling from the Golden
 * Hour tokens/type scale.
 *
 * The band is no longer flat paper: GoldenHaze paints the sky continuing
 * behind it (afterglow bleed → warm haze → horizon → grain → works-mood
 * pre-echo), and DriftBand closes the section with a kinetic type seam.
 * Both live inside this section so `overflow-clip` frames the sky.
 * Atmosphere first in DOM = painted under the positioned content after it.
 *
 * (A WebGL boid murmuration used to fly through this band; removed 2026-08-06
 * at Alberto's request along with the home Escort flock.)
 */
export function About() {
  const t = useDict();
  return (
    <section id="about" className="scroll-anchor relative overflow-clip pt-[var(--section-y)]">
      <GoldenHaze />

      {/* THE WATER UNDER THE PAPER — dragging across the opening erodes the
          page surface and the sea shows through the fibres; it heals when the
          pointer rests (three-skull erosion port, B6). Under the content grid,
          whose reading shield keeps the copy on paper regardless. */}
      <UnderPaper className="absolute inset-x-0 top-0 h-[110vh]" />

      <div className="container-edit grid-edit relative z-10">
        {/* Reading shield — a feathered paper veil UNDER the copy (own stacking
            context via z-10, shield at -z-10): the haze crossing the text zone
            gets pushed into atmospheric depth, so ink/ink-mute/ember-ink hold AA
            wherever the sky is brightest. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-10 -inset-y-12 -z-10 md:-inset-x-20 md:-inset-y-16"
          style={{
            background: "color-mix(in srgb, var(--color-paper) 85%, transparent)",
            // feather must die out BEFORE the box edges or the veil hard-cuts
            maskImage:
              "radial-gradient(ellipse 50% 50% at 42% 40%, #000 38%, transparent 88%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 50% 50% at 42% 40%, #000 38%, transparent 88%)",
          }}
        />
        <Parallax className="col-meta mb-8 lg:mb-0" from={70}>
          <p className="t-eyebrow eyebrow-tick">{t.about.eyebrow}</p>
        </Parallax>

        <div className="col-read">
          <WordGenerate as="h2" className="t-display max-w-[18ch]">
            {t.about.lead}
          </WordGenerate>
          {/* body drifts on a shallower layer than the eyebrow -> depth; the copy
              "reads along" — words brighten word-by-word, welded to scroll */}
          <Parallax className="mt-8" from={-26}>
            <ScrollWords as="p" className="t-body t-body--mute">
              {t.about.body}
            </ScrollWords>
          </Parallax>
        </div>
      </div>

      {/* THE LONG VERSION, in full — it used to be a link out to /about. The
          statement above stays as the entry, and the whole journey (bio,
          education, experience, thesis) now travels SIDEWAYS from here
          (era-residence's horizontal scroller — see AboutHorizontal). */}
      <AboutHorizontal />

      {/* (A counter-drifting kinetic type seam used to close this section;
          removed 2026-08-06 — Alberto: the scrolling strips read as a cut, not
          as a transition. The seam into Selected Work is now the arch rise.) */}
      <div className="h-[clamp(3rem,8vh,6rem)]" />
    </section>
  );
}
