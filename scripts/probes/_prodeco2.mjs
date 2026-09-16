import { chromium } from "playwright";
const BASE = "https://portfolio-jet-eta-24.vercel.app";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
  sessionStorage.setItem("at-preloader-seen", "1");
  Object.defineProperty(navigator, "gpu", { get: () => undefined });
});
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1800);
const f = () =>
  page.evaluate(() => {
    const bars = [...document.querySelectorAll('div[aria-hidden][style*="clip-path"]')].filter(
      (b) => getComputedStyle(b).position === "fixed" && b.getBoundingClientRect().height <= 4,
    );
    return bars[0] ? getComputedStyle(bars[0]).filter.slice(0, 200) : "NOBAR";
  });
const before = await f();
await page.evaluate(() => window.dispatchEvent(new CustomEvent("submerge", { detail: true })));
await page.waitForTimeout(950);
const under = await f();
await page.evaluate(() => window.dispatchEvent(new CustomEvent("surface-break")));
await page.waitForTimeout(250);
const flare = await f();
// wordmark ripple in fondo pagina
await page.evaluate(() => document.querySelector("footer")?.scrollIntoView({ block: "end" }));
await page.waitForTimeout(2500);
await page.evaluate(() => window.dispatchEvent(new CustomEvent("tide-touch")));
await page.waitForTimeout(320);
const moved = await page.evaluate(() => {
  const chars = [...document.querySelectorAll("footer .flip-word *")].filter((n) => n.childElementCount === 0);
  return chars.filter((ch) => {
    const m = getComputedStyle(ch).transform.match(/matrix\(([^)]+)\)/);
    return m && Math.abs(parseFloat(m[1].split(",")[5])) > 1;
  }).length;
});
await page.screenshot({ path: ".shots/prod-eco-ripple.png" });
console.log(JSON.stringify({ underChanged: under !== before, flareChanged: flare !== under, rippleMoved: moved, pageerrors: errs.length ? errs : "none" }));
await browser.close();
