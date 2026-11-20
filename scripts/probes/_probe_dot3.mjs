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
console.log("BEFORE CLICK:");
console.log(await page.evaluate(() => document.querySelector("header nav > div").outerHTML));
await page.click("header button");
await page.waitForTimeout(600);
console.log("AFTER CLICK:");
console.log(await page.evaluate(() => document.querySelector("header nav > div").outerHTML));
await browser.close();
