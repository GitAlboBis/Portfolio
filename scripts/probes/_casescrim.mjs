// Verifica scrim header sopra la foto + flip IT (captions "Dettaglio").
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
  sessionStorage.setItem("at-preloader-seen", "1");
  Object.defineProperty(navigator, "gpu", { get: () => undefined });
});
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") errors.push(`[${m.type()}] ${m.text()}`);
});
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));

await page.goto(`${BASE}/work/badante24h`, { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(1200);

// scroll: la foto full-bleed (cut 02) riempie il viewport → header sopra la foto
await page.evaluate(() => document.querySelectorAll("figure")[2]?.scrollIntoView({ block: "start" }));
await page.waitForTimeout(1200);
await page.screenshot({ path: ".shots/case-scrim-photo.png" });

// flip IT dal toggle nel header
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);
await page.click("header button");
await page.waitForTimeout(900);
const it = await page.evaluate(() => ({
  captions: [...document.querySelectorAll("figcaption")].map((c) => c.textContent.trim()),
  chapter: document.querySelectorAll(".t-eyebrow")[1]?.textContent.trim(),
  toggle: document.querySelector("header button")?.textContent.trim(),
}));
await page.screenshot({ path: ".shots/case-it-intro.png" });

// flip back + night band (header sopra il night)
await page.click("header button");
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1000);
await page.screenshot({ path: ".shots/case-scrim-night.png" });

await browser.close();
console.log(JSON.stringify(it, null, 2));
const relevant = errors.filter(
  (e) => !e.includes("Download the React DevTools") && !e.includes("[Fast Refresh]"),
);
console.log(relevant.length ? "CONSOLE:\n" + relevant.join("\n") : "console clean");
