import { Component, Input, Output, EventEmitter, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';
import * as L from 'leaflet';
import { LocationService } from '../../services/location/location.service';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export interface LatLng {
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.template.html',
  styleUrl: './map.style.less'
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @Input() height: number = 200;
  @Input() width?: number;
  @Input() readonly: boolean = false;
  @Input() pin?: LatLng;
  @Output() locationPicked = new EventEmitter<LatLng>();

  @ViewChild('mapEl') mapEl!: ElementRef;

  private map?: L.Map;
  private marker?: L.Marker;
  private watchId?: number;

  constructor(private ngZone: NgZone, private location: LocationService) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.map = L.map(this.mapEl.nativeElement, {
        zoom: 2,
        center: [20, 0]
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      if (this.pin) {
        this.marker = L.marker([this.pin.lat, this.pin.lng], { icon: defaultIcon }).addTo(this.map);
        this.map.setView([this.pin.lat, this.pin.lng], 13);
      } else if (!this.readonly) {
        this.centerOnUserLocation();
      }

      if (!this.readonly) {
        this.map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          this.marker?.remove();
          this.marker = L.marker([lat, lng], { icon: defaultIcon }).addTo(this.map!);
          this.locationPicked.emit({ lat, lng });
        });
      }
    });
  }

  private centerOnUserLocation(): void {
    const cached = this.location.coords;
    if (cached) this.map?.setView([cached.lat, cached.lng], 13);

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
      () => {}
    );
  }

  ngOnDestroy(): void {
    if (this.watchId !== undefined) {
      this.location.clearWatch(this.watchId);
    }
    this.map?.remove();
  }
}
