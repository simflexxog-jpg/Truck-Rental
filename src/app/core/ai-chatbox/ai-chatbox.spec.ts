import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiChatboxComponent } from './ai-chatbox';

describe('AiChatbox', () => {
  let component: AiChatboxComponent;
  let fixture: ComponentFixture<AiChatboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiChatboxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AiChatboxComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should stay inactive until a tender is assigned and payment is approved', () => {
    component.updateChatAvailability([], null);
    expect(component.isChatEnabled).toBeFalsy();

    component.updateChatAvailability([
      { id: 't1', status: 'assigned', paymentApproved: true, assignedPartnerId: 'partner_1' }
    ] as any, { id: 'partner_1', role: 'partner' } as any);

    expect(component.isChatEnabled).toBeTruthy();
    expect(component.activeTenderId).toBe('t1');
  });
});
