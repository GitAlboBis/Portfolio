import { chromium } from "playwright";
const url = process.argv[2] || "http://localhost:3000/";
const W = Number(process.argv[3]||1440), H = Number(process.argv[4]||900), S = Number(process.argv[5]||1);
const b = await chromium.launch({ channel:"chrome", headless:true, args:["--enable-unsafe-webgpu"] });
const ctx = await b.newContext({ viewport:{width:W,height:H}, deviceScaleFactor:S });
await ctx.addInitScript(()=>{ try{ sessionStorage.setItem("at-preloader-seen","1"); }catch{} });
const p = await ctx.newPage();
await p.goto(url, { waitUntil:"networkidle" });
await p.waitForTimeout(1500);
const data = await p.evaluate(()=>{
  const out = { docH: document.documentElement.scrollHeight, sections: [] };
  document.querySelectorAll("main > *, main section, main > section > *").forEach(el=>{
    const r = el.getBoundingClientRect();
    if (r.height < 40) return;
    const cap = el.querySelector("caption, .f-caption")?.textContent?.trim().slice(0,40) || "";
    out.sections.push({ tag: el.tagName+(el.id?"#"+el.id:""), top: Math.round(r.top+scrollY), h: Math.round(r.height), cap });
  });
  return out;
});
console.log(JSON.stringify(data,null,1));
await b.close();
