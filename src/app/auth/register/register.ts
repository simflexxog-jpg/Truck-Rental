import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html'
})
export class RegisterComponent implements OnInit {
  selectedRole: 'customer' | 'partner' | 'driver' = 'customer';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  lockRole = false;
  registerForm!: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      const user = this.authService.getCurrentUser();
      const route = user?.role === 'customer' ? '/customer' : '/partner';
      this.router.navigate([route]);
      return;
    }

    const role = this.route.snapshot.queryParamMap.get('role');
    if (role === 'partner' || role === 'customer' || role === 'driver') {
      this.selectedRole = role as 'customer' | 'partner' | 'driver';
      this.lockRole = true;
    }

    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+/)]],
      confirmPassword: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\+[1-9]\d{1,14}$/)]],
      companyName: [''],
      licenseNumber: [''],
      licenseExpiry: [''],
      emergencyContact: ['']
    });
  }

  setRole(role: 'customer' | 'partner' | 'driver') {
    if (this.lockRole) return;
    this.selectedRole = role;
  }

  onRegister() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid) {
      this.errorMessage = 'Please fill in the required fields with valid values.';
      return;
    }

    if (this.registerForm.value.password !== this.registerForm.value.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (this.selectedRole === 'driver' && !this.registerForm.value.licenseNumber) {
      this.errorMessage = 'License number is required for drivers.';
      return;
    }

    this.isLoading = true;

    const payload = {
      ...this.registerForm.value,
      role: this.selectedRole
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.successMessage = 'Check your email to verify your account.';
        this.isLoading = false;
        this.router.navigate(['/login'], { queryParams: { role: this.selectedRole, registered: 'true' } });
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Registration failed. Please try again.';
        this.isLoading = false;
      }
    });
  }
}