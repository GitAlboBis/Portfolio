"use client";

import { TransitionLink as Link } from "@/components/transition/TransitionLink";
import { useDict } from "@/content/dict";
import { WordGenerate } from "@/components/reveal/WordGenerate";
import { ScrollWords } from "@/components/reveal/ScrollWords";
import { Parallax } from "@/components/motion/Parallax";
import { RollLink } from "@/components/motion/RollLink";
import { GoldenHaze } from "@/components/atmosphere/GoldenHaze";
import { DriftBand } from "@/components/motion/DriftBand";

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
          <RollLink
            as={Link}
            href="/about"
            label={t.journey.eyebrow}
            suffix="→"
            className="mt-8 inline-block t-meta text-ember-ink transition-opacity duration-300 hover:opacity-75"
          />
        </div>
      </div>

      {/* Kinetic seam into Selected Work: the works title + the hero tagline
          (its echo, after the hero scrolled it away) counter-drift at display
          scale, steered by scroll velocity. Decorative — the real works h2
          lives (sr-only) in the gallery; the tagline is the hero h1's sibling. */}
      <DriftBand
        className="relative mt-[clamp(4.5rem,11vh,8.5rem)] pb-[clamp(3rem,7vh,5.5rem)]"
        rows={[
          { text: t.works.title, dir: 1, variant: "stroke" },
          { text: t.hero.tagline, dir: -1, variant: "ink" },
        ]}
      />
    </section>
  );
}
