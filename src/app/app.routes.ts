import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard';
import { LoginComponent } from './login/login';
import { OrderComponent } from './order/order';
import { ReportComponent } from './report/report';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'order', component: OrderComponent },
  { path: 'reports', component: ReportComponent },
  { path: '**', redirectTo: '/login' }
];