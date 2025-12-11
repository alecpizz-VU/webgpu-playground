import { Injectable } from '@angular/core';
import { WebgpuContextService } from './webgpu-context.service';
import { ShaderLibraryService } from './shader-library.service';
import { PointSpriteUniforms } from './point-sprite-uniforms';
import { ParticleArrayV1, ParticleLayoutV1 } from './particle-array-v1';

@Injectable({
  providedIn: 'root',
})
export class PointSpriteRendererService {
  private pipeline?: GPURenderPipeline;
  private particleBuffer?: GPUBuffer;
  private initalized: boolean = false;
  private instanceCapacity: number = 0;
  private uniformBuffer?: GPUBuffer;
  private uniforms = new PointSpriteUniforms();
  private bindGroup?: GPUBindGroup;
  // Current UI-controlled settings (mirrored in the uniform buffer)
  private sizeScale: number = 1.0;
  private edge: number = 0.0; // additional softness in UV units; 0 lets fwidth drive AA
  private color: { r: number; g: number; b: number; a: number } = {
    r: 1,
    g: 1,
    b: 1,
    a: 1,
  };
  // World-space camera: view center and zoom
  private viewCenter = { x: 0.0, y: 0.0 };
  private zoom = 0.2;
  constructor(
    private webGpuContextService: WebgpuContextService,
    private shaderLibraryService: ShaderLibraryService
  ) {}

  async initialize(instanceCount: number): Promise<void> {
    if (this.initalized) {
      return;
    }

    const device = this.webGpuContextService.getDevice();
    const format = this.webGpuContextService.getPresentationFormat();
    const context = this.webGpuContextService.getContext();
    if (!device || !format || !context) {
      return;
    }

    this.instanceCapacity = instanceCount;
    const particleBuffer = device.createBuffer({
      size: instanceCount * ParticleLayoutV1.STRIDE * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const shaderModule = device.createShaderModule({
      code: this.shaderLibraryService.getShaderSource('points'),
    });

    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
        buffers: [],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [
          {
            format,
            blend: {
              color: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
            },
          },
        ],
      },
    });

    // Uniform layout (float32):
    // [0]=resolution.x, [1]=resolution.y,
    // [2]=sizeScale,    [3]=edge,
    // [4]=color.r,      [5]=color.g, [6]=color.b, [7]=color.a,
    // [8]=viewCenter.x, [9]=viewCenter.y,
    // [10]=zoom,        [11]=pad
    const uniformBuffer = device.createBuffer({
      size: this.uniforms.values.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Initialize uniforms
    this.uniforms.setResolution(context.canvas.width, context.canvas.height);
    this.uniforms.setSizeScale(this.sizeScale);
    this.uniforms.setEdge(this.edge);
    this.uniforms.setColor(this.color.r, this.color.g, this.color.b, this.color.a);
    this.uniforms.setViewCenter(this.viewCenter.x, this.viewCenter.y);
    this.uniforms.setZoom(this.zoom);
    this.uniforms.writeAll(device, uniformBuffer);

    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: { buffer: particleBuffer } },
      ],
    });

    this.bindGroup = bindGroup;
    this.uniformBuffer = uniformBuffer;
    this.particleBuffer = particleBuffer;
    this.pipeline = pipeline;
    this.initalized = true;
  }

  draw(renderPass: GPURenderPassEncoder, instanceCount: number) {
    if (this.bindGroup) {
      renderPass.setBindGroup(0, this.bindGroup);
    }
    if (this.pipeline) {
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.draw(6, instanceCount, 0, 0);
    }
  }

  uploadParticlesFromCPU(particles: ParticleArrayV1): void {
    const device = this.webGpuContextService.getDevice();
    if (!device || !this.particleBuffer) return;
    device.queue.writeBuffer(this.particleBuffer, 0, particles.data as any);
  }

  updateResolutionFromContext() {
    const device = this.webGpuContextService.getDevice();
    const context = this.webGpuContextService.getContext();
    if (!device || !context || !this.uniformBuffer) return;
    const w = context.canvas.width;
    const h = context.canvas.height;
    this.uniforms.setResolution(w, h);
    this.uniforms.writeResolution(device, this.uniformBuffer);
  }

  setPointSizeScale(scale: number) {
    this.sizeScale = scale;
    const device = this.webGpuContextService.getDevice();
    if (!device || !this.uniformBuffer) return;
    this.uniforms.setSizeScale(this.sizeScale);
    this.uniforms.writeSizeScale(device, this.uniformBuffer);
  }

  setPointEdge(edge: number) {
    this.edge = edge;
    const device = this.webGpuContextService.getDevice();
    if (!device || !this.uniformBuffer) return;
    this.uniforms.setEdge(this.edge);
    this.uniforms.writeEdge(device, this.uniformBuffer);
  }

  setPointColorHex(hex: string) {
    const { r, g, b } = this.hexToRgbNormalized(hex);
    this.color = { r, g, b, a: this.color.a };
    const device = this.webGpuContextService.getDevice();
    if (!device || !this.uniformBuffer) return;
    this.uniforms.setColor(this.color.r, this.color.g, this.color.b, this.color.a);
    this.uniforms.writeColor(device, this.uniformBuffer);
  }

  setPointAlpha(a: number) {
    this.color.a = a;
    const device = this.webGpuContextService.getDevice();
    if (!device || !this.uniformBuffer) return;
    this.uniforms.setColor(this.color.r, this.color.g, this.color.b, this.color.a);
    this.uniforms.writeColor(device, this.uniformBuffer);
  }

  private hexToRgbNormalized(hex: string) {
    const raw = hex.replace('#', '');
    const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
    const v = parseInt(full, 16);
    const r = (v >> 16) & 255;
    const g = (v >> 8) & 255;
    const b = v & 255;
    return { r: r / 255, g: g / 255, b: b / 255 };
  }

  setViewCenter(x: number, y: number) {
    this.viewCenter = { x, y };
    const device = this.webGpuContextService.getDevice();
    if (!device || !this.uniformBuffer) return;
    this.uniforms.setViewCenter(x, y);
    this.uniforms.writeViewCenter(device, this.uniformBuffer);
  }

  setZoom(z: number) {
    this.zoom = z;
    const device = this.webGpuContextService.getDevice();
    if (!device || !this.uniformBuffer) return;
    this.uniforms.setZoom(z);
    this.uniforms.writeZoom(device, this.uniformBuffer);
  }
}
