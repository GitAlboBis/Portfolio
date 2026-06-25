import * as THREE from "three/webgpu";
import {
  Fn,
  positionLocal,
  instanceIndex,
  uv,
  varying,
  cameraViewMatrix,
  cameraProjectionMatrix,
  vec2,
  vec3,
  vec4,
  float,
  int,
  uniform,
  texture,
  cubeTexture,
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
  sqrt,
  ceil,
  min,
  max,
  normalize,
  reflect,
  refract,
  Loop,
  If,
  Discard,
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

// `any`-typed aliases for the strict TSL primitives so the billboard math chains
// compose without fighting the scalar/vec overloads (same escape hatch as `Node`).
const PLOCAL: Node = positionLocal;
const CAM_VIEW: Node = cameraViewMatrix;
const CAM_PROJ: Node = cameraProjectionMatrix;

/**
 * Camera-facing billboard clip position (waterball depthMap.wgsl/sphere.wgsl): a
 * quad sized to the particle diameter, placed at the particle's view-space center.
 * Cheaper than a real icosahedron (6 verts vs 42) and the basis for the analytic
 * per-fragment sphere normal — which is what makes the surface smooth and round.
 * Geometry must be a PlaneGeometry(1,1) so positionLocal.xy spans [-0.5, 0.5].
 */
function billboardClip(positions: Node, uRadius: Node): Node {
  const center: Node = positions.element(instanceIndex);
  const viewCenter: Node = CAM_VIEW.mul(vec4(center, 1.0)).xyz;
  const corner: Node = PLOCAL.xy.mul(uRadius.mul(2.0)); // [-0.5,0.5] -> diameter
  return CAM_PROJ.mul(vec4(viewCenter.add(vec3(corner, 0.0)), 1.0));
}

/** P1 — depth pass: billboard sphere imposters. Per fragment reconstruct the
 *  analytic sphere normal (sqrt(1-r^2)), push depth to the sphere surface via
 *  fragDepth, and store NEGATIVE linear eye-z in RED. */
export function makeDepthMaterial(positions: Node, uRadius: Node): THREE.MeshBasicNodeMaterial {
  const m = new THREE.MeshBasicNodeMaterial();
  m.depthTest = true;
  m.depthWrite = true;
  m.toneMapped = false;
  m.side = THREE.DoubleSide;
  m.vertexNode = billboardClip(positions, uRadius);

  const vCenter: Node = varying(CAM_VIEW.mul(vec4(positions.element(instanceIndex), 1.0)).xyz);
  const nxy: Node = uv().mul(2.0).sub(1.0);
  const r2: Node = dot(nxy, nxy);
  const nz: Node = sqrt(oneMinus(r2));
  const realViewPos: Node = vCenter.add(vec3(nxy, nz).mul(uRadius));
  const clipPos: Node = CAM_PROJ.mul(vec4(realViewPos, 1.0));

  m.colorNode = Fn(() => {
    If(r2.greaterThan(1.0), () => {
      Discard();
    });
    return vec4(realViewPos.z, 0.0, 0.0, 1.0);
  })();
  m.depthNode = clipPos.z.div(clipPos.w); // fragDepth = sphere-surface depth
  return m;
}

/** P3 — thickness pass: billboard imposters, additive sqrt(1-r^2)*0.05 (waterball
 *  thicknessMap.wgsl). Thin at the silhouette, thick at the center. */
export function makeThicknessMaterial(positions: Node, uRadius: Node): THREE.MeshBasicNodeMaterial {
  const m = new THREE.MeshBasicNodeMaterial();
  m.toneMapped = false;
  m.transparent = true;
  m.depthTest = false;
  m.depthWrite = false;
  m.side = THREE.DoubleSide;
  // pure additive (One/One) so thickness == sum of overlapping spheres along the ray
  m.blending = THREE.CustomBlending;
  m.blendEquation = THREE.AddEquation;
  m.blendSrc = THREE.OneFactor;
  m.blendDst = THREE.OneFactor;
  m.vertexNode = billboardClip(positions, uRadius);

  const nxy: Node = uv().mul(2.0).sub(1.0);
  const r2: Node = dot(nxy, nxy);
  const nz: Node = sqrt(oneMinus(r2));
  m.colorNode = Fn(() => {
    If(r2.greaterThan(1.0), () => {
      Discard();
    });
    return vec4(nz.mul(0.05), 0.0, 0.0, 1.0);
  })();
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
  uReflectFloor: Node;
  uRefractLod: Node;
  uSpecular: Node;
  uEdgeFoam: Node;
  uDebug: Node;
};

/**
 * P5 — composite to screen. SELF-CONTAINED water (no page-background dependency):
 * BOTH refraction and reflection are directional lookups of the sky CUBEMAP, so the
 * body color is driven by the surface NORMAL — the one signal a flat "A" glyph can
 * supply (its thickness range is too small for Beer-Lambert to carry the look, the
 * way it does on waterball's 3D ball). The body is the env seen THROUGH the water
 * (refract, blurred LOD) tinted by Beer-Lambert absorption; the rim/sheen is a sharp
 * mirror reflection (reflect, LOD 0); the two mixed by a Schlick fresnel with a
 * reflection FLOOR so the reflection is a real contributor (pure F0=0.02 pins it to
 * ~2% → flat). See SSF-WATER-REFACTOR-PLAN.md §5. The photo backdrop is shown
 * verbatim ONLY where there is no fluid.
 */
export function makeCompositeMaterial(opts: {
  depthTex: THREE.Texture;
  thickTex: THREE.Texture;
  backdropTex: THREE.Texture;
  env: THREE.CubeTexture; // real sky cubemap, sampled as a sharp mirror (LOD 0)
}): CompositeHandle {
  const m = new THREE.NodeMaterial();
  m.depthTest = false;
  m.depthWrite = false;
  m.toneMapped = false;

  // loose Node alias so TSL's strict scalar/vec typings don't reject the math chains.
  const uInvProj: Node = uniform(new THREE.Matrix4());
  const uInvView: Node = uniform(new THREE.Matrix4()); // view->world (camera.matrixWorld)
  const uView: Node = uniform(new THREE.Matrix4()); // world->view (camera.matrixWorldInverse) for the light dir
  // waterball fluid.wgsl values, verbatim:
  const F0: Node = float(0.02); // water IOR 1.333 -> ~0.02 normal-incidence reflectance
  const diffuseColor: Node = uniform(new THREE.Vector3(0.0, 0.7375, 0.95)); // transmit color
  const uDensity: Node = uniform(1.6); // Beer-Lambert: exp(-density*thickness*(1-diffuse)); A is thin -> needs higher density
  const uReflectFloor: Node = uniform(0.18); // baseline reflection weight so the normal-driven env reflection is visible on a flat letter
  const uRefractLod: Node = uniform(3.0); // env mip for the transmitted (see-through) lookup: higher = softer "behind"
  const uSpecular: Node = uniform(0.0); // wet sun glint weight (reference keeps it 0; tunable)
  const uEdgeFoam: Node = uniform(0.35); // cyan-white foam at depth jumps
  // TEMP debug switch (set from ?dbg=): 1=normal, 2=thickness, 3=fresnel, 4=refraction, 5=reflection
  const uDebug: Node = uniform(0.0);

  // view-space position from stored eye-z: scale the inverse-projected corner ray
  // so its z matches the stored linear depth. Plain JS helper (inlined per call) —
  // NOT a TSL Fn — so it doesn't emit the "return in inline Fn" build warning.
  const reconstruct = (uvArg: Node): Node => {
    const eyeZ = texture(opts.depthTex, uvArg).r;
    const clip = vec4(uvArg.mul(2.0).sub(1.0), float(1.0), float(1.0));
    const ray = uInvProj.mul(clip);
    const dir = ray.xyz.div(ray.w);
    return dir.mul(eyeZ.div(dir.z));
  };

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
      // (equivalent to waterball's `-normalize(cross(ddx,ddy))`).
      If(N.z.lessThan(0.0), () => {
        N.assign(N.negate());
      });

      const rayDir = normalize(P).toVar(); // eye -> surface (== waterball rayDir)
      const thickness = texture(opts.thickTex, uv).r.toVar();
      // Beer-Lambert absorption toward the water color (thicker => bluer/darker).
      const tint = diffuseColor.oneMinus().mul(thickness).mul(uDensity).negate().exp().toVar();

      // REFRACTION — DIRECTIONAL env lookup (Splash render/fluid.wgsl:105-113): the body
      // is the environment seen THROUGH the water, bent by the surface normal, tinted by
      // Beer-Lambert. Normal-driven => varies per-pixel even on a flat letter, and
      // self-contained (no dependency on a possibly-black page backdrop). Softened LOD
      // so it reads as diffuse "behind", not a second mirror.
      const refrDirView = refract(rayDir, N, float(1.0 / 1.333));
      const refrDirWorld = normalize(uInvView.mul(vec4(refrDirView, 0.0)).xyz);
      const transmitted = cubeTexture(opts.env, refrDirWorld, uRefractLod).rgb.toVar();
      const refractionColor = transmitted.mul(tint).toVar();

      // REFLECTION — sharp mirror of the sky cube.
      const reflDirView = reflect(rayDir, N);
      const reflDirWorld = normalize(uInvView.mul(vec4(reflDirView, 0.0)).xyz);
      const reflectionColor = cubeTexture(opts.env, reflDirWorld, float(0.0)).rgb.toVar();

      // Schlick Fresnel + reflection FLOOR. Pure F0=0.02 pins reflection to ~2% at the
      // near-normal viewing that covers a flat letter -> the body collapses to one
      // (refraction) term. The floor keeps the normal-driven reflection a real
      // contributor so the surface actually shimmers. (Was the "tinta unita" bug.)
      const ndv = clamp(dot(N, rayDir.negate()), float(0.0), float(1.0));
      const fres = clamp(
        F0.add(oneMinus(F0).mul(pow(oneMinus(ndv), float(5.0)))).add(uReflectFloor),
        float(0.0),
        float(1.0),
      );
      outColor.assign(mix(refractionColor, reflectionColor, fres));

      // WET SUN GLINT — a broad, bright Blinn-Phong highlight from the sky's sun, so
      // the surface actually sparkles "wet" (the old pow-250 glint was invisible).
      const lightDirView = normalize(uView.mul(vec4(0.4, 0.7, 0.6, 0.0)).xyz);
      const H = normalize(lightDirView.sub(rayDir));
      const spec = pow(max(dot(H, N), float(0.0)), float(80.0));
      outColor.addAssign(vec3(1.0, 0.97, 0.9).mul(spec).mul(uSpecular));

      // Edge highlighting (waterball fluid.wgsl:86-89): at depth discontinuities
      // (silhouette + interior folds) blend toward white — reads as sea foam/spray
      // and hides the ragged SSF silhouette without a billboard/fragDepth rewrite.
      const dzMax = max(
        max(abs(Pr.z.sub(P.z)), abs(P.z.sub(Pl.z))),
        max(abs(Pu.z.sub(P.z)), abs(P.z.sub(Pd.z))),
      );
      If(dzMax.greaterThan(float(0.15)), () => {
        // cyan-white sea foam at depth jumps (silhouette + folds) — the brand "schiuma".
        outColor.assign(mix(outColor, vec3(0.8, 0.95, 1.0), uEdgeFoam));
      });

      // TEMP debug overrides (cascade): 1=normal, 2=thickness, 3=fresnel
      If(uDebug.greaterThan(0.5), () => {
        outColor.assign(N.mul(0.5).add(0.5));
      });
      If(uDebug.greaterThan(1.5), () => {
        outColor.assign(vec3(thickness.mul(4.0)));
      });
      If(uDebug.greaterThan(2.5), () => {
        outColor.assign(vec3(fres));
      });
      If(uDebug.greaterThan(3.5), () => {
        outColor.assign(refractionColor);
      });
      If(uDebug.greaterThan(4.5), () => {
        outColor.assign(reflectionColor);
      });
    });

    // linear out; the renderer applies the sRGB output encode on present
    return vec4(outColor, 1.0);
  })();

  return { material: m, uInvProj, uInvView, uView, diffuseColor, uDensity, uReflectFloor, uRefractLod, uSpecular, uEdgeFoam, uDebug };
}

export { BG_SENTINEL };
