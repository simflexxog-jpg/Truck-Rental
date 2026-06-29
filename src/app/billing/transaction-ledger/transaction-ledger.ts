import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingService } from '../../services/billing.service';

@Component({
  selector: 'app-transaction-ledger',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-ledger.html'
})
export class TransactionLedgerComponent implements OnInit {
  transactions: any[] = [];

  constructor(private billingService: BillingService) {}

  ngOnInit() {
    this.billingService.transactions$.subscribe(transactions => {
      this.transactions = transactions;
    });
  }
}