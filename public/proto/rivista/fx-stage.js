/* fx-stage.js — the page host of the stage: it runs the stage from scenes (spec
   docs/redesign/rivista-story/50-from-zero-spec.md §3, §5)
   ------------------------------------------------------------------------------------------------------------------
   One fixed, full-viewport canvas above the page (z-index var(--z-stage), pointer-events none, aria-hidden), drawn by
   stage/stage.js on its own GPUDevice (stage/gpu.js, stage/tier.js). Everything it reads is an attribute of the page:

   - Scenes. For every [data-stage="NAME"] it imports stage/scenes/NAME.js (a missing or failing module is skipped, the
     others keep working). A case page's main (main[data-case]) is the "mist" scene (the swarm as mist only) around its opener's "case" scene. Every
     frame each scene gets its view (the sticky [data-stage-anchor] inside it), the figure's half of that view, its
     step / local / progress, its cue, the pointer, the scroll velocity, the tier, its share of the viewport, its marks
     ([data-stage-mark="ID"]), its images (<img data-slab="ID">, registered as slab textures once decoded), its text
     blocks; it answers with its swarm formations and weights, its slabs and its camera. The host blends the scenes by
     how much of the viewport each holds and sends one stage.set per frame. The scene API: stage/scenes/README.md.
   - Ground. html[data-ground="night"|"dawn"] (the build writes it). On a night page the viewport is night but for the
     [data-dawn] rectangles (up to two): inside them a point is ink. On a dawn page (Contact) the whole viewport is day.
   - Cue. [data-stage-cue="ID"]: hovered, focused, or (on touch) the one nearest the middle of the screen.
   - Refraction. While a slab is on screen, the [data-refract] display type near the viewport is rasterised for the
     stage (stage/scenes/lib/raster.js), outside the tick, again when the set changes, on resize and after the fonts.
   - Camera: the scenes' cameras blended by weight; the stage damps it and adds a few degrees from the pointer. A scene
     that returns a free camera (camera.pos: position, target, roll, lens, focus, aperture, fog, orbit; stage.js header)
     turns the blend free: the other scenes' orbiting cameras are converted to the same kind (stage.js orbitPose) and
     every pose is mixed by weight, unsmoothed by the host (a scripted move stays exact).
   - Rest and glow: the scenes' `rest` (s of motion after the last input, default 5) and `bloom` (light that glows).
   - The cut: fx:nav:start pushes the camera in (stage.cut) until fx:nav:covered pauses the stage; fx:nav:reset undoes it.
     (lane PORTAL) and flies the eye into a portal of glass (stage.portal, scenes/lib/portal.js) from the clicked link's
     side (fx:nav:start detail.side): html.cut-portal while it does (css/cuts.css holds the sheet back), html.cut-full
     once the glass fills the frame (the sheet floods in, in the same tone). Arriving after a portal (window.__rvArrive
     .portal) the stage opens pushed in and inside the glass, and on fx:nav:uncovered the eye comes out (the push back,
     the portal 1 -> 0 in PORTAL_IN_MS) as soon as the glass can draw (at most PORTAL_WAIT_MS later).
   - Rects are measured on build, resize, ScrollTrigger refresh and body resize, in document space with every sticky box
     flattened; the tick resolves the sticky boxes from the scroll alone. No layout read in the tick. (wave 9, J3
     VIEWPORT) A resize measures only when the layout moved (the width, clientHeight, the canvas's box, the pixel ratio:
     layoutMoved), never for an iPhone's bar alone; the canvas is max(100%, 100lvh) tall and the stage maps the scenes'
     frame (clientWidth x clientHeight) into its box (stage.resize's boxH).
   - Scroll, wheel, pointer, touch and key open the stage's 5 s window (stage.input()).
   - html.stage-on while the stage draws; [data-stage-instr] gets "{n} points · {ms} ms GPU" through FX.t / FX.num.
   - Early start (BOOT): the head script asks for the adapter and imports stage/boot.js, which makes the device and
     starts every pipeline while the page loads; the host takes that answer (window.__rvStage) when the page is ready
     and still. The swarm draws as soon as its pipelines are in; the plates join when theirs are (ctx.glass, and a
     short focus pull for scenes without glassEntry: stage/scenes/README.md "The glass signal").
   - Off under reduced motion, html.gl-off, html[data-nogl] (the 404), ?gl=0 / ?stage=0, without WebGPU or with a
     software adapter. Every GPU call runs inside error scopes: an error or a throw turns the stage off silently and
     leaves the printed page. A lost device builds the stage once more; a second loss leaves the printed page.

   ?stage=0 off · ?debug=1 window.__stageHost { info(), stage, measure(), last } and console lines prefixed [stage]
   ------------------------------------------------------------------------------------------------------------------ */
(function () {
  "use strict";
  const FX = /** @type {any} */ (window).FX;
  if (!FX || typeof FX.register !== "function") return;
  const D = document.documentElement;
  const SCRIPT = /** @type {HTMLScriptElement | null} */ (document.currentScript);
  const BASE = new URL("stage/", SCRIPT && SCRIPT.src ? SCRIPT.src : location.href).href;
  const Q = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(); } })();
  const DEBUG = Q.get("debug") === "1";
  const log = (/** @type {string} */ m) => { if (DEBUG) console.log(m); };

  const MAX_SWARM = 4;             // formations per frame (the stage's limit)
  const MAX_SLABS = 12;            // slabs per frame (the pinned contract)
  const MAX_KEEP = 16, MAX_DAWN = 2, MAX_TEXTS = 24;
  const ROWS = 40;                 // viewport rows sampled for the scenes' visible shares
  const SMOOTH_S = 0.22;           // time constant of the formations' weights (s): nothing snaps
  const SCENE_S = 0.16;            // time constant of the scenes' blend weights (s)
  const CAM_S = 0.2;               // time constant of the camera's blend across scenes (s; the stage damps it again)
  const PTR_FOLLOW = 0.035;        // the pointer's few degrees (rad at the viewport's edge; the stage applies them)
  const INSTR_S = 0.5;             // instrument line refresh (s)
  const NAME = /^[a-z0-9-]+$/;

  const clamp = (/** @type {number} */ x, /** @type {number} */ a, /** @type {number} */ b) => (x < a ? a : x > b ? b : x);
  const sstep = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  /** damp toward a target with time constant tau (s) */
  const damp = (/** @type {number} */ cur, /** @type {number} */ target, /** @type {number} */ tau, /** @type {number} */ dt) => (tau <= 0 ? target : cur + (target - cur) * (1 - Math.exp(-dt / tau)));
  const r2 = (/** @type {number} */ v) => Math.round(v * 100) / 100;
  const r4 = (/** @type {number} */ v) => Math.round(v * 1e4) / 1e4;

  const reduced = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
  const touchy = () => { try { return !!(FX.flags && FX.flags.touch) || matchMedia("(hover: none)").matches; } catch (e) { return false; } };
  function allowed() {
    const f = FX.flags || {};
    const motion = typeof f.motion === "boolean" ? f.motion : !reduced();
    return motion && f.gl !== false && !D.classList.contains("gl-off") && !D.hasAttribute("data-nogl")
      && Q.get("stage") !== "0" && Q.get("gl") !== "0" && !!(/** @type {any} */ (navigator).gpu)
      && (!!document.querySelector("[data-stage]") || !!document.querySelector("main[data-case]"));
  }
  const ground = () => (D.getAttribute("data-ground") === "dawn" ? "dawn" : "night");

  /* ================================================================ state */
  /** @type {any} */ let G = null, ST = null;
  /** @type {any} */ let stage = null, mod = null, raster = null;
  /** @type {GPUDevice | null} */ let device = null;
  /** @type {HTMLCanvasElement | null} */ let canvas = null;
  let dead = false, building = false, paused = false, ticking = false, on = false, gen = 0, rafId = 0;
  /**
   * a loaded scene: its module, the global ids of its formations, its scratch state, its blend weight
   * @typedef {{ name: string, el: Element, def: any, ids: Record<string, string>, state: any, w: number, broken: boolean,
   *   texAsked: boolean, texChk?: number, k: number, ready?: boolean, lazy?: boolean }} Scene
   */
  /** @type {Scene[]} */ let scenes = [];
  /** @type {Record<string, number>} */ const W = {};           // smoothed formation weights by global id
  /** @type {Record<string, any>} */ const lastRect = {};       // a formation fading out keeps its last place
  /** @type {Set<string>} */ const registered = new Set();      // global formation ids the stage holds
  /** @type {Set<string>} */ const texReady = new Set();        // slab textures the stage holds
  /** @type {Set<string>} */ const texPending = new Set();
  /* (wave 8, SMOOTH) WHAT A TEXTURE WAS MADE FROM, to make it again. The plates hold 16 layers and hand the least
     recently drawn one to a new texture: in the home the stack's etched names took the gallery's captures, and back in
     the gallery every plate was empty glass (texReady still named them). held() asks the stage; a texture it no longer
     holds is made again from its source (each at most once in 1.5 s, so two scenes that together need more than 16
     never trade layers every frame), and the textures of a scene near the screen are looked at a few times a second,
     so they are back before their plates are seen */
  /** @type {Map<string, { el?: HTMLImageElement, src?: any, etch?: any[] }>} */ const TEXFROM = new Map();
  /** @type {Map<string, number>} */ const revivedAt = new Map();
  // only a scene on screen makes its textures again (a scene below the one read, near enough to be framed, took its
  // layers back one by one: the home's stack evicted the gallery's captures again as fast as they came)
  let reviveOK = true;
  let lastT = 0, lastY = 0, sv = 0, instrT = 0, instrText = "", time = 0;
  /* (wave 1, KIT) the reader's speed, 0..1 (ctx.speed): |scroll velocity| over SPEED_PX, rising in 0.12 s and falling
     in 0.7 s (a train of wheel steps is one long push, no pumping); exactly 0 at rest */
  const SPEED_PX = 2600, SPEED_UP = 0.12, SPEED_DOWN = 0.7;
  let spd = 0;
  /* (wave 1, KIT) the hand on a touch screen: a horizontal drag is the orbit's input (stage.set aim), -1..1 across
     half the viewport's width; released, it goes back to 0 and the stage damps the orbit with the scene's own weight.
     The vertical scroll and pinch zoom stay the browser's (touch-action pan-y pinch-zoom on the body while it draws). */
  const drag = { id: -1, x0: 0, y0: 0, on: false, nx: 0 };
  const ptr = { x: -1e4, y: -1e4, down: false, present: false };
  const cueEl = { /** @type {Element | null} */ hover: null, /** @type {Element | null} */ focus: null };
  const cam = { yaw: 0, pitch: 0, dolly: 0, follow: 0 };
  /** @type {HTMLElement[]} */ let instrEls = [];
  /* (wave 2, ARRIVE) the arrival: a page reached by a cut (the head script wrote data-arrive before this ran) builds its
     stage at once and draws its first frames UNDER the arriving sheet, its room already lit (ctx.arrival); sheetUp: a
     sheet covers the page now (arriving until fx:nav:uncovered, leaving from fx:nav:start) */
  const ARRIVED = D.hasAttribute("data-arrive");
  /* the same as promises, for a module that waits with a cap (the arriving sheet may hold for the room):
     FX.stage = { expected, frame, lit, frameAt, litAt }; expected false (no stage on this page) = both resolved now */
  const SIG = { res: { frame: () => {}, lit: () => {} }, frameAt: 0, litAt: 0, expected: true,
    /** @type {Promise<void> | null} */ frame: null, /** @type {Promise<void> | null} */ lit: null };
  SIG.frame = new Promise((r) => { SIG.res.frame = r; });
  SIG.lit = new Promise((r) => { SIG.res.lit = r; });
  /* (lane n-flight) an arrival by a flight: settle once the eye is nearly still (the title may rise), stood once the room
     stands (fx:nav:arrived); fx-nav.js waits for them with a cap */
  /** @type {any} */ const SIGX = SIG;
  SIGX.settle = new Promise((r) => { SIGX.res.settle = r; });
  SIGX.stood = new Promise((r) => { SIGX.res.stood = r; });
  if (!FX.stage) FX.stage = SIG;
  /* (lane n-flight) an arrival by a flight has no sheet over it: the scenes stand and are lit from its first frame */
  let sheetUp = ARRIVED && !(/** @type {any} */ (window).__rvArrive && /** @type {any} */ (window).__rvArrive.fly), litSent = false;
  /* (lane n-flight) how much of the view is the morning now (0..1): a page seen in the morning leaves by the plain cut */
  let viewDawn = 0;
  /* (lane PORTAL) the flight through the portal: out on a click, in on an arrival (stage/scenes/lib/portal.js) */
  const PORTAL_OUT_MS = 300, PORTAL_IN_MS = 350, PORTAL_WAIT_MS = 0;   // WAIT 0: the room never waits for the glass
  const ARR = /** @type {any} */ (window).__rvArrive || null;
  const ARR_PORTAL = ARRIVED && !!(ARR && ARR.portal);
  let portalOut = false, portalFull = false;
  /* (lane n-flight) THE FLIGHT under the router (stage.fly): the eye dollies through the room to a door of glass, the
     page changes there, the eye goes on into the new room. flyMs: the leaving and the arriving halves (fx-nav.js plans
     the same numbers for fx:nav:start's ms). flyOut: this page is leaving by a flight; flyFull: the door is reached */
  const flyMs = () => (innerWidth < 768 ? { out: 430, in: 400 } : { out: 520, in: 520 });
  let flyOut = false, flyFull = false, flyDawn = false, flyHeavy = false, priming = false;
  const FLY_LEAD = 0.2;   // (no longer read: the page changes as soon as the old page's text has left, fx-nav.js)
  /* (lane m-fly) THE TAKEOVER. Under the router the page now changes long before the door (as soon as the old text has
     left): this page's host comes up while the room left behind is still on the stage, drawn by the router's bridge.
     SHADOW: the stage is kept but not yet this page's. The scenes are loaded, their formations prepared
     (stage.prepare), their first frame run undrawn (the etched words and the display type rastered), the first screen's
     captures decoded and uploaded; whatever would change the room still on stage is held (HELD) until the takeover.
     The room takes the stage in ONE task as soon as the door of glass hides the whole frame (stage.flyState.cover): it
     is seen through the glass from the door's first full frame to its last, and the eye never waits in the glass for a
     page that is ready. A page that is late: the eye goes on into the glass (stage.js holds the last picture behind it)
     at most HOLD_MS for the first screen's captures, as long as it takes for the page itself. */
  /** @type {any} */ let shadow = null;
  const HELD = { /** @type {any} */ bd: null, /** @type {(() => void)[]} */ tex: [] };
  const HOLD_MS = 160;
  /* an arrival at Contact from a night view: the morning comes as a straight edge of day that crosses the frame from
     the bottom (DAY_MS from the takeover), seen through the door's glass; never a blank sheet of paper */
  const DAY_MS = 200;
  let dayAt = 0;
  /* (k-fix3d) the day's edge has begun to rise: the title may rise (settle) with the morning, not after it (from 650 to
     800 ms the frame was Contact's paper with only its faint strokes: an empty sheet). Its letters take about 0.1 s to
     show above their masks, which is when the edge reaches them; the door's glass is clear over the paper
     (plates.wgsl.js), so they are seen as they come */
  let dayRose = false;
  /** the ground the page before stood on, kept under the canvas since the page changed (rv-router.js): it goes when the
   *  door hides the frame and this page's room takes the stage */
  const dropGround = () => { try { document.querySelectorAll(".cut-ground").forEach((e) => e.remove()); } catch (e) { /* ignore */ } };
  const ARR_FLY = ARRIVED && !!(ARR && ARR.fly);
  /* (lane o-router) the Astro build's router (web/src/router/rv-router.js): the page changes under a stage that stays.
     KEEP: what the page before handed over (window.__rvKeep: stage, device, canvas, the modules, tier), taken once */
  const SOFT = !!(/** @type {any} */ (window).__rvRouter);
  /** @type {any} */ let KEEP = SOFT ? /** @type {any} */ (window).__rvKeep || null : null;
  if (KEEP) /** @type {any} */ (window).__rvKeep = null;
  /* (lane n-flight) what the kept stage holds: texture id -> the image's address. A page reached again (Back to the
     gallery) finds its captures in the glass: none is decoded and uploaded a second time during the fly-in */
  /** @type {Map<string, string>} */ const TEXSRC = (KEEP && KEEP.texSrc instanceof Map) ? KEEP.texSrc : new Map();
  /* (lane n-fix-flight) one upload a task: six captures decoded together (Work on a first visit) were uploaded in one
     task of 0.14 s with the eye at the door (n-critic 13); each now takes the stage in a task of its own */
  /** @type {Promise<any>} */ let upQ = Promise.resolve();
  /** @type {{ x: number, y: number } | null} */ let subject = null;   // the leading scene's subject (viewport px): the cut pushes toward it

  /* ================================================================ measuring (document space, stickies flattened) */
  /** @typedef {{ x: number, y: number, w: number, h: number }} Rect */
  /** @typedef {{ top: number, h: number, T: number, cbB: number, mb: number, B?: number, cbT?: number, mt?: number, vh?: number }} Stick
   *  (k-fix3d) B: a box held by its bottom (top: auto, bottom: B), cbT its containing block's top, vh the scrollport */
  /** @typedef {{ el: Element, nat: Rect, chain: Stick[] }} Rec */
  /** @type {any} */ let M = null;   // the last measure
  /* (wave 9, J3 VIEWPORT) the layout viewport's height now (innerHeight, MDN: "taken from the height of the window's
     layout viewport"), kept from the resize events without a measure: on an iPhone it follows Safari's bar, and so does
     the foot of the scrollport a box held by its bottom stands on (a case opener's caption, at()) */
  let vpH = 0;
  /** @typedef {{ kx: number, ky: number, tx: number, ty: number, ox: number, oy: number }} Aff  an axis-aligned
   *  transform x' = ox + kx (x - ox) + tx (and y), viewport px */
  /** a rect with one transform undone @param {Aff} a @param {{ x: number, y: number, w: number, h: number }} r */
  function unAff(a, r) {
    const x = a.ox + (r.x - a.tx - a.ox) / a.kx, y = a.oy + (r.y - a.ty - a.oy) / a.ky;
    return { x, y, w: r.w / a.kx, h: r.h / a.ky };
  }

  /** the sticky boxes between el and the root, outermost first @param {Element} el @param {Map<Element, boolean>} cache */
  function stickyChain(el, cache) {
    const out = [];
    for (let n = /** @type {Element | null} */ (el); n && n !== document.body && n !== D; n = n.parentElement) {
      let s = cache.get(n);
      if (s === undefined) { s = getComputedStyle(n).position === "sticky"; cache.set(n, s); }
      if (s) out.unshift(n);
    }
    return out;
  }

  /** the scene sections of the page, in page order (a case page's main is one "mist" scene) */
  function sceneEls() {
    /** @type {{ name: string, el: Element }[]} */ const out = [];
    for (const el of document.querySelectorAll("[data-stage]")) {
      const name = (el.getAttribute("data-stage") || "").trim();
      if (NAME.test(name)) out.push({ name, el });
    }
    // a case page's main is the swarm as mist (its close keeps the dawn); its opener is a scene of its own ("case"),
    // later in DOM order, so the rows it covers are the opener's and the chapters' rows stay the mist's
    const m = document.querySelector("main[data-case]");
    if (m && !out.some((s) => s.el === m)) out.unshift({ name: "mist", el: m });
    return out;
  }

  const TEXT_SEL = "h1, h2, h3, h4, p, a, button, address, dt, dd, li, figcaption, blockquote, small, cite";

  function measure() {
    if (dead) return;
    const t0 = performance.now();
    const cache = new Map();
    const qa = (/** @type {ParentNode} */ root, /** @type {string} */ s) => /** @type {Element[]} */ (Array.from(root.querySelectorAll(s)));
    const inScene = (/** @type {Element} */ el, /** @type {Element} */ sec) => el.closest("[data-stage]") === sec || (sec.tagName === "MAIN" && !el.closest("[data-stage]"));
    const sc = scenes.map((S) => {
      const sec = S.el;
      const anchors = qa(sec, "[data-stage-anchor]");
      const view = anchors.find((a) => a.getAttribute("data-stage-anchor") === S.name) || anchors[0]
        || document.querySelector(`[data-stage-anchor="${S.name}"]`) || null;
      const steps = qa(sec, "[data-stage-step]").filter((e) => inScene(e, sec));
      const cues = qa(sec, "[data-stage-cue]").filter((e) => inScene(e, sec));
      const marks = qa(sec, "[data-stage-mark]").filter((e) => inScene(e, sec));
      const imgs = /** @type {HTMLImageElement[]} */ (qa(sec, "img[data-slab]").filter((e) => inScene(e, sec)));
      // the section's pictures (img, video, canvas outside the view): a scene may keep its ink off them
      const media = qa(sec, "img, video, picture, canvas").filter((e) => inScene(e, sec) && !(view && view.contains(e)) && !(e.tagName === "IMG" && e.parentElement && e.parentElement.tagName === "PICTURE")).slice(0, 8);
      // the text blocks (keep-outs a scene may use): text-bearing elements outside the view, the outermost of each
      // nest, with text, at most MAX_TEXTS
      // (wave 8, ORRERY) text the eye does not see is not a text block: a list kept for assistive technology in a
      // clip of 1 px ([data-stage-unseen] on the clip: Now's nine names on a desktop, css/page-cover.css) asks for no
      // keep-out while the clip is shut (its children's own boxes are whole, wherever the clip stands)
      const unseen = (/** @type {Element} */ e) => { const u = /** @type {HTMLElement | null} */ (e.closest("[data-stage-unseen]")); return !!u && u.offsetWidth <= 1 && u.offsetHeight <= 1; };
      // (wave 9, J2a CAPTION) a scene in the caption grammar now (css/scene.css "the caption at the foot"; the one rule,
      // fx-scroll.js FX.scroll.caption): each step's .sc-in is a caption held at the view's foot
      const cap = !!(FX.scroll && typeof FX.scroll.caption === "function" && FX.scroll.caption(sec));
      let tx = qa(sec, TEXT_SEL).filter((e) => inScene(e, sec) && !(view && view.contains(e)) && (e.textContent || "").trim() && !unseen(e));
      // (wave 9, J2a CAPTION) there each step's caption is ONE text block (the sticky .sc-in itself, so its rect is read
      // where it is held): a step that is a text element itself (the gallery's li) would be read in its flow place, a
      // screen away from its words
      if (cap) {
        const capEls = steps.map((st) => st.querySelector(":scope > .sc-in")).filter((e) => e && (e.textContent || "").trim());
        tx = [...capEls, ...tx.filter((e) => !steps.some((st) => st === e || st.contains(e)))];
      }
      const texts = tx.filter((e) => !tx.some((o) => o !== e && o.contains(e))).slice(0, MAX_TEXTS);
      // the text column: the steps' columns (their first child: a step block may span the whole width), else the
      // text blocks
      const col = steps.length ? steps.map((e) => e.firstElementChild || e) : texts;
      // (wave 1, KIT) the scene's display titles the glass may bend ([data-refract]: inside the view or not), for
      // ctx.textRects({ display: true })
      const disp = qa(sec, "[data-refract]").filter((e) => inScene(e, sec)).slice(0, 8);
      return { S, sec, view, steps, cues, marks, imgs, media, texts, col, disp, cap };
    });
    const dawnEls = qa(document, "[data-dawn]").slice(0, MAX_DAWN);
    const keepEls = qa(document, "[data-stage-keepout], .btn");
    // (wave 9, J2a CAPTION) the type inside a caption is never bent by glass (the figure's band stands above the captions)
    // and a held caption is not where its document place says: it is not rastered for the glass
    const inCaption = (/** @type {Element} */ e) => sc.some((s) => s.cap && s.steps.some((st) => st.contains(e)));
    const refract = qa(document, "[data-refract]").filter((e) => !inCaption(e));
    const all = new Set([...dawnEls, ...keepEls, ...refract]);
    for (const s of sc) {
      all.add(s.sec); if (s.view) all.add(s.view);
      for (const l of [s.steps, s.cues, s.marks, s.imgs, s.media, s.texts, s.disp]) for (const e of l) all.add(e);
    }
    // the sticky boxes, flattened while the natural rects are read (in flow either way: nothing else moves)
    const sticky = new Set();
    /** @type {Map<Element, Element[]>} */ const chains = new Map();
    for (const el of all) { const c = stickyChain(el, cache); chains.set(el, c); c.forEach((s) => sticky.add(s)); }
    /* (k-fix3d) a box held by its BOTTOM (top: auto, bottom: B: a case opener's caption at the foot of the view) was read
       as held at the top with T 0: its text was kept at its natural place, a screen below where it stood, and the
       cosmos's filaments crossed the caption at rest. B, with its containing block's top (it rises no further) */
    /** @type {Map<Element, { T: number, mb: number, B: number, mt: number }>} */ const stickProps = new Map();
    for (const s of sticky) {
      const cs = getComputedStyle(s), T = parseFloat(cs.top), Bt = parseFloat(cs.bottom), byB = !Number.isFinite(T) && Number.isFinite(Bt);
      stickProps.set(s, { T: Number.isFinite(T) ? T : 0, mb: parseFloat(cs.marginBottom) || 0, B: byB ? Bt : NaN, mt: parseFloat(cs.marginTop) || 0 });
    }
    /** @type {any[]} */ const saved = [];
    for (const s of sticky) { const h = /** @type {HTMLElement} */ (s); saved.push([h, h.style.getPropertyValue("position"), h.style.getPropertyPriority("position")]); h.style.setProperty("position", "static", "important"); }
    const sy = window.scrollY, sx = window.scrollX;
    /** @type {Map<Element, Rect>} */ const nat = new Map();
    const rectOf = (/** @type {Element} */ el) => {
      let r = nat.get(el);
      if (!r) {
        const b = el.getBoundingClientRect(), a = affOf(el, [], el);
        const v = a ? unAff(a, { x: b.left, y: b.top, w: b.width, h: b.height }) : { x: b.left, y: b.top, w: b.width, h: b.height };
        r = { x: v.x + sx, y: v.y + sy, w: v.w, h: v.h }; nat.set(el, r);
      }
      return r;
    };
    /* (wave 1, KIT) the FINAL layout box: an entrance (a word under its rise mask, a row on its way in, an Anime.js
       or WAAPI move) is a transform on the block or inside it, and the rect a scene keeps light off is where the text
       will stand, not where it is this frame. Pure reads: each transform from the block down to the glyphs is undone
       (axis-aligned translate and scale, from the computed matrix, the individual translate / scale and the origin);
       transforms above the block are kept, as before (a positioned container). A rotated one is left as it is. */
    /** @type {Map<string, Aff | null>} */ const affs = new Map();
    /** @type {Map<Element, number>} */ const ids = new Map();
    const idOf = (/** @type {Element} */ e) => { let i = ids.get(e); if (i == null) { i = ids.size; ids.set(e, i); } return i; };
    /** an element's own transform as x' = O + k (x - O) + t per axis (viewport px), solved from its box with the
     *  transforms of `outer` (its in-block ancestors, from `top`) already undone @param {Element} e @param {Aff[]} outer @param {Element} top */
    const affOf = (e, outer, top) => {
      const key = idOf(e) + ":" + idOf(top);
      if (affs.has(key)) return affs.get(key) || null;
      /** @type {Aff | null} */ let a = null;
      if (e instanceof HTMLElement) {
        const cs = getComputedStyle(e);
        const tf = cs.transform, tr = cs.translate, scl = cs.scale, rot = cs.rotate;
        if ((tf && tf !== "none") || (tr && tr !== "none") || (scl && scl !== "none")) {
          let ok = !rot || rot === "none" || /^0(deg|rad|turn)?$/.test(rot.trim());
          let m11 = 1, m22 = 1, m41 = 0, m42 = 0;
          if (ok && tf && tf !== "none") {
            try {
              const m = new DOMMatrixReadOnly(tf);
              if (Math.abs(m.m12) > 1e-4 || Math.abs(m.m21) > 1e-4 || m.m11 <= 0.01 || m.m22 <= 0.01) ok = false;
              else { m11 = m.m11; m22 = m.m22; m41 = m.m41; m42 = m.m42; }
            } catch (err) { ok = false; }
          }
          const len = (/** @type {string} */ s, /** @type {number} */ ref) => (s.endsWith("%") ? (parseFloat(s) / 100) * ref : parseFloat(s) || 0);
          let tx = 0, ty = 0, sxk = 1, syk = 1;
          if (ok && tr && tr !== "none") { const p = tr.trim().split(/\s+/); tx = len(p[0] || "0", e.offsetWidth); ty = len(p[1] || "0", e.offsetHeight); }
          if (ok && scl && scl !== "none") { const p = scl.trim().split(/\s+/).map(parseFloat); sxk = p[0] || 1; syk = p[1] ?? sxk; if (sxk <= 0.01 || syk <= 0.01) ok = false; }
          if (ok) {
            const o = (cs.transformOrigin || "0 0").split(/\s+/).map(parseFloat);
            const b = e.getBoundingClientRect();
            let r = { x: b.left, y: b.top, w: b.width, h: b.height };
            for (const q of outer) r = unAff(q, r);
            const kx = sxk * m11, ky = syk * m22, ttx = sxk * m41 + tx, tty = syk * m42 + ty;
            const ox = o[0] || 0, oy = o[1] || 0;
            const x0 = r.x - ox * (1 - kx) - ttx, y0 = r.y - oy * (1 - ky) - tty;
            if (Math.abs(kx - 1) > 1e-4 || Math.abs(ky - 1) > 1e-4 || Math.abs(ttx) > 0.01 || Math.abs(tty) > 0.01)
              a = { kx, ky, tx: ttx, ty: tty, ox: x0 + ox, oy: y0 + oy };
          }
        }
      }
      affs.set(key, a);
      return a;
    };
    /** the transforms between `top` (included) and `leaf` (included), outermost first @param {Element} top @param {Element | null} leaf */
    const affChain = (top, leaf) => {
      /** @type {Element[]} */ const els = [];
      for (let n = leaf; n; n = n.parentElement) { els.unshift(n); if (n === top) break; }
      if (els[0] !== top) return [];
      /** @type {Aff[]} */ const out = [];
      for (const e of els) { const a = affOf(e, out, top); if (a) out.push(a); }
      return out;
    };
    /** a viewport rect with the transforms of `top`'s block undone (outermost first) @param {Element} top @param {Element | null} leaf @param {{ x: number, y: number, w: number, h: number }} r */
    const unblock = (top, leaf, r) => { for (const q of affChain(top, leaf)) r = unAff(q, r); return r; };
    /** the box of an element's own glyphs (a display line's box can be a whole grid cell) @param {Element} el */
    const glyphs = (el) => {
      const rg = document.createRange();
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let t = tw.nextNode(); t; t = tw.nextNode()) {
        if (!(t.nodeValue || "").trim()) continue;
        // (wave 1, WORK) a visually hidden copy for screen readers (a 1 px clipped box, as the motion layer's split
        // lines keep the sentence whole) has unclipped line boxes running across the page: not glyphs anyone sees
        const pe = t.parentElement;
        if (pe && pe !== el) { const pb = pe.getBoundingClientRect(); if (pb.width <= 1 && pb.height <= 1) continue; }
        rg.selectNodeContents(t);
        for (const b of rg.getClientRects()) {
          if (!(b.width > 0)) continue;
          const r = unblock(el, t.parentElement, { x: b.left, y: b.top, w: b.width, h: b.height });
          x0 = Math.min(x0, r.x + sx); x1 = Math.max(x1, r.x + r.w + sx); y0 = Math.min(y0, r.y + sy); y1 = Math.max(y1, r.y + r.h + sy);
        }
      }
      return x1 > x0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : rectOf(el);
    };
    /** @type {Map<Element, number>} */ const cbB = new Map(), cbT = new Map();
    for (const s of sticky) {
      const p = s.parentElement;
      if (!p) continue;
      const pr = rectOf(p), pcs = getComputedStyle(p);
      cbB.set(s, pr.y + pr.h - (parseFloat(pcs.paddingBottom) || 0) - (parseFloat(pcs.borderBottomWidth) || 0));
      cbT.set(s, pr.y + (parseFloat(pcs.paddingTop) || 0) + (parseFloat(pcs.borderTopWidth) || 0));
    }
    const svh = D.clientHeight;
    /** @param {Element | null | undefined} el @param {boolean} [g] @returns {Rec | null} */
    const rec = (el, g) => {
      if (!el) return null;
      const r = g ? glyphs(el) : rectOf(el), chain = (chains.get(el) || []).map((s) => {
        const sr = rectOf(s), sp = stickProps.get(s) || { T: 0, mb: 0, B: NaN, mt: 0 };
        /** @type {Stick} */ const k = { top: sr.y, h: sr.h, T: sp.T, cbB: cbB.get(s) ?? sr.y + sr.h, mb: sp.mb };
        if (Number.isFinite(sp.B)) { k.B = sp.B; k.cbT = cbT.get(s) ?? sr.y; k.mt = sp.mt; k.vh = svh; }
        return k;
      });
      return { el, nat: { ...r }, chain };
    };
    const cw = D.clientWidth, ch = D.clientHeight;
    /* (wave 9, J3 VIEWPORT) THE CANVAS'S BOX. The canvas is max(100%, 100lvh) tall (makeCanvas): on an iPhone the large
       viewport, so neither its box nor the backing changes as Safari's bar shows and hides (the layout viewport,
       innerHeight and the visual viewport follow the bar; the initial containing block, clientHeight, is the small
       viewport and stays). The scenes keep their frame, cw x ch (the views are 100svh tall); the stage maps it into the
       box (stage.resize's boxH), and what the host keeps light off and lays the day on runs down to the box's foot (dh):
       the strip a hidden bar uncovers is drawn and guarded. Where the box is the viewport (a desktop, Chrome, a browser
       without a bar) dh is ch and every value is what it was */
    const cbox = canvas ? canvas.getBoundingClientRect().height : 0;
    const dh = cbox >= ch + 0.5 ? cbox : ch;
    /* (wave 9, J3 VIEWPORT) the header's top safe area (css/chrome.css pads the header by env(safe-area-inset-top)): what
       a notch or a status bar takes over the page, 0 elsewhere; the scenes that stand their figures under the header add
       it (ctx.safeTop) */
    const hdrEl = document.querySelector(".hdr");
    const safeTop = hdrEl ? parseFloat(getComputedStyle(hdrEl).paddingTop) || 0 : 0;
    // the layout viewport's height (vpH, at()), read here while the layout is clean: read after the sticky boxes are put
    // back, innerHeight forced a whole layout inside the measure (+1.2 to 2 ms a measure on a phone's home)
    const ih = window.innerHeight || ch;
    /** (wave 9, J2a CAPTION) the caption step of a caption scene an element stands in, as [scene, step] (else null)
     *  @param {Element} e */
    const capAt = (e) => { for (let i = 0; i < sc.length; i++) { if (!sc[i].cap) continue; const k = sc[i].steps.findIndex((st) => st.contains(e)); if (k >= 0) return [i, k]; } return null; };
    const out = {
      cw, ch, fs: D.classList.contains("fs-on"),
      // (wave 9, J3 VIEWPORT) the drawn height, the pixel ratio and the header's top safe area at this measure
      dh, dpr: window.devicePixelRatio || 1, safeTop,
      scenes: sc.map((s, si) => {
        const r = rec(s.sec), view = rec(s.view) || r;
        const stepIx = (/** @type {Element} */ e) => (s.cap ? s.steps.findIndex((st) => st.contains(e)) : -1);
        // (wave 9, J2a CAPTION) k: the caption step a text stands in (-1: none), so a hidden caption is no text
        const texts = s.texts.map((e) => ({ tag: e.tagName.toLowerCase(), r: rec(e, true), k: stepIx(e) })).filter((t) => t.r && t.r.nat.w > 1 && t.r.nat.h > 1);
        /* (wave 9, J2a CAPTION) a caption scene: how far its tallest caption's words rise over the line its foot is held
           at, and that line (the sticky top, viewport px): the figure's band ends above the tallest caption, the same band
           for every step, so the figure never changes size or place between two steps (figOf). Read from what the
           measure has already read (each caption is a text block: its glyphs' union, and its sticky box's natural top,
           the foot line), so the captions cost no layout read but one style read */
        let capH = 0, capT = 0;
        if (s.cap) {
          for (const t of texts) { const ch0 = t.k >= 0 ? t.r.chain[t.r.chain.length - 1] : null; if (ch0) capH = Math.max(capH, ch0.top - t.r.nat.y); }
          const c0 = s.steps.length ? s.steps[0].querySelector(":scope > .sc-in") : null;
          capT = c0 ? parseFloat(getComputedStyle(c0).top) || 0 : 0;
        }
        // the text column's natural x extent (the view is laid out across the viewport; its text sits in one half)
        let tx0 = 1e9, tx1 = -1e9;
        for (const e of s.col) { const b = rectOf(e); if (b.w > 1 && b.h > 1) { tx0 = Math.min(tx0, b.x); tx1 = Math.max(tx1, b.x + b.w); } }
        const vr = view ? view.nat : { x: 0, y: 0, w: cw, h: ch };
        // the figure's side: named on the section (data-stage-side), else the phone's stacked layout (the text in the
        // lower part of the screen under 1024 px), else opposite the text column the class names (sc-left: the text
        // on the left), else measured
        let side = (s.sec.getAttribute("data-stage-side") || "").trim();
        const cl = s.sec.classList;
        if (!/^(left|right|top|full)$/.test(side)) {
          if (cw < 1024 && s.steps.length) side = "top";
          else if (cl.contains("sc-left")) side = "right";
          else if (cl.contains("sc-right")) side = "left";
          else if (!(tx1 > tx0)) side = "full";
          else if (tx1 - tx0 > 0.62 * vr.w) side = "top";
          else side = (tx0 + tx1) / 2 < vr.x + vr.w / 2 ? "right" : "left";
        }
        return {
          r, view, side, tx0, tx1, ix: si,
          // (wave 9, J2a CAPTION) cap: a caption scene; capH, capT above; stepEl: its steps (their .is-active, per frame)
          cap: s.cap && capT > 0, capH, capT, stepEl: s.cap ? s.steps : [],
          steps: s.steps.map((e) => rec(e)),
          // each step's number (data-stage-step="N"; 0 is an intro; missing or not a number: its place, from 1)
          stepNo: s.steps.map((e, k) => { const v = parseInt(e.getAttribute("data-stage-step") || "", 10); return Number.isFinite(v) && v >= 0 ? v : k + 1; }),
          cues: s.cues.map((e) => ({ id: e.getAttribute("data-stage-cue") || "", el: e, r: rec(e) })),
          marks: s.marks.map((e) => ({ id: e.getAttribute("data-stage-mark") || "", r: rec(e, true) })),
          imgs: s.imgs.map((e) => ({ id: e.getAttribute("data-slab") || "", el: e, r: rec(e) })),
          texts,
          media: s.media.map((e) => rec(e)).filter((r) => r && r.nat.w > 1 && r.nat.h > 1),
          disp: s.disp.map((e) => { const q = rec(e, true); return q ? Object.assign(q, { k: stepIx(e) }) : q; }).filter((r) => r && r.nat.w > 1 && r.nat.h > 1),
        };
      }),
      dawn: dawnEls.map((e) => rec(e)),
      keep: keepEls.map((e) => { const q = rec(e); return q ? Object.assign(q, { cap: capAt(e) }) : q; }).filter((r) => r && r.nat.w > 1 && r.nat.h > 1),
      refract: refract.map((e) => ({ el: e, r: rec(e, true) })).filter((x) => x.r && x.r.nat.w > 1),
      // (wave 1, KIT) the header's words (fixed: viewport px, with the header's own slide undone), for ctx.textRects
      hdr: qa(document, ".hdr-name, .hdr-nav, .hdr-menu").map((e) => {
        const b = e.getBoundingClientRect(), top = e.closest(".hdr") || e;
        return unblock(top, e, { x: b.left, y: b.top, w: b.width, h: b.height });
      }).filter((r) => r.w > 1 && r.h > 1),
      // (wave 7, COSMOS) where this page is in the cosmos (stage/cosmos/web.js journeyOf): its key, a case's name, the
      // largest scroll and, on the home, where each page's part begins (document px)
      cosmos: {
        key: D.getAttribute("data-page") || "home",
        slug: (document.querySelector("main[data-case]") || D).getAttribute("data-case") || "",
        max: Math.max(1, D.scrollHeight - ch),
        parts: qa(document, "section.part[data-part]").map((e) => ({ key: e.getAttribute("data-part") || "", top: Math.round(rectOf(e).y) })),
      },
    };
    for (const [h, v, p] of saved) { if (v) h.style.setProperty("position", v, p); else h.style.removeProperty("position"); }
    M = out;
    vpH = ih;
    BD.key = "";                    // the layout moved: the type is rasterised again
    // (wave 9, J3 VIEWPORT) the scenes' frame and the canvas's own box (dh): the backing covers the box
    if (stage) stage.resize(cw, ch, window.devicePixelRatio || 1, dh);
    log(`[stage] measured ${all.size} boxes (${sticky.size} sticky) in ${(performance.now() - t0).toFixed(1)} ms`);
  }

  /** the document rect of a record at this scroll: every sticky box of its chain resolved, outermost first
   *  @param {Rec | null | undefined} r @param {number} y @returns {Rect | null} */
  function at(r, y) {
    if (!r) return null;
    let d = 0;
    for (const s of r.chain) {
      const nt = s.top + d;
      // held by its bottom (k-fix3d): it rises from its place to keep B over the scrollport's foot, never above its
      // containing block's top; else held by its top, never below its containing block's bottom
      // (wave 9, J3 VIEWPORT) the scrollport's foot now (vpH: the layout viewport, which follows an iPhone's bar), not the
      // one measured: the box moves with the bar and its keep-out with it, with no measure
      const stuck = s.B !== undefined ? Math.min(nt, Math.max(y + (vpH || s.vh || 0) - s.B - s.h, (s.cbT ?? nt) + d + (s.mt || 0)))
        : Math.max(nt, Math.min(y + s.T, s.cbB + d - s.h - s.mb));
      d = stuck - s.top;
    }
    return d ? { x: r.nat.x, y: r.nat.y + d, w: r.nat.w, h: r.nat.h } : r.nat;
  }
  /** the same, in viewport px @param {Rec | null | undefined} r @param {number} y @returns {Rect | null} */
  function vat(r, y) { const a = at(r, y); return a ? { x: a.x, y: a.y - y, w: a.w, h: a.h } : null; }

  /* (wave 9, J3 VIEWPORT) WHETHER A RESIZE MOVED THE LAYOUT. On an iPhone Safari's bar showing or hiding fires resize
     (innerHeight, the layout viewport and the visual viewport follow the bar; FX's onResize follows 200 ms later) and
     moves nothing the host measured: the width, the initial containing block (clientHeight: the small viewport, which
     the views' 100svh and the captions' holds are made of), the canvas's box (100lvh) and the pixel ratio stay. Every
     resize measured the whole page again (twice), rastered the glass's type three times and asked the stage for its size:
     now only a change of one of those four does (a turned phone, a resized window, a zoom); a bar change keeps the
     layout viewport's height for the boxes held by their bottom (vpH) and nothing else. Layout changes that are not
     resizes keep their own measures: the fonts, the body's height and the tracks (ResizeObservers), ScrollTrigger's
     refresh (which on a touch-only screen skips a resize of the height alone: fx-core.js ignoreMobileResize). */
  function layoutMoved() {
    if (!M) return true;
    if (D.clientWidth !== M.cw || D.clientHeight !== M.ch || (window.devicePixelRatio || 1) !== M.dpr) return true;
    const cbox = canvas ? canvas.getBoundingClientRect().height : 0;
    const dh = cbox >= M.ch + 0.5 ? cbox : M.ch;   // as measure() reads it
    return Math.abs(dh - M.dh) >= 0.5;
  }
  /** a resize: the layout viewport's height kept (vpH, read by at()), the page measured only if its layout moved */
  function onViewport() {
    vpH = window.innerHeight || vpH;
    if (stage && !dead && layoutMoved()) measure();
  }

  /* (wave 9, J2a CAPTION) THE CAPTIONS ON SCREEN. In a caption scene every caption is held at the foot of the view, the
     one in focus shown and the others clear (css/scene.css): a caption is text (keep-outs, ctx.texts, ctx.textRects, the
     other scenes' yields) only while it can be seen: its step is in focus (fx-scroll.js .is-active), or it left focus
     less than CAP_SEEN_MS ago (it clears in 120 ms). A clear caption riding past the figure's band is no text: no hole
     in the cosmos follows it. m.capVis is written by the tick before the scene's frame */
  const CAP_SEEN_MS = 220;
  /** @param {any} m a scene's measure @param {number | undefined} k the caption step (-1 / undefined: not a caption) */
  function capShown(m, k) { return !(m && m.cap && typeof k === "number" && k >= 0 && m.capVis && !m.capVis[k]); }

  /**
   * (wave 1, KIT) ctx.textRects(o): the rectangles of this scene's text, now, in viewport px: its text blocks (their
   * glyphs' final layout boxes, entrances undone), its display titles ([data-refract], o.display, default true), its
   * controls (.btn, [data-stage-keepout] inside the section), and the header's words while the header is in (o.header,
   * default true); padded by o.pad (12), on screen only, neighbours merged until at most o.max (10) are left. No layout
   * read: everything comes from the last measure and the scroll.
   * @param {any} m the scene's measure @param {number} y @param {number} vh @param {{ pad?: number, header?: boolean, display?: boolean, max?: number }} [o]
   */
  function textRects(m, y, vh, o) {
    o = o || {};
    const pad = o.pad ?? 12, max = Math.max(1, Math.min(16, o.max ?? 10));
    /** @type {Rect[]} */ const rs = [];
    const add = (/** @type {Rect | null} */ r) => {
      if (!r || r.w < 1 || r.h < 1 || r.y + r.h < -pad - 40 || r.y > vh + pad + 40) return;
      rs.push({ x: r.x - pad, y: r.y - pad, w: r.w + 2 * pad, h: r.h + 2 * pad });
    };
    // (wave 9, J2a CAPTION) in a caption scene only the captions on screen are text (capShown: set each frame)
    for (const t of m.texts) if (capShown(m, t.k)) add(vat(t.r, y));
    if (o.display !== false) for (const r of m.disp || []) if (capShown(m, r.k)) add(vat(r, y));
    const sec = m.r && at(m.r, y);
    if (sec && M) for (const k of M.keep) { if (k.cap && !capShown(M.scenes[k.cap[0]], k.cap[1])) continue; const r = vat(k, y); if (r && r.y + y >= sec.y && r.y + y < sec.y + sec.h) add(r); }
    const cl = D.classList;
    if (o.header !== false && M && M.hdr && !(cl.contains("hdr-away") && !cl.contains("menu-open"))) for (const r of M.hdr) add(r);
    // merge: the pair whose union adds the least area, until few enough
    while (rs.length > max) {
      let bi = 0, bj = 1, best = Infinity;
      for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
        const a = rs[i], b = rs[j];
        const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y), x1 = Math.max(a.x + a.w, b.x + b.w), y1 = Math.max(a.y + a.h, b.y + b.h);
        const cost = (x1 - x0) * (y1 - y0) - a.w * a.h - b.w * b.h;
        if (cost < best) { best = cost; bi = i; bj = j; }
      }
      const a = rs[bi], b = rs[bj];
      const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y);
      rs[bi] = { x: x0, y: y0, w: Math.max(a.x + a.w, b.x + b.w) - x0, h: Math.max(a.y + a.h, b.y + b.h) - y0 };
      rs.splice(bj, 1);
    }
    return rs.map((r) => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) }));
  }

  /* ================================================================ refraction: the display type glass may bend
     One raster at a time, in document space: the [data-refract] type near the viewport, while a slab is on screen. The
     tick only names the nodes (from the last measure); the raster runs in its own task, and again 0.45 s and 1.3 s
     later so type caught coming into focus is redrawn sharp. */
  const BD = { key: "", busy: false, /** @type {any} */ next: null, timers: /** @type {number[]} */ ([]) };
  /** @param {{ key: string, nodes: Element[], rect: Rect } | null} want */
  function backdrop(want) {
    if (!want || want.key === BD.key) return;
    BD.key = want.key;
    BD.timers.forEach((t) => clearTimeout(t));
    const go = () => { BD.next = want; if (!BD.busy) rasterNext(); };
    go();
    BD.timers = [window.setTimeout(go, 450), window.setTimeout(go, 1300)];
  }
  async function rasterNext() {
    const w = BD.next; BD.next = null;
    const st0 = stage || shadow;
    if (!w || !st0 || !raster || typeof st0.setBackdrop !== "function") return;
    BD.busy = true;
    const g = gen;
    try {
      const bd = await raster.rasteriseType({ nodes: w.nodes, rect: w.rect, scale: Math.min(window.devicePixelRatio || 1, 1.5) });
      // (lane m-fly) before the takeover the type is rastered and held: the room on stage does not bend this page's title
      if (g === gen && BD.key === w.key) { if (stage) stage.setBackdrop(bd.canvas, bd.rect); else if (shadow) HELD.bd = bd; }
      log(`[stage] type ${w.key}: ${bd.canvas.width}x${bd.canvas.height} in ${bd.ms.toFixed(1)} ms`);
    } catch (e) { log("[stage] type raster failed: " + (e && /** @type {any} */ (e).message || e)); }
    BD.busy = false;
    if (BD.next) rasterNext();
  }
  /** the refract nodes near the viewport, while slabs show @param {number} y @param {number} vh */
  function refractWant(y, vh) {
    const nodes = [], keys = [];
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    M.refract.forEach((/** @type {any} */ f, /** @type {number} */ i) => {
      const r = at(f.r, y);
      if (!r || r.y + r.h < y - vh * 0.5 || r.y > y + vh * 1.5) return;
      nodes.push(f.el); keys.push(i);
      x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h);
    });
    if (!nodes.length) return null;
    const p = 64;
    return { key: keys.join(","), nodes, rect: { x: Math.max(0, x0 - p), y: Math.max(0, y0 - p), w: Math.min(M.cw, x1 + p) - Math.max(0, x0 - p), h: y1 - y0 + 2 * p } };
  }

  /* ================================================================ slab textures */
  /** the file an image shows (or will show): its current source, else the largest srcset candidate up to 2000 w
   *  @param {HTMLImageElement} img */
  function srcOf(img) {
    if (img.currentSrc) return img.currentSrc;
    const ss = img.getAttribute("srcset");
    if (ss) {
      let best = "", bw = 0;
      for (const part of ss.split(",")) {
        const [u, d] = part.trim().split(/\s+/);
        const w = d && d.endsWith("w") ? parseInt(d, 10) : 1;
        if (u && w <= 2000 && w >= bw) { best = u; bw = w; }
      }
      if (best) return new URL(best, location.href).href;
    }
    return img.src;
  }
  /** register a page image as a slab texture once decoded (a copy is loaded: the page's own <img> is left alone,
   *  lazy or hidden) @param {string} id @param {HTMLImageElement} img */
  async function loadTex(id, img) {
    const st0 = stage || shadow;
    if (!id || texReady.has(id) || texPending.has(id) || !st0 || typeof st0.slabTexture !== "function") return;
    if (img) TEXFROM.set(id, { el: img });
    texPending.add(id);
    const g = gen;
    try {
      const src = srcOf(img);
      if (!src) throw new Error("no source");
      if (TEXSRC.get(id) === src && typeof st0.hasTexture === "function" && st0.hasTexture(id)) { texReady.add(id); texPending.delete(id); return; }
      const im = new Image();
      im.decoding = "async";
      im.src = src;
      await im.decode();
      // (lane m-fly) a layer that a plate of the room still on stage holds is written only after the takeover
      if (!stage && shadow && typeof shadow.hasTexture === "function" && shadow.hasTexture(id)) await new Promise((r) => HELD.tex.push(() => r(null)));
      await (upQ = upQ.then(() => new Promise((r) => { if (typeof requestAnimationFrame === "function" && document.visibilityState === "visible") requestAnimationFrame(() => setTimeout(r, 0)); else setTimeout(r, 0); })));
      const st1 = stage || shadow;
      if (g === gen && st1) { await st1.slabTexture(id, im); texReady.add(id); TEXSRC.set(id, src); log(`[stage] slab texture ${id} ${im.naturalWidth}x${im.naturalHeight}`); }
    } catch (e) { log(`[stage] slab texture ${id} failed: ${e && /** @type {any} */ (e).message || e}`); }
    texPending.delete(id);
  }
  /** (wave 8, SMOOTH) a texture this page's stage holds now; one whose layer went to another texture is dropped from
   *  texReady and made again from what it was made from (TEXFROM: the image, the etched words, the canvas), by a scene
   *  on screen, each at most once in 1.5 s (asked again later if it could not be then) @param {string} id
   *  @returns {boolean} */
  function held(id) {
    if (texReady.has(id)) {
      if (!stage || typeof stage.hasTexture !== "function" || stage.hasTexture(id)) return true;
      texReady.delete(id);
    }
    const f = TEXFROM.get(id);
    if (!f || !reviveOK || !stage || texPending.has(id)) return false;
    const now = performance.now();
    if (now - (revivedAt.get(id) ?? -1e9) <= 1500) return false;
    revivedAt.set(id, now);
    log(`[stage] texture ${id} lost its layer: made again`);
    try {
      if (f.el) loadTex(id, f.el);
      else if (f.etch && raster) addTex(id, raster.etch(f.etch[0], f.etch[1]));
      else if (f.src) addTex(id, f.src);
    } catch (e) { /* asked again in 1.5 s */ }
    return false;
  }
  /** a texture a scene made (etched words, a canvas of its own) @param {string} id @param {any} source */
  function addTex(id, source) {
    const st0 = stage || shadow;
    if (!st0 || typeof st0.slabTexture !== "function" || !source) return null;
    if (held(id)) return id;
    TEXFROM.set(id, { src: source });
    // (lane m-fly) before the takeover a layer the room on stage still shows is not written: once, after it
    if (!stage && typeof st0.hasTexture === "function" && st0.hasTexture(id)) {
      if (!texPending.has(id)) { texPending.add(id); HELD.tex.push(() => { texPending.delete(id); addTex(id, source); }); }
      return null;
    }
    try {
      const r = st0.slabTexture(id, source);
      if (r && typeof r.then === "function") { texPending.add(id); r.then(() => { texPending.delete(id); texReady.add(id); }, () => texPending.delete(id)); return null; }
      texReady.add(id);
      return id;
    } catch (e) { log(`[stage] texture ${id} failed: ${e && /** @type {any} */ (e).message || e}`); return null; }
  }
  /** etched words (the display face, uppercase) as a slab texture, made once per id @param {string} id
   *  @param {string[]} lines @param {any} [o] */
  function etch(id, lines, o) {
    const tid = "etch:" + id;
    if (held(tid)) return tid;
    const st0 = stage || shadow;
    if (texPending.has(tid) || !raster || !st0 || typeof st0.slabTexture !== "function") return null;
    if (document.fonts && document.fonts.status !== "loaded") return null;   // drawn once the face is in
    // (lane m-fly) the same words the kept stage already holds under this id (a page reached again): nothing to draw
    let sig = "";
    try { sig = "etch|" + JSON.stringify([lines, o || {}]); } catch (e) { sig = ""; }
    if (sig && TEXSRC.get(tid) === sig && typeof st0.hasTexture === "function" && st0.hasTexture(tid)) { texReady.add(tid); return tid; }
    try {
      const r = addTex(tid, raster.etch(lines, o || {}));
      if (sig) TEXSRC.set(tid, sig);
      // (wave 8, SMOOTH) the words to etch again, not the canvas (a canvas kept per etched plate held tens of MB)
      TEXFROM.set(tid, { etch: [lines, o || {}] });
      return r;
    } catch (e) { log("[stage] etch failed: " + (e && /** @type {any} */ (e).message || e)); return null; }
  }

  /* ================================================================ the tick */
  let domScene = "", pullUntil = 0;
  /* a scene's look overrides (ctx.look): the free camera's hall may be deeper than the page's (the cover's world asks
     for a wider z range of the swarm, stage.js LOOK.far / near); set once per change, kept across a rebuilt stage */
  /** @type {any} */ let lookWant = null;
  let lookKey = "";
  /** @param {any} l */
  function setLook(l) {
    const k = JSON.stringify(l || null);
    if (k === lookKey) return;
    // (lane m-fly) before the takeover the look is only noted: the room on stage keeps its own until this page takes it
    if (!stage && shadow) { lookKey = k; lookWant = l; return; }
    if (!stage || typeof stage.look !== "function") return;
    lookKey = k; lookWant = l; stage.look(l);
  }
  /* (wave 7, STAGE) THE LOOK OF A FRAME, MIXED. A scene asks for its look (ctx.look: far, near, keepFeather, ...) or
     asks for none (the stage's own LOOK). Before, every ask went to the stage as it came, in DOM order: the last scene
     near the screen won even unseen (in the home the next part's look took over a screen before it showed), and a key
     nobody asked for kept whatever the last part had set (the home's gallery drew with the hero's far plane going
     down and About's coming back up; a page reached by a flight with the page before's). Now every scene in the frame
     counts by its weight, and a key it does not ask for counts at LOOK's value: one page is one look, as on a load, and
     the home's parts hand their looks over as their scenes hand over the frame. far, near and keepFeather are always
     resolved; a key once asked for on this page is resolved from then on (back to LOOK's value when nobody asks). */
  /* (wave 7, INTEGRATE) far and near join only once a scene of the page asks for them (the hero and Now do: the home
     mixes them by weight as above). Forced on every page, a flight from the home's hero into Work narrowed the depth
     range to LOOK's while the swarm still stood in the hall's: for a second the name hung in Work's room and melted
     into a blue cloud over the plates (3.9 ms GPU, the swarm halved for 8 s; HEAD 1.2 ms). A page reached by a flight
     keeps the depth range it was flown in with, as in wave 6; a page loaded has LOOK's. */
  /** @type {Set<string>} */ const lookKeys = new Set(["keepFeather"]);
  /** @param {Scene[]} inFrame @param {Map<Scene, any>} asks @returns {any} */
  function lookOf(inFrame, asks) {
    const L = mod && mod.LOOK;
    if (!L) return null;
    let tw = 0;
    for (const S of inFrame) tw += Math.max(0, S.w);
    if (tw < 1e-4) return null;
    // (focus is the stage's focus pull, set by the frame's own focus: never resolved here)
    for (const a of asks.values()) for (const key of Object.keys(a)) if (key !== "focus" && typeof a[key] === "number" && typeof L[key] === "number") lookKeys.add(key);
    /** @type {Record<string, number>} */ const out = {};
    for (const key of lookKeys) {
      let v = 0;
      for (const S of inFrame) { const a = asks.get(S), x = a && typeof a[key] === "number" ? a[key] : L[key]; v += Math.max(0, S.w) * x; }
      v /= tw;
      out[key] = key === "far" || key === "near" ? Math.round(v) : key === "keepFeather" ? Math.round(v * 2) / 2 : r4(v);
    }
    return out;
  }
  /* the glass signal (stage/scenes/README.md, ctx.glass): the plates can draw from glassT (host seconds); late: the
     stage drew before they could (their pipeline was still compiling), so a plate on screen now ENTERS. A scene with
     glassEntry: true brings its plates in itself; every other scene's plates get the host's short focus pull. */
  const PULL_S = 0.45;
  let glassT = -1, glassLate = false, drawnT = -1;

  /** step, local and progress of a scene at this scroll @param {any} m @param {Rect} sec doc @param {number} y
   *  @param {number} vh @param {boolean} stacked */
  function stepping(m, sec, y, vh, stacked) {
    const through = clamp((y + vh - sec.y) / (sec.h + vh), 0, 1);
    const progress = sec.h > vh * 1.05 ? clamp((y - sec.y) / (sec.h - vh), 0, 1) : through;
    /** @type {{ n: number, r: Rect }[]} */ const list = [];
    m.steps.forEach((/** @type {Rec} */ r, /** @type {number} */ k) => { const a = at(r, y); if (a) list.push({ n: m.stepNo[k], r: a }); });
    const n = list.length;
    if (!n) return { step: 0, steps: 0, local: 0, progress, through };
    const steps = Math.max(...list.map((s) => s.n));
    // the reading line: the viewport's middle (a step is one screen: it holds the line while its block is the one
    // nearest the middle); old markup with short entries under a sticky box on a phone reads lower
    const c = y + vh * (stacked && list[0].r.h < vh * 0.8 ? 0.72 : 0.5);
    let step = list[0].n, local = 0;
    // steps laid out one after the other: the step under the reading line; a step numbered 0 is the scene's intro
    const spread = list[n - 1].r.y - list[0].r.y > 4;
    if (spread) {
      if (c < list[0].r.y) { step = list[0].n; local = 0; }
      else if (c >= list[n - 1].r.y + list[n - 1].r.h) { step = list[n - 1].n; local = 1; }
      else {
        for (let k = 0; k < n; k++) {
          const top = list[k].r.y, nextTop = k + 1 < n ? list[k + 1].r.y : list[k].r.y + list[k].r.h;
          if (c >= top && c < nextTop) { step = list[k].n; local = clamp((c - top) / Math.max(1, nextTop - top), 0, 1); break; }
        }
      }
      const a = list[0].r.y, b = list[n - 1].r.y + list[n - 1].r.h;
      return { step, steps, local, progress: sec.h > vh * 1.05 ? progress : clamp((c - a) / Math.max(1, b - a), 0, 1), through };
    }
    // steps stacked in one place (a sticky stack): one screen of scroll per step through the section
    const xs = progress * n, i = clamp(Math.floor(xs), 0, n - 1);
    return { step: list[i].n, steps, local: clamp(xs - i, 0, 1), progress, through };
  }

  function tick() {
    // (lane m-fly) stg: the stage this tick reads: this page's, or (a priming pass before the takeover) the kept one
    const stg = stage || (priming ? shadow : null);
    if (!stg || dead || paused || (building && !priming) || document.hidden || !M) return;
    // (wave 9, J2a CAPTION) fx-scroll's arrival (html.fs-on) turns the caption grammar on with no resize: measure again
    if (M.fs !== D.classList.contains("fs-on")) measure();
    const now = performance.now();
    const dt = clamp(lastT ? (now - lastT) / 1000 : 1 / 60, 0, 0.1);
    lastT = now; time += dt;
    const y = window.scrollY, vw = M.cw, vh = M.ch;
    // (wave 9, J3 VIEWPORT) the drawn height: the canvas's box (measure), as deep as vh or deeper (the strip under an
    // iPhone's bar): texts, keep-outs and the day are kept down to it; the scenes' frame stays vw x vh
    const dh = Math.max(vh, M.dh || vh);
    sv += ((y - lastY) / Math.max(dt, 1e-3) - sv) * (1 - Math.exp(-dt / 0.1));
    lastY = y;
    if (Math.abs(sv) < 0.5) sv = 0;
    {
      const want = clamp(Math.abs(sv) / SPEED_PX, 0, 1);
      spd += (want - spd) * (1 - Math.exp(-dt / (want > spd ? SPEED_UP : SPEED_DOWN)));
      if (spd < 0.02 && want === 0) spd = 0;
    }
    const phone = vw < 760, gnd = ground();
    const gl = stg.glass || { ready: true };
    if (gl.ready && glassT < 0) { glassT = time; glassLate = drawnT >= 0; if (glassLate) log(`[stage] glass joins ${(time - drawnT).toFixed(2)} s after the first frame`); }
    const glass = { ready: !!gl.ready, age: glassT < 0 ? 0 : time - glassT, late: glassLate };
    const pullK = glass.ready ? (glassLate ? sstep(0, PULL_S, glass.age) : 1) : 0;

    // ------------------------------------------------ the scenes' shares: a row belongs to the last scene (in DOM
    // order) that covers it
    const secs = M.scenes.map((/** @type {any} */ m) => at(m.r, y));
    const share = new Array(scenes.length).fill(0);
    let tot = 0;
    for (let i = 0; i < ROWS; i++) {
      const f = (i + 0.5) / ROWS, ry = y + f * vh, wgt = 1 - Math.abs(2 * f - 1) * 0.5;
      let hit = -1;
      secs.forEach((/** @type {Rect | null} */ r, /** @type {number} */ k) => { if (r && ry >= r.y && ry < r.y + r.h) hit = k; });
      if (hit >= 0) share[hit] += wgt;
      tot += wgt;
    }
    for (let k = 0; k < share.length; k++) share[k] /= tot;

    // ------------------------------------------------ day: the [data-dawn] rectangles (viewport), or the whole page
    /** @type {{ x0: number, y0: number, x1: number, y1: number }[]} */ const dawn = [];
    if (gnd === "dawn") {
      // (lane m-fly) reached by a flight from a night view: the day rises as a straight edge from the bottom of the frame
      const k = dayAt ? clamp((now - dayAt) / DAY_MS, 0, 1) : 1, e = k * k * (3 - 2 * k);
      if (dayAt) dayRose = true;
      // (wave 9, J3 VIEWPORT) down to the drawn foot (dh): the strip a hidden bar uncovers is day too
      if (e > 0.002) dawn.push({ x0: 0, y0: Math.round(dh * (1 - e)), x1: vw, y1: Math.round(dh) });
      if (k >= 1) dayAt = 0;
    }
    else for (const d of M.dawn) {
      const r = vat(d, y);
      if (!r || r.y >= dh || r.y + r.h <= 0) continue;
      dawn.push({ x0: Math.round(Math.max(0, r.x)), y0: Math.round(Math.max(0, r.y)), x1: Math.round(Math.min(vw, r.x + r.w)), y1: Math.round(Math.min(dh, r.y + r.h)) });
    }
    // the night band for a stage that reads only `night` (light inside it): from far above to the first day's top
    const night = gnd === "dawn" ? null : { top: -1e5, bottom: dawn.length ? Math.min(...dawn.map((d) => d.y0)) : 1e5 };
    const dawnV = dawn.map((d) => ({ x: d.x0, y: d.y0, w: d.x1 - d.x0, h: d.y1 - d.y0 }));
    viewDawn = dawnV.reduce((s, r) => s + r.w * r.h, 0) / Math.max(1, vw * dh);
    const nightRoom = gnd === "dawn" ? 1 : sstep(0.62, 0.98, (night ? night.bottom : 1e5) / vh);

    // ------------------------------------------------ the scenes
    const nx = ptr.present ? clamp((ptr.x / vw) * 2 - 1, -1, 1) : 0, ny = ptr.present ? clamp((ptr.y / vh) * 2 - 1, -1, 1) : 0;
    /** @type {Record<string, { weight: number, rect: Rect, scene: any, sp: number }>} */ const want = {};
    /** @type {any[]} */ const slabs = [];
    /** @type {Rect[]} */ const sceneKeep = [];
    let cy = 0, cp = 0, cd = 0, cw = 0, ptrK = 0, fz = 0, fw = 0;
    /** @type {{ o: any, w: number }[]} */ const cams = [];
    let anyFree = false, restS = 0, bloomK = 0, bloomW = 0;
    /** @type {{ field: any, weight: number }[]} */ const fields = [];   // THE FIELD: the scenes' { lights, chips, wall }, blended by the stage
    /** @type {any} */ let bloomO = null;
    /** @type {Record<string, { cfg: any, top: number, sum: number }>} */ const passWant = {};
    // (wave 1, FIX3D) every scene's text on screen, and the slabs of the scenes that YIELD (def.yields): a plate of one
    // scene steps back from another scene's text (the stack's last plate lay across the path's head, bending it double)
    /** @type {{ name: string, texts: any[] }[]} */ const textBy = [];
    /** @type {Map<any, string>} */ const yielders = new Map();
    const clock = stg.clock || { time, activity: 1, awake: true };
    const touch = touchy();
    // (wave 2, ARRIVE) the first frame is the room as it stands: weights start at their targets, nothing rises from zero
    const first = !on;
    const arrival = { cut: ARRIVED, under: sheetUp, age: drawnT < 0 ? 0 : r4(time - drawnT) };
    let subjW = 0, litAsked = false, litSaid = false;
    /** @type {Map<Scene, any>} */ const lookAsk = new Map();
    /** @type {Scene[]} */ const lookIn = [];
    // (wave 7, STAGE) a scene still waiting for its formations: the pump takes it now if the reader comes near
    if (later.size && !pumping && !priming) {
      let soon = false;
      scenes.forEach((S, k) => { const sec = secs[k]; if (later.has(S) && sec && sec.y < y + vh * (1 + AHEAD.down) && sec.y + sec.h > y - vh * AHEAD.up) soon = true; });
      if (soon) pump(gen);
    }
    scenes.forEach((S, k) => {
      const m = M.scenes[k], sec = secs[k];
      if (!m || !sec || S.broken || S.ready === false) return;
      S.w = first ? share[k] : damp(S.w, share[k], SCENE_S, dt);
      if (S.w < 1e-4 && share[k] === 0) S.w = 0;
      const near = sec.y < y + vh * 1.6 && sec.y + sec.h > y - vh * 0.6;
      reviveOK = share[k] > 0 || S.w > 0.02;
      if (near && !S.texAsked) { S.texAsked = true; for (const im of m.imgs) loadTex(im.id, im.el); }
      // (wave 8, SMOOTH) on screen, a few times a second: the scene's own textures held again (held) before its
      // plates are seen (its page images are looked at every frame below, in ctx.imgs)
      else if (reviveOK && (S.texChk = (S.texChk || 0) + 1) % 20 === 0) {
        const pre = S.name + ":", pe = "etch:" + pre;
        for (const id of TEXFROM.keys()) if (id.startsWith(pre) || id.startsWith(pe)) held(id);
      }
      if (!near && share[k] <= 0 && S.w < 0.002) return;
      // (wave 9, J2a CAPTION) which captions are on screen this frame (capShown)
      if (m.cap) {
        const seen = /** @type {any} */ (S).capSeen || (/** @type {any} */ (S).capSeen = []);
        m.capVis = m.stepEl.map((/** @type {Element} */ e, /** @type {number} */ j) => { if (e.classList.contains("is-active")) seen[j] = now; return seen[j] != null && now - seen[j] < CAP_SEEN_MS; });
      }
      const view = vat(m.view, y) || { x: 0, y: sec.y - y, w: vw, h: sec.h };
      const fig = figOf(m, view, vw);
      const st = stepping(m, sec, y, vh, m.side === "top");
      /** @type {Record<string, Rect>} */ const marks = {};
      for (const mk of m.marks) { const r = vat(mk.r, y); if (r && !(mk.id in marks)) marks[mk.id] = r; }
      /** @type {Record<string, any>} */ const imgs = {};
      for (const im of m.imgs) {
        const el = /** @type {HTMLImageElement} */ (im.el);
        imgs[im.id] = { tex: held(im.id) ? im.id : null, w: el.naturalWidth || 0, h: el.naturalHeight || 0,
          aspect: el.naturalWidth && el.naturalHeight ? el.naturalWidth / el.naturalHeight : 16 / 10, rect: vat(im.r, y), el };
      }
      // (wave 9, J3 VIEWPORT) down to the drawn foot (dh): a text in the strip under an iPhone's hidden bar is seen
      const texts = m.texts.filter((/** @type {any} */ t) => capShown(m, t.k)).map((/** @type {any} */ t) => ({ tag: t.tag, ...vat(t.r, y) })).filter((/** @type {any} */ t) => t.y + t.h > -40 && t.y < dh + 40);
      textBy.push({ name: S.name, texts });
      const media = m.media.map((/** @type {Rec} */ r) => vat(r, y)).filter((/** @type {Rect | null} */ r) => r && r.y + r.h > -40 && r.y < dh + 40);
      const ctx = {
        name: S.name, view, fig, side: m.side, section: { x: sec.x, y: sec.y - y, w: sec.w, h: sec.h },
        step: st.step, steps: st.steps, local: st.local, progress: st.progress, through: st.through,
        cue: cueOf(m, y, vh, touch),
        pointer: { x: ptr.x, y: ptr.y, present: ptr.present, down: ptr.down, nx, ny },
        scrollVelocity: sv, scrollY: y, vw, vh, phone, tier, inkK, share: share[k], weight: S.w,
        marks, imgs, texts, media, dawn: dawnV, ground: gnd, time, dt, state: S.state, glass, clock,
        etch: (/** @type {string} */ id, /** @type {string[]} */ l, /** @type {any} */ o) => etch(S.name + ":" + id, l, o),
        texture: (/** @type {string} */ id, /** @type {any} */ src) => addTex(S.name + ":" + id, src),
        // (wave 7, STAGE) a scene's look is an ask, mixed with the other scenes' by weight after the loop (lookOf)
        look: (/** @type {any} */ l) => { if (l && typeof l === "object") lookAsk.set(S, l); },
        // (wave 1, KIT) the reader's speed 0..1 (smoothed), the hand's orbit input -1..1 (the pointer's place on a
        // desktop, the horizontal drag on a touch screen), and the scene's text, now (README "The room")
        speed: r4(spd),
        aim: touch ? { x: drag.nx, y: 0, touch: true } : { x: nx, y: ny, touch: false },
        textRects: (/** @type {any} */ o) => textRects(m, y, dh, o),
        // (wave 2, ARRIVE) { cut, under, age }: reached by a cut, the sheet still over the page, s since the first frame
        arrival,
        // (lane o-fix) the cut's flight through the portal, 0 (the room) .. 1 (inside the glass): the room dims what only
        // the room's own light should show (lib/room.js: the hand's blade, a grey column once the plates left the frame)
        flight: stg && stg.portalState ? r4(stg.portalState.p) : 0,
        // (wave 9, J2a CAPTION) a caption scene: where its captions stand, viewport px (top: the tallest one's top when
        // held, foot: the line their foot is held at); null in every other scene and on a wide screen
        caption: m.cap ? { top: Math.round(m.capT - m.capH), foot: Math.round(m.capT) } : null,
        // (wave 9, J3 VIEWPORT) the header's top safe area, px (a notch or a status bar over the page; 0 elsewhere): the
        // header is that much taller, and a figure that stands under it stands that much lower
        safeTop: M.safeTop || 0,
      };
      /** @type {any} */ let o = null;
      try { o = S.def.frame ? S.def.frame(ctx) : null; }
      catch (e) { S.broken = true; log(`[stage] scene "${S.name}" frame threw: ${e && /** @type {any} */ (e).message || e}`); return; }
      if (S.def.litSignal === true && S.w > 0.25) { litAsked = true; if (o && o.lit === true) litSaid = true; }
      if (!o) return;
      lookIn.push(S);
      // the subject the cut pushes toward: the leading scene's own (o.subject, viewport px), else its figure's centre
      if (share[k] > subjW) {
        subjW = share[k];
        const sj = o.subject;
        subject = sj && isFinite(sj.x) && isFinite(sj.y) ? { x: +sj.x, y: +sj.y } : { x: fig.x + fig.w / 2, y: fig.y + fig.h / 2 };
      }
      // a blended scene is the night's: it lets go of its light as the morning rises past the middle of the screen
      // (its points would cross into the day as ink blots); a scene with blend: false weighs itself
      const bw = S.def.blend === false ? 1 : S.w * nightRoom;
      for (const f of o.swarm || []) {
        const gid = S.ids[f.id];
        if (!gid || !registered.has(gid)) continue;
        const r = f.rect || fig;
        want[gid] = { weight: clamp((f.weight ?? 1) * bw, 0, 1), rect: { x: r.x, y: r.y + y, w: r.w, h: r.h },
          scene: f.scene || { step: st.step, local: r4(st.local), progress: r4(st.progress) }, sp: f.progress ?? st.progress };
      }
      // a scene that does not bring its plates in itself: they come in with a short focus pull once the glass can draw
      const own = S.def.glassEntry === true, pk = own ? 1 : pullK;
      for (const s of glass.ready ? o.slabs || [] : []) {
        const alpha = clamp((s.alpha ?? 1) * bw * pk, 0, 1);
        if (alpha < 0.004) continue;
        const tex = s.tex && held(s.tex) ? s.tex : null, etchT = s.etch && held(s.etch) ? s.etch : null;
        /** @type {any} */ const slab = { id: S.name + ":" + s.id, cx: r2(s.cx), cy: r2(s.cy), cz: r2(s.cz || 0), yaw: r4(s.yaw || 0), pitch: r4(s.pitch || 0), roll: r4(s.roll || 0),
          w: r2(s.w), h: r2(s.h), t: r2(s.t ?? 24), tex, alpha: r4(alpha), glow: r4(clamp(s.glow ?? 0.5, 0, 1)), sharp: r4(clamp((s.sharp ?? 1) * (own ? 1 : 0.3 + 0.7 * pk), 0, 1)) };
        // the stage's added fields pass through as given (etch only once its texture is held)
        if (etchT) slab.etch = etchT;
        for (const k of ["inset", "bevel", "ior", "dispersion", "tint", "sheen", "edge"]) if (typeof s[k] === "number") slab[k] = s[k];
        if (S.def.yields === true) yielders.set(slab, S.name);
        slabs.push(slab);
      }
      for (const r of o.keepouts || []) sceneKeep.push(r);
      const cw1 = S.def.blend === false ? Math.min(1, S.w * 2) : S.w;
      if (o.camera) { cy += cw1 * (o.camera.yaw || 0); cp += cw1 * (o.camera.pitch || 0); cd += cw1 * (o.camera.dolly || 0); ptrK += cw1 * (o.camera.pointer ?? 1); }
      else ptrK += cw1;
      cw += cw1;
      cams.push({ o, w: cw1 });
      if (o.camera && (o.camera.pos || o.camera.position) && cw1 > 1e-3) anyFree = true;
      if (typeof o.rest === "number" && S.w > 0.25) restS = Math.max(restS, o.rest);
      if (o.bloom) {
        const b = typeof o.bloom === "object" ? o.bloom : { strength: +o.bloom || 0 };
        bloomK += cw1 * (+b.strength || 0);
        if (cw1 > bloomW) { bloomW = cw1; bloomO = b; }
      }
      if (typeof o.focus === "number") { fz += o.focus * cw1; fw += cw1; }
      if (o.field && bw > 1e-4) fields.push({ field: o.field, weight: bw, name: S.name });
      // (wave 2, ARRIVE) an extra pass a scene switches on (stage.js registerPass): the heaviest scene's config, the
      // scenes' weights summed into cfg.weight
      if (o.passes && typeof o.passes === "object" && bw > 1e-4) for (const id of Object.keys(o.passes)) {
        const c = o.passes[id];
        if (!c || typeof c !== "object") continue;
        const cur = passWant[id];
        if (!cur || bw > cur.top) passWant[id] = { cfg: c, top: bw, sum: (cur ? cur.sum : 0) + bw };
        else cur.sum += bw;
      }
    });
    reviveOK = true;

    // (wave 7, STAGE) the frame's look: the scenes' asks mixed by weight (lookOf)
    { const l = lookOf(lookIn, lookAsk); if (l) setLook(l); }

    // ------------------------------------------------ formations: damped weights, the heaviest four
    for (const gid of registered) {
      const target = want[gid] ? want[gid].weight : 0;
      let nv = first ? target : damp(W[gid] || 0, target, SMOOTH_S, dt);
      if (Math.abs(nv - target) < 1e-3) nv = target;
      W[gid] = nv;
    }
    const top = [...registered].filter((g) => W[g] > 0.004).sort((a, b) => W[b] - W[a]).slice(0, MAX_SWARM);
    const zero = { step: 0, local: 0, progress: 0 };
    const formations = top.map((g) => {
      const f = want[g] || lastRect[g];   // a formation fading out keeps its last place
      if (want[g]) lastRect[g] = want[g];
      const r = f ? f.rect : { x: 0, y, w: vw, h: vh };
      return { id: g, weight: r4(W[g]), rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) },
        sectionProgress: r4(f ? f.sp : 0), scene: f ? f.scene : zero };
    });

    // ------------------------------------------------ slabs: a yielding scene's plate gives way to another scene's
    // text, by how near its box on screen (the straight view's projection, padded) comes to it: gone on contact
    if (yielders.size) {
      const D0 = Math.min(2600, Math.max(1100, 1.25 * Math.hypot(vw, vh)));
      for (let i = slabs.length - 1; i >= 0; i--) {
        const sl = slabs[i], nm = yielders.get(sl);
        if (!nm) continue;
        const k = D0 / Math.max(1, D0 - sl.cz), X = vw / 2 + (sl.cx - vw / 2) * k, Y = vh / 2 + (sl.cy - vh / 2) * k;
        const hw = (sl.w * k) / 2 + sl.t, hh = (Math.max(sl.h, sl.w * 0.5) * k) / 2 + sl.t;
        let g = 1e9;
        for (const tb of textBy) {
          if (tb.name === nm) continue;
          for (const r of tb.texts) g = Math.min(g, Math.max(r.x - (X + hw), X - hw - (r.x + r.w), r.y - (Y + hh), Y - hh - (r.y + r.h)));
        }
        const a = sl.alpha * sstep(0, 140, g);
        if (a < 0.004) slabs.splice(i, 1); else sl.alpha = r4(a);
      }
    }
    // ------------------------------------------------ slabs: the twelve most present
    slabs.sort((a, b) => b.alpha - a.alpha);
    slabs.length = Math.min(slabs.length, MAX_SLABS);

    // ------------------------------------------------ camera: the scenes' blend (smoothed across a change of scene;
    // the stage damps it again and adds the pointer's few degrees, `follow`, scaled by the scenes' `pointer`)
    const n = cw > 1e-4 ? 1 / cw : 0, pk = cw > 1e-4 ? ptrK / cw : 1;
    cam.yaw = damp(cam.yaw, cy * n, first ? 0 : CAM_S, dt);
    cam.pitch = damp(cam.pitch, cp * n, first ? 0 : CAM_S, dt);
    cam.dolly = damp(cam.dolly, cd * n, first ? 0 : CAM_S, dt);
    cam.follow = PTR_FOLLOW * pk;

    // ------------------------------------------------ keep-outs (viewport px, on screen only: down to the drawn foot,
    // dh, wave 9 J3 VIEWPORT)
    const keepouts = [];
    for (const r of sceneKeep) {
      if (keepouts.length >= MAX_KEEP) break;
      if (r && r.w > 1 && r.h > 1 && r.y + r.h > -40 && r.y < dh + 40) keepouts.push({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) });
    }
    for (const k of M.keep) {
      if (keepouts.length >= MAX_KEEP) break;
      const r = vat(k, y);
      if (!r || r.y + r.h < -40 || r.y > dh + 40 || r.x + r.w < 0 || r.x > vw) continue;
      // a control that has faded out (the cover's foot as its flight begins) needs no hole in the light
      const el = /** @type {any} */ (k).el;
      if (el && typeof el.checkVisibility === "function" && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      keepouts.push({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) });
    }

    // ------------------------------------------------ focus: a pull at each change of the leading scene, then the
    // scenes' own focus (0, the page plane, by default)
    let lead = "", lv = 0;
    scenes.forEach((S, k) => { if (share[k] > lv) { lv = share[k]; lead = S.name + k; } });
    if (lead && lead !== domScene) { if (domScene) pullUntil = now + 520; domScene = lead; }
    const focus = now < pullUntil ? -170 : Math.round(fw > 0 ? fz / fw : 0);

    // (lane n-flight) a priming pass (adopt(), an arrival by a flight): the scenes have run once and done their first
    // frame's own work (etched words rastered, textures asked) and the display type the glass bends is being rastered;
    // the stage is not set and nothing is drawn (the router's bridge still shows the door), the next tick is the first
    if (priming) { if (slabs.length && M.refract.length) backdrop(refractWant(y, vh)); return; }
    const bl = cw > 1e-4 ? bloomK / cw : 0;
    stage.set({
      formations, scroll: { x: 0, y }, night, dawn, keepouts,
      pointer: { x: ptr.x, y: ptr.y, down: ptr.down, present: ptr.present },
      aim: touch ? { x: drag.nx, y: 0 } : null,
      scrollVelocity: sv, mist: { ink: 0 }, focus,
      camera: anyFree ? freeBlend(cams, cw, vw, vh) : { yaw: r4(cam.yaw), pitch: r4(cam.pitch), dolly: r2(cam.dolly), follow: r4(cam.follow) },
      slabs, rest: restS > 0 ? restS : 0,
      bloom: bl > 0.001 ? { ...(bloomO || {}), strength: r4(bl) } : 0,
      field: fields.length ? fields : null,
      passes: passesOf(passWant),
      // (wave 7, COSMOS) the page's place in the cosmos, at this scroll (the home: one journey through every page's)
      cosmos: M.cosmos ? { ...M.cosmos, y: Math.round(y), vh } : null,
    });
    if (slabs.length && M.refract.length && !flyOut) backdrop(refractWant(y, vh));

    let drew = false;
    const dev = device;
    if (!dev) return;
    dev.pushErrorScope("internal"); dev.pushErrorScope("out-of-memory"); dev.pushErrorScope("validation");
    try { drew = stage.frame(dt); }
    catch (e) { off("frame threw: " + (e && /** @type {any} */ (e).message || e)); }
    finally {
      const g = gen;
      const pv = dev.popErrorScope(), pm = dev.popErrorScope(), pi = dev.popErrorScope();
      Promise.all([pv, pm, pi]).then((errs) => { const e = errs.find(Boolean); if (e && g === gen) off("GPU error: " + e.message); }, () => {});
    }
    // the room comes up from the dark (DRIVE: it used to pop in from one frame to the next)
    if (drew && !on && !dead) {
      on = true; drawnT = time;
      // (wave 2, ARRIVE) under an arriving sheet the canvas is simply there (the sheet covers it); else a 250 ms rise
      if (canvas) { if (sheetUp) canvas.style.transition = "none"; canvas.style.opacity = "1"; }
      D.classList.add("stage-on");
      if (touch && document.body) document.body.style.setProperty("touch-action", "pan-y pinch-zoom");
      signal("fx:stage:frame", { arrival: ARRIVED, under: sheetUp });
    }
    // (lane PORTAL) the glass fills the frame: the sheet may flood in now (css/cuts.css html.cut-full)
    if (portalOut && !portalFull && stage.portalState && stage.portalState.p >= 0.9) {
      portalFull = true; D.classList.add("cut-full");
      // the sheet is opaque 110 ms later (css/cuts.css): nothing drawn under it after that. (lane o-router) Under the
      // Astro build's router the stage outlives the page: it keeps drawing the glass while the page changes under it
      signal("fx:stage:full", {});
      if (!SOFT) setTimeout(() => { if (portalOut && portalFull) paused = true; }, 140);
    }
    // (lane n-flight) the door reached: the page may change now (the router's loader waits for fx:stage:full)
    // The page changes a breath BEFORE the door (the last FLY_LEAD of the leaving): the stage outlives the page, the eye
    // flies on to the door under the router's bridge, and the new page's start-up falls in those frames instead of in a
    // wait at the door (adopt() holds its room back until the door is reached). Toward the morning it changes at the door;
    // toward the cover too (flyHeavy: its start-up is one task of about 0.1 s, which would stall the approach).
    if (flyOut && !flyFull && stage.flyState) {
      const fs = stage.flyState;
      // (lane n-fix-flight) toward the cover too: its start-up is no longer one long task (the name is built in slices)
      // (lane m-fly) the page no longer waits for this (it changes as soon as the old text has left): the signal says
      // the door hides the frame
      if (fs.cover || fs.phase === "hold" || fs.phase === null) {
        flyFull = true;
        signal("fx:stage:full", {});
      }
    }
    // (lane n-flight) arriving: the eye nearly still (the title rises), then still (the room stands)
    if (ARR_FLY && stage.flyState) {
      const fs = stage.flyState;
      if (fs.phase !== "in" || fs.u >= (fs.dir < 0 ? 0.6 : 0.46) || dayRose) SIGX.res.settle();
      if (fs.phase !== "in") SIGX.res.stood();
    }
    // the subject lit: a scene with litSignal says so (lit: true); a page without one is lit at its first frame
    if (on && !litSent && (litSaid || !litAsked || time - drawnT > 4)) { litSent = true; D.classList.add("stage-lit"); signal("fx:stage:lit", { arrival: ARRIVED, under: sheetUp }); }
    if (drew && (instrT += dt) >= INSTR_S) { instrT = 0; writeInstr(); }
    if (DEBUG) /** @type {any} */ (window).__stageHost.last = { formations, slabs: slabs.map((s) => s.id + ":" + s.alpha), dawn, keepouts: keepouts.length, keepRects: keepouts,
      share: Object.fromEntries(scenes.map((S, k) => [S.name, r4(share[k])])), weights: Object.fromEntries(scenes.map((S) => [S.name, r4(S.w)])),
      camera: { ...cam }, focus, sv: Math.round(sv), speed: r4(spd), aim: touch ? drag.nx : null, drew,
      fields: fields.map((f) => f.name + ":" + r4(f.weight) + ":" + (f.field.lights ? f.field.lights.length : 0)) };
  }

  /**
   * The free camera of the frame: every scene's camera as a free pose (an orbiting one through stage.js orbitPose),
   * mixed by weight; the lens's other fields (near, fog, bokeh, damping, orbit, parallax) from the heaviest free scene.
   * @param {{ o: any, w: number }[]} cams @param {number} cw @param {number} vw @param {number} vh
   */
  function freeBlend(cams, cw, vw, vh) {
    const D0 = Math.min(2600, Math.max(1100, ((mod && mod.LOOK && mod.LOOK.eye) || 1.25) * Math.hypot(vw, vh)));
    const n = cw > 1e-4 ? 1 / cw : 0;
    const pos = [0, 0, 0], target = [0, 0, 0], pivot = [0, 0, 0];
    let roll = 0, lens = 0, aperture = 0, focus = 0, oy = 0, op = 0, heavy = -1, pivots = 0;
    /** @type {any} */ let lead = null;
    const P = (/** @type {any} */ v, /** @type {number[]} */ d) => (Array.isArray(v) ? v : v && typeof v === "object" ? [v.x, v.y, v.z] : d);
    for (const { o, w } of cams) {
      const c = o.camera || {};
      const free = !!(c.pos || c.position);
      /** @type {any} */ let p;
      if (free) {
        const ps = P(c.pos || c.position, [vw / 2, vh / 2, D0]);
        p = { pos: ps, target: P(c.target, [ps[0], ps[1], 0]) };
        if (w > heavy) { heavy = w; lead = c; }
      } else p = mod.orbitPose({ yaw: c.yaw || 0, pitch: c.pitch || 0, dolly: c.dolly || 0 }, { w: vw, h: vh }, D0);
      const dist = Math.hypot(p.target[0] - p.pos[0], p.target[1] - p.pos[1], p.target[2] - p.pos[2]);
      for (let i = 0; i < 3; i++) { pos[i] += w * (+p.pos[i] || 0); target[i] += w * (+p.target[i] || 0); }
      // (wave 8, SMOOTH) the hand's orbit turns about the scenes' pivots mixed by weight (a scene without one: its
      // target). It was the heaviest scene's own: where two scenes trade the frame the pivot jumped, and with the
      // pointer off-centre the eye jumped with it
      const pv = free && c.orbit && c.orbit.pivot ? P(c.orbit.pivot, p.target) : p.target;
      if (free && c.orbit && c.orbit.pivot) pivots++;
      for (let i = 0; i < 3; i++) pivot[i] += w * (+pv[i] || 0);
      roll += w * (free ? +c.roll || 0 : 0);
      lens += w * (free ? c.lens ?? 1 : 1);
      aperture += w * (free ? c.aperture ?? 1 : 1);
      focus += w * (free ? c.focus ?? dist : dist - (typeof o.focus === "number" ? o.focus : 0));
      const ob = free ? c.orbit || {} : { yaw: PTR_FOLLOW * (c.pointer ?? 1), pitch: PTR_FOLLOW * 0.6 * (c.pointer ?? 1) };
      oy += w * (+ob.yaw || 0); op += w * (+ob.pitch || 0);
    }
    const L = lead || {};
    /** @type {any} */ const out = {
      pos: pos.map((v) => r2(v * n)), target: target.map((v) => r2(v * n)), roll: r4(roll * n), lens: r4(lens * n),
      aperture: r4(aperture * n), focus: r2(focus * n),
      orbit: { yaw: r4(oy * n), pitch: r4(op * n), damp: L.orbit && L.orbit.damp, pivot: pivots ? pivot.map((v) => r2(v * n)) : undefined },
    };
    for (const k of ["near", "nearFull", "fog", "bokeh", "damp", "parallax", "plateFocus", "snap"]) if (L[k] !== undefined) out[k] = L[k];
    return out;
  }

  /** the extra passes of the frame: { id: { ...cfg, weight } } (weight 0..1, rounded so a settled blend stops changing)
   *  @param {Record<string, { cfg: any, top: number, sum: number }>} pw */
  function passesOf(pw) {
    /** @type {Record<string, any>} */ const out = {};
    for (const id of Object.keys(pw)) { const w = r4(clamp(pw[id].sum, 0, 1)); if (w > 0.002) out[id] = { ...pw[id].cfg, weight: w }; }
    return out;
  }

  /** the figure's half of a scene's view (viewport px) @param {any} m @param {Rect} v @param {number} vw */
  function figOf(m, v, vw) {
    const gap = Math.max(24, vw * 0.03);
    if (m.side === "right") { const x0 = Math.min(v.x + v.w * 0.5, Math.max(v.x + v.w * 0.4, m.tx1 + gap)); return { x: x0, y: v.y, w: v.x + v.w - x0, h: v.h }; }
    if (m.side === "left") { const x1 = Math.max(v.x + v.w * 0.5, Math.min(v.x + v.w * 0.6, m.tx0 - gap)); return { x: v.x, y: v.y, w: x1 - v.x, h: v.h }; }
    // (wave 9, J2a CAPTION) a caption scene: the band above its captions, a gap over the tallest one's top (the same for
    // every step), moving with the view as the scene comes and goes
    if (m.side === "top" && m.cap) return { x: v.x, y: v.y, w: v.w, h: Math.max(v.h * 0.3, m.capT - m.capH - gap) };
    if (m.side === "top") return { x: v.x, y: v.y, w: v.w, h: v.h * 0.55 };
    return v;
  }

  /** the cue of a scene: its focused element, its hovered one while on screen, or on touch the one nearest the
   *  middle of the screen @param {any} m @param {number} y @param {number} vh @param {boolean} touch */
  function cueOf(m, y, vh, touch) {
    if (!m.cues.length) return null;
    for (const el of [cueEl.focus, cueEl.hover]) {
      if (!el) continue;
      const c = m.cues.find((/** @type {any} */ c) => c.el === el);
      if (!c) continue;
      const r = vat(c.r, y);
      if (el === cueEl.focus || (r && r.y + r.h > 0 && r.y < vh)) return c.id;
    }
    if (!touch) return null;
    let best = null, bd = vh * 0.22;
    for (const c of m.cues) {
      const r = vat(c.r, y);
      if (!r) continue;
      const d = Math.abs(r.y + r.h / 2 - vh * 0.5);
      if (d < bd) { bd = d; best = c.id; }
    }
    return best;
  }

  /** (wave 2, ARRIVE) a signal for the 2D layer, after this tick (never inside the stage's frame): fx:stage:frame (the
   *  stage's first frame on this page), fx:stage:lit (the subject is lit); late listeners read html.stage-on / stage-lit
   *  @param {string} name @param {any} detail */
  function signal(name, detail) {
    const t = performance.now();
    if (name === "fx:stage:frame") SIG.frameAt = t, SIG.res.frame();
    if (name === "fx:stage:lit") SIG.litAt = t, SIG.res.lit();
    queueMicrotask(() => { try { if (typeof FX.emit === "function") FX.emit(name, { ...detail, t }); else window.dispatchEvent(new CustomEvent(name, { detail: { ...detail, t } })); } catch (e) { /* a listener threw */ } });
  }

  /* ================================================================ the instrument line and stage-on */
  const nb = (/** @type {string} */ s) => s.replace(/ /g, " ");   // a token never breaks across two lines
  /** FX.t, or "" when the string is missing @param {string} id @param {any} v */
  const tr = (id, v) => { try { const s = FX.t(id, v); return s && s !== id ? s : ""; } catch (e) { return ""; } };
  const num = (/** @type {number} */ v, /** @type {number} */ d) => { try { return FX.num(v, d); } catch (e) { return v.toFixed(d || 0); } };
  function writeInstr() {
    if (!stage || !instrEls.length) return;
    const s = stage.stats();
    const pts = tr("stage.points", { n: num(s.drawn, 0) });
    if (!pts) return;
    const bits = [nb(pts)];
    // the GPU time with two decimals under 1 ms: a light frame would read "0.0 ms"
    if (typeof s.gpuMs === "number") { const g = tr("instr.gpu", { ms: num(s.gpuMs, s.gpuMs < 1 ? 2 : 1) }); if (g) bits.push(nb(g)); }
    const text = bits.join(" · ");
    if (text === instrText) return;
    instrText = text;
    for (const el of instrEls) el.textContent = text;
  }

  /* ================================================================ life cycle */
  /** the stage goes away: canvas, class, instrument; for good (dead) unless a replaced device may bring it back
   *  @param {string} why @param {boolean} [forGood] */
  function teardown(why, forGood = true) {
    gen++;
    log("[stage] off: " + why);
    try { if (stage) stage.destroy(); } catch (e) { /* the device may be gone */ }
    stage = null; on = false; building = false; glassT = -1; glassLate = false; drawnT = -1;
    registered.clear(); texReady.clear(); texPending.clear(); TEXFROM.clear(); revivedAt.clear(); later.clear(); idleAsked = false;
    for (const S of scenes) { S.texAsked = false; S.state = {}; }
    BD.key = ""; BD.timers.forEach((t) => clearTimeout(t));
    D.classList.remove("stage-on");
    if (document.body) document.body.style.removeProperty("touch-action");
    drag.id = -1; drag.on = false; drag.nx = 0; spd = 0;
    instrText = "";
    for (const el of instrEls) el.textContent = "";
    if (canvas) canvas.style.visibility = "hidden";
    if (forGood) {
      dead = true;
      // the stage will not draw on this page: what waited for it shows as printed (the cover's name, css/page-cover.css)
      D.classList.add("stage-dead");
      SIG.expected = false; SIG.res.frame(); SIG.res.lit();   // nobody waits for a stage that will not draw
      /* (wave 2, ARRIVE) and the scenes return to the printed page: posters shown, steps as plain flow (the same rules
         as without WebGPU, html.gl-off); the scroll's triggers are measured again on the new layout. Not when the page
         is leaving (pagehide): its last picture stays as it was. */
      if (why !== "pagehide" && D.classList.contains("sc-on")) {
        D.classList.add("gl-off");
        // every step's text in (in scene mode only the step in focus had it; out of scene mode nobody hands it over)
        for (const el of document.querySelectorAll(".sc-step[data-stage-step]")) {
          try { if (!el.classList.contains("st-on") && FX.mo && FX.mo.live && typeof FX.mo.step === "function") FX.mo.step(el, true); } catch (e) { /* the motion layer's own */ }
          el.classList.add("st-on");
        }
        try { requestAnimationFrame(() => { try { if (ST && typeof ST.refresh === "function") ST.refresh(); } catch (e) { /* no triggers */ } }); } catch (e) { /* no rAF */ }
      }
      const d = device; device = null;   // the stage's own device: nobody else draws on it
      try { if (d) d.destroy(); } catch (e) { /* already lost */ }
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      canvas = null;
      stopTicking();
    }
  }
  /** silently: the printed page stays @param {string} why */
  function off(why) { if (!dead) teardown(why, true); }

  function startTicking() {
    if (ticking) return;
    ticking = true;
    if (G && G.ticker) G.ticker.add(safeTick);
    else { const loop = () => { if (!ticking) return; rafId = requestAnimationFrame(loop); safeTick(); }; rafId = requestAnimationFrame(loop); }
  }
  /** a tick that throws turns the stage off (the printed page stays), never a dead loop or a console flood */
  function safeTick() { try { tick(); } catch (e) { off("tick threw: " + (e && /** @type {any} */ (e).message || e)); } }
  function stopTicking() {
    if (!ticking) return;
    ticking = false;
    if (G && G.ticker) G.ticker.remove(safeTick); else cancelAnimationFrame(rafId);
  }

  /* ================================================================ the stage's own device
     BOOT: the head script already asked for the adapter and imported stage/boot.js, which made the device and started
     every pipeline while the page loaded (window.__rvStage, used once: {device, info, kit, early}). Without it (an old
     head, a rebuild after a lost device) the request is made here and createStage compiles its own. build() itself
     runs once the page is still (fx:ready + whenStill): measuring and the first frame never happen under a cut. A
     missing or software (fallback) adapter is "no WebGPU": the printed page stays. */
  let tier = "A", inkK = 1;
  const chooseTier = (/** @type {any} */ tiers, /** @type {any} */ info) => tiers.chooseTier({ touch: !!(FX.flags && FX.flags.touch), width: innerWidth, vendor: info.vendor, deviceMemory: /** @type {any} */ (navigator).deviceMemory, forced: Q.get("tier") });
  /** @returns {Promise<{ dev: GPUDevice, kit: any } | null>} */
  async function requestDevice() {
    const b = /** @type {any} */ (window).__rvStage;
    if (b && b.p && !b.used) {
      b.used = true;
      /** @type {any} */ let r = null;
      try { r = await b.p; } catch (e) { r = null; }
      if (r && !r.device) { log("[stage] fallback (software) adapter: off"); return null; }
      if (r && r.device) {
        if (r.early && r.early.error) { try { r.device.destroy(); } catch (e) { /* ignore */ } log("[stage] early GPU error: " + r.early.error); return null; }
        tier = chooseTier(await import(BASE + "tier.js"), r.info);
        const dev = /** @type {GPUDevice} */ (r.device);
        dev.addEventListener("uncapturederror", (/** @type {any} */ e) => { if (e && e.preventDefault) e.preventDefault(); if (device === dev) off("uncaptured GPU error: " + (e && e.error && e.error.message)); });
        log(`[stage] device from the head's boot (${Math.round(r.t)} ms)`);
        return { dev, kit: r.kit };
      }
    }
    const [gpu, tiers] = await Promise.all([import(BASE + "gpu.js"), import(BASE + "tier.js")]);
    /** @type {GPUAdapter | null} */ let adapter = null;
    const k = /** @type {any} */ (window).__rvGpu;
    if (k && k.p && !k.used) { k.used = true; try { adapter = await k.p; } catch (e) { adapter = null; } }
    if (!adapter) { const r = await gpu.requestAdapter(); adapter = r.adapter; if (!adapter) { log("[stage] no adapter: " + r.reason); return null; } }
    const info = gpu.describeAdapter(adapter);
    if (info.isFallbackAdapter) { log("[stage] fallback (software) adapter: off"); return null; }
    tier = chooseTier(tiers, info);
    const { device: dev } = await gpu.createDevice(adapter, { label: "stage" });
    // an error no scope caught turns the stage off silently (the printed page stays), never a console flood
    dev.addEventListener("uncapturederror", (/** @type {any} */ e) => { if (e && e.preventDefault) e.preventDefault(); if (device === dev) off("uncaptured GPU error: " + (e && e.error && e.error.message)); });
    return { dev, kit: null };
  }
  let rebuilt = false;   // a lost device rebuilds the stage once; a second loss leaves the printed page

  function makeCanvas() {
    const c = document.createElement("canvas");
    c.className = "fx-stage";
    c.setAttribute("aria-hidden", "true");
    c.setAttribute("tabindex", "-1");
    // (round 12) the cover's hall is lit from its first frame: its canvas comes up in 250 ms; (wave 1, FIX3D) every
    // page now stands in the same lit room and opens on it the same way (it was 700 ms of dark before the room)
    const inMs = 250;
    /* (wave 9, J3 VIEWPORT) the height: never less than the layout viewport (100%, the box a fixed element is laid out
       in), and on a phone the large viewport (100lvh: Safari's bar retracted). On an iPhone the layout viewport grows and
       shrinks as the bar hides and shows while 100lvh is fixed (CSS Values 4: "fixed (and therefore stable) unless the
       viewport itself is resized"), so the canvas keeps one box and one backing; at 100% it followed the bar and the
       picture, projected into the small viewport, was stretched over it. Where the two are one (a desktop, Chrome) the
       box is what it was; a browser without lvh keeps the 100% before it */
    c.style.cssText = `position:fixed;left:0;top:0;width:100%;height:100%;height:max(100%,100lvh);pointer-events:none;z-index:var(--z-stage,50);display:block;opacity:0;transition:opacity ${inMs}ms var(--ease-out,ease-out);`;
    document.body.appendChild(c);
    return c;
  }

  /** the stage's colours: day ground and ink (cobalt) at dawn, the night ground and its light */
  function tokens() {
    const cs = getComputedStyle(D);
    const v = (/** @type {string} */ n) => cs.getPropertyValue(n).trim();
    const hex = (/** @type {string} */ s, /** @type {string} */ d) => (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(s) ? s : d);
    const cobalt = v("--cobalt");
    return {
      paper: hex(v("--dawn"), "#f3f4f6"),
      ink: hex(v("--dawn-ink"), "#0c0e14"),
      accent: hex(cobalt, "#2340c9"),
      night: hex(v("--night"), "#0c0e14"),
      nightAccent: cobalt ? hex(v("--accent"), "#8fa2ff") : "#8fa2ff",
    };
  }

  /** one scene's module (null when missing or failing) @param {string} name */
  async function importScene(name) {
    try {
      const m = await import(BASE + "scenes/" + name + ".js");
      return m && m.default && typeof m.default === "object" ? m.default : null;
    } catch (e) { log(`[stage] scene "${name}" not loaded: ${e && /** @type {any} */ (e).message || e}`); return null; }
  }

  /** import the scenes of this page (a missing or failing one is skipped).
   *  (wave 7, STAGE) aimY (a cold load): only the scenes within AHEAD screens of the place the reader stands are imported
   *  before the first frame, when every one of them comes before every other in the page (a load at the top of the
   *  home: its nine scenes' modules evaluated together held the first frame ~0.06 s later than the cover's); the others
   *  stay `lazy` (def null, not ready) and the pump imports them, in page order, once the stage is on
   *  @param {number} [aimY] */
  async function loadScenes(aimY) {
    const els = sceneEls();
    /** @type {boolean[] | null} */ let near = null;
    if (typeof aimY === "number" && els.length > 3) {
      const vh = innerHeight, sy = window.scrollY;
      near = els.map(({ el }) => { const r = el.getBoundingClientRect(), top = r.top + sy; return top < aimY + vh * (1 + AHEAD.down) && top + r.height > aimY - vh * AHEAD.up; });
      const firstFar = near.indexOf(false), lastNear = near.lastIndexOf(true);
      if (firstFar < 0 || lastNear < 0 || firstFar < lastNear) near = null;   // all near, none near, or a far one above a near one
    }
    const mods = await Promise.all(els.map(({ name }, k) => (near && !near[k] ? Promise.resolve(null) : importScene(name))));
    /** @type {Scene[]} */ const out = [];
    els.forEach((s, k) => {
      if (near && !near[k]) out.push({ name: s.name, el: s.el, def: null, ids: {}, state: {}, w: 0, broken: false, texAsked: false, k, ready: false, lazy: true });
      else if (mods[k]) out.push({ name: s.name, el: s.el, def: mods[k], ids: {}, state: {}, w: 0, broken: false, texAsked: false, k });
    });
    return out;
  }

  /** (wave 7, STAGE) the lazy scenes' modules, one at a time in page order (small tasks after the first frame), then
   *  their formations' orders after the scenes before them, as if all had been registered together; false when the
   *  stage went away meanwhile @param {number} g */
  async function loadLazy(g) {
    const lazy = scenes.filter((S) => S.lazy && !S.def && !S.broken);
    if (!lazy.length) return true;
    for (const S of lazy) {
      S.def = await importScene(S.name);
      if (g !== gen || dead) return false;
      if (!S.def) { S.broken = true; later.delete(S); }
    }
    let order = 0;
    for (const S of scenes) {
      if (!S.def) continue;
      const fs = S.def.formations || {};
      for (const id of Object.keys(fs)) { const gid = S.name + ":" + id; S.ids[id] = gid; if (fs[id]) { if (!orderOf.has(gid)) orderOf.set(gid, order); order++; } }
    }
    log(`[stage] ahead: ${lazy.length} scene modules in`);
    return true;
  }

  /* (wave 7, STAGE) SCENES PREPARED AHEAD OF THE READER. The home holds every page's scenes (eight today): registering
     all their formations before the first frame put it ~0.14 s later on a cold load (and a flight into the home would
     have prepared all nine behind the door). Now the build registers only the scenes within AHEAD screens of the place
     the reader stands (the first screen's room stands as on a page of its own); the others wait in `later`, and a pump
     registers them one formation per task: at once those the reader comes near (the tick asks), the rest once the page
     is quiet. A scene runs its frame only once its formations are in (S.ready). Every formation keeps the order it has
     in the page (orderOf), as if all had been registered together: neighbours draw from opposite ends of the
     population. Once in, a formation stays for the page (memory is flat over the scroll down and back up). */
  const AHEAD = { up: 1.5, down: 3 };
  /** @type {Map<string, number>} */ const orderOf = new Map();
  /** @type {Set<Scene>} */ const later = new Set();
  let pumping = false, idleAsked = false;
  /* (k-fix3d) a cold load's first frame registers only the scenes of the first screen and half a screen round it (the
     home's hero alone, not Now's forty thousand targets or the gallery's mist): the pump brings the rest right after */
  const FIRST = { up: 0.5, down: 0.5 };
  /** the scenes within AHEAD screens of y (document px): the ones a first frame at y needs @param {number} y
   *  @param {{ up: number, down: number }} [w] */
  function nearAt(y, w = AHEAD) {
    /** @type {Set<Scene>} */ const out = new Set();
    if (!M) return new Set(scenes);
    const vh = M.ch;
    scenes.forEach((S, k) => {
      const m = M.scenes[k], sec = m ? at(m.r, y) : null;
      if (!sec || (sec.y < y + vh * (1 + w.down) && sec.y + sec.h > y - vh * w.up)) out.add(S);
    });
    return out;
  }

  /** the scenes' formations, registered in page order, and their init; false when the stage went away meanwhile.
   *  want: the scenes to register now (null: all); the others wait for the pump (later)
   *  @param {GPUDevice} dev @param {number} g @param {Map<string, any> | null} [staged] @param {Set<Scene> | null} [want] */
  async function registerScenes(dev, g, staged, want) {
      const TC = mod.TIER_COUNTS || { A: 160000 };
      inkK = (TC.A || 160000) / (TC[tier] || TC.A || 160000);
      registered.clear(); later.clear(); orderOf.clear();
      let order = 0;
      for (const S of scenes) {
        S.ids = {};
        const fs = (S.def && S.def.formations) || {};   // a lazy scene's module is not in yet (loadLazy)
        for (const id of Object.keys(fs)) { const gid = S.name + ":" + id; S.ids[id] = gid; if (fs[id]) orderOf.set(gid, order++); }
      }
      for (const S of scenes) {
        if (!S.def || (want && !want.has(S))) { S.ready = false; later.add(S); continue; }
        if (!(await registerScene(S, dev, g, staged || null, false))) return false;
      }
    return true;
  }

  /** one scene's formations and its init; false when the stage went away meanwhile. slow: a task of its own for each
   *  formation (the pump, after the first frame: no long task) @param {Scene} S @param {GPUDevice} dev @param {number} g
   *  @param {Map<string, any> | null} staged @param {boolean} slow */
  async function registerScene(S, dev, g, staged, slow) {
        const fs = S.def.formations || {};
        for (const id of Object.keys(fs)) {
          const gid = S.ids[id], def = fs[id];
          if (!def || registered.has(gid)) continue;
          const order = orderOf.get(gid) ?? 0;
          // (lane m-fly) prepared ahead (stageScenes): registered at once, nothing awaited (the takeover is one task)
          const pre = staged ? staged.get(gid) : null;
          if (pre) {
            if (pre.failed) continue;
            try { const r = stage.register(gid, { ...def, order }, pre); if (r && typeof r.catch === "function") r.catch(() => {}); registered.add(gid); }
            catch (e) { log(`[stage] formation "${gid}" failed: ${e && /** @type {any} */ (e).message || e}`); }
            continue;
          }
          if (slow) { await new Promise((r) => setTimeout(r, 0)); if (g !== gen || dead || !stage) return false; }
          dev.pushErrorScope("validation"); dev.pushErrorScope("out-of-memory");
          /** @type {any} */ let e1 = null;
          try { await stage.register(gid, { ...def, order }); } catch (e) { e1 = e; }
          const sc = await Promise.all([dev.popErrorScope(), dev.popErrorScope()]);
          if (g !== gen || dead) return false;
          if (e1 || sc.some(Boolean)) { log(`[stage] formation "${gid}" failed: ${(e1 && e1.message) || (/** @type {any} */ (sc.find(Boolean)) || {}).message}`); continue; }
          registered.add(gid);
        }
        if (typeof S.def.init === "function") {
          try { await S.def.init({ tier, phone: innerWidth < 760, etch: (/** @type {string} */ id, /** @type {string[]} */ l, /** @type {any} */ o) => etch(S.name + ":" + id, l, o), texture: (/** @type {string} */ id, /** @type {any} */ src) => addTex(S.name + ":" + id, src) }); }
          catch (e) { log(`[stage] scene "${S.name}" init threw: ${e && /** @type {any} */ (e).message || e}`); }
        }
        S.ready = true; later.delete(S);
        return true;
  }

  /** the pump: the scenes still waiting, nearest the reader first, a formation per task @param {number} g */
  async function pump(g) {
    if (pumping || !later.size || !stage || !device) return;
    pumping = true;
    try {
      // (wave 7, STAGE) the lazy scenes' modules first (page order), so every formation's order is known
      if (!(await loadLazy(g))) return;
      while (later.size && g === gen && !dead && stage && device) {
        const y = window.scrollY, vh = M ? M.ch : innerHeight;
        let best = null, bd = Infinity;
        scenes.forEach((S, k) => {
          if (!later.has(S)) return;
          const m = M && M.scenes[k], sec = m ? at(m.r, y) : null;
          const d = sec ? Math.max(0, sec.y - (y + vh), y - (sec.y + sec.h)) : 0;
          if (d < bd) { bd = d; best = S; }
        });
        if (!best) break;
        const t0 = performance.now();
        if (!(await registerScene(best, device, g, null, true))) break;
        log(`[stage] ahead: "${best.name}" in (${(performance.now() - t0).toFixed(0)} ms), ${later.size} to go`);
        await new Promise((r) => setTimeout(r, 0));
      }
    } catch (e) { log("[stage] pump: " + (e && /** @type {any} */ (e).message || e)); }
    finally { pumping = false; }
  }
  /** the rest, once the page is quiet (after the first frame): an idle callback, else a timeout */
  function pumpIdle() {
    if (idleAsked || !later.size) return;
    idleAsked = true;
    const g = gen, go = () => { if (g === gen && !dead) pump(g); };
    const ric = /** @type {any} */ (window).requestIdleCallback;
    setTimeout(() => { if (typeof ric === "function") ric(go, { timeout: 2500 }); else go(); }, 1200);
  }

  /** (lane m-fly) every formation of this page prepared on the kept stage (targets and bodies; nothing registered, the
   *  room on stage untouched), each in a task of its own: gid -> { set, body } | { failed: true }
   *  (wave 7, STAGE) want: only the scenes the first screen needs (nearAt); the home's others come ahead of the reader
   *  @param {any} s @param {GPUDevice} dev @param {number} g @param {Set<Scene> | null} [want] */
  async function stageScenes(s, dev, g, want) {
    /** @type {Map<string, any>} */ const out = new Map();
    for (const S of scenes) {
      if (want && !want.has(S)) continue;
      const fs = S.def.formations || {};
      for (const id of Object.keys(fs)) {
        const def = fs[id];
        if (!def) continue;
        dev.pushErrorScope("validation"); dev.pushErrorScope("out-of-memory");
        /** @type {any} */ let pre = null, e1 = null;
        try { pre = await s.prepare(def); } catch (e) { e1 = e; }
        const sc = await Promise.all([dev.popErrorScope(), dev.popErrorScope()]);
        if (g !== gen || dead) return out;
        if (e1 || sc.some(Boolean)) { log(`[stage] formation "${S.name}:${id}" failed: ${(e1 && e1.message) || (/** @type {any} */ (sc.find(Boolean)) || {}).message}`); out.set(S.name + ":" + id, { failed: true }); }
        else out.set(S.name + ":" + id, pre);
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    return out;
  }

  /** (lane o-router) a soft navigation: the stage the page before handed over is this page's. Its formations go (stage.reset)
   *  once this page's scenes are loaded, this page's are registered, and it keeps the portal, the push, the camera
   *  and the clock as they are: the eye is still inside the glass, and comes out on fx:nav:uncovered.
   *  @param {any} K @param {number} g */
  async function adopt(K, g) {
    const dev = /** @type {GPUDevice} */ (K.device);
    device = dev; mod = K.mod; raster = K.raster; canvas = K.canvas; tier = K.tier; rebuilt = !!K.rebuilt;
    if (!lookWant && K.lookWant) lookWant = K.lookWant;
    dev.addEventListener("uncapturederror", (/** @type {any} */ e) => { if (e && e.preventDefault) e.preventDefault(); if (device === dev) off("uncaptured GPU error: " + (e && e.error && e.error.message)); });
    dev.lost.then((info) => { if (device !== dev || dead) return; off("device lost (" + info.reason + ")"); });
    try {
      scenes = await loadScenes();
      if (g !== gen || dead) return;
      if (!scenes.length) throw new Error("no scene loaded");
      const s = K.stage;
      /* (lane n-fix-flight) a scene may have work to do before its first frame (prepare: the cover builds its name, 90 ms
         of main thread, in slices between frames): it starts now, the eye still on its way to the door, and the room
         waits for it below (at most 0.4 s) */
      const prep = ARR_FLY ? Promise.all(scenes.map((S) => { try { return typeof (/** @type {any} */ (S.def)).prepare === "function" ? (/** @type {any} */ (S.def)).prepare({ vw: D.clientWidth, vh: D.clientHeight, phone: innerWidth < 760, tier }) : null; } catch (e) { return null; } })).catch(() => null) : null;
      /* (lane m-fly) AHEAD OF THE DOOR (see SHADOW above). The page changed while the eye was still in the room it left;
         that room stands, drawn by the router's bridge, until the door of glass hides the whole frame. Meanwhile, each
         in a task of its own: the layout measured, every formation prepared, the scenes' first frame run undrawn (the
         etched words, the display type), the first screen's captures decoded and uploaded one a frame. core: the
         page can stand (formations, a scene's own prepare, the first frame); full: its captures and its type are in */
      const fs0 = s.flyState;
      const flown = ARR_FLY && !!fs0 && (fs0.phase === "out" || fs0.phase === "hold") && typeof s.prepare === "function";
      /** @type {Map<string, any> | null} */ let staged = null;
      let core = false, full = false;
      /* (wave 7, STAGE) where the reader will stand: Back / Forward land where the reader was (the router hands the y
         to fx-core.js, which restores it after its build phase, later than this); else the scroll as it is */
      const yAim = typeof (/** @type {any} */ (window)).__rvSoftY === "number" ? (/** @type {any} */ (window)).__rvSoftY : window.scrollY;
      /** @type {Set<Scene> | null} */ let want = null;
      if (flown) {
        shadow = s;
        const t0 = performance.now();
        (async () => {
          try {
            measure();
            want = nearAt(yAim);
            for (const S of scenes) if (!want.has(S)) S.ready = false;   // the priming frame runs only the scenes it stages
            await new Promise((r) => setTimeout(r, 0));
            const m = await stageScenes(s, dev, g, want);
            // room for this page's targets before the takeover (a buffer that grows there is awaited, frame by frame)
            try {
              let need = 0;
              for (const S of scenes) { const fs = S.def.formations || {}; for (const id of Object.keys(fs)) { const p = m.get(S.name + ":" + id), d = fs[id]; if (p && p.set && p.set.data) need += Math.max(p.set.data.length / 4, (d && d.capacity) || 0); } }
              if (need && typeof s.reserve === "function") await s.reserve(need);
            } catch (e) { /* the takeover grows it */ }
            if (prep) await Promise.race([prep, new Promise((r) => setTimeout(r, 400))]);
            if (g !== gen || dead || stage) return;
            staged = m;
            priming = true; try { tick(); } catch (e) { /* the first real tick reports it */ } priming = false; lastT = 0;
            core = true;
            log(`[stage] ahead: core in ${(performance.now() - t0).toFixed(0)} ms`);
            while ((texPending.size > HELD.tex.length || BD.busy || BD.next) && performance.now() - t0 < 2400 && g === gen && !dead && !stage) await new Promise((r) => setTimeout(r, 8));
            full = true;
            log(`[stage] ahead: full in ${(performance.now() - t0).toFixed(0)} ms`);
          } catch (e) { log("[stage] ahead failed: " + (e && /** @type {any} */ (e).message || e)); core = true; full = true; }
        })();
        await new Promise((res) => {
          let inAt = 0;
          const poll = () => {
            if (g !== gen || dead) { res(null); return; }
            const f = s.flyState, now = performance.now();
            if (!f || !f.phase || f.phase === "in") { res(null); return; }
            // the frame is hidden: by the door's glass (forward), at the leaving's end (Back keeps its film; no door)
            const hid = f.door && f.dir > 0 ? f.cover : f.phase !== "out";
            if (hid) {
              if (!inAt && (!f.door || f.d <= 0)) inAt = now;
              if (core && (full || (inAt && now - inAt > HOLD_MS))) { res(null); return; }
            }
            if (now - t0 > 2600) { res(null); return; }
            setTimeout(poll, 4);
          };
          poll();
        });
        if (g !== gen || dead) return;
        log(`[stage] takeover ${(performance.now() - t0).toFixed(0)} ms after the host came up (core ${core}, full ${full})`);
      } else if (ARR_FLY && fs0 && fs0.phase === "out") {
        await new Promise((res) => {
          const t0 = performance.now();
          const poll = () => { const f = s.flyState; if (!f || f.phase !== "out" || performance.now() - t0 > 400 || g !== gen || dead) res(null); else setTimeout(poll, 8); };
          poll();
        });
        if (g !== gen || dead) return;
      }
      /* THE TAKEOVER: from here to startTicking() nothing waits when the page was prepared (one task) */
      s.reset();
      stage = s; shadow = null;
      if (lookWant && typeof s.look === "function") s.look(lookWant);
      if (!want) { measure(); want = nearAt(yAim); }
      if (!(await registerScenes(dev, g, flown && core ? staged : null, want))) return;
      for (const k of Object.keys(W)) delete W[k];
      for (const S of scenes) S.w = 0;
      if (flown && M) {
        // what was held for this moment: the display type, the layers the room before still showed, the ground it stood on
        if (HELD.bd) { try { s.setBackdrop(HELD.bd.canvas, HELD.bd.rect); } catch (e) { /* the next raster sets it */ } HELD.bd = null; }
        for (const fn of HELD.tex.splice(0)) { try { fn(); } catch (e) { /* that texture comes with its scene's next frame */ } }
        dropGround();
        if (ground() === "dawn" && !(ARR && ARR.day === 2)) dayAt = performance.now();
      } else {
        measure();
        /* (lane n-flight) the captures the first screen's plates hold are in the glass BEFORE the eye goes on (a page
           whose flight could not be prepared ahead): at most 0.3 s; the bridge draws meanwhile */
        if (ARR_FLY && M) {
          const y0 = window.scrollY, vh0 = M.ch, jobs = [];
          scenes.forEach((S, k) => {
            const m = M.scenes[k], sec = m ? at(m.r, y0) : null;
            if (!sec || !(sec.y < y0 + vh0 * 1.1 && sec.y + sec.h > y0 - vh0 * 0.1) || S.texAsked) return;
            S.texAsked = true;
            for (const im of m.imgs) jobs.push(loadTex(im.id, im.el));
          });
          if (jobs.length) {
            await Promise.race([Promise.all(jobs), new Promise((r) => setTimeout(r, 300))]);
            try { if (dev.queue.onSubmittedWorkDone) await Promise.race([dev.queue.onSubmittedWorkDone(), new Promise((r) => setTimeout(r, 200))]); } catch (e) { /* go on */ }
          }
          if (g !== gen || dead) return;
        }
      }
      lastT = 0; lastY = window.scrollY;
      building = false;
      if (ARR_FLY && !flown) {
        if (prep) { await Promise.race([prep, new Promise((r) => setTimeout(r, 400))]); if (g !== gen || dead) return; }
        priming = true; try { tick(); } catch (e) { /* the first real tick reports it */ } priming = false; lastT = 0;
        const t0 = performance.now();
        while ((BD.busy || BD.next) && performance.now() - t0 < 250) await new Promise((r) => setTimeout(r, 12));
        if (g !== gen || dead) return;
      }
      if (K.bridge) K.bridge.stop();
      if (canvas) { canvas.style.transition = "none"; canvas.style.opacity = "1"; canvas.style.visibility = ""; }
      /* (lane o-fix) an adopted stage with no portal arrival (a plain swap, or a flight whose arrival was lost) must not
         keep the eye inside the glass: it comes out (an arrival's comeOut does it on fx:nav:uncovered) */
      if (!ARR_PORTAL && typeof s.portal === "function") {
        const ps = s.portalState;
        if (ps && (ps.p > 0 || ps.to > 0)) { s.cut && s.cut(false); s.portal(0, { ms: PORTAL_IN_MS }); }
      }
      /* (lane n-flight) the scenes' first frame is the costly one (the gallery rasters its etched words, every scene
         builds its state): it runs here, undrawn, while the last picture is still the door's light; the fly-in then
         starts on a frame that costs what any other does */
      /* (lane n-flight) the flight goes on into this room: the eye a stretch behind the opening pose, slowing into it;
         a kept stage still in a flight with no flight arrival (a plain swap) stands where the scenes put it */
      if (typeof s.fly === "function") {
        // (lane n-fix-flight) into the morning too: the glass falls away over the paper (its light is paper there)
        if (ARR_FLY) s.fly("in", { ms: flyMs().in, back: !!(ARR && ARR.back) && ground() !== "dawn" });
        else if (s.flyState && s.flyState.phase) s.fly("off");
      }
      /* a plain cut's push (a page left in the morning, a stage with no glass) ends under the arriving sheet */
      if (!ARR_PORTAL && typeof s.cut === "function") s.cut(false, null, { instant: true });
      stage.input();
      startTicking();
      pumpIdle();
      log(`[stage] adopted: tier ${tier}, scenes ${scenes.map((S) => S.name).join(", ")}, formations ${[...registered].join(", ")}${later.size ? `, ${later.size} scenes ahead` : ""}`);
    } catch (e) {
      building = false; shadow = null;
      if (K.bridge) K.bridge.stop();
      dropGround();
      off("adopt failed: " + (e && /** @type {any} */ (e).message || e));
    }
  }

  /** (lane o-router) the page leaves under the router and the stage stays: this host lets go of it without destroying
   *  it (every closure of this page goes inert: dead) and returns what the next page's host takes. Nothing to hand over
   *  (no stage, still building): the stage of this page is destroyed as on a pagehide. */
  function handOver() {
    if (dead) return null;
    if (!stage || building || !device || !canvas) { off("pagehide"); return null; }
    stopTicking();
    const K = { stage, device, mod, raster, canvas, tier, lookWant, rebuilt, bridge: null, texSrc: TEXSRC };
    gen++; dead = true; stage = null; device = null; canvas = null; on = false;
    BD.timers.forEach((t) => clearTimeout(t));
    return K;
  }
  /** a kept stage this page cannot use (the 404, ?stage=0, no scene): it goes for good @param {any} K */
  function dropKeep(K) {
    try { if (K.bridge) K.bridge.stop(); } catch (e) { /* ignore */ }
    try { K.stage.destroy(); } catch (e) { /* ignore */ }
    try { K.device.destroy(); } catch (e) { /* ignore */ }
    try { if (K.canvas && K.canvas.parentNode) K.canvas.parentNode.removeChild(K.canvas); } catch (e) { /* ignore */ }
    D.classList.remove("stage-on");
  }

  /** build (or rebuild on a replaced device) the stage and register the scenes' formations in page order */
  async function build() {
    if (dead || building) return;
    building = true;
    const g = ++gen;
    if (KEEP) { const K = KEEP; KEEP = null; return adopt(K, g); }
    /** @type {GPUDevice | null} */ let dev = null;
    /** @type {any} */ let kit = null;
    try { const r = await requestDevice(); dev = r ? r.dev : null; kit = r ? r.kit : null; } catch (e) { dev = null; log("[stage] device request failed: " + (e && /** @type {any} */ (e).message || e)); }
    if (g !== gen || dead) { try { if (dev) dev.destroy(); } catch (e) { /* ignore */ } return; }
    if (!dev) { building = false; off("no WebGPU device"); return; }
    device = dev;
    dev.lost.then((info) => {
      if (device !== dev || dead) return;
      teardown("device lost (" + info.reason + ")", false);
      device = null;
      if (info.reason === "destroyed" || rebuilt) { off("device lost" + (rebuilt ? " twice" : "")); return; }
      rebuilt = true;
      building = false;
      build();
    });
    try {
      if (!mod) {
        // (wave 7, STAGE) a cold load imports the scenes near the reader first (loadScenes)
        const [m, r, sc] = await Promise.all([import(BASE + "stage.js"), import(BASE + "scenes/lib/raster.js").catch(() => null), loadScenes(window.scrollY)]);
        mod = m; raster = r; scenes = sc;
      }
      if (g !== gen || dead) return;
      if (!scenes.length) throw new Error("no scene loaded");
      if (!canvas) canvas = makeCanvas();
      canvas.style.visibility = "";
      dev.pushErrorScope("validation"); dev.pushErrorScope("out-of-memory");
      /** @type {any} */ let s = null, err = null;
      // the plates' pipeline may still be compiling: the swarm draws without them, and a failure later turns it off
      const onError = (/** @type {any} */ e) => { if (device === dev) off("plates: " + ((e && e.message) || e)); };
      // (wave 7, STAGE) a probe's switch, with ?debug=1 only: ?budget=<ms> sets the frame budget that halves the swarm
      // and brings it back (stage.js budget()), so the halving and the restore can be watched on a fast GPU
      const budgetMs = DEBUG && Q.has("budget") && +(Q.get("budget") || "") > 0 ? +(Q.get("budget") || "") : undefined;
      try { s = await mod.createStage({ device: dev, canvas, tier, tokens: tokens(), log, kit, onError, budgetMs }); } catch (e) { err = e; }
      const scoped = await Promise.all([dev.popErrorScope(), dev.popErrorScope()]);
      if (err || scoped.some(Boolean)) throw err || scoped.find(Boolean);
      if (g !== gen || dead) { try { s.destroy(); } catch (e) { /* ignore */ } return; }
      stage = s;
      if (lookWant && typeof s.look === "function") s.look(lookWant);   // a scene's look survives a rebuilt stage
      // (wave 7, STAGE) the scenes near the reader now; the others ahead of the reader (pump)
      measure();
      if (!(await registerScenes(dev, g, null, nearAt(window.scrollY, FIRST)))) return;
      for (const k of Object.keys(W)) delete W[k];
      for (const S of scenes) S.w = 0;
      /* (wave 2, ARRIVE) the room before the first frame: the field's pipelines (the wall, the blades, the chips) are in
         by now on most loads; wait for them a little (at most 0.5 s) so the first frame is the lit room, never an empty
         canvas that lights later. The swarm joins when its own pipelines are in (stage.js). */
      /* (k-fix3d) ... and for what the first screen's scenes build ahead in slices (the cover's name, hero.js prepare: no
         longer one task of 70 ms at the fonts' arrival), under the same cap: the first frame is the lit room with its name */
      const preps = scenes.filter((S) => S.ready === true && S.def && typeof S.def.prepare === "function").map((S) => {
        try { return S.def.prepare({ vw: D.clientWidth, vh: D.clientHeight, phone: innerWidth < 760, tier }); } catch (e) { return null; }
      });
      if (s.whenField || preps.length) {
        await Promise.race([Promise.all([s.whenField || null, ...preps]).catch(() => null), new Promise((r) => setTimeout(r, 500))]);
        if (g !== gen || dead) return;
      }
      measure();
      lastT = 0; lastY = window.scrollY;
      // (lane PORTAL) an arrival after a portal opens with the eye still in the glass: pushed in, the portal whole
      if (ARR_PORTAL && sheetUp && typeof s.portal === "function") {
        s.cut(true, null, { instant: true });
        s.portal(1, { from: 1, side: ARR.side === -1 ? -1 : 1 });
      }
      building = false;
      stage.input();
      startTicking();
      pumpIdle();
      log(`[stage] on: tier ${tier}, scenes ${scenes.map((S) => S.name).join(", ")}, formations ${[...registered].join(", ")}${later.size ? `, ${later.size} scenes ahead` : ""}`);
    } catch (e) {
      building = false;
      off("build failed: " + (e && /** @type {any} */ (e).message || e));
    }
  }

  function listen() {
    const wake = () => { if (stage) stage.input(); };
    const opt = { passive: true };
    for (const n of ["wheel", "scroll", "keydown", "touchstart", "touchmove"]) window.addEventListener(n, wake, opt);
    window.addEventListener("pointermove", (e) => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.present = true; wake(); }, opt);
    window.addEventListener("pointerdown", (e) => {
      ptr.x = e.clientX; ptr.y = e.clientY; ptr.present = true; ptr.down = true;
      if (e.pointerType === "touch" && e.isPrimary) { drag.id = e.pointerId; drag.x0 = e.clientX; drag.y0 = e.clientY; drag.on = false; }
      wake();
    }, opt);
    // the drag: it becomes the hand once it is clearly sideways (10 px, more across than down); nothing in the DOM moves
    window.addEventListener("pointermove", (e) => {
      if (e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      if (!drag.on && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) drag.on = true;
      if (drag.on) drag.nx = clamp(dx / Math.max(1, (M ? M.cw : innerWidth) * 0.5), -1, 1);
    }, opt);
    const up = (/** @type {PointerEvent} */ e) => {
      ptr.down = false; if (e.pointerType !== "mouse") ptr.present = false;
      if (e.pointerId === drag.id) { drag.id = -1; drag.on = false; drag.nx = 0; }
      wake();
    };
    window.addEventListener("pointerup", up, opt);
    window.addEventListener("pointercancel", up, opt);
    document.addEventListener("pointerleave", () => { ptr.present = false; ptr.down = false; cueEl.hover = null; }, opt);
    // the cue: a hovered (mouse, pen) or focused [data-stage-cue] (no layout read: the event's target is enough)
    document.addEventListener("pointerover", (e) => {
      if (/** @type {PointerEvent} */ (e).pointerType === "touch") return;
      const t = /** @type {Element} */ (e.target);
      cueEl.hover = t && t.closest ? t.closest("[data-stage-cue]") : null;
      wake();
    }, opt);
    document.addEventListener("focusin", (e) => { const t = /** @type {Element} */ (e.target); cueEl.focus = t && t.closest ? t.closest("[data-stage-cue]") : null; wake(); });
    document.addEventListener("focusout", () => { cueEl.focus = null; wake(); });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) { lastT = 0; wake(); } });
    // covered by a cut or by the menu: the last frame stays, nothing is submitted
    const pause = () => { paused = true; };
    const resume = () => { paused = false; lastT = 0; wake(); };
    // the cut: the camera pushes in while the sheet rises (the stage keeps drawing until the sheet covers the page)
    // (wave 2, ARRIVE) toward the leading scene's subject, seen in the ~300 ms before the sheet covers the page
    const push = (/** @type {any} */ dt) => {
      sheetUp = true;
      if (!(stage && !paused)) { pause(); return; }
      /* (lane n-flight) under the router the cut is the flight: the eye dollies through the room to the door, the stage
         keeps drawing while the page changes (it outlives it); html.cut-fly tells fx-nav.js */
      if (SOFT && typeof stage.fly === "function" && stage.glass && stage.glass.ready) {
        /* (lane m-fly) a view with the morning in it flies too (it left by the plain sheet cut): its door is the night
           standing on the paper (stage.js fly night), and it always flies forward: the film of Back is a night room's */
        const fromDay = !!(dt && dt.day) || ground() === "dawn" || viewDawn > 0.5;
        const back = !!(dt && dt.back) && !fromDay, fm = flyMs();
        stage.fly("out", { ms: fm.out, msIn: fm.in, side: dt && dt.side === -1 ? -1 : 1, back, night: fromDay });
        flyOut = true; flyFull = false; flyDawn = false; D.classList.add("cut-portal", "cut-fly");
        /* the page's display type leaves the glass with the text itself (fx-nav.js leaveText, 190 ms): the door would
           show the old title bent large in its pane long after the DOM let it go */
        BD.key = "fly"; BD.next = null; BD.timers.forEach((t) => clearTimeout(t));
        BD.timers = [window.setTimeout(() => { if (flyOut && stage && typeof stage.setBackdrop === "function") stage.setBackdrop(null, null); }, 170)];
        return;
      }
      stage.cut && stage.cut(true, subject && M ? { x: subject.x / M.cw, y: subject.y / M.ch } : null);
      // (lane PORTAL) the eye flies into a portal of glass from the clicked side; only when the glass can draw now
      // (else the plain cut: the sheet rises as before)
      if (typeof stage.portal === "function" && stage.portal(1, { ms: PORTAL_OUT_MS, side: dt && dt.side === -1 ? -1 : 1 })) {
        portalOut = true; portalFull = false; D.classList.add("cut-portal");
      }
    };
    const portalOff = () => {
      portalOut = false; portalFull = false; D.classList.remove("cut-portal", "cut-full", "cut-fly");
      if (stage && typeof stage.portal === "function") stage.portal(0, { from: 0 });
      if (flyOut && stage && typeof stage.fly === "function") stage.fly("off");
      if (flyOut) { BD.timers.forEach((t) => clearTimeout(t)); BD.key = ""; }   // a cancelled flight: the type is rastered again
      flyOut = false; flyFull = false;
    };
    const undo = () => { sheetUp = false; if (stage && stage.cut) stage.cut(false); portalOff(); resume(); };
    // (lane PORTAL) arriving: the eye comes out of the glass as the sheet leaves, once the glass can draw (a short wait)
    const comeOut = () => {
      if (!ARR_PORTAL || !stage || typeof stage.portal !== "function") return;
      const s0 = stage;
      // (lane o-router) toward Contact the glass flooded to paper (the dawn sheet): the eye is simply in the morning, the
      // sheet leaves upward as before; a plate of glass on the dawn reads as a white slab with the night in its edge
      const go = () => { if (stage !== s0 || dead) return; s0.cut(false); if (ARR && ARR.dawn) s0.portal(0, { from: 0 }); else s0.portal(0, { ms: PORTAL_IN_MS }); };
      // the glass already in (or due within PORTAL_WAIT_MS): out at once, or as soon as it is; never later than that
      if ((s0.glass && s0.glass.ready) || !PORTAL_WAIT_MS) { go(); return; }
      Promise.race([s0.whenGlass || Promise.resolve(), new Promise((r) => setTimeout(r, PORTAL_WAIT_MS))]).then(go, go);
    };
    if (typeof FX.on === "function") {
      // (lane n-flight) under the router the stage outlives the page: it never pauses for the change
      FX.on("fx:nav:covered", () => { if (!SOFT) pause(); }); FX.on("fx:nav:start", push);
      FX.on("fx:nav:uncovered", () => { sheetUp = false; resume(); comeOut(); }); FX.on("fx:nav:reset", undo);
      FX.on("fx:lock", (/** @type {any} */ e) => { if (e && e.reason === "menu") (e.locked ? pause : resume)(); });
    }
    // the page leaves for good (no bfcache): the stage is destroyed with it; a bfcache keep holds it as it is
    window.addEventListener("pagehide", (e) => { if (!e.persisted) off("pagehide"); });
    window.addEventListener("pageshow", (e) => { if (e.persisted) { sheetUp = false; if (stage && stage.cut) stage.cut(false); portalOff(); paused = false; lastT = 0; wake(); } });
    // layout: every ScrollTrigger refresh, a body that changes height (lazy pictures, fonts), the fonts themselves
    if (ST && typeof ST.addEventListener === "function") ST.addEventListener("refresh", () => { if (stage) measure(); });
    try { document.fonts.ready.then(() => { if (stage) measure(); }); document.fonts.addEventListener("loadingdone", () => { if (stage) measure(); }); } catch (e) { /* no font loading API */ }
    let roT = 0, lastH = 0;
    if ("ResizeObserver" in window) new ResizeObserver(() => {
      const h = document.body.scrollHeight;
      if (Math.abs(h - lastH) < 2) return;
      lastH = h; clearTimeout(roT);
      roT = window.setTimeout(() => { if (stage) measure(); }, 160);
    }).observe(document.body);
    // a scene's own text track can change height inside a sticky section whose min-height keeps the body still
    // (WORK lane: measured rows went stale on stage-on); watch the tracks and the dawn close too
    if ("ResizeObserver" in window) {
      const ro2 = new ResizeObserver(() => { clearTimeout(roT); roT = window.setTimeout(() => { if (stage) measure(); }, 160); });
      document.querySelectorAll(".sc-track, [data-dawn]").forEach((el) => ro2.observe(el));
    }
    // (wave 9, J3 VIEWPORT) a resize measures only a layout that moved (layoutMoved): never an iPhone's bar alone
    window.addEventListener("resize", onViewport, opt);
  }

  /** start once the page is ready and still; (wave 2, ARRIVE) an arrival by a cut starts at once, under its sheet, so
   *  the room is lit when the sheet leaves (the layout under the sheet is the page's own; a later change is measured
   *  again by the observers below) */
  function whenReady(/** @type {() => void} */ fn) {
    if (ARRIVED && D.hasAttribute("data-arrive")) { fn(); return; }
    /* (k-fix3d) a cold load that nothing has moved yet (no scroll in the last 120 ms, no cover, no lock, Lenis at rest:
       fx-core.js isStill's own rule) starts at fx:ready itself: whenStill's two quiet ticks of the ticker were 35 to 45
       ms between fx:ready and the stage taking its device, on the home's first frame. Anything else waits as before */
    let scrolled = -1e9;
    addEventListener("scroll", () => { scrolled = performance.now(); }, { passive: true });
    const quiet = () => performance.now() - scrolled >= 120 && !D.hasAttribute("data-arrive") && !D.hasAttribute("data-fx-locked")
      && !(FX.lenis && /** @type {any} */ (FX.lenis).isScrolling === "smooth");
    const still = () => { if (!ARRIVED && quiet()) fn(); else if (typeof FX.whenStill === "function") FX.whenStill(fn, { timeout: 6000 }); else fn(); };
    if (typeof FX.once === "function") FX.once("fx:ready", still); else if (document.readyState === "complete") still(); else window.addEventListener("load", still, { once: true });
  }

  FX.register("stage", {
    /** @param {any} ctx */
    init(ctx) {
      if (!allowed()) { if (KEEP) { dropKeep(KEEP); KEEP = null; } SIG.expected = false; SIG.res.frame(); SIG.res.lit(); SIGX.res.settle(); SIGX.res.stood(); return; }
      G = ctx && ctx.gsap; ST = ctx && ctx.ScrollTrigger;
      instrEls = /** @type {HTMLElement[]} */ (Array.from(document.querySelectorAll("[data-stage-instr]")));
      if (DEBUG) /** @type {any} */ (window).__stageHost = {
        info: () => ({ on, dead, tier, scenes: scenes.map((S) => S.name), formations: [...registered], textures: [...texReady], stats: stage ? stage.stats() : null, glass: stage ? { ...stage.glass, joinedAfterFirstFrame: glassLate } : null }),
        get stage() { return stage || shadow; }, get shadow() { return !!shadow; }, measure: () => measure(), get M() { return M; }, last: null,
      };
      listen();
      whenReady(() => { build(); });
    },
    // (wave 9, J3 VIEWPORT) FX's resize, 200 ms after the last: the same rule (the window's resize has measured a layout
    // that moved; a bar's change has moved none)
    onResize() { onViewport(); },
    /** (lane o-router) the page leaves under the router: the stage is handed to the next page (window.__rvKeep) */
    leave() { /** @type {any} */ (window).__rvKeep = handOver(); },
  });
})();
