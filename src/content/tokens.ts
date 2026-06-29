/**
 * tokens.ts — single source of truth for color on the JS/WebGL side.
 * MIRRORS the `@theme` block in src/app/globals.css.
 *
 * Direction: GOLDEN HOUR. Light/warm-white site, sunset palette — orange (ember)
 * led, with coral/amber/rose warmth, a cool dusk counterpoint, and one deep
 * "night" band for drama. Text is warm ink. Light-first (not system-dark).
 */

export const palette = {
  // ── Ground / neutrals (warm whites → warm dark text) ──────────────────────
  paper: "#fbf6ef", // page ground (warm white)
  paperDeep: "#f1e4d3", // secondary surface, cards, hairlines
  ink: "#2a1a14", // primary text (warm espresso)
  inkMute: "#6e5447", // muted text — AA on paper

  // ── Sunset ramp: golden → dusk ────────────────────────────────────────────
  amber: "#f2a33c", // golden hour — fills, large accents
  coral: "#ff8a4c", // peach-coral — fills, gradient mid
  ember: "#ee5b23", // PRIMARY accent (orange) — fills, large display, CTAs
  emberInk: "#bc410f", // darker orange for ORANGE TEXT that needs AA on paper
  rose: "#e15d6b", // sunset rose-red — accent, gradient
  dusk: "#5e4b7e", // cool twilight violet — counterpoint accent / depth

  // ── Drama band ─────────────────────────────────────────────────────────────
  night: "#2a1820", // deep warm plum — the one dark section / footer (text = paper)
} as const;

export type PaletteToken = keyof typeof palette;

/**
 * The sunset gradient — warm (golden) → cool (dusk). Used for the hero sky,
 * section washes, and the molten "A". Mirror of --gradient-sunset in CSS.
 */
export const sunsetStops: readonly string[] = [
  "#ffe3b0",
  palette.amber,
  palette.coral,
  palette.ember,
  palette.rose,
  palette.dusk,
] as const;

/** A per-project atmospheric mood for the Works depth gallery — tokens only. */
export interface Mood {
  base: string;
  blob1: string;
  blob2: string;
}

export const defaultMood: Mood = {
  base: palette.paper,
  blob1: palette.amber,
  blob2: palette.coral,
};
