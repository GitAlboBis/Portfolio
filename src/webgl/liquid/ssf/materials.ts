import * as THREE from "three/webgpu";
import {
  Fn,
  positionLocal,
  instanceIndex,
  modelViewMatrix,
  vec2,
  vec3,
  vec4,
  float,
  int,
  uniform,
  texture,
  pmremTexture,
  screenUV,
  screenSize,
  dot,
  cross,
  pow,
  clamp,
  oneMinus,
  mix,
  exp,
  abs,
  ceil,
  min,
  max,
  normalize,
  normalView,
  reflect,
  Loop,
  If,
} from "three/tsl";

/*
  Screen-space-fluid materials (three r0.184 WebGPU + TSL). The "A" particles are
  rendered as real spheres into offscreen targets; the surface is reconstructed and
  shaded in a full-screen composite. See the SSF blueprint §C.

  NOTE on eye-z: `positionView` reflects raw `positionLocal`, NOT a custom
  `positionNode`, so we recompute the view-space position by hand from the same
  expression that drives the vertex — otherwise the stored depth would be wrong.
*/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = any;

const BG_SENTINEL = 1000.0; // depth RT "no fluid" clear value (well within half-float)
const BG_TEST = 100.0; // |eyeZ| above this == background (real eyeZ ~ 5)

/** Per-instance world position from the sim buffer + the local sphere vertex. */
function worldPosNode(positions: Node, uRadius: Node): Node {
  return positionLocal.mul(uRadius).add(positions.element(instanceIndex));
}

/** P1 — depth pass: render spheres, store NEGATIVE linear eye-z in RED. */
export function makeDepthMaterial(positions: Node, uRadius: Node): THREE.MeshBasicNodeMaterial {
  const m = new THREE.MeshBasicNodeMaterial();
  m.depthTest = true;
  m.depthWrite = true;
  m.toneMapped = false;
  const worldPos = worldPosNode(positions, uRadius);
  m.positionNode = worldPos;
  const viewZ = modelViewMatrix.mul(vec4(worldPos, 1.0)).z; // model matrix is identity -> view z
  m.colorNode = vec4(viewZ, 0.0, 0.0, 1.0);
  return m;
}

/** P3 — thickness pass: additive accumulation of a per-particle constant. */
export function makeThicknessMaterial(positions: Node, uRadius: Node): THREE.MeshBasicNodeMaterial {
  const m = new THREE.MeshBasicNodeMaterial();
  m.toneMapped = false;
  m.transparent = true;
  m.depthTest = false;
  m.depthWrite = false;
  // pure additive (One/One) so thickness == sum of overlapping spheres along the ray
  m.blending = THREE.CustomBlending;
  m.blendEquation = THREE.AddEquation;
  m.blendSrc = THREE.OneFactor;
  m.blendDst = THREE.OneFactor;
  m.positionNode = worldPosNode(positions, uRadius);
  // hemisphere thickness: |viewNormal.z| == sqrt(1 - r^2) for a camera-facing sphere
  // fragment -> thin at the silhouette, thick at the center (Splash particle_alpha=0.05).
  // Curved absorption (vs a flat constant) is what gives the body real depth.
  m.colorNode = vec4(abs(normalView.z).mul(0.05), 0.0, 0.0, 1.0);
  return m;
}

// Narrow-range filter tuning, derived from the particle radius like Splash
// (narrowRangeFilter.wgsl: mu = 3*0.6, depthThreshold = 10*0.6, where 0.6 = radius).
const NR_RADIUS = 0.05; // our particle radius (useFluidSim uRadius)
const NR_MU = 3.0 * NR_RADIUS; // 0.15 — how far a clamped far-tap is pulled in
const NR_THRESHOLD = 10.0 * NR_RADIUS; // 0.5 — running depth window half-width
const NR_MAX_FILTER = 32; // loop cap (Splash uses 50; capped here for fill-rate)

/**
 * P2 — separable NARROW-RANGE bilateral depth filter, a faithful TSL port of
 * Splash's `narrowRangeFilter.wgsl` (1D branch). Per pixel the kernel size is
 * depth-adaptive (`min(max, ceil(projConst/depth))`); each tap is rejected when
 * nearer than a running low bound, CLAMPED to `depth+mu` when farther than a
 * running high bound, and otherwise EXPANDS the window. This smooths the interior
 * into a glassy surface while keeping the silhouette crisp — unlike a plain
 * Gaussian, which left the ragged "foamy" edge. Depth is stored NEGATIVE (view z);
 * we run the math on |depth| and re-negate on output to keep that convention.
 */
export function makeDepthBlurMaterial(srcRT: THREE.RenderTarget) {
  const m = new THREE.NodeMaterial();
  m.depthTest = false;
  m.depthWrite = false;
  m.toneMapped = false; // raw depth data — never tonemap
  const uTexel = uniform(new THREE.Vector2(0, 0)); // (1/w,0) H pass, (0,1/h) V pass
  const uProjConst = uniform(94.0); // projectedParticleConstant (set per-resize)

  m.fragmentNode = Fn(() => {
    const uv = screenUV;
    const center = texture(srcRT.texture, uv).r.toVar();
    const depth = abs(center).toVar(); // positive eye distance
    const outv = center.toVar(); // default passthrough (BG keeps its +sentinel)

    If(depth.lessThan(BG_TEST), () => {
      const filterSize = min(float(NR_MAX_FILTER), ceil(uProjConst.div(depth))).toVar();
      const sigma = filterSize.mul(0.5).toVar();
      const sigmaSqInv = float(1.0).div(sigma.mul(sigma).mul(2.0)).toVar();
      const higher = depth.add(NR_MU).toVar();

      const sum = depth.toVar();
      const wsum = float(1.0).toVar();
      // running depth window, tracked independently for the two kernel sides
      const loN = depth.sub(NR_THRESHOLD).toVar();
      const hiN = depth.add(NR_THRESHOLD).toVar();
      const loP = depth.sub(NR_THRESHOLD).toVar();
      const hiP = depth.add(NR_THRESHOLD).toVar();

      Loop({ start: int(1), end: int(NR_MAX_FILTER), type: "int", condition: "<=" }, ({ i }: Node) => {
        const r = float(i);
        If(r.lessThanEqual(filterSize), () => {
          const gw = exp(r.mul(r).mul(sigmaSqInv).negate()).toVar();
          const offs = uTexel.mul(r);
          const sN = abs(texture(srcRT.texture, uv.sub(offs)).r).toVar(); // - side
          const sP = abs(texture(srcRT.texture, uv.add(offs)).r).toVar(); // + side
          const wN = gw.toVar();
          const wP = gw.toVar();

          // negative side: reject (too near) / clamp (too far) / expand window
          If(sN.lessThan(loN), () => {
            wN.assign(0.0);
          });
          If(sN.greaterThanEqual(loN), () => {
            If(sN.greaterThan(hiN), () => {
              sN.assign(higher);
            });
            If(sN.lessThanEqual(hiN), () => {
              loN.assign(min(loN, sN.sub(NR_THRESHOLD)));
              hiN.assign(max(hiN, sN.add(NR_THRESHOLD)));
            });
          });

          // positive side
          If(sP.lessThan(loP), () => {
            wP.assign(0.0);
          });
          If(sP.greaterThanEqual(loP), () => {
            If(sP.greaterThan(hiP), () => {
              sP.assign(higher);
            });
            If(sP.lessThanEqual(hiP), () => {
              loP.assign(min(loP, sP.sub(NR_THRESHOLD)));
              hiP.assign(max(hiP, sP.add(NR_THRESHOLD)));
            });
          });

          sum.addAssign(sN.mul(wN).add(sP.mul(wP)));
          wsum.addAssign(wN.add(wP));
        });
      });

      outv.assign(sum.div(wsum).negate()); // restore negative eye-z convention
    });

    return vec4(outv, 0.0, 0.0, 1.0);
  })();

  return { material: m, uTexel, uProjConst };
}

/** P4 — separable Gaussian blur for thickness (no mask; low frequency). */
export function makeGaussianMaterial(srcRT: THREE.RenderTarget) {
  const m = new THREE.NodeMaterial();
  m.depthTest = false;
  m.depthWrite = false;
  m.toneMapped = false; // raw thickness data — never tonemap
  const uTexel = uniform(new THREE.Vector2(0, 0));

  m.fragmentNode = Fn(() => {
    const uv = screenUV;
    const sum = texture(srcRT.texture, uv).r.toVar();
    const wsum = float(1.0).toVar();
    Loop({ start: int(1), end: int(6), type: "int", condition: "<=" }, ({ i }: Node) => {
      const fi = float(i);
      const w = exp(fi.mul(fi).mul(-0.08)).toVar();
      const offs = uTexel.mul(fi);
      sum.addAssign(texture(srcRT.texture, uv.add(offs)).r.mul(w));
      sum.addAssign(texture(srcRT.texture, uv.sub(offs)).r.mul(w));
      wsum.addAssign(w.mul(2.0));
    });
    return vec4(sum.div(wsum), 0.0, 0.0, 1.0);
  })();

  return { material: m, uTexel };
}

export type CompositeHandle = {
  material: THREE.NodeMaterial;
  uInvProj: Node;
  uInvView: Node;
  uView: Node;
  diffuseColor: Node;
  uDensity: Node;
  uRoughness: Node;
  uSpecular: Node;
  uEdgeFoam: Node;
  uRefractBg: Node;
};

/**
 * P5 — composite to screen: a faithful TSL translation of Splash's `fluid.wgsl`.
 * Reconstruct the view-space surface + normal from the smoothed depth, then shade
 * exactly like Splash: REFLECT and REFRACT the environment CUBEMAP (via PMREM, so
 * it is roughness-aware), tint the refraction by Beer-Lambert absorption
 * (exp(-density*10*thickness*(1-diffuseColor))), and mix the two by a Schlick
 * Fresnel. No procedural sky, no photo refraction. Outputs the photo backdrop
 * verbatim where there is no fluid.
 */
export function makeCompositeMaterial(opts: {
  depthTex: THREE.Texture;
  thickTex: THREE.Texture;
  backdropTex: THREE.Texture;
  env: THREE.Texture; // PMREM radiance from the sky/sea scene (roughness-aware)
}): CompositeHandle {
  const m = new THREE.NodeMaterial();
  m.depthTest = false;
  m.depthWrite = false;
  m.toneMapped = false;

  // loose Node alias so TSL's strict scalar/vec typings don't reject the math chains.
  const uInvProj: Node = uniform(new THREE.Matrix4());
  const uInvView: Node = uniform(new THREE.Matrix4()); // view->world (camera.matrixWorld)
  const uView: Node = uniform(new THREE.Matrix4()); // world->view (camera.matrixWorldInverse) for the light dir
  const uSpecular: Node = uniform(0.0); // glint weight — Splash AND waterball zero it; off by default
  const uEdgeFoam: Node = uniform(0.4); // waterball edge-highlight strength (blend toward white at depth jumps)
  const F0: Node = float(0.02); // water IOR 1.333 -> ~0.02 normal-incidence reflectance
  // diffuseColor = the color that TRANSMITS; absorption = exp(-density*10*thickness*(1-diffuse)).
  // waterball uses a SATURATED blue (0,0.7375,0.95) so thick fluid reads deep blue, not pale celeste.
  const diffuseColor: Node = uniform(new THREE.Vector3(0.0, 0.7375, 0.95));
  const uDensity: Node = uniform(0.7); // Splash colorDensity (x10 in the formula below)
  const uRoughness: Node = uniform(0.06); // PMREM roughness: 0 = mirror, higher = frosted
  // waterball refracts a FLAT background tint (not the env/photo) -> clean translucent body.
  const uRefractBg: Node = uniform(new THREE.Vector3(0.7, 0.7, 0.75));

  // view-space position from stored eye-z: scale the inverse-projected corner ray
  // so its z matches the stored linear depth.
  const reconstruct: Node = Fn(([uv]: Node) => {
    const eyeZ = texture(opts.depthTex, uv).r;
    const clip = vec4(uv.mul(2.0).sub(1.0), float(1.0), float(1.0));
    const ray = uInvProj.mul(clip);
    const dir = ray.xyz.div(ray.w);
    return dir.mul(eyeZ.div(dir.z));
  });

  m.fragmentNode = Fn(() => {
    const uv = screenUV;
    const eyeZ = texture(opts.depthTex, uv).r.toVar();
    const backdrop = texture(opts.backdropTex, uv).rgb.toVar();
    const outColor = backdrop.toVar();

    If(abs(eyeZ).lessThan(BG_TEST), () => {
      const texel = vec2(1.0).div(screenSize);
      const P = reconstruct(uv).toVar();
      const Pr = reconstruct(uv.add(vec2(texel.x, 0.0))).toVar();
      const Pl = reconstruct(uv.sub(vec2(texel.x, 0.0))).toVar();
      const Pu = reconstruct(uv.add(vec2(0.0, texel.y))).toVar();
      const Pd = reconstruct(uv.sub(vec2(0.0, texel.y))).toVar();

      // asymmetric finite difference: pick the closer (smaller |dz|) neighbour
      const ddx = Pr.sub(P).toVar();
      If(abs(Pl.z.sub(P.z)).lessThan(abs(Pr.z.sub(P.z))), () => {
        ddx.assign(P.sub(Pl));
      });
      const ddy = Pu.sub(P).toVar();
      If(abs(Pd.z.sub(P.z)).lessThan(abs(Pu.z.sub(P.z))), () => {
        ddy.assign(P.sub(Pd));
      });

      const N = normalize(cross(ddx, ddy)).toVar();
      // force the normal to face the camera (view +z) regardless of winding
      If(N.z.lessThan(0.0), () => {
        N.assign(N.negate());
      });

      const rayDir = normalize(P).toVar(); // eye -> surface (incident, into scene)
      const thickness = texture(opts.thickTex, uv).r.toVar();

      // REFRACTION (waterball): a FLAT background tint absorbed by Beer-Lambert —
      // no env/photo refraction, so the body reads as a clean translucent blue volume.
      const trans = exp(diffuseColor.sub(1.0).mul(uDensity.mul(10.0).mul(thickness))).toVar();
      const refractionColor = uRefractBg.mul(trans).toVar();

      // REFLECTION of the environment cubemap (Splash: reflect(rayDir,N) -> envmap)
      const reflDirView = reflect(rayDir, N);
      const reflDirWorld = normalize(uInvView.mul(vec4(reflDirView, 0.0)).xyz);
      const reflectionColor = pmremTexture(opts.env, reflDirWorld, uRoughness).toVar();

      // Schlick Fresnel + mix (Splash: finalColor = mix(refraction, reflection, fresnel))
      const ndv = clamp(dot(N, rayDir.negate()), float(0.0), float(1.0));
      const fres = clamp(
        F0.add(oneMinus(F0).mul(pow(oneMinus(ndv), float(5.0)))),
        float(0.0),
        float(1.0),
      );
      outColor.assign(mix(refractionColor, reflectionColor, fres));

      // Specular glint (Splash fluid.wgsl:99-101, there multiplied by 0): a tight
      // Blinn-Phong wet highlight from a fixed light dir, added on top of the env
      // mix. rayDir is eye->surface (== Splash rayDirView), so L - rayDir matches.
      const lightDirView = normalize(uView.mul(vec4(0.2, 0.0, 1.0, 0.0)).xyz);
      const H = normalize(lightDirView.sub(rayDir));
      const spec = pow(max(dot(H, N), float(0.0)), float(300.0));
      outColor.addAssign(vec3(spec).mul(uSpecular));

      // Edge highlighting (waterball fluid.wgsl:86-89): at depth discontinuities
      // (silhouette + interior folds) blend toward white — reads as sea foam/spray
      // and hides the ragged SSF silhouette without a billboard/fragDepth rewrite.
      const dzMax = max(
        max(abs(Pr.z.sub(P.z)), abs(P.z.sub(Pl.z))),
        max(abs(Pu.z.sub(P.z)), abs(P.z.sub(Pd.z))),
      );
      If(dzMax.greaterThan(float(0.15)), () => {
        outColor.assign(mix(outColor, vec3(0.9), uEdgeFoam));
      });
    });

    // linear out; the renderer applies the sRGB output encode on present
    return vec4(outColor, 1.0);
  })();

  return { material: m, uInvProj, uInvView, uView, diffuseColor, uDensity, uRoughness, uSpecular, uEdgeFoam, uRefractBg };
}

export { BG_SENTINEL };
