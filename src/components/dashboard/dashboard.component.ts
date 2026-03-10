import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, UserInfo } from '../../services/authentication/auth.service';
import { ApiService, UserData, UserProfile } from '../../services/api/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./dashboard.template.html",
  styleUrl: "./dashboard.style.less"
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