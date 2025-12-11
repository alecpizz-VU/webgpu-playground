import { Injectable } from '@angular/core';
import { vec2 } from 'gl-matrix';
import {
  ParticleArrayV1,
  ParticleLayoutV1,
  ParticleVec2,
} from './particle-array-v1';

@Injectable({
  providedIn: 'root',
})
export class CpuParticleSimulationService {
  private particles?: ParticleArrayV1;
  private count = 0;
  // World-space bounds for wrap-around behavior
  private readonly worldMin: vec2 = vec2.fromValues(-10, -10);
  private readonly worldMax: vec2 = vec2.fromValues(10, 10);
  private readonly worldSize: vec2 = vec2.fromValues(20, 20);

  initialize(count: number = 128): void {
    this.count = count;
    this.particles = ParticleArrayV1.createRandom(count);
  }

  getParticles(): ParticleArrayV1 | undefined {
    return this.particles;
  }

  getInstanceCount(): number {
    return this.count;
  }

  step(dt: number): void {
    if (!this.particles) {
      return;
    }

    const tmpPos: ParticleVec2 = vec2.create();
    const tmpVel: ParticleVec2 = vec2.create();

    for (let i = 0; i < this.count; i++) {
      const pos = this.particles.getPosition(i, tmpPos);
      const vel = this.particles.getVelocity(i, tmpVel);
      vec2.scaleAndAdd(pos, pos, vel, dt);

      this.wrapPosition(pos);

      this.particles.setPosition(i, pos);
      const angle = this.particles.getAngle(i);
      const angVel = this.particles.getAngularVelocity(i);
      this.particles.setAngle(i, angle + angVel * dt);
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
}
