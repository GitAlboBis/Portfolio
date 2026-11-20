// first-viewport + fold captures for the fix batch
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const base = process.env.BASE_URL || "http://localhost:3000";
const out = ".shots/wp10-fixed";
await mkdir(out, { recursive: true });
const b = await chromium.launch({ channel: "chrome", headless: true, args: ["--enable-unsafe-webgpu"] });
for (const vp of [
  { n: "desktop", width: 1440, height: 900, dpr: 1, mob: false },
  { n: "mobile", width: 390, height: 844, dpr: 2, mob: true },
]) {
  const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, isMobile: vp.mob, hasTouch: vp.mob });
  await ctx.addInitScript(() => sessionStorage.setItem("at-preloader-seen", "1"));
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "networkidle" });
  await p.waitForTimeout(8000); // past the settle window: the fold shows the LIVE bench
  await p.screenshot({ path: `${out}/fold-${vp.n}.png` });
  await ctx.close();
}
await b.close();
console.log("ok");
