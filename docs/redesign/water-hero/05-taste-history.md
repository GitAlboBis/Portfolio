# 05 — Taste & history dossier: the hero, the water "A", and what Alberto actually wants

> Reader-only reconstruction (2026-09-18). Sources: portfolio memory (`~/.claude/projects/C--Users-alber-Desktop-PortfolioAlbertoTuveri/memory/*.md`), domus memory (`domus-redesign-rivista-bianca.md`, `domus-workflow-ripresa.md`) + the domus rivista spec §3/§11, repo docs (`CLAUDE.md`, `HANDOFF.md`, `PLAN.md`, `PRODUCT.md`, `REDESIGN-SPEC.md`, `DESIGN.md`, `docs/redesign/DIRECTIONS-2026-09.md`, `main:HANDOFF.md`), git history on all branches (hero/water/fluid/ssf commits, 2026-06-23 to 2026-09-18), the prototype `public/proto/rivista/**`, the three captures (Golden Hour `_shots/webgpu/1-initial-1440.png`, job order `public/bench/tank-still-1520.webp`, rivista `public/proto/rivista/fx-plate-v1.webp`), and Alberto's own typed messages in the sersan-v2 sessions (`~/.claude/projects/C--Users-alber-Desktop-sersan-v2-main/*.jsonl`, Aug 11 to Sep 9 2026), which are the best record of his taste in WebGPU work.
>
> Caveat: no transcript of the 2026-09-14 Golden Hour rejection or of the job-order rejection exists on this machine. Those are known only from `CLAUDE.md`/`HANDOFF.md` and the 86854f4 commit message. Quotes below are verbatim (Italian) unless marked *paraphrase*. Memory and commit messages paraphrase him, so a commit quote is his idea in an agent's words.

---

## 0. The request, read closely (2026-09-18)

> «ok perfetto, mi piace il design, ma non mi fa impazzire la hero con la "a" e lo sfondo 2d delle linee. puoi fare molto di meglio con tutte le skills e mcp di #design che ti ho fornito. […] come puoi vedere dal sito che ho fatto di Sersan.io […] ho creato la mia faccia in 3d con particelle, loghi in webgpu a strati, buchi neri in webgpu super realistici. quindi dobbiamo fare qualcosa allo stesso livello. e il logo in 3d della A fatta di acqua era nella giusta strada. mancava solo perfezionamento e lavoro aggiuntivo per creare un esperienza bella, e super realistica»

What each clause means:
- **"mi piace il design"**: keep the rivista bianca page (V1 "Carta e cobalto"). This is **not** a redirection round. Only the hero changes.
- **"la hero con la 'a' e lo sfondo 2d delle linee"**: he rejects both parts of S2 "Carta corrente": the blind-embossed flat A and the 2D hairline flow field. The problem word is **2D**.
- **"allo stesso livello" di sersan.io**: that site runs WebGPU compute (a 48,000-particle wordmark, an 80,000-cell portrait morph lit from depth maps, a raymarched black hole, a refractive crystal, selective bloom) on one continuous canvas, with a cinematic preloader-to-hero camera. That is the bar.
- **"la A fatta di acqua era nella giusta strada"**: the **water A itself is rehabilitated**. What was rejected on 2026-09-14 was the Golden Hour *world* around it (sunset, sea, coast, drone, Sardinia storytelling). The letter made of water was not rejected. DIRECTIONS §1 had banished "la lettera 'A' d'acqua sul tramonto" as a world; Alberto now overrides that for the letter.
- **"mancava solo perfezionamento e lavoro aggiuntivo … super realistica"**: evolve the MLS-MPM engine and push its realism. Do not replace it with something else. "Esperienza" means choreography around it: arrival, interaction, scroll. A still object is not enough.

---

## 1. Explicit likes and dislikes, with dates

### 1.1 Heroes and the water "A"

| Date | Signal | Kind |
|---|---|---|
| 2026-06-23 | The mark is **a single letter "A"**, a bold **serif** (Georgia-Bold, extruded and bevelled, `a-mark.glb`), not the AT monogram | decision |
| 2026-06-24 | Chose "replace the hero": liquid water A instead of a GPGPU particle cloud | like: *liquid* |
| 2026-06-24 | Rejected see-through refraction of the backdrop: «l'acqua non dipende dallo sfondo/mondo 3D nelle repo clonate — il colore è il materiale». The look must come from the **material plus a real environment reflection** (a WaterBall cubemap), not from whatever sits behind it | dislike + principle |
| 2026-06-24 | Realism benchmark = `matsuoka-601/Splash` (env reflection, Beer-Lambert, fresnel, sun glint). **Foam only on crests and rims; he rejected full-body whitening** | like / dislike |
| 2026-06-24/25 | «implementa perfettamente waterball ma al posto della ball una A» | like: **faithful port of a real engine** |
| 2026-06-27 | Current hero «fa schifo». Title animations (liquid-text wobble, celeste-tinted letters, glitchy eyebrow) «orribili». Floating glass cards («Masua, Sardegna», role card) «non c'entrano niente». Spiky white water explosion = «effetti sullo schermo orribili» | strong dislike |
| 2026-06-27 | Chose **"Liquid Monogram"**: keep the water A, clean DOM title, no cards | like |
| 2026-06-27 | *Paraphrase (979e2ac):* more particles to kill the spiky dispersal (40k to 120k) | dislike: SSF spikes |
| 2026-06-27 | *Paraphrase (540cb50):* the burst «was a downward rush, not a splash; force too high». He wants a **radial slow-motion splash** that recomposes | like |
| 2026-07-01 | *Paraphrase (0f41ed3):* «the teal water + sunset reflection are perfect; only the orange contours were unwanted» | like: reflection realism · dislike: coloured rims |
| 2026-07-14 | Carte blanche: «pieno controllo, lasciami a bocca aperta», «continua a migliorare e aggiungere cose bellissime animate» | appetite for more |
| 2026-07-14 | A procedural sky under the A: «troppo artificiale, dev'essere tutto realistico», replaced by a real photographic loop | **dislike: procedural fake** |
| 2026-07-14 | CSS sun on /about: «è una semplice palla arancione, non è questo il livello» | **dislike: flat 2D stand-ins** |
| 2026-07-14 | Reference level: alche.studio, everswap.com, activetheory.net, landonorris.com, «dev'essere di questo livello». Shared traits: one persistent GL world, the pointer perturbs the world, the preloader resolves *into* the hero | bar |
| 2026-09-14 | Rejected the **entire Golden Hour site** (warm paper, ember, sunset, sea, drone, full-screen hero) | world rejected |
| by 2026-09-18 | Rejected "The job order" (A as amber oil in a 760×540 test bench with a yellow readout column). No transcript on this machine | world rejected |
| 2026-09-18 | Likes the rivista design. Dislikes the flat A and the 2D lines. The water A «era nella giusta strada» | current brief |

### 1.2 WebGPU / animation taste (from his own sersan.io sessions)

- **Particles, not lines.** 2026-08-25: «avevamo detto di farlo in particelle, perchè non mi ascolti, vedo che è ancora a linee che sembra vetro lattice!», and «la linea sotto nitida non ci deve essere. sono le particelle che si illuminano in movimento che fanno la linea illuminata». 2026-08-19: «non mi piacciono le scintille come girandola, vorrei le particelle». This connects directly to "lo sfondo 2d delle linee".
- **Organic, not geometric.** 2026-08-25: «troppi angoli simmetrici e retti. la rete neurale è curva, non sono linee rette».
- **Realism as the explicit target.** 2026-08-24: meteor stones «dobbiamo renderle piu realistiche, come puoi vedere nel sito igloo, non sono cosi blande». 2026-08-25: «fai tu, per renderla piu bella e realistica possibile».
- **Cinematic, continuous, scroll-driven.** 2026-08-24: «è quasi un video, uno scroll immersivo che si muove» (igloo, Lusion). «il sito si deve muovere mentre scrolli … ora è statico su una sezione!»
- **Preloader hands an element to the hero.** 2026-08-28: the reverse of arago.wawww.studio / donprod.uk / oddity.com, «portano un elemento dal preloader alla hero, rendendo tutto perfettamente fluido». The sersan preloader is gated: the SERSAN wordmark generates, the camera zooms out *from inside* the black hole, the logo layer explodes, then a final zoom-out lands in the hero. He directs the camera like a DP: «come se alzassimo la testa verso l'alto per guardare il logo».
- **Smooth over fast.** 2026-08-28: «troppo veloce … fai tutto piu lento e smooth». Then «tra un movimento e l'altro deve passare meno tempo … la curva dell'animazione dev'essere piu smooth». 2026-09-03: «non è fluida l'animazione, ma meccanica».
- **Text animates with scroll, big.** 2026-08-21: «le animazioni delle scritte devono essere con lo scroll, non con il cursore», and «non mi piacciono le scritte piccole». On Lusion: «raramente ci sono card. Quindi o le facciamo belle oppure creiamo qualcosa di più bello».
- **Mobile parity, no 2D fallbacks.** 2026-08-11: «il buco nero è orribile cosi» (mobile). 2026-09-09: «vorrei che anche da telefono ci sia il preloader bellissimo come da desktop». Lusion on an iPhone is «identico a quello desktop, non ha fallback o effetti diversi … non lagga». And «non possiamo fare in modo che pesi un po di meno? Ma senza utilizzare quel cerchio 2d orribile come fallback?». His own CV doctrine for sersan.io: the full scene on weak mobile GPUs **at a quarter of the pixels, without removing a single effect**.
- **Judge on WebGPU.** 2026-09-09: «se devi verificarlo, devi aprirlo in webgpu, non con il fallback».
- **Process.** «fammi quiz interattivi se non capisci, ma non eseguire con incertezze» (2026-08-24). He is impatient with detours («abbiamo perso un sacco di tempo con una cosa che non ti ho chiesto»). He wants real reverse engineering of reference code, not approximations.
- **In domus, on the same rivista canon.** Given the choice (2026-09-13) he picked «Coreografia piena» over discipline and «Fedeltà letterale» over a lighter plan. He likes rich motion inside a clean layout. «NIENTE SCRITTE BLACK» is a domus rule: the portfolio V1 ink `#24211e` is already off-black.

### 1.3 Typography

- He hated per-letter liquid, wobble, glitch and tinted-letter treatments (2026-06-27). He likes a **clean DOM title with a line-mask reveal**.
- He chose the rivista canon: huge uppercase serif display in vw/vh, V1 = **Cormorant Garamond** display + **Figtree** text. The hero A should therefore be *this* typeface's A. The original mark was already a serif (Georgia-Bold, 2026-06-23).
- No small text, no card chrome, no text sitting on the effect. The Golden Hour hero put the name over the water: the capture shows «Alberto Tuveri» overlapping the foot of the A, and it read muddy.

---

## 2. Every past hero: what it looked like, and why it was rejected or kept

| # | When | Hero | Look | Fate / why |
|---|---|---|---|---|
| 1 | 2026-06-23 | "Scoglio reveal" (NatGeo-inspired), pinned 300vh | Name rising like a wave with a celeste shimmer, a sea rock rising in front | Superseded within a day by the water-A idea |
| 2 | 2026-06-23/24 | GPGPU water-particle A (WebGL2, `a-mark.glb` serif) | Particle cloud shaped as an A, foam glow | Replaced: he wanted *liquid*, not a cloud |
| 3 | 2026-06-24 | Liquid mesh A (`MeshPhysicalNodeMaterial` transmission, ring waves) | Glassy extruded mesh | Bridge; the SSF / real-fluid path won |
| 4 | 2026-06-24/25 | SSF particle A (Splash port) | "Flat white-celeste sticker with 2D-sphere edges". Refraction ~98% dark and flat; see-through made it depend on the backdrop | **Rejected the see-through** («il colore è il materiale»). Fixed by a sharp cubemap reflection |
| 5 | 2026-06-25/26 | **MLS-MPM WaterBall port, confined to an A** (`src/webgl/waterball/**`) | Real fluid: churn, mouse poke, splash, slow recompose | **Kept.** He asked for it. This is the engine he calls «nella giusta strada» |
| 6 | 2026-06-27 | Full hero with liquid-text title, glass cards, spiky white explosion | Busy, gimmicky | «fa schifo». Title animations, cards and explosion all named. Became Liquid Monogram: DOM title, no cards, the A drains on scroll |
| 7 | 2026-06-29 to 07-14 | Golden Hour water A (`_shots/webgpu/1-initial-1440.png`) | Huge translucent teal A over a sunset sea video. Iridescent/orange rims, murky jelly body, **rounded balloon letter with no serifs**. Name and tagline «I build interfaces that move like water» on top. Later: sun glint, foam, ballistic spray, eruption from the sea (LA NASCITA), legs dissolving into the sea (IL CONTATTO), photographic sunset loop | Water and reflection praised (07-01). Orange rims and procedural sky rejected. The **whole world rejected 2026-09-14** |
| 8 | 2026-09-16/17 | Job order "test bench" (`public/bench/tank-still-1520.webp`) | The A re-lit as **amber hydraulic oil** on grey paper in a 760×540 framed box with yellow readouts. The capture shows an **inflated golden balloon A**, dithered/moiré highlights, a soft halo, smeared feet | World rejected. The small boxed "instrument" framing made the fluid an aquarium |
| 9 | 2026-09-18 | Rivista S2 "Carta corrente" (`fx-plate-v1.webp`) | WebGL2 divergence-free flow field of ink and cobalt **hairlines** parting around a **blind-embossed flat Cormorant A**, in a "Fig. 01" plate beside the name. The same canvas serves the preloader window (S1) and the closing band | «non mi fa impazzire … la 'a' e lo sfondo 2d delle linee». Flat and 2D |

**Diagnosis common to #7 and #8 (read from the code and captures).** The A is not a glyph. It is a confinement force to the **3-segment medial axis** (apex to left foot, apex to right foot, crossbar; `halfW = 5.0`) inside `mls-mpm/g2p.wgsl.ts`. Every stroke is a capsule of one width: no thick/thin contrast, no serifs, round terminals. The SSF depth blur rounds it further, so the letter reads as an **inflatable sausage A**. Next to a Cormorant Garamond page, this will look like a toy. The "perfezionamento" he asks for starts with the **letterform**.

---

## 3. The rivista bianca canon (as it applies to this portfolio)

**Origin.** Domus Tua, 2026-09-10. The client pinned immobiliaregoldengoal.it: clean, professional, big type, no cards, big media, well-managed space. Rules there: no small text, no black, no curves, far fewer animations. Alberto then brought back scroll-driven set pieces and chose «Coreografia piena». era-residence.com is the technique reference (didone display, vw scale, arch preloader, text lines rising, horizontal scroller). On 2026-09-18 Alberto chose this canon for the portfolio (commit 86854f4), identity **V1 "Carta e cobalto"**.

**Tokens (V1, `fx-core.css`).**
- Paper `#f6f3ec`, paper-deep `#ede7dc`, ink `#24211e` (not black), graphite `#48443e`, stone `#6b665d`, line `#dcd5c8`.
- Accent **cobalt `#2340c9`**, accent-dark `#1a2f99`, on-accent white.
- Display Cormorant Garamond 500 (hero 600, lh 0.92, uppercase). Text Figtree. Metric-matched fallbacks give CLS 0.

**Type scale.**
- Hero `clamp(3.1rem, 13vw, 13rem)`. d1 `min(10vh, 6.5vw)`, d2 `min(6.4vh, 4.2vw)`, d3 `min(4.5vh, 2.8vw)`.
- Lead ~1.35–1.55rem, body 19px.
- Padding 8vw (5vw mobile). Chapter gap `clamp(6rem, 14vh, 11rem)`.

**Rules.**
- One paper, uppercase display titles in vw/vh, **hairlines only, no radii, no shadows, no cards**, no veils over media.
- Figures are *plates* with honest captions: «Fig. 01 · Flow field, rendered live», «Still frame captured from this engine.»
- Live instrument text sits in the caption, never on the image.

**Motion, "rich but clean".**
- One ease family: out `(.16,1,.3,1)`, io `(.66,0,.22,1)`, soft, xio. Reveal 0.9s, wipe 0.5s, travel 1.1s.
- Set pieces:
  - S1: instrument preloader with *real* progress on a Lusion curve, never under 1s, no name, opening a live window.
  - S2: the hero plate.
  - S3 "Otturatore": sticky 300svh; the window grows, the lockup leaves, the glyph travels, the next sheet rises over the plate on a hairline.
  - S4: tile-to-case match cut.
  - S5: paper-column wipe.
  - Also the rail, a scroll-ink chapter, and the closing band.
- Reduced motion is a hard kill switch; a live change of the preference reloads the page.

**Forbidden in the canon.** Cards, radii, shadows, gradients, glass, dark sections, veils on media, small text, gimmick text effects, curved page transitions (domus).

---

## 4. Hard constraints that still bind the new hero

1. **Performance**
   - 60 fps on a recent desktop. Lighthouse mobile ≥ 80 on `/` and ≥ 90 on sub-routes. The job order measured 85–86 mobile and 99 desktop; Golden Hour peaked at 84 mobile.
   - **One heavy renderer per scroll region, one GL context per page.** Today fx-gl's WebGL2 context serves preloader, hero and closing band, so a WebGPU water A must *take over* those roles or turn them into DOM. It cannot run beside them.
   - DPR cap 1.5 desktop, 1.0 mobile. 120,000 particles desktop, 60,000 mobile tier. The proto also caps each buffer at 3.2e6 px.
   - Pause offscreen through IntersectionObserver, dispose on route change, handle `device.lost` by showing the still. One ticker (Lenis ↔ GSAP). DOM animates transform/opacity/clip only.
   - Alberto's own mobile rule: same scene at fewer pixels, no lag.
2. **Accessibility AA**
   - Canvas `aria-hidden`. Reduced motion shows a **static, legible version**: a still captured from *this* engine, labelled.
   - Contrast ≥ 4.5:1, so **no text over the fluid**. Captions and readouts sit outside the frame.
   - Visible focus, correct reading order, `html lang` follows the locale.
   - **WCAG 2.2.2** (lesson of 2026-07-25): content that moves on its own for more than 5s in parallel with other content needs a pause mechanism. A perpetually churning hero needs a pause toggle (the caption is the natural place), or it must settle on its own.
3. **Bilingual EN/IT.** Every visible string, including caption, readouts and reason lines, goes through `dict.ts` (zod-validated, EN ≡ IT). The prototype has no IT copy yet.
4. **No invented claims.** Static numbers only from `PRODUCT.md` §3/§9; `scripts/check-claims.mjs` is the gate.
   - Safe today: "120,000-particle fluid", "MLS-MPM", "written directly against the GPU API / WebGPU", "held in the shape of a living letter A", "real-time refraction, foam".
   - **"sun glints"** is only true if the environment has a sun. The job order already downgraded it to "tube highlights".
   - **"real caustics"**: the CV clause «simulated water with real caustics» referred to `ShallowWater`, the height-field water on /about (46b4614 / f50eb49, 2026-08-06). That page was deleted, and REDESIGN-SPEC §L.2 and CLAUDE.md flag the clause **not true**. The new hero may print "caustics" **only if it actually computes them** from the simulated surface (e.g. the jeantimex/webgpu-water refract-and-project method) and they are verified on screen. Wording should name the method, e.g. "caustics traced from the simulated surface". Then tell Alberto the CV clause is true again, now for the hero.
   - Live readouts (ms, particles, DPR, tier) must be **read from the engine**, never hardcoded.
   - "Still frame captured from this engine" must be literally true: recapture it after the new render lands.
5. **Gates**
   - **G4.** The solver `mls-mpm/**` + `common.ts` is frozen. A glyph-SDF confinement or a new particle count touches `g2p.wgsl.ts`. Alberto unlocked G4 before (06-27, 07-01, 07-14) and his message plainly asks for engine work, but **ask him to confirm in one line**. Open question L.1 (swap the A for a box tank) is effectively answered: he wants the A.
   - **G5.** Paid generation (Higgsfield) needs confirmation; images `soul_2` only.
   - **G3.** Merge or deploy needs an explicit OK.
6. **Verification**
   - Only in real WebGPU Chrome, window in the foreground. An occluded window freezes rAF and produces phantom states. Playwright probes use `channel:"chrome"`.
   - Screenshots at 1440 and 390, clean console. Judge motion live with Alberto; headless cannot judge feel.

---

## 5. Implications

### 5.1 Guardrails for a super-realistic water "A" he is likely to love

1. **It is the Cormorant A, made of water.** Thick and thin strokes, bracketed serifs, a sharp apex, a clean counter, readable as the same glyph as the lockup's display face. Confine the fluid to a **glyph SDF** (G4 ask), not three capsules. Letterform fidelity is the first "perfezionamento".
2. **Truly 3D.** A volumetric body in depth, with a camera that breathes and a scroll-driven move (push-in, slight orbit or dolly). Refraction and reflection change with the view. **No 2D backdrop, no hairlines, no embossed flat glyph.**
3. **Realism from optics, on paper.**
   - Sharp environment reflection of a neutral studio or daylight room. No sunset.
   - Fresnel, and Beer-Lambert absorption so thin edges run clear and thick cores deepen.
   - IOR ≈ 1.333 refraction of the *real page* (paper grain and type) seen through the water.
   - Tight specular glints. **Physically derived caustics** and a faint wet contact where the water meets the sheet.
   - «Il colore è il materiale»: it must read as water even on plain paper.
4. **Palette discipline.** Clear water whose depth tints toward cobalt `#2340c9` (the one accent), on `#f6f3ec` paper. No teal-and-sunset, no amber oil, no orange or iridescent rims, no white-out foam.
5. **Alive at rest, calm in character.** Subtle perpetual churn and micro-ripples. The pointer poke is a **radial slow-motion splash** with visible droplets, then a smooth recompose. Never spiky needles, never an explosion.
6. **Particles are the truth, shown at the right moments.** Formation, spray and foam specks reveal that it is a particle simulation, the family of his sersan face and wordmark. Light travels *through particles*, not along drawn lines.
7. **A continuous shot from preloader to hero.**
   - The S1 instrument preloader opens onto the same live canvas.
   - The A **forms from water** once per session (pour, rise or assemble in about 2–5s, the LA NASCITA idea without the sea), directed like his sersan gates with smooth curves and no dead time.
   - S3 then carries a camera move into or through the water as the next sheet rises.
8. **Mobile gets the same experience.** Same scene and choreography at fewer pixels and particles (the "quarter pixels, no effect removed" doctrine). Recompose the layout for portrait; do not disable the shot. No 2D stand-in, no lag.
9. **A rivista plate, but bigger.** A hairline frame, no radius or shadow, "Fig. 01" caption with method and live readouts *outside* the image. Give the water real scale, so the object never reads as a boxed test bench or an aquarium.
10. **Typography stays editorial and untouched by the effect.** The huge uppercase Cormorant name is set as type with a scroll-synchronised line-mask reveal. Water never sits over text, and no liquid, wobble, glitch or tinted letters.
11. **Honest degraded states that are beautiful.** Reduced motion and no-WebGPU show a high-quality still captured from this engine, with a printed reason line. Include a pause control for WCAG 2.2.2.
12. **Faithful technique, then adapt.** Port real code (WaterBall / Splash shading, jeantimex caustics) with the original constants, compare side by side, then theme it. If the vision is ambiguous, ask him short multiple-choice questions before building.

### 5.2 Five traps to avoid

1. **Resurrecting the Golden Hour world.** No sunset cubemap, sea video, horizon waterline, drone, "interfaces that move like water" or Sardinia narrative. The letter returns; its world does not.
2. **The balloon/jelly A and SSF artifacts.** Capsule strokes, over-blurred depth, dithered or moiré highlights (the job-order still), murky iridescent body (the Golden Hour capture), needle spikes from sparse particles, coloured rims, full-body foam.
3. **Anything that reads 2D, procedural-fake or toy-like.** Flow-field lines, flat emboss, CSS sun, a 2D circle fallback, a procedural sky («troppo artificiale»), a sticker-flat tint, sparkler sparks.
4. **Framing that kills scale, or chrome that clutters.** A small boxed "instrument" with readouts on yellow reads as an aquarium. The opposite error is floating glass cards, text over the water, wobbling titles, or a tagline painted on the effect.
5. **Gate, claim and performance slips.**
   - Touching the solver without a G4 OK, or printing "real caustics" or "sun glints" that are not rendered.
   - Mounting a second GL context next to fx-gl's.
   - A mobile tier that removes the effect (he will call it a fallback) or one that lags (he flagged the sersan black hole for exactly this).
   - Judging it in a fallback, a headless screenshot or an occluded Chrome window.
