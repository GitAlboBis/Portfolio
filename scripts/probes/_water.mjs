// SCRATCH visual gate for the ShallowWater veil (all routes). NOT committed.
//   node _water.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const outDir = resolve(process.cwd(), ".shots");
await mkdir(outDir, { recursive: true });

const IGNORE = [/Download the React DevTools/i, /\[Fast Refresh\]/i, /THREE\.Clock/i, /WebGPU/i];
const isReal = (t) => !IGNORE.some((re) => re.test(t));

const passes = [
  { name: "water-about-desktop", path: "/about", width: 1440, height: 900, dpr: 1 },
  { name: "water-about-mobile", path: "/about", width: 390, height: 844, dpr: 2, mobile: true },
  { name: "water-work-desktop", path: "/work", width: 1440, height: 900, dpr: 1 },
  { name: "water-work-mobile", path: "/work", width: 390, height: 844, dpr: 2, mobile: true },
  { name: "water-case-desktop", path: "/work/badante24h", width: 1440, height: 900, dpr: 1 },
  { name: "water-about-reduced", path: "/about", width: 1440, height: 900, dpr: 1, reduce: true },
];

const browser = await chromium.launch();
for (const p of passes) {
  const ctx = await browser.newContext({
    viewport: { width: p.width, height: p.height },
    isMobile: !!p.mobile,
    deviceScaleFactor: p.dpr,
    reducedMotion: p.reduce ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" && isReal(m.text())) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(baseUrl + p.path, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(3200); // preloader + veil fade settled
  await page.screenshot({ path: resolve(outDir, `${p.name}.png`) });

  console.log(`[${p.name}] console errors: ${errors.length}`);
  for (const e of errors) console.log("   - " + e.slice(0, 200));
  await ctx.close();
}
await browser.close();
console.log("done -> .shots/water-*");
