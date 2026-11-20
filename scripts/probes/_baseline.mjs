// _baseline.mjs — fotografia di BASELINE del sito attuale prima del redesign (non committato).
// Tutte le route × desktop/mobile, uno screenshot per viewport di scroll, console errors/warnings,
// metriche grezze. Chrome reale (channel "chrome") per il WebGPU; fallback al Chromium di Playwright.
//   node _baseline.mjs                      -> .shots/baseline/*
//   OUT=.shots/x ROUTES=/,/work node _baseline.mjs
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = resolve(process.cwd(), process.env.OUT ?? ".shots/baseline");
await mkdir(OUT, { recursive: true });
const ROUTES = (process.env.ROUTES ?? "/,/work,/about,/work/badante24h,/styleguide").split(",");
const REDUCE = process.env.REDUCE === "1";
const MAX_STEPS = Number(process.env.MAX_STEPS ?? 40);
const VIEWPORTS = [
  { name: "desktop", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: "mobile", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];
const NOISE = [/Download the React DevTools/i, /\[Fast Refresh\]/i, /THREE\.Clock/i, /Image with src/i, /HMR/i];

let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--enable-unsafe-webgpu"] });
  console.log("browser: chrome (channel)");
} catch (e) {
  console.log("chrome channel unavailable (" + e.message.split("\n")[0] + "), falling back to bundled chromium");
  browser = await chromium.launch({ headless: true });
}

const report = [];
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ ...vp, reducedMotion: REDUCE ? "reduce" : "no-preference" });
  for (const route of ROUTES) {
    const page = await ctx.newPage();
    const logs = [];
    page.on("console", (m) => {
      const t = m.type();
      if ((t === "error" || t === "warning") && !NOISE.some((r) => r.test(m.text()))) logs.push(`[${t}] ${m.text().slice(0, 300)}`);
    });
    page.on("pageerror", (e) => logs.push(`[pageerror] ${String(e.message).slice(0, 300)}`));
    page.on("requestfailed", (r) => logs.push(`[requestfailed] ${r.url().slice(0, 200)} ${r.failure()?.errorText ?? ""}`));
    const slug = route === "/" ? "_home" : route.replace(/\//g, "_");
    const tag = `${vp.name}${slug}`;
    const t0 = Date.now();
    try {
      await page.goto(BASE + route, { waitUntil: "load", timeout: 90000 });
    } catch (e) {
      logs.push(`[nav] ${e.message.split("\n")[0]}`);
    }
    const loadMs = Date.now() - t0;
    await page.waitForTimeout(450);
    await page.screenshot({ path: resolve(OUT, `${tag}-00-firstpaint.png`) });
    await page.waitForTimeout(5000);
    const info = await page
      .evaluate(() => {
        const p = document.getElementById("preloader");
        const res = performance.getEntriesByType("resource");
        const byType = {};
        for (const r of res) {
          const k = r.initiatorType || "other";
          byType[k] = (byType[k] || 0) + (r.transferSize || 0);
        }
        return {
          gpu: !!navigator.gpu,
          docH: document.documentElement.scrollHeight,
          nodes: document.getElementsByTagName("*").length,
          title: document.title,
          h1: [...document.querySelectorAll("h1")].map((h) => h.textContent?.trim()),
          transferBytes: res.reduce((a, r) => a + (r.transferSize || 0), 0),
          transferByType: byType,
          resCount: res.length,
          preloaderVisible: p ? getComputedStyle(p).display !== "none" && getComputedStyle(p).visibility !== "hidden" && getComputedStyle(p).opacity !== "0" : null,
          imgsNoAlt: [...document.images].filter((i) => !i.hasAttribute("alt")).length,
          canvases: document.querySelectorAll("canvas").length,
          videos: document.querySelectorAll("video").length,
          lenis: !!window.__lenis,
          bodyOverflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
      })
      .catch((e) => ({ evalError: e.message }));
    const vh = vp.viewport.height;
    const docH = info.docH ?? vh;
    const steps = Math.min(MAX_STEPS, Math.ceil(docH / vh));
    let shots = 0;
    for (let i = 0; i <= steps; i++) {
      const y = Math.max(0, Math.min(i * vh, docH - vh));
      try {
        await page.evaluate((y) => {
          const l = window.__lenis;
          if (l?.scrollTo) l.scrollTo(y, { immediate: true, force: true });
          else window.scrollTo(0, y);
        }, y);
      } catch {}
      await page.waitForTimeout(i === 0 ? 300 : 1100);
      await page.screenshot({ path: resolve(OUT, `${tag}-${String(i + 1).padStart(2, "0")}.png`) }).catch(() => {});
      shots++;
      if (y >= docH - vh) break;
    }
    // menu overlay (if any)
    let menu = "n/a";
    try {
      await page.evaluate(() => {
        const l = window.__lenis;
        if (l?.scrollTo) l.scrollTo(0, { immediate: true, force: true });
        else window.scrollTo(0, 0);
      });
      await page.waitForTimeout(600);
      const toggle = page.locator("button[aria-expanded]").first();
      if (await toggle.count()) {
        await toggle.click({ timeout: 3000 });
        await page.waitForTimeout(1200);
        await page.screenshot({ path: resolve(OUT, `${tag}-menu.png`) });
        menu = "captured";
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);
      } else menu = "no toggle";
    } catch (e) {
      menu = "error: " + e.message.split("\n")[0];
    }
    report.push({ vp: vp.name, route, loadMs, shots, menu, ...info, logs });
    console.log(`${tag}: load ${loadMs}ms, docH ${docH}, ${shots} shots, ${logs.length} console issues`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
await writeFile(resolve(OUT, "report.json"), JSON.stringify(report, null, 2));
console.log("done -> " + OUT);
