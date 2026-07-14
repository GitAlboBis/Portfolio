export default `@group(0) @binding(1) var texture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uniforms: FilterUniforms;

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) iuv: vec2f
}

struct FilterUniforms {
    blur_dir: vec2f,
}

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f {
    // rg: r = thickness, g = speed-weighted thickness (the foam signal) — both
    // blurred together so their ratio (mean speed) stays consistent.
    var thickness: vec2f = textureLoad(texture, vec2u(input.iuv), 0).rg;
    if (thickness.r == 0.) {
        return vec4f(0., 0., 0., 1.);
    }

    var filter_size: i32 = 30;
    var sigma: f32 = f32(filter_size) / 3.0;
    var two_sigma: f32 = 2.0 * sigma * sigma;

    var sum = vec2f(0.);
    var wsum = 0.;

    for (var x: i32 = -filter_size; x <= filter_size; x++) {
        var coords: vec2f = vec2f(f32(x));
        var sampled_thickness: vec2f = textureLoad(texture, vec2u(input.iuv + uniforms.blur_dir * coords), 0).rg;

        var w: f32 = exp(-coords.x * coords.x / two_sigma);

        sum += sampled_thickness * w;
        wsum += w;
    }

    sum /= wsum;

    return vec4f(sum, 0., 1.);
}`;
