import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const currentUser = this.authService.getCurrentUser();
    const requiredRoles = route.data['roles'] as Array<string>;
    if (!currentUser) {
      this.router.navigate(['/public']);
      return false;
    }
    if (requiredRoles && !requiredRoles.includes(currentUser.role)) {
      // The cached session's role doesn't match what this route requires — rather than showing a
      // generic Forbidden page while leaving a stale/wrong session in place, clear it and force the
      // user back through login.
      this.authService.forceLogout();
      return false;
    }
    return true;
  }
}
