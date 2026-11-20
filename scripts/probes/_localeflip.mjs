// SCRATCH — verify: does the EN/IT toggle re-translate the SplitText'd .menu-link buttons?
import { chromium } from "playwright";
import { resolve } from "node:path";
const base = process.env.BASE_URL || "http://localhost:3000";
const out = resolve(process.cwd(), ".shots");
const IGNORE = [/React DevTools/i, /\[Fast Refresh\]/i, /THREE\.Clock/i, /WebGPU/i];
const isReal = (t) => !IGNORE.some((re) => re.test(t));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error" && isReal(m.text())) errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
await page.goto(base, { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(2800); // fonts ready + SplitText done

const readLinks = () =>
  page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("#menu-overlay .menu-link"));
    return {
      lang: document.documentElement.lang,
      texts: links.map((b) => b.textContent.trim().replace(/\s+/g, " ")),
      split: links.map((b) => ({
        firstChildTag: b.firstChild ? (b.firstChild.nodeType === 3 ? "#text" : b.firstChild.tagName) : null,
        lineDivs: b.querySelectorAll(".menu-line").length,
      })),
    };
  });

const toggle = page.locator("header button").filter({ hasText: /^IT|^EN/ }).first();

// ── CASE A: menu NEVER opened, flip EN→IT ─────────────────────────────────────
console.log("A0 (initial, EN):", JSON.stringify(await readLinks()));
await toggle.click();
await page.waitForTimeout(400);
console.log("A1 (after EN→IT, menu never opened):", JSON.stringify(await readLinks()));

// open the menu and look at it
await page.locator('header [aria-controls="menu-overlay"]').first().click();
await page.waitForTimeout(1600);
const openState = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll("#menu-overlay .menu-link"));
  const metas = Array.from(document.querySelectorAll("#menu-overlay .menu-meta"));
  const panel = document.querySelector("#menu-overlay [aria-hidden].hidden") || null;
  return {
    linkTexts: links.map((b) => b.innerText.trim().replace(/\s+/g, " ")),
    lineOpacity: links.map((b) => {
      const l = b.querySelector(".menu-line");
      return l ? +getComputedStyle(l).opacity : null;
    }),
    metaOpacity: metas.map((m) => +getComputedStyle(m).opacity),
    metaVis: metas.map((m) => getComputedStyle(m).visibility),
  };
});
console.log("A2 (menu OPEN after flip):", JSON.stringify(openState));
await page.screenshot({ path: resolve(out, "localeflip-open-it.png") });

// ── CASE B: close, flip back IT→EN with an open/close cycle behind us ─────────
await page.locator('#menu-overlay [aria-controls="menu-overlay"]').first().click();
await page.waitForTimeout(900);
await toggle.click();
await page.waitForTimeout(400);
console.log("B1 (after IT→EN, after an open/close cycle):", JSON.stringify(await readLinks()));

// reopen to see it rendered
await page.locator('header [aria-controls="menu-overlay"]').first().click();
await page.waitForTimeout(1600);
console.log("B2 (menu OPEN again):", JSON.stringify(await page.evaluate(() => ({
  linkTexts: Array.from(document.querySelectorAll("#menu-overlay .menu-link")).map((b) => b.innerText.trim().replace(/\s+/g, " ")),
}))));
await page.screenshot({ path: resolve(out, "localeflip-open-en.png") });

console.log("console errors:", errors.length);
for (const e of errors) console.log("  - " + e);
await browser.close();
