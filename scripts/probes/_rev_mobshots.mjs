import { chromium } from "playwright";
const out="C:/Users/alber/AppData/Local/Temp/claude/C--Users-alber-Portfolio/a57754c5-1041-40cd-8985-d3afc45f9fe5/scratchpad/crops/";
const b = await chromium.launch({ channel:"chrome", headless:true, args:["--enable-unsafe-webgpu"] });
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
await ctx.addInitScript(()=>{ try{ sessionStorage.setItem("at-preloader-seen","1"); }catch{} });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil:"networkidle" });
await p.waitForTimeout(1500);
for (const y of [7700, 9400, 11200, 13000, 14200, 14800]) {
  await p.evaluate(v=>window.scrollTo(0,v), y);
  await p.waitForTimeout(700);
  await p.screenshot({ path: out+"mob-"+y+".png" });
}
await b.close();
console.log("ok");
