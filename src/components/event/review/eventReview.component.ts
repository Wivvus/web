import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api/api.service';
import { AuthService } from '../../../services/authentication/auth.service';
import { Event } from '../../../models/event.model';
import { HeaderComponent } from '../../header/header.component';

@Component({
  selector: 'event-review',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './eventReview.template.html',
  styleUrl: './eventReview.style.less'
})
export class EventReviewComponent implements OnInit {
  event?: Event;
  isOwner = false;
  myRating = 0;
  myComment = '';
  submitted = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private title: Title
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.apiService.getEvent(id).subscribe({
      next: event => {
        this.event = event;
        this.title.setTitle(`Rate: ${event.name}`);
        this.isOwner = this.authService.getUser()?.db_id === event.creator_id;
        if (new Date(event.start_time) >= new Date()) {
          this.router.navigate(['/run', id]);
        }
      },
      error: () => this.router.navigate(['/'])
    });
  }

  setRating(score: number): void {
    this.myRating = score;
  }

  submit(): void {
    if (!this.event || this.myRating === 0) return;
    this.error = null;
    this.apiService.rateEvent(this.event.id, this.myRating, this.myComment).subscribe({
      next: () => { this.submitted = true; },
      error: err => { this.error = err.error?.error || 'Failed to submit rating'; }
    });
  }

  goBack(): void {
    this.router.navigate(['/run', this.event?.id]);
  }
}
