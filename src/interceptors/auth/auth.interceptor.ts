import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/authentication/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Only add Authorization header if token exists
  if (token) {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (authService.getProvider() === 'local') {
      headers['X-Auth-Provider'] = 'local';
    }
    const clonedRequest = req.clone({ setHeaders: headers });
    return next(clonedRequest);
  }

  return next(req);
};