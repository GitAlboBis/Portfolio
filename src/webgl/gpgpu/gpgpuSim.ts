/*
  WebGL2 GPGPU spring simulation via FBO ping-pong (docs §6.3).
  State lives in two MRT render targets (texture[0]=position+seed, texture[1]=
  velocity). Each step runs a fullscreen fragment pass that integrates the 2nd
  order spring + mouse push + curl-noise turbulence, then swaps read/write.

  The WebGPU/TSL compute path (docs §6.2) is intentionally deferred until
  Context7 is available — this GLSL path is the documented stable fallback.
*/
import * as THREE from "three";
import { SNOISE_GLSL, CURL_GLSL } from "@/webgl/curves/curlNoise.glsl";
import type { LayerConfig } from "./gpgpuConfig";

const QUAD_VERT = /* glsl */ `
out vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const INIT_FRAG = /* glsl */ `
precision highp float;
in vec2 vUv;
layout(location = 0) out vec4 outPos;
layout(location = 1) out vec4 outVel;
uniform sampler2D uHome;
void main(){
  outPos = texture(uHome, vUv);   // xyz = home, w = seed
  outVel = vec4(0.0);
}
`;

const SIM_FRAG = /* glsl */ `
precision highp float;
in vec2 vUv;
layout(location = 0) out vec4 outPos;
layout(location = 1) out vec4 outVel;

uniform sampler2D uPos;
uniform sampler2D uVel;
uniform sampler2D uHome;
uniform vec3  uMouse;
uniform float uDt;
uniform float uDisp;
uniform float uTime;
uniform float uSpring, uDamping, uPush, uRadius, uMaxSpeed, uTurbBase, uTurbMove, uNoiseScale;

${SNOISE_GLSL}
${CURL_GLSL}

void main(){
  vec4 pos4 = texture(uPos, vUv);
  vec3 pos = pos4.xyz;
  float seed = pos4.w;
  vec3 vel = texture(uVel, vUv).xyz;
  vec3 home = texture(uHome, vUv).xyz;

  vec3 acc = uSpring * (home - pos);

  vec3 fromMouse = pos - uMouse;
  float d = length(fromMouse);
  if (d < uRadius) {
    float f = pow(1.0 - d / uRadius, 2.0);
    acc += normalize(fromMouse + vec3(1e-5)) * f * uPush;
  }

  vec3 np = pos * uNoiseScale + vec3(0.0, uTime * 0.06, 0.0) + seed * 11.0;
  acc += curlNoise(np) * (uTurbBase + uTurbMove * uDisp);

  vel += acc * uDt;
  vel *= exp(-uDamping * uDt);            // frame-rate independent damping
  float sp = length(vel);
  if (sp > uMaxSpeed) vel = vel / sp * uMaxSpeed;
  pos += vel * uDt;

  outPos = vec4(pos, seed);
  outVel = vec4(vel, 0.0);
}
`;

function makeRT(size: number): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(size, size, {
    count: 2,
    type: THREE.FloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
  });
}

export type StepArgs = {
  mouse: THREE.Vector3;
  dt: number;
  disp: number;
  time: number;
};

export class GpgpuSim {
  readonly size: number;
  private rtA: THREE.WebGLRenderTarget;
  private rtB: THREE.WebGLRenderTarget;
  private read: THREE.WebGLRenderTarget;
  private write: THREE.WebGLRenderTarget;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quad: THREE.Mesh;
  private simMat: THREE.ShaderMaterial;
  private initMat: THREE.ShaderMaterial;
  private inited = false;

  constructor(size: number, homeTexture: THREE.DataTexture, cfg: LayerConfig) {
    this.size = size;
    this.rtA = makeRT(size);
    this.rtB = makeRT(size);
    this.read = this.rtA;
    this.write = this.rtB;

    this.initMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: { uHome: { value: homeTexture } },
      vertexShader: QUAD_VERT,
      fragmentShader: INIT_FRAG,
      depthTest: false,
      depthWrite: false,
    });

    this.simMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: {
        uPos: { value: null },
        uVel: { value: null },
        uHome: { value: homeTexture },
        uMouse: { value: new THREE.Vector3(9999, 9999, 9999) },
        uDt: { value: 0 },
        uDisp: { value: 0 },
        uTime: { value: 0 },
        uSpring: { value: cfg.SPRING },
        uDamping: { value: cfg.DAMPING },
        uPush: { value: cfg.PUSH },
        uRadius: { value: cfg.RADIUS },
        uMaxSpeed: { value: cfg.MAX_SPEED },
        uTurbBase: { value: cfg.TURB_BASE },
        uTurbMove: { value: cfg.TURB_MOVE },
        uNoiseScale: { value: cfg.NOISE_SCALE },
      },
      vertexShader: QUAD_VERT,
      fragmentShader: SIM_FRAG,
      depthTest: false,
      depthWrite: false,
    });

    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.simMat);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
  }

  /** Seed both targets with home positions and zero velocity. */
  init(renderer: THREE.WebGLRenderer) {
    const prev = renderer.getRenderTarget();
    this.quad.material = this.initMat;
    for (const rt of [this.rtA, this.rtB]) {
      renderer.setRenderTarget(rt);
      renderer.render(this.scene, this.camera);
    }
    this.quad.material = this.simMat;
    renderer.setRenderTarget(prev);
    this.inited = true;
  }

  step(renderer: THREE.WebGLRenderer, a: StepArgs) {
    if (!this.inited) this.init(renderer);
    const u = this.simMat.uniforms;
    u.uPos.value = this.read.textures[0];
    u.uVel.value = this.read.textures[1];
    u.uMouse.value = a.mouse;
    u.uDt.value = a.dt;
    u.uDisp.value = a.disp;
    u.uTime.value = a.time;

    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(this.write);
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(prev);

    const t = this.read;
    this.read = this.write;
    this.write = t;
  }

  get posTexture(): THREE.Texture {
    return this.read.textures[0];
  }
  get velTexture(): THREE.Texture {
    return this.read.textures[1];
  }

  dispose() {
    this.rtA.dispose();
    this.rtB.dispose();
    this.simMat.dispose();
    this.initMat.dispose();
    (this.quad.geometry as THREE.BufferGeometry).dispose();
  }
}
