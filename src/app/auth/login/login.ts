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
  
  credentials = {
    email: '',
    password: ''
  };
  lockRole = false;

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

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials.email, this.credentials.password, this.selectedRole).subscribe({
      next: (user) => {
        if (user) {
          // Navigate based on role
          const route = user.role === 'customer' ? '/customer' : '/partner';
          this.router.navigate([route]);
        } else {
          this.errorMessage = 'Invalid credentials or role mismatch. Please ensure you are using the correct role.';
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