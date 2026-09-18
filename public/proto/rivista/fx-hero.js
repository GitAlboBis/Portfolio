/* ==========================================================================
   fx-hero.js · owner WP-B "Carta corrente"
   S1 "Registro"  · the instrument preloader and its handoff into the page
   S2 placement   · which host owns the single GL canvas, and in which mode
   S3 "Otturatore"· the sticky stage: the window grows, the lockup leaves, the
                    glyph travels, and the next sheet rises over the plate
   Band           · the closing composition, mounted after fx:built

   Contract (plan §9): FX.hero.intro() is called once by fx-core, after build,
   when html[data-preloader] is set. It runs S1, emits fx:intro:handoff, removes
   data-preloader and rv-pre-run, writes sessionStorage rv-intro-seen and calls
   FX.ready("intro"). Runtime property written here: --hero-cover on <html>,
   only while the stage is on (C consumes it on its first section).
   ========================================================================== */
(() => {
  "use strict";
  if (!window.FX) return;
  const FX = window.FX;
  const D = document.documentElement;

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const seg = (p, a, b) => clamp01((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  let G = null, ST = null, mm = null, entry = "plain";
  let stage = null, screen = null, slotEl = null, heroHost = null, bandHost = null;
  let word1 = null, word2 = null, ornWrap = null, fades = [], frame = null, instr = null;
  let pre = null, preSheet = null, preFoot = null, digIn = [], digSt = [], preRuleI = null, preMeta = null, preWhat = null;

  let stageOn = false, float = false, introRunning = false, stageP = 0;
  let slot = { top: 0, left: 0, width: 0, height: 0 };
  const gl = () => FX.gl;

  /* ===================================================================== S1
     Real progress. tasks = variant fonts, GL program link, obstacle texture,
     DOMContentLoaded. The shown value follows the Lusion curve and is capped by
     elapsed/1000*100, so it can never be faster than one second and never fakes
     a delay.                                                                  */
  const tasks = { fonts: false, dom: false };
  const T0 = typeof window.__rvT0 === "number" ? window.__rvT0 : performance.now();
  let shown = 0, counterLast = performance.now(), counterOn = false, doneRes = null;
  const PLATE_STEPS = 90;
  /* FIX MQ-01: the counter reads the engine itself. Shaders = the parallel link has resolved
     (or there is no engine to wait for); Plate = the share of the chunked warm-up already run,
     so the digits advance in real steps, frame by frame, instead of 000 then 047. */
  function progress() {
    const g = gl(), on = !!(g && FX.flags.gl);
    const linked = !on || g.linked;
    const plate = on && float ? (!g.linked ? 0 : clamp01(1 - g.warmLeft / PLATE_STEPS)) : 1;
    return { fonts: tasks.fonts, shaders: linked, plate, dom: tasks.dom };
  }

  function gear(v, k) {
    if (k === 0) return ((v % 10) + 10) % 10;         // the 11th cell is a duplicate 0: the wrap is seamless
    const u = v / Math.pow(10, k);
    const d = Math.floor(u) % 10;
    const f = u - Math.floor(u);
    return d + (f > 0.9 ? (f - 0.9) * 10 : 0);
  }
  function paintCounter(v) {
    for (let i = 0; i < digSt.length; i++) {
      const pos = gear(v, digSt.length - 1 - i);
      digSt[i].style.transform = "translateY(calc(" + (-pos).toFixed(3) + " * var(--cell)))";
    }
    if (preRuleI) preRuleI.style.transform = "scaleX(" + (v / 100).toFixed(4) + ")";
    if (preWhat) {
      const t = progress();
      const what = !t.fonts ? "Fonts" : !t.shaders ? "Shaders" : t.plate < 1 ? "Plate" : "Ready";
      if (preWhat.textContent !== what) preWhat.textContent = what;
    }
  }
  const counterDone = () => shown >= 99.9 || performance.now() - T0 > 2600;
  function counterTick() {
    if (!counterOn) return;
    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0.001, (now - counterLast) / 1000));
    counterLast = now;
    const t = progress();
    const done = (t.fonts ? 1 : 0) + (t.shaders ? 1 : 0) + t.plate + (t.dom ? 1 : 0);
    const target = (done / 4) * 100;
    shown += (target - shown) * (1 - Math.exp(-9 * dt));
    if (target >= 100 && shown > 99.4) shown = 100;
    shown = Math.min(shown, ((now - T0) / 1000) * 100, 100);
    paintCounter(shown);
    /* the exit starts on the very frame the shown value reaches 100, after an 80 ms hold */
    if (doneRes && counterDone()) { const r = doneRes; doneRes = null; stopCounter(); G.delayedCall(0.08, r); }
  }
  function stopCounter() { counterOn = false; G.ticker.remove(counterTick); paintCounter(100); }

  /* ================================================================ layout */
  function measureSlot() {
    if (!slotEl) return;
    const r = slotEl.getBoundingClientRect();
    slot = { top: r.top, left: r.left, width: r.width, height: r.height };
  }
  /* the window the preloader opens: a centred band that clears the counter block */
  function openRect() {
    const W = window.innerWidth, H = window.innerHeight;
    const footTop = preFoot ? preFoot.getBoundingClientRect().top : H * 0.72;
    const top = H * 0.14;
    const bottom = Math.max(top + H * 0.3, Math.min(H * 0.86, footTop - H * 0.05));
    return { top, left: W * 0.23, width: W * 0.54, height: bottom - top };
  }
  function simOf(rect) {
    const W = window.innerWidth, H = window.innerHeight, a = W / H;
    return { x: ((rect.left + rect.width / 2) / W) * a, y: 1 - (rect.top + rect.height / 2) / H, a };
  }
  /* ============================================================== hosting */
  let io = null, heroVisible = false, bandVisible = false, wanted = "";
  /* In float mode the canvas is fixed behind the hero screen, so the plate's own
     paper-deep ground and its poster must step aside; they come straight back if
     the context is lost. */
  const setFloatSkin = (on) => { if (frame) frame.classList.toggle("hr-float", !!on); };
  function mountHero() {
    if (!gl()) return;
    setFloatSkin(float);
    gl().mount(heroHost, { mode: float ? "float" : "dock", ground: "deep" });
    gl().setObstacle({ type: "glyph", char: "A" });
    if (!float) {
      const st = gl().stats;
      const a = st.w && st.h ? st.w / st.h : 1;
      gl().params.glyphX = a / 2;
      gl().params.glyphY = 0.5;
      gl().params.glyphScale = Math.min(0.88, a * 0.86);   // a portrait plate must not crop the letter
      gl().params.drift = 0.105;
    }
  }
  function mountBand() {
    if (!gl() || !bandHost) return;
    setFloatSkin(false);
    gl().mount(bandHost, { mode: "dock", ground: "paper" });
    const copy = $("[data-band-copy]") || bandHost.parentNode;
    const els = $$("h2, a, p", copy).filter((el) => el.offsetParent !== null);
    gl().setObstacle({ type: "rects", els, pad: 0.4 });
    gl().warm(60);
  }
  /* FIX MQ-05: the band is mounted a full viewport early, in idle time, and every host switch
     costs one chunked warm-up (10 steps a frame) instead of two blocking ones. */
  function chooseHost() {
    if (!gl()) return;
    const next = heroVisible ? "hero" : bandVisible ? "band" : "";
    if (next === wanted) return;
    wanted = next;
    if (!next) { gl().sleep(true); return; }
    const start = () => {
      if (!FX.flags.motion) { gl().warm(180); gl().sleep(false); return; }   // a still engraving
      gl().wake();
    };
    if (next === "hero") { mountHero(); gl().warm(40); start(); return; }
    const run = () => { if (wanted !== "band" || !gl()) return; mountBand(); start(); };
    if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 500 }); else setTimeout(run, 60);
  }
  function observeHosts() {
    if (!("IntersectionObserver" in window)) { heroVisible = true; chooseHost(); return; }
    const onEntries = (entries) => {
      entries.forEach((e) => {
        if (e.target === heroHost) heroVisible = e.isIntersecting;
        else if (e.target === bandHost) bandVisible = e.isIntersecting;
      });
      chooseHost();
    };
    io = new IntersectionObserver(onEntries, { rootMargin: "25%" });
    if (heroHost) io.observe(heroHost);
    if (bandHost) new IntersectionObserver(onEntries, { rootMargin: "100% 0px" }).observe(bandHost);
  }

  /* ============================================================ S3 scrub  */
  function applyStage(p) {
    stageP = p;
    const W = window.innerWidth, H = window.innerHeight, a = W / H;
    if (word1 && word2) {
      /* FIX J7: the last line holds (and only lifts 30%) until p = 0.35, then leaves; the
         plate starts growing at p = 0.05, so the two overlap and no frame is bare paper */
      const q1 = seg(p, 0, 0.40), h2 = seg(p, 0, 0.35), q2 = seg(p, 0.35, 0.60);
      word1.style.transform = "translate(" + (-6 * q1).toFixed(2) + "%," + (-118 * q1).toFixed(2) + "%)";
      word2.style.transform = "translate(" + (6 * q2).toFixed(2) + "%," + (-30 * h2 - 88 * q2).toFixed(2) + "%)";
    }
    if (ornWrap) ornWrap.style.opacity = (1 - seg(p, 0, 0.15)).toFixed(3);
    /* the right column is where the window grows, so its caption and CTA are gone
       before the blade starts opening at p = 0.10: no frame has text over the plate */
    for (const el of fades) {
      const f = seg(p, 0, el.dataset.fadeEnd === "early" ? 0.09 : 0.30);
      el.style.opacity = (1 - f).toFixed(3);
      el.style.transform = "translateY(" + (-24 * f).toFixed(2) + "px)";
      /* FIX A6: invisible means no focus stop, but the text (the page's only h1) stays in the
         accessibility tree: only the controls leave the tab order */
      const gone = f > 0.98;
      if (gone !== !!el._gone) {
        el._gone = gone;
        el.querySelectorAll("a, button").forEach((c) => (gone ? c.setAttribute("tabindex", "-1") : c.removeAttribute("tabindex")));
      }
    }
    if (!gl() || !float) return;
    const c = gl().clip, P = gl().params;
    const open = seg(p, 0.05, 0.50), sweep = seg(p, 0.08, 0.62), gm = seg(p, 0.08, 0.80);
    c.on = true;
    c.t = lerp(slot.top, 0, open);
    c.b = lerp(H - (slot.top + slot.height), 0, open);
    c.r = lerp(W - (slot.left + slot.width), 0, open);
    c.l = lerp(slot.left, 0, sweep);
    const s = simOf(slot);
    P.glyphX = lerp(s.x, a / 2, gm);
    P.glyphY = lerp(s.y, 0.5, gm);
    P.glyphScale = lerp(0.46, 0.95, gm);
    P.drift = lerp(0.105, 0.168, gm);
  }

  function buildStage(ctx) {
    const gsap = G, proxy = { p: 0 };
    stageOn = true; float = true;
    stage.setAttribute("data-on", "");
    D.style.setProperty("--hero-cover", "100svh");
    measureSlot();
    mountHero();
    if (!introRunning) applyStage(0);
    gsap.to(proxy, {
      p: 1, ease: "none",
      scrollTrigger: {
        trigger: stage, start: "top top", end: () => "+=" + window.innerHeight,
        scrub: 0.5, invalidateOnRefresh: true,
        onRefresh: () => { measureSlot(); if (!introRunning) applyStage(proxy.p); },
      },
      onUpdate: () => { if (!introRunning) applyStage(proxy.p); },
    });
    /* the plate sleeps once the rising sheet has covered it */
    ST.create({
      trigger: stage, start: "top top", end: () => "+=" + window.innerHeight * 2,
      onLeave: () => gl() && gl().sleep(true),
      onEnterBack: () => { if (gl()) gl().wake(); },   // the float canvas kept its trail: no re-warm
    });
    return () => {
      stage.removeAttribute("data-on");
      D.style.removeProperty("--hero-cover");
      stageOn = false; float = false;
      for (const el of fades) {
        el._gone = false; el.style.opacity = ""; el.style.transform = "";
        el.querySelectorAll("a, button").forEach((c) => c.removeAttribute("tabindex"));
      }
      if (word1) word1.style.transform = ""; if (word2) word2.style.transform = "";
      if (ornWrap) ornWrap.style.opacity = "";
      if (gl()) { gl().clip.on = false; mountHero(); }
    };
  }

  /* ================================================================== S1  */
  function slitOpen() {
    // the docked plate (mobile, reduced motion) opens in place from a slit
    if (!frame) return;
    frame.classList.remove("hr-curtain");
    frame.style.animation = "none";
    G.fromTo(frame, { clipPath: "inset(50% 0 50% 0)" }, { clipPath: "inset(0% 0 0% 0)", duration: 0.9, ease: "expo.out", clearProps: "clipPath" });
  }
  function slotSlit() {
    // repeat visit on the stage: the window opens in its slot from a horizontal slit
    if (!gl() || !float) return;
    measureSlot();
    const c = gl().clip, midY = slot.top + slot.height / 2;
    c.on = true;
    c.t = midY; c.b = window.innerHeight - midY; c.l = slot.left; c.r = window.innerWidth - (slot.left + slot.width);
    G.to(c, { t: slot.top, b: window.innerHeight - (slot.top + slot.height), duration: 0.9, ease: "expo.out" });
  }

  function handoff() {
    D.classList.add("hr-pre-out");
    D.removeAttribute("data-preloader");
    D.classList.remove("rv-pre-run");
    // the name rises exactly once, now: rewrite --hd so the seeded CSS film starts here
    D.style.setProperty("--hd", ((performance.now() - T0) / 1000).toFixed(3) + "s");
    if (gl()) gl().setZ("var(--z-gl)");
    FX.emit("fx:intro:handoff", {});
    setTimeout(() => D.classList.remove("hr-pre-out"), 2000);
  }

  function intro() {
    if (!pre || !G) { D.removeAttribute("data-preloader"); D.classList.remove("rv-pre-run"); FX.ready("intro"); return; }
    introRunning = true;
    try { sessionStorage.setItem("rv-intro-seen", "1"); } catch (e) {}
    return (async () => {
      await new Promise((res) => {
        if (!counterOn || counterDone()) { stopCounter(); G.delayedCall(0.08, res); }
        else doneRes = res;
      });

      const tl = G.timeline({ defaults: { overwrite: "auto" } });
      const skip = () => tl.timeScale(3);
      pre.addEventListener("pointerdown", skip, { once: true });
      const key = (e) => { if (e.key === " " || e.key === "Enter" || e.key === "Escape") skip(); };
      window.addEventListener("keydown", key);

      for (const el of digIn) el.style.animation = "none";
      tl.to(digIn, { yPercent: -112, duration: 0.5, ease: "domus.inOut", stagger: 0.04 }, 0);
      tl.to(preRuleI, { scaleX: 0, transformOrigin: "right center", duration: 0.45, ease: "domus.inOut" }, 0);
      tl.to(preMeta, { opacity: 0, duration: 0.3, ease: "none" }, 0);

      if (float && gl()) {
        measureSlot();
        const s = simOf(slot);
        tl.to(gl().clip, {
          t: slot.top, l: slot.left,
          r: window.innerWidth - (slot.left + slot.width),
          b: window.innerHeight - (slot.top + slot.height),
          duration: 1.1, ease: "expo.inOut",
        }, 0);
        tl.to(gl().params, { glyphX: s.x, glyphY: s.y, glyphScale: 0.46, duration: 1.1, ease: "expo.inOut" }, 0);
      }
      tl.to(preSheet, { clipPath: "inset(0 0 100% 0)", duration: 1.0, ease: "domus.inOut" }, 0.15);
      tl.add(handoff, 0.45);
      if (!float) tl.add(slitOpen, 0.75);
      tl.add(() => {
        window.removeEventListener("keydown", key);
        pre.remove();
        introRunning = false;
        if (stageOn) applyStage(0);
        FX.ready("intro");
      }, float ? 1.25 : 0.95);
      await tl.then();
    })();
  }

  /* ============================================================= module  */
  FX.register("hero", {
    init(ctx) {
      G = ctx.gsap; ST = ctx.ScrollTrigger; mm = ctx.mm; entry = ctx.entry;
      FX.hero = { intro, get stageOn() { return stageOn; }, get progress() { return stageP; } };
      if (ctx.page !== "home") return;             // the case page only has the closing band (see build)

      stage = $(".hr-stage"); screen = $(".hr-screen");
      slotEl = $('[data-gl-slot="hero"]');
      heroHost = $('[data-gl-host="hero"]');
      frame = $(".hr-frame");
      word1 = $(".lk-line.l1 .lk-word"); word2 = $(".lk-line.l2 .lk-word");
      ornWrap = $(".hr-orn");
      fades = $$(".hr-fade");
      instr = $("[data-gl-instr]");

      pre = $("[data-pre]");
      preSheet = $("[data-pre-sheet]"); preFoot = $(".hr-pre_foot");
      digIn = $$(".hr-dig_in", pre || document); digSt = $$(".hr-dig_st", pre || document);
      preRuleI = $("[data-pre-rule]"); preMeta = $(".hr-pre_meta"); preWhat = $("[data-pre-what]");

      tasks.dom = true;
      FX.fonts(1500).then(() => { tasks.fonts = true; });
      if (entry === "intro" && pre) {
        introRunning = true;           // the stage must not clobber the preloader window
        counterOn = true; counterLast = performance.now();
        paintCounter(0);
        G.ticker.add(counterTick);
        float = FX.flags.desktop && FX.flags.motion && FX.flags.gl;
        if (float && gl()) {
          heroHost.classList.add("hr-float");
          gl().mount(heroHost, { mode: "float", ground: "deep" });
          gl().setObstacle({ type: "glyph", char: "A" });
          gl().setZ("var(--z-pre-gl)");
          const r = openRect(), s = simOf(r);
          gl().params.glyphX = s.x; gl().params.glyphY = s.y; gl().params.glyphScale = 0.46;
          const c = gl().clip, cy = r.top + r.height / 2, cx = r.left + r.width / 2;
          c.on = true; c.t = cy; c.b = window.innerHeight - cy; c.l = cx; c.r = window.innerWidth - cx;
          gl().warm(PLATE_STEPS);
          gl().wake();
          /* FIX MQ-01: the slit opens only once the engine has presented its first frame, so the
             900 ms expo.out is seen, not spent behind a busy main thread */
          let opened = false;
          const openWin = () => {
            if (opened || !introRunning) return;
            opened = true;
            requestAnimationFrame(() => G.to(c, { t: r.top, b: window.innerHeight - (r.top + r.height), l: r.left, r: window.innerWidth - (r.left + r.width), duration: 0.9, ease: "expo.out" }));
          };
          const offRun = FX.on("fx:gl:state", (s) => { if (s.state === "run") { offRun(); openWin(); } });
          setTimeout(openWin, 1600);   // guarded: a slow driver still gets its window
        }
      }

      if (instr) {
        const nb = (s) => s.replace(/ /g, " ");   // a token never breaks across two lines
        FX.on("fx:gl:stats", (s) => {
          const bits = [nb(s.n.toLocaleString("en-US") + " particles"), "WebGL2"];
          if (typeof s.gpuMs === "number") bits.push(nb(s.gpuMs.toFixed(1) + " ms GPU"));
          bits.push(nb("DPR " + s.dpr));
          instr.textContent = bits.join(" · ");
        });
      }
      /* a lost context or a shader error brings the poster straight back */
      FX.on("fx:gl:state", (s) => {
        if (s.state !== "off") return;
        if (instr) instr.textContent = "";
        setFloatSkin(false);
      });
    },

    build(ctx) {
      bandHost = $('[data-gl-host="band"]');
      if (ctx.page !== "home" || !stage) {
        /* every page closes on the same live paper: the band is the only host here */
        if (bandHost && gl()) {
          observeHosts();
          if (FX.lenis) FX.lenis.on("scroll", (e) => { if (gl()) gl().scrollVelocity(e.velocity || 0); });
        }
        return;
      }
      /* S3 runs only on a wide viewport, with motion, with WebGL2 and with JS.
         Everywhere else the hero is a plain static section and the plate is docked. */
      mm.add("(min-width: 1024px)", () => {
        if (!FX.flags.motion || !FX.flags.gl || !gl()) return;
        return buildStage(ctx);
      });
      if (!stageOn) {
        float = false;
        mountHero();
        if (entry !== "intro" && FX.flags.motion && frame) frame.classList.add("hr-curtain");
      }
      observeHosts();
      if (entry !== "intro" && stageOn && FX.flags.motion) FX.once("fx:ready", () => slotSlit());
      if (FX.lenis) FX.lenis.on("scroll", (e) => { if (gl()) gl().scrollVelocity(e.velocity || 0); });
    },

    onVariant() {
      /* fx-gl's own onVariant has already recoloured and rebuilt the glyph (it runs first) */
      if (stageOn) { measureSlot(); applyStage(stageP); }
      /* the sentence is re-split by fx-scroll after this hook: read its boxes again once it is set */
      if (wanted === "band") requestAnimationFrame(() => { if (wanted === "band") mountBand(); });
    },
    onResize() {
      if (stageOn) { measureSlot(); if (!introRunning) applyStage(stageP); }
      if (wanted === "band") mountBand();
    },
  });
})();
