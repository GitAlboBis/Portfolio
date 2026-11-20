// QA — warm-up progressivo: i byte del film arrivano PRIMA dello scroll.
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
  sessionStorage.setItem("at-preloader-seen", "1");
  Object.defineProperty(navigator, "gpu", { get: () => undefined });
});
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(BASE, { waitUntil: "load" });

// 1. the warm queue drains without any scroll
let warm = null;
for (let i = 0; i < 120; i++) {
  warm = await page.evaluate(() => window.__warm ?? null);
  if (warm && warm.done.length > 0 && warm.queued.length === 0 && !warm.running) break;
  await page.waitForTimeout(1000);
}
console.log("warm state:", JSON.stringify(warm));

// 2. film bytes are in cache BEFORE the scroll reaches the band
const pre = await page.evaluate(() =>
  performance.getEntriesByType("resource").filter((e) => e.name.includes("/coast/")).map((e) => ({
    name: e.name.split("/").pop(),
    transfer: e.transferSize,
  })),
);
console.log("coast resources fetched pre-scroll:", JSON.stringify(pre));

// 3. reaching LA COSTA: the <video> is ready almost instantly
await page.evaluate(() => {
  const v = [...document.querySelectorAll("section")].find((s) => s.querySelector("[data-film-reveal]"));
  if (v) window.scrollTo(0, v.offsetTop - 400);
});
await page.waitForTimeout(400); // IO margin is 900px — src attaches now
const t0 = Date.now();
let ready = -1;
for (let i = 0; i < 20; i++) {
  ready = await page.evaluate(() => {
    const v = document.querySelector("video[poster*='coast-poster']");
    return v ? v.readyState : -1;
  });
  if (ready >= 3) break;
  await page.waitForTimeout(150);
}
console.log(`coast video readyState=${ready} after ${Date.now() - t0}ms from approach`);

console.log("console errors:", errors.length ? errors : "CLEAN");
await browser.close();
