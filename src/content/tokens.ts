/**
 * tokens.ts — the JS/WebGL mirror of the `@theme` palette in src/app/globals.css.
 * THE JOB ORDER (redesign 2026-09, REDESIGN-SPEC.md §C.1): workshop paper, ink,
 * graphite for provenance, safety yellow as whole REGIONS, stamp red for stamps
 * and links, `oil` as the fluid's diffuse reference. Change CSS and this file
 * together — nothing else defines a colour.
 */

/** The eleven colours of the sheet (§C.1). */
const sheet = {
  // ── Paper (three sheets) ──────────────────────────────────────────────────
  paper: "#f5f4ef", // ground of the whole site (top sheet)
  paperField: "#ebe9e1", // field fill, alternate rows, bench backdrop
  paperCarbon: "#dcd9cf", // /work/[slug] sub-form ground (carbon copy)

  // ── Ink & graphite ────────────────────────────────────────────────────────
  ink: "#141414", // primary text, every 1px rule, text on yellow
  graphite: "#5a5a57", // meta on paper/fields: provenance, captions, units
  graphiteDeep: "#4a4a47", // meta on carbon copy

  // ── Stamp red ─────────────────────────────────────────────────────────────
  stamp: "#b40f29", // stamps on paper, links, arrows
  stampDeep: "#8a0a1f", // stamp lettering ON the yellow band (6.13:1)

  // ── Safety yellow — regions only, never a stripe ──────────────────────────
  safety: "#ffc400", // phase band, readouts column, Release panel, focus ring

  // ── Fluid reference (WGSL constant, never text) ───────────────────────────
  oil: "#c98a2a",
} as const;

export const palette = sheet;

/** Token names of the sheet. */
export type PaletteToken = keyof typeof sheet;

/**
 * `oil` as linear RGB for the fluid's `diffuseColor` in
 * src/webgl/waterball/render/fluid.wgsl.ts (WP-3). Same number as REDESIGN-SPEC §F.1.
 */
export const oilLinear: readonly [number, number, number] = [0.79, 0.54, 0.16];

