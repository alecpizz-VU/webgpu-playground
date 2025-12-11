import { TestBed } from '@angular/core/testing';

import { ShaderLibraryService } from './shader-library.service';

describe('ShaderLibraryService', () => {
  let service: ShaderLibraryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShaderLibraryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
