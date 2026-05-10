import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api/api.service';
import { AuthService } from '../../../services/authentication/auth.service';
import { Event, EventOption, RatingInfo, RatingInfoWithEvent } from '../../../models/event.model';
import { MapComponent, LatLng } from '../../map/map.component';
import { HeaderComponent } from '../../header/header.component';
import { MetricsService } from '../../../services/metrics/metrics.service';

@Component({
  selector: 'event-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MapComponent, HeaderComponent],
  templateUrl: './eventDetail.template.html',
  styleUrl: './eventDetail.style.less'
})
export class EventDetailComponent implements OnInit {
  event?: Event;
  attendees: { name: string, avatar_url: string, option_text?: string }[] = [];
  isAttending: boolean = false;
  myOptionId: number | null = null;
  ratings: RatingInfo[] = [];
  ratingsAverage: number | null = null;
  creatorRatings: RatingInfoWithEvent[] = [];
  creatorRatingsAverage: number | null = null;
  showCreatorRatings: boolean = false;
  creatorRatingsLoaded: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private title: Title,
    private metrics: MetricsService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const autoAttend = this.route.snapshot.queryParamMap.get('attend') === 'true';

    this.apiService.getEvent(id).subscribe({
      next: event => {
        this.event = event;
        this.title.setTitle(event.name);
        this.metrics.eventViewed(event.id, event.name);
        this.loadRatings(id);
        if (this.isLoggedIn) {
          this.loadAttendees(id, autoAttend);
        }
      },
      error: () => this.router.navigate(['/'])
    });
  }

  toggleCreatorRatings(): void {
    this.showCreatorRatings = !this.showCreatorRatings;
    if (this.showCreatorRatings && !this.creatorRatingsLoaded && this.event) {
      this.apiService.getCreatorRatings(this.event.creator_id).subscribe({
        next: res => {
          this.creatorRatings = res.ratings;
          this.creatorRatingsAverage = res.average;
          this.creatorRatingsLoaded = true;
        }
      });
    }
  }

  private loadRatings(id: number): void {
    this.apiService.getRatings(id).subscribe({
      next: res => {
        this.ratings = res.ratings;
        this.ratingsAverage = res.average;
      }
    });
  }

  get isInPast(): boolean {
    return !!this.event && new Date(this.event.start_time) < new Date();
  }

  get canRate(): boolean {
    return this.isInPast && this.isAttending && !this.isOwner;
  }

  goToReview(): void {
    this.router.navigate(['/run', this.event!.id, 'review']);
  }

  private loadAttendees(id: number, autoAttend = false): void {
    this.apiService.getAttendees(id).subscribe({
      next: res => {
        this.attendees = res.attendees;
        this.isAttending = res.is_attending;
        this.myOptionId = res.my_option_id;
        if (this.event) this.event.attendee_count = res.attendees.length;
        if (autoAttend && !res.is_attending) {
          this.apiService.attend(id).subscribe({
            next: () => this.loadAttendees(id)
          });
        }
      }
    });
  }

  get pin(): LatLng | undefined {
    if (this.event?.location?.lat && this.event?.location?.long) {
      return { lat: this.event.location.lat, lng: this.event.location.long };
    }
    return undefined;
  }

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  get isOwner(): boolean {
    const user = this.authService.getUser();
    return !!user && !!this.event && !!user.db_id && this.event.creator_id === user.db_id;
  }

  joinRun(): void {
    const returnUrl = `/run/${this.event!.id}?attend=true`;
    this.router.navigate(['/login'], {
      queryParams: { returnUrl, message: 'Login to join a run' }
    });
  }

  onAttend(optionId?: number | null): void {
    if (!this.event) return;
    this.apiService.attend(this.event.id, optionId).subscribe({
      next: () => {
        this.metrics.eventAttended(this.event!.id);
        this.loadAttendees(this.event!.id);
      }
    });
  }

  selectOption(option: EventOption): void {
    if (!this.event) return;
    if (this.isAttending && this.myOptionId === option.id) return;
    this.onAttend(option.id);
  }

  get googleCalendarUrl(): string | null {
    if (!this.event?.start_time) return null;
    const start = new Date(this.event.start_time);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const location = this.event.location?.lat && this.event.location?.long
      ? `${this.event.location.lat},${this.event.location.long}` : '';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `wivvus.com - ${this.event.name}`,
      dates: `${fmt(start)}/${fmt(end)}`,
      details: `https://wivvus.com/run/${this.event.id}`,
      location
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  downloadIcs(): void {
    if (!this.event?.start_time) return;
    const start = new Date(this.event.start_time);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const location = this.event.location?.lat && this.event.location?.long
      ? `${this.event.location.lat},${this.event.location.long}` : '';
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Wivvus//Wivvus//EN',
      'BEGIN:VEVENT',
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:wivvus.com - ${this.event.name}`,
      `DESCRIPTION:https://wivvus.com/run/${this.event.id}`,
      location ? `LOCATION:${location}` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean);
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.event.name.replace(/[^a-z0-9]/gi, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onDrop(): void {
    if (!this.event) return;
    this.apiService.dropAttendance(this.event.id).subscribe({
      next: () => {
        this.metrics.eventDropped(this.event!.id);
        this.loadAttendees(this.event!.id);
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/run', this.event!.id, 'edit']);
  }

  onDelete(): void {
    if (!this.event) return;
    if (!confirm(`Delete "${this.event.name}"? This cannot be undone.`)) return;
    this.apiService.deleteEvent(this.event.id).subscribe({
      next: () => {
        this.metrics.eventDeleted(this.event!.id);
        this.router.navigate(['/']);
      },
      error: () => {}
    });
  }

  get shareUrl(): string {
    return `https://run.wivvus.com/${this.event?.id}`;
  }

  get shareText(): string {
    const date = this.event?.start_time
      ? new Date(this.event.start_time).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      : '';
    return `Run with us at ${this.event?.name} on ${date}, more info here: ${this.shareUrl}`;
  }

  shareTelegram(): void {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(this.shareUrl)}&text=${encodeURIComponent(this.shareText)}`, '_blank');
  }

  shareWhatsApp(): void {
    window.open(`https://wa.me/?text=${encodeURIComponent(this.shareText)}`, '_blank');
  }

  shareSignal(): void {
    if (navigator.share) {
      navigator.share({ title: this.event?.name, text: this.shareText, url: this.shareUrl });
    } else {
      this.copyLink();
    }
  }

  linkCopied = false;

  copyLink(): void {
    navigator.clipboard.writeText(this.shareUrl).then(() => {
      this.linkCopied = true;
      setTimeout(() => this.linkCopied = false, 2000);
    });
  }

  trackByName(_: number, a: { name: string }): string {
    return a.name;
  }

  get attendeeGroups(): { label: string, attendees: { name: string, avatar_url: string, option_text?: string }[] }[] {
    if (!this.event?.options?.length) return [];
    const map = new Map<string, { name: string, avatar_url: string, option_text?: string }[]>();
    for (const opt of this.event.options) {
      map.set(opt.text, []);
    }
    for (const a of this.attendees) {
      const key = a.option_text ?? this.event.options[0].text;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return Array.from(map.entries()).map(([label, attendees]) => ({ label, attendees }));
  }

goBack(): void {
    this.router.navigate(['/']);
  }
}
