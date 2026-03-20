import {Observable, of, switchMap, throwError} from 'rxjs';
import {
  HttpClient,
  HttpContext,
  HttpContextToken,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {catchError, map, take} from 'rxjs/operators';
import {ApiResponse} from '../../shared/models/api-response.model';
import {ToastService} from "../../shared/toast/toast.service";
import {Injectable, Injector} from "@angular/core";
import {AuthService} from "../../features/auth/services/auth.service";

export enum RequestType {
  BLOCKING,     // Show spinner and handle error globally (default)
  NON_BLOCKING, // Don't show spinner and ignore any error
  LOCAL,        // Show spinner and handle error locally (component level)
}

export interface RequestOption {
  requestType: RequestType;
}

const defaultRequestOption: RequestOption = {
  requestType: RequestType.BLOCKING,
};

export const REQUEST_TYPE = new HttpContextToken(() => RequestType.BLOCKING);

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  UNPROCESSED_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
}

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  constructor(private http: HttpClient,
              private toastService: ToastService,
              private injector: Injector
  ) {
  }

  // Lazy getter — only resolves AuthService when first needed
  private get authService(): AuthService {
    return this.injector.get(AuthService);
  }

  get<T>(
    url: string,
    headers?: HttpHeaders,
    params?: HttpParams,
    requestOptions?: RequestOption
  ): Observable<T> {
    const apiUrl = this.getApiUrl(url);

    return this.prepareRequestOption(requestOptions).pipe(
      take(1),
      switchMap(httpContext =>
        this.http
          .get<ApiResponse<T>>(apiUrl, {
            headers,
            params,
            context: httpContext,
          })
          .pipe(
            map(response => this.extractData(response)),
            catchError(error => this.handleErrorResponse(error, httpContext)),
          ),
      ),
    );
  }

  post<T>(
    url: string,
    body: any,
    headers?: HttpHeaders,
    requestOptions?: RequestOption,
  ): Observable<T> {
    const apiUrl = this.getApiUrl(url);
    return this.prepareRequestOption(requestOptions).pipe(
      take(1),
      switchMap(httpContext =>
        this.http
          .post<ApiResponse<T>>(apiUrl, body, {
            headers,
            context: httpContext,
          })
          .pipe(
            map(response => this.extractData(response)),
            catchError(error => this.handleErrorResponse(error, httpContext)),
          ),
      ),
    );
  }

  put<T>(
    url: string,
    body: any,
    headers?: HttpHeaders,
    requestOptions?: RequestOption,
  ): Observable<T> {
    const apiUrl = this.getApiUrl(url);
    return this.prepareRequestOption(requestOptions).pipe(
      take(1),
      switchMap(httpContext =>
        this.http
          .put<ApiResponse<T>>(apiUrl, body, {
            headers,
            context: httpContext,
          })
          .pipe(
            map(response => this.extractData(response)),
            catchError(error => this.handleErrorResponse(error, httpContext)),
          ),
      ),
    );
  }

  delete<T>(
    url: string,
    headers?: HttpHeaders,
    requestOptions?: RequestOption
  ): Observable<T> {
    const apiUrl = this.getApiUrl(url);
    return this.prepareRequestOption(requestOptions).pipe(
      take(1),
      switchMap(httpContext =>
        this.http
          .delete<ApiResponse<T>>(apiUrl, {
            headers,
            context: httpContext,
          })
          .pipe(
            map(response => this.extractData(response)),
            catchError(error => this.handleErrorResponse(error, httpContext)),
          ),
      ),
    );
  }

  private extractData<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.message || 'Request failed');
    }
    // For responses without data (like delete), return the message as data
    return (response.data !== undefined ? response.data : response.message) as T;
  }

  private prepareRequestOption(
    requestOption: RequestOption = defaultRequestOption,
  ): Observable<HttpContext> {
    const httpContext: HttpContext = new HttpContext();
    httpContext.set(REQUEST_TYPE, requestOption.requestType);
    return of(httpContext);
  }

  private getApiUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${environment.apiUrl}${url}`;
  }

  private handleErrorResponse(
    error: HttpErrorResponse | any,
    httpContext: HttpContext,
  ): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error instanceof HttpErrorResponse) {
      if (error.error?.error?.message) {
        errorMessage = error.error.error.message;
      } else if (error.error?.validationErrors?.length) {
        errorMessage = error.error.validationErrors
          .map((ve: any) => `${ve.field}: ${ve.message}`)
          .join(', ');
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      if (error.status === HttpStatus.UNAUTHORIZED) {
        this.authService.forceLogout();
        return throwError(() => new Error('Session expired. Please log in again.'));
      }
    }
    this.toastService.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

}
