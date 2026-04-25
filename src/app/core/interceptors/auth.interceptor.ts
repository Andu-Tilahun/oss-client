import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {AuthService} from '../../features/auth/services/auth.service';
import {Router} from '@angular/router';
import {SKIP_AUTH_REDIRECT} from '../services/http.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const isAuthError = error.status === 401 || error.status === 403;
        const hasSessionToken = !!token;
        const skipAuthRedirect = request.context.get(SKIP_AUTH_REDIRECT);

        // Allow selected public requests to fail without forcing login.
        // Keep auth redirect behavior for all other protected requests.
        if (isAuthError && hasSessionToken && !skipAuthRedirect) {
          this.authService.forceLogout();
        }
        return throwError(() => error);
      })
    );
  }
}
