import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenderService, Tender, Bid } from '../../services/tender.service';
import { TimerComponent } from '../../shared/timer/timer';

@Component({
  selector: 'app-partner-tenders',
  standalone: true,
  imports: [CommonModule, FormsModule, TimerComponent],
  templateUrl: './partner-tenders.html'
})
export class PartnerTendersComponent implements OnInit {
  partnerId = 'partner_demo_001';
  partnerName = 'Demo Partner';
  tenders: Tender[] = [];
  selectedTender?: Tender;
  bidAmount = '';
  loading = false;
  filterOpen = true;

  constructor(private tenderService: TenderService) {}

  ngOnInit() {
    // subscribe to tender updates
    this.tenderService.tenders$.subscribe(list => this.tenders = list || []);
    // trigger initial fetch
    this.tenderService.getTenders();
  }

  get displayedTenders(): Tender[] {
    return this.filterOpen ? this.tenders.filter(t => t.status === 'open') : this.tenders;
  }

  selectTender(t: Tender) {
    this.selectedTender = t;
    this.bidAmount = '';
  }

  timeRemaining(t: Tender) {
    if (!t.auctionEnd) return 'N/A';
    const remaining = new Date(t.auctionEnd).getTime() - Date.now();
    if (remaining <= 0) return 'Auction closed';
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}m ${seconds}s remaining`;
  }

  remainingSeconds(t: Tender): number {
    if (!t.auctionEnd) return 0;
    const remaining = Math.ceil((new Date(t.auctionEnd).getTime() - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }

  placeBid() {
    if (!this.selectedTender) return alert('Select a tender first');
    const amount = parseFloat(this.bidAmount as any);
    if (isNaN(amount) || amount <= 0) return alert('Enter valid bid amount');
    this.loading = true;
    this.tenderService.placeBid(this.selectedTender.id, this.partnerId, this.partnerName, amount).subscribe({
      next: (bid: Bid) => {
        this.loading = false;
        alert(`Bid ${bid.id} placed at $${bid.bidAmount}`);
        this.bidAmount = '';
      },
      error: () => { this.loading = false; alert('Failed to place bid'); }
    });
  }

  quickBid(t: Tender) {
    const amountStr = prompt(`Enter quick bid amount for ${t.title}`);
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return alert('Invalid amount');
    this.tenderService.placeBid(t.id, this.partnerId, this.partnerName, amount).subscribe({ next: (b) => alert(`Quick bid ${b.id} placed at $${b.bidAmount}`), error: () => alert('Failed') });
  }

  placeCounterBid(existing: Bid) {
    const amountStr = prompt(`Counter bid for ${existing.partnerName}'s $${existing.bidAmount}. Enter your amount:`);
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return alert('Invalid amount');
    this.tenderService.placeBid(existing.tenderId, this.partnerId, this.partnerName, amount).subscribe({ next: (b) => alert(`Counter bid ${b.id} placed at $${b.bidAmount}`), error: () => alert('Failed') });
  }

  myBids(): Bid[] {
    const list: Bid[] = [];
    this.tenders.forEach(t => {
      (t.bids || []).forEach(b => { if (b.partnerId === this.partnerId) list.push(b); });
    });
    return list;
  }

  lowestBid(t: Tender) {
    if (!t.bids || !t.bids.length) return null;
    return Math.min(...t.bids.map(b => b.bidAmount));
  }
}
