import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';
import { REQUEST_TYPE, RequestType } from '../services/http.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

  constructor(private loadingService: LoadingService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const requestType = request.context.get(REQUEST_TYPE);

    // Only show loading for BLOCKING and LOCAL requests
    if (requestType === RequestType.BLOCKING || requestType === RequestType.LOCAL) {
      this.loadingService.show();
    }

    return next.handle(request).pipe(
      finalize(() => {
        if (requestType === RequestType.BLOCKING || requestType === RequestType.LOCAL) {
          this.loadingService.hide();
        }
      })
    );
  }
}
