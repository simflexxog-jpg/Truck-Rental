import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionLedger } from './transaction-ledger';

describe('TransactionLedger', () => {
  let component: TransactionLedger;
  let fixture: ComponentFixture<TransactionLedger>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionLedger],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionLedger);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
