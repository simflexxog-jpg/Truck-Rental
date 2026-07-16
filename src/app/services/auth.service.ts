import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  email: string;
  role: 'customer' | 'partner' | 'driver';
  entityName?: string;
  firstName?: string;
  lastName?: string;
  companyId?: string | null;
  permissions?: string[];
  emailVerified?: boolean;
}

interface AuthResponse {
  accessToken?: string;
  user?: User;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiBaseUrl = environment.apiUrl || '';

  private currentUser = new BehaviorSubject<User | null>(this.loadUserFromStorage());
  public currentUser$ = this.currentUser.asObservable();

  private isAuthenticated = new BehaviorSubject<boolean>(!!this.loadUserFromStorage());
  public isAuthenticated$ = this.isAuthenticated.asObservable();
  private accessToken: string | null = null;

  constructor(private http: HttpClient) {
    this.accessToken = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
  }

  register(payload: Record<string, string>): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiBaseUrl}/api/auth/register`, payload, this.authOptions()).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  login(email: string, password: string, rememberMe = false): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiBaseUrl}/api/auth/login`, { email, password, rememberMe }, this.authOptions()).pipe(
      tap((response) => this.handleAuthResponse(response)),
      catchError((error) => this.handleError(error))
    );
  }

  refreshToken(): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>(`${this.apiBaseUrl}/api/auth/refresh`, {}, this.authOptions()).pipe(
      tap((response) => {
        if (response.accessToken) {
          this.accessToken = response.accessToken;
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('accessToken', response.accessToken);
          }
        }
      }),
      catchError((error) => this.handleError(error))
    );
  }

  logout(): Observable<any> {
    this.clearSession();
    return this.http.post(`${this.apiBaseUrl}/api/auth/logout`, {}, this.authOptions()).pipe(
      catchError(() => this.handleError(new HttpErrorResponse({ error: 'logout failed', status: 0 })) )
    );
  }

  getCurrentUser(): User | null {
    return this.currentUser.value;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated.value;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private handleAuthResponse(response: AuthResponse): void {
    if (response.accessToken) {
      this.accessToken = response.accessToken;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('accessToken', response.accessToken);
      }
    }

    if (response.user) {
      const normalizedUser: User = {
        ...response.user,
        entityName: response.user.entityName || `${response.user.firstName || ''} ${response.user.lastName || ''}`.trim() || response.user.email
      };
      this.currentUser.next(normalizedUser);
      this.isAuthenticated.next(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(normalizedUser));
      }
    }
  }

  private authOptions() {
    return { withCredentials: true };
  }

  private clearSession(): void {
    this.currentUser.next(null);
    this.isAuthenticated.next(false);
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('accessToken');
      localStorage.removeItem('currentUser');
    }
  }

  private loadUserFromStorage(): User | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    return throwError(() => error);
  }
}
