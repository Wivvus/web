import { Injectable, NgZone, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { MetricsService } from '../metrics/metrics.service';

// Declare Google Identity Services global variable
declare const google: any;

export interface UserInfo {
  email: string;
  name: string;
  picture: string;
  sub: string;
  db_id?: number;
  provider?: 'google' | 'local';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private tokenSubject!: BehaviorSubject<string | null>;
  private userSubject!: BehaviorSubject<UserInfo | null>;

  public redirectAfterLogin: string = '/';

  public token$!: Observable<string | null>;
  public user$!: Observable<UserInfo | null>;

  private http: HttpClient;

  constructor(private router: Router, httpBackend: HttpBackend, private ngZone: NgZone, private metrics: MetricsService) {
    this.http = new HttpClient(httpBackend);
    const isBrowser = isPlatformBrowser(this.platformId);
    this.tokenSubject = new BehaviorSubject<string | null>(isBrowser ? this.getStoredToken() : null);
    this.userSubject = new BehaviorSubject<UserInfo | null>(isBrowser ? this.getStoredUser() : null);
    this.token$ = this.tokenSubject.asObservable();
    this.user$ = this.userSubject.asObservable();
  }

  /**
   * Build the Google OAuth2 redirect URL (authorization code flow).
   * Works in all browsers including Telegram's in-app WebView.
   */
  public getGoogleOAuthUrl(): string {
    const origin = isPlatformBrowser(this.platformId) ? window.location.origin : environment.apiUrl;
    const redirectUri = `${origin}/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: environment.googleClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  public loginWithGoogleCode(code: string, redirectUri: string): Observable<any> {
    return this.http.post<{ token: string, user: { id: number, name: string, email: string, avatar_url: string } }>(
      `${environment.apiUrl}/auth/google/code`,
      { code, redirect_uri: redirectUri }
    );
  }

  public handleGoogleAuthResponse(token: string, user: { id: number, name: string, email: string, avatar_url: string }): void {
    this.handleLocalAuthResponse(token, user);
    this.setProvider('google');
  }

  /**
   * Initialize and render Google Sign-In button
   */
  public initializeGoogleSignIn(element: HTMLElement): void {
    if (typeof google === 'undefined') {
      console.error('Google Identity Services library not loaded');
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: this.handleCredentialResponse.bind(this),
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    google.accounts.id.renderButton(
      element,
      {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 250,
      }
    );
  }

  /**
   * Handle the credential response from Google
   */
  private handleCredentialResponse(response: any): void {
    const googleIdToken = response.credential;

    this.http.post<{ token: string, user: { id: number, name: string, email: string, avatar_url: string } }>(
      `${environment.apiUrl}/auth/google`, { id_token: googleIdToken }
    ).subscribe({
      next: res => {
        this.handleLocalAuthResponse(res.token, res.user);
        this.setProvider('google');
        this.ngZone.run(() => {
          this.router.navigateByUrl(this.redirectAfterLogin);
          this.redirectAfterLogin = '/';
        });
      },
      error: () => {}
    });
  }

  /**
   * Decode JWT token (client-side only - validation happens on backend)
   */
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return {};
    }
  }

  private setToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) localStorage.setItem('id_token', token);
    this.tokenSubject.next(token);
  }

  public setUser(user: UserInfo): void {
    if (isPlatformBrowser(this.platformId)) localStorage.setItem('user_info', JSON.stringify(user));
    this.userSubject.next(user);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('id_token');
  }

  private getStoredUser(): UserInfo | null {
    const userStr = localStorage.getItem('user_info');
    return userStr ? JSON.parse(userStr) : null;
  }

  public getToken(): string | null {
    return this.tokenSubject.value;
  }

  public getUser(): UserInfo | null {
    return this.userSubject.value;
  }

  public isAuthenticated(): boolean {
    const token = this.tokenSubject.value;
    if (!token) return false;
    try {
      const payload = this.decodeJWT(token);
      const expired = payload.exp && payload.exp < Math.floor(Date.now() / 1000);
      if (expired) {
        this.logout();
        return false;
      }
    } catch {
      return false;
    }
    return true;
  }

  public registerWithEmail(email: string, name: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/register`, { email, name });
  }

  public setPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/set-password`, { token, password });
  }

  public loginWithEmail(email: string, password: string): Observable<any> {
    return this.http.post<{ token: string, user: { id: number, name: string, email: string, avatar_url: string } }>(
      `${environment.apiUrl}/auth/login`, { email, password }
    );
  }

  public handleLocalAuthResponse(token: string, user: { id: number, name: string, email: string, avatar_url: string }): void {
    const userInfo: UserInfo = {
      email: user.email,
      name: user.name,
      picture: user.avatar_url || '',
      sub: String(user.id),
      db_id: user.id,
      provider: 'local'
    };
    this.setToken(token);
    this.setProvider('local');
    this.setUser(userInfo);
    this.metrics.identify(String(user.id), { email: user.email, name: user.name });
    this.metrics.loginCompleted('email');
  }

  public getProvider(): string {
    if (!isPlatformBrowser(this.platformId)) return 'google';
    return localStorage.getItem('auth_provider') || 'google';
  }

  private setProvider(provider: string): void {
    if (isPlatformBrowser(this.platformId)) localStorage.setItem('auth_provider', provider);
  }

  public logout(returnUrl: string = '/'): void {
    this.metrics.reset();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('id_token');
      localStorage.removeItem('user_info');
      localStorage.removeItem('auth_provider');
    }
    this.tokenSubject.next(null);
    this.userSubject.next(null);

    if (typeof google !== 'undefined') {
      google.accounts.id.disableAutoSelect();
    }

    this.router.navigateByUrl(returnUrl);
  }
}
