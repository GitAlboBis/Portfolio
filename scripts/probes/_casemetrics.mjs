// One-off: metriche + cut art-direction sugli altri slug.
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
  sessionStorage.setItem("at-preloader-seen", "1");
  Object.defineProperty(navigator, "gpu", { get: () => undefined });
});

// metrics band (badante24h è l'unico con metrics)
{
  const page = await ctx.newPage();
  await page.goto(`${BASE}/work/badante24h`, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    const el = document.querySelector(".sm\\:grid-cols-3");
    const y = el.getBoundingClientRect().top + window.scrollY - 300;
    window.scrollTo(0, y);
  });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: ".shots/case-metrics.png" });
  await page.close();
}

// cut framing per gli altri due slug
for (const slug of ["doit-voice-ai-agent", "agricultural-supply-chain"]) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/work/${slug}`, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1200);
  for (const [i, name] of [[1, "insetcut"], [2, "fullcut"]]) {
    await page.evaluate((idx) => {
      document.querySelectorAll("figure")[idx]?.scrollIntoView({ block: "center" });
    }, i);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `.shots/case-${slug}-${name}.png` });
  }
  await page.close();
}

await browser.close();
console.log("done");
