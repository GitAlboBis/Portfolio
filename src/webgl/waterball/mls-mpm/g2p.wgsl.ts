export default `struct Particle {
    position: vec3f, 
    v: vec3f, 
    C: mat3x3f, 
}
struct Cell {
    vx: i32, 
    vy: i32, 
    vz: i32, 
    mass: i32, 
}

override fixed_point_multiplier: f32; 
override dt: f32; 

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<storage, read> cells: array<Cell>;
@group(0) @binding(2) var<uniform> real_box_size: vec3f;
@group(0) @binding(3) var<uniform> init_box_size: vec3f;
@group(0) @binding(4) var<uniform> numParticles: u32;
@group(0) @binding(5) var<uniform> sphereRadius: f32;

fn decodeFixedPoint(fixed_point: i32) -> f32 {
	return f32(fixed_point) / fixed_point_multiplier;
}

// closest point on segment a->b to p (medial-axis distance for the "A" confinement)
fn closestOnSeg(p: vec2f, a: vec2f, b: vec2f) -> vec2f {
	let ab = b - a;
	let t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
	return a + t * ab;
}


@compute @workgroup_size(64)
fn g2p(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x < numParticles) {
        particles[id.x].v = vec3f(0.);
        var weights: array<vec3f, 3>;

        let particle = particles[id.x];
        let cell_idx: vec3f = floor(particle.position);
        let cell_diff: vec3f = particle.position - (cell_idx + 0.5f);
        weights[0] = 0.5f * (0.5f - cell_diff) * (0.5f - cell_diff);
        weights[1] = 0.75f - cell_diff * cell_diff;
        weights[2] = 0.5f * (0.5f + cell_diff) * (0.5f + cell_diff);

        var B: mat3x3f = mat3x3f(vec3f(0.), vec3f(0.), vec3f(0.));
        for (var gx = 0; gx < 3; gx++) {
            for (var gy = 0; gy < 3; gy++) {
                for (var gz = 0; gz < 3; gz++) {
                    let weight: f32 = weights[gx].x * weights[gy].y * weights[gz].z;
                    let cell_x: vec3f = vec3f(
                        cell_idx.x + f32(gx) - 1., 
                        cell_idx.y + f32(gy) - 1.,
                        cell_idx.z + f32(gz) - 1.  
                    );
                    let cell_dist: vec3f = (cell_x + 0.5f) - particle.position;
                    let cell_index: i32 = 
                        i32(cell_x.x) * i32(init_box_size.y) * i32(init_box_size.z) + 
                        i32(cell_x.y) * i32(init_box_size.z) + 
                        i32(cell_x.z);
                    let weighted_velocity: vec3f = vec3f(
                        decodeFixedPoint(cells[cell_index].vx), 
                        decodeFixedPoint(cells[cell_index].vy), 
                        decodeFixedPoint(cells[cell_index].vz)
                    ) * weight;
                    let term: mat3x3f = mat3x3f(
                        weighted_velocity * cell_dist.x, 
                        weighted_velocity * cell_dist.y, 
                        weighted_velocity * cell_dist.z
                    );

                    B += term;

                    particles[id.x].v += weighted_velocity;
                }
            }
        }

        particles[id.x].C = B * 4.0f;
        particles[id.x].position += particles[id.x].v * dt;
        particles[id.x].position = vec3f(
            clamp(particles[id.x].position.x, 1., real_box_size.x - 2.), 
            clamp(particles[id.x].position.y, 1., real_box_size.y - 2.), 
            clamp(particles[id.x].position.z, 1., real_box_size.z - 2.)
        );

        // ---- "A" glyph confinement: a FIRM wall holds the incompressible fluid INSIDE the
        // stroke half-width -> a solid, filled letter (no inflate, which would hollow it).
        let P = vec2f(particles[id.x].position.x, particles[id.x].position.y);
        let apex  = vec2f(40.0, 48.0);
        let lfoot = vec2f(26.0, 12.0);
        let rfoot = vec2f(54.0, 12.0);
        let tcross = (48.0 - 26.0) / (48.0 - 12.0);
        let cl = apex + (lfoot - apex) * tcross;
        let cr = apex + (rfoot - apex) * tcross;
        let q1 = closestOnSeg(P, apex, lfoot);
        let q2 = closestOnSeg(P, apex, rfoot);
        let q3 = closestOnSeg(P, cl, cr);
        var closest = q1;
        var dmin = distance(P, q1);
        let e2 = distance(P, q2);
        if (e2 < dmin) { closest = q2; dmin = e2; }
        let e3 = distance(P, q3);
        if (e3 < dmin) { closest = q3; dmin = e3; }
        let halfW = 5.0;
        let toSkel = closest - P;
        let dSkel = max(length(toSkel), 1e-4);
        let nSkel = toSkel / dSkel;
        if (dmin > halfW) {
            particles[id.x].v += vec3f(nSkel * (dmin - halfW) * 6.0, 0.0);
        }
        particles[id.x].v += vec3f(nSkel * 0.05, 0.0); // gentle cohesion
        let zc = real_box_size.z * 0.5;
        let zh = 5.0;
        let dz = particles[id.x].position.z - zc;
        if (abs(dz) > zh) {
            particles[id.x].v.z += (sign(dz) * zh - dz) * 6.0;
        }
        let cC = vec3f(real_box_size.x * 0.5, real_box_size.y * 0.5, real_box_size.z * 0.5);
        let dC = particles[id.x].position - cC;
        let safeR = max(sphereRadius, length(real_box_size));
        if (dot(dC, dC) > safeR * safeR) {
            particles[id.x].v += -normalize(dC) * 0.5;
        }

        
        let k = 3.0;
        let wall_stiffness = 1.0;
        let x_n: vec3f = particles[id.x].position + particles[id.x].v * dt * k;
        let wall_min: vec3f = vec3f(3.);
        let wall_max: vec3f = real_box_size - 4.;
        if (x_n.x < wall_min.x) { particles[id.x].v.x += wall_stiffness * (wall_min.x - x_n.x); }
        if (x_n.x > wall_max.x) { particles[id.x].v.x += wall_stiffness * (wall_max.x - x_n.x); }
        if (x_n.y < wall_min.y) { particles[id.x].v.y += wall_stiffness * (wall_min.y - x_n.y); }
        if (x_n.y > wall_max.y) { particles[id.x].v.y += wall_stiffness * (wall_max.y - x_n.y); }
        if (x_n.z < wall_min.z) { particles[id.x].v.z += wall_stiffness * (wall_min.z - x_n.z); }
        if (x_n.z > wall_max.z) { particles[id.x].v.z += wall_stiffness * (wall_max.z - x_n.z); }
    }
}`;
