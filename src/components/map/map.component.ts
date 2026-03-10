import { Component, Input, Output, EventEmitter, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import * as L from 'leaflet';

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

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.marker?.remove();
      this.marker = L.marker([lat, lng]).addTo(this.map!);
      this.locationPicked.emit({ lat, lng });
    });

    navigator.geolocation.getCurrentPosition(
      pos => this.map?.setView([pos.coords.latitude, pos.coords.longitude], 13),
      () => {}
    );
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
