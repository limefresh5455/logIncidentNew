import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CIFComponent } from './cif.component';

describe('CIFComponent', () => {
  let component: CIFComponent;
  let fixture: ComponentFixture<CIFComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CIFComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CIFComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
