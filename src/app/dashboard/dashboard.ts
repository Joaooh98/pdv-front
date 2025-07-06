import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { SessionWarningComponent } from '../session-warning/session-warning';
import { Subscription } from 'rxjs';

interface UserData {
  email: string;
  id: string;
  isAdmin: boolean;
  name: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route?: string;
  action?: () => void;
}

interface DashboardCard {
  title: string;
  value: string | number;
  subtitle: string;
  trend: 'up' | 'down' | 'neutral';
  percentage?: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SessionWarningComponent], // Adiciona o SessionWarningComponent
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: UserData | null = null;
  currentDate: string = '';
  currentTime: string = '';
  
  private subscriptions: Subscription[] = [];

  // Cards do dashboard
  dashboardCards: DashboardCard[] = [
    {
      title: 'Vendas Hoje',
      value: 'R$ 1.250,00',
      subtitle: '23 atendimentos',
      trend: 'up',
      percentage: '+12%',
      icon: '💰',
      color: 'success'
    },
    {
      title: 'Próximos Agendamentos',
      value: 8,
      subtitle: 'Para hoje',
      trend: 'neutral',
      icon: '📅',
      color: 'info'
    },
    {
      title: 'Produtos em Estoque',
      value: 87,
      subtitle: '5 com estoque baixo',
      trend: 'down',
      percentage: '-3%',
      icon: '📦',
      color: 'warning'
    },
    {
      title: 'Clientes Ativos',
      value: 156,
      subtitle: 'Este mês',
      trend: 'up',
      percentage: '+8%',
      icon: '👥',
      color: 'primary'
    }
  ];

  // Ações rápidas
  quickActions: QuickAction[] = [
    {
      id: 'new-sale',
      title: 'Nova Venda',
      description: 'Registrar atendimento',
      icon: '🛒',
      color: 'success',
      action: () => this.startNewSale()
    },
    {
      id: 'schedule',
      title: 'Agendamentos',
      description: 'Ver agenda do dia',
      icon: '📋',
      color: 'info',
      action: () => this.viewSchedule()
    },
    {
      id: 'products',
      title: 'Produtos',
      description: 'Gerenciar estoque',
      icon: '🧴',
      color: 'warning',
      action: () => this.manageProducts()
    },
    {
      id: 'reports',
      title: 'Relatórios',
      description: 'Análises e vendas',
      icon: '📊',
      color: 'primary',
      action: () => this.viewReports()
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService, // Usa AuthService em vez de acessar localStorage
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    this.subscribeToUser();
    this.updateDateTime();
    this.startClock();
    
    // Verifica se usuário está logado
    if (!this.authService.isLoggedIn || !this.authService.isSessionValid()) {
      this.router.navigate(['/login']);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private subscribeToUser() {
    // Subscreve às mudanças do usuário
    const userSubscription = this.authService.user$.subscribe(user => {
      this.user = user;
      
      // Se usuário foi deslogado, redireciona
      if (!user) {
        this.router.navigate(['/login']);
      }
    });
    
    this.subscriptions.push(userSubscription);
  }

  private updateDateTime() {
    const now = new Date();
    this.currentDate = now.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.currentTime = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private startClock() {
    if (isPlatformBrowser(this.platformId)) {
      setInterval(() => {
        this.updateDateTime();
      }, 60000); // Atualiza a cada minuto
    }
  }

  // Ações rápidas
  startNewSale() {
    console.log('Iniciando nova venda...');
    this.router.navigate(['/order']);
  }

  viewSchedule() {
    console.log('Visualizando agendamentos...');
    // TODO: Implementar navegação para tela de agendamentos
  }

  manageProducts() {
    console.log('Gerenciando produtos...');
    // TODO: Implementar navegação para tela de produtos
  }

  viewReports() {
    console.log('Navegando para relatórios...');
    this.router.navigate(['/reports']);
  }

  logout() {
    // Usa o AuthService para fazer logout
    this.authService.logout('Logout solicitado pelo usuário');
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➖';
    }
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  // Método para verificar tempo restante da sessão (para debug)
  getSessionTimeRemaining(): string {
    const remaining = this.authService.getTimeRemaining();
    const seconds = Math.floor(remaining / 1000);
    return `${seconds}s`;
  }
}