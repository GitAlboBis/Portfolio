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
  normalize,
  normalView,
  reflect,
  refract,
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

/**
 * P2 — separable depth blur (masked Gaussian): averages only FOREGROUND taps so
 * the silhouette stays sharp over the busy photo (no bleed into the BG sentinel).
 */
export function makeDepthBlurMaterial(srcRT: THREE.RenderTarget) {
  const m = new THREE.NodeMaterial();
  m.depthTest = false;
  m.depthWrite = false;
  m.toneMapped = false; // raw depth data — never tonemap
  const uTexel = uniform(new THREE.Vector2(0, 0)); // (1/w,0) H pass, (0,1/h) V pass

  m.fragmentNode = Fn(() => {
    const uv = screenUV;
    const center = texture(srcRT.texture, uv).r.toVar();
    const result = center.toVar();

    If(abs(center).lessThan(BG_TEST), () => {
      const sum = center.toVar();
      const wsum = float(1.0).toVar();
      Loop({ start: int(1), end: int(6), type: "int", condition: "<=" }, ({ i }: Node) => {
        const fi = float(i);
        const w = exp(fi.mul(fi).mul(-0.08)).toVar();
        const offs = uTexel.mul(fi);
        const sp = texture(srcRT.texture, uv.add(offs)).r.toVar();
        const sm = texture(srcRT.texture, uv.sub(offs)).r.toVar();
        If(abs(sp).lessThan(BG_TEST), () => {
          sum.addAssign(sp.mul(w));
          wsum.addAssign(w);
        });
        If(abs(sm).lessThan(BG_TEST), () => {
          sum.addAssign(sm.mul(w));
          wsum.addAssign(w);
        });
      });
      result.assign(sum.div(wsum));
    });

    return vec4(result, 0.0, 0.0, 1.0);
  })();

  return { material: m, uTexel };
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
  diffuseColor: Node;
  uDensity: Node;
  uRoughness: Node;
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
  envCube: THREE.CubeTexture;
}): CompositeHandle {
  const m = new THREE.NodeMaterial();
  m.depthTest = false;
  m.depthWrite = false;
  m.toneMapped = false;

  // loose Node alias so TSL's strict scalar/vec typings don't reject the math chains.
  const uInvProj: Node = uniform(new THREE.Matrix4());
  const uInvView: Node = uniform(new THREE.Matrix4()); // view->world (camera.matrixWorld)
  const F0: Node = float(0.02); // water IOR 1.333 -> ~0.02 normal-incidence reflectance
  // Splash diffuseColor = (140,220,240)/255 — the color that TRANSMITS; absorption is
  // exp(-density*10*thickness*(1 - diffuseColor)), so thick fluid skews celeste.
  const diffuseColor: Node = uniform(new THREE.Vector3(0.549, 0.863, 0.941));
  const uDensity: Node = uniform(0.7); // Splash colorDensity (x10 in the formula below)
  const uRoughness: Node = uniform(0.06); // PMREM roughness: 0 = mirror, higher = frosted

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

      // REFRACTION of the environment cubemap (Splash: refract(rayDir,N) -> envmap),
      // tinted by Beer-Lambert absorption keyed to (1 - diffuseColor).
      const refrDirView = refract(rayDir, N, float(1.0 / 1.333));
      const refrDirWorld = normalize(uInvView.mul(vec4(refrDirView, 0.0)).xyz);
      const transmitted = pmremTexture(opts.envCube, refrDirWorld, uRoughness);
      const trans = exp(diffuseColor.sub(1.0).mul(uDensity.mul(10.0).mul(thickness))).toVar();
      const refractionColor = transmitted.mul(trans).toVar();

      // REFLECTION of the environment cubemap (Splash: reflect(rayDir,N) -> envmap)
      const reflDirView = reflect(rayDir, N);
      const reflDirWorld = normalize(uInvView.mul(vec4(reflDirView, 0.0)).xyz);
      const reflectionColor = pmremTexture(opts.envCube, reflDirWorld, uRoughness).toVar();

      // Schlick Fresnel + mix (Splash: finalColor = mix(refraction, reflection, fresnel))
      const ndv = clamp(dot(N, rayDir.negate()), float(0.0), float(1.0));
      const fres = clamp(
        F0.add(oneMinus(F0).mul(pow(oneMinus(ndv), float(5.0)))),
        float(0.0),
        float(1.0),
      );
      outColor.assign(mix(refractionColor, reflectionColor, fres));
    });

    // linear out; the renderer applies the sRGB output encode on present
    return vec4(outColor, 1.0);
  })();

  return { material: m, uInvProj, uInvView, diffuseColor, uDensity, uRoughness };
}

export { BG_SENTINEL };
