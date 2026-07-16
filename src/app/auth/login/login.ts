import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html'
})
export class LoginComponent implements OnInit {
  selectedRole: 'customer' | 'partner' = 'customer';
  isLoading = false;
  errorMessage = '';
  infoMessage = '';

  credentials = {
    email: '',
    password: '',
    rememberMe: false
  };
  lockRole = false;

  constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      const user = this.authService.getCurrentUser();
      const route = user?.role === 'customer' ? '/customer' : '/partner';
      this.router.navigate([route]);
      return;
    }

    const role = this.route.snapshot.queryParamMap.get('role');
    if (role === 'partner' || role === 'customer') {
      this.selectedRole = role as 'customer' | 'partner';
      this.lockRole = true;
    }

    const registered = this.route.snapshot.queryParamMap.get('registered');
    if (registered === 'true') {
      this.infoMessage = 'Account created successfully. Please verify your email before signing in.';
    }
  }

  setRole(role: 'customer' | 'partner') {
    if (this.lockRole) return;
    this.selectedRole = role;
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';
    this.infoMessage = '';

    this.authService.login(this.credentials.email, this.credentials.password, this.credentials.rememberMe).subscribe({
      next: (response) => {
        const role = response.user?.role;
        if (response.accessToken && role) {
          const route = role === 'customer' ? '/customer' : '/partner';
          this.router.navigate([route]);
        } else {
          this.errorMessage = 'Login failed. Please check your credentials.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Login failed. Please check your credentials.';
        this.isLoading = false;
      }
    });
  }
}