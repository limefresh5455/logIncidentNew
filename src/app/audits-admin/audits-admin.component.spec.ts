import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditsAdminComponent } from './audits-admin.component';

describe('AuditsAdminComponent', () => {
  let component: AuditsAdminComponent;
  let fixture: ComponentFixture<AuditsAdminComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AuditsAdminComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuditsAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
