// SCRATCH: is the .nightfall-* CSS in the served stylesheet?
import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
const info = await page.evaluate(() => {
  const hits = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    const walk = (list) => {
      for (const r of list) {
        if (r.cssText?.includes("nightfall")) hits.push(r.cssText.slice(0, 160));
        if (r.cssRules) walk(r.cssRules);
      }
    };
    walk(rules);
  }
  const card = document.querySelector(".nightfall-card");
  const cover = document.getElementById("nightfall");
  return {
    ruleCount: hits.length,
    sample: hits.slice(0, 6),
    cardPos: card ? getComputedStyle(card).position : "?",
    cardTopVar: card ? getComputedStyle(card).getPropertyValue("--nf-top") : "?",
    cardTop: card ? getComputedStyle(card).top : "?",
    coverMargin: cover ? getComputedStyle(cover).marginTop : "?",
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
