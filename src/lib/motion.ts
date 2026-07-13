/**
 * LA MAREA — motion design tokens (JS mirror of the CSS custom props in
 * globals.css: --dur-* and --ease-*). One vocabulary for the whole site:
 * import { DUR, EASE, STAGGER } and never write literal durations or ease
 * strings in components. The EASE names are registered as GSAP CustomEases
 * in src/lib/gsap.ts, so they are valid `ease:` values anywhere GSAP runs.
 *
 * Sanctioned exceptions (hand-reviewed feels, change only with a visual A/B):
 * scrubbed tweens keep `ease: "none"` (Lenis provides the easing); FlipText's
 * back.out(1.2) wordmark hinge was adversarially reviewed at that exact value.
 */

/** Durations (seconds) — mirror of --dur-* in globals.css :root. */
export const DUR = {
  /** micro-feedback: hover, focus, toggles */
  ripple: 0.15,
  /** UI state: nav, badges, underlines */
  wave: 0.3,
  /** text & element reveals */
  swell: 0.6,
  /** large settles: sections, images, curtains */
  tide: 1.1,
  /** cinematic set pieces: preloader, hero, GL zooms */
  breaker: 1.8,
} as const;

/** Signature eases — registered as CustomEases in src/lib/gsap.ts (CSS: --ease-*). */
export const EASE = {
  /** entrances & settles — the default voice */
  tide: "tide",
  /** curtains, wipes, state transitions */
  dive: "dive",
  /** ambient, continuous drift */
  drift: "drift",
  /** wave-overshoot for micro-emphasis (nodes, badges, odometer ticks) */
  crest: "crest",
} as const;

/** Canonical staggers (seconds) — chars for type, words for copy, blocks for layout. */
export const STAGGER = {
  chars: 0.025,
  words: 0.06,
  blocks: 0.12,
} as const;

/**
 * Global gain on how strongly Lenis scroll velocity deforms the world
 * (GL bend on /work, marquee tempo, caustic lift). 0 = the site never
 * reacts to speed; 1 = the tuned default.
 */
export const VELOCITY_GAIN = 1;
