import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Product {
  id: string;
  name: string;
  price: number;
  type: 'SERVICE' | 'PRODUCT';
  description?: string;
  stock?: number;
}

interface ApiProduct {
  id: string;
  acquirerId: string;
  description: string;
  amountSale: number;
  amountCost: number;
  commission: number;
  quantity: number;
  type: 'SERVICE' | 'PRODUCT';
}

interface OrderItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface UserData {
  email: string;
  id: string;
  isAdmin: boolean;
  name: string;
}

interface OrderRequest {
  professionalId: string;
  amount: number;
  discount: {
    type: string | null;
    amount: number;
  };
  payments: Array<{
    paymentType: string;
    amount: number;
  }>;
  items: Array<{
    product: {
      id: string;
      description: string;
      amount: number;
      quantity: number;
    };
  }>;
  customer: {
    name: string;
    document: string;
    phone: string;
  };
}

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order.html',
  styleUrl: './order.scss'
})
export class OrderComponent implements OnInit {
  user: UserData | null = null;
  
  // Dados dos produtos/serviços
  services: Product[] = [];
  products: Product[] = [];
  allItems: Product[] = [];
  filteredItems: Product[] = [];
  
  // Carrinho/Pedido
  orderItems: OrderItem[] = [];
  
  // Filtros e busca
  activeTab: 'ALL' | 'SERVICE' | 'PRODUCT' = 'ALL';
  searchTerm: string = '';
  
  // Estados
  isLoadingServices: boolean = false;
  isLoadingProducts: boolean = false;
  isProcessingOrder: boolean = false;
  
  // Cliente
  customerName: string = '';
  customerPhone: string = '';
  customerDocument: string = '';
  
  // Totais
  get subtotal(): number {
    return this.orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  }
  
  get total(): number {
    return this.subtotal; // O preço já inclui IVA
  }

  constructor(
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.loadServices();
    this.loadProducts();
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

  private getApiUrl(endpoint: string): string {
    const base = isPlatformBrowser(this.platformId) && window.location.hostname !== 'localhost' ? 
      'http://147.79.101.18:8991' : 
      'http://localhost:8991';
    return `${base}${endpoint}`;
  }

  private loadServices() {
    this.isLoadingServices = true;
    this.http.get<ApiProduct[]>(this.getApiUrl('/product?type=SERVICE')).subscribe({
      next: (services) => {
        console.log('Serviços recebidos da API:', services);
        
        // Se não retornou dados ou retornou array vazio, usa dados mock
        if (!services || services.length === 0) {
          console.log('API não retornou serviços, usando dados mock');
          this.services = this.getMockServices();
        } else {
          // Processa os serviços e garante que price seja número
          this.services = services.map(service => ({
            id: service.id,
            name: service.description,
            price: this.parsePrice(service.amountSale),
            type: 'SERVICE' as const,
            description: service.description
          }));
        }
        
        console.log('Serviços processados:', this.services);
        this.updateAllItems();
        this.isLoadingServices = false;
      },
      error: (error) => {
        console.error('Erro ao carregar serviços:', error);
        console.log('Usando dados mock devido ao erro');
        this.services = this.getMockServices();
        this.updateAllItems();
        this.isLoadingServices = false;
      }
    });
  }

  private loadProducts() {
    this.isLoadingProducts = true;
    this.http.get<ApiProduct[]>(this.getApiUrl('/product?type=PRODUCT')).subscribe({
      next: (products) => {
        console.log('Produtos recebidos da API:', products);
        
        // Se não retornou dados ou retornou array vazio, usa dados mock
        if (!products || products.length === 0) {
          console.log('API não retornou produtos, usando dados mock');
          this.products = this.getMockProducts();
        } else {
          // Processa os produtos e garante que price seja número
          this.products = products.map(product => ({
            id: product.id,
            name: product.description,
            price: this.parsePrice(product.amountSale),
            type: 'PRODUCT' as const,
            description: product.description,
            stock: product.quantity
          }));
        }
        
        console.log('Produtos processados:', this.products);
        this.updateAllItems();
        this.isLoadingProducts = false;
      },
      error: (error) => {
        console.error('Erro ao carregar produtos:', error);
        console.log('Usando dados mock devido ao erro');
        this.products = this.getMockProducts();
        this.updateAllItems();
        this.isLoadingProducts = false;
      }
    });
  }

  private parsePrice(price: any): number {
    console.log('Parseando preço:', price, 'Tipo:', typeof price);
    
    // Se já é um número, retorna
    if (typeof price === 'number' && !isNaN(price)) {
      console.log('Preço já é número:', price);
      return price;
    }
    
    // Se é string, tenta converter
    if (typeof price === 'string') {
      // Remove espaços e substitui vírgula por ponto
      const cleanPrice = price.replace(/\s/g, '').replace(',', '.');
      console.log('Preço limpo:', cleanPrice);
      const parsed = parseFloat(cleanPrice);
      console.log('Preço parseado:', parsed);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    // Se não conseguir converter, retorna 0
    console.warn('Preço inválido encontrado:', price);
    return 0;
  }

  private getMockServices(): Product[] {
    return [
      { id: '1', name: 'Corte Simples', price: 15.00, type: 'SERVICE', description: 'Corte básico masculino' },
      { id: '2', name: 'Corte + Barba', price: 25.00, type: 'SERVICE', description: 'Corte completo com barba' },
      { id: '3', name: 'Barba', price: 12.00, type: 'SERVICE', description: 'Apenas barba' },
      { id: '4', name: 'Bigode', price: 8.00, type: 'SERVICE', description: 'Aparar bigode' }
    ];
  }

  private getMockProducts(): Product[] {
    return [
      { id: '5', name: 'Pomada Modeladora', price: 18.50, type: 'PRODUCT', description: 'Pomada para cabelo', stock: 15 },
      { id: '6', name: 'Shampoo Anticaspa', price: 12.90, type: 'PRODUCT', description: 'Shampoo medicinal', stock: 8 },
      { id: '7', name: 'Óleo para Barba', price: 22.00, type: 'PRODUCT', description: 'Óleo hidratante', stock: 12 },
      { id: '8', name: 'Cera Modeladora', price: 16.75, type: 'PRODUCT', description: 'Cera fixadora', stock: 20 }
    ];
  }

  private updateAllItems() {
    this.allItems = [...this.services, ...this.products];
    this.applyFilters();
  }

  setActiveTab(tab: 'ALL' | 'SERVICE' | 'PRODUCT') {
    this.activeTab = tab;
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  private applyFilters() {
    let items = this.allItems;

    // Filtro por tipo
    if (this.activeTab !== 'ALL') {
      items = items.filter(item => item.type === this.activeTab);
    }

    // Filtro por busca
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(search) ||
        (item.description && item.description.toLowerCase().includes(search))
      );
    }

    this.filteredItems = items;
  }

  addToOrder(product: Product) {
    console.log('Adicionando produto ao carrinho:', product);
    
    const existingItem = this.orderItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      // Se já existe, aumenta quantidade
      existingItem.quantity++;
      existingItem.subtotal = existingItem.quantity * existingItem.product.price;
      console.log('Item existente atualizado:', existingItem);
    } else {
      // Adiciona novo item
      const orderItem: OrderItem = {
        product,
        quantity: 1,
        subtotal: product.price
      };
      this.orderItems.push(orderItem);
      console.log('Novo item adicionado:', orderItem);
    }
    
    console.log('Carrinho atual:', this.orderItems);
  }

  removeFromOrder(index: number) {
    this.orderItems.splice(index, 1);
  }

  updateQuantity(index: number, quantity: number) {
    if (quantity <= 0) {
      this.removeFromOrder(index);
      return;
    }
    
    this.orderItems[index].quantity = quantity;
    this.orderItems[index].subtotal = quantity * this.orderItems[index].product.price;
  }

  clearOrder() {
    this.orderItems = [];
    this.customerName = '';
    this.customerPhone = '';
    this.customerDocument = '';
  }

  processOrder() {
    if (this.orderItems.length === 0) {
      alert('Adicione itens ao pedido antes de finalizar.');
      return;
    }

    if (!this.customerName.trim()) {
      alert('Nome do cliente é obrigatório.');
      return;
    }

    if (!this.customerDocument.trim()) {
      alert('NIF do cliente é obrigatório.');
      return;
    }

    this.isProcessingOrder = true;

    // Monta o objeto no formato da API
    const orderRequest: OrderRequest = {
      professionalId: this.user?.id || '',
      amount: this.total,
      discount: {
        type: null,
        amount: 0
      },
      payments: [
        {
          paymentType: 'CASH',
          amount: this.total
        }
      ],
      items: this.orderItems.map(item => ({
        product: {
          id: item.product.id,
          description: item.product.description || item.product.name,
          amount: item.product.price,
          quantity: item.quantity
        }
      })),
      customer: {
        name: this.customerName,
        document: this.customerDocument,
        phone: this.customerPhone || ''
      }
    };

    console.log('Enviando pedido para API:', orderRequest);

    // Envia para a API
    this.http.post(this.getApiUrl('/checkout-api/order'), orderRequest).subscribe({
      next: (response) => {
        console.log('Pedido processado com sucesso:', response);
        alert(`Pedido finalizado com sucesso!\nTotal: ${this.formatPrice(this.total)}`);
        this.clearOrder();
        this.isProcessingOrder = false;
      },
      error: (error) => {
        console.error('Erro ao processar pedido:', error);
        alert('Erro ao processar pedido. Tente novamente.');
        this.isProcessingOrder = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  formatPrice(price: number): string {
    // Verifica se é um número válido
    if (isNaN(price) || price === null || price === undefined) {
      console.warn('Preço inválido para formatação:', price);
      return '€0,00';
    }
    
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  getItemIcon(type: string): string {
    return type === 'SERVICE' ? '✂️' : '🧴';
  }
}