/* ==========================================================================
   fx-core.js · owner WP-A · read-only for WP-B and WP-C (plan §9, amendments §2, §3)

   The FX namespace: flags, event bus, Lenis on the single GSAP ticker, the
   ref-counted lock, fonts, module registry and the boot order.

   Script order (parts/head.html): gsap, ScrollTrigger, lenis, fx-core, fx-scroll, fx-nav, fx-motion, fx-stage. The
   head script's loader inserts them after the first frame with async=false, which keeps this order; they run after the
   document is parsed. SplitText, CustomEase and fx-hero.js left with the magazine: the eases are GSAP's core ones.
   At load a module only calls FX.register(name, { init, build, onResize }).

   Boot, once all eight scripts have settled (window.__rvJs, MC-33; DOMContentLoaded on a page without the loader):
     1 flags, link sync, plugins, CustomEase domus / domus.inOut / rv.out / dtIn,
       ScrollTrigger.config({ ignoreMobileResize: true }), FX.motion read from css/tokens.css
     2 Lenis on gsap.ticker, with the wheel lead clamp (MC-14); FX.lock("entry") under data-arrive
     3 init(ctx) in the order scroll, nav, then any other module (stage), each in try/catch
     4 await FX.fonts(an arrival ? 900 : 1500)
     5 build(ctx) in the same order, ScrollTrigger.refresh(), the reader's place across an RM reload (MC-16),
       emit fx:built
     6 entry: data-arrive -> FX.nav.arrive()
       · else FX.ready("plain"). A missing owner function means a plain entry.
     7 a live change of prefers-reduced-motion writes the reader's place (rv-place) and reloads the page

   Switches: ?fx=core,nav runs only the listed modules (core is always on) · ?gl=0 forces html.gl-off (no stage:
   the printed page; applied by the head script). The issue is V1 "Carta e cobalto": the compare variants are gone.

   A module that throws gets html.fx-fail-<name> and one console.warn; a module
   that is switched off gets html.fx-off-<name>. Either way its content must
   stay visible: hidden states are set by gsap.set inside the module only.
   ========================================================================== */
(() => {
  "use strict";

  const d = document.documentElement;
  const G = window.gsap || null;
  const ST = window.ScrollTrigger || null;
  const hasG = !!(G && ST);
  const ORDER = ["scroll", "nav"];
  const STICKY = new Set(["fx:ready", "fx:built", "fx:nav:landed"]); // late listeners still get these
  /* the one superfamily (css/fonts.css): display, text, labels */
  const FONTS = ['800 1em "Sofia Sans Extra Condensed"', '400 1em "Sofia Sans"', '500 1em "Sofia Sans"', '600 1em "Sofia Sans Condensed"'];

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const warn = (...a) => console.warn("[fx]", ...a);
  const params = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(); } })();

  /* ---------------------------------------------------------------- flags */
  const mq = {
    motion: matchMedia("(prefers-reduced-motion: no-preference)"),
    fine: matchMedia("(hover: hover) and (pointer: fine)"),
    touch: matchMedia("(pointer: coarse)"),
    desktop: matchMedia("(min-width: 1024px)"),
  };
  const flags = {
    get motion() { return mq.motion.matches; },
    get fine() { return mq.fine.matches; },
    get touch() { return mq.touch.matches; },
    get desktop() { return mq.desktop.matches; },
    get gl() { return !d.classList.contains("gl-off"); },   // the stage may draw (WebGPU, no ?gl=0, not the 404): the head script decides
  };

  /* ------------------------------------------------------------ event bus */
  const fired = new Map(); // sticky event name -> detail
  const evName = (n) => (n.startsWith("fx:") ? n : "fx:" + n);
  function on(evt, fn, opts) {
    const name = evName(evt);
    const once = !!(opts && opts.once);
    if (STICKY.has(name) && fired.has(name)) {
      queueMicrotask(() => fn(fired.get(name), null));
      if (once) return () => {};
    }
    const h = (e) => fn(e.detail, e);
    window.addEventListener(name, h, { once });
    return () => window.removeEventListener(name, h);
  }
  function emit(evt, detail = {}) {
    const name = evName(evt);
    if (name === "fx:ready") { ready(detail && detail.entry); return; } // fx:ready fires once, through FX.ready
    if (STICKY.has(name)) { if (fired.has(name)) return; fired.set(name, detail); }
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  /* ---------------------------------------------------------------- links */
  const KEEP = ["fx", "gl", "stage", "blocks", "exit", "debug", "tier"]; // capture switches and A/B sides (?exit=in, R3) travel with internal links
  /* S2 chrome (audit B2): the address bar and the internal links stay exactly as authored. The capture switches travel
     only when they are already in the URL, and nothing is ever replaced into the reader's address bar */
  function syncLinks() {
    const carry = KEEP.filter((k) => params.has(k));
    if (carry.length) document.querySelectorAll("a[href]").forEach((a) => {
      const h = a.getAttribute("href");
      if (!h || /^(https?:|mailto:|tel:|#)/.test(h) || !/\.html/.test(h)) return;
      const u = new URL(h, location.href);
      carry.forEach((k) => u.searchParams.set(k, params.get(k)));
      /* IT edition: the path stays as authored and only the query is rewritten. Keeping the file name alone sent the
         language link ("../index.html", "it/index.html") back to its own edition, and un-rooted the 404's links */
      a.setAttribute("href", h.split(/[?#]/)[0] + u.search + u.hash);
    });
  }
  function fonts(ms = 1500) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.race([
      Promise.all(FONTS.map((f) => document.fonts.load(f).catch(() => null))).then(() => document.fonts.ready),
      wait(ms),
    ]);
  }

  /* ------------------------------------------------------- motion tokens */
  /* Motion canon §3, twinning rule: the CSS custom properties of css/tokens.css are the single source.
     They are read once in boot (and again on a width change, in place, so held references stay live)
     into FX.motion = { D, E, S }: D and S in seconds (numbers), E as GSAP ease names. */
  const D_NAMES = ["press", "micro", "hover", "exit", "roll", "wipe", "zoom", "reveal", "title", "travel", "name", "media", "rm", "cap"];
  const S_NAMES = ["char", "word", "line", "lead", "item", "block", "col"];
  const EASE_NAMES = { out: "expo.out", io: "power3.inOut", soft: "power2.out", xio: "expo.inOut", in: "power2.in", linear: "none" };
  const motion = {
    D: {}, S: {}, E: { ...EASE_NAMES },
    bezier: {},      // the four control numbers of each CSS ease, e.g. bezier.io = [0.66, 0, 0.22, 1]
    tempo: 1,
    exit: (st) => Math.max(0.02, (+st || 0) / 2), // every exit stagger: entry / 2, min 0.02 s
  };
  const secs = (v) => {
    v = String(v || "").trim();
    const n = parseFloat(v);
    if (!isFinite(n)) return NaN;
    return /ms$/.test(v) ? n / 1000 : n;
  };
  const bez = (v) => {
    const m = /cubic-bezier\(([^)]+)\)/.exec(String(v || ""));
    if (!m) return null;
    const a = m[1].split(",").map((x) => parseFloat(x));
    return a.length === 4 && a.every(isFinite) ? a : null;
  };
  function readMotion() {
    let cs = null;
    try { cs = getComputedStyle(d); } catch (e) {}
    const prop = (n) => (cs ? cs.getPropertyValue(n) : "");
    D_NAMES.forEach((n) => { const s = secs(prop("--d-" + n)); if (isFinite(s)) motion.D[n] = s; });
    S_NAMES.forEach((n) => { const s = secs(prop("--st-" + n)); if (isFinite(s)) motion.S[n] = s; });
    ["out", "io", "soft", "xio", "in"].forEach((n) => { const b = bez(prop("--ease-" + n)); if (b) motion.bezier[n] = b; });
    const t = parseFloat(prop("--tempo"));
    motion.tempo = isFinite(t) && t > 0 ? t : 1;
    return motion;
  }

  /* ---------------------------------------------------------------- Lenis */
  let lenis = null;
  /* MC-14 (canon R-01, §0 Q1: x1, no x0.7 side). The flick lead clamp: a wheel event may not push the target more
     than L = 0.5625 * innerHeight ahead of the drawn scroll, so a hard flick cannot run ahead of the eye while one
     notch (100 px) is untouched. Wheel only: touch stays native (syncTouch false); ctrl+wheel is the browser's zoom.
     lenis 1.3.26 hands `data` to this hook before it destructures it (onVirtualScroll), so the mutation is honoured.
     It never reverses or pulls back a lead that is already longer (an anchor glide in flight): it only stops adding.
     A fully clamped event keeps a token 0.01 px, because a zero delta makes Lenis return before preventDefault and
     the browser would then scroll that event natively, under the glide. */
  const LEAD = 0.5625;
  function leadClamp(data) {
    const e = data && data.event;
    if (!lenis || !e || e.ctrlKey || !/wheel/.test(e.type) || !data.deltaY) return true;
    const L = LEAD * window.innerHeight;
    const lead = lenis.targetScroll - lenis.animatedScroll;
    const dy = data.deltaY;
    let next = Math.max(-L, Math.min(L, lead + dy)) - lead;
    if (next * dy <= 0) next = Math.sign(dy) * 0.01;
    data.deltaY = next;
    return true;
  }
  function initLenis() {
    if (!hasG || !window.Lenis || !flags.motion) return;
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, anchors: false, autoRaf: false, virtualScroll: leadClamp });
    lenis.on("scroll", ST.update);
    G.ticker.add((time) => lenis.raf(time * 1000)); // the single ticker: no second rAF anywhere
    G.ticker.lagSmoothing(0);
  }
  /* a scrollTo target in document px, resolved as lenis 1.3.26 resolves it: keywords, then an element's top minus its
     scroll-margin-top and the root's scroll-padding-top (css/base.css gives every [id] a scroll margin) */
  const targetY = (target) => {
    if (typeof target === "number") return target;
    if (target === "top" || target === "start" || target === "#") return 0;
    if (target === "bottom" || target === "end") return Math.max(0, d.scrollHeight - window.innerHeight);
    let el = null;
    try { el = typeof target === "string" ? (target.startsWith("#") ? document.getElementById(target.slice(1)) : document.querySelector(target)) : target; } catch (e) {}
    if (!el || typeof el.getBoundingClientRect !== "function") return null;
    const m = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    const p = parseFloat(getComputedStyle(d).scrollPaddingTop) || 0;
    return el.getBoundingClientRect().top + window.scrollY - m - p;
  };
  /* MC-14 (canon R-19): a glide eases domus.inOut (gsap.parseEase: CustomEase.get is not guaranteed to return a
     function) over 1.1 s (--d-travel) for up to 1.5 viewports of travel, else 1.4 s (--d-media, the anchor-glide
     cap); opts.duration only lowers it. The jump across the S3 stage and the rail runway is MC-24 (lane N). */
  function glideEase() {
    try {
      const f = G && G.parseEase ? G.parseEase(motion.E.io) : null;   // E.io falls back to a core ease without CustomEase
      return typeof f === "function" ? f : undefined;
    } catch (e) { return undefined; }
  }
  function scrollTo(target, opts = {}) {
    const { immediate = false, offset = 0 } = opts;
    const y0 = targetY(target);
    if (y0 === null) return;
    const y = y0 + offset;
    if (lenis) {
      if (immediate) { lenis.scrollTo(y, { immediate: true, force: true }); return; }
      const far = Math.abs(y - lenis.animatedScroll) > 1.5 * window.innerHeight;
      let duration = far ? motion.D.media : motion.D.travel;
      if (typeof opts.duration === "number" && opts.duration > 0) duration = Math.min(duration, opts.duration);
      lenis.scrollTo(y, { duration, easing: glideEase(), force: true });
      return;
    }
    window.scrollTo(0, y);
  }

  /* ----------------------------------------------------------------- lock */
  const holds = new Map(); // reason -> count
  const lockCount = () => { let n = 0; holds.forEach((c) => (n += c)); return n; };
  function applyLock(reason) {
    const locked = lockCount() > 0;
    if (locked === d.hasAttribute("data-fx-locked")) return;
    /* read before write (MC-31): Lenis' stop/start resets and reads scrollTop, so it runs before the lock attribute and
       the inert <main> invalidate the whole document; after them the read forced a style and layout in the click task */
    if (lenis) locked ? lenis.stop() : lenis.start();
    d.toggleAttribute("data-fx-locked", locked);
    const main = document.getElementById("main");
    if (main) main.inert = locked;
    emit("fx:lock", { locked, reason });
  }
  function lock(reason = "anon") { holds.set(reason, (holds.get(reason) || 0) + 1); applyLock(reason); }
  function unlock(reason = "anon") {
    if (reason === "*") holds.clear(); // full reset (A: six seconds after an aborted navigation, bfcache restore)
    else {
      const c = holds.get(reason) || 0;
      if (c <= 1) holds.delete(reason); else holds.set(reason, c - 1);
    }
    applyLock(reason);
  }

  /* ------------------------------------------------------------- registry */
  const mods = new Map();   // name -> module object
  const state = {};         // name -> "off" | "registered" | "init" | "built" | "fail"
  const allow = (() => {
    const raw = params.get("fx");
    if (raw == null) return null; // no parameter: everything runs
    return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean).concat("core"));
  })();
  const live = (name) => state[name] === "init" || state[name] === "built";
  function register(name, mod) {
    if (mods.has(name)) { warn(`module "${name}" registered twice; the second one is ignored`); return; }
    mods.set(name, mod || {});
    state[name] = "registered";
  }
  function names() {
    const extra = [...mods.keys()].filter((n) => !ORDER.includes(n));
    return ORDER.filter((n) => mods.has(n)).concat(extra);
  }
  function fail(name, phase, err) {
    state[name] = "fail";
    d.classList.add("fx-fail-" + name);
    if (name === "scroll") d.classList.remove("rv-ready"); // the reveal base must not keep content hidden
    warn(`module "${name}" failed in ${phase}; its content stays static.`, err);
  }
  function each(hook, arg) {
    for (const name of names()) {
      if (!live(name)) continue;
      const fn = mods.get(name)[hook];
      if (typeof fn !== "function") continue;
      try { fn(arg); } catch (err) { warn(`module "${name}" threw in ${hook}`, err); }
    }
  }
  /* MC-31 (4x CPU): an arrival builds one module per task, so the arrival's own work (fx:built,
     fx:nav:arrived, fx:ready) is not one 200+ ms task. The first paint is already covered on those entries. */
  const yieldTask = () => (window.scheduler && typeof window.scheduler.yield === "function")
    ? window.scheduler.yield()
    : new Promise((r) => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });   // no clamped timer (MC-08)
  /* S2 fix (S4 back seam, MC-07): the tasks above are short, but before the first paint they all land in ONE animation
     frame: on the home that frame grew to 100-115 ms with the S2 chapters (the gate is 100), and the travelling
     capture stood still for it (two slides). On a covered entry, once the frame has run FRAME_SLICE ms, the next
     module boundary waits for the frame to be painted (the cover is all a reader sees) and goes on in a new one. A
     fast build never takes the extra frame. A hidden tab has no frames: there the wait is a task, as before. */
  const FRAME_SLICE = 32;
  let frame0 = performance.now();
  const yieldFrame = () => document.hidden ? yieldTask() : new Promise((r) => {
    let done = false;
    const go = () => { if (done) return; done = true; document.removeEventListener("visibilitychange", go); yieldTask().then(r); };
    requestAnimationFrame(go);
    document.addEventListener("visibilitychange", go);
  });
  const yieldBuild = async () => {
    if (performance.now() - frame0 > FRAME_SLICE) { await yieldFrame(); frame0 = performance.now(); } else await yieldTask();
  };
  async function phase(which, ctx, next) {
    let first = true;
    for (const name of names()) {
      if (which === "build" && ctx.entry !== "plain" && !first) await yieldBuild();
      first = false;
      if (which === "init") {
        if (allow && !allow.has(name)) { state[name] = "off"; d.classList.add("fx-off-" + name); continue; }
      } else if (state[name] !== "init") continue;
      const fn = mods.get(name)[which];
      try {
        if (typeof fn === "function") {
          const r = fn(ctx);
          if (r && typeof r.then === "function") {
            // a module may be async, but it may not stall the boot
            const slow = await Promise.race([r.then(() => false), wait(3000).then(() => true)]);
            if (slow) warn(`module "${name}" ${which} is still pending after 3 s; boot continues`);
          }
        }
        state[name] = next;
      } catch (err) { fail(name, which, err); }
    }
  }

  /* ---------------------------------------------------------------- ready */
  let readyDone = false;
  let entryTimer = 0;
  /* The owner calls FX.ready("arrive") when its entry film hands the page over (fx-nav.js).
     Releases the entry lock (Lenis starts, <main> is interactive), then emits fx:ready once.
     The owner removes its own state attribute (data-arrive) before calling it. */
  function ready(entry = "plain") {
    if (readyDone) return;
    readyDone = true;
    clearTimeout(entryTimer);
    d.classList.remove("sc-hold"); // the case hero's first-paint hold (head script): owners hold their own states by now
    d.classList.remove("rv-rhold"); // the reload's hold, if the boot never reached its restore step
    unlock("entry");
    const detail = { entry };
    fired.set("fx:ready", detail);
    window.dispatchEvent(new CustomEvent("fx:ready", { detail }));
  }
  function plainEntry(why) {
    if (why) warn(why);
    d.removeAttribute("data-arrive");
    ready("plain");
  }

  /* ----------------------------------------------------------- whenStill */
  /* FX.whenStill(fn, { timeout }) runs fn once the page is still: no scroll event for 120 ms, Lenis not
     smooth-scrolling, and no overlay owns the page (no data-arrive or data-fx-locked, and
     no nav cover between fx:nav:start|covered and fx:nav:uncovered|reset|arrived). Stillness must hold for
     two consecutive ticks of the one gsap.ticker (no rAF of its own). If already still, fn runs on the
     second tick, never synchronously. timeout (ms, optional) runs fn anyway once it elapses. Returns a
     cancel function. A throwing fn is caught and warned. */
  let lastScrollAt = -1e9, navMoving = false;
  window.addEventListener("scroll", () => { lastScrollAt = performance.now(); }, { passive: true });
  ["fx:nav:start", "fx:nav:covered"].forEach((n) => window.addEventListener(n, () => { navMoving = true; }));
  ["fx:nav:uncovered", "fx:nav:reset", "fx:nav:arrived"].forEach((n) => window.addEventListener(n, () => { navMoving = false; }));
  function isStill() {
    if (performance.now() - lastScrollAt < 120) return false;
    if (lenis && lenis.isScrolling === "smooth") return false;
    if (navMoving) return false;
    return !(d.hasAttribute("data-arrive") || d.hasAttribute("data-fx-locked"));
  }
  function whenStill(fn, opts = {}) {
    if (typeof fn !== "function") return () => {};
    let done = false, hits = 0, to = 0, tick = null;
    const stop = () => {
      done = true;
      clearTimeout(to);
      if (tick) { if (G) G.ticker.remove(tick); else clearInterval(tick); tick = null; }
    };
    const run = () => {
      if (done) return;
      stop();
      try { fn(); } catch (err) { warn("whenStill callback threw", err); }
    };
    if (opts.timeout > 0) to = setTimeout(run, opts.timeout);
    const check = () => { if (done) return; hits = isStill() ? hits + 1 : 0; if (hits >= 2) run(); };
    if (G) { tick = check; G.ticker.add(tick); }
    else tick = setInterval(check, 50); // static page (no GSAP): nothing animates, a short poll suffices
    return stop;
  }

  /* ---------------------------------------------------------------- place */
  /* MC-16 (canon R-02 rule 7). A live change of prefers-reduced-motion reloads the page (every module's films and
     splits would otherwise need a live Lenis <-> native swap). Before the reload the reader's place is written to
     sessionStorage "rv-place": the first section (main > section, or the footer) still on screen, how far into it
     (ratio of its height), the path, and a stamp. The head script skips S1 when a fresh record is there; boot jumps
     to it after the first refresh, because the other motion mode lays the sticky stages out at other heights, so
     the browser's own restore of scrollY lands elsewhere. The record lives 10 s and is read once.
     The place is SAMPLED while the page is still (150 ms after the last scroll event, and at fx:ready), never read
     in the change handler: when the media query reports the change, the other mode's rules already apply and the
     layout has reflowed under the reader (the rail runway read 0.95 instead of 0.5). */
  const PLACE_KEY = "rv-place";
  const placeEls = () => [...document.querySelectorAll("main > section, footer")];
  function readPlace() {
    if (window.scrollY < 4) return { top: true };
    const els = placeEls();
    for (let i = 0; i < els.length; i++) {
      const r = els[i].getBoundingClientRect();
      if (r.bottom > 0 && r.height > 0) return { i, r: Math.min(1, Math.max(0, -r.top / r.height)) };
    }
    return null;
  }
  let placeNow = null, placeT = 0;
  const samplePlace = () => { try { placeNow = readPlace(); } catch (e) {} };
  window.addEventListener("scroll", () => { clearTimeout(placeT); placeT = setTimeout(samplePlace, 150); }, { passive: true });
  on("fx:ready", () => { setTimeout(samplePlace, 0); });
  function savePlace(to = location.pathname) {
    try {
      const p = placeNow || readPlace();
      if (!p || p.top) { sessionStorage.removeItem(PLACE_KEY); return; }
      sessionStorage.setItem(PLACE_KEY, JSON.stringify({ i: p.i, r: p.r, to, t: Date.now() }));
    } catch (e) {}
  }
  /* IT edition (spec 30 §1.6): a change of language keeps the reader's place. The two editions are built from the same
     parts, so "the nth section, this far into it" is the same place in both; the record is written for the other
     edition's path when the language link is followed (capture phase: before fx-nav starts its cut, or before the
     browser navigates when there is no script behind the link), and boot puts it back under the arriving sheet
     exactly as it does after a motion-mode reload (takePlace). At the top of a page nothing is written. */
  document.addEventListener("click", (e) => {
    const a = e.target && e.target.closest ? e.target.closest("a[data-lang]") : null;
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    try { savePlace(new URL(a.href, location.href).pathname); } catch (err) {}
  }, true);
  function takePlace() {
    try {
      const p = JSON.parse(sessionStorage.getItem(PLACE_KEY) || "null");
      sessionStorage.removeItem(PLACE_KEY);
      if (p && p.to === location.pathname && Date.now() - p.t < 10000 && Number.isInteger(p.i) && isFinite(p.r)) return p;
    } catch (e) {}
    return null;
  }
  /* R-02 rule 3 (reload mid-page): Chrome restores a reload through a serialized scroll anchor, before build; the pin
     spacers build inserts above it then move the page by scroll anchoring (mid-rail: +2000 px). The reader's y is kept
     on pagehide and put back after build + ST.refresh() when the native restore landed elsewhere. */
  const Y_KEY = "rv-y|" + location.pathname;   // per page: a back/forward finds its own record, not the last page's
  window.addEventListener("pagehide", () => {
    try { sessionStorage.setItem(Y_KEY, JSON.stringify({ y: Math.round(window.scrollY), w: window.innerWidth, t: Date.now() })); } catch (e) {}
  });
  function takeReloadY() {
    try {
      const r = JSON.parse(sessionStorage.getItem(Y_KEY) || "null");
      sessionStorage.removeItem(Y_KEY);
      const nav = performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
      const ttl = nav && nav.type === "reload" ? 60000 : nav && nav.type === "back_forward" ? 600000 : 0;
      /* an arrival is placed by its cut. The one exception is the head script's own 'back' (a browser back/forward
         with no rv-pt record, so no label): nothing else places it, and its S5 cover hides the jump */
      const ar = d.getAttribute("data-arrive"), bare = ar === "back" && !!nav && nav.type === "back_forward" && !(window.__rvArrive && window.__rvArrive.label);
      if (!r || !ttl || location.hash || (ar && !bare)) return null;
      if (r.w !== window.innerWidth || Date.now() - r.t > ttl || !isFinite(r.y)) return null;
      return r.y;
    } catch (e) { return null; }
  }
  /* R-02 rule 5: a fresh load with a hash lands on its target. The fragment jump ran on the pre-build layout, before the
     pin spacers existed (#work landed 900 px short); after build the target is aimed again (scroll-margin, clamped) */
  function hashY() {
    if (location.hash.length < 2 || d.hasAttribute("data-arrive")) return null;
    let el = null;
    try { el = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) {}
    if (!el) return null;
    const m = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    const max = Math.max(0, d.scrollHeight - window.innerHeight);
    return Math.max(0, Math.min(max, Math.round(el.getBoundingClientRect().top + window.scrollY - m)));
  }
  function restorePlace(p) {
    const el = placeEls()[p.i];
    if (!el) return;
    const r = el.getBoundingClientRect();
    restoreY(Math.max(0, Math.round(r.top + window.scrollY + p.r * r.height)));
  }
  function restoreY(y) {
    const sc = live("scroll") && FX.scroll && typeof FX.scroll.restore === "function" ? FX.scroll : null;
    if (sc) { try { sc.restore({ y }); return; } catch (e) { warn("place restore threw; jumping", e); } }
    scrollTo(y, { immediate: true });
    window.scrollTo(0, y);
    try { if (ST) ST.update(); } catch (e) {}
  }

  /* --------------------------------------------------------------- resize */
  let lastW = window.innerWidth, lastH = window.innerHeight, rsz = 0;
  function onResize() {
    clearTimeout(rsz);
    rsz = setTimeout(() => {
      const w = window.innerWidth, h = window.innerHeight;
      if (w === lastW && h === lastH) return;
      const detail = { w, h, widthChanged: w !== lastW };
      lastW = w; lastH = h;
      if (detail.widthChanged) readMotion(); // --st-col changes at 768 px
      each("onResize", detail);
      emit("fx:resize", detail);
    }, 200);
  }

  /* ------------------------------------------------------------- language */
  /* IT edition (spec 30 §2.4). The page says its language (html[lang], written by assemble.mjs). The few words a script
     writes are printed in that language by the build as #rv-i18n (parts/strings.mjs, "js.*"): FX.t("pre.water") is
     "Water" or "Acqua", FX.t("instr.gpu", { ms }) fills its {ms}. A key the page does not carry returns itself and
     warns (the clean-console gate then fails). FX.num writes a number as the language does: 1.2 or 1,2. */
  const lang = d.getAttribute("lang") || "en";
  const words = (() => { try { return JSON.parse((document.getElementById("rv-i18n") || {}).textContent || "{}"); } catch (e) { return {}; } })();
  function t(key, vars) {
    const s = words[key];
    if (typeof s !== "string") { warn("no string for " + key + " on this page"); return key; }
    return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m)) : s;
  }
  function num(n, digits = 0) {
    try { return new Intl.NumberFormat(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n); }
    catch (e) { return Number(n).toFixed(digits); }
  }

  /* ------------------------------------------------------------ namespace */
  const FX = {
    flags,
    lang, t, num,    // IT edition: the page's language, a word a script writes, a number written as the language does
    on,
    once: (evt, fn) => on(evt, fn, { once: true }),
    emit,
    get lenis() { return lenis; },
    scrollTo,
    motion,          // { D, E, S, bezier, tempo, exit() }: motion canon §3, read from css/tokens.css
    whenStill,
    get still() { return isStill(); },
    lock, unlock,
    get locked() { return lockCount() > 0; },
    fonts,
    register,
    exits: [],
    /* awaits every registered exit (A calls it before a cut); a throwing exit never blocks the cut */
    runExits(detail = {}) {
      return Promise.all(FX.exits.map((fn) => { try { return Promise.resolve(fn(detail)).catch(() => null); } catch (e) { return null; } }));
    },
    hero: null, scroll: null, nav: null, // filled by their owners inside init()
    // additions to plan §9 (documented in the scaffold notes)
    syncLinks,
    ready,
    get isReady() { return readyDone; },
    /* rivista-story spec 20: the page of the issue, written by assemble.mjs on <html data-page>: home (the cover), work,
       about, consult, obla, contact, case, 404 */
    get page() { return d.getAttribute("data-page") || (d.hasAttribute("data-home") ? "home" : "case"); },
    get modules() { return { ...state }; },
    has: (name) => live(name),
    /* a module that slices its own build on a covered entry (fx-scroll) yields through this, so its slices share the
       boot's frame budget (S2 fix, MC-07 seam) */
    yieldBuild,
    /* (lane o-router) the page leaves under the Astro build's router (web/src/router/rv-router.js), the document stays:
       every module's leave() (the stage hands itself over), then Lenis, the ScrollTriggers, the matchMedia contexts and
       every tween go. The router then takes away what is left (listeners, observers, timers, the ticker) and runs the
       scripts again for the next page. */
    leave() {
      if (left) return; left = true;
      for (const name of names()) {
        const fn = mods.get(name) && mods.get(name).leave;
        if (typeof fn === "function") { try { fn(); } catch (err) { warn(`module "${name}" threw in leave`, err); } }
      }
      try { if (lenis) lenis.destroy(); } catch (e) {}
      lenis = null;
      try { if (bootCtx && bootCtx.mm) bootCtx.mm.revert(); } catch (e) {}
      try { if (ST) ST.getAll().forEach((t) => t.kill()); } catch (e) {}
      try { if (G) { G.globalTimeline.getChildren(true, true, true).forEach((c) => c.kill()); G.ticker.sleep(); } } catch (e) {}
      clearTimeout(entryTimer);
    },
    version: "night-1",
  };
  window.FX = FX;
  let left = false, bootCtx = null;

  /* ----------------------------------------------------------------- boot */
  async function boot() {
    syncLinks();
    mq.motion.addEventListener("change", () => { savePlace(); location.reload(); });
    window.addEventListener("resize", onResize, { passive: true });
    /* FIX A8: crossing the 1024 px breakpoint rebuilds the pins and the rail, which used to throw
       the reader back to the top. Registered before any gsap.matchMedia listener, so it reads the
       reader's place first: the first section still on screen and how far into it they were. */
    let bpT = 0, anchor = null, rsAt = -1e9, anchorAt = -1e9;
    const readAnchor = () => {
      for (const s of document.querySelectorAll("main > section, footer")) {
        const r = s.getBoundingClientRect();
        if (r.bottom > 0 && r.height > 0) return { el: s, ratio: Math.min(1, Math.max(0, -r.top / r.height)), y: window.scrollY };
      }
      return null;
    };
    /* the place is sampled while the reader scrolls (at most every 200 ms), never during a resize:
       by the time the breakpoint's change event fires, the browser may already have moved the page */
    window.addEventListener("resize", () => { rsAt = performance.now(); }, { passive: true, capture: true });
    let anchorT = 0;
    window.addEventListener("scroll", () => {
      const now = performance.now();
      if (now - rsAt < 700) return;
      /* a trailing sample too: the throttle alone missed where a scroll came to rest */
      clearTimeout(anchorT);
      anchorT = setTimeout(() => { if (performance.now() - rsAt >= 700) { anchorAt = performance.now(); anchor = readAnchor(); } }, 150);
      if (now - anchorAt < 200) return;
      anchorAt = now; anchor = readAnchor();
    }, { passive: true });
    /* (x-drive, 2026-11-11) not only the 1024 px breakpoint: any change of width (a phone turned to landscape and back,
       a window dragged narrower) relays the scenes out at other heights, and the browser keeps the old scrollY, or
       clamps it on a shorter page; turning the phone back then left the reader pages away from where they were. The
       same anchor is put back after every width change. While the menu holds the page (Lenis stopped, the root
       clipped) the page cannot be moved: the anchor waits for the unlock. */
    let anchorW = window.innerWidth;
    const putBack = (a) => {
      if (d.hasAttribute("data-fx-locked")) { on("fx:lock", () => putBack(a), { once: true }); return; }
      try { if (ST) ST.refresh(); } catch (e) {}
      const r = a.el.getBoundingClientRect();
      const y = Math.max(0, Math.round(r.top + window.scrollY + a.ratio * r.height));
      if (Math.abs(y - window.scrollY) > 2) {
        scrollTo(y, { immediate: true });
        window.scrollTo(0, y);
        try { if (ST) ST.update(); } catch (e) {}
      }
      anchor = readAnchor();
    };
    window.addEventListener("resize", () => {
      if (window.innerWidth === anchorW) return;
      anchorW = window.innerWidth;
      const a = anchor;
      clearTimeout(bpT);
      if (!a || a.y < 4) return;
      bpT = setTimeout(() => putBack(a), 450);
    }, { passive: true });

    const entry = d.hasAttribute("data-arrive") ? "arrive" : "plain";
    readMotion();

    if (!hasG) {
      // CDN down or blocked: the page stays a complete static document
      for (const n of names()) { state[n] = "off"; d.classList.add("fx-off-" + n); }
      d.classList.add("fx-static");
      plainEntry("GSAP is missing: static page, no module was started");
      return;
    }

    G.registerPlugin(ST);
    ST.config({ ignoreMobileResize: true });

    initLenis();
    if (entry !== "plain") {
      lock("entry");
      // guarded safety: an entry film that never hands over must not leave the page locked
      entryTimer = setTimeout(() => { if (!readyDone) plainEntry("entry film did not call FX.ready within 6 s: forced plain entry"); }, 6000);
    }

    const ctx = {
      FX, gsap: G, ScrollTrigger: ST,
      mm: G.matchMedia(),          // shared gsap.matchMedia(): put hidden states inside a motion-ok query
      page: FX.page, entry,
      arrive: window.__rvArrive || null,
    };
    bootCtx = ctx;

    await phase("init", ctx, "init");
    await fonts(entry === "plain" ? 1500 : 900);
    await phase("build", ctx, "built");
    if (entry !== "plain") await yieldBuild();   // the refresh is the build's last and heaviest step: its own frame when the build ran long
    ST.refresh();
    const place = takePlace(), reloadY = takeReloadY(), hy = place ? null : hashY();
    /* (lane o-router) Back / Forward under the router: the reader's y from the history entry, on this layout */
    const softY = typeof window.__rvSoftY === "number" ? window.__rvSoftY : null;
    window.__rvSoftY = null;
    if (softY !== null && !place && hy === null) restoreY(softY);
    else if (place) restorePlace(place);   // MC-16: the same section, the same ratio, in this motion mode's layout
    else if (hy !== null && Math.abs(window.scrollY - hy) > 2) restoreY(hy);   // R-02 rule 5
    else if (hy === null && reloadY !== null && Math.abs(window.scrollY - reloadY) > 2) restoreY(reloadY);   // R-02 rules 3 and 4 (no bfcache)
    /* R-02 rule 3: a plain entry whose native restore already landed is still printed at its targets (the scrubs and
       the rail snapped, the rail captions printed: nothing catches up on screen after the hold lifts) */
    else if (entry === "plain" && window.scrollY > 2) restoreY(Math.round(window.scrollY));
    d.classList.remove("rv-rhold");   // the reload's first-paint hold (head script): the page stands where it belongs
    emit("fx:built", {});
    if (entry !== "plain") await yieldTask(); // MC-31: the entry film starts in its own task

    const call = (owner, fnName) => {
      const api = FX.has(owner) ? FX[owner] : null;
      if (!api || typeof api[fnName] !== "function") return false;
      try {
        const r = api[fnName]();
        if (r && typeof r.catch === "function") r.catch((err) => { fail(owner, fnName, err); plainEntry(); });
        return true;
      } catch (err) { fail(owner, fnName, err); return false; }
    };
    if (entry === "arrive" && call("nav", "arrive")) return;
    plainEntry();
  }

  /* MC-33: under the head script's loader, DOMContentLoaded has already fired and fx-scroll … fx-stage have not run yet:
     boot when the loader says all ten scripts have settled (it calls __rvJs.boot from the last one's load or error) */
  const J = window.__rvJs;
  if (J && typeof J === "object") { if (J.done) setTimeout(boot, 0); else J.boot = boot; }
  else if (document.readyState === "complete") setTimeout(boot, 0);
  else document.addEventListener("DOMContentLoaded", boot, { once: true });
})();
