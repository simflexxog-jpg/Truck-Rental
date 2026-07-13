import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenderService, Tender, Bid } from '../../services/tender.service';
import { Router } from '@angular/router';
import { TimerComponent } from '../../shared/timer/timer';

@Component({
  selector: 'app-tender-detail',
  standalone: true,
  imports: [CommonModule, TimerComponent],
  templateUrl: './tender-detail.html'
})
export class TenderDetailComponent implements OnInit, OnChanges {
  @Input() tenderId!: string;
  tender?: Tender;
  isLoading = false;
  message = '';

  constructor(private tenderService: TenderService, private router: Router) {}

  ngOnInit() {
    this.syncTender();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tenderId']) {
      this.syncTender();
    }
  }

  private syncTender() {
    this.tender = this.tenderId ? this.tenderService.getTenderById(this.tenderId) : undefined;
    this.message = '';
  }

  accept(bid: Bid) {
    if (!this.tender) return;
    this.isLoading = true;
    this.tenderService.acceptBid(this.tender.id, bid.id).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.message = `Accepted ${bid.partnerName} at ${bid.bidAmount}`;
        this.router.navigate(['/billing/pay', this.tender?.id]);
      },
      error: (err) => { this.isLoading = false; this.message = 'Failed to accept bid'; }
    });
  }

  goToPayment() {
    if (!this.tender) return;
    this.router.navigate(['/billing/pay', this.tender.id]);
  }

  reject(bid: Bid) {
    if (!this.tender) return;
    this.isLoading = true;
    this.tenderService.rejectBid(this.tender.id, bid.id).subscribe({
      next: (t) => { this.isLoading = false; this.tender = t; this.message = 'Bid rejected'; },
      error: (err) => { this.isLoading = false; this.message = 'Failed to reject bid'; }
    });
  }
}
