import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { CustomerDashboardComponent } from './customer/customer-dashboard/customer-dashboard';
import { PartnerDashboardComponent } from './partner/partner-dashboard/partner-dashboard';
import { BillingDashboardComponent } from './billing/billing-dashboard/billing-dashboard';
import { PaymentPageComponent } from './billing/payment-page/payment-page';
import { CustomerGuard } from './guards/customer.guard';
import { PartnerGuard } from './guards/partner.guard';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Default redirect to login
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  // Auth Vectors
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Core Operational Dashboards
  { path: 'customer', component: CustomerDashboardComponent, canActivate: [CustomerGuard] },
  { path: 'partner', component: PartnerDashboardComponent, canActivate: [PartnerGuard] },
  { path: 'billing', component: BillingDashboardComponent, canActivate: [AuthGuard] },
  { path: 'billing/pay/:tenderId', component: PaymentPageComponent, canActivate: [AuthGuard] },
  
  // Catch-all for unknown routes (404 fallback)
  { path: '**', redirectTo: 'login' }
];