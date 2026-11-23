/* ==========================================================================
   fx-motion.js · the 2D layer as a film's title sequence (round 13, lane MOTION2D; plan 70 §8.5)

   Anime.js 4.5.0 through its WAAPI module moves the page's DOM: transform, opacity and straight clip-paths, so every
   beat runs on the compositor while the main thread serves the stage. The library comes from jsDelivr as two ES
   modules (animejs/waapi, animejs/text), imported by the head script after the first frame (window.__rvAnime).
   A "timeline" here is a cue sheet: each beat is one waapi.animate with its own delay from one t0. (Anime's
   createTimeline().sync() would pause the WAAPI animations and drive their currentTime from the JS ticker every
   frame: the main thread again. See docs/redesign/rivista-story/build/w-motion.md.)

   What it directs (FX.mo):
   · the OPENING of every page: the header's words, the label, the title letter by letter from behind its straight
     mask (only a curtain for the [data-refract] type the stage bends: those letters never move), a hairline that
     draws, the lead's lines (splitText by lines), the buttons. It starts with the stage's first frame (html.stage-on),
     at once with no stage, and after a cut when the sheet leaves (fx:nav:uncovered). On the cover the name is the
     stage's: the opening is the header and the foot, which rises as the hall is lit (stage-on + 2.25 s, hero.js keeps
     the swarm out of the foot from 2.2 s).
   · each SCENE STEP (fx-scroll.js calls FX.mo.step when .st-on changes): the block enters in time with the camera's
     travel between steps (about 0.7 s), and leaves faster, all at once. The gallery's numeral ticks from the last one.
   · the CUT between pages, one cue sheet in time with the camera's push (fx-nav.js): the index numeral counts from the
     page being read to the destination, the name rises letter by letter, a hairline crosses the sheet; arriving, the
     card clears before the sheet leaves upward (the card's name and the page's title are never on screen together).
   · the MENU's rows, the copy's confirmation, the press of every control (a press has weight; on a fine pointer an
     arrow leaves and comes back in).
   · the header's scene name (the heading of the scene in view, behind a mask); below 1024 px under the header's name.
   · (wave 6, TITLES) the years that snap to their value (About's path, a case's record) and the drawing that traces
     itself (the Supply Chain's class diagram), both in the live state only.
   Nothing here runs under reduced motion; nothing follows the pointer; every hidden state is the CSS's or a beat's,
   and the library's absence leaves the CSS entrances (css/motion.css, the hold) to show the page by about 2.5 s.
   ========================================================================== */
(() => {
  "use strict";
  const FX = window.FX;
  if (!FX) return;
  const d = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const motion = d.classList.contains("rv-motion");

  /* eases (css/tokens.css): rise = --ease-rise, out = --ease-out, io = --ease-io, in = --ease-in */
  const EZ = {
    rise: "cubic-bezier(0.19, 1, 0.22, 1)",
    out: "cubic-bezier(0.16, 1, 0.3, 1)",
    io: "cubic-bezier(0.66, 0, 0.22, 1)",
    in: "cubic-bezier(0.5, 0, 0.75, 0)",
    press: "cubic-bezier(0.2, 0, 0, 1)",
  };
  /* a straight mask: shut below the letter, open, and gone upward */
  const SHUT = "inset(-0.3em -0.12em 104% -0.12em)";
  const OPEN = "inset(-0.3em -0.12em -0.35em -0.12em)";
  const GONE = "inset(104% -0.12em -0.35em -0.12em)";
  const DOWN = "translate3d(0, 104%, 0)", REST = "translate3d(0, 0, 0)", UPW = "translate3d(0, -104%, 0)";
  /* the hold (css/motion.css --mo-safe): the opening claims the first screen before it ends, or leaves it to the CSS */
  const SAFE_MS = 500;

  /* ---------------------------------------------------------------- the library */
  let A = null;
  let libP = null;
  function load() {
    if (libP) return libP;
    const src = window.__rvAnime;
    libP = (src && typeof src.then === "function" ? src : Promise.reject(new Error("no loader")))
      .then((m) => {
        const w = m && m[0] && m[0].waapi, s = m && m[1] && m[1].splitText;
        if (!w || typeof w.animate !== "function") throw new Error("animejs/waapi has no waapi.animate");
        A = { waapi: w, splitText: typeof s === "function" ? s : null };
        d.classList.add("mo-on");
        return A;
      })
      .catch((e) => { if (motion) console.warn("[fx] motion: the title sequence is off (" + (e && e.message || e) + "); the CSS entrances play"); return null; });
    return libP;
  }
  const within = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(() => r(null), ms))]);
  /** one beat: anime's waapi.animate, or nothing when the library is not there */
  const beat = (t, p) => {
    if (!A) return null;
    const list = Array.isArray(t) ? t.filter(Boolean) : t;
    if (!list || (Array.isArray(list) && !list.length)) return null;
    try { return A.waapi.animate(list, p); } catch (e) { console.warn("[fx] motion: a beat threw", e); return null; }
  };
  /** after a beat that ends at rest: no inline transform or clip is left behind (no element keeps a layer) */
  const clear = (els, props = ["transform", "clipPath", "opacity"]) => {
    for (const el of [].concat(els)) if (el && el.style) { for (const p of props) el.style[p] = ""; if (el.classList) el.classList.remove("mo-held"); }
  };
  const done = (a, fn) => { if (a && typeof a.then === "function") a.then(fn); else fn(); };

  /* ---------------------------------------------------------------- the stage's first frame */
  let stageOnAt = d.classList.contains("stage-on") ? performance.now() : 0;
  const stageWaiters = [];
  if (!stageOnAt && "MutationObserver" in window) {
    const mo = new MutationObserver(() => {
      if (stageOnAt || !d.classList.contains("stage-on")) return;
      stageOnAt = performance.now();
      mo.disconnect();
      stageWaiters.splice(0).forEach((f) => f());
    });
    mo.observe(d, { attributes: true, attributeFilter: ["class"] });
  }
  /** resolves at the stage's first frame, or at the deadline (ms on the page's clock), or at once without a stage */
  function stageFrame(deadline) {
    const expect = d.classList.contains("sc-on") && !d.classList.contains("gl-off") && !!document.querySelector("[data-stage]");
    if (!expect || stageOnAt || d.classList.contains("stage-dead")) return Promise.resolve();
    return new Promise((r) => {
      let ok = false;
      const go = () => { if (!ok) { ok = true; r(); } };
      stageWaiters.push(go);
      setTimeout(go, Math.max(0, deadline - performance.now()));
    });
  }

  /* ---------------------------------------------------------------- letters */
  /** split a display title into letters: each word one unbreakable box of letter boxes; the font's kerning (lost
   * between boxes) is put back as a margin per letter, measured before and after, in em. Text nodes stay in the
   * element (no hidden duplicate: the stage's backdrop walks these text nodes). Returns the letters by line. */
  function letters(el) {
    if (el._moLetters) return el._moLetters;
    /* the title as it was printed, put back once its letters have risen (unsplit()): the per-letter kerning is
       measured once and would not follow a later font swap */
    el._moOrig = [...el.childNodes].filter((n) => !(n.nodeType === 1 && n.classList.contains("mo-hl"))).map((n) => n.cloneNode(true));
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let t = tw.nextNode(); t; t = tw.nextNode()) {
      if (!(t.nodeValue || "").trim() || (t.parentElement && t.parentElement.closest(".sr-only, .mo-hl"))) continue;
      nodes.push(t);
    }
    const range = document.createRange();
    const before = [];
    for (const t of nodes) {
      const s = t.nodeValue;
      for (let i = 0; i < s.length; i++) {
        if (!s[i].trim()) continue;
        range.setStart(t, i); range.setEnd(t, i + 1);
        const r = range.getBoundingClientRect();
        before.push({ x: r.left, y: r.top });
      }
    }
    const chars = [];
    for (const t of nodes) {
      const f = document.createDocumentFragment();
      for (const part of t.nodeValue.split(/(\s+)/)) {
        if (!part) continue;
        if (!part.trim()) { f.appendChild(document.createTextNode(part)); continue; }
        const w = document.createElement("span"); w.className = "mo-w";
        for (const ch of part) { const c = document.createElement("span"); c.className = "mo-c"; c.textContent = ch; w.appendChild(c); chars.push(c); }
        f.appendChild(w);
      }
      t.parentNode.replaceChild(f, t);
    }
    /* the kerning back: within a line, the step from one letter to the next is made the step it had */
    const fs = parseFloat(getComputedStyle(el).fontSize) || 16;
    if (before.length === chars.length) {
      const after = chars.map((c) => { const r = c.getBoundingClientRect(); return { x: r.left, y: r.top }; });
      for (let i = 1; i < chars.length; i++) {
        if (Math.abs(before[i].y - before[i - 1].y) > 4 || Math.abs(after[i].y - after[i - 1].y) > 4) continue;
        if (chars[i].parentNode !== chars[i - 1].parentNode) continue;
        const k = (before[i].x - before[i - 1].x) - (after[i].x - after[i - 1].x);
        if (Math.abs(k) > 0.05) chars[i].style.marginLeft = (k / fs).toFixed(4) + "em";
      }
    }
    /* lines: by the letters' tops */
    const lines = [];
    let top = null;
    for (const c of chars) { const y = c.offsetTop; if (top === null || Math.abs(y - top) > 4) { lines.push([]); top = y; } lines[lines.length - 1].push(c); }
    el._moLetters = lines;
    return lines;
  }
  /** the letters of a title rise from behind their masks (or are uncovered by a curtain, for the bent type) */
  function lettersIn(el, t, opts = {}) {
    const lines = letters(el);
    const bent = !!el.closest("[data-refract]");
    const gapC = opts.gapC ?? 24, gapL = opts.gapL ?? 90, dur = opts.dur ?? 900;
    const all = lines.flat();
    /* (wave 7) built paused, each letter is held behind its mask in its own style too, until its beat plays */
    if (opts.paused) for (const c of all) { c.style.clipPath = SHUT; if (!bent) c.style.transform = DOWN; }
    const delay = (c) => { for (let l = 0; l < lines.length; l++) { const i = lines[l].indexOf(c); if (i >= 0) return t + l * gapL + Math.min(i, 18) * gapC; } return t; };
    const p = bent
      ? { clipPath: [SHUT, OPEN], duration: dur, delay: (c) => delay(c), ease: EZ.rise }
      : { transform: [DOWN, REST], clipPath: [SHUT, OPEN], duration: dur, delay: (c) => delay(c), ease: EZ.rise };
    const a = beat(all, Object.assign({ autoplay: !opts.paused }, p));
    done(a, () => { clear(all, ["transform", "clipPath"]); if (opts.restore && !bent) unsplit(el); });
    return a;
  }
  /** a title's printed nodes back in place of its letter boxes (the hairline stays). Not for the [data-refract] type:
   * the stage's backdrop has measured those text nodes and keeps them. */
  function unsplit(el) {
    if (!el._moOrig) return;
    const hl = el.querySelector(":scope > .mo-hl");
    el.replaceChildren(...el._moOrig);
    if (hl) el.appendChild(hl);
    el._moOrig = null; el._moLetters = null;
  }

  /* ---------------------------------------------------------------- the hairline */
  /** a hairline under a title, inside it (the title becomes its positioning box; the span has no text, so the
   * stage's backdrop, which paints text nodes only, never sees it), drawn from the left */
  function hairline(title) {
    if (!title) return null;
    let hl = title.querySelector(":scope > .mo-hl");
    if (!hl) {
      hl = document.createElement("span"); hl.className = "mo-hl"; hl.setAttribute("aria-hidden", "true");
      if (getComputedStyle(title).position === "static") title.classList.add("mo-lines-host");
      hl.style.top = "calc(100% + 0.45 * var(--s4))";
      title.appendChild(hl);
    }
    return hl;
  }

  /* ---------------------------------------------------------------- the odometer */
  /** a numeral as columns of digits; `el` keeps the printed figure for readers (sr-only) */
  function odometer(el) {
    if (el._od) return el._od;
    const text = el.textContent;
    if (!/^\d+$/.test(text.trim())) return null;
    const sr = document.createElement("span"); sr.className = "sr-only"; sr.textContent = text;
    const od = document.createElement("span"); od.className = "od"; od.setAttribute("aria-hidden", "true");
    const cols = [];
    for (const ch of text.trim()) {
      const dg = document.createElement("span"); dg.className = "od-d";
      const s = document.createElement("span"); s.className = "od-s";
      for (let n = 0; n <= 9; n++) { const i = document.createElement("i"); i.textContent = String(n); s.appendChild(i); }
      s.style.transform = `translate3d(0, ${-+ch * 10}%, 0)`;
      dg.appendChild(s); od.appendChild(dg); cols.push(s);
    }
    el.textContent = ""; el.append(od, sr);
    el._od = { cols, value: text.trim() };
    return el._od;
  }
  /** turn the odometer from one value to another (same number of digits), each column on its own */
  function tick(o, from, to, t = 0, dur = 620) {
    if (!o) return;
    const f = String(from).padStart(o.cols.length, "0"), g = String(to).padStart(o.cols.length, "0");
    o.cols.forEach((s, i) => {
      const a = +f[i] || 0, b = +g[i] || 0;
      if (a === b) { s.style.transform = `translate3d(0, ${-b * 10}%, 0)`; return; }
      beat(s, { transform: [`translate3d(0, ${-a * 10}%, 0)`, `translate3d(0, ${-b * 10}%, 0)`], duration: dur, delay: t + i * 60, ease: EZ.io });
    });
    o.value = g;
  }

  /* ---------------------------------------------------------------- the years (wave 6, TITLES)
     A year is the one figure on the site that is not a count: it does not count up from zero, it snaps to its value.
     Each year written in an element (19xx, 20xx, whole) becomes an odometer once (the printed year stays beside it for
     readers); snap() turns each column from 0 to its digit in 520 ms, 45 ms apart, a year 90 ms after the one before it. About's
     path (each time a step comes into focus) and the record of a case (once, as it comes into view) use it. */
  /* (no lookbehind: a regex the older Safari cannot parse would take the whole module down) */
  const IS_YEAR = /^(?:19|20)\d\d$/;
  function years(root) {
    if (!root) return [];
    if (root._moYears) return root._moYears;
    const nodes = [];
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let t = tw.nextNode(); t; t = tw.nextNode()) {
      if (t.parentElement && t.parentElement.closest(".sr-only, .od, [aria-hidden='true']")) continue;
      if ((t.nodeValue || "").split(/(\d+)/).some((p, i) => i % 2 === 1 && IS_YEAR.test(p))) nodes.push(t);
    }
    const out = [];
    for (const t of nodes) {
      const f = document.createDocumentFragment();
      t.nodeValue.split(/(\d+)/).forEach((part, i) => {
        if (!part) return;
        if (i % 2 === 0 || !IS_YEAR.test(part)) { f.appendChild(document.createTextNode(part)); return; }
        const s = document.createElement("span"); s.className = "od-y"; s.textContent = part;
        f.appendChild(s);
        const o = odometer(s);
        if (o) out.push(o);
      });
      t.parentNode.replaceChild(f, t);
    }
    root._moYears = out;
    return out;
  }
  function snap(root, t = 0, dur = 520) {
    if (!A || !motion || !root) return false;
    const os = years(root);
    os.forEach((o, k) => o.cols.forEach((s, i) => {
      const b = +o.value[i] || 0, to = `translate3d(0, ${-b * 10}%, 0)`;
      if (!b) { s.style.transform = to; return; }
      /* the column stands at 0 until its beat starts (no flash of the year before it turns); the beats start at once,
         while the text is still coming into focus, so a year is never read at 0000 */
      s.style.transform = "translate3d(0, 0%, 0)";
      done(beat(s, { transform: ["translate3d(0, 0%, 0)", to], duration: dur, delay: t + k * 90 + i * 45, ease: EZ.io }), () => { s.style.transform = to; });
    }));
    return os.length > 0;
  }

  /* ---------------------------------------------------------------- the drawing that traces itself (wave 6, TITLES)
     A picture drawn from a vector source (figure.cs-still[data-trace]: the Supply Chain's class diagram, whose drawing
     is public/captures/<stem>.svg, scripts/media/vpp-plate.mjs) draws its lines once as it comes into view. The drawing
     is read ahead (traceLoad, when the figure is a screen and a half away) and set over the picture without its
     connectors; when the figure enters (trace), each connector's straight segments are drawn by a straight clip from
     where the line starts, one after the other as a pen would; an arrowhead, a diamond or a label appears as the pen
     reaches it; the grey structure first, the accent thread (the traceability the case is about) last, as one line;
     then still, and the drawing's own connectors take over (the same vector, so nothing changes). Each piece is its
     own small box: the clips and the opacities run on the compositor. Live scene mode only: under reduced motion,
     with ?stage=0, without WebGPU, with a dead stage, without script and in print the picture is printed whole. */
  const TR_PEN = 1.25;   // the pen's speed, in the drawing's units per ms (about 720 px/s at 1440)
  const SVGNS = "http://www.w3.org/2000/svg";
  const liveScene = () => motion && d.classList.contains("sc-on") && !d.classList.contains("gl-off") && !d.classList.contains("stage-dead");
  function traceLoad(fig) {
    if (fig._tr) return fig._tr;
    const img = $("img", fig);
    const src = img ? (img.getAttribute("src") || "").replace(/-\d+\.webp(?=$|[?#])/, ".svg") : "";
    if (!img || !liveScene() || !FX.has("motion") || !/\.svg($|[?#])/.test(src) || !("DOMParser" in window) || !window.fetch) return (fig._tr = Promise.resolve(false));
    fig._tr = fetch(src, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error("HTTP " + r.status))))
      .then((txt) => new Promise((res) => {
        /* the drawing is laid out while the reader is elsewhere (its labels are measured once, in its own units) */
        const run = () => { try { res(trBuild(fig, img, txt)); } catch (e) { console.warn("[fx] motion: the drawing does not trace (" + (e && e.message || e) + ")"); res(false); } };
        if ("requestIdleCallback" in window) requestIdleCallback(run, { timeout: 900 }); else setTimeout(run, 60);
      }))
      .catch((e) => { console.warn("[fx] motion: the drawing does not trace (" + (e && e.message || e) + ")"); return false; });
    return fig._tr;
  }
  const trPts = (el) => (el.getAttribute("points") || "").trim().split(/\s+/).map((p) => p.split(",").map(Number)).filter((p) => p.length === 2 && p.every(Number.isFinite));
  const trBox = (pts) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; };
  const trMeets = (b, r) => b.x <= r.x + r.w && b.x + b.w >= r.x && b.y <= r.y + r.h && b.y + b.h >= r.y;
  /** a segment clipped to a rectangle (Liang–Barsky): its parameters, or null */
  function trClip(a, b, r) {
    let t0 = 0, t1 = 1;
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const p = [-dx, dx, -dy, dy], q = [a[0] - r.x, r.x + r.w - a[0], a[1] - r.y, r.y + r.h - a[1]];
    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) { if (q[i] < 0) return null; continue; }
      const t = q[i] / p[i];
      if (p[i] < 0) { if (t > t1) return null; if (t > t0) t0 = t; } else { if (t < t0) return null; if (t < t1) t1 = t; }
    }
    return t1 - t0 > 1e-4 ? { t0, t1 } : null;
  }
  /** the drawing set over the picture, its connectors held back; the pieces the pen will draw, in the drawing's units */
  function trBuild(fig, img, txt) {
    if (!fig.isConnected) return false;
    const doc = new DOMParser().parseFromString(txt, "image/svg+xml");
    const root = doc.documentElement;
    if (!root || root.nodeName.toLowerCase() !== "svg" || doc.querySelector("parsererror")) throw new Error("not a drawing");
    root.querySelectorAll("title, desc, metadata, script, foreignObject, a").forEach((n) => n.remove());
    const vb = (root.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number);
    if (vb.length !== 4 || !(vb[2] > 0 && vb[3] > 0)) throw new Error("no viewBox");
    const base = /** @type {SVGSVGElement} */ (document.importNode(root, true));
    for (const a of ["role", "aria-labelledby", "aria-describedby", "width", "height", "id"]) base.removeAttribute(a);
    for (const a of [...base.attributes]) if (/^on/i.test(a.name)) base.removeAttribute(a.name);
    base.setAttribute("class", "tr-base is-tracing");
    base.setAttribute("aria-hidden", "true");
    base.setAttribute("focusable", "false");
    base.setAttribute("preserveAspectRatio", "xMidYMid slice");
    const box = document.createElement("div");
    box.className = "tr"; box.setAttribute("aria-hidden", "true");
    box.appendChild(base);
    fig.classList.add("tr-host");
    img.after(box);
    /* the window the drawing shows of the model (its connectors run on beyond it) */
    let win = { x: vb[0], y: vb[1], w: vb[2], h: vb[3] };
    const g = base.querySelector("g[clip-path]");
    const ref = g && /url\(#([^)]+)\)/.exec(g.getAttribute("clip-path") || "");
    const cr = ref && base.querySelector(`clipPath[id="${ref[1]}"] > rect`);
    if (cr) win = { x: +cr.getAttribute("x") || 0, y: +cr.getAttribute("y") || 0, w: +cr.getAttribute("width") || 0, h: +cr.getAttribute("height") || 0 };
    const conns = [];
    for (const el of base.querySelectorAll("polyline.umld-cn")) {
      const pts = trPts(el), segs = [];
      let cum = 0;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const c = L > 0 ? trClip(a, b, win) : null;
        if (c) {
          const at = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
          segs.push({ a: at(c.t0), b: at(c.t1), off: cum + L * c.t0, len: L * (c.t1 - c.t0) });
        }
        cum += L;
      }
      if (segs.length) conns.push({ cls: el.getAttribute("class") || "umld-cn", thread: el.classList.contains("umld-thread"), dash: el.classList.contains("umld-dash"), segs });
    }
    if (!conns.length) { box.remove(); fig.classList.remove("tr-host"); return false; }
    const marks = [];
    for (const el of base.querySelectorAll("polygon.umld-tri, polygon.umld-dia-c, polygon.umld-dia-s, polyline.umld-arr")) {
      const pts = trPts(el);
      if (!pts.length) continue;
      const bb = trBox(pts);
      if (trMeets(bb, win)) marks.push({ node: el.cloneNode(true), bb, pad: 1.5 });
    }
    for (const el of base.querySelectorAll("text.umld-verb, text.umld-end")) {
      let bb = null;
      try { const r = /** @type {SVGGraphicsElement} */ (el).getBBox(); bb = { x: r.x, y: r.y, w: r.width, h: r.height }; } catch (e) { bb = null; }
      if (bb && bb.w > 0 && trMeets(bb, win)) marks.push({ node: el.cloneNode(true), bb, pad: 2, label: true });
    }
    fig._trData = { box, base, vb, conns, marks };
    return true;
  }
  /** the pen's time at each piece: the grey connectors from left to right, their starts spread over 0.6 s; the
   * accent thread after them, top to bottom, one connector after the other. Each mark at the time the pen passes
   * nearest it (a head at its line's end, a label at its point on the line) */
  function trPlan(D) {
    const mid = (c) => { const s = c.segs[Math.floor(c.segs.length / 2)]; return { x: (s.a[0] + s.b[0]) / 2, y: (s.a[1] + s.b[1]) / 2 }; };
    const grey = D.conns.filter((c) => !c.thread).sort((p, q) => mid(p).x - mid(q).x || mid(p).y - mid(q).y);
    const thread = D.conns.filter((c) => c.thread).sort((p, q) => mid(p).y - mid(q).y);
    /* a connector's segments one after the other from its start; returns when its pen lifts */
    const place = (c, t0) => { let s0 = t0; for (const s of c.segs) { s.t = s0; s.d = Math.max(40, s.len / TR_PEN); s0 += s.d; } c.t0 = t0; return s0; };
    let end = 0;
    grey.forEach((c, i) => { end = Math.max(end, place(c, Math.round(i * Math.min(48, 600 / Math.max(1, grey.length))))); });
    let t = grey.length ? Math.max(680, grey[grey.length - 1].t0 + 240) : 0;
    thread.forEach((c) => { const lift = place(c, Math.round(t)); end = Math.max(end, lift); t = lift + 70; });
    for (const m of D.marks) {
      const cx = m.bb.x + m.bb.w / 2, cy = m.bb.y + m.bb.h / 2;
      let best = Infinity, when = end;
      for (const c of D.conns) for (const s of c.segs) {
        const dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], L2 = dx * dx + dy * dy || 1;
        const u = Math.max(0, Math.min(1, ((cx - s.a[0]) * dx + (cy - s.a[1]) * dy) / L2));
        const dd = Math.hypot(s.a[0] + dx * u - cx, s.a[1] + dy * u - cy);
        if (dd < best) { best = dd; when = s.t + s.d * u; }
      }
      m.t = Math.round(best < (m.label ? 48 : 16) ? when + (m.label ? 60 : 0) : end);
    }
    for (const m of D.marks) end = Math.max(end, m.t + (m.label ? 220 : 140));
    return end;
  }
  /** play the trace (the figure is entering): false when it cannot (the picture then opens as printed) */
  function trace(fig) {
    const D = fig && fig._trData;
    if (!D || !A || !liveScene() || !D.box.isConnected) return false;
    fig._trData = null;
    const k = D.box.clientWidth / D.vb[2];
    if (!(k > 0)) return false;
    const end = trPlan(D);
    const ink = document.createElement("div");
    ink.className = "tr-ink";
    const svg = (vbx, x, y, w, h) => {
      const s = document.createElementNS(SVGNS, "svg");
      s.setAttribute("viewBox", `${vbx[0]} ${vbx[1]} ${vbx[2]} ${vbx[3]}`);
      s.setAttribute("preserveAspectRatio", "none");
      s.style.cssText = `left:${((x - D.vb[0]) * k).toFixed(2)}px;top:${((y - D.vb[1]) * k).toFixed(2)}px;width:${(w * k).toFixed(2)}px;height:${(h * k).toFixed(2)}px`;
      return s;
    };
    const segs = [], marks = [];
    const CAP = 1, HALF = 2.5;
    for (const c of D.conns) for (const s of c.segs) {
      const ang = Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]);
      const el = svg([-CAP, -HALF, s.len + 2 * CAP, 2 * HALF], s.a[0] - CAP, s.a[1] - HALF, s.len + 2 * CAP, 2 * HALF);
      el.style.transformOrigin = `${(CAP * k).toFixed(2)}px ${(HALF * k).toFixed(2)}px`;
      el.style.transform = `rotate(${ang.toFixed(5)}rad)`;
      el.style.clipPath = "inset(0 100% 0 0)";
      const ln = document.createElementNS(SVGNS, "line");
      ln.setAttribute("class", c.cls);
      ln.setAttribute("x1", "0"); ln.setAttribute("y1", "0"); ln.setAttribute("x2", s.len.toFixed(2)); ln.setAttribute("y2", "0");
      /* the dashes go on where the line's own left off; a solid line's corners close (square caps) */
      ln.style.strokeDashoffset = s.off.toFixed(2);
      ln.style.strokeLinecap = c.dash ? "butt" : "square";
      el.appendChild(ln);
      ink.appendChild(el);
      segs.push({ el, s });
    }
    for (const m of D.marks) {
      const p = m.pad, el = svg([m.bb.x - p, m.bb.y - p, m.bb.w + 2 * p, m.bb.h + 2 * p], m.bb.x - p, m.bb.y - p, m.bb.w + 2 * p, m.bb.h + 2 * p);
      el.style.opacity = "0";
      el.appendChild(m.node);
      ink.appendChild(el);
      marks.push({ el, m });
    }
    D.box.appendChild(ink);
    fig.classList.add("tr-on");
    /* the pen starts as the picture is half open (css/type.css: the edge rises in 1.05 s) */
    const T0 = 380;
    const LIN = "cubic-bezier(0, 0, 1, 1)";
    for (const { el, s } of segs) done(beat(el, { clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"], duration: Math.round(s.d), delay: T0 + Math.round(s.t), ease: LIN }), () => { el.style.clipPath = "none"; });
    for (const { el, m } of marks) done(beat(el, { opacity: [0, 1], duration: m.label ? 220 : 140, delay: T0 + m.t, ease: EZ.out }), () => { el.style.opacity = "1"; });
    /* still: the drawing's own connectors take over (the same vector); a resize on the way ends it at once */
    let over = false;
    const finish = () => {
      if (over) return; over = true;
      removeEventListener("resize", finish);
      D.base.classList.remove("is-tracing");
      requestAnimationFrame(() => ink.remove());
    };
    addEventListener("resize", finish);
    setTimeout(finish, T0 + Math.ceil(end) + 320);
    return true;
  }

  /* ---------------------------------------------------------------- the opening */
  const TITLE = "h1, .t-mega, .t-d1, .t-d2";
  /** is this element's CSS entrance still waiting behind the hold (so it can be claimed without a flash)? */
  function held(el) {
    const as = el.getAnimations ? el.getAnimations() : [];
    for (const a of as) {
      if (typeof CSSAnimation !== "undefined" && !(a instanceof CSSAnimation)) continue;
      const del = (a.effect && a.effect.getTiming && a.effect.getTiming().delay) || 0;
      if (a.playState === "paused" && !(+a.currentTime)) continue;   // held under a cut's sheet
      if ((+a.currentTime || 0) > del - 60) return false;
    }
    return true;
  }
  let opened = false;
  let arrStart = null;   // an arrival's opening, started by cutIn while the card clears
  function claimable(el) {
    if (el.classList.contains("mo-own")) return false;
    const ln = el.matches("[data-focus-lines]") ? $$(":scope > .ln", el) : [];
    return held(el) && ln.every(held);
  }
  /** the page's opening cue sheet: built now (everything held at its first frame), played at `start` */
  function opening(arrival) {
    if (opened || !A || !motion) return sceneName();
    opened = true;
    /* a library that came after the hold (css/motion.css --mo-safe, 0.5 s) claims nothing: the CSS entrances own the
       first screen by then, and a second entrance would be a flash. (The header is never claimed: its own CSS words
       come in at once, as at HEAD, and under a cut's sheet they wait for the sheet.) */
    if (!arrival && performance.now() > SAFE_MS - 60) return sceneName();
    const home = FX.page === "home";
    const coverLit = home && d.classList.contains("sc-on") && !d.classList.contains("gl-off");
    /* the cover's name is the stage's light: left to it (printed only without a stage: then it rises like any title) */
    let items = $$('[data-focus="load"], [data-focus-lines="load"]').filter((el) => !el.closest(".cut, .menu"))
      .filter((el) => !(coverLit && el.id === "hero-h1")).filter(claimable);
    if (!items.length) return sceneName();
    /* a small label printed above its title (a case's over-line) follows the title: the opening's first beat is the
       title, never a lone label on a dark screen */
    items = order(items);
    const parked = [];   // the beats, built paused: their first frame holds the element hidden until the start
    const at = (fn) => parked.push(fn);
    items.forEach((el) => el.classList.add("mo-own"));

    /* the first screen: a title, then its hairline, then the lead's lines and the rest */
    let t = arrival ? 0 : 40;          // ms after the start
    const foot = items.filter((el) => home && el.closest(".hero-foot"));
    const footParked = [];
    t = cueItems(items.filter((el) => !foot.includes(el)), t, at);
    /* the cover's foot (role, lead, buttons): it follows the name as the name is lit (the hall's opening lights the
       name about 1.45 s after the stage's first frame), with its own short stagger */
    if (foot.length) {
      let ft = 0;
      for (const el of foot) ft = block(el, ft, (fn) => footParked.push(fn));
    }
    const play = (list, s) => list.forEach((fn) => fn(s));
    /* when: after a cut, the sheet's leaving; else at once, or at the stage's first frame if it comes within the hold
       (the room and the title arrive together), never later than SAFE_MS - 60 (about 0.44 s after the navigation) */
    let started = false;
    const start = () => {
      if (started) return; started = true;
      arrStart = null;
      play(parked, 0);
      sceneName();
      if (!footParked.length) return;
      if (!coverLit) { play(footParked, t); return; }
      /* (lane n-flight) after a flight the hall is already lit and the eye has arrived: the foot follows the arrival
         (uncovered), not the hall's cold-load timer */
      const arr = /** @type {any} */ (window).__rvArrive;
      if (arrival && arr && arr.fly) { play(footParked, 180); return; }
      stageFrame(1900).then(() => {
        const lit = (stageOnAt || performance.now()) + 1450;
        play(footParked, Math.max(120, lit - performance.now()));
      });
    };
    /* an arrival: the title starts rising while the card is still clearing (cutIn calls arrStart halfway through the
       clear), so the first letters are coming up as the sheet leaves: no empty frame between the card and the page */
    /* (lane n-flight) a flown arrival lets data-arrive go with the room's first frame: html.cut-flown holds the text on */
    if (arrival) { arrStart = start; FX.once("nav:uncovered", start); if (!d.hasAttribute("data-arrive") && !d.classList.contains("cut-flown")) start(); }
    else stageFrame(SAFE_MS - 60).then(start);
  }
  /** run fn s ms from now; at once when s is 0 (in the task that started the sheet: nothing shows in between) */
  const later = (fn, s) => { if (s > 0) setTimeout(fn, s); else fn(); };
  /** the beats of a first screen, built paused (each element held hidden until its beat plays): a title's letters, then
   * its hairline, then the lead's lines and the rest. `at(fn)` parks a starter: fn(s) plays it s ms from then. Returns
   * the time after the last beat's start. The page's opening and (wave 7) each part of the home play one. */
  function cueItems(items, t, at) {
    for (const el of items) {
      const isTitle = el.matches(TITLE) && !el.querySelector("p, a, div");
      if (isTitle) {
        const a = lettersIn(el, t, { paused: true, restore: true });
        if (a) at((s) => later(() => a.play(), s));
        const n = letters(el).flat().length;
        const hl = el.nextElementSibling && !el.closest(".hero") ? hairline(el) : null;
        if (hl) {
          const hd = t + 260 + Math.min(n, 18) * 12;
          hl.style.transform = "scaleX(0)";
          const ha = beat(hl, { autoplay: false, transform: ["scaleX(0)", "scaleX(1)"], duration: 900, delay: hd, ease: EZ.io });
          if (ha) at((s) => later(() => ha.play(), s));
        }
        t += 300 + Math.min(n, 18) * 14;
        continue;
      }
      t = block(el, t, at);
    }
    return t;
  }
  /** an element held hidden by a parked beat (its style says so until the beat ends; print shows it: css/motion.css) */
  const hold = (els, from) => { for (const el of [].concat(els)) if (el && el.style) { el.classList.add("mo-held"); Object.assign(el.style, from); } };
  /** a label that stands right before a title in the same box goes after it */
  function order(items) {
    const out = items.slice();
    for (let i = 0; i < out.length - 1; i++) {
      const el = out[i], nx = out[i + 1];
      if (el.matches(".t-label, .cs-over") && nx.matches(TITLE) && el.parentElement === nx.parentElement) { out[i] = nx; out[i + 1] = el; i++; }
    }
    return out;
  }
  /** a block of the first screen (a lead, a container of lines and buttons): returns the next start */
  function block(el, t, at) {
    const kids = el.matches("p") ? [el] : [...el.children].filter((k) => !k.matches(".sr-only, [hidden]"));
    for (const k of kids) {
      if (k.matches(".t-lead, .t-body") && A.splitText && k.textContent.trim().length > 24) {
        t = lines(k, t, at);
      } else if (k.matches(".btn, .q") || k.querySelector(".btn, .q")) {
        const ctl = k.matches(".btn, .q") ? [k] : $$(".btn, .q", k);
        hold(ctl, { opacity: "0" });
        const a = beat(ctl, { autoplay: false, opacity: [0, 1], clipPath: ["inset(0 0 100% 0)", "inset(-0.2em -0.2em -0.2em -0.2em)"], transform: ["translate3d(0, 0.6em, 0)", REST], duration: 760, delay: (c, i) => t + i * 70, ease: EZ.rise });
        if (a) { at((s) => later(() => a.play(), s)); done(a, () => clear(ctl)); } else clear(ctl);
        t += 80 + ctl.length * 70;
      } else {
        hold(k, { opacity: "0" });
        const a = beat(k, { autoplay: false, opacity: [0, 1], transform: ["translate3d(0, 0.9rem, 0)", REST], duration: 700, delay: t, ease: EZ.rise });
        if (a) { at((s) => later(() => a.play(), s)); done(a, () => clear(k)); } else clear(k);
        t += 90;
      }
    }
    return t;
  }
  /** a paragraph's lines rise from behind their masks (anime's splitText by lines; reverted once they have risen) */
  function lines(p, t, at) {
    let split = null;
    try { split = A.splitText(p, { lines: { wrap: "clip" }, accessible: true }); } catch (e) { split = null; }
    if (!split) {
      hold(p, { opacity: "0" });
      const a = beat(p, { autoplay: false, opacity: [0, 1], transform: ["translate3d(0, 0.9rem, 0)", REST], duration: 700, delay: t, ease: EZ.rise });
      if (a) { at((s) => later(() => a.play(), s)); done(a, () => clear(p)); } else clear(p);
      return t + 90;
    }
    const t0 = t;
    let first = true, start = -1;
    /* the effect re-runs after the fonts and on a width change: only the first run animates; until the start the lines
       are held at their first frame */
    p.style.visibility = "hidden";
    split.addEffect(({ lines: ls }) => {
      if (!first) return;
      first = false;
      hold(ls, { opacity: "0", transform: "translate3d(0, 105%, 0)" });
      p.style.visibility = "";
      const a = beat(ls, { autoplay: false, transform: ["translate3d(0, 105%, 0)", REST], opacity: [0, 1], duration: 900, delay: (l, i) => t0 + i * 80, ease: EZ.rise });
      if (!a) { clear(ls); return; }
      const run = () => a.play();
      if (start >= 0) later(run, Math.max(0, start - performance.now())); else p._moRun = run;
      /* the split stays: its lines are anime's whole-word lines, and a revert would let the browser break them anew
         (a hyphen, text-wrap: pretty) under the reader's eyes; the stage on and ?stage=0 both read this split */
      done(a, () => clear(ls));
    });
    at((s) => { start = performance.now() + s; if (p._moRun) { const r = p._moRun; p._moRun = null; later(r, s); } });
    /* a split that never comes (fonts never settle): the paragraph shows anyway */
    setTimeout(() => { if (first) p.style.visibility = ""; }, 2500);
    return t + 260;
  }

  /* ---------------------------------------------------------------- the home's parts (wave 7, lane MOTION)
     The home is one continuous scroll through every page's part (parts/c-main.home.mjs). Each part opens with its page's
     own first screen (the gallery's head and lead, the stack's, Consulting's, Obla's, Contact's line, sentence, address
     and controls), and in the home that screen opens where the reader meets it, with the title sequence its page plays
     on load: the title letter by letter from behind its straight mask (a curtain only for the type the stage bends), its
     hairline, the lead's lines, the controls. Its beats are built paused while it is still a screen and a half away (its
     elements held hidden: .mo-own, which fx-scroll.js leaves to this module), and they play once, when its block (the
     title first) reaches 85 % of the view's height. A part whose text has already come in another way (the focus verb, when the library came
     late or the page was put down beside it) is left as it is. Live motion only: nothing here runs under reduced motion,
     and every printed state shows the text (css/print.css, css/motion.css .mo-held). */
  const partOf = new Map();   // a part's opening step (or its block, Contact's) -> { items, head, built, played, parked }
  /* (wave 9, J2r HEADER) A HELD CAPTION. On a phone held upright a caption scene holds each step's text at the foot of the
     view (css/scene.css "the caption at the foot") from a screen and a half before its step to a screen and a half after,
     and shows only the one whose step holds the reading line (fx-scroll.js .is-active): the others stand there, at the
     foot, clear. To an IntersectionObserver a clear held caption is on screen. capStep: the caption step an element is
     held in (a [data-cap-step] box, or a step of a caption scene) while that scene is in the caption grammar
     (FX.scroll.caption), else null; that step's .is-active says whether its caption is shown */
  const capStep = (el) => {
    const S = FX.scroll;
    if (!el || !el.closest || !S || typeof S.caption !== "function") return null;
    const st = el.closest("[data-cap-step]") || el.closest(".sc-step[data-stage-step]");
    const sc = st && st.closest(".sc");
    return st && sc && S.caption(sc) ? st : null;
  };
  function parts() {
    if (FX.page !== "home" || !motion || !A || !("IntersectionObserver" in window)) return;
    const recs = [];
    for (const part of $$("main > section.part[data-part]")) {
      const block = $(".sc-intro .sc-in, .ct-in", part);
      if (!block) continue;
      const items = $$("[data-focus], [data-focus-lines]", block).filter((el) => !(el.parentElement && el.parentElement.closest("[data-focus], [data-focus-lines]")));
      if (!items.length) continue;
      const P = { block, items, head: items[0], built: false, played: false, parked: [] };
      partOf.set(block.closest(".sc-step") || block, P);
      recs.push(P);
    }
    if (!recs.length) return;
    const near = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) { near.unobserve(e.target); partBuild(recs.find((P) => P.block === e.target)); }
    }, { rootMargin: "0px 0px 150% 0px", threshold: 0 });
    /* the title reaching 85 % plays it; the block too once its title is past that line: a jump (Back, the language's
       place, a dragged scrollbar) can land with the title above the view and the block's last lines on screen, and
       nothing on screen may stay held. (Contact's block stands a screen tall, its title low in it: the block alone
       would play the title before it is on screen.) */
    const reach = new IntersectionObserver((es) => {
      for (const e of es) {
        if (!e.isIntersecting) continue;
        const P = recs.find((R) => R.head === e.target || R.block === e.target);
        if (!P || P.played) continue;
        if (e.target === P.block && P.head.getBoundingClientRect().top > window.innerHeight * 0.85) continue;
        // (wave 9, J2r HEADER) an opening held in a caption that is not shown waits for it (at the rail's join the next
        // scene's first caption stands at the foot, clear, before the reading line reaches its step: css/scene.css "the
        // rail's join"): it plays as its caption is shown (fx:step, below), never unseen. Where the caption comes up with
        // its section (no join) it is shown before its title reaches the line: nothing changes there
        const cs = capStep(P.block);
        if (cs && !cs.classList.contains("is-active")) { P.wait = cs; continue; }
        reach.unobserve(P.head); reach.unobserve(P.block);
        partBuild(P); partPlay(P);
      }
    }, { rootMargin: "0px 0px -15% 0px", threshold: 0 });
    recs.forEach((P) => { near.observe(P.block); reach.observe(P.head); if (P.block !== P.head) reach.observe(P.block); });
    // (wave 9, J2r HEADER) fx:step goes out before the step's class moves (fx-scroll.js pick): read it a microtask later
    FX.on("fx:step", () => queueMicrotask(() => {
      for (const P of recs) {
        if (!P.wait || P.played || !P.wait.classList.contains("is-active")) continue;
        reach.unobserve(P.head); reach.unobserve(P.block);
        partBuild(P); partPlay(P);
      }
    }));
  }
  function partBuild(P) {
    if (!P || P.built) return;
    P.built = true;
    if (!A || !FX.has("motion") || P.items.some((el) => el.classList.contains("is-in"))) { P.played = true; return; }
    P.items.forEach((el) => el.classList.add("mo-own"));
    cueItems(order(P.items), 40, (fn) => P.parked.push(fn));
  }
  function partPlay(P) {
    if (!P || P.played) return;
    P.played = true;
    /* the CSS's in-view state under the beats (their elements' transitions are off), so the text stays when they end */
    P.items.forEach((el) => el.classList.add("is-in"));
    P.parked.splice(0).forEach((fn) => fn(0));
  }

  /* ---------------------------------------------------------------- the steps */
  const stepMarked = new WeakSet();
  let lastTile = null;
  /** take a scene step over from the CSS: its current state is written inline first (no jump), then .mo-step */
  function adopt(el) {
    if (stepMarked.has(el)) return;
    stepMarked.add(el);
    const shown = el.classList.contains("st-on");
    const words = $$(".rv-split .w, .rv-wipe .w", el), rows = $$(".rv-row", el);
    if (shown) {
      words.forEach((w) => { w.style.transform = "none"; w.style.clipPath = OPEN; w.style.opacity = "1"; });
      rows.forEach((r) => { r.style.opacity = "1"; r.style.transform = "none"; });
    }
    const title = $(".rv-split, .rv-wipe", el);
    if (title && title.nextElementSibling) {
      const hl = hairline(title);
      if (hl && shown) hl.style.transform = "scaleX(1)";
    }
    el.classList.add("mo-step");
  }
  function step(el, on) {
    if (!A || !motion || !el) return false;
    /* (wave 7) the opening step of a part of the home: its opening plays it the first time (parts(), above) */
    const P = partOf.get(el);
    if (P && !P.played) return true;
    adopt(el);
    const words = $$(".rv-split .w", el), wipe = $$(".rv-wipe .w", el), rows = $$(".rv-row", el), hl = $(".mo-hl", el);
    if (on) {
      /* the camera travels ~0.7 s between steps: the title starts as it leaves, lands as it arrives */
      const li = (w) => +(w.style.getPropertyValue("--li") || getComputedStyle(w).getPropertyValue("--li") || 0);
      beat(words, { transform: REST, clipPath: OPEN, duration: 780, delay: (w) => 120 + li(w) * 70, ease: EZ.rise });
      beat(wipe, { clipPath: OPEN, opacity: 1, duration: 780, delay: (w) => 120 + li(w) * 70, ease: EZ.rise });
      if (hl) beat(hl, { transform: "scaleX(1)", duration: 820, delay: 300, ease: EZ.io });
      const rd = (r) => parseFloat(r.style.getPropertyValue("--rd")) || 0;
      const ri = (r) => +(r.style.getPropertyValue("--ri") || 0);
      beat(rows, { opacity: 1, transform: REST, duration: 640, delay: (r) => 260 + rd(r) + ri(r) * 55, ease: EZ.rise });
      /* the gallery's numeral ticks from the last one */
      const n = $(".wk-n .t-acc", el);
      if (n) {
        const o = odometer(n);
        if (o) { const to = o.value; tick(o, lastTile || to, to, 200, 640); lastTile = to; }
      }
      /* (wave 6, TITLES) About's path: the years beside the line snap to their value as their step comes into focus */
      const when = $(".stp-when", el);
      if (when) snap(when, 40);
    } else {
      beat(words, { transform: DOWN, clipPath: SHUT, duration: 240, ease: EZ.in });
      beat(wipe, { clipPath: SHUT, opacity: 0, duration: 240, ease: EZ.in });
      if (hl) beat(hl, { transform: "scaleX(0)", duration: 200, ease: EZ.in });
      beat(rows, { opacity: 0, transform: "translate3d(0, 0.9rem, 0)", duration: 220, ease: EZ.in });
    }
    return true;
  }

  /* ---------------------------------------------------------------- the cut */
  const numOf = (s) => { const m = /^(\d{2})\b/.exec(String(s || "").trim()); return m ? m[1] : null; };
  function hereN() {
    /* the page being read, or (wave 7) in the home the page of the part being read (fx-nav.js .is-here) */
    const a = $('.hdr-nav a[aria-current="page"]') || $(".hdr-nav a.is-here");
    if (a) return numOf(a.getAttribute("data-pt-sub"));
    const m = $("main[data-tile]");
    if (m) return numOf(m.getAttribute("data-tile"));
    return FX.page === "home" ? "00" : null;
  }
  /** the sub line of the card: its numeral becomes an odometer standing at `from` */
  function cardSub(subEl, sub, from) {
    const n = numOf(sub);
    subEl.textContent = "";
    if (!n) { subEl.textContent = sub; return null; }
    const w = document.createElement("span"); w.className = "cut-n";
    const num = document.createElement("span"); num.textContent = n;
    w.appendChild(num);
    const rest = sub.trim().slice(2);
    subEl.appendChild(w);
    if (rest) subEl.appendChild(document.createTextNode(rest));
    const o = odometer(num);
    if (o && from && from.length === n.length) {
      o.cols.forEach((s, i) => { s.style.transform = `translate3d(0, ${-(+from[i] || 0) * 10}%, 0)`; });
      o.value = from;
    }
    return o;
  }
  /** leaving: the sheet rises (--d-cut, the camera's push), the card plays on it as one cue sheet */
  function cutOut(sheet, label, sub, fo) {
    if (!A || !motion || !sheet) return false;
    /* (lane n-flight) fo.clearAt: a flight. The card plays quicker (it is read while the door is ahead) and clears at that
       ms, before the eye is through the door: its name is never on screen with the arriving title */
    const fast = !!(fo && fo.clearAt > 0);
    const T = (parseFloat(getComputedStyle(d).getPropertyValue("--d-cut")) || 0.42) * 1000 * (fast ? 0.6 : 1);
    sheet.classList.add("mo-cut");
    const name = $("[data-cut-label]", sheet), subEl = $("[data-cut-sub]", sheet), rule = $(".cut-rule", sheet);
    name.textContent = label;
    const o = cardSub(subEl, sub, hereN());
    const chars = letters(name).flat();
    name._moLetters = null;
    sheet.classList.add("is-rising");
    beat(sheet, { transform: ["translate3d(0, 100%, 0)", REST], duration: T, ease: EZ.io });
    beat(rule, { transform: ["scaleX(0)", "scaleX(1)"], duration: T * 0.95, delay: 40, ease: EZ.io });
    beat(subEl, { opacity: [0, 1], transform: ["translate3d(0, 0.6em, 0)", REST], duration: 340, delay: 60, ease: EZ.rise });
    if (o) tick(o, o.value, numOf(sub), 90, Math.max(240, T - 120));
    const gap = fast ? Math.max(6, Math.min(12, 110 / Math.max(1, chars.length))) : Math.max(14, Math.min(30, 220 / Math.max(1, chars.length)));
    beat(chars, { transform: [DOWN, REST], clipPath: [SHUT, OPEN], duration: fast ? 260 : 380, delay: (c, i) => (fast ? 40 : 100) + i * gap, ease: EZ.rise });
    /* (lane m-fly) the page now changes while the card is still being read (a flight changes it as soon as the old
       text has left). Its clearing is therefore no timer of this page (the router takes those away with the page): it
       is the card's own elements' animations, delayed until clearAt; they travel with the sheet into the next page */
    if (fast) {
      const late = (el, kf, o) => { try { el.animate(kf, { fill: "forwards", easing: "cubic-bezier(0.55, 0, 1, 0.45)", ...o }).id = "rv-card-off"; } catch (e) { /* the sheet is cleared on arrival */ } };
      chars.forEach((c, i) => late(c, { transform: [REST, UPW], clipPath: [OPEN, GONE] }, { duration: 130, delay: fo.clearAt + i * 5 }));
      [subEl, rule].forEach((el) => late(el, { opacity: [1, 0] }, { duration: 130, delay: fo.clearAt }));
    }
    return true;
  }
  /** arriving: the card (whole on the first paint) clears upward, then the sheet leaves upward; resolves at the lift */
  function cutIn(sheet, clearMs, outMs, lift, end) {
    if (!A || !motion || !sheet) return false;
    sheet.classList.add("mo-cut");
    const name = $("[data-cut-label]", sheet), subEl = $("[data-cut-sub]", sheet), rule = $(".cut-rule", sheet);
    const chars = $$(".w", name);
    const c = beat(chars, { transform: [REST, UPW], clipPath: [OPEN, GONE], duration: clearMs, delay: (ch, i) => i * 20, ease: EZ.in });
    beat([subEl, rule], { opacity: [1, 0], duration: clearMs, ease: EZ.in });
    setTimeout(() => { if (arrStart) arrStart(); }, Math.round(clearMs * 0.5));
    /* the sheet leaves once the card has really cleared (its beat's end, not a timer: a busy first second of the page
       would start both together), never later than 400 ms */
    let gone = false;
    const leave = () => {
      if (gone) return; gone = true;
      sheet.classList.add("is-leaving");   // keeps it visible once data-arrive goes (css/motion.css)
      lift();
      /* round 13 fix: the sheet starts moving at once (no slow ease-in on an empty sheet: that read as 0.1–0.15 s of
         blank frame between the card and the page) */
      const a = beat(sheet, { transform: [REST, "translate3d(0, -100%, 0)"], duration: outMs, ease: "cubic-bezier(0.3, 0, 0.2, 1)" });
      done(a, () => { clear([sheet, subEl, rule, ...chars]); sheet.classList.remove("mo-cut"); end(); });
    };
    /* the sheet goes as the card's words are halfway up (they ride on the sheet, so they never meet the page's title) */
    setTimeout(leave, Math.round(clearMs * 0.6));
    done(c, leave);
    setTimeout(leave, 400);
    return true;
  }

  /* ---------------------------------------------------------------- the menu */
  function menuOpen(menu) {
    if (!A || !motion || !menu) return false;
    const rows = $$(".menu-a", menu);
    const foot = $(".menu-foot", menu);
    /* a close leaves its last frame committed inline: the opening starts from its own first frame */
    clear([...rows.map((a) => $(".t-d1", a)), ...rows.map((a) => $(".menu-n", a)), foot].filter(Boolean));
    rows.forEach((a, i) => {
      const t = $(".t-d1", a), n = $(".menu-n", a);
      done(beat(t, { transform: [DOWN, REST], clipPath: [SHUT, OPEN], duration: 820, delay: 110 + i * 60, ease: EZ.rise }), () => clear(t));
      /* the numeral is part of its row: it rises with the word, behind the same kind of mask, and lands with it (no
         count of its own: a tick after the rows had landed read as an effect sprinkled on) */
      if (n) done(beat(n, { transform: [DOWN, REST], clipPath: ["inset(-0.2em -0.1em 104% -0.1em)", "inset(-0.2em -0.1em -0.3em -0.1em)"], duration: 820, delay: 110 + i * 60, ease: EZ.rise }), () => clear(n));
    });
    beat(foot, { opacity: [0, 1], transform: ["translate3d(0, 0.9rem, 0)", REST], duration: 640, delay: 110 + rows.length * 60 + 80, ease: EZ.rise });
    return true;
  }
  /** closing: the rows go up behind their masks, the last first, while the sheet's edge goes up (--d-sheet-out) */
  function menuClose(menu) {
    if (!A || !motion || !menu) return false;
    const out = (parseFloat(getComputedStyle(d).getPropertyValue("--d-sheet-out")) || 0.28) * 1000;
    const rows = $$(".menu-a", menu).reverse();
    rows.forEach((a, i) => {
      const parts = [$(".t-d1", a), $(".menu-n", a)].filter(Boolean);
      beat(parts, { transform: [REST, UPW], clipPath: [OPEN, GONE], duration: Math.max(140, out * 0.6), delay: i * 18, ease: EZ.in });
    });
    beat($(".menu-foot", menu), { opacity: [1, 0], duration: out * 0.5, ease: EZ.in });
    return true;
  }

  /* ---------------------------------------------------------------- the hand */
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const PRESS = ".btn, .q, .hdr-nav a, .hdr-name, .hdr-menu, .lang-alt, .menu-a, .copy, .ix-a, .cs-more-a";
  function hand() {
    /* a press has weight: down 1 px and in by 3 %, fast; it comes back slower, with a little life */
    document.addEventListener("pointerdown", (e) => {
      const el = e.target && e.target.closest ? e.target.closest(PRESS) : null;
      if (!el || e.button !== 0) return;
      beat(el, { transform: "translate3d(0, 1px, 0) scale(0.97)", duration: 110, ease: EZ.press });
      const up = () => {
        removeEventListener("pointerup", up, true); removeEventListener("pointercancel", up, true);
        const a = beat(el, { transform: "translate3d(0, 0, 0) scale(1)", duration: 320, ease: "cubic-bezier(0.34, 1.4, 0.64, 1)" });
        done(a, () => clear(el, ["transform"]));
      };
      addEventListener("pointerup", up, true); addEventListener("pointercancel", up, true);
    }, { passive: true });
    /* the arrow of a button or a quiet link leaves the way it points and comes back in from behind (a fine pointer,
       or the keyboard's focus) */
    const arrow = (el) => {
      const svg = el && $(":scope > svg", el);
      if (!svg || svg._mo) return;
      svg._mo = true;
      const diag = !!svg.querySelector('path[d^="M7 17"]'), upw = !!svg.querySelector('path[d^="M12 19"]');
      const out = diag ? "translate3d(0.7em, -0.7em, 0)" : upw ? "translate3d(0, -0.8em, 0)" : "translate3d(0.8em, 0, 0)";
      const back = diag ? "translate3d(-0.7em, 0.7em, 0)" : upw ? "translate3d(0, 0.8em, 0)" : "translate3d(-0.8em, 0, 0)";
      const rest = diag ? "translate3d(0.18em, -0.18em, 0)" : upw ? "translate3d(0, -0.25em, 0)" : "translate3d(0.25em, 0, 0)";
      const a = beat(svg, { transform: out, opacity: 0, duration: 170, ease: EZ.in });
      done(a, () => {
        const b = beat(svg, { transform: [back, rest], opacity: [0, 1], duration: 380, ease: EZ.rise });
        done(b, () => { svg._mo = false; clear(svg); });
      });
    };
    document.addEventListener("pointerover", (e) => {
      if (!fine.matches) return;
      const el = e.target && e.target.closest ? e.target.closest(".btn, .q") : null;
      if (!el || (e.relatedTarget && el.contains(e.relatedTarget))) return;
      arrow(el);
    }, { passive: true });
    document.addEventListener("focusin", (e) => {
      const el = e.target && e.target.matches && e.target.matches(".btn, .q") ? e.target : null;
      if (el && el.matches(":focus-visible")) arrow(el);
    });
  }
  /** the copy's confirmation: the word rises from its mask, a hairline is drawn under it */
  function copied(b) {
    if (!A || !motion || !b) return;
    const w = b.getAttribute("data-state") === "fail" ? $("[data-copy-fail]", b) : $("[data-copy-done]", b);
    if (w) done(beat(w, { transform: ["translate3d(0, 0.8em, 0)", REST], clipPath: ["inset(0 0 100% 0)", "inset(-0.2em -0.1em -0.3em -0.1em)"], duration: 420, ease: EZ.rise }), () => clear(w));
    let hl = $(".copy-hl", b);
    if (!hl) { hl = document.createElement("span"); hl.className = "copy-hl"; hl.setAttribute("aria-hidden", "true"); b.appendChild(hl); }
    /* drawn as the word lands, held while it reads, gone with it (fx-nav clears the word at 2.6 s) */
    done(beat(hl, { transform: ["scaleX(0)", "scaleX(1)"], duration: 520, ease: EZ.io }), () => {
      setTimeout(() => beat(hl, { transform: "scaleX(0)", duration: 240, ease: EZ.in }), 1800);
    });
  }

  /* ---------------------------------------------------------------- the header's scene name */
  let named = false;
  function sceneName() {
    if (named) return; named = true;
    const box = $("[data-hdr-scene]");
    if (!box || !("IntersectionObserver" in window)) return;
    const tEl = $(".hdr-scene-t", box), rEl = $(".hdr-scene-r", box);
    /* (wave 6, TITLES) below 1024 px the name of the scene stands under the header's name, which rises to make room
       (css/motion.css .hdr.has-scene); the header says so while a name stands */
    const hdr = box.closest(".hdr");
    const secs = $$("main section.sc[aria-labelledby], main > section[aria-labelledby]");
    const nameOf = (s) => {
      if (s.matches(".hero")) return "";
      const h = document.getElementById(s.getAttribute("aria-labelledby"));
      if (!h) return "";
      /* the heading's words as one line: a <br> or a line box between its lines is a space (textContent would glue
         "WAYS" to "TO"); decoration and duplicates for readers are left out */
      const c = h.cloneNode(true);
      /* (wave 8, FIX2D) and a heading that is a chapter's folio (a case's record) leaves its index: the header names the
         scene in words ("The record", not "05 The record"), as for every other chapter */
      c.querySelectorAll(".mo-hl, [aria-hidden='true'], .cs-folio > .t-acc").forEach((n) => n.remove());
      c.querySelectorAll("br").forEach((n) => n.replaceWith(" "));
      c.querySelectorAll(".ln, .w, .mo-w").forEach((n) => n.append(" "));
      return c.textContent.replace(/\s+/g, " ").trim();
    };
    /* (wave 8, FIX2D) a name longer than the room the header leaves it gives way to the scene's short form
       (data-scene-short on the section: parts/strings.mjs, parts/cases.json, a case's own name), never to a smaller
       type: below 1024 px about 200 px stand between the name's rule and MENU. The room is the box less its rule and
       gap, read from layout (the rule's entrance is a transform); the name is measured in the label's own face by a
       hidden probe in the box, once per name shown and again after a resize */
    let probe = null;
    const fits = (txt) => {
      if (!probe) {
        probe = document.createElement("span");
        probe.setAttribute("aria-hidden", "true");
        probe.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;pointer-events:none";
        box.appendChild(probe);
      }
      probe.textContent = txt;
      const room = box.clientWidth - (rEl ? rEl.offsetWidth : 0) - (parseFloat(getComputedStyle(box).columnGap) || 0);
      return probe.getBoundingClientRect().width <= room + 0.5;
    };
    const label = (s) => {
      const full = nameOf(s), short = (s.getAttribute("data-scene-short") || "").trim();
      return !full || !short || fits(full) ? full : short;
    };
    let cur = null, pend = 0, here = null, rz = 0, seq = 0;
    const show = (txt) => {
      if (txt === cur) return;
      const first = cur === null, my = ++seq;
      cur = txt;
      clearTimeout(pend);
      const swap = () => {
        /* (wave 9, J2r HEADER) only the latest name is put in: a name whose swap waits on its 200 ms out still ran after a
           later name had been set at once (the label already empty), and put the earlier name back for good (a quick walk
           to Contact and a jump to the top kept "Obla" over the hero: HEAD 2 loads in 14, .shots/j-rail hrace2.mjs) */
        if (my !== seq) return;
        tEl.textContent = txt;
        box.toggleAttribute("data-empty", !txt);
        if (hdr) hdr.classList.toggle("has-scene", !!txt);
        if (!txt) return;
        done(beat(tEl, { transform: ["translate3d(0, 100%, 0)", REST], clipPath: ["inset(0 0 100% 0)", "inset(-0.2em 0 -0.3em 0)"], duration: 560, ease: EZ.rise }), () => clear(tEl));
        if (first && rEl) beat(rEl, { transform: ["scaleX(0)", "scaleX(1)"], duration: 600, ease: EZ.io });
      };
      if (first || !tEl.textContent) { swap(); return; }
      const out = beat(tEl, { transform: [REST, "translate3d(0, -100%, 0)"], clipPath: ["inset(-0.2em 0 -0.3em 0)", "inset(100% 0 -0.3em 0)"], duration: 200, ease: EZ.in });
      done(out, swap);
    };
    /* the name stands in the header only while the scene's own heading is off the screen: it says where the reader is
       once the title has gone, never twice at once */
    const seen = new Map(), headOn = new Map();
    const heads = secs.map((s) => document.getElementById(s.getAttribute("aria-labelledby"))).filter(Boolean);
    /* both observers report once before the first decision: a section seen before its heading's own report would put
       the name in the header for a frame while the title is still on screen */
    let reports = heads.length ? 0 : 1;
    /* (wave 7, lane MOTION) ... and only once that heading has gone up: a scene whose top has passed the middle while
       its heading is still to come from below (in the home, the gallery right after Now's text) has no name yet */
    /* (wave 9, J2r HEADER) ... and a heading held in a caption (a phone held upright: the gallery's head, Now's first
       caption, any caption scene) is gone exactly while its caption is not the one shown, wherever its box stands: held
       clear at the foot it was "on screen" to the observer and below the middle, and the header named no scene through
       the gallery's first works and Now's second and third captions. The header names the scene whose caption is shown */
    const gone = (h) => {
      if (!h) return true;
      const cs = capStep(h);
      if (cs) return !cs.classList.contains("is-active");
      return !headOn.get(h) && h.getBoundingClientRect().bottom < window.innerHeight / 2;
    };
    /* (wave 9, J2r HEADER) the caption scene being read is the one whose caption is shown (fx-scroll.js: the step whose
       box holds the reading line, clientHeight / 2; at most one scene at a time), not the section the observer's middle
       line crosses (innerHeight / 2: under Safari's bar the two part by up to half the bar, and the header named the
       scene before while the next one's caption stood at the foot) */
    const capMid = () => secs.find((s) => { const S = FX.scroll; return !!(S && typeof S.caption === "function" && S.caption(s) && s.querySelector("[data-cap-step].is-active, .sc-step[data-stage-step].is-active")); });
    const update = () => {
      if (reports < 2) return;
      const mid = capMid() || secs.find((s) => seen.get(s));
      const h = mid && document.getElementById(mid.getAttribute("aria-labelledby"));
      here = mid && gone(h) ? mid : null;
      show(here ? label(here) : "");
    };
    /* a turned phone or a resized window: the same scene may now need (or no longer need) its short form */
    addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { if (here) show(label(here)); }, 180); }, { passive: true });
    let ioIn = false, hoIn = false;
    const io = new IntersectionObserver((es) => { for (const e of es) seen.set(e.target, e.isIntersecting); if (!ioIn) { ioIn = true; reports++; } update(); },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 });
    const ho = new IntersectionObserver((es) => { for (const e of es) headOn.set(e.target, e.isIntersecting); if (!hoIn) { hoIn = true; reports++; } update(); },
      { rootMargin: "-72px 0px 0px 0px", threshold: 0 });
    secs.forEach((s) => io.observe(s));
    heads.forEach((h) => ho.observe(h));
    /* (wave 9, J2r HEADER) a caption handing over moves no box the observers see: the name follows the caption shown
       (fx:step goes out before the step's class moves, fx-scroll.js pick: read a microtask later) */
    FX.on("fx:step", () => queueMicrotask(update));
  }

  /* ---------------------------------------------------------------- the module */
  let prepared = Promise.resolve(null);
  const api = {
    get prepared() { return prepared; },
    get live() { return !!A && motion && FX.has("motion"); },
    ready: (ms = 0) => (!FX.has("motion") ? Promise.resolve(null) : ms ? within(load(), ms) : load()),
    step, cutOut, cutIn, menuOpen, menuClose, copied, odometer, tick,
    /* (wave 6, TITLES) the years that snap, the drawing that traces itself */
    snap, traceLoad, trace,
  };
  FX.mo = api;
  FX.register("motion", {
    init(ctx) {
      if (!motion) return;
      /* the opening: claimed as soon as the library and the fonts are in; an arrival plays it when its sheet leaves,
         and fx-nav's arrive() waits (at most 300 ms) for it to be claimed before the card clears (FX.mo.prepared) */
      const arrival = ctx && ctx.entry === "arrive";
      prepared = load().then((ok) => {
        if (!ok) return null;
        hand();
        return FX.fonts(arrival ? 500 : 200).then(() => { opening(arrival); parts(); return true; });
      });
    },
  });
})();
