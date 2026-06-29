"use client";

import { useDict } from "@/content/dict";
import { Reveal } from "@/components/reveal/Reveal";

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
        <div className="col-meta mb-8 lg:mb-0">
          <p className="t-eyebrow eyebrow-tick">{t.about.eyebrow}</p>
        </div>

        <div className="col-read">
          <Reveal as="h2" className="t-display max-w-[18ch]" blur>
            {t.about.lead}
          </Reveal>
          <p className="t-body t-body--mute mt-8">{t.about.body}</p>
        </div>
      </div>
    </section>
  );
}
