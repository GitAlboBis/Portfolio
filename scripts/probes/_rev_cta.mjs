import { chromium } from "playwright";
const b = await chromium.launch({ channel:"chrome", headless:true, args:["--enable-unsafe-webgpu"] });
for (const W of [375,414,344]){
const ctx = await b.newContext({ viewport:{width:W,height:800}, deviceScaleFactor:2 });
await ctx.addInitScript(()=>{ try{ sessionStorage.setItem("at-preloader-seen","1"); }catch{} });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil:"networkidle" });
await p.waitForTimeout(600);
const r = await p.evaluate(()=>{
  const vw=document.documentElement.clientWidth;
  const as=[...document.querySelectorAll("a")].filter(a=>a.href.startsWith("mailto:"));
  return as.map(a=>{const b=a.getBoundingClientRect(); const par=a.parentElement.getBoundingClientRect();
    return {txt:a.textContent.trim().slice(0,40), l:Math.round(b.left), r:Math.round(b.right), w:Math.round(b.width), vw, parR:Math.round(par.right), fs:getComputedStyle(a).fontSize, ov:getComputedStyle(a.parentElement).overflowX};});
});
console.log(W, JSON.stringify(r));
await ctx.close();
}
await b.close();
