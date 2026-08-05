// @ts-nocheck -- vendored from matsuoka-601/WaterBall (faithful copy; do not lint)
import depthMap from './depthMap.wgsl'
import depthFilter from './bilateral.wgsl'
import fluid from './fluid.wgsl'
import fullScreen from './fullScreen.wgsl'
import thicknessMap from './thicknessMap.wgsl'
import gaussian from './gaussian.wgsl'
import sphere from './sphere.wgsl'


export class FluidRenderer {
    depthMapPipeline: GPURenderPipeline
    depthFilterPipeline: GPURenderPipeline
    thicknessMapPipeline: GPURenderPipeline
    thicknessFilterPipeline: GPURenderPipeline
    fluidPipeline: GPURenderPipeline
    spherePipeline: GPURenderPipeline

    depthMapTextureView: GPUTextureView
    tmpDepthMapTextureView: GPUTextureView
    thicknessTextureView: GPUTextureView
    tmpThicknessTextureView: GPUTextureView
    depthTestTextureView: GPUTextureView

    
    depthMapBindGroup: GPUBindGroup
    depthFilterBindGroups: GPUBindGroup[]
    thicknessMapBindGroup: GPUBindGroup
    thicknessFilterBindGroups: GPUBindGroup[]
    fluidBindGroup: GPUBindGroup
    sphereBindGroup: GPUBindGroup

    stretchStrengthBuffer: GPUBuffer

    device: GPUDevice

    // ── LOCAL ADDITIONS ──────────────────────────────────────────────────────────
    // Everything the resize path needs to rebuild the size-dependent half of this
    // renderer. Upstream WaterBall is a fixed-size demo, so all of this was baked once
    // in the constructor and there was no way to follow a window resize.
    private sizedTextures: GPUTexture[] = []
    private vertexModule!: GPUShaderModule
    private depthFilterModule!: GPUShaderModule
    private fluidModule!: GPUShaderModule
    private thicknessFilterModule!: GPUShaderModule
    private sampler!: GPUSampler
    private presentationFormat!: GPUTextureFormat
    private filterXUniformBuffer!: GPUBuffer
    private filterYUniformBuffer!: GPUBuffer
    private renderUniformBuffer!: GPUBuffer
    private cubemapTextureView!: GPUTextureView
    private radius!: number
    private fov!: number
    private diameter!: number
    private maxFilterSize!: number
    private blurdDepthScale!: number
    private blurFilterSize!: number
    private stretchScratch = new Float32Array(1)

    constructor(
        device: GPUDevice, canvas: HTMLCanvasElement, presentationFormat: GPUTextureFormat,
        radius: number, fov: number, posvelBuffer: GPUBuffer,
        renderUniformBuffer: GPUBuffer, cubemapTextureView: GPUTextureView, depthMapTextureView: GPUTextureView,
        restDensity: number
    ) {
        this.device = device
        const maxFilterSize = 100
        const blurdDepthScale = 10
        const diameter = 2 * radius
        const blurFilterSize = 12

        const renderEffectConstants = {
            'restDensity' : restDensity,
            'densitySizeScale' : 4.0,
        }
        const sampler = device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear'
        });

        const vertexModule = device.createShaderModule({ code: fullScreen })
        const depthMapModule = device.createShaderModule({ code: depthMap })
        const depthFilterModule = device.createShaderModule({ code: depthFilter })
        const fluidModule = device.createShaderModule({ code: fluid })
        const sphereModule = device.createShaderModule({ code: sphere })
        const thicknessMapModule = device.createShaderModule({ code: thicknessMap })
        const thicknessFilterModule = device.createShaderModule({ code: gaussian })

        // persist everything buildSized() needs so a resize can rebuild the screen-sized
        // half of the renderer without re-compiling shader modules or re-creating the
        // size-independent pipelines / bind groups.
        this.vertexModule = vertexModule
        this.depthFilterModule = depthFilterModule
        this.fluidModule = fluidModule
        this.thicknessFilterModule = thicknessFilterModule
        this.sampler = sampler
        this.presentationFormat = presentationFormat
        this.renderUniformBuffer = renderUniformBuffer
        this.cubemapTextureView = cubemapTextureView
        this.radius = radius
        this.fov = fov
        this.diameter = diameter
        this.maxFilterSize = maxFilterSize
        this.blurdDepthScale = blurdDepthScale
        this.blurFilterSize = blurFilterSize

        // pipelines
        this.spherePipeline = device.createRenderPipeline({
            label: 'ball pipeline', 
            layout: 'auto', 
            vertex: { module: sphereModule, constants: renderEffectConstants }, 
            fragment: {
                module: sphereModule, 
                targets: [
                    {
                        format: presentationFormat, 
                    }, 
                    {
                        format: 'r32float',
                    },
                ]
            }, 
            primitive: {
                topology: 'triangle-list', 
            },
            depthStencil: {
                depthWriteEnabled: true, 
                depthCompare: 'less',
                format: 'depth32float'
            }
        })
        this.depthMapPipeline = device.createRenderPipeline({
            label: 'depth map pipeline', 
            layout: 'auto', 
            vertex: { module: depthMapModule, constants: renderEffectConstants },
            fragment: {
                module: depthMapModule,
                targets: [
                    {
                        format: 'r32float',
                    },
                ],
            },
            primitive: {
                topology: 'triangle-list', 
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth32float'
            }
        })
        this.thicknessMapPipeline = device.createRenderPipeline({
            label: 'thickness map pipeline', 
            layout: 'auto', 
            vertex: { 
                module: thicknessMapModule, 
                constants: renderEffectConstants,  
            }, 
            fragment: {
                module: thicknessMapModule,
                targets: [
                    {
                        // rg: r = thickness, g = speed-weighted thickness (foam signal)
                        format: 'rg16float',
                        writeMask: GPUColorWrite.RED | GPUColorWrite.GREEN,
                        blend: {
                            color: { operation: 'add', srcFactor: 'one', dstFactor: 'one' },
                            alpha: { operation: 'add', srcFactor: 'one', dstFactor: 'one' },
                        }
                    }
                ],
            },
            primitive: {
                topology: 'triangle-list', 
            },
        });
        // buffer
        const filterXUniformsValues = new ArrayBuffer(8)
        const filterYUniformsValues = new ArrayBuffer(8)
        const filterXUniformsViews = new Float32Array(filterXUniformsValues)
        const filterYUniformsViews = new Float32Array(filterYUniformsValues) 
        filterXUniformsViews.set([1.0, 0.0])
        filterYUniformsViews.set([0.0, 1.0])
        const filterXUniformBuffer = device.createBuffer({
            label: 'filter uniform buffer', 
            size: filterXUniformsValues.byteLength, 
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })
        const filterYUniformBuffer = device.createBuffer({
            label: 'filter uniform buffer', 
            size: filterYUniformsValues.byteLength, 
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })
        this.stretchStrengthBuffer = device.createBuffer({
            label: 'stretch strength buffer', 
            size: 4, 
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })
        device.queue.writeBuffer(filterXUniformBuffer, 0, filterXUniformsValues);
        device.queue.writeBuffer(filterYUniformBuffer, 0, filterYUniformsValues);
        this.filterXUniformBuffer = filterXUniformBuffer
        this.filterYUniformBuffer = filterYUniformBuffer

        // bindGroup
        this.depthMapBindGroup = device.createBindGroup({
            label: 'depth map bind group', 
            layout: this.depthMapPipeline.getBindGroupLayout(0),  
            entries: [
              { binding: 0, resource: { buffer: posvelBuffer }},
              { binding: 1, resource: { buffer: renderUniformBuffer }},
              { binding: 2, resource: { buffer: this.stretchStrengthBuffer }}
            ]
        })
        this.thicknessMapBindGroup = device.createBindGroup({
            label: 'thickness map bind group', 
            layout: this.thicknessMapPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: posvelBuffer }},
                { binding: 1, resource: { buffer: renderUniformBuffer }}, 
                { binding: 2, resource: { buffer: this.stretchStrengthBuffer }}
            ],
        })
        this.sphereBindGroup = device.createBindGroup({
            label: 'ball bind group', 
            layout: this.spherePipeline.getBindGroupLayout(0),  
            entries: [
                { binding: 0, resource: { buffer: posvelBuffer }},
                { binding: 1, resource: { buffer: renderUniformBuffer }},
                { binding: 2, resource: { buffer: this.stretchStrengthBuffer }}
            ]
        })

        this.buildSized(canvas, depthMapTextureView)
    }

    // ── LOCAL ADDITION ───────────────────────────────────────────────────────────
    // Everything whose validity depends on the canvas backing-store size. Three of the
    // six pipelines bake `screenWidth`/`screenHeight` (and the depth filter also bakes
    // `projected_particle_constant`, which is derived from canvas.height) as
    // pipeline-overridable constants — so a resize genuinely requires re-creating them,
    // not just the textures. `layout: 'auto'` gives each pipeline its own bind group
    // layout, so every bind group built against them must be re-created too.
    private buildSized(canvas: HTMLCanvasElement, depthMapTextureView: GPUTextureView) {
        const device = this.device
        const width = Math.max(1, canvas.width)
        const height = Math.max(1, canvas.height)

        const screenConstants = {
            'screenHeight': height,
            'screenWidth': width,
        }
        const filterConstants = {
            'depth_threshold' : this.radius * this.blurdDepthScale,
            'max_filter_size' : this.maxFilterSize,
            'projected_particle_constant' : (this.blurFilterSize * this.diameter * 0.05 * (height / 2)) / Math.tan(this.fov / 2),
        }

        this.depthFilterPipeline = device.createRenderPipeline({
            label: 'filter pipeline',
            layout: 'auto',
            vertex: { module: this.vertexModule, constants: screenConstants },
            fragment: {
                module: this.depthFilterModule,
                constants: filterConstants,
                targets: [{ format: 'r32float' }],
            },
            primitive: { topology: 'triangle-list' },
        })
        this.thicknessFilterPipeline = device.createRenderPipeline({
            label: 'thickness filter pipeline',
            layout: 'auto',
            vertex: { module: this.vertexModule, constants: screenConstants },
            fragment: {
                module: this.thicknessFilterModule,
                targets: [{ format: 'rg16float' }],
            },
            primitive: { topology: 'triangle-list' },
        })
        this.fluidPipeline = device.createRenderPipeline({
            label: 'fluid rendering pipeline',
            layout: 'auto',
            vertex: { module: this.vertexModule, constants: screenConstants },
            fragment: {
                module: this.fluidModule,
                targets: [{ format: this.presentationFormat }],
            },
            primitive: { topology: 'triangle-list' },
        })

        // free the previous generation before allocating the new one
        for (const t of this.sizedTextures) t.destroy()
        this.sizedTextures = []

        const mk = (label: string, format: GPUTextureFormat, usage: number) => {
            const t = device.createTexture({ label, size: [width, height, 1], format, usage })
            this.sizedTextures.push(t)
            return t
        }
        const RT = GPUTextureUsage.RENDER_ATTACHMENT
        const TB = GPUTextureUsage.TEXTURE_BINDING
        const tmpDepthMapTexture = mk('temporary depth map texture', 'r32float', RT | TB)
        const thicknessTexture = mk('thickness map texture', 'rg16float', RT | TB)
        const tmpThicknessTexture = mk('temporary thickness map texture', 'rg16float', RT | TB)
        const depthTestTexture = mk('depth test texture', 'depth32float', RT)

        this.depthMapTextureView = depthMapTextureView
        this.tmpDepthMapTextureView = tmpDepthMapTexture.createView()
        this.thicknessTextureView = thicknessTexture.createView()
        this.tmpThicknessTextureView = tmpThicknessTexture.createView()
        this.depthTestTextureView = depthTestTexture.createView()

        this.depthFilterBindGroups = [
            device.createBindGroup({
                label: 'filterX bind group',
                layout: this.depthFilterPipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 1, resource: this.depthMapTextureView }, // 元の領域から読み込む
                    { binding: 2, resource: { buffer: this.filterXUniformBuffer } },
                ],
            }),
            device.createBindGroup({
                label: 'filterY bind group',
                layout: this.depthFilterPipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 1, resource: this.tmpDepthMapTextureView }, // 一時領域から読み込む
                    { binding: 2, resource: { buffer: this.filterYUniformBuffer } },
                ],
            }),
        ]
        this.thicknessFilterBindGroups = [
            device.createBindGroup({
                label: 'thickness filterX bind group',
                layout: this.thicknessFilterPipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 1, resource: this.thicknessTextureView },
                    { binding: 2, resource: { buffer: this.filterXUniformBuffer } },
                ],
            }),
            device.createBindGroup({
                label: 'thickness filterY bind group',
                layout: this.thicknessFilterPipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 1, resource: this.tmpThicknessTextureView },
                    { binding: 2, resource: { buffer: this.filterYUniformBuffer } },
                ],
            }),
        ]
        this.fluidBindGroup = device.createBindGroup({
            label: 'fluid bind group',
            layout: this.fluidPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.sampler },
                { binding: 1, resource: this.depthMapTextureView },
                { binding: 2, resource: { buffer: this.renderUniformBuffer } },
                { binding: 3, resource: this.thicknessTextureView },
                { binding: 4, resource: this.cubemapTextureView },
            ],
        })
    }

    /** Re-derive every screen-sized resource after the canvas backing store changed. */
    resize(canvas: HTMLCanvasElement, depthMapTextureView: GPUTextureView) {
        this.buildSized(canvas, depthMapTextureView)
    }

    /** Release the screen-sized textures. Buffers/pipelines die with the device. */
    destroy() {
        for (const t of this.sizedTextures) t.destroy()
        this.sizedTextures = []
    }

    execute(context: GPUCanvasContext, commandEncoder: GPUCommandEncoder,
        numParticles: number, sphereRenderFl: boolean, stretchStrength: number)
    {
        this.stretchScratch[0] = stretchStrength
        this.device.queue.writeBuffer(this.stretchStrengthBuffer, 0, this.stretchScratch)

        const depthMapPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: this.depthMapTextureView,
                    clearValue: { r: 1e6, g: 0.0, b: 0.0, a: 1.0 }, // 背景は十分大きい深さの値でいいか？
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
            depthStencilAttachment: {
                view: this.depthTestTextureView,
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        }

        const depthFilterPassDescriptors: GPURenderPassDescriptor[] = [
            {
                colorAttachments: [
                    {
                        view: this.tmpDepthMapTextureView, 
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
            }, 
            {
                colorAttachments: [
                    {
                        view: this.depthMapTextureView, 
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
            }
        ]

        const thicknessMapPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: this.thicknessTextureView, 
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        }

        const thicknessFilterPassDescriptors: GPURenderPassDescriptor[] = [
            {
                colorAttachments: [
                    {
                        view: this.tmpThicknessTextureView, // 一時領域へ書き込み
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
            }, 
            {
                colorAttachments: [
                    {
                        view: this.thicknessTextureView, // Y のパスはもとに戻す
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
            }
        ]

        // ONE swap-chain view per frame. Both descriptors used to call
        // getCurrentTexture().createView() unconditionally, allocating two views and
        // using exactly one of them.
        const swapChainView = context.getCurrentTexture().createView()

        const fluidPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: swapChainView,
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 }, // transparent -> the REAL sea video (SeaBackdrop) shows through
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        }

        const spherePassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: swapChainView,
                    clearValue: { r: 0.7, g: 0.7, b: 0.75, a: 1.0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
                {
                    view: this.depthMapTextureView,
                    clearValue: { r: 1e6, g: 0.0, b: 0.0, a: 1.0 }, // 背景は十分大きい深さの値でいいか？
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
            depthStencilAttachment: {
                view: this.depthTestTextureView,
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        }

        if (!sphereRenderFl) {
            const depthMapPassEncoder = commandEncoder.beginRenderPass(depthMapPassDescriptor);
            depthMapPassEncoder.setBindGroup(0, this.depthMapBindGroup);
            depthMapPassEncoder.setPipeline(this.depthMapPipeline);
            depthMapPassEncoder.draw(6, numParticles);
            depthMapPassEncoder.end();
            for (var iter = 0; iter < 4; iter++) {
                const depthFilterPassEncoderX = commandEncoder.beginRenderPass(depthFilterPassDescriptors[0]);
                depthFilterPassEncoderX.setBindGroup(0, this.depthFilterBindGroups[0]);
                depthFilterPassEncoderX.setPipeline(this.depthFilterPipeline);
                depthFilterPassEncoderX.draw(6);
                depthFilterPassEncoderX.end();  
                const filterPassEncoderY = commandEncoder.beginRenderPass(depthFilterPassDescriptors[1]);
                filterPassEncoderY.setBindGroup(0, this.depthFilterBindGroups[1]);
                filterPassEncoderY.setPipeline(this.depthFilterPipeline);
                filterPassEncoderY.draw(6);
                filterPassEncoderY.end();  
            }
        
            const thicknessMapPassEncoder = commandEncoder.beginRenderPass(thicknessMapPassDescriptor);
            thicknessMapPassEncoder.setBindGroup(0, this.thicknessMapBindGroup);
            thicknessMapPassEncoder.setPipeline(this.thicknessMapPipeline);
            thicknessMapPassEncoder.draw(6, numParticles);
            thicknessMapPassEncoder.end();
        
            for (var iter = 0; iter < 3; iter++) { // softer thickness -> smoother edge fade
                const thicknessFilterPassEncoderX = commandEncoder.beginRenderPass(thicknessFilterPassDescriptors[0]);
                thicknessFilterPassEncoderX.setBindGroup(0, this.thicknessFilterBindGroups[0]);
                thicknessFilterPassEncoderX.setPipeline(this.thicknessFilterPipeline);
                thicknessFilterPassEncoderX.draw(6);
                thicknessFilterPassEncoderX.end(); 
                const thicknessFilterPassEncoderY = commandEncoder.beginRenderPass(thicknessFilterPassDescriptors[1]);
                thicknessFilterPassEncoderY.setBindGroup(0, this.thicknessFilterBindGroups[1]);
                thicknessFilterPassEncoderY.setPipeline(this.thicknessFilterPipeline);
                thicknessFilterPassEncoderY.draw(6);
                thicknessFilterPassEncoderY.end(); 
            }
      
            const fluidPassEncoder = commandEncoder.beginRenderPass(fluidPassDescriptor);
            fluidPassEncoder.setBindGroup(0, this.fluidBindGroup);
            fluidPassEncoder.setPipeline(this.fluidPipeline);
            fluidPassEncoder.draw(6);
            fluidPassEncoder.end();
        } else {
            const spherePassEncoder = commandEncoder.beginRenderPass(spherePassDescriptor);
            spherePassEncoder.setBindGroup(0, this.sphereBindGroup);
            spherePassEncoder.setPipeline(this.spherePipeline);
            spherePassEncoder.draw(6, numParticles);
            spherePassEncoder.end();
        }
    }
}