import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';
import { WebgpuContextService } from '../webgpu/webgpu-context.service';
import { WebgpuRendererService } from '../webgpu/webgpu-renderer.service';
import { RenderLoopService } from '../webgpu/render-loop.service';
import { RenderSettingsService } from '../webgpu/render-settings.service';

@Component({
  selector: 'app-webgpu-canvas',
  standalone: true,
  imports: [NgIf],
  templateUrl: './webgpu-canvas.component.html',
  styleUrl: './webgpu-canvas.component.css',
})
export class WebgpuCanvasComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;
  gpuName: string | null = null;
  supported = true;
  backgroundColor = '#00000';
  rotationSpeed = 1.0;
  // Point sprite controls
  pointColor = '#13816b';
  pointAlpha = 1.0;
  pointSizeScale = 1.0;
  pointEdge = 0.0;
  // Simulation controls
  particleCount = 10000;
  attractionStrength = 1.3;
  attractionFalloff = 0.1;
  drag = 0.5;
  minDriftSpeed = 0.3;
  maxDriftSpeed = 1.0;
  attractionSmoothing = 0.3;

  constructor(
    private webGpuContext: WebgpuContextService,
    private webGpuRenderer: WebgpuRendererService,
    private renderLoopService: RenderLoopService,
    private renderSettingsService: RenderSettingsService
  ) {}


  async ngAfterViewInit(): Promise<void> {
    const canvas = this.canvasRef.nativeElement;
    await this.webGpuContext.initialize(canvas);
    this.supported = this.webGpuContext.isSupported();
    this.gpuName = this.webGpuContext.getGpuName();
    if (this.supported) {
      this.renderSettingsService.setClearColorHex(this.backgroundColor);
      await this.webGpuRenderer.initializeScene(this.particleCount);
      // Initialize point-sprite controls
      this.webGpuRenderer.setPointColorHex(this.pointColor);
      this.webGpuRenderer.setPointAlpha(this.pointAlpha);
      this.webGpuRenderer.setPointSizeScale(this.pointSizeScale);
      this.webGpuRenderer.setPointEdge(this.pointEdge);
      // Initialize simulation controls
      this.webGpuRenderer.setAttractionStrength(this.attractionStrength);
      this.webGpuRenderer.setAttractionFalloff(this.attractionFalloff);
      this.webGpuRenderer.setDrag(this.drag);
      this.webGpuRenderer.setMinDriftSpeed(this.minDriftSpeed);
      this.webGpuRenderer.setMaxDriftSpeed(this.maxDriftSpeed);
      this.webGpuRenderer.setAttractionSmoothing(this.attractionSmoothing);
      const unregister = this.renderLoopService.register((dt, time) => {
        this.webGpuRenderer.renderFrame(dt, time);
      });
      this.renderLoopService.start();

      canvas.addEventListener('pointermove', this.handlePointerMove);
      canvas.addEventListener('pointerenter', this.handlePointerEnter);
      canvas.addEventListener('pointerleave', this.handlePointerLeave);
    }
  }

  updateBackgroundColor(hex: string) {
    this.backgroundColor = hex;
    this.renderSettingsService.setClearColorHex(this.backgroundColor);
  }

  updateRotationSpeed(speed: number) {
    this.rotationSpeed = speed;
    this.webGpuRenderer.setRotateSpeed(this.rotationSpeed);
  }

  // Point-sprite control handlers
  updatePointColor(hex: string) {
    this.pointColor = hex;
    this.webGpuRenderer.setPointColorHex(this.pointColor);
  }

  updatePointAlpha(a: number) {
    this.pointAlpha = a;
    this.webGpuRenderer.setPointAlpha(this.pointAlpha);
  }

  updatePointSizeScale(scale: number) {
    this.pointSizeScale = scale;
    this.webGpuRenderer.setPointSizeScale(this.pointSizeScale);
  }

  updatePointEdge(edge: number) {
    this.pointEdge = edge;
    this.webGpuRenderer.setPointEdge(this.pointEdge);
  }

  // Simulation control handlers
  updateAttractionStrength(value: number) {
    this.attractionStrength = value;
    this.webGpuRenderer.setAttractionStrength(this.attractionStrength);
  }

  updateAttractionFalloff(value: number) {
    this.attractionFalloff = value;
    this.webGpuRenderer.setAttractionFalloff(this.attractionFalloff);
  }

  updateDrag(value: number) {
    this.drag = value;
    this.webGpuRenderer.setDrag(this.drag);
  }

  updateMinDriftSpeed(value: number) {
    this.minDriftSpeed = value;
    this.webGpuRenderer.setMinDriftSpeed(this.minDriftSpeed);
  }

  updateMaxDriftSpeed(value: number) {
    this.maxDriftSpeed = value;
    this.webGpuRenderer.setMaxDriftSpeed(this.maxDriftSpeed);
  }

  updateAttractionSmoothing(value: number) {
    this.attractionSmoothing = value;
    this.webGpuRenderer.setAttractionSmoothing(this.attractionSmoothing);
  }

  updateParticleCount(value: number) {
    this.particleCount = Math.floor(value);
    this.webGpuRenderer.setParticleCount(this.particleCount);
  }

  private handlePointerMove = (event: PointerEvent) => {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.webGpuRenderer.setMousePositionPixels(x, y);
  };

  private handlePointerEnter = () => {
    this.webGpuRenderer.setMouseOver(true);
  };

  private handlePointerLeave = () => {
    this.webGpuRenderer.setMouseOver(false);
  };
}
