/* ==========================================================================
   fx-nav.js · the chrome's behaviour (spec 50 §4, §6). Rewritten from zero.

   · the header: html.is-scrolled once the page has moved (the header takes its --night-2 ground); html[data-hdr-ground="dawn"]
     while the dawn close is under it (the header takes the morning's ground)
   · the menu (below 1024 px): a full sheet, a dialog with its focus kept inside, Esc and the button close it, the page
     locked under it (FX.lock("menu"): the stage pauses on that reason)
   · the copy control: [data-nv-copy] writes the address; the button shows "Copied" (or "Selected" when the clipboard
     refuses: the address is then selected for the reader's own keys) and the status line says it
   · the cut between pages: a click on a link to another page ([data-pt-label]) raises the sheet (css/cuts.css; the
     dawn sheet for [data-pt-dawn]), records { to, label, sub, dawn } in sessionStorage "rv-pt" and navigates under it;
     the arriving page is covered from its first paint (head script) and FX.nav.arrive() sends the sheet away upward.
     Events for the stage: fx:nav:start, fx:nav:covered (leaving), fx:nav:uncovered, fx:nav:arrived (arriving),
     fx:nav:reset (a page restored from the back-forward cache). Reduced motion: no sheet, the browser's navigation.
     (lane PORTAL) fx:nav:start carries { to, side, dawn }: side -1 / 1, the clicked link's half of the viewport, where
     the stage's portal of glass swings in from. While the stage flies the eye into it (html.cut-portal, set by
     fx-stage.js) the sheet is held back until the glass fills the frame (html.cut-full; at the latest PORTAL_FULL_MS) and
     then floods in (css/cuts.css); "rv-pt" records { side, portal } so the arriving page opens inside the glass.
     (lane o-router) Under the Astro build's router (window.__rvRouter, web/src/router/rv-router.js) the cut is a soft
     navigation: fx:nav:start as above, then the router is asked to go at once (the page is fetched during the flight)
     and swaps the page once the frame is covered: by the glass (fx:stage:full; the sheet stays clear over it,
     html.cut-soft, its card riding over the glass; toward Contact the dawn sheet floods in), else by the sheet as
     before. Nothing goes through sessionStorage; the arrival comes back through window.__rvArrive.
   Every word comes from the markup's attributes (data-nv-*, data-pt-*), never from this file.
   ========================================================================== */
(() => {
  "use strict";
  const FX = window.FX;
  if (!FX) return;
  const d = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ms = (v, f) => { const n = parseFloat(v); return isFinite(n) ? (/ms$/.test(String(v).trim()) ? n : n * 1000) : f; };
  const cutMs = () => ms(getComputedStyle(d).getPropertyValue("--d-cut"), 620);

  /* ---------------------------------------------------------------- the header */
  /* the header takes the ground under it: while the dawn close's top edge is above the header's bottom edge,
     html[data-hdr-ground="dawn"] (css/chrome.css gives it the morning's ground, ink and rules); back to night above it. A
     straight cut, no fade, both ways. Contact is the morning whole (html[data-ground="dawn"]) and needs no switch. */
  let scrolled = null, overDawn = null;
  const hdrEl = $("[data-hdr]");
  const dawnEl = d.getAttribute("data-ground") === "dawn" ? null : $("footer[data-dawn]");
  /* round 10: on a long page the header steps away while the reader goes down (past the first screen, after 48 px of
     travel in that direction) and comes back as soon as they go up 24 px, at the dawn close, at the top, or when the
     menu or a cut holds the page. html.hdr-away; css/chrome.css draws it (transform only) and keeps it under a focus. */
  let lastY = window.scrollY, runY = 0, away = false;
  function setAway(v) { if (v !== away) { away = v; d.classList.toggle("hdr-away", v); } }
  function awayStep(y) {
    const dy = y - lastY; lastY = y;
    if (!FX.flags.motion || open || leaving || d.hasAttribute("data-fx-locked")) { setAway(false); runY = 0; return; }
    if (y < window.innerHeight * 0.8 || overDawn) { setAway(false); runY = 0; return; }
    if ((dy > 0) !== (runY > 0)) runY = 0;
    runY += dy;
    if (runY > 48) setAway(true); else if (runY < -24) setAway(false);
  }
  function header() {
    const on = window.scrollY > 8;
    if (on !== scrolled) { scrolled = on; d.classList.toggle("is-scrolled", on); }
    if (dawnEl && hdrEl) {
      /* the header's box without its step-away transform: its height from the top of the viewport */
      const under = dawnEl.getBoundingClientRect().top < hdrEl.offsetHeight;
      if (under !== overDawn) { overDawn = under; if (under) d.setAttribute("data-hdr-ground", "dawn"); else d.removeAttribute("data-hdr-ground"); }
    }
    awayStep(window.scrollY);
  }

  /* ---------------------------------------------------------------- the header's rule (round 10)
     One 2 px rule under the items: under the page being read, it travels to the item under the hand or the focus and
     back when the hand leaves the nav. Its place is written as two custom properties on the rule itself (no ancestor
     restyles); on a page outside the five it rests hidden. */
  const nav = $(".hdr-nav"), rule = $("[data-hdr-rule]");
  const navLinks = nav ? $$(":scope > a", nav) : [];
  const current = navLinks.find((a) => a.getAttribute("aria-current") === "page") || null;
  function ruleTo(a, cold) {
    if (!rule) return;
    rule.classList.toggle("is-cold", !!cold);
    if (!a || !a.offsetWidth) { rule.classList.add("is-idle"); return; }
    rule.style.setProperty("--rx", a.offsetLeft + "px");
    rule.style.setProperty("--rw", String(a.offsetWidth / 100));
    if (cold) void rule.offsetWidth;
    rule.classList.remove("is-idle");
  }
  function ruleInit() {
    if (!nav || !rule || !FX.flags.motion) return;
    d.classList.add("nv-rule");
    const home = () => ruleTo(current, false);
    navLinks.forEach((a) => {
      a.addEventListener("pointerenter", () => ruleTo(a));
      a.addEventListener("focus", () => ruleTo(a));
    });
    nav.addEventListener("pointerleave", home);
    nav.addEventListener("focusout", (e) => { if (!nav.contains(e.relatedTarget)) home(); });
    /* the header's words enter on load: the rule takes its place once they have settled, and after the fonts */
    const place = () => { if (!nav.matches(":hover")) ruleTo(current, true); };
    setTimeout(place, 760);
    FX.fonts().then(place);
    window.addEventListener("resize", place, { passive: true });
  }

  /* ---------------------------------------------------------------- the menu */
  const btn = $("[data-menu-btn]"), menu = $("[data-menu]");
  let open = false, back = null, shutT = 0;
  const sheetOutMs = () => ms(getComputedStyle(d).getPropertyValue("--d-sheet-out"), 280);
  function setMenu(next) {
    if (!btn || !menu || next === open) return;
    open = next;
    clearTimeout(shutT);
    d.classList.remove("menu-closing");
    if (open) menu.hidden = false;
    else if (FX.flags.motion && !leaving) {
      /* it closes faster than it opened: the edge goes back up, then the sheet is hidden */
      d.classList.add("menu-closing");
      if (FX.mo && FX.mo.live) FX.mo.menuClose(menu);   // the rows go up first (fx-motion.js)
      shutT = setTimeout(() => { d.classList.remove("menu-closing"); if (!open) menu.hidden = true; }, sheetOutMs());
    } else menu.hidden = true;
    d.classList.toggle("menu-open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", btn.getAttribute(open ? "data-nv-close" : "data-nv-open") || "");
    if (open) {
      if (FX.mo && FX.mo.live) FX.mo.menuOpen(menu);   // round 13: the rows as a cue sheet (fx-motion.js)
      back = document.activeElement;
      FX.lock("menu");
      const first = $("a, button", menu);
      if (first) first.focus({ preventScroll: true });
    } else {
      FX.unlock("menu");
      if (back && back.focus && document.contains(back)) back.focus({ preventScroll: true }); else btn.focus({ preventScroll: true });
    }
  }
  function menuKeys(e) {
    if (!open) return;
    if (e.key === "Escape") { e.preventDefault(); setMenu(false); return; }
    if (e.key !== "Tab") return;
    const ring = [btn, ...$$("a[href], button", menu)].filter((el) => el.offsetParent !== null || el === btn);
    const i = ring.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); ring[ring.length - 1].focus(); }
    else if (!e.shiftKey && i === ring.length - 1) { e.preventDefault(); ring[0].focus(); }
  }

  /* ---------------------------------------------------------------- copy */
  function copy(b) {
    const addr = b.getAttribute("data-nv-copy") || "";
    const status = b.parentElement && $("[data-nv-copy-status]", b.parentElement);
    const done = (ok) => {
      b.setAttribute("data-state", ok ? "done" : "fail");
      if (FX.mo && FX.mo.live) FX.mo.copied(b);
      if (status) status.textContent = b.getAttribute(ok ? "data-nv-copied" : "data-nv-failed") || "";
      if (!ok) {
        const a = $$('a[href^="mailto:"]').find((x) => x.textContent.trim() === addr && x.offsetParent !== null);
        if (a) { const r = document.createRange(); r.selectNodeContents(a); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
      }
      clearTimeout(b._t);
      b._t = setTimeout(() => { b.removeAttribute("data-state"); if (status) status.textContent = ""; }, 2600);
    };
    try { navigator.clipboard.writeText(addr).then(() => done(true), () => done(false)); } catch (e) { done(false); }
  }

  /* ---------------------------------------------------------------- the cut */
  const sheet = $("[data-cut]");
  let leaving = false, fullT = 0;
  const PORTAL_FULL_MS = 340;   // the glass fills the frame by now even if the stage's frames came late
  /* (lane n-flight) the flight's two halves (fx-stage.js flyMs: the same numbers) */
  const FLY_MS = () => (innerWidth < 768 ? { out: 430, in: 400 } : { out: 520, in: 520 });
  /* (lane m-fly) a flight changes the page as soon as the old page's text has left (leaveText is out by 190 ms): the
     stage outlives the page, the room left behind goes on being drawn, and the new page comes up while the eye is
     still on its way to the door, so its room is seen through the glass from the door's first full frame */
  const SWAP_MS = 200;
  /** the ground the page before stood on, kept under the canvas since the page changed (rv-router.js) */
  const dropGround = () => { try { document.querySelectorAll(".cut-ground").forEach((e) => e.remove()); } catch (e) {} };
  /** the old page's text leaves (a flight) by its own masked exit: every block on screen goes up behind a straight
   *  mask, top to bottom 6 ms apart, 150 ms each; whatever is left of the page is out by 190 ms. Nothing in the DOM
   *  rides the camera. The animations carry the id "rv-leave" (a cancelled flight takes them away). */
  function leaveText() {
    const vh = innerHeight, EZ = "cubic-bezier(0.55, 0, 1, 0.45)";
    /** @type {HTMLElement[]} */ const seen = [];
    const blocks = $$("main :is(h1, h2, h3, h4, p, li, dt, dd, figcaption, blockquote, a.btn, .btn, .lnk, .t-label), footer[data-dawn] :is(h2, p, a)")
      .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < vh; })
      .filter((el) => { if (seen.some((s) => s.contains(el))) return false; seen.push(el); return true; })
      .slice(0, 48);
    blocks.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    blocks.forEach((el, i) => {
      try {
        const an = el.animate([{ clipPath: "inset(-0.3em -0.2em -0.3em -0.2em)", transform: "translate3d(0, 0, 0)" }, { clipPath: "inset(-0.3em -0.2em 104% -0.2em)", transform: "translate3d(0, -0.5em, 0)" }],
          { duration: 150, delay: Math.min(40, i * 6), easing: EZ, fill: "forwards" });
        an.id = "rv-leave";
      } catch (e) {}
    });
    /* (lane m-fly) the dawn close keeps its ground (a view with the morning in it flies now: the paper stays where it
       is until the door hides the frame); what is in it goes */
    $$("main, footer[data-dawn] > *, .dawn > *").forEach((el) => {
      try { const an = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 80, delay: 110, easing: "linear", fill: "forwards" }); an.id = "rv-leave"; } catch (e) {}
    });
  }
  /** @param {Element | null} a the clicked link (null: Back / Forward with no link to that page on screen)
   *  @param {URL} url @param {{ side?: number, traverse?: boolean }} [o] */
  function cutTo(a, url, o = {}) {
    if (leaving || !sheet) return false;
    leaving = true;
    const attr = (n) => (a ? a.getAttribute(n) || "" : "");
    const label = attr("data-pt-label"), sub = attr("data-pt-sub"), dawn = !!(a && a.hasAttribute("data-pt-dawn"));
    sheet.classList.toggle("is-dawn", dawn);
    if (open) setMenu(false);
    setAway(false);
    FX.lock("nav");
    let side = 1;
    if (o.side === -1 || o.side === 1) side = o.side;
    else try { const r = a.getBoundingClientRect(); side = r.left + r.width / 2 < window.innerWidth / 2 ? -1 : 1; } catch (e) {}
    const R = window.__rvRouter;
    /* (lane n-flight) THE NAV EVENTS (a contract between lanes): fx:nav:start { to, side, dawn, back, ms } — back: Back
       (the flight runs backward), ms: the planned time from now until the new room stands; fx:nav:covered { to } when
       the eye is at the door and the page changes; fx:nav:arrived {} when the new room stands */
    const canFly = !!R && d.classList.contains("stage-on") && !d.classList.contains("gl-off");
    const fm = FLY_MS();
    /* (lane m-fly) day: the morning in the view being left, 0 none, 1 the dawn close on screen, 2 the whole view
       (Contact). Such a view flies too, always forward, through a door that is the night standing on the paper; and a
       flight toward Contact is flown forward as well (the film of Back is a night room's) */
    let day = 0;
    if (d.getAttribute("data-ground") === "dawn") day = 2;
    else try { if (dawnEl && dawnEl.getBoundingClientRect().top < window.innerHeight - 2) day = 1; } catch (e) {}
    const back = !!(o.traverse && side === -1) && !(canFly && (day || dawn));
    /* the room takes the stage as the door hides the frame (about 0.9 of the leaving), then the arriving half */
    const planned = canFly ? Math.round(fm.out * 0.9) + fm.in + 40 : R ? 1000 : cutMs() + 40 + 480;
    /* (lane n-fix-flight) door: the planned ms from now to fx:nav:covered (the page changes). In a flight the page changes
       0.2 of the leaving before the eye is at the glass (fx-stage.js FLY_LEAD; toward Contact at the glass itself);
       glass: the planned ms from now until the eye is IN the glass (a flight: the leaving's length; else = door). A view
       in the morning leaves by the plain cut, the page changing under the sheet at --d-cut + 40 ms */
    const flies = canFly;
    const door = flies ? SWAP_MS : cutMs() + 40;
    FX.emit("fx:nav:start", { to: url.pathname, side, dawn, back, ms: planned, door, glass: flies ? fm.out : door, day });
    const fly = d.classList.contains("cut-fly");
    const portal = d.classList.contains("cut-portal");
    if (portal && !fly) { clearTimeout(fullT); fullT = setTimeout(() => d.classList.add("cut-full"), PORTAL_FULL_MS); }
    /* (lane n-flight) toward Contact the door's light is the morning: its paper floods the frame as the eye reaches the
       door (css/cuts.css html.cut-fly.cut-full), 110 ms before the page changes */
    /* (lane n-fix-flight) ... and the header's words turn to ink with it (they were light words lost on the paper) */
    /* (lane m-fly) ... no longer: the morning arrives as an edge of day the stage sweeps across the frame, seen through
       the door's glass (fx-stage.js DAY_MS); no sheet floods */
    if (R && portal && (!dawn || fly)) d.classList.add("cut-soft");
    /* (lane n-flight) the old page's text leaves by its own exit within 200 ms (nothing in the DOM rides the camera) */
    if (fly) leaveText();
    /* round 13: the card as one cue sheet in time with the camera's push (fx-motion.js); else the CSS card below.
       (lane n-flight) in a flight the card is read while the door is ahead and is gone before the eye is through */
    /* (lane m-fly) no card over a view with the morning in it: light type on paper is not read, and the door's night
       grows across it */
    const noCard = fly && day > 0;
    const played = !label || noCard || !!(FX.mo && FX.mo.live && FX.mo.cutOut(sheet, label, sub, fly ? { clearAt: Math.max(240, fm.out - 150) } : undefined));
    if (!played) cssCard(label, sub);
    if (!label && !(R && portal && (!dawn || fly))) { sheet.classList.add("is-rising"); }
    if (R) {
      /* the frame is covered: by the glass (the stage says so, at the latest PORTAL_FULL_MS + 80), else by the sheet */
      const covered = new Promise((res) => {
        if (fly) setTimeout(res, SWAP_MS);
        else if (portal) { FX.once("stage:full", res); setTimeout(res, PORTAL_FULL_MS + 80); }
        else setTimeout(() => { FX.emit("fx:nav:covered", { to: url.pathname }); res(); }, cutMs() + 40);
      });
      /* (lane n-flight) a flight's arrival is not a portal's (no glass to come out of: the eye goes on into the room) */
      /* day, top: the ground this view stands on (the router keeps it under the canvas from the page's change until
         the door hides the frame): day 2 all paper, 1 paper from `top` (viewport px) down, 0 the night */
      let top = 0;
      if (day === 1) try { top = Math.max(0, Math.round(dawnEl.getBoundingClientRect().top)); } catch (e) {}
      const job = { arrival: { t: Date.now(), to: url.pathname, label, sub, dawn, side, portal: portal && !fly, fly, back, soft: true, day, top }, covered };
      if (o.traverse) return job;   // Back / Forward: the router is already on its way
      R.go(url.href, job);
      return true;
    }
    let gone = false;
    const go = () => {
      if (gone) return; gone = true;
      FX.emit("fx:nav:covered", { to: url.pathname });
      try { sessionStorage.setItem("rv-pt", JSON.stringify({ t: Date.now(), to: url.pathname, label, sub, dawn, side, portal })); } catch (e) {}
      location.href = url.href;
    };
    /* the page leaves once the sheet is up and the card has played (both end by --d-cut): not on the sheet's own
       transitionend, which would cut the name's last word short */
    setTimeout(go, cutMs() + 40);
    /* a navigation the browser drops (download, blocked) must not leave the page covered */
    setTimeout(() => { if (document.visibilityState === "visible" && leaving) reset(); }, 6000);
    return true;
  }
  function cssCard(label, sub) {
    /* the title card: the name's words, each in its own box so it can rise from behind its mask (css/cuts.css) */
    const nameEl = $("[data-cut-label]", sheet);
    nameEl.textContent = "";
    label.split(/\s+/).filter(Boolean).forEach((w, i, all) => {
      const s = document.createElement("span");
      s.className = "w"; s.style.setProperty("--wi", String(i)); s.textContent = w;
      nameEl.appendChild(s);
      if (i < all.length - 1) nameEl.appendChild(document.createTextNode(" "));
    });
    $("[data-cut-sub]", sheet).textContent = sub;
    void sheet.offsetWidth;
    sheet.classList.add("is-rising");
  }
  function reset() {
    leaving = false;
    if (sheet) {
      sheet.classList.remove("is-rising", "is-clearing", "is-leaving", "is-dawn", "mo-cut");
      sheet.getAnimations({ subtree: true }).forEach((an) => { try { an.cancel(); } catch (e) {} });
      [sheet, ...sheet.querySelectorAll("*")].forEach((el) => { el.style.transform = ""; el.style.clipPath = ""; el.style.opacity = ""; });
    }
    d.removeAttribute("data-arrive"); d.removeAttribute("data-cut-dawn");
    dropGround();
    /* (lane n-flight) a flight cancelled: the page's text back */
    try { document.getAnimations().forEach((an) => { if (an.id === "rv-leave") an.cancel(); }); } catch (e) {}
    clearTimeout(fullT); d.classList.remove("cut-portal", "cut-full", "cut-soft", "cut-fly", "cut-flown");
    if (!overDawn) d.removeAttribute("data-hdr-ground");
    FX.unlock("nav");
    FX.emit("fx:nav:reset", {});
  }
  function onClick(e) {
    const t = e.target;
    const cb = t && t.closest ? t.closest("[data-nv-copy]") : null;
    if (cb) { e.preventDefault(); copy(cb); return; }
    if (btn && t && t.closest && t.closest("[data-menu-btn]")) { e.preventDefault(); setMenu(!open); return; }
    const a = t && t.closest ? t.closest("a[href]") : null;
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    /* (lane o-fix) a cut is under way: a second click (a double click, a click in the flight) is swallowed, or under the
       Astro router it would start a navigation of its own without the flight's arrival and leave the glass on the frame */
    if (leaving && a.target !== "_blank" && !a.hasAttribute("download")) { e.preventDefault(); return; }
    if (!a.hasAttribute("data-pt-label") || a.target === "_blank" || a.hasAttribute("download")) return;
    let url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) {
      if (open) setMenu(false);
      return;   // the same page: the browser (or Lenis) moves to its anchor, no cut
    }
    if (!FX.flags.motion) return;   // reduced motion: the browser's own navigation (or the router's plain swap)
    if (cutTo(a, url)) e.preventDefault();
  }

  /* an arrival: the sheet covered the first paint; it leaves upward and hands the page over */
  function arrive() {
    if (!sheet) { d.removeAttribute("data-arrive"); FX.ready("arrive"); return; }
    const A = window.__rvArrive;
    if (A && A.fly) return arriveFlown();
    /* round 11: the card clears first (its words go up, --d-cut-clear) while the sheet still covers the page, so its name
       is never on screen with the page's own h1; then the sheet leaves and the first screen rises */
    const clearMs = ms(getComputedStyle(d).getPropertyValue("--d-cut-clear"), 100);
    const outMs = ms(getComputedStyle(d).getPropertyValue("--d-cut-out"), 280);
    /* round 13: the card clears and the sheet leaves as beats (fx-motion.js) when the library is in within 250 ms */
    const mo = FX.mo && FX.has("motion") ? Promise.race([FX.mo.prepared, new Promise((r) => setTimeout(r, 300))]) : Promise.resolve(null);
    /* (wave 2, INTEGRATE) the card clears only once the arriving room is drawn under the sheet (FX.stage.frame, fx-stage.js),
       capped at 250 ms so a stage that never draws holds nothing: no empty night between the card and the lit room */
    const sf = FX.stage && FX.stage.expected && FX.stage.frame;
    const room = sf ? Promise.race([sf, new Promise((r) => setTimeout(r, 250))]) : Promise.resolve();
    const lib = Promise.all([mo, room]);
    return new Promise((resolve) => {
      lib.then(() => requestAnimationFrame(() => {
        let ended = false;
        const fin = () => { if (ended) return; ended = true; sheet.classList.remove("is-dawn", "is-leaving", "is-clearing", "mo-cut", "is-rising"); d.removeAttribute("data-cut-dawn"); d.classList.remove("cut-soft", "cut-portal", "cut-full"); FX.emit("fx:nav:arrived", {}); resolve(); };
        const beats = FX.mo && FX.mo.live && FX.mo.cutIn(sheet, clearMs, outMs, () => {
          d.removeAttribute("data-arrive");
          FX.ready("arrive");
          FX.emit("fx:nav:uncovered", {});
        }, fin);
        if (beats) { setTimeout(fin, clearMs + outMs + 600); return; }
        sheet.classList.add("is-clearing");
        setTimeout(lift, clearMs);
      }));
      function lift() {
        sheet.classList.add("is-leaving");
        d.removeAttribute("data-arrive");
        FX.ready("arrive");
        FX.emit("fx:nav:uncovered", {});
        let done = false;
        const end = () => {
          if (done) return; done = true;
          sheet.classList.remove("is-leaving", "is-clearing", "is-dawn", "is-rising");
          d.removeAttribute("data-cut-dawn"); d.classList.remove("cut-soft", "cut-portal", "cut-full");
          FX.emit("fx:nav:arrived", {});
          resolve();
        };
        const onEnd = (e) => { if (e.target === sheet && e.propertyName === "transform") { sheet.removeEventListener("transitionend", onEnd); end(); } };
        sheet.addEventListener("transitionend", onEnd);
        setTimeout(end, outMs + 150);
      }
    });
  }

  /* (lane n-flight) an arrival by a flight (the Astro router): the card cleared at the door, the eye is flying into this
     room. The page's text waits until the eye is nearly still (FX.stage.settle, capped), then its first screen rises
     (fx:nav:uncovered); fx:nav:arrived once the room stands (FX.stage.stood, capped) */
  function arriveFlown() {
    const S = FX.stage || {};
    const fm = FLY_MS();
    const cap = (p, ms) => Promise.race([p || Promise.resolve(), new Promise((r) => setTimeout(r, ms))]);
    /* the room stands from its first frame after the door: a scene that waits for the sheet to go (a case's plate reads
       the attribute) starts then; html.cut-flown (css/cuts.css) goes on holding the page's text and its load animations */
    cap(S.frame, 500).then(() => { d.removeAttribute("data-arrive"); d.removeAttribute("data-cut-dawn"); });
    return new Promise((resolve) => {
      cap(S.settle, fm.in + 450).then(() => {
        sheet.classList.remove("is-dawn", "is-leaving", "is-clearing", "mo-cut", "is-rising");
        sheet.getAnimations({ subtree: true }).forEach((an) => { try { an.cancel(); } catch (e) {} });
        d.removeAttribute("data-arrive"); d.removeAttribute("data-cut-dawn");
        d.classList.remove("cut-soft", "cut-portal", "cut-full", "cut-fly", "cut-flown");
        dropGround();   // the stage dropped it at its takeover; a stage that died never did
        FX.ready("arrive");
        FX.emit("fx:nav:uncovered", {});
        return cap(S.stood, fm.in + 600);
      }).then(() => { FX.emit("fx:nav:arrived", {}); resolve(); });
    });
  }

  FX.register("nav", {
    init() {
      FX.nav = { arrive, close: () => setMenu(false), get menuOpen() { return open; },
        /* (lane o-router) Back / Forward under the router: the same flight, its side given (-1 back, 1 forward), the card
           of a link to that page if one is on this page; returns { arrival, covered } or null (no flight) */
        fly(href, side) {
          if (!FX.flags.motion || !window.__rvRouter) return null;
          let url; try { url = new URL(href, location.href); } catch (e) { return null; }
          const a = $$("a[data-pt-label]").find((x) => { try { return new URL(x.href, location.href).pathname === url.pathname; } catch (e) { return false; } }) || null;
          const r = cutTo(a, url, { side, traverse: true });
          return r && typeof r === "object" ? r : null;
        } };
      header();
      ruleInit();
      window.addEventListener("scroll", header, { passive: true });
      window.addEventListener("resize", header, { passive: true });
      if (dawnEl && "ResizeObserver" in window) new ResizeObserver(() => header()).observe(document.body);
      document.addEventListener("click", onClick);
      document.addEventListener("keydown", menuKeys);
      window.addEventListener("pageshow", (e) => { if (e.persisted) reset(); });
      matchMedia("(min-width: 1024px)").addEventListener("change", (m) => { if (m.matches) setMenu(false); });
    },
  });
})();
