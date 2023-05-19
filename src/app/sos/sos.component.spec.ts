import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SosComponent } from './sos.component';

describe('SosComponent', () => {
  let component: SosComponent;
  let fixture: ComponentFixture<SosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
