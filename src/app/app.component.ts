import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../services/authentication/auth.service';
import { MetricsService } from '../services/metrics/metrics.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent implements OnInit {
  title = 'my-app';

  constructor(
    private authService: AuthService,
    private router: Router,
    private metrics: MetricsService
  ) {}

  ngOnInit(): void {
    if (window.location.hostname === 'run.wivvus.com') {
      const id = window.location.pathname.replace(/^\//, '');
      window.location.replace(`https://wivvus.com/run/${id}`);
      return;
    }

    this.metrics.init();
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(e => {
      this.metrics.pageViewed((e as NavigationEnd).urlAfterRedirects);
    });
  }

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  get isLoginPage(): boolean {
    const url = this.router.url;
    return url.startsWith('/login') || url.startsWith('/register') || url.startsWith('/set-password');
  }

  goToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  logout(): void {
    const url = this.router.url;
    const isProtected = url.startsWith('/dashboard') ||
                        url.startsWith('/run/create') ||
                        /\/run\/\d+\/edit/.test(url);
    this.authService.logout(isProtected ? '/' : url);
  }

}