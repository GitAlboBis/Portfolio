/*
  AMBIENT CAUSTICS — GLSL for the below-fold light layer.

  A single full-screen triangle (no geometry buffers needed beyond 3 verts) runs
  this fragment shader to draw the rippling net of refracted sunlight you read on
  a seabed. It is PURE procedural noise — no textures, no network — so it ships as
  two short strings and nothing else.

  The look is built the classic way: layered, animated trigonometric/voronoi-ish
  noise, then a sharp power curve to pull the smooth field into thin bright veins
  (the "caustic web"), tinted celeste->foam and kept at very low alpha so it lives
  UNDER the text as atmosphere, never competing with it.

  Two scroll-driven uniforms shape the descent:
    uDepth      0..1 normalized below-fold depth (0 = surface/hero handoff, 1 = Contact)
    uIntensity  master gain, faded by depth + reduced-motion + visibility

  The vertex stage emits the oversized triangle directly from gl_VertexID, so the
  draw call needs no attributes — we issue drawArrays(TRIANGLES, 0, 3).
*/

export const CAUSTICS_VERT = /* glsl */ `
  precision highp float;
  // Full-screen triangle from vertex id — no attributes bound.
  out vec2 vUv;
  void main() {
    // (0,0) (2,0) (0,2) in clip space -> covers the screen with one triangle.
    vec2 p = vec2(
      float((gl_VertexID << 1) & 2),
      float(gl_VertexID & 2)
    );
    vUv = p;                       // 0..2, we only use 0..1 region meaningfully
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  }
`;

export const CAUSTICS_FRAG = /* glsl */ `
  precision highp float;

  in vec2 vUv;
  out vec4 fragColor;

  uniform float uTime;        // seconds
  uniform float uDepth;       // 0 surface .. 1 abyss
  uniform float uIntensity;   // master gain (0 hides the layer)
  uniform vec2  uResolution;  // device px
  uniform vec3  uCeleste;     // --color-celeste
  uniform vec3  uFoam;        // --color-foam

  // --- cheap value noise ---------------------------------------------------
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // Caustic field: sum of a few animated, rotated noise octaves, folded with abs()
  // so the zero-crossings become bright thin lines (the refracted-light web). The
  // two layers drift on different vectors so the net shimmers and never tiles.
  float caustic(vec2 uv, float t) {
    float v = 0.0;
    float amp = 0.5;
    vec2 p = uv;
    // slow rotation matrix per octave to break up axis-aligned banding
    for (int i = 0; i < 3; i++) {
      float n = vnoise(p + vec2(t * 0.06, -t * 0.045) * (1.0 + float(i) * 0.4));
      // fold: distance from 0.5 -> ridges; invert for bright veins
      v += amp * (1.0 - abs(n - 0.5) * 2.0);
      p = mat2(1.6, 1.2, -1.2, 1.6) * p + 3.1;
      amp *= 0.55;
    }
    return v;
  }

  void main() {
    // aspect-correct so the cells stay roughly square on any viewport
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 suv = vec2(uv.x * aspect, uv.y);

    float t = uTime;

    // Two superimposed caustic fields at different scales/speeds = depth + life.
    float scaleA = 3.5;
    float scaleB = 6.5;
    float a = caustic(suv * scaleA, t);
    float b = caustic(suv * scaleB + 11.0, t * 1.35);
    float field = a * 0.65 + b * 0.45;

    // Sharpen into thin bright veins. Higher power => finer, more contrasty net.
    float web = pow(clamp(field, 0.0, 1.0), 4.0);

    // A gentle large-scale "shafts from the surface" gradient: brighter up top,
    // darker toward the bottom of the viewport, so each screenful feels lit from
    // above even as the page as a whole descends.
    float shaft = mix(1.0, 0.35, uv.y);

    // Colour: mostly celeste with foam highlights on the brightest veins.
    vec3 col = mix(uCeleste, uFoam, smoothstep(0.45, 1.0, web));

    // Master alpha. Kept tiny by design (ambient, sub-text). It is scaled by:
    //   web      — only the veins glow, the field between stays clear
    //   shaft    — top-lit falloff within the frame
    //   uIntensity — scroll-depth + visibility + reduced-motion master gain
    float alpha = web * shaft * uIntensity * 0.16;

    fragColor = vec4(col * (0.6 + 0.4 * web), clamp(alpha, 0.0, 1.0));
  }
`;
