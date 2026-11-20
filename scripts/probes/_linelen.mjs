import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(() => { try { sessionStorage.setItem("at-preloader-seen","1") } catch {} });
const p = await ctx.newPage();
for (const route of ["/about","/"]) {
  await p.goto("http://localhost:3000"+route, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  const out = await p.evaluate(() => {
    const res = [];
    for (const el of document.querySelectorAll("p,span,li,td,th,div,h1,h2,h3")) {
      const txt = [...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(" ").trim();
      if (txt.length < 40) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 50 || r.height === 0) continue;
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize);
      // rough chars-per-line = width / (0.5 * font-size)
      const cpl = Math.round(r.width / (fs * 0.5));
      res.push({ cpl, w: Math.round(r.width), fs, cls: el.className?.toString().slice(0,60), tag: el.tagName, txt: txt.slice(0,50) });
    }
    return res.sort((a,b)=>b.cpl-a.cpl).slice(0,8);
  });
  console.log("=== "+route);
  for (const o of out) console.log(o.cpl+"cpl  "+o.w+"px  "+o.fs+"px  "+o.tag+"."+o.cls+"  :: "+o.txt);
}
await b.close();
