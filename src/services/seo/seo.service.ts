import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Event } from '../../models/event.model';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class SeoService {
  constructor(private meta: Meta, private title: Title) {}

  setEvent(event: Event): void {
    const url = `${environment.appUrl}/run/${event.id}`;
    const description = this.buildEventDescription(event);
    const pageTitle = `${event.name} | Wivvus`;
    const image = this.buildStaticMapUrl(event);

    this.title.setTitle(pageTitle);
    this.setTags({ title: event.name, description, url, image });
  }

  setDefault(): void {
    const description = 'Find and join local running events near you.';
    this.title.setTitle('Wivvus');
    this.setTags({ title: 'Wivvus', description, url: environment.appUrl });
  }

  private buildStaticMapUrl(event: Event): string | undefined {
    const lat = event.location?.lat;
    const lng = event.location?.long;
    if (!lat || !lng) return undefined;
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=600x315&markers=${lat},${lng},red-pushpin`;
  }

  private buildEventDescription(event: Event): string {
    const parts: string[] = [];
    if (event.start_time) {
      parts.push(new Date(event.start_time).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      }));
    }
    if (event.distance_km) parts.push(`${event.distance_km} km`);
    if (event.all_paces) parts.push('all paces welcome');
    else if (event.pace_min_km) parts.push(`${event.pace_min_km} min/km`);
    if (event.description) parts.push(event.description);
    return parts.slice(0, 3).join(' · ');
  }

  private setTags(tags: { title: string; description: string; url: string; image?: string }): void {
    const { title, description, url, image } = tags;
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Wivvus' });
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    if (image) {
      this.meta.updateTag({ property: 'og:image', content: image });
      this.meta.updateTag({ name: 'twitter:image', content: image });
    } else {
      this.meta.removeTag('property="og:image"');
      this.meta.removeTag('name="twitter:image"');
    }
  }
}
