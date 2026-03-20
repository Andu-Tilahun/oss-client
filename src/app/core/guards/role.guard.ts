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
      this.router.navigate(['/login']);
      return false;
    }
    if (requiredRoles && !requiredRoles.includes(currentUser.role)) {
      this.router.navigate(['/403']); // Forbidden page
      return false;
    }
    return true;
  }
}
