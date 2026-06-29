import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouteTracker } from './route-tracker';

describe('RouteTracker', () => {
  let component: RouteTracker;
  let fixture: ComponentFixture<RouteTracker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouteTracker],
    }).compileComponents();

    fixture = TestBed.createComponent(RouteTracker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
