import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface UserData {
  email: string;
  id: string;
  isAdmin: boolean;
  name: string;
}

interface OrderData {
  id: string;
  amount: number;
  amountCommission: number;
  dateCreate: string;
  acquirerId?: string;
  finance: boolean;
  fee: Array<{
    fee: {
      description: string;
      id: string;
      percentage: number;
    };
    id: string;
  }>;
  items: Array<{
    id: string;
    product: {
      acquirerId: string;
      amountCost: number;
      amountSale: number;
      commission: number;
      description: string;
      id: string;
      quantity: number;
      type: string;
    };
  }>;
  payments: Array<{
    amount: number;
    coinType: string;
    id: string;
    paymentType: string;
  }>;
  professional: {
    admin: boolean;
    document: string;
    email: string;
    id: string;
    name: string;
    password: string;
    username: string;
  };
  provider: string;
}

interface ProfessionalInfo {
  id?: number | string;
  name: string;
  amount: number;
  amountCard: number;
  amountCash: number;
  amountComission: number;
  amountFee: number;
}

interface OrdersResponse {
  infos: ProfessionalInfo[];
  orders: OrderData[];
  totalAmount: number;
  totalAmountCard: number;
  totalAmountCash: number;
  totalAmountDiscont: number;
  totalAmountFee: number;
  totalOrders: number;
}

interface AccountData {
  id: string;
  name: string;
  provider: string;
  createdAt: string;
  balance: {
    balanceNow: number;
    balancePrevious: number;
    coin: string;
    lastMovementValue: number;
  };
  persons: string[];
}

interface DashboardMetrics {
  valorEntradaDiaria: number;
  faturamentoPrevisto: number;
  diasPercorridos: number;
  ticketMedio: number;
}

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report.html',
  styleUrls: ['./report.scss']
})

export class ReportComponent implements OnInit {
  user: UserData | null = null;

  startDate: string = '';
  endDate: string = '';

  ordersResponse: OrdersResponse | null = null;
  orders: OrderData[] = [];
  professionalInfos: ProfessionalInfo[] = []; 
  isLoadingOrders: boolean = false;

  accounts: AccountData[] = [];
  isLoadingAccounts: boolean = false;

  metrics: DashboardMetrics = {
    valorEntradaDiaria: 0,
    faturamentoPrevisto: 0,
    diasPercorridos: 0,
    ticketMedio: 0
  };

  get totalVendas(): number {
    return this.ordersResponse?.totalAmount || 0;
  }

  get totalPedidos(): number {
    return this.ordersResponse?.totalOrders || 0;
  }

  get vendasDinheiro(): number {
    return this.ordersResponse?.totalAmountCash || 0;
  }

  get vendasCartao(): number {
    return this.ordersResponse?.totalAmountCard || 0;
  }

  get totalDesconto(): number {
    return this.ordersResponse?.totalAmountDiscont || 0;
  }

  get totalAmountFee(): number {
    return this.ordersResponse?.totalAmountFee || 0;
  }

  activeTab: 'orders' | 'finances' | 'metrics' = 'orders';

  constructor(
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    this.loadUserData();
    this.initializeDates();
    this.loadInitialData();
  }

  private loadUserData() {
    if (isPlatformBrowser(this.platformId)) {
      const userData = localStorage.getItem('user');
      if (userData) {
        this.user = JSON.parse(userData);
      } else {
        this.router.navigate(['/login']);
      }
    }
  }

  private initializeDates() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.startDate = today.toISOString().split('T')[0];
    this.endDate = tomorrow.toISOString().split('T')[0];
  }

  private loadInitialData() {
    this.loadOrders();
    this.loadAccounts();
  }

  private getApiUrl(endpoint: string, port: string = '3636'): string {
    const base = isPlatformBrowser(this.platformId) && window.location.hostname !== 'localhost' ?
      `http://147.79.101.18:${port}` :
      `http://localhost:${port}`;
    return `${base}${endpoint}`;
  }

  loadOrders() {
    if (!this.user?.id) return;

    this.isLoadingOrders = true;

    const url = this.getApiUrl(`/checkout-api/orders?dateCreate=${this.startDate}&dateEnd=${this.endDate}&professionalId=${this.user.id}`);

    this.http.get<OrdersResponse>(url).subscribe({
      next: (response) => {
        this.ordersResponse = response;
        this.orders = response.orders || []; 
        this.professionalInfos = response.infos || []; 
        this.updateMetricsFromOrders();
        this.isLoadingOrders = false;
      },
      error: (error) => {
        console.error('Erro ao carregar pedidos:', error);
        this.orders = [];
        this.professionalInfos = [];
        this.isLoadingOrders = false;
      }
    });
  }

  shouldShowProfessionalsSection(): boolean {
    return !!(this.user?.isAdmin && this.professionalInfos && this.professionalInfos.length > 1);
  }

  private updateMetricsFromOrders() {
    const today = new Date();
    const currentDay = today.getDate();
    this.metrics = {
      valorEntradaDiaria: this.totalVendas,
      faturamentoPrevisto: 2500.00, 
      diasPercorridos: currentDay,
      ticketMedio: this.totalPedidos > 0 ? this.totalVendas / this.totalPedidos : 0
    };
  }

  loadAccounts() {
    if (!this.user?.id) return;
    
    this.isLoadingAccounts = true;

    const url = this.getApiUrl(`/api/v1/account/all?personId=${this.user.id}`, '8999');

    this.http.get<AccountData[]>(url).subscribe({
      next: (accounts) => {
        this.accounts = accounts || [];
        this.isLoadingAccounts = false;
      },
      error: (error) => {
        console.error('Erro ao carregar contas:', error);
        this.accounts = [];
        this.isLoadingAccounts = false;
      }
    });
  }

  setActiveTab(tab: 'orders' | 'finances' | 'metrics') {
    this.activeTab = tab;
  }

  onDateChange() {
    this.loadOrders();
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  getAccountBalance(accountId: string): number {
    const account = this.accounts.find(acc => acc.id === accountId);
    return account?.balance?.balanceNow || 0;
  }

  getTotalBalance(): number {
    return this.accounts.reduce((total, account) => {
      return total + (account.balance?.balanceNow || 0);
    }, 0);
  }

  formatPrice(price: number): string {
    if (isNaN(price) || price === null || price === undefined) {
      return '€0,00';
    }

    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPaymentTypeLabel(paymentType: string): string {
    const labels: { [key: string]: string } = {
      'CASH': '💵 Dinheiro',
      'CARD': '💳 Cartão'
    };
    return labels[paymentType] || paymentType;
  }

  getPaymentTypeIcon(paymentType: string): string {
    return paymentType === 'CASH' ? '💵' : '💳';
  }

  getAccountIcon(provider: string): string {
    return provider === 'CASH' ? '💵' : '🏦';
  }

  getProfessionalSummary(): ProfessionalInfo[] {
    return this.professionalInfos;
  }

  getTotalCommissions(): number {
    return this.professionalInfos.reduce((sum, info) => sum + info.amountComission, 0);
  }
}