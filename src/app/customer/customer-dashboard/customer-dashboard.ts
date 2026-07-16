import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TenderCreateComponent } from '../tender-create/tender-create';
import { LiveMapMonitorComponent } from '../live-map-monitor/live-map-monitor';
import { TenderDetailComponent } from '../tender-detail/tender-detail';
import { TimerComponent } from '../../shared/timer/timer';
import { TenderService, Tender } from '../../services/tender.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, TenderCreateComponent, LiveMapMonitorComponent, TenderDetailComponent, TimerComponent],
  templateUrl: './customer-dashboard.html'
})
export class CustomerDashboardComponent implements OnInit {
  tenders: Tender[] = [];
  selectedTenderId: string | null = null;
  originNode = 'Barasat Terminal Vector';
  destinationNode = 'Salt Lake Sector V Hub';

  constructor(private tenderService: TenderService, private router: Router, private socketService: SocketService) {}

  ngOnInit() {
    this.socketService.joinRoom('customer');
    this.socketService.listen<any>('booking-updated').subscribe(updated => {
      this.tenders = this.tenders.map(t => t.id === updated._id ? { ...t, ...updated } : t);
      if (this.selectedTenderId && !this.tenders.some(t => t.id === this.selectedTenderId)) {
        this.selectedTenderId = null;
        return;
      }
      if (!this.selectedTenderId && this.tenders.length) {
        this.selectTender(this.tenders[0].id);
      }
    });
    this.tenderService.tenders$.subscribe(list => {
      this.tenders = list || [];
      if (this.selectedTenderId && !this.tenders.some(t => t.id === this.selectedTenderId)) {
        this.selectedTenderId = null;
        return;
      }
      if (!this.selectedTenderId && this.tenders.length) {
        this.selectTender(this.tenders[0].id);
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
    const selected = this.tenders.find(t => t.id === id);
    if (selected) {
      this.originNode = selected.origin || this.originNode;
      this.destinationNode = selected.destination || this.destinationNode;
    }
  }

  payOrder(order: Tender) {
    this.router.navigate(['/billing/pay', order.id]);
  }

  openChat(order: Tender) {
    this.selectTender(order.id);
    this.router.navigate(['/customer']);
  }

  canPayOrder(order: Tender): boolean {
    return order.status === 'assigned' && !order.paymentApproved;
  }

  getOrderActionLabel(order: Tender): string {
    return this.canPayOrder(order) ? 'Pay' : 'Chat with Partner';
  }

  delistOrder(order: Tender) {
    this.tenderService.delistTender(order.id);
  }
}
