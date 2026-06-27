"use client";

import { useRef } from "react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useScrollParallax } from "@/components/descending-world";
import { useLanguage } from "@/components/language-provider";
import { skillGroups } from "@/data/skills";
import { cn } from "@/lib/utils";

/*
  SkillsSection — a signature "instrument panel" of the stack. Asymmetric bento
  of double-bezel cards (outer shell + inner core, concentric radii) on the deep
  abyss. Each card responds to the pointer like wet glass: a soft 3D tilt toward
  the cursor and a celeste light-bloom that tracks under it. Calm at rest,
  tactile under the hand — no chip-soup, no gimmick. Reduced-motion = inert.
*/

// Asymmetric 12-col bento: 5/7 · 4/4/4 · 12 — breaks the boring even grid.
const SPANS = [
  "md:col-span-5",
  "md:col-span-7",
  "md:col-span-4",
  "md:col-span-4",
  "md:col-span-4",
  "md:col-span-12",
];

function SkillCard({
  index,
  label,
  items,
  wide,
}: {
  index: number;
  label: string;
  items: string[];
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    el.style.setProperty("--rx", `${((0.5 - py) * 5).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((px - 0.5) * 5).toFixed(2)}deg`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div className="group h-full [perspective:1100px]">
      {/* Outer shell (machined tray) */}
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ ["--mx" as string]: "50%", ["--my" as string]: "50%" }}
        className="relative h-full rounded-[1.75rem] bg-foam/[0.04] p-1.5 ring-1 ring-foam/10 transition-[transform,box-shadow,--tw-ring-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] [transform-style:preserve-3d] will-change-transform group-hover:ring-celeste/25 group-hover:shadow-[0_30px_80px_-50px_rgba(0,0,0,0.85)] motion-reduce:!transform-none"
      >
        {/* Inner core (glass plate) */}
        <div className="relative h-full overflow-hidden rounded-[1.4rem] border border-foam/10 bg-gradient-to-b from-foam/[0.05] to-transparent p-7 shadow-[inset_0_1px_0_rgb(244_250_251/0.10)] sm:p-8">
          {/* pointer-tracked celeste bloom */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(420px circle at var(--mx) var(--my), rgb(155 211 238 / 0.16), transparent 62%)",
            }}
          />
          <div className="relative flex h-full flex-col gap-6">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="heading-3 text-foam">{label}</h3>
              <span className="label tabular !text-[0.7rem] text-celeste/60">
                {String(index).padStart(2, "0")}
              </span>
            </div>
            <ul
              className={cn(
                "flex flex-wrap gap-2",
                wide && "sm:gap-2.5",
              )}
            >
              {items.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-rule bg-foam/[0.03] px-3 py-1.5 font-sans text-[0.8rem] tracking-wide text-mist transition-colors duration-300 group-hover:border-foam/20 hover:!border-celeste/45 hover:!text-foam"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkillsSection() {
  const { lang, t } = useLanguage();
  const headerRef = useScrollParallax<HTMLDivElement>(24);

  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      className="scroll-anchor py-28 sm:py-36 md:py-44"
    >
      <Container>
        <Reveal variant="clip-up">
          <header ref={headerRef} className="flex max-w-2xl flex-col gap-6">
            <span className="inline-flex w-max items-center gap-2.5 rounded-full border border-rule px-3.5 py-1.5">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-celeste" />
              <span className="label !text-[0.66rem] text-mist">
                {t.skills.eyebrow}
              </span>
            </span>
            <h2 id="skills-heading" className="heading-1 text-balance text-foam">
              {t.skills.heading}
            </h2>
          </header>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:mt-20 md:grid-cols-12">
          {skillGroups.map((group, i) => (
            <Reveal
              key={group.label.en}
              variant="clip-up"
              delay={i * 80}
              className={cn("h-full", SPANS[i])}
            >
              <SkillCard
                index={i + 1}
                label={group.label[lang]}
                items={group.items}
                wide={i === skillGroups.length - 1}
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
