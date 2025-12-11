import { TestBed } from '@angular/core/testing';

import { WebgpuRendererService } from './webgpu-renderer.service';

describe('WebgpuRendererService', () => {
  let service: WebgpuRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebgpuRendererService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
