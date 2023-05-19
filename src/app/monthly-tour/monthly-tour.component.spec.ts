import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyTourComponent } from './monthly-tour.component';

describe('MonthlyTourComponent', () => {
  let component: MonthlyTourComponent;
  let fixture: ComponentFixture<MonthlyTourComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonthlyTourComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyTourComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
