// scripts/capture-sites.mjs — WP-7a: catture REALI dei due siti pubblici citati nel CV
// (sersan.io, spherenode.com) come asset della tabella `work-performed` (REDESIGN-SPEC §E.8).
//
//   node scripts/capture-sites.mjs            -> public/captures/{sersan-io,spherenode}-{1600,800}.webp
//                                               + public/captures/PROVENANCE.md
//
// Regole: Playwright su Chrome (--enable-unsafe-webgpu, così sersan.io renderizza il wordmark a
// particelle), viewport 1600×1000 DPR 1, `waitUntil: "networkidle"` + settle, cookie banner
// DECLINATI (mai accettati), composizione hero (top di pagina). Il taglio 800×500 è un
// downscale della STESSA cattura 1600 (stessa composizione → srcset coerente con la cella
// 160×100 e la lente). WebP q≈82 con cap 200 KB: se sfora, la qualità scende a gradini.
// Provenienza incorporata: EXIF IFD0 (ImageDescription / Artist / Copyright / Software /
// DateTime) scritto da sharp, più il sidecar PROVENANCE.md.
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = process.cwd();
const OUT = resolve(ROOT, "public/captures");
const RAW = resolve(ROOT, ".shots/wp7a");
await mkdir(OUT, { recursive: true });
await mkdir(RAW, { recursive: true });

const NOW = new Date();
const MONTH = NOW.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }); // "Sep 2026"
const EXIF_DATE = NOW.toISOString().slice(0, 19).replace("T", " ").replaceAll("-", ":"); // EXIF "YYYY:MM:DD HH:MM:SS"
const VIEWPORT = { width: 1600, height: 1000 };
const SIZES = [1600, 800];
const MAX_BYTES = 200 * 1024;
const QUALITY_LADDER = [82, 78, 74, 70, 66, 62, 58, 54, 50];
const CHROME_VERSION = { value: "" };

const SITES = [
  {
    name: "sersan-io",
    url: "https://sersan.io",
    copyright: "© SerSan — sersan.io",
    settle: 9500, // intro a particelle del wordmark
  },
  {
    name: "spherenode",
    url: "https://spherenode.com",
    copyright: "© SphereNode — spherenode.com",
    settle: 6000,
  },
];

// Testi dei pulsanti di RIFIUTO dei cookie (EN/IT). Mai "Accept".
const DECLINE_TEXTS = [
  "Decline", "Reject all", "Reject", "Refuse", "Deny", "Only necessary", "Necessary only",
  "Essential only", "Rifiuta tutto", "Rifiuta", "Solo necessari", "Solo essenziali", "Continua senza accettare",
];

async function declineCookies(page) {
  for (const text of DECLINE_TEXTS) {
    const btn = page.getByRole("button", { name: text, exact: false }).first();
    try {
      if (await btn.count()) {
        await btn.click({ timeout: 1500 });
        return `declined via "${text}"`;
      }
    } catch {}
  }
  const anyBanner = await page
    .locator('[id*="cookie" i], [class*="cookie" i], [aria-label*="cookie" i]')
    .filter({ visible: true })
    .count()
    .catch(() => 0);
  return anyBanner ? `banner present, no decline control found (${anyBanner})` : "no banner";
}

async function encode(pngBuffer, width, height, exif) {
  let quality = QUALITY_LADDER[0];
  let buf;
  for (const q of QUALITY_LADDER) {
    quality = q;
    buf = await sharp(pngBuffer)
      .resize(width, height, { fit: "cover", position: "top" })
      .webp({ quality: q, effort: 6, smartSubsample: true })
      .withExif({ IFD0: exif })
      .toBuffer();
    if (buf.length <= MAX_BYTES) break;
  }
  return { buf, quality };
}

let browser;
let launch = "chrome channel + --enable-unsafe-webgpu";
try {
  browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--enable-unsafe-webgpu"] });
} catch {
  launch = "bundled chromium (chrome channel unavailable)";
  browser = await chromium.launch({ headless: true });
}
CHROME_VERSION.value = browser.version();

const report = [];
for (const site of SITES) {
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, locale: "en-US" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
  let nav = "ok";
  try {
    await page.goto(site.url, { waitUntil: "networkidle", timeout: 90_000 });
  } catch (e) {
    nav = e.message.split("\n")[0];
    await page.waitForLoadState("load").catch(() => {});
  }
  await page.waitForTimeout(site.settle);
  const cookies = await declineCookies(page);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(1500);
  const png = await page.screenshot({ type: "png" });
  await writeFile(resolve(RAW, `${site.name}-raw.png`), png);
  const title = await page.title();

  const command = "node scripts/capture-sites.mjs";
  for (const w of SIZES) {
    const h = Math.round((w * VIEWPORT.height) / VIEWPORT.width);
    const description = `Capture of ${site.url} · ${MONTH} · Playwright Chrome ${VIEWPORT.width}x${VIEWPORT.height} · portfolio of Alberto Tuveri`;
    const exif = {
      ImageDescription: description,
      Artist: "Alberto Tuveri",
      Copyright: site.copyright,
      Software: `Playwright ${launch.startsWith("chrome") ? "Chrome" : "Chromium"} ${CHROME_VERSION.value} + sharp`,
      DateTime: EXIF_DATE,
    };
    const { buf, quality } = await encode(png, w, h, exif);
    const file = `${site.name}-${w}.webp`;
    await writeFile(resolve(OUT, file), buf);
    const meta = await sharp(buf).metadata();
    report.push({
      file, site, w, h, quality, bytes: buf.length, description, command, title, cookies, nav, errors: errors.length,
      exifOk: Boolean(meta.exif && meta.exif.length),
    });
    console.log(
      `${file}: ${w}x${h} q${quality} ${(buf.length / 1024).toFixed(1)} KB exif=${meta.exif?.length ?? 0}B`,
    );
  }
  console.log(`${site.name}: "${title}" nav=${nav} cookies=${cookies} pageerrors=${errors.length}`);
  await ctx.close();
}
await browser.close();

// ---- Sidecar PROVENANCE.md --------------------------------------------------
const date = NOW.toISOString().slice(0, 10);
const lines = [
  "# Captures — provenance",
  "",
  "Ogni raster in questa cartella è una cattura di un sito pubblico realizzato da SerSan (Alberto Tuveri in team),",
  "usata come miniatura nella tabella `work-performed` (REDESIGN-SPEC §E.8). La stessa origine è scritta",
  "nell'EXIF IFD0 di ogni file (ImageDescription · Artist · Copyright · Software · DateTime), leggibile con",
  "`node -e \"require('sharp')('public/captures/<file>').metadata().then(m=>console.log(m.exif.toString('latin1')))\"`.",
  "",
  `- Data: ${date}`,
  `- Strumento: Playwright ${launch} (${CHROME_VERSION.value}), viewport ${VIEWPORT.width}×${VIEWPORT.height} @ DPR 1, \`waitUntil: "networkidle"\` + settle, cookie banner declinati (mai accettati), scroll a 0 (composizione hero).`,
  "- Taglio 800×500: downscale (sharp, fit cover/top) della stessa cattura 1600×1000 — stessa composizione, per `srcset`.",
  "- Encoder: sharp → WebP, qualità di partenza 82, effort 6, cap 200 KB per file (scala a gradini se sfora).",
  "- Comando esatto: `node scripts/capture-sites.mjs` (da `C:\\Users\\alber\\Portfolio`).",
  "- Diritti: le catture mostrano siti di proprietà dei rispettivi titolari (campo EXIF `Copyright`); usate come prova del lavoro svolto.",
  "",
  "| File | Sorgente | Titolo pagina | Viewport | Output | Qualità | Peso | Cookie |",
  "|---|---|---|---|---|---|---|---|",
  ...report.map(
    (r) =>
      `| \`${r.file}\` | ${r.site.url} | ${r.title.replace(/\|/g, "/")} | ${VIEWPORT.width}×${VIEWPORT.height} @1x | ${r.w}×${r.h} WebP | q${r.quality} | ${(r.bytes / 1024).toFixed(1)} KB | ${r.cookies} |`,
  ),
  "",
  "EXIF `ImageDescription` per file:",
  "",
  ...report.map((r) => `- \`${r.file}\`: "${r.description}"`),
  "",
];
await writeFile(resolve(OUT, "PROVENANCE.md"), lines.join("\n"));
for (const r of report) {
  const { size } = await stat(resolve(OUT, r.file));
  if (size > MAX_BYTES) console.warn(`WARN ${r.file} exceeds 200 KB (${size})`);
  if (!r.exifOk) console.warn(`WARN ${r.file} has no EXIF`);
}
console.log("done -> " + OUT);
