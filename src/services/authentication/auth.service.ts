import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

// Declare Google Identity Services global variable
declare const google: any;

export interface UserInfo {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(this.getStoredToken());
  private userSubject = new BehaviorSubject<UserInfo | null>(this.getStoredUser());

  public token$: Observable<string | null> = this.tokenSubject.asObservable();
  public user$: Observable<UserInfo | null> = this.userSubject.asObservable();

  constructor(private router: Router) {}

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

    // Optional: Show One Tap prompt
    // google.accounts.id.prompt();
  }

  /**
   * Handle the credential response from Google
   */
  private handleCredentialResponse(response: any): void {
    const idToken = response.credential;
    
    // Decode JWT to extract user info
    const payload = this.decodeJWT(idToken);
    const userInfo: UserInfo = {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      sub: payload.sub
    };

    // Store credentials
    this.setToken(idToken);
    this.setUser(userInfo);

    // Navigate to dashboard
    this.router.navigate(['/dashboard']);
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

  /**
   * Store token in session storage
   */
  private setToken(token: string): void {
    sessionStorage.setItem('id_token', token);
    this.tokenSubject.next(token);
  }

  /**
   * Store user info in session storage
   */
  private setUser(user: UserInfo): void {
    sessionStorage.setItem('user_info', JSON.stringify(user));
    this.userSubject.next(user);
  }

  /**
   * Get stored token
   */
  private getStoredToken(): string | null {
    return sessionStorage.getItem('id_token');
  }

  /**
   * Get stored user info
   */
  private getStoredUser(): UserInfo | null {
    const userStr = sessionStorage.getItem('user_info');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Get current token value
   */
  public getToken(): string | null {
    return this.tokenSubject.value;
  }

  /**
   * Get current user value
   */
  public getUser(): UserInfo | null {
    return this.userSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.tokenSubject.value !== null;
  }

  /**
   * Logout user
   */
  public logout(): void {
    sessionStorage.removeItem('id_token');
    sessionStorage.removeItem('user_info');
    this.tokenSubject.next(null);
    this.userSubject.next(null);
    
    if (typeof google !== 'undefined') {
      google.accounts.id.disableAutoSelect();
    }
    
    this.router.navigate(['/login']);
  }
}