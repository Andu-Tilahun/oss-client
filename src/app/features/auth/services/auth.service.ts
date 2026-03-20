import {Injectable} from '@angular/core';
import {BehaviorSubject, catchError, Observable, tap, throwError} from 'rxjs';
import {Router} from '@angular/router';
import {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  User
} from '../../users/models/user.model';
import {HttpService, RequestType} from "../../../core/services/http.service";
import {ApiResponse} from "../../../shared/models/api-response.model";
import {Endpoints} from "../../../core/endpoint/endpoint.model";


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());

  public currentUser$ = this.currentUserSubject.asObservable();


  constructor(
    private httpService: HttpService,
    private router: Router
  ) {
  }

  register(request: RegisterRequest): Observable<ApiResponse<User>> {
    return this.httpService.post<ApiResponse<User>>(
      `${Endpoints.USERS_ENDPOINT}/register`,
      request
    );
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.httpService
      .post<AuthResponse>(`${Endpoints.AUTH_ENDPOINT}/login`, credentials)
      .pipe(
        tap((authResponse: AuthResponse) => {
          this.setSession(authResponse);
          this.currentUserSubject.next(authResponse.user);
        }),
        catchError((error) => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }


  logout(): Observable<ApiResponse<void>> {
    return this.httpService.post<ApiResponse<void>>(`${Endpoints.AUTH_ENDPOINT}/logout`, {}, undefined, {
      requestType: RequestType.NON_BLOCKING
    }).pipe(
      tap(() => {
        this.clearSession();
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
      }),
      catchError(error => {
        // Even if logout fails on server, clear local session
        this.clearSession();
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }


  forgotPassword(request: ForgotPasswordRequest): Observable<ApiResponse<void>> {
    return this.httpService.post<ApiResponse<void>>(
      `${Endpoints.AUTH_ENDPOINT}/forgot-password`,
      request, undefined, {
        requestType: RequestType.BLOCKING
      }
    );
  }

  resetPassword(request: ResetPasswordRequest): Observable<ApiResponse<void>> {
    return this.httpService.post<ApiResponse<void>>(
      `${Endpoints.AUTH_ENDPOINT}/reset-password`,
      request, undefined, {
        requestType: RequestType.BLOCKING
      }
    );
  }

  validateToken(): Observable<ApiResponse<User>> {
    return this.httpService.get<ApiResponse<User>>(
      `${Endpoints.AUTH_ENDPOINT}/reset-password`, undefined, undefined, {
        requestType: RequestType.NON_BLOCKING
      }
    );
  }

  private setSession(authResponse: AuthResponse | undefined | null): void {
    if (!authResponse) {
      return; // Exit early if authResponse is undefined/null
    }

    if (authResponse.token) {
      localStorage.setItem(this.TOKEN_KEY, authResponse.token);
    }

    if (authResponse.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, authResponse.refreshToken);
    }

    if (authResponse.user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(authResponse.user));
    }
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    const user = this.currentUserSubject.value;
    if (user) return user;
    if (this.isLoggedIn()) {
      const fromStorage = this.getUserFromStorage();
      if (fromStorage) {
        this.currentUserSubject.next(fromStorage);
        return fromStorage;
      }
    }
    return null;
  }

  updateCurrentUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  forceLogout(): void {
    this.clearSession();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

}
