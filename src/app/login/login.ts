import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface LoginResponse {
  data: string;
}

interface UserData {
  email: string;
  id: string;
  isAdmin: boolean;
  name: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  usuario: string = '';
  senha: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  
  constructor(
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private getApiUrl(): string {
    if (isPlatformBrowser(this.platformId)) {
      return window.location.hostname !== 'localhost' ? 
        'http://147.79.101.18:8991/professional/token' : 
        'http://localhost:8991/professional/token';
    }
    return 'http://localhost:8991/professional/token'; // Default para servidor
  }

  onSubmit() {
    if (!this.usuario.trim() || !this.senha.trim()) {
      this.errorMessage = 'Usuário e senha são obrigatórios';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Codifica as credenciais em base64
    const credentials = btoa(`{"usuario":"${this.usuario}","senha":"${this.senha}"}`);
    
    const body = {
      data: credentials
    };

    this.http.post<UserData>(this.getApiUrl(), body).subscribe({
      next: (response) => {
        console.log('Resposta da API:', response);
        
        // A API retorna diretamente os dados do usuário
        if (response && response.id && response.name) {
          console.log('Login bem-sucedido:', response);
          
          // Salva os dados do usuário no localStorage (apenas no browser)
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('user', JSON.stringify(response));
            // Não temos token, mas salvamos os dados mesmo assim
            localStorage.setItem('loginData', JSON.stringify(response));
          }
          
          // Redireciona para o dashboard
          this.router.navigate(['/dashboard']);
        } else {
          console.error('Resposta inválida:', response);
          this.errorMessage = 'Dados de login inválidos';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro HTTP:', error);
        this.errorMessage = error.status === 401 ? 
          'Usuário ou senha inválidos' : 
          'Erro de conexão com o servidor';
        this.isLoading = false;
      }
    });
  }

  clearError() {
    this.errorMessage = '';
  }
}