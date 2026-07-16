import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `<div class="min-h-[70vh] flex items-center justify-center p-6"><div class="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-8"><h1 class="text-2xl font-semibold text-slate-100">Reset password</h1><form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 space-y-4"><input formControlName="password" type="password" placeholder="New password" class="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100" /><input formControlName="confirmPassword" type="password" placeholder="Confirm password" class="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100" /><button type="submit" class="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950">Save password</button></form><p class="mt-4 text-sm text-slate-400">{{ message }}</p></div></div>`
})
export class ResetPasswordComponent {
  form: FormGroup;
  message = '';
  private token = '';

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private http: HttpClient, private router: Router) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(12)]],
      confirmPassword: ['', [Validators.required]]
    });
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  submit() {
    if (this.form.invalid) {
      this.message = 'Please enter a valid password.';
      return;
    }
    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.message = 'Passwords do not match.';
      return;
    }

    this.http.post('/api/auth/reset-password', { token: this.token, password: this.form.value.password }).subscribe({
      next: () => {
        this.message = 'Password reset successfully.';
        setTimeout(() => this.router.navigate(['/login']), 800);
      },
      error: (err) => {
        this.message = err?.error?.error || 'Unable to reset password.';
      }
    });
  }
}
