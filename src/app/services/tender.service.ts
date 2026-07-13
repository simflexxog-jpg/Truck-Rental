import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { BillingService } from './billing.service';
import { WebSocketService } from './web-socket.service';

const API_BASE = (typeof window !== 'undefined' && window.location?.origin ? `${window.location.origin}/api` : '/api');
const DEMO_CUSTOMER_ID = 'customer_demo_001';

export interface Tender {
  id: string;
  title: string;
  customerId: string;
  weight: number;
  duration: number;
  origin: string;
  destination: string;
  budget: number;
  auctionEnd: string;
  createdAt: Date;
  status: 'open' | 'assigned' | 'completed';
  bids: Bid[];
  assignedBidId?: string;
  assignedPartnerId?: string;
  assignedPartnerName?: string;
  paymentApproved?: boolean;
}

export interface Bid {
  id: string;
  tenderId: string;
  partnerId: string;
  partnerName: string;
  bidAmount: number;
  createdAt: Date;
}

export interface ActiveAuction {
  id: string;
  timer: string;
  lowestBid: number;
  leadingPartner: string;
}

@Injectable({
  providedIn: 'root'
})
export class TenderService {
  private tenders = new BehaviorSubject<Tender[]>(this.loadTendersFromStorage());
  public tenders$ = this.tenders.asObservable();

  private activeTenders = new BehaviorSubject<ActiveAuction[]>([
    { id: '#LGT-9082', timer: '14m 32s', lowestBid: 1240.00, leadingPartner: 'Alpha-Carrier Express' },
    { id: '#LGT-9115', timer: '38m 05s', lowestBid: 950.00, leadingPartner: 'Barasat Heavy Transit' },
    { id: '#LGT-9201', timer: '02h 15m', lowestBid: 1850.50, leadingPartner: 'Kolkata Express Hub' }
  ]);
  public activeTenders$ = this.activeTenders.asObservable();

  private refreshTimer?: number;
  private readonly refreshIntervalMs = 5000;
  private readonly syncStorageKey = 'truck-rental-sync';

  constructor(private billingService: BillingService, private http: HttpClient, private webSocketService: WebSocketService) {
    this.webSocketService.onMessage('tender_created').subscribe(message => {
      const tender = message.payload as Tender;
      if (tender && tender.id && !this.getTenderById(tender.id)) {
        const allTenders = [...this.tenders.value, tender];
        this.tenders.next(allTenders);
        this.syncCache();
      }
    });
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageSync);
    }
    this.startAutoRefresh();
  }

  private handleStorageSync = (event: StorageEvent) => {
    if (event.key === this.syncStorageKey) {
      this.refreshTenders();
    }
  };

  private notifyTabs(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(this.syncStorageKey, JSON.stringify({ type: 'tenders', ts: Date.now() }));
    }
  }

  private startAutoRefresh(): void {
    if (typeof window === 'undefined' || this.refreshTimer) {
      return;
    }

    this.refreshTenders();
    this.refreshTimer = window.setInterval(() => {
      this.refreshTenders();
    }, this.refreshIntervalMs);
  }

  private refreshTenders(): void {
    this.http.get<Tender[]>(`${API_BASE}/tenders`).pipe(
      catchError(() => of(null as Tender[] | null))
    ).subscribe(list => {
      if (Array.isArray(list)) {
        const normalized = list.map(tender => ({
          ...tender,
          createdAt: tender.createdAt ? new Date(tender.createdAt) : new Date()
        }));
        this.tenders.next(normalized);
        this.syncCache();
      }
    });
  }

  private syncCache() {
    try {
      const map: any = {};
      this.tenders.value.forEach((t: any) => map[t.id] = t);
      (window as any).__TENDER_CACHE__ = map;
    } catch (e) {
      // ignore
    }
  }

  // Accept a bid: mark tender as assigned and create a billing transaction
  acceptBid(tenderId: string, bidId: string): Observable<{ tender: Tender, transactionId: string } | any> {
    // Call backend accept endpoint
    return this.http.post<any>(`${API_BASE}/tenders/${tenderId}/accept`, { bidId }).pipe(
      tap((res) => {
        // update local cache
        const tender = this.getTenderById(tenderId);
        if (tender) {
          tender.status = 'assigned';
          tender.paymentApproved = false;
          (tender as any).assignedBidId = res.acceptedBid?.id || bidId;
          (tender as any).assignedPartnerId = res.acceptedBid?.partnerId || (tender as any).assignedPartnerId;
          (tender as any).assignedPartnerName = res.acceptedBid?.partnerName || (tender as any).assignedPartnerName;
          (tender as any).winningBidAmount = res.acceptedBid?.bidAmount || (tender as any).assignedBidId;
          const allTenders = this.tenders.value;
          this.tenders.next([...allTenders]);
          this.syncCache();
        }
      }),
      // create transaction via billing service (which also calls backend)
      // map to combined result
      catchError(err => {
        // fallback: update local and create local transaction
        const tender = this.getTenderById(tenderId);
        const bid = tender?.bids.find(b => b.id === bidId);
        if (tender && bid) {
          tender.status = 'assigned';
          tender.paymentApproved = false;
          (tender as any).assignedBidId = bid.id;
          (tender as any).assignedPartnerId = bid.partnerId;
          (tender as any).assignedPartnerName = bid.partnerName;
          (tender as any).winningBidAmount = bid.bidAmount;
          const allTenders = this.tenders.value;
          this.tenders.next([...allTenders]);
          this.syncCache();
          this.notifyTabs();
          // create local transaction
          return this.billingService.createTransaction(tenderId, bid.partnerName, bid.bidAmount, 'escrow').pipe(
            map(txn => ({ tender, transactionId: txn.id }))
          );
        }
        return of({ error: 'accept failed' });
      })
    );
  }

  rejectBid(tenderId: string, bidId: string): Observable<Tender | any> {
    // call backend reject endpoint
    return this.http.post<any>(`${API_BASE}/tenders/${tenderId}/reject`, { bidId }).pipe(
      tap((res) => {
        const tender = this.getTenderById(tenderId);
        if (tender) {
          const idx = tender.bids.findIndex(b => b.id === bidId);
          if (idx >= 0) tender.bids.splice(idx, 1);
          const allTenders = this.tenders.value;
          this.tenders.next([...allTenders]);
          this.syncCache();
        }
      }),
      catchError(err => {
        // fallback local
        const tender = this.getTenderById(tenderId);
        if (!tender) return of(null as any);
        const idx = tender.bids.findIndex(b => b.id === bidId);
        if (idx >= 0) tender.bids.splice(idx,1);
        const allTenders = this.tenders.value;
        this.tenders.next([...allTenders]);
        this.syncCache();
        this.notifyTabs();
        return of(tender);
      })
    );
  }

  createTender(title: string, weight: number, duration: number, origin: string, destination: string): Observable<Tender> {
    // Try backend first
    return this.http.post<Tender>(`${API_BASE}/tenders`, { title, weight, duration, origin, destination }).pipe(
      tap((tender) => {
        const allTenders = [...this.tenders.value, tender];
        this.tenders.next(allTenders);
        this.syncCache();
        this.webSocketService.send({ type: 'tender_created', payload: tender });
      }),
      catchError(err => {
        // Fallback to local behavior if backend unavailable
        const createdAt = new Date();
        const auctionEnd = new Date(createdAt.getTime() + duration * 60000).toISOString();
        const tender: Tender = {
          id: 'tender_' + Date.now(),
          title,
          customerId: DEMO_CUSTOMER_ID,
          weight,
          duration,
          origin,
          destination,
          budget: weight * 50,
          auctionEnd,
          createdAt,
          status: 'open',
          bids: [],
          paymentApproved: false
        };
        const allTenders = [...this.tenders.value, tender];
        this.tenders.next(allTenders);
        this.syncCache();
        this.notifyTabs();
        this.webSocketService.send({ type: 'tender_created', payload: tender });
        return of(tender);
      })
    );
  }

  getTenders(): Tender[] {
    this.refreshTenders();
    return this.tenders.value;
  }

  getTenderById(id: string): Tender | undefined {
    return this.tenders.value.find(t => t.id === id);
  }

  delistTender(tenderId: string): void {
    const remainingTenders = this.tenders.value.filter(tender => tender.id !== tenderId);
    this.tenders.next(remainingTenders);
    this.syncCache();
  }

  markPaymentApproved(tenderId: string): void {
    const tender = this.getTenderById(tenderId);
    if (tender) {
      tender.paymentApproved = true;
      this.tenders.next([...this.tenders.value]);
      this.syncCache();
      this.notifyTabs();
    }
  }

  private getLowestBid(tender: Tender): number | null {
    if (!tender.bids || tender.bids.length === 0) return null;
    return Math.min(...tender.bids.map(b => b.bidAmount));
  }

  public getBidValidationError(tender: Tender, bidAmount: number): string | null {
    if (isNaN(bidAmount) || bidAmount <= 0) {
      return 'Enter a valid bid amount.';
    }

    if (bidAmount >= tender.budget) {
      return `Bid must be less than the budget (₹${tender.budget}).`;
    }

    const lowestBid = this.getLowestBid(tender);
    if (lowestBid !== null && bidAmount >= lowestBid) {
      return `Bid must be lower than the current lowest bid (₹${lowestBid}).`;
    }

    return null;
  }

  placeBid(tenderId: string, partnerId: string, partnerName: string, bidAmount: number): Observable<Bid> {
    const tender = this.getTenderById(tenderId);
    if (!tender) {
      return throwError(() => new Error('Tender not found.'));
    }

    const validationError = this.getBidValidationError(tender, bidAmount);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    // call backend
    return this.http.post<Bid>(`${API_BASE}/tenders/${tenderId}/bids`, { partnerId, partnerName, bidAmount }).pipe(
      tap((bid) => {
        const tender = this.getTenderById(tenderId);
        if (tender) {
          tender.bids.push(bid);
          const allTenders = this.tenders.value;
          this.tenders.next([...allTenders]);
          this.syncCache();
        }
      }),
      catchError(err => {
        if (err.status === 400 || err.error?.error) {
          return throwError(() => err);
        }
        // fallback to local
        const tender = this.getTenderById(tenderId);
        if (!tender) return throwError(() => new Error('Tender not found for local bid fallback.'));
        const localValidationError = this.getBidValidationError(tender, bidAmount);
        if (localValidationError) {
          return throwError(() => new Error(localValidationError));
        }
        const bid: Bid = { id: 'bid_' + Date.now(), tenderId, partnerId, partnerName, bidAmount, createdAt: new Date() };
        tender.bids.push(bid);
        const allTenders = this.tenders.value;
        this.tenders.next([...allTenders]);
        this.syncCache();
        this.notifyTabs();
        return of(bid);
      })
    );
  }

  private loadTendersFromStorage(): Tender[] {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [];
    }
    const tenders = localStorage.getItem('tenders');
    return tenders ? JSON.parse(tenders) : [];
  }
}
