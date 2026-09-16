// SCRATCH visual gate for HeroCopy ("Hero Ink"). NOT committed.
// Scenarios: desktop EN top / desktop scrolled (copy dissolved) / mobile EN /
// desktop IT / desktop reduced-motion. Console errors reported per scenario.
//   node _heroink.mjs <label>
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const label = process.argv[2] || "heroink";
const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const outDir = resolve(process.cwd(), ".shots");
await mkdir(outDir, { recursive: true });

const IGNORE = [/Download the React DevTools/i, /\[Fast Refresh\]/i, /THREE\.Clock/i, /WebGPU/i];
const isReal = (t) => !IGNORE.some((re) => re.test(t));

const scenarios = [
  { name: "desktop-en", width: 1440, height: 900 },
  { name: "desktop-scrolled", width: 1440, height: 900, scrollTo: 0.6 },
  { name: "mobile-en", width: 390, height: 844, isMobile: true, dpr: 3 },
  { name: "desktop-it", width: 1440, height: 900, locale: "it" },
  { name: "desktop-reduced", width: 1440, height: 900, reduce: true },
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
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" && isReal(m.text())) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

  // Headless WebGPU = SwiftShader software rendering — the MLS-MPM sim makes
  // frames take seconds and page.screenshot times out. Force the CSS-gradient
  // fallback here (the copy is what this gate checks); the live fluid gets
  // eyeballed in real Chrome via claude-in-chrome.
  await page.addInitScript(() => {
    Object.defineProperty(Object.getPrototypeOf(navigator), "gpu", { get: () => undefined });
  });

  if (s.locale) {
    await page.addInitScript((loc) => {
      localStorage.setItem("ocean-ui", JSON.stringify({ state: { locale: loc, soundEnabled: false }, version: 0 }));
    }, s.locale);
  }

  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(3400); // preloader + entrance settle

  if (s.scrollTo) {
    await page.evaluate((f) => {
      const l = window.__lenis;
      const y = window.innerHeight * f;
      if (l?.scrollTo) l.scrollTo(y, { immediate: true });
      else window.scrollTo(0, y);
    }, s.scrollTo);
    await page.waitForTimeout(900);
  }

  // sanity: h1 present exactly once, hero copy visible (except scrolled)
  const h1Count = await page.locator("h1").count();
  const heroVisible = await page.evaluate(() => {
    const el = document.querySelector("#hero h1");
    if (!el) return "missing";
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el.closest("[class*='absolute']") || el);
    return `rect=${Math.round(r.top)},${Math.round(r.height)} opacity(root)=${cs.opacity}`;
  });
  // the split line INNERS must have settled to identity (entrance completed) —
  // measuring only the parents once hid a frozen entrance.
  const linesSettled = await page.evaluate(() => {
    const parents = [...document.querySelectorAll("#hero [data-hero-line]")];
    if (!parents.length) return "none";
    return parents
      .map((p) => {
        const inner = p.firstElementChild?.firstElementChild; // mask > line
        if (!inner) return "unsplit"; // reduced-motion: no split at all = fine
        const m = getComputedStyle(inner).transform;
        return m === "none" || /matrix\(1, 0, 0, 1, 0, 0\)/.test(m) ? "ok" : `stuck(${m})`;
      })
      .join(",");
  });

  await page.screenshot({ path: resolve(outDir, `${label}-${s.name}.png`) });
  const stuck = !s.scrollTo && /stuck/.test(linesSettled);
  const bad = errors.length > 0 || h1Count !== 1 || stuck;
  if (bad) fail++;
  console.log(`[${s.name}] h1=${h1Count} hero(${heroVisible}) lines=${linesSettled} console errors=${errors.length}${bad ? "  <-- CHECK" : ""}`);
  for (const e of errors) console.log("   - " + e);
  await ctx.close();
}
await browser.close();
console.log(fail ? `FAIL ${fail} scenario(s)` : "ALL PASS");
console.log(`shots -> .shots/${label}-*`);
