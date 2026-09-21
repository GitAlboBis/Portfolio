# U4 — The Next.js substrate for the rivista port (verified at HEAD 86854f4)

Repo C:/Users/alber/Portfolio, branch feat/redesign-2026-09, tree clean. Every claim below was read in the file named; line numbers are from cat -n at this HEAD. The earlier survey .wf-out/rivista/u3-portfolio-map.md (written at d33a2d6) is still accurate: the only commit since is 86854f4, which added public/proto/rivista/** and touched nothing in src/, scripts/ or the configs. This map deepens it on the ten points the port planner asked for.

Conventions: "keep" = world-neutral, survives the port as-is; "rewrite" = keep the mechanism, replace the artwork/API; "delete" = belongs to the job-order world only.

---

## 1. Route tree and the render flow of a navigation today

### 1.1 Route tree (from .next/app-path-routes-manifest.json, all static)

| Route | File | Notes |
|---|---|---|
| / | src/app/page.tsx (104 l) | server component; composes the sheet; metadata canonical "/" (l.21-25) |
| /work | src/app/work/page.tsx (22 l) | renders WorkIndex; TITLE "Work", OG_TITLE "Work — Alberto Tuveri" |
| /work/[slug] | src/app/work/[slug]/page.tsx (35 l) | export const dynamicParams = false (l.8); generateStaticParams over works (l.10-12); generateMetadata reads w.study.summary.en (l.21); renders SubForm slug |
| /about | src/app/about/page.tsx (22 l) | renders AboutJourney; description = identity.summary.en |
| /styleguide | src/app/styleguide/page.tsx (19 l) + StyleguideSheet.tsx (357 l) | robots index:false; not in sitemap; disallowed in robots.ts |
| 404 | src/app/not-found.tsx (45 l) | "use client", useDict, Field/Perforation/Stamp/TransitionLink |
| /icon, /opengraph-image, /work/[slug]/opengraph-image | icon.tsx, opengraph-image.tsx, work/[slug]/opengraph-image.tsx | next/og ImageResponse |
| /robots.txt, /sitemap.xml | robots.ts, sitemap.ts | see §7 |

No loading.tsx, error.tsx, middleware, route handlers, parallel or intercepting routes exist. Every page is prerendered (no dynamic APIs used).

### 1.2 The shell: layout.tsx → template.tsx → page

src/app/layout.tsx (155 l), server component:
- l.35-41 Archivo via next/font/google: subsets ["latin"], weight "variable", axes ["wdth"], variable "--font-archivo", display "swap"; applied as html className={archivo.variable} (l.138).
- l.50-93 metadata: metadataBase new URL(SITE), title {default: META.title, template: titleTemplate}, description, applicationName siteName, authors, creator, keywords (15 strings, l.60-76), openGraph {type "website", locale META.ogLocale, alternateLocale siteMeta.it.ogLocale, siteName, description} deliberately WITHOUT url/title at root (comment l.77-80: they would inherit into every child and canonicalize everything as the homepage), twitter {card "summary_large_image", description}, robots {index, follow}.
- l.97-124 personJsonLd (Person: name, jobTitle "Software & AI Engineer · Creative Lead", url SITE, worksFor Sersan Limited https://sersan.io, alumniOf University of Camerino, affiliation University of Trento, knowsAbout 5 items, sameAs linkedin + github) injected at l.148-151.
- l.126-132 viewport: themeColor "#f5f4ef", colorScheme "light", width device-width, initialScale 1, viewportFit "cover".
- Body order (l.139-152): Preloader → Smooth → CoverOverlay → HeaderStrip → PhaseBand layoutMount → {children} → JSON-LD script. html lang="en" is the SSR default; Smooth rewrites it at runtime.

src/app/template.tsx (15 l): export default Template wraps children in RouteTransition. Comment l.8-11 records the Next semantics that matter: the ROOT template is keyed by the TOP-LEVEL segment, so it remounts on / ↔ /about ↔ /work but NOT on /work → /work/<slug>. This is why RouteTransition keys its enter on usePathname().

### 1.3 The navigation handshake (exit → push → enter)

Three files plus one artwork module. The mechanics are hard-won (comments in each file say "unchanged from the Continuous Curtain") and world-neutral; the artwork is the job-order paper sheet.

TransitionLink (src/components/transition/TransitionLink.tsx, 66 l) — drop-in next/link:
- handleClick l.46-63: calls the caller's onClick first, bails if defaultPrevented; bails on button !== 0 or any modifier (l.49); only string hrefs starting with "/" (l.50); bails on target other than _self (l.51-52); targetPath = href.split(/[?#]/)[0] || "/" and bails when targetPath === pathname (l.53-54: hash-only hops do not remount the template, so no enter would ever lift a cover).
- l.57 stashFlip(e.currentTarget) BEFORE the cover starts; l.58 coverAndNavigate(() => router.push(href)) → preventDefault when handled, else dropFlip() (l.61) and the plain Link navigates.
- Consumers: PhaseBand, not-found, SubForm, WorkTable (grep-verified).

CoverOverlay (src/components/transition/CoverOverlay.tsx, 166 l) — the EXIT half, mounted ONCE in layout.tsx:
- Module state l.61-62: let controller: Controller | null, let navigating = false (the latch).
- export coverAndNavigate(navigate) l.69-75: returns true and swallows the click while navigating; returns false when no controller is mounted (caller falls through to plain Link); else sets navigating = true and controller.cover(navigate).
- Controller (type l.55-59): cover(onCovered), handoff(), bail().
- cover l.106-117: stop() previous, setInert(true) on the element matching "[data-page-root]" (l.95-96 toggles the inert attribute), tl = coverTimeline(els, () => { onCovered(); timeout = gsap.delayedCall(2.5, () => controller?.bail()) }). The 2.5 s is the bail window for a push that never lands.
- handoff l.118-128: if (tl && tl.isActive()) return (a newer cover is in flight for another nav — do not kill it); stop(); navigating = false; setInert(false); clearSheet(els) — INSTANT clear, because the entering route already painted an identical cover beneath.
- bail l.129-135: stop, unlatch, un-inert, dropFlip(), retractTimeline(els) then clearSheet.
- l.150-156 passive useEffect on pathname: skips the first run, then controller?.handoff(). Passive = runs AFTER the enter's layout effect (which snapped its own sheet to covered pre-paint), so there is no uncovered frame.
- Host markup l.158-164: div#exit-cover aria-hidden className SHEET_HOST_CLASS (pointer-events-none fixed inset-0 z-[var(--z-cover)] overflow-hidden) containing the sheet div (SHEET_CLASS, style SHEET_REST_STYLE) and the rule div (RULE_CLASS, RULE_REST_STYLE). The SHEET itself takes pointer-events while covering (coverTimeline sets sheet.style.pointerEvents = "auto", sheet.ts l.102) so the covered region swallows clicks; keyboard/AT is stopped by inert on the page root.

RouteTransition (src/components/transition/RouteTransition.tsx, 160 l) — the ENTER half, rendered by template.tsx:
- l.22 module-level let firstMount = true: the first hard load is skipped (l.85-89: clearSheet and return) because the Preloader owns it.
- useGSAP(..., { dependencies: [pathname], scope: ref }) l.70-141. With a dependency array, useGSAP defers context cleanup to unmount, so each run retires the previous Run (l.73-79: alive.v = false, lateSnap.kill, tl.kill).
- Hash handling l.90-104: reads window.__lenis; snapToHash() = lenis.scrollTo(target ?? 0, { immediate: true }) — NOTE this scrolls to 0 on EVERY non-hash navigation, including browser back; re-snaps on document.fonts.ready and via gsap.delayedCall(1.4, snapToHash) when a hash is present (~1300 px font drift was measured in prod).
- l.108-109 setCovered(els) + gsap.set(el, { autoAlpha: 0 }) in the layout effect = pre-paint.
- Timeline l.112-127: onComplete → clearSheet, clearProps opacity/visibility on the page root, final snapToHash if hash, ScrollTrigger.refresh(true) (a bare refresh() would reflow mid-Lenis-glide, comment l.39-40). Body: page autoAlpha 0→1 in 0.18 s (0.15 reduced) at 0, liftTimeline(els) at 0, .call(() => playFlip(), [], 0.02).
- Markup l.143-158: its own SHEET_HOST_CLASS host with the same two elements (so the hand-off frame is pixel-identical to the exit cover; DOM order puts the enter above the exit), then div ref data-page-root wrapping children (l.155).

sheet.ts (src/lib/sheet.ts, 245 l, "use client") — artwork + timelines + Flip hand-off:
- Exports: SHEET_CLASS "absolute inset-0 bg-paper" (l.32), RULE_CLASS "absolute left-0 top-0 h-px w-full bg-ink" (l.34), SHEET_HOST_CLASS (l.36-37), SHEET_REST_STYLE { transform: "translate3d(0,-100%,0)" } (l.44-46), RULE_REST_STYLE { opacity: 0 } (l.61), type SheetEls { sheet, rule } (l.63-66), prefersReduced() (l.72-77, matchMedia per call), clearSheet (l.80-84), setCovered (l.87-90), coverTimeline (l.97-130), retractTimeline (l.133-145), liftTimeline (l.151-178), stashFlip (l.200-213), dropFlip (l.216-218), playFlip (l.224-245).
- THE Y0 PERCENT TRAP, l.48-60: GSAP reads the element's CURRENT transform from computed style, where the SSR inline translate3d(0,-100%,0) has already been resolved to pixels, so it is parsed as y: -<viewport>px and every later yPercent is ADDED on top → the sheet sits one viewport too high and never covers. Fix: const Y0 = { y: 0 } (l.60) spread into every set/fromTo that touches yPercent (l.81, 88, 106, 120, 159, 166). Any port overlay that SSRs a percent transform inherits this rule; the safer SSR rest state is visibility:hidden (autoAlpha 0) with no inline translate.
- Durations/eases: DUR.sheet 0.42 with EASE.sheet ("sheet" CustomEase 0.65,0,0.35,1); rule travels window.innerHeight + 1 px (l.69); reduced motion = 150 ms (DUR.swap) opacity swap, no rule, no travel (l.103-114, 136-140, 153-162).
- Flip hand-off l.180-245: contract data-flip-id="work-title-<slug>" on the row title (WorkTable.tsx l.215) and on the sub-form h1 (SubForm.tsx l.171) and the next-link span (SubForm.tsx l.382). stashFlip captures Flip.getState(el) with a 3000 ms TTL (STASH_TTL_MS l.195), skipped under reduced motion; playFlip finds the target by CSS.escape'd attribute selector and runs Flip.from(state, { targets, duration: DUR.sheet, ease: EASE.sheet, absolute: true, scale: true }) inside try/catch. It flips the DOM heading itself — no image, no crop math.

### 1.4 Scroll and Lenis across routes
- Lenis is created once in Smooth.tsx (layout) and survives navigations; there is no per-route Lenis. Pages only call window.__lenis.scrollTo (RouteTransition, PhaseBand.tsx l.76 with { offset: BAND_OFFSET } where BAND_OFFSET = -56 in src/lib/phases.ts l.29, and the gate scripts).
- ScrollTriggers are created per component (usePhaseStamps.ts l.110 once:true; useRowStagger.ts l.44 once:true start "top 85%"; RuleIn/Stamp/MeasuredRow similarly) and die with their components on the template remount. ScrollTrigger.refresh(true) is called only at the END of the enter lift (RouteTransition l.117) and by usePhaseStamps on fonts.ready (l.122) and a 160 ms debounce (l.133).
- Scroll restoration on browser back: the enter's snapToHash forces scrollTo(0) when there is no hash (l.93-99), so Next's own popstate scroll restoration is effectively overridden today — every arrival opens at the top. There is no stored origin anywhere.

### 1.5 How the cover knows the destination
It does not. coverAndNavigate only receives the navigate closure; the exit cover is destination-agnostic (a flat sheet). The enter learns the route from usePathname(). The only destination-specific signal is the Flip stash (a DOM element state keyed by data-flip-id). The prototype's S5 needs a destination label + sub (data-pt-label / data-pt-sub on the link, fx-nav.js l.536-537) and S4 needs the tile image, its rect, the rail position and the destination hero rect (fx-nav.js flipForward l.418-476, lastOrigin l.446-452).

### 1.6 Reduced-motion path
- prefersReduced() is checked per call in sheet.ts; TransitionLink still routes through the cover under reduced motion (comment l.24-27) so latch/inert/bail behave identically; coverTimeline/liftTimeline become 150 ms opacity swaps; stashFlip/playFlip are no-ops (l.202, l.227).
- Smooth.tsx (l.47) creates NO Lenis under reduced motion: window.__lenis is absent and native scroll is used; the gate scripts fall back to window.scrollTo. html[data-motion="reduced"] is set (Smooth l.38) and globals.css l.104-117 zeroes --dur-stamp/rule/sheet/print in both the attribute and media-query tracks.

### 1.7 Judgement: can this host S4 (match cut) and S5 (column wipe) in the SPA?

S5 "Tendina" — YES with a rewrite of sheet.ts and a small controller change. The exit/enter split, the pre-paint snap-to-covered, the instant hand-off, the latch, inert, the 2.5 s bail and the reduced-motion swap all map 1:1 onto cover()/uncover() of fx-nav.js (l.309-350): coverTimeline becomes the columns rising from the centre with the label rising in its mask (0.5 s + 0.6 s, commit at 0.7 s), liftTimeline becomes the columns leaving from the edges while the title rises. What must change: (a) SheetEls grows from {sheet, rule} to {cols[10], label, sub, mark, sheet, img, imgTag}; (b) both hosts must render the SAME column markup so the hand-off frame is identical, and setCovered must set cols yPercent 0 AND print the label text pre-paint — the enter can derive label/sub from pathname (works.find for /work/<slug>, dict for /work, /about) or receive them through the controller; (c) the SSR rest state of the columns must be visibility:hidden, not an inline translate percent (Y0 trap); (d) the exit host needs a z-order above the header (the proto's columns cover the header; the header is chrome in layout, so --z-cover 40 above --z-band 20 already does this).

S4 "Stacco" forward (tile → case hero) — YES, and the SPA makes it SIMPLER than the prototype, with three real changes:
1. The travelling image must live in the persistent CoverOverlay host (layout.tsx), not in RouteTransition: the proto needs sessionStorage rv-pt + a data-URL hand-over + CSS variables at first paint (head.html l.24-31, a-overlays.html) only because each page is a new document; in the SPA the overlay element, its clip-path inset and its transform survive router.push, so the one-image move can be a single GSAP tween that keeps running across the route swap. The push can commit as soon as the paper sheet has fully covered (proto: sheet clip-path 0.12→0.72 s; commit at 0.8 s, l.470-472), i.e. the existing "onCovered → navigate" hook still fits.
2. The destination hero rect is unknown until the case page mounts. The proto guesses (localStorage rv-hero-rect|path|v|w×h cache, else a 16:9 estimate at 0.69 vh, l.353-364) and then settles under 2 px on arrival. The SPA can do better: the enter's layout effect (RouteTransition, keyed on pathname, pre-paint) measures [data-case-hero] and hands the true rect to the controller, which retargets the in-flight tween once (GSAP allows a second .to on the same object with overwrite). Keep the proto's cache as the FIRST target so the image starts moving before the RSC push lands (prefetched static routes land in tens of ms; the 2.5 s bail remains the safety net).
3. The swap must wait for the real hero image to be PAINTABLE: proto arrive() awaits real.decode() raced with 900 ms, then one rAF, hides the host until the overlay is at rest, then swaps in one frame and hides the overlay (l.665-708). RouteTransition's onComplete is the right hook, but its current body (clearSheet + refresh) must become "await decode → measure → swap → clearOverlays". Its sheet-lift must NOT play on a flip arrival (proto FIX D5: the sheet hides when the title rises).
Constraint from content: only sersan-io and spherenode have a capture (src/content/works.ts capture field; public/captures/*-800.webp and *-1600.webp). flipForward returns false without an image (l.421), so S4 is possible for exactly two rows today; the other seven must fall back to S5. The srcset stem rule (fx-nav.js l.59) already tolerates 800 vs 1600.

S4 back (case hero → the same tile at the same rail position) — POSSIBLE but this is where the current mechanism must change the most:
- Browser back does not pass through TransitionLink: popstate → Next navigates → CoverOverlay's pathname effect → handoff() clears; the enter plays a plain lift. There is no exit animation and no origin record. A data-back link (proto flipBack l.482-520) can go through TransitionLink, but the back BUTTON needs a popstate listener (or Next's router events are not available; window "popstate" fires before Next commits) that starts the reverse cut from the hero's visible slice (ratioOf ≥ 0.2, l.489) — optional; the minimum is a correct arrival.
- The origin must be recorded at click time (proto lastOrigin l.446-452: tileId, rect in document coords, railLeft, railP, scrollY, variant, vw, vh, t) — in the SPA a module-level variable in sheet.ts plus sessionStorage "rv-origin" for hard reloads; validity 10 min, same viewport size.
- On arrival at "/", the enter must: create the rail's pinned ScrollTrigger, ScrollTrigger.refresh() SYNCHRONOUSLY, lenis.scrollTo(scrollY, {immediate, force}) + window.scrollTo, ScrollTrigger.update(), set the rail progress (proto FX.scroll.restore({y, railP}) l.662, setRailProgress l.691), decode the tile image, one rAF, re-check |scrollY − yT| > 2 and re-apply, THEN measure the tile and fly the overlay once; if the tile is more than 40 px from where it was left, dissolve instead of sliding (l.700-708). Today the enter does the opposite (scrollTo(0) first, refresh(true) LAST). So RouteTransition's snapToHash must become "restore origin if present, else hash, else 0", and refresh must move BEFORE the scroll on back-arrivals.
- Next's own scroll restoration will race with this: verify in Next 16 whether the App Router restores scrollY on popstate before or after the template's layout effect (open question). Lenis with immediate+force wins once it runs, but a later native restore would move the page under a settled overlay.
- Rail position in a pinned horizontal rail is a function of scrollY (ScrollTrigger scrub), so railP and scrollY are one number; storing both (as the proto does) covers a rail implemented with a real overflow-x scroller too (proto scroller() l.78-86).

Bottom line: keep TransitionLink + CoverOverlay + RouteTransition + the layout/template split; rewrite sheet.ts entirely (artwork, richer SheetEls, a "kind" — cols | flip | flip-back — on the controller, an origin store); change RouteTransition's scroll handling and the flip arrival; add the popstate/back path. The Flip plugin hand-off (stashFlip/playFlip on data-flip-id) does not do the S4 crop math (object-fit cover → coverXf, fx-nav.js l.69-75) and should be replaced by the proto's viewport-covering img + clip-path inset, not extended.

---

## 2. Smooth.tsx (src/app/_providers/Smooth.tsx, 66 l) — keep

- "use client", renders null, mounted once in layout.tsx (l.141 of layout).
- l.29-31 document.documentElement.lang = locale on every locale change (useUI locale).
- l.33-63 one effect: mq = matchMedia("(prefers-reduced-motion: reduce)"); apply() sets store reducedMotion and toggles html data-motion="reduced" (l.36-40); listens to mq "change".
- Lenis only when !mq.matches (l.47-54): new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 }); lenis.on("scroll", ScrollTrigger.update); tick = t => lenis.raf(t * 1000) added to gsap.ticker; gsap.ticker.lagSmoothing(0); window.__lenis = lenis. No autoRaf, no lenis.css import (node_modules/lenis/dist/lenis.css exists but nothing imports it; globals.css has no .lenis-* rules; the proto loads lenis.css from jsDelivr — the port needs it only if it uses lenis.stop()/.lenis-stopped for a menu).
- Cleanup l.56-62: remove listener, remove data-motion, ticker.remove(tick), lenis.destroy(), delete window.__lenis.
- No ScrollTrigger.scrollerProxy (Lenis drives native scroll, so ScrollTrigger works unmodified); no ScrollTrigger.refresh here — refresh happens in RouteTransition onComplete (l.117), usePhaseStamps (fonts.ready l.122, 160 ms debounce l.133) and nowhere else. ScrollTrigger.defaults are untouched.
- Dependencies of the gate scripts on window.__lenis: visual-gate.mjs l.128-130, a11y-gate.mjs l.85-87, wp10-evidence.mjs l.74-76, _recapture.mjs l.63-64, 75-76 (all fall back to window.scrollTo). The port must keep the name __lenis and the signature scrollTo(y, { immediate, force }).

---

## 3. The store (src/store/ui.ts, 61 l) — keep, extend

- zustand 5.0.14 create<UIState>()(persist(...)); name "ocean-ui" (l.55) — LOAD-BEARING legacy key, never rename without migration; storage createJSONStorage(() => localStorage) (l.56); partialize s => ({ locale: s.locale }) (l.58) — ONLY locale is persisted. Persisted JSON shape is {"state":{"locale":"it"},"version":0} — wp10-evidence.mjs l.54 writes exactly that to seed IT.
- State (l.28-40): locale: "en" | "it" (default "en"), reducedMotion: boolean (runtime; initialReducedMotion l.13-16 resolved from matchMedia at module load so first client render is correct), loaded: boolean (set true by Preloader.unlock), actions setLocale, toggleLocale, setReducedMotion, setLoaded.
- Type Locale exported (l.6); used by use-hydrated.ts, LocaleToggle, StyleguideSheet.
- Hydration pattern src/lib/use-hydrated.ts (35 l): useHydrated() = useSyncExternalStore(emptySubscribe, () => true, () => false) — false during SSR and the hydration render, true after; useHydratedLocale() returns "en" until hydrated, then the store locale. Rule (comment l.8-15, 25-30): any RENDER-TIME branch that changes markup shape per locale or per reducedMotion must go through these hooks or React discards the hydration; string-only differences via useDict() are fine because the SSR HTML is EN and the persisted locale re-renders after hydration. Consumers: LocaleToggle (aria-pressed and the sliding block), StyleguideSheet, usePhaseStamps (useHydrated).
- What the rivista needs that is absent: menu open state (the proto's mobile menu, closeMenu in go()), a navigation lock (proto FX.lock/unlock and state.busy — today that is the module-level navigating latch in CoverOverlay, fine to keep there), maybe variant (not needed: V1 is fixed).

---

## 4. dict.ts mechanism (src/content/dict.ts, 690 l) — keep the mechanism, replace the sections

- "use client"; imports z from "zod" (4.4.3) and useUI.
- l.27-272 const sectionSchema = z.object({...}) with nested z.object per section: strip, header, phases (six localizedPhase {name, roleTag}), band, intake, bench (readouts/values/tier objects), diagnosis, estimate, work, measured, subform, release, about, notFound, a11y {skip, skipMain, langToggle}, meta {title, description}, styleguide (large), footer {copyright}. Every leaf is z.string().
- l.274 export type Dict = z.infer<typeof sectionSchema>; l.276-277 export const PHASE_IDS / PhaseId (consumed by src/lib/phases.ts only); l.279 const EMAIL = "albertotuveri@gmail.com".
- const en: Dict = {...} (from l.281) and const it: Dict = {...}: the TYPE annotation is the compile-time parity check (a missing or extra key in an object literal fails tsc). l.679-682 dev-only runtime guard: if (process.env.NODE_ENV !== "production") { sectionSchema.parse(en); sectionSchema.parse(it); } — runs at module evaluation on both server (SSR in dev) and client; a drift throws and crashes the page in dev. Note zod's z.object strips unknown keys, so an EXTRA key is only caught by TypeScript, and z.string() accepts "" so an empty translation passes both.
- l.684 export const dict: Record<"en"|"it", Dict> = { en, it }; l.687-690 export function useDict(): Dict { const locale = useUI(s => s.locale); return dict[locale]; }.
- Server components cannot import it ("use client"): metadata reads src/lib/site.ts siteMeta, which dict.meta mirrors by hand (site.ts l.41-46).
- Second parity gate at runtime: scripts/probes/wp10-evidence.mjs counts visible text nodes per route × viewport × locale (TEXT_FN l.88-102) and reports enCount/itCount, identical, onlyEn/onlyIt — not an exit-1 gate, a report.
- Splitting into per-section files without breaking parity: each file src/content/dict/<section>.ts exports schema = z.object({...}), en: z.infer<typeof schema>, it: z.infer<typeof schema>; the root src/content/dict.ts composes sectionSchema = z.object({ nav: nav.schema, hero: hero.schema, ... }), builds en = { nav: nav.en, hero: hero.en, ... } and it likewise, keeps the Dict type, the dev parse, dict and useDict unchanged. Typing each section's en/it with the inferred type keeps the tsc check per file; the composed parse keeps the runtime check. Two gates must follow: scripts/check-claims.mjs CONTENT_FILES (l.22) is a hard-coded list of four paths — every new dict file must be added (or the list turned into a glob), and the "use client" directive must sit in the root and in every section file that is imported directly by a client component. Keep meta in site.ts + dict in sync by hand as today.

---

## 5. Fonts

Today: Archivo only. layout.tsx l.35-41 → CSS variable --font-archivo on html; globals.css l.37-40 @theme inline { --font-*: initial; --font-sans: var(--font-archivo), "Arial Narrow", Arial, sans-serif; } so Tailwind emits font-sans; body font-family: var(--font-sans) (l.129) with font-variation-settings "wdth" 100 (l.130); the .f-* scale (l.213-284) sets wdth 125/112/100/87/75 per role. The wdth axis and every "wdth" declaration are Archivo-specific and go.

Switch to Cormorant Garamond + Figtree via next/font/google (verified in next/dist/compiled/@next/font/dist/google/font-data.json at this install):
- "Cormorant Garamond": weights 300,400,500,600,700 + "variable"; styles normal + italic; axes wght 300–700; subsets cyrillic, cyrillic-ext, latin, latin-ext, vietnamese.
- "Figtree": weights 300–900 + "variable"; styles normal + italic; axes wght 300–900; subsets latin, latin-ext.
- The V1 prototype uses (public/proto/rivista/fx-fonts.css, tabulated): Cormorant Garamond normal 300/500/600 and italic 500; Figtree normal 300/400/500/600. Tokens in fx-core.css l.29-52: --f-display "Cormorant Garamond", --f-text "Figtree", --f-orn Cormorant italic 500, --w-display 500, --w-hero 600, --lh-display 0.92, --tr-hero -0.01em, --ch-t 0.638em, --ch-d 0.477em (measured "0" widths so ch measures do not change on fallback swap).
- Concrete next/font calls: Cormorant_Garamond({ weight: "variable", style: ["normal", "italic"], subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-display" }) — with "variable" Next loads the wght range so 300/500/600 all resolve from one file per style; Figtree({ weight: "variable", style: ["normal"], subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-text" }). Both class variables go on html (layout.tsx l.138 pattern) and globals.css @theme inline maps --font-display / --font-text (or --font-sans / --font-serif) to them. next/font self-hosts at build (no runtime fonts.gstatic requests, no preload script like head.html l.33-39), emits preload links and a size-adjusted fallback (adjustFontFallback default true) so the hand-made "CG Fb"/"Figtree Fb" @font-face overrides in fx-core.css l.17-20 are not needed. Italian accents are in the latin subset. Import names use underscores: Cormorant_Garamond, Figtree.
- OG / Satori constraint: src/app/fonts/og-fonts.ts (79 l) reads static TTFs from src/app/fonts (join(process.cwd(), "src", "app", "fonts") l.39) — Satori cannot read variable axes nor woff2 (comment l.7-13). FILES l.30-34 = ArchivoWide 800, ArchivoCond 700, Archivo 400; type OgFont.weight is 400 | 700 | 800 (l.26); OG_FAMILY {wide, cond, body} (l.64-68); OG_COLOR sheet hex (l.71-79). The port needs static instances of the new faces (google/fonts ships both as variable TTFs per next/font data, so instance with fontTools varLib.instancer as README.md l.13-15 documents: e.g. cormorant-600.ttf, cormorant-italic-500.ttf, figtree-400.ttf, figtree-600.ttf), a rewritten FILES/OG_FAMILY/OG_COLOR, the weight union widened, and the README's provenance/licence table redone (Cormorant Garamond: OFL; Figtree: OFL). Loading degrades to the built-in face if files are missing (l.51-53), never fails the route.
- check-claims: font weights are numbers inside src/app/fonts (not scanned) — no impact.

---

## 6. globals.css (src/app/globals.css, 422 l) and tokens.ts

Structure:
1. l.1 @import "tailwindcss" (Tailwind 4.3.2 via @tailwindcss/postcss, postcss.config.mjs).
2. l.21-34 @theme { --color-*: initial; + 11 sheet colours } — the WHOLE palette is world-specific: paper #f5f4ef, paper-field #ebe9e1, paper-carbon #dcd9cf, ink #141414, graphite #5a5a57, graphite-deep #4a4a47, stamp #b40f29, stamp-deep #8a0a1f, safety #ffc400, oil #c98a2a, rule-soft rgb(20 20 20 / 0.22). The V1 palette to replace it (fx-core.css l.29-40): --paper #f6f3ec, --paper-deep #ede7dc, --ink #24211e, --graphite #48443e, --stone #6b665d, --line #dcd5c8, --accent #2340c9, --accent-dark #1a2f99, --on-accent #ffffff. The "--color-*: initial" reset is infrastructure worth keeping (no stray gray-500).
3. l.37-40 @theme inline font mapping — rewrite (see §5).
4. l.43-82 :root: color-scheme light (keep); C.4 spacing --gutter clamp(1.25rem, 3.3vw, 3rem), --col 12, --row 8px, --cell-h 56px, --band-h 56px, --field-pad, --caption-h 24px, --section-gap clamp(2rem, 8vh, 6rem), --section-gap-after 2rem, --measure 68ch, --bench-w 760px, --bench-h 540px, --bench-ratio 760 / 540 (all world-specific); z scale l.62-68 (--z-sheet 0, --z-bench 1, --z-band 20, --z-loupe 30, --z-cover 40, --z-preloader 50, --z-skip 60 — the LADDER is infrastructure: cover < preloader < skip; rename the members); easing/durations l.71-81 (--ease-rule, --ease-stamp, --ease-sheet, --ease-hover, --dur-hover 120ms, --dur-swap 150ms, --dur-text 180ms, --dur-stamp 220ms, --dur-rule 320ms, --dur-sheet 420ms, --dur-print 500ms) — mirrored by src/lib/motion.ts DUR/EASE and src/lib/gsap.ts CustomEases; replace the set together (the proto registers "domus" and "domus.inOut" CustomEases in fx-core.js).
5. l.83-94 mobile overrides of the same variables — world-specific.
6. l.96-117 reduced motion, two tracks (:root[data-motion="reduced"] and @media) — infrastructure; keep the pattern, rename the variables.
7. l.120-139 html/body base: overflow-x: clip (l.126, comment: never hidden, it would kill sticky/Lenis) — keep; body font stack, tabular-nums, font-feature-settings, antialiasing (keep), caret-color stamp (recolour).
8. l.141-205 @layer base: text-wrap balance/pretty (keep); ::selection ink/paper (recolour; proto: accent/paper); focus-visible ring 2px safety + 1px ink inner box-shadow, radius 0 (l.161-166) and the yellow-region inversion (l.168-172) — world-specific; proto: outline 2px accent, offset 3px (fx-core.css l.181); skip-target no-ring rule for main/section[tabindex="-1"] (l.177-181) — keep; scrollbar rules (l.183-200) — keep pattern, recolour; a { color: inherit; text-decoration: none } (l.201-204) — keep.
9. l.212-401 @layer components: the .f-* type scale (l.213-284, wdth-based), .sheet, .grid-12, .field, .fields, .field-caption, .rule-top/.rule-bottom/.rule-soft, .perforation (+::before/::after), .band-h, .cell-h, .bench-box (l.356-364, unitless aspect-ratio note), .stamp/.stamp--filled, .link, .row-hover — ALL world-specific.
10. l.403-422 .preloader shell: fixed inset 0, z --z-preloader, background paper, animation preloader-failsafe 0.4s var(--ease-sheet) 3s forwards; @keyframes to { transform: translateY(-100%); visibility: hidden } — the FAILSAFE is infrastructure (the page must never stay trapped without JS); keep with the new artwork.

src/content/tokens.ts (42 l): palette (11 hex, l.10-32), type PaletteToken, oilLinear [0.79, 0.54, 0.16] (l.41). Consumers (grep): palette → src/app/styleguide/StyleguideSheet.tsx ONLY; oilLinear → nobody (fluid.wgsl.ts carries its own literals). So tokens.ts is currently a documentation mirror with one consumer; the port rewrites it with the V1 tokens or drops it with the styleguide.

---

## 7. SEO / metadata / OG / icon / sitemap / robots

Keep (world-neutral):
- src/lib/site.ts (78 l): resolveSite() order NEXT_PUBLIC_SITE_URL → VERCEL_PROJECT_PRODUCTION_URL → VERCEL_URL → http://localhost:3000 with a console.warn in production (l.16-36); SITE (l.39), siteName "Alberto Tuveri", defaultLocale "en", siteMeta en/it {title, description, ogLocale en_US/it_IT} (l.62-75), titleTemplate "%s — Alberto Tuveri" (l.78). Only the description WORDING may change with the new copy.
- layout.tsx metadata block and the root-level "no canonical/og:url" rule (l.77-80); personJsonLd (CV facts only).
- Per-route metadata exports in page.tsx (canonical "/", og url "/"), work/page.tsx (canonical "/work"), about/page.tsx (canonical "/about", description identity.summary.en), work/[slug]/page.tsx (generateMetadata: canonical and og url /work/<slug>, description study.summary.en, twitter card).
- src/app/sitemap.ts (24 l): 12 URLs — "/" priority 1, "/work" 0.9, worksConfirmed slugs 0.7, "/about" 0.8; lastModified = new Date() at build; changeFrequency "monthly"; styleguide excluded on purpose.
- src/app/robots.ts (14 l): allow "/", disallow "/styleguide", sitemap SITE/sitemap.xml, host SITE. If /styleguide is deleted, drop the disallow.
- og-fonts.ts loading mechanism (read once per process, graceful fallback).

Redraw (job-order artwork):
- layout.tsx viewport.themeColor "#f5f4ef" (l.127) → the V1 paper #f6f3ec.
- src/app/icon.tsx (52 l): 32×32 safety-yellow square, 2px ink frame, band rule at top 9, stamp square bottom-right — all OG_COLOR.safety/ink/stamp.
- src/app/opengraph-image.tsx (189 l): header strip "Sersan Limited · London · Remote" / "Sep 2026" / "Status · OPEN" (l.49-82), caption "Job order", the name at 136px ArchivoWide, role lines, the safety band with the six PHASES and INTAKE stamped rotated -3.5deg, "1 / 6" counter (l.124-184). alt = siteMeta.en.title (keep).
- src/app/work/[slug]/opengraph-image.tsx (204 l): paper-carbon ground, strip "Alberto Tuveri · Job order", "Work performed" + WORK stamp, title at 104/78px, "Measured" first pair via firstMeasured() (l.19-21, keep the data logic: before → after + unit, label.en, source.en, "—" when none), safety footer with /work/<slug>. alt "Work performed — Alberto Tuveri".
- og-fonts.ts OG_FAMILY/OG_COLOR/FILES and src/app/fonts/*.ttf + README.md (see §5).

---

## 8. Scripts and gates — what each assumes about the DOM

scripts/visual-gate.mjs (158 l) — keep unchanged:
- CLI l.3: node scripts/visual-gate.mjs <wp> [route ...] [--reduce] [--nogpu] [--base=URL]; routes accepted without leading slash (Git Bash MSYS path conversion, l.30-35); default route "/".
- Env: BASE_URL (default http://localhost:3000), GATE_MAX_STEPS (default 14), GATE_SETTLE_MS (default 900).
- Browser l.62-66: chromium.launch({ channel: "chrome", headless: true, args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan", "--ignore-gpu-blocklist"] }).
- VIEWPORTS l.46-49: desktop 1440×900 DPR1 no touch; mobile 390×844 DPR2 isMobile hasTouch. Context: reducedMotion "reduce" with --reduce, colorScheme "light".
- Init script l.81-93 (runs before parse): sessionStorage.setItem("at-preloader-seen", "1"); with --nogpu defines navigator.gpu getter → undefined.
- Console capture l.98-110: relevant errors (type "error"), warnings (type "warning"), pageerror, requestfailed except ERR_ABORTED; IGNORE regexes l.52-58: React DevTools, [Fast Refresh], THREE.Clock, Image with src, Extra attributes from the server.
- Flow l.112-136: goto networkidle (60 s), await document.fonts.ready, wait SETTLE_MS, total = scrollHeight, steps = min(MAX_STEPS, max(1, ceil(total / vp.height))), per step y = min(i*vh, max(0, total − vh)); scroll via window.__lenis.scrollTo(y, { immediate: true, force: true }) else window.scrollTo(0, y); wait SETTLE_MS; viewport screenshot to .shots/<wp>/<slug>-<vp>-NN.png (routeSlug: "/" → home, else non-alphanumerics → "_").
- Exit l.152-158: writes .shots/<wp>/gate-report.json; exit 1 when relevantErrors > 0 (errors only; warnings are printed, not counted).
- DOM assumptions: at-preloader-seen key skips the preloader (Preloader.tsx SEEN_KEY l.31 + SKIP_SCRIPT l.32); window.__lenis with scrollTo(y, opts). Nothing else.

scripts/check-claims.mjs (112 l) — keep, update lists:
- CONTENT_FILES l.22: dict.ts, works.ts, findings.ts, career.ts (skills.ts NOT scanned).
- Truth l.25-32: PRODUCT.md slice from "## 3." to "## 4." plus "## 9." to end; numbersIn regex /\d+(?:[.,]\d+)*/ normalised (thousands separators stripped, decimal comma → point, %/$/€ dropped, l.44-51); spelled-out numbers via WORDS map EN + IT (l.35-41).
- Scan l.87-106: stripComments (block + whole-line //), token regex (?<![A-Za-z])\d+(?:[.,]\d+)* (digits glued to a letter are identifiers), skips YEAR /^(19|20)\d{2}$/, WHITELIST l.66-75 ("6", "4", "1600", "1000", "4.5", "1.18", "3.5" — all job-order figures to prune), and isTech (preceded by React|Next.js|Postgres|PostGIS|Tailwind v|ES|Dynamics|Angular|Sentry ×|three |Serwist|-|/|_ and not followed by → , l.99). Prints MISS file:line "raw" context; exit 1 on any miss.
- For the port: add every new content/dict file to CONTENT_FILES; any UI figure (e.g. an index "01", a year in a caption is fine, image widths after "-" are tech) must be in PRODUCT.md or whitelisted with a comment.

scripts/probes/a11y-gate.mjs (139 l) — keep, edit ROUTES:
- CLI: [--base=] [--reduce] [--nogpu] [--routes=a,b]; default ROUTES l.23: "/,/work,/work/sersan-io,/work/sphere-ai,/about,/styleguide,/no-such-page-404".
- Same Chrome args and viewports as the gate; same init script (at-preloader-seen, nogpu).
- Flow l.78-102: goto networkidle, fonts.ready, wait 2000, walks the page one innerHeight at a time via __lenis (250 ms each), to bottom, back to 0, wait 800, reads html lang, injects axe-core 4.10.2 from cdnjs (l.28), axe.run with tags wcag2a, wcag2aa, wcag21aa, wcag22aa, best-practice (l.29).
- Output .shots/wp10/axe/<slug>-<vp>[-reduce][-nogpu].json + summary json; exit 1 if any serious or critical node.
- Note: the walk uses ONLY __lenis; under --reduce there is no Lenis so it falls back to window.scrollTo — fine.

scripts/probes/wp10-evidence.mjs (282 l) — keep, edit selectors/routes:
- ROUTES l.21 (same seven incl. /styleguide); makeCtx l.40-65 seeds at-preloader-seen AND localStorage "ocean-ui" = {"state":{"locale":<en|it>},"version":0}; settle() l.67-85 walks the page via __lenis and returns to 0.
- (1) full-page captures per route × vp × locale to .shots/wp10/<slug>-<vp>-<locale>.png, first-viewport-only when scrollHeight × dpr > 16384 (l.151-154), plus .impeccable/review/desktop.png + mobile.png from "/" EN.
- (2) parity l.130-183: TEXT_FN (visible text nodes excluding script/style/noscript/[aria-hidden='true']/.sr-only and display:none/visibility:hidden) and OVERFLOW_FN (page scrollWidth > clientWidth + 1, elements bleeding past the viewport unless position fixed, overflow:hidden boxes clipping text without ellipsis and without canvas/img/svg) → parity.json with enCount/itCount/identical/onlyEn/onlyIt/overflow.
- (3) keyboard l.185-253: 16 Tabs from the top on 5 routes, records tag/text/href/outline/box-shadow/nearest opaque background/size; skip link = FIRST a[href^="#"] in the DOM (l.230), checks the target exists, presses Enter and reads activeElement + scrollY. Assumes the skip link is the first hash anchor on the page and its target carries tabindex=-1 (HeaderStrip.tsx SkipLink l.67-83; main#main tabIndex={-1} in page.tsx l.56, not-found l.20, SubForm l.161).
- (4) degraded l.255-279: reduce + nogpu contexts on "/", waits 2500, screenshots, queries document.querySelector(".bench-box") for canvas/img/text — returns null if the selector is gone (reported, not fatal).
- Gotcha: the whole run is one process over 7 routes × 2 vp × 2 locales; no exit code discipline (informational).

scripts/probes/_recapture.mjs (94 l) — keep, edit ROUTES:
- CEILING 16384 device px (l.12); ROUTES l.13-21 (same seven); VPS desktop/mobile; init at-preloader-seen only; waits 8000 ms on "/" (past the bench settle) else 1200; fullPage when h × dpr ≤ CEILING, else viewport tiles via __lenis into .shots/wp10-fixed/<slug>-<vp>/NN-y<y>.png; also writes .impeccable/review/<vp>.png from "/" at the top; capture-report.json + console.table.

Also coupled to the DOM: scripts/capture-bench.mjs (216 l) waits for window.__heroStore (dev-only handle set in heroStore.ts l.83-85) status "live" and crops .bench-box minus its 1px border (l.137-141, throws if the selector is missing) → public/bench/*.webp + PROVENANCE.md. scripts/capture-sites.mjs is independent of the site DOM.

Keys and names the port must preserve for the gates: sessionStorage "at-preloader-seen"; localStorage "ocean-ui" with the {state:{locale},version:0} shape; window.__lenis.scrollTo(y, {immediate, force}); a first hash anchor as skip link with a tabindex=-1 target; window.__heroStore (dev) if capture-bench stays. The proto's own keys (rv-intro-seen, rv-pt, rv-origin, rv-hero|path) are NOT known to any gate — map the preloader gate to at-preloader-seen rather than adopting rv-intro-seen.

---

## 9. DELETE LIST and KEEP LIST (importers grep-verified)

### Delete — job-order world only

| File | Imported by | Note |
|---|---|---|
| src/components/sheet/HeaderStrip.tsx | layout.tsx | contains SkipLink (route-aware target #phase-work on "/", #main elsewhere, l.67-83) — carry the SkipLink LOGIC into the new header |
| src/components/sheet/PhaseBand.tsx + usePhaseStamps.ts | layout.tsx, page.tsx / PhaseBand | sticky band, stamps, counter, lenis.scrollTo offset |
| src/components/sheet/Stamp.tsx | not-found, StyleguideSheet, TestBench, Release, PhaseBand | |
| src/components/sheet/Field.tsx | not-found, StyleguideSheet, AboutJourney, Intake, JobOrderHeader, SubForm | |
| src/components/sheet/RuleIn.tsx | JourneyTimeline, Footer, Diagnosis, Estimate, Measured, Field, HeaderStrip, SubForm | generic "rule draws then content fades" wrapper — a reveal primitive could be re-expressed, but the verb is job-order |
| src/components/sheet/Perforation.tsx | not-found, StyleguideSheet, Footer, SubForm | |
| src/components/sheet/LocaleToggle.tsx | HeaderStrip | KEEP THE BEHAVIOUR (useHydratedLocale, aria-pressed, lang attr, sr-only a11y.langToggle) — re-skin as the rivista EN/IT control |
| src/lib/phases.ts | page.tsx, Diagnosis, Estimate, Measured, Release, HeaderStrip, PhaseBand, usePhaseStamps, SubForm, WorkIndex | PHASES, phaseAnchor, BAND_OFFSET, STAMP_START, routePhase; also the only consumer of dict PHASE_IDS |
| src/components/sections/JobOrderHeader.tsx, Intake.tsx, Diagnosis.tsx, Estimate.tsx, Measured.tsx, MeasuredRow.tsx, Release.tsx | page.tsx (Release also by AboutJourney, WorkIndex; MeasuredRow also by SubForm) | Measured/MeasuredRow hold the before→after pair rendering of WorkMetric — data model stays in works.ts |
| src/components/sections/useRowStagger.ts | JourneyTimeline, Diagnosis, Estimate, Measured, SubForm, WorkTable | tbody row opacity stagger; world-neutral hook but only table consumers |
| src/components/bench/TestBench.tsx, BenchReadouts.tsx | page.tsx / TestBench | the figure + yellow readouts; the ENGINE HONESTY rule (still labelled, no simulated numbers) should carry over to whatever hosts the fluid |
| src/components/work/WorkTable.tsx, WorkIndex.tsx, SubForm.tsx, Schematic.tsx, Loupe.tsx | page.tsx + WorkIndex / work/page.tsx / work/[slug]/page.tsx / SubForm / SubForm + WorkTable | data-flip-id sites live in WorkTable l.215 and SubForm l.171, 382; Loupe is a world-neutral lens (mask + quickTo) if wanted |
| src/components/about/AboutJourney.tsx, JourneyTimeline.tsx | about/page.tsx / AboutJourney | |
| src/components/footer/Footer.tsx | page.tsx, AboutJourney, SubForm, WorkIndex | uses career.links (keep the data) |
| src/app/not-found.tsx | (route) | rewrite: keep "use client" + useDict + TransitionLink |
| src/app/styleguide/page.tsx + StyleguideSheet.tsx | (route) | if deleted: remove robots disallow (robots.ts l.10), the a11y-gate/wp10-evidence/_recapture ROUTES entries, the dict styleguide block (l.202-266 schema), src/lib/contrast.ts (only consumer) and src/content/tokens.ts (only consumer) |
| src/lib/contrast.ts | StyleguideSheet | AA ratio at runtime; keep only if a rivista styleguide is built |
| src/content/tokens.ts | StyleguideSheet | see §6 |
| src/lib/sheet.ts artwork | CoverOverlay, RouteTransition, TransitionLink | REWRITE, keep the export surface names, the Y0 rule and the try/catch discipline |
| src/lib/motion.ts + CustomEases in src/lib/gsap.ts l.25-27 | many | replace DUR/EASE/STAGGER with the rivista tokens; keep gsap.ts as the single registerPlugin point (l.22: ScrollTrigger, SplitText, Flip, Observer, CustomEase, useGSAP) |
| src/components/Preloader.tsx artwork (l.34-36 dividers, l.140-177 markup, l.91-111 print timeline) | layout.tsx | keep SEEN_KEY, SKIP_SCRIPT (l.31-32), the display-none early exit (l.60-64), unlock/finish split (l.46-56), fonts.ready race 1100 ms + 620 ms minimum (l.115-121), reduced-motion fade (l.75-88), suppressHydrationWarning (l.140), the script AFTER the div (l.180), and the CSS failsafe |
| src/components/ui/button.tsx | nobody | dead |
| globals.css world blocks, src/app/fonts/archivo-*.ttf, OG artwork | see §5-7 | |
| dict.ts sections strip, phases, band, header.caption/roleCaption, intake captions, bench.caption/figure/live/still, diagnosis, estimate, work captions/cols/more, measured captions, subform captions/next/partNoGroup, release.caption/stamp, about.captions.owner, notFound.stamp, styleguide | see U3 map | keep neutral strings listed in U3 (identity, positioning, noPhoto/pendingUrl/pendingFilm, release.headline/cta/email/links, a11y, meta, footer.copyright, bench reason lines) |

### Keep — world-neutral

src/app/layout.tsx skeleton and metadata/JSON-LD (replace font + the two chrome mounts + themeColor); src/app/template.tsx; src/app/_providers/Smooth.tsx; src/components/transition/{TransitionLink, CoverOverlay, RouteTransition}.tsx mechanics (changes in §1.7); src/store/ui.ts; src/lib/{use-hydrated, site, cn, gsap}.ts; src/content/{works, career, findings}.ts and src/data/skills.ts (data; phaseRole and schematic fields are harmless); dict.ts mechanism; page metadata exports in every page.tsx; sitemap.ts, robots.ts; og-fonts.ts loader; next.config.ts, tsconfig.json, postcss.config.mjs, package.json; scripts/** (edit lists as in §8); public/captures/**, public/bench/**, public/cubemap/** (re-light may regenerate bench/cubemap).

### The WebGPU engine (frozen G4) and how the bench mounts it

- FROZEN, read-only: src/webgl/waterball/mls-mpm/** (clearGrid, copyPosition, g2p — holds the letter-A confinement —, mls-mpm.ts 618 l, p2g_1, p2g_2, spawnParticles, updateGrid) and src/webgl/waterball/common.ts (21 l). Phase B (box SDF in g2p) is behind Alberto's explicit unlock.
- Allowed render-side: src/webgl/waterball/render/** (fluidRender.ts 519 l + 7 wgsl.ts incl. fluid.wgsl.ts 274 l colour constants), src/webgl/waterball/camera.ts, src/webgl/waterball/WaterBallHero.tsx (623 l) look params — SPLASH_DEFAULTS/CAM_DEFAULTS are commented G4 FROZEN.
- Mount chain: page.tsx → TestBench (figure) → div.bench-box relative overflow-hidden (TestBench l.102) → CanvasHost (src/webgl/CanvasHost.tsx, 64 l) → WaterBallHero.
- CanvasHost gate: BENCH_ROUTES = new Set(["/"]) (l.31); returns null off-route (l.61) and until the client-side gate resolves (l.62); gate: no navigator.gpu → "nogpu", reduced motion → "reduced", else "engine" (l.41-42); the two still states write heroStore {status "still", reason, zeros, tier: benchTier()} (l.48-51); cleanup resetBench() (l.57). Route change = unmount = WaterBallHero cleanup (l.584-601: cancel rAF, disconnect IO/RO, dispose scene, destroy buffers/cubemap/device, resetBench).
- WaterBallHero surface: renders div ref=wrapRef aria-hidden data-bench-canvas className "pointer-events-none absolute inset-0" style zIndex var(--z-bench) with canvas.block h-full w-full (l.612-619); the wrapper's clientWidth/Height × min(devicePixelRatio, DPR_CAP) is the backing size (backingSize l.258-263, DPR_CAP desktop 1.5 / mobile 1.0 l.49); a ResizeObserver on the wrapper rebuilds the targets debounced (l.558-570); an IntersectionObserver on the wrapper idles the GPU off-screen (l.548-553); pointermove on window drives the poke (l.235-241); canvas context alphaMode "premultiplied" (l.279) so no-fluid pixels are transparent and the DOM ground shows through; cubemap from /cubemap/{posx..negz}.png; dev-only leva panel portaled to body behind IS_DEV (l.109, 608). Contract from TestBench comments: NO transform on the canvas or its wrapper, ever; canvas decorative (aria-hidden).
- heroStore (src/webgl/store/heroStore.ts, 85 l): BenchStatus "compiling" | "warming" | "live" | "still" | "lost"; reason "nogpu" | "reduced" | "lost" | null; frameMs (500 ms average), particles, dpr, tier; legacy explode/reveal/video (unused, l.73-75); set(), resetBench(); window.__heroStore in dev (l.83-85). The engine writes from its rAF loop via getState; TestBench reads only status reactively (l.52).
- To keep the engine and unmount the bench: keep CanvasHost + WaterBallHero + heroStore + render/**; give CanvasHost a new host box (any position:relative element with a known aspect ratio; the wrapper fills it absolutely) and change BENCH_ROUTES if the fluid moves route; delete TestBench/BenchReadouts; keep public/bench stills only if a labelled still is still shown in the degraded states (engine honesty); regenerate the still with capture-bench.mjs after any re-light (it needs a .bench-box selector or an edit at l.137).

---

## 10. Build facts

- Windows casing: npm run build must run from C:\Users\alber\Portfolio (capital U and P) or Next dual-loads AsyncLocalStorage and fails with "Expected workStore to be initialized" (CLAUDE.md §10, memory windows-build-casing). Vercel/Linux is unaffected.
- Toolchain at this machine: node v22.20.0, npm 11.6.2; installed next 16.2.10, react 19.2.7, gsap 3.15.0, @gsap/react 2.1.2, lenis 1.3.25 (package.json says ^1.3.23), zustand 5.0.14, zod 4.4.3, tailwindcss 4.3.2, playwright 1.61.1, @tailwindcss/postcss ^4, typescript ^5, @webgpu/types ^0.1.51, leva 0.10.1 (dev). Unused in this world but still in dependencies: three 0.184.0, @react-three/fiber 9.6.1, @react-three/drei 10.7.7, @react-three/postprocessing 3.0.4, postprocessing 6.39.2, simple-icons ^16.24.1, class-variance-authority, tailwind-merge (cn.ts uses clsx + tailwind-merge — check before removing).
- package-lock.json is GITIGNORED (.gitignore l.7-9: "the npm lockfile stays out of the tree until WP-10 decides"): the deploy installs without a lockfile, so versions float within the ranges; pin or commit the lockfile before the port ships.
- Scripts (package.json l.5-10): dev = next dev, build = next build, start = next start, typecheck = tsc --noEmit. npx tsc --noEmit passes at this HEAD (exit 0, run during this survey).
- next.config.ts (14 l): ONLY images { formats ["image/avif", "image/webp"], minimumCacheTTL 31536000, qualities [75, 90] }. No experimental flags, no reactCompiler, no turbopack options, no headers(), no redirects, no images.remotePatterns (all imagery is local under public/; the current site uses a plain img for the bench still and Loupe for captures — verify whether next/image is used anywhere before adding remote hosts), no output/basePath.
- tsconfig.json: target ES2022, moduleResolution bundler, strict, jsx react-jsx, paths "@/*" → "./src/*", includes .next/types and .next/dev/types (Next 16 typed routes plumbing), plugin "next".
- postcss.config.mjs: only @tailwindcss/postcss.
- Last build output (.next/app-path-routes-manifest.json): /, /about, /icon, /opengraph-image, /robots.txt, /sitemap.xml, /styleguide, /work, /work/[slug] (9 SSG params, dynamicParams false), /work/[slug]/opengraph-image, /_not-found, /_global-error. All static.
- Dev launch config for the browser tool: .claude/launch.json "portfolio-dev" = npm run dev on port 3000.
- Env: .env.local holds only VERCEL_OIDC_TOKEN (Vercel CLI); NEXT_PUBLIC_SITE_URL is set on Vercel (memory vercel-deploy), not locally — local builds warn and fall back to localhost (site.ts l.28-35).
- Deploy: Vercel project albocodes-projects/portfolio, git-connected to GitAlboBis/Portfolio, push to main = deploy; G3 (merge/deploy) needs Alberto's OK.
- Known cache gotcha: a stale .next can serve old CSS after a large globals.css swap → delete .next (memory codrops-lane). A .next from a previous build is present now (BUILD_ID wKLcC2JhWBqBxL9W35EjX).
- WGSL files are template literals (export default \`...\`): a backtick or ${ inside a WGSL comment breaks tsc; WGSL validity is only checked at runtime.


## KEY FACTS
- HEAD 86854f4 changed only public/proto/rivista/**; the U3 map at d33a2d6 is still valid for src/ and scripts/; npx tsc --noEmit passes at this HEAD.
- Root template.tsx remounts only on a TOP-LEVEL segment change (/ ↔ /work ↔ /about), never on /work → /work/<slug>; RouteTransition keys its enter on usePathname() and retires the previous run manually (useGSAP deferCleanup with dependencies).
- CoverOverlay must stay in layout.tsx: module-level controller + navigating latch, inert on [data-page-root], 2.5 s bail via gsap.delayedCall, passive-effect handoff() that clears INSTANTLY because the enter snapped an identical cover pre-paint; the controller has no notion of the destination.
- Y0 percent trap (sheet.ts l.48-60): an SSR inline translate3d(0,-100%,0) is read by GSAP as y:-<vh>px and stacks under yPercent; pass y:0 with every yPercent, or SSR overlays as visibility:hidden with no percent transform.
- RouteTransition snapToHash() scrolls to 0 on EVERY non-hash arrival (l.93-99) and calls ScrollTrigger.refresh(true) only at the END of the lift (l.117): both must change for the S4 back cut (restore origin scrollY + rail progress, refresh BEFORE scrolling, measure the tile after decode + one rAF).
- S5 column wipe maps 1:1 onto the exit/enter split; S4 forward is simpler in the SPA (the travelling image lives in the persistent overlay, no sessionStorage/data-URL hand-over); S4 back needs an origin record at click time and a popstate path, since browser back never passes through TransitionLink.
- The existing Flip hand-off (stashFlip/playFlip on data-flip-id work-title-<slug>, WorkTable l.215 / SubForm l.171, 382) flips the DOM heading and has no object-fit-cover crop math; replace it with the proto's viewport-covering img + clip-path inset + coverXf, do not extend it.
- S4 is only possible for works with a capture: sersan-io and spherenode (public/captures/*-800.webp, *-1600.webp); the other seven fall back to S5.
- Smooth.tsx: Lenis { lerp 0.1, smoothWheel, wheelMultiplier 1 } on gsap.ticker with lagSmoothing(0), lenis.on scroll → ScrollTrigger.update, exposed as window.__lenis; NO Lenis under reduced motion; no lenis.css imported anywhere; <html lang> and data-motion="reduced" are written here.
- Gate scripts depend on window.__lenis.scrollTo(y, { immediate: true, force: true }) with window.scrollTo fallback, sessionStorage "at-preloader-seen", and localStorage "ocean-ui" = {state:{locale},version:0}; keep those names (do not adopt the proto's rv-intro-seen).
- Store src/store/ui.ts: zustand persist name "ocean-ui" (load-bearing, never rename), partialize → locale only; reducedMotion resolved at module load; useHydrated()/useHydratedLocale() gate any render-time branch on locale or motion.
- dict.ts: one z.object sectionSchema, Dict = z.infer, en/it typed as Dict (tsc parity), dev-only sectionSchema.parse(en) and parse(it) at module load, dict + useDict(); a per-section split composes sub-schemas in the root and must add every new file to check-claims CONTENT_FILES (hard-coded list, l.22).
- Fonts: next/font data lists Cormorant Garamond (wght 300–700, normal+italic, variable) and Figtree (wght 300–900, variable); V1 uses Cormorant 300/500/600 + italic 500 and Figtree 300/400/500/600; use weight "variable", subsets latin + latin-ext, display swap, CSS variables mapped in globals.css @theme inline.
- next/og (Satori) needs static TTFs in src/app/fonts (no variable axes, no woff2): instance Cormorant 600 / italic 500 and Figtree 400 / 600 with fontTools as README.md documents; rewrite og-fonts.ts FILES/OG_FAMILY/OG_COLOR and the weight union.
- globals.css: the whole @theme palette (--color-*: initial + 11 sheet colours), the wdth-based .f-* scale, spacing vars, .field/.stamp/.perforation/.bench-box primitives and the safety-yellow focus ring are world-specific; keep overflow-x: clip, the z ladder pattern (cover < preloader < skip), the two-track reduced-motion zeroing, the skip-target no-ring rule, and the .preloader failsafe keyframes.
- V1 tokens from fx-core.css: paper #f6f3ec, paper-deep #ede7dc, ink #24211e, graphite #48443e, stone #6b665d, line #dcd5c8, accent #2340c9, accent-dark #1a2f99, on-accent #ffffff; layout.tsx viewport.themeColor must move from #f5f4ef to the new paper.
- src/content/tokens.ts is imported only by StyleguideSheet; oilLinear has no importer; src/lib/contrast.ts is imported only by StyleguideSheet; src/components/ui/button.tsx is imported by nobody.
- Keep world-neutral: site.ts (SITE resolution + siteMeta + titleTemplate), the root metadata rule (no canonical/og:url at root), per-route metadata exports, sitemap.ts (12 URLs from worksConfirmed), robots.ts (disallow /styleguide — drop if the route dies), Person JSON-LD; redraw icon.tsx, opengraph-image.tsx and work/[slug]/opengraph-image.tsx artwork.
- Engine G4 frozen: src/webgl/waterball/mls-mpm/** and common.ts; keep CanvasHost (BENCH_ROUTES = {"/"}, gate engine/nogpu/reduced after mount, resetBench on unmount) + WaterBallHero (absolute inset-0 wrapper fills any position:relative box, ResizeObserver backing size, IO-gated rAF, device.destroy on unmount) + heroStore; delete TestBench/BenchReadouts; capture-bench.mjs throws without a .bench-box selector.
- visual-gate: Chrome channel with --enable-unsafe-webgpu, 1440×900 DPR1 + 390×844 DPR2, GATE_MAX_STEPS 14, GATE_SETTLE_MS 900, viewport screenshots per step into .shots/<tag>/, exit 1 on console errors/pageerror/requestfailed (warnings printed only), IGNORE list for DevTools/Fast Refresh/THREE.Clock/Image with src/Extra attributes.
- a11y-gate default ROUTES include /styleguide and /no-such-page-404; wp10-evidence and _recapture hard-code the same seven routes; all must be edited if routes change; the 16384 device-px screenshot ceiling forces tiling for tall mobile pages.
- check-claims scans only dict.ts, works.ts, findings.ts, career.ts; PRODUCT.md §3 + §9 is the truth; WHITELIST holds job-order figures ("6", "4", "1600", "1000", "4.5", "1.18", "3.5") to prune; digits after -, /, _ are treated as paths/versions.
- next.config.ts has only images { formats avif/webp, minimumCacheTTL 31536000, qualities [75, 90] } — no experimental flags, headers, redirects or remotePatterns; all routes are static; /work/[slug] has dynamicParams = false with 9 generateStaticParams.
- package-lock.json is gitignored, so Vercel installs without a lockfile; versions float within ranges (lenis resolves 1.3.25 locally); pin before shipping the port.
- Windows: npm run build only from capital-cased C:\Users\alber\Portfolio; a stale .next can serve old CSS after a big globals.css swap (delete .next).
- Unused deps still in package.json: three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, postprocessing, simple-icons; leva is dev-only behind IS_DEV in WaterBallHero.
- Preloader: keep SEEN_KEY at-preloader-seen, the inline SKIP_SCRIPT placed AFTER the #preloader div, suppressHydrationWarning, the unlock-at-lift-start / finish-at-end split, fonts.ready raced with 1.1 s plus a 620 ms floor, the reduced-motion fade, and the CSS failsafe at 3 s.
- Server components cannot import dict.ts ("use client"); metadata and OG read src/lib/site.ts and works.ts directly; keep site.ts and dict.meta in sync by hand.

## OPEN QUESTIONS
- Next 16 App Router scroll restoration on popstate: does the router restore scrollY before or after the template's layout effect? The S4 back arrival (lenis.scrollTo immediate+force then measure) could be moved by a later native restore; needs a runtime probe.
- Is there a router-level hook to start the S4 reverse cut on the browser BACK button (popstate fires before Next commits, but the old page must still be painted to read the hero's visible slice)? Not resolvable from the files.
- Whether the rivista keeps a /styleguide route (and therefore src/lib/contrast.ts, src/content/tokens.ts, the dict styleguide block, the robots disallow and the gate ROUTES entries) is a design decision, not in the files.
- Whether google/fonts upstream ships Cormorant Garamond and Figtree as variable TTFs (next/font's data says variable): the OG instancing step assumes fontTools like the Archivo cut; not verifiable offline here.
- Whether the fluid bench stays on "/" (CanvasHost BENCH_ROUTES) or moves; and whether the rivista shows a labelled still in the degraded states (which decides if public/bench and capture-bench.mjs survive).
- The proto's rail: is it a pinned ScrollTrigger (rail progress = scrollY) or a real overflow-x scroller? Not determined here (WP-C's fx-scroll.js was not read in this slice); it changes what the origin record must store.
- Lenis: the port may need lenis/dist/lenis.css (.lenis-stopped for a menu) — nothing imports it today; confirm against the proto's menu behaviour.
- The wp10-evidence and a11y gates scroll-walk with immediate scrollTo; a pinned horizontal rail with scrub must update on those forced jumps — untested here.
- cn.ts uses clsx + tailwind-merge; class-variance-authority is only used by the dead ui/button.tsx — confirm before pruning dependencies together with three/R3F/simple-icons.
