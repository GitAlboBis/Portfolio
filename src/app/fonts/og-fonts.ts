import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Archivo for `next/og` (REDESIGN-SPEC §G).
 *
 * Satori (inside next/og) cannot read a VARIABLE font's axes, and it cannot read
 * woff2 at all — so the width axis of the sheet is vendored here as three static
 * TTF instances cut from the upstream variable font:
 *
 *   archivo-wide-800.ttf  wdth 125 / wght 800  → `.f-name`, `.f-headline`
 *   archivo-cond-700.ttf  wdth  75 / wght 700  → `.f-caption`, `.f-stamp`, labels
 *   archivo-400.ttf       wdth 100 / wght 400  → `.f-body`, `.f-cell`, values
 *
 * Provenance: Archivo (Omnibus-Type, SIL OFL 1.1), google/fonts `ofl/archivo/
 * Archivo[wdth,wght].ttf`, instanced + subset to the Latin glyphs this site
 * prints with fontTools 4.63 (Sep 2026). See ./README.md.
 *
 * The files are read once per server process. If they cannot be read (a deploy
 * that did not trace them, for instance), the OG route still renders — with
 * next/og's built-in face — instead of failing the whole image.
 */
export interface OgFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700 | 800;
  style: "normal";
}

const FILES: { name: string; file: string; weight: 400 | 700 | 800 }[] = [
  { name: "ArchivoWide", file: "archivo-wide-800.ttf", weight: 800 },
  { name: "ArchivoCond", file: "archivo-cond-700.ttf", weight: 700 },
  { name: "Archivo", file: "archivo-400.ttf", weight: 400 },
];

let cache: Promise<OgFont[]> | null = null;

async function load(): Promise<OgFont[]> {
  const dir = join(process.cwd(), "src", "app", "fonts");
  const out: OgFont[] = [];
  for (const f of FILES) {
    try {
      const buf = await readFile(join(dir, f.file));
      out.push({
        name: f.name,
        // A Buffer's underlying pool is shared; slice out this font's own bytes.
        data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
        weight: f.weight,
        style: "normal",
      });
    } catch {
      /* missing font → fall back to the built-in face for that role */
    }
  }
  return out;
}

export function ogFonts(): Promise<OgFont[]> {
  cache ??= load();
  return cache;
}

/** Font-family stacks for the three roles (fall back to the built-in face). */
export const OG_FAMILY = {
  wide: "ArchivoWide, Archivo, sans-serif",
  cond: "ArchivoCond, Archivo, sans-serif",
  body: "Archivo, sans-serif",
} as const;

/** The sheet's palette as literals — next/og cannot read CSS variables (§C.1). */
export const OG_COLOR = {
  paper: "#f5f4ef",
  paperField: "#ebe9e1",
  paperCarbon: "#dcd9cf",
  ink: "#141414",
  graphite: "#5a5a57",
  stamp: "#b40f29",
  safety: "#ffc400",
} as const;
