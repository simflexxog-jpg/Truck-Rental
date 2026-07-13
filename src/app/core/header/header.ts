import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html'
})
export class HeaderComponent implements OnInit {
  @Input() isSidebarCollapsed = false;

  currentUser: User | null = null;
  roleLabel = 'Guest';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.roleLabel = user?.role === 'partner' ? 'Partner' : 'Customer';
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}