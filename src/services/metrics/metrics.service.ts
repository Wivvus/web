import { Injectable } from '@angular/core';
import posthog from 'posthog-js';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class MetricsService {

  init(): void {
    if (!environment.posthogKey) return;
    posthog.init(environment.posthogKey, {
      api_host: environment.posthogHost,
      capture_pageview: false,
      capture_pageleave: true,
    });
  }

  identify(userId: string, properties: { email?: string; name?: string }): void {
    posthog.identify(userId, properties);
  }

  reset(): void {
    posthog.reset();
  }

  pageViewed(path: string): void {
    posthog.capture('$pageview', { path });
  }

  notFoundHit(path: string): void {
    posthog.capture('404_hit', { path });
  }

  // Auth
  loginCompleted(method: 'google' | 'email'): void {
    posthog.capture('login_completed', { method });
  }

  signupCompleted(method: 'google' | 'email'): void {
    posthog.capture('signup_completed', { method });
  }

  passwordResetRequested(): void {
    posthog.capture('password_reset_requested');
  }

  accountDeleted(): void {
    posthog.capture('account_deleted');
  }

  // Events
  eventViewed(eventId: number, eventName: string): void {
    posthog.capture('event_viewed', { event_id: eventId, event_name: eventName });
  }

  eventCreated(eventId: number): void {
    posthog.capture('event_created', { event_id: eventId });
  }

  eventAttended(eventId: number): void {
    posthog.capture('event_attended', { event_id: eventId });
  }

  eventDropped(eventId: number): void {
    posthog.capture('event_dropped', { event_id: eventId });
  }

  eventEdited(eventId: number): void {
    posthog.capture('event_edited', { event_id: eventId });
  }

  eventDeleted(eventId: number): void {
    posthog.capture('event_deleted', { event_id: eventId });
  }

  // Discovery
  filterUsed(filters: Record<string, any>): void {
    posthog.capture('filter_used', { filters });
  }

  viewSwitched(view: 'list' | 'map'): void {
    posthog.capture('view_switched', { view });
  }

  // Abandonment
  createEventAbandoned(properties: { filled_name: boolean; filled_location: boolean; filled_time: boolean }): void {
    posthog.capture('create_event_abandoned', properties);
  }

  registerAbandoned(properties: { filled_email: boolean }): void {
    posthog.capture('register_abandoned', properties);
  }

  // API performance
  apiResponse(method: string, endpoint: string, status: number, durationMs: number): void {
    posthog.capture('api_response', { method, endpoint, status, duration_ms: durationMs });
  }
}
