import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MetricsService } from '../../services/metrics/metrics.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  templateUrl: './notFound.template.html',
  styleUrl: './notFound.style.less'
})
export class NotFoundComponent implements OnInit {
  constructor(private router: Router, private metrics: MetricsService) {}

  ngOnInit(): void {
    this.metrics.notFoundHit(this.router.url);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
