import {Injectable} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {PageResponse} from '../../../shared/models/api-response.model';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {ServiceFee, ServiceFeeCreateResult, ServiceFeeRequest} from '../models/service-fee.model';
import {ServiceFeeFilterRequest} from '../pages/service-fee-filter/service-fee-filter-request';

@Injectable({
  providedIn: 'root'
})
export class ServiceFeeService {

  constructor(private httpService: HttpService) {
  }

  getServiceFeeById(id: string): Observable<ServiceFee> {
    return this.httpService.get<ServiceFee>(
      `${Endpoints.SERVICE_FEES_ENDPOINT}/${id}`,
    );
  }

  getAllServiceFees(page: number = 0, size: number = 10): Observable<PageResponse<ServiceFee>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.httpService.get<PageResponse<ServiceFee>>(
      Endpoints.SERVICE_FEES_ENDPOINT,
      undefined,
      params
    );
  }

  filterServiceFees(request: ServiceFeeFilterRequest): Observable<PageResponse<ServiceFee>> {
    return this.httpService.post<PageResponse<ServiceFee>>(
      `${Endpoints.SERVICE_FEES_ENDPOINT}/filter`,
      request
    );
  }

  createServiceFee(request: ServiceFeeRequest): Observable<ServiceFeeCreateResult> {
    return this.httpService.post<ServiceFeeCreateResult>(
      Endpoints.SERVICE_FEES_ENDPOINT,
      request
    );
  }

  updateServiceFee(id: string, request: ServiceFeeRequest): Observable<ServiceFee> {
    return this.httpService.put<ServiceFee>(
      `${Endpoints.SERVICE_FEES_ENDPOINT}/${id}`,
      request,
    );
  }

  deleteServiceFee(id: string): Observable<string> {
    return this.httpService.delete<string>(
      `${Endpoints.SERVICE_FEES_ENDPOINT}/${id}`,
    );
  }
}

