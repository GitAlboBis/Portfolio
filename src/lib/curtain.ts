/**
 * Shared "sunset curtain" edge — a ykob / Codrops shape-overlay path (CLAUDE.md §6).
 *
 * A wavy horizontal edge that descends top→down and flattens as it lands, authored
 * in a 0..100 viewBox (render the <svg> with preserveAspectRatio="none" so it
 * stretches to any viewport). `v` in 0..1: 0 = empty (fully retracted → the content
 * beneath shows), 1 = fully covering. Pass different `seed`s to give each stacked
 * layer (sunset lead + night) its own wave phase.
 *
 * Used by BOTH the mobile menu (open gesture) and the route transition (enter
 * reveal) so the nav and the page share one "tramonto → notte" language.
 */

export const CURTAIN_POINTS = 6; // edge control points
export const CURTAIN_AMP = 7; // wave amplitude (viewBox units)

export function curtainPath(v: number, seed: number): string {
  if (v <= 0.002) return "M0 0H0Z"; // empty when retracted
  const baseY = v * (100 + CURTAIN_AMP * 2) - CURTAIN_AMP; // edge descends; off-screen at v=1
  const ys: number[] = [];
  for (let i = 0; i <= CURTAIN_POINTS; i++) {
    ys.push(baseY + Math.sin(i * 0.9 + seed) * CURTAIN_AMP * (1 - v * 0.65));
  }
  let d = `M 0 0 H 100 V ${ys[CURTAIN_POINTS].toFixed(2)} `;
  for (let i = CURTAIN_POINTS - 1; i >= 0; i--) {
    const x = (i / CURTAIN_POINTS) * 100;
    const px = ((i + 1) / CURTAIN_POINTS) * 100;
    const cx = ((x + px) / 2).toFixed(2);
    d += `C ${cx} ${ys[i + 1].toFixed(2)} ${cx} ${ys[i].toFixed(2)} ${x.toFixed(2)} ${ys[i].toFixed(2)} `;
  }
  return d + "L 0 0 Z";
}
