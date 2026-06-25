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
struct SplashParams {
    restoreK: f32,
    speedGate: f32,
    drag: f32,
    leashRadius: f32,
}

override fixed_point_multiplier: f32;
override dt: f32; 

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<storage, read> cells: array<Cell>;
@group(0) @binding(2) var<uniform> real_box_size: vec3f;
@group(0) @binding(3) var<uniform> init_box_size: vec3f;
@group(0) @binding(4) var<uniform> numParticles: u32;
@group(0) @binding(5) var<uniform> sphereRadius: f32;
@group(0) @binding(6) var<storage, read> homes: array<f32>;
@group(0) @binding(7) var<uniform> splash: SplashParams;

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

        // ---- step 1b: "A" shape constraint via HOME positions (PBD attachment) ----
        // Every particle owns a "home" that fills the solid "A". A velocity-gated soft
        // pull reels it toward home: at rest the gate is full so the letter holds its
        // shape (and since the particle already sits ON its home, the pull is ~0 -> no
        // freeze); a fast mouse poke pushes speed above the gate threshold, the gate
        // closes, and the particle flies out unobstructed (the splash). As it slows the
        // gate re-opens and the restore brings it home to re-form the "A" (the undertow).
        // No firm wall -> nothing blocks the splash; no inflate -> no hollow shell.
        let home = vec3f(homes[3u * id.x], homes[3u * id.x + 1u], homes[3u * id.x + 2u]);
        let toHome = home - particles[id.x].position;
        let dist = length(toHome);
        let speed = length(particles[id.x].v);
        // speed gate (splash): near home, fast particles escape so a flick throws water out.
        let speedGateTerm = clamp(1.0 - speed / max(splash.speedGate, 1e-3), 0.0, 1.0);
        // LEASH: the further a particle strays past leashRadius, the more the gate is forced
        // back open (toward 1), so nothing escapes for good. This reels in the runaways that
        // continuous fast pokes would otherwise fling out to the invisible box walls.
        let leashWidth = 12.0;
        let leash = clamp((dist - splash.leashRadius) / leashWidth, 0.0, 1.0);
        let gate = max(speedGateTerm, leash);
        particles[id.x].v += toHome * (splash.restoreK * gate);
        // damping: a touch everywhere (drag). The leash + box-wall bounce + un-stick handle
        // strayed particles now, so no separate stray-damping term is needed.
        particles[id.x].v *= (1.0 - splash.drag);
        // hard safety: cap speed so a feedback loop can never blow a particle to infinity.
        let sp2 = dot(particles[id.x].v, particles[id.x].v);
        let maxSpeed = 60.0;
        if (sp2 > maxSpeed * maxSpeed) {
            particles[id.x].v *= maxSpeed / sqrt(sp2);
        }

        // UN-STICK: updateGrid zeroes the velocity ONLY of the outermost boundary cells
        // (x<2, etc.), which can TRAP a particle that penetrates there -- its velocity is
        // wiped before it can advect, so it stays glued even at rest. Nudge ONLY those
        // dead-cell particles home by POSITION (bypassing the grid). Kept tight (~2 units)
        // so particles bouncing in the 3..box-3 range are left alone -> the splash still
        // ricochets off the box walls naturally.
        let pEdge = particles[id.x].position;
        if (any(pEdge < vec3f(2.2)) || any(pEdge > real_box_size - vec3f(2.2))) {
            particles[id.x].position += toHome * 0.05;
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
