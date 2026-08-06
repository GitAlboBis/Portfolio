"use client";

import dynamic from "next/dynamic";
import { useDict } from "@/content/dict";
import { techIcons } from "@/data/skill-icons";

// Code-split: tech-cloud.tsx does `import * as THREE from "three"` — a static
// import here was the ONE path still pulling the whole three module into the
// home route's initial client chunk (LazyOnView defers the MOUNT, not the
// download). dynamic+ssr:false keeps the chunk off the wire until the section
// nears the viewport, the same split the works gallery uses.
const TechCloud = dynamic(() => import("@/components/tech-cloud").then((m) => m.TechCloud), {
  ssr: false,
});
import { Parallax } from "@/components/motion/Parallax";
import { TideReveal } from "@/components/reveal/TideReveal";
import { LazyOnView } from "@/components/motion/LazyOnView";

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
      {/* (A velocity-coupled keyword ticker sat here behind two full-bleed rules;
          removed 2026-08-06 — Alberto: the scrolling strips read as a cut, and
          the border-y rules were literally drawing the seam we want to erase.) */}

      <div className="container-edit grid-edit">
        <Parallax className="col-meta mb-6 lg:mb-0" from={66}>
          <p className="t-eyebrow eyebrow-tick">{t.tech.eyebrow}</p>
        </Parallax>
        <TideReveal as="h2" id="tech-title" className="col-read t-display max-w-[16ch]">
          {t.tech.title}
        </TideReveal>
      </div>

      <div className="container-edit">
        {/* Deferred: the icon-cloud WebGL context is created only as the section nears,
            not at page load. minHeight reserves the cloud's box so there's no layout shift. */}
        <LazyOnView
          className="mx-auto w-full max-w-5xl"
          style={{ minHeight: "clamp(20rem, 46vw, 32rem)" }}
        >
          <TechCloud className="w-full" />
        </LazyOnView>
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
