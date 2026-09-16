// SCRATCH debug for the HeroCopy scroll-out scrub. NOT committed.
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL || "http://localhost:3001";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => {
  Object.defineProperty(Object.getPrototypeOf(navigator), "gpu", { get: () => undefined });
});
await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(3400);

const probe = () =>
  page.evaluate(() => {
    const root = document.querySelector("#hero .absolute.inset-x-0.bottom-0")
      || document.querySelector("#hero h1")?.closest("[class*='pointer-events-none']");
    const st = window.__heroOutST;
    return {
      scrollY: Math.round(window.scrollY),
      lenis: window.__lenis ? Math.round(window.__lenis.scroll ?? -1) : null,
      opacity: root ? getComputedStyle(root).opacity : "n/a",
      st: st ? { start: st.start, end: st.end, progress: +st.progress.toFixed(3) } : "unset",
      heroTop: document.querySelector("#hero")?.getBoundingClientRect().top,
      heroH: document.querySelector("#hero")?.getBoundingClientRect().height,
      doc: document.documentElement.scrollHeight,
    };
  });

console.log("before:", JSON.stringify(await probe()));

await page.evaluate(() => {
  const l = window.__lenis;
  if (l?.scrollTo) l.scrollTo(540, { immediate: true });
  else window.scrollTo(0, 540);
});
for (const ms of [300, 900, 1800]) {
  await page.waitForTimeout(ms);
  console.log(`after+${ms}:`, JSON.stringify(await probe()));
}
await browser.close();
