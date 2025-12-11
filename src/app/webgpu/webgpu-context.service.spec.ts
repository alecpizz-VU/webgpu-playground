import { TestBed } from '@angular/core/testing';

import { WebgpuContextService } from './webgpu-context.service';

describe('WebgpuContextService', () => {
  let service: WebgpuContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebgpuContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
