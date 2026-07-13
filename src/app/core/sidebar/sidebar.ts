import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideLogOut, LucideMenu, LucideReceiptText, LucideTruck, LucideUsers } from '@lucide/angular';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideMenu, LucideLogOut, LucideUsers, LucideTruck, LucideReceiptText],
  templateUrl: './sidebar.html'
})
export class SidebarComponent {
  private sidebarService = inject(SidebarService);
  isSidebarCollapsed$ = this.sidebarService.sidebarCollapsed$;

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }
}