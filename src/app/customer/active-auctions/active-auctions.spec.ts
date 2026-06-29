import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveAuctionsComponent } from './active-auctions';

describe('ActiveAuctions', () => {
  let component: ActiveAuctionsComponent;
  let fixture: ComponentFixture<ActiveAuctionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ActiveAuctionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActiveAuctionsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
