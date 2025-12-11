import { TestBed } from '@angular/core/testing';

import { RenderLoopService } from './render-loop.service';

describe('RenderLoopService', () => {
  let service: RenderLoopService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RenderLoopService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
