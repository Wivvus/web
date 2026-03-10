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
      this.event.start_time = `${this.startDate}T${this.startTime}:00Z`;
    }
  }

  onLocationPicked(location: LatLng): void {
    if (this.event) {
      this.event.location = { lat: location.lat, long: location.lng };
    }
  }

  onSubmit(): void {
    if (!this.event) return;
    this.apiService.updateEvent(this.event.id, this.event).subscribe({
      next: () => this.router.navigate(['/events', this.event!.id]),
      error: () => {}
    });
  }

  goBack(): void {
    this.router.navigate(['/events', this.event!.id]);
  }
}
