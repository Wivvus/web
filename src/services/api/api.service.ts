import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Event, EventFilters, RatingInfo } from '../../models/event.model';
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

  getEvents(
    bbox?: { latMin: number, latMax: number, lngMin: number, lngMax: number },
    filters?: EventFilters
  ): Observable<Event[]> {
    const parts: string[] = [];
    if (bbox) {
      parts.push(`lat_min=${bbox.latMin}&lat_max=${bbox.latMax}&lng_min=${bbox.lngMin}&lng_max=${bbox.lngMax}`);
    }
    if (filters?.minPace) parts.push(`min_pace=${filters.minPace}`);
    if (filters?.maxPace) parts.push(`max_pace=${filters.maxPace}`);
    if (filters?.minLength) parts.push(`min_length=${filters.minLength}`);
    if (filters?.maxLength) parts.push(`max_length=${filters.maxLength}`);
    if (filters?.dateFrom) parts.push(`date_from=${filters.dateFrom}`);
    const qs = parts.length ? `?${parts.join('&')}` : '';
    return this.http.get<Event[]>(`${this.apiUrl}/events${qs}`);
  }

  getEvent(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/event/${id}`);
  }

  updateEvent(id: number, event: Event): Observable<Event> {
    return this.http.put<Event>(`${this.apiUrl}/event/${id}`, event);
  }

  deleteEvent(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/event/${id}`);
  }

  deleteAccount(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/user`);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/change-password`, { current_password: currentPassword, new_password: newPassword });
  }

  uploadAvatar(file: File): Observable<{ avatar_url: string }> {
    const form = new FormData();
    form.append('avatar', file);
    return this.http.post<{ avatar_url: string }>(`${this.apiUrl}/user/avatar`, form);
  }

  getRatings(id: number): Observable<{ ratings: RatingInfo[], average: number | null }> {
    return this.http.get<any>(`${this.apiUrl}/event/${id}/ratings`);
  }

  rateEvent(id: number, score: number, comment: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/event/${id}/rate`, { score, comment });
  }

  getAttendees(id: number): Observable<{ attendees: { name: string, avatar_url: string }[], is_attending: boolean }> {
    return this.http.get<any>(`${this.apiUrl}/event/${id}/attendees`);
  }

  attend(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/event/${id}/attend`, {});
  }

  dropAttendance(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/event/${id}/attend`);
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

  getUserEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/user/events`);
  }

  /**
   * Health check (public endpoint - no auth required)
   */
  healthCheck(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.apiUrl}/health`);
  }
}