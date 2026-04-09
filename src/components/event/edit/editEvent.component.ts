import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api/api.service';
import { Event } from '../../../models/event.model';
import { MapComponent, LatLng } from '../../map/map.component';

@Component({
  selector: 'edit-event',
  standalone: true,
  imports: [CommonModule, FormsModule, MapComponent],
  templateUrl: './editEvent.template.html',
  styleUrl: './editEvent.style.less'
})
export class EditEventComponent implements OnInit {
  event?: Event;
  startDate: string = "";
  startTime: string = "";
  error: string | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.apiService.getEvent(id).subscribe({
      next: event => {
        this.event = event;
        if (event.start_time) {
          const dt = new Date(event.start_time);
          this.startDate = dt.toISOString().slice(0, 10);
          this.startTime = dt.toISOString().slice(11, 16);
        }
      },
      error: () => this.router.navigate(['/'])
    });
  }

  get pin(): LatLng | undefined {
    if (this.event?.location?.lat && this.event?.location?.long) {
      return { lat: this.event.location.lat, lng: this.event.location.long };
    }
    return undefined;
  }

  onDateTimeChange(): void {
    if (this.event && this.startDate && this.startTime) {
      const offset = new Date().getTimezoneOffset();
      const sign = offset <= 0 ? '+' : '-';
      const h = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
      const m = String(Math.abs(offset) % 60).padStart(2, '0');
      this.event.start_time = `${this.startDate}T${this.startTime}:00${sign}${h}:${m}`;
    }
  }

  onLocationPicked(location: LatLng): void {
    if (this.event) {
      this.event.location = { lat: location.lat, long: location.lng };
    }
  }

  onSubmit(): void {
    if (!this.event) return;
    this.error = null;
    if (!this.event.name.trim()) { this.error = 'Event name is required.'; return; }
    if (!this.event.location.lat || !this.event.location.long) { this.error = 'Please pick a location on the map.'; return; }
    if (!this.event.start_time) { this.error = 'Start date and time are required.'; return; }
    this.loading = true;
    this.apiService.updateEvent(this.event.id, this.event).subscribe({
      next: () => this.router.navigate(['/events', this.event!.id]),
      error: (err) => {
        this.loading = false;
        if (err.status === 401) {
          this.router.navigate(['/login']);
        } else {
          this.error = err.error?.error || 'Failed to save changes. Please try again.';
        }
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/events', this.event!.id]);
  }
}
