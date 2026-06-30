"use client";

import { useDict } from "@/content/dict";
import { TechCloud } from "@/components/tech-cloud";
import { techIcons } from "@/data/skill-icons";
import { Parallax } from "@/components/motion/Parallax";
import { ScrollText } from "@/components/reveal/ScrollText";
import { Marquee } from "@/components/motion/Marquee";

/**
 * Tech — the stack section. Editorial heading (eyebrow + title from the EN/IT
 * dictionary) over the signature 3D icon cloud (TechCloud). The cloud is
 * decorative (aria-hidden), so a visually-hidden list carries the stack to screen
 * readers. All copy from the dictionary; all styling from Golden Hour tokens.
 */
export function Tech() {
  const t = useDict();
  return (
    <section
      id="tech"
      className="scroll-anchor"
      aria-labelledby="tech-title"
      style={{ paddingBlock: "var(--section-y)" }}
    >
      {/* Velocity-coupled keyword ticker — a warm-air ribbon leading into the stack. */}
      <Marquee
        items={t.tech.marquee}
        className="bleed mb-[var(--section-y)] border-y border-[var(--color-rule)]"
      />

      <div className="container-edit grid-edit">
        <Parallax className="col-meta mb-6 lg:mb-0" from={66}>
          <p className="t-eyebrow eyebrow-tick">{t.tech.eyebrow}</p>
        </Parallax>
        <ScrollText as="h2" id="tech-title" className="col-read t-display max-w-[16ch]">
          {t.tech.title}
        </ScrollText>
      </div>

      <div className="container-edit">
        <TechCloud className="mx-auto w-full max-w-5xl" />
      </div>

      {/* The cloud is decorative (aria-hidden); expose the stack to screen readers. */}
      <ul className="sr-only">
        {techIcons.map((i) => (
          <li key={i.label}>{i.label}</li>
        ))}
      </ul>
    </section>
  );
}
