import { Injectable } from '@angular/core';
import { ParticleArrayV1 } from './particle-array-v1';
import {
  ParticleSimulationServiceInterface,
} from './particle-simulation.token';
import { CpuParticleSimulationService } from './cpu-particle-simulation.service';
import { WebgpuContextService } from './webgpu-context.service';
import { ShaderLibraryService } from './shader-library.service';
import { ParticleSimUniforms } from './particle-sim-uniforms';

@Injectable({
  providedIn: 'root',
})
export class GpuParticleSimulationService
  implements ParticleSimulationServiceInterface
{
  private computePipeline?: GPUComputePipeline;
  private computeBindGroup?: GPUBindGroup;
  private particleBuffer?: GPUBuffer;
  private instanceCapacity = 0;
  private providedInitialParticles = false;
  private uniformBuffer?: GPUBuffer;
  private uniforms = new ParticleSimUniforms();
  private mouseInfluence = 0;
  private mouseHover = false;
  private hasMouseTarget = false;
  private attractionSmoothingSeconds = 0.3;
  private simTime = 0;

  constructor(
    private cpuFallback: CpuParticleSimulationService,
    private webGpuContextService: WebgpuContextService,
    private shaderLibraryService: ShaderLibraryService
  ) {}

  initialize(count?: number): void {
    this.cpuFallback.initialize(count);
    this.providedInitialParticles = false;
    this.simTime = 0;
    this.ensureComputePipeline();
    this.ensureUniformBuffer();

    // Initialize world bounds to match the CPU simulation defaults.
    this.uniforms.setWorldBounds(-10, -10, 10, 10);
  }

  getParticles(): ParticleArrayV1 | undefined {
    if (this.providedInitialParticles) {
      // After the initial upload, we no longer expose CPU particles so that
      // the renderer does not overwrite GPU-updated storage data each frame.
      return undefined;
    }

    const particles = this.cpuFallback.getParticles();
    this.providedInitialParticles = true;
    return particles;
  }

  getInstanceCount(): number {
    return this.cpuFallback.getInstanceCount();
  }

  setStorageBuffer(buffer: GPUBuffer, capacity: number): void {
    this.particleBuffer = buffer;
    this.instanceCapacity = capacity;
    this.ensureComputePipeline();
    this.ensureUniformBuffer();
    this.ensureComputeBindGroup();
  }

  setMouseTarget(x: number, y: number, hover: boolean): void {
    this.cpuFallback.setMouseTarget(x, y, hover);
    this.uniforms.setMouseTarget(x, y);
    this.mouseHover = hover;
    this.hasMouseTarget = hover;
  }

  step(dt: number): void {
    //this.cpuFallback.step(dt);
    this.ensureComputePipeline();
    this.ensureUniformBuffer();

    const device = this.webGpuContextService.getDevice();
    if (!device || !this.uniformBuffer) {
      return;
    }

    this.simTime += dt;

    // Smooth mouse influence towards target (0 or 1) using the same
    // exponential decay as the CPU simulation.
    const targetInfluence = this.mouseHover && this.hasMouseTarget ? 1.0 : 0.0;
    const tau = this.attractionSmoothingSeconds;
    const alpha = tau > 0 ? 1.0 - Math.exp(-dt / tau) : 1.0;
    this.mouseInfluence += (targetInfluence - this.mouseInfluence) * alpha;
    this.uniforms.setMouseInfluence(this.mouseInfluence);

    this.uniforms.setDt(dt);
    this.uniforms.setTime(this.simTime);
    this.uniforms.setParticleCount(this.instanceCapacity);
    this.uniforms.writeAll(device, this.uniformBuffer);
    this.dispatchNoOpCompute();
  }

  setBaseAttract(value: number): void {
    this.cpuFallback.setBaseAttract(value);
    this.uniforms.setBaseAttract(value);
  }

  setDrag(value: number): void {
    this.cpuFallback.setDrag(value);
    this.uniforms.setDrag(value);
  }

  setAttractionFalloff(value: number): void {
    this.cpuFallback.setAttractionFalloff(value);
    this.uniforms.setAttractionFalloff(value);
  }

  setMinDriftSpeed(value: number): void {
    this.cpuFallback.setMinDriftSpeed(value);
    this.uniforms.setMinDriftSpeed(value);
  }

  setMaxDriftSpeed(value: number): void {
    this.cpuFallback.setMaxDriftSpeed(value);
    this.uniforms.setMaxDriftSpeed(value);
  }

  setAttractionSmoothing(seconds: number): void {
    this.cpuFallback.setAttractionSmoothing(seconds);
    this.uniforms.setAttractionSmoothing(seconds);
    this.attractionSmoothingSeconds = seconds;
  }

  private ensureComputePipeline(): void {
    if (this.computePipeline) {
      return;
    }

    const device = this.webGpuContextService.getDevice();
    if (!device) {
      return;
    }

    const module = device.createShaderModule({
      code: this.shaderLibraryService.getShaderSource('particleCompute'),
    });

    this.computePipeline = device.createComputePipeline({
      layout: 'auto',
      compute: {
        module,
        entryPoint: 'cs_main',
      },
    });

    // If we already have resources, (re)build the bind group.
    if (this.particleBuffer && this.uniformBuffer) {
      this.ensureComputeBindGroup();
    }
  }

  private ensureUniformBuffer(): void {
    if (this.uniformBuffer) {
      return;
    }

    const device = this.webGpuContextService.getDevice();
    if (!device) {
      return;
    }

    this.uniformBuffer = device.createBuffer({
      size: this.uniforms.values.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  private ensureComputeBindGroup(): void {
    const device = this.webGpuContextService.getDevice();
    if (!device || !this.computePipeline || !this.particleBuffer || !this.uniformBuffer) {
      return;
    }

    const layout = this.computePipeline.getBindGroupLayout(0);
    this.computeBindGroup = device.createBindGroup({
      layout,
      entries: [
        { binding: 0, resource: { buffer: this.particleBuffer } },
        { binding: 1, resource: { buffer: this.uniformBuffer } },
      ],
    });
  }

  private dispatchNoOpCompute(): void {
    const device = this.webGpuContextService.getDevice();
    if (!device || !this.computePipeline || !this.computeBindGroup) {
      return;
    }

    const commandEncoder = device.createCommandEncoder();
    const pass = commandEncoder.beginComputePass();
    pass.setPipeline(this.computePipeline);
    pass.setBindGroup(0, this.computeBindGroup);
    // Dispatch enough workgroups to cover all particles along X.
    const workgroupSize = 64;
    const numWorkgroups = Math.ceil(this.instanceCapacity / workgroupSize);
    if (numWorkgroups > 0) {
      pass.dispatchWorkgroups(numWorkgroups);
    }
    pass.end();
    device.queue.submit([commandEncoder.finish()]);
  }
}
