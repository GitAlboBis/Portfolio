export default `@group(0) @binding(0) var texture_sampler: sampler;
@group(0) @binding(1) var texture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uniforms: RenderUniforms;
@group(0) @binding(3) var thickness_texture: texture_2d<f32>;
@group(0) @binding(4) var envmap_texture: texture_cube<f32>;

struct RenderUniforms {
    texel_size: vec2f,
    sphere_size: f32,
    time: f32,
    inv_projection_matrix: mat4x4f,
    projection_matrix: mat4x4f,
    view_matrix: mat4x4f,
    inv_view_matrix: mat4x4f,
    // sea-reflection pass: screen-space y (backing px) of the video backdrop's
    // horizon + the mirror strength (0 disables)
    waterline: f32,
    refl_strength: f32,
}

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) iuv: vec2f,
}

// Key light of the WORKSHOP cubemap (scripts/gen_workshop_cubemap.py): a value-ranged
// room — dark floor, ramped walls, a lit ceiling with two soft tube fixtures, and one
// bright light bank on the +Z wall BEHIND the camera. The specular below is the "tube
// highlight" of the bench (REDESIGN-SPEC §F Phase A). The key direction is kept from
// the original stage (behind the letter, slightly +X, grazing) so the highlights still
// ride the rim and every tilted droplet; the light bank sits on the opposite side
// (screen left) so the two do not stack into one flat sheen.
const SUN_DIR_WORLD: vec3f = vec3f(0.32152, 0.11052, -0.94042);
const SUN_COLOR: vec3f = vec3f(0.94, 0.96, 1.0);   // fluorescent tube highlight
const FOAM_COLOR: vec3f = vec3f(0.95, 0.90, 0.80); // aerated oil — cream, not steam

// ── The oil, as a DEPTH RAMP (WP-3b) ────────────────────────────────────────────
// The first pass mixed the body toward ONE flat colour (diffuseColor * 1.12) with
// depth, so the core had no value range and the letter read as a mustard blob. Real
// hydraulic oil is a ramp: a film you see the room through, a honey mid, and a dark
// burnt core. These three stops are the whole tonal range of the figure.
const OIL_FILM: vec3f = vec3f(0.93, 0.74, 0.42);   // thin film — the workshop, warmed
const OIL_MID: vec3f  = vec3f(0.79, 0.54, 0.16);   // token 'oil' #c98a2a — the anchor
const OIL_DEEP: vec3f = vec3f(0.42, 0.215, 0.055); // burnt amber core — never black
// The thinnest rim: a translucent warm edge (NOT the near-black of the first pass).
// Those pixels also carry a low alpha, so the paper-field reads straight through them
// — the contrast between a see-through rim and a dense core is what sells oil.
const EDGE_TINT: vec3f = vec3f(0.70, 0.45, 0.18);

// TIER COMPENSATION (WP-3b). Optical thickness is accumulated PER PARTICLE, so the
// mobile budget (60,000 particles in the same sim box, §E.5) yields roughly half the
// thickness of the desktop budget and the small 350x230 figure washed out to a pale
// beige. The solver is frozen (G4), so the compensation is render-side: the pipeline
// is specialized with PARTICLES_DESKTOP / particleCountForTier() (1.0 desktop,
// 2.0 mobile) — a function of the BUDGET, not of the backing resolution, so a DPR
// change never alters the image. See render/fluidRender.ts + WaterBallHero.tsx.
override thickness_gain: f32 = 1.0;

fn computeViewPosFromUVDepth(tex_coord: vec2f, depth: f32) -> vec3f {
    var ndc: vec4f = vec4f(tex_coord.x * 2.0 - 1.0, 1.0 - 2.0 * tex_coord.y, 0.0, 1.0);
    ndc.z = -uniforms.projection_matrix[2].z + uniforms.projection_matrix[3].z / depth;
    ndc.w = 1.0;

    var eye_pos: vec4f = uniforms.inv_projection_matrix * ndc;

    return eye_pos.xyz / eye_pos.w;
}

fn getViewPosFromTexCoord(tex_coord: vec2f, iuv: vec2f) -> vec3f {
    var depth: f32 = abs(textureLoad(texture, vec2u(iuv), 0).x);
    return computeViewPosFromUVDepth(tex_coord, depth);
}

// Animated micro-ripples: a tiny world-space perturbation of the SSF normal so the
// resting surface glitters and drifts like real water instead of reading as blown
// glass. Sum of a few drifting directional waves; amplitude is faded out on THIN
// fluid so the spray fringe stays clean.
fn ripplePerturb(wp: vec3f, t: f32) -> vec3f {
    let q = wp * 0.55;
    return vec3f(
        sin(q.y * 2.3 + t * 1.35) + 0.55 * sin(q.x * 3.7 - t * 1.05) * sin(q.z * 1.9 + t * 0.7),
        sin(q.x * 2.9 - t * 1.65) + 0.55 * sin(q.z * 3.1 + t * 1.25),
        sin(q.y * 3.3 + t * 0.95) * 0.6
    );
}

// The full screen-space-fluid shading for one pixel (premultiplied rgba).
// Parameterized so the SEA-REFLECTION pass can re-run it at mirrored coords.
fn waterColor(uvf: vec2f, iuvf: vec2f) -> vec4f {
    var depth: f32 = abs(textureLoad(texture, vec2u(iuvf), 0).r);

    if (depth >= 1e4) {
        // no fluid here -> TRANSPARENT so the bench backdrop (paper-field, DOM) shows
        // through. The fluid pixels below refract + reflect the workshop cubemap.
        return vec4f(0.0, 0.0, 0.0, 0.0);
    }

    var viewPos: vec3f = computeViewPosFromUVDepth(uvf, depth); // z is negative

    var ddx: vec3f = getViewPosFromTexCoord(uvf + vec2f(uniforms.texel_size.x, 0.), iuvf + vec2f(1.0, 0.0)) - viewPos;
    var ddy: vec3f = getViewPosFromTexCoord(uvf + vec2f(0., uniforms.texel_size.y), iuvf + vec2f(0.0, 1.0)) - viewPos;
    var ddx2: vec3f = viewPos - getViewPosFromTexCoord(uvf + vec2f(-uniforms.texel_size.x, 0.), iuvf + vec2f(-1.0, 0.0));
    var ddy2: vec3f = viewPos - getViewPosFromTexCoord(uvf + vec2f(0., -uniforms.texel_size.y), iuvf + vec2f(0.0, -1.0));

    if (abs(ddx.z) > abs(ddx2.z)) {
        ddx = ddx2;
    }
    if (abs(ddy.z) > abs(ddy2.z)) {
        ddy = ddy2;
    }

    var normal: vec3f = -normalize(cross(ddx, ddy));

    // thickness now carries TWO channels (see thicknessMap/gaussian/fluidRender):
    //   r = blurred optical thickness, g = speed-weighted thickness.
    // Their ratio is the mean normalized SPEED of the fluid at this pixel — the
    // foam signal: fast, churned-up water is aerated and reads white.
    let thickData: vec2f = textureLoad(thickness_texture, vec2u(iuvf), 0).rg;
    let thickRaw: f32 = thickData.r;
    let speedAvg: f32 = thickData.g / max(thickRaw, 1e-4);

    var thickness: f32 = thickRaw * thickness_gain;

    // world position for the animated ripple field (view -> world, rotation+translation)
    let worldPos: vec3f = (uniforms.inv_view_matrix * vec4f(viewPos, 1.0)).xyz;
    let rippleAmp: f32 = 0.011 * smoothstep(0.12, 0.85, thickness);
    let perWorld: vec3f = ripplePerturb(worldPos, uniforms.time) * rippleAmp;
    let perView: vec3f = (uniforms.view_matrix * vec4f(perWorld, 0.0)).xyz;
    normal = normalize(normal + perView);

    var rayDir = normalize(viewPos);
    let sunView: vec3f = normalize((uniforms.view_matrix * vec4f(SUN_DIR_WORLD, 0.0)).xyz);
    // world up in view space — the "which way is the ceiling" axis of the volume shading
    let upView: vec3f = normalize((uniforms.view_matrix * vec4f(0.0, 1.0, 0.0, 0.0)).xyz);
    let facing: f32 = clamp(dot(normal, -rayDir), 0.0, 1.0);

    // absorption: hydraulic oil, not sea water — denser than the old teal so the body
    // reads AMBER on the light paper-field backdrop instead of a pale tint; thin edges
    // still let the grey workshop transmit (§F.1: 0.30 -> 0.55).
    var density = 0.55;

    // Depth of absorption, 0 (a film) -> 1 (a body). Pure Beer-Lambert was tuned
    // against the OLD outdoor cubemap; with a room environment it drives the thick core to
    // near-black. Dense oil does not go black — multiple scattering converges on the
    // liquid's OWN colour — so the body walks the OIL_FILM -> OIL_MID -> OIL_DEEP ramp.
    let absorb: f32 = clamp(1.0 - exp(-density * thickness), 0.0, 1.0);

    // Refraction looks THROUGH the fluid at the real environment (cubemap) with a
    // touch of CHROMATIC DISPERSION: each channel refracts with a slightly different
    // IOR, so the room splits into faint spectral fringes on curved, thin oil.
    let refrDirR: vec3f = refract(rayDir, normal, 1.0 / 1.327);
    let refrDirG: vec3f = refract(rayDir, normal, 1.0 / 1.333);
    let refrDirB: vec3f = refract(rayDir, normal, 1.0 / 1.340);
    let refrWorldR: vec3f = (uniforms.inv_view_matrix * vec4f(refrDirR, 0.0)).xyz;
    let refrWorldG: vec3f = (uniforms.inv_view_matrix * vec4f(refrDirG, 0.0)).xyz;
    let refrWorldB: vec3f = (uniforms.inv_view_matrix * vec4f(refrDirB, 0.0)).xyz;
    let refractedEnv: vec3f = vec3f(
        textureSampleLevel(envmap_texture, texture_sampler, refrWorldR, 0.).r,
        textureSampleLevel(envmap_texture, texture_sampler, refrWorldG, 0.).g,
        textureSampleLevel(envmap_texture, texture_sampler, refrWorldB, 0.).b
    );

    // VOLUME SHADING: a dense translucent medium is not flat — multiple scattering is
    // brighter where the surface turns toward the ceiling and toward the key. Without
    // this the core has no form at all (the rejected blob). Range ~0.58 .. 1.30.
    let sky: f32 = 0.5 + 0.5 * dot(normal, upView);
    let keyLambert: f32 = max(dot(normal, sunView), 0.0);
    let volumeLit: f32 = 0.66 + 0.44 * sky + 0.20 * keyLambert;

    // thin film -> the workshop, warmed by a film of oil; body -> the amber ramp
    let transmit: vec3f = refractedEnv * mix(vec3f(1.0), OIL_FILM, smoothstep(0.0, 0.30, absorb));
    let bodyCol: vec3f = mix(OIL_MID, OIL_DEEP, smoothstep(0.62, 0.96, absorb)) * volumeLit;
    var refractionColor: vec3f = mix(transmit, bodyCol, smoothstep(0.05, 0.40, absorb));

    // oil IOR ~1.47 -> F0 ~0.035 (water is 0.02): the rim mirrors the room a little
    // harder, which is what separates a translucent edge from a dense core.
    let F0 = 0.035;
    var fresnel: f32 = clamp(F0 + (1.0 - F0) * pow(1.0 - dot(normal, -rayDir), 5.0), 0., 1.);

    var reflectionDir: vec3f = reflect(rayDir, normal);
    var reflectionDirWorld: vec3f = (uniforms.inv_view_matrix * vec4f(reflectionDir, 0.0)).xyz;
    var reflectionColor: vec3f = textureSampleLevel(envmap_texture, texture_sampler, reflectionDirWorld, 0.).rgb;
    var finalColor = mix(refractionColor, reflectionColor, fresnel);

    // The thinnest rim keeps a WARM translucent tint instead of the old near-black
    // edge: those pixels are low-alpha (see THICK_FADE below), so they dissolve into
    // the paper-field rather than ringing the letter with a dark or white halo.
    finalColor = mix(EDGE_TINT, finalColor, smoothstep(0.0, 0.22, thickness));

    // FOAM / SPRAY: churned, fast fluid is aerated -> scatters cream. speedAvg is the
    // blurred per-pixel mean speed. WP-3b: the first pass fired from speedAvg 0.22 at
    // 0.8 strength, so an ordinary churn buried the whole body in grey-white smoke.
    // The gate now opens late and the mix tops out well under 1, so fast motion reads
    // as AERATED OIL (cream lifting off amber), never as steam. "facing" fades it out
    // on edge-on sheets: any world-space texture aliases into per-pixel checkering
    // there (QA-proven), and real foam reads on faces, not silhouettes.
    var foamAmt: f32 = smoothstep(0.38, 0.86, speedAvg) * (0.25 + 0.75 * facing);
    let foamLit: vec3f = FOAM_COLOR * (0.62 + 0.38 * keyLambert);
    finalColor = mix(finalColor, foamLit, foamAmt * 0.45);

    // WET COAT: the clear specular layer that makes oil look WET. The fresnel mirror
    // above only shows at grazing angles, so on its own the front of the form stays
    // matte. This term takes the BRIGHT sources of the room — the two ceiling tubes
    // and the light bank — out of the mirror direction and lays them on the surface
    // with a weight that does not vanish head-on: the fixtures leave elongated
    // streaks along the shoulders of the letter. Foam scatters, so the coat fades
    // where the spray wins.
    let envLum: f32 = dot(reflectionColor, vec3f(0.2126, 0.7152, 0.0722));
    let hot: f32 = smoothstep(0.80, 0.97, envLum);
    let coat: f32 = 0.52 * (0.30 + 0.70 * facing) * smoothstep(0.04, 0.30, thickness);
    finalColor += SUN_COLOR * hot * coat * (1.0 - foamAmt * 0.6);

    // TUBE GLINT: the tight fluorescent specular from the key direction + a broad low
    // sheen. Grazing setup -> the glints ride the rim and every tilted splash droplet.
    var H: vec3f = normalize(sunView - rayDir);
    let ndh: f32 = max(dot(H, normal), 0.0);
    let glint: f32 = pow(ndh, 260.0) * 0.6;
    let sheen: f32 = pow(ndh, 12.0) * 0.09; // broad fill on the shoulder away from the light bank
    finalColor += SUN_COLOR * (glint * (1.0 - foamAmt * 0.6) + sheen);
    // premultiplied-alpha invariant: the canvas is alphaMode:'premultiplied' and
    // color > alpha is UNDEFINED compositing per the WebGPU spec — the additive
    // glint must not push the stored color past the alpha budget on thin rim pixels.
    finalColor = min(finalColor, vec3f(1.0));

    // Thickness-driven edge/foam fade: thin fluid — the fast OUTWARD wave fronts,
    // spray, and the silhouette rim — fades toward transparent instead of rendering
    // as hard "needles". Canvas is premultiplied-alpha, so premultiply the colour by
    // the same factor. THICK_FADE is the thickness at which the surface is fully
    // opaque; below it the sheet softens into the background (tightens the "A"
    // silhouette — Alberto: "bordi trasparenti"). FOAM is the one exception: fast
    // cream spray must stay VISIBLE while thin (that's what a splash IS), so foam
    // lifts the fade floor for moving droplets — at rest nothing changes.
    let THICK_FADE: f32 = 1.4; // WP-3b: a translucent shoulder (0.9 went opaque at once; 2.2 was a mist)
    let edgeFade: f32 = smoothstep(0.0, THICK_FADE, thickness);
    let sprayAlpha: f32 = foamAmt * smoothstep(0.02, 0.30, thickness) * 0.9;
    let alpha: f32 = clamp(max(edgeFade, sprayAlpha), 0.0, 1.0);
    return vec4f(finalColor * alpha, alpha);
}

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f {
    // LEGACY "sea reflection" branch (the old hero stood IN a sea video below
    // uniforms.waterline). Kept compiled but INACTIVE on the bench: WaterBallHero
    // sets refl_strength = 0, so 'sub' stays 0 and this is a straight passthrough.
    let cl = uniforms.waterline;
    let screenH = 1.0 / uniforms.texel_size.y;
    var uvf = input.uv;
    var iuvf = input.iuv;
    var sub = 0.0; // 0 above the waterline, -> 1 toward the bottom of the screen
    if (uniforms.refl_strength > 0.001 && input.iuv.y > cl) {
        sub = clamp((input.iuv.y - cl) / max(screenH - cl, 1.0), 0.0, 1.0);
        let wob = (sin(input.iuv.y * 0.09 + uniforms.time * 2.2)
                 + 0.6 * sin(input.iuv.y * 0.031 - uniforms.time * 1.1)) * 7.0 * sub;
        iuvf = vec2f(clamp(input.iuv.x + wob, 1.0, 1.0 / uniforms.texel_size.x - 2.0), input.iuv.y);
        uvf = iuvf * uniforms.texel_size;
    }

    var col = waterColor(uvf, iuvf);
    if (col.a <= 0.003) {
        return vec4f(0.0, 0.0, 0.0, 0.0);
    }

    if (sub > 0.0) {
        // submerged: sink into the sea (alpha melts away with depth)
        let melt = 1.0 - sub * uniforms.refl_strength;
        col = col * melt;
        // foam belt at the contact line — the sea holds the letter
        let belt = 1.0 - clamp(abs(input.iuv.y - cl) / (screenH * 0.008), 0.0, 1.0);
        let sparkle = 0.6 + 0.4 * sin(input.iuv.x * 0.11 + uniforms.time * 2.6);
        col = vec4f(min(col.rgb + FOAM_COLOR * belt * sparkle * 0.35 * col.a, vec3f(col.a)), col.a);
    }
    return col;
}
`;
