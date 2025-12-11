import { Injectable } from '@angular/core';
import { WebgpuContextService } from './webgpu-context.service';
import { ShaderLibraryService } from './shader-library.service';

@Injectable({
  providedIn: 'root',
})
export class PointSpriteRendererService {
  private pipeline?: GPURenderPipeline;
  private vertexBuffer?: GPUBuffer;
  private initalized: boolean = false;
  private numPoints: number = 128;
  private uniformBuffer?: GPUBuffer;
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

  async initialize(): Promise<void> {
    if (this.initalized) {
      return;
    }

    const device = this.webGpuContextService.getDevice();
    const format = this.webGpuContextService.getPresentationFormat();
    const context = this.webGpuContextService.getContext();
    if (!device || !format || !context) {
      return;
    }

    const vertices = this.randomPoints(this.numPoints);
    const vertexBuffer = device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(vertexBuffer, 0, vertices);

    const shaderModule = device.createShaderModule({
      code: this.shaderLibraryService.getShaderSource('points'),
    });

    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
        buffers: [
          {
            arrayStride: (2 + 1) * 4,
            stepMode: 'instance',
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: 'float32x2',
              },
              {
                shaderLocation: 1,
                offset: 8,
                format: 'float32',
              },
            ],
          },
        ],
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
    const uniformValues = new Float32Array(12);
    const uniformBuffer = device.createBuffer({
      size: uniformValues.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Initialize uniforms
    uniformValues[0] = context.canvas.width;
    uniformValues[1] = context.canvas.height;
    uniformValues[2] = this.sizeScale;
    uniformValues[3] = this.edge;
    uniformValues[4] = this.color.r;
    uniformValues[5] = this.color.g;
    uniformValues[6] = this.color.b;
    uniformValues[7] = this.color.a;
    uniformValues[8] = this.viewCenter.x;
    uniformValues[9] = this.viewCenter.y;
    uniformValues[10] = this.zoom;
    uniformValues[11] = 0.0;
    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
    });

    this.bindGroup = bindGroup;
    this.uniformBuffer = uniformBuffer;
    this.vertexBuffer = vertexBuffer;
    this.pipeline = pipeline;
    this.initalized = true;
  }

  draw(renderPass: GPURenderPassEncoder) {
    if (this.bindGroup) {
      renderPass.setBindGroup(0, this.bindGroup);
    }
    if (this.pipeline && this.vertexBuffer) {
      renderPass.setPipeline(this.pipeline);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.draw(6, this.numPoints, 0, 0);
    }
  }

  updateResolutionFromContext() {
    const device = this.webGpuContextService.getDevice();
    const context = this.webGpuContextService.getContext();
    if (!device || !context || !this.uniformBuffer) return;
    const w = context.canvas.width;
    const h = context.canvas.height;
    device.queue.writeBuffer(this.uniformBuffer, 0, new Float32Array([w, h]));
  }

  setPointSizeScale(scale: number) {
    this.sizeScale = scale;
    const device = this.webGpuContextService.getDevice();
    if (!device || !this.uniformBuffer) return;
    device.queue.writeBuffer(this.uniformBuffer, 2 * 4, new Float32Array([this.sizeScale]));
  }

  setPointEdge(edge: number) {
    this.edge = edge;
    const device = this.webGpuContextService.getDevice();
    if (!device || !this.uniformBuffer) return;
    device.queue.writeBuffer(this.uniformBuffer, 3 * 4, new Float32Array([this.edge]));
  }

  setPointColorHex(hex: string) {
    const { r, g, b } = this.hexToRgbNormalized(hex);
    this.color = { r, g, b, a: this.color.a };
    const device = this.webGpuContextService.getDevice();
    if (!device || !this.uniformBuffer) return;
    device.queue.writeBuffer(
      this.uniformBuffer,
      4 * 4,
      new Float32Array([this.color.r, this.color.g, this.color.b, this.color.a])
    );
  }

  setPointAlpha(a: number) {
    this.color.a = a;
    const device = this.webGpuContextService.getDevice();
    if (!device || !this.uniformBuffer) return;
    device.queue.writeBuffer(this.uniformBuffer, 7 * 4, new Float32Array([this.color.a]));
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
    device.queue.writeBuffer(this.uniformBuffer, 8 * 4, new Float32Array([x, y]));
  }

  setZoom(z: number) {
    this.zoom = z;
    const device = this.webGpuContextService.getDevice();
    if (!device || !this.uniformBuffer) return;
    device.queue.writeBuffer(this.uniformBuffer, 10 * 4, new Float32Array([z]));
  }

  private randomPoints(count: number): Float32Array {
    const data = new Float32Array(count * 3);
    const rand = (min: number, max: number) =>
      min + Math.random() * (max - min);
    for (let i = 0; i < count; i++) {
      const offset = i * 3;
      data[offset + 0] = rand(-5, 5);
      data[offset + 1] = rand(-5, 5);
      data[offset + 2] = rand(1, 8);
    }

    return data;
  }
}
