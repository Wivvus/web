import { Component, Input, Output, EventEmitter, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import * as L from 'leaflet';

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

  ngAfterViewInit(): void {
    this.map = L.map(this.mapEl.nativeElement, {
      zoom: 13,
      center: [43.530147, 16.488932]
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    if (this.pin) {
      this.marker = L.marker([this.pin.lat, this.pin.lng], { icon: defaultIcon }).addTo(this.map);
      this.map.setView([this.pin.lat, this.pin.lng], 13);
    } else if (!this.readonly) {
      navigator.geolocation.getCurrentPosition(
        pos => this.map?.setView([pos.coords.latitude, pos.coords.longitude], 13),
        () => {}
      );
    }

    if (!this.readonly) {
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        this.marker?.remove();
        this.marker = L.marker([lat, lng], { icon: defaultIcon }).addTo(this.map!);
        this.locationPicked.emit({ lat, lng });
      });
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
