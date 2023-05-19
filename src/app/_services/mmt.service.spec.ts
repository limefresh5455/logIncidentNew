import { TestBed } from '@angular/core/testing';

import { MmtService } from './mmt.service';

describe('MmtService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MmtService = TestBed.get(MmtService);
    expect(service).toBeTruthy();
  });
});
