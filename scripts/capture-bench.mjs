// scripts/capture-bench.mjs — WP-7b: lo STILL del banco prova, catturato dal MOTORE REALE
// (REDESIGN-SPEC §E.5 "Asset", §F.6, §J riga WP-7).
//
//   node scripts/capture-bench.mjs [--base=http://localhost:3000]
//     -> public/bench/tank-still-1520.webp
//        public/bench/tank-still-700.webp
//        public/bench/PROVENANCE.md
//
// Metodo: Playwright su Chrome (channel "chrome", --enable-unsafe-webgpu) sul DEV SERVER,
// sulla HOME "/" (il banco vive nella copertina del foglio; la rotta gate /dev/bench è
// stata eliminata in WP-9), viewport 1440×1200 con deviceScaleFactor 2,05 (così il ritaglio del
// riquadro esce a ~1554px e viene RIDOTTO a 1520 — mai ingrandito). Si attende lo stato
// `live` dallo store del banco (`window.__heroStore`, dev-only) e poi si lascia SEDIMENTARE
// il fluido per SETTLE_MS senza toccarlo: la lettera a riposo è la lettura migliore.
// Il ritaglio è il riquadro `.bench-box` MENO il suo bordo 1px: lo still viene poi disegnato
// DENTRO la cornice (`absolute inset-0`), quindi la cornice non deve essere nel raster,
// o si stamperebbe due volte.
// Provenienza: EXIF IFD0 (ImageDescription / Artist / Software / DateTime) scritto da sharp,
// più il sidecar PROVENANCE.md con conteggio particelle e frame time LETTI AI READOUT
// nell'istante dello scatto (niente numeri inventati).
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const argv = process.argv.slice(2);
const baseArg = argv.find((a) => a.startsWith("--base="));
const BASE = baseArg ? baseArg.slice("--base=".length) : process.env.BASE_URL || "http://localhost:3000";
const ROUTE = "/";

const ROOT = process.cwd();
const OUT = resolve(ROOT, "public/bench");
const RAW = resolve(ROOT, ".shots/wp7b");
await mkdir(OUT, { recursive: true });
await mkdir(RAW, { recursive: true });

const NOW = new Date();
const MONTH = NOW.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }); // "Sep 2026"
const EXIF_DATE = NOW.toISOString().slice(0, 19).replace("T", " ").replaceAll("-", ":");

const VIEWPORT = { width: 1440, height: 1200 };
const DSF = 2.05; // ritaglio ~1554px → downscale a 1520 (mai upscale)
const SIZES = [1520, 700];
const MAX_BYTES = 200 * 1024;
const QUALITY_LADDER = [82, 78, 74, 70, 66, 62, 58, 54, 50];
const LIVE_TIMEOUT_MS = 45_000;
const SETTLE_MS = Number(process.env.BENCH_SETTLE_MS || 8000);

const DESCRIPTION =
  "Captured frame of the WebGPU fluid test bench · Sep 2026 · Chrome WebGPU · MLS-MPM · portfolio of Alberto Tuveri";

async function encode(pngBuffer, width, exif) {
  let quality = QUALITY_LADDER[0];
  let buf;
  for (const q of QUALITY_LADDER) {
    quality = q;
    buf = await sharp(pngBuffer)
      .resize({ width, kernel: "lanczos3" })
      .webp({ quality: q, effort: 6, smartSubsample: true })
      .withExif({ IFD0: exif })
      .toBuffer();
    if (buf.length <= MAX_BYTES) break;
  }
  const meta = await sharp(buf).metadata();
  return { buf, quality, width: meta.width, height: meta.height, exifBytes: meta.exif?.length ?? 0 };
}

let browser;
let launch = "chrome channel + --enable-unsafe-webgpu";
try {
  browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan", "--ignore-gpu-blocklist"],
  });
} catch {
  launch = "bundled chromium (chrome channel unavailable)";
  browser = await chromium.launch({ headless: true, args: ["--enable-unsafe-webgpu"] });
}
const CHROME_VERSION = browser.version();

const ctx = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: DSF,
  locale: "en-US",
  colorScheme: "light",
  reducedMotion: "no-preference",
});
await ctx.addInitScript(() => {
  try {
    sessionStorage.setItem("at-preloader-seen", "1");
  } catch {}
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message.split("\n")[0].slice(0, 200)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text().slice(0, 200));
});

const url = new URL(ROUTE, BASE).toString();
await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
await page.evaluate(() => document.fonts?.ready).catch(() => {});

// il motore è vivo quando lo store dice "live" (primo frame completato sulla GPU)
const status = await page
  .waitForFunction(
    () => {
      const s = window.__heroStore?.getState?.();
      return s && (s.status === "live" || s.status === "still" || s.status === "lost") ? s.status : null;
    },
    undefined,
    { timeout: LIVE_TIMEOUT_MS, polling: 250 },
  )
  .then((h) => h.jsonValue())
  .catch(() => "timeout");

if (status !== "live") {
  console.error(
    `bench status = "${status}" — il banco non è vivo su questa macchina: nessuna cattura scritta.` +
      (errors.length ? `\nconsole/page errors:\n  ${errors.join("\n  ")}` : ""),
  );
  await browser.close();
  process.exit(1);
}

// SEDIMENTAZIONE: nessun poke del puntatore, nessuno scroll — la lettera a riposo.
await page.waitForTimeout(SETTLE_MS);

// letture dello strumento NELL'ISTANTE dello scatto (per il sidecar)
const readouts = await page.evaluate(() => {
  const s = window.__heroStore.getState();
  return { particles: s.particles, frameMs: s.frameMs, dpr: s.dpr, tier: s.tier, status: s.status };
});

// ritaglio = riquadro MENO il bordo 1px (lo still va dentro la cornice, non sopra)
const box = page.locator(".bench-box").first();
await box.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
const rect = await box.boundingBox();
if (!rect) throw new Error(".bench-box non trovato");
const clip = { x: rect.x + 1, y: rect.y + 1, width: rect.width - 2, height: rect.height - 2 };
const png = await page.screenshot({ type: "png", clip, animations: "allow" });
await writeFile(resolve(RAW, "bench-raw.png"), png);
const rawMeta = await sharp(png).metadata();

const exif = {
  ImageDescription: DESCRIPTION,
  Artist: "Alberto Tuveri",
  Software: "Playwright Chrome + sharp",
  DateTime: EXIF_DATE,
};

const report = [];
for (const w of SIZES) {
  const enc = await encode(png, w, exif);
  const file = `tank-still-${w}.webp`;
  await writeFile(resolve(OUT, file), enc.buf);
  report.push({ file, ...enc, bytes: enc.buf.length });
  console.log(
    `${file}: ${enc.width}x${enc.height} q${enc.quality} ${(enc.buf.length / 1024).toFixed(1)} KB exif=${enc.exifBytes}B`,
  );
}

console.log(
  `readouts at capture: particles=${readouts.particles} frameMs=${readouts.frameMs.toFixed(2)} dpr=${readouts.dpr} tier=${readouts.tier}`,
);
console.log(`clip ${clip.width}×${clip.height} CSS px @ DPR ${DSF} → raw ${rawMeta.width}×${rawMeta.height}`);
console.log(`console/page errors: ${errors.length}`);

await ctx.close();
await browser.close();

// ---- Sidecar PROVENANCE.md --------------------------------------------------
const date = NOW.toISOString().slice(0, 10);
const lines = [
  "# Bench still — provenance",
  "",
  "Lo still di fallback del banco prova (REDESIGN-SPEC §E.5, §F.6): **un frame catturato dal motore",
  "reale** — MLS-MPM su WebGPU, shading WP-3b (rampa di profondità, mano bagnata, bordo traslucido,",
  "schiuma panna, cubemap officina) — non un rendering d'artista. Viene stampato dentro lo stesso",
  "riquadro quando il renderer non c'è (no WebGPU / reduced motion / `device.lost`), con la parola",
  "`STILL` e la riga di motivo sopra. La stessa origine è scritta nell'EXIF IFD0 di ogni file",
  "(ImageDescription · Artist · Software · DateTime), leggibile con",
  "`node -e \"require('sharp')('public/bench/<file>').metadata().then(m=>console.log(m.exif.toString('latin1')))\"`.",
  "",
  `- Data: ${date}`,
  `- Sorgente: \`${BASE}${ROUTE}\` (dev server locale) — il banco vivo, stato \`${readouts.status}\`.`,
  `- Strumento: Playwright ${launch} (${CHROME_VERSION}) + sharp.`,
  `- Viewport: ${VIEWPORT.width}×${VIEWPORT.height} CSS px @ deviceScaleFactor ${DSF} (il ritaglio esce a ${rawMeta.width}px e viene RIDOTTO a 1520 — mai ingrandito).`,
  `- Ritaglio: elemento \`.bench-box\` MENO il bordo 1px → ${clip.width}×${clip.height} CSS px. La cornice non è nel raster: lo still si stampa dentro la cornice viva (\`absolute inset-0\`), quindi stamparla sarebbe una doppia riga.`,
  `- Sedimentazione: ${SETTLE_MS} ms di calma dopo lo stato \`live\`, nessun poke del puntatore, nessuno scroll — la lettera a riposo.`,
  `- Letture dello strumento nell'istante dello scatto: Particles ${readouts.particles.toLocaleString("en-US")} · Frame ${readouts.frameMs.toFixed(1)} ms · DPR ${readouts.dpr} (backing della canvas, cap del tier) · Tier ${readouts.tier}.`,
  "- Encoder: sharp → WebP, qualità di partenza 82, effort 6, cap 200 KB per file (scala a gradini se sfora).",
  "- Comando esatto: `node scripts/capture-bench.mjs` (da `C:\\Users\\alber\\Portfolio`, con `npm run dev` attivo).",
  "",
  "| File | Sorgente | Stato motore | Viewport | Output | Qualità | Peso |",
  "|---|---|---|---|---|---|---|",
  ...report.map(
    (r) =>
      `| \`${r.file}\` | ${ROUTE} | ${readouts.status} | ${VIEWPORT.width}×${VIEWPORT.height} @${DSF}x | ${r.width}×${r.height} WebP | q${r.quality} | ${(r.bytes / 1024).toFixed(1)} KB |`,
  ),
  "",
  "EXIF `ImageDescription` per file:",
  "",
  ...report.map((r) => `- \`${r.file}\`: "${DESCRIPTION}"`),
  "",
];
await writeFile(resolve(OUT, "PROVENANCE.md"), lines.join("\n"));

for (const r of report) {
  const { size } = await stat(resolve(OUT, r.file));
  if (size > MAX_BYTES) console.warn(`WARN ${r.file} exceeds 200 KB (${size})`);
  if (!r.exifBytes) console.warn(`WARN ${r.file} has no EXIF`);
}
console.log("done -> " + OUT);
