export const PointSpriteUniformIndex = {
  RESOLUTION_X: 0,
  RESOLUTION_Y: 1,
  SIZE_SCALE: 2,
  EDGE: 3,
  COLOR_R: 4,
  COLOR_G: 5,
  COLOR_B: 6,
  COLOR_A: 7,
  VIEW_CENTER_X: 8,
  VIEW_CENTER_Y: 9,
  ZOOM: 10,
  PAD: 11,
} as const;

export class PointSpriteUniforms {
  readonly values: Float32Array;

  constructor() {
    this.values = new Float32Array(12);
  }

  setResolution(width: number, height: number): void {
    this.values[PointSpriteUniformIndex.RESOLUTION_X] = width;
    this.values[PointSpriteUniformIndex.RESOLUTION_Y] = height;
  }

  setSizeScale(scale: number): void {
    this.values[PointSpriteUniformIndex.SIZE_SCALE] = scale;
  }

  setEdge(edge: number): void {
    this.values[PointSpriteUniformIndex.EDGE] = edge;
  }

  setColor(r: number, g: number, b: number, a: number): void {
    this.values[PointSpriteUniformIndex.COLOR_R] = r;
    this.values[PointSpriteUniformIndex.COLOR_G] = g;
    this.values[PointSpriteUniformIndex.COLOR_B] = b;
    this.values[PointSpriteUniformIndex.COLOR_A] = a;
  }

  setViewCenter(x: number, y: number): void {
    this.values[PointSpriteUniformIndex.VIEW_CENTER_X] = x;
    this.values[PointSpriteUniformIndex.VIEW_CENTER_Y] = y;
  }

  setZoom(zoom: number): void {
    this.values[PointSpriteUniformIndex.ZOOM] = zoom;
  }

  writeAll(device: GPUDevice, buffer: GPUBuffer): void {
    device.queue.writeBuffer(buffer, 0, this.values as any);
  }

  writeResolution(device: GPUDevice, buffer: GPUBuffer): void {
    this.writeRange(device, buffer, PointSpriteUniformIndex.RESOLUTION_X, 2);
  }

  writeSizeScale(device: GPUDevice, buffer: GPUBuffer): void {
    this.writeRange(device, buffer, PointSpriteUniformIndex.SIZE_SCALE, 1);
  }

  writeEdge(device: GPUDevice, buffer: GPUBuffer): void {
    this.writeRange(device, buffer, PointSpriteUniformIndex.EDGE, 1);
  }

  writeColor(device: GPUDevice, buffer: GPUBuffer): void {
    this.writeRange(device, buffer, PointSpriteUniformIndex.COLOR_R, 4);
  }

  writeViewCenter(device: GPUDevice, buffer: GPUBuffer): void {
    this.writeRange(device, buffer, PointSpriteUniformIndex.VIEW_CENTER_X, 2);
  }

  writeZoom(device: GPUDevice, buffer: GPUBuffer): void {
    this.writeRange(device, buffer, PointSpriteUniformIndex.ZOOM, 1);
  }

  private writeRange(
    device: GPUDevice,
    buffer: GPUBuffer,
    startIndex: number,
    length: number
  ): void {
    const bytesOffset = startIndex * 4;
    const slice = this.values.subarray(startIndex, startIndex + length);
    device.queue.writeBuffer(buffer, bytesOffset, slice as any);
  }
}
