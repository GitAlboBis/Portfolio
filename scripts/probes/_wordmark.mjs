// SCRATCH visual gate for the Footer wordmark (FlipText). NOT committed.
//   node _wordmark.mjs [label]
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const label = process.argv[2] || "wordmark";
const baseUrl = process.env.BASE_URL || "http://localhost:3001";
const outDir = resolve(process.cwd(), ".shots");
await mkdir(outDir, { recursive: true });

const IGNORE = [/Download the React DevTools/i, /\[Fast Refresh\]/i, /THREE\.Clock/i, /WebGPU/i];
const isReal = (t) => !IGNORE.some((re) => re.test(t));

const scenarios = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tall", width: 1920, height: 1200 }, // document-end clamp regression (TideSurge lesson)
  { name: "mobile", width: 390, height: 844, isMobile: true, dpr: 2 },
  { name: "reduced", width: 1440, height: 900, reduce: true },
];

const browser = await chromium.launch();
let fail = 0;
for (const s of scenarios) {
  const ctx = await browser.newContext({
    viewport: { width: s.width, height: s.height },
    isMobile: !!s.isMobile,
    deviceScaleFactor: s.dpr || 1,
    reducedMotion: s.reduce ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(Object.getPrototypeOf(navigator), "gpu", { get: () => undefined });
  });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" && isReal(m.text())) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2600);
  await page.evaluate(() => {
    const l = window.__lenis;
    const max = document.documentElement.scrollHeight;
    if (l?.scrollTo) l.scrollTo(max, { immediate: true });
    else window.scrollTo(0, max);
  });
  await page.waitForTimeout(2200); // entrance ~0.8s + stagger ~0.35s + margin

  const state = await page.evaluate(() => {
    const wm = document.querySelector("footer p .flip-word");
    const host = document.querySelector("footer p");
    if (!host) return { host: "missing" };
    if (!wm) return { host: "unsplit", visible: getComputedStyle(host).visibility };
    const chars = [...document.querySelectorAll("footer .flip-word > div, footer .flip-word > span")]
      .filter((c) => c.getAttribute("style"));
    const bad = chars.filter((c) => {
      const cs = getComputedStyle(c);
      return cs.opacity !== "1" || (cs.transform !== "none" && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(cs.transform));
    });
    const doc = document.documentElement;
    return {
      host: "split",
      charCount: chars.length,
      stuck: bad.length,
      hScroll: doc.scrollWidth > doc.clientWidth ? `${doc.scrollWidth}>${doc.clientWidth}` : "none",
    };
  });

  await page.screenshot({ path: resolve(outDir, `${label}-${s.name}.png`) });
  const bad = errors.length > 0 || state.stuck > 0 || state.host === "missing" || (state.hScroll && state.hScroll !== "none");
  if (bad) fail++;
  console.log(`[${s.name}] ${JSON.stringify(state)} console errors=${errors.length}${bad ? "  <-- CHECK" : ""}`);
  errors.forEach((e) => console.log("   - " + e));
  await ctx.close();
}
await browser.close();
console.log(fail ? `FAIL ${fail}` : "ALL PASS", `-> .shots/${label}-*`);
