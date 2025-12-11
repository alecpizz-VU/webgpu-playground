import { vec2 } from 'gl-matrix';

export const ParticleLayoutV1 = {
  STRIDE: 8,
  POS_X: 0,
  POS_Y: 1,
  VEL_X: 2,
  VEL_Y: 3,
  SIZE: 4,
  ANGLE: 5,
  ANG_VEL: 6,
  PAD: 7,
} as const;

export type ParticleVec2 = vec2;

export class ParticleArrayV1 {
  readonly data: Float32Array;

  private constructor(data: Float32Array) {
    this.data = data;
  }

  static create(count: number): ParticleArrayV1 {
    return new ParticleArrayV1(
      new Float32Array(count * ParticleLayoutV1.STRIDE)
    );
  }

  static createRandom(count: number): ParticleArrayV1 {
    const arr = ParticleArrayV1.create(count);
    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    for (let i = 0; i < count; i++) {
      const x = rand(-5, 5);
      const y = rand(-5, 5);
      const size = rand(1, 8);
      const angle = 0.0;
      const vx = rand(-0.5, 0.5);
      const vy = rand(-0.5, 0.5);
      const angVel = rand(-1.0, 1.0);
      arr.setParticle(i, x, y, size, angle, vx, vy, angVel);
    }
    return arr;
  }

  getPosition(index: number, out: ParticleVec2 = vec2.create()): ParticleVec2 {
    const base = index * ParticleLayoutV1.STRIDE;
    out[0] = this.data[base + ParticleLayoutV1.POS_X];
    out[1] = this.data[base + ParticleLayoutV1.POS_Y];
    return out;
  }

  setPosition(index: number, pos: ParticleVec2): void {
    const base = index * ParticleLayoutV1.STRIDE;
    this.data[base + ParticleLayoutV1.POS_X] = pos[0];
    this.data[base + ParticleLayoutV1.POS_Y] = pos[1];
  }

   getVelocity(index: number, out: ParticleVec2 = vec2.create()): ParticleVec2 {
    const base = index * ParticleLayoutV1.STRIDE;
    out[0] = this.data[base + ParticleLayoutV1.VEL_X];
    out[1] = this.data[base + ParticleLayoutV1.VEL_Y];
    return out;
  }

  setVelocity(index: number, vel: ParticleVec2): void {
    const base = index * ParticleLayoutV1.STRIDE;
    this.data[base + ParticleLayoutV1.VEL_X] = vel[0];
    this.data[base + ParticleLayoutV1.VEL_Y] = vel[1];
  }

  getAngle(index: number): number {
    const base = index * ParticleLayoutV1.STRIDE;
    return this.data[base + ParticleLayoutV1.ANGLE];
  }

  setAngle(index: number, angle: number): void {
    const base = index * ParticleLayoutV1.STRIDE;
    this.data[base + ParticleLayoutV1.ANGLE] = angle;
  }

  getAngularVelocity(index: number): number {
    const base = index * ParticleLayoutV1.STRIDE;
    return this.data[base + ParticleLayoutV1.ANG_VEL];
  }

  setAngularVelocity(index: number, angVel: number): void {
    const base = index * ParticleLayoutV1.STRIDE;
    this.data[base + ParticleLayoutV1.ANG_VEL] = angVel;
  }

  setParticle(
    index: number,
    x: number,
    y: number,
    size: number,
    angle: number,
    vx: number,
    vy: number,
    angVel: number
  ): void {
    const base = index * ParticleLayoutV1.STRIDE;
    const d = this.data;
    d[base + ParticleLayoutV1.POS_X] = x;
    d[base + ParticleLayoutV1.POS_Y] = y;
    d[base + ParticleLayoutV1.VEL_X] = vx;
    d[base + ParticleLayoutV1.VEL_Y] = vy;
    d[base + ParticleLayoutV1.SIZE] = size;
    d[base + ParticleLayoutV1.ANGLE] = angle;
    d[base + ParticleLayoutV1.ANG_VEL] = angVel;
  }
}
