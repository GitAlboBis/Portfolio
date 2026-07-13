/**
 * artwork.ts — the shared generative "still" language for the project planes
 * (LA MAREA Pass 2/3). One GLSL chunk + one slug→pattern map used by BOTH the
 * /work runway layer (WorkRunwayCanvas) and the home depth gallery
 * (WorksGalleryCanvas), so every surface draws the same artwork per project.
 *
 * The chunk provides hash/noise/fbm + `artwork(uv, pattern, seed, time, base, A, B)`
 * returning the raw pattern colour. Each consumer applies its own finish
 * (reveal/alpha on the runway, depth cross-fade in the gallery, grain/vignette).
 * When real stills land (Work.textureSrc), the texture branch replaces the
 * pattern call in both consumers at once.
 */

export const PATTERN_BY_SLUG: Record<string, number> = {
  badante24h: 0,
  "doit-voice-ai-agent": 1,
  "agricultural-supply-chain": 2,
  "sersan-project-1": 3,
  "sersan-project-2": 3,
};

export const ARTWORK_GLSL = /* glsl */ `
  float aw_hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float aw_noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = aw_hash(i), b = aw_hash(i + vec2(1.0, 0.0));
    float c = aw_hash(i + vec2(0.0, 1.0)), d = aw_hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  float aw_fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for (int k = 0; k < 4; k++) { v += a * aw_noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  // 0 contours · 1 voice bars · 2 field rows · 3 calm dot grid (WIP)
  vec3 artwork(vec2 uv, float pattern, float seed, float time, vec3 base, vec3 A, vec3 B){
    vec3 col = base;
    if (pattern < 0.5) {
      // geographies of care: soft map isolines around two warm centres.
      float field = aw_fbm(uv * 2.2 + seed);
      float rings = abs(fract(field * 6.0 + time * 0.02) - 0.5) * 2.0;
      float line = smoothstep(0.24, 0.0, rings);
      float g1 = smoothstep(0.55, 0.0, distance(uv, vec2(0.36, 0.62)));
      float g2 = smoothstep(0.48, 0.0, distance(uv, vec2(0.72, 0.28)));
      col = mix(base, A, line * 0.8);
      col = mix(col, B, (g1 * 0.45 + g2 * 0.35));
    } else if (pattern < 1.5) {
      // voice spectrum: slow-breathing bars around the reading line.
      float nb = 26.0;
      float bx = floor(uv.x * nb);
      float amp = 0.22 + 0.5 * (0.5 + 0.5 * sin(bx * 1.7 + seed * 7.0 + time * 0.5))
                       * (0.55 + 0.45 * aw_hash(vec2(bx, seed)));
      float d = abs(uv.y - 0.5);
      float body = smoothstep(amp * 0.5 + 0.012, amp * 0.5 - 0.012, d);
      float fx = fract(uv.x * nb);
      float colm = smoothstep(0.10, 0.20, fx) * smoothstep(0.90, 0.80, fx);
      col = mix(base, mix(A, B, uv.x), body * colm);
    } else if (pattern < 2.5) {
      // field rows: sinuous terraced bands, a light sweep across them.
      float rows = sin((uv.y * 9.0 + aw_fbm(vec2(uv.x * 2.2, seed)) * 2.6) * 3.14159265);
      col = mix(base, A, smoothstep(-0.1, 0.75, rows) * 0.38);
      col = mix(col, B, smoothstep(0.93, 1.0, abs(rows)) * 0.28);
      col += 0.05 * smoothstep(0.55, 1.0, sin((uv.x + uv.y) * 2.5 + time * 0.08));
    } else {
      // work in progress: a calm halftone grid, breathing.
      vec2 g = uv * vec2(15.0, 21.0);
      vec2 cell = fract(g) - 0.5;
      float breath = 0.5 + 0.5 * sin(time * 0.45 + floor(g).x * 0.6 + floor(g).y * 0.4 + seed);
      float r = 0.10 + 0.10 * breath;
      float dotm = smoothstep(r, r - 0.05, length(cell));
      col = mix(base, mix(A, B, uv.y), dotm * 0.55);
    }
    return col;
  }
`;
