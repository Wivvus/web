import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, UserInfo } from '../../services/authentication/auth.service';
import { ApiService, UserData, UserProfile } from '../../services/api/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <header class="header">
        <h1>Dashboard</h1>
        <div class="user-section" *ngIf="user">
          <img [src]="user.picture" [alt]="user.name" class="profile-pic">
          <span class="user-name">{{ user.name }}</span>
          <button (click)="logout()" class="btn-logout">Logout</button>
        </div>
      </header>

      <div class="content">
        <div class="card" *ngIf="loading">
          <p>Loading...</p>
        </div>

        <div class="card" *ngIf="error">
          <h2>Error</h2>
          <p class="error-message">{{ error }}</p>
          <button (click)="loadData()" class="btn-retry">Retry</button>
        </div>

        <div class="card" *ngIf="!loading && !error && userData">
          <h2>{{ userData.message }}</h2>
          <div class="user-info">
            <p><strong>Email:</strong> {{ userData.user.email }}</p>
            <p><strong>Name:</strong> {{ userData.user.name }}</p>
            <p><strong>User ID:</strong> {{ userData.user.id }}</p>
          </div>
          <div class="data-section">
            <h3>Your Data:</h3>
            <ul>
              <li *ngFor="let item of userData.data">{{ item }}</li>
            </ul>
          </div>
        </div>

        <div class="card" *ngIf="!loading && !error && userProfile">
          <h2>Profile Information</h2>
          <div class="profile-info">
            <img [src]="userProfile.picture" [alt]="userProfile.name" class="profile-large">
            <p><strong>Email:</strong> {{ userProfile.email }}</p>
            <p><strong>Name:</strong> {{ userProfile.name }}</p>
            <p><strong>Role:</strong> {{ userProfile.role }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      min-height: 100vh;
      background-color: #f5f5f5;
    }

    .header {
      background: white;
      padding: 1.5rem 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header h1 {
      margin: 0;
      color: #333;
    }

    .user-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .profile-pic {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid #667eea;
    }

    .user-name {
      font-weight: 500;
      color: #333;
    }

    .btn-logout {
      padding: 0.5rem 1rem;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-logout:hover {
      background: #c82333;
    }

    .content {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      gap: 1.5rem;
    }

    .card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .card h2 {
      margin-top: 0;
      color: #333;
    }

    .card h3 {
      color: #555;
      margin-top: 1.5rem;
    }

    .user-info p,
    .profile-info p {
      margin: 0.5rem 0;
      color: #666;
    }

    .data-section ul {
      list-style: none;
      padding: 0;
    }

    .data-section li {
      padding: 0.75rem;
      background: #f8f9fa;
      margin: 0.5rem 0;
      border-radius: 4px;
      border-left: 3px solid #667eea;
    }

    .error-message {
      color: #dc3545;
    }

    .btn-retry {
      padding: 0.5rem 1rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 1rem;
    }

    .btn-retry:hover {
      background: #5568d3;
    }

    .profile-large {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      margin-bottom: 1rem;
    }

    .profile-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
  `]
})
export class DashboardComponent implements OnInit {
  user: UserInfo | null = null;
  userData: UserData | null = null;
  userProfile: UserProfile | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    // Subscribe to user observable
    this.authService.user$.subscribe(user => {
      this.user = user;
    });

    // Load data from API
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    // Fetch user data
    this.apiService.getUserData().subscribe({
      next: (data) => {
        this.userData = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load user data. Please try again.';
        this.loading = false;
        console.error('Error fetching user data:', err);
      }
    });

    // Fetch user profile
    this.apiService.getUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
      },
      error: (err) => {
        console.error('Error fetching user profile:', err);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}