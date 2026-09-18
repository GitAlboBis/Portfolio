/* ==========================================================================
   fx-core.js · owner WP-A · read-only for WP-B and WP-C (plan §9, amendments §2, §3)

   The FX namespace: flags, event bus, Lenis on the single GSAP ticker, the
   ref-counted lock, fonts, module registry and the boot order.

   Script order (all defer): gsap, ScrollTrigger, SplitText, Flip, CustomEase,
   lenis, fx-core, fx-gl, fx-hero, fx-scroll, fx-nav. At load a module only
   calls FX.register(name, { init, build, onVariant, onResize }).

   Boot, on DOMContentLoaded:
     1 flags, variant sync, plugins, CustomEase domus / domus.inOut / dtOut,
       ScrollTrigger.config({ ignoreMobileResize: true })
     2 Lenis on gsap.ticker; FX.lock("entry") under data-preloader or data-arrive
     3 init(ctx) in the order gl, hero, scroll, nav, each in try/catch
     4 await FX.fonts(entry is intro or arrive ? 900 : 1500)
     5 build(ctx) in the same order, ScrollTrigger.refresh(), emit fx:built
     6 entry: data-preloader -> FX.hero.intro() · data-arrive -> FX.nav.arrive()
       · else FX.ready("plain"). A missing owner function means a plain entry.
     7 a live change of prefers-reduced-motion reloads the page

   Switches: ?fx=core,gl,hero runs only the listed modules (core is always on)
   · ?chrome=0 hides the switcher · ?v=1|2|3 picks the variant · ?gl=0 forces
   html.gl-off (poster path). chrome, v and gl are applied by the head script.

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
  const ORDER = ["gl", "hero", "scroll", "nav"];
  const STICKY = new Set(["fx:ready", "fx:built", "fx:intro:handoff"]); // late listeners still get these
  const FONTS = {
    1: ['300 1em "Cormorant Garamond"', '500 1em "Cormorant Garamond"', '600 1em "Cormorant Garamond"', 'italic 500 1em "Cormorant Garamond"', '300 1em "Figtree"', '400 1em "Figtree"', '500 1em "Figtree"', '600 1em "Figtree"'],
    2: ['300 1em "Geist"', '400 1em "Geist"', '500 1em "Geist"', '600 1em "Geist"', '400 1em "Geist Mono"'],
    3: ['400 1em "Instrument Serif"', 'italic 400 1em "Instrument Serif"', '300 1em "Hanken Grotesk"', '400 1em "Hanken Grotesk"', '500 1em "Hanken Grotesk"', '600 1em "Hanken Grotesk"'],
  };

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
  let glOk = "WebGL2RenderingContext" in window; // B sets FX.flags.gl = false after a failed context or link
  const flags = {
    get motion() { return mq.motion.matches; },
    get fine() { return mq.fine.matches; },
    get touch() { return mq.touch.matches; },
    get desktop() { return mq.desktop.matches; },
    get gl() { return glOk && !d.classList.contains("gl-off"); },
    set gl(v) { glOk = !!v; d.classList.toggle("gl-off", !glOk); },
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

  /* ------------------------------------------------------------- variant */
  const variant = () => d.getAttribute("data-variant") || "1";
  const KEEP = ["chrome", "fx", "gl"]; // capture switches travel with internal links
  function syncLinks() {
    const v = variant();
    document.querySelectorAll("a[href]").forEach((a) => {
      const h = a.getAttribute("href");
      if (!h || /^(https?:|mailto:|tel:|#)/.test(h) || !/\.html/.test(h)) return;
      const u = new URL(h, location.href);
      u.searchParams.set("v", v);
      KEEP.forEach((k) => { if (params.has(k)) u.searchParams.set(k, params.get(k)); });
      a.setAttribute("href", u.pathname.split("/").pop() + u.search + u.hash);
    });
    try {
      const u = new URL(location.href);
      if (u.searchParams.get("v") !== v) { u.searchParams.set("v", v); history.replaceState(history.state, "", u); }
    } catch (e) {}
    document.querySelectorAll("[data-switcher] button[data-v]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === v)));
  }
  function fonts(ms = 1500, v = variant()) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.race([
      Promise.all((FONTS[v] || FONTS[1]).map((f) => document.fonts.load(f).catch(() => null))).then(() => document.fonts.ready),
      wait(ms),
    ]);
  }
  let switching = null;
  /* Sets the variant, waits for its faces, lets every module react, refreshes, then emits fx:variant.
     A wraps this in cover / uncover for the switcher. Returns a Promise. */
  function setVariant(v) {
    v = String(v);
    if (!/^[123]$/.test(v) || v === variant()) return Promise.resolve(false);
    if (switching) return switching;
    const from = variant();
    switching = (async () => {
      d.setAttribute("data-variant", v);
      try { localStorage.setItem("rv-variant", v); } catch (e) {}
      syncLinks();
      await fonts(2500, v);
      each("onVariant", v);
      if (ST) ST.refresh();
      emit("fx:variant", { from, to: v });
      return true;
    })().finally(() => { switching = null; });
    return switching;
  }

  /* ---------------------------------------------------------------- Lenis */
  let lenis = null;
  function initLenis() {
    if (!hasG || !window.Lenis || !flags.motion) return;
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, anchors: false, autoRaf: false });
    lenis.on("scroll", ST.update);
    G.ticker.add((time) => lenis.raf(time * 1000)); // the single ticker: no second rAF anywhere
    G.ticker.lagSmoothing(0);
  }
  function scrollTo(target, opts = {}) {
    const { immediate = false, offset = 0, duration = 1.4 } = opts;
    if (lenis) { lenis.scrollTo(target, { immediate, offset, duration, force: true }); return; }
    let y = 0;
    if (typeof target === "number") y = target;
    else {
      const el = typeof target === "string" ? document.querySelector(target) : target;
      if (!el) return;
      y = el.getBoundingClientRect().top + window.scrollY;
    }
    window.scrollTo(0, y + offset);
  }

  /* ----------------------------------------------------------------- lock */
  const holds = new Map(); // reason -> count
  const lockCount = () => { let n = 0; holds.forEach((c) => (n += c)); return n; };
  function applyLock(reason) {
    const locked = lockCount() > 0;
    if (locked === d.hasAttribute("data-fx-locked")) return;
    d.toggleAttribute("data-fx-locked", locked);
    const main = document.getElementById("main");
    if (main) main.inert = locked;
    if (lenis) locked ? lenis.stop() : lenis.start();
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
  async function phase(which, ctx, next) {
    for (const name of names()) {
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
  /* Owners call FX.ready("intro") / FX.ready("arrive") when their entry film hands the page over.
     Releases the entry lock (Lenis starts, <main> is interactive), then emits fx:ready once.
     Owners remove their own state attribute (data-preloader: B, data-arrive: A) before calling it. */
  function ready(entry = "plain") {
    if (readyDone) return;
    readyDone = true;
    clearTimeout(entryTimer);
    unlock("entry");
    const detail = { entry };
    fired.set("fx:ready", detail);
    window.dispatchEvent(new CustomEvent("fx:ready", { detail }));
  }
  function plainEntry(why) {
    if (why) warn(why);
    d.removeAttribute("data-preloader");
    d.removeAttribute("data-arrive");
    d.classList.remove("rv-pre-run");
    ready("plain");
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
      each("onResize", detail);
      emit("fx:resize", detail);
    }, 200);
  }

  /* ------------------------------------------------------------ namespace */
  const FX = {
    flags,
    on,
    once: (evt, fn) => on(evt, fn, { once: true }),
    emit,
    get lenis() { return lenis; },
    scrollTo,
    lock, unlock,
    get locked() { return lockCount() > 0; },
    fonts,
    register,
    exits: [],
    /* awaits every registered exit (A calls it before a cut); a throwing exit never blocks the cut */
    runExits(detail = {}) {
      return Promise.all(FX.exits.map((fn) => { try { return Promise.resolve(fn(detail)).catch(() => null); } catch (e) { return null; } }));
    },
    gl: null, hero: null, scroll: null, nav: null, // filled by their owners inside init()
    // additions to plan §9 (documented in the scaffold notes)
    get variant() { return variant(); },
    setVariant,
    syncLinks,
    ready,
    get isReady() { return readyDone; },
    get page() { return d.hasAttribute("data-home") ? "home" : "case"; },
    get modules() { return { ...state }; },
    has: (name) => live(name),
    version: "scaffold-1",
  };
  window.FX = FX;

  /* ----------------------------------------------------------------- boot */
  async function boot() {
    syncLinks();
    mq.motion.addEventListener("change", () => location.reload());
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
    window.addEventListener("scroll", () => {
      const now = performance.now();
      if (now - rsAt < 700 || now - anchorAt < 200) return;
      anchorAt = now; anchor = readAnchor();
    }, { passive: true });
    mq.desktop.addEventListener("change", () => {
      const a = anchor;
      clearTimeout(bpT);
      if (!a || a.y < 4) return;
      bpT = setTimeout(() => {
        try { if (ST) ST.refresh(); } catch (e) {}
        const r = a.el.getBoundingClientRect();
        const y = Math.max(0, Math.round(r.top + window.scrollY + a.ratio * r.height));
        scrollTo(y, { immediate: true });
        window.scrollTo(0, y);
        try { if (ST) ST.update(); } catch (e) {}
        anchor = readAnchor();
      }, 450);
    });

    const entry = d.hasAttribute("data-preloader") ? "intro" : d.hasAttribute("data-arrive") ? "arrive" : "plain";

    if (!hasG) {
      // CDN down or blocked: the page stays a complete static document
      for (const n of names()) { state[n] = "off"; d.classList.add("fx-off-" + n); }
      d.classList.add("fx-static");
      plainEntry("GSAP is missing: static page, no module was started");
      return;
    }

    const plugins = [ST, window.SplitText, window.Flip, window.CustomEase].filter(Boolean);
    G.registerPlugin(...plugins);
    ST.config({ ignoreMobileResize: true });
    if (window.CustomEase) {
      window.CustomEase.create("domus", "M0,0 C0.22,0.9 0.36,1 1,1");
      window.CustomEase.create("domus.inOut", "M0,0 C0.66,0 0.22,1 1,1");
      window.CustomEase.create("dtOut", "0.25,1,0.5,1");
    } else warn("CustomEase is missing: domus, domus.inOut and dtOut are not registered");

    initLenis();
    if (entry !== "plain") {
      lock("entry");
      // guarded safety: an entry film that never hands over must not leave the page locked
      entryTimer = setTimeout(() => { if (!readyDone) plainEntry("entry film did not call FX.ready within 6 s: forced plain entry"); }, 6000);
    }

    const ctx = {
      FX, gsap: G, ScrollTrigger: ST,
      mm: G.matchMedia(),          // shared gsap.matchMedia(): put hidden states inside a motion-ok query
      page: FX.page, variant: variant(), entry,
      arrive: window.__rvArrive || null,
    };

    await phase("init", ctx, "init");
    await fonts(entry === "plain" ? 1500 : 900);
    await phase("build", ctx, "built");
    ST.refresh();
    emit("fx:built", {});

    const call = (owner, fnName) => {
      const api = FX.has(owner) ? FX[owner] : null;
      if (!api || typeof api[fnName] !== "function") return false;
      try {
        const r = api[fnName]();
        if (r && typeof r.catch === "function") r.catch((err) => { fail(owner, fnName, err); plainEntry(); });
        return true;
      } catch (err) { fail(owner, fnName, err); return false; }
    };
    if (entry === "intro" && call("hero", "intro")) return;
    if (entry === "arrive" && call("nav", "arrive")) return;
    plainEntry();
  }

  if (document.readyState === "complete") setTimeout(boot, 0);
  else document.addEventListener("DOMContentLoaded", boot, { once: true });
})();
