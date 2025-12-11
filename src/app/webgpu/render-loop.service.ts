import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RenderLoopService {
  private frameId: number | null = null;
  private callbacks = new Set<(dt: number, time: number) => void>();
  private lastTime = 0;
  constructor() {}

  start(): void {
    if (this.frameId !== null) {
      return;
    }
    const loop = () => {
      this.frameId = requestAnimationFrame(this.tick);
    };
    this.frameId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  register(callback: (dt: number, time: number) => void) {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    }
  }

  private tick = (time: number) => {
    const dt = time - this.lastTime;
    this.lastTime = time;
    for (const cb of this.callbacks) {
      cb(dt, time);
      this.frameId = requestAnimationFrame(this.tick);
    }
  };
}
