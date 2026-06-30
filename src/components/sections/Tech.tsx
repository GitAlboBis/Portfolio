"use client";

import { useDict } from "@/content/dict";
import { TechCloud } from "@/components/tech-cloud";
import { techIcons } from "@/data/skill-icons";

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
      <div className="container-edit grid-edit">
        <div className="col-meta mb-6 lg:mb-0">
          <p className="t-eyebrow eyebrow-tick">{t.tech.eyebrow}</p>
        </div>
        <div className="col-read">
          <h2 id="tech-title" className="t-display max-w-[16ch]">
            {t.tech.title}
          </h2>
        </div>
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
