// SCRATCH — deterministic visual QA of the menu curtain via the dev tl hook.
import { chromium } from "playwright";
import { resolve } from "node:path";
const reduce = process.argv[2] === "reduce";
const base = process.env.BASE_URL || "http://localhost:3000";
const out = resolve(process.cwd(), ".shots");
const IGNORE = [/React DevTools/i, /\[Fast Refresh\]/i, /THREE\.Clock/i, /WebGPU/i];
const isReal = (t) => !IGNORE.some((re) => re.test(t));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport:{width:390,height:844}, isMobile:true, deviceScaleFactor:2, reducedMotion: reduce?"reduce":"no-preference" });
const page = await ctx.newPage();
const errors = [];
page.on("console",(m)=>{ if(m.type()==="error"&&isReal(m.text())) errors.push(m.text()); });
page.on("pageerror",(e)=>errors.push("pageerror: "+e.message));
await page.goto(base,{waitUntil:"networkidle",timeout:45000});
await page.waitForTimeout(2600);
const tag = reduce?"rm-":"";

await page.locator('[aria-controls="menu-overlay"]').first().click();
await page.waitForTimeout(120);
const hasTL = await page.evaluate(()=> !!window.__menuTL);
console.log("tl hook present:", hasTL);
for (const time of [0.28, 0.48, 0.72]) {
  await page.evaluate((tm)=>{ const t=window.__menuTL; if(t){t.pause(); t.time(tm);} }, time);
  await page.waitForTimeout(120);
  await page.screenshot({ path: resolve(out, `${tag}seek-${String(time).replace('.','')}.png`) });
}
// resume to end
await page.evaluate(()=>{ const t=window.__menuTL; if(t){t.play();} });
await page.waitForTimeout(900);
await page.screenshot({ path: resolve(out, `${tag}seek-final.png`) });
const st = await page.evaluate(()=>{ const ov=document.querySelector("#menu-overlay"); const tg=document.querySelector('[aria-controls="menu-overlay"]'); return {op:+getComputedStyle(ov).opacity, pe:getComputedStyle(ov).pointerEvents, aria:tg?.getAttribute("aria-expanded")}; });
console.log("OPEN STATE:", JSON.stringify(st));
// close via X (pointer-events fix should let this through)
await page.locator('#menu-overlay [aria-controls="menu-overlay"]').first().click({timeout:5000}).then(()=>console.log("close click OK")).catch(e=>console.log("close FAIL:",e.message.split("\n")[0]));
await page.waitForTimeout(800);
const af = await page.evaluate(()=>{ const ov=document.querySelector("#menu-overlay"); return {op:+getComputedStyle(ov).opacity, pe:getComputedStyle(ov).pointerEvents}; });
console.log("AFTER CLOSE:", JSON.stringify(af), "| errors:", errors.length);
for(const e of errors) console.log("  - "+e);
await browser.close();
