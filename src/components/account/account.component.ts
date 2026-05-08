import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { Router } from '@angular/router';
import { AuthService } from '../../services/authentication/auth.service';
import { ApiService } from '../../services/api/api.service';
import { MetricsService } from '../../services/metrics/metrics.service';
import { Event as RunEvent } from '../../models/event.model';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './account.template.html',
  styleUrl: './account.style.less'
})
export class AccountComponent implements OnInit {
  activeSection: 'settings' | 'events' = 'settings';

  // Settings
  name: string = '';
  email: string = '';
  avatarUrl: string = '';
  isLocalAuth = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordError: string | null = null;
  passwordSuccess = false;
  passwordLoading = false;
  avatarLoading = false;
  avatarError: string | null = null;

  // Events
  userEvents: RunEvent[] = [];
  eventsLoading = false;
  expandedEventIds = new Set<number>();
  eventAttendees: Record<number, { name: string; avatar_url: string }[]> = {};
  attendeesLoading = new Set<number>();

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private metrics: MetricsService
  ) {}

  ngOnInit(): void {
    this.isLocalAuth = this.authService.getProvider() === 'local';
    this.apiService.getUserProfile().subscribe({
      next: profile => {
        this.name = profile.name;
        this.email = profile.email;
        this.avatarUrl = this.authService.getUser()?.picture || '';
      }
    });
  }

  switchSection(section: 'settings' | 'events'): void {
    this.activeSection = section;
    if (section === 'events' && this.userEvents.length === 0 && !this.eventsLoading) {
      this.loadUserEvents();
    }
  }

  private loadUserEvents(): void {
    this.eventsLoading = true;
    this.apiService.getUserEvents().subscribe({
      next: events => {
        this.userEvents = events;
        this.eventsLoading = false;
      },
      error: () => { this.eventsLoading = false; }
    });
  }

  toggleExpand(event: RunEvent): void {
    if (this.expandedEventIds.has(event.id)) {
      this.expandedEventIds.delete(event.id);
    } else {
      this.expandedEventIds.add(event.id);
      if (!this.eventAttendees[event.id]) {
        this.attendeesLoading.add(event.id);
        this.apiService.getAttendees(event.id).subscribe({
          next: res => {
            this.eventAttendees[event.id] = res.attendees;
            this.attendeesLoading.delete(event.id);
          },
          error: () => this.attendeesLoading.delete(event.id)
        });
      }
    }
  }

  isExpanded(event: RunEvent): boolean {
    return this.expandedEventIds.has(event.id);
  }

  isAttendeeLoading(event: RunEvent): boolean {
    return this.attendeesLoading.has(event.id);
  }

  isInFuture(event: RunEvent): boolean {
    return new Date(event.start_time) > new Date();
  }

  viewEvent(event: RunEvent): void {
    this.router.navigate(['/run', event.id]);
  }

  editEvent(event: RunEvent): void {
    this.router.navigate(['/run', event.id, 'edit']);
  }

  deleteUserEvent(event: RunEvent): void {
    if (!confirm(`Delete "${event.name}"? This cannot be undone.`)) return;
    this.apiService.deleteEvent(event.id).subscribe({
      next: () => {
        this.userEvents = this.userEvents.filter(e => e.id !== event.id);
        this.metrics.eventDeleted(event.id);
      },
      error: () => alert('Failed to delete event. Please try again.')
    });
  }

  changePassword(): void {
    this.passwordError = null;
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Passwords do not match';
      return;
    }
    if (this.newPassword.length < 8) {
      this.passwordError = 'Password must be at least 8 characters';
      return;
    }
    this.passwordLoading = true;
    this.apiService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.passwordSuccess = true;
        this.passwordLoading = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.passwordError = err.error?.error || 'Failed to update password';
        this.passwordLoading = false;
      }
    });
  }

  onAvatarSelected(event: globalThis.Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.avatarError = null;
    this.avatarLoading = true;
    this.apiService.uploadAvatar(file).subscribe({
      next: res => {
        this.avatarUrl = res.avatar_url;
        const user = this.authService.getUser();
        if (user) {
          user.picture = res.avatar_url;
          this.authService.setUser(user);
        }
        this.avatarLoading = false;
      },
      error: (err) => {
        this.avatarError = err.error?.error || 'Failed to upload avatar';
        this.avatarLoading = false;
      }
    });
  }

  deleteAccount(): void {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    this.apiService.deleteAccount().subscribe({
      next: () => {
        this.metrics.accountDeleted();
        this.authService.logout();
      },
      error: () => alert('Failed to delete account. Please try again.')
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
