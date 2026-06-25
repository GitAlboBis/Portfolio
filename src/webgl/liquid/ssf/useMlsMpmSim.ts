"use client";

import * as THREE from "three/webgpu";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Fn,
  instanceIndex,
  instancedArray,
  uniform,
  float,
  int,
  If,
  atomicAdd,
  atomicLoad,
  atomicStore,
  floor,
  max,
  min,
  pow,
  sqrt,
  vec2,
  vec3,
  clamp,
  select,
} from "three/tsl";
import { usePointerStore } from "@/webgl/store/pointerStore";

/*
  FAITHFUL TSL port of matsuoka-601/waterball's MLS-MPM fluid solver
  (mls-mpm/*.wgsl). A real Material-Point-Method fluid: particles scatter mass +
  momentum onto a background grid (p2g, atomic fixed-point adds), the grid is
  updated (boundary + mouse force), then gathered back (g2p) with an APIC affine
  matrix C; pressure (equation of state) + viscosity make it behave like
  incompressible water. There is NO gravity — the blob is held cohesive by a
  radial force toward a target shape (waterball: a sphere; ours: an "A" later).

  The 3x3x3 grid stencil is JS-unrolled (TSL can't index a weight array with a
  dynamic loop counter). The sim runs in GRID space; `copyToRender` writes
  positions SCALED into scene space, which the SSF render manager consumes exactly
  like the old spring sim — so SSFHero only changes which sim hook it calls.
*/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = any;

// ---- solver constants (waterball mls-mpm.ts) ----
const FPM = 1e7; // fixed_point_multiplier for atomic int accumulation
const DT = 0.2;
const SUBSTEPS = 3; // more settling per frame -> evener fill + livelier ripple
const STIFFNESS = 4.0; // firmer pressure response -> dense clumps spread out faster
const REST_DENSITY = 4.0;
const VISCOSITY = 0.1;

// ---- domain (a thin slab box that frames an upright "A") ----
const GX = 48;
const GY = 64;
const GZ = 18;
const GRID_COUNT = GX * GY * GZ;

// cohesion target radius (sphere validation step)
const TARGET_RADIUS = 15.0;

// grid space -> scene space: centre the box at the origin; box height -> ~2.4 units.
const SCENE_SCALE = 2.4 / GY;

// ---- "A" skeleton in grid XY (box 48x64): apex, two feet, crossbar ----
const A_APEX: [number, number] = [24, 56];
const A_LFOOT: [number, number] = [11, 7];
const A_RFOOT: [number, number] = [37, 7];
const A_CL: [number, number] = [15.6, 26]; // crossbar left point (on the left diagonal)
const A_CR: [number, number] = [32.4, 26]; // crossbar right point
const A_HALF = 4.6; // stroke half-width (fluid tube radius around the skeleton)
const A_ZC = GZ / 2; // slab centre in z
const A_ZH = 4.0; // slab half-thickness (keeps the letter a thin slab)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node2 = any;
// closest point on segment a->b to (px,py); a,b are JS-constant endpoints
function segClosest(px: Node2, py: Node2, a: [number, number], b: [number, number]): Node2 {
  const abx = b[0] - a[0];
  const aby = b[1] - a[1];
  const denom = abx * abx + aby * aby || 1;
  const t = clamp(
    px.sub(a[0]).mul(abx).add(py.sub(a[1]).mul(aby)).div(denom),
    float(0),
    float(1),
  );
  return vec2(t.mul(abx).add(a[0]), t.mul(aby).add(a[1]));
}

export type FluidSim = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  positions: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uRadius: any;
};

// iterate the 27-cell quadratic stencil at JS-compile time
function stencil(cb: (gx: number, gy: number, gz: number) => void) {
  for (let gx = 0; gx < 3; gx++)
    for (let gy = 0; gy < 3; gy++) for (let gz = 0; gz < 3; gz++) cb(gx, gy, gz);
}

export function useMlsMpmSim(count: number): FluidSim {
  const sim = useMemo(() => {
    const N = count;

    // particle state (grid space)
    const position = instancedArray(N, "vec3");
    const velocity = instancedArray(N, "vec3");
    // APIC affine matrix C as 3 COLUMNS (mat3 = [c0|c1|c2]; M*v = c0*v.x+c1*v.y+c2*v.z)
    const c0 = instancedArray(N, "vec3");
    const c1 = instancedArray(N, "vec3");
    const c2 = instancedArray(N, "vec3");
    const density = instancedArray(N, "float");
    const renderPos = instancedArray(N, "vec3"); // scene space, consumed by SSF render

    // background grid: momentum (x,y,z) + mass as fixed-point ATOMIC ints
    // (three's d.ts misspells the method `setAtmoic`; the runtime method is
    // `setAtomic`, so call it through the loose Node alias to satisfy the compiler.)
    const gVx: Node = instancedArray(GRID_COUNT, "int");
    const gVy: Node = instancedArray(GRID_COUNT, "int");
    const gVz: Node = instancedArray(GRID_COUNT, "int");
    const gMass: Node = instancedArray(GRID_COUNT, "int");
    gVx.setAtomic(true);
    gVy.setAtomic(true);
    gVz.setAtomic(true);
    gMass.setAtomic(true);

    const uMouse = uniform(new THREE.Vector3(9999, 9999, 9999)); // grid-space mouse
    const uMouseVel = uniform(new THREE.Vector3(0, 0, 0)); // grid-space mouse velocity
    const uMouseRadius = uniform(7.0);
    const uTime = uniform(0); // animation clock for the ambient surface motion
    const uRadius = uniform(0.05); // SSF render sphere radius (scene units) — bigger = smoother merged surface

    const enc = (f: Node): Node => int(f.mul(FPM));
    const dec = (i: Node): Node => float(i).div(FPM);

    // cell (x,y,z float) -> clamped linear index (waterball ordering: x*GY*GZ + y*GZ + z)
    const ci = (x: Node, y: Node, z: Node): Node => {
      const xi = int(max(min(x, float(GX - 1)), float(0)));
      const yi = int(max(min(y, float(GY - 1)), float(0)));
      const zi = int(max(min(z, float(GZ - 1)), float(0)));
      return xi.mul(int(GY * GZ)).add(yi.mul(int(GZ))).add(zi);
    };

    // quadratic B-spline weights for an axis, given the fractional cell offset
    const wOf = (d: Node): [Node, Node, Node] => [
      float(0.5).mul(float(0.5).sub(d)).mul(float(0.5).sub(d)),
      float(0.75).sub(d.mul(d)),
      float(0.5).mul(float(0.5).add(d)).mul(float(0.5).add(d)),
    ];

    const boxCenter = vec3(GX / 2, GY / 2, GZ / 2);

    // per-particle pseudo-random in [0,1) from the instance index
    const hash = (m: number): Node => float(instanceIndex).mul(m).sin().mul(43758.5453).fract();

    // ---- init: distribute particles ALONG the "A" skeleton (starts as the letter,
    // and at a sane density so pressure doesn't blow up). 42% left diag, 42% right
    // diag, 16% crossbar; jittered within the stroke half-width and z-slab. ----
    const computeInit = Fn(() => {
      const t = hash(12.9898).toVar();
      const jx = hash(78.233).sub(0.5).toVar();
      const jy = hash(37.719).sub(0.5).toVar();
      const jz = hash(93.989).sub(0.5).toVar();
      const segSel = hash(45.164).toVar();
      const segL = segSel.lessThan(0.42);
      const segR = segSel.lessThan(0.84); // reached only when !segL => [0.42,0.84)
      const ax = select(segL, float(A_APEX[0]), select(segR, float(A_APEX[0]), float(A_CL[0])));
      const ay = select(segL, float(A_APEX[1]), select(segR, float(A_APEX[1]), float(A_CL[1])));
      const bx = select(segL, float(A_LFOOT[0]), select(segR, float(A_RFOOT[0]), float(A_CR[0])));
      const by = select(segL, float(A_LFOOT[1]), select(segR, float(A_RFOOT[1]), float(A_CR[1])));
      const px = ax.add(t.mul(bx.sub(ax))).add(jx.mul(2 * A_HALF));
      const py = ay.add(t.mul(by.sub(ay))).add(jy.mul(2 * A_HALF));
      const pz = float(A_ZC).add(jz.mul(2 * A_ZH));
      position.element(instanceIndex).assign(vec3(px, py, pz));
      velocity.element(instanceIndex).assign(vec3(0));
      c0.element(instanceIndex).assign(vec3(0));
      c1.element(instanceIndex).assign(vec3(0));
      c2.element(instanceIndex).assign(vec3(0));
    })().compute(N);

    // ---- clearGrid ----
    const computeClear = Fn(() => {
      atomicStore(gVx.element(instanceIndex), int(0));
      atomicStore(gVy.element(instanceIndex), int(0));
      atomicStore(gVz.element(instanceIndex), int(0));
      atomicStore(gMass.element(instanceIndex), int(0));
    })().compute(GRID_COUNT);

    // ---- p2g_1: scatter mass + (v + C*dist) momentum ----
    const computeP2G1 = Fn(() => {
      const pos = position.element(instanceIndex).toVar();
      const v = velocity.element(instanceIndex).toVar();
      const C0 = c0.element(instanceIndex).toVar();
      const C1 = c1.element(instanceIndex).toVar();
      const C2 = c2.element(instanceIndex).toVar();
      const cellIdx = floor(pos).toVar();
      const diff = pos.sub(cellIdx.add(0.5)).toVar();
      const wx = wOf(diff.x);
      const wy = wOf(diff.y);
      const wz = wOf(diff.z);
      stencil((gx, gy, gz) => {
        const weight = wx[gx].mul(wy[gy]).mul(wz[gz]);
        const cx = cellIdx.x.add(gx - 1);
        const cy = cellIdx.y.add(gy - 1);
        const cz = cellIdx.z.add(gz - 1);
        const cellDist = vec3(cx.add(0.5).sub(pos.x), cy.add(0.5).sub(pos.y), cz.add(0.5).sub(pos.z));
        // Q = C * cellDist
        const Q = C0.mul(cellDist.x).add(C1.mul(cellDist.y)).add(C2.mul(cellDist.z));
        const vel = v.add(Q).mul(weight); // mass = 1
        const idx = ci(cx, cy, cz);
        atomicAdd(gMass.element(idx), enc(weight));
        atomicAdd(gVx.element(idx), enc(vel.x));
        atomicAdd(gVy.element(idx), enc(vel.y));
        atomicAdd(gVz.element(idx), enc(vel.z));
      });
    })().compute(N);

    // ---- p2g_2: density -> pressure+viscosity stress -> scatter momentum ----
    const computeP2G2 = Fn(() => {
      const pos = position.element(instanceIndex).toVar();
      const C0 = c0.element(instanceIndex).toVar();
      const C1 = c1.element(instanceIndex).toVar();
      const C2 = c2.element(instanceIndex).toVar();
      const cellIdx = floor(pos).toVar();
      const diff = pos.sub(cellIdx.add(0.5)).toVar();
      const wx = wOf(diff.x);
      const wy = wOf(diff.y);
      const wz = wOf(diff.z);

      const dens = float(0).toVar();
      stencil((gx, gy, gz) => {
        const weight = wx[gx].mul(wy[gy]).mul(wz[gz]);
        const idx = ci(cellIdx.x.add(gx - 1), cellIdx.y.add(gy - 1), cellIdx.z.add(gz - 1));
        dens.addAssign(dec(atomicLoad(gMass.element(idx))).mul(weight));
      });
      density.element(instanceIndex).assign(dens);

      const volume = float(1).div(max(dens, float(1e-5)));
      const pressure = max(float(0), float(STIFFNESS).mul(pow(dens.div(REST_DENSITY), float(5)).sub(1)));

      // strain = C + C^T ; stress = -pressure*I + viscosity*strain  (columns)
      const s0 = vec3(C0.x.add(C0.x), C0.y.add(C1.x), C0.z.add(C2.x));
      const s1 = vec3(C1.x.add(C0.y), C1.y.add(C1.y), C1.z.add(C2.y));
      const s2 = vec3(C2.x.add(C0.z), C2.y.add(C1.z), C2.z.add(C2.z));
      const k = float(-1).mul(volume).mul(4).mul(DT).toVar(); // -volume*4*dt
      const st0 = vec3(pressure.negate().add(VISCOSITY * 0).add(float(VISCOSITY).mul(s0.x)), float(VISCOSITY).mul(s0.y), float(VISCOSITY).mul(s0.z)).mul(k);
      const st1 = vec3(float(VISCOSITY).mul(s1.x), pressure.negate().add(float(VISCOSITY).mul(s1.y)), float(VISCOSITY).mul(s1.z)).mul(k);
      const st2 = vec3(float(VISCOSITY).mul(s2.x), float(VISCOSITY).mul(s2.y), pressure.negate().add(float(VISCOSITY).mul(s2.z))).mul(k);

      stencil((gx, gy, gz) => {
        const weight = wx[gx].mul(wy[gy]).mul(wz[gz]);
        const cx = cellIdx.x.add(gx - 1);
        const cy = cellIdx.y.add(gy - 1);
        const cz = cellIdx.z.add(gz - 1);
        const cellDist = vec3(cx.add(0.5).sub(pos.x), cy.add(0.5).sub(pos.y), cz.add(0.5).sub(pos.z));
        // momentum = (stress * cellDist) * weight
        const m = st0.mul(cellDist.x).add(st1.mul(cellDist.y)).add(st2.mul(cellDist.z)).mul(weight);
        const idx = ci(cx, cy, cz);
        atomicAdd(gVx.element(idx), enc(m.x));
        atomicAdd(gVy.element(idx), enc(m.y));
        atomicAdd(gVz.element(idx), enc(m.z));
      });
    })().compute(N);

    // ---- updateGrid: momentum/mass, mouse force, box-wall velocity clamp ----
    const computeUpdateGrid = Fn(() => {
      const idx = instanceIndex;
      const massRaw: Node = atomicLoad(gMass.element(idx)); // AtomicFunctionNode -> loose Node
      const massI: Node = float(massRaw).toVar(); // raw fixed-point mass
      If(massI.greaterThan(float(0)), () => {
        const mass = massI.div(FPM); // decoded mass
        const v = vec3(
          dec(atomicLoad(gVx.element(idx))),
          dec(atomicLoad(gVy.element(idx))),
          dec(atomicLoad(gVz.element(idx))),
        ).div(mass).toVar();

        // cell coords from linear index (manual integer modulo: a%b = a - (a/b)*b)
        const ixi = int(idx).toVar();
        const iq = ixi.div(int(GZ)).toVar(); // idx / GZ
        const x = float(iq.div(int(GY)));
        const y = float(iq.sub(iq.div(int(GY)).mul(int(GY))));
        const z = float(ixi.sub(ixi.div(int(GZ)).mul(int(GZ))));

        // mouse push (grid space): add velocity toward pointer motion within radius
        const d = vec3(x, y, z).sub(uMouse);
        const d2 = d.dot(d);
        If(d2.lessThan(uMouseRadius.mul(uMouseRadius)), () => {
          const strength = uMouseRadius.mul(uMouseRadius).sub(d2).div(uMouseRadius.mul(uMouseRadius)).mul(0.18);
          v.addAssign(uMouseVel.mul(strength));
        });

        // box walls: zero the normal velocity at the boundary
        If(x.lessThan(float(2)).or(x.greaterThan(float(GX - 3))), () => v.x.assign(0));
        If(y.lessThan(float(2)).or(y.greaterThan(float(GY - 3))), () => v.y.assign(0));
        If(z.lessThan(float(2)).or(z.greaterThan(float(GZ - 3))), () => v.z.assign(0));

        atomicStore(gVx.element(idx), enc(v.x));
        atomicStore(gVy.element(idx), enc(v.y));
        atomicStore(gVz.element(idx), enc(v.z));
      });
    })().compute(GRID_COUNT);

    // ---- g2p: gather velocity + APIC C, advect, confine to shape, wall push ----
    const computeG2P = Fn(() => {
      const pos = position.element(instanceIndex).toVar();
      const cellIdx = floor(pos).toVar();
      const diff = pos.sub(cellIdx.add(0.5)).toVar();
      const wx = wOf(diff.x);
      const wy = wOf(diff.y);
      const wz = wOf(diff.z);

      const v = vec3(0).toVar();
      const B0 = vec3(0).toVar();
      const B1 = vec3(0).toVar();
      const B2 = vec3(0).toVar();
      stencil((gx, gy, gz) => {
        const weight = wx[gx].mul(wy[gy]).mul(wz[gz]);
        const cx = cellIdx.x.add(gx - 1);
        const cy = cellIdx.y.add(gy - 1);
        const cz = cellIdx.z.add(gz - 1);
        const cellDist = vec3(cx.add(0.5).sub(pos.x), cy.add(0.5).sub(pos.y), cz.add(0.5).sub(pos.z));
        const idx = ci(cx, cy, cz);
        const wv = vec3(
          dec(atomicLoad(gVx.element(idx))),
          dec(atomicLoad(gVy.element(idx))),
          dec(atomicLoad(gVz.element(idx))),
        ).mul(weight);
        v.addAssign(wv);
        // B += outer(wv, cellDist) ; columns scaled by cellDist components
        B0.addAssign(wv.mul(cellDist.x));
        B1.addAssign(wv.mul(cellDist.y));
        B2.addAssign(wv.mul(cellDist.z));
      });

      c0.element(instanceIndex).assign(B0.mul(4));
      c1.element(instanceIndex).assign(B1.mul(4));
      c2.element(instanceIndex).assign(B2.mul(4));

      pos.addAssign(v.mul(DT));
      pos.assign(
        vec3(
          max(min(pos.x, float(GX - 2)), float(1)),
          max(min(pos.y, float(GY - 2)), float(1)),
          max(min(pos.z, float(GZ - 2)), float(1)),
        ),
      );

      // ---- shape confinement: pull the fluid onto the "A" skeleton (XY) + z-slab.
      // The MLS-MPM pressure pushes particles apart (incompressible); this pull
      // holds them within A_HALF of the letter strokes -> the fluid fills an "A".
      const P2 = vec2(pos.x, pos.y);
      const sc1 = segClosest(pos.x, pos.y, A_APEX, A_LFOOT);
      const sc2 = segClosest(pos.x, pos.y, A_APEX, A_RFOOT);
      const sc3 = segClosest(pos.x, pos.y, A_CL, A_CR);
      const d1 = sc1.sub(P2).length();
      const d2 = sc2.sub(P2).length();
      const d3 = sc3.sub(P2).length();
      const cA = select(d1.lessThan(d2), sc1, sc2);
      const dA = min(d1, d2);
      const closest = select(dA.lessThan(d3), cA, sc3).toVar();
      const dmin = min(dA, d3).toVar();
      const toSkel = closest.sub(P2).toVar();
      const dir2 = toSkel.div(max(dmin, float(1e-4))).toVar();
      // Soft container: push back toward the skeleton ONLY when OUTSIDE the stroke
      // half-width. Inside, MLS-MPM pressure spreads the fluid EVENLY. (The old
      // constant centerline pull piled particles into the dark apex/crossbar clumps.)
      If(dmin.greaterThan(float(A_HALF)), () => {
        const push = dmin.sub(A_HALF).mul(3.0);
        v.x.addAssign(dir2.x.mul(push));
        v.y.addAssign(dir2.y.mul(push));
      });
      // z-slab container: keep the letter a thin slab, also push-on-exit only
      const dz = float(A_ZC).sub(pos.z).toVar();
      If(dz.abs().greaterThan(float(A_ZH)), () => {
        v.z.addAssign(dz.sub(float(A_ZH).mul(dz.sign())).mul(0.8));
      });

      // ---- soft wall push (predictive) ----
      const k = float(3.0);
      const xn = pos.add(v.mul(DT).mul(k));
      const wmin = float(3);
      If(xn.x.lessThan(wmin), () => v.x.addAssign(wmin.sub(xn.x)));
      If(xn.x.greaterThan(float(GX - 4)), () => v.x.addAssign(float(GX - 4).sub(xn.x)));
      If(xn.y.lessThan(wmin), () => v.y.addAssign(wmin.sub(xn.y)));
      If(xn.y.greaterThan(float(GY - 4)), () => v.y.addAssign(float(GY - 4).sub(xn.y)));
      If(xn.z.lessThan(wmin), () => v.z.addAssign(wmin.sub(xn.z)));
      If(xn.z.greaterThan(float(GZ - 4)), () => v.z.addAssign(float(GZ - 4).sub(xn.z)));

      // ---- ambient life: a gentle, ever-present swirl so the surface always shimmers
      // like real water (small amplitude so the "A" stays readable). ----
      const tt = uTime;
      v.x.addAssign(pos.y.mul(0.6).add(tt.mul(1.7)).sin().mul(0.045));
      v.y.addAssign(pos.x.mul(0.5).add(tt.mul(1.3)).cos().mul(0.035));
      v.z.addAssign(pos.x.add(pos.y).mul(0.4).add(tt.mul(2.1)).sin().mul(0.03));

      velocity.element(instanceIndex).assign(v);
      position.element(instanceIndex).assign(pos);
    })().compute(N);

    // ---- copyToRender: grid space -> scene space for the SSF render ----
    const computeCopy = Fn(() => {
      const pos = position.element(instanceIndex);
      renderPos.element(instanceIndex).assign(pos.sub(boxCenter).mul(SCENE_SCALE));
    })().compute(N);

    return {
      uMouse,
      uMouseVel,
      uTime,
      uRadius,
      renderPos,
      computeInit,
      computeClear,
      computeP2G1,
      computeP2G2,
      computeUpdateGrid,
      computeG2P,
      computeCopy,
    };
  }, [count]);

  const inited = useRef(false);

  useFrame((state) => {
    const r = state.gl as unknown as THREE.WebGPURenderer;
    if (typeof r.compute !== "function") return;

    if (!inited.current) {
      r.compute(sim.computeInit);
      inited.current = true;
    }

    sim.uTime.value = state.clock.elapsedTime; // drive the ambient surface motion

    // map the pointer (scene space) into grid space for the mouse force
    const p = usePointerStore.getState();
    if (p.active) {
      sim.uMouse.value.set(
        p.world.x / SCENE_SCALE + GX / 2,
        p.world.y / SCENE_SCALE + GY / 2,
        p.world.z / SCENE_SCALE + GZ / 2,
      );
      sim.uMouseVel.value.set(
        p.worldVel.x / SCENE_SCALE,
        p.worldVel.y / SCENE_SCALE,
        p.worldVel.z / SCENE_SCALE,
      );
    } else {
      sim.uMouse.value.set(9999, 9999, 9999);
      sim.uMouseVel.value.set(0, 0, 0);
    }

    for (let s = 0; s < SUBSTEPS; s++) {
      r.compute(sim.computeClear);
      r.compute(sim.computeP2G1);
      r.compute(sim.computeP2G2);
      r.compute(sim.computeUpdateGrid);
      r.compute(sim.computeG2P);
    }
    r.compute(sim.computeCopy);
  }, -1);

  return { positions: sim.renderPos, uRadius: sim.uRadius };
}

export { SCENE_SCALE, GX, GY, GZ };
