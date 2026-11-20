# 46 · Direction KEEP: "Acqua viva". Keep the exact water A and give it time

> Lead WebGPU creative technologist, 2026-10-09. One of the three directions (keep / revive / hybrid) for the judge in `50-water-a-decision.md`. It argues one side as well as it can be argued, then lists its risks honestly.
> Inputs read: `30-hero-build-spec.md` (§0–§9, verdicts R1, R2 and R2b), `engine/CONTRACTS.md` (§0–§21), the engine (`caustics.js`, `drops.js`, `waves.js`, `body.js`, `shade-hero.wgsl.js`, `caustic-trace.wgsl.js`), the old solver (`src/webgl/waterball/mls-mpm/*.wgsl.ts`), the dossier `45-old-fluid-a-dossier.md`, the taste dossier `05-taste-history.md`, `_refs/hero-water/03-sersan-quality.md`, the memory notes, and the shots in `_shots/water-hero/r1`, `r2`, `r2b`, `_shots/rivista-motion/r3/home-d`, `_shots/webgpu/1-initial-1440.png` and `_shots/liquidswap/dive-f2.png`.
> **Measured** = numbers already recorded in CONTRACTS §12–§21 or spec §9 (AMD Radeon RX 7800 XT, rdna-3, Windows, Chrome, developer timestamps). **Est.** = my estimate, to be replaced by a probe. No GPU work was run for this document.
> Units as in the spec: C = 1 = the A's ink height. At the S2 plate C = 223 px; at the end of S3 C ≈ 460 px; on a 390 phone C ≈ 180 px.

## In breve (per Alberto)

Teniamo la A che hai approvato (R1 «Acqua, si va avanti»: la A esatta di Cormorant, σ 0.6, κ 0.45, sulla carta) e le diamo quello che aveva la vecchia e che manca a questa: **il tempo**.
- **Luce viva.** Quando l'acqua si muove, le caustiche tracciate dalla superficie danzano sulla carta: solo la parte che cambia, quindi a riposo non torna l'ombra che hai scartato in R1.
- **Bolle.** Il versamento le trascina dentro la lettera; salgono lungo le aste, scoppiano all'apice, 2–3 restano sotto la traversa.
- **MLS-MPM vero (M9).** Il click diventa una corona di fluido reale che si strappa in gocce (8.192 particelle in tier A), non 14 sfere già piazzate.
- **Tirare una grazia fuori dalla lettera** (M4b): con il mouse si allunga un filo d'acqua che si rompe in gocce e poi guarisce.
- **Il tuffo (M10)** nello scroll S3, e su schermi HDR i riflessi più luminosi della carta.

Tutto si ferma entro 5 s dall'ultimo input, come oggi. Ogni pezzo è un flag: lo confronti accanto alla A di oggi nello stesso browser.

---

## 0. The thesis

The A that ships today is a correct *still* of water. It is exactly the page's letter: Cormorant Garamond 600 to 0.1 texel, with domed faces, a foot meniscus, Beer cobalt and exact paper. Alberto approved it as water three times (R1 2026-09-20, R2 and R2b 2026-09-22). It also already carries the whole page contract:
- the preloader pour;
- the S3 path;
- the band;
- the phone's live window;
- device loss;
- Lighthouse 86–92 on the gl-off path;
- the R3/R4 GPU start-up gating.

What it lacks is **time**. Still water is optically flat by rule (§2.6). The engine goes idle 5 s after the last input (G15). The splash spans about 50 px at the plate. Caustics are off on the hero (R1), and there are no particles yet (M9 is not built).

The old MLS-MPM A is remembered as "super realistic" for reasons the dossier states plainly: *"even at its best, the letter at rest reads as a translucent gel sans blob. It reads as water only in motion (the drain and splash frames)."* Its realism was **motion, scale and a real reflected world**, not its letterform or its SSF optics.

So the right move is not to bring back the representation that caused every look complaint (capsules, balloon volume, SSF needles, coloured rims, honey motion). The right move is to bring back **what that representation did well, on the letter that is already right**:
- motion with consequences you can see;
- particles at the moments where particles are the truth;
- light that moves;
- one cinematic beat where the water is the whole screen.

Everything below plugs in through the engine's plugin and hook contracts (CONTRACTS §9.1, §15). Each item sits behind a flag, so with all flags off the page is bit-identical to today.

---

## 1. What is missing today, in numbers

| read | today (measured or observed) | why it costs realism | after KEEP (target) |
|---|---|---|---|
| Life with no input | pour ≈ 2.5 s + the 5.0 s breath window, then 0 submits; still water is optically flat | the old A churned forever; a still letter reads as glass | the same G15 rule, but every input now has a visible consequence that lasts 1–5 s (light, bubbles, crown). The pour leaves bubbles that keep climbing for ≈ 3 s |
| Click at the plate | "molto": drop r 0.05 C, crater 0.08 C (18 px radius), 12–14 analytic spheres r 0.016–0.022 C (3.6–4.9 px); about 50 px overall (`r2b/click_molto_*`) | pre-placed spheres; no sheet, no ligaments, no pinch-off | a real fluid crown (MLS-MPM, 8,192 particles in tier A) whose rim tears into droplets. Each droplet throws its own moving light and shadow; the crater's light network covers a letter-sized area (≈ 250 × 220 px of paper) |
| Scroll at the plate | the highlight band swings ≈ 3 px (D36, accepted as "the shimmer") | sub-pixel to the eye | the same geometry (the §2.6 ceiling stays), plus the caustic of the tilt waves swaying and flaring on the floor behind the feet |
| Hover | the key light ±25°; the stem band swings 6.5–8.7 px (D35) | good, but only highlights | unchanged (R2b). Hover never draws a caustic, by construction (§2.1) |
| Caustics on the hero | off (R1: no caustic shadow; M3 loads only with `?caustics=1`) | the strongest water-not-glass cue (moving light under water) is unused | **only the changing part** of the traced light, while the surface moves; exactly 0 at rest |
| Particles | 0 (M9 not built) | Alberto's family of effects (the sersan face and wordmark) is particles | MLS-MPM for free water in the air (click, tendril; the pour crown behind a compile gate) |
| Bubbles | ≤ 4 static + ≤ 2 live, 2–3 px at the plate (`r1_crop_bubble_8x`) | nearly invisible, and static bubbles read as ice | a pool of 96 / 64 / 32, r 0.004–0.02 C, rising, swirling, sliding along the rims, popping at the apex; ≤ 3 trapped at rest |
| GPU use at the plate | rest shade 0.32 ms, splash worst p95 1.31 ms against a 2.0 ms budget; 0 idle | ≈ 1.7 ms of approved headroom unused | splash with everything p95 ≤ 2.6 ms (the spec's M9 ceiling); rest unchanged; idle 0 |
| Scale | C 223 px at the plate, ≈ 460 px at the end of S3 | the old one was full-bleed | the S3 full screen becomes interactive (a click there makes a crown about twice as large on screen), plus the M10 dive, where the water *is* the screen |
| Pour column | pale at 100 % (D33: a 0.036 C clear rod reflects only F0 2 %) | closed by decision at R2b | its look is unchanged; the stream and rivulets add their **light on the paper**: a clear rod transmits ≈ 96 %, so it marks the paper much more than its own reflection does |

---

## 2. The direction: eight moves

Each move gives: what you see, why it is physical, how it plugs in, what it costs and how it can be killed. None of them changes an R1 or R2 default. The rest frame stays the R1 frame, plus at most 2–3 trapped bubbles.

### L1 · Living caustics: show only the light the moving water changes

**Seen.** A click rings the stem. For about 1 s, a network of bright filaments and faint grey gaps flickers across the paper behind and left of the letter (the light-A region, 0.35 C left and 0.41 C down, ≈ 78/91 px at the plate) and under the feet, then dies away. Every flying droplet throws a soft moving bright spot inside its own shadow. During the pour, the stream, the rivulets and the rising meniscus sweep their light across the floor. A scroll notch sways the pattern and makes it flare briefly.

**Physics.**
- Ring waves are lenses. With amplitude ≤ 0.006 C, slope ≤ 0.25 (§2.6) and ring wavelengths of 0.04–0.08 C, their focal length is f ≈ 1/((n − 1)·κ) ≈ 0.15–0.2 C.
- The receiver is 0.3–1.0 C behind the letter, so it lies past the focus. That is exactly the condition for a cusp network: the pool-floor pattern.
- A water droplet is a ball lens (f ≈ 2r), so it casts a defocused bright disc with a shadow rim.
- The 9° softbox blur (L·tan 9° = 0.05–0.16 C) keeps the pattern soft on the far wall and sharper on the floor near the feet.
- **The trace decides the shape; no shape is promised** (spec §0.4).

**What is drawn: ΔE_dyn = E(live surface) − E(rest surface), both at the current light.**
- In the existing raster (§2.4: "+I at new, −1 at old"), the "−1 at old" terms cancel exactly. What remains is `+I_live@new_live − I_rest@new_rest`: the light the motion moved.
- Its integral is zero, because the motion only moves light. That gives a probe identity: |ΣΔE_dyn·area| ≤ 2 % of Σ|ΔE_dyn|·area.
- At rest the surface equals rest, so **nothing is traced and nothing is drawn**: R1's "no caustic shadow" holds bit-exactly.
- Hover moves the light but not the surface, so ΔE_dyn = 0 and hover stays light-only, as R1/R2b decided.
- This is a **chosen subset** of the physical light field: the static soft shadow is withheld. It is recorded here and in CONTRACTS, and the copy never says "physically accurate".

**Plug-in.**
- `caustics.js` gains a `dyn` mode.
- Wire the live chunks into the trace. This is the gap CONTRACTS §15.6 names: line 312 composes `sdfHookDefaultsWGSL` today. The new trace composes `render.chunks.get("waves" | "liquids" | "fill" | "free").code`.
- The trace therefore binds the shade's group 3 (bindings 5–11). Its own rays/params/stats buffers move from 8..10 to 12..14, which is the move §15.3 already foresees.
- **One dispatch traces every ray twice** (rest body, live body). The rest records are cached while the light is still: during a splash under a still light only the live half runs.
- The splat target goes from r16float to **rgba16float** (renderable and blendable in core). `I` becomes per-channel Beer, so the bright filaments carry the stem's faint cobalt cast, T ≈ (0.74, 0.79, 0.93). This is the one tint §2.7 rule 6 allows.
- The sampled atlas (rgba16float, 1152×936, 4 mips) is reused. The rest atlas is never drawn on the hero, so memory grows only by the raw RGB target (+6.5 MB at tier A).
- The "caustic" chunk samples ΔE_dyn × `frame.ext4.x` (the dynamic weight). The weight is driven by real motion: wave energy (`ext2.y`), live liquids, the fill moving, and MPM active. Attack is immediate; the release follows the surface as it decays (no fade that hides a pop).
- `setBusy("caustic-dyn")` is on only while the surface moves (G15).

**Cost.**
- Measured today: trace 0.38–0.46 ms, splat ±0.04, blur 0.07 + 0.09 (A plate, splash).
- Live-only re-trace: ≈ 0.42 ms. RGB splat ≈ 0.12. Blur 0.16.
- At 30 Hz during motion (tier A) that is about 0.35 ms amortised and 0.7 ms on trace frames. Tier B: 15 Hz at 192². Tier C: 10 Hz at 128².
- 0 ms at rest.

**Kill criterion (2 h spike first).** Take the R1 rest set, click the stem with `?manual=1`, and measure max |ΔE_dyn| outside the water mask over 0.1–0.8 s.
- If it is **< 6/255 at the plate**, the R1 physics (diverging rims, 9° blur) wins. L1 then ships only for the feet foci and the droplets' spots, or not at all, and this is reported.

### L2 · Bubbles: internal flow made visible

**Seen.**
- **The pour** entrains 24–40 micro-bubbles at the apex impact. The rivulets carry them down, then they rise through the filling legs as the level climbs.
- **At rest**, 2–3 of them stay trapped under the crossbar's top edge: the second piece of "it was poured" evidence beside the beads, and the first thing in the still that says liquid, not glass.
- **A click** entrains 6–12. They spin for about 0.5 s in a small eddy pair beside the impact, then climb the stem along its upper rim to the apex and pop. Each pop leaves one ring (radius 0.06 C) and 2 micro drops; the spec already said this (§1.2: "pops at the top surface and leaves 1 ring and 2 micro-drops").
- **A drag** through the face leaves a short trail of them.

**Physics, kept honest.**
- Buoyant rise speed v = clamp(0.18 + 6r, 0.22, 0.35) C/s.
- Along a rim, buoyancy is projected onto the rim tangent. Bubbles therefore slide *up the stem to the apex*, which is the mould's opening (the pour enters there), and *stall under the horizontal crossbar*, as real bubbles do under a ceiling.
- Touching bubbles coalesce (volume sum, 0.15 s wobble). At most 3 stay trapped; older small ones dissolve, shrinking over 2 s.
- Path lengths are ≤ 1 C at ≥ 0.22 C/s, so every bubble settles (pops or is trapped) **≤ 5.0 s after the last input** (G15).

**The flow (cheap, deterministic, never called "simulation").**
- ≤ 8 Lamb–Oseen vortex blobs at the mid-plane: core 0.04 C, circulation decaying e^(−t/0.8 s).
- Sources:
  - a click: a counter-rotating pair ±0.05 C from the impact (the 2D section of a vortex ring);
  - a drag: pairs every 0.03 C along the path, Γ ∝ speed;
  - the pour: one pair at the apex inflow.
- Each bubble's velocity is buoyancy + Σ blob velocity + the event kick, clamped to 0.6 C/s.
- Integrated on the CPU at the fixed 60 Hz step with no allocations: 96 bubbles × 8 blobs ≈ 800 evaluations, < 0.05 ms of main thread. Seeds use mulberry32 per (step, event).

**Plug-in.**
- New plugin `life.js` (pool + blobs) and chunk `wgsl/life.wgsl.js` (hook K10 "bubbles", §4).
- Bubble radii are log-normal, median 0.007 C, range 0.004–0.02 C: 0.9–4.5 px at the plate, 1.8–9 px at the end of S3. Sub-2-px bubbles use the §2.1 impostor coverage.
- Rendering:
  - a 2D bin grid over `WAVE_RECT`: 25×22 cells of 0.05 C, ≤ 4 bubbles each, built on the CPU only when bubbles moved, ≤ 6 KB upload, binding 9;
  - in each water segment the shade walks the cells the segment's xy projection crosses (≤ 3), so ≤ 12 ray–sphere tests;
  - the existing silver TIR rim code (D8) is reused unchanged.
- The live slots of `drops.addBubble` (≤ 2) and the 4 static body bubbles hand over to the pool.

**Cost.** Est. +0.05–0.15 ms at the plate during motion (water ≈ 27 % of the plate pixels), and +0.02 ms at rest for the trapped ones.

**Kill / A/B.** `?bubbles=0|24|96`. If bubbles read as **ice** (air frozen in a solid), resting bubbles go to 0 and only moving ones remain.

### L3 · M9: MLS-MPM comes back where particles are the truth

**Kept from spec §3.7.**
- MPM never represents the resting letter. It simulates free water in the air, inside a local brick around the event.
- No confinement. Gravity is slow-motion, 12 C/s².
- EOS γ 1, k 50; viscosity 0.08. CFL cap 1 cell per substep.
- Particles entering the body are absorbed as face-wave impulses. Floor clusters become beads.
- The brick sleeps 2 s after the event.
- The port map in dossier 45 is exact:
  - `clearGrid` and `p2g_1` verbatim;
  - `p2g_2`: change the literal `pow(density / rest_density, 5.)` to the γ 1 form;
  - `updateGrid`: drop the SSF-depth mouse raycast, add gravity;
  - `g2p`: keep the APIC gather and advect, delete the confinement, explode and un-stick (HEAD L103–209);
  - `copyPosition`: once.

**Deepened.**
- **Tier A resolution matches the approved crown.** At the spec's h = 0.016 C an iso-surface droplet needs about 3 cells across, r ≥ 0.024 C, which is fatter than the "molto" crown droplets Alberto approved (0.016–0.022 C).
- So tier A uses **h = 0.0104 C**:
  - brick 96×96×48 (1.0 × 1.0 × 0.5 C);
  - 442k cells × 16 B = 7.1 MB, plus a 1.8 MB density brick;
  - **8,192 particles per event** (80 B each: 655 KB).
- Tier B keeps the spec's 64×64×32 at h 0.016 C with 2,048 particles. Tier C uses h 0.02 C with 1,024.
- **CFL at the finer h.** The crown's fastest droplets (1.3 × 1.4 C/s) move 2.9 cells per 1/60 s step, so tier A runs **3 substeps per step**.
  - 189 atomics per particle per substep gives ≈ 4.6 M atomics per step, about 1/6 of the old hero's 28 M per frame.
  - Est. 0.25–0.4 ms while active, 0 otherwise.
  - Fixed point stays 1e7: momentum ≤ 8 ppc × 1 cell/substep ≪ 214.7.
- **The sheet tears, not the spheres.** The crown starts as a ring sheet. Particles are seeded by the (step, event) hash in the face's rim band at the impact, with v = 1.1–1.8 C/s along the cone at 60–75° (the D34 numbers). The rim thickens and pinches into droplets because the fluid does it (Rayleigh–Plateau), not because droplets were placed.
- **Nothing vanishes and no spikes appear** (D26, and the 06-27 «effetti sullo schermo orribili»):
  - the iso threshold never draws sparse particles as needles (the failure mode of SSF);
  - brick cells with 0.15–0.5 ρ_iso and no iso neighbour are compacted on the GPU (≤ 16 per event, a 3-frame-late staging map, the TimestampRing pattern);
  - each becomes one analytic micro drop (`drops.spawn({ kind: "micro" })`), and its particles retire;
  - spray therefore stays visible as the approved analytic droplets, and mass is conserved within the probe's 0.5 %/min.
- **Rendering.**
  - Density is splatted into the brick (i32 atomics, 27 taps per particle), followed by one 3×3×3 binomial pass.
  - φ_mpm = c·(ρ_iso − ρ̃) with manual trilinear sampling (8 loads; no `float32-filterable`), slope-limited so Lipschitz ≤ 1.25 holds (step scale 0.75, bisection).
  - It is clipped outside the body (φ' = max(φ, −f_body)) and smin-unioned (k = 0.5 cell) through hook K11 "free". It goes through **the same trace and optics**: droplets refract the page and the letter, and L1 makes them throw light. No SSF.
- **Where it plays (v1 of KEEP).**
  - Clicks (hero and S3 full screen) and the L4 tendril's pinch.
  - The **pour's apex crown stays analytic** (R2-approved) unless gate KD3b passes. Adding the MPM chunk to the S1 boot shade (est. +40–80 ms of compile) runs into the recorded **14 ms worst-case margin** to the 2.6 s counter cap.
  - The MPM pipeline set ("mpm", reserved in `gpu.js`) is pre-compiled in idle time after the pour settles. A click that arrives before it resolves plays today's analytic "molto" click: a fallback that is honest by construction.

**Cost.** Est. sim 0.25–0.4 ms + iso in the trace 0.3–0.5 ms at the plate while active, 0 ms 2 s after.

**Kill.** If the MPM crown reads blobbier than "molto" at the plate in the R-gate, `?mpm=0` keeps the approved analytic click. MPM then stays only on S3 full screen and the tendril, where cells are 2× larger on screen.

### L4 · M4b: pull a serif out, it heals (desktop, fine pointer)

The spec's G9 SHOULD, never built. It is the single interaction that proves *liquid* rather than glass: you pull water out of the letter.
- Press and drag outward from a rim.
- An analytic tendril (capsule, smin k 0.008 C, radius tapering from 0.6·r̃_in to 0.15·r̃_in) stretches toward the pointer.
- Past 0.12 C the neck is handed to MPM (L3) and **pinches into 1–3 real drops** that fall and land as beads.
- On release it snaps back (spring ζ 0.5) and the stroke re-forms in 1.2–1.5 s.

Touch keeps `pan-y`, so phones do not get it: an input difference, as the spec says.

### L5 · M10: the dive, and HDR highlights

**The dive** (spec §1.4 stretch, desktop S3 900 → 1800):
- The camera walks through the stem's front face, timed to cross the surface **within ±1 frame of the moment the "Now" sheet's hairline crosses the plate centre**.
- Inside:
  - the first event of every ray is an *exit*;
  - the page outside is seen through Snell's window, a bright cone of 2 × 48.6° = 97.2° that is physically exact for n 1.333;
  - beyond the window, TIR mirrors the letter's own interior;
  - bubbles (L2) drift past the lens;
  - the last frame is the page magnified ×1.33 through water.
- No horizon, no sea, no blue fill (07 NEW).
- It is the one beat where the water *is* the screen, the "scroll immersivo che si muove" beat. The Golden Hour hero had it as "SCROLL TO DIVE" with a sunset; this one keeps the paper world.
- Hook K12 "medium" (default: air).
- Cost: est. 6–9 ms full screen at DPR 1.5, so the existing DPR ladder steps to level 2 (DPR 1.0): 2.9–4.0 ms, under the S3 p95 5 ms.

**HDR**, gated: `matchMedia("(dynamic-range: high)")` + a `configure()` try with `toneMapping: { mode: "extended" }` on an rgba16float swapchain + a readback check.
- Untouched paper still writes exactly the token bytes ÷ 255.
- Water pixels skip the 0.93 shoulder above 1, and the value ceiling rises from 1.35 to 2.5 only in extended mode.
- On HDR phones and Macs, the softbox highlight on the water is literally brighter than the page's white, the cue a product photograph of water gives. On SDR everything is identical to today.
- Browser support and the exact enum are verified against the living spec at KD5 (the `webgpu` skill's `current-sources.md` rule). **Default off on Windows** until a paper-match probe passes under Windows HDR (§8 risk 8).

### L6 · A real reflected world (A/B only)

The only explicit "perfect" on record (07-01, paraphrase of 0f41ed3) was about **the reflection of a real photographic world**, not the jelly. Today's environment is the analytic softbox (§2.3).

Two A/Bs, with the analytic one staying default:
- `?env=photo`: a CC0 photographic studio HDRI (Poly Haven, via the connector's `search_assets`), 1024×512 equirect in RGBE-in-PNG, ≈ 1 MB, fetched only on the home after a real adapter.
- `?env=cycles`: the same rig rendered path-traced in Blender Cycles with an equirect camera: a white cove, the key softbox at az 30° el 24°, the strip fill, a window. It is physically rendered, so it is not the "procedural fake" of 07-14.

Both are baked into the existing 256²×6 GGX cube in the key-light frame, so the hover and S3 rotation of the rig keeps working. Primary rays still see the exact paper.

No sunset. The copy credits the HDRI in the colophon if it is adopted.

### L7 · Stills that read as water (A/B)

The dossier's own finding is that stills of *motion* read as water while stills of rest read as gel or glass. The no-WebGPU posters (v1/v2/v3, 892×940, lossless) can be **a frozen splash instant**:
- `?manual=1`, deterministic seeds, the frame at click + 0.18 s: a torn crown, light spots, bubbles in the eddy;
- captured from the page by `w8_posters.mjs`.

"Still frame captured from this engine." stays literally true. Est. 40–90 KB lossless against 22–43 today. The LCP path is unchanged: the poster is the LCP on gl-off, and the engine is never downloaded. A/B `poster=rest|splash`.

### L8 · Honest host and caption

- The instrument shows **one live count at a time**: `{n} particles` while MPM runs, else `{rays} caustic rays` while ΔE_dyn is on screen, else nothing. Then `WebGPU · {ms} ms GPU · DPR {dpr}`.
- One token keeps the caption at the spec's measured 2 lines at 1024 px. Two counts plus ms measured 3 lines (§4.4).
- Counts are read from the engine (spawned particles, traced rays). Never "120,000" (the old real count was 74,403).

---

## 3. What the reader sees, frame by frame

| moment | desktop 1440×900 | phone 390×844 |
|---|---|---|
| **Arrival (S1)** | Unchanged choreography (R2): the window opens on paper, the stream enters at run + 0.10 s, the apex impact at + 0.25 s. **New:** a band of light moves across the floor behind the stream; at the impact 24–40 micro-bubbles are entrained, carried down the rivulets, then climb the filling legs with the level. The level reaches the apex, the last drop rings it, a light network flickers behind the feet for ≈ 1 s. The window travels to the plate; the travel's tilt impulse makes one last sway of light | The same pour in the live window (Q2 → b), the same bubbles and light (tier B: caustic 15 Hz at 192²) |
| **Rest** | The R1 frame: a clear Cormorant A, σ 0.6, κ 0.45, on the page's paper, no caustic shadow, 2 beads at 75°, **plus 2–3 bubbles trapped under the crossbar** (silver rims, 2–4 px). Zero submits 5 s after the last input | The same, C ≈ 180 px |
| **Hover** | The key light follows the pointer ±25° (R2b). Highlights crawl along the rims and the bubble rims glint. No caustic: the surface is still, so ΔE_dyn = 0 | — (touch has no hover) |
| **Click on the stem** | The drop falls in 0.32 s. **A fluid crown sheet** (8,192 MPM particles) lifts ≈ 0.1 C; its rim beads up and tears into droplets that arc and either fall back (each rings the face) or land as beads. Each droplet throws a soft moving light spot with a shadow rim. The crater rings run across the stem and reflect off its edges. A letter-sized light network dances on the paper for ≈ 1 s. 6–12 bubbles spin in the eddy pair, then climb the stem and pop at the apex. Still by ≤ 5 s | Tap = the same event at tier B: 2,048 particles at h 0.016 C, small fragments handed to analytic drops |
| **Click on paper** | Today's bead (120 ms squash), plus its light spot during the fall | Same |
| **Drag from a serif** | A water tendril stretches toward the pointer, necks past 0.12 C, pinches 1–3 real drops, snaps back and heals in 1.2–1.5 s | — (touch drag scrolls) |
| **Scroll** | The wheel tilts the faces (the R2b shimmer) and the caustic network sways and flares on the floor. **S3:** the A grows to C ≈ 460 px and stays interactive (a click there makes a crown about twice as large on screen). **M10:** from 900 to 1800 the camera enters the stem as the sheet's hairline crosses: Snell's window, the page bent ×1.33, bubbles past the lens. On HDR displays the highlights glow above paper white | Slosh + light. No S3 or dive (contract: desktop only; §8 risk 9) |
| **Reduced motion** | The R1 still (one submit) with the trapped bubbles. No MPM, no light motion, no dive. `.hr-still` shown | Same |
| **No WebGPU** | The poster (rest, or a frozen splash instant per L7), `.hr-still`, the engine never downloaded | Same |

---

## 4. Engine design: how it plugs in

**The contract is unchanged.**
- Plain JS + `// @ts-check`, WGSL in `*.wgsl.js`, no deps, core formats, opaque canvas, exact-paper composite.
- A fixed 60 Hz `registerStep` with mulberry32 per (step, event): 60 and 120 Hz strips stay hash-identical.
- `setBusy` only while moving, and 0 submits when idle.
- Plugins via `export async function plugin(internals)`.

**KD0, the only edits to shared files** (additive, the pattern of the Hooks milestone, CONTRACTS §15). Each default reproduces today's shade **pixel-identically** (w2 `identical`, w6 `identical`).

| hook | default text | call site | owner |
|---|---|---|---|
| **K10 "bubbles"** | the current static-bubble loop moved behind `fn bubblesHit(ro, rd, tMax) -> vec4f` | the shade's water segment (one call site) | `life.js` |
| **K11 "free"** | `fn freeSDF(p : vec3f, f : f32) -> f32 { return f; }` | `bodySDFWith`, after `liquidsSDF`, before `fillSDF` | `mpm/mpm.js` |
| **K12 "medium"** | `fn cameraMedium() -> u32 { return 0u; }` | the shade's segment-0 setup | `dive.js` |

Also in KD0:
- `index.js`: `KNOWN_MODULES += life, mpm, dive, envphoto`.
- Frame `ext4` = (dynamic caustic weight, bubble count, MPM active, medium).
- `TimestampRing` queries 64 → 96, i.e. 12 timed passes per frame: shade, waves, caustic ×5, mpm, wet stamp, life upload, plus spares.
- CONTRACTS §22.

**Group 3 additions** (`FRAGMENT | COMPUTE`):

| binding | owner | resource |
|---|---|---|
| 9 | life | bubbles (vec4 × 96) + bins (u16 × 25·22·4), storage read |
| 10 | mpm | density brick ρ̃ (array<f32>, 96·96·48 at tier A), storage read |
| 11 | mpm | brick params (origin, h, dims, iso, active) uniform 64 B |
| — | caustics | the trace's own rays/params/stats move from 8..10 to **12..14** (it now binds the shade's group 3 to evaluate the live chunks; foreseen in §15.3) |

**Passes per frame in motion** (tier A, est. unless marked):

| order | pass | when | ms (7800 XT) |
|---|---|---|---|
| 5 | mpm (clear, p2g1, p2g2, grid, g2p ×3 substeps, splat, binomial, orphan compaction: one compute pass) | event active ≤ 2 s | 0.25–0.4 |
| 10 | waves (measured pass) | waves alive | 0.01–0.04 |
| 20 | caustic trace (live; rest cached unless the light moved) + stats | ΔE_dyn on, ≤ 30 Hz | 0.42 (measured live trace 0.38–0.46) |
| 21–24 | splat ± (RGB), blur H/V + mips | same frames | 0.12 + 0.16 |
| — | life: CPU step + ≤ 6 KB upload | bubbles moving | < 0.05 main thread |
| 90 | shade (scissored plate) | any frame drawn | splash 1.31 measured + bubbles 0.1 + MPM iso 0.3–0.5 |

**Pipeline sets.**
- "first": unchanged. The S1 boot shade stays today's (+ the K10–K12 defaults, ≤ 10 ms, probed in KD0).
- "deferred": caustic dyn trace and the RGB splat.
- "mpm": compiled in idle time after `pour:settled`.
- The life, free and medium chunks commit in **one** `heroCommit` after the pour settles (D20b), so the S1 path keeps one hero compile.
- Est. +60–120 ms on that post-pour compile (today 319 ms; the accepted FAIL is recorded, not hidden).

**Memory, tier A:** today ≈ 32 MB → est. ≈ 48 MB (MPM grid 7.1 + density 1.8 + particles 0.7 + caustic RGB raw 6.5 + bins). **No MPM allocation until the first MPM event**, freed 10 s after the last one.

**Tiers** (no effect removed at any tier; spec §3.5 doctrine):

| | A | B | C |
|---|---|---|---|
| ΔE_dyn rays / rate | 256² / 30 Hz | 192² / 15 Hz | 128² / 10 Hz |
| MPM h / particles / substeps | 0.0104 C / 8,192 / 3 | 0.016 C / 2,048 / 2 | 0.02 C / 1,024 / 1 |
| bubbles pool | 96 | 64 | 32 |
| dive DPR ladder | [1.5, 1.25, 1.0] | × 0.85 | × 0.70 |

---

## 5. Performance

**This machine** (AMD Radeon RX 7800 XT, rdna-3, Windows, Chrome; measured base from `w8_perf_report.json`, additions est.):

| state | today p95 (measured) | KEEP p95 (est.) | budget |
|---|---|---|---|
| A plate, rest (shade only) | 0.32 | 0.34 (trapped bubbles) | 2.0 |
| A plate, idle | 0 submits | 0 submits | 0 |
| A plate, splash (worst) | 1.31 | 2.2–2.6 (with L1 on its trace frames + L3) | **2.6** (spec M9 ceiling) |
| A plate, pour | ≈ 1–1.5 (spec), boot compile 364 ms | + live caustic 0.7 on trace frames; **boot compile unchanged** (KD0 defaults ≤ +10 ms) | 2.0 / accepted FAIL |
| A S3 full, splash (2160×1350) | 3.93 | ≈ 5.7 at DPR 1.5 → ladder level 1 → ≈ 4.3 | 5.0 |
| A dive (full, inside water) | — | 6–9 at DPR 1.5 → ladder level 2 → 2.9–4.0 | 5.0 |
| B dock (497×622), splash | 0.75 | ≈ 1.1 | 8 |
| band | 0.25–0.27 | unchanged | 0.5 |
| main thread / frame | ≤ 0.4 | ≤ 0.4 (life step alloc-free) | 0.4 |

**Levers, in order:**
1. the dynamic trace at 192² during motion (−44 % rays);
2. MPM substeps 3 → 2 with a 1.2 C/s droplet cap;
3. the bubble pool to 64;
4. the S3 ladder engaging earlier.

**Phones and iGPUs** cannot be measured here.
- Today's tier-B dock splash is 0.75 ms on the 7800 XT. A phone GPU has roughly an order of magnitude less raw throughput (public spec sheets, not measured), so the worst splash state may already be 8–15 ms on a phone, and KEEP adds ≈ 40 % to that state only.
- Safety nets:
  - tier B runs the light at 15 Hz and MPM at 2,048 / h 0.016;
  - the one-shot downgrade (B → C at 11 ms median, built and measured in M8a) takes tier C (light 10 Hz at 128², MPM 1,024, bubbles 32);
  - rest and idle are unchanged on every tier.
- The R-gate includes **Alberto's own phone**, live.

**Reduced motion.** One submit (today's still) with the trapped bubbles; ΔE_dyn = 0 by construction, no MPM, no dive.

**No WebGPU.** The poster path, the engine never downloaded, Lighthouse gl-off 86–92 unchanged. All KEEP modules are deferred home-only modules, so the lab path never sees them.

---

## 6. Honesty: what becomes true, nothing faked

- **"Caustics traced from its surface"** becomes true for the hero again, whenever the light is on screen. The rays are traced every re-trace from the live surface.
  - Never "real caustics", never "physically accurate". The doc and CONTRACTS §22 record that the drawn field is the changing part, with the static shadow withheld by design (R1).
- **"MLS-MPM"** and **"{n} particles"** become true once KD3 ships, and only as live, spawned counts per event (8,192 / 2,048 / 1,024). "Simulation" is never used for the resting letter, nor for the bubbles' flow (vortex blobs are a model, not a solve).
- **The CV clause** «simulated water with real caustics» can become "real-time water with caustics traced from its moving surface; MLS-MPM splashes" after KD1 + KD3 are verified on screen. Alberto is told then. "120,000-particle fluid" stays false forever (the old real count was 74,403).
- **Posters.** "Still frame captured from this engine." stays literally true for a frozen splash instant (deterministic manual step, captured from the page).
- **The HDRI**, if adopted, is credited in the colophon (copy flag). HDR adds no copy.
- `check-claims.mjs` and `w8_claims.mjs` gain: the instrument string equals the latest `fx:gl:stats`, "particles" never appears when MPM is idle, no count is hardcoded.

---

## 7. Why this fits Alberto (dated quotes)

**Answers:**

| date | his words | how KEEP answers |
|---|---|---|
| 2026-09-18 | «il logo in 3d della A fatta di acqua era nella giusta strada. mancava solo perfezionamento e lavoro aggiuntivo per creare un esperienza bella, e super realistica» | The perfezionamento was the letterform, now done to 0.1 texel. KEEP is the "lavoro aggiuntivo … esperienza" half, on top of it |
| 2026-09-20 (R1) | «Acqua, si va avanti» | The approved body is not touched: σ 0.6, κ 0.45, paper ground, no rest shadow, beads 75°, no cards |
| 2026-09-22 (R2) | «bene, ma prima la colonna» · click «louder» · hover «wider» · scroll «visible» | His every note asked for **more visible consequences of input**. L1 turns sub-pixel surface motion into letter-sized light motion without breaking §2.6. L3 gives the click a real crown |
| 2026-09-22 (R2b) | the column «as it is, go ahead»; click «molto» stays; the scroll shimmer accepted | The column's look and the "molto" click are untouched (`?mpm=0` keeps it exactly). L1 adds the column's light, not a new column material |
| 2026-06-27 (paraphrase, 540cb50) | a **radial slow-motion splash** that recomposes, not a downward rush | The MPM crown at g 12 C/s², radial, then absorbed back into the letter |
| 2026-07-14 | «pieno controllo, lasciami a bocca aperta» · «continua a migliorare e aggiungere cose bellissime animate» | Eight additive moves, each behind a flag |
| 2026-08-25 / 08-19 | «sono le particelle che si illuminano in movimento che fanno la linea illuminata» · «vorrei le particelle» | Particles (MPM) at the moments where they are physically the truth, and their light on the paper |
| 2026-08-24 | «è quasi un video, uno scroll immersivo che si muove» | The M10 dive: the S3 scroll carries the camera into the water |
| 2026-07-01 (paraphrase, 0f41ed3) | the reflection «perfect» | L6: a real (photographic or path-traced) reflected world as an A/B, without the sunset |
| 2026-07-14 | «troppo artificiale, dev'essere tutto realistico» | No noise, no procedural sparkle: every new pixel is traced (caustics, droplets, bubbles) |
| 2026-09-09 | «anche da telefono … il preloader bellissimo come da desktop» · Lusion «identico a quello desktop» | Same pour, bubbles, light and MPM on the phone at tier B; only hover, tendril and the S3 dive differ (input or contract) |
| 2026-09-09 | «se devi verificarlo, devi aprirlo in webgpu» | The R-gate is live in the WebGPU pane; probes refuse fallback adapters |

**Risks to his taste:**

| date | his words | the risk |
|---|---|---|
| **2026-10-09** | «adesso c'è un altro stile, ma non so se lo preferisco ora come ora» | KEEP deepens exactly the style he is unsure of. Its rest still is the R1 still. |
| **2026-10-09** | «avevo prima un effetto in webgpu super realistico» | If he means the old *look* (full-bleed, saturated teal over a world), KEEP does not bring it back at rest; only S3, the dive and L6 move toward it |
| 2026-06-24 | «il colore è il materiale» | The resting letter stays the pale cobalt-grey he accepted at R1. Colour arrives only in motion (the cobalt cast of the light) |
| 2026-06-27 | «effetti sullo schermo orribili» (the spiky white explosion) | An MPM crown that sprays needles would be the worst possible regression. L3's iso threshold and analytic hand-off exist for this; `?mpm=0` is the escape |
| 2026-07-14 | the CSS sun «non è questo il livello» | A caustic too faint to read at the plate would be a non-event; the L1 spike kills it early |

---

## 8. Risks (ranked) and kill criteria

1. **Taste.** He may want the old *style*, not a deeper version of this one. A still screenshot of KEEP at rest equals today's R1 frame, so any screenshot-based comparison under-sells it.
   - Mitigation: judge it live (the dev page with the scripted replay, §10), the frozen-splash poster A/B (L7), the env A/B (L6).
2. **G15 caps the life.** A passive reader (no input) gets the pour plus ≈ 5 s, then a still. The old A was perpetual. Only an explicit G15 lift **with** a WCAG 2.2.2 pause toggle in the caption changes that; the spec rejected it, and this direction does not assume it.
3. **L1 may be too faint at the plate.** The R1 physics: the rims diverge light 3–6×, the softbox blurs by 0.05–0.16 C. The 2 h spike decides: max |ΔE_dyn| < 6/255 → feet foci and droplet spots only, or off.
4. **Bubbles may read as ice.** Air frozen in a solid is the opposite of the goal. Only moving bubbles plus ≤ 3 trapped; A/B 0 / 24 / 96.
5. **MPM look.** An iso-surface at 2–3 cells can read lumpy or fat. The crown sheet (today's analytic tube is 0.009–0.018 C) is thinner than 2 cells even at h 0.0104 C, so the MPM sheet will be thicker than the approved one. Escape: `?mpm=0`.
6. **Compile budget.** The hero shade compile is already an accepted FAIL (boot 340–370 ms, post-pour 319 ms). KEEP adds est. +60–120 ms to the post-pour commit, not the S1 path. The pour MPM crown would hit the S1 path (14 ms margin), so it stays behind gate KD3b.
7. **Phones and iGPUs are unmeasured.** The worst state may lag on a phone; the tiers and the one-shot downgrade are the net, and his phone is the judge.
8. **HDR on Windows.** Under Windows HDR the canvas's SDR white may not match the DOM's paper by a level or two, which would show a faint box. Gated, probed, default off on Windows.
9. **The dive is desktop-only** (contract S3), against his mobile-parity doctrine. A mobile dive is a backlog item, not in this scope.
10. **Scope 75 h with agent lanes** that have died at session limits before. Each KD is committed as built, behind its flag, and independently removable.
11. **Honesty drift.** Counts must be live, and ΔE_dyn is a chosen subset of the light field (recorded). The claims probes enforce both.
12. **L6 reopens an R1-adjacent question** (reflections change the letter's read). It stays an A/B; the analytic softbox stays default.

---

## 9. Build plan (lanes in git worktrees, each with its own static server)

**Setup.**
- One worktree per lane off `feat/water-hero`, e.g. `git worktree add ..\pat-keep-E1 -b feat/water-keep-E1`.
- Each lane serves its own tree: `cd <wt>\public && python -m http.server 517x --bind 127.0.0.1` (5179, 5180, 5181, 5182).
- Probes run with `RV_BASE=http://127.0.0.1:517x` (`lib.mjs` honours it), **headless always** (`lib.mjs launch()`), real Chrome, and refuse fallback adapters.
- Every KD ends with:
  - 1440×900 and 390×844 shots, a clean console (0 errors, 0 WebGPU validation warnings);
  - its probe, and `node assemble.mjs --check`;
  - `w0_paper` (exact paper) and the flags-off identity probe.
- The director commits per KD; lanes never commit to the shared checkout.

| KD | lane · h | files (disjoint) | deliverable | acceptance probe |
|---|---|---|---|---|
| **KD0** | E3 · 6 | `sdf.wgsl.js`, `shade-hero.wgsl.js` (hook call sites only), `index.js`, `gpu.js` (TimestampRing size), `CONTRACTS.md` §22, `dev/keep.html`, `scripts/probes/water/k0_*` | hooks K10–K12 with identity defaults, ext4, flags (`?keep=`, per-item flags), the scripted-replay bench | **k0_identity**: flags off → w2 `identical` 0 px at plate/full/mobile, w6 `identical`, w0 exact paper; S1 boot compile delta ≤ +10 ms (w5_bootsplit); 0 submits 5 s after input |
| **KD1** | E1 · 9 (starts with the 2 h spike) | `caustics.js`, `wgsl/caustic-trace`, `caustic-splat`, `caustic-chunk` | live chunks in the trace, bindings 12..14, dual trace with rest cache, RGB splat, ΔE_dyn sampling, motion weight, tier rates | **k1_caustic**: rest = 0 px of |ΔE_dyn| (strict mask equals HEAD); click strip of 12 frames at 60 ms: max |ΔE_dyn| ≥ 6/255 outside the water mask within 0.1–0.8 s, ≥ 30 % of |ΔE_dyn| energy outside the silhouette, back to 0 by 2.0 s; zero-sum ≤ 2 %; hover-only run → 0 traces; plate p95 in a splash ≤ 2.0 ms (before KD3) |
| **KD2** | E2 · 10 | new `life.js`, `wgsl/life.wgsl.js`; `drops.js` (bubble hand-over only) | pool, blobs, buoyancy, rim slide, pop/trap/coalesce, bins, pour/click/drag sources | **k2_bubbles**: the pour leaves 2–3 trapped bubbles (seeded, identical across runs); click → ≥ 6 visible bubbles moving ≥ 0.1 C in 1 s; all settled ≤ 5.0 s after the last input (submit counter flat); 60/120 Hz strips hash-identical; `holes` = 0; post-pour compile delta logged |
| **KD3** | E4 · 14 | `scripts/port-mpm-kernels.mjs`, `engine/mpm/**` | port (dossier 45 map), tier bricks, seeding, absorb → impulse/bubbles, floor → beads, orphan → analytic drops, iso via K11, pipeline set "mpm" pre-warmed after `settled` | **k3_mpm** (spec M9 + more): a strip of the crown tearing into droplets; no iso feature < 2 cells left drawn (orphans handed over, logged); a 10-min soak with no NaN, mass drift < 0.5 %/min; 0 dispatches 2 s after; plate p95 ≤ 2.6 ms with KD1 on; S3 full holds 5 ms through the ladder; a click before the set resolves plays the analytic molto |
| **KD3b** | E4 · 3 (gate) | `pour.js` (MPM crown branch) | the pour's apex crown on MPM | only if w5_bootsplit keeps t_run + compile ≤ the 2.6 s cap with ≥ 60 ms margin on 10 cold runs; else not shipped, recorded |
| **KD4** | E2 · 5 (after KD2 + KD3) | `drops.js` (tendril part) | M4b tendril, neck → MPM pinch | **k4_tendril**: drag strip; neck at > 0.12 C; 1–3 drops landed as beads; heal ≤ 1.5 s; `holes` = 0; touch → no tendril |
| **KD5** | E1 · 9 (after KD1) | new `dive.js`, `wgsl/dive.wgsl.js` (K12); `gpu.js` `configureCanvas` option; `composite.wgsl.js` extended branch | M10 dive + gated HDR | **k5_dive**: 12-mark strip over 900→1800; surface crossing within ±1 frame of the hairline crossing the plate centre; Snell's window half-angle 48.6° ± 1° measured on a flat-face test; no horizon or blue fill; ladder p95 ≤ 5 ms. **k5_hdr**: paper bytes identical in standard and extended; extended highlight ≥ 1.5× SDR white on the float capture; Windows default off |
| **KD6** | E3 · 4 | new `envphoto.js`, `water/assets/studio-*.png` (+ provenance sidecars), Blender render script | `?env=photo` / `?env=cycles` | **k6_env**: w0 exact paper; the R-sheet pairs; the asset fetched only after a real adapter on the home (network log), never on gl-off |
| **KD7** | E3 · 6 (after KD1–KD3) | `fx-water.js` (HERO_MODULES behind flags), `fx-hero.js` (caption writer, copy flag), `w8_posters.mjs` (`poster=splash`), `w8_claims.mjs`, `tier.js` (tier table) | host wiring, one-token caption, posters A/B, tier table, claims | **k7_host**: caption 2 lines at 1024 in every state; "particles" absent when MPM is idle; the instrument equals the latest `fx:gl:stats`; posters lossless, exact paper, bit-identical across two contexts; Lighthouse gl-off median within ±2 of 86–92 and the engine never requested; w8_perf tables for tiers A/B/C within §5 |
| **KD8** | all · 9 | reviews (look, code, spec) + fix batch + verifier | — | everything above re-run on the merged tree; the R-sheet `_shots/water-hero/k1/K1-acqua-viva.html` |

**Order.**
- KD0 first, alone: it is the only lane touching shared shade files.
- Then in parallel: E1 KD1 → KD5; E2 KD2 → KD4; E4 KD3 (→ KD3b gate); E3 KD6, then KD7.
- KD8 at the end.
- Critical path ≈ 6 + 9 + 9 + 6 + 9 = 39 h wall-clock.
- Total effort **75 h**: KD0 6 · KD1 9 · KD2 10 · KD3 14 · KD3b 3 · KD4 5 · KD5 9 · KD6 4 · KD7 6 · KD8 9. Without the optional KD3b and KD6, the core is 68 h.

**Cut line**, if time runs out (in this order, last cut first): KD6 → KD5 HDR → KD3b → KD4. The core that answers "alive" is KD0 + KD1 + KD2 + KD3.

---

## 10. A/B plan: shipping beside today's A

1. **One page, flags.** On `index.html`:
   - `?keep=0` (default until Alberto's verdict) is bit-identical to today (k0_identity);
   - `?keep=1` turns on L1 + L2 + L3 + L4 + L5;
   - single items: `?caustics=dyn|off`, `?bubbles=0|24|96`, `?mpm=0|1`, `?tendril=0|1`, `?dive=0|1`, `?hdr=0|1`, `?env=studio|photo|cycles`, `?poster=rest|splash`.
   - All flags are uniforms or plugin lists: switching never touches the approved defaults.
2. **The comparison bench `water/dev/keep.html`.** One canvas (one GPU context, as on the site) with a scripted, deterministic replay on the manual clock and seeds: pour → hover sweep → click on the stem → drag from the left foot serif → three wheel notches → 6 s idle → S3 scrub → dive.
   - Key **K** flips keep on/off at the same instant of the replay, so Alberto sees the same moment both ways.
   - **R** replays. A HUD shows per-pass ms and the submit counter, proving the 5 s rule live.
   - Judged in the WebGPU browser pane in the foreground (never a fallback, never an occluded window).
3. **The contact sheet `_shots/water-hero/k1/K1-acqua-viva.html`** (the R1/R2 format, in Italian):
   - per beat, HEAD vs KEEP strips at 1440 and 390, 4× crops, a headless CDP screencast (webm) of the replay in each mode;
   - the per-pass p95 table (§5), the k0–k7 probe verdicts, and the honest-copy table (§6).
   - If the revive and hybrid lanes produce their own sheets, the judge doc `50-water-a-decision.md` links all three side by side.
4. **R-gate "R4 · Acqua viva"** with Alberto, live, desktop + his phone. Each item is go/no-go on its own flag. The verdict is recorded in spec §10 and in CONTRACTS §22, as R1/R2 were.

---

## 11. What this direction refuses

- The 3-capsule letter, the balloon volume, SSF needles, coloured rims, honey motion: everything the dossier lists as the cause of the old look complaints.
- Perpetual churn without his explicit G15 lift and a WCAG 2.2.2 pause control.
- Any sunset, sea or teal-over-a-world (05 §5.2 trap 1). L6 reflects a studio, never a landscape.
- White full-body foam, sparkle cells, noise normals, perpetual sines (§2.7 rule 1).
- A second GPU context or a second renderer on the page.
- Printing any count that is not read live from the engine.
