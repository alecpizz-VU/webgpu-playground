import { Component } from '@angular/core';
import { WebgpuCanvasComponent } from "./webgpu-canvas/webgpu-canvas.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [WebgpuCanvasComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'webgpu-sim';
}
