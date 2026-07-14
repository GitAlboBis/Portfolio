/*
  wave.ts — the living-waterline geometry, shared by LA RISALITA's descending
  surface sheet (AscentSurface) and the footer's closing tide (TideEbb).

  A seamless wave path authored for a 200%-wide drifting track (.asc-wave-track
  in globals.css): two identical periods across the width, so translating the
  track by -50% loops without a seam. Pure string math — deterministic, safe
  to call at module scope (SSR === client).
*/

export const WAVE_W = 2880;

function segments(amp: number, yBase: number, halfPeriods: number, flip: boolean, width: number) {
  const step = width / halfPeriods;
  let d = "";
  for (let i = 0; i < halfPeriods; i++) {
    const x1 = ((i + 1) * step).toFixed(1);
    const up = (i % 2 === 0) !== flip;
    const cy = (yBase + (up ? -amp : amp)).toFixed(1);
    d += ` Q${((i + 0.5) * step).toFixed(1)} ${cy} ${x1} ${yBase}`;
  }
  return d;
}

/** The open crest line (`M0 yBase Q…`) — stroke it for foam/moonlight. */
export function waveCrest(amp: number, yBase: number, halfPeriods: number, flip = false, width = WAVE_W): string {
  return `M0 ${yBase}${segments(amp, yBase, halfPeriods, flip, width)}`;
}

/** Closed wave fill. `fill:"up"` fills ABOVE the crest (the paper sheet of LA
    RISALITA); `fill:"down"` fills BELOW it (a body of water, needs `height`). */
export function wavePath(
  amp: number,
  yBase: number,
  halfPeriods: number,
  flip = false,
  opts: { fill?: "up" | "down"; height?: number; width?: number } = {},
): string {
  const { fill = "up", height = 44, width = WAVE_W } = opts;
  const seg = segments(amp, yBase, halfPeriods, flip, width);
  return fill === "up"
    ? `M0 0 L0 ${yBase}${seg} L${width} 0 Z`
    : `M0 ${height} L0 ${yBase}${seg} L${width} ${height} Z`;
}
