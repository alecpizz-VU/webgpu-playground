import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WebgpuContextService {
  private device?: GPUDevice;
  private context?: GPUCanvasContext;
  private presentationFormat?: GPUTextureFormat;

  private supported: boolean = true;
  private gpuName: string | null = null;

  getDevice(): GPUDevice | undefined {
    return this.device;
  }

  getContext(): GPUCanvasContext | undefined {
    return this.context;
  }

  getPresentationFormat(): GPUTextureFormat | undefined {
    return this.presentationFormat;
  }

  isSupported(): boolean {
    return this.supported;
  }

  getGpuName(): string | null {
    return this.gpuName;
  }

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    try {
      if (!('gpu' in navigator)) {
        this.supported = false;
        console.error('WebGPU not supported');
        return;
      }

      const adapter = await (navigator as any).gpu.requestAdapter();
      if (!adapter) {
        this.supported = false;
        return;
      }

      const adapterInfo = adapter.info;
      this.gpuName = `${adapterInfo.vendor} `;

      const device = await adapter.requestDevice();
      const context = canvas.getContext('webgpu') as GPUCanvasContext;

      const presentationFormat = (
        navigator as any
      ).gpu.getPreferredCanvasFormat();

      context.configure({
        device,
        format: presentationFormat,
        alphaMode: 'opaque',
      });

      // store references for later updates
      this.device = device;
      this.context = context;
      this.presentationFormat = presentationFormat;

    } catch (e) {
      console.error(`FAILED TO INIT! ${e}`);
      this.supported = false;
    }
  }
}
