import { Injectable, NgZone, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Coords {
  lat: number;
  lng: number;
}

const STORAGE_KEY = 'user_location';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private platformId = inject(PLATFORM_ID);
  private coordsSubject!: BehaviorSubject<Coords | null>;
  coords$!: Observable<Coords | null>;

  constructor(private ngZone: NgZone) {
    this.coordsSubject = new BehaviorSubject<Coords | null>(
      isPlatformBrowser(this.platformId) ? this.loadCached() : null
    );
    this.coords$ = this.coordsSubject.asObservable();
  }

  get coords(): Coords | null {
    return this.coordsSubject.value;
  }

  request(): void {
    if (!isPlatformBrowser(this.platformId) || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords: Coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        this.ngZone.run(() => {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
          this.coordsSubject.next(coords);
        });
      },
      () => {},
      { maximumAge: 60000, timeout: 10000 }
    );
  }

  watch(onUpdate: (coords: Coords, accuracy: number) => void, onError: () => void): number {
    if (!isPlatformBrowser(this.platformId) || !navigator.geolocation) { onError(); return -1; }
    return navigator.geolocation.watchPosition(
      pos => {
        const coords: Coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
        this.coordsSubject.next(coords);
        onUpdate(coords, pos.coords.accuracy);
      },
      onError,
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
    );
  }

  clearWatch(id: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (id >= 0) navigator.geolocation.clearWatch(id);
  }

  private loadCached(): Coords | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
