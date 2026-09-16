/**
 * tokens.ts — the JS/WebGL mirror of the `@theme` palette in src/app/globals.css.
 * THE JOB ORDER (redesign 2026-09, REDESIGN-SPEC.md §C.1): workshop paper, ink,
 * graphite for provenance, safety yellow as whole REGIONS, stamp red for stamps
 * and links, `oil` as the fluid's diffuse reference. Change CSS and this file
 * together — nothing else defines a colour.
 */

/** The ten colours of the sheet (§C.1). */
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

/**
 * DEPRECATED Golden Hour keys — still read by src/content/works.ts (`mood`, until
 * WP-1/WP-5 restructure it) and src/components/atmosphere/MurmurationCanvas.tsx
 * (WP-9 deletes). Every alias resolves to a JOB-ORDER tone so nothing sunset can
 * leak into a render. WP-9 removes this object and the spread below.
 */
const legacy = {
  /** @deprecated → paperField */ paperDeep: sheet.paperField,
  /** @deprecated → graphite */ inkMute: sheet.graphite,
  /** @deprecated → paperCarbon */ amber: sheet.paperCarbon,
  /** @deprecated → paperCarbon */ coral: sheet.paperCarbon,
  /** @deprecated → stamp */ ember: sheet.stamp,
  /** @deprecated → stampDeep */ emberInk: sheet.stampDeep,
  /** @deprecated → stamp */ rose: sheet.stamp,
  /** @deprecated → graphiteDeep */ dusk: sheet.graphiteDeep,
  /** @deprecated → ink */ night: sheet.ink,
} as const;

export const palette = { ...sheet, ...legacy } as const;

/** Token names of the sheet — the legacy keys are deliberately NOT part of this type. */
export type PaletteToken = keyof typeof sheet;

/**
 * `oil` as linear RGB for the fluid's `diffuseColor` in
 * src/webgl/waterball/render/fluid.wgsl.ts (WP-3). Same number as REDESIGN-SPEC §F.1.
 */
export const oilLinear: readonly [number, number, number] = [0.79, 0.54, 0.16];

/** @deprecated per-project atmosphere of the removed depth gallery — WP-9 deletes. */
export interface Mood {
  base: string;
  blob1: string;
  blob2: string;
}

/** @deprecated see `Mood`. Paper tones only, so nothing sunset can leak. */
export const defaultMood: Mood = {
  base: sheet.paper,
  blob1: sheet.paperField,
  blob2: sheet.paperCarbon,
};
