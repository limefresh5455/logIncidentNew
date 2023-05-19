import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyAnsComponent } from './monthly-ans.component';

describe('MonthlyAnsComponent', () => {
  let component: MonthlyAnsComponent;
  let fixture: ComponentFixture<MonthlyAnsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonthlyAnsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyAnsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
