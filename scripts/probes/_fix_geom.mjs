// geometry probe for the WP-10 fix batch: mobile fold budget + CTA fit
import { chromium } from "playwright";
const base = process.env.BASE_URL || "http://localhost:3000";
const widths = [320, 344, 360, 375, 390];
const b = await chromium.launch({ channel: "chrome", headless: true, args: ["--enable-unsafe-webgpu"] });

// ---- mobile fold budget on /
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => sessionStorage.setItem("at-preloader-seen", "1"));
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  const out = await p.evaluate(() => {
    const r = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { sel, top: Math.round(b.top + scrollY), bottom: Math.round(b.bottom + scrollY), h: Math.round(b.height) }; };
    const sels = ["header[role=banner]", "header.sheet", ".sheet .fields", "h1", "nav", "#phase-intake", "figure", ".bench-box", "#phase-intake table", "#phase-intake .bg-safety"];
    const rows = sels.map(r).filter(Boolean);
    // every element crossing y=844
    const all = [...document.querySelectorAll("body *")];
    const fold = all.filter((e) => { const b = e.getBoundingClientRect(); return b.top + scrollY < 844 && b.bottom + scrollY > 844 && b.height > 4; })
      .slice(0, 6).map((e) => ({ tag: e.tagName, cls: (e.className || "").toString().slice(0, 60), text: (e.textContent || "").trim().slice(0, 40) }));
    const h1 = document.querySelector("h1");
    return { rows, fold, h1: h1 ? { fs: getComputedStyle(h1).fontSize, h: Math.round(h1.getBoundingClientRect().height) } : null, docH: document.documentElement.scrollHeight };
  });
  console.log("=== MOBILE / GEOMETRY ===");
  console.log(JSON.stringify(out, null, 1));
  // Measured section height
  const meas = await p.evaluate(() => { const e = document.querySelector("#phase-test"); const b = e.getBoundingClientRect(); return { top: Math.round(b.top + scrollY), h: Math.round(b.height), doc: document.documentElement.scrollHeight }; });
  console.log("MEASURED:", JSON.stringify(meas));
  await ctx.close();
}

// ---- release CTA fit across widths
console.log("=== RELEASE CTA FIT ===");
for (const w of widths) {
  const ctx = await b.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => sessionStorage.setItem("at-preloader-seen", "1"));
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1500);
  const res = await p.evaluate(() => {
    const a = [...document.querySelectorAll('a[href^="mailto:"]')].pop();
    if (!a) return null;
    const panel = a.closest(".bg-safety");
    const ab = a.getBoundingClientRect(); const pb = panel.getBoundingClientRect();
    const cs = getComputedStyle(panel);
    return { linkLeft: Math.round(ab.left), linkRight: Math.round(ab.right), linkW: Math.round(ab.width), fs: getComputedStyle(a).fontSize,
      panelLeft: Math.round(pb.left), panelRight: Math.round(pb.right), padL: cs.paddingLeft, padR: cs.paddingRight,
      vw: innerWidth, scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth };
  });
  console.log(w, JSON.stringify(res));
  await ctx.close();
}
await b.close();
