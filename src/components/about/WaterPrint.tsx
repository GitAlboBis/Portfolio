"use client";

import * as React from "react";

/*
  WaterPrint — a photograph that lives underwater.

  Port of Ksenia Kondrashova's water-distortion-over-image (the brief's CODE
  SNIPPET E, WebGL1; her pens are MIT — `_refs/DOSSIERS.md §9b`). The surface
  is a 10-iteration ROTATING DOMAIN-WARP:

      m = rotate2D(.5)
      for j in 0..9:
        uv *= m; n *= m
        q  = uv·scale + j + n + (.5 + .5j)·(mod(j,2)−1)·t
        n += sin(q);  N += cos(q)/scale;  scale *= 1.2

  Kept verbatim (the dossier's MUST-NOT-CHANGE list): the 10 iterations, the
  `·1.2` per-octave scale climb, the `rotate2D(.5)` matrix, the ALTERNATING
  drift sign (odd/even octaves counter-drift — what stops the pattern sliding
  as one sheet), the `pow(uv.y, .3)` then `pow(…, 2.)` shaping that biases
  sparkle toward the horizon, the two-level displacement (outer snoise →
  water refraction ·0.03, surface noise ·0.07), the 1.4 scale_factor crop,
  the edge fade, and the `.002·u_time` millisecond clock.

  Changed (recorded): the illumination tint — hers is cyan
  (`vec3(1−blueish, 1, 1)`), ours is the site's warm caustic light
  (1.0, 0.86, 0.62), per the dossier: "the illumination term becomes amber".

  A plain <img> renders underneath and stays for reduced-motion / no-WebGL /
  context-lost; the canvas hides it only after its own first frame (the
  shader's 1.4 crop differs from object-fit, so both visible at once would
  misregister). IO + visibility gate the rAF; no idle loop offscreen.
*/

const VERT = `
precision mediump float;
varying vec2 vUv;
attribute vec2 a_position;
void main() {
  vUv = .5 * (a_position + 1.);
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D u_image_texture;
uniform float u_time;
uniform float u_ratio;
uniform float u_img_ratio;
uniform float u_scale;
uniform float u_illumination;
uniform float u_surface_distortion;
uniform float u_water_distortion;

vec3 wp_mod289(vec3 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec2 wp_mod289(vec2 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec3 wp_permute(vec3 x) { return wp_mod289(((x*34.)+1.)*x); }
float wp_snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1., 0.) : vec2(0., 1.);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = wp_mod289(i);
  vec3 p = wp_permute(wp_permute(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.);
  m = m*m;
  m = m*m;
  vec3 x = 2. * fract(p * C.www) - 1.;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130. * dot(m, g);
}

mat2 wp_rotate2D(float r) { return mat2(cos(r), sin(r), -sin(r), cos(r)); }

float wp_surface_noise(vec2 uv, float t, float scale) {
  vec2 n = vec2(.1);
  vec2 N = vec2(.1);
  mat2 m = wp_rotate2D(.5);
  for (int j = 0; j < 10; j++) {
    uv *= m;
    n *= m;
    vec2 q = uv * scale + float(j) + n + (.5 + .5 * float(j)) * (mod(float(j), 2.) - 1.) * t;
    n += sin(q);
    N += cos(q) / scale;
    scale *= 1.2;
  }
  return (N.x + N.y + .1);
}

void main() {
  vec2 uv = vUv;
  uv.y = 1. - uv.y;
  uv.x *= u_ratio;

  float t = .002 * u_time;

  float outer_noise = wp_snoise((.3 + .1 * sin(t)) * uv + vec2(0., .2 * t));
  vec2 surface_noise_uv = 2. * uv + (outer_noise * .2);

  float surface_noise = wp_surface_noise(surface_noise_uv, t, u_scale);
  surface_noise *= pow(uv.y, .3);
  surface_noise = pow(surface_noise, 2.);

  vec2 img_uv = vUv;
  img_uv -= .5;
  if (u_ratio > u_img_ratio) {
    img_uv.x = img_uv.x * u_ratio / u_img_ratio;
  } else {
    img_uv.y = img_uv.y * u_img_ratio / u_ratio;
  }
  float scale_factor = 1.4;
  img_uv *= scale_factor;
  img_uv += .5;
  img_uv.y = 1. - img_uv.y;

  img_uv += (u_water_distortion * outer_noise);
  img_uv += (u_surface_distortion * surface_noise);

  vec4 img = texture2D(u_image_texture, img_uv);
  img *= (1. + u_illumination * surface_noise);

  vec3 color = img.rgb;
  /* the illumination sparkle — Golden Hour's warm caustic light, not cyan */
  color += u_illumination * vec3(1.0, 0.86, 0.62) * surface_noise;
  float opacity = img.a;

  float edge_width = .02;
  float edge_alpha = smoothstep(0., edge_width, img_uv.x) * smoothstep(1., 1. - edge_width, img_uv.x);
  edge_alpha *= smoothstep(0., edge_width, img_uv.y) * smoothstep(1., 1. - edge_width, img_uv.y);
  color *= edge_alpha;
  opacity *= edge_alpha;

  gl_FragColor = vec4(color, opacity);
}`;

export function WaterPrint({ src, className = "" }: { src: string; className?: string }) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const imgEl = imgRef.current;
    if (!wrap || !canvas || !imgEl) return;
    // effect-time read (render must not branch on the store — hydration rule)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const gl = canvas.getContext("webgl", { alpha: true, antialias: false });
    if (!gl) return;

    let effectAlive = true;
    let running = false;
    let lost = false;
    let painted = false;
    let raf = 0;

    const compile = (type: number, srcCode: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, srcCode);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const u = {
      time: gl.getUniformLocation(prog, "u_time"),
      ratio: gl.getUniformLocation(prog, "u_ratio"),
      imgRatio: gl.getUniformLocation(prog, "u_img_ratio"),
      scale: gl.getUniformLocation(prog, "u_scale"),
      illum: gl.getUniformLocation(prog, "u_illumination"),
      surf: gl.getUniformLocation(prog, "u_surface_distortion"),
      water: gl.getUniformLocation(prog, "u_water_distortion"),
      tex: gl.getUniformLocation(prog, "u_image_texture"),
    };
    // the snippet's shipped defaults, verbatim
    gl.uniform1f(u.scale, 7);
    gl.uniform1f(u.illum, 0.15);
    gl.uniform1f(u.surf, 0.07);
    gl.uniform1f(u.water, 0.03);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([42, 24, 32, 255]),
    );
    gl.uniform1i(u.tex, 0);

    let imgRatio = 1.5;
    let texReady = false;
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    img.onload = () => {
      if (!effectAlive || lost) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      imgRatio = img.naturalWidth / img.naturalHeight;
      texReady = true;
    };
    img.onerror = () => {};

    const size = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 4) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      painted = false; // a resize clears the buffer — repaint before unveiling
    };
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    size();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!running || lost || document.hidden || !texReady) return;
      gl.uniform1f(u.time, now); // the snippet's ms clock (t = .002·u_time)
      gl.uniform1f(u.ratio, canvas.width / Math.max(1, canvas.height));
      gl.uniform1f(u.imgRatio, imgRatio);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!painted) {
        painted = true;
        // only now hide the static img (the 1.4 crop would misregister)
        imgEl.style.visibility = "hidden";
      }
    };

    const io = new IntersectionObserver(([entry]) => (running = entry.isIntersecting), {
      rootMargin: "80px",
    });
    io.observe(wrap);

    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true;
      imgEl.style.visibility = ""; // the still takes back over
    };
    canvas.addEventListener("webglcontextlost", onLost);

    raf = requestAnimationFrame(frame);

    return () => {
      effectAlive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      imgEl.style.visibility = "";
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      // no loseContext (the UnderPaper lesson: the SAME context returns on a
      // StrictMode/pref re-run and would be permanently dead)
      if (!gl.isContextLost()) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    };
  }, [src]);

  return (
    // positioning comes ENTIRELY from the caller: hardcoding `relative` here
    // fought a passed `absolute inset-0` (stylesheet order decides, not class
    // order) and collapsed the box to zero height — measured empty scrap
    <div ref={wrapRef} className={`overflow-hidden ${className}`}>
      {/* the still IS the reduced-motion / no-GL / pre-first-frame poster */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
    </div>
  );
}

export default WaterPrint;
