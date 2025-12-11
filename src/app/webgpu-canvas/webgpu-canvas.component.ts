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
  pointColor = '#ffffff';
  pointAlpha = 1.0;
  pointSizeScale = 1.0;
  pointEdge = 0.0;

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
      await this.webGpuRenderer.initializeScene();
      // Initialize point-sprite controls
      this.webGpuRenderer.setPointColorHex(this.pointColor);
      this.webGpuRenderer.setPointAlpha(this.pointAlpha);
      this.webGpuRenderer.setPointSizeScale(this.pointSizeScale);
      this.webGpuRenderer.setPointEdge(this.pointEdge);
      const unregister = this.renderLoopService.register((dt, time) => {
        this.webGpuRenderer.renderFrame(dt, time);
      });
      this.renderLoopService.start();
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
}
