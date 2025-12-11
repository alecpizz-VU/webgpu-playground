export const ParticleSimUniformIndex = {
  DT: 0,
  TIME: 1,
  PARTICLE_COUNT: 2,
  PAD0: 3,
  BASE_ATTRACT: 4,
  DRAG: 5,
  ATTRACTION_FALLOFF: 6,
  MIN_DRIFT_SPEED: 7,
  MAX_DRIFT_SPEED: 8,
  ATTRACTION_SMOOTHING: 9,
  MOUSE_INFLUENCE: 10,
  PAD1: 11,
  WORLD_MIN_X: 12,
  WORLD_MIN_Y: 13,
  WORLD_MAX_X: 14,
  WORLD_MAX_Y: 15,
  MOUSE_TARGET_X: 16,
  MOUSE_TARGET_Y: 17,
  PAD2_X: 18,
  PAD2_Y: 19,
} as const;

export class ParticleSimUniforms {
  readonly values: Float32Array;

  constructor() {
    // Keep this in sync with the WGSL SimUniforms layout (20 floats total).
    this.values = new Float32Array(20);
  }

  setDt(dt: number): void {
    this.values[ParticleSimUniformIndex.DT] = dt;
  }

  setTime(time: number): void {
    this.values[ParticleSimUniformIndex.TIME] = time;
  }

  setParticleCount(count: number): void {
    this.values[ParticleSimUniformIndex.PARTICLE_COUNT] = count;
  }

  setBaseAttract(value: number): void {
    this.values[ParticleSimUniformIndex.BASE_ATTRACT] = value;
  }

  setDrag(value: number): void {
    this.values[ParticleSimUniformIndex.DRAG] = value;
  }

  setAttractionFalloff(value: number): void {
    this.values[ParticleSimUniformIndex.ATTRACTION_FALLOFF] = value;
  }

  setMinDriftSpeed(value: number): void {
    this.values[ParticleSimUniformIndex.MIN_DRIFT_SPEED] = value;
  }

  setMaxDriftSpeed(value: number): void {
    this.values[ParticleSimUniformIndex.MAX_DRIFT_SPEED] = value;
  }

  setAttractionSmoothing(seconds: number): void {
    this.values[ParticleSimUniformIndex.ATTRACTION_SMOOTHING] = seconds;
  }

  setMouseInfluence(value: number): void {
    this.values[ParticleSimUniformIndex.MOUSE_INFLUENCE] = value;
  }

  setWorldBounds(minX: number, minY: number, maxX: number, maxY: number): void {
    this.values[ParticleSimUniformIndex.WORLD_MIN_X] = minX;
    this.values[ParticleSimUniformIndex.WORLD_MIN_Y] = minY;
    this.values[ParticleSimUniformIndex.WORLD_MAX_X] = maxX;
    this.values[ParticleSimUniformIndex.WORLD_MAX_Y] = maxY;
  }

  setMouseTarget(x: number, y: number): void {
    this.values[ParticleSimUniformIndex.MOUSE_TARGET_X] = x;
    this.values[ParticleSimUniformIndex.MOUSE_TARGET_Y] = y;
  }

  writeAll(device: GPUDevice, buffer: GPUBuffer): void {
    device.queue.writeBuffer(buffer, 0, this.values as any);
  }
}
