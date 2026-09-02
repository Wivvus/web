import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import posthog from 'posthog-js';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class MetricsService {
  private platformId = inject(PLATFORM_ID);
  private get ok(): boolean { return isPlatformBrowser(this.platformId); }

  init(): void {
    if (!this.ok || !environment.posthogKey) return;
    posthog.init(environment.posthogKey, {
      api_host: environment.posthogHost,
      capture_pageview: false,
      capture_pageleave: true,
    });
  }

  identify(userId: string, properties: { email?: string; name?: string }): void {
    if (this.ok) posthog.identify(userId, properties);
  }

  reset(): void {
    if (this.ok) posthog.reset();
  }

  pageViewed(path: string): void {
    if (this.ok) posthog.capture('$pageview', { path });
  }

  notFoundHit(path: string): void {
    if (this.ok) posthog.capture('404_hit', { path });
  }

  // Auth
  loginCompleted(method: 'google' | 'email'): void {
    if (this.ok) posthog.capture('login_completed', { method });
  }

  signupCompleted(method: 'google' | 'email'): void {
    if (this.ok) posthog.capture('signup_completed', { method });
  }

  passwordResetRequested(): void {
    if (this.ok) posthog.capture('password_reset_requested');
  }

  accountDeleted(): void {
    if (this.ok) posthog.capture('account_deleted');
  }

  // Events
  eventViewed(eventId: number, eventName: string): void {
    if (this.ok) posthog.capture('event_viewed', { event_id: eventId, event_name: eventName });
  }

  eventCreated(eventId: number): void {
    if (this.ok) posthog.capture('event_created', { event_id: eventId });
  }

  eventAttended(eventId: number): void {
    if (this.ok) posthog.capture('event_attended', { event_id: eventId });
  }

  eventDropped(eventId: number): void {
    if (this.ok) posthog.capture('event_dropped', { event_id: eventId });
  }

  eventEdited(eventId: number): void {
    if (this.ok) posthog.capture('event_edited', { event_id: eventId });
  }

  eventDeleted(eventId: number): void {
    if (this.ok) posthog.capture('event_deleted', { event_id: eventId });
  }

  // Discovery
  filterUsed(filters: Record<string, any>): void {
    if (this.ok) posthog.capture('filter_used', { filters });
  }

  viewSwitched(view: 'list' | 'map'): void {
    if (this.ok) posthog.capture('view_switched', { view });
  }

  // Abandonment
  createEventAbandoned(properties: { filled_name: boolean; filled_location: boolean; filled_time: boolean }): void {
    if (this.ok) posthog.capture('create_event_abandoned', properties);
  }

  registerAbandoned(properties: { filled_email: boolean }): void {
    if (this.ok) posthog.capture('register_abandoned', properties);
  }

  // API performance
  apiResponse(method: string, endpoint: string, status: number, durationMs: number): void {
    if (this.ok) posthog.capture('api_response', { method, endpoint, status, duration_ms: durationMs });
  }
}
