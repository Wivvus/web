import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event } from '../../../models/event.model';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api/api.service';
import { Router } from '@angular/router';
import { MapComponent } from '../../map/map.component';

@Component({
  selector: 'create-event',
  standalone: true,
  imports: [CommonModule, FormsModule, MapComponent],
  templateUrl: "./createEvent.template.html",
  styleUrl: "./createEvent.style.less"
})
export class CreateEventComponent {
    event: Event = new Event();

    constructor(
        private apiService: ApiService,
        private router: Router
    ) {}

    onSubmit(): void {
        const me = this;
        this.apiService.createEvent(this.event).subscribe({
            next() { me.router.navigate(['/']); },
            error(err) {
                if (err.status == 401) { me.router.navigate(['/login']); }
            },
        });
    }
}
