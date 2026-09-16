// QA probe — IL MENU-PORTALE (desktop trigger + route previews).
// Pattern: Chrome reale headless (dxil), no-WebGPU (probe UI), preloader skippato.
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SHOT = (n) => `.shots/menuportal-${n}.png`;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];

async function makePage(ctx) {
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") errors.push(`[${m.type()}] ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
  return page;
}

const initScript = () => {
  sessionStorage.setItem("at-preloader-seen", "1");
  Object.defineProperty(navigator, "gpu", { get: () => undefined });
};

// ── desktop ────────────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(initScript);
  const page = await makePage(ctx);
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  // the pill toggle must exist on desktop now
  const toggle = page.locator("header [aria-controls='menu-overlay']");
  const toggleCount = await toggle.count();
  console.log("desktop pill toggle count:", toggleCount);
  await toggle.first().click();
  await page.waitForTimeout(1100);
  await page.screenshot({ path: SHOT("desktop-open") });

  // resting caption
  const caption = await page.locator(".menu-preview[data-preview='home'] figcaption").innerText().catch(() => "(none)");
  console.log("resting caption:", caption.trim());

  // hover About → Masua scrap
  await page.hover(".menu-link >> nth=0");
  await page.waitForTimeout(700);
  await page.screenshot({ path: SHOT("desktop-about") });
  const aboutOp = await page.$eval(".menu-preview[data-preview='about']", (el) => getComputedStyle(el).opacity);
  console.log("about scrap opacity after hover:", aboutOp);

  // hover Works
  await page.hover(".menu-link >> nth=1");
  await page.waitForTimeout(700);
  await page.screenshot({ path: SHOT("desktop-works") });

  // hover Contact (night)
  await page.hover(".menu-link >> nth=2");
  await page.waitForTimeout(700);
  await page.screenshot({ path: SHOT("desktop-contact") });

  // leave the nav → back to resting scrap
  await page.mouse.move(1200, 450);
  await page.waitForTimeout(700);
  const homeOp = await page.$eval(".menu-preview[data-preview='home']", (el) => getComputedStyle(el).opacity);
  console.log("home scrap opacity after leave:", homeOp);

  // parallax sanity: transform changes with pointer
  const t1 = await page.$eval(".menu-preview", (el) => getComputedStyle(el.closest("[class*='aspect-']")).transform);
  await page.mouse.move(200, 200);
  await page.waitForTimeout(500);
  const t2 = await page.$eval(".menu-preview", (el) => getComputedStyle(el.closest("[class*='aspect-']")).transform);
  console.log("parallax transform moved:", t1 !== t2, "|", t1, "→", t2);

  // Esc closes, focus returns (reverse at 1.35× of a ~1.5s timeline ≈ 1.15s)
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1500);
  const overlayOp = await page.$eval("#menu-overlay", (el) => getComputedStyle(el).opacity);
  console.log("overlay opacity after Esc:", overlayOp);
  await page.screenshot({ path: SHOT("desktop-closed") });
  await ctx.close();
}

// ── mobile (panel hidden, menu still perfect) ─────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(initScript);
  const page = await makePage(ctx);
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.locator("header [aria-controls='menu-overlay']").first().click();
  await page.waitForTimeout(1100);
  const panelVisible = await page.$eval("#menu-overlay [aria-hidden]", () => true).catch(() => false);
  const panelDisplay = await page
    .$eval(".menu-preview", (el) => getComputedStyle(el.closest(".hidden, .lg\\:flex") ?? el).display)
    .catch(() => "(not mounted)");
  console.log("mobile panel display:", panelDisplay, "| panel in dom:", panelVisible);
  await page.screenshot({ path: SHOT("mobile-open") });
  await ctx.close();
}

// ── reduced motion (static panel, instant swaps) ──────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await ctx.addInitScript(initScript);
  const page = await makePage(ctx);
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.locator("header [aria-controls='menu-overlay']").first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: SHOT("reduced-open") });
  const homeOp = await page.$eval(".menu-preview[data-preview='home']", (el) => getComputedStyle(el).opacity).catch(() => "(none)");
  console.log("reduced: home scrap opacity:", homeOp);
  await ctx.close();
}

await browser.close();

const relevant = errors.filter(
  (e) => !e.includes("Download the React DevTools") && !e.includes("THREE.Clock") && !e.includes("[Fast Refresh]"),
);
console.log("\nconsole issues:", relevant.length ? relevant : "CLEAN");
