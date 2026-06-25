// Make the ambient WebGPU IDL globals (GPUDevice, GPUTextureUsage, navigator.gpu, …)
// available project-wide for the hand-written WebGPU code under src/webgl/waterball.
// three/webgpu ships its renderer abstraction, not these bare globals.
/// <reference types="@webgpu/types" />
