import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MmtComponent } from './mmt.component';

describe('MmtComponent', () => {
  let component: MmtComponent;
  let fixture: ComponentFixture<MmtComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MmtComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MmtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
