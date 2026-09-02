import { Component, Input, AfterViewInit, OnChanges, OnDestroy, ViewChild, ElementRef, NgZone, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Event, EventFilters } from '../../../models/event.model';
import { ApiService } from '../../../services/api/api.service';
import { Router } from '@angular/router';
import { LocationService } from '../../../services/location/location.service';

@Component({
  selector: 'events-map',
  standalone: true,
  host: { ngSkipHydration: 'true' },
  template: `<div #mapEl style="width:100%;height:100%;display:block;"></div>`,
  styles: [`:host { display: block; width: 100%; height: 100%; }`]
})
export class EventsMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() filters: EventFilters = {};
  @ViewChild('mapEl') mapEl!: ElementRef;

  private platformId = inject(PLATFORM_ID);
  private map?: any;
  private markers: any[] = [];
  private watchId?: number;
  private L?: any;
  private defaultIcon?: any;

  constructor(private ngZone: NgZone, private apiService: ApiService, private router: Router, private location: LocationService) {}

  ngOnChanges(): void {
    if (this.map) {
      this.fetchAndRender();
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    import('leaflet').then(mod => {
      const L = (mod as any).default ?? mod;
      this.L = L;
      this.defaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      setTimeout(() => {
        this.map = L.map(this.mapEl.nativeElement, { zoom: 12, center: [20, 0] });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.map.on('moveend', () => this.ngZone.run(() => this.fetchAndRender()));
        this.map.on('zoomend', () => this.ngZone.run(() => this.fetchAndRender()));

        this.centerOnUserLocation();
      });
    });
  }

  private fetchAndRender(): void {
    if (!this.map) return;
    const b = this.map.getBounds();
    const bbox = {
      latMin: b.getSouth(),
      latMax: b.getNorth(),
      lngMin: b.getWest(),
      lngMax: b.getEast()
    };
    this.apiService.getEvents(bbox, this.filters).subscribe({
      next: (events) => this.renderMarkers(events),
      error: () => {}
    });
  }

  private renderMarkers(events: Event[]): void {
    this.markers.forEach(m => m.remove());
    this.markers = [];

    for (const event of events) {
      const { lat, long: lng } = event.location;
      if (!lat || !lng) continue;

      const date = event.start_time
        ? new Date(event.start_time).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
        : '';
      const chips = [
        ...(event.distance_km ? [`${event.distance_km} km`] : []),
        ...(event.all_paces ? ['All paces welcome'] : (event.pace_min_km ? [`${event.pace_min_km} min/km`] : []))
      ].map(t => `<span style="font-size:0.75rem;font-weight:600;color:#d32f2f;background:#fdecea;border-radius:999px;padding:0.15rem 0.55rem;">${t}</span>`).join(' ');

      const marker = this.L.marker([lat, lng], { icon: this.defaultIcon })
        .addTo(this.map!)
        .bindPopup(`
          <strong style="font-size:0.95rem;">${event.name}</strong><br>
          <span style="color:#666;font-size:0.82rem;">${date}</span>
          ${chips ? `<br><div style="margin-top:0.35rem;display:flex;gap:0.3rem;flex-wrap:wrap;">${chips}</div>` : ''}
          <br>
          <a href="/run/${event.id}" style="color:#d32f2f;font-weight:600;font-size:0.85rem;">View event →</a>
        `);

      this.markers.push(marker);
    }
  }

  private centerOnUserLocation(): void {
    const cached = this.location.coords;
    if (cached) {
      this.map?.setView([cached.lat, cached.lng], 13);
      this.fetchAndRender();
    }

    this.watchId = this.location.watch(
      (coords, accuracy) => {
        this.ngZone.run(() => {
          const zoom = accuracy <= 100 ? 15 : accuracy <= 1000 ? 13 : accuracy <= 5000 ? 11 : 9;
          this.map?.setView([coords.lat, coords.lng], zoom);
          if (accuracy <= 500 && this.watchId !== undefined) {
            this.location.clearWatch(this.watchId);
            this.watchId = undefined;
          }
        });
      },
      () => { if (!cached) this.fetchAndRender(); }
    );
  }

  ngOnDestroy(): void {
    if (this.watchId !== undefined) {
      this.location.clearWatch(this.watchId);
    }
    this.map?.remove();
  }
}
