import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api/api.service';
import { AuthService } from '../../../services/authentication/auth.service';
import { Event } from '../../../models/event.model';
import { MapComponent, LatLng } from '../../map/map.component';

@Component({
  selector: 'event-detail',
  standalone: true,
  imports: [CommonModule, MapComponent],
  templateUrl: './eventDetail.template.html',
  styleUrl: './eventDetail.style.less'
})
export class EventDetailComponent implements OnInit {
  event?: Event;
  attendees: { name: string, avatar_url: string }[] = [];
  isAttending: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private title: Title
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const autoAttend = this.route.snapshot.queryParamMap.get('attend') === 'true';

    this.apiService.getEvent(id).subscribe({
      next: event => {
        this.event = event;
        this.title.setTitle(event.name);
        if (this.isLoggedIn) {
          this.loadAttendees(id, autoAttend);
        }
      },
      error: () => this.router.navigate(['/'])
    });
  }

  private loadAttendees(id: number, autoAttend = false): void {
    this.apiService.getAttendees(id).subscribe({
      next: res => {
        this.attendees = res.attendees;
        this.isAttending = res.is_attending;
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
    const returnUrl = `/events/${this.event!.id}?attend=true`;
    this.router.navigate(['/login'], {
      queryParams: { returnUrl, message: 'Login to join a run' }
    });
  }

  onAttend(): void {
    if (!this.event) return;
    this.apiService.attend(this.event.id).subscribe({
      next: () => this.loadAttendees(this.event!.id)
    });
  }

  onDrop(): void {
    if (!this.event) return;
    this.apiService.dropAttendance(this.event.id).subscribe({
      next: () => this.loadAttendees(this.event!.id)
    });
  }

  onEdit(): void {
    this.router.navigate(['/events', this.event!.id, 'edit']);
  }

  onDelete(): void {
    if (!this.event) return;
    this.apiService.deleteEvent(this.event.id).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {}
    });
  }

  trackByName(_: number, a: { name: string }): string {
    return a.name;
  }

goBack(): void {
    this.router.navigate(['/']);
  }
}
