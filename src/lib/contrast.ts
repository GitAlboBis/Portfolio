/**
 * contrast.ts — WCAG 2.x relative luminance + contrast ratio from hex colours.
 * THE JOB ORDER (REDESIGN-SPEC §B "from The standards manual" + §C.2): the
 * /styleguide page prints every AA ratio COMPUTED at render time from
 * src/content/tokens.ts, never a hand-typed number. Pure functions, no DOM.
 *
 *   contrastRatio("#141414", "#f5f4ef") → 16.73
 *   aaVerdict(16.73) → { normal: true, large: true }
 *
 * A dev-only self-check at module load throws if ink-on-paper drifts from the
 * spec's 16.7 (±0.1), so a broken formula can never print a passing table.
 */

export type Hex = `#${string}`;

/** WCAG thresholds: AA normal text ≥ 4.5, AA large text (≥ 18pt / 14pt bold) ≥ 3.0. */
export const AA_NORMAL = 4.5;
export const AA_LARGE = 3.0;

/** Parse "#rgb" / "#rrggbb" into 0–255 channels. Throws on anything else. */
export function hexToRgb(hex: string): readonly [number, number, number] {
  const h = hex.trim().replace(/^#/, "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`contrast: invalid hex colour "${hex}"`);
  const n = parseInt(full, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff] as const;
}

/** sRGB 8-bit channel → linear light (WCAG 2.x definition). */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Relative luminance L in [0, 1]. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Contrast ratio (L1 + 0.05) / (L2 + 0.05), order-independent, in [1, 21]. */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Two decimals, as the sheet prints it ("16.73"). */
export function formatRatio(ratio: number): string {
  return ratio.toFixed(2);
}

export interface AAVerdict {
  /** ≥ 4.5 — body, cells, captions, meta. */
  normal: boolean;
  /** ≥ 3.0 — large text only (name, headline, stamps at display size). */
  large: boolean;
}

export function aaVerdict(ratio: number): AAVerdict {
  return { normal: ratio >= AA_NORMAL, large: ratio >= AA_LARGE };
}

/**
 * Dev self-check: ink `#141414` on paper `#f5f4ef` must be 16.7 ± 0.1 (§C.2).
 * Runs once at import, only outside production — a wrong formula fails loudly
 * instead of printing a confident, wrong AA table.
 */
if (process.env.NODE_ENV !== "production") {
  const probe = contrastRatio("#141414", "#f5f4ef");
  if (Math.abs(probe - 16.7) > 0.1) {
    throw new Error(`contrast: self-check failed — #141414 on #f5f4ef = ${probe.toFixed(3)}, expected 16.7 ± 0.1`);
  }
}
