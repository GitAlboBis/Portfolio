// QA probe — WORKS GALLERY DoF (rack focus sul fly-through home).
// Scrubba la sezione #works a step e screenshotta: piano a fuoco (sharp),
// mid-transition (entrambi defocused), piano successivo a fuoco. Console
// pulita = anche zero errori di compilazione shader (three li logga li').
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
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
  const page = await ctx.newPage();
  const local = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") local.push(`[${m.type()}] ${m.text()}`);
  });
  page.on("pageerror", (e) => local.push(`[pageerror] ${e.message}`));

  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);

  // geometry della sezione works (n+1 * 100vh; progress 0..1 sul runway)
  const geo = await page.evaluate(() => {
    const sec = document.querySelector("#works");
    if (!sec) return null;
    const r = sec.getBoundingClientRect();
    return { top: r.top + window.scrollY, height: r.height, vh: window.innerHeight };
  });
  if (!geo) {
    issues.push({ vp: vp.name, err: "#works non trovata" });
    await ctx.close();
    continue;
  }

  // step di progress: 0 = primo piano a fuoco, .5 mid, 1 ultimo
  const steps = [0.02, 0.14, 0.3, 0.5, 0.75, 0.95];
  for (const p of steps) {
    const y = geo.top + (geo.height - geo.vh) * p;
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(1600); // lascia assestare camera lerp + canvas mount
    await page.screenshot({ path: `.shots/dof-${vp.name}-p${String(p).replace(".", "_")}.png` });
  }

  const relevant = local.filter(
    (e) =>
      !e.includes("Download the React DevTools") &&
      !e.includes("THREE.Clock") &&
      !e.includes("[Fast Refresh]"),
  );
  if (relevant.length) issues.push({ vp: vp.name, console: relevant });
  await ctx.close();
}

await browser.close();
console.log(issues.length ? "ISSUES:\n" + JSON.stringify(issues, null, 2) : "ALL PASS");
