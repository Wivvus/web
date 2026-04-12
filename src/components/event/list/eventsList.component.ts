import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api/api.service';
import { EventsListViewComponent } from "../listView/eventListView.component";
import { Event, EventFilters } from '../../../models/event.model';
import { CreateEventButtonComponent } from '../createButton/createEventButton.component';
import { EventsMapComponent } from '../map/eventsMap.component';
import { EventFiltersComponent } from '../filters/eventFilters.component';
import { HeaderComponent } from '../../header/header.component';
import { MetricsService } from '../../../services/metrics/metrics.service';

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

  constructor(private apiService: ApiService, private router: Router, private metrics: MetricsService) {}

    ngOnInit(): void {
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
    this.router.navigate(['/events/create']);
  }

  private fetchEvents(): void {
        this.apiService.getEvents(undefined, this.filters).subscribe({
            next: (events) => { this.events = events; },
            error: () => {}
        });
    }
}
