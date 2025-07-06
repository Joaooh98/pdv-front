import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    console.log('🛡️ AuthGuard: Verificando acesso...');
    
    // Verifica se usuário está logado
    if (!this.authService.isLoggedIn) {
      console.log('❌ AuthGuard: Usuário não está logado');
      this.router.navigate(['/login']);
      return false;
    }

    // Verifica se sessão ainda é válida
    if (!this.authService.isSessionValid()) {
      console.log('❌ AuthGuard: Sessão expirou');
      this.authService.logout('Sessão expirou por inatividade');
      return false;
    }

    console.log('✅ AuthGuard: Acesso permitido');
    return true;
  }
}