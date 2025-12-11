import { ApplicationConfig } from '@angular/core';
import { PARTICLE_SIMULATION_SERVICE } from './webgpu/particle-simulation.token';
import { CpuParticleSimulationService } from './webgpu/cpu-particle-simulation.service';
import { GpuParticleSimulationService } from './webgpu/gpu-particle-simulation.service';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: PARTICLE_SIMULATION_SERVICE, useExisting: GpuParticleSimulationService },
  ],
};
