"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/cn";

/*
  RollLink — THE single char-roll hover identity for chrome-tier text links
  (t-meta / nav-size DM Sans labels ONLY — never display sizes: Bricolage
  kerning breaks under char-span splitting).

  Mechanism (Codrops/Skiper char-roll, rebuilt on GSAP): the label renders
  twice — the visible row and an accent duplicate absolutely below it inside an
  overflow clip. On hover/focus every char of both rows rides up its own height
  (yPercent −100, 20ms stagger) on a paused, reversible timeline. No SplitText:
  chars are rendered by React from the `label` prop, so SSR markup is
  deterministic (no hydration risk) and locale flips rebuild them for free.

  ONE-TREATMENT-PER-LINK PARTITION (keep this table current):
  • RollLink → Nav pill section links · About "long version" · WorksGallery
    caption links · Footer Email/Top · subpage header back links
    (AboutJourney / WorkIndex / WorkCaseStudy).
  • .link (globals.css underline-draw) → in-flow reading links: case-study
    external resources + closing night rows · AboutJourney closing CTA.
  • Exempt → locale toggles (state switch), wordmarks (opacity fade),
    MenuOverlay (own identity), CVA buttons.

  A11y: an intact sr-only label is the accessible name; BOTH visual rows are
  aria-hidden, so AT reads words, never char soup. Arrow glyphs stay outside
  the roll (they'd read as stray punctuation) and get a 3px nudge instead.
  Gated behind (hover:hover)+(pointer:fine)+(no reduced-motion) — zero cost on
  touch; call-site CSS color transitions remain the hover fallback. focusin
  plays the roll for keyboard users too. will-change is applied on play and
  cleared on reverse-complete (the Magnetic pattern — no static promotion).
*/

type RollLinkOwnProps = {
  /** The rolling text. Must be a plain string (rendered twice). */
  label: string;
  /** Non-rolling glyph before the label (e.g. "←") — nudges on hover. */
  prefix?: string;
  /** Non-rolling glyph after the label (e.g. "→", "↗") — nudges on hover. */
  suffix?: string;
  className?: string;
  /** Extra non-rolling nodes (e.g. the Nav active-section underline). */
  children?: React.ReactNode;
};

type RollLinkProps = RollLinkOwnProps & {
  /** The rendered element/component ("button", "a", next/link…). */
  as?: React.ElementType;
  /** Pass-through props for `as` (href, onClick, aria-*, …). */
  [key: string]: unknown;
};

export function RollLink({
  as,
  label,
  prefix,
  suffix,
  className,
  children,
  ...rest
}: RollLinkProps) {
  const Tag = as ?? "span";
  const ref = React.useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(
        "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          const rows = el.querySelectorAll<HTMLElement>("[data-roll-row]");
          if (rows.length !== 2) return;
          const chars = [
            ...rows[0].querySelectorAll<HTMLElement>("[data-roll-char]"),
            ...rows[1].querySelectorAll<HTMLElement>("[data-roll-char]"),
          ];
          const arrows = el.querySelectorAll<HTMLElement>("[data-roll-arrow]");

          const tl = gsap.timeline({
            paused: true,
            defaults: { ease: "power2.out" },
            onReverseComplete: () => gsap.set(chars, { willChange: "auto" }),
          });
          tl.to(chars, { yPercent: -100, duration: 0.3, stagger: 0.02 }, 0);
          if (arrows.length) tl.to(arrows, { x: 3, duration: 0.25 }, 0);

          const enter = () => {
            gsap.set(chars, { willChange: "transform" });
            tl.timeScale(1).play();
          };
          const leave = () => tl.timeScale(1.35).reverse();
          el.addEventListener("pointerenter", enter);
          el.addEventListener("pointerleave", leave);
          el.addEventListener("focusin", enter);
          el.addEventListener("focusout", leave);
          return () => {
            el.removeEventListener("pointerenter", enter);
            el.removeEventListener("pointerleave", leave);
            el.removeEventListener("focusin", enter);
            el.removeEventListener("focusout", leave);
            tl.kill();
          };
        },
      );
      return () => mm.revert();
    },
    { scope: ref, dependencies: [label, prefix, suffix] },
  );

  const words = label.split(" ");
  const row = words.map((w, wi) => (
    <span key={wi} className="inline-block whitespace-nowrap">
      {Array.from(w).map((c, ci) => (
        <span key={ci} data-roll-char className="inline-block">
          {c}
        </span>
      ))}
      {/* nbsp: a normal trailing space inside an inline-block collapses away */}
      {wi < words.length - 1 ? " " : null}
    </span>
  ));

  // createElement (not JSX): a polymorphic `as` spread makes TS collapse the
  // JSX props of the ElementType union to `never` — the same trade the other
  // polymorphic primitives (DualWaveText) make.
  return React.createElement(
    Tag,
    { ref, className: cn("whitespace-nowrap", className), ...rest },
    prefix ? (
      <span key="pre" data-roll-arrow aria-hidden className="inline-block">
        {prefix}
        {" "}
      </span>
    ) : null,
    <span key="sr" className="sr-only">
      {label}
    </span>,
    <span key="roll" aria-hidden className="relative inline-block overflow-hidden align-bottom">
      <span data-roll-row className="block">
        {row}
      </span>
      {/* the rising duplicate — the accent tone of each surface */}
      <span data-roll-row className="absolute left-0 top-full block text-ember-ink night:text-amber">
        {row}
      </span>
    </span>,
    suffix ? (
      <span key="suf" data-roll-arrow aria-hidden className="inline-block">
        {" "}
        {suffix}
      </span>
    ) : null,
    children,
  );
}
