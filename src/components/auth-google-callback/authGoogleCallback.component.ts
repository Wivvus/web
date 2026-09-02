import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/authentication/auth.service';

@Component({
  selector: 'app-auth-google-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;color:#555;">
      <p>{{ message }}</p>
    </div>
  `
})
export class AuthGoogleCallbackComponent implements OnInit {
  message = 'Signing in…';
  private platformId = inject(PLATFORM_ID);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const code = this.route.snapshot.queryParamMap.get('code');
    const error = this.route.snapshot.queryParamMap.get('error');

    if (error || !code) {
      this.router.navigate(['/login']);
      return;
    }

    const redirectUri = `${window.location.origin}/auth/google/callback`;
    this.authService.loginWithGoogleCode(code, redirectUri).subscribe({
      next: (res: any) => {
        this.authService.handleGoogleAuthResponse(res.token, res.user);
        this.router.navigateByUrl(this.authService.redirectAfterLogin);
        this.authService.redirectAfterLogin = '/';
      },
      error: (err) => {
        const detail = err?.error?.error || err?.message || err?.status || 'unknown';
        this.message = `Sign-in failed (${detail}). Redirecting…`;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      }
    });
  }
}
