import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { Sif } from './sif.component';

describe('SIFViewComponent', () => {
  let component: Sif;
  let fixture: ComponentFixture<Sif>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Sif ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Sif);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
