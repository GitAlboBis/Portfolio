// SCRATCH visual gate for the DualWaveText entrance on /about. NOT committed.
// Captures timed frames of the wave entrance (desktop + mobile) plus a
// prefers-reduced-motion pass, and reports real console errors.
//   node wave_shots.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const outDir = resolve(process.cwd(), ".shots");
await mkdir(outDir, { recursive: true });

const IGNORE = [/Download the React DevTools/i, /\[Fast Refresh\]/i, /THREE\.Clock/i, /WebGPU/i];
const isReal = (t) => !IGNORE.some((re) => re.test(t));

const passes = [
  { name: "wave-desktop", width: 1440, height: 900, isMobile: false, dpr: 1, reduce: false },
  { name: "wave-mobile", width: 390, height: 844, isMobile: true, dpr: 2, reduce: false },
  { name: "wave-desktop-reduced", width: 1440, height: 900, isMobile: false, dpr: 1, reduce: true },
];

const browser = await chromium.launch();
for (const p of passes) {
  const ctx = await browser.newContext({
    viewport: { width: p.width, height: p.height },
    isMobile: p.isMobile,
    deviceScaleFactor: p.dpr,
    reducedMotion: p.reduce ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" && isReal(m.text())) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(baseUrl + "/about", { waitUntil: "domcontentloaded", timeout: 45000 });

  if (p.reduce) {
    // reduced motion: no wave — text must be plainly visible right after the preloader fade
    await page.waitForTimeout(1500);
    await page.screenshot({ path: resolve(outDir, `${p.name}.png`) });
  } else {
    // preloader ~1.3s + delay 0.5 -> wave runs ~1.8s..3.6s: sample frames through it
    await page.waitForTimeout(1600);
    for (let i = 0; i < 6; i++) {
      await page.screenshot({ path: resolve(outDir, `${p.name}-t${i}.png`) });
      await page.waitForTimeout(320);
    }
    await page.waitForTimeout(1400);
    await page.screenshot({ path: resolve(outDir, `${p.name}-settled.png`) });
  }

  console.log(`[${p.name}] console errors: ${errors.length}`);
  for (const e of errors) console.log("   - " + e);
  await ctx.close();
}
await browser.close();
console.log("done -> .shots/wave-*");
