import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.apiService.getEvent(id).subscribe({
      next: event => this.event = event,
      error: () => this.router.navigate(['/'])
    });
  }

  get pin(): LatLng | undefined {
    if (this.event?.location?.lat && this.event?.location?.long) {
      return { lat: this.event.location.lat, lng: this.event.location.long };
    }
    return undefined;
  }

  get isOwner(): boolean {
    const user = this.authService.getUser();
return !!user && !!this.event && !!user.db_id && this.event.creator_id === user.db_id;
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

  goBack(): void {
    this.router.navigate(['/']);
  }
}
