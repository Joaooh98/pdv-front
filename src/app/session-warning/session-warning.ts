import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-session-warning',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-warning.html',
  styleUrl: './session-warning.scss'
})
export class SessionWarningComponent implements OnInit, OnDestroy {
  showWarning = false;
  timeRemaining = 15; // 15 segundos restantes quando o aviso aparece
  progressPercentage = 100;
  
  private subscriptions: Subscription[] = [];
  private countdownTimer: any;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Monitora o estado do aviso de sessão
    const warningSubscription = this.authService.sessionWarning$.subscribe(isWarning => {
      this.showWarning = isWarning;
      
      if (isWarning) {
        this.startCountdown();
      } else {
        this.stopCountdown();
      }
    });
    
    this.subscriptions.push(warningSubscription);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.stopCountdown();
  }

  private startCountdown() {
    this.timeRemaining = 15; // 15 segundos de aviso
    this.progressPercentage = 100;
    
    // Para qualquer countdown anterior
    this.stopCountdown();
    
    // Inicia novo countdown
    this.countdownTimer = setInterval(() => {
      this.timeRemaining--;
      this.progressPercentage = (this.timeRemaining / 15) * 100;
      
      // Se chegou a zero, para o countdown (o AuthService já fará o logout)
      if (this.timeRemaining <= 0) {
        this.stopCountdown();
      }
    }, 1000);
  }

  private stopCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  extendSession() {
    this.authService.extendSession();
    this.showWarning = false;
    this.stopCountdown();
  }

  logout() {
    this.authService.logout('Logout solicitado pelo usuário');
  }
}