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
    inflate: f32,
    gravity: f32,
    drag: f32,
    restoreK: f32,
    speedGate: f32,
    leashRadius: f32,
    explode: f32,
    explodeOut: f32,
    explodeGrav: f32,
    explodeDamp: f32,
    explodeCap: f32,
}

override fixed_point_multiplier: f32;
override dt: f32;

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<storage, read> cells: array<Cell>;
@group(0) @binding(2) var<uniform> real_box_size: vec3f;
@group(0) @binding(3) var<uniform> init_box_size: vec3f;
@group(0) @binding(4) var<uniform> numParticles: u32;
@group(0) @binding(5) var<uniform> splash: SplashParams;

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

        // ===== "A" as a CONFINED, LIVING fluid (faithful to WaterBall's confined sphere) =====
        // WaterBall keeps a FREE fluid alive inside a sphere with a strong outward "inflate"
        // force that fills the volume, plus a gentle pull toward the center; incompressibility
        // turns that pair into PERPETUAL circulation -- the water never freezes. We reuse the
        // exact engine, but the "center" is the "A" MEDIAL AXIS: the water fills and churns
        // inside the "A" tube on its own and is confined to it, instead of being pinned to
        // fixed home points (which froze all motion and caused the recompose congestion).
        let p = particles[id.x].position;
        let apex = vec2f(40.0, 48.0);
        let lfoot = vec2f(26.0, 12.0);
        let rfoot = vec2f(54.0, 12.0);
        let tcross = (48.0 - 26.0) / (48.0 - 12.0);
        let cl = apex + (lfoot - apex) * tcross;
        let cr = apex + (rfoot - apex) * tcross;
        let zc = real_box_size.z * 0.5;
        // nearest point on the medial axis (3 segments) in XY
        let qa = closestOnSeg(p.xy, apex, lfoot);
        let qb = closestOnSeg(p.xy, apex, rfoot);
        let qd = closestOnSeg(p.xy, cl, cr);
        var m = qa;
        var dm = distance(p.xy, qa);
        let db = distance(p.xy, qb);
        if (db < dm) { dm = db; m = qb; }
        let dd = distance(p.xy, qd);
        if (dd < dm) { dm = dd; m = qd; }
        let axis = vec3f(m.x, m.y, zc);   // centerline point nearest this particle
        let toAxis = axis - p;            // vector from particle to the centerline
        let dAxis = length(toAxis);
        let dirIn = toAxis / max(dAxis, 1e-4);  // unit vector toward the centerline
        let halfW = 5.0;

        // SPEED comes from the grid (the mouse POKE arrives here too), measured BEFORE the
        // confinement forces so that a FAST poke opens the gate and the water flies OUT, while
        // the gentle inner churn stays under it. hold = how strongly this particle is held to
        // the "A": 1 for slow/far water (confined -> crisp letter, undertow), ~0 for a fast
        // poke (free -> the splash sprays out of the model). This single factor scales BOTH the
        // gravity and the recall, so nothing chokes the splash the way an ungated pull did.
        let speed = length(particles[id.x].v);
        let conf = clamp(1.0 - speed / max(splash.speedGate, 1e-3), 0.0, 1.0);
        let overflow = max(dAxis - halfW, 0.0);
        let leash = clamp(overflow / max(splash.leashRadius, 1e-3), 0.0, 1.0);
        let hold = max(conf, leash);

        // EXPLODE gate: as splash.explode 0->1 the confinement (inflate/gravity/recall)
        // is switched OFF so there are NO forces holding the water in the "A" -- it is
        // free to fly apart. calm = 1 at rest, 0 at full explode.
        let calm = clamp(1.0 - splash.explode, 0.0, 1.0);

        // CHURN ENGINE (inner, ALWAYS free -> perpetual self-motion like the original):
        // inside the tube push OUTWARD to fill the cross-section; this force never settles.
        if (dAxis < halfW) {
            particles[id.x].v += -(halfW - dAxis) * dirIn * splash.inflate * calm;
        }
        // gravity toward the centerline + recall of strayed water, BOTH scaled by hold so a
        // fast mouse poke escapes (splash) and slow/far water is reeled home (the undertow).
        particles[id.x].v += dirIn * (splash.gravity * hold) * calm;
        if (dAxis > halfW) {
            particles[id.x].v += dirIn * (overflow * splash.restoreK * hold) * calm;
        }
        // optional damping (default 0 keeps the churn alive, like the original)
        particles[id.x].v *= (1.0 - splash.drag);

        // EXPLODE beat (Direction A): a NATURAL water burst in SLOW MOTION -- a RADIAL
        // break in ALL directions (so it reads as an explosion of water, not a downward
        // rush) that then falls under gravity. All four feel knobs are leva-driven so
        // the slow-mo can be dialed live: explodeOut (radial force), explodeGrav
        // (gravity), explodeDamp (per-frame damping = how syrupy/slow), explodeCap (max
        // speed at full explode = the slow-motion ceiling). No white spikes (fluid.wgsl).
        if (splash.explode > 0.0) {
            let e = splash.explode;
            let center = real_box_size * 0.5;
            let outv = particles[id.x].position - center;
            let dirOut = outv / max(length(outv), 1e-3);
            let jitter = vec3f(
                sin(particles[id.x].position.y * 1.7 + particles[id.x].position.z),
                cos(particles[id.x].position.x * 1.3 + particles[id.x].position.y),
                sin(particles[id.x].position.x * 0.9 - particles[id.x].position.z * 1.1)
            );
            particles[id.x].v += (dirOut + jitter * 0.4) * splash.explodeOut * e;  // radial burst
            particles[id.x].v += vec3f(0.0, -splash.explodeGrav, 0.0) * e;         // gravity (falls after)
            particles[id.x].v *= (1.0 - splash.explodeDamp * e);                   // slow-mo damping
        }
        // hard safety + slow-mo: cap speed (low during the burst so nothing flings away,
        // normal at rest so the churn lives).
        let sp2 = dot(particles[id.x].v, particles[id.x].v);
        let maxSpeed = mix(60.0, splash.explodeCap, clamp(splash.explode, 0.0, 1.0));
        if (sp2 > maxSpeed * maxSpeed) {
            particles[id.x].v *= maxSpeed / sqrt(sp2);
        }

        // UN-STICK: updateGrid zeroes the velocity of the outermost boundary cells, which can
        // TRAP a particle that reaches them. Nudge only those dead-cell particles back toward
        // the "A" axis by POSITION (bypassing the grid) so they never glue to the box wall.
        let pEdge = particles[id.x].position;
        if (any(pEdge < vec3f(2.2)) || any(pEdge > real_box_size - vec3f(2.2))) {
            particles[id.x].position += toAxis * 0.05 * calm;
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
