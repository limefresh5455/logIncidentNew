import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAuditsComponent } from './create-audits.component';

describe('CreateAuditsComponent', () => {
  let component: CreateAuditsComponent;
  let fixture: ComponentFixture<CreateAuditsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateAuditsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateAuditsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
