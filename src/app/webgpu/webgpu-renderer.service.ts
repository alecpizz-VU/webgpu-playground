import { Inject, Injectable } from '@angular/core';
import { WebgpuContextService } from './webgpu-context.service';
import { RenderSettingsService } from './render-settings.service';
import { PointSpriteRendererService } from './point-sprite-renderer.service';
import {
  PARTICLE_SIMULATION_SERVICE,
  ParticleSimulationServiceInterface,
} from './particle-simulation.token';
@Injectable({
  providedIn: 'root',
})
export class WebgpuRendererService {
  private rotateSpeed : number = 1.0;
  private mousePosPixels: { x: number; y: number } | null = null;
  private mouseOver: boolean = false;
  private basePointAlpha: number = 1.0;
  private basePointSizeScale: number = 1.0;
  constructor(
    private webGpuContextService: WebgpuContextService,
    private renderSettingsService: RenderSettingsService,
    private pointRendererService: PointSpriteRendererService,
    @Inject(PARTICLE_SIMULATION_SERVICE)
    private simService: ParticleSimulationServiceInterface
  ) {}

  async initializeScene(particleCount: number) {
    this.simService.initialize(particleCount);
    await this.pointRendererService.initialize(this.simService.getInstanceCount());
    const particleBuffer = this.pointRendererService.getParticleBuffer();
    const capacity = this.pointRendererService.getInstanceCapacity();
    if (particleBuffer) {
      this.simService.setStorageBuffer(particleBuffer, capacity);
    }
    const particles = this.simService.getParticles();
    if (particles) {
      this.pointRendererService.uploadParticlesFromCPU(particles);
    }
  }

  renderFrame(dt: number, time: number) {
    const device = this.webGpuContextService.getDevice();
    const context = this.webGpuContextService.getContext();
    if (!device || !context) {
      return;
    }

    if (this.mouseOver && this.mousePosPixels) {
      const canvas = context.canvas;
      const w = canvas.width;
      const h = canvas.height;

      // Screen-space (pixels) to NDC (-1..1)
      const ndcX = (this.mousePosPixels.x / w) * 2 - 1;
      const ndcY = 1 - (this.mousePosPixels.y / h) * 2;

      const viewCenter = this.pointRendererService.getViewCenter();
      const zoom = this.pointRendererService.getZoom();
      const zoomX = zoom * (h / w);

      const worldX = ndcX / zoomX + viewCenter.x;
      const worldY = ndcY / zoom + viewCenter.y;

      this.simService.setMouseTarget(worldX, worldY, true);
    } else {
      this.simService.setMouseTarget(0, 0, false);
    }

    this.simService.step(dt * 0.001);
    const particles = this.simService.getParticles();
    if (particles) {
      this.pointRendererService.uploadParticlesFromCPU(particles);
    }

    // Keep point-sprite resolution in sync with canvas size
    this.pointRendererService.updateResolutionFromContext();

    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: this.renderSettingsService.getClearColor(),
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });

    const instanceCount = this.simService.getInstanceCount();
    this.pointRendererService.draw(renderPass, instanceCount);
    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  setRotateSpeed(speed: number): void {
    this.rotateSpeed = speed;
  }

  setMousePositionPixels(x: number, y: number): void {
    this.mousePosPixels = { x, y };
  }

  setMouseOver(isOver: boolean): void {
    this.mouseOver = isOver;
  }

  setParticleCount(count: number): void {
    this.simService.initialize(count);
    this.pointRendererService.resizeParticleBuffer(this.simService.getInstanceCount());
    const particleBuffer = this.pointRendererService.getParticleBuffer();
    const capacity = this.pointRendererService.getInstanceCapacity();
    if (particleBuffer) {
      this.simService.setStorageBuffer(particleBuffer, capacity);
    }
    const particles = this.simService.getParticles();
    if (particles) {
      this.pointRendererService.uploadParticlesFromCPU(particles);
    }
    this.updateEffectivePointAlpha();
  }

  // Forwarders for point-sprite controls
  setPointSizeScale(scale: number): void {
    this.basePointSizeScale = scale;
    this.updateEffectivePointAlpha();
  }

  setPointEdge(edge: number): void {
    this.pointRendererService.setPointEdge(edge);
  }

  setPointColorHex(hex: string): void {
    this.pointRendererService.setPointColorHex(hex);
  }

  setPointAlpha(a: number): void {
    this.basePointAlpha = a;
    this.updateEffectivePointAlpha();
  }

  // Forwarders for simulation controls
  setAttractionStrength(value: number): void {
    this.simService.setBaseAttract(value);
  }

  setAttractionFalloff(value: number): void {
    this.simService.setAttractionFalloff(value);
  }

  setDrag(value: number): void {
    this.simService.setDrag(value);
  }

  setMinDriftSpeed(value: number): void {
    this.simService.setMinDriftSpeed(value);
  }

  setMaxDriftSpeed(value: number): void {
    this.simService.setMaxDriftSpeed(value);
  }

  setAttractionSmoothing(seconds: number): void {
    this.simService.setAttractionSmoothing(seconds);
  }

  private updateEffectivePointAlpha(): void {
    const count = this.simService.getInstanceCount();
    const referenceCount = 10000;
    const minFactor = 0.1;
    let factor = 1.0;

    if (count > referenceCount) {
      const ratio = referenceCount / count;
      const gamma = 0.5;
      factor = Math.pow(ratio, gamma);
      if (factor < minFactor) {
        factor = minFactor;
      }
    }

    const effectiveAlpha = Math.max(0, Math.min(1, this.basePointAlpha * factor));
    const effectiveSizeScale = this.basePointSizeScale * factor;
    this.pointRendererService.setPointAlpha(effectiveAlpha);
    this.pointRendererService.setPointSizeScale(effectiveSizeScale);
  }
}
