import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FutureAesComponent } from './future-aes.component';

describe('FutureAesComponent', () => {
  let component: FutureAesComponent;
  let fixture: ComponentFixture<FutureAesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FutureAesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FutureAesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
