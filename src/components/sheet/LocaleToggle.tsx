"use client";

import * as React from "react";
import { useUI, type Locale } from "@/store/ui";
import { useDict } from "@/content/dict";
import { useHydratedLocale } from "@/lib/use-hydrated";
import { cn } from "@/lib/cn";

/**
 * LocaleToggle — EN | IT as two ruled cells (REDESIGN-SPEC §E.1). transitions.dev
 * 16 "tabs-sliding" re-expressed without the pill: one ink block slides from
 * cell to cell in 150ms `--dur-swap` (linear) while the labels swap
 * paper ↔ ink in the same 150ms. The block is a real element (not a border
 * trick) so the fill visibly moves; reduced motion keeps the swap — it is
 * feedback, not spectacle (§C.7).
 *
 * The persisted locale differs from the SSR shell ("en") until hydration, so
 * the render-time branch goes through `useHydratedLocale` (no mismatch).
 * Accessible name: the visible code + the sr-only `a11y.langToggle` suffix.
 */
const LOCALES: readonly Locale[] = ["en", "it"];

export function LocaleToggle({ className }: { className?: string }) {
  const t = useDict();
  const locale = useHydratedLocale();
  const setLocale = useUI((s) => s.setLocale);
  const idx = LOCALES.indexOf(locale);

  return (
    <div
      role="group"
      aria-label={t.a11y.langToggle}
      className={cn("relative grid h-full grid-cols-2 items-stretch", className)}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-ink transition-transform duration-[var(--dur-swap)] ease-linear"
        style={{ transform: `translateX(${idx * 100}%)` }}
      />
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            lang={l}
            aria-pressed={active}
            onClick={() => setLocale(l)}
            className={cn(
              "f-strip relative z-[1] flex h-full min-w-[2.75rem] cursor-pointer items-center justify-center",
              "border-l border-ink px-3 uppercase tracking-[0.06em]",
              "transition-colors duration-[var(--dur-swap)] ease-linear",
              active ? "text-paper" : "text-ink hover:bg-paper-field",
            )}
          >
            {l.toUpperCase()}
            <span className="sr-only"> — {t.a11y.langToggle}</span>
          </button>
        );
      })}
    </div>
  );
}
