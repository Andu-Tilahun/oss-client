import {Injectable} from '@angular/core';
import {HttpClient, HttpContext} from '@angular/common/http';
import {BehaviorSubject, catchError, map, Observable, of, tap, throwError} from 'rxjs';
import {Router} from '@angular/router';
import {environment} from '../../../../environments/environment';
import {SKIP_TOKEN_REFRESH} from '../../../core/interceptors/auth-refresh.interceptor';
import {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  SignupRequest,
  User,
  VerifyEmailRequest
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
    private http: HttpClient,
    private router: Router
  ) {
  }

  register(request: RegisterRequest): Observable<ApiResponse<User>> {
    return this.httpService.post<ApiResponse<User>>(
      `${Endpoints.USERS_ENDPOINT}/register`,
      request
    );
  }

  signup(request: SignupRequest): Observable<ApiResponse<User>> {
    return this.httpService.post<ApiResponse<User>>(
      `${Endpoints.USERS_ENDPOINT}/signup`,
      request
    );
  }

  verifyEmail(request: VerifyEmailRequest): Observable<ApiResponse<void>> {
    return this.httpService.post<ApiResponse<void>>(
      `${Endpoints.USERS_ENDPOINT}/verify-email`,
      request
    );
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.httpService
      .post<AuthResponse>(`${Endpoints.AUTH_ENDPOINT}/login`, credentials, undefined, {
        // LoginComponent shows its own "Login Failed" toast; skip HttpService's generic one
        requestType: RequestType.LOCAL,
        skipAuthRedirect: true,
      })
      .pipe(
        tap((authResponse: AuthResponse) => {
          const session = this.normalizeAuthResponse(authResponse);
          this.clearSession();
          this.setSession(session);
          if (session?.user) {
            this.currentUserSubject.next(session.user);
          }
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
        this.router.navigate(['/public']);
      }),
      catchError(error => {
        // Even if logout fails on server, clear local session
        this.clearSession();
        this.currentUserSubject.next(null);
        this.router.navigate(['/public']);
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

  private normalizeAuthResponse(authResponse: AuthResponse | Record<string, unknown> | null | undefined): AuthResponse | null {
    if (!authResponse) {
      return null;
    }

    const raw = authResponse as Record<string, unknown>;
    const token = raw['token'] ?? raw['accessToken'] ?? raw['access_token'];
    const refreshToken = raw['refreshToken'] ?? raw['refresh_token'];
    const user = raw['user'] as User | undefined;

    if (!token && !user) {
      return null;
    }

    return {
      token: token ? this.normalizeToken(String(token)) : '',
      refreshToken: refreshToken ? String(refreshToken) : '',
      type: String(raw['type'] ?? 'Bearer'),
      user: user as User,
    };
  }

  private normalizeToken(token: string): string {
    return token.replace(/^Bearer\s+/i, '').trim();
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

  private notifySessionReady(): void {
    const user = this.getUserFromStorage();
    if (user) {
      this.currentUserSubject.next(user);
    }
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

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
      if (!payload.exp) {
        return true;
      }
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  isSessionValid(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  isAuthenticated(): boolean {
    const user = this.currentUserSubject.value ?? this.getUserFromStorage();
    if (!user) {
      return false;
    }
    if (this.isSessionValid()) {
      return true;
    }
    const refreshToken = this.getRefreshToken();
    return !!refreshToken && !this.isTokenExpired(refreshToken);
  }

  ensureValidSession(): Observable<void> {
    if (this.isSessionValid()) {
      return of(void 0);
    }

    const refreshToken = this.getRefreshToken();
    if (refreshToken && !this.isTokenExpired(refreshToken)) {
      return this.refreshSession().pipe(map(() => void 0));
    }

    return throwError(() => new Error('No valid session'));
  }

  refreshSession(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const context = new HttpContext().set(SKIP_TOKEN_REFRESH, true);

    return this.http
      .post<AuthResponse | ApiResponse<AuthResponse>>(
        `${environment.apiUrl}${Endpoints.AUTH_ENDPOINT}/refresh`,
        {refreshToken},
        {context},
      )
      .pipe(
        map((response) => {
          const payload = (response as ApiResponse<AuthResponse>)?.data ?? response;
          return this.normalizeAuthResponse(payload as AuthResponse) as AuthResponse;
        }),
        tap((session) => {
          this.setSession(session);
          if (session.user) {
            this.currentUserSubject.next(session.user);
          } else {
            this.notifySessionReady();
          }
        }),
        catchError((error) => throwError(() => error)),
      );
  }

  clearSessionSilently(): void {
    this.clearSession();
    this.currentUserSubject.next(null);
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
    this.router.navigate(['/public']);
  }

  isAdmin(): boolean {
    const role = (this.getCurrentUser()?.role ?? '').toString().trim().toUpperCase();
    return role === 'ADMIN';
  }

  isInvestor(): boolean {
    const role = (this.getCurrentUser()?.role ?? '').toString().trim().toUpperCase();
    return role === 'INVESTOR';
  }

  isExtensionWorker(): boolean {
    const role = (this.getCurrentUser()?.role ?? '').toString().trim().toUpperCase();
    return role === 'EXTENSION_WORKER';
  }

}
