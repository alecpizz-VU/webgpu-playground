import { Injectable } from '@angular/core';
import { ParticleArrayV1 } from './particle-array-v1';
import {
  ParticleSimulationServiceInterface,
} from './particle-simulation.token';
import { CpuParticleSimulationService } from './cpu-particle-simulation.service';

@Injectable({
  providedIn: 'root',
})
export class GpuParticleSimulationService
  implements ParticleSimulationServiceInterface
{
  constructor(private cpuFallback: CpuParticleSimulationService) {}

  initialize(count?: number): void {
    this.cpuFallback.initialize(count);
  }

  getParticles(): ParticleArrayV1 | undefined {
    return this.cpuFallback.getParticles();
  }

  getInstanceCount(): number {
    return this.cpuFallback.getInstanceCount();
  }

  setMouseTarget(x: number, y: number, hover: boolean): void {
    this.cpuFallback.setMouseTarget(x, y, hover);
  }

  step(dt: number): void {
    this.cpuFallback.step(dt);
  }

  setBaseAttract(value: number): void {
    this.cpuFallback.setBaseAttract(value);
  }

  setDrag(value: number): void {
    this.cpuFallback.setDrag(value);
  }

  setAttractionFalloff(value: number): void {
    this.cpuFallback.setAttractionFalloff(value);
  }

  setMinDriftSpeed(value: number): void {
    this.cpuFallback.setMinDriftSpeed(value);
  }

  setMaxDriftSpeed(value: number): void {
    this.cpuFallback.setMaxDriftSpeed(value);
  }

  setAttractionSmoothing(seconds: number): void {
    this.cpuFallback.setAttractionSmoothing(seconds);
  }
}
