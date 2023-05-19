import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionSeverityComponent } from './action-severity.component';

describe('ActionSeverityComponent', () => {
  let component: ActionSeverityComponent;
  let fixture: ComponentFixture<ActionSeverityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActionSeverityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionSeverityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
