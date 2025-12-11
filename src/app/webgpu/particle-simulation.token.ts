import { InjectionToken } from '@angular/core';
import { ParticleArrayV1 } from './particle-array-v1';

export interface ParticleSimulationServiceInterface {
  initialize(count?: number): void;
  getParticles(): ParticleArrayV1 | undefined;
  getInstanceCount(): number;
  setStorageBuffer(buffer: GPUBuffer, capacity: number): void;
  setMouseTarget(x: number, y: number, hover: boolean): void;
  step(dt: number): void;
  setBaseAttract(value: number): void;
  setDrag(value: number): void;
  setAttractionFalloff(value: number): void;
  setMinDriftSpeed(value: number): void;
  setMaxDriftSpeed(value: number): void;
  setAttractionSmoothing(seconds: number): void;
}

export const PARTICLE_SIMULATION_SERVICE =
  new InjectionToken<ParticleSimulationServiceInterface>('PARTICLE_SIMULATION_SERVICE');
