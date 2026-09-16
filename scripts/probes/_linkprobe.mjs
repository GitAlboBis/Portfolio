import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
  sessionStorage.setItem("at-preloader-seen", "1");
  Object.defineProperty(navigator, "gpu", { get: () => undefined });
});
const page = await ctx.newPage();
await page.goto("http://localhost:3000/work", { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(2500);
const links = await page.evaluate(() =>
  [...document.querySelectorAll("link[rel=preload]")].map((l) => ({ href: l.getAttribute("href"), as: l.getAttribute("as"), by: l.getAttribute("data-nimg") ?? "unknown" }))
);
console.log(JSON.stringify(links, null, 2));
await browser.close();
