// scripts/capture-sites.mjs — REAL captures of public sites built by SerSan, used as work plates
// (public/captures/, docs/redesign/rivista-next/11-media-scout.md §8).
//
//   node scripts/capture-sites.mjs domus-tua            -> public/captures/domus-tua-{1600,800}.webp (+ .json sidecars)
//   node scripts/capture-sites.mjs sersan-io spherenode -> re-captures those two (replaces the September files!)
//   node scripts/capture-sites.mjs --all                -> every site that is not blocked
//   add --no-log to leave PROVENANCE.md untouched (dry runs)
//
// With no site name the script captures NOTHING: the September captures (sersan-io, spherenode,
// 2026-09-16) are only replaced when named. PROVENANCE.md is APPENDED, never rewritten: each site owns
// one block (<!-- media:<name> --> … <!-- /media:<name> -->), see scripts/media/plates.mjs.
//
// Rules: real Chrome through launch() of scripts/lib/headless.mjs (ALWAYS headless: no window on
// Alberto's desktop; --enable-unsafe-webgpu so sersan.io renders its particle wordmark,
// --force-color-profile=srgb so the bytes are sRGB), viewport 1600×1000 DPR 1, `waitUntil: "networkidle"`
// + settle, cookie banners DECLINED (never accepted), hero composition (page top). The 800×500 is a
// downscale of the SAME capture. Encoding, EXIF IFD0 provenance and sidecars: scripts/media/plates.mjs.
//
// S3 (2026-10-11): a site may name a VIEW instead of its page top, for a frame that must show no person, no
// personal name and no third-party logo: `path` (a page of the same site), `anchorText` (a heading the page is
// scrolled to, `anchorTop` px below the viewport top), `dpr` and `crop` (a 16:10 rectangle of the viewport in CSS
// px, cut from the frame; nothing is drawn on it). To LOOK at candidates before choosing one:
//   node scripts/capture-sites.mjs domus-tua --dry [--path=/x] [--anchor="Heading text"] [--top=120] [--crop=l,t,w,h] [--tag=name]
// writes only .shots/captures/<site>[-tag]-raw.png (and -crop.png): no plate, no sidecar, no PROVENANCE line.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { launch } from "./lib/headless.mjs";
import { encodePlates, appendProvenance, plateTable, ROOT } from "./media/plates.mjs";

const RAW = resolve(ROOT, ".shots/captures");
await mkdir(RAW, { recursive: true });

const NOW = new Date();
const MONTH = NOW.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }); // "Oct 2026"
const VIEWPORT = { width: 1600, height: 1000 };

const SITES = [
  {
    name: "sersan-io",
    url: "https://sersan.io",
    copyright: "© SerSan — sersan.io",
    settle: 9500, // particle intro of the wordmark
  },
  {
    name: "spherenode",
    url: "https://spherenode.com",
    copyright: "© SphereNode — spherenode.com",
    settle: 6000,
  },
  {
    // Public client preview; domustua.com still serves the old WordPress site.
    // Keep the case link "pending" (cases.json): this preview is captured, never linked.
    // S3 (2026-10-11): the page top of the home shows the founder's face, her name in script and a WhatsApp
    // mark in the header, so the plate is no longer the home hero (the 2026-10-09 capture, replaced by this
    // one). It is a VIEW with no person, no personal name and no third-party mark: the method section of
    // /metodo (its eyebrow, heading, lead and button, and the first two steps on their red thread), cut from
    // the viewport below the site header (y 12-78, it carries the WhatsApp mark) and left of the two floating
    // contact buttons (x from 1426, y from 860). The crop's right edge falls in the gap of the section's ghost
    // word "Metodo Domus Tua". Chosen after a --dry look at four candidates (the home search, the method
    // thread alone, the dark statement, this one). Reduced motion: the site's static version, composed at once.
    name: "domus-tua",
    url: "https://domus-tua-ten.vercel.app",
    urlNote: "client preview, before the domustua.com launch",
    path: "/metodo",
    anchorText: "prima stima alla firma",
    anchorTop: 214,
    dpr: 2,
    crop: { left: 46, top: 100, width: 1344, height: 840 },
    viewNote: "the method section, below the site header and beside the floating contact buttons: no person, no personal name and no third-party mark in the frame",
    note: "Sostituisce la cattura del 2026-10-09 (l'hero della home: il volto e il nome della fondatrice, il marchio WhatsApp nell'header), che non è più nell'albero servito. Decisione del direttore, 2026-10-11.",
    copyright: "© Domus Tua Immobiliare — design and build SerSan",
    owner: "Domus Tua Immobiliare (site designed and built by SerSan)",
    settle: 10000,
    reducedMotion: "reduce",
    locale: "it-IT",
    // no focal point: the case shows this frame whole (fig.contain in cases.json), nothing is cropped to cover
    qStart: 90, // type on a soft gradient: 90 keeps the small text clean, still under the 1600w cap
  },
  {
    // 2026-10-09: the hero's own side card prints the empty-data state ("Stiamo aggiornando i profili in
    // questa zona"), the page logs React error #418 on load, and the logo reads "CAF Badante24" against
    // the recorded brand "Badante24". Not captured; run with --force once the data layer is back.
    name: "badante24h",
    url: "https://badante24h.vercel.app",
    copyright: "© ALS MCL Civitanova — Badante24",
    settle: 4000,
    reducedMotion: "reduce",
    locale: "it-IT",
    blocked: "hero prints the empty-data state (side card), React #418 on load — 2026-10-09",
  },
];

// Cookie REJECT buttons (EN/IT). Never "Accept".
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
        return { label: `declined via "${text}"`, text };
      }
    } catch {}
  }
  const anyBanner = await page
    .locator('[id*="cookie" i], [class*="cookie" i], [aria-label*="cookie" i]')
    .filter({ visible: true })
    .count()
    .catch(() => 0);
  return { label: anyBanner ? `banner present, no decline control found (${anyBanner})` : "no banner", text: null };
}

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const names = args.filter((a) => !a.startsWith("--"));
/* S3: --key=value overrides of a site's view, for a --dry look at candidates */
const opt = (k) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const DRY = flags.has("--dry");
const TAG = opt("tag");
const unknown = names.filter((n) => !SITES.some((s) => s.name === n));
if (unknown.length) throw new Error(`unknown site: ${unknown.join(", ")} (known: ${SITES.map((s) => s.name).join(", ")})`);
let todo = flags.has("--all") ? SITES.filter((s) => !s.blocked) : SITES.filter((s) => names.includes(s.name));
if (!todo.length) {
  console.log(`Nothing captured. Name the sites: node scripts/capture-sites.mjs <${SITES.map((s) => s.name).join("|")}> [--no-log] (or --all).`);
  process.exit(0);
}
for (const s of todo.filter((s) => s.blocked)) {
  if (!flags.has("--force")) console.log(`${s.name}: BLOCKED (${s.blocked}); pass --force to capture anyway.`);
}
if (!flags.has("--force")) todo = todo.filter((s) => !s.blocked);
if (!todo.length) process.exit(0);

// grayscale text antialiasing: LCD (subpixel) AA leaves colour fringes in a still image
const browser = await launch({ args: ["--disable-lcd-text"] });
const chrome = browser.version();
for (const site of todo) {
  /* S3: the view (a page, a heading, a crop); the page top at DPR 1 when the site names none */
  /* --path=metodo, without the leading slash: Git Bash turns "/metodo" into a Windows path */
  const path = ((p) => (p && !p.startsWith("/") ? "/" + p : p))(opt("path") ?? site.path ?? "");
  const anchorText = opt("anchor") ?? site.anchorText ?? null;
  const anchorTop = Number(opt("top") ?? site.anchorTop ?? 120);
  const dpr = Number(opt("dpr") ?? site.dpr ?? 1);
  const cropArg = opt("crop");
  const crop = cropArg === "none" ? null : cropArg ? (([left, top, width, height]) => ({ left, top, width, height }))(cropArg.split(",").map(Number)) : site.crop ?? null;
  if (crop && Math.abs(crop.width / crop.height - 1.6) > 0.004) throw new Error(`${site.name}: the crop ${crop.width}x${crop.height} is not 16:10`);
  if (crop && crop.width * dpr < 1600) throw new Error(`${site.name}: the crop is ${crop.width * dpr} device px wide, under 1600 (raise dpr)`);
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: dpr,
    locale: site.locale ?? "en-US",
    reducedMotion: site.reducedMotion ?? "no-preference",
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
  let nav = "ok";
  try {
    await page.goto(site.url + path, { waitUntil: "networkidle", timeout: 90_000 });
  } catch (e) {
    nav = e.message.split("\n")[0];
    await page.waitForLoadState("load").catch(() => {});
  }
  await page.waitForTimeout(site.settle);
  const cookies = await declineCookies(page);
  let scrolled = 0;
  if (anchorText) {
    /* walk down first, so everything a scroll reveals above the heading is in place, then set the heading */
    const el = page.getByText(anchorText, { exact: false }).first();
    if (!(await el.count())) throw new Error(`${site.name}: no element with the text "${anchorText}" on ${site.url + path}`);
    const yOf = () => el.evaluate((e, top) => Math.max(0, Math.round(e.getBoundingClientRect().top + scrollY - top)), anchorTop);
    for (let y = 0, to = await yOf(); y < to; y += 600) { await page.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y); await page.waitForTimeout(200); }
    scrolled = await yOf();
    await page.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), scrolled);
    await page.waitForTimeout(600);
    scrolled = await page.evaluate(() => Math.round(scrollY));
  } else {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  }
  await page.waitForTimeout(1500);
  const png = await page.screenshot({ type: "png" });
  const rawName = `${site.name}${TAG ? "-" + TAG : ""}`;
  await writeFile(resolve(RAW, `${rawName}-raw.png`), png);
  const title = await page.title();
  await ctx.close();
  const cut = crop ? { left: Math.round(crop.left * dpr), top: Math.round(crop.top * dpr), width: Math.round(crop.width * dpr), height: Math.round(crop.height * dpr) } : null;
  const master = cut ? await sharp(png).extract(cut).png().toBuffer() : await sharp(png).png().toBuffer();
  if (DRY) {
    if (cut) await writeFile(resolve(RAW, `${rawName}-crop.png`), master);
    console.log(`${site.name}: DRY "${title}" ${site.url + path} nav=${nav} cookies=${cookies.label} scrollY=${scrolled} pageerrors=${errors.length} -> .shots/captures/${rawName}-raw.png${cut ? " and -crop.png" : ""}`);
    continue;
  }

  const rm = site.reducedMotion === "reduce" ? " · reduced motion" : "";
  const cookieNote = cookies.text ? ` · cookies declined ("${cookies.text}")` : "";
  const where = site.url + path;
  const viewNote = site.viewNote ? ` · ${site.viewNote}` : "";
  const cutNote = cut ? ` · cropped 16:10` : "";
  const description = `Capture of ${where}${site.urlNote ? ` (${site.urlNote})` : ""} · ${MONTH} · Playwright Chrome ${VIEWPORT.width}x${VIEWPORT.height}${dpr !== 1 ? ` @${dpr}x` : ""}${rm}${cookieNote}${viewNote}${cutNote} · portfolio of Alberto Tuveri`;
  const day = NOW.toISOString().slice(0, 10);
  const origin =
    `ORIGIN (pre-existing raster, not generated): browser capture of ${site.urlNote ? `the ${site.urlNote} ${where}` : `the live public site ${where}`}, taken ${day} with Playwright ` +
    `(Chrome ${chrome}, channel chrome, headless), viewport ${VIEWPORT.width}x${VIEWPORT.height} @ DPR ${dpr}, ` +
    `${site.reducedMotion === "reduce" ? 'prefers-reduced-motion "reduce", ' : ""}waitUntil networkidle + ${site.settle} ms settle, ` +
    `cookie banner ${cookies.text ? `declined via "${cookies.text}"` : cookies.label}, ${anchorText ? `scrolled to the heading "${anchorText}" (scrollY ${scrolled})` : "scrolled to 0"}` +
    `${cut ? `, cropped 16:10 at source pixels left ${cut.left}, top ${cut.top}, ${cut.width}x${cut.height}${site.viewNote ? ` (${site.viewNote})` : ""}; nothing drawn or altered` : ""}; by scripts/capture-sites.mjs. ` +
    `Site owned by ${site.owner ?? site.copyright.replace(/^© /, "")}; used as evidence of work performed.`;
  const rows = await encodePlates({
    slug: site.name,
    master,
    description,
    copyright: site.copyright,
    software: `Playwright Chrome ${chrome} (headless)`,
    origin,
    qStart: site.qStart,
  });
  console.log(`${site.name}: "${title}" nav=${nav} cookies=${cookies.label} pageerrors=${errors.length}`);
  if (!flags.has("--no-log")) {
    appendProvenance(site.name, [
      `### \`${site.name}-*\` — catturato ${day} (\`node scripts/capture-sites.mjs ${site.name}\`)`,
      "",
      `Sorgente: ${where}${site.urlNote ? ` (${site.urlNote})` : ""} · titolo pagina "${title.replace(/\|/g, "/")}" · Playwright Chrome ${chrome} headless, viewport ${VIEWPORT.width}×${VIEWPORT.height} @${dpr}x, locale \`${site.locale ?? "en-US"}\`${site.reducedMotion === "reduce" ? ", `prefers-reduced-motion: reduce` (la versione statica del sito)" : ""}, \`networkidle\` + ${site.settle} ms · cookie: ${cookies.label} · navigazione: ${nav} · errori di pagina: ${errors.length}.${anchorText ? ` Vista: pagina scorsa fino al titolo «${anchorText}» (scrollY ${scrolled}).` : ""}${cut ? ` Taglio 16:10 in pixel sorgente \`extract(${JSON.stringify(cut)})\`, nessun ritocco${site.viewNote ? `: ${site.viewNote}` : ""}.` : ""} Il taglio 800×500 è un downscale della stessa cattura.`,
      ...(site.note ? ["", site.note] : []),
      "",
      ...plateTable(rows, { focal: site.focal }),
    ]);
  }
}
await browser.close();
console.log("done");
