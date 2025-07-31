import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service'; // Importe o serviço

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
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {
  usuario: string = '';
  senha: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService // Injeta o AuthService
  ) { }

  ngOnInit() {
    if (this.authService.isLoggedIn && this.authService.isSessionValid()) {
      this.router.navigate(['/dashboard']);
    }
  }

  private getApiUrl(): string {
    return window.location.hostname !== 'localhost' ?
      'http://147.79.101.18:3636/professional/token' :
      'http://localhost:3636/professional/token';
  }

  // private getApiUrl(): string {
  //   return 'http://147.79.101.18:3636/professional/token';
  // }

  onSubmit() {
    if (!this.usuario.trim() || !this.senha.trim()) {
      this.errorMessage = 'Usuário e senha são obrigatórios';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials = btoa(`{"usuario":"${this.usuario}","senha":"${this.senha}"}`);

    const body = {
      data: credentials
    };

    this.http.post<UserData>(this.getApiUrl(), body).subscribe({
      next: (response) => {
        console.log('Resposta da API:', response);

        if (response && response.id && response.name) {
          console.log('Login bem-sucedido:', response);

          this.authService.login(response);
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