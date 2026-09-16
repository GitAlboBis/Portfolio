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
await page.goto(BASE + "/work/badante24h", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1500);
if ((await page.title()).includes("Checkpoint") || (await page.content()).includes("Security Checkpoint")) {
  console.log("VERCEL CHECKPOINT — spot-check bloccato"); process.exit(2);
}
await page.evaluate(() => document.querySelectorAll("figure")[2]?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(1200);
await page.screenshot({ path: ".shots/prod-case-cut.png" });
const checks = await page.evaluate(() => ({
  figures: document.querySelectorAll("figure").length,
  caps: [...document.querySelectorAll("figcaption")].map((c) => c.textContent.trim()),
}));
console.log("case:", JSON.stringify(checks));

// home gallery: metà runway (piano 2 a fuoco + titolo ember)
await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const sec = document.querySelector("#works");
  const r = sec.getBoundingClientRect();
  window.scrollTo(0, r.top + window.scrollY + (r.height - innerHeight) * 0.3);
});
await page.waitForTimeout(2200);
await page.screenshot({ path: ".shots/prod-dof.png" });
console.log("pageerrors:", errs.length ? errs : "none");
await browser.close();
