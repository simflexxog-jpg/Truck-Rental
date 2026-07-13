import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private sidebarCollapsed = new BehaviorSubject<boolean>(false);
  public sidebarCollapsed$ = this.sidebarCollapsed.asObservable();

  toggleSidebar() {
    this.sidebarCollapsed.next(!this.sidebarCollapsed.value);
  }

  setSidebarCollapsed(collapsed: boolean) {
    this.sidebarCollapsed.next(collapsed);
  }

  isSidebarCollapsed(): boolean {
    return this.sidebarCollapsed.value;
  }
}
