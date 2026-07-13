import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenderService, Tender } from '../../services/tender.service';
import { AuthService, User } from '../../services/auth.service';
import { RouteTrackerComponent } from '../route-tracker/route-tracker';
import { AddOnJobBoardComponent } from '../add-on-job-board/add-on-job-board';
import { LiveChatComponent } from '../live-chat/live-chat';
import { PartnerTendersComponent } from '../partner-tenders/partner-tenders';
import { TimerComponent } from '../../shared/timer/timer';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-partner-dashboard',
  standalone: true,
  imports: [CommonModule, RouteTrackerComponent, AddOnJobBoardComponent, LiveChatComponent, PartnerTendersComponent, TimerComponent],
  templateUrl: './partner-dashboard.html'
})
export class PartnerDashboardComponent implements OnInit {
  partnerId = 'partner_demo_001';
  pendingOrders: Tender[] = [];
  private tenders: Tender[] = [];
  chatTenderId?: string;
  currentUser: User | null = null;

  constructor(private tenderService: TenderService, public auth: AuthService, private socketService: SocketService) {
    const user = this.auth.getCurrentUser();
    if (user) this.partnerId = user.id || this.partnerId;
    this.auth.currentUser$.subscribe(u => { this.currentUser = u; if (u) { this.partnerId = u.id; this.recomputePending(); } });
  }

  

  clearLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      // also reload so guards and components re-evaluate
      window.location.reload();
    }
  }

  ngOnInit() {
    this.socketService.joinRoom('partner');
    this.socketService.listen<any>('new-booking').subscribe(booking => {
      this.tenders = [booking, ...this.tenders];
      this.recomputePending();
    });
    this.socketService.listen<any>('booking-updated').subscribe(updated => {
      this.tenders = this.tenders.map(b => b.id === updated._id ? { ...b, ...updated } : b);
      this.recomputePending();
    });
    this.tenderService.tenders$.subscribe(list => {
      this.tenders = list || [];
      this.recomputePending();
    });
    this.tenderService.getTenders();
  }

  private recomputePending() {
    this.pendingOrders = (this.tenders || []).filter(t => t.status === 'assigned' && t.paymentApproved && t.assignedPartnerId === this.partnerId);
    this.chatTenderId = this.pendingOrders.length > 0 ? this.pendingOrders[0].id : undefined;
  }
}
