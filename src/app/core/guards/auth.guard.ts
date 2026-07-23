import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../../features/auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {
    if (this.authService.isSessionValid()) {
      return true;
    }

    const refreshToken = this.authService.getRefreshToken();
    if (refreshToken && !this.authService.isTokenExpired(refreshToken)) {
      return this.authService.refreshSession().pipe(
        map(() => true),
        catchError(() => {
          this.authService.clearSessionSilently();
          this.router.navigate(['/public'], { queryParams: { returnUrl: state.url } });
          return of(false);
        })
      );
    }

    this.authService.clearSessionSilently();
    this.router.navigate(['/public'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
