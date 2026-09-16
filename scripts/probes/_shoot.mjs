// SCRATCH visual gate for the dusk-atmosphere work. NOT committed.
// Boots Playwright against the running dev app, scrolls (via Lenis) to the night
// band, captures Contact + Footer on desktop + mobile, reports console errors.
//   node _shoot.mjs <label>        e.g. node _shoot.mjs before
//   node _shoot.mjs <label> reduce  -> emulate prefers-reduced-motion
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const label = process.argv[2] || "shot";
const reduce = process.argv[3] === "reduce";
const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const outDir = resolve(process.cwd(), ".shots");
await mkdir(outDir, { recursive: true });

const viewports = [
  { name: "desktop", width: 1440, height: 900, isMobile: false, dpr: 1 },
  { name: "mobile", width: 390, height: 844, isMobile: true, dpr: 3 },
];
const IGNORE = [/Download the React DevTools/i, /\[Fast Refresh\]/i, /THREE\.Clock/i, /WebGPU/i];
const isReal = (t) => !IGNORE.some((re) => re.test(t));

const browser = await chromium.launch();
for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.isMobile,
    deviceScaleFactor: vp.dpr,
    reducedMotion: reduce ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" && isReal(m.text())) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(2200);

  // jump to the Contact (night) band via Lenis, fallback to native
  await page.evaluate(() => {
    const l = window.__lenis;
    const el = document.querySelector("#contact");
    if (l?.scrollTo) l.scrollTo(el || document.body.scrollHeight, { immediate: true });
    else if (el) el.scrollIntoView();
    else window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(1900);
  await page.screenshot({ path: resolve(outDir, `${label}-${vp.name}-contact.png`) });

  // then the very bottom (footer)
  await page.evaluate(() => {
    const l = window.__lenis;
    const max = document.documentElement.scrollHeight;
    if (l?.scrollTo) l.scrollTo(max, { immediate: true });
    else window.scrollTo(0, max);
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: resolve(outDir, `${label}-${vp.name}-footer.png`) });

  console.log(`[${vp.name}] console errors: ${errors.length}`);
  for (const e of errors) console.log("   - " + e);
  await ctx.close();
}
await browser.close();
console.log(`done -> .shots/${label}-*`);
