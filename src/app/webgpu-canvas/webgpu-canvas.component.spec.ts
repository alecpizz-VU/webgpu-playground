import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebgpuCanvasComponent } from './webgpu-canvas.component';

describe('WebgpuCanvasComponent', () => {
  let component: WebgpuCanvasComponent;
  let fixture: ComponentFixture<WebgpuCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebgpuCanvasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WebgpuCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
