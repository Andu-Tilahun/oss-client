import {Injectable} from '@angular/core';
import {
  HttpContextToken,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {catchError, filter, switchMap, take} from 'rxjs/operators';
import {AuthService} from '../../features/auth/services/auth.service';
import {SKIP_AUTH_REDIRECT} from '../services/http.service';
import {isAuthBypassUrl} from './auth-http.util';

export const SKIP_TOKEN_REFRESH = new HttpContextToken(() => false);

@Injectable()
export class AuthRefreshInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private readonly refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.context.get(SKIP_TOKEN_REFRESH) || isAuthBypassUrl(request.url)) {
      return next.handle(request);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 403) {
          // The backend rejected this request as forbidden for the current session/role — same
          // treatment as a failed token refresh: clear the stale session and force back to login
          // rather than rendering a generic Forbidden page over a session that shouldn't be trusted.
          const skipAuthRedirect = request.context.get(SKIP_AUTH_REDIRECT);
          if (!skipAuthRedirect) {
            this.authService.forceLogout();
          }
          return throwError(() => error);
        }

        if (error.status !== 401 || !this.authService.getRefreshToken()) {
          return throwError(() => error);
        }

        if (this.isRefreshing) {
          return this.refreshTokenSubject.pipe(
            filter((token): token is string => token !== null),
            take(1),
            switchMap((token) => next.handle(this.withBearerToken(request, token))),
          );
        }

        this.isRefreshing = true;
        this.refreshTokenSubject.next(null);

        return this.authService.refreshSession().pipe(
          switchMap((session) => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(session.token);
            return next.handle(this.withBearerToken(request, session.token));
          }),
          catchError((refreshError) => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(null);
            const skipAuthRedirect = request.context.get(SKIP_AUTH_REDIRECT);
            if (!skipAuthRedirect) {
              this.authService.forceLogout();
            }
            return throwError(() => refreshError);
          }),
        );
      }),
    );
  }

  private withBearerToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({
      setHeaders: {Authorization: `Bearer ${token}`},
    });
  }
}
