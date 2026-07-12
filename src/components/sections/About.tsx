"use client";

import Link from "next/link";
import { useDict } from "@/content/dict";
import { WordGenerate } from "@/components/reveal/WordGenerate";
import { ScrollWords } from "@/components/reveal/ScrollWords";
import { Parallax } from "@/components/motion/Parallax";
import { RollLink } from "@/components/motion/RollLink";

/**
 * About — first content section (the descent below the hero).
 * Editorial layout: left-rail eyebrow (col-meta) + offset reading column
 * (col-read). The lead line rises in on scroll (Reveal split-text, blur on
 * desktop). All copy from the EN/IT dictionary; all styling from the Golden
 * Hour tokens/type scale.
 */
export function About() {
  const t = useDict();
  return (
    <section id="about" className="scroll-anchor">
      <div className="container-edit grid-edit">
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
    </section>
  );
}
