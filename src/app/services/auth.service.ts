import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
  entityName: string;
  role: 'customer' | 'partner';
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = new BehaviorSubject<User | null>(this.loadUserFromStorage());
  public currentUser$ = this.currentUser.asObservable();

  private isAuthenticated = new BehaviorSubject<boolean>(!!this.loadUserFromStorage());
  public isAuthenticated$ = this.isAuthenticated.asObservable();

  constructor() {}

  register(entityName: string, email: string, password: string, role: 'customer' | 'partner', autoLogin: boolean = false): Observable<User> {
    const newUser: User = {
      id: 'user_' + Date.now(),
      email,
      entityName,
      role,
      createdAt: new Date()
    };

    // Store in localStorage
    const users = this.getAllUsers();
    users.push({ ...newUser, password });
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('users', JSON.stringify(users));
    }

    // Only set as current user if explicitly requested (avoid accidental cross-role auto-login)
    if (autoLogin) {
      this.currentUser.next(newUser);
      this.isAuthenticated.next(true);
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(newUser));
      }
    }

    return new Observable(subscriber => {
      subscriber.next(newUser);
      subscriber.complete();
    });
  }

  login(email: string, password: string, role?: 'customer' | 'partner'): Observable<User | null> {
    return new Observable(subscriber => {
      const users = this.getAllUsers();
      const user = users.find(u => u.email === email && u.password === password && (role ? u.role === role : true));

      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        this.currentUser.next(userWithoutPassword as User);
        this.isAuthenticated.next(true);
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        }
        subscriber.next(userWithoutPassword as User);
      } else {
        subscriber.next(null);
      }
      subscriber.complete();
    });
  }

  logout(): void {
    this.currentUser.next(null);
    this.isAuthenticated.next(false);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('currentUser');
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser.value;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated.value;
  }

  private loadUserFromStorage(): User | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  private getAllUsers(): any[] {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [];
    }
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  }
}
