import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveMapMonitor } from './live-map-monitor';

describe('LiveMapMonitor', () => {
  let component: LiveMapMonitor;
  let fixture: ComponentFixture<LiveMapMonitor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveMapMonitor],
    }).compileComponents();

    fixture = TestBed.createComponent(LiveMapMonitor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
