import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { ApiService } from '../../../services/api/api.service';
import { EventsListViewComponent } from "../listView/eventListView.component";
import { Event, EventFilters } from '../../../models/event.model';
import { CreateEventButtonComponent } from '../createButton/createEventButton.component';
import { EventsMapComponent } from '../map/eventsMap.component';
import { EventFiltersComponent } from '../filters/eventFilters.component';
import { HeaderComponent } from '../../header/header.component';
import { MetricsService } from '../../../services/metrics/metrics.service';
import { SeoService } from '../../../services/seo/seo.service';

@Component({
  selector: 'eventsList',
  standalone: true,
  imports: [CommonModule, EventsListViewComponent, CreateEventButtonComponent, EventsMapComponent, EventFiltersComponent, HeaderComponent],
  templateUrl: "./eventsList.template.html",
  styleUrl: "./eventsList.style.less"
})
export class EventsListComponent implements OnInit {
    events: Event[] = [];
    view: 'list' | 'map' = 'list';
    filters: EventFilters = {};
    flashMessage: string | null = null;
    private platformId = inject(PLATFORM_ID);

  constructor(private apiService: ApiService, private router: Router, private metrics: MetricsService, private seo: SeoService) {}

    ngOnInit(): void {
        this.seo.setDefault();
        const nav = this.router.getCurrentNavigation();
        const historyMessage = isPlatformBrowser(this.platformId) ? history.state?.message : null;
        this.flashMessage = nav?.extras?.state?.['message'] ?? historyMessage ?? null;
        if (this.flashMessage) {
          setTimeout(() => this.flashMessage = null, 5000);
        }
        this.fetchEvents();
    }

    onFiltersChange(filters: EventFilters): void {
        this.filters = filters;
        this.metrics.filterUsed(filters);
        this.fetchEvents();
    }

  switchView(view: 'list' | 'map'): void {
    if (this.view !== view) {
      this.view = view;
      this.metrics.viewSwitched(view);
    }
  }

  goToCreate(): void {
    this.router.navigate(['/run/create']);
  }

  private fetchEvents(): void {
        this.apiService.getEvents(undefined, this.filters).subscribe({
            next: (events) => { this.events = events; },
            error: () => {}
        });
    }
}
