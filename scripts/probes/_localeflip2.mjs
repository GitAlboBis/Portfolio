// SCRATCH — instrumented: does React touch the split .menu-link DOM on locale flip?
import { chromium } from "playwright";
const base = process.env.BASE_URL || "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
await page.goto(base, { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(2800);

// open once to mount the preview figcaptions (warm), then close
await page.locator('header [aria-controls="menu-overlay"]').first().click();
await page.waitForTimeout(1600);
await page.locator('#menu-overlay [aria-controls="menu-overlay"]').first().click();
await page.waitForTimeout(1100);

// instrument BEFORE the flip
await page.evaluate(() => {
  const nav = document.querySelector('#menu-overlay nav');
  window.__muts = [];
  window.__mo = new MutationObserver((recs) => {
    for (const r of recs)
      window.__muts.push({
        type: r.type,
        target: r.target.nodeType === 3 ? "#text(" + r.target.nodeValue.slice(0, 20) + ")" : r.target.tagName + "." + (r.target.className || "").toString().slice(0, 30),
        added: r.addedNodes.length,
        removed: r.removedNodes.length,
      });
  });
  window.__mo.observe(nav, { subtree: true, childList: true, characterData: true });
  const line = document.querySelector('#menu-overlay .menu-line');
  window.__oldLine = line;
  line.dataset.oldsplit = "1";
});

// flip EN → IT
await page.locator("header button").filter({ hasText: /^IT|^EN/ }).first().click();
await page.waitForTimeout(600);

const report = await page.evaluate(() => ({
  lang: document.documentElement.lang,
  figcaptions: Array.from(document.querySelectorAll("#menu-overlay figcaption")).map((f) => f.textContent.trim()),
  navToggleSr: document.querySelector("header .sr-only")?.textContent.trim(),
  linkTexts: Array.from(document.querySelectorAll("#menu-overlay .menu-link")).map((b) => b.textContent.trim()),
  firstLinkHTML: document.querySelector("#menu-overlay .menu-link").outerHTML.slice(0, 400),
  oldLineStillInDOM: document.contains(window.__oldLine),
  lineCount: document.querySelectorAll("#menu-overlay .menu-line").length,
  mutations: window.__muts,
}));
console.log(JSON.stringify(report, null, 2));
console.log("console errors:", errors.length);
for (const e of errors) console.log("  - " + e);
await browser.close();
