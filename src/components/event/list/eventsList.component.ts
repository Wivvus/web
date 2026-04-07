import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api/api.service';
import { EventsListViewComponent } from "../listView/eventListView.component";
import { Event } from '../../../models/event.model';
import { CreateEventButtonComponent } from '../createButton/createEventButton.component';
import { EventsMapComponent } from '../map/eventsMap.component';

@Component({
  selector: 'eventsList',
  standalone: true,
  imports: [CommonModule, EventsListViewComponent, CreateEventButtonComponent, EventsMapComponent],
  templateUrl: "./eventsList.template.html",
  styleUrl: "./eventsList.style.less"
})

export class EventsListComponent implements OnInit {
    events: Event[] = [];
    view: 'list' | 'map' = 'list';

    constructor(
        private apiService: ApiService,
        private router: Router
    ) {}

    goHome(): void {
        this.router.navigate(['/']);
    }

    ngOnInit(): void {
        this.apiService.getEvents().subscribe({
            next: (events) => { this.events = events; },
            error: () => {}
        });
    }
}