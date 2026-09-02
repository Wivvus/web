import { Component, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/authentication/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  host: { ngSkipHydration: 'true' },
  imports: [CommonModule],
  templateUrl: './header.template.html',
  styleUrl: './header.style.less'
})
export class HeaderComponent {
  @Input() showBack = false;
  @Input() onBack?: () => void;

  dropdownOpen = false;

  constructor(private authService: AuthService, private router: Router) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('.profile-menu')) {
      this.dropdownOpen = false;
    }
  }

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  get userPicture(): string {
    return this.authService.getUser()?.picture || '';
  }

  get userInitial(): string {
    return this.authService.getUser()?.name?.charAt(0)?.toUpperCase() || '?';
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  handleBack(): void {
    if (this.onBack) {
      this.onBack();
    } else {
      this.router.navigate(['/']);
    }
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  goToAccount(): void {
    this.dropdownOpen = false;
    this.router.navigate(['/account']);
  }

  logout(): void {
    this.dropdownOpen = false;
    this.authService.logout();
  }
}
