// menu.mjs · MC-06 acceptance (canon §6 P0, recipe R-14): the mobile menu's type never shows over the page.
// 390×844 @2x, touch. Opens the menu (tap on MENU), samples every frame and films it, then closes it.
//   MC-06.open   no frame shows menu type (effective opacity of .nv-menu_in > 0.01) while any column is < 100 % down
//   MC-06.words  the words (.mi) start rising within 1 frame after the columns first cover the page (never before)
//   info.close   on close, no frame shows type while any column is < 100 % down (type off first)
// Usage: node menu.mjs            (RV_BASE=<url> to probe another tree)
import path from "node:path";
import * as S from "./strip.mjs";

const dir = S.outDir("menu");
const out = { verdicts: [] };
const V = (...a) => out.verdicts.push(S.verdict(...a));

const SAMPLER = `function(){
  const xf=${S.XF_SRC};
  const m=document.querySelector("[data-menu]"); if(!m) return null;
  const box=m.querySelector(".nv-menu_cols"), pr=box.getBoundingClientRect();
  const cols=[...box.querySelectorAll("i")].map(c=>{ const r=c.getBoundingClientRect(); return +Math.max(0,Math.min(1,(r.bottom-pr.top)/Math.max(1,pr.height))).toFixed(4); });
  const vis=getComputedStyle(m).visibility!=="hidden";
  const inner=m.querySelector(".nv-menu_in");
  const mi=[...m.querySelectorAll(".mi")].map(e=>{ const h=e.getBoundingClientRect().height||1; return +(xf(getComputedStyle(e).transform).ty/h).toFixed(4); });
  return { vis, open: m.classList.contains("is-open"), cols, type: vis ? +__effop(inner).toFixed(3) : 0, mi };
}`;

const browser = await S.L.launch({ headless: false });
try {
  const { page, context, consoleMsgs } = await S.open(browser, "index.html", { ...S.VP.mobile, introSeen: true, sampler: SAMPLER });
  await S.sleep(2500);
  // ------------------------------------------------ open
  await page.evaluate(() => { __probe.s = []; __probe.arm(); });
  let rec = await S.screencast(page);
  const tOpen = await S.pageNow(page);
  await page.tap("[data-menu-btn]");
  await S.sleep(1600);
  let frames = await rec.stop();
  let [doc] = await S.collect(page);
  const so = doc.s.filter((x) => x.v).map((x) => ({ t: +(x.e - tOpen).toFixed(1), ...x.v }));
  const dts = so.slice(1).map((x, i) => x.t - so[i].t).sort((a, b) => a - b);
  const frame = dts[Math.floor(dts.length / 2)] || 16.7;
  const minCov = (x) => (x.cols.length ? Math.min(...x.cols) : 0);
  const early = so.filter((x) => x.type > 0.01 && minCov(x) < 0.999);
  // full cover = the first visible frame at 100 % after the columns were seen travelling (a closed menu's columns
  // rest at translate 0 under visibility:hidden, which is not a cover)
  const i0 = so.findIndex((x) => x.vis && minCov(x) < 0.999);
  const full = i0 < 0 ? null : so.slice(i0).find((x) => x.vis && minCov(x) >= 0.999);
  const mi0 = so[0] ? so[0].mi : [];
  let wordsAt = null;
  for (let i = 1; i < so.length - 1; i++) {
    const ch = (a, b) => a.mi.some((v, k) => Math.abs(v - b.mi[k]) > 0.002);
    if (ch(so[i], so[i - 1]) && ch(so[i + 1], so[i]) && so[i].type > 0.01) { wordsAt = so[i - 1].t; break; }
  }
  const typeOn = so.find((x) => x.type > 0.01);
  out.open = { frameMs: +frame.toFixed(2), fullCoverAt: full ? full.t : null, typeOnAt: typeOn ? typeOn.t : null, wordsAt, earlyFrames: early.length, firstEarly: early[0] ? { t: early[0].t, cols: early[0].cols, type: early[0].type } : null, mi0 };
  V("MC-06.open", early.length === 0, `menu type visible while a column is < 100 % down in ${early.length}/${so.length} frames (type on at ${typeOn ? typeOn.t : "—"} ms, columns cover at ${full ? full.t : "—"} ms${early[0] ? `; first: cols ${early[0].cols.join("/")}` : ""})`);
  const dw = wordsAt != null && full ? wordsAt - full.t : null;
  V("MC-06.words", dw != null && dw >= -0.5 && dw <= frame * 1.5, `words start at ${wordsAt} ms, full cover at ${full ? full.t : "—"} ms: Δ = ${dw == null ? "n/a" : dw.toFixed(1)} ms (need 0 … 1 frame = ${frame.toFixed(1)} ms)`);
  const d1 = path.join(dir, "open");
  const st = await S.analyse(frames, { outDir: path.join(d1, "frames"), t0: tOpen, to: 1500 });
  out.open.strip = { n: st.n, spikes: st.spikes };
  out.open.contact = await S.contact(frames, path.join(d1, "contact.jpg"), { t0: tOpen, cols: 8, thumbW: 180, at: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420, 450, 480, 510, 540, 570, 600, 700, 900, 1200], title: "MC-06 menu open (t=0 tap)" });
  // ------------------------------------------------ close
  await page.evaluate(() => { __probe.s = []; __probe.arm(); });
  rec = await S.screencast(page);
  const tClose = await S.pageNow(page);
  await page.tap("[data-menu-btn]");
  await S.sleep(1200);
  frames = await rec.stop();
  [doc] = await S.collect(page);
  const sc = doc.s.filter((x) => x.v).map((x) => ({ t: +(x.e - tClose).toFixed(1), ...x.v }));
  const lateC = sc.filter((x) => x.vis && x.type > 0.01 && minCov(x) < 0.999);
  out.close = { lateFrames: lateC.length, firstLate: lateC[0] || null };
  V("info.close", lateC.length === 0, `on close, type visible while a column is < 100 % down in ${lateC.length}/${sc.length} frames`);
  const d2 = path.join(dir, "close");
  await S.analyse(frames, { outDir: path.join(d2, "frames"), t0: tClose, to: 1000 });
  out.close.contact = await S.contact(frames, path.join(d2, "contact.jpg"), { t0: tClose, cols: 8, thumbW: 180, at: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420, 450], title: "MC-06 menu close (t=0 tap)" });
  out.console = S.consoleVerdict(consoleMsgs);
  V("console", out.console.clean && out.console.warnings.length === 0, `${out.console.errors.length} errors, ${out.console.warnings.length} warnings`, out.console.errors.concat(out.console.warnings).slice(0, 5));
  S.writeJSON(path.join(dir, "samples.json"), { open: so, close: sc });
  await context.close();
} catch (e) {
  out.error = String((e && e.stack) || e);
  console.log("ERROR", out.error);
} finally {
  await browser.close();
  S.writeJSON(path.join(dir, "menu.json"), out);
}
const fails = out.verdicts.filter((v) => v.verdict === "FAIL").length;
console.log(`menu: ${fails} FAIL · ${path.join(dir, "menu.json")}`);
process.exitCode = fails || out.error ? 1 : 0;
