import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MetricsService } from '../../services/metrics/metrics.service';
import { SSR_RESPONSE } from '../../tokens/ssr.tokens';

@Component({
  selector: 'app-not-found',
  standalone: true,
  templateUrl: './notFound.template.html',
  styleUrl: './notFound.style.less'
})
export class NotFoundComponent implements OnInit {
  private response = inject(SSR_RESPONSE, { optional: true });

  constructor(private router: Router, private metrics: MetricsService) {}

  ngOnInit(): void {
    if (this.response) {
      this.response.status(404);
    }
    this.metrics.notFoundHit(this.router.url);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
