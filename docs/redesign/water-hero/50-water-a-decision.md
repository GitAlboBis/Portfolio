# 50 · The water A: the decision

> Decision writer, 2026-10-09. Alberto is away for about a day; nothing here waits on him and nothing is asked before his return.
> Inputs: the three directions (`46-direction-keep.md`, `46-direction-revive.md`, `46-direction-hybrid.md`); the three judges (a proxy of Alberto's taste built only from his dated quotes, WebGPU feasibility, an Awwwards jury), summarised in §2; the archaeology dossier `45-old-fluid-a-dossier.md`; the M9 plan `40-m9-plan.md`; the spec `30-hero-build-spec.md` (§1, §3.7, §5, §8–§9.8); `water/engine/CONTRACTS.md` (§15, §18.3, §19.3, §21); the motion canon `docs/redesign/rivista-motion/10-motion-canon.md` (§0, §5); the taste dossier `05-taste-history.md`.
> Status: **decision, nothing built.** Every millisecond is an estimate unless it cites CONTRACTS §19.3 (measured on the AMD Radeon RX 7800 XT, rdna-3, Windows, Chrome, developer timestamps). No GPU work was run for this document.
> Units as in the spec: C = 1 = the A's ink height (223 px at the plate, ≈ 460 px at the end of S3, ≈ 180 px on a 390 phone).

---

## 1. La decisione (per Alberto, due frasi)

**Teniamo la A di Cormorant che hai approvato, identica pixel per pixel a riposo, e le ridiamo la vita della vecchia: il motore MLS-MPM di WaterBall torna come acqua vera che si stacca dalla lettera, cioè la corona del click fatta di gocce reali e, nello scroll S3, il «respiro», in cui tutta la A lascia andare la sua acqua in una fioritura al rallentatore e si richiude dai piedi in su.**
**Sul sito non cambia nulla finché non scegli tu: tutto è dietro `?water=viva`, e al tuo ritorno trovi il confronto dal vivo a tre (la vecchia A di produzione, la A di oggi, la A viva) più un foglio di strisce in movimento.**

For the lanes, in one line: **KEEP ("Acqua viva"), built MPM-first on the existing M9 plan, with REVIVE's S3 exhale/inhale grafted as its signature beat and re-engineered so that particles exist only while water is in the air (dossier 45 §7.4, option 2). HYBRID contributes its rest-identity machinery and its fallbacks. The default page stays today's R2b A, byte for byte, until Alberto's verdict at R4.**

---

## 2. Why

### 2.1 The panel

| direction | Alberto's taste (proxy) | WebGPU feasibility | Awwwards jury | sum | picked by |
|---|---|---|---|---|---|
| KEEP, "Acqua viva" | 6.5 | **7** | 6.5 | **20.0** | feasibility |
| REVIVE, "the vessel is the type" | **7.5** | 3 | **8** | 18.5 | taste, jury |
| HYBRID, "Tipo vivo" | 6 | 5 | 5 | 16.0 | — |

Two lenses picked REVIVE and one picked KEEP. Read together, they agree more than the scores suggest.

- **Taste and jury chose REVIVE for one beat and one fact.** The beat is the S3 exhale/inhale. The taste proxy calls it "the only true jaw-drop beat of the three": the radial slow-motion splash that recomposes, which he asked for in June (540cb50). The jury calls it "the only direction that gives the site one large, shareable, scroll-driven set piece". The fact is a real WaterBall fluid at a real, printed count. Neither judge praised REVIVE's resting vessel: at rest REVIVE is pixel-identical to today, like the other two directions.
- **Feasibility scored REVIVE 3, and its walls come from the vessel, not from the beat:**
  - (a) a Cormorant hairline at 2.35 cells, under the kernel's ~3-cell floor, noisy exactly when the letter wakes;
  - (b) a saturated field (φ ≤ h) that starves the 48/24 step budgets in a full-screen droplet cloud;
  - (c) all 100,105 particles stepping on every wake, and 36k on phones: 5.8–11.7 ms of sim alone against an 8 ms budget;
  - (d) a grid preset switch mid-flight;
  - (e) +60 MB of buffers and a longer page-change teardown seam;
  - (f) a GPU mass ledger with hidden top-ups;
  - (i) nothing judgeable for ≈ 40 h of wall time.

  It picked KEEP because there MPM is event-local and never holds the letter: "the only direction with no hard wall on its core path".
- **All three agree on what loses:**
  - the old letterform and SSF, behind every look complaint on record (capsule sans, balloon volume, needles, coloured rims, jelly body; dossier 45 §4–§5);
  - pointer forces (canon §5: "pointer as a light, not a force");
  - any change to the R1-approved rest frame.

**So the decision takes KEEP's road and REVIVE's destination.** The breath is rebuilt the way dossier 45 §7.4 (option 2) already sketched it: at S3 the exact A gives its water to MPM, and it re-forms from the SDF. The SDF draws the letter at both ends; particles exist only while water flies. Each wall then changes as follows:
- (a), (c), (d) and (f) disappear by construction:
  - no grid ever holds the hairline;
  - phones never run the breath (S3 is desktop-only, spec §1.5);
  - the breath has one brick preset of its own;
  - the released mass is the letter's true volume at 4 particles per cell, so no reservoir and no top-up are needed.
- (e) shrinks to a lazy ≈ 37 MB, desktop only, freed at `fx:nav:start`.
- (b) is the one open question. A 4-hour spike decides it before any choreography is built (§4.2, RL0).

If the spike fails, KEEP's M10 dive, the jury's runner-up for the S3 slot, takes it.

### 2.2 Why not the others as written

- **REVIVE as written.** It hits the walls above. It also needs four contract amendments (spec §3.7, §1.2, §1.4, §4.4) and a hover stir that the canon refuses. We keep its beat, its three-way live A/B with the old A, its time-scale ladder for weak GPUs (slower water instead of fewer effects), its non-awaited stats ring, and freeing the buffers on `fx:nav:start`.
- **HYBRID.** It has the most careful engineering and the least visible result:
  - a ≤ 1-cell ridge is 2.7 px at the plate;
  - its tracers are 1.3–2.2 px;
  - the hairline holds no particles anyway;
  - it edits five files that other lanes own.

  We keep its rest-identity machinery: its own uniform with 0 taps at rest, a box early-out, and a narrow-band φ clamped to [−1.5h, +4h] so the step budgets are not starved. We also keep its "the drop plus the letter's own water" crown (already the M9 seeding), its `?mpmfail` fallback probe and its go/no-go table format.
- **Dossier 45 Path 1 (the old hero as it was).** This is not a product option. It is the reference Alberto compares against, live (§5). If, seeing both, he wants the old letter itself, that is his call at R4. It costs 1–2 days (dossier 45 §7.2), and the solver work planned here serves either path.

### 2.3 His words it answers, and the ones it risks

**Answers.**
- 2026-09-18 «il logo in 3d della A fatta di acqua era nella giusta strada. mancava solo perfezionamento e lavoro aggiuntivo per creare un esperienza bella, e super realistica». The perfezionamento (the letterform) is done and approved. This plan is the lavoro aggiuntivo, with the same engine.
- 2026-10-09 «avevo prima un effetto in webgpu super realistico, ma che era da completare». It closes the items of the old "DA FINIRE" list that fit the contract:
  - a real spray layer (MPM droplets);
  - sleeping;
  - a mobile tier;
  - GPU timing;
  - a fixed timestep and deterministic seeds;
  - a crisp recompose (the SDF);
  - slow motion without honey (γ 1, k 50).
- 2026-06-25 «implementa perfettamente waterball ma al posto della ball una A». WaterBall's `clearGrid` and `p2g_1` are kept verbatim; the ball's forces become the letter's.
- 2026-06-27 (paraphrase, 540cb50): a radial slow-motion splash that recomposes. That is the click crown and the breath.
- 2026-07-14 «pieno controllo, lasciami a bocca aperta»: the breath. 2026-08-24 «è quasi un video, uno scroll immersivo che si muove»: the breath is driven by scroll.
- 2026-08-25 «sono le particelle che si illuminano in movimento…»: particles appear exactly when they move. With L1 (§4.2), each droplet also carries its own light across the paper.
- 2026-08-28 «troppo veloce … fai tutto piu lento e smooth» and 09-03 «non è fluida l'animazione, ma meccanica»: CFL-capped slow motion from a solver, instead of 14 placed spheres.
- 2026-06-27 «effetti sullo schermo orribili» and 07-14 «troppo artificiale, dev'essere tutto realistico». There is no SSF. The iso floor is one cell, and a jet-pinch probe and a look gate with kills guard against needles. Every moving pixel comes from a solver step or the existing wave and drop systems.
- 2026-09-20 R1 «Acqua, si va avanti» and the R2b verdicts (the column as it is, the click «molto»): rest is bit-identical, and `?mpm=0` keeps «molto» exactly.
- 2026-09-09 «se devi verificarlo, devi aprirlo in webgpu»: every gate is judged live on real WebGPU, never on the fallback.

**Risks**, each with its mitigation in §3–§4:
- 2026-10-09 «adesso c'è un altro stile, ma non so se lo preferisco ora come ora». The rest frame is today's. This is answered by the live three-way with the old A (§5) and by a separate rest-presence look gate (`?scale`, `?env`, `?poster`), not by quietly changing the approved still.
- 2026-06-24 «il colore è il materiale». The resting letter stays a pale cobalt grey. σ 0.6 was his own R1 pick over 1.0, so σ is not asked again.
- Lusion «identico a quello desktop … non lagga». The breath is desktop-only because S3 is; phones get the same crown on tap. A plate-local breath for phones is backlog, measured on his phone first.
- 2026-06-27 «orribili». The breath is the riskiest frame on the site, so it has its own spike, its own look gate and three kill levels (§4.5).

---

## 3. What ships as default, and what ships as the A/B

### 3.1 The default

- `index.html` with no flag is today's "Tipo d'acqua" (R2b). The identity probes prove it byte-identical (§4.2, H0).
- Nothing new is downloaded on the default path, on case pages, under reduced motion or on gl-off.
- The default changes only with Alberto's yes at R4, flag by flag.

### 3.2 The flags

The host (`fx-water.js`) and the bench (`dev-water.html`) read the same names.

| flag | values (default first) | what it does |
|---|---|---|
| `water` | absent · `viva` · `now` | `viva` turns on the decided set below and persists in `sessionStorage["rv-water"]` across S4/S5 cuts and the band; `now` clears it |
| `mpm` | `0` · `1` | M9a: the click/tap crown in MLS-MPM (40-m9-plan) |
| `mpmres` | `a` · `fine` | tier-A brick: h 0.016 C with 2,048 particles (M9 plan), or KEEP's h 0.0104 C with 8,192 particles and 3 substeps (an A/B after the timestamps) |
| `release` | `0` · `1` · `partial` | the S3 breath; `partial` releases only the top 40 % of the letter (e ≤ 0.4) |
| `releasehold` | `return` · `freeze` | the reader parks mid-breath: the water comes home after 2 s of quiet (default), or time eases to 0 and the bloom hangs as a still (A/B) |
| `caustics` | `0` · `1` · `dyn` | `1` = today's static M3 caustic (R1 kept it off); `dyn` = only the light the moving water changes, exactly 0 at rest |
| `env` | `studio` · `photo` · `cycles` | the reflected world: the analytic softbox (R1), a CC0 photographic studio HDRI, or the same rig path-traced in Blender Cycles |
| `scale` | `0.46` · `0.58` | the resting glyphScale (a presence A/B); the S3 mapping is rebased so g still reaches 1 |
| `poster` | `rest` · `splash` | the gl-off poster and OG still: today's rest frame, or a frozen crown instant captured from this engine |
| `mpmpour` | `0` | M9b, the apex spray in the pour: off even under `viva`; it needs its compile gate and Alberto (canon §5) |
| `mpmfail` | absent · `pipeline` | debug: forces the analytic fallback |
| `dive`, `bubbles`, `tendril`, `stir` | `0` | reserve and backlog (§4.6); built only if a lane has time |

`?water=viva` means: `mpm=1`, `mpmres=a`, `release=1` (or `partial`, whichever passed RG3), `releasehold=return`, `caustics=dyn` (or `0` if the L1 spike fails), `env=studio`, `scale=0.46`, `poster=rest`.

The presence flags (`scale`, `env`, `poster`) are never in `viva`'s defaults: they answer a separate question (the look at rest).

### 3.3 What the reader sees under `?water=viva`

| moment | desktop 1440×900 | phone 390×844 (tier B) |
|---|---|---|
| **Arrival (S1)** | the R2 pour, unchanged (M9b off) | same |
| **Rest** | the R2b frame, bit-identical; 0 submits 5 s after the last input | same |
| **Hover** | the key light ±25° (R2b); nothing deforms | — (touch) |
| **Click on the letter** | The «molto» drop falls in 0.32 s. At impact, 2,048 particles seeded inside the body around the hit lift a crown sheet that pinches into droplets. Droplets fall back and ring the face, or land as beads; strays hand over to analytic drops. With `caustics=dyn`, each droplet throws a moving light spot and the crater rings throw a light network on the paper for ≈ 1 s. Asleep within 2 s (0 dispatches), still within 5 s | tap: the same at 1,024 particles |
| **Wheel** | the R2b shimmer | same |
| **S3, scroll 0 → 540** | as today (TUVERI leaves its mask at p 0.60) | no S3 (contract) |
| **S3, scroll 540 → 900: the exhale** | The letter's level falls from the apex to the feet. The water of each band it leaves becomes particles that move outward from the letter's centre at ≤ 0.85 C/s under 6 C/s² gravity. Tier A releases up to **49,152 particles**, the letter's true volume at 4 per cell (V = 0.016965 C³, w1_report). At scroll 900 the bloom is ≈ 1.6 C wide (≈ 740 px). Its droplets are ≥ 1 cell (≈ 5 px), each lensing the paper, with cobalt only where they gather | — |
| **S3, scroll 900 → 1260: the inhale** | The water flies back. Each droplet that enters the letter rings its face and raises the level, so the exact A closes from the feet up | — |
| **S3, scroll 1260 → 1800** | the Now sheet rises over a formed, still letter; sleep at 1800 | — |
| **Back up** | it exhales again, then gathers; never a re-seed, never a pop | — |
| **Reduced motion** | the R1 still, one submit; `mpm` never requested | same |
| **No WebGPU** | the poster (`rest`, or `splash` if adopted); the engine never downloaded | same |

### 3.4 The side-by-side page: `public/proto/rivista/water/dev/viva.html`

It follows the pattern of `dev/pour.html`: the bench in iframes, driven through `__water`. Lane P owns it.

- **Lockstep mode (default).** Two iframes of `dev-water.html?debug=1&manual=1`: left = today, right = `?water=viva`.
  - Both start from the same seed, and one scripted replay advances both by the same milliseconds per tick: pour → rest 1 s → hover sweep → click on the stem → 3 wheel notches → 6 s idle → S3 scrub to scroll 900 (the exhale) → hold 3 s → scrub to 1260 (the inhale) → 6 s idle.
  - **K** shows one iframe full-width and flips to the other at the same step index; **R** replays; **1–6** jump to a beat; **Space** plays or pauses; **S** steps.
  - The HUD per iframe shows the step index, per-pass ms, the submit counter, the live particle count and the mass tally.
  - Two devices share the GPU on this page, so its ms are indicative only. Every number in the sheet comes from the w8/w9/w10 probes.
- **Live mode.** The same two iframes on `index.html` (real clock), for feel.
- **Old A.** A link to `http://127.0.0.1:3001/` (§5) and, beat by beat, its recorded webm next to the two engines. The old engine cannot be put in lockstep: its seeds are `Math.random` and its dt is frame-locked.
- Judged only in the built-in browser pane, in the foreground, on WebGPU.

### 3.5 The comparison sheet for his return: `_shots/water-hero/viva/R4-acqua-viva.html`

The sheet is in Italian, in the R1/R2 contact-sheet format, and leads with motion: stills of rest under-sell every direction.
1. **Come guardarlo:** the four live links of §5.5.
2. **I tre a confronto, beat by beat:** old / today / viva webm side by side, with strips at 1440 and 390 and 4× crops. The beats are arrival, rest, pointer, click, wheel, S3 (exhale, p 1, inhale) and the phone tap.
3. **Presenza a riposo:** `scale` 0.46 vs 0.58; `env` studio / photo / cycles; `poster` rest vs splash.
4. **Numeri:** per-pass p95 per tier × state (with the old A's first GPU measurement from §5.4), compile on S1 and after settle, idle submits, memory, and Lighthouse on gl-off.
5. **Cosa diventa vero:** the claims table (§4.7) and the stylisations.
6. **R4 · Acqua viva:** the go/no-go table per flag (§6), defaults marked. (This is a water gate, distinct from the rivista-motion R4 of 2026-10-04.)

Every number in the sheet cites the probe and report file that produced it.

---

## 4. Build plan

### 4.0 Before any lane (director, ≈ 30 min)

1. Wait for the GPU verifier now running. Commit the in-flight tree (R5, `scripts/probes/water/lib.mjs` with `RV_BASE`, the proto edits) so that worktrees start from a commit (40-m9-plan F14). Delete `public/_*` scratch copies first.
2. Add the one-line `ROOT = process.env.RV_ROOT || …` to `lib.mjs` and commit it: worktree probes must write into their own tree.
3. Create the integration worktree and the lane worktrees from that commit. In each one:
   - add a `node_modules` junction to the main checkout's;
   - start its own static server from its `public/`: `python -m http.server <port> --bind 127.0.0.1`, in the background;
   - run its probes with `RV_BASE=http://127.0.0.1:<port>/proto/rivista/` and `RV_ROOT=<worktree>`.

   Never stop the 5178 server.
4. Rules for every lane:
   - Probes run headless through `launch()` of `lib.mjs` (channel `chrome`, the WebGPU flags, `assertAdapter` rejecting fallback adapters); no visible Chrome windows.
   - Every milestone closes with 1440×900 and 390×844 shots, a clean console (0 errors, 0 WebGPU validation warnings), its own probe, `w0_paper`, the flags-off identity probe and `node public/proto/rivista/assemble.mjs --check`.
   - **Lanes stage diffs; the director commits** on the lane branch, one milestone per commit, and keeps a `RESUME` note per lane in the session scratchpad (agents have died at session limits before).
   - Never touch `src/webgl/waterball/**` (the port reads it; `--check` proves it by sha256). No push, no deploy (G3).
5. **GPU lock.** Any probe phase that times the GPU (w8_perf, w9 `perf`, w10 `perf`, the §5.4 shim) first creates `_shots/water-hero/viva/.gpu.lock` and removes it when done. A phase that finds the lock waits. Look strips may share the GPU; timings never do.

### 4.1 Lanes

| lane | role | worktree · branch · port | owns (disjoint) |
|---|---|---|---|
| **H** hooks + host | E3 | `C:\Users\alber\Desktop\PortfolioAlbertoTuveri-vH` · `feat/viva-hooks` · **5179** | **the only lane that edits shared files:**<br>- engine: `water/engine/wgsl/sdf.wgsl.js` (the K4 line + default), `wgsl/shade-hero.wgsl.js` (L889 `requires` token), `water/engine/index.js` (`DEFAULT_SPLASH_WGSL`, `KNOWN_MODULES.mpm` / `.release`), `waves.js` (`HELD_CHUNKS`), `drops.js` (the splash gate, `prepare`, kind `"free"`, all through `I.mpm?.`, inert without the plugin);<br>- host and bench: `dev-water.html`, `fx-water.js`, `fx-hero.js`;<br>- probes and docs: `scripts/probes/water/w8_claims.mjs`, `CONTRACTS.md` §22 |
| **M** MPM core | E2 | `…-vM` · `feat/viva-mpm` · **5180** | `water/engine/mpm/{mpm.js,config.js}`, `mpm/kernels/**`, `mpm/wgsl/{mpm-common,mpm-field,mpm-chunk}.wgsl.js`, `scripts/port-mpm-kernels.mjs`, `water/dev/mpm.html`, `scripts/probes/water/w9_mpm.mjs` |
| **R** the breath | E1 + E2 | `…-vR` · `feat/viva-release` · **5181** | `water/engine/mpm/release/{release.js,config.js}`, `mpm/release/wgsl/{release-seed,release-forces,release-level}.wgsl.js`, `water/dev/release.html`, `scripts/probes/water/w10_release.mjs` |
| **L** light + look | E1 | `…-vL` · `feat/viva-light` · **5182** | `water/engine/caustics.js`, `wgsl/caustic-{trace,splat,chunk}.wgsl.js`, `water/engine/env.js`, `wgsl/env.wgsl.js`, `water/assets/env-*` (+ provenance sidecars), `water/dev/{caustics,env}.html`, the `dyn` / `photo` phases of `w3_caustics.mjs` and `w2a_env.mjs` |
| **P** proof | E3 | `…-vP` · `feat/viva-proof` · **5183**, plus the old-A server on **3001** (§5) | `scripts/probes/water/w10_capture.mjs`, `w10_ts_shim.js`, `water/dev/viva.html`, the `poster=splash` phase of `w8_posters.mjs` and its candidate file `fx-plate-splash.webp` (v1 is never replaced), `_shots/water-hero/viva/**` including the R4 sheet |
| integration | director | `…-viva` · `feat/water-viva` · **5184** | merges only: H0 → M → (R, L) → H1/H2 → P. It reaches `feat/water-hero` only after RG4, with flags-off identity proven |

**Interfaces pinned up front (H0 writes the CONTRACTS §22 draft before M, R and L write code against it):**
- **Hook K4** `splashSDF(p, f)` runs **after** `fillSDF` (F1 of the M9 plan). Its default is the identity, and it joins `sdfHookDefaultsWGSL`.
- **Group-3 bindings 9–12:**
  - 9 `mpmField` (r32float 3D, `textureLoad` only);
  - 10 the `MpmShade` uniform: `ctl`; brick origin, h, dims; iso; smin k; φ clamp; the **cut** (level, k) with default off;
  - 11 `mpmCoarse`;
  - 12 `mpmLive`.

  These are MPM's own; ext4 stays the band's (CONTRACTS §18.3).
- **The breath reuses bindings 9–12** with its own resources through a bind-group swap (same layout, no compile). Clicks are refused while the breath is active.
- **`internals.mpm`** follows 40-m9-plan §6.1. **`internals.release`** = `{ setProgress(p), active, info, stats, flush() }`.
- **The host input:** `fx-water.js` forwards the S3 progress p (scroll 0 → 1800) as one additive engine input; `fx-hero.js` stays untouched.
- **The caustic trace's own buffers** move to **13..15** when it binds the shade's group 3 (L1 `dyn`).

### 4.2 Milestones and acceptance, per lane

**Lane H (≈ 12 h)**

- **H0 · the identity hooks (5 h, first, alone on the shared files).** The K4 line and defaults, `KNOWN_MODULES`, `HELD_CHUNKS` + `"splash"`, the `drops.js` gate lines, and the §22 draft. Acceptance:
  - `w2_body identical` = 0 px at plate, full and mobile;
  - `w6_pour identical` PASS;
  - `w4_motion` strips hash-identical to HEAD;
  - `w5_bootsplit`: one hero compile before the first run, median delta ≤ +10 ms over 10 cold runs, the 14 ms worst-case margin to the 2.6 s counter cap preserved;
  - `tsc --allowJs --checkJs --noEmit` clean on the touched files (CONTRACTS §0); `assemble.mjs --check` exits 0; console 0/0 at 1440 and 390.
- **H1 · the host (4 h).** Acceptance:
  - `?water=viva` and the flags of §3.2; `sessionStorage["rv-water"]` survives the S4/S5 cuts (`w5_case` and the rivista-motion `s4`/`s5` probes);
  - case pages, reduced motion and gl-off never request `mpm` or `release` (network log; `w5_case`, `w5_still`);
  - the caption reads `{n} particles · WebGPU · {ms} ms GPU · DPR {dpr}` only while MPM water is on screen, with n read from stats and 2 lines at 1024 (the w9 `copy` phase); `w8_claims` PASS;
  - Lighthouse gl-off median within ±2 of 86–92 with the engine never requested (`w8_lighthouse`).
- **H2 · presence and teardown (3 h).** Acceptance:
  - `?scale=0.58` with S3 rebased as g = clamp01((gs − base)/(0.95 − base)); the S3 mask probe reads 0 px over 60 values of p; the plate margins are measured and printed;
  - the MPM and breath buffers are destroyed on `fx:nav:start`; the S4/S5 seam probes are no worse than R5 (64–163 ms) with the breath's ≈ 37 MB allocated.

**Lane M, M9a (18–22 h; 40-m9-plan §10 steps 1–8, which stays the recipe)**

Five changes to that plan:
1. The chunk takes a generic brick and the cut term (§4.1).
2. A narrow-band φ clamped to [−1.5h, +4h], as HYBRID does it, is the A/B of the plan's ±2h.
3. The `mpmres=fine` preset.
4. A time-scale ladder rung for weak GPUs (1 substep, half the sim time scale) ahead of the count levers.
5. `destroy()` is callable on `fx:nav:start`.

Milestones:
- **M0** raw port, 2 h: committed alone; `--check` proves `src/webgl/waterball/**` untouched.
- **M1** solver and bench, 8 h.
- **M2** field and chunk, 4 h.
- **M3** handoffs, 3 h.
- **M4** look tuning and w9, 4–5 h.

Acceptance, the `w9_mpm` phases of 40-m9-plan §6.5:
- **rest:** 0 px against HEAD at plate, full and mobile. **residue:** 0 px after a splash plus 20 s.
- **compile:** the hero compile count before the first run equals HEAD's (1); no `mpm:*` pipeline before `"settled"`; 0 compiles across the first click, whose rAF gap is ≤ 20 ms.
- **strip:** ≥ 3 detached components of ≥ 4 px within 0.1–0.6 s; no component under 4 px survives 2 frames.
- **louder than «molto»:** a crown footprint ≥ 1.5× molto at the plate (≥ ≈ 75 px), droplets ≥ 3 px.
- **sleep:** dispatches constant from impact + 2.0 s; submits constant 5.0 s after the last input.
- **determinism:** at equal steps, 60 Hz and 120 Hz particle-buffer sha identical.
- **soak, 10 min:** NaN 0; |Σ outcomes − Σ seeded| / Σ seeded < 0.5 %/min.
- **perf:** plate total p95 ≤ 2.6 ms (DPR 1.5, 20 clicks); tier-B mobile p95 ≤ 8 ms on this dGPU (phones are judged at R4).
- **holes** 0 at yaw −25…+15. **paper:** exact (246, 243, 236).
- **fallback:** `?mpmfail=pipeline` plays «molto» with exactly one warning. **console:** 0/0.

**Lane R, the breath (≈ 20 h)**

Before M2 lands, R builds the CPU state machine, the V(y) lookup (read from `glyph.js`'s profile, never edited), the seed, force and level kernels against M's common WGSL, and its probe.

**Mechanism.** These are start values; RL2 tunes them.
- **The release field.** e = io((p − 0.60)/0.40) over scroll 540 → 900. It starts at p ≥ 0.60, where TUVERI is fully masked (spec §1.4).
- **The brick.** h = C/90 (≈ 5.1 px per cell at full screen), 160 × 136 × 64 cells (1.78 × 1.51 × 0.71 C).
- **The count.** Tier A releases 49,152 particles: the letter's volume at 4 per cell, so the level ledger is L ≈ 1.0, printed in stats. Tier B (desktop iGPU) uses h = C/72 with 24,576; tier C uses h = C/56 with 12,288.
- **Memory.** Grid 22.3 MB, accumulator 5.6, field 5.6, particles 3.9: ≈ 37 MB at tier A, allocated on the first breath and freed at `fx:nav:start`.
- **The exhale.**
  - The cut level falls from the apex to the feet over e 0 → 0.5 (the K4 cut, `smax(f, p.y − level, 0.012)`, the pour's own k).
  - Each fixed step seeds N·ΔV/V particles by hashed rejection sampling inside the rest body, in the band the level just left.
  - Each particle leaves with an outward velocity of 0.6 C/s from the centroid (0, 0.5, 0) plus 0.25 C/s upward, and a hashed curl drift at low amplitude (a knob; the taste proxy flags a visible swirl).
  - Gravity 6 C/s², 2 substeps, CFL ≤ 1 cell per substep (0.64 at 0.85 C/s), EOS γ 1, k 50, viscosity 0.08.
- **The inhale.**
  - As e falls (scroll 900 → 1260), an attraction toward the rest body turns on: −∇f · 4 C/s², clamped.
  - Water that enters the body above the current level falls through the empty mould, as the pour's droplets do (D26). Below the level it is absorbed: ABSORB rings the face.
  - The absorbed mass raises the level through V⁻¹. The level is computed on the GPU and copied into the uniform within the same encoder, so there is no readback latency.
  - At most 6 floor clusters may land as beads (evidence, as D22); their volume is credited to the level.
- **Quiet and sleep.**
  - Under `releasehold=return`, after 2.0 s without input while e > 0, the attraction engages anyway. The letter re-forms within 2.5 s, so everything is still ≤ 5 s after the last input (G15).
  - A reader who scrolls past 1800 fast gets completion under cover: the remaining mass is credited to the level and the remaining particles retire while the Now sheet covers the plate.
  - Once the level is full, the cut turns off and the frame equals rest.

Milestones:
- **RL0 · the spike (4 h, right after M2).** A frozen bloom at scroll 900, full screen 2160×1350 at DPR 1.5, rendered through M's field and chunk with the narrow-band φ and the coarse skip. The positions come from the exhale kernel run 40 steps; if that kernel is not ready, a hashed synthetic bloom with the same density is used, labelled as such.
- **RL1 · the build (10 h):** exhale, hang, inhale, the level, the hold rule, completion under cover, and the keep-out.
- **RL2 · look and probes (6 h).**

Acceptance:
- **RL0:**
  - holes = 0 at yaw −18° and −10°;
  - shade p95 ≤ 5.0 ms with the DPR ladder at level ≤ 2 (DPR 1.0, 1440×900);
  - sim ≤ 1.2 ms per step (est. 0.6–1.1 ms for 18.6 M atomics per step); field ≤ 0.4 ms per frame;
  - the frames go to RG3.
- **RL1/RL2, the look:**
  - `w10_release` strips at scroll 540 / 630 / 720 / 810 / 900 / 1000 / 1100 / 1260 / 1500 at 1440, with 4× crops;
  - isolated components under 2 px² are ≤ 1 % of all components and none survives 2 frames;
  - no foam or white term; a single IOR, so no coloured rims; maximum droplet speed ≤ 0.85 C/s (from stats).
- **RL1/RL2, the hand-offs:**
  - the inhale's last frame is 0 px from rest (`w9` identity);
  - the mean luminance change frame to frame inside the plate box is ≤ 2 % at the two hand-offs (release start, level full);
  - scrolling back re-exhales with no reset event in stats.
- **RL1/RL2, the ledger:** level mass + in flight + credited beads = N, exactly (integer).
- **RL1/RL2, safety:**
  - 0 px of water over the visible words **and the header rects** for 60 values of scroll 540–1800 (`w5_mask`, extended);
  - 0 submits ≤ 5.0 s after the last wheel at any p, including parked at 900;
  - 60 Hz and 120 Hz hash-identical in manual mode (scroll sampled once per fixed step);
  - no allocation and no request below 1024 px, under reduced motion or on gl-off.

**Lane L, light and look (6 h core, + 8 h if the spike passes)**

- **L0 · the spike (2 h, starts at once, needs nothing from M).** A manual click on the stem with today's analytic «molto», the live surface traced against rest: the maximum |ΔE_dyn| outside the water mask over 0.1–0.8 s.
  - **≥ 6/255 at the plate** → L1.
  - **Below** → only the droplets' light spots ship (or nothing), and the result is reported.
- **L1 · dyn (8 h).**
  - The live chunks are composed into the trace, including K4 once M lands.
  - The trace buffers move to 13..15. The rest records are cached.
  - The splat goes to rgba16float with per-channel Beer.
  - Its weight follows real motion; re-trace at 30 / 15 / 10 Hz on tiers A / B / C.

  Acceptance:
  - 0 px of |ΔE_dyn| at rest; a hover-only run triggers 0 traces;
  - after a click, max ≥ 6/255 outside the water mask within 0.1–0.8 s, with ≥ 30 % of the energy outside the silhouette, back to 0 by 2.0 s, zero-sum within 2 %;
  - plate splash p95 with M9 on ≤ 2.6 ms;
  - the trace recompile never lands on the S1 path (`w5_bootsplit` unchanged).
- **L2 · env A/B (4 h).**
  - `photo`: a CC0 Poly Haven studio HDRI, through the Blender connector's asset search, 1024×512 RGBE-in-PNG.
  - `cycles`: the rig rendered locally in Blender Cycles with an equirect camera: the white cove, the key softbox at az 30° el 24°, the strip fill, a window.
  - Both are baked into the existing 256²×6 GGX cube in the key-light frame. No sunset, no horizon.

  Acceptance:
  - exact paper (`w0`);
  - the asset is fetched only after a real adapter on the home and never on gl-off (network log);
  - the provenance sidecar exists (the project's embed-prompt rule).

**Lane P, proof (≈ 15 h)**

- **P0 · the capture (4 h, as soon as the GPU is free)**, §5.
- **P1 · `viva.html` (5 h)**, §3.4. Acceptance:
  - both iframes report equal step indices in lockstep;
  - K flips at the same step and R replays;
  - every beat of the script runs; 0 console errors.
- **P2 · the splash poster (3 h, after M4).** The frame at click + 0.18 s in manual mode with fixed seeds, at the dock composition. Acceptance:
  - lossless, exact paper bytes, bit-identical across 2 contexts, a provenance sidecar;
  - Lighthouse gl-off within ±2 with `?poster=splash`;
  - v1 untouched.
- **P3 · the sheet and the final verifier run (3 h, after RG4)**, §3.5.

**The cut term and the trace, and why the breath's frames avoid REVIVE's wall (b):**
- The breath's particles are mass-true at 4 per cell on a coarser grid (C/90), so they form fewer, larger droplets (≥ ≈ 5 px), not a glitter of 1-cell specks.
- Outside water, the narrow-band φ lets steps grow to 4h × 0.75.
- The coarse chamfer distance (40-m9-plan §4.1) jumps empty 4³ blocks.
- While the letter is drained, the body term of the shade is nearly free.

RL0 measures whether this is enough; nothing about the breath's choreography is built before it says so.

### 4.3 Order and timeline

| when (wall clock, from step 0) | what runs |
|---|---|
| 0 → 5 h | H0 alone on the shared files. In parallel: M0–M1 (port, solver on the bench; merges H0 when it lands), L0 spike, R's CPU side, P0 capture as soon as the GPU verifier has finished |
| ≈ 12–14 h | M2 (field + chunk) → **RL0** and the first crown strips → **RG2**, **RG3** |
| ≈ 20–24 h | M3–M4 (handoffs, w9) → P2 splash poster; RL1; L1 if L0 passed |
| ≈ 30–36 h | RL2, L2, H1, H2 → **RG4** (four reviews, one fix batch, an independent verifier) → P3 sheet |

- **Critical path:** H0 → M2 → RL0 → RL1 → RL2 → RG4, ≈ 45 h, about 2 working days with lanes.
- **Effort:** ≈ 80 h core (H 12, M 20, R 20, P 15, L0 2, reviews and fixes 10), ≈ 92 h with L1 and the env A/B.
- **When Alberto is back (≈ +24 h)**, expect:
  - the capture and the three-way links;
  - the identity hooks merged;
  - the M9 crown on the bench with its strips;
  - the L0 and RL0 verdicts with their frames.

  The full breath and the R4 sheet follow without waiting for him.

### 4.4 Review gates

| gate | when | who | passes when |
|---|---|---|---|
| **RG1 · code** | after H0 + M0 | a code reviewer | the identity probes are green; the frozen-source `--check` is green; the interfaces match the §22 draft; no backticks inside WGSL template strings |
| **RG2 · look + perf, the crown** | after M2, again after M4 | a look reviewer (pane, foreground, and the 4× strips) and the perf verifier (timestamps) | the crown reads louder and more liquid than «molto» at 100 %, with no needles, no specks, no white and no coloured rims; plate p95 ≤ 2.6 ms; otherwise the M9 plan's §5 levers, then the kill (§4.5) |
| **RG3 · go/no-go, the breath** | after RL0 | look + perf | holes 0 and ≤ 5 ms (RL0 numbers), and the frozen bloom reads as sheets, ligaments and round droplets of clear water: no grain, no glitter, no burst |
| **RG4 · full** | after RL2, L1/L2, H1/H2 | four reviewers in parallel, then one fix batch, then an independent verifier with fresh eyes | all four reviews below pass |

The four RG4 reviews:
- **Look.** Motion live in the pane, in the foreground, plus the strips and webm, judged against §4.2's lists and Alberto's rules (slow, radial, recomposing, no needles, nothing procedural).
- **Code.**
  - CONTRACTS conformance, `@ts-check` clean, no allocation per frame;
  - buffer lifetimes and destroy on navigation;
  - determinism, fixed-point headroom (≪ ±214.7 per cell), port `--check`.
- **Perf.**
  - Timestamp p95 tables per tier × state: rest, hover, click, S3 full-screen click, breath.
  - Idle submits; compiles on S1 and after settle.
  - Ladder engagement, the teardown seam, Lighthouse gl-off.
- **A11y and degraded states.**
  - Reduced motion: one still, no `mpm` request. gl-off: no engine request, the poster. `?gpufail` × 4: one warning each. Case pages untouched.
  - G15: 0 submits 5.0 s after the last input, also when parked mid-breath.
  - No text over water, header included.
  - The caption instrument is not an aria-live region and never shows a count that is not live. The canvas stays `aria-hidden`.
  - Console 0/0 at 1440 and 390.

### 4.5 Kill criteria: when we fall back to the current A

| trigger | response |
|---|---|
| Rest identity cannot be made 0 px (any view, after idle or after click + 6 s) | the module never ships; the current A, unchanged |
| M9 plate p95 > 2.6 ms after the M9 plan's levers (indirect dispatch, field at 30 Hz, count 2,048 → 1,024, re-entry skip, tier C off) | spec §5.2: `?mpm=1` never becomes the default; «molto» stays |
| The crown reads blobbier, fatter or grainier than «molto» at the plate (RG2) | `mpm=0` stays the click; MPM remains only at S3 full screen, where cells are 2× larger on screen |
| Specks or needles: a component under 4 px survives 2 frames after the iso, `smooth 2` and loner levers | MPM off; «molto» |
| RL0: holes > 0, or > 5 ms at DPR 1.0 | count → 24,576 (h C/72) → `release=partial` (top 40 %) → the breath is dropped; the M10 dive becomes the S3 candidate if a lane has time, otherwise S3 stays as today |
| RG3/RG4 look: glitter, grain, white, needles, coloured rims, a visible swirl, or a burst instead of slow motion | `partial` → dropped, as above |
| Any new compile on the S1 path, or the 14 ms margin lost | that piece stays after `pour:settled` (it already does by design); M9b stays off |
| Tier B tap p95 > 8 ms after the time-scale ladder and tier C | phones keep «molto» (no lag beats any effect: «non lagga») |
| Dispatches after 2.0 s of an event, or submits after 5.0 s of the last input | blocking bug; nothing ships until fixed |
| The teardown seam regresses past R5 with the buffers freed on `fx:nav:start` | the breath unloads its module on navigation; if that fails, the breath is dropped |
| L0 < 6/255 | `caustics=dyn` limited to droplet light spots, or not built |
| **Process kill, at RG4:** the strips beside today's A and the old A do not read as clearly more alive water | stop; today's A stays the only default; M9 stays behind `?mpm=1` for Alberto to see at R4 |

**The fallback is always one flag away: without `?water=` the page is today's A.**

### 4.6 Cut list, backlog, refused

**Cut first to last** if time runs out: `env=cycles` → `env=photo` → L1 full `dyn` (keep the droplet spots) → `mpmres=fine` → `releasehold=freeze` → the full breath (keep `partial`) → `partial`.

**Backlog**, not built this round unless a lane is idle:
- the M10 dive (the S3 reserve if the breath dies);
- bubbles (at most 3 trapped, the ice risk; A/B 0 / 24 / 96);
- the M4b tendril;
- an MPM press-drag `stir=press` (press only; a hover stir is refused);
- M9b, the apex spray (compile gate + Alberto);
- `release=plate` on phones (measured on his phone first);
- HDR highlights (off on Windows);
- a rare autonomous breath behind a WCAG 2.2.2 pause control in the caption. This is a G15 question for Alberto, not built.

**Refused:**
- the old capsule letter, SSF, sunset, sea and teal;
- a hover pointer force (canon §5);
- scroll slosh beyond the §2.6 ceiling (R2b closed it);
- asking about σ again;
- perpetual churn without Alberto lifting G15.

### 4.7 Honesty and claims

- **The caption token.** `{n} particles` appears only while MPM water is on screen, with n read from stats: 2,048 / 1,024 / 512 per click, and up to 49,152 / 24,576 / 12,288 during the breath.
  - One count at a time: particles, else rays while the `dyn` light shows, else nothing.
  - The copy is TBC by Alberto.
- **Never printed:**
  - "120,000" (the old real count was 74,403);
  - "simulation" for the resting letter;
  - "physically accurate", "real caustics", "surface tension", "sun glints";
  - "MLS-MPM" on the page.
- **Stylisations,** disclosed on the sheet and in CONTRACTS §22:
  - slowed gravity (6–12 C/s²) and the CFL speed cap;
  - the breath's level as a ledger of absorbed mass (L ≈ 1.0, in stats);
  - up to 6 landed beads credited to the level;
  - completion under the Now sheet;
  - the `dyn` caustic as a chosen subset of the light field (the static shadow withheld, R1).
- **The CV (tell Alberto, no edit).** Once M9 and the breath ship, a true wording is: "a WebGPU water letter whose splashes and scroll 'breath' are an MLS-MPM fluid of up to 49,152 particles, with caustics traced from its moving surface". The last clause holds only if L1 ships.

---

## 5. Capture first: the old A at its best against today's A

The first question his message raises («non so se lo preferisco») is answered by looking, not by building. This runs before anything else that needs the GPU.

### 5.1 When

- Only after the GPU verifier now running has finished: no headless Chrome in the process list, no workflow timing the GPU.
- Then take `_shots/water-hero/viva/.gpu.lock`.

### 5.2 The old A: `main` @ `881f68c`

- The fluid files were last changed by `444681b`; the look was set on 2026-07-14 (dossier 45 §6). It is the only version deployed and approved by merge.
- Optional runner-up, for colour alone: `0f41ed3`, in a second worktree on port 3002.

```
git -C C:/Users/alber/Desktop/PortfolioAlbertoTuveri worktree add --detach C:/Users/alber/Desktop/PortfolioAlbertoTuveri-oldA 881f68c
cd C:/Users/alber/Desktop/PortfolioAlbertoTuveri-oldA
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci     # package-lock.json is tracked on main
npm run build                                 # production: leva is tree-shaken out (WaterBallHero.tsx, IS_DEV); next/font needs network
npx next start -p 3001                        # background; http://127.0.0.1:3001/
```

- Build from the path's exact on-disk casing (CLAUDE.md §10, the AsyncLocalStorage double load).
- If the production build still fails, use `npx next dev -p 3001` and hide leva with an injected style in the probe; the report says so.
- The sea loop (`public/coast/sea-loop-*.mp4`) and the sunset cubemap (`public/cubemap/*`) are tracked on `main`, so the scene is complete.
- The worktree is a read-only reference, removed after R4.

### 5.3 Today's A

Lane P's worktree at the committed HEAD, on 5183: reproducible. Not the main checkout's 5178, which carries uncommitted work.

### 5.4 How: `scripts/probes/water/w10_capture.mjs --target old|now` (lane P)

**Setup.**
- Headless through `launch()` of `lib.mjs`: channel `chrome`, the WebGPU flags, and `assertAdapter` (no fallback adapter).
- `openPage(browser, "http://127.0.0.1:3001/")` (absolute URLs pass through).
- **Stills are CDP screencast frames** (`Page.startScreencast`, the pattern of `scripts/probes/rivista-motion/strip.mjs`), because a plain screenshot can stall on a live WebGPU canvas. The webm files are built from the same frames.
- The old A seeds with `Math.random` and its dt is frame-locked, so every old beat runs **3×** and all three runs are kept.

**Beats.** Each beat uses the same viewport and the same scripted inputs on both targets.

| beat | old (`881f68c`) | today (HEAD) |
|---|---|---|
| arrival | no sessionStorage key: the preloader and the fountain birth; an 8 s webm; stills at fountain + 0.5 / 1 / 1.8 / 3 / 5 s | the S1 pour at the w6 marks |
| rest, 1440×900 | `sessionStorage["at-preloader-seen"]="1"`; 3 stills 5 s apart and a 10 s webm (the perpetual churn) | the rest still, a 10 s webm and the submit counter (0 after 5 s) |
| pointer | a sweep across the letter at 1,500 px/s (`page.mouse.move` with steps) at DPR 1 (bug A8 weakens the poke on HiDPI); 12 frames at 60 ms and a webm | a hover sweep (light only), then the «molto» click on the stem: 12 frames at 60 ms |
| scroll | wheel notches through the hero drain at progress 0 / 0.25 / 0.5 / 0.78 / 1, then back up (the re-seed pop) | the wheel shimmer; S3 at p 0 / 0.6 / 1 and at scroll 1800 |
| phone, 390×844 @2, touch | rest and a tap (the cropped letter: no tier) | dock rest and a «molto» tap |
| resize | 1440 → 640 → 1440 | — |

**The old A's first GPU measurement.** `w10_ts_shim.js` is an init script, chained after `lib.mjs`'s own `requestDevice` wrapper. It:
1. adds `"timestamp-query"` to the requested features;
2. injects `timestampWrites` into every compute and render pass, through a 128-query ring;
3. resolves on submit and reads back without awaiting.

It reports the GPU ms per frame (median and p95) at rest, during the sweep and during the drain, at 1440 with DPR 1.5. The old code writes no timestamps, so nothing collides. A second run with `--disable-gpu-vsync --disable-frame-rate-limit` gives the uncapped frame time as a cross-check, labelled a proxy. Today's A gets `w8_perf tables` in the same session, under the same lock.

**Outputs:**
- `_shots/water-hero/viva/capture/{old,now}/…`;
- `w10_capture_report.json`: adapter, viewport, DPR, GPU ms per beat, console counts, run index;
- the paired strips that open the R4 sheet.

### 5.5 Live, for Alberto at R4

In the built-in browser pane, in the foreground, on WebGPU:
- tab 1: the old A (`:3001`);
- tab 2: today (`:5184/proto/rivista/index.html`);
- tab 3: viva (`:5184/proto/rivista/index.html?water=viva`);
- tab 4: `:5184/proto/rivista/water/dev/viva.html`.

His phone gets the integration server on the LAN, or a Vercel preview only with his OK.

---

## 6. R4 · "Acqua viva" (for his return; recorded in spec §10 and CONTRACTS §22, as R1 and R2 were)

**Go/no-go per flag:**
- `mpm` (click crown) and `mpmres`;
- `release`: full / partial / none;
- `releasehold`: return / freeze;
- `caustics=dyn`;
- `env`: studio / photo / cycles;
- `scale`: 0.46 / 0.58;
- `poster`: rest / splash;
- the caption token's copy.

**Then the backlog picks:** the dive, bubbles, the tendril, `mpmpour`, the breath on phones, and the G15 question (an autonomous breath with a pause control).

The default changes only for the items he passes. Everything he rejects is removed, and the K4 identity stub stays harmless.

---

## 7. What shipped (R5, 2026-10-11, by delegation)

Alberto delegated R4 («si per tutto, fai tu. dev essere perfetto») and the director decided. **The default changed in one thing only, the look at rest:** the letter is drawn at scale 0.58 with σ 1.0 (no flag cards, κ 0.45), because at 0.46 / 0.6 it was a ghost on the paper (contrast 1.13 → about 1.23); the poster and the reduced-motion still were recaptured to the same letter. **Everything else of Acqua viva stays behind its flag, exactly as built:** the click crown in MLS-MPM (`?water=viva`, `mpm`), the breath (`?release=1`), the cards (`?presence=2`), the Cycles studio (`?env=cycles`), the dive (`?dive=1`). `?presence=0` shows the previous look for the comparison, and `?water=now` clears a kept set. The record is spec 30 §9.9 and CONTRACTS §22.15; §3.1's "the default changes only with Alberto's yes" is answered by that delegation, and each item is still his to overturn.
