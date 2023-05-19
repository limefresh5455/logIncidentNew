import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateAuditsComponent } from './update-audits.component';

describe('UpdateAuditsComponent', () => {
  let component: UpdateAuditsComponent;
  let fixture: ComponentFixture<UpdateAuditsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpdateAuditsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateAuditsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
