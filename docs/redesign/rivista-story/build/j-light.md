# j-light — every pixel the stage writes is valid premultiplied (lane J1 LIGHT of the phone wave)

## THE DIRECTOR'S NOTES FOR J1 (22 Nov ~22:45, added by the lead: read them before you build, and follow them)

1. HEAD is ae26554 (two diary commits after 15fb573, HANDOFF.md only): the code and public/ are the same; build on it.
2. The 8-bit default goes by ENGINE, not by Safari's name: every iOS and iPadOS browser is WebKit (CriOS, FxiOS, in-app
   web views), and macOS Safari 26 has WebGPU with the same compositor. Chrome, Edge and Firefox stay as they are.
3. Float16 extended: alpha = min(1, max(a, r, g, b)). Colour above 1 at alpha 1 is a valid HDR highlight: do NOT clamp
   the colour.
4. Alpha now hides what is behind the light by (1 - a). Prove the diffs where light meets type or paper IN MOTION, not
   only at rest: the flight's door and glass over the page, the bloom near titles, the day's edge going into Contact,
   the gallery's last plate into the dawn. The dawn's paper must stay exactly #f3f4f6: no veil from the grain or the
   bloom.
5. On cost, prefer the blend-state way over a last full-screen pass if it holds (bandwidth at DPR 3 on a phone).
   Measure tier B on the phone against HEAD, with the sleep and the halvings as usual.
6. In the summary, list EVERY pipeline whose output alpha changed, so the director can read the diff against it.


- **Asked:** the stage adds its light at alpha 0 over the page; Safari on Alberto's iPhone drops it (j-device finding 1).
  Make every canvas pixel valid premultiplied (alpha >= brightest channel), same look in Chrome; WebKit keeps the 8-bit canvas unless `?hdr=1`.
- **Rules:** no commit/push/stash/branch switch/install/download; probes headless via `launch()`; scratch `.shots/j-light/`;
  ports 5435 (tree), 5436 (HEAD 15fb573 export), 5437 (Astro build / release); every server stopped by pid before returning.
- **Status: DONE** (22 Nov 2026, about 23:45; Opus 5.5, effort max). Nothing committed. Every server this lane started
  is stopped by pid (5435 pid 24424, 5436 pid 30804, 5437 pids 21180, 32904, 20624; `.shots/j-light/servers.txt`); no
  headless Chrome left. The director commits and publishes (one commit: `stage/stage.js`, `stage/gpu.js`,
  `stage/wgsl/resolve.wgsl.js`; the docs in a second: `CLAUDE.md`, `DESIGN.md`, `60-as-built.md` G3, this file).
- **Built (in the tree, not committed):** `stage/wgsl/resolve.wgsl.js` (new), `stage/stage.js` (frameTex, resolveKit,
  encodeResolve, encodeBloom's glow entry, LOOK.resolve, stats().valid, passMs[3] = glow + resolve), `stage/gpu.js`
  (isWebKit, canvasSetup "webkit").
- **Proved so far (scripts in `.shots/j-light/_scripts/`):** `readback.mjs` (the canvas's texels read on the GPU in their
  own frame, hero 1440 DPR 2): canvas with the resolve 0 invalid texels of 2,916,000 (HEAD's encoding: 22.8 %); the
  composite each implies over the night ground, R vs HEAD's, texel for texel: max 1 step (p99 1). `ab.mjs` + `abdiff.mjs`
  (frozen frame drawn both ways, 13 stills x 3 sizes x EN/IT, `.shots/j-light/ab/<size>-<lang>/`, numbers in
  `<size>-<lang>.numbers.txt`): R vs C1R (the tree through an un-premultiplying compositor) max <= 3, p99 <= 1 everywhere;
  D vs C1D (HEAD through it) p99 up to 243 (the light gone). R vs D on screen: p99 <= 1 (phone hero 5), p999 <= 2 but the
  hero and Now (10..14); max 12..18 on the ONE device pixel rim of clipped white light (the compositor upscales the canvas
  1.33x at DPR 2, 1.57x on the phone: HEAD's out-of-range colour + ground was interpolated before the clip; bounded by the
  ground itself, 12/14/20 steps), 0..9 at 1920 DPR 1 (canvas 1:1, no upscale); Contact and the home's Contact part 0..1;
  the dawn's paper exact (#f3f4f6 counts identical in every band); the dawn's edge: 2 device rows where a bright thread
  crosses it (<= 15 at 1440, 42 at one point on the phone; the edge texel's ground is the mix of night and paper). Over
  type: p99 <= 2, max 14 (phone, Now's body text under the orrery's glow: light over type now hides it by a', as any real
  alpha does). Crops looked at: `crop-hero-DRheat.png`, `crop-m-hero.png`, `crop-m-closing.png`, `crop-m-now-text.png`.
- **Motion (`motion.mjs` + `motiondiff2.mjs`, Astro build on 5437, `.shots/j-light/motion/<size>-en/`):** the moment
  frozen (GSAP ticker asleep and kept asleep, rAF off, CSS/WAAPI paused, the stage's set/frame taken from the host),
  drawn R, D, R2; read only where R and R2 agree (the router's timers still move some type: share said). The flight's
  door and glass over the page (230/300/600 ms after a click on Work): held 96.8..98.4 %, R vs D max 15, p99 <= 2, type
  max 14 (1440) / 3 (phone); the day's edge rising into Contact behind the door (490..620 ms): max 0..1 (the door is glass:
  valid already); before the takeover (260..440 ms) the moment does not hold (the shadow page takes the stage by timers):
  not measurable this way; a title rising by the glow (the home's wheel into Work): max 18 (rims), p99 1, type max 7; the
  gallery's last plate into the dawn (work.html wheel): max 15, p99 1, type max 3. R vs C1R max <= 2 in every held moment.
  Sheet: `sheet-motion-d.png` (R | D | heat).
- **Emulation (`emu.mjs`, frozen, `.shots/j-light/emu/`; sheets `sheet-emu-iphone.png` 393x852 DPR 3, `sheet-emu-1440.png`):**
  HEAD: alpha 0 on 97.1 % (iPhone hero), 100 % (Now) of the canvas; A | C1 | C2 = Chrome | filter | emulated: in both
  emulations only the plates are left. Tree: alpha 0 only where nothing is drawn (56..76 %); the name of light, the cosmos,
  the chips, Now's orrery and the gallery's cosmos survive both emulations.
- **Tree vs HEAD's own page (two runs, `abh/`, sheets `sheet-HR-<size>-<lang>.png`):** looked at, the same pictures; the
  numbers (`ab/<size>-<lang>.numbers.txt`, RvsH) carry each run's own motion (the swarm, the orrery's turn): p99 1..60,
  Now IT 1440 220 (the orrery's bodies elsewhere), type p99 <= 2 but Contact (7..21: its strokes, run to run) and the
  hero IT (12..15); the encoding alone is the same-frame A/B above.
- **GPU against HEAD** (`gpunow.sh`, the stage's own timestamps, ms "median/max" of two 1.6 s rests; peaks over a
  wheel; two rounds, HEAD first then the tree first, CPU 1..19 %; logs `gpu-r1.log`, `gpu-r2.log`):

  | place | 1440x900 DPR 2, A: HEAD / tree | 1920x1080 DPR 1, A: HEAD / tree | 390x844 DPR 2, B: HEAD / tree |
  |---|---|---|---|
  | hero at rest | 1.09..1.14 / 1.14..1.16 | 0.94..0.95 / 0.95..0.96 | 0.35..0.36 / 0.35..0.36 |
  | the flight to Now, peak | 1.18..1.23 / 1.22..1.24 | 1.00..1.02 / 1.05..1.07 | 0.44..0.45 / 0.43..0.44 |
  | Now in place, rest / peak | 0.84..1.09, 2.12..2.67 / 0.86..1.11, 2.03..2.33 | 1.07..1.13, 2.24..2.36 / 1.10..1.14, 2.26..2.27 | 0.78..0.79, 0.81 / 0.79, 0.81..0.82 |
  | half a screen past Now, rest / peak | 1.83..1.85, 1.97..2.03 / 1.87, 2.08..2.11 | 1.58..1.61, 1.83..1.84 / 1.61..1.62, 1.84..1.86 | 0.13, 0.71 / 0.14, 0.72 |

  Under every limit of CLAUDE.md §3 (2.6 / 3.3 at 1440, 2.4 at 1920, 1.5 on the phone). The fix's own cost, read per pass
  (`passms.mjs`, passMs[3] = the glow + the resolve): with the glow +0.021..0.026 ms at 1440, +0.014..0.018 at 1920,
  +0.003..0.004 on the phone; without it (Contact, the plain resolve) 0.024 / 0.018 / 0.005 ms; the frame pass itself
  +0.00..0.013 (frameTex instead of the canvas). The swarm never halved (halvings 0 -> 0, drawn 160,000 / 80,000 all
  along). Asleep: 0 frames submitted in 3 s after 19 s of quiet, HEAD and tree, 1440 (r1) and phone (r2).
- **First frame** (`ff2.mjs`, ten alternated pairs, order swapped each pair): 1440 tree 343 / HEAD 338 ms median (run 2:
  356 / 359), phone 303 / 300; no long frame after it, console clean. The resolve's pipelines are in 43..143 ms after
  they start, always before the first frame (`firstvalid.mjs`: 0 frames drawn straight to the canvas, 7 loads).
- **Other checks:** `?failbloom=1` (the plain resolve, valid, `sheet-emu-failbloom-hdr1.png`); `?hdr=1` forced float16:
  canvas texels 0 invalid, 232,409 HDR highlights (colour above 1 at alpha 1) kept; `isWebKit` against 16 real user
  agents (`webkit-ua.mjs`: Safari macOS/iOS/iPadOS, CriOS, FxiOS, EdgiOS, an app's web view true; Chrome, Edge, Opera,
  Samsung, Firefox false); WebKit's `navigator.vendor` is "Apple Computer, Inc." (MDN, Navigator.vendor).
- **Gates on the final tree:** `assemble.mjs` (pages up to date), `--check` exit 0, claims OK (34 pages); Astro build
  (34 pages) to `.shots/j-light/dist`, `PARITY OK`, asserts ok (1154 local references), claims on the build OK;
  `VERCEL_ENV=production node web/scripts/release.mjs`: three `[release]` lines, 34 pages, 159 files, 5.4 MB (the new
  `stage/wgsl/resolve.wgsl.js` in it). The release served from its root: the hero and Now at 1440 and 393x852 DPR 3,
  `valid.on`, console clean, Chrome and the filter the same picture (`sheet-release.png`, `sheet-release-1440.png`).
- **Docs:** CLAUDE.md §1 (how the light reaches the page), the stage's row of §4, the `?debug=1` and `?hdr` switches,
  §5; DESIGN.md "The canvas written valid" (new subsection), the HDR bullet, the palette's HDR line, the file index;
  `60-as-built.md` G3. `stage/scenes/README.md` untouched: a pass author writes nothing new (the resolve does it).
- **Sources:** WebGPU spec `index.bs` GPUCanvasAlphaMode ("If the canvas texture contains out-of-gamut premultiplied RGBA
  values ... Displayed to the screen: Compositing results are undefined", fetched 22 Nov); MDN GPUCanvasContext.configure
  (toneMapping "extended": matches "standard" in [0, 1]); MDN Navigator.vendor; WebKit 278926 via j-device.

## For the director: every pipeline whose output alpha changed

- **New:** `resolve.fsResolve` and `resolve.fsResolveGlow` (`stage/wgsl/resolve.wgsl.js`): the only pipelines that write
  the canvas once the resolve is in; alpha = the valid alpha above, no blend.
- **Replaced on the canvas:** `bloom.fsComposite` (ADD, alpha zero/one = untouched) now runs only on a frame that goes
  straight to the canvas (the resolve not in yet, or `look({ resolve: 0 })`); otherwise its work is `fsResolveGlow`.
- **Unchanged (output, blend and alpha exactly as HEAD, only the target moved from the canvas to `frameTex`):** the swarm
  (`stage.draw`), the field (`fsCosmos`, `fsRibbon`, `fsHaze`, `fsChip`), the plates (`fsPlate`, `fsBlit`: the door and
  the portal too), the orrery and its words, the rays, the splat, Obla's character body, the bloom's prefilter / down /
  up (the prefilter now reads `frameTex`).

## What Alberto should open on his iPhone once it is online

1. `https://albertotuveri.sersan.io/` (the 8-bit canvas, the default on WebKit): the name ALBERTO TUVERI made of light, the
   cosmos's dots and threads behind it, the chips; scrolled to Now, the SerSan mark of grains and its nine named icons.
   If they show, the alpha was the whole cause. If still only the plates: the 8-bit canvas loses even valid light
   (unexpected) and the `?diag=1` page of j-device is the next step.
2. `https://albertotuveri.sersan.io/?hdr=1` (the float16 HDR canvas, forced): the same picture, the white cores of the
   name a little brighter than paper white on his HDR screen. If it shows, the HDR path works on a real HDR screen and
   could become WebKit's default later; if the name or the cosmos vanish only here, the extended canvas is the problem
   and WebKit stays on 8 bit (as it is now).

## Every pipeline that writes the canvas today (HEAD), with its blend

All target the canvas's format; "light" = premultiplied colour at alpha 0, "real" = colour <= alpha.

| Pipeline (file) | Writes | Blend (colour / alpha) | Alpha it writes |
|---|---|---|---|
| `stage.draw` swarm (`wgsl/draw.wgsl.js` fs) | canvas, or pass A + pass B | one, 1-srcA / one, 1-srcA (BLEND) | night: `min(e,1) x band.y` = 0 (light); dawn: real ink |
| `field.fsCosmos`, `fsRibbon`, `fsHaze`, `fsChip` (`field/field.wgsl.js`) | same pass as the swarm (A or one-pass), chips also B | BLEND (field.js:98) | 0 (light) |
| `plates.blit` (`plates.wgsl.js` fsBlit) | pass B | BLEND | pass A's alpha, copied |
| `plates.plate` (fsPlate; also the door and the portal, slabs of the same pipeline) | pass B | BLEND | real `cov` (colour = enc x cov; enc up to 1.6 on HDR) |
| `orrery`, `orrery.words` (`orrery/orrery.wgsl.js`) pass "over" | A or one-pass | api.blend = BLEND | `e x band.y` = 0 (light) |
| `rays` (`scenes/lib/prism.js`) pass "over" | A or one-pass | BLEND | light |
| `splat` (`splat/splat.wgsl.js`) pass "over" | A or one-pass | BLEND | real for its solid part, light for its glow |
| Obla's character body (`night/character.js`) "under" | A or one-pass | BLEND | (body: as written) |
| `bloom.fsComposite` (`wgsl/bloom.wgsl.js`) | canvas, after the frame | one, one / zero, one (ADD) | untouched (glow added at alpha 0) |
| bloom prefilter / down / up | rgba16float levels (not the canvas) | none / ADD | n/a; the prefilter reads the canvas (TEXTURE_BINDING) and takes alpha as "glass" |

## The choice: (a) a last full-screen pass, folded into the bloom's composite (why not (b))

- **(b) the blend-state way does not hold.** (1) The swarm's ONE pipeline writes dawn ink (needs "over": colour dst factor
  1 - srcA) and night light (needs "add": dst factor 1) per fragment, through the same blend; WebGPU's colour factor and
  the alpha accumulation both read the fragment's one alpha output, and there is no dual-source blending in core. Light
  with alpha > 0 under that blend becomes "over" (j-device `home-nightalpha/`: the name goes flat cobalt, no white
  heat). Keeping it additive means two draws of the swarm (its vertex work twice on every frame with a dawn edge).
  (2) The plates read pass A's alpha (`behindPage`: `g = g x (1 - k.a) + k.rgb`): light with alpha would darken the type
  bent by the glass; the bloom's prefilter reads alpha as "this is glass" (weighs it 0.15). (3) Over the night ground the
  look cannot stay exact: alpha that accumulates past 1 over-lifts or under-lifts the ground by G x (sum - 1) (up to
  7..12 steps where cobalt lights overlap). (4) Every pass and body written later would have to follow the rule.
- **(a) holds, centrally:** every pipeline draws exactly what it drew, into a texture of the canvas's format and size
  (`frameTex`); one full-screen pass writes the canvas: `a' = min(1, max(a, max_k (c_k - G_k a)/(1 - G_k)))`,
  `c' = c + G (a' - a)` with G the ground the stage knows is under the canvas there (night `#0c0e14`; the dawn's paper
  inside a dawn rectangle). Over the ground Chrome shows exactly what it showed (c + G (1 - a)); valid pixels (glass, ink,
  nothing) pass bit for bit; the dawn's paper stays exactly #f3f4f6 (nothing drawn -> 0,0,0,0). Float16: a' at most 1,
  colour above 1 at alpha 1 kept (HDR). 8 bit: a' rounded up to a step, c' to the nearest (valid after the write).
- **The bloom:** its composite (glow added to the canvas) becomes the resolve's glow entry: the same tent, cut and dither,
  then the resolve, in ONE pass. So a frame with the glow (every night scene but Contact and the closing at dawn) costs
  what it did (the composite read+wrote the canvas; the resolve reads the frame and writes the canvas); a frame without
  it pays one full-screen copy. With `?failbloom=1` or no glow asked: the plain resolve.
- **Memory:** one texture at the backing size in the canvas's format: 1440x900 DPR 2 tier A 2160x1350 = 11.7 MB (8 bit;
  23.3 MB float16); 1920x1080 DPR 1 = 8.3 MB; 390x844 DPR 2 tier B 497x1076 = 2.1 MB; the iPhone 393x852 DPR 3 tier B
  501x1086 = 2.2 MB. The stage already draws into one (pass A, the plates' ink texture, only with plates on screen) and
  the bloom read the canvas itself; pass B now writes `frameTex` instead of the canvas.
- **Bandwidth on the phone (the director's worry, DPR 3):** the stage's backing is not DPR 3: min(dpr, 1.5) x 0.85 =
  1.275 px per css px (j-device finding 7), 0.54 MP; one read + one write = 4.4 MB a frame, 0.26 GB/s at 60 Hz.
- **Fallback:** until the resolve's two small pipelines are in (they start beside the swarm's), or with
  `look({ resolve: 0 })` (a bench switch, for the A/B proof), the frame goes straight to the canvas with the old
  composite: exactly HEAD's frame.
