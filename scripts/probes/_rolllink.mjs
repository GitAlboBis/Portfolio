// SCRATCH visual gate for RollLink + .link. NOT committed.
//   node _rolllink.mjs [label]
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const label = process.argv[2] || "roll";
const baseUrl = process.env.BASE_URL || "http://localhost:3001";
const outDir = resolve(process.cwd(), ".shots");
await mkdir(outDir, { recursive: true });

const IGNORE = [/Download the React DevTools/i, /\[Fast Refresh\]/i, /THREE\.Clock/i, /WebGPU/i];
const isReal = (t) => !IGNORE.some((re) => re.test(t));

const clampClip = (c, W = 1440, H = 900) => {
  const x = Math.max(0, Math.min(c.x, W - 10));
  const y = Math.max(0, Math.min(c.y, H - 10));
  return { x, y, width: Math.min(c.width, W - x), height: Math.min(c.height, H - y) };
};
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => {
  Object.defineProperty(Object.getPrototypeOf(navigator), "gpu", { get: () => undefined });
});
const errors = [];
page.on("console", (m) => { if (m.type() === "error" && isReal(m.text())) errors.push(`[home] ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

// ── home: nav link hover (mid-roll) ──────────────────────────────────────────
await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
await page.waitForTimeout(3000);
const navLink = page.locator("nav[aria-label='Primary'] button", { hasText: /about/i }).first();
await navLink.hover();
await page.waitForTimeout(160); // mid-roll
await page.screenshot({ path: resolve(outDir, `${label}-nav-midroll.png`), clip: clampClip({ x: 380, y: 0, width: 700, height: 80 }) });
await page.waitForTimeout(500); // settled
await page.screenshot({ path: resolve(outDir, `${label}-nav-settled.png`), clip: clampClip({ x: 380, y: 0, width: 700, height: 80 }) });

// ── home: About journey link ─────────────────────────────────────────────────
await page.evaluate(() => window.__lenis?.scrollTo(document.querySelector("#about"), { immediate: true }));
await page.waitForTimeout(1200);
const journey = page.locator("#about a[href='/about']");
const jb = await journey.boundingBox();
await journey.hover();
await page.waitForTimeout(600);
if (jb) await page.screenshot({ path: resolve(outDir, `${label}-about-link.png`), clip: clampClip({ x: jb.x - 30, y: jb.y - 30, width: 420, height: 110 }) });

// ── home: footer links ───────────────────────────────────────────────────────
await page.evaluate(() => window.__lenis?.scrollTo(document.documentElement.scrollHeight, { immediate: true }));
await page.waitForTimeout(1400);
const email = page.locator("footer a[href^='mailto']");
const eb = await email.boundingBox();
await email.hover();
await page.waitForTimeout(600);
if (eb) await page.screenshot({ path: resolve(outDir, `${label}-footer-links.png`), clip: clampClip({ x: eb.x - 60, y: eb.y - 40, width: 500, height: 120 }) });

// baseline shift check: rolled label should sit on the same line as its arrow
const metrics = await page.evaluate(() => {
  const el = document.querySelector("footer button [data-roll-row]");
  const btn = document.querySelector("footer button");
  if (!el || !btn) return "missing";
  const r1 = el.getBoundingClientRect();
  const r2 = btn.getBoundingClientRect();
  return { rowH: Math.round(r1.height), btnH: Math.round(r2.height) };
});

// ── /work/badante24h: .link hover ────────────────────────────────────────────
const page2 = await ctx.newPage();
await page2.addInitScript(() => {
  Object.defineProperty(Object.getPrototypeOf(navigator), "gpu", { get: () => undefined });
});
page2.on("console", (m) => { if (m.type() === "error" && isReal(m.text())) errors.push(`[case] ${m.text()}`); });
page2.on("pageerror", (e) => errors.push(`[case] pageerror: ${e.message}`));
await page2.goto(`${baseUrl}/work/badante24h`, { waitUntil: "domcontentloaded", timeout: 45000 });
await page2.waitForTimeout(2500);
await page2.evaluate(() => window.__lenis?.scrollTo(document.documentElement.scrollHeight, { immediate: true }));
await page2.waitForTimeout(1200);
const closing = page2.locator("section.night a[href='/#contact']");
const cb = await closing.boundingBox();
await closing.hover();
await page2.waitForTimeout(600);
await page2.screenshot({ path: resolve(outDir, `${label}-case-closing.png`) }); void cb;

// ── /about + /work console sweep ─────────────────────────────────────────────
for (const path of ["/about", "/work"]) {
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    Object.defineProperty(Object.getPrototypeOf(navigator), "gpu", { get: () => undefined });
  });
  p.on("console", (m) => { if (m.type() === "error" && isReal(m.text())) errors.push(`[${path}] ${m.text()}`); });
  p.on("pageerror", (e) => errors.push(`[${path}] pageerror: ${e.message}`));
  await p.goto(baseUrl + path, { waitUntil: "domcontentloaded", timeout: 45000 });
  await p.waitForTimeout(2200);
  await p.close();
}

console.log(`footer roll metrics: ${JSON.stringify(metrics)}`);
console.log(`console errors: ${errors.length}`);
errors.forEach((e) => console.log("  - " + e));
await browser.close();
console.log(errors.length ? "FAIL" : "ALL PASS", `-> .shots/${label}-*`);
