export default `@group(0) @binding(1) var texture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uniforms: FilterUniforms;

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) iuv: vec2f
}

override depth_threshold: f32;
override projected_particle_constant: f32;
override max_filter_size: f32;

struct FilterUniforms {
    blur_dir: vec2f,
}

// ── Narrow-Range filter (Truong & Yuksel 2018) ─────────────────────────────
// Separable, edge-aware depth smoothing that MERGES the particle sphere-imposters
// into one continuous surface — killing the "needle / split-line" artifacts a
// plain bilateral leaves at silhouettes and on fast-moving thin sheets — WITHOUT
// bleeding a near surface over a far one. Background / far neighbours are CLAMPED
// into a narrow window around the centre depth (so the silhouette pulls smooth);
// neighbours that are markedly CLOSER are discarded (they belong to a nearer
// surface). Same bindings / constants / pass wiring as the old bilateral, so only
// the math changed.
@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f {
    let depth: f32 = abs(textureLoad(texture, vec2u(input.iuv), 0).r);

    if (depth >= 1e4) {
        return vec4f(vec3f(depth), 1.0);
    }

    let filter_size: i32 = max(1, min(i32(max_filter_size), i32(ceil(projected_particle_constant / depth))));

    let sigma: f32 = f32(filter_size) / 3.0;
    let two_sigma: f32 = 2.0 * sigma * sigma;

    // Narrow depth window around the centre surface (in view-space depth units).
    let near_cut: f32  = depth_threshold * 0.5; // discard neighbours this much CLOSER
    let far_clamp: f32 = depth_threshold;       // clamp neighbours farther than this

    var sum: f32 = 0.0;
    var wsum: f32 = 0.0;
    for (var x: i32 = -filter_size; x <= filter_size; x++) {
        let coords: vec2f = vec2f(f32(x));
        var sampled: f32 = abs(textureLoad(texture, vec2u(input.iuv + coords * uniforms.blur_dir), 0).r);

        let rr: f32 = dot(coords, coords);
        let w: f32 = exp(-rr / two_sigma);

        // Background -> pin to the far bound so the edge smooths inward (not rejected).
        if (sampled >= 1e4) {
            sampled = depth + far_clamp;
        }

        let rd: f32 = sampled - depth;
        if (rd < -near_cut) {
            continue; // a closer surface: don't smear it across this one
        }
        if (rd > far_clamp) {
            sampled = depth + far_clamp; // clamp far samples into the narrow window
        }

        sum += sampled * w;
        wsum += w;
    }

    if (wsum <= 0.0) {
        return vec4f(depth, 0.0, 0.0, 1.0);
    }
    return vec4f(sum / wsum, 0.0, 0.0, 1.0);
}
`;
