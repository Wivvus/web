import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { Router } from '@angular/router';
import { AuthService } from '../../services/authentication/auth.service';
import { ApiService } from '../../services/api/api.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './account.template.html',
  styleUrl: './account.style.less'
})
export class AccountComponent implements OnInit {
  name: string = '';
  email: string = '';
  isLocalAuth = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordError: string | null = null;
  passwordSuccess = false;
  passwordLoading = false;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLocalAuth = this.authService.getProvider() === 'local';
    this.apiService.getUserProfile().subscribe({
      next: profile => {
        this.name = profile.name;
        this.email = profile.email;
      }
    });
  }

  changePassword(): void {
    this.passwordError = null;
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Passwords do not match';
      return;
    }
    if (this.newPassword.length < 8) {
      this.passwordError = 'Password must be at least 8 characters';
      return;
    }
    this.passwordLoading = true;
    this.apiService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.passwordSuccess = true;
        this.passwordLoading = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.passwordError = err.error?.error || 'Failed to update password';
        this.passwordLoading = false;
      }
    });
  }

  deleteAccount(): void {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    this.apiService.deleteAccount().subscribe({
      next: () => this.authService.logout(),
      error: () => alert('Failed to delete account. Please try again.')
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
