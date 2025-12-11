import { Injectable } from '@angular/core';
import { vec2 } from 'gl-matrix';
import {
  ParticleArrayV1,
  ParticleVec2,
} from './particle-array-v1';
import {
  ParticleSimulationServiceInterface,
} from './particle-simulation.token';

@Injectable({
  providedIn: 'root',
})
export class CpuParticleSimulationService
  implements ParticleSimulationServiceInterface
{
  private particles?: ParticleArrayV1;
  private count = 0;
  // World-space bounds for wrap-around behavior
  private readonly worldMin: vec2 = vec2.fromValues(-10, -10);
  private readonly worldMax: vec2 = vec2.fromValues(10, 10);
  private readonly worldSize: vec2 = vec2.fromValues(20, 20);
  private mouseTarget: ParticleVec2 | null = null;
  private mouseHover: boolean = false;
  private mouseInfluence: number = 0;
  // Tunable simulation parameters
  private baseAttract: number = 1.3;
  private drag: number = 0.5;
  private attractionFalloff: number = 0.1;
  private minDriftSpeed: number = 0.3;
  private maxDriftSpeed: number = 1.0;
  private attractionSmoothing: number = 0.3; // seconds

  initialize(count: number = 100000): void {
    this.count = count;
    this.particles = ParticleArrayV1.createRandom(count);
  }

  getParticles(): ParticleArrayV1 | undefined {
    return this.particles;
  }

  getInstanceCount(): number {
    return this.count;
  }

  setStorageBuffer(_buffer: GPUBuffer, _capacity: number): void {
    // CPU simulation does not use the GPU storage buffer directly.
  }

  setMouseTarget(x: number, y: number, hover: boolean): void {
    if (!this.mouseTarget) {
      this.mouseTarget = vec2.fromValues(x, y);
    } else {
      this.mouseTarget[0] = x;
      this.mouseTarget[1] = y;
    }
    this.mouseHover = hover;
  }

  step(dt: number): void {
    if (!this.particles) {
      return;
    }

    const tmpPos: ParticleVec2 = vec2.create();
    const tmpVel: ParticleVec2 = vec2.create();
    const tmpDir: ParticleVec2 = vec2.create();

    const targetInfluence = this.mouseHover && this.mouseTarget ? 1.0 : 0.0;
    const tau = this.attractionSmoothing;
    const alpha = tau > 0 ? 1.0 - Math.exp(-dt / tau) : 1.0;
    this.mouseInfluence += (targetInfluence - this.mouseInfluence) * alpha;

    for (let i = 0; i < this.count; i++) {
      const pos = this.particles.getPosition(i, tmpPos);
      const vel = this.particles.getVelocity(i, tmpVel);

      if (this.mouseInfluence > 0.0 && this.mouseTarget) {
        vec2.sub(tmpDir, this.mouseTarget, pos);
        let dist = vec2.length(tmpDir);
        if (dist > 0.0001) {
          vec2.scale(tmpDir, tmpDir, 1.0 / dist);
        } else {
          dist = 0.0001;
        }

        const falloff = 1.0 / (1.0 + dist * dist * this.attractionFalloff);
        const strength = this.baseAttract * falloff * this.mouseInfluence;

        vec2.scaleAndAdd(vel, vel, tmpDir, strength * dt);

        const dragFactor = Math.max(0.0, 1.0 - this.drag * dt);
        vec2.scale(vel, vel, dragFactor);
      }

      // When mouse influence is low, ensure a minimum drift speed so particles
      // don't come to a complete stop after attraction fades out.
      if (this.mouseInfluence < 0.05) {
        const speed = vec2.length(vel);
        const minSpeed = this.minDriftSpeed;
        const maxSpeed = this.maxDriftSpeed;
        if (speed < 1e-4) {
          const theta = Math.random() * Math.PI * 2.0;
          vel[0] = Math.cos(theta) * minSpeed;
          vel[1] = Math.sin(theta) * minSpeed;
        } else if (speed < minSpeed) {
          const scale = minSpeed / speed;
          vec2.scale(vel, vel, scale);
        } else if (speed > maxSpeed) {
          const scale = maxSpeed / speed;
          vec2.scale(vel, vel, scale);
        }
      }

      vec2.scaleAndAdd(pos, pos, vel, dt);

      this.wrapPosition(pos);

      this.particles.setPosition(i, pos);
      this.particles.setVelocity(i, vel);
      const angle = Math.atan2(vel[1], vel[0]);
      this.particles.setAngle(i, angle);
    }
  }

  private wrapPosition(pos: vec2): void {
    const min = this.worldMin;
    const max = this.worldMax;
    const size = this.worldSize;

    if (pos[0] < min[0]) {
      const delta = min[0] - pos[0];
      pos[0] = max[0] - (delta % size[0]);
    } else if (pos[0] > max[0]) {
      const delta = pos[0] - max[0];
      pos[0] = min[0] + (delta % size[0]);
    }

    if (pos[1] < min[1]) {
      const delta = min[1] - pos[1];
      pos[1] = max[1] - (delta % size[1]);
    } else if (pos[1] > max[1]) {
      const delta = pos[1] - max[1];
      pos[1] = min[1] + (delta % size[1]);
    }
  }

  setBaseAttract(value: number): void {
    this.baseAttract = Math.max(0, value);
  }

  setDrag(value: number): void {
    this.drag = Math.max(0, value);
  }

  setAttractionFalloff(value: number): void {
    this.attractionFalloff = Math.max(0, value);
  }

  setMinDriftSpeed(value: number): void {
    this.minDriftSpeed = Math.max(0, Math.min(value, this.maxDriftSpeed));
  }

  setMaxDriftSpeed(value: number): void {
    this.maxDriftSpeed = Math.max(value, this.minDriftSpeed);
  }

  setAttractionSmoothing(seconds: number): void {
    this.attractionSmoothing = Math.max(0, seconds);
  }
}
