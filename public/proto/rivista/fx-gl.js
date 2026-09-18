/* ==========================================================================
   fx-gl.js · owner WP-B "Carta corrente"
   The only WebGL2 context of the page. S2 "Carta corrente": a divergence-free
   flow field drawn in ink hairlines on a paper plate, parting around a blind
   emboss of the variant's display "A" (hero) or around the line boxes of the
   closing sentence (band).

   Ported from the measured proof of concept in dev-gl.html (0.8 to 1.1 ms GPU
   median at 1440x900, tier A, on this machine), with the production tightening
   the plan lists: glyph blur 7 px, kill at ramp < 0.18, 30% of respawns in a
   ring just outside the halo, trail buffer x1.5 with line gain 0.5.

   API (plan §9). FX.gl is assigned inside init(); callers feature-detect.
     mount(el, { mode:"float"|"dock", ground:"deep"|"paper" })
     window(rect | null)                  · clip-path window of the float canvas
     setObstacle({type:"glyph",char,font} | {type:"rects",els,pad})
     params { drift, glyphX, glyphY, glyphScale }   · plain tweenable object
     clip   { t, r, b, l, on }                      · plain tweenable px insets
     warm(n) · wake() · sleep(hide) · recolor() · stats · state · host
   Events: fx:gl:state {state,tier,host} · fx:gl:stats {n,gpuMs|null,dpr} at 1 Hz.
   ========================================================================== */
(() => {
  "use strict";
  if (!window.FX) return;
  const FX = window.FX;
  const D = document.documentElement;

  const GS = 512;                       // obstacle texture, square
  const TIER_N = { A: 16384, B: 8192, C: 4096 };
  const TIER_TRAIL = { A: 1.5, B: 1.5, C: 1 };
  const NEXT_TIER = { A: "B", B: "C", C: "C" };
  const MAXPIX = 3.2e6;                 // hard cap per buffer
  const BASE_DRIFT = 0.105;

  /* ------------------------------------------------------------- shaders */
  const NOISE = `
vec2 hash2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return -1.0 + 2.0 * fract(sin(p) * 43758.5453123); }
float gnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(mix(dot(hash2(i), f), dot(hash2(i + vec2(1,0)), f - vec2(1,0)), u.x),
             mix(dot(hash2(i + vec2(0,1)), f - vec2(0,1)), dot(hash2(i + vec2(1,1)), f - vec2(1,1)), u.x), u.y); }
`;
  /* obstacle lookup, shared by the three programs. uObsScale is a vec2 so the
     glyph keeps its own aspect while the band's rect field covers the whole sim. */
  const OBS = `
uniform vec2 uObsPos, uObsScale; uniform sampler2D uGlyph;
vec2 obsUv(vec2 p){ return (p - uObsPos) / uObsScale + 0.5; }
float ramp(vec2 p){ vec2 q = obsUv(p); if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return 1.0;
  return 1.0 - smoothstep(0.03, 0.55, texture(uGlyph, q).r); }
float interior(vec2 p){ vec2 q = obsUv(p); if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return 0.0; return texture(uGlyph, q).b; }
`;
  const UPDATE_VS = `#version 300 es
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
  vec2 pm = p + v * uDt * 0.5; v = vel(pm);   // RK2 midpoint keeps streamlines smooth round the obstacle
  p += v * uDt;
  float age = aAge + uDt;
  float life = 2.2 + 3.8 * h1(aSeed * 91.7);
  if (length(v) < 0.035) age += uDt * 6.0;   // stagnant ink dries fast: no dark pile-ups
  bool dead = age > life || p.x < -0.02 || p.x > uAspect + 0.02 || p.y < -0.02 || p.y > 1.02 || ramp(p) < 0.18 || interior(p) > 0.4;
  if (dead) {
    float k = aSeed * 13.13 + uTime;
    if (h1(k * 5.7 + 2.9) < 0.30) {          // 30% respawn in a ring just outside the halo: fills the downstream wake
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
}`;
  const UPDATE_FS = `#version 300 es
precision lowp float; out vec4 o; void main(){ o = vec4(0.0); }`;
  const LINE_VS = `#version 300 es
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
}`;
  const LINE_FS = `#version 300 es
precision mediump float; in vec2 vCh; out vec4 o; uniform float uGain; void main(){ o = vec4(vCh * uGain, 0.0, 1.0); }`;
  const QUAD_VS = `#version 300 es
in vec2 aP; out vec2 vUv; void main(){ vUv = aP * 0.5 + 0.5; gl_Position = vec4(aP, 0.0, 1.0); }`;
  const FADE_FS = `#version 300 es
precision mediump float; in vec2 vUv; out vec4 o; uniform sampler2D uT; uniform float uDecay, uSub;
void main(){ vec2 t = texture(uT, vUv).rg; t = max(t * uDecay - uSub, 0.0); o = vec4(t, 0.0, 1.0); }`;
  const COMP_FS = `#version 300 es
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
  c += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * (2.0 / 255.0);
  o = vec4(c, 1.0); }`;

  /* --------------------------------------------------------------- state */
  let gl = null, canvas = null, tq = null, ok = false, lost = false;
  /* FIX MQ-01/MQ-05: programs link in parallel (KHR_parallel_shader_compile, polled on the
     ticker) and warm-up runs in chunks of 10 steps per frame, so no GL call ever blocks the
     main thread for long. Calls made while the link is pending are queued, not refused. */
  let zWant = "", pext = null, pending = false, wantRun = false, warmQ = 0, drawn = false, wantVis = true;
  const vis = () => { if (canvas) canvas.style.visibility = (wantVis && drawn && !lost) ? "" : "hidden"; };
  let pUpd, pLine, pFade, pComp, quadVao, updVao, lineVao, pbuf, gtex, trail;
  let W = 0, H = 0, TW = 0, TH = 0, ASPECT = 1, dpr = 1, cssW = 0, cssH = 0;
  let tier = "A", N = TIER_N.A, trailScale = TIER_TRAIL.A;
  let host = null, hostName = "", mode = "float", ground = "deep";
  let state = "off", cur = 0, simTime = 0;
  let obstacle = { type: "glyph", char: "A" };
  let colors = null, scrollBoost = 0, lastClip = "";
  const mouse = { x: 0, y: 0, vx: 0, vy: 0, s: 0, lx: 0, ly: 0, has: false };
  const params = { drift: BASE_DRIFT, glyphX: 0.5, glyphY: 0.5, glyphScale: 0.92 };
  const clip = { t: 0, r: 0, b: 0, l: 0, on: false };
  const gpuSamples = []; let query = null, frames = 0, gpuMs = null, statAt = 0, downgraded = false;

  const U = (p, n) => gl.getUniformLocation(p, n);
  const css = (n) => getComputedStyle(D).getPropertyValue(n).trim();
  function rgb(h) {
    h = (h || "").trim();
    if (h[0] !== "#") return [0, 0, 0];
    if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  }
  function readColors() {
    colors = { paper: rgb(css("--paper")), deep: rgb(css("--paper-deep")), ink: rgb(css("--ink")), accent: rgb(css("--accent")) };
  }
  const setState = (s) => { if (s === state) return; state = s; FX.emit("fx:gl:state", { state: s, tier, host: hostName }); };

  /* --------------------------------------------------------- obstacle map
     R = coverage blurred 7 px (the flow ramp) · G = sharp coverage (blind
     emboss fill) · B = ink-free interior (the counter and the gap between the
     legs), found by flooding from the border on a 128 grid with the shape
     dilated 5 cells. Without B the counters fill with fingerprint eddies. */
  function makeCanvas() { const c = document.createElement("canvas"); c.width = c.height = GS; return c; }
  function paintGlyph(ctx2, blur, char, font) {
    ctx2.fillStyle = "#000"; ctx2.fillRect(0, 0, GS, GS);
    ctx2.filter = blur ? "blur(" + blur + "px)" : "none";
    ctx2.fillStyle = "#fff"; ctx2.textAlign = "center"; ctx2.textBaseline = "alphabetic"; ctx2.font = font;
    const m = ctx2.measureText(char);
    const gh = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    ctx2.fillText(char, GS / 2, GS / 2 + gh / 2 - m.actualBoundingBoxDescent);
    ctx2.filter = "none";
  }
  function paintRects(ctx2, blur, boxes) {
    ctx2.fillStyle = "#000"; ctx2.fillRect(0, 0, GS, GS);
    ctx2.filter = blur ? "blur(" + blur + "px)" : "none";
    ctx2.fillStyle = "#fff";
    boxes.forEach((b) => ctx2.fillRect(b.x, b.y, b.w, b.h));
    ctx2.filter = "none";
  }
  function interiorChannel(sharpData) {
    const LS = 128, K = GS / LS, DIL = 5;
    const glyphLo = new Uint8Array(LS * LS), solid = new Uint8Array(LS * LS);
    for (let y = 0; y < LS; y++) for (let x = 0; x < LS; x++) {
      glyphLo[y * LS + x] = sharpData[(((y * K + K / 2) | 0) * GS + (((x * K + K / 2) | 0))) * 4] > 127 ? 1 : 0;
    }
    for (let y = 0; y < LS; y++) for (let x = 0; x < LS; x++) {
      let hit = 0;
      for (let j = -DIL; j <= DIL && !hit; j++) for (let i = -DIL; i <= DIL; i++) {
        if (i * i + j * j > DIL * DIL) continue;
        const xx = x + i, yy = y + j;
        if (xx < 0 || yy < 0 || xx >= LS || yy >= LS) continue;
        if (glyphLo[yy * LS + xx]) { hit = 1; break; }
      }
      solid[y * LS + x] = hit;
    }
    const reach = new Uint8Array(LS * LS), stack = [];
    for (let i = 0; i < LS; i++) stack.push(i, (LS - 1) * LS + i, i * LS, i * LS + LS - 1);
    while (stack.length) {
      const k = stack.pop();
      if (reach[k] || solid[k]) continue;
      reach[k] = 1;
      const x = k % LS, y = (k / LS) | 0;
      if (x > 0) stack.push(k - 1); if (x < LS - 1) stack.push(k + 1);
      if (y > 0) stack.push(k - LS); if (y < LS - 1) stack.push(k + LS);
    }
    const lo = document.createElement("canvas"); lo.width = lo.height = LS;
    const g2 = lo.getContext("2d", { willReadFrequently: true });
    const im = g2.createImageData(LS, LS);
    for (let k = 0; k < LS * LS; k++) { const v = reach[k] ? 0 : 255; im.data[k * 4] = im.data[k * 4 + 1] = im.data[k * 4 + 2] = v; im.data[k * 4 + 3] = 255; }
    g2.putImageData(im, 0, 0);
    const big = makeCanvas(), gb = big.getContext("2d", { willReadFrequently: true });
    gb.filter = "blur(3px)"; gb.imageSmoothingEnabled = true; gb.drawImage(lo, 0, 0, GS, GS); gb.filter = "none";
    return gb.getImageData(0, 0, GS, GS).data;
  }
  /* Obstacle position and scale in sim units (x in 0..aspect, y in 0..1, y up). */
  function obsBox() {
    if (obstacle.type === "rects") return { x: ASPECT / 2, y: 0.5, sx: ASPECT, sy: 1 };
    return { x: params.glyphX, y: params.glyphY, sx: params.glyphScale, sy: params.glyphScale };
  }
  function buildObstacle() {
    if (!ok) return;
    const blurCanvas = makeCanvas(), sharpCanvas = makeCanvas();
    const gB = blurCanvas.getContext("2d", { willReadFrequently: true });
    const gS = sharpCanvas.getContext("2d", { willReadFrequently: true });
    let interiorData = null;
    if (obstacle.type === "rects") {
      const boxes = rectBoxes();
      paintRects(gB, 12, boxes); paintRects(gS, 0, boxes);
    } else {
      const font = obstacle.font || glyphFont();
      paintGlyph(gB, 7, obstacle.char || "A", font);   // production tightening: blur 7 px
      paintGlyph(gS, 0, obstacle.char || "A", font);
    }
    const dB = gB.getImageData(0, 0, GS, GS).data;
    const dS = gS.getImageData(0, 0, GS, GS).data;
    interiorData = obstacle.type === "rects" ? null : interiorChannel(dS);
    const packed = new Uint8Array(GS * GS * 4);
    for (let k = 0; k < GS * GS; k++) {
      packed[k * 4] = dB[k * 4];
      packed[k * 4 + 1] = dS[k * 4];
      packed[k * 4 + 2] = interiorData ? interiorData[k * 4] : 0;
      packed[k * 4 + 3] = 255;
    }
    const flipped = new Uint8Array(GS * GS * 4);           // texture v goes up
    for (let y = 0; y < GS; y++) flipped.set(packed.subarray(y * GS * 4, (y + 1) * GS * 4), (GS - 1 - y) * GS * 4);
    gl.bindTexture(gl.TEXTURE_2D, gtex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, GS, GS, 0, gl.RGBA, gl.UNSIGNED_BYTE, flipped);
  }
  function glyphFont() {
    const fam = (css("--f-display") || "serif").split(",")[0].trim();
    const w = css("--w-hero") || "600";
    return w + ' 430px ' + (fam.startsWith('"') ? fam : '"' + fam.replace(/^['"]|['"]$/g, "") + '"');
  }
  /* line boxes of the closing sentence and the email, padded, in texture px */
  function rectBoxes() {
    const out = [];
    if (!host) return out;
    const hb = host.getBoundingClientRect();
    if (!hb.width || !hb.height) return out;
    (obstacle.els || []).forEach((el) => {
      if (!el || !el.isConnected) return;
      const pad = (obstacle.pad || 0.4) * parseFloat(getComputedStyle(el).fontSize || "16");
      /* A line that is still below (or already above) its mask reports a moved
         rect. The mask itself never moves, so its offset to the line is exactly
         the transform to take back out: the obstacle is always the printed
         position of the sentence, whatever the entrance is doing. */
      let rects = [];
      const range = (node, dx, dy) => {
        try {
          const r = document.createRange(); r.selectNodeContents(node);
          for (const c of r.getClientRects()) rects.push({ left: c.left + dx, right: c.right + dx, top: c.top + dy, bottom: c.bottom + dy, width: c.width, height: c.height });
        } catch (e) {}
      };
      const lines = el.querySelectorAll ? el.querySelectorAll(".sc-line") : [];
      if (lines.length) {
        lines.forEach((ln) => {
          const m = ln.parentElement, a = ln.getBoundingClientRect(), b = m ? m.getBoundingClientRect() : a;
          range(ln, b.left - a.left, b.top - a.top);
        });
      } else range(el, 0, 0);
      if (!rects.length) rects = [el.getBoundingClientRect()];
      rects.forEach((r) => {
        if (!r.width || !r.height) return;
        const x0 = (r.left - hb.left - pad) / hb.width, x1 = (r.right - hb.left + pad) / hb.width;
        const y0 = (r.top - hb.top - pad * 0.6) / hb.height, y1 = (r.bottom - hb.top + pad * 0.6) / hb.height;
        // sim x spans 0..ASPECT and maps linearly to 0..GS; y is flipped on upload, so canvas y = css y
        out.push({ x: x0 * GS, y: y0 * GS, w: (x1 - x0) * GS, h: (y1 - y0) * GS });
      });
    });
    return out;
  }

  /* ------------------------------------------------------------ programs */
  function compile(vs, fs, tf) {
    const p = gl.createProgram();
    for (const [t, s] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
      const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || "shader compile failed");
      gl.attachShader(p, sh); gl.deleteShader(sh);
    }
    if (tf) gl.transformFeedbackVaryings(p, tf, gl.INTERLEAVED_ATTRIBS);
    gl.linkProgram(p);
    return p;   // the status is read in finishLink(), once the driver says the link is complete
  }
  function checkLink(p) {
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "program link failed");
  }
  const linkDone = () => !pext || [pUpd, pLine, pFade, pComp].every((p) => gl.getProgramParameter(p, pext.COMPLETION_STATUS_KHR));
  function pickTier() {
    let t = "A";
    if (FX.flags.touch || window.innerWidth < 768) t = "B";
    const mem = navigator.deviceMemory;
    if (typeof mem === "number" && mem <= 4) t = "C";
    return t;
  }
  function allocParticles() {
    const init = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) { init[i * 4] = Math.random(); init[i * 4 + 1] = Math.random(); init[i * 4 + 2] = Math.random() * 5; init[i * 4 + 3] = Math.random(); }
    if (pbuf) pbuf.forEach((b) => gl.deleteBuffer(b));
    pbuf = [gl.createBuffer(), gl.createBuffer()];
    pbuf.forEach((b) => { gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, init, gl.DYNAMIC_COPY); });
    const STRIDE = 16;
    if (updVao) updVao.forEach((v) => gl.deleteVertexArray(v));
    if (lineVao) lineVao.forEach((v) => gl.deleteVertexArray(v));
    updVao = pbuf.map((b) => {
      const v = gl.createVertexArray(); gl.bindVertexArray(v); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      [["aPos", 2, 0], ["aAge", 1, 8], ["aSeed", 1, 12]].forEach(([n, s, o]) => {
        const l = gl.getAttribLocation(pUpd, n); if (l < 0) return;
        gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, s, gl.FLOAT, false, STRIDE, o);
      });
      return v;
    });
    lineVao = [0, 1].map((i) => {
      const v = gl.createVertexArray(); gl.bindVertexArray(v);
      const bind = (b, list) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        list.forEach(([n, s, o]) => {
          const l = gl.getAttribLocation(pLine, n); if (l < 0) return;
          gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, s, gl.FLOAT, false, STRIDE, o); gl.vertexAttribDivisor(l, 1);
        });
      };
      bind(pbuf[i], [["aPrev", 2, 0], ["aPrevAge", 1, 8]]);
      bind(pbuf[1 - i], [["aCurr", 2, 0], ["aCurrAge", 1, 8], ["aSeed", 1, 12]]);
      return v;
    });
    gl.bindVertexArray(null);
    // the generic ARRAY_BUFFER binding must not still hold a particle buffer, or
    // transform feedback writes into a buffer that is bound elsewhere (GL_INVALID_OPERATION)
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    cur = 0;
  }
  function allocTrails() {
    if (trail) trail.forEach((t) => { gl.deleteTexture(t.t); gl.deleteFramebuffer(t.f); });
    const mk = () => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, TW, TH, 0, gl.RG, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      return { t, f };
    };
    trail = [mk(), mk()];
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function boot() {
    canvas = document.createElement("canvas");
    canvas.className = "gl-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.visibility = "hidden";   // an undrawn opaque canvas is black: it shows after its first frame
    canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); lost = true; ok = false; drawn = false; setState("off"); vis(); }, false);
    canvas.addEventListener("webglcontextrestored", () => { lost = false; try { rebuild(); } catch (err) { fail(err); } }, false);
    gl = canvas.getContext("webgl2", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance", preserveDrawingBuffer: false });
    if (!gl) throw new Error("no WebGL2 context");
    tq = gl.getExtension("EXT_disjoint_timer_query_webgl2");
    pext = gl.getExtension("KHR_parallel_shader_compile");
    rebuild();
  }
  function rebuild() {
    pUpd = compile(UPDATE_VS, UPDATE_FS, ["vPos", "vAge", "vSeed"]);
    pLine = compile(LINE_VS, LINE_FS);
    pFade = compile(QUAD_VS, FADE_FS);
    pComp = compile(QUAD_VS, COMP_FS);
    pending = true;   // polled on the ticker (linkDone); without the extension the first tick links
  }
  function finishLink() {
    pending = false;
    try { [pUpd, pLine, pFade, pComp].forEach(checkLink); } catch (err) { fail(err); return; }
    quadVao = gl.createVertexArray(); gl.bindVertexArray(quadVao);
    const qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    for (const p of [pFade, pComp]) { const l = gl.getAttribLocation(p, "aP"); if (l >= 0) { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0); } }
    gl.bindVertexArray(null);
    gtex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, gtex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    tier = pickTier(); N = TIER_N[tier]; trailScale = TIER_TRAIL[tier];
    ok = true;
    allocParticles();
    readColors();
    if (host) { cssW = cssH = 0; place(); measure(); buildObstacle(); if (!warmQ) api.warm(60); }
    FX.emit("fx:gl:linked", {});
    if (wantRun) { wantRun = false; api.wake(); }
  }
  function fail(err) {
    ok = false; pending = false;
    console.warn("[fx] gl: the flow plate is off, the poster stays.", err && err.message ? err.message : err);
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    try { FX.flags.gl = false; } catch (e) {}
    setState("off");
  }

  /* -------------------------------------------------------------- layout */
  function measure() {
    if (!ok || !host) return false;
    let w, h;
    if (mode === "float") { w = window.innerWidth; h = window.innerHeight; }
    else { const r = host.getBoundingClientRect(); w = Math.round(r.width); h = Math.round(r.height); }
    if (w < 2 || h < 2) return false;
    if (w === cssW && h === cssH) return false;
    cssW = w; cssH = h;
    const area = w * h;
    const cap = Math.min(1.5, Math.sqrt(MAXPIX / Math.max(1, area)));
    dpr = Math.min(window.devicePixelRatio || 1, cap);
    W = Math.max(2, Math.round(w * dpr)); H = Math.max(2, Math.round(h * dpr));
    const tcap = Math.min(trailScale, Math.sqrt(MAXPIX / Math.max(1, area)));
    TW = Math.max(2, Math.round(w * tcap)); TH = Math.max(2, Math.round(h * tcap));
    ASPECT = W / H;
    canvas.width = W; canvas.height = H;
    allocTrails();
    return true;
  }
  function place() {
    if (!canvas) return;
    if (mode === "float") {
      canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;display:block;z-index:var(--z-gl);pointer-events:none";
      if (canvas.parentNode !== document.body) document.body.appendChild(canvas);
      if (zWant) canvas.style.zIndex = zWant;   // a z asked for before the context existed
      lastClip = ""; applyClip();
    } else {
      canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none";
      lastClip = ""; canvas.style.clipPath = "";
      if (host && canvas.parentNode !== host) host.appendChild(canvas);
    }
    vis();
  }

  /* ---------------------------------------------------------------- loop */
  function uniformsFor(p) {
    const b = obsBox();
    gl.uniform2f(U(p, "uObsPos"), b.x, b.y);
    gl.uniform2f(U(p, "uObsScale"), b.sx, b.sy);
  }
  function draw(dt) {
    // 1 particle update, transform feedback
    gl.useProgram(pUpd);
    gl.uniform1f(U(pUpd, "uTime"), simTime);
    gl.uniform1f(U(pUpd, "uDt"), dt);
    gl.uniform1f(U(pUpd, "uAspect"), ASPECT);
    gl.uniform1f(U(pUpd, "uDrift"), params.drift * (1 + Math.min(1.5, 0.08 * scrollBoost)));
    uniformsFor(pUpd);
    gl.uniform3f(U(pUpd, "uMouse"), mouse.x, mouse.y, mouse.s);
    gl.uniform2f(U(pUpd, "uMouseVel"), mouse.vx, mouse.vy);
    mouse.vx *= 0.9; mouse.vy *= 0.9; mouse.s *= 0.96;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, gtex); gl.uniform1i(U(pUpd, "uGlyph"), 0);
    gl.bindVertexArray(updVao[cur]);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, pbuf[1 - cur]);
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, N);
    gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    // 2 fade the trail, time based, with the 8-bit subtraction
    gl.bindFramebuffer(gl.FRAMEBUFFER, trail[1].f); gl.viewport(0, 0, TW, TH);
    gl.useProgram(pFade); gl.bindVertexArray(quadVao);
    gl.bindTexture(gl.TEXTURE_2D, trail[0].t); gl.uniform1i(U(pFade, "uT"), 0);
    gl.uniform1f(U(pFade, "uDecay"), Math.pow(0.965, 60 * dt));
    gl.uniform1f(U(pFade, "uSub"), (1.2 / 255) * 60 * dt);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // 3 instanced hairlines, additive, into the RG8 trail
    gl.useProgram(pLine);
    gl.uniform1f(U(pLine, "uGain"), 0.5);
    gl.uniform1f(U(pLine, "uAspect"), ASPECT);
    gl.uniform1f(U(pLine, "uAccentShare"), 0.10);
    gl.uniform1f(U(pLine, "uAccentGain"), 2.2);
    uniformsFor(pLine);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, gtex); gl.uniform1i(U(pLine, "uGlyph"), 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.bindVertexArray(lineVao[cur]);
    gl.drawArraysInstanced(gl.LINES, 0, 2, N);
    gl.disable(gl.BLEND);
    // 4 composite from the CSS tokens
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.useProgram(pComp); gl.bindVertexArray(quadVao);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, trail[1].t); gl.uniform1i(U(pComp, "uT"), 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, gtex); gl.uniform1i(U(pComp, "uGlyph"), 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform3fv(U(pComp, "uGround"), ground === "paper" ? colors.paper : colors.deep);
    gl.uniform3fv(U(pComp, "uPaper"), colors.paper);
    gl.uniform3fv(U(pComp, "uInk"), colors.ink);
    gl.uniform3fv(U(pComp, "uAccent"), colors.accent);
    gl.uniform1f(U(pComp, "uEmboss"), obstacle.type === "glyph" && ground === "deep" ? 1 : 0);
    gl.uniform1f(U(pComp, "uAspect"), ASPECT);
    gl.uniform1f(U(pComp, "uTime"), simTime);
    uniformsFor(pComp);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    trail.reverse(); cur = 1 - cur;
  }
  function step(dt) { simTime += dt; draw(dt); }

  function applyClip() {
    if (mode !== "float") return;
    const s = clip.on
      ? "inset(" + Math.max(0, clip.t).toFixed(1) + "px " + Math.max(0, clip.r).toFixed(1) + "px " + Math.max(0, clip.b).toFixed(1) + "px " + Math.max(0, clip.l).toFixed(1) + "px)"
      : "none";
    if (s !== lastClip) { lastClip = s; canvas.style.clipPath = s; }
  }
  function tick(time, deltaMs) {
    if (lost) return;
    if (pending) { if (!gl) return; applyClip(); if (linkDone()) finishLink(); return; }
    if (!ok) return;
    applyClip();                      // compositor only: cheap, and it must follow a scrub
    if (warmQ > 0 && host && W) {     // chunked warm-up: 10 steps a frame, never one long task
      const n = Math.min(10, warmQ);
      for (let i = 0; i < n; i++) step(1 / 60);
      warmQ -= n;
      if (!drawn) { drawn = true; vis(); }
      if (!warmQ) FX.emit("fx:gl:stats", { n: N, gpuMs, dpr: Math.round(dpr * 100) / 100, tier });
    }
    if (state !== "run") return;      // asleep or off: zero GL calls
    const dt = Math.min(0.033, Math.max(0.001, deltaMs / 1000));
    let began = false;
    if (tq && !query && !downgraded) { query = gl.createQuery(); gl.beginQuery(tq.TIME_ELAPSED_EXT, query); began = true; }
    step(dt);
    if (!drawn) { drawn = true; vis(); }
    if (began) gl.endQuery(tq.TIME_ELAPSED_EXT);
    if (query && !began) {
      if (gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) {
        if (!gl.getParameter(tq.GPU_DISJOINT_EXT)) {
          gpuMs = gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6;
          gpuSamples.push(gpuMs); if (gpuSamples.length > 240) gpuSamples.shift();
        }
        gl.deleteQuery(query); query = null;
      }
    }
    frames++;
    if (frames === 90 && !downgraded && gpuSamples.length > 30) {
      const m = [...gpuSamples].sort((a, b) => a - b)[gpuSamples.length >> 1];
      if (m > 5 && tier !== "C") {
        downgraded = true; tier = NEXT_TIER[tier]; N = TIER_N[tier]; trailScale = TIER_TRAIL[tier];
        allocParticles(); cssW = 0; measure();
        FX.emit("fx:gl:state", { state, tier, host: hostName });
      }
    }
    if (time - statAt > 1) { statAt = time; FX.emit("fx:gl:stats", { n: N, gpuMs, dpr: Math.round(dpr * 100) / 100, tier }); }
  }

  /* ------------------------------------------------------------- pointer */
  function onPointer(e) {
    if (!ok || state !== "run" || !FX.flags.fine) return;
    let x, y;
    if (mode === "float") { x = (e.clientX / window.innerWidth) * ASPECT; y = 1 - e.clientY / window.innerHeight; }
    else {
      const r = host.getBoundingClientRect();
      if (!r.width) return;
      x = ((e.clientX - r.left) / r.width) * ASPECT; y = 1 - (e.clientY - r.top) / r.height;
    }
    if (!mouse.has) { mouse.lx = x; mouse.ly = y; mouse.has = true; }
    mouse.vx = (x - mouse.lx) * 60; mouse.vy = (y - mouse.ly) * 60;
    mouse.lx = x; mouse.ly = y; mouse.x = x; mouse.y = y; mouse.s = 1;
  }

  /* ----------------------------------------------------------------- API */
  const api = {
    params, clip,
    get state() { return state; },
    get linked() { return ok; },
    get warmLeft() { return warmQ; },
    get host() { return hostName; },
    get tier() { return tier; },
    get stats() { return { n: N, gpuMs, dpr: Math.round(dpr * 100) / 100, tier, state, host: hostName, w: cssW, h: cssH }; },
    mount(el, opts = {}) {
      if ((!ok && !pending) || !el) return false;
      const nextMode = opts.mode === "dock" ? "dock" : "float";
      const nextGround = opts.ground === "paper" ? "paper" : "deep";
      if (host === el && mode === nextMode && ground === nextGround) return true;
      host = el; hostName = el.getAttribute("data-gl-host") || ""; mode = nextMode; ground = nextGround;
      cssW = cssH = 0; lastClip = "";
      place();
      measure();                // a host that is not laid out yet is picked up by the next resize
      buildObstacle();
      return true;
    },
    setZ(z) { zWant = z; if (canvas && mode === "float") canvas.style.zIndex = z; },
    window(rect) {
      if (rect == null) { clip.on = false; return; }
      clip.on = true;
      clip.t = rect.top; clip.l = rect.left;
      clip.r = window.innerWidth - (rect.left + rect.width);
      clip.b = window.innerHeight - (rect.top + rect.height);
    },
    setObstacle(spec) {
      if (!spec) return;
      obstacle = Object.assign({}, spec);
      buildObstacle();
    },
    /* n simulation steps run at once, so the plate is already inked the first
       time it is seen (preloader window, a variant switch, a remount). */
    warm(n) {
      if ((!ok && !pending) || lost) return;
      // queued and run by the ticker in chunks; a plate that only ever warms (reduced motion)
      // still reports its instruments when the queue empties
      warmQ = Math.min(220, warmQ + Math.max(1, n | 0));
    },
    wake() {
      if (lost || !host || (!ok && !pending)) return;
      if (covered) { wakeAfter = true; return; }   // asked for under a cover: honoured when it leaves
      if (pending) { wantRun = true; return; }
      wantVis = true; vis();
      setState("run");
    },
    /* hide: the host is off screen, so the canvas is hidden too. Without it the
       last composited frame stays on screen (the reduced-motion still). */
    sleep(hide) {
      if (!ok && !pending) return;
      if (pending) wantRun = false;
      if (covered && hide) wakeAfter = false;      // the host left the screen while covered
      wantVis = !hide; vis();
      if (ok) setState("sleep");
    },
    recolor() { if (!ok) return; readColors(); buildObstacle(); api.warm(30); },
    scrollVelocity(v) { scrollBoost = Math.abs(v) || 0; },
    resize() { if (measure()) { buildObstacle(); api.warm(30); } else if (obstacle.type === "rects") buildObstacle(); },
  };

  /* -------------------------------------------------------------- module */
  let hiddenPause = false, covered = false, wakeAfter = false;
  FX.register("gl", {
    init(ctx) {
      if (!FX.flags.gl) { FX.gl = null; return; }
      /* FIX MQ-01 (2): the context itself is created two frames after the first paint, so the
         preloader's first frames never wait on the driver; calls made before are queued */
      pending = true;
      FX.gl = api;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        try { boot(); } catch (err) { fail(err); }
      }));
      ctx.gsap.ticker.add(tick);
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) { if (state === "run") { hiddenPause = true; api.sleep(false); } }
        else if (hiddenPause) { hiddenPause = false; if (host) api.wake(); }
      });
      /* Covered by a cut, by the identity switch or by the mobile menu: the last
         frame stays as a still and the loop makes no GL call until the cover
         leaves (plan §6, loop gating). */
      const pause = () => { if (covered) return; covered = true; wakeAfter = state === "run"; if (wakeAfter) api.sleep(false); };
      const resume = () => { if (!covered) return; covered = false; if (wakeAfter && host && !document.hidden) api.wake(); wakeAfter = false; };
      FX.on("fx:nav:covered", pause);
      FX.on("fx:nav:uncovered", resume);
      FX.on("fx:nav:reset", resume);
      FX.on("fx:lock", (e) => { if (e && e.reason === "menu") (e.locked ? pause : resume)(); });
    },
    build() {},
    onVariant() { if (!ok) return; readColors(); if (obstacle.type === "glyph") obstacle.font = null; buildObstacle(); api.warm(30); },
    onResize() { api.resize(); },
  });
})();
