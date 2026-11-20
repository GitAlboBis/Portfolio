// scripts/media/vpp-plate.mjs — a faithful REDRAW of one real class diagram of the team's Visual Paradigm
// model (Agricultural Supply Chain Platform, University of Camerino, team of three;
// github.com/daveeCity/IDS_GROUP_PROJECT), drawn in the site's night studio (spec 50 §2: night ground, Sofia Sans,
// one accent). docs/redesign/rivista-next/11-media-scout.md §7; redrawn on night 2026-11-10
// (docs/redesign/rivista-story/build/y-diagram.md): it was the one cream picture left on the night pages.
//
// Needs a static server serving public/ for the fonts (css/fonts.css): RV_FONTS=<url of css/fonts.css>, default
// http://127.0.0.1:5178/proto/rivista/css/fonts.css.
//
//   node scripts/media/vpp-plate.mjs            -> public/captures/agricultural-supply-chain.svg
//                                                 + agricultural-supply-chain-{1600,800}.webp (+ sidecars)
//                                                 + the same three for agricultural-supply-chain-detail
//                                                   (a window onto the model package, names legible)
//                                                 + a block per plate in public/captures/PROVENANCE.md
//   node scripts/media/vpp-plate.mjs --no-log   -> same, PROVENANCE.md untouched
//   --vpp <file> --diagram "<name>"             -> another model copy or diagram
//
// What is drawn comes only from the model: every package, class box, compartment, member, stereotype,
// connector path, association name and end label is read from the .vpp (a SQLite file) and placed at
// the modelled coordinates, scaled uniformly. Only the typography and the colours are the site's.
// The .vpp is COPIED to a temp folder and opened read-only; the source folders are never touched.
//
// Visual Paradigm geometry, as stored in DIAGRAM_ELEMENT.DEFINITION (verified on this model):
//  - a shape's x/y are relative to its parent shape (a class inside a package), packages are absolute;
//  - a connector's _points: the first is relative to the from-shape origin, the last to the to-shape
//    origin, the ones between to the from-shape origin; connectorStyle=1 (rectilinear);
//  - Generalization/Realization: from = the general / supplier end (the triangle sits there);
//    Dependency: from = the client, the arrow points at the to end; Association: aggregationKind
//    67 = composite, 66 = shared, on the end of the whole.
import { DatabaseSync } from "node:sqlite";
import { copyFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { tmpdir } from "node:os";
import { launch } from "../lib/headless.mjs";
import { encodePlates, appendProvenance, plateTable, OUT } from "./plates.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const VPP = opt("--vpp", "C:/Users/alber/Downloads/IDS_project(3).vpp");
const DIAGRAM = opt("--diagram", "Project class diagram 4");
const NO_LOG = args.includes("--no-log");
/* S2 fix (desktop review S11): the page prints the figure's caption below it; a credit line inside the raster was text on
   an image at ~7 px and said it twice. --caption prints it again (the SVG keeps it as its <title> either way) */
const PRINT_CAPTION = args.includes("--caption");
const SLUG = "agricultural-supply-chain";
const FONTS_CSS = process.env.RV_FONTS || "http://127.0.0.1:5178/proto/rivista/css/fonts.css";

// the night studio's tokens (public/proto/rivista/css/tokens.css): the plate's ground is --night-2, each package a
// sunk field of --night inside a 1 px --line rule, class boxes back on --night-2 with a --mute hairline
const C = { ground: "#12151d", field: "#0c0e14", ink: "#f4f1ea", body: "#cfcabf", mute: "#9a958a", line: "#262a36", accent: "#8fa2ff" };
// The one accent (--accent; cobalt is never a line or a word on the night): the traceability thread of the model, three associations as modelled
// (Prodotto -dettagliare-> TracciabilitaProdotto -eseguire-> PassoFiliera -specificare-> Azienda).
const THREAD = [["Prodotto", "TracciabilitaProdotto", "dettagliare"], ["TracciabilitaProdotto", "PassoFiliera", "eseguire"], ["PassoFiliera", "Azienda", "specificare"]];

// ---------------------------------------------------------------- read the model (read-only copy)
if (!existsSync(VPP)) throw new Error(`model not found: ${VPP}`);
const tmp = mkdtempSync(join(tmpdir(), "vpp-plate-"));
const copy = join(tmp, "model.vpp");
copyFileSync(VPP, copy);
const db = new DatabaseSync(copy, { readOnly: true });
const txt = (b) => (b == null ? "" : Buffer.from(b).toString("utf8"));
const diag = db.prepare("select ID, NAME, DEFINITION from DIAGRAM where NAME = ?").get(DIAGRAM);
if (!diag) throw new Error(`diagram not found: ${DIAGRAM}`);
const diagDef = txt(diag.DEFINITION);
const diagModified = +((diagDef.match(/\n\tlastModified=(\d+);/) || [])[1] || 0);
const rows = db.prepare("select ID, SHAPE_TYPE, MODEL_ELEMENT_ID, PARENT_ID, DEFINITION from DIAGRAM_ELEMENT where DIAGRAM_ID = ?").all(diag.ID);
const modelDef = (id) => txt(db.prepare("select DEFINITION from MODEL_ELEMENT where ID = ?").get(id)?.DEFINITION);
const modelName = (id) => db.prepare("select NAME from MODEL_ELEMENT where ID = ?").get(id)?.NAME ?? null;

const num = (s, k) => { const m = s.match(new RegExp(`\\n\\t${k}=(-?\\d+);`)); return m ? +m[1] : null; };
const ref = (s, k) => { const m = s.match(new RegExp(`\\n\\t${k}=<[^:>]+:([^>]+)>;`)); return m ? m[1] : null; };
const unq = (s) => s.replace(/\\(.)/g, "$1");

const els = rows.map((r) => {
  const s = txt(r.DEFINITION);
  const head = s.match(/^[^:]+:(?:"((?:[^"\\]|\\.)*)"|NULL):(\w+)/);
  const pts = s.match(/\n\t_points="([^"]*)";/);
  const cap = s.match(/\n\t_captionUIModel=\(\n\t\t@x=(-?\d+);, \n\t\t@y=(-?\d+);, \n\t\t@width=(-?\d+);, \n\t\t@height=(-?\d+);/);
  return {
    id: r.ID, type: r.SHAPE_TYPE, model: r.MODEL_ELEMENT_ID, parent: r.PARENT_ID,
    name: head && head[1] != null ? unq(head[1]) : "",
    x: num(s, "x"), y: num(s, "y"), w: num(s, "width"), h: num(s, "height"),
    from: ref(s, "_fromShape"), to: ref(s, "_toShape"),
    points: pts ? pts[1].split(";").filter(Boolean).map((p) => p.split(",").map(Number)) : null,
    capH: cap ? +cap[4] : null,
  };
});
const byId = Object.fromEntries(els.map((e) => [e.id, e]));
const abs = (e) => { let x = e.x, y = e.y, p = byId[e.parent]; while (p) { x += p.x; y += p.y; p = byId[p.parent]; } return { x, y, w: e.w, h: e.h }; };

const packages = els.filter((e) => e.type === "Package").map((e) => ({ ...e, ...abs(e) }));
const classes = els.filter((e) => e.type === "Class").map((e) => {
  const d = modelDef(e.model);
  const members = [...d.matchAll(/\{[^:{}]+:"((?:[^"\\]|\\.)*)":(Attribute|Operation) \{/g)].map((m) => ({ kind: m[2], text: unq(m[1]) }));
  const st = d.match(/\n\tstereotypes=\(\n\t\t<([^>]+)>/);
  return { ...e, ...abs(e), members, stereotype: st ? modelName(st[1].split(":").pop()) : null };
});
const classByModel = Object.fromEntries(classes.map((c) => [c.model, c]));
const KINDS = ["Association", "Generalization", "Realization", "Dependency"];
const connectors = els.filter((e) => KINDS.includes(e.type)).map((e) => {
  const f = byId[e.from], t = byId[e.to];
  const fa = abs(f), ta = abs(t);
  const P = e.points.map(([px, py], i) => (i === e.points.length - 1 ? [ta.x + px, ta.y + py] : [fa.x + px, fa.y + py]));
  const c = { ...e, path: P, fromEl: f, toEl: t, ends: {} };
  if (e.type === "Association") {
    const d = modelDef(e.model);
    for (const m of d.matchAll(/\n\t(to|from)=\{[^:]+:"((?:[^"\\]|\\.)*)":AssociationEnd \{([\s\S]*?)\n\t\}\};/g)) {
      const block = m[3];
      const endModel = (block.match(/\n\t\tEndModelElement=<([^>]+)>;/) || [])[1]?.split(":").pop();
      const mult = (block.match(/\n\t\tmultiplicity="([^"]*)";/) || [])[1] ?? "";
      const agg = +((block.match(/\n\t\taggregationKind=(\d+);/) || [])[1] || 0);
      const role = unq(m[2]);
      const shape = classByModel[endModel];
      // the end attaches to whichever connector end shows that class
      const at = shape && shape.id === f.id ? "from" : shape && shape.id === t.id ? "to" : m[1];
      c.ends[at] = { label: mult || role, agg };
    }
  }
  return c;
});
db.close();
rmSync(tmp, { recursive: true, force: true });

// ---------------------------------------------------------------- plates
// Both plates share one frame: the drawing lives in BOX, the caption and its rule sit under it, all inside
// the central 16:9 band (y 50..950), so a cover crop to 16:9 (the case page's top figure) loses only ground.
//  - the full plate: the whole diagram, uniform scale, centred, inside the central 4:3 band too (x 133..1467):
//    Work's glass plates are 4:3 and cover-fit the picture, so the drawing keeps a margin inside that crop;
//  - the detail: a window onto the model package around the accent thread, at a scale where the class
//    names read; shapes and lines that cross the window edge are cut by it, as in a printed detail.
const W = 1600, H = 1000;
const BOX = { x: 120, y: 74, w: W - 240, h: 820 };
const BOX_43 = { x: 160, y: 74, w: W - 320, h: 820 };
const PLATES = [
  { slug: SLUG, window: null, box: BOX_43, caption: `Redrawn from the team's model, ${DIAGRAM}` },
  {
    slug: `${SLUG}-detail`, box: BOX,
    // model units: Utente (left) to Animatore (right), the model package's Utente row to Prodotto
    window: { x: 3305, y: 3290, w: 1751, h: 1070 },
    caption: `Detail of the model package, redrawn from the team's model, ${DIAGRAM}`,
  },
];
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// the one superfamily (css/fonts.css): text for names and members, condensed for the labels on the lines,
// extra condensed for the package titles
const F_TEXT = `'Sofia Sans', 'Barlow', system-ui, sans-serif`;
const F_LABEL = `'Sofia Sans Condensed', 'Barlow Condensed', 'Arial Narrow', sans-serif`;
const F_DISP = `'Sofia Sans Extra Condensed', 'Barlow Condensed', 'Arial Narrow', sans-serif`;
const segLen = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

function buildSvg(plate) {
  let minX, minY, spanX, spanY;
  if (plate.window) {
    ({ x: minX, y: minY, w: spanX, h: spanY } = plate.window);
  } else {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const grow = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
    for (const e of [...packages, ...classes]) { grow(e.x, e.y); grow(e.x + e.w, e.y + e.h); }
    for (const c of connectors) for (const [x, y] of c.path) grow(x, y);
    minX = x0; minY = y0; spanX = x1 - x0; spanY = y1 - y0;
  }
  const B = plate.box;
  const s = Math.min(B.w / spanX, B.h / spanY);
  const dw = spanX * s, dh = spanY * s;
  const ox = (W - dw) / 2, oy = B.y + (B.h - dh) / 2;
  const X = (x) => +(ox + (x - minX) * s).toFixed(2);
  const Y = (y) => +(oy + (y - minY) * s).toFixed(2);
  const Lu = (v) => +(v * s).toFixed(3);
  const fs = (u) => +(u * s).toFixed(3);
  const mk = (px, units) => Math.max(px, units * s); // marker sizes: never below their print size
  const out = [];
  const defs = [];

  // packages: sunk fields of the night inside a 1 px rule, their modelled names at the top-left corner
  const order = packages.slice().sort((a, b) => a.y - b.y || a.x - b.x);
  for (const p of order) out.push(`<rect class="pkg" x="${X(p.x) + 0.5}" y="${Y(p.y) + 0.5}" width="${Lu(p.w) - 1}" height="${Lu(p.h) - 1}"/>`);
  // the names go on top of the connectors (see below), set as titles (display face), with a halo of the field
  const pkgNames = order.map((p) => `<text class="pkg-name" x="${(X(p.x) + 10).toFixed(2)}" y="${(Y(p.y) + 24).toFixed(2)}">${esc(p.name)}</text>`);

  // connectors (under the boxes); the accent thread above the others
  const markers = [], labels = [], threadOut = [];
  let threadCount = 0;
  const tip = (path, atStart) => {
    const pts = path.map(([x, y]) => [X(x), Y(y)]);
    const a = atStart ? pts[0] : pts[pts.length - 1];
    let b = atStart ? pts[1] : pts[pts.length - 2];
    for (let i = 2; segLen(a, b) < 0.01 && i < pts.length; i++) b = atStart ? pts[i] : pts[pts.length - 1 - i];
    const len = segLen(a, b) || 1;
    return { a, u: [(b[0] - a[0]) / len, (b[1] - a[1]) / len] };
  };
  const f2 = (v) => v.toFixed(2);
  // a label is set only when it reads whole: on the detail, a word the window edge would cut is left out
  const inWindow = (cx, cy, w) => !plate.window || (cx - w / 2 > ox + 3 && cx + w / 2 < ox + dw - 3 && cy > oy + 8 && cy < oy + dh - 4);
  const ptsStr = (P) => P.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ");
  for (const c of connectors) {
    const dashed = c.type === "Dependency" || c.type === "Realization";
    const thread = THREAD.some(([a, b, n]) => c.name === n && ((c.fromEl.name === a && c.toEl.name === b) || (c.fromEl.name === b && c.toEl.name === a)));
    if (thread) threadCount++;
    (thread ? threadOut : out).push(`<polyline class="cn${dashed ? " dash" : ""}${thread ? " thread" : ""}" points="${ptsStr(c.path)}"/>`);
    if (c.type === "Generalization" || c.type === "Realization") {
      const { a, u } = tip(c.path, true); // hollow triangle at the general / supplier (from) end
      const l = mk(6.5, 13), w = mk(3.6, 7.2), n = [-u[1], u[0]];
      const b = [a[0] + u[0] * l, a[1] + u[1] * l];
      markers.push(`<polygon class="tri" points="${a[0]},${a[1]} ${f2(b[0] + n[0] * w)},${f2(b[1] + n[1] * w)} ${f2(b[0] - n[0] * w)},${f2(b[1] - n[1] * w)}"/>`);
    } else if (c.type === "Dependency") {
      const { a, u } = tip(c.path, false); // open arrow at the supplier (to) end
      const l = mk(5.2, 10), w = mk(2.6, 5), n = [-u[1], u[0]];
      const b = [a[0] + u[0] * l, a[1] + u[1] * l];
      markers.push(`<polyline class="arr" points="${f2(b[0] + n[0] * w)},${f2(b[1] + n[1] * w)} ${a[0]},${a[1]} ${f2(b[0] - n[0] * w)},${f2(b[1] - n[1] * w)}"/>`);
    } else if (c.type === "Association") {
      for (const side of ["from", "to"]) {
        const end = c.ends[side];
        if (!end) continue;
        const { a, u } = tip(c.path, side === "from");
        const n = [-u[1], u[0]];
        if (end.agg === 66 || end.agg === 67) {
          const l = mk(4.2, 8), w = mk(2.4, 4.6);
          const m = [a[0] + u[0] * l, a[1] + u[1] * l], e2 = [a[0] + u[0] * l * 2, a[1] + u[1] * l * 2];
          markers.push(`<polygon class="${end.agg === 67 ? "dia-c" : "dia-s"}${thread ? " thread" : ""}" points="${a[0]},${a[1]} ${f2(m[0] + n[0] * w)},${f2(m[1] + n[1] * w)} ${f2(e2[0])},${f2(e2[1])} ${f2(m[0] - n[0] * w)},${f2(m[1] - n[1] * w)}"/>`);
        }
        if (end.label) {
          const along = mk(6, 14), off = mk(3.2, 7);
          const q = [a[0] + u[0] * along + n[0] * off, a[1] + u[1] * along + n[1] * off];
          if (inWindow(q[0], q[1], end.label.length * fs(9.5) * 0.55)) labels.push(`<text class="end" x="${f2(q[0])}" y="${f2(q[1] + fs(3.5))}" text-anchor="middle">${esc(end.label)}</text>`);
        }
      }
    }
    // the connector's own name at the middle of its longest segment
    if (c.name) {
      let best = 0, bi = 0;
      for (let i = 0; i < c.path.length - 1; i++) { const l = segLen(c.path[i], c.path[i + 1]); if (l > best) { best = l; bi = i; } }
      const p0 = c.path[bi], p1 = c.path[bi + 1];
      const mx = X((p0[0] + p1[0]) / 2), my = Y((p0[1] + p1[1]) / 2);
      const vertical = Math.abs(p1[0] - p0[0]) < Math.abs(p1[1] - p0[1]);
      const vw = c.name.length * fs(11.5) * 0.46; // Sofia Sans Condensed 500, about 0.46 em a letter
      if (vertical ? inWindow(mx + mk(2, 5) + vw / 2, my, vw) : inWindow(mx, my, vw)) labels.push(vertical
        ? `<text class="verb${thread ? " thread" : ""}" x="${f2(mx + mk(2, 5))}" y="${f2(my + fs(4))}">${esc(c.name)}</text>`
        : `<text class="verb${thread ? " thread" : ""}" x="${f2(mx)}" y="${f2(my - mk(1.6, 4))}" text-anchor="middle">${esc(c.name)}</text>`);
    }
  }
  if (threadCount !== THREAD.length) throw new Error(`accent thread: found ${threadCount} of ${THREAD.length} associations`);
  out.push(...threadOut, ...markers, ...pkgNames);

  // classes: paper boxes with an ink hairline; compartments as Visual Paradigm lays them out (caption with
  // stereotype and name, then attributes, then operations, one 15-unit line per member), clipped to the box
  const LINE = 15;
  classes.forEach((c, i) => {
    const x = X(c.x), y = Y(c.y), w = Lu(c.w), h = Lu(c.h);
    defs.push(`<clipPath id="k${i}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`);
    out.push(`<g class="cls"><rect class="box" x="${x}" y="${y}" width="${w}" height="${h}"/>`);
    const capH = c.capH && c.capH > 0 ? c.capH : (c.stereotype ? 30 : 15);
    const attrs = c.members.filter((m) => m.kind === "Attribute");
    const ops = c.members.filter((m) => m.kind === "Operation");
    const cx = f2(x + w / 2);
    const t = [];
    let yy = c.y + 2;
    if (c.stereotype) { t.push(`<text class="st" x="${cx}" y="${f2(Y(yy + 11))}">«${esc(c.stereotype)}»</text>`); yy += LINE; }
    t.push(`<text class="nm" x="${cx}" y="${f2(Y(yy + 11.5))}">${esc(c.name)}</text>`);
    let cy = c.y + capH + 2;
    const rule = (yv) => out.push(`<line class="sep" x1="${x}" y1="${Y(yv)}" x2="${f2(x + w)}" y2="${Y(yv)}"/>`);
    if (attrs.length || ops.length) rule(cy);
    for (const m of attrs) { t.push(`<text class="mb" x="${f2(x + Lu(5))}" y="${f2(Y(cy + 12))}">${esc(m.text)}</text>`); cy += LINE; }
    if (attrs.length) cy += 3;
    if (ops.length) { if (attrs.length) rule(cy); for (const m of ops) { t.push(`<text class="mb" x="${f2(x + Lu(5))}" y="${f2(Y(cy + 12))}">${esc(m.text)}</text>`); cy += LINE; } }
    out.push(`<g clip-path="url(#k${i})">${t.join("")}</g></g>`);
  });
  out.push(...labels);

  // caption and rule: aligned with the widest band on the full plate (so a centred 4:5 crop keeps the whole
  // line), with the window on the detail
  const capY = Math.min(H - 64, oy + dh + 34);
  const main = packages.slice().sort((a, b) => b.w - a.w)[0];
  const ruleX1 = plate.window ? ox : X(main.x), ruleX2 = plate.window ? ox + dw : X(main.x + main.w);
  const capX = plate.window ? ox : X(main.x) + 8;
  const clip = plate.window ? `<clipPath id="win"><rect x="${f2(ox)}" y="${f2(oy)}" width="${f2(dw)}" height="${f2(dh)}"/></clipPath>` : "";
  const cn = s > 0.5 ? 1 : 0.8;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d">
<title id="t">${esc(plate.caption)}</title>
<desc id="d">${plate.window ? "A detail of the model package of" : "A redraw of"} the class diagram "${esc(DIAGRAM)}" from the Visual Paradigm model of the Agricultural Supply Chain Platform (team of three, University of Camerino; github.com/daveeCity/IDS_GROUP_PROJECT): ${packages.length} packages, ${classes.length} classes and ${connectors.length} relationships in the whole diagram, each at its modelled position, light lines on a night ground. In the accent blue: the associations dettagliare, eseguire and specificare (Prodotto, TracciabilitaProdotto, PassoFiliera, Azienda). Source ${esc(basename(VPP))}, diagram last modified ${diagModified ? new Date(diagModified).toISOString().slice(0, 10) : "n/a"}. Drawn by scripts/media/vpp-plate.mjs for the portfolio of Alberto Tuveri.</desc>
<metadata>ORIGIN (drawn from a real artefact, not generated): every shape, name, member and connector read from ${esc(basename(VPP))} (SQLite, opened read-only), diagram "${esc(DIAGRAM)}"${plate.window ? `, window x ${plate.window.x} y ${plate.window.y} w ${plate.window.w} h ${plate.window.h} (model units)` : ""}; uniform scale ${s.toFixed(5)}; typography and colours of the site's night studio (Sofia Sans, Sofia Sans Condensed, Sofia Sans Extra Condensed; night, night-2, line, mute, body, ink; one accent thread).</metadata>
<defs>
<style>
.pkg{fill:${C.field};stroke:${C.line};stroke-width:1}
.pkg-name{font:800 20px ${F_DISP};text-transform:uppercase;fill:${C.ink};letter-spacing:.01em;stroke:${C.field};stroke-width:5px;stroke-linejoin:round;paint-order:stroke}
.cn{fill:none;stroke:${C.mute};stroke-width:${cn};stroke-linejoin:miter}
.cn.dash{stroke-dasharray:${s > 0.5 ? "4 2.6" : "2.6 1.8"}}
.cn.thread{stroke:${C.accent};stroke-width:${cn + 0.6}}
.tri{fill:${C.field};stroke:${C.mute};stroke-width:${cn};stroke-linejoin:miter}
.arr{fill:none;stroke:${C.mute};stroke-width:${cn}}
.dia-c{fill:${C.mute};stroke:${C.mute};stroke-width:.6}
.dia-s{fill:${C.field};stroke:${C.mute};stroke-width:.6}
.dia-c.thread{fill:${C.accent};stroke:${C.accent}}
.dia-s.thread{stroke:${C.accent}}
.box{fill:${C.ground};stroke:${C.mute};stroke-width:1}
.sep{stroke:${C.mute};stroke-opacity:.4;stroke-width:${s > 0.5 ? 0.8 : 0.6}}
.nm{font:600 ${fs(11.5)}px ${F_TEXT};fill:${C.ink};text-anchor:middle}
.st{font:400 ${fs(10)}px ${F_TEXT};fill:${C.mute};text-anchor:middle}
.mb{font:400 ${fs(9.8)}px ${F_TEXT};fill:${C.body}}
.verb{font:500 ${fs(11.5)}px ${F_LABEL};fill:${C.mute};letter-spacing:.02em}
.verb.thread{fill:${C.accent}}
.end{font:400 ${fs(9.5)}px ${F_TEXT};fill:${C.mute}}
.cap{font:600 13px ${F_LABEL};text-transform:uppercase;letter-spacing:.12em;fill:${C.mute}}
.rule{stroke:${C.line};stroke-width:1}
</style>
${clip}
${defs.join("\n")}
</defs>
<rect width="${W}" height="${H}" fill="${C.ground}"/>
<g${plate.window ? ' clip-path="url(#win)"' : ""}>
${out.join("\n")}
</g>
${PRINT_CAPTION ? `<line class="rule" x1="${f2(ruleX1)}" y1="${f2(capY - 18)}" x2="${f2(ruleX2)}" y2="${f2(capY - 18)}"/>
<text class="cap" x="${f2(capX)}" y="${f2(capY)}">${esc(plate.caption)}</text>` : ""}
</svg>
`;
  // Scope every class and id with the plate's own prefix, so the SVG can be inlined in a rivista page
  // (fx.css has its own .cap and .arr) and both plates can sit on one page without id clashes.
  const K = plate.window ? "umld" : "uml";
  const scoped = svg
    .replace(/<style>([\s\S]*?)<\/style>/, (_, css) => `<style>${css.replace(/\.([a-z][a-z0-9-]*)/g, (m, n) => `.${K}-${n}`)}</style>`)
    .replace(/ class="([^"]+)"/g, (_, v) => ` class="${v.split(/\s+/).map((t) => `${K}-${t}`).join(" ")}"`)
    .replace(/ id="([^"]+)"/g, (_, v) => ` id="${K}-${v}"`)
    .replace(/url\(#([^)]+)\)/g, (_, v) => `url(#${K}-${v})`)
    .replace(/aria-labelledby="t d"/, `aria-labelledby="${K}-t ${K}-d"`);
  return { svg: scoped, s, dw, dh, ox, oy, capY };
}

// ---------------------------------------------------------------- render each plate at DPR 2, then encode
// grayscale text antialiasing: LCD (subpixel) AA leaves orange/blue fringes that a downsample keeps
const browser = await launch({ args: ["--disable-lcd-text", "--font-render-hinting=none"] });
const chrome = browser.version();
const rawDir = resolve(OUT, "../../.shots/captures");
mkdirSync(rawDir, { recursive: true });
const day = new Date().toISOString().slice(0, 10);
for (const plate of PLATES) {
  const b = buildSvg(plate);
  const svgPath = resolve(OUT, `${plate.slug}.svg`);
  writeFileSync(svgPath, b.svg);
  console.log(`${plate.slug}.svg: scale ${b.s.toFixed(4)}, drawing ${b.dw.toFixed(0)}x${b.dh.toFixed(0)} at (${b.ox.toFixed(0)},${b.oy.toFixed(0)}), caption ${b.capY.toFixed(0)}, ${(b.svg.length / 1024).toFixed(1)} KB`);
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${FONTS_CSS}">
<style>html,body{margin:0;background:${C.ground}}svg{display:block}</style></head><body>${b.svg.replace(/^<\?xml[^>]*>\s*/, "")}</body></html>`, { waitUntil: "networkidle" });
  const FACES = ["400 13px 'Sofia Sans'", "600 13px 'Sofia Sans'", "500 13px 'Sofia Sans Condensed'", "600 13px 'Sofia Sans Condensed'", "800 13px 'Sofia Sans Extra Condensed'"];
  await page.evaluate(async (faces) => {
    await Promise.all(faces.map((f) => document.fonts.load(f)));
    await document.fonts.ready;
  }, FACES);
  const fontsOk = await page.evaluate((faces) => Object.fromEntries(faces.map((f) => [f, document.fonts.check(f)])), FACES);
  if (Object.values(fontsOk).some((v) => !v)) throw new Error(`web fonts did not load (${JSON.stringify(fontsOk)}); is ${FONTS_CSS} reachable?`);
  const png = await page.screenshot({ type: "png" });
  await ctx.close();
  writeFileSync(resolve(rawDir, `${plate.slug}-raw@2x.png`), png);
  console.log(`  rendered fonts=${JSON.stringify(fontsOk)} pageerrors=${errors.length}`);

  const what = plate.window ? `a detail of the model package of the class diagram "${DIAGRAM}"` : `the class diagram "${DIAGRAM}"`;
  const description = `${plate.window ? "Detail of the model package, redrawn" : "Redrawn"} from the team's Visual Paradigm model IDS_project.vpp, diagram "${DIAGRAM}" (github.com/daveeCity/IDS_GROUP_PROJECT) · shapes and names as modelled · team of 3, University of Camerino · portfolio of Alberto Tuveri`;
  const origin =
    `ORIGIN (drawn from a real artefact, not generated): a redraw of ${what} of the team's Visual Paradigm model ` +
    `(${basename(VPP)}, a SQLite file copied to a temp folder and opened read-only; the public repo is github.com/daveeCity/IDS_GROUP_PROJECT). ` +
    `Packages, classes with their members and relationships are drawn at their modelled coordinates (uniform scale ${b.s.toFixed(5)}) by ` +
    `scripts/media/vpp-plate.mjs; the SVG was rendered by headless Chrome ${chrome} at DPR 2 and downsampled with sharp. ` +
    `Team of three, University of Camerino; used as evidence of work performed. Vector source: public/captures/${plate.slug}.svg.`;
  const rows2 = await encodePlates({
    slug: plate.slug,
    master: png,
    description,
    copyright: "© the IDS project team (University of Camerino) — redraw for the portfolio of Alberto Tuveri",
    software: `scripts/media/vpp-plate.mjs + headless Chrome ${chrome}`,
    origin,
    lossless: true,
  });
  if (!NO_LOG) {
    appendProvenance(plate.slug, [
      `### \`${plate.slug}.svg\` e \`${plate.slug}-*\` — disegnati ${day} (\`node scripts/media/vpp-plate.mjs\`)`,
      "",
      plate.window
        ? `Dettaglio del package \`model\` dallo stesso ridisegno (finestra in unità del modello: x ${plate.window.x}, y ${plate.window.y}, ${plate.window.w}×${plate.window.h}; scala ${b.s.toFixed(5)}): le forme e le linee che escono dalla finestra sono tagliate dal suo bordo. Stessa sorgente, stesso metodo del blocco \`${SLUG}\`.`
        : `Ridisegno fedele del class diagram "${DIAGRAM}" del modello Visual Paradigm del team (\`${basename(VPP)}\`; repo pubblico github.com/daveeCity/IDS_GROUP_PROJECT; team di tre, Università di Camerino). Il \`.vpp\` è un file SQLite: copiato in una cartella temporanea e aperto in sola lettura; da \`DIAGRAM_ELEMENT\` si leggono posizione e misura di ${packages.length} package e ${classes.length} classi e il percorso di ${connectors.length} relazioni, da \`MODEL_ELEMENT\` i membri, gli stereotipi e le estremità delle associazioni. Tutto è disegnato alle coordinate del modello, in scala uniforme ${b.s.toFixed(5)}, dentro la fascia centrale 4:3 (le lastre di vetro di Work tagliano a 4:3) e 16:9 (la figura in testa al caso). Solo tipografia e colori sono del sito, lo studio notturno della spec 50 (ridisegnato il 2026-11-10: prima era su carta crema con Figtree e Cormorant, l'unica immagine crema rimasta): fondo \`--night-2\`, ogni package un campo \`--night\` in un filetto \`--line\`, classi in \`--night-2\` con filetto \`--mute\`, nomi in Sofia Sans (\`--ink\`), membri in \`--body\`, linee ed etichette in \`--mute\` (Sofia Sans Condensed), titoli dei package in Sofia Sans Extra Condensed; un solo accento \`--accent\`: le tre associazioni dettagliare, eseguire, specificare (Prodotto → TracciabilitaProdotto → PassoFiliera → Azienda). Ultima modifica del diagramma nel modello: ${diagModified ? new Date(diagModified).toISOString().slice(0, 10) : "n/d"}. Render: Chrome ${chrome} headless a DPR 2, poi sharp. Il vettoriale è \`${plate.slug}.svg\` (i font vengono dalla pagina che lo ospita: \`css/fonts.css\`).`,
      "",
      ...plateTable(rows2, { focal: "50% 50%" }),
    ]);
  }
  if (errors.length) console.warn("page errors:", errors);
}
await browser.close();
