/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { SifService } from './sif.service';

describe('Service: Cif', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SifService]
    });
  });

  it('should ...', inject([SifService], (service: SifService) => {
    expect(service).toBeTruthy();
  }));
});
