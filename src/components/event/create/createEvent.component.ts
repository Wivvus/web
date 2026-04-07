import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event } from '../../../models/event.model';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api/api.service';
import { Router } from '@angular/router';
import { MapComponent, LatLng } from '../../map/map.component';

@Component({
  selector: 'create-event',
  standalone: true,
  imports: [CommonModule, FormsModule, MapComponent],
  templateUrl: "./createEvent.template.html",
  styleUrl: "./createEvent.style.less"
})
export class CreateEventComponent {
    event: Event = new Event();
    startDate: string = "";
    startTime: string = "";
    error: string | null = null;
    loading = false;

    constructor(
        private apiService: ApiService,
        private router: Router
    ) {}

    goHome(): void {
        this.router.navigate(['/']);
    }

    onDateTimeChange(): void {
        if (this.startDate && this.startTime) {
            this.event.start_time = `${this.startDate}T${this.startTime}:00Z`;
        }
    }

    onLocationPicked(location: LatLng): void {
        this.event.location = { lat: location.lat, long: location.lng };
    }

    onSubmit(): void {
        this.error = null;
        if (!this.event.name.trim()) { this.error = 'Event name is required.'; return; }
        if (!this.event.location.lat || !this.event.location.long) { this.error = 'Please pick a location on the map.'; return; }
        if (!this.event.start_time) { this.error = 'Start date and time are required.'; return; }
        this.loading = true;
        this.apiService.createEvent(this.event).subscribe({
            next: () => this.router.navigate(['/']),
            error: (err) => {
                this.loading = false;
                if (err.status === 401) {
                    this.router.navigate(['/login']);
                } else {
                    this.error = err.error?.error || 'Failed to create event. Please try again.';
                }
            }
        });
    }
}
