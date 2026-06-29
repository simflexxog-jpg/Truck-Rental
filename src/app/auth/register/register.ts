import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html'
})
export class RegisterComponent {
  selectedRole: 'customer' | 'partner' = 'customer';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  registerData = {
    entityName: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  constructor(private authService: AuthService, private router: Router) {}

  setRole(role: 'customer' | 'partner') {
    this.selectedRole = role;
  }

  onRegister() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.registerData.entityName || !this.registerData.email || !this.registerData.password) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errorMessage = 'Security Error: Keyphrases do not match.';
      return;
    }

    if (this.registerData.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    this.isLoading = true;

    this.authService.register(
      this.registerData.entityName,
      this.registerData.email,
      this.registerData.password,
      this.selectedRole
    ).subscribe({
      next: (user) => {
        this.successMessage = `Registration successful! Welcome ${user.entityName}`;
        setTimeout(() => {
          const route = user.role === 'customer' ? '/customer' : '/partner';
          this.router.navigate([route]);
        }, 2000);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Registration failed. Please try again.';
        this.isLoading = false;
      }
    });
  }
}