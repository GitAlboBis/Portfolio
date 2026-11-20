// scripts/media/stills.mjs — plates cut from real raster media already on this machine
// (docs/redesign/rivista-next/11-media-scout.md §1 and §4). Sources are only READ.
//
//   node scripts/media/stills.mjs                 -> every plate below
//   node scripts/media/stills.mjs sphere-ai       -> one plate (names: sphere-ai, sersan-brand, sersan-brand-end)
//   node scripts/media/stills.mjs --no-log        -> plates + sidecars, PROVENANCE.md untouched (dry runs)
//
// Each crop is a 16:10 rectangle of the source in source pixels, chosen by measuring the frame
// (border lines, edges), then resized with lanczos3. Never upscaled: every crop is >= 1600 wide.
import sharp from "sharp";
import { existsSync } from "node:fs";
import { encodePlates, appendProvenance, plateTable } from "./plates.mjs";

const PLATES = [
  {
    slug: "sphere-ai",
    // S2 (2026-10-09, cases lane): the September frame opened with "I didn't find specific Spherenode material", which
    // contradicted the case's lead; this is the FIRST capture run of the same session (screens-pass1, 09:57 UTC), where
    // the mentor answers from the transcripts with numbered citations and lists its sources.
    src: "C:/Users/alber/spherenode-promo/public/screens-pass1/mentor-chat-en.png",
    // 3840x2160 (1920x1080 @2x). Measured: header rule y=160 (staff e-mail above it), sidebar divider x=686
    // (conversation list left of it), answer card x 817-3763, its text from x 850. S2 fix (desktop review S7, phone 7): the
    // whole conversation, not a detail: the left edge in the gutter after the divider, the right edge past the answer
    // card (every line whole, none cut mid-word), from under the header rule down to the input box: the question, the
    // answer with its citations, its sources and suggested lessons, the disclaimer. No account data inside. The case
    // shows it as a contained 16:10 frame, whole (cases.json fig.contain).
    extract: { left: 690, top: 170, width: 3150, height: 1969 },
    // Redacted, flat bars in the UI's own mid tone: an instructor's first name inside the answer, and every course,
    // lesson and live-session title on the source cards (paywalled content). Nothing else is touched.
    redact: [
      { left: 926, top: 563, width: 206, height: 38 },   // the name in "In the ... framework"
      { left: 899, top: 1050, width: 469, height: 35 },  // source [1] title
      { left: 2383, top: 1050, width: 372, height: 35 }, // source [2] title (runs off the crop)
      { left: 905, top: 1184, width: 318, height: 35 },  // source [4] title
      { left: 900, top: 1352, width: 460, height: 35 },  // suggested lesson [3] title
      { left: 900, top: 1460, width: 922, height: 35 },  // suggested live session [5] title (S2 fix: now inside the crop)
      { left: 900, top: 1570, width: 894, height: 35 },  // suggested live session [6] title (S2 fix: now inside the crop)
    ],
    /* S2 fix: a step quieter than the September bars (58,63,58), still a flat bar on the source cards (32,35,32) */
    redactColour: { r: 48, g: 52, b: 48 },
    description:
      "Capture of spherenode.com/mentor (signed-in SerSan staff session) · 3 Sep 2026 · Playwright Chromium 1920x1080 @2x · cropped 16:10 to the whole conversation · an instructor's name and the course and session titles redacted · portfolio of Alberto Tuveri",
    copyright: "© SphereNode — spherenode.com · Sphere AI built by SerSan",
    software: "Playwright Chromium (spherenode-promo scripts/capture.mjs, commit 60169ac)",
    origin:
      "ORIGIN (pre-existing raster, not generated): browser capture of the live Sphere AI mentor page https://www.spherenode.com/mentor, taken 2026-09-03 (first run, 09:57 UTC) by spherenode-promo/scripts/capture.mjs (commit 60169ac, GitAlboBis) in a signed-in SerSan staff session at 1920x1080 @ DPR 2 (source file public/screens-pass1/mentor-chat-en.png of SerSan's spherenode-promo repo, 3840x2160). Cropped 16:10 at source pixels left 690, top 170, 3150x1969 (the account header, the staff e-mail and the conversation list are outside the crop). Seven flat bars redact an instructor's name and the titles of the cited and suggested lessons and live sessions; nothing else is altered. Product owned by SphereNode, Sphere AI built by SerSan; used as evidence of work performed.",
    qStart: 90,
    note: "Sorgente (S2, 2026-10-09): `public/screens-pass1/mentor-chat-en.png` del repo `spherenode-promo` di SerSan (3840×2160, prima passata di `scripts/capture.mjs` del 2026-09-03, 09:57 UTC, sessione staff SerSan autenticata): il mentor risponde dalle trascrizioni con citazioni numerate ed elenca le fonti (la passata delle 10:12, usata a settembre, apriva con «I didn't find specific Spherenode material» e contraddiceva il caso). Taglio 16:10 dell'intera conversazione (fix S2, recensioni desktop S7 e telefono 7) `extract({ left: 690, top: 170, width: 3150, height: 1969 })`: il bordo sinistro cade nella gola dopo il divisore della barra laterale (x 686), il destro oltre la scheda della risposta (nessuna riga tagliata), dall'header fino al campo di domanda. **Redazioni**: sette barre piatte RGB(48,52,48) coprono il nome di un docente nel testo e i titoli di lezioni e sessioni live citate e suggerite (contenuto a pagamento); nient'altro è toccato. Nessun dato d'account nel fotogramma.",
  },
  {
    slug: "sersan-brand",
    src: "C:/Users/alber/Documents/SERSAN-AE/renders/tiff8_v2/00900.tif",
    // 3840x2160 RGBA, frame 900 = 00:30.03 at 29.97 fps. S2 (2026-10-09, cases lane, verifier defect 5): a 16:10 crop
    // centred on the glass card, from y 60 to 1840, so the film's own title "Selected work" (rows 1858-1966, measured)
    // is left out: the case hero's parallax over-scale cut it at the frame's foot in every pose but one. The card's
    // edges (x 570 / 3270) sit inside the crop, where the case's over-scale hides them; the tile shows them.
    extract: { left: 496, top: 60, width: 2848, height: 1780 },
    description:
      "Frame 900 (00:30.03) of the SerSan brand film · 4K lossless master frame (aerender TIFF, 8 Sep 2026) · cropped 16:10 to the centre card · directed and produced by Alberto Tuveri · portfolio of Alberto Tuveri",
    copyright: "© SerSan — sersan.io",
    software: "Adobe After Effects 2026 aerender (TIFF 8-bit master frame)",
    origin:
      "ORIGIN (pre-existing raster, not generated): frame 900 (00:30.03 at 29.97 fps) of the SerSan brand film, read from the lossless 3840x2160 TIFF master frame renders/tiff8_v2/00900.tif of the film's After Effects project folder (SERSAN-AE), rendered by After Effects aerender on 2026-09-08 (54.121 s cut, 1622 frames). 16:10 crop centred on the carousel's centre card, left 496, top 60, 2848x1780 (the film's Selected work title below the card left out), alpha flattened. Film directed and produced by Alberto Tuveri for SerSan; used as evidence of work performed.",
    focal: "50% 50%",
    flatten: true,
    qStart: 92, // the navy gradients block at 82 (checked at 4x contrast); 92 is ~104 KB
    note: "Sorgente: `renders/tiff8_v2/00900.tif` della cartella di progetto After Effects del film (`SERSAN-AE`) (TIFF 8 bit RGBA 3840×2160, aerender 2026-09-08, taglio da 54,121 s / 1622 fotogrammi; fotogramma 900 = 00:30.03). S2 (2026-10-09, lane casi, difetto 5 del verificatore): taglio 16:10 centrato sulla scheda di vetro centrale `extract({ left: 496, top: 60, width: 2848, height: 1780 })`, alfa appiattito: il titolo del film «Selected work» (righe 1858–1966, misurate) resta fuori, perché l'over-scale della parallasse dell'hero del caso lo tagliava al piede del riquadro in quasi ogni posa. Il taglio di settembre-ottobre era centrato a piena altezza (`left: 192, top: 0, 3456×2160`). Mai i fotogrammi 1080–1260 (loghi di terzi).",
  },
  {
    slug: "sersan-brand-end",
    src: "C:/Users/alber/Documents/SERSAN-AE/renders/tiff8_v2/01560.tif",
    extract: { left: 192, top: 0, width: 3456, height: 2160 },
    description:
      "Frame 1560 (00:52.05) of the SerSan brand film, identity end card · 4K lossless master frame (aerender TIFF, 8 Sep 2026) · cropped 16:10 · directed and produced by Alberto Tuveri · portfolio of Alberto Tuveri",
    copyright: "© SerSan — sersan.io",
    software: "Adobe After Effects 2026 aerender (TIFF 8-bit master frame)",
    origin:
      "ORIGIN (pre-existing raster, not generated): frame 1560 (00:52.05 at 29.97 fps), the identity end card of the SerSan brand film, read from the lossless 3840x2160 TIFF master frame renders/tiff8_v2/01560.tif of the film's After Effects project folder (SERSAN-AE), rendered by After Effects aerender on 2026-09-08 (54.121 s cut, 1622 frames). Centred 16:10 crop of the full height (left 192, 3456x2160), alpha flattened. Film directed and produced by Alberto Tuveri for SerSan; used as evidence of work performed.",
    focal: "50% 75%", // a 16:9 cover crop keeps the mark and "sersan.io" (content spans y 195..955 of 1000)
    flatten: true,
    qStart: 92,
    note: "Sorgente: `renders/tiff8_v2/01560.tif` della stessa cartella (fotogramma 1560 = 00:52.05, cartello d'identità finale). Stesso taglio 16:10 centrato del fotogramma 900.",
  },
];

const args = process.argv.slice(2);
const noLog = args.includes("--no-log");
const names = args.filter((a) => !a.startsWith("--"));
const todo = names.length ? PLATES.filter((p) => names.includes(p.slug)) : PLATES;
if (names.length && todo.length !== names.length) throw new Error(`unknown plate in: ${names.join(", ")}`);

for (const p of todo) {
  if (!existsSync(p.src)) throw new Error(`${p.slug}: source missing: ${p.src}`);
  let img = sharp(p.src);
  if (p.redact) {
    // flat bars in source pixels, composited before the crop; the colour is the plate's own mid tone, never a blur
    const c = p.redactColour;
    const bars = await Promise.all(p.redact.map(async (r) => ({ input: await sharp({ create: { width: r.width, height: r.height, channels: 3, background: c } }).png().toBuffer(), left: r.left, top: r.top })));
    img = sharp(await img.composite(bars).png({ compressionLevel: 1 }).toBuffer());
  }
  img = img.extract(p.extract);
  if (p.flatten) img = img.flatten({ background: "#000000" });
  const master = await img.png({ compressionLevel: 1 }).toBuffer();
  const rows = await encodePlates({ slug: p.slug, master, description: p.description, copyright: p.copyright, software: p.software, origin: p.origin, qStart: p.qStart });
  if (!noLog) {
    appendProvenance(p.slug, [
      `### \`${p.slug}-*\` — aggiunto 2026-10-09 (lane media, \`node scripts/media/stills.mjs ${p.slug}\`)`,
      "",
      p.note,
      "",
      ...plateTable(rows, { focal: p.focal }),
    ]);
  }
}
