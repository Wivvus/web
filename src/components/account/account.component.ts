import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { Router } from '@angular/router';
import { AuthService } from '../../services/authentication/auth.service';
import { ApiService } from '../../services/api/api.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './account.template.html',
  styleUrl: './account.style.less'
})
export class AccountComponent implements OnInit {
  name: string = '';
  email: string = '';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.apiService.getUserProfile().subscribe({
      next: profile => {
        this.name = profile.name;
        this.email = profile.email;
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
