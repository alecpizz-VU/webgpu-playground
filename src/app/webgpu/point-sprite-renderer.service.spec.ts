import { TestBed } from '@angular/core/testing';

import { PointSpriteRendererService } from './point-sprite-renderer.service';

describe('PointSpriteRendererService', () => {
  let service: PointSpriteRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PointSpriteRendererService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
