// scripts/media/plates.mjs — shared encoder for the work plates in public/captures/.
//
// One 16:10 master (lossless, at least 1600x1000) becomes the two files every capture ships as:
//   <slug>-1600.webp (1600x1000) and <slug>-800.webp (800x500, a downscale of the same frame),
// each with EXIF IFD0 provenance (ImageDescription · Artist · Copyright · Software · DateTime),
// a <file>.webp.json sidecar written by `impeccable embed-prompt` (same JSON when the CLI is absent),
// and a block in public/captures/PROVENANCE.md.
//
// PROVENANCE.md is APPENDED, never rewritten: each slug owns one block between
//   <!-- media:<slug> -->  …  <!-- /media:<slug> -->
// A re-run replaces only that slug's own block; the September table above it is never touched.
//
// Size caps: the 1600w stays under 160,000 bytes (the S4 hand-over passes it as a data URL only
// below that, docs/redesign/rivista-next/20-cases-spec.md R2); the 800w under 200 KB.
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { homedir, tmpdir } from "node:os";

export const ROOT = resolve(import.meta.dirname, "../..");
export const OUT = resolve(ROOT, "public/captures");
export const PROVENANCE = resolve(OUT, "PROVENANCE.md");
export const SIZES = [
  { w: 1600, h: 1000, cap: 155 * 1024 }, // 158,720 B < 160,000 (S4 data-URL hand-over)
  { w: 800, h: 500, cap: 200 * 1024 },
];
/** Quality ladder from qStart down in steps of 2 to 50. The September captures start at 82; a plate whose
 *  art shows block artefacts at 82 (dark film gradients, small UI type) starts higher, still under the cap. */
export function ladder(qStart = 82) {
  const out = [];
  for (let q = qStart; q >= 50; q -= 2) out.push(q);
  return out;
}
const IMPECCABLE = join(homedir(), ".claude/skills/impeccable/scripts/impeccable");

/** EXIF ASCII is 7-bit: libexif prints "·" as "?" (see the September files). Keep EXIF readable. */
export function asciiExif(s) {
  return s
    .replaceAll("·", "-")
    .replaceAll("©", "(c)")
    .replaceAll("—", "-")
    .replaceAll("–", "-")
    .replaceAll("×", "x")
    .replaceAll("’", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replace(/[^\x20-\x7e]/g, "");
}

export function exifDate(d = new Date()) {
  return d.toISOString().slice(0, 19).replace("T", " ").replaceAll("-", ":");
}

/**
 * Encode a 16:10 master into the two plates, with EXIF and sidecars.
 * @param {object} o
 * @param {string} o.slug        file stem, e.g. "sphere-ai" -> sphere-ai-1600.webp
 * @param {Buffer} o.master      lossless 16:10 master (PNG/TIFF buffer), >= 1600x1000
 * @param {string} o.description provenance line (EXIF ImageDescription, ASCII-folded)
 * @param {string} o.copyright   EXIF Copyright
 * @param {string} o.software    EXIF Software (source tool chain); " + sharp <v>" is appended
 * @param {string} o.origin      sidecar prompt (the ORIGIN record, full sentence)
 * @param {boolean} [o.lossless] try WebP lossless first (line art), lossy ladder if over the cap
 * @param {number} [o.qStart]    first rung of the lossy ladder (default 82)
 * @param {string} [o.outDir]    default public/captures
 * @param {boolean} [o.square]   S2 fix: a 1:1 master for a square figure (the home's Now plate): 1600x1600 and 800x800,
 *                               the 1600 capped at 240 KB (it never rides the S4 data-URL hand-over, which is 16:10 only)
 */
export async function encodePlates(o) {
  const outDir = o.outDir ?? OUT;
  mkdirSync(outDir, { recursive: true });
  const meta = await sharp(o.master).metadata();
  const ratio = meta.width / meta.height;
  const want = o.square ? 1 : 1.6;
  if (Math.abs(ratio - want) > 0.004) throw new Error(`${o.slug}: master is ${meta.width}x${meta.height}, not ${o.square ? "1:1" : "16:10"}`);
  if (meta.width < 1600) throw new Error(`${o.slug}: master narrower than 1600 (${meta.width}) — would upscale`);
  const now = new Date();
  const exif = {
    ImageDescription: asciiExif(o.description),
    Artist: "Alberto Tuveri",
    Copyright: asciiExif(o.copyright),
    Software: asciiExif(`${o.software} + sharp ${sharp.versions.sharp}`),
    DateTime: exifDate(now),
  };
  const rows = [];
  const sizes = o.square ? [{ w: 1600, h: 1600, cap: 240 * 1024 }, { w: 800, h: 800, cap: 200 * 1024 }] : SIZES;
  for (const { w, h, cap } of sizes) {
    const resized = await sharp(o.master).resize(w, h, { fit: "fill", kernel: "lanczos3" }).png().toBuffer();
    let buf, quality;
    if (o.lossless) {
      buf = await sharp(resized).webp({ lossless: true, effort: 6 }).withExif({ IFD0: exif }).toBuffer();
      quality = "lossless";
    }
    if (!buf || buf.length > cap) {
      for (const q of ladder(o.qStart)) {
        quality = `q${q}`;
        buf = await sharp(resized)
          .webp({ quality: q, effort: 6, smartSubsample: true })
          .withExif({ IFD0: exif })
          .toBuffer();
        if (buf.length <= cap) break;
      }
    }
    if (buf.length > cap) throw new Error(`${o.slug}-${w}: ${buf.length} B over the ${cap} B cap at the bottom of the ladder`);
    const file = `${o.slug}-${w}.webp`;
    const path = resolve(outDir, file);
    writeFileSync(path, buf);
    writeSidecar(path, `${o.origin} Encoded to WebP ${quality} effort 6 with sharp ${sharp.versions.sharp} (${w}x${h}). Full record: public/captures/PROVENANCE.md`, now);
    const check = await sharp(buf).metadata();
    rows.push({ file, w, h, quality, bytes: buf.length, exifBytes: check.exif?.length ?? 0, description: o.description });
    console.log(`${file}: ${check.width}x${check.height} ${quality} ${(buf.length / 1024).toFixed(1)} KB (${buf.length} B) exif=${check.exif?.length ?? 0}B`);
  }
  return rows;
}

/** Sidecar via the impeccable CLI (the format the embed scan reads); identical JSON as a fallback. */
export function writeSidecar(rasterPath, prompt, when = new Date()) {
  const tmp = join(tmpdir(), `embed-${process.pid}-${Date.now()}.txt`);
  writeFileSync(tmp, prompt);
  try {
    if (!existsSync(IMPECCABLE)) throw new Error("no impeccable CLI");
    execFileSync("sh", [IMPECCABLE, "embed-prompt", rasterPath, "--prompt-file", tmp], { stdio: "pipe" });
  } catch {
    writeFileSync(`${rasterPath}.json`, JSON.stringify({ prompt, createdAt: when.toISOString() }, null, 2));
  }
}

/**
 * Append (or replace) this slug's own block in PROVENANCE.md. Text outside media blocks is never touched.
 * @param {string} slug
 * @param {string[]} lines markdown lines of the block body
 */
export function appendProvenance(slug, lines) {
  const open = `<!-- media:${slug} -->`;
  const close = `<!-- /media:${slug} -->`;
  const block = [open, ...lines, close].join("\n");
  let doc = readFileSync(PROVENANCE, "utf8");
  const a = doc.indexOf(open);
  const b = doc.indexOf(close);
  if (a >= 0 && b > a) {
    doc = doc.slice(0, a) + block + doc.slice(b + close.length);
  } else {
    doc = doc.replace(/\s*$/, "") + "\n\n" + block + "\n";
  }
  writeFileSync(PROVENANCE, doc);
}

/** Markdown rows for one plate set, shared shape for every block. */
export function plateTable(rows, extra = {}) {
  const lines = [
    "| File | Output | Qualità | Peso | EXIF |",
    "|---|---|---|---|---|",
    ...rows.map((r) => `| \`${r.file}\` | ${r.w}×${r.h} WebP | ${r.quality} | ${(r.bytes / 1024).toFixed(1)} KB (${r.bytes} B) | ${r.exifBytes} B IFD0 |`),
  ];
  if (extra.focal) lines.push("", `Punto focale (\`object-position\`): \`${extra.focal}\` — la x vale per il taglio 4:5 del caso sotto 1024 px, la y per un taglio 16:9 a copertura.`);
  lines.push("", `EXIF \`ImageDescription\` (ASCII): "${asciiExif(rows[0].description)}"`);
  return lines;
}
