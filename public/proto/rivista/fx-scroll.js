/* ==========================================================================
   fx-scroll.js · owner WP-C "Impaginazione"

   The typesetting of every section below the hero, on both pages:
     · lines rising from their masks (SplitText, autoSplit, leave-back exits)
     · fade-ups, rules drawn left to right, printed figures rising in masks
     · media curtains with inner scale, parallax drift
     · the work rail: pinned runway, counter-pan, per-tile scale, captions
       through containerAnimation, the 01 / 09 instrument
     · Measured: the scroll ink manifesto, then two ledgers
     · capabilities, path, band copy, footer, case page
     · FX.scroll.exitVisible / enterVisible / restore / tileRect / rebuildText

   House rules honoured here: every hidden state is set by gsap.set inside a
   motion-ok matchMedia, only transform / opacity / clip-path are animated, no
   second ticker, and no figure is ever counted up: the mask moves, the number
   is printed final from the first frame it is visible.
   ========================================================================== */
(() => {
  "use strict";
  if (!window.FX) return;

  const FX = window.FX;
  const d = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const MOTION = "(prefers-reduced-motion: no-preference)";
  const DESK = "(min-width: 1024px) and " + MOTION;
  const HAND = "(max-width: 1023.98px)";

  let G = null, ST = null, Split = null, mm = null;
  const motion = () => FX.flags.motion;

  /* ---------------------------------------------------------------- state */
  const lineRecs = [];          // { el, kind, split, tw, st, lines, shown, extra[] }
  let linesOpen = false;        // lines are split at build, but only rise once the entry film hands over
  const inkRecs = [];           // matchMedia-owned, killed through rebuild()
  let exited = null;            // what exitVisible took away, for enterVisible
  let railApi = null;           // { setP } once the rail is wired
  let ixCols = null, ixVal = 0, ixEl = null;

  /* ------------------------------------------------------------- 1. reveal
     Opt-in fade-up. fx-core.css hides [data-reveal] only under
     html.rv-ready.rv-motion, so rv-ready goes on in the same tick as the
     observer. Until fx:ready the intersections are only remembered: an entry
     film must not play the page's reveals behind its own cover. */
  function initReveal() {
    const all = $$("[data-reveal]");
    if (!all.length) return;
    if (!motion() || !("IntersectionObserver" in window)) {
      all.forEach((e) => e.classList.add("is-in"));
      return;
    }
    d.classList.add("rv-ready");
    /* FIX MQ-04: the case hero's blocks are not on the observer. They are released by the same
       moment that releases the title, in the plan's order: overline with the title, the CTA row
       at +350 ms (the lead rises at +250 ms from its own line config). One mechanism: CSS. */
    const heroEls = all.filter((e) => e.dataset.reveal === "hero");
    const els = all.filter((e) => e.dataset.reveal !== "hero");
    FX.once("fx:ready", () => heroEls.forEach((e) => {
      e.style.transitionDelay = (e.dataset.delay || "0") + "ms";
      e.classList.add("is-in");
    }));
    const pending = new Set();
    let open = FX.isReady;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (!en.isIntersecting) {
          /* reversible, but only downward: something that left through the top
             stays printed, so a jump in scroll can never leave it blank */
          if (en.boundingClientRect.top > 0) { en.target.classList.remove("is-in"); pending.delete(en.target); }
          else if (open) { en.target.classList.add("is-in"); pending.delete(en.target); }
          return;
        }
        if (open) en.target.classList.add("is-in");
        else pending.add(en.target);
      }),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((e) => io.observe(e));
    FX.once("fx:ready", () => {
      open = true;
      pending.forEach((e) => e.classList.add("is-in"));
      pending.clear();
    });
    document.addEventListener("focusin", (e) => {
      const r = e.target.closest && e.target.closest("[data-reveal]");
      if (r) r.classList.add("is-in");
    });
  }

  /* --------------------------------------------------------------- 2. text
     Lines rise 112% -> 0 out of their own mask, 1.05 s expo.out, stagger 0.09
     (a lead is quicker and tighter). On leave-back they leave upward through
     the same mask, 0.4 s power2.in, and the next entrance rises from below
     again, so a long page reads as one continuous movement. */
  const LINE = {
    "":        { dur: 1.05, stg: 0.09, del: 0 },
    hero:      { dur: 1.05, stg: 0.09, del: 0.08 },
    "hero-lead": { dur: 0.90, stg: 0.08, del: 0.25 },
    lead:      { dur: 0.90, stg: 0.08, del: 0 },
    counter:   { dur: 1.05, stg: 0.09, del: 0 },
  };

  /* FIX D5: on a match-cut arrival the case title and lead are set by a CSS film that starts at the
     document's first paint (fx-scroll.css section 10), so the cut never waits on the build to show
     type. They are left out of the split entirely. */
  const cssFilm = (el) => d.classList.contains("sc-film") && !!el.closest(".page-hero");
  function preHideLines() {
    if (!motion() || !Split) return;
    /* FIX MQ-07: visibility too, so a font swap before the split re-wraps nothing that counts */
    G.set($$("[data-lines]").filter((el) => !cssFilm(el)), { opacity: 0, visibility: "hidden" });
  }

  function buildLines() {
    if (!motion() || !Split) return;
    $$("[data-lines]").filter((el) => !cssFilm(el)).forEach((el) => {
      const kind = el.dataset.lines || "";
      const cfg = LINE[kind] || LINE[""];
      const rec = { el, kind, split: null, run: null, st: null, lines: null, shown: false, first: true, extra: [] };

      /* Each pass builds its own tween. Reusing one and killing it first would
         kill the thing being restarted: gsap.killTweensOf strips the targets. */
      const enter = () => {
        if (!rec.lines) return;
        /* split early (the layout is final before the entry film measures anything), speak late */
        if (!linesOpen) { rec.pending = true; return; }
        if (rec.shown && rec.run && rec.run.isActive()) return;
        rec.shown = true;
        rec.run && rec.run.kill();
        rec.run = G.fromTo(rec.lines,
          { yPercent: 112 },
          { yPercent: 0, duration: cfg.dur, ease: "expo.out", stagger: cfg.stg, delay: cfg.del, overwrite: true });
      };
      const leave = () => {
        if (!rec.lines) return;
        rec.shown = false;
        rec.run && rec.run.kill();
        rec.run = G.to(rec.lines, { yPercent: -110, duration: 0.4, ease: "power2.in", stagger: cfg.stg / 2, overwrite: true });
      };

      rec.split = Split.create(el, {
        type: "lines",
        mask: "lines",
        linesClass: "sc-line",
        aria: "none",   // FIX A1: a lines-only split never breaks words; no aria-label on a <p>
        autoSplit: true,
        onSplit(self) {
          rec.st && rec.st.kill();
          rec.run && rec.run.kill();
          rec.extra.splice(0).forEach((t) => { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); });
          rec.lines = self.lines;
          G.set(el, { opacity: 1, visibility: "visible" });
          G.set(self.lines, { yPercent: 112 });
          rec.st = ST.create({ trigger: el, start: "top 86%", onEnter: enter, onLeaveBack: leave });

          /* the work head: two staircase lines in counter-parallax */
          if (kind === "counter" && self.masks && self.masks.length > 1) {
            const t = G.fromTo(self.masks,
              { xPercent: (i) => (i % 2 ? 6 : -4) },
              { xPercent: (i) => (i % 2 ? -6 : 4), ease: "none",
                scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.25 } });
            rec.extra.push(t);
          }

          /* An element already past the start line when the split is made gets
             no onEnter, so read the same 86% line off its own rect. */
          const inView = el.getBoundingClientRect().top < window.innerHeight * 0.86;
          if (rec.first ? inView : rec.shown || inView) {
            /* the first pass is the page speaking; a re-split after a font swap
               or a width change only restores the state, it does not replay */
            if (rec.first || !linesOpen) enter();
            else { rec.shown = true; G.set(self.lines, { yPercent: 0 }); }
          }
          rec.first = false;
        },
      });
      rec.enter = enter;
      lineRecs.push(rec);
    });
    /* no element may stay hidden: if a split ever failed, print the text */
    setTimeout(() => {
      $$("[data-lines]").forEach((el) => {
        if (getComputedStyle(el).opacity === "0" || getComputedStyle(el).visibility === "hidden") G.set(el, { opacity: 1, visibility: "visible" });
      });
    }, 2500);
  }

  function killLines() {
    lineRecs.splice(0).forEach((r) => {
      r.st && r.st.kill();
      r.extra.forEach((t) => { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); });
      r.run && r.run.kill();
      r.split && r.split.revert();
      G.set(r.el, { clearProps: "opacity" });
    });
  }

  /* ---------------------------------------------------------- 3. the rules
     A hairline is drawn left to right. It is printed by default in CSS, so a
     failure here leaves the page ruled; only motion-ok takes it away first. */
  function buildRules() {
    mm.add(MOTION, () => {
      const rules = $$("[data-rule]");
      if (!rules.length) return;
      const made = rules.map((r) => G.fromTo(r,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.9, ease: "expo.out",
          scrollTrigger: { trigger: r.parentElement || r, start: "top 95%", toggleActions: "play none none reverse" } }));
      return () => {
        made.forEach((t) => { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); });
        G.set(rules, { clearProps: "transform" });
      };
    });
  }

  /* --------------------------------------------------------- 4. the rises
     Printed lines that come up through their own mask: ledger figures, the
     capability numbers, the path years, the case numerals, the footer heads.
     The value never changes, only the mask it rises out of. */
  function buildRises() {
    mm.add(MOTION, () => {
      const els = $$(".sc-rise");
      if (!els.length) return;
      G.set(els, { yPercent: 110 });
      const sts = ST.batch(els, {
        start: "top 94%",
        onEnter: (b) => G.to(b, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.05, overwrite: true }),
        onLeaveBack: (b) => G.to(b, { yPercent: 110, duration: 0.4, ease: "power2.in", stagger: 0.02, overwrite: true }),
      });
      return () => {
        sts.forEach((s) => s.kill());
        G.set(els, { clearProps: "transform" });
      };
    });
  }

  /* -------------------------------------------------------- 5. media, bars */
  function buildMedia() {
    mm.add(MOTION, () => {
      const figs = $$("[data-media]");
      if (!figs.length) return;
      const made = [];
      /* A match cut hands this figure over already painted (WP-A sets data-nv-arrived, and the
         arrival record says so before build): its curtain is skipped so the swap is one frame. */
      const arrivedFlip = d.getAttribute("data-arrive") === "flip";
      figs.forEach((fig) => {
        const img = $("img", fig);
        if (fig.hasAttribute("data-nv-arrived") || (arrivedFlip && fig.dataset.media === "case-hero")) return;
        G.set(fig, { clipPath: "inset(100% 0% 0% 0%)" });
        if (img) G.set(img, { scale: 1.15 });
        const tl = G.timeline({ paused: true })
          .to(fig, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.out" }, 0);
        if (img) tl.to(img, { scale: 1, duration: 1.6, ease: "expo.out" }, 0);
        const st = ST.create({ trigger: fig, start: "top 88%", once: true, onEnter: () => tl.play() });
        made.push(tl, st);
        /* the case hero waits for the cut to hand the page over */
        if (fig.dataset.media === "case-hero") { tl.pause(0); FX.once("fx:ready", () => st.isActive && tl.play()); }
      });
      return () => {
        made.forEach((m) => { m.kill && m.kill(); });
        G.set(figs, { clearProps: "clipPath" });
        G.set($$("[data-media] img"), { clearProps: "transform" });
      };
    });
  }

  function buildParallax() {
    mm.add({ phone: "(max-width: 767.98px)", ok: MOTION }, (c) => {
      if (!c.conditions.ok) return;
      const amp = c.conditions.phone ? 2.5 : 5;
      const inners = $$("[data-parallax]");
      if (!inners.length) return;
      const made = inners.map((inner) => G.fromTo(inner,
        { yPercent: -amp, scale: 1.12 },
        { yPercent: amp, scale: 1.12, ease: "none",
          scrollTrigger: { trigger: inner.parentElement, start: "top bottom", end: "bottom top", scrub: true } }));
      return () => {
        made.forEach((t) => { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); });
        G.set(inners, { clearProps: "transform" });
      };
    });
  }

  function buildBars() {
    mm.add(MOTION, () => {
      const rows = $$("[data-bars]");
      if (!rows.length) return;
      const made = rows.map((li) => {
        const bars = $$(".bar i", li);
        return G.fromTo(bars, { scaleX: 0 },
          { scaleX: 1, duration: 1.1, ease: "expo.out", stagger: 0.08,
            scrollTrigger: { trigger: li, start: "top 90%", toggleActions: "play none none reverse" } });
      });
      return () => {
        made.forEach((t) => { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); });
        G.set($$("[data-bars] .bar i"), { clearProps: "transform" });
      };
    });
  }

  /* ----------------------------------------------------------- 6. the rail */
  function setupIndex(el) {
    ixEl = el;
    if (!el || !motion() || !G) return;
    el.textContent = "";
    ixCols = [];
    for (let c = 0; c < 2; c++) {
      const cell = document.createElement("span");
      cell.className = "sc-ix-cell";
      const col = document.createElement("span");
      col.className = "sc-ix-col";
      for (let i = 0; i < 10; i++) {
        const n = document.createElement("i");
        n.textContent = String(i);
        col.appendChild(n);
      }
      cell.appendChild(col);
      el.appendChild(cell);
      ixCols.push(col);
    }
    ixVal = 1;
    G.set(ixCols[0], { yPercent: 0 });
    G.set(ixCols[1], { yPercent: -10 });
  }

  function setIndex(n) {
    if (n === ixVal) return;
    ixVal = n;
    const s = String(n).padStart(2, "0");
    if (!ixCols) { if (ixEl) ixEl.textContent = s; return; }
    ixCols.forEach((col, i) => G.to(col, { yPercent: -10 * Number(s[i]), duration: 0.45, ease: "expo.out", overwrite: true }));
  }

  function buildRail() {
    const wrap = $("[data-railway]");
    if (!wrap) return;
    const rail = $("[data-rail]", wrap);
    const track = $("[data-track]", wrap);
    if (!rail || !track) return;
    const pans = $$(".pan", track);
    const tiles = $$(".tile", track);
    const medias = $$(".tile-media", track);
    const bar = $(".sc-ix-bar > i", wrap);

    let moveSt = null;
    setupIndex($("[data-rail-index]", wrap));
    /* FIX MQ-13: no inherited custom property on the whole rail any more. The bar is driven
       directly and --rail-p (registered, non-inheriting) is written on the two pans only. */
    const setP = (p) => {
      p = Math.min(1, Math.max(0, p));
      if (bar) bar.style.transform = "translateX(" + (p * 200).toFixed(2) + "%)";
      for (let i = 0; i < pans.length; i++) pans[i].style.setProperty("--rail-p", p.toFixed(4));
      setIndex(Math.min(tiles.length, Math.floor(p * tiles.length) + 1));
    };
    setP(0);
    railApi = { setP, get st() { return moveSt; } };

    /* the tiles unroll once, like a proof sheet coming off the press. On a flip-back arrival the
       returning tile is already painted by the overlay and WP-A unrolls its neighbours itself. */
    mm.add(MOTION, () => {
      if (d.getAttribute("data-arrive") === "flip-back") return;
      const t = G.fromTo(medias,
        { clipPath: "inset(0% 0% 100% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "expo.out", stagger: 0.08,
          scrollTrigger: { trigger: wrap, start: "top 82%", once: true } });
      return () => { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); G.set(medias, { clearProps: "clipPath" }); };
    });

    /* desktop: a pinned runway. The track tween keeps ease "none" because the
       caption triggers hang off it through containerAnimation (GSAP rule). */
    mm.add(DESK, () => {
      rail.setAttribute("data-on", "");
      wrap.setAttribute("data-on", "");
      let top = 0;
      const ix = $(".sc-ix", wrap);
      const overflow = () => Math.max(0, track.scrollWidth - rail.clientWidth);
      const size = () => {
        /* the rail and its instrument are centred as one block */
        const ixH = ix ? ix.offsetHeight + 38 : 0;
        top = Math.max(0, Math.round((window.innerHeight - rail.offsetHeight - ixH) / 2));
        wrap.style.setProperty("--rail-len", rail.offsetHeight + "px");
        wrap.style.setProperty("--rail-top", top + "px");
        wrap.style.setProperty("--rail-run", Math.round(overflow() * 0.6) + "px");
      };
      size();
      ST.addEventListener("refreshInit", size);
      const cfg = (extra) => Object.assign({
        trigger: wrap,
        start: () => "top " + top + "px",
        end: () => "bottom " + (top + rail.offsetHeight) + "px",
        scrub: 0.6,
        invalidateOnRefresh: true,
      }, extra || {});

      const move = G.fromTo(track, { x: 0 },
        { x: () => -overflow(), ease: "none", scrollTrigger: cfg({ onUpdate: (s) => setP(s.progress) }) });
      moveSt = move.scrollTrigger;
      /* FIX J8: the captures pan a little and keep their top-left headline whole */
      const pan = G.fromTo(pans, { xPercent: -2.5 }, { xPercent: 2.5, ease: "none", scrollTrigger: cfg() });

      const made = [move, pan];
      tiles.forEach((tile) => {
        const p = $(".pan", tile);
        const cap = $$(".tile-cap > *", tile);
        G.set(cap, { y: 26, opacity: 0 });
        const tl = G.timeline({ paused: true });
        if (p) tl.fromTo(p, { scale: 1.08 }, { scale: 1, duration: 1.2, ease: "expo.out" }, 0);
        if (cap.length) tl.to(cap, { y: 0, opacity: 1, duration: 0.9, ease: "expo.out", stagger: 0.06 }, 0.1);
        const st = ST.create({
          trigger: tile, containerAnimation: move, start: "left 90%",
          /* FIX MQ-09: an exit is faster than its entrance */
          onEnter: () => tl.timeScale(1).play(), onLeaveBack: () => tl.timeScale(2.5).reverse(),
        });
        if (st.isActive || st.progress > 0) tl.progress(1);
        made.push(tl, st);
      });

      const onFocus = (e) => {
        const tile = e.target.closest && e.target.closest(".tile");
        if (!tile || !move.scrollTrigger) return;
        rail.scrollLeft = 0;
        const s = move.scrollTrigger;
        const p = Math.min(1, Math.max(0, (tile.offsetLeft - window.innerWidth * 0.25) / Math.max(1, overflow())));
        FX.scrollTo(s.start + p * (s.end - s.start), { immediate: true });
      };
      rail.addEventListener("focusin", onFocus);

      return () => {
        ST.removeEventListener("refreshInit", size);
        rail.removeEventListener("focusin", onFocus);
        rail.removeAttribute("data-on");
        wrap.removeAttribute("data-on");
        ["--rail-len", "--rail-top", "--rail-run"].forEach((p) => wrap.style.removeProperty(p));
        made.forEach((m) => { m.scrollTrigger && m.scrollTrigger.kill(); m.kill && m.kill(); });
        G.set([track].concat(pans), { clearProps: "transform" });
        G.set($$(".tile-cap > *", track), { clearProps: "transform,opacity" });
        moveSt = null;
      };
    });

    /* below 1024: the native horizontal scroll, with the same instrument */
    mm.add(HAND, () => {
      let room = 1;
      const measure = () => { room = Math.max(1, rail.scrollWidth - rail.clientWidth); };
      const upd = () => setP(rail.scrollLeft / room);
      measure(); upd();
      rail.addEventListener("scroll", upd, { passive: true });
      window.addEventListener("resize", measure);
      return () => {
        rail.removeEventListener("scroll", upd);
        window.removeEventListener("resize", measure);
      };
    });
  }

  /* ------------------------------------------------------- 7. Measured ink
     180vh, a sticky screen, and the manifesto inks word by word under the
     reader's own scroll: 0.22 -> 1, stagger 1, scrub 0.6. Nothing moves. */
  /* FIX A2 / J14: a word not yet inked rests at 0.52, which keeps the large type above 3:1 in
     all three variants, so the sentence is readable at every point of the scrub */
  const INK_REST = 0.52;
  function buildInk() {
    const sec = $(".sc-ink");
    const h = sec && $("[data-ink]", sec);
    if (!sec || !h || !Split) return;

    mm.add(DESK, () => {
      sec.setAttribute("data-on", "");
      const split = Split.create(h, { type: "words", wordsClass: "sc-w", aria: "none" });
      G.set(split.words, { opacity: INK_REST });
      const tw = G.to(split.words, {
        opacity: 1, ease: "none", stagger: 1, duration: 1,
        /* the last word finishes a little before the sheet releases, so the
           manifesto is read whole, not caught mid-sentence */
        scrollTrigger: {
          trigger: sec, start: "top top",
          end: () => "+=" + Math.round((sec.offsetHeight - window.innerHeight) * 0.86),
          scrub: 0.6, invalidateOnRefresh: true,
        },
      });
      inkRecs.push(tw, split);
      return () => {
        sec.removeAttribute("data-on");
        tw.scrollTrigger && tw.scrollTrigger.kill();
        tw.kill();
        split.revert();
      };
    });

    mm.add("(max-width: 1023.98px) and " + MOTION, () => {
      const split = Split.create(h, { type: "lines,words", wordsClass: "sc-w", aria: "none" });
      G.set(split.words, { opacity: INK_REST });
      const tw = G.to(split.words, {
        opacity: 1, ease: "none", stagger: 0.6, duration: 1,
        scrollTrigger: { trigger: h, start: "top 82%", end: "bottom 45%", scrub: 0.5 },
      });
      inkRecs.push(tw, split);
      return () => {
        tw.scrollTrigger && tw.scrollTrigger.kill();
        tw.kill();
        split.revert();
      };
    });
  }

  /* ------------------------------------------ 7b. the replaced tools (case, J5)
     A 1 px ink strike draws through each tool's name after it has risen: the eight
     tools SphereNode replaced. Printed by default (CSS), so reduced motion keeps it. */
  function buildStrikes() {
    mm.add(MOTION, () => {
      const els = $$("[data-strike]");
      if (!els.length) return;
      G.set(els, { scaleX: 0 });
      const sts = ST.batch(els, {
        start: "top 88%", once: true,
        onEnter: (b) => G.to(b, { scaleX: 1, duration: 0.7, ease: "expo.out", stagger: 0.07, delay: 0.45, overwrite: true }),
      });
      return () => { sts.forEach((s) => s.kill()); G.set(els, { clearProps: "transform" }); };
    });
  }

  /* ------------------------------------------------- 8. the magnetic email */
  function buildMagnetic() {
    mm.add("(hover: hover) and (pointer: fine) and " + MOTION, () => {
      const els = $$("[data-magnetic]");
      if (!els.length) return;
      const off = els.map((el) => {
        const qx = G.quickTo(el, "x", { duration: 0.45, ease: "power3" });
        const qy = G.quickTo(el, "y", { duration: 0.45, ease: "power3" });
        const clamp = (v) => Math.max(-12, Math.min(12, v));
        const move = (e) => {
          const r = el.getBoundingClientRect();
          qx(clamp((e.clientX - (r.left + r.width / 2)) * 0.3));
          qy(clamp((e.clientY - (r.top + r.height / 2)) * 0.5));
        };
        const out = () => { qx(0); qy(0); };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", out);
        el.addEventListener("blur", out);
        return () => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", out);
          el.removeEventListener("blur", out);
          G.set(el, { clearProps: "transform" });
        };
      });
      return () => off.forEach((f) => f());
    });
  }

  /* -------------------------------------------------------- 9. cuts: exits */
  const onScreen = (el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
  };

  function exitVisible(o) {
    if (!motion() || !G) return Promise.resolve();
    const lines = [];
    lineRecs.forEach((rec) => { if (rec.lines && rec.shown && onScreen(rec.el)) lines.push.apply(lines, rec.lines); });
    const rises = $$(".sc-rise").filter(onScreen);
    /* the rail captions are visible type too: they leave before the cut, not with the columns */
    const reveals = $$("[data-reveal].is-in").concat($$(".tile-cap > *:not(.sr-only)")).filter(onScreen);
    exited = { lines, rises, reveals };
    if (!lines.length && !rises.length && !reveals.length) return Promise.resolve();
    return new Promise((res) => {
      let done = false;
      const end = () => { if (!done) { done = true; res(); } };
      const tl = G.timeline({ onComplete: end });
      if (lines.length) tl.to(lines, { yPercent: -110, duration: 0.3, ease: "power2.in", stagger: 0.02 }, 0);
      if (rises.length) tl.to(rises, { yPercent: -110, duration: 0.3, ease: "power2.in", stagger: 0.02 }, 0);
      if (reveals.length) {
        G.set(reveals, { transition: "none" });
        tl.to(reveals, { opacity: 0, y: -18, duration: 0.3, ease: "power2.in", stagger: 0.02 }, 0);
      }
      G.delayedCall(0.75, end); // guarded: a cut is never held up by a tween
    });
  }

  function enterVisible() {
    if (!motion() || !G || !exited) return Promise.resolve();
    const { lines, rises, reveals } = exited;
    exited = null;
    return new Promise((res) => {
      let done = false;
      const end = () => { if (!done) { done = true; res(); } };
      const tl = G.timeline({ onComplete: end });
      if (lines.length) tl.fromTo(lines, { yPercent: 112 }, { yPercent: 0, duration: 1.05, ease: "expo.out", stagger: 0.09 }, 0);
      if (rises.length) tl.fromTo(rises, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.05 }, 0);
      if (reveals.length) tl.to(reveals, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.05,
        onComplete: () => G.set(reveals, { clearProps: "transition,transform,opacity" }) }, 0);
      G.delayedCall(1.4, end);
    });
  }

  /* --------------------------------------------- 10. restore after a cut */
  function snapScrubs() {
    if (!ST) return;
    ST.getAll().forEach((s) => {
      try { const t = s.getTween && s.getTween(); if (t) t.progress(1); } catch (e) {}
    });
  }

  function restore(o) {
    let y = Math.max(0, (o && o.y) || 0);
    try { if (ST) ST.refresh(); } catch (e) {}
    /* inside the pinned runway a vertical offset only moves the rail, so land on the scroll
       position that reproduces the rail frame the reader left, not the one the scrub was chasing */
    const s = railApi && railApi.st;
    if (s && o && typeof o.railP === "number" && y >= s.start - 2 && y <= s.end + 2) {
      y = Math.round(s.start + Math.min(1, Math.max(0, o.railP)) * (s.end - s.start));
    }
    FX.scrollTo(y, { immediate: true });
    window.scrollTo(0, y);
    try { if (ST) ST.update(); } catch (e) {}
    snapScrubs();
    if (railApi && railApi.st) railApi.setP(railApi.st.progress);
    return y;
  }
  /* the rail as the reader SAW it (the track tween's own progress, scrub lag included), so a cut
     can come back to exactly that frame */
  function railProgress() {
    const s = railApi && railApi.st;
    if (!s || !s.animation) return null;
    const y = window.scrollY;
    if (y < s.start - 2 || y > s.end + 2) return null;
    return s.animation.progress();
  }

  function tileRect(id) {
    const el = document.querySelector('[data-tile-id="' + String(id) + '"] .tile-media');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, right: r.right, bottom: r.bottom, left: r.left, width: r.width, height: r.height, x: r.x, y: r.y };
  }

  function rebuildText() {
    if (!G || !Split) return;
    killLines();
    buildLines();
    try { ST.refresh(); } catch (e) {}
  }

  /* ------------------------------------------------------------- 11. boot */
  FX.register("scroll", {
    init(ctx) {
      G = ctx.gsap;
      ST = ctx.ScrollTrigger;
      mm = ctx.mm;
      Split = window.SplitText || null;
      FX.scroll = { exitVisible, enterVisible, restore, tileRect, rebuildText, railProgress, setRailProgress: (p) => railApi && railApi.setP(p) };
      FX.exits.push(exitVisible);
      initReveal();
    },

    build() {
      if (!G || !ST) return;
      preHideLines();
      buildRules();
      buildRises();
      buildMedia();
      buildParallax();
      buildBars();
      buildRail();
      buildInk();
      buildStrikes();
      buildMagnetic();
      /* The lines are split now, so the page's layout is final before any entry film measures it
         (a split can re-wrap a lead by one line). They are the page speaking, so they only rise
         once the entry film has handed the page over. */
      buildLines();
      FX.once("fx:ready", () => {
        linesOpen = true;
        lineRecs.forEach((r) => { if (r.pending) { r.pending = false; r.enter(); } });
        /* FIX MQ-02: a refresh at hand-over must never move the page the arrival has just placed */
        const y0 = window.scrollY;
        try { ST.refresh(); } catch (e) {}
        if (Math.abs(window.scrollY - y0) > 2) { FX.scrollTo(y0, { immediate: true }); window.scrollTo(0, y0); try { ST.update(); } catch (e) {} }
      });
    },

    onVariant() { rebuildText(); },

    onResize(e) {
      if (e && e.widthChanged && railApi && railApi.st) railApi.setP(railApi.st.progress);
    },
  });
})();
