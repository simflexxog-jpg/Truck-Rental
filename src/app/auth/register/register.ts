import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html'
})
export class RegisterComponent implements OnInit {
  selectedRole: 'customer' | 'partner' = 'customer';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  lockRole = false;
  
  registerData = {
    entityName: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const role = this.route.snapshot.queryParamMap.get('role');
    if (role === 'partner' || role === 'customer') {
      this.selectedRole = role as 'customer' | 'partner';
      this.lockRole = true;
    }
  }

  setRole(role: 'customer' | 'partner') {
    if (this.lockRole) return;
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
        this.successMessage = `Registration successful! You may now login.`;
        // Redirect to login page for the same role so the user explicitly logs in
        setTimeout(() => {
          this.router.navigate(['/login'], { queryParams: { role: this.selectedRole } });
        }, 1200);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Registration failed. Please try again.';
        this.isLoading = false;
      }
    });
  }
}