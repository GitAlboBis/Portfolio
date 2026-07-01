export default `@group(0) @binding(0) var texture_sampler: sampler;
@group(0) @binding(1) var texture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uniforms: RenderUniforms;
@group(0) @binding(3) var thickness_texture: texture_2d<f32>;
@group(0) @binding(4) var envmap_texture: texture_cube<f32>;

struct RenderUniforms {
    texel_size: vec2f, 
    sphere_size: f32, 
    inv_projection_matrix: mat4x4f, 
    projection_matrix: mat4x4f, 
    view_matrix: mat4x4f, 
    inv_view_matrix: mat4x4f, 
}

struct FragmentInput {
    @location(0) uv: vec2f, 
    @location(1) iuv: vec2f, 
}

fn computeViewPosFromUVDepth(tex_coord: vec2f, depth: f32) -> vec3f {
    var ndc: vec4f = vec4f(tex_coord.x * 2.0 - 1.0, 1.0 - 2.0 * tex_coord.y, 0.0, 1.0);
    // なんかこれで合う
    ndc.z = -uniforms.projection_matrix[2].z + uniforms.projection_matrix[3].z / depth;
    ndc.w = 1.0;

    var eye_pos: vec4f = uniforms.inv_projection_matrix * ndc;

    return eye_pos.xyz / eye_pos.w;
}

fn getViewPosFromTexCoord(tex_coord: vec2f, iuv: vec2f) -> vec3f {
    var depth: f32 = abs(textureLoad(texture, vec2u(iuv), 0).x);
    return computeViewPosFromUVDepth(tex_coord, depth);
}

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f {
    var depth: f32 = abs(textureLoad(texture, vec2u(input.iuv), 0).r);

    if (depth >= 1e4) {
        // no fluid here -> TRANSPARENT so the sunset backdrop shows through. The "A"
        // pixels below still refract + reflect the environment (sunset cubemap).
        return vec4f(0.0, 0.0, 0.0, 0.0);
    }

    var viewPos: vec3f = computeViewPosFromUVDepth(input.uv, depth); // z は負

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
    var rayDir = normalize(viewPos);
    var lightDir = normalize((uniforms.view_matrix * vec4f(-1, 1, -1, 0.)).xyz);
    var H: vec3f        = normalize(lightDir - rayDir);
    var specular: f32   = pow(max(0.0, dot(H, normal)), 250.);
    var diffuse: f32  = max(0.0, dot(lightDir, normal)) * 1.0;

    var density = 0.7; 
    
    var thickness = textureLoad(thickness_texture, vec2u(input.iuv), 0).r;

    // var diffuseColor = vec3f(1.0, 1.0, 1.0);
    var diffuseColor = vec3f(0.0, 0.7375, 0.95);
    var transmittance: vec3f = exp(-density * thickness * (1.0 - diffuseColor));

    // Refraction looks THROUGH the water at the real environment (cubemap), not a
    // flat colour — so the sunset sky wraps the whole surface (360deg), not only the
    // grazing rim. Beer-Lambert transmittance still gives the body its water tint.
    var refractionDir: vec3f = refract(rayDir, normal, 1.0 / 1.333);
    var refractionDirWorld: vec3f = (uniforms.inv_view_matrix * vec4f(refractionDir, 0.0)).xyz;
    var refractedEnv: vec3f = textureSampleLevel(envmap_texture, texture_sampler, refractionDirWorld, 0.).rgb;
    var refractionColor: vec3f = refractedEnv * transmittance;

    let F0 = 0.02;
    var fresnel: f32 = clamp(F0 + (1.0 - F0) * pow(1.0 - dot(normal, -rayDir), 5.0) + 0.0, 0., 1.);

    var reflectionDir: vec3f = reflect(rayDir, normal);
    var reflectionDirWorld: vec3f = (uniforms.inv_view_matrix * vec4f(reflectionDir, 0.0)).xyz;
    var reflectionColor: vec3f = textureSampleLevel(envmap_texture, texture_sampler, reflectionDirWorld, 0.).rgb; 
    var finalColor = 0.0 * specular + mix(refractionColor, reflectionColor, fresnel);

    // Neutralise the residual warm at the EXTREME grazing rim (fresnel reflects the
    // orange sky there as a thin line). Pull only the thinnest edge toward the deep
    // water tint — those pixels are also low-alpha (see THICK_FADE below), so they
    // dissolve rather than forming a teal halo: the contour just stops being orange.
    let edgeCool: vec3f = vec3f(0.04, 0.30, 0.40);
    finalColor = mix(edgeCool, finalColor, smoothstep(0.0, 0.55, thickness));

    // (removed the hard white silhouette-edge tint at steep depth gradients — it read
    // as harsh white spikes on the letter, and exploded into a starburst of spikes
    // while the fluid dispersed. The translucent teal SSF + fresnel rim carry the
    // edge on their own; foam, if wanted, should be soft and thickness-driven.)
    // Thickness-driven edge/foam fade: thin fluid — the fast OUTWARD wave fronts,
    // spray, and the silhouette rim — fades toward transparent instead of rendering
    // as hard "needles". Canvas is premultiplied-alpha, so premultiply the colour by
    // the same factor. THICK_FADE is the thickness at which the surface is fully
    // opaque; below it the sheet softens into the background. Raised (0.5 -> 1.15)
    // so the THIN fringe — which barely absorbs and refracted the raw orange sunset
    // sky — dissolves to TRANSPARENT rather than showing a coloured contour, tightening
    // the "A" silhouette (Alberto: "bordi trasparenti"). (Tunable.)
    let THICK_FADE: f32 = 1.15;
    let edgeFade: f32 = smoothstep(0.0, THICK_FADE, thickness);
    return vec4f(finalColor * edgeFade, edgeFade);

    // return vec4f(viewPos.y * 100, 0, 0, 1.0);

    // 法線
    // return vec4f(0.5 * normal + 0.5, 1.);
    // let norm = dot(normal, normal);
    // // let left = getViewPosFromTexCoord(input.uv + vec2f(-uniforms.texel_size.x, 0.), input.iuv + vec2f(-1.0, 0.0));
    // let left_depth = abs(textureLoad(texture, vec2u(input.iuv + vec2f(-10.0, 0.0)), 0).x);
    // return vec4f(10000000 * abs(left_depth), 0, 0, 1.);
    // 法線の y 成分    
    // return vec4f(vec3f(normal.x, 0, 0), 1);
    // return vec4f(vec3f(normal.y, 0, 0), 1);
    // return vec4f(vec3f(normal.z, 0, 0), 1);
    // specular だけ
    // return vec4f(vec3f(specular), 1);
    // reflection だけ
    // return vec4f(reflectionColor, 1.);
    // return vec4f(fresnel, 0., 0., 1.);
}
`;
