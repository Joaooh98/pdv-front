import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard';
import { LoginComponent } from './login/login';
import { OrderComponent } from './order/order';
import { ReportComponent } from './report/report';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/login', 
    pathMatch: 'full' 
  },
  { 
    path: 'login', 
    component: LoginComponent 
  },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard] // Protege a rota
  },
  { 
    path: 'order', 
    component: OrderComponent,
    canActivate: [AuthGuard] // Protege a rota
  },
  { 
    path: 'reports', 
    component: ReportComponent,
    canActivate: [AuthGuard] // Protege a rota
  },
  { 
    path: '**', 
    redirectTo: '/login' 
  }
];