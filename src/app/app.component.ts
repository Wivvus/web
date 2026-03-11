import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../services/authentication/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent {
  title = 'my-app';

  constructor(private authService: AuthService, private router: Router) {}

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  get isLoginPage(): boolean {
    return this.router.url.startsWith('/login');
  }

  goToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  logout(): void {
    const url = this.router.url;
    const isProtected = url.startsWith('/dashboard') ||
                        url.startsWith('/events/create') ||
                        /\/events\/\d+\/edit/.test(url);
    this.authService.logout(isProtected ? '/' : url);
  }

}