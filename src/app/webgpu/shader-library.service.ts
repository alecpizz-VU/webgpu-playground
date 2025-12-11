import { Injectable } from '@angular/core';
import triangleShader from '../shaders/triangle.wgsl'
import pointShader from '../shaders/points.wgsl';
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
    throw new Error(`Unknown shader ${name}!`);
  }
}
