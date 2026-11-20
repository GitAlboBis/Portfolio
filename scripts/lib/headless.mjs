// headless.mjs · the one way the repo's scripts open Chrome: real Chrome with WebGPU through Playwright, always headless.
// Used by scripts/visual-gate.mjs's neighbours (media pipelines, capture-sites) and the probes under scripts/probes/.
// Moved here from scripts/probes/water/lib.mjs when the water engine left the site (rivista-story sweep).
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

// RV_ROOT: the tree a probe reads and writes (default: the checkout this file lives in)
export const ROOT = process.env.RV_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
// RV_BASE points the probes at another server (a worktree lane serves its own copy on another port)
export const BASE = process.env.RV_BASE || "http://127.0.0.1:5178/proto/rivista/";

export const CHROME_ARGS = [
  "--enable-unsafe-webgpu",
  "--enable-features=Vulkan",
  "--ignore-gpu-blocklist",
  "--enable-webgpu-developer-features", // raw (non-quantised) timestamps
  "--force-color-profile=srgb",         // screenshots are sRGB bytes, no display-profile conversion
];

/** Launch real Chrome (Playwright's bundled chromium has no dxil.dll → no WebGPU device on Windows).
 *  Always headless, even when a caller asks for a window (headless: false): parallel lanes opening visible Chrome
 *  windows took over Alberto's desktop (2026-09-27). Headless Chrome has no occluded window, so rAF and the CDP
 *  screencast are not throttled, and WebGPU gets the same hardware adapter. RV_HEADED=1 brings the windows back. */
export async function launch({ headless = true, args = [] } = {}) {
  const headed = headless === false && process.env.RV_HEADED === "1";
  return noMail(await chromium.launch({ channel: "chrome", headless: !headed, args: [...CHROME_ARGS, ...args] }));
}

/** A probe never opens a window on the desktop. A click on a mailto: or tel: link in headless Chrome still hands the
 *  address to Windows, which opens the mail app: on 2026-11-12 a tap at 200,600 on the phone cover (the hero foot's
 *  "Write to me") opened an Outlook window on Alberto's desktop. Every context this browser opens (newContext, and
 *  newPage, which goes through it) cancels those clicks before the page's default runs; the click event itself still
 *  reaches the page's own handlers. RV_MAILTO=1 lets them through. */
function noMail(browser) {
  if (process.env.RV_MAILTO === "1") return browser;
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (...a) => {
    const context = await newContext(...a);
    await context.addInitScript(() => {
      if (window.__rvNoMail) return;
      window.__rvNoMail = true;
      document.addEventListener("click", (e) => {
        const a = e.target && e.target.closest && e.target.closest('a[href^="mailto:"], a[href^="tel:"]');
        if (a) e.preventDefault();
      }, true);
    });
    return context;
  };
  return browser;
}

/**
 * Open a page with console / error / uncapturederror collection.
 * @param {import("playwright").Browser} browser
 * @param {string} url absolute or relative to BASE
 * @param {{ viewport?: {width:number,height:number}, deviceScaleFactor?: number, isMobile?: boolean, hasTouch?: boolean, reducedMotion?: "reduce"|"no-preference", waitFor?: string, timeout?: number }} [o]
 */
export async function openPage(browser, url, o = {}) {
  const context = await browser.newContext({
    viewport: o.viewport ?? { width: 1440, height: 900 },
    deviceScaleFactor: o.deviceScaleFactor ?? 1,
    isMobile: o.isMobile ?? false,
    hasTouch: o.hasTouch ?? false,
    reducedMotion: o.reducedMotion ?? "no-preference",
  });
  const page = await context.newPage();
  const consoleMsgs = [];
  page.on("console", (m) => consoleMsgs.push({ type: m.type(), text: m.text() }));
  page.on("pageerror", (e) => consoleMsgs.push({ type: "pageerror", text: String(e && e.stack || e) }));
  page.on("response", (r) => { if (r.status() >= 400) consoleMsgs.push({ type: "http", text: `${r.status()} ${r.url()}` }); });
  page.on("requestfailed", (r) => consoleMsgs.push({ type: "requestfailed", text: `${r.url()} ${r.failure()?.errorText}` }));
  // independent of the page's own handler: record every uncaptured WebGPU error on any device
  await page.addInitScript(() => {
    window.__gpuErrors = [];
    if (typeof GPUAdapter === "undefined") return;
    const orig = GPUAdapter.prototype.requestDevice;
    GPUAdapter.prototype.requestDevice = async function (...a) {
      const d = await orig.apply(this, a);
      d.addEventListener("uncapturederror", (e) => window.__gpuErrors.push(String(e.error && e.error.message)));
      return d;
    };
  });
  const full = /^https?:/.test(url) ? url : BASE + url;
  await page.goto(full, { waitUntil: "load", timeout: o.timeout ?? 30000 });
  if (o.waitFor) await page.waitForFunction(o.waitFor, null, { timeout: o.timeout ?? 30000 });
  return { context, page, consoleMsgs };
}

/** Log adapter info and throw if it is a fallback (software) adapter. */
export function assertAdapter(info, label = "") {
  console.log(`[probe] adapter${label ? " (" + label + ")" : ""}: ${JSON.stringify(info)}`);
  if (!info) throw new Error("no adapter info");
  if (info.isFallbackAdapter) throw new Error("FAIL: fallback adapter (SwiftShader) — refusing to judge");
  return info;
}

/** Split collected console messages. WebGPU warnings = any warning that mentions WebGPU/validation. */
export function consoleSummary(msgs, gpuErrors = []) {
  const errors = msgs.filter((m) => m.type === "error" || m.type === "pageerror" || m.type === "http" || m.type === "requestfailed");
  const warnings = msgs.filter((m) => m.type === "warning");
  const gpuWarnings = warnings.filter((m) => /webgpu|validation|wgsl|gpu/i.test(m.text));
  return { errors, warnings, gpuWarnings, gpuErrors, clean: errors.length === 0 && gpuWarnings.length === 0 && gpuErrors.length === 0 };
}

/** A screenshot that never throws (a page mid-navigation or a stalled compositor returns null). */
export async function shot(page, file, timeout = 8000) {
  try { return await page.screenshot({ path: file, timeout }); }
  catch (e) { return null; }
}

// ---------------------------------------------------------------- PNG decode (8-bit RGB/RGBA, non-interlaced)

/** @param {Buffer} buf @returns {{ width: number, height: number, data: Uint8Array }} RGBA */
export function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  let off = 8, width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; interlace = data[12]; }
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    off += 12 + len;
  }
  if (bitDepth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) throw new Error(`unsupported PNG (depth ${bitDepth}, type ${colorType}, interlace ${interlace})`);
  const bpp = colorType === 6 ? 4 : 3, stride = width * bpp;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const px = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const row = px.subarray(y * stride, (y + 1) * stride), prev = y > 0 ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? row[x - bpp] : 0, b = prev ? prev[x] : 0, c = prev && x >= bpp ? prev[x - bpp] : 0;
      let v = src[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      row[x] = v & 255;
    }
  }
  const out = new Uint8Array(width * height * 4);
  for (let i = 0, j = 0; i < width * height; i++, j += bpp) { out[i * 4] = px[j]; out[i * 4 + 1] = px[j + 1]; out[i * 4 + 2] = px[j + 2]; out[i * 4 + 3] = bpp === 4 ? px[j + 3] : 255; }
  return { width, height, data: out };
}

/** RGBA at integer pixel (x, y). */
export function pixelAt(img, x, y) {
  const xi = Math.min(img.width - 1, Math.max(0, Math.floor(x))), yi = Math.min(img.height - 1, Math.max(0, Math.floor(y)));
  const o = (yi * img.width + xi) * 4;
  return [img.data[o], img.data[o + 1], img.data[o + 2], img.data[o + 3]];
}

/** Write a JSON report. */
export function writeReport(file, obj) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(obj, null, 2)); }
