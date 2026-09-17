import { chromium } from "playwright";
const b = await chromium.launch({ channel:"chrome", headless:true, args:["--enable-unsafe-webgpu"] });
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1 });
await ctx.addInitScript(()=>{ try{ sessionStorage.setItem("at-preloader-seen","1"); }catch{} });
const p = await ctx.newPage();
const errs=[]; p.on("console",m=>{ if(m.type()==="error"||m.type()==="warning") errs.push(m.type()+": "+m.text().slice(0,160)); });
await p.goto("http://localhost:3000/", { waitUntil:"networkidle" });
await p.waitForTimeout(1200);
const read = () => p.evaluate(()=>{
  const band = document.querySelector("nav");
  const cells=[...band.querySelectorAll("a,button")].map(e=>({
    t:(e.textContent||"").replace(/\s+/g," ").trim().slice(0,30),
    stamped: !!e.querySelector("[data-stamp], .stamp, [class*='stamp']") || getComputedStyle(e.querySelector("span")||e).backgroundColor,
    cur: e.getAttribute("aria-current")
  }));
  const counter = band.textContent.match(/(\d)\s*\/\s*6/);
  const r = band.getBoundingClientRect();
  return { counter: counter?counter[0]:null, bandTop: Math.round(r.top), bandPos: getComputedStyle(band).position, cells: cells.map(c=>c.t+(c.cur?"*":"")) };
});
const steps=[0,0.15,0.3,0.45,0.6,0.8,1];
const H = await p.evaluate(()=>document.documentElement.scrollHeight);
const log=[];
for(const s of steps){
  await p.evaluate(y=>window.scrollTo(0,y), Math.round((H-900)*s));
  await p.waitForTimeout(900);
  const r = await read();
  const stampCount = await p.evaluate(()=>document.querySelectorAll("nav [data-stamped='true'], nav [data-phase-stamp]").length);
  log.push({ s, ...r, stampCount });
}
console.log(JSON.stringify(log,null,1));
console.log("CONSOLE:", errs.length, errs.slice(0,8));
await b.close();
