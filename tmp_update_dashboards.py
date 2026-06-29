from pathlib import Path

customer_ts_path = Path(r"d:/Renta/Truck-Rental/src/app/customer/customer-dashboard/customer-dashboard.ts")
customer_html_path = Path(r"d:/Renta/Truck-Rental/src/app/customer/customer-dashboard/customer-dashboard.html")
partner_ts_path = Path(r"d:/Renta/Truck-Rental/src/app/partner/partner-dashboard/partner-dashboard.ts")
partner_html_path = Path(r"d:/Renta/Truck-Rental/src/app/partner/partner-dashboard/partner-dashboard.html")

customer_ts_path.write_text("""import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TenderCreateComponent } from '../tender-create/tender-create';
import { ActiveAuctionsComponent } from '../active-auctions/active-auctions';
import { LiveMapMonitorComponent } from '../live-map-monitor/live-map-monitor';
import { TenderDetailComponent } from '../tender-detail/tender-detail';
import { TimerComponent } from '../../shared/timer/timer';
import { TenderService, Tender } from '../../services/tender.service';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, TenderCreateComponent, ActiveAuctionsComponent, LiveMapMonitorComponent, TenderDetailComponent, TimerComponent],
  templateUrl: './customer-dashboard.html'
})
export class CustomerDashboardComponent implements OnInit {
  tenders: Tender[] = [];
  selectedTenderId: string | null = null;

  constructor(private tenderService: TenderService, private router: Router) {}

  ngOnInit() {
    this.tenderService.tenders$.subscribe(list => {
      this.tenders = list || [];
      if (!this.selectedTenderId && this.tenders.length) {
        this.selectedTenderId = this.tenders[0].id;
      }
    });
    this.tenderService.getTenders();
  }

  get openOrders() {
    return this.tenders.filter(t => t.status === 'open');
  }

  get assignedOrders() {
    return this.tenders.filter(t => t.status === 'assigned');
  }

  get completedOrders() {
    return this.tenders.filter(t => t.status === 'completed');
  }

  selectTender(id: string) {
    this.selectedTenderId = id;
  }

  payOrder(order: Tender) {
    this.router.navigate(['/billing/pay', order.id]);
  }
}
""", encoding="utf-8")

customer_html_path.write_text("""<div class=\"grid grid-cols-1 lg:grid-cols-3 gap-8\">
  <div class=\"lg:col-span-1 space-y-6\">
    <app-tender-create></app-tender-create>

    <section class=\"rounded-3xl border border-slate-200 bg-white p-5 shadow-sm\">
      <div class=\"flex items-center justify-between gap-4 mb-4\">
        <div>
          <h3 class=\"text-lg font-semibold text-slate-900\">My Orders</h3>
          <p class=\"text-sm text-slate-500\">Open, assigned, and completed tenders in one view.</p>
        </div>
      </div>

      <div class=\"space-y-5\">
        <div>
          <h4 class=\"text-sm font-semibold text-slate-700\">Open Orders</h4>
          <div *ngIf=\"openOrders.length > 0; else noOpenOrders\" class=\"mt-3 space-y-3\">
            <article *ngFor=\"let order of openOrders\" class=\"rounded-2xl border border-slate-200 bg-slate-50 p-3\">
              <div class=\"flex items-start justify-between gap-3\">
                <div>
                  <div class=\"font-medium text-slate-900\">{{ order.title }}</div>
                  <div class=\"text-xs text-slate-500\">{{ order.origin }} → {{ order.destination }}</div>
                  <div class=\"text-xs text-slate-500 mt-1\">Auction ends in <app-timer [targetTime]=\"order.auctionEnd\"></app-timer></div>
                </div>
                <button class=\"rounded-full bg-cyan-600 px-3 py-1 text-xs font-semibold text-white\" (click)=\"selectTender(order.id)\">View</button>
              </div>
            </article>
          </div>
          <ng-template #noOpenOrders>
            <p class=\"text-xs text-slate-500 mt-2\">No open orders right now.</p>
          </ng-template>
        </div>

        <div>
          <h4 class=\"text-sm font-semibold text-slate-700\">Assigned Orders</h4>
          <div *ngIf=\"assignedOrders.length > 0; else noAssignedOrders\" class=\"mt-3 space-y-3\">
            <article *ngFor=\"let order of assignedOrders\" class=\"rounded-2xl border border-slate-200 bg-slate-50 p-3\">
              <div class=\"flex items-start justify-between gap-3\">
                <div>
                  <div class=\"font-medium text-slate-900\">{{ order.title }}</div>
                  <div class=\"text-xs text-slate-500\">{{ order.origin }} → {{ order.destination }}</div>
                  <div class=\"text-xs text-slate-500 mt-1\">Assigned to {{ order.assignedPartnerName || 'a driver' }}</div>
                </div>
                <div class=\"flex flex-col gap-2\">
                  <button class=\"rounded-full bg-cyan-600 px-3 py-1 text-xs font-semibold text-white\" (click)=\"selectTender(order.id)\">View</button>
                  <button class=\"rounded-full border border-cyan-500 bg-white px-3 py-1 text-xs font-semibold text-cyan-700\" (click)=\"payOrder(order)\">Pay</button>
                </div>
              </div>
            </article>
          </div>
          <ng-template #noAssignedOrders>
            <p class=\"text-xs text-slate-500 mt-2\">No assigned orders yet.</p>
          </ng-template>
        </div>
      </div>
    </section>
  </div>

  <div class=\"lg:col-span-2 space-y-8\">
    <app-live-map-monitor></app-live-map-monitor>
    <app-active-auctions></app-active-auctions>
    <ng-container *ngIf=\"selectedTenderId\">
      <app-tender-detail [tenderId]=\"selectedTenderId\"></app-tender-detail>
    </ng-container>
  </div>
</div>
""", encoding="utf-8")

partner_ts_path.write_text("""import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenderService, Tender } from '../../services/tender.service';
import { RouteTrackerComponent } from '../route-tracker/route-tracker';
import { AddOnJobBoardComponent } from '../add-on-job-board/add-on-job-board';
import { LiveChatComponent } from '../live-chat/live-chat';
import { PartnerTendersComponent } from '../partner-tenders/partner-tenders';
import { TimerComponent } from '../../shared/timer/timer';

@Component({
  selector: 'app-partner-dashboard',
  standalone: true,
  imports: [CommonModule, RouteTrackerComponent, AddOnJobBoardComponent, LiveChatComponent, PartnerTendersComponent, TimerComponent],
  templateUrl: './partner-dashboard.html'
})
export class PartnerDashboardComponent implements OnInit {
  partnerId = 'partner_demo_001';
  pendingOrders: Tender[] = [];

  constructor(private tenderService: TenderService) {}

  ngOnInit() {
    this.tenderService.tenders$.subscribe(list => {
      this.pendingOrders = (list || []).filter(t => t.status === 'assigned' && t.assignedPartnerId === this.partnerId);
    });
    this.tenderService.getTenders();
  }
}
""", encoding="utf-8")

partner_html_path.write_text("""<div class=\"space-y-8 pb-12\">
  <app-route-tracker></app-route-tracker>
  <app-add-on-job-board></app-add-on-job-board>

  <section class=\"rounded-3xl border border-slate-200 bg-white p-6 shadow-sm\">
    <div class=\"flex items-center justify-between gap-4 mb-4\">
      <div>
        <h3 class=\"text-lg font-semibold text-slate-900\">Pending Orders</h3>
        <p class=\"text-sm text-slate-500\">Orders assigned to you and awaiting completion.</p>
      </div>
    </div>

    <div *ngIf=\"pendingOrders.length > 0; else noPendingOrders\" class=\"space-y-4\">
      <article *ngFor=\"let order of pendingOrders\" class=\"rounded-2xl border border-slate-200 bg-slate-50 p-4\">
        <div class=\"flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between\">
          <div>
            <div class=\"font-semibold text-slate-900\">{{ order.title }}</div>
            <div class=\"text-sm text-slate-500\">{{ order.origin }} → {{ order.destination }}</div>
            <div class=\"text-xs text-slate-500 mt-1\">Auction ends in <app-timer [targetTime]=\"order.auctionEnd\"></app-timer></div>
          </div>
          <div class=\"text-right\">
            <div class=\"text-sm text-slate-500\">Budget</div>
            <div class=\"text-lg font-semibold text-slate-900\">${{ order.budget }}</div>
          </div>
        </div>
      </article>
    </div>

    <ng-template #noPendingOrders>
      <p class=\"text-sm text-slate-500\">No pending orders assigned to you yet.</p>
    </ng-template>
  </section>

  <app-partner-tenders></app-partner-tenders>
  <app-live-chat></app-live-chat>
</div>
""", encoding="utf-8")
print('dashboard files written')
