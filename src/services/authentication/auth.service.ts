import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
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
  db_id?: number;
  provider?: 'google' | 'local';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(this.getStoredToken());
  private userSubject = new BehaviorSubject<UserInfo | null>(this.getStoredUser());

  public redirectAfterLogin: string = '/';

  public token$: Observable<string | null> = this.tokenSubject.asObservable();
  public user$: Observable<UserInfo | null> = this.userSubject.asObservable();

  private http: HttpClient;

  constructor(private router: Router, httpBackend: HttpBackend, private ngZone: NgZone) {
    this.http = new HttpClient(httpBackend);

    const user = this.getUser();
    const token = this.getToken();
    if (user && !user.db_id && token) {
      this.fetchDbId(token, user);
    }
  }

  private fetchDbId(token: string, user: UserInfo): void {
    this.http.get<{ user: { id: number } }>(`${environment.apiUrl}/user/data`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: res => {
        user.db_id = res.user.id;
        this.setUser(user);
      },
      error: () => {}
    });
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

    this.setToken(idToken);

    this.http.get<{ user: { id: number } }>(`${environment.apiUrl}/user/data`, {
      headers: { Authorization: `Bearer ${idToken}` }
    }).subscribe({
      next: res => {
        userInfo.db_id = res.user.id;
        this.setUser(userInfo);
        this.ngZone.run(() => {
          this.router.navigateByUrl(this.redirectAfterLogin);
          this.redirectAfterLogin = '/';
        });
      },
      error: () => {
        this.setUser(userInfo);
        this.ngZone.run(() => {
          this.router.navigateByUrl(this.redirectAfterLogin);
          this.redirectAfterLogin = '/';
        });
      }
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

  /**
   * Logout user
   */
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
  }

  public getProvider(): string {
    return sessionStorage.getItem('auth_provider') || 'google';
  }

  private setProvider(provider: string): void {
    sessionStorage.setItem('auth_provider', provider);
  }

  public logout(returnUrl: string = '/'): void {
    sessionStorage.removeItem('id_token');
    sessionStorage.removeItem('user_info');
    sessionStorage.removeItem('auth_provider');
    this.tokenSubject.next(null);
    this.userSubject.next(null);

    if (typeof google !== 'undefined') {
      google.accounts.id.disableAutoSelect();
    }

    this.router.navigateByUrl(returnUrl);
  }
}