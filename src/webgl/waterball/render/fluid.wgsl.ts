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
}

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) iuv: vec2f,
}

// Sun of the sunset cubemap (scripts/gen_sunset_cubemap.py): low on the horizon,
// azimuth toward -Z, slightly +X. The camera faces the "A" head-on from +Z, so the
// sun BACKLIGHTS the letter — glints live on the grazing rim + on tilted splash
// droplets, which is exactly the golden-hour read.
const SUN_DIR_WORLD: vec3f = vec3f(0.32152, 0.11052, -0.94042);
const SUN_COLOR: vec3f = vec3f(1.0, 0.80, 0.52);   // warm ember-gold glint
const FOAM_COLOR: vec3f = vec3f(1.0, 0.955, 0.885); // sunset-warm white spray

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

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f {
    var depth: f32 = abs(textureLoad(texture, vec2u(input.iuv), 0).r);

    if (depth >= 1e4) {
        // no fluid here -> TRANSPARENT so the sunset backdrop shows through. The "A"
        // pixels below still refract + reflect the environment (sunset cubemap).
        return vec4f(0.0, 0.0, 0.0, 0.0);
    }

    var viewPos: vec3f = computeViewPosFromUVDepth(input.uv, depth); // z is negative

    var ddx: vec3f = getViewPosFromTexCoord(input.uv + vec2f(uniforms.texel_size.x, 0.), input.iuv + vec2f(1.0, 0.0)) - viewPos;
    var ddy: vec3f = getViewPosFromTexCoord(input.uv + vec2f(0., uniforms.texel_size.y), input.iuv + vec2f(0.0, 1.0)) - viewPos;
    var ddx2: vec3f = viewPos - getViewPosFromTexCoord(input.uv + vec2f(-uniforms.texel_size.x, 0.), input.iuv + vec2f(-1.0, 0.0));
    var ddy2: vec3f = viewPos - getViewPosFromTexCoord(input.uv + vec2f(0., -uniforms.texel_size.y), input.iuv + vec2f(0.0, -1.0));

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
    let thickData: vec2f = textureLoad(thickness_texture, vec2u(input.iuv), 0).rg;
    var thickness: f32 = thickData.r;
    let speedAvg: f32 = thickData.g / max(thickness, 1e-4);

    // world position for the animated ripple field (view -> world, rotation+translation)
    let worldPos: vec3f = (uniforms.inv_view_matrix * vec4f(viewPos, 1.0)).xyz;
    let rippleAmp: f32 = 0.035 * smoothstep(0.12, 0.85, thickness);
    let perWorld: vec3f = ripplePerturb(worldPos, uniforms.time) * rippleAmp;
    let perView: vec3f = (uniforms.view_matrix * vec4f(perWorld, 0.0)).xyz;
    normal = normalize(normal + perView);

    var rayDir = normalize(viewPos);
    let sunView: vec3f = normalize((uniforms.view_matrix * vec4f(SUN_DIR_WORLD, 0.0)).xyz);

    // absorption: LOW enough that the backlit sunset actually GLOWS through the
    // letter (the sun sits behind the "A" — see SUN_DIR_WORLD). 0.7 read as murky
    // mud in QA; 0.42 keeps the teal body but lets the golden light transmit.
    var density = 0.34;

    var diffuseColor = vec3f(0.0, 0.7375, 0.95);
    var transmittance: vec3f = exp(-density * thickness * (1.0 - diffuseColor));

    // Refraction looks THROUGH the water at the real environment (cubemap) with a
    // touch of CHROMATIC DISPERSION: each channel refracts with a slightly different
    // IOR, so the sunset splits into faint spectral fringes on curved, thin water —
    // the "liquid jewel" cue. Beer-Lambert transmittance still tints the body.
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
    var refractionColor: vec3f = refractedEnv * transmittance;

    let F0 = 0.02;
    var fresnel: f32 = clamp(F0 + (1.0 - F0) * pow(1.0 - dot(normal, -rayDir), 5.0), 0., 1.);

    var reflectionDir: vec3f = reflect(rayDir, normal);
    var reflectionDirWorld: vec3f = (uniforms.inv_view_matrix * vec4f(reflectionDir, 0.0)).xyz;
    var reflectionColor: vec3f = textureSampleLevel(envmap_texture, texture_sampler, reflectionDirWorld, 0.).rgb;
    var finalColor = mix(refractionColor, reflectionColor, fresnel);

    // Neutralise the residual warm at the EXTREME grazing rim (fresnel reflects the
    // orange sky there as a thin line). Pull only the thinnest edge toward the deep
    // water tint — those pixels are also low-alpha (see THICK_FADE below), so they
    // dissolve rather than forming a teal halo: the contour just stops being orange.
    let edgeCool: vec3f = vec3f(0.04, 0.30, 0.40);
    finalColor = mix(edgeCool, finalColor, smoothstep(0.0, 0.42, thickness));

    // FOAM / SPRAY: churned, fast water is aerated -> scatters white. speedAvg is the
    // blurred per-pixel mean speed. Foam is lit by the sun (soft lambert) so the
    // spray catches the golden hour like real whitewater. "facing" fades it out on
    // edge-on sheets: any world-space texture aliases into per-pixel checkering
    // there (QA-proven), and real foam reads on faces, not silhouettes.
    let facing: f32 = clamp(dot(normal, -rayDir), 0.0, 1.0);
    var foamAmt: f32 = smoothstep(0.22, 0.62, speedAvg) * (0.25 + 0.75 * facing);
    let sunLambert: f32 = max(dot(normal, sunView), 0.0);
    let foamLit: vec3f = FOAM_COLOR * (0.62 + 0.38 * sunLambert);
    finalColor = mix(finalColor, foamLit, foamAmt * 0.8);

    // SUN GLINT: tight golden specular from the actual cubemap sun + a broad low
    // sheen. Backlit setup -> the glints ride the grazing rim and every tilted
    // splash droplet. Foam scatters, so the mirror glint fades where foam wins.
    var H: vec3f = normalize(sunView - rayDir);
    let ndh: f32 = max(dot(H, normal), 0.0);
    let glint: f32 = pow(ndh, 420.0) * 1.5;
    let sheen: f32 = pow(ndh, 22.0) * 0.085;
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
    // white spray must stay VISIBLE while thin (that's what a splash IS), so foam
    // lifts the fade floor for moving droplets — at rest nothing changes.
    let THICK_FADE: f32 = 0.9; // rescaled with particle_alpha 0.05 -> 0.038 (same fade coverage)
    let edgeFade: f32 = smoothstep(0.0, THICK_FADE, thickness);
    let sprayAlpha: f32 = foamAmt * smoothstep(0.02, 0.30, thickness) * 0.9;
    let alpha: f32 = clamp(max(edgeFade, sprayAlpha), 0.0, 1.0);
    return vec4f(finalColor * alpha, alpha);
}
`;
