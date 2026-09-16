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
await page.waitForTimeout(300);
await page.click("header button");
await page.waitForTimeout(600);
const info = await page.evaluate(() => {
  const el = document.elementFromPoint(1216, 40);
  const chain = [];
  let n = el;
  while (n && chain.length < 5) { chain.push(`${n.tagName}.${n.className?.toString?.().slice(0,80)}`); n = n.parentElement; }
  const btn = document.querySelector("header button");
  const cs = getComputedStyle(btn);
  return { chain, focused: document.activeElement?.tagName + "." + document.activeElement?.className?.toString?.().slice(0,60), btnOutline: cs.outline, matchesFV: btn.matches(":focus-visible") };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: ".shots/dot-zoom.png", clip: { x: 1150, y: 10, width: 250, height: 60 } });
await browser.close();
