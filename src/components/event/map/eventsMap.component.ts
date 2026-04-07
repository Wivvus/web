import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';
import * as L from 'leaflet';
import { Event } from '../../../models/event.model';
import { ApiService } from '../../../services/api/api.service';
import { Router } from '@angular/router';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

@Component({
  selector: 'events-map',
  standalone: true,
  template: `<div #mapEl style="width:100%;height:100%;display:block;"></div>`,
  styles: [`:host { display: block; width: 100%; height: 100%; }`]
})
export class EventsMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapEl') mapEl!: ElementRef;

  private map?: L.Map;
  private markers: L.Marker[] = [];
  private watchId?: number;

  constructor(private ngZone: NgZone, private apiService: ApiService, private router: Router) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.map = L.map(this.mapEl.nativeElement, { zoom: 12, center: [20, 0] });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      this.map.on('moveend', () => this.ngZone.run(() => this.fetchAndRender()));
      this.map.on('zoomend', () => this.ngZone.run(() => this.fetchAndRender()));

      this.centerOnUserLocation();
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
    this.apiService.getEvents(bbox).subscribe({
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

      const marker = L.marker([lat, lng], { icon: defaultIcon })
        .addTo(this.map!)
        .bindPopup(`
          <strong>${event.name}</strong><br>
          <a href="/events/${event.id}" style="color:#d32f2f;font-weight:600;">View event →</a>
        `);

      this.markers.push(marker);
    }
  }

  private centerOnUserLocation(): void {
    if (!navigator.geolocation) {
      this.fetchAndRender();
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.ngZone.run(() => {
          const { latitude, longitude, accuracy } = pos.coords;
          const zoom = accuracy <= 100 ? 15 : accuracy <= 1000 ? 13 : accuracy <= 5000 ? 11 : 9;
          this.map?.setView([latitude, longitude], zoom);
          if (accuracy <= 500 && this.watchId !== undefined) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = undefined;
          }
        });
      },
      () => { this.fetchAndRender(); },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  }

  ngOnDestroy(): void {
    if (this.watchId !== undefined) {
      navigator.geolocation.clearWatch(this.watchId);
    }
    this.map?.remove();
  }
}
