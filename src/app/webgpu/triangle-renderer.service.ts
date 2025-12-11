import { Injectable } from '@angular/core';
import { WebgpuContextService } from './webgpu-context.service';
import { ShaderLibraryService } from './shader-library.service';

@Injectable({
  providedIn: 'root',
})
export class TriangleRendererService {
  private pipeline?: GPURenderPipeline;
  private vertexBuffer?: GPUBuffer;
  private initalized: boolean = false;
  private buffer?: GPUBuffer;
  private bindGroup?: GPUBindGroup;

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
    if (!device || !format) {
      return;
    }

    const vertices = new Float32Array([-0.5, -0.5, +0.5, -0.5, +0.0, +0.5]);

    const vertexBuffer = device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
    vertexBuffer.unmap();

    const globalsBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const shaderModule = device.createShaderModule({
      code: this.shaderLibraryService.getShaderSource('triangle'),
    });

    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
        buffers: [
          {
            arrayStride: 2 * 4,
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: 'float32x2',
              },
            ],
          },
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [{ format }],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });

    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: globalsBuffer },
        },
      ],
    });

    this.buffer = globalsBuffer;
    this.bindGroup = bindGroup;
    this.vertexBuffer = vertexBuffer;
    this.pipeline = pipeline;
    this.initalized = true;
  }

  updateGlobals(timeSeconds: number, rotateSpeed: number) {
    if (!this.buffer) {
      return;
    }
    const device = this.webGpuContextService.getDevice();
    if (!device) {
      return;
    }
    const t = timeSeconds;
    device.queue.writeBuffer(
      this.buffer,
      0,
      new Float32Array([t, rotateSpeed])
    );
  }

  draw(passEncoder: GPURenderPassEncoder) {
    if (this.bindGroup) {
      passEncoder.setBindGroup(0, this.bindGroup);
    }

    if (this.pipeline && this.vertexBuffer) {
      passEncoder.setPipeline(this.pipeline);
      passEncoder.setVertexBuffer(0, this.vertexBuffer);
      passEncoder.draw(3, 1, 0, 0);
    }
  }

  dispose() {}
}
