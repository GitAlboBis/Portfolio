// _capture_sites.mjs — cattura still REALI dei siti pubblici citati nel CV (sersan.io, spherenode.com)
// come asset candidati per le card/case study dei lavori SerSan. Non committato.
//   node _capture_sites.mjs            -> .shots/assets/*.png
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const OUT = resolve(process.cwd(), ".shots/assets");
await mkdir(OUT, { recursive: true });
const SITES = [
  { name: "sersan-io", url: "https://sersan.io", settle: 9000, scrolls: 4 },
  { name: "spherenode", url: "https://spherenode.com", settle: 6000, scrolls: 4 },
];
const VIEWPORTS = [
  { name: "desktop", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: "mobile", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];

let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--enable-unsafe-webgpu"] });
} catch {
  browser = await chromium.launch({ headless: true });
}
for (const site of SITES) {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ ...vp, locale: "en-US" });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
    try {
      await page.goto(site.url, { waitUntil: "load", timeout: 60000 });
    } catch (e) {
      console.log(`${site.name}/${vp.name}: nav error ${e.message.split("\n")[0]}`);
    }
    await page.waitForTimeout(site.settle);
    // dismiss obvious cookie banners
    for (const sel of ['button:has-text("Accept")', 'button:has-text("Accetta")', 'button:has-text("OK")', '[aria-label*="close" i]']) {
      try {
        const b = page.locator(sel).first();
        if (await b.count()) await b.click({ timeout: 1500 });
      } catch {}
    }
    await page.screenshot({ path: resolve(OUT, `${site.name}-${vp.name}-01.png`) });
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let i = 1; i <= site.scrolls; i++) {
      const y = Math.min(Math.round((h / (site.scrolls + 1)) * i), h - vp.viewport.height);
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
      await page.waitForTimeout(1800);
      await page.screenshot({ path: resolve(OUT, `${site.name}-${vp.name}-${String(i + 1).padStart(2, "0")}.png`) });
    }
    const title = await page.title();
    console.log(`${site.name}/${vp.name}: "${title}" docH=${h} shots=${site.scrolls + 1} pageerrors=${errors.length}`);
    await ctx.close();
  }
}
await browser.close();
console.log("done -> " + OUT);
