import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

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
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  user: UserData | null = null;
  currentDate: string = '';
  currentTime: string = '';

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
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.updateDateTime();
    this.startClock();
  }

  private loadUserData() {
    if (isPlatformBrowser(this.platformId)) {
      const userData = localStorage.getItem('user');
      if (userData) {
        this.user = JSON.parse(userData);
      } else {
        // Se não tem dados do usuário, redireciona para login
        this.router.navigate(['/login']);
      }
    }
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
    console.log('Visualizando relatórios...');
    // TODO: Implementar navegação para tela de relatórios
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    this.router.navigate(['/login']);
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
}