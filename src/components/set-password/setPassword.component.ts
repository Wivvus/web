import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/authentication/auth.service';

@Component({
  selector: 'app-set-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setPassword.template.html',
  styleUrl: './setPassword.style.less'
})
export class SetPasswordComponent implements OnInit {
  token = '';
  password = '';
  confirm = '';
  error: string | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    if (this.password !== this.confirm) {
      this.error = 'Passwords do not match';
      return;
    }
    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters';
      return;
    }

    this.error = null;
    this.loading = true;

    this.authService.setPassword(this.token, this.password).subscribe({
      next: (res: any) => {
        this.authService.handleLocalAuthResponse(res.token, res.user);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error = err.error?.error || 'Invalid or expired link. Please register again.';
        this.loading = false;
      }
    });
  }
}
