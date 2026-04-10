import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/authentication/auth.service';
import { ApiService } from '../../services/api/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./login.template.html",
  styleUrl: "./login.style.less"
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('googleButton', { static: true }) googleButton!: ElementRef;

  message: string | null = null;
  emailLogin = false;
  email = '';
  password = '';
  loginError: string | null = null;
  loading = false;
  forgotMode = false;
  forgotEmail = '';
  forgotSent = false;
  forgotError: string | null = null;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
    this.message = this.route.snapshot.queryParamMap.get('message');
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) {
      this.authService.redirectAfterLogin = returnUrl;
    }
  }

  ngAfterViewInit(): void {
    this.authService.initializeGoogleSignIn(this.googleButton.nativeElement);
  }

  submitEmailLogin(): void {
    this.loginError = null;
    this.loading = true;
    this.authService.loginWithEmail(this.email, this.password).subscribe({
      next: (res: any) => {
        this.authService.handleLocalAuthResponse(res.token, res.user);
        this.router.navigateByUrl(this.authService.redirectAfterLogin);
        this.authService.redirectAfterLogin = '/';
      },
      error: (err) => {
        this.loginError = err.error?.error || 'Invalid email or password';
        this.loading = false;
      }
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  submitForgotPassword(): void {
    this.forgotError = null;
    this.loading = true;
    this.apiService.forgotPassword(this.forgotEmail).subscribe({
      next: () => { this.forgotSent = true; this.loading = false; },
      error: () => { this.forgotSent = true; this.loading = false; }
    });
  }
}