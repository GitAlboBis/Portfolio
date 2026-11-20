// scripts/media/sersan-scenes.mjs — REAL frames of Alberto's own WebGPU work on the public site https://sersan.io
// (audit 12 M4/M6, the sersan.io case figure sequence). Two steps, so the pick is a human look, not a timer:
//
//   node scripts/media/sersan-scenes.mjs capture [intro|founders] -> bursts of raw frames in .shots/captures/sersan-scenes/
//                                                              + manifest.json (url, time, scroll, Chrome, adapter)
//   node scripts/media/sersan-scenes.mjs encode             -> the picked frames below, cropped 16:10 and encoded as
//                                                              public/captures/sersan-io-<scene>-{1600,800}.webp with
//                                                              EXIF + sidecar + a PROVENANCE.md block (plates.mjs)
//   add --no-log to leave PROVENANCE.md untouched (dry runs)
//
// Rules (media scout §8, golden rules): real Chrome through launch() of scripts/lib/headless.mjs, ALWAYS headless,
// --enable-unsafe-webgpu; the adapter is read and a fallback (software) adapter is refused, so every frame is the site's
// real WebGPU path on a hardware GPU. Viewport 1600x1000 @ DPR 2 (3200x2000), so a 16:10 crop of at least 1600 px is
// never upscaled. Cookie banners declined, never accepted. Sources are only READ: the site is not modified, nothing is
// drawn on a frame, nothing is generated. Scene names and scroll anchors come from the site's own source
// (C:/Users/alber/Desktop/sersan-v2-main, read only): HeroTextParticles (the particle wordmark intro), HomeSingularity
// (the raymarched black hole behind the intro), HeroLogo (the layered particle mark), FounderPortraitMorph
// (#founders, the particle portrait, self-playing under the section's gate).
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { encodePlates, appendProvenance, plateTable, ROOT } from "./plates.mjs";

const RAW = resolve(ROOT, ".shots/captures/sersan-scenes");
const URL_HOME = "https://sersan.io";
const VIEWPORT = { width: 1600, height: 1000 };
const DPR = 2;

const DECLINE = ["Decline", "Reject all", "Reject", "Only necessary", "Necessary only", "Essential only", "Rifiuta"];
async function declineCookies(page) {
  for (const t of DECLINE) {
    const b = page.getByRole("button", { name: t, exact: false }).first();
    try { if (await b.count()) { await b.click({ timeout: 1500 }); return `declined via "${t}"`; } } catch {}
  }
  return "no banner";
}
async function adapterOf(page) {
  return page.evaluate(async () => {
    if (!navigator.gpu) return { gpu: false };
    const a = await navigator.gpu.requestAdapter();
    if (!a) return { gpu: true, adapter: null };
    const i = a.info || {};
    return { gpu: true, fallback: !!(a.isFallbackAdapter || i.isFallbackAdapter), vendor: i.vendor, architecture: i.architecture, description: i.description };
  });
}

async function capture(which) {
  const { launch } = await import("../lib/headless.mjs");
  mkdirSync(RAW, { recursive: true });
  const browser = await launch({ args: ["--disable-lcd-text"] });
  const chrome = browser.version();
  const mf = join(RAW, "manifest.json");
  const manifest = existsSync(mf) ? JSON.parse(readFileSync(mf, "utf8")) : { frames: [] };
  Object.assign(manifest, { chrome, viewport: VIEWPORT, dpr: DPR, takenAt: new Date().toISOString() });
  const shot = async (page, scene, t0, extra = {}) => {
    const ms = Date.now() - t0;
    const y = await page.evaluate(() => Math.round(scrollY)).catch(() => null);
    const file = `${scene}-${String(ms).padStart(6, "0")}ms.png`;
    await page.screenshot({ path: join(RAW, file) });
    manifest.frames = manifest.frames.filter((f) => f.file !== file);
    manifest.frames.push({ file, scene, url: page.url(), ms, scrollY: y, via: "page.screenshot (PNG)", ...extra });
  };

  // A · the home intro on one continuous canvas: the particle wordmark assembling, then the hero at rest (the layered
  // mark, the wordmark, the raymarched black hole). A full-size screenshot stalls the page for ~1.5 s at DPR 2, so the
  // intro is WATCHED through the compositor's screencast (CDP Page.startScreencast, 1600x1000, not kept) and ONE
  // full-resolution screenshot is taken when the wordmark is half assembled: letters S-E-R-S lit (mean luma > 80 in
  // x 190-880, y 350-530 of the 1600x1000 frame) while A-N are still a cloud (20-45 in x 900-1240). Thresholds read
  // from a screencast of the whole intro (2026-10-09). Once the hero is at rest, full-resolution frames every ~2 s.
  if (which === "intro") {
    manifest.frames = manifest.frames.filter((f) => f.scene !== "intro" && f.scene !== "wordmark" && f.scene !== "rest");
    const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: DPR, locale: "en-US" });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    const t0 = Date.now();
    let busy = false, fired = false, trace = [];
    const fire = (ms, sers, an) => {
      fired = true;
      return shot(page, "wordmark", t0, { trigger: { ms, sers: +sers.toFixed(1), an: +an.toFixed(1) } });
    };
    let pending = null;
    cdp.on("Page.screencastFrame", (e) => {
      cdp.send("Page.screencastFrameAck", { sessionId: e.sessionId }).catch(() => {});
      if (busy || fired) return;
      busy = true;
      const ms = Date.now() - t0;
      sharp(Buffer.from(e.data, "base64")).resize(400, 250, { fit: "fill" }).greyscale().raw().toBuffer().then((px) => {
        const mean = (x0, x1, y0, y1) => { let s = 0, n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { s += px[y * 400 + x]; n++; } return s / n; };
        const sers = mean(47, 220, 87, 132), an = mean(225, 310, 87, 132);
        trace.push([ms, Math.round(sers), Math.round(an)]);
        if (!fired && sers > 80 && an > 20 && an < 45) pending = fire(ms, sers, an);
      }).catch(() => {}).finally(() => { busy = false; });
    });
    await page.goto(URL_HOME, { waitUntil: "domcontentloaded", timeout: 90_000 });
    const gpu = await adapterOf(page);
    manifest.intro = { adapter: gpu };
    if (!gpu.gpu || gpu.adapter === null || gpu.fallback) throw new Error("no hardware WebGPU adapter: " + JSON.stringify(gpu));
    await cdp.send("Page.startScreencast", { format: "png", maxWidth: VIEWPORT.width, maxHeight: VIEWPORT.height, everyNthFrame: 2 });
    while (!fired && Date.now() - t0 < 30_000) await page.waitForTimeout(100);
    await cdp.send("Page.stopScreencast").catch(() => {});
    if (pending) await pending;
    manifest.intro.trigger = fired ? "fired" : "never fired";
    manifest.intro.trace = trace.filter((r, i) => i % 3 === 0);
    // the hero at rest: the intro has handed over by ~16 s on this machine; frames from 22 s to 46 s
    while (Date.now() - t0 < 22_000) await page.waitForTimeout(250);
    while (Date.now() - t0 < 46_000) { await shot(page, "rest", t0); await page.waitForTimeout(600); }
    manifest.intro.cookies = await declineCookies(page);
    await ctx.close();
  }

  // B · the particle portrait (#founders, FounderPortraitMorph): the intro is skipped (the site's own session flag),
  // the page is set at the section, its gate engages, and the arrow keys (the section's own control, "← → keys")
  // step through the portraits; frames are taken after each step has settled. Only Alberto's own portrait is kept.
  if (which === "founders") {
    manifest.frames = manifest.frames.filter((f) => f.scene !== "founders");
    const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: DPR, locale: "en-US" });
    await ctx.addInitScript(() => { try { sessionStorage.setItem("sersan_skip_intro", "1"); } catch (e) {} });
    const page = await ctx.newPage();
    await page.goto(URL_HOME, { waitUntil: "networkidle", timeout: 90_000 }).catch(() => {});
    manifest.founders = { adapter: await adapterOf(page), cookies: await declineCookies(page) };
    await page.waitForTimeout(3000);
    const top = await page.evaluate(() => { const s = document.getElementById("founders"); return s ? Math.round(s.getBoundingClientRect().top + scrollY) : null; });
    manifest.founders.sectionTop = top;
    // the page's own gates (the intro, the neural lattice) hold a wheel walk, so the reader's place is set directly
    // at the section (a jump, as a hash link or find-in-page would), then one small wheel step lets its gate engage
    await page.evaluate((y) => window.scrollTo(0, y), top);
    await page.waitForTimeout(1200);
    await page.mouse.move(800, 500);
    await page.mouse.wheel(0, 40);
    await page.waitForTimeout(9000);
    const t0 = Date.now();
    await shot(page, "founders", t0, { step: 0 });
    for (let k = 1; k <= 4; k++) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(6500);
      await shot(page, "founders", t0, { step: k });
      await page.waitForTimeout(1500);
      await shot(page, "founders", t0, { step: k });
    }
    await ctx.close();
  }
  writeFileSync(mf, JSON.stringify(manifest, null, 1));
  await browser.close();
  console.log(`${which}: manifest has ${manifest.frames.length} frames in ${RAW}`);
}

/* ------------------------------------------------------------------ encode: the picks, after a look */
// Picked by looking at every raw frame (2026-10-09). Each crop keeps every piece of type whole: the intro's "52. SERSAN"
// label, its loading counter and the "Skip intro" hint are left out, and the portrait's orbit labels are all inside.
const PICKS = [
  {
    slug: "sersan-io-wordmark",
    file: "wordmark-005793ms.png",
    what: "the wordmark intro, its particles mid-assembly (HeroTextParticles)",
    extract: { left: 300, top: 140, width: 2176, height: 1360 },
    qStart: 86,
  },
  {
    slug: "sersan-io-blackhole",
    file: "rest-024252ms.png",
    what: "the raymarched black hole under the wordmark, the home hero at rest after the intro (HomeSingularity)",
    extract: { left: 640, top: 800, width: 1920, height: 1200 },
    qStart: 86,
  },
  {
    /* S2 fix (both look reviews, M3): the home's Now figure is square; a 1:1 crop of the 16:10 plate cut the SERSAN
       wordmark at both edges, so the same raw frame gets its own square, wide enough that the parallax over-scale (1.12)
       keeps the hexagonal mark, the whole wordmark and the black hole inside the frame */
    slug: "sersan-io-blackhole-sq",
    file: "rest-024252ms.png",
    what: "the SerSan mark, the wordmark and the raymarched black hole under them, the home hero at rest after the intro (HomeSingularity)",
    extract: { left: 720, top: 40, width: 1920, height: 1920 },
    square: true,
    qStart: 86,
  },
  {
    slug: "sersan-io-portrait",
    file: "founders-011216ms.png",
    what: "Alberto Tuveri's own particle portrait in the founders section, with its orbit of skill labels (FounderPortraitMorph)",
    extract: { left: 0, top: 350, width: 2030, height: 1269 },
    qStart: 84,
  },
];

async function encode(noLog, only) {
  const manifest = JSON.parse(readFileSync(join(RAW, "manifest.json"), "utf8"));
  /* S2 fix: encode only the named picks (an encode rewrites EXIF dates, so the others are left byte-identical) */
  for (const p of PICKS.filter((x) => !only.length || only.includes(x.slug))) {
    const f = manifest.frames.find((x) => x.file === p.file);
    if (!f || !existsSync(join(RAW, p.file))) throw new Error(`${p.slug}: raw frame ${p.file} missing`);
    const master = await sharp(join(RAW, p.file)).extract(p.extract).png({ compressionLevel: 1 }).toBuffer();
    const day = manifest.takenAt.slice(0, 10);
    const gpu = (manifest[f.scene === "intro" ? "intro" : "founders"] || {}).adapter || {};
    const description = `Capture of https://sersan.io (${p.what}) · ${day} · WebGPU on a hardware adapter, headless Chrome ${manifest.chrome} 1600x1000 @2x · cropped ${p.square ? "1:1" : "16:10"} · Alberto Tuveri's own WebGPU work · portfolio of Alberto Tuveri`;
    const origin =
      `ORIGIN (pre-existing raster, not generated): frame of the live public site ${f.url}, taken ${manifest.takenAt} with Playwright ` +
      `(Chrome ${manifest.chrome}, channel chrome, headless, --enable-unsafe-webgpu) on a hardware WebGPU adapter (${gpu.vendor || "?"} ${gpu.architecture || ""}, fallback refused), ` +
      `viewport 1600x1000 @ DPR 2, ${f.ms} ms after navigation, scrollY ${f.scrollY}; ${p.what}. Cropped ${p.square ? "1:1" : "16:10"} at source pixels left ${p.extract.left}, top ${p.extract.top}, ` +
      `${p.extract.width}x${p.extract.height}; nothing drawn or altered. By scripts/media/sersan-scenes.mjs (raw frame ${p.file}). ` +
      `Site and scene designed and built by Alberto Tuveri for SerSan (sersan.io); used as evidence of his own work.`;
    const rows = await encodePlates({ slug: p.slug, master, description, copyright: "© SerSan — sersan.io · WebGPU scenes by Alberto Tuveri", software: `Playwright Chrome ${manifest.chrome} (headless, WebGPU)`, origin, qStart: p.qStart ?? 86, square: !!p.square });
    if (!noLog) {
      appendProvenance(p.slug, [
        `### \`${p.slug}-*\` — catturato ${day} (\`node scripts/media/sersan-scenes.mjs capture\` poi \`encode\`)`,
        "",
        `Sorgente: ${f.url} · ${p.what} · fotogramma grezzo \`.shots/captures/sersan-scenes/${p.file}\` (${f.ms} ms dalla navigazione, scrollY ${f.scrollY}) · Playwright Chrome ${manifest.chrome} headless, \`--enable-unsafe-webgpu\`, adattatore hardware ${gpu.vendor || "?"} ${gpu.architecture || ""} (fallback rifiutato), viewport 1600×1000 @ DPR 2 · cookie: ${(manifest[f.scene === "intro" ? "intro" : "founders"] || {}).cookies || "?"}. Taglio ${p.square ? "1:1" : "16:10"} in pixel sorgente \`extract(${JSON.stringify(p.extract)})\`, nessun ritocco. Scena e sito di Alberto Tuveri per SerSan.`,
        "",
        ...plateTable(rows, { focal: p.focal }),
      ]);
    }
  }
}

const args = process.argv.slice(2);
if (args[0] === "capture") for (const w of (args.slice(1).filter((a) => !a.startsWith("--")).length ? args.slice(1).filter((a) => !a.startsWith("--")) : ["intro", "founders"])) await capture(w);
else if (args[0] === "encode") await encode(args.includes("--no-log"), args.slice(1).filter((a) => !a.startsWith("--")));
else console.log("usage: node scripts/media/sersan-scenes.mjs capture | encode [slug ...] [--no-log]");
