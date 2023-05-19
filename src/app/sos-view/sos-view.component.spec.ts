import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SosViewComponent } from './sos-view.component';

describe('SosViewComponent', () => {
  let component: SosViewComponent;
  let fixture: ComponentFixture<SosViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SosViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SosViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
