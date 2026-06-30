"use client";

import { useDict } from "@/content/dict";
import { WordGenerate } from "@/components/reveal/WordGenerate";
import { Parallax } from "@/components/motion/Parallax";

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
          {/* body drifts on a shallower layer than the eyebrow -> depth */}
          <Parallax className="mt-8" from={-26}>
            <p className="t-body t-body--mute">{t.about.body}</p>
          </Parallax>
        </div>
      </div>
    </section>
  );
}
