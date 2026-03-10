import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/authentication/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./login.template.html",
  styleUrl: "./login.style.less"
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('googleButton', { static: true }) googleButton!: ElementRef;

  message: string | null = null;

  constructor(
    private authService: AuthService,
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
}