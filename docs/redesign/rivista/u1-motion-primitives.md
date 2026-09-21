# U1 — Motion & interaction primitives of "la rivista bianca" (Domus Tua)

Source: `C:/Users/alber/domus-tua-site`, branch `claude/rivista-bianca`, working tree (read-only extraction, 2026-09-17).
Stack there: next 16.3.0, gsap ^3.15.0, @gsap/react ^2.1.2, lenis ^1.3.25, Tailwind v4.

All paths below are relative to `C:/Users/alber/domus-tua-site/`.

---

## 0. TL;DR for the port

The "smooth" feel is made of very few things, applied with discipline:

1. **Lenis** `lerp: 0.1`, wheel only (touch stays native), driven by `gsap.ticker`, `lagSmoothing(0)`, `lenis.on("scroll", ScrollTrigger.update)`. No `normalizeScroll`, no `scrollerProxy`, `ScrollTrigger.config({ ignoreMobileResize: true })`.
2. **Three gestures** only: (a) `TextLines` — display titles split into lines and risen from a mask (`yPercent 112 → 0`, `expo.out` 1.05 s, stagger 0.09, `top 86%`); (b) `Reveal` — CSS fade-up `translateY(2.5rem)` + opacity, 0.9 s `cubic-bezier(0.16,1,0.3,1)`, toggled by IntersectionObserver; (c) `Parallax` — scrubbed `yPercent` drift, almost imperceptible (`speed -0.04` → ±0.56 %).
3. **All reveals replay in both directions** (client directive 2026-08-04): `restart … reverse`, IO toggling on and off.
4. **Set pieces** (≥1024 px + motion ok only): `HorizonScroller` (sticky screen + horizontal track, height = track width, `scrub 0.25`, CustomEase `dtHorScroll`), `HorizontalRail` (sticky "runway", `scrub 0.6`, counter-panning media), `StarReviews` (clip-path star morph on 360svh runway). **Never GSAP `pin`** — always CSS `position: sticky` on a tall runway.
5. **Brand CustomEases**: `domus` = `C0.22,0.9 0.36,1` (soft out, long tail), `domus.inOut` = `C0.66,0 0.22,1`, `dtOut` = `0.25,1,0.5,1`, `dtDiveIn` = `0.6,0,0,1`, `dtHorScroll` = `0.25,0,0.75,1`, `dtLoader` (stepped).
6. **Preloader** is a CSS-keyframe film (4.63 s) server-rendered, with a JS orchestrator that reads the CSS clock; once per session; skippable.
7. **Page transitions: NONE on this branch.** `PageTransition.tsx` is a stub (removed 2026-09-10, commit `178c6b5`). The old curtain is recoverable from git (§12) — Alberto wants transitions, so the portfolio must re-introduce one (non-curved).
8. **Micro-interactions are nearly static**: header = 0.3 s background-color transition after 24 px; nav/footer links = instant `hover:underline`; buttons = 0.25 s color/background swap. Two animated underline utilities exist in CSS (`.link-underline`, `.link-draw`) but the rivista bianca chrome does not use them.

---

## 1. Global timing & easing vocabulary

### 1.1 `app/lib/motion/gsap.ts` (single GSAP registration point)

```ts
gsap.registerPlugin(ScrollTrigger, CustomEase, useGSAP);
ScrollTrigger.config({ ignoreMobileResize: true });

CustomEase.create("domus", "M0,0 C0.22,0.9 0.36,1 1,1");       // main choreography
CustomEase.create("domus.inOut", "M0,0 C0.66,0 0.22,1 1,1");   // page/overlay transitions
CustomEase.create("dtDiveIn", "0.6,0,0,1");                    // preloader dive / old transition reveal
CustomEase.create("dtOut", "0.25,1,0.5,1");                    // text reveals (chars), curtains
CustomEase.create("dtHorScroll", "0.25,0,0.75,1");             // horizontal track (slow-fast-slow)
CustomEase.create("dtLoader", "M0,0,C0,0,0.13,0.34,0.238,0.442,0.305,0.506,0.322,0.514,0.396,0.54,0.478,0.568,0.468,0.56,0.522,0.584,0.572,0.606,0.61,0.719,0.714,0.826,0.798,0.912,1,1,1,1");

export const dur = { micro: 0.3, short: 0.6, reveal: 0.9, hero: 1.4, transition: 1.1 };
export const stagger = { chars: 0.06, words: 0.1, lines: 0.11, cards: 0.12 };
export const dist = { rise: 48, parallax: 0.13, skew: 5 };
export const MQ = {
  motionOk: "(prefers-reduced-motion: no-preference)",
  desktop: "(min-width: 768px)",   belowDesktop: "(max-width: 767.98px)",
  lg: "(min-width: 1024px)",       belowLg: "(max-width: 1023.98px)",
};
```

Rules written in the header comment (worth porting verbatim as project rules):
- every animation inside `gsap.matchMedia(MQ.motionOk)`;
- hidden states only via JS (never SSR/CSS) — *note: `Reveal` breaks this, see §3*;
- never transform an ancestor of sticky/fixed elements;
- a hidden state that contains a link/button uses `opacity` (+ `pointerEvents:none`), **never `autoAlpha`** (visibility:hidden removes it from tab order and the `focusin` safety net can never fire);
- plugins other than ScrollTrigger/CustomEase (SplitText, Flip…) are registered locally in the component that uses them, to keep them out of the layout chunk;
- two thresholds: **768** = section effects (Parallax, preloader mobile geometry); **1024** = set pieces (rails, horizontal panels, star film). "below" twins use `.98` to avoid 1-px gaps at fractional widths;
- a test hook `window.__dtST()` / `__dtSTRefresh` counts triggers and refreshes (for e2e: URL-bar resize must cause 0 refreshes).

### 1.2 CSS mirror — `app/globals.css` `@theme inline`

```css
--ease-soft:     cubic-bezier(0.32, 0.72, 0, 1);
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);     /* ≈ expo.out, used by .reveal, .link-underline */
--ease-domus:    cubic-bezier(0.22, 0.9, 0.36, 1);  /* = CustomEase "domus", used by .link-draw */
--dur-micro: 0.3s; --dur-short: 0.6s; --dur-reveal: 0.9s; --dur-hero: 1.4s; --dur-transition: 1.1s;
--radius-card: 0px; --radius-card-lg: 0px; --radius-field: 0px;
--shadow-card: none; --shadow-card-hover: none; --shadow-float: none;
```
Preloader CSS uses the eases as bezier: `domus.inOut` = `cubic-bezier(0.66,0,0.22,1)`, `dtDiveIn` = `cubic-bezier(0.6,0,0,1)`, `dtOut` = `cubic-bezier(0.25,1,0.5,1)`.

### 1.3 Numbers actually used (vs. the declared vocabulary)

| Gesture | Duration | Ease | Stagger / distance | Trigger |
|---|---|---|---|---|
| TextLines (lines from mask) | 1.05 s | `expo.out` | 0.09 s default (declared `stagger.lines` is 0.11 — not used) ; `yPercent 112→0` | `top 86%`, `restart none none reverse` |
| TextLines exit mode (unused on site) | 0.4 s | `power2.in` | stagger/2 ; `yPercent → -110` | `onLeaveBack` |
| Reveal (CSS fade-up) | 0.9 s | `cubic-bezier(0.16,1,0.3,1)` | `translateY(2.5rem)` (40 px; declared `dist.rise` 48 not used) ; call-site delays 80–220 ms | IO `threshold .12`, `rootMargin 0 0 -8% 0`, toggles both ways |
| Parallax | scrub | `none` | `yPercent ±speed*14` (site uses `speed -0.04` → ±0.56 %; editorial rows 0.1 + scale 1.1 → ±1.4 %) ; phone ×0.5 | `top bottom` → `bottom top`, `scrub: true` |
| HorizonScroller track | scrub 0.25 | `dtHorScroll` | height = track width | `2.5% top` → `97.5% bottom` |
| Horizon block reveal | 0.9 s | `domus` | `y 28 → 0`, opacity | enter: `top 70%` on root, delayedCall i*0.12 ; track: `left 85%` via containerAnimation |
| Horizon chars | 1.2 s | `dtOut` | stagger 0.03 ; `yPercent 50 + rotateY 90 → 0`, perspective 800, origin 50% 100% | `top 55%` (desktop) / `top 70%` (mobile) |
| Horizon curtain media | 1.6 s | `dtOut` | `clip-path inset(0 100% 0 0) → inset(0)` + inner `scale 1.15→1` | `left 90%` containerAnimation / `top 70%` mobile |
| Stair title lines | scrub 0.25 | `none` | `xPercent wrap[-5,25,-15] → [5,-25,25]` (mobile px ±16) | `top top`→`bottom bottom` |
| HorizontalRail | scrub 0.6 | `none` | track `x 0 → -overflow*speed`; pans `xPercent -depth → +depth` (depth 4) | runway: `top {top}px` → `bottom {top+railH}px` ; no runway: `top 96%`→`bottom 4%` |
| Hero lockup chars | 1.4 s (`dur.hero`) | `dtOut` (timeline default `domus`) | title stagger 0.08 @0.2s ; script `x 6vw→0` stagger 0.07 @0.85s ; tagline stagger 0.032 @0.7s ; `yPercent 50→0` + opacity | on preloader handoff event, or 150 ms after hydration |
| RotatingMark | continuous | — | 30°/s rest; scroll → `30 + 10·|v|` in 0.3 s `domus`; back to 30 in 1.1 s `domus` after 100 ms idle | Lenis `scroll` |
| Header scrolled | 0.3 s | Tailwind default ease | bg transparent → `cream-deep` + 1px hairline | `scrollY > 24` |
| Buttons | 0.25 s | `ease` | bg/color/border swap | hover / focus-visible |
| `.link-underline` | 0.4 s | `--ease-out-expo` | background-size 0→100% × 1.5px | hover/focus |
| `.link-draw` | 0.35 s | `--ease-domus` | `::after scaleX 0→1`, origin left, 1px, bottom -2px | hover/focus |

---

## 2. SmoothScroll (Lenis) — `app/components/motion/SmoothScroll.tsx`

**API:** `<SmoothScroll />` (renders null, mounted in root layout, does not wrap children) + `getLenis(): Lenis | null`.

**Mechanism:**
```ts
const start = () => {
  if (lenis) return;
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, anchors: true, autoRaf: false });
  activeLenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  onTick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(onTick);
  if (html.hasAttribute("data-preloader")) { lenis.stop(); watchCurtain(); }  // MutationObserver on the attribute
  else release();                                                             // lagSmoothing(0) + lenis.start()
};
const stop = () => { gsap.ticker.remove(onTick); lenis.destroy(); lenis = null; activeLenis = null; };
const sync = () => (media.matches ? start() : stop());        // media = matchMedia(MQ.motionOk)
sync(); media.addEventListener("change", sync);                 // live reaction to reduced-motion toggle
```
- `release()` = `gsap.ticker.lagSmoothing(0); lenis.start()`. During the intro the preloader sets `lagSmoothing(500, 33)` (hydration jank would otherwise jump the timeline).
- Touch: `syncTouch` not set → native touch scrolling on phones (no hijack).
- `anchors: true` → `#hash` links scroll through Lenis honouring `scroll-margin-top` (`:where([id]) { scroll-margin-top: 6.5rem }`).
- No `ScrollTrigger.normalizeScroll`, no `scrollerProxy`.
- **Reduced motion:** Lenis destroyed; native `scroll-behavior` (and `html{scroll-behavior:auto}` under reduce).

**CSS (globals.css):**
```css
html { scroll-behavior: smooth; overflow-x: clip; }
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
.lenis.lenis-stopped { overflow: hidden; }
```
`<html data-scroll-behavior="smooth">` is set in layout (Next 16 requirement so SPA navigations still jump instantly).

**Gotchas documented:**
- `lenis.stop()` → `lenis-stopped` → `overflow:hidden`: if nothing ever calls `start()` the page is "walled" (looks loaded, doesn't scroll). Hence the MutationObserver "suspenders" that restarts Lenis when `data-preloader` drops, whoever removed it; it deliberately observes only that attribute so it never restarts Lenis under a menu/overlay that stopped it.
- Other components stop Lenis for their own reasons (mobile menu, lightboxes) and must own their `start()`.
- `scrollTo({behavior:"smooth"})` on inner scrollers is inert under Lenis → use CSS `scroll-behavior: smooth` on those scrollers (`.dt-gallery-rail`).
- Scroll lock for menus must be on `<html>` (`overflowY:hidden` + `scrollbar-gutter: stable` when scrollbars take space), not on `body`, because `html{overflow-x:clip}` makes body overflow ineffective; Lenis stop is the second lock.

---

## 3. Reveal (fade-up) — `app/components/Reveal.tsx` + `.reveal` CSS

**API:** `<Reveal delay?={ms} as?={ElementType} className? id?>` — `delay` in **milliseconds** (becomes `transitionDelay`).

**Mechanism:** React state `shown` toggled by IntersectionObserver; CSS transition does the motion.
```tsx
useEffect(() => {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((entry) => setShown(entry.isIntersecting)),  // replay both directions
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  io.observe(el);
  const safety = window.setTimeout(() => setShown(true), 2500);  // if IO never fires
  return () => { io.disconnect(); window.clearTimeout(safety); };
}, []);
return <Tag ref={ref} id={id} className={`reveal ${shown ? "is-in" : ""} ${className}`}
            style={delay ? { transitionDelay: `${delay}ms` } : undefined}>{children}</Tag>;
```
```css
.reveal { opacity: 0; transform: translateY(2.5rem);
  transition: opacity 0.9s var(--ease-out-expo), transform 0.9s var(--ease-out-expo); }
.reveal:not(.is-in) { will-change: transform, opacity; }   /* promoted only until entered */
.reveal.is-in { opacity: 1; transform: translateY(0); }
@media (scripting: none) { .reveal { opacity: 1; transform: none; filter: none; } }
@media (prefers-reduced-motion: reduce) { .reveal { opacity: 1; transform: none; filter: none; transition: none; } }
```
- No-JS: `@media (scripting: none)` forces final state. **Caveat**: the hidden state *is* in SSR HTML (class `.reveal` → opacity 0), which contradicts the "hidden only via JS" rule; mitigated only by `scripting:none` + 2.5 s safety. For the portfolio, prefer gating with an html attribute set by an inline script (e.g. `html[data-js] .reveal {opacity:0}`), so crawlers/no-JS never see opacity 0.
- The doc comment says "fade-up + de-blur" but no blur is animated (only `filter:none` resets).
- Transition delay applies both ways (exit is also delayed).
- Typical call-site pattern: eyebrow `<Reveal>` → title `<TextLines>` → script word / lead `<Reveal delay={80–200}>`.

---

## 4. TextLines (lines rising from a mask) — `app/components/motion/TextLines.tsx`

**API:** `<TextLines as?="h2" className? delay?={s} stagger?={0.09} exit?={false}>` — delay/stagger in **seconds**. Used on 33 call sites, always for display titles (`text-d1`/`d2`, uppercase). `exit` mode exists but is unused.

**Heart:**
```tsx
gsap.registerPlugin(SplitText);  // local, not in gsap.ts
useGSAP(() => {
  const mm = gsap.matchMedia();
  mm.add(MQ.motionOk, () => {
    let split, tween, st, out, cancelled = false;
    document.fonts.ready.then(() => {                      // split on final metrics
      if (cancelled) return;
      split = SplitText.create(el, {
        type: "lines", mask: "lines", linesClass: "tl-line",
        aria: "none",                                       // "auto" puts aria-label → axe error on <blockquote>
        autoSplit: true,                                    // re-split on resize; tween returned by onSplit is recreated by GSAP
        onSplit: (self) => {
          st?.kill(); out?.kill();
          const from = { yPercent: 112 };
          const to = { yPercent: 0, duration: 1.05, ease: "expo.out", stagger, delay };
          if (!exit) {
            return (tween = gsap.fromTo(self.lines, from, { ...to,
              scrollTrigger: { trigger: el, start: "top 86%", toggleActions: "restart none none reverse" } }));
          }
          const reveal = gsap.fromTo(self.lines, from, { ...to, paused: true });
          const enter = () => { out?.kill(); reveal.restart(); };
          const leave = () => { reveal.pause(); out?.kill();
            out = gsap.to(self.lines, { yPercent: -110, duration: 0.4, ease: "power2.in", stagger: stagger / 2 }); };
          st = ScrollTrigger.create({ trigger: el, start: "top 86%", onEnter: enter, onEnterBack: enter, onLeaveBack: leave });
          if (st.isActive) enter();                           // safety: never stay at 112
          return (tween = reveal);
        },
      });
    });
    return () => { cancelled = true; out?.kill(); st?.kill(); tween?.scrollTrigger?.kill(); tween?.kill(); split?.revert(); };
  });
}, { scope: ref, dependencies: [delay, stagger, exit, locale], revertOnUpdate: true });
return <Tag key={locale} ref={ref} className={className}>{children}</Tag>;
```
- **Hidden state only via JS** (fromTo inside matchMedia after fonts.ready). No-JS / reduced-motion → static visible text.
- **i18n:** element remounts via `key={locale}` because SplitText detaches original text nodes.
- **Cleanup:** everything created asynchronously (after `fonts.ready`) is outside the useGSAP context → killed manually; `revertOnUpdate: true` always when deps exist.
- **Resize:** `autoSplit` re-measures lines; the returned tween is auto-recreated; own ScrollTrigger / exit tween killed at top of `onSplit`.
- **Gotcha to watch in port:** `fromTo` with a scrollTrigger renders immediately → an above-the-fold title visible before `fonts.ready` will snap to hidden then rise (acceptable because the hero uses its own char split; TextLines is used below the fold).
- Mask comes from SplitText `mask: "lines"` (wrapper with overflow clip). 112 % (not 100 %) so descenders are fully hidden.

---

## 5. Parallax — `app/components/motion/Parallax.tsx`

**API:** `<Parallax speed?={0.25} range?={px} scale?={n} mobile?={true} as? className? innerClassName? innerStyle?>`
- `speed` −0.5…0.5; sign = direction (>0 slower/background, <0 faster/foreground). Amplitude `yPercent = speed*14`.
- `range` = amplitude in px (for small elements) — does not shrink on phones by itself.
- `scale` = overscan of inner wrapper (e.g. 1.1 inside `overflow-hidden` frame), pre-applied in SSR to avoid a zoom pop on LCP images.
- `mobile` (default true since "parità mobile 2"): below 768 amplitude ×0.5 (`PHONE_SPEED_FACTOR`); `mobile={false}` when phone travel would be < ~10 px.

**Heart:**
```tsx
const mm = gsap.matchMedia();
mm.add({ motionOk: MQ.motionOk, phone: MQ.belowDesktop }, (ctx) => {
  const { motionOk, phone } = ctx.conditions;
  if (!motionOk) return;
  if (phone && !mobile) return;
  const k = phone ? 0.5 : 1;
  const dir = Math.sign(speed) || 1;
  const move = range != null ? { unit: "y", amp: range * dir * k } : { unit: "yPercent", amp: speed * 14 * k };
  gsap.fromTo(inner, { [move.unit]: move.amp, scale: scale ?? 1 }, {
    [move.unit]: -move.amp, scale: scale ?? 1, ease: "none",
    scrollTrigger: { trigger: outer, start: "top bottom", end: "bottom top", scrub: true,
      onToggle: (self) => { inner.style.willChange = self.isActive ? "transform" : ""; } },
  });
  return () => { inner.style.willChange = ""; };
});
// markup: <Tag ref={outerRef}><div ref={innerRef} style={scale ? {transform:`scale(${scale})`} : …}>{children}</div></Tag>
```
- Outer keeps layout, inner moves (never transform the trigger itself).
- `will-change` only while the trigger is active (written on style, cleaned in matchMedia cleanup since a `gsap.set` inside a callback isn't context-tracked).
- One matchMedia with named conditions → crossing 768 reverts and rebuilds with the right factor.
- Site values: `speed={-0.04}` on nearly all square images (deliberately "quasi impercettibile"); `EditorialRows` `speed={0.1} scale={1.1} mobile={false}`.

---

## 6. HorizontalRail (+ RailProgress) — `app/components/motion/HorizontalRail.tsx`, `RailProgress.tsx`

**API:** `<HorizontalRail className? trackClassName? speed?={1} snapMobile?={false} runway?={0 svh}>{tiles}</HorizontalRail>`
Tiles may contain `<div className="dt-rail_pan" data-depth={4} style={{"--depth":4}}>` around the image for the second plane. Team uses `runway={120} snapMobile`, `DEPTH = 4`.

**Markup:** `.dt-railway` (wrap, `--rail-run`) > `.dt-rail` (scroller) > `.dt-rail_track` (flex) ; `<RailProgress>` after the rail.

**Heart:**
```tsx
mm.add(`${MQ.motionOk} and ${MQ.lg}`, () => {
  rail.setAttribute("data-on", "");                  // CSS: overflow hidden, no snap
  const parked = runway > 0; let top = 0;
  const size = () => {
    top = Math.max(0, Math.round((window.innerHeight - rail.offsetHeight) / 2));
    wrap.style.setProperty("--rail-len", `${rail.offsetHeight}px`);
    wrap.style.setProperty("--rail-top", `${top}px`);
  };
  if (parked) { wrap.setAttribute("data-on", ""); size(); ScrollTrigger.addEventListener("refreshInit", size); }
  const st = parked
    ? { trigger: wrap, start: () => `top ${top}px`, end: () => `bottom ${top + rail.offsetHeight}px`, scrub: 0.6, invalidateOnRefresh: true }
    : { trigger: rail, start: "top 96%", end: "bottom 4%", scrub: 0.6, invalidateOnRefresh: true };
  const overflow = () => Math.max(0, track.scrollWidth - rail.clientWidth) * speed;
  const move = gsap.fromTo(track, { x: 0 }, { x: () => -overflow(), ease: "none", scrollTrigger: st });
  const pan = pans.length ? gsap.fromTo(pans,
    { xPercent: (i, el) => -Number(el.dataset.depth ?? 6) },
    { xPercent: (i, el) =>  Number(el.dataset.depth ?? 6), ease: "none", scrollTrigger: st }) : null;
  return () => { /* remove attrs + custom props, removeEventListener refreshInit, kill move/pan + their STs */ };
});
```
CSS:
```css
.dt-rail { position: relative; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; }
.dt-rail[data-snap] { scroll-snap-type: x mandatory; } .dt-rail[data-snap] > .dt-rail_track > * { scroll-snap-align: center; }
.dt-rail[data-on] { overflow: hidden; scroll-snap-type: none; }
.dt-rail_track { display: flex; width: max-content; align-items: center;
  gap: clamp(0.75rem, 1.6vw, 1.75rem); padding-inline: clamp(1.25rem, 5vw, 5rem); }
.dt-railway[data-on] { position: relative; height: calc(var(--rail-len, 0px) + var(--rail-run, 120) * 1svh); }
.dt-railway[data-on] > .dt-rail { position: sticky; top: var(--rail-top, 0px); }
.dt-rail_pan { position: absolute; top: 0; bottom: 0; left: -9%; width: 118%; }   /* ±9 % play */
@media (max-width: 1023.98px) and (prefers-reduced-motion: no-preference) {
  .dt-rail:not([data-on]) .dt-rail_pan { transform: translateX(calc((var(--rail-p, 0.5) - 0.5) * 2 * var(--depth, 6) * 1%)); }
}
```
- **Sticky runway, never GSAP `pin`** ("pin writes position:fixed + spacer and fights main/footer stacking").
- Start/end computed so the horizontal travel exactly equals the time the rail is parked in the middle of the viewport.
- **Mobile (<1024):** native horizontal scroll (drag), optional snap; no GSAP, no ScrollTrigger. `RailProgress` writes `--rail-p` (0→1 from `scrollLeft/room`) on a passive scroll listener → drives a 2px × 4rem indicator (ink/15 track, red thumb = 1/3 width, `translate-x-[calc(var(--rail-p)*200%)]`) and the CSS counter-pan. `room` measured only on width-changing resize (URL-bar resizes ignored). Stays on under reduced-motion (it's a scrollbar, not animation); `aria-hidden`, `pointer-events-none`, `invisible` (not `hidden`) to avoid CLS.
- **Never set `[data-on]` below 1024** (kills drag and snap).
- Tiles get `tabIndex={0}` (axe `scrollable-region-focusable`).
- Refresh: `refreshInit` listener (not `refresh`) re-measures before triggers recompute; `invalidateOnRefresh` + function values.

---

## 7. HorizonScroller (horizontal panels) — `app/components/motion/HorizonScroller.tsx`

**API:** `<HorizonScroller id? className? refreshKey?={locale}>{panels}</HorizonScroller>` → `section.dt-horizon > .dt-horizon_screen > .dt-horizon_track`. Children panels: `.dt-horizon_panel` (100vw) and variants. Content contract via attributes:
- `data-horizon-reveal="enter"` block reveal when section enters; `"track"` reveal tied to horizontal movement (containerAnimation); `"chars"` per-char reveal;
- `data-horizon-stair` title lines sliding in alternate directions;
- `data-horizon-slide` (clip-path curtain) + `data-horizon-slide-img` (inner scale);
- `data-horizon-flower="drift-x|drift-y"` decoration drift.

**Desktop (≥1024 + motion ok) heart:**
```ts
root.setAttribute("data-on", "");
const size = () => { root.style.height = `${track.scrollWidth}px`; };   // vertical distance = horizontal distance (1:1)
size(); ScrollTrigger.addEventListener("refreshInit", size);
const tween = gsap.to(track, {
  x: () => -(track.scrollWidth - screen.clientWidth), ease: "dtHorScroll",
  scrollTrigger: { trigger: root, start: "2.5% top", end: "97.5% bottom", scrub: 0.25, invalidateOnRefresh: true },
});
// "track" reveals:
ScrollTrigger.create({ trigger: el, containerAnimation: tween, start: "left 85%",
  onEnter: () => r.play(), onLeaveBack: () => r.back() });
// block reveal = gsap.set(el,{opacity:0,pointerEvents:"none",y:28}) → to {opacity:1,pointerEvents:"auto",y:0,duration:.9,ease:"domus",paused:true}; restart / reverse
// + focusin → play() + progress(1)
// chars: SplitText words,chars (smartWrap, aria none) after fonts.ready; set {autoAlpha:0,yPercent:50,rotateY:90,transformOrigin:"50% 100%",transformPerspective:800}
//        → to {autoAlpha:1,yPercent:0,rotateY:0,duration:1.2,ease:"dtOut",stagger:0.03}; trigger root "top 55%"
// stairs: fromTo xPercent wrap([-5,25,-15]) → wrap([5,-25,25]), ease none, trigger root top top → bottom bottom, scrub .25
// curtain: set clipPath "inset(0% 100% 0% 0%)", img scale 1.15 → timeline {clipPath inset(0),scale 1, 1.6s dtOut}; containerAnimation "left 90%"
```
CSS:
```css
.dt-horizon:not([data-on]) { overflow-x: clip; overflow-clip-margin: 2rem; }
.dt-horizon[data-on] { overflow: clip; }
.dt-horizon[data-on] .dt-horizon_screen { position: sticky; top: 0; display: flex; height: 100svh; overflow: hidden; }
.dt-horizon[data-on] .dt-horizon_track { display: flex; width: max-content; height: 100%; will-change: transform; }
.dt-horizon[data-on] .dt-horizon_panel { flex: none; height: 100%; width: 100vw; }
.dt-hword { display: inline-block; white-space: nowrap; }  .dt-hchar { display: inline-block; }
```
- **Mobile/tablet (<1024):** same "acts" without pin, in a column: blocks reveal at `top 85%` (restart/reverse), chars at `top 70%` of the h2, stairs in **px clamped ±16** (`x wrap[-3,16,-10] → [3,-16,16]`, scrub .25, trigger = title `top bottom → bottom top`), curtain at `top 70%` still 1.6 s, drift-y on parent. Never sets `[data-on]`, never writes height, never pins/refreshes.
- **No-JS / reduced-motion:** panels in column, everything visible (attribute only set by JS).
- **Safety nets:** `focusin` → complete reveal; mobile 2.5 s timeout **guarded** (only if tween still at 0 and element already past the start line — an unguarded timeout fired reveals 5–13 screens below the fold).
- **Gotchas:** ease on a containerAnimation is intentionally non-linear (reveals tolerate the offset); `opacity + pointerEvents`, never `autoAlpha` on blocks with CTAs; no permanent `will-change` on chars/panels (measured 252 promoted layers / 432 MB → back-scroll stutter); split async → manual cleanup; `refreshKey` (locale) re-creates the whole context; section `overflow-x: clip` (not hidden) to avoid creating a scroll container that would break sticky.

---

## 8. StarReviews (scroll-driven clip-path film) — `app/components/StarReviews.tsx`

Only the mechanism (the star is Domus brand; the technique is reusable as "media morphs from small shape → fullscreen → settles into a slot"):
- Desktop (≥1024): `section[data-on]` → `.dt-starrev_runway { height: 360svh }` + `.dt-starrev_screen { position: sticky; top: 0; height: 100svh; overflow: hidden }`. One timeline, `defaults.ease "none"`, scrollTrigger `{ trigger: runway, start: "top 55%", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true, onToggle → will-change on/off }`.
- Timeline (unit positions, total ≈1.3): intro `autoAlpha 0→1` (0.08 @0.02) · proxy `geo.r` small→cover (`0.42, power4.inOut`, onUpdate rebuilds a 10-vertex polygon clip-path) @0.14 · img `scale .85→1` (0.5, power2.inOut) @0.12 · flash overlay opacity `→.5` (0.14 power2.in) @0.4, `→.04` (0.18 power2.out) @0.54 · cover title chars `scaleY 8, scaleX .1 → 1` (0.16 power3.out, stagger 0.014 from end) @0.46 · chars out `scaleY 0` (0.1 power2.in, stagger 0.008 from center) @0.68 · geo → target slot (0.28 power4.inOut) @0.7 · tiles `opacity/scale .7→1` (0.12 power2.out, stagger 0.015 from center) @0.9 · halos overshoot 1 → .5 · intro out @1.02 · empty 0.2 breath @1.1 · section text `opacity 0/y 24 → 1/0` @0.94.
- Mobile: no sticky; the same timeline in a box anchored to the row (`--sr-box-top/h`), `once: true` at `top 85%` of the row, played in time with `tl.timeScale(tl.duration() / 3)` (≈3 s).
- Lessons: animate a **geometry proxy** (cx, cy, r) instead of interpolating polygon strings; measure boxes on `refreshInit`, never per frame (`getBoundingClientRect` per frame was the main cost); flash via an opacity overlay instead of `filter`; keyboard `focusin` inside pinned content → `lenis.scrollTo(st.end, {immediate:true})`; continuous shimmer loops paused off-screen via a `top bottom → bottom top` toggle trigger.

---

## 9. RotatingMark + MarkBadge — `app/components/motion/RotatingMark.tsx`, `MarkBadge.tsx`

**API:** `<RotatingMark className="h-12 w-12" />` (header, lg+ only, `h-11 w-11`); `<MarkBadge className />` is a server-safe static SVG (no "use client") reused by the preloader shell.
- MarkBadge: `viewBox 0 0 96 96`, 60 radial ticks (every 6°), cardinal ticks longer (r1 40.5 vs 43, r2 46.5), strokeWidth 1.4/1, opacity .9/.5, `vector-effect: non-scaling-stroke`, `currentColor`; coordinates `toFixed(2)` to avoid SSR/client float hydration mismatch. Monogram centred by **flexbox, not translate** (GSAP writes transform).
- Motion:
```ts
mm.add(MQ.motionOk, () => {
  const state = { speed: 30 };  let rotation = 0; let armed = false;
  window.addEventListener("wheel", () => armed = true, { once: true, passive: true });   // + touchmove
  const tick = (_t, deltaMS) => { rotation += state.speed * (Math.min(deltaMS, 100) / 1000);
    gsap.set(ring, { rotation, transformOrigin: "center center" }); gsap.set(mark, { rotation, transformOrigin: "center center" }); };
  gsap.ticker.add(tick);
  const onScroll = ({ velocity }) => { if (!armed) return;
    gsap.to(state, { speed: 30 + 10 * Math.abs(velocity), duration: 0.3, ease: "domus", overwrite: true });
    clearTimeout(idle); idle = setTimeout(() => gsap.to(state, { speed: 30, duration: 1.1, ease: "domus" }), 100); };
  // Lenis may mount later: poll getLenis() every 250 ms until attached
});
```
- Clockwise only, never inverts with scroll direction (client). Delta clamped to 100 ms (background tabs). In the preloader it spins via CSS `dt-pre-spin 6s linear infinite` (so it rotates before JS).

---

## 10. Preloader — `app/components/motion/PreloaderShell.tsx` (server markup) + `Preloader.tsx` (client orchestrator) + `app/lib/motion/intro-constants.ts` + globals.css "Preloader" block + boot script in `app/layout.tsx`

### 10.1 Architecture (why)
Measured on CPU×4 + Slow 4G: JS for the home lands at 8–12 s, so a GSAP-driven intro never played on slow phones. Final design ("option D"): **the entire film is CSS @keyframes on server-rendered markup**, starting at first paint; JS only reads the CSS clock, fires the hand-off event, handles skip and closing; GSAP drives only as fallback (no `@property` support or keyframes never started).

### 10.2 Boot script (inline, first element of `<body>`, before paint)
- Sets `html[data-locale]` from cookie.
- `pre = !location.hash && matchMedia(reduce:no-preference) && !sessionStorage["dt-intro-seen"]`.
- If `pre`: `html[data-preloader]`, `__dtPreArmed=1`, `__dtPreT0=performance.now()`, preloads the silhouette image with `<link rel=preload media=…>`, arms failsafe `setTimeout(removeAttr + mark seen, PRE_FAILSAFE_MS = 5230)`, attaches capture-phase `pointerdown`/`keydown` skip listeners (skip only content keys: Enter, Space, Escape, length-1 keys; not after dive time) which write `--pre-skip: <elapsed>s` + `html[data-pre-skip]` and re-arm failsafe to `diveDur + 350ms`.
- If motion ok: `data-hero-rest` / `data-hero-intro` = `"intro"` or `""` (CSS safety nets for hero letters).
- Deep link with hash → no intro, session marked seen.

### 10.3 Clock (`intro-constants.ts`, `TEMPO = 1`)
```
figure 0.15 (0.9 fade) · chars 0.12 +0.075*i (1.3 s) · script 0.60 +0.065*i (1.3 s) · caps 0.40 +0.11*i (0.85 s)
payoff 0.65 +0.14*i (1.25 s) · act1End 2.70 · progress box 0.55 (0.25 s) · track line 0.60 → 2.15 (1.55 s, dtLoader)
arch door 2.25 → 3.35 (1.1 s, domus.inOut) · content exit 2.35 (0.55 s, domus.inOut) · dive 3.13 → 4.63 (1.5 s, dtDiveIn)
fallback curtain 2.60 (0.9 s) · INTRO_MS 4630 · PRE_AUTOHIDE_MS 4730 · PRE_FAILSAFE_MS 5230
HERO_REST_MS 3330 (dive+200) · HERO_REST_WARM_MS 6000 · WARM_FIRST_FOLD_MS 3000 · INTRO_EVENT "dt:intro:done" · INTRO_KEY "dt-intro-seen"
```
A unit test (`app/lib/__tests__/intro-clocks.test.ts`) re-reads globals.css + layout.tsx and fails if any number drifts.

### 10.4 CSS film (excerpt)
```css
.dt-preloader { position: fixed; inset: 0; z-index: 96; display: none; }
html[data-preloader] .dt-preloader { display: block; }
html[data-preloader] { overflow: hidden; }
html[data-preloader] .dt-preloader [data-pre-char] {
  animation: dt-pre-char 1.3s cubic-bezier(0.25,1,0.5,1) calc(0.12s + var(--i,0) * 0.075s) both; }
@keyframes dt-pre-char { from { opacity: 0; transform: perspective(800px) translateY(50%) rotateY(90deg); }
                         to   { opacity: 1; transform: perspective(800px) translateY(0) rotateY(0deg); } }
@keyframes dt-pre-word { from { transform: translateY(110%); } to { transform: translateY(0); } }  /* payoff under overflow-hidden mask */
@property --arch-w { syntax: "<length>"; inherits: true; initial-value: 0px; }   /* + --arch-y, --arch-s <number> */
html[data-preloader]:not([data-pre-gsap]) .dt-preloader {
  animation: dt-pre-door 1.1s cubic-bezier(0.66,0,0.22,1) 2.25s both,
             dt-pre-dive 1.5s cubic-bezier(0.6,0,0,1) 3.13s forwards,
             dt-pre-autohide 0.5s ease 4.73s forwards; }
html[data-preloader][data-pre-skip]:not([data-pre-gsap]) .dt-preloader {
  animation-delay: -1.1s, var(--pre-skip, 0s), calc(var(--pre-skip, 0s) + 1.6s); }   /* skip = jump to dive "now" */
```
The arch "door" is a 4-layer additive `mask-image` (3 solid rects + SVG arch frame at `--arch-y`, `mask-composite: add`), widths 24→36→125 vw desktop / 40→58→165 vw phone; fallback `clip-path inset(0 0 0 0) → inset(0 0 100% 0)` curtain. Echo rings follow via `transform: translate(-50%, …) scale(var(--arch-s))` (transform only). **This is Domus brand (curved arch); for the portfolio keep the architecture (CSS film + JS orchestrator + session gate + skip + failsafes + hand-off event), replace the arch with a square-cornered wipe.**

`will-change` on chars only while `html[data-preloader]:not([data-pre-act2])` (JS sets `data-pre-act2` at 2.7 s).

### 10.5 Orchestrator heart (`Preloader.tsx`, CSS-driven branch)
```ts
const elapsed = elapsedFromCss([root, ring, firstChar]);   // anim.timeline.currentTime - anim.startTime (not currentTime: finished anims freeze)
const now = () => elapsed + (performance.now() - mountedAt) / 1000;
const at = (t, fn) => { const ms = (t - now()) * 1000; ms <= 0 ? fn() : timers.add(setTimeout(fn, ms)); };
getLenis()?.stop(); window.scrollTo(0, 0); gsap.ticker.lagSmoothing(500, 33);
at(INTRO_T.act1End, unwill);
at(diveAt, () => { diving = true; fireIntro(); });            // window.dispatchEvent(new Event("dt:intro:done")), once per document
scheduleEnd(endAt);                                           // → finish(true) after warm-up promise
root.addEventListener("animationstart", e => isDive(e) && fireIntro());   // real CSS events beat timers under load
root.addEventListener("animationend",   e => isDive(e) && onFilmEnd());
seekToDive = () => { root.style.setProperty("--pre-skip", `${now().toFixed(3)}s`); html.setAttribute("data-pre-skip", ""); fireIntro(); scheduleEnd(now() + diveDur); };
// finish(): sessionStorage seen, clear timers + skip listeners, remove data-preloader/-live/-act2/-gsap/-skip,
//           gsap.ticker.lagSmoothing(0), getLenis()?.start(), scheduleIdleWarmup()
```
GSAP fallback timeline (when `@property` missing): `defaults ease "domus"`; progress `autoAlpha 1` 0.25 @0.55; track `yPercent -100→0` 1.55 `dtLoader` @0.6; content `y -28, autoAlpha 0` 0.55 `domus.inOut` @2.35; root custom props door 1.1 `domus.inOut` @2.25; `.call(fireIntro)` @3.13; dive 1.5 `dtDiveIn`; then `tl.time(elapsed)` to align with CSS clock.

Other rules: skip on `pointerdown`/`keydown` (guard `diving` **before** `preventDefault`, else form fields break); close immediately on `visibilitychange` hidden or reduced-motion switched on; StrictMode/HMR abort keeps `data-preloader` and re-arms the same failsafe; `hasIntroFired()` for listeners that subscribe late; desktop warms all images behind the curtain (deadline 4.5 s on the film clock), phone only waits for first fold (3 s).

### 10.6 Hero hand-off (`HeroCinematic.tsx`)
- Letters are SSR-split (`<span data-hero-char class="inline-block">` inside `inline-block whitespace-nowrap` words; wrappers `aria-hidden`, real text in `sr-only`).
- Pre-paint CSS: `html[data-hero-intro] [data-hero-char…] { opacity: .02; animation: dt-rest-failsafe .5s ease 6s forwards }` (3.33 s when intro) — painted but invisible, CSS safety net if JS never arrives.
- JS: if CSS net already fired (read via `getAnimations()`), do nothing. Else kill the CSS animation, `gsap.set(opacity .02)`, and on `INTRO_EVENT` (or `hasIntroFired()`, or safety `HERO_REST_MS`) / 150 ms after hydration on warm visits play: `will-change` on, title `yPercent 50→0 + opacity` 1.4 s `dtOut` stagger 0.08 @0.2; script `x 6vw→0` 1.4 s stagger 0.07 @0.85; tagline 1.4 s stagger 0.032 @0.7; `clearProps: willChange` on complete.

---

## 11. Header, Footer, links, CTAs (micro-interactions)

### Header (`app/components/Header.tsx`)
- `sticky top-0 z-50` on phones, `lg:relative` (scrolls away on desktop — no persistent bar).
- `scrolled = window.scrollY > 24` (passive scroll listener, native scrollY works with Lenis because Lenis scrolls the window).
- Classes: `border-b transition-colors duration-300` + `solid ? "border-line bg-cream-deep" : "!border-transparent bg-transparent"`; `solid = scrolled || menuOpen`. That is the **only** motion.
- Row height `h-[clamp(5rem,12vh,7.5rem)]`; lg: two rows (logo + RotatingMark + language / nav right-aligned, 16px uppercase tracking .08em).
- Nav links: `underline-offset-[0.4em] hover:underline focus-visible:underline aria-[current=page]:underline` (instant).
- Mobile menu: full panel `fixed inset-x-0 bottom-0 top-[clamp(5rem,12vh,7.5rem)]`, `hidden={!open}` (no choreography), `data-lenis-prevent`, `overflow-y-auto overscroll-contain`, items Playfair d2 uppercase with hairlines; scroll lock on `<html>` (`overflowY hidden` + `scrollbarGutter stable`) + `getLenis()?.stop()`; Escape, focus trap, focus restore, auto-close on route change (state adjusted during render) and on crossing 1024.

### Footer (`app/components/Footer.tsx`)
- Plain in-flow block, hairline top, 4 columns, **no GSAP, no fixed uncover** (the old uncover footer was removed). Links `underline-offset-4 hover:underline`; `.tap-target::before` 44px hit area on coarse pointers.

### CTA (`app/components/primitives/Cta.tsx` + `.dt-btn` CSS)
- `.dt-btn`: inline-flex, gap .6rem, radius 0, 1rem/600 uppercase tracking .08em, `transition: background-color .25s ease, color .25s ease, border-color .25s ease`; `min-height 2.75rem` on coarse pointers.
- `--cta` outline red 1.5px → filled red on hover/focus; `--cta-solid` red → red-dark; `--ghost` = no box, `text-decoration: underline; text-underline-offset: .35em; thickness 1.5px`, hover → red. Arrow icon is doubled in markup but the second copy is `display:none` (old swap micro-interaction retired).
- Unused-but-available utilities: `.link-underline` (background-size draw, 0.4s expo out) and `.link-draw` (`::after` scaleX 0→1, 0.35 s `--ease-domus`, transform-only).

### Global CSS affordances
- `:focus-visible { outline: 2px solid red; outline-offset: 3px }`.
- `::selection` red/cream. `html, body { overflow-x: clip }` (clip, not hidden — doesn't create a scroll container).
- Reduced motion global kill-switch: `*, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; scroll-behavior: auto !important }`.

---

## 12. Page transitions (removed) — for reference only

`app/components/motion/PageTransition.tsx` on this branch only exports `transitionTo(href)` (router.push) and `isTransitionCovering() → false`. The last real implementation (`git show 178c6b5^:app/components/motion/PageTransition.tsx`, 513 lines) worked like this — mechanism reusable, visuals were the curved arch the client rejected:
- Global capture-phase `click` listener on `document`: ignore modified clicks, non-left button, `target≠_self`, `download`, `data-no-transition`, other origin, non-http, same pathname; `preventDefault()` → `navigate(pathname+search+hash)`. Reduced motion → plain `router.push`.
- Cover: `setCovering(true)`, `getLenis()?.stop()`, overlay `pointerEvents auto`; panel `clip-path inset(100% 0 0 0) → inset(0)` **0.45 s `domus.inOut`** (arch variant 0.65 s); destination label split into chars `opacity 0, yPercent 60, rotateY 90 → 0` 0.72 s `dtOut` stagger 0.042 delay 0.14; badge `autoAlpha 1` @0.2 + `scale .84→1` 0.8 s `dtOut`.
- `router.push` on cover complete **or** a deadline `(0.45 s + 250 ms)` so navigation never waits on a stalled timeline; a 4 s safety reveal if the route never changes; a nav sequence id discards stale navigations.
- On `pathname` change: `scrollTo(0, instant)` (unless hash), double rAF → `ScrollTrigger.refresh()` → reveal `clip-path → inset(0 0 100% 0)` **0.55 s `domus.inOut`** (arch: 0.85 s `dtDiveIn`), label/mark fade 0.18 s; on complete `autoAlpha 0`, `setCovering(false)`, `getLenis()?.start()`, then scroll to hash target.
- Hash on first load: after 700 ms `ScrollTrigger.refresh()` then `lenis.scrollTo(el, { immediate: true, offset: -104 })`.
- `isTransitionCovering()` let lightboxes avoid restarting Lenis under the curtain.

---

## 13. Cross-cutting gotchas (collected from comments)

1. `useGSAP` with dependencies → always `revertOnUpdate: true`.
2. Anything created after an `await`/`.then` (e.g. `document.fonts.ready`) is outside the GSAP context → kill/revert manually in the matchMedia cleanup.
3. Use `ScrollTrigger.addEventListener("refreshInit", measure)` for dynamic heights (not `"refresh"`: function values are frozen before `refresh` fires).
4. `invalidateOnRefresh: true` + function-based `x`/`start`/`end` for anything measured in vw.
5. Sticky + tall runway instead of `pin`; never transform ancestors of sticky elements; section clipping with `overflow: clip`, not `hidden`.
6. `will-change` only during activity (onToggle / onStart-onComplete), never permanent on chars/panels.
7. Hidden states containing focusables: `opacity` + `pointerEvents:none`, `focusin` → complete reveal.
8. Timeout safety nets must be **guarded** (only fire if tween untouched AND element already past its start line), otherwise they "consume" off-screen animations.
9. Toggle-based reveals + resize refresh can re-hide things: mobile one-shot films use `once: true`.
10. Every matchMedia gate listens to `change` (rotated tablets) — `gsap.matchMedia` does this for free; hand-written `matchMedia` must add a listener.
11. `ScrollTrigger.config({ ignoreMobileResize: true })` at module level before any trigger exists.
12. i18n + SplitText → remount with `key={locale}` (or a `refreshKey` dep).
13. SSR-split letters: words as `inline-block whitespace-nowrap` so lines don't break inside words; SVG coordinates rounded to avoid hydration mismatch.
14. `data-scroll-behavior="smooth"` on `<html>` for Next 16; Lenis CSS disables native smooth when active.
15. Stale-comment warning: the globals.css preloader comment still cites `TEMPO = 2` numbers ("arch 4,5/2,2 · dive 6,26/3"); the live values are the `TEMPO = 1` ones listed in §10.3. The gsap.ts header lists `stagger.lines 0.11` and `dist.rise 48`, but TextLines uses 0.09 and Reveal 2.5rem.

---

## 14. Suggested port map for the portfolio (motion only)

| Domus primitive | Port as | Keep exactly | Change |
|---|---|---|---|
| gsap.ts vocabulary | `src/lib/motion.ts` / `src/lib/gsap.ts` | ease curves (rename `domus`→ own name), durations, MQ thresholds 768/1024, `ignoreMobileResize` | brand names |
| SmoothScroll | existing `Smooth.tsx` | lerp .1, wheel only, ticker drive, lagSmoothing(0), curtain watcher | — |
| Reveal | `Reveal` | 0.9 s expo-out, 2.5rem, IO .12 / -8 %, replay | gate hidden state behind a JS-set html attribute |
| TextLines | `TextLines` | SplitText lines+mask, 112 %, 1.05 s expo.out, .09, top 86 %, restart/reverse, autoSplit, fonts.ready | — |
| Parallax | `Parallax` | speed×14 yPercent, phone ×0.5, scrub true, will-change onToggle | amplitudes may be raised ("more motion") |
| HorizontalRail + RailProgress | work rail | sticky runway 120svh, scrub .6, counter-pan depth 4, native mobile + CSS pan | — |
| HorizonScroller | a horizontal chapter | height = track width, `dtHorScroll`, scrub .25, containerAnimation reveals, curtain 1.6 s | — |
| RotatingMark | Alberto monogram | 30°/s + 10·|v| scroll boost | own mark |
| Preloader | intro film | CSS-first film, session gate, skip, failsafes, hand-off event, hero char hand-off | no arch/curves: square wipe; shorter |
| PageTransition | **re-introduce** | capture-click interception, Lenis stop/start, deadline-based push, double-rAF refresh, hash handling | square `clip-path inset` wipe on paper (no dark, no curve) |
