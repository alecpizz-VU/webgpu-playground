import { Injectable } from '@angular/core';
import { WebgpuContextService } from './webgpu-context.service';
import { RenderSettingsService } from './render-settings.service';
import { TriangleRendererService } from './triangle-renderer.service';
import { PointSpriteRendererService } from './point-sprite-renderer.service';
@Injectable({
  providedIn: 'root',
})
export class WebgpuRendererService {
  private rotateSpeed : number = 1.0;
  constructor(
    private webGpuContextService: WebgpuContextService,
    private renderSettingsService: RenderSettingsService,
    private pointRendererService: PointSpriteRendererService
  ) {}

  async initializeScene() {
    await this.pointRendererService.initialize();
  }

  renderFrame(dt: number, time: number) {
    const device = this.webGpuContextService.getDevice();
    const context = this.webGpuContextService.getContext();
    if (!device || !context) {
      return;
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

    this.pointRendererService.draw(renderPass);
    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  setRotateSpeed(speed: number): void {
    this.rotateSpeed = speed;
  }

  // Forwarders for point-sprite controls
  setPointSizeScale(scale: number): void {
    this.pointRendererService.setPointSizeScale(scale);
  }

  setPointEdge(edge: number): void {
    this.pointRendererService.setPointEdge(edge);
  }

  setPointColorHex(hex: string): void {
    this.pointRendererService.setPointColorHex(hex);
  }

  setPointAlpha(a: number): void {
    this.pointRendererService.setPointAlpha(a);
  }
}
