import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api/api.service';
import { EventsListViewComponent } from "../listView/eventListView.component";
import { Event, EventFilters } from '../../../models/event.model';
import { CreateEventButtonComponent } from '../createButton/createEventButton.component';
import { EventsMapComponent } from '../map/eventsMap.component';
import { EventFiltersComponent } from '../filters/eventFilters.component';

@Component({
  selector: 'eventsList',
  standalone: true,
  imports: [CommonModule, EventsListViewComponent, CreateEventButtonComponent, EventsMapComponent, EventFiltersComponent],
  templateUrl: "./eventsList.template.html",
  styleUrl: "./eventsList.style.less"
})
export class EventsListComponent implements OnInit {
    events: Event[] = [];
    view: 'list' | 'map' = 'list';
    filters: EventFilters = {};

    constructor(
        private apiService: ApiService,
        private router: Router
    ) {}

    goHome(): void {
        this.router.navigate(['/']);
    }

    ngOnInit(): void {
        this.fetchEvents();
    }

    onFiltersChange(filters: EventFilters): void {
        this.filters = filters;
        this.fetchEvents();
    }

    private fetchEvents(): void {
        this.apiService.getEvents(undefined, this.filters).subscribe({
            next: (events) => { this.events = events; },
            error: () => {}
        });
    }
}