"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";

/**
 * Stamp — the STAMP verb (REDESIGN-SPEC §C.7.2), a rubber stamp landing on the
 * sheet: `scale 1.18→1`, `rotate −1°→−3.5°`, `opacity 0→1`,
 * `filter blur(1.2px)→blur(.4px)` in 220ms `stamp`, then a 60ms settle of
 * `translateY 1px`. The role tag (ink, 12px) appears under it with a 150ms
 * opacity swap once the impact has landed.
 *
 * Filled stamp everywhere (bg `stamp`, text `paper`, 6.27:1) — the only
 * lettering allowed on the yellow band (§C.2: no outlined red on yellow).
 * Variants only set the size: `band` (inside a 56/48px cell), `live` (bench),
 * `released` (signature), `void` (404, large).
 *
 * `active` = stamped. It never un-stamps (a job card accumulates); the tween
 * fires when `active` flips to true. Reduced motion → the end state is set
 * statically (no impact). Decorative: the accessible name is the cell / field
 * that hosts it, so the root is `aria-hidden`.
 */
export type StampVariant = "band" | "live" | "released" | "void";

export interface StampProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  roleTag?: string;
  variant?: StampVariant;
  active?: boolean;
}

const REST = { scale: 1, rotate: -3.5, opacity: 1, filter: "blur(0.4px)", y: 0 };
const AWAY = { scale: 1.18, rotate: -1, opacity: 0, filter: "blur(1.2px)", y: 0 };

const SIZE: Record<StampVariant, string> = {
  band: "text-[clamp(0.75rem,0.62rem+0.45vw,1rem)] px-[0.5em] py-[0.22em] border-[1.5px]",
  live: "f-stamp px-[0.6em] py-[0.35em] border-2",
  released: "f-stamp px-[0.7em] py-[0.4em] border-2",
  void: "text-[clamp(2rem,1rem+3vw,3.5rem)] px-[0.5em] py-[0.25em] border-[3px]",
};

export function Stamp({
  label,
  roleTag,
  variant = "band",
  active = true,
  className,
  ...rest
}: StampProps) {
  const rootRef = React.useRef<HTMLSpanElement>(null);
  const markRef = React.useRef<HTMLSpanElement>(null);
  const tagRef = React.useRef<HTMLSpanElement>(null);
  const landed = React.useRef(false);

  useGSAP(
    () => {
      const mark = markRef.current;
      const tag = tagRef.current;
      if (!mark) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!active) {
        landed.current = false;
        gsap.set(mark, AWAY);
        if (tag) gsap.set(tag, { opacity: 0 });
        return;
      }
      if (reduced || landed.current) {
        gsap.set(mark, REST);
        if (tag) gsap.set(tag, { opacity: 1 });
        landed.current = true;
        return;
      }
      landed.current = true;
      const tl = gsap.timeline();
      tl.fromTo(mark, AWAY, { ...REST, duration: DUR.stamp, ease: EASE.stamp })
        .to(mark, { y: 1, duration: 0.06, ease: "none" });
      if (tag) tl.fromTo(tag, { opacity: 0 }, { opacity: 1, duration: DUR.swap, ease: "none" }, "-=0.06");
    },
    { scope: rootRef, dependencies: [active] },
  );

  return (
    <span
      ref={rootRef}
      aria-hidden
      className={cn("pointer-events-none inline-flex flex-col items-center gap-[2px]", className)}
      {...rest}
    >
      <span
        ref={markRef}
        className={cn(
          "inline-block whitespace-nowrap border-stamp bg-stamp text-paper uppercase leading-none",
          "font-bold tracking-[0.04em] [font-variation-settings:'wdth'_75] will-change-transform",
          "[transform:rotate(-3.5deg)]",
          SIZE[variant],
        )}
        style={active ? undefined : { opacity: 0 }}
      >
        {label}
      </span>
      {roleTag ? (
        <span
          ref={tagRef}
          className="whitespace-nowrap text-[12px] font-medium leading-none tracking-[0.04em] text-ink [font-variation-settings:'wdth'_87]"
          style={active ? undefined : { opacity: 0 }}
        >
          {roleTag}
        </span>
      ) : null}
    </span>
  );
}
