import { chromium } from "playwright";
const out="C:/Users/alber/AppData/Local/Temp/claude/C--Users-alber-Portfolio/a57754c5-1041-40cd-8985-d3afc45f9fe5/scratchpad/crops/";
const b = await chromium.launch({ channel:"chrome", headless:true });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
await ctx.addInitScript(()=>{ try{ sessionStorage.setItem("at-preloader-seen","1"); }catch{} });
const p = await ctx.newPage();
const errs=[]; p.on("console",m=>{ if(m.type()==="error") errs.push(m.text().slice(0,140)); });
await p.goto("http://localhost:3000/work", { waitUntil:"networkidle" });
await p.waitForTimeout(1500);
const t0=Date.now();
await p.locator("a[data-row-link]").first().click();
for (const ms of [120,300,520,900]) {
  const w = ms-(Date.now()-t0); if(w>0) await p.waitForTimeout(w);
  await p.screenshot({ path: out+"trans-"+ms+".png", clip:{x:0,y:0,width:1440,height:600} });
}
await p.waitForTimeout(500);
console.log("url", p.url(), "errors", errs);
await b.close();
