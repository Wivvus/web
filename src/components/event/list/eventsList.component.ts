import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, UserInfo } from '../../../services/authentication/auth.service';
import { ApiService, UserData, UserProfile } from '../../../services/api/api.service';
import { EventsListViewComponent } from "../listView/eventListView.component";
import { Event } from '../../../models/event.model';
import { Observable } from 'rxjs';
import { CreateEventButtonComponent } from '../createButton/createEventButton.component';

@Component({
  selector: 'eventsList',
  standalone: true,
  imports: [CommonModule, EventsListViewComponent, CreateEventButtonComponent],
  templateUrl: "./eventsList.template.html",
  styleUrl: "./eventsList.style.less"
})

export class EventsListComponent implements OnInit {
    events: Event[] = new Array()

    constructor(
        private apiService: ApiService,
        private router: Router
    ) {}

    goHome(): void {
        this.router.navigate(['/']);
    }

    ngOnInit(): void {
        var cpnt = this
        this.apiService.getEvents().subscribe({
            next(events) {
                cpnt.events = events
            },
            error(err){},
        })
    }
}