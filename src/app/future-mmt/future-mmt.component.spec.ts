import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FutureMmtComponent } from './future-mmt.component';

describe('FutureMmtComponent', () => {
  let component: FutureMmtComponent;
  let fixture: ComponentFixture<FutureMmtComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FutureMmtComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FutureMmtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
