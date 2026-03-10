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

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // If already authenticated, redirect to dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  ngAfterViewInit(): void {
    // Initialize Google Sign-In button after view is ready
    this.authService.initializeGoogleSignIn(this.googleButton.nativeElement);
  }
}