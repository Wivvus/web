import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/authentication/auth.service';
import { MetricsService } from '../../services/metrics/metrics.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.template.html',
  styleUrl: './register.style.less'
})
export class RegisterComponent implements OnDestroy {
  email = '';
  name = '';
  error: string | null = null;
  submitted = false;
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private metrics: MetricsService
  ) {}

  ngOnDestroy(): void {
    if (!this.submitted && this.email.length > 0) {
      this.metrics.registerAbandoned({ filled_email: true });
    }
  }

  onSubmit(): void {
    this.error = null;
    this.loading = true;
    this.authService.registerWithEmail(this.email, this.name).subscribe({
      next: () => {
        this.submitted = true;
        this.loading = false;
        this.metrics.signupCompleted('email');
      },
      error: (err) => {
        this.error = err.error?.error || 'Something went wrong. Please try again.';
        this.loading = false;
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
