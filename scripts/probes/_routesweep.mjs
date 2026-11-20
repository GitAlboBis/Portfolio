// Smoke post-bump dipendenze: tutte le route, console pulita, screenshot.
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const ROUTES = ["/", "/work", "/about", "/work/badante24h", "/styleguide"];

const browser = await chromium.launch({ channel: "chrome", headless: true });
const issues = [];

for (const vp of [
  { name: "desktop", viewport: { width: 1440, height: 900 } },
  { name: "mobile", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
]) {
  const ctx = await browser.newContext(vp);
  await ctx.addInitScript(() => {
    sessionStorage.setItem("at-preloader-seen", "1");
    Object.defineProperty(navigator, "gpu", { get: () => undefined });
  });
  for (const route of ROUTES) {
    const page = await ctx.newPage();
    const local = [];
    page.on("console", (m) => {
      if (m.type() === "error" || m.type() === "warning") local.push(`[${m.type()}] ${m.text()}`);
    });
    page.on("pageerror", (e) => local.push(`[pageerror] ${e.message}`));
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 }).catch((e) => local.push(`[nav] ${e.message}`));
    await page.waitForTimeout(1200);
    // scroll to bottom to mount lazy sections (retry once — dev HMR can destroy the context)
    for (let i = 0; i < 2; i++) {
      try {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        break;
      } catch {
        await page.waitForTimeout(1500);
      }
    }
    await page.waitForTimeout(1500);
    const slug = route.replaceAll("/", "_") || "_home";
    await page.screenshot({ path: `.shots/sweep-${vp.name}${slug}.png` });
    const relevant = local.filter(
      (e) =>
        !e.includes("Download the React DevTools") &&
        !e.includes("THREE.Clock") &&
        !e.includes("[Fast Refresh]") &&
        !e.includes("Image with src") // next/image advisory
    );
    if (relevant.length) issues.push({ vp: vp.name, route, relevant });
    await page.close();
  }
  await ctx.close();
}

await browser.close();
console.log(issues.length ? JSON.stringify(issues, null, 2) : "ALL ROUTES CLEAN");
