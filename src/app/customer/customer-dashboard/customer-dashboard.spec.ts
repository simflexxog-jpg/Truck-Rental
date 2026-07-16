import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerDashboard } from './customer-dashboard';
import { TenderService } from '../../services/tender.service';

describe('CustomerDashboard', () => {
  let component: CustomerDashboard;
  let fixture: ComponentFixture<CustomerDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should delegate delisting to the tender service', () => {
    const tenderService = TestBed.inject(TenderService);
    const delistSpy = spyOn(tenderService, 'delistTender');

    component.delistOrder({ id: 'tender_1' } as any);

    expect(delistSpy).toHaveBeenCalledWith('tender_1');
  });

  it('should switch assigned orders from Pay to Chat when payment has been approved', () => {
    const approvedOrder = { id: 'tender_2', status: 'assigned', paymentApproved: true } as any;
    const pendingOrder = { id: 'tender_3', status: 'assigned', paymentApproved: false } as any;

    expect(component.getOrderActionLabel(approvedOrder)).toBe('Chat with Partner');
    expect(component.getOrderActionLabel(pendingOrder)).toBe('Pay');
    expect(component.canPayOrder(pendingOrder)).toBeTrue();
    expect(component.canPayOrder(approvedOrder)).toBeFalse();
  });
});
