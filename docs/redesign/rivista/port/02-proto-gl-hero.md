# Map · the prototype's GL plate and hero (fx-gl / fx-hero) and the WebGPU alternative

Sources read in full: public/proto/rivista/fx-gl.js (680 lines), fx-hero.js (430), fx-hero.css (187), parts/b-hero.html (42), parts/b-preloader.html (12), fx-core.js (392, the bus that fx-gl/fx-hero depend on), fx-core.css (tokens, z scale, keyframes), parts/head.html (head boot script), fx-scroll.css §1 (the next sheet), fx-nav.js 118-165 (header over the plate), dev-gl.html (skimmed), .wf-out/rivista/fx/art-director/flow-poc.html (skimmed; it is the same PoC as dev-gl.html), .wf-out/rivista/fx/EFFECTS-PLAN.md §S1-S3 and §performance, .wf-out/rivista/build/reports/review-fix.json (MQ-01, MQ-05, J7, A6, A13). Next side: src/webgl/CanvasHost.tsx, src/webgl/store/heroStore.ts, src/webgl/waterball/WaterBallHero.tsx (623 lines, in full), waterball/common.ts, waterball/camera.ts (fitDistance), waterball/render/fluidRender.ts (constructor), the mls-mpm public surface (grep only, G4), src/components/bench/TestBench.tsx, BenchReadouts.tsx (header), src/app/_providers/Smooth.tsx, src/lib/gsap.ts, src/app/layout.tsx (header comment), src/store/ui.ts, public/bench/PROVENANCE.md.

Line numbers below refer to the files as they are on branch feat/redesign-2026-09 (commit 86854f4).

---

## 1. fx-gl.js · S2 "Carta corrente" · the only WebGL2 context of the page

File: public/proto/rivista/fx-gl.js. IIFE, registers itself as module "gl" on the window.FX bus (FX.register("gl", { init, build, onVariant, onResize }), line 650). Everything is module-scoped state; the public object is "api", assigned to FX.gl inside init() (line 656). Callers feature-detect FX.gl (null when FX.flags.gl is false, line 652).

### 1.1 Constants (lines 28-33)

| Name | Value | Meaning |
|---|---|---|
| GS | 512 | obstacle texture side, square, RGBA8 |
| TIER_N | { A: 16384, B: 8192, C: 4096 } | particle count per tier |
| TIER_TRAIL | { A: 1.5, B: 1.5, C: 1 } | trail-buffer supersampling per tier |
| NEXT_TIER | { A: "B", B: "C", C: "C" } | one-way downgrade ladder |
| MAXPIX | 3.2e6 | hard cap of pixels per buffer (drawing buffer AND trail) |
| BASE_DRIFT | 0.105 | base left-to-right current |

Tier pick (pickTier, lines 314-320): "A" by default; "B" if FX.flags.touch (pointer: coarse) or window.innerWidth < 768; "C" if navigator.deviceMemory is a number and <= 4. Runtime downgrade (lines 559-566): at frames === 90, if there are more than 30 GPU samples and the median is > 5 ms and tier is not "C", drop one tier (NEXT_TIER), reallocate particles, force a re-measure (cssW = 0; measure()), and emit fx:gl:state. Never goes back up (downgraded = true).

### 1.2 Shaders (GLSL ES 3.00, verbatim; lines 36-129)

Shared chunks:

```glsl
// NOISE
vec2 hash2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return -1.0 + 2.0 * fract(sin(p) * 43758.5453123); }
float gnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(mix(dot(hash2(i), f), dot(hash2(i + vec2(1,0)), f - vec2(1,0)), u.x),
             mix(dot(hash2(i + vec2(0,1)), f - vec2(0,1)), dot(hash2(i + vec2(1,1)), f - vec2(1,1)), u.x), u.y); }

// OBS  (obstacle lookup, shared by update / line / composite)
uniform vec2 uObsPos, uObsScale; uniform sampler2D uGlyph;
vec2 obsUv(vec2 p){ return (p - uObsPos) / uObsScale + 0.5; }
float ramp(vec2 p){ vec2 q = obsUv(p); if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return 1.0;
  return 1.0 - smoothstep(0.03, 0.55, texture(uGlyph, q).r); }
float interior(vec2 p){ vec2 q = obsUv(p); if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return 0.0; return texture(uGlyph, q).b; }
```

UPDATE_VS (particle advection through transform feedback; varyings vPos, vAge, vSeed, INTERLEAVED_ATTRIBS):

```glsl
#version 300 es
precision highp float;
in vec2 aPos; in float aAge; in float aSeed;
out vec2 vPos; out float vAge; out float vSeed;
uniform float uTime, uDt, uAspect, uDrift;
uniform vec3 uMouse; uniform vec2 uMouseVel;
${OBS}${NOISE}
float psi(vec2 p){
  float n = 0.115 * gnoise(p * 1.35 + vec2(0.0, uTime * 0.045)) + 0.05 * gnoise(p * 3.1 - vec2(uTime * 0.07, 0.0));
  return ramp(p) * (uDrift * p.y + n);
}
vec2 vel(vec2 p){ float e = 0.004; float dx = psi(p + vec2(e,0.0)) - psi(p - vec2(e,0.0)); float dy = psi(p + vec2(0.0,e)) - psi(p - vec2(0.0,e));
  vec2 v = vec2(dy, -dx) / (2.0 * e);
  vec2 d = p - uMouse.xy; v += exp(-dot(d,d) / 0.012) * uMouse.z * uMouseVel * 1.4; return v; }
float h1(float n){ return fract(sin(n) * 43758.5453); }
void main(){
  vec2 p = vec2(aPos.x * uAspect, aPos.y);
  vec2 v = vel(p);
  vec2 pm = p + v * uDt * 0.5; v = vel(pm);   // RK2 midpoint
  p += v * uDt;
  float age = aAge + uDt;
  float life = 2.2 + 3.8 * h1(aSeed * 91.7);
  if (length(v) < 0.035) age += uDt * 6.0;   // stagnant ink dries fast
  bool dead = age > life || p.x < -0.02 || p.x > uAspect + 0.02 || p.y < -0.02 || p.y > 1.02 || ramp(p) < 0.18 || interior(p) > 0.4;
  if (dead) {
    float k = aSeed * 13.13 + uTime;
    if (h1(k * 5.7 + 2.9) < 0.30) {          // 30% respawn in a ring just outside the halo
      float a = h1(k * 1.31) * 6.2831853;
      float rr = max(uObsScale.x, uObsScale.y) * (0.50 + 0.14 * h1(k * 2.77));
      p = uObsPos + vec2(cos(a), sin(a)) * rr;
    } else p = vec2(h1(k) * uAspect, h1(k * 1.7 + 4.2));
    age = 0.0;
    if (ramp(p) < 0.45 || interior(p) > 0.3 || p.x < 0.0 || p.x > uAspect || p.y < 0.0 || p.y > 1.0) {
      p = vec2(h1(k * 2.3 + 1.1) * uAspect, h1(k * 3.1 + 7.7));
    }
  }
  vPos = vec2(p.x / uAspect, p.y); vAge = age; vSeed = aSeed;
}
```

UPDATE_FS: "precision lowp float; out vec4 o; void main(){ o = vec4(0.0); }" (rasterizer discard is on, never runs).

LINE_VS (instanced hairlines, 2 vertices per instance, gl_VertexID 0 = previous position, 1 = current):

```glsl
#version 300 es
precision highp float;
in vec2 aPrev; in float aPrevAge; in vec2 aCurr; in float aCurrAge; in float aSeed;
out vec2 vCh;
uniform float uAspect, uAccentShare, uAccentGain;
${OBS}
float h1(float n){ return fract(sin(n) * 43758.5453); }
void main(){
  bool fresh = aCurrAge < aPrevAge;                 // a respawned particle collapses to a point
  vec2 p = (gl_VertexID == 0) ? aPrev : aCurr; if (fresh) p = aCurr;
  float life = 2.2 + 3.8 * h1(aSeed * 91.7);
  float fade = smoothstep(0.0, 0.5, aCurrAge) * (1.0 - smoothstep(life - 0.7, life, aCurrAge));
  float acc = step(h1(aSeed * 7.31), uAccentShare);
  vec2 sp = vec2(aCurr.x * uAspect, aCurr.y);
  float halo = smoothstep(0.30, 0.78, ramp(sp)) * (1.0 - smoothstep(0.15, 0.4, interior(sp)));
  vCh = vec2(1.0 - acc, acc * uAccentGain) * fade * halo;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
```

LINE_FS: "precision mediump float; in vec2 vCh; out vec4 o; uniform float uGain; void main(){ o = vec4(vCh * uGain, 0.0, 1.0); }" (additive, R = ink, G = accent).

QUAD_VS: "in vec2 aP; out vec2 vUv; void main(){ vUv = aP * 0.5 + 0.5; gl_Position = vec4(aP, 0.0, 1.0); }" (one big triangle, [-1,-1, 3,-1, -1,3]).

FADE_FS (trail decay, ping-pong):

```glsl
precision mediump float; in vec2 vUv; out vec4 o; uniform sampler2D uT; uniform float uDecay, uSub;
void main(){ vec2 t = texture(uT, vUv).rg; t = max(t * uDecay - uSub, 0.0); o = vec4(t, 0.0, 1.0); }
```

COMP_FS (composite from CSS tokens, to the default framebuffer):

```glsl
precision highp float; in vec2 vUv; out vec4 o;
uniform sampler2D uT; uniform vec3 uGround, uInk, uAccent, uPaper; uniform float uTime, uAspect, uEmboss;
${OBS}
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){ vec2 t = texture(uT, vUv).rg; vec3 c = uGround;
  vec2 sp = vec2(vUv.x * uAspect, vUv.y); vec2 q = obsUv(sp);
  if (uEmboss > 0.5 && q.x > 0.0 && q.x < 1.0 && q.y > 0.0 && q.y < 1.0) {
    c = mix(c, uPaper, smoothstep(0.35, 0.65, texture(uGlyph, q).g));
  }
  c = mix(c, uInk, clamp(t.r, 0.0, 1.0) * 0.86);
  c = mix(c, uAccent, clamp(t.g * 1.35, 0.0, 1.0));
  c += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * (2.0 / 255.0);   // +-1/255 grain
  o = vec4(c, 1.0); }
```

Sim space: x in 0..ASPECT, y in 0..1, y up. Particle storage is normalized (aPos.x in 0..1) and multiplied by uAspect in the shader.

### 1.3 Uniforms (full list, with the values set per frame in draw(), lines 465-520)

Update program (pUpd): uTime = simTime (s); uDt (clamped 0.001..0.033 in tick, or 1/60 during warm); uAspect = W/H; uDrift = params.drift * (1 + min(1.5, 0.08 * scrollBoost)); uObsPos / uObsScale from obsBox(); uMouse = (mouse.x, mouse.y, mouse.s); uMouseVel = (mouse.vx, mouse.vy); uGlyph = texture unit 0. After upload mouse.vx and vy decay by 0.9 and mouse.s by 0.96 per frame.

Fade program (pFade): uT = trail[0] (unit 0); uDecay = pow(0.965, 60 * dt); uSub = (1.2 / 255) * 60 * dt.

Line program (pLine): uGain = 0.5; uAspect; uAccentShare = 0.10; uAccentGain = 2.2; uObsPos / uObsScale; uGlyph unit 0. Blend ONE, ONE. drawArraysInstanced(gl.LINES, 0, 2, N) into trail[1] with viewport TW x TH.

Composite program (pComp): uT = trail[1] (unit 0); uGlyph (unit 1); uGround = colors.paper when ground === "paper" else colors.deep; uPaper; uInk; uAccent; uEmboss = 1 only when obstacle.type === "glyph" AND ground === "deep" (so the band never embosses); uAspect; uTime; uObsPos / uObsScale. Viewport W x H, default framebuffer. Then trail.reverse() and cur = 1 - cur.

Colours come from getComputedStyle(document.documentElement) of the custom properties --paper, --paper-deep, --ink, --accent (readColors, lines 158-160; hex parser rgb() handles #rgb and #rrggbb only). V1 values (fx-core.css lines 31-38): --paper #f6f3ec, --paper-deep #ede7dc, --ink #24211e, --accent #2340c9 (also --graphite #48443e, --stone #6b665d, --line #dcd5c8, --accent-dark #1a2f99, --on-accent #ffffff).

### 1.4 Particles and trail buffers

allocParticles (lines 321-356): Float32Array(N * 4) interleaved [x, y, age, seed], x and y random 0..1, age random 0..5, seed random; two ARRAY_BUFFERs with DYNAMIC_COPY (ping-pong). STRIDE 16 bytes. Two "updVao" (aPos at 0, aAge at 8, aSeed at 12) and two "lineVao" where aPrev/aPrevAge come from pbuf[i] and aCurr/aCurrAge/aSeed from pbuf[1-i], all with vertexAttribDivisor 1. Transform feedback writes to pbuf[1-cur] with bindBufferBase(TRANSFORM_FEEDBACK_BUFFER, 0). Note at 352-354: the generic ARRAY_BUFFER binding must be cleared before TF or you get GL_INVALID_OPERATION.

allocTrails (lines 357-373): two RG8 textures TW x TH, LINEAR, CLAMP_TO_EDGE, each with a framebuffer, cleared to black. Recreated on every measure() that changes size (a resize resets the trail).

### 1.5 Obstacle texture (the blind-embossed "A" or the band's rects)

buildObstacle (lines 225-253) packs three channels into a 512x512 RGBA8 upload (gtex), row-flipped so texture v points up:
- R = coverage blurred (canvas 2D filter "blur(7px)" for a glyph, "blur(12px)" for rects) -> the flow ramp (ramp = 1 - smoothstep(0.03, 0.55, R)).
- G = sharp coverage -> the emboss fill in the composite (smoothstep(0.35, 0.65, G) toward --paper).
- B = ink-free interior (glyph only; 0 for rects): interiorChannel (lines 185-219) samples the sharp map to a 128x128 grid, dilates the glyph by DIL = 5 cells (disc), flood-fills from the border, marks unreachable cells as interior, upsamples to 512 with blur(3px). Without it the counter of the A fills with eddies.
- A = 255.

paintGlyph (lines 169-177): black square, white glyph, textAlign center, textBaseline alphabetic, positioned so the actual bounding box is vertically centred (GS/2 + gh/2 - descent). Font string from glyphFont() (lines 254-258): (css("--w-hero") || "600") + " 430px " + first family of --f-display, quoted -> for V1 exactly: 600 430px "Cormorant Garamond". obstacle.font, when provided, overrides. Default obstacle = { type: "glyph", char: "A" } (line 143).

paintRects / rectBoxes (lines 178-184, 259-296): for the band host, for each element in obstacle.els it reads Range.getClientRects() per ".sc-line" (SplitText line) or of the element, undoing the entrance transform of the line by the offset between the line and its mask parent (so the obstacle is the printed position, whatever the entrance tween is doing), pads by obstacle.pad (default 0.4) * fontSize horizontally and 0.6 * that vertically, and converts to texture px through the host rect: x0 * GS etc. (the rect field covers the whole sim: obsBox returns { x: ASPECT/2, y: 0.5, sx: ASPECT, sy: 1 } for rects, line 222).

Obstacle placement uniform (obsBox, lines 221-224): for a glyph { x: params.glyphX, y: params.glyphY, sx: params.glyphScale, sy: params.glyphScale } in sim units.

### 1.6 Tweenable public state (plain objects, tweened directly by GSAP from fx-hero)

- params = { drift: 0.105, glyphX: 0.5, glyphY: 0.5, glyphScale: 0.92 } (line 146). fx-hero sets the actual values (see §2).
- clip = { t: 0, r: 0, b: 0, l: 0, on: false } (line 147): px insets of the float canvas, applied every ticker tick (applyClip, lines 523-529) as canvas.style.clipPath = "inset(Tpx Rpx Bpx Lpx)" or "none", only in float mode, and only when the string changed. Comment: "compositor only: cheap, and it must follow a scrub".

### 1.7 Placement: float vs dock (place(), lines 444-457; mount(), 594-605)

- mount(el, { mode: "float"|"dock", ground: "deep"|"paper" }) returns false if the context is neither ok nor pending or el is null; returns true early if nothing changed. Stores host, hostName = el.getAttribute("data-gl-host"), mode, ground; resets cssW/cssH and lastClip; place(); measure(); buildObstacle().
- float: canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;display:block;z-index:var(--z-gl);pointer-events:none", appended to document.body; zWant (from setZ) re-applied; clip re-applied. The canvas measures window.innerWidth x innerHeight.
- dock: cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none", clipPath cleared, appended into the host element; measures host.getBoundingClientRect() rounded.
- setZ(z) (line 606): stores zWant and, if float, sets canvas.style.zIndex. fx-hero uses "var(--z-pre-gl)" (96) under the preloader and "var(--z-gl)" (1) after the handoff. z scale (fx-core.css 136-149): --z-gl 1, --z-hero 2, --z-sheet 3, --z-menu 59, --z-header 60, --z-cursor 70, --z-nav-sheet 88, --z-nav-img 89, --z-cols 90, --z-pre 95, --z-pre-gl 96, --z-pre-hdr 97, --z-switcher 120, --z-skip 200.
- The canvas element: className "gl-canvas", aria-hidden="true", starts visibility:hidden and is shown only once drawn (vis(), line 137: visible iff wantVis && drawn && !lost). Context options: { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance", preserveDrawingBuffer: false } (line 382).

### 1.8 window(rect|null) (lines 607-613)

Convenience over clip: rect == null -> clip.on = false; else clip.on = true, clip.t = rect.top, clip.l = rect.left, clip.r = innerWidth - (left + width), clip.b = innerHeight - (top + height). fx-hero does not call window(); it writes clip fields directly and tweens them.

### 1.9 Resize and DPR policy (measure(), lines 425-443; resize(), 645)

- CSS size w,h = viewport (float) or host rect (dock). Returns false (no realloc) if < 2 px or unchanged.
- dpr = min(window.devicePixelRatio || 1, cap) with cap = min(1.5, sqrt(MAXPIX / area)). Drawing buffer W = round(w * dpr), H = round(h * dpr).
- Trail scale tcap = min(trailScale (1.5 or 1), sqrt(MAXPIX / area)); TW = round(w * tcap), TH = round(h * tcap). NB: trail is CSS px x 1.5, not dpr-relative (supersampled hairlines at DPR 1).
- ASPECT = W / H. Reallocates the two trail FBOs (trail reset) and sets canvas.width/height.
- api.resize(): if measure() changed -> buildObstacle() + warm(30); else if obstacle is "rects" -> buildObstacle() only (line boxes may have moved). Called by fx-core's debounced (200 ms) onResize hook, only when innerWidth/innerHeight actually changed.
- The float canvas keeps its trail across the S3 scrub (no resize happens: the clip-path window is the only thing that moves).

### 1.10 Boot, parallel link, warm-up, loop gating (lines 375-422, 530-568, 650-675)

- init(ctx): if !FX.flags.gl -> FX.gl = null and return. Else pending = true, FX.gl = api, and boot() is deferred by two requestAnimationFrame calls (MQ-01 fix: "the context itself is created two frames after the first paint, so the preloader's first frames never wait on the driver"). tick is added to ctx.gsap.ticker. Listeners: window pointermove (passive), document visibilitychange (sleep(false) when hidden if running, wake() when visible again), FX events fx:nav:covered -> pause, fx:nav:uncovered and fx:nav:reset -> resume, fx:lock with reason "menu" -> pause/resume. "covered" makes wake() defer (wakeAfter) until the cover leaves.
- boot(): create canvas + webgl2 context, extensions EXT_disjoint_timer_query_webgl2 (tq) and KHR_parallel_shader_compile (pext), rebuild() compiles and links the four programs without reading LINK_STATUS; pending = true.
- tick: while pending it polls linkDone() (COMPLETION_STATUS_KHR on all four, or immediately true without the extension), then finishLink(): checkLink each, build quadVao and gtex, pickTier, allocParticles, readColors, and if a host was mounted meanwhile: place(), measure(), buildObstacle(), warm(60) (unless a warm is already queued); emits fx:gl:linked; runs a deferred wake() if wantRun.
- warm(n) (line 621): queues min(220, warmQ + n) simulation steps; the ticker runs them 10 per frame at dt = 1/60 (lines 535-541) even while state is "sleep"; on first drawn frame the canvas becomes visible; when the queue empties it emits fx:gl:stats (so a reduced-motion plate that only warms still reports its instruments).
- wake() (627-633): no-op if lost / no host / not linked or pending. If covered -> wakeAfter. If pending -> wantRun. Else wantVis = true, state "run".
- sleep(hide) (637-642): wantVis = !hide (hide = the host is off screen, so the last composited frame is hidden too); state "sleep". "asleep or off: zero GL calls" (line 542).
- Loop while "run": dt = clamp(deltaMs/1000, 0.001, 0.033); one step(dt) per ticker frame; timer query bracketed around step (one query in flight at a time; result read only when QUERY_RESULT_AVAILABLE and not GPU_DISJOINT_EXT; up to 240 samples kept); frames counter; stats event every 1 s of ticker time.
- fail(err) (416-422): ok = false, console.warn "[fx] gl: the flow plate is off, the poster stays.", removes the canvas, sets FX.flags.gl = false (which toggles html.gl-off), state "off".
- webglcontextlost -> preventDefault, lost = true, ok = false, drawn = false, state "off", canvas hidden. webglcontextrestored -> rebuild() (recompile; the ticker re-runs finishLink).
- onVariant(): readColors(), drop the cached glyph font, buildObstacle(), warm(30). onResize(): api.resize().
- recolor(): readColors + buildObstacle + warm(30). scrollVelocity(v): scrollBoost = |v| (fed from Lenis "scroll" event velocity by fx-hero).

### 1.11 Pointer (onPointer, lines 571-583)

Only when ok, state === "run" and FX.flags.fine (hover: hover and pointer: fine). Maps clientX/Y into sim units (float: viewport; dock: host rect), velocity = delta * 60, strength mouse.s = 1. The shader adds exp(-d^2/0.012) * s * vel * 1.4.

### 1.12 The instrument row (fx:gl:stats)

Payload { n, gpuMs | null, dpr (rounded to 2 decimals), tier }, emitted (a) when a warm queue empties, (b) every 1 s while running, plus api.stats getter { n, gpuMs, dpr, tier, state, host, w, h }. gpuMs is the LAST sample (not the median; the median is only used for the tier decision). fx-hero prints it (see §2.5).

### 1.13 Poster / still path when GL is off

There is no engine-generated still at runtime. The poster is markup: three real img elements inside the host (.hr-poster.v1/.v2/.v3, fx-plate-v1/2/3.webp, 892x940, 230/196/203 KB), one shown per html[data-variant] (fx-hero.css 124-126). The canvas is appended into the same host (dock) or fixed over it (float), so with the context alive the poster is underneath; in float mode .hr-frame.hr-float hides the poster (visibility: hidden) and makes the frame and host transparent (fx-hero.css 118-120). The caption's "Still frame captured from this engine." line (.hr-still) is display:block only under html.gl-off, html.fx-off-gl, html.fx-fail-gl or html:not(.rv-js) (fx-hero.css 73-77). ?gl=0 sets html.gl-off from the head script. The posters were captured from dev-gl.html / the engine (plan §S2 "Fallback"); their provenance is not embedded (unlike the Next site's public/bench stills).

### 1.14 Scenes extension point

The engine has exactly two compositions selected by mount options + setObstacle: (hero) mode float or dock, ground "deep", obstacle glyph "A", emboss on; (band) mode dock, ground "paper", obstacle rects of the sentence + email, emboss off. A third scene is a new mount() + setObstacle() pair; nothing else is scene-aware. Host switching is orchestrated by fx-hero (chooseHost, §2.3), not by fx-gl.

### 1.15 Dispose

There is no dispose() in the API. Buffers, VAOs and trail FBOs are deleted only on reallocation (allocParticles / allocTrails); the canvas is removed only on fail(). The prototype is a single-page document, so teardown never happens. A port needs an explicit dispose: remove ticker callback, listeners, delete programs/buffers/textures/FBOs, loseContext via WEBGL_lose_context, remove canvas.

---

## 2. fx-hero.js · S1 "Registro" preloader, S2 hosting, S3 "Otturatore" stage, band

File: public/proto/rivista/fx-hero.js. Module "hero"; exposes FX.hero = { intro, stageOn (getter), progress (getter) } (line 327).

### 2.1 DOM (parts/b-hero.html + b-preloader.html) and the selectors fx-hero reads (lines 330-342)

- section.hero.hr-stage[aria-labelledby="hero-h1"] > div.hr-screen > (div.hr-type | div.hr-side)
- .hr-type: p.lockup (sr-only "Alberto Tuveri" + aria-hidden span with .lk-line.l1 > .lk-word > .ch x7 with --i:0..6 for "Alberto" and .lk-line.l2 > .lk-word > .ch x6 with --i:7..12 for "Tuveri"); span.hr-orn (aria-hidden) > span.ornament.row "engineer" + span.orn-rule; div.hr-fade.hr-said.row > p.label.stone[data-hero-reveal] + h1#hero-h1.d3[data-hero-reveal][style="--d:.08s"].
- .hr-side: figure.hr-plate > div.frame.hr-frame[data-hero-media][data-gl-slot="hero"] > div.gl-host[data-gl-host="hero"] > img.hr-poster.v1/.v2/.v3; figcaption.hr-fade.hr-cap[data-fade-end="early"] > span.label + span.hr-instr[data-gl-instr] + span.hr-still; then div.hr-fade.hr-act[data-fade-end="early"] > div.hero-cta[data-hero-reveal][style="--d:.16s"] > a.btn (mailto) + div.ghosts > a.ghost href="#work", a.ghost href="#path".
- Preloader: div.hr-pre[data-pre][aria-hidden="true"] > div.hr-pre_sheet[data-pre-sheet] + div.hr-pre_foot > p.hr-pre_count[data-pre-count] (3 x span.hr-dig > span.hr-dig_in > span.hr-dig_st > 11 x i "0".."9","0") + div.hr-pre_rule > i[data-pre-rule] + p.hr-pre_meta.label "Loading · " span[data-pre-what].
- Variables: stage = .hr-stage, screen = .hr-screen, slotEl = [data-gl-slot="hero"], heroHost = [data-gl-host="hero"], frame = .hr-frame, word1/word2 = .lk-line.l1/.l2 .lk-word, ornWrap = .hr-orn, fades = all .hr-fade, instr = [data-gl-instr], pre = [data-pre], preSheet = [data-pre-sheet], preFoot = .hr-pre_foot, digIn = .hr-dig_in, digSt = .hr-dig_st, preRuleI = [data-pre-rule], preMeta = .hr-pre_meta, preWhat = [data-pre-what]. bandHost = [data-gl-host="band"] (read in build). Band copy = [data-band-copy] (h2, a, p inside it, filtered to offsetParent !== null).

Layout (fx-hero.css): .hr-screen padding-top calc(var(--hdr) + clamp(1.5rem,4vh,3rem)). Desktop >= 1024: .hr-screen is a grid "minmax(0,1fr) clamp(18rem,31vw,34rem)", min-height 100svh, --t-hero clamp(3.1rem,10.5vw,11rem) (base is clamp(3.1rem,13vw,13rem)); .hr-plate flex 1 1 auto, .hr-frame min-height 8rem, max-height min(52svh, 34rem); CTA right-aligned; .hr-said margin-top auto (settles on the CTA line), h1 max-width calc(var(--ch-d) * 34) with --ch-d 0.477em (V1). Below 1024: .hr-act order 1 (CTA first), .hr-plate order 2 with aspect-ratio 4/5 full-bleed, margin-top clamp(2rem,5vh,3.5rem). .lockup: font-family var(--f-display), weight var(--w-hero) 600, line-height 0.9, letter-spacing var(--tr-hero) -0.01em, uppercase; .lk-line overflow hidden (the mask), .l2 padding-left 0.95em. .hr-instr: 1rem, uppercase, letter-spacing 0.06em, tabular-nums, color --graphite, display none when empty, but with JS + GL on it reserves min-height 2.8em from first paint (line 71; "FIX r4": the readout arrives a frame after the first GL tick and had moved the work rail 49 px on a phone).

Stage sizes (fx-hero.css 17-31): .hr-stage[data-on] { height: 300svh }, its .hr-screen is sticky top 0, height 100svh; ".hr-stage[data-on] + section" gets margin-top calc(-1 * var(--hero-cover, 0px)) and a 1 px top hairline. fx-scroll.css §1 does the same for .sc-sheet (z-index var(--z-sheet), background var(--paper)). --hero-cover: 100svh is written on html by buildStage and removed by its cleanup.

### 2.2 S1 "Registro": the preloader and intro() handoff

Entry decision is in the head script (parts/head.html line 39): html gets data-preloader and class rv-pre-run, and window.__rvT0 = performance.now(), only when data-home AND no prefers-reduced-motion AND no arrival record AND no location.hash AND sessionStorage "rv-intro-seen" is not set. --hd (the CSS film delay) is set to 1.85s under the preloader, 0.45s on arrival, 0.15s otherwise. fx-core boot locks the page (FX.lock("entry"): Lenis stopped, main inert) and calls FX.hero.intro() after build; a 6 s guard forces a plain entry; CSS failsafe hr-pre-failsafe fades the sheet at 5.2 s if JS never arrives.

Progress (lines 42-54, 76-91): four tasks fonts (FX.fonts(1500)), shaders (g.linked or no engine), plate (share of the chunked warm already run: 1 - g.warmLeft / PLATE_STEPS with PLATE_STEPS = 90; = 1 when not float), dom (true at init). target = done/4 * 100; shown eases toward target with 1 - exp(-9 dt), snaps to 100 when target >= 100 and shown > 99.4, and is capped by elapsed ms / 10 (never faster than 1 s, never a faked delay). counterDone = shown >= 99.9 || elapsed > 2600 ms. Digits are painted through the gear() rolling function (11 cells, the 11th is a duplicate 0) with transform "translateY(calc(-pos * var(--cell)))", --cell 1.12em; the rule i[data-pre-rule] is scaleX(v/100); [data-pre-what] prints "Fonts" -> "Shaders" -> "Plate" -> "Ready".

Init under entry === "intro" (lines 346-374): float = FX.flags.desktop && FX.flags.motion && FX.flags.gl. If float and FX.gl: heroHost gets class hr-float; gl.mount(heroHost, { mode: "float", ground: "deep" }); setObstacle({ type: "glyph", char: "A" }); setZ("var(--z-pre-gl)"); openRect() = { top: H * 0.14, left: W * 0.23, width: W * 0.54, height: bottom - top } where bottom = max(top + H * 0.3, min(H * 0.86, footTop - H * 0.05)) and footTop is the counter block's top; params.glyphX/Y = simOf(openRect) centre (sim units: x = cx/W * aspect, y = 1 - cy/H), glyphScale = 0.46; clip starts as a zero-height horizontal slit at the rect centre (c.t = cy, c.b = H - cy, c.l = cx, c.r = W - cx, on = true); warm(90); wake(). The slit opens (G.to(c, { t,b,l,r of openRect }, 0.9 s, "expo.out")) one rAF after the first fx:gl:state === "run", with a 1600 ms setTimeout guard.

intro() (lines 277-321): sets sessionStorage rv-intro-seen = "1"; awaits the counter reaching done (then stopCounter + 80 ms delayedCall); then one GSAP timeline (defaults overwrite: "auto"), skippable to timeScale(3) by pointerdown on .hr-pre or keys " ", "Enter", "Escape":
- t=0: digits .hr-dig_in yPercent -112, 0.5 s, ease "domus.inOut", stagger 0.04 (their CSS animation set to none first); rule scaleX 0 from right, 0.45 s; .hr-pre_meta opacity 0, 0.3 s.
- t=0 (float only): gl.clip -> slot rect (measureSlot of [data-gl-slot="hero"]) 1.1 s "expo.inOut"; gl.params -> { glyphX: s.x, glyphY: s.y, glyphScale: 0.46 } 1.1 s "expo.inOut" (the window travels from the centre to the slot with its trail intact).
- t=0.15: .hr-pre_sheet clipPath "inset(0 0 100% 0)" 1.0 s "domus.inOut" (the sheet rolls up).
- t=0.45: handoff(): html gets class hr-pre-out (removed after 2 s), data-preloader removed, rv-pre-run removed, --hd rewritten to the elapsed seconds so the CSS lockup film (rv-rise on .lockup .ch, 1.25 s, 0.045 s per char) starts now, gl.setZ("var(--z-gl)"), emit fx:intro:handoff (sticky; fx-nav raises the nav items from their masks on it).
- t=0.75 (dock only): slitOpen() -> frame clipPath from "inset(50% 0 50% 0)" to "inset(0% 0 0% 0)" 0.9 s expo.out.
- t=1.25 (float) or 0.95 (dock): remove key listener, pre.remove(), introRunning = false, applyStage(0) if the stage is on, FX.ready("intro") (unlocks Lenis and main, emits fx:ready).
CustomEases (fx-core.js 351-353): "domus" = "M0,0 C0.22,0.9 0.36,1 1,1", "domus.inOut" = "M0,0 C0.66,0 0.22,1 1,1", "dtOut" = "0.25,1,0.5,1". CSS twins: --ease-out cubic-bezier(0.16,1,0.3,1), --ease-io cubic-bezier(0.66,0,0.22,1), --ease-soft cubic-bezier(0.22,0.9,0.36,1), --ease-xio cubic-bezier(0.87,0,0.13,1).

Repeat visit on the stage (no preloader, motion on): FX.once("fx:ready", slotSlit) -> the window opens in its slot from a horizontal slit, 0.9 s expo.out (lines 256-264). No preloader and no stage (dock): frame gets class hr-curtain and the CSS rv-media film runs (clip-path inset(100% 0 0 0) + translateY(8vh) -> none, 1.5 s, delay --hd + 0.35s).

### 2.3 S2 hosting: who owns the canvas, when (lines 111-168)

mountHero(): setFloatSkin(float) (toggles .hr-float on .hr-frame); gl.mount(heroHost, { mode: float ? "float" : "dock", ground: "deep" }); setObstacle glyph "A"; in dock mode params.glyphX = a/2, glyphY = 0.5, glyphScale = min(0.88, a * 0.86) (a = w/h of the plate: a portrait plate must not crop the letter), drift 0.105.

mountBand(): setFloatSkin(false); gl.mount(bandHost, { mode: "dock", ground: "paper" }); setObstacle({ type: "rects", els: visible h2/a/p inside [data-band-copy], pad: 0.4 }); warm(60).

chooseHost(): wanted = hero if heroVisible, else band if bandVisible, else "" -> gl.sleep(true). For hero: mountHero(), warm(40), then start(): if !FX.flags.motion -> warm(180) + sleep(false) (a still engraving, canvas stays visible), else wake(). For band: mount in requestIdleCallback({ timeout: 500 }) (or setTimeout 60), then start(). Visibility: IntersectionObserver rootMargin "25%" on heroHost and a second one with rootMargin "100% 0px" on bandHost (band mounted a full viewport early, MQ-05). Without IntersectionObserver the hero is assumed visible.

Lenis coupling (lines 399, 416): FX.lenis.on("scroll", e => gl.scrollVelocity(e.velocity || 0)).

On the case page (ctx.page !== "home") only the band exists; build() observes it and wires Lenis (lines 395-401).

### 2.4 S3 "Otturatore": the sticky stage scrub (lines 171-246)

Built only inside mm.add("(min-width: 1024px)") and only if FX.flags.motion && FX.flags.gl && FX.gl (line 405-408). buildStage(): stageOn = true, float = true, stage gets data-on, html --hero-cover = 100svh, measureSlot(), mountHero(), applyStage(0) unless the intro is running. One gsap.to on a proxy { p: 0 -> 1 }, ease "none", scrollTrigger { trigger: .hr-stage, start: "top top", end: "+=" + innerHeight, scrub: 0.5, invalidateOnRefresh: true, onRefresh: measureSlot + applyStage }, onUpdate -> applyStage(p). A second ScrollTrigger (start "top top", end "+=" + innerHeight * 2) sleeps the plate onLeave (gl.sleep(true): the rising sheet has covered it) and wakes it onEnterBack (wake() only: "the float canvas kept its trail: no re-warm"). Cleanup (the matchMedia revert) removes data-on and --hero-cover, restores inline styles and tabindex, sets clip.on = false and remounts the hero in dock mode.

applyStage(p) with seg(p, a, b) = clamp01((p - a) / (b - a)), W/H = viewport, a = W/H, slot = the [data-gl-slot="hero"] rect (measured on refresh/resize):
- word1 (ALBERTO): translate(-6% * q1, -118% * q1) with q1 = seg(p, 0, 0.40).
- word2 (TUVERI): translate(6% * q2, (-30 * h2 - 88 * q2)%) with h2 = seg(p, 0, 0.35), q2 = seg(p, 0.35, 0.60) (J7 fix: the last line holds, lifting only 30%, until p 0.35, then leaves by 0.60).
- .hr-orn opacity 1 - seg(p, 0, 0.15).
- every .hr-fade: f = seg(p, 0, data-fade-end === "early" ? 0.09 : 0.30); opacity 1 - f, translateY(-24px * f); when f > 0.98 its a/button descendants get tabindex="-1" (A6 fix: the h1 stays in the accessibility tree; only controls leave the tab order).
- GL window (float only): open = seg(p, 0.05, 0.50), sweep = seg(p, 0.08, 0.62), gm = seg(p, 0.08, 0.80). clip.on = true; clip.t = lerp(slot.top, 0, open); clip.b = lerp(H - (slot.top + slot.height), 0, open); clip.r = lerp(W - (slot.left + slot.width), 0, open); clip.l = lerp(slot.left, 0, sweep) (the blade opens to full height on the right, then sweeps left). Glyph: glyphX = lerp(s.x, a/2, gm), glyphY = lerp(s.y, 0.5, gm), glyphScale = lerp(0.46, 0.95, gm), drift = lerp(0.105, 0.168, gm) (the A glides to the centre and grows, current x1.6).
- The header (fx-nav.js 118-151) is forced hidden while scrollY is between stage top + 0.08 vh and stage top + 2 vh - 2 px ("no paper ground and no nav text ever sits over the moving plate").

### 2.5 Caption and instrument row (lines 376-390)

On fx:gl:stats: instr.textContent = [n.toLocaleString("en-US") + " particles", "WebGL2", (gpuMs.toFixed(1) + " ms GPU" only if gpuMs is a number), "DPR " + dpr].join(" · "), with normal spaces replaced by no-break spaces inside each token. Example: "16,384 particles · WebGL2 · 1.1 ms GPU · DPR 1.5" (CSS uppercases it). Cadence: once when a warm queue empties, then 1 Hz while running. On fx:gl:state "off": the row is emptied and the float skin removed (poster comes straight back).

### 2.6 Mobile / tablet (< 1024) and reduced motion

- < 1024 or no motion or no GL: stage off (plain static section, no data-on, no --hero-cover); plate docked inside .hr-frame (4:5 full-bleed under the CTA below 1024); tier B (touch or < 768) or C; no float, no S1 window (the preloader still runs on a phone with motion, but the plate task counts as done: plate = 1 when !float, and slitOpen() opens the docked frame at t=0.75).
- Reduced motion: no preloader at all (head script), FX.flags.motion false -> chooseHost runs warm(180) then sleep(false): one composited still engraving, no loop, no pointer, no scroll coupling; instruments are still emitted when the warm empties. fx-core reloads the page on a live change of prefers-reduced-motion (line 301). CSS kill switch (fx-core.css §10) zeroes every animation/transition duration.

### 2.7 Resize (onResize hook, lines 425-428; fx-core debounce 200 ms)

If the stage is on: measureSlot() and applyStage(stageP) (unless the intro is running). If the band is the wanted host: mountBand() again (re-reads the line boxes). fx-gl's own onResize runs first (module order gl, hero, scroll, nav) and may reallocate + warm(30). Crossing 1024 px: the gsap.matchMedia revert/rebuild runs; fx-core (lines 303-335) restores the reader's place after a breakpoint change.

### 2.8 Variant switch (onVariant, lines 419-424)

fx-gl recolours and rebuilds the glyph first; then the stage re-applies its progress and, if the band is mounted, its rects are re-read one frame later (fx-scroll re-splits the sentence). Irrelevant for the port (V1 is fixed) except as the recipe for a locale switch: the band obstacle depends on the printed text, so an EN/IT toggle must re-run setObstacle({ type: "rects" ... }) after the new lines are laid out.

### 2.9 The closing band reuse

Same engine, second composition: [data-gl-host="band"] is the first child of section#contact.band (fx-scroll.css: aspect-ratio 16/9, min-height 70svh, overflow hidden, background --paper; phones: aspect auto, min-height 78svh); .gl-host[data-gl-host="band"] has background --paper and z-index 0; .band-copy is absolute at left/right --pad, bottom 12vh (8vh on phones), z-index 2. Ground "paper", no emboss, obstacle = padded line boxes of h2 "Write to me." and the email link (and the eyebrow p). Scroll velocity quickens the drift. Known open defect A13 (deferred): on phones an eddy is trapped between the headline and the email.

---

## 3. Visible copy in the hero partial (verbatim EN) with element roles

| Text | Element / role |
|---|---|
| "Alberto Tuveri" | span.sr-only inside p.lockup (the accessible name of the lockup; the char spans are aria-hidden) |
| "Alberto" / "Tuveri" | .lk-line.l1 .lk-word / .lk-line.l2 .lk-word, one span.ch per letter with --i 0..12 (decorative, aria-hidden) |
| "engineer" | span.ornament.row inside span.hr-orn (aria-hidden; italic accent ornament) |
| "Software & AI Engineer · Creative Lead" | p.label.stone[data-hero-reveal] (the role line) |
| "From database schema to real-time WebGPU rendering and motion design." | h1#hero-h1.d3[data-hero-reveal] ("real-time" wrapped in white-space:nowrap; the page's only h1) |
| "A flow field of fine cobalt and ink hairlines streaming left to right, parting around a large letter A left blank in the paper." | alt of img.hr-poster.v1 (V2 says "teal", V3 says "green") |
| "Fig. 01 · Flow field, rendered live" | span.label inside figcaption.hr-cap |
| (engine readout, e.g. "16,384 particles · WebGL2 · 1.1 ms GPU · DPR 1.5") | span.hr-instr[data-gl-instr], JS-written, uppercase by CSS |
| "Still frame captured from this engine." | span.hr-still (shown only when GL is off/failed/no JS) |
| "Write to me" | a.btn href="mailto:albertotuveri@gmail.com" (with an arrow svg, aria-hidden) |
| "Selected work" | a.ghost href="#work" (with a down-arrow svg) |
| "About" | a.ghost href="#path" |
| Preloader: "0".."9","0" digit strips; "Loading · " + "Fonts" / "Shaders" / "Plate" / "Ready" | p.hr-pre_count (aria-hidden root .hr-pre), p.hr-pre_meta.label + span[data-pre-what] |
| Band (for the second composition): "Contact", "Write to me.", "albertotuveri@gmail.com" | p.eyebrow.label[data-reveal], h2#ct-h.d1[data-lines], a.sc-email[data-magnetic] |

Note for the port: the plan's caption sentence "A WebGL2 stand-in for the WebGPU MLS-MPM fluid that runs on the real site." is NOT in the partial (only in EFFECTS-PLAN §S2). Every string above must move to src/content/dict.ts in EN and IT. None of them contains a number that needs PRODUCT.md, except the instrument row, which is read from the engine (allowed: measured, not claimed).

---

## 4. Mapping proposal for Next.js 16 / React 19

### 4.1 Where the canvas lives

One canvas, owned by the persistent root layout (src/app/layout.tsx), next to Smooth (the ticker owner) and the Preloader, rendered as a client component "FlowPlate" (or "GlPlate") that renders nothing on the server and creates the canvas in an effect (SSR guard: typeof window, "WebGL2RenderingContext" in window). The layout comment currently says "Niente ... canvas fissa nel layout" for the job-order world; that rule dies with it. Reason it must be in the layout: in float mode the canvas is position:fixed on body and must survive route transitions (the prototype pauses it on fx:nav:covered and resumes on uncovered); in dock mode it is re-parented into the host element. Re-parenting a DOM node that React does not own is fine as long as React never renders the canvas: keep it imperative (document.createElement, appendChild into host refs), exactly as fx-gl does.

### 4.2 Shape of the engine module

- src/webgl/flow/flowEngine.ts: a framework-free class or factory (port of fx-gl.js minus the FX bus) exposing the same API: mount(el, { mode, ground }), setZ, window, setObstacle, params, clip, warm, wake, sleep, recolor, scrollVelocity, resize, plus new dispose(). Replace FX.emit with a tiny typed emitter or, better, write into a zustand store (see 4.4). Replace css("--paper") reads with getComputedStyle on document.documentElement of the new V1 tokens (keep the names --paper, --paper-deep, --ink, --accent in globals.css @theme so the shader stays colour-agnostic) or pass colours explicitly from tokens.ts. Replace FX.flags.touch/fine/desktop with matchMedia calls; keep the "(hover: hover) and (pointer: fine)" gate for the pointer.
- Ticker: add tick to the shared gsap.ticker from src/lib/gsap.ts (one rAF for the whole site: Lenis is already on it in Smooth.tsx). Never a second rAF.
- src/webgl/flow/FlowPlate.tsx ("use client"): mounted once in layout; creates the engine in useEffect after two rAFs (MQ-01), stores it in a module singleton (getFlowEngine()) and a ref; wires document visibilitychange; cleanup calls dispose() (StrictMode double-invoke: dispose must be idempotent and the engine re-creatable).
- Addressing from elsewhere: a hook useFlowPlate() returning the singleton (null until linked), plus a small zustand store flowStore { state: "off"|"pending"|"sleep"|"run", tier, host, n, gpuMs, dpr, linked, warmLeft } written by the engine (setState from the loop, no React re-render per frame, same discipline as heroStore). Components read numbers on the ticker (as BenchReadouts does), and only "state" reactively.
- Host components (Hero, ClosingBand) register their host element with a ref and drive mount/setObstacle/wake/sleep from their own IntersectionObservers (port of chooseHost into a tiny "useGlHost" arbiter: single wanted host, hero wins over band, requestIdleCallback for the band).
- Covers: the transition layer (src/components/transition/CoverOverlay.tsx, RouteTransition) and the menu must call engine.pause()/resume() where the prototype listened to fx:nav:covered / fx:nav:uncovered / fx:nav:reset and fx:lock reason "menu". On a route change to a page without a hero the float canvas must be slept and hidden (sleep(true)); the band on every route re-mounts it in dock mode.
- The hero (src/components/hero/Hero.tsx + useHeroStage.ts): port applyStage verbatim (it is pure math over refs); use useGSAP with a gsap.matchMedia "(min-width: 1024px)" for the stage, set --hero-cover on html only while on; the next section must carry the .sc-sheet rule (negative margin-top + hairline + --z-sheet). Reduced motion via useUI.reducedMotion / html[data-motion="reduced"] (Smooth.tsx) instead of FX.flags.motion.
- The preloader (src/components/Preloader.tsx today: fonts-gated sheet, SEEN_KEY in sessionStorage, ?nopre): re-do it as S1 "Registro" reading real progress from flowStore (linked, warmLeft) + document.fonts; the intro timeline tweens engine.clip and engine.params exactly as fx-hero does; it must set z-index of the canvas to --z-pre-gl while running and --z-gl at handoff; it calls useUI.setLoaded(true) at the handoff (the existing "unlock" semantic) and the Hero listens for a "handoff" flag to start the lockup film (the CSS --hd trick can stay: write --hd on html at handoff).
- Copy: all strings from §3 in dict.ts (EN and IT), including the instrument row's unit words ("particles", "ms GPU", "DPR"). The row format must not break across lines: use no-break spaces inside tokens as the prototype does.
- Poster: one V1 poster only (fx-plate-v1.webp, 892x940) moved to public/plate/ with provenance embedded (EXIF or sidecar json, like public/bench and public/captures; gate impeccable embed-prompt --scan) and rendered by next/image or a plain img with width/height; the "Still frame captured from this engine." line shown when the engine reports "off" (store) or with no JS (CSS class on html set by an inline script, like the preloader's SKIP_SCRIPT pattern).
- Fonts: V1 = Cormorant Garamond (300/500/600, italic 500) + Figtree (300..600) via next/font/google exposed as --f-display / --f-text; glyphFont() must read the loaded family name (next/font gives a hashed family name, so pass the font string explicitly to setObstacle({ font }) rather than parsing --f-display; and wait for document.fonts.load('600 430px "<family>"') before the first buildObstacle or the A rasterises in Times).

### 4.3 The ?hero=gpu switch: mounting the MLS-MPM engine in the same slot

What exists (src/webgl/waterball/WaterBallHero.tsx): a React client component with no props. Mount API = render <WaterBallHero/> inside a position:relative box; it renders div[data-bench-canvas].pointer-events-none.absolute.inset-0 (z-index var(--z-bench), aria-hidden) with a canvas.block.h-full.w-full; it sizes the canvas from the wrapper (ResizeObserver, debounced 200 ms) at backing = box x min(devicePixelRatio, DPR_CAP) with DPR_CAP { desktop: 1.5, mobile: 1.0 }; tier by benchTier() (max-width 767px or hardwareConcurrency <= 4 -> "mobile"); particles 120,000 desktop / 60,000 mobile (numParticlesMax 200,000); the canvas is premultiplied-alpha transparent where there is no fluid (the DOM ground shows through); camera framed by Camera.fitDistance(INIT_BOX=[80,60,18], FOV 45deg, cw/ch) * FRAME_MARGIN 1.2 with sway; cubemap from /cubemap/{posx..negz}.png; pointer poke tracked on window (pointermove) mapped into the box; IntersectionObserver gates compute+render (threshold 0); a resize disposes the scene and rebuilds it with the same particle buffers (the fluid continues, changeNumParticles(prevCount)); unmount cancels the rAF, destroys buffers, cubemap and device and calls resetBench(). It runs its OWN requestAnimationFrame loop (not the gsap ticker) — a port to the shared ticker is render-side and allowed.

Store contract (src/webgl/store/heroStore.ts, zustand 5): status "compiling" (device/pipelines/cubemap being built) -> "warming" (first frame completed on the GPU, onSubmittedWorkDone) -> "live" after SETTLE_MS = 4200 ms of RENDERED time (idle time off-screen does not count) | "still" (reason "nogpu" or "reduced", set by CanvasHost before the engine or by the engine when requestAdapter fails) | "lost" (reason "lost", device.lost; the last frame stays, rAF cancelled). Values: frameMs (500 ms moving average, FRAME_WINDOW_MS), particles (sim.numParticles), dpr (applied ratio), tier. Plus legacy explode/reveal/video (no writers).

Gate (src/webgl/CanvasHost.tsx): resolves after mount: no navigator.gpu -> "nogpu", prefers-reduced-motion -> "reduced", else renders <WaterBallHero/>; route gate BENCH_ROUTES = new Set(["/"]); on unmount resetBench().

Still fallback: public/bench/tank-still-1520.webp (1520x1079, 30.1 KB) and tank-still-700.webp (700x497), captured from the live bench on 2026-09-16 (Chrome WebGPU, Playwright, 8000 ms of settling, readouts at capture: Particles 74,403 · Frame 16.7 ms · DPR 1.5 · Tier desktop), provenance in EXIF + public/bench/PROVENANCE.md; TestBench holds it over the canvas while covered (still/compiling/warming) and cross-fades it out over 320 ms at "live", and prints the word STILL on a plate in the degraded states with the reason line in the readouts (dict keys bench.still, bench.compiling, bench.settling, bench.running, bench.reasonNogpu/Reduced/Lost).

What a ?hero=gpu mount in the rivista hero slot needs:
1. Aspect: the sim box is 4:3 (INIT_BOX 80x60) and the camera fits it by max(byHeight, byWidth), so any slot aspect is framed with letterbox margins; the hero slot (about 446x470 at 1440x900, portrait-ish) and the 4:5 phone plate will show the A smaller than in the 760x540 bench. No code change needed for aspect; FRAME_MARGIN may need retuning (render-side, allowed).
2. Ground: the canvas is transparent; the slot must provide the --paper-deep ground (same as the flow plate's .gl-host background), so it drops in visually. The bench's amber/wet shading and the workshop cubemap are the current look; recolouring to paper/ink/cobalt is render-side (fluid.wgsl.ts, the cubemap PNGs via scripts/gen_workshop_cubemap.py) — allowed; the solver and its A-shaped confinement (g2p.wgsl.ts) are frozen (G4), and the "vasca" rectangular box (Phase B) is behind Alberto's explicit unlock (REDESIGN-SPEC §L.1).
3. Float mode / S3: WaterBallHero cannot do the prototype's clip-path window trick out of the box because it is sized by its wrapper via ResizeObserver: making the wrapper the viewport (position:fixed inset 0) and clipping it with clip-path is the equivalent (clip-path on the wrapper is compositor-only and does not trigger the ResizeObserver). The glyph travel (glyphX/Y/Scale) has no equivalent: the A is the solver's rest shape; camera target/distance tweens (camera.reset/currentDistance, render-side) are the only lever.
4. Instruments: read heroStore instead of flowStore; the row would print "120,000 particles · WebGPU · 16.7 ms frame · DPR 1.5" — note the WebGPU engine measures CPU frame delta (frameMs), not GPU time; there is no timestamp-query instrument (timestamp-query feature would be render-side work).
5. Preloader progress: map status compiling -> "Shaders", warming -> "Plate" (0..1 = settleAcc/SETTLE_MS would need exposing), live -> "Ready". The 4.2 s settle is far longer than the flow plate's 90 warm steps (1.5 s at 60 fps) and the counter is capped by elapsed time, so the intro would hold longer; alternatively present at "warming" (the still cross-fade pattern from TestBench).
6. Switch plumbing: read the search param in the layout client component (useSearchParams needs a Suspense boundary in Next 16 App Router) or an inline script writing html[data-hero="gpu"]; the slot then renders <WaterBallHero/> (dock only, no S3, tier by benchTier) instead of registering as a flow host; CanvasHost's BENCH_ROUTES and heroStore reset logic can be reused as is.
7. Budget rule: one heavy renderer on the site. With ?hero=gpu the flow plate must not run at the same time (the band composition would then have no engine unless the flow engine is kept for the band only, which is two contexts: decide explicitly).

### 4.4 Store and events, side by side

| Prototype (fx-gl / FX bus) | Next port |
|---|---|
| fx:gl:state { state: "off"|"sleep"|"run", tier, host } | flowStore.state / tier / host (zustand, setState from the loop) |
| fx:gl:stats { n, gpuMs|null, dpr, tier } at 1 Hz | flowStore.n / gpuMs / dpr, written at the same cadence; readouts read on the ticker |
| fx:gl:linked | flowStore.linked = true |
| fx:intro:handoff, fx:ready | useUI.loaded (existing) + a handoff timestamp for --hd |
| fx:nav:covered / uncovered / reset, fx:lock "menu" | engine.pause()/resume() called from CoverOverlay/RouteTransition and the menu |
| FX.flags.motion / fine / touch / desktop / gl | useUI.reducedMotion + matchMedia; "WebGL2RenderingContext" in window and a gl=0 search param -> html.gl-off equivalent |
| FX.fonts(ms) | document.fonts.load of the V1 faces raced with a cap |
| FX.lenis.on("scroll") velocity | window.__lenis (Smooth.tsx) .on("scroll", e => engine.scrollVelocity(e.velocity)) |

---

## 5. Performance facts (measured or asserted in code and comments)

- PoC measurement (EFFECTS-PLAN §measure and fx-gl.js header): GPU median 0.8 to 1.1 ms/frame at 1440x900, tier A, 16,384 particles, trail buffer 2160x1350 (1.5x), JS 0.1 to 0.2 ms; phone-sized plate 0.24 to 0.35 ms; on Adreno X1-85 via ANGLE D3D11 (line width range 1..1, so hairlines are always 1 px). Page rAF while scrolling: p50 16.7, p95 16.9, max 25 ms.
- Budgets asserted in the plan: flow GPU <= 2 ms median tier A, <= 1 ms phone plate; main-thread JS <= 4 ms p95 while scrolling; no long task > 50 ms after fx:ready; GPU memory trails 2 x RG8 <= 3.2 MP, particles about 0.5 MB.
- Code constants: MAXPIX 3.2e6 per buffer; DPR cap 1.5 (further capped by sqrt(3.2e6/area)); trail x1.5 CSS px (x1 in tier C); particles 16,384 / 8,192 / 4,096; dt clamp 0.001..0.033 s; warm-up 10 steps per ticker frame, queue cap 220; PLATE_STEPS 90 for the preloader; warm(60) at link, warm(40) at hero mount, warm(60) at band mount, warm(30) on resize/recolor/variant, warm(180) under reduced motion; tier downgrade when the GPU median over the first 90 frames (>30 samples) exceeds 5 ms; obstacle raster "about 5 ms" (plan §S2 Textures) on a 512x512 canvas + 128x128 flood fill; stats at 1 Hz; timer query keeps 240 samples.
- MQ-01 outcome (review-fix.json): after the fixes the first-frame long tasks dropped from 474 + 461 ms to "one long task of about 100 to 180 ms at about 90 ms (script evaluation and boot) and one of about 70 to 150 ms around 300 ms" — the "no long task over 50 ms before handoff" target is not fully met in the prototype.
- MQ-05 outcome: host switches used to cost 66-67 ms tasks (3 dropped frames) on desktop and 67/82 ms on mobile; the chunked warm + idle band mount fixed the cause, but "the full scroll sweep of long tasks was not re-measured".
- fx-hero.css line 71 (r4): the instrument row is reserved at min-height 2.8em from first paint because its late arrival moved the page by 49 px on a phone.
- WebGPU alternative: 120,000 / 60,000 particles, DPR cap 1.5 / 1.0, frameMs published every 500 ms, SETTLE_MS 4200 ms before "live", resize rebuild debounced 200 ms, MOUSE_RADIUS 7, bench box 760x540 / 350x230; the captured still shows Particles 74,403 at Frame 16.7 ms DPR 1.5 (so on the capture machine the WebGPU bench ran at vsync with fewer particles than the desktop budget, i.e. the count shown by the readout is sim.numParticles after the fountain seed, not the 120,000 target).

---

## Appendix · other facts a port planner needs

- Script order in the prototype (head.html): gsap 3.15.0, ScrollTrigger, SplitText, Flip, CustomEase, lenis 1.3.26 (with lenis.css), then fx-core, fx-gl, fx-hero, fx-scroll, fx-nav, all defer. Init order gl, hero, scroll, nav; build in the same order; ST.config({ ignoreMobileResize: true }); Lenis { lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, anchors: false, autoRaf: false } on gsap.ticker with lagSmoothing(0). Smooth.tsx already matches (lerp 0.1, ticker, lagSmoothing 0) but does not pass anchors:false / autoRaf:false.
- Head boot (parts/head.html) writes before first paint: html[data-variant], classes rv-js and rv-motion, fx-nochrome unless ?chrome=1, gl-off for ?gl=0, data-arrive + --pt-* from sessionStorage rv-pt, data-preloader + rv-pre-run + __rvT0, font preloads, --hd. The port needs an equivalent inline script in layout (like Preloader's SKIP_SCRIPT) for: no-JS/GL-off classes, preloader-seen, --hd.
- CSS films that must survive the port (fx-hero.css §4, fx-core.css): html.rv-motion .lockup .ch { animation: rv-rise 1.25s var(--ease-out) calc(var(--hd) + var(--i) * 0.045s) both }; [data-hero-reveal] rv-fade-up 0.9s at --hd + 0.5s + --d; .ornament rv-orn 1.4s at --hd + 0.55s; .hr-frame.hr-curtain rv-media 1.5s at --hd + 0.35s; the [data-hero-now] variants (instant replay after a route return). GSAP tweens on these elements must first set animation: none (the films fill both ways and outrank inline styles).
- Focus/a11y: canvas aria-hidden; lockup chars aria-hidden with an sr-only name; hero controls get tabindex -1 when faded (never inert on the h1 block); the preloader root is aria-hidden and clickable to skip; keys Space/Enter/Escape skip.
- Files under public/proto/rivista/ are prototype-only and should not ship: assemble.mjs, r2/, dev-gl.html, the three posters (keep only v1, moved and provenance-stamped).


## KEY FACTS
- fx-gl.js is raw WebGL2, one context per page, four programs: transform-feedback update (RK2, stream function psi with two gradient-noise octaves 0.115@1.35 and 0.05@3.1, drift 0.105), instanced GL_LINES into an RG8 ping-pong trail (R ink, G accent 10% share gain 2.2, line gain 0.5), time-based fade (0.965^(60dt) minus 1.2/255*60dt), composite from CSS tokens --paper/--paper-deep/--ink/--accent with +-1/255 grain.
- Particle tiers: A 16,384 (desktop), B 8,192 (pointer coarse or width < 768), C 4,096 with trail x1 (deviceMemory <= 4); one-way downgrade after 90 frames if GPU median > 5 ms. MAXPIX 3.2e6 per buffer; DPR cap min(1.5, sqrt(3.2e6/area)); trail buffer = CSS px x 1.5 (not DPR).
- Obstacle texture 512x512 RGBA8: R = glyph blurred 7 px (flow ramp = 1 - smoothstep(0.03,0.55,R)), G = sharp coverage (emboss fill smoothstep(0.35,0.65)), B = ink-free interior from a 128-grid flood fill with 5-cell dilation, blurred 3 px. Glyph font string for V1: 600 430px "Cormorant Garamond" (from --w-hero and the first family of --f-display). Kill at ramp < 0.18 or interior > 0.4; 30% of respawns in a ring of radius 0.50..0.64 x obstacle scale.
- Public engine API (FX.gl): mount(el,{mode:"float"|"dock",ground:"deep"|"paper"}), setZ, window(rect|null), setObstacle({type:"glyph",char,font}|{type:"rects",els,pad}), params {drift,glyphX,glyphY,glyphScale}, clip {t,r,b,l,on} (px insets -> canvas.style.clipPath inset()), warm(n) (chunked 10 steps/frame, cap 220), wake(), sleep(hide), recolor(), scrollVelocity(v), resize(), getters state/linked/warmLeft/host/tier/stats. Events fx:gl:state {state:"off"|"sleep"|"run",tier,host}, fx:gl:stats {n,gpuMs|null,dpr,tier} at 1 Hz, fx:gl:linked. No dispose() exists: the port must add one.
- Float mode = canvas position:fixed inset 0 on body at z-index var(--z-gl)=1 (var(--z-pre-gl)=96 under the preloader), pointer-events none, sized to the viewport; dock mode = position:absolute inset 0 appended into the host, no clip. S3 never resizes the canvas: the clip-path window grows over the same full-viewport simulation, so the trail is never reset.
- Context creation is deferred two rAFs after init; programs link in parallel via KHR_parallel_shader_compile polled on the gsap ticker; the canvas starts visibility:hidden and shows after its first drawn frame; while state is sleep or off the loop makes zero GL calls; pause/resume on fx:nav:covered/uncovered/reset and fx:lock reason "menu"; visibilitychange sleeps and wakes.
- Hero DOM: section.hero.hr-stage > .hr-screen > .hr-type (p.lockup with .lk-line.l1/.l2 > .lk-word > .ch x13 with --i, span.hr-orn, .hr-fade.hr-said > p.label + h1#hero-h1.d3) and .hr-side (figure.hr-plate > .frame.hr-frame[data-hero-media][data-gl-slot="hero"] > .gl-host[data-gl-host="hero"] > img.hr-poster.v1/2/3; figcaption.hr-fade.hr-cap[data-fade-end="early"] > .label + .hr-instr[data-gl-instr] + .hr-still; .hr-fade.hr-act > .hero-cta > a.btn + .ghosts > a.ghost x2).
- S3 stage runs only for (min-width: 1024px) AND motion AND WebGL2 AND JS: .hr-stage[data-on] is 300svh, .hr-screen sticky 100svh, --hero-cover:100svh written on html, the next section (.sc-sheet) rises with margin-top calc(-1*var(--hero-cover)) at --z-sheet with a 1px --line hairline. ScrollTrigger: trigger .hr-stage, start "top top", end "+=innerHeight", scrub 0.5, invalidateOnRefresh; a second trigger to +=2 viewports sleeps the plate onLeave and wakes it onEnterBack without re-warm.
- applyStage(p) segments: word1 translate(-6%,-118%) over 0..0.40; word2 lifts -30% over 0..0.35 then translate(6%,-88% extra) over 0.35..0.60; ornament opacity over 0..0.15; .hr-fade opacity/translateY(-24px) over 0..0.30 (0..0.09 for data-fade-end="early"), controls get tabindex=-1 past 0.98; clip t/b/r open over 0.05..0.50, clip l sweeps over 0.08..0.62; glyph travels from the slot centre to (aspect/2, 0.5), scale 0.46 -> 0.95, drift 0.105 -> 0.168 over 0.08..0.80.
- Preloader S1: shown only when data-home, no reduced motion, no arrival record, no hash, no sessionStorage rv-intro-seen; real progress = fonts + shaders (engine linked) + plate (1 - warmLeft/90) + dom, eased with 1-exp(-9dt) and capped by elapsed/1000*100; done at >= 99.9 or 2600 ms; digits roll in fixed 1.12em cells; meta prints Fonts/Shaders/Plate/Ready; the GL window opens from a horizontal slit (0.9 s expo.out) one rAF after the first fx:gl:state run (1600 ms guard), from openRect = {top 14vh, left 23vw, width 54vw, height to the counter block} with glyphScale 0.46.
- intro() timeline: digits out (0.5 s domus.inOut stagger 0.04), rule scaleX 0 (0.45 s), meta fade (0.3 s), clip and params travel to the slot (1.1 s expo.inOut), sheet clipPath inset(0 0 100% 0) at 0.15 (1.0 s domus.inOut), handoff at 0.45 (remove data-preloader/rv-pre-run, add hr-pre-out for 2 s, rewrite --hd to elapsed, setZ(--z-gl), emit fx:intro:handoff), dock slitOpen at 0.75, finish at 1.25 float / 0.95 dock with pre.remove() and FX.ready("intro"). Skip with pointerdown or Space/Enter/Escape -> timeScale(3). CustomEases: domus M0,0 C0.22,0.9 0.36,1 1,1; domus.inOut M0,0 C0.66,0 0.22,1 1,1.
- Instrument row format: n.toLocaleString("en-US") + " particles" · "WebGL2" · gpuMs.toFixed(1) + " ms GPU" (omitted when null) · "DPR " + dpr, joined by " · " with no-break spaces inside tokens, CSS uppercase, min-height 2.8em reserved from first paint (a late arrival shifted the page 49 px on a phone).
- Below 1024 or with reduced motion or without WebGL2: stage off, plate docked in a 4:5 full-bleed frame under the CTA, glyphScale min(0.88, aspect*0.86); reduced motion runs warm(180) then sleep(false) = a still engraving with instruments reported; the poster img (fx-plate-v1.webp 892x940, 230 KB, alt text) shows under html.gl-off / fx-off-gl / fx-fail-gl / no JS together with the caption line "Still frame captured from this engine."
- Closing band: section#contact.band (16:9, min-height 70svh; phones aspect auto 78svh) with .gl-host[data-gl-host="band"] as first child (background --paper, z 0) and .band-copy[data-band-copy] absolute bottom 12vh z 2; engine mounted dock, ground "paper", obstacle rects = padded (0.4em, 0.6 vertical) line boxes of h2 "Write to me.", the email link and the eyebrow, read via Range.getClientRects per .sc-line with the entrance transform undone; mounted a viewport early (rootMargin 100% 0px) in requestIdleCallback; scroll velocity boosts drift by 1 + min(1.5, 0.08*|v|). Deferred defect A13: an eddy trapped between headline and email on phones.
- Hero copy (verbatim EN): sr-only "Alberto Tuveri"; ornament "engineer"; role "Software & AI Engineer · Creative Lead"; h1 "From database schema to real-time WebGPU rendering and motion design."; caption "Fig. 01 · Flow field, rendered live"; "Still frame captured from this engine."; CTAs "Write to me" (mailto:albertotuveri@gmail.com), "Selected work" (#work), "About" (#path); preloader "Loading · Fonts|Shaders|Plate|Ready"; poster alt "A flow field of fine cobalt and ink hairlines streaming left to right, parting around a large letter A left blank in the paper." All must move to dict.ts EN/IT.
- V1 tokens the engine reads: --paper #f6f3ec, --paper-deep #ede7dc, --ink #24211e, --accent #2340c9 (plus --graphite #48443e, --stone #6b665d, --line #dcd5c8, --accent-dark #1a2f99); fonts Cormorant Garamond (display, --w-hero 600) + Figtree (text); easings --ease-out cubic-bezier(0.16,1,0.3,1), --ease-io (0.66,0,0.22,1), --ease-soft (0.22,0.9,0.36,1), --ease-xio (0.87,0,0.13,1); z scale --z-gl 1, --z-hero 2, --z-sheet 3, --z-header 60, --z-pre 95, --z-pre-gl 96, --z-pre-hdr 97.
- Measured PoC performance: GPU median 0.8 to 1.1 ms at 1440x900 tier A with a 2160x1350 trail, JS 0.1 to 0.2 ms, phone plate 0.24 to 0.35 ms (Adreno X1-85, ANGLE D3D11, line width 1..1); budgets: <= 2 ms GPU tier A, <= 1 ms phone, <= 4 ms JS p95 while scrolling, no long task > 50 ms after ready. Residual after MQ-01 fix: long tasks of 100-180 ms at ~90 ms and 70-150 ms at ~300 ms at boot; MQ-05 scroll sweep not re-measured.
- Existing WebGPU engine (src/webgl/waterball/WaterBallHero.tsx): a prop-less client component that fills its position:relative parent (div[data-bench-canvas].absolute.inset-0, transparent premultiplied canvas), sizes via ResizeObserver at box x min(DPR, 1.5 desktop / 1.0 mobile), tiers 120,000 / 60,000 particles by benchTier() (max-width 767px or hardwareConcurrency <= 4), frames a 4:3 sim box [80,60,18] with Camera.fitDistance * 1.2, loads /cubemap/*.png, runs its own rAF (not the gsap ticker), gates compute on an IntersectionObserver, rebuilds targets on resize keeping the particles, disposes device on unmount and resetBench().
- heroStore (zustand 5) states: compiling -> warming (first GPU frame done, onSubmittedWorkDone) -> live after SETTLE_MS 4200 ms of rendered time; still (reason nogpu | reduced, set by CanvasHost gate or engine) ; lost (device.lost, rAF cancelled, last frame stays). Values frameMs (500 ms moving average of CPU frame deltas, no GPU timer), particles = sim.numParticles, dpr applied, tier. CanvasHost only mounts on BENCH_ROUTES = {"/"}.
- WebGPU still fallback: public/bench/tank-still-1520.webp (1520x1079, 30 KB) + tank-still-700.webp, captured 2026-09-16 from the live bench (Particles 74,403 · Frame 16.7 ms · DPR 1.5), provenance in EXIF and PROVENANCE.md; TestBench holds it while covered and cross-fades out over 320 ms at live, prints STILL + a reason line in degraded states. The prototype's posters carry no embedded provenance.
- G4: src/webgl/waterball/mls-mpm/** and common.ts are frozen; the letter-A confinement lives in g2p.wgsl.ts and the rectangular tank (Phase B) needs Alberto's unlock; a ?hero=gpu variant can only retune render-side (fluid.wgsl colours, cubemap, camera framing, FRAME_MARGIN, ticker) and cannot do the S3 glyph travel (only camera tweens).
- Port skeleton: a framework-free flowEngine.ts (fx-gl minus the FX bus) + a single FlowPlate client component in the root layout that creates the canvas imperatively after two rAFs, runs on the shared gsap.ticker from src/lib/gsap.ts, writes a zustand flowStore (state/tier/n/gpuMs/dpr/linked/warmLeft) with no per-frame React re-render, exposes a singleton via useFlowPlate(); hero and band register hosts by ref and arbitrate with IntersectionObservers (hero wins, band in requestIdleCallback); CoverOverlay/RouteTransition and the menu call pause/resume; dispose() must be idempotent for StrictMode.
- next/font gives a hashed family name: the glyph rasteriser must receive the font string explicitly (setObstacle({font})) and await document.fonts.load('600 430px "<family>"') before the first buildObstacle, or the A is drawn in the fallback face.
- The EN/IT toggle changes the band sentence, so setObstacle({type:"rects"}) must re-run after the new lines are laid out (the prototype does this on onVariant one rAF later); the hero A does not depend on locale.

## OPEN QUESTIONS
- No measured numbers exist for the prototype's S3 scrub or the band composition on the phone (390x844 DPR 2) beyond the PoC 0.24-0.35 ms plate: the MQ-05 scroll sweep was never re-measured after the fix, so the 'no long task > 50 ms' claim is unverified.
- The plan's caption sentence 'A WebGL2 stand-in for the WebGPU MLS-MPM fluid that runs on the real site.' is not in b-hero.html; whether it is intended copy for the port is not decided in the files.
- Whether the port keeps the WebGL2 flow plate as the production hero and the MLS-MPM engine only behind ?hero=gpu, or runs the MLS-MPM engine as the hero and the flow plate only for the band (two contexts), violates or satisfies the 'one heavy renderer' rule differently; the files do not decide.
- The prototype posters (fx-plate-v1/2/3.webp) carry no embedded provenance; a re-capture from the engine with the embed-prompt gate would be needed, and whether to capture at the slot aspect (446x470) or the 4:5 phone plate is not settled.
- How the intro should map the WebGPU states under ?hero=gpu (compiling/warming/live with a 4.2 s settle vs the counter's 2.6 s cap) is not specified anywhere; presenting at 'warming' with the still cross-fade is my inference, not a documented decision.
- A13 (eddy trapped between the band headline and the email on phones) is deferred in the prototype and has no agreed fix.
- fx-gl has no dispose(); the port needs one and its interaction with Next route transitions (float canvas on body surviving the App Router swap, template.tsx re-mounts) is untested.
- Whether the ?gl=0 / gl-off and ?nopre switches should survive in production URLs (they were prototype capture switches) is not stated.
