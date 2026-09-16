"use client";

import * as React from "react";
import { useDict } from "@/content/dict";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { Stamp } from "@/components/sheet/Stamp";
import { links } from "@/content/career";
import { phaseAnchor } from "@/lib/phases";
import { cn } from "@/lib/cn";

/**
 * Release — the signature of the job order (REDESIGN-SPEC §E.10).
 *
 *   variant="panel" (`#phase-release`) the full-width safety-yellow panel that
 *     closes the sheet: `min-height: 60vh`, the headline in `.f-headline` ink,
 *     the address as a large ruled INK link (56px target, never stamp red on
 *     yellow — §C.2 forbids it), the four public links from `career.ts`, and
 *     the RELEASED stamp landing once in the top-right corner.
 *   variant="box" the signature cell of the first viewport (§A row D): the
 *     same yellow, the caption and the address — the primary action is on
 *     screen before anything is scrolled.
 *
 * Yellow is a REGION here, never a stripe, and it never animates (§C.7): the
 * only motion is the one stamp landing.
 */
export type ReleaseVariant = "panel" | "box";

export interface ReleaseProps {
  variant?: ReleaseVariant;
  className?: string;
}

const LINK_ON_SAFETY =
  "f-cell text-ink underline decoration-1 underline-offset-[4px] " +
  "transition-[text-decoration-thickness] duration-[var(--dur-hover)] ease-linear " +
  "hover:decoration-2 focus-visible:decoration-2";

export function Release({ variant = "panel", className }: ReleaseProps) {
  const t = useDict();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [released, setReleased] = React.useState(false);

  useGSAP(
    () => {
      if (variant !== "panel") return;
      const root = rootRef.current;
      if (!root) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setReleased(true); // already impressed (§C.7 reduced motion)
        return;
      }
      const st = ScrollTrigger.create({
        trigger: root,
        start: "top 70%",
        once: true,
        onEnter: () => setReleased(true),
      });
      return () => st.kill();
    },
    { scope: rootRef, dependencies: [variant] },
  );

  const address = (
    <a
      href={`mailto:${t.release.email}`}
      className={cn(
        "inline-flex min-h-[56px] items-center text-ink",
        "underline decoration-1 underline-offset-[8px]",
        "transition-[text-decoration-thickness] duration-[var(--dur-hover)] ease-linear",
        "hover:decoration-2 focus-visible:decoration-2",
        variant === "panel" ? "f-headline" : "f-role font-semibold",
      )}
    >
      {t.release.cta}
    </a>
  );

  if (variant === "box") {
    return (
      <div
        ref={rootRef}
        className={cn(
          "flex min-w-0 flex-col justify-between gap-4 border border-ink bg-safety p-5 text-ink",
          className,
        )}
      >
        <span className="f-caption block">{t.release.caption}</span>
        <span className="block">{address}</span>
      </div>
    );
  }

  return (
    <section
      id={phaseAnchor("release")}
      aria-labelledby="release-caption"
      className={cn("scroll-mt-[var(--band-h)] pt-[var(--section-gap)]", className)}
    >
      <div
        ref={rootRef}
        className="sheet flex min-h-[60vh] flex-col justify-between border-y border-ink bg-safety py-10 text-ink"
      >
        <div className="flex items-start justify-between gap-6">
          <h2 id="release-caption" className="f-caption">
            {t.release.caption}
          </h2>
          <Stamp
            label={t.release.stamp}
            variant="released"
            active={released}
            className="shrink-0 pr-2"
          />
        </div>

        {/* the measure belongs to the HEADLINE, not to its 16px wrapper:
            `ch` there would resolve against the wrapper's font and squeeze the
            line to one word. */}
        <p className="f-headline mt-10 max-w-[22ch]">{t.release.headline}</p>

        <div className="mt-10">{address}</div>

        <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          <li>
            <a href={links.linkedin.href} className={LINK_ON_SAFETY} rel="me noopener">
              {t.release.links.linkedin} · {links.linkedin.display}
            </a>
          </li>
          <li>
            <a href={links.github.href} className={LINK_ON_SAFETY} rel="me noopener">
              {t.release.links.github} · {links.github.display}
            </a>
          </li>
          <li>
            <a href={links.sersan.href} className={LINK_ON_SAFETY} rel="noopener">
              {t.release.links.sersan} · {links.sersan.display}
            </a>
          </li>
          <li>
            <a href={links.spherenode.href} className={LINK_ON_SAFETY} rel="noopener">
              {t.release.links.spherenode} · {links.spherenode.display}
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
