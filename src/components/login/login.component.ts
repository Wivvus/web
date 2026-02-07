import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/authentication/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>Welcome</h1>
        <p>Sign in to continue</p>
        
        <!-- Google Sign-In Button will be rendered here -->
        <div #googleButton class="google-button-container"></div>
        
        <p class="disclaimer">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .login-card {
      background: white;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 400px;
      width: 90%;
    }

    h1 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 2rem;
    }

    p {
      color: #666;
      margin-bottom: 2rem;
    }

    .google-button-container {
      display: flex;
      justify-content: center;
      margin: 2rem 0;
    }

    .disclaimer {
      font-size: 0.75rem;
      color: #999;
      margin-top: 2rem;
      margin-bottom: 0;
    }
  `]
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('googleButton', { static: true }) googleButton!: ElementRef;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // If already authenticated, redirect to dashboard
    if (this.authService.isAuthenticated()) {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      this.router.navigate([returnUrl]);
    }
  }

  ngAfterViewInit(): void {
    // Initialize Google Sign-In button after view is ready
    this.authService.initializeGoogleSignIn(this.googleButton.nativeElement);
  }
}