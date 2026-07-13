import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';

export interface Transaction {
  id: string;
  tenderId: string;
  operator: string;
  amount: number;
  status: 'cleared' | 'escrow' | 'pending';
  createdAt: Date;
}

export interface Rating {
  id: string;
  tenderId: string;
  operatorId: string;
  operatorName: string;
  rating: number;
  feedback: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private transactions = new BehaviorSubject<Transaction[]>(this.loadTransactionsFromStorage());
  public transactions$ = this.transactions.asObservable();

  private ratings = new BehaviorSubject<Rating[]>(this.loadRatingsFromStorage());
  public ratings$ = this.ratings.asObservable();

  private metrics = new BehaviorSubject({
    escrow: 14850.00,
    disbursed: 84120.00,
    fees: 2969.10
  });
  public metrics$ = this.metrics.asObservable();

  private API_BASE = (typeof window !== 'undefined' && window.location?.origin ? `${window.location.origin}/api` : '/api');
  private refreshTimer?: number;
  private readonly refreshIntervalMs = 5000;

  constructor(private http: HttpClient) {
    this.startAutoRefresh();
  }

  private startAutoRefresh(): void {
    if (typeof window === 'undefined' || this.refreshTimer) {
      return;
    }

    this.refreshTransactions();
    this.refreshTimer = window.setInterval(() => {
      this.refreshTransactions();
    }, this.refreshIntervalMs);
  }

  private refreshTransactions(): void {
    this.http.get<Transaction[]>(`${this.API_BASE}/billing`).pipe(
      catchError(() => of(this.transactions.value))
    ).subscribe(transactions => {
      if (Array.isArray(transactions)) {
        this.transactions.next(transactions);
      }
    });
  }

  createTransaction(tenderId: string, operator: string, amount: number, status: 'cleared' | 'escrow' | 'pending' = 'escrow'): Observable<Transaction> {
    // Call backend create endpoint
    return this.http.post<Transaction>(`${this.API_BASE}/billing/create`, { tenderId, operator, amount, status }).pipe(
      tap((transaction) => {
        const allTransactions = [...this.transactions.value, transaction];
        this.transactions.next(allTransactions);
        // Update metrics
        const currentMetrics = this.metrics.value;
        if (status === 'cleared') {
          currentMetrics.disbursed += amount;
        } else {
          currentMetrics.escrow += amount;
        }
        currentMetrics.fees += amount * 0.03;
        this.metrics.next({ ...currentMetrics });
      }),
      catchError(err => {
        // fallback to local transaction
        const transaction: Transaction = {
          id: 'TXN-' + String(Math.floor(Math.random() * 100000)).padStart(5, '0') + '-' + Math.random().toString(36).substring(2, 5).toUpperCase(),
          tenderId,
          operator,
          amount,
          status,
          createdAt: new Date()
        };
        const allTransactions = [...this.transactions.value, transaction];
        this.transactions.next(allTransactions);
        const currentMetrics = this.metrics.value;
        if (status === 'cleared') currentMetrics.disbursed += amount; else currentMetrics.escrow += amount;
        currentMetrics.fees += amount * 0.03;
        this.metrics.next({ ...currentMetrics });
        return of(transaction);
      })
    );
  }

  submitRating(tenderId: string, operatorId: string, operatorName: string, rating: number, feedback: string): Observable<Rating> {
    const ratingObj: Rating = {
      id: 'rating_' + Date.now(),
      tenderId,
      operatorId,
      operatorName,
      rating,
      feedback,
      createdAt: new Date()
    };

    const allRatings = [...this.ratings.value, ratingObj];
    this.ratings.next(allRatings);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('ratings', JSON.stringify(allRatings));
    }

    return new Observable(subscriber => {
      subscriber.next(ratingObj);
      subscriber.complete();
    });
  }

  getTransactions(): Transaction[] {
    return this.transactions.value;
  }

  getRatings(): Rating[] {
    return this.ratings.value;
  }

  getMetrics() {
    return this.metrics.value;
  }

  private loadTransactionsFromStorage(): Transaction[] {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [
        { id: 'TXN-00923-LK8', tenderId: '#LGT-8921', operator: 'Barasat Inter-State Freight Corp', amount: 2450.00, status: 'cleared', createdAt: new Date() },
        { id: 'TXN-00951-X12', tenderId: '#LGT-9082', operator: 'Alpha-Carrier Express', amount: 1240.00, status: 'escrow', createdAt: new Date() },
        { id: 'TXN-00966-Z99', tenderId: '#LGT-9104', operator: 'Kolkata Heavy Haulage', amount: 3800.50, status: 'cleared', createdAt: new Date() }
      ];
    }
    const transactions = localStorage.getItem('transactions');
    return transactions ? JSON.parse(transactions) : [
      { id: 'TXN-00923-LK8', tenderId: '#LGT-8921', operator: 'Barasat Inter-State Freight Corp', amount: 2450.00, status: 'cleared', createdAt: new Date() },
      { id: 'TXN-00951-X12', tenderId: '#LGT-9082', operator: 'Alpha-Carrier Express', amount: 1240.00, status: 'escrow', createdAt: new Date() },
      { id: 'TXN-00966-Z99', tenderId: '#LGT-9104', operator: 'Kolkata Heavy Haulage', amount: 3800.50, status: 'cleared', createdAt: new Date() }
    ];
  }

  private loadRatingsFromStorage(): Rating[] {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [];
    }
    const ratings = localStorage.getItem('ratings');
    return ratings ? JSON.parse(ratings) : [];
  }
}
