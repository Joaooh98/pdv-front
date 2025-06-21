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
  amount: number;
  amountCard: number;
  amountCash: number;
  amountComission: number;
  name: string;
}

interface OrdersResponse {
  infos: ProfessionalInfo[];
  orders: OrderData[];
  totalAmount: number;
  totalAmountCard: number;
  totalAmountCash: number;
  totalAmountDiscont: number;
  totalOrders: number;
}

interface AccountData {
  id: string;
  name: string;
  provider: string;
  createdAt: string;
}

interface AccountBalance {
  accountId: string;
  balance: number;
  currency: string;
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
  styleUrl: './report.scss'
})
export class ReportComponent implements OnInit {
  user: UserData | null = null;
  
  // Filtros de data
  startDate: string = '';
  endDate: string = '';
  
  // Dados dos pedidos
  ordersResponse: OrdersResponse | null = null;
  orders: OrderData[] = [];
  professionalInfos: ProfessionalInfo[] = [];
  isLoadingOrders: boolean = false;
  
  // Dados das contas
  accounts: AccountData[] = [];
  accountBalances: Map<string, AccountBalance> = new Map();
  isLoadingAccounts: boolean = false;
  isLoadingBalances: boolean = false;
  
  // Métricas do dashboard
  metrics: DashboardMetrics = {
    valorEntradaDiaria: 0,
    faturamentoPrevisto: 0,
    diasPercorridos: 0,
    ticketMedio: 0
  };
  
  // Totais da API
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
  
  // Estado da interface
  activeTab: 'orders' | 'finances' | 'metrics' = 'orders';

  constructor(
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

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
    this.loadMockMetrics(); // Mock até API ficar pronta
  }

  private getApiUrl(endpoint: string, port: string = '8991'): string {
    const base = isPlatformBrowser(this.platformId) && window.location.hostname !== 'localhost' ? 
      `http://147.79.101.18:${port}` : 
      `http://localhost:${port}`;
    return `${base}${endpoint}`;
  }

  // === PEDIDOS ===
  loadOrders() {
    if (!this.user?.id) return;
    
    this.isLoadingOrders = true;
    
    const url = this.getApiUrl(`/checkout-api/orders?dateCreate=${this.startDate}&dateEnd=${this.endDate}&professionalId=${this.user.id}`);
    
    this.http.get<OrdersResponse>(url).subscribe({
      next: (response) => {
        console.log('Resposta da API de pedidos:', response);
        this.ordersResponse = response;
        this.orders = response.orders || [];
        this.professionalInfos = response.infos || [];
        this.updateMetricsFromOrders();
        this.isLoadingOrders = false;
      },
      error: (error) => {
        console.error('Erro ao carregar pedidos:', error);
        // Carrega dados mock em caso de erro
        this.loadMockOrders();
        this.isLoadingOrders = false;
      }
    });
  }

  private loadMockOrders() {
    console.log('Carregando pedidos mock...');
    
    // Mock baseado na estrutura real da API
    const mockResponse: OrdersResponse = {
      infos: [
        {
          amount: 62.00,
          amountCard: 62.00,
          amountCash: 0,
          amountComission: 26.66,
          name: this.user?.name || "Usuário Mock"
        }
      ],
      orders: [
        {
          id: '50f4247d-cdc9-45c3-8a37-ba3e18915522',
          acquirerId: '258085867',
          amount: 15.00,
          amountCommission: 6.45,
          dateCreate: '2025-06-21T18:43:40',
          finance: true,
          fee: [
            {
              fee: {
                description: 'IVA',
                id: 'f5086e43-b820-476c-ae81-aff49bb2f44d',
                percentage: 23
              },
              id: 'c7c85f1c-bc28-41ce-ace2-c1c1e3118f1e'
            }
          ],
          items: [
            {
              id: '6a5be4ea-6c5b-420d-9a94-b7c86537e885',
              product: {
                acquirerId: '252763527',
                amountCost: 0.00,
                amountSale: 15.00,
                commission: 43,
                description: 'Corte com desconto',
                id: 'c3bcb3b0-58fa-4eef-85d6-8a8550059b88',
                quantity: 1,
                type: 'SERVICE'
              }
            }
          ],
          payments: [
            {
              amount: 15.00,
              coinType: 'EUR',
              id: '77842e10-a0ee-4a49-ae8a-814cad050322',
              paymentType: 'CARD'
            }
          ],
          professional: {
            admin: false,
            document: '14839868026',
            email: 'usuario@email.com',
            id: this.user?.id || 'mock-id',
            name: this.user?.name || 'Usuário Mock',
            password: '****',
            username: 'Usuario'
          },
          provider: 'VENDUS'
        }
      ],
      totalAmount: 62.00,
      totalAmountCard: 62.00,
      totalAmountCash: 0,
      totalAmountDiscont: 0,
      totalOrders: 4
    };
    
    this.ordersResponse = mockResponse;
    this.orders = mockResponse.orders;
    this.professionalInfos = mockResponse.infos;
    this.updateMetricsFromOrders();
  }

  private updateMetricsFromOrders() {
    // Atualiza métricas baseado nos dados reais
    const today = new Date();
    const currentDay = today.getDate();
    
    this.metrics = {
      valorEntradaDiaria: this.totalVendas,
      faturamentoPrevisto: 2500.00, // Mock - será implementado quando API estiver pronta
      diasPercorridos: currentDay,
      ticketMedio: this.totalPedidos > 0 ? this.totalVendas / this.totalPedidos : 0
    };
  }

  // === CONTAS E SALDOS ===
  loadAccounts() {
    this.isLoadingAccounts = true;
    
    const url = this.getApiUrl('/api/v1/accounts', '8999');
    
    this.http.get<AccountData[]>(url).subscribe({
      next: (accounts) => {
        console.log('Contas carregadas:', accounts);
        this.accounts = accounts || [];
        this.loadAccountBalances();
        this.isLoadingAccounts = false;
      },
      error: (error) => {
        console.error('Erro ao carregar contas:', error);
        // Carrega dados mock em caso de erro
        this.loadMockAccounts();
        this.isLoadingAccounts = false;
      }
    });
  }

  private loadMockAccounts() {
    console.log('Carregando contas mock...');
    this.accounts = [
      {
        id: 'baafb18f-301a-483f-a3f2-77b34f15eb55',
        name: 'BPI-SOCIOS',
        provider: 'BPI',
        createdAt: '2025-06-14T12:23:09.855072845'
      },
      {
        id: '181d4fd0-837f-40a4-b747-a24528cd7dd2',
        name: 'NUMERARIO-SOCIOS',
        provider: 'CASH',
        createdAt: '2025-06-14T12:23:09.855072845'
      }
    ];
    this.loadMockBalances();
  }

  private loadAccountBalances() {
    this.isLoadingBalances = true;
    
    const balancePromises = this.accounts.map(account => {
      const url = this.getApiUrl(`/api/v1/account?accountId=${account.id}`, '8999');
      return this.http.get<{balance: number, currency: string}>(url).toPromise()
        .then(data => {
          if (data) {
            this.accountBalances.set(account.id, {
              accountId: account.id,
              balance: data.balance,
              currency: data.currency
            });
          }
        })
        .catch(error => {
          console.error(`Erro ao carregar saldo da conta ${account.name}:`, error);
          // Saldo mock em caso de erro
          this.accountBalances.set(account.id, {
            accountId: account.id,
            balance: account.provider === 'CASH' ? 250.75 : 1500.30,
            currency: 'EUR'
          });
        });
    });
    
    Promise.all(balancePromises).then(() => {
      this.isLoadingBalances = false;
    });
  }

  private loadMockBalances() {
    this.accountBalances.set('baafb18f-301a-483f-a3f2-77b34f15eb55', {
      accountId: 'baafb18f-301a-483f-a3f2-77b34f15eb55',
      balance: 1500.30,
      currency: 'EUR'
    });
    
    this.accountBalances.set('181d4fd0-837f-40a4-b747-a24528cd7dd2', {
      accountId: '181d4fd0-837f-40a4-b747-a24528cd7dd2',
      balance: 250.75,
      currency: 'EUR'
    });
  }

  // === MÉTRICAS (MOCK) ===
  private loadMockMetrics() {
    // Chama updateMetricsFromOrders que já faz o cálculo
    this.updateMetricsFromOrders();
  }

  // === MÉTODOS DE INTERFACE ===
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
    return this.accountBalances.get(accountId)?.balance || 0;
  }

  getTotalBalance(): number {
    let total = 0;
    this.accountBalances.forEach(balance => {
      total += balance.balance;
    });
    return total;
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
    const labels: {[key: string]: string} = {
      'CASH': '💵 Dinheiro',
      'CARD': '💳 Cartão'
    };
    return labels[paymentType] || paymentType;
  }

  getPaymentTypeIcon(paymentType: string): string {
    return paymentType === 'CASH' ? '💵' : '💳';
  }

  getAccountIcon(provider: string): string {
    const icons: {[key: string]: string} = {
      'BPI': '🏦',
      'CASH': '💵',
      'BANK': '🏛️'
    };
    return icons[provider] || '💼';
  }

  // Métodos específicos para a nova estrutura de pedidos
  getProfessionalSummary(): ProfessionalInfo[] {
    return this.professionalInfos;
  }

  getTotalCommissions(): number {
    return this.professionalInfos.reduce((sum, info) => sum + info.amountComission, 0);
  }
}