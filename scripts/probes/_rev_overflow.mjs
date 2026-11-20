import { chromium } from "playwright";
const b = await chromium.launch({ channel:"chrome", headless:true, args:["--enable-unsafe-webgpu"] });
for (const [W,H,S] of [[390,844,2],[360,780,3],[1440,900,1]]) {
const ctx = await b.newContext({ viewport:{width:W,height:H}, deviceScaleFactor:S });
await ctx.addInitScript(()=>{ try{ sessionStorage.setItem("at-preloader-seen","1"); }catch{} });
const p = await ctx.newPage();
for (const route of ["/", "/work", "/about"]) {
  await p.goto("http://localhost:3000"+route, { waitUntil:"networkidle" });
  await p.waitForTimeout(800);
  const r = await p.evaluate(()=>{
    const vw = document.documentElement.clientWidth;
    const bad=[];
    document.querySelectorAll("a,h1,h2,p,td,th,dd,span,li").forEach(e=>{
      const b=e.getBoundingClientRect();
      if (b.width===0) return;
      if (b.right > vw+1 || b.left < -1) bad.push({t:(e.textContent||"").trim().slice(0,45), l:Math.round(b.left), r:Math.round(b.right), vw});
      // also: element wider than its own parent's content box
    });
    return { vw, scrollW: document.documentElement.scrollWidth, bad: bad.slice(0,12) };
  });
  console.log(W+"x"+H, route, JSON.stringify(r));
}
await ctx.close();
}
await b.close();
