import { chromium } from "playwright";
const b = await chromium.launch({ channel:"chrome", headless:true });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
await ctx.addInitScript(()=>{ try{ sessionStorage.setItem("at-preloader-seen","1"); }catch{} });
const p = await ctx.newPage();
for (const r of ["/","/work","/about","/styleguide"]) {
  await p.goto("http://localhost:3000"+r, { waitUntil:"domcontentloaded" });
  await p.waitForTimeout(500);
  console.log(r, JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll("nav a, nav button")].map(e=>({
    tag:e.tagName, href:e.getAttribute("href"), cur:e.getAttribute("aria-current"), t:(e.textContent||"").replace(/\s+/g," ").trim().slice(0,14)})))));
}
await b.close();
