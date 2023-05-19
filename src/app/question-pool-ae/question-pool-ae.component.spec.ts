import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionPoolAeComponent } from './question-pool-ae.component';

describe('QuestionPoolAeComponent', () => {
  let component: QuestionPoolAeComponent;
  let fixture: ComponentFixture<QuestionPoolAeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QuestionPoolAeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionPoolAeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
