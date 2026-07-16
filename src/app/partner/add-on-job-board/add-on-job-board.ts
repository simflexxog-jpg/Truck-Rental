import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouteService } from '../../services/route.service';
import { TenderService } from '../../services/tender.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-add-on-job-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-on-job-board.html'
})
export class AddOnJobBoardComponent implements OnInit {
  availableJobs: any[] = [];
  partnerId = 'partner_demo_001';
  partnerName = 'Demo Partner';

  constructor(private routeService: RouteService, private tenderService: TenderService, private auth: AuthService) {
    const user = this.auth.getCurrentUser();
    if (user) { this.partnerId = user.id || this.partnerId; this.partnerName = user.entityName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || this.partnerName; }
    this.auth.currentUser$.subscribe(u => {
      if (u) { this.partnerId = u.id; this.partnerName = u.entityName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || this.partnerName; }
    });
  }

  ngOnInit() {
    this.routeService.addOnJobs$.subscribe(jobs => {
      this.availableJobs = jobs;
    });
  }

  submitUnderbid(job: any) {
    const amountStr = prompt(`Enter your bid amount for ${job.title}. Current ceiling: $${job.currentCeiling}`);
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) { alert('Invalid amount'); return; }

    const tenderId = job.tenderId || job.id || null;
    if (!tenderId) {
      alert(`No tender id available for job ${job.title}.`);
      return;
    }

    const tender = this.tenderService.getTenderById(tenderId);
    if (tender) {
      if (amount >= tender.budget) {
        return alert(`Bid must be less than the budget ($${tender.budget}).`);
      }
      const currentLowest = tender.bids.length ? Math.min(...tender.bids.map((b: any) => b.bidAmount)) : null;
      if (currentLowest !== null && amount >= currentLowest) {
        return alert(`Counter bid must be lower than the current lowest bid ($${currentLowest}).`);
      }
    }

    const partnerId = this.partnerId;
    const partnerName = this.partnerName;
    this.tenderService.placeBid(tenderId, partnerId, partnerName, amount).subscribe({
      next: (bid) => alert(`Bid ${bid.id} submitted for ${job.title} at $${amount}`),
      error: (err) => alert(err?.error?.error || err?.message || 'Failed to submit bid')
    });
  }
}