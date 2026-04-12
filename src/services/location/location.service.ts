import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Coords {
  lat: number;
  lng: number;
}

const STORAGE_KEY = 'user_location';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private coordsSubject = new BehaviorSubject<Coords | null>(this.loadCached());
  coords$ = this.coordsSubject.asObservable();

  constructor(private ngZone: NgZone) {}

  get coords(): Coords | null {
    return this.coordsSubject.value;
  }

  /**
   * Request location once. Uses cached coords immediately if available,
   * then updates when fresh GPS arrives.
   */
  request(): void {
    if (!navigator.geolocation) return;
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

  /**
   * Watch position for continuous updates (e.g. map centering).
   * Returns the watch ID so the caller can clear it.
   */
  watch(onUpdate: (coords: Coords, accuracy: number) => void, onError: () => void): number {
    if (!navigator.geolocation) { onError(); return -1; }
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
