import { TestBed } from '@angular/core/testing';

import { RenderSettingsService } from './render-settings.service';

describe('RenderSettingsService', () => {
  let service: RenderSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RenderSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
