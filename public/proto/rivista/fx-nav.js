/* ==========================================================================
   fx-nav.js · owner WP-A "Navigazione" · prefix nv-

   The director who cuts. A navigation is an edit, never a fade to nothing.

   S4 "Stacco"  home -> case: one image makes one move, from the tile rect to
                the case hero's real rect. It never fills the screen. Neighbours
                roll up, a paper sheet rises under the image, the arrival is
                painted from CSS variables at first paint and settles under 2 px.
                Back mirrors it into the same tile at the same rail position.
   S5 "Tendina" every other link: paper-deep columns with hairline rules rise
                from the centre, the destination name rises in its mask, the AT
                ring accelerates; on arrival the columns leave from the edges
                while the new title is already rising.

   Also: header hairline and hide-on-scroll, nav word roll, accent dash for the
   section in view, the AT ring, the mobile menu, the label cursor, the link and
   button micro-interactions of plan §5, and the identity switcher.

   Public contract (plan §9): FX.nav = { go, cover, uncover, arrive, reset, state }.
   Storage: session rv-pt (8 s), rv-origin (10 min); local rv-hero|<path> and
   rv-hero-rect|<path>|<v>|<w>x<h>.
   House rules: hidden states by gsap.set only, transform / opacity / clip-path
   only, one ticker, guarded safety timers.
   ========================================================================== */
(() => {
  "use strict";
  if (!window.FX) return;

  const FX = window.FX;
  const d = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.prototype.slice.call(r.querySelectorAll(s));
  const vw = () => window.innerWidth;
  const vh = () => window.innerHeight;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  let G = null, ST = null;
  let colsRoot, colsGrid, colEls, labelEl, subEl, sheetEl, imgEl, imgTag;

  const state = { busy: false, kind: null, dir: null, entry: null };
  let safety = 0;          // guarded reset: a navigation that never happens must not wall the page
  let lastOrigin = null;   // survives bfcache on the heap, so a frozen home can reverse in place

  /* ----------------------------------------------------------- storage */
  const S = {
    get(store, k) { try { return JSON.parse(store.getItem(k) || "null"); } catch (e) { return null; } },
    set(store, k, v) { try { store.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const sGet = (k) => S.get(sessionStorage, k);
  const sSet = (k, v) => S.set(sessionStorage, k, v);
  const lGet = (k) => S.get(localStorage, k);
  const lSet = (k, v) => S.set(localStorage, k, v);
  const heroSrcKey = (path) => "rv-hero|" + path;
  const heroRectKey = (path) => "rv-hero-rect|" + path + "|" + FX.variant + "|" + vw() + "x" + vh();
  const base = (u) => String(u || "").split("?")[0].split("/").pop();
  /* the same capture at another srcset width is the same picture (a phone may hold the 800w on one
     page and the 1600w on the other) */
  const stem = (u) => base(u).replace(/-\d+w?\.(webp|jpe?g|png|avif)$/i, "");

  /* --------------------------------------------------------- geometry */
  const insetOf = (r) => `inset(${r.t.toFixed(1)}px ${r.r.toFixed(1)}px ${r.b.toFixed(1)}px ${r.l.toFixed(1)}px)`;
  const boxToInset = (b) => ({
    t: Math.max(0, b.top), r: Math.max(0, vw() - b.right),
    b: Math.max(0, vh() - b.bottom), l: Math.max(0, b.left),
  });
  /* The overlay image covers the viewport. These are the transform values that make it show
     exactly the object-fit: cover crop that the same image shows inside `box`. */
  function coverXf(box, nw, nh) {
    const Sv = Math.max(vw() / (nw || 1), vh() / (nh || 1));
    const St = Math.max(box.width / (nw || 1), box.height / (nh || 1));
    return { x: box.left + box.width / 2 - vw() / 2, y: box.top + box.height / 2 - vh() / 2, s: St / Sv };
  }
  const boxOf = (el) => { const r = el.getBoundingClientRect(); return { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
  const boxFrom = (o, dy) => ({ top: o.t - dy, left: o.l, right: o.l + o.w, bottom: o.t - dy + o.h, width: o.w, height: o.h });
  /* the nearest horizontally scrolled ancestor, so a tile can be found again where it was left.
     Only used while WP-C's FX.scroll.restore() is missing; restore() wins whenever it exists. */
  function scroller(el) {
    let n = el && el.parentElement;
    while (n && n !== document.body) {
      const cs = getComputedStyle(n);
      if (/(auto|scroll)/.test(cs.overflowX) && n.scrollWidth > n.clientWidth + 4) return n;
      n = n.parentElement;
    }
    return null;
  }

  /* ------------------------------------------------------------- ring */
  const ring = { speed: 30, rot: 0, els: [] };
  function tickRing(t, dt) {
    ring.rot = (ring.rot + ring.speed * (Math.min(dt, 100) / 1000)) % 360;
    const s = "rotate(" + ring.rot.toFixed(2) + "deg)";
    for (let i = 0; i < ring.els.length; i++) ring.els[i].style.transform = s;
  }
  const ringTo = (v, dur) => { if (G && FX.flags.motion) G.to(ring, { speed: v, duration: dur, ease: "domus", overwrite: true }); };
  const ringFast = () => ringTo(240, 0.3);
  const ringSlow = () => ringTo(30, 1.1);

  function initRing() {
    ring.els = $$(".mark-ring");
    if (!ring.els.length || !FX.flags.motion) return;
    G.ticker.add(tickRing);
    let idle = 0;
    const l = FX.lenis;
    if (l) l.on("scroll", ({ velocity }) => {
      if (state.busy) return;
      ringTo(Math.min(420, 30 + 10 * Math.abs(velocity || 0)), 0.3);
      clearTimeout(idle);
      idle = setTimeout(ringSlow, 100);
    });
  }

  /* ----------------------------------------------------------- header */
  let menuOpen = false;
  function initHeader() {
    const h = $("[data-hdr]");
    if (!h) return;
    /* The header follows the scroll POSITION, not only scroll events: a restored, programmatic or
       Lenis-driven scroll lands in the right state on the next tick. The check is one scrollY read
       per tick and does nothing while the position is unchanged.
       Over the S3 plate (from the moment the blade opens until the next sheet has covered it) the
       header is always away: no paper ground and no nav text ever sits over the moving plate. */
    let lastY = -1, stageA = 0, stageB = 0;
    const measureStage = () => {
      const st = document.querySelector(".hr-stage[data-on]");
      if (!st) { stageA = stageB = 0; return; }
      const top = st.getBoundingClientRect().top + window.scrollY;
      stageA = top + vh() * 0.08;
      stageB = top + vh() * 2 - 2;
    };
    const overPlate = (y) => stageB > stageA && y > stageA && y < stageB;
    const on = (force) => {
      const y = window.scrollY;
      if (y === lastY && force !== true) return;
      const plate = overPlate(y);
      h.classList.toggle("is-solid", (y > 24 && !plate) || menuOpen);
      if (!menuOpen && !state.busy) {
        if (plate) h.classList.add("is-hidden");
        else if (lastY < 0) h.classList.toggle("is-hidden", y > 360);
        else if (y > lastY + 4 && y > 360) h.classList.add("is-hidden");
        else if (y < lastY - 4 || y < 360) h.classList.remove("is-hidden");
      }
      lastY = y;
    };
    G.ticker.add(() => on());
    if (ST) ST.addEventListener("refresh", () => { measureStage(); on(true); });
    FX.on("fx:built", () => { measureStage(); on(true); });
    h.addEventListener("focusin", () => h.classList.remove("is-hidden"));
    on(true);
  }

  /* S1 T+700 (requested by WP-B): the nav rises out of its masks as the preloader hands over */
  function initHandoff() {
    FX.on("fx:intro:handoff", () => {
      if (!G || !FX.flags.motion) return;
      const items = $$(".nav a .nv-roll > span:first-child, .menu-btn .nv-roll > span:first-child");
      const lang = $(".nav .lang");
      if (items.length) G.fromTo(items, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: "expo.out", stagger: 0.06, clearProps: "transform" });
      if (lang) G.fromTo(lang, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "expo.out", delay: 0.06 * items.length, clearProps: "opacity" });
    });
  }

  /* one accent dash in front of the section the reader is in */
  function initSpy() {
    const links = $$(".nav a[data-nv-sec]");
    if (!links.length || !("IntersectionObserver" in window)) return;
    const map = new Map();
    for (const a of links) {
      const id = (a.getAttribute("href") || "").split("#")[1];
      const el = id && document.getElementById(id);
      if (el) map.set(el, a);
    }
    if (!map.size) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        for (const a of links) a.removeAttribute("aria-current");
        const hit = map.get(e.target);
        if (hit) hit.setAttribute("aria-current", "true");
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    map.forEach((a, el) => io.observe(el));
  }

  /* ------------------------------------------------------------- menu */
  let closeMenu = () => {};
  function initMenu() {
    const btn = $("[data-menu-btn]");
    const menu = $("[data-menu]");
    if (!btn || !menu) return;
    menu.removeAttribute("hidden");
    $$("li", menu).forEach((li, i) => li.style.setProperty("--k", i));
    const cols = $$(".nv-menu_cols i", menu);
    const inner = $(".nv-menu_in", menu); // its type only shows on paper: in after the columns, out before them
    const hdr = $("[data-hdr]");
    let closing = 0;

    const focusables = () => $$("a[href], button:not([disabled])", menu).filter((el) => el.offsetParent !== null);

    const set = (open) => {
      if (open === menuOpen) return;
      menuOpen = open;
      clearTimeout(closing);
      menu.classList.toggle("is-open", open);
      btn.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close the menu" : "Open the menu");
      if (hdr) { hdr.classList.toggle("is-solid", open || window.scrollY > 24); hdr.classList.remove("is-hidden"); }
      open ? FX.lock("menu") : FX.unlock("menu");
      /* FIX A3: what sits under the full-screen menu is out of reach while it is open */
      [$(".foot"), $("[data-switcher]"), $(".skip")].forEach((el) => { if (el) el.inert = open; });

      if (!cols.length || !G) { menu.classList.toggle("is-closing", false); return; }
      G.killTweensOf(cols);
      if (inner) G.killTweensOf(inner);
      if (!FX.flags.motion) {
        G.set(cols, { yPercent: 0 });
        if (open) G.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "none" });
        else { menu.classList.add("is-closing"); G.to(menu, { opacity: 0, duration: 0.15, ease: "none", onComplete: () => { menu.classList.remove("is-closing"); G.set(menu, { clearProps: "opacity" }); } }); }
      } else if (open) {
        menu.classList.remove("is-closing");
        G.fromTo(cols, { yPercent: -101 }, { yPercent: 0, duration: 0.45, ease: "domus.inOut", stagger: { each: 0.03, from: "end" } });
        /* FIX MQ-06: the type is switched on in one step once the columns cover the page, so its
           words rise from their masks on paper (CSS .mi delay starts at 0.42 s) */
        if (inner) { G.set(inner, { opacity: 0 }); G.to(inner, { opacity: 1, duration: 0, delay: 0.4, clearProps: "opacity" }); }
      } else {
        menu.classList.add("is-closing");
        if (inner) G.to(inner, { opacity: 0, duration: 0.12, ease: "none" });
        G.to(cols, { yPercent: -101, duration: 0.3, ease: "domus.inOut", stagger: { each: 0.02, from: "start" }, delay: 0.08,
          onComplete: () => { menu.classList.remove("is-closing"); if (inner) G.set(inner, { clearProps: "opacity" }); } });
      }
      if (open) setTimeout(() => { const f = focusables()[0]; if (f) f.focus({ preventScroll: true }); }, 120);
    };

    btn.addEventListener("click", () => set(!menuOpen));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
    document.addEventListener("keydown", (e) => {
      if (!menuOpen) return;
      if (e.key === "Escape") { set(false); btn.focus(); return; }
      if (e.key !== "Tab") return;
      /* FIX A3: DOM order is the button, then the menu, so the ring is [btn, ...menu links] */
      const f = [btn].concat(focusables());
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === btn) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); btn.focus(); }
      else if (!f.includes(document.activeElement)) { e.preventDefault(); btn.focus(); }
    });
    matchMedia("(min-width: 1024px)").addEventListener("change", (e) => { if (e.matches) set(false); });
    closeMenu = () => set(false);
  }

  /* ----------------------------------------------- label cursor, magnet */
  let cursorHide = () => {};
  function initCursor() {
    if (!FX.flags.fine || !FX.flags.motion) return;
    const el = document.createElement("div");
    el.className = "nv-cursor";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<span class="nv-cursor_m"><span></span></span>';
    document.body.appendChild(el);
    const word = el.firstChild.firstChild;
    const xTo = G.quickTo(el, "x", { duration: 0.45, ease: "power3" });
    const yTo = G.quickTo(el, "y", { duration: 0.45, ease: "power3" });
    let cur = null, seen = false;
    const hide = () => { if (cur === null) return; cur = null; G.to(el, { opacity: 0, duration: 0.15, ease: "none" }); };
    cursorHide = hide;
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      if (!seen) { seen = true; G.set(el, { x: e.clientX + 18, y: e.clientY + 18 }); }
      xTo(e.clientX + 18); yTo(e.clientY + 18);
      const t = state.busy ? null : (e.target.closest ? e.target.closest("[data-cursor]") : null);
      const label = t ? t.getAttribute("data-cursor") : null;
      if (label === cur) return;
      if (!label) { hide(); return; }
      cur = label;
      word.textContent = label;
      G.to(el, { opacity: 1, duration: 0.15, ease: "none" });
      G.fromTo(word, { yPercent: 100 }, { yPercent: 0, duration: 0.25, ease: "expo.out" });
    }, { passive: true });
    window.addEventListener("blur", hide);
    document.addEventListener("pointerleave", hide);
  }

  /* the one magnetic target on the page: the address in the closing band */
  function initMagnet() {
    if (!FX.flags.fine || !FX.flags.motion) return;
    const el = $('[data-band] a[href^="mailto:"]');
    if (!el || el.hasAttribute("data-magnetic")) return; // WP-C drives [data-magnetic]: one magnet, one pair of quickTo
    const xTo = G.quickTo(el, "x", { duration: 0.5, ease: "power3" });
    const yTo = G.quickTo(el, "y", { duration: 0.5, ease: "power3" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      xTo(clamp((e.clientX - (r.left + r.width / 2)) * 0.28, -12, 12));
      yTo(clamp((e.clientY - (r.top + r.height / 2)) * 0.6, -12, 12));
    });
    el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
  }

  /* ------------------------------------------------- S5: column cover */
  const colCount = () => (vw() < 768 ? 5 : colEls.length);
  const liveCols = () => colEls.slice(0, colCount());
  const colStep = () => (vw() < 768 ? 0.045 : 0.035);

  function setCopy(label, sub) {
    if (labelEl) labelEl.textContent = label || "";
    if (subEl) subEl.textContent = sub || "";
  }

  function cover(o) {
    o = o || {};
    return new Promise((res) => {
      if (!colsRoot || !G) { res(); return; }
      G.killTweensOf([colEls, labelEl, subEl, colsRoot]);
      setCopy(o.label, o.sub);
      G.set(colsRoot, { visibility: "visible", opacity: 1 });
      if (!FX.flags.motion) {
        G.set(colEls, { yPercent: 0 });
        G.set([labelEl, subEl], { yPercent: 0, opacity: 1 });
        G.fromTo(colsRoot, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "none", onComplete: res });
        return;
      }
      const up = o.dir === "back" ? -101 : 101;
      const tl = G.timeline();
      tl.fromTo(liveCols(), { yPercent: up }, { yPercent: 0, duration: 0.5, ease: "domus.inOut", stagger: { each: colStep(), from: "center" } }, 0);
      tl.fromTo(labelEl, { yPercent: 112 }, { yPercent: 0, duration: 0.6, ease: "expo.out" }, 0.5);
      tl.fromTo(subEl, { yPercent: 112, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.3, ease: "none" }, 0.6);
      tl.call(res, null, 0.7); // commit while the label is still settling: the arrival paints it finished
    });
  }

  function uncover(o) {
    o = o || {};
    return new Promise((res) => {
      if (!colsRoot || !G) { res(); return; }
      const done = () => {
        G.set(colsRoot, { visibility: "hidden", clearProps: "opacity" });
        G.set(colEls, { clearProps: "transform" });
        FX.emit("fx:nav:uncovered", {});
        res();
      };
      G.killTweensOf([colEls, labelEl, subEl, colsRoot]);
      if (!FX.flags.motion) { G.to(colsRoot, { opacity: 0, duration: 0.2, ease: "none", onComplete: done }); return; }
      const out = o.dir === "back" ? 101 : -101;
      const tl = G.timeline({ onComplete: done });
      tl.to([labelEl, subEl], { yPercent: o.dir === "back" ? 112 : -112, duration: 0.35, ease: "power2.in" }, 0);
      tl.to(liveCols(), { yPercent: out, duration: 0.55, ease: "domus.inOut", stagger: { each: colStep(), from: "edges" } }, 0.1);
    });
  }

  /* ------------------------------------- S4: the case hero's real rect */
  function heroTarget(path) {
    const cached = lGet(heroRectKey(path));
    if (cached && cached.f && cached.i) {
      return { frame: boxFrom(cached.f, 0), img: boxFrom(cached.i, 0), cached: true };
    }
    /* cold cache: the estimate from the plan, a full-bleed 16:9 whose top sits at about 0.69 vh */
    const w = vw(), t = Math.round(vh() * 0.69), h = Math.round(w * 9 / 16);
    const frame = { top: t, left: 0, right: w, bottom: t + h, width: w, height: h };
    const k = 1.12; // the hero's frame-inner starts over-scaled; see fx-core.css .frame-inner.over
    const iw = w * k, ih = h * k;
    const img = { top: t - (ih - h) / 2, left: -(iw - w) / 2, right: -(iw - w) / 2 + iw, bottom: t - (ih - h) / 2 + ih, width: iw, height: ih };
    return { frame: frame, img: img, cached: false };
  }

  /* written on every case visit, once the page is at rest, so the next cut lands within 2 px */
  function cacheHero() {
    const hero = $("[data-case-hero]");
    const img = hero && $("img", hero);
    if (!hero || !img || window.scrollY > 4) return;
    const f = hero.getBoundingClientRect(), i = img.getBoundingClientRect();
    if (f.height < 8 || i.height < 8) return;
    lSet(heroRectKey(location.pathname), {
      f: { t: f.top + window.scrollY, l: f.left, w: f.width, h: f.height },
      i: { t: i.top + window.scrollY, l: i.left, w: i.width, h: i.height },
      n: { w: img.naturalWidth, h: img.naturalHeight },
    });
    lSet(heroSrcKey(location.pathname), img.currentSrc || img.src);
  }

  /* On the home page the destination's hero source decides whether a tile may make the match cut.
     The cache is authoritative; a cold cache is warmed once, quietly, when the browser is idle. */
  let prefetched = false;
  function warmHeroSrc(path) {
    if (prefetched) return;
    prefetched = true;
    const run = () => {
      fetch(path, { credentials: "same-origin" })
        .then((r) => (r.ok ? r.text() : null))
        .then((html) => {
          if (!html) return;
          const m = html.match(/data-case-hero[\s\S]{0,400}?<img[^>]*\ssrc="([^"]+)"/);
          if (m) lSet(heroSrcKey(path), m[1]);
        })
        .catch(() => {});
    };
    if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 1200 });
    else setTimeout(run, 400);
  }

  /* FIX D5 (found in r4): the next document revalidates the capture before it can paint it (the
     server sends max-age=0), which left the travelling image blank for ~300 ms at the seam. The
     image is handed over inside the arrival record as a data URL instead, decoded at first paint. */
  function toData(src) {
    return fetch(src, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => (b && b.size < 160000 ? new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(null); fr.readAsDataURL(b); }) : null))
      .catch(() => null);
  }

  /* ---------------------------------------------------- S4: forward cut */
  function flipForward(a, url, label, sub, commit) {
    const img = $("img", a);
    const frame = $(".tile-media", a) || a;
    if (!img || !imgEl) return false;
    const src = img.currentSrc || img.src;
    const claim = a.getAttribute("data-pt-hero") || src;
    const known = lGet(heroSrcKey(url.pathname));
    if (known && stem(known) !== stem(claim)) return false; // this tile is not the destination's hero
    if (!img.complete || !img.naturalWidth) return false;

    const nw = img.naturalWidth, nh = img.naturalHeight;
    const from = boxToInset(boxOf(frame));
    const fromXf = coverXf(boxOf(img), nw, nh);
    const target = heroTarget(url.pathname);
    const to = boxToInset(target.frame);
    const toXf = coverXf(target.img, nw, nh);

    imgTag.src = src;
    let data = null; toData(src).then((u) => { data = u; });
    const cur = { t: from.t, r: from.r, b: from.b, l: from.l };
    G.set(imgEl, { visibility: "visible", clipPath: insetOf(cur) });
    G.set(imgTag, { x: fromXf.x, y: fromXf.y, scale: fromXf.s });
    G.set(sheetEl, { visibility: "visible" });

    const tile = a.closest("[data-tile-id]");
    const fr = frame.getBoundingClientRect();
    const rail = scroller(frame);
    lastOrigin = {
      tileId: tile ? tile.getAttribute("data-tile-id") : null,
      rect: { t: fr.top + window.scrollY, l: fr.left, w: fr.width, h: fr.height },
      railLeft: rail ? rail.scrollLeft : null,
      railP: FX.scroll && FX.scroll.railProgress ? FX.scroll.railProgress() : null,
      scrollY: window.scrollY, v: FX.variant, w: vw(), h: vh(), t: Date.now(),
    };
    sSet("rv-origin", lastOrigin);

    const record = () => ({
      type: "flip", src: src, data: data, label: label, sub: sub,
      rect: { t: cur.t, r: cur.r, b: cur.b, l: cur.l },
      x: G.getProperty(imgTag, "x"), y: G.getProperty(imgTag, "y"), s: G.getProperty(imgTag, "scale"),
    });

    if (!FX.flags.motion) {
      G.set(imgEl, { clipPath: insetOf(to) });
      G.set(imgTag, { x: toXf.x, y: toXf.y, scale: toXf.s });
      G.fromTo(sheetEl, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "none", onComplete: () => commit(record()) });
      return true;
    }

    const rolled = $$(".tile-media").filter((el) => !a.contains(el));
    const idx = Math.max(0, $$(".tile-media").indexOf(frame));
    const tl = G.timeline();
    if (rolled.length) tl.to(rolled, { clipPath: "inset(0px 0px 100% 0px)", duration: 0.45, ease: "domus.inOut", stagger: { each: 0.04, from: idx } }, 0);
    tl.to(cur, { t: to.t, r: to.r, b: to.b, l: to.l, duration: 1.1, ease: "domus.inOut", onUpdate: () => { imgEl.style.clipPath = insetOf(cur); } }, 0);
    tl.to(imgTag, { x: toXf.x, y: toXf.y, scale: toXf.s, duration: 1.1, ease: "domus.inOut" }, 0);
    tl.fromTo(sheetEl, { clipPath: "inset(100% 0px 0px 0px)" }, { clipPath: "inset(0px 0px 0px 0px)", duration: 0.6, ease: "domus.inOut" }, 0.12);
    /* FIX MQ-03: commit at 0.8 s; the arrival paints this mid-flight frame and finishes the move */
    tl.call(() => commit(record()), null, 0.8);
    setTimeout(() => commit(record()), 1500); // deadline
    return true;
  }

  /* ------------------------------------------------------- S4: back cut */
  function ratioOf(el) {
    const r = el.getBoundingClientRect();
    if (r.height <= 0) return 0;
    return Math.max(0, Math.min(r.bottom, vh()) - Math.max(r.top, 0)) / r.height;
  }

  function flipBack(url, label, sub, commit) {
    const hero = $("[data-case-hero]");
    const img = hero && $("img", hero);
    if (!hero || !img || !imgEl || !FX.flags.motion) return false;
    /* FIX D3: the case page at rest shows about a third of its hero; that slice is enough to
       start the match cut from (boxToInset clips the overlay to the visible part) */
    if (ratioOf(hero) < 0.2) return false;
    const org = sGet("rv-origin");
    if (!org || Date.now() - org.t > 600000) return false;
    if (org.w !== vw() || org.h !== vh() || org.v !== FX.variant) return false;
    if (!img.complete || !img.naturalWidth) return false;

    const nw = img.naturalWidth, nh = img.naturalHeight;
    const from = boxToInset(boxOf(hero));
    const fromXf = coverXf(boxOf(img), nw, nh);
    const tileBox = boxFrom(org.rect, org.scrollY);
    const to = boxToInset(tileBox);
    const toXf = coverXf(tileBox, nw, nh);

    imgTag.src = img.currentSrc || img.src;
    let data = null; toData(imgTag.src).then((u) => { data = u; });
    const cur = { t: from.t, r: from.r, b: from.b, l: from.l };
    G.set(imgEl, { visibility: "visible", clipPath: insetOf(cur) });
    G.set(imgTag, { x: fromXf.x, y: fromXf.y, scale: fromXf.s });
    G.set(sheetEl, { visibility: "visible" });

    const record = () => ({
      type: "flip-back", src: imgTag.src, data: data, label: label, sub: sub, tileId: org.tileId,
      scrollY: org.scrollY, railLeft: org.railLeft, railP: org.railP, dest: to,
      rect: { t: cur.t, r: cur.r, b: cur.b, l: cur.l },
      x: G.getProperty(imgTag, "x"), y: G.getProperty(imgTag, "y"), s: G.getProperty(imgTag, "scale"),
    });

    const tl = G.timeline();
    tl.fromTo(sheetEl, { clipPath: "inset(0px 0px 100% 0px)" }, { clipPath: "inset(0px 0px 0px 0px)", duration: 0.5, ease: "domus.inOut" }, 0);
    tl.to(cur, { t: to.t, r: to.r, b: to.b, l: to.l, duration: 1.0, ease: "domus.inOut", onUpdate: () => { imgEl.style.clipPath = insetOf(cur); } }, 0);
    tl.to(imgTag, { x: toXf.x, y: toXf.y, scale: toXf.s, duration: 1.0, ease: "domus.inOut" }, 0);
    tl.call(() => commit(record()), null, 0.75);
    setTimeout(() => commit(record()), 1500);
    return true;
  }

  /* ---------------------------------------------------------------- go */
  function go(a) {
    if (state.busy) return;
    state.busy = true;                      // taken synchronously inside the click handler
    FX.lock("nav");
    chromeInert(true);
    closeMenu();
    cursorHide();
    ringFast();

    let url;
    try { url = new URL(a.href, location.href); } catch (e) { state.busy = false; FX.unlock("nav"); return; }
    const back = a.hasAttribute("data-back");
    const dir = back ? "back" : "fwd";
    const label = a.getAttribute("data-pt-label") || "";
    const sub = a.getAttribute("data-pt-sub") || "";

    let navigated = false;
    const commit = (rec) => {
      if (navigated) return;
      navigated = true;
      if (rec) { rec.to = url.pathname; rec.t = Date.now(); sSet("rv-pt", rec); }
      location.href = url.href;
    };
    clearTimeout(safety);
    safety = setTimeout(() => { if (!document.hidden) reset(); }, 6000);

    FX.runExits({ dir: dir });

    const wantFlip = !back && a.getAttribute("data-pt") === "flip";
    let kind = "cols";
    if (wantFlip && FX.flags.motion && flipForward(a, url, label, sub, commit)) kind = "flip";
    else if (back && flipBack(url, label, sub, commit)) kind = "flip-back";
    else if (wantFlip && !FX.flags.motion && flipForward(a, url, label, sub, commit)) kind = "flip";

    state.kind = kind; state.dir = dir;
    FX.emit("fx:nav:start", { kind: kind, dir: dir, href: url.href, label: label });

    if (kind !== "cols") { FX.emit("fx:nav:covered", { kind: kind }); return; }

    cover({ label: label, sub: sub, dir: dir }).then(() => {
      FX.emit("fx:nav:covered", { kind: "cols" });
      commit({ type: back ? "back" : "cols", label: label, sub: sub });
    });
    setTimeout(() => commit({ type: back ? "back" : "cols", label: label, sub: sub }), FX.flags.motion ? 1300 : 500);
  }

  /* ------------------------------------------------------------ arrive */
  function clearOverlays() {
    if (!G) return;
    G.killTweensOf([imgEl, imgTag, sheetEl, colsRoot, colEls, labelEl, subEl]);
    if (imgEl) G.set(imgEl, { visibility: "hidden", clearProps: "clipPath,opacity" });
    if (imgTag) G.set(imgTag, { clearProps: "transform" });
    if (sheetEl) G.set(sheetEl, { visibility: "hidden", clearProps: "clipPath,opacity" });
    if (colsRoot) G.set(colsRoot, { visibility: "hidden", clearProps: "opacity" });
    if (colEls) G.set(colEls, { clearProps: "transform" });
  }

  function reset() {
    clearTimeout(safety);
    state.busy = false; state.kind = null; state.dir = null;
    chromeInert(false);
    clearOverlays();
    d.removeAttribute("data-arrive");
    ringSlow();
    FX.unlock("*");
    FX.emit("fx:nav:reset", {});
  }

  function scrollToHash() {
    if (!location.hash) return;
    const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!t) return;
    if (ST) ST.refresh();
    const y = t.getBoundingClientRect().top + window.scrollY;
    FX.scrollTo(y, { immediate: true });
    window.scrollTo(0, y);
    if (ST) ST.update();
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* The overlay only leaves once the real element it hands over to is actually on screen, so the
     swap is one frame and never a hole. WP-C skips the curtain on [data-nv-arrived]; until it does,
     this waits the curtain out instead of showing bare paper where the image should be. */
  function painted(host) {
    if (!host) return true;
    const nodes = [host].concat($$("*", host).slice(0, 8));
    for (const n of nodes) {
      const cs = getComputedStyle(n);
      if (cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.95) return false;
      const cp = cs.clipPath;
      if (cp && cp !== "none") {
        const nums = cp.match(/-?[\d.]+/g);
        if (nums && nums.some((v) => Math.abs(parseFloat(v)) > 1)) return false;
      }
    }
    return true;
  }
  function until(fn, ms) {
    return new Promise((res) => {
      const t0 = performance.now();
      const step = () => { if (fn() || performance.now() - t0 > ms) res(); else requestAnimationFrame(step); };
      step();
    });
  }

  async function arrive() {
    const a = window.__rvArrive;
    d.setAttribute("data-nv-live", "");
    state.entry = a ? a.type : "plain";
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      d.removeAttribute("data-arrive");
      state.busy = false; state.kind = null;
      chromeInert(false);
      clearTimeout(safety);
      ringSlow();
      FX.emit("fx:nav:arrived", { kind: a ? a.type : "plain" });
      FX.ready("arrive");
    };
    if (!a) { clearOverlays(); finish(); return; }

    state.busy = true;
    chromeInert(true);
    // a film that never ends must not wall the page
    const guard = setTimeout(() => { clearOverlays(); finish(); }, 4000);
    const done = () => { clearTimeout(guard); clearOverlays(); finish(); };

    if (a.type === "flip" || a.type === "flip-back") {
      const isBack = a.type === "flip-back";
      G.set(imgEl, { visibility: "visible", clipPath: insetOf(a.rect || { t: 0, r: 0, b: 0, l: 0 }) });
      G.set(imgTag, { x: a.x || 0, y: a.y || 0, scale: a.s || 1 });
      G.set(sheetEl, { visibility: "visible", clipPath: "inset(0px 0px 0px 0px)" });

      let yT = null;
      if (isBack && typeof a.scrollY === "number") {
        yT = a.scrollY;
        if (FX.scroll && typeof FX.scroll.restore === "function") yT = FX.scroll.restore({ y: a.scrollY, railP: a.railP });
        else { if (ST) ST.refresh(); FX.scrollTo(a.scrollY, { immediate: true }); window.scrollTo(0, a.scrollY); if (ST) ST.update(); }
      } else scrollToHash();

      // the real element this image belongs to on this page
      const host = isBack
        ? (a.tileId ? $('[data-tile-id="' + a.tileId + '"] .tile-media') : null)
        : $("[data-case-hero]");
      if (isBack && host && typeof a.railLeft === "number") {
        const rail = scroller(host);
        if (rail && Math.abs(rail.scrollLeft - a.railLeft) > 1) rail.scrollLeft = a.railLeft;
      }
      const real = host ? $("img", host) : null;
      const match = real && stem(real.currentSrc || real.src) === stem(a.src);

      if (match) {
        if (host) host.setAttribute("data-nv-arrived", ""); // WP-C: skip this element's curtain
        /* `complete` is not "painted": with decoding="async" a complete image can still show
           nothing for several frames once it becomes visible. decode() resolves when it can paint. */
        await Promise.race([real.decode().catch(() => null), wait(900)]);
        await new Promise((r) => requestAnimationFrame(() => r()));
        /* FIX MQ-02: the restored position is checked one frame later and re-applied if a late
           layout moved it, and only then is the tile measured: the overlay flies once, to where
           the tile really is */
        if (isBack && yT !== null && Math.abs(window.scrollY - yT) > 2) {
          if (ST) ST.refresh();
          if (FX.lenis) FX.lenis.scrollTo(yT, { immediate: true, force: true });
          window.scrollTo(0, yT);
          if (ST) ST.update();
          if (FX.scroll && FX.scroll.setRailProgress && typeof a.railP === "number") FX.scroll.setRailProgress(a.railP);
        }
        const nw = real.naturalWidth || 1600, nh = real.naturalHeight || 1000;
        const fBox = boxOf(host), iBox = boxOf(real);
        const want = boxToInset(fBox), wantXf = coverXf(iBox, nw, nh);
        const have = a.rect || want;
        const diff = (p, q) => Math.max(Math.abs(p.t - q.t), Math.abs(p.r - q.r), Math.abs(p.b - q.b), Math.abs(p.l - q.l));
        const drift = diff(want, have);
        const miss = isBack && a.dest ? diff(want, a.dest) : 0;
        window.__nvDrift = drift; // read by the capture harness
        window.__nvMiss = miss;
        const others = isBack ? $$(".tile-media").filter((el) => el !== host) : [];
        if (others.length && FX.flags.motion) G.set(others, { clipPath: "inset(0px 0px 100% 0px)" });
        const cur = { t: have.t, r: have.r, b: have.b, l: have.l };
        if (!isBack) {
          /* FIX D5: the case page speaks now, while the image finishes its move: the paper sheet
             goes, the title rises, and the real figure waits under the overlay for the swap */
          if (host) G.set(host, { visibility: "hidden" });
          G.set(sheetEl, { visibility: "hidden" });
          finish();
        }
        if (miss > 40 && FX.flags.motion) {
          /* the tile is not where the reader left it: dissolve into it, never a second slide */
          finish();
          await until(() => painted(host), 1200);
          await new Promise((res) => {
            G.timeline({ onComplete: res })
              .to(imgEl, { opacity: 0, duration: 0.25, ease: "none" }, 0)
              .to(sheetEl, { opacity: 0, duration: 0.25, ease: "none" }, 0);
          });
        } else {
          if (drift > 2 && FX.flags.motion) {
            await new Promise((res) => {
              G.timeline({ onComplete: res })
                .to(cur, { t: want.t, r: want.r, b: want.b, l: want.l, duration: 0.42, ease: "domus", onUpdate: () => { imgEl.style.clipPath = insetOf(cur); } }, 0)
                .to(imgTag, { x: wantXf.x, y: wantXf.y, scale: wantXf.s, duration: 0.42, ease: "domus" }, 0);
            });
          } else {
            G.set(imgEl, { clipPath: insetOf(want) });
            G.set(imgTag, { x: wantXf.x, y: wantXf.y, scale: wantXf.s });
          }
          if (host && !isBack) G.set(host, { clearProps: "visibility" });
          finish();
          // the swap: overlay off and the real figure on in the same frame
          await until(() => painted(host), 1200);
          /* the overlay sits over identical pixels, so two extra frames cost nothing and let the
             newly visible figure rasterise before its cover leaves */
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
        }
        G.set(imgEl, { visibility: "hidden" });
        G.set(sheetEl, { visibility: "hidden" });
        if (others.length && FX.flags.motion) {
          const idx = Math.max(0, $$(".tile-media").indexOf(host));
          G.fromTo(others, { clipPath: "inset(0px 0px 100% 0px)" }, { clipPath: "inset(0px 0px 0px 0px)", duration: 0.6, ease: "domus.inOut", stagger: { each: 0.04, from: idx }, clearProps: "clipPath" });
        }
        if (host) G.set(host, { clearProps: "visibility" });
        done();
        return;
      }

      // no match on this page: leave the frame behind the rising page instead of faking one
      finish();
      await new Promise((res) => {
        G.timeline({ onComplete: res })
          .to(imgEl, { opacity: 0, duration: FX.flags.motion ? 0.35 : 0.15, ease: "none" }, 0)
          .to(sheetEl, { clipPath: "inset(0px 0px 100% 0px)", duration: FX.flags.motion ? 0.55 : 0.15, ease: "domus.inOut" }, 0.1);
      });
      done();
      return;
    }

    // S5 arrival: covered from first paint
    const dir = a.type === "back" ? "back" : "fwd";
    setCopy(a.label, a.sub);
    G.set(colsRoot, { visibility: "visible" });
    G.set(colEls, { yPercent: 0 });
    G.set([labelEl, subEl], { yPercent: 0, opacity: 1 });
    scrollToHash();
    // the columns leave while the new title is already rising
    const early = setTimeout(finish, 150);
    await uncover({ dir: dir });
    clearTimeout(early);
    done();
  }

  /* ---------------------------------------------------- click plumbing */
  function anchorTo(hash) {
    const id = decodeURIComponent(hash.slice(1));
    const t = hash === "#top" ? null : document.getElementById(id);
    const y = hash === "#top" ? 0 : t ? t.getBoundingClientRect().top + window.scrollY : null;
    if (y === null) return;
    FX.scrollTo(y, { immediate: !FX.flags.motion, duration: 1.4 });
    if (!FX.lenis) window.scrollTo(0, y);
    /* FIX A5: a section is not focusable by itself; give it tabindex -1 so focus really moves */
    const target = t || document.getElementById("main");
    if (target) setTimeout(() => {
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }, 60);
  }

  /* Core makes <main> inert during a cut. The header, the menu and the footer live outside it, so
     they are switched off here too: under the cover nothing is reachable by keyboard either. */
  function chromeInert(on) {
    const els = [$("[data-hdr]"), $("[data-menu]"), $(".foot"), $("[data-switcher]"), $(".skip")];
    for (const el of els) if (el) el.inert = on;
  }

  /* FIX MQ-03: the destination document is fetched while the pointer is still on its way */
  function initPrefetch() {
    const seen = new Set();
    const pf = (e) => {
      const a = e.target && e.target.closest ? e.target.closest("a[data-pt], a[data-back], a.next-link") : null;
      if (!a) return;
      let u;
      try { u = new URL(a.href, location.href); } catch (err) { return; }
      if (u.origin !== location.origin || u.pathname === location.pathname || seen.has(u.pathname)) return;
      seen.add(u.pathname);
      const l = document.createElement("link");
      l.rel = "prefetch"; l.href = u.pathname + u.search;
      document.head.appendChild(l);
    };
    document.addEventListener("pointerover", pf, { passive: true });
    document.addEventListener("focusin", pf);
  }

  /* while a cut runs, nothing else may start one */
  function swallow(e) {
    if (!state.busy) return;
    if (e.type === "keydown" && !(e.key === "Enter" || e.key === " " || e.key === "Spacebar")) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
  }

  function onClick(e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    let url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname) {
      if (url.hash) { e.preventDefault(); closeMenu(); anchorTo(url.hash); }
      return;
    }
    if (!/\/proto\/rivista\//.test(url.pathname)) return;
    e.preventDefault();
    go(a);
  }

  /* ------------------------------------------------------------ bfcache */
  function onPageShow(e) {
    if (!e.persisted) return;
    clearTimeout(safety);
    const frozen = imgEl && getComputedStyle(imgEl).visibility === "visible";
    if (!frozen || !lastOrigin || !G || !FX.flags.motion) { reset(); return; }
    // the home document came back exactly as it was left: run the cut backwards in place
    state.busy = true;
    const host = lastOrigin.tileId ? $('[data-tile-id="' + lastOrigin.tileId + '"] .tile-media') : null;
    const real = host && $("img", host);
    if (!host || !real) { reset(); return; }
    const nw = real.naturalWidth || 1600, nh = real.naturalHeight || 1000;
    const to = boxToInset(boxOf(host)), toXf = coverXf(boxOf(real), nw, nh);
    const now = imgEl.style.clipPath;
    const m = /inset\(([-\d.]+)px ([-\d.]+)px ([-\d.]+)px ([-\d.]+)px\)/.exec(now);
    const cur = m ? { t: +m[1], r: +m[2], b: +m[3], l: +m[4] } : to;
    const others = $$(".tile-media").filter((el) => el !== host);
    const idx = Math.max(0, $$(".tile-media").indexOf(host));
    G.timeline({ onComplete: () => { reset(); if (FX.scroll && FX.scroll.enterVisible) FX.scroll.enterVisible(); } })
      .to(cur, { t: to.t, r: to.r, b: to.b, l: to.l, duration: 0.9, ease: "domus.inOut", onUpdate: () => { imgEl.style.clipPath = insetOf(cur); } }, 0)
      .to(imgTag, { x: toXf.x, y: toXf.y, scale: toXf.s, duration: 0.9, ease: "domus.inOut" }, 0)
      .to(sheetEl, { clipPath: "inset(0px 0px 100% 0px)", duration: 0.6, ease: "domus.inOut" }, 0.2)
      .to(others, { clipPath: "inset(0px 0px 0px 0px)", duration: 0.6, ease: "domus.inOut", stagger: { each: 0.04, from: idx }, clearProps: "clipPath" }, 0.25);
  }

  /* ---------------------------------------------------------- switcher */
  function initSwitcher() {
    const root = $("[data-switcher]");
    const tab = root && $("[data-switcher-tab]", root);
    const now = root && $("[data-switcher-now]", root);
    const paint = () => { if (now) now.textContent = "V" + FX.variant; };
    const open = (on) => {
      if (!root || !tab) return;
      root.toggleAttribute("data-open", on);
      tab.setAttribute("aria-expanded", String(on));
    };
    if (root && tab) {
      paint();
      FX.on("fx:variant", paint);
      tab.addEventListener("click", () => {
        const on = !root.hasAttribute("data-open");
        open(on);
        if (on) { const cur = $('button[aria-pressed="true"]', root) || $("button[data-v]", root); if (cur) cur.focus({ preventScroll: true }); }
      });
      root.addEventListener("keydown", (e) => { if (e.key === "Escape" && root.hasAttribute("data-open")) { open(false); tab.focus({ preventScroll: true }); } });
      document.addEventListener("pointerdown", (e) => { if (root.hasAttribute("data-open") && !root.contains(e.target)) open(false); });
      root.addEventListener("focusout", (e) => { if (!root.contains(e.relatedTarget)) open(false); });
    }
    $$("[data-switcher] button[data-v]").forEach((b) => {
      b.addEventListener("click", async () => {
        const v = b.getAttribute("data-v");
        const kb = root && root.hasAttribute("data-open");
        open(false);
        if (state.busy || v === FX.variant) return;
        if (document.activeElement && root && root.contains(document.activeElement)) document.activeElement.blur();
        state.busy = true;
        FX.lock("nav");
        chromeInert(true);
        ringFast();
        const name = b.querySelector("span") ? b.querySelector("span").textContent : "V" + v;
        await cover({ label: name, sub: "Identity V" + v, dir: "fwd" });
        FX.emit("fx:nav:covered", { kind: "variant" });
        await FX.setVariant(v);
        await uncover({ dir: "fwd" });
        ringSlow();
        chromeInert(false);
        FX.unlock("nav");
        state.busy = false;
        if (kb && tab) tab.focus({ preventScroll: true });
      });
    });
  }

  /* -------------------------------------------------------------- init */
  FX.register("nav", {
    init(ctx) {
      G = ctx.gsap; ST = ctx.ScrollTrigger;
      colsRoot = $("[data-nv-cols]");
      colsGrid = colsRoot && $(".nv-cols_grid", colsRoot);
      colEls = colsGrid ? $$("i", colsGrid) : [];
      labelEl = $("[data-nv-label]");
      subEl = $("[data-nv-sub]");
      sheetEl = $("[data-nv-sheet]");
      imgEl = $("[data-nv-img]");
      imgTag = imgEl && $("img", imgEl);

      document.addEventListener("click", swallow, true);
      document.addEventListener("keydown", swallow, true);
      document.addEventListener("pointerdown", swallow, true);
      document.addEventListener("click", onClick, true);
      window.addEventListener("pageshow", onPageShow);
      window.addEventListener("pagehide", () => clearTimeout(safety));

      initHeader();
      initHandoff();
      initRing();
      initMenu();
      initSpy();
      initCursor();
      initSwitcher();
      initPrefetch();

      FX.nav = { go, cover, uncover, arrive, reset, state };
    },

    build(ctx) {
      initMagnet();
      if (ctx.page === "case") {
        FX.once("fx:ready", () => setTimeout(cacheHero, 1500));
      } else {
        const link = $('a[data-pt="flip"][href]');
        if (link) { try { warmHeroSrc(new URL(link.href, location.href).pathname); } catch (e) {} }
      }
      if (!d.hasAttribute("data-arrive")) d.setAttribute("data-nv-live", "");
    },

    onVariant() { if (colEls && colEls.length && G) G.set(colEls, { clearProps: "transform" }); },
    onResize() { if (!state.busy) clearOverlays(); },
  });
})();
