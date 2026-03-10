import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, UserInfo } from '../../../services/authentication/auth.service';
import { ApiService, UserData, UserProfile } from '../../../services/api/api.service';
import { Event } from '../../../models/event.model';
import { CreateEventButtonComponent } from "../createButton/createEventButton.component";

@Component({
  selector: 'eventListView',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./eventListView.template.html",
  styleUrl: "./eventListView.style.less"
})

export class EventsListViewComponent implements OnInit {
    @Input() event: Event = new Event;
    constructor(
        private authService: AuthService,
        private apiService: ApiService
    ) {}

    ngOnInit(): void {

    }
}