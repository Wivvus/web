import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../../services/metrics/metrics.service';

export const metricsInterceptor: HttpInterceptorFn = (req, next) => {
  const metrics = inject(MetricsService);
  const start = Date.now();

  return next(req).pipe(
    tap({
      next: event => {
        if (event instanceof HttpResponse) {
          const duration = Date.now() - start;
          const url = new URL(req.url, window.location.origin);
          metrics.apiResponse(req.method, url.pathname, event.status, duration);
        }
      },
      error: err => {
        const duration = Date.now() - start;
        const url = new URL(req.url, window.location.origin);
        metrics.apiResponse(req.method, url.pathname, err.status ?? 0, duration);
      }
    })
  );
};
