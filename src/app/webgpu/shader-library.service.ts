import { Injectable } from '@angular/core';
import triangleShader from '../shaders/triangle.wgsl'
import pointShader from '../shaders/points.wgsl';
import particleComputeShader from '../shaders/particles.comp.wgsl';
@Injectable({
  providedIn: 'root'
})
export class ShaderLibraryService {

  getShaderSource(name: string) : string {
    if(name === 'triangle'){
      return triangleShader;
    }
    else if(name === 'points') {
      return pointShader;
    }
    else if(name === 'particleCompute') {
      return particleComputeShader;
    }
    throw new Error(`Unknown shader ${name}!`);
  }
}
