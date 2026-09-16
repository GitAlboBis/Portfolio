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

  // ── DEPRECATED aliases (Golden Hour names) — old components compile until
  //    WP-9 deletes them. Mapped onto the new vocabulary; do not use in new code.
  /** @deprecated use DUR.swap */
  ripple: 0.15,
  /** @deprecated use DUR.rule */
  wave: 0.32,
  /** @deprecated use DUR.sheet */
  swell: 0.42,
  /** @deprecated use DUR.print */
  tide: 0.5,
  /** @deprecated use DUR.print */
  breaker: 0.5,
} as const;

/** Signature eases — CustomEases in src/lib/gsap.ts (CSS: --ease-*). */
export const EASE = {
  /** RULE-IN — rules drawing themselves; the default voice */
  rule: "rule",
  /** STAMP — impact with a hair of overshoot */
  stamp: "stamp",
  /** route cover (the sheet) */
  sheet: "sheet",

  // ── DEPRECATED aliases — old components compile until WP-9.
  /** @deprecated use EASE.rule */
  tide: "rule",
  /** @deprecated use EASE.sheet */
  dive: "sheet",
  /** @deprecated use EASE.sheet */
  drift: "sheet",
  /** @deprecated use EASE.stamp */
  crest: "stamp",
} as const;

/** Canonical staggers (seconds). */
export const STAGGER = {
  /** table rows under RULE-IN */
  rows: 0.04,

  // ── DEPRECATED aliases — old components compile until WP-9.
  /** @deprecated no per-character reveals in this world; maps to rows */
  chars: 0.04,
  /** @deprecated no per-word reveals in this world; maps to rows */
  words: 0.04,
  /** @deprecated use STAGGER.rows */
  blocks: 0.04,
} as const;

/**
 * @deprecated Golden Hour velocity coupling (GL bend, marquee tempo). Nothing in
 * the job order reacts to scroll speed. Kept at 0 so the old consumers stay
 * inert until WP-9 deletes them.
 */
export const VELOCITY_GAIN = 0;
