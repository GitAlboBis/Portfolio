import { chromium } from "playwright";
const b = await chromium.launch({ channel:"chrome", headless:true, args:["--enable-unsafe-webgpu"] });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
await ctx.addInitScript(()=>{ try{ sessionStorage.setItem("at-preloader-seen","1"); }catch{} });
const p = await ctx.newPage();

// A: sub-route band cells — are the non-current phases real links?
await p.goto("http://localhost:3000/work", { waitUntil:"networkidle" });
await p.waitForTimeout(600);
console.log("BAND /work:", JSON.stringify(await p.evaluate(()=>[...document.querySelector("nav").children].map(c=>{
  const el=c.querySelector("a,button")||c; return {tag:el.tagName, href:el.getAttribute("href")||null, dis:el.disabled??null, txt:(el.textContent||"").replace(/\s+/g," ").trim().slice(0,18)};
}))));

// B: row hover on /work
const row = p.locator("tbody tr").first();
const before = await row.evaluate(e=>getComputedStyle(e).backgroundColor);
await row.hover(); await p.waitForTimeout(300);
const after = await row.evaluate(e=>getComputedStyle(e).backgroundColor);
console.log("ROW HOVER bg:", before, "->", after);

// C: loupe arm on hover over a capture
await p.goto("http://localhost:3000/work", { waitUntil:"networkidle" });
await p.waitForTimeout(1200);
const loupe = p.locator("[class*='loupe'], figure").first();
const lb = await p.evaluate(()=>{
  const el=document.querySelector("[data-loupe], .loupe, figure");
  return el? {cls:el.className, html:el.outerHTML.slice(0,220)} : null;
});
console.log("LOUPE el:", JSON.stringify(lb));

// D: spacing above vs below a phase heading
await p.goto("http://localhost:3000/", { waitUntil:"networkidle" });
await p.waitForTimeout(800);
console.log("GAPS:", JSON.stringify(await p.evaluate(()=>{
  const out=[];
  document.querySelectorAll("section").forEach(s=>{const cs=getComputedStyle(s); out.push({id:s.id, pt:cs.paddingTop, pb:cs.paddingBottom, mt:cs.marginTop});});
  return out;
})));

// E: keyboard tab order first 12 stops
const stops=[];
for(let i=0;i<12;i++){ await p.keyboard.press("Tab");
  stops.push(await p.evaluate(()=>{const a=document.activeElement; const cs=getComputedStyle(a);
    return (a.tagName+":"+(a.textContent||"").replace(/\s+/g," ").trim().slice(0,22)+" | ring "+cs.outlineColor+" "+cs.outlineWidth);}));
}
console.log("TAB:", JSON.stringify(stops,null,1));
await b.close();
