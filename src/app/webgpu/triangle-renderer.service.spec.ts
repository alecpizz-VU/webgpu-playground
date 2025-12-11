import { TestBed } from '@angular/core/testing';

import { TriangleRendererService } from './triangle-renderer.service';

describe('TriangleRendererService', () => {
  let service: TriangleRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TriangleRendererService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
