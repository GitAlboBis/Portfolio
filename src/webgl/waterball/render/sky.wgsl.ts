export default `@group(0) @binding(0) var<uniform> uniforms: RenderUniforms;

struct RenderUniforms {
    texel_size: vec2f,
    sphere_size: f32,
    time: f32,
    inv_projection_matrix: mat4x4f,
    projection_matrix: mat4x4f,
    view_matrix: mat4x4f,
    inv_view_matrix: mat4x4f,
}

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) iuv: vec2f,
}

// LIVING SUNSET SKY + SEA — the procedural, ANIMATED twin of the static cubemap
// (scripts/gen_sunset_cubemap.py): same sun, same palette, so the letter's
// reflections agree with the world behind it. Drawn as an opaque fullscreen pass
// UNDER the fluid in the SAME canvas; the camera matrices drive it, so the hero's
// sway/dolly parallaxes the sky for free. Clouds drift on an fbm field, the sun
// halo breathes, and the sea below the horizon carries the sun's GLITTER PATH
// with animated sparkle — the water "A" stands over a real evening ocean.

const SUN_DIR: vec3f = vec3f(0.32152, 0.11052, -0.94042);
const ZENITH: vec3f      = vec3f(0.290, 0.267, 0.439);
const UPPER: vec3f       = vec3f(0.553, 0.353, 0.525);
const ROSE: vec3f        = vec3f(0.882, 0.463, 0.541);
const HORIZON: vec3f     = vec3f(1.000, 0.620, 0.388);
const HORIZON_HOT: vec3f = vec3f(1.000, 0.851, 0.627);
const SUN_CORE: vec3f    = vec3f(1.000, 0.953, 0.847);
const SUN_GLOW: vec3f    = vec3f(1.000, 0.478, 0.235);
const SEA_NEAR: vec3f    = vec3f(0.851, 0.541, 0.353);
const SEA_DEEP: vec3f    = vec3f(0.275, 0.157, 0.290);

fn hash21(p: vec2f) -> f32 {
    return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
}
fn noise2(p: vec2f) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash21(i), hash21(i + vec2f(1.0, 0.0)), u.x),
        mix(hash21(i + vec2f(0.0, 1.0)), hash21(i + vec2f(1.0, 1.0)), u.x),
        u.y,
    );
}
fn fbm(p: vec2f) -> f32 {
    var v = 0.0;
    var a = 0.5;
    var q = p;
    for (var k: i32 = 0; k < 4; k++) {
        v += a * noise2(q);
        q = q * 2.03 + vec2f(17.0, 9.2);
        a *= 0.5;
    }
    return v;
}

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f {
    // world-space view ray from the fragment (same matrices as the fluid)
    let ndc = vec4f(input.uv.x * 2.0 - 1.0, 1.0 - 2.0 * input.uv.y, 1.0, 1.0);
    let eye = uniforms.inv_projection_matrix * ndc;
    let dirView = normalize(eye.xyz / eye.w);
    let dir = normalize((uniforms.inv_view_matrix * vec4f(dirView, 0.0)).xyz);
    let t = uniforms.time;
    let y = dir.y;

    // ── base sky gradient (cubemap stops) ────────────────────────────────
    var col = mix(HORIZON, ROSE, smoothstep(0.0, 0.22, y));
    col = mix(col, UPPER, smoothstep(0.12, 0.5, y));
    col = mix(col, ZENITH, smoothstep(0.4, 1.0, y));

    if (y < 0.0) {
        // ── SEA ──────────────────────────────────────────────────────────
        var sea = mix(SEA_NEAR, SEA_DEEP, smoothstep(0.0, -0.55, y));
        // pseudo-projected plane coords for surface detail (cheap, stable)
        let pc = dir.xz / max(-y, 0.02);
        // slow drifting swell bands, breaking up toward the horizon
        let swell = sin(pc.y * 2.2 - t * 0.35 + fbm(pc * 0.8 + vec2f(t * 0.05, 0.0)) * 2.5) * 0.5 + 0.5;
        sea *= 0.92 + swell * 0.10 * smoothstep(-0.02, -0.25, y);
        // the sun's glitter path: aligned with the sun azimuth, sparkling
        let sunFlat = normalize(vec2f(SUN_DIR.x, SUN_DIR.z));
        let dirFlat = normalize(vec2f(dir.x, dir.z));
        let along = max(dot(dirFlat, sunFlat), 0.0);
        let path = pow(along, 90.0) * smoothstep(0.0, -0.04, y) * (1.0 - smoothstep(-0.08, -0.5, y) * 0.75);
        let sparkle = smoothstep(0.62, 0.95, noise2(pc * vec2f(26.0, 9.0) + vec2f(0.0, t * 1.7))) * path;
        sea += SUN_GLOW * path * 0.5 + SUN_CORE * sparkle * 0.85;
        col = sea;
    } else {
        // ── CLOUDS — an fbm field drifting with the evening wind ─────────
        let pc = dir.xz / (y + 0.18);
        let q = pc * 1.6 + vec2f(t * 0.012, t * 0.004);
        var cm = fbm(q) - (0.62 - 0.20 * (1.0 - smoothstep(0.0, 0.35, y)));
        cm = smoothstep(0.0, 0.28, cm);
        // lit warm on the sun side, dusky away from it
        let sunAmt = pow(max(dot(dir, SUN_DIR), 0.0), 3.0);
        let cloudCol = mix(
            mix(UPPER * 0.9, vec3f(1.0, 0.87, 0.72), 0.45 + 0.55 * sunAmt),
            SUN_CORE,
            sunAmt * 0.5,
        );
        col = mix(col, cloudCol, cm * 0.55 * smoothstep(0.0, 0.06, y));
    }

    // bright atmospheric band hugging the horizon (both sides)
    col = mix(col, HORIZON_HOT, pow(1.0 - min(abs(y), 1.0), 10.0) * 0.55);

    // ── sun: halo (breathing), core bloom, disk ──────────────────────────
    let d = clamp(dot(dir, SUN_DIR), 0.0, 1.0);
    let breathe = 0.85 + 0.15 * sin(t * 0.35);
    col = mix(col, SUN_GLOW, pow(d, 5.0) * 0.85 * breathe);
    col = mix(col, SUN_CORE, pow(d, 60.0));
    col = mix(col, SUN_CORE, smoothstep(0.9975, 0.9990, d));

    // fine grain kills banding on the long gradients
    col += (hash21(input.uv * vec2f(1920.0, 1080.0) + vec2f(fract(t), 0.0)) - 0.5) * 0.012;

    return vec4f(clamp(col, vec3f(0.0), vec3f(1.0)), 1.0);
}
`;
