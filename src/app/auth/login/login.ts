import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  selectedRole: 'customer' | 'partner' = 'customer';
  isLoading = false;
  errorMessage = '';
  
  credentials = {
    email: '',
    password: ''
  };

  constructor(private authService: AuthService, private router: Router) {}

  setRole(role: 'customer' | 'partner') {
    this.selectedRole = role;
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials.email, this.credentials.password).subscribe({
      next: (user) => {
        if (user) {
          // Navigate based on role
          const route = user.role === 'customer' ? '/customer' : '/partner';
          this.router.navigate([route]);
        } else {
          this.errorMessage = 'Invalid credentials. Please try again.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Login failed. Please check your credentials.';
        this.isLoading = false;
      }
    });
  }
}