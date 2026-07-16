import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `<div class="min-h-[70vh] flex items-center justify-center p-6 text-slate-100"><div class="max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-8 text-center"><h1 class="text-2xl font-semibold">Email verification</h1><p class="mt-3 text-slate-400">{{ message }}</p><a routerLink="/login" class="mt-6 inline-block text-cyan-400">Go to login</a></div></div>`
})
export class VerifyEmailComponent implements OnInit {
  message = 'Verifying your email...';

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.message = 'Verification token is missing.';
      return;
    }

    this.http.get<{ message?: string; error?: string }>('/api/auth/verify-email', { params: { token } }).subscribe({
      next: (response) => {
        this.message = response.message || 'Email verified successfully.';
      },
      error: (err) => {
        this.message = err?.error?.error || 'Unable to verify your email.';
      }
    });
  }
}
