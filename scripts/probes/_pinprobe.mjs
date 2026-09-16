// SCRATCH: computed sticky state at the failing mid-cover position.
import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
await page.evaluate(() => {
  const cover = document.getElementById("nightfall");
  window.scrollTo(0, cover.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.5);
});
await page.waitForTimeout(1500);
const s = await page.evaluate(() => {
  const card = document.querySelector(".nightfall-card");
  const runway = document.querySelector(".nightfall-runway");
  const cs = getComputedStyle(card);
  const rw = getComputedStyle(runway);
  const cr = card.getBoundingClientRect();
  const rr = runway.getBoundingClientRect();
  return {
    scrollY: Math.round(window.scrollY),
    card: { pos: cs.position, top: cs.top, transform: cs.transform.slice(0, 60), h: Math.round(cr.height), vTop: Math.round(cr.top), vBottom: Math.round(cr.bottom) },
    runway: { pb: rw.paddingBottom, h: Math.round(rr.height), vTop: Math.round(rr.top), vBottom: Math.round(rr.bottom), overflow: rw.overflow },
    ancestors: (() => {
      const out = [];
      let el = runway.parentElement;
      while (el) {
        const c = getComputedStyle(el);
        if (c.overflow !== "visible" || c.overflowX !== "visible" || c.overflowY !== "visible" || c.transform !== "none" || c.contain !== "none")
          out.push(`${el.tagName.toLowerCase()}.${(el.className || "").toString().slice(0, 40)} ov=${c.overflow}/${c.overflowX}/${c.overflowY} tf=${c.transform !== "none"} contain=${c.contain}`);
        el = el.parentElement;
      }
      return out;
    })(),
  };
});
console.log(JSON.stringify(s, null, 2));
await browser.close();
