/*
  The "liquid A" material: a MeshPhysicalNodeMaterial (transmission/refraction)
  whose surface is displaced by analytic 3D ring waves emanating from pointer
  impacts, with normals recomputed analytically and foam on the crests.

  All maths run in the mesh LOCAL space and the waves use 3D DISTANCE from the
  impact point (NOT UV space), so there are no UV-seam artefacts. The recomputed
  normal is stored in a vertex `varying` and fed to `normalNode` via
  `transformNormalToView` — the canonical three.js displacement pattern
  (see examples/webgpu_tsl_procedural_terrain).

  API verified against three 0.184 via Context7: imports split between
  `three/webgpu` (renderer + node materials) and `three/tsl` (nodes); `Fn`
  (not the obsolete `tslFn`); `positionNode` SUMS onto `positionLocal`.
*/
import * as THREE from "three/webgpu";
import {
  Fn,
  float,
  vec3,
  uniform,
  varying,
  positionLocal,
  normalLocal,
  positionWorld,
  mix,
  cross,
  normalize,
  distance,
  clamp,
  smoothstep,
  transformNormalToView,
  mx_noise_float,
} from "three/tsl";
import type { LiquidParams } from "./liquidConfig";
import { LIQUID_COLORS } from "./liquidConfig";

export type LiquidMaterial = ReturnType<typeof buildLiquidWaterMaterial>;

export function buildLiquidWaterMaterial(opts: {
  params: LiquidParams;
  colors: typeof LIQUID_COLORS;
  impactCount: number;
}) {
  const { params: P, colors: C, impactCount: N } = opts;

  // ---- clock + wave/foam uniforms (all live-tunable) ----
  const uTime = uniform(0);
  const uAmp = uniform(P.amplitude);
  const uFreq = uniform(P.frequency);
  const uSpeed = uniform(P.speed);
  const uRingSharp = uniform(P.ringSharpness);
  const uTimeDecay = uniform(P.timeDecay);
  const uSpaceDecay = uniform(P.spaceDecay);
  const uBgAmp = uniform(P.bgAmplitude);
  const uBgScale = uniform(P.bgScale);
  const uBgSpeed = uniform(P.bgSpeed);
  const uFoamThreshold = uniform(P.foamThreshold);
  const uFoamWidth = uniform(P.foamWidth);
  const uFoamGain = uniform(P.foamGain);
  const uFoamNoiseScale = uniform(P.foamNoiseScale);
  const uFoamNoiseSpeed = uniform(P.foamNoiseSpeed);
  const uNormalShift = uniform(P.normalShift);
  const uRoughness = uniform(P.roughness);

  const uTint = uniform(new THREE.Color(C.tint[0], C.tint[1], C.tint[2]));
  const uFoamColor = uniform(new THREE.Color(C.foam[0], C.foam[1], C.foam[2]));

  // Circular impact buffer: xyz = local impact point, w = impact time.
  // Inactive slots sit at w = -1000 so their (huge) age decays to ~0 contribution
  // with no branching and no NaNs (exp of a large negative underflows to 0).
  const impacts = Array.from(
    { length: N },
    () => uniform(new THREE.Vector4(0, 0, 0, -1000)),
  );

  // ---- height field at a local point (sum of ring impacts + idle motion) ----
  const heightAt = Fn(([p]: [any]) => {
    const h = float(0).toVar();

    for (let k = 0; k < N; k++) {
      const imp = impacts[k];
      const age = uTime.sub(imp.w); // seconds since this impact
      const d = distance(p, imp.xyz); // 3D distance from the impact point
      const radius = age.mul(uSpeed); // ring expands outward over time
      const band = d.sub(radius);
      const ring = band.mul(uFreq).sin();
      const widthEnv = band.mul(band).mul(uRingSharp).negate().exp(); // gaussian band
      const timeEnv = age.mul(uTimeDecay).negate().exp(); // fades over the ripple's life
      const spaceEnv = float(1).div(d.mul(uSpaceDecay).add(1)); // attenuate far away
      h.addAssign(ring.mul(uAmp).mul(widthEnv).mul(timeEnv).mul(spaceEnv));
    }

    // never fully still — a gentle drifting swell
    const bg = mx_noise_float(
      p.mul(uBgScale).add(vec3(0, 0, uTime.mul(uBgSpeed))),
      1,
      0,
    ).mul(uBgAmp);
    h.addAssign(bg);

    return clamp(h, float(-0.2), float(0.2)); // keep the mesh from self-inverting
  });

  // ---- vertex stage: displace along the normal + recompute the normal ----
  const vNormal = varying(vec3());
  const vSlope = varying(float());

  const material = new THREE.MeshPhysicalNodeMaterial();

  material.positionNode = Fn(() => {
    const n = normalLocal.normalize().toVar();
    const p = positionLocal.xyz.toVar();
    const eps = uNormalShift;

    // tangent basis with cross(T, B) === n. The front/back faces have n ≈ ±Z,
    // so the reference axis falls back to X there to avoid a degenerate cross.
    const ref = n.z.abs().lessThan(0.99).select(vec3(0, 0, 1), vec3(1, 0, 0));
    const T = normalize(cross(n, ref));
    const B = cross(n, T);

    const pT = p.add(T.mul(eps));
    const pB = p.add(B.mul(eps));

    const h0 = heightAt(p);
    const hT = heightAt(pT);
    const hB = heightAt(pB);

    // displace all three samples along the SAME rest normal (small-eps approx)
    const disp0 = p.add(n.mul(h0));
    const dispT = pT.add(n.mul(hT));
    const dispB = pB.add(n.mul(hB));

    const newN = normalize(cross(dispT.sub(disp0), dispB.sub(disp0)));
    vNormal.assign(newN);
    vSlope.assign(float(1).sub(newN.dot(n).saturate())); // 0 flat .. 1 steep

    return disp0; // SUMS onto positionLocal (never replaces it)
  })();

  // local→view space normal (the OBBLIGATORIO recompute, done right)
  material.normalNode = transformNormalToView(vNormal);

  // ---- fragment stage: foam on steep crests ----
  const foam = Fn(() => {
    const gate = smoothstep(
      uFoamThreshold,
      uFoamThreshold.add(uFoamWidth),
      vSlope.mul(uFoamGain),
    );
    // procedural noise in world space (no UV seams), scrolling over time
    const n2 = mx_noise_float(
      positionWorld.mul(uFoamNoiseScale).add(vec3(0, 0, uTime.mul(uFoamNoiseSpeed))),
      1,
      0,
    )
      .mul(0.5)
      .add(0.5);
    return gate.mul(n2).saturate();
  })();

  material.colorNode = mix(uTint, uFoamColor, foam);
  material.roughnessNode = mix(uRoughness, float(0.55), foam); // foam reads matte

  // ---- physical glass/water params (scalars enable the transmission pass) ----
  material.metalness = 0;
  material.transmission = P.transmission;
  material.ior = P.ior;
  material.thickness = P.thickness;
  material.attenuationColor = new THREE.Color(
    C.attenuation[0],
    C.attenuation[1],
    C.attenuation[2],
  );
  material.attenuationDistance = P.attenuationDistance;
  material.clearcoat = P.clearcoat; // thin wet sheen -> sharper sun glint
  material.clearcoatRoughness = 0.1;
  material.transparent = true;
  material.side = THREE.DoubleSide; // refraction reads through both faces
  // depthWrite stays TRUE (default): the "A" is a solid extrusion, so the front
  // and back walls need depth arbitration or they sort incorrectly through each
  // other. (depthWrite:false is only right for genuinely thin shells.)

  const uniforms = {
    uAmp,
    uFreq,
    uSpeed,
    uRingSharp,
    uTimeDecay,
    uSpaceDecay,
    uBgAmp,
    uBgScale,
    uBgSpeed,
    uFoamThreshold,
    uFoamWidth,
    uFoamGain,
    uFoamNoiseScale,
    uFoamNoiseSpeed,
    uNormalShift,
    uRoughness,
  };

  return {
    material,
    uTime,
    impacts,
    uniforms,
    dispose: () => material.dispose(),
  };
}
