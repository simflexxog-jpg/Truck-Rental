import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html'
})
export class HeaderComponent {
  // Pass the sidebar state so the header can adjust its left margin dynamically
  @Input() isSidebarCollapsed = false; 
}