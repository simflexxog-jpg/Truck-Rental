import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenderService, Tender, Bid } from '../../services/tender.service';
import { AuthService } from '../../services/auth.service';
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

  constructor(private tenderService: TenderService, private auth: AuthService) {
    const user = this.auth.getCurrentUser();
    if (user) {
      this.partnerId = user.id || this.partnerId;
      this.partnerName = user.entityName || this.partnerName;
    }
    this.auth.currentUser$.subscribe(u => {
      if (u) { this.partnerId = u.id; this.partnerName = u.entityName; }
    });
  }

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

  private getBidValidationError(tender: Tender, bidAmount: number): string | null {
    if (isNaN(bidAmount) || bidAmount <= 0) {
      return 'Enter a valid bid amount.';
    }

    if (bidAmount >= tender.budget) {
      return `Bid must be less than the budget ($${tender.budget}).`;
    }

    const lowest = this.lowestBid(tender);
    if (lowest !== null && bidAmount >= lowest) {
      return `Bid must be lower than the current lowest bid ($${lowest}).`;
    }

    return null;
  }

  placeBid() {
    if (!this.selectedTender) return alert('Select a tender first');
    const amount = parseFloat(this.bidAmount as any);
    const validationError = this.getBidValidationError(this.selectedTender, amount);
    if (validationError) return alert(validationError);

    this.loading = true;
    this.tenderService.placeBid(this.selectedTender.id, this.partnerId, this.partnerName, amount).subscribe({
      next: (bid: Bid) => {
        this.loading = false;
        alert(`Bid ${bid.id} placed at $${bid.bidAmount}`);
        this.bidAmount = '';
      },
      error: (err) => {
        this.loading = false;
        alert(err?.error?.error || err?.message || 'Failed to place bid');
      }
    });
  }

  quickBid(t: Tender) {
    const amountStr = prompt(`Enter quick bid amount for ${t.title}. Current budget: $${t.budget}${t.bids.length ? ', lowest bid: $' + this.lowestBid(t) : ''}`);
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    const validationError = this.getBidValidationError(t, amount);
    if (validationError) return alert(validationError);
    this.tenderService.placeBid(t.id, this.partnerId, this.partnerName, amount).subscribe({ next: (b) => alert(`Quick bid ${b.id} placed at $${b.bidAmount}`), error: (err) => alert(err?.error?.error || err?.message || 'Failed') });
  }

  placeCounterBid(existing: Bid) {
    const tender = this.tenderService.getTenderById(existing.tenderId);
    if (!tender) return alert('Tender not found for counter bid.');
    const amountStr = prompt(`Counter bid for ${existing.partnerName}'s $${existing.bidAmount}. Enter your amount:`);
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    const validationError = this.getBidValidationError(tender, amount);
    if (validationError) return alert(validationError);
    this.tenderService.placeBid(existing.tenderId, this.partnerId, this.partnerName, amount).subscribe({ next: (b) => alert(`Counter bid ${b.id} placed at $${b.bidAmount}`), error: (err) => alert(err?.error?.error || err?.message || 'Failed') });
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
