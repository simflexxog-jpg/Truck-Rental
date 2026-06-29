import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingService } from '../../services/billing.service';

@Component({
  selector: 'app-billing-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './billing-dashboard.html'
})
export class BillingDashboardComponent implements OnInit {
  // Mock data for the dashboard metrics
  metrics = {
    escrow: 14850.00,
    disbursed: 84120.00,
    fees: 2969.10
  };

  constructor(private billingService: BillingService) {}

  ngOnInit() {
    this.billingService.metrics$.subscribe(metrics => {
      this.metrics = metrics;
    });
  }
}