import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BillingService, Transaction } from '../../services/billing.service';
import { TenderService, Tender } from '../../services/tender.service';
import { TimerComponent } from '../../shared/timer/timer';

@Component({
  selector: 'app-payment-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TimerComponent],
  templateUrl: './payment-page.html'
})
export class PaymentPageComponent implements OnInit {
  tenderId?: string;
  tender?: Tender;
  paymentAmount = 0;
  cardNumber = '';
  expiry = '';
  cvv = '';
  billingNote = '';
  isProcessing = false;
  paymentSuccess = false;
  transaction?: Transaction;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private billingService: BillingService,
    private tenderService: TenderService
  ) {}

  ngOnInit() {
    this.tenderId = this.route.snapshot.paramMap.get('tenderId') || undefined;
    if (this.tenderId) {
      this.tender = this.tenderService.getTenderById(this.tenderId);
      if (this.tender) {
        const acceptedBid = this.tender.bids.find(b => b.id === this.tender?.assignedBidId);
        const lowestBid = this.tender.bids.length
          ? Math.min(...this.tender.bids.map(b => b.bidAmount))
          : null;
        this.paymentAmount = acceptedBid?.bidAmount ?? lowestBid ?? this.tender.budget;
      }
    }
  }

  payNow() {
    if (!this.tenderId || !this.tender) {
      this.errorMessage = 'No tender selected for payment.';
      return;
    }
    if (!this.cardNumber || !this.expiry || !this.cvv) {
      this.errorMessage = 'Please fill in all payment fields.';
      return;
    }

    this.isProcessing = true;
    this.billingService.createTransaction(this.tenderId, 'Client Payment', this.paymentAmount, 'cleared').subscribe({
      next: (txn) => {
        this.transaction = txn;
        this.paymentSuccess = true;
        this.isProcessing = false;
        this.errorMessage = '';
      },
      error: () => {
        this.errorMessage = 'Payment failed, please try again.';
        this.isProcessing = false;
      }
    });
  }

  remainingSeconds(): number {
    if (!this.tender || !this.tender.auctionEnd) return 0;
    const remaining = Math.ceil((new Date(this.tender.auctionEnd).getTime() - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }

  goHome() {
    this.router.navigate(['/customer']);
  }
}
