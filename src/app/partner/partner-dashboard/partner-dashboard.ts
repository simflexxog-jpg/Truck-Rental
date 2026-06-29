import { Component, OnInit } from '@angular/core';
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
  chatTenderId?: string;

  constructor(private tenderService: TenderService) {}

  ngOnInit() {
    this.tenderService.tenders$.subscribe(list => {
      this.pendingOrders = (list || []).filter(t => t.status === 'assigned' && t.assignedPartnerId === this.partnerId);
      this.chatTenderId = this.pendingOrders.length > 0 ? this.pendingOrders[0].id : undefined;
    });
    this.tenderService.getTenders();
  }
}
