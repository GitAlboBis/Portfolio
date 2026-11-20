import { chromium } from "playwright";
const b = await chromium.launch({ channel:"chrome", headless:true, args:["--enable-unsafe-webgpu"] });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
await ctx.addInitScript(()=>{ try{ sessionStorage.setItem("at-preloader-seen","1"); }catch{} });
const p = await ctx.newPage();

// 1. browser surfaces: selection, caret, scrollbar, focus ring, underline offset, tabular nums
await p.goto("http://localhost:3000/", { waitUntil:"networkidle" });
await p.waitForTimeout(800);
const css = await p.evaluate(()=>{
  const sheets=[...document.styleSheets];
  let txt="";
  for(const s of sheets){ try{ for(const r of s.cssRules) txt += r.cssText+"\n"; }catch{} }
  const has = (re)=> (txt.match(re)||[]).slice(0,3);
  return {
    selection: has(/::selection[^{]*\{[^}]*\}/g),
    caret: has(/caret-color[^;]*/g),
    scrollbar: has(/(scrollbar-color|::-webkit-scrollbar)[^{;]*[{;][^}]*\}?/g),
    focusVisible: has(/:focus-visible[^{]*\{[^}]*\}/g).slice(0,2),
    underlineOffset: has(/text-underline-offset[^;]*/g),
    tabular: has(/font-variant-numeric:\s*tabular-nums/g).length,
  };
});
console.log("SURFACES", JSON.stringify(css,null,1));

// 2. readouts live: sample twice
const readouts = async ()=> p.evaluate(()=>{
  const el=[...document.querySelectorAll("dt,dd,[class*='readout'] *")].map(e=>e.textContent.trim());
  const box=[...document.querySelectorAll("dl")].map(d=>d.textContent.replace(/\s+/g," ").trim().slice(0,160));
  return box;
});
const r1 = await readouts(); await p.waitForTimeout(2500); const r2 = await readouts();
console.log("READOUT1", r1[0]); console.log("READOUT2", r2[0]);

// 3. type measures
const type = await p.evaluate(()=>{
  const out=[];
  const pick = (sel)=>{ const e=document.querySelector(sel); if(!e) return null; const cs=getComputedStyle(e);
    return {sel, fs:cs.fontSize, lh:cs.lineHeight, ls:cs.letterSpacing, fvs:cs.fontVariationSettings, w:Math.round(e.getBoundingClientRect().width), fam:cs.fontFamily.split(",")[0]}; };
  ["\u002Ef-name",".f-headline",".f-lead",".f-body",".f-caption",".f-cell",".f-meta",".f-stamp",".f-strip"].forEach(s=>{const v=pick(s); if(v) out.push(v);});
  return out;
});
console.log("TYPE", JSON.stringify(type,null,1));

// 4. longest line measure in ch for body-ish text
const measures = await p.evaluate(()=>{
  const res=[];
  document.querySelectorAll("p, td, li, dd").forEach(e=>{
    const t=e.textContent.trim(); if(t.length<60) return;
    const cs=getComputedStyle(e); const w=e.getBoundingClientRect().width;
    const cw = parseFloat(cs.fontSize)*0.5;
    res.push({ch: Math.round(w/cw), t:t.slice(0,40)});
  });
  return res.sort((a,b)=>b.ch-a.ch).slice(0,6);
});
console.log("MEASURE", JSON.stringify(measures));

// 5. Email cell + back cell on sub routes
for (const route of ["/work","/work/sersan-io","/about","/styleguide","/no-such-page"]) {
  await p.goto("http://localhost:3000"+route, { waitUntil:"networkidle" });
  await p.waitForTimeout(500);
  const info = await p.evaluate(()=>{
    const band=document.querySelector("nav");
    if(!band) return {band:false};
    const txt=band.textContent.replace(/\s+/g," ");
    const email=[...band.querySelectorAll("a")].find(a=>a.href.startsWith("mailto:"));
    return { band:true, sticky:getComputedStyle(band).position, email: !!email, emailHref: email?.href, txt: txt.slice(0,200) };
  });
  console.log(route, JSON.stringify(info));
}
await b.close();
