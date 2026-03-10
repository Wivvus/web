import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Event } from '../../models/event.model';
export interface UserData {
  message: string;
  user: {
    Email: string;
    Name: string;
    ID: string;
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

  createEvent(event: Event): Observable<any> {
      return this.http.post(`${this.apiUrl}/event`, event)
  }

  getEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/events`)
  }

  /**
   * Get user-specific data
   */
  getUserData(): Observable<UserData> {
    return this.http.get<UserData>(`${this.apiUrl}/user/data`);
  }

  /**
   * Get user profile
   */
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/user/profile`);
  }

  /**
   * Health check (public endpoint - no auth required)
   */
  healthCheck(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.apiUrl}/health`);
  }
}