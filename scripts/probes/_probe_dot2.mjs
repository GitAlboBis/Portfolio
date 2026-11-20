import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
  sessionStorage.setItem("at-preloader-seen", "1");
  Object.defineProperty(navigator, "gpu", { get: () => undefined });
});
const page = await ctx.newPage();
await page.goto("http://localhost:3000/work/badante24h", { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(1000);
await page.click("header button");
await page.waitForTimeout(600);
const info = await page.evaluate(() => {
  const els = document.elementsFromPoint(1216, 40);
  return els.slice(0, 8).map((n) => {
    const cs = getComputedStyle(n);
    return `${n.tagName} cls="${(n.className?.toString?.() ?? "").slice(0, 90)}" pe=${cs.pointerEvents} pos=${cs.position} r=${JSON.stringify(n.getBoundingClientRect())}`;
  });
});
console.log(info.join("\n"));
await browser.close();
