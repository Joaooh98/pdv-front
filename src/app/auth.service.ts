import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, fromEvent, merge } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';

interface UserData {
  email: string;
  id: string;
  isAdmin: boolean;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly SESSION_TIMEOUT = 60000; // 1 minuto em millisegundos
  private readonly WARNING_TIME = 45000; // Aviso aos 45 segundos
  
  private userSubject = new BehaviorSubject<UserData | null>(null);
  private sessionTimer: any;
  private warningTimer: any;
  private activitySubscription: any;
  
  public user$ = this.userSubject.asObservable();
  public sessionWarning$ = new BehaviorSubject<boolean>(false);

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.initializeAuth();
  }

  private initializeAuth() {
    if (isPlatformBrowser(this.platformId)) {
      // Carrega usuário do localStorage
      this.loadUserFromStorage();
      
      // Se há usuário logado, inicia monitoramento
      if (this.userSubject.value) {
        this.startSessionMonitoring();
      }
    }
  }

  private loadUserFromStorage() {
    if (isPlatformBrowser(this.platformId)) {
      const userData = localStorage.getItem('user');
      const loginTime = localStorage.getItem('loginTime');
      
      if (userData && loginTime) {
        const elapsed = Date.now() - parseInt(loginTime);
        
        // Se passou do tempo limite, faz logout
        if (elapsed > this.SESSION_TIMEOUT) {
          this.logout('Sessão expirou por inatividade');
          return;
        }
        
        // Se está dentro do tempo, carrega o usuário
        this.userSubject.next(JSON.parse(userData));
      }
    }
  }

  login(userData: UserData) {
    if (isPlatformBrowser(this.platformId)) {
      // Salva dados do usuário e timestamp do login
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('loginTime', Date.now().toString());
      localStorage.setItem('lastActivity', Date.now().toString());
      
      this.userSubject.next(userData);
      this.startSessionMonitoring();
      
      console.log('✅ Usuário logado com sucesso. Sessão expira em 1 minuto.');
    }
  }

  logout(reason?: string) {
    if (isPlatformBrowser(this.platformId)) {
      // Limpa todos os dados
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('loginTime');
      localStorage.removeItem('lastActivity');
    }
    
    // Para monitoramento
    this.stopSessionMonitoring();
    
    // Limpa estados
    this.userSubject.next(null);
    this.sessionWarning$.next(false);
    
    // Exibe mensagem se fornecida
    if (reason) {
      alert(`🚪 ${reason}`);
    }
    
    // Redireciona para login
    this.router.navigate(['/login']);
    
    console.log('❌ Usuário deslogado:', reason || 'Logout manual');
  }

  private startSessionMonitoring() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    console.log('🕐 Iniciando monitoramento de sessão (1 minuto)');
    
    // Para qualquer monitoramento anterior
    this.stopSessionMonitoring();
    
    // Monitora atividade do usuário
    this.setupActivityMonitoring();
    
    // Inicia timer da sessão
    this.resetSessionTimer();
  }

  private setupActivityMonitoring() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Eventos que contam como atividade
    const activityEvents = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Cria observables para todos os eventos
    const activityStreams = activityEvents.map(eventType => 
      fromEvent(document, eventType)
    );

    // Combina todos os eventos e aplica debounce
    this.activitySubscription = merge(...activityStreams)
      .pipe(
        debounceTime(1000), // Debounce de 1 segundo para evitar spam
        tap(() => this.onUserActivity())
      )
      .subscribe();
  }

  private onUserActivity() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Atualiza timestamp da última atividade
    localStorage.setItem('lastActivity', Date.now().toString());
    
    // Remove aviso se estiver ativo
    if (this.sessionWarning$.value) {
      this.sessionWarning$.next(false);
      console.log('⚡ Atividade detectada - aviso de sessão removido');
    }
    
    // Reinicia o timer
    this.resetSessionTimer();
  }

  private resetSessionTimer() {
    // Limpa timers existentes
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }

    // Timer para aviso (45 segundos)
    this.warningTimer = setTimeout(() => {
      this.sessionWarning$.next(true);
      console.log('⚠️ Aviso: Sessão expira em 15 segundos');
    }, this.WARNING_TIME);

    // Timer para logout (60 segundos)
    this.sessionTimer = setTimeout(() => {
      this.logout('Sessão expirou por inatividade (1 minuto)');
    }, this.SESSION_TIMEOUT);
  }

  private stopSessionMonitoring() {
    // Para timers
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }

    // Para monitoramento de atividade
    if (this.activitySubscription) {
      this.activitySubscription.unsubscribe();
      this.activitySubscription = null;
    }

    console.log('🛑 Monitoramento de sessão parado');
  }

  // Getters úteis
  get currentUser(): UserData | null {
    return this.userSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.userSubject.value !== null;
  }

  // Método para verificar se sessão ainda é válida
  isSessionValid(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    
    const loginTime = localStorage.getItem('loginTime');
    const lastActivity = localStorage.getItem('lastActivity');
    
    if (!loginTime || !lastActivity) return false;
    
    const elapsed = Date.now() - parseInt(lastActivity);
    return elapsed <= this.SESSION_TIMEOUT;
  }

  // Método para estender sessão (caso necessário)
  extendSession() {
    if (this.isLoggedIn && isPlatformBrowser(this.platformId)) {
      localStorage.setItem('lastActivity', Date.now().toString());
      this.resetSessionTimer();
      this.sessionWarning$.next(false);
      console.log('🔄 Sessão estendida');
    }
  }

  // Método para obter tempo restante da sessão
  getTimeRemaining(): number {
    if (!isPlatformBrowser(this.platformId)) return 0;
    
    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) return 0;
    
    const elapsed = Date.now() - parseInt(lastActivity);
    const remaining = this.SESSION_TIMEOUT - elapsed;
    
    return Math.max(0, remaining);
  }

  // Cleanup ao destruir o serviço
  ngOnDestroy() {
    this.stopSessionMonitoring();
  }
}