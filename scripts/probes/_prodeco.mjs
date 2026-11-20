// Spot-check prod del round ecosistema: eventi sintetici sul deploy live.
import { chromium } from "playwright";
const BASE = "https://portfolio-jet-eta-24.vercel.app";
// attesa deploy: poll del commit marker (rippleOn compare nel chunk? non ispezionabile facile)
// → poll su tempo: 3 tentativi con l'evento sintetico; se il filter non reagisce, il deploy e' vecchio.
const browser = await chromium.launch({ channel: "chrome", headless: true });
for (let attempt = 0; attempt < 10; attempt++) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    sessionStorage.setItem("at-preloader-seen", "1");
    Object.defineProperty(navigator, "gpu", { get: () => undefined });
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);
  const before = await page.evaluate(() => {
    const bars = [...document.querySelectorAll("div[aria-hidden]")].filter((b) => getComputedStyle(b).position === "fixed" && b.getBoundingClientRect().height <= 4);
    return bars[0] ? getComputedStyle(bars[0]).filter : "NOBAR";
  });
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("submerge", { detail: true })));
  await page.waitForTimeout(950);
  const under = await page.evaluate(() => {
    const bars = [...document.querySelectorAll("div[aria-hidden]")].filter((b) => getComputedStyle(b).position === "fixed" && b.getBoundingClientRect().height <= 4);
    return bars[0] ? getComputedStyle(bars[0]).filter : "NOBAR";
  });
  await ctx.close();
  if (under !== before && under !== "NOBAR") {
    console.log("PROD LIVE — filter reagisce a submerge. pageerrors:", errs.length || "none");
    await browser.close();
    process.exit(0);
  }
  console.log(`attempt ${attempt}: deploy non ancora live (filter invariato), riprovo tra 20s`);
  await new Promise((r) => setTimeout(r, 20000));
}
console.log("TIMEOUT: deploy non verificato");
await browser.close();
process.exit(1);
