/* ==========================================================================
   fx-scroll.js · the focus verb, the step in focus, and the page's entrances (spec 50 §3, §6; round 10)

   1 Focus reveals. [data-focus] and [data-focus-lines] (whose .ln children rise --line-gap apart) come in once, when
     they first enter the viewport: this module adds .is-in; css/type.css draws the move. [data-focus="load"] /
     [data-focus-lines="load"] are the first screen's: CSS plays them at once, without waiting for this script (and
     holds them while a cut's sheet still covers the page).
   2 The step in focus. In scene mode (html.sc-on without gl-off) the .sc-step[data-stage-step] nearest the middle of
     the viewport in each scene is .is-active; css/scene.css pulls focus between steps. Reading data-stage-cue and
     data-stage-mark is the stage host's (fx-stage.js), not this module's.
   3 Entrances (round 10). The display titles of the steps and of the chapters are split into words (.rv-split .w, --li
     their line; .rv-wipe for the type the stage bends, [data-refract], whose glyph boxes must never move); the rows of
     the lists and the parts of a gallery step are marked .rv-row (--ri their place). A group comes in when .st-on is on
     it or on its step: in scene mode a step is .st-on while it is the step in focus (it leaves, faster, when it is not);
     outside scene mode each group comes in once, when it enters the viewport. Evidence's figures count up once to the
     printed value (the visible text ends byte-identical; a reader of the page meets only the printed value).
   html.fs-on says the module is running (until then the hidden states hold only 4 s, css/type.css).
   Nothing runs on an idle clock: one passive scroll listener, one rAF per change; the count is one rAF loop of ~1 s.
   Reduced motion: nothing is split or marked, nothing moves.
   ========================================================================== */
(() => {
  "use strict";
  const FX = window.FX;
  if (!FX) return;
  const d = document.documentElement;

  let io = null, steps = [], scenes = [], raf = 0, live = false;

  function reveal() {
    const els = [...document.querySelectorAll('[data-focus]:not([data-focus="load"]), [data-focus-lines]:not([data-focus-lines="load"])')];
    if (!FX.flags.motion || !("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("is-in")); return; }
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        /* (wave 7) the opening of a part of the home, claimed by fx-motion.js (.mo-own): it comes in with its beats */
        if (e.target.classList.contains("mo-own")) continue;
        e.target.classList.add("is-in");
      }
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0 });
    els.forEach((el) => io.observe(el));
  }

  const sceneMode = () => d.classList.contains("sc-on") && !d.classList.contains("gl-off");
  function collect() {
    scenes = [...document.querySelectorAll(".sc")].map((sc) => ({ sc, steps: [...sc.querySelectorAll(".sc-step[data-stage-step]")] })).filter((s) => s.steps.length);
    steps = scenes.flatMap((s) => s.steps);
  }
  function pick() {
    raf = 0;
    const mid = window.innerHeight / 2;
    const scn = live && sceneMode();
    for (const s of scenes) {
      let best = null, bd = Infinity;
      for (const el of s.steps) {
        // the step's text block, not the step's whole box: a tall step whose text is still below the fold must not take
        // the focus from the text the reader has on screen (a phone, Obla: only a dimmed block showed at rest)
        const r = (el.querySelector(".sc-in") || el).getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) continue;
        const dist = Math.abs(r.top + r.height / 2 - mid);
        if (dist < bd) { bd = dist; best = el; }
      }
      /* (lane n-sound) the contract between lanes: fx:step {scene, step, of} when a scene's active step changes */
      if (best && best !== s.cur) {
        s.cur = best;
        FX.emit("fx:step", { scene: s.sc.getAttribute("data-stage") || "", step: +best.getAttribute("data-stage-step"), of: s.steps.length });
      }
      for (const el of s.steps) {
        el.classList.toggle("is-active", el === best);
        if (scn) {
          const on = el === best;
          if (on !== el.classList.contains("st-on")) {
            /* round 13: the step's beats (fx-motion.js) take it over from the CSS before the class moves */
            if (FX.mo && FX.mo.live) FX.mo.step(el, on);
            el.classList.toggle("st-on", on);
            if (on) counts(el);
          }
        }
      }
    }
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(pick); };

  /* ---------------------------------------------------------------- 3 · entrances */
  const TITLES = ".sc-step .stp-t, .sc-step .wk-name, .sc-step .ev-set, .sc-step .ev-h, .sc-step .co-close, .cs-h, .cs-more-t, .dawn-h, .nf-ix .ix-t";
  const LISTS = ".tools, .mx, .cs-more-list, .cs-dl, .ob-fields, .cs-facts, .cs-list, .cs-flow, .cs-rep, .nf-rows";
  const PARTS = ".wk .sc-in, .cs-side-act, .dawn-in, .stp-proof";
  /* round 11: the pictures the stage does not draw (a case's chapter stills; never a [data-stage-poster] plate) */
  const PICS = "figure.cs-still";
  const groups = new Set();

  /* a title's words, each in its own inline box; the text nodes only (an <em> or a <cite> keeps its own element) */
  function split(el) {
    if (el.hasAttribute("data-split") || el.closest("[data-focus-lines]")) return;
    el.setAttribute("data-split", "");
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let t = tw.nextNode(); t; t = tw.nextNode()) if ((t.nodeValue || "").trim()) nodes.push(t);
    for (const t of nodes) {
      const f = document.createDocumentFragment();
      /* a no-break space keeps its words in one box, as it keeps them on one line */
      for (const part of t.nodeValue.split(/( +|\n+)/)) {
        if (!part) continue;
        if (/^[ \n]+$/.test(part)) { f.appendChild(document.createTextNode(part)); continue; }
        const s = document.createElement("span"); s.className = "w"; s.textContent = part; f.appendChild(s);
      }
      t.parentNode.replaceChild(f, t);
    }
    el.classList.add(el.closest("[data-refract]") ? "rv-wipe" : "rv-split");
    lines(el);
  }
  /* each word's line, by its top (re-read after a resize: the words stay, their lines change) */
  function lines(el) {
    let top = null, li = -1;
    for (const w of el.querySelectorAll(".w")) {
      const y = w.offsetTop;
      if (top === null || Math.abs(y - top) > 4) { top = y; li++; }
      w.style.setProperty("--li", String(li));
    }
  }
  function rows(el, from = 0) {
    let i = from;
    for (const c of el.children) {
      if (c.matches(".sr-only, [hidden]") || c.hasAttribute("data-split") || c.matches(".rv-split, .rv-wipe")) continue;
      c.classList.add("rv-row"); c.style.setProperty("--ri", String(Math.min(i, 12))); i++;
    }
  }
  function prepare() {
    if (!FX.flags.motion) return;
    document.querySelectorAll(TITLES).forEach((el) => { split(el); groups.add(el); });
    document.querySelectorAll(LISTS).forEach((el) => { rows(el); groups.add(el); });
    document.querySelectorAll(PARTS).forEach((el) => {
      if (el.closest(LISTS)) return;
      rows(el, el.matches(".dawn-in") ? 0 : 0);
      groups.add(el);
    });
    document.querySelectorAll(PICS).forEach((el) => {
      if (el.closest("[data-stage-poster]") || !el.querySelector("img")) return;
      el.classList.add("rv-pic"); groups.add(el);
    });
    /* a list inside a step follows the step's title: its rows wait a beat */
    document.querySelectorAll(".sc-step " + LISTS.split(", ").join(", .sc-step ")).forEach((el) => el.style.setProperty("--rd", "160ms"));
    /* the dawn's address and its line come with its title, under it */
    document.querySelectorAll(".dawn-in > .rv-row").forEach((el) => el.style.setProperty("--rd", "140ms"));
  }
  /* outside scene mode, or outside any step: each group comes in once, as it enters the viewport */
  function observeGroups() {
    const scn = sceneMode();
    const solo = [...groups].filter((g) => !(scn && g.closest(".sc-step[data-stage-step]")));
    if (!("IntersectionObserver" in window)) { solo.forEach((g) => { g.classList.add("st-on"); counts(g); }); return; }
    const gio = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        gio.unobserve(e.target);
        if (e.target.classList.contains("rv-pic")) { picOn(e.target); continue; }
        e.target.classList.add("st-on"); counts(e.target);
      }
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0 });
    solo.forEach((g) => gio.observe(g));
    /* a picture's lazy image is asked for well before it enters: Chrome's own lazy load fired up to 2.4 s after the
       figure was on screen (measured on a case, stage on and off), and the mask then opened on an empty box */
    const pre = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        pre.unobserve(e.target);
        const img = e.target.querySelector("img");
        if (img && img.loading === "lazy") img.loading = "eager";
        /* (wave 6, TITLES) a drawing that traces itself is read ahead, while the reader is elsewhere (fx-motion.js) */
        if (e.target.hasAttribute("data-trace") && FX.mo && FX.mo.traceLoad) FX.mo.traceLoad(e.target);
      }
    }, { rootMargin: "0px 0px 150% 0px", threshold: 0 });
    solo.filter((g) => g.classList.contains("rv-pic")).forEach((g) => pre.observe(g));
  }

  /* a picture opens once its image can be shown (a lazy image still loading would open on its empty ground); it never
     waits more than 1.2 s */
  function picOn(fig) {
    const img = fig.querySelector("img");
    let done = false;
    const go = () => { if (!done) { done = true; requestAnimationFrame(() => fig.classList.add("st-on")); } };
    /* (wave 6, TITLES) a drawing that traces itself opens with its lines still to draw (fx-motion.js); a drawing not
       read within 0.8 s opens as printed */
    if (fig.hasAttribute("data-trace") && FX.mo && FX.mo.traceLoad && FX.mo.live) {
      Promise.race([FX.mo.traceLoad(fig), new Promise((r) => setTimeout(() => r(false), 800))]).then((ok) => {
        if (ok && FX.mo.trace(fig)) { done = true; requestAnimationFrame(() => fig.classList.add("st-on")); return; }
        if (!img || (img.complete && img.naturalWidth)) go(); else { setTimeout(go, 1200); img.decode ? img.decode().then(go, go) : img.addEventListener("load", go, { once: true }); }
      });
      return;
    }
    if (!img || (img.complete && img.naturalWidth)) { go(); return; }
    setTimeout(go, 1200);
    if (img.decode) img.decode().then(go, go); else { img.addEventListener("load", go, { once: true }); img.addEventListener("error", go, { once: true }); }
  }

  /* Evidence's figures count up once, from zero to the printed value, in the language's own way of writing it. The
     printed text node is put back at the end, byte for byte; while it counts, the box is held at its printed width (no
     column moves) and the screen reader's text is the printed value (the counting copy is aria-hidden). */
  const counted = new WeakSet();
  function counts(root) {
    if (!FX.flags.motion || !root || !root.querySelectorAll) return;
    root.querySelectorAll(".mx-n .from, .mx-n .to").forEach((el) => {
      if (counted.has(el)) return;
      counted.add(el);
      countUp(el, el.classList.contains("to") ? 260 : 120);
    });
    if (root.matches(".cs-dl") || root.querySelector(".cs-dl")) record(root);
  }
  /** one printed figure counts up once from zero (its element holds the figure and at most a few words round it); its
   * box is held at the printed width, the figure set to the side the column reads from (`align`) */
  function countUp(el, delay, align = "right") {
    const text = el.textContent;
    const m = /^(\D*?)(\d+(?:[.,]\d+)?)(.*)$/s.exec(text);
    if (!m || el.children.length) return;
    const [, pre, numS, post] = m;
    const sep = numS.includes(",") ? "," : ".";
    const dec = numS.includes(sep) ? numS.split(sep)[1].length : 0;
    const target = parseFloat(numS.replace(",", "."));
    if (!isFinite(target)) return;
    const w = el.getBoundingClientRect().width;
    el.style.display = "inline-block"; el.style.minWidth = w + "px"; el.style.textAlign = align;
    const sr = document.createElement("span"); sr.className = "sr-only"; sr.textContent = text;
    const vis = document.createElement("span"); vis.setAttribute("aria-hidden", "true");
    el.textContent = ""; el.append(vis, sr);
    const dur = 1000 + Math.min(400, target * 4);
    const ease = (t) => 1 - Math.pow(1 - t, 4);
    const fmt = (v) => pre + v.toFixed(dec).replace(".", sep) + post;
    let t0 = 0;
    vis.textContent = fmt(0);
    const tick = (now) => {
      if (!t0) t0 = now + delay;
      const t = Math.max(0, Math.min(1, (now - t0) / dur));
      vis.textContent = fmt(target * ease(t));
      if (t < 1) requestAnimationFrame(tick);
      else { el.textContent = text; el.style.display = ""; el.style.minWidth = ""; el.style.textAlign = ""; }
    };
    requestAnimationFrame(tick);
  }
  /* (wave 6, TITLES) a case's record, once, as it comes into view, in the live state only (the printed states print
     its values): a count ("161 questions", "about 50 staff") counts up from zero; a year snaps to its value
     (fx-motion.js). Only what the row prints: the numbers are PRODUCT.md's, and the text ends byte for byte as printed */
  /* a figure, whole with its separators ("48,000" is one figure and is left as printed); no lookbehind (an older
     Safari cannot parse one and would lose the whole module) */
  const COUNT_SPLIT = /(\d+(?:[.,]\d+)*)/;
  const COUNTABLE = (s) => /^\d+$/.test(s) && !/^(19|20)\d\d$/.test(s);
  function record(root) {
    if (!sceneMode() || d.classList.contains("stage-dead")) return;
    const dds = root.matches(".cs-dl") ? [...root.querySelectorAll("dd")] : [...root.querySelectorAll(".cs-dl dd")];
    for (const dd of dds) {
      if (counted.has(dd)) continue;
      counted.add(dd);
      const row = dd.parentElement && dd.parentElement.classList.contains("rv-row") ? dd.parentElement : null;
      /* with its row, which rises --row-gap after the one above it */
      const delay = 20 + (row ? +(row.style.getPropertyValue("--ri") || 0) : 0) * 55;
      if (FX.mo && FX.mo.live && FX.mo.snap) FX.mo.snap(dd, delay);
      /* the counts: a figure that is not a year, in a text node of its own (a year already turned is aria-hidden) */
      const tw = document.createTreeWalker(dd, NodeFilter.SHOW_TEXT);
      const nodes = [];
      for (let t = tw.nextNode(); t; t = tw.nextNode()) {
        if (t.parentElement && t.parentElement.closest(".sr-only, .od, [aria-hidden='true']")) continue;
        if ((t.nodeValue || "").split(COUNT_SPLIT).some((p, i) => i % 2 === 1 && COUNTABLE(p))) nodes.push(t);
      }
      for (const t of nodes) {
        const f = document.createDocumentFragment(), els = [];
        t.nodeValue.split(COUNT_SPLIT).forEach((part, i) => {
          if (!part) return;
          if (i % 2 === 0 || !COUNTABLE(part)) { f.appendChild(document.createTextNode(part)); return; }
          const s = document.createElement("span"); s.className = "ct-n"; s.textContent = part;
          f.appendChild(s); els.push(s);
        });
        if (!els.length) continue;
        t.parentNode.replaceChild(f, t);
        /* the record reads from the left: the figure keeps its left edge and grows to the right */
        els.forEach((s) => countUp(s, delay + 140, "left"));
      }
    }
  }

  /* the first screen's lines rise on their own (CSS) while the stage reads the type it bends: once they have settled,
     one refresh lets the host measure their boxes at rest */
  function settle() {
    const ST = window.ScrollTrigger;
    if (!ST || !document.querySelector('[data-refract][data-focus-lines="load"], [data-refract] [data-focus-lines="load"]')) return;
    const ms = (parseFloat(getComputedStyle(d).getPropertyValue("--d-rise")) || 0.82) * 1000 + 400;
    setTimeout(() => FX.whenStill(() => { try { ST.refresh(); } catch (e) {} }, { timeout: 2500 }), ms);
  }

  let rsT = 0;
  const api = {
    /* the step in focus of a scene, or null (for anyone who asks: the stage reads its own) */
    activeStep(sc) { const el = sc && sc.querySelector(".sc-step.is-active"); return el ? +el.getAttribute("data-stage-step") : null; },
    refresh() { collect(); schedule(); },
  };

  FX.register("scroll", {
    init() { FX.scroll = api; },
    build() {
      collect();
      prepare();
      pick();
      window.addEventListener("scroll", schedule, { passive: true });
      d.classList.add("fs-on");
      /* the reveals and the entrances start when the page is handed over (after a cut's sheet has left) */
      FX.once("fx:ready", () => {
        reveal();
        live = true;
        observeGroups();
        pick();
        settle();
      });
    },
    onResize() {
      if (sceneMode()) schedule();
      clearTimeout(rsT);
      rsT = setTimeout(() => document.querySelectorAll("[data-split]").forEach(lines), 120);
    },
  });
})();
