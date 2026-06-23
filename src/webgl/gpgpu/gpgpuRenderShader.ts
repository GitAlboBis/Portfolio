/*
  Shared point render material for both layers (docs §7). The vertex stage reads
  each particle's live position/velocity from the sim textures via aRef; the
  fragment stage shades it as water: deep teal at rest -> foam cyan-white when
  fast, soft round sprite, rim brighten. Body uses NormalBlending (writes depth,
  the legible silhouette); skin uses AdditiveBlending (the Bloom target).
*/
import * as THREE from "three";
import type { LayerConfig } from "./gpgpuConfig";

const VERT = /* glsl */ `
in vec2 aRef;
uniform sampler2D uPos;
uniform sampler2D uVel;
uniform float uPointSize;   // world radius
uniform float uSizeSpeed;
uniform float uMaxSpeed;
uniform float uProjScale;   // 0.5 * P[1][1] * drawingBufferHeight
out float vSpeed;

void main(){
  vec4 p4 = texture(uPos, aRef);
  vec3 p = p4.xyz;
  vec3 v = texture(uVel, aRef).xyz;
  vSpeed = clamp(length(v) / uMaxSpeed, 0.0, 1.0);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float r = uPointSize * (1.0 + vSpeed * uSizeSpeed);
  gl_PointSize = clamp(r * uProjScale / max(0.001, -mv.z), 1.0, 64.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;
in float vSpeed;
uniform vec3  uColCold;
uniform vec3  uColHot;
uniform float uAlpha;
uniform float uEmissive;
uniform float uOpacity;
uniform float uGlow;   // 1 = additive foam (bloom-like halo), 0 = solid body
out vec4 fragColor;

void main(){
  vec2 pc = gl_PointCoord - 0.5;
  float r = length(pc);
  if (r > 0.5) discard;
  float disc = smoothstep(0.5, 0.0, r);          // soft round sprite
  float core = smoothstep(0.18, 0.0, r);         // bright nucleus (fake bloom)

  vec3 col = mix(uColCold, uColHot, smoothstep(0.0, 1.0, vSpeed));
  float rim = pow(clamp(r * 2.0, 0.0, 1.0), 2.0); // fresnel-ish edge glow
  col += rim * 0.15 * uColHot;
  col += core * uGlow * 0.6 * uColHot;            // hot core -> additive glow
  col *= (1.0 + uEmissive);

  float a = disc * uAlpha * uOpacity * (0.55 + 0.45 * vSpeed);
  a += core * uGlow * 0.4 * uOpacity;             // extra additive punch
  fragColor = vec4(col, a);
}
`;

export function makeRenderMaterial(cfg: LayerConfig): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: {
      uPos: { value: null },
      uVel: { value: null },
      uPointSize: { value: cfg.POINT_SIZE },
      uSizeSpeed: { value: cfg.SIZE_SPEED },
      uMaxSpeed: { value: cfg.MAX_SPEED },
      uProjScale: { value: 1000 },
      uColCold: { value: new THREE.Color().fromArray(cfg.COL_COLD) },
      uColHot: { value: new THREE.Color().fromArray(cfg.COL_HOT) },
      uAlpha: { value: cfg.POINT_ALPHA },
      uEmissive: { value: cfg.EMISSIVE },
      uOpacity: { value: 1 },
      uGlow: { value: cfg.blending === "Additive" ? 1 : 0 },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthTest: true,
    depthWrite: cfg.depthWrite,
    blending: cfg.blending === "Additive" ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}
