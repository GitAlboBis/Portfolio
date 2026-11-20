import { chromium } from "playwright";
const out="C:/Users/alber/AppData/Local/Temp/claude/C--Users-alber-Portfolio/a57754c5-1041-40cd-8985-d3afc45f9fe5/scratchpad/crops/";
const b = await chromium.launch({ channel:"chrome", headless:true, args:["--enable-unsafe-webgpu"] });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
await ctx.addInitScript(()=>{ try{ sessionStorage.setItem("at-preloader-seen","1"); }catch{} });
const p = await ctx.newPage();
const t0=Date.now();
await p.goto("http://localhost:3000/", { waitUntil:"domcontentloaded" });
const box = async()=> (await p.locator(".bench-box").first().boundingBox());
for (const ms of [1500,3000,5000,8000,12000]){
  const wait = ms-(Date.now()-t0); if(wait>0) await p.waitForTimeout(wait);
  const bb = await box();
  if(bb) await p.screenshot({ path: out+"churn-"+ms+".png", clip: bb });
}
// opacity sampling of the readout values over 3s
const samples = await p.evaluate(async()=>{
  const dds=[...document.querySelectorAll("dd")];
  const res=[];
  for(let i=0;i<60;i++){
    res.push(dds.map(d=>+getComputedStyle(d).opacity.slice(0,4)));
    await new Promise(r=>setTimeout(r,50));
  }
  return res;
});
const flat = samples.flat();
const low = flat.filter(v=>v<0.85).length;
console.log("opacity samples", flat.length, "below .85:", low, "min:", Math.min(...flat).toFixed(2), "fraction faded:", (low/flat.length).toFixed(3));
await b.close();
