/* ==========================================================================
   rv-router.js · the Astro build's router (lane o-router; plan 70 phase 3, Alberto's first choice: separate pages, the
   3D kept alive between them). Printed by components/Router.astro on every page of web/dist; the assembled pages
   (public/proto/rivista/*.html) never load it, and every fx-* script behaves there exactly as before.

   Pages stay documents of their own (addresses, Back, Forward, deep links, a reload). What survives a navigation is the
   stage: its canvas, its GPUDevice and pipelines, its swarm, its eye, its portal. Then a cut is ONE flight: the eye flies
   into a plate of glass, the page changes under the glass, the eye comes out into the new room.

   How:
   · Astro's client router (astro:transitions/client: navigate, swapFunctions) fetches and swaps; no browser view
     transition (document.startViewTransition is shadowed before the router loads: the browser would freeze rendering
     and snapshot the canvas), fallback "swap".
   · Every page gets a fresh script realm: the old page's listeners on window, document, <html> and every non-node target
     (media queries, fonts, the GPU device), its observers, intervals, animation frames and its longer timeouts are
     recorded as it adds them and taken away when it leaves (FX.leave first: the stage hands itself over, Lenis, the
     ScrollTriggers and the tweens go). Then gsap, ScrollTrigger, Lenis and fx-core … fx-stage run again, as on a load.
     Timeouts under 50 ms are left to fire (the stage's texture queue and its pipelines chain on setTimeout 0).
   · Our own swap (astro:before-swap): root attributes, head, body, with the stage's canvas and the cut's sheet carried
     into the new body (transition:persist by attribute, moveBefore where the browser has it), then the head's boot
     classes again (window.__rvHead, parts/head.html) with the arrival this cut carries.
   · Between the old page's last frame and the new page's first, a bridge keeps the kept stage drawing (frame only).
   · A page in another folder (the language link, en <-> it/) has its relative head links and images written absolute
     when it is parsed: Astro preloads and swaps before it moves the address bar.
   · THE WAY BACK: a throw anywhere in the swap, or no FX ready 5 s after it, is a plain navigation to the same address.
   ========================================================================== */

const d = document.documentElement;
const ET = EventTarget.prototype;
const O = {
  add: ET.addEventListener, rem: ET.removeEventListener,
  st: window.setTimeout.bind(window), ct: window.clearTimeout.bind(window),
  si: window.setInterval.bind(window), ci: window.clearInterval.bind(window),
  raf: window.requestAnimationFrame.bind(window), caf: window.cancelAnimationFrame.bind(window),
};
const DEBUG = /[?&]debug=1/.test(location.search);
const log = (...a) => { if (DEBUG) console.log("[router]", ...a); };

/* no browser view transition: the router reads this once, when it loads */
try { Object.defineProperty(document, "startViewTransition", { value: undefined, configurable: true, writable: true }); } catch (e) { /* read-only: the router uses it */ }

/* ---------------------------------------------------------------- the page's realm */
const R = {
  L: new Map(),          // target -> Set of [type, fn, capture]
  T: new Set(), I: new Set(), F: new Set(), OB: new Set(),
  quiet: 0,              // > 0 while persistent code (Astro's router) is loading: its listeners are not the page's
};
const tracked = (t) => t === window || t === document || t === d || !(t instanceof Node);
const capOf = (o) => (typeof o === "boolean" ? o : !!(o && o.capture));
ET.addEventListener = function (type, fn, opts) {
  if (fn && !R.quiet && tracked(this) && !(opts && typeof opts === "object" && opts.once && (type === "load" || type === "DOMContentLoaded"))) {
    let s = R.L.get(this); if (!s) R.L.set(this, (s = new Set()));
    s.add([type, fn, capOf(opts)]);
  }
  return O.add.call(this, type, fn, opts);
};
ET.removeEventListener = function (type, fn, opts) {
  const s = R.L.get(this);
  if (s) { const c = capOf(opts); for (const e of s) if (e[0] === type && e[1] === fn && e[2] === c) { s.delete(e); break; } }
  return O.rem.call(this, type, fn, opts);
};
window.setTimeout = function (fn, ms, ...a) {
  const long = +ms >= 50;
  const id = O.st(typeof fn === "function" ? (...x) => { R.T.delete(id); fn(...x); } : fn, ms, ...a);
  if (long) R.T.add(id);
  return id;
};
window.clearTimeout = (id) => { R.T.delete(id); O.ct(id); };
window.setInterval = function (fn, ms, ...a) { const id = O.si(fn, ms, ...a); R.I.add(id); return id; };
window.clearInterval = (id) => { R.I.delete(id); O.ci(id); };
window.requestAnimationFrame = (fn) => { const id = O.raf((t) => { R.F.delete(id); fn(t); }); R.F.add(id); return id; };
window.cancelAnimationFrame = (id) => { R.F.delete(id); O.caf(id); };
for (const name of ["ResizeObserver", "IntersectionObserver", "MutationObserver"]) {
  const Base = window[name];
  if (typeof Base !== "function") continue;
  window[name] = class extends Base { constructor(cb, o) { super(cb, o); if (!R.quiet) R.OB.add(this); } disconnect() { R.OB.delete(this); return super.disconnect(); } };
}
/** the counts of what the page holds now (a probe reads them: twenty navigations must not grow them) */
function counts() {
  let listeners = 0;
  for (const s of R.L.values()) listeners += s.size;
  const G = window.gsap, ST = window.ScrollTrigger;
  return {
    listeners, timeouts: R.T.size, intervals: R.I.size, frames: R.F.size, observers: R.OB.size,
    triggers: ST && ST.getAll ? ST.getAll().length : 0,
    tweens: G && G.globalTimeline ? G.globalTimeline.getChildren(true, true, true).length : 0,
    lenis: window.FX && window.FX.lenis ? 1 : 0,
    canvases: document.querySelectorAll("canvas").length,
    stage: window.__stageHost && window.__stageHost.info ? window.__stageHost.info() : null,
  };
}
/** the old page goes: everything it registered with the realm */
function purge() {
  for (const [t, s] of R.L) for (const [type, fn, cap] of s) { try { O.rem.call(t, type, fn, cap); } catch (e) { /* gone */ } }
  R.L.clear();
  for (const id of R.T) O.ct(id); R.T.clear();
  for (const id of R.I) O.ci(id); R.I.clear();
  for (const id of R.F) O.caf(id); R.F.clear();
  for (const o of R.OB) { try { o.disconnect(); } catch (e) { /* gone */ } } R.OB.clear();
}

/* ---------------------------------------------------------------- the scripts of a page */
const J0 = window.__rvJs || {};
const LIST = (J0.list || []).map((u) => new URL(u, location.href).href);
const PERSIST = "data-astro-transition-persist";
let job = null;          // the flight fx-nav started: { arrival, covered }
let swapped = null;      // the navigation being finished: { to, arrival, traverse, y }
let fallbackT = 0;

function runPageScripts(to) {
  const J = window.__rvJs = { done: false, boot: null, t0: performance.now(), t1: 0, list: J0.list };
  let left = LIST.length;
  const end = () => { if (--left) return; J.done = true; J.t1 = performance.now(); if (typeof J.boot === "function") J.boot(); };
  for (const u of LIST) {
    const s = document.createElement("script");
    s.src = u; s.async = false; s.onload = s.onerror = end;
    s.dataset.astroExec = "";   // Astro's runScripts must not run them a second time
    document.head.appendChild(s);
  }
  /* THE WAY BACK: a page whose scripts never booted is loaded for real */
  O.ct(fallbackT);
  fallbackT = O.st(() => { if (!(window.FX && window.FX.isReady)) { log("no FX ready 5 s after the swap: reload"); location.replace(to); } }, 5000);
}

/* the stage keeps drawing (frame only: the glass, the swarm as mist) while no page drives it */
function bridge(K) {
  if (!K || !K.stage) return;
  const b = { on: true, stop() { b.on = false; } };
  K.bridge = b;
  let last = 0;
  const loop = (t) => {
    if (!b.on) return;
    const dt = last ? Math.min(0.1, (t - last) / 1000) : 1 / 60; last = t;
    try { K.stage.frame(dt); } catch (e) { b.on = false; }
    O.raf(loop);
  };
  O.raf(loop);
}

/** the card's name as words in boxes (parts/a-overlays.html does it on a load): the arriving half clears them */
function cardWords(sheet, label) {
  const l = sheet && sheet.querySelector("[data-cut-label]");
  if (!l) return;
  l.getAnimations({ subtree: true }).forEach((a) => { try { a.cancel(); } catch (e) { /* ignore */ } });
  l.textContent = "";
  String(label || "").split(/\s+/).filter(Boolean).forEach((w, i) => {
    if (i) l.appendChild(document.createTextNode(" "));
    const e = document.createElement("span"); e.className = "w"; e.textContent = w; l.appendChild(e);
  });
}

/** relative URLs the browser fetches as soon as the element is inserted, written absolute against `base` */
function absolutize(doc, base) {
  const rel = (v) => v && !/^([a-z][a-z0-9+.-]*:|\/\/|#|\/)/i.test(v);
  const one = (el, a) => { const v = el.getAttribute(a); if (rel(v)) el.setAttribute(a, new URL(v, base).href); };
  const set = (el, a) => {
    const v = el.getAttribute(a); if (!v) return;
    el.setAttribute(a, v.split(",").map((part) => { const m = part.trim().split(/\s+/); if (rel(m[0])) m[0] = new URL(m[0], base).href; return m.join(" "); }).join(", "));
  };
  doc.head.querySelectorAll("link[href]").forEach((el) => one(el, "href"));
  doc.querySelectorAll("script[src]").forEach((el) => one(el, "src"));
  doc.body.querySelectorAll("img[src], source[src], video[src], audio[src]").forEach((el) => one(el, "src"));
  doc.body.querySelectorAll("video[poster]").forEach((el) => one(el, "poster"));
  doc.querySelectorAll("img[srcset], source[srcset], link[imagesrcset]").forEach((el) => set(el, el.hasAttribute("srcset") ? "srcset" : "imagesrcset"));
}

/* Astro parses the fetched page and preloads its stylesheets before the swap: the page of another folder is written
   absolute as soon as it is parsed (navTo: the address of the navigation under way, set in before-preparation) */
let navTo = null;
const dirOf = (p) => p.slice(0, p.lastIndexOf("/") + 1);
{
  const parse = DOMParser.prototype.parseFromString;
  DOMParser.prototype.parseFromString = function (s, type) {
    const doc = parse.call(this, s, type);
    try { if (navTo && type === "text/html" && dirOf(new URL(navTo).pathname) !== dirOf(location.pathname)) absolutize(doc, navTo); } catch (e) { /* a plain parse */ }
    return doc;
  };
}

/* (lane m-fly) THE PAGE CHANGES IN STEPS, each a task of its own with a frame between, so the stage (drawn by the bridge)
   goes on presenting frames through the change: (1) the old page leaves (leaveOld: its modules, its realm; the bridge
   takes the stage), run from the loader as soon as the frame may change; (2) the DOM is swapped (swapPage); (3) the
   scripts run again, one task each, and the page boots in its own phases (fx-core.js). `left`: step 1 is done for the
   navigation under way. THE WAY BACK: a page that left and was not swapped 3 s later is loaded for real. */
let left = false, leftT = 0;
function leaveOld(to, href) {
  if (left) return;
  left = true;
  const arrival = (job && job.arrival && job.arrival.to === to) ? job.arrival : null;
  /* (lane n-flight) the nav events' contract: fx:nav:covered { to } when the page changes */
  try { if (arrival && (arrival.fly || arrival.portal) && window.FX && window.FX.emit) window.FX.emit("fx:nav:covered", { to }); } catch (e) { /* ignore */ }
  /* the old page leaves: its modules (the stage hands itself over), then its realm */
  try { if (window.FX && typeof window.FX.leave === "function") window.FX.leave(); } catch (e) { log("leave threw", e); }
  purge();
  const K = window.__rvKeep || null;
  if (K) bridge(K);
  O.ct(leftT);
  if (href) leftT = O.st(() => { if (left) { log("left and never swapped: a plain navigation"); location.replace(href); } }, 3000);
}

function swapPage(SF, doc, ev) {
  const arrival = (job && job.arrival && job.arrival.to === ev.to.pathname) ? job.arrival : null;
  /* 1 the old page leaves (already done by the loader's step on a cut), then whatever its realm still holds */
  leaveOld(ev.to.pathname, "");
  job = null; left = false; O.ct(leftT);
  purge();
  const K = window.__rvKeep || null;
  /* (lane m-fly) a flight changes the page while the eye is still in the room it leaves. Where the ground changes (a
     view with the morning in it, or Contact ahead) the ground that room stood on stays under the canvas, beside the
     body (the swap leaves it alone), until the door of glass hides the frame: fx-stage.js drops it at its takeover */
  try {
    document.querySelectorAll(".cut-ground").forEach((e) => e.remove());
    const day = arrival && arrival.fly ? (arrival.day | 0) : 0;
    if (arrival && arrival.fly && K && (day || doc.documentElement.getAttribute("data-ground") === "dawn")) {
      const g = document.createElement("div");
      g.className = "cut-ground"; g.setAttribute("aria-hidden", "true");
      if (day === 2) g.style.background = "var(--dawn)";
      else if (day === 1) { const i = document.createElement("i"); i.style.top = (arrival.top | 0) + "px"; g.appendChild(i); }
      d.appendChild(g);
    }
  } catch (e) { /* the ground changes with the page */ }
  /* 2 what persists: the stage's canvas, and the cut's sheet while a card is on it */
  const canvas = K && K.canvas;
  if (canvas) {
    canvas.setAttribute(PERSIST, "rv-stage");
    const ph = doc.createElement("canvas"); ph.setAttribute(PERSIST, "rv-stage"); doc.body.appendChild(ph);
  }
  const sheet = document.querySelector("[data-cut]"), nsheet = doc.querySelector("[data-cut]");
  if (arrival && sheet && nsheet) { sheet.setAttribute(PERSIST, "rv-cut"); nsheet.setAttribute(PERSIST, "rv-cut"); }
  /* 3 Astro's swap, step by step. Astro moves the address bar only after the swap: a page in another folder (the language
     link, en <-> it/) would have its relative head links and images resolved against the old address (../fx.css from
     the root is /proto/fx.css). Those are written absolute against the new address first; same-folder pages are untouched */
  if (dirOf(ev.to.pathname) !== dirOf(location.pathname)) absolutize(doc, ev.to.href);   // done at the parse; a redirect lands here
  navTo = null;
  /* (lane o-fix) the page's own inline scripts never run on a soft swap: the head's boot is the same function in both
     editions but its text differs (the Italian list starts at ../), so Astro would run it again on the first swap
     between folders (a second loader, a second adapter and boot.js, a second fx-stage that builds its own stage while
     the kept one draws the old page). __rvHead and runPageScripts do that work here */
  doc.querySelectorAll("script:not([src])").forEach((s) => { s.dataset.astroExec = ""; });
  SF.deselectScripts(doc);
  SF.swapRootAttributes(doc);
  SF.swapHeadElements(doc);
  const restore = SF.saveFocus();
  SF.swapBodyElement(doc.body, document.body);
  restore();
  if (canvas) canvas.removeAttribute(PERSIST);
  if (sheet) {
    sheet.removeAttribute(PERSIST);
    /* (lane n-flight) a flight: the page changes a breath before the door, the card still clearing. Whatever is left of
       it goes in 90 ms (an animation of this realm: the old page's are gone with it); the sheet itself is clear */
    /* (lane m-fly) a flight: the page changes while the card is still being read. The card goes on: its clearing is
       an animation of its own elements, delayed (fx-motion.js cutOut), and they are carried over with the sheet */
    if (arrival && arrival.fly) { /* nothing: the card plays on */ }
    else if (arrival) cardWords(sheet, arrival.label);
    else { sheet.className = "cut"; sheet.removeAttribute("style"); }
  }
  /* 4 the head's boot classes, with the arrival */
  if (typeof window.__rvHead === "function") window.__rvHead(arrival);
  /* (lane m-fly) a flight toward Contact: no sheet of paper over the frame (the morning arrives as an edge of day the
     stage sweeps across, seen through the door's glass) */
  if (arrival && arrival.fly) d.removeAttribute("data-cut-dawn");
  if (arrival && arrival.portal && !arrival.dawn) d.classList.add("cut-soft");
  /* (lane n-flight) a flight: the card cleared at the door; the sheet stays clear and empty while the eye flies in */
  if (arrival && arrival.fly) d.classList.add("cut-soft", "cut-flown");
  if (K && !d.classList.contains("gl-off")) d.classList.add("stage-on");
  swapped = { to: ev.to.href, arrival, traverse: ev.navigationType === "traverse" };
}

/* ---------------------------------------------------------------- start */
R.quiet++;
import("astro:transitions/client").then((T) => {
  R.quiet--;
  const SF = T.swapFunctions;
  let traverseY = null;

  /** a soft navigation (fx-nav calls it for a cut, with its flight) */
  function go(href, j) {
    job = j || null;
    T.navigate(href).catch((e) => { log("navigate failed", e); location.href = href; });
  }
  window.__rvRouter = { go, counts, get keep() { return window.__rvKeep || null; }, version: 1 };

  /* a plain link (no cut: the language link, a list on the 404, reduced motion): the router swaps the page, no flight */
  O.add.call(window, "click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download") || a.hasAttribute("data-astro-reload")) return;
    let u; try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (u.origin !== location.origin || !/(\.html|\/)$/.test(u.pathname)) return;
    if (u.pathname === location.pathname && u.search === location.search) return;   // an anchor on this page
    e.preventDefault();
    if (job) return;   // (lane o-fix) a flight is under way: its own navigation carries the arrival
    go(u.href, null);
  });

  /* (lane n-flight) THE DESTINATION AHEAD: at pointerenter, focus or touchstart on a link to another page its HTML is
     fetched (the HTTP cache serves Astro's own fetch) and its scenes' modules imported, so the swap rarely waits */
  /** @type {Map<string, Promise<string>>} */ const warm = new Map();
  const stageBase = () => { const s = document.querySelector('script[src*="fx-stage.js"]'); return s ? new URL("stage/", s.src).href : null; };
  const ahead = (e) => {
    const a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    let u; try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (u.origin !== location.origin || !/(\.html|\/)$/.test(u.pathname) || u.pathname === location.pathname) return;
    const key = u.pathname + u.search;
    if (warm.has(key) || warm.size > 40) return;
    R.quiet++;
    try {
      /* (lane m-fly) the text is kept: the navigation parses it itself instead of fetching the page a second time (a
         round trip to the server at the click, for a page the browser must revalidate) */
      const p = fetch(u.href, { credentials: "same-origin" }).then((r) => (r.ok && !r.redirected && /text\/html/.test(r.headers.get("content-type") || "") ? r.text() : "")).catch(() => "");
      warm.set(key, p);
      p.then((html) => {
        if (!html) { warm.delete(key); return; }
        const base = stageBase();
        if (!base) return;
        const names = new Set([...html.matchAll(/data-stage="([a-z0-9-]+)"/g)].map((m) => m[1]));
        if (/<main[^>]*data-case/.test(html)) names.add("mist");
        names.forEach((n) => { import(base + "scenes/" + n + ".js").catch(() => {}); });
      });
    } finally { R.quiet--; }
  };
  for (const n of ["pointerover", "pointerdown", "focusin", "touchstart"]) O.add.call(document, n, ahead, { passive: true, capture: true });

  O.add.call(document, "astro:before-preparation", (ev) => {
    navTo = ev.to.href;
    /* Back / Forward: the same flight, mirrored */
    if (ev.navigationType === "traverse") {
      traverseY = history.state && typeof history.state.scrollY === "number" ? history.state.scrollY : null;
      job = null;
      try { const FX = window.FX; if (FX && FX.nav && typeof FX.nav.fly === "function") job = FX.nav.fly(ev.to.href, ev.direction === "back" ? -1 : 1); } catch (e) { job = null; }
    } else traverseY = null;
    const covered = job && job.covered;
    const load = ev.loader;
    /* (lane m-fly) the page fetched ahead (pointerover, pointerdown, focus, touchstart) is parsed here, at the click:
       no second fetch. Not for a page in another folder (its stylesheet's address differs: Astro's loader preloads it),
       a form, or a page that was never fetched ahead: Astro's own loader then */
    const key = ev.to.pathname + ev.to.search;
    const pre = !ev.formData && dirOf(ev.to.pathname) === dirOf(location.pathname) ? warm.get(key) : null;
    warm.delete(key);
    const page = async () => {
      let html = "";
      try { html = pre ? await pre : ""; } catch (e) { html = ""; }
      if (html && !ev.signal.aborted) {
        try {
          const doc = new DOMParser().parseFromString(html, "text/html");
          doc.querySelectorAll("noscript").forEach((el) => el.remove());
          if (doc.querySelector('[name="astro-view-transitions-enabled"]')) { ev.newDocument = doc; return; }
        } catch (e) { /* Astro's loader */ }
      }
      await load();
    };
    if (!covered) { ev.loader = page; return; }
    /* the swap waits for the page AND for the frame to be free to change (a flight: the old text has left; else the
       sheet or the glass covers it), never more than 900 ms for the latter; then the old page leaves in a task of its
       own, a frame before the DOM changes */
    ev.loader = async () => {
      await Promise.all([page(), Promise.race([covered, new Promise((r) => O.st(r, 900))])]);
      if (ev.defaultPrevented || ev.signal.aborted || !ev.newDocument) return;
      leaveOld(ev.to.pathname, ev.to.href);
      await new Promise((r) => { let done = false; const go = () => { if (!done) { done = true; r(null); } }; O.raf(() => O.st(go, 0)); O.st(go, 80); });
    };
  });

  O.add.call(document, "astro:before-swap", (ev) => {
    ev.swap = () => {
      try { swapPage(SF, ev.newDocument, ev); }
      catch (e) { console.warn("[router] the swap failed: a plain navigation", e); location.replace(ev.to.href); throw e; }
    };
  });

  O.add.call(document, "astro:after-swap", () => {
    const s = swapped; swapped = null;
    if (!s) return;
    const go = () => {
      try {
        window.__rvSoftY = s.traverse && traverseY !== null ? traverseY : null;
        runPageScripts(s.to);
        log("swapped", s.to, counts());
      } catch (e) { console.warn("[router] the new page did not start: a plain navigation", e); location.replace(s.to); }
    };
    /* (k-fix3d) a flight: the new page's scripts start a frame after the swap. The swap's style and layout (the home is
       the longest page) and the boot's own work were one frame of 49 to 70 ms while the eye flew (Contact -> home,
       200 ms after the click); now the swap is one frame and the boot the next */
    if (s.arrival && s.arrival.fly) O.raf(() => O.st(go, 0)); else go();
  });
}).catch((e) => { R.quiet = 0; log("router not loaded: plain navigations", e); });
