import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Event } from '../../../models/event.model';

@Component({
  selector: 'eventListView',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./eventListView.template.html",
  styleUrl: "./eventListView.style.less"
})
export class EventsListViewComponent {
    @Input() event: Event = new Event();

    constructor(private router: Router) {}

    onClick(): void {
        this.router.navigate(['/events', this.event.id]);
    }
}
