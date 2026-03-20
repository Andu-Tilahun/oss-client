import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { Endpoints } from '../../../core/endpoint/endpoint.model';
import { PageResponse } from '../../../shared/models/api-response.model';
import { PaymentDetail, ProcessPaymentRequest } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor(private httpService: HttpService) {
  }

  getPayments(
    page: number = 0,
    size: number = 10,
    status?: string
  ): Observable<PageResponse<PaymentDetail>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (status) {
      params = params.set('status', status);
    }
    return this.httpService.get<PageResponse<PaymentDetail>>(
      Endpoints.PAYMENTS_ENDPOINT,
      undefined,
      params
    );
  }

  getPaymentById(id: string): Observable<PaymentDetail> {
    return this.httpService.get<PaymentDetail>(
      `${Endpoints.PAYMENTS_ENDPOINT}/${id}`,
    );
  }

  getPaymentByOrderNumber(orderNumber: string): Observable<PaymentDetail | null> {
    return this.httpService.get<PaymentDetail | null>(
      `${Endpoints.PAYMENTS_ENDPOINT}/order/${encodeURIComponent(orderNumber)}`
    );
  }

  processPaymentByOrderNumber(orderNumber: string, request: ProcessPaymentRequest): Observable<PaymentDetail> {
    return this.httpService.post<PaymentDetail>(
      `${Endpoints.PAYMENTS_ENDPOINT}/order/${encodeURIComponent(orderNumber)}/process`,
      request
    );
  }
}
