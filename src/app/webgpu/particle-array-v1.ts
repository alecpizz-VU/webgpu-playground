import { vec2 } from 'gl-matrix';

export const ParticleLayoutV1 = {
  STRIDE: 4,
  POS_X: 0,
  POS_Y: 1,
  SIZE: 2,
  ANGLE: 3,
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
      arr.setParticle(i, x, y, size, angle);
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

  setParticle(
    index: number,
    x: number,
    y: number,
    size: number,
    angle: number
  ): void {
    const base = index * ParticleLayoutV1.STRIDE;
    const d = this.data;
    d[base + ParticleLayoutV1.POS_X] = x;
    d[base + ParticleLayoutV1.POS_Y] = y;
    d[base + ParticleLayoutV1.SIZE] = size;
    d[base + ParticleLayoutV1.ANGLE] = angle;
  }
}
