export default `struct Particle {
    position: vec3f,
    v: vec3f,
    C: mat3x3f,
}

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> init_box_size: vec3f;
@group(0) @binding(2) var<uniform> numParticles: i32;

@compute @workgroup_size(1)
fn spawn() {
    let dx: f32 = 0.5;
    let center: vec3f = init_box_size / 2;
    let beg: vec3f = vec3f(center.x - 2.0, 24.0, center.z - 2.0); // inside the "A" + Z slab
    let vScale: f32 = 0.6;

    let dummy = numParticles;

    for (var i = 0; i < 10; i++) {
        for (var j = 0; j < 10; j++) {
            let offset = 10 * i + j;
            let pos = beg + vec3f(f32(i), f32(j), 0) * dx;
            particles[(numParticles - 1) - offset].position = pos;
            particles[(numParticles - 1) - offset].v = normalize(center - pos) * vScale;
            particles[(numParticles - 1) - offset].C = mat3x3f(vec3f(0.), vec3f(0.), vec3f(0.));
        }
    }
}`;
