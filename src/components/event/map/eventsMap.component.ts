import { Component, Input, AfterViewInit, OnChanges, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';
import * as L from 'leaflet';
import { Event, EventFilters } from '../../../models/event.model';
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
export class EventsMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() filters: EventFilters = {};
  @ViewChild('mapEl') mapEl!: ElementRef;

  private map?: L.Map;
  private markers: L.Marker[] = [];
  private radiusCircle?: L.Circle;
  private maskSvg?: SVGSVGElement;
  private maskCircleEl?: SVGCircleElement;
  private watchId?: number;

  constructor(private ngZone: NgZone, private apiService: ApiService, private router: Router) {}

  ngOnChanges(): void {
    if (this.map) {
      this.updateRadiusCircle();
      this.fetchAndRender();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.map = L.map(this.mapEl.nativeElement, { zoom: 12, center: [20, 0] });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      this.map.on('moveend', () => this.ngZone.run(() => this.fetchAndRender()));
      this.map.on('zoomend', () => this.ngZone.run(() => this.fetchAndRender()));
      this.map.on('moveend zoomend resize', () => this.repositionMask());

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
        ...(event.pace_min_km ? [`${event.pace_min_km} min/km`] : [])
      ].map(t => `<span style="font-size:0.75rem;font-weight:600;color:#d32f2f;background:#fdecea;border-radius:999px;padding:0.15rem 0.55rem;">${t}</span>`).join(' ');

      const marker = L.marker([lat, lng], { icon: defaultIcon })
        .addTo(this.map!)
        .bindPopup(`
          <strong style="font-size:0.95rem;">${event.name}</strong><br>
          <span style="color:#666;font-size:0.82rem;">${date}</span>
          ${chips ? `<br><div style="margin-top:0.35rem;display:flex;gap:0.3rem;flex-wrap:wrap;">${chips}</div>` : ''}
          <br>
          <a href="/events/${event.id}" style="color:#d32f2f;font-weight:600;font-size:0.85rem;">View event →</a>
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

  private updateRadiusCircle(): void {
    // Remove previous circle and mask
    this.radiusCircle?.remove();
    this.radiusCircle = undefined;
    if (this.maskSvg) {
      this.maskSvg.remove();
      this.maskSvg = undefined;
      this.maskCircleEl = undefined;
    }

    const { maxRadius, userLat, userLng } = this.filters;
    if (!maxRadius || !userLat || !userLng) return;

    // Thin black circle border (no fill — map fully visible inside)
    this.radiusCircle = L.circle([userLat, userLng], {
      radius: maxRadius * 1000,
      color: '#000',
      weight: 1,
      fill: false,
    }).addTo(this.map!);

    // SVG mask: grey everywhere outside the circle
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as SVGSVGElement;
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:400;';

    const defs = document.createElementNS(ns, 'defs');
    const mask = document.createElementNS(ns, 'mask');
    mask.setAttribute('id', 'radius-mask');

    const maskBg = document.createElementNS(ns, 'rect');
    maskBg.setAttribute('fill', 'white');
    maskBg.setAttribute('x', '0');
    maskBg.setAttribute('y', '0');
    maskBg.setAttribute('width', '100%');
    maskBg.setAttribute('height', '100%');

    const maskHole = document.createElementNS(ns, 'circle');
    maskHole.setAttribute('fill', 'black');

    mask.appendChild(maskBg);
    mask.appendChild(maskHole);
    defs.appendChild(mask);

    const overlay = document.createElementNS(ns, 'rect');
    overlay.setAttribute('fill', 'rgba(0,0,0,0.35)');
    overlay.setAttribute('mask', 'url(#radius-mask)');
    overlay.setAttribute('x', '0');
    overlay.setAttribute('y', '0');
    overlay.setAttribute('width', '100%');
    overlay.setAttribute('height', '100%');

    svg.appendChild(defs);
    svg.appendChild(overlay);
    this.map!.getContainer().appendChild(svg);

    this.maskSvg = svg;
    this.maskCircleEl = maskHole;

    this.repositionMask();
  }

  private repositionMask(): void {
    if (!this.maskCircleEl || !this.map) return;
    const { userLat, userLng, maxRadius } = this.filters;
    if (!userLat || !userLng || !maxRadius) return;

    const center = this.map.latLngToContainerPoint(L.latLng(userLat, userLng));
    // Compute pixel radius: move 1 degree north and see how many pixels that is, scaled by actual radius
    const edgeLat = userLat + (maxRadius * 1000 / 111320);
    const edgePx = this.map.latLngToContainerPoint(L.latLng(edgeLat, userLng));
    const pixelRadius = Math.abs(center.y - edgePx.y);

    this.maskCircleEl.setAttribute('cx', String(center.x));
    this.maskCircleEl.setAttribute('cy', String(center.y));
    this.maskCircleEl.setAttribute('r', String(pixelRadius));
  }

  ngOnDestroy(): void {
    if (this.watchId !== undefined) {
      navigator.geolocation.clearWatch(this.watchId);
    }
    this.maskSvg?.remove();
    this.map?.remove();
  }
}
