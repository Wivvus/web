import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface UserData {
  message: string;
  user: {
    email: string;
    name: string;
    id: string;
  };
  data: string[];
}

export interface UserProfile {
  email: string;
  name: string;
  picture: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get user-specific data
   */
  getUserData(): Observable<UserData> {
    return this.http.get<UserData>(`${this.apiUrl}/api/user/data`);
  }

  /**
   * Get user profile
   */
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/api/user/profile`);
  }

  /**
   * Health check (public endpoint - no auth required)
   */
  healthCheck(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.apiUrl}/health`);
  }
}