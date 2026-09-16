// QA round 2 — regressioni della review avversariale (parallasse post-reopen,
// flip EN/IT, reopen rapido, mobile zero-download, console pulita).
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
const warns = [];

const initScript = () => {
  sessionStorage.setItem("at-preloader-seen", "1");
  Object.defineProperty(navigator, "gpu", { get: () => undefined });
};

// ── desktop: reopen/parallax/locale/quick-reopen ──────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(initScript);
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
    if (m.type() === "warning") warns.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const toggle = page.locator("header [aria-controls='menu-overlay']").first();
  const scrapT = () => page.$eval("[data-portal] > div", (el) => getComputedStyle(el).transform);

  // open #1 → parallax works → close
  await toggle.click();
  await page.waitForTimeout(1200);
  await page.mouse.move(300, 250);
  await page.waitForTimeout(450);
  const a1 = await scrapT();
  await page.mouse.move(1150, 720);
  await page.waitForTimeout(550);
  const a2 = await scrapT();
  console.log("parallax on open#1:", a1 !== a2 ? "ALIVE" : "DEAD");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1400);

  // open #2 → parallax MUST still work (quickTo-death regression)
  await toggle.click();
  await page.waitForTimeout(1200);
  await page.mouse.move(320, 260);
  await page.waitForTimeout(450);
  const b1 = await scrapT();
  await page.mouse.move(1180, 700);
  await page.waitForTimeout(550);
  const b2 = await scrapT();
  console.log("parallax on open#2 (post-close):", b1 !== b2 ? "ALIVE" : "DEAD");
  const eligWarns = warns.filter((w) => w.includes("not eligible"));
  console.log("quickTo 'not eligible' warnings:", eligWarns.length);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1400);

  // locale flip (menu closed) → reopen → IT labels + panel visible + caption IT
  await page.locator("header nav >> text=IT").first().click();
  await page.waitForTimeout(600);
  await toggle.click();
  await page.waitForTimeout(1300);
  const firstLabel = (await page.locator(".menu-link").first().innerText()).trim();
  const panelOp = await page.$eval("[data-portal]", (el) => getComputedStyle(el).opacity);
  const capIT = (await page.locator(".menu-preview[data-preview='home'] figcaption").innerText()).trim();
  console.log(`post-locale-flip: first link="${firstLabel}" (exp. Chi sono) | panel opacity=${panelOp} | caption="${capIT}"`);
  await page.screenshot({ path: ".shots/menuportal2-locale-it.png" });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // quick reopen mid-reverse: no stuck stale preview
  await toggle.click();
  await page.waitForTimeout(1300);
  await page.hover(".menu-link >> nth=1"); // works
  await page.waitForTimeout(600);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200); // mid-reverse
  await toggle.click();
  await page.waitForTimeout(1400);
  const ops = await page.$$eval(".menu-preview", (els) =>
    els.map((e) => `${e.dataset.preview}:${(+getComputedStyle(e).opacity).toFixed(2)}`),
  );
  console.log("quick-reopen figure opacities (exp. home:1, rest:0):", ops.join(" "));
  await ctx.close();
}

// ── mobile: opening the menu mounts NO preview figures ────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(initScript);
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.locator("header [aria-controls='menu-overlay']").first().click();
  await page.waitForTimeout(1200);
  const figs = await page.$$eval(".menu-preview", (els) => els.length);
  console.log("mobile figures mounted after open (exp. 0):", figs);
  await ctx.close();
}

await browser.close();
const relevant = errors.filter((e) => !e.includes("Download the React DevTools") && !e.includes("THREE.Clock"));
console.log("console errors:", relevant.length ? relevant : "CLEAN");
