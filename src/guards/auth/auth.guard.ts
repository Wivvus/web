import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../services/authentication/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    console.log("user is logged in")
    return true;
  }

  // Redirect to login with return URL
  router.navigate(['/login'], { 
    queryParams: { returnUrl: state.url }
  });
  return false;
};