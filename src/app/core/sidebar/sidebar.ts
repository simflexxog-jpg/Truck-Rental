import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html'
})
export class SidebarComponent {
  private sidebarService = inject(SidebarService);
  isSidebarCollapsed$ = this.sidebarService.sidebarCollapsed$;

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }
}