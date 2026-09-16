/**
 * THE JOB ORDER — motion tokens (JS mirror of `--dur-*` / `--ease-*` in
 * src/app/globals.css :root, REDESIGN-SPEC.md §C.6–C.7). Two verbs only:
 * RULE-IN (a rule draws itself, then the type appears) and STAMP (impact).
 * Import { DUR, EASE, STAGGER } — never write literal durations or ease strings
 * in components. EASE names are GSAP CustomEases registered in src/lib/gsap.ts.
 *
 * Never animated: numbers (no count-up), body copy, the bench canvas, the
 * yellow regions. Scrubbed tweens keep `ease: "none"` (Lenis does the easing).
 */

/** Durations (seconds) — mirror of --dur-* in globals.css. */
export const DUR = {
  /** row hover fill, link underline 1→2px */
  hover: 0.12,
  /** local flip / text-state swap (opacity, in place) */
  swap: 0.15,
  /** type appearing after its rule (opacity only, no translation) */
  text: 0.18,
  /** STAMP impact */
  stamp: 0.22,
  /** RULE-IN: scaleX 0→1 from the left */
  rule: 0.32,
  /** route cover: the paper sheet rising */
  sheet: 0.42,
  /** preloader: "the form printing itself" */
  print: 0.5,
} as const;

/** Signature eases — CustomEases in src/lib/gsap.ts (CSS: --ease-*). */
export const EASE = {
  /** RULE-IN — rules drawing themselves; the default voice */
  rule: "rule",
  /** STAMP — impact with a hair of overshoot */
  stamp: "stamp",
  /** route cover (the sheet) */
  sheet: "sheet",
} as const;

/** Canonical staggers (seconds). */
export const STAGGER = {
  /** table rows under RULE-IN */
  rows: 0.04,
} as const;
