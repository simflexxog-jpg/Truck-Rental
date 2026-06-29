import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouteService } from '../../services/route.service';
import { TenderService } from '../../services/tender.service';

@Component({
  selector: 'app-add-on-job-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-on-job-board.html'
})
export class AddOnJobBoardComponent implements OnInit {
  availableJobs: any[] = [];

  constructor(private routeService: RouteService, private tenderService: TenderService) {}

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

    // Use tender service if available; otherwise show confirmation
    // We'll create a lightweight tender placement using global window API to find TenderService if bootstrapped
    // if job has a linked tenderId, use it; otherwise create a tender and then place bid
    const tenderId = job.tenderId || job.id || null;
    const partnerId = 'partner_demo_001';
    const partnerName = 'Demo Partner';
    if (tenderId) {
      this.tenderService.placeBid(tenderId, partnerId, partnerName, amount).subscribe({
        next: (bid) => alert(`Bid ${bid.id} submitted for ${job.title} at $${amount}`),
        error: (err) => alert('Failed to submit bid')
      });
    } else {
      alert(`No tender id available for job ${job.title}.`);
    }
  }
}